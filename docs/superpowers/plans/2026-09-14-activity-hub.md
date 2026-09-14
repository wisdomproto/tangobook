# 활동 모음 `/activity` Implementation Plan

> ✅ **상태: 전 청크 구현·검수·배포 완료(2026-09-14).** 이후 변경은 스펙 머리말 참조.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한글·영어 워크지 · 색칠 도안 · 숨은그림을 한 틀(왼쪽 목록 / 오른쪽 활동)로 모아, 장마다 인쇄와 온라인 활동이 되고 SSR 로 검색에 노출되는 `/activity` 를 만든다.

**Architecture:** 목록은 shared `activity-catalog.ts` 한 곳에서 파생한다(클라·서버 SSR·sitemap·IndexNow 공용). 색칠·숨은그림 원천은 스크립트가 R2 에서 굽는 커밋된 JSON(`public/activity-data/`). 서버는 기존 `sendSeo`/`AboutSeo` 형식으로 SSR 하고, React 짝 페이지가 같은 주소를 받는다. 게임은 규칙을 안 바꾸고 prop 두 개만 더한다.

**Tech Stack:** pnpm monorepo · shared(TS, vitest) · server(Express 5, tsx, vitest) · client(React 18, React Router, TanStack Query, Tailwind v3 `print:` 변형) · R2(`scripts/translation-core.mjs`).

**Spec:** `docs/superpowers/specs/2026-09-14-activity-hub-design.md`

**공통 규칙(이 저장소)**
- 커밋은 영어, 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. `git add -A` 금지 — 파일 이름으로.
- shared 의 상대 import 는 **`.js` 확장자 필수**(없으면 운영 서버가 시작하며 죽는다).
- shared 테스트: `cd packages/client && ./node_modules/.bin/vitest run --root ../shared <파일>`
- server 테스트: `cd packages/server && ./node_modules/.bin/vitest run <파일>`
- client 타입: `cd packages/client && ./node_modules/.bin/tsc --noEmit -p .`
- 사용자에게 보이는 글은 한국어. push 는 시킬 때만.

---

## 파일 지도

| 파일 | 책임 |
|---|---|
| Create `packages/shared/src/utils/activity-catalog.ts` | 종류·키 정규식·slugify·항목 파생·키 찾기·다음 항목 |
| Create `packages/shared/src/utils/activity-catalog.test.ts` | 위 단위 테스트 |
| Create `packages/shared/src/utils/hidden-object.ts` | `hiddenObjectLabelOf` · `playableHiddenWords` (클라 빌더·스크립트 공용) |
| Create `packages/shared/src/utils/hidden-object.test.ts` | 위 테스트 |
| Modify `packages/shared/src/index.ts` | 두 모듈 export |
| Modify `packages/client/src/features/games/lib/hidden-object-data.ts` | shared 규칙 사용 + `sceneKey` 인자 |
| Modify `packages/client/src/features/games/lib/hidden-object-data.test.ts` | sceneKey·이름 기준 필터 테스트 |
| Modify `packages/client/src/features/games/components/players/ColoringPlayer.tsx` | `onDone` prop · 한 장이면 「다음 그림」 숨김 |
| Create `packages/server/scripts/build-activity-catalog.mjs` | R2 → `public/activity-data/{coloring,hidden-object}.json` |
| Create `packages/client/public/activity-data/coloring.json`, `hidden-object.json` | 굽기 산출물(커밋) |
| Create `packages/server/src/services/seo-activity.service.ts` | 카탈로그 읽기 · 항목/허브 SSR |
| Create `packages/server/src/services/seo-activity.service.test.ts` | SSR 테스트 |
| Modify `packages/server/src/app.ts` | `/activity*` SSR 라우트 · `/worksheet*` 301 (static 앞) |
| Modify `packages/server/src/services/seo-phonics.service.ts` | 본문 `/worksheet/` 링크 → `/activity` |
| Create `packages/client/src/features/activity/hooks/useActivityCatalog.ts` | JSON fetch + shared 파생 |
| Create `packages/client/src/features/activity/lib/track.ts` | GA4 이벤트 |
| Create `packages/client/src/features/activity/components/ActivityLayout.tsx` | 종류 탭 · 목록 · 오른쪽 자리 |
| Create `packages/client/src/features/activity/components/ActivityList.tsx` | 갈래 접기 · 검색 · 링크 |
| Create `packages/client/src/features/activity/components/ActivityCta.tsx` | 사이트로 잇는 버튼 |
| Create `packages/client/src/features/activity/components/panels/ColoringPanel.tsx` | 미리보기 ↔ 색칠 게임 |
| Create `packages/client/src/features/activity/components/panels/HiddenObjectPanel.tsx` | 미리보기 ↔ 숨은그림 게임 |
| Create `packages/client/src/features/activity/components/panels/WorksheetPanel.tsx` | 단원 요약 ↔ PhonicsTryIt · 인쇄물 새 탭 |
| Create `packages/client/src/pages/ActivityPage.tsx` | 항목 페이지(짝 페이지) |
| Create `packages/client/src/pages/ActivityHubPage.tsx` | 허브 |
| Modify `packages/client/src/router/index.tsx` | 라우트 5 + `/worksheet*` Navigate |
| Delete `packages/client/src/pages/WorksheetHubPage.tsx`, `WorksheetPage.tsx` | 새 페이지로 대체 |
| Modify `packages/client/src/components/PublicNav.tsx` | `/worksheet` → `/activity` |
| Modify `packages/server/scripts/generate-sitemap.mjs`, `submit-indexnow.mjs` | 카탈로그 URL 추가 |

---

## Chunk 1: shared 카탈로그 · 게임 최소 변경

### Task 1: `hidden-object.ts` — 라벨·찾을 낱말 규칙 한 곳

**Files:**
- Create: `packages/shared/src/utils/hidden-object.ts`
- Test: `packages/shared/src/utils/hidden-object.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// packages/shared/src/utils/hidden-object.test.ts
import { describe, it, expect } from 'vitest';
import { hiddenObjectLabelOf, playableHiddenWords } from './hidden-object.js';

describe('hidden-object rules', () => {
  const keyObjects = [
    { name: 'Crown', korean: '왕관' },
    { name: 'Ball' },
  ] as never;

  it('label = korean, then name, then objectName', () => {
    expect(hiddenObjectLabelOf(keyObjects, 'Crown')).toBe('왕관');
    expect(hiddenObjectLabelOf(keyObjects, 'Ball')).toBe('Ball');
    expect(hiddenObjectLabelOf(keyObjects, 'Nope')).toBe('Nope');
  });

  it('playable words = distinct objectName in hotspot order', () => {
    const scene = {
      id: 'hobj_ho-0001',
      sceneImageUrl: 'x',
      hotspots: [
        { objectName: 'Wing', x: 0, y: 0, w: 1, h: 1 },
        { objectName: 'Wing', x: 0, y: 0, w: 1, h: 1 },
        { objectName: 'Crown', x: 0, y: 0, w: 1, h: 1 },
      ],
    } as never;
    expect(playableHiddenWords(scene)).toEqual(['Wing', 'Crown']);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd packages/client && ./node_modules/.bin/vitest run --root ../shared src/utils/hidden-object.test.ts`
Expected: FAIL — `Cannot find module './hidden-object.js'`

- [ ] **Step 3: 구현**

```ts
// packages/shared/src/utils/hidden-object.ts
import type { HiddenObjectScene, KeyObject } from '../types/storybook.js';

/**
 * 숨은그림 낱말 라벨 — `key_objects` 에서 이름으로 찾아 `korean` → `name` → objectName.
 * 🔴 클라 게임 빌더와 활동 목록 굽기 스크립트가 **같은 함수**를 쓴다(따로 적으면 체크리스트와 게임이 갈라진다).
 */
export function hiddenObjectLabelOf(
  keyObjects: Pick<KeyObject, 'name' | 'korean'>[] | undefined,
  objectName: string
): string {
  const ko = (keyObjects ?? []).find((k) => k.name === objectName);
  return ko?.korean || ko?.name || objectName;
}

/**
 * 그 씬에서 찾을 낱말 — **이름 중복을 뺀** 목록(날개처럼 박스가 둘이어도 한 낱말).
 * 「2개 이상이어야 게임」 판정은 이 길이로 한다.
 */
export function playableHiddenWords(scene: Pick<HiddenObjectScene, 'hotspots'>): string[] {
  return [...new Set(scene.hotspots.map((h) => h.objectName))];
}
```

`packages/shared/src/index.ts` 의 `export * from './utils/phonics-units.js';` 아래에 추가:

```ts
export * from './utils/hidden-object.js';
export * from './utils/activity-catalog.js';
```

(activity-catalog 는 Task 2 에서 만든다 — Task 2 끝나기 전엔 이 줄 때문에 shared tsc 가 깨지므로, 이 Task 에서는 `hidden-object.js` 한 줄만 넣고 Task 2 Step 3 에서 두 번째 줄을 넣는다.)

- [ ] **Step 4: 통과 확인**

Run: `cd packages/client && ./node_modules/.bin/vitest run --root ../shared src/utils/hidden-object.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add packages/shared/src/utils/hidden-object.ts packages/shared/src/utils/hidden-object.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): hidden-object label and playable-word rules in one place"
```

### Task 2: `activity-catalog.ts` — 목록 파생 한 곳

