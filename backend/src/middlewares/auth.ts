
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import * as userService from '../services/userService';

export interface AuthRequest extends Request {
    user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Check if user is blocked
        const dbUser = await userService.getUserById(user.id);
        if (dbUser && dbUser.isBlocked) {
            return res.status(403).json({ 
                message: 'You are blocked. Please contact administrator.',
                code: 'USER_BLOCKED'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ message: 'Authentication error' });
    }
};
