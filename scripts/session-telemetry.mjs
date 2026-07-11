#!/usr/bin/env node
/*
  Real telemetry for a blog post — scoped to the AUTHORING WINDOW, not the whole
  session. A single Claude Code session does many things; what we want is "when
  did we start authoring this post and when did it publish," so we bound every
  count to the span between the first and last edit of that post's file, and take
  the publish date from git. "Telemetry over vibes."

  Usage:  node scripts/session-telemetry.mjs <slug> [--json]

  Reads ~/.claude/projects/-Users-asifahmed-code/*.jsonl (local only; transcripts
  never leave the machine). Review the numbers before putting them on the site.
*/

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const slug = process.argv[2] || 'a-month-in-one-claude-session';
const asJson = process.argv.includes('--json');
const DIR = path.join(os.homedir(), '.claude/projects/-Users-asifahmed-code');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));

const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const fmtDur = (ms) => {
  if (!ms || ms < 0) return '—';
  const m = Math.round(ms / 60000);
  if (m < 1) return '<1m';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
// Everything to the author's timezone so transcript (UTC) and git (local) line up.
const fmtPT = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

function publishDate() {
  for (const ext of ['mdx', 'md']) {
    try {
      const out = execSync(
        `git log --diff-filter=A --follow --format=%aI -1 -- "src/content/blog/${slug}.${ext}"`,
        { cwd: repoRoot, encoding: 'utf8' },
      ).trim();
      if (out) return out;
    } catch {}
  }
  return null;
}

// First pass over a session: when was THIS post's file edited?
function editSpan(lines) {
  let first = null, last = null, count = 0;
  for (const line of lines) {
    if (!line.includes(slug)) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type !== 'assistant') continue;
    const ts = o.timestamp ? Date.parse(o.timestamp) : null;
    const content = Array.isArray(o.message?.content) ? o.message.content : [];
    for (const c of content) {
      if (c?.type === 'tool_use' && EDIT_TOOLS.has(c.name)) {
        const fp = c.input?.file_path || c.input?.notebook_path || '';
        if (typeof fp === 'string' && fp.includes(slug) && ts) {
          first = first ? Math.min(first, ts) : ts;
          last = Math.max(last || 0, ts);
          count++;
        }
      }
    }
  }
  return first ? { first, last, count } : null;
}

// Second pass: count activity that happened INSIDE [start, end].
function scoped(lines, start, end) {
  const s = { instructions: 0, turns: 0, tools: {}, toolTotal: 0, compacts: 0, bridge: 0, models: new Set(), versions: new Set() };
  for (const line of lines) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const ts = o.timestamp ? Date.parse(o.timestamp) : null;
    if (ts === null || ts < start || ts > end) continue;
    if (o.version) s.versions.add(o.version);
    if (o.type === 'bridge-session') s.bridge++;
    if (o.subtype === 'compact_boundary' || o.compactMetadata) s.compacts++;
    const msg = o.message;
    if (o.type === 'assistant' && msg) {
      s.turns++;
      if (msg.model && msg.model !== '<synthetic>') s.models.add(msg.model);
      for (const c of Array.isArray(msg.content) ? msg.content : []) {
        if (c?.type === 'tool_use') { s.tools[c.name] = (s.tools[c.name] || 0) + 1; s.toolTotal++; }
      }
    } else if (o.type === 'user' && msg) {
      const c = msg.content;
      const isToolResult = Array.isArray(c) && c.some((x) => x?.type === 'tool_result');
      const hasText = typeof c === 'string' || (Array.isArray(c) && c.some((x) => x?.type === 'text'));
      if (!isToolResult && hasText) s.instructions++;
    }
  }
  return s;
}

// Find every session that edited this post, pick the earliest as the drafting one.
const touching = [];
for (const file of files) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
  if (!raw.includes(slug)) continue;
  const lines = raw.split('\n');
  const span = editSpan(lines);
  if (span) touching.push({ file, lines, ...span });
}
if (!touching.length) { console.log(`No session edited "${slug}".`); process.exit(0); }
touching.sort((a, b) => a.first - b.first);

const draft = touching[0];
const later = touching.slice(1);
const pub = publishDate();
// Authoring window: file first written -> last edited (drafting session). If it
// was a one-pass write (single edit), the span is a point; fall back to publish.
const singlePass = draft.count <= 1 || draft.last - draft.first < 30000;
const winStart = draft.first;
const winEnd = singlePass ? draft.first : draft.last;
const m = scoped(draft.lines, winStart, winEnd);

const report = {
  slug,
  drafted_session: draft.file.slice(0, 8),
  started: new Date(winStart).toISOString(),
  finished_editing: new Date(winEnd).toISOString(),
  published: pub,
  authoring_window: singlePass ? 'single pass' : fmtDur(winEnd - winStart),
  started_to_published: pub ? fmtDur(Date.parse(pub) - winStart) : null,
  model: [...m.models][0] || 'claude-opus-4-8',
  cc_versions: [...m.versions],
  instructions: singlePass ? null : m.instructions,
  turns: singlePass ? null : m.turns,
  tool_calls: singlePass ? null : m.toolTotal,
  compacts: m.compacts,
  phone_relayed: m.bridge > 0,
  later_edit_sessions: later.length,
};

if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

const top = Object.entries(m.tools).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(', ');
console.log(`\n=== ${slug} ===`);
console.log(`drafting session:  ${report.drafted_session}${later.length ? `  (+${later.length} later edit session${later.length > 1 ? 's' : ''})` : ''}`);
console.log(`started authoring: ${fmtPT(report.started)} PT`);
console.log(`published:         ${pub ? fmtPT(pub) + ' PT' : 'not committed yet'}`);
console.log(`authoring window:  ${report.authoring_window}`);
console.log(`model:             ${report.model}   ·  CC ${report.cc_versions.join(', ') || '—'}`);
if (singlePass) {
  console.log(`counts:            single-pass write — no meaningful in-window counts`);
} else {
  console.log(`in-window work:    ${m.instructions} instructions · ${m.turns} turns · ${m.toolTotal} tool calls`);
  console.log(`tools:             ${top}`);
}
console.log(`compacts:          ${m.compacts}`);
console.log(`phone-relayed:     ${report.phone_relayed ? 'yes' : 'no'}`);
console.log('');
