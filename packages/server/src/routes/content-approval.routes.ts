import { Router, type Request, type Response, type NextFunction } from 'express';
import { loadApprovals, saveApprovals } from '../services/content-pipeline/approval-store.js';
import { R2Repository } from '../repositories/r2.repository.js';
import {
  syncStorybookMarketingSource,
  updateStorybookMarketingSourceState,
} from '../services/marketing-source.service.js';

/**
 * 저작 승인 API — editor2 콘텐츠 현황 모달의 유일한 수동 게이트.
 * R2 저장/조회 로직은 services/content-pipeline/approval-store 에 위임.
 */
const router = Router();

const BOOK_RE = /^\d{6,20}$/; // storybook id (숫자만 — phonics 제외)

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await loadApprovals() });
  } catch (err) {
    next(err);
  }
});

// body: { bookId, approved: boolean } — approved=true 승인, false 해제
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId, approved } = (req.body ?? {}) as { bookId?: unknown; approved?: unknown };
    const id = String(bookId ?? '');
    if (!BOOK_RE.test(id)) {
      res.status(400).json({ success: false, error: '잘못된 bookId' });
      return;
    }
    const map = await loadApprovals();
    let marketingSync: { synced?: boolean; updated?: boolean } = {};
    if (approved === true) {
      const storybook = await R2Repository.getStorybook(id);
      if (!storybook) {
        res.status(404).json({ success: false, error: '동화책을 찾을 수 없습니다.' });
        return;
      }
      marketingSync = await syncStorybookMarketingSource(storybook, 'approved');
      map[id] = { approvedAt: new Date().toISOString() };
    } else {
      marketingSync = await updateStorybookMarketingSourceState(id, 'unapproved');
      delete map[id];
    }
    await saveApprovals(map);
    res.json({ success: true, data: map, marketingSync });
  } catch (err) {
    next(err);
  }
});

export default router;
