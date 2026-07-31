#!/usr/bin/env node
/*
  Cloudflare Web Analytics report for sifxtreme.com.

  Run: node scripts/analytics/cloudflare.mjs [from] [to]     (dates as YYYY-MM-DD)

  TWO TRAPS THIS SCRIPT ENCODES, both of which have already cost real time:

  1. site_tag != site_token. The GraphQL filter below takes the *site_tag*
     (106ede...). The browser beacon in BaseHead.astro takes the *site_token*
     (f972c0...). Swapping them is silent: the beacon 404s on every POST and
     Web Analytics reads zero while the site is plainly getting traffic. That
     exact mix-up cost 10 days of data (2026-07-07 -> 2026-07-17).

  2. The numbers are SAMPLED. `sampleInterval` comes back as 10, and every count
     is a multiple of 10 because Cloudflare pre-scales it. At low volume a
     reported "10" is ONE real observed pageview. Never quote these figures
     without that caveat — the report prints it for you.

  "visits" is Cloudflare's own metric: a pageview whose referrer host differs
  from the site host. That is why internal navigation shows pageviews but zero
  visits, and it is the number you want when asking "how many people arrived".
*/
import { loadSecrets, cloudflareToken, cloudflareGraphQL } from './credentials.mjs';

const from = process.argv[2] || '2026-07-01';
const to = process.argv[3] || new Date().toISOString().slice(0, 10);

const secrets = loadSecrets();
const token = cloudflareToken(secrets);
const { accountTag, siteTag } = secrets.cloudflare;
const F = `{siteTag: "${siteTag}", date_geq: "${from}", date_leq: "${to}"}`;

const group = (alias, dims, order = 'sum_visits_DESC') => `
  ${alias}: rumPageloadEventsAdaptiveGroups(filter: ${F}, limit: 100, orderBy: [${order}]) {
    count sum { visits } avg { sampleInterval } ${dims ? `dimensions { ${dims} }` : ''} }`;

const data = await cloudflareGraphQL(
	token,
	`{ viewer { accounts(filter: {accountTag: "${accountTag}"}) {
    ${group('daily', 'date', 'date_ASC')}
    ${group('referrers', 'refererHost')}
    ${group('pages', 'requestPath')}
    ${group('countries', 'countryName')}
  } } }`,
);

const a = data.viewer.accounts[0];
const pad = (s, n) => String(s).padStart(n);
const host = (h) => (h ? (h === 'sifxtreme.com' ? '(internal)' : h) : '(direct/none)');
const sampling = a.daily[0]?.avg?.sampleInterval ?? 1;

const section = (title, rows, label) => {
	console.log(`\n=== ${title} ===`);
	let pv = 0;
	let vi = 0;
	for (const r of rows) {
		pv += r.count;
		vi += r.sum.visits;
		console.log(`${String(label(r)).slice(0, 46).padEnd(48)} pv=${pad(r.count, 5)}  visits=${pad(r.sum.visits, 5)}`);
	}
	console.log(`${'TOTAL'.padEnd(48)} pv=${pad(pv, 5)}  visits=${pad(vi, 5)}`);
};

console.log(`sifxtreme.com — Cloudflare Web Analytics   ${from} .. ${to}`);
console.log(`Sampling: ${sampling}x — each reported unit of ${sampling} is ~1 real pageview.`);
section('BY DAY', a.daily, (r) => r.dimensions.date);
section('REFERRERS', a.referrers, (r) => host(r.dimensions.refererHost));
section('TOP PAGES', a.pages, (r) => r.dimensions.requestPath);
section('COUNTRIES', a.countries, (r) => r.dimensions.countryName);

const external = a.referrers.filter(
	(r) => r.dimensions.refererHost && r.dimensions.refererHost !== 'sifxtreme.com',
);
console.log(
	`\nEXTERNAL referrers: ${external.length} host(s), ` +
		`${external.reduce((s, r) => s + r.sum.visits, 0)} visits ` +
		`(~${Math.round(external.reduce((s, r) => s + r.sum.visits, 0) / sampling)} real clicks)`,
);
