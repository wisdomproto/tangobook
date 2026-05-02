// Book Variants V2 — R2 Repository
//
// 새 prefix 트리(books/{bid}/...) 기반 CRUD. v1 storybook.repository와 별개로 격리.
//
// 캐시:
//  - in-memory manifest 캐시 (5분 TTL + stale-while-revalidate)
//  - 라이브러리 인덱스 _index/books.json (refreshBookIndex로 갱신)
//
// 스펙: docs/superpowers/specs/2026-04-25-book-variants-design.md §3
// 플랜: docs/superpowers/plans/2026-04-25-book-variants-plan.md Task 1.3

import {
  uploadBufferToR2,
  uploadJsonToR2,
  downloadFromR2,
  deleteFromR2,
  deleteManyFromR2,
  listR2Objects,
  objectExists,
  urlToR2Key,
  r2PublicUrl,
} from '../providers/r2.provider.js';
import { imageToWebp } from '../utils/transcode.js';
import {
  manifestKey,
  textSliceKey,
  audioFileKey,
  styleCharactersKey,
  styleCoverKey,
  stylePageImageKey,
  styleKeyObjectImageKey,
  styleVocabImageKey,
  gameInstanceKey,
  audiobookProjectKey,
  audiobookRenderKey,
  audiobookRenderMetaKey,
  longformProjectKey,
  longformVideoKey,
  blogPostKey,
  cardNewsKey,
  bookIndexKey,
  bookPrefix,
  stylePrefix,
  longformPrefix,
  gamesPrefix,
  marketingPrefix,
  parseTextSliceKey,
  parseAudiobookRenderKey,
} from '../utils/book-v2-keys.js';
import type {
  BookManifest,
  BookTextSlice,
  BookStyleSlice,
  BookCharacter,
  BookGameInstance,
  AudiobookProjectV2,
  AudiobookRenderV2,
  LongformProjectV2,
  BookIndex,
  BookIndexEntry,
  ReadingLevel,
} from '@tangobook/shared';

// ────────────────────────────────────────────────────────────────────────────
// Cache
// ────────────────────────────────────────────────────────────────────────────

const INDEX_TTL = 5 * 60 * 1000;
const LIST_CONCURRENCY = 30;

let indexCache: BookIndex | null = null;
let indexCacheTime = 0;
let indexRefreshInFlight: Promise<BookIndex> | null = null;

const manifestMemo = new Map<string, { manifest: BookManifest; ts: number }>();
const MANIFEST_TTL = 5 * 60 * 1000;

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

