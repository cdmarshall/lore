#!/usr/bin/env python3
"""Rebuild Lore's two designed guides as PDFs.

  docs/setup-guide.html          -> docs/lore-setup-guide.pdf   (first-time setup)
  docs/grimoire.body.html        -> docs/grimoire.html          (self-contained)
                                 -> docs/lore-grimoire.pdf      (The Keeper's Grimoire,
                                                                 the usage guide)

The setup guide is the style source: its <head> carries the embedded fonts,
tokens and components. The grimoire's editable source holds only page bodies;
this script wraps them in the setup guide's head, so the two books always look
alike and a style change made once reaches both.

    pip install weasyprint --break-system-packages
    python3 scripts/build-guides.py            # both
    python3 scripts/build-guides.py grimoire   # one
    python3 scripts/build-guides.py --check    # verify only, write nothing

Every build checks for overflow. Each .page is a fixed letter-size box with
overflow hidden, so content that doesn't fit is clipped silently rather than
spilling onto a new page: the page count stays the same and the PDF looks
fine until someone reads the bottom of the page. The check measures every
block on every page against the space above the footer and fails the build
(exit 2) naming the page and the block that runs over. Exit 3 means
WeasyPrint isn't importable, so nothing was checked.
"""
import os
import pathlib
import re
import sys


def _ensure_weasyprint():
    """Import WeasyPrint, fixing the macOS library path once if needed.

    On a Mac with Pango from Homebrew, WeasyPrint can't find the native
    libraries unless DYLD_FALLBACK_LIBRARY_PATH points at Homebrew's lib, and
    macOS strips DYLD_* variables whenever a protected binary (bash, the
    /usr/bin/python3 shim) sits in between. So rather than asking the caller to
    set it, re-run this script once with it set.
    """
    try:
        import weasyprint  # noqa: F401
        return True
    except Exception as exc:
        brew_lib = next((d for d in ("/opt/homebrew/lib", "/usr/local/lib") if os.path.isdir(d)), None)
        if sys.platform == "darwin" and brew_lib and not os.environ.get("LORE_GUIDES_REEXEC"):
            env = dict(os.environ, DYLD_FALLBACK_LIBRARY_PATH=brew_lib, LORE_GUIDES_REEXEC="1")
            real_python = os.path.realpath(sys.executable)
            os.execve(real_python, [real_python, os.path.abspath(__file__)] + sys.argv[1:], env)
        print(f"WeasyPrint unavailable ({exc.__class__.__name__}: {exc}); cannot render or check the guides.")
        return False

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"

GRIMOIRE_CSS = """
/* ---- Keeper's Grimoire additions (scripts/build-guides.py) ---- */
.grimoire h1 { font-size: 44pt; line-height: 1; }
.grimoire table.guide { margin: 4pt 0 6pt; }
.grimoire table.guide td { padding: 3.6pt 9pt; font-size: 9.5pt; }
.grimoire table.guide td.say { white-space: normal; }
.grimoire .section-head { margin: 10pt 0 5pt; }
.grimoire .dek { margin-bottom: 8pt; }
.grimoire .page-closing .closing { margin-top: 10pt; }
"""


# Every block must end at least this far above the footer's top edge (CSS px;
# 3px is about 2pt). Callouts are designed to sit snugly above the footer, in
# the bottom padding, so the footer line, not the content edge, is the limit.
FOOTER_CLEARANCE_PX = 3.0


def _text_of(element, limit=60):
    text = " ".join("".join(element.itertext()).split()) if element is not None else ""
    return text if len(text) <= limit else text[: limit - 3] + "..."


