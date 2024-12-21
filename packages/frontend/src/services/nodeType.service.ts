import { getApiNodeType } from '../openapi-client';

export class NodeTypeService {
  static async getAll(): Promise<string[]> {
    const response = await getApiNodeType();
    return (response.data?.data || []) as string[];
  }
}
