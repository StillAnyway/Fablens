<script lang="ts">
	import { useThrelte } from '@threlte/core';
	import { useOrbitControls } from '@threlte/extras';
	import { onMount } from 'svelte';
	import { Vector3 } from 'three';
	import { sceneCommands, type SceneView } from '#lib/ui.svelte.js';

	const { camera } = useThrelte();
	const orbit = useOrbitControls();

	const PRESETS: Record<
		SceneView,
		{ position: [number, number, number]; target: [number, number, number] }
	> = {
		overview: { position: [8.4, 7.1, 9.8], target: [0, 2.6, 0] },
		stage: { position: [6.6, 4.6, 7.4], target: [0, 1.05, 0] },
		optics: { position: [6.4, 5.6, 7.2], target: [0, 3.7, 0] }
	};

	let frame: number | null = null;

	function stopAnimation() {
		if (frame !== null) cancelAnimationFrame(frame);
		frame = null;
	}

	function animateTo(view: SceneView) {
		const controls = orbit.current;
		const activeCamera = camera.current;
		if (!controls || !activeCamera) return;

		const preset = PRESETS[view];
		const startPosition = activeCamera.position.clone();
		const startTarget = controls.target.clone();
		const endPosition = new Vector3(...preset.position);
		const endTarget = new Vector3(...preset.target);
		const startTime = performance.now();

		stopAnimation();

		const tick = (now: number) => {
			const progress = Math.min(1, (now - startTime) / 700);
			const eased = 1 - Math.pow(1 - progress, 3);
			activeCamera.position.lerpVectors(startPosition, endPosition, eased);
			controls.target.lerpVectors(startTarget, endTarget, eased);
			controls.update();

			if (progress < 1) {
				frame = requestAnimationFrame(tick);
			} else {
				frame = null;
			}
		};

		frame = requestAnimationFrame(tick);
	}

	function zoom(direction: -1 | 1) {
		const controls = orbit.current;
		const activeCamera = camera.current;
		if (!controls || !activeCamera) return;

		const offset = activeCamera.position.clone().sub(controls.target);
		const distance = offset.length();
		const factor = direction > 0 ? 0.82 : 1 / 0.82;
		const nextDistance = Math.min(
			controls.maxDistance,
			Math.max(controls.minDistance, distance * factor)
		);

		if (Math.abs(nextDistance - distance) < 0.001) return;

		offset.setLength(nextDistance);
		activeCamera.position.copy(controls.target).add(offset);
		controls.update();
	}

	onMount(() => {
		sceneCommands.zoom = zoom;
		sceneCommands.setView = animateTo;

		return () => {
			sceneCommands.zoom = null;
			sceneCommands.setView = null;
			stopAnimation();
		};
	});
</script>
