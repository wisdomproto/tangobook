// BookV2 비즈니스 로직 — 신규 책 생성, 변형 추가, runtime payload 머지.
//
// 스펙: docs/superpowers/specs/2026-04-25-book-variants-design.md
// 플랜: docs/superpowers/plans/2026-04-25-book-variants-plan.md Task 1.5

import fs from 'fs';
import path from 'path';
import os from 'os';
import { AppError } from '../middleware/error.middleware.js';
import {
  getManifest,
  putManifest,
  getTextSlice,
  putTextSlice,
  getStyleSlice,
  getStyleCharacters,
  putStyleCharacters,
  uploadStyleAsset as uploadStyleAssetToR2,
  listGameInstances,
  getGameInstance,
  putGameInstance,
  deleteGameInstance as r2DeleteGameInstance,
  getBlogPost as r2GetBlogPost,
  putBlogPost as r2PutBlogPost,
  deleteBlogPost as r2DeleteBlogPost,
  listBlogPosts as r2ListBlogPosts,
  getCardNews as r2GetCardNews,
  putCardNews as r2PutCardNews,
  deleteCardNews as r2DeleteCardNews,
  listCardNews as r2ListCardNews,
  getAudiobookProject as r2GetAudiobookProject,
  putAudiobookProject as r2PutAudiobookProject,
  putAudiobookRender,
  listAudiobookRenders,
  getLongformProject as r2GetLongformProject,
  putLongformProject as r2PutLongformProject,
  deleteLongformProject as r2DeleteLongformProject,
  listLongformProjects as r2ListLongformProjects,
  getBookIndex,
  refreshBookIndex,
  deleteBook as deleteBookFromR2,
} from '../repositories/book-v2.repository.js';
import { listR2Objects } from '../providers/r2.provider.js';
import { mergeForViewer, mergeForGame } from '../utils/book-v2-runtime-merge.js';
import {
  audiobookRenderKey,
  audioFileKey,
  longformClipKey,
  longformSfxKey,
  longformVideoKey,
} from '../utils/book-v2-keys.js';
import { GrokProvider } from '../providers/grok.provider.js';
import {
  uploadBufferToR2,
  deleteFromR2,
  urlToR2Key,
  downloadFromR2,
} from '../providers/r2.provider.js';
import { generateLongform } from '../providers/longform.provider.js';
import type { LongformRenderOptions } from '../providers/longform.provider.js';
import { YouTubeProvider } from '../providers/youtube.provider.js';
import { parseYouTubeVideoId } from '../utils/youtube-url.js';
import { generateLongformSrt } from '../utils/srt-generator.js';
import { translateSrt } from '../utils/srt-translator.js';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { buildAudiobookRenderDataV2 } from '../utils/book-v2-audiobook-render.js';
import { loadRemotion, getRemotionBundlePath } from '../utils/remotion-bundle.js';
import { getAudioDuration } from '../utils/audio-duration.js';
import { splitSentences, buildSubtitles } from '../utils/subtitle-build.js';
import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { r2PublicUrl, objectExists } from '../providers/r2.provider.js';
import type {
  BookManifest,
  BookTextSlice,
  BookStyleSlice,
  BookCharacter,
  BookGameInstance,
  AudiobookProjectV2,
  AudiobookRenderV2,
  LongformProjectV2,
  BlogPostV2,
  CardNewsProjectV2,
  GameTypeId,
  ReadingLevel,
  YouTubeUploadMeta,
  YouTubeGeneratedMeta,
  UsedVariants,
  CurriculumMeta,
  ParentGuide,
  StorybookType,
} from '@tangobook/shared';
import type { MergedViewerPayload, MergedGamePayload } from '../utils/book-v2-runtime-merge.js';

// ────────────────────────────────────────────────────────────────────────────
// Library
// ────────────────────────────────────────────────────────────────────────────

export async function listBooks() {
  return getBookIndex();
}

export async function refreshLibraryIndex() {
  return refreshBookIndex();
}

// ────────────────────────────────────────────────────────────────────────────
// CRUD
// ────────────────────────────────────────────────────────────────────────────

export interface CreateBookInput {
  title: string;
  type?: StorybookType;
  category?: string;
  folder?: string;
  isPublic?: boolean;
  parentGuide?: ParentGuide;
  curriculumMeta?: CurriculumMeta;
  /** 신규 책 default — 빈 배열 + ko만 (스펙 §1) */
  usedVariants?: Partial<UsedVariants>;
}

function nowMs(): string {
  return Date.now().toString();
}

