export type HoriItemSlot = 'outfit' | 'accessory' | 'background' | 'mood' | 'season';

export const HORI_SLOTS: { id: HoriItemSlot; nameKo: string; emoji: string }[] = [
  { id: 'outfit', nameKo: '옷', emoji: '👕' },
  { id: 'accessory', nameKo: '액세서리', emoji: '🎩' },
  { id: 'background', nameKo: '배경', emoji: '🏠' },
  { id: 'mood', nameKo: '표정', emoji: '😊' },
  { id: 'season', nameKo: '시즌', emoji: '🎅' },
];

export type HoriItemRarity = 'common' | 'seasonal' | 'event';

export interface HoriItem {
  id: string; // 'outfit-tshirt-blue'
  slot: HoriItemSlot;
  nameKo: string;
  /** 호리 위에 입혔을 때 미리보기 (이미지 URL 또는 baseline 이모지) */
  preview: string; // baseline: 이모지 1글자 / 후속: 이미지 URL
  /** 인벤토리 썸네일 (없으면 preview 재사용) */
  iconUrl?: string;
  starsCost: number; // 별 사다리: 100 / 300 / 500 / 800 / 2000
  rarity: HoriItemRarity;
  unlockSeason?: string; // 'winter-2026'
  description?: string;
  createdAt: string;
}

export interface HoriCatalog {
  version: 1;
  updatedAt: string;
  items: HoriItem[];
}

/** Supabase hori_inventory row */
export interface HoriInventoryRecord {
  profile_id: string;
  item_id: string;
  acquired_at: string;
  equipped: boolean;
}
