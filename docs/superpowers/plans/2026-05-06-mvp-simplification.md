# MVP 단순화 — 도감 폐지 + 별 UI OFF + 어휘탭 동화 단원만 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 도감 시스템 (UI / 서버 / DB / 타입 / 스크립트) 완전 폐지 + 아이 화면 별 카운터 UI 제거 + 어휘 hub 에 동화 derived 단원만 노출. 베타 출시 단순화.

**Architecture:** 의존성 root 부터 정리 (DB → shared 타입 → server → client). 각 영역은 자체 typecheck/build 로 verify. 최종 dev server 에서 manual smoke + 어휘 derive 자동 동기화 검증 (신규 책 추가 / KeyObject 수정).

**Tech Stack:** TypeScript / React 18 / Vite / Express 5 / Supabase Postgres / pnpm workspaces

**Spec:** [docs/superpowers/specs/2026-05-06-mvp-simplification-design.md](../specs/2026-05-06-mvp-simplification-design.md)

---

## 사전 준비 (Chunk 0)

### Task 0-1: Baseline 확인

**Files:**
- Read: `git status`

- [ ] **Step 1: 현재 untracked + modified 확인**

```bash
git status
```

Expected: `M packages/client/src/features/vocabulary-unit/components/VocabularyStudyPage.tsx` 등 in-flight 변경 다수. **이 변경들은 본 plan 과 무관할 수 있으므로 사용자에게 묻고 stash 또는 commit 후 진입.**

- [ ] **Step 2: VocabularyStudyPage in-flight diff 확인**

```bash
git diff packages/client/src/features/vocabulary-unit/components/VocabularyStudyPage.tsx
```

본 plan Task 3-4 가 VocabularyStudyPage 수정. 분기:
- **변경이 본 plan 과 호환** (예: 게임 grid 개선 등): 그대로 두고 Task 3-4 가 위에 추가 수정
- **변경이 본 plan 과 충돌** (예: 별 카운터 위치 변경 등): 사용자에게 선택 — stash 후 Task 3-4 적용 후 pop or commit 후 진입

- [ ] **Step 3: 무관한 untracked 파일 처리**

`comfyui-*.mjs`, `inspect-jack-r2.mjs`, `sync-jack-pixar-3d-to-v1.mjs` 등 본 plan 과 무관 — 사용자에게 묻고 별도 처리 (stash / 별 commit / 그대로 둠).

- [ ] **Step 4: 사용자에게 진입 확인**

> "현재 브랜치에 in-flight 변경 있어요. 위 분석 결과를 보고 어떻게 처리할까요? (commit / stash / worktree 격리)"

- [ ] **Step 5: typecheck baseline**

```bash
pnpm typecheck
```

Expected: 현재 0 errors (만약 errors 있으면 본 plan 진입 전 해결).

### Task 0-2: Collection 의존 최종 grep 검증

**Files:**
- Grep across project root

- [ ] **Step 1: 모든 collection 참조 grep**

```bash
# 클라 + 서버 + shared 에서 collection 식별자 전체 grep
```

Use Grep tool with these patterns (output_mode=files_with_matches):
- `useCollectionUserState|useCollectionCatalog|useStorybookCardIndex`
- `COLLECTION_CATEGORIES|CollectionItem|CollectionStatus|CollectionUserRecord|CollectionCategoryId`
- `collectionItemIds|dexCategory`
- `from '@/features/collection'`
- `<StarCounter`
- `collection_user|activate_collection_item|card_unlock`
- `/collection`

Expected: spec §3 ~ §4 에 명시된 파일 외 추가 callsite 없음. 있으면 spec 보강 후 진입.

### Task 0-3: Migration 적용 상태 + Trigger 본문 source 결정 (Chunk 1 prerequisite)

**Files:**
- Read: `scripts/supabase-rewards-setup.sql`, `scripts/migrations/2026-05-06-word-game-completed.sql`
- Verify via MCP: `mcp__supabase__list_migrations`

- [ ] **Step 1: 적용 이력 확인**

```
mcp__supabase__list_migrations()
```

`word_game_completed` 또는 그 SQL 내용과 매칭되는 migration 이 적용 list 에 있는지 확인.

- [ ] **Step 2: Trigger 본문 source 결정**

| 조건 | Source for Task 1-1 의 새 trigger 본문 |
|---|---|
| word-game-completed 적용됨 | `scripts/migrations/2026-05-06-word-game-completed.sql` lines 16-189 (latest, 더 새로움) |
| 미적용 | `scripts/supabase-rewards-setup.sql` lines 284-479 (`handle_learning_event` 정의) |

- [ ] **Step 3: 기록**

결정한 source 와 trigger 본문 lines (시작-끝) 을 메모. Task 1-1 에서 사용.

---

## Chunk 1: Foundation — DB Migration + Shared 타입

### Task 1-1: drop_collection_system.sql 작성 (single step, body inlined)

**Files:**
- Create: `scripts/migrations/2026-05-06-drop-collection-system.sql`
- Read sources (per Task 0-3 결정):
  - `scripts/supabase-rewards-setup.sql` lines **284-479** (handle_learning_event 정의), 또는
  - `scripts/migrations/2026-05-06-word-game-completed.sql` lines **16-189** (latest override)

- [ ] **Step 1: Source 파일 read + 최신 trigger 본문 추출**

