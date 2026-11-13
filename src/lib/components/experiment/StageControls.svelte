<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { STAGE_LIMIT, patternOffsetFromStage } from '#lib/simulation/exposure.js';
	import { readFocus } from '#lib/simulation/focus.js';

	const offset = $derived(patternOffsetFromStage(simulator.state.stage));
	const focus = $derived(readFocus(simulator.state.stage.z));

	function onAxisInput(axis: 'x' | 'y' | 'z', event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		simulator.setAxis(axis, Number(target.value));
	}
</script>

<section class="panel-section" aria-labelledby="stage-heading">
	<div class="section-heading">
		<h2 id="stage-heading">2. Stage alignment</h2>
		<span class="section-note">Virtual units, not mm</span>
	</div>

	<div class="axis-control">
		<div class="axis-label">
			<label for="stage-x">X position</label>
			<output for="stage-x">{simulator.state.stage.x}</output>
		</div>
		<input
			id="stage-x"
			type="range"
			min={-STAGE_LIMIT}
			max={STAGE_LIMIT}
			step="1"
			value={simulator.state.stage.x}
			oninput={(event) => onAxisInput('x', event)}
		/>
	</div>

	<div class="axis-control">
		<div class="axis-label">
			<label for="stage-y">Y position</label>
			<output for="stage-y">{simulator.state.stage.y}</output>
		</div>
		<input
			id="stage-y"
			type="range"
			min={-STAGE_LIMIT}
			max={STAGE_LIMIT}
			step="1"
			value={simulator.state.stage.y}
			oninput={(event) => onAxisInput('y', event)}
		/>
	</div>

	<div class="nudge-pad" aria-label="Stage nudge controls">
		<button type="button" class="nudge-up" onclick={() => simulator.nudgeStage(0, 5)}>Y +5</button>
		<button type="button" class="nudge-left" onclick={() => simulator.nudgeStage(-5, 0)}>
			X −5
		</button>
		<button
			type="button"
			class="nudge-center center-button"
			onclick={() => simulator.centerStage()}
		>
			Centre
		</button>
		<button type="button" class="nudge-right" onclick={() => simulator.nudgeStage(5, 0)}>
			X +5
		</button>
		<button type="button" class="nudge-down" onclick={() => simulator.nudgeStage(0, -5)}>
			Y −5
		</button>
	</div>

	<dl class="readout-grid">
		<div>
			<dt>Live projection offset</dt>
			<dd>{offset.x >= 0 ? '+' : ''}{offset.x} / {offset.y >= 0 ? '+' : ''}{offset.y} cells</dd>
		</div>
		<div>
			<dt>Focus (illustrative)</dt>
			<dd class="focus-{focus.status}">{focus.label}</dd>
		</div>
	</dl>

	<details class="advanced-details">
		<summary>Advanced: focus height (illustrative)</summary>
		<div class="axis-control">
			<div class="axis-label">
				<label for="stage-z">Z focus height</label>
				<output for="stage-z">{simulator.state.stage.z}</output>
			</div>
			<input
				id="stage-z"
				type="range"
				min={-STAGE_LIMIT}
				max={STAGE_LIMIT}
				step="1"
				value={simulator.state.stage.z}
				aria-describedby="focus-note"
				oninput={(event) => onAxisInput('z', event)}
			/>
		</div>
		<p id="focus-note" class="inline-note">
			Qualitative teaching visual, not an optical model. It affects the live projection only and
			does not change the recorded binary exposure.
		</p>
	</details>
</section>
