import { Router, type Request, type Response, type NextFunction } from 'express';
import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

/**
 * 창작동화 회차 본문 오버레이 — 저작 워크플로우용.
 * 개별 책 HTML(SSOT)은 그대로 두고, 브라우저에서 고친 쪽 본문만 R2 에 얹어 배포판에서도 저장된다.
 * 🔴 오버레이는 editor2 연동 스크립트(HTML 파싱)에는 반영되지 않는다 — 화면 표시 전용.
 * R2 `changjak-text/<docId>.json` = { "p1": text, "p2": text, ... }.
 */
const router = Router();

const DOC_RE = /^[a-z][a-z0-9-]{0,32}$/; // 책 슬러그 (a02, e120 …) + 시리즈 회차 (pongi-01 …)
const PAGE_RE = /^p\d{1,3}$/;
const MAX_LEN = 8000; // 한 쪽 본문 상한
type TextMap = Record<string, string>;

const keyOf = (docId: string) => `changjak-text/${docId}.json`;

async function load(docId: string): Promise<TextMap> {
  try {
    const res = await axios.get<TextMap>(`${r2PublicUrl}/${keyOf(docId)}?t=${Date.now()}`, {
      timeout: 5000,
    });
    return res.data && typeof res.data === 'object' ? res.data : {};
  } catch {
    return {};
  }
}

router.get('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.docId ?? '');
    if (!DOC_RE.test(id)) {
      res.status(400).json({ success: false, error: '잘못된 docId' });
      return;
    }
    res.json({ success: true, data: await load(id) });
  } catch (err) {
    next(err);
  }
});

// body: { page, text } — 빈 문자열/공백이면 그 쪽 오버레이 해제(원본으로 복귀)
router.put('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.docId ?? '');
    if (!DOC_RE.test(id)) {
      res.status(400).json({ success: false, error: '잘못된 docId' });
      return;
    }
    const { page, text } = (req.body ?? {}) as { page?: unknown; text?: unknown };
    const p = String(page ?? '');
    if (!PAGE_RE.test(p)) {
      res.status(400).json({ success: false, error: '잘못된 page' });
      return;
    }
    const value = typeof text === 'string' ? text.slice(0, MAX_LEN) : '';
    const map = await load(id);
    if (value.trim()) map[p] = value;
    else delete map[p];
    await uploadJsonToR2({ ...map }, keyOf(id));
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
});

export default router;
