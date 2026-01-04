<script lang="ts">
	import type { DiagramElement, Relationship, Rect } from '$lib/types';
	import RelationshipLine from './RelationshipLine.svelte';
	import RelationshipMarkers from './RelationshipMarkers.svelte';

	interface Props {
		relationships: Relationship[];
		elements: DiagramElement[];
		elementRects: Map<string, Rect>;
	}

	let { relationships, elements, elementRects }: Props = $props();
</script>

<svg class="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
	<RelationshipMarkers />

	<g class="pointer-events-auto">
		{#each relationships as relationship (relationship.id)}
			<RelationshipLine {relationship} {elements} {elementRects} />
		{/each}
	</g>
</svg>
