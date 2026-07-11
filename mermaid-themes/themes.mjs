/*
  Mermaid theme kit for sifxtreme.
  One source of truth, consumed by gallery.html (browser) and render.mjs (Node).
  Pure data plus small string helpers, no dependencies, so it imports in both.

  A theme is:
    bg        page background behind the diagram
    accent    the one accent color (substituted for the token ACCENT in a diagram)
    mermaid   config passed to mermaid.initialize()
    classDefs mermaid classDef lines appended to every diagram body.
              "classDef default" styles unclassed nodes, so any work diagram
              looks on-brand even without stage labels. Add :::start :::decide
              :::work :::done to nodes for the semantic color story.
    skin      extra CSS on the rendered SVG. PREFIX is replaced with a scoped
              selector (font, arrowheads, edge-label background, or, for the
              character themes, the full look).

  Brand tokens come straight from src/styles/global.css.
*/

const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

export const THEMES = {
  'sifxtreme-light': {
    label: 'Sifxtreme (light)',
    mode: 'light',
    bg: '#fdfbf8',
    accent: '#ea580c',
    mermaid: {
      theme: 'base',
      themeVariables: { fontFamily: MONO, lineColor: '#2c2c34', edgeLabelBackground: '#fdfbf8' },
      flowchart: { nodeSpacing: 64, rankSpacing: 90, padding: 14 },
    },
    classDefs: [
      'classDef default fill:#ffffff,stroke:#121216,color:#121216,stroke-width:1.5px;',
      'classDef start   fill:#e9e7e2,stroke:#121216,color:#121216;',
      'classDef decide  fill:#dcebed,stroke:#36727b,color:#245862;',
      'classDef work    fill:#fbe6cf,stroke:#121216,color:#121216;',
      'classDef done    fill:#ea580c,stroke:#ea580c,color:#ffffff;',
    ].join('\n'),
    skin: [
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:' + MONO + '!important; font-weight:600!important; }',
      'PREFIX .node rect, PREFIX .node polygon{ rx:6!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#2c2c34!important; stroke:#2c2c34!important; }',
      'PREFIX .edgeLabel rect{ fill:#fdfbf8!important; }',
    ].join('\n'),
  },

  'sifxtreme-dark': {
    label: 'Sifxtreme (dark)',
    mode: 'dark',
    bg: '#0f0f12',
    accent: '#fb923c',
    mermaid: {
      theme: 'base',
      themeVariables: { fontFamily: MONO, lineColor: '#9494a0', edgeLabelBackground: '#0f0f12' },
      flowchart: { nodeSpacing: 64, rankSpacing: 90, padding: 14 },
    },
    classDefs: [
      'classDef default fill:#17171c,stroke:#d6d6e0,color:#f0f0f5,stroke-width:1.5px;',
      'classDef start   fill:#24242b,stroke:#4a4a55,color:#f0f0f5;',
      'classDef decide  fill:#16323a,stroke:#4a8f9c,color:#a9dbe4;',
      'classDef work    fill:#2e2416,stroke:#7a5a2e,color:#f0d9ad;',
      'classDef done    fill:#fb923c,stroke:#fb923c,color:#14140f;',
    ].join('\n'),
    skin: [
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:' + MONO + '!important; font-weight:600!important; }',
      'PREFIX .node rect, PREFIX .node polygon{ rx:6!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#9494a0!important; stroke:#9494a0!important; }',
      'PREFIX .edgeLabel rect{ fill:#0f0f12!important; }',
    ].join('\n'),
  },

  // ---- character themes (bold, for the occasional standout post) ----
  brutalist: {
    label: 'Brutalist',
    mode: 'light',
    bg: '#f2f2f2',
    accent: '#000000',
    mermaid: { theme: 'base', themeVariables: { fontFamily: '"Courier New", monospace' } },
    classDefs: '',
    skin: [
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:"Courier New",monospace!important; font-weight:700!important; color:#000!important; fill:#000!important; }',
      'PREFIX .node rect, PREFIX .node polygon, PREFIX .node circle{ fill:#fff!important; stroke:#000!important; stroke-width:3px!important; rx:0!important; }',
      'PREFIX .flowchart-link, PREFIX .edgePaths path{ stroke:#000!important; stroke-width:3px!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#000!important; stroke:#000!important; }',
      'PREFIX .node{ filter:drop-shadow(6px 6px 0 #000); }',
      'PREFIX .edgeLabel rect{ fill:#ffe600!important; }',
    ].join('\n'),
    note: 'Reads best with UPPERCASE labels.',
  },

  'sci-fi-hud': {
    label: 'Sci-fi HUD',
    mode: 'dark',
    bg: '#04121a',
    accent: '#00e5ff',
    mermaid: { theme: 'dark', themeVariables: { fontFamily: MONO } },
    classDefs: '',
    skin: [
      'PREFIX{ background-image:repeating-linear-gradient(#00e5ff10 0 1px,transparent 1px 3px); }',
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:' + MONO + '!important; color:#aef7ff!important; fill:#aef7ff!important; letter-spacing:.05em; }',
      'PREFIX .node rect, PREFIX .node polygon, PREFIX .node circle{ fill:#00e5ff14!important; stroke:#00e5ff!important; stroke-width:1px!important; rx:0!important; }',
      'PREFIX .flowchart-link, PREFIX .edgePaths path{ stroke:#00e5ff!important; stroke-width:1px!important; stroke-dasharray:2 3!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#00e5ff!important; stroke:#00e5ff!important; }',
      'PREFIX .node{ filter:drop-shadow(0 0 5px #00e5ff88); }',
      'PREFIX .edgeLabel rect{ fill:#04121a!important; }',
    ].join('\n'),
  },

  'pop-art': {
    label: 'Pop Art',
    mode: 'light',
    bg: '#ffd23f',
    accent: '#2e6bff',
    mermaid: { theme: 'base', themeVariables: { fontFamily: '"Arial Black", Impact, sans-serif' } },
    classDefs: '',
    skin: [
      'PREFIX{ background-image:radial-gradient(#00000022 2px,transparent 2px); background-size:14px 14px; }',
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:"Arial Black",Impact,sans-serif!important; color:#000!important; fill:#000!important; }',
      'PREFIX .node rect{ fill:#ff3b3b!important; }',
      'PREFIX .node polygon{ fill:#ffe600!important; }',
      'PREFIX .node circle{ fill:#2e6bff!important; }',
      'PREFIX .node rect, PREFIX .node polygon, PREFIX .node circle{ stroke:#000!important; stroke-width:4px!important; rx:0!important; }',
      'PREFIX .flowchart-link, PREFIX .edgePaths path{ stroke:#000!important; stroke-width:4px!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#000!important; stroke:#000!important; }',
      'PREFIX .node{ filter:drop-shadow(4px 4px 0 #000); }',
      'PREFIX .edgeLabel rect{ fill:#ffd23f!important; }',
    ].join('\n'),
    note: 'Reads best with UPPERCASE labels.',
  },

  bauhaus: {
    label: 'Bauhaus',
    mode: 'light',
    bg: '#efe9dd',
    accent: '#1d4ed8',
    mermaid: { theme: 'base', themeVariables: { fontFamily: 'Helvetica, Arial, sans-serif' } },
    classDefs: '',
    skin: [
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:Helvetica,Arial,sans-serif!important; font-weight:800!important; color:#111!important; fill:#111!important; }',
      'PREFIX .node rect{ fill:#e63946!important; }',
      'PREFIX .node polygon{ fill:#f4c20d!important; }',
      'PREFIX .node circle{ fill:#1d4ed8!important; }',
      'PREFIX .node rect, PREFIX .node polygon, PREFIX .node circle{ stroke:#111!important; stroke-width:3px!important; rx:0!important; }',
      'PREFIX .flowchart-link, PREFIX .edgePaths path{ stroke:#111!important; stroke-width:3px!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#111!important; stroke:#111!important; }',
      'PREFIX .edgeLabel rect{ fill:#efe9dd!important; }',
    ].join('\n'),
    note: 'Reads best with UPPERCASE labels.',
  },

  // ---- retro 16-bit RPG variants (pixel font via Google Fonts) ----
  'retro-forest': {
    label: 'Retro · Forest RPG',
    mode: 'dark',
    bg: '#16241a',
    accent: '#ea580c',
    fontImport: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap',
    fontProbe: 'Pixelify Sans',
    mermaid: {
      theme: 'base',
      themeVariables: { fontFamily: '"Pixelify Sans", "Courier New", monospace', lineColor: '#6a4326', edgeLabelBackground: '#f4e4c1' },
      flowchart: { nodeSpacing: 66, rankSpacing: 92, padding: 18 },
    },
    classDefs: [
      'classDef default fill:#f4e4c1,stroke:#5a3a22,color:#3a2a18,stroke-width:3px;',
      'classDef start   fill:#f8eed2,stroke:#5a3a22,color:#3a2a18,stroke-width:3px;',
      'classDef decide  fill:#cfe0a8,stroke:#3f6b2e,color:#24401a,stroke-width:3px;',
      'classDef work    fill:#e9c896,stroke:#7a4a24,color:#3a2410,stroke-width:3px;',
      'classDef done    fill:#ea580c,stroke:#a8380a,color:#ffffff,stroke-width:3px;',
    ].join('\n'),
    skin: [
      'PREFIX{ background-image:linear-gradient(#ffffff0a 1px,transparent 1px),linear-gradient(90deg,#ffffff0a 1px,transparent 1px); background-size:16px 16px; }',
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:"Pixelify Sans","Courier New",monospace!important; font-weight:700!important; }',
      'PREFIX .edgeLabel{ color:#3a2a18!important; }',
      'PREFIX .node rect, PREFIX .node polygon, PREFIX .node circle{ rx:0!important; }',
      'PREFIX .node{ filter:drop-shadow(4px 4px 0 #0c140e); }',
      'PREFIX .flowchart-link, PREFIX .edgePaths path{ stroke:#6a4326!important; stroke-width:2.5px!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#6a4326!important; stroke:#6a4326!important; }',
      'PREFIX .edgeLabel rect{ fill:#f4e4c1!important; }',
    ].join('\n'),
    note: 'Matches the pixel avatar. Pixel font loads from Google Fonts (needs network at render).',
  },

  'retro-chrono': {
    label: 'Retro · Chrono (blue menu)',
    mode: 'dark',
    bg: '#0a1024',
    accent: '#ea580c',
    fontImport: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap',
    fontProbe: 'Pixelify Sans',
    mermaid: {
      theme: 'base',
      themeVariables: { fontFamily: '"Pixelify Sans", "Courier New", monospace', lineColor: '#8fc7ff', edgeLabelBackground: '#12224a' },
      flowchart: { nodeSpacing: 66, rankSpacing: 92, padding: 18 },
    },
    classDefs: [
      'classDef default fill:#22357a,stroke:#8fc7ff,color:#ffffff,stroke-width:3px;',
      'classDef start   fill:#2a3f8f,stroke:#a9c8ff,color:#ffffff,stroke-width:3px;',
      'classDef decide  fill:#17496a,stroke:#5fd0e0,color:#dffaff,stroke-width:3px;',
      'classDef work    fill:#22357a,stroke:#8fc7ff,color:#ffffff,stroke-width:3px;',
      'classDef done    fill:#ea580c,stroke:#ffcaa0,color:#ffffff,stroke-width:3px;',
    ].join('\n'),
    skin: [
      'PREFIX{ background-image:linear-gradient(#ffffff0a 1px,transparent 1px),linear-gradient(90deg,#ffffff0a 1px,transparent 1px); background-size:16px 16px; }',
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:"Pixelify Sans","Courier New",monospace!important; font-weight:700!important; }',
      'PREFIX .edgeLabel{ color:#cfe0ff!important; }',
      'PREFIX .node rect, PREFIX .node polygon, PREFIX .node circle{ rx:0!important; }',
      'PREFIX .node{ filter:drop-shadow(3px 3px 0 #050a18); }',
      'PREFIX .flowchart-link, PREFIX .edgePaths path{ stroke:#8fc7ff!important; stroke-width:2.5px!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#8fc7ff!important; stroke:#8fc7ff!important; }',
      'PREFIX .edgeLabel rect{ fill:#12224a!important; }',
    ].join('\n'),
    note: 'SNES JRPG command-window blue. Pixel font loads from Google Fonts.',
  },

  'retro-gameboy': {
    label: 'Retro · Game Boy (mono)',
    mode: 'light',
    bg: '#9bbc0f',
    accent: '#0f380f',
    fontImport: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap',
    fontProbe: 'Pixelify Sans',
    mermaid: {
      theme: 'base',
      themeVariables: { fontFamily: '"Pixelify Sans", "Courier New", monospace', lineColor: '#0f380f', edgeLabelBackground: '#9bbc0f' },
      flowchart: { nodeSpacing: 66, rankSpacing: 92, padding: 18 },
    },
    classDefs: [
      'classDef default fill:#8bac0f,stroke:#0f380f,color:#0f380f,stroke-width:3px;',
      'classDef start   fill:#b6cc5e,stroke:#0f380f,color:#0f380f,stroke-width:3px;',
      'classDef decide  fill:#306230,stroke:#0f380f,color:#9bbc0f,stroke-width:3px;',
      'classDef work    fill:#8bac0f,stroke:#0f380f,color:#0f380f,stroke-width:3px;',
      'classDef done    fill:#0f380f,stroke:#0f380f,color:#9bbc0f,stroke-width:3px;',
    ].join('\n'),
    skin: [
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:"Pixelify Sans","Courier New",monospace!important; font-weight:700!important; }',
      'PREFIX .edgeLabel{ color:#0f380f!important; }',
      'PREFIX .node rect, PREFIX .node polygon, PREFIX .node circle{ rx:0!important; }',
      'PREFIX .node{ filter:drop-shadow(3px 3px 0 #306230); }',
      'PREFIX .flowchart-link, PREFIX .edgePaths path{ stroke:#0f380f!important; stroke-width:2.5px!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#0f380f!important; stroke:#0f380f!important; }',
      'PREFIX .edgeLabel rect{ fill:#9bbc0f!important; }',
    ].join('\n'),
    note: 'DMG 4-green monochrome (no brand orange, on purpose). Pixel font from Google Fonts.',
  },

  'retro-dq': {
    label: 'Retro · Dragon Quest (window)',
    mode: 'dark',
    bg: '#000000',
    accent: '#ea580c',
    fontImport: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&display=swap',
    fontProbe: 'Pixelify Sans',
    mermaid: {
      theme: 'base',
      themeVariables: { fontFamily: '"Pixelify Sans", "Courier New", monospace', lineColor: '#e8e8f0', edgeLabelBackground: '#000000' },
      flowchart: { nodeSpacing: 66, rankSpacing: 92, padding: 18 },
    },
    classDefs: [
      'classDef default fill:#0c1430,stroke:#ffffff,color:#ffffff,stroke-width:3px;',
      'classDef start   fill:#141c3a,stroke:#ffffff,color:#ffffff,stroke-width:3px;',
      'classDef decide  fill:#10244a,stroke:#a9d6ff,color:#dbeeff,stroke-width:3px;',
      'classDef work    fill:#0c1430,stroke:#ffffff,color:#ffffff,stroke-width:3px;',
      'classDef done    fill:#ea580c,stroke:#ffffff,color:#ffffff,stroke-width:3px;',
    ].join('\n'),
    skin: [
      'PREFIX .nodeLabel, PREFIX .edgeLabel{ font-family:"Pixelify Sans","Courier New",monospace!important; font-weight:700!important; }',
      'PREFIX .edgeLabel{ color:#ffffff!important; }',
      'PREFIX .node rect, PREFIX .node polygon, PREFIX .node circle{ rx:0!important; }',
      'PREFIX .node{ filter:drop-shadow(3px 3px 0 #1a1a2a); }',
      'PREFIX .flowchart-link, PREFIX .edgePaths path{ stroke:#e8e8f0!important; stroke-width:2.5px!important; }',
      'PREFIX .marker, PREFIX marker path{ fill:#e8e8f0!important; stroke:#e8e8f0!important; }',
      'PREFIX .edgeLabel rect{ fill:#000000!important; }',
    ].join('\n'),
    note: 'Black command-window with white pixel border, brand orange terminal. Pixel font from Google Fonts.',
  },
};

