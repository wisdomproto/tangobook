import { Router, type Request, type Response, type NextFunction } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * 학습만화 기획 자산(캐릭터 레퍼런스·컷 이미지) 저장 — 내부 저작 워크플로우용.
 * 문서의 붙여넣기 박스가 dataURL 로 POST → public/comic-assets/{docId}/{key}.{ext} 저장
 * → 정적 URL 로 즉시 표시(새로고침 유지). Claude 도 파일로 열람 가능.
 */
const router = Router();

const ASSET_DIR = path.resolve(
  process.cwd(),
  '..',
  '..',
  'packages',
  'client',
  'public',
  'comic-assets'
);

const SAFE = /^[a-z0-9-]{1,64}$/;
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

router.get('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = String(req.params.docId ?? '');
    if (!SAFE.test(docId)) {
      res.status(400).json({ success: false, error: '잘못된 문서 ID' });
      return;
    }
    let files: string[] = [];
    try {
      files = await fs.readdir(path.join(ASSET_DIR, docId));
    } catch {
      /* 폴더 없음 = 자산 없음 */
    }
    const map: Record<string, string> = {};
    for (const f of files) {
      const m = f.match(/^([a-z0-9-]+)\.(png|jpg|webp)$/);
      // 캐시버스터로 mtime 대신 파일명 고정 + 저장 시각 쿼리는 클라가 붙임
      if (m) map[m[1]] = `/comic-assets/${docId}/${f}`;
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
    const ext = EXT_BY_MIME[m[1]];
    const buf = Buffer.from(m[2], 'base64');

    const dir = path.join(ASSET_DIR, docId);
    await fs.mkdir(dir, { recursive: true });
    // 같은 key 의 다른 확장자 잔재 제거 (png→jpg 교체 등)
    for (const e of ['png', 'jpg', 'webp']) {
      if (e !== ext) await fs.rm(path.join(dir, `${keyStr}.${e}`), { force: true });
    }
    await fs.writeFile(path.join(dir, `${keyStr}.${ext}`), buf);
    res.json({ success: true, data: { url: `/comic-assets/${docId}/${keyStr}.${ext}` } });
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
    const dir = path.join(ASSET_DIR, docId);
    for (const e of ['png', 'jpg', 'webp']) {
      await fs.rm(path.join(dir, `${key}.${e}`), { force: true });
    }
    res.json({ success: true, data: { deleted: key } });
  } catch (err) {
    next(err);
  }
});

export default router;
