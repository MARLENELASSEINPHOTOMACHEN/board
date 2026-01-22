import type { Diagram, Folder } from '$lib/types';
import { generateId } from '$lib/utils';
import { storage } from '$lib/services/storage';
import { diagram as diagramStore } from './diagram.svelte';

function createWorkspaceStore() {
	let diagrams = $state<Diagram[]>([]);
	let folders = $state<Folder[]>([]);
	let isLoading = $state(true);
	let folderExpandState = $state<Record<string, boolean>>({});
	let trashExpanded = $state(false);

	return {
		get diagrams(): Diagram[] {
			return diagrams;
		},

		get folders(): Folder[] {
			return folders;
		},

		get isLoading() {
			return isLoading;
		},

		get activeDiagrams(): Diagram[] {
			return diagrams.filter((d) => !d.isTrashed);
		},

		get activeFolders(): Folder[] {
			return folders.filter((f) => !f.isTrashed);
		},

		get trashedDiagrams(): Diagram[] {
			return diagrams.filter((d) => d.isTrashed);
		},

		get trashedFolders(): Folder[] {
			return folders.filter((f) => f.isTrashed);
		},

		get rootDiagrams(): Diagram[] {
			return diagrams.filter((d) => !d.isTrashed && d.folderId == null);
		},

		get trashExpanded() {
			return trashExpanded;
		},

		getDiagramsByFolder(folderId: string): Diagram[] {
			return diagrams.filter((d) => !d.isTrashed && d.folderId === folderId);
		},

		isFolderExpanded(folderId: string): boolean {
			return folderExpandState[folderId] ?? true;
		},

		toggleFolderExpanded(folderId: string) {
			folderExpandState = {
				...folderExpandState,
				[folderId]: !this.isFolderExpanded(folderId)
			};
			storage.setSetting('folderExpandState', $state.snapshot(folderExpandState));
		},

		toggleTrashExpanded() {
			trashExpanded = !trashExpanded;
			storage.setSetting('trashExpanded', trashExpanded);
		},

		async initialize() {
			isLoading = true;
			try {
				const savedExpandState =
					await storage.getSetting<Record<string, boolean>>('folderExpandState');
				if (savedExpandState) {
					folderExpandState = savedExpandState;
				}
				const savedTrashExpanded = await storage.getSetting<boolean>('trashExpanded');
				if (savedTrashExpanded != null) {
					trashExpanded = savedTrashExpanded;
				}

				diagrams = await storage.getAllDiagrams();
				folders = await storage.getAllFolders();

				const activeDiagrams = this.activeDiagrams;

				// no active diagrams - create a default one
				if (activeDiagrams.length === 0) {
					const newDiagram = await this.createDiagram('Untitled Diagram');
					await this.openDiagram(newDiagram.id);
					return;
				}

				// try to restore last viewed diagram - otherwise open first available
				const lastDiagramId = await storage.getSetting<string>('lastDiagramId');
				const lastDiagram = lastDiagramId ? activeDiagrams.find((d) => d.id === lastDiagramId) : null;
				const diagramToOpen = lastDiagram ?? activeDiagrams[0];
				await this.openDiagram(diagramToOpen.id);
			} finally {
				isLoading = false;
			}
		},

		async createDiagram(name: string, folderId: string | null = null): Promise<Diagram> {
			const newDiagram: Diagram = {
				id: generateId(),
				folderId,
				name,
				type: 'class',
				elements: [],
				relationships: [],
				viewport: { x: 0, y: 0, zoom: 1 },
				isTrashed: false
			};

			await storage.saveDiagram(newDiagram);
			diagrams = [...diagrams, newDiagram];

			return newDiagram;
		},

		async openDiagram(diagramId: string) {
			const diagramData = await storage.getDiagram(diagramId);
			if (!diagramData) throw new Error(`Diagram ${diagramId} not found`);

			diagramStore.load(diagramData);
			await storage.setSetting('lastDiagramId', diagramId);
		},

		async updateDiagram(diagramId: string, updates: Partial<Pick<Diagram, 'name'>>) {
			const idx = diagrams.findIndex((d) => d.id === diagramId);
			if (idx === -1) return;

			const updated = {
				...$state.snapshot(diagrams[idx]),
				...updates
			};

			await storage.saveDiagram(updated);
			diagrams = diagrams.map((d) => (d.id === diagramId ? updated : d));

			if (diagramStore.diagram?.id === diagramId && updates.name) {
				diagramStore.updateName(updates.name);
			}
		},

		// move diagram to folder (or root if folderId is null)
		async moveDiagramToFolder(diagramId: string, folderId: string | null) {
			const idx = diagrams.findIndex((d) => d.id === diagramId);
			if (idx === -1) return;

			const updated: Diagram = {
				...$state.snapshot(diagrams[idx]),
				folderId
			};

			await storage.saveDiagram(updated);
			diagrams = diagrams.map((d) => (d.id === diagramId ? updated : d));
		},

		// soft delete - move to trash
		async trashDiagram(diagramId: string) {
			const idx = diagrams.findIndex((d) => d.id === diagramId);
			if (idx === -1) return;

			const updated: Diagram = {
				...$state.snapshot(diagrams[idx]),
				isTrashed: true
			};

			await storage.saveDiagram(updated);
			diagrams = diagrams.map((d) => (d.id === diagramId ? updated : d));

			if (diagramStore.diagram?.id === diagramId) {
				diagramStore.unload();
				const activeDiagrams = this.activeDiagrams;
				if (activeDiagrams.length > 0) {
					await this.openDiagram(activeDiagrams[0].id);
				} else {
					// last diagram trashed - create a new default one
					const newDiagram = await this.createDiagram('Untitled Diagram');
					await this.openDiagram(newDiagram.id);
				}
			}
		},

		async trashFolder(folderId: string) {
			const folderIdx = folders.findIndex((f) => f.id === folderId);
			if (folderIdx === -1) return;

			const diagramsInFolder = diagrams.filter((d) => d.folderId === folderId);
			for (const d of diagramsInFolder) {
				const updated: Diagram = {
					...$state.snapshot(d),
					isTrashed: true
				};
				await storage.saveDiagram(updated);
			}
			diagrams = diagrams.map((d) =>
				d.folderId === folderId ? { ...d, isTrashed: true } : d
			);

			const updatedFolder: Folder = {
				...$state.snapshot(folders[folderIdx]),
				isTrashed: true
			};
			await storage.saveFolder(updatedFolder);
			folders = folders.map((f) => (f.id === folderId ? updatedFolder : f));

			if (diagramStore.diagram && diagramsInFolder.some((d) => d.id === diagramStore.diagram?.id)) {
				diagramStore.unload();
				const activeDiagrams = this.activeDiagrams;
				if (activeDiagrams.length > 0) {
					await this.openDiagram(activeDiagrams[0].id);
				} else {
					const newDiagram = await this.createDiagram('Untitled Diagram');
					await this.openDiagram(newDiagram.id);
				}
			}
		},

		async restoreDiagram(diagramId: string) {
			const idx = diagrams.findIndex((d) => d.id === diagramId);
			if (idx === -1) return;

			const diagram = diagrams[idx];

			// parent folder trashed? move to root instead
			const parentFolder = diagram.folderId ? folders.find((f) => f.id === diagram.folderId) : null;
			const parentTrashed = parentFolder?.isTrashed === true;

			const updated: Diagram = {
				...$state.snapshot(diagram),
				isTrashed: false,
				folderId: parentTrashed ? null : diagram.folderId
			};

			await storage.saveDiagram(updated);
			diagrams = diagrams.map((d) => (d.id === diagramId ? updated : d));
		},

		async restoreFolder(folderId: string) {
			const folderIdx = folders.findIndex((f) => f.id === folderId);
			if (folderIdx === -1) return;

			const updatedFolder: Folder = {
				...$state.snapshot(folders[folderIdx]),
				isTrashed: false
			};
			await storage.saveFolder(updatedFolder);
			folders = folders.map((f) => (f.id === folderId ? updatedFolder : f));

			const diagramsInFolder = diagrams.filter(
				(d) => d.folderId === folderId && d.isTrashed
			);
			for (const d of diagramsInFolder) {
				const updated: Diagram = {
					...$state.snapshot(d),
					isTrashed: false
				};
				await storage.saveDiagram(updated);
			}
			diagrams = diagrams.map((d) =>
				d.folderId === folderId && d.isTrashed
					? { ...d, isTrashed: false }
					: d
			);
		},

		async permanentlyDeleteDiagram(diagramId: string) {
			await storage.deleteDiagram(diagramId);
			diagrams = diagrams.filter((d) => d.id !== diagramId);
			diagramStore.clearDiagramHistory(diagramId);
		},

		async permanentlyDeleteFolder(folderId: string) {
			const diagramsInFolder = diagrams.filter((d) => d.folderId === folderId);
			for (const d of diagramsInFolder) {
				await storage.deleteDiagram(d.id);
				diagramStore.clearDiagramHistory(d.id);
			}
			diagrams = diagrams.filter((d) => d.folderId !== folderId);

			await storage.deleteFolder(folderId);
			folders = folders.filter((f) => f.id !== folderId);

			if (folderId in folderExpandState) {
				const { [folderId]: _, ...rest } = folderExpandState;
				folderExpandState = rest;
				storage.setSetting('folderExpandState', rest);
			}
		},

		async emptyTrash() {
			const trashedDiagrams = this.trashedDiagrams;
			for (const d of trashedDiagrams) {
				await storage.deleteDiagram(d.id);
				diagramStore.clearDiagramHistory(d.id);
			}
			diagrams = diagrams.filter((d) => !d.isTrashed);

			const trashedFolders = this.trashedFolders;
			const trashedFolderIds = new Set(trashedFolders.map((f) => f.id));
			for (const f of trashedFolders) {
				await storage.deleteFolder(f.id);
			}
			folders = folders.filter((f) => !f.isTrashed);

			const cleanedExpandState = Object.fromEntries(
				Object.entries(folderExpandState).filter(([id]) => !trashedFolderIds.has(id))
			);
			if (Object.keys(cleanedExpandState).length !== Object.keys(folderExpandState).length) {
				folderExpandState = cleanedExpandState;
				storage.setSetting('folderExpandState', cleanedExpandState);
			}
		},

		async createFolder(name: string, parentId: string | null = null): Promise<Folder> {
			const folder: Folder = {
				id: generateId(),
				name,
				parentId,
				isTrashed: false
			};

			await storage.saveFolder(folder);
			folders = [...folders, folder];

			return folder;
		},

		async updateFolder(folderId: string, updates: Partial<Pick<Folder, 'name' | 'parentId'>>) {
			const idx = folders.findIndex((f) => f.id === folderId);
			if (idx === -1) return;

			const updated = { ...folders[idx], ...updates };
			await storage.saveFolder(updated);
			folders = folders.map((f) => (f.id === folderId ? updated : f));
		}
	};
}

export const workspace = createWorkspaceStore();
