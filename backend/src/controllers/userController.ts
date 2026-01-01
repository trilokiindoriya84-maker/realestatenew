
import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { AuthRequest } from '../middlewares/auth';

export const syncUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        // req.user is populated by the auth middleware (from Supabase token)
        const { id, email, user_metadata } = req.user;
        const fullName = user_metadata?.full_name;
        const role = user_metadata?.role || 'user'; // Fallback if not in metadata
        const phoneNumber = user_metadata?.phone_number;
        const avatarUrl = user_metadata?.avatar_url; // Extract Google profile picture

        await userService.syncUser(id, email!, fullName, role, phoneNumber, avatarUrl);

        // Return minimal response with no user data
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const user = await userService.getUserById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({ 
                message: 'You are blocked. Please contact administrator.',
                code: 'USER_BLOCKED'
            });
        }
        
        // Return minimal response with no user data
        return res.status(200).json({ 
            isVerified: user.isVerified,
            verificationStatus: user.verificationStatus,
            isBlocked: user.isBlocked
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
