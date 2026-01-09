<script lang="ts">
	import type { Rect, Point, AnchorPoint } from '$lib/types';
	import { connection, diagram } from '$lib/stores';
	import {
		rectContainsPoint,
		getClosestAnchor,
		getAnchorPosition,
		screenToCanvasWithOffset,
		canvasToScreenWithOffset
	} from '$lib/utils';
	import { getCanvasContainerRect } from './context';

	interface Props {
		elementRects: Map<string, Rect>;
		oncomplete?: (relationshipId: string, end: 'source' | 'target', targetElementId: string, targetAnchor: AnchorPoint) => void;
	}

	let { elementRects, oncomplete }: Props = $props();

	let cursorScreenPosition = $state<Point>({ x: 0, y: 0 });
	let hoverTarget = $state<{ elementId: string; anchor: AnchorPoint; anchorPosition: Point } | null>(null);

	const fixedScreenPosition = $derived.by(() => {
		const adj = connection.adjustment;
		if (!adj) return null;
		const containerRect = getCanvasContainerRect();
		if (!containerRect) return null;
		return canvasToScreenWithOffset(adj.fixedPosition, containerRect, diagram.viewport);
	});

	const startScreenPosition = $derived.by(() => {
		const adj = connection.adjustment;
		if (!adj) return null;
		const containerRect = getCanvasContainerRect();
		if (!containerRect) return null;
		return canvasToScreenWithOffset(adj.startPosition, containerRect, diagram.viewport);
	});

	$effect(() => {
		if (startScreenPosition) {
			cursorScreenPosition = { ...startScreenPosition };
		}
	});

	function findTargetElement(canvasPoint: Point, containerRect: DOMRect): { elementId: string; anchor: AnchorPoint; anchorPosition: Point } | null {
		const adj = connection.adjustment;
		if (!adj) return null;

		for (const [elementId, rect] of elementRects) {
			if (rectContainsPoint(rect, canvasPoint)) {
				const anchor = getClosestAnchor(rect, canvasPoint);
				const anchorCanvasPos = getAnchorPosition(rect, anchor);
				const anchorScreenPos = canvasToScreenWithOffset(anchorCanvasPos, containerRect, diagram.viewport);
				return { elementId, anchor, anchorPosition: anchorScreenPos };
			}
		}
		return null;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!connection.isAdjusting) return;
		cursorScreenPosition = { x: event.clientX, y: event.clientY };

		const containerRect = getCanvasContainerRect();
		if (!containerRect) {
			hoverTarget = null;
			return;
		}

		const canvasPoint = screenToCanvasWithOffset(cursorScreenPosition, containerRect, diagram.viewport);
		hoverTarget = findTargetElement(canvasPoint, containerRect);
	}

	function handleMouseUp(event: MouseEvent) {
		const adj = connection.adjustment;
		if (!adj) return;

		const containerRect = getCanvasContainerRect();
		if (!containerRect) return;

		const canvasPoint = screenToCanvasWithOffset({ x: event.clientX, y: event.clientY }, containerRect, diagram.viewport);
		const target = findTargetElement(canvasPoint, containerRect);

		const { relationshipId, end } = adj;
		connection.cancel();
		hoverTarget = null;

		if (target && oncomplete) {
			oncomplete(relationshipId, end, target.elementId, target.anchor);
		}
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

{#if connection.isAdjusting && fixedScreenPosition}
	{@const endPoint = hoverTarget?.anchorPosition ?? cursorScreenPosition}
	{@const pathD = `M ${fixedScreenPosition.x} ${fixedScreenPosition.y} L ${endPoint.x} ${endPoint.y}`}
	<svg class="fixed inset-0 w-full h-full pointer-events-none z-40">
		<path
			d={pathD}
			fill="none"
			stroke="#78716c"
			stroke-width="2"
			stroke-dasharray="6 4"
		/>
		<circle
			cx={fixedScreenPosition.x}
			cy={fixedScreenPosition.y}
			r="4"
			fill="#78716c"
		/>
		{#if hoverTarget}
			<circle
				cx={hoverTarget.anchorPosition.x}
				cy={hoverTarget.anchorPosition.y}
				r="6"
				fill="#78716c"
			/>
		{:else}
			<circle
				cx={cursorScreenPosition.x}
				cy={cursorScreenPosition.y}
				r="4"
				fill="#78716c"
			/>
		{/if}
	</svg>
{/if}
