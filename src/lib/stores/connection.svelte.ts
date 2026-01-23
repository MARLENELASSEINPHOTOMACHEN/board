import type { AnchorPoint, Point } from '$lib/types';

export interface ConnectionDrag {
	sourceElementId: string;
	sourceAnchor: AnchorPoint;
	startPosition: Point;
}

export interface AnchorAdjustment {
	relationshipId: string;
	end: 'source' | 'target';
	fixedPosition: Point;
	startPosition: Point;
}

type ConnectionState =
	| { type: 'idle' }
	| { type: 'dragging'; drag: ConnectionDrag }
	| { type: 'adjusting'; adjustment: AnchorAdjustment };

let state = $state<ConnectionState>({ type: 'idle' });

export const connection = {
	get isDragging(): boolean {
		return state.type === 'dragging';
	},

	get drag(): ConnectionDrag | null {
		return state.type === 'dragging' ? state.drag : null;
	},

	get isAdjusting(): boolean {
		return state.type === 'adjusting';
	},

	get adjustment(): AnchorAdjustment | null {
		return state.type === 'adjusting' ? state.adjustment : null;
	},

	start(sourceElementId: string, sourceAnchor: AnchorPoint, position: Point) {
		state = {
			type: 'dragging',
			drag: {
				sourceElementId,
				sourceAnchor,
				startPosition: position
			}
		};
	},

	startAdjustment(
		relationshipId: string,
		end: 'source' | 'target',
		fixedPosition: Point,
		startPosition: Point
	) {
		state = {
			type: 'adjusting',
			adjustment: {
				relationshipId,
				end,
				fixedPosition,
				startPosition
			}
		};
	},

	cancel() {
		state = { type: 'idle' };
	}
};
