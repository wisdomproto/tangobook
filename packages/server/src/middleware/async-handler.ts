import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * try-catch + next(err) 보일러플레이트를 제거하는 래퍼.
 * 컨트롤러 핸들러를 감싸서 에러를 자동으로 errorMiddleware로 전달.
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * multer 파일 업로드 후 req.file 존재 여부를 검증하는 미들웨어.
 * 파일이 없으면 400 응답을 반환.
 */
export function requireFile(errorMsg = '파일이 없습니다.') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: errorMsg });
      return;
    }
    next();
  };
}
