#!/usr/bin/env node
// quest-log-ops.js: turn Quest Log operations into ArtifactData batch writes.
//
// The Quest Log is a hosted claude.ai artifact whose items live in its `db`
// store (collection `items`, one document per item). Lore reads that store
// with the ArtifactData tool and writes it with ArtifactData `batch`. This
// script is the deterministic middle step: it takes the current documents
// plus a list of operations (the same vocabulary Lore has always used:
// add, propose, complete, delegate, delegateComplete, reopen, archive,
// update, dismiss) and emits the exact writes, each pinned to the version
// it was computed from, so a change the user made in the page meanwhile
// makes the batch fail instead of being overwritten.
//
// Usage
//   node scripts/quest-log-ops.js --docs <dir|file.json> --ops <ops.json> --versions "q-1a2b=3,q-9f8e=1" [--out <dir>] [--by lore]
//   node scripts/quest-log-ops.js --docs <dir|file.json> --summary
//   node scripts/quest-log-ops.js --docs <dir|file.json> --snapshot > snapshot.md
//   node scripts/quest-log-ops.js --key "<subject>" "<from>"
//
// --docs accepts either the directory ArtifactData wrote with `out_dir`
// (it finds every items/<id>.json below it) or one JSON file holding an
// array of {id, data, version}. Run this wherever those files landed: in a
// cloud Cowork session that is the cloud shell, not the linked computer.
//
// --versions: the `out_dir` files carry only the document body, while every
// write to an existing document must be pinned to its version. The list
// result prints each document's version; pass the ones this run touches as
// "id=version,..." (or a JSON file {id: version}). The script stops and names
// any touched document whose version it was not given. Versions inside a
// --docs JSON array are used automatically.
//
// Output (with --ops): <out>/writes-N.json, each an array of at most 50
// batch entries ready to pass as ArtifactData `writes`, with every document
// body written to <out>/bodies/<id>.json and referenced by file_path. Also
// prints a per-op report (applied / skipped and why) and the resulting counts.
// Nothing is written to the tracker by this script.
'use strict';
const fs = require('fs');
const path = require('path');

// ---- keys: must match the template exactly ---------------------------------
const norm = s => (s == null ? '' : String(s)).trim().toLowerCase().replace(/\s+/g, ' ');
const keyOf = it => `${norm(it && it.subject)}|${norm(it && it.from)}`;
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (const b of Buffer.from(str, 'utf8')) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
const docIdFor = it => 'q-' + fnv1a(keyOf(it));

const STATUSES = ['triage', 'active', 'delegated', 'completed', 'archived', 'dismissed'];
const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
function upcomingFriday() {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const mapDue = due => (due === 'Soon' || due === 'This week') ? upcomingFriday() : (due || 'TBD');
function foldNotes(src) {
  const notes = ((src && src.notes) || '').trim();
  const an = ((src && src.actionNeeded) || '').trim();
  if (!an || norm(an) === norm(src.subject) || norm(notes).includes(norm(an))) return notes;
  return notes ? an + ' · ' + notes : an;
}

// ---- args -------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const has = n => argv.includes(n);

if (has('--key')) {
  const i = argv.indexOf('--key');
  console.log(docIdFor({ subject: argv[i + 1], from: argv[i + 2] }));
  process.exit(0);
}

// ---- load current documents -------------------------------------------------
function loadDocs(src) {
  const docs = new Map();
  if (!src) return docs;
  const add = (id, body, version) => { if (id && body && typeof body === 'object') docs.set(id, { body, version, existed: true }); };
  const take = obj => {
    if (Array.isArray(obj)) return obj.forEach(take);
    if (obj && obj.data && typeof obj.data === 'object') return add(obj.id, obj.data, obj.version);
  };
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    const walk = dir => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name.endsWith('.json') && path.basename(dir) === 'items') {
          const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
          const id = obj.id || path.basename(ent.name, '.json');
          if (obj.data && typeof obj.data === 'object') add(id, obj.data, obj.version);
          else add(id, obj, obj.version);
        }
      }
    };
    walk(src);
  } else {
    take(JSON.parse(fs.readFileSync(src, 'utf8')));
  }
  return docs;
}

