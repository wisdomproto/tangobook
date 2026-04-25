# 책 Variants 시스템 Implementation Plan

> **🟢 Phase 3b만 남음 (2026-04-25)** — Phase 0~2 + 1.5 + 3a + 3c 완료. **남은 것: Phase 3b** (저작도구 8탭 재구성 + BookDetailPage v2 cutover). 진행 상세: `memory/book-variants-v2.md`. Commits: 56128d1, 0cbd241, 5c861b3, 80c0e47.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 동화책의 (level × language × style) 3축 variation을 정식 데이터 모델로 격상. 211권 마이그레이션 + 저작도구 탭 재구성 + 학습 리포팅 4축 확장까지 한 묶음.

**Architecture:** R2 prefix 기반 manifest + 분할 자산 구조. 서버 `BookV2Service`/`BookV2Repository`를 신규로 추가하고 v1(`storybook.service`)은 read-only fallback으로 격리. 클라이언트는 `features/book-v2/` 도입 후 기존 호출처를 점진 cutover.

**Tech Stack:** Express + TypeScript + Cloudflare R2 (S3 호환) + React + TanStack Query + Supabase (learning_events). 테스트 vitest.

**Spec:** `docs/superpowers/specs/2026-04-25-book-variants-design.md`

---

## File Structure

### 신규 파일

```
packages/shared/src/types/
  book-v2.ts                              # BookManifest, BookTextSlice, BookStyleSlice, BookGameInstance, AudiobookProject/Render, LongformProject 신버전, UsedVariants, GameImageRef

packages/server/src/
  repositories/book-v2.repository.ts      # R2 prefix 기반 CRUD (manifest/slice/asset)
  services/book-v2.service.ts             # 비즈니스 로직 (variant 추가, AI 변환 트리거, 검증)
  controllers/book-v2.controller.ts
  routes/book-v2.routes.ts                # /api/v2/books/*
  utils/book-v2-keys.ts                   # R2 key 빌더 (manifestKey, textKey, pageImageKey 등)
  utils/book-v2-runtime-merge.ts          # manifest + 활성 variant 슬라이스 → 런타임 객체 머지

packages/client/src/features/book-v2/
  api/book-v2.api.ts
  hooks/
    useBookManifest.ts
    useBookTextSlice.ts
    useBookStyleSlice.ts
    useActiveVariant.ts                   # localStorage 기반 학습자 활성 variant
  store/book-editor.store.ts              # Zustand: 저작도구 활성 (level, lang, style) 컨텍스트
  components/
    MetaTab.tsx                           # 신규
    TextTab.tsx                           # 신규 (레벨/언어 컨텍스트)
    StyleTab.tsx                          # 신규 (그림체 탭 + 캐릭터 + 표지)
    PageImageTab.tsx                      # 신규 (그림체+레벨 컨텍스트)
    AudiobookTab.tsx                      # 기존 → 렌더 모달 추가
    LongformTab.tsx                       # 기존 → 3축 컨텍스트
    MarketingTab.tsx                      # 기존 (lang 컨텍스트)
    GamesTab.tsx                          # 기존 → (level, lang) 컨텍스트 + 런타임 style 매핑 미리보기
    VariantPickerModal.tsx                # "변형 추가" 공용 모달
    ActiveVariantHeader.tsx               # 학습자 viewer 상단 (level/lang/style 표시)

scripts/
  migrate-to-variants.mjs                 # 211권 → 새 구조
  verify-variants-migration.mjs           # 무결성 검증
  rollback-variants-migration.mjs         # _backup-pre-variants/ → 원위치 복구

docs/
  book-variants-runtime.md                # 런타임 머지 알고리즘 + 활성 variant 결정 흐름
```

### 수정 파일

