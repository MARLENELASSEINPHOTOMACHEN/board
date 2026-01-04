import type { Point, Rect, Size } from '$lib/types';
import type { AnchorPoint } from '$lib/types';

export function getAnchorPosition(rect: Rect, anchor: AnchorPoint): Point {
	switch (anchor) {
		case 'top':
			return { x: rect.x + rect.width / 2, y: rect.y };
		case 'bottom':
			return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
		case 'left':
			return { x: rect.x, y: rect.y + rect.height / 2 };
		case 'right':
			return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
		case 'auto':
			return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
	}
}

export function getBestAnchor(sourceRect: Rect, targetRect: Rect): { source: AnchorPoint; target: AnchorPoint } {
	const sourceCenter = {
		x: sourceRect.x + sourceRect.width / 2,
		y: sourceRect.y + sourceRect.height / 2
	};
	const targetCenter = {
		x: targetRect.x + targetRect.width / 2,
		y: targetRect.y + targetRect.height / 2
	};

	const dx = targetCenter.x - sourceCenter.x;
	const dy = targetCenter.y - sourceCenter.y;

	if (Math.abs(dx) > Math.abs(dy)) {
		return dx > 0
			? { source: 'right', target: 'left' }
			: { source: 'left', target: 'right' };
	} else {
		return dy > 0
			? { source: 'bottom', target: 'top' }
			: { source: 'top', target: 'bottom' };
	}
}

export function createOrthogonalPath(start: Point, end: Point, sourceAnchor: AnchorPoint, targetAnchor: AnchorPoint): string {
	const midX = (start.x + end.x) / 2;
	const midY = (start.y + end.y) / 2;

	const isHorizontalSource = sourceAnchor === 'left' || sourceAnchor === 'right';
	const isHorizontalTarget = targetAnchor === 'left' || targetAnchor === 'right';

	if (isHorizontalSource && isHorizontalTarget) {
		return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
	} else if (!isHorizontalSource && !isHorizontalTarget) {
		return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
	} else if (isHorizontalSource) {
		return `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
	} else {
		return `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
	}
}

export function distance(a: Point, b: Point): number {
	return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function rectContainsPoint(rect: Rect, point: Point): boolean {
	return (
		point.x >= rect.x &&
		point.x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect.height
	);
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function screenToCanvas(screenPoint: Point, viewport: { x: number; y: number; zoom: number }): Point {
	return {
		x: (screenPoint.x - viewport.x) / viewport.zoom,
		y: (screenPoint.y - viewport.y) / viewport.zoom
	};
}

export function canvasToScreen(canvasPoint: Point, viewport: { x: number; y: number; zoom: number }): Point {
	return {
		x: canvasPoint.x * viewport.zoom + viewport.x,
		y: canvasPoint.y * viewport.zoom + viewport.y
	};
}
