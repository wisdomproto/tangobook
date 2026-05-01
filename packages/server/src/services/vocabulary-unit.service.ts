import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import {
  CAMBRIDGE_STARTERS_TOPICS,
  type VocabularyUnit,
  type VocabularyUnitCatalog,
  type VocabularyUnitSummary,
  type VocabularyUnitWord,
} from '@tangobook/shared';

const CATALOG_KEY = 'vocabulary-units-catalog.json';

let memoryCache: { catalog: VocabularyUnitCatalog; loadedAt: number } | null = null;
const TTL_MS = 5 * 60_000;

async function fetchFromR2(): Promise<VocabularyUnitCatalog> {
  try {
    const url = `${r2PublicUrl}/${CATALOG_KEY}`;
    const res = await axios.get<VocabularyUnitCatalog>(url, { timeout: 10_000 });
    if (res.data && Array.isArray(res.data.units)) return res.data;
  } catch {
    // 미생성
  }
  return { version: 1, updatedAt: new Date().toISOString(), units: [] };
}

function toSummary(u: VocabularyUnit): VocabularyUnitSummary {
  return {
    id: u.id,
    source: u.source,
    nameKo: u.nameKo,
    nameEn: u.nameEn,
    emoji: u.emoji,
    language: u.language,
    wordCount: u.words.length,
    isPublic: u.isPublic,
    folder: u.folder,
    updatedAt: u.updatedAt,
  };
}

export const VocabularyUnitService = {
  async getCatalog(): Promise<VocabularyUnitCatalog> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.loadedAt < TTL_MS) return memoryCache.catalog;
    const catalog = await fetchFromR2();
    memoryCache = { catalog, loadedAt: now };
    return catalog;
  },

  async list(): Promise<VocabularyUnitSummary[]> {
    const catalog = await this.getCatalog();
    return catalog.units.map(toSummary);
  },

  async getById(id: string): Promise<VocabularyUnit | null> {
    const catalog = await this.getCatalog();
    return catalog.units.find((u) => u.id === id) ?? null;
  },

  async upsert(unit: VocabularyUnit): Promise<void> {
    const catalog = await this.getCatalog();
    const idx = catalog.units.findIndex((u) => u.id === unit.id);
    unit.updatedAt = new Date().toISOString();
    if (idx >= 0) catalog.units[idx] = unit;
    else catalog.units.push(unit);
    await this.saveCatalog(catalog);
  },

  async delete(id: string): Promise<boolean> {
    const catalog = await this.getCatalog();
    const before = catalog.units.length;
    catalog.units = catalog.units.filter((u) => u.id !== id);
    if (catalog.units.length === before) return false;
    await this.saveCatalog(catalog);
    return true;
  },

  async saveCatalog(catalog: VocabularyUnitCatalog): Promise<void> {
    catalog.updatedAt = new Date().toISOString();
    await uploadJsonToR2(catalog, CATALOG_KEY);
    memoryCache = { catalog, loadedAt: Date.now() };
  },

  invalidate() {
    memoryCache = null;
  },

  /** Cambridge Starters 17 토픽 → 17 단원으로 자동 seed (멱등) */
  async seedCambridgeStarters(): Promise<{ added: number; updated: number }> {
    const catalog = await this.getCatalog();
    const map = new Map(catalog.units.map((u) => [u.id, u]));
    let added = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const topic of CAMBRIDGE_STARTERS_TOPICS) {
      const id = `unit-cambridge-${topic.id}`;
      const words: VocabularyUnitWord[] = topic.words.map((w) => ({ word: w.toLowerCase() }));
      const unit: VocabularyUnit = {
        id,
        source: 'cambridge-starters',
        topicId: topic.id,
        nameKo: topic.nameKo,
        nameEn: topic.nameEn,
        emoji: topic.emoji,
        words,
        language: 'en',
        level: 1,
        isPublic: true,
        folder: 'Cambridge Pre-A1 Starters',
        createdAt: now,
        updatedAt: now,
      };
      const existing = map.get(id);
      if (existing) {
        // 보강: 기존 단어의 imageUrl/ttsUrl/exampleSentences 보존, 마스터 단어 풀 동기화
        const existingByWord = new Map(existing.words.map((w) => [w.word, w]));
        unit.words = words.map((w) => existingByWord.get(w.word) ?? w);
        unit.createdAt = existing.createdAt;
        map.set(id, unit);
        updated++;
      } else {
        map.set(id, unit);
        added++;
      }
    }

    catalog.units = Array.from(map.values());
    await this.saveCatalog(catalog);
    return { added, updated };
  },
};
