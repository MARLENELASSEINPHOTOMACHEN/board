import type { Point } from './geometry';

export type Visibility = 'public' | 'private' | 'protected';

export interface Parameter {
	id: string;
	name: string;
	type: string;
}

export interface Attribute {
	id: string;
	name: string;
	dataType: string;
	visibility: Visibility;
}

export interface Method {
	id: string;
	name: string;
	returnType: string;
	parameters: Parameter[];
	visibility: Visibility;
}

export type ClassType = 'class' | 'abstract' | 'interface';

export interface ClassElement {
	id: string;
	type: ClassType;
	name: string;
	position: Point;
	attributes: Attribute[];
	methods: Method[];
}

export interface NoteElement {
	id: string;
	type: 'note';
	content: string;
	position: Point;
}

export type DiagramElement = ClassElement | NoteElement;

export function isClassElement(element: DiagramElement): element is ClassElement {
	return element.type === 'class' || element.type === 'abstract' || element.type === 'interface';
}

export function isNoteElement(element: DiagramElement): element is NoteElement {
	return element.type === 'note';
}
