# MVP 출시 단순화 — 도감 폐지 + 별 UI OFF + 어휘탭 동화 단원만

**Date:** 2026-05-06
**Status:** Decided (구현 미실행)
**선행조건:**
- `2026-05-03-phase0-asset-cleanup-design.md`
- `2026-05-03-phase1-learning-system-design.md`
- 메모리: `collection-word-redesign.md`, `collection-system.md`, `phase1-learning-redesign.md`

**Source:** 2026-05-06 brainstorming 세션 (도감 시스템 의문 → 단순화 마인드 전환)

---

## 0. 왜 본 문서가 필요한가

Phase 0/1 spec 결정 후 도감 단어 단위 재설계 (Phase A-D) 까지 구현됐으나, 베타 출시 직전 사용자가 **"점점 복잡해지고 있다, 너무 욕심을 냈다"** 판단. 단순화 마인드로 다음을 정리:

1. **도감 시스템 자체의 모호성** — 단어 단위 카탈로그 + 두 view(카테고리/동화별) + 어휘 단원 system 과의 entity 중복 → 사용자 혼란
2. **수집 게이미피케이션 검증 안 됨** — "468장 모으기" 동기 부여 효과는 가설일 뿐, MVP 가설 검증과 무관
3. **별 UI 의 일관성 결여** — 호리방 OFF 인데 별 카운터는 헤더 노출 중 (적립처가 사라진 currency)
4. **어휘 source 3가지의 베타 부담** — Cambridge / Custom / 동화 derived 가 다 노출되면 학습 entry 가 분산. MVP 가설("동화 IP 깊이가 D7 ≥ 25%") 검증과 거리

→ Phase 0 의 OFF/폐기 작업과 같은 frame 으로, **MVP 출시에 진짜 필요한 것만 남기고 나머지는 폐지/숨김** 결정.

## 1. 결정 모음

| 항목 | 결정 | 코드 처분 |
|---|---|---|
| 도감 시스템 | **완전 폐지** | UI/서버/DB/타입/스크립트 다 삭제 |
| 별 카운터 UI (아이 화면) | **OFF (제거)** | AppShell 헤더 + VocabularyHubPage 헤더에서 컴포넌트 제거 |
| 별 백엔드 (star_ledger / RPC / trigger) | **유지** | 부모 리포트가 활용 |
| 어휘 탭 source 노출 | **동화 단원만** | Cambridge / Custom 은 hide (코드 보존, 필터링) |
| 어휘 단원 백엔드 | **유지** | Cambridge seed / Custom CRUD 코드 그대로 |
| Editor (`/editor`, `/editor2`) | **사이드바 진입점 X, URL 직접 입력만** | 이미 사이드바엔 없음. 추가 작업 X |
| 호리방 / 아케이드 6 / 놀이터 7 | **현재 OFF 유지** (변경 없음) | router Navigate 가드 그대로 |
| 어휘 게임 (match 외 trace/block/write) | **현재 disabled 유지** (변경 없음) | VocabularyStudyPage GAMES `enabled: false` 그대로 |

## 2. 베타 출시 그림 (남는 것 only)

```
사이드바 (3축):       헤더:                   
┌──────┐              ┌─────────────────┐    
│ 동화책 │              │ 페이지 타이틀  👤 ⏻ │    
│ 파닉스 │              └─────────────────┘    
│ 어휘  │              본문:                   
└──────┘              ┌─────────────────┐    
                      │ LibraryPage     │    
                      │ ↓ 책 클릭       │    
                      │ Viewer          │    
                      │ ↓ 책 끝         │    
                      │ 핵심 단어 보기  │    
                      │ ↓ "더 익혀볼래" │    
                      │ VocabularyHub   │    
                      │ (동화 단원 211)  │    
                      │ ↓ 단원 클릭     │    
                      │ VocabularyStudy │    
                      │ (match 게임)    │    
                      └─────────────────┘    
                                             
부모 모드 (PIN):      ParentReports — word_mastery + 별 진척
```

