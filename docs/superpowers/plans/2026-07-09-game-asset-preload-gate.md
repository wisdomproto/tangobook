# 동화게임 자산 프리로드 로딩 게이트 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동화게임 진입 시 핵심 자산(단어 이미지·정답 TTS·음절 mp3)이 준비될 때까지 진행률바를 보여주고, 준비되면 게임을 시작한다. 장면 리빌 자산은 백그라운드로 워밍한다.

**Architecture:** 자산 URL 수집을 `GameOverlay` 한 곳에 모은다. 순수 동기 수집(`collect-game-assets.ts`) + 비동기 TTS 수집을 조합한 `useGameAssetPreload` 훅이 core 자산 워밍 완료(`ready`)를 게이트로 노출하고, `GameLoadingGate`가 진행률바를 그린다. 게임 플레이어는 "준비된 데이터만 받는다"는 계약을 갖고, 내부의 fire-and-forget 프리페치는 제거한다.

**Tech Stack:** React 18 + TypeScript + Vite + TanStack Query + vitest. 기존 워밍 유틸(`warmAudioUrl`, `usePhonicsMap`, `resolveTtsUrl`, `resolveSceneFromWord`) 재사용.

**Status:** ✅ 구현 완료 (main 병합). 전 태스크 TDD 구현 + 스펙/품질 리뷰 + preview 런타임 검증. 실측으로 버그 2건 추가 수정(getGameData shuffle→게이트 무한멈춤 memo fix, 6초 상한 콜드 concat 미적용 fix). 상세 memory `game-asset-preload-gate-2026-07-09`.

**Spec:** `docs/superpowers/specs/2026-07-09-game-asset-preload-gate-design.md`

---

## File Structure

**신규**
- `packages/client/src/features/games/lib/collect-game-assets.ts` — 게임 데이터에서 자산 URL을 뽑는 순수/준순수 함수 모음.
- `packages/client/src/features/games/lib/collect-game-assets.test.ts` — 단위 테스트.
- `packages/client/src/features/games/hooks/useGameAssetPreload.ts` — 워밍 실행 + 진행률 + 생명주기 훅.
- `packages/client/src/features/games/hooks/useGameAssetPreload.test.ts` — 단위 테스트.
- `packages/client/src/features/games/components/GameLoadingGate.tsx` — 진행률바 UI.

**수정**
- `packages/client/src/features/games/hooks/useGamePrefetch.ts` — `warmAudioUrl` export + `warmImageUrl` 신규 export.
- `packages/client/src/features/vocabulary-unit/components/VocabularyStudyContent.tsx` — `GameOverlay`에 프리로드 게이트 통합.
- 플레이어 6종(`KoreanBlockPlayer`, `EnglishBlockPlayer`, `Korean/EnglishWordWritingPlayer`, `LineMatchingPlayer`, `ConnectTheDotsPlayer`) — 중복 프리페치 호출 제거.

**참조(수정 안 함)**
- `game-data-adapter.ts` — `getGameData` 반환 union 구조(각 게임 `items[].imageUrl`, 점잇기 `originalImageUrl`, `items[].word`/`objectName`).
- `resolve-scene.ts` — `resolveSceneFromWord(word, lang, storybook?, style?): WordScene | null` (동기).
- `resolveTtsUrl.ts` — `resolveTtsUrl({text, language, storybookId?, directUrl?, identifierPrefix?}): Promise<string|undefined>`.

---

## Chunk 1: 워밍 유틸 export + 자산 수집 순수 로직

### Task 1: `warmAudioUrl` export + `warmImageUrl` 신규

**Files:**
- Modify: `packages/client/src/features/games/hooks/useGamePrefetch.ts:53`

- [ ] **Step 1: `warmAudioUrl`을 export로 변경**

`useGamePrefetch.ts:53`의 `function warmAudioUrl` 앞에 `export`를 붙인다.

```ts
export function warmAudioUrl(url: string): Promise<void> {
```

- [ ] **Step 2: `warmImageUrl` 추가**

같은 파일에 이미지 디코드 완료를 기다리는 유틸을 추가한다(완료 신호가 있어야 진행률 카운트 가능). `warmAudioUrl` 바로 아래에 삽입:

```ts
/**
 * 이미지 URL 을 디코드 완료까지 워밍. 진행률 카운트를 위해 완료를 Promise 로 반환.
 * onload/onerror 둘 다 resolve(막지 않음) + 4초 상한.
 */
export function warmImageUrl(url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!url) return resolve();
    try {
      const img = new Image();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      img.onload = finish;
      img.onerror = finish;
      setTimeout(finish, 4000);
      img.src = url;
    } catch {
      resolve();
    }
  });
}
```

