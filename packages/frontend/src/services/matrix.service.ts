import {
  getApiMatrix,
  postApiMatrix,
  getApiMatrixById,
  putApiMatrixById,
  deleteApiMatrixById,
  getApiMatrixByIdNodes,
  getApiMatrixByIdConnections,
  postApiExecuteMatrixById,
  type GetApiMatrixResponse,
  type PostApiExecuteMatrixByIdResponse,
} from '../openapi-client';
import type { Matrix, CreateMatrixDto, BaseNode } from './types';

export class MatrixService {
  static async getAllMatrices(): Promise<GetApiMatrixResponse> {
    return getApiMatrix();
  }

  static async getAll(projectId: string): Promise<Matrix[]> {
    const response = await this.getAllMatrices();
    return response.data?.filter((matrix) => matrix.projectId === Number(projectId)) as Matrix[];
  }

  static async create(projectId: string, data: CreateMatrixDto): Promise<Matrix> {
    return postApiMatrix({
      body: {
        ...data,
        projectId: Number(projectId),
      },
    }) as Promise<Matrix>;
  }

  static async getById(projectId: string, matrixId: string): Promise<Matrix | null> {
    return getApiMatrixById({ path: { id: Number(matrixId) } });
  }

  static async update(projectId: string, matrixId: string, data: { nodes: any[]; edges: any[] }) {
    const response = await putApiMatrixById({
      path: { id: Number(matrixId) },
      body: data,
    });
    return {
      success: true,
      data: response,
    };
  }

  static async delete(id: number) {
    return deleteApiMatrixById({ path: { id } });
  }

  static async getNodes(id: number): Promise<BaseNode[]> {
    const response = await getApiMatrixByIdNodes({ path: { id } });
    return response.data || [];
  }

  static async getConnections(id: number) {
    return getApiMatrixByIdConnections({ path: { id } });
  }

  static async execute(
    id: number,
    input?: Record<string, unknown>
  ): Promise<PostApiExecuteMatrixByIdResponse> {
    return postApiExecuteMatrixById({
      path: { id },
      body: { input },
    });
  }
}
