import { Router } from 'express';
import { and, desc, eq, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { matrix, matrixStatusEnum, nodes, connections, projects } from '../db/schema';
import { z } from 'zod';
import { workflowService } from '../services/workflow.service';
import { triggerService } from '../services/trigger.service';

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

const nodeSchema = z.object({
  type: z.enum(['trigger', 'action', 'condition', 'subMatrix', 'transformer', 'loop', 'monitor']),
  name: z.string(),
  description: z.string().nullable(),
  config: z
    .object({
      x: z.number(),
      y: z.number(),
      inPorts: z.array(z.any()).default([]),
      outPorts: z.array(z.any()).default([]),
    })
    .default(() => ({ x: 0, y: 0, inPorts: [], outPorts: [] })),
  subMatrixId: z.number().nullable(),
  typeVersion: z.number().default(1),
  disabled: z.boolean().default(false),
  matrixId: z.number(),
});

const connectionSchema = z.object({
  sourceId: z.number(),
  targetId: z.number(),
  type: z.enum(['default', 'success', 'error', 'condition']).default('default'),
  config: z.record(z.any()).default({}),
  matrixId: z.number(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Node:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The node ID
 *         matrixId:
 *           type: integer
 *           description: The matrix ID this node belongs to
 *         type:
 *           type: string
 *           enum: [trigger, action, condition, subMatrix, transformer, loop, monitor]
 *           description: Node type
 *         name:
 *           type: string
 *           description: Node name
 *         description:
 *           type: string
 *           nullable: true
 *           description: Node description
 *         config:
 *           type: object
 *           properties:
 *             x:
 *               type: number
 *             y:
 *               type: number
 *             inPorts:
 *               type: array
 *               items:
 *                 type: object
 *             outPorts:
 *               type: array
 *               items:
 *                 type: object
 *         subMatrixId:
 *           type: integer
 *           nullable: true
 *           description: ID of sub-matrix (if type is subMatrix)
 *         typeVersion:
 *           type: integer
 *           description: Version of the node type
 *         disabled:
 *           type: boolean
 *           description: Whether the node is disabled
 *         created:
 *           type: string
 *           format: date-time
 *         updated:
 *           type: string
 *           format: date-time
 *       required:
 *         - type
 *         - name
 *         - matrixId
 *
 *     Matrix:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The matrix ID
 *         projectId:
 *           type: integer
 *           description: The project ID this matrix belongs to
 *         name:
 *           type: string
 *           description: Matrix name
 *         description:
 *           type: string
 *           nullable: true
 *           description: Matrix description
 *         status:
 *           type: string
 *           enum: [active, inactive, draft, error]
 *           description: Matrix status
 *         config:
 *           type: object
 *           description: Matrix configuration
 *         version:
 *           type: integer
 *           description: Matrix version number
 *         parentMatrixId:
 *           type: integer
 *           nullable: true
 *           description: ID of the parent matrix (if this is a sub-matrix)
 *         created:
 *           type: string
 *           format: date-time
 *         updated:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - projectId
 *         - name
 *         - status
 *         - version
 *         - created
 *         - updated
 *
 *     Connection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The connection ID
 *         matrixId:
 *           type: integer
 *           description: The matrix ID this connection belongs to
 *         sourceId:
 *           type: integer
 *           description: Source node ID
 *         targetId:
 *           type: integer
 *           description: Target node ID
 *         type:
 *           type: string
 *           enum: [default, success, error, condition]
 *           description: Connection type
 *         config:
 *           type: object
 *           description: Connection configuration
 *         created:
 *           type: string
 *           format: date-time
 *         updated:
 *           type: string
 *           format: date-time
 *       required:
 *         - sourceId
 *         - targetId
 *         - type
 */

/**
 * @swagger
 * /api/matrix/project/{projectId}:
 *   get:
 *     summary: Get all matrices for a project
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft, error]
 *         description: Filter by status
 *       - in: query
 *         name: version
 *         schema:
 *           type: integer
 *         description: Filter by version
 *     responses:
 *       200:
 *         description: List of matrices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Matrix'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/matrix/{matrixId}:
 *   get:
 *     summary: Get a matrix by ID
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *       - in: query
 *         name: includeNodes
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include nodes in response
 *       - in: query
 *         name: includeConnections
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include connections in response
 *     responses:
 *       200:
 *         description: Matrix found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Matrix'
 *                 - type: object
 *                   properties:
 *                     nodes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Node'
 *                     connections:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Connection'
 *       400:
 *         description: Invalid matrix ID
 *       404:
 *         description: Matrix not found
 *       500:
 *         description: Internal server error
 */
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

// POST /matrix/project/{projectId}
/**
 * @swagger
 * /api/matrix/project/{projectId}:
 *   post:
 *     summary: Create a new matrix
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft, error]
 *                 default: draft
 *               config:
 *                 type: object
 *               parentMatrixId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Matrix created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Matrix'
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Project or parent matrix not found
 *       500:
 *         description: Internal server error
 */
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
/**
 * @swagger
 * /api/matrix/{matrixId}:
 *   patch:
 *     summary: Update a matrix
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft, error]
 *               config:
 *                 type: object
 *               version:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Matrix updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Matrix'
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Matrix not found
 *       500:
 *         description: Internal server error
 */
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
/**
 * @swagger
 * /api/matrix/{matrixId}:
 *   delete:
 *     summary: Delete a matrix
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *     responses:
 *       204:
 *         description: Matrix deleted successfully
 *       400:
 *         description: Invalid matrix ID or matrix has child matrices
 *       404:
 *         description: Matrix not found
 *       500:
 *         description: Internal server error
 */
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
/**
 * @swagger
 * /api/matrix/{matrixId}/clone:
 *   post:
 *     summary: Clone a matrix
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID to clone
 *     responses:
 *       201:
 *         description: Matrix cloned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Matrix'
 *       400:
 *         description: Invalid matrix ID
 *       404:
 *         description: Matrix not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/matrix/{matrixId}/workflow:
 *   get:
 *     summary: Get workflow data for a matrix
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:matrixId/workflow', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const workflow = await workflowService.getWorkflow(matrixId);
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/nodes:
 *   post:
 *     summary: Create new nodes in the matrix
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Node'
 *     responses:
 *       201:
 *         description: Nodes created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Node'
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Matrix not found
 *       500:
 *         description: Internal server error
 */
router.post('/:matrixId/nodes', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const nodes = z.array(nodeSchema).parse(req.body);
    const createdNodes = await workflowService.createNodes(matrixId, nodes);
    res.status(201).json(createdNodes);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating nodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/nodes:
 *   patch:
 *     summary: Update existing nodes in the matrix
 */
router.patch('/:matrixId/nodes', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const nodes = z.array(nodeSchema.extend({ id: z.number() })).parse(req.body);
    const updatedNodes = await workflowService.updateNodes(matrixId, nodes);
    res.json(updatedNodes);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating nodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/nodes:
 *   delete:
 *     summary: Delete nodes from the matrix
 */
router.delete('/:matrixId/nodes', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const { nodeIds } = z.object({ nodeIds: z.array(z.number()) }).parse(req.body);
    await workflowService.deleteNodes(matrixId, nodeIds);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error deleting nodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Similar routes for connections
/**
 * @swagger
 * /api/matrix/{matrixId}/connections:
 *   post:
 *     summary: Create new connections in the matrix
 */
router.post('/:matrixId/connections', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const connections = z.array(connectionSchema).parse(req.body);
    const createdConnections = await workflowService.createConnections(matrixId, connections);
    res.status(201).json(createdConnections);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/connections:
 *   patch:
 *     summary: Update existing connections in the matrix
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               allOf:
 *                 - $ref: '#/components/schemas/Connection'
 *                 - required:
 *                   - id
 */
router.patch('/:matrixId/connections', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const connections = z.array(connectionSchema.extend({ id: z.number() })).parse(req.body);
    const updatedConnections = await workflowService.updateConnections(matrixId, connections);
    res.json(updatedConnections);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/connections:
 *   delete:
 *     summary: Delete connections from the matrix
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connectionIds
 *             properties:
 *               connectionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 */
router.delete('/:matrixId/connections', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const { connectionIds } = z.object({ connectionIds: z.array(z.number()) }).parse(req.body);
    await workflowService.deleteConnections(matrixId, connectionIds);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error deleting connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/triggers:
 *   post:
 *     summary: Create trigger node
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - triggerType
 *             properties:
 *               name:
 *                 type: string
 *               triggerType:
 *                 type: string
 *                 enum: [manual, cron, webhook]
 *               config:
 *                 type: object
 *     responses:
 *       201:
 *         description: Trigger created successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.post('/:matrixId/triggers', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    const data = z
      .object({
        name: z.string(),
        triggerType: z.enum(['manual', 'cron', 'webhook']),
        config: z.record(z.any()).optional(),
      })
      .parse(req.body);

    const trigger = await triggerService.createTriggerNode(matrixId, data);
    res.status(201).json(trigger);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/triggers/{nodeId}/activate:
 *   post:
 *     summary: Activate trigger
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID
 *     responses:
 *       200:
 *         description: Trigger activated successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.post('/:matrixId/triggers/:nodeId/activate', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (isNaN(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    const trigger = await triggerService.activateTrigger(nodeId);
    res.json(trigger);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/triggers/{nodeId}/deactivate:
 *   post:
 *     summary: Deactivate trigger
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID
 *     responses:
 *       200:
 *         description: Trigger deactivated successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.post('/:matrixId/triggers/:nodeId/deactivate', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (isNaN(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    const trigger = await triggerService.deactivateTrigger(nodeId);
    res.json(trigger);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matrix/{matrixId}/triggers/{nodeId}/execute:
 *   post:
 *     summary: Execute trigger
 *     tags: [Matrix]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID
 *     responses:
 *       204:
 *         description: Trigger executed successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.post('/:matrixId/triggers/:nodeId/execute', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (isNaN(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    await triggerService.executeTrigger(nodeId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
