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
} from '@tangobook/shared';
import { getAudioDuration } from '../utils/audio-duration.js';
import { YouTubeProvider } from '../providers/youtube.provider.js';
import { downloadFromR2, urlToR2Key } from '../providers/r2.provider.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { generateSrt } from '../utils/srt-generator.js';
import { translateSrt } from '../utils/srt-translator.js';

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
  if (cachedBundlePath && fs.existsSync(cachedBundlePath)) {
    return cachedBundlePath;
  }
  const { bundle } = await loadRemotion();
  // entry.ts contains registerRoot() — required for Remotion bundling
  const remotionEntry = path.resolve(__dirname, '../../../remotion/src/entry.ts');
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

    // 2. Build render props
    const renderData = buildAudiobookRenderData(storybook, project);
    if (renderData.slides.length === 0) {
      throw new AppError(400, '렌더링할 페이지가 없습니다 (삽화가 있는 페이지 필요).');
    }

    renderProgressMap.set(projectId, { progress: 0, step: 'TTS 길이 측정 중' });

    // 2.5. Probe TTS durations for accurate slide timing
    await probeTtsDurations(renderData, (i, total) => {
      const percent = Math.round((i / total) * 4); // 0-4%
      renderProgressMap.set(projectId, {
        progress: percent,
        step: `TTS 길이 측정 중 (${i}/${total})`,
      });
    });

    const workDir = path.join(os.tmpdir(), `audiobook-${projectId}-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    try {
      // 3. Bundle (cached)
      renderProgressMap.set(projectId, { progress: 5, step: 'Remotion 번들링' });
      const bundlePath = await getBundlePath();

      // 4. Load Remotion + Select composition
      renderProgressMap.set(projectId, { progress: 10, step: '컴포지션 준비' });
      const { selectComposition, renderMedia } = await loadRemotion();
      const composition = await selectComposition({
        serveUrl: bundlePath,
        id: 'Audiobook',
        inputProps: renderData,
      });

      // 5. Render
      const outputPath = path.join(workDir, 'output.mp4');
      renderProgressMap.set(projectId, { progress: 15, step: '렌더링 중' });

      await renderMedia({
        composition,
        serveUrl: bundlePath,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: renderData,
        timeoutInMilliseconds: 600000, // 10 minutes
        // faststart: moov atom을 파일 앞으로 → 브라우저 스트리밍 재생 가능
        chromiumOptions: { gl: 'angle' },
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

      renderProgressMap.set(projectId, { progress: 100, step: '완료' });
      setTimeout(() => renderProgressMap.delete(projectId), 30_000);

      return { outputUrl };
    } catch (err: any) {
      renderProgressMap.set(projectId, {
        progress: -1,
        step: '렌더링 실패',
        error: err.message || '알 수 없는 오류',
      });
      setTimeout(() => renderProgressMap.delete(projectId), 30_000);
      throw err;
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
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
    meta: YouTubeUploadMeta
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
    const result = await YouTubeProvider.uploadVideo(videoBuffer, meta, (percent) => {
      const mapped = 10 + Math.round(percent * 0.85);
      youtubeProgressMap.set(projectId, {
        progress: mapped,
        step: `YouTube 업로드 중 (${mapped}%)`,
      });
    });

    // 3. Save result immediately (before thumbnail — prevents loss on thumbnail failure)
    project.youtubeUpload = {
      videoId: result.videoId,
      videoUrl: result.videoUrl,
      uploadedAt: new Date().toISOString(),
      privacy: meta.privacy,
    };
    await R2Repository.saveStorybook(storybook);

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
          YouTubeProvider.setThumbnail(result.videoId, thumbBuffer),
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

  async uploadCaptions(storybookId: string, projectId: string, languages: string[]): Promise<void> {
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p: AudiobookProject) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');
    if (!project.youtubeUpload?.videoId) {
      throw new AppError(400, 'YouTube에 업로드된 영상이 없습니다.');
    }

    const videoId = project.youtubeUpload.videoId;
    const baseLang = project.language || 'ko';
    const allLanguages = [baseLang, ...languages.filter((l) => l !== baseLang)];
    const totalSteps = allLanguages.length + 1; // +1 for SRT generation
    const uploaded: string[] = [];

    captionProgressMap.set(projectId, { progress: 0, step: 'SRT 자막 생성 중' });

    // 1. Build render data + probe TTS durations
    const renderData = buildAudiobookRenderData(storybook, project);
    await probeTtsDurations(renderData);

    // 2. Generate base SRT
    const baseSrt = generateSrt(renderData);
    if (!baseSrt.trim()) {
      throw new AppError(400, '자막으로 변환할 텍스트가 없습니다.');
    }

    captionProgressMap.set(projectId, {
      progress: Math.round((1 / totalSteps) * 100),
      step: `${baseLang} 자막 업로드 중`,
    });

    // 3. Upload base language caption
    try {
      await YouTubeProvider.uploadCaption(videoId, baseLang, baseSrt);
      uploaded.push(baseLang);
    } catch (err) {
      console.warn(`[audiobook-caption] Failed to upload ${baseLang}:`, err);
    }

    // 4. Translate and upload each additional language
    for (let i = 0; i < allLanguages.length; i++) {
      const lang = allLanguages[i];
      if (lang === baseLang) continue; // already uploaded

      const stepNum = uploaded.length + 1;
      captionProgressMap.set(projectId, {
        progress: Math.round((stepNum / totalSteps) * 100),
        step: `${lang} 자막 번역 + 업로드 중`,
      });

      try {
        const translatedSrt = await translateSrt(baseSrt, baseLang, lang);
        await YouTubeProvider.uploadCaption(videoId, lang, translatedSrt);
        uploaded.push(lang);
      } catch (err) {
        console.warn(`[audiobook-caption] Failed for ${lang}:`, err);
        // Continue with other languages
      }
    }

    // 5. Save results
    project.youtubeUpload.captionsUploaded = uploaded;
    await R2Repository.saveStorybook(storybook);

    captionProgressMap.set(projectId, { progress: 100, step: '자막 업로드 완료' });
    setTimeout(() => captionProgressMap.delete(projectId), 30_000);
  },
};
