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

// ───────── 자연관찰 릴스 ─────────

/** 자연관찰 책 id (파닉스·명작 제외). */
export function resolveNatureBookIds(): string[] {
  const file = path.join(SCRIPTS_DATA, 'books-by-category.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    books: Array<{ id: string; category?: string }>;
  };
  return json.books
    .filter((b) => /공룡|동물|식물|곤충|바다|하늘|우주|우리 몸/.test(b.category ?? ''))
    .filter((b) => !/파닉스|명작|세계|backup/.test(b.category ?? ''))
    .map((b) => b.id);
}

let _natureCaptions: Record<string, string[]> | null = null;
/** 손수 작성 자연관찰 릴스 자막 [훅, 사실, 관찰]. 파일/책 없으면 undefined. */
export function loadNatureReelCaptions(id: string): string[] | undefined {
  if (!_natureCaptions) {
    const file = path.join(SCRIPTS_DATA, 'marketing', 'reel-captions-nature.json');
    _natureCaptions = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  }
  return _natureCaptions![id];
}

let _cleanCovers: Record<string, string> | null = null;
/** 텍스트 제거한 클린 표지 URL (generate-clean-covers.ts 산출). 썸네일 히어로용. 없으면 undefined. */
export function loadCleanCover(id: string): string | undefined {
  if (!_cleanCovers) {
    const file = path.join(SCRIPTS_DATA, 'marketing', 'clean-covers.json');
    _cleanCovers = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  }
  return _cleanCovers![id];
}

/** 도감 시리즈 씬용 8테마 대표 책(카테고리→대표 bookId+라벨). */
export const NATURE_SERIES_COVERS: Array<{ label: string; bookId: string }> = [
  { label: '공룡', bookId: '1773714531390' },
  { label: '육지동물', bookId: '1777438039433' },
  { label: '식물', bookId: '1773365203383' },
  { label: '곤충', bookId: '1777603478247' },
  { label: '바다동물', bookId: '1777610290605' },
  { label: '하늘동물', bookId: '1777596431093' },
  { label: '우주와 자연', bookId: '1773615989178' },
  { label: '우리 몸', bookId: '1773710246892' },
];

let _seriesResolved: { covers: string[]; labels: string[] } | null = null;
/** 8 대표 표지 URL(encodeURI) + 라벨. R2 coverImage fetch, 모듈 캐시. */
export async function resolveSeriesCovers(): Promise<{ covers: string[]; labels: string[] }> {
  if (_seriesResolved) return _seriesResolved;
  const covers: string[] = [];
  const labels: string[] = [];
  for (const { label, bookId } of NATURE_SERIES_COVERS) {
    const sb = await fetchStorybook(bookId);
    covers.push(encodeURI(sb.coverImage || sb.pages?.[0]?.illustrationUrl || ''));
    labels.push(label);
  }
  _seriesResolved = { covers, labels };
  return _seriesResolved;
}
