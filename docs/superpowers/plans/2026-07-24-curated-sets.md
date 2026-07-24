# 묶어 보기 (Curated Sets) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 라이브러리의 「나의 재생 목록」을 「묶어 보기」로 바꾸고, 미리 만들어둔 재생 세트를 게스트에게도 노출한다.

**Architecture:** 세트 정의는 클라이언트 상수(`curated-sets.ts`). 렌더와 재생이 공유하는 판정은 순수함수 `resolveCuratedSet` 하나로 모으고 거기만 테스트한다. 화면은 기존 `PlaylistLibrarySection`·`PlaylistCard`·`beginPlaylist`를 재사용한다.

**Tech Stack:** React 18 · TypeScript · react-i18next · TanStack Query · Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-07-24-curated-sets-design.md`

---

## File Structure

| 파일                                                                    | 책임                                          |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| `features/continuous/lib/curated-sets.ts` (신규)                        | 세트 정의 상수 + `resolveCuratedSet` 순수함수 |
| `features/continuous/lib/curated-sets.test.ts` (신규)                   | 판정 로직 테스트                              |
| `features/continuous/components/PlaylistCard.tsx` (수정)                | `onEdit`/`onDelete` optional 화 + 잠금 배지   |
| `features/continuous/components/PlaylistLibrarySection.tsx` (수정)      | 큐레이션 렌더·게스트 노출·명칭·기본 펼침      |
| `features/continuous/components/PlaylistLibrarySection.test.tsx` (수정) | 게스트/기본펼침 케이스                        |
| `i18n/locales/{ko,en,vi,zh,th}/library.json` (수정)                     | 섹션명 + 세트 이름                            |

---

## Chunk 1: 데이터 + 판정 로직

### Task 1: 세트 정의와 `resolveCuratedSet`

**Files:**

- Create: `packages/client/src/features/continuous/lib/curated-sets.ts`
- Test: `packages/client/src/features/continuous/lib/curated-sets.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/client/src/features/continuous/lib/curated-sets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveCuratedSet, CURATED_SETS, type CuratedSet } from './curated-sets';

const set: CuratedSet = {
  id: 'test',
  nameKey: 'curated.test',
  emoji: '🧪',
  bookIds: ['a', 'b', 'c'],
};

/** 라이브러리 목록 대역 — 요약 객체는 isAccessibleForFree 가 없을 수 있다(=무료). */
const books = (entries: Array<[string, boolean | undefined]>) =>
  new Map(entries.map(([id, free]) => [id, { id, isAccessibleForFree: free }]));

describe('resolveCuratedSet', () => {
  it('전부 열람 가능하면 순서 그대로 전부 재생 대상', () => {
    const r = resolveCuratedSet(
      set,
      books([
        ['a', undefined],
        ['b', true],
        ['c', undefined],
      ]),
      false
    );
    expect(r.playableIds).toEqual(['a', 'b', 'c']);
    expect(r.lockedCount).toBe(0);
    expect(r.missingCount).toBe(0);
  });

  it('잠긴 책은 재생에서 빠지고 개수로 집계된다', () => {
    const r = resolveCuratedSet(
      set,
      books([
        ['a', undefined],
        ['b', false],
        ['c', false],
      ]),
      false
    );
    expect(r.playableIds).toEqual(['a']);
    expect(r.lockedCount).toBe(2);
  });

  it('entitlement 가 있으면 유료 책도 재생 대상', () => {
    const r = resolveCuratedSet(
      set,
      books([
        ['a', false],
        ['b', false],
        ['c', false],
      ]),
      true
    );
    expect(r.playableIds).toEqual(['a', 'b', 'c']);
    expect(r.lockedCount).toBe(0);
  });

  it('전부 잠기면 playableIds 가 빈 배열', () => {
    const r = resolveCuratedSet(set, books([['a', false]]), false);
    expect(r.playableIds).toEqual([]);
  });

  it('라이브러리에 없는 id 는 조용히 탈락하고 missingCount 로 잡힌다', () => {
    const r = resolveCuratedSet(set, books([['a', undefined]]), false);
    expect(r.playableIds).toEqual(['a']);
    expect(r.missingCount).toBe(2);
    expect(r.lockedCount).toBe(0); // 없는 책은 잠긴 게 아니다
  });

  it('재생 순서는 bookIds 순서를 따른다(라이브러리 순서 아님)', () => {
    const r = resolveCuratedSet(
      set,
      books([
        ['c', undefined],
        ['b', undefined],
        ['a', undefined],
      ]),
      false
    );
    expect(r.playableIds).toEqual(['a', 'b', 'c']);
  });
});

