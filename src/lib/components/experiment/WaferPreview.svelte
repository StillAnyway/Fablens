<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { PHASE_META } from '#lib/constants/experiment.js';
	import { patternOffsetFromStage } from '#lib/simulation/exposure.js';
	import { PATTERN_LABELS } from '#lib/simulation/patterns.js';
	import { readAlignment } from '#lib/simulation/alignment.js';
	import { readFocus } from '#lib/simulation/focus.js';
	import { viewState } from '#lib/ui.svelte.js';
	import { drawWafer } from '#lib/utils/waferCanvas.js';

	const SIZE = 560;
	let canvas: HTMLCanvasElement | undefined = $state();

	const offset = $derived(patternOffsetFromStage(simulator.state.stage));
	const meta = $derived(PHASE_META[simulator.state.phase]);
	const alignment = $derived(readAlignment(simulator.state));
	const focus = $derived(readFocus(simulator.state.stage.z));
	const uncoated = $derived(simulator.state.phase === 'uncoated');
	const transferred = $derived(simulator.state.phase === 'transferred');
	const layerNumber = $derived(simulator.state.layers.length + 1);
	const previousLayers = $derived(simulator.state.layers);
	const referenceLayer = $derived(simulator.state.layers.at(-1) ?? null);
	const hasPreviousLayers = $derived(previousLayers.length > 0);
	const hasPattern = $derived(simulator.state.patternId !== null);
	const referenceName = $derived(
		alignment.referenceNumber ? `layer ${alignment.referenceNumber}` : 'centre'
	);
	const alignmentSummary = $derived(
		alignment.status === 'aligned'
			? `Aligned to ${referenceName}`
			: alignment.status === 'close'
				? `1 cell off ${referenceName}`
				: `Offset from ${referenceName}`
	);

	const summary = $derived(
		uncoated
			? hasPreviousLayers
				? 'The previous layers remain on the wafer. A new photoresist coat is needed for the next layer.'
				: 'Bare wafer surface. No photoresist has been applied yet, so there is nothing to expose.'
			: !hasPattern
				? 'Choose a layer type to see the projected pattern.'
				: simulator.state.phase === 'prepared' || simulator.state.phase === 'aligned'
					? hasPreviousLayers
						? `Layer ${layerNumber}: amber is the live projection. Cyan is the previous layer to align against.`
						: 'Amber marks the live projected exposure pattern. Cyan is the centred reference to align against.'
					: simulator.state.phase === 'exposed'
						? 'Amber marks illuminated resist. In positive resist, these regions are now more soluble.'
						: transferred
							? 'Conceptual transfer complete: this pattern is treated as a permanent layer. Real etch, deposition and resist strip are not simulated.'
							: 'Dark regions show where development removed the exposed resist. Earlier layers remain visible underneath.'
	);

	$effect(() => {
		if (!canvas) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const pixelSize = Math.round(SIZE * dpr);
		if (canvas.width !== pixelSize) {
			canvas.width = pixelSize;
			canvas.height = pixelSize;
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		drawWafer(ctx, SIZE, simulator.state, {
			showReference: viewState.showReferenceLayer,
			showReferenceFrame: true,
			showGrid: true,
			previousMasks: previousLayers.map((layer) => layer.exposureMask),
			referenceMask: referenceLayer?.exposureMask ?? null,
			referenceOffset: alignment.referenceOffset
		});
	});
</script>

<section class="panel-section" aria-labelledby="wafer-heading">
	<div class="section-heading">
		<h2 id="wafer-heading">Wafer view</h2>
		<span class="section-note">Layer {layerNumber} · {meta.label}</span>
	</div>

	<div
		class="wafer-canvas-wrap"
		role="img"
		aria-label={`Top-down wafer view for layer ${layerNumber} during the ${meta.label.toLowerCase()} phase. Projection offset ${offset.x} by ${offset.y} cells. Alignment ${alignment.label.toLowerCase()}. ${summary}`}
	>
		<canvas bind:this={canvas} class="wafer-canvas" aria-hidden="true"></canvas>
	</div>

	<p class="wafer-summary">{summary}</p>

	{#if uncoated}
		<div class="alignment-card alignment-neutral alignment-inline">
			<strong>No resist layer yet</strong>
			<span>
				{#if hasPreviousLayers}
					Coat before aligning to layer {referenceLayer?.number}.
				{:else}
					Coat before aligning.
				{/if}
			</span>
		</div>
	{:else if !hasPattern}
		<div class="alignment-card alignment-neutral alignment-inline">
			<strong>No pattern selected</strong>
			<span>Choose a layer type to preview the projection.</span>
		</div>
	{:else}
		<details class="alignment-card alignment-{alignment.status}">
			<summary class="alignment-summary">
				<span class="alignment-badge">{alignment.label}</span>
				<span class="alignment-summary-text">{alignmentSummary}</span>
			</summary>

			<div class="alignment-details">
				<span class="alignment-source">
					{alignment.recorded ? 'recorded exposure' : 'live projection'}
				</span>
				<p>{alignment.message}</p>
				{#if referenceLayer}
					<p class="alignment-hint">
						Reference: layer {referenceLayer.number} · {PATTERN_LABELS[referenceLayer.patternId]}
					</p>
				{/if}
				{#if !alignment.recorded}
					{#if simulator.state.phase === 'aligned'}
						{#if alignment.status !== 'aligned'}
							<p class="alignment-hint alignment-hint-warning">
								Deliberate misalignment: exposing now will record an offset pattern. Click the
								completed Align step to change it.
							</p>
						{:else}
							<p class="alignment-hint">
								Alignment is locked. Click the completed Align step to change it.
							</p>
						{/if}
					{:else}
						<p class="alignment-hint">
							Use the X/Y stage controls to line up the new layer with the cyan reference marks.
						</p>
					{/if}
				{/if}
			</div>
		</details>
	{/if}

	<label class="toggle-row">
		<input type="checkbox" bind:checked={viewState.showReferenceLayer} />
		<span>Show reference layer</span>
	</label>

	<details class="wafer-legend">
		<summary>Legend</summary>
		<ul class="legend" aria-label="Wafer view legend">
			{#if uncoated}
				<li><span class="swatch swatch-substrate"></span>Wafer substrate</li>
			{:else if transferred}
				<li><span class="swatch swatch-transferred"></span>Transferred material</li>
			{:else}
				<li><span class="swatch swatch-resist"></span>Unexposed resist</li>
				<li><span class="swatch swatch-exposed"></span>Exposed / soluble</li>
				<li><span class="swatch swatch-removed"></span>Removed by development</li>
			{/if}
			{#if hasPreviousLayers}
				<li><span class="swatch swatch-layer"></span>Previous layers</li>
			{/if}
			<li><span class="swatch swatch-reference"></span>Alignment reference</li>
		</ul>
	</details>

	<p class="inline-note">
		Offset: {offset.x >= 0 ? '+' : ''}{offset.x} / {offset.y >= 0 ? '+' : ''}{offset.y} cells. Moving
		the stage shifts the projected pattern relative to the wafer.
	</p>

	{#if !uncoated && focus.status !== 'focused' && (simulator.state.phase === 'prepared' || simulator.state.phase === 'aligned')}
		<p class="inline-note focus-note">
			Illustrative defocus: the amber projection is blurred because Z is away from the nominal focus
			height. This display effect is not a calibrated optical model.
		</p>
	{/if}
</section>
