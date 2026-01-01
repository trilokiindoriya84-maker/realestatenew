
import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// POST /api/v1/users/sync - Called after login/signup to ensure user exists in our DB
router.post('/sync', requireAuth, userController.syncUser);
router.get('/profile', requireAuth, userController.getProfile);

export default router;
