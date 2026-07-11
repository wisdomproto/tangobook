# 자연관찰 릴스 파이프라인 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자연관찰 동화책용 "팩트 호기형" 9:16 릴스를 명작 파이프라인 자산을 재사용해 배치 생성하고, 공룡 5권 파일럿 → 승인 → 101권 확장 + IG 예약까지 잇는다.

**Architecture:** 순수 빌더 `buildNatureReelProps`(서버, TDD)가 자연관찰 책 JSON(`pages[].illustrationUrl` + `coverImage`)과 스토리보드·손수 캡션·도감 대표표지 8장을 받아 씬 props 를 만든다. Remotion 신규 컴포지션 `NatureReel`(재사용 `StoryScene`/`Closing` + 신규 `SeriesShowcase`)이 렌더, 신규 `NatureThumb`가 썸네일. 배치 러너 `render-book-reels.ts`에 `--category=nature` 분기를 추가하고, R2 업로드·마케팅 연결·IG 예약은 기존 book-agnostic 코드를 그대로 쓴다. 명작 경로(`buildReelProps`/`StorybookReel`)는 무변경.

**Tech Stack:** TypeScript, Node/tsx, Remotion v4, Zod, Vitest, Cloudflare R2, Supabase.

**Spec:** `docs/superpowers/specs/2026-07-11-nature-observation-reels-design.md`

---

## File Structure

**신규(server):**
- `packages/server/src/services/reel/nature-reel-props.ts` — 순수 빌더 `buildNatureReelProps` + `NatureReelProps` 타입
- `packages/server/src/services/reel/__tests__/nature-reel-props.test.ts` — 빌더 TDD

**수정(server):**
- `packages/server/src/services/reel/reel-targets.ts` — `resolveNatureBookIds`·`loadNatureReelCaptions`·`resolveSeriesCovers`·`NATURE_SERIES_COVERS` 추가
- `packages/server/scripts/render-book-reels.ts` — `--category=nature` 분기(빌드·컴포지션·썸네일 선택)
- `packages/server/scripts/_data/marketing/reel-captions-nature.json` — 신규 캡션 파일(파일럿 5권)

**신규(remotion):**
- `packages/remotion/src/data/nature-reel.ts` — Zod 스키마 + duration 계산
- `packages/remotion/src/components/reels/storybook/SeriesShowcase.tsx` — 도감 8테마 그리드 씬
- `packages/remotion/src/compositions/NatureReel.tsx` — 자연관찰 컴포지션

**수정(remotion):**
- `packages/remotion/src/compositions/ReelThumbnail.tsx` — `NatureThumbSchema` + `NatureThumb` 추가
- `packages/remotion/src/Root.tsx` — `NatureReel`·`ReelThumbNature` Composition 등록

**작업 위치:** worktree `C:\projects\tangobook\.worktrees\storybook-reels` (릴스 코드가 있는 브랜치) 또는 새 worktree. main 은 다른 세션이 사용 중이므로 브랜치에서 작업 후 병합.

---

## Chunk 1: 순수 빌더 + 타겟/캡션 로더 (서버, TDD)

### Task 1: `buildNatureReelProps` 빌더 (TDD)

**Files:**
- Create: `packages/server/src/services/reel/nature-reel-props.ts`
- Test: `packages/server/src/services/reel/__tests__/nature-reel-props.test.ts`