export async function createBook(input: CreateBookInput): Promise<BookManifest> {
  if (!input.title?.trim()) throw new AppError(400, 'title required');
  const id = nowMs();
  const manifest: BookManifest = {
    id,
    title: input.title.trim(),
    type: input.type ?? 'storybook',
    category: input.category,
    folder: input.folder,
    isPublic: input.isPublic ?? false,
    parentGuide: input.parentGuide,
    curriculumMeta: input.curriculumMeta,
    usedVariants: {
      levels: input.usedVariants?.levels ?? [],
      languages: input.usedVariants?.languages ?? ['ko'],
      styles: input.usedVariants?.styles ?? [],
    },
    keyObjectIds: [],
    vocabIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await putManifest(id, manifest);
  return manifest;
}

export async function getBook(bid: string): Promise<BookManifest> {
  const m = await getManifest(bid);
  if (!m) throw new AppError(404, `book ${bid} not found`);
  return m;
}

export async function updateBookMeta(
  bid: string,
  patch: Partial<
    Pick<
      BookManifest,
      | 'title'
      | 'category'
      | 'folder'
      | 'isPublic'
      | 'parentGuide'
      | 'curriculumMeta'
      | 'bgmUrl'
      | 'imageModels'
      | 'aspectRatios'
    >
  >
): Promise<BookManifest> {
  const current = await getBook(bid);
  const next: BookManifest = { ...current, ...patch };
  await putManifest(bid, next);
  return next;
}

export async function deleteBook(bid: string): Promise<void> {
  // 존재 확인
  await getBook(bid);
  await deleteBookFromR2(bid);
}

// ────────────────────────────────────────────────────────────────────────────
// usedVariants (변형 추가/제거)
// ────────────────────────────────────────────────────────────────────────────

export interface VariantPatch {
  addLevels?: ReadingLevel[];
  removeLevels?: ReadingLevel[];
  addLanguages?: string[];
  removeLanguages?: string[];
  addStyles?: string[];
  removeStyles?: string[];
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export async function patchVariants(bid: string, patch: VariantPatch): Promise<BookManifest> {
  const m = await getBook(bid);
  const v = m.usedVariants;
  const next: UsedVariants = {
    levels: uniq([...v.levels, ...(patch.addLevels ?? [])]).filter(
      (l) => !patch.removeLevels?.includes(l)
    ),
    languages: uniq([...v.languages, ...(patch.addLanguages ?? [])]).filter(
      (l) => !patch.removeLanguages?.includes(l)
    ),
    styles: uniq([...v.styles, ...(patch.addStyles ?? [])]).filter(
      (s) => !patch.removeStyles?.includes(s)
    ),
  };
  return putManifest(bid, { ...m, usedVariants: next }).then(() => ({ ...m, usedVariants: next }));
}

// ────────────────────────────────────────────────────────────────────────────
// Text slice
// ────────────────────────────────────────────────────────────────────────────

export async function getText(
  bid: string,
  level: ReadingLevel,
  language: string
): Promise<BookTextSlice> {
  await getBook(bid); // 책 존재 확인
  const slice = await getTextSlice(bid, level, language);
  if (!slice) throw new AppError(404, `text slice not found: ${bid}/${level}/${language}`);
  return slice;
}

export async function saveText(
  bid: string,
  level: ReadingLevel,
  language: string,
  slice: BookTextSlice
): Promise<BookTextSlice> {
  const m = await getBook(bid);
  if (slice.level !== level || slice.language !== language) {
    throw new AppError(400, 'slice.level/language must match path');
  }
  await putTextSlice(bid, level, language, slice);
  // usedVariants 자동 확장
  const needLevel = !m.usedVariants.levels.includes(level);
  const needLang = !m.usedVariants.languages.includes(language);
  if (needLevel || needLang) {
    await patchVariants(bid, {
      ...(needLevel && { addLevels: [level] }),
      ...(needLang && { addLanguages: [language] }),
    });
  }
  return slice;
}

// ────────────────────────────────────────────────────────────────────────────
// Style slice
// ────────────────────────────────────────────────────────────────────────────

export async function getStyle(bid: string, style: string): Promise<BookStyleSlice> {
  await getBook(bid);
  const s = await getStyleSlice(bid, style);
  if (!s) throw new AppError(404, `style slice not found: ${bid}/${style}`);
  return s;
}

export async function getCharacters(bid: string, style: string): Promise<BookCharacter[]> {
  await getBook(bid);
  return getStyleCharacters(bid, style);
}

export async function saveCharacters(
  bid: string,
  style: string,
  characters: BookCharacter[]
): Promise<BookCharacter[]> {
  const m = await getBook(bid);
  await putStyleCharacters(bid, style, characters);
  if (!m.usedVariants.styles.includes(style)) {
    await patchVariants(bid, { addStyles: [style] });
  }
  return characters;
}

// ────────────────────────────────────────────────────────────────────────────
// Style asset upload (이미지 — multer로 받은 buffer)
// ────────────────────────────────────────────────────────────────────────────

export interface UploadStyleAssetInput {
  bid: string;
  style: string;
  kind: 'cover' | 'page' | 'keyObj' | 'vocab';
  imageBuffer: Buffer;
  level?: ReadingLevel;
  illustrationKey?: string;
  refId?: string;
}

export async function uploadStyleImage(opts: UploadStyleAssetInput): Promise<{ url: string }> {
  const m = await getBook(opts.bid);
  const url = await uploadStyleAssetToR2(opts);
  if (!m.usedVariants.styles.includes(opts.style)) {
    await patchVariants(opts.bid, { addStyles: [opts.style] });
  }
  if (opts.kind === 'page' && opts.level && !m.usedVariants.levels.includes(opts.level)) {
    await patchVariants(opts.bid, { addLevels: [opts.level] });
  }
  return { url };
}

// ────────────────────────────────────────────────────────────────────────────
// Audiobook
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_AUDIOBOOK_PROJECT: AudiobookProjectV2 = {
  slideTransitions: { type: 'fade', durationMs: 500 },
  subtitleSettings: { fontSize: 28, color: '#ffffff', position: 'bottom' },
  bgmSettings: { volume: 0.5, loop: true },
  supportedVariants: [],
  renders: [],
};

export async function getAudiobookProject(bid: string): Promise<AudiobookProjectV2> {
  await getBook(bid); // 책 존재 확인
  const project = await r2GetAudiobookProject(bid);
  return project ?? DEFAULT_AUDIOBOOK_PROJECT;
}

export async function saveAudiobookProject(
  bid: string,
  project: AudiobookProjectV2
): Promise<AudiobookProjectV2> {
  await getBook(bid);
  // 렌더 목록은 별도 (서버가 생성). 클라가 렌더 메타를 덮어쓰지 못하게 기존 보존.
  const existing = await r2GetAudiobookProject(bid);
  const merged: AudiobookProjectV2 = {
    ...project,
    renders: existing?.renders ?? [],
  };
  await r2PutAudiobookProject(bid, merged);
  return merged;
}

export async function getAudiobookRenders(bid: string): Promise<AudiobookRenderV2[]> {
  await getBook(bid);
  return listAudiobookRenders(bid);
}

export interface AudiobookRenderInput {
  bid: string;
  level: ReadingLevel;
  language: string;
  style: string;
}

export interface AudiobookRenderProgress {
  progress: number; // 0~100, -1=실패
  step: string;
  error?: string;
}

const audiobookRenderProgress = new Map<string, AudiobookRenderProgress>();

function audiobookTaskId(level: ReadingLevel, language: string, style: string): string {
  return `${level}.${language}.${style}`;
}

function audiobookProgressKey(bid: string, taskId: string): string {
  return `${bid}:${taskId}`;
}

function setAudiobookProgress(bid: string, taskId: string, p: AudiobookRenderProgress): void {
  audiobookRenderProgress.set(audiobookProgressKey(bid, taskId), p);
}

function clearAudiobookProgressLater(bid: string, taskId: string, ms: number): void {
  setTimeout(() => audiobookRenderProgress.delete(audiobookProgressKey(bid, taskId)), ms);
}

export function getAudiobookRenderProgress(
  bid: string,
  taskId: string
): AudiobookRenderProgress | null {
  return audiobookRenderProgress.get(audiobookProgressKey(bid, taskId)) ?? null;
}

/**
 * 오디오북 렌더 시작 (fire-and-forget).
 * 검증 통과 시 즉시 taskId 반환, 실제 렌더는 백그라운드에서 진행.
 * 진행률은 GET /audiobook/render/progress?taskId=...로 폴링.
 */
export async function startAudiobookRender(
  opts: AudiobookRenderInput
): Promise<{ taskId: string }> {
  const m = await getBook(opts.bid);
  if (!m.usedVariants.levels.includes(opts.level)) {
    throw new AppError(400, `level ${opts.level} not in usedVariants`);
  }
  if (!m.usedVariants.languages.includes(opts.language)) {
    throw new AppError(400, `language ${opts.language} not in usedVariants`);
  }
  if (!m.usedVariants.styles.includes(opts.style)) {
    throw new AppError(400, `style ${opts.style} not in usedVariants`);
  }
  const ts = await getTextSlice(opts.bid, opts.level, opts.language);
  if (!ts) throw new AppError(400, `text slice not found: ${opts.level}/${opts.language}`);
  const ss = await getStyleSlice(opts.bid, opts.style);
  if (!ss) throw new AppError(400, `style slice not found: ${opts.style}`);

  const taskId = audiobookTaskId(opts.level, opts.language, opts.style);

  // 동일 variant 진행 중이면 거부
  const existing = audiobookRenderProgress.get(audiobookProgressKey(opts.bid, taskId));
  if (existing && existing.progress >= 0 && existing.progress < 100) {
    throw new AppError(409, '이미 동일 variant의 렌더링이 진행 중입니다.');
  }

  setAudiobookProgress(opts.bid, taskId, { progress: 0, step: '시작' });

  // Fire-and-forget
  void runAudiobookRender(opts, taskId, m, ts, ss).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[book-v2 audiobook] render failed:', msg);
    setAudiobookProgress(opts.bid, taskId, { progress: -1, step: '실패', error: msg });
    clearAudiobookProgressLater(opts.bid, taskId, 60_000);
  });

  return { taskId };
}

