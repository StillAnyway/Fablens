<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { Grid, OrbitControls } from '@threlte/extras';
	import { viewState, requestSceneView, requestZoom, type SceneView } from '#lib/ui.svelte.js';
	import SceneAtmosphere from './SceneAtmosphere.svelte';
	import CameraDirector from './CameraDirector.svelte';
	import MachineFrame from './MachineFrame.svelte';
	import Projector from './Projector.svelte';
	import OpticalAssembly from './OpticalAssembly.svelte';
	import CameraView from './CameraView.svelte';
	import XYZStage from './XYZStage.svelte';

	const SCENE_VIEWS: SceneView[] = ['overview', 'stage', 'optics'];
</script>

<div class="scene-shell">
	<Canvas dpr={[1, 2]} shadows>
		<T.PerspectiveCamera makeDefault position={[8.4, 7.1, 9.8]} fov={40} near={0.1} far={80} />
		<OrbitControls
			target={[0, 2.6, 0]}
			enableDamping
			enableZoom={false}
			dampingFactor={0.08}
			minDistance={7}
			maxDistance={24}
			minPolarAngle={0.15}
			maxPolarAngle={Math.PI * 0.49}
		/>

		<SceneAtmosphere />
		<CameraDirector />

		<T.AmbientLight intensity={0.95} />
		<T.HemisphereLight args={['#dbe6ff', '#1e293b', 1.7]} />
		<T.DirectionalLight position={[7, 12, 8]} intensity={2.5} />
		<T.DirectionalLight position={[-6, 7, -5]} intensity={1.1} color="#93c5fd" />
		<T.PointLight position={[0, 5.1, 0]} color="#fbbf24" intensity={24} distance={9} decay={2} />

		<Grid
			position={[0, 0.005, 0]}
			gridSize={18}
			cellSize={0.5}
			sectionSize={2}
			cellColor="#172033"
			sectionColor="#28344a"
			fadeDistance={28}
			fadeStrength={1.4}
		/>

		<MachineFrame />
		<Projector />
		<OpticalAssembly />
		<CameraView />
		<XYZStage />
	</Canvas>

	<div class="scene-label-toggle">
		<button
			type="button"
			class:active={viewState.showSceneLabels}
			aria-pressed={viewState.showSceneLabels}
			aria-label="Toggle part labels and machine details"
			title="Show or hide part labels and machine details"
			onclick={() => (viewState.showSceneLabels = !viewState.showSceneLabels)}
		>
			?
		</button>
	</div>

	<div class="scene-views" role="group" aria-label="Camera views">
		{#each SCENE_VIEWS as view (view)}
			<button
				type="button"
				class:active={viewState.activeView === view}
				aria-pressed={viewState.activeView === view}
				onclick={() => requestSceneView(view)}
			>
				{view === 'overview' ? 'Overview' : view === 'stage' ? 'Stage' : 'Optics'}
			</button>
		{/each}
	</div>

	<div class="scene-zoom" role="group" aria-label="Camera zoom">
		<button type="button" aria-label="Zoom in" onclick={() => requestZoom(1)}>+</button>
		<button type="button" aria-label="Zoom out" onclick={() => requestZoom(-1)}>−</button>
	</div>
</div>

<style>
	.scene-shell {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 440px;
		background:
			radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.08), transparent 55%), #0a1122;
	}
</style>
