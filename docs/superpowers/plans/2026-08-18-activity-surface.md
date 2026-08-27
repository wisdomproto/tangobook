# 활동 표면 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가입 없이 쓰는 활동 페이지 셋(`/games/coloring` · `/worksheet/*` · `/games` 허브)과 그 위에 얹을 공용 네비를 만든다.

**Architecture:** 전부 **AppShell 밖 풀화면**(`/intro` 와 같은 층). 라우트마다 자기 `<title>`·h1 을 가져 검색 착지점이 된다. 색칠은 기존 `ColoringPlayer` 를 그대로 쓰되 **정답본 대신 원본 삽화에서 색을 읽게** 바꾼다. 활동지는 이미 있는 A4 HTML 을 감싸는 소개 페이지만 만든다.

**Tech Stack:** React 18 + TypeScript + Vite · TanStack Query · TailwindCSS v3 · vitest(jsdom) · `@tangobook/shared` flood-fill

---

## 진행 상황 (2026-08-18 갱신)

구현은 `.claude/worktrees/activity-surface`(브랜치 `feat/activity-surface`, 21커밋)에서 했다.
**계획에 없던 `/intro` 개편이 같은 워크트리에서 함께 진행됐다**(다른 세션과의 경계가 실제로는 안 갈렸다).

| | 상태 |
|---|---|
| Chunk 1 Task 1 — `ColoringPlayer` 가 원본 삽화에서 색 읽기 (`answerUrl` → `colorSourceUrl`) | ✅ |
| Chunk 1 나머지 — `catalog.ts` | ✅ / `ColoringPage`·`ColoringSheetPage`(`/games/coloring`) ❌ |
| Chunk 2 — `/worksheet`·`/worksheet/:track` + 인쇄물 툴바 앱 버튼 | ✅ |
| Chunk 3 — `PublicNav` | ✅ / `GamesHubPage` 카드 교체 ❌ |
| Chunk 4 — SEO 배선(prerender 목록·canonical·sitemap 재생성) | ❌ |
| 계획 밖 — `/intro` 재편(데모 1개·낱말 카드·히어로 문구), `SceneReveal` 문장 단위, 낱말쓰기 소리 버그 | ✅ |
| `/` → `/intro` 라우트 전환 | ❌ |

> **2026-08-27 — Chunk 4 의 배관이 바뀌었다(이 플랜 밖에서).** 아직 ❌ 이지만, 착수 전에 알아야 할 것:
> - **sitemap 은 재생성됐다**(1,882 → 1,956). 생성기가 `/intro` 를 이미 뺐는데 **산출물을 안 구워서**
>   301 되는 URL 이 3주간 제출되고 있었다 — 코드만 고치고 `pnpm --filter server sitemap` 을 빼먹지 말 것.
> - **`submit-indexnow.mjs` 는 sitemap 과 별개로 자기 URL 목록을 만든다.** 새 활동 페이지를 sitemap 에만
>   넣으면 색인 요청에서 통째로 빠진다(파닉스 73개가 그럴 뻔했다). **두 곳 다** 넣을 것.
> - **프리렌더본의 홈 hreflang 누출을 제거했다**(`prerender.mjs`) — 프리렌더 라우트를 늘릴 때 canonical 은
>   `useSeo` 가, hreflang 제거는 이 처리가 맡는다. 서버 `selfCanonicalizeHtml` 은 **프리렌더본을 안 탄다.**
> - **확장자 있는 경로는 이제 404 다**(`looksLikeMissingFile`). `/games/coloring/*.png` 류를 라우트로 쓰면 안 된다.
> - **파닉스 SEO 서피스**(`/library/phonics/:track[/:unitId]/about`)가 같은 패턴으로 먼저 생겼다 —
>   SSR + 짝 페이지 + 커리큘럼에서 파생. 활동 페이지도 같은 틀을 쓰면 된다.
>   🔴 **클라 라우트의 고정 세그먼트는 정적으로 적을 것**(React Router 는 점수로 고른다).

⚠️ 랜딩이 「책마다 핵심 낱말이 있어요」라고 이미 말하지만 **호리 78권(29%)은 `keyObjects` 0** 이다
(사용자 지시로 먼저 씀 — 추출 데이터 1,114개/196권은 있고 R2 적용만 남았다).

## 🔴 시작 전에 — 워크트리

이 계획을 **이 워크트리에서 실행하지 말 것.** `git rev-list --left-right --count origin/main...HEAD` = **1492 / 1486**.
`origin/main` 에서 새 워크트리를 떼고 거기서 작업한다. 색칠 작업판·검사기 커밋이 필요하면
그 커밋만 cherry-pick 한다.

