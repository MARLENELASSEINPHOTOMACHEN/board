let selectedIds = $state<Set<string>>(new Set());

export const selection = {
	get ids(): ReadonlySet<string> {
		return selectedIds;
	},

	get count(): number {
		return selectedIds.size;
	},

	get isEmpty(): boolean {
		return selectedIds.size === 0;
	},

	isSelected(id: string): boolean {
		return selectedIds.has(id);
	},

	select(id: string) {
		selectedIds = new Set([id]);
	},

	toggle(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	},

	add(id: string) {
		if (!selectedIds.has(id)) {
			selectedIds = new Set([...selectedIds, id]);
		}
	},

	remove(id: string) {
		if (selectedIds.has(id)) {
			const next = new Set(selectedIds);
			next.delete(id);
			selectedIds = next;
		}
	},

	clear() {
		if (selectedIds.size > 0) {
			selectedIds = new Set();
		}
	},

	selectMultiple(ids: string[]) {
		selectedIds = new Set(ids);
	}
};
