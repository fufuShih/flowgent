import { config } from './config';
import type { Matrix, CreateMatrixDto, UpdateMatrixDto, MatrixResponse } from './matrix.type';

export const MatrixService = {
  async getAll(projectId: string): Promise<Matrix[]> {
    const matrices = await config.adapter.getAllMatrices(projectId);
    return matrices.map((matrix) => ({
      ...matrix,
      nodes: typeof matrix.nodes === 'string' ? JSON.parse(matrix.nodes) : matrix.nodes,
      edges: typeof matrix.edges === 'string' ? JSON.parse(matrix.edges) : matrix.edges,
    }));
  },

  async getById(projectId: string, matrixId: string): Promise<Matrix | null> {
    const matrix = await config.adapter.getMatrixById(projectId, matrixId);
    if (!matrix) return null;

    return {
      ...matrix,
      nodes: typeof matrix.nodes === 'string' ? JSON.parse(matrix.nodes) : matrix.nodes,
      edges: typeof matrix.edges === 'string' ? JSON.parse(matrix.edges) : matrix.edges,
    };
  },

  async create(projectId: string, data: CreateMatrixDto): Promise<Matrix> {
    const matrix = await config.adapter.createMatrix(projectId, {
      ...data,
      nodes: data.nodes || [],
      edges: data.edges || [],
    });

    return {
      ...matrix,
      nodes: typeof matrix.nodes === 'string' ? JSON.parse(matrix.nodes) : matrix.nodes,
      edges: typeof matrix.edges === 'string' ? JSON.parse(matrix.edges) : matrix.edges,
    };
  },

  async update(
    projectId: string,
    matrixId: string,
    data: UpdateMatrixDto
  ): Promise<MatrixResponse> {
    try {
      const result = await config.adapter.updateMatrix(projectId, matrixId, data);
      if (!result) throw new Error('Matrix not found');

      return {
        success: true,
        data: {
          ...result,
          nodes: typeof result.nodes === 'string' ? JSON.parse(result.nodes) : result.nodes,
          edges: typeof result.edges === 'string' ? JSON.parse(result.edges) : result.edges,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update matrix',
      };
    }
  },

  delete: (projectId: string, matrixId: string) => config.adapter.deleteMatrix(projectId, matrixId),
};
