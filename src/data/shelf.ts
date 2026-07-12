import { getCollection } from "astro:content";
import type {
	BookItem,
	BookNote,
	BookShelfData,
	BookShelfStatus,
	LocalBookReview,
} from "@/types/weread";
import { mockShelfData } from "./mock-shelf";

/**
 * 书架数据加载器
 *
 * 加载顺序：
 *   1. 真实数据：src/data/weread/shelf.json（由 `pnpm fetch-weread` 生成，已 gitignore）
 *   2. 兜底数据：src/data/mock-shelf.ts（可提交，展示用）
 *
 * 用 import.meta.glob 让 Vite 在文件不存在时静默回退，
 * 不会触发 Rollup 解析失败。
 *
 * 隐私：shelf.json 已在拉取脚本源头过滤私密书，这里不再接触任何 secret 数据。
 */

const realShelfModules = import.meta.glob<{ default: BookShelfData }>(
	"./weread/shelf.json",
	{ eager: true },
);

const realKey = Object.keys(realShelfModules)[0];
const realRaw = realKey ? realShelfModules[realKey].default : null;

/** 由 progress + finishReading 派生阅读状态 */
function deriveStatus(b: {
	finishReading: number;
	progress: number;
}): BookShelfStatus {
	if (b.finishReading === 1) return "finished";
	if (b.progress > 0) return "reading";
	return "wishlist";
}

/** 规整分类串："文学-古代诗词" → "古代诗词" */
export function shortCategory(category?: string): string {
	if (!category) return "";
	const parts = category.split("-");
	return parts[parts.length - 1] || category;
}

/** 提取顶级分类：{ 文学: 79, 哲学宗教: 44, ... }，按数量降序 */
export function topCategories(
	books: BookItem[],
	minCount = 5,
): { name: string; count: number }[] {
	const map = new Map<string, number>();
	for (const b of books) {
		const top = (b.category || "未分类").split("-")[0];
		map.set(top, (map.get(top) ?? 0) + 1);
	}
	return [...map.entries()]
		.filter(([, n]) => n >= minCount)
		.sort((a, b) => b[1] - a[1])
		.map(([name, count]) => ({ name, count }));
}

/** 获取某分类下的子分类列表 */
export function subCategories(books: BookItem[], top: string): string[] {
	const subs = new Set<string>();
	for (const b of books) {
		if (!b.category) continue;
		const parts = b.category.split("-");
		if (parts[0] === top && parts.length > 1)
			subs.add(parts.slice(1).join("-"));
	}
	return [...subs].sort();
}

/** 按 bookId 查找书籍 */
export function getBookById(
	books: BookItem[],
	id: string,
): BookItem | undefined {
	return books.find((b) => b.bookId === id);
}

/** 获取某本书的所有笔记 */
export function getNotesForBook(notes: BookNote[], bookId: string): BookNote[] {
	return notes.filter((n) => n.bookId === bookId);
}

/** 给每本书补上派生字段 */
function normalize(data: BookShelfData): BookShelfData {
	const books: BookItem[] = data.books.map((b) => ({
		...b,
		status: b.status ?? deriveStatus(b),
	}));
	return { ...data, books };
}

export const shelfData: BookShelfData = realRaw
	? normalize(realRaw)
	: normalize(mockShelfData);

export async function getLocalBookReviews(): Promise<
	Map<string, LocalBookReview>
> {
	const entries = await getCollection("book-reviews", ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);
	const reviews = new Map<string, LocalBookReview>();

	for (const entry of entries) {
		const current = reviews.get(entry.data.bookId);
		const review: LocalBookReview = {
			slug: entry.id,
			title: entry.data.title,
			published: entry.data.published,
			updated: entry.data.updated,
			summary: entry.data.summary,
			verdict: entry.data.verdict,
			rating: entry.data.rating,
			draft: entry.data.draft,
			topics: entry.data.topics,
			quotes: entry.data.quotes,
			relatedPosts: entry.data.relatedPosts,
		};

		if (!current || review.published > current.published) {
			reviews.set(entry.data.bookId, review);
		}
	}

	return reviews;
}

export async function getEnrichedShelfData(): Promise<BookShelfData> {
	const reviews = await getLocalBookReviews();
	const books = shelfData.books.map((book) => {
		const localReview = reviews.get(book.bookId);
		return localReview ? { ...book, localReview } : book;
	});
	const bookMap = new Map(books.map((book) => [book.bookId, book]));
	const localNotes: BookNote[] = [...reviews.entries()].flatMap(
		([bookId, review]) => {
			const book = bookMap.get(bookId);
			if (!book) return [];
			return review.quotes.map((quote, index) => ({
				bookId,
				bookTitle: book.title,
				bookCover: book.cover,
				chapter: quote.chapter || "本地精选",
				text: quote.text,
				createTime: new Date(review.published.getTime() + index).toISOString(),
			}));
		},
	);

	return { ...shelfData, books, notes: [...localNotes, ...shelfData.notes] };
}
