// type assertion exception: JSON parsing requires runtime validation followed by type assertions.
// we validate structure thoroughly in importFromJson before casting. the alternative would be
// a schema library like Zod but we've chosen to keep dependencies minimal.

import type {
	Diagram,
	DiagramElement,
	Relationship,
	RelationshipType,
	AnchorPoint
} from '$lib/types';
import type { Viewport } from '$lib/types/geometry';
import type { JsonExportOptions, ExportResult, ImportResult } from './types';
import { JSON_DEFAULTS } from './types';
import { generateId } from '$lib/utils/id';

type ExportedDiagram = Omit<Diagram, 'isTrashed' | 'folderId'>;

interface ExportPayload {
	version: number;
	exportedAt: string;
	diagram: ExportedDiagram;
}

function sanitizeFilename(name: string): string {
	return name.replace(/[/\\:*?"<>|]/g, '_');
}

export function exportToJson(options: JsonExportOptions): ExportResult {
	const { diagram, pretty = JSON_DEFAULTS.pretty, version = JSON_DEFAULTS.version } = options;

	const exportedDiagram: ExportedDiagram = {
		id: diagram.id,
		name: diagram.name,
		type: diagram.type,
		elements: diagram.elements,
		relationships: diagram.relationships,
		viewport: diagram.viewport
	};

	const payload: ExportPayload = {
		version,
		exportedAt: new Date().toISOString(),
		diagram: exportedDiagram
	};

	const json = pretty ? JSON.stringify(payload, null, '\t') : JSON.stringify(payload);

	const blob = new Blob([json], { type: 'application/json' });
	const filename = `${sanitizeFilename(diagram.name)}.json`;

	return {
		blob,
		filename,
		mimeType: 'application/json'
	};
}

const VALID_DIAGRAM_TYPES = ['class'];
const VALID_ELEMENT_TYPES = ['class', 'abstract', 'interface', 'note'];
const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
	'association',
	'inheritance',
	'implementation',
	'aggregation',
	'composition'
];
const VALID_ANCHORS: AnchorPoint[] = ['top', 'bottom', 'left', 'right', 'auto'];
const VALID_VISIBILITIES = ['public', 'private', 'protected'];

function isValidViewport(viewport: unknown): viewport is Viewport {
	if (typeof viewport !== 'object' || viewport === null) return false;
	const v = viewport as Record<string, unknown>;
	return typeof v.x === 'number' && typeof v.y === 'number' && typeof v.zoom === 'number';
}

function isValidPosition(pos: unknown): pos is { x: number; y: number } {
	if (typeof pos !== 'object' || pos === null) return false;
	const p = pos as Record<string, unknown>;
	return typeof p.x === 'number' && typeof p.y === 'number';
}

function validateElement(element: unknown, index: number): string[] {
	const errors: string[] = [];
	const prefix = `Element ${index}`;

	if (typeof element !== 'object' || element === null) {
		errors.push(`${prefix}: Invalid element data`);
		return errors;
	}

	const el = element as Record<string, unknown>;

	if (!el.type || !VALID_ELEMENT_TYPES.includes(el.type as string)) {
		errors.push(`${prefix}: Invalid element type "${el.type}"`);
		return errors;
	}

	if (!isValidPosition(el.position)) {
		errors.push(`${prefix}: Missing or invalid position`);
	}

	if (el.type === 'note') {
		if (typeof el.content !== 'string') {
			errors.push(`${prefix}: Missing note content`);
		}
	} else {
		if (typeof el.name !== 'string') {
			errors.push(`${prefix}: Missing class name`);
		}

		if (el.attributes !== undefined && Array.isArray(el.attributes)) {
			for (let i = 0; i < el.attributes.length; i++) {
				const attr = el.attributes[i] as Record<string, unknown>;
				if (typeof attr !== 'object' || attr === null) {
					errors.push(`${prefix}: Attribute ${i} is invalid`);
					continue;
				}
				if (typeof attr.name !== 'string') {
					errors.push(`${prefix}: Attribute ${i} missing name`);
				}
				if (typeof attr.dataType !== 'string') {
					errors.push(`${prefix}: Attribute ${i} missing dataType`);
				}
				if (typeof attr.visibility !== 'string' || !VALID_VISIBILITIES.includes(attr.visibility)) {
					errors.push(`${prefix}: Attribute ${i} has invalid visibility`);
				}
			}
		}

		if (el.methods !== undefined && Array.isArray(el.methods)) {
			for (let i = 0; i < el.methods.length; i++) {
				const method = el.methods[i] as Record<string, unknown>;
				if (typeof method !== 'object' || method === null) {
					errors.push(`${prefix}: Method ${i} is invalid`);
					continue;
				}
				if (typeof method.name !== 'string') {
					errors.push(`${prefix}: Method ${i} missing name`);
				}
				if (typeof method.returnType !== 'string') {
					errors.push(`${prefix}: Method ${i} missing returnType`);
				}
				if (typeof method.visibility !== 'string' || !VALID_VISIBILITIES.includes(method.visibility)) {
					errors.push(`${prefix}: Method ${i} has invalid visibility`);
				}
				if (method.parameters !== undefined && Array.isArray(method.parameters)) {
					for (let j = 0; j < method.parameters.length; j++) {
						const param = method.parameters[j] as Record<string, unknown>;
						if (typeof param !== 'object' || param === null) {
							errors.push(`${prefix}: Method ${i} parameter ${j} is invalid`);
							continue;
						}
						if (typeof param.name !== 'string') {
							errors.push(`${prefix}: Method ${i} parameter ${j} missing name`);
						}
						if (typeof param.type !== 'string') {
							errors.push(`${prefix}: Method ${i} parameter ${j} missing type`);
						}
					}
				}
			}
		}
	}

	return errors;
}

function validateRelationship(rel: unknown, index: number, elementIds: Set<string>): string[] {
	const errors: string[] = [];
	const prefix = `Relationship ${index}`;

	if (typeof rel !== 'object' || rel === null) {
		errors.push(`${prefix}: Invalid relationship data`);
		return errors;
	}

	const r = rel as Record<string, unknown>;

	if (!r.type || !VALID_RELATIONSHIP_TYPES.includes(r.type as RelationshipType)) {
		errors.push(`${prefix}: Invalid relationship type "${r.type}"`);
	}

	if (typeof r.sourceId !== 'string' || typeof r.targetId !== 'string') {
		errors.push(`${prefix}: Missing sourceId or targetId`);
	} else {
		if (!elementIds.has(r.sourceId as string)) {
			errors.push(`${prefix}: sourceId references non-existent element "${r.sourceId}"`);
		}
		if (!elementIds.has(r.targetId as string)) {
			errors.push(`${prefix}: targetId references non-existent element "${r.targetId}"`);
		}
	}

	if (typeof r.anchors === 'object' && r.anchors !== null) {
		const anchors = r.anchors as Record<string, unknown>;
		if (anchors.source && !VALID_ANCHORS.includes(anchors.source as AnchorPoint)) {
			errors.push(`${prefix}: Invalid anchor source "${anchors.source}"`);
		}
		if (anchors.target && !VALID_ANCHORS.includes(anchors.target as AnchorPoint)) {
			errors.push(`${prefix}: Invalid anchor target "${anchors.target}"`);
		}
	}

	return errors;
}

export function importFromJson(json: string): ImportResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return { success: false, errors: ['Invalid JSON format'] };
	}

	const errors: string[] = [];

	if (typeof parsed !== 'object' || parsed === null) {
		return { success: false, errors: ['Invalid data format'] };
	}

	const data = parsed as Record<string, unknown>;

	if (typeof data.version !== 'number') {
		errors.push('Missing or invalid version');
	}

	if (typeof data.diagram !== 'object' || data.diagram === null) {
		errors.push('Missing diagram data');
		return { success: false, errors };
	}

	const diagramData = data.diagram as Record<string, unknown>;

	if (typeof diagramData.name !== 'string') {
		errors.push('Missing diagram name');
	}

	if (!VALID_DIAGRAM_TYPES.includes(diagramData.type as string)) {
		errors.push('Invalid diagram type');
	}

	if (!Array.isArray(diagramData.elements)) {
		errors.push('Elements must be an array');
	}

	if (!Array.isArray(diagramData.relationships)) {
		errors.push('Relationships must be an array');
	}

	if (!isValidViewport(diagramData.viewport)) {
		errors.push('Missing or invalid viewport');
	}

	if (errors.length > 0) {
		return { success: false, errors };
	}

	const elements = diagramData.elements as unknown[];
	const relationships = diagramData.relationships as unknown[];

	const originalElementIds = new Set<string>();
	for (const el of elements) {
		if (typeof el === 'object' && el !== null) {
			const elem = el as Record<string, unknown>;
			if (typeof elem.id === 'string') {
				originalElementIds.add(elem.id);
			}
		}
	}

	for (let i = 0; i < elements.length; i++) {
		errors.push(...validateElement(elements[i], i));
	}

	for (let i = 0; i < relationships.length; i++) {
		errors.push(...validateRelationship(relationships[i], i, originalElementIds));
	}

	if (errors.length > 0) {
		return { success: false, errors };
	}

	const idMap = new Map<string, string>();
	const newDiagramId = generateId();
	idMap.set(diagramData.id as string, newDiagramId);

	const newElements: DiagramElement[] = elements.map((el) => {
		const elem = el as Record<string, unknown>;
		const oldId = elem.id as string;
		const newId = generateId();
		idMap.set(oldId, newId);

		if (elem.type === 'note') {
			return {
				id: newId,
				type: 'note' as const,
				content: elem.content as string,
				position: elem.position as { x: number; y: number }
			};
		}

		return {
			id: newId,
			type: elem.type as 'class' | 'abstract' | 'interface',
			name: elem.name as string,
			position: elem.position as { x: number; y: number },
			attributes: Array.isArray(elem.attributes)
				? elem.attributes.map((attr: Record<string, unknown>) => ({
						id: generateId(),
						name: attr.name as string,
						dataType: attr.dataType as string,
						visibility: attr.visibility as 'public' | 'private' | 'protected'
					}))
				: [],
			methods: Array.isArray(elem.methods)
				? elem.methods.map((method: Record<string, unknown>) => ({
						id: generateId(),
						name: method.name as string,
						returnType: method.returnType as string,
						visibility: method.visibility as 'public' | 'private' | 'protected',
						parameters: Array.isArray(method.parameters)
							? method.parameters.map((param: Record<string, unknown>) => ({
									id: generateId(),
									name: param.name as string,
									type: param.type as string
								}))
							: []
					}))
				: []
		};
	});

	const newRelationships: Relationship[] = relationships.map((rel) => {
		const r = rel as Record<string, unknown>;
		const anchors = r.anchors as Record<string, unknown>;

		return {
			id: generateId(),
			type: r.type as RelationshipType,
			sourceId: idMap.get(r.sourceId as string) ?? (r.sourceId as string),
			targetId: idMap.get(r.targetId as string) ?? (r.targetId as string),
			anchors: {
				source: (anchors?.source ?? 'auto') as AnchorPoint,
				target: (anchors?.target ?? 'auto') as AnchorPoint
			},
			...(r.sourceMultiplicity !== undefined && {
				sourceMultiplicity: r.sourceMultiplicity as string
			}),
			...(r.targetMultiplicity !== undefined && {
				targetMultiplicity: r.targetMultiplicity as string
			}),
			...(r.label !== undefined && { label: r.label as string })
		};
	});

	const diagram: Diagram = {
		id: newDiagramId,
		folderId: null,
		name: diagramData.name as string,
		type: diagramData.type as 'class',
		elements: newElements,
		relationships: newRelationships,
		viewport: diagramData.viewport as Viewport,
		isTrashed: false
	};

	return { success: true, diagram };
}
