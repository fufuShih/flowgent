import { Router } from 'express';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { connections, connectionConditions } from '../db/schema';
import { z } from 'zod';
import type { InferModel } from 'drizzle-orm';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ConnectionCondition:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The condition ID
 *         connectionId:
 *           type: integer
 *           description: The associated connection ID
 *         condition:
 *           type: object
 *           description: The condition configuration object
 *         created:
 *           type: string
 *           format: date-time
 *         updated:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - connectionId
 *         - condition
 *         - created
 *         - updated
 */

// Types
type ConditionWithConnection = InferModel<typeof connectionConditions, 'select'> & {
  connection?: InferModel<typeof connections, 'select'>;
};

// Validation schemas
const createConditionSchema = z.object({
  condition: z.record(z.any()).refine(
    (data) => {
      // Basic validation for condition structure
      return (
        data &&
        typeof data === 'object' &&
        Object.keys(data).length > 0 &&
        ('operator' in data || 'value' in data)
      );
    },
    {
      message: 'Condition must be a valid object with operator or value',
    }
  ),
});

const updateConditionSchema = z.object({
  condition: z
    .record(z.any())
    .refine((data) => data && typeof data === 'object' && Object.keys(data).length > 0, {
      message: 'Condition must be a valid object',
    })
    .optional(),
});

const queryParamsSchema = z.object({
  includeConnection: z.coerce.boolean().default(false),
});

/**
 * @swagger
 * /api/connections/{connectionId}/conditions:
 *   get:
 *     summary: Get all conditions for a connection
 *     tags: [Connection Conditions]
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Connection ID
 *     responses:
 *       200:
 *         description: List of conditions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConnectionCondition'
 *       400:
 *         description: Invalid connection ID
 *       404:
 *         description: Connection not found
 *       500:
 *         description: Internal server error
 */
router.get('/connections/:connectionId/conditions', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: 'Invalid connection ID' });
    }

    // Verify connection exists and is of type 'condition'
    const connection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (!connection.length) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection[0].type !== 'condition') {
      return res.status(400).json({ error: 'Connection is not of type condition' });
    }

    // Get conditions
    const conditions = await db
      .select()
      .from(connectionConditions)
      .where(eq(connectionConditions.connectionId, connectionId));

    res.json(conditions);
  } catch (error) {
    console.error('Error fetching conditions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/connection-conditions/{id}:
 *   get:
 *     summary: Get a condition by ID
 *     tags: [Connection Conditions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Condition ID
 *       - in: query
 *         name: includeConnection
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include connection details in response
 *     responses:
 *       200:
 *         description: Condition found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ConnectionCondition'
 *                 - type: object
 *                   properties:
 *                     connection:
 *                       $ref: '#/components/schemas/Connection'
 *       400:
 *         description: Invalid condition ID
 *       404:
 *         description: Condition not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  try {
    const conditionId = parseInt(req.params.id);
    if (isNaN(conditionId)) {
      return res.status(400).json({ error: 'Invalid condition ID' });
    }

    const { includeConnection } = queryParamsSchema.parse(req.query);

    const condition = await db
      .select()
      .from(connectionConditions)
      .where(eq(connectionConditions.id, conditionId))
      .limit(1);

    if (!condition.length) {
      return res.status(404).json({ error: 'Condition not found' });
    }

    const result: ConditionWithConnection = condition[0];

    if (includeConnection) {
      const connectionData = await db
        .select()
        .from(connections)
        .where(eq(connections.id, condition[0].connectionId))
        .limit(1);
      if (connectionData.length) {
        result.connection = connectionData[0];
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching condition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/connections/{connectionId}/conditions:
 *   post:
 *     summary: Create a new condition
 *     tags: [Connection Conditions]
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
 *             required:
 *               - condition
 *             properties:
 *               condition:
 *                 type: object
 *                 description: Condition configuration object
 *     responses:
 *       201:
 *         description: Condition created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConnectionCondition'
 *       400:
 *         description: Invalid request body or connection ID
 *       404:
 *         description: Connection not found
 *       500:
 *         description: Internal server error
 */
router.post('/connections/:connectionId/conditions', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: 'Invalid connection ID' });
    }

    const validatedData = createConditionSchema.parse(req.body);

    // Verify connection exists and is of type 'condition'
    const connection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (!connection.length) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection[0].type !== 'condition') {
      return res.status(400).json({ error: 'Connection is not of type condition' });
    }

    // Create condition
    const [newCondition] = await db
      .insert(connectionConditions)
      .values({
        connectionId,
        condition: validatedData.condition,
      })
      .returning();

    res.status(201).json(newCondition);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating condition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/connection-conditions/{id}:
 *   patch:
 *     summary: Update a condition
 *     tags: [Connection Conditions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Condition ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition:
 *                 type: object
 *                 description: Updated condition configuration
 *     responses:
 *       200:
 *         description: Condition updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConnectionCondition'
 *       400:
 *         description: Invalid request body or condition ID
 *       404:
 *         description: Condition not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', async (req, res) => {
  try {
    const conditionId = parseInt(req.params.id);
    if (isNaN(conditionId)) {
      return res.status(400).json({ error: 'Invalid condition ID' });
    }

    const validatedData = updateConditionSchema.parse(req.body);

    // Check if condition exists
    const existingCondition = await db
      .select()
      .from(connectionConditions)
      .where(eq(connectionConditions.id, conditionId))
      .limit(1);

    if (!existingCondition.length) {
      return res.status(404).json({ error: 'Condition not found' });
    }

    // Update condition
    const [updatedCondition] = await db
      .update(connectionConditions)
      .set({
        ...validatedData,
        updated: new Date(),
      })
      .where(eq(connectionConditions.id, conditionId))
      .returning();

    res.json(updatedCondition);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating condition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/connection-conditions/{id}:
 *   delete:
 *     summary: Delete a condition
 *     tags: [Connection Conditions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Condition ID
 *     responses:
 *       204:
 *         description: Condition deleted successfully
 *       400:
 *         description: Invalid condition ID
 *       404:
 *         description: Condition not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const conditionId = parseInt(req.params.id);
    if (isNaN(conditionId)) {
      return res.status(400).json({ error: 'Invalid condition ID' });
    }

    // Get condition and connection info
    const condition = await db
      .select({
        id: connectionConditions.id,
        connectionId: connectionConditions.connectionId,
      })
      .from(connectionConditions)
      .where(eq(connectionConditions.id, conditionId))
      .limit(1);

    if (!condition.length) {
      return res.status(404).json({ error: 'Condition not found' });
    }

    // Check if this is the last condition
    const conditionCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(connectionConditions)
      .where(eq(connectionConditions.connectionId, condition[0].connectionId));

    // Start transaction for deletion and potential connection update
    await db.transaction(async (tx) => {
      // Delete condition
      await tx.delete(connectionConditions).where(eq(connectionConditions.id, conditionId));

      // If this was the last condition, update connection type to 'default'
      if (Number(conditionCount[0].count) === 1) {
        await tx
          .update(connections)
          .set({
            type: 'default',
            updated: new Date(),
          })
          .where(eq(connections.id, condition[0].connectionId));
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting condition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
