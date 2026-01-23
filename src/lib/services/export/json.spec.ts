import { describe, it, expect } from 'vitest';
import { exportToJson, importFromJson } from './json';
import type { Diagram } from '$lib/types';

function makeDiagram(overrides: Partial<Diagram> = {}): Diagram {
	return {
		id: 'test-diagram-1',
		folderId: null,
		name: 'Test Diagram',
		type: 'class',
		elements: [],
		relationships: [],
		viewport: { x: 0, y: 0, zoom: 1 },
		isTrashed: false,
		...overrides
	};
}

function makeClassElement(id: string, name: string) {
	return {
		id,
		type: 'class' as const,
		name,
		position: { x: 100, y: 100 },
		attributes: [{ id: 'attr-1', name: 'id', dataType: 'number', visibility: 'private' as const }],
		methods: [
			{
				id: 'method-1',
				name: 'getId',
				returnType: 'number',
				visibility: 'public' as const,
				parameters: []
			}
		]
	};
}

function makeNoteElement(id: string, content: string) {
	return {
		id,
		type: 'note' as const,
		content,
		position: { x: 200, y: 200 }
	};
}

function makeRelationship(id: string, sourceId: string, targetId: string) {
	return {
		id,
		type: 'association' as const,
		sourceId,
		targetId,
		anchors: { source: 'right' as const, target: 'left' as const }
	};
}

