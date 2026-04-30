# 탱고북 저작도구 - Claude Code 프로젝트 가이드

## 프로젝트 개요
AI 기반 유아동 동화책 + 파닉스 저작도구. Gemini AI로 스토리/이미지/TTS를 자동 생성.

## 기술 스택
- **Monorepo**: pnpm workspaces (`packages/client`, `packages/server`, `packages/shared`, `packages/remotion`)
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3
- **Backend**: Express v5 + TypeScript + tsx (dev)
- **AI**: Google Gemini 2.5 Flash (텍스트), Gemini 3 Pro Image (이미지)
- **Storage**: Cloudflare R2 (S3 호환)
- **Audio**: ffmpeg-static (파닉스 음원 연결)
- **Video**: Remotion v4 (오디오북 영상 생성 — Player 프리뷰 + 서버 렌더링)

## 폴더 구조 요약
```
packages/
  shared/src/
    types/storybook.ts    # 핵심 도메인 타입 (Storybook, Character, Page 등)
    types/api.ts          # ApiResponse<T> 공통 응답 타입
    constants/index.ts    # 공유 상수 (ART_STYLES, TARGET_AGES, ASPECT_RATIOS 등)

  server/src/
    config/index.ts       # 환경변수 (requireEnv로 필수값 검증)
    routes/               # Express 라우터 (URL 매핑만)
    controllers/          # req 파싱 → 서비스 호출 → res 응답
    services/             # 비즈니스 로직 (핵심 레이어)
    repositories/r2.repository.ts  # R2 CRUD
    providers/            # 외부 API 클라이언트 (Gemini, R2)
    middleware/error.middleware.ts # 중앙 에러 핸들러

  remotion/src/
    types.ts              # AudiobookRenderProps (Storybook에 독립적)
    compositions/AudiobookComposition.tsx  # 메인 컴포지션
    components/           # KenBurnsSlide, TypewriterSubtitle, SparkleParticles 등
    utils/                # ken-burns.ts, duration.ts
    Root.tsx              # Composition 등록 + calculateMetadata
    entry.ts              # registerRoot() — 서버 bundle() 진입점

  client/src/
    lib/axios.ts          # apiGet/apiPost/apiDelete 헬퍼
    lib/query-client.ts   # TanStack Query 설정
    store/editor.store.ts # Zustand (UI 상태만)
    router/index.tsx      # React Router 라우트 정의
    pages/                # 라우트 페이지 (thin wrapper)
    features/             # 기능별 모듈 (아래 참조)
```

## 백엔드 레이어 규칙
```
Request → routes → controllers → services → repositories/providers
```
- **routes**: router.get/post/delete만. 로직 없음.
- **controllers**: req.body/params 파싱, try/catch, next(err) 패턴
- **services**: 비즈니스 로직. AppError 던지기.
- **repositories**: R2 데이터 접근만.
- **providers**: Gemini/R2 SDK 클라이언트. 싱글톤.

### API 응답 형식 (항상 통일)
```typescript
// 성공
res.json({ success: true, data: result });

// 실패 (errorMiddleware가 처리)
throw new AppError(404, '동화책을 찾을 수 없습니다.');
```

## 프론트엔드 상태관리 규칙
- **TanStack Query**: 서버 데이터 (storybooks 목록, 단일 storybook)
- **Zustand** (`store/editor.store.ts`): UI 상태만 (selectedStorybookId, activeTab, 모달)
- **절대 금지**: Zustand에 서버 데이터 저장 (중복/불일치 발생)

### API 호출 패턴
```typescript
// features/storybook/api/storybook.api.ts
import { apiGet, apiPost } from '@/lib/axios';

export const storybookApi = {
  list: () => apiGet<StorybookSummary[]>('/storybooks'),
  getById: (id: string) => apiGet<Storybook>(`/storybooks/${id}`),
};

// features/storybook/hooks/useStorybooks.ts
export function useStorybooks() {
  return useQuery({ queryKey: ['storybooks'], queryFn: storybookApi.list });
}
```

## Feature 모듈 구조 (각 기능별로 동일)
```
features/{feature}/
  components/   # UI 컴포넌트
  hooks/        # useQuery/useMutation 래퍼 + 공통 액션 훅
  api/          # axios 호출 함수
  index.ts      # public exports
```

## 파닉스 Feature 구조
```
features/phonics/
  api/phonics.api.ts                    # 이미지/TTS/라이브러리 연결 API
  hooks/usePhonicsCardActions.ts        # 공통 액션 훅 (이미지/TTS 생성/업로드/배치)
  components/
    AlphabetCardTab.tsx                 # Level 1 전용 (알파벳 음가)
    LearningCardTab.tsx                 # Level 2~5 (블렌딩/단어가족)
    LearningCardPreviewModal.tsx        # 학습카드 미리보기 (핫스팟+TTS+글자쓰기)
    HotspotEditorModal.tsx              # 핫스팟 편집 모달
    LetterWritingCanvas.tsx             # 글자 쓰기 연습 캔버스
    ChantTab.tsx                        # 챈트 에디터
    TtsRow.tsx                          # 공통: TTS 행 (편집 가능 텍스트)
    ImageDescriptionInput.tsx           # 공통: 이미지 설명 편집
    ImageHistory.tsx                    # 공통: 히스토리 썸네일
```

### 파닉스 TTS 방식
- Gemini TTS 대신 **파닉스 음원 라이브러리**(R2)에서 개별 MP3를 ffmpeg로 연결(concat)
- `phonicsApi.concatPhonicsAudio()` → `POST /api/phonics-library/concat`
- TtsRow의 `editableText` prop으로 TTS 텍스트 편집 가능
- 공백 규칙: 1개 = 0.3초 무음, 2개 = 0.6초 무음

## 게임 Feature 구조 (2026-04-22 뷰어 디자인 시스템 전이)
```
features/games/
  registry/                          # 게임 등록 시스템
    game-registry.ts                 # 레지스트리 코어 (registerGame, getGameEntry 등)
    index.ts                         # side-effect imports + re-exports
    games/*.register.ts              # 게임별 등록 (1게임 = 1파일)
  components/
    players/*.tsx                    # 게임 플레이어 UI (13개)
    config/*.tsx                     # 게임 설정 패널 (13개)
    FeedbackOverlay.tsx              # 공통 정답/오답 피드백 (호리 + confetti + shake)
    GameResultScreen.tsx             # 공통 결과 화면 (celebrating 호리 + confetti + 별점 + count-up)
    GameProgressBar.tsx              # 공통 진행바 (dot 스타일 + 점수 뱃지)
    config/ConfigControls.tsx        # 공통 설정 컨트롤 (NumberSelector, ConfigCheckbox)
  hooks/
    useGameSound.ts                  # 신규: 사운드 재생 + mute 퍼시스턴스 + systemSounds 오버라이드
    useGameAudio.ts                  # 내부적으로 useGameSound 호출 (외부 시그니처 유지)
    useBlockDrag.ts                  # 블록 게임 공통 드래그/터치 핸들링 (Korean/English 공용)
    usePhonicsMap.ts                 # 파닉스 음원 라이브러리 sound→URL 맵 로딩
    useSpeechRecognizer.ts        # 음성 인식 (Web Speech + Whisper fallback, 말하기 게임)
    useSpeakingProgress.ts        # 발화 진척 localStorage 관리
  utils/
    shuffle.ts                       # Fisher-Yates 셔플

public/sounds/game/
  correct.mp3    # 합성 CC0 — C5→E5→G5 상승 차임 (~0.48s)
  incorrect.mp3  # 합성 CC0 — G4→D4 부드러운 하강 (~0.36s)
  clear.mp3     # 합성 CC0 — C 메이저 아르페지오 + 스파클 (~0.92s)
scripts/synthesize-game-sfx.mjs   # 사운드 재생성 스크립트 (ffmpeg-static + 사인파 합성)
```

### 게임 디자인 토큰 (Phase A-C 완료)
- 색: `coral/peach/ink` + semantic `success/danger/warn/fun`. violet/sky/emerald 전량 제거.
- 오답 시: `border-danger` / `animate-shake` / `bg-danger/10` 패턴
- 정답 시: `ring-success` / `bg-success/10` + `FeedbackOverlay kind="correct"`
- `systemSounds` 우선순위: storybook.systemSounds > 기본 `/sounds/game/*.mp3`
- `Storybook.systemSounds`: `{ correctUrl?, incorrectUrl?, clearUrl? }` (clearUrl은 Phase A에서 추가)

### GamesTab 기능
- **개별 생성**: 모달에서 게임 타입 선택 → 설정 → 생성
- **일괄 생성**: "모든 게임 만들기" 버튼 → 미생성 게임만 기본 설정으로 순차 생성
- **gamesApi.generate()** 직접 호출 (일괄 생성 시 useMutation 미사용)

### TOP 5 게임 시각 연출 (Phase B)
- **VocabularyMatching**: 3D 카드 플립(framer-motion spring 260/20) + 매치 시 scale pop + fade out
- **WordQuiz**: 2×2 큰 카드 + 정답 success ring / 오답 danger ring + animate-shake + slide 전환
- **English/KoreanBlock**: gradient 배경 + 블록 active lift(scale 1.08 + rotate 2°) + drop zone hover pulse + 완성 단어 타이핑
- **WordListening**: ring-success glow + ✓ 배지, 오답 시 3초 auto-hide "다시 들어볼까?" 배너

