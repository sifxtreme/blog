# Analytics

Two systems run on sifxtreme.com, deliberately. They answer different questions and
cross-check each other.

| | Cloudflare Web Analytics | PostHog |
|---|---|---|
| Loaded by | beacon in `BaseHead.astro` | `posthog.astro`, mounted from `BaseHead.astro` |
| Cookies | none | none needed for these reports |
| Answers | how many, from where (host), what page, what country | every click, outbound links, sessions, funnels, city |
| Sampling | **10x** — a reported "10" is ~1 real pageview | unsampled |
| Data since | 2026-07-17 (see below) | 2026-07-31 |
| Cost | free | free tier: 1M events + 5k replays/mo |

```bash
node scripts/analytics/cloudflare.mjs              # defaults 2026-07-01 .. today
node scripts/analytics/cloudflare.mjs 2026-07-01 2026-07-31
node scripts/analytics/posthog.mjs                 # last 30 days
node scripts/analytics/posthog.mjs 7
```

## Credentials

`secrets.local.json`, gitignored via the `*.local.json` rule. Start from
`secrets.local.example.json`.

It is **not** named `.env` on purpose: agent tooling here runs under a blanket deny
rule on `.env`, so a credential parked there is unreadable in place and these scripts
could never run unattended. Colocation only helps if the file can actually be read.

The Cloudflare token is not duplicated here by default — `cloudflare-cli` already owns
it, and two copies means one goes stale. `credentials.mjs` reads it from
`~/code/experiments/cloudflare-cli/.env` unless `cloudflare.apiToken` is set.

**Every credential here is personal.** 776's PostHog is a different org (Cerebro,
project 170772). Never point these scripts at it.

## Two traps worth knowing

**`site_tag` is not `site_token`.** The GraphQL filter takes the *site_tag*
(`106ede…`). The browser beacon takes the *site_token* (`f972c0…`). Swapping them
fails silently — the beacon 404s on every POST and Web Analytics reads zero while the
site is visibly getting traffic. That mix-up cost 10 days of data, 2026-07-07 to
2026-07-17. Any day before 07-17 in a Cloudflare report is not trustworthy.

**Cloudflare's numbers are sampled 10x.** Every count comes back a multiple of 10
because it is pre-scaled. At current volume one reported unit of 10 is a single real
pageview. `cloudflare.mjs` prints the sampling factor; quote it whenever you quote a
number. PostHog is unsampled, which is why it is the better source for anything small.

## Verifying, not assuming

A deploy going live does not mean events are flowing — that is exactly how the beacon
sat dead for ten days while the settings page looked fine. After any change that
touches analytics, send a labeled event and **read it back**:

```bash
curl -s -X POST https://us.i.posthog.com/i/v0/e/ -H 'Content-Type: application/json' \
  -d '{"api_key":"phc_...","event":"install_verification","distinct_id":"setup-check"}'
node scripts/analytics/posthog.mjs 1     # the event must appear here
```

`{"status":"Ok"}` from the ingest endpoint is a claim. The read-back is the evidence.
