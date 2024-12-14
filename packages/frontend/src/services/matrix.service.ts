import { config } from './config';
import type { Matrix, CreateMatrixDto, UpdateMatrixDto, MatrixResponse } from './matrix.type';

export const MatrixService = {
  getAll: (projectId: string) => config.adapter.getAllMatrices(projectId),

  getById: (projectId: string, matrixId: string) =>
    config.adapter.getMatrixById(projectId, matrixId),

  create: (projectId: string, data: CreateMatrixDto) =>
    config.adapter.createMatrix(projectId, data),

  async update(
    projectId: string,
    matrixId: string,
    data: UpdateMatrixDto
  ): Promise<MatrixResponse> {
    try {
      const result = await config.adapter.updateMatrix(projectId, matrixId, data);
      if (!result) throw new Error('Matrix not found');

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update matrix',
      };
    }
  },

  delete: (projectId: string, matrixId: string) => config.adapter.deleteMatrix(projectId, matrixId),
};
