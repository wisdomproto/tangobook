import { Router } from 'express';
import { getContentStatus } from '../services/content-status.service.js';

const router = Router();

// 저작도구 현황판·낱말 그래프·마스터 문서가 읽는다.
// `?fresh=1` = 캐시를 버리고 다시 센다 · `?rows=1` = 책별 목록까지 (마스터 문서용, 크다)
router.get('/', async (req, res, next) => {
  try {
    const data = await getContentStatus(req.query.fresh === '1', req.query.rows === '1');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
