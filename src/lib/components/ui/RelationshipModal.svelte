<script lang="ts">
	import type { RelationshipType, Relationship } from '$lib/types';
	import { diagram, selection } from '$lib/stores';
	import { generateId } from '$lib/utils';
	import { isClassElement } from '$lib/types';

	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();

	const classElements = $derived(
		diagram.elements.filter(isClassElement)
	);

	let sourceId = $state('');
	let targetId = $state('');
	let relationshipType = $state<RelationshipType>('association');

	function createRelationship() {
		if (!sourceId || !targetId || sourceId === targetId) return;

		const relationship: Relationship = {
			id: generateId(),
			type: relationshipType,
			sourceId,
			targetId,
			anchors: { source: 'auto', target: 'auto' }
		};

		diagram.addRelationship(relationship);
		onclose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
	onclick={onclose}
>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="bg-white rounded-lg shadow-xl p-6 w-96"
		onclick={(e) => e.stopPropagation()}
	>
		<h2 class="text-lg font-semibold text-stone-800 mb-4">Create Relationship</h2>

		<div class="space-y-4">
			<div>
				<label for="source" class="block text-sm font-medium text-stone-700 mb-1">Source</label>
				<select
					id="source"
					bind:value={sourceId}
					class="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-500"
				>
					<option value="">Select source...</option>
					{#each classElements as element (element.id)}
						<option value={element.id}>{element.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="target" class="block text-sm font-medium text-stone-700 mb-1">Target</label>
				<select
					id="target"
					bind:value={targetId}
					class="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-500"
				>
					<option value="">Select target...</option>
					{#each classElements as element (element.id)}
						<option value={element.id}>{element.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="type" class="block text-sm font-medium text-stone-700 mb-1">Type</label>
				<select
					id="type"
					bind:value={relationshipType}
					class="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-500"
				>
					<option value="association">Association →</option>
					<option value="inheritance">Inheritance ▷</option>
					<option value="implementation">Implementation ⇢</option>
					<option value="aggregation">Aggregation ◇</option>
					<option value="composition">Composition ◆</option>
				</select>
			</div>
		</div>

		<div class="flex justify-end gap-2 mt-6">
			<button
				type="button"
				class="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded"
				onclick={onclose}
			>
				Cancel
			</button>
			<button
				type="button"
				class="px-4 py-2 text-sm bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50"
				onclick={createRelationship}
				disabled={!sourceId || !targetId || sourceId === targetId}
			>
				Create
			</button>
		</div>
	</div>
</div>
