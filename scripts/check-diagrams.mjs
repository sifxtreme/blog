#!/usr/bin/env node
/*
  Guard: a committed diagram has to survive being embedded in THIS page.

  WHY THIS EXISTS (2026-07-29): every mermaid renderer sizes each label box by MEASURING
  its text, then bakes that width into the file. The box travels with the SVG. The font
  does NOT — it rides on a `#id{font-family:…}` rule inside the file, and that rule loses
  to the host page the moment it's invalid, absent, or names a webfont the reader never
  loads. So the same file is correct opened on its own and truncated once it's on a page:
  "can THEY see it?" renders as "can THEY see i".

  That is invisible in review, because the file itself looks perfect — which is exactly how
  it shipped on a published page while the renderer's own gate reported green. Opening the
  SVG to check is not a check; the host page is the thing that breaks it.

  So: run diagram-gen's visual gate over public/diagrams/*.svg. It measures every label
  twice — once on a bare page, once on a page with deliberately different typography — and
  a label that only fails the second pass is not portable and will break here.

  Read-only. Renders nothing, writes nothing.

  Run:           node scripts/check-diagrams.mjs      (also part of `npm run build`)
  Re-render one: cd ~/code/experiments/diagram-gen && node render.mjs <name>.mmd --check
*/
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const DIR = 'public/diagrams';
const GEN = process.env.DIAGRAM_GEN_DIR || path.join(os.homedir(), 'code/experiments/diagram-gen');

if (!fs.existsSync(DIR)) {
	console.log('✓ diagrams: none committed');
	process.exit(0);
}
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg'));
if (!files.length) {
	console.log('✓ diagrams: none committed');
	process.exit(0);
}

/*
  The gate lives in diagram-gen, which is a sibling repo rather than a dependency. If it
  isn't reachable, SKIP THE WORK BUT NEVER THE REPORT — a check that quietly turns itself
  off is worse than no check, because the build still prints green.
*/
let runVisualChecks, chromium;
try {
	({ runVisualChecks } = await import(pathToFileURL(path.join(GEN, 'checks.mjs')).href));
	chromium = createRequire(path.join(GEN, 'package.json'))('playwright').chromium;
} catch (e) {
	console.log(
		`\n⚠ diagrams: NOT CHECKED — ${files.length} committed SVG${files.length > 1 ? 's' : ''} went unverified.\n` +
			`  The gate lives in diagram-gen and it isn't reachable from here.\n` +
			`  looked in: ${GEN}   (override with DIAGRAM_GEN_DIR=/path)\n` +
			`  reason:    ${(e.message || String(e)).split('\n')[0]}\n`
	);
	process.exit(0);
}

const browser = await chromium.launch();
const problems = [];

for (const file of files.sort()) {
	const svg = fs.readFileSync(path.join(DIR, file), 'utf8');
	const { findings } = await runVisualChecks(browser, svg, { engine: 'mermaid' });
	for (const f of findings.filter((x) => x.level === 'error')) {
		problems.push(`${file}: ${f.code} — ${f.msg}`);
	}
}

await browser.close();

if (problems.length) {
	console.error(`\n✗ diagram check failed. These break once they're on the page.\n`);
	for (const p of problems) console.error(`  ${p}`);
	console.error(
		`\n  Fix by re-rendering through diagram-gen, which pins each label's font into the\n` +
			`  file so the host page can't reflow it:\n` +
			`    cd ${GEN} && node render.mjs <name>.mmd --check --out ${path.resolve(DIR)}/<name>\n`
	);
	process.exit(1);
}

console.log(`✓ diagrams: ${files.length} portable (survive a host page with its own fonts)`);
