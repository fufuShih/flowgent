import { Matrix } from "@/services/matrix.type";

export const mockMatrix: Matrix = {
  id: 'matrix-1',
  name: 'Test Matrix',
  description: 'A test matrix for development and testing purposes',
  created: new Date('2024-01-01T00:00:00Z'),
  updated: new Date('2024-01-01T00:00:00Z'),
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 25 },
      data: {
        label: 'Start Trigger',
        params: {},
        inputs: [],
        outputs: [
          { id: 'out-1', name: 'output', type: 'string' }
        ]
      }
    },
    {
      id: 'ai-1',
      type: 'ai',
      position: { x: 250, y: 150 },
      data: {
        label: 'AI Processing',
        params: {
          prompt: "Transform the input"
        },
        inputs: [
          { id: 'in-1', name: 'input', type: 'string' }
        ],
        outputs: [
          { id: 'out-1', name: 'result', type: 'string' }
        ]
      }
    },
    {
      id: 'action-1',
      type: 'action',
      position: { x: 250, y: 275 },
      data: {
        label: 'Send Email',
        params: {
          to: "test@example.com"
        },
        inputs: [
          { id: 'in-1', name: 'content', type: 'string' }
        ],
        outputs: [
          { id: 'out-1', name: 'status', type: 'boolean' }
        ]
      }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: 'trigger-1',
      target: 'ai-1',
      sourceHandle: 'out-1',
      targetHandle: 'in-1',
      animated: true
    },
    {
      id: 'e2-3',
      source: 'ai-1',
      target: 'action-1',
      sourceHandle: 'out-1',
      targetHandle: 'in-1',
      animated: true
    }
  ]
};
