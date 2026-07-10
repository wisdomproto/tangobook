// 동화책 릴스 배치 렌더 파이프라인.
// 각 세계명작 동화책 → StorybookReel(Remotion) 렌더 → (실행 시) R2 업로드 + 마케팅 인스타 행 연결.
//
// 실행 (dry-run, 로컬 mp4 만 생성 · R2/Supabase 쓰기 없음):
//   pnpm --filter @tangobook/server exec tsx scripts/render-book-reels.ts --book=<id> --dry-run
//   pnpm --filter @tangobook/server exec tsx scripts/render-book-reels.ts --limit=3 --dry-run
// 실행 (프로덕션 — R2 업로드 + 마케팅 연결):
//   pnpm --filter @tangobook/server exec tsx scripts/render-book-reels.ts --limit=51
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveClassicBookIds,
  fetchStorybook,
  loadStoryboard,
  loadGenreMap,
  loadReelCaptions,
} from '../src/services/reel/reel-targets.js';
import { buildReelProps } from '../src/services/reel/reel-props.js';
import {
  resolveOwnerUserId,
  resolveMarketingTarget,
  uploadReelMp4,
  uploadThumbnail,
  connectReelToMarketing,
  updateReelCover,
} from '../src/services/reel/reel-publish.js';
import type { ReelProps } from '../src/services/reel/reel-props.js';

// Remotion 은 Chromium 이 필요하므로 lazy import (config 로드 시점 부담 회피).
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

interface Args {
  book: string | null;
  limit: number | null;
  dryRun: boolean;
  thumbsOnly: boolean;
  ownerEmail: string;
  category: string;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    book: null,
    limit: null,
    dryRun: false,
    thumbsOnly: false,
    ownerEmail: 'kil210@gmail.com',
    category: 'classics',
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const eq = arg.indexOf('=');
    const [key, inlineVal] = eq > 0 ? [arg.slice(0, eq), arg.slice(eq + 1)] : [arg, null];
    const next = () => inlineVal ?? argv[++i];
    if (key === '--dry-run') a.dryRun = true;
    else if (key === '--thumbs-only') a.thumbsOnly = true;
    else if (key === '--book') a.book = next();
    else if (key === '--limit') a.limit = parseInt(next(), 10);
    else if (key === '--owner-email') a.ownerEmail = next();
    else if (key === '--category') a.category = next();
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(
    `[render-book-reels] dryRun=${args.dryRun} category=${args.category} owner=${args.ownerEmail}`
  );

  // 1. Remotion 번들 (1회)
  const { bundle, selectComposition, renderMedia, renderStill } = await loadRemotion();
  const remotionEntry = path.resolve(process.cwd(), '../remotion/src/entry.ts');
  console.log('[render-book-reels] bundling remotion:', remotionEntry);
  const serveUrl = await bundle({ entryPoint: remotionEntry });

  // 2. 대상 id 결정
  let ids = args.book ? [args.book] : resolveClassicBookIds();
  if (!args.book && args.limit != null) ids = ids.slice(0, args.limit);
  console.log(`[render-book-reels] 대상 ${ids.length}권`);

  // 3. genreMap (1회) + ownerUserId (프로덕션만)
  const genreMap = await loadGenreMap();
  let ownerUserId = '';
  if (!args.dryRun) {
    ownerUserId = await resolveOwnerUserId(args.ownerEmail);
    console.log(`[render-book-reels] owner userId=${ownerUserId}`);
  }

  const chromiumPath = process.env.CHROMIUM_PATH || undefined;
  const browserOpts = {
    ...(chromiumPath ? { browserExecutable: chromiumPath } : {}),
    chromiumOptions: { gl: 'angle' as const, headless: true },
  };

  const outDir = path.resolve(process.cwd(), 'out/reels');
  fs.mkdirSync(outDir, { recursive: true });

