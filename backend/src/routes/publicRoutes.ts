import { Router } from 'express';
import * as publicController from '../controllers/publicController';

const router = Router();

// Public routes (no authentication required)
router.get('/published-properties', publicController.getPublishedProperties);
router.get('/published-properties/:uniqueId', publicController.getPublishedPropertyDetail);

export default router;