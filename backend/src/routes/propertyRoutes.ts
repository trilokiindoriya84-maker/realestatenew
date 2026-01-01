import { Router } from 'express';
import * as propertyController from '../controllers/propertyController';
import { requireAuth } from '../middlewares/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// User property routes (protected)
router.post('/', requireAuth, propertyController.createProperty);
router.put('/:uniqueId', requireAuth, propertyController.updateProperty);
router.post('/:uniqueId/submit', requireAuth, propertyController.submitProperty);
router.get('/my-properties', requireAuth, propertyController.getMyProperties);
router.get('/:uniqueId', requireAuth, propertyController.getPropertyByUniqueId);
router.delete('/:uniqueId', requireAuth, propertyController.deleteProperty);

// Edit route: Get property by uniqueId with ownership check (protected)
router.get('/edit/:uniqueId', requireAuth, propertyController.getPropertyForEdit);

// SEO-friendly route: Get property by uniqueId (public - for viewing)
router.get('/view/:uniqueId', propertyController.getPropertyByUniqueId);

// File upload route - allow both user and admin access
router.post('/upload', requireAuth, upload.array('files', 10), propertyController.uploadPropertyFiles);

// Admin file upload route (alternative endpoint for admin panel)
router.post('/admin-upload', requireAuth, upload.array('files', 10), propertyController.uploadPropertyFiles);

export default router;
