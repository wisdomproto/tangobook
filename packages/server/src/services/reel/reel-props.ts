import { stripStyleSuffix } from '@tangobook/shared';
export function firstClause(text: string, maxLen = 40): string {
  const t = (text ?? '').trim();
  if (!t) return '';
  const stop = t.search(/[.!?。,、]/);
  let s = stop > 0 ? t.slice(0, stop) : t;
  if (s.length > maxLen) {
    const cut = s.lastIndexOf(' ', maxLen);
    s = s.slice(0, cut > 0 ? cut : maxLen);
  }
  return s.trim();
}

// ⚠️ remotion `data/storybook-reel.ts`의 MORPH_LINES 와 동일하게 유지(패키지 경계로 import 회피).
export const MORPH_LINES = ['탱고북에선', '한 권의 이야기를', '아이의 취향대로 고를 수 있습니다'];

const MORPH_GENRE_ORDER = ['collage', 'watercolor', 'paper3d'] as const;
const MORPH_GENRE_LABEL: Record<string, string> = {
  collage: '콜라주',
  watercolor: '수채동화풍',
  paper3d: '페이퍼 3D 아트',
};

interface StyleAsset {
  coverImage?: string;
  pageIllustrations?: Record<string, { illustrationUrl?: string } | undefined>;
}

export function pickMorph(
  styleAssets: Record<string, StyleAsset>,
  genreMap: Record<string, string>
): { lines: string[]; styles: Array<{ url: string; label: string }> } | null {
  const genreSet = new Set<string>(MORPH_GENRE_ORDER);
  // styleId -> genre, only for mapped public genres that have illustrations
  const mapped: Array<{ sid: string; genre: string; pages: Set<number> }> = [];
  for (const sid of Object.keys(styleAssets)) {
    const genre = genreMap[sid];
    if (!genre || !genreSet.has(genre)) continue;
    const pi = styleAssets[sid]?.pageIllustrations || {};
    const pages = new Set<number>();
    for (const key of Object.keys(pi)) {
      if (pi[key]?.illustrationUrl) pages.add(Number(key));
    }
    if (pages.size > 0) mapped.push({ sid, genre, pages });
  }
  if (mapped.length < 2) return null;

  // intersect page numbers across all mapped styles
  let common: number[] | null = null;
  for (const m of mapped) {
    common = common === null ? [...m.pages] : common.filter((p) => m.pages.has(p));
  }
  if (!common || common.length === 0) return null;
  const page = Math.max(...common);

  const styles = mapped
    .slice()
    .sort(
      (a, b) =>
        MORPH_GENRE_ORDER.indexOf(a.genre as (typeof MORPH_GENRE_ORDER)[number]) -
        MORPH_GENRE_ORDER.indexOf(b.genre as (typeof MORPH_GENRE_ORDER)[number])
    )
    .map((m) => ({
      url: encodeURI(styleAssets[m.sid].pageIllustrations![String(page)]!.illustrationUrl!),
      label: MORPH_GENRE_LABEL[m.genre],
    }));

  return { lines: MORPH_LINES, styles };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function styleHasIllustrations(sa: StyleAsset): boolean {
  const pi = sa?.pageIllustrations || {};
  return Object.keys(pi).some((k) => pi[k]?.illustrationUrl);
}

/**
 * 메인 스토리 씬에 쓸 그림체를 3개 매핑 장르 중 **책ID 해시로 고정 선택**(책마다 다르게, 재렌더엔 동일).
 * 매핑된 그림체가 없으면 null(호출부가 활성 그림체로 폴백).
 */
export function pickMainStyle(
  styleAssets: Record<string, StyleAsset>,
  genreMap: Record<string, string>,
  seed: string
): string | null {
  const mapped = Object.keys(styleAssets)
    .filter(
      (sid) =>
        MORPH_GENRE_ORDER.includes(genreMap[sid] as never) &&
        styleHasIllustrations(styleAssets[sid])
    )
    .sort(
      (a, b) =>
        MORPH_GENRE_ORDER.indexOf(genreMap[a] as never) -
        MORPH_GENRE_ORDER.indexOf(genreMap[b] as never)
    );
  if (!mapped.length) return null;
  return mapped[hashStr(seed) % mapped.length];
}

export function splitIntoBuckets<T>(items: T[], n: number): T[][] {
  const out: T[][] = Array.from({ length: n }, () => []);
  const base = Math.floor(items.length / n);
  const extra = items.length % n;
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const take = base + (i < extra ? 1 : 0);
    out[i] = items.slice(idx, idx + take);
    idx += take;
  }
  return out;
}

