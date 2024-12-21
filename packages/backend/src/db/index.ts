import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'flowmatrix',
});

// Monitor database connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });

// Export a function to test and initialize the database
export const initDatabase = async () => {
  try {
    // First push the schema to database
    console.log('Pushing schema to database...');
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS public`);

    // Create migrations directory if it doesn't exist
    const migrationsFolder = path.join(__dirname, '../../drizzle');

    // Run migrations
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder });

    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
