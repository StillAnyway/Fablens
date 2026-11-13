import type { Phase } from '../types/simulation';

export const PHASE_ORDER: Phase[] = [
	'uncoated',
	'prepared',
	'aligned',
	'exposed',
	'developed',
	'transferred'
];

export type PhaseMeta = {
	label: string;
	stepLabel: string;
	short: string;
	description: string;
	action: string;
};

export const PHASE_META: Record<Phase, PhaseMeta> = {
	uncoated: {
		label: 'Uncoated',
		stepLabel: 'Uncoated',
		short: 'Needs photoresist',
		description:
			'The wafer needs a fresh, uniform coat of light-sensitive photoresist before the next pattern can be printed. In a real process this is usually spin coating followed by a soft bake.',
		action: 'Coat with resist'
	},
	prepared: {
		label: 'Prepared',
		stepLabel: 'Coated',
		short: 'Resist-coated wafer',
		description:
			'The wafer now carries a thin positive-resist layer. Choose a pattern, then move X/Y to explore alignment against the reference layer.',
		action: 'Confirm alignment'
	},
	aligned: {
		label: 'Locked',
		stepLabel: 'Locked',
		short: 'Exposure ready',
		description:
			'Stage and pattern are locked for this exposure. A misaligned exposure is allowed as a learning experiment.',
		action: 'Expose wafer'
	},
	exposed: {
		label: 'Exposed',
		stepLabel: 'Exposed',
		short: 'Resist made soluble',
		description:
			'The illuminated regions are now recorded on the wafer. For positive resist, those regions have become more soluble.',
		action: 'Develop resist'
	},
	developed: {
		label: 'Developed',
		stepLabel: 'Developed',
		short: 'Resist stencil ready',
		description:
			'The temporary resist stencil is ready. A real process must now transfer it into a permanent material before the next layer.',
		action: 'Transfer pattern (conceptual)'
	},
	transferred: {
		label: 'Transferred',
		stepLabel: 'Transfer',
		short: 'Conceptual material step',
		description:
			'Conceptual transfer only: etch, deposition and resist strip are not simulated. You can now add another layer or start over.',
		action: 'Add another layer'
	}
};
