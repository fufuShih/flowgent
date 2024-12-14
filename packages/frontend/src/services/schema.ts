import { z } from 'zod';
import { MarkerType } from '@xyflow/react';

// Base schemas
export const inputOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

const baseNodeDataSchema = z.object({
  label: z.string(),
  inputs: z.array(inputOutputSchema),
  outputs: z.array(inputOutputSchema),
}).catchall(z.unknown());

// Node related schemas
export const triggerNodeDataSchema = baseNodeDataSchema.extend({
  type: z.literal('trigger'),
  params: z.record(z.never()),
});

export const aiNodeDataSchema = baseNodeDataSchema.extend({
  type: z.literal('ai'),
  params: z.object({
    prompt: z.string(),
  }),
});

export const actionNodeDataSchema = baseNodeDataSchema.extend({
  type: z.literal('action'),
  params: z.object({
    action: z.string(),
  }),
});

export const flowNodeDataSchema = baseNodeDataSchema.extend({
  type: z.literal('flow'),
  params: z.object({
    condition: z.string(),
  }),
});

export const nodeDataSchema = z.discriminatedUnion('type', [
  triggerNodeDataSchema,
  aiNodeDataSchema,
  actionNodeDataSchema,
  flowNodeDataSchema,
]);

export const nodeStateSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'error']),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  error: z.instanceof(Error).optional(),
});

export const executionStateSchema = z.object({
  id: z.string(),
  matrixId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'error']),
  nodeStates: z.record(nodeStateSchema),
});

// Matrix related schemas
export const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  animated: z.boolean().optional(),
  style: z.object({
    strokeWidth: z.number(),
  }).optional(),
  markerEnd: z.object({
    type: z.nativeEnum(MarkerType),
    width: z.number(),
    height: z.number(),
  }).optional(),
});

export const matrixSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(z.any()), // Due to @xyflow/react Node type complexity
  edges: z.array(flowEdgeSchema),
  created: z.date(),
  updated: z.date(),
});

export const matrixResponseSchema = z.object({
  success: z.boolean(),
  data: matrixSchema.optional(),
  error: z.string().optional(),
});

// Project related schemas
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  matrices: z.array(matrixSchema),
  created: z.date(),
  updated: z.date(),
});

// DTO schemas
export const createProjectSchema = z.object({
  name: z.string(),
  matrices: z.array(matrixSchema).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().optional(),
  matrices: z.array(matrixSchema).optional(),
});

export const createMatrixSchema = z.object({
  name: z.string(),
  description: z.string(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(flowEdgeSchema).optional(),
});

export const updateMatrixSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(flowEdgeSchema).optional(),
});
