import { config } from './config';
import type { ExecuteResponse } from './adapters/adapter.type';
import type { FlowNodeType } from './node.type';

export const ExecutionService = {
  async executeNode(
    projectId: string,
    matrixId: string,
    nodeId: string,
    input?: any
  ): Promise<ExecuteResponse> {
    try {
      const response = await config.adapter.executeNode(projectId, matrixId, nodeId, input);
      return response;
    } catch (error) {
      console.error('Execute node error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute node',
      };
    }
  },

  async executeMatrix(projectId: string, matrixId: string, input?: any): Promise<ExecuteResponse> {
    try {
      const response = await config.adapter.executeMatrix(projectId, matrixId, input);
      return response;
    } catch (error) {
      console.error('Execute matrix error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute matrix',
      };
    }
  },

  // Local execution for offline mode
  async executeFlow(
    nodes: FlowNodeType[],
    startNodeId: string,
    projectId: string,
    matrixId: string,
    input?: any
  ): Promise<ExecuteResponse> {
    try {
      const startNode = nodes.find((node) => node.id === startNodeId);
      if (!startNode) {
        throw new Error('Start node not found');
      }

      // If using backend adapter, delegate to backend
      if (await config.adapter.checkHealth()) {
        return this.executeNode(projectId, matrixId, startNodeId, input);
      }

      // Local execution fallback
      if (startNode.data.handler) {
        const result = await startNode.data.handler(input);
        return {
          success: true,
          result,
        };
      }

      return {
        success: false,
        error: 'No handler found for node',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
};