- [ ] **Step 3: typecheck**

Run: `pnpm --filter client exec tsc --noEmit`
Expected: 에러 없음(기존 `usePreloadImages`는 그대로 두므로 회귀 없음).

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/games/hooks/useGamePrefetch.ts
git commit -m "feat(games): export warmAudioUrl + add warmImageUrl for preload gate"
```

### Task 2: 게임 데이터에서 이미지·단어 추출

**Files:**
- Create: `packages/client/src/features/games/lib/collect-game-assets.ts`
- Test: `packages/client/src/features/games/lib/collect-game-assets.test.ts`

게임 데이터 union은 각 게임별 `items[]`를 갖는다: 블록/따라쓰기/그림짝은 `{ word, imageUrl }`, 점잇기는 `{ objectName, originalImageUrl }`. 이걸 게임 무관하게 뽑는다.

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { extractItemImages, extractItemWords } from './collect-game-assets';

const blockData = { type: 'korean-block', items: [
  { word: '나무', imageUrl: 'https://r2/a.webp' },
  { word: '숲', imageUrl: 'https://r2/b.webp' },
] } as any;
const dotsData = { type: 'connect-the-dots', items: [
  { objectName: 'tree', originalImageUrl: 'https://r2/c.webp' },
] } as any;

describe('extractItemImages', () => {
  it('블록 데이터에서 imageUrl 수집', () => {
    expect(extractItemImages(blockData)).toEqual(['https://r2/a.webp', 'https://r2/b.webp']);
  });
  it('점잇기는 originalImageUrl 수집', () => {
    expect(extractItemImages(dotsData)).toEqual(['https://r2/c.webp']);
  });
  it('빈 URL 은 제외', () => {
    expect(extractItemImages({ type: 'korean-block', items: [{ word: 'x', imageUrl: '' }] } as any)).toEqual([]);
  });
});

describe('extractItemWords', () => {
  it('블록 데이터에서 word 수집', () => {
    expect(extractItemWords(blockData)).toEqual(['나무', '숲']);
  });
  it('점잇기는 objectName 수집', () => {
    expect(extractItemWords(dotsData)).toEqual(['tree']);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter client test src/features/games/lib/collect-game-assets.test.ts`
Expected: FAIL — 모듈/함수 없음.

- [ ] **Step 3: 구현**

```ts
import type { Lang, Storybook } from '@tangobook/shared';

/** getGameData 반환 union — 게임별 items 형태만 최소로 안다. */
type AnyGameData = { type: string; items?: Array<Record<string, unknown>> };

/** 게임 데이터의 모든 아이템 이미지 URL (점잇기는 originalImageUrl). 빈 값 제외. */
export function extractItemImages(data: AnyGameData): string[] {
  const out: string[] = [];
  for (const it of data.items ?? []) {
    const url = (it.imageUrl as string) || (it.originalImageUrl as string);
    if (url) out.push(url);
  }
  return out;
}

/** 게임 데이터의 모든 아이템 단어 (점잇기는 objectName). 빈 값 제외. */
export function extractItemWords(data: AnyGameData): string[] {
  const out: string[] = [];
  for (const it of data.items ?? []) {
    const w = (it.word as string) || (it.objectName as string);
    if (w) out.push(w);
  }
  return out;
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter client test src/features/games/lib/collect-game-assets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/lib/collect-game-assets.ts packages/client/src/features/games/lib/collect-game-assets.test.ts
git commit -m "feat(games): extract image/word URLs from game data"
```

### Task 3: 한글 음절 URL 수집

**Files:**
- Modify: `packages/client/src/features/games/lib/collect-game-assets.ts`
- Test: `packages/client/src/features/games/lib/collect-game-assets.test.ts`

원본 로직: `KoreanBlockPlayer.tsx:280-293` — 각 단어의 각 한글 음절(가-힣)을 phonics 맵에서 lookup, 중복 제거.

- [ ] **Step 1: 실패 테스트 추가**

```ts
import { collectSyllableUrls } from './collect-game-assets';

describe('collectSyllableUrls', () => {
  const map = new Map<string, string>([['나', 'u-na'], ['무', 'u-mu'], ['숲', 'u-sup']]);
  it('한글 음절만 맵에서 URL 수집, 중복 제거', () => {
    expect(collectSyllableUrls(['나무', '숲'], map).sort()).toEqual(['u-mu', 'u-na', 'u-sup']);
  });
  it('맵에 없는 음절은 건너뜀', () => {
    expect(collectSyllableUrls(['가'], map)).toEqual([]);
  });
  it('영어 단어는 무시', () => {
    expect(collectSyllableUrls(['tree'], map)).toEqual([]);
  });
  it('맵이 null 이면 빈 배열', () => {
    expect(collectSyllableUrls(['나무'], null)).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter client test src/features/games/lib/collect-game-assets.test.ts`
