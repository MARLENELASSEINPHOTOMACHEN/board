import type {
	Diagram,
	DiagramElement,
	Relationship,
	Viewport,
	ClassElement,
	Attribute,
	Method
} from '$lib/types';
import { isClassElement } from '$lib/types/elements';
import { historyManager } from './history.svelte';
import { storage } from '$lib/services/storage';

function createDiagramStore() {
	let currentDiagram = $state<Diagram | null>(null);
	let viewport = $state<Viewport>({ x: 0, y: 0, zoom: 1 });

	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	function scheduleAutoSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			if (currentDiagram) {
				storage.saveDiagram(
					$state.snapshot({
						...currentDiagram,
						elements: historyManager.current.elements,
						relationships: historyManager.current.relationships,
						viewport: viewport
					})
				);
			}
		}, 500);
	}

	function pushHistory(description: string) {
		historyManager.push(description);
		scheduleAutoSave();
	}

	return {
		get diagram() {
			return currentDiagram;
		},

		get elements(): DiagramElement[] {
			return historyManager.current.elements;
		},

		get relationships(): Relationship[] {
			return historyManager.current.relationships;
		},

		get viewport(): Viewport {
			return viewport;
		},

		get canUndo() {
			return historyManager.canUndo;
		},

		get canRedo() {
			return historyManager.canRedo;
		},

		load(diagram: Diagram) {
			currentDiagram = diagram;
			viewport = diagram.viewport;
			historyManager.switchToDiagram(diagram.id, {
				elements: diagram.elements,
				relationships: diagram.relationships
			});
		},

		unload() {
			currentDiagram = null;
		},

		clearDiagramHistory(diagramId: string) {
			historyManager.clearDiagram(diagramId);
		},

		undo() {
			const state = historyManager.undo();
			if (state) scheduleAutoSave();
			return state;
		},

		redo() {
			const state = historyManager.redo();
			if (state) scheduleAutoSave();
			return state;
		},

		addElement(element: DiagramElement) {
			historyManager.updateState({
				elements: [...historyManager.current.elements, element]
			});
			pushHistory(`Add ${element.type}`);
		},

		updateElement(id: string, updates: Partial<DiagramElement>) {
			const elements = historyManager.current.elements.map((el): DiagramElement => {
				if (el.id !== id) return el;

				if (isClassElement(el)) {
					return {
						id: el.id,
						type: el.type,
						name: 'name' in updates && updates.name !== undefined ? updates.name : el.name,
						position: updates.position ?? el.position,
						attributes:
							'attributes' in updates && updates.attributes !== undefined
								? updates.attributes
								: el.attributes,
						methods:
							'methods' in updates && updates.methods !== undefined ? updates.methods : el.methods
					};
				}

				return {
					id: el.id,
					type: 'note',
					content:
						'content' in updates && updates.content !== undefined ? updates.content : el.content,
					position: updates.position ?? el.position
				};
			});
			historyManager.updateState({ elements });
			pushHistory('Update element');
		},

		removeElement(id: string) {
			const element = historyManager.current.elements.find((el) => el.id === id);
			if (!element) return;

			this.removeSelected([id], []);
		},

		removeSelected(elementIds: string[], relationshipIds: string[]) {
			const elements = historyManager.current.elements;
			const relationships = historyManager.current.relationships;

			const removedElements = elements.filter((el) => elementIds.includes(el.id));
			const remainingElements = elements.filter((el) => !elementIds.includes(el.id));
			const remainingRelationships = relationships.filter(
				(rel) =>
					!relationshipIds.includes(rel.id) &&
					!elementIds.includes(rel.sourceId) &&
					!elementIds.includes(rel.targetId)
			);

			historyManager.updateState({
				elements: remainingElements,
				relationships: remainingRelationships
			});

			const totalCount = elementIds.length + relationshipIds.length;
			let desc: string;
			if (totalCount === 1) {
				if (elementIds.length === 1 && removedElements.length > 0) {
					desc = `Delete ${removedElements[0].type}`;
				} else {
					desc = 'Delete relationship';
				}
			} else {
				desc = `Delete ${totalCount} items`;
			}

			pushHistory(desc);
		},

		moveElement(id: string, x: number, y: number) {
			const elements = historyManager.current.elements.map((el) => {
				if (el.id === id) {
					return { ...el, position: { x, y } };
				}
				return el;
			});
			historyManager.updateState({ elements });
			scheduleAutoSave();
		},

		moveElements(moves: Array<{ id: string; x: number; y: number }>) {
			const elements = historyManager.current.elements.map((el) => {
				const move = moves.find((m) => m.id === el.id);
				if (move) {
					return { ...el, position: { x: move.x, y: move.y } };
				}
				return el;
			});
			historyManager.updateState({ elements });
			scheduleAutoSave();
		},

		commitMove(id: string) {
			pushHistory('Move element');
		},

		commitMoves(ids: string[]) {
			const desc = ids.length === 1 ? 'Move element' : `Move ${ids.length} elements`;
			pushHistory(desc);
		},

		addAttribute(classId: string, attribute: Attribute) {
			const elements = historyManager.current.elements.map((el) => {
				if (el.id === classId && isClassElement(el)) {
					return { ...el, attributes: [...el.attributes, attribute] };
				}
				return el;
			});
			historyManager.updateState({ elements });
			pushHistory('Add attribute');
		},

		updateAttribute(classId: string, attributeId: string, updates: Partial<Attribute>) {
			const elements = historyManager.current.elements.map((el) => {
				if (el.id === classId && isClassElement(el)) {
					return {
						...el,
						attributes: el.attributes.map((attr) =>
							attr.id === attributeId ? { ...attr, ...updates } : attr
						)
					};
				}
				return el;
			});
			historyManager.updateState({ elements });
			pushHistory('Update attribute');
		},

		removeAttribute(classId: string, attributeId: string) {
			const elements = historyManager.current.elements.map((el) => {
				if (el.id === classId && isClassElement(el)) {
					return {
						...el,
						attributes: el.attributes.filter((attr) => attr.id !== attributeId)
					};
				}
				return el;
			});
			historyManager.updateState({ elements });
			pushHistory('Remove attribute');
		},

		addMethod(classId: string, method: Method) {
			const elements = historyManager.current.elements.map((el) => {
				if (el.id === classId && isClassElement(el)) {
					return { ...el, methods: [...el.methods, method] };
				}
				return el;
			});
			historyManager.updateState({ elements });
			pushHistory('Add method');
		},

		updateMethod(classId: string, methodId: string, updates: Partial<Method>) {
			const elements = historyManager.current.elements.map((el) => {
				if (el.id === classId && isClassElement(el)) {
					return {
						...el,
						methods: el.methods.map((method) =>
							method.id === methodId ? { ...method, ...updates } : method
						)
					};
				}
				return el;
			});
			historyManager.updateState({ elements });
			pushHistory('Update method');
		},

		removeMethod(classId: string, methodId: string) {
			const elements = historyManager.current.elements.map((el) => {
				if (el.id === classId && isClassElement(el)) {
					return {
						...el,
						methods: el.methods.filter((method) => method.id !== methodId)
					};
				}
				return el;
			});
			historyManager.updateState({ elements });
			pushHistory('Remove method');
		},

		addRelationship(relationship: Relationship) {
			historyManager.updateState({
				relationships: [...historyManager.current.relationships, relationship]
			});
			pushHistory('Add relationship');
		},

		updateRelationship(id: string, updates: Partial<Relationship>) {
			const relationships = historyManager.current.relationships.map((rel) =>
				rel.id === id ? { ...rel, ...updates } : rel
			);
			historyManager.updateState({ relationships });
			pushHistory('Update relationship');
		},

		removeRelationship(id: string) {
			this.removeSelected([], [id]);
		},

		setViewport(newViewport: Viewport) {
			viewport = newViewport;
			scheduleAutoSave();
		},

		pan(dx: number, dy: number) {
			viewport = {
				...viewport,
				x: viewport.x + dx,
				y: viewport.y + dy
			};
			scheduleAutoSave();
		},

		zoom(factor: number, centerX: number, centerY: number) {
			const oldZoom = viewport.zoom;
			const newZoom = Math.max(0.1, Math.min(3, oldZoom * factor));

			const wx = (centerX - viewport.x) / oldZoom;
			const wy = (centerY - viewport.y) / oldZoom;

			viewport = {
				x: centerX - wx * newZoom,
				y: centerY - wy * newZoom,
				zoom: newZoom
			};
			scheduleAutoSave();
		},

		updateName(name: string) {
			if (!currentDiagram) return;
			currentDiagram = { ...currentDiagram, name };
			scheduleAutoSave();
		}
	};
}

export const diagram = createDiagramStore();
