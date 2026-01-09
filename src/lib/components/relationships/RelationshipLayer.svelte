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
<svg class="absolute left-0 top-0 w-[10000px] h-[10000px] pointer-events-none overflow-visible">
	<g class="pointer-events-auto">
		{#each relationships as relationship (relationship.id)}
			<RelationshipLine {relationship} {elementRects} {ontypechange} />
		{/each}
	</g>
</svg>
