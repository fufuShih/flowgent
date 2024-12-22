import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { nodes, triggers } from '../db/schema';
import { z } from 'zod';
import type { InferModel } from 'drizzle-orm';

const router = Router();

// Types
type TriggerWithNode = InferModel<typeof triggers, 'select'> & {
  node?: InferModel<typeof nodes, 'select'>;
};

// Validation schemas
const createTriggerSchema = z.object({
  type: z.enum(['webhook', 'schedule', 'event', 'manual', 'email', 'database']),
  name: z.string().min(1).max(255),
  config: z.record(z.any()).default({}),
  status: z.enum(['active', 'inactive', 'error']).default('inactive'),
});

const updateTriggerSchema = z.object({
  type: z.enum(['webhook', 'schedule', 'event', 'manual', 'email', 'database']).optional(),
  name: z.string().min(1).max(255).optional(),
  config: z.record(z.any()).optional(),
  status: z.enum(['active', 'inactive', 'error']).optional(),
  lastTriggered: z.date().optional(),
  nextTrigger: z.date().optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Trigger:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The trigger ID
 *         nodeId:
 *           type: integer
 *           description: The associated node ID
 *         type:
 *           type: string
 *           enum: [webhook, schedule, event, manual, email, database]
 *           description: Trigger type
 *         name:
 *           type: string
 *           description: Trigger name
 *         config:
 *           type: object
 *           description: Trigger configuration
 *         status:
 *           type: string
 *           enum: [active, inactive, error]
 *           description: Trigger status
 *         lastTriggered:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         nextTrigger:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created:
 *           type: string
 *           format: date-time
 *         updated:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - nodeId
 *         - type
 *         - name
 *         - status
 *         - created
 *         - updated
 */

// GET /nodes/:nodeId/trigger

/**
 * @swagger
 * /api/nodes/{nodeId}/trigger:
 *   get:
 *     summary: Get trigger for a node
 *     tags: [Triggers]
 *     parameters:
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID
 *     responses:
 *       200:
 *         description: Trigger found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trigger'
 *       400:
 *         description: Invalid node ID or node is not a trigger
 *       404:
 *         description: Node or trigger not found
 *       500:
 *         description: Internal server error
 */
router.get('/nodes/:nodeId/trigger', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (isNaN(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    // Verify node exists and is of type 'trigger'
    const node = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

    if (!node.length) {
      return res.status(404).json({ error: 'Node not found' });
    }

    if (node[0].type !== 'trigger') {
      return res.status(400).json({ error: 'Node is not of type trigger' });
    }

    // Get trigger
    const trigger = await db.select().from(triggers).where(eq(triggers.nodeId, nodeId)).limit(1);

    if (!trigger.length) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    res.json(trigger[0]);
  } catch (error) {
    console.error('Error fetching trigger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /triggers/:triggerId
/**
 * @swagger
 * /api/triggers/{triggerId}:
 *   get:
 *     summary: Get a trigger by ID
 *     tags: [Triggers]
 *     parameters:
 *       - in: path
 *         name: triggerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Trigger ID
 *     responses:
 *       200:
 *         description: Trigger found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Trigger'
 *                 - type: object
 *                   properties:
 *                     node:
 *                       $ref: '#/components/schemas/Node'
 *       400:
 *         description: Invalid trigger ID
 *       404:
 *         description: Trigger not found
 *       500:
 *         description: Internal server error
 */
router.get('/:triggerId', async (req, res) => {
  try {
    const triggerId = parseInt(req.params.triggerId);
    if (isNaN(triggerId)) {
      return res.status(400).json({ error: 'Invalid trigger ID' });
    }

    const trigger = await db.select().from(triggers).where(eq(triggers.id, triggerId)).limit(1);

    if (!trigger.length) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    const result: TriggerWithNode = trigger[0];

    // Include node information
    const node = await db.select().from(nodes).where(eq(nodes.id, trigger[0].nodeId)).limit(1);
    if (node.length) {
      result.node = node[0];
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching trigger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /nodes/:nodeId/trigger
/**
 * @swagger
 * /api/nodes/{nodeId}/trigger:
 *   post:
 *     summary: Create a new trigger
 *     tags: [Triggers]
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
 *             required:
 *               - type
 *               - name
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [webhook, schedule, event, manual, email, database]
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               config:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive, error]
 *                 default: inactive
 *     responses:
 *       201:
 *         description: Trigger created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trigger'
 *       400:
 *         description: Invalid request body or node is not a trigger
 *       404:
 *         description: Node not found
 *       409:
 *         description: Trigger already exists for this node
 *       500:
 *         description: Internal server error
 */
router.post('/nodes/:nodeId/trigger', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (isNaN(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    const validatedData = createTriggerSchema.parse(req.body);

    // Verify node exists and is of type 'trigger'
    const node = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

    if (!node.length) {
      return res.status(404).json({ error: 'Node not found' });
    }

    if (node[0].type !== 'trigger') {
      return res.status(400).json({ error: 'Node is not of type trigger' });
    }

    // Check if trigger already exists for this node
    const existingTrigger = await db
      .select()
      .from(triggers)
      .where(eq(triggers.nodeId, nodeId))
      .limit(1);

    if (existingTrigger.length) {
      return res.status(409).json({ error: 'Trigger already exists for this node' });
    }

    // Create trigger
    const [newTrigger] = await db
      .insert(triggers)
      .values({
        nodeId,
        type: validatedData.type,
        name: validatedData.name,
        config: validatedData.config,
        status: validatedData.status,
      })
      .returning();

    // TODO: Set up external triggers based on type
    // This would involve setting up webhooks, scheduling jobs, etc.
    // Implementation depends on external services and requirements

    res.status(201).json(newTrigger);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating trigger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /triggers/:triggerId
/**
 * @swagger
 * /api/triggers/{triggerId}:
 *   patch:
 *     summary: Update a trigger
 *     tags: [Triggers]
 *     parameters:
 *       - in: path
 *         name: triggerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Trigger ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [webhook, schedule, event, manual, email, database]
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               config:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive, error]
 *               lastTriggered:
 *                 type: string
 *                 format: date-time
 *               nextTrigger:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Trigger updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trigger'
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Trigger not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:triggerId', async (req, res) => {
  try {
    const triggerId = parseInt(req.params.triggerId);
    if (isNaN(triggerId)) {
      return res.status(400).json({ error: 'Invalid trigger ID' });
    }

    const validatedData = updateTriggerSchema.parse(req.body);

    // Check if trigger exists
    const existingTrigger = await db
      .select()
      .from(triggers)
      .where(eq(triggers.id, triggerId))
      .limit(1);

    if (!existingTrigger.length) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    // Update trigger
    const [updatedTrigger] = await db
      .update(triggers)
      .set({
        ...validatedData,
        updated: new Date(),
      })
      .where(eq(triggers.id, triggerId))
      .returning();

    // TODO: Update external triggers based on type and status changes
    // This would involve updating webhooks, rescheduling jobs, etc.
    // Implementation depends on external services and requirements

    res.json(updatedTrigger);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating trigger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /triggers/:triggerId
/**
 * @swagger
 * /api/triggers/{triggerId}:
 *   delete:
 *     summary: Delete a trigger
 *     tags: [Triggers]
 *     parameters:
 *       - in: path
 *         name: triggerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Trigger ID
 *     responses:
 *       204:
 *         description: Trigger deleted successfully
 *       400:
 *         description: Invalid trigger ID
 *       404:
 *         description: Trigger not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:triggerId', async (req, res) => {
  try {
    const triggerId = parseInt(req.params.triggerId);
    if (isNaN(triggerId)) {
      return res.status(400).json({ error: 'Invalid trigger ID' });
    }

    // Check if trigger exists
    const existingTrigger = await db
      .select()
      .from(triggers)
      .where(eq(triggers.id, triggerId))
      .limit(1);

    if (!existingTrigger.length) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    // TODO: Clean up external resources based on trigger type
    // This would involve removing webhooks, canceling scheduled jobs, etc.
    // Implementation depends on external services and requirements

    // Delete trigger
    await db.delete(triggers).where(eq(triggers.id, triggerId));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting trigger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
