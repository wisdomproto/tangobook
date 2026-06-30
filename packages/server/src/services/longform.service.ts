import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile, execSync } from 'child_process';
import { promisify } from 'util';
import type {
  LongformProject,
  LongformScene,
  LongformSubtitleEntry,
  Page,
  Storybook,
  YouTubeUploadMeta,
  YouTubeGeneratedMeta,
  GeneratedCaption,
} from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';
import { R2Repository } from '../repositories/r2.repository.js';
import {
  deleteFromR2,
  downloadFromR2,
  urlToR2Key,
  r2PublicUrl,
  listR2Objects,
  createPresignedUploadUrl,
} from '../providers/r2.provider.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { GrokProvider } from '../providers/grok.provider.js';
import { generateLongform, cancelRender } from '../providers/longform.provider.js';
import type { LongformRenderOptions } from '../providers/longform.provider.js';
import { YouTubeProvider } from '../providers/youtube.provider.js';
import { PromptPresetService } from './prompt-preset.service.js';
import { getAudioDuration } from '../utils/audio-duration.js';
import { generateLongformSrt } from '../utils/srt-generator.js';
import { translateSrt } from '../utils/srt-translator.js';
import { parseYouTubeVideoId } from '../utils/youtube-url.js';

const execFileAsync = promisify(execFile);

// ===== Progress tracking =====

interface ProgressInfo {
  progress: number;
  step: string;
  error?: string;
  failed?: string[];
  updatedAt?: number;
}

const analyzeProgressMap = new Map<string, ProgressInfo>();
const progressMap = new Map<string, ProgressInfo>();
const renderProgressMap = new Map<string, ProgressInfo>();
const shortformProgressMap = new Map<string, ProgressInfo>();
const youtubeProgressMap = new Map<string, ProgressInfo>();
const captionProgressMap = new Map<string, ProgressInfo>();

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

