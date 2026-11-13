<script lang="ts">
	import { T } from '@threlte/core';
	import { simulator } from '#lib/simulation/state.svelte.js';
	import PartLabel from './PartLabel.svelte';
	import Wafer from './Wafer.svelte';

	const WORLD_PER_UNIT = 0.018;
	const stageSelected = $derived(simulator.state.selectedComponent === 'stage');
	const holderSelected = $derived(simulator.state.selectedComponent === 'sample-holder');

	const stagePosition = $derived<[number, number, number]>([
		simulator.state.stage.x * WORLD_PER_UNIT,
		0.49 + simulator.state.stage.z * 0.004,
		-simulator.state.stage.y * WORLD_PER_UNIT
	]);

	function selectStage() {
		simulator.chooseComponent('stage');
	}

	function selectHolder() {
		simulator.chooseComponent('sample-holder');
	}

	function hover(active: boolean) {
		document.body.style.cursor = active ? 'pointer' : '';
	}
</script>

<T.Group>
	<T.Mesh position={[0, 0.32, 0]}>
		<T.BoxGeometry args={[4.9, 0.22, 4.9]} />
		<T.MeshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.55} />
	</T.Mesh>

	<T.Mesh position={[0, 0.45, 0]}>
		<T.BoxGeometry args={[4.1, 0.06, 4.1]} />
		<T.MeshStandardMaterial color="#334155" metalness={0.7} roughness={0.35} />
	</T.Mesh>

	<T.Group position={stagePosition}>
		<T.Mesh
			onclick={selectStage}
			onpointerenter={() => hover(true)}
			onpointerleave={() => hover(false)}
		>
			<T.BoxGeometry args={[3.45, 0.26, 3.45]} />
			<T.MeshStandardMaterial
				color={stageSelected ? '#b45309' : '#5b6b82'}
				metalness={0.75}
				roughness={0.3}
				emissive={stageSelected ? '#7c2d12' : '#000000'}
				emissiveIntensity={stageSelected ? 0.8 : 0}
			/>
		</T.Mesh>

		<T.Mesh
			position={[0, 0.2, 0]}
			onclick={selectHolder}
			onpointerenter={() => hover(true)}
			onpointerleave={() => hover(false)}
		>
			<T.CylinderGeometry args={[1.5, 1.62, 0.2, 64]} />
			<T.MeshStandardMaterial
				color={holderSelected ? '#b45309' : '#64748b'}
				metalness={0.7}
				roughness={0.35}
				emissive={holderSelected ? '#7c2d12' : '#000000'}
				emissiveIntensity={holderSelected ? 0.8 : 0}
			/>
		</T.Mesh>

		<T.Mesh position={[0, 0.16, 0]}>
			<T.CylinderGeometry args={[1.34, 1.42, 0.08, 64]} />
			<T.MeshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
		</T.Mesh>

		<Wafer radius={1.2} />

		<PartLabel id="stage" label="XYZ stage" position={[0, 0.1, 2.05]} />
		<PartLabel id="sample-holder" label="Sample holder" position={[1.85, 0.24, -0.2]} />
		<PartLabel id="wafer" label="Wafer and resist" position={[-1.25, 0.72, 1.25]} />
	</T.Group>
</T.Group>
