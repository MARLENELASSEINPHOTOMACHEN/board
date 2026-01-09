<script lang="ts">
	import type { Relationship, Rect, AnchorPoint } from '$lib/types';
	import { getRelationshipEndpoints } from '$lib/utils';
	import { selection, diagram } from '$lib/stores';

	interface Props {
		relationships: Relationship[];
		elementRects: Map<string, Rect>;
	}

	let { relationships, elementRects }: Props = $props();

	interface EditState {
		relationshipId: string;
		end: 'source' | 'target';
		value: string;
	}

	let editing = $state<EditState | null>(null);

	function autofocus(node: HTMLInputElement) {
		node.focus();
		node.select();
	}

	function getLabelOffset(anchor: AnchorPoint): { x: number; y: number } {
		switch (anchor) {
			case 'top': return { x: 10, y: -8 };
			case 'bottom': return { x: 10, y: 16 };
			case 'left': return { x: -30, y: -8 };
			case 'right': return { x: 10, y: -8 };
			default: return { x: 10, y: -8 };
		}
	}

	function startEditing(relationshipId: string, end: 'source' | 'target', currentValue: string | undefined) {
		editing = { relationshipId, end, value: currentValue ?? '' };
	}

	function saveEdit() {
		if (!editing) return;

		const updates = editing.end === 'source'
			? { sourceMultiplicity: editing.value || undefined }
			: { targetMultiplicity: editing.value || undefined };

		diagram.updateRelationship(editing.relationshipId, updates);
		editing = null;
	}

	function cancelEdit() {
		editing = null;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveEdit();
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}
</script>

{#each relationships as relationship (relationship.id)}
	{@const endpoints = getRelationshipEndpoints(relationship, elementRects)}
	{@const isSelected = selection.isSelected(relationship.id)}
	{@const hasSourceMultiplicity = !!relationship.sourceMultiplicity}
	{@const hasTargetMultiplicity = !!relationship.targetMultiplicity}
	{#if endpoints}
		{@const sourceOffset = getLabelOffset(endpoints.sourceAnchor)}
		{@const targetOffset = getLabelOffset(endpoints.targetAnchor)}

		<!-- source multiplicity - show if has value OR if selected -->
		{#if hasSourceMultiplicity || isSelected}
			{#if editing?.relationshipId === relationship.id && editing.end === 'source'}
				<input
					use:autofocus
					type="text"
					class="absolute w-12 h-5 text-xs font-mono px-1 border border-stone-400 rounded bg-white -translate-y-1/2"
					style:left="{endpoints.start.x + sourceOffset.x}px"
					style:top="{endpoints.start.y + sourceOffset.y}px"
					bind:value={editing.value}
					onblur={saveEdit}
					onkeydown={handleKeyDown}
				/>
			{:else if hasSourceMultiplicity}
				<button
					type="button"
					class="absolute text-xs font-mono text-stone-600 hover:bg-stone-200 px-1 rounded -translate-y-1/2"
					style:left="{endpoints.start.x + sourceOffset.x}px"
					style:top="{endpoints.start.y + sourceOffset.y}px"
					onclick={() => startEditing(relationship.id, 'source', relationship.sourceMultiplicity)}
				>
					{relationship.sourceMultiplicity}
				</button>
			{:else if isSelected}
				<button
					type="button"
					class="absolute text-xs font-mono text-stone-400 hover:text-stone-600 hover:bg-stone-200 px-1 rounded -translate-y-1/2 border border-dashed border-stone-300"
					style:left="{endpoints.start.x + sourceOffset.x}px"
					style:top="{endpoints.start.y + sourceOffset.y}px"
					onclick={() => startEditing(relationship.id, 'source', relationship.sourceMultiplicity)}
				>
					0..*
				</button>
			{/if}
		{/if}

		<!-- target multiplicity - show if has value OR if selected -->
		{#if hasTargetMultiplicity || isSelected}
			{#if editing?.relationshipId === relationship.id && editing.end === 'target'}
				<input
					use:autofocus
					type="text"
					class="absolute w-12 h-5 text-xs font-mono px-1 border border-stone-400 rounded bg-white -translate-y-1/2"
					style:left="{endpoints.end.x + targetOffset.x}px"
					style:top="{endpoints.end.y + targetOffset.y}px"
					bind:value={editing.value}
					onblur={saveEdit}
					onkeydown={handleKeyDown}
				/>
			{:else if hasTargetMultiplicity}
				<button
					type="button"
					class="absolute text-xs font-mono text-stone-600 hover:bg-stone-200 px-1 rounded -translate-y-1/2"
					style:left="{endpoints.end.x + targetOffset.x}px"
					style:top="{endpoints.end.y + targetOffset.y}px"
					onclick={() => startEditing(relationship.id, 'target', relationship.targetMultiplicity)}
				>
					{relationship.targetMultiplicity}
				</button>
			{:else if isSelected}
				<button
					type="button"
					class="absolute text-xs font-mono text-stone-400 hover:text-stone-600 hover:bg-stone-200 px-1 rounded -translate-y-1/2 border border-dashed border-stone-300"
					style:left="{endpoints.end.x + targetOffset.x}px"
					style:top="{endpoints.end.y + targetOffset.y}px"
					onclick={() => startEditing(relationship.id, 'target', relationship.targetMultiplicity)}
				>
					0..*
				</button>
			{/if}
		{/if}
	{/if}
{/each}
