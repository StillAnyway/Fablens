<script lang="ts">
	import { simulator } from '#lib/simulation/state.svelte.js';

	let input = $state('P');
	let logEl: HTMLDivElement | undefined = $state();

	const position = $derived(simulator.protocolPosition);
	const examples = ['P', 'L', 'A 6000 5000 5000', 'R 100 -50 0', 'J X 50'];

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!input.trim()) return;
		simulator.runControllerCommand(input);
		input = '';
	}

	$effect(() => {
		if (logEl && simulator.controllerLog.length > 0) {
			logEl.scrollTop = logEl.scrollHeight;
		}
	});
</script>

<section class="panel-section developer-panel" aria-labelledby="developer-heading">
	<div class="section-heading">
		<h2 id="developer-heading">Developer mode</h2>
		<span class="section-note">Emulated only</span>
	</div>

	<details>
		<summary>Open virtual serial console</summary>

		<p class="inline-note">
			A source-informed subset of the documented IITB stage protocol. It drives the same stage state
			as the 3D machine, but no serial port or hardware is ever used.
		</p>

		<div class="protocol-readout">
			<span>Protocol position</span>
			<code>X {position.x} · Y {position.y} · Z {position.z} steps</code>
		</div>

		<div class="log" bind:this={logEl} aria-live="polite" aria-label="Emulated serial log">
			{#each simulator.controllerLog as entry, index (index)}
				<div class="log-line log-{entry.kind}">{entry.text}</div>
			{/each}
		</div>

		<form onsubmit={submit}>
			<label class="sr-only" for="developer-command">Stage command</label>
			<input
				id="developer-command"
				bind:value={input}
				placeholder="A 1000 500 0"
				autocomplete="off"
				spellcheck="false"
				aria-describedby="developer-hint"
			/>
			<button type="submit" class="primary-button small">Send</button>
		</form>

		<p id="developer-hint" class="inline-note">
			Supported: <code>P</code>, <code>A x y z</code>, <code>R dx dy dz</code>,
			<code>J axis delta</code>, <code>L</code>. Coordinates are motor steps in the emulator's
			illustrative 0–10000 range, not millimetres.
		</p>

		<div class="example-row">
			{#each examples as example (example)}
				<button type="button" class="command-chip" onclick={() => (input = example)}>
					{example}
				</button>
			{/each}
			<button type="button" class="text-button" onclick={() => simulator.clearControllerLog()}>
				Clear log
			</button>
		</div>
	</details>
</section>
