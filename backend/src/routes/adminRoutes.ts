import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/adminAuth';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// Debug route
router.get('/me', adminController.getCurrentUser);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/block', adminController.blockUser);
router.put('/users/:userId/unblock', adminController.unblockUser);
router.put('/users/verify', adminController.verifyUser);

// Property management
router.get('/properties', adminController.getAllProperties);
router.get('/properties/:uniqueId/details', adminController.getPropertyWithUserDetails);
router.put('/properties/:uniqueId/approve', adminController.approveProperty);
router.put('/properties/:uniqueId/reject', adminController.rejectProperty);
router.put('/properties/:uniqueId/revoke', adminController.revokePropertyApproval);

// Published properties management
router.get('/published-properties', adminController.getAllPublishedProperties);
router.get('/published-properties/:uniqueId', adminController.getPublishedProperty);
router.post('/published-properties/:uniqueId', adminController.createOrUpdatePublishedProperty);
router.post('/published-properties/:uniqueId/publish', adminController.publishPropertyLive);
router.post('/published-properties/:uniqueId/unpublish', adminController.unpublishProperty);

// Enquiries management
router.get('/enquiries/pending', adminController.getPendingEnquiries);
router.get('/enquiries/:uniqueId', adminController.getEnquiryDetails);
router.get('/enquiries', adminController.getAllEnquiries);
router.put('/enquiries/:uniqueId/status', adminController.updateEnquiryStatus);

export default router;
