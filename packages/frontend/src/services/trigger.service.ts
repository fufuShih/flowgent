import {
  getApiTrigger,
  postApiTrigger,
  getApiTriggerById,
  putApiTriggerById,
  deleteApiTriggerById,
} from '../openapi-client';
import type { Trigger } from '../openapi-client/types.gen';

export class TriggerService {
  static async getAll(): Promise<Trigger[]> {
    const response = await getApiTrigger();
    return response.data || [];
  }

  static async create(trigger: {
    nodeId: number;
    type: string;
    name: string;
    config?: Record<string, unknown>;
  }): Promise<Trigger> {
    return postApiTrigger({ body: trigger });
  }

  static async getById(id: number): Promise<Trigger | null> {
    return getApiTriggerById({ path: { id } });
  }

  static async update(
    id: number,
    update: {
      name?: string;
      config?: Record<string, unknown>;
      status?: 'active' | 'inactive';
    }
  ): Promise<Trigger> {
    return putApiTriggerById({ path: { id }, body: update });
  }

  static async delete(id: number): Promise<void> {
    return deleteApiTriggerById({ path: { id } });
  }
}
