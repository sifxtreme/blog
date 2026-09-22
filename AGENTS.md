## Writing a post — start with the question (soft gate)

The point of every post is that a reader can **learn from it and apply it to their own
use case**. That only works if the post is built around one clear question, not a topic.

**Before you draft, ask Asif this once:**

> What did you want to do, and what did you *not* know how to do when you started?

One sentence. Phrase it as the question he couldn't answer yet — not a goal he already
had. A goal ("build a voice assistant") produces a build log. A question ("*why* can't an
app read my texts?") produces the honest account of finding out, which is the part that
teaches. The question is the method: it forces the clarity and the honesty that make the
post worth reading.

**Soft gate:** ask once. If he waves it off, proceed anyway — don't nag. But if he answers,
that sentence is load-bearing:

- It becomes the `problem:` frontmatter line, shown at the top of the post.
- It's the spine the whole piece hangs on.
- If he can't say it in a sentence, that's a signal the post isn't ready — say so, don't
  paper over it by writing anyway.

**The payload is the pattern, not the artifact.** The $40 board / the phone / the CLI is the
hook and the cheapest way to make a lesson concrete — but almost no reader has that exact
thing. What transfers is the reasoning ("keep the body dumb, put the brain elsewhere";
"restart is not the same as works"; "deployed is not live"). Make the transferable takeaway
easy to lift out. Let the reader apply your *pattern*, not re-live your *story*.

## Deploy (you're authorized on this repo — just do it, no confirmation needed)

sifxtreme.com is Cloudflare **Pages**, project **`sifxtreme`**, **direct upload** (NO git
integration — pushing to GitHub does not deploy). Production branch is **`master`**. It's Asif's
low-traffic personal blog; deploy as often as you want — but **every deploy gets committed and
pushed** (see "After every deploy" below), so git always reflects what's live.

**Build + deploy, from `~/code/blog`:**

```bash
TOKEN=$(grep -E '^CLOUDFLARE_API_TOKEN=' ~/code/experiments/cloudflare-cli/.env | head -1 | cut -d= -f2- | tr -d '"'\'' ')
npm run build && \
  CLOUDFLARE_API_TOKEN="$TOKEN" npx wrangler pages deploy dist --project-name=sifxtreme --branch=master --commit-dirty=true
```

- `npm run build` runs the telemetry + diagram gates, then `astro build` → `dist/`.
- CF API token lives in `~/code/experiments/cloudflare-cli/.env` (`CLOUDFLARE_API_TOKEN`).
- **`--branch=master` = PRODUCTION** (updates sifxtreme.com). Any other branch = a throwaway
  `*.pages.dev` preview that does NOT touch the live domain.

**Verify it's actually live (deploy != live — always check):**

```bash
~/code/experiments/cloudflare-cli/cf pages status sifxtreme      # latest deploy + a REAL fetch of the live URL
curl -s -o /dev/null -w '%{http_code}\n' https://sifxtreme.com/blog/<slug>/
```

**Telemetry is required on every post and `redeploys` is self-referential.** After deploying,
re-run `node scripts/session-telemetry.mjs <slug> --json`, set the frontmatter `telemetry` block to
match (the numbers only compute fully once `published` is set — before first deploy the window
undercounts), and deploy once more to bake it in.

**After every deploy: commit and push.** Direct upload means git does NOT gate the deploy, so
it's on you to keep the repo matching production. As soon as a deploy verifies live, commit the
exact paths you changed and push to `origin master`:

```bash
git add <the files you changed>        # explicit paths ONLY — never `git add -A`/`.`; other
                                       # sessions' in-flight work is usually dirty in this shared tree
git commit -m "…"
git push origin master
```

Deployed-but-uncommitted is the failure mode to avoid: the next session sees a clean-looking repo
that no longer matches the live site, and an unrelated `git checkout` can wipe the change. Push
too — the public GitHub repo is the only off-machine copy.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Diagrams

**Two paths — see [`diagram-gen/HAND_AUTHORED_DIAGRAMS.md`](~/code/experiments/diagram-gen/HAND_AUTHORED_DIAGRAMS.md).**

1. **Hero diagrams → hand-authored inline SVG** in the post, wrapped in [`Figure.astro`](src/components/Figure.astro).
   Author with the `d-*` design language (`d-card`, `d-accent`, `d-edge`, `d-dash`, `d-txt`) so it themes
   light/dark on the blog tokens and uses the real page font. Renders inline (no `<img>`, no foreignObject).
   Preview before shipping: `node ~/code/experiments/diagram-gen/preview-inline.mjs <svg> --theme light|dark`.
   Worked example: the bridge in `src/content/blog/imessage-whatsapp-and-the-ios-wall.mdx`.
2. **Routine flows → Mermaid via diagram-gen** (below), embedded with the `Diagram.astro` component.

**The `d-*` vocabulary (in `Figure.astro`):**
- Nodes: `d-card` (+ `d-accent` primary, `d-dim` muted, `d-good`/`d-bad` status).
- Edges: `d-edge` (+ `d-accent`, `d-good`, `d-bad`, `d-dash`). Convention: **working = `d-accent`, a "works" lane = `d-good` (green), blocked/dead-end = `d-bad` + `d-dash` ending in a `d-mark d-bad` ✕**.
- Barrier: `d-wall` (hatched; add `d-bad` for a red outline).
- **Dense panel** (make a node carry information, not just a name): `d-card` + `d-head` (header) + `d-rule` (divider) + a real list of `d-txt d-sub` items. This is the biggest "more detail" lever — see the legend at **`/diagrams`**.
- Text: `d-txt` (+ `d-sub`, `d-accent`, `d-good`, `d-bad`, `d-head`).

**Gallery / contact sheet: [`/diagrams`](src/pages/diagrams.astro)** renders every diagram (pulled from the posts at build time, so it never drifts) + the design-language legend. Check it after any diagram change, in **both themes**, to spot the weak or inconsistent ones.

⚠️ **COLOR TOKENS: `--accent` / `--accent-dark` / `--good` / `--bad` are HEX — use them DIRECTLY (`stroke: var(--accent)`), NEVER `rgb(var(--accent))`.** `rgb(#ea580c)` is invalid CSS → the property silently drops to `none`/black (invisible accent arrows, black text). The `--*-rgb` triplets (`--accent-rgb`, `--good-rgb`, …) are the ones for `rgb()`/`rgba()`. This bug shipped live for weeks because `preview-inline.mjs` hardcodes the color and can't see it — **verify a diagram's accent on the LIVE DOM computed style, not just the preview** (2026-08-24).

Prefer (1) for the diagram that carries a post; (2) for the rest. Mermaid path:

Render every routine diagram through **diagram-gen** (`~/code/experiments/diagram-gen`). Don't
export one from `mermaid-themes/` — its `--svg` path needs a
playwright module this repo doesn't have, and its output carries no pinned typography.

```bash
cd ~/code/experiments/diagram-gen
node render.mjs <name>.mmd --check --out ~/code/blog/public/diagrams/<name>   # light + dark
```

Commit both `<name>.light.svg` and `<name>.dark.svg`, and embed with `<picture>` so the pair
switches on `prefers-color-scheme`.

**Why the renderer and not by hand:** a mermaid label box is sized by *measuring* its text,
and that width is baked into the file while the font is not. A diagram with no pinned
font-family looks perfect opened on its own and loses the last characters of every label once
it's on a page. `npm run check:diagrams` runs the portability gate over
`public/diagrams/*.svg` and is part of `npm run build`; `diagram-gen` pins the font at render
time so the check passes by construction.

A `retro-*` theme from `mermaid-themes/` pulls a Google Font at render time — fine for **PNG**
(pixels are frozen), never safe as SVG.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
