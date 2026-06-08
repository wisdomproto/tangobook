import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { publishToMeta, type MetaPublishInput } from '../../services/mkt/publish.service.js';

/** POST /api/mkt/publish/meta  Body: MetaPublishInput (un-wired in this phase) */
export const metaPublish = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<MetaPublishInput>;
  if (!body.platform || !body.userId) throw new AppError(400, 'platform and userId are required');
  const data = await publishToMeta(body as MetaPublishInput);
  res.json({ success: true, data });
});
