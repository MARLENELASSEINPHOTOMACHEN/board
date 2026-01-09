import type { Project, Diagram, Folder } from '$lib/types';
import { generateId } from '$lib/utils';
import { storage } from '$lib/services/storage';
import { diagram as diagramStore } from './diagram.svelte';

function createProjectStore() {
	let currentProject = $state<Project | null>(null);
	let diagrams = $state<Diagram[]>([]);
	let folders = $state<Folder[]>([]);
	let isLoading = $state(true);

	return {
		get project() {
			return currentProject;
		},

		get diagrams(): Diagram[] {
			return diagrams;
		},

		get folders(): Folder[] {
			return folders;
		},

		get isLoading() {
			return isLoading;
		},

		async initialize() {
			isLoading = true;
			try {
				const projects = await storage.getAllProjects();

				if (projects.length === 0) {
					const project = await this.createProject('My Project');
					await this.createDiagram('Untitled Diagram');
					return project;
				}

				const lastProjectId = await storage.getSetting<string>('lastProjectId');
				const projectToLoad = lastProjectId
					? projects.find((p) => p.id === lastProjectId) ?? projects[0]
					: projects[0];

				await this.loadProject(projectToLoad.id);

				const lastDiagramId = await storage.getSetting<string>('lastDiagramId');
				if (lastDiagramId) {
					const diagramToLoad = diagrams.find((d) => d.id === lastDiagramId);
					if (diagramToLoad) {
						await this.openDiagram(lastDiagramId);
					} else if (diagrams.length > 0) {
						await this.openDiagram(diagrams[0].id);
					}
				} else if (diagrams.length > 0) {
					await this.openDiagram(diagrams[0].id);
				}

				return projectToLoad;
			} finally {
				isLoading = false;
			}
		},

		async loadProject(projectId: string) {
			const project = await storage.getProject(projectId);
			if (!project) throw new Error(`Project ${projectId} not found`);

			currentProject = project;
			diagrams = await storage.getDiagramsByProject(projectId);
			folders = await storage.getFoldersByProject(projectId);

			await storage.setSetting('lastProjectId', projectId);
		},

		async createProject(name: string): Promise<Project> {
			const project: Project = {
				id: generateId(),
				name,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await storage.saveProject(project);
			currentProject = project;
			diagrams = [];
			folders = [];

			await storage.setSetting('lastProjectId', project.id);
			return project;
		},

		async updateProject(updates: Partial<Pick<Project, 'name'>>) {
			if (!currentProject) return;

			currentProject = {
				...currentProject,
				...updates,
				updatedAt: new Date()
			};

			await storage.saveProject(currentProject);
		},

		async createDiagram(name: string, folderId?: string): Promise<Diagram> {
			if (!currentProject) throw new Error('No project loaded');

			const newDiagram: Diagram = {
				id: generateId(),
				projectId: currentProject.id,
				name,
				type: 'class',
				elements: [],
				relationships: [],
				viewport: { x: 0, y: 0, zoom: 1 },
				createdAt: new Date(),
				updatedAt: new Date()
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
				...updates,
				updatedAt: new Date()
			};

			await storage.saveDiagram(updated);
			diagrams = diagrams.map((d) => (d.id === diagramId ? updated : d));

			if (diagramStore.diagram?.id === diagramId && updates.name) {
				diagramStore.updateName(updates.name);
			}
		},

		async deleteDiagram(diagramId: string) {
			await storage.deleteDiagram(diagramId);
			diagrams = diagrams.filter((d) => d.id !== diagramId);

			diagramStore.clearDiagramHistory(diagramId);

			if (diagramStore.diagram?.id === diagramId) {
				diagramStore.unload();
				if (diagrams.length > 0) {
					await this.openDiagram(diagrams[0].id);
				}
			}
		},

		async createFolder(name: string, parentId: string | null = null): Promise<Folder> {
			if (!currentProject) throw new Error('No project loaded');

			const folder: Folder = {
				id: generateId(),
				projectId: currentProject.id,
				name,
				parentId
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
		},

		async deleteFolder(folderId: string) {
			await storage.deleteFolder(folderId);
			folders = folders.filter((f) => f.id !== folderId);
		}
	};
}

export const project = createProjectStore();
