<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";
import type {
	ScheduleCourse,
	SchedulePeriod,
	ScheduleTerm,
	WeekDay,
} from "../../data/schedule";

export let term: ScheduleTerm;

type ViewMode = "today" | "week" | "overview";
type CourseStatus = "current" | "next" | "done" | "idle";
type CourseGroup = {
	key: string;
	title: string;
	teacher?: string;
	locations: string[];
	weeks: number[];
	totalPeriods: number;
	colorKey: string;
};

const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const dayShortNames = ["一", "二", "三", "四", "五", "六", "日"];
const pairSlots = [
	{ start: 1, end: 2 },
	{ start: 3, end: 4 },
	{ start: 5, end: 6 },
	{ start: 7, end: 8 },
	{ start: 9, end: 10 },
	{ start: 11, end: 12 },
];

let view: ViewMode = "today";
let now = new Date();
let selectedWeek = getWeekForDate(now);

onMount(() => {
	now = new Date();
	selectedWeek = getWeekForDate(now);
	const timer = window.setInterval(() => {
		now = new Date();
	}, 60_000);
	return () => window.clearInterval(timer);
});

function parseDate(date: string) {
	const [year, month, day] = date.split("-").map(Number);
	return new Date(year, month - 1, day);
}

function endOfDate(date: string) {
	const value = parseDate(date);
	value.setHours(23, 59, 59, 999);
	return value;
}

function getWeekForDate(date: Date) {
	const matched = term.weeks.find((week) => {
		return date >= parseDate(week.start) && date <= endOfDate(week.end);
	});
	if (matched) return matched.week;

	const first = term.weeks[0];
	const last = term.weeks[term.weeks.length - 1];
	if (date < parseDate(first.start)) return first.week;
	return last.week;
}

function isDateInConfiguredRange(date: Date) {
	const first = term.weeks[0];
	const last = term.weeks[term.weeks.length - 1];
	return date >= parseDate(first.start) && date <= endOfDate(last.end);
}

function getDay(date: Date): WeekDay {
	const day = date.getDay();
	return (day === 0 ? 7 : day) as WeekDay;
}

function period(index: number): SchedulePeriod {
	return (
		term.periods.find((item) => item.index === index) ?? {
			index,
			label: `第${index}节`,
			start: "--:--",
			end: "--:--",
		}
	);
}

function periodRange(course: ScheduleCourse) {
	return `${period(course.periodStart).start}-${period(course.periodEnd).end}`;
}

function minuteOf(time: string) {
	const [hour, minute] = time.split(":").map(Number);
	return hour * 60 + minute;
}

function currentMinute() {
	return now.getHours() * 60 + now.getMinutes();
}

function courseStart(course: ScheduleCourse) {
	return minuteOf(period(course.periodStart).start);
}

function courseEnd(course: ScheduleCourse) {
	return minuteOf(period(course.periodEnd).end);
}

function coursesForWeek(week: number) {
	return term.courses
		.filter((course) => course.weeks.includes(week))
		.sort((a, b) => a.day - b.day || a.periodStart - b.periodStart);
}

function coursesForDay(week: number, day: WeekDay) {
	return coursesForWeek(week)
		.filter((course) => course.day === day)
		.sort((a, b) => a.periodStart - b.periodStart);
}

function statusFor(course: ScheduleCourse): CourseStatus {
	const currentWeek = getWeekForDate(now);
	if (selectedWeek !== currentWeek || course.day !== getDay(now)) return "idle";

	const minute = currentMinute();
	if (minute >= courseStart(course) && minute <= courseEnd(course))
		return "current";
	if (minute < courseStart(course)) {
		const firstUpcoming = todayCourses.find(
			(item) => currentMinute() < courseStart(item),
		);
		return firstUpcoming?.id === course.id ? "next" : "idle";
	}
	return "done";
}

