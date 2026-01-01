
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

export const syncUser = async (id: string, email: string, fullName?: string, role: string = 'user', phoneNumber?: string, avatarUrl?: string) => {
    try {
        // 1. Check if user exists by Supabase ID
        const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);

        if (existingUser.length > 0) {
            // Update avatar if provided
            if (avatarUrl && avatarUrl !== existingUser[0].avatarUrl) {
                const [updatedUser] = await db.update(users)
                    .set({
                        avatarUrl: avatarUrl,
                        fullName: fullName || existingUser[0].fullName,
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, id))
                    .returning();
                return updatedUser;
            }
            return existingUser[0];
        }

        // 2. Check if user exists by Email (but different ID - legacy record)
        const existingByEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existingByEmail.length > 0) {
            // Update the existing user's ID to match the new Supabase ID
            const [updatedUser] = await db.update(users)
                .set({
                    id: id,
                    fullName: fullName || existingByEmail[0].fullName,
                    phoneNumber: phoneNumber || existingByEmail[0].phoneNumber,
                    avatarUrl: avatarUrl || existingByEmail[0].avatarUrl,
                    updatedAt: new Date()
                })
                .where(eq(users.email, email))
                .returning();
            
            return updatedUser;
        }

        // 3. Create new user if not exists
        const newUser = await db.insert(users).values({
            id,
            email,
            fullName: fullName || '',
            phoneNumber: phoneNumber || null,
            avatarUrl: avatarUrl || null,
            role,
            isVerified: false, // Default pending
        }).returning();

        return newUser[0];
    } catch (error) {
        throw error;
    }
};

export const getUserById = async (id: string) => {
    try {
        const user = await db.select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
            role: users.role,
            phoneNumber: users.phoneNumber,
            isVerified: users.isVerified,
            isBlocked: users.isBlocked,
            verificationStatus: users.verificationStatus,
            rejectionReason: users.rejectionReason,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        }).from(users).where(eq(users.id, id)).limit(1);
        
        return user[0];
    } catch (error) {
        throw error;
    }
}

export const updateUserRole = async (email: string, role: string) => {
    try {
        const updatedUser = await db.update(users)
            .set({ role, updatedAt: new Date() })
            .where(eq(users.email, email))
            .returning();
        
        return updatedUser[0];
    } catch (error) {
        throw error;
    }
}

export const getAllUsers = async () => {
    return await db.select().from(users);
}

export const blockUser = async (userId: string) => {
    try {
        const [updatedUser] = await db.update(users)
            .set({ 
                isBlocked: true,
                updatedAt: new Date() 
            })
            .where(eq(users.id, userId))
            .returning();
        
        return updatedUser;
    } catch (error) {
        throw error;
    }
}

export const unblockUser = async (userId: string) => {
    try {
        const [updatedUser] = await db.update(users)
            .set({ 
                isBlocked: false,
                updatedAt: new Date() 
            })
            .where(eq(users.id, userId))
            .returning();
        
        return updatedUser;
    } catch (error) {
        throw error;
    }
}
