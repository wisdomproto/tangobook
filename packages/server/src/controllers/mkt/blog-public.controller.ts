import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listPublishedBlogs, getPublishedBlog } from '../../services/mkt/blog-public.service.js';

/** GET /api/blog?lang= — 발행된 자체 블로그 목록(공개). lang 미지정=ko. */
export const blogList = asyncHandler(async (req: Request, res: Response) => {
  const posts = await listPublishedBlogs(String(req.query.lang || 'ko'));
  res.json({ success: true, data: posts });
});

/** GET /api/blog/:slug?lang= — 발행된 자체 블로그 1건(공개). 미발행/없음 → 404. */
export const blogDetail = asyncHandler(async (req: Request, res: Response) => {
  const post = await getPublishedBlog(String(req.params.slug), String(req.query.lang || 'ko'));
  if (!post) {
    res.status(404).json({ success: false, error: '블로그를 찾을 수 없습니다.' });
    return;
  }
  res.json({ success: true, data: post });
});
