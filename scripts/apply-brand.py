#!/usr/bin/env python3
"""Apply the user's brand pack to a Lore HTML output.

Lore's designed surfaces (the signed document, The Herald, the action-items
tracker) ship in Lore's own design system. A brand pack in brand/ (gitignored,
one per install) restyles them for the user's company or org. This script is
the only place a brand gets applied, so every surface themes the same way.

    python3 scripts/apply-brand.py <file.html>            # in place
    python3 scripts/apply-brand.py <in.html> -o <out.html>
    python3 scripts/apply-brand.py --check                # report the pack, change nothing
    python3 scripts/apply-brand.py <file.html> --artifact <out.artifact.html> [--title "<Name> 1:1 Prep"]
        also writes the hosted-artifact copy for the Artifact tool: no doctype,
        html, head or body wrapper; <title>, every <style> and the body content
        kept, so the published page carries the brand too

No brand pack (no brand/brand.json, or "enabled": false) means no change: the
file is left byte-for-byte as it was and the script exits 0. Running it twice is
safe; a second run replaces the first run's injection.

What it does, driven by brand/brand.json (schema: templates/brand/brand.template.json):
  1. Replaces the <!--lore:brand-style--> marker each template carries right
     after its main <style> with <style id="lore-brand">: the committed
     mapping layer (templates/brand/brand-layer.css), then brand/brand.css,
     with every url(...) that points at a file inside brand/ (fonts, images)
     inlined as a data URI so the output stays self-contained.
  2. Replaces the <!--lore:brand-logo--> marker with the logo <img>, inlined.
  3. Retitles surfaces: an element with data-lore-title="<surface>" gets
     titles.<surface>.title as its text; titles.<surface>.subtitle goes into
     the element with data-lore-subtitle="<surface>" if there is one, or a
     <div class="brand-byline"> placed right after the title element. A
     <title> containing the original title text is retitled too.
  4. If the page uses LoreCharts, injects window.LORE_BRAND = {charts: ...}
     ahead of it so design-system/charts/chart-theme.js picks up brand colors.

Lore's signet and the "Made by Lore" attribution are never removed: a brand
changes how Lore's work looks, not who made it.
"""
import argparse
import base64
import html
import json
import mimetypes
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND_DIR = ROOT / "brand"
LAYER_CSS = ROOT / "templates" / "brand" / "brand-layer.css"
STYLE_MARK = "<!--lore:brand-style-->"
LOGO_MARK = "<!--lore:brand-logo-->"
STYLE_RE = re.compile(r'<style id="lore-brand">.*?</style>\s*', re.S)
SCRIPT_RE = re.compile(r'<script id="lore-brand-data">.*?</script>\s*', re.S)
LOGO_RE = re.compile(r'<img class="brand-logo"[^>]*>')
BYLINE_RE = re.compile(r'<div class="brand-byline"[^>]*>.*?</div>')
TOKEN_RE = re.compile(r"<!--.*?-->|<(style|script)\b[^>]*>.*?</\1\s*>", re.S)
LOGO_FALLBACK_PX = 28  # used only if the brand stylesheet never loads


MIME = {".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf",
        ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".webp": "image/webp", ".gif": "image/gif"}


def scan(doc):
    """Comments and <style>/<script> blocks in document order, the way a browser
    reads them: a "<script>" mentioned inside a comment opens nothing, and a
    marker quoted inside a comment or a stylesheet is not a marker."""
    return [(("raw" if m.group(1) else "comment"), m.span(), m.group(0)) for m in TOKEN_RE.finditer(doc)]


def mark_spans(doc, mark):
    return [span for kind, span, text in scan(doc) if kind == "comment" and text == mark]


def has_mark(doc, mark):
    return bool(mark_spans(doc, mark))


def fill_mark(doc, mark, repl, count=0):
    spans = mark_spans(doc, mark)
    if count:
        spans = spans[:count]
    for a, b in reversed(spans):
        doc = doc[:a] + repl + doc[b:]
    return doc


