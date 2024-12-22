import { Router } from 'express';
import { and, desc, eq, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { matrix, matrixStatusEnum, nodes, connections, projects } from '../db/schema';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createMatrixSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft', 'error']).default('draft'),
  config: z.record(z.any()).default({}),
  parentMatrixId: z.number().optional(),
});

const updateMatrixSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft', 'error']).optional(),
  config: z.record(z.any()).optional(),
  version: z.number().optional(),
});

const queryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['active', 'inactive', 'draft', 'error']).optional(),
  version: z.coerce.number().optional(),
  includeNodes: z.coerce.boolean().default(false),
  includeConnections: z.coerce.boolean().default(false),
});

// GET /projects/:projectId/matrix
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Verify project exists
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project.length) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { page, limit, status, version } = queryParamsSchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [eq(matrix.projectId, projectId)];
    if (status) {
      conditions.push(eq(matrix.status, status));
    }
    if (version) {
      conditions.push(eq(matrix.version, version));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(matrix)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(matrix)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(matrix.created));

    res.json({
      data: results,
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching matrices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /matrix/:matrixId
router.get('/:matrixId', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const { includeNodes, includeConnections } = queryParamsSchema.parse(req.query);

    const matrixData = await db.select().from(matrix).where(eq(matrix.id, matrixId)).limit(1);

    if (!matrixData.length) {
      return res.status(404).json({ error: 'Matrix not found' });
    }

    const result: any = matrixData[0];

    if (includeNodes) {
      const matrixNodes = await db.select().from(nodes).where(eq(nodes.matrixId, matrixId));
      result.nodes = matrixNodes;
    }

    if (includeConnections) {
      const matrixConnections = await db
        .select()
        .from(connections)
        .where(eq(connections.matrixId, matrixId));
      result.connections = matrixConnections;
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching matrix:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /projects/:projectId/matrix
router.post('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Verify project exists
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project.length) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const validatedData = createMatrixSchema.parse(req.body);

    // If parentMatrixId is provided, verify it exists
    if (validatedData.parentMatrixId) {
      const parentMatrix = await db
        .select()
        .from(matrix)
        .where(eq(matrix.id, validatedData.parentMatrixId))
        .limit(1);

      if (!parentMatrix.length) {
        return res.status(404).json({ error: 'Parent matrix not found' });
      }
    }

    const [newMatrix] = await db
      .insert(matrix)
      .values({
        ...validatedData,
        projectId,
        version: 1,
      })
      .returning();

    res.status(201).json(newMatrix);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating matrix:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /matrix/:matrixId
router.patch('/:matrixId', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const validatedData = updateMatrixSchema.parse(req.body);

    // Check if matrix exists
    const existingMatrix = await db.select().from(matrix).where(eq(matrix.id, matrixId)).limit(1);

    if (!existingMatrix.length) {
      return res.status(404).json({ error: 'Matrix not found' });
    }

    const [updatedMatrix] = await db
      .update(matrix)
      .set({
        ...validatedData,
        updated: new Date(),
      })
      .where(eq(matrix.id, matrixId))
      .returning();

    res.json(updatedMatrix);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating matrix:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /matrix/:matrixId
router.delete('/:matrixId', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    // Check if matrix exists and get its details
    const existingMatrix = await db.select().from(matrix).where(eq(matrix.id, matrixId)).limit(1);

    if (!existingMatrix.length) {
      return res.status(404).json({ error: 'Matrix not found' });
    }

    // Check for child matrices
    const childMatrices = await db.select().from(matrix).where(eq(matrix.parentMatrixId, matrixId));

    if (childMatrices.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete matrix with child matrices',
        childMatrixIds: childMatrices.map((m) => m.id),
      });
    }

    // Delete matrix (cascade deletion will handle nodes and connections)
    await db.delete(matrix).where(eq(matrix.id, matrixId));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting matrix:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /matrix/:matrixId/clone
router.post('/:matrixId/clone', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    // Get original matrix
    const originalMatrix = await db.select().from(matrix).where(eq(matrix.id, matrixId)).limit(1);

    if (!originalMatrix.length) {
      return res.status(404).json({ error: 'Matrix not found' });
    }

    // Start transaction for cloning process
    const [clonedMatrix] = await db.transaction(async (tx) => {
      // Clone matrix
      const [newMatrix] = await tx
        .insert(matrix)
        .values({
          projectId: originalMatrix[0].projectId,
          name: `${originalMatrix[0].name} (Clone)`,
          description: originalMatrix[0].description,
          status: 'draft',
          config: originalMatrix[0].config,
          version: 1,
        })
        .returning();

      // Clone nodes
      const originalNodes = await tx.select().from(nodes).where(eq(nodes.matrixId, matrixId));

      const nodeIdMap = new Map();

      if (originalNodes.length > 0) {
        const clonedNodes = await tx
          .insert(nodes)
          .values(
            originalNodes.map((node) => {
              const { id, ...nodeData } = node;
              return {
                ...nodeData,
                matrixId: newMatrix.id,
                subMatrixId: null, // Reset subMatrixId to be updated later if needed
              };
            })
          )
          .returning();

        // Create mapping of old node IDs to new node IDs
        originalNodes.forEach((node, index) => {
          nodeIdMap.set(node.id, clonedNodes[index].id);
        });
      }

      // Clone connections with updated node references
      const originalConnections = await tx
        .select()
        .from(connections)
        .where(eq(connections.matrixId, matrixId));

      if (originalConnections.length > 0) {
        await tx.insert(connections).values(
          originalConnections.map((conn) => {
            const { id, ...connData } = conn;
            return {
              ...connData,
              matrixId: newMatrix.id,
              sourceId: nodeIdMap.get(conn.sourceId),
              targetId: nodeIdMap.get(conn.targetId),
            };
          })
        );
      }

      return [newMatrix];
    });

    res.status(201).json(clonedMatrix);
  } catch (error) {
    console.error('Error cloning matrix:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
