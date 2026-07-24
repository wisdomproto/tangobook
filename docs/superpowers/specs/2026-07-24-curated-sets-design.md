# 묶어 보기 — 미리 만들어둔 재생 세트 (Curated Sets)

날짜: 2026-07-24
상태: 설계 승인됨 (구현 계획 대기)

## 문제

라이브러리의 「나의 재생 목록」 섹션은 **사용자가 직접 만든 세트만** 보여준다. 결과:

- 게스트는 섹션 자체가 안 보인다 (`if (!account) return null`)
- 로그인해도 세트가 0개면 "이어재생 만들기" CTA만 뜬다 — **백지에서 시작해야 함**
- 기본 접힘이라 존재 자체를 모를 수 있다

즉 "여러 권 이어 듣기"라는 기능이 있는데, 그걸 쓰려면 부모가 책을 골라 세트를 만드는 수고를 먼저 해야 한다.

## 해결

**미리 만들어둔 묶음(curated set)** 을 같은 섹션에 넣고, 섹션 이름을 **「묶어 보기」** 로 바꾼다.
탭 한 번으로 여러 권이 이어 재생된다.

## 범위

### 하는 것

1. 큐레이션 세트 정의 (코드 상수)
2. `PlaylistLibrarySection` 에서 큐레이션 세트 렌더 + 게스트 노출
3. 섹션 명칭 변경 (「나의 재생 목록」 → 「묶어 보기」)
4. 잠긴 책 필터링 + 배지

### 안 하는 것 (YAGNI)

- 관리자 편집 UI — 세트는 커리큘럼 기반이라 자주 안 바뀐다. 필요해지면 R2 설정으로 이전
- 세트 개인화·추천 알고리즘
- 큐레이션 세트 즐겨찾기/복제

## 설계

### 1. 데이터 — `features/continuous/lib/curated-sets.ts`

```ts
export interface CuratedSet {
  id: string; // 'safety' — 안정적 식별자
  nameKey: string; // i18n 키. 🔴 raw 한국어 금지(앱은 ko·en·vi·zh·th)
  emoji: string;
  bookIds: string[]; // 순서 = 재생 순서
}

export const CURATED_SETS: CuratedSet[] = [
  /* … */
];
```

세트 구성은 `docs/saenghwal-donghwa/curriculum-45.md` 의 7트랙과 라이브러리 카테고리에서 뽑는다.
같은 책이 여러 세트에 들어가도 된다(검색·발견 경로가 늘어남).

초안 6종:

| id         | 이름            | 구성                       |
| ---------- | --------------- | -------------------------- |
| `hygiene`  | 건강·위생 습관  | 생활동화 01–08             |
| `safety`   | 안전 동화       | 생활동화 15–22             |
| `feelings` | 마음 다스리기   | 생활동화 23–30             |
| `mealtime` | 밥 잘 먹는 아이 | 생활동화 01·05·06·13·14    |
| `bedtime`  | 잠자리 명작     | 신데렐라·인어공주·백설공주 |
| `dino`     | 공룡 친구들     | 공룡 카테고리              |

### 2. 순수 로직 — `resolveCuratedSet`

렌더·재생이 공유하는 단일 판정 함수. **여기가 테스트 대상.**

```ts
resolveCuratedSet(set, booksById, canRead)
  → { playableIds: string[]; lockedCount: number; missingCount: number }
```

- `missing` = `bookIds` 에 있으나 라이브러리에 없는 책 → **조용히 탈락**
  (하드코딩 id 가 썩어도 화면이 깨지지 않게)
- `locked` = 존재하지만 `canRead` 가 false → 재생에서 제외, 카드에 개수 표시
- `playableIds` 순서는 `set.bookIds` 순서를 유지

판정은 기존 `shared/utils/entitlement.ts` 의 `canReadBook` 을 그대로 쓴다(중복 구현 금지).

### 3. 렌더 — `PlaylistLibrarySection` 수정

| 항목        | 현재           | 변경                     |
| ----------- | -------------- | ------------------------ |
| 제목        | 나의 재생 목록 | **묶어 보기**            |
| 게스트      | 숨김           | **큐레이션 세트만 노출** |
| 내 세트 0개 | CTA 만         | 큐레이션 + CTA           |
| 기본 상태   | 접힘           | **펼침**                 |

로그인 사용자는 한 섹션 안에서 `큐레이션 세트 → 내 세트` 순.

- 카드 = 기존 `PlaylistCard` 재사용. 큐레이션은 편집·삭제가 없으므로 해당 핸들러를 **optional** 로 완화
- 재생 = 기존 `beginPlaylist(playableIds, lang, navigate)` 그대로
- `playableIds.length === 0` → 재생 대신 로그인/구독 안내

### 4. 잠긴 책 UX (선택된 정책)

묶음은 **전부 보여주고**, 잠긴 책이 있으면 카드에 `🔒 N권` 배지. 재생하면 열람 가능한 책만 이어진다.

> 참고(2026-07-24 실측): 현재 게스트 접근 가능 공개책은 76권이며 **생활동화 45권·유치원동화 20권이 전부 열려 있다**
> (`isAccessibleForFree` 미설정 → `!== false` 통과). 정책 문서상 "무료 11권"과 불일치하나
> **이 작업의 범위 밖**이다. 생활동화 기반 세트는 현재 게스트도 전곡 재생된다.

## 테스트

**순수 로직** (`resolveCuratedSet`)

- 전부 열람 가능 → `playableIds` = 전체, `lockedCount` 0
- 일부 잠김 → 잠긴 것 제외, `lockedCount` 정확
- 전부 잠김 → `playableIds` 빈 배열
- 라이브러리에 없는 id → `missingCount` 로 집계되고 조용히 탈락
- 재생 순서가 `set.bookIds` 순서를 따름

**컴포넌트** (기존 `PlaylistLibrarySection.test.tsx` 확장)

- 게스트: 큐레이션 세트가 보이고, 내 세트 영역·CTA 는 없다
- 로그인 + 세트 0개: 큐레이션 + CTA 둘 다
- 기본 펼침

## 리스크

| 리스크                               | 완화                                                        |
| ------------------------------------ | ----------------------------------------------------------- |
| 하드코딩 id 가 책 삭제/비공개로 썩음 | `missing` 조용히 탈락 + 세트가 비면 카드 자체를 숨김        |
| 라이브러리 첫 화면이 아래로 밀림     | 기본 펼침이지만 세트 행은 가로 스크롤 1줄                   |
| 세트 이름 다국어 누락                | `nameKey` 강제, ko 외 언어는 기존 i18n 검증 스크립트로 확인 |
