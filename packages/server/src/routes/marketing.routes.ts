import { Router } from 'express';
import { MarketingController } from '../controllers/marketing.controller.js';

const router = Router();

router.post('/blog/generate', MarketingController.generateBlog);
router.post('/blog/generate-config', MarketingController.generateBlogConfig);
router.post('/blog/regenerate-section', MarketingController.regenerateBlogSection);
router.get('/blog/search-keywords', MarketingController.searchKeywords);
router.post('/card-news/generate', MarketingController.generateCardNews);

export default router;
