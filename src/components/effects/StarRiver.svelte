<script lang="ts">
import { onDestroy, onMount } from "svelte";

interface Props {
	density?: number; // 星点数量
	speed?: number; // 漂移速度
	meteors?: boolean; // 是否包含流星
}

let { density = 220, speed = 0.18, meteors = true }: Props = $props();

let canvas: HTMLCanvasElement;
let raf = 0;
let observer: IntersectionObserver | null = null;
let visible = true;
let reduced = false;

interface Star {
	x: number;
	y: number;
	z: number;
	r: number;
	tw: number;
	ph: number;
	hue: number;
}
interface Meteor {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	max: number;
}

onMount(() => {
	if (typeof window === "undefined") return;
	reduced =
		window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

	const ctx = canvas.getContext("2d", { alpha: true }) ?? null;
	if (!ctx) return;
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	let w = 0;
	let h = 0;
	let stars: Star[] = [];
	let mts: Meteor[] = [];
	let lastT = 0;
	let mouseX = 0.5;
	let mouseY = 0.5;

	const resize = () => {
		const rect = canvas.getBoundingClientRect();
		w = rect.width;
		h = rect.height;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		ctx.scale(dpr, dpr);
		stars = Array.from({ length: density }, () => ({
			x: Math.random() * w,
			y: Math.random() * h,
			z: Math.random() * 0.85 + 0.15,
			r: Math.random() * 1.3 + 0.2,
			tw: Math.random() * 0.8 + 0.4,
			ph: Math.random() * Math.PI * 2,
			hue:
				Math.random() < 0.18
					? 200 + Math.random() * 70 // 紫蓝
					: Math.random() < 0.5
						? 0 // 暖色（少量夕阳）
						: 220, // 主银河蓝
		}));
	};
	resize();
	window.addEventListener("resize", resize);

	const handleMouse = (e: PointerEvent) => {
		const rect = canvas.getBoundingClientRect();
		mouseX = (e.clientX - rect.left) / rect.width;
		mouseY = (e.clientY - rect.top) / rect.height;
	};
	window.addEventListener("pointermove", handleMouse);

	const spawnMeteor = () => {
		mts.push({
			x: w * (0.5 + Math.random() * 0.5),
			y: h * Math.random() * 0.4,
			vx: -(180 + Math.random() * 120),
			vy: 140 + Math.random() * 80,
			life: 0,
			max: 1.6 + Math.random() * 0.6,
		});
	};
	let meteorTimer = 6000;

	const tick = (t: number) => {
		const dt = Math.min((t - lastT) / 1000, 0.05);
		lastT = t;
		if (!visible) {
			raf = requestAnimationFrame(tick);
			return;
		}

		ctx.clearRect(0, 0, w, h);

		// 星点
		for (const s of stars) {
			s.ph += dt * s.tw * 1.6;
			const tw = 0.55 + Math.sin(s.ph) * 0.45;
			// 鼠标轻微引力
			const dx = (mouseX - s.x / w) * 14 * s.z;
			const dy = (mouseY - s.y / h) * 10 * s.z;
			s.x += dt * speed * (dx + 12) * s.z;
			s.y += dt * speed * (dy + 6) * s.z;
			if (s.x > w + 4) s.x = -4;
			if (s.x < -4) s.x = w + 4;
			if (s.y > h + 4) s.y = -4;
			if (s.y < -4) s.y = h + 4;

			const hue = s.hue;
			const sat = hue === 0 ? 90 : hue === 200 ? 70 : 85;
			const lig = 70 + tw * 25;
			ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lig}%, ${tw * s.z})`;
			ctx.beginPath();
			ctx.arc(s.x, s.y, s.r * s.z * (0.8 + tw * 0.6), 0, Math.PI * 2);
			ctx.fill();

			// 大星点加微光
			if (s.r > 1.0 && tw > 0.85) {
				ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lig}%, ${tw * 0.18})`;
				ctx.beginPath();
				ctx.arc(s.x, s.y, s.r * s.z * 4, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// 流星
		if (meteors && !reduced) {
			meteorTimer -= dt * 1000;
			if (meteorTimer <= 0 && mts.length < 2) {
				spawnMeteor();
				meteorTimer = 18000 + Math.random() * 22000;
			}
			for (let i = mts.length - 1; i >= 0; i--) {
				const m = mts[i];
				m.life += dt;
				m.x += m.vx * dt;
				m.y += m.vy * dt;
				const k = 1 - m.life / m.max;
				if (k <= 0 || m.x < -100 || m.y > h + 100) {
					mts.splice(i, 1);
					continue;
				}
				const tailLen = 140;
				const grad = ctx.createLinearGradient(
					m.x,
					m.y,
					m.x + tailLen,
					m.y - tailLen * 0.7,
				);
				grad.addColorStop(0, `hsla(190, 100%, 85%, ${k})`);
				grad.addColorStop(0.5, `hsla(210, 100%, 75%, ${k * 0.4})`);
				grad.addColorStop(1, "hsla(220, 100%, 70%, 0)");
				ctx.strokeStyle = grad;
				ctx.lineWidth = 1.6;
				ctx.beginPath();
				ctx.moveTo(m.x, m.y);
				ctx.lineTo(m.x + tailLen, m.y - tailLen * 0.7);
				ctx.stroke();
				ctx.fillStyle = `hsla(190, 100%, 95%, ${k})`;
				ctx.beginPath();
				ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		raf = requestAnimationFrame(tick);
	};

	observer = new IntersectionObserver(
		(entries) => {
			visible = entries[0]?.isIntersecting ?? true;
		},
		{ threshold: 0 },
	);
	observer.observe(canvas);
	raf = requestAnimationFrame(tick);

	return () => {
		cancelAnimationFrame(raf);
		window.removeEventListener("resize", resize);
		window.removeEventListener("pointermove", handleMouse);
		observer?.disconnect();
	};
});

onDestroy(() => {
	cancelAnimationFrame(raf);
	observer?.disconnect();
});
</script>

<canvas
	bind:this={canvas}
	class="absolute inset-0 w-full h-full pointer-events-none"
	aria-hidden="true"
></canvas>
