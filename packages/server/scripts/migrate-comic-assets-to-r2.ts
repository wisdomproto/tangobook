/**
 * 일회성 마이그레이션 — 로컬 파일시스템의 학습만화 자산을 R2 로 이전.
 * packages/client/public/comic-assets/{docId}/{key}.{ext}
 *   → R2 key `comic-assets/{docId}/{key}.{ext}`
 *
 * 실행: pnpm --filter server exec tsx scripts/migrate-comic-assets-to-r2.ts
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { uploadBufferToR2 } from '../src/providers/r2.provider.js';

const ROOT = path.resolve(process.cwd(), '..', 'client', 'public', 'comic-assets');
const CACHE = 'public, max-age=300';
const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

async function main() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true }).catch(() => null);
  if (!entries) {
    console.warn('comic-assets 폴더 없음 — 이전할 것 없음:', ROOT);
    return;
  }
  const docIds = entries.filter((d) => d.isDirectory()).map((d) => d.name);

  let uploaded = 0;
  for (const docId of docIds) {
    const dir = path.join(ROOT, docId);
    const files = await fs.readdir(dir);
    for (const f of files) {
      const m = f.match(/^([a-z0-9-]+)\.(png|jpg|jpeg|webp)$/i);
      if (!m) {
        console.warn('건너뜀(형식 불일치):', docId, f);
        continue;
      }
      const ext = m[2].toLowerCase() === 'jpeg' ? 'jpg' : m[2].toLowerCase();
      const r2Key = `comic-assets/${docId}/${m[1]}.${ext}`;
      const buf = await fs.readFile(path.join(dir, f));
      const url = await uploadBufferToR2(buf, r2Key, MIME[m[2].toLowerCase()], CACHE);
      uploaded++;
      console.warn('✓', r2Key, '→', url);
    }
  }
  console.warn(`\n완료 — ${uploaded}개 파일 R2 업로드.`);
}

main().catch((e) => {
  console.error('마이그레이션 실패:', e);
  process.exit(1);
});