명작 `reel-props.ts` 의 `firstClause`·`splitIntoBuckets` 를 재사용(import). 자연관찰은 삽화가 `pages[].illustrationUrl`(top-level), 표지는 `storybook.coverImage`. 씬 = 훅(표지) + 신기한사실(페이지 버킷) + 관찰포인트(페이지 버킷). 모핑 없음 — 대신 `series`(도감 8표지) prop.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// nature-reel-props.test.ts
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
    expect(out!.scenes[0].label).toBe('기가노토사우루스'); // 훅 헤드라인=제목
    expect(out!.scenes[0].imageUrls).toEqual(['https://r2/%EA%B8%B0%EA%B0%80/cover.webp']);
    expect(out!.scenes[0].durSec).toBe(NATURE_SCENE_DURS[0]);
    expect(out!.scenes[1].label).toBe('신기한 사실');
    expect(out!.scenes[1].durSec).toBe(NATURE_SCENE_DURS[1]);
    // 모든 씬 이미지 최소 1
    for (const s of out!.scenes) expect(s.imageUrls.length).toBeGreaterThanOrEqual(1);
    // 도감 시리즈
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
    const sb = { title: 'X', category: '식물 친구들', coverImage: 'https://r2/x/cover.webp', pages: [] };
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/reel/__tests__/nature-reel-props.test.ts`
Expected: FAIL — `buildNatureReelProps` not exported.

- [ ] **Step 3: 최소 구현**

```ts
// nature-reel-props.ts
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
  captions?: string[]; // [훅, 사실, 관찰] 오버라이드
  seriesCovers: string[];
  seriesLabels: string[];
}): NatureReelProps | null {
  const sbScenes = storyboard?.scenes;
  if (!Array.isArray(sbScenes) || sbScenes.length < 5) return null; // 자연관찰 스토리보드=5씬

  const pages = (Array.isArray(storybook.pages) ? storybook.pages : [])
    .filter((p: any) => p?.illustrationUrl)
    .sort((a: any, b: any) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0));
  if (pages.length === 0) return null;

  const cover = encodeURI(storybook.coverImage || pages[0].illustrationUrl);
  const urlOf = (p: any) => encodeURI(p.illustrationUrl);
  const bookTitle = storybook.title || '';

  // 자막 우선순위: 손수 captions[i] > 스토리보드 subtitle > 나레이션 첫 절.
  // 자연관찰 스토리보드 씬 매핑: [0]훅 [1]신기한사실 [3]관찰포인트.
  const bodyOf = (sc: any, i: number) => {
    const hand = captions?.[i]?.trim();
    if (hand) return hand;
    return sc?.subtitle?.trim() ? sc.subtitle.trim() : firstClause(sc?.narration ?? '');
  };

  // 사실·관찰 씬에 페이지 삽화 분배(2 버킷).
  const buckets = splitIntoBuckets(pages, 2);
  const factImgs = (buckets[0].length ? buckets[0] : pages).map(urlOf);
  const obsImgs = (buckets[1].length ? buckets[1] : pages).map(urlOf);

  return {
    bookTitle,
    category: storybook.category || '',
    scenes: [
      { label: bookTitle, body: bodyOf(sbScenes[0], 0), imageUrls: [cover], durSec: NATURE_SCENE_DURS[0] },
      { label: sbScenes[1]?.label ?? '신기한 사실', body: bodyOf(sbScenes[1], 1), imageUrls: factImgs, durSec: NATURE_SCENE_DURS[1] },
      { label: sbScenes[3]?.label ?? '관찰 포인트', body: bodyOf(sbScenes[3], 2), imageUrls: obsImgs, durSec: NATURE_SCENE_DURS[2] },
    ],
    series: { covers: seriesCovers, labels: seriesLabels, headline: SERIES_HEADLINE },
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/reel/__tests__/nature-reel-props.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: 커밋**

```bash
git add packages/server/src/services/reel/nature-reel-props.ts packages/server/src/services/reel/__tests__/nature-reel-props.test.ts
git commit -m "feat(reel): buildNatureReelProps — fact-driven nature reel builder (TDD)"
```

### Task 2: 타겟·캡션·도감표지 로더 (`reel-targets.ts`)

**Files:**
- Modify: `packages/server/src/services/reel/reel-targets.ts`

`resolveClassicBookIds`/`loadReelCaptions`/`loadStoryboard`/`fetchStorybook` 패턴을 따른다.

- [ ] **Step 1: `resolveNatureBookIds` 추가**

`books-by-category.json` 에서 자연관찰 카테고리만. `resolveClassicBookIds` 바로 아래 추가:

```ts
/** 자연관찰 동화책 id (books-by-category.json, 육지동물·공룡·식물·곤충·바다·하늘·우주·우리몸). */
export function resolveNatureBookIds(): string[] {
  const file = path.join(SCRIPTS_DATA, 'books-by-category.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8')) as { books: Array<{ id: string; category?: string }> };
  return json.books
    .filter((b) => /공룡|동물|식물|곤충|바다|하늘|우주|우리 몸/.test(b.category ?? ''))
    .filter((b) => !/파닉스|명작|세계|backup/.test(b.category ?? ''))
    .map((b) => b.id);
}
```

- [ ] **Step 2: `loadNatureReelCaptions` 추가**

`loadReelCaptions` 와 동일 패턴, 파일명만 `reel-captions-nature.json`:

```ts
let _natureCaptions: Record<string, string[]> | null = null;
/** 손수 작성 자연관찰 릴스 자막 [훅, 사실, 관찰]. 파일/책 없으면 undefined. */
export function loadNatureReelCaptions(id: string): string[] | undefined {
  if (!_natureCaptions) {
    const file = path.join(SCRIPTS_DATA, 'marketing', 'reel-captions-nature.json');
    _natureCaptions = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  }
  return _natureCaptions![id];
}
```

- [ ] **Step 3: `NATURE_SERIES_COVERS` 상수 + `resolveSeriesCovers` 추가**

도감 8테마 대표 책(카테고리별 1권, 실측 선별). `resolveSeriesCovers` 는 각 책 R2 JSON 의 `coverImage` 를 fetch 해 `{covers, labels}` 반환(배치당 1회, 모듈 캐시).

```ts
/** 도감 시리즈 씬용 8테마 대표 책(카테고리→대표 bookId+라벨). */
export const NATURE_SERIES_COVERS: Array<{ label: string; bookId: string }> = [
  { label: '공룡', bookId: '1773714531390' }, // 티라노사우루스 렉스
  { label: '육지동물', bookId: '1777438039433' }, // 사자
  { label: '식물', bookId: '1773365203383' }, // 해바라기
  { label: '곤충', bookId: '1777603478247' }, // 호랑나비
  { label: '바다동물', bookId: '1777610290605' }, // 고래
  { label: '하늘동물', bookId: '1777596431093' }, // 독수리
  { label: '우주와 자연', bookId: '1773615989178' }, // 갯벌 (구현 시 태양계 등 시각적 강한 것으로 교체 가능)
  { label: '우리 몸', bookId: '1773710246892' }, // 뇌와 심장 이야기
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
```

- [ ] **Step 4: 타입체크**

Run: `pnpm --filter @tangobook/server exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add packages/server/src/services/reel/reel-targets.ts
git commit -m "feat(reel): nature target/caption/series-cover resolvers"
```

---

## Chunk 2: Remotion 컴포지션·씬·썸네일

### Task 3: `data/nature-reel.ts` (Zod 스키마 + duration)

**Files:**
- Create: `packages/remotion/src/data/nature-reel.ts`

명작 `data/storybook-reel.ts` 를 미러. 상수는 서버 빌더와 값 일치 유지(패키지 경계로 import 회피 — 주석 명시).

- [ ] **Step 1: 작성**

```ts
import { z } from 'zod';
import { REEL_FPS, REEL_WIDTH, REEL_HEIGHT, SceneSchema, BGM_SRC } from './storybook-reel';

export { REEL_FPS, REEL_WIDTH, REEL_HEIGHT, BGM_SRC };
export const NATURE_SERIES_SEC = 5;
export const NATURE_CTA_SEC = 6;
export const NATURE_HOOK_SEC = 4;
export const NATURE_BODY_SEC = 8;

export const NatureSeriesSchema = z.object({
  covers: z.array(z.string()).min(1),
  labels: z.array(z.string()).min(1),
  headline: z.string(),
});
export const NatureReelPropsSchema = z.object({
  bookTitle: z.string(),
  category: z.string(),
  scenes: z.array(SceneSchema).min(2),
  series: NatureSeriesSchema,
});
export type NatureReelProps = z.infer<typeof NatureReelPropsSchema>;

export function natureSceneDurations(props: NatureReelProps): number[] {
  return props.scenes.map((s, i) => (s.durSec ?? (i === 0 ? NATURE_HOOK_SEC : NATURE_BODY_SEC)) * REEL_FPS);
}
export function computeNatureReelFrames(props: NatureReelProps): number {
  const scenes = natureSceneDurations(props).reduce((a, b) => a + b, 0);
  return scenes + (NATURE_SERIES_SEC + NATURE_CTA_SEC) * REEL_FPS;
}
```

- [ ] **Step 2: 타입체크 + 커밋**

Run: `pnpm --filter @tangobook/remotion exec tsc --noEmit` (없으면 루트 `pnpm typecheck`)
```bash
git add packages/remotion/src/data/nature-reel.ts
git commit -m "feat(reel): nature-reel zod schema + duration"
```

### Task 4: `SeriesShowcase` 씬 컴포넌트

**Files:**
- Create: `packages/remotion/src/components/reels/storybook/SeriesShowcase.tsx`

`StyleShowcase.tsx`(모핑 씬)의 레이아웃·폰트·등장 애니 패턴을 미러하되, 내용은 **8테마 표지 그리드(2×4 또는 4×2)** + 큰 헤드라인 "우리 아이 첫 자연도감 100권+" + 테마 라벨. 표지 `<Img>` 는 이미 encodeURI 된 URL. peach/coral 톤(디자인시스템, StoryScene 와 통일).

- [ ] **Step 1: 컴포넌트 작성**

```tsx
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

interface Props {
  headline: string;
  covers: string[]; // 8
  labels: string[]; // 8
}

export const SeriesShowcase: React.FC<Props> = ({ headline, covers, labels }) => {
  const frame = useCurrentFrame();
  const items = covers.slice(0, 8);
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #FFF3E9 0%, #FFE1CC 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 48px',
        gap: 56,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 76,
          color: '#2B2B2B',
          textAlign: 'center',
          lineHeight: 1.2,
          wordBreak: 'keep-all',
          opacity: interpolate(frame, [2, 18], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {headline}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, width: '100%' }}>
        {items.map((url, i) => {
          const enter = interpolate(frame, [6 + i * 3, 18 + i * 3], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div key={url} style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}>
              <div style={{ aspectRatio: '1 / 1', borderRadius: 22, overflow: 'hidden', boxShadow: '0 12px 30px rgba(120,60,30,0.2)', backgroundColor: '#241a14' }}>
                <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontFamily, fontWeight: 700, fontSize: 30, color: '#4A3B33', textAlign: 'center', marginTop: 10, wordBreak: 'keep-all' }}>
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: 타입체크 + 커밋**

```bash
git add packages/remotion/src/components/reels/storybook/SeriesShowcase.tsx
git commit -m "feat(reel): SeriesShowcase scene — nature series 8-theme grid"
```

### Task 5: `NatureReel` 컴포지션

**Files:**
- Create: `packages/remotion/src/compositions/NatureReel.tsx`

`StorybookReel.tsx` 를 미러 — 씬 시퀀스(StoryScene) + SeriesShowcase(모핑 자리) + Closing + BGM.

- [ ] **Step 1: 작성**

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile, interpolate } from 'remotion';
import { StoryScene } from '../components/reels/storybook/StoryScene';
import { SeriesShowcase } from '../components/reels/storybook/SeriesShowcase';
import { Closing } from '../components/reels/storybook/Closing';
import {
  NatureReelProps,
  natureSceneDurations,
  computeNatureReelFrames,
  NATURE_SERIES_SEC,
  NATURE_CTA_SEC,
  REEL_FPS,
  BGM_SRC,
} from '../data/nature-reel';

export const NatureReel: React.FC<NatureReelProps> = (props) => {
  const total = computeNatureReelFrames(props);
  const durs = natureSceneDurations(props);
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1310' }}>
      <Audio
        src={staticFile(BGM_SRC)}
        loop
        volume={(f) =>
          interpolate(f, [0, 15, total - 40, total], [0, 0.55, 0.55, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
      <Series>
        {props.scenes.map((sc, i) => (
          <Series.Sequence key={i} durationInFrames={durs[i]}>
            <StoryScene title={sc.label} body={sc.body} imageUrls={sc.imageUrls} hero={i === 0} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={NATURE_SERIES_SEC * REEL_FPS}>
          <SeriesShowcase headline={props.series.headline} covers={props.series.covers} labels={props.series.labels} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={NATURE_CTA_SEC * REEL_FPS}>
          <Closing />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: 타입체크 + 커밋**

```bash
git add packages/remotion/src/compositions/NatureReel.tsx
git commit -m "feat(reel): NatureReel composition"
```

### Task 6: `NatureThumb` 썸네일

**Files:**
- Modify: `packages/remotion/src/compositions/ReelThumbnail.tsx`

`ThumbPoster`(1이미지 포스터형)를 미러하되, 제목 아래 **호기심 헤드라인**(hook 캡션)과 **카테고리 배지** 추가. 신규 스키마.

- [ ] **Step 1: `NatureThumbSchema` + `NatureThumb` 추가**

파일 하단(export 들 사이)에:

```tsx
export const NatureThumbSchema = z.object({
  bookTitle: z.string(),
  coverUrl: z.string(),
  headline: z.string(),   // 호기심 훅 (예: "티라노보다 컸다고?")
  categoryLabel: z.string(), // 예: "공룡 친구들"
});
export type NatureThumbProps = z.infer<typeof NatureThumbSchema>;

export const THUMB_NATURE_SAMPLE: NatureThumbProps = {
  bookTitle: '기가노토사우루스',
  coverUrl: THUMB_FROG.coverUrl, // 샘플 재사용(디폴트 프리뷰용)
  headline: '티라노보다 컸다고?',
  categoryLabel: '공룡 친구들',
};

export const NatureThumb: React.FC<NatureThumbProps> = ({ bookTitle, coverUrl, headline, categoryLabel }) => {
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(165deg, #FFF3E9 0%, #FFDCC6 100%)', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '130px 60px 120px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...chip(), marginBottom: 28 }}>{categoryLabel}</div>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 104, color: '#2B2B2B', lineHeight: 1.12, wordBreak: 'keep-all' }}>{bookTitle}</div>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 66, color: '#FF6B5E', lineHeight: 1.2, marginTop: 22, wordBreak: 'keep-all' }}>{headline}</div>
      </div>
      <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 40, overflow: 'hidden', boxShadow: '0 30px 70px rgba(120,60,30,0.28)', border: '10px solid #fff', backgroundColor: '#241a14' }}>
        <Img src={coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </AbsoluteFill>
  );
};
```

> `chip()` 과 `fontFamily` 는 파일 상단에 이미 정의됨(ThumbPoster 가 사용) — 재사용.

- [ ] **Step 2: 타입체크 + 커밋**

```bash
git add packages/remotion/src/compositions/ReelThumbnail.tsx
git commit -m "feat(reel): NatureThumb thumbnail (curiosity headline + category badge)"
```

### Task 7: Root.tsx 등록

**Files:**
- Modify: `packages/remotion/src/Root.tsx`

- [ ] **Step 1: import 추가**

상단 import 블록:
```tsx
import { NatureReel } from './compositions/NatureReel';
import {
  NatureReelPropsSchema,
  type NatureReelProps,
  computeNatureReelFrames,
} from './data/nature-reel';
```
> `REEL_FPS`/`REEL_WIDTH`/`REEL_HEIGHT` 는 이미 storybook-reel 에서 import 돼 있으니 그대로 재사용(중복 import 금지 — nature-reel 에서 또 가져오지 말 것). `NatureThumb`·`NatureThumbSchema`·`THUMB_NATURE_SAMPLE` 는 기존 `./compositions/ReelThumbnail` import 라인에 추가.

- [ ] **Step 2: `NATURE_DEFAULT` 디폴트 props 추가**

`FROG_DEFAULT` 아래에 최소 유효 props(프리뷰용):
```tsx
const NATURE_DEFAULT: NatureReelProps = {
  bookTitle: '기가노토사우루스',
  category: '공룡 친구들',
  scenes: FROG_DEFAULT.scenes.slice(0, 3),
  series: {
    covers: FROG_DEFAULT.scenes.slice(0, 1).flatMap((s) => s.imageUrls).concat(Array(7).fill(FROG_DEFAULT.scenes[0].imageUrls[0])),
    labels: ['공룡', '육지', '식물', '곤충', '바다', '하늘', '우주', '우리몸'],
    headline: '우리 아이 첫 자연도감 100권+',
  },
};
```

- [ ] **Step 3: Composition 등록** (StorybookReel 블록 아래)

```tsx
<Composition
  id="NatureReel"
  component={NatureReel}
  schema={NatureReelPropsSchema}
  durationInFrames={computeNatureReelFrames(NATURE_DEFAULT)}
  fps={REEL_FPS}
  width={REEL_WIDTH}
  height={REEL_HEIGHT}
  defaultProps={NATURE_DEFAULT}
  calculateMetadata={({ props }) => ({ durationInFrames: computeNatureReelFrames(props) })}
