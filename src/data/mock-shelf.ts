import type {
	BookItem,
	BookNote,
	BookShelfData,
	ReadingProfile,
	ReadingStats,
} from "@/types/weread";

/**
 * mock 数据：未配置 weread CLI 时的兜底展示数据
 *
 * 配置 weread CLI 后请运行 `pnpm fetch-weread`，
 * 真实数据会写入 src/data/weread/shelf.json 等文件并自动覆盖 mock。
 */

const COVER_PLACEHOLDER = (seed: string, accent = "#5db4ff") =>
	`https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a1428&shape1Color=${accent.slice(1)}&shape2Color=7c5fb3&shape3Color=ff6b4a`;

const MOCK_BOOKS: BookItem[] = [
	{
		bookId: "mock-001",
		title: "百年孤独",
		author: "[哥伦比亚] 加西亚·马尔克斯",
		translator: "范晔",
		publisher: "南海出版公司",
		cover: COVER_PLACEHOLDER("百年孤独"),
		intro: "多年以后，奥雷里亚诺·布恩迪亚上校将会回想起，父亲带他去见识冰块的那个遥远的下午。",
		category: "外国文学",
		status: "finished",
		progress: 100,
		readingTime: 86400 * 4,
		myRating: 5,
		publicRating: 9.3,
		startTime: "2026-01-12T00:00:00Z",
		finishTime: "2026-02-08T00:00:00Z",
		lastReadTime: "2026-02-08T22:14:00Z",
		noteCount: 47,
		review: "魔幻现实主义巅峰。读完心里像被掏空了，又像被填满。",
	},
	{
		bookId: "mock-002",
		title: "夜航西飞",
		author: "[英] 柏瑞尔·马卡姆",
		translator: "陶立夏",
		publisher: "人民文学出版社",
		cover: COVER_PLACEHOLDER("夜航西飞", "#48d3e0"),
		intro: "她写非洲的天空、独自飞行的夜、以及与海明威的相遇。",
		category: "外国文学",
		status: "finished",
		progress: 100,
		readingTime: 86400 * 2.5,
		myRating: 4.5,
		publicRating: 9.0,
		startTime: "2026-02-15T00:00:00Z",
		finishTime: "2026-03-05T00:00:00Z",
		lastReadTime: "2026-03-05T23:01:00Z",
		noteCount: 23,
	},
	{
		bookId: "mock-003",
		title: "深度工作",
		author: "[美] 卡尔·纽波特",
		translator: "宋伟",
		publisher: "江西人民出版社",
		cover: COVER_PLACEHOLDER("深度工作", "#ff6b4a"),
		intro: "如何在信息爆炸的时代专注地完成有价值的工作。",
		category: "认知科学",
		status: "reading",
		progress: 62,
		readingTime: 86400 * 1.2,
		myRating: 4,
		publicRating: 7.8,
		startTime: "2026-04-20T00:00:00Z",
		lastReadTime: "2026-06-02T21:30:00Z",
		noteCount: 19,
		currentChapter: "第三章：深度工作是有意义的",
	},
	{
		bookId: "mock-004",
		title: "人类群星闪耀时",
		author: "[奥地利] 斯蒂芬·茨威格",
		translator: "舒昌善",
		publisher: "生活·读书·新知三联书店",
		cover: COVER_PLACEHOLDER("人类群星闪耀时", "#f0a8c0"),
		category: "历史",
		status: "reading",
		progress: 38,
		readingTime: 86400 * 0.8,
		publicRating: 9.0,
		startTime: "2026-05-10T00:00:00Z",
		lastReadTime: "2026-06-01T08:00:00Z",
		noteCount: 8,
		currentChapter: "滑铁卢的一分钟",
	},
	{
		bookId: "mock-005",
		title: "三体",
		author: "刘慈欣",
		publisher: "重庆出版社",
		cover: COVER_PLACEHOLDER("三体", "#7c5fb3"),
		intro: "宇宙级科幻史诗。",
		category: "科幻",
		status: "finished",
		progress: 100,
		readingTime: 86400 * 6,
		myRating: 5,
		publicRating: 9.4,
		startTime: "2025-11-01T00:00:00Z",
		finishTime: "2025-12-08T00:00:00Z",
		lastReadTime: "2025-12-08T23:59:00Z",
		noteCount: 88,
		review: "黑暗森林、降维打击、面壁人……每一个设定都让人脊背发凉。",
	},
	{
		bookId: "mock-006",
		title: "禅与摩托车维修艺术",
		author: "[美] 罗伯特·M·波西格",
		translator: "张国辰",
		cover: COVER_PLACEHOLDER("禅与摩托车维修艺术", "#48d3e0"),
		category: "哲学",
		status: "wishlist",
		progress: 0,
		readingTime: 0,
		publicRating: 8.4,
	},
	{
		bookId: "mock-007",
		title: "瓦尔登湖",
		author: "[美] 亨利·戴维·梭罗",
		translator: "潘庆舲",
		cover: COVER_PLACEHOLDER("瓦尔登湖", "#b58a3a"),
		category: "外国文学",
		status: "wishlist",
		progress: 0,
		readingTime: 0,
		publicRating: 8.7,
	},
	{
		bookId: "mock-008",
		title: "万历十五年",
		author: "[美] 黄仁宇",
		publisher: "中华书局",
		cover: COVER_PLACEHOLDER("万历十五年", "#c85540"),
		category: "历史",
		status: "finished",
		progress: 100,
		readingTime: 86400 * 1.8,
		myRating: 4.5,
		publicRating: 9.0,
		startTime: "2025-09-12T00:00:00Z",
		finishTime: "2025-09-28T00:00:00Z",
		lastReadTime: "2025-09-28T22:00:00Z",
		noteCount: 31,
	},
	{
		bookId: "mock-009",
		title: "原则",
		author: "[美] 瑞·达利欧",
		translator: "刘波",
		cover: COVER_PLACEHOLDER("原则", "#ff6b4a"),
		category: "商业",
		status: "abandoned",
		progress: 14,
		readingTime: 86400 * 0.3,
		startTime: "2026-03-20T00:00:00Z",
		lastReadTime: "2026-03-25T22:00:00Z",
	},
	{
		bookId: "mock-010",
		title: "悉达多",
		author: "[德] 赫尔曼·黑塞",
		translator: "杨玉功",
		cover: COVER_PLACEHOLDER("悉达多", "#5db4ff"),
		category: "外国文学",
		status: "finished",
		progress: 100,
		readingTime: 86400 * 1.5,
		myRating: 5,
		publicRating: 8.7,
		startTime: "2026-04-01T00:00:00Z",
		finishTime: "2026-04-15T00:00:00Z",
		lastReadTime: "2026-04-15T20:00:00Z",
		noteCount: 26,
		review: "一条河，一辈子。",
	},
	{
		bookId: "mock-011",
		title: "海边的卡夫卡",
		author: "[日] 村上春树",
		translator: "林少华",
		cover: COVER_PLACEHOLDER("海边的卡夫卡", "#f0a8c0"),
		category: "外国文学",
		status: "wishlist",
		progress: 0,
		readingTime: 0,
		publicRating: 8.1,
	},
	{
		bookId: "mock-012",
		title: "人间词话",
		author: "王国维",
		cover: COVER_PLACEHOLDER("人间词话", "#7c5fb3"),
		category: "文学评论",
		status: "reading",
		progress: 25,
		readingTime: 86400 * 0.4,
		publicRating: 9.3,
		startTime: "2026-05-25T00:00:00Z",
		lastReadTime: "2026-06-03T19:30:00Z",
		noteCount: 5,
		currentChapter: "境界说",
	},
];

