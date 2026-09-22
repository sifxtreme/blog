// Serves the reader's chosen site design.
//
// Every deploy holds all designs: the default at the site root, each other one under
// /_designs/<name>/ (built by scripts/build-designs.mjs, which also writes the page list
// imported below). A `design` cookie picks one; any URL with ?design=<name> sets it and
// sends the reader home. Picking the default clears the cookie.
//
// Only pages listed in PAGES are swapped: this site answers unknown URLs with a 200
// fallback page, so fetching /_designs/<name>/<path> "to see if it exists" would serve
// the wrong page instead of failing.
import { DEFAULT, DESIGNS, PAGES } from './design-pages.generated.js';

const YEAR = 60 * 60 * 24 * 365;

export async function onRequest({ request, env, next }) {
	const url = new URL(request.url);

	const chosen = url.searchParams.get('design');
	if (chosen !== null) {
		if (!DESIGNS.includes(chosen)) return next();
		const headers = new Headers({ Location: '/', 'Cache-Control': 'no-store' });
		headers.append(
			'Set-Cookie',
			chosen === DEFAULT
				? 'design=; Path=/; Max-Age=0; SameSite=Lax; Secure'
				: `design=${chosen}; Path=/; Max-Age=${YEAR}; SameSite=Lax; Secure`,
		);
		return new Response(null, { status: 303, headers });
	}

	if (request.method !== 'GET' && request.method !== 'HEAD') return next();
	const m = /(?:^|;\s*)design=([a-z]+)/.exec(request.headers.get('Cookie') || '');
	const design = m && m[1] !== DEFAULT && PAGES[m[1]] ? m[1] : null;
	if (!design) return next();

	// Normalise to the URL form the build lists: "/", "/about/", "/blog/<slug>/"
	let p = url.pathname.replace(/\/index\.html$/, '/');
	if (!p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
	if (!PAGES[design].includes(p)) return next();

	const res = await env.ASSETS.fetch(new URL(`/_designs/${design}${p}`, url), request);
	if (!res.ok) return next();
	const out = new Response(res.body, res);
	// The same URL renders differently per reader, so no shared caching of it.
	out.headers.set('Cache-Control', 'private, no-store');
	out.headers.append('Vary', 'Cookie');
	return out;
}
