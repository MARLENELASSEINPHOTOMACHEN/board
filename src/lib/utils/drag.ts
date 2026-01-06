import type { Point } from '$lib/types';
import { diagram, selection } from '$lib/stores';

export interface DragState {
	isDragging: boolean;
	startPositions: Map<string, Point>;
	startMouse: Point;
}

export interface DragMoves {
	moves: Array<{ id: string; x: number; y: number }>;
}

export function createDragState(): DragState {
	return {
		isDragging: false,
		startPositions: new Map(),
		startMouse: { x: 0, y: 0 }
	};
}

export function startDrag(event: MouseEvent): DragState {
	const startMouse = {
		x: event.clientX / diagram.viewport.zoom,
		y: event.clientY / diagram.viewport.zoom
	};

	const positions = new Map<string, Point>();
	const selectedIds = [...selection.ids].filter((id) => diagram.elements.some((el) => el.id === id));

	for (const id of selectedIds) {
		const el = diagram.elements.find((e) => e.id === id);
		if (el) {
			positions.set(id, { ...el.position });
		}
	}

	return {
		isDragging: true,
		startPositions: positions,
		startMouse
	};
}

export function getDragMoves(state: DragState, event: MouseEvent): DragMoves {
	if (!state.isDragging) return { moves: [] };

	const currentMouse = {
		x: event.clientX / diagram.viewport.zoom,
		y: event.clientY / diagram.viewport.zoom
	};

	const deltaX = currentMouse.x - state.startMouse.x;
	const deltaY = currentMouse.y - state.startMouse.y;

	const moves: Array<{ id: string; x: number; y: number }> = [];
	for (const [id, startPos] of state.startPositions) {
		moves.push({
			id,
			x: startPos.x + deltaX,
			y: startPos.y + deltaY
		});
	}

	return { moves };
}

export function endDrag(state: DragState): { newState: DragState; elementIds: string[] } {
	const elementIds = state.isDragging ? [...state.startPositions.keys()] : [];
	return {
		newState: createDragState(),
		elementIds
	};
}
