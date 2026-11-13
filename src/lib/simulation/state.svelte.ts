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
	unlockAlignment
} from './engine';
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

	get protocolPosition(): ControllerPosition {
		return controllerFromStage(this.state.stage).position;
	}

	get layerNumber(): number {
		return this.state.layers.length + 1;
	}

	private apply(result: ActionResult, successNotice?: string): boolean {
		if (!result.ok) {
			this.notice = result.error;
			this.noticeKind = 'error';
			return false;
		}

		this.state = result.state;
		if (successNotice) {
			this.notice = successNotice;
			this.noticeKind = 'success';
		}
		return true;
	}

	chooseComponent(component: ComponentId | null): void {
		this.state = selectComponent(this.state, component);
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
			'Photoresist applied. The wafer is now ready for pattern alignment.'
		);
	}

	align(): void {
		this.apply(
			alignWafer(this.state),
			'Alignment confirmed and locked for this exposure. Expose when ready.'
		);
	}

	adjustAlignment(): void {
		this.apply(
			unlockAlignment(this.state),
			'Alignment unlocked. Adjust the stage or pattern, then confirm again.'
		);
	}

	expose(): void {
		this.apply(
			exposeWafer(this.state),
			'Exposure recorded. In positive resist, illuminated areas became more soluble.'
		);
	}

	develop(): void {
		this.apply(
			developWafer(this.state),
			'Development removed the exposed resist, leaving unexposed resist behind.'
		);
	}

	addLayer(): void {
		const nextNumber = this.state.layers.length + 1;
		this.apply(
			addLayerToStack(this.state),
			`Layer ${nextNumber} saved on the wafer. Layer ${nextNumber + 1} is ready for coating.`
		);
	}

	reset(): void {
		this.state = resetSimulation();
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
					entries.push({
						kind: 'note',
						text: '# Stage motion invalidated the confirmed alignment.'
					});
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