```bash
git -C C:/projects/tangobook worktree add .claude/worktrees/activity-surface -b feat/activity-surface origin/main
```

## 🔴 다른 세션과의 경계

**루트(`/`) 개편은 이 계획에 없다.** 다른 세션이 하고 있다. 이 계획은 그 루트가 링크할
**목적지**를 만든다 — 순서상 이쪽이 먼저다.

겹치는 물건은 **공용 네비 하나뿐**이다(Task 7). 활동 페이지가 먼저 쓰고 루트가 나중에 갖다 쓴다.
설계 근거는 [스펙](../specs/2026-08-18-root-landing-design.md).

## 파일 구조

| 파일 | 책임 |
|---|---|
| `features/coloring/lib/catalog.ts` | 도안 목록 → 카테고리 그룹·slug 해석 (순수) |
| `features/coloring/lib/catalog.test.ts` | 위 테스트 |
| `features/coloring/components/ColoringGallery.tsx` | 도안 격자 |
| `pages/ColoringPage.tsx` | `/games/coloring` — 갤러리 |
| `pages/ColoringSheetPage.tsx` | `/games/coloring/:slug` — 한 장(인쇄·칠하기) |
| `pages/WorksheetHubPage.tsx` | `/worksheet` — 두 갈래 |
| `pages/WorksheetPage.tsx` | `/worksheet/:track` — 한글/영어 각각 |
| `components/PublicNav.tsx` | 공용 네비(로고·pill 줄·로그인·CTA) |
| `pages/GamesHubPage.tsx` | 카드 교체 (이미 있음, 98줄) |
| `features/games/components/players/ColoringPlayer.tsx` | `answerUrl` → `colorSourceUrl` |

---

## Chunk 1: 색칠 — 정답본 없이 칠하게 만들기

검색 32,810 으로 가장 큰 축이고, 자산(도안 18장 + 원본 삽화 URL)이 이미 있다.

### Task 1: `ColoringPlayer` 가 원본 삽화에서 색을 읽게 한다

지금은 `answerUrl`(같은 도안을 칠한 그림)이 있어야 돌고, 없으면 화면이 아예 안 그려진다
([ColoringPlayer.tsx:147](../../../packages/client/src/features/games/components/players/ColoringPlayer.tsx)).
칸 나누기는 도안만으로 끝나므로 두 번째 이미지는 **색 출처**일 뿐이다 — 원본 삽화가 그 역할을 한다.
도안이 원본을 보고 그린 그림이라 자리가 겹친다(실측: 오리 노랑·부리 주황·볼 분홍).

**Files:**
- Modify: `packages/client/src/features/games/components/players/ColoringPlayer.tsx`
- Modify: `packages/client/src/pages/ColoringDemoPage.tsx` (호출부)
- Modify: `packages/client/public/coloring/manifest.json` (필드명)

- [ ] **Step 1: `readPixels` 를 contain 으로 그린다**

🔴 지금은 `ctx.drawImage(img, 0, 0, w, h)` = **늘려서 채우기**다. 도안(1024×1024)과 원본(w800)이
둘 다 정사각이면 우연히 맞지만, 비정사각 원본이 오면 색이 통째로 어긋난다.

```ts
/**
 * 🔴 **늘리지 말고 맞춰 넣는다.** 색 출처(원본 삽화)는 도안과 비율이 다를 수 있고,
 *    늘리면 칸과 색이 어긋나 오리 부리가 몸 색을 가져간다.
 */
function readPixels(img: HTMLImageElement, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2d 없음');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return ctx.getImageData(0, 0, w, h).data;
}
```

- [ ] **Step 2: prop 이름을 바꾼다**

`answerUrl` → `colorSourceUrl`. 타입·구조분해·effect deps·`<img src>` 미리보기까지 전부.
이름이 남아 있으면 다음 사람이 정답본을 또 만들려 한다.

- [ ] **Step 3: manifest 필드 정리**

`manifest.json` 의 `answerUrl` 을 지우고 `originalUrl` 을 색 출처로 쓴다(이미 들어 있다).
18장 전부.

- [ ] **Step 4: 데모에서 눈으로 확인**

```bash
pnpm --filter client dev
```
`/coloring-demo` 에서 오리·여우를 칠해 본다.
기대: 물감이 노랑·주황·분홍으로 뜨고, 색이 옆 칸으로 새지 않는다.

