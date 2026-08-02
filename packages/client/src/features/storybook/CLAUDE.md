# Storybook 모듈

동화책 CRUD + 사이드바 + 카드 + 복사 (deep clone + 진행률).

## 폴더 구조

```
features/storybook/
  api/storybook.api.ts           # CRUD + copy(sync) + copyAsync/copyProgress + variant + generate
  hooks/
    useStorybooks.ts             # useStorybooks() 목록, useStorybook(id) 단건
    useStorybookMutations.ts     # save/patch/copy/copyAsync/delete/variant/generate
  components/
    Sidebar.tsx                  # 좌측 사이드바 (3 main 탭: 동화책/파닉스/어휘)
    SidebarCard.tsx              # 사이드바 카드 + 점메뉴 (복사/공개/카테고리/이름변경/삭제)
    StorybookCard.tsx            # 라이브러리 카드 (16:9 표지)
    StorybookGrid.tsx            # 라이브러리 그리드
    CreateStorybookForm.tsx      # 새 동화책 만들기 form
    CreatePhonicsBookForm.tsx    # 새 파닉스 만들기 form
    CategoryManagerModal.tsx     # 카테고리 관리 모달
    DeleteConfirmModal.tsx
    CopyProgressModal.tsx        # 복사 진행률 (스피너+%+N/M)
```

## API 호출 패턴

- 일반 CRUD: `apiGet`/`apiPost`/`apiDelete`
- 복사: 동기 `copy()` + 비동기 `copyAsync()` + `copyProgress(taskId)`
- TanStack Query: 캐시 키 `['storybooks']` (목록), `['storybook', id]` (단건)
- 모든 mutation: `onSuccess` 에서 `invalidateQueries(['storybooks'])` + `setQueryData(['storybook', data.id], data)`

## 동화책 복사 (Deep Clone + 진행률)

### 정책

- **이미지/TTS 자산**: R2 객체 자체를 복사 (zero-copy CopyObject) — URL 분리, 원본 영향 없음
- **공유 라이브러리** (`phonics-library/`, `background-music/`, `system-sounds/`, `hori/`, `mascot/`, `strategy-samples/`): URL 그대로 (모든 책이 공유)
- **영상** (`audiobookProjects`, `longformProjects`): 복사 X (R2 용량 절약)
- **styleAssets**: JSON 안에 있어 자동으로 deep clone

### 서버 구현 (`storybook.service.ts`)

```ts
copyAsync(id) → { taskId }     // fire-and-forget 시작
getCopyProgress(taskId)        // polling 응답
_copyImpl(id, taskId?)         // 실제 동작
  1. fetch original + 복사번호 계산
  2. 영상 필드 strip (audiobookProjects/longformProjects undefined)
  3. JSON.stringify → R2 public URL regex 추출 (uniqueUrls)
  4. 공유 라이브러리 제외 → dupTargets
  5. setProgress({ total: dupTargets.length + 1 })
  6. Promise.all CopyObject 병렬 + setProgress({ current: done++ })
  7. JSON 문자열 일괄 치환 (split/join)
  8. R2Repository.saveStorybook → status: 'done', newId, newTitle
```

### 진행률 추적

- `copyProgressMap: Map<taskId, CopyProgress>` (in-memory, 30분 자동 정리)
- 새 키 규칙: `oldKey.includes(original.id)` → `replace(original.id, newId)`, 아니면 `${newId}-${oldKey}`
- 키 패턴 예: `1773309795799-cover-misc-xxx.webp` → `1777xxxxxxxxx-cover-misc-xxx.webp`

### 클라이언트 (`useCopyStorybookAsync`)

- `start(id, title)` 호출 → progress state 0% → 100%
- 700ms polling, done 시 `invalidateQueries(['storybooks'])`
- error 시 status='error' + error 메시지
- `reset()` 으로 모달 닫기

### CopyProgressModal

