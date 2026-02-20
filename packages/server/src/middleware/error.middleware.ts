import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@tangobook/shared';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const response: ApiError = {
      success: false,
      error: err.message,
      code: err.code,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Google API 에러 (status 속성이 있는 경우) → 상태코드와 메시지 그대로 전달
  const apiStatus = (err as unknown as Record<string, unknown>).status;
  if (typeof apiStatus === 'number' && apiStatus >= 400) {
    console.error(`[Google API ${apiStatus}]`, err.message);
    res.status(apiStatus).json({
      success: false,
      error: err.message,
      code: `GOOGLE_API_${apiStatus}`,
    } satisfies ApiError);
    return;
  }

  console.error('[Server Error]', err.message, err.stack);
  res.status(500).json({
    success: false,
    error: err.message || '서버 오류가 발생했습니다.',
    code: 'INTERNAL_ERROR',
  } satisfies ApiError);
}
