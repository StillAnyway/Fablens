<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { COMPONENT_ORDER, MACHINE_COMPONENTS } from '#lib/constants/machine.js';

	const selected = $derived(
		simulator.state.selectedComponent ? MACHINE_COMPONENTS[simulator.state.selectedComponent] : null
	);
</script>

<section class="panel-section" aria-labelledby="parts-heading">
	<div class="section-heading">
		<h2 id="parts-heading">Explore the machine</h2>
		<span class="section-note">Click a part or label</span>
	</div>

	<div class="part-chips" role="group" aria-label="Machine components">
		{#each COMPONENT_ORDER as id (id)}
			{@const part = MACHINE_COMPONENTS[id]}
			<button
				type="button"
				class="part-chip"
				class:selected={simulator.state.selectedComponent === id}
				aria-pressed={simulator.state.selectedComponent === id}
				onclick={() => simulator.chooseComponent(id)}
			>
				{part.name}
			</button>
		{/each}
	</div>

	{#if selected}
		<article class="component-card">
			<div class="component-card-head">
				<div>
					<span class="component-category">{selected.category}</span>
					<h3>{selected.name}</h3>
				</div>
				<span class="grounding grounding-{selected.grounding}">{selected.grounding}</span>
			</div>
			<p class="component-summary">{selected.summary}</p>
			<p class="component-detail">{selected.detail}</p>
			<button type="button" class="text-button" onclick={() => simulator.chooseComponent(null)}>
				Clear selection
			</button>
		</article>
	{:else}
		<p class="component-empty">
			Select the projector, optics, stage, holder, wafer or controller to see what it does. Geometry
			is stylised unless marked documented.
		</p>
	{/if}

	<p class="source-note">
		Stage protocol reference: <a
			href="https://github.com/hackerfabiitb/litho-ui"
			target="_blank"
			rel="noreferrer">hackerfabiitb/litho-ui</a
		>. Machine geometry here is illustrative.
	</p>
</section>