Task 0-3 에서 결정한 source 파일을 Read tool 로 읽기. `CREATE OR REPLACE FUNCTION public.handle_learning_event() ... $$;` 블록 전체 추출.

추출한 본문에서 **제거할 부분 (정확한 패턴):**
- `IF NEW.event_type = 'page_read'` 안의 `metadata->'collectionItemIds'` 루프 + collection_user upsert + card_unlock star_ledger insert
- `IF NEW.event_type = 'word_game_completed'` 안의 collection_user activate 분기 + card_unlock star_ledger insert (word-game-completed.sql line ~136-193)

**보존할 부분:**
- page_read 의 word_mastery upsert + read_page star adjustment
- book_completed / vocab_exposure / word_game_completed 의 word_mastery 처리 + star_ledger inserts (card_unlock 외 reason)
- streak / 일일 학습 이벤트 처리 (있다면)

- [ ] **Step 2: 새 migration 파일 생성 — body inlined**

```sql
-- 2026-05-06 — Drop Collection System (MVP simplification)
-- Spec: docs/superpowers/specs/2026-05-06-mvp-simplification-design.md
--
-- Drops collection_user table + activate_collection_item RPC.
-- Rewrites handle_learning_event() to remove silhouette/owned/card_unlock branches.
-- Preserves star_ledger.card_unlock enum value (legacy data, new accruals naturally 0).
-- Preserves word_mastery and other learning event handling.

BEGIN;

-- 1. Drop collection_user table (no FK dependents — verified 2026-05-06)
DROP TABLE IF EXISTS public.collection_user CASCADE;

-- 2. Drop activate_collection_item RPC
DROP FUNCTION IF EXISTS public.activate_collection_item(uuid, text) CASCADE;

-- 3. Rewrite handle_learning_event() trigger function
CREATE OR REPLACE FUNCTION public.handle_learning_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- [INLINE: Step 1 에서 추출한 본문 전체. collection 분기만 제거된 형태]
  -- ... actual SQL body here ...
  RETURN NEW;
END;
$$;

COMMIT;
```

**중요:** Step 2 는 `[INLINE: ...]` placeholder 가 아니라 **실제 SQL 본문**을 그 자리에 작성. 한 번의 Write 로 완결.

- [ ] **Step 3: SQL syntax manual review**

Expected: BEGIN/COMMIT 짝. 함수 본문 syntax 정상. collection 관련 식별자 (`collection_user`, `activate_collection_item`, `collectionItemIds`, `card_unlock` insert) 0회 등장.

- [ ] **Step 4: 작성 후 적용 전까지 commit 보류** — Task 1-4 (apply migration) 성공 후 일괄 commit (Task 1-3 종료 시).

### Task 1-2: supabase-rewards-setup.sql in-place patch

**Files:**
- Modify: `scripts/supabase-rewards-setup.sql`

- [ ] **Step 1: collection_user 테이블 정의 제거 (line 113-133 부근)**

Read 로 정확한 line range 확인 후, 다음 블록 삭제:
```sql
CREATE TABLE IF NOT EXISTS public.collection_user (
  ...
);
CREATE INDEX ... ON collection_user ...;
```

- [ ] **Step 2: collection_user RLS enable + policy 제거 (line 175 부근, line 204-206 부근)**

```sql
ALTER TABLE public.collection_user ENABLE ROW LEVEL SECURITY;  -- 삭제
CREATE POLICY ... ON public.collection_user ...;                -- 삭제
```

- [ ] **Step 3: handle_learning_event() 함수 정의 갱신 (line 405-471 부근)**

Task 1-1 의 새 함수 본문과 동일한 형태로 in-place 갱신. 새 환경에서 setup script 만 돌려도 일관된 상태.

- [ ] **Step 4: activate_collection_item RPC 제거 (line 576-605 부근)**

```sql
CREATE OR REPLACE FUNCTION public.activate_collection_item(...) ...  -- 블록 삭제
```

- [ ] **Step 5: typecheck / SQL 변경 사항 manual review**

Expected: 변경 후에도 supabase-rewards-setup.sql 가 self-contained idempotent setup script.

- [ ] **Step 6: Commit 보류** — Task 1-4 Step 4 의 일괄 commit 에 포함됨.

### Task 1-3: 2026-05-06-word-game-completed.sql 정리

**Files:**
- Modify or keep: `scripts/migrations/2026-05-06-word-game-completed.sql`

Task 0-3 에서 확인한 적용 상태 사용:

- [ ] **Step 1: 분기 처리**

- **이미 적용됨**: 파일은 historical record 로 보존. drop_collection_system.sql 이 trigger 를 덮어쓰므로 net effect = collection 분기 0. **수정 불필요.**
- **미적용**: 파일에서 collection_user INSERT 블록 (line 136-193) 제거. word_game_completed 처리만 남기고 trigger ALTER 부분도 collection 분기 제외 형태로 수정.

- [ ] **Step 2: Commit (수정한 경우만)**

```bash
git add scripts/migrations/2026-05-06-word-game-completed.sql
git commit -m "fix(db): strip collection_user inserts from word-game-completed migration"
```

### Task 1-4: Supabase 적용 (drop migration)

**Files:**
- Apply via MCP: `mcp__supabase__apply_migration`

