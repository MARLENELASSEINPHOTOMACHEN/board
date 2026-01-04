<script lang="ts">
	import type { ClassElement, Attribute, Method } from '$lib/types';
	import { diagram, selection } from '$lib/stores';
	import { generateId } from '$lib/utils';
	import InlineEdit from './InlineEdit.svelte';
	import AttributeRow from './AttributeRow.svelte';
	import MethodRow from './MethodRow.svelte';

	interface Props {
		element: ClassElement;
	}

	let { element }: Props = $props();

	let boxRef: HTMLDivElement | undefined = $state();
	let isDragging = $state(false);
	let dragOffset = $state({ x: 0, y: 0 });

	const isSelected = $derived(selection.isSelected(element.id));

	const stereotypeLabel = $derived(
		element.type === 'interface'
			? '«interface»'
			: element.type === 'abstract'
				? '«abstract»'
				: null
	);

	function handleMouseDown(event: MouseEvent) {
		if (event.button !== 0) return;
		if ((event.target as HTMLElement).tagName === 'INPUT') return;
		if ((event.target as HTMLElement).tagName === 'BUTTON') return;

		event.stopPropagation();

		if (event.shiftKey) {
			selection.toggle(element.id);
		} else if (!isSelected) {
			selection.select(element.id);
		}

		isDragging = true;
		dragOffset = {
			x: event.clientX / diagram.viewport.zoom - element.position.x,
			y: event.clientY / diagram.viewport.zoom - element.position.y
		};
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;

		const x = event.clientX / diagram.viewport.zoom - dragOffset.x;
		const y = event.clientY / diagram.viewport.zoom - dragOffset.y;

		diagram.moveElement(element.id, x, y);
	}

	function handleMouseUp() {
		if (isDragging) {
			isDragging = false;
			diagram.commitMove(element.id);
		}
	}

	function updateName(name: string) {
		diagram.updateElement(element.id, { name });
	}

	function addAttribute() {
		const attr: Attribute = {
			id: generateId(),
			name: '',
			dataType: '',
			visibility: 'private'
		};
		diagram.addAttribute(element.id, attr);
	}

	function updateAttribute(attrId: string, updates: Partial<Attribute>) {
		diagram.updateAttribute(element.id, attrId, updates);
	}

	function deleteAttribute(attrId: string) {
		diagram.removeAttribute(element.id, attrId);
	}

	function addMethod() {
		const method: Method = {
			id: generateId(),
			name: '',
			returnType: 'void',
			parameters: [],
			visibility: 'public'
		};
		diagram.addMethod(element.id, method);
	}

	function updateMethod(methodId: string, updates: Partial<Method>) {
		diagram.updateMethod(element.id, methodId, updates);
	}

	function deleteMethod(methodId: string) {
		diagram.removeMethod(element.id, methodId);
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div
	bind:this={boxRef}
	class="absolute bg-amber-50 border-2 rounded shadow-md min-w-[160px] select-none"
	class:border-stone-800={isSelected}
	class:border-stone-400={!isSelected}
	class:shadow-lg={isSelected}
	class:cursor-grabbing={isDragging}
	class:cursor-grab={!isDragging}
	style:left="{element.position.x}px"
	style:top="{element.position.y}px"
	onmousedown={handleMouseDown}
	role="button"
	tabindex="0"
	aria-label="{element.type} {element.name}"
	data-element-id={element.id}
>
	<!-- Header -->
	<div class="px-3 py-2 text-center border-b border-stone-300 bg-amber-100/50">
		{#if stereotypeLabel}
			<div class="text-xs text-stone-500 font-mono">{stereotypeLabel}</div>
		{/if}
		<InlineEdit
			value={element.name}
			onchange={updateName}
			placeholder="ClassName"
			class="font-bold text-stone-800"
		/>
	</div>

	<!-- Attributes -->
	<div class="border-b border-stone-300 min-h-[24px]">
		{#each element.attributes as attr (attr.id)}
			<AttributeRow
				attribute={attr}
				onupdate={(updates) => updateAttribute(attr.id, updates)}
				ondelete={() => deleteAttribute(attr.id)}
			/>
		{/each}
		<button
			type="button"
			class="w-full text-left px-2 py-0.5 text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-100"
			onclick={addAttribute}
		>
			+ attribute
		</button>
	</div>

	<!-- Methods -->
	<div class="min-h-[24px]">
		{#each element.methods as method (method.id)}
			<MethodRow
				{method}
				onupdate={(updates) => updateMethod(method.id, updates)}
				ondelete={() => deleteMethod(method.id)}
			/>
		{/each}
		<button
			type="button"
			class="w-full text-left px-2 py-0.5 text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-100"
			onclick={addMethod}
		>
			+ method()
		</button>
	</div>
</div>
