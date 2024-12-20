import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Panel,
  applyEdgeChanges,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  Handle,
  Position,
  MarkerType,
  ConnectionMode, // Add this import
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Save, Trash2, ZoomIn, ZoomOut, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { nodeTemplates } from './nodeTemplates';
import { FlowNodeType, FlowEdge, NodeDataType, ExecutionService, MatrixService } from '@/services';

// CustomNode component props type
interface CustomNodeProps {
  data: NodeDataType & { id: string };
  type: string;
  projectId: string;
  matrixId: string;
}

const CustomNode = ({ data, type, projectId, matrixId }: CustomNodeProps) => {
  // Update bgColors to handle action types
  const bgColors = {
    action: (actionType?: string) => {
      switch (actionType) {
        case 'manual':
        case 'cron':
          return 'bg-orange-500';
        case 'input':
          return 'bg-emerald-500';
        default:
          return 'bg-gray-500';
      }
    },
    ai: 'bg-blue-500',
    flow: 'bg-purple-500',
  };

  const handleExecute = async () => {
    if (!data.id) {
      console.error('Node ID is undefined', data);
      return;
    }

    try {
      const result = await ExecutionService.executeNode(projectId, matrixId, data.id, {
        type: type,
        params: data.params,
      });

      if (result.success) {
        console.log(`Node ${data.label} executed successfully:`, result.result);
        // Here you could update UI to show execution result
      } else {
        console.error(`Node ${data.label} execution failed:`, result.result);
        // Handle error in UI
      }
    } catch (error) {
      console.error(`Error executing node ${data.label}:`, error);
      // Handle error in UI
    }
  };

  // Get background color based on node type and action type
  const getBgColor = () => {
    if (type === 'action' && 'actionType' in data.params) {
      return bgColors.action(data.params.actionType as string);
    }
    return bgColors[type as keyof typeof bgColors] || 'bg-gray-500';
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md border ${getBgColor()}`}>
      {/* Input Handles */}
      {data.inputs.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Top}
          id={input.id}
          className="w-2 h-2 bg-white"
          style={{
            left: `${((index + 1) / (data.inputs.length + 1)) * 100}%`,
          }}
        />
      ))}

      {/* Node Content */}
      <div className="text-white font-bold">{data.label}</div>
      {Object.entries(data.params).length > 0 && (
        <div className="text-white text-xs mt-1 space-y-1">
          {Object.entries(data.params).map(([key, value]) => (
            <div key={key} className="truncate">
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}

      {/* Execute button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-white hover:text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Button clicked');
          handleExecute();
        }}
      >
        Execute
      </Button>

      {/* Output Handles */}
      {data.outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Bottom}
          id={output.id}
          className="w-2 h-2 bg-white"
          style={{
            left: `${((index + 1) / (data.outputs.length + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

// Add this type definition near the top with other interfaces
type NodeProps = {
  data: NodeDataType;
  projectId: string;
  matrixId: string;
  [key: string]: any;
};

// Add type guard for node templates
const isValidTemplateId = (id: string): id is keyof typeof nodeTemplates => {
  return id in nodeTemplates;
};

export const MatrixEditor = ({ projectId, matrixId }: { projectId: string; matrixId: string }) => {
  const [nodes, setNodes] = useState<FlowNodeType[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FlowNodeType | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    const loadMatrix = async () => {
      setIsLoading(true);
      try {
        const matrix = await MatrixService.getById(projectId, matrixId);
        if (matrix) {
          setNodes(matrix.nodes || []);
          setEdges(matrix.edges || []);
          setError(null);
        } else {
          throw new Error('Matrix not found');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load matrix');
      } finally {
        setIsLoading(false);
      }
    };

    loadMatrix();
  }, [projectId, matrixId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as FlowNodeType[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds) as FlowEdge[]),
    []
  );

  const defaultEdgeOptions = {
    animated: true,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
    style: {
      strokeWidth: 2,
    },
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      const sourceOutput = sourceNode.data.outputs.find((o) => o.id === params.sourceHandle);
      const targetInput = targetNode.data.inputs.find((i) => i.id === params.targetHandle);

      if (!sourceOutput || !targetInput) return;

      // Prevent multiple connections to the same input
      const existingConnection = edges.find(
        (e) => e.target === params.target && e.targetHandle === params.targetHandle
      );

      if (existingConnection) return;

      const newEdge: FlowEdge = {
        ...params,
        id: `e${params.source}-${params.target}-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
        },
      };

      setEdges((eds) => [...eds, newEdge]);
    },
    [nodes, edges]
  );

  const calculateNewNodePosition = useCallback(() => {
    const padding = 50;
    const spacing = 200;
    const existingNodes = nodes.length;

    return {
      x: padding + (existingNodes % 3) * spacing,
      y: padding + Math.floor(existingNodes / 3) * spacing,
    };
  }, [nodes]);

  const handleAddNode = useCallback(
    (templateId: string) => {
      if (!isValidTemplateId(templateId)) {
        console.error(`Invalid template ID: ${templateId}`);
        return;
      }

      const template = nodeTemplates[templateId];
      if (!template) return;

      const nodeId = `${template.type}-${Date.now()}`;
      const position = calculateNewNodePosition();

      const newNode: FlowNodeType = {
        ...template,
        id: nodeId, // Set node ID
        position,
        data: {
          ...template.data,
          id: nodeId, // Set same ID in data
          label: `${template.data.label} ${nodes.length + 1}`,
        },
      };

      console.log('Creating new node:', newNode); // Debug log
      setNodes((nds) => [...nds, newNode]);
      setIsDialogOpen(false);
    },
    [nodes, calculateNewNodePosition]
  );

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
  }, [selectedNode]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await MatrixService.update(projectId, matrixId, { nodes, edges });
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save matrix');
    } finally {
      setIsSaving(false);
    }
  }, [projectId, matrixId, nodes, edges]);

  const handleExecuteMatrix = useCallback(async () => {
    setIsExecuting(true);
    try {
      const result = await ExecutionService.executeMatrix(projectId, matrixId);
      if (result.success) {
        console.log('Matrix executed successfully:', result.result);
      } else {
        setError(`Failed to execute matrix: ${result.error}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to execute matrix');
    } finally {
      setIsExecuting(false);
    }
  }, [projectId, matrixId]);

  if (isLoading) {
    return <div className="p-4">Loading matrix...</div>;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full p-4">
      <div className="max-w-7xl mx-auto h-full">
        <Card className="h-full w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-2xl font-semibold tracking-tight">Flow Editor</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExecuteMatrix}
                disabled={isExecuting}
              >
                <Play className="mr-2 h-4 w-4" />
                {isExecuting ? 'Executing...' : 'Execute Matrix'}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
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
                      <Button key={id} variant="outline" onClick={() => handleAddNode(id)}>
                        {template.data.label}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              {selectedNode && (
                <Button variant="destructive" size="sm" onClick={handleDeleteNode}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Node
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Flow'}
              </Button>
            </div>
          </div>
          <CardContent className="p-0 h-[calc(100%-5rem)]">
            {error && (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              fitView
              defaultEdgeOptions={defaultEdgeOptions}
              className="bg-slate-50 dark:bg-slate-900"
              nodeTypes={{
                trigger: (props: { data: NodeDataType & { id: string }; [key: string]: any }) => (
                  <CustomNode {...props} type="trigger" projectId={projectId} matrixId={matrixId} />
                ),
                action: (props: { data: NodeDataType & { id: string }; [key: string]: any }) => (
                  <CustomNode {...props} type="action" projectId={projectId} matrixId={matrixId} />
                ),
                ai: (props: { data: NodeDataType & { id: string }; [key: string]: any }) => (
                  <CustomNode {...props} type="ai" projectId={projectId} matrixId={matrixId} />
                ),
                flow: (props: { data: NodeDataType & { id: string }; [key: string]: any }) => (
                  <CustomNode {...props} type="flow" projectId={projectId} matrixId={matrixId} />
                ),
              }}
              snapToGrid={true}
              snapGrid={[15, 15]}
              connectionMode={ConnectionMode.Loose}
            >
              <Background />
              <Controls />
              <Panel position="top-right" className="bg-background/80 p-2 rounded-lg backdrop-blur">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {}} className="h-8 w-8 p-0">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {}} className="h-8 w-8 p-0">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </div>
              </Panel>
            </ReactFlow>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
