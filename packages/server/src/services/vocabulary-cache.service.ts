import axios from 'axios';
import { r2PublicUrl } from '../providers/r2.provider.js';
import type { VocabularyDatabase, VocabEntry } from '@tangobook/shared';

const DB_KEY = 'vocabulary-db.json';
const TTL_MS = 5 * 60_000;

interface CacheState {
  db: VocabularyDatabase;
  entryMap: Map<string, VocabEntry>;
  loadedAt: number;
}

let cache: CacheState | null = null;

async function loadFromR2(): Promise<VocabularyDatabase> {
  try {
    const url = `${r2PublicUrl}/${DB_KEY}`;
    const res = await axios.get<VocabularyDatabase>(url, { timeout: 10_000 });
    if (res.data && Array.isArray(res.data.entries)) return res.data;
  } catch {
    // 미생성 — 빈 DB 반환
  }
  return { version: 1, updatedAt: new Date().toISOString(), entries: [] };
}

/** vocabulary-db.json 의 메모리 캐시. SR 큐가 빠른 word→entry 조회용으로 사용. */
export const VocabularyCacheService = {
  async get(): Promise<VocabularyDatabase> {
    const now = Date.now();
    if (cache && now - cache.loadedAt < TTL_MS) return cache.db;
    const db = await loadFromR2();
    cache = {
      db,
      entryMap: new Map(db.entries.map((e) => [e.word, e])),
      loadedAt: now,
    };
    return db;
  },

  async getEntryMap(): Promise<Map<string, VocabEntry>> {
    if (!cache || Date.now() - cache.loadedAt >= TTL_MS) await this.get();
    return cache!.entryMap;
  },

  invalidate() {
    cache = null;
  },
};
