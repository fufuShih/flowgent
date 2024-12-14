import { Node } from '@xyflow/react';

export interface InputOutput {
  id: string;
  name: string;
  type: string;
}

// Add index signature to allow additional properties
interface BaseNodeData {
  label: string;
  inputs: InputOutput[];
  outputs: InputOutput[];
  [key: string]: unknown;  // Add this line to allow string indexing
}

export interface TriggerNodeData extends BaseNodeData {
  type: 'trigger';
  params: Record<string, never>;
}

export interface AINodeData extends BaseNodeData {
  type: 'ai';
  params: {
    prompt: string;
  };
}

export interface ActionNodeData extends BaseNodeData {
  type: 'action';
  params: {
    action: string;
  };
}

export interface FlowNodeData extends BaseNodeData {
  type: 'flow';
  params: {
    condition: string;
  };
}

export type NodeDataType = TriggerNodeData | AINodeData | ActionNodeData | FlowNodeData;

export type FlowNodeType = Node<NodeDataType>;

// Type guards
export const isTriggerNode = (node: FlowNodeType): node is Node<TriggerNodeData> =>
  node.data.type === 'trigger';

export const isAINode = (node: FlowNodeType): node is Node<AINodeData> =>
  node.data.type === 'ai';

export const isActionNode = (node: FlowNodeType): node is Node<ActionNodeData> =>
  node.data.type === 'action';

export const isFlowNode = (node: FlowNodeType): node is Node<FlowNodeData> =>
  node.data.type === 'flow';

export interface ExecutionState {
  id: string;
  matrixId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  nodeStates: Record<string, NodeState>;
}

export interface NodeState {
  status: 'pending' | 'running' | 'completed' | 'error';
  input?: unknown;
  output?: unknown;
  error?: Error;
}
