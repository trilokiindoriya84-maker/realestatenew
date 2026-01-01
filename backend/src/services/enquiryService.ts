import { db } from '../db';
import { enquiries, publishedProperties, users, userVerifications } from '../db/schema';
import { nanoid } from 'nanoid';
import { eq, desc } from 'drizzle-orm';

interface CreateEnquiryData {
    propertyUniqueId: string;
    name: string;
    mobile: string;
    message: string;
    userId?: string | null; // Optional - for logged-in users
}

export const createEnquiry = async (data: CreateEnquiryData) => {
    try {
        const uniqueId = nanoid(12);

        const [enquiry] = await db.insert(enquiries)
            .values({
                uniqueId,
                propertyUniqueId: data.propertyUniqueId,
                userId: data.userId || null,
                name: data.name,
                mobile: data.mobile,
                message: data.message,
                status: 'pending',
                createdAt: new Date(),
            })
            .returning();

        return enquiry;
    } catch (error) {
        console.error('Create enquiry service error:', error);
        throw error;
    }
};

export const getAllEnquiries = async () => {
    try {
        const result = await db.select()
            .from(enquiries)
            .orderBy(desc(enquiries.createdAt));

        return result;
    } catch (error) {
        console.error('Get all enquiries error:', error);
        throw error;
    }
};

export const getPendingEnquiries = async () => {
    try {
        const result = await db.select()
            .from(enquiries)
            .where(eq(enquiries.status, 'pending'))
            .orderBy(desc(enquiries.createdAt));

        return result;
    } catch (error) {
        console.error('Get pending enquiries error:', error);
        throw error;
    }
};

export const getUserEnquiries = async (userId: string) => {
    try {
        // Get user's enquiries with property details
        const result = await db.select({
            enquiry: enquiries,
            property: {
                uniqueId: publishedProperties.uniqueId,
                slug: publishedProperties.slug,
                propertyTitle: publishedProperties.propertyTitle,
                propertyType: publishedProperties.propertyType,
                city: publishedProperties.city,
                state: publishedProperties.state,
                sellingPrice: publishedProperties.sellingPrice,
                totalArea: publishedProperties.totalArea,
                areaUnit: publishedProperties.areaUnit,
                publishedPhotos: publishedProperties.publishedPhotos,
            },
        })
        .from(enquiries)
        .leftJoin(publishedProperties, eq(enquiries.propertyUniqueId, publishedProperties.uniqueId))
        .where(eq(enquiries.userId, userId))
        .orderBy(desc(enquiries.createdAt));

        return result;
    } catch (error) {
        console.error('Get user enquiries error:', error);
        throw error;
    }
};

export const getEnquiryDetails = async (uniqueId: string) => {
    try {
        // Get enquiry with property, property owner, and buyer details
        const result = await db.select({
            // Enquiry details
            enquiry: enquiries,
            // Property details
            property: publishedProperties,
            // Property owner details
            propertyOwner: {
                id: users.id,
                email: users.email,
                fullName: users.fullName,
                phoneNumber: users.phoneNumber,
                isVerified: users.isVerified,
                verificationStatus: users.verificationStatus,
            },
            // Property owner verification details
            ownerVerification: userVerifications,
        })
        .from(enquiries)
        .leftJoin(publishedProperties, eq(enquiries.propertyUniqueId, publishedProperties.uniqueId))
        .leftJoin(users, eq(publishedProperties.userId, users.id))
        .leftJoin(userVerifications, eq(users.id, userVerifications.userId))
        .where(eq(enquiries.uniqueId, uniqueId))
        .limit(1);

        if (!result.length) {
            return null;
        }

        // If enquiry has userId, get user verification details
        let buyerVerification = null;
        if (result[0].enquiry.userId) {
            const buyerVerificationResult = await db.select()
                .from(userVerifications)
                .where(eq(userVerifications.userId, result[0].enquiry.userId))
                .limit(1);
            
            if (buyerVerificationResult.length > 0) {
                buyerVerification = buyerVerificationResult[0];
            }
        }

        return {
            ...result[0],
            buyerVerification,
        };
    } catch (error) {
        console.error('Get enquiry details error:', error);
        throw error;
    }
};

export const updateEnquiryStatus = async (uniqueId: string, status: string) => {
    try {
        const [updated] = await db.update(enquiries)
            .set({ status, updatedAt: new Date() })
            .where(eq(enquiries.uniqueId, uniqueId))
            .returning();

        return updated;
    } catch (error) {
        console.error('Update enquiry status error:', error);
        throw error;
    }
};
