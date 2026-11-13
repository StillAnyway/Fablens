import { describe, expect, it } from 'vitest';
import {
	NEXT_PATTERN,
	PATTERN_IDS,
	PATTERN_SIZE,
	countLitCells,
	generatePattern
} from './patterns';

describe('pattern presets', () => {
	it('generates the same mask on every call', () => {
		for (const id of PATTERN_IDS) {
			expect(generatePattern(id)).toEqual(generatePattern(id));
		}
	});

	it('returns correctly sized binary masks for every layer type', () => {
		for (const id of PATTERN_IDS) {
			const mask = generatePattern(id);
			expect(mask).toHaveLength(PATTERN_SIZE * PATTERN_SIZE);
			expect(mask.some((cell) => cell === 1)).toBe(true);
			expect(mask.every((cell) => cell === 0 || cell === 1)).toBe(true);
		}
	});

	it('keeps the layer presets visually distinct', () => {
		const masks = PATTERN_IDS.map((id) => generatePattern(id));
		for (const mask of masks) expect(countLitCells(mask)).toBeGreaterThan(0);
		expect(masks[0]).not.toEqual(masks[1]);
		expect(masks[1]).not.toEqual(masks[2]);
		expect(masks[0]).not.toEqual(masks[2]);
	});

	it('suggests a coherent next layer cycle', () => {
		expect(NEXT_PATTERN.interconnect).toBe('vias');
		expect(NEXT_PATTERN.vias).toBe('gate');
		expect(NEXT_PATTERN.gate).toBe('interconnect');
	});
});
