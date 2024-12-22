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

// GET /nodes/:nodeId/trigger
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
