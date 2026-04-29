#!/usr/bin/env node
// Build a substituted action-items artifact HTML by reading inbox/action-items.md,
// extracting the Active and Completed tables, and inserting the data into the
// canonical template at templates/action-items-artifact.template.html.
//
// Usage:
//   node scripts/build-action-items-artifact.js [output-path]
//
// If output-path is omitted, writes to outbox/action-items-artifact-built.html.
// The agent should then pass the output path to mcp__cowork__create_artifact or
// mcp__cowork__update_artifact (id: "action-items", mcp_tools: []).

const fs = require('fs');
const path = require('path');

// Resolve the lore folder by walking up from this script's directory.
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
  const active = [], completed = [];

  for (const line of lines) {
    const m = line.match(/^##\s+(\w+)/);
    if (m) {
      const name = m[1].toLowerCase();
      if (name === 'active')   { section = 'active';   inTable = false; continue; }
      if (name === 'completed'){ section = 'completed'; inTable = false; continue; }
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
        from:      cells[1] || '',
        subject:   cells[2] || '',
        details:   cells[3] || '',
        due:       cells[4] || 'TBD',
        agentable: (cells[5] === 'Y' || cells[5] === 'y'),
        notes:     cells[6] || ''
      });
    } else if (section === 'completed' && cells.length >= 5) {
      completed.push({ completed: cells[4] });
    }
  }
  return { active, completed };
}

if (!fs.existsSync(MARKDOWN_PATH)) {
  console.error(`Action items file not found: ${MARKDOWN_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`Template not found: ${TEMPLATE_PATH}`);
  process.exit(1);
}

const md = fs.readFileSync(MARKDOWN_PATH, 'utf8');
const tpl = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const { active, completed } = parseMarkdown(md);

const today = new Date();
const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
const recentlyCompleted = completed.filter(c => {
  if (!c.completed) return false;
  const d = new Date(c.completed + 'T12:00:00');
  return !isNaN(d) && d >= thirtyDaysAgo;
}).length;

const rawJson = JSON.stringify(active, null, 2);

const out = tpl
  .replace(/__TODAY__/g, todayStr)
  .replace(/__RECENTLY_COMPLETED__/g, String(recentlyCompleted))
  .replace(/__RAW__/g, rawJson);

if (out.includes('__TODAY__') || out.includes('__RAW__') || out.includes('__RECENTLY_COMPLETED__')) {
  console.error('ERROR: substitution incomplete');
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

console.log(`Built: ${outPath}`);
console.log(`  Active items: ${active.length}`);
console.log(`  Completed in last 30 days: ${recentlyCompleted}`);
console.log(`  Today: ${todayStr}`);
console.log(`  Size: ${out.length} bytes`);
