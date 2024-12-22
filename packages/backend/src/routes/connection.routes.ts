import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { matrix, connections, connectionConditions, nodes } from '../db/schema';
import { z } from 'zod';
import type { InferModel } from 'drizzle-orm';

const router = Router();

// Types
type ConnectionWithConditions = InferModel<typeof connections, 'select'> & {
  conditions?: InferModel<typeof connectionConditions, 'select'>[];
};

// Validation schemas
const createConnectionSchema = z.object({
  sourceId: z.number(),
  targetId: z.number(),
  type: z.enum(['default', 'success', 'error', 'condition']).default('default'),
  config: z.record(z.any()).default({}),
  conditions: z
    .array(
      z.object({
        condition: z.record(z.any()).default({}),
      })
    )
    .optional(),
});

const updateConnectionSchema = z.object({
  type: z.enum(['default', 'success', 'error', 'condition']).optional(),
  config: z.record(z.any()).optional(),
  conditions: z
    .array(
      z.object({
        condition: z.record(z.any()).default({}),
      })
    )
    .optional(),
});

const queryParamsSchema = z.object({
  includeConditions: z.coerce.boolean().default(false),
});

/**
 * @swagger
 * components:
 *   schemas:
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
 *         - id
 *         - matrixId
 *         - sourceId
 *         - targetId
 *         - type
 *         - created
 *         - updated
 */

// GET /matrix/:matrixId/connections
/**
 * @swagger
 * /api/matrix/{matrixId}/connections:
 *   get:
 *     summary: Get all connections for a matrix
 *     tags: [Connections]
 *     parameters:
 *       - in: path
 *         name: matrixId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Matrix ID
 *       - in: query
 *         name: includeConditions
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include conditions in response
 *     responses:
 *       200:
 *         description: List of connections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Connection'
 *                   - type: object
 *                     properties:
 *                       conditions:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/ConnectionCondition'
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

    const { includeConditions } = queryParamsSchema.parse(req.query);

    // Get connections
    const connectionsData: ConnectionWithConditions[] = await db
      .select()
      .from(connections)
      .where(eq(connections.matrixId, matrixId));

    if (includeConditions) {
      for (const connection of connectionsData) {
        const conditions = await db
          .select()
          .from(connectionConditions)
          .where(eq(connectionConditions.connectionId, connection.id));
        connection.conditions = conditions;
      }
    }

    res.json(connectionsData);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /connections/:connectionId
/**
 * @swagger
 * /api/connections/{connectionId}:
 *   get:
 *     summary: Get a connection by ID
 *     tags: [Connections]
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Connection ID
 *     responses:
 *       200:
 *         description: Connection found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Connection'
 *       400:
 *         description: Invalid connection ID
 *       404:
 *         description: Connection not found
 *       500:
 *         description: Internal server error
 */
router.get('/:connectionId', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: 'Invalid connection ID' });
    }

    const connection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (!connection.length) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const result: ConnectionWithConditions = connection[0];

    // Include conditions
    const conditions = await db
      .select()
      .from(connectionConditions)
      .where(eq(connectionConditions.connectionId, connectionId));
    result.conditions = conditions;

    res.json(result);
  } catch (error) {
    console.error('Error fetching connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /matrix/:matrixId/connections
/**
 * @swagger
 * /api/matrix/{matrixId}/connections:
 *   post:
 *     summary: Create a new connection
 *     tags: [Connections]
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
 *               - sourceId
 *               - targetId
 *             properties:
 *               sourceId:
 *                 type: integer
 *               targetId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [default, success, error, condition]
 *                 default: default
 *               config:
 *                 type: object
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     condition:
 *                       type: object
 *     responses:
 *       201:
 *         description: Connection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Connection'
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

    const validatedData = createConnectionSchema.parse(req.body);

    // Verify matrix exists
    const matrixExists = await db.select().from(matrix).where(eq(matrix.id, matrixId)).limit(1);

    if (!matrixExists.length) {
      return res.status(404).json({ error: 'Matrix not found' });
    }

    // Verify source and target nodes exist and belong to the matrix
    const selectedNodes = await db
      .select()
      .from(nodes)
      .where(
        and(
          eq(nodes.matrixId, matrixId),
          eq(nodes.id, validatedData.sourceId),
          eq(nodes.id, validatedData.targetId)
        )
      );

    if (selectedNodes.length !== 2) {
      return res.status(400).json({ error: 'Invalid source or target node' });
    }

    // Start transaction for connection creation
    const result = await db.transaction(async (tx) => {
      // Create connection
      const [newConnection] = await tx
        .insert(connections)
        .values({
          matrixId,
          sourceId: validatedData.sourceId,
          targetId: validatedData.targetId,
          type: validatedData.type,
          config: validatedData.config,
        })
        .returning();

      // Create conditions if provided and connection type is 'condition'
      if (validatedData.type === 'condition' && validatedData.conditions) {
        const conditions = await tx
          .insert(connectionConditions)
          .values(
            validatedData.conditions.map((condition) => ({
              connectionId: newConnection.id,
              condition: condition.condition,
            }))
          )
          .returning();
        return { ...newConnection, conditions };
      }

      return newConnection;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /connections/:connectionId
/**
 * @swagger
 * /api/connections/{connectionId}:
 *   patch:
 *     summary: Update a connection
 *     tags: [Connections]
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Connection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [default, success, error, condition]
 *               config:
 *                 type: object
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     condition:
 *                       type: object
 *     responses:
 *       200:
 *         description: Connection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Connection'
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Connection not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:connectionId', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: 'Invalid connection ID' });
    }

    const validatedData = updateConnectionSchema.parse(req.body);

    // Check if connection exists
    const existingConnection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (!existingConnection.length) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Start transaction for update
    const result = await db.transaction(async (tx) => {
      // Update connection
      const [updatedConnection] = await tx
        .update(connections)
        .set({
          ...validatedData,
          updated: new Date(),
        })
        .where(eq(connections.id, connectionId))
        .returning();

      // Handle conditions update if type is 'condition'
      if (validatedData.type === 'condition' && validatedData.conditions) {
        // Delete existing conditions
        await tx
          .delete(connectionConditions)
          .where(eq(connectionConditions.connectionId, connectionId));

        // Create new conditions
        const conditions = await tx
          .insert(connectionConditions)
          .values(
            validatedData.conditions.map((condition) => ({
              connectionId,
              condition: condition.condition,
            }))
          )
          .returning();

        return { ...updatedConnection, conditions };
      }

      return updatedConnection;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /connections/:connectionId
/**
 * @swagger
 * /api/connections/{connectionId}:
 *   delete:
 *     summary: Delete a connection
 *     tags: [Connections]
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Connection ID
 *     responses:
 *       204:
 *         description: Connection deleted successfully
 *       400:
 *         description: Invalid connection ID
 *       404:
 *         description: Connection not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:connectionId', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: 'Invalid connection ID' });
    }

    // Check if connection exists
    const existingConnection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (!existingConnection.length) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Delete connection (cascade deletion will handle conditions)
    await db.delete(connections).where(eq(connections.id, connectionId));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
