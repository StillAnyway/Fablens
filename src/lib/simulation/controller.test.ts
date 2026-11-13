import { describe, expect, it } from 'vitest';
import {
	PROTOCOL_CENTER,
	controllerFromStage,
	controllerToStage,
	createControllerState,
	executeCommand,
	stepsToVirtual,
	virtualToSteps
} from './controller';

describe('emulated stage controller', () => {
	it('reports the starting position', () => {
		const result = executeCommand(createControllerState(), 'P');
		expect(result.responses).toEqual(['POS 5000 5000 5000']);
	});

	it('reports the configured limits', () => {
		const result = executeCommand(createControllerState(), 'L');
		expect(result.responses).toEqual(['LIMITS 0 10000 0 10000 0 10000']);
	});

	it('performs an absolute move and reports POS before DONE', () => {
		const result = executeCommand(createControllerState(), 'A 1000 500 0');
		expect(result.responses).toEqual(['POS 1000 500 0', 'DONE']);
		expect(result.state.position).toEqual({ x: 1000, y: 500, z: 0 });
	});

	it('performs a relative move', () => {
		const start = { position: { x: 1000, y: 1000, z: 0 } };
		const result = executeCommand(start, 'R 100 -50 25');
		expect(result.responses).toEqual(['POS 1100 950 25', 'DONE']);
	});

	it('jogs one axis and accepts lower-case axis names', () => {
		const start = { position: { x: 500, y: 500, z: 500 } };
		const result = executeCommand(start, 'J x 100');
		expect(result.responses).toEqual(['POS 600 500 500', 'DONE']);
	});

	it('mirrors the firmware silence for an unknown jog axis', () => {
		const result = executeCommand(createControllerState(), 'J Q 100');
		expect(result.responses).toEqual([]);
		expect(result.state.position).toEqual({ x: 5000, y: 5000, z: 5000 });
		expect(result.note).toContain('emits no response');
	});

	it('clamps movement to the emulated travel limits', () => {
		const result = executeCommand(createControllerState(), 'A 20000 -50 9999');
		expect(result.state.position).toEqual({ x: 10000, y: 0, z: 9999 });
		expect(result.note).toContain('clamped');
	});

	it('reports unknown commands like the documented firmware', () => {
		const result = executeCommand(createControllerState(), 'X 1 2 3');
		expect(result.responses).toEqual(['ERR unknown command: X 1 2 3']);
	});

	it('labels unsupported firmware commands as not emulated', () => {
		const result = executeCommand(createControllerState(), 'S 800');
		expect(result.responses[0]).toContain('not emulated');
		expect(result.note).toContain('P, A, R, J, L');
	});

	it('rejects malformed movement commands', () => {
		const result = executeCommand(createControllerState(), 'A 10 20');
		expect(result.responses).toEqual(['ERR invalid arguments for A']);
	});

	it('maps protocol steps to virtual stage units without silently claiming millimetres', () => {
		expect(stepsToVirtual(PROTOCOL_CENTER)).toBe(0);
		expect(stepsToVirtual(0)).toBe(-50);
		expect(stepsToVirtual(10000)).toBe(50);
		expect(virtualToSteps(0)).toBe(5000);
		expect(virtualToSteps(25)).toBe(7500);

		const stage = { x: 10, y: -5, z: 0 };
		expect(controllerToStage(controllerFromStage(stage))).toEqual(stage);
	});
});
