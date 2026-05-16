# Library Master — 카테고리/책 메타 편집 + 재분류

**작성일**: 2026-05-16
**상태**: 설계 승인 대기
**대상 페이지**: `/library-master`

## 배경

현재 `/library-master` 는 카테고리/책의 **노출 순서** + 책의 **메인 표지** 만 편집 가능. 카테고리 자체 CRUD, 책의 카테고리 재배정, isPublic 토글이 없어서 새 책이 들어오거나 분류 체계를 바꿔야 할 때 R2 마이그 스크립트를 매번 작성해야 함.

R2 storybook 234권 분석 결과:
- 자연관찰(53) + 기타(107) = 160권이 single 큰 통에 섞여 있음 (공룡·곤충·동물·식물·우주·우리몸·전래 모두 동거)
- 이용자가 "공룡 책 찾아줘" 같은 요구를 효율적으로 처리 못 함

## 목표

1. `/library-master` 에서 카테고리 **추가/이름변경/삭제** 가능 (좌측 패널 인플레이스 편집)
2. 책별 **카테고리 변경** + **isPublic 토글** (우측 카드 인플레이스)
3. 책 카드를 좌측 카테고리 row 로 **드래그** 해서 카테고리 변경
4. 현재 234권을 **10개 카테고리**로 재분류 (1회성 마이그)

학습자 `/library` 화면은 UI 변경 없음 (데이터/카테고리만 바뀜).

## 데이터 모델

### `LibraryConfig` 확장 (`packages/shared/src/types/storybook.ts`)

```ts
export interface LibraryConfig {
  categoryOrder?: string[];                // 표시 순서 (기존)
  bookPriority?: Record<string, string[]>; // 카테고리별 책 순서 (기존)

  /**
   * 존재 카테고리 set (빈 카테고리도 포함).
   * 있으면 source of truth — 좌측 마스터 패널은 이걸 base 로 표시.
   * 없으면 책의 category 필드에서 derive (하위 호환).
   * 학습자 /library 는 책 0권인 카테고리 자동 hide (기존 로직).
   */
  categoryList?: string[];

  updatedAt?: string;
}
```

**결정 로직 (LibraryMasterPage):**
```ts
function mergeAllCategories(config: LibraryConfig | undefined, books: StorybookSummary[]): string[] {
  const fromBooks = deriveCategoriesFromBooks(books);
  const fromConfig = config?.categoryList ?? [];
  // union, config 순서 우선
  const set = new Set([...(config?.categoryOrder ?? []), ...fromConfig, ...fromBooks]);
  return mergeCategoryOrder(config?.categoryOrder, [...set]);
}
```

**책의 `category` 필드는 여전히 DB single source of truth.** `LibraryConfig.categoryList` 는 "있어야 할 슬롯" 의 superset (빈 카테고리 표현용).

## 좌측 카테고리 패널

### 레이아웃

```
┌────────────────────────────┐
│ 카테고리 (10)        ✓저장됨 │
├────────────────────────────┤
│ ≡ 🌟 세계 명작      67 ✏ 🗑 │  ← hover 시 ✏/🗑 표시
│ ≡ 📜 전래 동화      10 ✏ 🗑 │
│ ≡ 🦕 공룡 친구들    22 ✏ 🗑 │
│ ≡ 🐛 곤충 친구들    17 ✏ 🗑 │  ← active = coral 배경
│ ≡ 🐯 육지 동물친구들 50 ✏ 🗑│
│ ≡ 🐬 바다 동물친구들 15 ✏ 🗑│
│ ≡ 🦅 하늘 동물친구들 12 ✏ 🗑│
│ ≡ 🌸 식물 친구들    18 ✏ 🗑 │
│ ≡ 🌌 우주와 자연     7 ✏ 🗑 │
│ ≡ 🫀 우리 몸 이야기   4 ✏ 🗑 │
├────────────────────────────┤
│ [+ 새 카테고리 이름]  ＋   │
└────────────────────────────┘
```

