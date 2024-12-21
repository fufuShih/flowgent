import type { PostApiExecuteMatrixByIdResponse } from '../openapi-client';

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
      const response: PostApiExecuteMatrixByIdResponse = await fetch(
        `/api/execute/matrix/${matrixId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      ).then((res) => res.json());

      return {
        success: Boolean(response.success),
        result: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute matrix',
      };
    }
  }
}
