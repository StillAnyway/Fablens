import type {
	ActionResult,
	Axis,
	ComponentId,
	PatternId,
	SimulatorState
} from '../types/simulation';
import {
	addLayer as addLayerToStack,
	alignWafer,
	coatWafer,
	createInitialState,
	developWafer,
	exposeWafer,
	moveStage,
	resetSimulation,
	selectComponent,
	selectPattern,
	setStageAxis,
	transferPattern as transferPatternAction
} from './engine';
import { readAlignment } from './alignment';
import { PHASE_ORDER, PROCESS_STEPS } from '../constants/experiment';
import {
	controllerFromStage,
	controllerToStage,
	executeCommand,
	type ControllerPosition
} from './controller';

export type NoticeKind = 'info' | 'error' | 'success';

export type LogEntry = {
	kind: 'system' | 'input' | 'output' | 'note';
	text: string;
};

function initialLog(): LogEntry[] {
	return [
		{ kind: 'system', text: 'Emulated controller. No hardware is connected.' },
		{ kind: 'output', text: 'READY' },
		{ kind: 'output', text: 'LIMITS 0 10000 0 10000 0 10000' }
	];
}

class SimulatorStore {
	state = $state<SimulatorState>(createInitialState());
	notice = $state('Start by coating the bare wafer with photoresist.');
	noticeKind = $state<NoticeKind>('info');
	controllerLog = $state<LogEntry[]>(initialLog());
	history = $state<SimulatorState[]>([]);

	constructor() {
		this.history = [this.state];
	}

	get protocolPosition(): ControllerPosition {
		return controllerFromStage(this.state.stage).position;
	}

	get layerNumber(): number {
		return this.state.layers.length + 1;
	}

	private syncHistory(state: SimulatorState): void {
		const index = PHASE_ORDER.indexOf(state.phase);
		const next = [...this.history];
		next[index] = state;
		this.history = next;
	}

	private apply(
		result: ActionResult,
		successNotice?: string,
		mode: 'advance' | 'sync' | 'reset' = 'sync'
	): boolean {
		if (!result.ok) {
			this.notice = result.error;
			this.noticeKind = 'error';
			return false;
		}

		this.state = result.state;

		if (mode === 'reset') {
			this.history = [result.state];
		} else if (mode === 'advance') {
			const index = PHASE_ORDER.indexOf(result.state.phase);
			this.history = [...this.history.slice(0, index), result.state];
		} else {
			this.syncHistory(result.state);
		}

		if (successNotice) {
			this.notice = successNotice;
			this.noticeKind = 'success';
		}
		return true;
	}

	goBackToStep(targetIndex: number): void {
		const currentIndex = PHASE_ORDER.indexOf(this.state.phase);
		if (targetIndex < 0 || targetIndex >= currentIndex || !this.history[targetIndex]) return;

		this.state = this.history[targetIndex];
		this.history = this.history.slice(0, targetIndex + 1);
		this.notice = `Returned to the ${PROCESS_STEPS[targetIndex]} step. Later steps were undone.`;
		this.noticeKind = 'info';
	}

	chooseComponent(component: ComponentId | null): void {
		this.apply({ ok: true, state: selectComponent(this.state, component) });
	}

	choosePattern(patternId: PatternId): void {
		this.apply(
			selectPattern(this.state, patternId),
			`Pattern set to ${patternId}. Move the stage if you want to explore misalignment.`
		);
	}

	setAxis(axis: Axis, value: number): void {
		this.apply(setStageAxis(this.state, axis, value));
	}

	nudgeStage(dx: number, dy: number): void {
		this.apply(
			moveStage(this.state, {
				x: this.state.stage.x + dx,
				y: this.state.stage.y + dy,
				z: this.state.stage.z
			})
		);
	}

	centerStage(): void {
		this.apply(
			moveStage(this.state, { x: 0, y: 0, z: this.state.stage.z }),
			'Stage returned to the centre of its virtual travel.'
		);
	}

	coat(): void {
		this.apply(
			coatWafer(this.state),
			'Photoresist applied. The wafer is now ready for pattern alignment.',
			'advance'
		);
	}

	align(): void {
		const reading = readAlignment(this.state);
		const message =
			reading.status === 'aligned'
				? 'Alignment locked. The pattern is aligned with the reference.'
				: `Alignment locked with a ${reading.label.toLowerCase()} overlay. Expose to see the effect, or click the completed Align step to change it.`;
		this.apply(alignWafer(this.state), message, 'advance');
	}

	expose(): void {
		this.apply(
			exposeWafer(this.state),
			'Exposure recorded. In positive resist, illuminated areas became more soluble.',
			'advance'
		);
	}

	develop(): void {
		this.apply(
			developWafer(this.state),
			'Development removed the exposed resist, leaving unexposed resist behind.',
			'advance'
		);
	}

	transferPattern(): void {
		this.apply(
			transferPatternAction(this.state),
			'Conceptual transfer complete. Real etch, deposition and resist strip are not simulated.',
			'advance'
		);
	}

	addLayer(): void {
		const nextNumber = this.state.layers.length + 1;
		this.apply(
			addLayerToStack(this.state),
			`Layer ${nextNumber} saved on the wafer. Layer ${nextNumber + 1} is ready for coating.`,
			'reset'
		);
	}

	reset(): void {
		this.state = resetSimulation();
		this.history = [this.state];
		this.notice = 'Experiment reset. A fresh bare wafer is mounted.';
		this.noticeKind = 'info';
	}

	runControllerCommand(rawLine: string): void {
		const line = rawLine.trim();
		if (!line) return;

		const controller = controllerFromStage(this.state.stage);
		const result = executeCommand(controller, line);
		const entries: LogEntry[] = [{ kind: 'input', text: `> ${line}` }];

		if (result.moved) {
			const wasAligned = this.state.phase === 'aligned';
			const moved = moveStage(this.state, controllerToStage(result.state));
			if (moved.ok) {
				this.state = moved.state;
				if (wasAligned && moved.state.phase === 'prepared') {
					const preparedIndex = PHASE_ORDER.indexOf('prepared');
					const next = this.history.slice(0, preparedIndex + 1);
					next[preparedIndex] = moved.state;
					this.history = next;
					entries.push({
						kind: 'note',
						text: '# Stage motion invalidated the confirmed alignment.'
					});
				} else {
					this.syncHistory(moved.state);
				}
			}
		}

		for (const response of result.responses) {
			entries.push({ kind: 'output', text: response });
		}
		if (result.note) {
			entries.push({ kind: 'note', text: `# ${result.note}` });
		}

		this.controllerLog = [...this.controllerLog, ...entries];
	}

	clearControllerLog(): void {
		this.controllerLog = initialLog();
	}
}

export const simulator = new SimulatorStore();
