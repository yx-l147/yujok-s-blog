#!/usr/bin/env node
/**
 * 微信读书数据拉取脚本
 *
 * 用法：
 *   1. 复制 .env.example → .env.local，填入 WEREAD_API_KEY
 *   2. 确保 weread CLI 可用（PATH 中或 .env.local 的 WEREAD_CLI 路径）
 *   3. 运行：pnpm fetch-weread
 *
 * 安全：
 *   - 不会读写 .env 之外的环境变量
 *   - 输出仅写到 src/data/weread/*.json（已 gitignore）
 *   - 不触碰 git，不上报任何外部服务
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

// ---------- 1. 加载 .env.local（不依赖外部包） ----------
function loadEnv() {
	const candidates = [".env.local", ".env"];
	for (const name of candidates) {
		const path = resolve(ROOT, name);
		if (!existsSync(path)) continue;
		const text = readFileSync(path, "utf8");
		for (const line of text.split(/\r?\n/)) {
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
const CLI = process.env.WEREAD_CLI || "weread";

if (!API_KEY || API_KEY === "wrk-replace-me") {
	console.error("❌ WEREAD_API_KEY 未设置。请：");
	console.error("   1. 复制 .env.example → .env.local");
	console.error("   2. 在 .env.local 填入真实 API Key");
	console.error("");
	console.error("   未配置时书架页将使用 mock 数据（可正常预览，但不是真实数据）。");
	process.exit(1);
}

console.log("📚 开始拉取微信读书数据...");
console.log(`   CLI: ${CLI}`);
console.log(`   输出: ${DATA_DIR}`);

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ---------- 2. 调 weread CLI 拉数据 ----------
async function run(args) {
	try {
		const { stdout } = await exec(CLI, args, {
			env: { ...process.env, WEREAD_API_KEY: API_KEY },
			maxBuffer: 32 * 1024 * 1024,
		});
		return stdout;
	} catch (err) {
		console.error(`❌ 执行失败: ${CLI} ${args.join(" ")}`);
		console.error(`   ${err.message}`);
		return null;
	}
}

async function main() {
	// 注意：weread CLI 当前实际输出是文本格式，
	// 此处仅提供拉取入口，具体解析后续按 CLI 真实输出格式适配。
	// 暂时把原始输出存为 .txt，待 CLI 支持 --json 后改为结构化解析。

	const tasks = [
		{ name: "shelf", args: ["shelf"] },
		{ name: "stats", args: ["stats", "annually"] },
		{ name: "profile", args: ["profile"] },
		{ name: "notes", args: ["notes"] },
	];

	for (const t of tasks) {
		console.log(`\n→ 拉取 ${t.name}...`);
		const out = await run(t.args);
		if (out == null) continue;
		const txtPath = resolve(DATA_DIR, `${t.name}.raw.txt`);
		writeFileSync(txtPath, out, "utf8");
		console.log(`   ✓ 已保存 ${txtPath} (${(out.length / 1024).toFixed(1)} KB)`);
	}

	console.log("\n⚠️ 当前阶段：原始输出已落盘，但 shelf.json 等结构化文件仍需手动转换。");
	console.log("   完整 JSON 解析将在 weread CLI 支持 --json 后接入。");
	console.log("   书架页会自动回退到 mock 数据，不影响预览。");

	console.log("\n✅ 完成。所有数据写在 src/data/weread/（已 gitignore，不会进仓库）");
}

main().catch((err) => {
	console.error("❌ 拉取过程异常：", err);
	process.exit(1);
});
