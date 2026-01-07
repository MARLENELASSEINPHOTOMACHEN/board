<script lang="ts">
	interface Props {
		value: string;
		onchange: (value: string) => void;
		placeholder?: string;
		class?: string;
	}

	let { value, onchange, placeholder = '', class: className = '' }: Props = $props();

	let isEditing = $state(false);
	let inputRef: HTMLInputElement | undefined = $state();
	let editValue = $state('');

	function startEdit() {
		editValue = value;
		isEditing = true;
	}

	function commitEdit() {
		if (isEditing) {
			isEditing = false;
			if (editValue !== value) {
				onchange(editValue);
			}
		}
	}

	function cancelEdit() {
		isEditing = false;
		editValue = value;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitEdit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEdit();
		}
	}

	$effect(() => {
		if (isEditing && inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});
</script>

{#if isEditing}
	<input
		bind:this={inputRef}
		type="text"
		bind:value={editValue}
		onblur={commitEdit}
		onkeydown={handleKeydown}
		class="bg-white border border-stone-400 px-1 py-0 text-sm font-mono outline-none focus:border-stone-600 {className}"
		{placeholder}
	/>
{:else}
	<span
		class="cursor-text select-none {className}"
		onmousedown={(e) => e.stopPropagation()}
		ondblclick={startEdit}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && startEdit()}
	>
		{value || placeholder}
	</span>
{/if}
