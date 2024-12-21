import { getApiNodeType } from '../openapi-client';
import type { NodeType } from './types';

export class NodeTypeService {
  static async getAll(): Promise<NodeType[]> {
    const response = await getApiNodeType();
    return response.data as NodeType[];
  }
}
