// canvas container query - centralized to single location
// if the selector ever changes, only this file needs updating

const CANVAS_SELECTOR = '[role="application"]';

export function getCanvasContainerRect(): DOMRect | null {
	const container = document.querySelector(CANVAS_SELECTOR);
	return container?.getBoundingClientRect() ?? null;
}
