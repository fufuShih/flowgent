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

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
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
    const project = await this.getProjectById(projectId);
    return project?.matrices || [];
  }

  async getMatrixById(projectId: string, matrixId: string): Promise<Matrix | null> {
    const matrices = await this.getAllMatrices(projectId);
    return matrices.find((m) => m.id === matrixId) || null;
  }

  async createMatrix(projectId: string, data: CreateMatrixDto): Promise<Matrix> {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const newMatrix: Matrix = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      nodes: data.nodes || [],
      edges: data.edges || [],
      created: new Date(),
      updated: new Date(),
    };

    project.matrices.push(newMatrix);
    await this.updateProject(projectId, { matrices: project.matrices });
    return newMatrix;
  }

  async updateMatrix(
    projectId: string,
    matrixId: string,
    data: UpdateMatrixDto
  ): Promise<Matrix | null> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const index = project.matrices.findIndex((m) => m.id === matrixId);
    if (index === -1) return null;

    const updatedMatrix = {
      ...project.matrices[index],
      ...data,
      updated: new Date(),
    };

    project.matrices[index] = updatedMatrix;
    await this.updateProject(projectId, { matrices: project.matrices });
    return updatedMatrix;
  }

  async deleteMatrix(projectId: string, matrixId: string): Promise<boolean> {
    const project = await this.getProjectById(projectId);
    if (!project) return false;

    const originalLength = project.matrices.length;
    project.matrices = project.matrices.filter((m) => m.id !== matrixId);

    if (project.matrices.length === originalLength) return false;

    await this.updateProject(projectId, { matrices: project.matrices });
    return true;
  }
}

export const indexedDBAdapter = new IndexedDBAdapter();
