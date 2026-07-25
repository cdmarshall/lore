# Update Lore

Triggers: "update Lore", "get the latest version", "pull the latest updates", "am I on the latest version?", or the session-start notify check (below) finding a newer release.

Lore updates as a **package**: users don't need git or GitHub. Releases live in a SharePoint folder (`update-channel.json` → `releaseFolderUrl`) as a small feed file (`lore-release.json`) plus a versioned zip. The zip carries `release-manifest.json`, the complete list of files a release may touch. Personal files (`context.md`, `STATE.md`, `team/`, `stakeholders/`, `inbox/`, `outbox/`, configs) are gitignored at the source so they can never appear in a manifest, and the applier refuses to write anything outside it. Same flow on macOS and Windows.

The local `VERSION` file is the installed version. The feed's `version` is the latest release.

## Session-start notify check (cheap, at most once a day)

1. If `inbox/.update-last-check` exists and its timestamp is under 24 hours old, skip.
2. Pick the channel by install type:
   - **Git install** (a `.git` folder exists at the root): `git ls-remote --tags origin`, take the newest `v<semver>` tag. No SharePoint or connector needed, so this works for users outside the org (their git access to the repo is the only requirement). Network failure: skip silently.
   - **Package install** (no `.git`): if the Microsoft 365 connector is available, **list the release folder** (`sharepoint_folder_search` for the folder name, then `read_resource` on the folder URI) and take the latest version from the newest `lore-<version>.zip` filename. This is the authoritative check: folder listings are proven reliable through the connector, while text extraction from file contents is not. Optionally also read `lore-release.json` for the release notes; if its content comes back empty, proceed with the filename-derived version and no notes. No connector, no check; never block the session on this.
3. Compare that version to `VERSION`. If newer, tell the user in one line: "Lore v<new> is out (<notes if available>). Say 'update' and I'll apply it." Nothing applies without their word. For git installs, "update" routes to the developer path below.
4. Touch `inbox/.update-last-check` (ISO timestamp) either way.

## Applying an update (package path, the default)

1. **Get the package onto the machine.** In order of preference:
   - Try fetching the zip through the Microsoft 365 connector. If the connector can't deliver the binary (common), fall back to:
   - Give the user the release-folder link from `update-channel.json` and ask them to download `lore-<version>.zip` (their browser is already signed into SharePoint) and either drop it in `inbox/documents/` or tell you the Downloads path.
2. **Verify and apply:** `python3 scripts/apply-update.py <path-to-zip>`. Run with `--dry-run` first if the user wants to see the plan. The script hash-verifies every file, applies only manifest paths, and deletes only files the previous manifest owned that the new one dropped. If it errors, report verbatim and stop; a failed validation means nothing was changed.
3. **Refresh The Quest Log** so the artifact picks up any template changes: `node scripts/build-action-items-artifact.js '[]'` then `mcp__cowork__update_artifact(id="the-quest-log", html_path="outbox/action-items-artifact-built.html", mcp_tools=[], update_summary="Template refresh from Lore v<new>")`. A `[]` seed is a no-op push; the user's items live in the artifact's IndexedDB and are untouched.
4. **Re-orient.** If `CLAUDE.md` or any workflow changed, re-read `CLAUDE.md` before doing anything else this session.
5. **Report.** Old version → new version, the feed's release notes, and the applier's added/changed/removed summary. Call out loudly anything needing a user action (a new config to fill in, an artifact schema change).

## Fresh installs use the same package

A new user's install is: download the latest `lore-<version>.zip` from the release folder plus the double-clickable installer for their platform (`Install-Lore-Mac.zip` → run the `.command` inside; `Install-Lore-Windows.bat`), run it, open `~/src/lore` in Cowork, say hello. The installer finds the downloaded zip, unpacks it to the right place, and refuses to touch an existing install (it points at "update Lore" instead). Manual unzip to the same path works identically. Onboarding runs; no git anywhere.

## Developer path (git, optional)

Maintainers, git-comfortable users, and anyone outside the org (no SharePoint access) track the repo directly (`update-channel.json` → `developerGitRemote`): `git fetch origin --tags && git merge --ff-only <newest tag> && git submodule update --init`, or `./scripts/update-lore.sh` / `./scripts/update-lore.ps1`. Then continue from step 3 above. If an install has a `.git` folder, always prefer this path; such installs also get their session-start update notice from the git tag check rather than SharePoint, so git-only users are fully self-sufficient.

Note: package installs don't have the `external/skills/` submodule contents unless the release zip was built from a checkout with the submodule initialized; `git ls-files` includes only the submodule pointer, not its files. The wrapped workflows (`grill-me`, `handoff`) already degrade gracefully when it's absent.

## Cutting a release (maintainer only)

`./scripts/make-release.sh <version> "<one-line notes>"` from a clean checkout: stamps `VERSION`, regenerates `release-manifest.json`, builds `dist/lore-<version>.zip` + `dist/lore-release.json`, commits, tags, pushes the commit and tag to **every configured remote**, and creates a GitHub Release with the zip attached on each remote's repo when the `gh` CLI is available (each step non-fatal; cross-account releases may need `gh auth switch`).

**Channel privacy:** the committed `update-channel.json` is an org-agnostic placeholder. The maintainer keeps the real values in the gitignored `update-channel.local.json`; make-release injects that into the zip as `update-channel.json` (and hashes it in the manifest), so package installs receive the real channel while no git remote ever carries the org's URLs. A maintainer on a fresh clone recreates the local file from the placeholder's shape before cutting a release. Then upload both dist files to the SharePoint release folder (overwrite the feed file, keep old zips for rollback); that upload is what actually launches the release to users.

## What never happens

Never write a path outside the release manifest. Never delete anything the previous manifest didn't own. Never apply a package that fails hash verification. Never `git reset --hard` or `git clean` on a user's install. If anything in an update looks like it would modify a personal file, stop and report instead.
