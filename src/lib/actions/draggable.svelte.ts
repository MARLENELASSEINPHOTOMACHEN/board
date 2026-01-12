import type { Action } from 'svelte/action';
import type { Point, Viewport } from '$lib/types';

interface DraggableParams {
	getViewport: () => Viewport;
	shouldIgnore?: (event: MouseEvent) => boolean;
	onDragStart?: (event: MouseEvent) => void;
	getStartPositions: () => Map<string, Point>;
	onMove: (moves: Array<{ id: string; x: number; y: number }>) => void;
	onEnd: (ids: string[]) => void;
}

export const draggable: Action<HTMLElement, DraggableParams> = (node, params) => {
	let startMouse: Point | null = null;
	let startPositions = new Map<string, Point>();
	let didMove = false;

	function screenToCanvas(clientX: number, clientY: number, viewport: Viewport): Point {
		return {
			x: (clientX - viewport.x) / viewport.zoom,
			y: (clientY - viewport.y) / viewport.zoom
		};
	}

	$effect(() => {
		const { getViewport, shouldIgnore, onDragStart, getStartPositions, onMove, onEnd } = params;

		function handleMouseDown(event: MouseEvent) {
			if (event.button !== 0) return;
			if (shouldIgnore?.(event)) return;

			event.stopPropagation();

			onDragStart?.(event);

			startPositions = getStartPositions();
			if (startPositions.size === 0) return;

			const vp = getViewport();
			startMouse = screenToCanvas(event.clientX, event.clientY, vp);
			didMove = false;

			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
		}

		function handleMouseMove(event: MouseEvent) {
			if (!startMouse) return;

			if (event.buttons === 0) {
				handleMouseUp();
				return;
			}

			const vp = getViewport();
			const current = screenToCanvas(event.clientX, event.clientY, vp);
			const deltaX = current.x - startMouse.x;
			const deltaY = current.y - startMouse.y;

			const moves: Array<{ id: string; x: number; y: number }> = [];
			for (const [id, startPos] of startPositions) {
				moves.push({
					id,
					x: startPos.x + deltaX,
					y: startPos.y + deltaY
				});
			}

			if (moves.length > 0) {
				didMove = true;
				onMove(moves);
			}
		}

		function handleMouseUp() {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);

			if (didMove && startPositions.size > 0) {
				onEnd([...startPositions.keys()]);
			}

			startMouse = null;
			startPositions = new Map();
		}

		node.addEventListener('mousedown', handleMouseDown);

		return () => {
			node.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	});
};
