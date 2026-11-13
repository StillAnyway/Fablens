<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { PHASE_META, PHASE_ORDER } from '#lib/constants/experiment.js';
	import type { Phase } from '#lib/types/simulation.js';
	import { readAlignment } from '#lib/simulation/alignment.js';

	const phaseIndex = $derived(PHASE_ORDER.indexOf(simulator.state.phase));
	const meta = $derived(PHASE_META[simulator.state.phase]);
	const alignment = $derived(readAlignment(simulator.state));
	const actionLabel = $derived(
		simulator.state.phase === 'prepared' && alignment.status !== 'aligned'
			? 'Continue with misalignment'
			: simulator.state.phase === 'aligned' && alignment.status !== 'aligned'
				? 'Expose misaligned wafer'
				: meta.action
	);

	function advance(phase: Phase) {
		if (phase === 'uncoated') simulator.coat();
		else if (phase === 'prepared') simulator.align();
		else if (phase === 'aligned') simulator.expose();
		else if (phase === 'exposed') simulator.develop();
		else if (phase === 'developed') simulator.transferPattern();
		else simulator.addLayer();
	}
</script>

<section class="panel-section steps-panel" aria-labelledby="steps-heading">
	<div class="section-heading">
		<h2 id="steps-heading">Process</h2>
		<div class="process-heading-meta">
			<span class="section-note">Layer {simulator.layerNumber}</span>
			<span class="phase-badge">{meta.label}</span>
		</div>
	</div>

	<ol class="phase-track">
		{#each PHASE_ORDER as phase, index (phase)}
			{@const info = PHASE_META[phase]}
			<li
				class:done={index < phaseIndex}
				class:current={index === phaseIndex}
				aria-current={index === phaseIndex ? 'step' : undefined}
			>
				<span class="phase-dot">{index < phaseIndex ? '✓' : index + 1}</span>
				<span class="phase-name">{info.stepLabel}</span>
			</li>
		{/each}
	</ol>

	<p class="phase-description">{meta.description}</p>

	{#if simulator.state.phase === 'aligned' && alignment.status !== 'aligned'}
		<p class="inline-note warning">
			Deliberate misalignment: exposing now will record an offset pattern. {alignment.message}
		</p>
	{/if}

	<div class="action-row">
		<button type="button" class="primary-button" onclick={() => advance(simulator.state.phase)}>
			{actionLabel}
		</button>
		{#if simulator.state.phase === 'aligned'}
			<button type="button" class="ghost-button" onclick={() => simulator.adjustAlignment()}>
				Adjust alignment
			</button>
		{:else}
			<button type="button" class="ghost-button" onclick={() => simulator.reset()}>
				{simulator.state.phase === 'developed' || simulator.state.phase === 'transferred'
					? 'Start over'
					: 'Reset'}
			</button>
		{/if}
	</div>

	<div class="notice notice-{simulator.noticeKind}" role="status" aria-live="polite">
		{simulator.notice}
	</div>

	<details class="process-details">
		<summary>Model notes</summary>
		<p>
			Coating is a conceptual teaching step; real spin speed, bake time and thickness are not
			modelled. Positive resist: light makes exposed regions more soluble, then development removes
			them. This is a qualitative teaching model, not a calibrated process.
		</p>
	</details>
</section>
