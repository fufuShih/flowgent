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
    return (response.data || []) as Trigger[];
  }

  static async create(trigger: {
    nodeId: number;
    type: string;
    name: string;
    config?: Record<string, unknown>;
  }): Promise<Trigger> {
    const response = await postApiTrigger({ body: trigger });
    return response.data as Trigger;
  }

  static async getById(id: number): Promise<Trigger | null> {
    const response = await getApiTriggerById({ path: { id } });
    return response.data as Trigger | null;
  }

  static async update(
    id: number,
    update: {
      name?: string;
      config?: Record<string, unknown>;
      status?: 'active' | 'inactive';
    }
  ): Promise<Trigger> {
    const response = await putApiTriggerById({ path: { id }, body: update });
    return response.data as Trigger;
  }

  static async delete(id: number): Promise<void> {
    await deleteApiTriggerById({ path: { id } });
  }
}
