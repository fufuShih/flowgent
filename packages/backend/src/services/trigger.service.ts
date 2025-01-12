import { db } from '../db';
import { eq } from 'drizzle-orm';
import { nodes } from '../db/schema';
import * as cron from 'node-cron';
import crypto from 'crypto';
import type { Node } from './workflow.service';

export class TriggerService {
  private cronJobs: Map<number, cron.ScheduledTask> = new Map();

  /** Get trigger node */
  async getTriggerNode(nodeId: number): Promise<Node | null> {
    const node = await db
      .select()
      .from(nodes)
      .where(eq(nodes.id, nodeId))
      .limit(1)
      .then((res) => res[0]);

    if (!node || node.type !== 'trigger') {
      return null;
    }

    return node;
  }

  /** Create trigger node */
  async createTriggerNode(
    matrixId: number,
    data: {
      name: string;
      triggerType: 'manual' | 'cron' | 'webhook';
      config?: Partial<Node['config']>;
    }
  ): Promise<Node> {
    // Validate and prepare trigger config
    const config = this.prepareTriggerConfig(data.triggerType, data.config || {});

    // Create trigger node
    const [node] = await db
      .insert(nodes)
      .values({
        matrixId,
        type: 'trigger',
        name: data.name,
        config: {
          ...config,
          x: 0,
          y: 0,
          inPorts: [],
          outPorts: [{ id: 'output', schema: {} }],
        },
      })
      .returning();

    // Initialize trigger if needed
    await this.initializeTrigger(node);

    return node;
  }

  /** Prepare and validate trigger configuration */
  private prepareTriggerConfig(triggerType: string, config: any) {
    const baseConfig = {
      triggerType,
      triggerStatus: 'inactive',
      ...config,
    };

    switch (triggerType) {
      case 'cron':
        if (!config.cronExpression) {
          throw new Error('Cron expression is required for cron trigger');
        }
        break;
      case 'webhook':
        if (!config.path) {
          throw new Error('Path is required for webhook trigger');
        }
        baseConfig.method = config.method || 'POST';
        baseConfig.secret = config.secret || crypto.randomBytes(32).toString('hex');
        break;
    }

    return baseConfig;
  }

  /** Initialize trigger based on its type */
  private async initializeTrigger(node: Node) {
    if (node.config.triggerStatus !== 'active') return;

    switch (node.config.triggerType) {
      case 'cron':
        this.initializeCronTrigger(node);
        break;
      case 'webhook':
        this.initializeWebhookTrigger(node);
        break;
    }
  }

  /** Initialize cron trigger */
  private initializeCronTrigger(node: Node) {
    if (node.config.cronExpression) {
      // 驗證 cron 表達式
      if (!cron.validate(node.config.cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      // 創建並啟動 cron job
      const task = cron.schedule(node.config.cronExpression, () => this.executeTrigger(node.id), {
        scheduled: true,
        timezone: node.config.timezone,
      });

      this.cronJobs.set(node.id, task);
    }
  }

  /** Initialize webhook trigger */
  private initializeWebhookTrigger(node: Node) {
    // Webhook initialization would be handled by your web framework
  }

  /** Execute trigger */
  async executeTrigger(nodeId: number) {
    const node = await this.getTriggerNode(nodeId);
    if (!node) throw new Error('Trigger node not found');

    // Update last triggered time
    await db
      .update(nodes)
      .set({
        config: {
          ...node.config,
          lastTriggered: new Date(),
        },
        updated: new Date(),
      })
      .where(eq(nodes.id, nodeId));

    // Here you would:
    // 1. Start the workflow execution
    // 2. Handle any trigger-specific logic
  }

  /** Activate trigger */
  async activateTrigger(nodeId: number): Promise<Node> {
    const node = await this.getTriggerNode(nodeId);
    if (!node) throw new Error('Trigger node not found');

    const [updatedNode] = await db
      .update(nodes)
      .set({
        config: {
          ...node.config,
          triggerStatus: 'active',
        },
        updated: new Date(),
      })
      .where(eq(nodes.id, nodeId))
      .returning();

    await this.initializeTrigger(updatedNode);
    return updatedNode;
  }

  /** Deactivate trigger */
  async deactivateTrigger(nodeId: number): Promise<Node> {
    const node = await this.getTriggerNode(nodeId);
    if (!node) throw new Error('Trigger node not found');

    // 停止 cron job
    if (node.config.triggerType === 'cron') {
      const task = this.cronJobs.get(nodeId);
      if (task) {
        task.stop();
        this.cronJobs.delete(nodeId);
      }
    }

    const [updatedNode] = await db
      .update(nodes)
      .set({
        config: {
          ...node.config,
          triggerStatus: 'inactive',
        },
        updated: new Date(),
      })
      .where(eq(nodes.id, nodeId))
      .returning();

    return updatedNode;
  }
}

export const triggerService = new TriggerService();
