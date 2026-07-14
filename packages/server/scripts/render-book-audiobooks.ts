// 동화책 롱폼 오디오북 배치 렌더 파이프라인.
// 한 책 × (그림체 × 언어) 조합 1개 → Remotion Audiobook 렌더 + LongformThumbnail 렌더
// → (dry-run 아니면) R2 업로드 + YouTube 메타(Gemini) + 다국어 SRT 자막 생성 + 마케팅 롱폼 탭(mkt_youtube_contents) 등록.
//
// 실행 (dry-run, 로컬 mp4/png 만 생성 — R2/Supabase 쓰기 없음):
//   pnpm --filter @tangobook/server exec tsx scripts/render-book-audiobooks.ts --book=1772009873865 --style=paper-craft --lang=ko --dry-run
// 실행 (프로덕션 — R2 업로드 + 메타/자막 생성 + 마케팅 연결):
//   pnpm --filter @tangobook/server exec tsx scripts/render-book-audiobooks.ts --book=1772009873865 --style=paper-craft --lang=ko
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fetchStorybook } from '../src/services/reel/reel-targets.js';
import {
  resolveOwnerUserId,
  resolveMarketingTarget,
  type MarketingTarget,
} from '../src/services/reel/reel-publish.js';
import {
  connectLongformToMarketing,
  matchYoutubeRow,
  type LongformMeta,
} from '../src/services/reel/longform-publish.js';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';
import { uploadBufferToR2 } from '../src/providers/r2.provider.js';
import { generateTextWithGemini } from '../src/providers/gemini.provider.js';
import { getAudioDuration } from '../src/utils/audio-duration.js';
import { generateSrt } from '../src/utils/srt-generator.js';
import { translateSrt } from '../src/utils/srt-translator.js';
import { buildYoutubeMetaPrompt } from '../src/utils/youtube-meta-prompt.js';
import { buildStyledAudiobookRenderData } from '@tangobook/shared';
import type { AudiobookRenderData, Storybook, StyleAssets } from '@tangobook/shared';

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

/** 네트워크 작업(R2 업로드·Supabase·Gemini)에 타임아웃 — stall 시 명확한 에러로 실패. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms: ${label}`)), ms)
    ),
  ]);
}

interface Args {
  book: string | null;
  style: string | null;
  lang: string | null;
  dryRun: boolean;
  force: boolean;
  ownerEmail: string;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    book: null,
    style: null,
    lang: null,
    dryRun: false,
    force: false,
    ownerEmail: 'kil210@gmail.com',
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const eq = arg.indexOf('=');
    const [key, inlineVal] = eq > 0 ? [arg.slice(0, eq), arg.slice(eq + 1)] : [arg, null];
    const next = () => inlineVal ?? argv[++i];
    if (key === '--dry-run') a.dryRun = true;
    else if (key === '--force') a.force = true;
    else if (key === '--book') a.book = next();
    else if (key === '--style') a.style = next();
    else if (key === '--lang') a.lang = next();
    else if (key === '--owner-email') a.ownerEmail = next();
  }
  return a;
}

const DEFAULT_META_PROMPT =
  "You are writing YouTube metadata for a children's animated storybook audiobook. " +
  'Make the title inviting for parents and kids searching for bedtime stories.';

// 기본 BGM — 뷰어/메인과 동일한 배포 정적 자산(default-1..5.mp3). 헤드리스 렌더는 절대 URL 필요.
const SITE_ORIGIN = (process.env.PUBLIC_SITE_ORIGIN || 'https://www.tangobook.co.kr').replace(
  /\/$/,
  ''
);
const DEFAULT_BGM_URLS = [1, 2, 3, 4, 5].map((n) => `${SITE_ORIGIN}/sounds/bgm/default-${n}.mp3`);

/** Probe TTS durations for slides that have TTS URLs. Mutates renderData in-place (mirrors audiobook.service). */
async function probeTtsDurations(renderData: AudiobookRenderData): Promise<void> {
  const slidesWithTts = renderData.slides.filter((s) => s.ttsUrl);
  for (const slide of slidesWithTts) {
    try {
      slide.ttsDuration = await getAudioDuration(slide.ttsUrl!);
    } catch {
      console.warn(`[render-book-audiobooks] TTS 길이 측정 실패: ${slide.ttsUrl}, 기본값 사용`);
    }
  }
}

interface ParsedYoutubeMeta {
  title?: string;
  description?: string;
  tags?: unknown;
  categoryId?: string;
}

