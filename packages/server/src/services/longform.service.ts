import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type {
  LongformProject,
  LongformScene,
  LongformSubtitleEntry,
  Page,
  Storybook,
} from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { GrokProvider } from '../providers/grok.provider.js';
import { PromptPresetService } from './prompt-preset.service.js';

const execFileAsync = promisify(execFile);

// ===== Progress tracking =====

interface ProgressInfo {
  progress: number;
  step: string;
  failed?: string[];
}

const progressMap = new Map<string, ProgressInfo>();
const renderProgressMap = new Map<string, ProgressInfo>();

// ===== ffmpeg helpers =====

async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  const ffmpegPath = (await import('ffmpeg-static')).default;
  await execFileAsync(ffmpegPath!, [
    '-i',
    videoPath,
    '-vn',
    '-acodec',
    'libmp3lame',
    '-y',
    audioPath,
  ]);
}

async function muteVideo(inputPath: string, outputPath: string): Promise<void> {
  const ffmpegPath = (await import('ffmpeg-static')).default;
  await execFileAsync(ffmpegPath!, ['-i', inputPath, '-an', '-vcodec', 'copy', '-y', outputPath]);
}

// ===== R2 key builders =====

function clipKey(storybookId: string, projectId: string, order: number): string {
  return `storybooks/${storybookId}/longform/${projectId}/clips/scene-${order}.mp4`;
}

function sfxKey(storybookId: string, projectId: string, order: number): string {
  return `storybooks/${storybookId}/longform/${projectId}/sfx/scene-${order}.mp3`;
}

function bgmKey(storybookId: string, projectId: string): string {
  return `storybooks/${storybookId}/longform/${projectId}/bgm.mp3`;
}

function outputKey(storybookId: string, projectId: string): string {
  return `storybooks/${storybookId}/longform/${projectId}/output.mp4`;
}

// ===== Helpers =====

