<script lang="ts">
	import type { PatternId } from '#lib/types/simulation.js';
	import { PATTERN_SIZE, generatePattern } from '#lib/simulation/patterns.js';

	let { patternId, size = 82 }: { patternId: PatternId; size?: number } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();

	$effect(() => {
		if (!canvas) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(size * dpr);
		canvas.height = Math.round(size * dpr);

		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, size, size);

		const mask = generatePattern(patternId);
		const cell = size / PATTERN_SIZE;
		ctx.fillStyle = '#fbbf24';
		for (let row = 0; row < PATTERN_SIZE; row += 1) {
			for (let col = 0; col < PATTERN_SIZE; col += 1) {
				if (!mask[row * PATTERN_SIZE + col]) continue;
				ctx.fillRect(col * cell, row * cell, cell + 0.4, cell + 0.4);
			}
		}
	});
</script>

<canvas bind:this={canvas} style={`width:${size}px;height:${size}px`} aria-hidden="true"></canvas>

<style>
	canvas {
		display: block;
		border-radius: 6px;
		background: rgba(2, 6, 23, 0.55);
	}
</style>
