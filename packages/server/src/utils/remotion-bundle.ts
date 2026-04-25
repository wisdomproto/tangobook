// Remotion 번들/렌더 공용 유틸 — book-v2 오디오북 렌더에서 사용.
// v1 audiobook.service의 loadRemotion/getBundlePath와 동일한 패턴.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadRemotion() {
  const [bundler, renderer] = await Promise.all([
    import('@remotion/bundler'),
    import('@remotion/renderer'),
  ]);
  return {
    bundle: bundler.bundle,
    renderMedia: renderer.renderMedia,
    selectComposition: renderer.selectComposition,
  };
}

let cachedBundlePath: string | null = null;

/**
 * Remotion entry 번들 경로 (캐시).
 * Dev: __dirname=packages/server/src/utils → ../../../remotion/src/entry.ts
 * Prod: 절대 경로 /app/packages/remotion/src/entry.ts
 */
export async function getRemotionBundlePath(): Promise<string> {
  const isDev = process.env.NODE_ENV !== 'production';
  if (!isDev && cachedBundlePath && fs.existsSync(cachedBundlePath)) {
    return cachedBundlePath;
  }
  const { bundle } = await loadRemotion();
  const entry = isDev
    ? path.resolve(__dirname, '../../../remotion/src/entry.ts')
    : path.resolve('/app/packages/remotion/src/entry.ts');
  console.log('[remotion-bundle] entry:', entry);
  cachedBundlePath = await bundle({ entryPoint: entry });
  return cachedBundlePath;
}
