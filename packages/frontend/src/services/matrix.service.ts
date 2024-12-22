import {
  getApiProjectByProjectIdMatrix,
  postApiProjectByProjectIdMatrix,
  getApiMatrixByMatrixId,
  patchApiMatrixByMatrixId,
  deleteApiMatrixByMatrixId,
  postApiMatrixByMatrixIdClone,
} from '../openapi-client/sdk.gen';
import {
  DeleteApiMatrixByMatrixIdData,
  GetApiMatrixByMatrixIdData,
  GetApiProjectByProjectIdMatrixData,
  Matrix,
  PatchApiMatrixByMatrixIdData,
  PostApiMatrixByMatrixIdCloneData,
  PostApiProjectByProjectIdMatrixData,
} from '../openapi-client/types.gen';
import { ServiceResponse } from './types';

export class MatrixService {
  static async getMatrices(
    projectId: GetApiProjectByProjectIdMatrixData['path']['projectId'],
    params?: GetApiProjectByProjectIdMatrixData['query']
  ): Promise<ServiceResponse<Matrix[]>> {
    try {
      const response = await getApiProjectByProjectIdMatrix({
        path: { projectId },
        query: {
          limit: params?.limit,
          page: params?.page,
          status: params?.status as 'active' | 'inactive' | 'draft' | 'error',
          version: params?.version,
        },
      });

      return {
        success: true,
        data: response.data?.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch matrices',
      };
    }
  }

  static async createMatrix(
    projectId: PostApiProjectByProjectIdMatrixData['path']['projectId'],
    params: PostApiProjectByProjectIdMatrixData['body']
  ): Promise<ServiceResponse<Matrix>> {
    try {
      const response = await postApiProjectByProjectIdMatrix({
        path: { projectId },
        body: {
          name: params.name,
          description: params.description,
          status: params.status as 'active' | 'inactive' | 'draft' | 'error',
          config: params.config,
          parentMatrixId: params.parentMatrixId,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create matrix',
      };
    }
  }

  static async getMatrix(
    matrixId: GetApiMatrixByMatrixIdData['path']['matrixId'],
    options?: GetApiMatrixByMatrixIdData['query']
  ): Promise<ServiceResponse<Matrix>> {
    try {
      const response = await getApiMatrixByMatrixId({
        path: { matrixId },
        query: {
          includeNodes: options?.includeNodes,
          includeConnections: options?.includeConnections,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch matrix',
      };
    }
  }

  static async updateMatrix(
    matrixId: PatchApiMatrixByMatrixIdData['path']['matrixId'],
    params: PatchApiMatrixByMatrixIdData['body']
  ): Promise<ServiceResponse<Matrix>> {
    try {
      const response = await patchApiMatrixByMatrixId({
        path: { matrixId },
        body: {
          name: params.name,
          description: params.description,
          status: params.status as 'active' | 'inactive' | 'draft' | 'error',
          config: params.config,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update matrix',
      };
    }
  }

  static async deleteMatrix(
    matrixId: DeleteApiMatrixByMatrixIdData['path']['matrixId']
  ): Promise<ServiceResponse<void>> {
    try {
      await deleteApiMatrixByMatrixId({
        path: {
          matrixId,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete matrix',
      };
    }
  }

  static async cloneMatrix(
    matrixId: PostApiMatrixByMatrixIdCloneData['path']['matrixId']
  ): Promise<ServiceResponse<Matrix>> {
    try {
      const response = await postApiMatrixByMatrixIdClone({
        path: { matrixId },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clone matrix',
      };
    }
  }
}
