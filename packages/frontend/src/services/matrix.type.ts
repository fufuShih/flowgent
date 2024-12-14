import { Edge, MarkerType } from '@xyflow/react';
import { FlowNodeType } from './node.type';

// Add more specific edge type
export interface FlowEdge extends Edge {
  animated?: boolean;
  style?: {
    strokeWidth: number;
  };
  markerEnd?: {
    type: MarkerType;
    width: number;
    height: number;
  };
}

export interface MatrixResponse {
  success: boolean;
  data?: Matrix;
  error?: string;
}

export interface Matrix {
  id: string;
  name: string;
  description: string;
  nodes: FlowNodeType[];
  edges: FlowEdge[];
  created: Date;
  updated: Date;
}

export interface CreateMatrixDto {
  name: string;
  description: string;
  nodes?: FlowNodeType[];
  edges?: FlowEdge[];
}

export interface UpdateMatrixDto {
  name?: string;
  description?: string;
  nodes?: FlowNodeType[];
  edges?: FlowEdge[];
}