/>
<Composition
  id="ReelThumbNature"
  component={NatureThumb}
  schema={NatureThumbSchema}
  durationInFrames={1}
  fps={30}
  width={1080}
  height={1920}
  defaultProps={THUMB_NATURE_SAMPLE}
/>
```

- [ ] **Step 4: Remotion Studio 로드 확인(빌드)**

Run: `pnpm --filter @tangobook/remotion exec remotion compositions packages/remotion/src/entry.ts` (또는 루트 `pnpm typecheck`)
Expected: `NatureReel`·`ReelThumbNature` 가 목록에 나옴, 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add packages/remotion/src/Root.tsx
git commit -m "feat(reel): register NatureReel + ReelThumbNature compositions"
```

---

## Chunk 3: 배치 러너 분기 + 파일럿 렌더

### Task 8: `render-book-reels.ts` 자연관찰 분기

**Files:**
- Modify: `packages/server/scripts/render-book-reels.ts`

`--category=nature` 시: 대상 = `resolveNatureBookIds()`, 빌드 = `buildNatureReelProps`(+ `loadNatureReelCaptions` + `resolveSeriesCovers`), 컴포지션 = `NatureReel`, 썸네일 = `ReelThumbNature`. 명작 경로는 무변경. 업로드·연결·타임아웃 로직은 공유(book-agnostic).

