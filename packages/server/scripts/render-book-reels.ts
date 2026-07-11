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
  resolveNatureBookIds,
  fetchStorybook,
  loadStoryboard,
  loadGenreMap,
  loadReelCaptions,
  loadNatureReelCaptions,
  resolveSeriesCovers,
  loadCleanCover,
} from '../src/services/reel/reel-targets.js';
import { buildReelProps } from '../src/services/reel/reel-props.js';
import { buildNatureReelProps } from '../src/services/reel/nature-reel-props.js';
import {
  resolveOwnerUserId,
  resolveMarketingTarget,
  uploadReelMp4,
  uploadThumbnail,
  connectReelToMarketing,
  updateReelCover,
} from '../src/services/reel/reel-publish.js';

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

/** 네트워크 작업(R2 업로드·Supabase)에 타임아웃 — stall 시 그 책만 실패 처리하고 계속. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms: ${label}`)), ms)
    ),
  ]);
}

// 썸네일 시리즈별 테마색 — 그리드에서 카테고리가 색으로 그룹핑되게. (배경 그라디언트 + 글로우 rgb)
const THUMB_THEMES: Array<{
  match: RegExp;
  c1: string;
  c2: string;
  c3: string;
  glow: string;
  badge: string;
}> = [
  {
    match: /명작/,
    c1: '#4a1c40',
    c2: '#26102a',
    c3: '#0e0712',
    glow: '255,150,205',
    badge: '#E0518F',
  }, // 로즈/플럼
  {
    match: /공룡/,
    c1: '#0e3a30',
    c2: '#08201b',
    c3: '#040f0c',
    glow: '90,255,190',
    badge: '#17A65E',
  }, // 에메랄드
  {
    match: /육지/,
    c1: '#3e2a10',
    c2: '#20160a',
    c3: '#100b05',
    glow: '255,200,110',
    badge: '#D98726',
  }, // 사바나 앰버
  {
    match: /식물/,
    c1: '#233e14',
    c2: '#12200b',
    c3: '#080f05',
    glow: '175,255,110',
    badge: '#4FA827',
  }, // 리프 그린
  {
    match: /곤충/,
    c1: '#3e163a',
    c2: '#200f20',
    c3: '#100610',
    glow: '255,150,235',
    badge: '#CE45A6',
  }, // 꽃밭 마젠타
  {
    match: /바다/,
    c1: '#0d3a52',
    c2: '#072030',
    c3: '#040f18',
    glow: '100,215,255',
    badge: '#1C93C4',
  }, // 오션 시안
  {
    match: /하늘/,
    c1: '#17436e',
    c2: '#0b2540',
    c3: '#050f1e',
    glow: '150,200,255',
    badge: '#3E7FD1',
  }, // 스카이 블루
  {
    match: /우주/,
    c1: '#281a56',
    c2: '#150f30',
    c3: '#080614',
    glow: '175,160,255',
    badge: '#7857D6',
  }, // 딥 스페이스 퍼플
  {
    match: /우리 ?몸/,
    c1: '#4a1620',
    c2: '#280c12',
    c3: '#120609',
    glow: '255,140,150',
    badge: '#DB524C',
  }, // 바디 코럴
];
function themeForThumb(
  nature: boolean,
  category: string
): { bg: string; glowRgb: string; badgeBg: string } {
  const key = nature ? category : '명작';
  const t = THUMB_THEMES.find((x) => x.match.test(key)) ?? THUMB_THEMES[6]; // 기본 스카이 블루
  return {
    bg: `radial-gradient(ellipse 95% 62% at 50% 42%, ${t.c1} 0%, ${t.c2} 46%, ${t.c3} 100%)`,
    glowRgb: t.glow,
    badgeBg: t.badge,
  };
}

interface Args {
  book: string | null;
  limit: number | null;
  offset: number;
  dryRun: boolean;
  thumbsOnly: boolean;
  forceThumb: boolean;
  ownerEmail: string;
  category: string;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    book: null,
    limit: null,
    offset: 0,
    dryRun: false,
    thumbsOnly: false,
    forceThumb: false,
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
    else if (key === '--force-thumb') a.forceThumb = true;
    else if (key === '--book') a.book = next();
    else if (key === '--limit') a.limit = parseInt(next(), 10);
    else if (key === '--offset') a.offset = parseInt(next(), 10);
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
  const isNature = args.category === 'nature';
  let ids = args.book ? [args.book] : isNature ? resolveNatureBookIds() : resolveClassicBookIds();
  if (!args.book && (args.offset > 0 || args.limit != null)) {
    ids = ids.slice(args.offset, args.limit != null ? args.offset + args.limit : undefined);
  }
  console.log(`[render-book-reels] 대상 ${ids.length}권`);

  // 3. genreMap (1회) + ownerUserId (프로덕션만)
  const genreMap = await loadGenreMap();
  const series = isNature ? await resolveSeriesCovers() : null;
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
  async function renderThumb(id: string, props: any, nature: boolean): Promise<string> {
    // 중앙정렬 포스터(그리드 안전) 통일 — 명작·자연관찰 공용.
    // hero = 글자 없는 16:9 본문 삽화(표지는 제목이 구워져 있어 회피). 배경 블러로 세로 프레임 채움.
    const compId = 'ReelThumbCentered';
    // 히어로 = 텍스트 제거한 클린 표지(가장 아이코닉). 없으면 글자 없는 본문 삽화 폴백
    // (원본 표지는 제목이 구워져 있어 이중 제목 방지 위해 회피).
    const clean = loadCleanCover(id);
    const heroUrl = clean
      ? encodeURI(clean)
      : (props.scenes[1]?.imageUrls?.[0] ?? props.scenes[0].imageUrls[0]);
    const theme = themeForThumb(nature, props.category ?? '');
    const thumbProps = {
      bookTitle: props.bookTitle,
      heroUrl,
      badge: nature ? props.category : '명작 그림책',
      bg: theme.bg,
      glowRgb: theme.glowRgb,
      badgeBg: theme.badgeBg,
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
      const props: any = isNature
        ? buildNatureReelProps({
            storybook,
            storyboard,
            captions: loadNatureReelCaptions(id),
            seriesCovers: series!.covers,
            seriesLabels: series!.labels,
          })
        : buildReelProps({ storybook, storyboard, genreMap, captions: loadReelCaptions(id) });
      if (!props) {
        console.log(`  - ${id} SKIP (릴스 props 생성 불가 — 스토리보드/삽화 부족)`);
        summary.skipped++;
        continue;
      }
      const morph = isNature ? 'nature' : props.styleMorph ? 'yes' : 'no';

      // ===== 썸네일만 갱신 모드 (영상 재렌더 없이 coverUrl 만 교체) =====
      if (args.thumbsOnly) {
        if (args.dryRun) {
          const thumbPath = await renderThumb(id, props, isNature);
          console.log(`  ✓ ${id} thumb(dry) → ${thumbPath}`);
          summary.rendered++;
          continue;
        }
        // 대상 먼저 조회 → 이미 썸네일이면 건너뜀(재개 안전)
        const target = await withTimeout(resolveMarketingTarget(id), 30000, `resolve ${id}`);
        if (!target) {
          console.log(`    · ${id} 마케팅 콘텐츠 없음 — skip`);
          summary.skipped++;
          continue;
        }
        const curCover = (target.igRow?.video_settings as any)?.reels?.ko?.coverUrl ?? '';
        if (!args.forceThumb && curCover.includes(`${id}-thumb-`)) {
          console.log(`  = ${id} 이미 썸네일 있음 — skip (재교체는 --force-thumb)`);
          summary.skipped++;
          continue;
        }
        const thumbPath = await renderThumb(id, props, isNature);
        const coverUrl = await withTimeout(
          uploadThumbnail(target.projectId, id, thumbPath),
          60000,
          `upload ${id}`
        );
        const result = await withTimeout(
          updateReelCover({ bookId: id, coverUrl }),
          30000,
          `db ${id}`
        );
        console.log(`  ✓ ${id} 썸네일 교체(${result}) → ${coverUrl.slice(-46)}`);
        summary.rendered++;
        if (!isNature && props.styleMorph) summary.morphYes++;
        continue;
      }

      // ===== 전체 렌더 (영상 + 썸네일) =====
      const composition = await selectComposition({
        serveUrl,
        id: isNature ? 'NatureReel' : 'StorybookReel',
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
      if (!isNature && props.styleMorph) summary.morphYes++;

      if (args.dryRun) continue; // dry-run: 로컬 mp4 유지, 업로드/연결 없음

      // ----- 프로덕션 경로 (dry-run 에서는 실행 안 함) -----
      const target = await resolveMarketingTarget(id);
      if (!target) {
        console.log(`    · ${id} 마케팅 콘텐츠 없음 — 연결 skip`);
        continue;
      }
      const videoUrl = await uploadReelMp4(target.projectId, id, outPath);
      const thumbPath = await renderThumb(id, props, isNature);
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