  // 썸네일(9:16) 렌더 → 로컬 PNG 경로 반환. 3그림체 있으면 그림체 3분할, 없으면 포스터.
  async function renderThumb(id: string, props: ReelProps): Promise<string> {
    const compId = props.styleMorph ? 'ReelThumbStyles' : 'ReelThumbPoster';
    const thumbProps = {
      bookTitle: props.bookTitle,
      coverUrl: props.scenes[0].imageUrls[0],
      styles: props.styleMorph?.styles ?? [],
    };
    const comp = await selectComposition({
      serveUrl,
      id: compId,
      inputProps: thumbProps,
      timeoutInMilliseconds: 60000,
      ...browserOpts,
    });
    const thumbPath = path.join(outDir, `${id}-thumb.png`);
    await renderStill({
      composition: comp,
      serveUrl,
      output: thumbPath,
      inputProps: thumbProps,
      timeoutInMilliseconds: 60000,
      ...browserOpts,
    });
    return thumbPath;
  }

  const summary = { rendered: 0, skipped: 0, failed: 0, morphYes: 0 };

  for (const id of ids) {
    try {
      const storybook = await fetchStorybook(id);
      const storyboard = loadStoryboard(id);
      const captions = loadReelCaptions(id);
      const props = buildReelProps({ storybook, storyboard, genreMap, captions });
      if (!props) {
        console.log(`  - ${id} SKIP (릴스 props 생성 불가 — 스토리보드/삽화 부족)`);
        summary.skipped++;
        continue;
      }
      const morph = props.styleMorph ? 'yes' : 'no';

      // ===== 썸네일만 갱신 모드 (영상 재렌더 없이 coverUrl 만 교체) =====
      if (args.thumbsOnly) {
        const thumbPath = await renderThumb(id, props);
        console.log(`  ✓ ${id} thumb(${morph === 'yes' ? 'styles' : 'poster'}) → ${thumbPath}`);
        summary.rendered++;
        if (props.styleMorph) summary.morphYes++;
        if (args.dryRun) continue;
        const target = await resolveMarketingTarget(id);
        if (!target) {
          console.log(`    · ${id} 마케팅 콘텐츠 없음 — skip`);
          continue;
        }
        const coverUrl = await uploadThumbnail(target.projectId, id, thumbPath);
        const result = await updateReelCover({ bookId: id, coverUrl });
        console.log(`    · ${id} 썸네일 교체(${result}) → ${coverUrl}`);
        continue;
      }

      // ===== 전체 렌더 (영상 + 썸네일) =====
      const composition = await selectComposition({
        serveUrl,
        id: 'StorybookReel',
        inputProps: props,
        timeoutInMilliseconds: 60000,
        ...browserOpts,
      });

      const outPath = path.join(outDir, `${id}.mp4`);
      await renderMedia({
        composition,
        serveUrl,
        codec: 'h264',
        imageFormat: 'png',
        outputLocation: outPath,
        inputProps: props,
        timeoutInMilliseconds: 60000,
        ...browserOpts,
      });

      console.log(`  ✓ ${id} scenes=${props.scenes.length} morph=${morph} → ${outPath}`);
      summary.rendered++;
      if (props.styleMorph) summary.morphYes++;

      if (args.dryRun) continue; // dry-run: 로컬 mp4 유지, 업로드/연결 없음

      // ----- 프로덕션 경로 (dry-run 에서는 실행 안 함) -----
      const target = await resolveMarketingTarget(id);
      if (!target) {
        console.log(`    · ${id} 마케팅 콘텐츠 없음 — 연결 skip`);
        continue;
      }
      const videoUrl = await uploadReelMp4(target.projectId, id, outPath);
      const thumbPath = await renderThumb(id, props);
      const coverUrl = await uploadThumbnail(target.projectId, id, thumbPath); // 썸네일을 커버로
      const result = await connectReelToMarketing({ bookId: id, videoUrl, coverUrl, ownerUserId });
      console.log(`    · ${id} 업로드+연결(${result}) → ${videoUrl}`);
    } catch (err) {
      console.error(`  ✗ ${id} FAILED: ${(err as Error).message}`);
      summary.failed++;
    }
  }

  console.log(
    `\n[render-book-reels] 완료 — rendered=${summary.rendered} skipped=${summary.skipped} failed=${summary.failed} (morph=yes ${summary.morphYes})`
  );
}

main().catch((e) => {
  console.error('[render-book-reels] 치명적 오류:', e);
  process.exit(1);
});