### 새 게임 추가 시 시각 체크리스트 (Phase A/B/C 이후)
- `FeedbackOverlay kind="correct"` / 필요 시 `kind="incorrect"` 호출부 마련
- `GameProgressBar` + `GameResultScreen` 공용 컴포넌트 사용 (`score`/`total` prop)
- `useGameAudio` 외부 시그니처 유지 (`playAudio`, `playFeedbackSound`) — 내부는 `useGameSound`
- 색 클래스는 `coral-{100/200/400/500/600}`, `ink-{100/300/500/700/900}`, semantic만 사용. shade 없는 `coral-50/900`, `ink-900 dark mode` 금지
- 다크 모드 텍스트: `dark:text-peach-200` 패턴 준수
- `accentColor` prop 사용 금지 (제거됨)

### 게임 목록 — 2026-04-23 정리 (4~5세 유아용 단순화)

**현재 노출 게임 (한/영 각 5종 = 10 타입)**
| ID | 이름 | 지원 타입 | language |
|----|------|-----------|---|
| korean-block | 한글 블록 맞추기 | storybook | ko |
| english-block | 영어 블록 맞추기 | storybook | en |
| korean-word-writing | 한글 낱말쓰기 | storybook | ko |
| english-word-writing | 영어 낱말쓰기 | storybook | en |
| connect-the-dots | 단어 그림 그리기 | storybook | (중립) |
| korean-line-matching | 그림-단어 선긋기 | storybook | ko |
| english-line-matching | 그림-단어 선긋기 (영어) | storybook | en |
| korean-story-image | 이야기 듣고 그림 찾기 | storybook | ko |
| english-story-image | 이야기 듣고 그림 찾기 (영어) | storybook | en |

**hidden 타입** (코드·데이터 유지, 게임 리스트에서 숨김)
- `korean-speaking`, `english-speaking` — 완성도(Azure 도입) 개선 후 재공개
- `word-writing` — korean/english-word-writing으로 대체. 레거시 인스턴스만 지원

**제거 대상** (2026-04-23 30권에서 인스턴스 일괄 삭제, 클라 코드 정리는 후속):
- `vocabulary-matching` · `word-quiz` · `picture-sequence` · `odd-one-out` · `storybook-quiz`
- 파닉스 4종: `word-image-matching` · `blending-listening` · `letter-sound` · `word-listening`

> 정리 철학: "아예 단어 모르는 4~5세 아이 기준. 중복·복잡 게임은 제거, 단순 매칭·쓰기·그리기·듣기 하나씩".

### 새 게임 추가 방법
1. `shared/types/storybook.ts`에 Config/Data 타입 추가, GameTypeId·GameConfig·GameData 유니온 확장
2. `server/services/game.service.ts`에 `generate{GameName}()` 함수 + switch case 추가 (블록류는 `generateBlockGame` 헬퍼 활용)
3. `client/features/games/components/players/{GameName}Player.tsx` 생성
4. `client/features/games/components/config/{GameName}ConfigPanel.tsx` 생성
5. `client/features/games/registry/games/{game-id}.register.ts` 생성 (registerGame 호출)
6. `client/features/games/registry/index.ts`에 side-effect import 1줄 추가

### 한글/영어 파닉스 데이터 차이
- **한글**: `blend`=음절(가, 나), `illustrationUrl`=삽화, `phonicsConfig.language === 'korean'`
- **영어**: `vowel`=모음 글자(a, e), `exampleWordImageUrl`=단어 이미지, `phonicsConfig.language === 'english'`
- 감지: `isKoreanPhonics(storybook)` 사용 (`server/utils/phonics-data-helpers.ts`)
- 데이터 수집: `collectPhonicsWordPool()` (파닉스용), `collectStorybookImagePool()` (동화책용)

### 단어/이미지 데이터 구조 매핑 (타입별)
동화책·파닉스는 "핵심단어"라는 같은 개념을 다른 필드명으로 저장. R2 호환성 때문에 리팩토링하지 않음.

| 데이터 | 동화책 | 파닉스 | 비고 |
|--------|:------:|:------:|------|
| **핵심단어 + 학습어휘 (통합)** | `key_objects[]` (KeyObject — 다국어 `name/korean/nameTranslations` + `definition`/`example` 통합) | `flashcards[]` (PhonicsFlashcard) | **2026-04-30 educational_content.vocabulary[] 통합 마이그 완료 (358권)** |
| **핵심단어 이미지** | `keyObjectImages[]` (별도 배열) | `flashcards[].imageUrl` (객체 내부) | 저장 방식 상이 |
| ~~`educational_content.vocabulary[]`~~ | **deprecated 2026-04-30** — read 호환만 유지 (legacy 데이터 보존) | 동일 | 신규 코드는 `key_objects[].definition/example` 우선 |
| **어휘 이미지** | `vocabularyImages[]` (별도 배열) | N/A | 동화책 전용 |
| **블렌딩/단어패밀리** | N/A | `phonicsLesson.blending[]` / `.wordFamilies[]` | 파닉스 전용 |

**통합 지점:**
- `VocabularyDbService` — 모든 소스를 `VocabEntry { word, korean, sources[] }`로 통합
- `collectStorybookImagePool()` → `{ word, korean, imageUrl, ttsUrl? }` (동화책용 게임)
- `collectPhonicsWordPool()` → `{ word, imageUrl, ttsUrl }` (파닉스용 게임)

**알려진 코드 중복 (허용 수준):**
- flashcard 추출 로직: `phonics-data-helpers.ts` + `game.service.ts` 내 3곳
- 한글/영어 단어 선택: `isKorean ? localWord : word` 패턴 4곳
- 향후 중복이 심해지면 공통 `collectUnifiedWordPool()` 함수 도입 검토

**Phase 1+2 완료 (educational_content.vocabulary → key_objects 통합, 2026-04-30):**
- AI 생성 prompt (`storybook.service.ts`) — `educational_content.vocabulary` 제거, `key_objects` 에 `definition/example` 직접 생성
- 통합 read 헬퍼 `getEffectiveVocabulary(sb)` (`packages/shared/src/utils/effective-vocabulary.ts`):
  - `key_objects` 우선 + 레거시 `vocabulary` 합집합 (lc 중복 제거)
  - `VocabularyItem[]` 반환 — 호출부 100% 호환
- 9개 callsite 전환: server `game.service.ts`/`marketing-helpers.ts`, client `Speaking/WordWritingConfigPanel`/`ConnectTheDotsPlayer`/`MetaView`
- 이미지 fallback: `vocabularyImages` 없으면 `keyObjectImages` (objectName === word/korean) 자동 매칭
- 마이그 스크립트 `scripts/migrate-vocabulary-to-keyobjects.mjs` 보관 (idempotent, 재실행 가능). 358권 마이그 완료 (1,115 merge + 1,329 new)

**snake_case 혼용 (레거시, 변경 불가):**
- `key_objects`, `educational_content`, `scene_description` = snake_case (R2 기존 데이터)
- `keyObjectImages`, `vocabularyImages`, `illustrationUrl` = camelCase (나중에 추가된 필드)
- 새 필드는 항상 camelCase로 추가

## 마케팅 Feature 구조 (블로그 + 카드뉴스)
```
features/blog/
  api/blog.api.ts                     # generate, generateConfig, regenerateSection, searchKeywords
  utils/seo-score.ts                  # computeSeoScore() — C-Rank + D.I.A.+ (100점)
  components/
    BlogTab.tsx                       # 2단계 플로우 (설정 폼 → 생성)
    BlogConfigForm.tsx                # 제목/주제/키워드/모델 설정
    BlogPostCard.tsx                  # 블로그 글 편집 (드래그 정렬, SEO 뱃지)
    BlogSectionEditor.tsx             # 리치텍스트 에디터 + AI 글쓰기 + 이미지
    BlogPreviewModal.tsx              # HTML/텍스트 복사 미리보기
    SeoScoreDisplay.tsx               # SeoScoreBadge + SeoScorePanel 컴포넌트
    KeywordSection.tsx                # 키워드 칩 + 네이버 검색 테이블
  index.ts

features/card-news/
  api/card-news.api.ts                # generate (소스: storybook | blog)
  components/
    CardNewsTab.tsx                   # 2단계 플로우 (설정 폼 → 생성)
    CardNewsConfigForm.tsx            # 소스 선택 + 테마 + 슬라이드 수
    CardNewsProjectCard.tsx           # 프로젝트 편집 (테마, 슬라이드 그리드)
    CardNewsSlideEditor.tsx           # 슬라이드 편집 (이미지 + 텍스트 + 색상)
    CardNewsPreviewModal.tsx          # Canvas 기반 PNG 내보내기 + 미리보기
  index.ts
```

### 마케팅 서버 구조
```
server/src/
  services/marketing.service.ts       # 블로그/카드뉴스 생성 비즈니스 로직
  utils/marketing-helpers.ts          # 공통 헬퍼 (컨텍스트 추출, 이미지 풀, 키워드 매핑)
  providers/naver.provider.ts         # 네이버 검색광고 API (키워드 검색량 조회)
  controllers/marketing.controller.ts # 라우트 핸들러
  routes/marketing.routes.ts          # POST /blog/generate, /card-news/generate 등
```

