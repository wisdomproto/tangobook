import axios from 'axios';
import { sanitizeBookGroups, type BookGroupsDoc } from '@tangobook/shared';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

/**
 * 동화책 그룹 — R2 `_index/book-groups.json` 한 곳.
 * 🔴 library-config 에 안 넣은 이유: 그 저장소는 필드를 화이트리스트로 걸러 저장해서
 *    거기 끼워 넣으면 다른 화면이 설정을 저장할 때 그룹이 조용히 지워진다.
 * SEO SSR 이 about 페이지마다 읽으므로 1분 캐시(저장하면 즉시 교체).
 */
const KEY = '_index/book-groups.json';
const TTL = 60_000;
let cache: { doc: BookGroupsDoc; at: number } | null = null;

async function load(): Promise<BookGroupsDoc> {
  if (cache && Date.now() - cache.at < TTL) return cache.doc;
  try {
    // 공개 URL 은 CDN 캐시를 탈 수 있어 저장 직후 옛 값이 온다 — 쿼리로 캐시를 비켜 간다.
    const res = await axios.get(`${r2PublicUrl}/${KEY}?t=${Date.now()}`, { timeout: 5000 });
    const doc = { ...sanitizeBookGroups(res.data), updatedAt: res.data?.updatedAt };
    cache = { doc, at: Date.now() };
    return doc;
  } catch {
    return cache?.doc ?? { groups: [] };
  }
}

async function save(input: unknown): Promise<BookGroupsDoc> {
  const doc: BookGroupsDoc = { ...sanitizeBookGroups(input), updatedAt: new Date().toISOString() };
  await uploadJsonToR2(doc, KEY);
  cache = { doc, at: Date.now() };
  return doc;
}

export const BookGroupsService = { load, save };
