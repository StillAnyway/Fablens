import type { ComponentId } from '../types/simulation';

export type Grounding = 'documented' | 'illustrative';

export type MachineComponent = {
	id: ComponentId;
	name: string;
	category: string;
	grounding: Grounding;
	summary: string;
	detail: string;
};

export const COMPONENT_ORDER: ComponentId[] = [
	'projector',
	'optics',
	'camera',
	'stage',
	'sample-holder',
	'wafer',
	'controller'
];

export const MACHINE_COMPONENTS: Record<ComponentId, MachineComponent> = {
	projector: {
		id: 'projector',
		name: 'Pattern projector',
		category: 'Exposure source',
		grounding: 'illustrative',
		summary:
			'Maskless lithography builds the exposure pattern digitally instead of using a physical mask for every design.',
		detail:
			'A digital pattern generator, such as a DLP/DMD or scanned light source, decides which regions receive light. The box and shape here are a teaching model; the exact IITB projector has not been verified.'
	},
	optics: {
		id: 'optics',
		name: 'Optics and objective',
		category: 'Light path',
		grounding: 'illustrative',
		summary: 'The optical path images the digital pattern onto the photoresist-coated wafer.',
		detail:
			'Lenses or an objective shape and focus the light. This simulator does not model diffraction, aberrations or a calibrated focal length; the optical geometry is illustrative only.'
	},
	camera: {
		id: 'camera',
		name: 'Imaging camera',
		category: 'Alignment aid',
		grounding: 'illustrative',
		summary: 'A camera can help an operator see the wafer and judge alignment before exposure.',
		detail:
			'Many lithography tools include an imaging path, but the camera position and behaviour on the IITB machine were not verified for this prototype. Treat this component as a conceptual alignment aid.'
	},
	stage: {
		id: 'stage',
		name: 'XYZ motion stage',
		category: 'Positioning',
		grounding: 'documented',
		summary:
			'The stage moves the sample in X, Y and Z. Small position errors become pattern-alignment errors.',
		detail:
			'The IITB litho-ui project documents a three-axis stepper stage controlled over USB serial at 115200 baud. Its coordinates are motor steps, not millimetres, and its published software limits (0–10000 steps) are not verified travel distances. This simulator uses separate virtual units.'
	},
	'sample-holder': {
		id: 'sample-holder',
		name: 'Sample holder',
		category: 'Mechanical',
		grounding: 'illustrative',
		summary:
			'The holder keeps the wafer flat and repeatable while the stage moves beneath the optics.',
		detail:
			'Repeatable mounting matters because the process depends on the wafer staying in a known position. The holder geometry shown here is stylised, not a CAD model of the IITB machine.'
	},
	wafer: {
		id: 'wafer',
		name: 'Wafer and photoresist',
		category: 'Process',
		grounding: 'documented',
		summary:
			'The wafer is coated with a light-sensitive polymer. Exposed positive resist becomes more soluble.',
		detail:
			'Before exposure, the guided experiment includes a teaching step for applying positive photoresist. A real process usually uses spin coating and a soft bake; those details are not modelled here. After development, exposed resist is removed and unexposed resist remains as a temporary stencil. Exposing alone does not create a working device; later etch, deposition or lift-off steps use the pattern.'
	},
	controller: {
		id: 'controller',
		name: 'Stage controller',
		category: 'Electronics',
		grounding: 'documented',
		summary:
			'An Arduino-class controller drives the stepper motors through a serial command protocol.',
		detail:
			'litho-ui documents newline-terminated ASCII commands such as A, R, J, P and L, with responses such as POS, LIMITS, DONE and ERR. This prototype emulates only a small, source-informed subset and never connects to real hardware.'
	}
};