```
packages/shared/src/types/storybook.ts                  # 기존 Storybook → @deprecated 주석, 타입 유지
packages/shared/src/index.ts                            # book-v2 타입 export
packages/server/src/index.ts                            # /api/v2/books 라우트 마운트
packages/server/src/repositories/r2.repository.ts       # prewarm 로직에 _index/books.json 추가
packages/server/src/services/storybook.service.ts       # @deprecated, read-only로 제한
packages/server/src/services/game.service.ts            # 게임 데이터 생성 시 imageRefs 채우도록
packages/server/src/services/audiobook.service.ts       # supportedVariants + renders[] 처리
packages/server/src/services/longform.service.ts        # 3D 마스터-버전 트리, scene/clipUrl level 필드 추가
packages/server/src/services/marketing.service.ts       # lang 컨텍스트 명시
packages/client/src/features/storybook/                 # 호출처를 book-v2 hook으로 점진 교체
packages/client/src/features/games/                     # imageRef 기반 런타임 이미지 매핑
packages/client/src/features/viewer/                    # 활성 variant 기준으로 텍스트/이미지 fetch
packages/client/src/features/learning/lib/useGameLogger.ts  # metadata에 level/language/style
packages/client/src/features/learning/api/events.api.ts # metadata.lang → language 마이그
packages/client/src/router/index.tsx                    # editor 라우트는 그대로, viewer만 활성 variant 쿼리
packages/client/src/pages/EditorPage.tsx                # 탭 순서 재배치 + 퀴즈 제거
```

---

## Phase 0: Freeze + Backup (운영)

- [ ] **Task 0.1: 서비스 freeze 공지**
  - 사용자에게 시작 시각 공지
  - 저작도구 진입 시 read-only 배너 노출 플래그 (`config.featureFlags.editorFrozen = true`)

- [ ] **Task 0.2: R2 백업**
  - `scripts/backup-r2.mjs` (이미 있다면 재사용, 없으면 생성)
  - 전체 prefix 복사: 원본 → `_backup-pre-variants/{date}/...`
  - 사이즈/카운트 로깅. 이상 없으면 다음 Phase

- [ ] **Task 0.3: Supabase `learning_events` 백업**
  - SQL: `create table learning_events_backup_20260425 as select * from learning_events;`
  - 4축 metadata 마이그를 후속에 안전하게 진행하기 위함

---

## Phase 1: 신구 병행 인프라

### Task 1.1: shared 타입 정의

**Files:** `packages/shared/src/types/book-v2.ts`, `packages/shared/src/index.ts`

- [ ] book-v2.ts 작성 — 스펙 §4의 모든 인터페이스. ReadingLevel/ParentGuide는 기존 import.
- [ ] index.ts에서 export
- [ ] `pnpm --filter shared build` 통과 확인

### Task 1.2: R2 key 빌더

**Files:** `packages/server/src/utils/book-v2-keys.ts` + 테스트

- [ ] 함수 시그니처:
  ```ts
  manifestKey(bid)
  textSliceKey(bid, level, lang)
  audioFileKey(bid, level, lang, pageNumber)
  styleCharactersKey(bid, style)
  styleCoverKey(bid, style)
  stylePageImageKey(bid, style, level, illustrationKey)
  styleKeyObjectImageKey(bid, style, keyObjId)
  styleVocabImageKey(bid, style, vocabId)
  gameInstanceKey(bid, gameInstanceId)
  audiobookProjectKey(bid)
  audiobookRenderKey(bid, level, lang, style)
  audiobookRenderMetaKey(bid, level, lang, style)
  longformProjectKey(bid, projectId)
  longformVideoKey(bid, projectId)
  blogPostKey(bid, postId)
  cardNewsKey(bid, projectId)
  bookIndexKey()  // _index/books.json
  ```
- [ ] 테스트: 모든 빌더에 대해 key 정규성 (slash 없음, prefix `books/{bid}/`)

### Task 1.3: BookV2Repository (R2 CRUD)

**Files:** `packages/server/src/repositories/book-v2.repository.ts`

- [ ] 메서드:
  ```ts
  getManifest(bid): Promise<BookManifest>
  putManifest(bid, manifest): Promise<void>
  listManifests(): Promise<BookManifest[]>            // _index/books.json 캐시 우선 + R2 스캔 fallback
  
  getTextSlice(bid, level, lang)
  putTextSlice(bid, level, lang, slice)
  listTextSlices(bid)
  
  getStyleSlice(bid, style)                            // characters.json + 이미지 URL 조립
  putStyleSliceMeta(bid, style, characters)
  uploadStyleAsset(bid, style, type, refId, buffer)   // type: cover|page|keyObj|vocab
  
  getGameInstance(bid, gameId)
  listGameInstances(bid, level?, lang?)
  putGameInstance(bid, instance)
  deleteGameInstance(bid, gameId)
  
  getAudiobookProject(bid)
  putAudiobookProject(bid, project)
  putAudiobookRender(bid, render, mp4Buffer)
  getAudiobookRender(bid, level, lang, style)
  
  getLongformProject(bid, projectId)
  listLongformProjects(bid, filter?: {level?, lang?, style?})
  putLongformProject(bid, projectId, project)
  
  refreshBookIndex(): Promise<void>                    // manifest 전체 스캔 → _index/books.json
  ```

