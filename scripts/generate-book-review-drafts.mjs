#!/usr/bin/env node

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SHELF_FILE = resolve(ROOT, "src/data/weread/shelf.json");
const REVIEW_DIR = resolve(ROOT, "src/content/book-reviews");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

function today() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

function walkMarkdownFiles(dir) {
	if (!existsSync(dir)) return [];

	const files = [];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		const stats = statSync(path);

		if (stats.isDirectory()) {
			files.push(...walkMarkdownFiles(path));
			continue;
		}

		const ext = extname(entry).toLowerCase();
		if (ext === ".md" || ext === ".mdx") files.push(path);
	}

	return files;
}

function frontmatterOf(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	return match?.[1] ?? "";
}

function extractStringField(frontmatter, field) {
	const match = frontmatter.match(
		new RegExp(`^${field}:\\s*["']?([^"'\\r\\n#]+)["']?\\s*$`, "m"),
	);
	return match?.[1]?.trim() ?? "";
}

function existingReviewBookIds() {
	const ids = new Set();
	for (const file of walkMarkdownFiles(REVIEW_DIR)) {
		const frontmatter = frontmatterOf(readFileSync(file, "utf8"));
		const bookId = extractStringField(frontmatter, "bookId");
		if (bookId) ids.add(bookId);
	}
	return ids;
}

function toNumber(value) {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
}

function hasHighlight(book, notesByBook) {
	return toNumber(book.bookmarkCount) > 0 || notesByBook.has(String(book.bookId));
}

function hasRating(book) {
	return [
		book.rating,
		book.userRating,
		book.personalRating,
		book.publicRating,
	].some((value) => toNumber(value) > 0);
}

function isFinished(book) {
	return book.finishReading === 1 || book.status === "finished";
}

function isEligible(book, notesByBook) {
	return hasHighlight(book, notesByBook) || hasRating(book) || isFinished(book);
}

function yamlString(value) {
	return JSON.stringify(String(value ?? ""));
}

function normalizeFilePart(value) {
	const slug = String(value ?? "")
		.normalize("NFKC")
		.toLowerCase()
		.replace(/['’]/g, "")
		.replace(/[^\p{L}\p{N}]+/gu, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 64);

	return slug || "book-review";
}

function filenameFor(book) {
	const title = normalizeFilePart(book.title);
	const id = normalizeFilePart(book.bookId);
	return `${title}-${id}.md`;
}

function uniqueTargetPath(fileName) {
	let target = join(REVIEW_DIR, fileName);
	if (!existsSync(target)) return target;

	const base = fileName.replace(/\.md$/i, "");
	let index = 2;
	while (existsSync(target)) {
		target = join(REVIEW_DIR, `${base}-${index}.md`);
		index += 1;
	}
	return target;
}

function notesByBook(notes = []) {
	const map = new Map();
	for (const note of notes) {
		const bookId = String(note.bookId ?? "");
		const text = String(note.text ?? "").trim();
		if (!bookId || !text) continue;
		const current = map.get(bookId) ?? [];
		current.push({
			text,
			chapter: String(note.chapter ?? "").trim(),
			createTime: String(note.createTime ?? ""),
		});
		map.set(bookId, current);
	}

	for (const [bookId, items] of map) {
		map.set(
			bookId,
			items
				.sort((a, b) => b.text.length - a.text.length)
				.slice(0, 3),
		);
	}

	return map;
}

function quoteBlock(bookId, notesMap) {
	const notes = notesMap.get(String(bookId)) ?? [];
	if (notes.length === 0) {
		return [
			"quotes:",
			"  - text: \"TODO: 放一条想保留在书架卡片里的划线或短句。\"",
			"    chapter: \"\"",
		].join("\n");
	}

	return [
		"quotes:",
		...notes.flatMap((note) => [
			`  - text: ${yamlString(note.text)}`,
			`    chapter: ${yamlString(note.chapter)}`,
		]),
	].join("\n");
}

function reasonsFor(book, notesMap) {
	const reasons = [];
	if (hasHighlight(book, notesMap)) reasons.push("有划线");
	if (hasRating(book)) reasons.push("有评分");
	if (isFinished(book)) reasons.push("已读完");
	return reasons;
}

function draftContent(book, notesMap) {
	const authorLine = book.author ? `\n作者：${book.author}` : "";
	const categoryLine = book.category ? `\n分类：${book.category}` : "";
	const publicRatingLine =
		toNumber(book.publicRating) > 0 ? `\n微信读书评分：${book.publicRating}` : "";

	return `---
title: ${yamlString(`《${book.title}》读后`)}
bookId: ${yamlString(book.bookId)}
published: ${today()}
summary: "TODO: 用一句话写这本书留下的核心感受。"
verdict: "neutral"
topics: ["TODO"]
${quoteBlock(book.bookId, notesMap)}
relatedPosts: []
draft: true
---

## 待写

- 为什么想写这本书：TODO
- 最值得展开的主题：TODO
- 读完后的判断：TODO

## 书架信息
${authorLine}${categoryLine}${publicRatingLine}
`;
}

function main() {
	if (!existsSync(SHELF_FILE)) {
		console.error(`找不到书架数据：${SHELF_FILE}`);
		console.error("请先运行 pnpm fetch-weread 生成 src/data/weread/shelf.json。");
		process.exit(1);
	}

	const shelf = readJson(SHELF_FILE);
	const notesMap = notesByBook(shelf.notes);
	const existingBookIds = existingReviewBookIds();
	const books = Array.isArray(shelf.books) ? shelf.books : [];
	const candidates = books
		.filter((book) => book?.bookId && isEligible(book, notesMap))
		.filter((book) => !existingBookIds.has(String(book.bookId)))
		.sort((a, b) => {
			const bTime = toNumber(b.readUpdateTime) || toNumber(b.updateTime);
			const aTime = toNumber(a.readUpdateTime) || toNumber(a.updateTime);
			return bTime - aTime;
		});

	if (!dryRun && !existsSync(REVIEW_DIR)) {
		mkdirSync(REVIEW_DIR, { recursive: true });
	}

	const created = [];
	for (const book of candidates) {
		const target = uniqueTargetPath(filenameFor(book));
		created.push({
			book,
			target,
			reasons: reasonsFor(book, notesMap),
		});

		if (!dryRun) {
			writeFileSync(target, draftContent(book, notesMap), "utf8");
		}
	}

	const action = dryRun ? "将生成" : "已生成";
	console.log(`${action} ${created.length} 篇本地书评草稿。`);
	console.log(`已跳过 ${existingBookIds.size} 篇已有 bookId 的书评。`);

	for (const item of created) {
		const relativeTarget = item.target.replace(`${ROOT}\\`, "").replaceAll("\\", "/");
		console.log(
			`- ${item.book.title} (${item.book.bookId}) -> ${relativeTarget}；${item.reasons.join("、")}`,
		);
	}

	if (dryRun) {
		console.log("\n这是预览模式，没有写入文件。去掉 --dry-run 即可真正生成。");
	}
}

main();
