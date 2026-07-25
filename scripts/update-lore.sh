#!/usr/bin/env bash
# Update Lore to the latest release (newest git tag; falls back to origin/main).
# Personal files are gitignored, so updating never touches your context, team
# pages, inbox, or outbox. Full procedure and edge cases: workflows/update.md.
#
# Usage:
#   ./scripts/update-lore.sh          # newest tag (recommended)
#   ./scripts/update-lore.sh main     # tip of main instead
set -euo pipefail
cd "$(dirname "$0")/.."

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This folder isn't a git clone (probably installed from a zip)."
  echo "Open Cowork in this folder and say \"update Lore\"; the agent can convert it safely."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "You have local edits to Lore's committed files:"
  git status --short
  echo
  echo "Stash them first (git stash), or ask Lore to walk you through it (\"update Lore\")."
  exit 1
fi

before=$(git describe --tags --always)
git fetch origin --tags --prune

if [ "${1:-}" = "main" ]; then
  target="origin/main"
else
  target=$(git tag --sort=-creatordate | head -1)
  [ -z "$target" ] && target="origin/main"
fi

git merge --ff-only "$target"
git submodule update --init
after=$(git describe --tags --always)

echo
echo "Updated: $before -> $after"
echo "Next time you're in Cowork, say \"update Lore\" so the agent refreshes The Quest Log with the latest template."