- [ ] **Step 1: 사용자에게 적용 확인**

> "Supabase 에 drop_collection_system migration 적용할게요. (`collection_user` 테이블 영구 drop). 베타 직전이라 collection_user 데이터는 이미 truncate 됨 (메모리 기록). OK?"

- [ ] **Step 2: Apply migration via MCP**

```
mcp__supabase__apply_migration({
  name: "drop_collection_system",
  query: <full SQL from scripts/migrations/2026-05-06-drop-collection-system.sql>
})
```

- [ ] **Step 3: 적용 후 검증**

```
mcp__supabase__list_tables(schemas: ["public"])
```

Expected: `collection_user` 가 list 에 없음.

```
mcp__supabase__execute_sql({ query: "SELECT proname FROM pg_proc WHERE proname = 'activate_collection_item'" })
```

Expected: 0 rows.

- [ ] **Step 4: Migration + setup script 일괄 commit**

```bash
git add scripts/migrations/2026-05-06-drop-collection-system.sql scripts/supabase-rewards-setup.sql
git commit -m "feat(db): drop collection_user table + rewrite trigger (MVP simplification)"
```

### Task 1-5: shared/types/collection.ts 삭제

**Files:**
- Delete: `packages/shared/src/types/collection.ts`

- [ ] **Step 1: 파일 삭제**

```bash
rm packages/shared/src/types/collection.ts
```

- [ ] **Step 2: typecheck — break 예상**

```bash
pnpm --filter @tangobook/shared typecheck
```

Expected: FAIL — `storybook.ts:1` 의 `import type { CollectionCategoryId } from './collection.js';` break.

### Task 1-6: shared/types/storybook.ts import + dexCategory 제거

**Files:**
- Modify: `packages/shared/src/types/storybook.ts`

- [ ] **Step 1: line 1 import 제거**

```diff
- import type { CollectionCategoryId } from './collection.js';
```

- [ ] **Step 2: KeyObject 인터페이스에서 dexCategory 필드 제거**

Grep `KeyObject` 정의 위치 확인 후 해당 줄 제거:
```diff
interface KeyObject {
  ...
- dexCategory?: CollectionCategoryId;
  ...
}
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/shared typecheck
```

Expected: PASS (storybook 단위)

### Task 1-7: shared/types/learning-events.ts collectionItemIds 제거

**Files:**
- Modify: `packages/shared/src/types/learning-events.ts`

- [ ] **Step 1: LearningEventMetadata 에서 collectionItemIds 제거**

```diff
interface LearningEventMetadata {
  ...
- collectionItemIds?: string[];
  ...
}
```

- [ ] **Step 2: (Optional, advisory) LearningEventType union 에 word_game_completed 추가 검토**

본 spec 비범위지만 reviewer flag 가 있었음. 현재 union 정의 확인:
```bash
# Read learning-events.ts:3-12
```

