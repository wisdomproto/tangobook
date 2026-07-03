import { Router, type Request, type Response, type NextFunction } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * 학습만화 콘티 리뷰 피드백 — 기획서/에피소드 HTML 의 쪽별 수정 지시를 저장.
 * 내부 저작 워크플로우용(로컬 dev): 사용자가 문서 우측 패널에 적고 저장하면
 * Claude 가 이 JSON 을 읽어 콘티에 반영한다.
 * 저장 위치: docs/comics/feedback/{docId}.json — { pages: { "21": "지시…" } }
 */
const router = Router();

const FEEDBACK_DIR = path.resolve(process.cwd(), '..', '..', 'docs', 'comics', 'feedback');

function safeDocId(raw: string): string | null {
  return /^[a-z0-9-]{1,64}$/.test(raw) ? raw : null;
}

async function readDoc(docId: string): Promise<{ pages: Record<string, string> }> {
  try {
    const buf = await fs.readFile(path.join(FEEDBACK_DIR, `${docId}.json`), 'utf8');
    const json = JSON.parse(buf) as { pages?: Record<string, string> };
    return { pages: json.pages ?? {} };
  } catch {
    return { pages: {} };
  }
}

router.get('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = safeDocId(String(req.params.docId ?? ''));
    if (!docId) {
      res.status(400).json({ success: false, error: '잘못된 문서 ID' });
      return;
    }
    res.json({ success: true, data: await readDoc(docId) });
  } catch (err) {
    next(err);
  }
});

router.post('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = safeDocId(String(req.params.docId ?? ''));
    if (!docId) {
      res.status(400).json({ success: false, error: '잘못된 문서 ID' });
      return;
    }
    const { page, note } = (req.body ?? {}) as { page?: unknown; note?: unknown };
    const pageKey = String(page ?? '').trim();
    if (!/^\d{1,3}$/.test(pageKey) || typeof note !== 'string') {
      res.status(400).json({ success: false, error: 'page(숫자)/note(문자열)가 필요합니다' });
      return;
    }
    const doc = await readDoc(docId);
    if (note.trim() === '') delete doc.pages[pageKey];
    else doc.pages[pageKey] = note.trim();

    await fs.mkdir(FEEDBACK_DIR, { recursive: true });
    await fs.writeFile(
      path.join(FEEDBACK_DIR, `${docId}.json`),
      JSON.stringify({ updatedAt: new Date().toISOString(), pages: doc.pages }, null, 2),
      'utf8'
    );
    res.json({ success: true, data: { saved: pageKey, total: Object.keys(doc.pages).length } });
  } catch (err) {
    next(err);
  }
});

export default router;
