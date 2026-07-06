# Commands, Moved

Workflow definitions live in `workflows/` at the workspace root, not here. This folder is empty on purpose.

Lore runs the same way in Cowork and in Claude Code: the agent reads `CLAUDE.md` for orientation, matches your request against the workflow routing table, and reads the matching file in `workflows/`. No slash commands, no shell invocation, no Claude Code-specific syntax to translate. If you're running Claude Code and expected `/`-style commands here, use plain language instead ("process this transcript," "prep for my 1:1 with Jane") and Lore routes it for you.
