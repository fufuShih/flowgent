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

class TriggerManager {
  private cronJobs: Map<number, CronJob> = new Map();

  async initializeTriggers() {
    // Load all active triggers from database
    const activeTriggers = await db.select().from(triggers).where(eq(triggers.status, 'active'));

    // Initialize each trigger
    for (const trigger of activeTriggers) {
      await this.setupTrigger(trigger);
    }
  }

  async setupTrigger(trigger: TriggerRecord) {
    const config = JSON.parse(trigger.config);

    switch (trigger.type) {
      case 'cron':
        this.setupCronTrigger(trigger.id, config.schedule, trigger.matrixId, trigger.nodeId);
        break;
      case 'webhook':
        // Setup webhook endpoint
        this.setupWebhookTrigger(trigger.id, config, trigger.matrixId, trigger.nodeId);
        break;
      // Other trigger types can be added here
    }
  }

  private setupCronTrigger(triggerId: number, schedule: string, matrixId: number, nodeId: string) {
    const job = new CronJob(schedule, async () => {
      try {
        // Execute the matrix starting from this node
        await this.executeTriggerNode(matrixId, nodeId);

        // Update last triggered time
        await db
          .update(triggers)
          .set({ lastTriggered: new Date(), updated: new Date() })
          .where(eq(triggers.id, triggerId))
          .execute();
      } catch (error) {
        console.error(`Error executing cron trigger ${triggerId}:`, error);
      }
    });

    this.cronJobs.set(triggerId, job);
    job.start();
  }

  private setupWebhookTrigger(triggerId: number, config: any, matrixId: number, nodeId: string) {
    // Implementation for webhook triggers will be added in the routes
  }

  private async executeTriggerNode(matrixId: number, nodeId: string) {
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

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error executing trigger node:', error);
      throw error;
    }
  }

  // Clean up method
  async stopAllTriggers() {
    for (const [id, job] of this.cronJobs) {
      job.stop();
      this.cronJobs.delete(id);
    }
  }
}

export const triggerManager = new TriggerManager();
