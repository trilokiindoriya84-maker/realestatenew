import { Router } from 'express';
import userRoutes from './userRoutes';
import propertyRoutes from './propertyRoutes';
import adminRoutes from './adminRoutes';
import verificationRoutes from './verificationRoutes';
import publicRoutes from './publicRoutes';
import savedPropertyRoutes from './savedPropertyRoutes';
import enquiryRoutes from './enquiryRoutes';
import searchRoutes from './searchRoutes';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

router.use('/users', userRoutes);
router.use('/properties', propertyRoutes);
router.use('/admin', adminRoutes);
router.use('/verification', verificationRoutes);
router.use('/public', publicRoutes);
router.use('/saved-properties', savedPropertyRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/search', searchRoutes);

export default router;
