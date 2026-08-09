<script lang="ts">
import { onMount, tick } from "svelte";
import { url } from "../../utils/url-utils";

export let postDates: string[] = [];

const dateSet = new Set(postDates);

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
const todayKey = formatKey(today);

let swapping = false;
let dir: 1 | -1 = 1;

function formatKey(d: Date): string {
	const m = (d.getMonth() + 1).toString().padStart(2, "0");
	const day = d.getDate().toString().padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}

interface Cell {
	day: number;
	key: string;
	hasPost: boolean;
	isToday: boolean;
	isAdjacent: boolean;
	year: number;
	month: number;
}

let cells: Cell[] = [];
let viewMonthLabel = "";
let viewYearLabel = "";
let isCurrentView = true;

function rebuild(): void {
	const firstDay = new Date(viewYear, viewMonth, 1);
	const startCol = (firstDay.getDay() + 6) % 7; // Monday-first

	// 日历式补满 42 格：月初/月末用相邻月日期填满，Date 运算天然处理跨月跨年
	const arr: Cell[] = [];
	for (let i = 0; i < 42; i++) {
		const d = new Date(viewYear, viewMonth, i - startCol + 1);
		const k = formatKey(d);
		arr.push({
			day: d.getDate(),
			key: k,
			hasPost: dateSet.has(k),
			isToday: k === todayKey,
			isAdjacent: d.getMonth() !== viewMonth,
			year: d.getFullYear(),
			month: d.getMonth(),
		});
	}
	cells = arr;
	viewMonthLabel = `${viewMonth + 1}月`;
	viewYearLabel = `${viewYear}年`;
	isCurrentView =
		viewYear === today.getFullYear() && viewMonth === today.getMonth();
}

async function swapTo(action: () => void, direction: 1 | -1) {
	dir = direction;
	swapping = true;
	await tick();
	setTimeout(() => {
		action();
		rebuild();
		// allow paint, then release
		requestAnimationFrame(() => {
			swapping = false;
		});
	}, 140);
}

function prev() {
	if (swapping) return;
	swapTo(() => {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear -= 1;
		} else {
			viewMonth -= 1;
		}
	}, -1);
}

function next() {
	if (swapping) return;
	swapTo(() => {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear += 1;
		} else {
			viewMonth += 1;
		}
	}, 1);
}

function backToCurrent() {
	if (isCurrentView || swapping) return;
	const direction: 1 | -1 =
		today.getFullYear() * 12 + today.getMonth() > viewYear * 12 + viewMonth
			? 1
			: -1;
	swapTo(() => {
		viewYear = today.getFullYear();
		viewMonth = today.getMonth();
	}, direction);
}

function jumpToCell(cell: Cell) {
	if (swapping) return;
	const direction: 1 | -1 =
		cell.year * 12 + cell.month > viewYear * 12 + viewMonth ? 1 : -1;
	swapTo(() => {
		viewYear = cell.year;
		viewMonth = cell.month;
	}, direction);
}

onMount(rebuild);

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
</script>

<div class="rs-cal-head">
	<button
		class="rs-cal-title"
		title="回到本月"
		aria-label="回到本月"
		on:click={backToCurrent}
	>
		<span class="rs-cal-title-month">{viewMonthLabel}</span>
		<span class="rs-cal-title-year">{viewYearLabel}</span>
	</button>
	<button
		class="rs-cal-today"
		class:is-visible={!isCurrentView}
		aria-hidden={isCurrentView}
		tabindex={isCurrentView ? -1 : undefined}
		on:click={backToCurrent}
	>
		回到今天
	</button>
	<div class="rs-cal-navs">
		<button class="rs-cal-nav" aria-label="上一个月" on:click={prev}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
		</button>
		<button class="rs-cal-nav" aria-label="下一个月" on:click={next}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
		</button>
	</div>
</div>

<div class="rs-cal-weekdays">
	{#each WEEKDAYS as w}
		<div class="rs-cal-weekday">{w}</div>
	{/each}
</div>

<div class="rs-cal-grid" class:is-swapping={swapping} style="--dir: {dir}">
	{#each cells as c, i (c.key)}
		{#if c.hasPost}
			<a
				class="rs-cal-cell rs-cal-cell-post"
				class:rs-cal-cell-today={c.isToday}
				class:rs-cal-cell-adjacent={c.isAdjacent}
				aria-current={c.isToday ? "date" : undefined}
				style="--i: {i}"
				href={url(`/archive/?date=${c.key}`)}
				title={`查看 ${c.key} 的归档`}
			>
				{c.day}
			</a>
		{:else if c.isAdjacent}
			<button
				type="button"
				class="rs-cal-cell rs-cal-cell-adjacent"
				style="--i: {i}"
				aria-label={`前往 ${c.year}年${c.month + 1}月${c.day}日`}
				on:click={() => jumpToCell(c)}
			>
				{c.day}
			</button>
		{:else}
			<div
				class="rs-cal-cell"
				class:rs-cal-cell-today={c.isToday}
				aria-current={c.isToday ? "date" : undefined}
				style="--i: {i}"
			>
				{c.day}
			</div>
		{/if}
	{/each}
</div>
