import type { Diagram } from '$lib/types';
import type { Rect } from '$lib/types/geometry';

export interface ExportResult {
	blob: Blob;
	filename: string;
	mimeType: string;
}

export interface JsonExportOptions {
	diagram: Diagram;
	pretty?: boolean;
	version?: number;
}

export const JSON_DEFAULTS = {
	pretty: true,
	version: 1
} as const;

export interface BaseVisualExportOptions {
	diagram: Diagram;
	elementRects: Map<string, Rect>;
	elements?: 'all' | string[];
	padding?: number;
}

export interface PngExportOptions extends BaseVisualExportOptions {
	scale?: number;
	background?: string;
}

export const PNG_DEFAULTS = {
	elements: 'all',
	padding: 40,
	scale: 2,
	background: '#faf8f4'
} as const;

export type ImportResult =
	| { success: true; diagram: Diagram }
	| { success: false; errors: string[] };