Expected: FAIL — `collectSyllableUrls` 없음.

- [ ] **Step 3: 구현 추가**

```ts
/**
 * 단어들의 한글 음절(가-힣)을 phonics 맵에서 lookup. 중복 제거.
 * map 은 usePhonicsMap 의 mapRef.current (미로드 시 null → 빈 배열).
 * 원본: KoreanBlockPlayer 의 syllableUrls useMemo.
 */
export function collectSyllableUrls(words: string[], map: Map<string, string> | null): string[] {
  if (!map) return [];
  const urls = new Set<string>();
  for (const w of words) {
    for (const ch of [...(w ?? '')]) {
      if (/[가-힣]/.test(ch)) {
        const u = map.get(ch);
        if (u) urls.add(u);
      }
    }
  }
  return [...urls];
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter client test src/features/games/lib/collect-game-assets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(games): collect korean syllable mp3 URLs for preload"
```

### Task 4: 장면(SceneReveal) 자산 수집 — 블록 게임 한정

**Files:**
- Modify: `packages/client/src/features/games/lib/collect-game-assets.ts`
- Test: `packages/client/src/features/games/lib/collect-game-assets.test.ts`

`resolveSceneFromWord`는 동기. 블록 게임(`korean-block`/`english-block`)만 장면을 띄우므로 그때만 수집.

- [ ] **Step 1: 실패 테스트 추가**

```ts
import { collectSceneAssets } from './collect-game-assets';

const book = {
  key_objects: [{ name: '나무', korean: '나무', pages: [1] }],
  pages: [{ pageNumber: 1, text: '나무가 있다', illustrationUrl: 'https://r2/scene1.webp', ttsUrl: 'https://r2/narr1.mp3' }],
} as any;

describe('collectSceneAssets', () => {
  it('블록 게임: 단어별 장면 삽화+나레이션 수집', () => {
    const r = collectSceneAssets(['나무'], 'ko', book, undefined, 'korean-block');
    expect(r.sceneImages).toEqual(['https://r2/scene1.webp']);
    expect(r.sceneNarrations).toEqual(['https://r2/narr1.mp3']);
  });
  it('비블록 게임은 빈 결과', () => {
    const r = collectSceneAssets(['나무'], 'ko', book, undefined, 'connect-the-dots');
    expect(r.sceneImages).toEqual([]);
    expect(r.sceneNarrations).toEqual([]);
  });
  it('book 없으면 빈 결과', () => {
    const r = collectSceneAssets(['나무'], 'ko', undefined, undefined, 'korean-block');
    expect(r.sceneImages).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter client test src/features/games/lib/collect-game-assets.test.ts`
Expected: FAIL — `collectSceneAssets` 없음.

- [ ] **Step 3: 구현 추가**

```ts
import { resolveSceneFromWord } from './resolve-scene';

const SCENE_GAMES = new Set(['korean-block', 'english-block']);

/**
 * 블록 게임 한정: 각 단어의 SceneReveal 삽화 + 나레이션 URL 수집.
 * resolveSceneFromWord 는 동기. book 없거나 비블록 게임이면 빈 결과.
 */
export function collectSceneAssets(
  words: string[],
  lang: Lang,
  book: Storybook | undefined,
  style: string | undefined,
  game: string
): { sceneImages: string[]; sceneNarrations: string[] } {
  const sceneImages: string[] = [];
  const sceneNarrations: string[] = [];
  if (!book || !SCENE_GAMES.has(game)) return { sceneImages, sceneNarrations };
  for (const w of words) {
    const scene = resolveSceneFromWord(w, lang, book, style);
    if (scene?.illustrationUrl) sceneImages.push(scene.illustrationUrl);
    if (scene?.pageTtsUrl) sceneNarrations.push(scene.pageTtsUrl);
  }
  return { sceneImages, sceneNarrations };
}
```