### 마케팅 2단계 생성 플로우
1. 설정 폼 표시 (`showConfigForm` state)
2. 사용자가 설정 입력 → 생성 버튼 클릭
3. API 호출 → 결과를 storybook에 push → 저장
4. 설정 폼 닫고 프로젝트 카드 표시

### 리치텍스트 에디터 (RichTextEditor)
- `contentEditable` + `document.execCommand()` 기반 WYSIWYG
- 툴바: 단락(H2/H3/H4), 폰트 크기, B/I/U/S, 목록, 텍스트 색상, 형광펜, 서식 제거
- `packages/client/src/components/RichTextEditor.tsx`
- 블로그 섹션 편집에서 사용. HTML 문자열 입출력.

### 공유 클라이언트 컴포넌트/유틸리티
- `components/DotEditorCanvas.tsx` — 점잇기 편집 캔버스 (DotEditorModal/KeyObjectDotEditorModal 공용)
- `lib/build-available-images.ts` — 동화책 이미지 풀 구성 (표지/삽화/캐릭터/핵심단어)
- `lib/generate-id.ts` — 랜덤 ID 생성 (`generateId(prefix?)`)

## 서버 유틸리티
```
server/src/utils/
  gemini-retry.ts           # withGeminiRetry() 재시도 래퍼
  shuffle.ts                # Fisher-Yates 셔플 (game.service.ts에서 사용)
  phonics-data-helpers.ts   # isKoreanPhonics(), collectPhonicsWordPool(), collectStorybookImagePool()
  marketing-helpers.ts      # extractContext(), buildImagePool(), mapNaverItemToResult() 등
```

## 새 Feature 추가 방법
1. `features/{name}/api/{name}.api.ts` - API 함수 정의
2. `features/{name}/hooks/use{Name}.ts` - TanStack Query 훅
3. `features/{name}/components/` - UI 컴포넌트
4. `features/{name}/index.ts` - exports

## 주요 타입 위치
- `Storybook`, `Character`, `Page`, `KeyObject`, `BlendingExercise`, `ParentGuide`, `ReadingLevel` → `@tangobook/shared`
- `ApiResponse<T>` → `@tangobook/shared`
- `AppError` → `packages/server/src/middleware/error.middleware.ts`

## 자주 쓰는 커맨드
```bash
# 개발 서버 (client + server 동시)
pnpm dev

# 타입체크 (모든 패키지)
pnpm typecheck

# 빌드
pnpm build

# 린트
pnpm lint

# 특정 패키지만
pnpm --filter server dev
pnpm --filter client dev
pnpm --filter shared build
```

## 환경변수
`packages/server/.env.example` 참고. `.env` 파일을 `packages/server/` 안에 생성.
- 선택 변수: `OPENAI_API_KEY` — 말하기 게임의 Whisper fallback용. 없어도 Web Speech API만으로 동작 (degraded mode)
- 선택 변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — 로그인/계정 기능 활성화용 (client env). 없으면 게스트 모드만 동작 (graceful degradation). 셋업: `scripts/supabase-setup.sql`을 Supabase SQL Editor에 실행 후 Project Settings > API에서 URL·anon key 복사

## Gemini 모델 설정 (2026-04-24 변경)
- **Default text model**: `gemini-3.1-pro-preview`. 클라 기본: `DEFAULT_TEXT_MODEL` (shared/constants), 서버 기본: `config.gemini.textModel` (`GEMINI_TEXT_MODEL` env로 override)
- **자동 폴백**: `generateTextWithGemini`가 overload(503/UNAVAILABLE/429/overloaded/RESOURCE_EXHAUSTED)로 실패하면 `gemini-2.5-flash-lite`로 자동 재시도. 이미 lite면 폴백 없음.
- retry 래퍼 `withGeminiRetry`: 기본 5회, exp backoff + jitter, 각 시도 120초 타임아웃.
- `gemini-2.5-flash`는 2026-04-24 시점 상시 과부하 — seed 스크립트·수동 분석 등 배치 작업은 `--model gemini-2.5-flash-lite` 권장

## 기존 R2 데이터 호환성
- 기존 211권의 동화책이 R2에 저장되어 있음
- `shared/types/storybook.ts`의 `Storybook` 인터페이스가 기존 JSON 구조와 호환
- 새 필드 추가 시 `optional`로 선언하여 하위 호환성 유지

## 자산 압축 (TTS/이미지 저장 포맷)
- **TTS**: Gemini PCM → `pcmToMp3()` → MP3 128kbps mono 24kHz (`audio/mpeg`)
- **이미지**: Gemini PNG → `imageToWebp()` → WebP quality 85 (`image/webp`)
- `packages/server/src/utils/transcode.ts` — `pcmToMp3`, `wavToMp3`, `imageToWebp`
- `R2Repository.uploadImage(base64, key)` — 내부에서 WebP 변환 + `.webp` 확장자 자동 치환
- 마이그레이션 (1회성, 완료됨): `scripts/migrate-assets.ts` + `cleanup-old-assets.ts` + `restore-from-manifest.ts`
  - `_migrations/` R2 prefix에 매니페스트 보존 (롤백 가능)
  - `_backup/` R2 prefix에 원본 JSON 백업

## 코딩 컨벤션
- 파일명: PascalCase (컴포넌트), camelCase (훅/유틸/API)
- 컴포넌트: named export (pages는 default export)
- 에러: AppError(status, message) 사용. console.error 대신 throw
- 주석: 자명한 코드에는 주석 불필요. 복잡한 로직에만 추가
- import: `@tangobook/shared`는 shared 타입, `@/`는 client 내부

## 세계명작 커리큘럼 (2026-04-24)
- **49권 × 레벨 variation = 114 storybook** (no.1~50, 43 중복 제외). 기존 30권(L3 완성) + 신규 19권(bid `1773xxxxxxxxx`)
- 레벨 분포 (2026-04-30 4단계→3단계 통합 후): L1 37 · L2 236 · L3 47 (기존 L3→L2, L4→L3 매핑). Variation ID 규칙: `${bid}__${level}` (launch 레벨은 bid 그대로). 기존 `__L4` suffix doc은 호환을 위해 ID 보존, readingLevel 필드만 update.
- 각 책 base에 `parentGuide`(overview/lessons/readingTips) 저장 → `BookDetailPage`에서 접는 부모 가이드 섹션 노출
- 저술 스크립트: `scripts/author-classics-*.mjs`, `scripts/add-parent-guides.mjs`. **모두 Claude 직접 저술** (Gemini 0%)
- 원전: Grimm · Andersen · Perrault · Aesop · Jacobs · Wilde · Tolstoy · Collodi · Carroll · Baum · Swift · Kipling · Tchaikovsky · Hoffmann · Saint-Exupéry · Burnett · Ouida · Montgomery
- 정서 완화 결정 (원전과 다른 부분): 성냥팔이/빨간구두/인어공주/백조의호수/플란다스 — 유아 정서 보호
- 커리큘럼 마스터: `packages/client/public/curriculum-master.html` + 사본 `docs/books/curriculum-master.html`
- 상세: `memory/classics-curriculum.md`

## Book Variants V2 (2026-04-25→04-26, 8 탭 + cutover 완료)
동화책의 **(level × language × style) 3축 variation** 시스템. R2 prefix 트리(`books/{bid}/...`)로 manifest + 슬라이스 + 자산 분할 저장.

### 상태 — 8 탭 모두 동작
| 탭 | CRUD | 추가 기능 | Phase |
|----|------|-----------|-------|
| 📋 메타 | ✓ | — | 3b-3 |
| 📝 텍스트 | ✓ | — | 3b-4 |
| 🎨 스타일 | ✓ | 4종 이미지 업로드 | 3b-5 |
| 🖼️ 페이지 | ✓ | — | 3b-6 |
| 🎧 오디오북 | ✓ | **실 Remotion 렌더 + 진행률** | 3b-7a/b |
| 🎬 동영상 | ✓ | **AI 분석 + 클립 생성 + 씬 편집 + 최종 렌더 + YouTube 업로드/연결 + AI 메타 + 자막 SRT/다국어/YT 업로드 (full pipeline)** | 3b-7c-i~viii |
| 📰 마케팅 | ✓ | (블로그/카드뉴스 stub) | 3b-7d-i |
| 🎮 게임 | ✓ | **line-matching generate** | 3b-7e-i/ii |

### cutover 완료 (Phase 3b-8)
- `/` → `/library` 자동 redirect (AppLayout 삭제)
- `/editor/:bid` → EditorPageV2 정식 (`/editor-v2/:bid`은 호환 alias)
- BookDetailPage v2 manifest 기반 재작성 (✏️ 편집 버튼 추가)
- **Viewer 메인 읽기 모드 v2** (useRuntimeViewer 어댑터, level=launchLevel 우선, 페이지/표지/제목/parentGuide v2 R2 prefix에서 직접)
- **Viewer RewardScreen v2** (props 기반: videoId/directVideoUrl/hasGames/title, v2 audiobookRenders/longformList/gamesList 우선 + v1 fallback)
- **Viewer GameListViewer v2** (v2 게임 있으면 우선 표시 + 헤더 "· v2" 마커 + L1~L3 뱃지, 클릭 시 useRuntimeGame으로 머지된 imageUrl inject. line-matching 우선 지원)
- 파닉스 결정 (2026-04-26): A안 — v1 유지 (데이터 모델 다름, 양 적음, 실제 데이터는 v1 storybook에)

