import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import type { HoriCatalog, HoriItem } from '@tangobook/shared';

const CATALOG_KEY = 'hori-catalog.json';

let memoryCache: { catalog: HoriCatalog; loadedAt: number } | null = null;
const TTL_MS = 5 * 60_000;

async function fetchFromR2(): Promise<HoriCatalog> {
  try {
    const url = `${r2PublicUrl}/${CATALOG_KEY}`;
    const res = await axios.get<HoriCatalog>(url, { timeout: 10_000 });
    if (res.data && Array.isArray(res.data.items)) return res.data;
  } catch {
    // 카탈로그 미생성
  }
  return { version: 1, updatedAt: new Date().toISOString(), items: [] };
}

export const HoriService = {
  async getCatalog(): Promise<HoriCatalog> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.loadedAt < TTL_MS) return memoryCache.catalog;
    const catalog = await fetchFromR2();
    memoryCache = { catalog, loadedAt: now };
    return catalog;
  },

  async saveCatalog(catalog: HoriCatalog): Promise<void> {
    catalog.updatedAt = new Date().toISOString();
    await uploadJsonToR2(catalog, CATALOG_KEY);
    memoryCache = { catalog, loadedAt: Date.now() };
  },

  invalidate() {
    memoryCache = null;
  },

  async upsertItems(items: HoriItem[]): Promise<{ added: number; updated: number }> {
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
