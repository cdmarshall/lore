# Update Lore to the latest release (newest git tag; falls back to origin/main).
# Personal files are gitignored, so updating never touches your context, team
# pages, inbox, or outbox. Full procedure and edge cases: workflows/update.md.
#
# Usage (from anywhere):
#   ./scripts/update-lore.ps1          # newest tag (recommended)
#   ./scripts/update-lore.ps1 main     # tip of main instead
param([string]$Target = "")
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "This folder isn't a git clone (probably installed from a zip)."
    Write-Host "Open Cowork in this folder and say `"update Lore`"; the agent can convert it safely."
    exit 1
}

if (git status --porcelain) {
    Write-Host "You have local edits to Lore's committed files:"
    git status --short
    Write-Host ""
    Write-Host "Stash them first (git stash), or ask Lore to walk you through it (`"update Lore`")."
    exit 1
}

$before = git describe --tags --always
git fetch origin --tags --prune

if ($Target -eq "main") {
    $target = "origin/main"
} else {
    $target = (git tag --sort=-creatordate | Select-Object -First 1)
    if (-not $target) { $target = "origin/main" }
}

git merge --ff-only $target
git submodule update --init
$after = git describe --tags --always

Write-Host ""
Write-Host "Updated: $before -> $after"
Write-Host "Next time you're in Cowork, say `"update Lore`" so the agent refreshes The Quest Log with the latest template."