주의: `resolve-scene.ts`의 import 경로는 `./resolve-scene` (같은 `lib/` 폴더).

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter client test src/features/games/lib/collect-game-assets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(games): collect scene reveal assets for block games"
```

---

## Chunk 2: TTS 아이템 매핑 (비동기 수집 준비)

### Task 5: 게임별 TTS 프리워밍 아이템 빌더

**Files:**
- Modify: `packages/client/src/features/games/lib/collect-game-assets.ts`
- Test: `packages/client/src/features/games/lib/collect-game-assets.test.ts`

각 게임의 정답 TTS는 `resolveTtsUrl({text, language, storybookId, directUrl, identifierPrefix})`로 resolve된다. **확인된 사실**(원본 대조 완료):
- 게임 data items 는 `ttsUrl` 필드를 갖는다(`game-data-adapter.ts:61,85,104,152` — `...(tts ? { ttsUrl: tts } : {})`).
- 각 플레이어 prewarmItems = `items.map(it => ({ text: it.word, directUrl: it.ttsUrl }))` (블록×2·따라쓰기×2). `text`는 이미 lang 반영된 단어(`game-data-adapter`가 ko면 korean 단어를 `word`에 넣음).
- `identifierPrefix`: `kblock`/`eblock`/`wwrite-ko`/`wwrite-en`.

🔴 **반드시 `directUrl: it.ttsUrl`을 실어야 한다.** `resolveTtsUrl`은 **영어일 때 directUrl 우선**(`resolveTtsUrl.ts:59`)이라, directUrl을 빼면 프리워밍이 런타임과 **다른 URL**을 데워 첫 발음이 여전히 늦다(이 기능의 목적 실패).

🔴 **점잇기(connect-the-dots)와 LineMatching은 `buildTtsSpec` 대상 아님(null 반환).**
- 점잇기: 런타임에 target을 resolve하고 KeyObject에서 directUrl을 찾으므로(`ConnectTheDotsPlayer:102-118`) 게이트가 정확히 못 만든다 → 플레이어의 런타임 `usePrewarmWordTts('dot')`를 **유지**(Task 9). spec §9 준수.
- LineMatching: 음절 직접 재생(TTS concat 미사용).

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { buildTtsSpec } from './collect-game-assets';

describe('buildTtsSpec', () => {
  it('korean-block: language=korean, prefix=kblock, text+directUrl', () => {
    const spec = buildTtsSpec(
      { type: 'korean-block', items: [{ word: '나무', ttsUrl: 'https://r2/na.mp3' }] } as any,
      'korean-block'
    );
    expect(spec?.language).toBe('korean');
    expect(spec?.identifierPrefix).toBe('kblock');
    expect(spec?.items).toEqual([{ text: '나무', directUrl: 'https://r2/na.mp3' }]);
  });
  it('english-block: prefix=eblock, directUrl 포함', () => {
    const spec = buildTtsSpec(
      { type: 'english-block', items: [{ word: 'tree', ttsUrl: 'https://r2/t.mp3' }] } as any,
      'english-block'
    );
    expect(spec?.identifierPrefix).toBe('eblock');
    expect(spec?.items[0].directUrl).toBe('https://r2/t.mp3');
  });
  it('ttsUrl 없어도 text 는 수집(directUrl undefined)', () => {
    const spec = buildTtsSpec({ type: 'korean-block', items: [{ word: '숲' }] } as any, 'korean-block');
    expect(spec?.items).toEqual([{ text: '숲', directUrl: undefined }]);
  });
  it('line-matching / connect-the-dots 는 대상 아님(null)', () => {
    expect(buildTtsSpec({ type: 'korean-line-matching', items: [] } as any, 'korean-line-matching')).toBeNull();
    expect(buildTtsSpec({ type: 'connect-the-dots', items: [{ objectName: 'x' }] } as any, 'connect-the-dots')).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter client test src/features/games/lib/collect-game-assets.test.ts`
Expected: FAIL — `buildTtsSpec` 없음.

- [ ] **Step 3: 구현 추가**

```ts
export interface TtsSpec {
  items: Array<{ text: string; directUrl?: string }>;
  language: 'korean' | 'english';
  identifierPrefix: string;
}

// 점잇기/LineMatching 은 제외 — 점잇기는 런타임 target resolve(플레이어 프리워밍 유지),
// LineMatching 은 음절 직접 재생(concat 미사용).
const TTS_PREFIX: Record<string, { prefix: string; language: 'korean' | 'english' }> = {
  'korean-block': { prefix: 'kblock', language: 'korean' },
  'english-block': { prefix: 'eblock', language: 'english' },
  'korean-word-writing': { prefix: 'wwrite-ko', language: 'korean' },
  'english-word-writing': { prefix: 'wwrite-en', language: 'english' },
};

/**
 * 게임별 정답 TTS 프리워밍 스펙. 대상 아닌 게임은 null.
 * text/directUrl 은 각 플레이어의 prewarmItems(= { text: it.word, directUrl: it.ttsUrl })와 동일.
 * ⚠️ directUrl 을 빼면 영어 프리워밍이 런타임과 다른 URL 을 데운다 — 반드시 포함.
 */
export function buildTtsSpec(data: AnyGameData, game: string): TtsSpec | null {
  const cfg = TTS_PREFIX[game];
  if (!cfg) return null;
  const items = (data.items ?? [])
    .map((it) => ({ text: (it.word as string) ?? '', directUrl: it.ttsUrl as string | undefined }))
    .filter((i) => !!i.text);
  if (items.length === 0) return null;
  return { items, language: cfg.language, identifierPrefix: cfg.prefix };
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter client test src/features/games/lib/collect-game-assets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(games): build per-game TTS prewarm spec"
```

