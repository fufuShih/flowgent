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
    return config.adapter.executeNode(projectId, matrixId, nodeId, input);
  },

  async executeMatrix(projectId: string, matrixId: string, input?: any): Promise<ExecuteResponse> {
    return config.adapter.executeMatrix(projectId, matrixId, input);
  },

  async executeFlow(
    nodes: FlowNodeType[],
    startNodeId: string,
    input?: any
  ): Promise<ExecuteResponse> {
    try {
      const startNode = nodes.find((node) => node.id === startNodeId);
      if (!startNode) {
        throw new Error('Start node not found');
      }

      // Execute the node handler if it exists
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