function courseAt(
	courses: ScheduleCourse[],
	day: WeekDay,
	periodStart: number,
) {
	return courses.find(
		(course) => course.day === day && course.periodStart === periodStart,
	);
}

function setWeek(week: number) {
	selectedWeek = Math.min(term.endWeek, Math.max(term.startWeek, week));
}

function weekLabel(week: number) {
	const meta = term.weeks.find((item) => item.week === week);
	if (!meta) return `第 ${week} 周`;
	return `${meta.start.replace("2026-", "")} - ${meta.end.replace("2026-", "")}`;
}

function formatWeekList(weeks: number[]) {
	const sorted = [...new Set(weeks)].sort((a, b) => a - b);
	return sorted.map((week) => `第${week}周`).join(" / ");
}

function summarizeCourses(courses: ScheduleCourse[]): CourseGroup[] {
	const groups = new Map<string, CourseGroup>();
	for (const course of courses) {
		const key = `${course.title}-${course.teacher ?? ""}`;
		const existing =
			groups.get(key) ??
			({
				key,
				title: course.title,
				teacher: course.teacher,
				locations: [],
				weeks: [],
				totalPeriods: 0,
				colorKey: course.colorKey,
			} satisfies CourseGroup);

		existing.locations = [...new Set([...existing.locations, course.location])];
		existing.weeks = [...new Set([...existing.weeks, ...course.weeks])].sort(
			(a, b) => a - b,
		);
		existing.totalPeriods +=
			(course.periodEnd - course.periodStart + 1) * course.weeks.length;
		groups.set(key, existing);
	}
	return [...groups.values()].sort((a, b) => b.totalPeriods - a.totalPeriods);
}

$: currentWeek = getWeekForDate(now);
$: currentDay = getDay(now);
$: weekMeta = term.weeks.find((item) => item.week === selectedWeek);
$: weekCourses = coursesForWeek(selectedWeek);
$: todayCourses = coursesForDay(selectedWeek, currentDay);
$: visibleTodayCourses = todayCourses.length ? todayCourses : [];
$: nextCourse = todayCourses.find(
	(course) => currentMinute() <= courseEnd(course),
);
$: totalConfiguredCourses = term.courses.reduce(
	(count, course) => count + course.weeks.length,
	0,
);
$: termProgress =
	(Math.min(term.totalWeeks, Math.max(1, selectedWeek)) / term.totalWeeks) *
	100;
$: outOfConfiguredRange = !isDateInConfiguredRange(now);
$: overviewGroups = summarizeCourses(term.courses);
</script>

