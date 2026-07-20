import { Router, type Request, type Response, type NextFunction } from 'express';
import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

/**
 * 생활동화 회차 제작 상태(완성/진행 중) 저장 — 내부 저작 워크플로우용.
 * 기획서(saenghwal-plan.html) 좌측 사이드바가 체크한 상태를 R2 JSON 한 곳에 보관 →
 * 어느 브라우저·기기에서도 공유. R2 `_index/saenghwal-status.json` = { docId: 'wip'|'done' }.
 */
const router = Router();

const STATUS_KEY = '_index/saenghwal-status.json';
const DOC_RE = /^[A-Za-z0-9-]{1,64}$/; // 대소문자 허용 (yuchiwon-Y01 등 대문자 docId 지원)
type Status = 'wip' | 'done';
type StatusMap = Record<string, Status>;

async function load(): Promise<StatusMap> {
  try {
    const res = await axios.get<StatusMap>(`${r2PublicUrl}/${STATUS_KEY}`, { timeout: 5000 });
    return res.data && typeof res.data === 'object' ? res.data : {};
  } catch {
    return {};
  }
}

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await load() });
  } catch (err) {
    next(err);
  }
});

// body: { docId, status }  — status='wip'|'done' 설정, 그 외(null/'')이면 해제
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { docId, status } = (req.body ?? {}) as { docId?: unknown; status?: unknown };
    const id = String(docId ?? '');
    if (!DOC_RE.test(id)) {
      res.status(400).json({ success: false, error: '잘못된 docId' });
      return;
    }
    const map = await load();
    if (status === 'wip' || status === 'done') map[id] = status;
    else delete map[id];
    await uploadJsonToR2({ ...map }, STATUS_KEY);
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
});

export default router;