- [ ] in-memory 5분 캐시 + stale-while-revalidate (`r2.repository.ts` 패턴 재사용)
- [ ] prewarm: `prewarmBookV2IndexCache()` — 서버 기동 시 fire-and-forget

### Task 1.4: 런타임 머지 헬퍼

**Files:** `packages/server/src/utils/book-v2-runtime-merge.ts` + 테스트

- [ ] `mergeForViewer(manifest, textSlice, styleSlice)`:
  - 페이지 N개에 대해 `{ pageNumber, text, illustrationUrl, ttsUrl, sceneDescription }` 반환
  - 누락 자산은 placeholder URL + 경고 로그
- [ ] `mergeForGame(gameInstance, manifest, styleSlice, textSlices)`:
  - imageRefs를 활성 style의 실제 이미지 URL로 치환
  - 단어/한글은 textSlice의 keyObjectsText에서 보강
- [ ] 테스트: 누락 케이스(자산 없음, 다른 style) 모두 graceful

### Task 1.5: BookV2Service + Controller + Routes

**Files:**
- `services/book-v2.service.ts`
- `controllers/book-v2.controller.ts`
- `routes/book-v2.routes.ts`

- [ ] 라우트:
  ```
  GET    /api/v2/books                              # 라이브러리 리스트 (manifest 요약)
  GET    /api/v2/books/:bid                         # manifest + usedVariants
  POST   /api/v2/books                              # 신규 책 (default usedVariants 적용)
  PATCH  /api/v2/books/:bid/variants                # usedVariants 추가 (level/lang/style)
  DELETE /api/v2/books/:bid

  GET    /api/v2/books/:bid/texts/:level/:lang
  PUT    /api/v2/books/:bid/texts/:level/:lang
  
  GET    /api/v2/books/:bid/styles/:style           # 이 그림체 전체 슬라이스
  POST   /api/v2/books/:bid/styles/:style/derive    # 기존 그림체에서 AI 변환 시작
  PUT    /api/v2/books/:bid/styles/:style/characters
  POST   /api/v2/books/:bid/styles/:style/cover
  POST   /api/v2/books/:bid/styles/:style/pages/:level/:key
  
  GET    /api/v2/books/:bid/games?level=&lang=
  POST   /api/v2/books/:bid/games
  PUT    /api/v2/books/:bid/games/:id
  DELETE /api/v2/books/:bid/games/:id

  GET    /api/v2/books/:bid/audiobook
  PUT    /api/v2/books/:bid/audiobook
  POST   /api/v2/books/:bid/audiobook/render        # body: { level, lang, style }
  GET    /api/v2/books/:bid/audiobook/renders

  GET    /api/v2/books/:bid/longform?level=&lang=&style=
  POST   /api/v2/books/:bid/longform
  ...

  GET    /api/v2/books/:bid/runtime/viewer?level=&lang=&style=    # 머지된 viewer 데이터
  GET    /api/v2/books/:bid/runtime/game/:gameId?style=           # 머지된 게임 데이터
  ```
- [ ] AppError 패턴 + asyncHandler 재사용
- [ ] `index.ts`에 라우트 마운트
- [ ] `pnpm --filter server build` + 라우트 핑 테스트

### Task 1.6: 클라이언트 인프라 (호출만 하는 단계)

**Files:** `packages/client/src/features/book-v2/{api,hooks,store}/...`

- [ ] axios 헬퍼: `bookV2Api.{listBooks, getBook, addVariant, getTextSlice, putTextSlice, ...}`
- [ ] TanStack Query 훅: `useBookManifest(bid)`, `useBookTextSlice(bid, level, lang)`, `useBookStyleSlice(bid, style)`, `useBookGames(bid, level, lang)`
- [ ] Zustand store: 저작도구 활성 컨텍스트 `{ activeLevel, activeLang, activeStyle }` + setter
- [ ] 학습자 활성 variant 훅: `useActiveVariant(bid)` — localStorage `book-v2-active::{bid}` 저장. fallback은 manifest의 `usedVariants[0]`.