/**
 * 그림체별 책 목록 → `{ 그림체 id: { 표지, 쪽 삽화 } }` 맵. 한 책 = 한 그림체(2026-09-14) —
 * 그림체 모핑·메인 그림체 선택은 이제 같은 그룹의 책들을 모아 이 맵으로 만든다.
 */
export function styleMapOf(books: any[]): Record<string, StyleAsset> {
  const out: Record<string, StyleAsset> = {};
  for (const b of books) {
    if (!b?.artStyle || out[b.artStyle]) continue;
    out[b.artStyle] = {
      coverImage: b.coverImage,
      pageIllustrations: Object.fromEntries(
        (b.pages ?? [])
          .filter((p: any) => p.illustrationUrl)
          .map((p: any) => [String(p.pageNumber), { illustrationUrl: p.illustrationUrl }])
      ),
    };
  }
  return out;
}

export interface ReelScene {
  label: string;
  body: string;
  imageUrls: string[];
  durSec?: number;
}

// 씬별 길이(초): 훅 · 원작(짧게) · 줄거리(충실·길게) · 교훈(짧게). 줄거리 중심 재배치.
const SCENE_DURS = [4, 5, 12, 5];

export interface ReelProps {
  bookTitle: string;
  scenes: ReelScene[];
  styleMorph: { lines: string[]; styles: Array<{ url: string; label: string }> } | null;
}

export function buildReelProps({
  storybook,
  styleBooks,
  storyboard,
  genreMap,
  captions,
}: {
  storybook: any;
  /** 같은 그룹(같은 이야기)의 그림체별 책 — 없으면 이 책 하나. 모핑은 2권 이상일 때만. */
  styleBooks?: any[];
  storyboard: any;
  genreMap: Record<string, string>;
  captions?: string[]; // 씬 0..3 자막 오버라이드(손수 작성). 있으면 subtitle/narration보다 우선.
}): ReelProps | null {
  const scenes = storyboard?.scenes;
  if (!Array.isArray(scenes) || scenes.length < 5) return null; // guard: needs 5-scene storyboard
  // 메인 삽화 그림체 = 3개 중 책ID 해시로 고정 랜덤(다양성). 매핑 없으면 활성 그림체.
  const seed = String(storybook.id ?? storyboard.storybookId ?? storybook.title ?? '');
  const styleAssets = styleMapOf(styleBooks?.length ? styleBooks : [storybook]);
  const mainId = pickMainStyle(styleAssets, genreMap, seed) ?? storybook.artStyle;
  const sa = styleAssets[mainId];
  const pi = sa?.pageIllustrations || {};
  const pages = Object.keys(pi)
    .map(Number)
    .filter((n) => pi[String(n)]?.illustrationUrl)
    .sort((a, b) => a - b);
  if (pages.length === 0) return null; // guard: needs active-style illustrations
  const cover = encodeURI(
    sa?.coverImage || storybook.coverImage || pi[String(pages[0])]!.illustrationUrl!
  );
  const urlOf = (p: number) => encodeURI(pi[String(p)]!.illustrationUrl!);

  const bookTitle = stripStyleSuffix(storybook.title || storyboard.title || '');
  const out: ReelProps = {
    bookTitle,
    scenes: [],
    styleMorph: pickMorph(styleAssets, genreMap),
  };
  // 자막 우선순위: 손수 작성한 captions[i] > 스토리보드 subtitle > 나레이션 첫 절.
  // (subtitle 은 "○○ 원작 이야기" 식 라벨이라 스토리를 못 담음 → 손수 캡션이 최우선.)
  const bodyOf = (sc: any, i: number) => {
    const hand = captions?.[i]?.trim();
    if (hand) return hand;
    return sc.subtitle?.trim() ? sc.subtitle.trim() : firstClause(sc.narration);
  };
  // 훅: 헤드라인=책 제목(내부 라벨 "훅" 아님)
  out.scenes.push({
    label: bookTitle,
    body: bodyOf(scenes[0], 0),
    imageUrls: [cover],
    durSec: SCENE_DURS[0],
  });
  const buckets = splitIntoBuckets(pages, 3);
  for (let i = 1; i <= 3; i++) {
    const bucket = buckets[i - 1].length ? buckets[i - 1] : pages; // empty-bucket fallback
    out.scenes.push({
      label: scenes[i].label,
      body: bodyOf(scenes[i], i),
      imageUrls: bucket.map(urlOf),
      durSec: SCENE_DURS[i],
    });
  }
  return out;
}
