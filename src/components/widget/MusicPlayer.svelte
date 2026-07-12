<script lang="ts">
import { onDestroy, onMount } from "svelte";

interface Track {
	title: string;
	artist: string;
	src: string;
	cover?: string;
}

export let tracks: Track[] = [];

let audio: HTMLAudioElement | null = null;
let current = 0;
let playing = false;
let duration = 0;
let position = 0;

$: track = tracks[current];
$: progressPct = duration ? Math.min(100, (position / duration) * 100) : 0;

function formatTime(s: number) {
	if (!Number.isFinite(s) || s < 0) return "0:00";
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60)
		.toString()
		.padStart(2, "0");
	return `${m}:${sec}`;
}

function toggle() {
	if (!audio) return;
	playing ? audio.pause() : audio.play();
}

function prev() {
	if (tracks.length === 0) return;
	current = (current - 1 + tracks.length) % tracks.length;
	resetAndPlay();
}

function next() {
	if (tracks.length === 0) return;
	current = (current + 1) % tracks.length;
	resetAndPlay();
}

function resetAndPlay() {
	if (!audio) return;
	audio.load();
	if (playing) audio.play();
}

function onSeek(e: Event) {
	if (!audio || !duration) return;
	const ratio = Number((e.currentTarget as HTMLInputElement).value) / 100;
	audio.currentTime = ratio * duration;
}

onMount(() => {
	if (!audio) return;
	audio.addEventListener("play", () => (playing = true));
	audio.addEventListener("pause", () => (playing = false));
	audio.addEventListener("ended", () => next());
	audio.addEventListener("loadedmetadata", () => {
		duration = audio?.duration || 0;
	});
	audio.addEventListener("timeupdate", () => {
		if (!audio) return;
		position = audio.currentTime;
	});
});

onDestroy(() => audio?.pause());
</script>

{#if tracks.length === 0}
	<div class="rs-music-empty">
		<div class="rs-music-empty-icon">♪</div>
		<div class="rs-music-empty-text">暂未配置歌单</div>
		<div class="rs-music-empty-hint">
			在 <code>src/config.ts</code> 的<br />
			<code>musicPlayer.tracks</code> 添加歌曲
		</div>
	</div>
{:else}
	<div class="rs-music">
		<div class="rs-music-head">
			{#if track.cover}
				<img
					src={track.cover}
					alt={track.title}
					class="rs-music-cover"
					class:is-playing={playing}
				/>
			{:else}
				<div class="rs-music-cover-placeholder" class:is-playing={playing}>♪</div>
			{/if}
			<div class="rs-music-meta">
				<div class="rs-music-title" title={track.title}>{track.title}</div>
				<div class="rs-music-artist" title={track.artist}>{track.artist}</div>
			</div>
		</div>

		<input
			type="range"
			min="0"
			max="100"
			step="0.1"
			value={progressPct}
			on:input={onSeek}
			class="rs-music-progress"
			style="--rs-progress: {progressPct}%"
			aria-label="播放进度"
		/>

		<div class="rs-music-times">
			<span>{formatTime(position)}</span>
			<span>{formatTime(duration)}</span>
		</div>

		<div class="rs-music-controls">
			<button class="rs-music-btn" aria-label="上一首" on:click={prev}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
			</button>
			<button
				class="rs-music-btn rs-music-btn-main"
				aria-label={playing ? "暂停" : "播放"}
				on:click={toggle}
			>
				{#if playing}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
				{:else}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
				{/if}
			</button>
			<button class="rs-music-btn" aria-label="下一首" on:click={next}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6l8.5 6L6 18zM16 6h2v12h-2z"/></svg>
			</button>
		</div>

		<audio bind:this={audio} src={track.src} preload="metadata"></audio>
	</div>
{/if}
