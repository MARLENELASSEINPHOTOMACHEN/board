<script lang="ts">
	import type { Attribute, Visibility } from '$lib/types';
	import VisibilityIcon from './VisibilityIcon.svelte';
	import InlineEdit from './InlineEdit.svelte';

	interface Props {
		attribute: Attribute;
		onupdate: (updates: Partial<Attribute>) => void;
		ondelete: () => void;
	}

	let { attribute, onupdate, ondelete }: Props = $props();

	const visibilityOrder: Visibility[] = ['public', 'private', 'protected'];

	function cycleVisibility() {
		const currentIndex = visibilityOrder.indexOf(attribute.visibility);
		const nextIndex = (currentIndex + 1) % visibilityOrder.length;
		onupdate({ visibility: visibilityOrder[nextIndex] });
	}
</script>

<div class="group flex items-center gap-1 px-2 py-0.5 text-sm font-mono hover:bg-stone-100">
	<VisibilityIcon visibility={attribute.visibility} onclick={cycleVisibility} />
	<InlineEdit
		value={attribute.name}
		onchange={(name) => onupdate({ name })}
		placeholder="name"
		class="flex-shrink-0"
	/>
	<span class="text-stone-400">:</span>
	<InlineEdit
		value={attribute.dataType}
		onchange={(dataType) => onupdate({ dataType })}
		placeholder="type"
		class="flex-1 text-stone-600"
	/>
	<button
		type="button"
		class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 px-1"
		onclick={ondelete}
		title="Delete attribute"
	>
		×
	</button>
</div>
