// BookV2 비즈니스 로직 — 신규 책 생성, 변형 추가, runtime payload 머지.
//
// 스펙: docs/superpowers/specs/2026-04-25-book-variants-design.md
// 플랜: docs/superpowers/plans/2026-04-25-book-variants-plan.md Task 1.5

import { AppError } from '../middleware/error.middleware.js';
import {
  getManifest,
  putManifest,
  getTextSlice,
  putTextSlice,
  getStyleSlice,
  getStyleCharacters,
  putStyleCharacters,
  listGameInstances,
  getGameInstance,
  getBookIndex,
  refreshBookIndex,
  deleteBook as deleteBookFromR2,
} from '../repositories/book-v2.repository.js';
import { mergeForViewer, mergeForGame } from '../utils/book-v2-runtime-merge.js';
import type {
  BookManifest,
  BookTextSlice,
  BookStyleSlice,
  BookCharacter,
  BookGameInstance,
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
