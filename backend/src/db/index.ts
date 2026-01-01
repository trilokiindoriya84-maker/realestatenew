
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config';
import * as schema from './schema';

if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
}

// PostgreSQL connection pool
// Optimized for Neon: keepAlive + graceful error handling
const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10, // Maximum concurrent connections
    min: 1,  // Keep at least one warm connection
    idleTimeoutMillis: 30000, // Close idle clients after 30s (before Neon kills them)
    connectionTimeoutMillis: 30000, // 30 seconds timeout
    keepAlive: true, // Prevent some idle disconnects
});

// Very important: prevent process crash on idle client errors
// If Neon closes an idle connection, pg will emit 'error' on that client.
// Without this handler, Node process crashes. With this, we just log and allow pool to recreate a connection.
pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error (usually due to idle disconnect):', err);
});

// Connection test
export const connectDB = async (): Promise<void> => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');
    } catch (error) {
        // Let the caller see the error, but don't crash the process
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};

export const db = drizzle(pool, { schema });
export { pool };
