import {
  getApiMatrix,
  postApiMatrix,
  getApiMatrixById,
  putApiMatrixById,
  deleteApiMatrixById,
  getApiMatrixByIdNodes,
  getApiMatrixByIdConnections,
  postApiExecuteMatrixById,
  type Matrix as ApiMatrix,
  type GetApiMatrixByIdConnectionsResponse,
  type GetApiMatrixByIdNodesResponse,
  type GetApiMatrixResponse,
  type PostApiExecuteMatrixByIdResponse,
  type PostApiMatrixResponse,
  type GetApiMatrixByIdResponse,
  type PutApiMatrixByIdResponse,
} from '../openapi-client';
import type { Matrix, CreateMatrixDto, BaseNode } from './types';

interface MatrixUpdateDto {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'draft' | 'error';
  config?: {
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: Record<string, any>;
      measured?: { width: number; height: number };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type?: string;
      data?: Record<string, any>;
    }>;
  };
}

export class MatrixService {
  static async getAllMatrices(): Promise<ApiMatrix[]> {
    const response = (await getApiMatrix()) as GetApiMatrixResponse;
    return response.data?.data || [];
  }

  static async getAll(projectId: string): Promise<Matrix[]> {
    const matrices = await this.getAllMatrices();
    return matrices.filter((matrix) => matrix.projectId === Number(projectId)) as Matrix[];
  }

  static async create(projectId: string, data: CreateMatrixDto): Promise<Matrix> {
    const response = (await postApiMatrix({
      body: {
        ...data,
        projectId: Number(projectId),
      },
    })) as PostApiMatrixResponse;
    return response as Matrix;
  }

  static async getById(projectId: string, matrixId: string): Promise<Matrix | null> {
    const response = (await getApiMatrixById({
      path: { id: Number(matrixId) },
    })) as GetApiMatrixByIdResponse;
    return response as Matrix | null;
  }

  static async update(
    projectId: string,
    matrixId: string,
    data: { nodes: any[]; edges: any[] }
  ): Promise<Matrix> {
    const updateData: MatrixUpdateDto = {
      config: {
        nodes: data.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
          measured: node.measured,
        })),
        edges: data.edges,
      },
    };

    const response = (await putApiMatrixById({
      path: { id: Number(matrixId) },
      body: updateData,
    })) as PutApiMatrixByIdResponse;

    if (!response || 'error' in response) {
      throw new Error(response?.error || 'Failed to update matrix');
    }

    return response as Matrix;
  }

  static async delete(id: number): Promise<void> {
    await deleteApiMatrixById({ path: { id } });
  }

  static async getNodes(id: number): Promise<BaseNode[]> {
    const response = (await getApiMatrixByIdNodes({
      path: { id },
    })) as GetApiMatrixByIdNodesResponse;
    return (response.data?.data || []) as BaseNode[];
  }

  static async getConnections(id: number): Promise<any[]> {
    const response = (await getApiMatrixByIdConnections({
      path: { id },
    })) as GetApiMatrixByIdConnectionsResponse;
    return (response.data?.data || []) as any[];
  }

  static async execute(id: number, input?: Record<string, unknown>) {
    const response = await postApiExecuteMatrixById({
      path: { id },
      body: { input },
    });
    return response as PostApiExecuteMatrixByIdResponse;
  }
}
