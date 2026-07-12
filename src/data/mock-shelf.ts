import type {
	BookItem,
	BookNote,
	BookShelfData,
	ReadingProfile,
	ReadingStats,
} from "@/types/weread";

/**
 * mock 数据：未配置 weread skill 时的兜底展示数据
 *
 * 配置后请运行 `pnpm fetch-weread`，
 * 真实数据会写入 src/data/weread/shelf.json 并自动覆盖 mock。
 */

const COVER = (seed: string, accent = "5db4ff") =>
	`https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a1428&shape1Color=${accent}&shape2Color=7c5fb3&shape3Color=ff6b4a`;

const MOCK_BOOKS: BookItem[] = [
	{
		bookId: "mock-001",
		title: "百年孤独",
		author: "[哥伦比亚] 加西亚·马尔克斯",
		translator: "范晔",
		publisher: "南海出版公司",
		cover: COVER("百年孤独"),
		intro:
			"多年以后，奥雷里亚诺·布恩迪亚上校将会回想起，父亲带他去见识冰块的那个遥远的下午。",
		category: "外国文学-经典名著",
		finishReading: 1,
		progress: 100,
		readTime: 86400 * 4,
		publicRating: 9.3,
		noteCount: 47,
		bookmarkCount: 32,
		readUpdateTime: 1738000000,
		status: "finished",
	},
	{
		bookId: "mock-002",
		title: "西西弗神话",
		author: "[法] 阿尔贝·加缪",
		translator: "袁筱一",
		cover: COVER("西西弗神话", "48d3e0"),
		intro: "真正严肃的哲学问题只有一个，那就是自杀。",
		category: "哲学宗教-西方哲学",
		finishReading: 1,
		progress: 100,
		readTime: 86400 * 2.5,
		publicRating: 9.0,
		noteCount: 23,
		bookmarkCount: 18,
		readUpdateTime: 1735000000,
		status: "finished",
	},
	{
		bookId: "mock-003",
		title: "活出生命的意义",
		author: "[奥] 维克多·弗兰克尔",
		cover: COVER("活出生命的意义", "ff6b4a"),
		intro: "知道为什么而活的人，便能生存。",
		category: "心理-个人成长",
		finishReading: 0,
		progress: 68,
		publicRating: 8.9,
		noteCount: 19,
		bookmarkCount: 12,
		readUpdateTime: 1748000000,
		status: "reading",
	},
	{
		bookId: "mock-004",
		title: "先知",
		author: "[黎巴嫩] 纪伯伦",
		cover: COVER("先知", "f0a8c0"),
		category: "文学-外国诗歌",
		finishReading: 0,
		progress: 6,
		publicRating: 9.0,
		noteCount: 3,
		readUpdateTime: 1748100000,
		status: "reading",
	},
	{
		bookId: "mock-005",
		title: "悉达多",
		author: "[德] 赫尔曼·黑塞",
		translator: "杨玉功",
		cover: COVER("悉达多", "7c5fb3"),
		intro: "一条河，一辈子。",
		category: "外国文学-经典名著",
		finishReading: 1,
		progress: 100,
		readTime: 86400 * 1.5,
		publicRating: 8.7,
		noteCount: 26,
		bookmarkCount: 14,
		readUpdateTime: 1744000000,
		status: "finished",
	},
	{
		bookId: "mock-006",
		title: "瓦尔登湖",
		author: "[美] 亨利·戴维·梭罗",
		translator: "潘庆舲",
		cover: COVER("瓦尔登湖", "b58a3a"),
		category: "外国文学-随笔",
		finishReading: 0,
		progress: 0,
		publicRating: 8.7,
		status: "wishlist",
	},
];

const MOCK_NOTES: BookNote[] = [
	{
		bookId: "mock-001",
		bookTitle: "百年孤独",
		bookCover: COVER("百年孤独"),
		chapter: "第十七章",
		text: "过去都是假的，回忆是一条没有归途的路，一切以往的春天都不复存在。",
		createTime: "2026-02-03T21:14:00",
	},
	{
		bookId: "mock-002",
		bookTitle: "西西弗神话",
		bookCover: COVER("西西弗神话", "48d3e0"),
		chapter: "荒诞与自杀",
		text: "应当想象西西弗是幸福的。",
		createTime: "2026-03-01T23:40:00",
	},
	{
		bookId: "mock-005",
		bookTitle: "悉达多",
		bookCover: COVER("悉达多", "7c5fb3"),
		chapter: "渡船人",
		text: "我所学到的最重要的事情，便是倾听河流。",
		createTime: "2026-04-12T20:15:00",
	},
];

function buildMockHeatmap(): ReadingStats["heatmap"] {
	const days: ReadingStats["heatmap"] = [];
	const now = new Date();
	for (let i = 364; i >= 0; i--) {
		const d = new Date(now);
		d.setDate(now.getDate() - i);
		const seed = (d.getDate() * 31 + d.getMonth() * 17) % 97;
		const minutes = seed > 60 ? 0 : (seed % 18) * 5 + 5;
		days.push({ date: d.toISOString().slice(0, 10), seconds: minutes * 60 });
	}
	return days;
}

const MOCK_STATS: ReadingStats = {
	totalReadTime: 86400 * 7.2,
	readDays: 246,
	readBooks: 117,
	finishedBooks: 18,
	noteCount: 5538,
	preferTimeWord: "偏好白天阅读",
	preferCategoryWord: "偏好阅读文学",
	preferCategory: [
		{ title: "文学", count: 46, time: 201866 },
		{ title: "心理", count: 11, time: 121831 },
		{ title: "哲学宗教", count: 15, time: 74567 },
		{ title: "社会小说", count: 13, time: 56987 },
	],
	preferAuthor: [
		{ name: "阿尔贝·加缪", count: 4, readTime: "11小时" },
		{ name: "艾里希·弗洛姆", count: 3, readTime: "16小时11分钟" },
		{ name: "赫尔曼·黑塞", count: 3, readTime: "7小时49分钟" },
	],
	registTime: 1657349563,
	heatmap: buildMockHeatmap(),
};

const MOCK_PROFILE: ReadingProfile = {
	totalBooks: 6,
	secretCount: 0,
	favBook: {
		title: "西西弗神话",
		author: "[法] 阿尔贝·加缪",
		cover: COVER("西西弗神话", "48d3e0"),
	},
};

export const mockShelfData: BookShelfData = {
	books: MOCK_BOOKS,
	notes: MOCK_NOTES,
	stats: MOCK_STATS,
	profile: MOCK_PROFILE,
	generatedAt: new Date().toISOString(),
	isMock: true,
};
