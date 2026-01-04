<script lang="ts">
	import type { NoteElement } from '$lib/types';
	import { diagram, selection } from '$lib/stores';

	interface Props {
		element: NoteElement;
	}

	let { element }: Props = $props();

	let isDragging = $state(false);
	let isEditing = $state(false);
	let dragOffset = $state({ x: 0, y: 0 });
	let editContent = $state('');
	let textareaRef: HTMLTextAreaElement | undefined = $state();

	const isSelected = $derived(selection.isSelected(element.id));

	function handleMouseDown(event: MouseEvent) {
		if (event.button !== 0) return;
		if (isEditing) return;

		event.stopPropagation();

		if (event.shiftKey) {
			selection.toggle(element.id);
		} else if (!isSelected) {
			selection.select(element.id);
		}

		isDragging = true;
		dragOffset = {
			x: event.clientX / diagram.viewport.zoom - element.position.x,
			y: event.clientY / diagram.viewport.zoom - element.position.y
		};
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;

		const x = event.clientX / diagram.viewport.zoom - dragOffset.x;
		const y = event.clientY / diagram.viewport.zoom - dragOffset.y;

		diagram.moveElement(element.id, x, y);
	}

	function handleMouseUp() {
		if (isDragging) {
			isDragging = false;
			diagram.commitMove(element.id);
		}
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

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div
	class="absolute bg-yellow-100 border-2 rounded shadow-md min-w-[120px] min-h-[60px] select-none"
	class:border-stone-800={isSelected}
	class:border-yellow-400={!isSelected}
	class:shadow-lg={isSelected}
	class:cursor-grabbing={isDragging}
	class:cursor-grab={!isDragging && !isEditing}
	style:left="{element.position.x}px"
	style:top="{element.position.y}px"
	onmousedown={handleMouseDown}
	ondblclick={startEdit}
	role="button"
	tabindex="0"
	aria-label="Note"
	data-element-id={element.id}
>
	{#if isEditing}
		<textarea
			bind:this={textareaRef}
			bind:value={editContent}
			onblur={commitEdit}
			onkeydown={handleKeydown}
			class="w-full h-full min-h-[60px] p-2 text-sm bg-transparent border-none outline-none resize-both font-mono"
			placeholder="Enter note..."
		></textarea>
	{:else}
		<div class="p-2 text-sm font-mono whitespace-pre-wrap">
			{element.content || 'Double-click to edit...'}
		</div>
	{/if}
</div>
