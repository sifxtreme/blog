// Generate a branded 1200x630 OG card per post (title-forward) + a default
// brand card. Runs before `astro build`. Output → public/og.png and public/og/<slug>.png.
import sharp from 'sharp';
import {
  readFileSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AVATAR = readFileSync(join(ROOT, 'src/assets/asif-head.png')).toString('base64');
const POSTS_DIR = join(ROOT, 'src/content/blog');
const OG_DIR = join(ROOT, 'public/og');
const TAGLINE = ['building workflows +', 'solving problems with AI'];
const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif';
const MONO = 'Menlo, Monaco, monospace';

mkdirSync(OG_DIR, { recursive: true });

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if (line && (line + ' ' + w).length > maxChars) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const DEFS = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#17171c"/><stop offset="1" stop-color="#0c0c0f"/>
  </linearGradient>
  <clipPath id="big"><circle cx="300" cy="300" r="150"/></clipPath>
  <clipPath id="sm"><circle cx="128" cy="524" r="48"/></clipPath>
</defs>`;

const FRAME = `<rect width="1200" height="630" fill="url(#bg)"/>
<rect x="0" y="0" width="1200" height="12" fill="#ea580c"/>`;

// Small avatar + name + url, bottom-left — the byline on a post card.
const BYLINE = `<image x="80" y="476" width="96" height="96" preserveAspectRatio="xMidYMid slice" clip-path="url(#sm)" xlink:href="data:image/png;base64,${AVATAR}"/>
<circle cx="128" cy="524" r="48" fill="none" stroke="#ea580c" stroke-width="4"/>
<text x="200" y="514" font-family="${SANS}" font-size="34" font-weight="700" fill="#f4f4f5">Asif Ahmed</text>
<text x="200" y="550" font-family="${MONO}" font-size="24" fill="#928c7f">sifxtreme.com</text>`;

function svg(inner) {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${DEFS}${FRAME}${inner}</svg>`;
}

async function renderPost(title, slug) {
  const lines = wrap(title, 22);
  const fs = lines.length > 3 ? 52 : 66;
  const lineH = Math.round(fs * 1.15);
  const blockH = (lines.length - 1) * lineH;
  const firstBaseline = Math.round(255 - blockH / 2); // center in the upper region
  const tspans = lines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : lineH}">${esc(l)}</tspan>`)
    .join('');
  const inner = `<text x="80" y="${firstBaseline}" font-family="${SANS}" font-size="${fs}" font-weight="700" fill="#f4f4f5" letter-spacing="-1.5">${tspans}</text>${BYLINE}`;
  await sharp(Buffer.from(svg(inner))).png().toFile(join(OG_DIR, `${slug}.png`));
}

async function renderDefault() {
  const inner = `<image x="150" y="150" width="300" height="300" preserveAspectRatio="xMidYMid slice" clip-path="url(#big)" xlink:href="data:image/png;base64,${AVATAR}"/>
  <circle cx="300" cy="300" r="150" fill="none" stroke="#ea580c" stroke-width="6"/>
  <text x="514" y="278" font-family="${SANS}" font-size="92" font-weight="700" fill="#f4f4f5" letter-spacing="-3">Asif Ahmed</text>
  <text x="518" y="342" font-family="${SANS}" font-size="36" font-weight="400" fill="#fb8b4c">${esc(TAGLINE[0])}</text>
  <text x="518" y="388" font-family="${SANS}" font-size="36" font-weight="400" fill="#fb8b4c">${esc(TAGLINE[1])}</text>
  <text x="518" y="470" font-family="${MONO}" font-size="30" fill="#928c7f">sifxtreme.com</text>`;
  const buf = await sharp(Buffer.from(svg(inner))).png().toBuffer();
  writeFileSync(join(ROOT, 'public/og.png'), buf);
}

function postTitle(file) {
  const src = readFileSync(join(POSTS_DIR, file), 'utf8');
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '';
  const raw = fm.match(/^title:\s*(.+)$/m)?.[1]?.trim() || file;
  return raw.replace(/^['"]|['"]$/g, '');
}

const posts = readdirSync(POSTS_DIR).filter((f) => /\.(md|mdx)$/.test(f));
await renderDefault();
for (const f of posts) {
  const slug = f.replace(/\.(md|mdx)$/, '');
  await renderPost(postTitle(f), slug);
}
console.log(`OG cards: default + ${posts.length} post card(s) → public/og/`);
