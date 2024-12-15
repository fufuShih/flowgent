import { Router } from 'express';
import { db } from '../db';
import { triggers } from '../db/schema';
import { triggerManager } from '../services/trigger.service';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const router = Router();

const createTriggerSchema = z.object({
  matrixId: z.number(),
  nodeId: z.string(),
  type: z.enum(['click', 'cron', 'webhook']),
  config: z
    .object({
      schedule: z.string().optional(), // For cron triggers
      endpoint: z.string().optional(), // For webhook triggers
      method: z.enum(['GET', 'POST']).optional(), // For webhook triggers
    })
    .optional(),
});

// Create new trigger
router.post('/', async (req, res) => {
  try {
    const data = createTriggerSchema.parse(req.body);

    const result = await db
      .insert(triggers)
      .values({
        matrixId: data.matrixId,
        nodeId: data.nodeId,
        type: data.type,
        config: JSON.stringify(data.config || {}),
        status: 'inactive',
      })
      .returning();

    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Activate trigger
router.post('/:triggerId/activate', async (req, res) => {
  try {
    const { triggerId } = req.params;

    const trigger = await db
      .update(triggers)
      .set({ status: 'active' })
      .where(eq(triggers.id, parseInt(triggerId)))
      .returning();

    if (trigger.length > 0) {
      await triggerManager.setupTrigger(trigger[0]);
    }

    res.json({ success: true, data: trigger[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Deactivate trigger
router.post('/:triggerId/deactivate', async (req, res) => {
  try {
    const { triggerId } = req.params;

    const result = await db
      .update(triggers)
      .set({ status: 'inactive' })
      .where(eq(triggers.id, parseInt(triggerId)))
      .returning();

    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export const triggerRoutes = router;
