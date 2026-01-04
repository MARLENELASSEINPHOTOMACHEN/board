<script lang="ts">
	import type { Visibility } from '$lib/types';

	interface Props {
		visibility: Visibility;
		onclick?: () => void;
	}

	let { visibility, onclick }: Props = $props();

	const symbols: Record<Visibility, string> = {
		public: '+',
		private: '-',
		protected: '#'
	};
</script>

<button
	type="button"
	class="w-4 text-center font-mono text-stone-600 hover:text-stone-900 focus:outline-none"
	onclick={onclick}
	title={visibility}
>
	{symbols[visibility]}
</button>
