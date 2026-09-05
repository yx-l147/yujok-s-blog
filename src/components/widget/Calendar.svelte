<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onMount } from "svelte";
	import { spring } from "svelte/motion";
	import { url } from "../../utils/url-utils";

	export let postDates: string[] = [];

	interface Cell {
		day: number;
		key: string;
		hasPost: boolean;
		isToday: boolean;
		isAdjacent: boolean;
		year: number;
		month: number;
	}

	interface MonthPane {
		index: number;
		cells: Cell[];
	}

	const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
	let today = new Date();
	let todayIndex = today.getFullYear() * 12 + today.getMonth();
	let todayKey = formatKey(today);
	const ambientSquares = Array.from({ length: 38 }, (_, index) => ({
		opacity: 0.08 + ((index * 17) % 19) / 100,
		delay: -((index * 0.19) % 2.8),
		duration: 2.1 + ((index * 13) % 12) / 10,
	}));

	let postDateSet = new Set(postDates);
	let viewIndex = todayIndex;
	// One continuous position: retargeting retains the live position and velocity.
	// Month units (rather than pixels) also survive a hidden/resized sidebar.
	const monthPosition = spring(viewIndex, { stiffness: 0.12, damping: 0.76, precision: 0.001 });
	let lastDirection = 0;
	let reduceMotion = false;

	$: postDateSet = new Set(postDates);
	$: viewYear = Math.floor(viewIndex / 12);
	$: viewMonth = ((viewIndex % 12) + 12) % 12;
	$: viewMonthLabel = String(viewMonth + 1) + "月";
	$: viewYearLabel = String(viewYear) + "年";
	$: isCurrentView = viewIndex === todayIndex;
	$: isAnimating = Math.abs($monthPosition - viewIndex) > 0.001;
	$: visibleIndex = Math.round($monthPosition);
	$: panes = makeRestingPanes(visibleIndex, postDateSet, todayKey);
	$: monthWritingDays = buildCells(viewIndex).filter((cell) => !cell.isAdjacent && postDateSet.has(cell.key)).length;

	function formatKey(date: Date): string {
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		return [date.getFullYear(), month, day].join("-");
	}

	function monthParts(index: number) {
		return {
			year: Math.floor(index / 12),
			month: ((index % 12) + 12) % 12,
		};
	}

	function buildCells(index: number): Cell[] {
		const { year, month } = monthParts(index);
		const firstDay = new Date(year, month, 1);
		const startColumn = (firstDay.getDay() + 6) % 7;

		return Array.from({ length: 42 }, (_, cellIndex) => {
			const date = new Date(year, month, cellIndex - startColumn + 1);
			const key = formatKey(date);
			return {
				day: date.getDate(),
				key,
				hasPost: postDateSet.has(key),
				isToday: key === todayKey,
				isAdjacent: date.getMonth() !== month,
				year: date.getFullYear(),
				month: date.getMonth(),
			};
		});
	}

	function makeRestingPanes(index: number, _dates: Set<string>, _today: string): MonthPane[] {
		return [index - 1, index, index + 1].map((paneIndex) => ({
			index: paneIndex,
			cells: buildCells(paneIndex),
		}));
	}

	function goToMonth(target: number) {
		lastDirection = Math.sign(target - $monthPosition);
		viewIndex = target;
		void monthPosition.set(target, { hard: reduceMotion });
	}

	function navigate(direction: 1 | -1) {
		// Reverse towards the month behind the current visual position immediately.
		// Repeated clicks in the same direction each advance another month.
		const reversing = isAnimating && direction !== lastDirection;
		const target = reversing
			? (direction < 0 ? Math.floor($monthPosition) : Math.ceil($monthPosition))
			: viewIndex + direction;
		goToMonth(target);
	}

	function backToCurrent() {
		goToMonth(todayIndex);
	}

	function jumpToCell(cell: Cell) {
		const target = cell.year * 12 + cell.month;
		if (target === viewIndex) return;
		goToMonth(target);
	}

	onMount(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const syncMotion = () => {
			reduceMotion = query.matches;
			if (reduceMotion) void monthPosition.set(viewIndex, { hard: true });
		};
		const refreshDate = () => {
			const wasCurrent = viewIndex === todayIndex;
			today = new Date();
			todayKey = formatKey(today);
			const nextIndex = today.getFullYear() * 12 + today.getMonth();
			if (wasCurrent && nextIndex !== todayIndex) goToMonth(nextIndex);
			todayIndex = nextIndex;
		};
		syncMotion();
		refreshDate();
		query.addEventListener("change", syncMotion);
		document.addEventListener("visibilitychange", refreshDate);
		const timer = window.setInterval(refreshDate, 60_000);
		return () => {
			void monthPosition.set(viewIndex, { hard: true });
			query.removeEventListener("change", syncMotion);
			document.removeEventListener("visibilitychange", refreshDate);
			window.clearInterval(timer);
		};
	});
