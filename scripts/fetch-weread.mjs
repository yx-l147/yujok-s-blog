#!/usr/bin/env node
/**
 * 微信读书数据拉取脚本
 *
 * 用法：
 *   1. 复制 .env.example → .env.local，填入 WEREAD_API_KEY
 *   2. 运行：pnpm fetch-weread
 *
 * 实现：直接驱动 weread skill 的 Python API 客户端，输出结构化 JSON。
 *       （比解析 CLI 文本输出更可靠、字段更全。）
 *
 * 隐私铁律：
 *   - secret=1 的私密书籍在源头就被过滤，绝不写入任何输出文件
 *   - 输出仅写到 src/data/weread/shelf.json（其余中间产物已 gitignore）
 *   - shelf.json 允许入库（私密书已源头过滤，展示数据本身公开）
 *   - 不触碰 git，不上报任何外部服务
 *   - API Key 只在子进程内传递，不落盘
 */

import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, "src/data/weread");
const OUT_FILE = resolve(DATA_DIR, "shelf.json");

// ---------- 1. 加载 .env.local ----------
function loadEnv() {
	for (const name of [".env.local", ".env"]) {
		const path = resolve(ROOT, name);
		if (!existsSync(path)) continue;
		for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
			const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
			if (!m) continue;
			let val = m[2];
			if (
				(val.startsWith('"') && val.endsWith('"')) ||
				(val.startsWith("'") && val.endsWith("'"))
			) {
				val = val.slice(1, -1);
			}
			if (!process.env[m[1]]) process.env[m[1]] = val;
		}
	}
}
loadEnv();

const API_KEY = process.env.WEREAD_API_KEY;
const PYTHON = process.env.WEREAD_PYTHON || "python";
// weread skill 目录（含 weread_cli Python 包）
const SKILL_DIR =
	process.env.WEREAD_SKILL_DIR ||
	resolve(
		process.env.HOME || process.env.USERPROFILE || "",
		".claude/skills/weread",
	);

if (!API_KEY || API_KEY === "wrk-replace-me") {
	console.error("❌ WEREAD_API_KEY 未设置。请：");
	console.error("   1. 复制 .env.example → .env.local");
	console.error("   2. 在 .env.local 填入真实 API Key");
	console.error(
		"   未配置时书架页会使用 mock 数据（可正常预览，但不是真实数据）。",
	);
	process.exit(1);
}

if (!existsSync(resolve(SKILL_DIR, "weread_cli"))) {
	console.error(`❌ 找不到 weread skill：${SKILL_DIR}`);
	console.error("   请设置 WEREAD_SKILL_DIR 指向含 weread_cli 的目录。");
	process.exit(1);
}

