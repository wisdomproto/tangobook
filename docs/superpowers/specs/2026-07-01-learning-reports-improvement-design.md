# 학습 리포트 개선 설계 (동화책 중심)

**날짜**: 2026-07-01
**상태**: 설계 합의 (구현 대기)
**배경**: 부모 관점 리뷰(리뷰어 subagent)가 찾은 문제들 — memory `learning-reports-parent-review-2026-07-01`.

## 1. 목표 / 비목표

**목표**: 부모가 `/parent/reports`에서 "우리 아이가 동화책으로 잘 배우고 있나"에 **정직하고 이해되는** 답을 얻게 한다. MVP에서 라이브가 아닌 영역(파닉스/어휘/별·호리·놀이터)은 부모에게 감춰 혼란을 없앤다.

**비목표**: 파닉스/어휘/활동 리포트 재설계(그건 해당 기능 라이브 시). 새 이벤트 수집 추가(기존 `page_read`/`word_exposed`로 충분). 자녀별 선택 UI(후속).

## 2. 현재 상태 (문제)

`ParentReportsPage.tsx` = 4탭 `activity(기본)/storybook/phonics/vocab`.
- 🔴 기본 탭 `activity` = 별/호리/놀이터인데 MVP에서 OFF → 부모 첫 화면이 학습 아님.
- 🔴 `StorybookReportSection` "총 페이지 N쪽" = `page_read` 이벤트 수(재진입 중복 누적).
- 🔴 활동일수/streak = `created_at.slice(0,10)` UTC → KST 밤 넘어가면 어긋남.
- 🟡 어휘/파닉스 탭 빈 채 노출, 용어 불친절(마스터리/그림체 분포), 어휘 15% 갇힘.

데이터: `page_read` metadata = `{ page, totalPages, lastPage, storybookId }`, `created_at`(UTC ISO). → 완독·읽은시간·KST 집계 가능. (확인됨: `ViewerContainer.tsx` logEvent, `types/learning-events.ts`.)

## 3. 설계

### 3.1 탭 가시성 (`ParentReportsPage`)
- **기본 탭 = `storybook`** (모두).
- **파닉스/어휘/활동 탭 = dev-only**: `isDevEmail(account?.email)`(`config/dev.ts`, 사이드바와 동일 헬퍼) 일 때만 탭바에 노출 + 렌더. 로그인 부모(비-dev) = 동화책 탭만. (참고: 페이지는 `!isConfigured`/`!activeProfile` 시 이미 early-return이라 **게스트는 탭바에 도달 안 함** — dev 필터는 로그인 비-dev 부모에만 의미. 별도 게스트 처리 불필요.)
- `useAuth()`에 `account` 추가 구조분해 필요(현재 `{activeProfile,isConfigured}`만).
- 컴포넌트/라우트 보존(삭제 X) — dev는 기존대로 다 봄.
- 헤더 `최근 이벤트 N건` → 부모 문구(예: `이번 주 {n}권 · 약 {m}분`).

### 3.2 동화책 리포트 내용 (`StorybookReportSection` 재편)
- **요약 3 (KST 기준)**: `이번 주 읽은 책 N권` · `읽은 시간 약 N분` · `연속 N일`.
- **완독한 책**: `page_read`에서 `metadata.lastPage === true` 인 책 → 표지 + 완독 횟수 + 최근 완독일. ("총 페이지" 제거.)
- **만난 단어**: **기존 `word_exposed` 이벤트에서 파생**(`aggregate.ts`의 `groupByWord` 재사용). ⚠️ `useStorybooks()`는 `StorybookSummary`(key_objects 없음)라 요약에서 못 뽑음 → 책별 full fetch 대신 이미 수집 중인 `word_exposed` 사용(서버 변경 0, "새 이벤트 없음" 비목표 준수). "이런 단어들을 만났어요" 칩, **노출 기준**(%·마스터리·시험 표현 없음), 언어(ko/en) 탭 유지.
- **그림체 취향**: 기존 `ArtStyleDistributionCard`를 **접기(collapsed)** 기본 + "이런 그림체를 좋아해요" 재미 라벨. (학습 성과 아님 명확화.)
- `(알 수 없는 책)` placeholder 카드는 노출하지 않음(lookup 실패 시 skip).

### 3.3 집계 로직 (`features/learning/lib/aggregate.ts` 확장, 순수 함수 + 테스트)
- `kstDateKey(iso): string` — **고정 +9h 오프셋**(한국 DST 없음 → 안전) 후 `YYYY-MM-DD`. (activeDays/streak.)
- `computeStreak(events, now)` — KST 날짜 distinct 연속일. **기준 = 오늘(KST)**: 마지막 읽음이 어제 KST면 streak 유지, 그제 이하면 0.
- `completedBooks(events)` — `lastPage===true` **AND `totalPages>0`**(빈 책 오탐 방지) 그룹핑 → `{ storybookId, count, lastAt }[]`.
- `booksThisWeek(events, now)` — **최근 7일**(KST) 이벤트 pre-filter 후 기존 `countDistinctBooks` **재사용**.
- `estimateReadingMinutes(events, now?)` — `page_read` 시간순, 인접 gap ≤ `SESSION_GAP=5분`이면 같은 세션. 세션 내 gap 합산하되 **페이지당 상한 `120초` 캡** + **세션 최소 바닥 `30초`**(단일 페이지도 0분 아님). 주간/전체 버전.
- 기존 마스터리/decay(`mastery.ts`)는 **어휘 탭(dev-only)** 으로 밀려 우선순위 낮음 — 이번 스코프에서 손대지 않음.

### 3.4 컴포넌트 경계
- 신규: `StorybookSummaryCards`(요약 3), `CompletedBooksList`. `StorybookReportSection`은 이들을 조합.
- 수정: `ParentReportsPage`(기본 탭·dev 필터·헤더), `aggregate.ts`.
- dev-only: 파닉스/어휘/활동 탭 렌더를 `isDevEmail` 가드로 감쌈.

## 4. 테스트
- `aggregate.test.ts` 확장: `kstDateKey`(UTC 자정 전후 KST 날짜), `computeStreak`(밤 KST 경계에서 하루로), `completedBooks`(같은 책 여러 세션 완독=count↑, 중간 페이지만=완독 아님), `estimateReadingMinutes`(세션 분리 + 페이지 상한 캡), `booksThisWeek`(주 경계).
- `ParentReportsPage`: dev 아닌 계정 → 파닉스/어휘/활동 탭 없음, 동화책 기본. dev 계정 → 4탭.
- 완독 집계가 "총 페이지" 중복 문제 없는지(같은 책 3회 열람 → 완독 3, 페이지 합산 아님).

## 5. 확정값 (스펙 리뷰 반영)
- 만난단어 = `word_exposed` 파생 · 읽은시간 SESSION_GAP=5분/페이지캡=120초/세션바닥=30초 · "이번 주"=최근 7일(KST) · KST=고정+9h · completedBooks `totalPages>0` 가드 · booksThisWeek=`countDistinctBooks` 재사용.

## 6. 미확정 (구현 중, 사소)
- 요약 카드 3개 vs 4개(완독 총권수 추가?) · 만난 단어 표시 상한 개수 · 그림체 접기 UI 형태.