def find_overflow(document):
    """Return (page number, overrun in pt, block text) for each clipped block.

    Walks each rendered .page box and compares every in-flow child's bottom
    border edge with the top of the page's footer (.page-foot, absolutely
    positioned). Anything below that line is hidden behind the footer or
    clipped by the page's overflow: hidden. A page without a footer uses its
    bottom edge.
    """
    problems = []
    page_no = 0
    seen = {}  # .page element -> page number of its first fragment
    for rendered in document.pages:
        stack = [rendered._page_box]
        while stack:
            box = stack.pop()
            element = getattr(box, "element", None)
            classes = (element.get("class") or "").split() if element is not None else []
            if "page" in classes and getattr(box, "element_tag", None) == "div":
                if id(element) in seen:
                    # Content too tall to clip split the page across PDF pages.
                    first = seen[id(element)]
                    problems.append((first, 0.0, f"page {first} spills onto an extra PDF page: " + _text_of(element, 40)))
                    continue
                page_no += 1
                seen[id(element)] = page_no
                limit = box.position_y + box.margin_height()
                for child in box.children:
                    child_el = getattr(child, "element", None)
                    if child_el is not None and "page-foot" in (child_el.get("class") or "").split():
                        limit = min(limit, child.position_y)
                limit -= FOOTER_CLEARANCE_PX
                for child in box.children:
                    if type(child).__name__ == "AbsolutePlaceholder":
                        continue
                    if not hasattr(child, "border_height"):
                        continue
                    bottom = child.border_box_y() + child.border_height()
                    if bottom > limit:
                        overrun_pt = (bottom - limit) * 0.75
                        problems.append((page_no, overrun_pt, _text_of(getattr(child, "element", None))))
                continue
            stack.extend(reversed(getattr(box, "children", []) or []))
    return problems


def render(html_path, pdf_path, write=True):
    import weasyprint
    document = weasyprint.HTML(filename=str(html_path)).render()
    problems = find_overflow(document)
    if write:
        document.write_pdf(str(pdf_path))
        print(f"Rendered {pdf_path.relative_to(ROOT)} ({len(document.pages)} pages)")
    if problems:
        print(f"OVERFLOW in {html_path.name}: content is clipped at the bottom of a page.")
        for page_no, overrun_pt, text in problems:
            if overrun_pt:
                print(f"  page {page_no}: ends {overrun_pt:.1f}pt too low (hidden behind the footer or clipped): \"{text}\"")
            else:
                print(f"  {text}")
        print("Trim or merge content on those pages, then rebuild.")
    return not problems


def build_grimoire(write=True):
    setup = (DOCS / "setup-guide.html").read_text(encoding="utf-8")
    end = setup.index("</style>")
    head = setup[:end]
    head = re.sub(r"<title>.*?</title>", "<title>The Keeper's Grimoire</title>", head, count=1)
    head = head.replace(
        "<!-- Lore setup guide. Source of the committed docs/lore-setup-guide.pdf.",
        "<!-- GENERATED by scripts/build-guides.py from docs/grimoire.body.html. Do not edit this file;\n"
        "     edit grimoire.body.html and rebuild. Styles come from docs/setup-guide.html.",
        1,
    )
    body = (DOCS / "grimoire.body.html").read_text(encoding="utf-8")
    html = head + GRIMOIRE_CSS + "</style>\n</head>\n<body class=\"grimoire\">\n" + body + "\n</body>\n</html>\n"
    out = DOCS / "grimoire.html"
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out.relative_to(ROOT)}")
    return render(out, DOCS / "lore-grimoire.pdf", write)


def build_setup(write=True):
    return render(DOCS / "setup-guide.html", DOCS / "lore-setup-guide.pdf", write)


if __name__ == "__main__":
    if not _ensure_weasyprint():
        sys.exit(3)
    args = sys.argv[1:]
    write = "--check" not in args
    which = [a for a in args if not a.startswith("--")] or ["setup", "grimoire"]
    ok = True
    if "setup" in which:
        ok = build_setup(write) and ok
    if "grimoire" in which:
        ok = build_grimoire(write) and ok
    if not ok:
        sys.exit(2)
    print("Overflow check passed: every page fits.")
