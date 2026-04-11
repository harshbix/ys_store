import { Router } from 'express';
import authRoutes from '../modules/auth/routes.js';
import productRoutes from '../modules/products/routes.js';
import cartRoutes from '../modules/cart/routes.js';
import buildRoutes from '../modules/builds/routes.js';
import quoteRoutes from '../modules/quotes/routes.js';
import adminRoutes from '../modules/admin/routes.js';
import mediaRoutes from '../modules/media/routes.js';
import analyticsRoutes from '../modules/analytics/routes.js';
import seoRoutes from '../modules/seo/routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/builds', buildRoutes);
router.use('/quotes', quoteRoutes);
router.use('/admin', adminRoutes);
router.use('/media', mediaRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/seo', seoRoutes);

export default router;