- [ ] **Step 1: import + 대상 분기**

import 추가: `resolveNatureBookIds, loadNatureReelCaptions, resolveSeriesCovers` (reel-targets), `buildNatureReelProps, type NatureReelProps` (nature-reel-props).

`// 2. 대상 id 결정` 블록을 카테고리 분기로:
```ts
const isNature = args.category === 'nature';
let ids = args.book ? [args.book] : isNature ? resolveNatureBookIds() : resolveClassicBookIds();
if (!args.book && args.limit != null) ids = ids.slice(0, args.limit);
```

- [ ] **Step 2: series covers 프리로드(자연관찰만)**

genreMap 로드 부근:
```ts
const series = isNature ? await resolveSeriesCovers() : null;
```

- [ ] **Step 3: 빌드 분기 (loop 안 `buildReelProps` 호출부)**

`buildNatureReelProps` 는 `styleMorph` 필드가 없어 유니온 타입에서 `props.styleMorph` 접근이 `tsc` 에러를 낸다. 러너는 스크립트(이미 `renderThumb(id, props: any)` 로 느슨)라 **`props` 를 `any` 로 받는다**:

```ts
const props: any = isNature
  ? buildNatureReelProps({
      storybook,
      storyboard,
      captions: loadNatureReelCaptions(id),
      seriesCovers: series!.covers,
      seriesLabels: series!.labels,
    })
  : buildReelProps({ storybook, storyboard, genreMap, captions: loadReelCaptions(id) });
```