### 인프라
- **R2 prefix 트리**: `books/{bid}/{manifest, texts/{L}.{lang}.json, audio/{L}.{lang}/page-{N}.mp3, styles/{style}/..., games, audiobook/{project.json, renders/{L}.{lang}.{style}.mp4}, longform/{projectId.json, projectId/clips/, projectId/sfx/}, marketing/{blog,card-news}}` + `_index/books.json`
- **shared 타입**: `BookManifest`, `BookTextSlice`, `BookStyleSlice`, `BookGameInstance`, `AudiobookProjectV2`/`Render`, `LongformProjectV2`, `BlogPostV2`, `CardNewsProjectV2`, `BookIndex`, `CurriculumMeta`
- **서버 서비스**: `services/book-v2.service.ts` (~1100 줄, 모든 v2 비즈니스 로직)
- **서버 유틸**: `utils/book-v2-keys` · `book-v2-runtime-merge` · `book-v2-audiobook-render` · `remotion-bundle` · `subtitle-build`
- **클라이언트** `features/book-v2/`: api 50+ 함수 + 훅 8종 + 컴포넌트 11개

### 오디오북 실 렌더 (Phase 3b-7b-ii)
fire-and-forget, 1.5s 폴링. taskId = `${L}.${lang}.${style}`. 동일 variant 진행 중 거부.

### 동영상 풀 파이프라인 (Phase 3b-7c-i~viii)
1. **신규 프로젝트**: `+ 새 동영상 만들기` 모달 → variant 수동 선택 → textSlice 페이지 수만큼 빈 scene 시드
2. **🤖 AI 분석**: Gemini로 페이지별 videoPrompt + clipDuration + subtitles
3. **🎬 클립 생성**: 씬 단위 Grok image-to-video. 페이지 이미지를 first frame으로. SFX 자동 추출.
4. **✏️ 씬 편집** (SceneEditor): 트림 (trimStart/trimEnd), SFX/TTS 볼륨/오프셋, 자막 list 인라인 편집
5. **🎞️ 최종 렌더**: Python `generate_longform.py` + ffmpeg 파이프라인 (재사용 v1 provider). 진행률 폴링. R2 업로드 후 project.videoUrl 저장.
6. **📺 YouTube**: YouTubeUploadModal에서 메타 폼 → 업로드 (R2→YT) 또는 외부 영상 수동 연결.
7. **🤖 AI YT 메타**: Gemini로 title/desc/tags/categoryId 자동 생성 (메타 폼 자동 채움)
8. **📝 자막 (SRT)**: CaptionsModal에서 5개 언어 체크박스 → 🤖 SRT 생성 (base 자동, 나머지 Gemini 번역) → 📺 YouTube 업로드 (per-lang 진행률, captionsUploaded/Failed 저장)

### 게임 generate (Phase 3b-7e-ii)
현재 지원: `korean-line-matching`, `english-line-matching`. textSlice.keyObjectsText에서 후보 추출 → BookGameInstance.imageRefs로 keyObjId 보존 → 런타임에 활성 style의 keyObjectImages 머지.

### ART_STYLES 신규: `paper-craft` (47권 종이공예)

### 마이그 결과
301 base manifest, ~8,900 R2 객체. PASS 0 / WARN 301 / FAIL 0. curriculumMeta seed 55권.

### 운영
- 인덱스 갱신 `POST /api/v2/books/refresh-index`
- 마이그 `node scripts/migrate-to-variants.mjs --apply`
- 검증 `node scripts/verify-variants.mjs`

### 진입점
- `/` 또는 `/library` (학습자, isPublic만)
- `/curriculum-master` (관리자, 전체 책)
- `/editor/:bid` (저작도구 v2)
- `/library/:id` (책 상세 v2)
- `/viewer/:id?lang=...` (뷰어, 아직 v1 fetch)

### 남은 follow-up sprints
- 3b-7e-iii+ 다른 게임 타입 generate 점진 포팅 (blocks/word-writing 등 — 각 1-2시간)
- 3b-7d-ii 마케팅 generate (사용자 보류)

상세: `memory/book-variants-v2.md` · 스펙: `docs/superpowers/specs/2026-04-25-book-variants-design.md` · 플랜: `docs/superpowers/plans/2026-04-25-book-variants-plan.md`

## /editor2 단일 구조 저작도구 (2026-04-26→04-27)
v1 storybook 데이터 모델 위에 **레벨/그림체/언어 3축 variation** 기능을 얹은 새 저작도구. v2 prefix tree(별도 R2 구조)는 폐기, /editor 는 안전 백업으로 유지.

### 라우트 + 레이아웃
- `/editor` (v1 백업, 절대 안 건드림) · `/editor2(/:bid)` (v1 업그레이드 작업용)
- `AppLayoutV2` (`packages/client/src/components/AppLayoutV2.tsx`) — TopBar + v1 Sidebar + EditorPanelV2
- `EditorPanelV2` (`features/editor/components/EditorPanelV2.tsx`) — 메타 토글 + LevelEditCard stack
- `LevelEditCard` (`features/editor/components/LevelEditCard.tsx`) — 단일 펼침 accordion. 카드 1개 = 레벨 1개. 펼치면 그림체/언어 chip row + v1 EditorContent 재사용 (한 줄 헤더 + 저장 옆 🗑 삭제)
- `MetaView` (`features/editor/components/MetaView.tsx`) — 책 종합 뷰 (variant 매트릭스, parentGuide, 통계)
- `OtherStyleReference` (`features/editor/components/OtherStyleReference.tsx`) — 표지/페이지/캐릭터/핵심사물 탭에서 다른 그림체의 같은 슬롯 이미지를 참고용 썸네일로 노출 (slot=cover/character/page/keyObject)
- `VariantConfirmModals` — 추가 시 안내 모달 (레벨/언어/그림체 각각 의미 명시)

### 3축 variant 데이터 모델 (모두 v1 Storybook 에 추가, optional)
- **레벨**: sibling pattern `${baseId}__L1`/L2/L3 (별도 storybook doc). `Storybook.readingLevel`. 추가는 `POST /api/storybooks/:id/variants/:level` (server: `StorybookService.createVariant`). 기존 `__L4` suffix doc은 R2에 그대로 남아 readingLevel만 L3로 update됨 (호환 유지).
- **그림체**: `Storybook.availableStyles?: string[]` (prompt 배열) + `Storybook.styleAssets?: Record<style, StyleAssets>` (그림체별 자산 분리 보관). `switchStyleAssets(draft, newStyle)` 헬퍼 (`features/editor/lib/style-assets.ts`) 가 swap 시 현재 top-level 스냅샷 + 새 그림체 자산 복원/비우기. `StyleAssets`: coverImages·coverImage·coverPrompt·characterImages[]·pageIllustrations{pageNumber→}·keyObjectImages·vocabularyImages.
- **언어**: `Storybook.languages?: string[]`, `defaultLanguage?`, `titleTranslations?: Record<lang, string>` (책 제목), `primaryCoverByLang?: Record<lang, string>` (언어별 대표 표지), `KeyObject.nameTranslations?`, `KeyObject.ttsUrl?` + `ttsUrls?: Record<lang, string>` (한글/다국어 발음 TTS — 학습게임 음성 재생 용). 페이지 텍스트는 기존 `Page.translations[lang]` 활용.
- **언어 컨텍스트**: `EditorLangContext` (`contexts/EditorLangContext.tsx`) + `useEditorLang()` 훅 — null fallback 패턴. /editor 는 미주입(자체 fallback), /editor2 만 `EditorLangProvider` 로 감쌈. 영향 받는 탭(PagesTab/CoverTab/CharacterTab/KeyObjectTab/AudiobookTab/LongformVideoTab/GamesTab) 이 외부 활성 언어를 자동 따라감.

### EditorContent 재사용 (v1 무변경 + 옵션 prop 추가)
- `EditorContent` 와 `EditorHeader` 에 모두 optional props 추가 (default = v1 동작 유지):
  - `headerExtraActions?: ReactNode` — 저장 버튼 옆 (LevelEditCard 가 🗑 삭제 버튼 주입)
  - `compactHeader?: boolean` — 한 줄 헤더 (제목 + meta + 버튼 모두 같은 행)
  - `hiddenTabIds?: string[]` — 탭 가림 (`['quiz','blog','card-news']` 로 마케팅 관련 숨김. 마케팅은 별도 도구로 분리 예정)

### 사이드바 variant 그룹핑 (`/editor2` 한정)
- `Sidebar.tsx` 에서 `useLocation` 으로 `/editor2` 감지 → `groupVariants` true면 `__L[1-4]$` suffix 책 숨김 (base 만 노출). `+N` 보라색 배지로 variant 갯수 표시. 활성 storybookId 가 sibling 이어도 base 카드 강조.