**Files:**
- Create: `packages/shared/src/utils/activity-catalog.ts`
- Test: `packages/shared/src/utils/activity-catalog.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// packages/shared/src/utils/activity-catalog.test.ts
import { describe, it, expect } from 'vitest';
import {
  slugify,
  parseActivityKey,
  worksheetItems,
  coloringItems,
  hiddenObjectItems,
  findActivity,
  nextInGroup,
} from './activity-catalog.js';

describe('slugify', () => {
  it('keeps hangul/latin/digits, joins the rest with one dash, max 40', () => {
    expect(slugify('01. 골고루 먹으면')).toBe('01-골고루-먹으면');
    expect(slugify('  ?!  ')).toBe('');
    expect(slugify('가'.repeat(50)).length).toBe(40);
  });
});

describe('parseActivityKey', () => {
  it('reads the leading key for sheets, whole id for worksheets', () => {
    expect(parseActivityKey('coloring', 'ph-0389-아이')).toBe('ph-0389');
    expect(parseActivityKey('coloring', 'bk-0001')).toBe('bk-0001');
    expect(parseActivityKey('coloring', 'ph-03891')).toBeNull();
    expect(parseActivityKey('hidden-object', 'jr-0034-팥죽-할멈')).toBe('jr-0034');
    expect(parseActivityKey('hangul', 'kr-h1-u02')).toBe('kr-h1-u02');
    expect(parseActivityKey('english', 'en-b1-u01')).toBe('en-b1-u01');
    expect(parseActivityKey('english', 'kr-h1-u02')).toBeNull();
  });
});

describe('items', () => {
  it('worksheet items come from the curriculum with app links', () => {
    const items = worksheetItems('hangul');
    expect(items.length).toBe(32);
    expect(items[0].path).toBe('/activity/hangul/kr-h1-u01');
    expect(items[0].sourceHref).toBe('/library/phonics/korean/kr-h1-u01');
    expect(worksheetItems('english').length).toBe(39);
  });

  it('coloring slug = key-word, book sheets add the book title and link to the book', () => {
    const [ph, bk] = coloringItems([
      { key: 'ph-0389', group: '한글 파닉스', section: 's', unitId: 'kr-h1-u01', word: '아이', language: 'korean', lineartUrl: '/a' },
      { key: 'bk-0001', group: '세계 명작', section: '개구리 왕자', bookId: '177', bookTitle: '개구리 왕자', word: '공', lineartUrl: '/b' },
    ]);
    expect(ph.slug).toBe('ph-0389-아이');
    expect(ph.sourceHref).toBe('/library/phonics/korean/kr-h1-u01');
    expect(bk.slug).toBe('bk-0001-공-개구리-왕자');
    expect(bk.sourceHref).toBe('/library/177');
    expect(bk.path).toBe('/activity/coloring/bk-0001-공-개구리-왕자');
  });

  it('hidden-object slug = key-bookTitle', () => {
    const [h] = hiddenObjectItems([
      { key: 'jr-0034', bookId: '9', bookTitle: '팥죽 할멈과 호랑이', category: '전래 동화', sceneImageUrl: '/s', words: ['팥죽', '호랑이'] },
    ]);
    expect(h.slug).toBe('jr-0034-팥죽-할멈과-호랑이');
    expect(h.group).toBe('전래 동화');
  });
});

describe('findActivity', () => {
  const items = coloringItems([
    { key: 'ph-0389', group: 'g', section: 's', unitId: 'kr-h1-u01', word: '아이', language: 'korean', lineartUrl: '/a' },
    { key: 'ph-0390', group: 'g', section: 's', unitId: 'kr-h1-u01', word: '여우', language: 'korean', lineartUrl: '/b' },
  ]);
  it('finds by key, flags non-canonical slug, null when missing', () => {
    expect(findActivity('coloring', items, 'ph-0389-아이')).toMatchObject({ canonical: true });
    expect(findActivity('coloring', items, 'ph-0389')).toMatchObject({ canonical: false });
    expect(findActivity('coloring', items, 'ph-9999-x')).toBeNull();
  });
  it('nextInGroup wraps within the group', () => {
    expect(nextInGroup(items, 'ph-0389')?.key).toBe('ph-0390');
    expect(nextInGroup(items, 'ph-0390')?.key).toBe('ph-0389');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd packages/client && ./node_modules/.bin/vitest run --root ../shared src/utils/activity-catalog.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

```ts
// packages/shared/src/utils/activity-catalog.ts
/**
 * 활동 모음(`/activity`) 목록 — 🔴 클라 목록 · 서버 SSR · sitemap · IndexNow 가 **전부 이 파일**로 파생한다
 * (sitemap 과 IndexNow 가 각자 목록을 세다 파닉스 73개가 빠질 뻔했다).
 * 색칠·숨은그림 원천 JSON 은 `build-activity-catalog.mjs` 가 굽는다(`public/activity-data/`).
 */
import { PHONICS_TRACK_META, flattenPhonicsUnits, type PhonicsTrack } from './phonics-units.js';

export type ActivityKind = 'hangul' | 'english' | 'coloring' | 'hidden-object';
export const ACTIVITY_KINDS: ActivityKind[] = ['hangul', 'english', 'coloring', 'hidden-object'];
export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
  hangul: '한글 워크지',
  english: '영어 워크지',
  coloring: '색칠 도안',
  'hidden-object': '숨은그림찾기',
};

export interface ColoringCatalogEntry {
  key: string;
  group: string;
  section: string;
  word: string;
  language?: 'korean' | 'english';
  /** 파닉스 도안 — 단원 id */
  unitId?: string;
  /** 동화책 도안 — 살아 있는 공개 책 id */
  bookId?: string;
  bookTitle?: string;
  lineartUrl: string;
  originalUrl?: string | null;
  answerUrl?: string | null;
  blurb?: string;
}

export interface HiddenObjectCatalogEntry {
  key: string;
  bookId: string;
  bookTitle: string;
  category: string;
  sceneImageUrl: string;
  words: string[];
  blurb?: string;
}

export interface ActivityItem {
  kind: ActivityKind;
  key: string;
  slug: string;
  title: string;
  group: string;
  section: string;
  path: string;
  sourceHref: string;
  sourceLabel: string;
  image?: string;
  blurb?: string;
}

const KEY_RE: Record<ActivityKind, RegExp> = {
  coloring: /^(ph|bk)-\d{4}(?=$|-)/,
  'hidden-object': /^(ho|jr|nt)-\d{4}(?=$|-)/,
  hangul: /^kr-h\d+-u\d+$/,
  english: /^en-b\d+-u\d+$/,
};

