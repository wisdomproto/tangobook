/**
 * 카드 도감 (Collection) — Phase 1 §5.2 spec 정합 (2026-05-03 redesign).
 *
 * 카드 단위 = **단어 1개** (책 1권 X). 잭과 콩나무 12 KeyObject → 12 카드.
 * 카테고리 6개 (Phase 1 §5.2): 동물 / 음식 / 마법 사물 / 사람·캐릭터 / 자연 / 집·장소.
 * Source = 동화 KeyObject only (Cambridge / Phonics 는 어휘 탭 전용).
 * 라벨 = 한국어 (UI), ID = 영어 단어 (`word-pumpkin` 안정성).
 * 학습 상태 = `word_mastery` lang 무관 합산 (한·영 통합).
 *
 * 자세한 결정 매트릭스: memory/collection-word-redesign.md
 */

export type CollectionCategoryId =
  | 'animal' // 동물
  | 'food' // 음식
  | 'magic-object' // 마법 사물
  | 'people' // 사람·캐릭터
  | 'nature' // 자연
  | 'home'; // 집·장소

export const COLLECTION_CATEGORIES: { id: CollectionCategoryId; nameKo: string; emoji: string }[] =
  [
    { id: 'animal', nameKo: '동물', emoji: '🐅' },
    { id: 'food', nameKo: '음식', emoji: '🍎' },
    { id: 'magic-object', nameKo: '마법 사물', emoji: '✨' },
    { id: 'people', nameKo: '사람·캐릭터', emoji: '🧑' },
    { id: 'nature', nameKo: '자연', emoji: '🌿' },
    { id: 'home', nameKo: '집·장소', emoji: '🏠' },
  ];

export type CollectionStatus = 'locked' | 'silhouette' | 'owned' | 'active';

export interface CollectionItem {
  /** 영어 단어 ID — `word-{english}` (예: `word-pumpkin`). ASCII URL/한국어 동음이의어 회피. */
  id: string;
  category: CollectionCategoryId;
  /** UI 라벨 — 4-5세 친화 한국어 (예: `호박`). */
  nameKo: string;
  /** 영어 표기 (예: `Pumpkin`). 영어 도감 Phase 2/3 활용. */
  nameEn?: string;
  /** 풀컬러 (owned/active 노출). 책×그림체 multi-image 중 default 1장. */
  imageUrl: string;
  /** 흑백/실루엣 — 없으면 클라가 css filter 로 대체 */
  silhouetteUrl?: string;
  /** 이 단어를 포함하는 책들 (silhouette 트리거 + CardDetailModal 출처 회귀) */
  sourceBookIds: string[];
  /** 도감 활성 시 노출되는 한 줄 예문 (단어 사용 맥락) */
  example?: string;
  /** 도감 활성 시 풍부한 정보 bullet (호기심 자극) */
  facts?: string[];
  tags?: string[];
  rarity?: 'common' | 'rare' | 'foil';
  createdAt: string;
}

export interface CollectionCatalog {
  /** version 2 = 단어 단위 카탈로그 (v1 = 책 단위, 폐기됨 2026-05-03) */
  version: 2;
  updatedAt: string;
  items: CollectionItem[];
}

/** Supabase collection_user 테이블의 row 형태 (per-user 상태) */
export interface CollectionUserRecord {
  profile_id: string;
  item_id: string;
  status: CollectionStatus;
  silhouette_at: string | null;
  owned_at: string | null;
  active_at: string | null;
  foil: boolean;
}
