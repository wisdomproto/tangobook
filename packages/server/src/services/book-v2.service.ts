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
  getAudiobookProject as r2GetAudiobookProject,
  putAudiobookProject as r2PutAudiobookProject,
  putAudiobookRender,
  listAudiobookRenders,
  getBookIndex,
  refreshBookIndex,
  deleteBook as deleteBookFromR2,
} from '../repositories/book-v2.repository.js';
import { mergeForViewer, mergeForGame } from '../utils/book-v2-runtime-merge.js';
import { audiobookRenderKey } from '../utils/book-v2-keys.js';
import { buildAudiobookRenderDataV2 } from '../utils/book-v2-audiobook-render.js';
import { loadRemotion, getRemotionBundlePath } from '../utils/remotion-bundle.js';
import { getAudioDuration } from '../utils/audio-duration.js';
import { r2PublicUrl } from '../providers/r2.provider.js';
import type {
  BookManifest,
  BookTextSlice,
  BookStyleSlice,
  BookCharacter,
  BookGameInstance,
  AudiobookProjectV2,
  AudiobookRenderV2,
  ReadingLevel,
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
// Game instances
// ────────────────────────────────────────────────────────────────────────────

export async function listGames(
  bid: string,
  filter?: { level?: ReadingLevel; language?: string }
): Promise<BookGameInstance[]> {
  await getBook(bid);
  return listGameInstances(bid, filter);
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
