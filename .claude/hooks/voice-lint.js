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

  // Skip the files whose job is to quote the banned strings: the voice
  // contract itself and the calibration examples.
  const rel = path.relative(process.env.CLAUDE_PROJECT_DIR || process.cwd(), path.resolve(filePath)).split(path.sep).join('/');
  const CONTRACT = [/^VOICE\.md$/, /^\.claude\/output-styles\//, /^evals\//];
  if (CONTRACT.some((re) => re.test(rel))) process.exit(0);

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    process.exit(0);
  }

  const BANNED = [
    { pattern: /\u2014/g, label: 'em dash' },
    { pattern: /here'?s the kicker/gi, label: '"here\'s the kicker"' },
    { pattern: /here'?s the (thing|best part)/gi, label: 'listicle payoff hook ("here\'s the thing" / "the best part")' },
    { pattern: /plot twist/gi, label: '"plot twist"' },
    { pattern: /[\u201C\u201D\u2018\u2019]/g, label: 'curly quote (use straight quotes)' },
    { pattern: /\b(?:serves|stands) as\b/gi, label: 'fancy "is" ("serves as" / "stands as")' },
    { pattern: /^[ \t]*(?:[-*>][ \t]+)?(?:great question|you(?:'|\u2019)re (?:absolutely|completely|totally) right)\b/gim, label: 'sycophantic opener ("Great question" / "You\'re absolutely right")' },
    { pattern: /\b(?:delv(?:e|es|ed|ing)|tapestry|testament to|pivotal|showcas(?:e|es|ed|ing))\b/gi, label: 'AI vocabulary (delve / tapestry / testament to / pivotal / showcase)' },
    { pattern: /\b(?:hope this helps|let me know if you have any (?:other |further |more )?questions|feel free to reach out)\b/gi, label: 'generic sign-off ("Hope this helps" / "Let me know if you have any questions")' },
    // Verb use only, so a literal "_" (leading underscore, underscore prefix) stays quiet.
    { pattern: /\bunderscor(?:e|es|ed|ing) (?:the|this|that|how|why|what|our|its|a|an)\b/gi, label: 'AI vocabulary ("underscores the...")' },
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
