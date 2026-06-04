/**
 * 微信读书数据类型定义
 *
 * 数据来源：weread CLI（手动 `pnpm fetch-weread`）
 * 实际数据存放在 src/data/weread/（已 gitignore，不会进仓库）
 */

/** 阅读状态 */
export type BookShelfStatus =
	| "reading" // 在读
	| "finished" // 已读完
	| "wishlist" // 想读
	| "abandoned"; // 弃读

/** 单本书 */
export interface BookItem {
	/** 微信读书书籍 ID */
	bookId: string;
	/** 书名 */
	title: string;
	/** 作者 */
	author: string;
	/** 出版社（可选） */
	publisher?: string;
	/** 译者（可选） */
	translator?: string;
	/** 封面图 URL */
	cover: string;
	/** 简介 */
	intro?: string;
	/** 分类标签 */
	category?: string;
	/** 阅读状态 */
	status: BookShelfStatus;
	/** 阅读进度 0-100 */
	progress: number;
	/** 累计阅读时长（秒） */
	readingTime: number;
	/** 我的评分 0-5（半星精度 0.5） */
	myRating?: number;
	/** 豆瓣/读书评分 */
	publicRating?: number;
	/** 开始阅读时间（ISO） */
	startTime?: string;
	/** 结束阅读时间（ISO，已读完才有） */
	finishTime?: string;
	/** 最后阅读时间（ISO） */
	lastReadTime?: string;
	/** 笔记/划线条数 */
	noteCount?: number;
	/** 我的评论/读后感 */
	review?: string;
	/** 当前章节名（在读才有） */
	currentChapter?: string;
}

/** 单条笔记/划线 */
export interface BookNote {
	bookId: string;
	bookTitle: string;
	bookCover?: string;
	chapter?: string;
	/** 划线原文 */
	text: string;
	/** 我的批注 */
	comment?: string;
	/** 创建时间（ISO） */
	createTime: string;
}

/** 年度阅读统计 */
export interface ReadingStats {
	/** 统计年份 */
	year: number;
	/** 全年阅读总时长（秒） */
	totalReadingTime: number;
	/** 全年读完本数 */
	finishedCount: number;
	/** 全年开始读的本数 */
	startedCount: number;
	/** 全年笔记条数 */
	noteCount: number;
	/** 365 天热力图：[{date: 'YYYY-MM-DD', minutes: N}] */
	heatmap: Array<{ date: string; minutes: number }>;
}

/** 用户阅读概况 */
export interface ReadingProfile {
	username: string;
	avatar?: string;
	/** 累计阅读时长（秒） */
	totalReadingTime: number;
	/** 累计读完本数 */
	totalFinished: number;
	/** 当前连续阅读天数 */
	streak: number;
	/** 注册天数 */
	memberDays: number;
}

/** 顶层书架数据（页面使用） */
export interface BookShelfData {
	books: BookItem[];
	notes: BookNote[];
	stats: ReadingStats;
	profile: ReadingProfile;
	/** 数据生成时间（ISO） */
	generatedAt: string;
	/** 是否为 mock 数据（未配置 weread CLI 时的展示数据） */
	isMock: boolean;
}