/** `[가-힣a-zA-Z0-9]` 밖은 `-` 하나로, 앞뒤 `-` 제거, 40자. */
export function slugify(text: string): string {
  return text
    .replace(/[^가-힣a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

/** 주소 세그먼트(디코드된 값)에서 키만. 워크지는 세그먼트 전체가 단원 id 여야 한다. */
export function parseActivityKey(kind: ActivityKind, segment: string): string | null {
  const m = segment.match(KEY_RE[kind]);
  return m ? m[0] : null;
}

const slugOf = (key: string, decoration: string) => {
  const d = slugify(decoration);
  return d ? `${key}-${d}` : key;
};

const PHONICS_CTA = '🔤 탱고북 파닉스에서 이어 하기';
const BOOK_CTA = '📖 이 그림이 나오는 동화책 읽기';

export function worksheetItems(kind: 'hangul' | 'english'): ActivityItem[] {
  const track: PhonicsTrack = kind === 'hangul' ? 'korean' : 'english';
  return flattenPhonicsUnits(track).map((u) => ({
    kind,
    key: u.id,
    slug: u.id,
    title: u.name,
    group: u.levelName,
    section: u.levelName,
    path: `/activity/${kind}/${u.id}`,
    sourceHref: `${PHONICS_TRACK_META[track].learnBase}/${u.id}`,
    sourceLabel: PHONICS_CTA,
  }));
}

export function coloringItems(entries: ColoringCatalogEntry[]): ActivityItem[] {
  return entries.map((e) => {
    const slug = slugOf(e.key, e.bookTitle ? `${e.word} ${e.bookTitle}` : e.word);
    const track: PhonicsTrack = e.language === 'english' ? 'english' : 'korean';
    return {
      kind: 'coloring' as const,
      key: e.key,
      slug,
      title: e.word,
      group: e.group,
      // 동화책 도안은 굽기 때의 공개 책 제목(분할 뒤 이름)을 쓴다 — manifest 의 section 은 옛 이름일 수 있다.
      section: e.bookTitle ?? e.section,
      path: `/activity/coloring/${slug}`,
      sourceHref: e.bookId
        ? `/library/${e.bookId}`
        : `${PHONICS_TRACK_META[track].learnBase}/${e.unitId ?? ''}`,
      sourceLabel: e.bookId ? BOOK_CTA : PHONICS_CTA,
      image: e.lineartUrl,
      blurb: e.blurb,
    };
  });
}

export function hiddenObjectItems(entries: HiddenObjectCatalogEntry[]): ActivityItem[] {
  return entries.map((e) => {
    const slug = slugOf(e.key, e.bookTitle);
    return {
      kind: 'hidden-object' as const,
      key: e.key,
      slug,
      title: e.bookTitle,
      group: e.category,
      section: e.category,
      path: `/activity/hidden-object/${slug}`,
      sourceHref: `/library/${e.bookId}`,
      sourceLabel: BOOK_CTA,
      image: e.sceneImageUrl,
      blurb: e.blurb,
    };
  });
}

/** 세그먼트(디코드된 값) → 항목. `canonical=false` 면 정규 주소(`item.path`)로 301/replace. */
export function findActivity(
  kind: ActivityKind,
  items: ActivityItem[],
  segment: string
): { item: ActivityItem; canonical: boolean } | null {
  const key = parseActivityKey(kind, segment);
  if (!key) return null;
  const item = items.find((i) => i.key === key);
  return item ? { item, canonical: segment === item.slug } : null;
}

/** 같은 갈래의 다음 항목(끝이면 처음으로). 「다음 도안 →」 링크용. */
export function nextInGroup(items: ActivityItem[], key: string): ActivityItem | null {
  const cur = items.find((i) => i.key === key);
  if (!cur) return null;
  const same = items.filter((i) => i.group === cur.group);
  if (same.length < 2) return null;
  return same[(same.findIndex((i) => i.key === key) + 1) % same.length];
}
```

`packages/shared/src/index.ts` 에 Task 1 에서 미뤄 둔 줄을 추가:

```ts
export * from './utils/activity-catalog.js';
```

- [ ] **Step 4: 통과 확인**

Run: `cd packages/client && ./node_modules/.bin/vitest run --root ../shared src/utils/activity-catalog.test.ts src/utils/hidden-object.test.ts`
Expected: PASS
그리고 `cd packages/shared && ../server/node_modules/.bin/tsc --noEmit -p .` — 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add packages/shared/src/utils/activity-catalog.ts packages/shared/src/utils/activity-catalog.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): activity catalog — keys, slugs and items for the activity hub"
```

### Task 3: 숨은그림 빌더 — shared 규칙 + `sceneKey`

**Files:**
- Modify: `packages/client/src/features/games/lib/hidden-object-data.ts`
- Test: `packages/client/src/features/games/lib/hidden-object-data.test.ts`

- [ ] **Step 1: 실패하는 테스트** — 파일 머리의 vitest import 에 `vi` 가 없으면 넣고, 파일 끝 `describe` 안에 추가(파일 위의 `book`·`scene` 헬퍼를 그대로 쓴다; `scene(id, names)` 가 `hobj_<id>` 가 아니면 헬퍼를 확인하고 id 를 맞춘다):

```ts
  it('sceneKey 를 주면 그 씬만 쓴다', () => {
    // 무작위를 0 으로 고정 — 안 고친 코드는 늘 첫 씬(a)을 골라 이 테스트가 확실히 실패한다.
    // (describe 안에 `afterEach(() => vi.restoreAllMocks())` 를 한 번 넣어, 실패해도 목이 남지 않게 한다.)
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const data = buildHiddenObjectSceneData(
      book({
        hiddenObjectScenes: [
          { ...scene('a', ['Crown', '공']), id: 'hobj_ho-0001', sceneImageUrl: 'https://x/a.jpg' },
          { ...scene('b', ['Crown', '공']), id: 'hobj_ho-0002', sceneImageUrl: 'https://x/b.jpg' },
        ],
      } as never),
      undefined,
      'ho-0002'
    );
    expect(data?.scenes[0].sceneImageUrl).toBe('https://x/b.jpg');
  });

  it('박스가 둘이어도 이름이 하나면 게임이 아니다', () => {
    const one = scene('s1', ['Crown']);
    const twoBoxes = { ...one, hotspots: [...one.hotspots, ...one.hotspots] };
    expect(buildHiddenObjectSceneData(book({ hiddenObjectScenes: [twoBoxes] } as never))).toBeNull();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `cd packages/client && ./node_modules/.bin/vitest run src/features/games/lib/hidden-object-data.test.ts`
Expected: FAIL (sceneKey 무시 → 무작위 / 박스 둘 통과)

- [ ] **Step 3: 구현** — `hidden-object-data.ts`:

```ts
import type { Storybook, HiddenObjectData, HiddenObjectTarget } from '@tangobook/shared';
import { hiddenObjectLabelOf, playableHiddenWords } from '@tangobook/shared';
```

함수 시그니처와 본문을 바꾼다:

```ts
export function buildHiddenObjectSceneData(
  book: Storybook | undefined,
  _style?: string,
  /** 주면 `hobj_<sceneKey>` 씬만(활동 모음 한 장 페이지). 없으면 무작위 한 장. */
  sceneKey?: string
): HiddenObjectData | null {
  if (!book) return null;
  const all = book.hiddenObjectScenes;
  if (!all?.length) return null;
  const scenes = sceneKey ? all.filter((s) => s.id === `hobj_${sceneKey}`) : all;

  const keyObjects = book.key_objects ?? [];
  const images = book.keyObjectImages ?? [];
  const labelOf = (name: string): string => hiddenObjectLabelOf(keyObjects, name);
```

필터 줄을 이름 기준으로:

```ts
    // 🔴 찾을 게 하나뿐인 씬은 게임이 아니다 — **이름 중복을 뺀** 개수로 센다(날개 박스 둘 = 한 낱말).
    .filter((s, i) => s.sceneImageUrl && playableHiddenWords(scenes[i]).length >= 2);
```

(`.map` 결과와 `scenes` 의 인덱스가 같으므로 `scenes[i]` 로 원래 씬을 본다.)

- [ ] **Step 4: 통과 확인**

Run: `cd packages/client && ./node_modules/.bin/vitest run src/features/games/lib/hidden-object-data.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/games/lib/hidden-object-data.ts packages/client/src/features/games/lib/hidden-object-data.test.ts
git commit -m "feat(games): hidden-object builder takes a scene key and counts distinct words"
```

### Task 4: 색칠 플레이어 — `onDone` · 한 장이면 「다음 그림」 숨김

**Files:**
- Modify: `packages/client/src/features/games/components/players/ColoringPlayer.tsx`

- [ ] **Step 1: props 추가**

```ts
interface ColoringPlayerProps {
  items: ColoringItem[];
  onBack?: () => void;
  /**
   * 다 칠한 순간 한 번. 활동 모음이 「사이트로 잇는 버튼」을 다시 띄우는 데 쓴다.
   * 🔴 이게 있거나 한 장뿐이면 자체 「다음 그림」 버튼을 숨긴다 — 한 장이면 `(i+1)%1` 로 제자리다.
   */
  onDone?: () => void;
}
```

`export function ColoringPlayer({ items, onBack }` → `({ items, onBack, onDone }`.

- [ ] **Step 2: done 알림** — `const [done, setDone] = useState(false);` 아래(유일한 early return `if (!item) return null` 보다 위)에:

```ts
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    // onDone 은 호출부가 매 렌더 새로 만들 수 있어 ref 로 받는다 — done 이 바뀔 때만 부른다.
    if (done) onDoneRef.current?.();
  }, [done]);
```

- [ ] **Step 3: 버튼 숨김** — `{done ? ( <button onClick={() => setIdx(...)} ...>다음 그림</button> ) : (` 를:

```tsx
        {done ? (
          onDone || items.length === 1 ? null : (
            <button
              onClick={() => setIdx((i) => (i + 1) % items.length)}
              className="w-full max-w-md mx-auto block min-h-[56px] rounded-full bg-coral-500 text-white text-2xl font-black shadow-pop break-keep"
            >
              다음 그림
            </button>
          )
        ) : (
```

- [ ] **Step 4: 확인**

Run: `cd packages/client && ./node_modules/.bin/tsc --noEmit -p . && ./node_modules/.bin/vitest run src/features/games`
Expected: 타입 에러 없음, 기존 테스트 PASS (`/coloring-demo` 는 `onDone` 을 안 넘기고 여러 장이라 동작 불변)

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/games/components/players/ColoringPlayer.tsx
git commit -m "feat(games): coloring player reports completion and hides next for a single sheet"
```

---

## Chunk 2: 카탈로그 JSON 굽기

### Task 5: `build-activity-catalog.mjs`

**Files:**
- Create: `packages/server/scripts/build-activity-catalog.mjs`
- Create(산출): `packages/client/public/activity-data/coloring.json`, `hidden-object.json`, `summary.json`

- [ ] **Step 1: shared 빌드**(스크립트가 `shared/dist` 를 import 한다)

Run: `pnpm --filter shared build`
Expected: 성공, `packages/shared/dist/utils/activity-catalog.js` 존재

- [ ] **Step 2: 스크립트 작성**

```js
#!/usr/bin/env node
/**
 * 활동 모음(`/activity`) 원천 JSON 굽기 — R2 → `packages/client/public/activity-data/`.
 *
 * - `coloring.json`: 게임 목록(`public/coloring/manifest.json`)에서 중국어(dev-only)를 빼고,
 *   동화책 도안(`bk-*`)은 **살아 있는 공개 책**만 남긴다(그림체 분할 뒤 옛 id 가 남아 있을 수 있다).
 * - `hidden-object.json`: **공개 책의 top-level `hiddenObjectScenes`** 중 찾을 낱말(이름 중복 제거) 2개 이상.
 *   🔴 `hidden-object-hotspots.json`·작업판은 안 쓴다 — 원본 책 id 로 적혀 있어 쪼갠 책을 못 가리킨다.
 * 🔴 먼저 `pnpm --filter shared build` (shared/dist 를 import 한다).
 * 🔴 재생성: 도안을 붙이거나 숨은그림을 링크하거나 책을 공개한 뒤.
 *
 * 사용: node packages/server/scripts/build-activity-catalog.mjs [--apply]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, listStorybookKeys, getJsonByKey } from './translation-core.mjs';
import {
  bookDisplayTitle,
  hiddenObjectLabelOf,
  playableHiddenWords,
} from '../../shared/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, '..', '..', 'client', 'public');
const OUT = path.join(PUB, 'activity-data');
const APPLY = process.argv.includes('--apply');
const SCENE_KEY = /^(ho|jr|nt)-\d{4}$/;
loadEnv();

const keys = await listStorybookKeys();
const books = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: 16 }, async () => {
    while (cursor < keys.length) {
      const k = keys[cursor++];
      const sb = await getJsonByKey(k).catch(() => null);
      if (sb) books.push(sb);
    }
  })
);
const publicBooks = new Map(books.filter((b) => b.isPublic !== false).map((b) => [String(b.id), b]));
console.log(`책 ${books.length}권 · 공개 ${publicBooks.size}권`);

// ── 색칠
const manifest = JSON.parse(fs.readFileSync(path.join(PUB, 'coloring', 'manifest.json'), 'utf8'));
const dropped = { zh: 0, privateOrMissingBook: 0 };
const coloring = [];
for (const it of manifest) {
  if (it.language === 'zh') { dropped.zh++; continue; }
  const base = {
    key: it.key, group: it.group, section: it.section, word: it.word,
    language: it.language, lineartUrl: it.lineartUrl,
    originalUrl: it.originalUrl ?? null, answerUrl: it.answerUrl ?? null,
  };
  if (it.key.startsWith('bk-')) {
    const book = publicBooks.get(String(it.unitId));
    if (!book) { dropped.privateOrMissingBook++; continue; }
    const ko = (book.key_objects ?? []).find((k) => (k.korean ?? '').trim() === it.word);
    coloring.push({
      ...base, bookId: String(book.id), bookTitle: bookDisplayTitle(book),
      ...(ko?.description ? { blurb: String(ko.description).slice(0, 160) } : {}),
    });
  } else {
    coloring.push({ ...base, unitId: it.unitId });
  }
}
coloring.sort((a, b) => a.key.localeCompare(b.key));

// ── 숨은그림
const hidden = [];
const hdrop = { badKey: 0, tooFew: 0 };
for (const book of publicBooks.values()) {
  for (const scene of book.hiddenObjectScenes ?? []) {
    const key = String(scene.id ?? '').replace(/^hobj_/, '');
    if (!SCENE_KEY.test(key) || !scene.sceneImageUrl) { hdrop.badKey++; continue; }
    const words = playableHiddenWords(scene).map((n) => hiddenObjectLabelOf(book.key_objects, n));
    if (words.length < 2) { hdrop.tooFew++; continue; }
    hidden.push({
      key, bookId: String(book.id), bookTitle: bookDisplayTitle(book),
      category: book.category ?? '기타', sceneImageUrl: scene.sceneImageUrl, words,
      ...(book.parentGuide?.overview ? { blurb: String(book.parentGuide.overview).slice(0, 120) } : {}),
    });
  }
}
hidden.sort((a, b) => a.key.localeCompare(b.key));

console.log(`색칠 ${coloring.length}장 (manifest ${manifest.length} · 뺀 것 중국어 ${dropped.zh} · 비공개/없는 책 ${dropped.privateOrMissingBook})`);
console.log(`숨은그림 ${hidden.length}장 (뺀 것 키 형식 ${hdrop.badKey} · 낱말 2개 미만 ${hdrop.tooFew})`);

if (APPLY) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'coloring.json'), JSON.stringify(coloring));
  fs.writeFileSync(path.join(OUT, 'hidden-object.json'), JSON.stringify(hidden));
  // 허브·종류 탭이 900KB 목록을 받지 않고 개수와 첫 키만 알 수 있게.
  fs.writeFileSync(
    path.join(OUT, 'summary.json'),
    JSON.stringify({
      coloring: { count: coloring.length, firstKey: coloring[0]?.key ?? null },
      'hidden-object': { count: hidden.length, firstKey: hidden[0]?.key ?? null },
    })
  );
  console.log(`쓰기 → ${OUT}`);
} else {
  console.log('dry-run. 쓰려면 --apply');
}
```

- [ ] **Step 3: dry-run 으로 개수 확인** — 먼저 워크트리에 `packages/server/.env` 가 있는지 `ls packages/server/.env` 로 확인(없으면 R2 를 못 읽는다).

Run: `cd packages/server && node scripts/build-activity-catalog.mjs`
Expected: `색칠 N장` 에서 N ≤ 2,251 이고 중국어 128 을 뺐다고 찍힘 · `숨은그림 M장` 에서 M ≤ 285. 비공개/없는 책 수가 수백이면 멈추고 원인을 본다(공개 여부 필드·id 문자열화).

- [ ] **Step 4: 쓰기 + 커밋**

Run: `cd packages/server && node scripts/build-activity-catalog.mjs --apply`

```bash
git add packages/server/scripts/build-activity-catalog.mjs packages/client/public/activity-data/coloring.json packages/client/public/activity-data/hidden-object.json packages/client/public/activity-data/summary.json
git commit -m "feat(activity): bake coloring and hidden-object catalogs from R2"
```

---

## Chunk 3: 서버 SSR

### Task 6: `seo-activity.service.ts`

**Files:**
- Create: `packages/server/src/services/seo-activity.service.ts`
- Test: `packages/server/src/services/seo-activity.service.test.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// packages/server/src/services/seo-activity.service.test.ts
import { describe, it, expect } from 'vitest';
import { buildCatalog, renderActivitySeo, renderActivityHubSeo } from './seo-activity.service.js';

const catalog = buildCatalog(
  [
    { key: 'ph-0389', group: '한글 파닉스', section: 's', unitId: 'kr-h1-u01', word: '아이', language: 'korean', lineartUrl: '/api/r2-proxy?key=a' },
    { key: 'bk-0001', group: '세계 명작', section: '개구리 왕자', bookId: '177', bookTitle: '개구리 왕자', word: '공', lineartUrl: '/api/r2-proxy?key=b', blurb: '둥근 공' },
  ],
  [{ key: 'jr-0034', bookId: '9', bookTitle: '팥죽 할멈', category: '전래 동화', sceneImageUrl: 'https://x/s.jpg', words: ['팥죽', '호랑이'] }]
);

describe('renderActivitySeo', () => {
  it('coloring page: title, canonical, absolute og image, body text, source link', () => {
    const seo = renderActivitySeo('coloring', 'bk-0001-공-개구리-왕자', catalog);
    if (!seo || 'redirect' in seo) throw new Error('expected page');
    expect(seo.title).toContain('공 색칠도안');
    expect(seo.canonical).toBe('https://www.tangobook.co.kr/activity/coloring/' + encodeURIComponent('bk-0001-공-개구리-왕자'));
    expect(seo.ogImage.startsWith('https://www.tangobook.co.kr/api/r2-proxy')).toBe(true);
    expect(seo.bodyHtml).toContain('둥근 공');
    expect(seo.bodyHtml).toContain('href="/library/177"');
  });

  it('non-canonical slug → redirect, unknown key → null', () => {
    expect(renderActivitySeo('coloring', 'bk-0001', catalog)).toEqual({
      redirect: '/activity/coloring/' + encodeURIComponent('bk-0001-공-개구리-왕자'),
    });
    expect(renderActivitySeo('coloring', 'bk-9999-x', catalog)).toBeNull();
  });

  it('hidden-object and worksheet pages render', () => {
    const h = renderActivitySeo('hidden-object', 'jr-0034-팥죽-할멈', catalog);
    if (!h || 'redirect' in h) throw new Error('expected page');
    expect(h.title).toContain('숨은그림찾기 도안');
    expect(h.bodyHtml).toContain('호랑이');
    const w = renderActivitySeo('hangul', 'kr-h1-u02', catalog);
    if (!w || 'redirect' in w) throw new Error('expected page');
    expect(w.title).toContain('한글 학습지');
  });

  it('hub links every kind', () => {
    const hub = renderActivityHubSeo(catalog);
    expect(hub.bodyHtml).toContain('/activity/hangul/kr-h1-u01');
    expect(hub.bodyHtml).toContain('/activity/hidden-object/');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd packages/server && ./node_modules/.bin/vitest run src/services/seo-activity.service.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

```ts
// packages/server/src/services/seo-activity.service.ts
/**
 * 활동 모음 SSR — `/activity` · `/activity/{hangul,english}/:unitId` · `/activity/{coloring,hidden-object}/:slug`.
 * 스펙: docs/superpowers/specs/2026-09-14-activity-hub-design.md
 * 🔴 목록은 shared `activity-catalog` 로만 파생한다(클라·sitemap·IndexNow 와 같은 함수).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABEL,
  coloringItems,
  findActivity,
  flattenPhonicsUnits,
  hiddenObjectItems,
  worksheetItems,
  type ActivityItem,
  type ActivityKind,
  type ColoringCatalogEntry,
  type HiddenObjectCatalogEntry,
} from '@tangobook/shared';
import { SITE_URL, escapeHtml, summarize, type AboutSeo } from './seo-ssr.service.js';

export interface ActivityCatalog {
  items: Record<ActivityKind, ActivityItem[]>;
  hiddenWords: Map<string, string[]>;
}

export function buildCatalog(
  coloring: ColoringCatalogEntry[],
  hidden: HiddenObjectCatalogEntry[]
): ActivityCatalog {
  return {
    items: {
      hangul: worksheetItems('hangul'),
      english: worksheetItems('english'),
      coloring: coloringItems(coloring),
      'hidden-object': hiddenObjectItems(hidden),
    },
    hiddenWords: new Map(hidden.map((h) => [h.key, h.words])),
  };
}

let cached: ActivityCatalog | null = null;

/** 운영 = `clientDist/activity-data`, 개발(dist 없음) = `packages/client/public/activity-data`. 프로세스 수명 캐시. */
export function loadActivityCatalog(clientDist: string): ActivityCatalog {
  if (cached) return cached;
  const dirs = [path.join(clientDist, 'activity-data'), path.join(process.cwd(), 'packages/client/public/activity-data')];
  const dir = dirs.find((d) => fs.existsSync(path.join(d, 'coloring.json'))) ?? dirs[0];
  const read = <T>(f: string): T[] => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as T[];
    } catch {
      return [];
    }
  };
  cached = buildCatalog(read<ColoringCatalogEntry>('coloring.json'), read<HiddenObjectCatalogEntry>('hidden-object.json'));
  return cached;
}

const enc = (p: string) => p.split('/').map((s, i) => (i < 3 ? s : encodeURIComponent(s))).join('/');
const abs = (u?: string) => (!u ? `${SITE_URL}/og-image.png` : u.startsWith('/') ? `${SITE_URL}${u}` : u);
const li = (xs: string[]) => xs.map((s) => `<li>${escapeHtml(s)}</li>`).join('');

function titleOf(item: ActivityItem): string {
  switch (item.kind) {
    case 'coloring':
      return item.sourceHref.startsWith('/library/') && !item.sourceHref.startsWith('/library/phonics')
        ? `${item.title} 색칠도안 — ${item.section} | 탱고북`
        : `${item.title} 색칠도안 무료 인쇄 · 온라인 색칠공부 | 탱고북`;
    case 'hidden-object':
      return `${item.title} 숨은그림찾기 도안 무료 인쇄 · 온라인 게임 | 탱고북`;
    case 'hangul':
      return `${item.title} 한글 학습지 무료 인쇄 | 탱고북`;
    case 'english':
      return `${item.title} 영어 파닉스 학습지 무료 인쇄 | 탱고북`;
  }
}

function introOf(item: ActivityItem, catalog: ActivityCatalog): { intro: string; listHtml: string } {
  if (item.kind === 'coloring') {
    return {
      intro: `「${item.title}」 색칠도안입니다. A4 로 인쇄해 색연필로 칠하거나, 온라인에서 바로 색을 골라 칠할 수 있어요. 가입 없이 무료입니다.`,
      listHtml: '',
    };
  }
  if (item.kind === 'hidden-object') {
    const words = catalog.hiddenWords.get(item.key) ?? [];
    return {
      intro: `「${item.title}」 그림 속에 숨은 ${words.length}가지를 찾는 숨은그림찾기입니다. 인쇄해서 찾거나 온라인에서 눌러 찾을 수 있어요.`,
      listHtml: `<h2>찾을 것</h2><ul>${li(words)}</ul>`,
    };
  }
  const track = item.kind === 'hangul' ? 'korean' : 'english';
  const u = flattenPhonicsUnits(track).find((x) => x.id === item.key);
  const combos = u ? (u.syllables.length ? u.syllables : u.patterns) : [];
  return {
    intro: `${ACTIVITY_KIND_LABEL[item.kind]} 「${item.title}」(${item.group})입니다. 집에서 A4 로 뽑아 연필로 쓰고, 같은 단원을 온라인에서 소리와 함께 해볼 수 있어요.`,
    listHtml:
      (u?.phonemes.length ? `<h2>배우는 소리</h2><ul>${li(u.phonemes)}</ul>` : '') +
      (combos.length ? `<h2>만드는 글자</h2><ul>${li(combos.slice(0, 30))}</ul>` : '') +
      (u?.sampleWords.length ? `<h2>읽는 낱말</h2><ul>${li(u.sampleWords)}</ul>` : ''),
  };
}

export function renderActivitySeo(
  kind: ActivityKind,
  segment: string,
  catalog: ActivityCatalog
): AboutSeo | { redirect: string } | null {
  const found = findActivity(kind, catalog.items[kind], segment);
  if (!found) return null;
  const { item, canonical } = found;
  if (!canonical) return { redirect: enc(item.path) };

  const { intro, listHtml } = introOf(item, catalog);
  const siblings = catalog.items[kind].filter((i) => i.group === item.group && i.key !== item.key).slice(0, 40);
  const url = `${SITE_URL}${enc(item.path)}`;
  const bodyHtml =
    '<article>' +
    `<h1>${escapeHtml(item.title)} — ${escapeHtml(ACTIVITY_KIND_LABEL[kind])}</h1>` +
    `<p>${escapeHtml(intro)}</p>` +
    (item.blurb ? `<p>${escapeHtml(item.blurb)}</p>` : '') +
    listHtml +
    `<p><a href="${escapeHtml(item.sourceHref)}">${escapeHtml(item.sourceLabel)}</a> · <a href="/">탱고북 둘러보기</a> · <a href="/activity">활동 모음</a></p>` +
    (siblings.length
      ? `<h2>${escapeHtml(item.group)} 더 보기</h2><ul>${siblings
          .map((s) => `<li><a href="${enc(s.path)}">${escapeHtml(s.title)}</a></li>`)
          .join('')}</ul>`
      : '') +
    '</article>';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: item.title,
    description: intro,
    url,
    isAccessibleForFree: true,
    inLanguage: 'ko',
    provider: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
  };
  return {
    title: escapeHtml(titleOf(item)),
    description: escapeHtml(summarize(`${intro} ${item.blurb ?? ''}`)),
    canonical: url,
    ogImage: abs(item.image),
    jsonLdHtml: `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
    bodyHtml,
    alternatesHtml: '',
  };
}

export function renderActivityHubSeo(catalog: ActivityCatalog): AboutSeo {
  const intro = '인쇄해서 하고, 온라인에서도 바로 하는 무료 활동 모음 — 색칠도안 · 숨은그림찾기 · 한글 학습지 · 영어 파닉스 학습지.';
  const sections = ACTIVITY_KINDS.map((k) => {
    const items = catalog.items[k];
    const first = items[0];
    return (
      `<h2>${escapeHtml(ACTIVITY_KIND_LABEL[k])} (${items.length})</h2>` +
      (first ? `<p><a href="${enc(first.path)}">${escapeHtml(ACTIVITY_KIND_LABEL[k])} 시작하기</a></p>` : '') +
      `<ul>${items
        .slice(0, 20)
        .map((i) => `<li><a href="${enc(i.path)}">${escapeHtml(i.title)}</a></li>`)
        .join('')}</ul>`
    );
  }).join('');
  const url = `${SITE_URL}/activity`;
  return {
    title: escapeHtml('무료 색칠도안 · 숨은그림찾기 · 한글/영어 학습지 | 탱고북'),
    description: escapeHtml(intro),
    canonical: url,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: '탱고북 활동 모음', url,
    })}</script>`,
    bodyHtml: `<article><h1>활동 모음</h1><p>${escapeHtml(intro)}</p>${sections}<p><a href="/">탱고북 둘러보기</a></p></article>`,
    alternatesHtml: '',
  };
}
```

⚠️ `enc`: 경로 앞 세 조각(`''`, `activity`, `kind`)은 그대로, 마지막 slug 만 인코딩한다. 테스트의 canonical 기대값과 맞는지 Step 4 에서 확인하고, 다르면 `enc` 를 고친다(테스트를 고치지 말 것).

- [ ] **Step 4: 통과 확인**

Run: `cd packages/server && ./node_modules/.bin/vitest run src/services/seo-activity.service.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add packages/server/src/services/seo-activity.service.ts packages/server/src/services/seo-activity.service.test.ts
git commit -m "feat(seo): server-rendered activity hub and item pages"
```

### Task 7: `app.ts` 라우트 · `/worksheet*` 301 · 파닉스 SEO 링크

**Files:**
- Modify: `packages/server/src/app.ts` (파닉스 SEO 라우트 `app.get('/library/phonics/:track/:unitId/about'…)` 바로 아래 — `express.static` 보다 앞)
- Modify: `packages/server/src/services/seo-phonics.service.ts` (`<a href="/worksheet/">인쇄용 활동지</a>`)

- [ ] **Step 1: 라우트 추가**

```ts
    /**
     * 활동 모음 — 스펙 docs/superpowers/specs/2026-09-14-activity-hub-design.md
     * 🔴 `express.static` 보다 **앞**이어야 한다 — `dist/worksheet/` 같은 폴더가 있으면 static 이
     *    `/worksheet` 를 폴더로 보고 `/worksheet/` 로 먼저 301 한다(`/library` 에서 겪은 함정).
     */
    app.get('/worksheet', (_req, res) => res.redirect(301, '/activity'));
    app.get('/worksheet/hangul', (_req, res) => res.redirect(301, '/activity/hangul/kr-h1-u01'));
    app.get('/worksheet/english', (_req, res) => res.redirect(301, '/activity/english/en-b1-u01'));
    app.get('/activity', (_req, res, next) =>
      sendSeo(res, next, async () => {
        const { loadActivityCatalog, renderActivityHubSeo } = await import('./services/seo-activity.service.js');
        return renderActivityHubSeo(loadActivityCatalog(clientDist));
      })
    );
    app.get('/activity/:kind/:slug', (req, res, next) => {
      const kind = String(req.params.kind);
      if (!['hangul', 'english', 'coloring', 'hidden-object'].includes(kind)) return next();
      return sendSeo(res, next, async () => {
        const { loadActivityCatalog, renderActivitySeo } = await import('./services/seo-activity.service.js');
        const out = renderActivitySeo(
          kind as 'hangul' | 'english' | 'coloring' | 'hidden-object',
          String(req.params.slug),
          loadActivityCatalog(clientDist)
        );
        // 없는 키 = 404. SPA 셸은 catch-all 이 그대로 그리되 상태 코드는 404 로 남는다(soft-404 금지).
        if (!out) res.status(404);
        return out;
      });
    });
```

⚠️ Express 5 는 `req.params.slug` 를 **디코드해서** 준다 — `findActivity` 는 디코드된 값을 받는다(스펙 §1). Step 3 에서 한글 slug 로 확인한다.

- [ ] **Step 2: 파닉스 SEO 링크 두 곳** — `seo-phonics.service.ts`:
  - 110행(단원 페이지, 작은따옴표 문자열): `'<a href="/worksheet/">인쇄용 활동지</a> · <a href="/library">동화책 보기</a></p>' +` →
    `` `<a href="/activity/${track === 'korean' ? 'hangul' : 'english'}/${u.id}">인쇄용 활동지</a> · <a href="/library">동화책 보기</a></p>` + ``
  - 194행(트랙 페이지, `u` 없음): `'<a href="/worksheet/">인쇄용 활동지</a>…` 의 `/worksheet/` → `/activity`.
  테스트: `./node_modules/.bin/vitest run src/services/seo-phonics.service.test.ts` PASS.

- [ ] **Step 3: 응답 확인은 빌드된 서버로** — 🔴 `app.ts` 의 SSR 라우트·`sendSeo`·catch-all 은 전부 `NODE_ENV === 'production'` 블록 안이라 **개발 서버(`preview_start dev`)에는 이 라우트가 없다**. 여기서는 `pnpm build` 후 Task 13 Step 3 방식(빌드 서버 `PORT=3611 NODE_ENV=production`)으로 아래를 확인한다:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3611/worksheet
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "localhost:3611/activity/coloring/bk-0001"
curl -s -o /dev/null -w "%{http_code}\n" "localhost:3611/activity/coloring/bk-9999-x"
# 한글 정규 slug(인코딩) 한 장 — 200 이어야 한다(Express 가 디코드해서 넘기는지)
curl -s -o /dev/null -w "%{http_code}\n" "localhost:3611$(node -e "const s=require('./packages/shared/dist/index.js');const d=require('./packages/client/public/activity-data/coloring.json');const it=s.coloringItems(d).find(i=>i.key.startsWith('bk-'));console.log('/activity/coloring/'+encodeURIComponent(it.slug))")"
curl -s "localhost:3611/activity/hidden-object/$(node -e "const d=require('./packages/client/public/activity-data/hidden-object.json');console.log(encodeURIComponent(d[0].key))")" -o /dev/null -w "%{http_code} %{redirect_url}\n"
```

Expected: `301 …/activity` · `301 …/activity/coloring/bk-0001-…` · `404` · `301` 정규 주소로. 정규 주소를 curl 하면 `200` 이고 `<h1>` 이 들어 있다.

- [ ] **Step 4: 서버 타입·테스트**

Run: `cd packages/server && ./node_modules/.bin/tsc --noEmit -p . && ./node_modules/.bin/vitest run`
Expected: 에러 없음, 전부 PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/server/src/app.ts packages/server/src/services/seo-phonics.service.ts
git commit -m "feat(server): activity routes and 301 from the old worksheet pages"
```

---

## Chunk 4: 클라이언트 화면

### Task 8: 카탈로그 훅 · GA 헬퍼

**Files:**
- Create: `packages/client/src/features/activity/hooks/useActivityCatalog.ts`
- Create: `packages/client/src/features/activity/lib/track.ts`

- [ ] **Step 1: 훅**

```ts
// packages/client/src/features/activity/hooks/useActivityCatalog.ts
import { useQuery } from '@tanstack/react-query';
import {
  coloringItems,
  hiddenObjectItems,
  worksheetItems,
  type ActivityItem,
  type ActivityKind,
  type ColoringCatalogEntry,
  type HiddenObjectCatalogEntry,
} from '@tangobook/shared';

const getJson = async <T,>(url: string): Promise<T> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return (await r.json()) as T;
};

/** 활동 종류별 목록 — 워크지는 커리큘럼(즉시), 색칠·숨은그림은 `/activity-data/*.json`. */
export function useActivityItems(kind: ActivityKind): {
  items: ActivityItem[];
  hiddenWords: Map<string, string[]>;
  coloringEntries: Map<string, ColoringCatalogEntry>;
  hiddenEntries: Map<string, HiddenObjectCatalogEntry>;
  loading: boolean;
} {
  const coloring = useQuery({
    queryKey: ['activity-data', 'coloring'],
    queryFn: () => getJson<ColoringCatalogEntry[]>('/activity-data/coloring.json'),
    enabled: kind === 'coloring',
    staleTime: 60 * 60 * 1000,
  });
  const hidden = useQuery({
    queryKey: ['activity-data', 'hidden-object'],
    queryFn: () => getJson<HiddenObjectCatalogEntry[]>('/activity-data/hidden-object.json'),
    enabled: kind === 'hidden-object',
    staleTime: 60 * 60 * 1000,
  });
  if (kind === 'hangul' || kind === 'english') {
    return { items: worksheetItems(kind), hiddenWords: new Map(), coloringEntries: new Map(), hiddenEntries: new Map(), loading: false };
  }
  if (kind === 'coloring') {
    const data = coloring.data ?? [];
    return {
      items: coloringItems(data),
      hiddenWords: new Map(),
      coloringEntries: new Map(data.map((e) => [e.key, e])),
      hiddenEntries: new Map(),
      loading: coloring.isLoading,
    };
  }
  const data = hidden.data ?? [];
  return {
    items: hiddenObjectItems(data),
    hiddenWords: new Map(data.map((h) => [h.key, h.words])),
    coloringEntries: new Map(),
    hiddenEntries: new Map(data.map((h) => [h.key, h])),
    loading: hidden.isLoading,
  };
}
```

⚠️ 매 렌더 새 배열을 만든다 — 목록 크기(최대 2,251)면 문제 없지만, 자식이 `items` 로 effect 를 돌리면 `useMemo` 로 감싼다.

- [ ] **Step 2: GA 헬퍼**

```ts
// packages/client/src/features/activity/lib/track.ts
/** GA4 이벤트 — gtag 가 없으면(광고차단·개발) 조용히 아무것도 안 한다. */
export function trackActivity(
  event: 'activity_print' | 'activity_play' | 'activity_cta',
  params: { kind: string; key: string }
): void {
  (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('event', event, params);
}
```

- [ ] **Step 3: 타입 확인** — `cd packages/client && ./node_modules/.bin/tsc --noEmit -p .` (shared 가 새 export 를 dist 없이 src 로 해석하는지 확인; 에러면 client tsconfig paths 가 shared src 를 보는지 확인)

- [ ] **Step 4: 커밋**

```bash
git add packages/client/src/features/activity/hooks/useActivityCatalog.ts packages/client/src/features/activity/lib/track.ts
git commit -m "feat(activity): catalog hook and GA4 event helper"
```

### Task 9: 틀 — `ActivityLayout` · `ActivityList` · `ActivityCta`

**Files:**
- Create: `packages/client/src/features/activity/components/ActivityList.tsx`
- Create: `packages/client/src/features/activity/components/ActivityCta.tsx`
- Create: `packages/client/src/features/activity/components/ActivityLayout.tsx`

- [ ] **Step 1: `ActivityList`**

```tsx
// packages/client/src/features/activity/components/ActivityList.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ActivityItem } from '@tangobook/shared';
import { cn } from '@/lib/cn';

/**
 * 왼쪽 목록 — 갈래로 접고 편다. 🔴 항목은 `<Link>`(= `<a href>`) — 크롤러가 따라간다.
 * 🔴 썸네일을 안 건다 — 도안 한 장 200KB 라 2,000장을 걸면 첫 화면이 죽는다.
 */
export function ActivityList({ items, currentKey }: { items: ActivityItem[]; currentKey?: string }) {
  const [q, setQ] = useState('');
  const current = items.find((i) => i.key === currentKey);
  const currentGroup = current?.group;
  const [open, setOpen] = useState<Set<string>>(() => new Set(current ? [current.group] : []));
  // 목록 JSON 이 늦게 오면 첫 렌더엔 current 가 없다 — 오면 그 갈래를 펼친다.
  useEffect(() => {
    if (currentGroup) setOpen((s) => new Set(s).add(currentGroup));
  }, [currentGroup]);
  const groups = useMemo(() => {
    const m = new Map<string, ActivityItem[]>();
    const needle = q.trim();
    for (const it of items) {
      if (needle && !`${it.title} ${it.section}`.includes(needle)) continue;
      m.set(it.group, [...(m.get(it.group) ?? []), it]);
    }
    return [...m.entries()];
  }, [items, q]);

  return (
    <nav aria-label="활동 목록" className="flex flex-col gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 낱말·제목 찾기"
        className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm"
      />
      <div className="flex flex-col gap-1">
        {groups.map(([group, list]) => {
          const isOpen = !!q.trim() || open.has(group);
          return (
            <div key={group}>
              <button
                onClick={() =>
                  setOpen((s) => {
                    const n = new Set(s);
                    if (n.has(group)) n.delete(group);
                    else n.add(group);
                    return n;
                  })
                }
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm font-bold text-ink-700 hover:bg-peach-100"
              >
                <span>{isOpen ? '▾' : '▸'} {group}</span>
                <span className="text-xs font-medium text-ink-500">{list.length}</span>
              </button>
              {isOpen && (
                <ul className="ml-3 border-l border-ink-100 pl-2">
                  {list.map((it) => (
                    <li key={it.key}>
                      <Link
                        to={it.path}
                        className={cn(
                          'block truncate rounded px-2 py-1 text-sm',
                          it.key === currentKey ? 'bg-coral-100 font-bold text-coral-700' : 'text-ink-700 hover:bg-peach-100'
                        )}
                      >
                        {it.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: `ActivityCta`**

```tsx
// packages/client/src/features/activity/components/ActivityCta.tsx
import { Link } from 'react-router-dom';
import type { ActivityItem } from '@tangobook/shared';
import { trackActivity } from '../lib/track';

/** 사이트로 잇는 버튼 — 🔴 모든 활동 페이지에 둔다(유입이 목적, 사용자 2026-09-14). */
export function ActivityCta({ item, next }: { item: ActivityItem; next?: ActivityItem | null }) {
  const cta = () => trackActivity('activity_cta', { kind: item.kind, key: item.key });
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Link to={item.sourceHref} onClick={cta} className="inline-flex min-h-[48px] items-center rounded-full bg-coral-600 px-5 text-base font-extrabold text-white shadow hover:bg-coral-700">
        {item.sourceLabel}
      </Link>
      <Link to="/" onClick={cta} className="inline-flex min-h-[48px] items-center rounded-full border-2 border-coral-300 bg-white px-5 text-base font-bold text-coral-700 hover:bg-coral-50">
        탱고북 둘러보기
      </Link>
      {next && (
        <Link to={next.path} className="ml-auto text-sm font-bold text-ink-700 underline-offset-4 hover:underline">
          다음 도안: {next.title} →
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `ActivityLayout`**

```tsx
// packages/client/src/features/activity/components/ActivityLayout.tsx
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ACTIVITY_KINDS, ACTIVITY_KIND_LABEL, type ActivityItem, type ActivityKind } from '@tangobook/shared';
import { PublicNav } from '@/components/PublicNav';
import { cn } from '@/lib/cn';
import { ActivityList } from './ActivityList';

/** 종류 탭 링크 — 워크지는 첫 단원, 색칠·숨은그림은 `summary.json` 의 첫 키(정규 slug 는 페이지가 replace 한다). */
function useFirstPaths(): Record<ActivityKind, string> {
  const { data } = useQuery({
    queryKey: ['activity-data', 'summary'],
    queryFn: async () => (await fetch('/activity-data/summary.json')).json() as Promise<Record<string, { count: number; firstKey: string | null }>>,
    staleTime: 60 * 60 * 1000,
  });
  return {
    hangul: '/activity/hangul/kr-h1-u01',
    english: '/activity/english/en-b1-u01',
    coloring: data?.coloring?.firstKey ? `/activity/coloring/${data.coloring.firstKey}` : '/activity',
    'hidden-object': data?.['hidden-object']?.firstKey ? `/activity/hidden-object/${data['hidden-object'].firstKey}` : '/activity',
  };
}

/** 네 종류가 같은 틀 — 종류 탭 · 왼쪽 목록 · 오른쪽 활동. 인쇄 때는 오른쪽 미리보기만 남는다. */
export function ActivityLayout({
  kind,
  items,
  currentKey,
  children,
}: {
  kind: ActivityKind;
  items: ActivityItem[];
  currentKey?: string;
  children: ReactNode;
}) {
  const [listOpen, setListOpen] = useState(false);
  const firstPath = useFirstPaths();
  return (
    <>
      <div className="print:hidden">
        <PublicNav />
      </div>
      <main className="min-h-screen bg-cream-50 px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex gap-2 overflow-x-auto print:hidden">
            {ACTIVITY_KINDS.map((k) => (
              <Link
                key={k}
                to={k === kind && items[0] ? items[0].path : firstPath[k]}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-bold',
                  k === kind ? 'bg-coral-600 text-white' : 'bg-white text-ink-700 hover:bg-peach-100'
                )}
              >
                {ACTIVITY_KIND_LABEL[k]}
              </Link>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
            <aside className="print:hidden">
              <button onClick={() => setListOpen((v) => !v)} className="mb-2 w-full rounded-lg bg-white px-3 py-2 text-left text-sm font-bold md:hidden">
                ☰ 목록 {listOpen ? '접기' : '보기'}
              </button>
              <div className={cn(listOpen ? 'block' : 'hidden', 'md:block md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto')}>
                <ActivityList items={items} currentKey={currentKey} />
              </div>
            </aside>
            <section className="min-w-0">{children}</section>
          </div>
        </div>
      </main>
    </>
  );
}
```

⚠️ PublicNav 가 `sticky top-0` 이라 사이드바는 `md:top-24` 로 그 아래에 붙인다(실측 후 네비 높이에 맞춰 조정).

- [ ] **Step 4: 타입 확인** — `./node_modules/.bin/tsc --noEmit -p .` · `npx eslint src/features/activity`

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/activity/components/ActivityList.tsx packages/client/src/features/activity/components/ActivityCta.tsx packages/client/src/features/activity/components/ActivityLayout.tsx
git commit -m "feat(activity): shared layout — kind tabs, grouped list, site CTA"
```

### Task 10: 패널 셋

**Files:**
- Create: `packages/client/src/features/activity/components/panels/ColoringPanel.tsx`
- Create: `packages/client/src/features/activity/components/panels/HiddenObjectPanel.tsx`
- Create: `packages/client/src/features/activity/components/panels/WorksheetPanel.tsx`

- [ ] **Step 1: 공용 머리줄은 각 패널 안에 둔다**(패널마다 인쇄 동작이 달라 한 컴포넌트로 묶지 않는다). 버튼 클래스 상수를 파일마다 복사하지 말고 `ColoringPanel.tsx` 에 export 해 나머지가 import 한다:

```tsx
// packages/client/src/features/activity/components/panels/ColoringPanel.tsx
import { lazy, Suspense, useState } from 'react';
import type { ActivityItem, ColoringCatalogEntry } from '@tangobook/shared';
import { ActivityCta } from '../ActivityCta';
import { trackActivity } from '../../lib/track';

const ColoringPlayer = lazy(() =>
  import('@/features/games/components/players/ColoringPlayer').then((m) => ({ default: m.ColoringPlayer }))
);

export const BTN =
  'inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-extrabold shadow-sm print:hidden';

export function PanelHeader({ title, onPlay, onPrint, playLabel = '🎮 온라인으로 하기' }: { title: string; onPlay: () => void; onPrint: () => void; playLabel?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <h1 className="mr-auto font-display text-2xl font-extrabold text-ink-900 break-keep sm:text-3xl">{title}</h1>
      <button onClick={onPlay} className={`${BTN} bg-mint-500 text-white hover:bg-mint-600`}>{playLabel}</button>
      <button onClick={onPrint} className={`${BTN} bg-white text-ink-700 hover:bg-peach-100`}>🖨 인쇄</button>
    </div>
  );
}

export function ColoringPanel({ item, entry, next }: { item: ActivityItem; entry: ColoringCatalogEntry; next: ActivityItem | null }) {
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  return (
    <div>
      <PanelHeader
        title={`${item.title} 색칠도안`}
        onPlay={() => { trackActivity('activity_play', { kind: item.kind, key: item.key }); setPlaying(true); }}
        onPrint={() => { trackActivity('activity_print', { kind: item.kind, key: item.key }); window.print(); }}
      />
      {finished && <div className="mb-3 rounded-xl bg-peach-100 p-3 print:hidden"><p className="mb-2 font-bold">다 칠했어요! 🎉</p><ActivityCta item={item} next={next} /></div>}
      <figure className="rounded-2xl bg-white p-4 shadow-sm print:shadow-none print:p-0">
        <img src={entry.lineartUrl} alt={`${item.title} 색칠도안`} className="mx-auto max-h-[70vh] w-auto print:max-h-[250mm]" />
        <figcaption className="mt-2 text-center font-display text-2xl font-extrabold">{item.title}</figcaption>
      </figure>
      {item.blurb && <p className="mt-3 text-ink-700 print:hidden">{item.blurb}</p>}
      <div className="mt-4"><ActivityCta item={item} next={next} /></div>
      {playing && (
        <Suspense fallback={null}>
          <ColoringPlayer
            items={[{
              word: entry.word,
              lineartUrl: entry.lineartUrl,
              colorSourceUrl: entry.answerUrl ?? entry.originalUrl ?? '',
              originalUrl: entry.originalUrl,
              language: entry.language ?? 'korean',
              storybookId: entry.bookId ?? entry.unitId,
            }]}
            onBack={() => setPlaying(false)}
            // 🔴 플레이어는 `fixed inset-0` 이라 그 뒤에 그린 CTA 는 안 보인다 — 다 칠한 그림을 잠깐 보여 준 뒤
            //    게임을 닫고 CTA 를 띄운다(원본 그림이 드러나는 연출 시간만큼).
            onDone={() => {
              window.setTimeout(() => {
                setPlaying(false);
                setFinished(true);
              }, 3000);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `HiddenObjectPanel`**

```tsx
// packages/client/src/features/activity/components/panels/HiddenObjectPanel.tsx
import { lazy, Suspense, useMemo, useState } from 'react';
import type { ActivityItem, HiddenObjectCatalogEntry } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { buildHiddenObjectSceneData } from '@/features/games/lib/hidden-object-data';
import { ActivityCta } from '../ActivityCta';
import { PanelHeader } from './ColoringPanel';
import { trackActivity } from '../../lib/track';

const HiddenObjectPlayer = lazy(() =>
  import('@/features/games/components/players/HiddenObjectPlayer').then((m) => ({ default: m.HiddenObjectPlayer }))
);

export function HiddenObjectPanel({ item, entry, next }: { item: ActivityItem; entry: HiddenObjectCatalogEntry; next: ActivityItem | null }) {
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  // 책은 「온라인으로」 누른 뒤에만 받는다.
  const { data: book } = useStorybook(playing ? entry.bookId : '');
  const gameData = useMemo(() => buildHiddenObjectSceneData(book, undefined, entry.key), [book, entry.key]);

  return (
    <div>
      <PanelHeader
        title={`${item.title} 숨은그림찾기`}
        onPlay={() => { trackActivity('activity_play', { kind: item.kind, key: item.key }); setPlaying(true); }}
        onPrint={() => { trackActivity('activity_print', { kind: item.kind, key: item.key }); window.print(); }}
      />
      {finished && <div className="mb-3 rounded-xl bg-peach-100 p-3 print:hidden"><p className="mb-2 font-bold">다 찾았어요! 🎉</p><ActivityCta item={item} next={next} /></div>}
      <figure className="rounded-2xl bg-white p-4 shadow-sm print:shadow-none print:p-0">
        <img src={entry.sceneImageUrl} alt={`${item.title} 숨은그림찾기`} className="mx-auto max-h-[62vh] w-auto print:max-h-[200mm]" />
        <figcaption className="mt-3">
          <p className="mb-2 font-bold">찾을 것 {entry.words.length}가지</p>
          <ul className="flex flex-wrap gap-2">
            {entry.words.map((w) => (
              <li key={w} className="rounded-full border-2 border-ink-100 px-3 py-1 text-lg">☐ {w}</li>
            ))}
          </ul>
        </figcaption>
      </figure>
      <div className="mt-4"><ActivityCta item={item} next={next} /></div>
      {playing && book && !gameData && (
        <p className="mt-3 rounded bg-peach-100 p-3 print:hidden">이 그림은 지금 준비 중이에요.</p>
      )}
      {playing && gameData && (
        <Suspense fallback={null}>
          <HiddenObjectPlayer
            storybookId={entry.bookId}
            gameData={gameData}
            difficulty="easy"
            // 🔴 onComplete 는 결과 화면이 뜨는 순간 불린다 — 여기서 닫으면 결과 화면을 못 본다. 닫기는 onBack 만.
            onComplete={() => setFinished(true)}
            onBack={() => setPlaying(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
```

(`useStorybook('')` 은 `enabled: !!id` 라 요청을 안 보낸다 — 확인됨.)

- [ ] **Step 3: `WorksheetPanel`**

```tsx
// packages/client/src/features/activity/components/panels/WorksheetPanel.tsx
import { lazy, Suspense, useState } from 'react';
import { flattenPhonicsUnits, type ActivityItem } from '@tangobook/shared';
import { ActivityCta } from '../ActivityCta';
import { PanelHeader } from './ColoringPanel';
import { trackActivity } from '../../lib/track';

const PhonicsTryIt = lazy(() =>
  import('@/features/phonics-learner/components/PhonicsTryIt').then((m) => ({ default: m.PhonicsTryIt }))
);

const PRINT_FILE = { hangul: '/worksheet/ko_phonics.html', english: '/worksheet/en_phonics.html' } as const;

export function WorksheetPanel({ item, next }: { item: ActivityItem & { kind: 'hangul' | 'english' }; next: ActivityItem | null }) {
  const [playing, setPlaying] = useState(false);
  const track = item.kind === 'hangul' ? 'korean' : 'english';
  const u = flattenPhonicsUnits(track).find((x) => x.id === item.key);
  const combos = u ? (u.syllables.length ? u.syllables : u.patterns) : [];

  return (
    <div>
      <PanelHeader
        title={`${item.title} ${item.kind === 'hangul' ? '한글 학습지' : '영어 파닉스 학습지'}`}
        onPlay={() => { trackActivity('activity_play', { kind: item.kind, key: item.key }); setPlaying(true); }}
        // 🔴 워크지는 여러 쪽 HTML 이라 페이지 인쇄가 아니라 인쇄물을 그 단원으로 새 탭에서 연다(해시로 단원 선택).
        onPrint={() => { trackActivity('activity_print', { kind: item.kind, key: item.key }); window.open(`${PRINT_FILE[item.kind]}#${item.key}`, '_blank', 'noopener'); }}
      />
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-ink-500">{item.group}</p>
        {u?.phonemes.length ? <p className="mt-2"><b>배우는 소리</b> · {u.phonemes.join(' · ')}</p> : null}
        {combos.length ? <p className="mt-1"><b>만드는 글자</b> · {combos.slice(0, 20).join(' ')}</p> : null}
        {u?.sampleWords.length ? <p className="mt-1"><b>읽는 낱말</b> · {u.sampleWords.join(' · ')}</p> : null}
      </div>
      {playing && (
        <div className="mt-4 print:hidden">
          <Suspense fallback={null}>
            <PhonicsTryIt unitId={item.key} language={track} />
          </Suspense>
        </div>
      )}
      <div className="mt-4"><ActivityCta item={item} next={next} /></div>
    </div>
  );
}
```

(스펙의 「낱말 카드 4장」은 카드 그림이 R2 책 데이터에만 있어 요청을 하나 더 만든다 — 1차는 낱말 글자만. 필요하면 후속.)

- [ ] **Step 4: 확인** — `./node_modules/.bin/tsc --noEmit -p .` · `npx eslint src/features/activity`. `mint-500`·`mint-600`·`coral-600`·`coral-700`·`peach-100`·`cream-50`·`ink-100/500/700/900` 이 `design-system/tokens/colors.ts` 램프에 있는지 확인(없는 셰이드는 Tailwind 가 조용히 무시한다).

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/activity/components/panels
git commit -m "feat(activity): coloring, hidden-object and worksheet panels — preview, print, play"
```

### Task 11: 페이지 · 라우터 · 네비

**Files:**
- Create: `packages/client/src/pages/ActivityPage.tsx`, `packages/client/src/pages/ActivityHubPage.tsx`
- Modify: `packages/client/src/router/index.tsx`, `packages/client/src/components/PublicNav.tsx`
- Delete: `packages/client/src/pages/WorksheetHubPage.tsx`, `packages/client/src/pages/WorksheetPage.tsx`

- [ ] **Step 1: `ActivityPage`**

```tsx
// packages/client/src/pages/ActivityPage.tsx
import { Link, Navigate, useParams } from 'react-router-dom';
import { findActivity, nextInGroup, ACTIVITY_KIND_LABEL, type ActivityKind } from '@tangobook/shared';
import { useSeo } from '@/lib/useSeo';
import { ActivityLayout } from '@/features/activity/components/ActivityLayout';
import { useActivityItems } from '@/features/activity/hooks/useActivityCatalog';
import { ColoringPanel } from '@/features/activity/components/panels/ColoringPanel';
import { HiddenObjectPanel } from '@/features/activity/components/panels/HiddenObjectPanel';
import { WorksheetPanel } from '@/features/activity/components/panels/WorksheetPanel';

/** 활동 한 장 — 서버 SSR(`seo-activity.service`)의 짝 페이지. 🔴 게이트로 감싸지 않는다. */
export default function ActivityPage({ kind }: { kind: ActivityKind }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const { items, coloringEntries, hiddenEntries, loading } = useActivityItems(kind);
  const found = findActivity(kind, items, slug);

  useSeo({
    title: found ? `${found.item.title} — ${ACTIVITY_KIND_LABEL[kind]} | 탱고북` : undefined,
    description: found?.item.blurb,
    // 서버 canonical 과 같게 slug 는 인코딩한다(주소를 두 벌로 말하지 않게).
    path: found ? `/activity/${kind}/${encodeURIComponent(found.item.slug)}` : `/activity/${kind}/${encodeURIComponent(slug)}`,
    image: found?.item.image,
  });

  if (loading) return <ActivityLayout kind={kind} items={items}><p className="p-8 text-ink-500">불러오는 중…</p></ActivityLayout>;
  if (!found) {
    return (
      <ActivityLayout kind={kind} items={items}>
        <div className="rounded-2xl bg-white p-8">
          <h1 className="text-2xl font-extrabold">찾는 활동이 없어요</h1>
          <Link to="/activity" className="mt-4 inline-block font-bold text-coral-700 underline">활동 모음으로</Link>
        </div>
      </ActivityLayout>
    );
  }
  if (!found.canonical) return <Navigate to={found.item.path} replace />;

  const { item } = found;
  const next = nextInGroup(items, item.key);
  return (
    <ActivityLayout kind={kind} items={items} currentKey={item.key}>
      {kind === 'coloring' && <ColoringPanel key={item.key} item={item} entry={coloringEntries.get(item.key)!} next={next} />}
      {kind === 'hidden-object' && <HiddenObjectPanel key={item.key} item={item} entry={hiddenEntries.get(item.key)!} next={next} />}
      {(kind === 'hangul' || kind === 'english') && (
        <WorksheetPanel key={item.key} item={item as typeof item & { kind: 'hangul' | 'english' }} next={next} />
      )}
    </ActivityLayout>
  );
}
```

⚠️ React Router 는 `useParams` 로 **디코드된** slug 를 준다 — `findActivity` 와 맞다. `key={item.key}` 로 항목이 바뀌면 패널 상태(재생 중)를 초기화한다.

- [ ] **Step 2: `ActivityHubPage`**

```tsx
// packages/client/src/pages/ActivityHubPage.tsx
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ACTIVITY_KINDS, ACTIVITY_KIND_LABEL, worksheetItems } from '@tangobook/shared';
import { useSeo } from '@/lib/useSeo';
import { PublicNav } from '@/components/PublicNav';
import { trackActivity } from '@/features/activity/lib/track';

const BLURB = {
  hangul: '자음·모음부터 받침까지 32단원',
  english: '알파벳 소리부터 매직 e 까지 39단원',
  coloring: '동화책·파닉스 낱말 그림을 색칠해요',
  'hidden-object': '동화 속 장면에서 숨은 것을 찾아요',
} as const;

/** 🔴 허브는 900KB 목록을 받지 않는다 — 워크지는 커리큘럼, 색칠·숨은그림은 `summary.json`(개수 · 첫 키). */
function KindCard({ kind }: { kind: (typeof ACTIVITY_KINDS)[number] }) {
  const { data } = useQuery({
    queryKey: ['activity-data', 'summary'],
    queryFn: async () => (await fetch('/activity-data/summary.json')).json() as Promise<Record<string, { count: number; firstKey: string | null }>>,
    staleTime: 60 * 60 * 1000,
  });
  const ws = kind === 'hangul' || kind === 'english' ? worksheetItems(kind) : null;
  const count = ws ? ws.length : data?.[kind]?.count;
  const to = ws ? ws[0].path : data?.[kind]?.firstKey ? `/activity/${kind}/${data[kind].firstKey}` : '/activity';
  return (
    <Link to={to} className="block rounded-3xl bg-white p-6 shadow-sm hover:shadow-md">
      <h2 className="font-display text-2xl font-extrabold text-ink-900">{ACTIVITY_KIND_LABEL[kind]}</h2>
      <p className="mt-2 text-ink-700 break-keep">{BLURB[kind]}</p>
      <p className="mt-3 text-sm font-bold text-coral-700">{count ? `${count}개 · 인쇄 · 온라인` : '불러오는 중…'}</p>
    </Link>
  );
}

export default function ActivityHubPage() {
  useSeo({
    title: '무료 색칠도안 · 숨은그림찾기 · 한글/영어 학습지 | 탱고북',
    description: '인쇄해서 하고, 온라인에서도 바로 하는 무료 활동 모음 — 색칠도안 · 숨은그림찾기 · 한글 학습지 · 영어 파닉스 학습지.',
    path: '/activity',
  });
  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-center font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">활동 모음</h1>
          <p className="mt-3 text-center text-ink-700 break-keep">인쇄해서 하고, 온라인에서도 바로 해요. 가입 없이 무료.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ACTIVITY_KINDS.map((k) => <KindCard key={k} kind={k} />)}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link to="/library" onClick={() => trackActivity('activity_cta', { kind: 'hub', key: 'library' })} className="inline-flex min-h-[48px] items-center rounded-full bg-coral-600 px-6 font-extrabold text-white">📖 동화책 보러 가기</Link>
            <Link to="/" onClick={() => trackActivity('activity_cta', { kind: 'hub', key: 'home' })} className="inline-flex min-h-[48px] items-center rounded-full border-2 border-coral-300 bg-white px-6 font-bold text-coral-700">탱고북 둘러보기</Link>
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 3: 라우터** — `router/index.tsx`:
  1. `const WorksheetHubPage = lazy(...)`·`const WorksheetPage = lazy(...)` 두 줄을 지우고 추가:
     ```tsx
     const ActivityHubPage = lazy(() => import('../pages/ActivityHubPage'));
     const ActivityPage = lazy(() => import('../pages/ActivityPage'));
     ```
  2. `path: 'worksheet'`·`path: 'worksheet/:track'` 두 라우트 객체를 아래로 교체(주석 「인쇄 학습지 — AppShell 밖 풀화면. 🔴 게이트로 감싸지 않는다」는 유지):
     ```tsx
     { path: 'worksheet', element: <Navigate to="/activity" replace /> },
     { path: 'worksheet/hangul', element: <Navigate to="/activity/hangul/kr-h1-u01" replace /> },
     { path: 'worksheet/english', element: <Navigate to="/activity/english/en-b1-u01" replace /> },
     { path: 'activity', element: <ErrorBoundary><ActivityHubPage /></ErrorBoundary> },
     // 🔴 종류는 정적 세그먼트 네 줄 — `:kind` 로 두면 다른 라우트와 점수 경합.
     { path: 'activity/hangul/:slug', element: <ErrorBoundary><ActivityPage kind="hangul" /></ErrorBoundary> },
     { path: 'activity/english/:slug', element: <ErrorBoundary><ActivityPage kind="english" /></ErrorBoundary> },
     { path: 'activity/coloring/:slug', element: <ErrorBoundary><ActivityPage kind="coloring" /></ErrorBoundary> },
     { path: 'activity/hidden-object/:slug', element: <ErrorBoundary><ActivityPage kind="hidden-object" /></ErrorBoundary> },
     ```
     (`Navigate` 가 이미 import 돼 있는지 확인. lazy 페이지를 감싸는 `Suspense` 가 부모에 있는지 기존 worksheet 라우트와 같은 자리이므로 그대로 둔다.)
  3. `git rm packages/client/src/pages/WorksheetHubPage.tsx packages/client/src/pages/WorksheetPage.tsx`
- [ ] **Step 4: 네비** — `PublicNav.tsx` 의 `{ to: '/worksheet', k: 'worksheet' }` → `{ to: '/activity', k: 'worksheet' }`, 아래 🔜 주석 두 줄(색칠·숨은그림 링크 예정)은 지운다(허브에 들어갔다).
- [ ] **Step 5: 확인** — `./node_modules/.bin/tsc --noEmit -p .` · `./node_modules/.bin/vitest run src/components src/pages` (PublicNav 테스트가 `/worksheet` 를 기대하면 새 의도에 맞춰 `/activity` 로 고친다) · `grep -rn "WorksheetPage\|WorksheetHubPage\|WORKSHEET_TRACKS" packages/client/src` 결과 0.
- [ ] **Step 6: 커밋**

```bash
git add packages/client/src/pages/ActivityPage.tsx packages/client/src/pages/ActivityHubPage.tsx packages/client/src/router/index.tsx packages/client/src/components/PublicNav.tsx
git commit -m "feat(activity): activity hub and item pages; old worksheet pages redirect"
```

---

## Chunk 5: 색인 · 검증 · 문서

### Task 12: sitemap · IndexNow

**Files:**
- Modify: `packages/server/scripts/generate-sitemap.mjs` (파닉스 단원 블록 `catch` 바로 뒤)
- Modify: `packages/server/scripts/submit-indexnow.mjs` (파닉스 단원 블록 `catch` 바로 뒤)

- [ ] **Step 1: sitemap** — 추가:

```js
  // 활동 모음 — 🔴 목록은 shared activity-catalog 로 파생(IndexNow 와 같은 함수). JSON 은 build-activity-catalog.mjs 산출물.
  try {
    const shared = await import('../../shared/dist/index.js');
    const dataDir = path.join(__dirname, '..', '..', 'client', 'public', 'activity-data');
    const readJson = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
    const items = [
      ...shared.worksheetItems('hangul'),
      ...shared.worksheetItems('english'),
      ...shared.coloringItems(readJson('coloring.json')),
      ...shared.hiddenObjectItems(readJson('hidden-object.json')),
    ];
    entries.push(urlEntry({ loc: `${SITE_URL}/activity`, lastmod: today, changefreq: 'weekly', priority: 0.8 }));
    for (const it of items) {
      const loc = `${SITE_URL}/activity/${it.kind}/${encodeURIComponent(it.slug)}`;
      entries.push(urlEntry({ loc, lastmod: today, changefreq: 'monthly', priority: 0.5 }));
    }
    console.log(`[sitemap] 활동 ${items.length + 1}개`);
  } catch (e) {
    console.warn('[sitemap] ⚠️ 활동 모음 스킵 — shared 미빌드 또는 activity-data 없음?', e.message);
  }
```

(`urlEntry` 가 `&` 를 XML 이스케이프하는지 확인 — slug 는 인코딩돼 `&` 가 없다.)

- [ ] **Step 2: IndexNow** — 같은 블록을 `urls.push(...)` 형태로:

```js
  try {
    const shared = await import('../../shared/dist/index.js');
    const dataDir = path.join(__dirname, '..', '..', 'client', 'public', 'activity-data');
    const readJson = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
    const items = [
      ...shared.worksheetItems('hangul'),
      ...shared.worksheetItems('english'),
      ...shared.coloringItems(readJson('coloring.json')),
      ...shared.hiddenObjectItems(readJson('hidden-object.json')),
    ];
    urls.push(`${SITE_URL}/activity`);
    for (const it of items) urls.push(`${SITE_URL}/activity/${it.kind}/${encodeURIComponent(it.slug)}`);
  } catch (e) {
    console.warn('[indexnow] ⚠️ 활동 모음 스킵 — shared 미빌드 또는 activity-data 없음?', e.message);
  }
```

- [ ] **Step 3: 확인(쓰지 않고)** — `pnpm --filter shared build` 후 `node packages/server/scripts/submit-indexnow.mjs --dry-run` 이 활동 URL 을 포함한 개수를 찍는지 본다. sitemap 은 운영 반영 때 굽는다(아래 Task 14).
- [ ] **Step 4: 커밋**

```bash
git add packages/server/scripts/generate-sitemap.mjs packages/server/scripts/submit-indexnow.mjs
git commit -m "feat(seo): list activity pages in sitemap and IndexNow"
```

### Task 13: 검증

- [ ] **Step 1: 전체 타입·테스트** — `pnpm typecheck` · client `./node_modules/.bin/vitest run` · server `./node_modules/.bin/vitest run`. 실패는 「제품이 바뀐 것」인지 「깨진 것」인지 먼저 가른다.
- [ ] **Step 2: 브라우저**(`preview_start {name:"dev"}` + `{name:"client"}`) — 네 종류 한 장씩:
  - 목록 갈래 펼침·검색·다른 항목 링크 이동 · 정규 주소가 아니면 주소가 바뀌는지
  - 「🎮 온라인으로 하기」 → 게임이 뜨고, 끝내면 CTA 가 다시 뜨는지(색칠·숨은그림)
  - 「🖨 인쇄」 → 색칠·숨은그림은 인쇄 미리보기(`javascript_tool` 로 `matchMedia('print')` 대신 Puppeteer `emulateMedia('print')` 스크린샷), 워크지는 인쇄물 새 탭이 그 단원으로 열리는지
  - 375px(`resize_window preset:mobile`) — `☰ 목록` 드로어, 가로 스크롤 없음(`main.scrollWidth === clientWidth`)
  - CTA 링크가 동화책/파닉스 단원/홈으로 가는지
- [ ] **Step 3: 빌드된 서버** — `pnpm build` → `cp packages/server/prompt_guide.md packages/server/dist/server/prompt_guide.md` → `PORT=3611 DISABLE_PUBLISH_SCHEDULER=1 NODE_ENV=production node packages/server/dist/server/src/server.js` 를 띄워:
  ```bash
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3611/worksheet
  curl -s localhost:3611/activity | sed -e 's/<[^>]*>//g' | tr -s ' \n' | wc -c
  ```
  정규 주소 한 장씩(네 종류) curl 해서 200 · `<link rel="canonical"` · `<h1>` 이 있고, 태그 벗긴 글자 수가 수백 이상인지. 없는 키는 404. `/activity-data/coloring.json` 이 200(정적) 이고 `/activity` 가 폴더 301 로 안 새는지.
- [ ] **Step 4: 게임 검수** — `game-reviewer` 에이전트에 색칠 한 장·숨은그림 한 장 주소를 주고 플레이 검수(소리·완료·CTA).
- [ ] **Step 5: 고친 게 있으면 커밋**

### Task 14: 문서 · 운영 반영 메모

- [ ] **Step 1: CLAUDE.md** — 루트 「저작도구 자료실」 아래 또는 「학습자 화면」 적당한 자리에 한 항목: `/activity` 활동 모음(네 종류 · 장마다 SSR · 인쇄/온라인 · 게이트 없음 · CTA · 카탈로그 굽기 `build-activity-catalog.mjs` → 커밋 · sitemap 재생성 필요 · JSON 폴더가 `activity-data` 인 이유). 워크지 소개 페이지(`/worksheet/:track`) 설명은 301 로 바뀌었다고 고친다.
- [ ] **Step 2: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs: activity hub"
```

- [ ] **Step 3: 운영 반영 순서(사용자가 「올려」 할 때)** — push → GitHub `commits/<sha>/status` 로 배포 성공 확인 → `pnpm --filter shared build` → `pnpm --filter server sitemap` 재생성·커밋·push → `node packages/server/scripts/submit-indexnow.mjs`.
