<script lang="ts">
	import { onMount } from 'svelte';
	import { project } from '$lib/stores';
	import { Sidebar } from '$lib/components/sidebar';
	import { Header } from '$lib/components/header';
	import { Toolbar } from '$lib/components/toolbar';
	import DiagramView from '$lib/components/DiagramView.svelte';

	onMount(() => {
		project.initialize();
	});
</script>

<div class="h-screen flex flex-col overflow-hidden bg-stone-100">
	<Header />

	<div class="flex flex-1 overflow-hidden">
		<Sidebar />

		<main class="flex-1 relative overflow-hidden">
			{#if project.isLoading}
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
