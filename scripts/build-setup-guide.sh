#!/usr/bin/env bash
# Rebuild docs/lore-setup-guide.pdf from docs/setup-guide.html.
#
# The HTML is self-contained (fonts, dither tiles, and the sprite signet are
# inlined as data URIs), so the only dependency is WeasyPrint:
#   pip install weasyprint --break-system-packages
#
# Run from the repo root:
#   ./scripts/build-setup-guide.sh
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m weasyprint docs/setup-guide.html docs/lore-setup-guide.pdf
echo "Rebuilt docs/lore-setup-guide.pdf"
