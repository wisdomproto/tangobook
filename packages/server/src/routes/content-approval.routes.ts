import { Router, type Request, type Response, type NextFunction } from 'express';
import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

/**
 * 저작 승인 상태 — editor2 콘텐츠 현황 모달의 유일한 수동 게이트.
 * R2 `_index/content-approval.json` = { bookId: { approvedAt: ISO } }.
 */
const router = Router();

const KEY = '_index/content-approval.json';
const BOOK_RE = /^\d{6,20}$/;

export type ApprovalMap = Record<string, { approvedAt: string }>;

export async function loadApprovals(): Promise<ApprovalMap> {
  try {
    const res = await axios.get<ApprovalMap>(`${r2PublicUrl}/${KEY}`, {
      timeout: 5000,
      params: { t: Date.now() },
    });
    return res.data && typeof res.data === 'object' ? res.data : {};
  } catch {
    return {};
  }
}

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
    if (approved) map[id] = { approvedAt: new Date().toISOString() };
    else delete map[id];
    await uploadJsonToR2({ ...map }, KEY);
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
});

export default router;
