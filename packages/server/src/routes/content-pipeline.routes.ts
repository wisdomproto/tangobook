import { Router, type Request, type Response, type NextFunction } from 'express';
import { getPipeline } from '../services/content-pipeline/content-pipeline.service.js';

/**
 * 콘텐츠 파이프라인 조회 API (직원용 — editor2 콘텐츠 현황 모달).
 * GET /api/content-pipeline/authoring — 저작 완성도만.
 * 🔴 marketing 필드는 서버에서 strip (직원 화면에 마케팅 비노출 요구 — 클라 필터 아님).
 * 전체(rows+todos)는 대표용 GET /api/mkt/pipeline.
 */
const router = Router();

router.get('/authoring', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refresh = req.query.refresh === '1';
    const { rows, generatedAt } = await getPipeline(refresh);
    const authoringRows = rows.map(({ marketing: _marketing, ...rest }) => rest);
    res.json({ success: true, data: { rows: authoringRows, generatedAt } });
  } catch (err) {
    next(err);
  }
});

export default router;