🔴 **숫자만 보고 넘어가지 말 것.** 이 프로젝트에서 반복된 실패가 "검사기는 통과인데 그림은 깨짐"이다.

- [ ] **Step 5: 스크립트 검사기로 재확인**

```bash
node packages/server/scripts/auto-color.mjs --from=<원본URL> packages/client/public/coloring/kr-h1-u05-오리.png
```
기대: `칸 11개 · 못 짚을 칸 0~1개`, 산출된 `-auto.png` 가 노란 오리.

- [ ] **Step 6: 커밋**

```bash
git add packages/client/src/features/games/components/players/ColoringPlayer.tsx packages/client/src/pages/ColoringDemoPage.tsx packages/client/public/coloring/manifest.json
git commit -m "feat(coloring): take the answer colours from the original illustration"
```

### Task 2: 도안 목록 순수 모듈

**Files:**
- Create: `packages/client/src/features/coloring/lib/catalog.ts`
- Test: `packages/client/src/features/coloring/lib/catalog.test.ts`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```ts
import { describe, expect, it } from 'vitest';
import { groupByUnit, findBySlug, toSlug } from './catalog';

const SHEETS = [
  { unitId: 'kr-h1-u05', word: '오리', lineartUrl: '/a.png', originalUrl: 'https://x/o.webp' },
  { unitId: 'kr-h1-u05', word: '노루', lineartUrl: '/b.png', originalUrl: 'https://x/n.webp' },
  { unitId: 'kr-h1-u01', word: '여우', lineartUrl: '/c.png', originalUrl: 'https://x/y.webp' },
];

describe('색칠 도안 목록', () => {
  it('단원별로 묶고 단원 순서를 지킨다', () => {
    expect(groupByUnit(SHEETS).map((g) => [g.unitId, g.sheets.length])).toEqual([
      ['kr-h1-u01', 1],
      ['kr-h1-u05', 2],
    ]);
  });

  // 🔴 주소에 한글을 그대로 넣으면 공유·검색에서 퍼센트 인코딩으로 깨져 보인다.
  it('낱말을 주소로 쓸 수 있는 slug 로 바꾼다', () => {
    expect(toSlug('오리')).toBe('오리');
    expect(toSlug('돌 다리')).toBe('돌-다리');
  });

  it('slug 로 도안을 찾고, 없으면 undefined', () => {
    expect(findBySlug(SHEETS, '오리')?.word).toBe('오리');
    expect(findBySlug(SHEETS, '없는낱말')).toBeUndefined();
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm --filter client test catalog`
Expected: FAIL — `Failed to resolve import './catalog'`

- [ ] **Step 3: 최소 구현**

```ts
export interface ColoringSheet {
  unitId: string;
  word: string;
  lineartUrl: string;
  /** 칸별 정답색을 읽어 올 그림 — 정답본이 아니라 **원본 삽화**다. */
  originalUrl: string;
}

export const toSlug = (word: string): string => word.trim().replace(/\s+/g, '-');

export function groupByUnit(sheets: ColoringSheet[]): { unitId: string; sheets: ColoringSheet[] }[] {
  const by = new Map<string, ColoringSheet[]>();
  for (const s of sheets) (by.get(s.unitId) ?? by.set(s.unitId, []).get(s.unitId)!).push(s);
  return [...by.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([unitId, list]) => ({ unitId, sheets: list }));
}

export const findBySlug = (sheets: ColoringSheet[], slug: string): ColoringSheet | undefined =>
  sheets.find((s) => toSlug(s.word) === slug);
```

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm --filter client test catalog`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/coloring/
git commit -m "feat(coloring): group sheets by unit and resolve them by slug"
```

### Task 3: `/games/coloring` 갤러리와 낱말 페이지

**Files:**
- Create: `packages/client/src/features/coloring/components/ColoringGallery.tsx`
- Create: `packages/client/src/pages/ColoringPage.tsx`
- Create: `packages/client/src/pages/ColoringSheetPage.tsx`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1: 갤러리 페이지**

`/coloring/manifest.json` 을 받아 `groupByUnit` 으로 묶고 도안 썸네일 격자를 그린다.
카드 = 도안 이미지 + 낱말. 누르면 `/games/coloring/{slug}`.

`useSeo` 로 제목 **「무료 색칠공부 도안」**.
🔴 「도안」이 들어가야 한다 — `색칠도안` 17,390 · `색칠공부도안` 8,980 vs `색칠공부` 6,350.
「프린트」는 쓰지 않는다(`색칠공부프린트` 20).

- [ ] **Step 2: 한 장 페이지**