const docs = loadDocs(flag('--docs'));
(function applyVersions(v) {
  if (!v) return;
  let map = {};
  if (fs.existsSync(v)) map = JSON.parse(fs.readFileSync(v, 'utf8'));
  else for (const pair of v.split(',')) { const [id, n] = pair.split('=').map(x => x && x.trim()); if (id && n) map[id] = Number(n); }
  for (const [id, n] of Object.entries(map)) if (docs.has(id)) docs.get(id).version = Number(n);
})(flag('--versions'));
const counts = () => {
  const c = Object.fromEntries(STATUSES.map(s => [s, 0]));
  for (const { body } of docs.values()) c[body.status] = (c[body.status] || 0) + 1;
  return c;
};

// ---- read-only views ----------------------------------------------------------
const byStatus = s => [...docs.values()].map(d => d.body).filter(b => b.status === s);
if (has('--summary')) {
  const c = counts();
  console.log(JSON.stringify(c));
  const active = byStatus('active');
  const t = today();
  const overdue = active.filter(b => /^\d{4}-\d{2}-\d{2}$/.test(b.due || '') && b.due < t);
  console.log(`Active ${active.length}, overdue ${overdue.length}, ASAP ${active.filter(b => b.due === 'ASAP').length}, in triage ${c.triage}.`);
  process.exit(0);
}
if (has('--snapshot')) {
  const cell = v => String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const sec = (title, cols, rows) => `\n## ${title}\n\n| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|\n` + rows.map(r => '| ' + r.map(cell).join(' | ') + ' |').join('\n') + '\n';
  let out = `# Action Items\n\n> Rendered by scripts/quest-log-ops.js from the tracker database on ${today()}.\n`;
  out += sec('Active', ['Date', 'Created', 'From', 'Subject', 'Due', 'Lore', 'Specialist', 'Notes'], byStatus('active').map(i => [i.date, i.created, i.from, i.subject, i.due, i.lore, i.specialist, i.notes]));
  out += sec('Completed', ['Date', 'Created', 'From', 'Subject', 'Resolution', 'Completed'], byStatus('completed').map(i => [i.date, i.created, i.from, i.subject, i.resolution, i.completed]));
  out += sec('Delegated', ['Date', 'Created', 'From', 'Subject', 'Delegated To', 'Delegated', 'Notes'], byStatus('delegated').map(i => [i.date, i.created, i.from, i.subject, i.delegatedTo, i.delegated, i.notes]));
  out += sec('Archived', ['Date', 'Created', 'From', 'Subject', 'Notes', 'Archived'], byStatus('archived').map(i => [i.date, i.created, i.from, i.subject, i.notes, i.archived]));
  out += sec('Triage', ['Date', 'Created', 'From', 'Subject', 'Due', 'Lore', 'Specialist', 'Notes'], byStatus('triage').map(i => [i.date, i.created, i.from, i.subject, i.due, i.lore, i.specialist, i.notes]));
  process.stdout.write(out);
  process.exit(0);
}

// ---- apply operations -------------------------------------------------------
const opsFile = flag('--ops');
if (!opsFile) {
  console.error('Usage: quest-log-ops.js --docs <dir|file> --ops <ops.json> [--out <dir>] [--by lore] | --summary | --snapshot | --key <subject> <from>');
  process.exit(2);
}
let ops = JSON.parse(fs.readFileSync(opsFile, 'utf8'));
if (ops && Array.isArray(ops.operations)) ops = ops.operations;
if (!Array.isArray(ops)) { console.error('ops file must be an array (or {operations: [...]})'); process.exit(2); }

const by = flag('--by') || 'lore';
if (ops.some(o => o && (o.op === 'add' || o.op === 'propose'))) {
  const seen = new Set([...docs.values()].map(d => d.body.status));
  if (docs.size && seen.size === 1) {
    console.error(`Warning: every document passed in --docs has status "${[...seen][0]}". Dedup for add/propose needs the full collection (an unfiltered list); a key that exists under another status will make the batch fail on write.`);
  }
}
const now = new Date().toISOString();
const changed = new Set();
const report = [];
let seqBase = Date.now();

