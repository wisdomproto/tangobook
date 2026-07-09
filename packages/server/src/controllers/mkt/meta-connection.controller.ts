import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { getConnectionPublic, deleteConnection } from '../../services/mkt/meta-connection.store.js';

/** GET /api/mkt/meta/connection — 공개 연동 상태(토큰 제외). */
export const metaConnection = asyncHandler(async (_req: Request, res: Response) => {
  const status = await getConnectionPublic();
  res.json({ success: true, ...status });
});

/** DELETE /api/mkt/meta/connection — 연동 해제(저장된 암호화 토큰 삭제). */
export const metaDisconnect = asyncHandler(async (_req: Request, res: Response) => {
  await deleteConnection();
  res.json({ success: true });
});
