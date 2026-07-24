# 묶어 보기 (Category Bundles) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 라이브러리의 「나의 재생 목록」을 「묶어 보기」로 바꾸고, **카테고리별 첫 3권**으로 만든 묶음을 게스트·로그인 구분 없이 보여준다. 묶음은 빌더에서 수정할 수 있다.

**Architecture:** 묶음은 저장하지 않는다 — 라이브러리 목록에서 **매번 파생**한다(`buildCategoryBundles` 순수함수). 하드코딩된 책 id 가 없으므로 책이 추가·삭제돼도 썩지 않는다. 화면·재생·수정은 기존 `PlaylistLibrarySection`·`beginPlaylist`·`ContinuousBuilder` 를 재사용한다.

**Tech Stack:** React 18 · TypeScript · react-i18next · Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-07-24-curated-sets-design.md` (2026-07-24 단순화 반영)

---

## 설계 결정 (이전 안에서 바뀐 것)

| 항목             | 이전                 | 확정                                                 |
| ---------------- | -------------------- | ---------------------------------------------------- |
| 세트 정의        | 책 id 38개 하드코딩  | **카테고리별 첫 3권 자동 파생**                      |
| 세트 이름        | i18n 키 6종 신규     | **기존 `useCategoryLabel()`** 재사용                 |
| 게스트 vs 로그인 | 다르게 렌더          | **완전히 동일**                                      |
| 잠긴 책          | 필터 + `🔒 N권` 배지 | **처리하지 않음** — 잠금은 기존 뷰어 게이팅에 맡긴다 |
| 수정             | 불가                 | **빌더 프리필로 수정 가능**                          |

`resolveCuratedSet` 의 entitlement 판정은 전부 삭제한다(YAGNI).

---

## File Structure

| 파일                                                               | 책임                                       |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `features/continuous/lib/category-bundles.ts` (신규)               | `buildCategoryBundles` 순수함수            |
| `features/continuous/lib/category-bundles.test.ts` (신규)          | 파생 규칙 테스트                           |
| `features/continuous/pages/ContinuousBuilder.tsx` (수정)           | 쿼리파라미터 프리필(`?books=&name=&lang=`) |
| `features/continuous/components/PlaylistCard.tsx` (수정)           | `onDelete` optional                        |
| `features/continuous/components/PlaylistLibrarySection.tsx` (수정) | 묶음 렌더·명칭·기본 펼침                   |
| `i18n/locales/{ko,en,vi,zh,th}/library.json` (수정)                | 섹션 명칭 3키                              |

---

## Chunk 1: 파생 로직

### Task 1: `buildCategoryBundles`

**Files:**

- Create: `packages/client/src/features/continuous/lib/category-bundles.ts`
- Test: `packages/client/src/features/continuous/lib/category-bundles.test.ts`

- [x] **Step 1: 실패하는 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { buildCategoryBundles } from './category-bundles';

const b = (id: string, category: string, title: string, isPublic = true) => ({
  id,
  category,
  title,
  isPublic,
});

describe('buildCategoryBundles', () => {
  it('카테고리별로 앞에서 3권씩 묶는다', () => {
    const out = buildCategoryBundles([
      b('1', '공룡', '01. 가'),
      b('2', '공룡', '02. 나'),
      b('3', '공룡', '03. 다'),
      b('4', '공룡', '04. 라'),
      b('5', '식물', '01. 마'),
      b('6', '식물', '02. 바'),
      b('7', '식물', '03. 사'),
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ category: '공룡', bookIds: ['1', '2', '3'] });
    expect(out[1]).toEqual({ category: '식물', bookIds: ['5', '6', '7'] });
  });

  it('제목의 앞 번호를 숫자로 정렬한다(문자열 정렬이면 10이 2보다 앞선다)', () => {
    const out = buildCategoryBundles([
      b('c', '생활', '10. 다'),
      b('a', '생활', '02. 가'),
      b('b', '생활', '03. 나'),
    ]);
    expect(out[0].bookIds).toEqual(['a', 'b', 'c']);
  });

  it('비공개 책은 제외한다', () => {
    const out = buildCategoryBundles([
      b('1', '공룡', '01. 가'),
      b('2', '공룡', '02. 나', false),
      b('3', '공룡', '03. 다'),
      b('4', '공룡', '04. 라'),
    ]);
    expect(out[0].bookIds).toEqual(['1', '3', '4']);
  });

  it('2권 미만인 카테고리는 묶음을 만들지 않는다', () => {
    expect(buildCategoryBundles([b('1', '공룡', '01. 가')])).toEqual([]);
  });

  it('2권만 있으면 2권짜리 묶음을 만든다', () => {
    const out = buildCategoryBundles([b('1', '공룡', '01. 가'), b('2', '공룡', '02. 나')]);
    expect(out[0].bookIds).toEqual(['1', '2']);
  });

  it('카테고리가 없는 책은 제외한다', () => {
    const out = buildCategoryBundles([
      { id: 'x', title: '무카테고리', isPublic: true },
      b('1', '공룡', '01. 가'),
      b('2', '공룡', '02. 나'),
    ] as any);
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('공룡');
  });

  it('perBundle 을 바꿀 수 있다', () => {
    const out = buildCategoryBundles(
      [b('1', '공룡', '01'), b('2', '공룡', '02'), b('3', '공룡', '03')],
      2
    );
    expect(out[0].bookIds).toEqual(['1', '2']);
  });

  it('빈 입력이면 빈 배열', () => {
    expect(buildCategoryBundles([])).toEqual([]);
  });
});
```

