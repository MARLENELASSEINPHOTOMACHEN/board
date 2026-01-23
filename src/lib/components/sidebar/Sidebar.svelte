<script lang="ts">
	import { dev } from '$app/environment';
	import { workspace } from '$lib/stores';
	import { storage } from '$lib/services/storage';
	import DiagramItem from './DiagramItem.svelte';
	import FolderItem from './FolderItem.svelte';
	import TrashSection from './TrashSection.svelte';

	async function clearDatabase() {
		if (confirm('This will delete all diagrams and folders. Are you sure?')) {
			await storage.clearAll();
			window.location.reload();
		}
	}

	let isRootDragOver = $state(false);

	async function createDiagram() {
		const name = `Diagram ${workspace.activeDiagrams.length + 1}`;
		const newDiagram = await workspace.createDiagram(name);
		await workspace.openDiagram(newDiagram.id);
	}

	async function createFolder() {
		const name = `Folder ${workspace.activeFolders.length + 1}`;
		await workspace.createFolder(name);
	}

	function handleRootDragOver(event: DragEvent) {
		const types = event.dataTransfer?.types ?? [];
		if (types.includes('application/x-diagram-id')) {
			event.preventDefault();
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'move';
			}
			isRootDragOver = true;
		}
	}

	function handleRootDragLeave(event: DragEvent) {
		// dragleave fires when entering children - only clear if actually leaving
		const relatedTarget = event.relatedTarget as Node | null;
		const currentTarget = event.currentTarget as Node;
		if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
			isRootDragOver = false;
		}
	}

	function handleRootDrop(event: DragEvent) {
		event.preventDefault();
		isRootDragOver = false;
		const diagramId = event.dataTransfer?.getData('application/x-diagram-id');
		if (diagramId) {
			workspace.moveDiagramToFolder(diagramId, null);
		}
	}
</script>

<aside class="flex h-full w-60 flex-col border-r border-stone-200 bg-stone-50">
	<div class="flex-1 overflow-y-auto p-2">
		<div class="mb-1 flex items-center justify-between px-2 py-1">
			<span class="text-xs font-medium tracking-wide text-stone-500 uppercase">Diagrams</span>
			<div class="flex gap-1">
				<button
					type="button"
					class="cursor-pointer px-1 text-sm leading-none text-stone-400 hover:text-stone-600"
					onclick={createFolder}
					title="New Folder"
				>
					📁
				</button>
				<button
					type="button"
					class="cursor-pointer text-lg leading-none text-stone-400 hover:text-stone-600"
					onclick={createDiagram}
					title="New Diagram"
				>
					+
				</button>
			</div>
		</div>

		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="rounded transition-colors"
			class:bg-amber-50={isRootDragOver}
			class:ring-2={isRootDragOver}
			class:ring-amber-300={isRootDragOver}
			ondragover={handleRootDragOver}
			ondragleave={handleRootDragLeave}
			ondrop={handleRootDrop}
			role="tree"
		>
			{#each workspace.rootDiagrams as diagram (diagram.id)}
				<DiagramItem {diagram} />
			{/each}

			{#if workspace.rootDiagrams.length === 0 && workspace.activeFolders.length > 0}
				<div
					class="mb-1 rounded border border-dashed border-stone-300 px-3 py-2 text-xs text-stone-400 transition-colors"
					class:border-amber-400={isRootDragOver}
					class:bg-amber-50={isRootDragOver}
					class:text-amber-600={isRootDragOver}
				>
					{isRootDragOver ? 'Drop here for root level' : 'Drop diagrams here'}
				</div>
			{/if}

			{#each workspace.activeFolders as folder (folder.id)}
				<FolderItem
					{folder}
					diagrams={workspace.getDiagramsByFolder(folder.id)}
					isExpanded={workspace.isFolderExpanded(folder.id)}
					onToggle={() => workspace.toggleFolderExpanded(folder.id)}
					onDrop={(diagramId) => workspace.moveDiagramToFolder(diagramId, folder.id)}
				/>
			{/each}

			{#if workspace.activeDiagrams.length === 0}
				<p class="px-3 py-2 text-sm text-stone-400 italic">No diagrams yet</p>
			{/if}
		</div>
	</div>

	<TrashSection
		trashedDiagrams={workspace.trashedDiagrams}
		trashedFolders={workspace.trashedFolders}
		isExpanded={workspace.trashExpanded}
		onToggle={() => workspace.toggleTrashExpanded()}
	/>

	{#if dev}
		<div class="border-t border-stone-200 p-2">
			<button
				type="button"
				class="w-full cursor-pointer rounded px-2 py-1 text-xs text-stone-400 hover:bg-red-50 hover:text-red-500"
				onclick={clearDatabase}
			>
				Clear Database
			</button>
		</div>
	{/if}
</aside>
