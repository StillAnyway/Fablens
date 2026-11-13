import type { Phase } from '../types/simulation';

export const PHASE_ORDER: Phase[] = ['uncoated', 'prepared', 'aligned', 'exposed', 'developed'];

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
		label: 'Aligned',
		stepLabel: 'Aligned',
		short: 'Ready to expose',
		description:
			'Alignment is confirmed for this step. You can still reposition the stage or change the pattern before exposing.',
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
		short: 'Pattern in resist',
		description:
			'This layer is complete. Its pattern is now part of the wafer stack. Add another layer to build wires, contacts and devices on top, or start over with a fresh wafer.',
		action: 'Add another layer'
	}
};