또한 loop 안 기존 두 줄 `if (props.styleMorph) summary.morphYes++;` (render-book-reels.ts 약 197·224행)은 자연관찰에선 `styleMorph` 가 없으니 **`if (!isNature && props.styleMorph) summary.morphYes++;`** 로 바꾼다(양쪽 다).

- [ ] **Step 4: 컴포지션·썸네일 id 분기**

`renderThumb` 시그니처에 `isNature` 반영 — 함수 상단에서 compId·props 를 분기(간단히 `renderThumb(id, props, isNature)`):
```ts
async function renderThumb(id: string, props: any, nature: boolean): Promise<string> {
  const compId = nature ? 'ReelThumbNature' : props.styleMorph ? 'ReelThumbStyles' : 'ReelThumbPoster';
  const thumbProps = nature
    ? { bookTitle: props.bookTitle, coverUrl: props.scenes[0].imageUrls[0], headline: props.scenes[0].body, categoryLabel: props.category }
    : { bookTitle: props.bookTitle, coverUrl: props.scenes[0].imageUrls[0], styles: props.styleMorph?.styles ?? [] };
  // …selectComposition/renderStill 동일…
}
```
영상 `selectComposition` 의 `id: 'StorybookReel'` → `id: isNature ? 'NatureReel' : 'StorybookReel'`. `renderThumb(id, props)` 호출부 3곳 → `renderThumb(id, props, isNature)`. `morph` 로그는 자연관찰에서 `props.styleMorph` 없으니 `const morph = isNature ? 'nature' : props.styleMorph ? 'yes' : 'no';` 로.

