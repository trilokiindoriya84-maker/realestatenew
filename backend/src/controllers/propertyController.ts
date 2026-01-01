import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as propertyService from '../services/propertyService';
import { uploadFile, getPropertyFolderPath } from '../services/uploadService';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const createProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user.id;
        const propertyData = {
            ...req.body,
            userId,
            amenities: req.body.amenities || {},
        };

        const property = await propertyService.createProperty(propertyData);
        return res.status(201).json({ message: 'Property created as draft', property });
    } catch (error) {
        console.error('Create property error:', error);
        return res.status(500).json({ message: 'Failed to create property' });
    }
};

export const updateProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const userId = req.user.id;
        
        // Verify ownership
        const existingProperty = await propertyService.getPropertyByUniqueId(uniqueId);
        if (!existingProperty || existingProperty.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const propertyData = {
            ...req.body,
            amenities: req.body.amenities || existingProperty.amenities,
        };

        const property = await propertyService.updatePropertyByUniqueId(uniqueId, propertyData);
        return res.status(200).json({ message: 'Property updated', property });
    } catch (error) {
        console.error('Update property error:', error);
        return res.status(500).json({ message: 'Failed to update property' });
    }
};

export const submitProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const userId = req.user.id;

        const property = await propertyService.submitPropertyForReviewByUniqueId(uniqueId, userId);
        
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        return res.status(200).json({ message: 'Property submitted for review', property });
    } catch (error) {
        console.error('Submit property error:', error);
        return res.status(500).json({ message: 'Failed to submit property' });
    }
};

export const getMyProperties = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const properties = await propertyService.getUserProperties(
            userId,
            status as string | undefined
        );

        return res.status(200).json(properties);
    } catch (error) {
        console.error('Get my properties error:', error);
        return res.status(500).json({ message: 'Failed to fetch properties' });
    }
};

// REMOVED: getPropertyById - use getPropertyByUniqueId instead

export const getPropertyByUniqueId = async (req: any, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const property = await propertyService.getPropertyByUniqueId(uniqueId);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Public route - no ownership check
        return res.status(200).json(property);
    } catch (error) {
        console.error('Get property by uniqueId error:', error);
        return res.status(500).json({ message: 'Failed to fetch property' });
    }
};

export const getPropertyForEdit = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const userId = req.user.id;
        
        const property = await propertyService.getPropertyByUniqueId(uniqueId);

        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // SECURITY CHECK: Verify property belongs to logged-in user
        if (property.userId !== userId) {
            return res.status(403).json({ 
                message: 'Unauthorized: This property does not belong to you.',
                code: 'UNAUTHORIZED_ACCESS'
            });
        }

        return res.status(200).json(property);
    } catch (error) {
        console.error('Get property for edit error:', error);
        return res.status(500).json({ message: 'Failed to fetch property' });
    }
};

export const deleteProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const userId = req.user.id;

        await propertyService.deletePropertyByUniqueId(uniqueId, userId);
        return res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error('Delete property error:', error);
        return res.status(500).json({ message: 'Failed to delete property' });
    }
};

// File upload handler
export const uploadPropertyFiles = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const { folder, propertyUniqueId } = req.body;

        // Get current user info
        const currentUser = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
        if (!currentUser.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify property exists
        const property = await propertyService.getPropertyByUniqueId(propertyUniqueId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        // Check authorization: either property owner OR admin
        const isAdmin = currentUser[0].role === 'admin' || currentUser[0].email === 'trilokiindoriya@gmail.com';
        const isOwner = property.userId === req.user.id;
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Unauthorized: You must be the property owner or admin' });
        }

        // Get property owner's info for folder structure (always use property owner's folder)
        const propertyOwner = await db.select().from(users).where(eq(users.id, property.userId)).limit(1);
        if (!propertyOwner.length) {
            return res.status(404).json({ message: 'Property owner not found' });
        }

        const userName = propertyOwner[0].fullName || 'user';
        const userId = property.userId; // Use property owner's ID for folder structure

        const uploadedUrls: string[] = [];

        // Create proper folder structure: users/{userName}_{userId}/properties/{propertyUniqueId}/{docType}/
        const propertyFolder = getPropertyFolderPath(userName, userId, propertyUniqueId, folder || 'misc');

        for (const file of req.files) {
            const url = await uploadFile(file, propertyFolder);
            uploadedUrls.push(url);
        }

        console.log(`Files uploaded successfully by ${isAdmin ? 'admin' : 'owner'}: ${uploadedUrls.length} files`);
        return res.status(200).json({ urls: uploadedUrls });
    } catch (error) {
        console.error('Upload files error:', error);
        return res.status(500).json({ message: 'Failed to upload files' });
    }
};
