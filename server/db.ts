import "dotenv/config";
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 20_000,
  keepAlive: true,
});

// Prevent unhandled pool errors from crashing the process (e.g., Neon/Supabase pooler restarts)
pool.on('error', (err) => {
  console.error('[db] Postgres pool error (non-fatal):', err);
});
export const db = drizzle(pool, { schema });