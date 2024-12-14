export const nodeTemplates = {
  'trigger': {
    type: 'trigger',
    data: {
      label: 'Start Trigger',
      params: {},
      inputs: [],
      outputs: [
        { id: 'out-1', name: 'output', type: 'string' }
      ]
    }
  },
  'ai': {
    type: 'ai',
    data: {
      label: 'AI Processing',
      params: {
        prompt: "Enter your prompt"
      },
      inputs: [
        { id: 'in-1', name: 'input', type: 'string' }
      ],
      outputs: [
        { id: 'out-1', name: 'result', type: 'string' }
      ]
    }
  },
  'action': {
    type: 'action',
    data: {
      label: 'Action',
      params: {
        action: "Select action"
      },
      inputs: [
        { id: 'in-1', name: 'input', type: 'string' }
      ],
      outputs: [
        { id: 'out-1', name: 'status', type: 'boolean' }
      ]
    }
  },
  'flow': {
    type: 'flow',
    data: {
      label: 'Flow Control',
      params: {
        condition: "Set condition"
      },
      inputs: [
        { id: 'in-1', name: 'input', type: 'any' }
      ],
      outputs: [
        { id: 'out-1', name: 'true', type: 'any' },
        { id: 'out-2', name: 'false', type: 'any' }
      ]
    }
  }
};