이 시점에는 UI에서 사용 안 함. 다음 Phase에서 cutover.

---

## Phase 2: 211권 변환 스크립트

### Task 2.1: 마이그 스크립트 골격

**Files:** `scripts/migrate-to-variants.mjs`

- [ ] CLI 옵션:
  ```
  --dry-run                # write 안 하고 plan만 출력
  --only <bid>,<bid>       # 지정 책만
  --concurrency 3          # 병렬도
  --force                  # 기존 manifest 덮어쓰기
  ```
- [ ] 동작:
  1. v1 storybook list 전체 fetch (211권)
  2. base bid 기준 그룹핑: `{ baseBid, variants: [{ level, storybookV1 }] }`
     - `${bid}__${level}` 패턴 정규식 파싱 (없으면 launch level)
  3. 각 그룹 → 1 manifest + N text slices + 1 style slice (원래 artStyle)
  4. 자산 복사:
     - 페이지 일러스트 URL → `styles/{style}/pages/{level}/page-N.webp` 로 R2 server-side copy
     - 표지/캐릭터/핵심단어/어휘 이미지 마찬가지
     - TTS는 `audio/{level}/{lang}/page-N.mp3`로 copy
  5. localText/localTtsUrl이 있으면 추가 lang 슬라이스 작성 + 오디오 copy
  6. 게임 instance: 각 게임을 `games/{gameId}.json`으로, level/lang 추정 + imageRefs 변환
  7. 오디오북·롱폼 프로젝트는 path만 변환 후 그대로
- [ ] idempotent: 목적지 존재하면 skip (force일 때만 덮어쓰기)
- [ ] 진행률 로그 + per-bid 시간 측정

### Task 2.2: imageRefs 변환 로직

**Files:** 마이그 스크립트 내부 헬퍼

- [ ] 게임 데이터를 분석해서 keyObjId/vocabId/pageId 추출:
  - line-matching: `data.pairs[].imageUrl` → 매칭되는 keyObjImage URL → keyObjId 역추적
  - connect-the-dots: `data.imageUrl` → keyObjId
  - english-block / korean-block: word만 — imageRefs 없을 수도
  - story-image: `data.rounds[].imageUrl` → pageId 역추적
- [ ] 매칭 실패 시 imageRefs 빈 배열 + 경고 로그 (스크립트 종료 후 manual fix 리스트 출력)

### Task 2.3: learning_events.metadata 마이그

**Files:** Supabase SQL 또는 `scripts/migrate-learning-events.sql`

- [ ] 마이그:
  ```sql
  update learning_events
  set metadata = jsonb_set(
    metadata - 'lang',
    '{language}',
    metadata->'lang'
  )
  where metadata ? 'lang';
  ```
- [ ] 기존 row의 `level`/`style`은 null 유지 (소급 채움 불가)

### Task 2.4: 검증 스크립트

**Files:** `scripts/verify-variants-migration.mjs`

- [ ] 211 → N개 manifest 매핑 테이블 생성
- [ ] 각 manifest에 대해:
  - usedVariants에 명시된 모든 (level, lang) 슬라이스 존재 확인
  - 페이지별 illustrationKey가 styles/{style}/pages/... 에 존재
  - keyObjectIds 모든 ID에 대해 텍스트(언어별) + 이미지(스타일별) 존재
  - 게임 instance의 imageRefs 매핑 가능
- [ ] 결과: PASS/WARN/FAIL 카운트 + WARN/FAIL 상세 JSON 리포트

### Task 2.5: 롤백 스크립트

**Files:** `scripts/rollback-variants-migration.mjs`

- [ ] `_backup-pre-variants/{date}/...` → 원본 prefix로 복구
- [ ] `books/` prefix 전체 삭제
- [ ] `_index/books.json` 삭제
- [ ] Supabase row level은 별도 (백업 테이블에서 복원)

### Task 2.6: dry-run 실행 + 사용자 확인

