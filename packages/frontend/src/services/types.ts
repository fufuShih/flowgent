import type { Node, Edge } from '@xyflow/react';
import type {
  Matrix as ApiMatrix,
  Project as ApiProject,
  Trigger,
} from '../openapi-client/types.gen';

// Extend API types
export interface Matrix extends Required<ApiMatrix> {
  nodes?: any[];
  edges?: any[];
  created: string;
  updated: string;
}

export interface Project extends Required<ApiProject> {
  created: string;
  updated: string;
}

// DTO types
export interface CreateMatrixDto {
  name: string;
  description?: string;
  projectId: string;
  isSubMatrix?: boolean;
  config?: Record<string, unknown>;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

// Node related types
export type NodeType = 'trigger' | 'action' | 'condition' | 'subMatrix' | 'transformer' | 'loop';

export interface BaseNode {
  id: number;
  matrixId: number;
  type: NodeType;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  created?: string;
  updated?: string;
}

// Flow editor types
export type NodeDataType = {
  id: string;
  type: string;
  label: string;
  params: Record<string, any>;
  inputs: Array<{ id: string; name: string; type: string }>;
  outputs: Array<{ id: string; name: string; type: string }>;
  handler?: (input?: any) => Promise<any>;
};

export type FlowNodeType = Node<NodeDataType>;
export type FlowEdge = Edge;

export type NodeHandler = (input?: any) => Promise<any>;
export type ActionTriggerType = 'manual' | 'cron' | 'input';

// Type guards
export const isTriggerNode = (node: BaseNode): node is TriggerNode => {
  return node.type === 'trigger';
};

export const isActionNode = (node: BaseNode): node is ActionNode => {
  return node.type === 'action';
};

export const isConditionNode = (node: BaseNode): node is ConditionNode => {
  return node.type === 'condition';
};

export const isSubMatrixNode = (node: BaseNode): node is SubMatrixNode => {
  return node.type === 'subMatrix';
};

export const isTransformerNode = (node: BaseNode): node is TransformerNode => {
  return node.type === 'transformer';
};

export const isLoopNode = (node: BaseNode): node is LoopNode => {
  return node.type === 'loop';
};

// Node type interfaces
export interface TriggerNode extends BaseNode {
  type: 'trigger';
  config: {
    triggerType: string;
    conditions?: Record<string, unknown>;
  };
}

export interface ActionNode extends BaseNode {
  type: 'action';
  config: {
    actionType: string;
    parameters: Record<string, unknown>;
  };
}

export interface ConditionNode extends BaseNode {
  type: 'condition';
  config: {
    conditions: Array<{
      condition: string;
      target: string;
    }>;
  };
}

export interface SubMatrixNode extends BaseNode {
  type: 'subMatrix';
  subMatrixId: number;
  config: {
    inputMapping: Record<string, string>;
    outputMapping: Record<string, string>;
  };
}

export interface TransformerNode extends BaseNode {
  type: 'transformer';
  config: {
    transformations: Array<{
      source: string;
      target: string;
      transform: string;
    }>;
  };
}

export interface LoopNode extends BaseNode {
  type: 'loop';
  config: {
    iteratorKey: string;
    maxIterations?: number;
    breakCondition?: string;
  };
}
