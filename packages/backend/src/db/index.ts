import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { sql } from 'drizzle-orm';
import { nodes, type NodeType, matrix } from './schema';

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
    // 檢查是否已經存在基礎 matrix
    const baseMatrix = await db
      .select()
      .from(matrix)
      .where(sql`id = 0`);

    let matrixId = 0;

    // 如果基礎 matrix 不存在，創建它
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

    // 檢查是否已經存在基礎節點
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
        config: Record<string, unknown>;
        position: { x: number; y: number };
      }[] = [
        {
          matrixId: 0,
          type: 'trigger' as NodeType,
          name: 'HTTP Trigger',
          description: 'Triggers flow on HTTP request',
          config: {
            type: 'webhook',
            method: 'POST',
            path: '/webhook',
            headers: {},
          },
          position: { x: 0, y: 0 },
        },
        {
          matrixId: 0,
          type: 'trigger' as NodeType,
          name: 'Schedule Trigger',
          description: 'Triggers flow on schedule',
          config: {
            type: 'schedule',
            cron: '0 0 * * *',
            timezone: 'UTC',
          },
          position: { x: 0, y: 0 },
        },
        {
          matrixId: 0,
          type: 'action' as NodeType,
          name: 'HTTP Request',
          description: 'Make HTTP request to external service',
          config: {
            method: 'GET',
            url: '',
            headers: {},
            body: {},
          },
          position: { x: 0, y: 0 },
        },
        {
          matrixId: 0,
          type: 'condition' as NodeType,
          name: 'Data Condition',
          description: 'Check data conditions',
          config: {
            operator: 'equals',
            field: '',
            value: '',
          },
          position: { x: 0, y: 0 },
        },
        {
          matrixId: 0,
          type: 'transformer' as NodeType,
          name: 'Data Mapper',
          description: 'Transform data structure',
          config: {
            mappings: {},
          },
          position: { x: 0, y: 0 },
        },
        {
          matrixId: 0,
          type: 'loop' as NodeType,
          name: 'For Each',
          description: 'Iterate over array items',
          config: {
            arrayPath: '',
            maxIterations: 100,
          },
          position: { x: 0, y: 0 },
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
