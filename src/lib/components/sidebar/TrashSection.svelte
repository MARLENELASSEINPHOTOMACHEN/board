<script lang="ts">
	import type { Diagram, Folder } from '$lib/types';
	import { workspace } from '$lib/stores';

	interface Props {
		trashedDiagrams: Diagram[];
		trashedFolders: Folder[];
		isExpanded: boolean;
		onToggle: () => void;
	}

	let { trashedDiagrams, trashedFolders, isExpanded, onToggle }: Props = $props();

	const itemCount = $derived(trashedDiagrams.length + trashedFolders.length);

	async function restoreDiagram(diagramId: string) {
		await workspace.restoreDiagram(diagramId);
	}

	async function restoreFolder(folderId: string) {
		await workspace.restoreFolder(folderId);
	}

	async function permanentlyDeleteDiagram(diagramId: string, name: string) {
		if (confirm(`Permanently delete "${name}"? This cannot be undone.`)) {
			await workspace.permanentlyDeleteDiagram(diagramId);
		}
	}

	async function permanentlyDeleteFolder(folderId: string, name: string) {
		if (confirm(`Permanently delete "${name}" and all its diagrams? This cannot be undone.`)) {
			await workspace.permanentlyDeleteFolder(folderId);
		}
	}

	async function handleEmptyTrash() {
		if (
			confirm(
				`Permanently delete all ${itemCount} item${itemCount > 1 ? 's' : ''} in trash? This cannot be undone.`
			)
		) {
			await workspace.emptyTrash();
		}
	}
</script>

<div class="trash-section mt-2 border-t border-stone-300 pt-2">
	<button
		type="button"
		class="flex w-full cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-left hover:bg-stone-100"
		onclick={onToggle}
	>
		<span class="flex h-4 w-4 items-center justify-center text-stone-400">
			{#if isExpanded}
				<svg class="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
			{:else}
				<svg class="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M4 2 L8 6 L4 10" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
			{/if}
		</span>

		<span class="text-sm text-stone-400">🗑️</span>
		<span class="text-sm text-stone-600">Trash</span>

		{#if itemCount > 0}
			<span class="text-xs text-stone-400">({itemCount})</span>
		{/if}
	</button>

	{#if isExpanded}
		<div class="mt-1 pl-4">
			{#if itemCount === 0}
				<div class="px-3 py-1 text-xs text-stone-400 italic">Trash is empty</div>
			{:else}
				{#each trashedFolders as folder (folder.id)}
					<div class="group flex items-center gap-2 rounded px-3 py-1 hover:bg-stone-100">
						<span class="text-sm text-stone-400">📁</span>
						<span class="flex-1 truncate text-sm text-stone-500">{folder.name}</span>
						<button
							type="button"
							class="px-1 text-xs text-stone-400 opacity-0 group-hover:opacity-100 hover:text-green-600"
							onclick={() => restoreFolder(folder.id)}
							title="Restore folder"
						>
							↩️
						</button>
						<button
							type="button"
							class="px-1 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
							onclick={() => permanentlyDeleteFolder(folder.id, folder.name)}
							title="Delete permanently"
						>
							×
						</button>
					</div>
				{/each}

				{#each trashedDiagrams as diagram (diagram.id)}
					<div class="group flex items-center gap-2 rounded px-3 py-1 hover:bg-stone-100">
						<span class="text-sm text-stone-400">📄</span>
						<span class="flex-1 truncate text-sm text-stone-500">{diagram.name}</span>
						<button
							type="button"
							class="px-1 text-xs text-stone-400 opacity-0 group-hover:opacity-100 hover:text-green-600"
							onclick={() => restoreDiagram(diagram.id)}
							title="Restore diagram"
						>
							↩️
						</button>
						<button
							type="button"
							class="px-1 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
							onclick={() => permanentlyDeleteDiagram(diagram.id, diagram.name)}
							title="Delete permanently"
						>
							×
						</button>
					</div>
				{/each}

				<button
					type="button"
					class="mt-2 rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
					onclick={handleEmptyTrash}
				>
					Empty Trash
				</button>
			{/if}
		</div>
	{/if}
</div>