console.log("📚 开始拉取微信读书数据...");
console.log(`   skill: ${SKILL_DIR}`);
console.log(`   输出 : ${OUT_FILE}`);

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ---------- 2. Python 提取器（一次性吐出结构化 JSON） ----------
// 直接调用 weread_cli.api.call，避免逐行解析 CLI 文本。
const PY_EXTRACTOR = String.raw`
# -*- coding: utf-8 -*-
import sys, io, json, time, datetime, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from weread_cli.api import call, list_all_notebooks

def safe(fn, default=None):
    try:
        return fn()
    except Exception as e:
        sys.stderr.write(f"  ! {e}\n")
        return default

# ---- 书架（含 secret 标记） ----
shelf = call("/shelf/sync")
raw_books = shelf.get("books", [])

# 隐私铁律：源头过滤私密书
PUBLIC = [b for b in raw_books if b.get("secret") != 1]
SECRET_COUNT = sum(1 for b in raw_books if b.get("secret") == 1)

# ---- 笔记本：进度 / 笔记数 / 划线数 ----
notebooks = safe(list_all_notebooks, []) or []
nb_map = {}
for nb in notebooks:
    bid = nb.get("bookId")
    if not bid:
        continue
    nb_map[bid] = {
        "progress": nb.get("readingProgress", 0),
        "noteCount": nb.get("noteCount", 0),
        "reviewCount": nb.get("reviewCount", 0),
        "bookmarkCount": nb.get("bookmarkCount", 0),
    }

# ---- 总体统计 ----
overall = call("/readdata/detail", mode="overall", baseTime=0)

# 读时长排行（Top10，带 tags）
read_longest = {}
for r in overall.get("readLongest", []):
    b = r.get("book", {})
    bid = b.get("bookId")
    if bid:
        read_longest[bid] = {"readTime": r.get("readTime", 0), "tags": r.get("tags", [])}

# ---- 全年按日热力图：逐月翻 baseTime 累积 readTimes ----
heatmap = {}
now = datetime.datetime.now()
for back in range(0, 13):
    y = now.year
    m = now.month - back
    while m <= 0:
        m += 12
        y -= 1
    base = int(time.mktime((y, m, 1, 0, 0, 0, 0, 0, -1)))
    md = safe(lambda b=base: call("/readdata/detail", mode="monthly", baseTime=b), {}) or {}
    for ts, sec in (md.get("readTimes") or {}).items():
        try:
            day = datetime.date.fromtimestamp(int(ts)).isoformat()
            heatmap[day] = max(heatmap.get(day, 0), int(sec))
        except Exception:
            pass

# ---- 组装公开书基础信息 ----
enriched = []
for b in PUBLIC:
    bid = b["bookId"]
    nb = nb_map.get(bid, {})
    enriched.append({
        "bookId": bid,
        "title": b.get("title", ""),
        "author": b.get("author", ""),
        "cover": b.get("cover", ""),
        "category": b.get("category", ""),
        "finishReading": b.get("finishReading", 0),
        "readUpdateTime": b.get("readUpdateTime", 0),
        "updateTime": b.get("updateTime", 0),
        "progress": nb.get("progress", 0),
        "noteCount": nb.get("noteCount", 0),
        "reviewCount": nb.get("reviewCount", 0),
        "bookmarkCount": nb.get("bookmarkCount", 0),
        "readTime": read_longest.get(bid, {}).get("readTime", 0),
        "tags": read_longest.get(bid, {}).get("tags", []),
    })

# 选出需要补详情的书（控制 API 量，最多 60 本）
def enrich_score(e):
    s = 0
    if e["finishReading"]:
        s += 1000
    s += e["progress"] * 3
    s += (e["noteCount"] + e["bookmarkCount"])
    s += e["readTime"] // 600
    return s

to_enrich = sorted(enriched, key=enrich_score, reverse=True)[:60]

info_map = {}
for e in to_enrich:
    bid = e["bookId"]
    info = safe(lambda i=bid: call("/book/info", bookId=i), None)
    if not info:
        continue
    rating = info.get("newRating", 0)  # 千分制（如 837 → 8.4）
    info_map[bid] = {
        "intro": (info.get("intro") or "").strip(),
        "publisher": info.get("publisher") or "",
        "translator": info.get("translator") or "",
        "publicRating": round(rating / 100, 1) if rating else 0,
        "ratingCount": info.get("newRatingCount", 0),
        "publishTime": info.get("publishTime") or "",
        "isbn": info.get("isbn") or "",
        "deepLink": info.get("deepLink") or "",
    }
    time.sleep(0.05)

for e in enriched:
    e.update(info_map.get(e["bookId"], {}))

# ---- 划线与笔记：从所有公开书抽取全部完整划线 ----
note_src = [e for e in enriched if e.get("bookmarkCount", 0) > 0]
notes = []
for e in note_src:
    bid = e["bookId"]
    bm = safe(lambda i=bid: call("/book/bookmarklist", bookId=i), None)
    if not bm:
        continue
    chapters = {c["chapterUid"]: c.get("title", "") for c in bm.get("chapters", [])}
    raw_marks = bm.get("updated", []) or []
    sorted_marks = sorted(raw_marks, key=lambda m: m.get("createTime", 0), reverse=True)
    for m in sorted_marks:
        txt = (m.get("markText") or "").strip()
        if not txt or len(txt) < 2:
            continue
        notes.append({
            "bookId": bid,
            "bookTitle": e["title"],
            "bookCover": e["cover"],
            "chapter": chapters.get(m.get("chapterUid"), ""),
            "text": txt,
            "createTime": datetime.datetime.fromtimestamp(m.get("createTime", 0)).isoformat() if m.get("createTime") else "",
        })
    time.sleep(0.03)

# ---- 偏好分类 / 作者 ----
prefer_category = [
    {"title": c.get("categoryTitle", ""), "count": c.get("readingCount", 0), "time": c.get("readingTime", 0)}
    for c in (overall.get("preferCategory") or [])[:6]
]
prefer_author = [
    {"name": a.get("name", ""), "count": a.get("count", 0), "readTime": a.get("readTime", "")}
    for a in (overall.get("preferAuthor") or [])[:6]
]

fav_book = None
for pb in overall.get("preferBooks", []) or []:
    if pb.get("type") == 13:
        bi = pb.get("bookInfo", {})
        fav_book = {"title": bi.get("title", ""), "author": bi.get("author", ""), "cover": bi.get("cover", "")}
        break

def stat_num(label):
    for s in overall.get("readStat", []):
        if s.get("stat") == label:
            mm = re.search(r"\d+", s.get("counts", ""))
            return int(mm.group()) if mm else 0
    return 0

out = {
    "books": enriched,
    "notes": notes,
    "stats": {
        "totalReadTime": overall.get("totalReadTime", 0),
        "readDays": overall.get("readDays", 0),
        "readBooks": stat_num("读过"),
        "finishedBooks": stat_num("读完"),
        "noteCount": stat_num("笔记"),
        "preferTimeWord": overall.get("preferTimeWord", ""),
        "preferCategoryWord": overall.get("preferCategoryWord", ""),
        "preferCategory": prefer_category,
        "preferAuthor": prefer_author,
        "registTime": overall.get("registTime", 0),
        "heatmap": [{"date": d, "seconds": s} for d, s in sorted(heatmap.items())],
    },
    "profile": {
        "totalBooks": len(PUBLIC),
        "secretCount": SECRET_COUNT,
        "favBook": fav_book,
    },
}
print(json.dumps(out, ensure_ascii=False))
`;

