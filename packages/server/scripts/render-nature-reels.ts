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
      const isLife = /생활동화/.test(storybook.category || '');
      // 시리즈 씬은 그 책과 같은 라인을 보여준다(생활동화 릴스 → 호리 시리즈, 자연 → 자연도감).
      // resolveSeriesCovers 는 종류별 캐시라 루프 안에서 불러도 비용 없음.
      const series = await resolveSeriesCovers(isLife ? 'life' : 'nature');
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

      // 썸네일 — 시리즈별로 컴포지션이 다르다(한 컴포넌트에 욱여넣으면 한쪽 요구가 다른 쪽을 망친다).
      //  · 생활동화(LifeThumb) = 배지 + 이 화 제목 + 16:9 표지 + 훅 자막 + 로고.
      //  · 자연도감(NatureThumb) = 배지 + 제목 + 시리즈 규모 문구("자연도감 100권+") — 그 문구가
      //    스크롤 스토퍼라 제목으로 대체하면 안 된다.
      // 클린 표지(제목 제거본)가 있으면 우선. 없으면 원본 표지(제목 박힌 것).
      const coverUrlForThumb =
        loadCleanCover(id) || storybook.coverImage || props.scenes[0]?.imageUrls?.[0] || '';
      const thumbId = isLife ? 'LifeThumb' : 'NatureThumb';
      const thumbProps = isLife
        ? {
            bookTitle: props.bookTitle,
            coverUrl: coverUrlForThumb,
            categoryLabel: '호리네 생활동화',
            caption: props.scenes[0]?.body ?? '',
          }
        : {
            bookTitle: props.bookTitle,
            coverUrl: coverUrlForThumb,
            headline: props.series.headline,
            categoryLabel: props.category,
          };
      const thumbComp = await selectComposition({
        serveUrl,
        id: thumbId,
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