- [x] **Step 2: 실패 확인**

Run: `pnpm --filter @tangobook/client exec vitest run src/features/continuous/lib/category-bundles.test.ts`
Expected: FAIL — 모듈 없음

- [x] **Step 3: 구현**

```ts
/**
 * 라이브러리 목록에서 "카테고리별 첫 N권" 묶음을 파생한다.
 *
 * 🔴 묶음을 저장하지 않는 이유: 책 id 를 상수로 박아두면 책이 비공개·삭제될 때 조용히 썩는다.
 * 매번 현재 목록에서 계산하면 그 문제가 아예 없다.
 */
export interface CategoryBundle {
  category: string; // R2 원본 한국어 카테고리명 — 표시할 때 categoryLabel() 로 변환
  bookIds: string[]; // 재생 순서
}

interface BookLike {
  id: string;
  title?: string;
  category?: string;
  isPublic?: boolean;
}

/** "01. 골고루" → 1 · 번호 없으면 null */
function leadingNumber(title: string): number | null {
  const m = /^\s*(\d+)\./.exec(title);
  return m ? Number(m[1]) : null;
}

/** 번호가 있으면 번호순, 없으면 제목순. 문자열 정렬만 쓰면 "10"이 "2"보다 앞서므로 분리한다. */
function compareBooks(a: BookLike, b: BookLike): number {
  const na = leadingNumber(a.title ?? '');
  const nb = leadingNumber(b.title ?? '');
  if (na !== null && nb !== null) return na - nb;
  if (na !== null) return -1;
  if (nb !== null) return 1;
  return (a.title ?? '').localeCompare(b.title ?? '', 'ko');
}

export function buildCategoryBundles(books: BookLike[], perBundle = 3): CategoryBundle[] {
  const byCategory = new Map<string, BookLike[]>();
  for (const book of books) {
    if (book.isPublic === false) continue;
    const category = book.category;
    if (!category) continue;
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category)!.push(book);
  }

  const out: CategoryBundle[] = [];
  for (const [category, list] of byCategory) {
    const bookIds = [...list]
      .sort(compareBooks)
      .slice(0, perBundle)
      .map((b) => b.id);
    if (bookIds.length < 2) continue; // 한 권짜리는 묶음이 아니다
    out.push({ category, bookIds });
  }
  return out;
}
```

- [x] **Step 4: 통과 확인**

Run: `pnpm --filter @tangobook/client exec vitest run src/features/continuous/lib/category-bundles.test.ts`
Expected: PASS (8 tests)

- [x] **Step 5: 커밋**

```bash
git add packages/client/src/features/continuous/lib/category-bundles.ts packages/client/src/features/continuous/lib/category-bundles.test.ts
git commit -m "feat(continuous): derive category bundles from the live library"
```

---

## Chunk 2: 화면과 수정

### Task 2: 빌더 쿼리파라미터 프리필

**Files:**

- Modify: `packages/client/src/features/continuous/pages/ContinuousBuilder.tsx`

- [x] **Step 1: 프리필 추가**

`useSearchParams()` 로 `books`(쉼표구분 id), `name`, `lang` 을 읽어 기존 `prefilledRef` 패턴과 동일하게 **한 번만** 채운다.

```tsx
const [searchParams] = useSearchParams();
// 편집 모드(editId)가 우선. 쿼리 프리필은 묶어 보기에서 "수정"으로 들어온 경우.
useEffect(() => {
  if (editId || prefilledRef.current) return;
  const ids = (searchParams.get('books') ?? '').split(',').filter(Boolean);
  if (!ids.length) return;
  prefilledRef.current = true;
  setSelectedIds(ids);
  const n = searchParams.get('name');
  if (n) setName(n);
  const l = searchParams.get('lang');
  if (l) setLanguage(l);
}, [editId, searchParams]);
```

🔴 기존 `editId` 프리필과 **같은 `prefilledRef` 를 공유**해 두 경로가 서로 덮어쓰지 않게 한다.

- [x] **Step 2: 기존 테스트 통과 확인**

Run: `pnpm --filter @tangobook/client exec vitest run src/features/continuous`
Expected: PASS (기존 그대로)

- [x] **Step 3: 커밋**

```bash
git add packages/client/src/features/continuous/pages/ContinuousBuilder.tsx
git commit -m "feat(continuous): prefill builder from query params"
```

