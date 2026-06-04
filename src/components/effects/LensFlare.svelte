<script lang="ts">
import { onDestroy, onMount } from "svelte";

let host: HTMLDivElement;
let raf = 0;
let reduced = false;

onMount(() => {
	if (typeof window === "undefined") return;
	reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
	if (reduced) return;

	let x = window.innerWidth / 2, y = window.innerHeight / 2;
	let tx = x, ty = y;
	let visible = false;
	let hideTimer = 0;

	const onMove = (e: PointerEvent) => {
		tx = e.clientX; ty = e.clientY;
		if (!visible) { host.style.opacity = "1"; visible = true; }
		window.clearTimeout(hideTimer);
		hideTimer = window.setTimeout(() => {
			host.style.opacity = "0";
			visible = false;
		}, 2400);
	};
	window.addEventListener("pointermove", onMove, { passive: true });

	const loop = () => {
		x += (tx - x) * 0.16;
		y += (ty - y) * 0.16;
		host.style.setProperty("--lf-x", `${x}px`);
		host.style.setProperty("--lf-y", `${y}px`);
		raf = requestAnimationFrame(loop);
	};
	raf = requestAnimationFrame(loop);

	return () => {
		cancelAnimationFrame(raf);
		window.removeEventListener("pointermove", onMove);
		window.clearTimeout(hideTimer);
	};
});

onDestroy(() => cancelAnimationFrame(raf));
</script>

<div
	bind:this={host}
	class="lens-flare-host"
	aria-hidden="true"
>
	<div class="lf-dot lf-1"></div>
	<div class="lf-dot lf-2"></div>
	<div class="lf-dot lf-3"></div>
	<div class="lf-dot lf-4"></div>
	<div class="lf-dot lf-5"></div>
</div>

<style>
.lens-flare-host {
	position: fixed;
	inset: 0;
	pointer-events: none;
	z-index: 35;
	opacity: 0;
	transition: opacity .6s cubic-bezier(0.16, 1, 0.3, 1);
	mix-blend-mode: screen;
	--lf-x: 50vw;
	--lf-y: 50vh;
}
.lf-dot {
	position: absolute;
	border-radius: 50%;
	filter: blur(8px);
	will-change: transform;
}
.lf-1 { /* 主圆 · 彗星青 */
	left: calc(var(--lf-x) - 120px);
	top:  calc(var(--lf-y) - 120px);
	width: 240px; height: 240px;
	background: radial-gradient(circle, rgba(72,211,224,.42), rgba(72,211,224,0) 70%);
}
.lf-2 { /* 银河蓝外圈 */
	left: calc(var(--lf-x) - 200px);
	top:  calc(var(--lf-y) - 200px);
	width: 400px; height: 400px;
	background: radial-gradient(circle, rgba(93,180,255,.18), rgba(93,180,255,0) 70%);
}
.lf-3 { /* 夕阳橙副圆 */
	left: calc(var(--lf-x) + 80px);
	top:  calc(var(--lf-y) - 80px);
	width: 120px; height: 120px;
	background: radial-gradient(circle, rgba(255,107,74,.55), rgba(255,107,74,0) 70%);
}
.lf-4 { /* 星河紫小圆 */
	left: calc(var(--lf-x) - 180px);
	top:  calc(var(--lf-y) + 60px);
	width: 90px; height: 90px;
	background: radial-gradient(circle, rgba(157,126,196,.55), rgba(157,126,196,0) 70%);
}
.lf-5 { /* 樱粉点缀 */
	left: calc(var(--lf-x) + 40px);
	top:  calc(var(--lf-y) + 90px);
	width: 60px; height: 60px;
	background: radial-gradient(circle, rgba(240,168,192,.6), rgba(240,168,192,0) 70%);
}
</style>
