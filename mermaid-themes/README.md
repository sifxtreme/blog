# Mermaid theme kit

Reusable Mermaid diagram themes for the blog, X, LinkedIn, and work diagrams.
One source of truth (`themes.mjs`), consumed by a live reference gallery and a
PNG export CLI.

## Themes

| key | use | look |
| --- | --- | --- |
| `sifxtreme-light` | blog, LinkedIn | warm paper, ink, one orange accent, mono labels, semantic stage colors |
| `sifxtreme-dark` | X (dark feed) | same system on a deep dark ground |
| `brutalist` | standout post | black on white, hard offset shadow, Courier |
| `sci-fi-hud` | standout post | cyan on near-black, scanlines, glow |
| `pop-art` | standout post | halftone yellow, comic-book primaries |
| `bauhaus` | standout post | red / yellow / blue geometry, Helvetica |

`sifxtreme-light` / `sifxtreme-dark` are the default. Use one signature look
everywhere so a diagram reads as mine at a glance. The four bold themes are for
the occasional post that wants to stand out, not channel defaults.

## Reference gallery

Open `gallery.html` in a browser to see every theme rendered live, click any
tile to expand it and copy the config, classDefs, and CSS.

```
open -a "Google Chrome" gallery.html
```

## Export a PNG

```
node render.mjs <theme> <file.mmd> [--out path] [--size WxH] [--svg]
```

The social cards in `examples/` were made with:

```
node render.mjs sifxtreme-dark  examples/pipeline.mmd --size 1600x900  --out examples/x-dark.png
node render.mjs sifxtreme-light examples/pipeline.mmd --size 1200x1200 --out examples/linkedin-light.png
```

PNG export uses the Playwright CLI (`npx playwright screenshot`). Run
`npx playwright install chromium` once if it is not present. `--svg` needs
Playwright as a module (`npm i -D playwright`).

## How a theme works

Three layers, because a plain color palette cannot express a full look:

1. **`mermaid`** config passed to `mermaid.initialize()` (font, spacing, line color).
2. **`classDefs`** appended to the diagram body. `classDef default` styles every
   unclassed node, so any work diagram looks on-brand with no extra effort. Add
   `:::start`, `:::decide`, `:::work`, `:::done` to nodes for the semantic story
   (neutral start, teal decision, amber work, orange done).
3. **`skin`** CSS on the rendered SVG for the parts config cannot reach (mono
   labels, ink arrowheads, character-theme shadows and fills). `PREFIX` is
   replaced with a scoped selector so two themes never collide on one page.

The one accent color is written as the token `ACCENT` in a diagram; the renderer
substitutes each theme's accent, so `linkStyle` and highlights follow the theme.

## Using it in a blog post

The blog does not render Mermaid yet. Two paths:

- **Static image**: export a PNG or SVG with `render.mjs` and drop it in a post.
  Zero runtime cost, works today.
- **Live in MDX** (later): add `rehype-mermaid` to `astro.config.mjs` and feed it
  a stylesheet built from a theme's `skin`. Not wired up yet.

## Using it for work

`themes.mjs` and `render.mjs` are self-contained and have no repo-specific
imports. Copy the folder into any project, or point `render.mjs` at a `.mmd`
from anywhere. Diagrams get the on-brand base look automatically; add the stage
classes when the flow has a real decision or a terminal state.

## Adding a theme

Add one entry to `THEMES` in `themes.mjs`. The gallery and the CLI pick it up
with no other changes.
