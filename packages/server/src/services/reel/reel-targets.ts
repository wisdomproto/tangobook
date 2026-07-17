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

/** 호리네 생활동화 **전 45편** id(회차 순) — 시리즈 씬이 전권을 스크롤로 보여준다.
 *  🔴 대표 8편만 보여주다 45편 전체로 바꿨다(사용자: "45편에 8개만 보여주자나") — "45편"이라고
 *  써 놓고 8칸만 뜨면 숫자가 안 믿긴다. 표지가 주르륵 흘러가는 게 규모를 그대로 증명한다.
 *  🔴 books-by-category.json 은 생활동화가 없는 stale 스냅샷이라 id 를 여기 명시한다. */
export const SAENGHWAL_SERIES_IDS: string[] = [
  '1782815785821', // 01 골고루 먹기
  '1782823691551', // 02 양치
  '1782823692128', // 03 목욕
  '1782823692664', // 04 배변
  '1783608740296', // 05 꼭꼭 씹기
  '1782829948291', // 06 간식
  '1782829947573', // 07 손씻기
  '1782824085578', // 08 잘 자기
  '1782829948883', // 09 기상
  '1782824599699', // 10 정리정돈
  '1782829949425', // 11 옷 입기
  '1783608743331', // 12 외출 준비
  '1783608743641', // 13 앉아서 밥
  '1783990046124', // 14 함께 식사
  '1782823458444', // 15 병원
  '1782831060510', // 16 교통안전
  '1783990076840', // 17 카시트
  '1782824600368', // 18 미아 방지
  '1782831061108', // 19 이물질
  '1783990105997', // 20 지진
  '1783990181590', // 21 보행 안전
  '1782831061679', // 22 내 몸 지키기
  '1782824086419', // 23 자존감
  '1782831062275', // 24 어둠
  '1782824600992', // 25 감정 조절
  '1782863608939', // 26 도전
  '1782863609726', // 27 울음
  '1783990215278', // 28 끈기
  '1783990244878', // 29 이완
  '1783949746731', // 30 상상 놀이
  '1782824086992', // 31 사과
  '1782824601583', // 32 차례
  '1782863375493', // 33 나눔
  '1782863376079', // 34 고운 말
  '1782863376598', // 35 말로 하기
  '1782863377127', // 36 친구 사귀기
  '1783990276056', // 37 협동
  '1783990306507', // 38 목소리 크기
  '1782824087555', // 39 형아 노릇
  '1782863610441', // 40 조심조심
  '1782863611068', // 41 낯가림
  '1782863858779', // 42 가족 사랑
  '1782863859519', // 43 반려동물
  '1782863860824', // 44 공공 예절
  '1783990336946', // 45 자연 사랑
];

const _seriesCache = new Map<string, { covers: string[]; labels?: string[] }>();
/** 시리즈 씬 표지 URL(encodeURI) + 라벨. R2 coverImage fetch, 종류별 모듈 캐시.
 *  - kind='nature'(기본) = 자연도감 8테마 **+ 라벨**(테마 이름이 곧 정보) → 8칸 그리드.
 *  - kind='life' = 호리네 생활동화 45편, **라벨 없음** → 스크롤 그리드. 45개에 라벨을 달면
 *    글자 벽이 되고, 표지에 이미 제목이 박혀 있어 중복이다. */
export async function resolveSeriesCovers(
  kind: 'nature' | 'life' = 'nature'
): Promise<{ covers: string[]; labels?: string[] }> {
  const cached = _seriesCache.get(kind);
  if (cached) return cached;
  const coverOf = async (bookId: string) => {
    const sb = await fetchStorybook(bookId);
    return encodeURI(sb.coverImage || sb.pages?.[0]?.illustrationUrl || '');
  };
  let resolved: { covers: string[]; labels?: string[] };
  if (kind === 'life') {
    resolved = { covers: await Promise.all(SAENGHWAL_SERIES_IDS.map(coverOf)) };
  } else {
    const covers: string[] = [];
    for (const { bookId } of NATURE_SERIES_COVERS) covers.push(await coverOf(bookId));
    resolved = { covers, labels: NATURE_SERIES_COVERS.map((c) => c.label) };
  }
  _seriesCache.set(kind, resolved);
  return resolved;
}
