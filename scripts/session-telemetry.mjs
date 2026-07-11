#!/usr/bin/env node
/*
  Pull real telemetry for a blog post from the Claude Code session transcripts
  that drafted it. "Telemetry over vibes" — every number here comes off the
  actual JSONL, nothing is guessed.

  Usage:  node scripts/session-telemetry.mjs <slug>
  Example: node scripts/session-telemetry.mjs a-month-in-one-claude-session

  Reads ~/.claude/projects/-Users-asifahmed-code/*.jsonl (local only; the
  transcripts never leave the machine). Output is meant to be reviewed by hand,
  then baked into a post's frontmatter — not trusted blindly.
*/

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const slug = process.argv[2] || 'a-month-in-one-claude-session';
const DIR = path.join(os.homedir(), '.claude/projects/-Users-asifahmed-code');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));

const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const fmtDur = (ms) => {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

function analyze(file) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
  if (!raw.includes(slug)) return null; // fast reject
  const lines = raw.split('\n');
  const s = {
    file, first: null, last: null, models: new Set(), versions: new Set(),
    instructions: 0, turns: 0, tools: {}, toolTotal: 0,
    compacts: 0, queued: 0, bridge: 0,
    editFirst: null, editLast: null, editCount: 0,
  };
  for (const line of lines) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const ts = o.timestamp ? Date.parse(o.timestamp) : null;
    if (ts) { s.first = s.first ? Math.min(s.first, ts) : ts; s.last = Math.max(s.last || 0, ts); }
    if (o.version) s.versions.add(o.version);
    if (o.type === 'queue-operation') s.queued++;
    if (o.type === 'bridge-session') s.bridge++;
    if (o.subtype === 'compact_boundary' || o.compactMetadata) s.compacts++;

    const msg = o.message;
    if (o.type === 'assistant' && msg && typeof msg === 'object') {
      s.turns++;
      if (msg.model && msg.model !== '<synthetic>') s.models.add(msg.model);
      const content = Array.isArray(msg.content) ? msg.content : [];
      for (const c of content) {
        if (c && c.type === 'tool_use') {
          s.tools[c.name] = (s.tools[c.name] || 0) + 1;
          s.toolTotal++;
          const fp = c.input && (c.input.file_path || c.input.notebook_path || '');
          if (EDIT_TOOLS.has(c.name) && typeof fp === 'string' && fp.includes(slug)) {
            s.editFirst = s.editFirst ? Math.min(s.editFirst, ts) : ts;
            s.editLast = Math.max(s.editLast || 0, ts);
            s.editCount++;
          }
        }
      }
    } else if (o.type === 'user' && msg && typeof msg === 'object') {
      // a real instruction = a user prompt, not a tool_result echo
      const c = msg.content;
      const isToolResult = Array.isArray(c) && c.some((x) => x && x.type === 'tool_result');
      const hasText = typeof c === 'string' || (Array.isArray(c) && c.some((x) => x && x.type === 'text'));
      if (!isToolResult && hasText) s.instructions++;
    }
  }
  return s;
}

const sessions = files.map(analyze).filter(Boolean).filter((s) => s.editCount > 0);
sessions.sort((a, b) => (a.editFirst || a.first) - (b.editFirst || b.first));

if (!sessions.length) {
  console.log(`No drafting session found for "${slug}" (no Write/Edit of that file in any transcript).`);
  process.exit(0);
}

console.log(`\n=== Telemetry for post: ${slug} ===`);
console.log(`Drafting sessions (edited this post's file): ${sessions.length}\n`);

const topTools = (t) => Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(', ');

let firstEdit = Infinity, lastEdit = 0, instr = 0, turns = 0, toolTotal = 0, compacts = 0, queued = 0, bridge = 0, editCount = 0;
const models = new Set(), versions = new Set();
for (const s of sessions) {
  console.log(`• ${s.file.slice(0, 8)}  ${new Date(s.editFirst).toISOString().slice(0, 16).replace('T', ' ')} → ${new Date(s.editLast).toISOString().slice(11, 16)}  (edit window ${fmtDur(s.editLast - s.editFirst)})`);
  console.log(`    ${s.editCount} edits to this post · ${s.instructions} instructions · ${s.turns} turns · ${s.toolTotal} tool calls · ${s.compacts} compacts`);
  console.log(`    tools: ${topTools(s.tools)}`);
  firstEdit = Math.min(firstEdit, s.editFirst); lastEdit = Math.max(lastEdit, s.editLast);
  instr += s.instructions; turns += s.turns; toolTotal += s.toolTotal; compacts += s.compacts;
  queued += s.queued; bridge += s.bridge; editCount += s.editCount;
  s.models.forEach((m) => models.add(m)); s.versions.forEach((v) => versions.add(v));
}

console.log(`\n--- combined ---`);
console.log(`Model(s):            ${[...models].join(', ')}`);
console.log(`Claude Code version: ${[...versions].join(', ')}`);
console.log(`Sessions:            ${sessions.length}`);
console.log(`Total edits to post: ${editCount}`);
console.log(`Instructions:        ${instr}   (queued ahead: ${queued})`);
console.log(`Its turns:           ${turns}   (~${(turns / Math.max(instr, 1)).toFixed(1)} per instruction)`);
console.log(`Tool calls:          ${toolTotal}`);
console.log(`Compacts:            ${compacts}`);
console.log(`Phone-relayed:       ${bridge > 0 ? `yes (${bridge} bridge events)` : 'no'}`);
console.log(`\nSuggested footer:`);
console.log(`  drafted across ${fmtDur(lastEdit - firstEdit)} of wall-clock · ${sessions.length} session${sessions.length > 1 ? 's' : ''} · ${toolTotal} tool calls · ${[...models][0] || 'claude'}`);
console.log('');
