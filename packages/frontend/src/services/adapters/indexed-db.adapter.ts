import { IStorageAdapter } from './adapter.type';
import type { Matrix, CreateMatrixDto, UpdateMatrixDto } from '../matrix.type';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../project.type';

class IndexedDBAdapter implements IStorageAdapter {
  private dbName = 'flowmatrix';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create or update projects store
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }

        // Create or update matrices store
        if (!db.objectStoreNames.contains('matrices')) {
          const matricesStore = db.createObjectStore('matrices', { keyPath: 'id' });
          // 確保創建 projectId 索引
          matricesStore.createIndex('projectId', 'projectId', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getProjectById(id: string): Promise<Project | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async createProject(data: CreateProjectDto): Promise<Project> {
    const db = await this.ensureDB();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: data.name,
      matrices: data.matrices || [],
      created: new Date(),
      updated: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.add(newProject);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(newProject);
    });
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project | null> {
    const db = await this.ensureDB();
    const project = await this.getProjectById(id);
    if (!project) return null;

    const updatedProject: Project = {
      ...project,
      ...data,
      updated: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.put(updatedProject);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(updatedProject);
    });
  }

  async deleteProject(id: string): Promise<boolean> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  // Matrix operations
  async getAllMatrices(projectId: string): Promise<Matrix[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['matrices'], 'readonly');
      const store = transaction.objectStore('matrices');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onerror = () => {
        console.error('Error fetching matrices:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        const matrices = (request.result || []).map((matrix) => ({
          ...matrix,
          // @ts-ignore: Type conversion needed for compatibility
          id: String(matrix.id),
          // @ts-ignore: Type conversion needed for compatibility
          projectId: String(matrix.projectId),
          created: new Date(matrix.created).toISOString(),
          updated: new Date(matrix.updated).toISOString(),
        }));
        resolve(matrices);
      };
    });
  }

  async getMatrixById(_projectId: string, matrixId: string): Promise<Matrix | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['matrices'], 'readonly');
        const store = transaction.objectStore('matrices');
        const request = store.get(matrixId);

        request.onerror = () => {
          console.error('Error fetching matrix:', request.error);
          reject(request.error);
        };
        request.onsuccess = () => {
          if (!request.result) {
            resolve(null);
            return;
          }
          const matrix = {
            ...request.result,
            // @ts-ignore: Type conversion needed for compatibility
            id: String(request.result.id),
            // @ts-ignore: Type conversion needed for compatibility
            projectId: String(request.result.projectId),
            created: new Date(request.result.created).toISOString(),
            updated: new Date(request.result.updated).toISOString(),
          };
          resolve(matrix);
        };
      } catch (error) {
        console.error('Transaction error:', error);
        reject(error);
      }
    });
  }

  async createMatrix(projectId: string, data: CreateMatrixDto): Promise<Matrix> {
    const db = await this.ensureDB();
    const matrixId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newMatrix: Matrix = {
      // @ts-ignore: Type mismatch between string and number for id/projectId
      id: matrixId,
      // @ts-ignore: Type mismatch between string and number for id/projectId
      projectId: projectId,
      name: data.name,
      description: data.description || '',
      nodes: data.nodes || [],
      edges: data.edges || [],
      created: now,
      updated: now,
    };

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['matrices'], 'readwrite');
        const store = transaction.objectStore('matrices');
        const request = store.add(newMatrix);

        request.onerror = () => {
          console.error('Error creating matrix:', request.error);
          reject(request.error);
        };
        request.onsuccess = () => resolve(newMatrix);
      } catch (error) {
        console.error('Transaction error:', error);
        reject(error);
      }
    });
  }

  async updateMatrix(
    projectId: string,
    matrixId: string,
    data: UpdateMatrixDto
  ): Promise<Matrix | null> {
    const db = await this.ensureDB();
    const existingMatrix = await this.getMatrixById(projectId, matrixId);
    if (!existingMatrix) return null;

    const updatedMatrix: Matrix = {
      ...existingMatrix,
      ...data,
      // @ts-ignore: Type mismatch between string and number for id/projectId
      id: matrixId,
      // @ts-ignore: Type mismatch between string and number for id/projectId
      projectId: projectId,
      updated: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['matrices'], 'readwrite');
      const store = transaction.objectStore('matrices');
      const request = store.put(updatedMatrix);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(updatedMatrix);
    });
  }

  async deleteMatrix(_projectId: string, matrixId: string): Promise<boolean> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['matrices'], 'readwrite');
      const store = transaction.objectStore('matrices');
      const request = store.delete(matrixId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.ensureDB();
      return true;
    } catch (error) {
      console.error('IndexedDB health check failed:', error);
      return false;
    }
  }
}

export const indexedDBAdapter = new IndexedDBAdapter();
