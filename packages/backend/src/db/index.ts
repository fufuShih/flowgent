import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { sql } from 'drizzle-orm';

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
