import {
  serial,
  text,
  timestamp,
  pgTable,
  integer,
  jsonb,
  pgEnum,
  AnyPgColumn,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Projects table
 * Stores basic project information
 */
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

/**
 * Matrix (Flow) Status enum
 * Represents possible states of a flow
 */
export const matrixStatusEnum = pgEnum('matrix_status', ['active', 'inactive', 'draft', 'error']);

/**
 * Matrix (Flow) table
 * Main table for storing workflow/flow information
 */
export const matrix = pgTable('matrix', {
  id: serial('id').primaryKey(),
  parentMatrixId: integer('parent_matrix_id').references((): AnyPgColumn => matrix.id, {
    onDelete: 'cascade',
  }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  version: integer('version').default(1).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  status: matrixStatusEnum('status').notNull().default('draft'),
  config: jsonb('config').notNull().default({}),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  posts: many(matrix),
}));

export const matrixRelations = relations(matrix, ({ one }) => ({
  author: one(projects, {
    fields: [matrix.projectId],
    references: [projects.id],
  }),
}));

/**
 * Node types enum
 * Defines different types of nodes available in the system
 */
export const nodeTypeEnum = pgEnum('node_type', [
  'trigger',
  'action',
  'condition',
  'subMatrix',
  'transformer',
  'loop',
]);

export type NodeType = (typeof nodeTypeEnum.enumValues)[number];

/**
 * Nodes table
 * Stores node information for each flow
 */
export const nodes = pgTable('nodes', {
  id: serial('id').primaryKey(),
  matrixId: integer('matrix_id')
    .notNull()
    .references(() => matrix.id, { onDelete: 'cascade' }),
  type: nodeTypeEnum('type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  config: jsonb('config').notNull().default({}),
  position: jsonb('position').notNull().default({ x: 0, y: 0 }),
  subMatrixId: integer('sub_matrix_id').references(() => matrix.id, {
    onDelete: 'cascade',
  }),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

/**
 * Connection types enum
 * Defines types of connections (default, success, error, condition)
 */
export const connectionTypeEnum = pgEnum('connection_type', [
  'default',
  'success',
  'error',
  'condition',
]);

/**
 * Connections table
 * Stores connection information between nodes
 */
export const connections = pgTable('connections', {
  id: serial('id').primaryKey(),
  matrixId: integer('matrix_id')
    .notNull()
    .references(() => matrix.id, { onDelete: 'cascade' }),
  sourceId: integer('source_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  targetId: integer('target_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  type: connectionTypeEnum('type').notNull().default('default'),
  config: jsonb('config').default({}).notNull(),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

/**
 * ConnectionConditions table
 * Supports multiple conditions per connection (one-to-many)
 */
export const connectionConditions = pgTable('connection_conditions', {
  id: serial('id').primaryKey(),
  connectionId: integer('connection_id')
    .notNull()
    .references(() => connections.id, { onDelete: 'cascade' }),
  condition: jsonb('condition').default({}).notNull(),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

/**
 * Trigger types enum
 * Defines available trigger types (webhook, schedule, event, etc.)
 */
export const triggerTypeEnum = pgEnum('trigger_type', [
  'webhook',
  'schedule',
  'event',
  'manual',
  'email',
  'database',
]);

/**
 * Trigger status enum
 * Represents possible trigger states
 */
export const triggerStatusEnum = pgEnum('trigger_status', ['active', 'inactive', 'error']);

/**
 * Triggers table
 * One-to-one relationship with nodes (each node can have one trigger)
 */
export const triggers = pgTable('triggers', {
  id: serial('id').primaryKey(),
  nodeId: integer('node_id')
    .notNull()
    .unique()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  type: triggerTypeEnum('type').notNull(),
  name: text('name').notNull(),
  status: triggerStatusEnum('status').notNull().default('inactive'),
  config: jsonb('config').notNull().default({}),
  lastTriggered: timestamp('last_triggered'),
  nextTrigger: timestamp('next_trigger'),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});
