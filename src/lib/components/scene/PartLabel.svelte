<script lang="ts">
	import { HTML } from '@threlte/extras';
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { viewState } from '#lib/ui.svelte.js';
	import type { ComponentId } from '#lib/types/simulation.js';

	let {
		id,
		label,
		position = [0, 0, 0]
	}: {
		id: ComponentId;
		label: string;
		position?: [number, number, number];
	} = $props();

	const selected = $derived(simulator.state.selectedComponent === id);

	function isolatePointer(node: HTMLElement) {
		const stop = (event: Event) => event.stopPropagation();
		node.addEventListener('pointerdown', stop);
		node.addEventListener('pointerup', stop);
		return {
			destroy() {
				node.removeEventListener('pointerdown', stop);
				node.removeEventListener('pointerup', stop);
			}
		};
	}
</script>

{#if viewState.showSceneLabels}
	<HTML {position} center>
		<button
			type="button"
			class="part-label"
			class:is-selected={selected}
			use:isolatePointer
			onclick={() => simulator.chooseComponent(id)}
		>
			{label}
		</button>
	</HTML>
{/if}