```
[ 도안 크게 ]
[🖨 A4로 인쇄]   [🎨 칠하기]
```

🔴 **인쇄가 왼쪽·1순위.** 「도안」계 32,810 vs 「온라인·사이트」계 160 = 200배.
검색으로 온 사람은 뽑으러 온 것이고, 칠하기를 앞세우면 원하는 걸 안 주는 꼴이 된다.

「칠하기」를 누르면 `ColoringPlayer` 를 그 자리에서 띄운다(`items=[그 한 장]`, `colorSourceUrl=originalUrl`).

- [ ] **Step 3: 인쇄 CSS**

```css
@media print {
  body * { visibility: hidden; }
  .print-sheet, .print-sheet * { visibility: visible; }
  .print-sheet {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: contain;
  }
  @page { size: A4 portrait; margin: 10mm; }
}
```

🔴 **PDF 를 미리 굽지 않는다.** 도안이 2,067장까지 늘어나면 PDF 2,067개를 R2 에 올려야 한다.
⚠️ 활동지는 반대다 — 이미 A4 로 짜인 HTML 이라 그대로 인쇄한다. **같은 컴포넌트로 묶지 말 것.**

- [ ] **Step 4: 라우트 등록**

`/games/coloring`·`/games/coloring/:slug` 를 **AppShell 밖**에 둔다(`/intro` 와 같은 층).
🔴 게이트로 감싸지 않는다.

- [ ] **Step 5: 브라우저로 확인**

`preview_start {name:"client"}` → `/games/coloring` → 낱말 하나 → 칠해 보고, 인쇄 미리보기를 연다.
기대: 물감이 원본 색으로 뜨고, 인쇄 미리보기에 도안 한 장만 A4 로 꽉 찬다.

- [ ] **Step 6: 커밋**

```bash
git add packages/client/src/features/coloring packages/client/src/pages/Coloring*.tsx packages/client/src/router/index.tsx
git commit -m "feat(coloring): a public gallery that prints or fills in"
```

---

## Chunk 2: 활동지

자산은 이미 있다 — `packages/client/public/worksheet/{ko,en}_phonics.html`(한글 120쪽·영어 164쪽).
만들 것은 그 앞에 세울 **소개·착지 페이지**뿐이다.

### Task 4: `/worksheet/:track` 두 장

**Files:**
- Create: `packages/client/src/pages/WorksheetPage.tsx`
- Create: `packages/client/src/pages/WorksheetHubPage.tsx`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1: 두 트랙을 상수로**

```ts
/**
 * 🔴 **한글·영어는 페이지를 나눈다.** 검색어가 아예 다른 낱말이다 —
 *    한글 학습지 950 · 한글 워크북 510 vs 영어 파닉스 2,020.
 *    한 페이지에 몰면 제목을 뭘로 달지 못 정하고 둘 다 놓친다.
 * 🔴 제목에 「파닉스 활동지」를 쓰지 않는다(월 30회). 사이트 안 라벨로만 쓴다.
 */
const TRACKS = {
  hangul: { title: '무료 한글 학습지', units: 32, pages: 120, file: '/worksheet/ko_phonics.html' },
  english: { title: '영어 파닉스 학습지', units: 39, pages: 164, file: '/worksheet/en_phonics.html' },
} as const;
```

- [ ] **Step 2: 페이지**

미리보기 몇 쪽 + `[🖨 인쇄하기]`(=`file` 을 새 탭으로) + 「이 단원 앱에서 해보기 →」.
`useSeo` 로 `TRACKS[track].title`.

- [ ] **Step 3: 허브**

`/worksheet` = 두 카드. 네비 pill 은 여기로 오고, 검색은 하위 둘이 각각 받는다.

- [ ] **Step 4: 정적 파일과 라우트가 안 부딪히는지 확인**

```bash
curl -sI http://localhost:5175/worksheet/ko_phonics.html | head -3
curl -s  http://localhost:5175/worksheet/hangul | head -c 200
```
기대: 앞은 실제 HTML(정적 파일이 이긴다), 뒤는 SPA 셸.
❌ 앞이 SPA 셸이면 라우트가 정적 파일을 가로챈 것 — 라우트를 `/worksheet/:track` 으로 좁힌다.

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/pages/Worksheet*.tsx packages/client/src/router/index.tsx
git commit -m "feat(worksheet): landing pages in front of the printable sheets"
```

---

## Chunk 3: 허브와 네비

### Task 5: `/games` 허브 카드 교체

**Files:**
- Modify: `packages/client/src/pages/GamesHubPage.tsx`

- [ ] **Step 1: 카드 셋으로 바꾼다**

색칠하기(`/games/coloring`) · 어휘 게임(`/games/vocab`) · 숨은그림찾기(준비 중).

🔴 **한글/알파벳 블록 카드는 뺀다.** 그 둘은 어휘 게임 안 4종 중 하나라, 카드로 또 내놓으면
같은 걸 두 군데서 고르게 된다. 라우트는 남긴다.

- [ ] **Step 2: 화면 제목**

URL 은 `/games` 로 두되 제목은 **「놀아보기」** 계열. 색칠은 실제로 게임이 아니다(수요 92%가 인쇄).

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/pages/GamesHubPage.tsx
git commit -m "feat(games): rebuild the orphaned hub around the three activities"
```

