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

  // Gemini API 서버 과부하
  if (err.message.includes('503') || err.message.includes('UNAVAILABLE')) {
    res.status(503).json({
      success: false,
      error: 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
      code: 'SERVICE_UNAVAILABLE',
    } satisfies ApiError);
    return;
  }

  console.error('[Server Error]', err.message, err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '서버 오류가 발생했습니다.' : err.message,
    code: 'INTERNAL_ERROR',
  } satisfies ApiError);
}
