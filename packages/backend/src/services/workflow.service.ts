import { db } from '../db';
import { and, eq, inArray, or } from 'drizzle-orm';
import { nodes, connections, matrix } from '../db/schema';
import type { InferModel } from 'drizzle-orm';

export type Node = InferModel<typeof nodes>;
export type Connection = InferModel<typeof connections>;

export interface WorkflowData {
  nodes: Node[];
  connections: Connection[];
}

export class WorkflowService {
  /**
   * Get workflow data for a matrix
   */
  async getWorkflow(matrixId: number): Promise<WorkflowData> {
    const workflowNodes = await db.select().from(nodes).where(eq(nodes.matrixId, matrixId));
    const workflowConnections = await db
      .select()
      .from(connections)
      .where(eq(connections.matrixId, matrixId));

    return {
      nodes: workflowNodes,
      connections: workflowConnections,
    };
  }

  /**
   * Update workflow nodes
   */
  async updateNodes(
    matrixId: number,
    nodeUpdates: Array<Partial<Node> & { id: number }>
  ): Promise<Node[]> {
    const nodeIds = nodeUpdates.map((n) => n.id);

    const existingNodes = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.matrixId, matrixId), inArray(nodes.id, nodeIds)));

    if (existingNodes.length !== nodeIds.length) {
      throw new Error('Some nodes do not exist or do not belong to this matrix');
    }

    // Update nodes in transaction
    const updatedNodes = await db.transaction(async (tx) => {
      const results: Node[] = [];
      for (const node of nodeUpdates) {
        const [updated] = await tx
          .update(nodes)
          .set({
            ...node,
            updated: new Date(),
          })
          .where(and(eq(nodes.id, node.id), eq(nodes.matrixId, matrixId)))
          .returning();
        results.push(updated);
      }
      return results;
    });

    return updatedNodes;
  }

  /**
   * Create new nodes
   */
  async createNodes(
    matrixId: number,
    newNodes: Omit<Node, 'id' | 'created' | 'updated'>[]
  ): Promise<Node[]> {
    // Verify matrix exists
    const matrixExists = await db.select().from(matrix).where(eq(matrix.id, matrixId)).limit(1);
    if (!matrixExists.length) {
      throw new Error('Matrix not found');
    }

    const createdNodes = await db
      .insert(nodes)
      .values(newNodes.map((node) => ({ ...node, matrixId })))
      .returning();

    return createdNodes;
  }

  /**
   * Delete nodes
   */
  async deleteNodes(matrixId: number, nodeIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete associated connections first
      await tx
        .delete(connections)
        .where(
          and(
            eq(connections.matrixId, matrixId),
            or(inArray(connections.sourceId, nodeIds), inArray(connections.targetId, nodeIds))
          )
        );

      // Delete nodes
      await tx.delete(nodes).where(and(eq(nodes.matrixId, matrixId), inArray(nodes.id, nodeIds)));
    });
  }

  /**
   * Update workflow connections
   */
  async updateConnections(
    matrixId: number,
    connectionUpdates: Array<Partial<Connection> & { id: number }>
  ): Promise<Connection[]> {
    const connectionIds = connectionUpdates.map((c) => c.id);

    const existingConnections = await db
      .select()
      .from(connections)
      .where(and(eq(connections.matrixId, matrixId), inArray(connections.id, connectionIds)));

    if (existingConnections.length !== connectionIds.length) {
      throw new Error('Some connections do not exist or do not belong to this matrix');
    }

    // Update connections in transaction
    const updatedConnections = await db.transaction(async (tx) => {
      const results: Connection[] = [];
      for (const connection of connectionUpdates) {
        const [updated] = await tx
          .update(connections)
          .set({
            ...connection,
            updated: new Date(),
          })
          .where(and(eq(connections.id, connection.id), eq(connections.matrixId, matrixId)))
          .returning();
        results.push(updated);
      }
      return results;
    });

    return updatedConnections;
  }

  /**
   * Create new connections
   */
  async createConnections(
    matrixId: number,
    newConnections: Omit<Connection, 'id' | 'created' | 'updated'>[]
  ): Promise<Connection[]> {
    // Verify all referenced nodes exist and belong to the matrix
    const nodeIds = new Set(newConnections.flatMap((c) => [c.sourceId, c.targetId]));
    const existingNodes = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.matrixId, matrixId), inArray(nodes.id, Array.from(nodeIds))));

    if (existingNodes.length !== nodeIds.size) {
      throw new Error('Some referenced nodes do not exist or do not belong to this matrix');
    }

    const createdConnections = await db
      .insert(connections)
      .values(newConnections.map((conn) => ({ ...conn, matrixId })))
      .returning();

    return createdConnections;
  }

  /**
   * Delete connections
   */
  async deleteConnections(matrixId: number, connectionIds: number[]): Promise<void> {
    await db
      .delete(connections)
      .where(and(eq(connections.matrixId, matrixId), inArray(connections.id, connectionIds)));
  }
}

export const workflowService = new WorkflowService();
