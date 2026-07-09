import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { publishToMeta, type MetaPublishInput } from '../../services/mkt/publish.service.js';
import { publishRecord, deleteChannelPost } from '../../services/mkt/publish-executor.service.js';

/** POST /api/mkt/publish/meta  Body: MetaPublishInput (legacy direct publish — 발행 실행기로 대체됨) */
export const metaPublish = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<MetaPublishInput>;
  if (!body.platform || !body.userId) throw new AppError(400, 'platform and userId are required');
  const data = await publishToMeta(body as MetaPublishInput);
  res.json({ success: true, data });
});

/** POST /api/mkt/publish/run  Body: { recordId } — 발행 레코드 1건 즉시 발행(수동·자동 공용 실행기). */
export const publishRun = asyncHandler(async (req: Request, res: Response) => {
  const recordId = String((req.body ?? {}).recordId || '');
  if (!recordId) throw new AppError(400, 'recordId is required');
  const result = await publishRecord(recordId);
  if (!result.ok) throw new AppError(400, result.error || '발행 실패');
  res.json({ success: true, postId: result.postId ?? '' });
});

/** POST /api/mkt/publish/delete-post  Body: { recordId } — 발행된 채널 게시물 삭제(FB만). */
export const publishDeletePost = asyncHandler(async (req: Request, res: Response) => {
  const recordId = String((req.body ?? {}).recordId || '');
  if (!recordId) throw new AppError(400, 'recordId is required');
  const result = await deleteChannelPost(recordId);
  if (!result.ok) throw new AppError(400, result.error || '게시물 삭제 실패');
  res.json({ success: true });
});
