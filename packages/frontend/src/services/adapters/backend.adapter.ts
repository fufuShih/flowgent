import type { IStorageAdapter } from './adapter.type';
import type { Matrix, CreateMatrixDto, UpdateMatrixDto } from '../matrix.type';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../project.type';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3004/api';

async function handleResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Unknown error occurred');
  }
  return result;
}

export const backendAdapter: IStorageAdapter = {
  // Project operations
  async getAllProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      const result = await handleResponse(response);
      return result.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  },

  async getProjectById(id: string): Promise<Project | null> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    const result = await handleResponse(response);
    return result.data;
  },

  async createProject(data: CreateProjectDto): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project | null> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  async deleteProject(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    const result = await handleResponse(response);
    return result.success;
  },

  // Matrix operations
  async getAllMatrices(projectId: string): Promise<Matrix[]> {
    const response = await fetch(`${API_BASE_URL}/matrices/${projectId}`);
    const result = await handleResponse(response);
    return result.data;
  },

  async getMatrixById(projectId: string, matrixId: string): Promise<Matrix | null> {
    const response = await fetch(`${API_BASE_URL}/matrices/${projectId}/${matrixId}`);
    const result = await handleResponse(response);
    return result.data;
  },

  async createMatrix(projectId: string, data: CreateMatrixDto): Promise<Matrix> {
    const response = await fetch(`${API_BASE_URL}/matrices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, projectId }),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  async updateMatrix(
    projectId: string,
    matrixId: string,
    data: UpdateMatrixDto
  ): Promise<Matrix | null> {
    const response = await fetch(`${API_BASE_URL}/matrices/${matrixId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, projectId }),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  async deleteMatrix(projectId: string, matrixId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/matrices/${matrixId}`, {
      method: 'DELETE',
    });
    const result = await handleResponse(response);
    return result.success;
  },

  // 添加一個健康檢查方法
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  },
};
