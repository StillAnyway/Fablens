<script lang="ts">
	import LithographyScene from '#lib/components/scene/LithographyScene.svelte';
	import BigPicture from '#lib/components/experiment/BigPicture.svelte';
	import ExperimentSteps from '#lib/components/experiment/ExperimentSteps.svelte';
	import LayerStack from '#lib/components/experiment/LayerStack.svelte';
	import PatternPicker from '#lib/components/experiment/PatternPicker.svelte';
	import StageControls from '#lib/components/experiment/StageControls.svelte';
	import WaferPreview from '#lib/components/experiment/WaferPreview.svelte';
	import ComponentInfo from '#lib/components/experiment/ComponentInfo.svelte';
	import DeveloperConsole from '#lib/components/experiment/DeveloperConsole.svelte';
	import { simulator } from '#lib/simulation/state.svelte.js';
	import { PHASE_META } from '#lib/constants/experiment.js';
	import { viewState } from '#lib/ui.svelte.js';

	const phase = $derived(PHASE_META[simulator.state.phase]);
</script>

<svelte:head>
	<title>FabLens: Interactive maskless lithography simulator</title>
	<meta
		name="description"
		content="An open-source, educational maskless lithography simulator: explore a stylised machine, align a virtual stage, expose positive photoresist and develop a pattern."
	/>
</svelte:head>

<a class="skip-link" href="#experiment-controls">Skip to experiment controls</a>

<div class="app-shell">
	<header class="topbar">
		<div class="brand">
			<span class="brand-mark" aria-hidden="true">
				<span></span>
			</span>
			<div>
				<div class="brand-name">FabLens</div>
				<p>Maskless lithography, made explorable.</p>
			</div>
		</div>

		<nav class="header-links" aria-label="Project links">
			<a
				class="header-link"
				href="https://github.com/StillAnyway/Fablens"
				target="_blank"
				rel="noreferrer"
				aria-label="FabLens source code on GitHub"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="m8 9-3 3 3 3M16 9l3 3-3 3M13 6l-2 12" />
				</svg>
				<span>Source</span>
			</a>

			<a
				class="header-link"
				href="https://stillanyway.com"
				target="_blank"
				rel="noreferrer"
				aria-label="Pranav Chatur's website"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="12" cy="12" r="8" />
					<path d="M4 12h16M12 4a13 13 0 0 1 0 16M12 4a13 13 0 0 0 0 16" />
				</svg>
				<span>Website</span>
			</a>

			<a
				class="header-link header-icon-link"
				href="mailto:pranav@stillanyway.com"
				aria-label="Email Pranav Chatur"
				title="Email Pranav Chatur"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<rect x="3" y="5" width="18" height="14" rx="2" />
					<path d="m4 7 8 6 8-6" />
				</svg>
			</a>
		</nav>
	</header>

	<BigPicture />

	<main class="workspace">
		<section class="scene-card" aria-labelledby="scene-heading">
			<div class="scene-heading-row">
				<div>
					<h1 id="scene-heading">The lithography machine</h1>
					<p>Stylised teaching model. Geometry and optical layout are illustrative.</p>
				</div>
				<span class="phase-pill phase-{simulator.state.phase}">{phase.label}</span>
			</div>

			<div class="scene-stage">
				<LithographyScene />
				<p class="sr-only">
					Interactive 3D lithography machine. Drag to orbit, use the zoom buttons or camera view
					presets, or select parts from the component list below.
				</p>
				<div class="scene-hint">
					Drag to orbit · Right-drag to pan · +/− to zoom · ? shows parts and details
				</div>
			</div>

			{#if viewState.showSceneLabels}
				<ComponentInfo />
			{/if}
		</section>

		<aside
			class="control-column"
			id="experiment-controls"
			tabindex="-1"
			aria-label="Experiment controls"
		>
			<ExperimentSteps />
			{#if simulator.state.layers.length > 0}
				<LayerStack />
			{/if}
			{#if simulator.state.phase === 'prepared'}
				<PatternPicker />
				<StageControls />
			{/if}
			<WaferPreview />
			<DeveloperConsole />
		</aside>
	</main>

	<footer class="site-footer">
		<p>
			FabLens is an educational approximation, not calibrated equipment or process software. It does
			not control real hardware, recommend exposure doses or predict minimum feature sizes. Real
			photolithography involves UV, chemicals, heat and equipment hazards.
		</p>
		<p>
			Machine/protocol reference:
			<a href="https://github.com/hackerfabiitb/litho-ui" target="_blank" rel="noreferrer"
				>HackerFab IIT Bombay litho-ui</a
			>. No affiliation or hardware validation is implied.
		</p>
	</footer>
</div>
