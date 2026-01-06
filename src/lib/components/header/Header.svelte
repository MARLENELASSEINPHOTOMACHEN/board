<script lang="ts">
	import { diagram, selection, project } from '$lib/stores';
	import { matchesShortcut, SHORTCUTS } from '$lib/utils';

	function handleUndo() {
		diagram.undo();
	}

	function handleRedo() {
		diagram.redo();
	}

	function handleKeydown(event: KeyboardEvent) {
		if ((event.target as HTMLElement).tagName === 'INPUT' || (event.target as HTMLElement).tagName === 'TEXTAREA') {
			return;
		}

		if (matchesShortcut(event, SHORTCUTS.UNDO)) {
			event.preventDefault();
			handleUndo();
		} else if (matchesShortcut(event, SHORTCUTS.REDO) || matchesShortcut(event, SHORTCUTS.REDO_ALT)) {
			event.preventDefault();
			handleRedo();
		} else if (matchesShortcut(event, SHORTCUTS.DELETE) || matchesShortcut(event, SHORTCUTS.BACKSPACE)) {
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

<header class="h-12 bg-white border-b border-stone-200 flex items-center justify-between px-4 shrink-0">
	<div class="flex items-center gap-4">
		<h1 class="font-bold text-lg text-stone-800 font-mono">board.</h1>
		{#if diagram.diagram}
			<span class="text-stone-400">|</span>
			<span class="text-sm text-stone-600">{diagram.diagram.name}</span>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<button
			type="button"
			class="px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
			onclick={handleUndo}
			disabled={!diagram.canUndo}
			title="Undo (Ctrl+Z)"
		>
			↶ Undo
		</button>
		<button
			type="button"
			class="px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
			onclick={handleRedo}
			disabled={!diagram.canRedo}
			title="Redo (Ctrl+Shift+Z)"
		>
			↷ Redo
		</button>
	</div>
</header>
