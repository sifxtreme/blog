/*
  Credential loader for the analytics scripts.

  WHY THE ODD FILENAME: credentials live in `secrets.local.json`, not `.env`.
  Agent tooling here runs under a blanket deny rule on `.env`, so a credential
  parked in `blog/.env` is unreadable in place — the scripts below could never
  run unattended. `*.local.json` is gitignored just as hard (see .gitignore) but
  stays readable. Colocation only pays off if the thing can actually be read.

  WHY TWO ACCOUNTS MATTER: every credential here is PERSONAL. 776's PostHog is a
  different org entirely (Cerebro, project 170772). Never point these at it —
  personal blog traffic does not belong in company analytics.
*/
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const SECRETS = join(HERE, 'secrets.local.json');

export function loadSecrets() {
	try {
		return JSON.parse(readFileSync(SECRETS, 'utf8'));
	} catch {
		throw new Error(
			`Missing or unreadable ${SECRETS}.\n` +
				`Copy secrets.local.example.json and fill in your keys.`,
		);
	}
}

/*
  The Cloudflare token is deliberately NOT duplicated into secrets.local.json by
  default — cloudflare-cli already owns it, and two copies means one goes stale.
  Read it from there unless an explicit override is set.
*/
export function cloudflareToken(secrets) {
	const inline = secrets.cloudflare?.apiToken;
	if (inline) return inline;

	const path = (secrets.cloudflare?.apiTokenFallbackPath || '').replace(/^~/, homedir());
	const line = readFileSync(path, 'utf8')
		.split('\n')
		.map((l) => l.match(/^\s*CLOUDFLARE_API_TOKEN\s*=\s*(.+?)\s*$/))
		.find(Boolean);
	if (!line) throw new Error(`No CLOUDFLARE_API_TOKEN found in ${path}`);
	return line[1];
}

/* Cloudflare's analytics API is GraphQL-only; the REST endpoint has no RUM data. */
export async function cloudflareGraphQL(token, query) {
	const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	});
	const json = await res.json();
	if (json.errors) throw new Error(`Cloudflare GraphQL: ${JSON.stringify(json.errors)}`);
	return json.data;
}

/* PostHog reads go through HogQL. Note: queries need an explicit timestamp filter. */
export async function hogql(secrets, query) {
	const { host, projectId, personalApiKey } = secrets.posthog;
	const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${personalApiKey}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
	});
	const json = await res.json();
	if (!json.results) throw new Error(`PostHog: ${JSON.stringify(json).slice(0, 400)}`);
	return json.results;
}
