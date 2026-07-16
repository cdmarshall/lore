#!/usr/bin/env node
// Build the Action Item Triage artifact HTML by embedding a *delta operations*
// JSON seed in the template. The artifact's IndexedDB is the source of truth
// for triage state; this seed never carries full state, only the operations
// Lore wants to apply (enqueue / ack). On bootstrap the artifact applies the
// operations on top of IDB without ever wholesale-replacing it.
//
// Usage:
//   node scripts/build-action-item-triage.js <ops.json> [output-path]
//
// <ops.json> must be a JSON file (or inline JSON string) with one of these shapes:
//
//   1. An array of operations:
//      [
//        {"op": "enqueue", "item": { "subject": "...", "from": "...", ... }},
//        {"op": "ack", "subject": "...", "from": "..."}
//      ]
//
//   2. An object with an "operations" array: { "operations": [ ... ] }
//
// Pass [] for a no-op push.
//
// Operation types:
//   enqueue - adds a new pending item to the triage queue. Deduped on
//             subject+from against every item already in the artifact
//             (pending or already decided), so re-processing a transcript
//             never re-queues something the user already triaged.
//   ack     - marks a previously-added ('add' decision) item as synced into
//             the real action-items tracker, so it drops out of "ready to
//             sync." Matched by subject+from. Push this after successfully
//             running scripts/build-action-items-artifact.js with the items
//             read back from this artifact's console log.
//
// If output-path is omitted, writes to outbox/action-item-triage-built.html.

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const LORE_DIR = path.resolve(SCRIPT_DIR, '..');
const TEMPLATE_PATH = path.join(LORE_DIR, 'templates', 'action-item-triage.template.html');
const DEFAULT_OUT = path.join(LORE_DIR, 'outbox', 'action-item-triage-built.html');

const opsPathArg = process.argv[2];
const outPath = process.argv[3] || DEFAULT_OUT;

if (!opsPathArg) {
  console.error('Usage: node scripts/build-action-item-triage.js <ops.json> [output-path]');
  console.error('Pass [] for a no-op push.');
  process.exit(1);
}

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

let operations;
if (Array.isArray(rawOps)) {
  operations = rawOps;
} else if (rawOps && Array.isArray(rawOps.operations)) {
  operations = rawOps.operations;
} else {
  console.error('Invalid operations JSON: expected an array, or an object with an "operations" array.');
  process.exit(1);
}

const VALID_OPS = new Set(['enqueue', 'ack']);
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

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`Template not found: ${TEMPLATE_PATH}`);
  process.exit(1);
}

const seed = {
  seedVersion: new Date().toISOString(),
  schemaVersion: 1,
  operations
};

const tpl = fs.readFileSync(TEMPLATE_PATH, 'utf8');

const PLACEHOLDER = '/*__LORE_ACTION_ITEM_TRIAGE_SEED_PLACEHOLDER__*/';
if (!tpl.includes(PLACEHOLDER)) {
  console.error(`Template missing seed placeholder: ${PLACEHOLDER}`);
  process.exit(1);
}

const seedJson = JSON.stringify(seed).replace(/<\/script/gi, '<\\/script');
const out = tpl.split(PLACEHOLDER).join(seedJson);

if (out.includes('__LORE_ACTION_ITEM_TRIAGE_SEED_PLACEHOLDER__')) {
  console.error('ERROR: seed placeholder substitution did not occur');
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

const opCounts = {};
for (const op of operations) opCounts[op.op] = (opCounts[op.op] || 0) + 1;
const summary = Object.entries(opCounts).map(([k, v]) => `${k}:${v}`).join(', ') || '(none)';

console.log(`Built: ${path.relative(LORE_DIR, outPath)}`);
console.log(`  Operations:    ${operations.length} (${summary})`);
console.log(`  Seed version:  ${seed.seedVersion}`);
console.log(`  Size:          ${fs.statSync(outPath).size} bytes`);