추가 안 함 (orthogonal). 향후 별도 fix.

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/shared typecheck
```

### Task 1-8: shared/index.ts exports 정리

**Files:**
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: collection 관련 export 라인 제거**

```diff
- export * from './types/collection.js';
```

- [ ] **Step 2: typecheck — 전체**

```bash
pnpm typecheck
```

Expected: FAIL — 클라/서버에서 collection 타입 import 하는 callsite 다수. 본 plan Chunk 2-3 에서 정리.

- [ ] **Step 3: Commit**

```bash
git add packages/shared
git commit -m "refactor(shared): drop Collection types + KeyObject.dexCategory + LearningEventMetadata.collectionItemIds"
```

---

## Chunk 2: Server — Collection 폴더 + sync hook + 스크립트 정리

### Task 2-1: services/collection.service.ts 삭제

**Files:**
- Delete: `packages/server/src/services/collection.service.ts`

- [ ] **Step 1: 파일 삭제**

```bash
rm packages/server/src/services/collection.service.ts
```

### Task 2-2: controllers + routes/collection 삭제

**Files:**
- Delete: `packages/server/src/controllers/collection.controller.ts`
- Delete: `packages/server/src/routes/collection.routes.ts`

- [ ] **Step 1: 두 파일 삭제**

```bash
rm packages/server/src/controllers/collection.controller.ts
rm packages/server/src/routes/collection.routes.ts
```

### Task 2-3: app.ts/index.ts 의 routes 등록 + import 제거

**Files:**
- Modify: `packages/server/src/app.ts` 또는 `index.ts` (실제 위치 확인)

- [ ] **Step 1: collection routes 등록 위치 grep**

```
Grep: pattern="collection.routes" path="packages/server/src"
```

- [ ] **Step 2: import + app.use 양쪽 제거**

```diff
- import collectionRoutes from './routes/collection.routes.js';
- app.use('/api/collection', collectionRoutes);
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/server typecheck
```

Expected: PASS (서버 단위) 또는 storybook.service 의 sync hook break.

### Task 2-4: storybook.service.ts sync hook 제거

**Files:**
- Modify: `packages/server/src/services/storybook.service.ts`

- [ ] **Step 1: collection import + sync 호출 grep**

```
Grep: pattern="CollectionService|syncFromStorybook|removeSourcesByStorybookId" path="packages/server/src/services/storybook.service.ts"
```

- [ ] **Step 2: import 제거**

```diff
- import { CollectionService } from './collection.service.js';
```

- [ ] **Step 3: save() 후 sync 호출 제거**

```diff
- CollectionService.syncFromStorybook(saved).catch((err) => console.error('collection sync failed:', err));
```

- [ ] **Step 4: delete() 후 sync 호출 제거**

```diff
- CollectionService.removeSourcesByStorybookId(id).catch(...);
```

- [ ] **Step 5: typecheck**

```bash
pnpm --filter @tangobook/server typecheck
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/server
git commit -m "refactor(server): drop Collection service/controller/routes + storybook sync hook"
```

### Task 2-5: 스크립트 + docs 삭제

**Files:**
- Delete: 7 파일

- [ ] **Step 1: 일괄 삭제**

```bash
rm packages/server/scripts/extract-key-objects-for-dex.mjs
rm packages/server/scripts/build-key-object-dex-mapping.mjs
rm packages/server/scripts/apply-key-object-dex.mjs
rm packages/server/scripts/rebuild-word-catalog.mjs
rm scripts/seed-collection-stub.mjs
rm docs/key-object-dex-mapping.json
rm docs/collection-catalog-preview.json
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: drop collection-related scripts + docs"
```

### Task 2-6: (선택) R2 collection-catalog.json 삭제

**Files:**
- R2 bucket: `collection-catalog.json`

- [ ] **Step 1: 사용자에게 확인**

> "R2 bucket 의 `collection-catalog.json` (469 카드 카탈로그) 도 삭제할까요? 코드가 read 안 하므로 자연 dead 라 무해함."

- [ ] **Step 2: 삭제 (사용자 확인 시)**

수동 (Cloudflare R2 dashboard) 또는 스크립트.

---

## Chunk 3: Client — UI/Component 정리 + 어휘 hub 필터 + 동기화 smoke test

### Task 3-1: features/collection/ 폴더 + 라우트 삭제

**Files:**
- Delete: `packages/client/src/features/collection/` 전체
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1: 폴더 삭제**

```bash
rm -rf packages/client/src/features/collection/
```

- [ ] **Step 2: router/index.tsx import 제거 (line 24)**

```diff
- import { CollectionPage, CategoryPage, BookCardsPage } from '../features/collection';
```

- [ ] **Step 3: router/index.tsx 라우트 3개 제거 (line 47-49 부근)**

```diff
- { path: 'collection', element: <CollectionPage /> },
- { path: 'collection/book/:bookId', element: <BookCardsPage /> },
- { path: 'collection/:categoryId', element: <CategoryPage /> },
```

- [ ] **Step 4: typecheck — 클라**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: FAIL — 다른 컴포넌트에서 collection import / `<StarCounter />` 사용처 다수. Task 3-2 이하에서 정리.

### Task 3-2: AppShell.tsx — 4축 → 3축 + StarCounter 제거

**Files:**
- Modify: `packages/client/src/components/AppShell.tsx`

- [ ] **Step 1: line 4 StarCounter import 제거**

```diff
- import { StarCounter } from '@/features/rewards';
```

- [ ] **Step 2: PRIMARY_AXES 의 `내 카드` 항목 제거 (line 41-47)**

```diff
- {
-   to: '/collection',
-   iconSrc: 'section/collection.png',
-   label: '내 카드',
-   color: 'violet' as const,
-   end: false,
- },
```

- [ ] **Step 3: getPageTitle 의 collection 분기 제거 (line 64-65)**

```diff
- if (pathname.startsWith('/collection'))
-   return { iconSrc: 'section/collection.png', title: '도감' };
```

- [ ] **Step 4: 헤더 우상단 StarCounter render 제거 (line 145)**

```diff
- {activeProfile && <StarCounter />}
```

- [ ] **Step 5: 페이지 새로고침 (manual visual smoke)**

```bash
pnpm dev
```

Expected: 사이드바 3축 (동화책 / 파닉스 / 어휘). 헤더 우상단 별 카운터 없음. 프로필 + 로그아웃만.

### Task 3-3: VocabularyHubPage.tsx — Cambridge/Custom 필터 + StarCounter 제거

**Files:**
- Modify: `packages/client/src/features/vocabulary-unit/components/VocabularyHubPage.tsx`

- [ ] **Step 1: line 5 StarCounter import 제거**

```diff
- import { StarCounter } from '@/features/rewards';
```

- [ ] **Step 2: line 95-96 cambridge/custom filter 제거**

```diff
- const cambridge = publicUnits.filter((u) => u.source === 'cambridge-starters');
- const custom = publicUnits.filter((u) => u.source === 'custom');
```

- [ ] **Step 3: line 119-122 return 단순화**

```diff
- return {
-   cambridge,
-   custom,
-   storybookGroups: orderedCats.map((cat) => ({ cat, units: storybookByCategory.get(cat)! })),
- };
+ return {
+   storybookGroups: orderedCats.map((cat) => ({ cat, units: storybookByCategory.get(cat)! })),
+ };
```

- [ ] **Step 4: line 125-128 totalCount 단순화**

```diff
- const totalCount =
-   grouped.cambridge.length +
-   grouped.custom.length +
-   grouped.storybookGroups.reduce((s, g) => s + g.units.length, 0);
+ const totalCount = grouped.storybookGroups.reduce((s, g) => s + g.units.length, 0);
```

- [ ] **Step 5: line 148 StarCounter render 제거**

```diff
- <StarCounter />
```

- [ ] **Step 6: line 165-187 render 정리 — Cambridge / Custom Section 제거**

```diff
- <Section title="Cambridge 토픽" emoji="📚" units={grouped.cambridge} onClickUnit={handleClickUnit} />
  {grouped.storybookGroups.map((g) => (
    <Section key={g.cat} title={g.cat} emoji="📖" units={g.units} onClickUnit={handleClickUnit} />
  ))}
