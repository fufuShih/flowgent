import { Router } from 'express';
import { db } from '../db';
import { matrices } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Input validation schemas
const executeInputSchema = z.object({
  input: z.any().optional(),
});

// Helper function to find node in matrix
const findNode = (nodes: any[], nodeId: string) => {
  return nodes.find((node) => node.id === nodeId);
};

// Helper function to execute node based on type
const executeNode = async (node: any, input?: any) => {
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

    // Get matrix
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

    // Parse nodes and find target node
    const nodes = JSON.parse(matrix[0].nodes);
    const targetNode = findNode(nodes, nodeId);

    if (!targetNode) {
      return res.status(404).json({
        success: false,
        error: 'Node not found',
      });
    }

    // Execute node
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

// Execute entire matrix
router.post('/matrix/:projectId/:matrixId', async (req, res) => {
  try {
    const { projectId, matrixId } = req.params;
    const { input } = executeInputSchema.parse(req.body);

    // Get matrix
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

    // Parse nodes and edges
    const nodes = JSON.parse(matrix[0].nodes);
    const edges = JSON.parse(matrix[0].edges);

    // Find start nodes (nodes with no incoming edges)
    const startNodes = nodes.filter((node: any) => {
      return !edges.some((edge: any) => edge.target === node.id);
    });

    // Execute start nodes and collect results
    const results = await Promise.all(
      startNodes.map(async (node: any) => {
        const result = await executeNode(node, input);
        return {
          nodeId: node.id,
          ...result,
        };
      })
    );

    res.json({
      success: true,
      result: {
        executedNodes: results.length,
        results,
      },
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