### 동작

- **순서 변경 (≡ 드래그)**: 기존 그대로 — `categoryOrder` 갱신
- **추가**: 하단 input + 엔터/＋ 클릭 → `categoryList` append + `categoryOrder` 끝에 push. 빈 문자열·중복 차단 (alert).
- **이름 변경 (✏ → 인라인 input)**:
  1. `LibraryConfig` 의 `categoryList` / `categoryOrder` 키 갱신 + `bookPriority` 키 rename (old → new)
  2. 그 카테고리 모든 책 `usePatchStorybook` 으로 `category: newName` 일괄 patch
  3. 진행 모달 "n / m 권 갱신 중…" + 완료 시 ✓ 표시
- **삭제 (🗑)**:
  - 책 0권 → `confirm("'X' 삭제할까요?")` → `categoryList` / `categoryOrder` / `bookPriority` 에서 제거
  - 책 있음 → 🗑 disabled (회색) + tooltip `"비어있어야 삭제 가능 (책을 다른 카테고리로 옮기세요)"` + 옆에 `→ 이동` 링크
  - `→ 이동` 클릭 → 모달: `"이 카테고리의 N권을 어디로 옮길까요?"` + target 드롭다운 + [옮기고 카테고리 삭제] 버튼

### 이모지 매핑 (`CATEGORY_EMOJI` 확장)

```ts
const CATEGORY_EMOJI: Record<string, string> = {
  '세계 명작': '🌟',
  '전래 동화': '📜',
  '공룡 친구들': '🦕',
  '곤충 친구들': '🐛',
  '육지 동물 친구들': '🐯',
  '바다 동물 친구들': '🐬',
  '하늘 동물 친구들': '🦅',
  '식물 친구들': '🌸',
  '우주와 자연': '🌌',
  '우리 몸 이야기': '🫀',
  // (legacy fallback)
  '자연 관찰': '🌿',
  '생활 동화': '👨‍👩‍👧',
  '기타': '📚',
};
```

## 우측 책 카드

### 레이아웃

```
┌──────────────────┐
│ ① 🦕 공룡친구들▼  │  ← 좌상단: 순서 + 카테고리 chip(드롭다운)
│              🎨 👁│  ← 우상단: 표지변경 + 공개 토글
│ ╔══════════════╗ │
│ ║   [표지]     ║ │
│ ╚══════════════╝ │
│ 티라노사우루스 렉스 │
│  그림체 3종      │
└──────────────────┘
```

### 카테고리 chip 드롭다운

- 좌상단 작은 chip (현재 카테고리 이모지 + 이름 + ▼)
- 클릭 → popover (전체 카테고리 list, 현재 ✓ 표시)
- 선택 → `patchStorybook({ category: newCat })` + `bookPriority[oldCat]` 에서 id 제거 + `bookPriority[newCat]` 끝에 push
- 선택 후 카드는 active 카테고리에서 사라짐 (다른 카테고리로 이동) — active 카테고리는 유지

### isPublic 토글 (👁/🚫)

- 우상단 🎨 옆에 작은 동그란 버튼
- 👁 (coral 배경) = `isPublic: true` / 🚫 (gray 배경) = `isPublic: false`
- 클릭 → `patchStorybook({ isPublic: !current })`
- 비공개 카드 = `opacity-50 grayscale` (시각 구분)
- 학습자 `/library` 의 isPublic 필터는 기존 그대로 (변경 X)

### 드래그-to-카테고리 (cross-context DnD)

- 현재 2개의 `DndContext` (카테고리 / 책) 를 하나로 합침
- `onDragEnd(active, over)` 분기:
  ```ts
  if (active.id === over.id) return;
  if (categoryOrder.includes(active.id) && categoryOrder.includes(over.id)) {
    // 카테고리 reorder
  } else if (categoryOrder.includes(over.id) && activeBookIds.includes(active.id)) {
    // 책 → 카테고리 row 로 드롭 → 카테고리 변경
    patchStorybook({ id: active.id, category: over.id });
  } else if (activeBookIds.includes(active.id) && activeBookIds.includes(over.id)) {
    // 책 grid 안 순서 변경
  }
  ```