- <Section title="내 단원" emoji="🎨" units={grouped.custom} onClickUnit={handleClickUnit} />
```

- [ ] **Step 7: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 8: dev server 에서 manual smoke**

```bash
pnpm dev
```

`/vocabulary` 진입. Expected: 동화 단원만 카테고리 그룹화 노출. Cambridge / Custom 섹션 없음. StarCounter 없음.

### Task 3-4: VocabularyStudyPage.tsx — 도감 흔적 모두 제거

**Files:**
- Modify: `packages/client/src/features/vocabulary-unit/components/VocabularyStudyPage.tsx`

- [ ] **Step 1: line 6 StarCounter import 제거**

```diff
- import { StarCounter } from '@/features/rewards';
```

- [ ] **Step 2: 헤더 우상단 StarCounter render 제거 (line 75)**

```diff
- <StarCounter />
```

- [ ] **Step 3: line 90 카피 변경**

```diff
- <p className="mt-2 text-base text-ink-600 font-bold">
-   단어 {wordCount}개 · 게임 통과하면 도감 카드 자동 등장!
- </p>
+ <p className="mt-2 text-base text-ink-600 font-bold">
+   단어 {wordCount}개 · 모든 게임 통과해보자!
+ </p>
```

- [ ] **Step 4: line 117-123 "📚 내 카드 보기" 버튼 블록 삭제**

```diff
- <button
-   onClick={() => navigate('/collection')}
-   className="px-5 py-3 rounded-full bg-gradient-to-r from-coral-400 to-coral-500 text-white font-black shadow-pop"
- >
-   📚 내 카드 보기
- </button>
```

- [ ] **Step 5: "도감을 확인해봐" 카피도 변경 (line 115 부근)**

```diff
- <p className="mt-1 text-sm text-ink-600 font-bold">
-   모든 게임 통과 ✨ 도감을 확인해봐
- </p>
+ <p className="mt-1 text-sm text-ink-600 font-bold">
+   모든 게임 통과 ✨ 잘했어!
+ </p>
```

- [ ] **Step 6: buildCardId 헬퍼 + metadata.cardId 잔존 검색**

```
Grep: pattern="buildCardId|cardId" path="packages/client/src/features/vocabulary-unit/components/VocabularyStudyPage.tsx"
```

발견되면 모두 제거.

- [ ] **Step 7: typecheck + dev server smoke**

```bash
pnpm --filter @tangobook/client typecheck
pnpm dev
```

`/vocabulary/book-{anyId}` 진입. Expected: StarCounter 없음, "도감 카드 자동 등장" 카피 없음, "📚 내 카드 보기" 버튼 없음.

### Task 3-5: CollectionProgressCard 삭제 + ParentReportsPage 정리

**Files:**
- Delete: `packages/client/src/features/learning/components/CollectionProgressCard.tsx`
- Modify: `packages/client/src/features/learning/index.ts`
- Modify: `packages/client/src/features/auth/pages/ParentReportsPage.tsx`

- [ ] **Step 1: 파일 삭제**

```bash
rm packages/client/src/features/learning/components/CollectionProgressCard.tsx
```

- [ ] **Step 2: features/learning/index.ts:11 export 제거**

```diff
- export { CollectionProgressCard } from './components/CollectionProgressCard';
```

- [ ] **Step 3: ParentReportsPage.tsx import + render 제거**

`packages/client/src/features/auth/pages/ParentReportsPage.tsx` 에서:
```diff
- import { CollectionProgressCard } from '@/features/learning';
```
및
```diff
- <CollectionProgressCard />  (line ~101)
```

- [ ] **Step 4: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 5: dev server smoke**

`/parent/reports` 진입 (PIN 입력). Expected: 활동 탭에 CollectionProgressCard 없음. 4탭 구조 그대로 (활동/동화책/파닉스/어휘).

### Task 3-6: GameResultScreen — collection block 제거

**Files:**
- Modify: `packages/client/src/features/games/components/GameResultScreen.tsx`

- [ ] **Step 1: line 10-14 collection imports 제거**

```diff
- import { collectionApi, useStorybookCardIndex, useCollectionUserState, COLLECTION_USER_KEY } from '@/features/collection';
```
(또는 개별 import 형태 — 실제 형식 확인)

- [ ] **Step 2: activate block 제거 (line 95, 108, 111)**

`useStorybookCardIndex()` 훅 호출 + `activateForProfile` RPC 호출 + 토스트 부분 모두 제거. 게임 점수 + 별 적립 + 다음 단원 버튼 등 일반 결과 표시만 유지.

- [ ] **Step 3: typecheck + 게임 1개 manual smoke**

`/vocabulary/book-{any}` → match 게임 → 통과 후 결과 화면. Expected: "도감 N장 활성!" 토스트 없음. 별 적립 + 다음 단원 안내만.

### Task 3-7: ViewerContainer — collectionItemIds 적립 제거

**Files:**
- Modify: `packages/client/src/features/viewer/components/ViewerContainer.tsx`

- [ ] **Step 1: line 17 useStorybookCardIndex import 제거**

```diff
- import { useStorybookCardIndex } from '@/features/collection';
```

- [ ] **Step 2: 훅 호출 + metadata.collectionItemIds 채움 제거 (line 164, 179, 191, 221)**

각 page_read emit 자리에서 `collectionItemIds` 필드 제거. metadata 의 다른 필드 (page, lastPage, source, style 등) 는 유지.

- [ ] **Step 3: typecheck + 책 읽기 manual smoke**

`/viewer/{anyId}` → 페이지 넘기기 → 마지막 페이지. Expected: 책 정상 읽힘. 콘솔에서 page_read 이벤트 emit 확인 (Network 탭 supabase insert) — `collectionItemIds` 필드 없음.

### Task 3-8: WordRevealScreen — `/collection/book/...` redirect + "🃏 도감 보러 가기" 버튼 삭제

**Files:**
- Modify: `packages/client/src/features/viewer/components/WordRevealScreen.tsx`

- [ ] **Step 1: 정확한 line 위치 재확인**

```
Read packages/client/src/features/viewer/components/WordRevealScreen.tsx (offset=140, limit=10)
Read packages/client/src/features/viewer/components/WordRevealScreen.tsx (offset=325, limit=20)
```

(spec 작성 시 line 145, 331 — 코드 변동 가능, 직접 확인)

- [ ] **Step 2: 단어 클릭 시 navigate 변경 (line ~145)**

```diff
- navigate(`/collection/book/${bookId}`);
+ navigate(`/vocabulary/book-${bookId}`);
```

- [ ] **Step 3: "🃏 도감 보러 가기" 버튼 블록 전체 삭제 (line ~329-340)**

`<motion.button>` (또는 `<button>`) 으로 감싼 "🃏 도감 보러 가기" 텍스트 + onClick navigate('/collection/...') 블록 전체 제거. 인접한 "다른 책 읽기" 등 다른 버튼은 보존.

- [ ] **Step 4: typecheck + manual smoke**

`/viewer/{anyId}` → 마지막 페이지 → 핵심 단어 보기 → 단어 클릭. Expected: 어휘 학습 화면 (`/vocabulary/book-${bookId}`) 으로 이동. 도감 버튼 자체가 화면에 없음.

### Task 3-9: KeyObjectTab — dexCategory `<select>` 제거

**Files:**
- Modify: `packages/client/src/features/key-object/components/KeyObjectTab.tsx`

- [ ] **Step 1: line 18, 23 imports 제거**

```diff
- import { COLLECTION_CATEGORIES, type CollectionCategoryId } from '@tangobook/shared';
```
(또는 별개 import 형태)

- [ ] **Step 2: line 626-650 `<select>` 블록 삭제**

```diff
- {/* 도감 카테고리 — 카드 도감 활성/비활성 판단 */}
- <div className="mt-1 flex items-center justify-center">
-   <select value={obj.dexCategory ?? ''} ... >
-     <option value="">📕 도감 X</option>
-     {COLLECTION_CATEGORIES.map((c) => (...))}
-   </select>
- </div>
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: PASS (이 시점에 client typecheck 깔끔)

