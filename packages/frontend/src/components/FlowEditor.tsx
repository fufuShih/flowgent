import { useState, useCallback } from 'react';
import { ReactFlow,
  Node as FlowNode,
  Edge,
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
  Connection as FlowConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Save } from 'lucide-react';

const initialNodes: FlowNode[] = [
  {
    id: '1',
    type: 'input',
    data: {
      label: 'Input Node',
      parameters: {},
      inputParameters: [],
      outputParameters: [{ name: 'output', type: 'string' }]
    },
    position: { x: 250, y: 25 },
  },
  {
    id: '2',
    type: 'default',
    data: {
      label: 'Processing Node',
      parameters: {},
      inputParameters: [{ name: 'input', type: 'string', required: true }],
      outputParameters: [{ name: 'output', type: 'string' }]
    },
    position: { x: 250, y: 125 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
];

export const FlowEditor = () => {
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: FlowConnection) =>
      setEdges((eds) => [...eds, { ...params, animated: true, id: `e${params.source}-${params.target}` }]),
    []
  );

  const handleSave = () => {
    const flowData = {
      nodes,
      edges,
      settings: {
        timezone: 'UTC',
      },
    };
    console.log('Saving flow:', flowData);
    // Here we would typically call an API to save the flow
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full p-4">
      <div className="max-w-7xl mx-auto h-full">
        <Card className="h-full w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-2xl font-semibold tracking-tight">Flow Editor</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Node
              </Button>
              <Button onClick={handleSave} className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Save Flow
              </Button>
            </div>
          </div>
          <CardContent className="p-0 h-[calc(100%-5rem)]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              className="bg-slate-50 dark:bg-slate-900"
            >
              <Background />
              <Controls />
            </ReactFlow>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
