<script lang="ts">
	interface Props {
		zoom: number;
	}

	let { zoom }: Props = $props();

	const baseSpacing = 20;
	const dotSize = 1;

	const spacing = $derived(baseSpacing * zoom);
	const adjustedDotSize = $derived(Math.max(1, dotSize * zoom));
</script>

<svg class="absolute inset-0 w-full h-full pointer-events-none">
	<defs>
		<pattern
			id="dot-grid"
			width={spacing}
			height={spacing}
			patternUnits="userSpaceOnUse"
		>
			<circle
				cx={spacing / 2}
				cy={spacing / 2}
				r={adjustedDotSize}
				fill="currentColor"
				class="text-stone-300"
			/>
		</pattern>
	</defs>
	<rect width="100%" height="100%" fill="url(#dot-grid)" />
</svg>
