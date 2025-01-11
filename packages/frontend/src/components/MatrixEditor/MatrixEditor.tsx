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
  ConnectionMode,
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
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
import { MatrixService, NodeService, ConnectionService } from '@/services';
import type { Node, GetApiMatrixByMatrixIdResponse } from '../../openapi-client/types.gen';

import { nodeTemplates } from './nodeTemplates';
interface CustomNodeProps {
  data: Node;
  type: Node['type'];
  projectId: string;
  matrixId: string;
}

const CustomNode = ({ data, type }: CustomNodeProps) => {
  const bgColors: Record<Node['type'], string> = {
    trigger: 'bg-emerald-500',
    action: 'bg-orange-500',
    condition: 'bg-blue-500',
    subMatrix: 'bg-purple-500',
    transformer: 'bg-yellow-500',
    loop: 'bg-pink-500',
  };

  const handleExecute = async () => {
    if (!data.id) return;

    try {
      // Note: Node execution endpoint is not available in the API spec
      // You might need to implement this functionality
      console.log('Execute node:', data.id);
    } catch (error) {
      console.error(`Error executing node ${data.name}:`, error);
    }
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md border ${bgColors[type]}`}>
      <div className="text-white font-bold">{data.name}</div>
      {data.description && <div className="text-white text-xs mt-1">{data.description}</div>}
      {data.config && Object.entries(data.config).length > 0 && (
        <div className="text-white text-xs mt-1 space-y-1">
          {Object.entries(data.config).map(([key, value]) => (
            <div key={key} className="truncate">
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-white hover:text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          handleExecute();
        }}
      >
        Execute
      </Button>
    </div>
  );
};

const isValidTemplateId = (id: string): id is keyof typeof nodeTemplates => {
  return id in nodeTemplates;
};

export const MatrixEditor = ({ projectId, matrixId }: { projectId: string; matrixId: string }) => {
  const [nodes, setNodes] = useState<ReactFlowNode<Node>[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode<Node> | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [baseNodes, setBaseNodes] = useState<Node[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);

  useEffect(() => {
    const loadMatrix = async () => {
      setIsLoading(true);
      try {
        const response = await MatrixService.getMatrix(parseInt(matrixId), {
          includeNodes: true,
          includeConnections: true,
        });

        if (response.success && response.data) {
          const matrix = response.data as GetApiMatrixByMatrixIdResponse;
          if (matrix.nodes) {
            setNodes(
              matrix.nodes.map((node) => ({
                id: String(node.id),
                type: node.type,
                position: {
                  x: node.position?.x ?? 0,
                  y: node.position?.y ?? 0,
                },
                data: node,
              }))
            );
          }
          if (matrix.connections) {
            setEdges(
              matrix.connections.map((conn) => ({
                id: String(conn.id),
                source: String(conn.sourceId),
                target: String(conn.targetId),
                type: conn.type,
              }))
            );
          }
          setError(null);
        } else {
          throw new Error(response.error || 'Failed to load matrix');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load matrix');
      } finally {
        setIsLoading(false);
      }
    };

    loadMatrix();
  }, [matrixId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds) as unknown as ReactFlowNode<Node>[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds) as ReactFlowEdge[]),
    []
  );

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;

      try {
        const response = await ConnectionService.createConnection(parseInt(matrixId), {
          sourceId: parseInt(params.source),
          targetId: parseInt(params.target),
          type: 'default',
        });

        if (response.success && response.data) {
          const newEdge: ReactFlowEdge = {
            id: String(response.data.id),
            source: String(response.data.sourceId),
            target: String(response.data.targetId),
            type: response.data.type,
          };
          setEdges((eds) => [...eds, newEdge]);
        }
      } catch (error) {
        console.error('Failed to create connection:', error);
      }
    },
    [matrixId]
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

  const loadBaseNodes = useCallback(async () => {
    setIsLoadingNodes(true);
    try {
      const response = await NodeService.getBaseNodes();
      if (response.success && response.data) {
        setBaseNodes(response.data);
      }
    } catch (error) {
      console.error('Failed to load base nodes:', error);
    } finally {
      setIsLoadingNodes(false);
    }
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      loadBaseNodes();
    }
  }, [isDialogOpen, loadBaseNodes]);

  const handleAddNode = useCallback(
    async (baseNode: Node) => {
      try {
        const position = calculateNewNodePosition();

        const response = await NodeService.createNode(parseInt(matrixId), {
          type: baseNode.type,
          name: `${baseNode.name} ${nodes.length + 1}`,
          description: baseNode.description ?? undefined,
          position: position,
          config: baseNode.config,
        });

        if (response.success && response.data) {
          const newNode: ReactFlowNode<Node> = {
            id: String(response.data.id),
            type: response.data.type,
            position: {
              x: response.data.position?.x ?? 0,
              y: response.data.position?.y ?? 0,
            },
            data: response.data,
          };
          setNodes((nds) => [...nds, newNode]);
        }
      } catch (error) {
        console.error('Failed to create node:', error);
      }

      setIsDialogOpen(false);
    },
    [matrixId, nodes, calculateNewNodePosition]
  );

  const handleDeleteNode = useCallback(async () => {
    if (!selectedNode) return;

    try {
      const response = await NodeService.deleteNode(parseInt(selectedNode.id));
      if (response.success) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) =>
          eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
        );
        setSelectedNode(null);
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  }, [selectedNode]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await MatrixService.updateMatrix(parseInt(matrixId), {
        config: {
          nodes: nodes.map((n) => ({
            ...n.data,
            position: n.position,
          })),
          connections: edges,
        },
      });

      if (response.success) {
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to save matrix');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save matrix');
    } finally {
      setIsSaving(false);
    }
  }, [matrixId, nodes, edges]);

  const handleExecuteMatrix = useCallback(async () => {
    setIsExecuting(true);
    try {
      // Note: Matrix execution endpoint is not available in the API spec
      // You might need to implement this functionality
      console.log('Execute matrix:', matrixId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to execute matrix');
    } finally {
      setIsExecuting(false);
    }
  }, [matrixId]);

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
                    {isLoadingNodes ? (
                      <div className="col-span-2 text-center">Loading nodes...</div>
                    ) : (
                      baseNodes.map((node) => (
                        <Button key={node.id} variant="outline" onClick={() => handleAddNode(node)}>
                          {node.name}
                        </Button>
                      ))
                    )}
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
              className="bg-slate-50 dark:bg-slate-900"
              nodeTypes={{
                trigger: (props) => (
                  <CustomNode {...props} type="trigger" projectId={projectId} matrixId={matrixId} />
                ),
                action: (props) => (
                  <CustomNode {...props} type="action" projectId={projectId} matrixId={matrixId} />
                ),
                condition: (props) => (
                  <CustomNode
                    {...props}
                    type="condition"
                    projectId={projectId}
                    matrixId={matrixId}
                  />
                ),
                subMatrix: (props) => (
                  <CustomNode
                    {...props}
                    type="subMatrix"
                    projectId={projectId}
                    matrixId={matrixId}
                  />
                ),
                transformer: (props) => (
                  <CustomNode
                    {...props}
                    type="transformer"
                    projectId={projectId}
                    matrixId={matrixId}
                  />
                ),
                loop: (props) => (
                  <CustomNode {...props} type="loop" projectId={projectId} matrixId={matrixId} />
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
