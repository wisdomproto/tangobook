import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { config } from '../../config/index.js';
import { isValidGateCode, mintOwnerSession } from '../../services/mkt/gate.service.js';

/** POST /api/mkt/gate-login  Body: { code } → { success, data: { access_token, refresh_token } } */
export const gateLogin = asyncHandler(async (req: Request, res: Response) => {
  const code = (req.body?.code ?? '') as string;
  if (!isValidGateCode(code, config.mkt.gateCode)) {
    throw new AppError(401, '비밀번호가 올바르지 않습니다.');
  }
  const session = await mintOwnerSession();
  res.json({ success: true, data: session });
});