const MOCK_NOTES: BookNote[] = [
	{
		bookId: "mock-001",
		bookTitle: "百年孤独",
		chapter: "第十七章",
		text: "过去都是假的，回忆是一条没有归途的路，一切以往的春天都不复存在，就连那最坚韧而又狂乱的爱情归根结底也不过是一种瞬息即逝的现实。",
		createTime: "2026-02-03T21:14:00Z",
	},
	{
		bookId: "mock-002",
		bookTitle: "夜航西飞",
		chapter: "第十八章",
		text: "我们生活在一个匆忙得无暇歌唱的时代里。",
		comment: "夜航的女人，比夜空更安静。",
		createTime: "2026-03-01T23:40:00Z",
	},
	{
		bookId: "mock-005",
		bookTitle: "三体",
		chapter: "黑暗森林",
		text: "弱小和无知不是生存的障碍，傲慢才是。",
		createTime: "2025-11-28T22:11:00Z",
	},
	{
		bookId: "mock-010",
		bookTitle: "悉达多",
		chapter: "渡船人",
		text: "我所学到的最重要的事情，便是倾听河流。",
		comment: "万物都在等待被听见。",
		createTime: "2026-04-12T20:15:00Z",
	},
	{
		bookId: "mock-003",
		bookTitle: "深度工作",
		chapter: "第二章",
		text: "高质量工作产出 = 时间 × 专注度。",
		createTime: "2026-05-30T22:00:00Z",
	},
	{
		bookId: "mock-008",
		bookTitle: "万历十五年",
		chapter: "海瑞——古怪的模范官僚",
		text: "他生活的简朴，无人能与之相比；但他给社会带来的，是最大的尴尬。",
		createTime: "2025-09-20T21:45:00Z",
	},
];

function buildMockHeatmap(): ReadingStats["heatmap"] {
	// 生成最近 365 天的伪随机阅读时长
	const days: ReadingStats["heatmap"] = [];
	const now = new Date();
	for (let i = 364; i >= 0; i--) {
		const d = new Date(now);
		d.setDate(now.getDate() - i);
		const seed = (d.getDate() * 31 + d.getMonth() * 17 + d.getFullYear()) % 97;
		// 60% 概率有阅读，时长 5-90 分钟
		const minutes = seed > 60 ? 0 : Math.floor((seed % 18) * 5 + 5);
		days.push({
			date: d.toISOString().slice(0, 10),
			minutes,
		});
	}
	return days;
}

const MOCK_STATS: ReadingStats = {
	year: new Date().getFullYear(),
	totalReadingTime: 86400 * 22, // 22 天
	finishedCount: 14,
	startedCount: 23,
	noteCount: 187,
	heatmap: buildMockHeatmap(),
};

const MOCK_PROFILE: ReadingProfile = {
	username: "yujok",
	totalReadingTime: 86400 * 142,
	totalFinished: 87,
	streak: 23,
	memberDays: 1247,
};

export const mockShelfData: BookShelfData = {
	books: MOCK_BOOKS,
	notes: MOCK_NOTES,
	stats: MOCK_STATS,
	profile: MOCK_PROFILE,
	generatedAt: new Date().toISOString(),
	isMock: true,
};