// ---------- 3. 执行 Python 提取器 ----------
async function main() {
	console.log("\n→ 调用微信读书 API（书架 / 统计 / 笔记 / 热力图）...");
	let stdout;
	try {
		const res = await exec(PYTHON, ["-c", PY_EXTRACTOR], {
			cwd: SKILL_DIR,
			env: {
				...process.env,
				WEREAD_API_KEY: API_KEY,
				PYTHONUTF8: "1",
				PYTHONIOENCODING: "utf-8",
			},
			maxBuffer: 64 * 1024 * 1024,
		});
		stdout = res.stdout;
	} catch (err) {
		console.error("❌ 拉取失败：", err.message);
		if (err.stderr) console.error(err.stderr);
		process.exit(1);
	}

	let parsed;
	try {
		parsed = JSON.parse(stdout);
	} catch {
		console.error("❌ Python 输出不是合法 JSON，前 500 字：");
		console.error(stdout.slice(0, 500));
		process.exit(1);
	}

	const finalData = {
		...parsed,
		generatedAt: new Date().toISOString(),
		isMock: false,
	};

	writeFileSync(OUT_FILE, JSON.stringify(finalData, null, "\t"), "utf8");

	const { books, notes, stats, profile } = finalData;
	console.log("\n✅ 拉取完成：");
	console.log(
		`   公开书籍 : ${books.length} 本（已排除 ${profile.secretCount} 本私密书）`,
	);
	console.log(`   精选笔记 : ${notes.length} 条`);
	console.log(`   热力图   : ${stats.heatmap.length} 天有记录`);
	console.log(
		`   总时长   : ${Math.round(stats.totalReadTime / 3600)} 小时 · ${stats.readDays} 天`,
	);
	console.log(`   输出     : ${OUT_FILE}`);
	console.log(
		"\n🔒 私密书籍未写入任何文件；shelf.json 含公开书架数据，允许入库。",
	);
}

main().catch((err) => {
	console.error("❌ 异常：", err);
	process.exit(1);
});