**아이가 보는 entity = 단어 1개**. 진척률 = `word_mastery` 단일 source. 수집 메타포 (자물쇠 / 실루엣 / 보유 / 활성) 제거. 별 currency 는 학습 지표로 부모 리포트에서만.

## 3. 폐지 — Collection 시스템

### 3-1. 클라이언트

| 항목 | 처분 |
|---|---|
| `packages/client/src/features/collection/` 전체 | **삭제** (10 파일: api 1 + components 6 + hooks 2 + index 1) |
| `router/index.tsx` 라우트 | **삭제** — `/collection`, `/collection/:categoryId`, `/collection/book/:bookId` 3개 |
| `router/index.tsx` import line 24 | **삭제** — `import { CollectionPage, CategoryPage, BookCardsPage } from '../features/collection'` |
| `AppShell.tsx` 4축 → 3축 | **`내 카드` axis 제거** (`PRIMARY_AXES` line 41-47) |
| `AppShell.tsx` `getPageTitle` | **`/collection*` 분기 제거** (line 64-65) |
| `features/learning/components/CollectionProgressCard.tsx` | **파일 삭제** — Collection types/hooks 의존 |
| `features/learning/index.ts:11` | **export 제거** (`CollectionProgressCard`) |
| `features/auth/pages/ParentReportsPage.tsx` | **import + 활동 탭 렌더 제거** (line 11 import, line ~101 render) |
| `features/games/components/GameResultScreen.tsx` | **collection block 제거** — line 10-14 imports + line 95/108/111 `activateForProfile` 호출 제거 |
| `features/viewer/components/ViewerContainer.tsx` | **collectionItemIds 적립 제거** — line 17 `useStorybookCardIndex` import + line 164/179/191/221 metadata 채움 |
| `features/viewer/components/WordRevealScreen.tsx` | **`/collection/book/...` navigate 제거** (line 145, 331). 단어 클릭 시 어휘 단원 (`/vocabulary/book-{bid}`) 으로 redirect 또는 단순 모달 (결정 §3-1a) |
| `features/key-object/components/KeyObjectTab.tsx` | **dexCategory `<select>` UI 블록 제거** (line 626-650) + `COLLECTION_CATEGORIES` import 제거 (line 18, 23). v1 editor 의 어드민 입력란 제거 (Collection 폐지로 의미 잃음) |
| `features/vocabulary-unit/components/VocabularyHubPage.tsx` | **§5 참조** — Cambridge/Custom 필터 + render + totalCount 모두 수정 |
| `features/vocabulary-unit/components/VocabularyStudyPage.tsx` | **collection 흔적 모두 제거** — (a) line 90 카피 "단어 N개 · 게임 통과하면 도감 카드 자동 등장!" → "단어 N개 · 모든 게임 통과해보자!" 식으로 교체, (b) line 117-123 "📚 내 카드 보기" 버튼 블록 삭제 (`onClick navigate('/collection')`), (c) `buildCardId` 헬퍼 + `metadata.cardId` 가 잔존하면 제거 (현재 파일 수정 중이라 line 위치 변동 가능, 검색으로 확인) |
| `features/learning/CLAUDE.md` | **4탭 표 갱신** — 활동 탭에서 CollectionProgressCard 제거 |
| `features/rewards/CLAUDE.md` | **도감 connector 섹션 제거** (있다면) |

### 3-1a. WordRevealScreen `/collection/book/...` 처분 결정

WordRevealScreen 의 두 navigate 콜:
- 카드 그리드 클릭 → 도감 책별 카드 페이지로 이동
- "도감으로 가기" 버튼 → 동일

**결정:** 단어 클릭 → **어휘 학습 (`/vocabulary/book-{bookId}`)** 로 redirect. WordRevealScreen 의 회유 동선은 어휘 단원으로 흡수 (Phase 1 spec 의 "더 익혀볼래" 동선과 일관).
"도감으로 가기" 버튼은 **삭제**.

