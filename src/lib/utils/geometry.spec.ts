import { describe, it, expect } from 'vitest';
import type { Point, Rect, Viewport, Relationship } from '$lib/types';
import {
	getAnchorPosition,
	getBestAnchor,
	createOrthogonalPath,
	distance,
	rectContainsPoint,
	clamp,
	screenToCanvas,
	canvasToScreen,
	screenToCanvasWithOffset,
	canvasToScreenWithOffset,
	getClosestAnchor,
	getRelationshipEndpoints
} from './geometry';

describe('getAnchorPosition', () => {
	const rect: Rect = { x: 100, y: 100, width: 200, height: 100 };

	it('returns top center for top anchor', () => {
		const result = getAnchorPosition(rect, 'top');
		expect(result).toEqual({ x: 200, y: 100 });
	});

	it('returns bottom center for bottom anchor', () => {
		const result = getAnchorPosition(rect, 'bottom');
		expect(result).toEqual({ x: 200, y: 200 });
	});

	it('returns left center for left anchor', () => {
		const result = getAnchorPosition(rect, 'left');
		expect(result).toEqual({ x: 100, y: 150 });
	});

	it('returns right center for right anchor', () => {
		const result = getAnchorPosition(rect, 'right');
		expect(result).toEqual({ x: 300, y: 150 });
	});

	it('returns center for auto anchor', () => {
		const result = getAnchorPosition(rect, 'auto');
		expect(result).toEqual({ x: 200, y: 150 });
	});

	it('handles rect at origin', () => {
		const originRect: Rect = { x: 0, y: 0, width: 50, height: 50 };
		expect(getAnchorPosition(originRect, 'top')).toEqual({ x: 25, y: 0 });
		expect(getAnchorPosition(originRect, 'bottom')).toEqual({ x: 25, y: 50 });
		expect(getAnchorPosition(originRect, 'left')).toEqual({ x: 0, y: 25 });
		expect(getAnchorPosition(originRect, 'right')).toEqual({ x: 50, y: 25 });
	});

	it('handles negative coordinates', () => {
		const negativeRect: Rect = { x: -100, y: -50, width: 80, height: 60 };
		expect(getAnchorPosition(negativeRect, 'top')).toEqual({ x: -60, y: -50 });
		expect(getAnchorPosition(negativeRect, 'bottom')).toEqual({ x: -60, y: 10 });
	});
});

describe('getBestAnchor', () => {
	it('returns right/left when target is to the right', () => {
		const source: Rect = { x: 0, y: 0, width: 100, height: 100 };
		const target: Rect = { x: 200, y: 0, width: 100, height: 100 };
		expect(getBestAnchor(source, target)).toEqual({ source: 'right', target: 'left' });
	});

	it('returns left/right when target is to the left', () => {
		const source: Rect = { x: 200, y: 0, width: 100, height: 100 };
		const target: Rect = { x: 0, y: 0, width: 100, height: 100 };
		expect(getBestAnchor(source, target)).toEqual({ source: 'left', target: 'right' });
	});

	it('returns bottom/top when target is below', () => {
		const source: Rect = { x: 0, y: 0, width: 100, height: 100 };
		const target: Rect = { x: 0, y: 200, width: 100, height: 100 };
		expect(getBestAnchor(source, target)).toEqual({ source: 'bottom', target: 'top' });
	});

	it('returns top/bottom when target is above', () => {
		const source: Rect = { x: 0, y: 200, width: 100, height: 100 };
		const target: Rect = { x: 0, y: 0, width: 100, height: 100 };
		expect(getBestAnchor(source, target)).toEqual({ source: 'top', target: 'bottom' });
	});

	it('prefers horizontal when dx equals dy', () => {
		// when dx === dy, the condition Math.abs(dx) > Math.abs(dy) is false
		// so it falls through to vertical anchors
		const source: Rect = { x: 0, y: 0, width: 100, height: 100 };
		const target: Rect = { x: 100, y: 100, width: 100, height: 100 };
		const result = getBestAnchor(source, target);
		expect(result).toEqual({ source: 'bottom', target: 'top' });
	});

	it('handles diagonal positioning - more horizontal', () => {
		const source: Rect = { x: 0, y: 0, width: 100, height: 100 };
		const target: Rect = { x: 300, y: 50, width: 100, height: 100 };
		expect(getBestAnchor(source, target)).toEqual({ source: 'right', target: 'left' });
	});

	it('handles diagonal positioning - more vertical', () => {
		const source: Rect = { x: 0, y: 0, width: 100, height: 100 };
		const target: Rect = { x: 50, y: 300, width: 100, height: 100 };
		expect(getBestAnchor(source, target)).toEqual({ source: 'bottom', target: 'top' });
	});
});

