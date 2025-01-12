import { db } from '../db';
import { and, eq, inArray, or } from 'drizzle-orm';
import { nodes, connections, matrix } from '../db/schema';
import type { InferModel } from 'drizzle-orm';
import { triggerService } from './trigger.service';

export type Node = InferModel<typeof nodes>;
export type Connection = InferModel<typeof connections>;

export interface WorkflowData {
  nodes: Node[];
  connections: Connection[];
}

type NodeExecutionResult = boolean | Record<string, any> | void;

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

  /**
   * Execute a workflow by matrix ID
   * This will find all trigger nodes and execute the workflow
   */
  async executeWorkflow(matrixId: number): Promise<void> {
    // Get all nodes and connections for this matrix
    const [workflowNodes, workflowConnections] = await Promise.all([
      db.select().from(nodes).where(eq(nodes.matrixId, matrixId)),
      db.select().from(connections).where(eq(connections.matrixId, matrixId)),
    ]);

    // Get trigger nodes
    const triggerNodes = workflowNodes.filter((node) => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      throw new Error('No trigger nodes found in this matrix');
    }

    // Create a map of nodes by their IDs for quick lookup
    const nodesMap = new Map(workflowNodes.map((node) => [node.id, node]));

    // Create an adjacency list representation of the workflow graph
    const adjacencyList = new Map<number, Connection[]>();
    workflowConnections.forEach((conn) => {
      if (!adjacencyList.has(conn.sourceId)) {
        adjacencyList.set(conn.sourceId, []);
      }
      adjacencyList.get(conn.sourceId)!.push(conn);
    });

    // Function to execute a single node and its downstream nodes
    const executeNode = async (nodeId: number, executionContext: any = {}) => {
      const node = nodesMap.get(nodeId);
      if (!node) return;

      try {
        let result: NodeExecutionResult = undefined;
        switch (node.type) {
          case 'trigger':
            result = await triggerService.executeTrigger(node.id);
            break;
          case 'action':
            // TODO: Implement action execution
            result = await this.executeAction(node, executionContext);
            break;
          case 'condition':
            // TODO: Implement condition evaluation
            result = await this.evaluateCondition(node, executionContext);
            break;
          case 'transformer':
            // TODO: Implement data transformation
            result = await this.executeTransformer(node, executionContext);
            break;
          // Add other node types as needed
        }

        // Update execution context with the result
        executionContext[node.id] = result;

        // Get downstream connections
        const downstreamConnections = adjacencyList.get(node.id) || [];

        // For conditions, only follow the appropriate path
        if (node.type === 'condition' && typeof result === 'boolean') {
          const successConnections = downstreamConnections.filter(
            (conn) => conn.type === (result ? 'success' : 'error')
          );
          await Promise.all(
            successConnections.map((conn) => executeNode(conn.targetId, executionContext))
          );
        } else {
          // For other nodes, execute all downstream nodes
          await Promise.all(
            downstreamConnections.map((conn) => executeNode(conn.targetId, executionContext))
          );
        }
      } catch (error) {
        console.error(`Error executing node ${node.id}:`, error);
        // Handle error connections if they exist
        const errorConnections = (adjacencyList.get(node.id) || []).filter(
          (conn) => conn.type === 'error'
        );

        if (errorConnections.length > 0) {
          await Promise.all(
            errorConnections.map((conn) =>
              executeNode(conn.targetId, { ...executionContext, error })
            )
          );
        } else {
          throw error; // Re-throw if no error handling is defined
        }
      }
    };

    // Execute workflow starting from each trigger node
    await Promise.all(triggerNodes.map((node) => executeNode(node.id, {})));
  }

  // TODO: Implement these methods based on your node execution requirements
  private async executeAction(node: Node, context: any) {
    // Implement action execution logic
    throw new Error('Action execution not implemented');
  }

  private async evaluateCondition(node: Node, context: any) {
    // Implement condition evaluation logic
    throw new Error('Condition evaluation not implemented');
  }

  private async executeTransformer(node: Node, context: any) {
    // Implement transformer execution logic
    throw new Error('Transformer execution not implemented');
  }
}

export const workflowService = new WorkflowService();
