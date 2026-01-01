import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import * as enquiryController from '../controllers/enquiryController';

const router = Router();

// Public route - anyone can submit enquiry
router.post('/', enquiryController.createEnquiry);

// Protected route - get user's own enquiries
router.get('/my-enquiries', requireAuth, enquiryController.getUserEnquiries);

export default router;
