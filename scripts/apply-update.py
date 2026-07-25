#!/usr/bin/env python3
"""Apply a Lore release package to this install. No git required.

Usage:
  python3 scripts/apply-update.py <path-to-lore-x.y.z.zip> [--dry-run] [--force]

Safety model:
  - The zip carries release-manifest.json: the complete list of files the
    release is allowed to place, with sha256 hashes. Personal files
    (context.md, STATE.md, team/, inbox/, outbox/, configs, ...) are
    gitignored at the source, so they can never appear in a manifest, and
    this script refuses to write any path that isn't in the new manifest.
  - Files that existed in the PREVIOUS release (local release-manifest.json)
    but are gone from the new one are deleted; nothing else is ever removed.
  - Every file is hash-verified against the manifest before anything is
    written; a corrupt or tampered package aborts with no changes.
  - Paths are validated against zip-slip (no absolute paths, no "..").

Exit codes: 0 applied (or dry-run ok), 1 nothing to do, 2 validation error.
"""
import hashlib, json, os, shutil, sys, tempfile, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def fail(msg):
    print(f"ERROR: {msg}")
    sys.exit(2)

def parse_version(v):
    try:
        return tuple(int(x) for x in v.strip().split("."))
    except ValueError:
        return (0,)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    if len(args) != 1:
        fail("usage: apply-update.py <lore-x.y.z.zip> [--dry-run] [--force]")
    zip_path = args[0]
    dry_run = "--dry-run" in flags
    force = "--force" in flags

    if not os.path.isfile(zip_path):
        fail(f"package not found: {zip_path}")

    with zipfile.ZipFile(zip_path) as z:
        names = set(z.namelist())
        if "release-manifest.json" not in names:
            fail("not a Lore release package (release-manifest.json missing)")
        manifest = json.loads(z.read("release-manifest.json"))
        new_version = manifest.get("version", "")
        new_files = manifest.get("files", {})

        # Local state
        local_version = "0.0.0"
        vpath = os.path.join(ROOT, "VERSION")
        if os.path.isfile(vpath):
            local_version = open(vpath).read().strip()
        old_manifest_path = os.path.join(ROOT, "release-manifest.json")
        old_files = {}
        if os.path.isfile(old_manifest_path):
            try:
                old_files = json.load(open(old_manifest_path)).get("files", {})
            except Exception:
                old_files = {}

        if parse_version(new_version) <= parse_version(local_version) and not force:
            print(f"Already on {local_version}; package is {new_version}. Nothing to do (use --force to reapply).")
            sys.exit(1)

        # Validate every manifest path and hash before touching anything.
        for rel in list(new_files) + ["release-manifest.json"]:
            if rel.startswith("/") or ".." in rel.split("/"):
                fail(f"unsafe path in package: {rel}")
        missing = [f for f in new_files if f not in names]
        if missing:
            fail(f"package is missing {len(missing)} manifest file(s), e.g. {missing[0]}")
        for rel, want in new_files.items():
            got = hashlib.sha256(z.read(rel)).hexdigest()
            if got != want:
                fail(f"hash mismatch for {rel}; refusing to apply a corrupt package")

        # Plan
        changed, added = [], []
        for rel, want in new_files.items():
            dest = os.path.join(ROOT, rel)
            if not os.path.isfile(dest):
                added.append(rel)
            elif hashlib.sha256(open(dest, "rb").read()).hexdigest() != want:
                changed.append(rel)
        removed = [f for f in old_files if f not in new_files and os.path.isfile(os.path.join(ROOT, f))]

        print(f"Update {local_version} -> {new_version}: {len(added)} added, {len(changed)} changed, {len(removed)} removed, {len(new_files) - len(added) - len(changed)} unchanged.")
        for r in added:   print(f"  + {r}")
        for r in changed: print(f"  ~ {r}")
        for r in removed: print(f"  - {r}")
        if dry_run:
            print("Dry run; nothing written.")
            return

        # Apply: extract to temp, then move into place.
        with tempfile.TemporaryDirectory() as tmp:
            for rel in list(new_files) + ["release-manifest.json"]:
                z.extract(rel, tmp)
                dest = os.path.join(ROOT, rel)
                os.makedirs(os.path.dirname(dest) or ROOT, exist_ok=True)
                shutil.copyfile(os.path.join(tmp, rel), dest)
        for rel in removed:
            os.remove(os.path.join(ROOT, rel))

    print(f"Applied {new_version}. Personal files untouched (only manifest paths were written).")

if __name__ == "__main__":
    main()