describe('exportToJson', () => {
	describe('basic export', () => {
		it('exports an empty diagram', () => {
			const diagram = makeDiagram();
			const result = exportToJson({ diagram });

			expect(result.mimeType).toBe('application/json');
			expect(result.filename).toBe('Test Diagram.json');
			expect(result.blob).toBeInstanceOf(Blob);
		});

		it('exports diagram with correct filename based on name', () => {
			const diagram = makeDiagram({ name: 'My UML Class Diagram' });
			const result = exportToJson({ diagram });

			expect(result.filename).toBe('My UML Class Diagram.json');
		});

		it('sanitizes filename with special characters', () => {
			const diagram = makeDiagram({ name: 'Diagram/with:special*chars?' });
			const result = exportToJson({ diagram });

			expect(result.filename).toBe('Diagram_with_special_chars_.json');
		});

		it('exports diagram content as JSON', async () => {
			const diagram = makeDiagram({
				elements: [makeClassElement('c1', 'User')],
				relationships: []
			});

			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			expect(parsed.diagram.elements).toHaveLength(1);
			expect(parsed.diagram.elements[0].name).toBe('User');
		});
	});

	describe('options', () => {
		describe('pretty option', () => {
			it('formats JSON with indentation when pretty is true (default)', async () => {
				const diagram = makeDiagram();
				const result = exportToJson({ diagram, pretty: true });
				const text = await result.blob.text();

				expect(text).toContain('\n');
				expect(text).toContain('\t');
			});

			it('outputs compact JSON when pretty is false', async () => {
				const diagram = makeDiagram();
				const result = exportToJson({ diagram, pretty: false });
				const text = await result.blob.text();

				expect(text).not.toContain('\n');
			});

			it('defaults to pretty formatting', async () => {
				const diagram = makeDiagram();
				const result = exportToJson({ diagram });
				const text = await result.blob.text();

				expect(text).toContain('\n');
			});
		});

		describe('version option', () => {
			it('includes version in export', async () => {
				const diagram = makeDiagram();
				const result = exportToJson({ diagram, version: 1 });
				const text = await result.blob.text();
				const parsed = JSON.parse(text);

				expect(parsed.version).toBe(1);
			});

			it('defaults to version 1', async () => {
				const diagram = makeDiagram();
				const result = exportToJson({ diagram });
				const text = await result.blob.text();
				const parsed = JSON.parse(text);

				expect(parsed.version).toBe(1);
			});

			it('allows custom version number', async () => {
				const diagram = makeDiagram();
				const result = exportToJson({ diagram, version: 2 });
				const text = await result.blob.text();
				const parsed = JSON.parse(text);

				expect(parsed.version).toBe(2);
			});
		});
	});

	describe('complex diagrams', () => {
		it('exports diagram with multiple class elements', async () => {
			const diagram = makeDiagram({
				elements: [
					makeClassElement('c1', 'User'),
					makeClassElement('c2', 'Order'),
					makeClassElement('c3', 'Product')
				]
			});

			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			expect(parsed.diagram.elements).toHaveLength(3);
		});

		it('exports diagram with notes', async () => {
			const diagram = makeDiagram({
				elements: [makeNoteElement('n1', 'This is a note')]
			});

			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			expect(parsed.diagram.elements).toHaveLength(1);
			expect(parsed.diagram.elements[0].type).toBe('note');
			expect(parsed.diagram.elements[0].content).toBe('This is a note');
		});

		it('exports diagram with relationships', async () => {
			const diagram = makeDiagram({
				elements: [makeClassElement('c1', 'User'), makeClassElement('c2', 'Order')],
				relationships: [makeRelationship('r1', 'c1', 'c2')]
			});

			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			expect(parsed.diagram.relationships).toHaveLength(1);
			expect(parsed.diagram.relationships[0].sourceId).toBe('c1');
			expect(parsed.diagram.relationships[0].targetId).toBe('c2');
		});

		it('exports diagram with relationship multiplicities', async () => {
			const diagram = makeDiagram({
				elements: [makeClassElement('c1', 'User'), makeClassElement('c2', 'Order')],
				relationships: [
					{
						...makeRelationship('r1', 'c1', 'c2'),
						sourceMultiplicity: '1',
						targetMultiplicity: '*'
					}
				]
			});

			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			expect(parsed.diagram.relationships[0].sourceMultiplicity).toBe('1');
			expect(parsed.diagram.relationships[0].targetMultiplicity).toBe('*');
		});

		it('preserves viewport settings', async () => {
			const diagram = makeDiagram({
				viewport: { x: 100, y: 200, zoom: 1.5 }
			});

			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			expect(parsed.diagram.viewport.x).toBe(100);
			expect(parsed.diagram.viewport.y).toBe(200);
			expect(parsed.diagram.viewport.zoom).toBe(1.5);
		});

		it('preserves element attributes with all visibility types', async () => {
			const diagram = makeDiagram({
				elements: [
					{
						id: 'c1',
						type: 'class' as const,
						name: 'TestClass',
						position: { x: 0, y: 0 },
						attributes: [
							{ id: 'a1', name: 'publicAttr', dataType: 'string', visibility: 'public' as const },
							{ id: 'a2', name: 'privateAttr', dataType: 'number', visibility: 'private' as const },
							{
								id: 'a3',
								name: 'protectedAttr',
								dataType: 'boolean',
								visibility: 'protected' as const
							}
						],
						methods: []
					}
				]
			});

			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			const attrs = parsed.diagram.elements[0].attributes;
			expect(attrs).toHaveLength(3);
			expect(attrs[0].visibility).toBe('public');
			expect(attrs[1].visibility).toBe('private');
			expect(attrs[2].visibility).toBe('protected');
		});

		it('preserves method parameters', async () => {
			const diagram = makeDiagram({
				elements: [
					{
						id: 'c1',
						type: 'class' as const,
						name: 'TestClass',
						position: { x: 0, y: 0 },
						attributes: [],
						methods: [
							{
								id: 'm1',
								name: 'doSomething',
								returnType: 'void',
								visibility: 'public' as const,
								parameters: [
									{ id: 'p1', name: 'arg1', type: 'string' },
									{ id: 'p2', name: 'arg2', type: 'number' }
								]
							}
						]
					}
				]
			});

			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			const params = parsed.diagram.elements[0].methods[0].parameters;
			expect(params).toHaveLength(2);
			expect(params[0].name).toBe('arg1');
			expect(params[1].type).toBe('number');
		});
	});

	describe('export data structure', () => {
		it('includes exportedAt timestamp', async () => {
			const diagram = makeDiagram();
			const before = Date.now();
			const result = exportToJson({ diagram });
			const after = Date.now();

			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			expect(parsed.exportedAt).toBeDefined();
			const exportedAt = new Date(parsed.exportedAt).getTime();
			expect(exportedAt).toBeGreaterThanOrEqual(before);
			expect(exportedAt).toBeLessThanOrEqual(after);
		});

		it('excludes internal fields from export', async () => {
			const diagram = makeDiagram({ isTrashed: true, folderId: 'folder-123' });
			const result = exportToJson({ diagram });
			const text = await result.blob.text();
			const parsed = JSON.parse(text);

			expect(parsed.diagram.isTrashed).toBeUndefined();
			expect(parsed.diagram.folderId).toBeUndefined();
		});
	});
});

