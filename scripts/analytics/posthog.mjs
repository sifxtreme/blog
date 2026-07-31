#!/usr/bin/env node
/*
  PostHog report for sifxtreme.com — the questions Cloudflare Web Analytics
  structurally cannot answer.

  Run: node scripts/analytics/posthog.mjs [days]        (default 30)

  WHY THIS EXISTS ALONGSIDE cloudflare.mjs: Cloudflare's RUM API exposes exactly
  two datasets, both pageload-shaped. There is no click event, no outbound link,
  no session stitching. So "someone landed from LinkedIn, then what did they
  click?" is unanswerable there at any sampling rate. PostHog autocapture records
  every click, which is the whole reason it was added (2026-07-31).

  HOGQL GOTCHA: always include an explicit timestamp filter. Without one the
  query planner scans far more than intended and can time out or silently return
  a truncated window.

  Note $pageview/$autocapture/$pageleave are PostHog's built-in events; the
  bare-named ones (post_shared, booking_cta_clicked, ...) are wired by hand in
  ShareButtons.astro, CopyForLLM.astro and Header.astro.
*/
import { loadSecrets, hogql } from './credentials.mjs';

const days = Number(process.argv[2] || 30);
const secrets = loadSecrets();
const since = `timestamp > now() - INTERVAL ${days} DAY`;

const table = (title, rows, cols) => {
	console.log(`\n=== ${title} ===`);
	if (!rows.length) {
		console.log('  (no data yet)');
		return;
	}
	console.log('  ' + cols.map((c, i) => (i ? c.padStart(8) : c.padEnd(46))).join(''));
	for (const r of rows) {
		console.log('  ' + r.map((v, i) => (i ? String(v).padStart(8) : String(v ?? '—').slice(0, 44).padEnd(46))).join(''));
	}
};

console.log(`sifxtreme.com — PostHog (project ${secrets.posthog.projectId}), last ${days} days`);

table(
	'EVENT VOLUME',
	await hogql(secrets, `SELECT event, count() AS c FROM events WHERE ${since} GROUP BY event ORDER BY c DESC LIMIT 25`),
	['event', 'count'],
);

table(
	'WHERE PEOPLE CAME FROM (referring domain)',
	await hogql(
		secrets,
		`SELECT properties.$referring_domain AS src, count() AS views, uniq(person_id) AS people
     FROM events WHERE ${since} AND event = '$pageview'
     GROUP BY src ORDER BY views DESC LIMIT 25`,
	),
	['referring domain', 'views', 'people'],
);

table(
	'UTM CAMPAIGNS',
	await hogql(
		secrets,
		`SELECT concat(coalesce(properties.utm_source,'—'),' / ',coalesce(properties.utm_campaign,'—')) AS campaign,
            count() AS views
     FROM events WHERE ${since} AND event = '$pageview' AND properties.utm_source IS NOT NULL
     GROUP BY campaign ORDER BY views DESC LIMIT 25`,
	),
	['utm source / campaign', 'views'],
);

table(
	'TOP PAGES',
	await hogql(
		secrets,
		`SELECT properties.$pathname AS path, count() AS views, uniq(person_id) AS people
     FROM events WHERE ${since} AND event = '$pageview'
     GROUP BY path ORDER BY views DESC LIMIT 25`,
	),
	['path', 'views', 'people'],
);

/*
  Outbound clicks: autocapture stores the anchor's href in $external_click_url
  when the link leaves the site. This is the "where do people go next" question
  that Cloudflare cannot answer at all.
*/
table(
	'OUTBOUND CLICKS',
	await hogql(
		secrets,
		`SELECT properties.$external_click_url AS url, count() AS clicks
     FROM events WHERE ${since} AND properties.$external_click_url IS NOT NULL
     GROUP BY url ORDER BY clicks DESC LIMIT 25`,
	),
	['outbound url', 'clicks'],
);

table(
	'IN-SITE CLICKS (autocapture)',
	await hogql(
		secrets,
		`SELECT concat(coalesce(properties.$el_text,'(no text)'),'  @ ',coalesce(properties.$pathname,'—')) AS what,
            count() AS clicks
     FROM events WHERE ${since} AND event = '$autocapture'
     GROUP BY what ORDER BY clicks DESC LIMIT 25`,
	),
	['clicked element @ page', 'clicks'],
);

table(
	'CUSTOM EVENTS (hand-wired in components)',
	await hogql(
		secrets,
		`SELECT event, count() AS c FROM events
     WHERE ${since} AND event NOT LIKE '$%'
     GROUP BY event ORDER BY c DESC LIMIT 25`,
	),
	['event', 'count'],
);

table(
	'CITIES',
	await hogql(
		secrets,
		`SELECT concat(coalesce(properties.$geoip_city_name,'—'),', ',coalesce(properties.$geoip_country_code,'—')) AS city,
            count() AS views
     FROM events WHERE ${since} AND event = '$pageview'
     GROUP BY city ORDER BY views DESC LIMIT 20`,
	),
	['city', 'views'],
);
