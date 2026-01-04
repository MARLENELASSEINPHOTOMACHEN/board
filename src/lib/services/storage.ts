import type { Project, Diagram, Folder } from '$lib/types';

const DB_NAME = 'board-diagrams';
const DB_VERSION = 1;
const REQUIRED_STORES = ['projects', 'diagrams', 'folders', 'settings'] as const;

interface DBSchema {
	projects: Project;
	diagrams: Diagram;
	folders: Folder;
	settings: { key: string; value: unknown };
}

type StoreName = keyof DBSchema;

let dbPromise: Promise<IDBDatabase> | null = null;

function deleteDatabase(): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase(DB_NAME);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
		request.onblocked = () => {
			console.warn('Database deletion blocked. Close other tabs using this app.');
			reject(new Error('Database deletion blocked'));
		};
	});
}

function openDatabaseInternal(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);

		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains('projects')) {
				db.createObjectStore('projects', { keyPath: 'id' });
			}

			if (!db.objectStoreNames.contains('diagrams')) {
				const diagramStore = db.createObjectStore('diagrams', { keyPath: 'id' });
				diagramStore.createIndex('projectId', 'projectId', { unique: false });
			}

			if (!db.objectStoreNames.contains('folders')) {
				const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
				folderStore.createIndex('projectId', 'projectId', { unique: false });
				folderStore.createIndex('parentId', 'parentId', { unique: false });
			}

			if (!db.objectStoreNames.contains('settings')) {
				db.createObjectStore('settings', { keyPath: 'key' });
			}
		};

		request.onblocked = () => {
			console.warn('Database upgrade blocked. Close other tabs using this app.');
		};
	});
}

function openDatabase(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;

	dbPromise = openDatabaseInternal().then(async (db) => {
		const missingStores = REQUIRED_STORES.filter(
			(store) => !db.objectStoreNames.contains(store)
		);

		if (missingStores.length > 0) {
			console.warn(`Database corrupt: missing stores [${missingStores.join(', ')}]. Recreating...`);
			db.close();
			dbPromise = null;
			await deleteDatabase();
			return openDatabaseInternal();
		}

		db.onclose = () => {
			dbPromise = null;
		};

		return db;
	});

	return dbPromise;
}

async function getStore(storeName: StoreName, mode: IDBTransactionMode): Promise<IDBObjectStore> {
	const db = await openDatabase();
	const transaction = db.transaction(storeName, mode);
	return transaction.objectStore(storeName);
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export const storage = {
	async getAllProjects(): Promise<Project[]> {
		const store = await getStore('projects', 'readonly');
		return promisifyRequest(store.getAll());
	},

	async getProject(id: string): Promise<Project | undefined> {
		const store = await getStore('projects', 'readonly');
		return promisifyRequest(store.get(id));
	},

	async saveProject(project: Project): Promise<void> {
		const store = await getStore('projects', 'readwrite');
		await promisifyRequest(store.put(project));
	},

	async deleteProject(id: string): Promise<void> {
		const store = await getStore('projects', 'readwrite');
		await promisifyRequest(store.delete(id));
	},

	async getDiagramsByProject(projectId: string): Promise<Diagram[]> {
		const store = await getStore('diagrams', 'readonly');
		const index = store.index('projectId');
		return promisifyRequest(index.getAll(projectId));
	},

	async getDiagram(id: string): Promise<Diagram | undefined> {
		const store = await getStore('diagrams', 'readonly');
		return promisifyRequest(store.get(id));
	},

	async saveDiagram(diagram: Diagram): Promise<void> {
		const store = await getStore('diagrams', 'readwrite');
		await promisifyRequest(store.put(diagram));
	},

	async deleteDiagram(id: string): Promise<void> {
		const store = await getStore('diagrams', 'readwrite');
		await promisifyRequest(store.delete(id));
	},

	async getFoldersByProject(projectId: string): Promise<Folder[]> {
		const store = await getStore('folders', 'readonly');
		const index = store.index('projectId');
		return promisifyRequest(index.getAll(projectId));
	},

	async saveFolder(folder: Folder): Promise<void> {
		const store = await getStore('folders', 'readwrite');
		await promisifyRequest(store.put(folder));
	},

	async deleteFolder(id: string): Promise<void> {
		const store = await getStore('folders', 'readwrite');
		await promisifyRequest(store.delete(id));
	},

	async getSetting<T>(key: string): Promise<T | undefined> {
		const store = await getStore('settings', 'readonly');
		const result = await promisifyRequest(store.get(key));
		return result?.value as T | undefined;
	},

	async setSetting<T>(key: string, value: T): Promise<void> {
		const store = await getStore('settings', 'readwrite');
		await promisifyRequest(store.put({ key, value }));
	}
};
