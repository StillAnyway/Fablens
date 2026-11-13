export type SceneView = 'overview' | 'stage' | 'optics';

export const viewState = $state({
	showReferenceLayer: true,
	showSceneLabels: false,
	activeView: 'overview' as SceneView | null
});

/**
 * Imperative hooks supplied by the mounted scene. Buttons call these directly,
 * so no reactive effect can repeatedly drive the camera.
 */
export const sceneCommands = {
	zoom: null as ((direction: -1 | 1) => void) | null,
	setView: null as ((view: SceneView) => void) | null
};

export function requestSceneView(view: SceneView): void {
	viewState.activeView = view;
	sceneCommands.setView?.(view);
}

export function requestZoom(direction: -1 | 1): void {
	viewState.activeView = null;
	sceneCommands.zoom?.(direction);
}
