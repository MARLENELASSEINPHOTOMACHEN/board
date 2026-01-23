<script lang="ts">
	import type { Relationship, Rect, Point } from '$lib/types';
	import RelationshipLine from './RelationshipLine.svelte';

	interface Props {
		relationships: Relationship[];
		elementRects: Map<string, Rect>;
		ontypechange?: (relationshipId: string, position: Point) => void;
	}

	let { relationships, elementRects, ontypechange }: Props = $props();
</script>

<!-- Large fixed size ensures lines aren't clipped when elements are far from origin -->
<svg class="pointer-events-none absolute top-0 left-0 h-[10000px] w-[10000px] overflow-visible">
	<g class="pointer-events-auto">
		{#each relationships as relationship (relationship.id)}
			<RelationshipLine {relationship} {elementRects} {ontypechange} />
		{/each}
	</g>
</svg>
