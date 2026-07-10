// 공개 블로그 라우트 — 발행된 self_hosted 내부 블로그 외부 노출. 인증 없음.
import { Router } from 'express';
import { blogList, blogDetail } from '../controllers/mkt/blog-public.controller.js';

const router = Router();
router.get('/', blogList);
router.get('/:slug', blogDetail);

export default router;
