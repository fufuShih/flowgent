import {
  deleteApiConnectionsByConnectionId,
  getApiConnectionsByConnectionId,
  getApiConnectionsByConnectionIdConditions,
  getApiMatrixByMatrixIdConnections,
  patchApiConnectionsByConnectionId,
  postApiConnectionsByConnectionIdConditions,
  postApiMatrixByMatrixIdConnections,
} from '../openapi-client/sdk.gen';
import {
  Connection,
  ConnectionCondition,
  DeleteApiConnectionsByConnectionIdData,
  GetApiConnectionsByConnectionIdConditionsData,
  GetApiConnectionsByConnectionIdData,
  GetApiMatrixByMatrixIdConnectionsData,
  PatchApiConnectionsByConnectionIdData,
  PostApiConnectionsByConnectionIdConditionsData,
  PostApiMatrixByMatrixIdConnectionsData,
} from '../openapi-client/types.gen';
import { ServiceResponse } from './types';

export interface ConnectionCreateParams {
  sourceId: number;
  targetId: number;
  type?: 'default' | 'success' | 'error' | 'condition';
  config?: Record<string, unknown>;
  conditions?: Array<{
    condition: Record<string, unknown>;
  }>;
}

export class ConnectionService {
  static async getConnections(
    matrixId: GetApiMatrixByMatrixIdConnectionsData['path']['matrixId'],
    options?: GetApiMatrixByMatrixIdConnectionsData['query']
  ): Promise<ServiceResponse<Connection[]>> {
    try {
      const response = await getApiMatrixByMatrixIdConnections({
        path: { matrixId },
        query: {
          includeConditions: options?.includeConditions,
        },
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
    matrixId: PostApiMatrixByMatrixIdConnectionsData['path']['matrixId'],
    params: PostApiMatrixByMatrixIdConnectionsData['body']
  ): Promise<ServiceResponse<Connection>> {
    try {
      const response = await postApiMatrixByMatrixIdConnections({
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
        error: error instanceof Error ? error.message : 'Failed to create connection',
      };
    }
  }

  static async getConnection(
    connectionId: GetApiConnectionsByConnectionIdData['path']['connectionId']
  ): Promise<ServiceResponse<Connection>> {
    try {
      const response = await getApiConnectionsByConnectionId({
        path: { connectionId },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch connection',
      };
    }
  }

  static async updateConnection(
    connectionId: PatchApiConnectionsByConnectionIdData['path']['connectionId'],
    params: PatchApiConnectionsByConnectionIdData['body']
  ): Promise<ServiceResponse<Connection>> {
    try {
      const response = await patchApiConnectionsByConnectionId({
        path: { connectionId },
        body: params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update connection',
      };
    }
  }

  static async deleteConnection(
    connectionId: DeleteApiConnectionsByConnectionIdData['path']['connectionId']
  ): Promise<ServiceResponse<void>> {
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

  static async getConnectionConditions(
    connectionId: GetApiConnectionsByConnectionIdConditionsData['path']['connectionId']
  ): Promise<ServiceResponse<ConnectionCondition[]>> {
    try {
      const response = await getApiConnectionsByConnectionIdConditions({
        path: { connectionId },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch connection conditions',
      };
    }
  }

  static async addConnectionCondition(
    connectionId: PostApiConnectionsByConnectionIdConditionsData['path']['connectionId'],
    condition: PostApiConnectionsByConnectionIdConditionsData['body']['condition']
  ): Promise<ServiceResponse<ConnectionCondition>> {
    try {
      const response = await postApiConnectionsByConnectionIdConditions({
        path: { connectionId },
        body: { condition },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add connection condition',
      };
    }
  }
}
