#!/usr/bin/env bash
# Cut a Lore release package. Maintainer-only (requires git); end users never
# run this. Produces everything you upload to the SharePoint release folder.
#
# Usage:
#   ./scripts/make-release.sh 1.1.0 "One-line release notes"
#
# What it does:
#   1. Stamps VERSION with the new version.
#   2. Regenerates release-manifest.json: every committed file (git ls-files)
#      with its sha256. This manifest is the contract of what an update is
#      allowed to touch on a user's machine; personal gitignored files can
#      never appear in it.
#   3. Builds dist/lore-<version>.zip containing exactly those files.
#   4. Writes dist/lore-release.json (the feed users' installs check).
#   5. Commits the VERSION/manifest bump and tags v<version>.
#
#   6. Pushes the commit and the tag, and (if the GitHub CLI is installed and
#      authenticated) creates a GitHub Release with the zip attached.
#
# Then: upload dist/lore-<version>.zip and dist/lore-release.json to the
# SharePoint folder named in update-channel.json (overwrite the old feed
# file; leave old zips around for rollback). That upload is the launch.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION_NEW="${1:?Usage: make-release.sh <version> \"<notes>\"}"
NOTES="${2:?Usage: make-release.sh <version> \"<notes>\"}"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit or stash first; the release must match a commit."
  exit 1
fi

echo "$VERSION_NEW" > VERSION

python3 - "$VERSION_NEW" "$NOTES" <<'PY'
import hashlib, json, os, subprocess, sys, zipfile, datetime

version, notes = sys.argv[1], sys.argv[2]
files = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout.split("\n")
files = [f for f in files if f and f != "release-manifest.json" and os.path.isfile(f)]
if "VERSION" not in files:
    files.append("VERSION")

manifest = {"version": version, "files": {}}
for f in sorted(files):
    with open(f, "rb") as fh:
        manifest["files"][f] = hashlib.sha256(fh.read()).hexdigest()

with open("release-manifest.json", "w") as fh:
    json.dump(manifest, fh, indent=1, sort_keys=True)
    fh.write("\n")

os.makedirs("dist", exist_ok=True)
zip_name = f"lore-{version}.zip"
with zipfile.ZipFile(os.path.join("dist", zip_name), "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(files):
        z.write(f)
    z.write("release-manifest.json")

feed = {
    "version": version,
    "date": datetime.date.today().isoformat(),
    "notes": notes,
    "zipName": zip_name,
}
with open(os.path.join("dist", "lore-release.json"), "w") as fh:
    json.dump(feed, fh, indent=2)
    fh.write("\n")

print(f"Manifest: {len(manifest['files'])} committed files")
print(f"Package:  dist/{zip_name}")
print(f"Feed:     dist/lore-release.json")
PY

git add VERSION release-manifest.json
git commit -m "Release v${VERSION_NEW}: ${NOTES}"
git tag "v${VERSION_NEW}"

echo
echo "Pushing commit and tag..."
git push
git push origin "v${VERSION_NEW}"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "Creating GitHub Release v${VERSION_NEW}..."
  gh release create "v${VERSION_NEW}" "dist/lore-${VERSION_NEW}.zip" \
    --title "v${VERSION_NEW}" --notes "${NOTES}" \
    || echo "GitHub Release creation failed (non-fatal); create it manually if you want one."
else
  echo "GitHub CLI (gh) not available or not authenticated; skipped the GitHub Release."
  echo "The tag is pushed either way. Create a Release later with:"
  echo "  gh release create v${VERSION_NEW} dist/lore-${VERSION_NEW}.zip --title v${VERSION_NEW} --notes \"${NOTES}\""
fi

echo
echo "Done. Last step (this is the launch):"
echo "  Upload dist/lore-${VERSION_NEW}.zip AND dist/lore-release.json to the"
echo "  SharePoint folder in update-channel.json (overwrite lore-release.json)."
