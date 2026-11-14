<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';
	import {
		PATTERN_DESCRIPTIONS,
		PATTERN_IDS,
		PATTERN_LABELS,
		PATTERN_ROLES
	} from '#lib/simulation/patterns.js';
	import { viewState } from '#lib/ui.svelte.js';
	import type { PatternId } from '#lib/types/simulation.js';
	import PatternThumb from './PatternThumb.svelte';

	let dialog: HTMLDialogElement | undefined = $state();
	let pendingPattern: PatternId | null = $state(null);

	const selectedLabel = $derived(
		simulator.state.patternId ? PATTERN_LABELS[simulator.state.patternId] : 'No pattern selected'
	);

	$effect(() => {
		if (!dialog) return;
		if (pendingPattern && !dialog.open) dialog.showModal();
		else if (!pendingPattern && dialog.open) dialog.close();
	});

	function confirmPattern() {
		if (!pendingPattern) return;
		simulator.choosePattern(pendingPattern);
		viewState.patternPanelOpen = false;
		pendingPattern = null;

		if (window.matchMedia('(max-width: 760px)').matches) {
			window.setTimeout(() => {
				document.getElementById('wafer-mobile')?.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}, 50);
		}
	}

	function cancelPattern() {
		pendingPattern = null;
	}
</script>

<section class="panel-section" id="pattern-selection" aria-labelledby="pattern-heading">
	<details
		open={viewState.patternPanelOpen}
		ontoggle={(event) => (viewState.patternPanelOpen = event.currentTarget.open)}
	>
		<summary class="pattern-summary">
			<h2 id="pattern-heading">1. Pattern</h2>
			<span class="pattern-summary-value">{selectedLabel}</span>
			<span class="pattern-toggle">
				{viewState.patternPanelOpen ? 'Close' : simulator.state.patternId ? 'Change' : 'Choose'}
			</span>
		</summary>

		<div class="pattern-body">
			<div class="pattern-grid">
				{#each PATTERN_IDS as id (id)}
					<button
						type="button"
						class="pattern-card"
						class:selected={simulator.state.patternId === id}
						aria-pressed={simulator.state.patternId === id}
						onclick={() => (pendingPattern = id)}
					>
						<PatternThumb patternId={id} size={64} />
						<span class="pattern-copy">
							<strong>{PATTERN_LABELS[id]}</strong>
							<span class="pattern-role">{PATTERN_ROLES[id]}</span>
							<span>{PATTERN_DESCRIPTIONS[id]}</span>
						</span>
					</button>
				{/each}
			</div>

			<p class="inline-note">Illustrative examples, not a complete fabrication recipe.</p>
		</div>
	</details>

	<dialog
		bind:this={dialog}
		class="confirm-dialog"
		aria-labelledby="confirm-pattern-title"
		onclose={() => (pendingPattern = null)}
		onclick={(event) => {
			if (event.target === dialog) pendingPattern = null;
		}}
	>
		{#if pendingPattern}
			<div class="dialog-card">
				<h3 id="confirm-pattern-title">Use the {PATTERN_LABELS[pendingPattern]} pattern?</h3>
				<p>{PATTERN_DESCRIPTIONS[pendingPattern]}</p>
				<p class="inline-note">You can change it later before exposing the wafer.</p>
				<div class="dialog-actions">
					<button type="button" class="ghost-button" onclick={cancelPattern}>Cancel</button>
					<button type="button" class="primary-button" onclick={confirmPattern}>
						Use this pattern
					</button>
				</div>
			</div>
		{/if}
	</dialog>
</section>
