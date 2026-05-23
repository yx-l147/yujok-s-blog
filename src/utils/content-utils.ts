import { type CollectionEntry, getCollection, render } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import {
	getCategoryUrl,
	getColumnUrl,
	getSeriesUrl,
	getTagUrl,
} from "@utils/url-utils.ts";

export type PostEntry = CollectionEntry<"posts">;

export type PostForList = {
	id: string;
	slug: string;
	data: PostEntry["data"];
};

export type TaxonomyItem = {
	name: string;
	count: number;
	url: string;
};

export function getPostSlug(post: PostEntry | PostForList): string {
	return "slug" in post ? post.slug : post.id;
}

export function getPostCover(data: PostEntry["data"]) {
	return data.cover || data.image || "";
}

async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	return allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].id;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].id;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	return sortedFullPosts.map((post) => ({
		id: post.id,
		slug: post.id,
		data: post.data,
	}));
}

function normalizeName(name: string | null | undefined) {
	return typeof name === "string" ? name.trim() : "";
}

async function getTaxonomyList(
	getValues: (post: PostEntry) => string[],
	getUrl: (name: string) => string,
) {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: Record<string, number> = {};
	for (const post of allBlogPosts) {
		for (const value of getValues(post)) {
			const name = normalizeName(value);
			if (!name) continue;
			countMap[name] = countMap[name] ? countMap[name] + 1 : 1;
		}
	}

	return Object.keys(countMap)
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
		.map((name) => ({
			name,
			count: countMap[name],
			url: getUrl(name),
		}));
}

export async function getTagList(): Promise<TaxonomyItem[]> {
	return getTaxonomyList((post) => post.data.tags, getTagUrl);
}

export async function getCategoryList(): Promise<TaxonomyItem[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: Record<string, number> = {};
	for (const post of allBlogPosts) {
		const category =
			normalizeName(post.data.category) || i18n(I18nKey.uncategorized);
		count[category] = count[category] ? count[category] + 1 : 1;
	}

	return Object.keys(count)
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
		.map((name) => ({
			name,
			count: count[name],
			url: getCategoryUrl(name),
		}));
}

export async function getSeriesList(): Promise<TaxonomyItem[]> {
	return getTaxonomyList(
		(post) => (post.data.series ? [post.data.series] : []),
		getSeriesUrl,
	);
}

export async function getColumnList(): Promise<TaxonomyItem[]> {
	return getTaxonomyList(
		(post) => (post.data.column ? [post.data.column] : []),
		getColumnUrl,
	);
}

export async function getPostExcerpt(post: PostEntry) {
	if (post.data.description) return post.data.description;
	const { remarkPluginFrontmatter } = await render(post);
	return String(remarkPluginFrontmatter.excerpt || "");
}

export async function getPostReadingStats(post: PostEntry) {
	const { remarkPluginFrontmatter } = await render(post);
	return {
		words: Number(remarkPluginFrontmatter.words || 0),
		minutes: Number(remarkPluginFrontmatter.minutes || 1),
		excerpt: String(remarkPluginFrontmatter.excerpt || ""),
	};
}
