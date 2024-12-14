import { Node } from '@xyflow/react';
import {
  nodeDataSchema,
  executionStateSchema,
  nodeStateSchema,
  inputOutputSchema,
  triggerNodeDataSchema,
  actionNodeDataSchema,
  aiNodeDataSchema,
  flowNodeDataSchema
} from './schema';
import type { z } from 'zod';

export type InputOutput = z.infer<typeof inputOutputSchema>;
export type NodeDataType = z.infer<typeof nodeDataSchema>;
export type FlowNodeType = Node<NodeDataType>;
export type NodeState = z.infer<typeof nodeStateSchema>;
export type ExecutionState = z.infer<typeof executionStateSchema>;

// Type guards
export const isTriggerNode = (node: FlowNodeType): node is Node<z.infer<typeof triggerNodeDataSchema>> =>
  node.data.type === 'trigger';

export const isAINode = (node: FlowNodeType): node is Node<z.infer<typeof aiNodeDataSchema>> =>
  node.data.type === 'ai';

export const isActionNode = (node: FlowNodeType): node is Node<z.infer<typeof actionNodeDataSchema>> =>
  node.data.type === 'action';

export const isFlowNode = (node: FlowNodeType): node is Node<z.infer<typeof flowNodeDataSchema>> =>
  node.data.type === 'flow';