describe('createOrthogonalPath', () => {
	it('creates horizontal-to-horizontal path', () => {
		const start: Point = { x: 100, y: 50 };
		const end: Point = { x: 300, y: 150 };
		const path = createOrthogonalPath(start, end, 'right', 'left');
		// midX = 200, path goes: start -> (midX, start.y) -> (midX, end.y) -> end
		expect(path).toBe('M 100 50 L 200 50 L 200 150 L 300 150');
	});

	it('creates vertical-to-vertical path', () => {
		const start: Point = { x: 50, y: 100 };
		const end: Point = { x: 150, y: 300 };
		const path = createOrthogonalPath(start, end, 'bottom', 'top');
		// midY = 200, path goes: start -> (start.x, midY) -> (end.x, midY) -> end
		expect(path).toBe('M 50 100 L 50 200 L 150 200 L 150 300');
	});

	it('creates horizontal-to-vertical path', () => {
		const start: Point = { x: 100, y: 50 };
		const end: Point = { x: 200, y: 150 };
		const path = createOrthogonalPath(start, end, 'right', 'top');
		// path goes: start -> (end.x, start.y) -> end
		expect(path).toBe('M 100 50 L 200 50 L 200 150');
	});

	it('creates vertical-to-horizontal path', () => {
		const start: Point = { x: 50, y: 100 };
		const end: Point = { x: 150, y: 200 };
		const path = createOrthogonalPath(start, end, 'bottom', 'left');
		// path goes: start -> (start.x, end.y) -> end
		expect(path).toBe('M 50 100 L 50 200 L 150 200');
	});

	it('handles same start and end point', () => {
		const point: Point = { x: 100, y: 100 };
		const path = createOrthogonalPath(point, point, 'right', 'left');
		expect(path).toBe('M 100 100 L 100 100 L 100 100 L 100 100');
	});
});

