import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import type { CollectionCatalog, CollectionItem, KeyObject, Storybook } from '@tangobook/shared';

const CATALOG_KEY = 'collection-catalog.json';

let memoryCache: { catalog: CollectionCatalog; loadedAt: number } | null = null;
const TTL_MS = 5 * 60_000;

async function fetchFromR2(): Promise<CollectionCatalog> {
  try {
    const url = `${r2PublicUrl}/${CATALOG_KEY}`;
    const res = await axios.get<CollectionCatalog>(url, { timeout: 10_000 });
    if (res.data && Array.isArray(res.data.items)) return res.data;
  } catch {
    // 카탈로그 미생성 — 빈 카탈로그 반환
  }
  return { version: 2, updatedAt: new Date().toISOString(), items: [] };
}

const HAS_KOREAN = /[ㄱ-㆏가-힯]/;

/** 단어 카드 ID 생성 — 영어 우선 (ASCII URL), 한글이면 ko 접두 */
function buildCardId(name?: string, korean?: string): string | null {
  const n = (name ?? '').trim();
  if (n && !HAS_KOREAN.test(n)) {
    const slug = n
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    if (slug) return `word-${slug}`;
  }
  const ko = (korean ?? n ?? '').trim();
  if (ko) return `word-ko-${ko.replace(/\s+/g, '-')}`;
  return null;
}

function pickKoreanLabel(ko?: string, name?: string): string | null {
  const k = (ko ?? '').trim();
  if (k) return k;
  if (name && HAS_KOREAN.test(name)) return name;
  return null;
}

function pickEnglishLabel(nameEn?: string, name?: string): string | null {
  const e = (nameEn ?? '').trim();
  if (e) return e;
  if (name && !HAS_KOREAN.test(name)) return name;
  return null;
}

/**
 * 단어 카드 imageUrl 결정 — styleAssets[].keyObjectImages 의 단어별 이미지만.
 *
 * 1. styleAssets[defaultStyle/artStyle].keyObjectImages 의 단어별 이미지 (Cow.webp 등)
 * 2. 다른 그림체의 keyObjectImages 매칭
 * 3. 위 둘 다 없으면 null — 도감 카드 자체 안 만듦 (vocabulary-unification 마이그
 *    잔재 / 큐레이션 안 한 단어 자동 제외).
 *
 * page illustration / cover fallback 은 의도적으로 제거. 단어 카드인데 책 표지/페이지
 * 그림이 깔리면 카드 정체성 흐림.
 */
function pickKeyObjectImage(book: Storybook, ko: KeyObject): string | null {
  const targetStyle = book.defaultStyle ?? book.artStyle;

  // 1) targetStyle 의 keyObjectImages
  if (targetStyle) {
    const url = book.styleAssets?.[targetStyle]?.keyObjectImages?.find(
      (img) => img.objectName === ko.name
    )?.imageUrl;
    if (url) return url;
  }

  // 2) 다른 그림체에서 매칭
  for (const styleKey of Object.keys(book.styleAssets ?? {})) {
    if (styleKey === targetStyle) continue;
    const url = book.styleAssets?.[styleKey]?.keyObjectImages?.find(
      (img) => img.objectName === ko.name
    )?.imageUrl;
    if (url) return url;
  }

  return null;
}

/**
 * 현재 imageUrl 이 keyObject 단어 이미지가 아니라 cover/page 인지 휴리스틱으로 판단.
 * incremental sync 시 더 좋은 이미지(=keyObj) 가 들어오면 교체하기 위함.
 *
 * 휴리스틱: URL 에 "/keyobj-" 또는 "key-objects/" 패턴이 없으면 다른 source 로 간주.
 */
function isLikelyKeyObjectImage(url: string | undefined): boolean {
  if (!url) return false;
  // R2 url pattern: `{bid}-{title}-keyobj-{name}-{ts}.webp` (대시) 또는
  // `books/{bid}/styles/{style}/key-objects/{id}` (v2 prefix). 둘 다 매칭.
  return /(?:^|[-/])keyobj-/.test(url) || url.includes('key-objects/');
}

