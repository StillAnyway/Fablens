<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';
	import {
		PATTERN_DESCRIPTIONS,
		PATTERN_IDS,
		PATTERN_LABELS,
		PATTERN_ROLES
	} from '#lib/simulation/patterns.js';
	import PatternThumb from './PatternThumb.svelte';
</script>

<section class="panel-section" aria-labelledby="pattern-heading">
	<div class="section-heading">
		<h2 id="pattern-heading">1. Pattern</h2>
		<span class="section-note">Layer type</span>
	</div>

	<div class="pattern-grid">
		{#each PATTERN_IDS as id (id)}
			<button
				type="button"
				class="pattern-card"
				class:selected={simulator.state.patternId === id}
				aria-pressed={simulator.state.patternId === id}
				onclick={() => simulator.choosePattern(id)}
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

	<p class="inline-note">Simplified layer types, not production layouts.</p>
</section>