- [ ] **Step 5: 타입체크**

Run: `pnpm --filter @tangobook/server exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add packages/server/scripts/render-book-reels.ts
git commit -m "feat(reel): render-book-reels --category=nature branch"
```

### Task 9: 파일럿 캡션 작성 (공룡 5권)

**Files:**
- Create: `packages/server/scripts/_data/marketing/reel-captions-nature.json`

각 책의 R2 JSON `educational_content`/`pages[].text` 를 근거로 **팩트 정확성 검증** 후 손수 작성. 5권 id:
- `1773714531390` 티라노사우루스 렉스
- `1773716818847` 기가노토사우루스
- `1773739549787` 트리케라톱스
- `1773728203238` 브라키오사우루스
- `1773720291702` 벨로키라프토르

각 값 = `[훅, 신기한 사실, 관찰 포인트]` (훅=호기심 자극, 사실=놀라운 팩트 2~3문장, 관찰=실천형).

- [ ] **Step 1: 각 책 educational_content 확인**

Run(각 id): `curl -s "https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/storybook-1773714531390.json" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(JSON.stringify(j.educational_content,null,1).slice(0,1500));console.log('PAGES:',j.pages.map(p=>p.text).join(' / ').slice(0,800))})"`
사실을 여기서 확인(크기·시대·특징). 잘못된 수치 금지.

