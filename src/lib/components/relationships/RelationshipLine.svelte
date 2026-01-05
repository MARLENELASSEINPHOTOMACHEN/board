<script lang="ts">
	import type { Relationship, Rect } from '$lib/types';
	import { getAnchorPosition, getBestAnchor, createOrthogonalPath } from '$lib/utils';
	import { selection } from '$lib/stores';

	interface Props {
		relationship: Relationship;
		elementRects: Map<string, Rect>;
	}

	let { relationship, elementRects }: Props = $props();

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
	const strokeColor = $derived(isSelected ? '#1c1917' : '#78716c');
	const strokeWidth = $derived(isSelected ? 2 : 1.5);

	const isDashed = $derived(relationship.type === 'implementation');

	// calculate arrow direction from target anchor -
	// arrow points into the box - so opposite of anchor side
	const arrowAngle = $derived.by(() => {
		if (!anchors) return 0;
		switch (anchors.target) {
			case 'top': return 90;      // arrow points down (into top of box)
			case 'bottom': return 270;  // arrow points up (into bottom of box)
			case 'left': return 0;      // arrow points right (into left of box)
			case 'right': return 180;   // arrow points left (into right of box)
			default: return 0;
		}
	});

	const arrowPoints = $derived.by(() => {
		if (!endPoint) return '';

		const size = 10;
		const { x, y } = endPoint;
		const rad = arrowAngle * Math.PI / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);

		const rotate = (dx: number, dy: number) => ({
			x: x + dx * cos - dy * sin,
			y: y + dx * sin + dy * cos
		});

		// arrow tip at endpoint - base extends backward along the line
		const tip = { x, y };
		const baseLeft = rotate(-size, -size * 0.5);
		const baseRight = rotate(-size, size * 0.5);

		if (relationship.type === 'aggregation' || relationship.type === 'composition') {
			// diamond: tip -> left -> back -> right
			const back = rotate(-size * 1.6, 0);
			return `${tip.x},${tip.y} ${baseLeft.x},${baseLeft.y} ${back.x},${back.y} ${baseRight.x},${baseRight.y}`;
		}

		// triangle: tip -> left -> right
		return `${tip.x},${tip.y} ${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y}`;
	});

	const arrowFill = $derived.by(() => {
		switch (relationship.type) {
			case 'composition':
				return strokeColor;
			case 'association':
				return 'none';
			default:
				return 'white';
		}
	});
</script>

{#if startPoint && endPoint && path}
	<g class="relationship" data-relationship-id={relationship.id}>
		<!-- invisible wider path for easier selection -->
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<path
			d={path}
			fill="none"
			stroke="transparent"
			stroke-width="12"
			class="cursor-pointer"
			onclick={() => selection.select(relationship.id)}
		/>

		<path
			d={path}
			fill="none"
			stroke={strokeColor}
			stroke-width={strokeWidth}
			stroke-dasharray={isDashed ? '5,5' : undefined}
		/>

		{#if relationship.type === 'association'}
			<!-- open arrow for association -->
			<polyline
				points={arrowPoints}
				fill="none"
				stroke={strokeColor}
				stroke-width={strokeWidth}
				stroke-linejoin="miter"
			/>
		{:else}
			<!-- closed shapes for other types -->
			<polygon
				points={arrowPoints}
				fill={arrowFill}
				stroke={strokeColor}
				stroke-width={strokeWidth}
				stroke-linejoin="miter"
			/>
		{/if}

		{#if relationship.sourceMultiplicity}
			<text
				x={startPoint.x + 10}
				y={startPoint.y - 10}
				class="text-xs font-mono fill-stone-600"
			>
				{relationship.sourceMultiplicity}
			</text>
		{/if}

		{#if relationship.targetMultiplicity}
			<text
				x={endPoint.x + 10}
				y={endPoint.y - 10}
				class="text-xs font-mono fill-stone-600"
			>
				{relationship.targetMultiplicity}
			</text>
		{/if}

		{#if relationship.label}
			{@const midX = (startPoint.x + endPoint.x) / 2}
			{@const midY = (startPoint.y + endPoint.y) / 2}
			<text
				x={midX}
				y={midY - 8}
				text-anchor="middle"
				class="text-xs font-mono fill-stone-700"
			>
				{relationship.label}
			</text>
		{/if}
	</g>
{/if}
