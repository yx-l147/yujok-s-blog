import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SHELF_PATH = resolve("src/data/weread/shelf.json");

const headers = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	"Accept-Language": "zh-CN,zh;q=0.9",
};

async function getDoubanSubject(title, author, isbn) {
	// 1. 如果有 ISBN，优先按 ISBN 查建议
	if (isbn && isbn.trim()) {
		try {
			const res = await fetch(
				`https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(isbn.trim())}`,
				{ headers },
			);
			const items = await res.json();
			if (Array.isArray(items) && items.length > 0 && items[0].id) {
				return { id: items[0].id, url: items[0].url };
			}
		} catch {}
	}

	// 2. 清理书名（去除括号内的出版社/译者/套装说明）
	const cleanTitle = title
		.replace(/[（(].*?[）)]/g, "")
		.replace(/微信读书.*$/g, "")
		.trim();

	// 按 "书名 作者" 查
	if (author) {
		try {
			const query = `${cleanTitle} ${author}`.trim();
			const res = await fetch(
				`https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`,
				{ headers },
			);
			const items = await res.json();
			if (Array.isArray(items) && items.length > 0 && items[0].id) {
				return { id: items[0].id, url: items[0].url };
			}
		} catch {}
	}

	// 3. 按纯书名查
	try {
		const res = await fetch(
			`https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(cleanTitle)}`,
			{ headers },
		);
		const items = await res.json();
		if (Array.isArray(items) && items.length > 0 && items[0].id) {
			return { id: items[0].id, url: items[0].url };
		}
	} catch {}

	return null;
}

async function main() {
	const shelf = JSON.parse(readFileSync(SHELF_PATH, "utf8"));
	console.log(`📚 开始使用 Douban Suggest API 匹配 ${shelf.books.length} 本书的豆瓣详情页 ...`);

	let updatedCount = 0;
	for (let i = 0; i < shelf.books.length; i++) {
		const b = shelf.books[i];

		const item = await getDoubanSubject(b.title, b.author, b.isbn);
		if (item) {
			b.doubanId = item.id;
			b.doubanUrl = item.url || `https://book.douban.com/subject/${item.id}/`;
			updatedCount++;
			if (i < 20 || updatedCount % 20 === 0) {
				console.log(`  [${i + 1}/${shelf.books.length}] 《${b.title}》 -> ${b.doubanUrl}`);
			}
		} else {
			console.log(`  [${i + 1}/${shelf.books.length}] 《${b.title}》 -> 未匹配到`);
		}
		// 防刷保护 150ms 间隔
		await new Promise((r) => setTimeout(r, 150));
	}

	writeFileSync(SHELF_PATH, JSON.stringify(shelf, null, "\t"), "utf8");
	console.log(`✅ 解析完成！共为 ${updatedCount} 本书补充了豆瓣详情页链接。`);
}

main().catch(console.error);
