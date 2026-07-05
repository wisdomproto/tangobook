import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  uploadBufferToR2,
  listR2Objects,
  deleteFromR2,
  r2PublicUrl,
} from '../providers/r2.provider.js';

/**
 * 학습만화 기획 자산(캐릭터 레퍼런스·컷 이미지) 저장 — 내부 저작 워크플로우용.
 * 문서의 붙여넣기 박스가 dataURL 로 POST → R2 `comic-assets/{docId}/{key}.{ext}` 업로드
 * → 공개 URL 로 즉시 표시. R2 저장이라 로컬/프로덕션 어디서 붙여넣어도 영구 보관되고
 *   Railway 재배포에도 유지된다(예전 로컬 파일시스템 방식은 프로덕션에서 유실됐음).
 * 고정 key 에 덮어쓰므로 immutable 대신 짧은 캐시 + 클라의 ?t= 캐시버스터로 최신 반영.
 */
const router = Router();

const SAFE = /^[a-z0-9-]{1,64}$/;
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const EXTS = ['png', 'jpg', 'webp'];
const CACHE = 'public, max-age=300'; // 재붙여넣기 시 최신 반영 위해 짧게

const prefixFor = (docId: string): string => `comic-assets/${docId}/`;
const keyFor = (docId: string, key: string, ext: string): string =>
  `comic-assets/${docId}/${key}.${ext}`;

router.get('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = String(req.params.docId ?? '');
    if (!SAFE.test(docId)) {
      res.status(400).json({ success: false, error: '잘못된 문서 ID' });
      return;
    }
    const objects = await listR2Objects(prefixFor(docId));
    const map: Record<string, string> = {};
    for (const obj of objects) {
      const objKey = obj.Key ?? '';
      const base = objKey.slice(prefixFor(docId).length); // {key}.{ext}
      const m = base.match(/^([a-z0-9-]+)\.(png|jpg|webp)$/);
      if (m) map[m[1]] = `${r2PublicUrl}/${objKey}`;
    }
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
});

router.post('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = String(req.params.docId ?? '');
    const { key, dataUrl } = (req.body ?? {}) as { key?: unknown; dataUrl?: unknown };
    const keyStr = String(key ?? '');
    if (!SAFE.test(docId) || !SAFE.test(keyStr)) {
      res.status(400).json({ success: false, error: '잘못된 docId/key' });
      return;
    }
    const m =
      typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
    if (!m) {
      res.status(400).json({ success: false, error: 'png/jpeg/webp dataURL 이 필요합니다' });
      return;
    }
    const mime = m[1];
    const ext = EXT_BY_MIME[mime];
    const buf = Buffer.from(m[2], 'base64');

    const url = await uploadBufferToR2(buf, keyFor(docId, keyStr, ext), mime, CACHE);
    // 같은 key 의 다른 확장자 잔재 제거 (png→jpg 교체 등)
    await Promise.all(
      EXTS.filter((e) => e !== ext).map((e) =>
        deleteFromR2(keyFor(docId, keyStr, e)).catch(() => {})
      )
    );
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:docId/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = String(req.params.docId ?? '');
    const key = String(req.params.key ?? '');
    if (!SAFE.test(docId) || !SAFE.test(key)) {
      res.status(400).json({ success: false, error: '잘못된 docId/key' });
      return;
    }
    await Promise.all(EXTS.map((e) => deleteFromR2(keyFor(docId, key, e)).catch(() => {})));
    res.json({ success: true, data: { deleted: key } });
  } catch (err) {
    next(err);
  }
});

export default router;