def in_comment(doc, pos):
    return any(kind == "comment" and a <= pos < b for kind, (a, b), _ in scan(doc))


def load_pack():
    cfg_path = BRAND_DIR / "brand.json"
    if not cfg_path.is_file():
        return None
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    if cfg.get("enabled") is False:
        return None
    return cfg


def data_uri(path):
    mime = MIME.get(path.suffix.lower()) or mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def inline_urls(css):
    def repl(m):
        raw = m.group(2).strip()
        if raw.startswith(("data:", "http:", "https:", "#", "var(")):
            return m.group(0)
        target = (BRAND_DIR / raw).resolve()
        if BRAND_DIR.resolve() not in target.parents or not target.is_file():
            sys.exit(f"apply-brand: brand.css points at {raw!r}, which is not a file inside brand/")
        return f'url("{data_uri(target)}")'
    return re.sub(r'url\(\s*(["\']?)([^"\')]+)\1\s*\)', repl, css)


def build_style(cfg):
    layer = LAYER_CSS.read_text(encoding="utf-8")
    css_file = BRAND_DIR / cfg.get("css", "brand.css")
    css = css_file.read_text(encoding="utf-8") if css_file.is_file() else ""
    name = cfg.get("name", "brand")
    return (f'<style id="lore-brand">\n{layer}\n'
            f'/* ---- Brand pack: {name} (brand/brand.css) ---- */\n{inline_urls(css)}\n</style>\n')


def build_logo(cfg):
    logo = cfg.get("logo") or {}
    f = logo.get("file")
    if not f:
        return ""
    p = (BRAND_DIR / f)
    if not p.is_file():
        sys.exit(f"apply-brand: logo file brand/{f} is missing")
    alt = html.escape(logo.get("alt", cfg.get("name", "")), quote=True)
    return (f'<img class="brand-logo" src="{data_uri(p)}" alt="{alt}" '
            f'height="{LOGO_FALLBACK_PX}">')


def retitle(doc, cfg):
    for surface, spec in (cfg.get("titles") or {}).items():
        if isinstance(spec, str):
            spec = {"title": spec}
        title = spec.get("title")
        sub = spec.get("subtitle")
        pat = re.compile(r'(<(h1|h2|div|span)\b[^>]*\bdata-lore-title="%s"[^>]*>)(.*?)(</\2>)' % re.escape(surface), re.S)
        m = pat.search(doc)
        if not m:
            continue
        old_text = re.sub(r"<[^>]+>", "", m.group(3)).strip()
        if title:
            doc = doc[:m.start()] + m.group(1) + html.escape(title) + m.group(4) + doc[m.end():]
            if old_text:
                doc = re.sub(r"(<title>)%s(</title>)" % re.escape(old_text), r"\g<1>" + html.escape(title).replace("\\", "\\\\") + r"\g<2>", doc, count=1)
        if sub:
            sub_pat = re.compile(r'(<(div|span|p)\b[^>]*\bdata-lore-subtitle="%s"[^>]*>)(.*?)(</\2>)' % re.escape(surface), re.S)
            sm = sub_pat.search(doc)
            if sm:
                doc = doc[:sm.start()] + sm.group(1) + html.escape(sub) + sm.group(4) + doc[sm.end():]
            else:
                m = pat.search(doc)
                doc = doc[:m.end()] + f'<div class="brand-byline">{html.escape(sub)}</div>' + doc[m.end():]
    return doc


