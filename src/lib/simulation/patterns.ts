import type { PatternId } from '../types/simulation';

/** Size of the square pattern grid, in pattern cells. */
export const PATTERN_SIZE = 40;

/** Size of the square virtual wafer grid, in wafer cells. */
export const WAFER_SIZE = 64;

export const PATTERN_IDS: PatternId[] = ['interconnect', 'vias', 'gate'];

export const PATTERN_LABELS: Record<PatternId, string> = {
	interconnect: 'Interconnect',
	vias: 'Contact vias',
	gate: 'Gate lines'
};

export const PATTERN_ROLES: Record<PatternId, string> = {
	interconnect: 'Metal wiring',
	vias: 'Layer-to-layer connections',
	gate: 'Transistor gates'
};

export const PATTERN_DESCRIPTIONS: Record<PatternId, string> = {
	interconnect: 'Metal lines with pads. These could carry signals between parts of a circuit.',
	vias: 'A grid of small openings. These could become contacts between two metal layers.',
	gate: 'Closely spaced lines. These could define transistor gate electrodes.'
};

/** Suggests a sensible next layer so the stack tells a small process story. */
export const NEXT_PATTERN: Record<PatternId, PatternId> = {
	interconnect: 'vias',
	vias: 'gate',
	gate: 'interconnect'
};

function emptyPattern(): Uint8Array {
	return new Uint8Array(PATTERN_SIZE * PATTERN_SIZE);
}

function setCell(mask: Uint8Array, x: number, y: number): void {
	if (x < 0 || y < 0 || x >= PATTERN_SIZE || y >= PATTERN_SIZE) return;
	mask[y * PATTERN_SIZE + x] = 1;
}

function fillRect(mask: Uint8Array, x0: number, y0: number, width: number, height: number): void {
	for (let y = y0; y < y0 + height; y += 1) {
		for (let x = x0; x < x0 + width; x += 1) setCell(mask, x, y);
	}
}

/**
 * Returns a fresh, deterministic binary mask for a layer-type preset.
 * Cell values are 1 where light would pass and 0 elsewhere.
 */
export function generatePattern(id: PatternId): Uint8Array {
	const mask = emptyPattern();

	if (id === 'interconnect') {
		for (const y of [8, 25]) {
			fillRect(mask, 6, y, 28, 6);
			fillRect(mask, 3, y - 4, 9, 14);
			fillRect(mask, 28, y - 4, 9, 14);
		}
	}

	if (id === 'vias') {
		for (const y of [7, 17, 27]) {
			for (const x of [7, 17, 27]) fillRect(mask, x, y, 6, 6);
		}
	}

	if (id === 'gate') {
		for (const x of [6, 12, 18, 24, 30]) fillRect(mask, x, 6, 3, 27);
		fillRect(mask, 4, 33, 32, 5);
	}

	return mask;
}

export function countLitCells(mask: Uint8Array): number {
	let count = 0;
	for (const value of mask) if (value) count += 1;
	return count;
}
