import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { properties } from '../db/schema';
import { generateUniqueId } from '../utils/slugGenerator';

export const createProperty = async (propertyData: any) => {
    try {
        // Generate only uniqueId for internal tracking
        const uniqueId = generateUniqueId();
        
        const [property] = await db.insert(properties).values({
            ...propertyData,
            uniqueId,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        
        return property;
    } catch (error) {
        throw error;
    }
};

export const updatePropertyByUniqueId = async (uniqueId: string, propertyData: any) => {
    try {
        let updateData: any = {
            ...propertyData,
            updatedAt: new Date(),
        };
        
        const [property] = await db.update(properties)
            .set(updateData)
            .where(eq(properties.uniqueId, uniqueId))
            .returning();
        
        return property;
    } catch (error) {
        throw error;
    }
};

export const submitPropertyForReviewByUniqueId = async (uniqueId: string, userId: string) => {
    try {
        const [property] = await db.update(properties)
            .set({
                status: 'pending',
                updatedAt: new Date(),
            })
            .where(and(
                eq(properties.uniqueId, uniqueId),
                eq(properties.userId, userId)
            ))
            .returning();
        
        return property;
    } catch (error) {
        throw error;
    }
};

export const getPropertyByUniqueId = async (uniqueId: string) => {
    try {
        const [property] = await db.select()
            .from(properties)
            .where(eq(properties.uniqueId, uniqueId))
            .limit(1);
        
        return property;
    } catch (error) {
        throw error;
    }
};

export const getPropertyWithUserDetails = async (uniqueId: string) => {
    try {
        // Import users and userVerifications at the top if not already imported
        const { users, userVerifications } = await import('../db/schema');
        
        // Get property with user details
        const result = await db.select({
            // Property fields
            property: properties,
            // User basic info
            user: {
                id: users.id,
                email: users.email,
                fullName: users.fullName,
                phoneNumber: users.phoneNumber,
            },
            // User verification details
            verification: userVerifications
        })
        .from(properties)
        .leftJoin(users, eq(properties.userId, users.id))
        .leftJoin(userVerifications, eq(users.id, userVerifications.userId))
        .where(eq(properties.uniqueId, uniqueId))
        .limit(1);
        
        if (!result.length) return null;
        
        return {
            ...result[0].property,
            userDetails: result[0].user,
            verificationDetails: result[0].verification
        };
    } catch (error) {
        throw error;
    }
};

export const getUserProperties = async (userId: string, status?: string) => {
    try {
        if (status) {
            return await db.select()
                .from(properties)
                .where(and(
                    eq(properties.userId, userId),
                    eq(properties.status, status)
                ))
                .orderBy(desc(properties.createdAt));
        }
        
        return await db.select()
            .from(properties)
            .where(eq(properties.userId, userId))
            .orderBy(desc(properties.createdAt));
    } catch (error) {
        throw error;
    }
};

export const getAllProperties = async (status?: string) => {
    try {
        if (status) {
            return await db.select()
                .from(properties)
                .where(eq(properties.status, status))
                .orderBy(desc(properties.createdAt));
        }
        
        return await db.select()
            .from(properties)
            .orderBy(desc(properties.createdAt));
    } catch (error) {
        throw error;
    }
};

export const approvePropertyByUniqueId = async (uniqueId: string, adminId: string) => {
    try {
        const [property] = await db.update(properties)
            .set({
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: adminId,
                rejectionReason: null,
                updatedAt: new Date(),
            })
            .where(eq(properties.uniqueId, uniqueId))
            .returning();
        
        return property;
    } catch (error) {
        throw error;
    }
};

export const rejectPropertyByUniqueId = async (uniqueId: string, reason: string) => {
    try {
        const [property] = await db.update(properties)
            .set({
                status: 'rejected',
                rejectionReason: reason,
                updatedAt: new Date(),
            })
            .where(eq(properties.uniqueId, uniqueId))
            .returning();
        
        return property;
    } catch (error) {
        throw error;
    }
};

export const revokePropertyApprovalByUniqueId = async (uniqueId: string, reason: string) => {
    try {
        const [property] = await db.update(properties)
            .set({
                status: 'pending',
                rejectionReason: reason,
                approvedAt: null,
                approvedBy: null,
                updatedAt: new Date(),
            })
            .where(eq(properties.uniqueId, uniqueId))
            .returning();
        
        return property;
    } catch (error) {
        throw error;
    }
};

// Published Properties Services
export const createOrUpdatePublishedProperty = async (originalUniqueId: string, publishedData: any) => {
    try {
        const { publishedProperties } = await import('../db/schema');
        
        // Get original property to link
        const originalProperty = await getPropertyByUniqueId(originalUniqueId);
        if (!originalProperty) {
            throw new Error('Original property not found');
        }

        // Check if published property already exists
        const [existingPublished] = await db.select()
            .from(publishedProperties)
            .where(eq(publishedProperties.originalPropertyUniqueId, originalProperty.uniqueId))
            .limit(1);

        if (existingPublished) {
            // Update existing published property
            const [updated] = await db.update(publishedProperties)
                .set({
                    ...publishedData,
                    updatedAt: new Date(),
                })
                .where(eq(publishedProperties.uniqueId, existingPublished.uniqueId))
                .returning();
            
            return updated;
        } else {
            // Generate new uniqueId for published property (draft version)
            const publishedUniqueId = generateUniqueId();
            
            // Create new published property
            const [created] = await db.insert(publishedProperties)
                .values({
                    uniqueId: publishedUniqueId,
                    originalPropertyUniqueId: originalProperty.uniqueId,
                    userId: originalProperty.userId,
                    slug: null, // Will be generated when published live
                    ...publishedData,
                    isLive: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();
            
            return created;
        }
    } catch (error: any) {
        throw error;
    }
};

export const getPublishedPropertyByUniqueId = async (originalUniqueId: string) => {
    try {
        const { publishedProperties } = await import('../db/schema');
        
        // Find published property by original property uniqueId
        const [published] = await db.select()
            .from(publishedProperties)
            .where(eq(publishedProperties.originalPropertyUniqueId, originalUniqueId))
            .limit(1);
        
        return published;
    } catch (error) {
        throw error;
    }
};

export const publishPropertyLive = async (originalUniqueId: string, adminId: string) => {
    try {
        const { publishedProperties } = await import('../db/schema');
        const { generateSlug } = await import('../utils/slugGenerator');
        
        console.log('publishPropertyLive called with:', { originalUniqueId, adminId });
        
        // Get original property first
        const originalProperty = await getPropertyByUniqueId(originalUniqueId);
        if (!originalProperty) {
            console.error('Original property not found:', originalUniqueId);
            throw new Error('Original property not found');
        }

        console.log('Original property found:', originalProperty.uniqueId);

        // Get published property by original property uniqueId
        const [published] = await db.select()
            .from(publishedProperties)
            .where(eq(publishedProperties.originalPropertyUniqueId, originalProperty.uniqueId))
            .limit(1);
            
        if (!published) {
            console.error('Published property not found for original:', originalProperty.uniqueId);
            throw new Error('Published property not found');
        }

        console.log('Published property found:', { 
            uniqueId: published.uniqueId, 
            isLive: published.isLive, 
            hasSlug: !!published.slug 
        });

        // Check if already has a slug (was published before)
        if (published.slug) {
            // Already has slug, just toggle live status
            console.log('Property has slug, updating live status to true');
            const [updated] = await db.update(publishedProperties)
                .set({
                    isLive: true,
                    publishedAt: new Date(),
                    publishedBy: adminId,
                    updatedAt: new Date(),
                })
                .where(eq(publishedProperties.uniqueId, published.uniqueId))
                .returning();
            
            console.log('Property published successfully (re-publish)');
            return updated;
        }

        // First time publishing - generate new slug
        console.log('First time publishing, generating slug');
        const slug = generateSlug(published.propertyTitle);
        console.log('Generated slug:', slug);
        
        // Update published property with slug and set live (keep same uniqueId)
        const [updated] = await db.update(publishedProperties)
            .set({
                slug,
                isLive: true,
                publishedAt: new Date(),
                publishedBy: adminId,
                updatedAt: new Date(),
            })
            .where(eq(publishedProperties.uniqueId, published.uniqueId))
            .returning();
        
        console.log('Property published successfully (first time)');
        return updated;
    } catch (error) {
        console.error('publishPropertyLive error:', error);
        throw error;
    }
};

export const unpublishProperty = async (originalUniqueId: string) => {
    try {
        const { publishedProperties } = await import('../db/schema');
        
        console.log('unpublishProperty called with:', originalUniqueId);
        
        // Find and update published property by original property uniqueId
        const [updated] = await db.update(publishedProperties)
            .set({
                isLive: false,
                updatedAt: new Date(),
            })
            .where(eq(publishedProperties.originalPropertyUniqueId, originalUniqueId))
            .returning();
        
        if (!updated) {
            console.error('Published property not found for unpublish:', originalUniqueId);
            throw new Error('Published property not found');
        }
        
        console.log('Property unpublished successfully:', updated.uniqueId);
        return updated;
    } catch (error) {
        console.error('unpublishProperty error:', error);
        throw error;
    }
};

export const getAllPublishedProperties = async () => {
    try {
        const { publishedProperties } = await import('../db/schema');
        
        console.log('Fetching all published properties...');
        
        // Get all published properties with original property uniqueId
        const result = await db.select()
            .from(publishedProperties)
            .orderBy(desc(publishedProperties.createdAt));
        
        console.log('getAllPublishedProperties result count:', result.length);
        if (result.length > 0) {
            console.log('First published property (full):', result[0]);
            console.log('originalPropertyUniqueId value:', result[0].originalPropertyUniqueId);
            console.log('originalPropertyUniqueId type:', typeof result[0].originalPropertyUniqueId);
        }
        
        return result;
    } catch (error) {
        console.error('getAllPublishedProperties error:', error);
        throw error;
    }
};

export const getPublishedPropertiesForPublic = async (limit: number = 16, random: boolean = false) => {
    try {
        const { publishedProperties } = await import('../db/schema');
        
        // Build the base query
        const baseQuery = db.select({
            uniqueId: publishedProperties.uniqueId,
            slug: publishedProperties.slug,
            propertyTitle: publishedProperties.propertyTitle,
            propertyDescription: publishedProperties.propertyDescription,
            propertyType: publishedProperties.propertyType,
            city: publishedProperties.city,
            state: publishedProperties.state,
            locality: publishedProperties.locality,
            totalArea: publishedProperties.totalArea,
            areaUnit: publishedProperties.areaUnit,
            sellingPrice: publishedProperties.sellingPrice,
            priceType: publishedProperties.priceType,
            publishedPhotos: publishedProperties.publishedPhotos,
            bedrooms: publishedProperties.bedrooms,
            bathrooms: publishedProperties.bathrooms,
            publishedAt: publishedProperties.publishedAt,
        })
        .from(publishedProperties)
        .where(eq(publishedProperties.isLive, true));

        // Add ordering and execute query
        let result;
        if (random) {
            // For PostgreSQL, use RANDOM() for random ordering
            result = await baseQuery.orderBy(sql`RANDOM()`).limit(limit);
        } else {
            result = await baseQuery.orderBy(desc(publishedProperties.publishedAt)).limit(limit);
        }
        
        return result;
    } catch (error) {
        throw error;
    }
};

export const getPublishedPropertyDetailByUniqueId = async (uniqueId: string) => {
    try {
        const { publishedProperties } = await import('../db/schema');
        
        // Get full published property details for public view
        const [property] = await db.select()
            .from(publishedProperties)
            .where(and(
                eq(publishedProperties.uniqueId, uniqueId),
                eq(publishedProperties.isLive, true)
            ))
            .limit(1);
        
        return property;
    } catch (error) {
        throw error;
    }
};

export const deletePropertyByUniqueId = async (uniqueId: string, userId: string) => {
    try {
        await db.delete(properties)
            .where(and(
                eq(properties.uniqueId, uniqueId),
                eq(properties.userId, userId)
            ));
        
        return { success: true };
    } catch (error) {
        throw error;
    }
};


// Re-export enquiry functions
export { getAllEnquiries, getPendingEnquiries, getEnquiryDetails, updateEnquiryStatus } from './enquiryService';
