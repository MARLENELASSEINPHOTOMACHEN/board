const MAX_HISTORY_SIZE = 100;

export interface HistoryEntry<T> {
	state: T;
	description: string;
}

export function createHistoryStore<T>(initialState: T) {
	let undoStack = $state<HistoryEntry<T>[]>([]);
	let redoStack = $state<HistoryEntry<T>[]>([]);
	let currentState = $state<T>(initialState);

	const canUndo = $derived(undoStack.length > 0);
	const canRedo = $derived(redoStack.length > 0);

	function push(state: T, description: string) {
		undoStack = [...undoStack.slice(-MAX_HISTORY_SIZE + 1), { state: currentState, description }];
		redoStack = [];
		currentState = state;
	}

	function undo(): T | null {
		if (undoStack.length === 0) return null;

		const entry = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		redoStack = [...redoStack, { state: currentState, description: entry.description }];
		currentState = entry.state;
		return currentState;
	}

	function redo(): T | null {
		if (redoStack.length === 0) return null;

		const entry = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		undoStack = [...undoStack, { state: currentState, description: entry.description }];
		currentState = entry.state;
		return currentState;
	}

	function clear() {
		undoStack = [];
		redoStack = [];
	}

	function reset(state: T) {
		currentState = state;
		clear();
	}

	return {
		get current() {
			return currentState;
		},
		get canUndo() {
			return canUndo;
		},
		get canRedo() {
			return canRedo;
		},
		push,
		undo,
		redo,
		clear,
		reset
	};
}
