import {
  getApiMatrixByMatrixId,
  postApiMatrixProjectByProjectId,
  getApiMatrixProjectByProjectId,
  patchApiMatrixByMatrixId,
  deleteApiMatrixByMatrixId,
  getApiNodesMatrixByMatrixId,
  postApiNodesMatrixByMatrixIdNodes,
  getApiMatrixByMatrixIdConnections,
  postApiMatrixByMatrixIdConnections,
  deleteApiNodesByNodeId,
  deleteApiConnectionsByConnectionId,
} from '../openapi-client/sdk.gen';
import { ServiceResponse } from './types';
import type { Matrix, Node, Connection } from '../openapi-client/types.gen';

export class MatrixService {
  static async createMatrix(
    projectId: number,
    name: string,
    description?: string
  ): Promise<ServiceResponse<Matrix>> {
    try {
      const response = await postApiMatrixProjectByProjectId({
        path: { projectId },
        body: {
          name,
          description,
          status: 'draft',
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
    matrixId: number,
    includeNodes = true,
    includeConnections = true
  ): Promise<ServiceResponse<Matrix>> {
    try {
      const response = await getApiMatrixByMatrixId({
        path: { matrixId },
        query: {
          includeNodes,
          includeConnections,
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

  static async getMatricesByProject(projectId: number): Promise<ServiceResponse<Matrix[]>> {
    try {
      const response = await getApiMatrixProjectByProjectId({
        path: { projectId },
      });

      return {
        success: true,
        data: response.data?.data ?? [],
        pagination: response.data?.pagination,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch matrices',
      };
    }
  }

  static async updateMatrix(
    matrixId: number,
    data: Partial<Omit<Matrix, 'description'> & { description?: string }>
  ): Promise<ServiceResponse<Matrix>> {
    try {
      const response = await patchApiMatrixByMatrixId({
        path: { matrixId },
        body: data,
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

  static async deleteMatrix(matrixId: number): Promise<ServiceResponse<void>> {
    try {
      await deleteApiMatrixByMatrixId({
        path: { matrixId },
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

  static async getNodes(matrixId: number): Promise<ServiceResponse<Node[]>> {
    try {
      const response = await getApiNodesMatrixByMatrixId({
        path: { matrixId },
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
    matrixId: number,
    node: Omit<Node, 'id' | 'matrixId' | 'created' | 'updated' | 'description' | 'subMatrixId'> & {
      description?: string;
      position: { x: number; y: number };
      subMatrixId?: number;
    }
  ): Promise<ServiceResponse<Node>> {
    try {
      const response = await postApiNodesMatrixByMatrixIdNodes({
        path: { matrixId },
        body: node,
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

  static async deleteNode(nodeId: number): Promise<ServiceResponse<void>> {
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

  static async getConnections(matrixId: number): Promise<ServiceResponse<Connection[]>> {
    try {
      const response = await getApiMatrixByMatrixIdConnections({
        path: { matrixId },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch connections',
      };
    }
  }

  static async createConnection(
    matrixId: number,
    connection: Pick<Connection, 'sourceId' | 'targetId' | 'type'>
  ): Promise<ServiceResponse<Connection>> {
    try {
      const response = await postApiMatrixByMatrixIdConnections({
        path: { matrixId },
        body: connection,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create connection',
      };
    }
  }

  static async deleteConnection(connectionId: number): Promise<ServiceResponse<void>> {
    try {
      await deleteApiConnectionsByConnectionId({
        path: { connectionId },
      });
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete connection',
      };
    }
  }
}
