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

function formatKey(d: Date): string {
	const m = (d.getMonth() + 1).toString().padStart(2, "0");
	const day = d.getDate().toString().padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}

function buildKey(y: number, m: number, d: number): string {
	return `${y}-${(m + 1).toString().padStart(2, "0")}-${d
		.toString()
		.padStart(2, "0")}`;
}

interface Cell {
	day: number | null;
	key: string;
	hasPost: boolean;
	isToday: boolean;
}

let cells: Cell[] = [];
let viewLabel = "";

function rebuild(): void {
	const firstDay = new Date(viewYear, viewMonth, 1);
	const lastDay = new Date(viewYear, viewMonth + 1, 0);
	const startCol = (firstDay.getDay() + 6) % 7; // Monday-first
	const totalDays = lastDay.getDate();

	const arr: Cell[] = [];
	for (let i = 0; i < startCol; i++) {
		arr.push({ day: null, key: `pad-${i}`, hasPost: false, isToday: false });
	}
	for (let d = 1; d <= totalDays; d++) {
		const k = buildKey(viewYear, viewMonth, d);
		arr.push({
			day: d,
			key: k,
			hasPost: dateSet.has(k),
			isToday: k === todayKey,
		});
	}
	while (arr.length < 42) {
		arr.push({
			day: null,
			key: `pad-end-${arr.length}`,
			hasPost: false,
			isToday: false,
		});
	}
	cells = arr;
	viewLabel = `${viewYear} 年 ${viewMonth + 1} 月`;
}

async function swapTo(action: () => void) {
	swapping = true;
	await tick();
	setTimeout(() => {
		action();
		rebuild();
		// allow paint, then release
		requestAnimationFrame(() => {
			swapping = false;
		});
	}, 200);
}

function prev() {
	swapTo(() => {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear -= 1;
		} else {
			viewMonth -= 1;
		}
	});
}

function next() {
	swapTo(() => {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear += 1;
		} else {
			viewMonth += 1;
		}
	});
}

function backToCurrent() {
	swapTo(() => {
		const now = new Date();
		viewYear = now.getFullYear();
		viewMonth = now.getMonth();
	});
}

onMount(rebuild);

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
</script>

<div class="rs-cal-head">
	<button class="rs-cal-nav" aria-label="上一个月" on:click={prev}>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
	</button>
	<button class="rs-cal-title" title="回到当前月" on:click={backToCurrent}>
		{viewLabel}
	</button>
	<button class="rs-cal-nav" aria-label="下一个月" on:click={next}>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
	</button>
</div>

<div class="rs-cal-weekdays">
	{#each WEEKDAYS as w}
		<div class="rs-cal-weekday">{w}</div>
	{/each}
</div>

<div class="rs-cal-grid" class:is-swapping={swapping}>
	{#each cells as c, i (c.key)}
		{#if c.day === null}
			<div class="rs-cal-cell rs-cal-cell-pad" style="--i: {i}"></div>
		{:else if c.hasPost}
			<a
				class="rs-cal-cell rs-cal-cell-post"
				class:rs-cal-cell-today={c.isToday}
				style="--i: {i}"
				href={url(`/archive/?date=${c.key}`)}
				title={`查看 ${c.key} 的归档`}
			>
				{c.day}
			</a>
		{:else if c.isToday}
			<div class="rs-cal-cell rs-cal-cell-today" style="--i: {i}">
				{c.day}
			</div>
		{:else}
			<div class="rs-cal-cell" style="--i: {i}">{c.day}</div>
		{/if}
	{/each}
</div>
