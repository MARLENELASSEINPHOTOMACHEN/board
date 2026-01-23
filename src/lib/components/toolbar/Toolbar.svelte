<script lang="ts">
	import type { ClassElement, NoteElement, ClassType } from '$lib/types';
	import { diagram, selection } from '$lib/stores';
	import { generateId } from '$lib/utils';

	function addElement(type: ClassType) {
		const centerX = (window.innerWidth / 2 - diagram.viewport.x) / diagram.viewport.zoom;
		const centerY = (window.innerHeight / 2 - diagram.viewport.y) / diagram.viewport.zoom;

		const element: ClassElement = {
			id: generateId(),
			type,
			name:
				type === 'interface' ? 'IInterface' : type === 'abstract' ? 'AbstractClass' : 'ClassName',
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

<div
	class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-lg"
>
	<div class="flex items-center gap-1 border-r border-stone-200 pr-3">
		<button
			type="button"
			class="rounded px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
			onclick={() => addElement('class')}
			title="Add Class"
		>
			+ Class
		</button>
		<button
			type="button"
			class="rounded px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
			onclick={() => addElement('interface')}
			title="Add Interface"
		>
			+ Interface
		</button>
		<button
			type="button"
			class="rounded px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
			onclick={() => addElement('abstract')}
			title="Add Abstract Class"
		>
			+ Abstract
		</button>
		<button
			type="button"
			class="rounded px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
			onclick={addNote}
			title="Add Note"
		>
			+ Note
		</button>
	</div>

	<div class="flex items-center gap-1">
		<button
			type="button"
			class="flex h-8 w-8 items-center justify-center rounded text-stone-600 transition-colors hover:bg-stone-100"
			onclick={zoomOut}
			title="Zoom Out"
		>
			−
		</button>
		<button
			type="button"
			class="min-w-[60px] rounded px-2 py-1 text-sm text-stone-600 hover:bg-stone-100"
			onclick={resetZoom}
			title="Reset Zoom"
		>
			{zoomPercent}%
		</button>
		<button
			type="button"
			class="flex h-8 w-8 items-center justify-center rounded text-stone-600 transition-colors hover:bg-stone-100"
			onclick={zoomIn}
			title="Zoom In"
		>
			+
		</button>
	</div>
</div>
