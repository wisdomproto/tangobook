import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { listFeedback } from '../../services/mkt/feedback.service.js';

/** GET /api/mkt/feedback → { items: FeedbackItem[] } (운영자 열람, service-role) */
export const feedbackList = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listFeedback();
  res.json({ success: true, data: { items } });
});