### Task 3-10: 동화 ↔ 어휘 자동 동기화 smoke test (spec §5-3 검증)

**Files:**
- Manual test via dev server

- [ ] **Step 1: dev server 띄움**

```bash
pnpm dev
```

- [ ] **Step 2: 신규 책 추가 검증**

`/editor` 또는 `/editor2` 에서 신규 책 1권 만들기 (간단히). 저장.

`/vocabulary` 새로고침 → 동화 단원 list 에 새 책 단원 등장 확인.

Expected: 동기화 코드 0줄로도 자동 등장. 1초 내.

- [ ] **Step 3: KeyObject 한국어 변경 검증**

기존 책 1권 골라 KeyObject 1개의 `korean` 필드 변경 (예: "호박" → "노란호박"). 저장.

`/vocabulary/book-{bookId}` 새로고침 → 학습 화면 단어 카드에 새 한국어 노출 확인.

Expected: derive 함수가 즉시 반영.

- [ ] **Step 4: 정리 후 commit**

```bash
git add packages/client
git commit -m "refactor(client): drop Collection feature + StarCounter UI + dexCategory editor"
```

### Task 3-11: CLAUDE.md sweep

**Files:**
- Modify (3 확인된 파일):
  - `packages/client/src/features/learning/CLAUDE.md`
  - `packages/client/src/features/rewards/CLAUDE.md`
  - `packages/client/src/features/storybook/CLAUDE.md`
- Modify: 루트 `CLAUDE.md`

- [ ] **Step 1: 모든 CLAUDE.md 의 collection 참조 grep**

```
Grep: pattern="collection|Collection|도감|카드 도감" type="md" path="C:\projects\tangobook"
```

위 3개 features 파일 + 루트 CLAUDE.md 확인. 추가 hit 있으면 같이 처리.

- [ ] **Step 2: features/learning/CLAUDE.md — 4탭 표에서 CollectionProgressCard 제거**

