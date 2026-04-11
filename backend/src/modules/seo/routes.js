import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  getBuildMarkdownController,
  getProductMarkdownController,
  getSitemapXmlController
} from './controller.js';
import { seoEntityParamsSchema } from './validator.js';

const router = Router();

router.get('/sitemap.xml', getSitemapXmlController);
router.get('/markdown/products/:id', validateRequest(seoEntityParamsSchema, 'params'), getProductMarkdownController);
router.get('/markdown/builds/:id', validateRequest(seoEntityParamsSchema, 'params'), getBuildMarkdownController);

export default router;
