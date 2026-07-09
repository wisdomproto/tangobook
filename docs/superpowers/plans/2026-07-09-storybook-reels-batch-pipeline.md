# 동화책 릴스 배치 파이프라인 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 개구리 왕자 릴스를 props 기반 일반 컴포지션으로 만들고, 명작 51권 한국어 릴스를 자동 렌더해 R2 + 마케팅 페이지에 연결한다.

**Architecture:** 3 유닛 — ① `StorybookReel`(Remotion, inputProps+calculateMetadata) ② `buildReelProps`(순수 TS, 스토리보드+책 삽화→props) ③ 배치 러너(bundle→render→R2 업로드→Supabase 연결). 이미지는 R2 URL 직접 로드(encodeURI). 파일럿=명작 51권·ko, 1권 full 검증 후 배치.

**Tech Stack:** Remotion v4 (`@remotion/renderer`, `@remotion/bundler`), Zod, tsx, vitest, R2(S3 SDK), Supabase service-role.

**Spec:** `docs/superpowers/specs/2026-07-09-storybook-reels-batch-pipeline-design.md`

**작업 위치:** worktree `.worktrees/storybook-reels` (브랜치 `feat/storybook-reels`). 모든 명령은 이 디렉터리 기준.

---

## File Structure

**Remotion (`packages/remotion/src/`)**
- `data/storybook-reel.ts` — CREATE. Zod `StorybookReelPropsSchema` + 파생 타입 + 상수(장면 초, 고정 CTA/모핑 카피) + `computeReelFrames(props, fps)`.
- `components/reels/storybook/StoryScene.tsx` — CREATE (FrogStoryScene 일반화: props `{title, body, imageUrls, hero}`).
- `components/reels/storybook/StyleShowcase.tsx` — CREATE (FrogStyleShowcase 일반화: props `{title, lines, styles}`).
- `components/reels/storybook/Closing.tsx` — CREATE (FrogClosing 이동, 변경 최소).
- `compositions/StorybookReel.tsx` — CREATE. props→Series(scenes + optional morph + closing) + `<Audio>` bgm.
- `Root.tsx` — MODIFY. `StorybookReel` 등록(defaultProps=개구리 왕자 R2 URL 세트, calculateMetadata).
- `public/reels/bgm.mp3` — CREATE (frog/bgm.mp3 복사, 중립 경로).
- 기존 `FrogPrinceReel`/`frog/*`/`data/frog-reel.ts` 는 **보존**(회귀 안전망, 별도 컴포지션).

**Server (`packages/server/src/services/reel/`)**
- `reel-props.ts` — CREATE. 순수 `buildReelProps({storybook, storyboard, genreMap})` + 헬퍼(`firstClause`, `splitPagesIntoBuckets`, `pickMorph`).
- `__tests__/reel-props.test.ts` — CREATE. vitest 단위 테스트.
- `reel-targets.ts` — CREATE. `resolveClassicBookIds()`(books-by-category.json) + `fetchStorybook(id)`(R2) + `loadStoryboard(id)`(disk) + `loadGenreMap()`(R2, 캐시).
- `reel-publish.ts` — CREATE. `uploadReelMp4(projectId, bookId, filePath)`(R2 PUT→publicUrl) + `connectReelToMarketing({bookId, videoUrl, coverUrl, ownerUserId})`(Supabase admin: content/project/instagram row resolve+update).

**Server scripts (`packages/server/scripts/`)**
- `render-book-reels.ts` — CREATE. CLI orchestrator (tsx): bundle 1회 → 책별 build/render/upload/connect. flags `--book --limit --dry-run --owner-email --category`.

---

## Chunk 1: Generalize composition → `StorybookReel`

목표: 개구리 왕자 컴포넌트를 props 기반으로 일반화하고, R2 URL 원격 로드가 헤드리스 렌더에서 동작함을 스틸로 검증.

### Task 1: props 스키마 + 프레임 계산

**Files:**
- Create: `packages/remotion/src/data/storybook-reel.ts`

- [ ] **Step 1: 스키마·상수·프레임 계산 작성**

