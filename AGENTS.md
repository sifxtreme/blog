## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Diagrams

Render every diagram through **diagram-gen** (`~/code/experiments/diagram-gen`). Don't
hand-author SVG, and don't export one from `mermaid-themes/` — its `--svg` path needs a
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
