/** Virtual Z units within which the teaching model treats the image as focused. */
export const FOCUS_TOLERANCE = 5;

/** Virtual Z units beyond which the illustration reaches maximum blur. */
export const FOCUS_BLUR_RANGE = 45;

export const MAX_DISPLAY_BLUR_PX = 6;

export type FocusStatus = 'focused' | 'soft' | 'blurred';

export type FocusReading = {
	status: FocusStatus;
	label: string;
	blurPx: number;
	distance: number;
};

/**
 * Qualitative focus model for teaching only. It does not represent a real
 * depth of field, numerical aperture or optical simulation.
 */
export function readFocus(z: number): FocusReading {
	const distance = Math.abs(z);
	const blurPx = Math.min(
		MAX_DISPLAY_BLUR_PX,
		(Math.max(0, distance - FOCUS_TOLERANCE) / (FOCUS_BLUR_RANGE - FOCUS_TOLERANCE)) *
			MAX_DISPLAY_BLUR_PX
	);

	if (distance <= FOCUS_TOLERANCE) {
		return { status: 'focused', label: 'In focus', blurPx, distance };
	}

	if (distance <= 22) {
		return { status: 'soft', label: 'Slightly defocused', blurPx, distance };
	}

	return { status: 'blurred', label: 'Strongly defocused', blurPx, distance };
}
