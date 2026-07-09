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
        MORPH_GENRE_ORDER.indexOf(a.genre as any) - MORPH_GENRE_ORDER.indexOf(b.genre as any)
    )
    .map((m) => ({
      url: encodeURI(styleAssets[m.sid].pageIllustrations![String(page)]!.illustrationUrl!),
      label: MORPH_GENRE_LABEL[m.genre],
    }));

  return { lines: MORPH_LINES, styles };
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

export interface ReelScene {
  label: string;
  body: string;
  imageUrls: string[];
}

export interface ReelProps {
  bookTitle: string;
  scenes: ReelScene[];
  styleMorph: { lines: string[]; styles: Array<{ url: string; label: string }> } | null;
}

export function buildReelProps({
  storybook,
  storyboard,
  genreMap,
}: {
  storybook: any;
  storyboard: any;
  genreMap: Record<string, string>;
}): ReelProps | null {
  const scenes = storyboard?.scenes;
  if (!Array.isArray(scenes) || scenes.length < 5) return null; // guard: needs 5-scene storyboard
  const activeId = storybook.artStyle;
  const sa = storybook.styleAssets?.[activeId];
  const pi = sa?.pageIllustrations || {};
  const pages = Object.keys(pi)
    .map(Number)
    .filter((n) => pi[String(n)]?.illustrationUrl)
    .sort((a, b) => a - b);
  if (pages.length === 0) return null; // guard: needs active-style illustrations
  const cover = encodeURI(
    sa.coverImage || storybook.coverImage || pi[String(pages[0])].illustrationUrl
  );
  const urlOf = (p: number) => encodeURI(pi[String(p)].illustrationUrl);

  const bookTitle = storybook.title || storyboard.title || '';
  const out: ReelProps = {
    bookTitle,
    scenes: [],
    styleMorph: pickMorph(storybook.styleAssets || {}, genreMap),
  };
  // 훅: 헤드라인=책 제목(내부 라벨 "훅" 아님)
  out.scenes.push({
    label: bookTitle,
    body: firstClause(scenes[0].narration || scenes[0].subtitle),
    imageUrls: [cover],
  });
  const buckets = splitIntoBuckets(pages, 3);
  for (let i = 1; i <= 3; i++) {
    const bucket = buckets[i - 1].length ? buckets[i - 1] : pages; // empty-bucket fallback
    out.scenes.push({
      label: scenes[i].label,
      body: firstClause(scenes[i].narration || scenes[i].subtitle),
      imageUrls: bucket.map(urlOf),
    });
  }
  return out;
}
