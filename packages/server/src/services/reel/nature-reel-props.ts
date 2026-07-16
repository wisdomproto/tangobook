import { firstClause, splitIntoBuckets, type ReelScene } from './reel-props.js';

// 씬별 길이(초): 훅 · 신기한 사실(핵심·길게) · 관찰 포인트.
export const NATURE_SCENE_DURS = [4, 12, 5];
const SERIES_HEADLINE = '우리 아이 첫 자연도감 100권+';

export interface NatureSeries {
  covers: string[]; // 8 테마 대표 표지(encodeURI 완료)
  labels: string[]; // 8 테마 라벨
  headline: string;
}

export interface NatureReelProps {
  bookTitle: string;
  category: string;
  scenes: ReelScene[]; // 훅 · 사실 · 관찰 (3)
  series: NatureSeries;
}

export function buildNatureReelProps({
  storybook,
  storyboard,
  captions,
  seriesCovers,
  seriesLabels,
}: {
  storybook: any;
  storyboard: any;
  captions?: string[];
  seriesCovers: string[];
  seriesLabels: string[];
}): NatureReelProps | null {
  const sbScenes = storyboard?.scenes;
  if (!Array.isArray(sbScenes) || sbScenes.length < 5) return null;

  const pages = (Array.isArray(storybook.pages) ? storybook.pages : [])
    .filter((p: any) => p?.illustrationUrl)
    .sort((a: any, b: any) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0));
  if (pages.length === 0) return null;

  const cover = encodeURI(storybook.coverImage || pages[0].illustrationUrl);
  const urlOf = (p: any) => encodeURI(p.illustrationUrl);
  const bookTitle = storybook.title || '';

  const bodyOf = (sc: any, i: number) => {
    const hand = captions?.[i]?.trim();
    if (hand) return hand;
    return sc?.subtitle?.trim() ? sc.subtitle.trim() : firstClause(sc?.narration ?? '');
  };

  const buckets = splitIntoBuckets(pages, 2);
  const factImgs = (buckets[0].length ? buckets[0] : pages).map(urlOf);
  const obsImgs = (buckets[1].length ? buckets[1] : pages).map(urlOf);

  return {
    bookTitle,
    category: storybook.category || '',
    scenes: [
      {
        label: bookTitle,
        body: bodyOf(sbScenes[0], 0),
        imageUrls: [cover],
        durSec: NATURE_SCENE_DURS[0],
      },
      {
        label: sbScenes[1]?.label ?? '신기한 사실',
        body: bodyOf(sbScenes[1], 1),
        imageUrls: factImgs,
        durSec: NATURE_SCENE_DURS[1],
      },
      {
        label: sbScenes[3]?.label ?? '관찰 포인트',
        body: bodyOf(sbScenes[3], 2),
        imageUrls: obsImgs,
        durSec: NATURE_SCENE_DURS[2],
      },
    ],
    series: { covers: seriesCovers, labels: seriesLabels, headline: SERIES_HEADLINE },
  };
}
