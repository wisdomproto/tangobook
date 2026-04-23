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
- 선택 변수: `OPENAI_API_KEY` — 말하기 게임의 Whisper fallback용. 없어도 Web Speech API만으로 동작 (degraded mode)
- 선택 변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — 로그인/계정 기능 활성화용 (client env). 없으면 게스트 모드만 동작 (graceful degradation). 셋업: `scripts/supabase-setup.sql`을 Supabase SQL Editor에 실행 후 Project Settings > API에서 URL·anon key 복사

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
