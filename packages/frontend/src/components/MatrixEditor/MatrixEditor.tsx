import { useState, useCallback, useEffect } from 'react';
import { ReactFlow,
  type Node as FlowNode,
  Edge,
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
  Connection as FlowConnection,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Save } from 'lucide-react';
import { mockMatrix } from './mock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MatrixService } from '@/services/matrix.service';
import { nodeTemplates } from './nodeTemplates';


const CustomNode = ({ data, type }: any) => {
  const bgColors = {
    trigger: '#ff9900',
    action: '#00b894',
    ai: '#0984e3',
    flow: '#6c5ce7',
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md border"
         style={{ background: bgColors[type as keyof typeof bgColors] }}>
      {/* Input Handles */}
      {data.inputs.map((input: any, index: number) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Top}
          id={input.id}
          style={{
            left: `${((index + 1) / (data.inputs.length + 1)) * 100}%`,
            background: '#fff',
            width: 8,
            height: 8,
          }}
        />
      ))}

      {/* Node Label */}
      <div className="text-white font-bold">{data.label}</div>

      {/* Parameters Display */}
      {Object.keys(data.params).length > 0 && (
        <div className="text-white text-xs mt-1">
          {Object.entries(data.params).map(([key, value]) => (
            <div key={key}>{key}: {String(value)}</div>
          ))}
        </div>
      )}

      {/* Output Handles */}
      {data.outputs.map((output: any, index: number) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Bottom}
          id={output.id}
          style={{
            left: `${((index + 1) / (data.outputs.length + 1)) * 100}%`,
            background: '#fff',
            width: 8,
            height: 8,
          }}
        />
      ))}
    </div>
  );
};

const nodeTypes = {
  trigger: (props: any) => <CustomNode {...props} type="trigger" />,
  action: (props: any) => <CustomNode {...props} type="action" />,
  ai: (props: any) => <CustomNode {...props} type="ai" />,
  flow: (props: any) => <CustomNode {...props} type="flow" />,
};

export const MatrixEditor = ({ projectId, matrixId }: { projectId: string; matrixId: string }) => {
  // Replace direct mockMatrix usage with proper matrix loading
  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    const matrix = MatrixService.getById(projectId, matrixId);
    return matrix?.nodes || mockMatrix.nodes;
  });
  const [edges, setEdges] = useState<Edge[]>(mockMatrix.edges);
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback((params: FlowConnection) => {
    // Validate connection
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);

    if (!sourceNode || !targetNode) return;

    const sourceOutput = sourceNode.data.outputs.find((o: any) => o.id === params.sourceHandle);
    const targetInput = targetNode.data.inputs.find((i: any) => i.id === params.targetHandle);

    if (!sourceOutput || !targetInput) return;

    setEdges((eds) => [
      ...eds,
      {
        ...params,
        animated: true,
        id: `e${params.source}-${params.target}`
      }
    ]);
  }, [nodes]);

  // Add useEffect to reload nodes when projectId or matrixId changes
  useEffect(() => {
    const matrix = MatrixService.getById(projectId, matrixId);
    if (matrix) {
      setNodes(matrix.nodes);
      setEdges(matrix.edges);
    }
  }, [projectId, matrixId]);

  // Add node position calculation helper
  const calculateNewNodePosition = () => {
    const existingNodes = nodes.length;
    return {
      x: 250 + (existingNodes % 2) * 200,
      y: 25 + Math.floor(existingNodes / 2) * 150
    };
  };

  const handleAddNode = (templateId: string) => {
    const template = nodeTemplates[templateId];
    if (!template) return;

    const position = calculateNewNodePosition();
    const newNode = {
      ...template,
      id: `${template.type}-${Date.now()}`,
      position
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    try {
      await MatrixService.update(projectId, matrixId, {
        nodes,
        edges,
        updated: new Date()
      });
    } catch (error) {
      console.error('Failed to save matrix:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full p-4">
      <div className="max-w-7xl mx-auto h-full">
        <Card className="h-full w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-2xl font-semibold tracking-tight">Flow Editor</h2>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Node
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Node Type</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    {Object.entries(nodeTemplates).map(([id, template]) => (
                      <Button
                        key={id}
                        variant="outline"
                        onClick={() => handleAddNode(id)}
                      >
                        {template.data.label}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
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
              nodeTypes={nodeTypes}
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