- [ ] `node scripts/migrate-to-variants.mjs --dry-run > dry-run-report.json`
- [ ] 사용자에게 plan 요약 보고 (몇 권 → 몇 manifest, 몇 자산 copy)
- [ ] 사용자 OK 후 본 실행

---

## Phase 3: 코드 cutover

### Task 3.1: 클라이언트 라이브러리 페이지

**Files:** `packages/client/src/pages/LibraryPage.tsx`, `BookCard.tsx`, `BookDetailPage.tsx`

- [ ] `useBookManifest` 호출로 변경
- [ ] BookCard: manifest의 `usedVariants` 표시 (배지: L1·L3 / 한·영 / 수채화·카툰)
- [ ] BookDetailPage: 언어 탭 → usedVariants.languages, 모드 카드는 manifest 기반
- [ ] 저작도구 진입 url 유지 (`/edit/:bid`)

### Task 3.2: 뷰어 활성 variant 적용

**Files:** `packages/client/src/features/viewer/components/ViewerContainer.tsx`, `lib/page-text.ts`

- [ ] 진입 쿼리: `?level=L3&lang=ko&style=watercolor` (기본은 manifest.usedVariants 첫 항목)
- [ ] `useActiveVariant(bid)` 훅으로 활성 variant 결정 (쿼리 > localStorage > manifest default)
- [ ] runtime 데이터 fetch: `GET /api/v2/books/:bid/runtime/viewer?level&lang&style` (서버에서 머지된 viewer payload)
- [ ] `ActiveVariantHeader.tsx` 컴포넌트로 상단 표시 + 변경 드롭다운 (책 화이트리스트만)
- [ ] 페이지 텍스트/TTS/이미지 모두 머지된 객체에서 직접 사용

### Task 3.3: 저작도구 탭 재구성

**Files:** `packages/client/src/pages/EditorPage.tsx` + 신규 탭 컴포넌트

- [ ] 탭 8개 순서: 메타 / 텍스트 / 스타일 / 페이지 / 오디오북 / 동영상 / 마케팅 / 게임 (퀴즈 제거)
- [ ] `EditorContextHeader.tsx` (책 좌상단 고정): bid, title, [추가된 변형] 배지
- [ ] 각 탭은 자기가 의존하는 축의 컨텍스트 바를 자체 보유:
  - 메타: 없음 (책 단위)
  - 텍스트: [레벨▼][언어▼]
  - 스타일: [그림체▼]
  - 페이지: [그림체▼][레벨▼]
  - 오디오북: 없음 (편집은 책 단위)
  - 동영상: [레벨▼][언어▼][그림체▼]
  - 마케팅: [언어▼]
  - 게임: [레벨▼][언어▼]
- [ ] 컨텍스트 바에 "변형 추가" 버튼 → `VariantPickerModal` (사용 안 한 축의 옵션 선택 → manifest.usedVariants 추가 + 빈 슬라이스 생성)

### Task 3.4: 메타 탭

**Files:** `MetaTab.tsx`

- [ ] 제목 / 카테고리 / parentGuide 편집 (기존 유지)
- [ ] **usedVariants 매트릭스 시각화**: levels × languages × styles 3D를 2D 표 + style 탭으로 분리
- [ ] "1-click 빠른 시작": L3 + ko + watercolor 한꺼번에 추가 버튼

### Task 3.5: 텍스트 탭

**Files:** `TextTab.tsx`

- [ ] 컨텍스트 [레벨][언어] → 해당 슬라이스 fetch
- [ ] 페이지 그리드 + 핵심단어 텍스트 + 어휘 텍스트 편집
- [ ] "다른 레벨/언어로 복제" 버튼 — AI 번역/재서술 트리거 (기존 generateConfig 재사용)

### Task 3.6: 스타일 탭

**Files:** `StyleTab.tsx`

- [ ] 그림체 탭 (활성 styles만 노출)
- [ ] 섹션: 캐릭터 시트 / 표지 일러스트
- [ ] "그림체 추가" → 베이스 그림체 선택 → AI 변환 시작 (`POST .../styles/:style/derive`)
- [ ] 변환 진행률 폴링 (캐릭터 → 표지 순)

### Task 3.7: 페이지 탭

**Files:** `PageImageTab.tsx`

