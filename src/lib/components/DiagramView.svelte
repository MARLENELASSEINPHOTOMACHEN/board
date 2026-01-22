<script lang="ts">
	import type { Rect, AnchorPoint, RelationshipType, Relationship, Point } from '$lib/types';
	import { isClassElement, isNoteElement } from '$lib/types';
	import { diagram, selection, connection } from '$lib/stores';
	import { Canvas, ConnectionPreview, AnchorAdjustmentPreview } from './canvas';
	import { ClassBox, NoteBox } from './elements';
	import { RelationshipLayer, RelationshipHandles, MultiplicityLabels } from './relationships';
	import { TypePicker } from './ui';
	import { generateId } from '$lib/utils';

	let elementsContainerRef: HTMLDivElement | undefined = $state();
	let elementRects = $state<Map<string, Rect>>(new Map());

	function computeElementRects(): Map<string, Rect> {
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
		return newRects;
	}

	// recompute rects when elements array changes (additions/removals)
	$effect(() => {
		diagram.elements;
		elementRects = computeElementRects();
	});

	// observe DOM mutations in the elements container only - created once when container mounts
	$effect(() => {
		if (!elementsContainerRef) return;

		const observer = new MutationObserver(() => {
			elementRects = computeElementRects();
		});

		observer.observe(elementsContainerRef, {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: true
		});

		return () => observer.disconnect();
	});

	// pending connection state for type picker (new relationship)
	let pendingConnection = $state<{
		sourceId: string;
		sourceAnchor: AnchorPoint;
		targetId: string;
		targetAnchor: AnchorPoint;
		position: { x: number; y: number };
	} | null>(null);

	// editing relationship type state
	let editingRelationship = $state<{
		relationshipId: string;
		position: { x: number; y: number };
	} | null>(null);

	function handleConnectionComplete(
		sourceId: string,
		sourceAnchor: AnchorPoint,
		targetId: string,
		targetAnchor: AnchorPoint,
		screenPosition: Point
	) {
		pendingConnection = {
			sourceId,
			sourceAnchor,
			targetId,
			targetAnchor,
			position: screenPosition
		};
	}

	function handleTypeSelect(type: RelationshipType) {
		if (editingRelationship) {
			diagram.updateRelationship(editingRelationship.relationshipId, { type });
			editingRelationship = null;
			return;
		}

		if (!pendingConnection) return;

		const relationship: Relationship = {
			id: generateId(),
			type,
			sourceId: pendingConnection.sourceId,
			targetId: pendingConnection.targetId,
			anchors: {
				source: pendingConnection.sourceAnchor,
				target: pendingConnection.targetAnchor
			}
		};

		diagram.addRelationship(relationship);
		selection.clear();
		pendingConnection = null;
	}

	function handleTypeCancel() {
		pendingConnection = null;
		editingRelationship = null;
	}

	function handleRelationshipTypeChange(relationshipId: string, position: { x: number; y: number }) {
		editingRelationship = { relationshipId, position };
	}

	function handleAnchorAdjustmentComplete(
		relationshipId: string,
		end: 'source' | 'target',
		targetElementId: string,
		targetAnchor: AnchorPoint
	) {
		const relationship = diagram.relationships.find(r => r.id === relationshipId);
		if (!relationship) return;

		if (end === 'source') {
			diagram.updateRelationship(relationshipId, {
				sourceId: targetElementId,
				anchors: { ...relationship.anchors, source: targetAnchor }
			});
		} else {
			diagram.updateRelationship(relationshipId, {
				targetId: targetElementId,
				anchors: { ...relationship.anchors, target: targetAnchor }
			});
		}
	}
</script>

<Canvas>
	<RelationshipLayer
		relationships={diagram.relationships}
		{elementRects}
		ontypechange={handleRelationshipTypeChange}
	/>

	<div bind:this={elementsContainerRef} class="contents">
		{#each diagram.elements as element (element.id)}
			{#if isClassElement(element)}
				<ClassBox {element} />
			{:else if isNoteElement(element)}
				<NoteBox {element} />
			{/if}
		{/each}
	</div>

	<RelationshipHandles
		relationships={diagram.relationships}
		{elementRects}
	/>

	<MultiplicityLabels
		relationships={diagram.relationships}
		{elementRects}
	/>
</Canvas>

<ConnectionPreview
	{elementRects}
	oncomplete={handleConnectionComplete}
/>

<AnchorAdjustmentPreview
	{elementRects}
	oncomplete={handleAnchorAdjustmentComplete}
/>

{#if pendingConnection}
	<TypePicker
		x={pendingConnection.position.x}
		y={pendingConnection.position.y}
		onselect={handleTypeSelect}
		oncancel={handleTypeCancel}
	/>
{:else if editingRelationship}
	<TypePicker
		x={editingRelationship.position.x}
		y={editingRelationship.position.y}
		onselect={handleTypeSelect}
		oncancel={handleTypeCancel}
	/>
{/if}
