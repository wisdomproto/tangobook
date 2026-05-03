import {
  uploadBufferToR2,
  uploadJsonToR2,
  deleteFromR2,
  urlToR2Key,
  listR2Objects,
  downloadFromR2,
} from '../providers/r2.provider.js';
import { imageToWebp } from '../utils/transcode.js';
import {
  canonicalizeArtStyle,
  canonicalizeStyleAssets,
  type Storybook,
  type StorybookSummary,
} from '@tangobook/shared';

const STORYBOOK_PREFIX = 'storybook-';

// ===== In-memory list cache =====
let listCache: StorybookSummary[] | null = null;
let listCacheTime = 0;
let refreshInFlight: Promise<StorybookSummary[]> | null = null;
let refreshInFlightStartedAt = 0;
const LIST_CACHE_TTL = 5 * 60 * 1000; // 5분
const LIST_CONCURRENCY = 30;
const REFRESH_MAX_MS = 90_000; // 90초 — 정상 refresh가 이 안에 안 끝나면 stuck 으로 간주

async function refreshListCacheFromR2(): Promise<StorybookSummary[]> {
  const t0 = Date.now();
  const objects = await listR2Objects(STORYBOOK_PREFIX);
  const jsonObjects = objects.filter((obj) => obj.Key?.endsWith('.json'));
  const summaries: StorybookSummary[] = [];
  for (let i = 0; i < jsonObjects.length; i += LIST_CONCURRENCY) {
    const batch = jsonObjects.slice(i, i + LIST_CONCURRENCY);
    await Promise.all(
      batch.map(async (obj) => {
        try {
          const buffer = await downloadFromR2(obj.Key!);
          const sb = JSON.parse(buffer.toString('utf-8')) as Storybook;
          summaries.push(toSummary(sb));
        } catch {
          // 개별 파일 로드 실패 무시 (timeout 포함)
        }
      })
    );
  }
  const sorted = summaries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  listCache = sorted;
  listCacheTime = Date.now();
  console.warn(`[listStorybooks] refreshed ${sorted.length} items in ${Date.now() - t0}ms`);
  return sorted;
}

function startRefresh(): Promise<StorybookSummary[]> {
  refreshInFlightStartedAt = Date.now();
  refreshInFlight = refreshListCacheFromR2()
    .catch((err) => {
      console.warn('[listStorybooks] refresh failed:', err);
      return listCache ?? ([] as StorybookSummary[]);
    })
    .finally(() => {
      refreshInFlight = null;
      refreshInFlightStartedAt = 0;
    });
  return refreshInFlight;
}

/** 서버 기동 시 호출 — 첫 사용자 요청 전에 캐시를 미리 채움 */
export function prewarmStorybookListCache(): void {
  if (refreshInFlight || listCache) return;
  startRefresh();
}

function toSummary(sb: Storybook): StorybookSummary {
  const hasAudiobookVideo = sb.audiobookProjects?.some((p) => !!p.youtubeUpload?.videoId) ?? false;
  const hasLongformVideo = sb.longformProjects?.some((p) => !!p.youtubeUpload?.videoId) ?? false;

  // 한글 기본 완성도 산출 (커리큘럼 마스터 ✅ 판단)
  const pages = sb.pages ?? [];
  const cover = !!sb.coverImage || !!sb.coverImages?.[0]?.imageUrl;
  const pagesImage = pages.length > 0 && pages.every((p) => !!p.illustrationUrl);
  const pagesTts = pages.length > 0 && pages.every((p) => !!p.ttsUrl);
  const vocabulary = (sb.key_objects?.length ?? 0) > 0;
  const koCompletion = {
    cover,
    pagesImage,
    pagesTts,
    vocabulary,
    complete: cover && pagesImage && pagesTts && vocabulary,
  };

  return {
    id: sb.id,
    title: sb.title,
    type: sb.type,
    targetAge: sb.targetAge,
    artStyle: sb.artStyle,
    category: sb.category,
    folder: sb.folder,
    isPublic: sb.isPublic,
    createdAt: sb.createdAt,
    coverImage: sb.coverImage,
    pageCount: pages.length,
    phonicsLanguage: sb.phonicsConfig?.language,
    hasVideo: hasAudiobookVideo || hasLongformVideo,
    koCompletion,
  };
}

function storybookKey(id: string): string {
  return `${STORYBOOK_PREFIX}${id}.json`;
}

