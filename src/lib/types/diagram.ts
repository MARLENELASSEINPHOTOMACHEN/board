import type { Viewport } from './geometry';
import type { DiagramElement } from './elements';
import type { Relationship } from './relationships';

export type DiagramType = 'class';

export interface Diagram {
	id: string;
	projectId: string;
	name: string;
	type: DiagramType;
	elements: DiagramElement[];
	relationships: Relationship[];
	viewport: Viewport;
	createdAt: Date;
	updatedAt: Date;
}

export interface Project {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Folder {
	id: string;
	projectId: string;
	name: string;
	parentId: string | null;
}
