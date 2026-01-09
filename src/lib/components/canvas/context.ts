// module-level store for canvas container rect
// used by components that need coordinate conversion but may render outside Canvas

let containerRef: HTMLDivElement | null = null;

export function setCanvasContainer(el: HTMLDivElement | null): void {
	containerRef = el;
}

export function getCanvasContainerRect(): DOMRect | null {
	return containerRef?.getBoundingClientRect() ?? null;
}
