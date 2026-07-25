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

# The committed update-channel.json is an org-agnostic placeholder. If the
# gitignored update-channel.local.json exists, its contents ship in the
# package as update-channel.json (and are hashed in the manifest), so package
# installs get the real channel while the git repo never carries it.
overrides = {}
if os.path.exists("update-channel.local.json"):
    with open("update-channel.local.json", "rb") as fh:
        overrides["update-channel.json"] = fh.read()
    print("Injecting update-channel.local.json as the package's update-channel.json")

def content_of(f):
    if f in overrides:
        return overrides[f]
    with open(f, "rb") as fh:
        return fh.read()

manifest = {"version": version, "files": {}}
for f in sorted(files):
    manifest["files"][f] = hashlib.sha256(content_of(f)).hexdigest()

with open("release-manifest.json", "w") as fh:
    json.dump(manifest, fh, indent=1, sort_keys=True)
    fh.write("\n")

os.makedirs("dist", exist_ok=True)
zip_name = f"lore-{version}.zip"
with zipfile.ZipFile(os.path.join("dist", zip_name), "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(files):
        if f in overrides:
            z.writestr(f, overrides[f])
        else:
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

# Double-clickable installers ship alongside the package. The Mac .command
# travels inside a small zip so its executable bit survives the browser
# download (Archive Utility restores it on extraction); the .bat needs no
# such care.
cp scripts/install-lore.bat "dist/Install-Lore-Windows.bat"
python3 - <<'PY'
import zipfile
zi = zipfile.ZipInfo("Install Lore (Mac).command")
zi.external_attr = 0o755 << 16
with zipfile.ZipFile("dist/Install-Lore-Mac.zip", "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr(zi, open("scripts/install-lore.command", "rb").read())
print("Installers: dist/Install-Lore-Mac.zip, dist/Install-Lore-Windows.bat")
PY

echo
echo "Pushing commit and tag to every remote..."
for r in $(git remote); do
  echo "  -> ${r}"
  git push "$r" HEAD || echo "  push to ${r} failed (non-fatal); push manually: git push ${r} HEAD"
  git push "$r" "v${VERSION_NEW}" || echo "  tag push to ${r} failed (non-fatal); push manually: git push ${r} v${VERSION_NEW}"
done

# Derive OWNER/REPO from a remote URL (handles SSH host aliases like
# git@github-work:Org/repo.git and https URLs alike).
repo_slug() {
  git remote get-url "$1" | sed -E 's#^(git@[^:]+:|ssh://git@[^/]+/|https://[^/]+/)##; s#\.git$##'
}

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  for r in $(git remote); do
    slug=$(repo_slug "$r")
    echo "Creating GitHub Release v${VERSION_NEW} on ${slug} (remote: ${r})..."
    gh release create "v${VERSION_NEW}" "dist/lore-${VERSION_NEW}.zip" \
      --repo "$slug" --title "v${VERSION_NEW}" --notes "${NOTES}" \
      || echo "  Release on ${slug} failed (non-fatal). If it's a different GitHub account, run: gh auth switch, then: gh release create v${VERSION_NEW} dist/lore-${VERSION_NEW}.zip --repo ${slug} --title v${VERSION_NEW} --notes \"${NOTES}\""
  done
else
  echo "GitHub CLI (gh) not available or not authenticated; skipped GitHub Releases."
  echo "Tags are pushed either way. Create a Release later per remote with:"
  echo "  gh release create v${VERSION_NEW} dist/lore-${VERSION_NEW}.zip --repo <owner/repo> --title v${VERSION_NEW} --notes \"${NOTES}\""
fi

echo
echo "Done. Last step (this is the launch):"
echo "  Upload everything in dist/ to the SharePoint release folder"
echo "  (lore-${VERSION_NEW}.zip, lore-release.json overwriting the old one,"
echo "  and the two Install-Lore-* installers)."
