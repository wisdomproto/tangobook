import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import type { CollectionCatalog, CollectionItem } from '@tangobook/shared';

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
  return { version: 1, updatedAt: new Date().toISOString(), items: [] };
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
   * storybookId → 매칭 카드 ID 배열 역인덱스 (page_read 이벤트 metadata 채우기용)
   * 클라이언트가 page_read emit 시 호출 (서버에서 미리 계산해 캐시).
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
};
