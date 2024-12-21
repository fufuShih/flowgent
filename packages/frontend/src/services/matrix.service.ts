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
import type { Matrix } from '../openapi-client/types.gen';
import type { BaseNode } from './node.type';

export class MatrixService {
  static async getAllMatrices(): Promise<GetApiMatrixResponse> {
    const response = await getApiMatrix();
    return response;
  }

  static async createMatrix(matrix: {
    name: string;
    description?: string;
    projectId: number;
    isSubMatrix?: boolean;
    config?: Record<string, unknown>;
  }) {
    return postApiMatrix({ body: matrix });
  }

  static async getMatrixById(id: number): Promise<Matrix | null> {
    return getApiMatrixById({ path: { id } });
  }

  static async updateMatrix(id: number, matrix: Partial<Matrix>) {
    return putApiMatrixById({ path: { id }, body: matrix });
  }

  static async deleteMatrix(id: number) {
    return deleteApiMatrixById({ path: { id } });
  }

  static async getMatrixNodes(id: number): Promise<BaseNode[]> {
    const response = await getApiMatrixByIdNodes({ path: { id } });
    return response.data || [];
  }

  static async getMatrixConnections(id: number) {
    return getApiMatrixByIdConnections({ path: { id } });
  }

  static async executeMatrix(
    id: number,
    input?: Record<string, unknown>
  ): Promise<PostApiExecuteMatrixByIdResponse> {
    return postApiExecuteMatrixById({
      path: { id },
      body: { input },
    });
  }
}
