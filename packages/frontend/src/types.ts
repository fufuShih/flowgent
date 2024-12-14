import { Matrix, FlowNode, FlowEdge } from './services/matrix.type';

export interface Project {
  id: string;
  name: string;
  matrices: Matrix[];
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

export type { Matrix, FlowNode, FlowEdge };
