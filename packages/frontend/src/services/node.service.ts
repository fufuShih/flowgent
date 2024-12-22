import {
  deleteApiNodesByNodeId,
  getApiMatrixByMatrixIdNodes,
  getApiNodesByNodeId,
  patchApiNodesByNodeId,
  postApiMatrixByMatrixIdNodes,
} from '../openapi-client/sdk.gen';
import {
  DeleteApiNodesByNodeIdData,
  GetApiMatrixByMatrixIdNodesData,
  GetApiNodesByNodeIdData,
  Node,
  PatchApiNodesByNodeIdData,
  PostApiMatrixByMatrixIdNodesData,
} from '../openapi-client/types.gen';
import { ServiceResponse } from './types';

export class NodeService {
  static async getNodes(
    matrixId: GetApiMatrixByMatrixIdNodesData['path']['matrixId'],
    options?: GetApiMatrixByMatrixIdNodesData['query']
  ): Promise<ServiceResponse<Node[]>> {
    try {
      const response = await getApiMatrixByMatrixIdNodes({
        path: { matrixId },
        query: {
          type: options?.type,
          includeTrigger: options?.includeTrigger,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch nodes',
      };
    }
  }

  static async createNode(
    matrixId: PostApiMatrixByMatrixIdNodesData['path']['matrixId'],
    params: PostApiMatrixByMatrixIdNodesData['body']
  ): Promise<ServiceResponse<Node>> {
    try {
      const response = await postApiMatrixByMatrixIdNodes({
        path: { matrixId },
        body: params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create node',
      };
    }
  }

  static async getNode(
    nodeId: GetApiNodesByNodeIdData['path']['nodeId']
  ): Promise<ServiceResponse<Node>> {
    try {
      const response = await getApiNodesByNodeId({
        path: { nodeId },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch node',
      };
    }
  }

  static async updateNode(
    nodeId: PatchApiNodesByNodeIdData['path']['nodeId'],
    params: PatchApiNodesByNodeIdData['body']
  ): Promise<ServiceResponse<Node>> {
    try {
      const response = await patchApiNodesByNodeId({
        path: { nodeId },
        body: params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update node',
      };
    }
  }

  static async deleteNode(
    nodeId: DeleteApiNodesByNodeIdData['path']['nodeId']
  ): Promise<ServiceResponse<void>> {
    try {
      await deleteApiNodesByNodeId({
        path: { nodeId },
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete node',
      };
    }
  }
}
