<script lang="ts">
	import type { NoteElement, Point } from '$lib/types';
	import { diagram, selection } from '$lib/stores';
	import { draggable } from '$lib/actions';
	import EdgeHotspots from './EdgeHotspots.svelte';

	interface Props {
		element: NoteElement;
	}

	let { element }: Props = $props();

	let isDragging = $state(false);
	let isEditing = $state(false);
	let editContent = $state('');
	let textareaRef: HTMLTextAreaElement | undefined = $state();
	let isHovered = $state(false);

	const isSelected = $derived(selection.isSelected(element.id));
	const showHotspots = $derived(isHovered || isSelected);

	function shouldIgnoreDrag(event: MouseEvent): boolean {
		const target = event.target as HTMLElement;
		return isEditing || target.tagName === 'BUTTON' || event.detail > 1;
	}

	function handleDragStart(event: MouseEvent) {
		if (event.shiftKey) {
			selection.toggle(element.id);
		} else if (!isSelected) {
			selection.select(element.id);
		}
		isDragging = true;
	}

	function getStartPositions(): Map<string, Point> {
		const positions = new Map<string, Point>();
		for (const id of selection.ids) {
			const el = diagram.elements.find((e) => e.id === id);
			if (el) {
				positions.set(id, { ...el.position });
			}
		}
		return positions;
	}

	function startEdit() {
		editContent = element.content;
		isEditing = true;
	}

	function commitEdit() {
		if (isEditing) {
			isEditing = false;
			if (editContent !== element.content) {
				diagram.updateElement(element.id, { content: editContent });
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			isEditing = false;
			editContent = element.content;
		}
	}

	$effect(() => {
		if (isEditing && textareaRef) {
			textareaRef.focus();
			textareaRef.select();
		}
	});
</script>

<div
	class="absolute min-h-[60px] min-w-[120px] rounded border-2 bg-yellow-100 shadow-md select-none"
	class:border-stone-800={isSelected}
	class:border-yellow-400={!isSelected}
	class:shadow-lg={isSelected}
	class:cursor-grabbing={isDragging}
	class:cursor-grab={!isDragging && !isEditing}
	style:left="{element.position.x}px"
	style:top="{element.position.y}px"
	use:draggable={{
		getViewport: () => diagram.viewport,
		shouldIgnore: shouldIgnoreDrag,
		onDragStart: handleDragStart,
		getStartPositions,
		onMove: (moves) => diagram.moveElements(moves),
		onEnd: (ids) => {
			diagram.commitMoves(ids);
			isDragging = false;
		}
	}}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	ondblclick={startEdit}
	role="button"
	tabindex="0"
	aria-label="Note"
	data-element-id={element.id}
>
	<EdgeHotspots elementId={element.id} visible={showHotspots} />
	{#if isEditing}
		<textarea
			bind:this={textareaRef}
			bind:value={editContent}
			onblur={commitEdit}
			onkeydown={handleKeydown}
			class="resize-both h-full min-h-[60px] w-full border-none bg-transparent p-2 font-mono text-sm outline-none"
			placeholder="Enter note..."
		></textarea>
	{:else}
		<div class="p-2 font-mono text-sm whitespace-pre-wrap">
			{element.content || 'Double-click to edit...'}
		</div>
	{/if}
</div>
