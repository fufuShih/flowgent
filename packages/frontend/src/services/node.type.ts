import { Node } from '@xyflow/react';
import { nodeDataSchema, executionStateSchema, nodeStateSchema, inputOutputSchema } from './schema';
import type { z } from 'zod';

export type InputOutput = z.infer<typeof inputOutputSchema>;
export type NodeDataType = z.infer<typeof nodeDataSchema> & {
  id?: string;
  handler?: NodeHandler;
};
export type FlowNodeType = Node<NodeDataType>;
export type NodeState = z.infer<typeof nodeStateSchema>;
export type ExecutionState = z.infer<typeof executionStateSchema>;

export type ActionTriggerType = 'manual' | 'input' | 'cron' | 'webhook';

// Type guards
export const isActionNode = (node: FlowNodeType): node is Node<NodeDataType & { type: 'action' }> =>
  node.data.type === 'action';

export const isAINode = (node: FlowNodeType): node is Node<NodeDataType & { type: 'ai' }> =>
  node.data.type === 'ai';

export const isFlowNode = (node: FlowNodeType): node is Node<NodeDataType & { type: 'flow' }> =>
  node.data.type === 'flow';

export interface Matrix {
  id: number;
  projectId: number;
  name: string;
  description: string;
  nodes: string; // JSON string format
  edges: string; // JSON string format
  created: string;
  updated: string;
}

export interface CreateMatrixDto {
  projectId: number;
  name: string;
  description: string;
  nodes: any[]; // Will be converted to JSON string
  edges: any[]; // Will be converted to JSON string
}

export type NodeHandler = (input?: any) => Promise<any>;
