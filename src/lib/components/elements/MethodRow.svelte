<script lang="ts">
	import type { Method, Visibility } from '$lib/types';
	import VisibilityIcon from './VisibilityIcon.svelte';
	import InlineEdit from './InlineEdit.svelte';

	interface Props {
		method: Method;
		onupdate: (updates: Partial<Method>) => void;
		ondelete: () => void;
	}

	let { method, onupdate, ondelete }: Props = $props();

	const visibilityOrder: Visibility[] = ['public', 'private', 'protected'];

	function cycleVisibility() {
		const currentIndex = visibilityOrder.indexOf(method.visibility);
		const nextIndex = (currentIndex + 1) % visibilityOrder.length;
		onupdate({ visibility: visibilityOrder[nextIndex] });
	}

	const parametersText = $derived(
		method.parameters.map((p) => `${p.name}: ${p.type}`).join(', ')
	);
</script>

<div class="group flex items-center gap-1 px-2 py-0.5 text-sm font-mono hover:bg-stone-100">
	<VisibilityIcon visibility={method.visibility} onclick={cycleVisibility} />
	<InlineEdit
		value={method.name}
		onchange={(name) => onupdate({ name })}
		placeholder="method"
		class="flex-shrink-0"
	/>
	<span class="text-stone-400">(</span>
	<span class="text-stone-500 text-xs">{parametersText}</span>
	<span class="text-stone-400">)</span>
	<span class="text-stone-400">:</span>
	<InlineEdit
		value={method.returnType}
		onchange={(returnType) => onupdate({ returnType })}
		placeholder="void"
		class="flex-1 text-stone-600"
	/>
	<button
		type="button"
		class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 px-1"
		onclick={ondelete}
		title="Delete method"
	>
		×
	</button>
</div>
