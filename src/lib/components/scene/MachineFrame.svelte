<script lang="ts">
	import { T } from '@threlte/core';
	import { simulator } from '#lib/simulation/state.svelte.js';
	import PartLabel from './PartLabel.svelte';

	const controllerSelected = $derived(simulator.state.selectedComponent === 'controller');

	function selectController() {
		simulator.chooseComponent('controller');
	}

	function hover(active: boolean) {
		document.body.style.cursor = active ? 'pointer' : '';
	}
</script>

<T.Group>
	<T.Mesh position={[0, 0.07, 0]}>
		<T.BoxGeometry args={[9, 0.14, 9]} />
		<T.MeshStandardMaterial color="#0b1220" metalness={0.55} roughness={0.62} />
	</T.Mesh>

	{#each [[-3.85, -3.85], [3.85, -3.85], [-3.85, 3.85], [3.85, 3.85]] as [x, z] (x + ':' + z)}
		<T.Mesh position={[x, 3.35, z]}>
			<T.BoxGeometry args={[0.16, 6.5, 0.16]} />
			<T.MeshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
		</T.Mesh>
	{/each}

	<T.Mesh position={[0, 6.58, -3.85]}>
		<T.BoxGeometry args={[7.86, 0.16, 0.16]} />
		<T.MeshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
	</T.Mesh>

	<T.Group position={[3.55, 0.45, 3.35]}>
		<T.Mesh
			onclick={selectController}
			onpointerenter={() => hover(true)}
			onpointerleave={() => hover(false)}
		>
			<T.BoxGeometry args={[1.2, 0.6, 0.78]} />
			<T.MeshStandardMaterial
				color={controllerSelected ? '#b45309' : '#1f2937'}
				metalness={0.55}
				roughness={0.42}
				emissive={controllerSelected ? '#7c2d12' : '#000000'}
				emissiveIntensity={controllerSelected ? 0.8 : 0}
			/>
		</T.Mesh>

		<T.Mesh position={[0, 0.12, 0.4]}>
			<T.PlaneGeometry args={[0.54, 0.2]} />
			<T.MeshBasicMaterial color="#0f172a" />
		</T.Mesh>

		<T.Mesh position={[-0.34, 0.115, 0.41]}>
			<T.CircleGeometry args={[0.045, 16]} />
			<T.MeshBasicMaterial color="#22c55e" />
		</T.Mesh>

		<T.Mesh position={[-0.18, 0.115, 0.41]}>
			<T.CircleGeometry args={[0.045, 16]} />
			<T.MeshBasicMaterial color="#f59e0b" />
		</T.Mesh>

		<PartLabel id="controller" label="Stage controller" position={[0.1, 0.55, 0.1]} />
	</T.Group>
</T.Group>
