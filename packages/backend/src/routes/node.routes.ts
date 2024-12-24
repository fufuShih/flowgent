import { Router } from 'express';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { matrix, nodes, nodeTypeEnum, triggers } from '../db/schema';
import { z } from 'zod';
import type { InferModel } from 'drizzle-orm';

const router = Router();

// Validation schemas
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const createNodeSchema = z.object({
  type: z.enum(['trigger', 'action', 'condition', 'subMatrix', 'transformer', 'loop']),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  config: z.record(z.any()).default({}),
  position: positionSchema,
  subMatrixId: z.number().optional(),
  // Trigger specific fields
  trigger: z
    .object({
      type: z.enum(['webhook', 'schedule', 'event', 'manual', 'email', 'database']),
      name: z.string().min(1).max(255),
      config: z.record(z.any()).default({}),
    })
    .optional(),
});

const updateNodeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  position: positionSchema.optional(),
  // Trigger specific fields
  trigger: z
    .object({
      type: z.enum(['webhook', 'schedule', 'event', 'manual', 'email', 'database']).optional(),
      name: z.string().min(1).max(255).optional(),
      config: z.record(z.any()).optional(),
      status: z.enum(['active', 'inactive', 'error']).optional(),
    })
    .optional(),
});

const queryParamsSchema = z.object({
  type: z.enum(['trigger', 'action', 'condition', 'subMatrix', 'transformer', 'loop']).optional(),
  includeTrigger: z.coerce.boolean().default(false),
});

// Add at the top with other imports
type NodeWithTrigger = InferModel<typeof nodes, 'select'> & {
  trigger?: InferModel<typeof triggers, 'select'>;
};

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
 *           enum: [trigger, action, condition, subMatrix, transformer, loop]
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
 *           description: Node configuration
 *         position:
 *           type: object
 *           properties:
 *             x:
 *               type: number
 *             y:
 *               type: number
 *         subMatrixId:
 *           type: integer
 *           nullable: true
 *           description: ID of the sub-matrix (if type is subMatrix)
 *         created:
 *           type: string
 *           format: date-time
 *         updated:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - matrixId
 *         - type
 *         - name
 *         - position
 *         - created
 *         - updated
 */

/**
 * @swagger
 * /api/nodes/matrix/{matrixId}:
 *   get:
 *     summary: Get all nodes for a matrix
 *     tags: [Nodes]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [trigger, action, condition, subMatrix, transformer, loop]
 *         description: Filter nodes by type
 *       - in: query
 *         name: includeTrigger
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include trigger details for trigger nodes
 *     responses:
 *       200:
 *         description: List of nodes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Node'
 *                   - type: object
 *                     properties:
 *                       trigger:
 *                         $ref: '#/components/schemas/Trigger'
 *       400:
 *         description: Invalid matrix ID
 *       404:
 *         description: Matrix not found
 *       500:
 *         description: Internal server error
 */