활동 탭 description 에서 CollectionProgressCard 관련 줄 제거.

- [ ] **Step 3: features/rewards/CLAUDE.md — 도감 connector 섹션 제거**

별 적립 흐름 중 card_unlock / collection 관련 섹션 제거.

- [ ] **Step 4: features/storybook/CLAUDE.md — 도감 sync hook 섹션 제거**

`saveStorybook` / `deleteStorybook` 후 collection.service.syncFromStorybook 호출하는 hook 설명 제거.

- [ ] **Step 5: 루트 CLAUDE.md 의 카드 도감 module reference 제거**

```diff
- 카드 도감 (단어 단위, 6 카테고리) → memory/collection-word-redesign.md
```

- [ ] **Step 6: Commit**

```bash
git add **/CLAUDE.md CLAUDE.md
git commit -m "docs: CLAUDE.md sweep — drop Collection module references"
```

---

## Chunk 4: Verification & Commit

### Task 4-1: 전체 typecheck / lint / build

**Files:**
- All packages

- [ ] **Step 1: typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors

- [ ] **Step 2: lint**

```bash
pnpm lint
```

Expected: 0 errors. (도감 관련 import 제거 후 unused import warning 정리)

- [ ] **Step 3: build**

```bash
pnpm build
```

Expected: 모든 패키지 빌드 성공.

### Task 4-2: Manual smoke (라우트별)

**Files:**
- dev server visual check

- [ ] **Step 1: dev server**

```bash
pnpm dev
```

- [ ] **Step 2: 사이드바 3축 확인**

`/library` 진입. Expected: 사이드바 = 동화책 / 파닉스 / 어휘 (3축, 4번째 "내 카드" 없음). 헤더 우상단 별 카운터 없음.

- [ ] **Step 3: 도감 라우트 직접 진입 시 404**

`/collection` URL 직접 입력. Expected: NotFoundPage.

- [ ] **Step 4: 어휘 hub 동화 단원만**

`/vocabulary` 진입. Expected: 카테고리별 동화 단원 list (세계 명작 / 명작동화 / ...). Cambridge 토픽 / Custom 섹션 없음.

- [ ] **Step 5: 어휘 학습 화면**

`/vocabulary/book-{anyId}` 진입. Expected: StarCounter 없음, "도감 카드 자동 등장" 카피 없음, "📚 내 카드 보기" 버튼 없음.

- [ ] **Step 6: 책 읽기 → 핵심 단어 보기 → 어휘 학습 redirect**

`/viewer/{anyId}` → 마지막 페이지 → 핵심 단어 클릭. Expected: `/vocabulary/book-${bookId}` 로 이동.

- [ ] **Step 7: 부모 리포트**

`/parent` PIN 입력 → `/parent/reports` 활동 탭. Expected: CollectionProgressCard 없음. 4탭 구조 정상.

- [ ] **Step 8: 게임 통과**

`/vocabulary/book-{anyId}` → match 게임 → 통과. Expected: "도감 N장 활성!" 토스트 없음. 별 적립 + 다음 단원 버튼만.

### Task 4-3: Memory 등록

**Files:**
- Create: `C:\Users\101024\.claude\projects\C--projects-tangobook\memory\mvp-simplification.md`
- Modify: `C:\Users\101024\.claude\projects\C--projects-tangobook\memory\MEMORY.md`

- [ ] **Step 1: memory file 작성**

```markdown
---
name: MVP 출시 단순화 (2026-05-06)
description: 도감 폐지 + 별 카운터 UI 제거 + 어휘탭 동화 단원만. 백엔드/Cambridge/Custom 코드 보존, UI/필터만 변경. spec → plan → 구현 완료.
type: project
date: 2026-05-06
---
# MVP 출시 단순화 (2026-05-06)

## 결정 (사용자 직접)
1. **도감 시스템 완전 폐지** — UI/서버/DB/타입/스크립트 모두
2. **별 카운터 UI 제거** — AppShell + VocabularyHubPage + VocabularyStudyPage 3곳. 백엔드 (star_ledger / RPC / trigger) 일단 유지 (부모 리포트 활용)
3. **어휘 탭 = 동화 단원만** — Cambridge / Custom 코드 보존, 필터로 hide
4. **Editor = URL 직접 입력만** — 사이드바 진입점 X (이미 그러함)
5. **호리방/아케이드/놀이터** = 변경 없음 (기존 OFF 가드 유지)

## 동화 ↔ 어휘 자동 동기화 보장 (사용자 명시 요구사항)
- 책 신규 추가 / 삭제 / KeyObject 변경 / 그림체 추가-삭제 → 어휘 단원 자동 반영
- 동기화 코드 0줄. `useVocabularyUnits` + `deriveStorybookUnit` 가 BookIndex 단일 source 직접 read.

## 핵심 파일 (구현 완료)
- Spec: docs/superpowers/specs/2026-05-06-mvp-simplification-design.md
- Plan: docs/superpowers/plans/2026-05-06-mvp-simplification.md
- Migration: scripts/migrations/2026-05-06-drop-collection-system.sql
- 삭제: packages/client/src/features/collection/, packages/server/src/services/collection.service.ts, packages/shared/src/types/collection.ts (+ 7 스크립트)
- 정리: AppShell 4축→3축, VocabularyHubPage 동화 단원만, ViewerContainer collectionItemIds 제거, KeyObjectTab dexCategory `<select>` 제거 등

## Post-launch backlog (참고)
Cambridge 활성화 / 도감 메타포 부활 / 별 카운터 UI 부활 / 호리방 ON 등 — spec §10 참조.

## 검증 결과
- typecheck / lint / build 통과
- 라우트별 manual smoke 통과
- 동화 ↔ 어휘 자동 동기화 smoke 통과 (신규 책 추가 / KeyObject 한국어 변경)

## 새 세션에서 도감/별/어휘 작업 시
- collection 시스템은 폐지됨 — 부활 시 spec 새로 필요
- 별 카운터 UI 부활은 호리방 ON 결정과 함께
- 어휘 탭에 Cambridge / Custom 추가는 spec §5-4 의 1줄 diff 되돌리기
```

