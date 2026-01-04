export interface KeyboardShortcut {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	meta?: boolean;
}

export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
	const ctrlOrMeta = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : (!event.ctrlKey && !event.metaKey);
	const shift = shortcut.shift ? event.shiftKey : !event.shiftKey;
	const alt = shortcut.alt ? event.altKey : !event.altKey;

	return (
		event.key.toLowerCase() === shortcut.key.toLowerCase() &&
		ctrlOrMeta &&
		shift &&
		alt
	);
}

export const SHORTCUTS = {
	UNDO: { key: 'z', ctrl: true },
	REDO: { key: 'z', ctrl: true, shift: true },
	REDO_ALT: { key: 'y', ctrl: true },
	DELETE: { key: 'Delete' },
	BACKSPACE: { key: 'Backspace' },
	ESCAPE: { key: 'Escape' }
} as const;
