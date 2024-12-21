import { postApiExecuteMatrixById } from '../openapi-client';

export class ExecutionService {
  static async executeNode(projectId: string, matrixId: string, nodeId: string, data: any) {
    // TODO: Implement actual API call
    return {
      success: true,
      result: `Node ${nodeId} executed successfully`,
      error: null,
    } as const;
  }

  static async executeMatrix(
    projectId: string,
    matrixId: string
  ): Promise<{ success: boolean; error?: string; result?: any }> {
    try {
      const response = await postApiExecuteMatrixById({
        path: { id: Number(matrixId) },
        body: {},
      });

      return {
        success: Boolean(response.data?.success),
        result: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute matrix',
      };
    }
  }
}