---

## Chunk 3: `useGameAssetPreload` 훅

### Task 6: 프리로드 훅 — 진행률 + 게이트 + 생명주기

**Files:**
- Create: `packages/client/src/features/games/hooks/useGameAssetPreload.ts`
- Test: `packages/client/src/features/games/hooks/useGameAssetPreload.test.ts`

훅 책임: (1) core URL(이미지+음절+TTS) 확정, (2) `warmImageUrl`/`warmAudioUrl`로 워밍하며 완료 카운트, (3) `{ ready, loaded, total }` 반환, (4) bg(장면) 워밍은 게이트와 무관, (5) 언마운트/게임 전환 시 취소.

🔴 **`storybookId`는 인자로 받는다(= `effectiveStorybookId`, 동기).** `book?.id`는 `useStorybook`이 비동기라 초기 `undefined` → `resolveTtsUrl`의 concat이 `if(!storybookId) return undefined`로 조기 반환되어 한글 프리워밍이 아예 안 된다(`resolveTtsUrl.ts:37`). 런타임 플레이어가 쓰는 `effectiveStorybookId = unit.storybookId ?? \`vocab-${unit.id}\``와 정확히 같은 값을 써야 concat 캐시 키가 맞는다. 이 값은 `coreKey`에도 포함(book 로드 타이밍과 무관하게 즉시 확정되므로 재실행 이슈 없음).

참고(phonics ref stale 안전 근거): `phonicsMap`은 `mapRef.current`를 렌더 시점에 읽지만, cache-miss 경로에서 `loading:false` 전이가 re-render를 유발하고 그때 `mapRef.current`가 populated된 Map으로 재할당돼 있어 `syllables` useMemo가 재계산된다. cache-hit 경로는 초기 렌더에서 이미 채워짐.

- [ ] **Step 1: 실패 테스트 작성**

`warmImageUrl`/`warmAudioUrl`/`resolveTtsUrl`을 vi.mock으로 즉시 resolve하게 모킹하고, fake timer로 `ready` 전환·`total` 카운트를 검증.

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./useGamePrefetch', () => ({
  warmImageUrl: vi.fn(() => Promise.resolve()),
  warmAudioUrl: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/features/tts', () => ({
  resolveTtsUrl: vi.fn(() => Promise.resolve('https://r2/tts.mp3')),
}));

import { useGameAssetPreload } from './useGameAssetPreload';

const blockData = { type: 'korean-block', items: [{ word: '나무', imageUrl: 'https://r2/a.webp' }] } as any;

