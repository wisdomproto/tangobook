import {
  uploadBufferToR2,
  uploadJsonToR2,
  deleteFromR2,
  urlToR2Key,
  listR2Objects,
  downloadFromR2,
} from '../providers/r2.provider.js';
// 책이 바뀌면 현황판·낱말 그래프 캐시를 버린다(순환 import 를 피해 상태만 든 모듈에서 가져온다).
import { invalidateContentStatus } from '../services/content-status.cache.js';
import { imageToWebp } from '../utils/transcode.js';
import { canonicalizeArtStyle, type Storybook, type StorybookSummary } from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';

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
  // 나레이션은 **글이 있는 페이지**에만 필요 — 텍스트 없는 페이지(마지막 빈 페이지 등)는 TTS 없어도 완성으로 본다.
  // (예: 공룡 자연관찰 책들은 글 있는 18쪽 전부 나레이션인데, 텍스트 없는 19쪽 때문에 every 가 false 였음
  //  → 연속재생 선택기(koCompletion.pagesTts 필터)에서 통째로 빠지던 버그.)
  const ttsTextPages = pages.filter((p) => (p.text ?? '').trim().length > 0);
  const pagesTts = ttsTextPages.length > 0 && ttsTextPages.every((p) => !!p.ttsUrl);
  const vocabulary = (sb.key_objects?.length ?? 0) > 0;
  const koCompletion = {
    cover,
    pagesImage,
    pagesTts,
    vocabulary,
    complete: cover && pagesImage && pagesTts && vocabulary,
  };

  // 🔴 한 책 = 한 그림체(2026-09-14) — 표지·클린 표지·언어별 표지 전부 top-level 이 정본이다.
  //    (예전엔 대표 그림체가 비공개면 다른 그림체 표지로 폴백하고, styleAssets 에서 그림체별 맵을 만들었다.)
  const coverImageOut = sb.coverImage ?? sb.coverImages?.find((c) => c.imageUrl)?.imageUrl;
  const coversByLang: Record<string, string> = {};
  for (const [lang, url] of Object.entries(sb.primaryCoverByLang ?? {}))
    if (url) coversByLang[lang] = url;

  return {
    id: sb.id,
    title: sb.title,
    type: sb.type,
    targetAge: sb.targetAge,
    artStyle: sb.artStyle,
    category: sb.category,
    folder: sb.folder,
    isPublic: sb.isPublic,
    isAccessibleForFree: sb.isAccessibleForFree,
    createdAt: sb.createdAt,
    coverImage: coverImageOut,
    // 다국어 허브/카드 표기용 — 언어별 제목 (없는 책은 생략)
    titleTranslations:
      sb.titleTranslations && Object.keys(sb.titleTranslations).length > 0
        ? sb.titleTranslations
        : undefined,
    coversByLang: Object.keys(coversByLang).length > 0 ? coversByLang : undefined,
    cleanCoverImage: sb.cleanCoverImage,
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

  // keyObjectImages: name → objectName (null entry 방어)
  const keyObjImages = sb.keyObjectImages as Array<Record<string, unknown> | null> | undefined;
  if (keyObjImages) {
    sb.keyObjectImages = keyObjImages.filter((img): img is Record<string, unknown> => img != null);
    (sb.keyObjectImages as Array<Record<string, unknown>>).forEach((img) => {
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
    } catch (e) {
      console.error(`[getStorybook ${id}] failed:`, (e as Error).message);
      return null;
    }
  },

  async saveStorybook(storybook: Storybook): Promise<Storybook> {
    // 같은 title 중복 방지 — 신규 저장 또는 title 변경 시에만 체크.
    // (audiobook 생성 등 부수 update 는 title 동일 → skip)
    // storybook ↔ phonics 끼리는 충돌로 보지 않음.
    const myTitle = storybook.title?.trim();
    if (myTitle) {
      const list = await R2Repository.listStorybooks();
      const selfInList = list.find((s) => s.id === storybook.id);
      const isTitleChangeOrNew = !selfInList || selfInList.title?.trim() !== myTitle;
      if (isTitleChangeOrNew) {
        const myType = storybook.type ?? 'storybook';
        for (const sb of list) {
          if (sb.id === storybook.id) continue;
          const otherType = sb.type ?? 'storybook';
          if (otherType !== myType) continue;
          if (sb.title?.trim() === myTitle) {
            throw new AppError(409, `같은 이름의 동화책이 이미 있어요: "${myTitle}"`);
          }
        }
      }
    }

    // 🔴 한 책 = 한 그림체(2026-09-14) — 옛 그림체별 필드는 저장할 때마다 떼어 낸다
    //    (안 떼면 옛 클라이언트·스크립트가 들고 온 `styleAssets` 가 R2 에 되살아난다).
    const legacy = storybook as Storybook &
      Record<'styleAssets' | 'availableStyles' | 'defaultStyle', unknown>;
    const { styleAssets: _sa, availableStyles: _as, defaultStyle: _ds, ...rest } = legacy;
    const updated: Storybook = {
      ...(rest as Storybook),
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
    // 현황판·낱말 그래프가 다음 조회에서 다시 세게 한다 — 안 하면 고친 책이 대시보드에 안 뜬다.
    invalidateContentStatus();
    return updated;
  },

  async deleteStorybook(id: string): Promise<void> {
    await deleteFromR2(storybookKey(id));
    if (listCache) {
      listCache = listCache.filter((s) => s.id !== id);
    }
    invalidateContentStatus();
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

// 테스트 전용 export — toSummary 순수 변환 검증용.
export { toSummary as __toSummaryForTest };
