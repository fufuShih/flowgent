import type { Node } from '@xyflow/react';
import type { NodeDataType, NodeHandler, ActionTriggerType } from '@/services';

type NodeTemplate = Omit<Node<NodeDataType>, 'id' | 'position'>;

// Define input/output types for better reusability
const IO = {
  any: { type: 'any' },
  string: { type: 'string' },
  boolean: { type: 'boolean' },
} as const;

// Define common node outputs
const outputs = {
  single: (type = IO.any) => [{ id: 'out-1', name: 'output', ...type }],
  flow: [
    { id: 'out-1', name: 'true', ...IO.any },
    { id: 'out-2', name: 'false', ...IO.any },
  ],
} as const;

// Define common node inputs
const inputs = {
  single: (type = IO.any) => [{ id: 'in-1', name: 'input', ...type }],
  none: [],
} as const;

// Default handlers for each node type
const defaultHandlers: Record<string, NodeHandler> = {
  action: async (input?: any) => {
    console.log('Action node executing:', input);
    return { status: true, output: `Action executed: ${input || 'no input'}` };
  },
  ai: async (input: any) => {
    console.log('AI node processing:', input);
    return { result: `AI processed: ${input}` };
  },
  flow: async (input: any) => {
    console.log('Flow node evaluating:', input);
    const condition = Math.random() > 0.5;
    return { result: condition, output: input };
  },
};

// Helper function to create action node template
const createActionNode = (
  label: string,
  actionType: ActionTriggerType,
  action: string,
  extraParams: Record<string, any> = {}
): NodeTemplate => ({
  type: 'action',
  data: {
    type: 'action',
    label,
    params: {
      actionType,
      action,
      ...extraParams,
    },
    inputs:
      actionType === 'input'
        ? inputs.single()
        : ([...inputs.none] as { type: string; id: string; name: string }[]),
    outputs: outputs.single(),
    handler: defaultHandlers.action,
  },
});

export const nodeTemplates: Record<string, NodeTemplate> = {
  // Action nodes
  manualTrigger: createActionNode('Manual Trigger', 'manual', 'trigger'),
  cronTrigger: createActionNode('Scheduled Trigger', 'cron', 'trigger', {
    schedule: '0 * * * *', // Default: every hour
  }),
  action: createActionNode('Action', 'input', 'process'),

  // AI node
  ai: {
    type: 'ai',
    data: {
      type: 'ai',
      label: 'AI Processing',
      params: {
        prompt: 'Enter your prompt',
      },
      inputs: inputs.single(),
      outputs: outputs.single(),
      handler: defaultHandlers.ai,
    },
  },

  // Flow control node
  flow: {
    type: 'flow',
    data: {
      type: 'flow',
      label: 'Flow Control',
      params: {
        condition: 'Set condition',
      },
      inputs: inputs.single(),
      outputs: [...outputs.flow] as { type: string; id: string; name: string }[],
      handler: defaultHandlers.flow,
    },
  },
};