<section class="schedule-page">
	<div class="schedule-hero sk-glass sk-rise">
		<div class="hero-glow" aria-hidden="true"></div>
		<div class="hero-main">
			<div class="hero-copy">
				<p class="eyebrow">2025-2026-2</p>
				<h1 class="hero-title">课程表</h1>
				<p class="hero-subtitle">
					第 {selectedWeek} 周 · {weekMeta ? weekLabel(selectedWeek) : "教务门户数据"}
				</p>
			</div>
			<div class="hero-stats" aria-label="课程表概览">
				<div class="stat">
					<span>{weekCourses.length}</span>
					<p>本周课程</p>
				</div>
				<div class="stat">
					<span>{todayCourses.length}</span>
					<p>今日课程</p>
				</div>
				<div class="stat">
					<span>{totalConfiguredCourses}</span>
					<p>排课记录</p>
				</div>
			</div>
		</div>

		<div class="hero-bottom">
			<div class="next-panel" class:empty-next={!nextCourse}>
				<Icon icon={nextCourse ? "material-symbols:bolt-rounded" : "material-symbols:check-circle-rounded"} />
				<div>
					<p>{nextCourse ? "下一节课" : "今天已清空"}</p>
					<strong>{nextCourse ? nextCourse.title : "没有待上的课程"}</strong>
					<span>
						{nextCourse ? `${periodRange(nextCourse)} · ${nextCourse.location}` : "可以安心写代码了"}
					</span>
				</div>
			</div>
			<div class="progress-panel">
				<div class="progress-head">
					<span>学期进度</span>
					<strong>{Math.round(termProgress)}%</strong>
				</div>
				<div class="progress-track"><span style={`width:${termProgress}%`}></span></div>
			</div>
		</div>
	</div>

	<div class="schedule-toolbar sk-glass sk-rise" data-delay="1">
		<div class="toolbar-row">
			<div class="segmented" aria-label="切换课程表视图">
				<button class:active={view === "today"} on:click={() => (view = "today")}>
					<Icon icon="material-symbols:today-rounded" />
					<span>今日</span>
				</button>
				<button class:active={view === "week"} on:click={() => (view = "week")}>
					<Icon icon="material-symbols:calendar-view-week-rounded" />
					<span>本周</span>
				</button>
				<button class:active={view === "overview"} on:click={() => (view = "overview")}>
					<Icon icon="material-symbols:dataset-rounded" />
					<span>总览</span>
				</button>
			</div>

			<div class="week-arrows">
				<button aria-label="上一周" on:click={() => setWeek(selectedWeek - 1)} disabled={selectedWeek === term.startWeek}>
					<Icon icon="material-symbols:chevron-left-rounded" />
				</button>
				<button aria-label="回到本周" class="this-week" on:click={() => setWeek(currentWeek)}>本周</button>
				<button aria-label="下一周" on:click={() => setWeek(selectedWeek + 1)} disabled={selectedWeek === term.endWeek}>
					<Icon icon="material-symbols:chevron-right-rounded" />
				</button>
			</div>
		</div>

		<div class="week-strip" aria-label="选择周次">
			{#each term.weeks as item}
				<button class:active={item.week === selectedWeek} on:click={() => setWeek(item.week)}>
					<span>第 {item.week} 周</span>
					<small>{item.start.slice(5)} · {item.end.slice(5)}</small>
				</button>
			{/each}
		</div>

		{#if outOfConfiguredRange}
			<p class="range-note">
				当前日期不在已导入课表范围内，已显示最接近的第 {selectedWeek} 周。
			</p>
		{/if}
	</div>

	{#if view === "today"}
		<section class="today-view sk-rise" data-delay="2">
			<div class="section-head">
				<div>
					<p>Today</p>
					<h2>{dayNames[currentDay - 1]}的时间轴</h2>
				</div>
				<span>{now.toLocaleDateString("zh-CN")}</span>
			</div>

			{#if visibleTodayCourses.length}
				<div class="timeline">
					{#each visibleTodayCourses as course}
						<article class={`course-card ${course.colorKey}`} class:current={statusFor(course) === "current"} class:next={statusFor(course) === "next"} class:done={statusFor(course) === "done"}>
							<div class="time">
								<strong>{periodRange(course)}</strong>
								<span>第{course.periodStart}-{course.periodEnd}节</span>
							</div>
							<div class="course-body">
								<div class="status-row">
									<span class="status-dot"></span>
									<small>
										{statusFor(course) === "current"
											? "正在上课"
											: statusFor(course) === "next"
												? "下一节"
												: statusFor(course) === "done"
													? "已结束"
													: "待确认"}
									</small>
								</div>
								<h3>{course.title}</h3>
								<p>
									<Icon icon="material-symbols:location-on-outline-rounded" />
									{course.location}
									{#if course.teacher}
										<span>· {course.teacher}</span>
									{/if}
								</p>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<div class="empty-state sk-glass">
					<Icon icon="material-symbols:cloud-done-rounded" />
					<h3>今天没有课程</h3>
					<p>第 {selectedWeek} 周的{dayNames[currentDay - 1]}很清爽。</p>
				</div>
			{/if}
		</section>
	{:else if view === "week"}
		<section class="week-view sk-rise" data-delay="2">
			<div class="section-head">
				<div>
					<p>Week</p>
					<h2>第 {selectedWeek} 周课表</h2>
				</div>
				<span>{weekCourses.length ? `${weekCourses.length} 门安排` : "本周无课程"}</span>
			</div>

			<div class="desktop-grid sk-glass">
				<div class="grid-head time-head">节次</div>
				{#each dayNames as day, index}
					<div class:today-col={index + 1 === currentDay && selectedWeek === currentWeek} class="grid-head">
						<span>{day}</span>
						<small>{dayShortNames[index]}</small>
					</div>
				{/each}

				{#each pairSlots as slot}
					<div class="time-cell">
						<strong>第{slot.start}-{slot.end}节</strong>
						<span>{period(slot.start).start}-{period(slot.end).end}</span>
					</div>
					{#each dayNames as _day, index}
						{@const course = courseAt(weekCourses, (index + 1) as WeekDay, slot.start)}
						<div class="grid-cell">
							{#if course}
								<article class={`mini-card ${course.colorKey}`} class:current={statusFor(course) === "current"}>
									<strong>{course.title}</strong>
									<span>{course.location}</span>
									{#if course.note}<em>{course.note}</em>{/if}
								</article>
							{/if}
						</div>
					{/each}
				{/each}
			</div>

			<div class="mobile-days">
				{#each dayNames as day, index}
					{@const dayCourses = coursesForDay(selectedWeek, (index + 1) as WeekDay)}
					<section class="mobile-day sk-glass">
						<div class="mobile-day-head">
							<span>{index + 1}</span>
							<h3>{day}</h3>
							{#if index + 1 === currentDay && selectedWeek === currentWeek}
								<small>今天</small>
							{/if}
						</div>
						{#if dayCourses.length}
							<div class="mobile-course-list">
								{#each dayCourses as course}
									<article class={`course-card compact ${course.colorKey}`} class:current={statusFor(course) === "current"}>
										<div class="time">
											<strong>{periodRange(course)}</strong>
											<span>第{course.periodStart}-{course.periodEnd}节</span>
										</div>
										<div class="course-body">
											<h3>{course.title}</h3>
											<p>{course.location}{course.teacher ? ` · ${course.teacher}` : ""}</p>
										</div>
									</article>
								{/each}
							</div>
						{:else}
							<p class="mobile-empty">无课程</p>
						{/if}
					</section>
				{/each}
			</div>
		</section>
	{:else}
		<section class="overview-view sk-rise" data-delay="2">
			<div class="section-head">
				<div>
					<p>Overview</p>
					<h2>学期总览</h2>
				</div>
				<span>{overviewGroups.length} 门课程</span>
			</div>
			<div class="overview-grid">
				{#each overviewGroups as group}
					<article class={`overview-card sk-glass ${group.colorKey}`}>
						<div class="overview-top">
							<span>{group.totalPeriods}</span>
							<small>节</small>
						</div>
						<h3>{group.title}</h3>
						<p>{group.teacher ?? "任课教师待补充"}</p>
						<div class="overview-meta">
							<span><Icon icon="material-symbols:location-on-outline-rounded" />{group.locations.join(" / ")}</span>
							<span><Icon icon="material-symbols:date-range-rounded" />{formatWeekList(group.weeks)}</span>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}
</section>

<style>
	.schedule-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		color: var(--sk-moon);
	}

	.schedule-hero,
	.schedule-toolbar,
	.desktop-grid,
	.mobile-day,
	.empty-state,
	.overview-card {
		border-radius: 28px;
	}

	.schedule-hero {
		position: relative;
		padding: 2rem;
		overflow: hidden;
	}

	.hero-glow {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(520px circle at 12% 8%, color-mix(in srgb, var(--sk-river) 22%, transparent), transparent 68%),
			radial-gradient(460px circle at 88% 78%, color-mix(in srgb, var(--sk-sakura) 20%, transparent), transparent 70%),
			linear-gradient(135deg, color-mix(in srgb, var(--sk-gold) 10%, transparent), transparent 45%);
		pointer-events: none;
	}

	.hero-main,
	.hero-bottom,
	.schedule-toolbar > *,
	.today-view,
	.week-view,
	.overview-view {
		position: relative;
		z-index: 1;
		padding: 0 0.15rem;
	}

	.hero-main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.eyebrow,
	.section-head p {
		margin: 0 0 0.35rem;
		font-family: var(--sk-font-display);
		font-size: 1rem;
		color: var(--sk-comet);
		letter-spacing: 0;
	}

	.hero-title {
		margin: 0;
		font-family: var(--sk-font-han);
		font-size: 2.8rem;
		line-height: 1.05;
		color: var(--sk-moon);
		letter-spacing: 0;
	}

	.hero-subtitle {
		margin: 0.8rem 0 0;
		color: color-mix(in srgb, var(--sk-moon) 62%, transparent);
	}

	.hero-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(5.5rem, 1fr));
		gap: 0.8rem;
		min-width: 20rem;
	}

	.stat {
		padding: 1rem;
		border-radius: 18px;
		background: color-mix(in srgb, var(--sk-moon) 6%, transparent);
		border: 1px solid color-mix(in srgb, var(--sk-river) 20%, transparent);
	}

	.stat span {
		display: block;
		font-family: var(--sk-font-display);
		font-size: 2rem;
		line-height: 1;
		color: var(--sk-moon);
	}

	.stat p {
		margin: 0.35rem 0 0;
		font-size: 0.78rem;
		color: color-mix(in srgb, var(--sk-moon) 55%, transparent);
	}

	.hero-bottom {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(16rem, 0.75fr);
		gap: 1rem;
		margin-top: 1.6rem;
	}

	.next-panel,
	.progress-panel {
		display: flex;
		align-items: center;
		gap: 0.95rem;
		padding: 1rem;
		border-radius: 20px;
		background: color-mix(in srgb, white 28%, transparent);
		border: 1px solid color-mix(in srgb, var(--sk-glass-border) 88%, transparent);
	}

	.next-panel :global(svg) {
		flex: 0 0 auto;
		font-size: 1.6rem;
		color: var(--sk-sunset);
	}

	.next-panel.empty-next :global(svg) {
		color: var(--sk-comet);
	}

	.next-panel p,
	.next-panel strong,
	.next-panel span {
		display: block;
	}

	.next-panel p {
		margin: 0 0 0.15rem;
		font-size: 0.75rem;
		color: color-mix(in srgb, var(--sk-moon) 50%, transparent);
	}

	.next-panel strong {
		font-size: 1rem;
		color: var(--sk-moon);
	}

	.next-panel span {
		margin-top: 0.2rem;
		font-size: 0.78rem;
		color: color-mix(in srgb, var(--sk-moon) 56%, transparent);
	}

	.progress-panel {
		display: block;
	}

	.progress-head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.85rem;
	}

	.progress-track {
		height: 0.55rem;
		margin-top: 0.8rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--sk-moon) 10%, transparent);
		overflow: hidden;
	}

	.progress-track span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--sk-river), var(--sk-sakura), var(--sk-gold));
		box-shadow: 0 0 18px color-mix(in srgb, var(--sk-river) 42%, transparent);
	}

	.schedule-toolbar {
		padding: 1rem;
	}

	.toolbar-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.segmented,
	.week-arrows {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem;
		border-radius: 16px;
		background: color-mix(in srgb, var(--sk-moon) 7%, transparent);
	}

	button {
		font: inherit;
		color: inherit;
	}

	.segmented button,
	.week-arrows button,
	.week-strip button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		cursor: pointer;
		transition: transform 0.2s var(--sk-ease-out), background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
	}

	.segmented button {
		gap: 0.35rem;
		min-height: 2.35rem;
		padding: 0 0.85rem;
		border-radius: 12px;
		background: transparent;
		color: color-mix(in srgb, var(--sk-moon) 62%, transparent);
		font-weight: 700;
	}

	.segmented button.active,
	.week-arrows .this-week {
		background: color-mix(in srgb, var(--sk-river) 18%, white 16%);
		color: var(--sk-moon);
		box-shadow: inset 0 1px 0 color-mix(in srgb, white 45%, transparent);
	}

	.segmented button:hover,
	.week-arrows button:hover,
	.week-strip button:hover {
		transform: translateY(-1px);
	}

	.week-arrows button {
		width: 2.35rem;
		height: 2.35rem;
		border-radius: 12px;
		background: transparent;
	}

	.week-arrows .this-week {
		width: auto;
		padding: 0 0.85rem;
		font-weight: 700;
	}

	.week-arrows button:disabled {
		cursor: not-allowed;
		opacity: 0.35;
		transform: none;
	}

	.week-strip {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 0.65rem;
		margin-top: 0.85rem;
	}

	.week-strip button {
		flex-direction: column;
		gap: 0.15rem;
		min-height: 3.6rem;
		padding: 0.55rem 0.7rem;
		border-radius: 16px;
		background: color-mix(in srgb, var(--sk-moon) 5%, transparent);
		color: color-mix(in srgb, var(--sk-moon) 65%, transparent);
	}

	.week-strip button.active {
		color: white;
		background: linear-gradient(135deg, color-mix(in srgb, var(--sk-river) 78%, transparent), color-mix(in srgb, var(--sk-violet) 70%, transparent));
		box-shadow: 0 12px 28px color-mix(in srgb, var(--sk-river) 24%, transparent);
	}

	.week-strip span {
		font-weight: 800;
	}

	.week-strip small {
		font-size: 0.72rem;
		opacity: 0.7;
	}

	.range-note {
		margin: 0.8rem 0 0;
		font-size: 0.82rem;
		color: color-mix(in srgb, var(--sk-sunset) 78%, var(--sk-moon));
	}

	.section-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin: 0.4rem 0 1rem;
	}

	.section-head h2 {
		margin: 0;
		font-family: var(--sk-font-han);
		font-size: 1.45rem;
		color: var(--sk-moon);
		letter-spacing: 0;
	}

	.section-head > span {
		font-size: 0.86rem;
		color: color-mix(in srgb, var(--sk-moon) 55%, transparent);
	}

	.timeline,
	.mobile-course-list {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.course-card {
		position: relative;
		display: grid;
		grid-template-columns: 10rem minmax(0, 1fr);
		gap: 1rem;
		padding: 1rem;
		border-radius: 22px;
		background: color-mix(in srgb, var(--course) 18%, var(--sk-glass-bg));
		border: 1px solid color-mix(in srgb, var(--course) 36%, transparent);
		box-shadow: 0 14px 34px color-mix(in srgb, var(--course) 18%, transparent);
		overflow: hidden;
		transition: transform 0.25s var(--sk-ease-out), box-shadow 0.25s var(--sk-ease-out), opacity 0.25s ease;
	}

	.course-card::before,
	.mini-card::before,
	.overview-card::before {
		content: "";
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, color-mix(in srgb, white 34%, transparent), transparent 55%);
		pointer-events: none;
	}

	.course-card:hover,
	.overview-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 18px 42px color-mix(in srgb, var(--course) 24%, transparent);
	}

	.course-card.current {
		animation: course-pulse 2.8s ease-in-out infinite;
		border-color: color-mix(in srgb, var(--course) 76%, white);
	}

	.course-card.next {
		border-color: color-mix(in srgb, var(--sk-gold) 70%, transparent);
	}

	.course-card.done {
		opacity: 0.58;
	}

	@keyframes course-pulse {
		0%, 100% { box-shadow: 0 16px 40px color-mix(in srgb, var(--course) 24%, transparent); }
		50% { box-shadow: 0 20px 54px color-mix(in srgb, var(--course) 42%, transparent); }
	}

	.time,
	.course-body,
	.overview-card > * {
		position: relative;
		z-index: 1;
	}

	.time {
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-width: 0;
	}

	.time strong {
		font-family: var(--sk-font-display);
		font-size: 1.2rem;
		color: var(--sk-moon);
		white-space: nowrap;
	}

	.time span,
	.course-body p,
	.mobile-empty,
	.overview-meta {
		color: color-mix(in srgb, var(--sk-moon) 58%, transparent);
	}

	.course-body {
		min-width: 0;
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin-bottom: 0.3rem;
		color: color-mix(in srgb, var(--course) 80%, var(--sk-moon));
		font-weight: 800;
	}

	.status-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: currentColor;
		box-shadow: 0 0 14px currentColor;
	}

	.course-body h3,
	.overview-card h3 {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.25;
		color: var(--sk-moon);
		overflow-wrap: anywhere;
	}

	.course-body p {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: 0.45rem 0 0;
		font-size: 0.88rem;
	}

	.empty-state {
		display: grid;
		place-items: center;
		padding: 3rem 1.5rem;
		text-align: center;
	}

	.empty-state :global(svg) {
		font-size: 2.2rem;
		color: var(--sk-comet);
	}

	.empty-state h3 {
		margin: 0.8rem 0 0.3rem;
	}

	.empty-state p {
		margin: 0;
		color: color-mix(in srgb, var(--sk-moon) 58%, transparent);
	}

	.desktop-grid {
		display: grid;
		grid-template-columns: 7.2rem repeat(7, minmax(0, 1fr));
		overflow: hidden;
	}

	.grid-head,
	.time-cell,
	.grid-cell {
		min-height: 5.2rem;
		border-right: 1px solid color-mix(in srgb, var(--sk-moon) 9%, transparent);
		border-bottom: 1px solid color-mix(in srgb, var(--sk-moon) 9%, transparent);
	}

	.grid-head {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		min-height: 4.1rem;
		font-weight: 900;
		background: color-mix(in srgb, var(--sk-moon) 5%, transparent);
	}

	.grid-head small {
		display: grid;
		place-items: center;
		width: 1.55rem;
		height: 1.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--sk-river) 13%, transparent);
		color: var(--sk-river);
	}

	.today-col {
		color: var(--sk-river);
	}

	.time-cell {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.8rem;
		background: color-mix(in srgb, var(--sk-moon) 4%, transparent);
	}

	.time-cell strong {
		font-size: 0.88rem;
	}

	.time-cell span {
		font-family: var(--sk-font-display);
		font-size: 0.82rem;
		color: color-mix(in srgb, var(--sk-moon) 55%, transparent);
	}

	.grid-cell {
		padding: 0.45rem;
	}

	.mini-card {
		position: relative;
		min-height: 100%;
		padding: 0.75rem;
		border-radius: 16px;
		background: color-mix(in srgb, var(--course) 24%, transparent);
		border: 1px solid color-mix(in srgb, var(--course) 36%, transparent);
		overflow: hidden;
	}

	.mini-card.current {
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--course) 72%, white), 0 0 18px color-mix(in srgb, var(--course) 28%, transparent);
	}

	.mini-card strong,
	.mini-card span,
	.mini-card em {
		position: relative;
		z-index: 1;
		display: block;
	}

	.mini-card strong {
		font-size: 0.9rem;
		line-height: 1.28;
		overflow-wrap: anywhere;
	}

	.mini-card span {
		margin-top: 0.35rem;
		font-size: 0.78rem;
		color: color-mix(in srgb, var(--sk-moon) 64%, transparent);
	}

	.mini-card em {
		margin-top: 0.3rem;
		font-size: 0.72rem;
		font-style: normal;
		color: var(--sk-sunset);
	}

	.mobile-days {
		display: none;
		flex-direction: column;
		gap: 0.9rem;
	}

	.mobile-day {
		padding: 1rem;
	}

	.mobile-day-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.8rem;
	}

	.mobile-day-head span {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--sk-river) 16%, transparent);
		color: var(--sk-river);
		font-weight: 900;
	}

	.mobile-day-head h3 {
		margin: 0;
		font-size: 1rem;
	}

	.mobile-day-head small {
		margin-left: auto;
		border-radius: 999px;
		padding: 0.2rem 0.55rem;
		background: var(--sk-river);
		color: white;
		font-size: 0.72rem;
	}

	.course-card.compact {
		grid-template-columns: 8.2rem minmax(0, 1fr);
		padding: 0.85rem;
	}

	.mobile-empty {
		margin: 0;
		font-size: 0.86rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
	}

	.overview-card {
		position: relative;
		padding: 1.2rem;
		overflow: hidden;
		transition: transform 0.25s var(--sk-ease-out), box-shadow 0.25s var(--sk-ease-out);
	}

	.overview-top {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		color: color-mix(in srgb, var(--course) 75%, var(--sk-moon));
	}

	.overview-top span {
		font-family: var(--sk-font-display);
		font-size: 2.1rem;
		line-height: 1;
	}

	.overview-card h3 {
		margin-top: 0.75rem;
	}

	.overview-card p {
		margin: 0.35rem 0 0;
		color: color-mix(in srgb, var(--sk-moon) 58%, transparent);
	}

	.overview-meta {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		margin-top: 1rem;
		font-size: 0.82rem;
	}

	.overview-meta span {
		display: flex;
		align-items: flex-start;
		gap: 0.35rem;
	}

	.gold { --course: var(--sk-gold); }
	.mint { --course: #62d6a8; }
	.green { --course: #76dd75; }
	.sky { --course: #77c8ff; }
	.coral { --course: #ff8a74; }
	.aqua { --course: var(--sk-comet); }
	.pearl { --course: #adcfd0; }
	.gray { --course: #aaa6a0; }
	.pink { --course: var(--sk-sakura); }
	.cyan { --course: #67d5e8; }
	.blue { --course: var(--sk-river); }
	.lemon { --course: #f1dc65; }

	@media (max-width: 1040px) {
		.hero-main,
		.hero-bottom,
		.toolbar-row {
			flex-direction: column;
			align-items: stretch;
		}

		.hero-bottom {
			grid-template-columns: 1fr;
		}

		.hero-stats {
			min-width: 0;
		}

		.week-strip,
		.overview-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 760px) {
		.today-view,
		.week-view,
		.overview-view {
			padding: 0 1rem;
		}

		.schedule-hero {
			padding: 1.35rem;
		}

		.hero-title {
			font-size: 2.15rem;
		}

		.hero-stats {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.55rem;
			width: 100%;
		}

		.stat {
			min-width: 0;
			padding: 0.75rem;
		}

		.stat span {
			font-size: 1.55rem;
		}

		.stat p {
			font-size: 0.72rem;
			white-space: nowrap;
		}

		.segmented {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			width: 100%;
		}

		.week-arrows {
			justify-content: space-between;
		}

		.week-strip {
			display: flex;
			overflow-x: auto;
			scrollbar-width: none;
		}

		.week-strip::-webkit-scrollbar {
			display: none;
		}

		.week-strip button {
			min-width: 8rem;
		}

		.desktop-grid {
			display: none;
		}

		.mobile-days {
			display: flex;
		}

		.course-card,
		.course-card.compact {
			grid-template-columns: 1fr;
			gap: 0.65rem;
		}

		.time strong {
			font-size: 1.05rem;
		}

		.overview-grid {
			grid-template-columns: 1fr;
		}

		.section-head {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.35rem;
		}
	}
</style>
