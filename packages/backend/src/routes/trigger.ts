import express from 'express';
import { db } from '../db';
import { triggers, matrix, nodes } from '../db/schema';
import { eq } from 'drizzle-orm';
import cron from 'node-cron';

const router = express.Router();
const scheduledTasks = new Map();

// Schedule management
const scheduleTask = (trigger: any) => {
  if (trigger.type !== 'schedule' || !trigger.config.cronExpression) {
    return;
  }

  const task = cron.schedule(trigger.config.cronExpression, async () => {
    await executeTriggerFlow(trigger.id, {});
  });

  scheduledTasks.set(trigger.id, task);
};

const unscheduleTask = (triggerId: number) => {
  const task = scheduledTasks.get(triggerId);
  if (task) {
    task.stop();
    scheduledTasks.delete(triggerId);
  }
};

// Execute flow for a trigger
const executeTriggerFlow = async (triggerId: number, payload: any) => {
  try {
    const [trigger] = await db.select().from(triggers).where(eq(triggers.id, triggerId));

    if (!trigger) {
      throw new Error('Trigger not found');
    }

    const [node] = await db.select().from(nodes).where(eq(nodes.id, trigger.nodeId));

    if (!node) {
      throw new Error('Node not found');
    }

    // Update last triggered timestamp
    await db.update(triggers).set({ lastTriggered: new Date() }).where(eq(triggers.id, triggerId));

    // TODO: Implement actual flow execution
    console.log(`Executing flow for trigger ${triggerId} with payload:`, payload);
  } catch (error) {
    console.error(`Error executing flow for trigger ${triggerId}:`, error);
  }
};

// CRUD Routes
router.get('/', async (req, res) => {
  try {
    const selectedTriggers = await db.select().from(triggers);
    res.json({ status: 'success', data: selectedTriggers });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const selectedTrigger = await db
      .select()
      .from(triggers)
      .where(eq(triggers.id, parseInt(id)));
    res.json({ status: 'success', data: selectedTrigger });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nodeId, type, name, config } = req.body;
    const newTrigger = await db
      .insert(triggers)
      .values({
        nodeId,
        type,
        name,
        config,
        status: 'inactive',
      })
      .returning();

    // If it's a schedule trigger and it's active, schedule it
    if (type === 'schedule' && config.cronExpression) {
      scheduleTask(newTrigger[0]);
    }

    res.json({ status: 'success', data: newTrigger });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, config, status } = req.body;

    // Unschedule if it exists
    unscheduleTask(parseInt(id));

    const updatedTrigger = await db
      .update(triggers)
      .set({ name, config, status })
      .where(eq(triggers.id, parseInt(id)))
      .returning();

    // Reschedule if it's an active schedule trigger
    if (updatedTrigger[0].type === 'schedule' && status === 'active') {
      scheduleTask(updatedTrigger[0]);
    }

    res.json({ status: 'success', data: updatedTrigger });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Unschedule if it exists
    unscheduleTask(parseInt(id));
    await db.delete(triggers).where(eq(triggers.id, parseInt(id)));
    res.json({ status: 'success', data: { id } });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Initialize triggers
export const initializeTriggers = async () => {
  try {
    // Get all active triggers
    const activeTriggers = await db.select().from(triggers).where(eq(triggers.status, 'active'));

    // Initialize each trigger based on type
    for (const trigger of activeTriggers) {
      if (trigger.type === 'schedule') {
        scheduleTask(trigger);
      }
    }

    console.log(`Initialized ${activeTriggers.length} triggers`);
  } catch (error) {
    console.error('Failed to initialize triggers:', error);
    throw error;
  }
};

export const triggerRoutes = router;
