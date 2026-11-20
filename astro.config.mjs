// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import fs from 'node:fs';
import { defineConfig, fontProviders } from 'astro/config';

// lastmod for the sitemap: updatedDate, else pubDate, read from each post's frontmatter.
const lastmodBySlug = new Map();
for (const f of fs.readdirSync('./src/content/blog')) {
	if (!/\.mdx?$/.test(f)) continue;
	const head = fs.readFileSync(`./src/content/blog/${f}`, 'utf8').split('---')[1] ?? '';
	const get = (k) => head.match(new RegExp(`^${k}:\\s*['"]?([0-9-]+)`, 'm'))?.[1];
	const d = get('updatedDate') ?? get('pubDate');
	if (d) lastmodBySlug.set(f.replace(/\.mdx?$/, ''), new Date(d).toISOString());
}

// https://astro.build/config
export default defineConfig({
	site: 'https://sifxtreme.com',
	// expressiveCode() must come before mdx() so it processes code blocks first.
	integrations: [
		expressiveCode({
			// VS Code themes — same highlighter you use in the editor. Dual light/dark,
			// auto-switched by the reader's system preference.
			themes: ['github-dark', 'github-light'],
			styleOverrides: {
				borderRadius: '0.5rem',
				codeFontFamily:
					'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
				codeFontSize: '0.9rem',
			},
		}),
		mdx(),
		sitemap({
			// /settings/ is noindex; keep it out of the sitemap too.
			filter: (page) => !/\/settings\/?$/.test(page),
			serialize(item) {
				const slug = item.url.match(/\/blog\/([^/]+)\/?$/)?.[1];
				const lastmod = slug && lastmodBySlug.get(slug);
				return lastmod ? { ...item, lastmod } : item;
			},
		}),
	],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
