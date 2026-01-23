<script lang="ts">
	import { diagram, workspace, selection } from '$lib/stores';
	import { matchesShortcut, SHORTCUTS } from '$lib/utils';
	import InlineEdit from '$lib/components/elements/InlineEdit.svelte';

	function handleUndo() {
		diagram.undo();
	}

	function handleRedo() {
		diagram.redo();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (
			(event.target as HTMLElement).tagName === 'INPUT' ||
			(event.target as HTMLElement).tagName === 'TEXTAREA'
		) {
			return;
		}

		if (matchesShortcut(event, SHORTCUTS.UNDO)) {
			event.preventDefault();
			handleUndo();
		} else if (
			matchesShortcut(event, SHORTCUTS.REDO) ||
			matchesShortcut(event, SHORTCUTS.REDO_ALT)
		) {
			event.preventDefault();
			handleRedo();
		} else if (
			matchesShortcut(event, SHORTCUTS.DELETE) ||
			matchesShortcut(event, SHORTCUTS.BACKSPACE)
		) {
			event.preventDefault();
			const ids = [...selection.ids];
			if (ids.length > 0) {
				const elementIdSet = new Set(diagram.elements.map((el) => el.id));
				const relationshipIdSet = new Set(diagram.relationships.map((rel) => rel.id));
				const elementIds = ids.filter((id) => elementIdSet.has(id));
				const relationshipIds = ids.filter((id) => relationshipIdSet.has(id));
				diagram.removeSelected(elementIds, relationshipIds);
				selection.clear();
			}
		} else if (matchesShortcut(event, SHORTCUTS.ESCAPE)) {
			selection.clear();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<header
	class="flex h-12 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4"
>
	<div class="flex items-center gap-4">
		<h1 class="font-mono text-lg font-bold text-stone-800">board.</h1>
		{#if diagram.diagram}
			<span class="text-stone-400">|</span>
			<InlineEdit
				value={diagram.diagram.name}
				onchange={(name) =>
					diagram.diagram && workspace.updateDiagram(diagram.diagram.id, { name })}
				class="text-sm text-stone-600"
			/>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<button
			type="button"
			class="rounded px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
			onclick={handleUndo}
			disabled={!diagram.canUndo}
			title="Undo (Ctrl+Z)"
		>
			↶ Undo
		</button>
		<button
			type="button"
			class="rounded px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
			onclick={handleRedo}
			disabled={!diagram.canRedo}
			title="Redo (Ctrl+Shift+Z)"
		>
			↷ Redo
		</button>
	</div>
</header>
