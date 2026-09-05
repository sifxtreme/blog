import { getCollection, type CollectionEntry } from 'astro:content';

// Single source of truth for series metadata. SeriesNav (on each post) and the
// homepage both read from here so the thesis line is written once.
export const SERIES: Record<string, { blurb: string }> = {
	'Playing with hardware': {
		blurb:
			"I keep grabbing small, constrained machines and working out what they're actually for. The limits do the teaching, and the play is where the real ideas come from.",
	},
};

export type Post = CollectionEntry<'blog'>;
export interface SeriesGroup {
	name: string;
	blurb: string;
	parts: Post[]; // sorted by series.part ascending (reading order)
	latest: number; // newest pubDate in the group, for ordering groups
}

// One date-ordered feed. Each block is either a series card (dated by its most
// recent part) or a run of consecutive standalone posts. A series only floats to
// the top when its newest part is actually the newest thing; otherwise newer solo
// posts sit above it.
export type WritingBlock =
	| { kind: 'series'; group: SeriesGroup }
	| { kind: 'posts'; posts: Post[] };

export async function getWriting(): Promise<{ blocks: WritingBlock[] }> {
	const posts = await getCollection('blog');
	const byName = new Map<string, Post[]>();
	const solo: Post[] = [];

	for (const p of posts) {
		const name = p.data.series?.name;
		if (name) {
			const arr = byName.get(name) ?? [];
			arr.push(p);
			byName.set(name, arr);
		} else {
			solo.push(p);
		}
	}

	const seriesGroups: SeriesGroup[] = [...byName.entries()]
		.map(([name, parts]) => {
			parts.sort((a, b) => (a.data.series!.part) - (b.data.series!.part));
			return {
				name,
				blurb: SERIES[name]?.blurb ?? '',
				parts,
				latest: Math.max(...parts.map((p) => p.data.pubDate.valueOf())),
			};
		})
		.sort((a, b) => b.latest - a.latest);

	solo.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	// Interleave series cards and solo posts by date (newest first), then merge
	// runs of consecutive solo posts into a single list block.
	type Item =
		| { kind: 'series'; group: SeriesGroup; date: number }
		| { kind: 'post'; post: Post; date: number };
	const items: Item[] = [
		...seriesGroups.map((g) => ({ kind: 'series' as const, group: g, date: g.latest })),
		...solo.map((p) => ({ kind: 'post' as const, post: p, date: p.data.pubDate.valueOf() })),
	].sort((a, b) => b.date - a.date);

	const blocks: WritingBlock[] = [];
	for (const it of items) {
		if (it.kind === 'series') {
			blocks.push({ kind: 'series', group: it.group });
			continue;
		}
		const last = blocks[blocks.length - 1];
		if (last && last.kind === 'posts') last.posts.push(it.post);
		else blocks.push({ kind: 'posts', posts: [it.post] });
	}

	return { blocks };
}