- [ ] **Step 2: JSON 작성** (예시 구조 — 실제 팩트는 Step 1 근거로)

```json
{
  "1773714531390": [
    "공룡의 왕, 티라노사우루스는 얼마나 무서웠을까요?",
    "약 6,800만 년 전 북아메리카에 살았어요. 몸길이 12~13m, 이빨 하나가 어른 손만큼 컸고, 후각이 아주 뛰어나 멀리서도 먹이 냄새를 맡았대요.",
    "거대한 머리, 작은 앞발, 톱니 같은 이빨을 아이와 함께 찾아보세요."
  ]
}
```
(나머지 4권 동일 구조로 채움 — 각 책 데이터 근거.)

- [ ] **Step 3: JSON 유효성 확인**

Run: `node -e "JSON.parse(require('fs').readFileSync('packages/server/scripts/_data/marketing/reel-captions-nature.json','utf8'));console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: 커밋**

```bash
git add packages/server/scripts/_data/marketing/reel-captions-nature.json
git commit -m "content(reel): nature reel captions — dinosaur pilot (5 books)"
```

### Task 10: 파일럿 dry-run 렌더 + 육안 검증

- [ ] **Step 1: 5권 dry-run 렌더** (R2/DB 쓰기 없음, 로컬 mp4)

Run:
```bash
cd packages/server && for id in 1773714531390 1773716818847 1773739549787 1773728203238 1773720291702; do pnpm exec tsx scripts/render-book-reels.ts --category=nature --book=$id --dry-run; done
```
Expected: 각 책 `out/reels/<id>.mp4` 생성, 로그 `morph=nature`, skip/fail 0.
> (참고: for-loop 이라 invocation 마다 도감 표지 8장을 재fetch — 5×8=40회, 무해. 모듈 캐시는 invocation 내에서만 유효.)

- [ ] **Step 2: 썸네일 dry-run**

Run: `cd packages/server && pnpm exec tsx scripts/render-book-reels.ts --category=nature --book=1773714531390 --thumbs-only --dry-run`
Expected: `out/reels/1773714531390-thumb.png` 생성.

- [ ] **Step 3: 육안 확인 → 사용자 승인 게이트**

5개 mp4 + 썸네일을 사용자에게 제시. 확인 관점: (1) 팩트 정확·놀라움 (2) 실사풍 삽화 9:16 크롭 (3) 도감 시리즈 씬 전달 (4) 썸네일 후킹.
**⚠️ 사용자 승인 전 다음 청크(101권 확장) 진행 금지.**

---

## Chunk 4: (승인 후) 101권 확장 + IG 예약 — 인간 게이트

> ⚠️ 이 청크는 파일럿 승인 후에만 실행. 코드 작업 아님 — 콘텐츠(캡션) + 배치 실행.

### Task 11: 자연관찰 96권 캡션 작성

- [ ] `reel-captions-nature.json` 에 나머지 96권 추가. 카테고리별 톤(공룡=웅장 / 곤충=작은 경이 / 식물=잔잔 / 우주=경이 / 우리몸=신기). 각 책 `educational_content` 근거 팩트 검증. 커밋.

### Task 12: 101권 배치 렌더 + 마케팅 연결

- [ ] Run: `cd packages/server && pnpm exec tsx scripts/render-book-reels.ts --category=nature`
- [ ] 결과 요약(rendered/skipped/failed) 확인. 실패 책은 `--book=<id>` 재실행.
- [ ] Supabase `mkt_instagram_contents[*].video_settings.reels.ko` 채워짐 검증.

### Task 13: IG 예약 (기존 스크립트 재사용)

- [ ] Run(dry-run): `cd packages/server && pnpm exec tsx scripts/schedule-reels-instagram.ts --dry-run`
      → 자연관찰 신규 릴스가 계획에 뜨는지 확인(명작은 이미 큐라 skip). 시작 슬롯·순서 확인.
- [ ] 캡션·순서·시작 확인 후 실제 예약(사용자 컨펌 필요 — 실 발행). 필요 시 `--per-day`/`--times`/`--start` 조정.

### Task 14: 브랜치 병합 + 문서/메모리 갱신

- [ ] 브랜치를 main 에 병합(명작 릴스 때 쓴 ff-only 패턴 — main 의 미커밋 파일 보존).
- [ ] 스펙 상태 `완료`, memory `storybook-reels-pipeline-2026-07-10` 에 자연관찰 항목 추가.

---

## 검증 요약

| 레벨 | 방법 |
|---|---|
| 단위 | `nature-reel-props.test.ts` (Vitest, 6+) |
| 타입 | `tsc --noEmit` (server·remotion) |
| 통합 | 파일럿 5권 dry-run 로컬 mp4 육안 |
| 회귀 | 명작 경로 무변경 — `reel-props.test.ts` 여전히 통과 |
| E2E | 101권 배치 → Supabase reels.ko → IG dry-run 스케줄 |