### 추가/삭제 안내 모달 (UX)
- `+ 레벨 추가` → 무거움 안내 (페이지/일러스트/TTS 새로 작성 필요) + base에서 텍스트만 복사
- `+ 언어 추가` → 가벼움 안내 (이미지 공유, 텍스트/TTS만 새로). 페이지/표지/핵심단어의 AI 일괄 번역 버튼 활용
- `+ 그림체 추가` → availableStyles 에 push + switchStyleAssets 으로 즉시 활성. 텍스트 공유, 일러스트만 새로 (캐릭터/표지/페이지 탭에서 재생성)

### KeyObject TTS (학습게임 연동)
- `KeyObjectTab` 에 🎙 TTS 버튼 + 일괄 생성 (translate 옆). 활성 언어 따라 `obj.ttsUrl`(ko) 또는 `obj.ttsUrls[lang]` 에 저장
- 생성 후 자동 재생, 재생성 가능
- `collectStorybookImagePool` (server `utils/phonics-data-helpers.ts`) 의 keyObject pool 항목에 ttsUrl 포함 → 학습게임 (VocabularyMatching, StoryImage 등) 에서 단어 음성 재생

### 자료실 (TopBar 📁 자료실 dropdown — 2026-04-30)
TopBar 우측에 `ResourcesDropdown` (`components/TopBar.tsx`) — 정적 HTML 페이지 3개 묶음. 모두 `packages/client/public/` + `docs/books/` 양쪽 사본:

1. **📋 사업 전략서** — `/strategy.html` v2 (~350KB, 18 섹션, 2026-05-01 디테일 작업)
2. **📚 커리큘럼 마스터** — `/curriculum-master.html` (책 마스터플랜·DB 연동)
3. **🔤 어휘 마스터** — `/vocabulary-master.html` (Cambridge Starters 매칭)

#### 사업 전략서 v2 (`/strategy.html`, 2026-05-01)
- 18 섹션: Hero · Vision (3년 학습 종착점 "탱고북 졸업장") · 시장분석(TAM $8.7B/SAM $1.2B/SOM $30M) · 자산 4 카테고리 · 차별점 9개 · 콘텐츠 아키텍처 · 시스템 아키텍처 · 학습 루프 · UX · 게이미피케이션 · BM · 마케팅 · 경쟁 · SWOT · 로드맵 · KPI · 재무 · 클로징
- **차별점 9개**: 그림체 10종 + 3단계 글밥 + 한·영 매칭 통합 학습 + 마스터리 리포트 + 포인트 게이미피케이션 + 유튜브 깔때기 + 카드 콜렉션 270장 + 도감 (학습 인증 후 활성)
- **인포그래픽** (SVG/CSS): 3축 통합 Venn(동화·파닉스·어휘) · 어휘 3 카테고리 세분 Venn(800/500/1500 ∩ 300 3축) · 마스터 어휘 학습 축 + 1,500단어 5 카테고리 (일상 340·자연 140·추상 145·행동 450·관계 425) · 망각 곡선 + Review Points · 친숙도 맵 1,500셀 (JS auto-fill) · 호리 놀이터 7 게임 mockup · Daily Word 호리 코스튬 + 연속 출석 사다리(D1~D365)
- **BM**: 무료/유료/포인트 **3축 분배 룰** (포인트는 디지털만, 오프라인 굿즈 X, 유료 잠금해제 X, 광고 X) · 프리뷰 패스 (매주 1매, 1권 24h 풀체험) · 결제 trigger 5종 · 4 플랜 (Free/Plus 9,900/Family 14,900/School 99k) · 인건비 10% / 영업이익률 45%+
- **시각**: 24개월 마일스톤 timeline · 경쟁사 2×2 매트릭스 (Khan Kids/Pinkfong/Epic/탱고북) · SWOT 4분면 · KPI 4 게이지 도넛 · 수익원 도넛(B2C 70/B2B 20/로컬팩 5/IP 5) · 게임 4 mockup + 7 어휘 게임 mockup
- **Gemini 생성 sample 28장**: `packages/client/public/strategy-samples/` — 그림체 10 (수채화/2D/클래식/페이퍼컷/3D 토이/민화/플랫/파스텔/세미리얼/판타지) · 카드 콜렉션 8 (명작/공룡/동물/식물/바다/우주/생활/전래) · 동화 표지 8 (잭과콩나무/빨간모자/백설공주/신데렐라/개미와베짱이/호두까기/토끼와거북이/미운오리) · 도감 2 (펼친책/glow page)
- **생성 스크립트**: `packages/server/scripts/generate-strategy-samples.mjs --only [style|card|cover|encyclopedia]` (Gemini 3.1 Flash Image, dotenv from server/.env)
- **60+ 용어 호버 툴팁**: TAM/SAM/CAC/LTV/ROAS/PMF/Phonics/CVC/Sight Words 등 자동 마크업 (script 안 dict)
- 상세: [memory/strategy-document-v2.md]

#### 커리큘럼 마스터 (`/curriculum-master.html`)
- 마스터 정적 리스트 (CLASSIC/NATURE/FOLKTALE/LIFE_RAW, 50권+) + DB 동기화
- 페이지 로드 시 `/api/storybooks` fetch → bid 매칭 + title 매칭 + sibling variant 검사
- `Storybook.koCompletion` 필드로 `st` 필드 자동 갱신 → `rerenderAll`. 완성된 책 자동 ✅
- **DB-only 자동 등록** (2026-04-30): 마스터에 없는 DB 책을 `folder` 키워드(자연관찰/공룡/우리몸/지구/우주/명작/전래/생활)로 분류해 자동 노출, `🆕 DB` 뱃지
- **bid 자동 보충**: 마스터 책에 bid 누락 시 title 매칭으로 자동 채움 → status sync 정상 동작
- **모달 그림체 갤러리**: `availableStyles` + `styleAssets[style].coverImage` 썸네일 row, 활성 그림체 ⭐, 클릭 시 큰 이미지, "✏️ 편집기 열기" 직링크
- **자동 refresh**: `visibilitychange` 시 자동 refetch + 우상단 🔄 새로고침 버튼

#### 어휘 마스터 (`/vocabulary-master.html`, 2026-04-30 신규)
- Cambridge Pre A1 Starters ~381 단어 (4-7세 영어 입문 글로벌 표준, CEFR Pre-A1 ~ A1)
- 토픽 16개 (Animals/Body/Food/Home/Verbs/Adjectives 등 — **기능어 제외**: Pronouns/Prepositions/Conjunctions/Question Words 는 학습카드 부적합)
- 4 탭 뷰 (`activeTab` 상태):
  - **⭐ 마스터** — Cambridge Starters 381단어 기준 (default)
  - **📚 동화책 어휘** — vocabulary-db 의 storybook source 단어 ~801개, ⭐ 마스터 셋 156개 겹침
  - **🔤 파닉스 어휘** — phonics source 단어 ~515개, ⭐ 마스터 76개 겹침
  - **🌐 전체** — 마스터+동화책+파닉스 합집합 1,378개. 토픽 매칭 안 되는 단어는 "📦 기타" 카드로 모임
- `/api/vocabulary-db` (1,198 entries) + `/api/storybooks` 매칭 자동
- 4 상태 표시: 📚🔤 동화책+파닉스 / 📚 동화책만 / 🔤 파닉스만 / ⚠️ 미커버 + 필터 ⭐마스터 셋 / ⭐외
- 비마스터 단어 분류: `WORD_TO_TOPIC` lookup(마스터 토픽 매칭) → 안 되면 "📦 기타"
- 토픽별 진척률(%) + 색상 코딩 (80%↑ 초록 / 50%↑ 황색 / 미만 적색)
- chip ⭐ 마스터 / 📚N 동화책 N권 / 🔤N 파닉스 N권 표시. hover → 노출 책 목록 tooltip
- 검색 + 상태 필터 + visibilitychange 자동 refresh
- 활용: 마스터 탭 미커버 = 다음 책 기획 우선순위 / 동화책·파닉스 탭 비마스터 = 마스터에 추가 검토 가능 풀

### 진입점 / 사용 책 예시
- `/editor2/1772510956605` (잭과 콩나무 L3) — paper-craft + pixar-3d 두 그림체, ko + en 두 언어 모두 자산 보유
- `/viewer/1772510956605?lang=ko|en` — 활성 그림체 자산을 사용하여 viewer 가 그대로 작동 (storybook.artStyle 기준 top-level 자산)

### 알려진 follow-up
- 메타뷰 인라인 편집 (parentGuide / 책 메타 변경 + 모든 variant 동기화)
- LongformVideoTab `+ {lang} 버전 만들기` 동작 (외부 언어 따라 자동 ko/en 자식 version 생성, 자막/TTS 비움) — 완료
- styleAssets 스토리지 비효율 (한 storybook doc 에 여러 그림체 자산 모두 포함 → 큰 책은 doc 비대화). 추후 별도 R2 prefix 로 분리 검토

상세: `memory/editor2-variant-system.md`

## Hori 아케이드 게임 (2026-04-24)
학습 게임(`features/games/`)과 별개의 **아케이드 게임 허브** — Phaser 4 기반, Hori 마스코트 스프라이트 활용.

