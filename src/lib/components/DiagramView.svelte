<script lang="ts">
	import type { Rect } from '$lib/types';
	import { isClassElement, isNoteElement } from '$lib/types';
	import { diagram, selection } from '$lib/stores';
	import { Canvas } from './canvas';
	import { ClassBox, NoteBox } from './elements';
	import { RelationshipLayer } from './relationships';

	let elementRects = $state<Map<string, Rect>>(new Map());

	function updateElementRect(id: string, rect: Rect) {
		elementRects = new Map(elementRects).set(id, rect);
	}

	$effect(() => {
		const observer = new MutationObserver(() => {
			const newRects = new Map<string, Rect>();
			for (const element of diagram.elements) {
				const el = document.querySelector(`[data-element-id="${element.id}"]`);
				if (el) {
					const rect = el.getBoundingClientRect();
					newRects.set(element.id, {
						x: element.position.x,
						y: element.position.y,
						width: rect.width / diagram.viewport.zoom,
						height: rect.height / diagram.viewport.zoom
					});
				}
			}
			elementRects = newRects;
		});

		observer.observe(document.body, { childList: true, subtree: true, attributes: true });

		return () => observer.disconnect();
	});

	$effect(() => {
		const newRects = new Map<string, Rect>();
		for (const element of diagram.elements) {
			const el = document.querySelector(`[data-element-id="${element.id}"]`);
			if (el) {
				const rect = el.getBoundingClientRect();
				newRects.set(element.id, {
					x: element.position.x,
					y: element.position.y,
					width: rect.width / diagram.viewport.zoom,
					height: rect.height / diagram.viewport.zoom
				});
			}
		}
		elementRects = newRects;
	});
</script>

<Canvas>
	<RelationshipLayer
		relationships={diagram.relationships}
		elements={diagram.elements}
		{elementRects}
	/>

	{#each diagram.elements as element (element.id)}
		{#if isClassElement(element)}
			<ClassBox {element} />
		{:else if isNoteElement(element)}
			<NoteBox {element} />
		{/if}
	{/each}
</Canvas>
