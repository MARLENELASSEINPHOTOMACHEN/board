<script lang="ts">
	import type { Diagram } from '$lib/types';
	import { workspace, diagram as diagramStore } from '$lib/stores';

	interface Props {
		diagram: Diagram;
	}

	let { diagram }: Props = $props();

	let isEditing = $state(false);
	let editName = $state('');
	let inputRef: HTMLInputElement | undefined = $state();
	let isDragging = $state(false);

	const isActive = $derived(diagramStore.diagram?.id === diagram.id);

	function handleClick() {
		if (!isActive) {
			workspace.openDiagram(diagram.id);
		}
	}

	function startRename() {
		editName = diagram.name;
		isEditing = true;
	}

	function commitRename() {
		if (isEditing) {
			isEditing = false;
			if (editName && editName !== diagram.name) {
				workspace.updateDiagram(diagram.id, { name: editName });
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitRename();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			isEditing = false;
			editName = diagram.name;
		}
	}

	async function handleDelete() {
		if (confirm(`Move "${diagram.name}" to trash?`)) {
			await workspace.trashDiagram(diagram.id);
		}
	}

	function handleDragStart(event: DragEvent) {
		if (event.dataTransfer) {
			event.dataTransfer.setData('application/x-diagram-id', diagram.id);
			event.dataTransfer.setData('text/plain', diagram.name);
			event.dataTransfer.effectAllowed = 'move';
		}
		isDragging = true;
	}

	function handleDragEnd() {
		isDragging = false;
	}

	$effect(() => {
		if (isEditing && inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});
</script>

<div
	class="group flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 hover:bg-stone-100"
	class:bg-stone-200={isActive}
	class:opacity-50={isDragging}
	onclick={handleClick}
	ondblclick={startRename}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	draggable="true"
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
>
	<span class="text-sm text-stone-400">📄</span>

	{#if isEditing}
		<input
			bind:this={inputRef}
			type="text"
			bind:value={editName}
			onblur={commitRename}
			onkeydown={handleKeydown}
			class="flex-1 rounded border border-stone-300 bg-white px-1 py-0 text-sm outline-none focus:border-stone-500"
			onclick={(e) => e.stopPropagation()}
		/>
	{:else}
		<span class="flex-1 truncate text-sm text-stone-700">{diagram.name}</span>
	{/if}

	<button
		type="button"
		class="px-1 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
		onclick={(e) => {
			e.stopPropagation();
			handleDelete();
		}}
		title="Delete diagram"
	>
		×
	</button>
</div>