function splitSentences(text: string): string[] {
  // Split by sentence-ending punctuation, keeping non-empty results
  return text
    .split(/(?<=[.!?。])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function buildSubtitles(sentences: string[], totalDuration: number): LongformSubtitleEntry[] {
  if (sentences.length === 0) return [];
  const perSentence = totalDuration / sentences.length;
  return sentences.map((text, i) => ({
    id: crypto.randomUUID(),
    text,
    startTime: +(i * perSentence).toFixed(2),
    endTime: +((i + 1) * perSentence).toFixed(2),
  }));
}

function loadProject(storybook: Storybook, projectId: string): LongformProject {
  const project = storybook.longformProjects?.find((p) => p.id === projectId);
  if (!project) throw new AppError(404, '롱폼 프로젝트를 찾을 수 없습니다.');
  return project;
}

async function loadStorybook(storybookId: string): Promise<Storybook> {
  const storybook = await R2Repository.getStorybook(storybookId);
  if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');
  return storybook;
}

function getPageText(page: Page, lang: string): string {
  if (lang !== 'ko' && page.translations?.[lang]?.text) {
    return page.translations[lang].text;
  }
  return page.text;
}

function getPageTtsUrl(page: Page, lang: string): string | undefined {
  if (lang !== 'ko' && page.translations?.[lang]?.ttsUrl) {
    return page.translations[lang].ttsUrl;
  }
  return page.ttsUrl;
}

// ===== Service =====

export const LongformService = {
  // ----- Analyze all scenes -----
  async analyze(
    storybookId: string,
    projectId: string,
    promptPresetId?: string
  ): Promise<LongformProject> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);
    const pages = storybook.pages ?? [];

    // Load system prompt from preset if provided
    let systemPrompt = '';
    const presetId = promptPresetId ?? project.promptPresetId;
    if (presetId) {
      try {
        const preset = await PromptPresetService.getById(presetId);
        systemPrompt = preset.systemPrompt;
      } catch {
        // preset not found - continue without system prompt
      }
    }

    const lang = project.language ?? 'ko';
    const scenes: LongformScene[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageText = getPageText(page, lang);
      const ttsUrl = getPageTtsUrl(page, lang);

      // Generate video prompt via Gemini
      const geminiPrompt = [
        systemPrompt ? `[System]\n${systemPrompt}\n` : '',
        `다음 동화책 페이지를 분석하고, 이 장면을 5-10초 영상으로 만들기 위한 영어 영상 프롬프트를 작성해주세요.`,
        `장면 설명에 카메라 움직임, 조명, 분위기를 포함해주세요.`,
        `\n[페이지 텍스트]\n${pageText}`,
        page.scene_description ? `\n[장면 묘사]\n${page.scene_description}` : '',
        page.illustrationUrl ? `\n[삽화 URL]\n${page.illustrationUrl}` : '',
        `\n영상 프롬프트만 출력해주세요 (다른 설명 없이):`,
      ]
        .filter(Boolean)
        .join('\n');

      const videoPrompt = await generateTextWithGemini(geminiPrompt);

      // Split text into sentences for subtitles
      const sentences = splitSentences(pageText);
      const clipDuration = 10; // default
      const subtitles = buildSubtitles(sentences, clipDuration);

      scenes.push({
        id: crypto.randomUUID(),
        pageNumber: page.pageNumber,
        videoPrompt: videoPrompt.trim(),
        clipDuration,
        sfxVolume: 50,
        ttsUrl,
        subtitles,
        order: i,
      });
    }

    // Update project with analyzed scenes
    project.scenes = scenes;
    if (presetId) project.promptPresetId = presetId;
    await R2Repository.saveStorybook(storybook);

    return project;
  },

  // ----- Analyze single scene -----
  async analyzeScene(
    storybookId: string,
    projectId: string,
    sceneId: string,
    promptPresetId?: string
  ): Promise<LongformScene> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) throw new AppError(404, '장면을 찾을 수 없습니다.');

    const pages = storybook.pages ?? [];
    const page = pages[scene.pageNumber - 1];
    if (!page) throw new AppError(404, '해당 페이지를 찾을 수 없습니다.');

    const lang = project.language ?? 'ko';
    const pageText = getPageText(page, lang);

    // Load system prompt
    let systemPrompt = '';
    const presetId = promptPresetId ?? project.promptPresetId;
    if (presetId) {
      try {
        const preset = await PromptPresetService.getById(presetId);
        systemPrompt = preset.systemPrompt;
      } catch {
        // continue without
      }
    }

    const geminiPrompt = [
      systemPrompt ? `[System]\n${systemPrompt}\n` : '',
      `다음 동화책 페이지를 분석하고, 이 장면을 5-10초 영상으로 만들기 위한 영어 영상 프롬프트를 작성해주세요.`,
      `장면 설명에 카메라 움직임, 조명, 분위기를 포함해주세요.`,
      `\n[페이지 텍스트]\n${pageText}`,
      page.scene_description ? `\n[장면 묘사]\n${page.scene_description}` : '',
      page.illustrationUrl ? `\n[삽화 URL]\n${page.illustrationUrl}` : '',
      `\n영상 프롬프트만 출력해주세요 (다른 설명 없이):`,
    ]
      .filter(Boolean)
      .join('\n');

    const videoPrompt = await generateTextWithGemini(geminiPrompt);
    const ttsUrl = getPageTtsUrl(page, lang);
    const sentences = splitSentences(pageText);
    const subtitles = buildSubtitles(sentences, scene.clipDuration);

    scene.videoPrompt = videoPrompt.trim();
    scene.ttsUrl = ttsUrl;
    scene.subtitles = subtitles;

    await R2Repository.saveStorybook(storybook);
    return scene;
  },

  // ----- Generate single clip -----
  async generateClip(
    storybookId: string,
    projectId: string,
    sceneId: string
  ): Promise<{ clipUrl: string; sfxUrl: string }> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) throw new AppError(404, '장면을 찾을 수 없습니다.');
    if (!scene.videoPrompt)
      throw new AppError(400, '영상 프롬프트가 없습니다. 먼저 분석을 실행하세요.');

    // Generate video via Grok
    const videoBuffer = await GrokProvider.generateClip(scene.videoPrompt, {
      aspectRatio: project.aspectRatio,
      duration: scene.clipDuration,
    });

    // Write to temp files and process with ffmpeg
    const workDir = path.join(os.tmpdir(), `tangobook-longform-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    const inputPath = path.join(workDir, 'input.mp4');
    const audioPath = path.join(workDir, 'audio.mp3');
    const mutedPath = path.join(workDir, 'muted.mp4');

    try {
      fs.writeFileSync(inputPath, videoBuffer);

      // Extract audio (SFX) and create muted video in parallel
      await Promise.all([extractAudio(inputPath, audioPath), muteVideo(inputPath, mutedPath)]);

      // Upload to R2
      const mutedBuffer = fs.readFileSync(mutedPath);
      const audioBuffer = fs.readFileSync(audioPath);

      const [clipUrl, sfxUrl] = await Promise.all([
        R2Repository.uploadBuffer(
          mutedBuffer,
          clipKey(storybookId, projectId, scene.order),
          'video/mp4'
        ),
        R2Repository.uploadBuffer(
          audioBuffer,
          sfxKey(storybookId, projectId, scene.order),
          'audio/mpeg'
        ),
      ]);

      // Update scene in storybook
      scene.clipUrl = clipUrl;
      scene.sfxUrl = sfxUrl;
      await R2Repository.saveStorybook(storybook);

      return { clipUrl, sfxUrl };
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  },

  // ----- Generate all clips -----
  async generateAll(storybookId: string, projectId: string): Promise<void> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    if (project.scenes.length === 0) {
      throw new AppError(400, '장면이 없습니다. 먼저 분석을 실행하세요.');
    }

    const total = project.scenes.length;
    const failed: string[] = [];

    progressMap.set(projectId, { progress: 0, step: '일괄 생성 시작' });

    // Process scenes sequentially to avoid API rate limits
    for (let i = 0; i < total; i++) {
      const scene = project.scenes[i];
      progressMap.set(projectId, {
        progress: Math.round((i / total) * 100),
        step: `장면 ${i + 1}/${total} 생성 중`,
        failed: failed.length > 0 ? failed : undefined,
      });

      try {
        await LongformService.generateClip(storybookId, projectId, scene.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[longform] 장면 ${scene.id} 생성 실패:`, msg);
        failed.push(`scene-${scene.order}: ${msg}`);
        // Skip and continue
      }
    }

    progressMap.set(projectId, {
      progress: 100,
      step: failed.length > 0 ? `완료 (${failed.length}개 실패)` : '완료',
      failed: failed.length > 0 ? failed : undefined,
    });

    // Clean up progress after 30s
    setTimeout(() => progressMap.delete(projectId), 30_000);
  },

  // ----- Get generation progress -----
  getProgress(projectId: string): ProgressInfo | null {
    return progressMap.get(projectId) ?? null;
  },

  // ----- Render final video (stub) -----
  async render(storybookId: string, projectId: string): Promise<{ outputUrl?: string }> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    // Stub: Python rendering script will be created in Task 11
    renderProgressMap.set(projectId, { progress: 0, step: '렌더링 대기 중 (미구현)' });

    // For now, just mark the output key path
    const _key = outputKey(storybookId, projectId);

    renderProgressMap.set(projectId, {
      progress: 100,
      step: '렌더링 미구현 (Task 11에서 구현 예정)',
    });
    setTimeout(() => renderProgressMap.delete(projectId), 30_000);

    return { outputUrl: project.outputUrl };
  },

  // ----- Get render progress -----
  getRenderProgress(projectId: string): ProgressInfo | null {
    return renderProgressMap.get(projectId) ?? null;
  },

  // ----- Upload BGM -----
  async uploadBgm(
    file: Express.Multer.File,
    storybookId: string,
    projectId: string
  ): Promise<{ bgmUrl: string }> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    const key = bgmKey(storybookId, projectId);
    const bgmUrl = await R2Repository.uploadBuffer(file.buffer, key, file.mimetype || 'audio/mpeg');

    project.bgmUrl = bgmUrl;
    await R2Repository.saveStorybook(storybook);

    return { bgmUrl };
  },
};
