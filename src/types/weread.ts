/**
 * 微信读书数据类型定义
 *
 * 数据来源：weread skill（手动 `pnpm fetch-weread`）
 * 实际数据存放在 src/data/weread/shelf.json（已 gitignore，不会进仓库）
 *
 * 隐私：secret=1 的私密书籍在拉取脚本源头即被过滤，类型中不存在该字段。
 */

/** 阅读状态（由 progress + finishReading 派生） */
export type BookShelfStatus =
	| "reading" // 在读（progress>0 且未读完）
	| "finished" // 已读完
	| "wishlist"; // 想读 / 未开始（progress=0）

export type BookReviewVerdict = "recommend" | "neutral" | "avoid";

export interface LocalBookReview {
	slug: string;
	title: string;
	published: Date;
	updated?: Date;
	draft?: boolean;
	summary: string;
	verdict: BookReviewVerdict;
	rating?: number;
	topics: string[];
	quotes: Array<{
		text: string;
		chapter?: string;
	}>;
	relatedPosts: string[];
	doubanId?: string;
}

/** 单本书（来自 shelf.json，已含派生 status） */
export interface BookItem {
	/** 微信读书书籍 ID */
	bookId: string;
	/** 书名 */
	title: string;
	/** 作者 */
	author: string;
	/** 封面图 URL */
	cover: string;
	/** 原始分类串（如 "文学-古代诗词"） */
	category?: string;
	/** 出版社（精选书才有） */
	publisher?: string;
	/** 译者（精选书才有） */
	translator?: string;
	/** 简介 */
	intro?: string;
	/** 微信读书评分（10 分制，0 表示评分不足/未补全） */
	publicRating?: number;
	/** 评分人数 */
	ratingCount?: number;
	/** 出版时间 */
	publishTime?: string;
	/** ISBN 号 */
	isbn?: string;
	/** 微信读书官方直达链接 */
	deepLink?: string;
	/** 豆瓣条目 ID */
	doubanId?: string;
	/** 豆瓣条目直达链接 */
	doubanUrl?: string;
	/** 是否读完 */
	finishReading: number;
	/** 阅读进度 0-100 */
	progress: number;
	/** 累计阅读时长（秒，仅 Top10 长读书有） */
	readTime?: number;
	/** 笔记（想法）条数 */
	noteCount?: number;
	/** 书评条数 */
	reviewCount?: number;
	/** 划线条数 */
	bookmarkCount?: number;
	/** 微信读书赋予的标签（如 "笔记最多" "单日阅读最久"） */
	tags?: string[];
	/** 最后阅读时间（Unix 秒） */
	readUpdateTime?: number;
	/** 加入书架时间（Unix 秒） */
	updateTime?: number;
	/** 派生：阅读状态 */
	status: BookShelfStatus;
	/** 本地维护的个人书评与策展信息 */
	localReview?: LocalBookReview;
}

/** 单条笔记/划线 */
export interface BookNote {
	bookId: string;
	bookTitle: string;
	bookCover?: string;
	chapter?: string;
	/** 划线原文 */
	text: string;
	/** 创建时间（ISO） */
	createTime: string;
}

/** 偏好分类 */
export interface PreferCategory {
	title: string;
	count: number;
	/** 阅读时长（秒） */
	time: number;
}

/** 偏好作者 */
export interface PreferAuthor {
	name: string;
	count: number;
	/** 已格式化的阅读时长（如 "11小时"） */
	readTime: string;
}

/** 阅读统计 */
export interface ReadingStats {
	/** 累计阅读总时长（秒） */
	totalReadTime: number;
	/** 累计阅读天数 */
	readDays: number;
	/** 读过本数 */
	readBooks: number;
	/** 读完本数 */
	finishedBooks: number;
	/** 笔记总条数 */
	noteCount: number;
	/** 偏好时段文案（如 "偏好白天阅读"） */
	preferTimeWord?: string;
	/** 偏好分类文案（如 "偏好阅读文学"） */
	preferCategoryWord?: string;
	/** 偏好分类 Top */
	preferCategory: PreferCategory[];
	/** 偏好作者 Top */
	preferAuthor: PreferAuthor[];
	/** 注册时间（Unix 秒） */
	registTime?: number;
	/** 按日热力图：[{date:'YYYY-MM-DD', seconds:N}] */
	heatmap: Array<{ date: string; seconds: number }>;
}

/** 最爱的书 */
export interface FavBook {
	title: string;
	author: string;
	cover: string;
}

/** 用户阅读概况 */
export interface ReadingProfile {
	/** 公开书架总本数 */
	totalBooks: number;
	/** 私密书数量（仅作统计提示，不展示书目） */
	secretCount: number;
	/** 最爱的书 */
	favBook?: FavBook | null;
}

/** 顶层书架数据（页面使用） */
export interface BookShelfData {
	books: BookItem[];
	notes: BookNote[];
	stats: ReadingStats;
	profile: ReadingProfile;
	/** 数据生成时间（ISO） */
	generatedAt: string;
	/** 是否为 mock 数据 */
	isMock: boolean;
}