- pending: 회전 스피너 + 책 제목 + 큰 % 숫자 + 진행 바 (gradient)
- done: 체크 마크 + 1.2초 자동 닫힘
- error: 빨강 아이콘 + 에러 메시지 + 닫기 버튼
- Sidebar 가 `copyAsync.progress.status === 'done' && newId` 시 자동으로 새 책 selectedId 설정

## Sidebar 동작 (`/editor2` 모드)

- 3 main 탭: 동화책 / 파닉스 / 어휘 (`useEditorStore.sidebarTypeFilter`)
- 파닉스 sub-toggle: 한글 / 영어 (`phonics-ko` / `phonics-en`)
- 어휘 모드 시 `<VocabularyUnitSidebarList />` 렌더 (storybook list 가 아님)
- /editor2 한정: variant sibling (`__L1`/L2/L3) 숨김 + base 카드에 `+N` 보라색 배지
- **URL 분기 fix**: 탭 전환 / 동화책 카드 클릭 시 `/vocab/` URL 잔존하면 `navigate('/editor2')` 또는 `/editor2/${id}` 로 갱신 (`AppLayoutV2` unitId 분기 stuck 방지)
- **정렬 — typeFilter 별 분리 (2026-05-22)**: `sidebarSortByType: { storybook: 'latest', phonics: 'title', vocabulary: 'latest' }`. **파닉스 디폴트 = 제목순** (unit 01 → 02 → ... 학습 흐름 자연스러움), 동화책 = 최신순. `setSidebarSort(sort)` 가 현재 활성 typeFilter 의 sort 만 업데이트 — 한 탭의 선택이 다른 탭에 영향 X.

## 새 책 만들기

- 모달에서 파닉스/동화책 선택 → form 입력 → `useGenerateStorybook` / `useGeneratePhonicsBook`
- 생성 후 `invalidateQueries(['storybooks'])` + `setSelectedStorybookId(data.id)`

## 카테고리/폴더

🔴 **2026-08-01 부터 「폴더」= 라이브러리 카테고리(`Storybook.category`) 하나뿐이다.** `folder` 필드는 안 쓴다.

- 예전엔 사이드바가 `folder`(자유 텍스트), 라이브러리가 `category` 로 묶어 **두 이름이 따로 놀았다** — 실측 407권 중 **238권 불일치**: `완성` 48권(folder 가 작업 상태로 쓰임)·`자연관찰(꽃과 풀)` 등 13폴더가 라이브러리 8카테고리로 합쳐짐·backup 67권은 folder 없음. 그래서 folder 를 그대로 카테고리로 승격하는 건 **불가**(라이브러리에 "완성" 섹션이 생기고 식물 친구들이 3개로 쪼개진다) → 반대 방향(category 정본)으로 통일했다.
- 사이드바 그룹 목록 = `typeFiltered` 의 `category` 집합 + per-tab 커스텀(`foldersByTab`). **정렬은 가나다순이 아니라 R2 `LibraryConfig.categoryOrder`**(`makeCategoryComparator`) — 저작 화면이 학습자 화면과 같은 순서를 본다.
- **⋮⋮ 손잡이 드래그 = 카테고리 순서 변경 → R2 즉시 저장**(적용 버튼 없음). 행 자체는 책을 받는 droppable 이라 별도 `SortableContext` 없이 같은 `folder:` 드롭 타깃을 재사용한다(`active.id` 가 `cat:` 로 시작하면 reorder). 저장 시 **활성 탭 밖 카테고리는 보존**해서 병합.
- 책 카드 드래그 = `category` 패치. 이름 변경 = 그 카테고리 책 전부 + `categoryOrder`/`categoryList` 동시 갱신. **삭제는 비어 있을 때만**(책이 든 채 지우면 학습자 화면에서 섹션이 통째로 사라진다).
- ⚠️ 남은 찌꺼기: `SidebarCard` 점메뉴의 「카테고리 변경」 목록은 아직 store(`categoriesByTab`) 목록을 본다 — 쓰는 필드는 같은 `category` 라 동작은 정상.

## 진입점

- `/editor` (v1 백업, 손대지 않음)
- `/editor2` 또는 `/editor2/:bid` (v1 업그레이드 작업용)
