<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { PHASE_META } from '#lib/constants/experiment.js';
	import { PATTERN_LABELS, PATTERN_ROLES } from '#lib/simulation/patterns.js';

	const COLORS = ['#14b8a6', '#22c55e', '#60a5fa', '#c084fc'];
	const layers = $derived(simulator.state.layers);
	const meta = $derived(PHASE_META[simulator.state.phase]);
</script>

<section class="panel-section layer-stack-panel" aria-labelledby="layers-heading">
	<div class="section-heading">
		<h2 id="layers-heading">Layer stack</h2>
		<span class="section-note">{layers.length} completed</span>
	</div>

	<ol class="layer-list">
		{#each layers as layer, index (layer.number)}
			<li class="layer-item">
				<span class="layer-swatch" style={`--layer-color:${COLORS[index % COLORS.length]}`}></span>
				<span class="layer-number">{layer.number}</span>
				<span class="layer-copy">
					<strong>{PATTERN_LABELS[layer.patternId]}</strong>
					<span>{PATTERN_ROLES[layer.patternId]}</span>
				</span>
				<span class="layer-status">done</span>
			</li>
		{/each}

		<li class="layer-item current">
			<span class="layer-swatch current-swatch"></span>
			<span class="layer-number">{simulator.layerNumber}</span>
			<span class="layer-copy">
				<strong>
					{simulator.state.patternId
						? PATTERN_LABELS[simulator.state.patternId]
						: 'No pattern selected'}
				</strong>
				<span>
					{simulator.state.patternId
						? PATTERN_ROLES[simulator.state.patternId]
						: 'Choose a layer type'}
				</span>
			</span>
			<span class="layer-status">{meta.label}</span>
		</li>
	</ol>

	<p class="inline-note">
		Each new layer is aligned to the layer below it. Together they form the connections and devices
		of a simple circuit.
	</p>
</section>
