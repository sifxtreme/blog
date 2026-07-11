#!/usr/bin/env node
/*
  Generate a self-contained gallery.html from themes.mjs.

  The gallery imports Mermaid from a CDN (allowed over file://) but inlines the
  theme data and skin CSS, so it opens by double-click without a local server
  (a bare `import ./themes.mjs` is blocked by the browser over file://).

  Run after editing themes.mjs:  node build-gallery.mjs
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES, THEME_KEYS, MERMAID_CDN, prepareBody, skinFor } from './themes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

const BODY = `flowchart LR
  A([Idea]):::start --> B{Review}:::decide
  B -->|ship| C[Build]:::work
  B -->|nope| A
  C --> D[Deploy]:::work
  D --> E((Live)):::done
  linkStyle 4 stroke:ACCENT,stroke-width:2px;`;

const data = THEME_KEYS.map((k) => {
  const t = THEMES[k];
  const recipe =
    `# config -> mermaid.initialize()\n${JSON.stringify(t.mermaid, null, 2)}\n\n` +
    (t.classDefs ? `# classDefs appended to the diagram body\n${t.classDefs}\n\n` : '') +
    `/* CSS on the rendered SVG (scope to your container) */\n${t.skin.replaceAll('PREFIX', '.diagram')}`;
  return { key: k, label: t.label, mode: t.mode, bg: t.bg, config: t.mermaid, body: prepareBody(k, BODY), recipe };
});

const skinCss = THEME_KEYS
  .map((k) =>
    skinFor(k, `#p-${k} .stage`) + '\n' +
    skinFor(k, `#modal.show-${k} .mstage`) + '\n' +
    `#p-${k} .stage{ background:${THEMES[k].bg}; }`)
  .join('\n');

const fontLinks = [...new Set(THEME_KEYS.map((k) => THEMES[k].fontImport).filter(Boolean))]
  .map((u) => `<link rel="stylesheet" href="${u}">`).join('\n');
const fontProbeLoads = [...new Set(THEME_KEYS.map((k) => THEMES[k].fontProbe).filter(Boolean))]
  .map((p) => `try{ await document.fonts.load('700 16px "${p}"'); }catch(e){}`).join(' ');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mermaid theme kit — reference</title>