// Look items up by key, not just by computed id, so a document stored under a
// different id is still found (the page does the same).
const idByKey = new Map();
for (const [id, d] of docs) {
  const k = keyOf(d.body);
  if (!idByKey.has(k) || d.body.status !== 'dismissed') idByKey.set(k, id);
}
const idFor = it => idByKey.get(keyOf(it)) || docIdFor(it);
const find = (subject, from) => docs.get(idFor({ subject, from }));
function put(id, body) {
  const prev = docs.get(id);
  docs.set(id, { body: Object.assign(body, { updatedAt: now, updatedBy: by }), version: prev ? prev.version : undefined, existed: !!(prev && prev.existed) });
  changed.add(id);
}
const skip = (op, why) => report.push({ op: op.op, subject: op.subject || (op.item && op.item.subject), result: 'skipped', why });
const ok = (op, id) => report.push({ op: op.op, subject: op.subject || (op.item && op.item.subject), result: 'applied', id });

for (const op of ops) {
  if (!op || typeof op !== 'object' || !op.op) { skip(op || {}, 'not an operation object (ops key on "op")'); continue; }
  try {
    switch (op.op) {
      case 'add':
      case 'propose': {
        const src = op.item || {};
        if (!src.subject) { skip(op, 'item.subject missing'); break; }
        const id = idFor(src);
        if (docs.has(id)) { skip(op, `key already exists (status ${docs.get(id).body.status})`); break; }
        const body = {
          date: src.date || today(), created: src.created || today(), from: src.from || '', subject: src.subject,
          due: mapDue(src.due), lore: src.lore || '', specialist: src.specialist || '', notes: foldNotes(src),
          status: op.op === 'propose' ? 'triage' : 'active', seq: seqBase++, createdBy: by
        };
        if (op.op === 'propose') body.proposedAt = now;
        put(id, body); idByKey.set(keyOf(body), id); ok(op, id); break;
      }
      case 'complete': {
        const d = find(op.subject, op.from);
        if (!d || !['active', 'delegated'].includes(d.body.status)) { skip(op, d ? `status is ${d.body.status}` : 'no such item'); break; }
        const b = Object.assign({}, d.body);
        b.resolution = op.resolution || (b.status === 'delegated' ? `Delegated to ${b.delegatedTo}: ${b.notes || '(complete)'}` : (b.notes || '(complete)'));
        b.completed = op.completedDate || today();
        b.status = 'completed'; b.seq = seqBase++;
        put(idFor(b), b); ok(op, idFor(b)); break;
      }
      case 'delegate': {
        const d = find(op.subject, op.from);
        if (!op.delegatedTo) { skip(op, 'delegatedTo missing'); break; }
        if (!d || !['active', 'triage'].includes(d.body.status)) { skip(op, d ? `status is ${d.body.status}` : 'no such item'); break; }
        const b = Object.assign({}, d.body, { status: 'delegated', delegatedTo: op.delegatedTo, delegated: op.delegatedDate || today(), seq: seqBase++ });
        put(idFor(b), b); ok(op, idFor(b)); break;
      }
      case 'delegateComplete': {
        const d = find(op.subject, op.from);
        if (!d || d.body.status !== 'delegated') { skip(op, d ? `status is ${d.body.status}` : 'no such item'); break; }
        const b = Object.assign({}, d.body);
        b.resolution = op.resolution || `Delegated to ${b.delegatedTo}: ${b.notes || '(complete)'}`;
        b.completed = op.completedDate || today(); b.status = 'completed'; b.seq = seqBase++;
        put(idFor(b), b); ok(op, idFor(b)); break;
      }
      case 'reopen': {
        const d = find(op.subject, op.from);
        if (!d || !['delegated', 'completed', 'archived', 'dismissed'].includes(d.body.status)) { skip(op, d ? `status is ${d.body.status}` : 'no such item'); break; }
        const b = Object.assign({}, d.body);
        if (b.status === 'completed' && !b.notes) b.notes = b.resolution || '';
        b.status = 'active'; b.due = op.due || 'TBD'; b.seq = seqBase++;
        put(idFor(b), b); ok(op, idFor(b)); break;
      }
      case 'archive': {
        const d = find(op.subject, op.from);
        if (!d || d.body.status !== 'active') { skip(op, d ? `status is ${d.body.status}` : 'no such item'); break; }
        const b = Object.assign({}, d.body, { status: 'archived', archived: op.archivedDate || today(), seq: seqBase++ });
        put(idFor(b), b); ok(op, idFor(b)); break;
      }
      case 'dismiss': {
        const d = find(op.subject, op.from);
        if (!d || d.body.status !== 'triage') { skip(op, d ? `status is ${d.body.status}; only triage items are dismissed` : 'no such item'); break; }
        const b = Object.assign({}, d.body, { status: 'dismissed', dismissed: today() });
        put(idFor(b), b); ok(op, idFor(b)); break;
      }
      case 'update': {
        const d = find(op.subject, op.from);
        if (!op.fields || typeof op.fields !== 'object') { skip(op, 'fields missing'); break; }
        if (!d || !['active', 'triage', 'delegated'].includes(d.body.status)) { skip(op, d ? `status is ${d.body.status}; reopen first` : 'no such item'); break; }
        const allowed = ['date', 'created', 'from', 'subject', 'due', 'lore', 'specialist', 'notes', 'delegatedTo'];
        const b = Object.assign({}, d.body);
        for (const [f, v] of Object.entries(op.fields)) {
          if (f === 'actionNeeded') b.notes = foldNotes({ subject: b.subject, actionNeeded: v, notes: b.notes });
          else if (f === 'due') b.due = mapDue(v);
          else if (allowed.includes(f)) b[f] = v;
        }
        const oldId = idFor(d.body), newId = keyOf(b) === keyOf(d.body) ? oldId : idFor(b);
        if (newId !== oldId) {
          // subject or from changed: the key moves. Old key keeps a tombstone.
          if (docs.has(newId)) { skip(op, `rename collides with existing key ${newId}`); break; }
          put(oldId, Object.assign({}, d.body, { status: 'dismissed', dismissed: today(), renamedTo: newId }));
          put(newId, b);
        } else put(oldId, b);
        ok(op, newId); break;
      }
      default:
        skip(op, `unknown op "${op.op}"`);
    }
  } catch (e) { skip(op, 'error: ' + e.message); }
}

