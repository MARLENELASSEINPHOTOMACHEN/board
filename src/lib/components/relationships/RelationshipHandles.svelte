<script lang="ts">
	import type { Relationship, Rect } from '$lib/types';
	import { getRelationshipEndpoints } from '$lib/utils';
	import { selection, connection } from '$lib/stores';

	interface Props {
		relationships: Relationship[];
		elementRects: Map<string, Rect>;
	}

	let { relationships, elementRects }: Props = $props();

	const selectedRelationships = $derived(relationships.filter((r) => selection.isSelected(r.id)));

	function handleMouseDown(
		relationship: Relationship,
		end: 'source' | 'target',
		event: MouseEvent
	) {
		event.stopPropagation();
		event.preventDefault();
		startAdjustment(relationship, end);
	}

	function handleKeyDown(
		relationship: Relationship,
		end: 'source' | 'target',
		event: KeyboardEvent
	) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			startAdjustment(relationship, end);
		}
	}

	function startAdjustment(relationship: Relationship, end: 'source' | 'target') {
		const endpoints = getRelationshipEndpoints(relationship, elementRects);
		if (!endpoints) return;

		const fixedPoint = end === 'source' ? endpoints.end : endpoints.start;
		const dragPoint = end === 'source' ? endpoints.start : endpoints.end;

		connection.startAdjustment(relationship.id, end, fixedPoint, dragPoint);
	}
</script>

{#if !connection.isAdjusting}
	{#each selectedRelationships as relationship (relationship.id)}
		{@const endpoints = getRelationshipEndpoints(relationship, elementRects)}
		{#if endpoints}
			<button
				type="button"
				class="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-stone-900 bg-white"
				style:left="{endpoints.start.x}px"
				style:top="{endpoints.start.y}px"
				onmousedown={(e) => handleMouseDown(relationship, 'source', e)}
				onkeydown={(e) => handleKeyDown(relationship, 'source', e)}
				aria-label="Adjust source anchor"
			></button>
			<button
				type="button"
				class="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-stone-900 bg-white"
				style:left="{endpoints.end.x}px"
				style:top="{endpoints.end.y}px"
				onmousedown={(e) => handleMouseDown(relationship, 'target', e)}
				onkeydown={(e) => handleKeyDown(relationship, 'target', e)}
				aria-label="Adjust target anchor"
			></button>
		{/if}
	{/each}
{/if}
