#!/usr/bin/env node
/*
  Render a Mermaid diagram in one of the kit themes to a PNG (or SVG).

  Usage:
    node render.mjs <theme> <file.mmd> [--out path] [--size WxH] [--svg]

  Examples:
    node render.mjs sifxtreme-dark examples/pipeline.mmd --size 1600x900 --out examples/x-dark.png
    node render.mjs sifxtreme-light examples/pipeline.mmd --size 1200x1200 --out examples/linkedin.png
    node render.mjs brutalist examples/pipeline.mmd            # auto-size PNG

  PNG uses the globally available Playwright CLI (npx playwright screenshot).
  --svg needs the playwright module importable (npm i -D playwright).
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { THEMES, THEME_KEYS, pageHtml, prepareBody } from './themes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const has = (name) => args.includes(name);

const theme = args[0];
const mmd = args[1];
if (!theme || !mmd || !THEMES[theme]) {
  console.error('Usage: node render.mjs <theme> <file.mmd> [--out path] [--size WxH] [--svg]');
  console.error('Themes: ' + THEME_KEYS.join(', '));
  process.exit(1);
}

const body = fs.readFileSync(path.resolve(mmd), 'utf8').trim();
const size = flag('--size');
const [width, height] = size ? size.split('x').map(Number) : [];
const wantSvg = has('--svg');
const base = path.basename(mmd).replace(/\.mmd$/, '');
const out = flag('--out') || path.join(here, 'examples', `${base}-${theme}.${wantSvg ? 'svg' : 'png'}`);
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });

const html = pageHtml(theme, body, size ? { width, height } : {});
const tmp = path.join(os.tmpdir(), `mmd-${theme}-${base}-${process.pid}.html`);
fs.writeFileSync(tmp, html);
const fileUrl = 'file://' + tmp;

if (wantSvg) {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { console.error('--svg needs Playwright as a module: npm i -D playwright'); process.exit(1); }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(fileUrl);
  await page.waitForFunction('window.__rendered === true', { timeout: 15000 });
  const svg = await page.$eval('#stage', (el) => el.innerHTML);
  fs.writeFileSync(path.resolve(out), svg);
  await browser.close();
} else {
  const pwArgs = ['--no-install', 'playwright', 'screenshot', '--wait-for-timeout', '5000'];
  if (size) pwArgs.push('--viewport-size', `${width},${height}`);
  else pwArgs.push('--full-page', '--viewport-size', '1200,800');
  pwArgs.push(fileUrl, path.resolve(out));
  execFileSync('npx', pwArgs, { stdio: 'inherit' });
}

fs.rmSync(tmp, { force: true });
console.log(`✓ ${theme} → ${path.relative(process.cwd(), path.resolve(out))}`);
