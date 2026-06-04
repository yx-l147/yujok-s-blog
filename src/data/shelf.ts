import type { BookShelfData } from "@/types/weread";
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
 */

const realShelfModules = import.meta.glob<{ default: BookShelfData }>(
	"./weread/shelf.json",
	{ eager: true },
);

const realKey = Object.keys(realShelfModules)[0];
const realData = realKey ? realShelfModules[realKey].default : null;

export const shelfData: BookShelfData = realData ?? mockShelfData;
