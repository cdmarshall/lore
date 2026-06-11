#!/usr/bin/env bash
set -euo pipefail

# Pull the latest upstream commit of the external skills submodule
# (https://github.com/mattpocock/skills) and show what changed, so the
# update is a deliberate, reviewable act rather than a silent drift.
#
# Usage: ./scripts/update-external-skills.sh
# After reviewing the diff summary, commit the submodule pointer bump:
#   git add external/skills && git commit -m "Bump external/skills to latest upstream"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUBMODULE="external/skills"

cd "$REPO_ROOT"

OLD_SHA="$(git -C "$SUBMODULE" rev-parse HEAD)"
git submodule update --remote "$SUBMODULE"
NEW_SHA="$(git -C "$SUBMODULE" rev-parse HEAD)"

if [ "$OLD_SHA" = "$NEW_SHA" ]; then
  echo "Already up to date ($NEW_SHA)."
  exit 0
fi

echo "Updated $SUBMODULE: $OLD_SHA -> $NEW_SHA"
echo
echo "Upstream changes:"
git -C "$SUBMODULE" log --oneline "$OLD_SHA..$NEW_SHA"
echo
echo "Files changed:"
git -C "$SUBMODULE" diff --stat "$OLD_SHA" "$NEW_SHA"
echo
echo "Review the changes above, then commit the pointer bump:"
echo "  git add $SUBMODULE && git commit -m \"Bump external/skills to latest upstream\""