/**
 * KeyObject → CollectionItem draft.
 * - dexCategory 없으면 null (분류 안 됨 — 동사 등)
 * - keyObjectImages 매칭 image 없으면 null (큐레이션 안 한 단어 — vocabulary-unification
 *   마이그 잔재 자동 제외). 사용자가 Editor 에서 image 만들면 saveStorybook hook 으로
 *   자동 sync.
 */
function buildCardDraft(book: Storybook, ko: KeyObject): CollectionItem | null {
  if (!ko.dexCategory) return null;
  const cardId = buildCardId(ko.name, ko.korean);
  if (!cardId) return null;
  const imageUrl = pickKeyObjectImage(book, ko);
  if (!imageUrl) return null;
  const nameKo = pickKoreanLabel(ko.korean, ko.name);
  const nameEn = pickEnglishLabel(ko.nameEn, ko.name);
  return {
    id: cardId,
    category: ko.dexCategory,
    nameKo: nameKo ?? cardId.replace(/^word-(ko-)?/, ''),
    nameEn: nameEn ?? undefined,
    imageUrl,
    sourceBookIds: [book.id],
    example: ko.example ?? undefined,
    rarity: 'common',
    createdAt: new Date().toISOString(),
  };
}

export const CollectionService = {
  async getCatalog(): Promise<CollectionCatalog> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.loadedAt < TTL_MS) return memoryCache.catalog;
    const catalog = await fetchFromR2();
    memoryCache = { catalog, loadedAt: now };
    return catalog;
  },

  async saveCatalog(catalog: CollectionCatalog): Promise<void> {
    catalog.updatedAt = new Date().toISOString();
    await uploadJsonToR2(catalog, CATALOG_KEY);
    memoryCache = { catalog, loadedAt: Date.now() };
  },

  invalidate() {
    memoryCache = null;
  },

  /**
   * storybookId → 매칭 카드 ID 배열 역인덱스 (page_read 이벤트 metadata 채우기용).
   * 단어 단위 카탈로그 (Phase C, 2026-05-03): sourceBookIds unwind 방식.
   */
  async buildStorybookCardIndex(): Promise<Record<string, string[]>> {
    const catalog = await this.getCatalog();
    const index: Record<string, string[]> = {};
    for (const item of catalog.items) {
      for (const bid of item.sourceBookIds) {
        if (!index[bid]) index[bid] = [];
        index[bid].push(item.id);
      }
    }
    return index;
  },

  async upsertItems(items: CollectionItem[]): Promise<{ added: number; updated: number }> {
    const catalog = await this.getCatalog();
    const map = new Map(catalog.items.map((i) => [i.id, i]));
    let added = 0;
    let updated = 0;
    for (const item of items) {
      if (map.has(item.id)) {
        map.set(item.id, item);
        updated++;
      } else {
        map.set(item.id, item);
        added++;
      }
    }
    catalog.items = Array.from(map.values());
    await this.saveCatalog(catalog);
    return { added, updated };
  },

  /**
   * 책 편집/저장 시 카탈로그 incremental sync.
   * - 책의 dexCategory 있는 KeyObject → 카드 upsert (sourceBookIds 에 book.id 추가)
   * - 카탈로그에 있던 카드 중 이 책에서 더 이상 등장 안 하는 단어 → sourceBookIds 에서 book.id 제거
   * - 빈 sourceBookIds 카드는 보존 (사용자 학습 데이터 유지).
   */
  async syncFromStorybook(book: Storybook): Promise<{
    cardsAdded: number;
    cardsUpdated: number;
    cardsRemovedFromBook: number;
  }> {
    if (!book.id) return { cardsAdded: 0, cardsUpdated: 0, cardsRemovedFromBook: 0 };
    // 파닉스/레벨 variant 책은 도감 대상 X
    if (
      book.type === 'phonics' ||
      (book as Storybook & { phonicsLanguage?: string }).phonicsLanguage
    )
      return { cardsAdded: 0, cardsUpdated: 0, cardsRemovedFromBook: 0 };
    if (typeof book.id === 'string' && /__L\d/.test(book.id))
      return { cardsAdded: 0, cardsUpdated: 0, cardsRemovedFromBook: 0 };
    // 공개 안 된 책 (isPublic !== true) — 미정의/false 모두 제외.
    // 비공개 sibling/복사본/검수중 책의 단어가 카탈로그에 섞이는 문제 방지.
    // 이전에 sync 됐던 카드 sourceBookIds 에서 이 책 제거하여 stale entry 정리.
    if (book.isPublic !== true) {
      const result = await this.removeSourcesByStorybookId(book.id);
      return {
        cardsAdded: 0,
        cardsUpdated: 0,
        cardsRemovedFromBook: result.cardsAffected,
      };
    }

    const catalog = await this.getCatalog();
    const cardMap = new Map(catalog.items.map((c) => [c.id, c]));

    // 1) 이 책의 현재 단어 → cardId 별 draft (dedupe — 같은 책 같은 단어 1번)
    const newDrafts = new Map<string, CollectionItem>();
    const kos = Array.isArray(book.key_objects) ? book.key_objects : [];
    for (const ko of kos) {
      const draft = buildCardDraft(book, ko);
      if (!draft) continue;
      if (!newDrafts.has(draft.id)) newDrafts.set(draft.id, draft);
    }

    // 2) 카탈로그에서 이 책 ID 가 들어있던 카드들 (이전 sync 결과)
    const previousCardIdsFromBook = new Set<string>();
    for (const card of cardMap.values()) {
      if (card.sourceBookIds.includes(book.id)) previousCardIdsFromBook.add(card.id);
    }

    let cardsAdded = 0;
    let cardsUpdated = 0;
    let cardsRemovedFromBook = 0;

    // 3) 책에서 사라진 단어 → sourceBookIds 에서 책 제거
    for (const cardId of previousCardIdsFromBook) {
      if (newDrafts.has(cardId)) continue;
      const card = cardMap.get(cardId);
      if (!card) continue;
      card.sourceBookIds = card.sourceBookIds.filter((id) => id !== book.id);
      cardsRemovedFromBook++;
    }

    // 4) 책에 있는 단어 → 카드 추가/갱신
    for (const [cardId, draft] of newDrafts) {
      const existing = cardMap.get(cardId);
      if (existing) {
        if (!existing.sourceBookIds.includes(book.id)) existing.sourceBookIds.push(book.id);
        // imageUrl 업그레이드 — 기존이 cover/page 인데 draft 가 keyObject 이미지면 교체
        if (draft.imageUrl) {
          const existingIsKeyObj = isLikelyKeyObjectImage(existing.imageUrl);
          const draftIsKeyObj = isLikelyKeyObjectImage(draft.imageUrl);
          if (!existing.imageUrl || (!existingIsKeyObj && draftIsKeyObj)) {
            existing.imageUrl = draft.imageUrl;
          }
        }
        if (!existing.example && draft.example) existing.example = draft.example;
        // category 충돌 시 첫 등장 우선 (사용자가 editor 에서 수정 가능)
        cardsUpdated++;
      } else {
        cardMap.set(cardId, draft);
        cardsAdded++;
      }
    }

    catalog.items = Array.from(cardMap.values());
    await this.saveCatalog(catalog);
    return { cardsAdded, cardsUpdated, cardsRemovedFromBook };
  },

  /**
   * 책 삭제 시 모든 카드의 sourceBookIds 에서 bookId 제거.
   * 빈 sourceBookIds 가 된 카드는 보존 (사용자 학습 데이터 유지).
   */
  async removeSourcesByStorybookId(bookId: string): Promise<{ cardsAffected: number }> {
    const catalog = await this.getCatalog();
    let cardsAffected = 0;
    for (const card of catalog.items) {
      if (card.sourceBookIds.includes(bookId)) {
        card.sourceBookIds = card.sourceBookIds.filter((id) => id !== bookId);
        cardsAffected++;
      }
    }
    if (cardsAffected > 0) await this.saveCatalog(catalog);
    return { cardsAffected };
  },
};
