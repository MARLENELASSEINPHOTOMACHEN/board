import type { DiagramElement } from '$lib/types/elements';
import type { Relationship } from '$lib/types/relationships';

const MAX_HISTORY_SIZE = 50;

export interface HistoryState {
	elements: DiagramElement[];
	relationships: Relationship[];
}

interface HistoryEntry {
	state: HistoryState;
	description: string;
}

interface DiagramHistory {
	undoStack: HistoryEntry[];
	redoStack: HistoryEntry[];
	currentState: HistoryState;
}

function createHistoryManager() {
	const savedHistories = new Map<string, DiagramHistory>();

	let activeDiagramId = $state<string | null>(null);
	let undoStack = $state<HistoryEntry[]>([]);
	let redoStack = $state<HistoryEntry[]>([]);
	let currentState = $state<HistoryState>({ elements: [], relationships: [] });

	// two-phase commit pattern for undo history:
	// 1. updateState() captures pre-change snapshot if none pending then applies changes
	// 2. push() stores the pending snapshot to undo stack and clears it
	// this ensures undo restores to the state BEFORE changes - not after
	let pendingSnapshot: HistoryState | null = null;

	function saveCurrentToMap() {
		if (activeDiagramId) {
			savedHistories.set(activeDiagramId, {
				undoStack: $state.snapshot(undoStack),
				redoStack: $state.snapshot(redoStack),
				currentState: $state.snapshot(currentState)
			});
		}
	}

	function loadFromMap(diagramId: string): boolean {
		const saved = savedHistories.get(diagramId);
		if (saved) {
			undoStack = saved.undoStack;
			redoStack = saved.redoStack;
			currentState = saved.currentState;
			return true;
		}
		return false;
	}

	return {
		get current() {
			return currentState;
		},

		get canUndo() {
			return undoStack.length > 0;
		},

		get canRedo() {
			return redoStack.length > 0;
		},

		get activeDiagramId() {
			return activeDiagramId;
		},

		switchToDiagram(diagramId: string, initialState?: HistoryState) {
			saveCurrentToMap();

			if (loadFromMap(diagramId)) {
				activeDiagramId = diagramId;
				pendingSnapshot = null;
				return;
			}

			if (!initialState) {
				throw new Error(`No history for diagram ${diagramId} and no initial state provided`);
			}

			undoStack = [];
			redoStack = [];
			currentState = initialState;
			activeDiagramId = diagramId;
			pendingSnapshot = null;
		},

		clearDiagram(diagramId: string) {
			savedHistories.delete(diagramId);
			if (activeDiagramId === diagramId) {
				activeDiagramId = null;
				undoStack = [];
				redoStack = [];
				currentState = { elements: [], relationships: [] };
				pendingSnapshot = null;
			}
		},

		updateState(state: Partial<HistoryState>) {
			if (!activeDiagramId) {
				throw new Error('No active diagram');
			}
			if (pendingSnapshot === null) {
				pendingSnapshot = $state.snapshot(currentState);
			}
			currentState = {
				...currentState,
				...state
			};
		},

		push(description: string) {
			if (!activeDiagramId) {
				throw new Error('No active diagram');
			}
			if (pendingSnapshot === null) {
				return;
			}

			undoStack = [...undoStack.slice(-(MAX_HISTORY_SIZE - 1)), { state: pendingSnapshot, description }];
			redoStack = [];
			pendingSnapshot = null;
		},

		undo(): HistoryState | null {
			if (!activeDiagramId) {
				throw new Error('No active diagram');
			}
			if (undoStack.length === 0) return null;

			const entry = undoStack[undoStack.length - 1];
			undoStack = undoStack.slice(0, -1);
			redoStack = [...redoStack, { state: $state.snapshot(currentState), description: entry.description }];
			currentState = entry.state;
			pendingSnapshot = null;
			return currentState;
		},

		redo(): HistoryState | null {
			if (!activeDiagramId) {
				throw new Error('No active diagram');
			}
			if (redoStack.length === 0) return null;

			const entry = redoStack[redoStack.length - 1];
			redoStack = redoStack.slice(0, -1);
			undoStack = [...undoStack, { state: $state.snapshot(currentState), description: entry.description }];
			currentState = entry.state;
			pendingSnapshot = null;
			return currentState;
		}
	};
}

export const historyManager = createHistoryManager();
