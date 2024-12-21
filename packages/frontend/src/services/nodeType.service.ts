import { getApiNodeType } from '../openapi-client';
import type { NodeType } from './node.type';

export class NodeTypeService {
  static async getAllNodeTypes(): Promise<NodeType[]> {
    const response = await getApiNodeType();
    return response.data as NodeType[];
  }
}
