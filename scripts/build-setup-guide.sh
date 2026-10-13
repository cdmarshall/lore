#!/usr/bin/env bash
# Rebuild both designed guides: docs/lore-setup-guide.pdf and
# docs/lore-grimoire.pdf (The Keeper's Grimoire). Kept as the familiar entry
# point; the work happens in scripts/build-guides.py.
#   pip install weasyprint --break-system-packages
#   ./scripts/build-setup-guide.sh
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/build-guides.py "$@"
