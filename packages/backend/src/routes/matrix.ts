import { Router } from 'express';
import { db } from '../db';
import { matrices } from '../db/schema';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

const router = Router();

const createMatrixSchema = z.object({
  projectId: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val)),
  name: z.string(),
  description: z.string(),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
});

const updateMatrixSchema = z.object({
  projectId: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

router.post('/', async (req, res) => {
  try {
    const data = createMatrixSchema.parse(req.body);
    const result = await db
      .insert(matrices)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        nodes: JSON.stringify(data.nodes),
        edges: JSON.stringify(data.edges),
      })
      .returning();

    // Parse JSON strings back to objects for the response
    const matrix = {
      ...result[0],
      nodes: JSON.parse(result[0].nodes),
      edges: JSON.parse(result[0].edges),
    };

    res.json({ success: true, data: matrix });
  } catch (error) {
    console.error('Create matrix error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get all matrices for a project
router.get('/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      throw new Error('Invalid project ID');
    }

    const result = await db.select().from(matrices).where(eq(matrices.projectId, projectId));

    // Parse JSON strings to objects
    const matrixList = result.map((matrix) => ({
      ...matrix,
      nodes: JSON.parse(matrix.nodes),
      edges: JSON.parse(matrix.edges),
    }));

    res.json({ success: true, data: matrixList });
  } catch (error) {
    console.error('Get matrices error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get a specific matrix by project ID and matrix ID
router.get('/:projectId/:matrixId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const matrixId = parseInt(req.params.matrixId, 10);

    if (isNaN(projectId) || isNaN(matrixId)) {
      throw new Error('Invalid project ID or matrix ID');
    }

    const result = await db
      .select()
      .from(matrices)
      .where(and(eq(matrices.projectId, projectId), eq(matrices.id, matrixId)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Matrix not found',
      });
    }

    // Parse JSON strings to objects
    const matrix = {
      ...result[0],
      nodes: JSON.parse(result[0].nodes),
      edges: JSON.parse(result[0].edges),
    };

    res.json({ success: true, data: matrix });
  } catch (error) {
    console.error('Get matrix error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Update a matrix
router.put('/:matrixId', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId, 10);
    if (isNaN(matrixId)) {
      throw new Error('Invalid matrix ID');
    }

    const data = updateMatrixSchema.parse(req.body);
    const updateData: any = { ...data };

    // Convert arrays to JSON strings if they exist
    if (data.nodes) {
      updateData.nodes = JSON.stringify(data.nodes);
    }
    if (data.edges) {
      updateData.edges = JSON.stringify(data.edges);
    }

    // Add updated timestamp
    updateData.updated = new Date();

    const result = await db
      .update(matrices)
      .set(updateData)
      .where(eq(matrices.id, matrixId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Matrix not found',
      });
    }

    // Parse JSON strings back to objects for the response
    const matrix = {
      ...result[0],
      nodes: JSON.parse(result[0].nodes),
      edges: JSON.parse(result[0].edges),
    };

    res.json({ success: true, data: matrix });
  } catch (error) {
    console.error('Update matrix error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export const matrixRoutes = router;