async function getJson<T>(key: string): Promise<T | null> {
  try {
    const buf = await downloadFromR2(key);
    return JSON.parse(buf.toString('utf-8')) as T;
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

async function putJson<T>(data: T, key: string): Promise<string> {
  return uploadJsonToR2(data, key);
}

function nowIso() {
  return new Date().toISOString();
}

// ────────────────────────────────────────────────────────────────────────────
// Manifest
// ────────────────────────────────────────────────────────────────────────────

export async function getManifest(bid: string): Promise<BookManifest | null> {
  const cached = manifestMemo.get(bid);
  if (cached && Date.now() - cached.ts < MANIFEST_TTL) return cached.manifest;
  const m = await getJson<BookManifest>(manifestKey(bid));
  if (m) manifestMemo.set(bid, { manifest: m, ts: Date.now() });
  return m;
}

export async function putManifest(bid: string, manifest: BookManifest): Promise<void> {
  if (manifest.id !== bid) {
    throw new Error(`putManifest: id mismatch (manifest.id=${manifest.id}, bid=${bid})`);
  }
  const next: BookManifest = { ...manifest, updatedAt: nowIso() };
  await putJson(next, manifestKey(bid));
  manifestMemo.set(bid, { manifest: next, ts: Date.now() });
  await syncIndexEntry(bid, summarizeManifest(next));
}

export async function deleteBook(bid: string): Promise<void> {
  // 모든 books/{bid}/* 객체 일괄 삭제
  const objects = await listR2Objects(bookPrefix(bid));
  const keys = objects.map((o) => o.Key!).filter(Boolean);
  if (keys.length) await deleteManyFromR2(keys);
  manifestMemo.delete(bid);
  await syncIndexEntry(bid, null);
}

// ────────────────────────────────────────────────────────────────────────────
// Text slice
// ────────────────────────────────────────────────────────────────────────────

export async function getTextSlice(
  bid: string,
  level: ReadingLevel,
  language: string
): Promise<BookTextSlice | null> {
  return getJson<BookTextSlice>(textSliceKey(bid, level, language));
}

export async function putTextSlice(
  bid: string,
  level: ReadingLevel,
  language: string,
  slice: BookTextSlice
): Promise<void> {
  if (slice.level !== level || slice.language !== language) {
    throw new Error(
      `putTextSlice: slice/path mismatch (slice=${slice.level}/${slice.language}, path=${level}/${language})`
    );
  }
  await putJson(slice, textSliceKey(bid, level, language));
}

export async function listTextSlices(
  bid: string
): Promise<{ level: ReadingLevel; language: string; key: string }[]> {
  const objs = await listR2Objects(`${bookPrefix(bid)}texts/`);
  const out: { level: ReadingLevel; language: string; key: string }[] = [];
  for (const o of objs) {
    if (!o.Key) continue;
    const parsed = parseTextSliceKey(o.Key);
    if (parsed) out.push({ ...parsed, key: o.Key });
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Audio (TTS)
// ────────────────────────────────────────────────────────────────────────────

export async function uploadAudio(
  bid: string,
  level: ReadingLevel,
  language: string,
  pageNumber: number,
  buffer: Buffer,
  contentType = 'audio/mpeg'
): Promise<string> {
  return uploadBufferToR2(buffer, audioFileKey(bid, level, language, pageNumber), contentType);
}

// ────────────────────────────────────────────────────────────────────────────
// Style slice
// ────────────────────────────────────────────────────────────────────────────

export async function getStyleCharacters(bid: string, style: string): Promise<BookCharacter[]> {
  const data = await getJson<{ characters: BookCharacter[] }>(styleCharactersKey(bid, style));
  return data?.characters ?? [];
}

export async function putStyleCharacters(
  bid: string,
  style: string,
  characters: BookCharacter[]
): Promise<void> {
  await putJson({ characters }, styleCharactersKey(bid, style));
}

/** style 슬라이스를 R2 list로부터 머지해서 반환 (이미지 URL은 public path로 재구성) */
export async function getStyleSlice(bid: string, style: string): Promise<BookStyleSlice | null> {
  const charactersExists = await objectExists(styleCharactersKey(bid, style));
  if (!charactersExists) {
    // 존재하지 않으면 null (커버 등 부분 자산만 있는 경우는 빈 슬라이스 반환을 원하면 처리 변경)
    return null;
  }
  const characters = await getStyleCharacters(bid, style);

  const objects = await listR2Objects(stylePrefix(bid, style));
  const pageImages: BookStyleSlice['pageImages'] = {};
  const keyObjectImages: Record<string, string> = {};
  const vocabImages: Record<string, string> = {};
  let coverImageUrl = '';

  for (const o of objects) {
    if (!o.Key) continue;
    const url = publicUrlOf(o.Key);
    if (/\/cover\.(webp|png|jpg)$/.test(o.Key)) {
      coverImageUrl = url;
    } else {
      const pageMatch = o.Key.match(/\/pages\/(L[1-4])\/([^/]+)\.(webp|png|jpg)$/);
      if (pageMatch) {
        const lvl = pageMatch[1] as ReadingLevel;
        const ill = pageMatch[2];
        if (!pageImages[lvl]) pageImages[lvl] = {};
        pageImages[lvl]![ill] = url;
        continue;
      }
      const koMatch = o.Key.match(/\/key-objects\/([^/]+)\.(webp|png|jpg)$/);
      if (koMatch) {
        keyObjectImages[koMatch[1]] = url;
        continue;
      }
      const vocMatch = o.Key.match(/\/vocabulary\/([^/]+)\.(webp|png|jpg)$/);
      if (vocMatch) {
        vocabImages[vocMatch[1]] = url;
        continue;
      }
    }
  }

  return {
    style,
    characters,
    coverImageUrl,
    coverImageHistory: [],
    pageImages,
    keyObjectImages,
    vocabImages,
  };
}

function publicUrlOf(key: string): string {
  return `${r2PublicUrl}/${key}`;
}

/** style asset 업로드 (이미지는 WebP 변환). 반환: public URL */
export async function uploadStyleAsset(opts: {
  bid: string;
  style: string;
  kind: 'cover' | 'page' | 'keyObj' | 'vocab';
  imageBuffer: Buffer;
  level?: ReadingLevel; // kind=page에서 필수
  illustrationKey?: string; // kind=page에서 필수
  refId?: string; // kind=keyObj/vocab에서 필수
}): Promise<string> {
  const webp = await imageToWebp(opts.imageBuffer);
  let key: string;
  switch (opts.kind) {
    case 'cover':
      key = styleCoverKey(opts.bid, opts.style);
      break;
    case 'page':
      if (!opts.level || !opts.illustrationKey) {
        throw new Error('uploadStyleAsset: page requires level + illustrationKey');
      }
      key = stylePageImageKey(opts.bid, opts.style, opts.level, opts.illustrationKey);
      break;
    case 'keyObj':
      if (!opts.refId) throw new Error('uploadStyleAsset: keyObj requires refId');
      key = styleKeyObjectImageKey(opts.bid, opts.style, opts.refId);
      break;
    case 'vocab':
      if (!opts.refId) throw new Error('uploadStyleAsset: vocab requires refId');
      key = styleVocabImageKey(opts.bid, opts.style, opts.refId);
      break;
  }
  return uploadBufferToR2(webp, key, 'image/webp');
}

// ────────────────────────────────────────────────────────────────────────────
// Game instances
// ────────────────────────────────────────────────────────────────────────────

export async function getGameInstance(
  bid: string,
  gameId: string
): Promise<BookGameInstance | null> {
  return getJson<BookGameInstance>(gameInstanceKey(bid, gameId));
}

export async function putGameInstance(bid: string, instance: BookGameInstance): Promise<void> {
  await putJson(instance, gameInstanceKey(bid, instance.id));
}

export async function deleteGameInstance(bid: string, gameId: string): Promise<void> {
  await deleteFromR2(gameInstanceKey(bid, gameId));
}

export async function listGameInstances(
  bid: string,
  filter?: { level?: ReadingLevel; language?: string }
): Promise<BookGameInstance[]> {
  const objs = await listR2Objects(gamesPrefix(bid));
  const all: BookGameInstance[] = [];
  for (let i = 0; i < objs.length; i += LIST_CONCURRENCY) {
    const batch = objs.slice(i, i + LIST_CONCURRENCY);
    await Promise.all(
      batch.map(async (o) => {
        if (!o.Key?.endsWith('.json')) return;
        try {
          const data = await getJson<BookGameInstance>(o.Key);
          if (data) all.push(data);
        } catch {
          /* skip */
        }
      })
    );
  }
  return all.filter(
    (g) =>
      (!filter?.level || g.level === filter.level) &&
      (!filter?.language || g.language === filter.language)
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Audiobook
// ────────────────────────────────────────────────────────────────────────────

export async function getAudiobookProject(bid: string): Promise<AudiobookProjectV2 | null> {
  return getJson<AudiobookProjectV2>(audiobookProjectKey(bid));
}

export async function putAudiobookProject(bid: string, project: AudiobookProjectV2): Promise<void> {
  await putJson(project, audiobookProjectKey(bid));
}

export async function getAudiobookRender(
  bid: string,
  level: ReadingLevel,
  language: string,
  style: string
): Promise<AudiobookRenderV2 | null> {
  return getJson<AudiobookRenderV2>(audiobookRenderMetaKey(bid, level, language, style));
}

export async function putAudiobookRender(
  bid: string,
  render: AudiobookRenderV2,
  videoBuffer?: Buffer
): Promise<void> {
  if (videoBuffer) {
    await uploadBufferToR2(
      videoBuffer,
      audiobookRenderKey(bid, render.level, render.language, render.style),
      'video/mp4'
    );
  }
  await putJson(render, audiobookRenderMetaKey(bid, render.level, render.language, render.style));
}

export async function listAudiobookRenders(bid: string): Promise<AudiobookRenderV2[]> {
  const objs = await listR2Objects(`${bookPrefix(bid)}audiobook/renders/`);
  const out: AudiobookRenderV2[] = [];
  for (const o of objs) {
    if (!o.Key) continue;
    const parsed = parseAudiobookRenderKey(o.Key);
    if (!parsed?.meta) continue;
    const meta = await getJson<AudiobookRenderV2>(o.Key);
    if (meta) out.push(meta);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Longform
// ────────────────────────────────────────────────────────────────────────────

export async function getLongformProject(
  bid: string,
  projectId: string
): Promise<LongformProjectV2 | null> {
  return getJson<LongformProjectV2>(longformProjectKey(bid, projectId));
}

export async function putLongformProject(bid: string, project: LongformProjectV2): Promise<void> {
  await putJson(project, longformProjectKey(bid, project.id));
}

export async function deleteLongformProject(bid: string, projectId: string): Promise<void> {
  await deleteFromR2(longformProjectKey(bid, projectId));
  // 영상 파일이 있으면 함께 삭제
  const videoKey = longformVideoKey(bid, projectId);
  if (await objectExists(videoKey)) await deleteFromR2(videoKey);
}

export async function listLongformProjects(
  bid: string,
  filter?: { level?: ReadingLevel; language?: string; style?: string }
): Promise<LongformProjectV2[]> {
  const objs = await listR2Objects(longformPrefix(bid));
  const all: LongformProjectV2[] = [];
  for (const o of objs) {
    if (!o.Key?.endsWith('.json')) continue;
    const data = await getJson<LongformProjectV2>(o.Key);
    if (data) all.push(data);
  }
  return all.filter(
    (p) =>
      (!filter?.level || p.level === filter.level) &&
      (!filter?.language || p.language === filter.language) &&
      (!filter?.style || p.style === filter.style)
  );
}

export async function uploadLongformVideo(
  bid: string,
  projectId: string,
  buffer: Buffer
): Promise<string> {
  return uploadBufferToR2(buffer, longformVideoKey(bid, projectId), 'video/mp4');
}

// ────────────────────────────────────────────────────────────────────────────
// Marketing
// ────────────────────────────────────────────────────────────────────────────

export async function getBlogPost<T = unknown>(bid: string, postId: string): Promise<T | null> {
  return getJson<T>(blogPostKey(bid, postId));
}

export async function putBlogPost<T>(bid: string, postId: string, data: T): Promise<void> {
  await putJson(data, blogPostKey(bid, postId));
}

export async function deleteBlogPost(bid: string, postId: string): Promise<void> {
  await deleteFromR2(blogPostKey(bid, postId));
}

export async function listBlogPosts<T = unknown>(
  bid: string,
  filter?: { language?: string }
): Promise<T[]> {
  const objs = await listR2Objects(`${marketingPrefix(bid)}blog/`);
  const all: T[] = [];
  for (const o of objs) {
    if (!o.Key?.endsWith('.json')) continue;
    try {
      const d = await getJson<T>(o.Key);
      if (d) all.push(d);
    } catch {
      /* skip */
    }
  }
  if (!filter?.language) return all;
  return all.filter((p) => (p as { language?: string }).language === filter.language);
}

export async function getCardNews<T = unknown>(bid: string, projectId: string): Promise<T | null> {
  return getJson<T>(cardNewsKey(bid, projectId));
}

export async function putCardNews<T>(bid: string, projectId: string, data: T): Promise<void> {
  await putJson(data, cardNewsKey(bid, projectId));
}

export async function deleteCardNews(bid: string, projectId: string): Promise<void> {
  await deleteFromR2(cardNewsKey(bid, projectId));
}

export async function listCardNews<T = unknown>(
  bid: string,
  filter?: { language?: string }
): Promise<T[]> {
  const objs = await listR2Objects(`${marketingPrefix(bid)}card-news/`);
  const all: T[] = [];
  for (const o of objs) {
    if (!o.Key?.endsWith('.json')) continue;
    try {
      const d = await getJson<T>(o.Key);
      if (d) all.push(d);
    } catch {
      /* skip */
    }
  }
  if (!filter?.language) return all;
  return all.filter((p) => (p as { language?: string }).language === filter.language);
}

// ────────────────────────────────────────────────────────────────────────────
// Library index (_index/books.json)
// ────────────────────────────────────────────────────────────────────────────

/**
 * mutation 후 인덱스 1개 entry 를 in-place patch.
 * - entry !== null: upsert (manifest 변경/생성)
 * - entry === null: 삭제
 *
 * indexCache 와 R2 `_index/books.json` 양쪽을 동시에 갱신하여
 * 다음 getBookIndex() 가 stale 데이터를 노출하지 않도록 한다.
 * (이전 invalidateIndex() 는 in-memory 만 비웠고, R2 인덱스 파일은
 *  최대 5분간 stale 상태로 남아 라이브러리에 isPublic 변경이 즉시
 *  반영되지 않는 버그가 있었음.)
 */
async function syncIndexEntry(bid: string, entry: BookIndexEntry | null): Promise<void> {
  let target: BookIndex | null = indexCache;
  if (!target) {
    target = await getJson<BookIndex>(bookIndexKey());
    if (!target) return; // 인덱스 자체가 없으면 prewarm/refresh 가 만든다
  }
  if (entry) {
    const i = target.books.findIndex((b) => b.id === bid);
    if (i >= 0) target.books[i] = entry;
    else target.books.unshift(entry);
  } else {
    target.books = target.books.filter((b) => b.id !== bid);
  }
  target.books.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  target.generatedAt = nowIso();
  await putJson(target, bookIndexKey());
  indexCache = target;
  indexCacheTime = Date.now();
}

function derivePhonicsLanguage(
  bid: string,
  type: BookManifest['type']
): 'korean' | 'english' | undefined {
  if (type !== 'phonics') return undefined;
  if (bid.startsWith('kr-h')) return 'korean';
  if (bid.startsWith('en-b')) return 'english';
  return undefined;
}

function summarizeManifest(m: BookManifest): BookIndexEntry {
  const firstStyle = m.usedVariants.styles[0];
  return {
    id: m.id,
    title: m.title,
    type: m.type,
    category: m.category,
    folder: m.folder,
    isPublic: m.isPublic,
    usedVariants: m.usedVariants,
    hasCover: m.usedVariants.styles.length > 0,
    coverImageUrl: firstStyle ? publicUrlOf(styleCoverKey(m.id, firstStyle)) : undefined,
    phonicsLanguage: derivePhonicsLanguage(m.id, m.type),
    curriculumMeta: m.curriculumMeta,
    updatedAt: m.updatedAt,
  };
}

/** R2 전체 스캔으로 모든 manifest 가져옴 → BookIndex 빌드 + 캐시 + _index/books.json 저장 */
export async function refreshBookIndex(): Promise<BookIndex> {
  const t0 = Date.now();
  const objects = await listR2Objects('books/');
  const manifestKeys = objects.map((o) => o.Key!).filter((k) => k?.endsWith('/manifest.json'));
  const entries: BookIndexEntry[] = [];
  for (let i = 0; i < manifestKeys.length; i += LIST_CONCURRENCY) {
    const batch = manifestKeys.slice(i, i + LIST_CONCURRENCY);
    await Promise.all(
      batch.map(async (k) => {
        try {
          const m = await getJson<BookManifest>(k);
          if (m) entries.push(summarizeManifest(m));
        } catch {
          /* skip */
        }
      })
    );
  }
  entries.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  const index: BookIndex = { books: entries, generatedAt: nowIso() };
  await putJson(index, bookIndexKey());
  indexCache = index;
  indexCacheTime = Date.now();
  console.warn(`[bookIndex] refreshed ${entries.length} manifests in ${Date.now() - t0}ms`);
  return index;
}

/** 캐시 우선 + stale-while-revalidate. 없으면 _index/books.json fetch, 그것도 없으면 refresh. */
export async function getBookIndex(): Promise<BookIndex> {
  // hot cache
  if (indexCache && Date.now() - indexCacheTime < INDEX_TTL) return indexCache;

  // stale return + background refresh
  if (indexCache) {
    if (!indexRefreshInFlight) {
      indexRefreshInFlight = refreshBookIndex().finally(() => {
        indexRefreshInFlight = null;
      });
    }
    return indexCache;
  }

  // 첫 호출: R2 인덱스 파일 우선
  const stored = await getJson<BookIndex>(bookIndexKey());
  if (stored) {
    indexCache = stored;
    indexCacheTime = Date.now();
    return stored;
  }

  // 마지막 fallback: 풀 스캔
  return refreshBookIndex();
}

/** 서버 기동 시 호출 — fire-and-forget */
export function prewarmBookV2IndexCache(): void {
  if (indexRefreshInFlight || indexCache) return;
  indexRefreshInFlight = refreshBookIndex()
    .catch((err) => {
      console.warn('[prewarmBookV2] failed:', err);
      return { books: [], generatedAt: nowIso() };
    })
    .finally(() => {
      indexRefreshInFlight = null;
    });
}

// ────────────────────────────────────────────────────────────────────────────
// Re-exports for convenience (URL → key)
// ────────────────────────────────────────────────────────────────────────────

export { urlToR2Key };