---

### Task 3: `PlaylistCard` — 삭제 버튼 optional

**Files:**

- Modify: `packages/client/src/features/continuous/components/PlaylistCard.tsx`

- [x] **Step 1:** `onDelete` 를 optional 로 바꾸고 없으면 삭제 버튼을 렌더하지 않는다. `onEdit` 은 묶음도 쓰므로 필수 유지.
- [x] **Step 2:** Run `pnpm --filter @tangobook/client exec vitest run src/features/continuous` → PASS
- [x] **Step 3:** 커밋 `refactor(continuous): make PlaylistCard delete optional`

---

### Task 4: `PlaylistLibrarySection` — 묶음 렌더 · 명칭 · 기본 펼침

**Files:**

- Modify: `packages/client/src/features/continuous/components/PlaylistLibrarySection.tsx`
- Test: `packages/client/src/features/continuous/components/PlaylistLibrarySection.test.tsx`

- [x] **Step 1: 실패하는 테스트 추가**

```tsx
it('게스트에게도 카테고리 묶음이 보인다', async () => {
  // account=null → 묶음 카드가 렌더된다
});
it('로그인 사용자에게도 같은 묶음이 보인다', async () => {
  // account 있음 → 동일한 묶음 + "내가 만든 세트"
});
it('기본이 펼침이다', async () => {
  // 토글 없이 카드가 보인다
});
```

- [x] **Step 2:** Run → FAIL (게스트는 `return null`)

- [x] **Step 3: 컴포넌트 수정**

1. `if (!account) return null` **제거**
2. `useState(false)` → `useState(true)`
3. `buildCategoryBundles(books ?? [])` 로 묶음 계산 (`useMemo`)
4. 묶음 카드: 이름 `catLabel(bundle.category)`(= `useCategoryLabel()`), 재생 `beginPlaylist(bundle.bookIds, i18n.language, navigate)`,
   수정 `navigate('/continuous/new?books=' + bundle.bookIds.join(',') + '&name=' + encodeURIComponent(catLabel(bundle.category)))`, `onDelete` 미전달
5. 로그인 사용자는 묶음 아래 `t('playlist.mySets')` 소제목 + 기존 내 세트 행
6. `books` 로딩 중이면 묶음 행은 렌더하지 않는다

🔴 게스트·로그인 **묶음 부분은 완전히 동일**해야 한다. 분기는 "내 세트" 영역에만 존재한다.

- [x] **Step 4:** Run `pnpm --filter @tangobook/client exec vitest run src/features/continuous` → PASS
- [x] **Step 5:** 커밋 `feat(library): show category bundles to everyone`

---

### Task 5: i18n (5개 언어)

**Files:** `packages/client/src/i18n/locales/{ko,en,vi,zh,th}/library.json`

- [x] **Step 1:** `playlist.title` / `playlist.subtitle` / `playlist.mySets` 3개만 수정·추가. 세트 이름은 카테고리 라벨을 쓰므로 **신규 키 없음**.

- ko: `title`=`"묶어 보기"`, `subtitle`=`"여러 권을 이어서 들려주는 묶음이에요"`, `mySets`=`"내가 만든 세트"`
- en: `"Story bundles"` / `"Ready-made bundles that play several books in a row"` / `"My sets"`
- vi·zh·th: 동일 구조로 번역

- [x] **Step 2:** Run `node packages/client/scripts/verify-locales.mjs` → 통과
- [x] **Step 3:** 커밋 `i18n(library): rename playlist section to bundles`

---

## Chunk 3: 검증

### Task 6: 전체 검증

- [x] **Step 1:** `pnpm --filter @tangobook/client typecheck` → 에러 0
- [x] **Step 2:** `pnpm --filter @tangobook/client exec vitest run` → 전체 PASS
- [x] **Step 3: 실제 화면 (@verify)** — `/library` 에서
  - 로그아웃 → 「묶어 보기」가 펼쳐진 채 카테고리 묶음이 보인다
  - 카드 탭 → 연속재생 시작
  - 카드 ✏️ → 빌더가 그 책들로 프리필된 채 열린다
  - 로그인 → 같은 묶음 + 「내가 만든 세트」
  - 375px 가로 스크롤·`break-keep` 정상

  🔴 R2 없는 환경이면 `API_TARGET` 로 프로덕션 API 를 봐야 책 목록이 뜬다.

- [x] **Step 4:** 최종 커밋

---

## 미해결 / 후속

- 카테고리 표시 순서는 `books` 배열의 카테고리 첫 등장 순서를 따른다. 라이브러리 행 순서와 어긋나 보이면
  `features/library/lib/category-order.ts` 의 comparator 를 재사용하도록 바꾼다(지금은 YAGNI).
- 잠긴 책이 묶음에 섞여 있으면 재생 중 뷰어 게이팅에 걸린다 — 기존 재생목록과 동일 동작이라 별도 처리하지 않는다.
