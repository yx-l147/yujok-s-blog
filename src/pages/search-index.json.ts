import {
	getPostCover,
	getPostExcerpt,
	getSortedPosts,
} from "@utils/content-utils";
import { getCategoryUrl, getPostUrlBySlug } from "@utils/url-utils";
import type { APIContext } from "astro";
import { shelfData, shortCategory } from "@/data/shelf";

export async function GET(_context: APIContext) {
	const posts = await getSortedPosts();
	const postItems = await Promise.all(
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
	const bookItems = shelfData.books.map((book) => ({
		id: `book-${book.bookId}`,
		title: book.title,
		description: [
			book.author,
			book.publisher,
			shortCategory(book.category),
			book.intro?.replace(/\s+/g, " ").trim().slice(0, 120),
		]
			.filter(Boolean)
			.join(" · "),
		url: `/book/${book.bookId}/`,
		category: book.category || "书籍",
		categoryUrl: "/book/",
		tags: ["书籍", book.status, ...(book.tags ?? [])],
		series: null,
		column: "book",
		cover: book.cover,
		published: book.publishTime
			? new Date(book.publishTime).toISOString()
			: new Date(shelfData.generatedAt).toISOString(),
	}));
	const items = [...postItems, ...bookItems];

	return new Response(JSON.stringify(items), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
