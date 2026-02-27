# 탱고북 저작도구 - Claude Code 프로젝트 가이드

## 프로젝트 개요
AI 기반 유아동 동화책 + 파닉스 저작도구. Gemini AI로 스토리/이미지/TTS를 자동 생성.

## 기술 스택
- **Monorepo**: pnpm workspaces (`packages/client`, `packages/server`, `packages/shared`)
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3
- **Backend**: Express v5 + TypeScript + tsx (dev)
- **AI**: Google Gemini 2.5 Flash (텍스트), Gemini 3 Pro Image (이미지)
- **Storage**: Cloudflare R2 (S3 호환)
- **Audio**: ffmpeg-static (파닉스 음원 연결)

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
    useReadingProgress.ts         # 읽기 진도 (localStorage)
```

### 뷰어 라우팅 규칙
- `ViewerContainer`가 storybook.type과 mode 쿼리로 분기
- `type === 'phonics' && mode !== 'story'` → PhonicsViewer
- `type === 'phonics' && mode === 'story'` → 일반 동화책 뷰어 재사용 (onBack으로 파닉스 메뉴 복귀)
- `mode === 'quiz'` → QuizViewer
- 그 외 → 일반 동화책 뷰어

## PRD 문서
- `PRD_00_Master.md` - 마스터 로드맵
- `PRD_01_AuthorTool_Storybook.md` - 동화책 저작도구
- `PRD_02_AuthorTool_Phonics.md` - 파닉스 저작도구
- `PRD_03_Viewer.md` - 뷰어 앱 (동화책 + 파닉스 통합)
- `PRD_UIUX_AuthorTool.md` - UI/UX 상세 스펙
