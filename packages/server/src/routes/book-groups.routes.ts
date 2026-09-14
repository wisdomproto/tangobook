import { Router, type Request, type Response, type NextFunction } from 'express';
import axios from 'axios';
import { sanitizeBookGroups, type BookGroupsDoc } from '@tangobook/shared';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

/**
 * 동화책 그룹 — R2 `_index/book-groups.json` 한 곳.
 * 🔴 library-config 에 안 넣은 이유: 그 저장소는 필드를 화이트리스트로 걸러 저장해서
 *    거기 끼워 넣으면 다른 화면이 설정을 저장할 때 그룹이 조용히 지워진다.
 */
const router = Router();
const KEY = '_index/book-groups.json';

async function load(): Promise<BookGroupsDoc> {
  try {
    // 공개 URL 은 CDN 캐시를 탈 수 있어 저장 직후 옛 값이 온다 — 쿼리로 캐시를 비켜 간다.
    const res = await axios.get(`${r2PublicUrl}/${KEY}?t=${Date.now()}`, { timeout: 5000 });
    return { ...sanitizeBookGroups(res.data), updatedAt: res.data?.updatedAt };
  } catch {
    return { groups: [] };
  }
}

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await load() });
  } catch (err) {
    next(err);
  }
});

// body: BookGroupsDoc — 통째로 덮는다(편집 화면이 전체를 들고 있다).
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc: BookGroupsDoc = {
      ...sanitizeBookGroups(req.body),
      updatedAt: new Date().toISOString(),
    };
    await uploadJsonToR2(doc, KEY);
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;
