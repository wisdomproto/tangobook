# 학습 리포트 개선 (동화책 중심) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부모 학습 리포트를 동화책 중심으로 재편 — 정직한 지표(완독/읽은시간/연속일, KST) + 만난 단어, 파닉스/어휘/활동 탭은 dev-only.

**Architecture:** 순수 집계 함수(`aggregate.ts`)를 먼저 확장·테스트하고, `StorybookReportSection`을 그 위에서 재구성, `ParentReportsPage`는 기본 탭·dev 필터·헤더만 손댐. 기존 마스터리/decay·파닉스/어휘 컴포넌트는 보존(삭제 X), dev에게만 노출.

**Tech Stack:** React 18 + TanStack Query + Tailwind / Vitest. 순수 함수 TDD.

**Spec:** [../specs/2026-07-01-learning-reports-improvement-design.md](../specs/2026-07-01-learning-reports-improvement-design.md) (리뷰 반영 완료 — 확정값 §5 참조).

**전제:** subagent-driven. 브랜치 `feat/reports-improvement`(from main). UI 한국어, 코드/커밋 영어. 관련 파일만 커밋.

---

## Chunk 1: aggregate.ts 순수 집계 함수 (foundational, TDD)

**Files:**
- Modify: `packages/client/src/features/learning/lib/aggregate.ts`
- Test: `packages/client/src/features/learning/lib/aggregate.test.ts` (기존 파일 확장)

이벤트 타입 참고: `LearningEvent { event_type, profile_id, metadata, created_at }`. `page_read` metadata = `{ page, totalPages, lastPage, storybookId }`. `word_exposed` metadata = 단어 정보(구현 전 `groupByWord`가 어떻게 읽는지 확인 — 재사용).

- [ ] **Step 1: `kstDateKey` 실패 테스트** — UTC ISO → KST(+9h) 로컬 `YYYY-MM-DD`.
```ts
import { kstDateKey } from './aggregate';
describe('kstDateKey', () => {
  it('UTC 2026-07-01T20:00Z → KST 다음날 2026-07-02', () => {
    expect(kstDateKey('2026-07-01T20:00:00Z')).toBe('2026-07-02'); // KST 05:00
  });
  it('UTC 2026-07-01T10:00Z → KST 같은날 2026-07-01', () => {
    expect(kstDateKey('2026-07-01T10:00:00Z')).toBe('2026-07-01'); // KST 19:00
  });
});
```
- [ ] **Step 2: fail 확인** `pnpm --filter client exec vitest run src/features/learning/lib/aggregate.test.ts`
- [ ] **Step 3: 구현** — `kstDateKey(iso) { const t=Date.parse(iso)+9*3600_000; return new Date(t).toISOString().slice(0,10); }` (고정 +9h, DST 없음).
- [ ] **Step 4: pass 확인**
- [ ] **Step 5: `completedBooks` 실패 테스트** — `page_read` && `lastPage===true` && `totalPages>0` 그룹핑 → `{storybookId,count,lastAt}[]`. 같은 책 2세션 완독 → count=2. 중간페이지만(lastPage=false) → 미포함. totalPages=0 → 제외.
- [ ] **Step 6~8: 구현 + pass**
- [ ] **Step 9: `estimateReadingMinutes` 실패 테스트** — `page_read` 시간순, 인접 gap ≤ 5분=같은 세션. 세션 내 gap 합산(페이지당 상한 120초), 세션당 최소 30초. 단일 이벤트 → 30초(=0분 아님, 반올림 "약 1분" 또는 초 반환). 큰 gap(>5분) → 세션 분리.
```ts
// 예: 3 page_read at 0s, 60s, 3600s(=1h gap) → 세션1(0,60s)=60s + 세션2(1개)=30s = 90s
```
- [ ] **Step 10~12: 구현 + pass** — 반환은 분(반올림, 최소 표기 배려) 또는 초; 컴포넌트에서 "약 N분".
- [ ] **Step 13: `computeStreak` 실패 테스트** — KST 날짜 distinct 연속일. 기준 오늘(KST) 또는 어제까지 연속이면 유지, 그제 이하 끊김이면 0. `now` 주입(결정성).
- [ ] **Step 14~16: 구현 + pass**
- [ ] **Step 17: `booksThisWeek` 실패 테스트** — 최근 7일(KST, now 기준) 이벤트 pre-filter 후 기존 `countDistinctBooks` **재사용**.
- [ ] **Step 18~20: 구현 + pass**
- [ ] **Step 21: `metWords` 실패 테스트** — `word_exposed` 이벤트 → 기존 `groupByWord` 재사용해 distinct 단어 목록(+lang 필터). "만난 단어".
- [ ] **Step 22~24: 구현(재사용 wrapper) + pass**
- [ ] **Step 25: Commit** `feat(reports): aggregate helpers (KST date, completion, reading-time, streak, this-week, met-words)`

