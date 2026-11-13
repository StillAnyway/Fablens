<script lang="ts">
	import { T } from '@threlte/core';
	import { simulator } from '#lib/simulation/state.svelte.js';
	import PartLabel from './PartLabel.svelte';

	const selected = $derived(simulator.state.selectedComponent === 'projector');

	function select() {
		simulator.chooseComponent('projector');
	}

	function hover(active: boolean) {
		document.body.style.cursor = active ? 'pointer' : '';
	}
</script>

<T.Group position={[0, 5.85, 0]}>
	<T.Mesh onclick={select} onpointerenter={() => hover(true)} onpointerleave={() => hover(false)}>
		<T.BoxGeometry args={[2.7, 1.05, 2.2]} />
		<T.MeshStandardMaterial
			color={selected ? '#f59e0b' : '#4b5f7a'}
			metalness={0.72}
			roughness={0.32}
		/>
	</T.Mesh>

	<T.Mesh position={[0, 0.02, 1.11]}>
		<T.PlaneGeometry args={[1.9, 0.58]} />
		<T.MeshStandardMaterial
			color="#0b1220"
			emissive="#fbbf24"
			emissiveIntensity={selected ? 1.6 : 0.65}
			roughness={0.3}
		/>
	</T.Mesh>

	<T.Mesh position={[0, -0.63, 0]}>
		<T.CylinderGeometry args={[0.5, 0.7, 0.3, 32]} />
		<T.MeshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
	</T.Mesh>

	<T.Mesh position={[0, -0.8, 0]}>
		<T.CylinderGeometry args={[0.33, 0.33, 0.12, 32]} />
		<T.MeshStandardMaterial
			color="#fef3c7"
			emissive="#fbbf24"
			emissiveIntensity={selected ? 2.2 : 1.1}
		/>
	</T.Mesh>

	<PartLabel id="projector" label="Pattern projector" position={[0, 0.15, -1.75]} />
</T.Group>
