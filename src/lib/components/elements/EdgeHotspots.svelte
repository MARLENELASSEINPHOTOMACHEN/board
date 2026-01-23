<script lang="ts">
	import type { AnchorPoint } from '$lib/types';
	import { connection, diagram } from '$lib/stores';
	import { screenToCanvasWithOffset } from '$lib/utils';
	import { getCanvasContainerRect } from '$lib/components/canvas';

	interface Props {
		elementId: string;
		visible?: boolean;
	}

	let { elementId, visible = false }: Props = $props();

	const anchors: AnchorPoint[] = ['top', 'right', 'bottom', 'left'];

	function getHotspotPosition(anchor: AnchorPoint): {
		top?: string;
		right?: string;
		bottom?: string;
		left?: string;
	} {
		switch (anchor) {
			case 'top':
				return { top: '-5px', left: '50%' };
			case 'right':
				return { top: '50%', right: '-5px' };
			case 'bottom':
				return { bottom: '-5px', left: '50%' };
			case 'left':
				return { top: '50%', left: '-5px' };
			default:
				return {};
		}
	}

	function getTransform(anchor: AnchorPoint): string {
		switch (anchor) {
			case 'top':
			case 'bottom':
				return 'translateX(-50%)';
			case 'left':
			case 'right':
				return 'translateY(-50%)';
			default:
				return '';
		}
	}

	function handleMouseDown(anchor: AnchorPoint, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();

		const containerRect = getCanvasContainerRect();
		if (!containerRect) return;

		const canvasPos = screenToCanvasWithOffset(
			{ x: event.clientX, y: event.clientY },
			containerRect,
			diagram.viewport
		);

		connection.start(elementId, anchor, canvasPos);
	}
</script>

{#if visible && !connection.isDragging}
	{#each anchors as anchor (anchor)}
		{@const pos = getHotspotPosition(anchor)}
		<button
			type="button"
			class="absolute z-10 h-[10px] w-[10px] cursor-crosshair rounded-full bg-stone-400 transition-transform hover:scale-125 hover:bg-stone-600"
			style:top={pos.top}
			style:right={pos.right}
			style:bottom={pos.bottom}
			style:left={pos.left}
			style:transform={getTransform(anchor)}
			onmousedown={(e) => handleMouseDown(anchor, e)}
			aria-label="Connect from {anchor}"
		></button>
	{/each}
{/if}
