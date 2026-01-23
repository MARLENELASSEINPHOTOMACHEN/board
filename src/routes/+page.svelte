<script lang="ts">
	import { onMount } from 'svelte';
	import { workspace } from '$lib/stores';
	import { Sidebar } from '$lib/components/sidebar';
	import { Header } from '$lib/components/header';
	import { Toolbar } from '$lib/components/toolbar';
	import DiagramView from '$lib/components/DiagramView.svelte';

	onMount(() => {
		workspace.initialize();
	});
</script>

<div class="flex h-screen flex-col overflow-hidden bg-stone-100">
	<Header />

	<div class="flex flex-1 overflow-hidden">
		<Sidebar />

		<main class="relative flex-1 overflow-hidden">
			{#if workspace.isLoading}
				<div class="absolute inset-0 flex items-center justify-center">
					<p class="text-stone-500">Loading...</p>
				</div>
			{:else}
				<DiagramView />
			{/if}
		</main>
	</div>

	<Toolbar />
</div>