### 3-2. 서버

| 항목 | 처분 |
|---|---|
| `services/collection.service.ts` | **삭제** |
| `controllers/collection.controller.ts` | **삭제** |
| `routes/collection.routes.ts` | **삭제** |
| `app.ts` / `index.ts` 의 routes 등록 | **참조 제거** |
| `services/storybook.service.ts` 의 sync hook | **제거** — `save()` 후 `CollectionService.syncFromStorybook` + `delete()` 후 `removeSourcesByStorybookId` 호출 모두 제거. import 도 제거 |

### 3-3. 스크립트

| 항목 | 처분 |
|---|---|
| `packages/server/scripts/extract-key-objects-for-dex.mjs` | **삭제** |
| `packages/server/scripts/build-key-object-dex-mapping.mjs` | **삭제** |
| `packages/server/scripts/apply-key-object-dex.mjs` | **삭제** |
| `packages/server/scripts/rebuild-word-catalog.mjs` | **삭제** |
| `scripts/seed-collection-stub.mjs` | **삭제** |
| `docs/key-object-dex-mapping.json` | **삭제** |
| `docs/collection-catalog-preview.json` | **삭제** |

### 3-4. DB (Supabase)

**FK 검증:** `collection_user` 테이블에 외래키로 의존하는 다른 테이블 없음 (확인 완료). 안전한 drop.

**기존 setup file 양쪽 수정 (canonical + 신규 migration 둘 다):**

| 항목 | 처분 |
|---|---|
| `scripts/supabase-rewards-setup.sql` | **in-place 수정** — collection_user 테이블 (line 113-133), RLS enable (line 175), policy (line 204-206), trigger 분기 (line 405-471), `activate_collection_item` RPC (line 576-605) 전부 제거. `card_unlock` enum/check 제약은 유지 (legacy 데이터 보존) 또는 제거 (둘 중 결정 §3-4a) |
| `scripts/migrations/2026-05-06-word-game-completed.sql` | **삭제 또는 collection 분기 제거** — 이 migration 자체가 collection_user 인서트 (line 136-193) 포함. 본 spec 의 drop migration 보다 먼저 적용됐다면 drop 으로 무효화됨. 미적용이라면 collection 분기만 제거하고 word_game_completed 처리만 남김 |
| 신규 migration 작성 | **`scripts/migrations/2026-05-06-drop-collection-system.sql`** — `DROP TABLE IF EXISTS collection_user CASCADE; DROP FUNCTION IF EXISTS activate_collection_item CASCADE;` + `handle_learning_event` trigger 함수 재정의 (collection 분기 제거된 버전). 적용 순서는 word-game-completed migration **이후** |

#### 3-4a. `card_unlock` star_ledger reason 처분

3가지 옵션:
- **(A) 유지** — legacy 데이터 보존. 새 적립 안 됨. ParentReports 별 합계는 자연 감소.
- **(B) 신규 enum 에서 제거** — check 제약 ALTER. 기존 데이터에 reason='card_unlock' 행 있으면 마이그 필요 (현재 collection_user truncate 시점에 같이 정리됐다면 X)
- **(C) 다른 reason 으로 재할당** — 예: 'word_master'. 기존 행 update.

**결정:** (A) 유지. 단순함 우선. 기존 데이터 안 건드림. 새 적립이 0이라 자연 dead.

### 3-5. 타입 (shared)

