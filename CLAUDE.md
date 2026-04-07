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

## 게임 Feature 구조
```
features/games/
  registry/                          # 게임 등록 시스템
    game-registry.ts                 # 레지스트리 코어 (registerGame, getGameEntry 등)
    index.ts                         # side-effect imports + re-exports
    games/*.register.ts              # 게임별 등록 (1게임 = 1파일)
  components/
    players/*.tsx                    # 게임 플레이어 UI (10개)
    config/*.tsx                     # 게임 설정 패널 (10개)
    GameResultScreen.tsx             # 공통 결과 화면 (점수, 재시작/뒤로)
    GameProgressBar.tsx              # 공통 진행바 (Q카운터 + 바 + 점수)
    config/ConfigControls.tsx        # 공통 설정 컨트롤 (NumberSelector, ConfigCheckbox)
  hooks/
    useGameAudio.ts                  # 오디오 재생 + 피드백 효과음 (playAudio, playFeedbackSound)
    useBlockDrag.ts                  # 블록 게임 공통 드래그/터치 핸들링 (Korean/English 공용)
    usePhonicsMap.ts                 # 파닉스 음원 라이브러리 sound→URL 맵 로딩
  utils/
    shuffle.ts                       # Fisher-Yates 셔플
```

### GamesTab 기능
- **개별 생성**: 모달에서 게임 타입 선택 → 설정 → 생성
- **일괄 생성**: "모든 게임 만들기" 버튼 → 미생성 게임만 기본 설정으로 순차 생성
- **gamesApi.generate()** 직접 호출 (일괄 생성 시 useMutation 미사용)

### 게임 목록 (15종)
| ID | 이름 | 지원 타입 |
|----|------|-----------|
| vocabulary-matching | 어휘 매칭 | storybook |
| word-writing | 단어 쓰기 | storybook |
| connect-the-dots | 점잇기 | storybook |
| word-quiz | 단어 퀴즈 | storybook |
| picture-sequence | 그림 순서 | storybook |
| odd-one-out | 다른 그림 찾기 | storybook |
| word-image-matching | 단어-그림 매칭 | phonics |
| blending-listening | 블렌딩 듣기 | phonics |
| letter-sound | 글자 소리 | phonics |
| word-listening | 듣고 단어 맞추기 | phonics |
| korean-block | 한글 블록 맞추기 | storybook |
| english-block | 영어 블록 맞추기 | storybook |
| korean-word-writing | 한글 낱말쓰기 | storybook |
| english-word-writing | 영어 낱말쓰기 | storybook |
| storybook-quiz | 동화책 퀴즈 | storybook |

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
| **핵심단어 메타** | `key_objects[]` (KeyObject) | `flashcards[]` (PhonicsFlashcard) | 이름은 다르나 역할 동일 |
| **핵심단어 이미지** | `keyObjectImages[]` (별도 배열) | `flashcards[].imageUrl` (객체 내부) | 저장 방식 상이 |
| **학습 어휘** | `educational_content.vocabulary[]` | `educational_content.vocabulary[]` | 동일 구조 |
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
- `Storybook`, `Character`, `Page`, `KeyObject`, `BlendingExercise` → `@tangobook/shared`
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

## 기존 R2 데이터 호환성
- 기존 60권의 동화책이 R2에 저장되어 있음
- `shared/types/storybook.ts`의 `Storybook` 인터페이스가 기존 JSON 구조와 호환
- 새 필드 추가 시 `optional`로 선언하여 하위 호환성 유지

## 코딩 컨벤션
- 파일명: PascalCase (컴포넌트), camelCase (훅/유틸/API)
- 컴포넌트: named export (pages는 default export)
- 에러: AppError(status, message) 사용. console.error 대신 throw
- 주석: 자명한 코드에는 주석 불필요. 복잡한 로직에만 추가
- import: `@tangobook/shared`는 shared 타입, `@/`는 client 내부

## 뷰어 Feature 구조
```
features/viewer/
  components/
    ViewerContainer.tsx           # 메인 뷰어 (동화책/파닉스/퀴즈 라우팅)
    PhonicsViewer.tsx             # 파닉스 전용 뷰어 (메뉴/학습/단어연습/게임)
    ViewerToolbar.tsx             # 상단 툴바 (언어, 텍스트크기, 다크모드, 전체화면)
    ViewerControls.tsx            # 하단 컨트롤 (페이지 이동, TTS, BGM)
    PageView.tsx                  # 페이지/표지/엔딩 뷰 (CoverView, EndView)
    QuizViewer.tsx                # 퀴즈 뷰어
    LetterMatchingGame.tsx        # 대소문자 매칭 게임
    ListeningQuizGame.tsx         # 듣기 퀴즈 게임
    WordImageMatchingGame.tsx     # 단어-이미지 선긋기 게임
    BlendingListeningQuiz.tsx     # 블렌딩 듣기 맞추기 게임
  hooks/
    useViewerSettings.ts          # 뷰어 설정 (다크모드, 언어, 텍스트크기 등)
    useAudioPlayer.ts             # TTS/BGM 오디오 재생 (자동 정리)
    useSwipe.ts                   # 스와이프 제스처
```

### 뷰어 동작
- 진입 시 항상 표지(0페이지)부터 시작 (읽기 진도 저장 없음)
- TTS 자동재생 → 페이지 자동 넘김 (autoPlayTts 설정)

### 뷰어 라우팅 규칙
- `ViewerContainer`가 storybook.type과 mode 쿼리로 분기
- `type === 'phonics' && mode !== 'story'` → PhonicsViewer
- `type === 'phonics' && mode === 'story'` → 일반 동화책 뷰어 재사용 (onBack으로 파닉스 메뉴 복귀)
- `mode === 'quiz'` → QuizViewer
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

### YouTube 자동 업로드
- **OAuth2**: Google YouTube Data API v3, 토큰 R2 저장 (`system/youtube-tokens.json`)
- **AI 설정값 생성**: 프롬프트 프리셋 시스템 (프롬프트 저장/불러오기/편집)
  - 프롬프트 + 동화책 정보를 Gemini에 전송 → title/description/tags/privacy/category/language JSON 반환
  - `POST /api/longform/youtube/generate-meta`
- **프리셋**: `YouTubePreset { id, name, prompt, createdAt }` — R2에 JSON 저장
- **업로드**: 렌더링 영상 R2 → YouTube, 썸네일 sharp로 1280x720 JPEG 변환 후 업로드
- **진행률**: fire-and-forget + polling 패턴

### 롱폼 데이터 모델 (LongformScene 핵심 필드)
- `clipDuration`, `trimStart?`, `trimEnd?` — 클립 트리밍
- `sfxUrl`, `sfxOffset?`, `sfxVolume` — 효과음
- `ttsUrl`, `ttsOffset?`, `ttsDuration?` — 나레이션
- `subtitles[]` — 자막 (startTime/endTime 상대값)
- `clipHistory[]` — 이전 클립 히스토리

## PRD 문서
- `PRD_00_Master.md` - 마스터 로드맵
- `PRD_01_AuthorTool_Storybook.md` - 동화책 저작도구
- `PRD_02_AuthorTool_Phonics.md` - 파닉스 저작도구
- `PRD_03_Viewer.md` - 뷰어 앱 (동화책 + 파닉스 통합)
- `PRD_04_Marketing.md` - 마케팅 콘텐츠 (블로그 + 카드뉴스)
- `PRD_v2.md` - 롱폼 영상 생성
- `PRD_UIUX_AuthorTool.md` - UI/UX 상세 스펙