describe('CURATED_SETS', () => {
  it('id 가 중복되지 않는다', () => {
    const ids = CURATED_SETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 세트가 책을 하나 이상 갖고 nameKey 를 쓴다(한국어 하드코딩 금지)', () => {
    for (const s of CURATED_SETS) {
      expect(s.bookIds.length).toBeGreaterThan(0);
      expect(s.nameKey).toMatch(/^curated\./);
    }
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @tangobook/client exec vitest run src/features/continuous/lib/curated-sets.test.ts`
Expected: FAIL — `Failed to resolve import "./curated-sets"`

- [ ] **Step 3: 구현**

`packages/client/src/features/continuous/lib/curated-sets.ts`:

```ts
import { canReadBook } from '@tangobook/shared';

/**
 * 미리 만들어둔 재생 세트.
 * 세트 이름은 i18n 키로만 둔다 — 앱은 ko·en·vi·zh·th 를 지원하므로 한국어를 박으면 해외에서 깨진다.
 */
export interface CuratedSet {
  id: string;
  nameKey: string; // 'curated.safety' → library 네임스페이스
  emoji: string;
  bookIds: string[]; // 순서 = 재생 순서
}

/**
 * 구성 근거: docs/saenghwal-donghwa/curriculum-45.md 의 7트랙 + 라이브러리 카테고리.
 * 같은 책이 여러 세트에 들어가도 된다(발견 경로가 늘어남 — mealtime 이 hygiene 과 겹침).
 * 🔴 id 는 라이브러리에서 책이 빠지면 썩는다. resolveCuratedSet 이 조용히 탈락시키므로 화면은 안 깨진다.
 */
export const CURATED_SETS: CuratedSet[] = [
  {
    id: 'hygiene',
    nameKey: 'curated.hygiene',
    emoji: '🪥',
    bookIds: [
      '1782815785821', // 01. 골고루 먹으면 무지개 힘!
      '1782823691551', // 02. 치카치카 쓱쓱, 반짝반짝!
      '1782823692128', // 03. 보글보글 뽀득뽀득!
      '1782823692664', // 04. 쉬야 쑥, 참 잘했어요!
      '1783608740296', // 05. 꼭꼭 냠냠, 천천히!
      '1782829948291', // 06. 간식은 요만큼, 밥이 먼저!
      '1782829947573', // 07. 첨벙첨벙 보글보글!
      '1782824085578', // 08. 잘 자요, 코~ 잘 자요, 코~
    ],
  },
  {
    id: 'safety',
    nameKey: 'curated.safety',
    emoji: '🚸',
    bookIds: [
      '1782823458444', // 15. 주사 콕, 병균 뿅!
      '1782831060510', // 16. 멈춰! 손 번쩍! 차 보고 건너!
      '1783990076840', // 17. 찰칵! 벨트 매고 출발!
      '1782824600368', // 18. 손 꼭! 엄마 곁에!
      '1782831061108', // 19. 이상하면 안 먹어, 퉤!
      '1783990105997', // 20. 흔들흔들, 책상 밑으로!
      '1783990181590', // 21. 천천히, 앞을 봐요!
      '1782831061679', // 22. 싫어요! 안 돼요! 엄마한테 말해요!
    ],
  },
  {
    id: 'feelings',
    nameKey: 'curated.feelings',
    emoji: '💛',
    bookIds: [
      '1782824086419', // 23. 호리는 호리니까!
      '1782831062275', // 24. 깜깜해도 괜찮아, 옆에 있어!
      '1782824600992', // 25. 화가 나면, 후~ 하고 크게 숨!
      '1782863608939', // 26. 조금씩, 한 걸음씩!
      '1782863609726', // 27. 울어도 괜찮아, 안아줄게
      '1783990215278', // 28. 안 되면 또! 될 때까지!
      '1783990244878', // 29. 몸에 힘 쑥 빼면, 둥실!
      '1783949746731', // 30. 심심할 땐, 상상 놀이!
    ],
  },
  {
    id: 'mealtime',
    nameKey: 'curated.mealtime',
    emoji: '🍚',
    bookIds: [
      '1782815785821', // 01. 골고루 먹으면 무지개 힘!
      '1783608740296', // 05. 꼭꼭 냠냠, 천천히!
      '1782829948291', // 06. 간식은 요만큼, 밥이 먼저!
      '1783608743641', // 13. 엉덩이 딱! 밥은 앉아서!
      '1783990046124', // 14. 다 같이 앉아, 맛있게!
    ],
  },
  {
    id: 'bedtime',
    nameKey: 'curated.bedtime',
    emoji: '🌙',
    bookIds: [
      '1772107608499', // 신데렐라
      '1772181399388', // 인어 공주
      '1778555233699', // 백설공주
    ],
  },
  {
    id: 'dino',
    nameKey: 'curated.dino',
    emoji: '🦖',
    bookIds: [
      '1773912904434', // 람포린쿠스
      '1773899653860', // 케찰코아틀루스
      '1773899014599', // 프테라노돈
      '1773898487865', // 이구아노돈
      '1773896866516', // 마이아사우라
      '1773895602678', // 파키케팔로사우루스
    ],
  },
];

export interface ResolvedCuratedSet {
  playableIds: string[];
  lockedCount: number;
  missingCount: number;
}

/**
 * 세트를 현재 라이브러리·권한에 비춰 해석한다. 렌더(배지)와 재생(대상 목록)이 이 함수 하나를 공유한다.
 * - 라이브러리에 없는 id → missingCount (조용히 탈락)
 * - 있으나 열람 불가 → lockedCount (재생 제외)
 * - 순서는 set.bookIds 순서 유지
 */
export function resolveCuratedSet(
  set: CuratedSet,
  booksById: Map<string, { isAccessibleForFree?: boolean }>,
  isEntitled: boolean
): ResolvedCuratedSet {
  const playableIds: string[] = [];
  let lockedCount = 0;
  let missingCount = 0;

  for (const id of set.bookIds) {
    const book = booksById.get(id);
    if (!book) {
      missingCount++;
      continue;
    }
    if (canReadBook(book, { isEntitled })) playableIds.push(id);
    else lockedCount++;
  }
  return { playableIds, lockedCount, missingCount };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @tangobook/client exec vitest run src/features/continuous/lib/curated-sets.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/continuous/lib/curated-sets.ts packages/client/src/features/continuous/lib/curated-sets.test.ts
git commit -m "feat(continuous): curated set definitions + entitlement-aware resolver"
```

---

### Task 2: i18n 키 (5개 언어)

**Files:**

- Modify: `packages/client/src/i18n/locales/ko/library.json`
- Modify: `packages/client/src/i18n/locales/en/library.json`
- Modify: `packages/client/src/i18n/locales/vi/library.json`
- Modify: `packages/client/src/i18n/locales/zh/library.json`
- Modify: `packages/client/src/i18n/locales/th/library.json`

- [ ] **Step 1: 각 언어 `library.json` 의 `playlist` 블록 수정**

`playlist.title` 값을 「묶어 보기」 계열로 바꾸고, `playlist.mySets`(내 세트 소제목) + `playlist.lockedBadge` + `curated.*` 6종을 추가한다. 다른 키는 건드리지 않는다.

**ko** — `playlist.title`: `"묶어 보기"`, `playlist.subtitle`: `"여러 권을 이어서 들려주는 묶음이에요"`, `playlist.mySets`: `"내가 만든 세트"`, `playlist.lockedBadge`: `"🔒 {{count}}권"`,
`curated`: `{ "hygiene": "건강·위생 습관", "safety": "안전 동화", "feelings": "마음 다스리기", "mealtime": "밥 잘 먹는 아이", "bedtime": "잠자리 명작", "dino": "공룡 친구들" }`

**en** — `title`: `"Story bundles"`, `subtitle`: `"Ready-made bundles that play several books in a row"`, `mySets`: `"My sets"`, `lockedBadge`: `"🔒 {{count}}"`,
`curated`: `{ "hygiene": "Healthy habits", "safety": "Staying safe", "feelings": "Big feelings", "mealtime": "Happy mealtimes", "bedtime": "Bedtime classics", "dino": "Dinosaur friends" }`

**vi / zh / th** — 같은 구조로 해당 언어 번역을 채운다. 🔴 키 이름은 5개 언어가 동일해야 한다.

- [ ] **Step 2: 키 파리티 검증**

Run: `node packages/client/scripts/verify-locales.mjs`
Expected: 통과 (누락 키 0). 실패하면 빠진 언어의 키를 채운다.

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/i18n/locales
git commit -m "i18n(library): rename playlist section to bundles, add curated set names"
```

---

## Chunk 2: 화면

### Task 3: `PlaylistCard` — 편집·삭제 optional + 잠금 배지

**Files:**

- Modify: `packages/client/src/features/continuous/components/PlaylistCard.tsx`

- [ ] **Step 1: props 완화**

`onEdit`/`onDelete` 를 optional 로 바꾸고, 넘어오지 않으면 해당 버튼을 렌더하지 않는다(큐레이션 세트는 편집·삭제가 없다). `lockedCount?: number` 를 받아 0보다 크면 `t('playlist.lockedBadge', { count })` 배지를 카드에 표시한다.

🔴 기존 호출부(내 세트)는 `onEdit`/`onDelete` 를 계속 넘기므로 동작이 바뀌지 않아야 한다.

- [ ] **Step 2: 기존 테스트가 여전히 통과하는지 확인**

Run: `pnpm --filter @tangobook/client exec vitest run src/features/continuous`
Expected: PASS (기존 케이스 그대로)

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/features/continuous/components/PlaylistCard.tsx
git commit -m "refactor(continuous): make PlaylistCard edit/delete optional, add locked badge"
```

---

### Task 4: `PlaylistLibrarySection` — 큐레이션 렌더 · 게스트 노출 · 기본 펼침

**Files:**

- Modify: `packages/client/src/features/continuous/components/PlaylistLibrarySection.tsx`
- Test: `packages/client/src/features/continuous/components/PlaylistLibrarySection.test.tsx`

- [ ] **Step 1: 실패하는 테스트 추가**

기존 테스트 파일에 아래 케이스를 추가한다(기존 케이스는 유지):

```tsx
it('게스트에게도 큐레이션 세트가 보인다', async () => {
  // account = null 로 렌더
  // expect: 큐레이션 세트 이름 중 하나가 보인다
  // expect: "내가 만든 세트" 소제목과 "이어재생 만들기" CTA 는 없다
});

it('로그인 + 내 세트 0개면 큐레이션과 CTA 가 함께 보인다', async () => {
  // expect: 큐레이션 세트 + CTA 둘 다
});

it('기본이 펼침이다', async () => {
  // expect: 토글을 누르지 않아도 세트 카드가 보인다
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @tangobook/client exec vitest run src/features/continuous/components/PlaylistLibrarySection.test.tsx`
Expected: FAIL — 게스트 렌더 시 아무것도 안 나옴(`if (!account) return null`)

- [ ] **Step 3: 컴포넌트 수정**

1. `if (!account) return null` **제거** — 게스트도 섹션을 본다
2. `useState(false)` → `useState(true)` (기본 펼침)
3. `useAccess()` 로 `isEntitled` 를 얻고, `useStorybooks()` 결과로 `booksById` Map 을 만든다
4. `CURATED_SETS.map(set => ({ set, ...resolveCuratedSet(set, booksById, isEntitled) }))` 후
   **`playableIds.length === 0` 인 세트는 렌더하지 않는다**(id 가 썩었거나 전부 잠김)
5. 큐레이션 카드 행 → (로그인 시) `t('playlist.mySets')` 소제목 + 내 세트 행 순서로 배치
6. 큐레이션 카드는 `onPlay={() => beginPlaylist(playableIds, lang, navigate)}`, `lockedCount` 전달, `onEdit`/`onDelete` 미전달
7. 언어는 기존 내 세트와 동일한 규칙을 따른다(현재 UI 언어 사용)

🔴 `useStorybooks()` 가 로딩 중이면 큐레이션 행은 렌더하지 않는다(빈 카드 깜빡임 방지).

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @tangobook/client exec vitest run src/features/continuous`
Expected: PASS (신규 3 + 기존 전부)

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/continuous/components/PlaylistLibrarySection.tsx packages/client/src/features/continuous/components/PlaylistLibrarySection.test.tsx
git commit -m "feat(library): show curated bundles to everyone in the 묶어 보기 section"
```

---

## Chunk 3: 검증

### Task 5: 전체 검증

- [ ] **Step 1: 타입체크**

Run: `pnpm --filter @tangobook/client typecheck`
Expected: 에러 0

- [ ] **Step 2: 클라이언트 테스트 전체**

Run: `pnpm --filter @tangobook/client exec vitest run`
Expected: 기존 통과분 유지 + 신규 통과

- [ ] **Step 3: 실제 화면 확인 (@verify)**

dev 서버를 띄우고 `/library` 에서 확인한다:

- 로그아웃 상태 → 「묶어 보기」 섹션이 펼쳐진 채로 보이고 세트 카드가 있다
- 세트 카드 탭 → 연속재생이 시작된다
- 로그인 상태 → 큐레이션 아래 「내가 만든 세트」가 보인다
- 375px 모바일 폭에서 가로 스크롤이 정상이고 한글이 안 깨진다(`break-keep`)

🔴 R2 데이터가 없는 환경이면 `API_TARGET` 로 프로덕션 API 를 바라보게 해야 책 목록이 뜬다.

- [ ] **Step 4: 최종 커밋**

```bash
git commit --allow-empty -m "chore: verify curated bundles end-to-end"
```

---

## 미해결 / 후속

- 세트 구성 변경이 잦아지면 R2 설정(`LibraryConfig` 패턴)으로 이전 — 지금은 YAGNI
- 🔴 **무료 공개 범위 불일치**: 정책 문서는 "게스트 무료 11권"인데 실측은 76권
  (생활동화 45·유치원동화 20 이 `isAccessibleForFree` 미설정으로 열려 있음). 이 계획의 범위 밖이지만
  정리 시 큐레이션 세트의 잠금 배지 개수가 달라진다.
