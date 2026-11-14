export type Phase = 'uncoated' | 'prepared' | 'aligned' | 'exposed' | 'developed' | 'transferred';

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
	patternId: PatternId | null;
	stage: StagePosition;
	exposureMask: Uint8Array | null;
	exposureStage: StagePosition | null;
	layers: LayerRecord[];
};

export type ActionResult = { ok: true; state: SimulatorState } | { ok: false; error: string };
