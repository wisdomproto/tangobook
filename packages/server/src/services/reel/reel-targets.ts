import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../../config/index.js';

// src/services/reel → ../../../scripts = packages/server/scripts
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DATA = path.resolve(__dirname, '../../../scripts/_data');

/** 세계명작 동화책 id 51개 (books-by-category.json, category=명작|세계). */
export function resolveClassicBookIds(): string[] {
  const file = path.join(SCRIPTS_DATA, 'books-by-category.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    books: Array<{ id: string; category?: string }>;
  };
  return json.books.filter((b) => /명작|세계/.test(b.category ?? '')).map((b) => b.id);
}

/** R2 공개 URL 에서 동화책 JSON fetch. */
export async function fetchStorybook(id: string): Promise<any> {
  const url = encodeURI(`${config.r2.publicUrl}/storybook-${id}.json`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`storybook fetch 실패(${id}): HTTP ${res.status}`);
  return res.json();
}

/** 로컬 스토리보드 산출물 (_data/marketing/storyboards/<id>.json). 없으면 null. */
export function loadStoryboard(id: string): any | null {
  const file = path.join(SCRIPTS_DATA, 'marketing', 'storyboards', `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let _captions: Record<string, string[]> | null = null;

/**
 * 손수 작성한 릴스 자막 (_data/marketing/reel-captions.json = `{ bookId: [4 문자열] }`).
 * 씬 0..3(훅·원작·줄거리·교훈) 자막. 파일/책 없으면 undefined → buildReelProps 가 subtitle 폴백.
 */
export function loadReelCaptions(id: string): string[] | undefined {
  if (!_captions) {
    const file = path.join(SCRIPTS_DATA, 'marketing', 'reel-captions.json');
    _captions = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  }
  return _captions![id];
}

let _genreMap: Record<string, string> | null = null;

/** styleId → genre 매핑 (R2 _index/style-genre-map.json). 모듈 캐시. */
export async function loadGenreMap(): Promise<Record<string, string>> {
  if (_genreMap) return _genreMap;
  const url = encodeURI(`${config.r2.publicUrl}/_index/style-genre-map.json`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`style-genre-map fetch 실패: HTTP ${res.status}`);
  _genreMap = (await res.json()) as Record<string, string>;
  return _genreMap;
}