/** 기존 R2 데이터의 필드명을 현재 타입에 맞게 정규화 */
function normalizeStorybook(sb: Record<string, unknown>): Storybook {
  const pages = (sb.pages as Array<Record<string, unknown>> | undefined) ?? [];
  const normalizedPages = pages.map((p) => {
    // illustrationImage → illustrationUrl
    if (p.illustrationImage && !p.illustrationUrl) {
      p.illustrationUrl = p.illustrationImage;
    }
    // audioUrl → ttsUrl
    if (p.audioUrl && !p.ttsUrl) {
      p.ttsUrl = p.audioUrl;
    }
    return p;
  });

  // top-level translations → per-page translations
  const topTranslations = sb.translations as
    | Record<string, Array<Record<string, unknown>>>
    | undefined;
  if (topTranslations && typeof topTranslations === 'object') {
    for (const [lang, langPages] of Object.entries(topTranslations)) {
      if (lang === 'ko' || !Array.isArray(langPages)) continue;
      langPages.forEach((lp, idx) => {
        const page = normalizedPages[idx] as Record<string, unknown> | undefined;
        if (!page || !lp.text) return;
        if (!page.translations) page.translations = {};
        (page.translations as Record<string, unknown>)[lang] = { text: lp.text };
      });
    }
  }

  // keyObjectImages: name → objectName
  const keyObjImages = sb.keyObjectImages as Array<Record<string, unknown>> | undefined;
  if (keyObjImages) {
    keyObjImages.forEach((img) => {
      if (img.name && !img.objectName) {
        img.objectName = img.name;
      }
    });
  }

  // folder "all" 은 잘못 저장된 값 → 제거
  if (sb.folder === 'all') sb.folder = undefined;

  return { ...sb, pages: normalizedPages } as unknown as Storybook;
}

export const R2Repository = {
  async listStorybooks(): Promise<StorybookSummary[]> {
    const now = Date.now();

    // Stuck refresh recovery — 90초 넘게 pending 이면 강제로 새 refresh 시도
    if (refreshInFlight && now - refreshInFlightStartedAt > REFRESH_MAX_MS) {
      console.warn(
        `[listStorybooks] refresh stuck for ${now - refreshInFlightStartedAt}ms — restarting`
      );
      refreshInFlight = null;
      refreshInFlightStartedAt = 0;
    }

    const fresh = listCache && now - listCacheTime < LIST_CACHE_TTL;
    if (fresh) return listCache!;

    // Stale-while-revalidate: 캐시 있으면 즉시 리턴 + 백그라운드 리프레시
    if (listCache) {
      if (!refreshInFlight) startRefresh();
      return listCache;
    }

    // 첫 호출: 기다림
    if (!refreshInFlight) startRefresh();
    return refreshInFlight!;
  },

  async getStorybook(id: string): Promise<Storybook | null> {
    try {
      const buffer = await downloadFromR2(storybookKey(id));
      return normalizeStorybook(JSON.parse(buffer.toString('utf-8')));
    } catch {
      return null;
    }
  },

  async saveStorybook(storybook: Storybook): Promise<Storybook> {
    // styleAssets 중복 버킷 정규화 (id + prompt 두 형태로 분리되어 들어온 경우 머지)
    const normalizedStyleAssets = canonicalizeStyleAssets(storybook.styleAssets);
    const updated: Storybook = {
      ...storybook,
      styleAssets: normalizedStyleAssets,
      artStyle: canonicalizeArtStyle(storybook.artStyle ?? '') || storybook.artStyle,
      updatedAt: new Date().toISOString(),
    };
    await uploadJsonToR2(updated, storybookKey(storybook.id));
    // Update cache entry in-place
    if (listCache) {
      const idx = listCache.findIndex((s) => s.id === storybook.id);
      const summary = toSummary(updated);
      if (idx >= 0) listCache[idx] = summary;
      else listCache.unshift(summary);
    }
    return updated;
  },

  async deleteStorybook(id: string): Promise<void> {
    await deleteFromR2(storybookKey(id));
    if (listCache) {
      listCache = listCache.filter((s) => s.id !== id);
    }
  },

  async uploadImage(base64: string, key: string): Promise<string> {
    const buf = Buffer.from(base64, 'base64');
    const webp = await imageToWebp(buf);
    const webpKey = key.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    return uploadBufferToR2(webp, webpKey, 'image/webp');
  },

  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    return uploadBufferToR2(buffer, key, contentType);
  },

  async deleteImage(imageUrl: string): Promise<void> {
    const key = urlToR2Key(imageUrl);
    await deleteFromR2(key);
  },
};
