import { Request, Response } from 'express';
import * as propertyService from '../services/propertyService';

export const getPublishedProperties = async (req: Request, res: Response): Promise<any> => {
    try {
        const { limit = '16', random = 'false' } = req.query;
        const isRandom = random === 'true';
        const properties = await propertyService.getPublishedPropertiesForPublic(parseInt(limit as string), isRandom);
        return res.status(200).json(properties);
    } catch (error) {
        console.error('Get published properties error:', error);
        return res.status(500).json({ message: 'Failed to fetch properties' });
    }
};

export const getPublishedPropertyDetail = async (req: Request, res: Response): Promise<any> => {
    try {
        const { uniqueId } = req.params;
        const property = await propertyService.getPublishedPropertyDetailByUniqueId(uniqueId);
        
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        return res.status(200).json(property);
    } catch (error) {
        console.error('Get published property detail error:', error);
        return res.status(500).json({ message: 'Failed to fetch property details' });
    }
};