| 항목 | 처분 |
|---|---|
| `packages/shared/src/types/collection.ts` 파일 | **삭제** — `CollectionItem`, `COLLECTION_CATEGORIES`, `CollectionCategoryId`, `CollectionStatus`, `CollectionUserRecord`, `CollectionCatalog` 모두 |
| `packages/shared/src/types/storybook.ts:1` | **import 제거** — `import type { CollectionCategoryId } from './collection.js';` (collection.ts 삭제 시 break) |
| `KeyObject.dexCategory?: CollectionCategoryId` 필드 | **타입 제거** — 358권 데이터의 dexCategory 값은 무해하게 R2 에 잔존 (read 안 하면 자연 dead, 마이그 X) |
| `LearningEventMetadata.collectionItemIds?: string[]` | **제거** — 트리거가 `metadata->'collectionItemIds'` read 하던 자리는 collection 분기 제거 후 자연 dead |
| `shared/index.ts` exports | **collection 관련 라인 제거** |
| `LearningEventType` union (`learning-events.ts:3-12`) | **`word_game_completed` 누락 검증** — 트리거가 처리하는 이벤트인데 union 에 없음. 본 spec 비범위 (orthogonal) 지만 구현 시 별도 fix 권장 |

### 3-6. R2

| 항목 | 처분 |
|---|---|
| `collection-catalog.json` | **삭제** (선택, 코드 제거 후 자연 dead) |
| `public/icons/section/collection.png` | **유지** (사용처 사라지지만 다른 ui 자산과 함께 보존, 무해) |

## 4. 별 카운터 UI OFF

### 4-1. 제거 위치

| 파일 | 처분 |
|---|---|
| `AppShell.tsx:145` | `{activeProfile && <StarCounter />}` 제거 |
| `AppShell.tsx:4` | `import { StarCounter } from '@/features/rewards';` 제거 |
| `VocabularyHubPage.tsx:148` | `<StarCounter />` 제거 |
| `VocabularyHubPage.tsx:5` | StarCounter import 제거 |
| `VocabularyStudyPage.tsx:75` | `<StarCounter />` 헤더 제거 |
| `VocabularyStudyPage.tsx:6` | StarCounter import 제거 |

**도달 불가 (변경 X):** Phase 5 Playground 7 게임 (`WordSortCartPlayer`, `WordShoppingPlayer`, `WordRunPlayer`, `WordPopPlayer`, `WordMemoryPlayer`, `WordGardenPlayer`, `WordFishingPlayer`, `PlaygroundHubPage`) + `HoriRoomPage` 의 `<StarCounter />` 사용처 — 모두 router Navigate 가드된 라우트 아래라 실행 경로에 도달 불가. 그대로 둔다 (코드 보존 정신 일관).

### 4-2. 보존 (변경 없음)

- `features/rewards/` 폴더 전체 — `StarCounter` 컴포넌트 / `useStarBalance` / `useStarLedger` / API
- Supabase `star_ledger` 테이블 / 관련 trigger / RPC
- 학습 이벤트 → 별 자동 적립 흐름 — 책 완독 / 어휘 게임 통과 / page_read 등
- `VocabularyStudyPage` 의 별 적립 호출 (UI 만 제거, 적립 로직 유지)

이유: 별 currency 는 부모 리포트의 "이번주 학습량" 지표 source. UI 노출만 OFF.

### 4-3. 부모 리포트 강화 (Optional, 가벼움)

| 추가 | 위치 |
|---|---|
| "이번주 별 N개" 카드 | `ParentReportsPage` 활동 탭 헤더 |
| 별 적립 이벤트별 breakdown | 활동 탭 (책 완독 N / 어휘 게임 N / ...) |

기존 `ParentReportsPage` 4탭 (활동/동화책/파닉스/어휘) 구조 유지. 어휘 탭은 word_mastery 기반 "익힌 단어" 시각화 이미 있음.

**별 합계 변화 flag:** 도감 폐지로 `card_unlock` reason 적립이 0 이 됨. 베타 데이터에서 별 적립량이 이전보다 줄어든 것으로 보임. 부모 리포트 가설 검증 시 이 baseline 변화를 고려.

## 5. 어휘 탭 — 동화 단원만 노출

### 5-1. 변경

`VocabularyHubPage.tsx:93-128` `grouped` useMemo + totalCount:

