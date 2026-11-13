export type Phase = 'uncoated' | 'prepared' | 'aligned' | 'exposed' | 'developed';

export type PatternId = 'interconnect' | 'vias' | 'gate';

export type ComponentId =
	'projector' | 'optics' | 'camera' | 'stage' | 'sample-holder' | 'wafer' | 'controller';

export type Axis = 'x' | 'y' | 'z';

export type StagePosition = {
	x: number;
	y: number;
	z: number;
};

export type LayerRecord = {
	number: number;
	patternId: PatternId;
	exposureMask: Uint8Array;
	exposureStage: StagePosition;
};

export type SimulatorState = {
	phase: Phase;
	selectedComponent: ComponentId | null;
	patternId: PatternId;
	/** Virtual stage coordinates. Deliberately not millimetres. */
	stage: StagePosition;
	/**
	 * Illuminated wafer cells recorded at exposure time, in row-major order.
	 * `null` until the wafer has been exposed.
	 */
	exposureMask: Uint8Array | null;
	/**
	 * A snapshot of the stage at exposure time. This is a historical record of
	 * the exposure event, not a second live position. Live projection placement
	 * is always derived from `stage`.
	 */
	exposureStage: StagePosition | null;
	/** Developed layers already committed to the virtual wafer stack. */
	layers: LayerRecord[];
};

export type ActionResult = { ok: true; state: SimulatorState } | { ok: false; error: string };
