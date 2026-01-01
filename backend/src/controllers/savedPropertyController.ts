import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as savedPropertyService from '../services/savedPropertyService';

export const saveProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        const { propertyUniqueId } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!propertyUniqueId) {
            return res.status(400).json({ message: 'Property ID is required' });
        }

        const result = await savedPropertyService.saveProperty(userId, propertyUniqueId);
        
        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        // Return minimal response with no data
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Save property error:', error);
        return res.status(500).json({ message: 'Failed to save property' });
    }
};

export const unsaveProperty = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        const { propertyUniqueId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await savedPropertyService.unsaveProperty(userId, propertyUniqueId);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Unsave property error:', error);
        return res.status(500).json({ message: 'Failed to unsave property' });
    }
};

export const getSavedProperties = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const properties = await savedPropertyService.getSavedProperties(userId);
        
        // Return full property data
        return res.status(200).json(properties);
    } catch (error) {
        console.error('Get saved properties error:', error);
        return res.status(500).json({ message: 'Failed to fetch saved properties' });
    }
};

export const getSavedPropertyIds = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const properties = await savedPropertyService.getSavedProperties(userId);
        
        // Return only property IDs for save state checking
        const propertyIds = properties.map((p: any) => p.uniqueId);
        return res.status(200).json(propertyIds);
    } catch (error) {
        console.error('Get saved property IDs error:', error);
        return res.status(500).json({ message: 'Failed to fetch saved property IDs' });
    }
};

export const checkIfSaved = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;
        const { propertyUniqueId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const isSaved = await savedPropertyService.checkIfSaved(userId, propertyUniqueId);
        return res.status(200).json({ isSaved });
    } catch (error) {
        console.error('Check if saved error:', error);
        return res.status(500).json({ message: 'Failed to check saved status' });
    }
};
