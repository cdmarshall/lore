#!/usr/bin/env node
/**
 * build-cc-session-digest.js
 *
 * Bridges Claude Code CLI session history into Lore so Cowork-side recap
 * workflows can actually see it.
 *
 * WHY THIS EXISTS
 * ---------------
 * Claude Code CLI writes one JSONL transcript per session to
 * ~/.claude/projects/<escaped-cwd>/<session-uuid>.jsonl. Cowork's sandboxed
 * shell cannot see ~ at all, and Cowork's Read tool refuses paths outside the
 * connected folder, so a Cowork session can enumerate those files (Glob) and
 * never open one. Meanwhile `list_sessions` returns Cowork's own local agent
 * sessions only, which is a different population entirely.
 *
 * So: run this FROM CLAUDE CODE (which has real filesystem access), and it
 * writes a digest into the Lore repo, which Cowork can read.
 *
 * USAGE
 * -----
 *   node scripts/build-cc-session-digest.js --inspect
 *       Print the shapes actually found in the transcripts and write nothing.
 *       RUN THIS FIRST on any new machine or after a Claude Code upgrade: the
 *       transcript format is internal and undocumented, and this script parses
 *       it defensively rather than trusting a fixed schema.
 *
 *   node scripts/build-cc-session-digest.js
 *       Rescan everything, rewrite inbox/cc-sessions/sessions.jsonl.
 *
 *   node scripts/build-cc-session-digest.js --days 90
 *   node scripts/build-cc-session-digest.js --since 2026-07-01 --until 2026-09-30
 *       Same, plus a grouped markdown digest for the window.
 *
 *   --project <substring>   Only projects whose path matches.
 *   --prompt-chars <n>      Opening-prompt budget per session (default 400).
 *   --out <dir>             Output directory (default <repo>/inbox/cc-sessions).
 *   --claude-dir <dir>      Override ~/.claude.
 *   --quiet                 Suppress the per-project progress lines.
 *
 * WHAT IT CAPTURES (per session)
 * ------------------------------
 * project path, git branch, session id, start/end timestamps, duration,
 * user/assistant message counts, the opening user prompt (truncated), files
 * written or edited, and any summary records the transcript carries.
 *
 * It does NOT copy conversation bodies. Transcripts routinely contain
 * credentials, customer data, and half-finished thinking; the digest is
 * deliberately a table of contents, not an archive. The opening prompt is the
 * one exception and it is truncated. Treat the output as gitignored personal
 * data (it is, via /inbox/).
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

const REPO_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const opts = {
    inspect: false,
    quiet: false,
    days: null,
    since: null,
    until: null,
    project: null,
    promptChars: 400,
    out: path.join(REPO_ROOT, 'inbox', 'cc-sessions'),
    claudeDir: process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'),
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    switch (a) {
      case '--inspect': opts.inspect = true; break;
      case '--quiet': opts.quiet = true; break;
      case '--days': opts.days = Number(next()); break;
      case '--since': opts.since = next(); break;
      case '--until': opts.until = next(); break;
      case '--project': opts.project = next(); break;
      case '--prompt-chars': opts.promptChars = Number(next()); break;
      case '--out': opts.out = path.resolve(next()); break;
      case '--claude-dir': opts.claudeDir = path.resolve(next()); break;
      case '-h': case '--help': opts.help = true; break;
      default: throw new Error(`unknown argument: ${a}`);
    }
  }
  if (opts.days != null && (!Number.isFinite(opts.days) || opts.days <= 0)) {
    throw new Error('--days needs a positive number');
  }
  if (!Number.isFinite(opts.promptChars) || opts.promptChars < 0) {
    throw new Error('--prompt-chars needs a non-negative number');
  }
  return opts;
}

// The window is expressed as local YYYY-MM-DD strings and compared
// lexicographically against activeDates. Comparing date strings to instants is
// what invites off-by-one-day bugs at the edges of a window.
function resolveWindow(opts) {
  let since = null;
  let until = null;
  const check = (s, flag) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`${flag} needs YYYY-MM-DD`);
    return s;
  };
  if (opts.since) since = check(opts.since, '--since');
  if (opts.until) until = check(opts.until, '--until');
  if (opts.days != null && !since) since = localDay(Date.now() - opts.days * 86400000);
  return { since, until };
}

function inWindow(day, window) {
  if (!day) return false;
  if (window.since && day < window.since) return false;
  if (window.until && day > window.until) return false;
  return true;
}

// ---------------------------------------------------------------- discovery

// Claude Code escapes the project cwd into the directory name by replacing
// path separators and dots with hyphens. That is lossy (a real hyphen in a
// folder name is indistinguishable from a separator), so prefer the `cwd`
// field carried inside the transcript and fall back to this only if absent.
function unescapeProjectDir(name) {
  return name.startsWith('-') ? '/' + name.slice(1).replace(/-/g, '/') : name;
}

function listSessionFiles(projectsDir) {
  let projectDirs;
  try {
    projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const files = [];
  for (const d of projectDirs) {
    if (!d.isDirectory()) continue;
    const dir = path.join(projectsDir, d.name);
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch { continue; }
    for (const e of entries) {
      // Only top-level .jsonl files are sessions. Nested directories hold
      // subagent and workflow transcripts, whose work already belongs to the
      // parent session; counting them separately double-counts the work.
      if (e.isFile() && e.name.endsWith('.jsonl')) {
        files.push({ file: path.join(dir, e.name), projectDirName: d.name });
      }
    }
  }
  return files;
}

// ---------------------------------------------------------------- extraction

function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts = [];
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    if (block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
  }
  return parts.join('\n').trim();
}

// A user line is only a real prompt if a human typed it. Tool results, hook
// output, slash-command expansions, and resumed-session replays all arrive as
// role "user" and would otherwise be mistaken for the opening prompt.
function isHumanPrompt(rec) {
  if (rec.isMeta || rec.isSidechain || rec.isCompactSummary) return false;
  if (rec.userType && rec.userType !== 'external') return false;
  const msg = rec.message;
  if (!msg || msg.role !== 'user') return false;
  if (Array.isArray(msg.content)) {
    const hasToolResult = msg.content.some((b) => b && b.type === 'tool_result');
    if (hasToolResult) return false;
  }
  const text = textFromContent(msg.content);
  if (!text) return false;
  if (/^<(command-name|command-message|local-command|bash-input)/.test(text.trim())) return false;
  if (/^Caveat: The messages below were generated/.test(text.trim())) return false;
  return true;
}

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'notebook_edit']);

function collectFileWrites(rec, into) {
  const msg = rec.message;
  if (!msg || msg.role !== 'assistant' || !Array.isArray(msg.content)) return;
  for (const block of msg.content) {
    if (!block || block.type !== 'tool_use') continue;
    if (!WRITE_TOOLS.has(block.name)) continue;
    const p = block.input && (block.input.file_path || block.input.notebook_path);
    if (typeof p === 'string' && p) into.add(p);
  }
}

function truncate(s, n) {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length <= n ? flat : flat.slice(0, n - 1).trimEnd() + '…';
}

async function readSession(file, projectDirName, opts, shapes) {
  const session = {
    sessionId: path.basename(file, '.jsonl'),
    project: null,
    projectDirName,
    gitBranch: null,
    version: null,
    start: null,
    end: null,
    userMessages: 0,
    assistantMessages: 0,
    firstPrompt: null,
    summaries: [],
    filesTouched: [],
    activeDates: new Set(),
    parseErrors: 0,
    lines: 0,
  };
  const files = new Set();

  const stream = fs.createReadStream(file, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    session.lines++;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      session.parseErrors++;
      continue;
    }
    if (!rec || typeof rec !== 'object') continue;

    if (shapes) {
      const t = rec.type || '(no type)';
      const bucket = shapes.types.get(t) || { count: 0, keys: new Map() };
      bucket.count++;
      for (const k of Object.keys(rec)) bucket.keys.set(k, (bucket.keys.get(k) || 0) + 1);
      shapes.types.set(t, bucket);
    }

    if (typeof rec.sessionId === 'string' && rec.sessionId) session.sessionId = rec.sessionId;
    if (!session.project && typeof rec.cwd === 'string' && rec.cwd) session.project = rec.cwd;
    if (!session.gitBranch && typeof rec.gitBranch === 'string' && rec.gitBranch) {
      session.gitBranch = rec.gitBranch;
    }
    if (!session.version && typeof rec.version === 'string') session.version = rec.version;

    if (rec.type === 'summary' && typeof rec.summary === 'string' && rec.summary.trim()) {
      session.summaries.push(rec.summary.trim());
    }

    if (typeof rec.timestamp === 'string') {
      const ts = Date.parse(rec.timestamp);
      if (!Number.isNaN(ts)) {
        if (session.start === null || ts < session.start) session.start = ts;
        if (session.end === null || ts > session.end) session.end = ts;
        // Which calendar days this session was actually active on, in local
        // time. A resumed session can span months, so start-to-end is not a
        // duration and the start date alone is not "when the work happened".
        session.activeDates.add(localDay(ts));
      }
    }

    if (rec.isSidechain) continue;

    const role = rec.message && rec.message.role;
    if (role === 'assistant') {
      session.assistantMessages++;
      collectFileWrites(rec, files);
    } else if (role === 'user') {
      if (isHumanPrompt(rec)) {
        session.userMessages++;
        if (!session.firstPrompt) {
          session.firstPrompt = truncate(textFromContent(rec.message.content), opts.promptChars);
        }
      }
    }
  }

  session.filesTouched = [...files];
  // Fall back to the lossy directory name only when no line carried a cwd.
  if (!session.project) session.project = unescapeProjectDir(projectDirName);
  return session;
}

// ---------------------------------------------------------------- output

function iso(ms) {
  return ms === null ? null : new Date(ms).toISOString();
}

// Calendar day in the MACHINE'S LOCAL TIME, not UTC. This matters more than it
// looks: the real data clusters starts at 22:00-23:00Z, which is late-afternoon
// Central. Slicing the UTC string would push an evening session onto tomorrow,
// and a Friday-evening session into next ISO week, which is exactly the week a
// Friday roundtable prep is trying to summarize.
function localDay(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function localZoneName() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
  } catch {
    return 'local time';
  }
}

function durationMinutes(s) {
  if (s.start === null || s.end === null) return null;
  return Math.round((s.end - s.start) / 60000);
}

function shortProject(p) {
  const home = os.homedir();
  return p.startsWith(home) ? '~' + p.slice(home.length) : p;
}

// A worktree is the same project. `~/src/foo/.claude/worktrees/bar` and
// `~/src/foo` are one line of work, and splitting them fragments any
// per-project breakdown into meaningless slivers.
function rollUpProject(p) {
  const short = shortProject(p);
  const wt = short.indexOf('/.claude/worktrees/');
  return wt === -1 ? short : short.slice(0, wt);
}

function toRow(s) {
  const activeDates = [...s.activeDates].sort();
  const spanDays =
    s.start === null || s.end === null ? null : Math.round((s.end - s.start) / 86400000);
  return {
    sessionId: s.sessionId,
    project: s.project,
    projectShort: shortProject(s.project),
    projectRoot: rollUpProject(s.project),
    isWorktree: shortProject(s.project).includes('/.claude/worktrees/'),
    gitBranch: s.gitBranch,
    start: iso(s.start),
    end: iso(s.end),
    // Wall-clock between first and last message. NOT time worked: a resumed
    // session sits idle for days and still reports the whole span. Use
    // activeDates for "when", and treat this as unreliable when spanDays > 0.
    elapsedMinutes: durationMinutes(s),
    spanDays,
    // Resumed across calendar days, which is the meaningful sense. Half the
    // real corpus is like this, so "the day it started" is a weak anchor.
    multiDay: activeDates.length > 1,
    activeDates,
    activeDayCount: activeDates.length,
    userMessages: s.userMessages,
    assistantMessages: s.assistantMessages,
    filesTouched: s.filesTouched,
    fileCount: s.filesTouched.length,
    firstPrompt: s.firstPrompt,
    summary: s.summaries.length ? s.summaries[s.summaries.length - 1] : null,
    claudeVersion: s.version,
    parseErrors: s.parseErrors,
  };
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function renderMarkdown(rows, window) {
  const from = window.since || (rows.length ? rows[0].activeDates[0] : 'the beginning');
  const to = window.until || localDay(Date.now());

  const out = [];
  out.push(`# Claude Code sessions, ${from} to ${to}`);
  out.push('');
  out.push(
    `Generated ${new Date().toISOString()} by \`scripts/build-cc-session-digest.js\`. ` +
      `Dates are ${localZoneName()}.`
  );
  out.push('');

  if (!rows.length) {
    out.push('No sessions in this window.');
    out.push('');
    return out.join('\n');
  }

  const projects = new Set(rows.map((r) => r.projectRoot));
  // Only count days inside the window. A resumed session drags in active days
  // from months earlier, which would inflate "days worked" for the period.
  const inWindowDay = (d) => inWindow(d, window);
  const workingDays = new Set();
  for (const r of rows) for (const d of r.activeDates) if (inWindowDay(d)) workingDays.add(d);
  const files = rows.reduce((n, r) => n + r.fileCount, 0);
  const prompts = rows.reduce((n, r) => n + r.userMessages, 0);
  const multiDay = rows.filter((r) => r.multiDay).length;

  out.push(
    `${plural(rows.length, 'session')} across ${plural(projects.size, 'project')}, ` +
      `on ${plural(workingDays.size, 'day')}. ` +
      `${plural(prompts, 'prompt')}, ${plural(files, 'file')} written.`
  );
  out.push('');
  out.push(
    '> No hours figure here on purpose. A session that gets resumed reports the whole ' +
      'wall-clock span between its first and last message, idle time included, so summing ' +
      'it would invent time that was never worked. Days with activity is the honest unit.'
  );
  if (multiDay) {
    out.push('>');
    out.push(
      `> ${plural(multiDay, 'session')} here ${multiDay === 1 ? 'spans' : 'span'} more than ` +
        'one calendar day (resumed work). They are listed under the day they started, but ' +
        'their `activeDates` in `sessions.jsonl` carry the full picture.'
    );
  }
  out.push('');

  const byProject = new Map();
  for (const r of rows) {
    if (!byProject.has(r.projectRoot)) byProject.set(r.projectRoot, []);
    byProject.get(r.projectRoot).push(r);
  }
  const ordered = [...byProject.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [project, list] of ordered) {
    out.push(`## ${project}`);
    out.push('');
    out.push(`${plural(list.length, 'session')}.`);
    out.push('');
    for (const r of list) {
      const day = r.activeDates[0] || (r.start ? localDay(Date.parse(r.start)) : 'undated');
      const span = r.multiDay ? `, resumed over ${plural(r.activeDayCount, 'day')}` : '';
      const branch = r.gitBranch ? ` \`${r.gitBranch}\`` : '';
      const wt = r.isWorktree ? ' (worktree)' : '';
      out.push(`### ${day}${span}${branch}${wt}`);
      out.push('');
      if (r.summary) out.push(`**Summary:** ${r.summary}`);
      if (r.firstPrompt) out.push(`**Opened with:** ${r.firstPrompt}`);
      out.push(
        `**Scale:** ${plural(r.userMessages, 'prompt')}, ` +
          `${plural(r.assistantMessages, 'reply').replace('replys', 'replies')}, ` +
          `${plural(r.fileCount, 'file')} written`
      );
      if (r.fileCount) {
        const shown = r.filesTouched.slice(0, 12).map((f) => shortProject(f));
        const more = r.fileCount > shown.length ? ` (+${r.fileCount - shown.length} more)` : '';
        out.push(`**Files:** ${shown.join(', ')}${more}`);
      }
      out.push(`**Session:** \`${r.sessionId}\``);
      out.push('');
    }
  }
  return out.join('\n');
}

function renderInspect(shapes, fileCount) {
  const out = [];
  out.push(`Scanned ${fileCount} transcripts.`);
  out.push('');
  out.push('Record types found, with the top-level keys each carries:');
  out.push('');
  const types = [...shapes.types.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [type, bucket] of types) {
    out.push(`  ${type}  (${bucket.count} records)`);
    const keys = [...bucket.keys.entries()].sort((a, b) => b[1] - a[1]);
    const line = keys.map(([k, n]) => `${k}:${n}`).join('  ');
    out.push(`    ${line}`);
    out.push('');
  }
  out.push('Sanity checks before trusting a digest built from this:');
  out.push('  - a "summary" type should exist if you use /compact or resume sessions');
  out.push('  - user and assistant records should carry "message", "timestamp", "cwd"');
  out.push('  - if "cwd" is missing everywhere, project paths fall back to the lossy');
  out.push('    directory-name decoding and folders with real hyphens will be wrong');
  return out.join('\n');
}

// ---------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^\/\*\*?/, ''));
    return;
  }

  const projectsDir = path.join(opts.claudeDir, 'projects');
  if (!fs.existsSync(projectsDir)) {
    console.error(`No Claude Code history at ${projectsDir}`);
    console.error('If this is a Cowork session, that is expected: the sandbox cannot see ~.');
    console.error('Run this from Claude Code, or pass --claude-dir.');
    process.exit(1);
  }

  let files = listSessionFiles(projectsDir);
  if (opts.project) {
    files = files.filter((f) => f.projectDirName.includes(opts.project));
  }
  if (!files.length) {
    console.error(`No transcripts found under ${projectsDir}`);
    process.exit(1);
  }

  const shapes = opts.inspect ? { types: new Map() } : null;
  const sessions = [];
  for (const { file, projectDirName } of files) {
    try {
      sessions.push(await readSession(file, projectDirName, opts, shapes));
    } catch (err) {
      console.error(`  skipped ${file}: ${err.message}`);
    }
  }

  if (opts.inspect) {
    console.log(renderInspect(shapes, files.length));
    return;
  }

  // Empty transcripts are common (a session opened and abandoned). They are
  // noise in a recap, so drop anything with no human prompt and no summary.
  const usable = sessions.filter((s) => s.firstPrompt || s.summaries.length);
  const rows = usable
    .map(toRow)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  fs.mkdirSync(opts.out, { recursive: true });

  const jsonlPath = path.join(opts.out, 'sessions.jsonl');
  fs.writeFileSync(jsonlPath, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');

  const dropped = sessions.length - usable.length;
  console.log(`Scanned ${files.length} transcripts.`);
  if (dropped) console.log(`Dropped ${dropped} with no prompt and no summary (empty sessions).`);
  console.log(`Wrote ${rows.length} sessions to ${jsonlPath}`);

  const parseErrors = sessions.reduce((n, s) => n + s.parseErrors, 0);
  if (parseErrors) {
    console.log(`Note: ${parseErrors} unparseable lines skipped. Run --inspect if that looks high.`);
  }

  const window = resolveWindow(opts);
  if (window.since || window.until) {
    // Window on any day the session was active, not on its start. A session
    // opened in April and resumed in August belongs in an August recap.
    const windowed = rows.filter((r) => r.activeDates.some((d) => inWindow(d, window)));
    const name = `digest-${window.since || 'start'}-to-${window.until || localDay(Date.now())}.md`;
    const mdPath = path.join(opts.out, name);
    fs.writeFileSync(mdPath, renderMarkdown(windowed, window), 'utf8');
    console.log(`Wrote ${windowed.length} in-window sessions to ${mdPath}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