- [ ] 컨텍스트 [그림체][레벨] → 해당 페이지 일러스트 + 핵심단어/어휘 이미지
- [ ] 페이지별 illustrationKey 기반 이미지 슬롯
- [ ] 일괄 생성 / 개별 생성 / 히스토리 (기존 패턴)
- [ ] **베이스 그림체에서 변환** 옵션 — Nano Banana Pro로 같은 페이지의 다른 그림체 이미지 생성

### Task 3.8: 오디오북 탭

**Files:** `AudiobookTab.tsx` (수정), `AudiobookRenderModal.tsx` (신규)

- [ ] 편집 영역: 슬라이드 효과 / 자막 / BGM (기존 그대로, 책 단위)
- [ ] **렌더 모달**: [레벨][언어][그림체] 3개 드롭다운 (manifest.usedVariants에 있는 것만) + 렌더 시작
- [ ] 렌더 결과 목록: 카드 그리드 (각 카드에 level/lang/style 배지 + 영상 프리뷰 + YouTube 업로드 상태)

### Task 3.9: 동영상 탭

**Files:** `LongformTab.tsx` 수정

- [ ] 컨텍스트 [레벨][언어][그림체] → 해당 조합의 롱폼 프로젝트 fetch
- [ ] 마스터-버전 트리: master(L3/ko/watercolor) ↔ 한 axis만 다른 변형들
- [ ] 재분석 시 보존 규칙 (기존 `longform.service.ts#analyze` 확장):
  - style 같으면 clipUrl/clipHistory 보존
  - lang 다르면 자막/TTS만 갱신
  - level 다르면 페이지 수 다르므로 scenes 재구성

### Task 3.10: 마케팅 탭

**Files:** `MarketingTab.tsx`

- [ ] [언어▼] 컨텍스트만 추가
- [ ] 블로그·카드뉴스 데이터를 lang별 분리 저장

### Task 3.11: 게임 탭

**Files:** `GamesTab.tsx`, `features/games/components/players/*Player.tsx`

- [ ] 컨텍스트 [레벨][언어]
- [ ] 게임 instance 생성 시 imageRefs를 명시 (단어 텍스트는 BookTextSlice의 keyObjectsText에서 lookup, 그림체별 매핑은 런타임)
- [ ] 플레이어들이 imageUrl 대신 imageRef를 받도록 인터페이스 변경 → 런타임에 활성 style 머지된 url을 받음
- [ ] 미리보기는 활성 style (저작도구 컨텍스트 헤더의 default style 또는 사용자 선택)

### Task 3.12: 학습 리포팅 4축

**Files:** `features/learning/lib/useGameLogger.ts`, `aggregate.ts`, `api/events.api.ts`

- [ ] `useGameLogger`가 받는 metadata에 `level`, `language`, `style` 필수
- [ ] 모든 게임 플레이어에서 활성 컨텍스트의 (level, lang, style) 전달
- [ ] viewer page_read도 (level, lang, style) 추가
- [ ] aggregate.ts에 4축 그룹핑 함수 추가
- [ ] `/parent/reports`에 레벨별·언어별·그림체별 차트 추가 (기본 구현, 정교화는 후속)

### Task 3.13: v1 격리

**Files:** `services/storybook.service.ts`

- [ ] `@deprecated` 주석
- [ ] read-only 메서드만 유지 (`getById`, `list`)
- [ ] write 호출 시 `AppError(410, 'Storybook v1 deprecated, use /api/v2/books')`
- [ ] 라우트 `/api/storybooks/*`는 read-only로 fallback (긴급 롤백용)

---

## Phase 4: 검증

### Task 4.1: 자동 검증

- [ ] `node scripts/verify-variants-migration.mjs` PASS
- [ ] `pnpm typecheck` 전 패키지
- [ ] `pnpm lint` 전 패키지
- [ ] `pnpm --filter shared test`, `--filter client test`, `--filter server test` PASS

### Task 4.2: 샘플 5권 수동 QA

선정 (다양성):
- 명작 L3 only (e.g., 헨젤과 그레텔)
- 명작 L1+L2+L3+L4 (e.g., 인어공주)
- 파닉스 한글
- 파닉스 영어
- 자연관찰 (parentGuide 없음)

