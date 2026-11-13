<script lang="ts">
	import { T } from '@threlte/core';
	import { onMount } from 'svelte';
	import { CanvasTexture, SRGBColorSpace } from 'three';
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { readAlignment } from '#lib/simulation/alignment.js';
	import { viewState } from '#lib/ui.svelte.js';
	import { drawWafer } from '#lib/utils/waferCanvas.js';

	let { radius = 1.2 }: { radius?: number } = $props();

	const TEXTURE_SIZE = 512;
	const selected = $derived(simulator.state.selectedComponent === 'wafer');
	let texture = $state<CanvasTexture | null>(null);

	onMount(() => {
		const canvas = document.createElement('canvas');
		canvas.width = TEXTURE_SIZE;
		canvas.height = TEXTURE_SIZE;
		const created = new CanvasTexture(canvas);
		created.colorSpace = SRGBColorSpace;
		created.anisotropy = 4;
		texture = created;

		return () => {
			created.dispose();
			texture = null;
		};
	});

	$effect(() => {
		if (!texture) return;
		const ctx = texture.image.getContext('2d');
		if (!ctx) return;
		const alignment = readAlignment(simulator.state);
		const layers = simulator.state.layers;
		drawWafer(ctx, TEXTURE_SIZE, simulator.state, {
			showGrid: false,
			showReference: viewState.showReferenceLayer,
			previousMasks: layers.map((layer) => layer.exposureMask),
			referenceMask: layers.at(-1)?.exposureMask ?? null,
			referenceOffset: alignment.referenceOffset
		});
		texture.needsUpdate = true;
	});

	function select() {
		simulator.chooseComponent('wafer');
	}

	function hover(active: boolean) {
		document.body.style.cursor = active ? 'pointer' : '';
	}
</script>

<T.Group>
	<T.Mesh
		position={[0, 0.05, 0]}
		onclick={select}
		onpointerenter={() => hover(true)}
		onpointerleave={() => hover(false)}
	>
		<T.CylinderGeometry args={[radius, radius, 0.09, 64]} />
		<T.MeshStandardMaterial
			color="#334155"
			metalness={0.5}
			roughness={0.4}
			emissive={selected ? '#92400e' : '#000000'}
			emissiveIntensity={selected ? 0.8 : 0}
		/>
	</T.Mesh>

	{#if texture}
		<T.Mesh
			position={[0, 0.101, 0]}
			rotation={[-Math.PI / 2, 0, 0]}
			onclick={select}
			onpointerenter={() => hover(true)}
			onpointerleave={() => hover(false)}
		>
			<T.CircleGeometry args={[radius * 0.985, 64]} />
			<T.MeshStandardMaterial map={texture} roughness={0.45} metalness={0.08} />
		</T.Mesh>
	{/if}

	<T.Mesh position={[0, 0.108, 0]} rotation={[-Math.PI / 2, 0, 0]}>
		<T.RingGeometry args={[radius * 0.97, radius * 1.01, 64]} />
		<T.MeshBasicMaterial
			color="#fbbf24"
			transparent
			opacity={selected ? 0.95 : 0.3}
			depthWrite={false}
		/>
	</T.Mesh>
</T.Group>
