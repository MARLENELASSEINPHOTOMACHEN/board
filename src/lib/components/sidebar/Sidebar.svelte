<script lang="ts">
	import { project } from '$lib/stores';
	import DiagramItem from './DiagramItem.svelte';

	let isEditingProjectName = $state(false);
	let editProjectName = $state('');
	let inputRef: HTMLInputElement | undefined = $state();

	function startEditProjectName() {
		if (project.project) {
			editProjectName = project.project.name;
			isEditingProjectName = true;
		}
	}

	function commitProjectName() {
		if (isEditingProjectName) {
			isEditingProjectName = false;
			if (editProjectName && editProjectName !== project.project?.name) {
				project.updateProject({ name: editProjectName });
			}
		}
	}

	function handleProjectNameKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitProjectName();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			isEditingProjectName = false;
		}
	}

	async function createDiagram() {
		const name = `Diagram ${project.diagrams.length + 1}`;
		const newDiagram = await project.createDiagram(name);
		await project.openDiagram(newDiagram.id);
	}

	$effect(() => {
		if (isEditingProjectName && inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});
</script>

<aside class="w-60 bg-stone-50 border-r border-stone-200 flex flex-col h-full">
	<div class="p-3 border-b border-stone-200">
		{#if isEditingProjectName}
			<input
				bind:this={inputRef}
				type="text"
				bind:value={editProjectName}
				onblur={commitProjectName}
				onkeydown={handleProjectNameKeydown}
				class="w-full bg-white border border-stone-300 px-2 py-1 text-sm font-semibold outline-none focus:border-stone-500 rounded"
			/>
		{:else}
			<button
				type="button"
				class="font-semibold text-stone-800 cursor-pointer hover:text-stone-600 text-left w-full"
				ondblclick={startEditProjectName}
			>
				{project.project?.name ?? 'Loading...'}
			</button>
		{/if}
	</div>

	<div class="flex-1 overflow-y-auto p-2">
		<div class="flex items-center justify-between px-2 py-1 mb-1">
			<span class="text-xs font-medium text-stone-500 uppercase tracking-wide">Diagrams</span>
			<button
				type="button"
				class="text-stone-400 hover:text-stone-600 text-lg leading-none"
				onclick={createDiagram}
				title="New Diagram"
			>
				+
			</button>
		</div>

		{#each project.diagrams as diagram (diagram.id)}
			<DiagramItem {diagram} />
		{/each}

		{#if project.diagrams.length === 0}
			<p class="px-3 py-2 text-sm text-stone-400 italic">No diagrams yet</p>
		{/if}
	</div>
</aside>
