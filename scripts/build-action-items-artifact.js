#!/usr/bin/env node
// Build the action-items artifact HTML by embedding a *delta operations*
// JSON seed in the template. The artifact's IndexedDB is the source of truth;
// this seed never carries full state, only the operations the agent wants to
// apply (add / complete / delegate / delegateComplete / reopen / archive /
// update). On bootstrap the artifact applies the operations on top of IDB
// without ever wholesale-replacing it.
//
// Usage:
//   node scripts/build-action-items-artifact.js <ops.json> [output-path]
//
// <ops.json> must be a JSON file with one of these shapes:
//
//   1. An array of operations:
//      [
//        {"op": "add", "item": { ... }},
//        {"op": "complete", "subject": "...", "from": "..."}
//      ]
//
//   2. An object with an "operations" array (and optional fields like
//      "teamMembers" if you want to override the auto-read from team/):
//      { "operations": [ ... ], "teamMembers": ["Danelle", "Hannah"] }
//
// Pass the empty array [] (or {"operations":[]}) to produce a no-op push,
// e.g., when migrating the artifact to a new template version without
// applying any deltas.
//
// If output-path is omitted, writes to outbox/action-items-artifact-built.html.
//
// IMPORTANT: this script intentionally does NOT read inbox/action-items.md.
// The local file is a restore-only backup. The artifact's IDB is the source
// of truth for action-item state.

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const LORE_DIR = path.resolve(SCRIPT_DIR, '..');
const TEMPLATE_PATH = path.join(LORE_DIR, 'templates', 'action-items-artifact.template.html');
const DEFAULT_OUT = path.join(LORE_DIR, 'outbox', 'action-items-artifact-built.html');

const opsPathArg = process.argv[2];
const outPath = process.argv[3] || DEFAULT_OUT;

if (!opsPathArg) {
  console.error('Usage: node scripts/build-action-items-artifact.js <ops.json> [output-path]');
  console.error('Pass [] for a no-op push.');
  process.exit(1);
}

// Allow the user to pass an inline JSON string for trivial cases (most common:
// "[]"). If the argument doesn't look like a JSON literal, treat it as a path.
function loadOps(arg) {
  const trimmed = arg.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }
  const resolved = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
  if (!fs.existsSync(resolved)) {
    console.error(`Operations JSON file not found: ${resolved}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

const rawOps = loadOps(opsPathArg);

let operations, teamMembersOverride;
if (Array.isArray(rawOps)) {
  operations = rawOps;
} else if (rawOps && Array.isArray(rawOps.operations)) {
  operations = rawOps.operations;
  if (Array.isArray(rawOps.teamMembers)) teamMembersOverride = rawOps.teamMembers;
} else {
  console.error('Invalid operations JSON: expected an array, or an object with an "operations" array.');
  process.exit(1);
}

// Validate each operation has a recognized op type. Don't be strict on the
// shape of arguments — the artifact's applyOperations handles malformed ops
// gracefully — but flag unknown ops loudly so the agent catches typos.
const VALID_OPS = new Set(['add', 'complete', 'delegate', 'delegateComplete', 'reopen', 'archive', 'update']);
const unknownOps = operations
  .map((op, i) => ({ op, i }))
  .filter(({ op }) => !op || typeof op !== 'object' || !VALID_OPS.has(op.op));
if (unknownOps.length > 0) {
  console.error('Invalid operations found:');
  for (const { op, i } of unknownOps) {
    console.error(`  [${i}]:`, JSON.stringify(op));
  }
  console.error(`Valid op types: ${Array.from(VALID_OPS).join(', ')}`);
  process.exit(1);
}

// Read team members from team/ directory (used to populate the delegate
// picker in the artifact UI). Unless the ops JSON overrode them.
function readTeamMembers(teamDir) {
  if (!fs.existsSync(teamDir)) return [];
  try {
    return fs.readdirSync(teamDir)
      .filter(f => f.endsWith('.md') && !f.includes('-') && f !== '.gitkeep')
      .map(f => {
        try {
          const content = fs.readFileSync(path.join(teamDir, f), 'utf8');
          const match = content.match(/^#\s+(.+)/m);
          if (match) {
            const nameBeforeDash = match[1].split(' - ')[0].trim();
            return nameBeforeDash.split(' ')[0];
          }
        } catch (_) {}
        const stem = f.replace(/\.md$/, '');
        return stem.charAt(0).toUpperCase() + stem.slice(1);
      })
      .filter(Boolean)
      .sort();
  } catch (_) { return []; }
}

const teamMembers = teamMembersOverride || readTeamMembers(path.join(LORE_DIR, 'team'));

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`Template not found: ${TEMPLATE_PATH}`);
  process.exit(1);
}

// seedVersion: ISO timestamp the artifact uses to decide whether to apply
// these operations. Always fresh so the next artifact load picks them up.
const seed = {
  seedVersion: new Date().toISOString(),
  schemaVersion: 2,
  teamMembers,
  operations
};

const tpl = fs.readFileSync(TEMPLATE_PATH, 'utf8');

const PLACEHOLDER = '/*__LORE_ACTION_ITEMS_SEED_PLACEHOLDER__*/';
if (!tpl.includes(PLACEHOLDER)) {
  console.error(`Template missing seed placeholder: ${PLACEHOLDER}`);
  process.exit(1);
}

// Encode the seed safely inside a <script type="application/json"> tag.
// "</script" must not appear literally inside the script body.
const seedJson = JSON.stringify(seed).replace(/<\/script/gi, '<\\/script');
const out = tpl.split(PLACEHOLDER).join(seedJson);

if (out.includes('__LORE_ACTION_ITEMS_SEED_PLACEHOLDER__')) {
  console.error('ERROR: seed placeholder substitution did not occur');
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

// Operation summary
const opCounts = {};
for (const op of operations) opCounts[op.op] = (opCounts[op.op] || 0) + 1;
const summary = Object.entries(opCounts).map(([k, v]) => `${k}:${v}`).join(', ') || '(none)';

console.log(`Built: ${outPath}`);
console.log(`  Team members:  ${teamMembers.join(', ') || '(none — delegate disabled)'}`);
console.log(`  Operations:    ${operations.length} (${summary})`);
console.log(`  Seed version:  ${seed.seedVersion}`);
console.log(`  Size:          ${out.length} bytes`);