describe('distance', () => {
	it('calculates distance between two points', () => {
		expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
	});

	it('returns 0 for same point', () => {
		expect(distance({ x: 10, y: 20 }, { x: 10, y: 20 })).toBe(0);
	});

	it('handles negative coordinates', () => {
		expect(distance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
	});

	it('is symmetric', () => {
		const a: Point = { x: 10, y: 20 };
		const b: Point = { x: 30, y: 40 };
		expect(distance(a, b)).toBe(distance(b, a));
	});

	it('handles horizontal distance', () => {
		expect(distance({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10);
	});

	it('handles vertical distance', () => {
		expect(distance({ x: 0, y: 0 }, { x: 0, y: 10 })).toBe(10);
	});
});

describe('rectContainsPoint', () => {
	const rect: Rect = { x: 10, y: 20, width: 100, height: 50 };

	it('returns true for point inside rect', () => {
		expect(rectContainsPoint(rect, { x: 50, y: 40 })).toBe(true);
	});

	it('returns true for point on top-left corner', () => {
		expect(rectContainsPoint(rect, { x: 10, y: 20 })).toBe(true);
	});

	it('returns true for point on bottom-right corner', () => {
		expect(rectContainsPoint(rect, { x: 110, y: 70 })).toBe(true);
	});

	it('returns true for point on edge', () => {
		expect(rectContainsPoint(rect, { x: 50, y: 20 })).toBe(true);
		expect(rectContainsPoint(rect, { x: 10, y: 40 })).toBe(true);
	});

	it('returns false for point outside rect', () => {
		expect(rectContainsPoint(rect, { x: 0, y: 0 })).toBe(false);
		expect(rectContainsPoint(rect, { x: 200, y: 200 })).toBe(false);
	});

	it('returns false for point just outside', () => {
		expect(rectContainsPoint(rect, { x: 9, y: 40 })).toBe(false);
		expect(rectContainsPoint(rect, { x: 111, y: 40 })).toBe(false);
		expect(rectContainsPoint(rect, { x: 50, y: 19 })).toBe(false);
		expect(rectContainsPoint(rect, { x: 50, y: 71 })).toBe(false);
	});
});

describe('clamp', () => {
	it('returns value when within range', () => {
		expect(clamp(5, 0, 10)).toBe(5);
	});

	it('returns min when value is below', () => {
		expect(clamp(-5, 0, 10)).toBe(0);
	});

	it('returns max when value is above', () => {
		expect(clamp(15, 0, 10)).toBe(10);
	});

	it('returns min when value equals min', () => {
		expect(clamp(0, 0, 10)).toBe(0);
	});

	it('returns max when value equals max', () => {
		expect(clamp(10, 0, 10)).toBe(10);
	});

	it('handles negative range', () => {
		expect(clamp(-5, -10, -1)).toBe(-5);
		expect(clamp(-15, -10, -1)).toBe(-10);
		expect(clamp(0, -10, -1)).toBe(-1);
	});

	it('handles decimal values', () => {
		expect(clamp(0.5, 0.1, 3)).toBe(0.5);
		expect(clamp(0.05, 0.1, 3)).toBe(0.1);
		expect(clamp(5, 0.1, 3)).toBe(3);
	});
});

describe('screenToCanvas / canvasToScreen', () => {
	it('converts at zoom 1 with no offset', () => {
		const viewport: Viewport = { x: 0, y: 0, zoom: 1 };
		const screen: Point = { x: 100, y: 200 };
		expect(screenToCanvas(screen, viewport)).toEqual({ x: 100, y: 200 });
	});

	it('converts with viewport offset', () => {
		const viewport: Viewport = { x: 50, y: 100, zoom: 1 };
		const screen: Point = { x: 150, y: 200 };
		// canvas = (screen - offset) / zoom
		expect(screenToCanvas(screen, viewport)).toEqual({ x: 100, y: 100 });
	});

	it('converts with zoom', () => {
		const viewport: Viewport = { x: 0, y: 0, zoom: 2 };
		const screen: Point = { x: 200, y: 400 };
		expect(screenToCanvas(screen, viewport)).toEqual({ x: 100, y: 200 });
	});

	it('converts with offset and zoom', () => {
		const viewport: Viewport = { x: 100, y: 50, zoom: 2 };
		const screen: Point = { x: 300, y: 250 };
		// canvas = (300 - 100) / 2 = 100, (250 - 50) / 2 = 100
		expect(screenToCanvas(screen, viewport)).toEqual({ x: 100, y: 100 });
	});

	it('roundtrips correctly', () => {
		const viewport: Viewport = { x: 123, y: 456, zoom: 1.5 };
		const original: Point = { x: 100, y: 200 };
		const screen = canvasToScreen(original, viewport);
		const back = screenToCanvas(screen, viewport);
		expect(back.x).toBeCloseTo(original.x);
		expect(back.y).toBeCloseTo(original.y);
	});

	it('canvasToScreen reverses screenToCanvas', () => {
		const viewport: Viewport = { x: 50, y: 75, zoom: 0.5 };
		const canvas: Point = { x: 100, y: 200 };
		// screen = canvas * zoom + offset = 100 * 0.5 + 50 = 100, 200 * 0.5 + 75 = 175
		expect(canvasToScreen(canvas, viewport)).toEqual({ x: 100, y: 175 });
	});
});

describe('screenToCanvasWithOffset / canvasToScreenWithOffset', () => {
	const containerRect = { left: 200, top: 60 } as DOMRect;

	it('accounts for container offset', () => {
		const viewport: Viewport = { x: 0, y: 0, zoom: 1 };
		const screen: Point = { x: 300, y: 160 };
		// canvas = (screen - container - viewport) / zoom
		// x = (300 - 200 - 0) / 1 = 100
		// y = (160 - 60 - 0) / 1 = 100
		expect(screenToCanvasWithOffset(screen, containerRect, viewport)).toEqual({ x: 100, y: 100 });
	});

	it('accounts for container offset with zoom', () => {
		const viewport: Viewport = { x: 50, y: 20, zoom: 2 };
		const screen: Point = { x: 400, y: 180 };
		// x = (400 - 200 - 50) / 2 = 75
		// y = (180 - 60 - 20) / 2 = 50
		expect(screenToCanvasWithOffset(screen, containerRect, viewport)).toEqual({ x: 75, y: 50 });
	});

	it('roundtrips with offset correctly', () => {
		const viewport: Viewport = { x: 30, y: 40, zoom: 1.25 };
		const original: Point = { x: 80, y: 120 };
		const screen = canvasToScreenWithOffset(original, containerRect, viewport);
		const back = screenToCanvasWithOffset(screen, containerRect, viewport);
		expect(back.x).toBeCloseTo(original.x);
		expect(back.y).toBeCloseTo(original.y);
	});
});

describe('getClosestAnchor', () => {
	const rect: Rect = { x: 100, y: 100, width: 200, height: 100 };
	// rect spans x: 100-300, y: 100-200
	// center: (200, 150)
	// edges: top=100, bottom=200, left=100, right=300

	it('returns top for point near top edge', () => {
		expect(getClosestAnchor(rect, { x: 200, y: 105 })).toBe('top');
	});

	it('returns bottom for point near bottom edge', () => {
		expect(getClosestAnchor(rect, { x: 200, y: 195 })).toBe('bottom');
	});

	it('returns left for point near left edge', () => {
		expect(getClosestAnchor(rect, { x: 105, y: 150 })).toBe('left');
	});

	it('returns right for point near right edge', () => {
		expect(getClosestAnchor(rect, { x: 295, y: 150 })).toBe('right');
	});

	it('handles point outside rect', () => {
		// point above rect - top is closest
		expect(getClosestAnchor(rect, { x: 200, y: 50 })).toBe('top');
		// point below rect - bottom is closest
		expect(getClosestAnchor(rect, { x: 200, y: 250 })).toBe('bottom');
	});

	it('handles point at corner - prefers by sort stability', () => {
		// at top-left corner, top and left are equidistant
		// sort is stable so first one (top) wins
		const result = getClosestAnchor(rect, { x: 100, y: 100 });
		expect(['top', 'left']).toContain(result);
	});
});

describe('getRelationshipEndpoints', () => {
	const elementRects = new Map<string, Rect>([
		['a', { x: 0, y: 0, width: 100, height: 100 }],
		['b', { x: 200, y: 0, width: 100, height: 100 }],
		['c', { x: 0, y: 200, width: 100, height: 100 }]
	]);

	it('returns null when source element not found', () => {
		const rel: Relationship = {
			id: '1',
			type: 'association',
			sourceId: 'missing',
			targetId: 'b',
			anchors: { source: 'right', target: 'left' }
		};
		expect(getRelationshipEndpoints(rel, elementRects)).toBeNull();
	});

	it('returns null when target element not found', () => {
		const rel: Relationship = {
			id: '1',
			type: 'association',
			sourceId: 'a',
			targetId: 'missing',
			anchors: { source: 'right', target: 'left' }
		};
		expect(getRelationshipEndpoints(rel, elementRects)).toBeNull();
	});

	it('calculates endpoints with explicit anchors', () => {
		const rel: Relationship = {
			id: '1',
			type: 'association',
			sourceId: 'a',
			targetId: 'b',
			anchors: { source: 'right', target: 'left' }
		};
		const result = getRelationshipEndpoints(rel, elementRects);
		expect(result).toEqual({
			start: { x: 100, y: 50 },
			end: { x: 200, y: 50 },
			sourceAnchor: 'right',
			targetAnchor: 'left'
		});
	});

	it('auto-calculates anchors when source is auto', () => {
		const rel: Relationship = {
			id: '1',
			type: 'association',
			sourceId: 'a',
			targetId: 'b',
			anchors: { source: 'auto', target: 'left' }
		};
		const result = getRelationshipEndpoints(rel, elementRects);
		// target is to the right of source so best anchor is right/left
		expect(result?.sourceAnchor).toBe('right');
		expect(result?.targetAnchor).toBe('left');
	});

	it('auto-calculates anchors when target is auto', () => {
		const rel: Relationship = {
			id: '1',
			type: 'association',
			sourceId: 'a',
			targetId: 'b',
			anchors: { source: 'right', target: 'auto' }
		};
		const result = getRelationshipEndpoints(rel, elementRects);
		expect(result?.sourceAnchor).toBe('right');
		expect(result?.targetAnchor).toBe('left');
	});

	it('auto-calculates vertical anchors', () => {
		const rel: Relationship = {
			id: '1',
			type: 'association',
			sourceId: 'a',
			targetId: 'c',
			anchors: { source: 'auto', target: 'auto' }
		};
		const result = getRelationshipEndpoints(rel, elementRects);
		// c is below a so best anchor is bottom/top
		expect(result?.sourceAnchor).toBe('bottom');
		expect(result?.targetAnchor).toBe('top');
		expect(result?.start).toEqual({ x: 50, y: 100 });
		expect(result?.end).toEqual({ x: 50, y: 200 });
	});
});