- 좌측 카테고리 row 는 droppable target 으로도 작동 (`useDroppable` 추가)
- 드래그 hover 시 카테고리 row 에 coral ring outline 으로 drop target 시각 피드백

## 카테고리 재분류 안

R2 덤프 234 storybook 기준. 자연관찰(53) + 기타(107) → 10개 카테고리로 재배정.

| 카테고리 | 예상 권수 | 분류 기준 |
|---------|----------|----------|
| 🌟 세계 명작 | 67 | (기존 유지) |
| 📜 전래 동화 | ~10 | 금도끼 은도끼, 임금님 귀, 북풍과 태양, 빨간모자 등 (기타에서 흡수) |
| 🦕 공룡 친구들 | ~22 | 공룡 + 익룡 (프테라노돈·람포린쿠스) + 해룡 (모사사우루스) |
| 🐛 곤충 친구들 | ~17 | 꿀벌, 거미, 사슴벌레, 장수풍뎅이, 호랑나비, 개미, 무당벌레, 잠자리, 달팽이 |
| 🐯 육지 동물 친구들 | ~50 | 포유류 + 양서류 + 파충류 (개구리·뱀·도마뱀·악어 포함). 토끼·곰·호랑이·사자·코끼리·기린·강아지·고양이·캥거루·판다·표범·치타·늑대·다람쥐·여우·고슴도치·두더지·카멜레온·두꺼비·하마·코뿔소·원숭이 등 |
| 🐬 바다 동물 친구들 | ~15 | 수영이 주 활동. 펭귄·물개·고래·상어·문어·게·해마·흰동가리·바다거북 등 |
| 🦅 하늘 동물 친구들 | ~12 | 새 (못 나는 새 타조·오리 포함). 올빼미·앵무새·딱따구리·백로·독수리·참새 등 |
| 🌸 식물 친구들 | ~18 | 해바라기·민들레·사과나무·장미·튤립·선인장·버섯·은행나무·소나무·수박·연꽃·파리지옥·강아지풀·딸기·밤나무·포도나무·나팔꽃·참나무 |
| 🌌 우주와 자연 | ~7 | 태양계·달과 별자리·은하와 블랙홀·화산과 지진·사막과 극지방·동굴과 갯벌 |
| 🫀 우리 몸 이야기 | ~4 | 음식의 몸속 여행·뼈와 근육·뇌와 심장·유산균과 바이러스 |
| 📚 기타 | 0 | 빈 카테고리로 두되 삭제 (분류 못 한 게 없으므로) |

`*-복사본(1)` 들은 매핑 dict 에 baseId 와 동일하게 처리 (삭제는 별건).

## 마이그 스크립트

### Script 1: `dump-books-by-category.mjs` (이미 작성)

R2 storybook 234권의 `(id, title, category, type, isPublic, keyObjectSample, ...)` 를 `_data/books-by-category.json` 으로 출력. 재분류 검토용. 재실행 가능.

### Script 2: `migrate-recategorize.mjs` (새로 작성)

```js
// BOOK_ID → newCategory 매핑 (사람이 검토 가능한 형태)
const RECATEGORIZE = {
  'storybook-id-xxx': '공룡 친구들',
  // ... 234 entries
};

// 옵션:
//   --dry  (기본): 변경 list 만 출력
//   --apply: 실제 적용

// 동작:
//   1. 각 책 R2 fetch → category 갱신 → 직접 PutObject (saveStorybook 우회 — title 중복 체크 skip)
//   2. _index/library-config.json fetch → categoryList + categoryOrder 갱신 (10개) → PutObject
//   3. 진행률 출력 (n/m)
//   4. 끝나면 카테고리별 권수 표 출력
```

