import { describe, it, expect, beforeEach } from 'vitest';
import { createHistoryManager, type HistoryState } from './history.svelte';

function makeState(elements: number[], relationships: number[] = []): HistoryState {
	return {
		elements: elements.map((n) => ({
			id: `el-${n}`,
			type: 'class' as const,
			name: `Class${n}`,
			position: { x: n * 100, y: n * 100 },
			attributes: [],
			methods: []
		})),
		relationships: relationships.map((n) => ({
			id: `rel-${n}`,
			type: 'association' as const,
			sourceId: `el-${n}`,
			targetId: `el-${n + 1}`,
			anchors: { source: 'right' as const, target: 'left' as const }
		}))
	};
}

describe('createHistoryManager', () => {
	let history: ReturnType<typeof createHistoryManager>;

	beforeEach(() => {
		history = createHistoryManager();
	});

	describe('initialization', () => {
		it('starts with no active diagram', () => {
			expect(history.activeDiagramId).toBeNull();
		});

		it('starts with empty state', () => {
			expect(history.current).toEqual({ elements: [], relationships: [] });
		});

		it('cannot undo initially', () => {
			expect(history.canUndo).toBe(false);
		});

		it('cannot redo initially', () => {
			expect(history.canRedo).toBe(false);
		});
	});

	describe('switchToDiagram', () => {
		it('switches to a new diagram with initial state', () => {
			const initial = makeState([1, 2]);
			history.switchToDiagram('diagram-1', initial);

			expect(history.activeDiagramId).toBe('diagram-1');
			expect(history.current.elements).toHaveLength(2);
		});

		it('throws when switching to unknown diagram without initial state', () => {
			expect(() => history.switchToDiagram('unknown')).toThrow(
				'No history for diagram unknown and no initial state provided'
			);
		});

		it('preserves history when switching between diagrams', () => {
			history.switchToDiagram('d1', makeState([1]));
			history.updateState(makeState([1, 2]));
			history.push('add element');

			history.switchToDiagram('d2', makeState([10]));
			expect(history.current.elements).toHaveLength(1);
			expect(history.current.elements[0].id).toBe('el-10');

			history.switchToDiagram('d1');
			expect(history.current.elements).toHaveLength(2);
			expect(history.canUndo).toBe(true);
		});

		it('restores existing diagram without initial state', () => {
			history.switchToDiagram('d1', makeState([1]));
			history.switchToDiagram('d2', makeState([2]));
			history.switchToDiagram('d1');

			expect(history.activeDiagramId).toBe('d1');
			expect(history.current.elements[0].id).toBe('el-1');
		});
	});

	describe('updateState', () => {
		beforeEach(() => {
			history.switchToDiagram('test', makeState([1]));
		});

		it('throws when no active diagram', () => {
			const fresh = createHistoryManager();
			expect(() => fresh.updateState(makeState([1]))).toThrow('No active diagram');
		});

		it('updates current state', () => {
			history.updateState(makeState([1, 2, 3]));
			expect(history.current.elements).toHaveLength(3);
		});

		it('merges partial state updates', () => {
			history.updateState({ elements: makeState([1, 2]).elements });
			expect(history.current.elements).toHaveLength(2);
			expect(history.current.relationships).toHaveLength(0);
		});

		it('captures snapshot only on first call before push', () => {
			// first update captures snapshot of initial state
			history.updateState(makeState([1, 2]));
			// second update does NOT recapture - still has initial
			history.updateState(makeState([1, 2, 3]));
			history.push('changes');

			// undo should restore to state BEFORE first update (initial with 1 element)
			history.undo();
			expect(history.current.elements).toHaveLength(1);
		});
	});

	describe('push', () => {
		beforeEach(() => {
			history.switchToDiagram('test', makeState([1]));
		});

		it('throws when no active diagram', () => {
			const fresh = createHistoryManager();
			expect(() => fresh.push('test')).toThrow('No active diagram');
		});

		it('does nothing without prior updateState', () => {
			history.push('nothing');
			expect(history.canUndo).toBe(false);
		});

		it('adds entry to undo stack after updateState', () => {
			history.updateState(makeState([1, 2]));
			history.push('add element');
			expect(history.canUndo).toBe(true);
		});

		it('clears redo stack', () => {
			history.updateState(makeState([1, 2]));
			history.push('add');
			history.undo();
			expect(history.canRedo).toBe(true);

			history.updateState(makeState([1, 2, 3]));
			history.push('add another');
			expect(history.canRedo).toBe(false);
		});

		it('respects max history size of 50', () => {
			for (let i = 0; i < 60; i++) {
				history.updateState(makeState([i]));
				history.push(`change ${i}`);
			}

			let undoCount = 0;
			while (history.canUndo) {
				history.undo();
				undoCount++;
			}
			// should be capped at 50
			expect(undoCount).toBe(50);
		});
	});

	describe('undo', () => {
		beforeEach(() => {
			history.switchToDiagram('test', makeState([1]));
		});

		it('throws when no active diagram', () => {
			const fresh = createHistoryManager();
			expect(() => fresh.undo()).toThrow('No active diagram');
		});

		it('returns null when stack is empty', () => {
			expect(history.undo()).toBeNull();
		});

		it('restores previous state', () => {
			history.updateState(makeState([1, 2]));
			history.push('add');

			const result = history.undo();
			expect(result?.elements).toHaveLength(1);
			expect(history.current.elements).toHaveLength(1);
		});

		it('enables redo after undo', () => {
			history.updateState(makeState([1, 2]));
			history.push('add');
			expect(history.canRedo).toBe(false);

			history.undo();
			expect(history.canRedo).toBe(true);
		});

		it('disables undo after undoing all', () => {
			history.updateState(makeState([1, 2]));
			history.push('add');
			expect(history.canUndo).toBe(true);

			history.undo();
			expect(history.canUndo).toBe(false);
		});

		it('can undo multiple times', () => {
			history.updateState(makeState([1, 2]));
			history.push('add 2');
			history.updateState(makeState([1, 2, 3]));
			history.push('add 3');
			history.updateState(makeState([1, 2, 3, 4]));
			history.push('add 4');

			expect(history.current.elements).toHaveLength(4);

			history.undo();
			expect(history.current.elements).toHaveLength(3);

			history.undo();
			expect(history.current.elements).toHaveLength(2);

			history.undo();
			expect(history.current.elements).toHaveLength(1);
		});
	});

	describe('redo', () => {
		beforeEach(() => {
			history.switchToDiagram('test', makeState([1]));
		});

		it('throws when no active diagram', () => {
			const fresh = createHistoryManager();
			expect(() => fresh.redo()).toThrow('No active diagram');
		});

		it('returns null when stack is empty', () => {
			expect(history.redo()).toBeNull();
		});

		it('restores undone state', () => {
			history.updateState(makeState([1, 2]));
			history.push('add');
			history.undo();

			const result = history.redo();
			expect(result?.elements).toHaveLength(2);
			expect(history.current.elements).toHaveLength(2);
		});

		it('enables undo after redo', () => {
			history.updateState(makeState([1, 2]));
			history.push('add');
			history.undo();
			expect(history.canUndo).toBe(false);

			history.redo();
			expect(history.canUndo).toBe(true);
		});

		it('can redo multiple times', () => {
			history.updateState(makeState([1, 2]));
			history.push('add 2');
			history.updateState(makeState([1, 2, 3]));
			history.push('add 3');

			history.undo();
			history.undo();
			expect(history.current.elements).toHaveLength(1);

			history.redo();
			expect(history.current.elements).toHaveLength(2);

			history.redo();
			expect(history.current.elements).toHaveLength(3);
		});
	});

	describe('clearDiagram', () => {
		it('clears saved history for a diagram', () => {
			history.switchToDiagram('d1', makeState([1]));
			history.updateState(makeState([1, 2]));
			history.push('add');

			history.switchToDiagram('d2', makeState([10]));
			history.clearDiagram('d1');

			// switching back requires initial state since history was cleared
			expect(() => history.switchToDiagram('d1')).toThrow();
		});

		it('resets active diagram when clearing current', () => {
			history.switchToDiagram('d1', makeState([1]));
			history.updateState(makeState([1, 2]));
			history.push('add');

			history.clearDiagram('d1');

			expect(history.activeDiagramId).toBeNull();
			expect(history.current).toEqual({ elements: [], relationships: [] });
			expect(history.canUndo).toBe(false);
		});

		it('does not affect other diagrams', () => {
			history.switchToDiagram('d1', makeState([1]));
			history.switchToDiagram('d2', makeState([2]));

			history.clearDiagram('d1');

			expect(history.activeDiagramId).toBe('d2');
			expect(history.current.elements[0].id).toBe('el-2');
		});
	});

	describe('two-phase commit pattern', () => {
		beforeEach(() => {
			history.switchToDiagram('test', makeState([1]));
		});

		it('undo restores state BEFORE the change - not after', () => {
			// this is the key invariant of two-phase commit
			const beforeChange = history.current.elements.length;

			history.updateState(makeState([1, 2]));
			history.push('add element');

			const afterChange = history.current.elements.length;
			expect(afterChange).toBe(2);

			history.undo();
			expect(history.current.elements.length).toBe(beforeChange);
		});

		it('multiple updateState calls before push only capture first snapshot', () => {
			// initial: 1 element
			history.updateState(makeState([1, 2])); // captures snapshot of [1]
			history.updateState(makeState([1, 2, 3])); // does NOT recapture
			history.updateState(makeState([1, 2, 3, 4])); // does NOT recapture
			history.push('multiple changes');

			expect(history.current.elements).toHaveLength(4);

			history.undo();
			// should go back to initial state with 1 element
			expect(history.current.elements).toHaveLength(1);
		});

		it('push without updateState is a no-op', () => {
			history.push('nothing');
			history.push('still nothing');
			expect(history.canUndo).toBe(false);
		});

		it('undo clears pending snapshot', () => {
			history.updateState(makeState([1, 2]));
			history.push('add');

			// start new change
			history.updateState(makeState([1, 2, 3]));
			// but then undo without pushing
			history.undo();

			// pending snapshot should be cleared
			// so next updateState captures fresh snapshot
			history.updateState(makeState([1, 2]));
			history.push('re-add');

			history.undo();
			// should go back to state after first undo (1 element)
			expect(history.current.elements).toHaveLength(1);
		});

		it('redo clears pending snapshot', () => {
			history.updateState(makeState([1, 2]));
			history.push('add');
			history.undo();

			// start new change
			history.updateState(makeState([1, 2, 3]));
			// but then redo without pushing
			history.redo();

			// at this point we should be at [1, 2]
			// pending snapshot should be cleared
			history.updateState(makeState([1, 2, 3]));
			history.push('add 3');

			history.undo();
			// should go back to [1, 2]
			expect(history.current.elements).toHaveLength(2);
		});

		it('switchToDiagram clears pending snapshot', () => {
			history.updateState(makeState([1, 2]));
			// switch without pushing - pending snapshot should be discarded
			history.switchToDiagram('other', makeState([10]));

			// go back
			history.switchToDiagram('test');

			// should still be at initial state since we never pushed
			// but current state was updated, so we see [1, 2]
			expect(history.current.elements).toHaveLength(2);
			// but canUndo should be false since we never pushed
			expect(history.canUndo).toBe(false);
		});
	});

	describe('diagram isolation', () => {
		it('undo/redo stacks are per-diagram', () => {
			history.switchToDiagram('d1', makeState([1]));
			history.updateState(makeState([1, 2]));
			history.push('add to d1');

			history.switchToDiagram('d2', makeState([10]));
			history.updateState(makeState([10, 20]));
			history.push('add to d2');
			history.undo();

			// d2 is now at initial state
			expect(history.current.elements).toHaveLength(1);
			expect(history.canUndo).toBe(false);
			expect(history.canRedo).toBe(true);

			history.switchToDiagram('d1');
			// d1 should still have its own undo history
			expect(history.current.elements).toHaveLength(2);
			expect(history.canUndo).toBe(true);
			expect(history.canRedo).toBe(false);
		});

		it('clearing one diagram does not affect others', () => {
			history.switchToDiagram('d1', makeState([1]));
			history.updateState(makeState([1, 2]));
			history.push('add');

			history.switchToDiagram('d2', makeState([10]));
			history.updateState(makeState([10, 20]));
			history.push('add');

			history.clearDiagram('d1');

			// d2 should be unaffected
			expect(history.current.elements).toHaveLength(2);
			expect(history.canUndo).toBe(true);
		});
	});
});
