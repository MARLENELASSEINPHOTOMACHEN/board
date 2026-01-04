<script lang="ts">
	import type { Relationship, DiagramElement, Rect } from '$lib/types';
	import { isClassElement } from '$lib/types';
	import { getAnchorPosition, getBestAnchor, createOrthogonalPath } from '$lib/utils';
	import { selection } from '$lib/stores';

	interface Props {
		relationship: Relationship;
		elements: DiagramElement[];
		elementRects: Map<string, Rect>;
	}

	let { relationship, elements, elementRects }: Props = $props();

	const sourceElement = $derived(elements.find((el) => el.id === relationship.sourceId));
	const targetElement = $derived(elements.find((el) => el.id === relationship.targetId));

	const sourceRect = $derived(elementRects.get(relationship.sourceId));
	const targetRect = $derived(elementRects.get(relationship.targetId));

	const anchors = $derived.by(() => {
		if (!sourceRect || !targetRect) return null;

		if (relationship.anchors.source === 'auto' || relationship.anchors.target === 'auto') {
			return getBestAnchor(sourceRect, targetRect);
		}

		return relationship.anchors;
	});

	const startPoint = $derived.by(() => {
		if (!sourceRect || !anchors) return null;
		return getAnchorPosition(sourceRect, anchors.source);
	});

	const endPoint = $derived.by(() => {
		if (!targetRect || !anchors) return null;
		return getAnchorPosition(targetRect, anchors.target);
	});

	const path = $derived.by(() => {
		if (!startPoint || !endPoint || !anchors) return '';
		return createOrthogonalPath(startPoint, endPoint, anchors.source, anchors.target);
	});

	const isSelected = $derived(selection.isSelected(relationship.id));

	const strokeStyle = $derived.by(() => {
		switch (relationship.type) {
			case 'implementation':
				return '5,5';
			default:
				return 'none';
		}
	});

	const markerEnd = $derived.by(() => {
		switch (relationship.type) {
			case 'inheritance':
				return 'url(#arrow-empty)';
			case 'implementation':
				return 'url(#arrow-empty)';
			case 'aggregation':
				return 'url(#diamond-empty)';
			case 'composition':
				return 'url(#diamond-filled)';
			default:
				return 'url(#arrow-simple)';
		}
	});
</script>

{#if startPoint && endPoint && path}
	<g class="relationship" data-relationship-id={relationship.id}>
		<!-- Invisible wider path for easier selection -->
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<path
			d={path}
			fill="none"
			stroke="transparent"
			stroke-width="12"
			class="cursor-pointer"
			onclick={() => selection.select(relationship.id)}
		/>

		<!-- Visible path -->
		<path
			d={path}
			fill="none"
			stroke={isSelected ? '#1c1917' : '#78716c'}
			stroke-width={isSelected ? 2 : 1.5}
			stroke-dasharray={strokeStyle}
			marker-end={markerEnd}
		/>

		<!-- Source multiplicity label -->
		{#if relationship.sourceMultiplicity}
			<text
				x={startPoint.x + 10}
				y={startPoint.y - 10}
				class="text-xs fill-stone-600 font-mono"
			>
				{relationship.sourceMultiplicity}
			</text>
		{/if}

		<!-- Target multiplicity label -->
		{#if relationship.targetMultiplicity}
			<text
				x={endPoint.x + 10}
				y={endPoint.y - 10}
				class="text-xs fill-stone-600 font-mono"
			>
				{relationship.targetMultiplicity}
			</text>
		{/if}

		<!-- Relationship label -->
		{#if relationship.label}
			{@const midX = (startPoint.x + endPoint.x) / 2}
			{@const midY = (startPoint.y + endPoint.y) / 2}
			<text
				x={midX}
				y={midY - 8}
				text-anchor="middle"
				class="text-xs fill-stone-700 font-mono"
			>
				{relationship.label}
			</text>
		{/if}
	</g>
{/if}
