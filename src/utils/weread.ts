import crypto from "node:crypto";
import type { BookItem } from "@/types/weread";

/**
 * 将微信读书 numeric bookId 转换为阅读器直达 vid
 */
export function getWeReadVid(bookId: string): string {
	if (!bookId) return "";
	if (!/^\d+$/.test(bookId)) return bookId;

	const idStr = String(bookId);
	const hash = crypto.createHash("md5").update(idStr).digest("hex");
	let result = hash.substring(0, 8);

	const fa: string[] = [];
	for (let i = 0; i < idStr.length; i += 9) {
		fa.push(idStr.substring(i, Math.min(i + 9, idStr.length)));
	}

	for (let i = 0; i < fa.length; i++) {
		const hex = Number.parseInt(fa[i], 10).toString(16);
		const code = i === 0 ? "3" : "2";
		result += code + hex;
	}

	if (result.length < 20) {
		result += hash.substring(0, 20 - result.length);
	}

	const hashKey = crypto.createHash("md5").update(result).digest("hex");
	result += hashKey.substring(0, 3);
	return result;
}

/**
 * 获取微信读书直达链接（优先官方 deepLink / 阅读器书籍界面，兜底搜索界面）
 */
export function getWeReadUrl(
	book: Partial<BookItem> & Pick<BookItem, "title">,
): string {
	if (book.deepLink) {
		return book.deepLink;
	}
	if (book.bookId) {
		const vid = getWeReadVid(book.bookId);
		if (vid) {
			return `https://weread.qq.com/web/reader/${vid}`;
		}
	}
	return `https://weread.qq.com/web/search/books?keyword=${encodeURIComponent(
		`${book.title} ${book.author || ""}`.trim(),
	)}`;
}

/**
 * 获取豆瓣直达链接（优先 doubanId / ISBN，使用 www.douban.com 主站搜索规避风控拦截）
 */
export function getDoubanUrl(
	book: Partial<BookItem> & Pick<BookItem, "title">,
): string {
	if (book.doubanUrl) {
		return book.doubanUrl;
	}
	if (book.doubanId) {
		return `https://book.douban.com/subject/${book.doubanId}/`;
	}
	if (book.localReview?.doubanId) {
		return `https://book.douban.com/subject/${book.localReview.doubanId}/`;
	}
	if (book.isbn?.trim()) {
		return `https://www.douban.com/search?cat=1001&q=${encodeURIComponent(
			book.isbn.trim(),
		)}`;
	}
	return `https://www.douban.com/search?cat=1001&q=${encodeURIComponent(
		`${book.title} ${book.author || ""}`.trim(),
	)}`;
}
