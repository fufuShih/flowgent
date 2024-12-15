import { serial, text, timestamp, pgTable, integer } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

export const matrices = pgTable('matrices', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  nodes: text('nodes').notNull(),
  edges: text('edges').notNull(),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

export const triggers = pgTable('triggers', {
  id: serial('id').primaryKey(),
  matrixId: integer('matrix_id')
    .references(() => matrices.id)
    .notNull(),
  nodeId: text('node_id').notNull(),
  type: text('type').notNull(),
  config: text('config').notNull(),
  status: text('status').notNull().default('inactive'),
  lastTriggered: timestamp('last_triggered'),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});
