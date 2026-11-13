import type {
	ActionResult,
	Axis,
	ComponentId,
	PatternId,
	SimulatorState,
	StagePosition
} from '../types/simulation';
import { NEXT_PATTERN, PATTERN_IDS, WAFER_SIZE, generatePattern } from './patterns';
import { clampStage, patternOffsetFromStage, placePattern } from './exposure';

export function createInitialState(patternId: PatternId = 'interconnect'): SimulatorState {
	return {
		phase: 'uncoated',
		selectedComponent: null,
		patternId,
		stage: { x: 0, y: 0, z: 0 },
		exposureMask: null,
		exposureStage: null,
		layers: []
	};
}

export function selectComponent(
	state: SimulatorState,
	component: ComponentId | null
): SimulatorState {
	return { ...state, selectedComponent: component };
}

export function selectPattern(state: SimulatorState, patternId: PatternId): ActionResult {
	if (!PATTERN_IDS.includes(patternId)) {
		return { ok: false, error: 'Unknown pattern.' };
	}

	if (state.phase === 'exposed' || state.phase === 'developed') {
		return {
			ok: false,
			error: 'The exposure is already recorded. Reset the experiment to choose a different pattern.'
		};
	}

	// Changing the pattern after confirmation invalidates the confirmed alignment.
	const phase = state.phase === 'aligned' ? 'prepared' : state.phase;
	return { ok: true, state: { ...state, phase, patternId } };
}

export function moveStage(state: SimulatorState, stage: StagePosition): ActionResult {
	// Moving after confirmation invalidates the confirmed alignment.
	const phase = state.phase === 'aligned' ? 'prepared' : state.phase;
	return { ok: true, state: { ...state, phase, stage: clampStage(stage) } };
}

export function setStageAxis(state: SimulatorState, axis: Axis, value: number): ActionResult {
	return moveStage(state, { ...state.stage, [axis]: value });
}

export function coatWafer(state: SimulatorState): ActionResult {
	if (state.phase === 'uncoated') {
		return { ok: true, state: { ...state, phase: 'prepared' } };
	}

	if (state.phase === 'prepared' || state.phase === 'aligned') {
		return { ok: true, state };
	}

	return {
		ok: false,
		error: 'The wafer already carries a resist layer. Reset the experiment to coat a fresh wafer.'
	};
}

export function alignWafer(state: SimulatorState): ActionResult {
	if (state.phase === 'uncoated') {
		return { ok: false, error: 'Coat the wafer with photoresist before aligning it.' };
	}

	if (state.phase === 'prepared') {
		return { ok: true, state: { ...state, phase: 'aligned' } };
	}

	if (state.phase === 'aligned') {
		return { ok: true, state };
	}

	return {
		ok: false,
		error:
			'Alignment is already locked into the recorded exposure. Reset to run the experiment again.'
	};
}

export function unlockAlignment(state: SimulatorState): ActionResult {
	if (state.phase !== 'aligned') {
		return { ok: false, error: 'Alignment is not currently confirmed.' };
	}

	return { ok: true, state: { ...state, phase: 'prepared' } };
}

export function exposeWafer(state: SimulatorState): ActionResult {
	if (state.phase !== 'aligned') {
		return {
			ok: false,
			error:
				state.phase === 'uncoated'
					? 'Coat the wafer with photoresist before exposing it.'
					: state.phase === 'prepared'
						? 'Confirm alignment before exposing the wafer.'
						: 'This wafer has already been exposed. Develop it or reset the experiment.'
		};
	}

	const exposureMask = placePattern(
		generatePattern(state.patternId),
		patternOffsetFromStage(state.stage),
		WAFER_SIZE
	);

	return {
		ok: true,
		state: {
			...state,
			phase: 'exposed',
			exposureMask,
			exposureStage: { ...state.stage }
		}
	};
}

export function developWafer(state: SimulatorState): ActionResult {
	if (state.phase !== 'exposed' || !state.exposureMask) {
		return {
			ok: false,
			error:
				state.phase === 'developed'
					? 'This wafer has already been developed. Reset to run the experiment again.'
					: 'Expose the wafer before developing the photoresist.'
		};
	}

	return { ok: true, state: { ...state, phase: 'developed' } };
}

export function addLayer(state: SimulatorState): ActionResult {
	if (state.phase !== 'developed' || !state.exposureMask || !state.exposureStage) {
		return {
			ok: false,
			error: 'Develop the current layer before adding another one.'
		};
	}

	const nextPattern = NEXT_PATTERN[state.patternId];

	return {
		ok: true,
		state: {
			...state,
			phase: 'uncoated',
			patternId: nextPattern,
			stage: { x: 0, y: 0, z: 0 },
			exposureMask: null,
			exposureStage: null,
			layers: [
				...state.layers,
				{
					number: state.layers.length + 1,
					patternId: state.patternId,
					exposureMask: state.exposureMask,
					exposureStage: { ...state.exposureStage }
				}
			]
		}
	};
}

export function resetSimulation(): SimulatorState {
	return createInitialState();
}