- [ ] **Step 2: MEMORY.md index 갱신**

```markdown
## MVP 출시 단순화 (2026-05-06) ⭐ ACTIVE
See [mvp-simplification.md](mvp-simplification.md) — 도감 폐지 + 별 카운터 UI 제거 + 어휘탭 동화 단원만. 백엔드 코드 보존, UI/필터만 변경. **새 세션에서 도감/별/어휘 작업 시 이 메모리 우선 참조**.
```

기존 collection-word-redesign / collection-system 메모리 항목 옆에 "(폐지됨, mvp-simplification 참조)" 표시.

- [ ] **Step 3: Commit**

```bash
git add C:\Users\101024\.claude\projects\C--projects-tangobook\memory\
git commit -m "memory: register mvp-simplification (Collection drop + Star UI off)"
```

### Task 4-4: 루트 CLAUDE.md 모듈 인덱스 갱신

**Files:**
- Modify: `CLAUDE.md` (루트)

- [ ] **Step 1: 카드 도감 reference 제거**

```diff
- 카드 도감 (단어 단위, 6 카테고리) → memory/collection-word-redesign.md
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE): drop Collection module reference (폐지)"
```

### Task 4-5: 최종 push

**Files:**
- git push

- [ ] **Step 1: 사용자에게 push 확인**

> "모든 변경 commit 완료. `git push origin main` 진행할까요?"

- [ ] **Step 2: Push (사용자 확인 시)**

```bash
git push origin main
```

---

## 중단 시 복구 가이드

본 plan 은 Foundation (DB+shared) → Server → Client 순. 중간 중단 시 broken state 발생 가능.

| 중단 시점 | 코드 상태 | 복구 옵션 |
|---|---|---|
| Chunk 0 끝 | 변경 없음 | 그대로 종료 |
| Chunk 1 끝 (DB drop + shared types 정리) | DB collection_user 없음 + shared types 없음. 클라/서버는 import 깨짐 | (a) Chunk 2-3 이어서 진행 / (b) git revert 의 commit 들 + Supabase 에서 collection_user 복구 (rewards-setup.sql 의 백업본 적용) |
| Chunk 2 끝 (서버 정리까지) | 서버 빌드 정상. 클라 빌드 깨짐. | Chunk 3 진행 외 옵션 없음 (서버만 클라 없이 운영 불가) |
| Chunk 3 끝 (클라 정리까지) | 빌드 정상. dev 가능. | 권장 stop point (검증/문서만 남음) |
| Chunk 4 일부 | 동일 | smoke 만 더 |

**원칙:** Chunk 1 진입 후 Chunk 3 까지 완주가 안전. Chunk 1-2 만 끝내고 멈추면 클라 build 깨짐.

## Manual Smoke Tasks 자동화 fallback

Task 3-10 (어휘 동기화 smoke), Task 4-2 (라우트별 smoke) 는 dev server 에서 클릭/네비게이션 확인 필요. 자율 실행 환경에서 user interaction 불가 시:

- `[~] (Manual: user must verify)` 마크 후 다음 task 진행
- 모든 manual task 누적 list 를 plan 끝에 별도 reminder 로 출력
- 사용자가 dev server 에서 직접 확인 후 plan checklist 수동 마크

## 변경 요약

| 영역 | 삭제 | 생성 | 수정 |
|---|---|---|---|
| DB | 1 테이블 + 1 RPC | 1 migration | 2 SQL file |
| Shared | `types/collection.ts` | — | `storybook.ts`, `learning-events.ts`, `index.ts` |
| Server | 3 service/controller/routes | — | `storybook.service.ts`, `app.ts` |
| Client | `features/collection/` (10), `CollectionProgressCard.tsx` | — | `AppShell`, `router`, `VocabularyHubPage`, `VocabularyStudyPage`, `ParentReportsPage`, `GameResultScreen`, `ViewerContainer`, `WordRevealScreen`, `KeyObjectTab`, `learning/index.ts` |
| 스크립트 | 5 mjs + 2 docs json | — | — |
| CLAUDE.md | — | — | `learning`, `rewards`, root |
| Memory | — | `mvp-simplification.md` | `MEMORY.md` |

**총 commit:** 약 8-10 개

**예상 작업 시간:** 4-6 시간 (manual smoke 포함)

---

**문서 끝.**

작성: writing-plans skill (2026-05-06)
선행 spec: docs/superpowers/specs/2026-05-06-mvp-simplification-design.md
