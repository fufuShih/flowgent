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
  'monitor',
]);

export type NodeType = (typeof nodeTypeEnum.enumValues)[number];

export type JSONSchema = {
  [key: string]: any;
};

export type InPortType = {
  id: string;
  accepts: NodeType[]; // Accepts the output of which node type
  schema: JSONSchema; // Describe the expected data structure
};

export type OutPortType = {
  id: string;
  label?: string; // Optional label, used to describe the purpose of the output
  schema: JSONSchema; // Describe the output data structure
};

export interface INodeConfig {
  x: number;
  y: number;
  inPorts: InPortType[];
  outPorts: OutPortType[];
  [key: string]: any;
}

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
  config: jsonb('config').$type<INodeConfig>().notNull().default({
    x: 0,
    y: 0,
    inPorts: [],
    outPorts: [],
  }),
  subMatrixId: integer('sub_matrix_id').references(() => matrix.id, {
    onDelete: 'cascade',
  }),
  typeVersion: integer('type_version').notNull().default(1),
  disabled: boolean('disabled').notNull().default(false),
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

export interface IConnectionConfig {
  [key: string]: any;
}

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
  config: jsonb('config').$type<IConnectionConfig>().default({}).notNull(),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

export const triggers = pgTable('triggers', {
  id: serial('id').primaryKey(),
  nodeId: integer('node_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  name: text('name').notNull(),
  config: jsonb('config').default({}).notNull(),
  status: text('status').default('inactive').notNull(),
  lastTriggered: timestamp('last_triggered'),
  nextTrigger: timestamp('next_trigger'),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});
