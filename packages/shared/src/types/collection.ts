export type CollectionCategoryId =
  | 'classic' // 명작
  | 'folktale' // 전래
  | 'animal' // 동물
  | 'dinosaur' // 공룡
  | 'plant' // 식물
  | 'ocean' // 바다
  | 'space' // 우주
  | 'life'; // 생활

export const COLLECTION_CATEGORIES: { id: CollectionCategoryId; nameKo: string; emoji: string }[] =
  [
    { id: 'classic', nameKo: '명작', emoji: '📖' },
    { id: 'folktale', nameKo: '전래', emoji: '🇰🇷' },
    { id: 'animal', nameKo: '동물', emoji: '🐅' },
    { id: 'dinosaur', nameKo: '공룡', emoji: '🦖' },
    { id: 'plant', nameKo: '식물', emoji: '🌸' },
    { id: 'ocean', nameKo: '바다', emoji: '🌊' },
    { id: 'space', nameKo: '우주', emoji: '🌌' },
    { id: 'life', nameKo: '생활', emoji: '🏠' },
  ];

export type CollectionStatus = 'locked' | 'silhouette' | 'owned' | 'active';

export interface CollectionItem {
  id: string; // 'card-classic-jack-beanstalk'
  category: CollectionCategoryId;
  nameKo: string;
  nameEn?: string;
  imageUrl: string; // 풀컬러 (owned 이후 노출)
  silhouetteUrl?: string; // 흑백/실루엣 — 없으면 클라가 css filter로 대체
  sourceBookIds: string[]; // 활성 조건: 이 책들 중 1개 완독
  keyWord?: string; // 도감 활성 시 매칭할 어휘 (Phase 5 SR 큐 연동)
  description?: string; // 카드 뒷면 한줄 설명
  facts?: string[]; // 도감 활성 시 노출 — 풍부한 정보 bullet
  tags?: string[];
  rarity?: 'common' | 'rare' | 'foil';
  createdAt: string;
}

export interface CollectionCatalog {
  version: 1;
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
