# Vocabulary Unit System Design Spec

**Date:** 2026-05-01
**Status:** Implemented (commits `6a951c8` · `4fb328c` · `50780ae` · `f6319af`)
**Goal:** 3축 학습 (동화/파닉스/어휘) 의 마지막 축 — Cambridge Pre-A1 Starters 표준 토픽 + 사용자 정의 단원 시스템.

## Background

탱고북은 동화책 + 파닉스 2축으로 시작했지만 사용자가 strategy.html v2 에서 "전체가 3개 축" 이라 명시 — 동화책의 부산물(`key_objects`)이나 파닉스의 부산물(`flashcards`)이 아니라 **독립된 학습 단원** 으로 어휘를 다뤄야 함.

### 핵심 차이 (KeyObject vs VocabularyUnit)
- KeyObject = 동화책 안의 핵심 사물. **1 사물 = 1 이미지** (오리지널 + history)
- VocabularyWordImage = 어휘 단원 안의 단어. **1 단어 = N 이미지** (다양한 그림으로 같은 단어 반복 노출)

이미지 회전은 SR(Spaced Repetition) 학습에서 단어를 3~4번 다른 시각적 맥락으로 보여주기 위함. Phase 5 호리 놀이터의 `pickImageForReview(entry, n)` 가 이를 활용.

## Data Model (`shared/types/vocabulary-unit.ts`)

```ts
export type VocabularyUnitSource = 'cambridge-starters' | 'custom';

export interface VocabularyWordImage {
  id: string;
  imageUrl: string;
  prompt?: string;
  isPrimary?: boolean;          // 학습 화면 default 노출
  keypoints?: DotKeypoint[];    // 글자 따라쓰기
  createdAt: string;
}

export interface VocabularyUnitWord {
  word: string;
  korean?: string;
  nameEn?: string;
  nameTranslations?: Record<string, string>;
  description?: string;          // 이미지 prompt 베이스
  customPrompt?: string;
  images?: VocabularyWordImage[]; // ★ 다중 이미지
  ttsUrl?: string;               // ko default
  ttsUrls?: Record<string, string>; // en/ja/zh 등
  definition?: string;
  example?: string;
  difficulty?: number;
}

export interface VocabularyUnit {
  id: string;                    // 'unit-cambridge-{topic}' | 'unit-custom-{ts}'
  source: VocabularyUnitSource;
  topicId?: string;              // Cambridge 토픽 id 등
  nameKo: string;
  nameEn?: string;
  emoji?: string;
  description?: string;
  words: VocabularyUnitWord[];
  language: Lang;
  level?: number;                // Cambridge Pre-A1 = 1, A1 = 2
  isPublic?: boolean;
  folder?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Cambridge Pre-A1 Starters Seed

`shared/constants/cambridge-starters.ts` — 16 토픽 × ~470 단어:
- Animals · Body · Clothes · Colours · Family · Food · Health · Home · Numbers · Places · School · Sports · World · Verbs · Adjectives · Adverbs

**제외 (학습카드 부적합):** Pronouns / Prepositions / Conjunctions / Question Words

Seed 엔드포인트 `POST /api/vocabulary-units/seed/cambridge`:
- Idempotent — 재실행 시 user 가 추가한 이미지/TTS 보존
- 단원이 이미 있으면 word list 만 merge (단어 정의/예문 기존 우선)

## Architecture

### 클라이언트
```
features/vocabulary-unit/
  api/vocabulary-unit.api.ts          # list, getById, upsert, remove, seedCambridge, generateImage
  hooks/useVocabularyUnits.ts         # TanStack Query
  components/
    VocabularyUnitSidebarList.tsx     # /editor2 어휘 모드 사이드바
    VocabularyUnitEditor.tsx          # 메인 에디터 (KeyObjectTab UI 포팅)
    VocabularyStudyPage.tsx           # 학습 화면 (carousel + TTS + word_exposed)
  index.ts
```

### 서버
```
server/src/
  services/vocabulary-unit.service.ts # R2 카탈로그 + Cambridge seed
  services/image.service.ts           # generateVocabularyUnitWord 추가
  controllers/vocabulary-unit.controller.ts
  routes/vocabulary-unit.routes.ts    # GET/POST/DELETE /api/vocabulary-units
  routes/image.routes.ts              # POST /api/images/vocabulary-unit-word
