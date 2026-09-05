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
	semester: string;
	startWeek: number;
	endWeek: number;
	totalWeeks: number;
	weeks: ScheduleWeek[];
	periods: SchedulePeriod[];
	courses: ScheduleCourse[];
	notes?: string[];
};

const weeks = (...items: number[]) => items;
const range = (start: number, end: number) =>
	Array.from({ length: end - start + 1 }, (_, index) => start + index);
const everyOtherWeek = (start: number, end: number) =>
	Array.from(
		{ length: Math.floor((end - start) / 2) + 1 },
		(_, index) => start + index * 2,
	);

// Imported from 潍坊学院综合信息门户课程表 (2026-2027-1), printed 2026-09-05.
export const scheduleTerm: ScheduleTerm = {
	semester: "2026-2027-1",
	startWeek: 1,
	endWeek: 18,
	totalWeeks: 18,
	weeks: [
		{ week: 1, start: "2026-09-07", end: "2026-09-13" },
		{ week: 2, start: "2026-09-14", end: "2026-09-20" },
		{ week: 3, start: "2026-09-21", end: "2026-09-27" },
		{ week: 4, start: "2026-09-28", end: "2026-10-04" },
		{ week: 5, start: "2026-10-05", end: "2026-10-11" },
		{ week: 6, start: "2026-10-12", end: "2026-10-18" },
		{ week: 7, start: "2026-10-19", end: "2026-10-25" },
		{ week: 8, start: "2026-10-26", end: "2026-11-01" },
		{ week: 9, start: "2026-11-02", end: "2026-11-08" },
		{ week: 10, start: "2026-11-09", end: "2026-11-15" },
		{ week: 11, start: "2026-11-16", end: "2026-11-22" },
		{ week: 12, start: "2026-11-23", end: "2026-11-29" },
		{ week: 13, start: "2026-11-30", end: "2026-12-06" },
		{ week: 14, start: "2026-12-07", end: "2026-12-13" },
		{ week: 15, start: "2026-12-14", end: "2026-12-20" },
		{ week: 16, start: "2026-12-21", end: "2026-12-27" },
		{ week: 17, start: "2026-12-28", end: "2027-01-03" },
		{ week: 18, start: "2027-01-04", end: "2027-01-10" },
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
	],
	courses: [
		{ id: "ai-math-mon-1", title: "人工智能数学基础", teacher: "邵星茂", location: "7134", day: 1, periodStart: 1, periodEnd: 2, weeks: range(1, 16), colorKey: "gold" },
		{ id: "probability-mon-3", title: "概率论与数理统计", teacher: "王静", location: "7223", day: 1, periodStart: 3, periodEnd: 4, weeks: range(1, 16), colorKey: "mint" },
		{ id: "data-structures-mon-5", title: "数据结构", teacher: "李耀明", location: "7208", day: 1, periodStart: 5, periodEnd: 6, weeks: range(1, 16), colorKey: "green" },
		{ id: "data-structures-mon-7", title: "数据结构", teacher: "李耀明", location: "7126", day: 1, periodStart: 7, periodEnd: 8, weeks: range(4, 16), colorKey: "green" },
		{ id: "english-tue-1", title: "大学英语（三）", teacher: "丁月霞", location: "7115", day: 2, periodStart: 1, periodEnd: 2, weeks: range(1, 16), colorKey: "sky" },
		{ id: "mao-tue-3", title: "毛泽东思想和中国特色社会主义理论体系概论", teacher: "谢璐", location: "6201", day: 2, periodStart: 3, periodEnd: 4, weeks: range(1, 16), colorKey: "coral" },
		{ id: "ai-math-tue-5-a", title: "人工智能数学基础", teacher: "邵星茂", location: "7134", day: 2, periodStart: 5, periodEnd: 6, weeks: range(1, 8), colorKey: "gold" },
		{ id: "ai-math-tue-5-b", title: "人工智能数学基础", teacher: "邵星茂", location: "7331", day: 2, periodStart: 5, periodEnd: 6, weeks: range(9, 16), colorKey: "gold" },
		{ id: "architecture-wed-1", title: "计算机组成原理", teacher: "周建梁", location: "7212", day: 3, periodStart: 1, periodEnd: 2, weeks: range(1, 16), colorKey: "aqua" },
		{ id: "marx-wed-3", title: "马克思主义基本原理", teacher: "邹雷靖", location: "7207", day: 3, periodStart: 3, periodEnd: 4, weeks: range(1, 16), colorKey: "pearl" },
		{ id: "mao-wed-5", title: "毛泽东思想和中国特色社会主义理论体系概论", teacher: "谢璐", location: "6201", day: 3, periodStart: 5, periodEnd: 6, weeks: everyOtherWeek(2, 16), colorKey: "coral" },
		{ id: "python-thu-1", title: "Python程序设计", teacher: "张辉辉", location: "7328", day: 4, periodStart: 1, periodEnd: 2, weeks: range(1, 16), colorKey: "pink" },
		{ id: "python-thu-3", title: "Python程序设计", teacher: "张辉辉", location: "7328", day: 4, periodStart: 3, periodEnd: 4, weeks: range(1, 16), colorKey: "pink" },
		{ id: "situation-thu-7", title: "形势与政策（3）", teacher: "周斌", location: "7207", day: 4, periodStart: 7, periodEnd: 8, weeks: range(5, 7), colorKey: "cyan" },
		{ id: "situation-thu-7-extra", title: "形势与政策（3）", teacher: "周斌", location: "待确认", day: 4, periodStart: 7, periodEnd: 8, weeks: weeks(8), colorKey: "cyan", note: "地点待确认" },
		{ id: "architecture-fri-1-even", title: "计算机组成原理", teacher: "周建梁", location: "7212", day: 5, periodStart: 1, periodEnd: 2, weeks: everyOtherWeek(2, 16), colorKey: "aqua" },
		{ id: "architecture-fri-1-odd", title: "计算机组成原理", teacher: "周建梁", location: "7129", day: 5, periodStart: 1, periodEnd: 2, weeks: weeks(9, 11, 13, 15), colorKey: "aqua" },
		{ id: "data-structures-fri-3", title: "数据结构", teacher: "李耀明", location: "7208", day: 5, periodStart: 3, periodEnd: 4, weeks: everyOtherWeek(1, 5), colorKey: "green" },
		{ id: "marx-fri-3", title: "马克思主义基本原理", teacher: "邹雷靖", location: "7207", day: 5, periodStart: 3, periodEnd: 4, weeks: everyOtherWeek(2, 16), colorKey: "pearl" },
		{ id: "pe-fri-7", title: "体育（三）", teacher: "张俊峰", location: "网球场1", day: 5, periodStart: 7, periodEnd: 8, weeks: range(1, 18), colorKey: "lemon", note: "网球7" },
	],
	notes: ["数据结构课程设计：李耀明、郑建军，17-18周。"],
};
