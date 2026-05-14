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

## 디자인 시스템 — single source of truth
**Reference**: [docs/design-system.md](docs/design-system.md) — 색/폰트/컴포넌트 + GPT 시안 prompt 템플릿 + Claude 가 시안 받을 때 protocol. 새 화면 시안 받을 때 매번 이 문서 참조.

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

## 학습자 화면 헤더 통일 (2026-05-10)
- **`<PageHeader>`** (`design-system/primitives/PageHeader.tsx`) — 학습자 화면 공용 헤더. 흰 wash 카드 (`bg-white/60 backdrop-blur shadow-soft rounded-3xl`) + 좌 ← 뒤로 가기 (peach pill `bg-peach-100 text-xl`) + 가운데 children + 우 right slot. 사용처: BookDetailPage / VocabularyStudyPage.
- **`<GameHeader>`** (`features/games/components/GameHeader.tsx`) — 게임 전용. 동일 wrapper 톤 + 가운데 ★ title current/total ★ 형식. 사용처: LineMatching / KoreanBlock / EnglishBlock / ConnectTheDots / WordWriting.
- **메인 페이지 (LibraryPage)** 와 **AppShell 내부 페이지** 는 별도 (LibraryPage = absolute overlay / AppShell = sticky 자체 헤더).

## MVP 출시 정책 (2026-05-09)
- **사이드바**: 동화책 axis 만 active (alwaysActive). 파닉스/어휘 axis = `comingSoon` 음영 + "준비 중" sub-label (코드/라우트 보존). `AppShell.PRIMARY_AXES`. `/library` 일 때 헤더 = `position: absolute` transparent overlay (hero 일러스트가 헤더 영역까지 풀폭) + 사용자 chip / 로그아웃은 `pointer-events-auto` floating.
- **LibraryPage** (`/library`): hero 배너 (`aspect-[5/2] md:aspect-[4/1]`) `bg-[url('/images/library-hero.png')] bg-cover`. 큰 제목/권수 텍스트 X (일러스트와 충돌). 검색바 hero 하단 floating (`absolute inset-x-0 bottom-6` + `bg-white shadow-pop`). 책 카드 = 일러스트 풀 (`aspect-video rounded-2xl`) + 아래 제목만 (Card 배경/패딩 X).
- **BookDetailPage** (`/library/:id`): AppShell **밖** 라우트 (사이드바 X, 풀폭). 헤더 단순 inline 토글 (← 라이브러리 + 언어 chip + 그림체 chip). hero = 좌 정방형 표지(aspect-square) + 우 chip row(카테고리/타입/페이지/단어) + 모드 카드 3개 stack. 좌우 baseline 정렬 (`items-stretch` + 우측 column `flex-col` + 모드 그룹 `mt-auto`). 콘텐츠 vertical 가운데 정렬 (헤더는 위 고정).
- **모드 카드 3개**: 책으로 읽기 (coral) / 영상으로 보기 (violet-blue, 영상 없는 책=disabled 음영) / 단어 익히기 (yellow→amber). 가로 긴 형태 — 좌 제목+부제 / 우 흰 동그라미 워시 (`bg-white/85 + ring-2 ring-white`) 안 PNG 일러스트 / 우끝 → 화살표.
- **모드 일러스트**: `public/icons/mode/{book,video,word}.png` (soft 3D rendered 톤, 그림체 독립적). PNG 베이크된 체크무늬 배경 → `packages/server/scripts/strip-checkerboard-bg.mjs` 로 4 모서리 floodfill 후처리.
- **VocabularyStudyPage** (`/vocabulary/:unitId`): AppShell **밖** (학습 풀화면). 메인 진입 = BookDetailPage 의 "단어 익히기" 카드. `VocabularyStudyContent` 컴포넌트 = 단어 미리보기 + 게임 카드 4 (Duolingo push button + 좌상단 번호 1·2·3·4) — BookDetailPage / VocabularyStudyPage 공용.