```ts
import { z } from 'zod';

export const REEL_FPS = 30;
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;

export const HOOK_SEC = 4;
export const BODY_SEC = 8; // 훅 이후 각 본문 장면
export const MORPH_SEC = 6;
export const CTA_SEC = 6;

/** 모핑 씬 고정 카피(책 제목 비의존). */
export const MORPH_LINES = ['탱고북에선', '한 권의 이야기를', '아이의 취향대로 고를 수 있습니다'];

export const SceneSchema = z.object({
  label: z.string(),
  body: z.string(),
  imageUrls: z.array(z.string()).min(1),
});
export const MorphStyleSchema = z.object({ url: z.string(), label: z.string() });
export const StorybookReelPropsSchema = z.object({
  bookTitle: z.string(),
  scenes: z.array(SceneSchema).min(2), // 훅 + 본문 ≥1
  styleMorph: z
    .object({ lines: z.array(z.string()).min(1), styles: z.array(MorphStyleSchema).min(2) })
    .nullable(),
});
export type StorybookReelProps = z.infer<typeof StorybookReelPropsSchema>;

/** 씬 하나당 프레임(훅=첫 씬, 나머지 본문). */
export function sceneDurations(props: StorybookReelProps): number[] {
  return props.scenes.map((_, i) => (i === 0 ? HOOK_SEC : BODY_SEC) * REEL_FPS);
}
export function computeReelFrames(props: StorybookReelProps): number {
  const scenes = sceneDurations(props).reduce((a, b) => a + b, 0);
  const morph = props.styleMorph ? MORPH_SEC * REEL_FPS : 0;
  return scenes + morph + CTA_SEC * REEL_FPS;
}
export const BGM_SRC = 'reels/bgm.mp3';
```

- [ ] **Step 2: 커밋**

```bash
git add packages/remotion/src/data/storybook-reel.ts
git commit -m "feat(remotion): storybook reel props schema + frame math"
```

### Task 2: BGM 중립 경로 + 일반 컴포넌트 3종

**Files:**
- Create: `packages/remotion/public/reels/bgm.mp3` (copy)
- Create: `packages/remotion/src/components/reels/storybook/StoryScene.tsx`
- Create: `packages/remotion/src/components/reels/storybook/StyleShowcase.tsx`
- Create: `packages/remotion/src/components/reels/storybook/Closing.tsx`

- [ ] **Step 1: BGM 복사**

```bash
cp packages/remotion/public/reels/frog/bgm.mp3 packages/remotion/public/reels/bgm.mp3
```

- [ ] **Step 2: `StoryScene.tsx` 작성** — `FrogStoryScene.tsx`를 복사해 props화. 차이: `import` 데이터 제거, props `{ title, body, imageUrls, hero }` 사용(현재 frog 파일의 `title/body/images` → `title/body/imageUrls`). 이미지 로드 `staticFile(src)` → `src`(원격 URL 직접). 나머지 레이아웃/애니메이션 동일(브랜드칩 "탱고북 그림책", 카드형, IMG_H 860, 켄번즈, break-keep).

- [ ] **Step 3: `StyleShowcase.tsx` 작성** — `FrogStyleShowcase.tsx`를 복사해 props화. props `{ title, lines, styles }`(styles=`{url,label}[]`). `FROG_STYLE_SHOWCASE` import 제거, `styles[i].url`을 `<Img src>`로 직접. BEAT=`durationInFrames/styles.length`, 크로스페이드+줄쌓기 로직 동일.

- [ ] **Step 4: `Closing.tsx` 작성** — `FrogClosing.tsx` 복사(로고 카드). staticFile 로고는 그대로(`reels/logo/logo-kr.webp`). SparkleParticles 유지. 변경 없음.

- [ ] **Step 5: 타입체크**

Run: `pnpm --filter @tangobook/remotion typecheck`
Expected: PASS (아직 미사용 컴포넌트지만 타입 정상)

- [ ] **Step 6: 커밋**

```bash
git add packages/remotion/public/reels/bgm.mp3 packages/remotion/src/components/reels/storybook/
git commit -m "feat(remotion): prop-driven storybook reel scene components + neutral bgm"
```

### Task 3: `StorybookReel` 컴포지션 + Root 등록

**Files:**
- Create: `packages/remotion/src/compositions/StorybookReel.tsx`
- Modify: `packages/remotion/src/Root.tsx`

