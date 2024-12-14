import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';
export interface Project {
  id: string;
  name: string;
  matrices: Matrix[];
  created: Date;
  updated: Date;
}

export interface Matrix {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  created: Date;
  updated: Date;
}

export interface InputOutput {
  id: string;
  name: string;
  type: string;
}

export interface NodeDataType {
  label: string;
  params: Record<string, unknown>;
  inputs: InputOutput[];
  outputs: InputOutput[];
  [key: string]: unknown;
}

export type FlowNode = ReactFlowNode<NodeDataType>;
export type FlowEdge = ReactFlowEdge;

export type NodeType =
  | 'trigger'
  | 'action'
  | 'flow'
  | 'ai';

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