export const THEME_KEYS = Object.keys(THEMES);
export const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.esm.min.mjs';

// Replace ACCENT token, then append the theme's classDefs to the diagram body.
export function prepareBody(key, body) {
  const t = THEMES[key];
  const withAccent = body.replaceAll('ACCENT', t.accent);
  return t.classDefs ? withAccent + '\n' + t.classDefs : withAccent;
}

// Scope the theme's skin CSS to a given selector prefix (e.g. '.stage', '#p2').
export function skinFor(key, prefix) {
  return THEMES[key].skin.replaceAll('PREFIX', prefix);
}

// Full standalone HTML for one centered diagram. Used by render.mjs and openable directly.
export function pageHtml(key, body, { width, height, padding = 48 } = {}) {
  const t = THEMES[key];
  const sized = width && height;
  const dims = sized
    ? `width:${width}px;height:${height}px;overflow:hidden;`
    : `min-height:100vh;`;
  const stageSize = sized ? `width:${width}px;height:${height}px;` : '';
  const svgCss = sized
    ? `width:100%!important;max-width:100%!important;max-height:${height - padding * 2}px!important;height:auto!important;`
    : 'max-width:100%;height:auto;';
  return `<!doctype html><html><head><meta charset="utf-8">
${t.fontImport ? `<link rel="stylesheet" href="${t.fontImport}">` : ''}
<style>
  *{ box-sizing:border-box; }
  html,body{ margin:0; }
  body{ ${dims} background:${t.bg}; display:grid; place-items:center; }
  .stage{ ${stageSize} padding:${padding}px; display:grid; place-items:center; }
  .stage svg{ ${svgCss} }
  ${skinFor(key, '.stage')}
</style></head>
<body><div class="stage" id="stage"></div>
<script type="module">
  import mermaid from '${MERMAID_CDN}';
  ${t.fontProbe ? `try{ await document.fonts.load('700 16px "${t.fontProbe}"'); }catch(e){}` : ''}
  try{ if (document.fonts && document.fonts.ready) await document.fonts.ready; }catch(e){}
  mermaid.initialize({ startOnLoad:false, securityLevel:'loose', ${JSON.stringify(t.mermaid).slice(1, -1)} });
  const { svg } = await mermaid.render('d', ${JSON.stringify(prepareBody(key, body))});
  document.getElementById('stage').innerHTML = svg;
  window.__rendered = true;
</script></body></html>`;
}
