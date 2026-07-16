// 자연관찰 릴스 배치 렌더 — NatureReel(Remotion) 렌더 + R2 업로드 + 마케팅 인스타 행 연결.
// 명작 릴스(render-book-reels.ts, StorybookReel)와 별개. 씬 레이아웃은 공용 StoryScene(수정본) 사용.
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/render-nature-reels.ts --dry-run
//   pnpm --filter @tangobook/server exec tsx scripts/render-nature-reels.ts --books=id1,id2
//   pnpm --filter @tangobook/server exec tsx scripts/render-nature-reels.ts            # 전 자연관찰
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveNatureBookIds,
  fetchStorybook,
  loadStoryboard,
  loadNatureReelCaptions,
  loadCleanCover,
  resolveSeriesCovers,
} from '../src/services/reel/reel-targets.js';
import { buildNatureReelProps } from '../src/services/reel/nature-reel-props.js';
import {
  resolveOwnerUserId,
  resolveMarketingTarget,
  uploadReelMp4,
  uploadThumbnail,
  connectReelToMarketing,
} from '../src/services/reel/reel-publish.js';

async function loadRemotion() {
  const [bundler, renderer] = await Promise.all([
    import('@remotion/bundler'),
    import('@remotion/renderer'),
  ]);
  return {
    bundle: bundler.bundle,
    renderMedia: renderer.renderMedia,
    renderStill: renderer.renderStill,
    selectComposition: renderer.selectComposition,
  };
}

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string) => {
  const a = argv.find((x) => x.startsWith(`${f}=`));
  return a ? a.split('=').slice(1).join('=') : undefined;
};
const DRY = has('--dry-run');
const OWNER = val('--owner-email') || 'kil210@gmail.com';
const BOOK = val('--book');
const BOOKS = val('--books');

async function main() {
  const { bundle, selectComposition, renderMedia, renderStill } = await loadRemotion();
  const entry = path.resolve(process.cwd(), '../remotion/src/entry.ts');
  console.log('[render-nature-reels] bundling:', entry);
  const serveUrl = await bundle({ entryPoint: entry });

  const ids = BOOKS
    ? BOOKS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : BOOK
      ? [BOOK]
      : resolveNatureBookIds();
  console.log(`[render-nature-reels] 대상 ${ids.length}권${DRY ? ' · DRY' : ''}`);

  const series = await resolveSeriesCovers();
  let ownerUserId = '';
  if (!DRY) ownerUserId = await resolveOwnerUserId(OWNER);

  const browserOpts = {
    ...(process.env.CHROMIUM_PATH ? { browserExecutable: process.env.CHROMIUM_PATH } : {}),
    chromiumOptions: { gl: 'angle' as const, headless: true },
  };
  const outDir = path.resolve(process.cwd(), 'out/reels');
  fs.mkdirSync(outDir, { recursive: true });

  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    try {
      const storybook = await fetchStorybook(id);
      const storyboard = loadStoryboard(id);
      const props = buildNatureReelProps({
        storybook,
        storyboard,
        captions: loadNatureReelCaptions(id),
        seriesCovers: series.covers,
        seriesLabels: series.labels,
      });
      if (!props) {
        console.log(`  - [${i + 1}/${ids.length}] ${id} SKIP (nature props 불가)`);
        skip++;
        continue;
      }

      // 영상
      const comp = await selectComposition({
        serveUrl,
        id: 'NatureReel',
        inputProps: props,
        timeoutInMilliseconds: 60000,
        ...browserOpts,
      });
      const outPath = path.join(outDir, `${id}-nature.mp4`);
      await renderMedia({
        composition: comp,
        serveUrl,
        codec: 'h264',
        imageFormat: 'png',
        outputLocation: outPath,
        inputProps: props,
        timeoutInMilliseconds: 120000,
        ...browserOpts,
      });

      // 썸네일 (NatureThumb)
      const thumbProps = {
        bookTitle: props.bookTitle,
        coverUrl:
          loadCleanCover(id) || storybook.coverImage || props.scenes[0]?.imageUrls?.[0] || '',
        headline: props.series.headline,
        categoryLabel: props.category,
      };
      const thumbComp = await selectComposition({
        serveUrl,
        id: 'NatureThumb',
        inputProps: thumbProps,
        timeoutInMilliseconds: 60000,
        ...browserOpts,
      });
      const thumbPath = path.join(outDir, `${id}-nature-thumb.png`);
      await renderStill({
        composition: thumbComp,
        serveUrl,
        output: thumbPath,
        inputProps: thumbProps,
        timeoutInMilliseconds: 60000,
        ...browserOpts,
      });
      console.log(`  ✓ [${i + 1}/${ids.length}] ${id} rendered (${props.category})`);

      if (DRY) {
        ok++;
        continue;
      }
      const target = await resolveMarketingTarget(id);
      if (!target) {
        console.log(`    · ${id} 마케팅 콘텐츠 없음 — 연결 skip`);
        skip++;
        continue;
      }
      const videoUrl = await uploadReelMp4(target.projectId, id, outPath);
      const coverUrl = await uploadThumbnail(target.projectId, id, thumbPath);
      const result = await connectReelToMarketing({ bookId: id, videoUrl, coverUrl, ownerUserId });
      console.log(`    → 연결(${result})`);
      ok++;
    } catch (e) {
      fail++;
      console.error(`  ✗ [${i + 1}/${ids.length}] ${id} 실패: ${(e as Error).message}`);
    }
  }
  console.log(`\n완료 — 성공 ${ok} · 스킵 ${skip} · 실패 ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
