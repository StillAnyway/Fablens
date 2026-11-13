import type { StagePosition } from '../types/simulation';
import { STAGE_LIMIT, clamp } from './exposure';

// Emulated limits; real firmware derives limits from calibration.
export const PROTOCOL_MIN = 0;
export const PROTOCOL_MAX = 10000;
export const PROTOCOL_CENTER = 5000;
export const STEPS_PER_VIRTUAL_UNIT = 100;

export type ControllerPosition = {
	x: number;
	y: number;
	z: number;
};

export type ControllerState = {
	position: ControllerPosition;
};

export type ControllerResult = {
	state: ControllerState;
	responses: string[];
	note?: string;
	moved: boolean;
};

const AXES = ['x', 'y', 'z'] as const;
type ControllerAxis = (typeof AXES)[number];

function clampSteps(value: number): number {
	return Math.round(clamp(value, PROTOCOL_MIN, PROTOCOL_MAX));
}

export function stepsToVirtual(step: number): number {
	return (clampSteps(step) - PROTOCOL_CENTER) / STEPS_PER_VIRTUAL_UNIT;
}

export function virtualToSteps(units: number): number {
	return Math.round(
		clamp(units, -STAGE_LIMIT, STAGE_LIMIT) * STEPS_PER_VIRTUAL_UNIT + PROTOCOL_CENTER
	);
}

export function createControllerState(): ControllerState {
	return { position: { x: PROTOCOL_CENTER, y: PROTOCOL_CENTER, z: PROTOCOL_CENTER } };
}

export function controllerFromStage(stage: StagePosition): ControllerState {
	return {
		position: {
			x: virtualToSteps(stage.x),
			y: virtualToSteps(stage.y),
			z: virtualToSteps(stage.z)
		}
	};
}

export function controllerToStage(state: ControllerState): StagePosition {
	return {
		x: stepsToVirtual(state.position.x),
		y: stepsToVirtual(state.position.y),
		z: stepsToVirtual(state.position.z)
	};
}

function formatPosition(position: ControllerPosition): string {
	return `POS ${position.x} ${position.y} ${position.z}`;
}

function moveTo(state: ControllerState, target: ControllerPosition): ControllerResult {
	const moved = AXES.some((axis) => target[axis] !== state.position[axis]);
	const clamped = {
		x: clampSteps(target.x),
		y: clampSteps(target.y),
		z: clampSteps(target.z)
	};
	const wasClamped = AXES.some((axis) => clamped[axis] !== target[axis]);

	return {
		state: { position: clamped },
		responses: [formatPosition(clamped), 'DONE'],
		note: wasClamped ? 'Target was clamped to the emulated 0–10000 step bounds.' : undefined,
		moved: moved || wasClamped
	};
}

function parseInteger(value: string | undefined): number | null {
	if (value === undefined || !/^[+-]?\d+$/.test(value)) return null;
	const parsed = Number.parseInt(value, 10);
	return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseAxis(value: string | undefined): ControllerAxis | null {
	if (!value) return null;
	const axis = value.toLowerCase();
	return AXES.includes(axis as ControllerAxis) ? (axis as ControllerAxis) : null;
}

// Source-informed subset: P, A, R, J, L.
export function executeCommand(state: ControllerState, rawLine: string): ControllerResult {
	const line = rawLine.trim();
	if (line.length === 0) {
		return { state, responses: [], moved: false };
	}

	const [command, ...args] = line.split(/\s+/);

	if (command === 'P') {
		return { state, responses: [formatPosition(state.position)], moved: false };
	}

	if (command === 'L') {
		return {
			state,
			responses: [
				`LIMITS ${PROTOCOL_MIN} ${PROTOCOL_MAX} ${PROTOCOL_MIN} ${PROTOCOL_MAX} ${PROTOCOL_MIN} ${PROTOCOL_MAX}`
			],
			moved: false
		};
	}

	if (command === 'A') {
		const target = args.map(parseInteger);
		if (target.length !== 3 || target.some((value) => value === null)) {
			return {
				state,
				responses: ['ERR invalid arguments for A'],
				note: 'Expected: A x y z (for example A 1000 500 0).',
				moved: false
			};
		}
		return moveTo(state, {
			x: target[0] as number,
			y: target[1] as number,
			z: target[2] as number
		});
	}

	if (command === 'R') {
		const delta = args.map(parseInteger);
		if (delta.length !== 3 || delta.some((value) => value === null)) {
			return {
				state,
				responses: ['ERR invalid arguments for R'],
				note: 'Expected: R dx dy dz (for example R 100 -50 0).',
				moved: false
			};
		}
		return moveTo(state, {
			x: state.position.x + (delta[0] as number),
			y: state.position.y + (delta[1] as number),
			z: state.position.z + (delta[2] as number)
		});
	}

	if (command === 'J') {
		const axis = parseAxis(args[0]);
		if (!axis) {
			return {
				state,
				responses: [],
				note: 'Upstream firmware ignores an unknown J axis and emits no response.',
				moved: false
			};
		}
		const delta = parseInteger(args[1]);
		if (delta === null) {
			return {
				state,
				responses: ['ERR invalid arguments for J'],
				note: 'Expected: J axis delta (for example J X 100).',
				moved: false
			};
		}
		const target = { ...state.position, [axis]: state.position[axis] + delta };
		return moveTo(state, target);
	}

	if (['S', 'E', 'D', 'H', 'Z'].includes(command)) {
		return {
			state,
			responses: [`ERR not emulated: ${command}`],
			note: 'This MVP emulates the source-checked movement query subset: P, A, R, J, L.',
			moved: false
		};
	}

	return {
		state,
		responses: [`ERR unknown command: ${line}`],
		moved: false
	};
}