</script>

<div class="calendar-shell">
	<div class="ambient-grid" aria-hidden="true">
		{#each ambientSquares as square}
			<span style={"--opacity:" + square.opacity + ";--delay:" + square.delay + "s;--duration:" + square.duration + "s"}></span>
		{/each}
	</div>

	<header class="calendar-header">
		<button class="calendar-title" type="button" on:click={backToCurrent} aria-label="回到本月">
			<small>{viewYearLabel}</small>
			<span>{String(viewMonth + 1).padStart(2, "0")}<em>月</em></span>
		</button>
		<div class="calendar-actions">
			<button
				class="today-button"
				class:is-visible={!isCurrentView || isAnimating}
				type="button"
				tabindex={isCurrentView && !isAnimating ? -1 : undefined}
				aria-hidden={isCurrentView && !isAnimating}
				on:click={backToCurrent}
			>
				本月
			</button>
			<div class="month-navigation" aria-label="月份切换">
				<button type="button" aria-label="上一个月" on:click={() => navigate(-1)}>
					<Icon icon="material-symbols:chevron-left-rounded" />
				</button>
				<button type="button" aria-label="下一个月" on:click={() => navigate(1)}>
					<Icon icon="material-symbols:chevron-right-rounded" />
				</button>
			</div>
		</div>
	</header>

	<div class="weekday-row" aria-hidden="true">
		{#each WEEKDAYS as weekday}
			<span>{weekday}</span>
		{/each}
	</div>

	<div
		class="calendar-viewport"
		aria-label={viewYearLabel + viewMonthLabel}
	>
		<div class="month-track" class:is-animating={isAnimating}>
			{#each panes as pane (pane.index)}
				<div
					class="month-pane"
					style:transform={"translate3d(" + (pane.index - $monthPosition) * 100 + "%, 0, 0)"}
					aria-hidden={pane.index !== visibleIndex}
					inert={pane.index !== visibleIndex}
				>
					{#each pane.cells as cell (cell.key)}
						{#if cell.hasPost}
							<a
								class="day-cell has-post"
								class:is-today={cell.isToday}
								class:is-adjacent={cell.isAdjacent}
								aria-current={cell.isToday ? "date" : undefined}
								href={url("/archive/?date=" + cell.key)}
								title={"查看 " + cell.key + " 的归档"}
							>
								<span>{cell.day}</span>
							</a>
						{:else if cell.isAdjacent}
							<button
								type="button"
								class="day-cell is-adjacent"
								aria-label={"前往 " + cell.year + "年" + (cell.month + 1) + "月"}
								on:click={() => jumpToCell(cell)}
							>
								<span>{cell.day}</span>
							</button>
						{:else}
							<div
								class="day-cell"
								class:is-today={cell.isToday}
								aria-current={cell.isToday ? "date" : undefined}
							>
								<span>{cell.day}</span>
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<footer class="calendar-legend">
		<span><i></i> 有文章</span>
		<span>本月 {monthWritingDays} 个写作日</span>
	</footer>
</div>

<style>
	.calendar-shell {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		padding: 0.15rem 0 0.1rem;
		color: var(--text-strong);
	}

	.ambient-grid {
		position: absolute;
		inset: -0.35rem -0.35rem auto 42%;
		display: grid;
		grid-template-columns: repeat(10, 0.32rem);
		gap: 0.26rem;
		justify-content: end;
		pointer-events: none;
		z-index: -1;
		mask-image: linear-gradient(90deg, transparent, #000 45%, #000);
	}

	.ambient-grid span {
		width: 0.32rem;
		aspect-ratio: 1;
		border-radius: 0.09rem;
		background: var(--primary);
		opacity: var(--opacity);
	}

	.calendar-header,
	.calendar-actions,
	.month-navigation,
	.calendar-legend {
		display: flex;
		align-items: center;
	}

	.calendar-header {
		min-height: 4.6rem;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.8rem;
	}

	.calendar-title {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
		min-width: 0;
		padding: 0.24rem 0.38rem;
		margin-left: -0.38rem;
		border-radius: 0.7rem;
		text-align: left;
		transition: background-color 180ms ease-out, transform 180ms ease-out;
	}

	.calendar-title span {
		font-size: 2.75rem;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.055em;
	}
	.calendar-title em { margin-left: 0.4rem; font-size: 0.85rem; font-style: normal; font-weight: 500; color: var(--text-muted); }

	.calendar-title small {
		font-size: 0.68rem;
		font-weight: 580;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.035em;
	}

	.calendar-title:hover { background: var(--btn-plain-bg-hover); }
	.calendar-title:active { transform: scale(0.97); }

	.calendar-actions { gap: 0.42rem; }
	.month-navigation {
		gap: 0.08rem;
		padding: 0.14rem;
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--text-muted) 8%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-muted) 10%, transparent);
	}

	.month-navigation button {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.58rem;
		color: var(--text-muted);
		font-size: 1.2rem;
		transition: color 180ms ease-out, background-color 180ms ease-out, transform 180ms ease-out;
	}

	.month-navigation button:hover {
		color: var(--primary);
		background: var(--btn-plain-bg-hover);
	}
	.month-navigation button:active { transform: scale(0.88); }

	.today-button {
		max-width: 0;
		overflow: hidden;
		padding: 0.28rem 0;
		border-radius: 999px;
		font-size: 0.67rem;
		font-weight: 650;
		white-space: nowrap;
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 11%, transparent);
		opacity: 0;
		pointer-events: none;
		transform: translateX(0.4rem);
		transition: max-width 260ms ease, padding 260ms ease, opacity 180ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.today-button.is-visible {
		max-width: 3.2rem;
		padding-inline: 0.62rem;
		opacity: 1;
		pointer-events: auto;
		transform: translateX(0);
	}
	.today-button:active { transform: scale(0.94); }

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.16rem;
		padding: 0 0.12rem 0.36rem;
	}

	.weekday-row span {
		text-align: center;
		font-size: 0.67rem;
		font-weight: 650;
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	.calendar-viewport {
		overflow: hidden;
		margin-inline: -0.12rem;
		touch-action: pan-y;
	}

	.month-track {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
	}

	.month-pane {
		grid-area: 1 / 1;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.16rem;
		padding-inline: 0.12rem;
	}
	.is-animating .month-pane { will-change: transform; }

	.day-cell {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		min-width: 0;
		padding: 0;
		border-radius: 0.66rem;
		font-size: 0.78rem;
		font-weight: 540;
		font-variant-numeric: tabular-nums;
		color: color-mix(in srgb, var(--text-strong) 90%, transparent);
		transition: color 180ms ease-out, background-color 180ms ease-out, box-shadow 180ms ease-out, transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	button.day-cell:hover,
	a.day-cell:hover {
		color: var(--text-strong);
		background: var(--btn-plain-bg-hover);
		box-shadow: inset 0 0 0 1px var(--line-divider);
		transform: scale(1.06);
	}
	button.day-cell:active,
	a.day-cell:active { transform: scale(0.91); }

	.day-cell.is-adjacent {
		color: var(--text-muted);
		opacity: 0.6;
	}
	.day-cell.is-adjacent:hover { opacity: 0.78; }

	.day-cell.has-post { font-weight: 680; }
	.day-cell.has-post::after {
		content: "";
		position: absolute;
		bottom: 0.2rem;
		left: 50%;
		width: 0.2rem;
		aspect-ratio: 1;
		border-radius: 999px;
		background: var(--primary);
		transform: translateX(-50%);
	}

	.day-cell.is-today {
		color: var(--card-bg);
		background: var(--text-strong);
		font-weight: 760;
		box-shadow: none;
	}
	.day-cell.is-today::after { background: currentColor; }

	.calendar-title:focus-visible,
	.today-button:focus-visible,
	.month-navigation button:focus-visible,
	.day-cell:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--primary) 60%, transparent);
		outline-offset: 2px;
	}

	.calendar-legend {
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 0.62rem;
		padding-top: 0.55rem;
		border-top: 1px solid color-mix(in srgb, var(--text-muted) 12%, transparent);
		font-size: 0.62rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.calendar-legend span:first-child { display: inline-flex; align-items: center; gap: 0.32rem; }
	.calendar-legend i {
		width: 0.22rem;
		aspect-ratio: 1;
		border-radius: 999px;
		background: var(--primary);
	}

	@media (prefers-reduced-motion: no-preference) {
		.ambient-grid span {
			animation: square-blink var(--duration) ease-in-out var(--delay) infinite alternate;
		}
	}

	@keyframes square-blink {
		from { opacity: calc(var(--opacity) * 0.35); transform: scale(0.72); }
		to { opacity: var(--opacity); transform: scale(1); }
	}

	@media (prefers-reduced-motion: reduce) {
		.month-track { will-change: auto; }
		.today-button,
		.calendar-title,
		.month-navigation button,
		.day-cell { transition-duration: 1ms; }
		button.day-cell:hover,
		a.day-cell:hover,
		button.day-cell:active,
		a.day-cell:active { transform: none; }
	}

	@media (prefers-contrast: more) {
		.month-navigation { box-shadow: inset 0 0 0 1px currentColor; }
		.day-cell.is-adjacent { opacity: 0.68; }
	}
</style>
