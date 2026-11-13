import { describe, expect, it } from 'vitest';
import type { PatternId, SimulatorState } from '../types/simulation';
import {
	addLayer,
	alignWafer,
	coatWafer,
	createInitialState,
	developWafer,
	exposeWafer,
	moveStage,
	transferPattern
} from './engine';
import { readAlignment } from './alignment';

function coated(): SimulatorState {
	const result = coatWafer(createInitialState());
	if (!result.ok) throw new Error(result.error);
	return result.state;
}

function completedLayer(
	stage: { x: number; y: number; z: number },
	patternId: PatternId = 'interconnect'
): SimulatorState {
	const start = coatWafer(createInitialState(patternId));
	if (!start.ok) throw new Error(start.error);
	const moved = moveStage(start.state, stage);
	if (!moved.ok) throw new Error(moved.error);
	const aligned = alignWafer(moved.state);
	if (!aligned.ok) throw new Error(aligned.error);
	const exposed = exposeWafer(aligned.state);
	if (!exposed.ok) throw new Error(exposed.error);
	const developed = developWafer(exposed.state);
	if (!developed.ok) throw new Error(developed.error);
	const transferred = transferPattern(developed.state);
	if (!transferred.ok) throw new Error(transferred.error);
	const next = addLayer(transferred.state);
	if (!next.ok) throw new Error(next.error);
	return next.state;
}

describe('alignment exercise', () => {
	it('reports a centred live projection as aligned', () => {
		const reading = readAlignment(coated());
		expect(reading.status).toBe('aligned');
		expect(reading.offset).toEqual({ x: 0, y: 0 });
		expect(reading.referenceNumber).toBeNull();
		expect(reading.recorded).toBe(false);
	});

	it('distinguishes close and misaligned offsets', () => {
		const close = moveStage(coated(), { x: 5, y: -5, z: 0 });
		if (!close.ok) throw new Error(close.error);
		expect(readAlignment(close.state).status).toBe('close');

		const misaligned = moveStage(close.state, { x: 20, y: 0, z: 0 });
		if (!misaligned.ok) throw new Error(misaligned.error);
		expect(readAlignment(misaligned.state).status).toBe('misaligned');
	});

	it('uses the recorded exposure stage after the stage moves', () => {
		const start = coatWafer(createInitialState());
		if (!start.ok) throw new Error(start.error);
		const moved = moveStage(start.state, { x: 15, y: 0, z: 0 });
		if (!moved.ok) throw new Error(moved.error);
		const aligned = alignWafer(moved.state);
		if (!aligned.ok) throw new Error(aligned.error);
		const exposed = exposeWafer(aligned.state);
		if (!exposed.ok) throw new Error(exposed.error);
		const movedAfter = moveStage(exposed.state, { x: 0, y: 0, z: 0 });
		if (!movedAfter.ok) throw new Error(movedAfter.error);

		const reading = readAlignment(movedAfter.state);
		expect(reading.recorded).toBe(true);
		expect(reading.offset).toEqual({ x: 3, y: 0 });
		expect(reading.status).toBe('misaligned');
	});

	it('aligns the next layer to the previous layer position', () => {
		const nextLayer = completedLayer({ x: 10, y: -5, z: 0 });
		expect(nextLayer.layers).toHaveLength(1);

		const alignedNext = moveStage(nextLayer, { x: 10, y: -5, z: 0 });
		if (!alignedNext.ok) throw new Error(alignedNext.error);
		const alignedReading = readAlignment(alignedNext.state);
		expect(alignedReading.status).toBe('aligned');
		expect(alignedReading.referenceNumber).toBe(1);
		expect(alignedReading.referenceOffset).toEqual({ x: 2, y: -1 });

		const wrong = moveStage(nextLayer, { x: 0, y: 0, z: 0 });
		if (!wrong.ok) throw new Error(wrong.error);
		const wrongReading = readAlignment(wrong.state);
		expect(wrongReading.status).toBe('misaligned');
		expect(wrongReading.message).toContain('layer 1');
	});
});
