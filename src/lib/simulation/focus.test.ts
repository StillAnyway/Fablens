import { describe, expect, it } from 'vitest';
import { FOCUS_TOLERANCE, MAX_DISPLAY_BLUR_PX, readFocus } from './focus';

describe('qualitative focus model', () => {
	it('treats the tolerance band as in focus with no blur', () => {
		expect(readFocus(0).status).toBe('focused');
		expect(readFocus(FOCUS_TOLERANCE).blurPx).toBe(0);
		expect(readFocus(-FOCUS_TOLERANCE).status).toBe('focused');
	});

	it('increases blur as Z moves away from focus', () => {
		const soft = readFocus(16);
		const blurred = readFocus(40);
		expect(soft.status).toBe('soft');
		expect(blurred.status).toBe('blurred');
		expect(blurred.blurPx).toBeGreaterThan(soft.blurPx);
	});

	it('caps the illustrative blur', () => {
		expect(readFocus(50).blurPx).toBe(MAX_DISPLAY_BLUR_PX);
		expect(readFocus(-50).blurPx).toBe(MAX_DISPLAY_BLUR_PX);
	});
});