- [ ] **Step 1: 컴포지션 작성**

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile, interpolate } from 'remotion';
import { StoryScene } from '../components/reels/storybook/StoryScene';
import { StyleShowcase } from '../components/reels/storybook/StyleShowcase';
import { Closing } from '../components/reels/storybook/Closing';
import {
  StorybookReelProps, sceneDurations, MORPH_SEC, CTA_SEC,
  REEL_FPS, BGM_SRC, computeReelFrames,
} from '../data/storybook-reel';

export const StorybookReel: React.FC<StorybookReelProps> = (props) => {
  const total = computeReelFrames(props);
  const durs = sceneDurations(props);
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1310' }}>
      <Audio src={staticFile(BGM_SRC)} loop volume={(f) =>
        interpolate(f, [0, 15, total - 40, total], [0, 0.55, 0.55, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      <Series>
        {props.scenes.map((sc, i) => (
          <Series.Sequence key={i} durationInFrames={durs[i]}>
            <StoryScene title={sc.label} body={sc.body} imageUrls={sc.imageUrls} hero={i === 0} />
          </Series.Sequence>
        ))}
        {props.styleMorph && (
          <Series.Sequence durationInFrames={MORPH_SEC * REEL_FPS}>
            <StyleShowcase title="다양한 그림체로" lines={props.styleMorph.lines} styles={props.styleMorph.styles} />
          </Series.Sequence>
        )}
        <Series.Sequence durationInFrames={CTA_SEC * REEL_FPS}>
          <Closing />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Root 등록** — `Root.tsx`에 import + `<Composition id="StorybookReel" ...>` 추가. `defaultProps`는 개구리 왕자 R2 URL 세트(아래 값, 원격 로드 검증용), `calculateMetadata`로 duration 계산.

```tsx
// import
import { StorybookReel } from './compositions/StorybookReel';
import { StorybookReelPropsSchema, computeReelFrames, REEL_FPS, REEL_WIDTH, REEL_HEIGHT } from './data/storybook-reel';
// 개구리 왕자 defaultProps (R2 원격 URL, encodeURI 적용된 형태) — studio 미리보기 겸 원격 렌더 검증
const FROG_DEFAULT: import('./data/storybook-reel').StorybookReelProps = { /* 아래 Step 3 스크립트로 생성해 붙여넣기 */ } as any;
// <Composition>
<Composition
  id="StorybookReel"
  component={StorybookReel}
  schema={StorybookReelPropsSchema}
  defaultProps={FROG_DEFAULT}
  fps={REEL_FPS}
  width={REEL_WIDTH}
  height={REEL_HEIGHT}
  durationInFrames={1170}
  calculateMetadata={({ props }) => ({ durationInFrames: computeReelFrames(props as any) })}
/>
```

- [ ] **Step 3: 개구리 왕자 defaultProps 생성** — 임시 노드 스크립트로 R2에서 개구리 왕자(1772009873865) 책 JSON을 받아 훅/본문 3장면 이미지 URL + 모핑 3그림체 12페이지 URL을 encodeURI로 뽑아 `FROG_DEFAULT` 값에 붙여넣는다. (이 값이 Chunk 2 `buildReelProps` 출력과 동일 형태여야 함 — 수동 1회.)

- [ ] **Step 4: 타입체크 + 원격 렌더 스틸 검증**

Run:
```bash
pnpm --filter @tangobook/remotion typecheck
cd packages/remotion && npx remotion still StorybookReel out/sr-hook.png --frame=30 && npx remotion still StorybookReel out/sr-morph.png --frame=900
```
Expected: PASS + 두 스틸이 **R2 원격 삽화로** 정상 렌더(한글 URL이 encodeURI로 로드됨). 실패 시 spec 폴백(로컬 선다운로드)로 전환.

- [ ] **Step 5: 커밋**

```bash
git add packages/remotion/src/compositions/StorybookReel.tsx packages/remotion/src/Root.tsx
git commit -m "feat(remotion): StorybookReel composition (prop-driven, remote R2 images)"
```

---

## Chunk 2: `buildReelProps` 순수 빌더 (TDD)

목표: 책 JSON + 스토리보드 JSON + genreMap → `StorybookReelProps | null`. 순수 함수, vitest.

### Task 4: 헬퍼 — 첫 문장 트림 + 페이지 버킷 분배

**Files:**
- Create: `packages/server/src/services/reel/reel-props.ts`
- Create: `packages/server/src/services/reel/__tests__/reel-props.test.ts`

- [ ] **Step 1: 실패 테스트 작성 (`firstClause`, `splitIntoBuckets`)**

```ts
import { describe, it, expect } from 'vitest';
import { firstClause, splitIntoBuckets } from '../reel-props';

describe('firstClause', () => {
  it('첫 절을 자르고 최대 길이로 트림', () => {
    expect(firstClause('막내 공주가 황금 공을 연못에 빠뜨리자, 개구리가 친구가 되어 함께 지내겠다는 약속을 받고 공을 찾아 줍니다.', 24))
      .toBe('막내 공주가 황금 공을 연못에 빠뜨리자');
  });
  it('짧으면 그대로', () => {
    expect(firstClause('약속은 소중한 거야.', 40)).toBe('약속은 소중한 거야');
  });
});
describe('splitIntoBuckets', () => {
  it('n개 버킷에 순서대로 균등 분배(나머지는 앞쪽)', () => {
    expect(splitIntoBuckets([1,2,3,4,5,6,7], 3)).toEqual([[1,2,3],[4,5],[6,7]]);
  });
  it('개수<버킷이면 앞부터 채우고 빈 버킷 없음(최소1 보장)', () => {
    expect(splitIntoBuckets([1,2], 3)).toEqual([[1],[2],[]]); // 빈 버킷 허용 여부는 구현서 확정
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/reel/__tests__/reel-props.test.ts`
Expected: FAIL (모듈/함수 없음)

- [ ] **Step 3: 헬퍼 구현**

```ts
/** 첫 문장/절을 잘라 최대 길이로 트림(문장부호·쉼표 경계, 한글 안전). */
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

/** 정렬된 페이지 배열을 n개 버킷으로 순서 유지 균등 분배(앞쪽에 나머지). */
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
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/reel/__tests__/reel-props.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/server/src/services/reel/reel-props.ts packages/server/src/services/reel/__tests__/reel-props.test.ts
git commit -m "feat(server): reel-props helpers (firstClause, splitIntoBuckets) + tests"
```

### Task 5: `pickMorph` — 3그림체 최대 공통 페이지

**Files:**
- Modify: `packages/server/src/services/reel/reel-props.ts`
- Modify: `packages/server/src/services/reel/__tests__/reel-props.test.ts`

- [ ] **Step 1: 실패 테스트** — 입력: `styleAssets`(그림체별 pageIllustrations) + `genreMap`. 기대: 매핑된 그림체 3개(collage/watercolor/paper3d)에서 최대 공통 페이지 인덱스의 URL·라벨을 콜라주→수채→페이퍼3D 순서로. 그림체 2개 미만/공통없음 → null.

```ts
import { pickMorph } from '../reel-props';
const GENRE = { A: 'collage', B: 'watercolor', C: 'paper3d' };
const url = (s: string, p: number) => `https://r2/${s}-p${p}.webp`;
const sa = {
  A: { pageIllustrations: { '1': { illustrationUrl: url('A',1) }, '3': { illustrationUrl: url('A',3) } } },
  B: { pageIllustrations: { '1': { illustrationUrl: url('B',1) }, '3': { illustrationUrl: url('B',3) } } },
  C: { pageIllustrations: { '1': { illustrationUrl: url('C',1) }, '3': { illustrationUrl: url('C',3) } } },
};
it('최대 공통 페이지(3) × 3그림체, 순서 collage→watercolor→paper3d', () => {
  expect(pickMorph(sa as any, GENRE)).toEqual({
    lines: expect.any(Array),
    styles: [
      { url: url('A',3), label: '콜라주' },
      { url: url('B',3), label: '수채동화풍' },
      { url: url('C',3), label: '페이퍼 3D 아트' },
    ],
  });
});
it('그림체 1개면 null', () => { expect(pickMorph({ A: sa.A } as any, GENRE)).toBeNull(); });
```

- [ ] **Step 2: 실패 확인** → **Step 3: 구현**

```ts
const GENRE_LABEL: Record<string,string> = { collage:'콜라주', watercolor:'수채동화풍', paper3d:'페이퍼 3D 아트' };
const GENRE_ORDER = ['collage','watercolor','paper3d'];

export function pickMorph(styleAssets: any, genreMap: Record<string,string>) {
  const mapped = Object.keys(styleAssets)
    .map((sid) => ({ sid, genre: genreMap[sid] }))
    .filter((x) => GENRE_ORDER.includes(x.genre));
  if (mapped.length < 2) return null;
  const pagesOf = (sid: string) => new Set(
    Object.entries(styleAssets[sid].pageIllustrations || {})
      .filter(([, v]: any) => v?.illustrationUrl).map(([k]) => Number(k)));
  const common = mapped.map((m) => pagesOf(m.sid)).reduce((a, s) => new Set([...a].filter((x) => s.has(x))));
  if (common.size === 0) return null;
  const page = Math.max(...common);
  const ordered = mapped.slice().sort((a, b) => GENRE_ORDER.indexOf(a.genre) - GENRE_ORDER.indexOf(b.genre));
  return {
    lines: MORPH_LINES,
    styles: ordered.map((m) => ({
      url: encodeURI(styleAssets[m.sid].pageIllustrations[String(page)].illustrationUrl),
      label: GENRE_LABEL[m.genre],
    })),
  };
}
```
(상단에 `import { MORPH_LINES } from '...'` 대신 서버측 상수 중복 정의 — remotion 패키지 import 회피. `const MORPH_LINES = [...]` 를 reel-props.ts 에 둔다.)

- [ ] **Step 4: 통과 확인** → **Step 5: 커밋** (`feat(server): pickMorph deterministic max-common-page`)

### Task 6: `buildReelProps` 조립 + 가드

**Files:**
- Modify: `packages/server/src/services/reel/reel-props.ts`
- Modify: `packages/server/src/services/reel/__tests__/reel-props.test.ts`

- [ ] **Step 1: 실패 테스트** — 실제 개구리 왕자 축약 픽스처(storybook: artStyle + styleAssets[active].pageIllustrations 15p + coverImage; storyboard: 5 scenes). 기대: `scenes.length===4`(훅+본문3), 각 scene.imageUrls≥1(encodeURI된 URL), scene[0].imageUrls=[cover], **scene[0].label==='개구리 왕자'**(헤드라인=책 제목, 내부 라벨 "훅" 아님), scene[1].label==='원작·배경'(스토리보드 라벨), styleMorph.styles.length===3 + styleMorph.lines===MORPH_LINES, bookTitle==='개구리 왕자'. 그리고 스토리보드 4장면(비정상)이면 null.

- [ ] **Step 2: 실패 확인** → **Step 3: 구현**

```ts
export function buildReelProps({ storybook, storyboard, genreMap }: {
  storybook: any; storyboard: any; genreMap: Record<string,string>;
}) {
  const scenes = storyboard?.scenes;
  if (!Array.isArray(scenes) || scenes.length < 5) return null;
  const activeId = storybook.artStyle;
  const sa = storybook.styleAssets?.[activeId];
  const pi = sa?.pageIllustrations || {};
  const pages = Object.keys(pi).map(Number).filter((n) => pi[String(n)]?.illustrationUrl).sort((a,b)=>a-b);
  if (pages.length === 0) return null;
  const cover = encodeURI(sa.coverImage || storybook.coverImage || pi[String(pages[0])].illustrationUrl);
  const urlOf = (p: number) => encodeURI(pi[String(p)].illustrationUrl);

  // 훅 — 헤드라인은 책 제목(내부 라벨 "훅"이 아니라). 나머지 장면은 스토리보드 라벨.
  const bookTitle = storybook.title || storyboard.title || '';
  const out: any = { bookTitle, scenes: [], styleMorph: pickMorph(storybook.styleAssets || {}, genreMap) };
  out.scenes.push({ label: bookTitle, body: firstClause(scenes[0].narration || scenes[0].subtitle), imageUrls: [cover] });
  // 본문 3장면: pages를 3버킷
  const buckets = splitIntoBuckets(pages, 3);
  for (let i = 1; i <= 3; i++) {
    const bucket = buckets[i-1].length ? buckets[i-1] : pages; // 빈 버킷 폴백
    out.scenes.push({
      label: scenes[i].label,
      body: firstClause(scenes[i].narration || scenes[i].subtitle),
      imageUrls: bucket.map(urlOf),
    });
  }
  return out;
}
```

- [ ] **Step 4: 통과 확인** (전체 파일) → **Step 5: 커밋** (`feat(server): buildReelProps assemble + guards`)

---

## Chunk 3: 배치 러너 + 파일럿

목표: bundle→render→R2 업로드→Supabase 연결. 1권 full 검증 후 51권.

### Task 7: 데이터 소스 헬퍼 `reel-targets.ts`

**Files:**
- Create: `packages/server/src/services/reel/reel-targets.ts`

- [ ] **Step 1: 구현** — 순수 조회/로딩:
  - `resolveClassicBookIds(): string[]` — `scripts/_data/books-by-category.json` 읽어 `books.filter(category ~ /명작|세계/).map(id)` (51개). 경로는 `path.resolve(__dirname, ...)` 또는 process.cwd 기준 명시.
  - `fetchStorybook(id): Promise<any>` — `GET {R2_PUBLIC_URL}/storybook-{id}.json`(encodeURI). config.r2.publicUrl 사용.
  - `loadStoryboard(id): any | null` — `_data/marketing/storyboards/{id}.json` 존재 시 파싱, 없으면 null.
  - `loadGenreMap(): Promise<Record<string,string>>` — `GET {R2_PUBLIC_URL}/_index/style-genre-map.json`, 모듈 캐시.

- [ ] **Step 2: 스모크 확인**

Run: `pnpm --filter @tangobook/server exec tsx -e "import {resolveClassicBookIds,loadGenreMap} from './src/services/reel/reel-targets'; (async()=>{console.log((await resolveClassicBookIds()).length); console.log(Object.keys(await loadGenreMap()).length)})()"`
Expected: `51` + genreMap 키 수 출력

- [ ] **Step 3: 커밋** (`feat(server): reel-targets data source helpers`)

### Task 8: 발행 헬퍼 `reel-publish.ts`

**Files:**
- Create: `packages/server/src/services/reel/reel-publish.ts`

- [ ] **Step 1: 구현**
  - `uploadReelMp4(projectId, bookId, filePath): Promise<string>` — R2 provider(S3 client) `PutObjectCommand` key=`mkt/{projectId}/reels/{bookId}-{ts}.mp4`, ContentType `video/mp4`. return `{publicUrl}`. (기존 R2 provider/`buildR2Key` 패턴 참조.)
  - `resolveMarketingTarget(bookId): Promise<{contentId, projectId, igRow} | null>` — supabase-admin: `mkt_contents.select().eq('memo', 'storybook:'+bookId).maybeSingle()` → project_id, id. 그다음 `mkt_instagram_contents.select().eq('content_id', contentId)` → 첫 행(igRow) 또는 null.
  - `connectReelToMarketing({bookId, videoUrl, coverUrl, ownerUserId}): Promise<void>` — target resolve. igRow 있으면 `video_settings` 병합 update(`{...vs, reels: {...vs.reels, ko: {videoUrl, coverUrl}}}`). 없으면 insert(content_id, user_id=ownerUserId, video_settings). **두 번째 행 만들지 않기**(igRow 우선).
  - `resolveOwnerUserId(email): Promise<string>` — supabase-admin `auth.admin.listUsers` 또는 rpc로 email→id(다른 seed 스크립트 방식 재사용).

- [ ] **Step 2: 타입체크** `pnpm --filter @tangobook/server typecheck` → PASS
- [ ] **Step 3: 커밋** (`feat(server): reel-publish (R2 upload + marketing row connect)`)

### Task 9: 배치 오케스트레이터 `render-book-reels.ts`

**Files:**
- Create: `packages/server/scripts/render-book-reels.ts`

- [ ] **Step 1: 구현**
  - **env 로딩**: 파일 최상단 `import 'dotenv/config'`(또는 server config import)로 `packages/server/.env`의
    `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`·R2 크리덴셜 로드(getSupabaseAdmin/R2 provider가 process.env 사용).
  - args 파싱: `--book`, `--limit`, `--dry-run`, `--owner-email`(**기본 `kil210@gmail.com`** — 마케팅
    프로젝트 `탱고북 동화책` 소유자, seed-marketing-cardnews.mjs와 동일 기본값), `--category`(기본 classics).
  - bootstrap: `bundle({ entryPoint })` 1회 → serveUrl. entryPoint는 **명시 경로**: `pnpm --filter @tangobook/server exec tsx`는 cwd=`packages/server`라 `path.resolve(process.cwd(), '../remotion/src/entry.ts')`. (audiobook.service는 `src/services`의 `__dirname` 기준이라 그 리터럴을 그대로 복사하면 안 됨.)
  - 대상 id 목록: `--book` 있으면 그것만, 아니면 `resolveClassicBookIds()` (+`--limit`).
  - `loadGenreMap()` 1회.
  - ownerUserId = `resolveOwnerUserId(--owner-email)` (dry-run이면 skip).
  - 각 id: `fetchStorybook` + `loadStoryboard` → `buildReelProps`. null이면 skip+log.
    - `selectComposition({serveUrl, id:'StorybookReel', inputProps})` → `renderMedia({composition, serveUrl, inputProps, codec:'h264', imageFormat:'png', outputLocation: tmp, timeoutInMilliseconds:60000, chromiumOptions:{gl:'angle', headless:true}})`.
      - ⚠️ 옵션명은 **`timeoutInMilliseconds`**(존재하지 않는 `delayRenderTimeoutInMilliseconds` 아님). 원격 R2 이미지 로딩 지연 대비. `selectComposition`에도 `timeoutInMilliseconds:60000` 전달. `chromiumOptions.gl:'angle'`은 audiobook.service와 동일(헤드리스 안정성).
    - `--dry-run`: mp4를 로컬 `out/reels/{id}.mp4`에만 두고 R2/DB skip. props 요약(장면수·모핑유무·타깃 resolve 결과) 출력.
    - 실제: `uploadReelMp4` → coverUrl=책 표지 R2 URL(encodeURI) → `connectReelToMarketing`.
  - try/catch per book(실패 기록·계속). 끝에 요약(성공·스킵·실패·모핑 유무 카운트).

- [ ] **Step 2: 1권 dry-run**

Run: `pnpm --filter @tangobook/server exec tsx scripts/render-book-reels.ts --book=1772009873865 --dry-run`
Expected: `out/reels/1772009873865.mp4` 생성 + 로그(장면 4, 모핑 있음). ffprobe로 39~40s·h264+aac 확인. 육안 확인.

- [ ] **Step 3: 커밋** (`feat(server): render-book-reels batch orchestrator`)

### Task 10: 1권 full 파이프라인 검증

- [ ] **Step 1: 개구리 왕자 1권 실제 실행**

Run: `pnpm --filter @tangobook/server exec tsx scripts/render-book-reels.ts --book=1772009873865` (owner 기본 kil210@gmail.com)
Expected: R2 업로드 성공(mp4 publicUrl 200) + Supabase `mkt_instagram_contents.video_settings.reels.ko` 기록.

- [ ] **Step 2: 마케팅 페이지 확인** — `/marketing` → 개구리 왕자 콘텐츠 → 릴스 탭 🎬 영상 제작에서 mp4·커버 노출 확인. (preview 도구 또는 사용자 확인.)

- [ ] **Step 3: 문제 시 수정** — 연결/경로/RLS 이슈 디버그(spec 에러 처리 참조).

### Task 11: 명작 51권 배치

- [ ] **Step 1: 배치 실행(백그라운드)**

Run: `pnpm --filter @tangobook/server exec tsx scripts/render-book-reels.ts` (owner 기본 kil210@gmail.com)
Expected: ~1.5–2h. 요약: 성공 N·스킵·실패·모핑 유무.

- [ ] **Step 2: 스팟 체크** — 마케팅 페이지에서 3~5권 릴스 육안 확인(자막·모핑·품질). 자막 밋밋하면 `firstClause`/장면 매핑 규칙 개선 후 재렌더(멱등: 같은 key 덮어쓰기).

- [ ] **Step 3: 요약 커밋/기록** — 결과 요약을 커밋 메시지/메모리에 기록. (mp4는 R2, git 미포함.)

---

## 검증 체크리스트(완료 기준)

- `StorybookReel` 스틸 2컷이 R2 원격 삽화로 렌더됨(한글 URL encodeURI).
- `reel-props.test.ts` 전부 PASS(firstClause/splitIntoBuckets/pickMorph/buildReelProps).
- 1권 full: R2 mp4 200 + 마케팅 릴스 탭 노출.
- 51권 배치 요약에 실패 0(또는 실패 사유 기록·재시도).
- 회귀: 기존 `FrogPrinceReel` 렌더 정상(보존됨).