async function runAudiobookRender(
  opts: AudiobookRenderInput,
  taskId: string,
  manifest: BookManifest,
  textSlice: BookTextSlice,
  styleSlice: BookStyleSlice
): Promise<void> {
  // 1. 렌더 데이터 빌드
  setAudiobookProgress(opts.bid, taskId, { progress: 1, step: '렌더 데이터 빌드' });
  const project = (await r2GetAudiobookProject(opts.bid)) ?? DEFAULT_AUDIOBOOK_PROJECT;
  const renderData = await buildAudiobookRenderDataV2({
    manifest,
    textSlice,
    styleSlice,
    project,
    level: opts.level,
    language: opts.language,
  });

  if (renderData.slides.length === 0) {
    throw new AppError(400, '렌더링할 페이지가 없습니다 (이미지 누락).');
  }

  // 2. TTS 길이 측정
  const slidesWithTts = renderData.slides.filter((s) => s.ttsUrl);
  for (let i = 0; i < slidesWithTts.length; i++) {
    try {
      slidesWithTts[i].ttsDuration = await getAudioDuration(slidesWithTts[i].ttsUrl!);
    } catch {
      // 기본 3s 사용
    }
    setAudiobookProgress(opts.bid, taskId, {
      progress: 1 + Math.round(((i + 1) / Math.max(1, slidesWithTts.length)) * 4), // 1~5
      step: `TTS 길이 측정 (${i + 1}/${slidesWithTts.length})`,
    });
  }

  // 3. BGM 길이 측정
  if (renderData.bgmUrl) {
    try {
      renderData.bgmDuration = await getAudioDuration(renderData.bgmUrl);
    } catch (err) {
      console.warn('[book-v2 audiobook] BGM 길이 측정 실패:', err);
    }
  }

  // 4. Remotion 번들
  setAudiobookProgress(opts.bid, taskId, { progress: 6, step: 'Remotion 번들링' });
  const bundlePath = await getRemotionBundlePath();

  // 5. 컴포지션 + 렌더
  setAudiobookProgress(opts.bid, taskId, { progress: 10, step: '컴포지션 준비' });
  const { selectComposition, renderMedia } = await loadRemotion();
  const chromiumPath = process.env.CHROMIUM_PATH || undefined;
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

  const workDir = path.join(os.tmpdir(), `book-v2-audiobook-${opts.bid}-${taskId}-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    const outputPath = path.join(workDir, 'output.mp4');
    setAudiobookProgress(opts.bid, taskId, { progress: 15, step: '렌더링' });

    await renderMedia({
      composition,
      serveUrl: bundlePath,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: renderData,
      timeoutInMilliseconds: 600_000,
      concurrency: 1,
      ...browserOpts,
      onProgress: ({ progress }) => {
        const pct = 15 + Math.round(progress * 75); // 15~90
        setAudiobookProgress(opts.bid, taskId, { progress: pct, step: '렌더링' });
      },
    });

    // faststart (브라우저 스트리밍 재생)
    try {
      const { execSync } = await import('child_process');
      const fastPath = path.join(workDir, 'output-faststart.mp4');
      execSync(`ffmpeg -i "${outputPath}" -c copy -movflags +faststart "${fastPath}"`, {
        timeout: 60_000,
        stdio: 'pipe',
      });
      fs.renameSync(fastPath, outputPath);
    } catch (err) {
      console.warn('[book-v2 audiobook] faststart 실패, 원본 사용:', err);
    }

    // 6. R2 업로드
    setAudiobookProgress(opts.bid, taskId, { progress: 92, step: 'R2 업로드' });
    const videoBuffer = fs.readFileSync(outputPath);

    const renderMeta: AudiobookRenderV2 = {
      level: opts.level,
      language: opts.language,
      style: opts.style,
      videoUrl: `${r2PublicUrl}/${audiobookRenderKey(opts.bid, opts.level, opts.language, opts.style)}`,
      renderedAt: new Date().toISOString(),
    };
    await putAudiobookRender(opts.bid, renderMeta, videoBuffer);

    setAudiobookProgress(opts.bid, taskId, { progress: 100, step: '완료' });
    clearAudiobookProgressLater(opts.bid, taskId, 60_000);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Longform (3축 의존: level + language + style)
// ────────────────────────────────────────────────────────────────────────────

export async function listLongform(
  bid: string,
  filter?: { level?: ReadingLevel; language?: string; style?: string }
): Promise<LongformProjectV2[]> {
  await getBook(bid);
  return r2ListLongformProjects(bid, filter);
}

export async function getLongform(bid: string, projectId: string): Promise<LongformProjectV2> {
  await getBook(bid);
  const p = await r2GetLongformProject(bid, projectId);
  if (!p) throw new AppError(404, `longform project ${projectId} not found`);
  return p;
}

export interface CreateLongformInput {
  bid: string;
  level: ReadingLevel;
  language: string;
  style: string;
  parentProjectId?: string;
}

/**
 * 새 longform 프로젝트 생성 — textSlice의 페이지 수만큼 빈 scene 시드.
 * videoPrompt는 비어있고, ttsUrl은 audio R2에 있으면 채움.
 */
export async function createLongform(input: CreateLongformInput): Promise<LongformProjectV2> {
  const m = await getBook(input.bid);
  if (!m.usedVariants.levels.includes(input.level)) {
    throw new AppError(400, `level ${input.level} not in usedVariants`);
  }
  if (!m.usedVariants.languages.includes(input.language)) {
    throw new AppError(400, `language ${input.language} not in usedVariants`);
  }
  if (!m.usedVariants.styles.includes(input.style)) {
    throw new AppError(400, `style ${input.style} not in usedVariants`);
  }
  const ts = await getTextSlice(input.bid, input.level, input.language);
  if (!ts) throw new AppError(400, `text slice not found: ${input.level}/${input.language}`);

  // audio R2 list로 ttsUrl 시드
  const audioObjs = await listR2Objects(
    `books/${input.bid}/audio/${input.level}.${input.language}/`
  );
  const existingAudioPages = new Set<number>();
  for (const o of audioObjs) {
    if (!o.Key) continue;
    const m2 = o.Key.match(/page-(\d+)\.mp3$/);
    if (m2) existingAudioPages.add(parseInt(m2[1], 10));
  }

  const now = new Date().toISOString();
  const id = `longform-${Date.now()}`;
  const scenes = ts.pages.map((page, idx) => ({
    id: `scene-${page.pageNumber}`,
    pageNumber: page.pageNumber,
    videoPrompt: '',
    clipDuration: 5,
    sfxVolume: 0.5,
    ttsVolume: 1,
    ttsUrl: existingAudioPages.has(page.pageNumber)
      ? `${r2PublicUrl}/books/${input.bid}/audio/${input.level}.${input.language}/page-${page.pageNumber}.mp3`
      : undefined,
    subtitles: [],
    order: idx,
  }));

  const project: LongformProjectV2 = {
    id,
    level: input.level,
    language: input.language,
    style: input.style,
    parentProjectId: input.parentProjectId,
    scenes,
    createdAt: now,
    updatedAt: now,
  };
  await r2PutLongformProject(input.bid, project);
  return project;
}

export async function saveLongform(
  bid: string,
  projectId: string,
  patch: Partial<LongformProjectV2>
): Promise<LongformProjectV2> {
  const current = await getLongform(bid, projectId);
  // id/level/language/style은 immutable
  const next: LongformProjectV2 = {
    ...current,
    ...patch,
    id: current.id,
    level: current.level,
    language: current.language,
    style: current.style,
    parentProjectId: current.parentProjectId,
    updatedAt: new Date().toISOString(),
  };
  await r2PutLongformProject(bid, next);
  return next;
}

export async function deleteLongform(bid: string, projectId: string): Promise<void> {
  await getBook(bid);
  await r2DeleteLongformProject(bid, projectId);
}

// ────────────────────────────────────────────────────────────────────────────
// Longform Analyze (Gemini로 페이지별 videoPrompt 생성)
// ────────────────────────────────────────────────────────────────────────────

export interface LongformAnalyzeProgress {
  progress: number; // 0~100, -1 실패
  step: string;
  error?: string;
  updatedAt: number;
}

const longformAnalyzeProgress = new Map<string, LongformAnalyzeProgress>();

function longformProgressKey(bid: string, projectId: string): string {
  return `${bid}:${projectId}`;
}

function setLongformProgress(
  bid: string,
  projectId: string,
  p: Omit<LongformAnalyzeProgress, 'updatedAt'>
): void {
  longformAnalyzeProgress.set(longformProgressKey(bid, projectId), {
    ...p,
    updatedAt: Date.now(),
  });
}

function clearLongformProgressLater(bid: string, projectId: string, ms: number): void {
  setTimeout(() => longformAnalyzeProgress.delete(longformProgressKey(bid, projectId)), ms);
}

export function getLongformAnalyzeProgress(
  bid: string,
  projectId: string
): LongformAnalyzeProgress | null {
  return longformAnalyzeProgress.get(longformProgressKey(bid, projectId)) ?? null;
}

export interface AnalyzeLongformInput {
  bid: string;
  projectId: string;
  systemPrompt?: string;
  model?: string;
  excludePages?: number[];
}

/**
 * 롱폼 분석 시작 (fire-and-forget). 즉시 반환, 진행률은 polling.
 */
export async function startLongformAnalyze(input: AnalyzeLongformInput): Promise<{ ok: true }> {
  const project = await getLongform(input.bid, input.projectId);
  const existing = longformAnalyzeProgress.get(longformProgressKey(input.bid, input.projectId));
  if (existing && existing.progress >= 0 && existing.progress < 100) {
    throw new AppError(409, '이미 분석이 진행 중입니다.');
  }

  setLongformProgress(input.bid, input.projectId, { progress: 0, step: '시작' });

  void runLongformAnalyze(input, project).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[book-v2 longform] analyze failed:', msg);
    setLongformProgress(input.bid, input.projectId, {
      progress: -1,
      step: '실패',
      error: msg,
    });
    clearLongformProgressLater(input.bid, input.projectId, 60_000);
  });

  return { ok: true };
}

async function runLongformAnalyze(
  input: AnalyzeLongformInput,
  project: LongformProjectV2
): Promise<void> {
  const ts = await getTextSlice(input.bid, project.level, project.language);
  if (!ts) throw new AppError(400, `text slice not found: ${project.level}/${project.language}`);

  const allPages = ts.pages;
  const pages = input.excludePages?.length
    ? allPages.filter((p) => !input.excludePages!.includes(p.pageNumber))
    : allPages;
  const total = pages.length;

  // 기존 씬의 클립/편집 정보 보존 (pageNumber 매칭)
  const prevByPage = new Map<number, (typeof project.scenes)[number]>();
  for (const s of project.scenes ?? []) {
    if (typeof s.pageNumber === 'number') prevByPage.set(s.pageNumber, s);
  }

  setLongformProgress(input.bid, input.projectId, {
    progress: 0,
    step: `분석 시작 (${total}페이지)`,
  });

  // 하트비트 — Gemini 재시도로 오래 걸려도 stale detection 오탐 방지
  const heartbeat = setInterval(() => {
    const cur = longformAnalyzeProgress.get(longformProgressKey(input.bid, input.projectId));
    if (cur && cur.progress >= 0 && cur.progress < 100) {
      longformAnalyzeProgress.set(longformProgressKey(input.bid, input.projectId), {
        ...cur,
        updatedAt: Date.now(),
      });
    }
  }, 15_000);

  let prevVideoPrompt = '';
  const newScenes: typeof project.scenes = [];

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageText = page.text;

      setLongformProgress(input.bid, input.projectId, {
        progress: Math.round((i / total) * 100),
        step: `페이지 ${i + 1}/${total} 분석 중`,
      });

      // TTS 길이 측정 (있으면) → clipDuration
      const audioKey = audioFileKey(input.bid, project.level, project.language, page.pageNumber);
      const audioExists = await objectExists(audioKey);
      const ttsUrl = audioExists ? `${r2PublicUrl}/${audioKey}` : undefined;

      let ttsDuration: number | undefined;
      if (ttsUrl) {
        try {
          ttsDuration = await getAudioDuration(ttsUrl);
        } catch {
          // 기본값
        }
      }
      const clipDuration = ttsDuration ? Math.min(15, Math.max(5, Math.ceil(ttsDuration) + 2)) : 10;

      // Gemini 프롬프트
      const geminiPrompt = [
        input.systemPrompt ? `[System]\n${input.systemPrompt}\n` : '',
        `다음 동화책 페이지를 분석하고, 이 장면을 ${clipDuration}초 영상으로 만들기 위한 영어 영상 프롬프트를 작성해주세요.`,
        `장면 설명에 카메라 움직임, 조명, 분위기를 포함해주세요.`,
        prevVideoPrompt
          ? `이전 장면과의 시각적 연속성을 위해, 이전 장면의 카메라 방향과 움직임을 참고하여 자연스럽게 이어지도록 해주세요.\n[이전 장면 프롬프트]\n${prevVideoPrompt}\n`
          : '',
        `중요: 영상에 텍스트, 자막, 말풍선, 음성, 음악이 포함되지 않도록 프롬프트에 "no text, no subtitles, no speech, no voice-over, no music"를 반드시 포함해주세요.`,
        `\n[페이지 텍스트]\n${pageText}`,
        page.sceneDescription ? `\n[장면 묘사]\n${page.sceneDescription}` : '',
        `\n영상 프롬프트만 출력해주세요 (다른 설명 없이):`,
      ]
        .filter(Boolean)
        .join('\n');

      const videoPrompt = await generateTextWithGemini(geminiPrompt, 3, input.model);
      const trimmedPrompt = videoPrompt.trim();
      prevVideoPrompt = trimmedPrompt;

      const sentences = splitSentences(pageText);
      const subtitles = buildSubtitles(sentences, clipDuration);

      const prev = prevByPage.get(page.pageNumber);

      newScenes.push({
        id: prev?.id ?? `scene-${page.pageNumber}`,
        pageNumber: page.pageNumber,
        videoPrompt: trimmedPrompt,
        clipDuration,
        sfxVolume: prev?.sfxVolume ?? 0.5,
        ttsUrl,
        ttsVolume: prev?.ttsVolume ?? 1,
        ttsDuration,
        subtitles,
        order: i,
        // 보존
        clipUrl: prev?.clipUrl,
        clipHistory: prev?.clipHistory,
        trimStart: prev?.trimStart,
        trimEnd: prev?.trimEnd,
        sfxUrl: prev?.sfxUrl,
        sfxOffset: prev?.sfxOffset,
        ttsOffset: prev?.ttsOffset,
      });
    }

    // 저장
    await saveLongform(input.bid, input.projectId, { scenes: newScenes });

    setLongformProgress(input.bid, input.projectId, { progress: 100, step: '완료' });
    clearLongformProgressLater(input.bid, input.projectId, 60_000);
  } finally {
    clearInterval(heartbeat);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Longform Generate Clip (Grok image-to-video, 단일 씬)
// ────────────────────────────────────────────────────────────────────────────

export interface LongformClipProgress {
  progress: number; // 0~100, -1 실패
  step: string;
  error?: string;
  updatedAt: number;
}

const longformClipProgress = new Map<string, LongformClipProgress>();

function longformClipKeyForProgress(bid: string, projectId: string, sceneId: string): string {
  return `${bid}:${projectId}:${sceneId}`;
}

function setClipProgress(
  bid: string,
  projectId: string,
  sceneId: string,
  p: Omit<LongformClipProgress, 'updatedAt'>
): void {
  longformClipProgress.set(longformClipKeyForProgress(bid, projectId, sceneId), {
    ...p,
    updatedAt: Date.now(),
  });
}

function clearClipProgressLater(bid: string, projectId: string, sceneId: string, ms: number): void {
  setTimeout(
    () => longformClipProgress.delete(longformClipKeyForProgress(bid, projectId, sceneId)),
    ms
  );
}

export function getLongformClipProgress(
  bid: string,
  projectId: string,
  sceneId: string
): LongformClipProgress | null {
  return longformClipProgress.get(longformClipKeyForProgress(bid, projectId, sceneId)) ?? null;
}

const execFileAsync = promisify(execFile);

async function extractAudioToMp3(videoPath: string, audioPath: string): Promise<void> {
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

export interface GenerateClipInput {
  bid: string;
  projectId: string;
  sceneId: string;
}

/**
 * 단일 씬 클립 생성 (fire-and-forget). Grok image-to-video.
 * scene.videoPrompt 필수, 페이지 이미지를 first frame으로 사용.
 */
export async function startGenerateClip(input: GenerateClipInput): Promise<{ ok: true }> {
  const project = await getLongform(input.bid, input.projectId);
  const scene = project.scenes.find((s) => s.id === input.sceneId);
  if (!scene) throw new AppError(404, `scene ${input.sceneId} not found`);
  if (!scene.videoPrompt) {
    throw new AppError(400, '영상 프롬프트가 없습니다. 먼저 분석을 실행하세요.');
  }

  const existing = longformClipProgress.get(
    longformClipKeyForProgress(input.bid, input.projectId, input.sceneId)
  );
  if (existing && existing.progress >= 0 && existing.progress < 100) {
    throw new AppError(409, '이미 클립 생성이 진행 중입니다.');
  }

  setClipProgress(input.bid, input.projectId, input.sceneId, { progress: 0, step: '시작' });

  void runGenerateClip(input, project, scene).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[book-v2 longform] generate clip failed:', msg);
    setClipProgress(input.bid, input.projectId, input.sceneId, {
      progress: -1,
      step: '실패',
      error: msg,
    });
    clearClipProgressLater(input.bid, input.projectId, input.sceneId, 60_000);
  });

  return { ok: true };
}

async function runGenerateClip(
  input: GenerateClipInput,
  project: LongformProjectV2,
  scene: LongformProjectV2['scenes'][number]
): Promise<void> {
  // 1. 페이지 이미지 URL (textSlice + styleSlice)
  setClipProgress(input.bid, input.projectId, input.sceneId, {
    progress: 5,
    step: '데이터 로딩',
  });

  const ts = await getTextSlice(input.bid, project.level, project.language);
  const ss = await getStyleSlice(input.bid, project.style);
  if (!ts) throw new AppError(400, `text slice not found: ${project.level}/${project.language}`);
  if (!ss) throw new AppError(400, `style slice not found: ${project.style}`);

  const page = ts.pages.find((p) => p.pageNumber === scene.pageNumber);
  const imageUrl = page ? (ss.pageImages[project.level] ?? {})[page.illustrationKey] : undefined;

  // 2. aspect ratio 결정
  const m = await getBook(input.bid);
  const arRaw = m.aspectRatios?.illustration ?? '16:9';
  const validRatios = ['16:9', '9:16', '1:1'] as const;
  const aspectRatio = (validRatios as readonly string[]).includes(arRaw)
    ? (arRaw as '16:9' | '9:16' | '1:1')
    : '16:9';

  // 3. Grok 영상 생성
  setClipProgress(input.bid, input.projectId, input.sceneId, {
    progress: 15,
    step: 'Grok 영상 생성 중',
  });
  const prompt = scene.videoPrompt.includes('no music')
    ? scene.videoPrompt
    : `${scene.videoPrompt}, no music`;
  const videoBuffer = await GrokProvider.generateClip(prompt, {
    aspectRatio,
    duration: scene.clipDuration,
    imageUrl,
  });

  // 4. 오디오 추출 + R2 업로드
  setClipProgress(input.bid, input.projectId, input.sceneId, {
    progress: 80,
    step: 'SFX 추출 + R2 업로드',
  });

  const workDir = path.join(
    os.tmpdir(),
    `book-v2-clip-${input.bid}-${input.sceneId}-${Date.now()}`
  );
  fs.mkdirSync(workDir, { recursive: true });
  const inputPath = path.join(workDir, 'input.mp4');
  const audioPath = path.join(workDir, 'audio.mp3');

  try {
    fs.writeFileSync(inputPath, videoBuffer);
    await extractAudioToMp3(inputPath, audioPath);
    const audioBuffer = fs.readFileSync(audioPath);

    const order = scene.order ?? 0;
    const [clipUrl, sfxUrl] = await Promise.all([
      uploadBufferToR2(
        videoBuffer,
        longformClipKey(input.bid, input.projectId, order),
        'video/mp4'
      ),
      uploadBufferToR2(
        audioBuffer,
        longformSfxKey(input.bid, input.projectId, order),
        'audio/mpeg'
      ),
    ]);

    // 5. 씬 업데이트 + 저장 (clipHistory에 이전 url 보존)
    setClipProgress(input.bid, input.projectId, input.sceneId, {
      progress: 95,
      step: '저장',
    });
    const updated = await getLongform(input.bid, input.projectId);
    const targetScene = updated.scenes.find((s) => s.id === input.sceneId);
    if (targetScene) {
      if (targetScene.clipUrl) {
        if (!targetScene.clipHistory) targetScene.clipHistory = [];
        targetScene.clipHistory.push(targetScene.clipUrl);
      }
      targetScene.clipUrl = clipUrl;
      targetScene.sfxUrl = sfxUrl;
      await saveLongform(input.bid, input.projectId, { scenes: updated.scenes });
    }

    setClipProgress(input.bid, input.projectId, input.sceneId, { progress: 100, step: '완료' });
    clearClipProgressLater(input.bid, input.projectId, input.sceneId, 60_000);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Longform 최종 렌더 (Python script + ffmpeg, fire-and-forget)
// ────────────────────────────────────────────────────────────────────────────

export interface LongformRenderProgress {
  progress: number; // 0~100, -1 실패
  step: string;
  error?: string;
  updatedAt: number;
}

const longformRenderProgress = new Map<string, LongformRenderProgress>();

function setRenderProgress(
  bid: string,
  projectId: string,
  p: Omit<LongformRenderProgress, 'updatedAt'>
): void {
  longformRenderProgress.set(`${bid}:${projectId}`, { ...p, updatedAt: Date.now() });
}

function clearRenderProgressLater(bid: string, projectId: string, ms: number): void {
  setTimeout(() => longformRenderProgress.delete(`${bid}:${projectId}`), ms);
}

export function getLongformRenderProgress(
  bid: string,
  projectId: string
): LongformRenderProgress | null {
  return longformRenderProgress.get(`${bid}:${projectId}`) ?? null;
}

export interface RenderLongformInput {
  bid: string;
  projectId: string;
}

/** 롱폼 최종 렌더 시작 (fire-and-forget). 모든 씬 클립 + 자막 + SFX/TTS/BGM → MP4. */
export async function startLongformRender(input: RenderLongformInput): Promise<{ ok: true }> {
  const project = await getLongform(input.bid, input.projectId);
  if (project.scenes.length === 0) {
    throw new AppError(400, '장면이 없습니다. 먼저 분석을 실행하세요.');
  }
  const readyScenes = project.scenes.filter((s) => s.clipUrl);
  if (readyScenes.length === 0) {
    throw new AppError(400, '생성된 클립이 없습니다. 먼저 클립을 생성하세요.');
  }

  const existing = longformRenderProgress.get(`${input.bid}:${input.projectId}`);
  if (existing && existing.progress >= 0 && existing.progress < 100) {
    throw new AppError(409, '이미 렌더링이 진행 중입니다.');
  }

  setRenderProgress(input.bid, input.projectId, { progress: 0, step: '시작' });

  void runLongformRender(input, project, readyScenes).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[book-v2 longform render] failed:', msg);
    setRenderProgress(input.bid, input.projectId, { progress: -1, step: '실패', error: msg });
    clearRenderProgressLater(input.bid, input.projectId, 60_000);
  });

  return { ok: true };
}

async function runLongformRender(
  input: RenderLongformInput,
  project: LongformProjectV2,
  readyScenes: LongformProjectV2['scenes']
): Promise<void> {
  // 이전 렌더 결과 삭제
  if (project.videoUrl) {
    try {
      await deleteFromR2(urlToR2Key(project.videoUrl));
    } catch {
      // 무시
    }
  }

  const manifest = await getBook(input.bid);
  const arRaw = manifest.aspectRatios?.illustration ?? '16:9';

  // BGM은 manifest 단위 (project가 [key: string]: unknown으로 override 가능)
  const bgmUrl = (project as { bgmUrl?: string }).bgmUrl ?? manifest.bgmUrl;
  const bgmVolume = (project as { bgmVolume?: number }).bgmVolume ?? 30;

  // 자막 스타일 — project override 아니면 default
  const subtitleStyle = (project as { subtitleStyle?: LongformRenderOptions['subtitleStyle'] })
    .subtitleStyle ?? {
    fontSize: 28,
    position: 'bottom',
    textColor: '#ffffff',
    outlineColor: '#000000',
    bgColor: '#00000080',
  };

  const workDir = path.join(
    os.tmpdir(),
    `book-v2-longform-render-${input.bid}-${input.projectId}-${Date.now()}`
  );
  fs.mkdirSync(workDir, { recursive: true });
  const outputPath = path.join(workDir, 'output.mp4');

  try {
    const renderOptions: LongformRenderOptions = {
      scenes: readyScenes
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          clipUrl: s.clipUrl!,
          sfxUrl: s.sfxUrl,
          sfxVolume: s.sfxVolume,
          sfxOffset: s.sfxOffset,
          ttsUrl: s.ttsUrl,
          ttsVolume: s.ttsVolume,
          ttsOffset: s.ttsOffset,
          subtitles: s.subtitles.map((sub) => ({
            text: sub.text,
            startTime: sub.startTime,
            endTime: sub.endTime,
          })),
          clipDuration: s.clipDuration,
          trimStart: s.trimStart,
          trimEnd: s.trimEnd,
        })),
      bgmUrl,
      bgmVolume,
      aspectRatio: arRaw,
      subtitleStyle,
      workDir,
      outputPath,
    };

    setRenderProgress(input.bid, input.projectId, { progress: 1, step: '렌더링 준비' });

    await generateLongform(
      renderOptions,
      (info) => {
        // info.progress는 0~95 범위로 가정. R2 업로드 5%로 따로 표시.
        const mapped = Math.min(94, Math.max(1, info.progress));
        setRenderProgress(input.bid, input.projectId, { progress: mapped, step: info.step });
      },
      input.projectId
    );

    setRenderProgress(input.bid, input.projectId, { progress: 95, step: 'R2 업로드' });
    const videoBuffer = fs.readFileSync(outputPath);
    const videoUrl = await uploadBufferToR2(
      videoBuffer,
      longformVideoKey(input.bid, input.projectId),
      'video/mp4'
    );

    // 프로젝트에 videoUrl 저장
    await saveLongform(input.bid, input.projectId, { videoUrl });

    setRenderProgress(input.bid, input.projectId, { progress: 100, step: '완료' });
    clearRenderProgressLater(input.bid, input.projectId, 60_000);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Longform YouTube 업로드 (fire-and-forget + 진행률 폴링)
// ────────────────────────────────────────────────────────────────────────────

export interface LongformYouTubeProgress {
  progress: number;
  step: string;
  error?: string;
  updatedAt: number;
}

const longformYTProgress = new Map<string, LongformYouTubeProgress>();

function ytProgressKey(bid: string, projectId: string): string {
  return `${bid}:${projectId}`;
}

function setYTProgress(
  bid: string,
  projectId: string,
  p: Omit<LongformYouTubeProgress, 'updatedAt'>
): void {
  longformYTProgress.set(ytProgressKey(bid, projectId), { ...p, updatedAt: Date.now() });
}

function clearYTProgressLater(bid: string, projectId: string, ms: number): void {
  setTimeout(() => longformYTProgress.delete(ytProgressKey(bid, projectId)), ms);
}

export function getLongformYouTubeProgress(
  bid: string,
  projectId: string
): LongformYouTubeProgress | null {
  return longformYTProgress.get(ytProgressKey(bid, projectId)) ?? null;
}

export interface UploadYouTubeInput {
  bid: string;
  projectId: string;
  meta: YouTubeUploadMeta;
  channelId?: string;
}

export async function startLongformYouTubeUpload(input: UploadYouTubeInput): Promise<{ ok: true }> {
  const project = await getLongform(input.bid, input.projectId);
  if (!project.videoUrl) {
    throw new AppError(400, '렌더링된 영상이 없습니다. 먼저 🎞️ 최종 렌더 실행.');
  }
  const existing = longformYTProgress.get(ytProgressKey(input.bid, input.projectId));
  if (existing && existing.progress >= 0 && existing.progress < 100) {
    throw new AppError(409, '이미 YouTube 업로드가 진행 중입니다.');
  }

  setYTProgress(input.bid, input.projectId, { progress: 0, step: '시작' });

  void runYouTubeUpload(input, project).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[book-v2 longform YT] upload failed:', msg);
    setYTProgress(input.bid, input.projectId, { progress: -1, step: '실패', error: msg });
    clearYTProgressLater(input.bid, input.projectId, 60_000);
  });

  return { ok: true };
}

async function runYouTubeUpload(
  input: UploadYouTubeInput,
  project: LongformProjectV2
): Promise<void> {
  // 1. R2에서 영상 다운로드
  setYTProgress(input.bid, input.projectId, { progress: 5, step: 'R2에서 영상 다운로드' });
  const r2Key = urlToR2Key(project.videoUrl!);
  const videoBuffer = await downloadFromR2(r2Key);

  // 2. YouTube 업로드 (콜백으로 진행률)
  setYTProgress(input.bid, input.projectId, { progress: 10, step: 'YouTube 업로드 중' });
  const result = await YouTubeProvider.uploadVideo(
    videoBuffer,
    input.meta,
    (percent) => {
      const mapped = 10 + Math.round(percent * 0.85); // 10~95
      setYTProgress(input.bid, input.projectId, {
        progress: mapped,
        step: `YouTube 업로드 중 (${mapped}%)`,
      });
    },
    input.channelId
  );

  // 3. 결과 먼저 저장 (썸네일 실패해도 영상 결과 보존)
  await saveLongform(input.bid, input.projectId, {
    youtubeVideoId: result.videoId,
    channelId: result.channelId,
  });

  // 4. (선택) 썸네일 — meta.thumbnailUrl 있으면
  if (input.meta.thumbnailUrl) {
    setYTProgress(input.bid, input.projectId, { progress: 96, step: '썸네일 업로드 중' });
    try {
      const thumbKey = urlToR2Key(input.meta.thumbnailUrl);
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
        YouTubeProvider.setThumbnail(result.videoId, thumbBuffer, input.channelId),
        thumbTimeout,
      ]);
      // thumbnailUrl 저장 (project)
      await saveLongform(input.bid, input.projectId, {
        thumbnailUrl: input.meta.thumbnailUrl,
      });
    } catch (err) {
      console.warn(
        '[book-v2 youtube] Thumbnail failed (skipping):',
        err instanceof Error ? err.message : err
      );
    }
  }

  setYTProgress(input.bid, input.projectId, { progress: 100, step: '업로드 완료' });
  clearYTProgressLater(input.bid, input.projectId, 30_000);
}

/**
 * Gemini로 YouTube 메타(title/description/tags/privacy/categoryId/language) 자동 생성.
 * project.language의 텍스트 슬라이스 페이지 내용을 컨텍스트로 활용.
 */
export async function generateLongformYouTubeMeta(
  bid: string,
  projectId: string,
  prompt: string
): Promise<YouTubeGeneratedMeta> {
  const project = await getLongform(bid, projectId);
  const manifest = await getBook(bid);
  const ts = await getTextSlice(bid, project.level, project.language);

  const lang = project.language || 'ko';
  const pages = ts?.pages ?? [];

  const ctx = [
    `Title: ${manifest.title}`,
    manifest.category ? `Category: ${manifest.category}` : '',
    `Content Language: ${lang}`,
    `Level: ${project.level}`,
    `Style: ${project.style}`,
    `Pages: ${pages.length}`,
    `Scenes: ${project.scenes.length}`,
    pages.length > 0
      ? `Content Summary:\n${pages
          .slice(0, 10)
          .map((p) => `- p${p.pageNumber}: ${p.text.slice(0, 100)}`)
          .join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const geminiPrompt = [
    prompt || 'Generate engaging YouTube metadata for a children storybook video.',
    '',
    '=== Storybook Info ===',
    ctx,
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
      title: parsed.title || manifest.title,
      description: parsed.description || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      privacy: (['public', 'private', 'unlisted'] as const).includes(
        parsed.privacy as 'public' | 'private' | 'unlisted'
      )
        ? parsed.privacy
        : 'private',
      categoryId: parsed.categoryId || '27',
      language: parsed.language || lang,
    };
  } catch {
    console.error('[book-v2 longform YT] Failed to parse Gemini meta response:', cleaned);
    throw new AppError(500, 'AI 응답을 파싱할 수 없습니다. 프롬프트를 수정해보세요.');
  }
}

/** 외부에서 올린 YT 영상을 v2 프로젝트에 수동 연결 (renderless) */
export async function linkLongformYouTubeVideo(
  bid: string,
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

  await getLongform(bid, projectId);
  const meta = await YouTubeProvider.getVideoMeta(videoId);
  if (!meta) throw new AppError(404, '해당 영상을 찾을 수 없거나 비공개입니다.');

  await saveLongform(bid, projectId, {
    youtubeVideoId: videoId,
    ...(meta.ownedByChannelId ? { channelId: meta.ownedByChannelId } : {}),
  });

  return {
    videoId,
    videoUrl: `https://youtu.be/${videoId}`,
    ownerConnected: !!meta.ownedByChannelId,
    channelTitle: meta.channelTitle,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Longform Captions (SRT 생성/번역/YT 업로드)
// ────────────────────────────────────────────────────────────────────────────

export interface GeneratedCaptionV2 {
  srt: string;
  generatedAt: string;
}

interface LongformCaptionsCache {
  generatedCaptions?: Record<string, GeneratedCaptionV2>;
  captionsUploaded?: string[];
  captionsFailed?: { lang: string; error: string }[];
}

const longformCaptionProgress = new Map<string, LongformYouTubeProgress>();

function captionProgressKey(bid: string, projectId: string): string {
  return `${bid}:${projectId}`;
}

function setCaptionProgress(
  bid: string,
  projectId: string,
  p: Omit<LongformYouTubeProgress, 'updatedAt'>
): void {
  longformCaptionProgress.set(captionProgressKey(bid, projectId), {
    ...p,
    updatedAt: Date.now(),
  });
}

function clearCaptionProgressLater(bid: string, projectId: string, ms: number): void {
  setTimeout(() => longformCaptionProgress.delete(captionProgressKey(bid, projectId)), ms);
}

export function getLongformCaptionProgress(
  bid: string,
  projectId: string
): LongformYouTubeProgress | null {
  return longformCaptionProgress.get(captionProgressKey(bid, projectId)) ?? null;
}

/** SRT 생성 (base lang) + 다른 언어 번역. project.generatedCaptions에 저장. */
export async function generateLongformCaptions(
  bid: string,
  projectId: string,
  languages: string[]
): Promise<{ baseLang: string; generatedCaptions: Record<string, GeneratedCaptionV2> }> {
  const project = await getLongform(bid, projectId);

  const baseLang = project.language || 'ko';
  // v1 LongformScene과 v2의 scenes는 구조 동일 — 직접 재사용
  const baseSrt = generateLongformSrt(project.scenes as Parameters<typeof generateLongformSrt>[0]);
  if (!baseSrt.trim()) {
    throw new AppError(400, '자막으로 변환할 텍스트가 없습니다.');
  }

  const cache = (project as LongformCaptionsCache).generatedCaptions ?? {};
  const now = new Date().toISOString();
  const generated: Record<string, GeneratedCaptionV2> = {
    ...cache,
    [baseLang]: { srt: baseSrt, generatedAt: now },
  };

  for (const lang of languages) {
    if (lang === baseLang) continue;
    const translated = await translateSrt(baseSrt, baseLang, lang);
    generated[lang] = { srt: translated, generatedAt: new Date().toISOString() };
  }

  await saveLongform(bid, projectId, {
    generatedCaptions: generated,
  } as Partial<LongformProjectV2>);
  return { baseLang, generatedCaptions: generated };
}

/** YouTube에 자막 업로드 (fire-and-forget + 진행률) */
export async function startLongformUploadCaptions(
  bid: string,
  projectId: string,
  languages: string[],
  explicitChannelId?: string
): Promise<{ ok: true }> {
  const project = await getLongform(bid, projectId);
  const videoId = project.youtubeVideoId;
  if (!videoId) {
    throw new AppError(400, 'YouTube에 업로드된 영상이 없습니다.');
  }
  const cache = (project as LongformCaptionsCache).generatedCaptions ?? {};
  if (Object.keys(cache).length === 0) {
    throw new AppError(400, '먼저 SRT를 생성하세요.');
  }
  const targetLangs = languages.filter((l) => cache[l]);
  if (targetLangs.length === 0) {
    throw new AppError(400, '업로드할 언어의 SRT가 생성되어 있지 않습니다.');
  }

  const existing = longformCaptionProgress.get(captionProgressKey(bid, projectId));
  if (existing && existing.progress >= 0 && existing.progress < 100) {
    throw new AppError(409, '이미 자막 업로드가 진행 중입니다.');
  }

  setCaptionProgress(bid, projectId, { progress: 0, step: '자막 업로드 시작' });

  void runUploadCaptions(bid, projectId, targetLangs, cache, videoId, explicitChannelId).catch(
    (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[book-v2 captions] upload failed:', msg);
      setCaptionProgress(bid, projectId, { progress: -1, step: '실패', error: msg });
      clearCaptionProgressLater(bid, projectId, 60_000);
    }
  );

  return { ok: true };
}

async function runUploadCaptions(
  bid: string,
  projectId: string,
  targetLangs: string[],
  cache: Record<string, GeneratedCaptionV2>,
  videoId: string,
  explicitChannelId?: string
): Promise<void> {
  // Channel 우선순위: 저장된 channelId → 명시 → 자동 탐지
  const project = await getLongform(bid, projectId);
  let effectiveChannelId = project.channelId ?? explicitChannelId;
  if (!effectiveChannelId) {
    const found = await YouTubeProvider.findChannelIdForVideo(videoId);
    if (found) {
      effectiveChannelId = found;
      await saveLongform(bid, projectId, { channelId: found });
    }
  }

  const totalSteps = targetLangs.length;
  const uploaded: string[] = [];
  const failed: { lang: string; error: string }[] = [];

  for (let i = 0; i < targetLangs.length; i++) {
    const lang = targetLangs[i];
    setCaptionProgress(bid, projectId, {
      progress: Math.round(((i + 1) / totalSteps) * 100),
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
      console.warn(`[book-v2 captions] failed for ${lang}:`, err);
      failed.push({ lang, error: msg });
    }
  }

  await saveLongform(bid, projectId, {
    captionsUploaded: uploaded,
    captionsFailed: failed.length > 0 ? failed : undefined,
  } as Partial<LongformProjectV2>);

  if (uploaded.length === 0 && failed.length > 0) {
    const summary = failed.map((f) => `${f.lang}: ${f.error}`).join(' | ');
    setCaptionProgress(bid, projectId, {
      progress: -1,
      step: `모든 자막 업로드 실패 — ${summary}`,
    });
    clearCaptionProgressLater(bid, projectId, 60_000);
    return;
  }

  const step =
    failed.length > 0
      ? `완료 (${uploaded.length} 성공, ${failed.length} 실패: ${failed.map((f) => f.lang).join(', ')})`
      : '자막 업로드 완료';
  setCaptionProgress(bid, projectId, { progress: 100, step });
  clearCaptionProgressLater(bid, projectId, 30_000);
}

// ────────────────────────────────────────────────────────────────────────────
// Game instances
// ────────────────────────────────────────────────────────────────────────────

export async function listGames(
  bid: string,
  filter?: { level?: ReadingLevel; language?: string }
): Promise<BookGameInstance[]> {
  await getBook(bid);
  return listGameInstances(bid, filter);
}

export async function getGame(bid: string, gameId: string): Promise<BookGameInstance> {
  await getBook(bid);
  const g = await getGameInstance(bid, gameId);
  if (!g) throw new AppError(404, `game ${gameId} not found`);
  return g;
}

export async function deleteGame(bid: string, gameId: string): Promise<void> {
  await getBook(bid);
  await r2DeleteGameInstance(bid, gameId);
}

export interface GenerateGameInput {
  bid: string;
  level: ReadingLevel;
  language: string;
  gameType: GameTypeId;
  itemCount?: number;
}

/**
 * 게임 생성 v2 — 단순한 게임부터 지원.
 * 현재 지원: 'korean-line-matching', 'english-line-matching'
 */
export async function generateGame(input: GenerateGameInput): Promise<BookGameInstance> {
  const m = await getBook(input.bid);
  if (!m.usedVariants.levels.includes(input.level)) {
    throw new AppError(400, `level ${input.level} not in usedVariants`);
  }
  if (!m.usedVariants.languages.includes(input.language)) {
    throw new AppError(400, `language ${input.language} not in usedVariants`);
  }
  const ts = await getTextSlice(input.bid, input.level, input.language);
  if (!ts) throw new AppError(400, `text slice not found: ${input.level}/${input.language}`);

  // line-matching만 지원 (Phase 3b-7e-ii 첫 게임 타입)
  if (input.gameType !== 'korean-line-matching' && input.gameType !== 'english-line-matching') {
    throw new AppError(
      400,
      `게임 타입 ${input.gameType}은(는) v2에서 아직 지원하지 않습니다 (line-matching만 가능).`
    );
  }

  // keyObject 후보 (textSlice에 등록된 항목들 중 이미지 있는 것)
  const candidates: { keyObjId: string; word: string }[] = [];
  for (const [keyObjId, txt] of Object.entries(ts.keyObjectsText)) {
    const word = input.language === 'ko' ? (txt.korean ?? txt.word) : txt.word;
    if (word) candidates.push({ keyObjId, word });
  }
  if (candidates.length < 3) {
    throw new AppError(400, '이 책의 핵심단어(이미지 있는 것)가 부족해요 (최소 3개).');
  }

  // 셔플 + 픽
  const desired = Math.max(input.itemCount ?? 4, 3);
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(desired, candidates.length));

  // BookGameInstance — 이미지는 imageRefs로 저장 (런타임 머지)
  const items = picked.map((p) => ({
    word: p.word,
    imageUrl: '', // 런타임에 활성 style의 이미지로 머지됨
    keyObjId: p.keyObjId, // ref용 (data에 임시 보존)
  }));
  const imageRefs = picked.map((p) => ({ kind: 'keyObj' as const, refId: p.keyObjId }));

  const id = `game-${input.gameType}-${Date.now()}`;
  const instance: BookGameInstance = {
    id,
    gameType: input.gameType,
    config: { itemCount: desired } as BookGameInstance['config'],
    data: {
      type: input.gameType,
      items: items.map((i) => ({ word: i.word, imageUrl: i.imageUrl })),
    } as BookGameInstance['data'],
    level: input.level,
    language: input.language,
    imageRefs,
    createdAt: new Date().toISOString(),
  };

  await putGameInstance(input.bid, instance);
  return instance;
}

// ────────────────────────────────────────────────────────────────────────────
// Marketing — Blog
// ────────────────────────────────────────────────────────────────────────────

export async function listBlogs(bid: string, language?: string): Promise<BlogPostV2[]> {
  await getBook(bid);
  return r2ListBlogPosts<BlogPostV2>(bid, language ? { language } : undefined);
}

export async function getBlog(bid: string, postId: string): Promise<BlogPostV2> {
  await getBook(bid);
  const p = await r2GetBlogPost<BlogPostV2>(bid, postId);
  if (!p) throw new AppError(404, `blog post ${postId} not found`);
  return p;
}

export interface CreateBlogInput {
  bid: string;
  language: string;
  title?: string;
}

export async function createBlog(input: CreateBlogInput): Promise<BlogPostV2> {
  const m = await getBook(input.bid);
  if (!m.usedVariants.languages.includes(input.language)) {
    throw new AppError(400, `language ${input.language} not in usedVariants`);
  }
  const now = new Date().toISOString();
  const id = `blog-${Date.now()}`;
  const post: BlogPostV2 = {
    id,
    language: input.language,
    title: input.title?.trim() || '제목 없음',
    summary: '',
    tags: [],
    sections: [],
    createdAt: now,
    updatedAt: now,
  };
  await r2PutBlogPost(input.bid, id, post);
  return post;
}

export async function saveBlog(
  bid: string,
  postId: string,
  patch: Partial<BlogPostV2>
): Promise<BlogPostV2> {
  const current = await getBlog(bid, postId);
  const next: BlogPostV2 = {
    ...current,
    ...patch,
    id: current.id,
    language: current.language,
    updatedAt: new Date().toISOString(),
  };
  await r2PutBlogPost(bid, postId, next);
  return next;
}

export async function deleteBlog(bid: string, postId: string): Promise<void> {
  await getBook(bid);
  await r2DeleteBlogPost(bid, postId);
}

// ────────────────────────────────────────────────────────────────────────────
// Marketing — Card News
// ────────────────────────────────────────────────────────────────────────────

export async function listCardNewsProjects(
  bid: string,
  language?: string
): Promise<CardNewsProjectV2[]> {
  await getBook(bid);
  return r2ListCardNews<CardNewsProjectV2>(bid, language ? { language } : undefined);
}

export async function getCardNewsProject(
  bid: string,
  projectId: string
): Promise<CardNewsProjectV2> {
  await getBook(bid);
  const p = await r2GetCardNews<CardNewsProjectV2>(bid, projectId);
  if (!p) throw new AppError(404, `card-news ${projectId} not found`);
  return p;
}

export interface CreateCardNewsInput {
  bid: string;
  language: string;
  title?: string;
}

export async function createCardNewsProject(
  input: CreateCardNewsInput
): Promise<CardNewsProjectV2> {
  const m = await getBook(input.bid);
  if (!m.usedVariants.languages.includes(input.language)) {
    throw new AppError(400, `language ${input.language} not in usedVariants`);
  }
  const now = new Date().toISOString();
  const id = `cardnews-${Date.now()}`;
  const project: CardNewsProjectV2 = {
    id,
    language: input.language,
    title: input.title?.trim() || '제목 없음',
    colorTheme: 'coral',
    slides: [],
    createdAt: now,
    updatedAt: now,
  };
  await r2PutCardNews(input.bid, id, project);
  return project;
}

export async function saveCardNewsProject(
  bid: string,
  projectId: string,
  patch: Partial<CardNewsProjectV2>
): Promise<CardNewsProjectV2> {
  const current = await getCardNewsProject(bid, projectId);
  const next: CardNewsProjectV2 = {
    ...current,
    ...patch,
    id: current.id,
    language: current.language,
    updatedAt: new Date().toISOString(),
  };
  await r2PutCardNews(bid, projectId, next);
  return next;
}

export async function deleteCardNewsProject(bid: string, projectId: string): Promise<void> {
  await getBook(bid);
  await r2DeleteCardNews(bid, projectId);
}

// ────────────────────────────────────────────────────────────────────────────
// Runtime — viewer/game payload (학습자용)
// ────────────────────────────────────────────────────────────────────────────

export async function getRuntimeViewer(
  bid: string,
  level: ReadingLevel,
  language: string,
  style: string
): Promise<MergedViewerPayload> {
  const manifest = await getBook(bid);

  const textSlice = await getTextSlice(bid, level, language);
  if (!textSlice) throw new AppError(404, `text slice not found: ${level}/${language}`);

  const styleSlice = await getStyleSlice(bid, style);
  if (!styleSlice) throw new AppError(404, `style slice not found: ${style}`);

  return mergeForViewer({ manifest, textSlice, styleSlice });
}

export async function getRuntimeGame(
  bid: string,
  gameId: string,
  style: string
): Promise<MergedGamePayload> {
  const manifest = await getBook(bid);
  const instance = await getGameInstance(bid, gameId);
  if (!instance) throw new AppError(404, `game ${gameId} not found`);

  const styleSlice = await getStyleSlice(bid, style);
  if (!styleSlice) throw new AppError(404, `style slice not found: ${style}`);

  // 게임 instance의 (level, language)에 맞는 textSlice (refText 채움용)
  const textSlice = (await getTextSlice(bid, instance.level, instance.language)) ?? undefined;

  // manifest는 future 확장(예: keyObjectIds 검증)에 사용. 현재는 단순 머지.
  void manifest;
  return mergeForGame({ instance, styleSlice, textSlice });
}
