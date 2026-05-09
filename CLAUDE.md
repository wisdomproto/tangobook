# 탱고북 저작도구 — Claude Code 프로젝트 가이드

AI 기반 유아동 동화책 + 파닉스 + 어휘 저작도구. Gemini로 스토리/이미지/TTS 자동 생성.

## 기술 스택
- **Monorepo**: pnpm workspaces (`packages/{client,server,shared,remotion}`)
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3
- **Backend**: Express v5 + TypeScript + tsx
- **AI**: Google Gemini (텍스트/이미지) · Grok xAI (영상) · OpenAI Whisper (음성, optional)
- **Storage**: Cloudflare R2 (S3 호환)
- **Audio/Video**: ffmpeg-static · Remotion v4 (오디오북) · Pillow + ffmpeg (롱폼)
- **Auth**: Supabase (게스트 모드 graceful degradation)

## 폴더 구조
```
packages/
  shared/src/{types,constants,utils}/   # Storybook/Page/KeyObject 등 도메인 타입
  server/src/{routes,controllers,services,repositories,providers,utils,middleware}/
  remotion/src/                          # AudiobookComposition + entry.ts
  client/src/{lib,store,router,pages,features,components,design-system}/
docs/                                    # superpowers/specs, books, architecture-notes
memory/                                  # 사용자 auto-memory (장기 컨텍스트)
```

## 백엔드 레이어
```
Request → routes → controllers → services → repositories/providers
```
- routes: URL 매핑만 / controllers: req 파싱 + try/catch + next(err) / services: 비즈니스 로직 (AppError 던지기) / repositories: R2 / providers: Gemini/R2 SDK 싱글톤
- 응답 통일: `res.json({ success: true, data })` / 실패는 `throw new AppError(404, '메시지')` (errorMiddleware)

## 프론트엔드 상태관리
- **TanStack Query**: 서버 데이터 (storybooks, units, balance 등)
- **Zustand** (`store/editor.store.ts`): UI 상태만 (selectedId, activeTab, 모달)
- **금지**: Zustand에 서버 데이터 저장
- API 패턴: `apiGet/apiPost/apiDelete` (`lib/axios.ts`) → `features/{name}/api/*.api.ts` → `features/{name}/hooks/use*.ts`

## Feature 모듈 구조
```
features/{name}/{api,hooks,components,index.ts}
```

