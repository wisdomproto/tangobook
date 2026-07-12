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

  // 대표 그림체 (defaultStyle) 가 있으면 그 styleAssets 의 coverImage 우선 — 라이브러리·검색 등 외부 노출 일관성용.
  // 단 그 그림체의 카드 언어(ko) 표지가 publicByStyleLang 으로 비공개면, 라이브러리/검색 카드엔
  // 공개된 그림체의 표지로 폴백한다 (비공개 그림체가 카드에 노출되는 것 방지).
  const cardLang = sb.languages?.[0] ?? 'ko';
  const isStyleLangPublic = (style: string) => sb.publicByStyleLang?.[style]?.[cardLang] !== false;
  let targetStyle = sb.defaultStyle ?? sb.artStyle;
  if (targetStyle && !isStyleLangPublic(targetStyle)) {
    const allStyles =
      sb.availableStyles && sb.availableStyles.length > 0
        ? sb.availableStyles
        : sb.artStyle
          ? [sb.artStyle]
          : [];
    const publicStyle = allStyles.find((s) => isStyleLangPublic(s));
    if (publicStyle) targetStyle = publicStyle;
  }

  // 그림체별 대표 표지 URL — 라이브러리 카드 배너용 (default 외 다른 그림체 썸네일).
  // 활성 그림체(`sb.artStyle`)는 top-level 필드, 그 외는 `styleAssets[s]` 에서 추출.
  const coversByStyle: Record<string, string> = {};
  const pickCover = (a: {
    coverImage?: string;
    coverImages?: { imageUrl: string }[];
  }): string | undefined => a.coverImage ?? a.coverImages?.find((c) => c.imageUrl)?.imageUrl;
  const activeCover = pickCover({ coverImage: sb.coverImage, coverImages: sb.coverImages });
  if (sb.artStyle && activeCover) coversByStyle[sb.artStyle] = activeCover;
  for (const [style, assets] of Object.entries(sb.styleAssets ?? {})) {
    if (!assets) continue;
    const url = pickCover(assets);
    if (url && !coversByStyle[style]) coversByStyle[style] = url;
  }

  const coverImageOut = coversByStyle[targetStyle ?? ''] ?? sb.coverImage;

  // 그림체별 클린 표지 URL — 다국어 오버레이 베이스 (coversByStyle 와 짝).
  const cleanCoversByStyle: Record<string, string> = {};
  if (sb.artStyle && sb.cleanCoverImage) cleanCoversByStyle[sb.artStyle] = sb.cleanCoverImage;
  for (const [style, assets] of Object.entries(sb.styleAssets ?? {})) {
    const url = assets?.cleanCoverImage;
    if (url && !cleanCoversByStyle[style]) cleanCoversByStyle[style] = url;
  }
  const cleanCoverImageOut = cleanCoversByStyle[targetStyle ?? ''] ?? sb.cleanCoverImage;

  // 그림체 × 언어 표지 맵 — 활성 그림체는 top-level primaryCoverByLang, 그 외는 styleAssets[style].
  const coverLangByStyle: Record<string, Record<string, string>> = {};
  const addLangMap = (style: string | undefined, mp?: Record<string, string>) => {
    if (!style || !mp) return;
    for (const [lang, url] of Object.entries(mp)) {
      if (url && !coverLangByStyle[style]?.[lang]) (coverLangByStyle[style] ??= {})[lang] = url;
    }
  };
  addLangMap(sb.artStyle, sb.primaryCoverByLang);
  for (const [style, assets] of Object.entries(sb.styleAssets ?? {})) {
    addLangMap(style, assets?.primaryCoverByLang);
  }

  // defaultStyle 기준 언어별 대표 표지 — 라이브러리 마스터 언어 토글용
  const coversByLang: Record<string, string> = {};
  const targetStyleAssets = sb.styleAssets?.[targetStyle ?? ''];
  for (const [lang, url] of Object.entries(targetStyleAssets?.primaryCoverByLang ?? {})) {
    if (url) coversByLang[lang] = url;
  }
  if (targetStyle === sb.artStyle) {
    for (const [lang, url] of Object.entries(sb.primaryCoverByLang ?? {})) {
      if (url && !coversByLang[lang]) coversByLang[lang] = url;
    }
  }

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
    coversByStyle: Object.keys(coversByStyle).length > 0 ? coversByStyle : undefined,
    coversByLang: Object.keys(coversByLang).length > 0 ? coversByLang : undefined,
    cleanCoverImage: cleanCoverImageOut,
    cleanCoversByStyle: Object.keys(cleanCoversByStyle).length > 0 ? cleanCoversByStyle : undefined,
    coverLangByStyle: Object.keys(coverLangByStyle).length > 0 ? coverLangByStyle : undefined,
    availableStyles: sb.availableStyles,
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
    // (audiobook 생성 / styleAssets 정리 등 부수 update 는 title 동일 → skip)
    // variant `__L\d+$` 끼리 (같은 base) 또는 storybook ↔ phonics 끼리는 충돌로 보지 않음.
    const myTitle = storybook.title?.trim();
    if (myTitle) {
      const list = await R2Repository.listStorybooks();
      const selfInList = list.find((s) => s.id === storybook.id);
      const isTitleChangeOrNew = !selfInList || selfInList.title?.trim() !== myTitle;
      if (isTitleChangeOrNew) {
        const myType = storybook.type ?? 'storybook';
        const myBaseId = storybook.id.replace(/__L\d+$/, '');
        for (const sb of list) {
          if (sb.id === storybook.id) continue;
          const otherType = sb.type ?? 'storybook';
          if (otherType !== myType) continue;
          const otherBaseId = sb.id.replace(/__L\d+$/, '');
          if (otherBaseId === myBaseId) continue;
          if (sb.title?.trim() === myTitle) {
            throw new AppError(409, `같은 이름의 동화책이 이미 있어요: "${myTitle}"`);
          }
        }
      }
    }

    // 그림체 자료 정규화: prompt-form 키가 들어와도 canonical id 로 머지 + dedupe
    const normalizedStyleAssets = canonicalizeStyleAssets(storybook.styleAssets);
    const normalizedAvailable = storybook.availableStyles
      ? Array.from(new Set(storybook.availableStyles.map((s) => canonicalizeArtStyle(s) || s)))
      : storybook.availableStyles;
    const updated: Storybook = {
      ...storybook,
      styleAssets: normalizedStyleAssets,
      artStyle: canonicalizeArtStyle(storybook.artStyle ?? '') || storybook.artStyle,
      availableStyles: normalizedAvailable,
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

// 테스트 전용 export — toSummary 순수 변환 검증용.
export { toSummary as __toSummaryForTest };