### 적용 워크플로우

1. `node scripts/dump-books-by-category.mjs` — 덤프 갱신
2. `node scripts/migrate-recategorize.mjs --dry` — 변경 list 확인
3. 사용자 검토 (table 출력) → 매핑 dict 보정 (필요 시)
4. `node scripts/migrate-recategorize.mjs --apply` — 실제 적용
5. 라이브러리 학습자 화면 (`/library`) 새 카테고리로 정상 노출 확인

## 영향 범위

### 변경 파일

- `packages/shared/src/types/storybook.ts` — `LibraryConfig.categoryList` 추가
- `packages/server/src/services/library-config.service.ts` — sanitize 에 `categoryList` 포함
- `packages/client/src/pages/LibraryMasterPage.tsx` — 메인 변경 (UI 확장)
  - 좌측 패널: 추가/이름변경/삭제 + 이동 모달
  - 우측 카드: 카테고리 chip + isPublic 토글 + cross-context DnD
  - 두 `DndContext` 통합
- `packages/server/scripts/dump-books-by-category.mjs` — 신규
- `packages/server/scripts/migrate-recategorize.mjs` — 신규
- `packages/server/scripts/_data/books-by-category.json` — 덤프 결과 (git 포함)
- 루트 `CLAUDE.md` — "라이브러리 마스터" 섹션 갱신 (새 카테고리 10개 + 편집 기능 명시)

### 변경 없는 파일

- `packages/client/src/pages/LibraryPage.tsx` (학습자 화면) — 새 카테고리는 자동 인식
- `features/storybook/components/Sidebar.tsx` 등 다른 카테고리 사용처 — 책의 `category` 필드만 보므로 자동 인식
- `features/storybook/components/CategoryManagerModal.tsx` (/editor2 카테고리 관리) — 별개 (Zustand 기반, 라이브러리와 분리). 단 마이그 후 사용자가 카테고리 reset 한 번 해주면 새 default list 가 반영됨.

## 위험 & 완화

| 위험 | 완화 |
|------|------|
| 책 일괄 patch 중 일부 실패 | `--dry` 단계에서 매핑 검증, `--apply` 에 실패 retry + 실패 list 출력 |
| 마이그 중 이름 변경 (`title 중복 체크`) 트리거 | 마이그 스크립트는 `saveStorybook` 우회하고 직접 `PutObject` (title 안 바뀌므로 안전) |
| 이름 변경 중 책 patch 시간 지연 | progress 모달로 UX 보완. 큰 카테고리 (육지 동물 50권) 도 직렬 patch ~10초 이내 예상 |
| 학습자 화면에서 새 카테고리 못 보임 | 학습자는 책의 `category` 필드만 보므로 마이그 완료 즉시 반영 |
| `*-복사본(1)` 도 카테고리 옮겨짐 | 의도된 동작 (정리는 별건). 카테고리 통일됨 |

## Out of Scope

- `*-복사본(1)` 책 정리/삭제 (별건)
- 어휘 단원 / 파닉스 카테고리 (이번 마이그는 storybook 만)
- 학습자 `/library` 페이지 UI 변경 (데이터만 바뀜)
- 카테고리별 이모지 사용자 편집 (이번엔 코드 hardcoded)
- 카테고리 nested (서브카테고리) 구조 — 평면 유지

## 적용 순서 요약

1. ✅ R2 덤프 (`dump-books-by-category.mjs`) — 완료
2. spec 사용자 리뷰 ← **현재 단계**
3. shared 타입 + server service — `LibraryConfig.categoryList`
4. LibraryMasterPage UI 확장 (좌측 + 우측 + DnD 통합)
5. `migrate-recategorize.mjs` 작성 (매핑 dict 234건)
6. dry-run → 매핑 검토 → `--apply`
7. 학습자 `/library` 동작 확인
8. 루트 CLAUDE.md 업데이트
9. commit + main push (자동 배포)
