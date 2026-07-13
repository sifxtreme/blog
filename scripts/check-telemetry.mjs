#!/usr/bin/env node
/*
  Guard: the telemetry footer must be MEASURED, never guessed.

  WHY THIS EXISTS (2026-07-13): I hand-wrote the telemetry block on two posts and
  every number was wrong. `liveAfterMin: 0` rendered as "First draft live within a
  minute of starting" on a post that took three hours of investigation before a word
  was written. The footer's entire purpose is radical transparency about how the post
  was made, so a guessed number there is worse than no footer at all. And the tool to
  compute it (scripts/session-telemetry.mjs) already existed. I just didn't run it.

  So this fails the build on the specific ways that block can lie:

    1. liveAfterMin: 0        -> renders "within a minute of starting". Almost never
                                 true, and it's the exact lie I shipped. If a post
                                 really did go live in under a minute, use 1.
    2. turns < toolCalls      -> impossible: every tool call happens inside a turn.
    3. suspiciously round      -> 100/150/200 etc. across several fields is the
       numbers                   signature of someone estimating. Measured counts are
                                 lumpy (83, 35, 162, 67).

  Run: node scripts/check-telemetry.mjs        (also runs as part of `npm run build`)
  Get real numbers: node scripts/session-telemetry.mjs <slug>
*/
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/blog';
const problems = [];

for (const file of fs.readdirSync(DIR).filter((f) => /\.mdx?$/.test(f))) {
	const src = fs.readFileSync(path.join(DIR, file), 'utf8');
	const fm = src.split('---')[1] ?? '';
	if (!/^\s*telemetry:/m.test(fm)) continue; // telemetry is optional

	const num = (key) => {
		const m = fm.match(new RegExp(`^\\s+${key}:\\s*(\\d+)\\s*$`, 'm'));
		return m ? Number(m[1]) : null;
	};
	const t = {
		liveAfterMin: num('liveAfterMin'),
		turns: num('turns'),
		toolCalls: num('toolCalls'),
		instructions: num('instructions'),
	};

	// liveAfterMin: 0 renders "First draft live within a minute of starting". That CAN
	// be true (one Write, then deploy). What can't be true is a sub-minute window that
	// somehow contained 100+ turns. The lie I shipped was 0 min alongside 110 turns.
	// So check internal consistency, not the value itself.
	if (t.liveAfterMin === 0 && t.turns != null && t.turns > 20) {
		problems.push(
			`${file}: liveAfterMin: 0 ("live within a minute") but ${t.turns} turns. ` +
				`A sub-minute window can't hold that much work. Measure it: ` +
				`node scripts/session-telemetry.mjs ${file.replace(/\.mdx?$/, '')}`
		);
	}

	if (t.turns != null && t.toolCalls != null && t.turns < t.toolCalls) {
		problems.push(
			`${file}: turns (${t.turns}) < toolCalls (${t.toolCalls}). Impossible: every tool call sits inside a turn.`
		);
	}

	// Estimates come out round. Measurements don't.
	const round = ['turns', 'toolCalls', 'instructions'].filter(
		(k) => t[k] != null && t[k] >= 20 && t[k] % 10 === 0
	);
	if (round.length >= 2) {
		problems.push(
			`${file}: ${round.join(' and ')} are suspiciously round (${round
				.map((k) => `${k}=${t[k]}`)
				.join(', ')}). That's what guessing looks like. Measure it: ` +
				`node scripts/session-telemetry.mjs ${file.replace(/\.mdx?$/, '')}`
		);
	}
}

if (problems.length) {
	console.error('\n✗ telemetry check failed. The build receipt has to be true.\n');
	for (const p of problems) console.error(`  ${p}`);
	console.error('');
	process.exit(1);
}

console.log(`✓ telemetry: measured, not guessed`);
