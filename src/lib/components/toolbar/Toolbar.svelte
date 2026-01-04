<script lang="ts">
	import type { ClassElement, NoteElement, ClassType } from '$lib/types';
	import { diagram, selection } from '$lib/stores';
	import { generateId } from '$lib/utils';
	import { RelationshipModal } from '$lib/components/ui';

	let showRelationshipModal = $state(false);

	function addElement(type: ClassType) {
		const centerX = (window.innerWidth / 2 - diagram.viewport.x) / diagram.viewport.zoom;
		const centerY = (window.innerHeight / 2 - diagram.viewport.y) / diagram.viewport.zoom;

		const element: ClassElement = {
			id: generateId(),
			type,
			name: type === 'interface' ? 'IInterface' : type === 'abstract' ? 'AbstractClass' : 'ClassName',
			position: { x: centerX - 80, y: centerY - 60 },
			attributes: [],
			methods: []
		};

		diagram.addElement(element);
		selection.select(element.id);
	}

	function addNote() {
		const centerX = (window.innerWidth / 2 - diagram.viewport.x) / diagram.viewport.zoom;
		const centerY = (window.innerHeight / 2 - diagram.viewport.y) / diagram.viewport.zoom;

		const element: NoteElement = {
			id: generateId(),
			type: 'note',
			content: '',
			position: { x: centerX - 60, y: centerY - 30 }
		};

		diagram.addElement(element);
		selection.select(element.id);
	}

	function zoomIn() {
		diagram.zoom(1.2, window.innerWidth / 2, window.innerHeight / 2);
	}

	function zoomOut() {
		diagram.zoom(0.8, window.innerWidth / 2, window.innerHeight / 2);
	}

	function resetZoom() {
		diagram.setViewport({ x: 0, y: 0, zoom: 1 });
	}

	const zoomPercent = $derived(Math.round(diagram.viewport.zoom * 100));
</script>

<div class="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white border border-stone-300 rounded-lg shadow-lg px-3 py-2 z-50">
	<!-- Add Elements -->
	<div class="flex items-center gap-1 border-r border-stone-200 pr-3">
		<button
			type="button"
			class="px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors"
			onclick={() => addElement('class')}
			title="Add Class"
		>
			+ Class
		</button>
		<button
			type="button"
			class="px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors"
			onclick={() => addElement('interface')}
			title="Add Interface"
		>
			+ Interface
		</button>
		<button
			type="button"
			class="px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors"
			onclick={() => addElement('abstract')}
			title="Add Abstract Class"
		>
			+ Abstract
		</button>
		<button
			type="button"
			class="px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors"
			onclick={addNote}
			title="Add Note"
		>
			+ Note
		</button>
		<button
			type="button"
			class="px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors"
			onclick={() => showRelationshipModal = true}
			title="Add Relationship"
		>
			+ Relation
		</button>
	</div>

	<!-- Zoom Controls -->
	<div class="flex items-center gap-1">
		<button
			type="button"
			class="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded transition-colors"
			onclick={zoomOut}
			title="Zoom Out"
		>
			−
		</button>
		<button
			type="button"
			class="px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 rounded min-w-[60px]"
			onclick={resetZoom}
			title="Reset Zoom"
		>
			{zoomPercent}%
		</button>
		<button
			type="button"
			class="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded transition-colors"
			onclick={zoomIn}
			title="Zoom In"
		>
			+
		</button>
	</div>
</div>

{#if showRelationshipModal}
	<RelationshipModal onclose={() => showRelationshipModal = false} />
{/if}
