
import { Router } from 'express';
import { upload } from '../middlewares/upload';
import * as verificationController from '../controllers/verificationController';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/adminAuth';

const router = Router();

// User routes
router.post('/submit',
    requireAuth,
    upload.fields([
        { name: 'photo', maxCount: 1 },
        { name: 'aadharFront', maxCount: 1 },
        { name: 'aadharBack', maxCount: 1 },
        { name: 'panCard', maxCount: 1 }
    ]),
    verificationController.submitVerification
);

router.get('/status', requireAuth, verificationController.getVerificationStatus);

// Admin routes
router.get('/requests', requireAuth, requireAdmin, verificationController.getAllVerificationRequests);
router.post('/action', requireAuth, requireAdmin, verificationController.updateVerificationStatus);

export default router;
