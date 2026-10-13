#!/usr/bin/env python3
"""Render a Lore HTML document (templates/document.template.html output) to PDF.

WeasyPrint has no flexbox or grid support, so the design system's flex and grid
containers collapse without help: .section-head flexes its label and count, and
.stat-row is a grid. Left alone, every section heading wraps after its first
word and the stat tiles stack full width. This script injects a print
stylesheet that lays both out with block and inline-block instead, then renders.

    pip install weasyprint --break-system-packages
    python3 scripts/render-doc-pdf.py outbox/<doc>.html [out.pdf]

The source HTML is never modified.
"""
import pathlib
import subprocess
import sys
import tempfile

PRINT_CSS = """
  /* ---- print layer, added by scripts/render-doc-pdf.py ---- */
  @page { size: Letter; margin: 15mm 14mm 16mm; }
  @media print {
    body { background: #fff; }
    .sheet { max-width: none; padding: 0; }

    /* WeasyPrint has no flex: keep headings on one line. */
    .section-head { display: block; }
    .section-head .sh-label { display: inline; }
    .section-head .count { display: inline-block; margin-left: 8px; vertical-align: 2px; }

    /* WeasyPrint has no grid: tile the stat row by hand. */
    .stat-row { display: block; font-size: 0; }
    .stat { display: inline-block; width: 48%; margin: 0 1% 8px 0; vertical-align: top; font-size: initial; }
    .card-grid .card-row { display: block; }
    .card-grid .card { display: inline-block; width: 48.5%; margin-right: 1%; vertical-align: top; }

    /* Keep blocks whole across page breaks. */
    h1, h2, h3, .section-head { break-after: avoid; }
    .card, .callout, .stat, .talk, table.doc thead { break-inside: avoid; }
    table.doc tr, ul.checklist li { break-inside: avoid; }
    .sig, .foot { break-before: avoid; }

    /* Tighter vertical rhythm on paper. */
    .dek { margin: 14px 0 22px; }
    .section { margin-bottom: 22px; }
    .section-head { margin-bottom: 10px; }

    /* Screenshots: cap the height so a figure fits beside surrounding text
       instead of jumping a page and leaving a gap above it. */
    .figure { margin: 4px 0 10px; }
    .figure img { width: auto; max-width: 100%; max-height: 95mm; }
  }
"""


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = pathlib.Path(sys.argv[1])
    out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_suffix(".pdf")
    html = src.read_text()
    if html.count("</style>") != 1:
        sys.exit(f"{src}: expected exactly one </style>, found {html.count('</style>')}")
    html = html.replace("</style>", PRINT_CSS + "</style>")

    with tempfile.TemporaryDirectory() as tmp:
        staged = pathlib.Path(tmp) / src.name
        staged.write_text(html)
        subprocess.run(
            [sys.executable, "-m", "weasyprint", str(staged), str(out)],
            check=True,
            stderr=subprocess.DEVNULL,   # HarfBuzz-Subset advisories only
        )
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
