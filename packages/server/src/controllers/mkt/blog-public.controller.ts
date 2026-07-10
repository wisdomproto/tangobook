import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listPublishedBlogs, getPublishedBlog } from '../../services/mkt/blog-public.service.js';

/** GET /api/blog — 발행된 자체 블로그 목록(공개). */
export const blogList = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await listPublishedBlogs();
  res.json({ success: true, data: posts });
});

/** GET /api/blog/:slug — 발행된 자체 블로그 1건(공개). 미발행/없음 → 404. */
export const blogDetail = asyncHandler(async (req: Request, res: Response) => {
  const post = await getPublishedBlog(String(req.params.slug));
  if (!post) {
    res.status(404).json({ success: false, error: '블로그를 찾을 수 없습니다.' });
    return;
  }
  res.json({ success: true, data: post });
});
