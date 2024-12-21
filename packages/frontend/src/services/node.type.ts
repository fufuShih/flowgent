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