- **6 게임**: hori-run (무한 러너) · hori-catch (떨어지는 아이템 받기) · hori-jump (점프 플랫포머) · hori-whack (두더지잡기 3×3) · hori-memory (4×3 카드 매칭) · hori-simon (사이먼 세즈 C4/E4/G4/C5 4패드)
- **폴더 구조**: `packages/client/src/features/arcade-games/{game-id}/` — 각 게임 하위에 `components/<Name>Game.tsx` (React-Phaser 래퍼) · `scenes/{Preload,Game}Scene.ts` · `config/*.ts` (물리값·스프라이트키·게임룰)
- **라우트**: `/games` (GamesHubPage) + `/games/hori-{run,catch,whack,memory,simon,jump}` (router/index.tsx). 각각 ErrorBoundary로 감쌈
- **라이브러리 진입점**: LibraryPage의 `AuthCornerBar`에 "🎮 놀이터" 버튼 → `/games`
- **에셋**:
  - 스프라이트: `public/mascot/hori/{idle,run,jump,hurt,celebrate}/` — 각 state 당 4프레임 PNG + WebP 애니 + 2×2 원본/클린 시트 + 가로 strip 프리뷰
  - 사운드: `public/sounds/runner/` — `{jump,land,hurt,gameover,bgm,coin,powerup,milestone}.mp3` + 사이먼 패드 `note-{c4,e4,g4,c5}.mp3`
- **신규 의존성**: `phaser@^4.0.0`
- **유틸리티 스크립트**:
  - `scripts/process-sprite-sheet.py` — Gemini 2×2 출력 → 4프레임 PNG + WebP 애니. 마젠타 chroma-key → alpha flood-fill, 프레임 정렬, bbox 스케일 클램프. `python scripts/process-sprite-sheet.py <state> [duration_ms]`
  - `scripts/synthesize-runner-sfx.mjs` — 13개 SFX 절차적 합성 (sine/bell/noise + envelope) → ffmpeg MP3. `node scripts/synthesize-runner-sfx.mjs`
- **스프라이트 생성 가이드**: `docs/hori-sprite-prompts.md` — Gemini 3 Pro 프롬프트 템플릿, 마젠타 배경 이유, 골든 idle 레퍼런스 전략, 포즈 리스트
- 상세: `memory/hori-arcade-games.md`

## Performance & Caching (2026-04-24)
- **서버 storybook list 캐시** (`r2.repository.ts`):
  - 5분 in-memory 캐시 + `stale-while-revalidate` (만료 시 stale 즉시 반환 + 백그라운드 리프레시)
  - R2 다운로드 concurrency 30
  - 서버 기동 직후 `prewarmStorybookListCache()` 호출 (fire-and-forget) → 첫 사용자 요청 **23ms** (기존 7.3초)
- **클라이언트 에셋 프리로드 공용 인프라**:
  - `hooks/useAssetPreloadProgress(urls)` — 확장자로 audio/video/image 판별 후 `new Audio()`/`<video>`/`new Image()`로 프리로드 (CORS 없이 브라우저 HTTP 캐시 hit). deps는 `[key]`만 — urls 배열 참조 변화로 오캔슬되지 않음. R2 public 버킷에 CORS 규칙 없어도 동작.
  - `features/audiobook/hooks/useTtsDurations` — 모듈 레벨 `durationCache` Map으로 TTS 길이 probe 결과 영구 캐시. `loading`은 파생 상태(`ttsUrls.some(url => !durationCache.has(url))`) — 컴포넌트 재마운트 시 stuck loading 방지.
  - `components/AssetLoadingOverlay` — "X / Y · NN%" 큰 숫자 + 진행바 (absolute overlay / inline 양쪽 모드)
  - 사용처: `AudiobookProjectCard`(Remotion Player 감싸기, 슬라이드·TTS·커버·BGM) · `TimelineEditorStep`(롱폼 TimelinePreview, clip·SFX·TTS·BGM)
- **라이브러리 뷰어 카드** (`BookCard.tsx`): `loading="lazy"` + `decoding="async"` + 명시 `width/height` (640×360). 첫 진입 시 viewport 내 이미지만 로드
- **파닉스 seed 스크립트**: `scripts/seed-phonics-books.mjs` — 한글/영어 커리큘럼 71 unit → phonics Storybook 생성 (R2).
  - **기본 모드**: `POST /api/phonics/generate` 호출해 Gemini가 캐릭터/페이지/플래시카드/챈트/phonicsLesson 등 **텍스트 콘텐츠 자동 생성** (이미지·TTS는 저작도구에서 수동)
  - `--skeleton`: 기존처럼 AI 없이 빈 껍데기만
  - 플래그: `--force` (덮어쓰기) / `--concurrency N` (기본 3) / `--only id1,id2` / `--model <name>` (Gemini 모델 override)
  - `GeneratePhonicsBookRequest`에 seed 용 선택 필드 `id/folder/category/isPublic` 추가 — seed에서 unit.id 그대로 유지하며 AI 생성
- 상세: `memory/perf-optimizations.md`

## Learning Reports Feature 구조 (2026-04-23)
- `packages/client/src/features/learning/` — 동화책+파닉스 학습 리포팅 (부모용)
- **마스터리 공식**: `0.15 + 0.85 × 정답률 × exp(-days/30) × min(1, 시도/5)` → 4단계(`unknown/seen/practiced/mastered`)
- **이벤트 타입**: `page_read`·`word_exposed`·`word_correct`·`word_wrong`·`syllable_correct/wrong`(한글: metadata.consonant+vowel)·`phoneme_correct/wrong`(영어: metadata.phoneme) — `learning_events` 테이블 snake_case 저장, `LearningEventMetadata` 강타입
- **시각화**: 한글 파닉스 자음×모음 히트맵(`KoreanPhonicsHeatmap`) · 영어 Book1~5 스킬트리 카드(`EnglishPhonicsSkillTree`) · 동화책 지표+어휘 마스터리 카드(`StorybookReportSection`+`VocabularyMasteryCard`)
- **페이지**: `/parent/reports` — 동화책 섹션/파닉스 섹션 각각 한/영 탭
- **집계 위치**: 클라이언트 JS 메모리 (`groupByWord/Syllable/Phoneme` + `computeMastery`). 추후 Supabase view/RPC 이전 가능
- **이벤트 수집 연동**: Viewer(`page_read`+`word_exposed`) · ConnectTheDots · KoreanBlock(syllable 분해) · EnglishBlock · LineMatching(ko/en) · WordWriting(ko/en, accuracy≥50) · SpeakingPlayer(기존 `word_spoken`). StoryImage는 `StoryImageRound.word` 필드 없어 skip (follow-up). PhonicsViewer 학습카드 `word_exposed`는 follow-up.
- **`useGameLogger.GameWordResult.word`**: 옵션. 생략 시 word 이벤트 skip → 한글 게임에서 단어 + 분해된 음절(syllable-only) 이벤트 혼합 전달 패턴
- **테스트**: `mastery.test.ts`·`aggregate.test.ts`·`korean-phonics-grid.test.ts` 24 tests PASS
- 스펙: [docs/superpowers/specs/2026-04-23-learning-reports-design.md](docs/superpowers/specs/2026-04-23-learning-reports-design.md)
- 플랜: [docs/superpowers/plans/2026-04-23-learning-reports-plan.md](docs/superpowers/plans/2026-04-23-learning-reports-plan.md)

## Auth Feature 구조 (2026-04-23 로그인 시스템)
- `packages/client/src/features/auth/` — Supabase 기반 부모계정(Email/PW + Google OAuth) + 자녀 프로필 최대 4
- PIN 4자리 pgcrypto 해싱 (DB RPC `set_pin`/`verify_pin` SECURITY DEFINER, `set search_path` 강화). 15분 memoize + 3회 오답 시 60초 lockout (`useParentGate`)
- localStorage → `learning_events` 자동 마이그레이션 (플러그인 레지스트리 — 이후 스펙이 `MIGRATIONS[]`에 1줄 추가로 확장)
- 게스트 모드 호환: `isSupabaseConfigured=false`면 `ParentCornerButton` 숨김
- Edge Function: `supabase/functions/reset-pin/` (PIN 분실 magic link, rate-limited, enumeration-safe)
- 라우트: `/login` (4-step state machine: auth → setPin → profile → done), `/login/callback`, `/parent/*` (Reports placeholder · Profiles CRUD · Settings + ChangePinStep)
- **Supabase 프로젝트**: `tangobook` (ref: `fxzwigjkbsptvsjraqwa`, ap-northeast-2). Dashboard: https://supabase.com/dashboard/project/fxzwigjkbsptvsjraqwa
  - 스키마·RLS·RPC·트리거 배포 완료, `reset-pin` Edge Function v1 ACTIVE (verify_jwt=false)
  - 나중 작업: **Google OAuth provider 활성화**, **Edge Function secret `PUBLIC_APP_URL`** (PIN 분실 기능용) — 상세: `memory/supabase-pending-todos.md`
  - 클라이언트 env: `packages/client/.env.local` (gitignore됨), 템플릿: `packages/client/.env.local.example`
- 스펙: [docs/superpowers/specs/2026-04-23-auth-login-design.md](docs/superpowers/specs/2026-04-23-auth-login-design.md)
- 플랜: [docs/superpowers/plans/2026-04-23-auth-login-plan.md](docs/superpowers/plans/2026-04-23-auth-login-plan.md)

