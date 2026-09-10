#!/usr/bin/env node
/**
 * Write each post's `pangram:` frontmatter — an independent AI-text detector's read of
 * the PROSE (frontmatter, imports, code, diagrams, and JSX stripped). Rendered next to
 * the aiUsage badge by PangramBadge.astro.
 *
 * Pangram is a PAID API, so this is NOT wired into `npm run build`. Run it by hand when a
 * post's prose changes:
 *
 *   node scripts/pangram-scores.mjs <slug>            # recompute one post (1 API call)
 *   node scripts/pangram-scores.mjs --all             # recompute every post (paid, N calls)
 *   node scripts/pangram-scores.mjs --from-cache      # populate from pangram-scores.json (no calls)
 *   node scripts/pangram-scores.mjs --from-cache <f>  # ...from a specific JSON
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const BLOG = path.join(os.homedir(), 'code/blog');
const SRC = path.join(BLOG, 'src/content/blog');
const MODEL = 'v3.3.2';
const TODAY = new Date().toISOString().slice(0, 10);

function proseOf(raw) {
	let body = raw.split(/^---$/m).slice(2).join('---'); // drop frontmatter
	body = body.replace(/\{\/\*[\s\S]*?\*\/\}/g, ''); // JSX comments
	body = body.replace(/^import .*$/gm, ''); // imports
	body = body.replace(/```[\s\S]*?```/g, ''); // fenced code
	body = body.replace(/<svg[\s\S]*?<\/svg>/g, ''); // inline SVG
	body = body.replace(/<([A-Z]\w*)\b[\s\S]*?<\/\1>/g, ''); // paired components
	body = body.replace(/<[A-Z]\w*\b[\s\S]*?\/>/g, ''); // self-closing components
	body = body.replace(/<\/?[A-Za-z][^>]*>/g, ''); // stray tags
	body = body.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) -> text
	body = body.replace(/^#{1,6}\s+/gm, ''); // headings
	body = body.replace(/\*\*/g, '').replace(/`/g, '');
	return body.replace(/\n{3,}/g, '\n\n').trim();
}

/** Run pangram --json on a chunk of prose, return { verdict, human, assisted, ai, model }. */
function detect(prose) {
	const tmp = path.join(os.tmpdir(), `pg-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
	fs.writeFileSync(tmp, prose);
	try {
		const out = execFileSync('pangram', ['detect', '--json', '-f', tmp], { encoding: 'utf8', timeout: 180000 });
		const j = JSON.parse(out);
		return {
			verdict: j.prediction_short,
			human: Math.round((j.fraction_human ?? 0) * 100),
			assisted: Math.round((j.fraction_ai_assisted ?? 0) * 100),
			ai: Math.round((j.fraction_ai ?? 0) * 100),
			model: j.version ? `v${j.version}` : MODEL,
		};
	} finally {
		fs.rmSync(tmp, { force: true });
	}
}

/** Replace or insert the `pangram:` block in a post's frontmatter, leaving the body untouched. */
function writePangram(file, d) {
	let raw = fs.readFileSync(file, 'utf8');
	const m = raw.match(/^(---\n)([\s\S]*?)(\n---)/);
	if (!m) throw new Error(`no frontmatter in ${file}`);
	let fm = m[2].replace(/\npangram:\n(?:[ \t]+.*\n?)*/g, '').replace(/\s+$/, '');
	const block =
		`\npangram:\n` +
		`  verdict: '${d.verdict}'\n` +
		`  human: ${d.human}\n` +
		`  assisted: ${d.assisted}\n` +
		`  ai: ${d.ai}\n` +
		`  model: '${d.model}'\n` +
		`  checkedOn: '${TODAY}'`;
	raw = m[1] + fm + block + m[3] + raw.slice(m[0].length);
	fs.writeFileSync(file, raw);
}

const args = process.argv.slice(2);
const posts = fs.readdirSync(SRC).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));

if (args[0] === '--from-cache') {
	const cache = args[1] || path.join(BLOG, 'pangram-scores.json');
	const rows = JSON.parse(fs.readFileSync(cache, 'utf8'));
	let n = 0;
	for (const r of rows) {
		if (r.error || r.fraction_ai == null) continue;
		const file = posts.find((p) => p.replace(/\.mdx?$/, '') === r.slug);
		if (!file) continue;
		writePangram(path.join(SRC, file), {
			verdict: r.prediction,
			human: Math.round(r.fraction_human * 100),
			assisted: Math.round(r.fraction_ai_assisted * 100),
			ai: Math.round(r.fraction_ai * 100),
			model: MODEL,
		});
		n++;
		console.log(`${r.slug}: ${r.prediction} (${Math.round(r.fraction_human * 100)}% human / ${Math.round(r.fraction_ai * 100)}% AI)`);
	}
	console.log(`\nWrote pangram frontmatter to ${n} posts from cache.`);
} else {
	const targets =
		args[0] === '--all'
			? posts
			: posts.filter((p) => p.replace(/\.mdx?$/, '') === args[0]);
	if (!targets.length) {
		console.error('Usage: node scripts/pangram-scores.mjs <slug> | --all | --from-cache [json]');
		process.exit(1);
	}
	for (const file of targets) {
		const full = path.join(SRC, file);
		const prose = proseOf(fs.readFileSync(full, 'utf8'));
		process.stdout.write(`${file} (${prose.split(/\s+/).length}w) ... `);
		const d = detect(prose);
		writePangram(full, d);
		console.log(`${d.verdict} (${d.human}% human / ${d.ai}% AI)`);
	}
}
