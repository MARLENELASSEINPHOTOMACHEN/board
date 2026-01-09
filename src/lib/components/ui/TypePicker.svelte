<script lang="ts">
	import type { RelationshipType } from '$lib/types';

	interface Props {
		x: number;
		y: number;
		onselect: (type: RelationshipType) => void;
		oncancel: () => void;
	}

	let { x, y, onselect, oncancel }: Props = $props();

	const types: { value: RelationshipType; label: string; icon: string }[] = [
		{ value: 'association', label: 'Association', icon: '→' },
		{ value: 'inheritance', label: 'Inheritance', icon: '▷' },
		{ value: 'implementation', label: 'Implementation', icon: '⇢' },
		{ value: 'aggregation', label: 'Aggregation', icon: '◇' },
		{ value: 'composition', label: 'Composition', icon: '◆' }
	];

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			oncancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50"
	onclick={oncancel}
>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="absolute bg-white rounded-lg shadow-xl border border-stone-200 py-1 min-w-[160px]"
		style:left="{x}px"
		style:top="{y}px"
		style:transform="translate(-50%, -50%)"
		onclick={(e) => e.stopPropagation()}
	>
		{#each types as type (type.value)}
			<button
				type="button"
				class="w-full text-left px-3 py-2 text-sm hover:bg-stone-100 flex items-center gap-2"
				onclick={() => onselect(type.value)}
			>
				<span class="w-5 text-center font-mono">{type.icon}</span>
				<span>{type.label}</span>
			</button>
		{/each}
	</div>
</div>
