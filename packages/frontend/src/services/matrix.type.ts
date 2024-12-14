import { Edge } from '@xyflow/react';
import { matrixSchema, matrixResponseSchema, createMatrixSchema, updateMatrixSchema, flowEdgeSchema } from './schema';
import type { z } from 'zod';

export type FlowEdge = z.infer<typeof flowEdgeSchema> & Edge;
export type Matrix = z.infer<typeof matrixSchema>;
export type MatrixResponse = z.infer<typeof matrixResponseSchema>;
export type CreateMatrixDto = z.infer<typeof createMatrixSchema>;
export type UpdateMatrixDto = z.infer<typeof updateMatrixSchema>;
