import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import * as savedPropertyController from '../controllers/savedPropertyController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Save a property
router.post('/', savedPropertyController.saveProperty);

// Unsave a property
router.delete('/:propertyUniqueId', savedPropertyController.unsaveProperty);

// Get all saved properties
router.get('/', savedPropertyController.getSavedProperties);

// Get saved property IDs only (for save state checking)
router.get('/ids', savedPropertyController.getSavedPropertyIds);

// Check if property is saved
router.get('/check/:propertyUniqueId', savedPropertyController.checkIfSaved);

export default router;
