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

  // Gemini API 할당량 초과
  if (err.message.includes('429')) {
    res.status(429).json({
      success: false,
      error: 'API 할당량 초과. 잠시 후 다시 시도해주세요.',
      code: 'RATE_LIMIT',
    } satisfies ApiError);
    return;
  }

  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.',
    code: 'INTERNAL_ERROR',
  } satisfies ApiError);
}
