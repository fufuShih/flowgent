import {
  getApiTrigger,
  postApiTrigger,
  getApiTriggerById,
  putApiTriggerById,
  deleteApiTriggerById,
} from '../openapi-client';
import type { Trigger } from '../openapi-client/types.gen';

export class TriggerService {
  static async getAllTriggers(): Promise<Trigger[]> {
    const response = await getApiTrigger();
    return response.data || [];
  }

  static async createTrigger(trigger: {
    nodeId: number;
    type: string;
    name: string;
    config?: Record<string, unknown>;
  }): Promise<Trigger> {
    return postApiTrigger({ body: trigger });
  }

  static async getTriggerById(id: number): Promise<Trigger | null> {
    return getApiTriggerById({ path: { id } });
  }

  static async updateTrigger(
    id: number,
    update: {
      name?: string;
      config?: Record<string, unknown>;
      status?: 'active' | 'inactive';
    }
  ): Promise<Trigger> {
    return putApiTriggerById({ path: { id }, body: update });
  }

  static async deleteTrigger(id: number) {
    return deleteApiTriggerById({ path: { id } });
  }
}
