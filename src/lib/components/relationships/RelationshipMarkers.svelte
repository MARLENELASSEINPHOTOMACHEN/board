<script lang="ts">
</script>

<defs>
	<!-- Simple arrow (association) -->
	<marker
		id="arrow-simple"
		viewBox="0 0 10 10"
		refX="10"
		refY="5"
		markerWidth="8"
		markerHeight="8"
		orient="auto-start-reverse"
	>
		<path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#78716c" stroke-width="1.5" />
	</marker>

	<!-- Empty arrow (inheritance, implementation) -->
	<marker
		id="arrow-empty"
		viewBox="0 0 12 12"
		refX="12"
		refY="6"
		markerWidth="10"
		markerHeight="10"
		orient="auto-start-reverse"
	>
		<path d="M 0 0 L 12 6 L 0 12 Z" fill="white" stroke="#78716c" stroke-width="1.5" />
	</marker>

	<!-- Empty diamond (aggregation) -->
	<marker
		id="diamond-empty"
		viewBox="0 0 16 10"
		refX="16"
		refY="5"
		markerWidth="12"
		markerHeight="8"
		orient="auto-start-reverse"
	>
		<path d="M 0 5 L 8 0 L 16 5 L 8 10 Z" fill="white" stroke="#78716c" stroke-width="1.5" />
	</marker>

	<!-- Filled diamond (composition) -->
	<marker
		id="diamond-filled"
		viewBox="0 0 16 10"
		refX="16"
		refY="5"
		markerWidth="12"
		markerHeight="8"
		orient="auto-start-reverse"
	>
		<path d="M 0 5 L 8 0 L 16 5 L 8 10 Z" fill="#78716c" stroke="#78716c" stroke-width="1.5" />
	</marker>
</defs>