```diff
const grouped = useMemo(() => {
  const publicUnits = (units ?? []).filter((u) => u.isPublic);
- const cambridge = publicUnits.filter((u) => u.source === 'cambridge-starters');
- const custom = publicUnits.filter((u) => u.source === 'custom');
  const storybook = publicUnits.filter((u) => u.source === 'storybook');
  // 동화 단원만 카테고리 그룹화 (기존 로직 그대로)
  ...
- return { cambridge, custom, storybookGroups };
+ return { storybookGroups };
}, [units]);

- const totalCount =
-   grouped.cambridge.length +
-   grouped.custom.length +
-   grouped.storybookGroups.reduce((s, g) => s + g.units.length, 0);
+ const totalCount = grouped.storybookGroups.reduce((s, g) => s + g.units.length, 0);
```

렌더 부분 (line 165-187):

```diff
- <Section title="Cambridge 토픽" ... units={grouped.cambridge} ... />
  {grouped.storybookGroups.map((g) => <Section ... />)}
- <Section title="내 단원" ... units={grouped.custom} ... />
```

### 5-2. 보존 (변경 없음)

- `features/vocabulary-unit/` 폴더 전체 (Cambridge seed / Custom CRUD / Editor / API / hooks)
- `VocabularyUnitSource` 타입 (`'cambridge-starters' | 'custom' | 'storybook'`)
- Supabase 의 어휘 단원 관련 데이터
- `/editor2/vocab/:unitId` 라우트 (Editor 진입점은 admin URL 만이므로 그대로 두면 됨)
- `VocabularyUnitSidebarList` (어드민 사이드바) — Cambridge / Custom 모두 노출 유지 (관리 도구이므로)

이유: Cambridge / Custom 은 post-launch 활성화 예정. 코드 살려두고 학습자 hub 만 필터링.

### 5-3. 동화 ↔ 어휘 자동 동기화 보장 (사용자 요구사항 명시)

동화 derived 단원 (`book-{storybookId}`) 은 책에서 자동 derive 되며 **동기화 코드 0줄**. 다음 시나리오 모두 자동 반영:

| 시나리오 | 자동 반영 메커니즘 |
|---|---|
| 책 신규 추가 | BookIndex 재빌드 → `useVocabularyUnits()` 다음 read 에 새 단원 등장 |
| 책 삭제 | BookIndex 에서 사라짐 → 해당 단원도 list 에서 사라짐 |
| KeyObject 추가 | `deriveStorybookUnit()` 다음 호출 시 단어 포함 |
| KeyObject 삭제 | derive 시 단어 빠짐 |
| KeyObject 수정 (한국어/영어/예문/이미지) | derive 시 새 값으로 반영 |
| 그림체 추가 | `styleAssets[newStyle].keyObjects[word]` derive → 단어 이미지 N장 자동 증가 |
| 그림체 삭제 | derive 시 해당 그림체 이미지 빠짐 |

핵심: `useVocabularyUnits` hook + `deriveStorybookUnit` 함수가 BookIndex 의 single source of truth 를 그대로 read. **명시적 sync 호출이나 trigger 없음.** Phase 1 spec 의 "동기화 코드 0줄" 결정 그대로 유지.

**검증 책임:** 구현 시 1) 신규 책 추가 → 1초 내 어휘 탭 등장, 2) KeyObject 한국어 변경 → 새로고침 시 어휘 학습 화면 반영, 두 가지 manual smoke test.

### 5-4. Cambridge / Custom 활성화 시 변경 (post-launch 메모)

§5-1 diff 1개 되돌리면 끝. spec 추가 필요 X.

## 6. Editor 처분

