import { CronJob } from 'cron';
import { db } from '../db';
import { triggers } from '../db/schema';
import { eq } from 'drizzle-orm';

interface TriggerRecord {
  id: number;
  matrixId: number;
  nodeId: string;
  type: string;
  config: string;
  status: string;
  lastTriggered: Date | null;
  created: Date;
  updated: Date;
}

interface TriggerState {
  cronJobs: Map<number, CronJob>;
}

// Create initial state
const createInitialState = (): TriggerState => ({
  cronJobs: new Map(),
});

// Main trigger service object
const createTriggerService = (initialState: TriggerState = createInitialState()) => {
  let state = initialState;

  const executeTriggerNode = async (matrixId: number, nodeId: string) => {
    try {
      const response = await fetch(
        `http://localhost:${process.env.PORT || 3004}/api/execute/node/${matrixId}/${nodeId}/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to execute trigger node: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing trigger node:', error);
      throw error;
    }
  };

  const setupCronTrigger = (
    triggerId: number,
    schedule: string,
    matrixId: number,
    nodeId: string
  ) => {
    const job = new CronJob(schedule, async () => {
      try {
        await executeTriggerNode(matrixId, nodeId);
        await db
          .update(triggers)
          .set({ lastTriggered: new Date(), updated: new Date() })
          .where(eq(triggers.id, triggerId))
          .execute();
      } catch (error) {
        console.error(`Error executing cron trigger ${triggerId}:`, error);
      }
    });

    state.cronJobs.set(triggerId, job);
    job.start();
  };

  const setupWebhookTrigger = (
    _triggerId: number,
    _config: any,
    _matrixId: number,
    _nodeId: string
  ) => {
    // Implementation for webhook triggers will be added in the routes
  };

  const setupTrigger = async (trigger: TriggerRecord) => {
    const config = JSON.parse(trigger.config);

    const triggerHandlers = {
      cron: () => setupCronTrigger(trigger.id, config.schedule, trigger.matrixId, trigger.nodeId),
      webhook: () => setupWebhookTrigger(trigger.id, config, trigger.matrixId, trigger.nodeId),
    };

    const handler = triggerHandlers[trigger.type as keyof typeof triggerHandlers];
    if (handler) {
      handler();
    }
  };

  const initializeTriggers = async () => {
    const activeTriggers = await db.select().from(triggers).where(eq(triggers.status, 'active'));
    return Promise.all(activeTriggers.map(setupTrigger));
  };

  const stopAllTriggers = () => {
    state.cronJobs.forEach((job, id) => {
      job.stop();
      state.cronJobs.delete(id);
    });
  };

  return {
    initializeTriggers,
    setupTrigger,
    stopAllTriggers,
  };
};

export const triggerManager = createTriggerService();