각 권에 대해:
- [ ] 라이브러리에서 보임 + variants 배지 정확
- [ ] 뷰어 진입 → 텍스트/이미지/TTS 정상
- [ ] 활성 variant 변경 (style/lang) → 즉시 반영
- [ ] 저작도구 8 탭 모두 정상 로드
- [ ] 게임 1종 플레이 → imageRef 매핑 OK
- [ ] 오디오북 렌더 1회 (기존 데이터) → mp4 OK
- [ ] 학습 이벤트가 4축 metadata로 들어감

### Task 4.3: 성능 회귀

- [ ] `_index/books.json` prewarm 후 라이브러리 첫 응답 시간 측정 (기존 23ms 유지)
- [ ] runtime/viewer 엔드포인트 평균 응답 < 200ms
- [ ] R2 호출 횟수 측정 (manifest + 1 textSlice + 1 styleSlice = 3회 이내)

### Task 4.4: freeze 해제

- [ ] `config.featureFlags.editorFrozen = false`
- [ ] 사용자 공지

---

## Phase 5: Cleanup

- [ ] **Task 5.1: v1 코드 제거** — `storybook.service.ts`, `storybook.controller.ts`, `storybook.routes.ts`, 관련 hooks 삭제
- [ ] **Task 5.2: shared `Storybook` 타입 제거** — book-v2 타입으로 완전 대체. 컴파일 에러 잡으며 진행
- [ ] **Task 5.3: `_backup-pre-variants/` 정리** — 30일 후 보존 정책 따라 삭제
- [ ] **Task 5.4: docs 업데이트** — CLAUDE.md, memory/MEMORY.md, memory/book-variants-complete.md 신규
- [ ] **Task 5.5: 후속 follow-up 티켓 정리** — 스펙 §9의 항목들

---

## 테스트 전략

- **단위**: book-v2-keys, runtime-merge, mastery 4축 집계 (각 lib/*.test.ts)
- **통합**: 마이그 스크립트 dry-run 결과 vs 실제 실행 비교 (작은 샘플 책 1권)
- **E2E**: 샘플 5권 수동 QA (Phase 4.2)
- **성능**: 라이브러리 prewarm + runtime endpoint 응답 시간

## 롤백 계획

**Phase 1~2 중 실패** (cutover 전):
- v1 코드 그대로 → `books/` prefix 삭제 + `_index/books.json` 삭제
- 영향 0

**Phase 3 cutover 후 critical 버그**:
- featureFlag로 클라이언트를 v1 service에 강제 (긴급 토글)
- 데이터는 v1·v2 둘 다 살아있어 재동기화 필요. _backup-pre-variants/ 비교 후 부분 복구

**Phase 5 cleanup 후 발견된 데이터 손실**:
- `_backup-pre-variants/` 30일 보존 — `rollback-variants-migration.mjs`로 1권 단위 복구

## Out of Scope

스펙 §9 그대로:
- 그림체별 캐릭터 일관성 자동 검증 UI
- 변형 추가 일괄 마법사 (텍스트 번역 + 이미지 변환 + TTS 한 번에)
- 라이브러리 [레벨][언어][그림체] 필터
- 오프라인 viewer IndexedDB 캐시
- learning_events row의 level/style 소급 보강

---

## Pre-flight Checklist

진입 전 확인:
- [ ] 그림체 변환 PoC 결과물(샘플 1권) 검증 — 캐릭터 ID 일관성 OK
- [ ] R2 quota 여유 확인 (211권 백업 + 신구 병행 = 약 2배 용량)
- [ ] Supabase backup 정책 확인
- [ ] freeze 가능 시간대 사용자와 합의 (예: 주말 1일)
- [ ] 현재 `M docs/hori-sprite-prompts.md`, `M .claude/settings.local.json` 등 untracked·dirty 파일 정리

## 진행 시 사용자 확인 포인트 (in-flight gates)

각 단계 후 사용자 검토 받고 진행:
1. Phase 1 끝 — v2 인프라가 v1 동작에 영향 안 주는지 (smoke test)
2. Phase 2.6 dry-run 리포트 — 매핑 결과가 의도와 일치하는지
3. Phase 3.3 탭 구조 첫 화면 — UX 의도와 맞는지
4. Phase 4.2 샘플 5권 QA 결과 — freeze 해제 전 마지막 게이트
