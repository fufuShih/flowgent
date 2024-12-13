export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    parameters?: Record<string, any>;
    inputParameters?: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
    outputParameters?: Array<{
      name: string;
      type: string;
    }>;
  };
}

export interface Connection {
  id: string;
  sourceNode: string;
  sourceOutput: string;
  targetNode: string;
  targetInput: string;
}

export interface FlowTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  nodes: Node[];
  connections: Connection[];
  settings?: {
    errorHandler?: Record<string, any>;
    timezone?: string;
  };
}
