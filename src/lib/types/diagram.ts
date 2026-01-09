import type { Viewport } from './geometry';
import type { DiagramElement } from './elements';
import type { Relationship } from './relationships';

export type DiagramType = 'class';

export interface Diagram {
	id: string;
	folderId: string | null;
	name: string;
	type: DiagramType;
	elements: DiagramElement[];
	relationships: Relationship[];
	viewport: Viewport;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

export interface Folder {
	id: string;
	name: string;
	parentId: string | null;
	deletedAt: Date | null;
}