---

## Chunk 2: 동화책 리포트 재구성 (StorybookReportSection)

**Files:**
- Create: `packages/client/src/features/learning/components/StorybookSummaryCards.tsx` (요약 3)
- Create: `packages/client/src/features/learning/components/CompletedBooksList.tsx`
- Modify: `packages/client/src/features/learning/components/StorybookReportSection.tsx` (재구성)
- (재사용) `ArtStyleDistributionCard` — 접기 wrapper
- Test: `StorybookReportSection.test.tsx`(신규 또는 확장)

- [ ] **Step 1: StorybookSummaryCards** — props `{ booksThisWeek:number; minutes:number; streak:number }` → 3 StatChip 카드: `이번 주 N권` · `약 N분` · `연속 N일`. 디자인 토큰. `break-keep`.
- [ ] **Step 2: CompletedBooksList** — props `{ items: {storybookId,count,lastAt}[]; storybooks }` → 표지+제목+`N회 완독`+최근일. lookup 실패 책은 **skip**(“(알 수 없는 책)” 노출 X).
- [ ] **Step 3: StorybookReportSection 재구성** — 기존 "총 페이지" StatChip 제거. Chunk1 함수로 요약3 + CompletedBooksList + 만난단어(칩, metWords, 언어탭 유지) + `ArtStyleDistributionCard`(기본 접힘 `<details>` "이런 그림체를 좋아해요"). events/storybooks/lang props 유지.
- [ ] **Step 4: 실패→통과 테스트** — 완독 목록 렌더, "총 페이지" 텍스트 없음(회귀 방지), 만난단어 칩, 요약 카드 3.
- [ ] **Step 5: typecheck + vitest** `pnpm --filter client exec vitest run src/features/learning && tsc --noEmit`
- [ ] **Step 6: Commit** `feat(reports): storybook report — summary/completed/met-words, drop page-total`

---

## Chunk 3: ParentReportsPage (기본 탭 · dev-only 탭 · 헤더)

**Files:**
- Modify: `packages/client/src/features/auth/pages/ParentReportsPage.tsx`
- Test: `ParentReportsPage.test.tsx`(신규)

- [ ] **Step 1: 실패 테스트** — 로그인 비-dev 계정(`account.email` non-dev): 탭바에 파닉스/어휘/활동 **없음**, 동화책만, 기본 탭=동화책. dev 이메일(`kil210@tangobook.co.kr`): 4탭 다 보임. (mock useAuth account.email, activeProfile, useLearningEvents, useStorybooks.)
- [ ] **Step 2: fail 확인**
- [ ] **Step 3: 구현** — `const { account, activeProfile, isConfigured } = useAuth();` 추가. `const isDev = isDevEmail(account?.email);`. 기본 탭 `useState<MainTab>('storybook')`. `TAB_DEFS` 를 `isDev ? 전체 : [storybook만]` 로 필터. 헤더 `최근 이벤트 N건` → 부모 문구(예: `이번 주 {booksThisWeek}권`). (게스트는 이미 early-return이라 추가 처리 불필요.)
- [ ] **Step 4: 통과 확인 + tsc**
- [ ] **Step 5: 수동/프리뷰** — 로그인(비-dev)으로 /parent/reports → 동화책 탭만, 요약·완독·만난단어. dev로 → 4탭.
- [ ] **Step 6: Commit** `feat(reports): storybook-default tab + dev-only phonics/vocab/activity + parent header`

---

## 최종 검증
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm --filter client test` — 신규 green, 기존 회귀 없음(사전 실패 10건 = main 동일).
- [ ] 수동 QA: 김보배 프로필(데이터 有) 리포트 → 완독/읽은시간/연속일/만난단어 정상, "총 페이지" 없음, 날짜 KST. 빈 프로필 → empty state.
- [ ] "업데이트 하자"(CLAUDE.md·memory·spec/plan·commit·push).

## 미확정 (구현 중, 사소)
- 요약 카드 3 vs 4(완독 총권수) · 만난단어 표시 상한 · 그림체 접기 UI(`<details>` vs 커스텀).
