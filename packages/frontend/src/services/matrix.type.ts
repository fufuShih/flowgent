import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';
import { NodeDataType } from './node.type';

export type FlowNode = ReactFlowNode<NodeDataType>;
export type FlowEdge = ReactFlowEdge;

export interface Matrix {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  created: Date;
  updated: Date;
}

export interface CreateMatrixDto {
  name: string;
  description: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}

export interface UpdateMatrixDto {
  name?: string;
  description?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}