## 단어 마스터 표 (2026-05-11)
- **`/vocabulary-table-ko.html`** — 자료실 dropdown 📊 신규. 동화책 keyObject 만 source. 음절·받침·쌍자음·이중모음·복잡받침·ㅐㅔ 점수로 난이도 분류 (Lv1≤1.5 / Lv2≤3 / Lv3≤6 / Lv4>6).
- 비-명사 자동 필터: ~다/한/운/은/른/픈/쁜/인/던/의/히 어미 + 추상명사 + 고유명사 블랙리스트 + 4음절+ 복합명사 자동 분해 (2:N 양쪽 단일 명사) + 중간 ~의/과/와 조사 합성 + EXTRA_NOUNS 보조 사전.
- 표 12 컬럼 헤더 클릭 정렬. 영어 input · 카테고리 select 인라인 편집. ✏️ 한글 수정 / 🗑️ 제거. 행 클릭 → 출연 동화책 모달.
- **vocab-overrides API**: `GET/PUT /api/vocab-overrides` → R2 `_index/vocab-overrides.json`. localStorage X, dirty 플래그 + 명시 💾 저장 + beforeunload 경고.
- 영어 `vocabulary-master.html` 도 verbs/adj/adv 토픽 제거 + 어미 패턴 (~ly·ful·less·ous·ive·able·ish) 자동 필터.

## 블록 게임 레벨 선택 + 공유 (2026-05-11)
- 사이드바 sub-button: "한글 블록 게임" / "알파벳 블록 게임" 라벨 + 옆에 📤 공유 버튼 (Web Share API + clipboard fallback).
- `/games/{korean,alphabet}-block` → 레벨 선택 화면 (🌱 쉬움 / 🌿 보통 / 🌳 어려움, 각 단어 수 표시) → 그 레벨 단어에서 랜덤 N개 → 플레이어.
- 한글 레벨: vocab table 점수 공식 그대로. 영어 레벨: 단어 길이 (≤3/4-5/6+).
- 게임 어댑터 (`game-data-adapter.ts#unitTo{Korean,English}BlockData`): 이미지 없는 단어도 후보 포함 (player 가 conditional render).

## 라이브러리 마스터 (2026-05-10)
- **`/library-master`** — 라이브러리 노출 순서 편집 페이지 (저작도구 진입점 only). TopBar 우상단 📁 자료실 ▾ dropdown 첫 항목 "📚 라이브러리 마스터". AppShell (학습자 화면) 에서는 노출 X.
- 좌-우 split: 좌측 카테고리 DnD reorder (vertical list) + 우측 활성 카테고리 책 **grid 카드 DnD reorder** (반응형 2→3→4→5→6 column, `rectSortingStrategy`, 카드 = aspect-3/4 표지 + 좌상단 순서 chip + 우상단 🎨 표지 변경 chip — 카드 전체가 드래그 핸들) + 🎨 표지 변경 모달 (그림체별 표지 grid → 클릭 시 책 `defaultStyle` 변경). `@dnd-kit/sortable`. 변경 즉시 자동 저장.
- 저장: `_index/library-config.json` (`LibraryConfig` shared type — `categoryOrder[]` + `bookPriority[cat] = string[]`). 서버 `GET/PUT /api/library-config`. LibraryPage 가 config 적용해서 카테고리/책 순서 정렬.

## 동일 title 동화책 차단 (2026-05-10)
- `R2Repository.saveStorybook` 진입점에 validation. **신규 또는 title 변경 시에만** 체크 (audiobook 생성 등 부수 update 통과). variant `__L\d+$` (같은 baseId) / storybook ↔ phonics 는 충돌 X.
- 충돌 시 `AppError(409, '같은 이름의 동화책이 이미 있어요: "..."')`. 클라 `useStorybookMutations` 의 save/patch/generate(/Phonics) `onError` 가 `alert("⚠️ ...")`.
- 마이그 (룰 A 콘텐츠 우선): `pages` desc → `key_objects` desc → `characters` desc → `createdAt` asc 1위 keep, 나머지 `-1`/`-2` suffix. 21 그룹 / 23권 적용 완료. 스크립트 `packages/server/scripts/{dump-duplicate-titles,migrate-rename-duplicate-titles}.mjs`.

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

## 마케팅 자료 (2026-05-14)
`docs/marketing/` — 네이버 검색광고 API 실측 키워드 분석 + ContentFlow 임포트용 전략 템플릿 생성 도구. `data/` 4,024개 키워드 스냅샷, `scripts/naver-keyword-research.mjs` 재실행 시 자격증명 `NAVER_AD_*` 환경변수 필요. `generate-contentflow-template.mjs` 는 contentflow1 앱의 `public/strategy-templates/` 에 임포트 가능한 HTML 합성.
