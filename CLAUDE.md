# 탱고북 저작도구 — Claude Code 프로젝트 가이드

AI 기반 유아동 동화책 + 파닉스 + 어휘 저작도구. Gemini로 스토리/이미지/TTS 자동 생성.

> 이 파일은 **인덱스**다. 상세는 모듈별 `features/*/CLAUDE.md`, `docs/*`, memory 를 가리킨다. 완료된 마이그레이션·스크립트 나열은 `git log` / 코드 / memory 에서 확인.

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
docs/                                    # specs, architecture-notes, marketing, strategy
memory/                                  # 사용자 auto-memory (장기 컨텍스트)
```

## 아키텍처 규칙
- **백엔드 레이어**: `routes(URL 매핑) → controllers(req 파싱 + try/catch + next(err)) → services(비즈니스 로직, AppError throw) → repositories(R2) / providers(Gemini·R2 SDK 싱글톤)`
- **응답 통일**: `res.json({ success: true, data })` / 실패는 `throw new AppError(404, '메시지')` (errorMiddleware)
- **프론트 상태**: TanStack Query = 서버 데이터 / Zustand(`store/editor.store.ts`) = UI 상태만. **Zustand 에 서버 데이터 금지**.
- **API 패턴**: `apiGet/apiPost/apiDelete`(`lib/axios.ts`) → `features/{name}/api/*.api.ts` → `features/{name}/hooks/use*.ts`
- **Feature 모듈**: `features/{name}/{api,hooks,components,index.ts}`

## 디자인 시스템
**Single source of truth**: [docs/design-system.md](docs/design-system.md) — 색/폰트/컴포넌트 + GPT 시안 prompt 템플릿 + 시안 protocol. 새 화면 시안 받을 때 매번 참조.

- **색 토큰** (`design-system/tokens/colors.ts`): coral(CTA) · peach(Warm 배경/표면) · mint(Cool, 게임 톤 — 학습=peach / 게임=mint) · cream · ink(실질 검정) · semantic. 새 토큰 추가 시 Tailwind JIT 인식 위해 client dev 서버 재시작.
- **폰트**: Body/UI = Pretendard Variable / Display·Heading(`font-display`) = NanumSquareRound. `tailwind.config.ts` inline 정의 + `index.css` jsdelivr CDN @import.
- **아이콘**: 프리미티브 `<AppIcon src="category/animal.png" size={48} />`. 자산 `public/icons/{category,section,tab}/*`. 카테고리 sprite `/icons/category/sprite.webp`(3×3, LibraryPage `CATEGORY_SPRITE_MAP`). 매핑 없으면 이모지 폴백. 마스코트 호리 `public/mascot/hori/*.webp`.
- **그림체**: 책마다 `artStyle`(마지막 active) + `defaultStyle`(대표). `defaultStyle` = 라이브러리 표지 우선. `styleAssets[styleId]` 가 그림체별 표지·캐릭터·페이지 분리 보관. /editor2 그림체 칩 ⭐/☆ 로 대표 지정.
- **학습자 헤더**: `<PageHeader>`(`design-system/primitives/`) 공용 / `<GameHeader>`(`features/games/components/`) 게임 전용. LibraryPage(absolute overlay) · AppShell(sticky 자체 헤더) 는 별도.

## 학습자 화면 (MVP 정책)
- **사이드바**: 동화책 axis 만 active. 파닉스/어휘 = `comingSoon` 음영(코드/라우트 보존). `AppShell.PRIMARY_AXES`.
- **LibraryPage** (`/library`): hero 배너 + 검색바 floating. 책 카드 = defaultStyle 대표 표지 1장 + 제목 (대표 그림체의 ko 표지가 `publicByStyleLang` 비공개면 서버 `toSummary` 가 **공개 그림체 표지로 폴백** — 비공개 그림체 카드 노출 방지). 그림체 선택은 BookDetailPage 진입 후.
- **BookDetailPage** (`/library/:id`): AppShell 밖 풀폭. 그림체·언어 선택 바 + 16:9 표지 + 모드 카드 3개(책 읽기 coral / 영상 violet / 단어 amber). 표지 = `(effectiveStyle × lang)`: 활성 그림체는 top-level `primaryCoverByLang` 우선(CoverTab 저장처) → 폴백 그림체 `coverImage`(en 을 ko 보다 우선 X). CoverTab `setPrimary` 가 `styleAssets[활성]` 에도 mirror. ⚠️ 기존책 그림체별 ko/en 표지 미분리 多 + 버킷 오염 주의 → memory `book-detail-cell-public-cover`. **셀 단위 공개 필터**(`publicByStyleLang[style][lang]===false`=비공개): 그림체 칩=공개 언어≥1 그림체만 / 언어 토글=현재 그림체 공개 언어만 / 비공개 조합 자동 보정. 그림체 칩 라벨은 art-style-library 로드(커스텀 `style-*` 이름 표시). 부모 가이드 패널. 외부 SEO 페이지 `/library/:id/about`(BookSeoPage) 별도.
- **VocabularyStudyPage** (`/vocabulary/:unitId`): AppShell 밖. `VocabularyStudyContent` 공용(단어 미리보기 + 게임 카드 4).
- **한글 파닉스** (`/library/phonics/korean(/:unitId)?`): AppShell 밖 풀화면. 상세 → [features/phonics-learner/CLAUDE.md](packages/client/src/features/phonics-learner/CLAUDE.md).

## 글자 쓰기 채점 — `LetterFillCanvas` (paint mode)
모든 글자/단어 쓰기 통일 (영/한/일). 글자 회색 fill → 사용자 stroke `source-atop` 으로 글자 안만 painted → `coverage`(painted/mask 픽셀) ≥ `threshold(0.95)` 시 autoCheck 통과. `LINE_WIDTH=60`. 폰트 fidelity 100% (폰트 그대로 채점).
- 데모: `/letter-fill-demo` (TopBar 자료실 🎨).
- 도입 배경 + deprecated stroke library 인프라(미래 자모 단위 학습용 보관, 학습자 미통합) → memory / `docs/` 참조.

## 저작도구 자료실 페이지 (TopBar 📁 자료실 ▾)
- `/library-master` — 라이브러리 순서 + 카테고리 CRUD + 책 메타 편집. 셀 단위 isPublic(`Storybook.publicByStyleLang`) + 📊 표 보기(`BookMatrixModal`). 양방향 동기화 `features/library/lib/public-sync.ts`. **셀 비공개는 BookDetailPage 학습자 화면에도 반영**(2026-06-09, 그림체 칩·언어 토글 필터).
- `/vocabulary-table-ko.html` 📊 — 단어 마스터 표. 동화책 keyObject source, 난이도 분류 + 비명사 필터. `vocab-overrides API`(`GET/PUT /api/vocab-overrides` → R2). 영어판 `vocabulary-master.html`.
- `/key-object-editor.html` ✏️ — 페이지 텍스트 기반 keyObject 재분류 + 책별 편집. 분석 source `public/_analysis/text-based-classify.json`(gitignored).
- SEO/마케팅/전략 HTML → 아래 SEO·마케팅 섹션.

## 서버 gotcha
- **POST /api/storybooks** body 는 `{ storybook: {...} }` wrapper 필수. raw object → 500 "Cannot read properties of undefined (reading 'id')".
- **동일 title 차단**: `R2Repository.saveStorybook` 에서 신규/title 변경 시 체크. 충돌 = `AppError(409, '같은 이름의 동화책이...')`. variant `__L\d+$`(같은 baseId) / storybook↔phonics 는 예외.
- `normalizeStorybook` 가 `keyObjectImages[]` null entry 필터링(일부 책 silent 404 방지).

## 모듈별 가이드 (해당 폴더 작업 시 자동 로드)
- 동화책 (CRUD/사이드바/복사) → [features/storybook/CLAUDE.md](packages/client/src/features/storybook/CLAUDE.md)
- 학습 게임 → [features/games/CLAUDE.md](packages/client/src/features/games/CLAUDE.md)
- 롱폼 영상 → [features/longform-video/CLAUDE.md](packages/client/src/features/longform-video/CLAUDE.md)
- /editor2 (3축 variation) → [features/editor/CLAUDE.md](packages/client/src/features/editor/CLAUDE.md)
- 뷰어 + 디자인 시스템 → [features/viewer/CLAUDE.md](packages/client/src/features/viewer/CLAUDE.md)
- 오디오북 (Remotion) → [features/audiobook/CLAUDE.md](packages/client/src/features/audiobook/CLAUDE.md)
- 파닉스 (저작) → [features/phonics/CLAUDE.md](packages/client/src/features/phonics/CLAUDE.md)
- 파닉스 학습자 → [features/phonics-learner/CLAUDE.md](packages/client/src/features/phonics-learner/CLAUDE.md)
- 마케팅 (블로그/카드뉴스) → [features/blog/CLAUDE.md](packages/client/src/features/blog/CLAUDE.md)
- 마케팅 플랫폼 (ContentFlow 포트, /marketing) → [features/marketing/CLAUDE.md](packages/client/src/features/marketing/CLAUDE.md)
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
- 선택: `OPENAI_API_KEY`(Whisper) / `VITE_SUPABASE_URL`+`VITE_SUPABASE_ANON_KEY`(`packages/client/.env.local`, 없으면 게스트 모드)
- Supabase 셋업: `scripts/supabase-setup.sql`
- 마케팅 자격증명: `NAVER_AD_API_KEY/SECRET/CUSTOMER_ID` · `DATAFORSEO_LOGIN/PASSWORD`. **하드코딩 금지**.

## Gemini 모델
- Default 텍스트: `gemini-3.1-pro-preview` (`DEFAULT_TEXT_MODEL` shared / `config.gemini.textModel` server, `GEMINI_TEXT_MODEL` env override)
- 자동 폴백: overload(503/429/RESOURCE_EXHAUSTED 등) 시 `gemini-2.5-flash-lite`
- retry 래퍼 `withGeminiRetry`: 5회, exp backoff + jitter, 시도당 120s
- 배치 작업(seed 등)은 `--model gemini-2.5-flash-lite` 권장

## 코딩 컨벤션
- 파일명: PascalCase(컴포넌트) / camelCase(훅·유틸·API). 컴포넌트 named export (pages default).
- 에러: `AppError(status, message)` throw (console.error 대신).
- 주석: 자명한 코드 X, 복잡 로직만.
- import: `@tangobook/shared`(shared 타입) / `@/`(client 내부).
- 새 Feature: `api/{name}.api.ts` → `hooks/use{Name}.ts` → `components/` → `index.ts` → 라우트 `router/index.tsx`.

## R2 데이터 호환성
- 기존 동화책 211+권 저장됨. `Storybook` 인터페이스 호환 유지. 새 필드는 `optional`. snake_case 혼용은 [docs/architecture-notes.md](docs/architecture-notes.md).

## 주요 타입 위치
- `Storybook` / `Character` / `Page` / `KeyObject` / `BlendingExercise` / `ParentGuide` / `ReadingLevel` / `VocabularyUnit` / `BookManifest` / `LibraryConfig` / `ApiResponse<T>` → `@tangobook/shared`
- `AppError` → `packages/server/src/middleware/error.middleware.ts`

## 다국어(i18n) 번역
`SUPPORTED_LANGUAGES`(`shared/constants`, `code·label·nativeName·flag`) = 언어 단일 소스. **새 언어 = 여기 한 줄** → 클라 언어 토글/라벨 자동 derive(BookDetailPage `LANG_LABEL`). 표지는 `lang→en→ko` 폴백.
- 번역 스크립트 (`packages/server/scripts/`): `translate-extract/apply/verify.mjs --lang=<code>` + 공통 `translation-core.mjs`. **Gemini 아닌 Claude 직접 번역** — `_data/translations/<lang>/<id>.json`(언어무관 `t` 키)에 채워 R2 주입.
- R2 필드: `languages[]` · `titleTranslations` · `page.translations[lang]` · `KeyObject.nameTranslations` · `parentGuideTranslations`(신규). **vi 동화책 152권 전체**(명작 51 + 자연관찰 101, backup·파닉스 제외) 적용 완료.
- 상세 + **새 언어 추가 체크리스트** → memory `translation-pipeline-i18n-2026-05-30.md`.

## PRD 문서
`docs/PRD_*.md` (Master / AuthorTool_Storybook / AuthorTool_Phonics / Viewer / Marketing / v2 / UIUX_AuthorTool)

## SEO 인프라
SPA SEO 기본기. 상세 → memory `seo-infrastructure-2026-05-26.md`.
- 정적: `index.html`(meta/JSON-LD) · `robots.txt` · `sitemap.xml`(자동: `pnpm --filter server sitemap`) · `manifest.json` · `llms.txt`
- 동적: `src/lib/useSeo.ts` hook — LibraryPage · BookDetailPage · KoreanPhonicsStudyPage · BookSeoPage 적용.
- Prerender: `packages/client/scripts/prerender.mjs`(puppeteer). CMD `pnpm --filter client build:prerender`.
- 🔴 다음 할 일(메모리 참조): OG 이미지 6종 / BookSeoPage prerender 확장 / CI 통합 / GSC·네이버 등록 / Core Web Vitals.

## /marketing — ContentFlow 포트 ✅ Phase 0~5 완료 (main 통합)
ContentFlow AI 마케팅 자동화 SaaS 이식 — **전 단계(Phase 0~5) 완료, 포트 종료. 모든 `/marketing` 라우트 라이브**. `features/marketing/` 전담 모듈.
데이터 레인 2종: **supabase-direct**(`mkt_*` 테이블 싱글 오너 RLS + R2 `mkt/{projectId}/…`) = 콘텐츠/키워드/발행/전략/모니터링 키워드 / **server-proxy**(`/api/mkt/…` 시크릿 서버 전용) = 분석·모니터링 검색·SERP. Express `/api/mkt` (SSE 포함).
- Phase 1(콘텐츠 7채널) · 2(키워드/아이디어) · 3(발행: self_hosted `setInterval` 스케줄러 + 큐/대시보드/5단계 일괄예약 + `supabase-admin.provider` 서비스롤 + `mkt_deploy_webhook_queue`).
- **Phase 4(분석)**: GA4 서비스계정 JWT(RS256 `node:crypto`, no SDK)→runReport REST + SEO 감사(cheerio) + Meta/YouTube 인사이트 + 경쟁사(갭/순위, Gemini). client는 `recharts` 차트만, 시크릿은 서버에서 프로젝트별 resolve.
- **Phase 5(전략/모니터링/광고/SERP)**: 전략 HTML 뷰어+클라 파싱 import · 모니터링(지식인/블로그 스크레이프 + YouTube/IG + AI 댓글) · 광고 목업(client-only) · 경쟁사 SERP(DataForSEO).
마이그레이션은 **Phase 3에서만**(4·5는 기존 컬럼 재사용, 0 SQL). **415 마케팅 tests / 161 서버 mkt tests**. 남음 = main 머지(`finishing-a-development-branch`).
상세 → [features/marketing/CLAUDE.md](packages/client/src/features/marketing/CLAUDE.md) · memory `marketing-port-contentflow-2026-06-07.md`.

## 마케팅 자료
`docs/marketing/` — 키워드 리서치·통합·전략 파이프라인. 상세 → [docs/marketing/README.md](docs/marketing/README.md).
- 자료실 HTML: `/seo-strategy.html`(자동 생성, `generate-seo-html.mjs`) · `/operations-playbook.html` · `/viral-magnets-wireframes.html`.
- **릴스 홍보 영상** (소비자용 9:16, 24s): Remotion 컴포지션 `ReelsPromo`(`packages/remotion/src/compositions/ReelsPromo.tsx`) + 씬 `src/components/reels/*`. 자산은 R2 실제 표지를 `public/reels/`(styles·nature·grid·games·logo)로 복사. 구성: 세계명작(그림체 모핑)→자연관찰→한/영→학습게임→콘텐츠 바둑판→CTA(로고+7일 무료체험+tangobook.co.kr). 렌더 `npx remotion render ReelsPromo out/reels-promo.mp4`(BGM은 무음, 편집기에서 추가). 설계 [docs/superpowers/specs/2026-06-04-reels-promo-video-design.md](docs/superpowers/specs/2026-06-04-reels-promo-video-design.md).

## strategy.html — 가로 슬라이드 deck (Series A 투자자용)
**15 슬라이드** 가로 deck. 🔴 deck 작업 규칙: [docs/strategy-deck-rules.md](docs/strategy-deck-rules.md) **매번 참조** (헤더 통일·자랑 표현·AI 모델·마케팅 채널·§9 zero-knowledge 톤·§10 Phase 1 트랙션 전제).
- **구조 gotcha**: `<main>`(clipper) + `<div class="deck-track">`(translateX 대상) + `<section>`(100vw×100vh) + `.slide-content`(scale 자동 fit). ⚠️ main 직접 transform 시 identity matrix 됨 — 반드시 inner deck-track 분리.
- **자동 fit**: `fitSlide()` = `min(slideH/contentH, slideW/contentW, 1)` → `transform: scale(N)`. `document.fonts.ready`+`window.load`+`resize` 마다 재계산.
- narrative 백업 `/strategy-detail.html`. 일러스트 풀 `strategy-samples/illustrators/`.
- **전략 핵심**: 명작 동화 플랫폼 브랜딩(AI 양산 반대 포지셔닝) · 오픈 베타(게임화·별·호리 제외) · 풀스펙 9 + 라이트 31 + 자연관찰 30~40 → 주 2개 보강 · 정식 런칭 시 ⭐ 포인트 시스템 통합.
