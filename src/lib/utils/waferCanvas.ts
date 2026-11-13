import type { PatternOffset } from '../simulation/exposure';
import type { SimulatorState } from '../types/simulation';
import { getDisplayMask, placePattern, WAFER_SIZE } from '../simulation/exposure';
import { PATTERN_SIZE, generatePattern } from '../simulation/patterns';
import { readFocus } from '../simulation/focus';

export type WaferDrawOptions = {
	showReference?: boolean;
	showReferenceFrame?: boolean;
	showGrid?: boolean;
	previousMasks?: Uint8Array[];
	referenceMask?: Uint8Array | null;
	referenceOffset?: PatternOffset;
};

const COLORS = {
	substrate: '#0f172a',
	resist: 'rgba(109, 91, 208, 0.62)',
	exposed: '#fbbf24',
	removed: '#0b1220',
	grid: 'rgba(255, 255, 255, 0.055)',
	edge: '#64748b',
	reference: 'rgba(56, 189, 248, 0.72)',
	referenceFill: 'rgba(56, 189, 248, 0.16)'
};

const LAYER_COLORS = [
	'rgba(20, 184, 166, 0.55)',
	'rgba(34, 197, 94, 0.5)',
	'rgba(96, 165, 250, 0.5)',
	'rgba(192, 132, 252, 0.45)'
];

function maskLayer(mask: Uint8Array, color: string): HTMLCanvasElement {
	const layer = document.createElement('canvas');
	layer.width = WAFER_SIZE;
	layer.height = WAFER_SIZE;
	const context = layer.getContext('2d');
	if (!context) return layer;

	context.fillStyle = color;
	for (let row = 0; row < WAFER_SIZE; row += 1) {
		for (let col = 0; col < WAFER_SIZE; col += 1) {
			if (!mask[row * WAFER_SIZE + col]) continue;
			context.fillRect(col, row, 1, 1);
		}
	}
	return layer;
}

function drawAlignmentMarks(
	ctx: CanvasRenderingContext2D,
	centerX: number,
	centerY: number,
	span: number,
	cell: number
): void {
	const pad = cell * 2;
	const x = centerX - span / 2 - pad;
	const y = centerY - span / 2 - pad;
	const right = centerX + span / 2 + pad;
	const bottom = centerY + span / 2 + pad;
	const length = cell * 5;
	const line = Math.max(1.5, cell * 0.28);

	ctx.save();
	ctx.strokeStyle = COLORS.reference;
	ctx.lineWidth = line;

	const corners: Array<[number, number, number, number]> = [
		[x, y, 1, 1],
		[right, y, -1, 1],
		[x, bottom, 1, -1],
		[right, bottom, -1, -1]
	];

	for (const [cx, cy, dx, dy] of corners) {
		ctx.beginPath();
		ctx.moveTo(cx + dx * length, cy);
		ctx.lineTo(cx, cy);
		ctx.lineTo(cx, cy + dy * length);
		ctx.stroke();
	}
	ctx.restore();
}

export function drawWafer(
	ctx: CanvasRenderingContext2D,
	size: number,
	state: SimulatorState,
	options: WaferDrawOptions = {}
): void {
	const {
		showReference = false,
		showReferenceFrame = false,
		showGrid = true,
		previousMasks = [],
		referenceMask: explicitReference = null,
		referenceOffset = { x: 0, y: 0 }
	} = options;
	const center = size / 2;
	const radius = size * 0.46;
	const cell = (radius * 2) / WAFER_SIZE;
	const origin = center - radius;

	ctx.clearRect(0, 0, size, size);
	ctx.save();

	ctx.beginPath();
	ctx.arc(center, center, radius, 0, Math.PI * 2);
	ctx.clip();

	ctx.fillStyle = COLORS.substrate;
	ctx.fillRect(origin, origin, radius * 2, radius * 2);

	for (let index = 0; index < previousMasks.length; index += 1) {
		const layer = maskLayer(previousMasks[index], LAYER_COLORS[index % LAYER_COLORS.length]);
		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(layer, origin, origin, radius * 2, radius * 2);
		ctx.restore();
	}

	if (state.phase !== 'uncoated') {
		ctx.fillStyle = COLORS.resist;
		ctx.fillRect(origin, origin, radius * 2, radius * 2);
	}

	const referenceMask = showReference
		? (explicitReference ??
			placePattern(generatePattern(state.patternId), { x: 0, y: 0 }, WAFER_SIZE))
		: null;

	if (referenceMask) {
		const mask = maskLayer(referenceMask, COLORS.referenceFill);
		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.globalAlpha = 0.85;
		ctx.drawImage(mask, origin, origin, radius * 2, radius * 2);
		ctx.restore();
	}

	if (state.phase !== 'uncoated') {
		const mask = getDisplayMask(state);
		const layerColor =
			state.phase === 'prepared' || state.phase === 'aligned'
				? COLORS.exposed
				: state.phase === 'exposed'
					? COLORS.exposed
					: COLORS.removed;
		const layer = maskLayer(mask, layerColor);
		const blur = readFocus(state.stage.z).blurPx;
		const useBlur = blur > 0 && (state.phase === 'prepared' || state.phase === 'aligned');

		ctx.save();
		ctx.globalAlpha =
			state.phase === 'prepared' || state.phase === 'aligned'
				? 0.72
				: state.phase === 'developed'
					? 0.55
					: 1;
		ctx.imageSmoothingEnabled = useBlur;
		ctx.filter = useBlur ? `blur(${blur}px)` : 'none';
		ctx.drawImage(layer, origin, origin, radius * 2, radius * 2);
		ctx.restore();
	}

	if (showGrid) {
		ctx.strokeStyle = COLORS.grid;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 0; i <= WAFER_SIZE; i += 8) {
			const p = origin + i * cell;
			ctx.moveTo(p, origin);
			ctx.lineTo(p, origin + radius * 2);
			ctx.moveTo(origin, p);
			ctx.lineTo(origin + radius * 2, p);
		}
		ctx.stroke();
	}

	if (referenceMask) {
		const patternSpan = PATTERN_SIZE * cell;
		const referenceX = center + referenceOffset.x * cell;
		const referenceY = center - referenceOffset.y * cell;

		if (showReferenceFrame) {
			ctx.save();
			ctx.strokeStyle = COLORS.reference;
			ctx.lineWidth = Math.max(1, cell * 0.12);
			ctx.setLineDash([size * 0.016, size * 0.012]);
			ctx.strokeRect(
				referenceX - patternSpan / 2,
				referenceY - patternSpan / 2,
				patternSpan,
				patternSpan
			);
			ctx.restore();
		}

		drawAlignmentMarks(ctx, referenceX, referenceY, patternSpan, cell);
	}

	ctx.restore();

	ctx.beginPath();
	ctx.arc(center, center, radius, 0, Math.PI * 2);
	ctx.strokeStyle = COLORS.edge;
	ctx.lineWidth = Math.max(1.5, size * 0.004);
	ctx.stroke();
}
