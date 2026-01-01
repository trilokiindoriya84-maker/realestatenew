import { Pool } from 'pg';

// Helper function to wake up Neon database (if in sleep mode)
export const wakeUpDatabase = async (pool: Pool): Promise<boolean> => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database wake-up failed:', error);
        return false;
    }
};

// Helper function for database queries with retry logic
export const queryWithRetry = async <T>(
    queryFn: () => Promise<T>,
    retries = 2
): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await queryFn();
        } catch (error: any) {
            console.error(`Database query failed (Attempt ${i + 1}/${retries}):`, error.message);

            if (i === retries - 1) {
                throw error; // Last attempt, throw the error
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw new Error('Query failed after all retries');
};