### Task 6: 숨은그림 자리만 만든다

- [ ] **Step 1: 「준비 중」 카드**

🔴 **씬이 0장이다.** 저작 탭(`HiddenObjectEditorTab`)은 있는데 아무도 만들지 않았다(R2 전수 확인).
페이지를 만들면 빈 화면이 검색에 잡힌다 — 카드에 「준비 중」만 두고 링크를 걸지 않는다.

⚠️ 검색 축이 18,290 으로 색칠 다음인데 콘텐츠가 없다. **자산 만들기가 선행**이고,
저작 도구가 이미 있어 색칠 2,067장보다 훨씬 빨리 끝난다. 별도 계획으로 뺀다.

### Task 7: 공용 네비

**Files:**
- Create: `packages/client/src/components/PublicNav.tsx`

- [ ] **Step 1: 컴포넌트**

```
[탱고북]                              로그인   [한 달 무료 시작]
학습하기 · 색칠 도안 · 숨은그림찾기 · 어휘 게임 · 활동지
```

- 🔴 **모바일에서 햄버거에 넣지 않는다.** 초보 엄마는 안 눌러본다. 가로 스크롤 pill 줄로 깔고,
  라이브러리 캐러셀과 같은 규칙으로 **오른쪽 칩이 살짝 걸쳐** 보이게 한다.
- 🔴 **pill 이름은 실제로 치는 낱말로** — 「숨은그림」 110 vs 「숨은그림찾기」 10,970.
- 🔴 **로그인은 작은 텍스트, CTA 는 코랄 버튼.** 지금 헤더의 「로그인 / 회원가입」 한 덩어리를
  그대로 쓰면 [무료 시작]과 **같은 행동을 두 번** 시킨다.
- 「학습하기」 → `/library`. 다국어라 무엇을 배우는지는 라벨에 박지 않는다.

- [ ] **Step 2: 활동 페이지 셋에 얹는다**

이 네비가 형제 이동을 겸하므로 하단 「이런 것도 있어요」 줄은 만들지 않는다.

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/components/PublicNav.tsx packages/client/src/pages/
git commit -m "feat(nav): one visible pill row across the public pages"
```

---

## Chunk 4: SEO 배선

### Task 8: 프리렌더·sitemap

- [ ] **Step 1: 프리렌더 목록에 추가**

`packages/client/scripts/prerender.mjs` 의 정적 라우트에 `/games/coloring`·`/worksheet`·
`/worksheet/hangul`·`/worksheet/english` 를 넣는다.

- [ ] **Step 2: sitemap 재생성**

```bash
pnpm --filter server sitemap
```

🔴 **코드만 고치고 산출물을 다시 안 구우면 조용히 틀린다.** 이 배선으로 두 번 사고가 났다 —
GSC 중복 306건, bare URL 213개를 3주간 제출.

- [ ] **Step 3: 배포 후 눈으로 확인**

```bash
curl -s https://www.tangobook.co.kr/games/coloring | grep -o '<title>[^<]*'
```
기대: 「무료 색칠공부 도안」이 **HTML 안에** 들어 있다. SPA 셸이면 프리렌더가 안 걸린 것.

- [ ] **Step 4: 커밋**

```bash
git add packages/client/scripts/prerender.mjs packages/client/public/sitemap.xml
git commit -m "chore(seo): prerender the activity pages and rebuild the sitemap"
```

---

## 이 계획에 없는 것

- **루트(`/`) 개편** — 다른 세션. 스펙의 「루트 본문」 절 참조.
- **숨은그림 씬 만들기** — 자산 생성이라 별도 계획.
- **색칠 도안 2,067장** — 작업판(`/coloring-plan.html`)에서 사람이 붙이는 중. 18장으로 먼저 연다.
- **틀린그림찾기** — 구현 테스트 후 결정.
