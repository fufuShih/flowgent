import {
  deleteApiTriggersByTriggerId,
  getApiNodesByNodeIdTrigger,
  getApiTriggersByTriggerId,
  patchApiTriggersByTriggerId,
  postApiNodesByNodeIdTrigger,
} from '../openapi-client/sdk.gen';
import {
  DeleteApiTriggersByTriggerIdData,
  GetApiNodesByNodeIdTriggerData,
  GetApiTriggersByTriggerIdData,
  Node,
  PatchApiTriggersByTriggerIdData,
  PostApiNodesByNodeIdTriggerData,
  Trigger,
} from '../openapi-client/types.gen';
import { ServiceResponse } from './types';

export class TriggerService {
  static async getNodeTrigger(
    nodeId: GetApiNodesByNodeIdTriggerData['path']['nodeId']
  ): Promise<ServiceResponse<Trigger>> {
    try {
      const response = await getApiNodesByNodeIdTrigger({
        path: { nodeId },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch node trigger',
      };
    }
  }

  static async createNodeTrigger(
    nodeId: PostApiNodesByNodeIdTriggerData['path']['nodeId'],
    params: PostApiNodesByNodeIdTriggerData['body']
  ): Promise<ServiceResponse<Trigger>> {
    try {
      const response = await postApiNodesByNodeIdTrigger({
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
        error: error instanceof Error ? error.message : 'Failed to create trigger',
      };
    }
  }

  static async getTrigger(
    triggerId: GetApiTriggersByTriggerIdData['path']['triggerId']
  ): Promise<ServiceResponse<Trigger & { node?: Node }>> {
    try {
      const response = await getApiTriggersByTriggerId({
        path: { triggerId },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trigger',
      };
    }
  }

  static async updateTrigger(
    triggerId: PatchApiTriggersByTriggerIdData['path']['triggerId'],
    params: PatchApiTriggersByTriggerIdData['body']
  ): Promise<ServiceResponse<Trigger>> {
    try {
      const response = await patchApiTriggersByTriggerId({
        path: { triggerId },
        body: params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update trigger',
      };
    }
  }

  static async deleteTrigger(
    triggerId: DeleteApiTriggersByTriggerIdData['path']['triggerId']
  ): Promise<ServiceResponse<void>> {
    try {
      await deleteApiTriggersByTriggerId({
        path: { triggerId },
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete trigger',
      };
    }
  }

  static async activateTrigger(
    triggerId: PatchApiTriggersByTriggerIdData['path']['triggerId']
  ): Promise<ServiceResponse<Trigger>> {
    try {
      const response = await patchApiTriggersByTriggerId({
        path: { triggerId },
        body: {
          status: 'active',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate trigger',
      };
    }
  }

  static async deactivateTrigger(
    triggerId: PatchApiTriggersByTriggerIdData['path']['triggerId']
  ): Promise<ServiceResponse<Trigger>> {
    try {
      const response = await patchApiTriggersByTriggerId({
        path: { triggerId },
        body: {
          status: 'inactive',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate trigger',
      };
    }
  }

  // Note: executeTrigger is not available in the API spec
  // You might need to add a new endpoint for this functionality
  static async executeTrigger(triggerId: number): Promise<ServiceResponse<void>> {
    return {
      success: false,
      error: 'Execute trigger endpoint not implemented in API',
    };
  }
}
