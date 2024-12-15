import type { IStorageAdapter } from './adapter.type';
import type { Matrix, CreateMatrixDto, UpdateMatrixDto } from '../matrix.type';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../project.type';
import type { ExecuteResponse } from './adapter.type';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3004/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0) {
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Unknown error occurred');
  }
  return result;
}

const handleNodeExecution = async (response: Response): Promise<ExecuteResponse> => {
  if (!response.ok) {
    const error = await response.text();
    return {
      success: false,
      error: `HTTP error! status: ${response.status}, message: ${error}`,
    };
  }
  return response.json();
};

export const backendAdapter: IStorageAdapter = {
  // Project operations
  async getAllProjects(): Promise<Project[]> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/projects`);
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

  // Add a health check method
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  },

  async executeNode(
    projectId: string,
    matrixId: string,
    nodeId: string,
    input?: any
  ): Promise<ExecuteResponse> {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/execute/node/${projectId}/${matrixId}/${nodeId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input }),
        }
      );
      return handleNodeExecution(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute node',
      };
    }
  },

  async executeMatrix(projectId: string, matrixId: string, input?: any): Promise<ExecuteResponse> {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/execute/matrix/${projectId}/${matrixId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input }),
        }
      );
      return handleNodeExecution(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute matrix',
      };
    }
  },
};