${fontLinks}
<style>
  :root{ color-scheme:dark; } *{ box-sizing:border-box; }
  body{ margin:0; padding:32px 22px 70px; background:#101216; color:#e7e9ee; font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
  header{ max-width:1180px; margin:0 auto 24px; }
  h1{ font-size:25px; margin:0 0 6px; letter-spacing:-.02em; }
  header p{ margin:0; color:#9aa0ab; max-width:76ch; }
  header .hint{ margin-top:9px; font-size:13px; color:#7bd88f; }
  .grid{ max-width:1180px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:18px; }
  .panel{ margin:0; border:1px solid #262b34; border-radius:14px; overflow:hidden; background:#171a21; cursor:pointer; transition:transform .12s, border-color .12s; }
  .panel:hover{ transform:translateY(-3px); border-color:#4b5566; }
  .cap{ display:flex; justify-content:space-between; align-items:baseline; padding:11px 15px; border-bottom:1px solid #262b34; }
  .cap .name{ font-weight:700; font-size:14px; } .cap .mode{ font-size:10.5px; color:#8b93a1; font-family:ui-monospace,Menlo,monospace; text-transform:uppercase; letter-spacing:.06em; }
  .stage{ display:grid; place-items:center; padding:24px 14px; min-height:200px; }
  .stage svg{ max-width:100%; height:auto; }
  #modal{ position:fixed; inset:0; z-index:50; display:none; place-items:center; background:#000b; backdrop-filter:blur(4px); padding:22px; }
  #modal.open{ display:grid; }
  .sheet{ width:min(900px,96vw); max-height:92vh; overflow:auto; border-radius:16px; background:#15181e; border:1px solid #333; }
  .sheet-head{ position:sticky; top:0; background:#15181e; display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #262b34; }
  .sheet-head h2{ margin:0; font-size:18px; }
  .xbtn,.copy{ border:1px solid #3a3f4b; background:#20242c; color:#e7e9ee; border-radius:9px; padding:6px 12px; cursor:pointer; font-size:13px; }
  .xbtn:hover,.copy:hover{ background:#2a2f39; }
  .mstage{ display:grid; place-items:center; padding:34px 20px; }
  .mstage svg{ width:min(720px,86vw)!important; max-width:100%!important; height:auto; }
  .code-wrap{ padding:0 20px 22px; }
  .code-bar{ display:flex; justify-content:space-between; align-items:center; margin:6px 0 8px; }
  .code-bar span{ font-size:12px; color:#8b93a1; text-transform:uppercase; letter-spacing:.06em; }
  pre.code{ margin:0; padding:14px 16px; background:#0c0e12; border:1px solid #262b34; border-radius:10px; overflow-x:auto; font:12.5px/1.55 ui-monospace,Menlo,monospace; color:#d7dde8; white-space:pre; }
  /* --- theme skins (generated from themes.mjs) --- */
${skinCss}
</style>
</head>
<body>
<header>
  <h1>Mermaid theme kit</h1>
  <p>Every theme is defined once in <code>themes.mjs</code> and rendered live below. Two on-brand modes for the blog, X, and LinkedIn, plus four bold themes for standout posts.</p>
  <p class="hint">&#9656; Click a tile to expand it and copy the config, classDefs, and CSS. Regenerate with <code>node build-gallery.mjs</code>.</p>
</header>
<div class="grid" id="grid"></div>
<div id="modal"><div class="sheet">
  <div class="sheet-head"><h2 id="m-name"></h2><button class="xbtn" id="m-close">&#10005; Close</button></div>
  <div class="mstage" id="m-stage"></div>
  <div class="code-wrap"><div class="code-bar"><span>Recipe</span><button class="copy" id="m-copy">Copy</button></div><pre class="code" id="m-code"></pre></div>
</div></div>
<script type="module">
import mermaid from '${MERMAID_CDN}';
const DATA = ${JSON.stringify(data)};
const grid = document.getElementById('grid');
for (const t of DATA) {
  const fig = document.createElement('figure');
  fig.className = 'panel'; fig.id = 'p-' + t.key; fig.dataset.k = t.key;
  fig.innerHTML = '<figcaption class="cap"><span class="name">' + t.label + '</span><span class="mode">' + t.mode + '</span></figcaption><div class="stage"></div>';
  grid.appendChild(fig);
}
${fontProbeLoads}
try{ if (document.fonts && document.fonts.ready) await document.fonts.ready; }catch(e){}
mermaid.initialize({ startOnLoad:false, securityLevel:'loose' });
for (const t of DATA) {
  try {
    mermaid.initialize({ startOnLoad:false, securityLevel:'loose', ...t.config });
    const { svg } = await mermaid.render('g-' + t.key, t.body);
    document.querySelector('#p-' + t.key + ' .stage').innerHTML = svg;
  } catch (e) { document.querySelector('#p-' + t.key + ' .stage').textContent = 'error: ' + e.message; }
}
const modal = document.getElementById('modal'), byKey = Object.fromEntries(DATA.map(t => [t.key, t]));
function open(k){
  const t = byKey[k];
  document.getElementById('m-name').textContent = t.label;
  document.getElementById('m-stage').innerHTML = document.querySelector('#p-' + k + ' .stage').innerHTML;
  document.getElementById('m-code').textContent = t.recipe;
  modal.className = 'open show-' + k;
}
grid.addEventListener('click', e => { const p = e.target.closest('.panel'); if (p) open(p.dataset.k); });
document.getElementById('m-close').addEventListener('click', () => modal.className = '');
modal.addEventListener('click', e => { if (e.target === modal) modal.className = ''; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.className = ''; });
document.getElementById('m-copy').addEventListener('click', async () => {
  const btn = document.getElementById('m-copy'), txt = document.getElementById('m-code').textContent;
  try { await navigator.clipboard.writeText(txt); }
  catch { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  btn.textContent = 'Copied ✓'; setTimeout(() => btn.textContent = 'Copy', 1400);
});
</script>
</body>
</html>`;

fs.writeFileSync(path.join(here, 'gallery.html'), html);
console.log('✓ wrote gallery.html (' + THEME_KEYS.length + ' themes)');