describe('importFromJson', () => {
	describe('valid import', () => {
		it('imports a valid empty diagram', () => {
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				diagram: {
					id: 'imported-1',
					name: 'Imported Diagram',
					type: 'class',
					elements: [],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.diagram.name).toBe('Imported Diagram');
				expect(result.diagram.type).toBe('class');
			}
		});

		it('imports diagram with class elements', () => {
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				diagram: {
					id: 'imported-1',
					name: 'Test',
					type: 'class',
					elements: [makeClassElement('c1', 'User')],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.diagram.elements).toHaveLength(1);
				expect(result.diagram.elements[0].type).toBe('class');
			}
		});

		it('imports diagram with relationships', () => {
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				diagram: {
					id: 'imported-1',
					name: 'Test',
					type: 'class',
					elements: [makeClassElement('c1', 'User'), makeClassElement('c2', 'Order')],
					relationships: [makeRelationship('r1', 'c1', 'c2')],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.diagram.relationships).toHaveLength(1);
			}
		});

		it('generates new IDs for imported diagram and elements', () => {
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				diagram: {
					id: 'original-id',
					name: 'Test',
					type: 'class',
					elements: [makeClassElement('original-el-id', 'User')],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.diagram.id).not.toBe('original-id');
				expect(result.diagram.elements[0].id).not.toBe('original-el-id');
			}
		});

		it('remaps relationship IDs when generating new element IDs', () => {
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				diagram: {
					id: 'imported-1',
					name: 'Test',
					type: 'class',
					elements: [makeClassElement('old-c1', 'User'), makeClassElement('old-c2', 'Order')],
					relationships: [makeRelationship('old-r1', 'old-c1', 'old-c2')],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(true);
			if (result.success) {
				const rel = result.diagram.relationships[0];
				const el1 = result.diagram.elements[0];
				const el2 = result.diagram.elements[1];

				expect(rel.sourceId).toBe(el1.id);
				expect(rel.targetId).toBe(el2.id);
				expect(rel.sourceId).not.toBe('old-c1');
			}
		});

		it('sets default values for imported diagram', () => {
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.diagram.folderId).toBeNull();
				expect(result.diagram.isTrashed).toBe(false);
			}
		});
	});

	describe('validation errors', () => {
		it('fails on invalid JSON syntax', () => {
			const result = importFromJson('{ invalid json }');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Invalid JSON format');
			}
		});

		it('fails when version is missing', () => {
			const json = JSON.stringify({
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Missing or invalid version');
			}
		});

		it('fails when version is not a number', () => {
			const json = JSON.stringify({
				version: '1',
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Missing or invalid version');
			}
		});

		it('fails when diagram is missing', () => {
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString()
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Missing diagram data');
			}
		});

		it('fails when diagram name is missing', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					type: 'class',
					elements: [],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Missing diagram name');
			}
		});

		it('fails when diagram type is invalid', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'invalid',
					elements: [],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Invalid diagram type');
			}
		});

		it('fails when elements is not an array', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: 'not an array',
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Elements must be an array');
			}
		});

		it('fails when relationships is not an array', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [],
					relationships: 'not an array',
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Relationships must be an array');
			}
		});

		it('fails when viewport is missing', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [],
					relationships: []
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Missing or invalid viewport');
			}
		});

		it('fails when viewport has invalid structure', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [],
					relationships: [],
					viewport: { x: 0 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors).toContain('Missing or invalid viewport');
			}
		});
	});

	describe('element validation', () => {
		it('fails when class element has invalid type', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [{ id: 'c1', type: 'invalid', name: 'Test', position: { x: 0, y: 0 } }],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Invalid element type'))).toBe(true);
			}
		});

		it('fails when element is missing position', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [{ id: 'c1', type: 'class', name: 'Test' }],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Missing or invalid position'))).toBe(true);
			}
		});

		it('fails when class element is missing name', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [{ id: 'c1', type: 'class', position: { x: 0, y: 0 } }],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Missing class name'))).toBe(true);
			}
		});

		it('fails when note element is missing content', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [{ id: 'n1', type: 'note', position: { x: 0, y: 0 } }],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Missing note content'))).toBe(true);
			}
		});

		it('fails when attribute is missing name', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [
						{
							id: 'c1',
							type: 'class',
							name: 'TestClass',
							position: { x: 0, y: 0 },
							attributes: [{ dataType: 'string', visibility: 'public' }],
							methods: []
						}
					],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Attribute 0 missing name'))).toBe(true);
			}
		});

		it('fails when attribute is missing dataType', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [
						{
							id: 'c1',
							type: 'class',
							name: 'TestClass',
							position: { x: 0, y: 0 },
							attributes: [{ name: 'id', visibility: 'public' }],
							methods: []
						}
					],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Attribute 0 missing dataType'))).toBe(true);
			}
		});

		it('fails when attribute is missing visibility', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [
						{
							id: 'c1',
							type: 'class',
							name: 'TestClass',
							position: { x: 0, y: 0 },
							attributes: [{ name: 'id', dataType: 'number' }],
							methods: []
						}
					],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Attribute 0 has invalid visibility'))).toBe(
					true
				);
			}
		});

		it('fails when method is missing name', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [
						{
							id: 'c1',
							type: 'class',
							name: 'TestClass',
							position: { x: 0, y: 0 },
							attributes: [],
							methods: [{ returnType: 'void', visibility: 'public', parameters: [] }]
						}
					],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Method 0 missing name'))).toBe(true);
			}
		});

		it('fails when method is missing returnType', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [
						{
							id: 'c1',
							type: 'class',
							name: 'TestClass',
							position: { x: 0, y: 0 },
							attributes: [],
							methods: [{ name: 'doThing', visibility: 'public', parameters: [] }]
						}
					],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Method 0 missing returnType'))).toBe(true);
			}
		});

		it('fails when method is missing visibility', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [
						{
							id: 'c1',
							type: 'class',
							name: 'TestClass',
							position: { x: 0, y: 0 },
							attributes: [],
							methods: [{ name: 'doThing', returnType: 'void', parameters: [] }]
						}
					],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Method 0 has invalid visibility'))).toBe(true);
			}
		});

		it('fails when method parameter is missing name', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [
						{
							id: 'c1',
							type: 'class',
							name: 'TestClass',
							position: { x: 0, y: 0 },
							attributes: [],
							methods: [
								{
									name: 'doThing',
									returnType: 'void',
									visibility: 'public',
									parameters: [{ type: 'string' }]
								}
							]
						}
					],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Method 0 parameter 0 missing name'))).toBe(
					true
				);
			}
		});

		it('fails when method parameter is missing type', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [
						{
							id: 'c1',
							type: 'class',
							name: 'TestClass',
							position: { x: 0, y: 0 },
							attributes: [],
							methods: [
								{
									name: 'doThing',
									returnType: 'void',
									visibility: 'public',
									parameters: [{ name: 'arg' }]
								}
							]
						}
					],
					relationships: [],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Method 0 parameter 0 missing type'))).toBe(
					true
				);
			}
		});
	});

	describe('relationship validation', () => {
		it('fails when relationship has invalid type', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [makeClassElement('c1', 'A'), makeClassElement('c2', 'B')],
					relationships: [
						{
							id: 'r1',
							type: 'invalid-type',
							sourceId: 'c1',
							targetId: 'c2',
							anchors: { source: 'right', target: 'left' }
						}
					],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Invalid relationship type'))).toBe(true);
			}
		});

		it('fails when relationship is missing sourceId', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [makeClassElement('c1', 'A'), makeClassElement('c2', 'B')],
					relationships: [
						{
							id: 'r1',
							type: 'association',
							targetId: 'c2',
							anchors: { source: 'right', target: 'left' }
						}
					],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Missing sourceId or targetId'))).toBe(true);
			}
		});

		it('fails when relationship references non-existent element', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [makeClassElement('c1', 'A')],
					relationships: [
						{
							id: 'r1',
							type: 'association',
							sourceId: 'c1',
							targetId: 'nonexistent',
							anchors: { source: 'right', target: 'left' }
						}
					],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('references non-existent element'))).toBe(true);
			}
		});

		it('fails when relationship has invalid anchor', () => {
			const json = JSON.stringify({
				version: 1,
				diagram: {
					id: 'test',
					name: 'Test',
					type: 'class',
					elements: [makeClassElement('c1', 'A'), makeClassElement('c2', 'B')],
					relationships: [
						{
							id: 'r1',
							type: 'association',
							sourceId: 'c1',
							targetId: 'c2',
							anchors: { source: 'invalid', target: 'left' }
						}
					],
					viewport: { x: 0, y: 0, zoom: 1 }
				}
			});

			const result = importFromJson(json);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors.some((e) => e.includes('Invalid anchor'))).toBe(true);
			}
		});
	});

	describe('roundtrip', () => {
		it('export and import preserves diagram structure', async () => {
			const original = makeDiagram({
				name: 'Roundtrip Test',
				elements: [
					makeClassElement('c1', 'User'),
					makeClassElement('c2', 'Order'),
					makeNoteElement('n1', 'Important note')
				],
				relationships: [
					{
						...makeRelationship('r1', 'c1', 'c2'),
						sourceMultiplicity: '1',
						targetMultiplicity: '*',
						label: 'places'
					}
				],
				viewport: { x: 50, y: 100, zoom: 1.5 }
			});

			const exportResult = exportToJson({ diagram: original });
			const json = await exportResult.blob.text();
			const importResult = importFromJson(json);

			expect(importResult.success).toBe(true);
			if (importResult.success) {
				const imported = importResult.diagram;

				expect(imported.name).toBe(original.name);
				expect(imported.type).toBe(original.type);
				expect(imported.elements).toHaveLength(original.elements.length);
				expect(imported.relationships).toHaveLength(original.relationships.length);
				expect(imported.viewport).toEqual(original.viewport);

				const importedRel = imported.relationships[0];
				expect(importedRel.sourceMultiplicity).toBe('1');
				expect(importedRel.targetMultiplicity).toBe('*');
				expect(importedRel.label).toBe('places');
			}
		});
	});
});
