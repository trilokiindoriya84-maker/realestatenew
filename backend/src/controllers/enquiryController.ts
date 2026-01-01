import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as enquiryService from '../services/enquiryService';

export const createEnquiry = async (req: Request, res: Response): Promise<any> => {
    try {
        const { propertyUniqueId, name, mobile, message, userId } = req.body;

        if (!propertyUniqueId || !name || !mobile) {
            return res.status(400).json({ message: 'Property ID, name, and mobile are required' });
        }

        await enquiryService.createEnquiry({
            propertyUniqueId,
            name,
            mobile,
            message: message || '',
            userId: userId || null, // Optional - for logged-in users
        });

        return res.status(201).json({ success: true });
    } catch (error: any) {
        console.error('Create enquiry error:', error);
        return res.status(500).json({ message: 'Failed to submit enquiry' });
    }
};

export const getUserEnquiries = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const enquiries = await enquiryService.getUserEnquiries(userId);
        
        return res.status(200).json(enquiries);
    } catch (error: any) {
        console.error('Get user enquiries error:', error);
        return res.status(500).json({ message: 'Failed to fetch enquiries' });
    }
};
