import type { SimulatorState } from '../types/simulation';
import { patternOffsetFromStage, type PatternOffset } from './exposure';

export type AlignmentStatus = 'aligned' | 'close' | 'misaligned';

export type AlignmentReading = {
	/** Absolute placement offset of the live or recorded current layer. */
	offset: PatternOffset;
	/** Offset of the layer being aligned against. Centred for the first layer. */
	referenceOffset: PatternOffset;
	referenceNumber: number | null;
	maxError: number;
	status: AlignmentStatus;
	label: string;
	recorded: boolean;
	message: string;
};

/**
 * Compares the current layer position with the previous developed layer.
 * For the first layer the centred reference marks are the target.
 * One cell of error is treated as "close"; two or more is "misaligned".
 */
export function readAlignment(state: SimulatorState): AlignmentReading {
	const recorded =
		(state.phase === 'exposed' || state.phase === 'developed') && state.exposureStage !== null;
	const stage = recorded && state.exposureStage ? state.exposureStage : state.stage;
	const offset = patternOffsetFromStage(stage);
	const previous = state.layers.at(-1);
	const referenceOffset = previous
		? patternOffsetFromStage(previous.exposureStage)
		: { x: 0, y: 0 };
	const maxError = Math.max(
		Math.abs(offset.x - referenceOffset.x),
		Math.abs(offset.y - referenceOffset.y)
	);
	const referenceNumber = previous?.number ?? null;
	const referenceLabel = previous ? `layer ${previous.number}` : 'the reference marks';

	if (maxError === 0) {
		return {
			offset,
			referenceOffset,
			referenceNumber,
			maxError,
			status: 'aligned',
			label: 'Aligned',
			recorded,
			message: `Projected pattern is aligned with ${referenceLabel}.`
		};
	}

	if (maxError === 1) {
		return {
			offset,
			referenceOffset,
			referenceNumber,
			maxError,
			status: 'close',
			label: 'Close',
			recorded,
			message: `One cell off ${referenceLabel}. A real process would define its own overlay tolerance.`
		};
	}

	return {
		offset,
		referenceOffset,
		referenceNumber,
		maxError,
		status: 'misaligned',
		label: 'Misaligned',
		recorded,
		message: `The projected pattern is clearly offset from ${referenceLabel}.`
	};
}
