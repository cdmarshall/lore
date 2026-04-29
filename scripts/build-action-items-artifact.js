#!/usr/bin/env node
// Build the action-items artifact HTML by reading inbox/action-items.md and
// embedding it as a JSON seed in the template. The artifact uses this seed
// only on first run (when its IndexedDB is empty); thereafter the artifact's
// IDB is the source of truth.
//
// Usage:
//   node scripts/build-action-items-artifact.js [output-path]
//
// If output-path is omitted, writes to outbox/action-items-artifact-built.html.

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const LORE_DIR = path.resolve(SCRIPT_DIR, '..');
const MARKDOWN_PATH = path.join(LORE_DIR, 'inbox', 'action-items.md');
const TEMPLATE_PATH = path.join(LORE_DIR, 'templates', 'action-items-artifact.template.html');
const DEFAULT_OUT = path.join(LORE_DIR, 'outbox', 'action-items-artifact-built.html');

const outPath = process.argv[2] || DEFAULT_OUT;

function parseMarkdown(content) {
  const lines = content.split('\n');
  let section = 'preamble';
  let inTable = false;
  const active = [], completed = [], archived = [];

  for (const line of lines) {
    const m = line.match(/^##\s+(\w+)/);
    if (m) {
      const name = m[1].toLowerCase();
      if (name === 'active')   { section = 'active';   inTable = false; continue; }
      if (name === 'completed'){ section = 'completed'; inTable = false; continue; }
      if (name === 'archived') { section = 'archived'; inTable = false; continue; }
      section = 'other'; inTable = false;
      continue;
    }
    if (!line.startsWith('|')) { inTable = false; continue; }
    const inner = line.replace(/^\|/, '').replace(/\|\s*$/, '');
    const cells = inner.split('|').map(c => c.trim());
    if (cells.every(c => /^[:-\s]+$/.test(c) && c.length > 0)) { inTable = true; continue; }
    if (!inTable) { inTable = true; continue; }
    if (cells.every(c => c === '')) continue;

    if (section === 'active' && cells.length >= 4) {
      active.push({
        date: cells[0] || '',
        from: cells[1] || '',
        subject: cells[2] || '',
        actionNeeded: cells[3] || '',
        due: cells[4] || 'TBD',
        agent: cells[5] || '',
        notes: cells[6] || ''
      });
    } else if (section === 'completed' && cells.length >= 3) {
      completed.push({
        date: cells[0] || '',
        from: cells[1] || '',
        subject: cells[2] || '',
        resolution: cells[3] || '',
        completed: cells[4] || ''
      });
    } else if (section === 'archived' && cells.length >= 3) {
      archived.push({
        date: cells[0] || '',
        from: cells[1] || '',
        subject: cells[2] || '',
        actionNeeded: cells[3] || '',
        archived: cells[4] || ''
      });
    }
  }
  return { active, completed, archived };
}

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`Template not found: ${TEMPLATE_PATH}`);
  process.exit(1);
}

let parsed = { active: [], completed: [], archived: [] };
if (fs.existsSync(MARKDOWN_PATH)) {
  parsed = parseMarkdown(fs.readFileSync(MARKDOWN_PATH, 'utf8'));
} else {
  console.warn(`No ${MARKDOWN_PATH} found — building artifact with empty seed.`);
}

const tpl = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// Substitute the seed placeholder with the JSON-encoded parsed data. The
// placeholder lives inside a <script type="application/json"> tag in the
// template (wrapped in /* ... */ so a totally untouched template is also
// valid HTML). We replace globally, but the placeholder string is unique
// enough that it won't collide with any JS code in the template.
const PLACEHOLDER = '/*__LORE_ACTION_ITEMS_SEED_PLACEHOLDER__*/';
const seedJson = JSON.stringify(parsed).replace(/<\/script/gi, '<\\/script');
const out = tpl.split(PLACEHOLDER).join(seedJson);

if (out.includes('__LORE_ACTION_ITEMS_SEED_PLACEHOLDER__')) {
  console.error('ERROR: seed placeholder substitution did not occur');
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

console.log(`Built: ${outPath}`);
console.log(`  Active items:    ${parsed.active.length}`);
console.log(`  Completed items: ${parsed.completed.length}`);
console.log(`  Archived items:  ${parsed.archived.length}`);
console.log(`  Size: ${out.length} bytes`);