| 항목 | 결정 |
|---|---|
| `/editor`, `/editor2` 라우트 | **유지** (URL 직접 입력 가능) |
| 사이드바 / 헤더 진입점 | **이미 없음** (변경 X) |
| LibraryPage / BookDetailPage 의 편집 버튼 | **현재 노출 여부 점검 필요** (있으면 hide) — 구현 시점에 점검 |
| 베타 사용자 안내 | **편집 기능 없음 안내** — 베타는 admin 가 미리 채운 211권 콘텐츠로 |

추후 학부모/교사용 콘텐츠 제작 진입점은 별도 결정. 본 spec 비범위.

## 7. 호리방 / 아케이드 / 놀이터 — 변경 없음

Phase 0 결정 (`2026-05-03-phase0-asset-cleanup-design.md` §6) 그대로 유지:
- `/hori-room`, `/games/hori-*`, `/playground/*` 모두 router Navigate 가드 (이미 적용됨)
- 사이드바/메뉴 진입점 없음 (이미 적용됨)
- 코드/DB 보존
- 베타 D7 측정 후 결정

## 8. 비범위 (명시적 제외)

- 어휘 게임 4종 (match/trace/block/write) 중 trace/block/write enable — 현재 `enabled: false` 그대로 유지. 변경 X
- 파닉스 트랙 게임 메커니즘 결정 — Phase 0 ⚪ 보류 그대로
- Speaking 게임 (한·영) Azure 도입 — 그대로 hidden
- Cambridge / Custom 어휘 단원 활성화 — post-launch
- Editor 학부모/교사 노출 — post-launch
- 부모 리포트 cross-book 인덱스 ("이 단어 등장 책 N권") — Optional, 본 spec 에서 결정 안 함
- KeyObject 데이터의 R2 잔존 dexCategory 값 마이그 — 무해하므로 정리 안 함

## 9. 베타 출시 검증 지표 (Phase 1 spec 그대로)

- D7 리텐션 ≥ 25%
- 핵심 단어 보기 → 어휘 탭 진입률 (회유 동선 작동 여부)
- 동화 단원별 학습률 (어떤 책의 단어가 가장 많이 학습되나)
- 부모 결제 전환율 ≥ 5%

본 단순화로 측정 가설이 명료해짐: **"동화 IP 깊이"가 학습 동기**라는 단일 가설만 검증. 게이미피케이션(도감/별 카운터) 효과는 가설에서 제외 (post-launch 별도 검증).

## 10. Post-Launch Backlog (참고)

본 spec 으로 hide 된 것 중 베타 데이터 보고 활성 검토:

| 항목 | 활성화 시 작업량 |
|---|---|
| Cambridge 어휘 단원 노출 | VocabularyHubPage 필터 1줄 (위 §5.3 참조) |
| Custom 어휘 단원 노출 | 위와 동일 |
| 어휘 게임 trace/block/write enable | GAMES 배열 enabled flag 변경 |
| 도감 메타포 부활 (다른 형태) | 본 spec 폐지가 아니라 재설계 — 새 spec 필요 |
| 별 카운터 UI 부활 (호리방과 함께) | StarCounter import 복구 + 호리방 OFF 가드 해제 |
| 호리방 / 아케이드 / 놀이터 ON | Phase 0 spec §1 "❌ OFF" → "🟢 ON" 변경 |
| WordRevealScreen → 도감 동선 부활 | navigate 코드 복구 + collection 시스템 재구축 |

## 11. 다음 액션

1. ✅ 본 spec 사용자 컨펌 (2026-05-06)
2. ✅ spec-document-reviewer 3 라운드 검토 통과
3. → 메모리 등록 (`memory/mvp-simplification.md` 포인터)
4. → Implementation plan 작성 (writing-plans skill) — 사용자 결정 (2026-05-06): "이대로 개발 가자"
5. → 구현 진입 (subagent-driven-development 또는 직접)

---

**문서 끝.**

작성: 길중님 ↔ Claude (Anthropic) brainstorming 세션 (2026-05-06, 도감 시스템 의문 → 단순화 마인드 전환)
다음 업데이트: 베타 출시 후 D7 데이터 측정 결과
