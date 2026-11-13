import type { SimulatorState, StagePosition } from '../types/simulation';
import { PATTERN_SIZE, WAFER_SIZE, generatePattern } from './patterns';

/** Virtual stage travel limit per axis. Not a physical distance. */
export const STAGE_LIMIT = 50;

/** Virtual stage units per wafer cell used by the teaching overlay. */
export const VIRTUAL_UNITS_PER_CELL = 5;

export type PatternOffset = {
	x: number;
	y: number;
};

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function clampStage(stage: StagePosition): StagePosition {
	return {
		x: clamp(stage.x, -STAGE_LIMIT, STAGE_LIMIT),
		y: clamp(stage.y, -STAGE_LIMIT, STAGE_LIMIT),
		z: clamp(stage.z, -STAGE_LIMIT, STAGE_LIMIT)
	};
}

/**
 * Converts virtual stage coordinates into a pattern offset in wafer cells.
 * Positive X moves the overlay right; positive Y moves it up in the top-down view.
 */
export function patternOffsetFromStage(stage: StagePosition): PatternOffset {
	return {
		x: Math.round(stage.x / VIRTUAL_UNITS_PER_CELL),
		y: Math.round(stage.y / VIRTUAL_UNITS_PER_CELL)
	};
}

/**
 * Places a square pattern mask onto the wafer grid.
 * Cells that fall outside the wafer are clipped.
 */
export function placePattern(
	pattern: Uint8Array,
	offset: PatternOffset,
	waferSize = WAFER_SIZE
): Uint8Array {
	const patternSize = Math.round(Math.sqrt(pattern.length));
	const mask = new Uint8Array(waferSize * waferSize);
	const base = Math.floor((waferSize - patternSize) / 2);

	for (let py = 0; py < patternSize; py += 1) {
		for (let px = 0; px < patternSize; px += 1) {
			if (!pattern[py * patternSize + px]) continue;
			const x = base + px + offset.x;
			// Canvas rows increase downward, so positive Y offset subtracts.
			const y = base + py - offset.y;
			if (x < 0 || y < 0 || x >= waferSize || y >= waferSize) continue;
			mask[y * waferSize + x] = 1;
		}
	}

	return mask;
}

function currentProjection(state: SimulatorState): Uint8Array {
	return placePattern(
		generatePattern(state.patternId),
		patternOffsetFromStage(state.stage),
		WAFER_SIZE
	);
}

/**
 * The mask that should be shown for the current phase. Before exposure this is
 * the live projection; after exposure it is the recorded exposure.
 */
export function getDisplayMask(state: SimulatorState): Uint8Array {
	if ((state.phase === 'exposed' || state.phase === 'developed') && state.exposureMask) {
		return state.exposureMask;
	}
	return currentProjection(state);
}

/**
 * Derived positive-resist state: 1 = resist remains, 0 = resist removed.
 * Development removes only cells that were exposed.
 */
export function getResistMask(state: SimulatorState): Uint8Array {
	const resist = new Uint8Array(WAFER_SIZE * WAFER_SIZE);
	if (state.phase === 'uncoated') return resist;

	resist.fill(1);
	if (state.phase !== 'developed' || !state.exposureMask) return resist;

	for (let i = 0; i < resist.length; i += 1) {
		if (state.exposureMask[i]) resist[i] = 0;
	}
	return resist;
}

export { PATTERN_SIZE, WAFER_SIZE };
