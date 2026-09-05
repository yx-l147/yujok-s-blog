<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onDestroy, onMount, tick } from "svelte";

	interface Track {
		title: string;
		artist: string;
		src: string;
		cover?: string;
		color?: string;
	}

	export let tracks: Track[] = [];

	const GLYPHS = " .:-=+*#";
	let audio: HTMLAudioElement | null = null;
	let canvas: HTMLCanvasElement | null = null;
	let current = 0;
	let playing = false;
	let duration = 0;
	let position = 0;
	let volume = 0.72;
	let rememberedVolume = volume;
	let errorMessage = "";
	let loading = false;
	let wantsPlayback = false;
	let requestVersion = 0;
	let disposed = false;
	let showPlaylist = false;
	let search = "";
	let inView = false;
	let coverFailed = false;
	let pointerX = 0.5;
	let pointerY = 0.5;
	let pointerActive = false;
	let reduceMotion = false;
	let frame = 0;
	let lastFrame = 0;
	let resizeObserver: ResizeObserver | null = null;
	let motionQuery: MediaQueryList | null = null;
	let intersectionObserver: IntersectionObserver | null = null;
	let themeObserver: MutationObserver | null = null;

	$: track = tracks[current];
	$: progressPct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
	$: muted = volume === 0;
	$: filteredTracks = tracks.map((item, index) => ({ ...item, index })).filter((item) =>
		(item.title + " " + item.artist).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
	);

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
		const minutes = Math.floor(seconds / 60);
		const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
		return minutes + ":" + remainder;
	}

	async function safePlay(version = requestVersion) {
		if (!audio || disposed || version !== requestVersion) return;
		const element = audio;
		wantsPlayback = true;
		loading = true;
		errorMessage = "";
		try {
			await element.play();
			if (disposed || version !== requestVersion) return;
			loading = false;
		} catch (error) {
			// load(), a newer selection, or pause() can legitimately abort play().
			if (disposed || version !== requestVersion) return;
			loading = false;
			wantsPlayback = false;
			playing = false;
			if (error instanceof DOMException && error.name === "AbortError") return;
			errorMessage = "音频暂时无法播放，请检查文件或网络。";
			syncVisualizer();
		}
	}

	function toggle() {
		if (!audio) return;
		if (playing || wantsPlayback) {
			requestVersion += 1;
			wantsPlayback = false;
			loading = false;
			audio.pause();
		} else {
			void safePlay();
		}
	}

	async function selectTrack(index: number, autoplay = wantsPlayback || playing) {
		if (!tracks.length) return;
		const version = ++requestVersion;
		wantsPlayback = autoplay;
		audio?.pause();
		playing = false;
		loading = autoplay;
		current = ((index % tracks.length) + tracks.length) % tracks.length;
		position = 0;
		duration = 0;
		errorMessage = "";
		coverFailed = false;
		await tick();
		if (!audio || disposed || version !== requestVersion) return;
		audio.load();
		if (autoplay) void safePlay(version);
		syncVisualizer();
	}

	function previous() {
		void selectTrack(current - 1);
	}

	function next(autoplay = wantsPlayback || playing) {
		void selectTrack(current + 1, autoplay);
	}

	function seek(event: Event) {
		if (!audio || duration <= 0) return;
		const value = Number((event.currentTarget as HTMLInputElement).value);
		audio.currentTime = (value / 100) * duration;
		position = audio.currentTime;
		drawVisualizer(performance.now());
	}

	function changeVolume(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value) / 100;
		volume = value;
		if (volume > 0) rememberedVolume = volume;
		if (audio) audio.volume = volume;
	}

	function toggleMute() {
		if (volume > 0) {
			rememberedVolume = volume;
			volume = 0;
		} else {
			volume = rememberedVolume || 0.72;
		}
		if (audio) audio.volume = volume;
	}

	function pointerMove(event: PointerEvent) {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
		pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
		pointerActive = true;
		if (!playing) drawVisualizer(performance.now());
	}

	function pointerLeave() {
		pointerActive = false;
		if (!playing) drawVisualizer(performance.now());
	}

	function drawVisualizer(timestamp: number) {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const width = Math.round(rect.width * dpr);
		const height = Math.round(rect.height * dpr);
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
		}

		const context = canvas.getContext("2d");
		if (!context) return;
		context.setTransform(dpr, 0, 0, dpr, 0, 0);
		context.clearRect(0, 0, rect.width, rect.height);
		context.font = "600 10px 'JetBrains Mono Variable', ui-monospace, monospace";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillStyle = getComputedStyle(canvas).color;

		const cell = 12;
		const columns = Math.ceil(rect.width / cell);
		const rows = Math.ceil(rect.height / cell);
		const clock = playing && !reduceMotion ? timestamp * 0.00115 : position * 0.13;
		const cursorColumn = pointerX * columns;
		const cursorRow = pointerY * rows;

		for (let row = 0; row < rows; row += 1) {
			for (let column = 0; column < columns; column += 1) {
				const normalizedX = column / Math.max(1, columns - 1);
				const primaryWave =
					rows * 0.5 +
					Math.sin(normalizedX * 8.2 + clock * 3.1) * rows * 0.16 +
					Math.sin(normalizedX * 17.6 - clock * 1.65) * rows * 0.06;
				const cursorDistance = Math.hypot(column - cursorColumn, row - cursorRow);
				const cursorLift =
					pointerActive && !reduceMotion
						? Math.max(0, 1 - cursorDistance / 6) * (pointerY - 0.5) * rows * 0.55
						: 0;
				const distance = Math.abs(row - primaryWave + cursorLift);
				const energy = Math.max(0, 1 - distance / 3.2);
				if (energy < 0.08) continue;

				const shimmer = 0.78 + 0.22 * Math.sin(column * 1.73 + row * 0.81 + clock * 4.2);
				const glyphIndex = Math.min(
					GLYPHS.length - 1,
					Math.max(1, Math.floor(energy * shimmer * GLYPHS.length)),
				);
				context.globalAlpha = (playing ? 0.28 : 0.16) + energy * (playing ? 0.68 : 0.46);
				context.fillText(GLYPHS[glyphIndex], column * cell + cell / 2, row * cell + cell / 2);
			}
		}
		context.globalAlpha = 1;
	}

	function visualizerLoop(timestamp: number) {
		frame = 0;
		if (!playing || reduceMotion || !inView || document.hidden || disposed) return;
		if (timestamp - lastFrame > 42) {
			drawVisualizer(timestamp);
			lastFrame = timestamp;
		}
		frame = requestAnimationFrame(visualizerLoop);
	}

	function syncVisualizer() {
		cancelAnimationFrame(frame);
		frame = 0;
		if (disposed || document.hidden || !inView) return;
		drawVisualizer(performance.now());
		if (playing && !reduceMotion) frame = requestAnimationFrame(visualizerLoop);
	}

	function handleMotionChange(event: MediaQueryListEvent) {
		reduceMotion = event.matches;
		syncVisualizer();
	}

	onMount(() => {
		if (!audio || !canvas) return;
		disposed = false;
		const element = audio;

		const handlePlay = () => {
			playing = true;
			wantsPlayback = true;
			errorMessage = "";
			syncVisualizer();
		};
		const handlePause = () => {
			playing = false;
			syncVisualizer();
		};
		const handleEnded = () => next(true);
		const handleMetadata = () => {
			duration = Number.isFinite(audio?.duration) ? audio?.duration || 0 : 0;
			drawVisualizer(performance.now());
		};
		const handleTime = () => {
			position = audio?.currentTime || 0;
		};
		const handleError = () => {
			playing = false;
			loading = false;
			wantsPlayback = false;
			errorMessage = "这首歌没有成功载入，试试下一首。";
			syncVisualizer();
		};
		const handleWaiting = () => { loading = wantsPlayback; };
		const handlePlaying = () => { loading = false; };

		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);
		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("loadedmetadata", handleMetadata);
		audio.addEventListener("timeupdate", handleTime);
		audio.addEventListener("error", handleError);
		audio.addEventListener("waiting", handleWaiting);
		audio.addEventListener("playing", handlePlaying);
		audio.volume = volume;

		motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		reduceMotion = motionQuery.matches;
		motionQuery.addEventListener("change", handleMotionChange);
		resizeObserver = new ResizeObserver(syncVisualizer);
		resizeObserver.observe(canvas);
		intersectionObserver = new IntersectionObserver(([entry]) => {
			inView = entry.isIntersecting;
			syncVisualizer();
		});
		intersectionObserver.observe(canvas);
		themeObserver = new MutationObserver(syncVisualizer);
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
		document.addEventListener("visibilitychange", syncVisualizer);

		return () => {
			disposed = true;
			requestVersion += 1;
			element.pause();
			element.removeEventListener("play", handlePlay);
			element.removeEventListener("pause", handlePause);
			element.removeEventListener("ended", handleEnded);
			element.removeEventListener("loadedmetadata", handleMetadata);
			element.removeEventListener("timeupdate", handleTime);
			element.removeEventListener("error", handleError);
			element.removeEventListener("waiting", handleWaiting);
			element.removeEventListener("playing", handlePlaying);
			document.removeEventListener("visibilitychange", syncVisualizer);
		};
	});

	onDestroy(() => {
		cancelAnimationFrame(frame);
		resizeObserver?.disconnect();
		intersectionObserver?.disconnect();
		themeObserver?.disconnect();
		motionQuery?.removeEventListener("change", handleMotionChange);
	});
