import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { AppError } from '../middleware/error.middleware.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { buildR2Key } from '../utils/r2-key.js';
import { buildAudiobookRenderData } from '@tangobook/shared';
import type { AudiobookRenderData } from '@tangobook/shared';
import type {
  AudiobookProject,
  YouTubeUploadMeta,
  YouTubeGeneratedMeta,
  Storybook,
  Page,
  GeneratedCaption,
} from '@tangobook/shared';
import { getAudioDuration } from '../utils/audio-duration.js';
import { YouTubeProvider } from '../providers/youtube.provider.js';
import { deleteFromR2, downloadFromR2, urlToR2Key } from '../providers/r2.provider.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { generateSrt } from '../utils/srt-generator.js';
import { translateSrt } from '../utils/srt-translator.js';
import { parseYouTubeVideoId } from '../utils/youtube-url.js';

// Remotion은 Chromium이 필요하므로 서버 시작 시가 아닌 렌더링 요청 시에만 lazy import
async function loadRemotion() {
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RenderProgress = { progress: number; step: string; error?: string };
const renderProgressMap = new Map<string, RenderProgress>();
const youtubeProgressMap = new Map<string, RenderProgress>();
const captionProgressMap = new Map<string, RenderProgress>();

function getPageText(page: Page, lang: string): string {
  if (lang !== 'ko' && page.translations?.[lang]?.text) {
    return page.translations[lang].text;
  }
  return page.text;
}

let cachedBundlePath: string | null = null;

async function getBundlePath(): Promise<string> {
  const isDev = process.env.NODE_ENV !== 'production';
  // Dev: always re-bundle to pick up latest changes
  if (!isDev && cachedBundlePath && fs.existsSync(cachedBundlePath)) {
    return cachedBundlePath;
  }
  const { bundle } = await loadRemotion();
  // entry.ts contains registerRoot() — required for Remotion bundling
  // Dev: __dirname = packages/server/src/services → ../../.. = packages/
  // Prod: __dirname = packages/server/dist/server/src/services → need absolute path
  const isDev2 = process.env.NODE_ENV !== 'production';
  const remotionEntry = isDev2
    ? path.resolve(__dirname, '../../../remotion/src/entry.ts')
    : path.resolve('/app/packages/remotion/src/entry.ts');
  console.log('[audiobook] Remotion entry path:', remotionEntry);
  cachedBundlePath = await bundle({ entryPoint: remotionEntry });
  return cachedBundlePath;
}

/** Probe TTS durations for slides that have TTS URLs. Mutates renderData in-place. */
async function probeTtsDurations(
  renderData: AudiobookRenderData,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const slidesWithTts = renderData.slides.filter((s) => s.ttsUrl);
  for (let i = 0; i < slidesWithTts.length; i++) {
    const slide = slidesWithTts[i];
    try {
      slide.ttsDuration = await getAudioDuration(slide.ttsUrl!);
    } catch {
      console.warn(`[audiobook] TTS 길이 측정 실패: ${slide.ttsUrl}, 기본값(3초) 사용`);
    }
    onProgress?.(i + 1, slidesWithTts.length);
  }
}

export const AudiobookService = {
  getRenderProgress(projectId: string): RenderProgress | null {
    return renderProgressMap.get(projectId) ?? null;
  },

  async render(req: { storybookId: string; projectId: string }): Promise<{ outputUrl: string }> {
    const { storybookId, projectId } = req;

    if (!storybookId) throw new AppError(400, 'storybookId는 필수입니다.');
    if (!projectId) throw new AppError(400, 'projectId는 필수입니다.');

    // 1. Load storybook
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');

    // 1.5. Delete previous render output from R2 if exists
    if (project.outputUrl) {
      try {
        const oldKey = urlToR2Key(project.outputUrl);
        await deleteFromR2(oldKey);
        console.log('[audiobook] Deleted previous render:', oldKey);
      } catch {
        // Ignore deletion errors — old file may already be gone
      }
    }

    // 2. Build render props
    const renderData = buildAudiobookRenderData(storybook, project);
    if (renderData.slides.length === 0) {
      throw new AppError(400, '렌더링할 페이지가 없습니다 (삽화가 있는 페이지 필요).');
    }

    console.log('[audiobook] Render started:', {
      storybookId,
      projectId,
      slides: renderData.slides.length,
    });
    renderProgressMap.set(projectId, { progress: 0, step: 'TTS 길이 측정 중' });

    // 2.5. Probe TTS durations for accurate slide timing
    await probeTtsDurations(renderData, (i, total) => {
      const percent = Math.round((i / total) * 4); // 0-4%
      renderProgressMap.set(projectId, {
        progress: percent,
        step: `TTS 길이 측정 중 (${i}/${total})`,
      });
    });

    // 2.6. Probe BGM duration for looping
    if (renderData.bgmUrl) {
      try {
        renderData.bgmDuration = await getAudioDuration(renderData.bgmUrl);
        console.log('[audiobook] BGM duration:', renderData.bgmDuration, 's');
      } catch (err) {
        console.warn('[audiobook] BGM 길이 측정 실패, 루프 없이 재생:', err);
      }
    }

    const workDir = path.join(os.tmpdir(), `audiobook-${projectId}-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    try {
      // 3. Bundle (cached)
      renderProgressMap.set(projectId, { progress: 5, step: 'Remotion 번들링' });
      const bundlePath = await getBundlePath();

      // 4. Load Remotion + Select composition
      renderProgressMap.set(projectId, { progress: 10, step: '컴포지션 준비' });
      const { selectComposition, renderMedia } = await loadRemotion();
      const chromiumPath = process.env.CHROMIUM_PATH || undefined;
      console.log('[audiobook] Browser executable:', chromiumPath || 'default');

      const browserOpts = {
        ...(chromiumPath ? { browserExecutable: chromiumPath } : {}),
        chromiumOptions: { gl: 'angle' as const, headless: true },
      };

      const composition = await selectComposition({
        serveUrl: bundlePath,
        id: 'Audiobook',
        inputProps: renderData,
        ...browserOpts,
      });

      // 5. Render
      const outputPath = path.join(workDir, 'output.mp4');
      renderProgressMap.set(projectId, { progress: 15, step: '렌더링 중' });

      await renderMedia({
        composition,
        serveUrl: bundlePath,
        codec: 'h264',
        imageFormat: 'png', // 무손실 중간프레임 — JPEG 압축 아티팩트 제거(텍스트/그라데이션)
        scale: 1.5, // 1280x720 → 1920x1080 (레이아웃 px 유지, 픽셀밀도만 ↑). 4K면 3
        crf: 16, // h264 기본 18 → 16 (약간 더 고품질)
        outputLocation: outputPath,
        inputProps: renderData,
        timeoutInMilliseconds: 600000, // 10 minutes
        concurrency: 1, // Reduce memory usage on Railway
        ...browserOpts,
        onProgress: ({ progress }) => {
          const percent = 15 + Math.round(progress * 75); // 15-90%
          renderProgressMap.set(projectId, { progress: percent, step: '렌더링 중' });
        },
      });

      // faststart 처리: moov atom을 앞으로 이동 (브라우저 스트리밍 재생 지원)
      try {
        const { execSync } = await import('child_process');
        const faststartPath = path.join(workDir, 'output-faststart.mp4');
        execSync(`ffmpeg -i "${outputPath}" -c copy -movflags +faststart "${faststartPath}"`, {
          timeout: 60_000,
          stdio: 'pipe',
        });
        fs.renameSync(faststartPath, outputPath);
      } catch (err) {
        console.warn('[audiobook] faststart failed, using original:', err);
      }

      // 6. Upload to R2
      renderProgressMap.set(projectId, { progress: 92, step: 'R2 업로드 중' });
      const videoBuffer = fs.readFileSync(outputPath);
      const key = buildR2Key({
        storybookId,
        storybookTitle: storybook.title,
        fileType: 'audiobook',
        identifier: project.name,
        extension: 'mp4',
      });
      const outputUrl = await R2Repository.uploadBuffer(videoBuffer, key, 'video/mp4');

      // 7. Update storybook
      const proj = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
      if (proj) {
        proj.outputUrl = outputUrl;
        proj.createdAt = new Date().toISOString();
        await R2Repository.saveStorybook(storybook);
      }

      console.log('[audiobook] Render complete:', { projectId, outputUrl });
      renderProgressMap.set(projectId, { progress: 100, step: '완료' });
      setTimeout(() => renderProgressMap.delete(projectId), 60_000);

      return { outputUrl };
    } catch (err: any) {
      console.error('[audiobook] Render failed:', { projectId, error: err.message || err });
      renderProgressMap.set(projectId, {
        progress: -1,
        step: '렌더링 실패',
        error: err.message || '알 수 없는 오류',
      });
      setTimeout(() => renderProgressMap.delete(projectId), 60_000);
      throw err;
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  },

  async deleteRender(req: { storybookId: string; projectId: string }): Promise<void> {
    const { storybookId, projectId } = req;
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');
    if (!project.outputUrl) throw new AppError(400, '삭제할 렌더링 파일이 없습니다.');

    // Delete from R2
    try {
      const key = urlToR2Key(project.outputUrl);
      await deleteFromR2(key);
      console.log('[audiobook] Render deleted:', key);
    } catch {
      // Ignore — file may already be gone
    }

    // Clear outputUrl
    project.outputUrl = undefined;
    await R2Repository.saveStorybook(storybook);
  },

  // ----- YouTube -----

  getYouTubeProgress(projectId: string): RenderProgress | null {
    return youtubeProgressMap.get(projectId) ?? null;
  },

  setYouTubeError(projectId: string, message: string) {
    youtubeProgressMap.set(projectId, { progress: -1, step: message });
    setTimeout(() => youtubeProgressMap.delete(projectId), 30_000);
  },

  async uploadToYouTube(
    storybookId: string,
    projectId: string,
    meta: YouTubeUploadMeta,
    channelId?: string
  ): Promise<void> {
    console.log('[audiobook-youtube] Starting upload:', { storybookId, projectId });

    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');
    if (!project.outputUrl) throw new AppError(400, '렌더링된 영상이 없습니다.');

    console.log('[audiobook-youtube] Output URL:', project.outputUrl);
    youtubeProgressMap.set(projectId, { progress: 0, step: 'R2에서 영상 다운로드 중' });

    // 1. Download video from R2
    const r2Key = urlToR2Key(project.outputUrl);
    console.log('[audiobook-youtube] R2 key:', r2Key);
    const videoBuffer = await downloadFromR2(r2Key);
    console.log('[audiobook-youtube] Downloaded', videoBuffer.length, 'bytes');

    youtubeProgressMap.set(projectId, { progress: 10, step: 'YouTube 업로드 중' });

    // 2. Upload to YouTube
    const result = await YouTubeProvider.uploadVideo(
      videoBuffer,
      meta,
      (percent) => {
        const mapped = 10 + Math.round(percent * 0.85);
        youtubeProgressMap.set(projectId, {
          progress: mapped,
          step: `YouTube 업로드 중 (${mapped}%)`,
        });
      },
      channelId
    );

    // 3. Save result immediately (before thumbnail — prevents loss on thumbnail failure)
    // 정책 (2026-05-01): YouTube 가 mp4 master copy → R2 archive 즉시 삭제 (R2 비용 절약)
    const oldOutputUrl = project.outputUrl;
    project.youtubeUpload = {
      videoId: result.videoId,
      videoUrl: result.videoUrl,
      uploadedAt: new Date().toISOString(),
      privacy: meta.privacy,
      channelId: result.channelId,
      ...(meta.publishAt ? { publishAt: meta.publishAt } : {}),
    };
    project.outputUrl = undefined;
    await R2Repository.saveStorybook(storybook);

    if (oldOutputUrl) {
      const oldKey = urlToR2Key(oldOutputUrl);
      deleteFromR2(oldKey).catch((err) =>
        console.warn(`[audiobook-youtube] R2 mp4 삭제 실패 (${oldKey}):`, (err as Error).message)
      );
    }

    // 4. Optional thumbnail upload
    if (meta.thumbnailUrl) {
      youtubeProgressMap.set(projectId, { progress: 96, step: '썸네일 업로드 중' });
      try {
        const thumbKey = urlToR2Key(meta.thumbnailUrl);
        const rawBuffer = await downloadFromR2(thumbKey);

        const sharp = (await import('sharp')).default;
        const thumbBuffer = await sharp(rawBuffer)
          .resize(1280, 720, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toBuffer();

        const thumbTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('썸네일 업로드 타임아웃')), 30_000)
        );
        await Promise.race([
          YouTubeProvider.setThumbnail(result.videoId, thumbBuffer, channelId),
          thumbTimeout,
        ]);
      } catch (err) {
        console.warn(
          '[audiobook-youtube] Thumbnail failed (skipping):',
          err instanceof Error ? err.message : err
        );
      }
    }

    youtubeProgressMap.set(projectId, { progress: 100, step: '업로드 완료' });
    setTimeout(() => youtubeProgressMap.delete(projectId), 30_000);
  },

  async generateYouTubeMeta(
    storybookId: string,
    projectId: string,
    prompt: string
  ): Promise<YouTubeGeneratedMeta> {
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');

    const pages = storybook.pages ?? [];
    const lang = project.language ?? 'ko';

    const storybookInfo = [
      `Title: ${storybook.title}`,
      storybook.category ? `Category: ${storybook.category}` : '',
      `Type: Audiobook (animated storybook video)`,
      `Content Language: ${lang}`,
      `Aspect Ratio: ${project.aspectRatio}`,
      `Pages: ${pages.length}`,
      pages.length > 0
        ? `Content Summary:\n${pages
            .slice(0, 10)
            .map((p) => `- p${p.pageNumber}: ${getPageText(p, lang).slice(0, 100)}`)
            .join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const geminiPrompt = [
      prompt,
      '',
      '=== Storybook Info ===',
      storybookInfo,
      '',
      'Based on the above info and the user prompt, generate YouTube upload settings as JSON.',
      'Output ONLY the JSON below (no other text):',
      '{',
      '  "title": "video title",',
      '  "description": "video description",',
      '  "tags": ["tag1", "tag2", "tag3"],',
      '  "privacy": "public | private | unlisted",',
      '  "categoryId": "YouTube category ID (Education: 27, Entertainment: 24, People/Blogs: 22)",',
      '  "language": "ko | en"',
      '}',
      '',
      `IMPORTANT: The video content is in "${lang === 'ko' ? 'Korean' : 'English'}". Write the title, description, and tags in ${lang === 'ko' ? 'Korean' : 'English'}.`,
    ].join('\n');

    const raw = await generateTextWithGemini(geminiPrompt, 3);

    const cleaned = raw
      .replace(/```json?\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    try {
      const parsed = JSON.parse(cleaned) as YouTubeGeneratedMeta;
      return {
        title: parsed.title || storybook.title,
        description: parsed.description || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        privacy: ['public', 'private', 'unlisted'].includes(parsed.privacy)
          ? parsed.privacy
          : 'private',
        categoryId: parsed.categoryId || '27',
        language: parsed.language || lang,
      };
    } catch {
      console.error('[audiobook] Failed to parse Gemini YouTube meta response:', cleaned);
      throw new AppError(500, 'AI 응답을 파싱할 수 없습니다. 프롬프트를 수정해보세요.');
    }
  },

  // ----- YouTube Captions -----

  getCaptionProgress(projectId: string): RenderProgress | null {
    return captionProgressMap.get(projectId) ?? null;
  },

  setCaptionError(projectId: string, message: string) {
    captionProgressMap.set(projectId, { progress: -1, step: message });
    setTimeout(() => captionProgressMap.delete(projectId), 30_000);
  },

  async linkYouTubeVideo(
    storybookId: string,
    projectId: string,
    videoIdOrUrl: string
  ): Promise<{
    videoId: string;
    videoUrl: string;
    ownerConnected: boolean;
    channelTitle?: string;
  }> {
    const videoId = parseYouTubeVideoId(videoIdOrUrl);
    if (!videoId) throw new AppError(400, '유효한 YouTube 링크 또는 영상 ID가 아닙니다.');

    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');
    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');

    const meta = await YouTubeProvider.getVideoMeta(videoId);
    if (!meta) throw new AppError(404, '해당 영상을 찾을 수 없거나 비공개입니다.');

    project.youtubeUpload = {
      videoId,
      videoUrl: `https://youtu.be/${videoId}`,
      uploadedAt: meta.publishedAt,
      privacy: meta.privacyStatus,
      ...(meta.ownedByChannelId ? { channelId: meta.ownedByChannelId } : {}),
    };
    await R2Repository.saveStorybook(storybook);

    return {
      videoId,
      videoUrl: project.youtubeUpload.videoUrl,
      ownerConnected: !!meta.ownedByChannelId,
      channelTitle: meta.channelTitle,
    };
  },

  async generateCaptions(
    storybookId: string,
    projectId: string,
    languages: string[]
  ): Promise<{ baseLang: string; generatedCaptions: Record<string, GeneratedCaption> }> {
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');

    const baseLang = project.language || 'ko';
    const renderData = buildAudiobookRenderData(storybook, project);
    await probeTtsDurations(renderData);

    const baseSrt = generateSrt(renderData);
    if (!baseSrt.trim()) {
      throw new AppError(400, '자막으로 변환할 텍스트가 없습니다.');
    }

    const now = new Date().toISOString();
    const generated: Record<string, GeneratedCaption> = {
      ...(project.generatedCaptions ?? {}),
      [baseLang]: { srt: baseSrt, generatedAt: now },
    };
    for (const lang of languages) {
      if (lang === baseLang) continue;
      const translated = await translateSrt(baseSrt, baseLang, lang);
      generated[lang] = { srt: translated, generatedAt: new Date().toISOString() };
    }

    project.generatedCaptions = generated;
    await R2Repository.saveStorybook(storybook);
    return { baseLang, generatedCaptions: generated };
  },

  async uploadCaptions(storybookId: string, projectId: string, languages: string[]): Promise<void> {
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');
    if (!project.youtubeUpload?.videoId) {
      throw new AppError(400, 'YouTube에 업로드된 영상이 없습니다.');
    }

    const videoId = project.youtubeUpload.videoId;
    if (!project.generatedCaptions || Object.keys(project.generatedCaptions).length === 0) {
      throw new AppError(400, '먼저 SRT를 생성하세요.');
    }
    const cache = project.generatedCaptions;
    const targetLangs = languages.filter((l) => cache[l]);
    if (targetLangs.length === 0) {
      throw new AppError(400, '업로드할 언어의 SRT가 생성되어 있지 않습니다.');
    }

    const totalSteps = targetLangs.length;
    const uploaded: string[] = [];

    // Resolve the channel that owns this video (stored → auto-detect → save)
    let channelId = project.youtubeUpload.channelId;
    if (!channelId) {
      channelId = await YouTubeProvider.findChannelIdForVideo(videoId);
      if (channelId) {
        project.youtubeUpload.channelId = channelId;
        await R2Repository.saveStorybook(storybook);
      }
    }

    captionProgressMap.set(projectId, { progress: 0, step: '자막 업로드 시작' });

    const failed: { lang: string; error: string }[] = [];

    for (let i = 0; i < targetLangs.length; i++) {
      const lang = targetLangs[i];
      const stepNum = i + 1;
      captionProgressMap.set(projectId, {
        progress: Math.round((stepNum / totalSteps) * 100),
        step: `${lang} 자막 업로드 중`,
      });

      try {
        await YouTubeProvider.uploadCaption(videoId, lang, cache[lang].srt, undefined, channelId);
        uploaded.push(lang);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[audiobook-caption] Failed for ${lang}:`, err);
        failed.push({ lang, error: msg });
      }
    }

    // 5. Save results
    project.youtubeUpload.captionsUploaded = uploaded;
    project.youtubeUpload.captionsFailed = failed.length > 0 ? failed : undefined;
    await R2Repository.saveStorybook(storybook);

    if (uploaded.length === 0 && failed.length > 0) {
      const summary = failed.map((f) => `${f.lang}: ${f.error}`).join(' | ');
      captionProgressMap.set(projectId, {
        progress: -1,
        step: `모든 자막 업로드 실패 — ${summary}`,
      });
      setTimeout(() => captionProgressMap.delete(projectId), 30_000);
      return;
    }

    const step =
      failed.length > 0
        ? `완료 (${uploaded.length} 성공, ${failed.length} 실패: ${failed.map((f) => f.lang).join(', ')})`
        : '자막 업로드 완료';
    captionProgressMap.set(projectId, { progress: 100, step });
    setTimeout(() => captionProgressMap.delete(projectId), 30_000);
  },
};
