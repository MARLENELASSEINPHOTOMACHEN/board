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
		if (confirm(`Permanently delete all ${itemCount} item${itemCount > 1 ? 's' : ''} in trash? This cannot be undone.`)) {
			await workspace.emptyTrash();
		}
	}
</script>

<div class="trash-section border-t border-stone-300 mt-2 pt-2">
	<button
		type="button"
		class="w-full flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-stone-100 rounded text-left"
		onclick={onToggle}
	>
		<span class="w-4 h-4 flex items-center justify-center text-stone-400">
			{#if isExpanded}
				<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
			{:else}
				<svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
					<path d="M4 2 L8 6 L4 10" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
			{/if}
		</span>

		<span class="text-stone-400 text-sm">🗑️</span>
		<span class="text-sm text-stone-600">Trash</span>

		{#if itemCount > 0}
			<span class="text-xs text-stone-400">({itemCount})</span>
		{/if}
	</button>

	{#if isExpanded}
		<div class="pl-4 mt-1">
			{#if itemCount === 0}
				<div class="px-3 py-1 text-xs text-stone-400 italic">Trash is empty</div>
			{:else}
				{#each trashedFolders as folder (folder.id)}
					<div class="group flex items-center gap-2 px-3 py-1 hover:bg-stone-100 rounded">
						<span class="text-stone-400 text-sm">📁</span>
						<span class="flex-1 text-sm text-stone-500 truncate">{folder.name}</span>
						<button
							type="button"
							class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-green-600 px-1 text-xs"
							onclick={() => restoreFolder(folder.id)}
							title="Restore folder"
						>
							↩️
						</button>
						<button
							type="button"
							class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 px-1"
							onclick={() => permanentlyDeleteFolder(folder.id, folder.name)}
							title="Delete permanently"
						>
							×
						</button>
					</div>
				{/each}

				{#each trashedDiagrams as diagram (diagram.id)}
					<div class="group flex items-center gap-2 px-3 py-1 hover:bg-stone-100 rounded">
						<span class="text-stone-400 text-sm">📄</span>
						<span class="flex-1 text-sm text-stone-500 truncate">{diagram.name}</span>
						<button
							type="button"
							class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-green-600 px-1 text-xs"
							onclick={() => restoreDiagram(diagram.id)}
							title="Restore diagram"
						>
							↩️
						</button>
						<button
							type="button"
							class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 px-1"
							onclick={() => permanentlyDeleteDiagram(diagram.id, diagram.name)}
							title="Delete permanently"
						>
							×
						</button>
					</div>
				{/each}

				<button
					type="button"
					class="mt-2 px-3 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
					onclick={handleEmptyTrash}
				>
					Empty Trash
				</button>
			{/if}
		</div>
	{/if}
</div>
