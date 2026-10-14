# Update Lore

Triggers: "update Lore", "get the latest version", "pull the latest updates", "am I on the latest version?", or the session-start notify check (below) finding a newer release.

Lore updates as a **package**: users don't need git. Releases are published as **GitHub Releases** on the repository named in `update-channel.json` → `repo` (a fork points this at its own `owner/name`). Each release is a `v<semver>` tag with notes and a versioned zip attached. The zip carries `release-manifest.json`, the complete list of files a release may touch. Personal files (`context.md`, `STATE.md`, `team/`, `stakeholders/`, `inbox/`, `outbox/`, configs) are gitignored at the source so they can never appear in a manifest, and the applier refuses to write anything outside it. Same flow on macOS and Windows.

The local `VERSION` file is the installed version. The newest release tag is the latest release.

## Session-start notify check (cheap, at most once a day)

1. If `inbox/.update-last-check` exists and its timestamp is under 24 hours old, skip.
2. Pick the channel by install type:
   - **Git install** (a `.git` folder exists at the root): `git ls-remote --tags origin`, take the newest `v<semver>` tag. Network failure: skip silently.
   - **Package install** (no `.git`): fetch `https://api.github.com/repos/<repo>/releases/latest` (WebFetch, or `curl -s` in the shell) and take `tag_name` and `body` (the release notes). A 404 (private repo, no access) or no network: skip silently; never block the session on this.
3. Compare that version to `VERSION`. If newer, tell the user in one line: "Lore v<new> is out (<notes if available>). Say 'update' and I'll apply it." Nothing applies without their word. For git installs, "update" routes to the developer path below.
4. Touch `inbox/.update-last-check` (ISO timestamp) either way.

## Applying an update (package path, the default)

1. **Get the package onto the machine.** Download the release's `lore-<version>.zip` asset (`browser_download_url` from the same API response) into `inbox/documents/`. If that fails (a private repo needs a signed-in browser), give the user the release page, `https://github.com/<repo>/releases/latest`, and ask them to download `lore-<version>.zip` and either drop it in `inbox/documents/` or tell you the Downloads path.
2. **Verify and apply:** `python3 scripts/apply-update.py <path-to-zip>`. Run with `--dry-run` first if the user wants to see the plan. The script hash-verifies every file, applies only manifest paths, and deletes only files the previous manifest owned that the new one dropped. If it errors, report verbatim and stop; a failed validation means nothing was changed.
3. **Refresh The Quest Log's page** (only if `context.md` already records a Quest Log URL; otherwise the migration in step 5 creates it) if `templates/action-items-artifact.template.html` or `templates/brand/brand-layer.css` changed in this release: republish the branded copy (`workflows/action-items.md` → "Updating the tracker's page") with the `Artifact` tool, `url` set to the Quest Log URL from `context.md`, a `label` like "Template refresh from Lore v<new>", and **no** `capabilities` field (omitting it keeps the stored `db`/`user`/`downloads` declaration; `{}` would clear it). The user's items live in the tracker's database and are untouched by a republish (`workflows/action-items.md` → "Updating the tracker's page").
4. **Re-orient.** If `CLAUDE.md` or any workflow changed, re-read `CLAUDE.md` before doing anything else this session.
5. **Run pending migrations** per `workflows/migrations.md`: list what is pending in one line each, do the ones that don't ask, and get a yes for the ones that do. A user who isn't ready can say "later"; they are offered again at the next session start.
6. **Report.** Old version → new version, the release notes, and the applier's added/changed/removed summary. Call out loudly anything needing a user action (a new config to fill in, an artifact schema change).

## Fresh installs use the same package

A new user's install is: download the latest `lore-<version>.zip` from the repository's Releases page plus the double-clickable installer for their platform (`Install-Lore-Mac.zip` → run the `.command` inside; `Install-Lore-Windows.bat`), run it, open `~/src/lore` in Cowork, say hello. The installer finds the downloaded zip, unpacks it to the right place, and refuses to touch an existing install (it points at "update Lore" instead). Manual unzip to the same path works identically. Onboarding runs; no git anywhere.

## Developer path (git, optional)

Maintainers and git-comfortable users track the repo directly: `git fetch origin --tags && git merge --ff-only <newest tag> && git submodule update --init`, or `./scripts/update-lore.sh` / `./scripts/update-lore.ps1`. Then continue from step 3 above. If an install has a `.git` folder, always prefer this path; such installs get their session-start update notice from the git tag check. After pulling, run steps 3 to 6 above (refresh the page if the template changed, re-orient, migrations, report).

Note: package installs don't have the `external/skills/` submodule contents unless the release zip was built from a checkout with the submodule initialized; `git ls-files` includes only the submodule pointer, not its files. The wrapped workflows (`grill-me`, `handoff`) already degrade gracefully when it's absent.

## Cutting a release (maintainer only)

`./scripts/make-release.sh <version> "<one-line notes>"` from a clean checkout: stamps `VERSION`, regenerates `release-manifest.json`, builds `dist/lore-<version>.zip` and the two installers, commits, tags, pushes the commit and tag to **every configured remote**, and creates a GitHub Release on each remote's repo with the zip and installers attached when the `gh` CLI is available (each step non-fatal; cross-account releases may need `gh auth switch`). Publishing the GitHub Release is the launch: package installs see it at their next daily check.

Without `gh`, create the Release by hand on the repository's Releases page: tag `v<version>`, the one-line notes, and the files in `dist/` attached.

## What never happens

Never write a path outside the release manifest. Never delete anything the previous manifest didn't own. Never apply a package that fails hash verification. Never `git reset --hard` or `git clean` on a user's install. If anything in an update looks like it would modify a personal file, stop and report instead.
