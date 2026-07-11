#!/usr/bin/env node
/*
  Real telemetry for a blog post, entirely from the Claude Code transcripts that
  authored AND published it. Every post here was written in a session, so both
  ends of the arc are recorded as tool calls:

    start   = the first Write/Edit that creates the post's file
    publish  = the first `wrangler pages deploy` after that (the post going live)

  Both come from the same transcript timeline (no git-vs-UTC mismatch), and every
  count is scoped to that window — not the whole session, which does many things.
  "Telemetry over vibes."

  Usage:  node scripts/session-telemetry.mjs <slug> [--json]
  Reads ~/.claude/projects/-Users-asifahmed-code/*.jsonl (local only).
*/

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2] || 'a-month-in-one-claude-session';
const asJson = process.argv.includes('--json');
const DIR = path.join(os.homedir(), '.claude/projects/-Users-asifahmed-code');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));

const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const DEPLOY_RE = /pages deploy|deploy-frontend|wrangler pages/i;
const fmtDur = (ms) => {
  if (ms == null || ms < 0) return '—';
  const m = Math.round(ms / 60000);
  if (m < 1) return '<1m';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
const fmtPT = (ms) =>
  ms == null ? '—'
    : new Date(ms).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });

const tsOf = (o) => (o.timestamp ? Date.parse(o.timestamp) : null);
const bashCmds = (o) => {
  const out = [];
  if (o.type !== 'assistant') return out;
  for (const c of o.message?.content || []) {
    if (c?.type === 'tool_use' && c.name === 'Bash') out.push(c.input?.command || '');
  }
  return out;
};

// One scan: gather this post's edit timestamps (per file) and every deploy time.
const editByFile = new Map();
const deploys = [];
for (const file of files) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
  const hasSlug = raw.includes(slug);
  const hasDeploy = DEPLOY_RE.test(raw);
  if (!hasSlug && !hasDeploy) continue;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const ts = tsOf(o);
    if (ts == null) continue;
    if (o.type === 'assistant') {
      for (const c of o.message?.content || []) {
        if (c?.type === 'tool_use' && EDIT_TOOLS.has(c.name) && hasSlug) {
          const fp = c.input?.file_path || c.input?.notebook_path || '';
          if (typeof fp === 'string' && fp.includes(slug)) {
            const e = editByFile.get(file) || { first: ts, last: ts, count: 0 };
            e.first = Math.min(e.first, ts); e.last = Math.max(e.last, ts); e.count++;
            editByFile.set(file, e);
          }
        }
      }
      for (const cmd of bashCmds(o)) if (DEPLOY_RE.test(cmd)) deploys.push(ts);
    }
  }
}
if (!editByFile.size) { console.log(`No session edited "${slug}".`); process.exit(0); }
deploys.sort((a, b) => a - b);

// Drafting session = the one that first created the file.
const drafting = [...editByFile.entries()].sort((a, b) => a[1].first - b[1].first)[0];
const [draftFile, draftEdit] = drafting;
const start = draftEdit.first;
const publish = deploys.find((t) => t >= start) ?? null;
const winEnd = publish ?? draftEdit.last;
const redeploys = publish ? deploys.filter((t) => t > publish && t < publish + 6 * 3600e3).length : 0;

// Scope every count to [start, winEnd] within the drafting session.
const m = { instructions: 0, turns: 0, tools: {}, toolTotal: 0, compacts: 0, bridge: 0, models: new Set(), versions: new Set() };
for (const line of fs.readFileSync(path.join(DIR, draftFile), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let o; try { o = JSON.parse(line); } catch { continue; }
  const ts = tsOf(o);
  if (ts == null || ts < start || ts > winEnd) continue;
  if (o.version) m.versions.add(o.version);
  if (o.type === 'bridge-session') m.bridge++;
  if (o.subtype === 'compact_boundary' || o.compactMetadata) m.compacts++;
  const msg = o.message;
  if (o.type === 'assistant' && msg) {
    m.turns++;
    if (msg.model && msg.model !== '<synthetic>') m.models.add(msg.model);
    for (const c of msg.content || []) if (c?.type === 'tool_use') { m.tools[c.name] = (m.tools[c.name] || 0) + 1; m.toolTotal++; }
  } else if (o.type === 'user' && msg) {
    const c = msg.content;
    const isToolResult = Array.isArray(c) && c.some((x) => x?.type === 'tool_result');
    const hasText = typeof c === 'string' || (Array.isArray(c) && c.some((x) => x?.type === 'text'));
    if (!isToolResult && hasText) m.instructions++;
  }
}

const report = {
  slug, drafted_session: draftFile.slice(0, 8),
  started: start, published: publish, authoring_window: fmtDur(winEnd - start),
  model: [...m.models][0] || 'claude-opus-4-8', cc_versions: [...m.versions],
  instructions: m.instructions, turns: m.turns, tool_calls: m.toolTotal,
  compacts: m.compacts, phone_relayed: m.bridge > 0, redeploys,
  later_edit_sessions: editByFile.size - 1,
};

if (asJson) {
  console.log(JSON.stringify({ ...report, started: fmtPT(start), published: fmtPT(publish) }, null, 2));
  process.exit(0);
}
const top = Object.entries(m.tools).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(', ');
console.log(`\n=== ${slug} ===`);
console.log(`drafting session:  ${report.drafted_session}${report.later_edit_sessions ? `  (+${report.later_edit_sessions} later edit session${report.later_edit_sessions > 1 ? 's' : ''})` : ''}`);
console.log(`started authoring: ${fmtPT(start)} PT`);
console.log(`published (deploy): ${publish ? fmtPT(publish) + ' PT' : 'no deploy found'}${redeploys ? `  (+${redeploys} re-deploys polishing)` : ''}`);
console.log(`authoring window:  ${report.authoring_window}   (start → first publish)`);
console.log(`model:             ${report.model}   ·  CC ${report.cc_versions.join(', ') || '—'}`);
console.log(`in-window work:    ${m.instructions} instructions · ${m.turns} turns · ${m.toolTotal} tool calls`);
console.log(`tools:             ${top}`);
console.log(`compacts:          ${m.compacts}    phone-relayed: ${report.phone_relayed ? 'yes' : 'no'}`);
console.log('');