```

### R2 prefix
- 단원 카탈로그: `vocabulary-units-catalog.json`
- 단어 이미지: `vocabulary-units/{unitId}/{word}-{ts}.webp`

## Routes

| URL | 컴포넌트 | 용도 |
|-----|---------|------|
| `/vocabulary` | (학습자 단원 목록 페이지 — follow-up) | 단원 카드 + 진척률 + 즐겨찾기 |
| `/vocabulary/:unitId` | `VocabularyStudyPage` | 학습 carousel + TTS + 진척률 + 별 적립 |
| `/editor2/vocab/:unitId` | `VocabularyUnitEditor` (via AppLayoutV2 unitId 분기) | 단원 편집 |

## VocabularyUnitEditor — KeyObjectTab UI 풀 포팅

사용자 첫 버전 피드백: "야... ui/ux 좀 제대로 베껴와. 전체 생성, 다운로드 업로드 이런거 안보이는데?"

**전면 재작성 (commit `50780ae`, 699 insertions / 431 deletions):**

### 헤더 toolbar (sticky)
- 단원 정보 (이모지 + 이름 + 단어수 + 언어 + 폴더)
- "변경됨" 인디케이터 + 💾 저장 버튼 (Cmd+S)
- 메타 accordion (펼치기) — 이름/이모지/설명/공개 토글

### 일괄 작업 toolbar
- `<ImageModelSelector>` — Gemini 모델 선택 (commit `f6319af` 추가)
- TTS 언어 선택 (ko / en) + 보이스 선택
- 🎙 TTS 일괄 생성 — 일괄 진행률 표시
- ➕ 단어 추가 — toggle form
- 🎨 전체 이미지 생성 — 이미지 0장인 단어만 1장씩 생성

### BatchProgressBar + AbortController
- 일괄 작업 시 "N / M (NN%)" 표시 + ⏹ 취소 버튼
- 취소 시 `AbortController.abort()` → fetch 즉시 중단

### 4-col WordCard grid
각 카드 구성:
- **이미지 영역**: ImageDropZone wrap (drag-n-drop)
  - primary 이미지: `<ImagePreview>` (lightbox + 삭제 버튼)
  - 추가 이미지 thumbnail row (클릭 시 primary 변경)
  - 이미지 0장이면 "드래그 또는 업로드" 안내
- **텍스트 영역**: word/korean inline 편집
- **TTS row**: 생성/재생/삭제 버튼 (`<TtsRow>` 패턴)
- **메타 영역**: description / customPrompt accordion / 이미지 카운트 뱃지
- **Action row**: 생성 버튼 / `<DownloadButton>` / `<UploadMenu>` / 🗑 삭제

### 이미지 lightbox
ImageLightbox — 큰 이미지 + 키보드 ESC 닫기. 썸네일 row 의 어떤 이미지든 클릭 시 lightbox 오픈.

## Sidebar 통합 (3축 탭)

`features/storybook/components/Sidebar.tsx`:
- 3 main 탭: 동화책 / 파닉스 / 어휘
- 파닉스 sub-toggle: 한글 / 영어 (typeFilter 가 'phonics-ko' or 'phonics-en')
- 어휘 모드 시 `<VocabularyUnitSidebarList />` 별도 렌더 (storybook list 가 아닌 unit list)
- `editor.store.ts` 의 `SidebarTypeFilter` 에 `'vocabulary'` 추가

## URL 분기 fix (commit 후속)

**Bug:** `/editor2/vocab/{unitId}` URL 에서 동화책 탭 클릭 → 우측 화면이 어휘 콘텐츠 stuck. 원인: useParams 의 unitId 가 살아있어 `AppLayoutV2` 가 무조건 `VocabularyUnitEditor` 분기.

**Fix (Sidebar.tsx):**
- 탭 전환 시 URL 에 `/vocab/` 가 있거나 `/editor2/{id}` 형태면 `navigate('/editor2')` 로 정리
- 동화책 카드 클릭 시 `/vocab/` URL 이면 `navigate('/editor2/${sb.id}')` 로 갱신

## Performance & Caching

`/api/storybooks` hang 사고 후 R2 SDK 호출에 timeout 보호 추가 (commit `f6319af`):
- `withR2Timeout(p, ms, label)` — Promise.race + setTimeout
- `downloadFromR2`: 20s send / 15s read
- `listStorybooks`: 90s 넘게 pending 시 `refreshInFlight = null` reset 후 재시도
- `startRefresh()` 헬퍼로 `refreshInFlightStartedAt` 추적

## 학습 화면 동작 (`VocabularyStudyPage`)

1. 단어 carousel — framer-motion slide-fade
2. 카드 진입 시 자동 TTS (300ms 딜레이)
3. 첫 노출 시 `word_exposed` 학습 이벤트 emit
4. 다음/이전/재생 버튼
5. 마지막 단어 완료 → confetti + 별 적립 (rewards Phase 1 트리거)
6. 진행률 바 (현재 idx / 전체)

## Follow-up

### 단기
- DotEditor UI for keypoints (데이터 구조는 KeyObject 동일, UI 미구현)
- `word_exposed` source enum 'vocabulary' 추가 (현재 'storybook' 재사용)
- 일괄 번역 버튼 (en→ko) — KeyObjectTab 패턴
- `/vocabulary` 학습자 단원 목록 페이지

### 장기
- SR 큐 (호리 놀이터) 가 vocabulary-unit 이미지 회전 활용
- Cambridge Pre-A1 외 A1, A2 토픽 추가 (Movers, Flyers)
- 단어 시험 (random 5~10단어 quiz)

## Migration

기존 데이터 영향 없음 — vocabulary-unit 은 새 R2 prefix. 기존 `key_objects`·`flashcards`·`vocabulary-db.json` 그대로 유지. follow-up 으로 vocabulary-db 와 단원 단어를 cross-link 가능.

## Acceptance

- [x] Cambridge 16 토픽 seed (idempotent)
- [x] 단원 CRUD + R2 카탈로그
- [x] 다중 이미지 (primary + N추가)
- [x] AI 이미지 생성 (단일 + 일괄)
- [x] TTS 생성 (단일 + 일괄, lang/voice 선택)
- [x] 이미지 모델 선택 (ImageModelSelector)
- [x] 학습 화면 + word_exposed 이벤트
- [x] Sidebar 3축 통합
- [x] URL 분기 stuck fix
- [ ] DotEditor UI (follow-up)
- [ ] 학습자 단원 목록 페이지 (follow-up)

## References
- 메모리: [memory/vocabulary-unit-system.md](../../../memory/vocabulary-unit-system.md)
- 모듈 가이드: [features/vocabulary-unit/CLAUDE.md](../../../packages/client/src/features/vocabulary-unit/CLAUDE.md)
- 관련 스펙: [2026-04-30-rewards-sr-collection-design.md](2026-04-30-rewards-sr-collection-design.md) (Phase 5 호리 놀이터에서 어휘 단원 이미지 회전 활용 예정)
