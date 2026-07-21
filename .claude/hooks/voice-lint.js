#!/usr/bin/env node
// Mechanical layer under VOICE.md / .claude/output-styles/lore.md.
//
// Judgment-level violations (hedging, corrective juxtaposition, tone) need a
// reader and are NOT handled here, that's what the workflow verifier subagents
// and evals/examples/ calibration are for. This hook only catches unambiguous,
// zero-false-positive literal strings that a regex can decide safely.
//
// Runs as a PostToolUse hook after Write or Edit. The tool has already
// succeeded, so this can't block the write, only surface feedback for Claude
// to act on (see .claude/settings.json).

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0); // can't parse the event, don't block on a hook bug
  }

  const filePath = event && event.tool_input && event.tool_input.file_path;
  if (!filePath) process.exit(0);

  // Scope to prose artifacts. Skip code, data, and binary files.
  const ext = path.extname(filePath).toLowerCase();
  if (!['.md', '.txt', '.html'].includes(ext)) process.exit(0);

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    process.exit(0);
  }

  const BANNED = [
    { pattern: /—/g, label: 'em dash' },
    { pattern: /here'?s the kicker/gi, label: '"here\'s the kicker"' },
    { pattern: /here'?s the (thing|best part)/gi, label: 'listicle payoff hook ("here\'s the thing" / "the best part")' },
    { pattern: /plot twist/gi, label: '"plot twist"' },
  ];

  const hits = [];
  for (const { pattern, label } of BANNED) {
    const matches = content.match(pattern);
    if (matches) hits.push(`${label} (${matches.length}x)`);
  }

  if (hits.length) {
    console.error(
      `VOICE.md violation in ${filePath}: ${hits.join(', ')}. ` +
      'Revise before presenting this artifact. Full rule set: VOICE.md and .claude/output-styles/lore.md.'
    );
    process.exit(2);
  }

  process.exit(0);
});
