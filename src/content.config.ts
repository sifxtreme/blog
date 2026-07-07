import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			tags: z.array(z.string()).default([]),
			// How AI was involved in writing this post. Rendered as a badge at the
			// top of every post. Defaults to fully hand-written so nothing is ever
			// silently mislabeled.
			aiUsage: z
				.enum(['handwritten', 'dictated', 'assisted'])
				.default('handwritten'),
		}),
});

export const collections = { blog };
