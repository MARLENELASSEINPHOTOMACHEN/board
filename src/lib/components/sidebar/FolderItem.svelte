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
		class="group flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 hover:bg-stone-100"
		class:bg-amber-100={isDragOver}
		class:ring-2={isDragOver}
		class:ring-amber-400={isDragOver}
	>
		<button
			type="button"
			class="flex h-4 w-4 items-center justify-center text-stone-400 hover:text-stone-600"
			onclick={(e) => {
				e.stopPropagation();
				onToggle();
			}}
		>
			{#if isExpanded}
				<svg class="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
			{:else}
				<svg class="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M4 2 L8 6 L4 10" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
			{/if}
		</button>

		<span class="text-sm text-stone-400">{isExpanded ? '📂' : '📁'}</span>

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
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				class="flex-1 truncate text-sm text-stone-700"
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
			class="px-1 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
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