// getAudioDuration moved to ../utils/audio-duration.ts

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
  const raw = text
    .split(/(?<=[.!?。])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Clean up: strip leading/trailing lone quotes
  const cleaned = raw
    .map((s) =>
      s
        .replace(/\s*[""''"']\s*$/, '')
        .replace(/^[""''"']\s*/, '')
        .trim()
    )
    .filter((s) => s.length > 0);

  // Merge fragments that are too short (< 5 chars)
  const merged: string[] = [];
  for (const s of cleaned) {
    if (s.length < 5 && merged.length > 0) {
      merged[merged.length - 1] += ' ' + s;
    } else if (s.length < 5) {
      // skip leading tiny fragments
    } else {
      merged.push(s);
    }
  }
  return merged;
}

function buildSubtitles(sentences: string[], totalDuration: number): LongformSubtitleEntry[] {
  if (sentences.length === 0) return [];

  // Weight by text length so longer sentences get more time
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  if (totalChars === 0) return [];

  let cursor = 0;
  return sentences.map((text) => {
    const weight = text.length / totalChars;
    const duration = totalDuration * weight;
    const startTime = +cursor.toFixed(2);
    cursor += duration;
    const endTime = +cursor.toFixed(2);
    return { id: crypto.randomUUID(), text, startTime, endTime };
  });
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
    promptPresetId?: string,
    model?: string,
    excludePages?: number[]
  ): Promise<LongformProject> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);
    const allPages = storybook.pages ?? [];
    const pages = excludePages?.length
      ? allPages.filter((p) => !excludePages.includes(p.pageNumber))
      : allPages;

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
    const total = pages.length;

    // 재분석 시 기존 씬의 클립/편집 정보 보존 (pageNumber 매칭)
    const prevByPage = new Map<number, LongformScene>();
    for (const s of project.scenes ?? []) {
      if (typeof s.pageNumber === 'number') prevByPage.set(s.pageNumber, s);
    }

    analyzeProgressMap.set(projectId, {
      progress: 0,
      step: `분석 시작 (${total}페이지)`,
      updatedAt: Date.now(),
    });

    // 하트비트: Gemini 재시도 등으로 오래 걸릴 때 updatedAt만 계속 갱신해서
    // 클라이언트의 stale detection이 오탐하지 않게 함.
    const heartbeat = setInterval(() => {
      const curr = analyzeProgressMap.get(projectId);
      if (curr) analyzeProgressMap.set(projectId, { ...curr, updatedAt: Date.now() });
    }, 15_000);

    let prevVideoPrompt = '';

    try {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageText = getPageText(page, lang);
        const ttsUrl = getPageTtsUrl(page, lang);

        analyzeProgressMap.set(projectId, {
          progress: Math.round((i / total) * 100),
          step: `페이지 ${i + 1}/${total} 분석 중`,
          updatedAt: Date.now(),
        });

        // Calculate clip duration from TTS audio length first (needed for prompt)
        let ttsDuration: number | undefined;
        if (ttsUrl) {
          try {
            ttsDuration = await getAudioDuration(ttsUrl);
          } catch {
            console.warn(`[longform] TTS 길이 측정 실패 page=${page.pageNumber}, 기본값 사용`);
          }
        }
        const clipDuration = ttsDuration
          ? Math.min(15, Math.max(5, Math.ceil(ttsDuration) + 2))
          : 10;

        // Generate video prompt via Gemini
        const geminiPrompt = [
          systemPrompt ? `[System]\n${systemPrompt}\n` : '',
          `다음 동화책 페이지를 분석하고, 이 장면을 ${clipDuration}초 영상으로 만들기 위한 영어 영상 프롬프트를 작성해주세요.`,
          `장면 설명에 카메라 움직임, 조명, 분위기를 포함해주세요.`,
          prevVideoPrompt
            ? `이전 장면과의 시각적 연속성을 위해, 이전 장면의 카메라 방향과 움직임을 참고하여 자연스럽게 이어지도록 해주세요.\n[이전 장면 프롬프트]\n${prevVideoPrompt}\n`
            : '',
          `중요: 영상에 텍스트, 자막, 말풍선, 음성, 음악이 포함되지 않도록 프롬프트에 "no text, no subtitles, no speech, no voice-over, no music"를 반드시 포함해주세요.`,
          `\n[페이지 텍스트]\n${pageText}`,
          page.scene_description ? `\n[장면 묘사]\n${page.scene_description}` : '',
          page.illustrationUrl ? `\n[삽화 URL]\n${page.illustrationUrl}` : '',
          `\n영상 프롬프트만 출력해주세요 (다른 설명 없이):`,
        ]
          .filter(Boolean)
          .join('\n');

        const videoPrompt = await generateTextWithGemini(geminiPrompt, 3, model);

        // Split text into sentences for subtitles
        const sentences = splitSentences(pageText);
        const subtitles = buildSubtitles(sentences, clipDuration);

        const trimmedPrompt = videoPrompt.trim();
        prevVideoPrompt = trimmedPrompt;

        const prev = prevByPage.get(page.pageNumber);

        scenes.push({
          id: prev?.id ?? crypto.randomUUID(),
          pageNumber: page.pageNumber,
          videoPrompt: trimmedPrompt,
          clipDuration,
          sfxVolume: prev?.sfxVolume ?? 60,
          ttsUrl,
          ttsVolume: prev?.ttsVolume ?? 70,
          ttsDuration,
          subtitles,
          order: i,
          // 기존 생성물 + 편집 정보 보존 (언어별 재분석 시 클립 재사용)
          clipUrl: prev?.clipUrl,
          clipHistory: prev?.clipHistory,
          trimStart: prev?.trimStart,
          trimEnd: prev?.trimEnd,
          sfxUrl: prev?.sfxUrl,
          sfxOffset: prev?.sfxOffset,
          ttsOffset: prev?.ttsOffset,
        });
      }

      // Update project with analyzed scenes
      project.scenes = scenes;
      if (presetId) project.promptPresetId = presetId;
      await R2Repository.saveStorybook(storybook);

      analyzeProgressMap.set(projectId, {
        progress: 100,
        step: '분석 완료',
        updatedAt: Date.now(),
      });
      setTimeout(() => analyzeProgressMap.delete(projectId), 30_000);

      return project;
    } finally {
      clearInterval(heartbeat);
    }
  },

  // ----- Manual setup (no AI) — probe TTS durations and rebuild subtitle timing only -----
  async analyzeManual(
    storybookId: string,
    projectId: string,
    excludePages?: number[]
  ): Promise<LongformProject> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);
    const allPages = storybook.pages ?? [];
    const pages = excludePages?.length
      ? allPages.filter((p) => !excludePages.includes(p.pageNumber))
      : allPages;

    const lang = project.language ?? 'ko';
    const scenes: LongformScene[] = [];
    const total = pages.length;

    const prevByPage = new Map<number, LongformScene>();
    for (const s of project.scenes ?? []) {
      if (typeof s.pageNumber === 'number') prevByPage.set(s.pageNumber, s);
    }

    analyzeProgressMap.set(projectId, {
      progress: 0,
      step: `수동 설정 시작 (${total}페이지)`,
      updatedAt: Date.now(),
    });

    const heartbeat = setInterval(() => {
      const curr = analyzeProgressMap.get(projectId);
      if (curr) analyzeProgressMap.set(projectId, { ...curr, updatedAt: Date.now() });
    }, 15_000);

    try {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageText = getPageText(page, lang);
        const ttsUrl = getPageTtsUrl(page, lang);

        analyzeProgressMap.set(projectId, {
          progress: Math.round((i / total) * 100),
          step: `페이지 ${i + 1}/${total} TTS 길이 측정 중`,
          updatedAt: Date.now(),
        });

        let ttsDuration: number | undefined;
        if (ttsUrl) {
          try {
            ttsDuration = await getAudioDuration(ttsUrl);
          } catch {
            console.warn(`[longform] TTS 길이 측정 실패 page=${page.pageNumber}, 기본값 사용`);
          }
        }
        const clipDuration = ttsDuration
          ? Math.min(15, Math.max(5, Math.ceil(ttsDuration) + 2))
          : 10;

        const sentences = splitSentences(pageText);
        const subtitles = buildSubtitles(sentences, clipDuration);

        const prev = prevByPage.get(page.pageNumber);

        scenes.push({
          id: prev?.id ?? crypto.randomUUID(),
          pageNumber: page.pageNumber,
          // AI 없이 수동 설정 — 기존 프롬프트가 있으면 보존, 없으면 빈 값 (사용자가 직접 입력)
          videoPrompt: prev?.videoPrompt ?? '',
          clipDuration,
          sfxVolume: prev?.sfxVolume ?? 60,
          ttsUrl,
          ttsVolume: prev?.ttsVolume ?? 70,
          ttsDuration,
          subtitles,
          order: i,
          clipUrl: prev?.clipUrl,
          clipHistory: prev?.clipHistory,
          trimStart: prev?.trimStart,
          trimEnd: prev?.trimEnd,
          sfxUrl: prev?.sfxUrl,
          sfxOffset: prev?.sfxOffset,
          ttsOffset: prev?.ttsOffset,
        });
      }

      project.scenes = scenes;
      await R2Repository.saveStorybook(storybook);

      analyzeProgressMap.set(projectId, {
        progress: 100,
        step: '수동 설정 완료',
        updatedAt: Date.now(),
      });
      setTimeout(() => analyzeProgressMap.delete(projectId), 30_000);

      return project;
    } finally {
      clearInterval(heartbeat);
    }
  },

  // ----- Analyze single scene -----
  async analyzeScene(
    storybookId: string,
    projectId: string,
    sceneId: string,
    promptPresetId?: string,
    model?: string
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

    // Motion Matching: 이전 장면의 프롬프트를 참고
    const prevScene = project.scenes
      .filter((s) => s.order < scene.order)
      .sort((a, b) => b.order - a.order)[0];
    const prevVideoPrompt = prevScene?.videoPrompt ?? '';

    const ttsUrl = getPageTtsUrl(page, lang);

    // Calculate clip duration from TTS length first (needed for prompt)
    let ttsDuration: number | undefined;
    if (ttsUrl) {
      try {
        ttsDuration = await getAudioDuration(ttsUrl);
      } catch {
        console.warn(`[longform] TTS 길이 측정 실패 scene=${sceneId}, 기본값 유지`);
      }
    }
    if (ttsDuration) {
      scene.clipDuration = Math.min(15, Math.max(5, Math.ceil(ttsDuration) + 2));
      scene.ttsDuration = ttsDuration;
    }

    const geminiPrompt = [
      systemPrompt ? `[System]\n${systemPrompt}\n` : '',
      `다음 동화책 페이지를 분석하고, 이 장면을 ${scene.clipDuration}초 영상으로 만들기 위한 영어 영상 프롬프트를 작성해주세요.`,
      `장면 설명에 카메라 움직임, 조명, 분위기를 포함해주세요.`,
      prevVideoPrompt
        ? `이전 장면과의 시각적 연속성을 위해, 이전 장면의 카메라 방향과 움직임을 참고하여 자연스럽게 이어지도록 해주세요.\n[이전 장면 프롬프트]\n${prevVideoPrompt}\n`
        : '',
      `중요: 영상에 텍스트, 자막, 말풍선, 음성, 음악이 포함되지 않도록 프롬프트에 "no text, no subtitles, no speech, no voice-over, no music"를 반드시 포함해주세요.`,
      `\n[페이지 텍스트]\n${pageText}`,
      page.scene_description ? `\n[장면 묘사]\n${page.scene_description}` : '',
      page.illustrationUrl ? `\n[삽화 URL]\n${page.illustrationUrl}` : '',
      `\n영상 프롬프트만 출력해주세요 (다른 설명 없이):`,
    ]
      .filter(Boolean)
      .join('\n');

    const videoPrompt = await generateTextWithGemini(geminiPrompt, 3, model);

    const sentences = splitSentences(pageText);
    const subtitles = buildSubtitles(sentences, scene.clipDuration);

    scene.videoPrompt = videoPrompt.trim();
    scene.ttsUrl = ttsUrl;
    scene.subtitles = subtitles;

    await R2Repository.saveStorybook(storybook);
    return scene;
  },

  // ----- Generate single clip -----
  /**
   * Generate a single clip. Uploads to R2 and returns URLs.
   * If skipSave=true, caller is responsible for saving storybook (used by generateAll).
   */
  async generateClip(
    storybookId: string,
    projectId: string,
    sceneId: string,
    { skipSave = false }: { skipSave?: boolean } = {}
  ): Promise<{ clipUrl: string; sfxUrl: string }> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) throw new AppError(404, '장면을 찾을 수 없습니다.');
    if (!scene.videoPrompt)
      throw new AppError(400, '영상 프롬프트가 없습니다. 먼저 분석을 실행하세요.');

    // Find the page illustration to use as first frame
    const page = storybook.pages.find((p) => p.pageNumber === scene.pageNumber);
    const imageUrl = page?.illustrationUrl;

    // Generate video via Grok (append "no music" to avoid baked-in BGM)
    const prompt = scene.videoPrompt.includes('no music')
      ? scene.videoPrompt
      : `${scene.videoPrompt}, no music`;
    const videoBuffer = await GrokProvider.generateClip(prompt, {
      aspectRatio: project.aspectRatio,
      duration: scene.clipDuration,
      imageUrl,
    });

    // Write to temp files and process with ffmpeg
    const workDir = path.join(os.tmpdir(), `tangobook-longform-${Date.now()}-${sceneId}`);
    fs.mkdirSync(workDir, { recursive: true });

    const inputPath = path.join(workDir, 'input.mp4');
    const audioPath = path.join(workDir, 'audio.mp3');

    try {
      fs.writeFileSync(inputPath, videoBuffer);

      // Extract audio (SFX) separately for timeline use
      await extractAudio(inputPath, audioPath);

      // Upload original video (with sound) and extracted audio to R2
      const audioBuffer = fs.readFileSync(audioPath);

      const [clipUrl, sfxUrl] = await Promise.all([
        R2Repository.uploadBuffer(
          videoBuffer,
          clipKey(storybookId, projectId, scene.order),
          'video/mp4'
        ),
        R2Repository.uploadBuffer(
          audioBuffer,
          sfxKey(storybookId, projectId, scene.order),
          'audio/mpeg'
        ),
      ]);

      if (!skipSave) {
        // Single clip generation: update scene and save immediately
        if (scene.clipUrl) {
          if (!scene.clipHistory) scene.clipHistory = [];
          scene.clipHistory.push(scene.clipUrl);
        }
        scene.clipUrl = clipUrl;
        scene.sfxUrl = sfxUrl;
        await R2Repository.saveStorybook(storybook);
      }

      return { clipUrl, sfxUrl };
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  },

  // ----- Generate all clips (with optional range) -----
  async generateAll(
    storybookId: string,
    projectId: string,
    startPage?: number,
    endPage?: number
  ): Promise<void> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    if (project.scenes.length === 0) {
      throw new AppError(400, '장면이 없습니다. 먼저 분석을 실행하세요.');
    }

    // Filter scenes by page range if specified
    const targetScenes = project.scenes.filter((s) => {
      if (startPage != null && s.pageNumber < startPage) return false;
      if (endPage != null && s.pageNumber > endPage) return false;
      return true;
    });

    if (targetScenes.length === 0) {
      throw new AppError(400, '지정된 범위에 해당하는 장면이 없습니다.');
    }

    const total = targetScenes.length;
    const failed: string[] = [];
    const rangeLabel =
      startPage != null || endPage != null
        ? ` (p.${startPage ?? 1}~${endPage ?? project.scenes.length})`
        : '';

    const CONCURRENCY = 3;
    let completed = 0;

    progressMap.set(projectId, { progress: 0, step: `일괄 생성 시작${rangeLabel}` });

    // Process scenes in parallel batches (3 concurrent)
    // Use skipSave to avoid concurrent write conflicts, then batch-save after each group
    for (let i = 0; i < total; i += CONCURRENCY) {
      const batch = targetScenes.slice(i, i + CONCURRENCY);

      progressMap.set(projectId, {
        progress: Math.round((completed / total) * 100),
        step: `장면 ${completed + 1}~${Math.min(completed + batch.length, total)}/${total} 생성 중`,
        failed: failed.length > 0 ? failed : undefined,
      });

      const results = await Promise.allSettled(
        batch.map((scene) =>
          LongformService.generateClip(storybookId, projectId, scene.id, { skipSave: true })
        )
      );

      // Reload storybook once, apply all results from this batch, save once
      const freshStorybook = await loadStorybook(storybookId);
      const freshProject = loadProject(freshStorybook, projectId);

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const scene = freshProject.scenes.find((s) => s.id === batch[j].id);
        if (!scene) continue;

        if (result.status === 'fulfilled') {
          if (scene.clipUrl) {
            if (!scene.clipHistory) scene.clipHistory = [];
            scene.clipHistory.push(scene.clipUrl);
          }
          scene.clipUrl = result.value.clipUrl;
          scene.sfxUrl = result.value.sfxUrl;
        } else {
          const msg =
            result.reason instanceof Error ? result.reason.message : String(result.reason);
          console.error(`[longform] 장면 ${batch[j].id} 생성 실패:`, msg);
          failed.push(`p.${batch[j].pageNumber}: ${msg}`);
        }
      }

      await R2Repository.saveStorybook(freshStorybook);
      completed += batch.length;
    }

    progressMap.set(projectId, {
      progress: 100,
      step: failed.length > 0 ? `완료 (${failed.length}개 실패)` : '완료',
      failed: failed.length > 0 ? failed : undefined,
    });

    // Clean up progress after 30s
    setTimeout(() => progressMap.delete(projectId), 30_000);
  },

  // ----- Get analyze progress -----
  getAnalyzeProgress(projectId: string): ProgressInfo | null {
    return analyzeProgressMap.get(projectId) ?? null;
  },

  // ----- Set analyze error (called from controller catch) -----
  setAnalyzeError(projectId: string, message: string) {
    analyzeProgressMap.set(projectId, {
      progress: -1,
      step: '분석 실패',
      error: message,
      updatedAt: Date.now(),
    });
    setTimeout(() => analyzeProgressMap.delete(projectId), 30_000);
  },

  // ----- Get generation progress -----
  getProgress(projectId: string): ProgressInfo | null {
    return progressMap.get(projectId) ?? null;
  },

  // ----- Render final video -----
  async render(storybookId: string, projectId: string): Promise<{ outputUrl?: string }> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    if (project.scenes.length === 0) {
      throw new AppError(400, '장면이 없습니다. 먼저 분석을 실행하세요.');
    }

    // 클립이 없는 장면 확인
    const readyScenes = project.scenes.filter((s) => s.clipUrl);
    if (readyScenes.length === 0) {
      throw new AppError(400, '생성된 클립이 없습니다. 먼저 클립을 생성하세요.');
    }

    // Delete previous render output from R2 if exists
    if (project.outputUrl) {
      try {
        const oldKey = urlToR2Key(project.outputUrl);
        await deleteFromR2(oldKey);
        console.log('[longform] Deleted previous render:', oldKey);
      } catch {
        // Ignore — old file may already be gone
      }
    }

    // 임시 작업 디렉토리 생성
    const workDir = path.join(os.tmpdir(), `tangobook-longform-render-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });
    const outputPath = path.join(workDir, 'output.mp4');

    try {
      // 렌더 옵션 준비
      const renderOptions: LongformRenderOptions = {
        scenes: readyScenes
          .sort((a, b) => a.order - b.order)
          .map((scene) => ({
            clipUrl: scene.clipUrl!,
            sfxUrl: scene.sfxUrl,
            sfxVolume: scene.sfxVolume,
            sfxOffset: scene.sfxOffset,
            ttsUrl: scene.ttsUrl,
            ttsVolume: scene.ttsVolume,
            ttsOffset: scene.ttsOffset,
            subtitles: scene.subtitles.map((sub) => ({
              text: sub.text,
              startTime: sub.startTime,
              endTime: sub.endTime,
            })),
            clipDuration: scene.clipDuration,
            trimStart: scene.trimStart,
            trimEnd: scene.trimEnd,
          })),
        bgmUrl: project.bgmUrl,
        bgmVolume: project.bgmVolume,
        aspectRatio: project.aspectRatio,
        subtitleStyle: {
          fontSize: project.subtitleStyle.fontSize,
          position: project.subtitleStyle.position,
          textColor: project.subtitleStyle.textColor,
          outlineColor: project.subtitleStyle.outlineColor,
          bgColor: project.subtitleStyle.bgColor,
        },
        workDir,
        outputPath,
      };

      // Python 렌더링 스크립트 실행
      console.log(`[longform] Starting render: ${readyScenes.length} scenes, workDir: ${workDir}`);
      renderProgressMap.set(projectId, { progress: 0, step: '렌더링 시작' });
      await generateLongform(
        renderOptions,
        (info) => {
          renderProgressMap.set(projectId, info);
        },
        projectId
      );

      renderProgressMap.set(projectId, { progress: 95, step: 'R2 업로드 중' });

      // 결과 파일을 R2에 업로드
      const videoBuffer = fs.readFileSync(outputPath);
      const key = outputKey(storybookId, projectId);
      const outputUrl = await R2Repository.uploadBuffer(videoBuffer, key, 'video/mp4');

      // 결과 URL을 스토리북에 저장
      project.outputUrl = outputUrl;
      project.createdAt = new Date().toISOString();
      await R2Repository.saveStorybook(storybook);

      renderProgressMap.set(projectId, { progress: 100, step: '완료' });
      setTimeout(() => renderProgressMap.delete(projectId), 30_000);

      return { outputUrl };
    } finally {
      // 임시 디렉토리 정리
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  },

  // ----- Render manifest (전처리된 씬 URL 반환) -----
  async renderManifest(storybookId: string, projectId: string) {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    const readyScenes = project.scenes.filter((s) => s.clipUrl).sort((a, b) => a.order - b.order);
    if (readyScenes.length === 0) throw new AppError(400, '생성된 클립이 없습니다.');

    return {
      scenes: readyScenes.map((scene, i) => {
        // 전처리된 클립 URL (prepareRender에서 업로드됨)
        const processedClipUrl = `${r2PublicUrl}/storybooks/${storybookId}/longform/${projectId}/prepared/scene_${i}.mp4`;
        return {
          processedClipUrl,
          sfxUrl: scene.sfxUrl,
          sfxVolume: scene.sfxVolume,
          sfxOffset: scene.sfxOffset,
          ttsUrl: scene.ttsUrl,
          ttsVolume: scene.ttsVolume,
          ttsOffset: scene.ttsOffset,
          clipDuration: scene.clipDuration,
          trimStart: scene.trimStart,
          trimEnd: scene.trimEnd,
        };
      }),
      bgmUrl: project.bgmUrl,
      bgmVolume: project.bgmVolume,
      aspectRatio: project.aspectRatio,
    };
  },

  // ----- Prepare render (씬별 자막 burn-in → R2 업로드) -----
  async prepareRender(storybookId: string, projectId: string) {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    if (project.scenes.length === 0) throw new AppError(400, '장면이 없습니다.');
    const readyScenes = project.scenes.filter((s) => s.clipUrl).sort((a, b) => a.order - b.order);
    if (readyScenes.length === 0) throw new AppError(400, '생성된 클립이 없습니다.');

    const total = readyScenes.length;
    renderProgressMap.set(projectId, { progress: 0, step: '씬 전처리 시작' });

    // drawtext 필터는 libfreetype 필요 → 프로덕션에서는 시스템 ffmpeg 사용
    const ffmpegPath =
      process.env.NODE_ENV === 'production' ? 'ffmpeg' : (await import('ffmpeg-static')).default!;
    const workDir = path.join(os.tmpdir(), `tangobook-prepare-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    const [w, h] =
      project.aspectRatio === '9:16'
        ? [1080, 1920]
        : project.aspectRatio === '1:1'
          ? [1080, 1080]
          : [1920, 1080];

    // 한글 폰트 (Dockerfile에서 NanumGothic 설치됨)
    const FONT_PATHS = [
      '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
      'C:/Windows/Fonts/malgun.ttf',
      'C:/Windows/Fonts/NanumGothic.ttf',
    ];
    const fontFile = FONT_PATHS.find((p) => fs.existsSync(p)) ?? '';

    const processedScenes: Array<{
      processedClipUrl: string;
      sfxUrl?: string;
      sfxVolume: number;
      sfxOffset?: number;
      ttsUrl?: string;
      ttsVolume?: number;
      ttsOffset?: number;
      clipDuration: number;
      trimStart?: number;
      trimEnd?: number;
    }> = [];

    try {
      for (let i = 0; i < total; i++) {
        const scene = readyScenes[i];
        renderProgressMap.set(projectId, {
          progress: Math.floor((i / total) * 90),
          step: `씬 ${i + 1}/${total} 자막 처리 중`,
        });

        // 클립 다운로드
        const clipKey = urlToR2Key(scene.clipUrl!);
        const clipBuf = await downloadFromR2(clipKey);
        const clipPath = path.join(workDir, `scene_${i}.mp4`);
        fs.writeFileSync(clipPath, clipBuf);

        const outputPath = path.join(workDir, `processed_${i}.mp4`);
        const trimStart = scene.trimStart ?? 0;
        const trimEnd = scene.trimEnd ?? 0;
        const duration = scene.clipDuration - trimStart - trimEnd;

        const subs = scene.subtitles.filter((s) => s.text.trim());

        if (subs.length > 0) {
          // drawtext 필터로 자막 burn-in
          const fontSize = project.subtitleStyle.fontSize || 44;
          const textColor = project.subtitleStyle.textColor.replace('#', '');
          const outlineColor = project.subtitleStyle.outlineColor.replace('#', '');
          const pos = project.subtitleStyle.position;
          const yExpr = pos === 'top' ? '40' : pos === 'center' ? '(h-th)/2' : `h-th-40`;

          // 여러 자막을 drawtext 필터 체인으로 연결
          const drawtextFilters = subs.map((sub) => {
            const escapedText = sub.text
              .replace(/\\/g, '\\\\\\\\')
              .replace(/'/g, "'\\\\\\''")
              .replace(/:/g, '\\\\:')
              .replace(/,/g, '\\\\,');
            const fontParam = fontFile ? `:fontfile='${fontFile}'` : '';
            return `drawtext=text='${escapedText}':fontsize=${fontSize}${fontParam}:fontcolor=0x${textColor}:borderw=2:bordercolor=0x${outlineColor}:x=(w-tw)/2:y=${yExpr}:enable='between(t,${sub.startTime},${sub.endTime})'`;
          });

          const filterStr = `scale=${w}:${h},${drawtextFilters.join(',')}`;

          const args = [
            '-i',
            clipPath,
            ...(trimStart > 0 ? ['-ss', String(trimStart)] : []),
            '-t',
            String(duration),
            '-vf',
            filterStr,
            '-c:v',
            'libx264',
            '-preset',
            'medium',
            '-crf',
            '18',
            '-an', // 오디오 제거 (클라이언트에서 별도 믹싱)
            '-y',
            outputPath,
          ];

          await execFileAsync(ffmpegPath, args, { timeout: 120_000 });
        } else {
          // 자막 없으면 trim + scale만
          const args = [
            '-i',
            clipPath,
            ...(trimStart > 0 ? ['-ss', String(trimStart)] : []),
            '-t',
            String(duration),
            '-vf',
            `scale=${w}:${h}`,
            '-c:v',
            'libx264',
            '-preset',
            'medium',
            '-crf',
            '18',
            '-an',
            '-y',
            outputPath,
          ];

          await execFileAsync(ffmpegPath, args, { timeout: 120_000 });
        }

        // R2 업로드
        const outBuf = fs.readFileSync(outputPath);
        const outKey = `storybooks/${storybookId}/longform/${projectId}/prepared/scene_${i}.mp4`;
        const outUrl = await R2Repository.uploadBuffer(outBuf, outKey, 'video/mp4');

        processedScenes.push({
          processedClipUrl: outUrl,
          sfxUrl: scene.sfxUrl,
          sfxVolume: scene.sfxVolume,
          sfxOffset: scene.sfxOffset,
          ttsUrl: scene.ttsUrl,
          ttsVolume: scene.ttsVolume,
          ttsOffset: scene.ttsOffset,
          clipDuration: scene.clipDuration,
          trimStart: scene.trimStart,
          trimEnd: scene.trimEnd,
        });
      }

      renderProgressMap.set(projectId, { progress: 95, step: '매니페스트 생성' });

      const manifest = {
        scenes: processedScenes,
        bgmUrl: project.bgmUrl,
        bgmVolume: project.bgmVolume,
        aspectRatio: project.aspectRatio,
      };

      renderProgressMap.set(projectId, { progress: 100, step: '전처리 완료' });
      setTimeout(() => renderProgressMap.delete(projectId), 30_000);

      return manifest;
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  },

  // ----- Presigned upload URL -----
  async presignedUpload(storybookId: string, projectId: string) {
    const key = outputKey(storybookId, projectId);
    return createPresignedUploadUrl(key, 'video/mp4');
  },

  // ----- Confirm render (클라이언트 업로드 완료 후) -----
  async confirmRender(storybookId: string, projectId: string, outputUrl: string) {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);
    project.outputUrl = outputUrl;
    project.createdAt = new Date().toISOString();
    await R2Repository.saveStorybook(storybook);
    return { outputUrl };
  },

  // ----- Delete render -----
  async deleteRender(storybookId: string, projectId: string): Promise<void> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);
    if (!project.outputUrl) throw new AppError(400, '삭제할 렌더링 파일이 없습니다.');

    try {
      const key = urlToR2Key(project.outputUrl);
      await deleteFromR2(key);
      console.log('[longform] Render deleted:', key);
    } catch {
      // Ignore — file may already be gone
    }

    project.outputUrl = undefined;
    await R2Repository.saveStorybook(storybook);
  },

  // ----- Get render progress -----
  getRenderProgress(projectId: string): ProgressInfo | null {
    return renderProgressMap.get(projectId) ?? null;
  },

  // ----- Set render error (called from controller catch) -----
  setRenderError(projectId: string, message: string) {
    renderProgressMap.set(projectId, { progress: -1, step: message });
    setTimeout(() => renderProgressMap.delete(projectId), 30_000);
  },

  // ----- Cancel render -----
  cancelRender(projectId: string): boolean {
    const cancelled = cancelRender(projectId);
    if (cancelled) {
      renderProgressMap.set(projectId, { progress: -1, step: '취소됨' });
      setTimeout(() => renderProgressMap.delete(projectId), 5_000);
    }
    return cancelled;
  },

  // ----- Upload clip (user-provided video file) -----
  async uploadClip(
    file: Express.Multer.File,
    storybookId: string,
    projectId: string,
    sceneId: string
  ): Promise<{ clipUrl: string; sfxUrl: string }> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) throw new AppError(404, '장면을 찾을 수 없습니다.');

    // Write to temp file and extract audio
    const workDir = path.join(os.tmpdir(), `tangobook-clip-upload-${Date.now()}-${sceneId}`);
    fs.mkdirSync(workDir, { recursive: true });

    const inputPath = path.join(workDir, 'input.mp4');
    const audioPath = path.join(workDir, 'audio.mp3');

    try {
      fs.writeFileSync(inputPath, file.buffer);

      // Extract audio (SFX)
      let audioBuffer: Buffer | undefined;
      try {
        await extractAudio(inputPath, audioPath);
        audioBuffer = fs.readFileSync(audioPath);
      } catch {
        // Video may have no audio track — skip SFX
      }

      // Upload video + audio to R2
      const uploadPromises: Promise<string>[] = [
        R2Repository.uploadBuffer(
          file.buffer,
          clipKey(storybookId, projectId, scene.order),
          'video/mp4'
        ),
      ];
      if (audioBuffer) {
        uploadPromises.push(
          R2Repository.uploadBuffer(
            audioBuffer,
            sfxKey(storybookId, projectId, scene.order),
            'audio/mpeg'
          )
        );
      }

      const [clipUrl, sfxUrl] = await Promise.all(uploadPromises);

      // Move current clip to history
      if (scene.clipUrl) {
        if (!scene.clipHistory) scene.clipHistory = [];
        scene.clipHistory.push(scene.clipUrl);
      }
      scene.clipUrl = clipUrl;
      if (sfxUrl) scene.sfxUrl = sfxUrl;

      await R2Repository.saveStorybook(storybook);
      return { clipUrl, sfxUrl: sfxUrl ?? '' };
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
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

  // ----- YouTube upload -----
  async uploadToYouTube(
    storybookId: string,
    projectId: string,
    meta: YouTubeUploadMeta,
    channelId?: string
  ): Promise<void> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    if (!project.outputUrl) {
      throw new AppError(400, '렌더링된 영상이 없습니다.');
    }

    youtubeProgressMap.set(projectId, { progress: 0, step: 'R2에서 영상 다운로드 중' });

    // 1. Download video from R2
    const r2Key = urlToR2Key(project.outputUrl);
    const videoBuffer = await downloadFromR2(r2Key);

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

    // 3. 결과 먼저 저장 (썸네일 실패해도 영상 업로드 결과는 보존)
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
        console.warn(`[longform-youtube] R2 mp4 삭제 실패 (${oldKey}):`, (err as Error).message)
      );
    }

    // 4. Optional: upload thumbnail (실패해도 무시)
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
          '[youtube] Thumbnail failed (skipping):',
          err instanceof Error ? err.message : err
        );
      }
    }

    youtubeProgressMap.set(projectId, { progress: 100, step: '업로드 완료' });
    setTimeout(() => youtubeProgressMap.delete(projectId), 30_000);
  },

  getYouTubeProgress(projectId: string): ProgressInfo | null {
    return youtubeProgressMap.get(projectId) ?? null;
  },

  setYouTubeError(projectId: string, message: string) {
    youtubeProgressMap.set(projectId, { progress: -1, step: message });
    setTimeout(() => youtubeProgressMap.delete(projectId), 30_000);
  },

  // ----- Generate YouTube metadata via Gemini -----
  async generateYouTubeMeta(
    storybookId: string,
    projectId: string,
    prompt: string
  ): Promise<YouTubeGeneratedMeta> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);
    const pages = storybook.pages ?? [];
    const lang = project.language ?? 'ko';

    const storybookInfo = [
      `Title: ${storybook.title}`,
      storybook.category ? `Category: ${storybook.category}` : '',
      `Content Language: ${lang}`,
      `Pages: ${pages.length}`,
      `Scenes: ${project.scenes.length}`,
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

    // JSON 파싱 (코드블록 제거)
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
      console.error('[longform] Failed to parse Gemini YouTube meta response:', cleaned);
      throw new AppError(500, 'AI 응답을 파싱할 수 없습니다. 프롬프트를 수정해보세요.');
    }
  },

  // ----- Recover missing clipUrls from R2 -----
  async recoverClips(
    storybookId: string,
    projectId: string
  ): Promise<{ recovered: number; total: number }> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    const clipPrefix = `storybooks/${storybookId}/longform/${projectId}/clips/`;
    const sfxPrefix = `storybooks/${storybookId}/longform/${projectId}/sfx/`;

    const [clipObjects, sfxObjects] = await Promise.all([
      listR2Objects(clipPrefix),
      listR2Objects(sfxPrefix),
    ]);

    // Build lookup: order → url
    const clipMap = new Map<number, string>();
    for (const obj of clipObjects) {
      if (!obj.Key) continue;
      const match = obj.Key.match(/scene-(\d+)\.mp4$/);
      if (match) clipMap.set(Number(match[1]), `${r2PublicUrl}/${obj.Key}`);
    }

    const sfxMap = new Map<number, string>();
    for (const obj of sfxObjects) {
      if (!obj.Key) continue;
      const match = obj.Key.match(/scene-(\d+)\.mp3$/);
      if (match) sfxMap.set(Number(match[1]), `${r2PublicUrl}/${obj.Key}`);
    }

    let recovered = 0;
    for (const scene of project.scenes) {
      const rClip = clipMap.get(scene.order);
      const rSfx = sfxMap.get(scene.order);

      if (!scene.clipUrl && rClip) {
        scene.clipUrl = rClip;
        if (rSfx) scene.sfxUrl = rSfx;
        recovered++;
        console.warn(`[recover] scene order=${scene.order} page=${scene.pageNumber} → recovered`);
      }
    }

    if (recovered > 0) {
      await R2Repository.saveStorybook(storybook);
    }

    return { recovered, total: project.scenes.length };
  },

  // ----- YouTube Captions -----

  getCaptionProgress(projectId: string): ProgressInfo | null {
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

    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

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
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

    const baseLang = project.language || 'ko';
    const baseSrt = generateLongformSrt(project.scenes);
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

  async uploadCaptions(
    storybookId: string,
    projectId: string,
    languages: string[],
    channelId?: string
  ): Promise<void> {
    const storybook = await loadStorybook(storybookId);
    const project = loadProject(storybook, projectId);

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

    // Priority: stored channelId → explicit param → auto-detect via video ownership
    let effectiveChannelId = project.youtubeUpload.channelId ?? channelId;
    if (!effectiveChannelId) {
      effectiveChannelId = await YouTubeProvider.findChannelIdForVideo(videoId);
      if (effectiveChannelId) {
        project.youtubeUpload.channelId = effectiveChannelId;
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
        await YouTubeProvider.uploadCaption(
          videoId,
          lang,
          cache[lang].srt,
          undefined,
          effectiveChannelId
        );
        uploaded.push(lang);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[longform-caption] Failed for ${lang}:`, err);
        failed.push({ lang, error: msg });
      }
    }

    // Save results
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

  // ----- Shortform rendering -----

  getShortformProgress(projectId: string): ProgressInfo | null {
    return shortformProgressMap.get(projectId) ?? null;
  },

  setShortformError(projectId: string, message: string) {
    shortformProgressMap.set(projectId, { progress: -1, step: message });
    setTimeout(() => shortformProgressMap.delete(projectId), 30_000);
  },

  async renderShortform(req: {
    storybookId: string;
    projectId: string;
    title?: string;
    logoUrl?: string;
  }): Promise<{ outputUrl: string }> {
    const { storybookId, projectId, title, logoUrl } = req;
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.longformProjects?.find((p: LongformProject) => p.id === projectId);
    if (!project) throw new AppError(404, '프로젝트를 찾을 수 없습니다.');
    if (!project.outputUrl) throw new AppError(400, '렌더링된 영상이 없습니다.');

    const workDir = path.join(os.tmpdir(), `shortform-${projectId}-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    try {
      // 1. Download source video
      shortformProgressMap.set(projectId, { progress: 5, step: '영상 다운로드 중' });
      const videoKey = urlToR2Key(project.outputUrl);
      const videoBuffer = await downloadFromR2(videoKey);
      const inputPath = path.join(workDir, 'input.mp4');
      fs.writeFileSync(inputPath, videoBuffer);

      // 2. Download logo if provided
      let logoPath: string | undefined;
      if (logoUrl) {
        shortformProgressMap.set(projectId, { progress: 10, step: '로고 다운로드 중' });
        try {
          const logoKey = urlToR2Key(logoUrl);
          const logoBuf = await downloadFromR2(logoKey);
          logoPath = path.join(workDir, 'logo.png');
          fs.writeFileSync(logoPath, logoBuf);
        } catch {
          console.warn('[shortform] Logo download failed, skipping');
        }
      }

      // 3. Probe source video dimensions
      shortformProgressMap.set(projectId, { progress: 15, step: '영상 분석 중' });
      const probeCmd = `ffprobe -v quiet -print_format json -show_streams "${inputPath}"`;
      const probeResult = JSON.parse(execSync(probeCmd, { encoding: 'utf-8' }));
      const videoStream = probeResult.streams?.find((s: any) => s.codec_type === 'video');
      const srcW = videoStream?.width || 1280;
      const srcH = videoStream?.height || 720;

      // 4. Build ffmpeg filter for 9:16 canvas (1080x1920)
      shortformProgressMap.set(projectId, { progress: 20, step: '숏폼 렌더링 중' });
      const canvasW = 1080;
      const canvasH = 1920;
      const titleAreaH = 200; // top area for title
      const logoAreaH = 200; // bottom area for logo
      const videoAreaH = canvasH - titleAreaH - logoAreaH; // 1520
      const videoAreaW = canvasW;

      // Scale video to fit video area while maintaining aspect ratio
      const scaleW = videoAreaW / srcW;
      const scaleH = videoAreaH / srcH;
      const scale = Math.min(scaleW, scaleH);
      const scaledW = Math.round((srcW * scale) / 2) * 2; // ensure even
      const scaledH = Math.round((srcH * scale) / 2) * 2;
      const videoX = Math.round((canvasW - scaledW) / 2);
      const videoY = titleAreaH + Math.round((videoAreaH - scaledH) / 2);

      // Find font for drawtext
      const fontPath = findFont();

      // Build filter complex
      let filterParts = [
        `color=c=#111111:s=${canvasW}x${canvasH}:d=999[bg]`,
        `[0:v]scale=${scaledW}:${scaledH}[vid]`,
        `[bg][vid]overlay=${videoX}:${videoY}:shortest=1[base]`,
      ];

      const displayTitle = title || storybook.title || '';
      if (displayTitle) {
        const escapedTitle = displayTitle.replace(/'/g, "'\\''").replace(/:/g, '\\:');
        filterParts.push(
          `[base]drawtext=fontfile='${fontPath}':text='${escapedTitle}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=80:shadowcolor=black:shadowx=2:shadowy=2[titled]`
        );
      }

      const lastLabel = displayTitle ? 'titled' : 'base';

      if (logoPath) {
        filterParts.push(
          `movie='${logoPath.replace(/\\/g, '/')}',scale=200:-1[logo]`,
          `[${lastLabel}][logo]overlay=(W-w)/2:${canvasH - logoAreaH + 40}[out]`
        );
      } else {
        filterParts.push(`[${lastLabel}]copy[out]`);
      }

      const filterComplex = filterParts.join(';');
      const outputPath = path.join(workDir, 'shortform.mp4');

      const ffmpegArgs = [
        '-y',
        '-i',
        inputPath,
        '-filter_complex',
        filterComplex,
        '-map',
        '[out]',
        '-map',
        '0:a?',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-movflags',
        '+faststart',
        '-shortest',
        outputPath,
      ];

      console.log('[shortform] Rendering:', ffmpegArgs.join(' ').slice(0, 200));

      await new Promise<void>((resolve, reject) => {
        const proc = execFile('ffmpeg', ffmpegArgs, { timeout: 600_000 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
        // Track progress via stderr
        proc.stderr?.on('data', (data: Buffer) => {
          const line = data.toString();
          const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
          if (timeMatch) {
            const secs =
              parseInt(timeMatch[1]) * 3600 +
              parseInt(timeMatch[2]) * 60 +
              parseFloat(timeMatch[3]);
            const duration = parseFloat(videoStream?.duration || '60');
            const pct = Math.min(90, 20 + Math.round((secs / duration) * 70));
            shortformProgressMap.set(projectId, { progress: pct, step: '숏폼 렌더링 중' });
          }
        });
      });

      // 5. Upload to R2
      shortformProgressMap.set(projectId, { progress: 92, step: 'R2 업로드 중' });
      const outputBuffer = fs.readFileSync(outputPath);
      const r2Key = `storybooks/${storybookId}/longform/${projectId}/shortform.mp4`;
      const outputUrl = await R2Repository.uploadBuffer(outputBuffer, r2Key, 'video/mp4');

      // 6. Save to storybook
      project.shortformOutputUrl = outputUrl;
      await R2Repository.saveStorybook(storybook);

      shortformProgressMap.set(projectId, { progress: 100, step: '완료' });
      setTimeout(() => shortformProgressMap.delete(projectId), 60_000);
      console.log('[shortform] Complete:', outputUrl);

      return { outputUrl };
    } catch (err: any) {
      console.error('[shortform] Render failed:', err.message || err);
      shortformProgressMap.set(projectId, {
        progress: -1,
        step: '숏폼 렌더링 실패',
        error: err.message || '알 수 없는 오류',
      });
      setTimeout(() => shortformProgressMap.delete(projectId), 60_000);
      throw err;
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  },
};

/** Find a TrueType font for drawtext. Prefer NanumGothic, fallback to system fonts. */
function findFont(): string {
  const candidates = [
    '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
    'C:/Windows/Fonts/malgun.ttf',
    'C:/Windows/Fonts/arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  ];
  for (const f of candidates) {
    if (fs.existsSync(f)) return f.replace(/\\/g, '/');
  }
  return 'arial';
}
