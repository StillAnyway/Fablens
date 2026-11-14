<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { PHASE_META, PHASE_ORDER, PROCESS_STEPS } from '#lib/constants/experiment.js';
	import type { Phase } from '#lib/types/simulation.js';
	import { readAlignment } from '#lib/simulation/alignment.js';
	import { viewState } from '#lib/ui.svelte.js';

	const phaseIndex = $derived(PHASE_ORDER.indexOf(simulator.state.phase));
	const meta = $derived(PHASE_META[simulator.state.phase]);
	const alignment = $derived(readAlignment(simulator.state));
	const layerComplete = $derived(phaseIndex >= PROCESS_STEPS.length);
	const hasPattern = $derived(simulator.state.patternId !== null);
	const actionDisabled = $derived(simulator.state.phase === 'prepared' && !hasPattern);
	const actionLabel = $derived(
		simulator.state.phase === 'prepared' && !hasPattern
			? 'Choose a pattern first'
			: simulator.state.phase === 'prepared' && alignment.status !== 'aligned'
				? 'Continue with misalignment'
				: simulator.state.phase === 'aligned' && alignment.status !== 'aligned'
					? 'Expose misaligned wafer'
					: meta.action
	);

	function reset() {
		simulator.reset();
		viewState.patternPanelOpen = true;
	}

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
		{#each PROCESS_STEPS as step, index (step)}
			{@const done = index < phaseIndex}
			{@const current = index === phaseIndex}
			<li class:done class:current aria-current={current ? 'step' : undefined}>
				{#if done}
					<button
						type="button"
						class="phase-step-button"
						aria-label={`Go back to the ${step} step`}
						title={`Go back to ${step}`}
						onclick={() => simulator.goBackToStep(index)}
					>
						<span class="phase-dot">✓</span>
						<span class="phase-name">{step}</span>
					</button>
				{:else}
					<span class="phase-step-button" aria-disabled={!current}>
						<span class="phase-dot">{index + 1}</span>
						<span class="phase-name">{step}</span>
					</span>
				{/if}
			</li>
		{/each}
	</ol>

	<p class="step-hint">
		{#if layerComplete}
			This layer is complete. Add another layer to continue.
		{:else if simulator.state.phase === 'prepared' && !hasPattern}
			Choose a layer type in the Pattern card to continue.
		{:else}
			Completed steps are clickable. Use the yellow button to continue.
		{/if}
	</p>

	<p class="phase-description">{meta.description}</p>

	{#if simulator.state.phase === 'prepared' && !hasPattern}
		<p class="inline-note warning">
			Select a layer type in the Pattern card before confirming alignment.
		</p>
	{/if}

	{#if simulator.state.phase === 'aligned' && alignment.status !== 'aligned'}
		<p class="inline-note warning">
			Deliberate misalignment: exposing now will record an offset pattern. {alignment.message}
		</p>
	{/if}

	<p class="action-label">Next action</p>

	<div class="action-row">
		<button
			type="button"
			class="primary-button"
			disabled={actionDisabled}
			onclick={() => advance(simulator.state.phase)}
		>
			{actionLabel}
		</button>
		<button type="button" class="ghost-button" onclick={reset}>
			{simulator.state.phase === 'developed' || simulator.state.phase === 'transferred'
				? 'Start over'
				: 'Reset'}
		</button>
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
