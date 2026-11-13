<script lang="ts">
	import { T } from '@threlte/core';
	import { simulator } from '#lib/simulation/state.svelte.js';
	import PartLabel from './PartLabel.svelte';

	const selected = $derived(simulator.state.selectedComponent === 'optics');
	const beamOpacity = $derived(
		simulator.state.phase === 'aligned' || simulator.state.phase === 'exposed' ? 0.2 : 0.09
	);

	function select() {
		simulator.chooseComponent('optics');
	}

	function hover(active: boolean) {
		document.body.style.cursor = active ? 'pointer' : '';
	}
</script>

<T.Group>
	<T.Mesh
		position={[0, 4.55, 0]}
		onclick={select}
		onpointerenter={() => hover(true)}
		onpointerleave={() => hover(false)}
	>
		<T.CylinderGeometry args={[0.52, 0.52, 1.15, 32]} />
		<T.MeshStandardMaterial
			color={selected ? '#f59e0b' : '#64748b'}
			metalness={0.82}
			roughness={0.28}
		/>
	</T.Mesh>

	<T.Mesh position={[0, 3.82, 0]} onclick={select}>
		<T.CylinderGeometry args={[1.08, 0.64, 0.55, 40]} />
		<T.MeshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
	</T.Mesh>

	<T.Mesh position={[0, 3.51, 0]} onclick={select}>
		<T.CylinderGeometry args={[1.06, 1.06, 0.11, 40]} />
		<T.MeshStandardMaterial
			color={selected ? '#fbbf24' : '#64748b'}
			emissive={selected ? '#f59e0b' : '#000000'}
			emissiveIntensity={0.7}
			metalness={0.65}
			roughness={0.3}
		/>
	</T.Mesh>

	<T.Mesh position={[0, 2.2, 0]} renderOrder={2}>
		<T.ConeGeometry args={[2.15, 4.1, 40, 1, true]} />
		<T.MeshBasicMaterial
			color="#fbbf24"
			transparent
			opacity={beamOpacity}
			depthWrite={false}
			side={2}
		/>
	</T.Mesh>

	<PartLabel id="optics" label="Optics and objective" position={[1.75, 3.75, 0.7]} />
</T.Group>