## 디자인 시스템 — 아이콘
- 프리미티브: `<AppIcon src="category/animal.png" size={48} />` (`design-system/primitives/AppIcon.tsx`)
- 자산 위치: `packages/client/public/icons/{category,section,tab}/*.{png,svg}`
- AI 생성 일러스트 (coral #FF6F61 + peach #FFE4D6 톤) — Khan Kids × 곰돌이푸 × Duolingo
- Cambridge 토픽 매핑: `features/vocabulary-unit/lib/cambridge-icon-map.ts`
- 마스코트 호리: `public/mascot/hori/*.webp` 그대로 (Mascot 컴포넌트)
- 미사용 슬롯 (호리 게임·Storybook 4 카테고리·뷰어 툴바 등) 은 이모지 폴백 유지

## 디자인 시스템 — 폰트 (2026-05-03)
- **Body / UI**: Pretendard Variable (한국 모던 앱 표준, 한글+Latin 조형 통일, 가변 38KB)
- **Display / Heading (`font-display`)**: NanumSquareRound (둥근 한글체, 4-5세 친화)
- 정의: `tailwind.config.ts` 안에 inline (typography.ts import 캐시 이슈 우회). `index.css` 에 jsdelivr CDN @import.

## 디자인 시스템 — 그림체 (2026-05-03)
- 책마다 `Storybook.artStyle` (마지막 active, 자동 갱신) + `defaultStyle` (사용자 명시 대표) 분리
- `defaultStyle` = 라이브러리 표지 imageUrl 노출에 우선 사용 (없으면 artStyle fallback)
- /editor2 그림체 칩에 ⭐/☆ 토글로 대표 지정. `styleAssets[styleId]` 가 그림체별 표지·캐릭터·페이지 일러스트 분리 보관

## MVP 출시 정책 (2026-05-09)
- **사이드바**: 동화책 axis 만 active (alwaysActive). 파닉스/어휘 axis = `comingSoon` 음영 + "준비 중" sub-label (코드/라우트 보존). `AppShell.PRIMARY_AXES`. `/library` 일 때 헤더 = `position: absolute` transparent overlay (hero 일러스트가 헤더 영역까지 풀폭) + 사용자 chip / 로그아웃은 `pointer-events-auto` floating.
- **LibraryPage** (`/library`): hero 배너 (`aspect-[5/2] md:aspect-[4/1]`) `bg-[url('/images/library-hero.png')] bg-cover`. 큰 제목/권수 텍스트 X (일러스트와 충돌). 검색바 hero 하단 floating (`absolute inset-x-0 bottom-6` + `bg-white shadow-pop`). 책 카드 = 일러스트 풀 (`aspect-video rounded-2xl`) + 아래 제목만 (Card 배경/패딩 X).
- **BookDetailPage** (`/library/:id`): AppShell **밖** 라우트 (사이드바 X, 풀폭). 헤더 단순 inline 토글 (← 라이브러리 + 언어 chip + 그림체 chip). hero = 좌 정방형 표지(aspect-square) + 우 chip row(카테고리/타입/페이지/단어) + 모드 카드 3개 stack. 좌우 baseline 정렬 (`items-stretch` + 우측 column `flex-col` + 모드 그룹 `mt-auto`). 콘텐츠 vertical 가운데 정렬 (헤더는 위 고정).
- **모드 카드 3개**: 책으로 읽기 (coral) / 영상으로 보기 (violet-blue, 영상 없는 책=disabled 음영) / 단어 익히기 (yellow→amber). 가로 긴 형태 — 좌 제목+부제 / 우 흰 동그라미 워시 (`bg-white/85 + ring-2 ring-white`) 안 PNG 일러스트 / 우끝 → 화살표.
- **모드 일러스트**: `public/icons/mode/{book,video,word}.png` (soft 3D rendered 톤, 그림체 독립적). PNG 베이크된 체크무늬 배경 → `packages/server/scripts/strip-checkerboard-bg.mjs` 로 4 모서리 floodfill 후처리.
- **VocabularyStudyPage** (`/vocabulary/:unitId`): AppShell **밖** (학습 풀화면). 메인 진입 = BookDetailPage 의 "단어 익히기" 카드. `VocabularyStudyContent` 컴포넌트 = 단어 미리보기 + 게임 카드 4 (Duolingo push button + 좌상단 번호 1·2·3·4) — BookDetailPage / VocabularyStudyPage 공용.

## 모듈별 가이드 (해당 폴더 작업 시 자동 로드)
- 동화책 (CRUD/사이드바/복사) → [features/storybook/CLAUDE.md](packages/client/src/features/storybook/CLAUDE.md)
- 학습 게임 → [features/games/CLAUDE.md](packages/client/src/features/games/CLAUDE.md)
- 롱폼 영상 → [features/longform-video/CLAUDE.md](packages/client/src/features/longform-video/CLAUDE.md)
- /editor2 (3축 variation) → [features/editor/CLAUDE.md](packages/client/src/features/editor/CLAUDE.md)
- 뷰어 + 디자인 시스템 → [features/viewer/CLAUDE.md](packages/client/src/features/viewer/CLAUDE.md)
- 오디오북 (Remotion) → [features/audiobook/CLAUDE.md](packages/client/src/features/audiobook/CLAUDE.md)
- 파닉스 → [features/phonics/CLAUDE.md](packages/client/src/features/phonics/CLAUDE.md)
- 마케팅 (블로그/카드뉴스) → [features/blog/CLAUDE.md](packages/client/src/features/blog/CLAUDE.md)
- Auth (Supabase) → [features/auth/CLAUDE.md](packages/client/src/features/auth/CLAUDE.md)
- Learning Reports → [features/learning/CLAUDE.md](packages/client/src/features/learning/CLAUDE.md)
- 별/호리/놀이터 → [features/rewards/CLAUDE.md](packages/client/src/features/rewards/CLAUDE.md)
- Hori 아케이드 → [features/arcade-games/CLAUDE.md](packages/client/src/features/arcade-games/CLAUDE.md)
- 어휘 단원 → [features/vocabulary-unit/CLAUDE.md](packages/client/src/features/vocabulary-unit/CLAUDE.md)
- 횡단 (커리큘럼/자료실/캐싱/자산/snake_case) → [docs/architecture-notes.md](docs/architecture-notes.md)

## 자주 쓰는 커맨드
```bash
pnpm dev              # client + server 동시
pnpm typecheck        # 모든 패키지
pnpm build / lint
pnpm --filter {server|client|shared} {dev|build|...}
```

## 환경변수
`packages/server/.env` (template: `.env.example`).
- 선택: `OPENAI_API_KEY` (Whisper fallback) / `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (`packages/client/.env.local`, 없으면 게스트 모드)
- Supabase 셋업: `scripts/supabase-setup.sql` 을 SQL Editor 에 실행

## Gemini 모델
- Default 텍스트: `gemini-3.1-pro-preview` (`DEFAULT_TEXT_MODEL` shared / `config.gemini.textModel` server, `GEMINI_TEXT_MODEL` env override)
- 자동 폴백: overload(503/UNAVAILABLE/429/overloaded/RESOURCE_EXHAUSTED) 시 `gemini-2.5-flash-lite`
- retry 래퍼 `withGeminiRetry`: 5회, exp backoff + jitter, 시도당 120s 타임아웃
- 배치 작업(seed 등)은 `--model gemini-2.5-flash-lite` 권장

## 새 Feature 추가
1. `features/{name}/api/{name}.api.ts` (apiGet/apiPost)
2. `features/{name}/hooks/use{Name}.ts` (TanStack Query)
3. `features/{name}/components/`
4. `features/{name}/index.ts` (exports)
5. 라우트 `client/src/router/index.tsx`

## 코딩 컨벤션
- 파일명: PascalCase (컴포넌트), camelCase (훅/유틸/API)
- 컴포넌트: named export (pages는 default)
- 에러: `AppError(status, message)` 사용. console.error 대신 throw
- 주석: 자명한 코드에 X. 복잡한 로직만
- import: `@tangobook/shared` (shared 타입), `@/` (client 내부)

## R2 데이터 호환성
- 기존 동화책 211+권이 R2에 저장됨. `Storybook` 인터페이스 호환 유지
- 새 필드는 `optional`로 추가 (하위 호환성)
- snake_case 혼용은 [docs/architecture-notes.md](docs/architecture-notes.md) 참조

## 주요 타입 위치
- `Storybook`, `Character`, `Page`, `KeyObject`, `BlendingExercise`, `ParentGuide`, `ReadingLevel`, `VocabularyUnit`, `BookManifest` → `@tangobook/shared`
- `ApiResponse<T>` → `@tangobook/shared`
- `AppError` → `packages/server/src/middleware/error.middleware.ts`

## PRD 문서
`docs/PRD_*.md` (Master / AuthorTool_Storybook / AuthorTool_Phonics / Viewer / Marketing / v2 / UIUX_AuthorTool)