router.get('/matrix/:matrixId', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    // Verify matrix exists
    const matrixExists = await db.select().from(matrix).where(eq(matrix.id, matrixId)).limit(1);

    if (!matrixExists.length) {
      return res.status(404).json({ error: 'Matrix not found' });
    }

    const { type, includeTrigger } = queryParamsSchema.parse(req.query);

    // Build query conditions
    const conditions = [eq(nodes.matrixId, matrixId)];
    if (type) {
      conditions.push(eq(nodes.type, type));
    }

    // Get nodes
    const nodesData: NodeWithTrigger[] = await db
      .select()
      .from(nodes)
      .where(and(...conditions));

    if (includeTrigger) {
      const triggerNodes = nodesData.filter((node) => node.type === 'trigger');
      if (triggerNodes.length > 0) {
        const triggerData = await db
          .select()
          .from(triggers)
          .where(
            inArray(
              triggers.nodeId,
              triggerNodes.map((n) => n.id)
            )
          );

        // Merge trigger data with nodes
        nodesData.forEach((node) => {
          if (node.type === 'trigger') {
            node.trigger = triggerData.find((t) => t.nodeId === node.id);
          }
        });
      }
    }

    res.json(nodesData);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO: get all nodes
router.get('/', async (req, res) => {
  try {
    const selectedNodes = await db.select().from(nodes);
    res.json(selectedNodes);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/nodes/{nodeId}:
 *   get:
 *     summary: Get a node by ID
 *     tags: [Nodes]
 *     parameters:
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID
 *     responses:
 *       200:
 *         description: Node found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Node'
 *                 - type: object
 *                   properties:
 *                     trigger:
 *                       $ref: '#/components/schemas/Trigger'
 *       400:
 *         description: Invalid node ID
 *       404:
 *         description: Node not found
 *       500:
 *         description: Internal server error
 */
router.get('/:nodeId', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (isNaN(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    const node = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

    if (!node.length) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const result: NodeWithTrigger = node[0];

    // Include trigger data if node is trigger type
    if (result.type === 'trigger') {
      const triggerData = await db
        .select()
        .from(triggers)
        .where(eq(triggers.nodeId, nodeId))
        .limit(1);
      if (triggerData.length) {
        result.trigger = triggerData[0];
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/nodes/matrix/{matrixId}/nodes:
 *   post:
 *     summary: Create a new node
 *     tags: [Nodes]
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
 *               - type
 *               - name
 *               - position
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [trigger, action, condition, subMatrix, transformer, loop]
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               config:
 *                 type: object
 *               position:
 *                 type: object
 *                 required:
 *                   - x
 *                   - y
 *                 properties:
 *                   x:
 *                     type: number
 *                   y:
 *                     type: number
 *               subMatrixId:
 *                 type: integer
 *               trigger:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [webhook, schedule, event, manual, email, database]
 *                   name:
 *                     type: string
 *                   config:
 *                     type: object
 *     responses:
 *       201:
 *         description: Node created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Node'
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Matrix not found
 *       500:
 *         description: Internal server error
 */
router.post('/matrix/:matrixId', async (req, res) => {
  try {
    const matrixId = parseInt(req.params.matrixId);
    if (isNaN(matrixId)) {
      return res.status(400).json({ error: 'Invalid matrix ID' });
    }

    // Verify matrix exists
    const matrixExists = await db.select().from(matrix).where(eq(matrix.id, matrixId)).limit(1);

    if (!matrixExists.length) {
      return res.status(404).json({ error: 'Matrix not found' });
    }

    const validatedData = createNodeSchema.parse(req.body);

    // Verify subMatrixId if type is subMatrix
    if (validatedData.type === 'subMatrix' && validatedData.subMatrixId) {
      const subMatrixExists = await db
        .select()
        .from(matrix)
        .where(eq(matrix.id, validatedData.subMatrixId))
        .limit(1);

      if (!subMatrixExists.length) {
        return res.status(404).json({ error: 'Sub-matrix not found' });
      }
    }

    // Start transaction for node creation
    const result = await db.transaction(async (tx) => {
      // Create node
      const [newNode] = await tx
        .insert(nodes)
        .values({
          matrixId,
          type: validatedData.type,
          name: validatedData.name,
          description: validatedData.description,
          config: validatedData.config,
          position: validatedData.position,
          subMatrixId: validatedData.subMatrixId,
        })
        .returning();

      // Create associated trigger if node type is trigger
      if (validatedData.type === 'trigger' && validatedData.trigger) {
        const [newTrigger] = await tx
          .insert(triggers)
          .values({
            nodeId: newNode.id,
            type: validatedData.trigger.type,
            name: validatedData.trigger.name,
            config: validatedData.trigger.config,
          })
          .returning();

        return { ...newNode, trigger: newTrigger };
      }

      return newNode;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/nodes/{nodeId}:
 *   patch:
 *     summary: Update a node
 *     tags: [Nodes]
 *     parameters:
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID
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
 *               config:
 *                 type: object
 *               position:
 *                 type: object
 *                 properties:
 *                   x:
 *                     type: number
 *                   y:
 *                     type: number
 *               trigger:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [webhook, schedule, event, manual, email, database]
 *                   name:
 *                     type: string
 *                   config:
 *                     type: object
 *                   status:
 *                     type: string
 *                     enum: [active, inactive, error]
 *     responses:
 *       200:
 *         description: Node updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Node'
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Node not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:nodeId', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (isNaN(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    const validatedData = updateNodeSchema.parse(req.body);

    // Check if node exists and get its type
    const existingNode = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

    if (!existingNode.length) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Start transaction for update
    const result = await db.transaction(async (tx) => {
      // Update node
      const [updatedNode] = await tx
        .update(nodes)
        .set({
          ...validatedData,
          updated: new Date(),
        })
        .where(eq(nodes.id, nodeId))
        .returning();

      // Update associated trigger if exists
      if (existingNode[0].type === 'trigger' && validatedData.trigger) {
        const [updatedTrigger] = await tx
          .update(triggers)
          .set({
            ...validatedData.trigger,
            updated: new Date(),
          })
          .where(eq(triggers.nodeId, nodeId))
          .returning();

        return { ...updatedNode, trigger: updatedTrigger };
      }

      return updatedNode;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/nodes/{nodeId}:
 *   delete:
 *     summary: Delete a node
 *     tags: [Nodes]
 *     parameters:
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID
 *     responses:
 *       204:
 *         description: Node deleted successfully
 *       400:
 *         description: Invalid node ID
 *       404:
 *         description: Node not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:nodeId', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (isNaN(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    // Check if node exists
    const existingNode = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

    if (!existingNode.length) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Delete node (cascade deletion will handle associated trigger and connections)
    await db.delete(nodes).where(eq(nodes.id, nodeId));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
