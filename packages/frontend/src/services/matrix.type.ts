import { FlowNodeType } from './node.type';
import { MarkerType, Edge } from '@xyflow/react';

export interface Matrix {
  id: string;
  projectId: string;
  name: string;
  description: string;
  nodes: FlowNodeType[]; // Will be JSON stringified in backend
  edges: FlowEdge[]; // Will be JSON stringified in backend
  created: string;
  updated: string;
}

export type CreateMatrixDto = {
  projectId: string;
  name: string;
  description: string;
  nodes?: FlowNodeType[];
  edges?: FlowEdge[];
};

export type UpdateMatrixDto = Partial<CreateMatrixDto>;

export type MatrixResponse = {
  success: boolean;
  data?: Matrix;
  error?: string;
};

export type FlowEdge = Edge & {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: {
    strokeWidth: number;
  };
  markerEnd?: {
    type: MarkerType;
    width: number;
    height: number;
  };
};
