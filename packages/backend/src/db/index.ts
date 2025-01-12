import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { sql } from 'drizzle-orm';
import { nodes, type NodeType, matrix, INodeConfig } from './schema';

// Database configuration interface
interface DatabaseConfig extends PoolConfig {
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Default database configuration
const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'flowmatrix',
  // Connection pool settings
  max: Number(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT) || 5000,
};

const pool = new Pool(defaultConfig);

// Enhanced error monitoring for the connection pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('New client connected to the pool');
});

export const db = drizzle(pool, { schema });

/**
 * Initialize database and run migrations
 * @returns Promise<boolean> - true if initialization successful, false otherwise
 */
export const initDatabase = async (): Promise<boolean> => {
  try {
    // Create schema if not exists
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS public`);

    // Ensure all enums are created
    await createEnums();

    // Run migrations
    const migrationsFolder = path.join(__dirname, '../../drizzle');
    await migrate(db, { migrationsFolder });

    // Initialize template nodes
    await initializeTemplateNodes();

    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

/**
 * Create database enums if they don't exist
 */
async function createEnums(): Promise<void> {
  try {
    // Create each enum separately to better handle errors
    const enumStatements = [
      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'matrix_status') THEN
           CREATE TYPE matrix_status AS ENUM ('active', 'inactive', 'draft', 'error');
         END IF;
       END $$;`,

      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'node_type') THEN
           CREATE TYPE node_type AS ENUM ('trigger', 'action', 'condition', 'subMatrix', 'transformer', 'loop');
         END IF;
       END $$;`,

      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_type') THEN
           CREATE TYPE connection_type AS ENUM ('default', 'success', 'error', 'condition');
         END IF;
       END $$;`,

      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trigger_type') THEN
           CREATE TYPE trigger_type AS ENUM ('webhook', 'schedule', 'event', 'manual', 'email', 'database');
         END IF;
       END $$;`,

      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trigger_status') THEN
           CREATE TYPE trigger_status AS ENUM ('active', 'inactive', 'error');
         END IF;
       END $$;`,
    ];

    // Execute each statement separately
    for (const statement of enumStatements) {
      await db.execute(sql.raw(statement));
    }

    console.log('Enums created successfully');
  } catch (error) {
    console.error('Error creating enums:', error);
    throw error;
  }
}

/**
 * Test database connection
 * @returns Promise<boolean> - true if connection successful, false otherwise
 */
export const testConnection = async (): Promise<boolean> => {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Gracefully close database connection pool
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection pool:', error);
    throw error;
  }
};

async function initializeTemplateNodes(): Promise<void> {
  try {
    // Check if the base matrix already exists
    const baseMatrix = await db
      .select()
      .from(matrix)
      .where(sql`id = 0`);

    let matrixId = 0;

    // If the base matrix doesn't exist, create it
    if (baseMatrix.length === 0) {
      const result = await db
        .insert(matrix)
        .values({
          id: 0,
          name: 'Base Template Matrix',
          description: 'Stores base node templates',
          status: 'inactive',
          config: {},
        })
        .returning({ id: matrix.id });

      matrixId = result[0].id;
    }

    // Check if the base nodes already exist
    const existingNodes = await db
      .select()
      .from(nodes)
      .where(sql`matrix_id = ${matrixId}`);

    if (existingNodes.length === 0) {
      const baseNodes: {
        matrixId: number;
        type: NodeType;
        name: string;
        description: string;
        config: INodeConfig;
      }[] = [
        {
          matrixId: 0,
          type: 'trigger',
          name: 'HTTP Trigger',
          description: 'Triggers flow on HTTP request',
          config: {
            x: 0,
            y: 0,
            inPorts: [],
            outPorts: [
              {
                id: '1',
                schema: {
                  type: 'object',
                  properties: {
                    body: { type: 'object' },
                    headers: { type: 'object' },
                    method: { type: 'string' },
                    query: { type: 'object' },
                  },
                },
              },
            ],
            type: 'webhook',
            method: 'POST',
            path: '/webhook',
            headers: {},
          },
        },
        {
          matrixId: 0,
          type: 'action',
          name: 'HTTP Request',
          description: 'Make HTTP request to external service',
          config: {
            x: 0,
            y: 0,
            inPorts: [
              {
                id: '1',
                accepts: ['trigger', 'transformer', 'action'],
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    method: { type: 'string' },
                    headers: { type: 'object' },
                    body: { type: 'object' },
                  },
                },
              },
            ],
            outPorts: [
              {
                id: '1',
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'number' },
                    data: { type: 'object' },
                    headers: { type: 'object' },
                  },
                },
              },
            ],
            method: 'GET',
            url: '',
            headers: {},
            body: {},
          },
        },
        {
          matrixId: 0,
          type: 'condition',
          name: 'Data Condition',
          description: 'Check data conditions',
          config: {
            x: 0,
            y: 0,
            inPorts: [
              {
                id: '1',
                accepts: ['trigger', 'action', 'transformer'],
                schema: {
                  type: 'object',
                },
              },
            ],
            outPorts: [
              {
                id: '1',
                label: 'true',
                schema: {
                  type: 'object',
                },
              },
              {
                id: '2',
                label: 'false',
                schema: {
                  type: 'object',
                },
              },
            ],
            operator: 'equals',
            field: '',
            value: '',
          },
        },
        {
          matrixId: 0,
          type: 'transformer',
          name: 'Data Mapper',
          description: 'Transform data structure',
          config: {
            x: 0,
            y: 0,
            inPorts: [
              {
                id: '1',
                accepts: ['trigger', 'action', 'condition', 'loop'],
                schema: {
                  type: 'object',
                },
              },
            ],
            outPorts: [
              {
                id: '1',
                schema: {
                  type: 'object',
                },
              },
            ],
            mappings: {},
          },
        },
        {
          matrixId: 0,
          type: 'loop',
          name: 'For Each',
          description: 'Iterate over array items',
          config: {
            x: 0,
            y: 0,
            inPorts: [
              {
                id: '1',
                accepts: ['trigger', 'action', 'transformer'],
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            ],
            outPorts: [
              {
                id: '1',
                label: 'item',
                schema: {
                  type: 'object',
                },
              },
              {
                id: '2',
                label: 'completed',
                schema: {
                  type: 'object',
                  properties: {
                    totalItems: { type: 'number' },
                    results: { type: 'array' },
                  },
                },
              },
            ],
            arrayPath: '',
            maxIterations: 100,
          },
        },
      ];

      for (const node of baseNodes) {
        await db.insert(nodes).values({
          ...node,
          matrixId,
        });
      }

      console.log('Base nodes initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing base nodes:', error);
    throw error;
  }
}
