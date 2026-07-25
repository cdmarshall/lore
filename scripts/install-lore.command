#!/usr/bin/env bash
# Lore installer (macOS). Double-click to run.
# First time: right-click -> Open (macOS gatekeeps downloaded scripts).
#
# Finds the lore-<version>.zip you already downloaded (next to this file, or
# in ~/Downloads), unpacks it to ~/src/lore, and tells you what to do next.
# If Lore is already installed there, it points you at the update path
# instead of touching anything.
set -euo pipefail

TARGET="$HOME/src/lore"
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "== Lore installer =="
echo

ZIP="$(ls -t "$HERE"/lore-*.zip "$HOME/Downloads"/lore-*.zip 2>/dev/null | head -1 || true)"
if [ -z "$ZIP" ]; then
  echo "No lore-<version>.zip found next to this installer or in your Downloads."
  echo "Download the Lore package first, then run this again."
  echo
  read -r -p "Press Return to close. "
  exit 1
fi

if [ -e "$TARGET/release-manifest.json" ]; then
  echo "Lore is already installed at $TARGET."
  echo "To update it, open Cowork in that folder and say \"update Lore\"."
  echo
  read -r -p "Press Return to close. "
  exit 0
fi

echo "Unpacking $(basename "$ZIP") to $TARGET ..."
mkdir -p "$TARGET"
unzip -q "$ZIP" -d "$TARGET"
chmod +x "$TARGET"/scripts/*.sh "$TARGET"/scripts/*.command 2>/dev/null || true

echo
echo "Done. Next steps:"
echo "  1. Open the Claude desktop app (Cowork)."
echo "  2. Select $TARGET as your working folder."
echo "  3. Say hello. Onboarding starts on its own."
echo
read -r -p "Press Return to close. "
