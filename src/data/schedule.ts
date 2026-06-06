export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ScheduleCourse = {
	id: string;
	title: string;
	teacher?: string;
	location: string;
	day: WeekDay;
	periodStart: number;
	periodEnd: number;
	weeks: number[];
	colorKey: string;
	note?: string;
};

export type ScheduleWeek = {
	week: number;
	start: string;
	end: string;
};

export type SchedulePeriod = {
	index: number;
	label: string;
	start: string;
	end: string;
};

export type ScheduleTerm = {
	semester: "2025-2026-2";
	startWeek: number;
	endWeek: number;
	totalWeeks: number;
	weeks: ScheduleWeek[];
	periods: SchedulePeriod[];
	courses: ScheduleCourse[];
};

const weeks = (...items: number[]) => items;

// Imported from 潍坊学院综合信息门户课程表, covering weeks 13-18 of 2025-2026-2.
export const scheduleTerm: ScheduleTerm = {
	semester: "2025-2026-2",
	startWeek: 13,
	endWeek: 18,
	totalWeeks: 18,
	weeks: [
		{ week: 13, start: "2026-06-01", end: "2026-06-07" },
		{ week: 14, start: "2026-06-08", end: "2026-06-14" },
		{ week: 15, start: "2026-06-15", end: "2026-06-21" },
		{ week: 16, start: "2026-06-22", end: "2026-06-28" },
		{ week: 17, start: "2026-06-29", end: "2026-07-05" },
		{ week: 18, start: "2026-07-06", end: "2026-07-12" },
	],
	periods: [
		{ index: 1, label: "第1节", start: "08:00", end: "08:45" },
		{ index: 2, label: "第2节", start: "08:55", end: "09:50" },
		{ index: 3, label: "第3节", start: "10:10", end: "10:55" },
		{ index: 4, label: "第4节", start: "11:05", end: "12:00" },
		{ index: 5, label: "第5节", start: "14:00", end: "14:45" },
		{ index: 6, label: "第6节", start: "14:55", end: "15:50" },
		{ index: 7, label: "第7节", start: "16:10", end: "16:55" },
		{ index: 8, label: "第8节", start: "17:05", end: "18:00" },
		{ index: 9, label: "第9节", start: "19:00", end: "19:45" },
		{ index: 10, label: "第10节", start: "19:55", end: "20:50" },
		{ index: 11, label: "第11节", start: "21:00", end: "21:45" },
		{ index: 12, label: "第12节", start: "21:55", end: "22:40" },
	],
	courses: [
		{
			id: "math-mon-5",
			title: "高等数学A（二）",
			location: "7134",
			day: 1,
			periodStart: 5,
			periodEnd: 6,
			weeks: weeks(13, 14, 15, 16),
			colorKey: "gold",
		},
		{
			id: "sports-mon-7",
			title: "体育（二）",
			location: "篮东11",
			day: 1,
			periodStart: 7,
			periodEnd: 8,
			weeks: weeks(13, 14, 15, 16, 17),
			colorKey: "mint",
		},
		{
			id: "discrete-mon-3",
			title: "离散数学",
			location: "7211",
			day: 1,
			periodStart: 3,
			periodEnd: 4,
			weeks: weeks(14, 16),
			colorKey: "green",
		},
		{
			id: "physics-tue-1",
			title: "大学物理B",
			location: "7212",
			day: 2,
			periodStart: 1,
			periodEnd: 2,
			weeks: weeks(13, 14),
			colorKey: "sky",
		},
		{
			id: "discrete-tue-3",
			title: "离散数学",
			location: "7211",
			day: 2,
			periodStart: 3,
			periodEnd: 4,
			weeks: weeks(13, 14, 15, 16, 17),
			colorKey: "green",
		},
		{
			id: "linear-tue-5",
			title: "线性代数",
			location: "7214",
			day: 2,
			periodStart: 5,
			periodEnd: 6,
			weeks: weeks(13, 14, 15),
			colorKey: "coral",
		},
		{
			id: "math-wed-1",
			title: "高等数学A（二）",
			location: "7134",
			day: 3,
			periodStart: 1,
			periodEnd: 2,
			weeks: weeks(13, 14, 15, 16),
			colorKey: "aqua",
		},
		{
			id: "english-wed-3",
			title: "大学英语（二）",
			location: "7115",
			day: 3,
			periodStart: 3,
			periodEnd: 4,
			weeks: weeks(13, 14, 15, 16),
			colorKey: "pearl",
		},
		{
			id: "history-wed-5",
			title: "中国近现代史纲要",
			location: "7207",
			day: 3,
			periodStart: 5,
			periodEnd: 6,
			weeks: weeks(13, 14, 15, 16),
			colorKey: "gray",
		},
		{
			id: "math-thu-3",
			title: "高等数学A（二）",
			location: "7134",
			day: 4,
			periodStart: 3,
			periodEnd: 4,
			weeks: weeks(14, 16),
			colorKey: "pink",
		},
		{
			id: "ai-fri-1",
			title: "人工智能导论",
			location: "7213",
			day: 5,
			periodStart: 1,
			periodEnd: 2,
			weeks: weeks(13, 14, 15, 16, 17),
			colorKey: "cyan",
		},
		{
			id: "physics-fri-3",
			title: "大学物理B",
			location: "7212",
			day: 5,
			periodStart: 3,
			periodEnd: 4,
			weeks: weeks(13, 14),
			colorKey: "blue",
		},
		{
			id: "history-fri-7",
			title: "中国近现代史纲要",
			location: "7207",
			day: 5,
			periodStart: 7,
			periodEnd: 8,
			weeks: weeks(13, 15),
			colorKey: "lemon",
		},
		{
			id: "history-wed-9",
			title: "中国近现代史纲要",
			location: "2210",
			day: 3,
			periodStart: 9,
			periodEnd: 10,
			weeks: weeks(16),
			colorKey: "gray",
			note: "调课",
		},
		{
			id: "history-wed-3-extra",
			title: "中国近现代史纲要",
			location: "1210",
			day: 3,
			periodStart: 3,
			periodEnd: 4,
			weeks: weeks(17),
			colorKey: "blue",
			note: "调课",
		},
		{
			id: "history-fri-7-extra",
			title: "中国近现代史纲要",
			location: "2210",
			day: 5,
			periodStart: 7,
			periodEnd: 8,
			weeks: weeks(17),
			colorKey: "gray",
			note: "调课",
		},
	],
};