def apply(doc, cfg):
    # Undo a previous run so the result is the same however many times it runs.
    doc = STYLE_RE.sub(STYLE_MARK + "\n", doc, count=1) if not has_mark(doc, STYLE_MARK) else STYLE_RE.sub("", doc)
    doc = SCRIPT_RE.sub("", doc)
    doc = LOGO_RE.sub(LOGO_MARK, doc) if not has_mark(doc, LOGO_MARK) else LOGO_RE.sub("", doc)
    doc = BYLINE_RE.sub("", doc)

    if not has_mark(doc, STYLE_MARK):
        # Older outputs without the marker: put the brand style after the last </style>.
        i = doc.rfind("</style>")
        if i < 0:
            sys.exit("apply-brand: no <style> block and no brand marker; is this a Lore template output?")
        doc = doc[: i + 8] + "\n" + STYLE_MARK + doc[i + 8:]

    extra = build_style(cfg)
    charts = cfg.get("charts")
    if charts and "LoreCharts" in doc:
        extra += '<script id="lore-brand-data">window.LORE_BRAND = %s;</script>\n' % json.dumps({"charts": charts})
    doc = fill_mark(doc, STYLE_MARK, extra.rstrip("\n"), count=1)
    logo = build_logo(cfg)
    if logo:
        doc = fill_mark(doc, LOGO_MARK, logo)
    doc = retitle(doc, cfg)

    # Verify: the brand stylesheet must be live, not commented out.
    i = doc.find('<style id="lore-brand">')
    if i < 0 or in_comment(doc, i):
        sys.exit("apply-brand: brand stylesheet did not land outside a comment; output not written")
    for kind, _, text in scan(doc):
        if kind == "raw" and '<img class="brand-logo"' in text:
            sys.exit("apply-brand: a brand logo landed inside a <style> or <script> block; output not written")
    return doc


def artifact_copy(doc, title=None):
    """Hosted-artifact shape: drop the doctype/html/head/body wrapper, keep the rest."""
    head = re.search(r"<head[^>]*>(.*?)</head>", doc, re.S)
    body = re.search(r"<body[^>]*>(.*)</body>", doc, re.S)
    if not head or not body:
        return doc  # already in hosted shape (the action-items template is)
    keep = re.findall(r"<style\b[^>]*>.*?</style>|<script\b[^>]*>.*?</script>", head.group(1), re.S)
    t = title or (re.search(r"<title>(.*?)</title>", head.group(1), re.S) or [None, ""])[1]
    return f"<title>{html.escape(t) if title else t}</title>\n" + "\n".join(keep) + "\n" + body.group(1).strip() + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("file", nargs="?")
    ap.add_argument("-o", "--out")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--artifact", help="also write the hosted-artifact copy here")
    ap.add_argument("--title", help="<title> for the artifact copy")
    a = ap.parse_args()

    cfg = load_pack()
    if a.check:
        if not cfg:
            print("No brand pack: outputs use Lore's own design system.")
        else:
            build_style(cfg); build_logo(cfg)
            fonts = sorted(p.name for p in (BRAND_DIR / "fonts").glob("*")) if (BRAND_DIR / "fonts").is_dir() else []
            print(f"Brand pack: {cfg.get('name')} | logo: {(cfg.get('logo') or {}).get('file', 'none')} | "
                  f"fonts: {len(fonts)} | titles: {', '.join(cfg.get('titles', {})) or 'unchanged'} | "
                  f"charts: {'yes' if cfg.get('charts') else 'no'}")
        return
    if not a.file:
        ap.error("give a file, or --check")
    src = pathlib.Path(a.file)
    out = pathlib.Path(a.out) if a.out else src
    doc = src.read_text(encoding="utf-8")
    if cfg:
        doc = apply(doc, cfg)
    if out != src or cfg:
        out.write_text(doc, encoding="utf-8")
    print(f"apply-brand: {'branded as ' + cfg.get('name', 'brand') if cfg else 'no brand pack, unchanged'} -> {out}")
    if a.artifact:
        pathlib.Path(a.artifact).write_text(artifact_copy(doc, a.title), encoding="utf-8")
        print(f"apply-brand: artifact copy -> {a.artifact}")


if __name__ == "__main__":
    main()
