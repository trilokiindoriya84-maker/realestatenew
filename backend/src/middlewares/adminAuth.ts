import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import * as userService from '../services/userService';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const ADMIN_EMAIL = 'trilokiindoriya@gmail.com';
        const user = await userService.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isAdmin = user.role === 'admin' || user.email === ADMIN_EMAIL;
        
        if (!isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.user.dbUser = user;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};