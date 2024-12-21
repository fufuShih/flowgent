import {
  serial,
  text,
  timestamp,
  pgTable,
  integer,
  jsonb,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

// Matrix (Flow) Status enum
export const matrixStatusEnum = pgEnum('matrix_status', ['active', 'inactive', 'draft', 'error']);

// Matrix table (Workflow/Flow)
export const matrix = pgTable('matrix', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: matrixStatusEnum('status').notNull().default('draft'),
  isSubMatrix: boolean('is_sub_matrix').default(false).notNull(),
  config: jsonb('config').notNull().default('{}'),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

// Node types enum
export const nodeTypeEnum = pgEnum('node_type', [
  'trigger',
  'action',
  'condition',
  'subMatrix',
  'transformer',
  'loop',
]);

// Nodes table (previously blocks)
export const nodes = pgTable('nodes', {
  id: serial('id').primaryKey(),
  matrixId: integer('matrix_id')
    .notNull()
    .references(() => matrix.id, { onDelete: 'cascade' }),
  type: nodeTypeEnum('type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  config: jsonb('config').notNull().default('{}'),
  position: jsonb('position').notNull().default('{"x": 0, "y": 0}'),
  // For subMatrix type, reference to another matrix
  subMatrixId: integer('sub_matrix_id').references(() => matrix.id),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

// Connection types enum
export const connectionTypeEnum = pgEnum('connection_type', [
  'default',
  'success',
  'error',
  'condition',
]);

// Connections table (previously edges)
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
  condition: jsonb('condition').default('{}'),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

// Trigger types enum
export const triggerTypeEnum = pgEnum('trigger_type', [
  'webhook',
  'schedule',
  'event',
  'manual',
  'email',
  'database',
]);

// Trigger status enum
export const triggerStatusEnum = pgEnum('trigger_status', ['active', 'inactive', 'error']);

// Triggers table
export const triggers = pgTable('triggers', {
  id: serial('id').primaryKey(),
  nodeId: integer('node_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  type: triggerTypeEnum('type').notNull(),
  name: text('name').notNull(),
  status: triggerStatusEnum('status').notNull().default('inactive'),
  config: jsonb('config').notNull().default('{}'),
  lastTriggered: timestamp('last_triggered'),
  nextTrigger: timestamp('next_trigger'),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});