## 별/포인트 시스템 (Phase 1, 2026-05-01)
- **데이터**: Supabase `child_profiles.stars_total` + `star_ledger` 거래 원장. SQL: `scripts/supabase-rewards-setup.sql` (적용 완료)
- **신규 테이블 5종**: star_ledger · word_mastery · collection_user · hori_inventory · weekly_missions (전부 RLS 자녀-자기-only)
- **신규 RPC 5종**: get_sr_word_pool · grant_game_perfect · activate_collection_item · purchase_hori_item · complete_weekly_mission
- **별 적립**: Postgres trigger `handle_learning_event()` 가 `learning_events` insert 마다 자동 적립 + word_mastery upsert + collection 상태 전이
- **적립 규칙**: page_read +1 (마지막 페이지 +5) · word_correct +1 · daily_login +2 · 7일 streak +20. 등급 ×배율 (free 1.0 / plus 1.5 / family 2.0)
- **별 사용**: `validate_star_spend` trigger 가 `hori_item`/`foil_card`/`season_costume` 만 허용 (DB 차원 enforce)
- **클라이언트**: `packages/client/src/features/rewards/` — `useStarBalance` (TanStack Query, 5s staleTime + focus refetch) + `StarCounter` (LibraryPage 헤더, +N 토스트 자체)
- **GameResultScreen**: 종료 후 1.2s refetch → "+N ⭐ 저장됨" 인디케이터
- **마지막 페이지 감지**: ViewerContainer/PhonicsViewer 가 page_read metadata 에 `totalPages` + `lastPage` 포함 (트리거가 +5 보너스 발동)
- 스펙: [docs/superpowers/specs/2026-04-30-rewards-sr-collection-design.md](docs/superpowers/specs/2026-04-30-rewards-sr-collection-design.md)
- 플랜: [docs/superpowers/plans/2026-04-30-stars-infrastructure-plan.md](docs/superpowers/plans/2026-04-30-stars-infrastructure-plan.md)
- 후속 Phase 2~6: SR 큐 endpoint · 카드/도감 UI · 호리 꾸미기 · 호리 놀이터 7 게임 · 주간 미션

## 뷰어 Feature 구조 (2026-04-22 리디자인)
```
features/viewer/
  components/
    ViewerContainer.tsx           # 메인 뷰어 + 자동재생 + 5페이지 프리로드 + RewardScreen 오버레이
    ViewerToolbar.tsx             # 상단 Pill 툴바: 뒤로/홈 + 재생(TTS/BGM/AutoPlay) + 설정
    ViewerControls.tsx            # 좌우 64px 네비(화면 세로 중앙)
    PageView.tsx                  # framer-motion slide-fade, 이미지/자막 세로 스택
    PageSubtitle.tsx              # TTS 진행시간 기반 자막 (문장 단위 리셋 + 문장 내 단어 progressive + fallback 타이머)
    BookSpineProgress.tsx         # 하단 책 등뼈 진행률 (dot, 중앙)
    MascotCorner.tsx              # BGM 재생 중 우하단 호리 dancing
    RewardScreen.tsx              # ?mode=video 진입 시 영상 모달 자동 오픈용 (마지막 페이지는 현재 BookDetail 이동)
    YouTubeModal.tsx              # youtube-nocookie.com 임베드 + ESC 닫기
    PhonicsViewer.tsx             # 파닉스 전용 뷰어 (메뉴/학습/단어연습/게임)
    GameListViewer.tsx            # ?mode=games 게임 목록
    QuizViewer.tsx                # 퀴즈 뷰어
  hooks/
    useViewerSettings.ts          # 뷰어 설정 (tuple 반환: [settings, updateSettings])
                                  # 기본값: darkMode=true, autoPlayTts=true, textSize='md'
    useAudioPlayer.ts             # TTS/BGM: playTts/stopTts + ttsCurrentTime/ttsDuration/isTtsPlaying
                                  # timeupdate 이벤트로 currentTime 동기화
    useSwipe.ts                   # 스와이프 제스처
  lib/
    page-text.ts                  # getPageText/getPageTtsUrl (lang fallback)
```

### 뷰어 동작
- 진입 시 항상 첫 페이지부터, **TTS 자동 재생**, 끝나면 800ms 뒤 자동 페이지 넘김
- **마지막 페이지** TTS 끝 or onNext 호출 → **BookDetailPage (`/library/:id`)로 자동 이동**
- **다음 5페이지 이미지·TTS 프리로드** (`new Image()` + `new Audio({preload:'auto'})`)
- 홈 버튼 → `/library` (라이브러리 목록)
- 뒤로 버튼 → browser history back (BookDetailPage)

### 자막 시스템 (`PageSubtitle.tsx`)
- 문장 분할: `split(/(?<=[.!?…。！？」"'])\s+|\n+/)`
- 문장 단위로 화면 리셋 (이전 문장 지우고 새 문장부터)
- 문장 내에서 **단어(어절) 단위 progressive** — TTS `currentTime/duration` 비례
- **Fallback**: ttsDuration 못 잡히면 `text.length / 7 (chars/sec)` 추정. `isTtsPlaying`인 동안 자체 interval(100ms)로 elapsed 누적

### 뷰어 라우팅 규칙
- `ViewerContainer`가 storybook.type과 mode 쿼리로 분기
- `type === 'phonics' && mode !== 'story'` → PhonicsViewer
- `mode === 'games'` → GameListViewer
- `mode === 'video'` → RewardScreen 자동 오픈 → YouTubeModal
- 그 외 → 일반 동화책 뷰어

## 오디오북 렌더링 (Remotion)
- **렌더링 패턴**: fire-and-forget (컨트롤러 즉시 응답 → 클라이언트 폴링)
- **Remotion entry**: 프로덕션에서 절대경로 사용 (`/app/packages/remotion/src/entry.ts`)
- **Chromium**: Dockerfile에 `chromium`+`nss` 설치, `CHROMIUM_PATH` 환경변수로 전달
- **browserExecutable**: `selectComposition` + `renderMedia` 둘 다에 전달 필수
- **BGM 라이브러리**: 파일 업로드 시 `background-music.json` (R2) 자동 갱신
- **BGM 루프**: Remotion `<Loop>` 컴포넌트로 반복 재생 (`bgmDuration` prop 필요, 서버/클라이언트 모두 probe)
- **크로스페이드**: 1초 (30프레임), TTS/자막은 장면 전환 후 0.67초 딜레이, TTS 종료 후 1.5초 패딩
- **자막 타이밍**: 문장 글자수 비례 배분 (`TypewriterSubtitle.slideDurationInFrames`)
- **boolean 기본값**: `includeTts`/`includeSubtitles`/`includeCover`/`includeBgm`은 `!== false`로 체크 (레거시 undefined 대응)

## 롱폼 영상 Feature 구조
```
features/longform-video/
  api/longform.api.ts               # analyze, generateClip, generateAll, render, progress 폴링
  utils/timeline.utils.ts           # getEffectiveDuration, getSceneStartTime
  utils/ffmpeg-loader.ts            # FFmpeg.wasm 싱글톤 로더 (fallback용)
  utils/subtitle-canvas.ts          # Canvas API 자막 이미지 생성 (fallback용)
  utils/client-renderer.ts          # 클라이언트 렌더러 (fallback용, 현재 미사용)
  hooks/
    useLongformProject.ts           # 프로젝트 생성/삭제/기본값
    useTimeline.ts                  # 타임라인 상태 (play/pause/seek/trim/split/reorder)
    usePromptPresets.ts             # 프롬프트 프리셋 CRUD
  components/
    LongformVideoTab.tsx            # 메인 탭 (4단계 스텝 라우팅)
    PromptAnalysisStep.tsx          # Step 1: AI 프롬프트 분석 (Gemini + Motion Matching)
    VideoGenerationStep.tsx         # Step 2: Grok 영상 생성 (개별/전체)
    TimelineEditorStep.tsx          # Step 3: 타임라인 편집 (오케스트레이터)
    TimelinePreview.tsx             # 비디오 프리뷰 + 자막 오버레이
    TimelineControls.tsx            # 재생/시크/분할 버튼
    TimelineTrack.tsx               # 트랙 컨테이너 (video/sfx/subtitle/tts/bgm)
    TimelineClip.tsx                # 개별 클립 (리사이즈/이동/재정렬 드래그)
    SubtitleStyleModal.tsx          # 자막 스타일 (크기/색/위치)
    RenderStep.tsx                  # Step 4: 서버 렌더링 + YouTube 업로드 + 결과 미리보기
    PromptPresetModal.tsx           # 프롬프트 프리셋 관리
```

### 롱폼 영상 서버 구조
```
server/src/
  services/longform.service.ts      # 분석/생성/렌더/진행률/YouTube업로드/AI메타생성
  services/youtube-preset.service.ts # YouTube 프롬프트 프리셋 CRUD (R2 저장)
  controllers/longform.controller.ts
  controllers/youtube-preset.controller.ts
  routes/longform.routes.ts         # /api/longform/* + /youtube/*
  routes/youtube-preset.routes.ts   # /api/youtube-presets/*
  providers/grok.provider.ts        # xAI Grok 영상 생성 API (image-to-video, 720p)
  providers/youtube.provider.ts     # Google YouTube API (OAuth2 + upload + thumbnail)
  providers/longform.provider.ts    # Python 렌더링 스크립트 호출 (LongformRenderOptions)
  providers/r2.provider.ts          # R2 CRUD + presigned upload URL
  scripts/generate_longform.py      # 네이티브 ffmpeg 렌더링 (Pillow 자막 PNG + ffmpeg overlay/concat/amix)
```

