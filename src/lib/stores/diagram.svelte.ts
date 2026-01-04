import type { Diagram, DiagramElement, Relationship, Viewport, ClassElement, Attribute, Method } from '$lib/types';
import { createHistoryStore } from './history.svelte';
import { storage } from '$lib/services/storage';

interface DiagramState {
	elements: DiagramElement[];
	relationships: Relationship[];
	viewport: Viewport;
}

function createDiagramStore() {
	let currentDiagram = $state<Diagram | null>(null);
	const history = createHistoryStore<DiagramState>({
		elements: [],
		relationships: [],
		viewport: { x: 0, y: 0, zoom: 1 }
	});

	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	function scheduleAutoSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			if (currentDiagram) {
				storage.saveDiagram($state.snapshot({
					...currentDiagram,
					elements: history.current.elements,
					relationships: history.current.relationships,
					viewport: history.current.viewport,
					updatedAt: new Date()
				}));
			}
		}, 500);
	}

	function pushHistory(description: string) {
		history.push(
			{
				elements: [...history.current.elements],
				relationships: [...history.current.relationships],
				viewport: { ...history.current.viewport }
			},
			description
		);
		scheduleAutoSave();
	}

	return {
		get diagram() {
			return currentDiagram;
		},

		get elements(): DiagramElement[] {
			return history.current.elements;
		},

		get relationships(): Relationship[] {
			return history.current.relationships;
		},

		get viewport(): Viewport {
			return history.current.viewport;
		},

		get canUndo() {
			return history.canUndo;
		},

		get canRedo() {
			return history.canRedo;
		},

		load(diagram: Diagram) {
			currentDiagram = diagram;
			history.reset({
				elements: diagram.elements,
				relationships: diagram.relationships,
				viewport: diagram.viewport
			});
		},

		unload() {
			currentDiagram = null;
			history.reset({
				elements: [],
				relationships: [],
				viewport: { x: 0, y: 0, zoom: 1 }
			});
		},

		undo() {
			const state = history.undo();
			if (state) scheduleAutoSave();
			return state;
		},

		redo() {
			const state = history.redo();
			if (state) scheduleAutoSave();
			return state;
		},

		addElement(element: DiagramElement) {
			history.current.elements = [...history.current.elements, element];
			pushHistory(`Add ${element.type}`);
		},

		updateElement(id: string, updates: Partial<DiagramElement>) {
			history.current.elements = history.current.elements.map((el) =>
				el.id === id ? { ...el, ...updates } : el
			) as DiagramElement[];
			pushHistory('Update element');
		},

		removeElement(id: string) {
			const element = history.current.elements.find((el) => el.id === id);
			if (!element) return;

			history.current.elements = history.current.elements.filter((el) => el.id !== id);
			history.current.relationships = history.current.relationships.filter(
				(rel) => rel.sourceId !== id && rel.targetId !== id
			);
			pushHistory(`Remove ${element.type}`);
		},

		moveElement(id: string, x: number, y: number) {
			history.current.elements = history.current.elements.map((el) =>
				el.id === id ? { ...el, position: { x, y } } : el
			) as DiagramElement[];
			scheduleAutoSave();
		},

		commitMove(id: string) {
			pushHistory('Move element');
		},

		addAttribute(classId: string, attribute: Attribute) {
			history.current.elements = history.current.elements.map((el) => {
				if (el.id === classId && el.type !== 'note') {
					return { ...el, attributes: [...(el as ClassElement).attributes, attribute] };
				}
				return el;
			}) as DiagramElement[];
			pushHistory('Add attribute');
		},

		updateAttribute(classId: string, attributeId: string, updates: Partial<Attribute>) {
			history.current.elements = history.current.elements.map((el) => {
				if (el.id === classId && el.type !== 'note') {
					return {
						...el,
						attributes: (el as ClassElement).attributes.map((attr) =>
							attr.id === attributeId ? { ...attr, ...updates } : attr
						)
					};
				}
				return el;
			}) as DiagramElement[];
			pushHistory('Update attribute');
		},

		removeAttribute(classId: string, attributeId: string) {
			history.current.elements = history.current.elements.map((el) => {
				if (el.id === classId && el.type !== 'note') {
					return {
						...el,
						attributes: (el as ClassElement).attributes.filter((attr) => attr.id !== attributeId)
					};
				}
				return el;
			}) as DiagramElement[];
			pushHistory('Remove attribute');
		},

		addMethod(classId: string, method: Method) {
			history.current.elements = history.current.elements.map((el) => {
				if (el.id === classId && el.type !== 'note') {
					return { ...el, methods: [...(el as ClassElement).methods, method] };
				}
				return el;
			}) as DiagramElement[];
			pushHistory('Add method');
		},

		updateMethod(classId: string, methodId: string, updates: Partial<Method>) {
			history.current.elements = history.current.elements.map((el) => {
				if (el.id === classId && el.type !== 'note') {
					return {
						...el,
						methods: (el as ClassElement).methods.map((method) =>
							method.id === methodId ? { ...method, ...updates } : method
						)
					};
				}
				return el;
			}) as DiagramElement[];
			pushHistory('Update method');
		},

		removeMethod(classId: string, methodId: string) {
			history.current.elements = history.current.elements.map((el) => {
				if (el.id === classId && el.type !== 'note') {
					return {
						...el,
						methods: (el as ClassElement).methods.filter((method) => method.id !== methodId)
					};
				}
				return el;
			}) as DiagramElement[];
			pushHistory('Remove method');
		},

		addRelationship(relationship: Relationship) {
			history.current.relationships = [...history.current.relationships, relationship];
			pushHistory('Add relationship');
		},

		updateRelationship(id: string, updates: Partial<Relationship>) {
			history.current.relationships = history.current.relationships.map((rel) =>
				rel.id === id ? { ...rel, ...updates } : rel
			);
			pushHistory('Update relationship');
		},

		removeRelationship(id: string) {
			history.current.relationships = history.current.relationships.filter((rel) => rel.id !== id);
			pushHistory('Remove relationship');
		},

		setViewport(viewport: Viewport) {
			history.current.viewport = viewport;
			scheduleAutoSave();
		},

		pan(dx: number, dy: number) {
			history.current.viewport = {
				...history.current.viewport,
				x: history.current.viewport.x + dx,
				y: history.current.viewport.y + dy
			};
			scheduleAutoSave();
		},

		zoom(factor: number, centerX: number, centerY: number) {
			const oldZoom = history.current.viewport.zoom;
			const newZoom = Math.max(0.1, Math.min(3, oldZoom * factor));

			const wx = (centerX - history.current.viewport.x) / oldZoom;
			const wy = (centerY - history.current.viewport.y) / oldZoom;

			history.current.viewport = {
				x: centerX - wx * newZoom,
				y: centerY - wy * newZoom,
				zoom: newZoom
			};
			scheduleAutoSave();
		}
	};
}

export const diagram = createDiagramStore();
