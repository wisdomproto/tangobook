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
  YouTubeUploadMeta,
  YouTubeGeneratedMeta,
} from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';
import { R2Repository } from '../repositories/r2.repository.js';
import {
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

const execFileAsync = promisify(execFile);

// ===== Progress tracking =====

interface ProgressInfo {
  progress: number;
  step: string;
  failed?: string[];
}

const analyzeProgressMap = new Map<string, ProgressInfo>();
const progressMap = new Map<string, ProgressInfo>();
const renderProgressMap = new Map<string, ProgressInfo>();
const youtubeProgressMap = new Map<string, ProgressInfo>();

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

/** Get audio duration in seconds from a URL using ffmpeg (most reliable). */
async function getAudioDuration(audioUrl: string): Promise<number> {
  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const tmpFile = path.join(os.tmpdir(), `tts-probe-${Date.now()}.wav`);
  try {
    fs.writeFileSync(tmpFile, buffer);
    // Use ffmpeg -i to get duration (ffprobe may not be bundled with ffmpeg-static)
    const ffmpegPath = (await import('ffmpeg-static')).default!;
    const { stderr } = await execFileAsync(ffmpegPath, ['-i', tmpFile, '-f', 'null', '-'], {
      // ffmpeg writes info to stderr
    }).catch((err: { stderr?: string }) => ({ stderr: err.stderr ?? '', stdout: '' }));

    // Parse "Duration: HH:MM:SS.ss" from ffmpeg output
    const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      const centiseconds = parseInt(match[4]);
      const duration = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
      return duration;
    }

    // Fallback: WAV header parsing
    if (buffer.length > 44 && buffer.toString('ascii', 0, 4) === 'RIFF') {
      const byteRate = buffer.readUInt32LE(28); // bytes per second
      // Total file size minus 44-byte header, divided by byte rate
      const dataSize = buffer.length - 44;
      if (byteRate > 0) return dataSize / byteRate;
    }

    throw new Error('Could not determine audio duration');
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
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

    analyzeProgressMap.set(projectId, { progress: 0, step: `분석 시작 (${total}페이지)` });

    let prevVideoPrompt = '';

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageText = getPageText(page, lang);
      const ttsUrl = getPageTtsUrl(page, lang);

      analyzeProgressMap.set(projectId, {
        progress: Math.round((i / total) * 100),
        step: `페이지 ${i + 1}/${total} 분석 중`,
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
      const clipDuration = ttsDuration ? Math.min(15, Math.max(5, Math.ceil(ttsDuration) + 2)) : 10;

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

      scenes.push({
        id: crypto.randomUUID(),
        pageNumber: page.pageNumber,
        videoPrompt: trimmedPrompt,
        clipDuration,
        sfxVolume: 50,
        ttsUrl,
        ttsDuration,
        subtitles,
        order: i,
      });
    }

    // Update project with analyzed scenes
    project.scenes = scenes;
    if (presetId) project.promptPresetId = presetId;
    await R2Repository.saveStorybook(storybook);

    analyzeProgressMap.set(projectId, { progress: 100, step: '분석 완료' });
    setTimeout(() => analyzeProgressMap.delete(projectId), 30_000);

    return project;
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

    const ffmpegPath = (await import('ffmpeg-static')).default!;
    const workDir = path.join(os.tmpdir(), `tangobook-prepare-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    const [w, h] =
      project.aspectRatio === '9:16'
        ? [720, 1280]
        : project.aspectRatio === '1:1'
          ? [720, 720]
          : [1280, 720];

    const processedScenes: Array<{
      processedClipUrl: string;
      sfxUrl?: string;
      sfxVolume: number;
      sfxOffset?: number;
      ttsUrl?: string;
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
          const fontSize = project.subtitleStyle.fontSize || 26;
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
            return `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=0x${textColor}:borderw=2:bordercolor=0x${outlineColor}:x=(w-tw)/2:y=${yExpr}:enable='between(t,${sub.startTime},${sub.endTime})'`;
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
            'ultrafast',
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
            'ultrafast',
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

  // ----- Get render progress -----
  getRenderProgress(projectId: string): ProgressInfo | null {
    return renderProgressMap.get(projectId) ?? null;
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
    meta: YouTubeUploadMeta
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
    const result = await YouTubeProvider.uploadVideo(videoBuffer, meta, (percent) => {
      const mapped = 10 + Math.round(percent * 0.85);
      youtubeProgressMap.set(projectId, {
        progress: mapped,
        step: `YouTube 업로드 중 (${mapped}%)`,
      });
    });

    // 3. Optional: upload thumbnail (30s timeout, skip on failure)
    console.log(`[youtube] thumbnailUrl: ${meta.thumbnailUrl ?? 'NONE'}`);
    if (meta.thumbnailUrl) {
      youtubeProgressMap.set(projectId, { progress: 96, step: '썸네일 업로드 중' });
      try {
        const thumbKey = urlToR2Key(meta.thumbnailUrl);
        console.log(`[youtube] thumbnail R2 key: ${thumbKey}`);
        const rawBuffer = await downloadFromR2(thumbKey);
        console.log(`[youtube] thumbnail downloaded: ${rawBuffer.length} bytes`);

        // Resize to 1280x720 JPEG for YouTube (max 2MB)
        const sharp = (await import('sharp')).default;
        const thumbBuffer = await sharp(rawBuffer)
          .resize(1280, 720, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toBuffer();
        console.log(`[youtube] thumbnail compressed: ${thumbBuffer.length} bytes (JPEG 1280x720)`);

        const thumbTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('썸네일 업로드 타임아웃')), 30_000)
        );
        await Promise.race([
          YouTubeProvider.setThumbnail(result.videoId, thumbBuffer),
          thumbTimeout,
        ]);
        console.log('[youtube] Thumbnail uploaded successfully');
      } catch (err) {
        console.warn(
          '[youtube] Thumbnail upload failed (skipping):',
          err instanceof Error ? err.message : err
        );
      }
    } else {
      console.log('[youtube] No thumbnail URL provided, skipping');
    }

    // 4. Save result to storybook
    project.youtubeUpload = {
      videoId: result.videoId,
      videoUrl: result.videoUrl,
      uploadedAt: new Date().toISOString(),
      privacy: meta.privacy,
    };
    await R2Repository.saveStorybook(storybook);

    youtubeProgressMap.set(projectId, { progress: 100, step: '업로드 완료' });
    setTimeout(() => youtubeProgressMap.delete(projectId), 30_000);
  },

  getYouTubeProgress(projectId: string): ProgressInfo | null {
    return youtubeProgressMap.get(projectId) ?? null;
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
};
