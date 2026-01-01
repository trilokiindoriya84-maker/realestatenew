const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { eq } = require('drizzle-orm');
const { pgTable, text, serial, boolean, timestamp, uuid, integer, jsonb } = require('drizzle-orm/pg-core');
require('dotenv').config();

// Define schema directly in script
const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    fullName: text('full_name'),
    role: text('role').default('user'),
    isVerified: boolean('is_verified').default(false),
    documents: jsonb('documents'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

const db = drizzle(pool);

async function makeAdmin() {
    try {
        console.log('Making trilokiindoriya@gmail.com an admin...');
        
        const result = await db.update(users)
            .set({ 
                role: 'admin',
                updatedAt: new Date()
            })
            .where(eq(users.email, 'trilokiindoriya@gmail.com'))
            .returning();

        if (result.length > 0) {
            console.log('✅ Successfully updated user role to admin');
            console.log('User:', result[0]);
        } else {
            console.log('❌ User not found. Make sure the user has signed up first.');
        }
    } catch (error) {
        console.error('❌ Error updating user role:', error);
    } finally {
        await pool.end();
    }
}

makeAdmin();