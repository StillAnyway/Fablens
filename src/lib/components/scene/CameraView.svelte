<script lang="ts">
	import { T } from '@threlte/core';
	import { simulator } from '#lib/simulation/state.svelte.js';
	import PartLabel from './PartLabel.svelte';

	const selected = $derived(simulator.state.selectedComponent === 'camera');

	function select() {
		simulator.chooseComponent('camera');
	}

	function hover(active: boolean) {
		document.body.style.cursor = active ? 'pointer' : '';
	}
</script>

<T.Group position={[2.85, 4.55, 2.15]} rotation={[0.15, -0.62, 0]}>
	<T.Mesh onclick={select} onpointerenter={() => hover(true)} onpointerleave={() => hover(false)}>
		<T.BoxGeometry args={[0.72, 0.62, 0.9]} />
		<T.MeshStandardMaterial
			color={selected ? '#f59e0b' : '#52657f'}
			metalness={0.6}
			roughness={0.35}
		/>
	</T.Mesh>

	<T.Mesh position={[0, -0.46, 0.12]} rotation={[0.52, 0, 0]} onclick={select}>
		<T.CylinderGeometry args={[0.2, 0.24, 0.42, 24]} />
		<T.MeshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.22} />
	</T.Mesh>

	<T.Mesh position={[0, -0.67, 0.22]} rotation={[0.52, 0, 0]}>
		<T.CylinderGeometry args={[0.155, 0.155, 0.04, 24]} />
		<T.MeshBasicMaterial color="#38bdf8" />
	</T.Mesh>

	<PartLabel id="camera" label="Imaging camera" position={[0.55, 0.55, 0.35]} />
</T.Group>