// ---- emit batches -------------------------------------------------------------
const unpinned = [...changed].filter(id => docs.get(id).existed && docs.get(id).version === undefined);
if (unpinned.length) {
  console.error('Missing versions for existing documents this run would overwrite: ' + unpinned.join(', '));
  console.error('Re-run with --versions "' + unpinned.map(id => id + '=<n>').join(',') + '" using the versions from the ArtifactData list result.');
  process.exit(3);
}
const outDir = flag('--out') || 'outbox/quest-log-writes';
fs.mkdirSync(path.join(outDir, 'bodies'), { recursive: true });
for (const f of fs.readdirSync(outDir)) if (/^writes-\d+\.json$/.test(f)) fs.unlinkSync(path.join(outDir, f));
const entries = [...changed].map(id => {
  const { body, version } = docs.get(id);
  const fp = path.resolve(outDir, 'bodies', id + '.json');
  fs.writeFileSync(fp, JSON.stringify(body, null, 2));
  const e = { op: 'set', collection: 'items', doc_id: id, file_path: fp };
  if (version !== undefined) e.if_version = version;
  return e;
});
const files = [];
for (let i = 0; i < entries.length; i += 50) {
  const f = path.join(outDir, `writes-${files.length + 1}.json`);
  fs.writeFileSync(f, JSON.stringify(entries.slice(i, i + 50), null, 2));
  files.push(f);
}
const applied = report.filter(r => r.result === 'applied').length;
console.log(JSON.stringify({ applied, skipped: report.length - applied, writes: entries.length, batches: files, countsAfter: counts(), report }, null, 2));
