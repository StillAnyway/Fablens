import { describe, expect, it } from 'vitest';
import type { ActionResult, PatternId, SimulatorState } from '../types/simulation';
import {
	addLayer,
	alignWafer,
	coatWafer,
	createInitialState,
	developWafer,
	exposeWafer,
	moveStage,
	resetSimulation,
	selectPattern,
	transferPattern,
	unlockAlignment
} from './engine';
import { getResistMask, patternOffsetFromStage, placePattern, WAFER_SIZE } from './exposure';
import { countLitCells, generatePattern } from './patterns';

function unwrap(result: ActionResult): SimulatorState {
	if (!result.ok) throw new Error(result.error);
	return result.state;
}

function coated(patternId: PatternId = 'interconnect'): SimulatorState {
	return unwrap(coatWafer(createInitialState(patternId)));
}

function exposedAt(stage: { x: number; y: number; z: number }): SimulatorState {
	return unwrap(exposeWafer(unwrap(alignWafer(unwrap(moveStage(coated(), stage))))));
}

function developedAt(stage: { x: number; y: number; z: number }): SimulatorState {
	return unwrap(developWafer(exposedAt(stage)));
}

describe('simulation engine', () => {
	it('starts with a bare wafer at the centre', () => {
		const state = createInitialState();
		expect(state.phase).toBe('uncoated');
		expect(state.patternId).toBeNull();
		expect(state.stage).toEqual({ x: 0, y: 0, z: 0 });
		expect(state.exposureMask).toBeNull();
		expect(state.exposureStage).toBeNull();
		expect(state.layers).toEqual([]);
	});

	it('requires a layer type before alignment', () => {
		const result = alignWafer(unwrap(coatWafer(createInitialState())));
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toContain('Choose a layer type');
	});

	it('requires coating before alignment', () => {
		const result = alignWafer(createInitialState());
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toContain('Coat the wafer');
	});

	it('applies photoresist in the coating step', () => {
		const coatedState = coated();
		expect(coatedState.phase).toBe('prepared');
		expect(getResistMask(coatedState).every((cell) => cell === 1)).toBe(true);
		expect(getResistMask(createInitialState()).every((cell) => cell === 0)).toBe(true);
	});

	it('rejects development before exposure', () => {
		const result = developWafer(createInitialState());
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toContain('Expose the wafer');
	});

	it('rejects exposure before alignment is confirmed', () => {
		const result = exposeWafer(coated());
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toContain('Confirm alignment');
	});

	it('invalidates confirmed alignment when the stage moves', () => {
		const aligned = unwrap(alignWafer(coated()));
		const moved = unwrap(moveStage(aligned, { x: 5, y: 0, z: 0 }));
		expect(moved.phase).toBe('prepared');
		expect(moved.stage).toEqual({ x: 5, y: 0, z: 0 });
	});

	it('invalidates confirmed alignment when the pattern changes', () => {
		const aligned = unwrap(alignWafer(coated()));
		const changed = unwrap(selectPattern(aligned, 'gate'));
		expect(changed.phase).toBe('prepared');
		expect(changed.patternId).toBe('gate');
	});

	it('can explicitly unlock alignment without changing the pattern', () => {
		const aligned = unwrap(alignWafer(coated()));
		const unlocked = unwrap(unlockAlignment(aligned));
		expect(unlocked.phase).toBe('prepared');
		expect(unlocked.patternId).toBe(aligned.patternId);
	});

	it('allows a deliberately misaligned exposure as an experiment', () => {
		const moved = unwrap(moveStage(coated(), { x: 20, y: 0, z: 0 }));
		const aligned = unwrap(alignWafer(moved));
		expect(aligned.phase).toBe('aligned');
		const exposed = unwrap(exposeWafer(aligned));
		expect(exposed.phase).toBe('exposed');
		expect(exposed.exposureStage).toEqual({ x: 20, y: 0, z: 0 });
		expect(exposed.exposureMask).toEqual(
			placePattern(generatePattern('interconnect'), { x: 4, y: 0 }, WAFER_SIZE)
		);
	});

	it('runs the guided positive-resist sequence in order', () => {
		const prepared = coated();
		expect(prepared.phase).toBe('prepared');

		const aligned = unwrap(alignWafer(prepared));
		expect(aligned.phase).toBe('aligned');

		const exposed = unwrap(exposeWafer(aligned));
		expect(exposed.phase).toBe('exposed');
		expect(exposed.exposureMask).not.toBeNull();
		expect(exposed.exposureStage).not.toBeNull();

		const developed = unwrap(developWafer(exposed));
		expect(developed.phase).toBe('developed');
		expect(developed.exposureMask).not.toBeNull();

		const transferred = unwrap(transferPattern(developed));
		expect(transferred.phase).toBe('transferred');
	});

	it('records the illuminated pattern at the aligned stage position', () => {
		const exposed = exposedAt({ x: 15, y: -10, z: 0 });
		const expected = placePattern(generatePattern('interconnect'), { x: 3, y: -2 }, WAFER_SIZE);

		expect(exposed.exposureMask).toEqual(expected);
		expect(exposed.exposureStage).toEqual({ x: 15, y: -10, z: 0 });
		expect(countLitCells(exposed.exposureMask as Uint8Array)).toBe(
			countLitCells(generatePattern('interconnect'))
		);
	});

	it('does not move a recorded exposure when the stage moves afterwards', () => {
		const exposed = exposedAt({ x: 0, y: 0, z: 0 });
		const recorded = exposed.exposureMask?.slice();
		const recordedStage = exposed.exposureStage;

		const moved = unwrap(moveStage(exposed, { x: 30, y: 20, z: 0 }));
		expect(moved.exposureMask).toEqual(recorded);
		expect(moved.exposureStage).toEqual(recordedStage);
	});

	it('removes only exposed cells after positive-resist development', () => {
		const developed = developedAt({ x: 0, y: 0, z: 0 });
		const resist = getResistMask(developed);
		const mask = developed.exposureMask as Uint8Array;

		for (let i = 0; i < resist.length; i += 1) {
			expect(resist[i]).toBe(mask[i] ? 0 : 1);
		}
	});

	it('rejects pattern changes after exposure', () => {
		const exposed = exposedAt({ x: 0, y: 0, z: 0 });
		const result = selectPattern(exposed, 'vias');
		expect(result.ok).toBe(false);
	});

	it('adds a developed layer to the stack and starts the next suggested layer', () => {
		const developed = developedAt({ x: 0, y: 0, z: 0 });
		const transferred = unwrap(transferPattern(developed));
		const result = unwrap(addLayer(transferred));

		expect(result.phase).toBe('uncoated');
		expect(result.patternId).toBeNull();
		expect(result.stage).toEqual({ x: 0, y: 0, z: 0 });
		expect(result.exposureMask).toBeNull();
		expect(result.exposureStage).toBeNull();
		expect(result.layers).toHaveLength(1);
		expect(result.layers[0]).toMatchObject({ number: 1, patternId: 'interconnect' });
		expect(result.layers[0].exposureMask).toEqual(developed.exposureMask);
	});

	it('rejects transfer before development', () => {
		const result = transferPattern(coated());
		expect(result.ok).toBe(false);
	});

	it('rejects adding a layer before transfer', () => {
		const result = addLayer(developedAt({ x: 0, y: 0, z: 0 }));
		expect(result.ok).toBe(false);
	});

	it('clamps stage coordinates to the virtual travel range', () => {
		const moved = unwrap(moveStage(createInitialState(), { x: 500, y: -500, z: 80 }));
		expect(moved.stage).toEqual({ x: 50, y: -50, z: 50 });
	});

	it('derives a deterministic overlay offset from stage coordinates', () => {
		expect(patternOffsetFromStage({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0 });
		expect(patternOffsetFromStage({ x: 25, y: -25, z: 0 })).toEqual({ x: 5, y: -5 });
		expect(patternOffsetFromStage({ x: 2, y: 3, z: 0 })).toEqual({ x: 0, y: 1 });
	});

	it('resets to a fresh bare-wafer state and clears the stack', () => {
		const exposed = unwrap(exposeWafer(unwrap(alignWafer(coated('vias')))));
		const transferred = unwrap(transferPattern(unwrap(developWafer(exposed))));
		const stacked = unwrap(addLayer(transferred));
		expect(stacked.layers).toHaveLength(1);

		const reset = resetSimulation();
		expect(reset).toEqual(createInitialState());
		expect(reset.phase).toBe('uncoated');
		expect(reset.layers).toEqual([]);
	});
});
