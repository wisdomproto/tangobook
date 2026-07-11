import { describe, it, expect } from 'vitest';
import { buildNatureReelProps, NATURE_SCENE_DURS } from '../nature-reel-props';

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const makeStorybook = (pages = range(1, 15)) => ({
  title: '기가노토사우루스',
  category: '공룡 친구들',
  coverImage: 'https://r2/기가/cover.webp',
  pages: pages.map((n) => ({
    pageNumber: n,
    text: `${n}쪽 본문`,
    illustrationUrl: `https://r2/기가/page-${n}.webp`,
    ttsUrl: `https://r2/기가/tts-${n}.mp3`,
  })),
});

const makeStoryboard = (n = 5) => ({
  scenes: ['훅', '신기한 사실', '탱고북 내용', '관찰 포인트', 'CTA']
    .slice(0, n)
    .map((label) => ({ label, subtitle: `${label} 자막`, narration: `${label} 나레이션.` })),
});

const SERIES_COVERS = range(1, 8).map((i) => `https://r2/series/cover-${i}.webp`);
const SERIES_LABELS = ['공룡', '육지', '식물', '곤충', '바다', '하늘', '우주', '우리몸'];

describe('buildNatureReelProps', () => {
  it('훅+사실+관찰 3씬 조립, 훅 라벨=책 제목, 이미지=pages illustrationUrl(encodeURI)', () => {
    const out = buildNatureReelProps({
      storybook: makeStorybook(),
      storyboard: makeStoryboard(),
      seriesCovers: SERIES_COVERS,
      seriesLabels: SERIES_LABELS,
    });
    expect(out).not.toBeNull();
    expect(out!.bookTitle).toBe('기가노토사우루스');
    expect(out!.category).toBe('공룡 친구들');
    expect(out!.scenes.length).toBe(3);
    expect(out!.scenes[0].label).toBe('기가노토사우루스');
    expect(out!.scenes[0].imageUrls).toEqual(['https://r2/%EA%B8%B0%EA%B0%80/cover.webp']);
    expect(out!.scenes[0].durSec).toBe(NATURE_SCENE_DURS[0]);
    expect(out!.scenes[1].label).toBe('신기한 사실');
    expect(out!.scenes[1].durSec).toBe(NATURE_SCENE_DURS[1]);
    for (const s of out!.scenes) expect(s.imageUrls.length).toBeGreaterThanOrEqual(1);
    expect(out!.series.covers.length).toBe(8);
    expect(out!.series.labels).toEqual(SERIES_LABELS);
    expect(out!.series.headline).toContain('자연도감');
  });

  it('손수 captions 가 subtitle/narration 보다 우선', () => {
    const out = buildNatureReelProps({
      storybook: makeStorybook(),
      storyboard: makeStoryboard(),
      captions: ['훅캡션', '사실캡션', '관찰캡션'],
      seriesCovers: SERIES_COVERS,
      seriesLabels: SERIES_LABELS,
    });
    expect(out!.scenes.map((s) => s.body)).toEqual(['훅캡션', '사실캡션', '관찰캡션']);
  });

  it('captions 없으면 스토리보드 subtitle 폴백(사실=scene[1], 관찰=scene[3])', () => {
    const out = buildNatureReelProps({
      storybook: makeStorybook(),
      storyboard: makeStoryboard(),
      seriesCovers: SERIES_COVERS,
      seriesLabels: SERIES_LABELS,
    });
    expect(out!.scenes[1].body).toBe('신기한 사실 자막');
    expect(out!.scenes[2].body).toBe('관찰 포인트 자막');
  });

  it('스토리보드 5씬 미만이면 null', () => {
    const out = buildNatureReelProps({
      storybook: makeStorybook(),
      storyboard: makeStoryboard(4),
      seriesCovers: SERIES_COVERS,
      seriesLabels: SERIES_LABELS,
    });
    expect(out).toBeNull();
  });

  it('illustrationUrl 있는 페이지가 없으면 null', () => {
    const sb = {
      title: 'X',
      category: '식물 친구들',
      coverImage: 'https://r2/x/cover.webp',
      pages: [],
    };
    const out = buildNatureReelProps({
      storybook: sb,
      storyboard: makeStoryboard(),
      seriesCovers: SERIES_COVERS,
      seriesLabels: SERIES_LABELS,
    });
    expect(out).toBeNull();
  });

  it('coverImage 없으면 첫 페이지 삽화를 표지로', () => {
    const sb = { ...makeStorybook(), coverImage: '' };
    const out = buildNatureReelProps({
      storybook: sb,
      storyboard: makeStoryboard(),
      seriesCovers: SERIES_COVERS,
      seriesLabels: SERIES_LABELS,
    });
    expect(out!.scenes[0].imageUrls[0]).toBe('https://r2/%EA%B8%B0%EA%B0%80/page-1.webp');
  });
});
