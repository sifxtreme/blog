// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { defineConfig, fontProviders } from 'astro/config';

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
		sitemap(),
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