describe('useGameAssetPreload', () => {
  it('core 자산 워밍 완료 시 ready=true, loaded===total', async () => {
    const { result } = renderHook(() =>
      useGameAssetPreload({
        data: blockData, game: 'korean-block', lang: 'ko',
        book: undefined, phonicsMap: new Map([['나', 'u-na'], ['무', 'u-mu']]), phonicsReady: true, style: undefined, storybookId: 'book-1',
      })
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.total).toBeGreaterThan(0);
    expect(result.current.loaded).toBe(result.current.total);
  });

  it('phonicsReady=false 면 음절은 total 에서 제외(맵 대기)', async () => {
    const { result } = renderHook(() =>
      useGameAssetPreload({
        data: blockData, game: 'korean-block', lang: 'ko',
        book: undefined, phonicsMap: null, phonicsReady: false, style: undefined, storybookId: 'book-1',
      })
    );
    // 이미지 1 + TTS 1 = 2 (음절 0), phonics 미준비라 아직 ready 아님
    await waitFor(() => expect(result.current.ready).toBe(false));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter client test src/features/games/hooks/useGameAssetPreload.test.ts`
Expected: FAIL — 훅 없음.

- [ ] **Step 3: 구현**

```ts
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Lang, Storybook, GameTypeId } from '@tangobook/shared';
import { resolveTtsUrl } from '@/features/tts';
import { warmImageUrl, warmAudioUrl } from './useGamePrefetch';
import {
  extractItemImages,
  extractItemWords,
  collectSyllableUrls,
  collectSceneAssets,
  buildTtsSpec,
} from '../lib/collect-game-assets';

const PRELOAD_MAX_MS = 6000;

interface Args {
  data: { type: string; items?: Array<Record<string, unknown>> };
  game: GameTypeId;
  lang: Lang;
  book: Storybook | undefined;
  phonicsMap: Map<string, string> | null;
  phonicsReady: boolean;
  style: string | undefined;
  storybookId: string; // effectiveStorybookId (동기, concat 캐시 키)
}

export function useGameAssetPreload(args: Args): { ready: boolean; loaded: number; total: number } {
  const { data, game, lang, book, phonicsMap, phonicsReady, style, storybookId } = args;

  // 동기 수집 (phonics 맵 준비 전엔 음절 빈 배열)
  const images = useMemo(() => extractItemImages(data), [data]);
  const words = useMemo(() => extractItemWords(data), [data]);
  const syllables = useMemo(
    () => (phonicsReady ? collectSyllableUrls(words, phonicsMap) : []),
    [phonicsReady, words, phonicsMap]
  );
  const scene = useMemo(
    () => collectSceneAssets(words, lang, book, style, game),
    [words, lang, book, style, game]
  );
  const ttsSpec = useMemo(() => buildTtsSpec(data, game), [data, game]);

  // 진행률 상태
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);

  // core 워밍 재실행 키 — 음절(phonicsReady 전이)·TTS(storybookId)까지 반영.
  const coreKey = [
    ...images,
    ...syllables,
    ttsSpec ? `${ttsSpec.identifierPrefix}:${ttsSpec.items.length}` : '',
    storybookId,
    phonicsReady,
  ].join('|');
  const bgKey = [...scene.sceneImages, ...scene.sceneNarrations].join('|');

  useEffect(() => {
    if (!phonicsReady) {
      // phonics 맵 로딩 중 — 음절 미확정이라 게이트 유지, 맵 준비되면 coreKey 변해 재실행.
      setReady(false);
      return;
    }
    let alive = true;
    setLoaded(0);
    setReady(false);

    void (async () => {
      // 이미지·음절은 즉시 URL. TTS 는 resolve 후 core 에 합류.
      const resolvedTts = ttsSpec
        ? (
            await Promise.all(
              ttsSpec.items.map((it) =>
                resolveTtsUrl({
                  text: it.text,
                  language: ttsSpec.language,
                  storybookId,
                  directUrl: it.directUrl,
                  identifierPrefix: ttsSpec.identifierPrefix,
                }).catch(() => undefined)
              )
            )
          ).filter((u): u is string => !!u)
        : [];
      if (!alive) return;

      const coreAudio = [...syllables, ...resolvedTts];
      const coreTotal = images.length + coreAudio.length;
      setTotal(coreTotal);
      if (coreTotal === 0) {
        setReady(true);
        return;
      }

      const cap = setTimeout(() => {
        if (alive) setReady(true);
      }, PRELOAD_MAX_MS);
      const bump = () => {
        if (alive) setLoaded((n) => n + 1);
      };
      await Promise.all([
        ...images.map((u) => warmImageUrl(u).then(bump)),
        ...coreAudio.map((u) => warmAudioUrl(u).then(bump)),
      ]);
      if (alive) {
        clearTimeout(cap);
        setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [coreKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 배경(장면) 워밍 — ready 와 무관, 조용히. 완료는 항상 resolve(막지 않음).
  useEffect(() => {
    for (const u of scene.sceneImages) void warmImageUrl(u);
    for (const u of scene.sceneNarrations) void warmAudioUrl(u);
  }, [bgKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ready, loaded, total };
}
```

⚠️ **eslint 주의**: 이 저장소는 pre-commit 에서 미사용 변수와 `react-hooks/exhaustive-deps` **disable 주석**이 에러가 될 수 있다(memory `library-payment-vocabgame-2026-07-08`). 구현 시:
- 위 스켈레톤에 **미사용 변수·빈 블록이 없도록** 유지(데드코드 금지).
- `coreKey`/`bgKey` 문자열 deps 패턴이 disable 주석 없이 lint를 통과하는지 확인. 통과 안 되면 `eslint-disable-line`이 허용되는지 프로젝트 설정을 보고, 안 되면 원시 deps를 명시적으로 나열하는 방식으로 바꾼다. **커밋 전 `pnpm --filter client lint` 필수.**

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter client test src/features/games/hooks/useGameAssetPreload.test.ts`
Expected: PASS.

- [ ] **Step 5: 상한 타이머 + 실패 카운트 테스트 추가**

느린/실패 자산도 `loaded`로 세어 게이트를 막지 않는지 fake timer로 검증(개별 워밍이 reject해도 `.then(bump)` 대신 완료 처리되도록 `warmImageUrl`/`warmAudioUrl`은 항상 resolve — Task 1에서 보장). 6초 상한 후 `ready=true`.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/games/hooks/useGameAssetPreload.ts packages/client/src/features/games/hooks/useGameAssetPreload.test.ts
git commit -m "feat(games): useGameAssetPreload hook with progress gate"
```

---

## Chunk 4: 로딩 UI + 통합 + 플레이어 정리

### Task 7: `GameLoadingGate` UI

**Files:**
- Create: `packages/client/src/features/games/components/GameLoadingGate.tsx`

- [ ] **Step 1: 구현 (250ms 지연 표시 + 진행률바 + 바로 시작)**

```tsx
import { useEffect, useState } from 'react';

/**
 * 게임 자산 프리로드 진행률바. 250ms 안에 준비되면(대부분 캐시 hit) 아무것도 안 그림.
 * 유아 대상 톤, 마스코트 없음. onSkip = 즉시 시작(상한 대기 회피).
 */
export function GameLoadingGate({
  loaded,
  total,
  onSkip,
}: {
  loaded: number;
  total: number;
  onSkip: () => void;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-[60] bg-cream-50 flex flex-col items-center justify-center gap-6 p-8">
      <p className="text-2xl font-black text-ink-900 font-display break-keep text-center">
        그림과 소리를 준비하고 있어요
      </p>
      <div className="w-full max-w-sm h-5 rounded-full bg-peach-200 overflow-hidden">
        <div
          className="h-full bg-coral-500 transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-lg font-black text-ink-500 tabular-nums">{pct}%</p>
      <button
        onClick={onSkip}
        className="mt-2 px-8 py-3 rounded-full bg-amber-500 text-white font-black shadow-pop text-lg"
      >
        바로 시작
      </button>
    </div>
  );
}
```

색 토큰은 게임 모듈 컨벤션(coral/peach/ink/amber, `break-keep`, `tabular-nums`) 준수(features/games/CLAUDE.md).

- [ ] **Step 2: typecheck**

Run: `pnpm --filter client exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/games/components/GameLoadingGate.tsx
git commit -m "feat(games): GameLoadingGate progress bar UI"
```

### Task 8: `GameOverlay` 통합

**Files:**
- Modify: `packages/client/src/features/vocabulary-unit/components/VocabularyStudyContent.tsx:336-442`

- [ ] **Step 0: GameOverlay props에 `storybook`·`currentStyle` 추가 스레딩**

`VocabularyStudyContent`는 이미 `storybook`·`currentStyle`을 props로 받는다(`VocabularyStudyContent.tsx:36-38, 53-54`). 하지만 `<GameOverlay>` 호출부(`:113-122`)는 `unit/game/lang/onComplete/onBack`만 넘긴다. → **GameOverlay props에 `storybook?: Storybook`·`currentStyle?: string`을 추가**하고 호출부에서 내려준다. `useStorybook`을 GameOverlay 안에서 새로 부르지 않는다(중복 로드/undefined 타이밍 회피). `VocabularyStudyPage` 등 storybook이 없는 경로는 `undefined` 폴백(장면 bg만 비게 됨 — graceful).

- [ ] **Step 1: 소스 로드 + 프리로드 훅 배선**

`GameOverlay` 상단(`const data = getGameData(...)` 뒤)에 추가:

```tsx
const effectiveStorybookId = unit.storybookId ?? `vocab-${unit.id}`; // 기존 라인 재사용
const { mapRef: phonicsMapRef, loading: phonicsLoading } = usePhonicsMap(['mod_korean', 'mod_phonics']);

const preload = useGameAssetPreload({
  data: data ?? { type: game, items: [] },
  game, lang,
  book: storybook,           // prop 으로 받은 Storybook (Step 0)
  phonicsMap: phonicsMapRef.current,
  phonicsReady: !phonicsLoading,
  style: currentStyle,       // prop 으로 받은 선택 그림체 (Step 0)
  storybookId: effectiveStorybookId,
});

const [skipped, setSkipped] = useState(false);
const gateReady = preload.ready || skipped;
```

`usePhonicsMap`은 `@/features/games/hooks/usePhonicsMap`. `currentStyle`이 실제 리빌 그림체(`useGameStyle`)와 다를 수 있으나, 장면은 bg(게이트 밖)라 헛워밍은 무해 — 파리티를 원하면 `collectSceneAssets`에 넘기는 style을 `useGameStyle(storybook)` 결과로 맞춘다(선택).

- [ ] **Step 2: 게이트 렌더 분기**

`data` null 처리(기존) 유지. `return (<motion.div ...>` 안, `<VocabSourceProvider>` 렌더 전에:

```tsx
if (!gateReady) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-cream-50">
      <GameLoadingGate loaded={preload.loaded} total={preload.total} onSkip={() => setSkipped(true)} />
    </motion.div>
  );
}
```

`GameOverlay`는 `VocabularyStudyContent`에서 `key={activeGame}` 등으로 remount되는지 확인 — 게임 전환 시 훅 재실행 보장(아니면 `key` 추가).

- [ ] **Step 3: typecheck + 수동 확인**

Run: `pnpm --filter client exec tsc --noEmit`
그리고 preview로 게임 진입 시 로딩바 노출 → 게임 시작 확인(preview_start → 게임 카드 클릭 → console/screenshot).

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/vocabulary-unit/components/VocabularyStudyContent.tsx
git commit -m "feat(games): gate game start on asset preload in GameOverlay"
```

### Task 9: 플레이어 중복 프리페치 제거 (회귀 대조하며)

**Files:**
- Modify: `KoreanBlockPlayer.tsx`, `EnglishBlockPlayer.tsx`, `Korean/EnglishWordWritingPlayer.tsx`, `LineMatchingPlayer.tsx`, `ConnectTheDotsPlayer.tsx`

- [ ] **Step 1: 대조표 작성**

각 플레이어가 프리페치하던 자산이 새 게이트 core/bg에 포함되는지 확인:
- `usePreloadImages(items.map(it => it.imageUrl))` (전 플레이어) → 게이트 `images` 커버 ✅ → 제거 가능.
- `usePrewarmWordTts(...)` **블록×2·따라쓰기×2만** → 게이트 `buildTtsSpec` 커버 ✅ → 제거 가능.
- `usePrewarmWordTts('dot')` **점잇기** → 게이트가 런타임 target을 못 만들어 커버 못 함 → **유지**(제거 X). spec §9.
- `usePrefetchUrlsGate(syllableUrls, ...)` (KoreanBlock·LineMatching) → 게이트 `syllables` 커버 ✅ → 제거 가능.
- `usePhonicsMap` 훅 자체(음절 재생에 런타임 map lookup 필요) → **유지**(제거 X).
- LineMatching은 `usePrewarmWordTts`를 **안 씀**(음절 직접) — `usePreloadImages` + `usePrefetchUrlsGate`만 제거.

- [ ] **Step 2: 중복 프리페치 호출 제거 (점잇기 dot 프리워밍은 유지)**

- **KoreanBlockPlayer**: `usePreloadImages`, `usePrewarmWordTts('kblock')`, `usePrefetchUrlsGate(syllableUrls)` + `syllableUrls` useMemo 제거. import 정리. `usePhonicsMap`/`mapRef`(음절 재생)는 유지.
- **EnglishBlockPlayer**: `usePreloadImages`, `usePrewarmWordTts('eblock')` 제거.
- **Korean/EnglishWordWritingPlayer**: `usePreloadImages`, `usePrewarmWordTts('wwrite-*')` + `prewarmItems` useMemo 제거.
- **LineMatchingPlayer**: `usePreloadImages`, `usePrefetchUrlsGate(syllableUrls)` 제거(`usePrewarmWordTts` 원래 없음). `usePhonicsMap` 유지.
- **ConnectTheDotsPlayer**: `usePreloadImages` 제거. 🔴 **`usePrewarmWordTts('dot')`는 유지**(런타임 target — 게이트 미커버).
- `phonicsLoading` 기반 로컬 게이트(`audioReady`)는 보수적으로 유지 가능(게이트가 이미 phonics를 기다리므로 진입 시 로드돼 있으나 중복은 무해).

- [ ] **Step 3: typecheck + 게임별 수동 확인**

Run: `pnpm --filter client exec tsc --noEmit` + `pnpm --filter client test`
preview로 4종(블록·따라쓰기·그림짝·점잇기) 각각 진입 → 첫 정답 발음 즉시성 + 장면 리빌(블록) 확인.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(games): remove per-player prefetch superseded by preload gate"
```

---

## 최종 검증

- [ ] `pnpm --filter client test` 전체 통과
- [ ] `pnpm --filter client exec tsc --noEmit` 통과
- [ ] `pnpm --filter client lint` 통과 (pre-commit eslint, 특히 exhaustive-deps disable 주석 없는지)
- [ ] preview 수동: 캐시 비운 첫 진입 시 로딩바 → 게임, 재진입 시 로딩바 거의 안 뜸(캐시 hit), 첫 정답 발음 즉시, 블록 게임 장면 리빌 지연 감소.