async function generateMeta(storybook: Storybook, lang: string): Promise<LongformMeta> {
  const prompt = buildYoutubeMetaPrompt(storybook, {
    language: lang,
    aspectRatio: '16:9',
    userPrompt: DEFAULT_META_PROMPT,
  });
  const raw = await generateTextWithGemini(prompt, 3);
  const cleaned = raw
    .replace(/```json?\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed: ParsedYoutubeMeta = {};
  try {
    parsed = JSON.parse(cleaned) as ParsedYoutubeMeta;
  } catch {
    console.warn(
      '[render-book-audiobooks] Gemini 메타 JSON 파싱 실패 — 폴백 사용:',
      cleaned.slice(0, 200)
    );
  }

  return {
    title: parsed.title || storybook.title,
    description: parsed.description || '',
    tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : [],
    categoryId: parsed.categoryId || '27',
  };
}

async function generateCaptions(
  renderData: AudiobookRenderData,
  baseLang: string,
  storybook: Storybook
): Promise<Record<string, string>> {
  const baseSrt = generateSrt(renderData);
  const captions: Record<string, string> = { [baseLang]: baseSrt };
  if (!baseSrt.trim()) return captions;

  const otherLangs = (storybook.languages ?? []).filter((l) => l !== baseLang);
  for (const tl of otherLangs) {
    try {
      captions[tl] = await translateSrt(baseSrt, baseLang, tl);
    } catch (err) {
      console.warn(
        `[render-book-audiobooks] 자막 번역 실패(${baseLang}→${tl}):`,
        (err as Error).message
      );
    }
  }
  return captions;
}

/** --force 아니면 같은 (artStyle,language) 행에 이미 video_url 이 있는지 확인 — 있으면 재렌더 skip. */
async function alreadyRendered(
  target: MarketingTarget,
  artStyle: string,
  lang: string
): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { data: rows, error } = await sb
    .from('mkt_youtube_contents')
    .select('id, video_settings, video_url')
    .eq('content_id', target.contentId);
  if (error) throw new Error(`mkt_youtube_contents 조회 실패: ${error.message}`);
  const existing = matchYoutubeRow(rows ?? [], artStyle, lang);
  return !!existing?.video_url;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.book || !args.style || !args.lang) {
    console.error(
      '사용법: --book=<id> --style=<artStyle> --lang=<code> [--dry-run] [--force] [--owner-email=<email>]'
    );
    process.exit(1);
  }
  const { book, style, lang } = args;
  console.log(
    `[render-book-audiobooks] book=${book} style=${style} lang=${lang} dryRun=${args.dryRun} force=${args.force}`
  );

  // 1. 동화책 로드
  const storybook = (await fetchStorybook(book)) as Storybook;

  // 2. 스타일드 렌더 데이터 빌드
  const renderData = buildStyledAudiobookRenderData(storybook, { artStyle: style, language: lang });
  if (renderData.slides.length === 0) {
    throw new Error(`(${style}) 그림체에 삽화가 있는 페이지가 없습니다 — 렌더 불가.`);
  }
  console.log(`[render-book-audiobooks] slides=${renderData.slides.length}`);

  // 2.5. 랜덤 BGM — 책에 저작 BGM 이 없으면 기본 5곡 중 무작위 1곡을 은은한 배경음으로 넣는다.
  if (!renderData.bgmUrl) {
    renderData.bgmUrl = DEFAULT_BGM_URLS[Math.floor(Math.random() * DEFAULT_BGM_URLS.length)];
    console.log(`[render-book-audiobooks] BGM(random)=${renderData.bgmUrl}`);
  }

  // 3. TTS/BGM 길이 프로브 (SRT 타이밍 정확도를 위해 렌더 전에 완료)
  await probeTtsDurations(renderData);
  if (renderData.bgmUrl) {
    try {
      renderData.bgmDuration = await getAudioDuration(renderData.bgmUrl);
    } catch (err) {
      console.warn(
        '[render-book-audiobooks] BGM 길이 측정 실패, 루프 없이 재생:',
        (err as Error).message
      );
    }
  }

  // 4. 마케팅 대상 조회 (없어도 로컬 렌더는 계속 진행)
  let target: MarketingTarget | null = null;
  if (!args.dryRun) {
    target = await resolveMarketingTarget(book);
    if (!target) {
      console.warn(
        `[render-book-audiobooks] 마케팅 콘텐츠 없음(storybook:${book}) — 렌더는 진행하되 마케팅 등록은 skip 됩니다.`
      );
    } else if (!args.force) {
      const done = await alreadyRendered(target, style, lang);
      if (done) {
        console.log(
          `[render-book-audiobooks] SKIP — 이미 렌더됨 (${style}/${lang}, --force 로 재렌더)`
        );
        return;
      }
    }
  }

  // 5. Remotion 번들
  const { bundle, selectComposition, renderMedia, renderStill } = await loadRemotion();
  const isProd = process.env.NODE_ENV === 'production';
  const remotionEntry = isProd
    ? path.resolve('/app/packages/remotion/src/entry.ts')
    : path.resolve(process.cwd(), '../remotion/src/entry.ts');
  console.log('[render-book-audiobooks] bundling remotion:', remotionEntry);
  const serveUrl = await bundle({ entryPoint: remotionEntry });

  const chromiumPath = process.env.CHROMIUM_PATH || undefined;
  const browserOpts = {
    ...(chromiumPath ? { browserExecutable: chromiumPath } : {}),
    chromiumOptions: { gl: 'angle' as const, headless: true },
  };

  const workDir = path.join(os.tmpdir(), `longform-${book}-${style}-${lang}-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    // 6. 오디오북 렌더
    const composition = await selectComposition({
      serveUrl,
      id: 'Audiobook',
      inputProps: renderData,
      ...browserOpts,
    });

    const outputPath = path.join(workDir, 'output.mp4');
    console.log('[render-book-audiobooks] rendering audiobook mp4...');
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      imageFormat: 'png',
      scale: 1.5,
      crf: 16,
      outputLocation: outputPath,
      inputProps: renderData,
      timeoutInMilliseconds: 600000,
      concurrency: 1,
      ...browserOpts,
      onProgress: ({ progress }: { progress: number }) => {
        if (Math.round(progress * 100) % 10 === 0) {
          console.log(`  렌더링 ${Math.round(progress * 100)}%`);
        }
      },
    });

    // faststart 처리 (moov atom 앞으로 이동 — 스트리밍 재생 지원)
    try {
      const { execSync } = await import('node:child_process');
      const faststartPath = path.join(workDir, 'output-faststart.mp4');
      execSync(`ffmpeg -i "${outputPath}" -c copy -movflags +faststart "${faststartPath}"`, {
        timeout: 60_000,
        stdio: 'pipe',
      });
      fs.renameSync(faststartPath, outputPath);
    } catch (err) {
      console.warn('[render-book-audiobooks] faststart 실패, 원본 사용:', (err as Error).message);
    }

    // 7. 썸네일 렌더 (LongformThumbnail, 16:9)
    const styleAsset = (storybook.styleAssets ?? {})[style] as StyleAssets | undefined;
    const heroImageUrl =
      styleAsset?.pageIllustrations?.[1]?.illustrationUrl ??
      styleAsset?.cleanCoverImage ??
      styleAsset?.coverImage ??
      storybook.coverImage ??
      '';
    if (!heroImageUrl) {
      console.warn('[render-book-audiobooks] 썸네일용 이미지 없음 — 빈 배경으로 렌더됩니다.');
    }
    const thumbProps = { title: storybook.title, heroImageUrl, lang, styleLabel: style };
    const thumbComposition = await selectComposition({
      serveUrl,
      id: 'LongformThumbnail',
      inputProps: thumbProps,
      ...browserOpts,
    });
    const thumbPath = path.join(workDir, 'thumb.png');
    console.log('[render-book-audiobooks] rendering thumbnail...');
    await renderStill({
      composition: thumbComposition,
      serveUrl,
      output: thumbPath,
      inputProps: thumbProps,
      ...browserOpts,
    });

    if (args.dryRun) {
      console.log(`\n[render-book-audiobooks] DRY-RUN 완료 — 업로드/등록 없음.`);
      console.log(`  mp4  → ${outputPath}`);
      console.log(`  thumb→ ${thumbPath}`);
      return;
    }

    // 8. R2 업로드
    const projectId = target?.projectId ?? book;
    const ts = Date.now();
    console.log('[render-book-audiobooks] uploading to R2...');
    const videoBuffer = fs.readFileSync(outputPath);
    const videoUrl = await withTimeout(
      uploadBufferToR2(
        videoBuffer,
        `mkt/${projectId}/longform/${book}-${style}-${lang}-${ts}.mp4`,
        'video/mp4'
      ),
      120_000,
      'upload mp4'
    );
    const thumbBuffer = fs.readFileSync(thumbPath);
    const thumbnailUrl = await withTimeout(
      uploadBufferToR2(
        thumbBuffer,
        `mkt/${projectId}/longform/${book}-${style}-${lang}-thumb-${ts}.png`,
        'image/png'
      ),
      60_000,
      'upload thumb'
    );
    console.log(`  video → ${videoUrl}`);
    console.log(`  thumb → ${thumbnailUrl}`);

    // 9. YouTube 메타 생성 (Gemini)
    console.log('[render-book-audiobooks] generating YouTube meta...');
    const meta = await withTimeout(generateMeta(storybook, lang), 120_000, 'gemini meta');

    // 10. 다국어 SRT 자막
    console.log('[render-book-audiobooks] generating captions...');
    const captions = await generateCaptions(renderData, lang, storybook);

    // 11. 마케팅 롱폼 탭 등록
    const ownerUserId = await resolveOwnerUserId(args.ownerEmail);
    const result = await connectLongformToMarketing({
      bookId: book,
      artStyle: style,
      language: lang,
      aspectRatio: '16:9',
      videoUrl,
      thumbnailUrl,
      meta,
      captions,
      ownerUserId,
    });
    console.log(`\n[render-book-audiobooks] 완료 — 마케팅 등록(${result})`);
  } finally {
    // dry-run 은 산출물(mp4/thumb)을 육안 검증용으로 남긴다. 실제 실행만 tmp 정리.
    if (!args.dryRun) fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('[render-book-audiobooks] 치명적 오류:', e);
  process.exit(1);
});