### 롱폼 영상 파이프라인
1. **프롬프트 분석** (Gemini): 페이지별 영상 프롬프트 생성 + Motion Matching (이전 장면 카메라 참조)
   - **전체 분석 시작**: AI 경로, `POST /api/longform/analyze` — fire-and-forget + progressMap 폴링
   - **수동 제작**: AI 없이 TTS 길이·clipDuration·자막 타이밍만 채움 (`analyzeManual` — `POST /api/longform/analyze-manual`). 기존 videoPrompt는 보존. 프리셋 불필요.
   - progressMap에 `updatedAt` 포함 + 15초마다 하트비트 갱신 (finally에서 clearInterval)
   - 클라이언트 stale detection: null 1분 지속 또는 활동(progress/step/updatedAt) 15분 멈춤 시 에러 + 폴링 중단
   - `getAudioDuration`: fetch/ffmpeg 각 15초 타임아웃
2. **클립 생성** (Grok xAI): image-to-video, "no music/text/subtitles" 자동 포함, 720p
3. **타임라인 편집**: 트리밍(trimStart/trimEnd), SFX/TTS 오프셋, 장면 순서 드래그, 분할
4. **렌더링** (네이티브 ffmpeg): Pillow 자막 PNG → ffmpeg overlay → xfade 크로스디졸브 → amix 오디오(SFX/TTS/BGM) → MP4 (MoviePy 제거됨)
5. **YouTube 업로드**: OAuth2 연결 → AI 설정값 생성(프롬프트 프리셋) → 업로드 + 썸네일

### 렌더링 상세 (generate_longform.py)
- **MoviePy 완전 제거** → Pillow(자막 PNG) + 네이티브 ffmpeg subprocess
- Phase 1: 병렬 다운로드 (ThreadPoolExecutor, 6워커)
- Phase 2: 씬별 Pillow 자막 PNG 생성 → ffmpeg overlay (한글 자동 줄바꿈, 외곽선, 반투명 배경)
- Phase 3: ffmpeg xfade 크로스디졸브 (기본 0.5초)
- Phase 4: ffmpeg amix 오디오 믹싱 (SFX/TTS adelay + BGM, normalize=0)
- 최종: `-movflags +faststart` (브라우저 스트리밍 재생 지원)
- 프로덕션에서 시스템 ffmpeg 사용 (drawtext/libfreetype 지원), 로컬은 ffmpeg-static
- 방어: duration ≤ 0.1초·0바이트 클립은 스킵, xfade transition이 최단 장면보다 길면 자동 축소, 전역 try/except로 traceback stderr 출력
- Node 측 `longform.provider.ts`: 비-JSON stderr를 tail 버퍼(30줄)에 누적해 에러 메시지에 포함

### YouTube 자동 업로드
- **OAuth2**: Google YouTube Data API v3, 다채널 지원 (`system/youtube-channels.json`)
- **AI 설정값 생성**: 프롬프트 프리셋 시스템 (프롬프트 저장/불러오기/편집)
  - 프롬프트 + 동화책 정보를 Gemini에 전송 → title/description/tags/privacy/category/language JSON 반환
  - `POST /api/longform/youtube/generate-meta`
- **프리셋**: `YouTubePreset { id, name, prompt, createdAt }` — R2에 JSON 저장
- **업로드**: 렌더링 영상 R2 → YouTube, 썸네일 sharp로 1280x720 JPEG 변환 후 업로드
- **진행률**: fire-and-forget + polling 패턴
- **다채널 / 자막 업로드**: `YouTubeUploadResult.channelId`에 업로드 시 사용한 내부 채널 ID 저장 → `captions.insert`는 동일 채널로 호출(다른 채널 인증 시 403). 기존 업로드처럼 `channelId`가 없으면 `YouTubeProvider.findChannelIdForVideo`로 `videos.list` 결과의 채널 소유자를 찾아 보정
- **수동 연결**: 외부에서 올린 YouTube 영상을 프로젝트에 연결 — `POST /api/{audiobooks|longform}/youtube/link-video` (URL 또는 11자 ID 파싱: `utils/youtube-url.ts`). 소유 채널이 연결돼 있으면 `channelId`도 함께 저장(자막 업로드 가능)

### 롱폼 데이터 모델 (LongformScene 핵심 필드)
- `clipDuration`, `trimStart?`, `trimEnd?` — 클립 트리밍
- `sfxUrl`, `sfxOffset?`, `sfxVolume` — 효과음
- `ttsUrl`, `ttsOffset?`, `ttsDuration?` — 나레이션
- `subtitles[]` — 자막 (startTime/endTime 상대값)
- `clipHistory[]` — 이전 클립 히스토리

### 다국어 버전 (master ↔ version)
- 최상위 프로젝트 = master (parentProjectId 없음), 버전 = 자식 (parentProjectId = master.id)
- `addVersion()`은 master의 scenes를 clipUrl 포함 복제, 타임라인 편집값(trim/offset)만 리셋
- **재분석 시 보존**: `longform.service.ts#analyze`는 pageNumber 매칭된 기존 씬의 `clipUrl`, `clipHistory`, `trim*`, `sfxUrl`, offset, 볼륨을 유지하고 언어 종속 필드(videoPrompt/subtitles/ttsUrl/ttsDuration)만 갱신
- **자동 fallback**: `TimelineEditorStep`은 자식 버전의 씬에 clipUrl 누락 시 master의 같은 pageNumber에서 clipUrl/clipHistory/sfxUrl을 복사해 메우는 effect 실행 (기존 데이터 대응)

## 뷰어 디자인 시스템 (2026-04-22~)
- 토큰: `tailwind.config.js`의 cream/peach/coral/ink/darkbg + CSS vars
- **마스코트 호리(Hori)**: `<Mascot state="..." size="..." character="hori" />`
  - 자산: `packages/client/public/mascot/hori/` — Lottie 5 + WebP 7 (체커보드 flood-fill 제거 후 저장)
  - Lottie 5: idle/waving/cheering/celebrating/dancing (Bodymovin v5, PNG base64 embed, transform keyframes, <40KB)
  - WebP 7: idle/waving/thinking/reading/pointing/sleeping/sad (1024×1024 q85, <90KB)
  - Fallback: Lottie → WebP → state별 이모지
  - URL 버전 쿼리 `?v=N`으로 브라우저 캐시 무효화 (ASSET_VERSION 상수)
  - **등장 지점**: LibraryPage 웰컴(waving) · StateScreen(thinking/sad) · 뷰어 로딩(reading) · BGM 재생 시 MascotCorner(dancing) · RewardScreen(celebrating)
- 공용 컴포넌트: Button, Card, Skeleton, StateScreen, ErrorBoundary, Mascot
- 뷰어 컴포넌트: ViewerContainer, ViewerToolbar(Pill + 재생 컨트롤 통합), ViewerControls(화면 중앙 64px 좌우 네비), PageView(framer-motion slide-fade), PageSubtitle(문장 리셋 + 단어 progressive), BookSpineProgress, MascotCorner, RewardScreen, YouTubeModal
- 라이브러리: `/library` 웰컴(마스코트) + 탭(3) + 검색 + 정렬 + 카테고리 필터 칩 + 스켈레톤 + YouTube 배지 + aspect-video 16:9 카드 (3~4-col)
- 책 상세: `/library/:id` 16:9 표지 hero + 언어 탭 + 모드 카드 3개(읽기/영상/게임, 조건부)
- 언어 파라미터: `?lang=ko|en` + `getPageText/getPageTtsUrl` (fallback to base text)
- 접근성: `useReducedMotion`(framer-motion), `focus-visible:ring`, 에러 문구 아이 친화, 터치 타겟 48+px

## 뷰어 플로우
```
LibraryPage (/library)
  → 카드 탭
BookDetailPage (/library/:id)   # 언어·모드 선택
  → "📖 책으로 읽기"
ViewerContainer (/viewer/:id?lang=ko)
  → TTS 자동재생 → 문장 단위 자막 → 자동 페이지 넘김 → 마지막 페이지
BookDetailPage (/library/:id)   # 자동 복귀 (다음 액션 선택)
```
언어 선택(`?lang=ko|en`)은 자동으로 게임 목록을 필터링 (block/word-writing/speaking 등 언어 태그 게임).

## PRD 문서
- `PRD_00_Master.md` - 마스터 로드맵
- `PRD_01_AuthorTool_Storybook.md` - 동화책 저작도구
- `PRD_02_AuthorTool_Phonics.md` - 파닉스 저작도구
- `PRD_03_Viewer.md` - 뷰어 앱 (동화책 + 파닉스 통합)
- `PRD_04_Marketing.md` - 마케팅 콘텐츠 (블로그 + 카드뉴스)
- `PRD_v2.md` - 롱폼 영상 생성
- `PRD_UIUX_AuthorTool.md` - UI/UX 상세 스펙
