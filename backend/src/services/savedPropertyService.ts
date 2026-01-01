import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { savedProperties, publishedProperties } from '../db/schema';

export const saveProperty = async (userId: string, propertyUniqueId: string) => {
    try {
        // Check if already saved
        const [existing] = await db.select()
            .from(savedProperties)
            .where(and(
                eq(savedProperties.userId, userId),
                eq(savedProperties.propertyUniqueId, propertyUniqueId)
            ))
            .limit(1);

        if (existing) {
            return { success: false, message: 'Property already saved' };
        }

        const [saved] = await db.insert(savedProperties)
            .values({
                userId,
                propertyUniqueId,
            })
            .returning();

        return { success: true, data: saved };
    } catch (error) {
        throw error;
    }
};

export const unsaveProperty = async (userId: string, propertyUniqueId: string) => {
    try {
        await db.delete(savedProperties)
            .where(and(
                eq(savedProperties.userId, userId),
                eq(savedProperties.propertyUniqueId, propertyUniqueId)
            ));

        return { success: true, message: 'Property unsaved' };
    } catch (error) {
        throw error;
    }
};

export const getSavedProperties = async (userId: string) => {
    try {
        const result = await db.select({
            savedProperty: savedProperties,
            property: publishedProperties,
        })
        .from(savedProperties)
        .innerJoin(publishedProperties, eq(savedProperties.propertyUniqueId, publishedProperties.uniqueId))
        .where(eq(savedProperties.userId, userId))
        .orderBy(desc(savedProperties.createdAt));

        return result.map(r => ({
            ...r.property,
            savedAt: r.savedProperty.createdAt,
        }));
    } catch (error) {
        throw error;
    }
};

export const checkIfSaved = async (userId: string, propertyUniqueId: string) => {
    try {
        const [saved] = await db.select()
            .from(savedProperties)
            .where(and(
                eq(savedProperties.userId, userId),
                eq(savedProperties.propertyUniqueId, propertyUniqueId)
            ))
            .limit(1);

        return !!saved;
    } catch (error) {
        throw error;
    }
};
