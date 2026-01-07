<script lang="ts">
	import type { Snippet } from 'svelte';
	import Grid from './Grid.svelte';
	import { diagram } from '$lib/stores';
	import { selection } from '$lib/stores';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	let containerRef: HTMLDivElement | undefined = $state();
	let isPanning = $state(false);
	let lastPanPosition = $state({ x: 0, y: 0 });

	function handleWheel(event: WheelEvent) {
		event.preventDefault();

		if (event.ctrlKey || event.metaKey) {
			const factor = event.deltaY > 0 ? 0.9 : 1.1;
			diagram.zoom(factor, event.clientX, event.clientY);
		} else {
			diagram.pan(-event.deltaX, -event.deltaY);
		}
	}

	function handleMouseDown(event: MouseEvent) {
		if (event.target === containerRef || event.target === containerRef?.firstElementChild) {
			if (event.button === 0) {
				selection.clear();
			}

			if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
				isPanning = true;
				lastPanPosition = { x: event.clientX, y: event.clientY };
				event.preventDefault();
			}
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isPanning) {
			const dx = event.clientX - lastPanPosition.x;
			const dy = event.clientY - lastPanPosition.y;
			diagram.pan(dx, dy);
			lastPanPosition = { x: event.clientX, y: event.clientY };
		}
	}

	function handleMouseUp() {
		isPanning = false;
	}

	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
	}
</script>

<svelte:window onmouseup={handleMouseUp} onmousemove={handleMouseMove} />

<div
	bind:this={containerRef}
	class="relative w-full h-full overflow-hidden bg-stone-100"
	class:cursor-grabbing={isPanning}
	onwheel={handleWheel}
	onmousedown={handleMouseDown}
	oncontextmenu={handleContextMenu}
	role="application"
	aria-label="Diagram canvas"
>
	<Grid zoom={diagram.viewport.zoom} />

	<div
		class="absolute origin-top-left"
		style:transform="translate({diagram.viewport.x}px, {diagram.viewport.y}px) scale({diagram.viewport.zoom})"
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
