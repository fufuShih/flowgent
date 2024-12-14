import { Edge } from '@xyflow/react';
import {
  matrixSchema,
  matrixResponseSchema,
  createMatrixSchema,
  updateMatrixSchema,
  flowEdgeSchema,
} from './schema';
import type { z } from 'zod';

export type FlowEdge = z.infer<typeof flowEdgeSchema> & Edge;
export type Matrix = {
  id: number;
  projectId: number;
  name: string;
  description: string;
  nodes: any[]; // For backend adapter: will be parsed from JSON string
  edges: any[]; // For backend adapter: will be parsed from JSON string
  created: string;
  updated: string;
};

export type MatrixResponse = {
  success: boolean;
  data?: Matrix;
  error?: string;
};

export type CreateMatrixDto = {
  name: string;
  description: string;
  nodes?: any[];
  edges?: any[];
};

export type UpdateMatrixDto = Partial<CreateMatrixDto>;
