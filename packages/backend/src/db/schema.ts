import { serial, text, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
});

export const matrices = pgTable('matrices', {
  id: serial('id').primaryKey(),
  projectId: serial('project_id').references(() => projects.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  nodes: text('nodes').notNull(), // 存储为JSON字符串
  edges: text('edges').notNull(), // 存储为JSON字符串
  created: timestamp('created').defaultNow().notNull(),
  updated: timestamp('updated').defaultNow().notNull(),
}); 