</script>

{#if tracks.length === 0}
	<div class="player-empty">
		<div class="empty-mark"><Icon icon="material-symbols:music-off-rounded" /></div>
		<strong>歌单还是空的</strong>
		<span>添加音频后，这里会出现播放器。</span>
	</div>
{:else}
	<div class="player" class:is-playing={playing} class:is-loading={loading}>
		<div class="visual-stage">
			<canvas
				bind:this={canvas}
				on:pointermove={pointerMove}
				on:pointerleave={pointerLeave}
				aria-hidden="true"
			></canvas>
			<div class="stage-top">
				<span class="play-state" role="status"><i></i>{loading ? "正在载入" : playing ? "正在播放" : "随时聆听"}</span>
				<button class="playlist-toggle" type="button" aria-label="播放列表" aria-expanded={showPlaylist} on:click={() => (showPlaylist = !showPlaylist)}>
					<Icon icon="material-symbols:queue-music-rounded" />
					<span>{tracks.length} 首</span>
				</button>
			</div>
		</div>
			<div class="stage-track">
				{#if track.cover && !coverFailed}
					<img src={track.cover} alt="" on:error={() => (coverFailed = true)} />
				{:else}
					<div class="cover-fallback"><Icon icon="material-symbols:graphic-eq-rounded" /></div>
				{/if}
				<div class="track-copy" aria-live="polite">
					<strong title={track.title}>{track.title}</strong>
					<span title={track.artist}>{track.artist}</span>
				</div>
			</div>

		{#if errorMessage}
			<div class="player-error" role="status">
				<Icon icon="material-symbols:error-outline-rounded" />
				<span>{errorMessage}</span>
			</div>
		{/if}

		<div class="timeline">
			<input
				type="range"
				min="0"
				max="100"
				step="0.1"
				disabled={duration <= 0}
				value={progressPct}
				on:input={seek}
				style={"--progress:" + progressPct + "%"}
				aria-label="播放进度"
				aria-valuetext={formatTime(position) + " / " + formatTime(duration)}
			/>
			<div class="time-row">
				<span>{formatTime(position)}</span>
				<span>-{formatTime(Math.max(0, duration - position))}</span>
			</div>
		</div>

		<div class="transport" aria-label="播放控制">
			<button type="button" aria-label="上一首" on:click={previous}>
				<Icon icon="material-symbols:skip-previous-rounded" />
			</button>
			<button class="primary-control" type="button" aria-label={playing || wantsPlayback ? "暂停" : "播放"} on:click={toggle}>
				<Icon icon={playing || wantsPlayback ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} />
			</button>
			<button type="button" aria-label="下一首" on:click={() => next()}>
				<Icon icon="material-symbols:skip-next-rounded" />
			</button>
		</div>

		<div class="volume-row">
			<button type="button" aria-label={muted ? "取消静音" : "静音"} on:click={toggleMute}>
				<Icon icon={muted ? "material-symbols:volume-off-rounded" : "material-symbols:volume-up-rounded"} />
			</button>
			<input
				type="range"
				min="0"
				max="100"
				step="1"
				value={volume * 100}
				on:input={changeVolume}
				style={"--volume:" + volume * 100 + "%"}
				aria-label="音量"
			/>
			<span>{Math.round(volume * 100)}</span>
		</div>

		{#if showPlaylist}
			<section class="playlist" aria-label="播放列表">
				<input class="playlist-search" type="search" bind:value={search} placeholder="搜索歌曲或歌手" aria-label="搜索歌曲或歌手" />
				<div class="playlist-tracks">
					{#each filteredTracks as item (item.index)}
						<button type="button" class:chosen={item.index === current} aria-current={item.index === current ? "true" : undefined} on:click={() => selectTrack(item.index, true)}>
							<span class="track-number">{String(item.index + 1).padStart(2, "0")}</span>
							<span class="playlist-copy"><strong>{item.title}</strong><small>{item.artist}</small></span>
							{#if item.index === current}<Icon icon="material-symbols:graphic-eq-rounded" />{/if}
						</button>
					{:else}
						<p class="no-results">没有找到匹配的歌曲</p>
					{/each}
				</div>
			</section>
		{/if}
		<audio bind:this={audio} src={track.src} preload="metadata"></audio>
	</div>
{/if}

<style>
	.player {
		display: flex;
		flex-direction: column;
		gap: 0.76rem;
		color: var(--text-strong);
	}

	.visual-stage {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		min-height: 6.4rem;
		padding: 0.74rem;
		border-radius: 0.9rem;
		background: color-mix(in srgb, var(--primary) 5%, var(--card-bg));
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-muted) 12%, transparent);
	}

	.visual-stage::after {
		content: "";
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		background: linear-gradient(180deg, transparent 62%, color-mix(in srgb, var(--card-bg) 68%, transparent));
	}

	canvas {
		position: absolute;
		inset: 1.3rem 0 0;
		width: 100%;
		height: calc(100% - 1.3rem);
		color: var(--primary);
		opacity: 0.88;
	}

	.stage-top,
	.stage-track,
	.play-state,
	.player-error,
	.transport,
	.volume-row {
		display: flex;
		align-items: center;
	}

	.stage-top {
		position: relative;
		justify-content: space-between;
		gap: 0.75rem;
		font-family: "JetBrains Mono Variable", ui-monospace, monospace;
		font-size: 0.64rem;
		font-weight: 620;
		color: var(--text-muted);
		letter-spacing: 0.06em;
	}

	.play-state { gap: 0.36rem; }
	.play-state i {
		width: 0.28rem;
		aspect-ratio: 1;
		border-radius: 999px;
		background: currentColor;
		opacity: 0.5;
	}
	.is-playing .play-state { color: var(--primary); }

	.stage-track {
		gap: 0.75rem;
		min-width: 0;
		padding: 0.15rem 0;
	}

	.stage-track img,
	.cover-fallback {
		width: 2.8rem;
		height: 2.8rem;
		flex: none;
		border-radius: 0.68rem;
		box-shadow: 0 0.4rem 1rem -0.55rem color-mix(in srgb, var(--text-strong) 42%, transparent);
	}

	.stage-track img { object-fit: cover; }

	.cover-fallback {
		display: grid;
		place-items: center;
		font-size: 1.2rem;
		color: var(--primary);
		background: color-mix(in srgb, var(--card-bg) 82%, transparent);
		box-shadow:
			inset 0 0 0 1px color-mix(in srgb, var(--primary) 20%, transparent),
			0 0.4rem 1rem -0.55rem color-mix(in srgb, var(--text-strong) 42%, transparent);
	}

	.track-copy {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		gap: 0.1rem;
	}

	.track-copy strong,
	.track-copy span {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.track-copy strong {
		font-size: 0.95rem;
		font-weight: 720;
		letter-spacing: -0.018em;
	}

	.track-copy span {
		font-size: 0.72rem;
		font-weight: 540;
		color: var(--text-muted);
	}

	.player-error {
		gap: 0.4rem;
		padding: 0.48rem 0.58rem;
		border-radius: 0.68rem;
		color: color-mix(in srgb, #d94f54 82%, var(--text-strong));
		background: color-mix(in srgb, #d94f54 9%, transparent);
		font-size: 0.65rem;
		line-height: 1.4;
	}

	.timeline { display: flex; flex-direction: column; gap: 0.34rem; }

	.timeline input,
	.volume-row input {
		width: 100%;
		margin: 0;
		appearance: none;
		-webkit-appearance: none;
		border: 0;
		outline: none;
		cursor: pointer;
	}

	.timeline input {
		height: 1rem;
		border-radius: 999px;
		background-size: 100% 3px;
		background-repeat: no-repeat;
		background-position: center;
		background-image: linear-gradient(
			to right,
			var(--primary) 0,
			var(--primary) var(--progress),
			color-mix(in srgb, var(--text-muted) 18%, transparent) var(--progress),
			color-mix(in srgb, var(--text-muted) 18%, transparent) 100%
		);
	}

	.timeline input::-webkit-slider-thumb,
	.volume-row input::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		border: 0;
		border-radius: 999px;
		background: var(--primary);
		box-shadow: 0 0 0 0.16rem var(--card-bg);
		transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.timeline input::-webkit-slider-thumb {
		width: 0.62rem;
		height: 0.62rem;
	}

	.timeline input::-moz-range-thumb,
	.volume-row input::-moz-range-thumb {
		border: 0;
		border-radius: 999px;
		background: var(--primary);
		box-shadow: 0 0 0 0.16rem var(--card-bg);
	}

	.timeline input:hover::-webkit-slider-thumb,
	.volume-row input:hover::-webkit-slider-thumb { transform: scale(1.22); }

	.time-row {
		display: flex;
		justify-content: space-between;
		font-family: "JetBrains Mono Variable", ui-monospace, monospace;
		font-size: 0.65rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.transport {
		justify-content: center;
		gap: 1rem;
	}

	.transport button,
	.volume-row button {
		display: grid;
		place-items: center;
		border-radius: 0.68rem;
		color: var(--text-muted);
		transition: color 180ms ease-out, background-color 180ms ease-out, transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.transport button {
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.35rem;
	}

	.transport button:hover,
	.volume-row button:hover {
		color: var(--primary);
		background: var(--btn-plain-bg-hover);
	}
	.transport button:active,
	.volume-row button:active { transform: scale(0.88); }

	.transport .primary-control {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		color: var(--card-bg);
		background: var(--text-strong);
		font-size: 1.42rem;
		box-shadow: none;
	}
	.transport .primary-control:hover { color: var(--card-bg); background: var(--text-strong); transform: scale(1.05); }
	.transport .primary-control:active { transform: scale(0.94); }

	.volume-row {
		display: grid;
		grid-template-columns: 1.72rem minmax(0, 1fr) 1.7rem;
		gap: 0.42rem;
		padding-top: 0.54rem;
		border-top: 1px solid color-mix(in srgb, var(--text-muted) 12%, transparent);
	}

	.volume-row button {
		width: 1.72rem;
		height: 1.72rem;
		font-size: 0.94rem;
	}

	.volume-row input {
		height: 1rem;
		border-radius: 999px;
		background-size: 100% 2px;
		background-repeat: no-repeat;
		background-position: center;
		background-image: linear-gradient(
			to right,
			var(--primary) 0,
			var(--primary) var(--volume),
			color-mix(in srgb, var(--text-muted) 15%, transparent) var(--volume),
			color-mix(in srgb, var(--text-muted) 15%, transparent) 100%
		);
	}

	.volume-row input::-webkit-slider-thumb {
		width: 0.48rem;
		height: 0.48rem;
	}

	.volume-row span {
		text-align: right;
		font-family: "JetBrains Mono Variable", ui-monospace, monospace;
		font-size: 0.58rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.transport button:focus-visible,
	.volume-row button:focus-visible,
	.timeline input:focus-visible,
	.volume-row input:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--primary) 60%, transparent);
		outline-offset: 2px;
	}

	.player-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.38rem;
		padding: 1rem 0 0.6rem;
		text-align: center;
		color: var(--text-muted);
	}

	.empty-mark {
		display: grid;
		place-items: center;
		width: 2.8rem;
		aspect-ratio: 1;
		margin-bottom: 0.18rem;
		border-radius: 0.82rem;
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 9%, transparent);
		font-size: 1.28rem;
	}

	.player-empty strong { color: var(--text-strong); font-size: 0.78rem; }
	.player-empty span { font-size: 0.66rem; }

	.playlist-toggle { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem; margin: -0.25rem; border-radius: 0.35rem; }
	.playlist-toggle :global(svg) { font-size: 1rem; }
	.playlist-toggle:hover { color: var(--text-strong); background: var(--btn-plain-bg-hover); }
	.playlist { display: grid; gap: 0.5rem; border-top: 1px solid var(--line-divider); padding-top: 0.75rem; }
	.playlist-search { width: 100%; min-width: 0; border: 1px solid var(--line-divider); background: var(--card-bg); color: var(--text-strong); border-radius: 0.5rem; padding: 0.6rem; font-size: 0.75rem; }
	.playlist-search::placeholder { color: var(--text-muted); }
	.playlist-tracks { max-height: 14rem; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; }
	.playlist-tracks button { display: flex; align-items: center; gap: 0.6rem; width: 100%; min-height: 2.8rem; padding: 0.5rem; border-radius: 0.5rem; text-align: left; }
	.playlist-tracks button:hover, .playlist-tracks button.chosen { background: var(--btn-plain-bg-hover); }
	.track-number { flex: none; font: 0.6rem ui-monospace, monospace; color: var(--text-muted); }
	.playlist-copy { display: grid; gap: 0.15rem; min-width: 0; flex: 1; }
	.playlist-copy strong { font-size: 0.75rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.playlist-copy small { color: var(--text-muted); font-size: 0.65rem; }
	.chosen :global(svg) { color: var(--primary); flex: none; }
	.no-results { padding: 1rem 0; text-align: center; font-size: 0.75rem; color: var(--text-muted); }
	.playlist-toggle:focus-visible, .playlist-search:focus-visible, .playlist-tracks button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
	.timeline input:disabled { opacity: 0.4; cursor: default; }

	@media (prefers-reduced-motion: no-preference) {
		.is-playing .play-state i {
			animation: status-blink 1.8s ease-in-out infinite;
		}
	}

	@keyframes status-blink {
		0%, 100% { opacity: 0.35; transform: scale(0.72); }
		50% { opacity: 1; transform: scale(1.16); }
	}

	@media (prefers-reduced-motion: reduce) {
		.transport button,
		.volume-row button,
		.timeline input::-webkit-slider-thumb,
		.volume-row input::-webkit-slider-thumb { transition-duration: 1ms; }
	}

	@media (prefers-contrast: more) {
		.visual-stage { box-shadow: inset 0 0 0 1px currentColor; }
		.player-error { box-shadow: inset 0 0 0 1px currentColor; }
	}
</style>
