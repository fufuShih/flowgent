import { Router } from 'express';
import { db } from '../db';
import { matrices } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

interface NodeData {
  id: string;
  type: string;
  data: {
    params: Record<string, any>;
    [key: string]: any;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

interface ConnectedNode {
  node: NodeData;
  edgeId: string;
  sourceHandle: string;
  targetHandle: string;
}

interface NodeResult {
  success: boolean;
  result?: any;
  error?: string;
}

interface ExecuteResult {
  nodeId: string;
  success: boolean;
  result?: any;
  error?: string;
}

// Input validation schemas
const executeInputSchema = z.object({
  input: z.any().optional(),
});

// Helper function to find node in matrix
const findNode = (nodes: any[], nodeId: string) => {
  return nodes.find((node) => node.id === nodeId);
};

// Helper function to execute node based on type
const executeNode = async (node: any, input?: any): Promise<NodeResult> => {
  try {
    switch (node.type) {
      case 'action':
        return {
          success: true,
          result: {
            type: 'action',
            output: `Action executed with input: ${JSON.stringify(input)}`,
            actionType: node.data.params.actionType,
          },
        };

      case 'ai':
        return {
          success: true,
          result: {
            type: 'ai',
            output: `AI processed input: ${JSON.stringify(input)}`,
            prompt: node.data.params.prompt,
          },
        };

      case 'flow':
        const condition = Math.random() > 0.5; // Simulate condition evaluation
        return {
          success: true,
          result: {
            type: 'flow',
            output: `Flow evaluated to: ${condition}`,
            condition: node.data.params.condition,
            path: condition ? 'true' : 'false',
          },
        };

      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Node execution failed',
    };
  }
};

// Execute single node
router.post('/node/:projectId/:matrixId/:nodeId', async (req, res) => {
  try {
    const { projectId, matrixId, nodeId } = req.params;
    const { input } = executeInputSchema.parse(req.body);

    const matrix = await db
      .select()
      .from(matrices)
      .where(and(eq(matrices.projectId, parseInt(projectId)), eq(matrices.id, parseInt(matrixId))))
      .limit(1);

    if (!matrix.length) {
      return res.status(404).json({
        success: false,
        error: 'Matrix not found',
      });
    }

    const nodes = JSON.parse(matrix[0].nodes);
    const targetNode = findNode(nodes, nodeId);

    if (!targetNode) {
      return res.status(404).json({
        success: false,
        error: 'Node not found',
      });
    }

    const result = await executeNode(targetNode, input);
    res.json(result);
  } catch (error) {
    console.error('Execute node error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute node',
    });
  }
});

// Execute from specific node
const executeFromNode = async (
  matrixData: any,
  startNodeId: string,
  input?: any
): Promise<{
  startNode: ExecuteResult;
  connectedResults: ExecuteResult[];
}> => {
  const nodes = JSON.parse(matrixData.nodes) as NodeData[];
  const edges = JSON.parse(matrixData.edges) as Edge[];

  const startNode = findNode(nodes, startNodeId);
  if (!startNode) {
    throw new Error('Start node not found');
  }

  const result = await executeNode(startNode, input);

  const connectedNodes = edges
    .filter((edge) => edge.source === startNodeId)
    .map((edge) => {
      const targetNode = findNode(nodes, edge.target);
      return {
        node: targetNode,
        edgeId: edge.id,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      };
    }) as ConnectedNode[];

  const results = await Promise.all(
    connectedNodes.map(async ({ node }) => {
      const nodeResult = await executeNode(node, result.result);
      return {
        nodeId: node.id,
        ...nodeResult,
      };
    })
  );

  return {
    startNode: {
      nodeId: startNodeId,
      ...result,
    },
    connectedResults: results,
  };
};

// Add new route for executing from specific node
router.post('/node/:projectId/:matrixId/:nodeId/start', async (req, res) => {
  try {
    const { projectId, matrixId, nodeId } = req.params;
    const { input } = executeInputSchema.parse(req.body);

    const matrix = await db
      .select()
      .from(matrices)
      .where(and(eq(matrices.projectId, parseInt(projectId)), eq(matrices.id, parseInt(matrixId))))
      .limit(1);

    if (!matrix.length) {
      return res.status(404).json({
        success: false,
        error: 'Matrix not found',
      });
    }

    const result = await executeFromNode(matrix[0], nodeId, input);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Execute from node error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute from node',
    });
  }
});

// Add this new route for executing entire matrix
router.post('/matrix/:projectId/:matrixId', async (req, res) => {
  try {
    const { projectId, matrixId } = req.params;
    const { input } = executeInputSchema.parse(req.body);

    const matrix = await db
      .select()
      .from(matrices)
      .where(and(eq(matrices.projectId, parseInt(projectId)), eq(matrices.id, parseInt(matrixId))))
      .limit(1);

    if (!matrix.length) {
      return res.status(404).json({
        success: false,
        error: 'Matrix not found',
      });
    }

    const nodes = JSON.parse(matrix[0].nodes);
    const edges = JSON.parse(matrix[0].edges);

    // Find trigger/start nodes (nodes without incoming edges)
    const startNodes = nodes.filter((node: NodeData) => {
      return !edges.some((edge: Edge) => edge.target === node.id);
    });

    // Execute all start nodes and their connected nodes
    const results = await Promise.all(
      startNodes.map(async (node: NodeData) => {
        const executionResult = await executeFromNode(matrix[0], node.id, input);
        return {
          startNodeId: node.id,
          ...executionResult,
        };
      })
    );

    res.json({
      success: true,
      result: results,
    });
  } catch (error) {
    console.error('Execute matrix error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute matrix',
    });
  }
});

export const executeRoutes = router;
