import {
	getPostCover,
	getPostExcerpt,
	getSortedPosts,
} from "@utils/content-utils";
import { getCategoryUrl, getPostUrlBySlug } from "@utils/url-utils";
import type { APIContext } from "astro";

export async function GET(_context: APIContext) {
	const posts = await getSortedPosts();
	const items = await Promise.all(
		posts.map(async (post) => ({
			id: post.id,
			title: post.data.title,
			description: post.data.description || (await getPostExcerpt(post)),
			url: getPostUrlBySlug(post.id),
			category: post.data.category,
			categoryUrl: getCategoryUrl(post.data.category),
			tags: post.data.tags,
			series: post.data.series,
			column: post.data.column,
			cover: getPostCover(post.data),
			published: post.data.published.toISOString(),
		})),
	);

	return new Response(JSON.stringify(items), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
