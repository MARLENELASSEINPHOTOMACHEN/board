<script lang="ts">
	import type { Folder, Diagram } from '$lib/types';
	import { workspace } from '$lib/stores';
	import DiagramItem from './DiagramItem.svelte';

	interface Props {
		folder: Folder;
		diagrams: Diagram[];
		isExpanded: boolean;
		onToggle: () => void;
		onDrop: (diagramId: string) => void;
	}

	let { folder, diagrams, isExpanded, onToggle, onDrop }: Props = $props();

	let isEditing = $state(false);
	let editName = $state('');
	let inputRef: HTMLInputElement | undefined = $state();
	let isDragOver = $state(false);

	function startRename() {
		editName = folder.name;
		isEditing = true;
	}

	function commitRename() {
		if (isEditing) {
			isEditing = false;
			if (editName && editName !== folder.name) {
				workspace.updateFolder(folder.id, { name: editName });
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
			editName = folder.name;
		}
	}

	async function handleDelete() {
		const diagramCount = diagrams.length;
		const message =
			diagramCount > 0
				? `Move "${folder.name}" and ${diagramCount} diagram${diagramCount > 1 ? 's' : ''} to trash?`
				: `Move "${folder.name}" to trash?`;

		if (confirm(message)) {
			await workspace.trashFolder(folder.id);
		}
	}

	function handleDragOver(event: DragEvent) {
		const types = event.dataTransfer?.types ?? [];
		if (types.includes('application/x-diagram-id')) {
			event.preventDefault();
			event.stopPropagation();
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'move';
			}
			isDragOver = true;
		}
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragOver = false;
		const diagramId = event.dataTransfer?.getData('application/x-diagram-id');
		if (diagramId) {
			onDrop(diagramId);
		}
	}

	$effect(() => {
		if (isEditing && inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});
</script>

<!-- svelte-ignore a11y_interactive_supports_focus a11y_role_has_required_aria_props -->
<div
	class="folder"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="treeitem"
	aria-expanded={isExpanded}
>
	<div
		class="group flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-stone-100 rounded"
		class:bg-amber-100={isDragOver}
		class:ring-2={isDragOver}
		class:ring-amber-400={isDragOver}
	>
		<button
			type="button"
			class="w-4 h-4 flex items-center justify-center text-stone-400 hover:text-stone-600"
			onclick={(e) => {
				e.stopPropagation();
				onToggle();
			}}
		>
			{#if isExpanded}
				<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
			{:else}
				<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M4 2 L8 6 L4 10" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
			{/if}
		</button>

		<span class="text-stone-400 text-sm">{isExpanded ? '📂' : '📁'}</span>

		{#if isEditing}
			<input
				bind:this={inputRef}
				type="text"
				bind:value={editName}
				onblur={commitRename}
				onkeydown={handleKeydown}
				class="flex-1 bg-white border border-stone-300 px-1 py-0 text-sm outline-none focus:border-stone-500 rounded"
				onclick={(e) => e.stopPropagation()}
			/>
		{:else}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				class="flex-1 text-sm text-stone-700 truncate"
				ondblclick={(e) => {
					e.stopPropagation();
					startRename();
				}}
			>
				{folder.name}
			</span>
		{/if}

		<button
			type="button"
			class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 px-1"
			onclick={(e) => {
				e.stopPropagation();
				handleDelete();
			}}
			title="Move to trash"
		>
			×
		</button>
	</div>

	{#if isExpanded}
		<div class="pl-4">
			{#each diagrams as diagram (diagram.id)}
				<DiagramItem {diagram} />
			{/each}
			{#if diagrams.length === 0}
				<div class="px-3 py-1 text-xs text-stone-400 italic">Empty folder</div>
			{/if}
		</div>
	{/if}
</div>
