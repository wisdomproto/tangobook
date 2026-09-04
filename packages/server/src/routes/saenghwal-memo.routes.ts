import { Router, type Request, type Response, type NextFunction } from 'express';
import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

/**
 * 생활동화 회차별 메모 저장 — 내부 저작 워크플로우용.
 * 기획서 좌측 사이드바에서 회차별로 남긴 메모를 R2 JSON 한 곳에 보관(공유·영구).
 * R2 `_index/saenghwal-memo.json` = { docId: memoText }.
 */
const router = Router();

const MEMO_KEY = '_index/saenghwal-memo.json';
const DOC_RE = /^[A-Za-z0-9-]{1,64}$/; // 대소문자 허용 (yuchiwon-Y01 등 대문자 docId 지원)
// 🔴 2026-09-04: 4000 → 20만. 브랜딩/마스터 문서 메모를 길게 쓰기로 했다(사용자).
//    완전 무제한으로 두지 않는 이유 = 이 저장소가 **JSON 파일 하나**라서, 실수로 붙여넣은
//    한 덩어리가 다른 기획서 메모까지 같이 무겁게 만든다. 산문으로는 사실상 제한이 없는 값.
const MAX_LEN = 200_000;
type MemoMap = Record<string, string>;

async function load(): Promise<MemoMap> {
  try {
    const res = await axios.get<MemoMap>(`${r2PublicUrl}/${MEMO_KEY}`, { timeout: 5000 });
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

// body: { docId, memo } — 빈 문자열/공백이면 해제(삭제)
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { docId, memo } = (req.body ?? {}) as { docId?: unknown; memo?: unknown };
    const id = String(docId ?? '');
    if (!DOC_RE.test(id)) {
      res.status(400).json({ success: false, error: '잘못된 docId' });
      return;
    }
    const text = typeof memo === 'string' ? memo.slice(0, MAX_LEN) : '';
    const map = await load();
    if (text.trim()) map[id] = text;
    else delete map[id];
    await uploadJsonToR2({ ...map }, MEMO_KEY);
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
});

export default router;
