#!/usr/bin/env node
/**
 * 모기 이북 mp4 렌더 — MosquitoEbookComposition 을 언어별로 renderMedia.
 * 출력: packages/server/out/모기_{lang}.mp4
 * 실행: pnpm --filter @tangobook/server exec tsx scripts/mosquito-render.ts [--lang=ko,ja]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRemotionBundlePath, loadRemotion } from '../src/utils/remotion-bundle.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const flag = (k: string, d: string): string => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : d;
};
const LANGS = flag('lang', 'ko,ja').split(',');

const outDir = path.join(__dirname, '..', 'out');
fs.mkdirSync(outDir, { recursive: true });

console.log('[render] bundling Remotion entry...');
const bundlePath = await getRemotionBundlePath();
const { selectComposition, renderMedia } = await loadRemotion();
const chromiumPath = process.env.CHROMIUM_PATH || undefined;
console.log('[render] browser:', chromiumPath || 'default');

for (const lang of LANGS) {
  console.log(`[render] ${lang}: selecting composition...`);
  const inputProps = { lang, debugCoords: false };
  const composition = await selectComposition({
    serveUrl: bundlePath,
    id: 'MosquitoEbook',
    inputProps,
  });
  const out = path.join(outDir, `모기_${lang}.mp4`);
  let last = -1;
  await renderMedia({
    composition,
    serveUrl: bundlePath,
    codec: 'h264',
    outputLocation: out,
    inputProps,
    ...(chromiumPath ? { browserExecutable: chromiumPath } : {}),
    chromiumOptions: { gl: 'angle' as const, headless: true },
    onProgress: ({ progress }: { progress: number }) => {
      const pct = Math.round(progress * 100);
      if (pct !== last && pct % 10 === 0) {
        console.log(`  ${lang} ${pct}%`);
        last = pct;
      }
    },
  });
  const sec = Math.round(composition.durationInFrames / composition.fps);
  console.log(`✅ ${out}  (${composition.durationInFrames}f / ${sec}s)`);
}
console.log('\n완료.');
