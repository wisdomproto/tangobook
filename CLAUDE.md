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
- **UI 효과음**: `lib/uiSound.ts` 싱글톤(`playUi(name)`, 음소거 `tangobook-ui-muted`) + `components/GlobalUiSound.tsx` 위임 리스너 = 모든 버튼/링크에 자동 `tap`(개별 편집 X). `data-sound="select"` 교체 / `"none"` 억제. 특수음(book-open·page-turn·reward·play·success)은 호출부 `playUi` 또는 `data-sound` — **책 카드는 기본 tap**(book-open 시도했다가 하프 느낌이라 되돌림, 2026-07-03; book-open 은 뷰어 탭게이트만). 자산 `public/sounds/ui/*.mp3` 13종 — ⚠️ tap 은 `scripts/synthesize-ui-tap.mjs` 합성본(원본 zip tap 이 -67dB 무음+증폭 시 잡음 → 순수 합성 CC0 로 교체). 게임 사운드(`useGameSound`)와 별개. **`draw`(2026-07-09)** = 그리기/색칠 "글쓰는 소리" — `feedDrawLoop()`(uiSound)를 `ConnectTheDotsPlayer`·`LetterFillCanvas` pointerdown/move 에서 호출. **그리는 동안 draw.mp3 를 루프 재생, 멈추면(마지막 feed 후 220ms keepalive) 자동 정지**(pointerup 배선 불필요, `stopDrawLoop`은 음소거 시 즉시정지). mp3 = **실제 연필 필기 클립**(Pixabay Content License, `pencil-write` 2초 구간). 상세 → memory `ui-sound-effects-2026-07-02`.
- **기본 BGM**: `public/sounds/bgm/default-{1..5}.mp3`(90s 루프). ①**뷰어** — 저작 `backgroundMusicUrl` 없는 책에 **책 ID 해시로 5곡 중 고정 선택**(ViewerContainer `bgmUrl` useMemo, 저작 BGM 우선, 볼륨 30%×사용자 게인). ②**메인(브라우즈) 화면** — `components/AppBgm.tsx`(AppShell 마운트): **`main-{1..4}.mp3` 중 세션당 랜덤 1곡**(`MAIN_BGM_URLS`, 모듈 싱글톤이라 페이지 로드마다 한 번 고름·화면 이동 시 안 바뀜, 새로고침 시 재랜덤) 25% 루프 + **우하단 플로팅 🎵/🔇 토글**(배경음만, `tangobook-bgm-muted` 영속). (main-1~4 = 사용자 제공 30s 곡 4개, 2026-07-09. 뷰어/장면 BGM 은 여전히 default-{1..5}.) AppShell 이탈(뷰어/게임)=자동 정지, 부모설정 🔊 전체 음소거 시 버튼 숨김, autoplay 차단은 첫 제스처 폴백. ⚠️ dev 의 TanStack Devtools 버튼은 `buttonPosition="bottom-left"`(main.tsx) — 우하단 플로팅과 겹침 방지, 되돌리지 말 것.
- **반응형(모바일 375px)**: 학습자·부모·결제 전 화면 적응형(2026-07-03). 컨벤션=패딩 `px-4 sm:px-6 md:px-8`(모바일 base→step-up, flat `px-8` 금지)·제목 mobile base 작게→`sm:/md:` up·칩행 `flex-wrap`/`overflow-x-auto`·**한글 heading/자막 `break-keep`**·터치 `min-h-[44px]`. **파닉스 학습 페이지=모바일 슬라이드 드로어**(고정 사이드바 대신 `md:hidden ☰ 단원` + navOpen). 🔴 반응형 드로어는 `transition-transform`+`translate-x`(`--tw-translate-x` 꼬여 -288 고정) 말고 **`${open?'block':'hidden'} md:block` display 토글**. 실측 리뷰=`scrollWidth-innerWidth`. 상세 → memory `mobile-responsive-2026-07-03`.
- **법적 문서 + 푸터**(`pages/legal/`, `components/SiteFooter.tsx`, `config/business.ts`): 이용약관/개인정보/환불(`/terms /privacy /refund`) + 사업자정보 단일소스 `BUSINESS_INFO`(✅ 실값 입력 (주)다능·김용환·215-81-37321·주소·supportPhone 1599-0741, 🔴 남은 TODO=통신판매업신고번호 정부24 신고 후). 토스 가맹 심사·전상법 신원표시 필수. 결제 go-live 절차(테스트키 검증 완료) → memory `legal-docs-footer-2026-07-03`.
- **🔴 그림체 실명 비노출 정책**: 학습자·부모 화면에 그림체 이름(수채화·"3D 픽사" 등) 표기 금지(저작권 예방) — 항상 "그림체 N"(BookDetail 칩·리포트 분포카드 통일). 저작도구 내부 화면만 실명 OK. 실명 헬퍼 `getArtStyleLabel`(learning)은 보존.
- **`/admin` 운영 대시보드**(`features/ops/` + 서버 `/api/ops/overview`): Supabase first-party KPI(가입·활성 자녀·D1/D7 리텐션·매출·초대)+recharts 14일 추이+인기책 TOP10. 접근=**비번(env `OPS_PASSWORD`, 기본 8054, 서버 검증) or `OPS_EMAILS` 로그인**. `/ops`→`/admin` redirect. GA4는 미설치(획득분석 보조로 추후). 상세 → memory `ops-admin-dashboard-2026-07-03`.
- **`/members` 회원 관리 대시보드**(`features/members/` + 서버 `/api/ops/members*`): 회원 목록·자녀별 활동(shared 집계 공식 공유 = 부모 리포트와 수치 일치)·무료 체험/유료 부여·차단(Supabase Auth ban)·삭제(Auth deleteUser→accounts FK cascade). 목록 요약바(총회원·오늘활동·체험/구독/만료)+이메일 검색+행 클릭 상세 드로어(권한 부여 버튼·자녀 활동·결제 이력·이메일 확인 삭제). 인증 = /admin 과 동일(비번/OPS_EMAILS, `ops-auth.middleware`). 순수 로직=`members-grant.ts`(grant 검증)·`members-activity.ts`(자녀 요약, TDD). 스펙 → docs/superpowers/specs/2026-07-09-members-admin-dashboard-design.md

## 학습자 화면 (MVP 정책)
- **사이드바** (`AppShell.PRIMARY_AXES`): 일반/게스트 = **동화책**만. 파닉스/어휘/게임 = `devOnly`(`config/dev.ts` `DEV_EMAILS`=개발자 이메일만 노출, 코드/라우트 보존). **연속재생 진입은 사이드바 아님** — LibraryPage 최상단 "나의 재생 목록" 섹션(`PlaylistLibrarySection`, 로그인 시만).
- **LibraryPage** (`/library`): hero 배너 + 검색바 floating. 책 카드 = defaultStyle 대표 표지 1장 + 제목 (대표 그림체의 ko 표지가 `publicByStyleLang` 비공개면 서버 `toSummary` 가 **공개 그림체 표지로 폴백** — 비공개 그림체 카드 노출 방지). 그림체 선택은 BookDetailPage 진입 후. **🎨 그림풍 일괄 전환(2026-07-08)**: "세계 명작" 섹션 헤더에 **드롭박스**(수채동화풍·페이퍼 3D 아트·콜라주) — 선택 시 명작 표지 전부 그 그림풍으로 swap. **표지 기본값=수채동화풍**. `coversByStyle`(summary, styleId→URL) × `style-genre-map`(editor2 수동 지정) 매칭, 없으면 대표 폴백. 실명 비노출(장르 라벨만).
- **BookDetailPage** (`/library/:id`): AppShell 밖 풀폭. 그림체·언어 선택 바 + 16:9 표지 + 모드 카드(책 읽기 coral / **영상 violet = dev-only** `isDevEmail`, 준비중 / 단어 amber). 표지 = `(effectiveStyle × lang)`: 활성 그림체는 top-level `primaryCoverByLang` 우선(CoverTab 저장처) → 폴백 그림체 `coverImage`(en 을 ko 보다 우선 X). CoverTab `setPrimary` 가 `styleAssets[활성]` 에도 mirror. ⚠️ 기존책 그림체별 ko/en 표지 미분리 多 + 버킷 오염 주의 → memory `book-detail-cell-public-cover`. **셀 단위 공개 필터**(`publicByStyleLang[style][lang]===false`=비공개): 그림체 칩=공개 언어≥1 그림체만 / 언어 토글=현재 그림체 공개 언어만 / 비공개 조합 자동 보정. 그림체 칩 라벨은 art-style-library 로드(커스텀 `style-*` 이름 표시). 부모 가이드 패널. 외부 SEO 페이지 `/library/:id/about`(BookSeoPage) 별도.
- **VocabularyStudyPage** (`/vocabulary/:unitId`): AppShell 밖. `VocabularyStudyContent` 공용(단어 미리보기 + 게임 카드 4).
- **한글 파닉스** (`/library/phonics/korean(/:unitId)?`): AppShell 밖 풀화면. 상세 → [features/phonics-learner/CLAUDE.md](packages/client/src/features/phonics-learner/CLAUDE.md).

## 글자 쓰기 채점 — `LetterFillCanvas` (paint mode)
모든 글자/단어 쓰기 통일 (영/한/일). 글자 회색 fill → 사용자 stroke `source-atop` 으로 글자 안만 painted → `coverage`(painted/mask 픽셀) ≥ `threshold(0.95)` 시 autoCheck 통과. `LINE_WIDTH=60`. 폰트 fidelity 100% (폰트 그대로 채점). **동화책 단어 익히기 경로도 통일 완료**(2026-07-02 — VocabularyStudyContent 가 레거시 `WordWritingPlayer` 직접 import 로 레지스트리를 우회하던 잔재 제거 → `Korean/EnglishWordWritingPlayer`. 레거시 파일은 미사용 보존).
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
- **`koCompletion.pagesTts`(summary 완성도 플래그, `r2.repository.ts` `toSummary`)** = **글 있는 페이지만** TTS 요구(`텍스트 페이지.every(ttsUrl)`) — 텍스트 없는 마지막 빈 페이지까지 요구하던 `pages.every` 는 완비된 책을 오분류(공룡 등 연속재생 선택기에서 통째로 빠짐, 2026-07-10 fix). 나레이션 없는 책 **배치 생성** = `scripts/generate-storybook-narration.mjs`(로컬 서버 `/api/tts/generate` gemini + `translation-core` 저장, `--dry-run/--book/--limit`, 멱등). 현재 공개 149권 **전부 나레이션 완비**. 상세 → memory `narration-backfill-completion-flag-2026-07-10`.

## 영상 렌더 화질
- **Remotion 렌더**(오디오북·이북: `audiobook.service.ts`·`book-v2.service.ts`·`scripts/mosquito-render.ts`) `renderMedia` = `imageFormat:'png'`(기본 jpeg/q80 아티팩트 제거) + `scale:1.5`(컴포지션 720p→1080p) + `crf:16`. **longform**(`longform.service.ts`) = 1080p + preset `medium` + `crf 18`. 컴포지션 기본 해상도 `RESOLUTIONS`(`packages/remotion/src/types.ts`)는 720p — 4K는 생성 이미지 해상도부터 올려야(Imagen `sampleImageSize`).
- **AI 영상 업스케일**: `scripts/upscale-for-upload.sh` (fast=lanczos 1080p / ai=Real-ESRGAN x4plus). Grok 영상=720p 천장. 상세 → memory `video-quality-upscale-2026-06-30`.

## 모듈별 가이드 (해당 폴더 작업 시 자동 로드)
- 동화책 (CRUD/사이드바/복사) → [features/storybook/CLAUDE.md](packages/client/src/features/storybook/CLAUDE.md)
- 학습 게임 → [features/games/CLAUDE.md](packages/client/src/features/games/CLAUDE.md). **어휘 게임(사이드바 "어휘 게임" → `/games/vocab`, 2026-07-08 부활)**: 세계명작 **랜덤 1권**을 `deriveStorybookUnit` → `VocabularyStudyContent`(책 상세 "단어 익히기"와 동일)에 공급 → **동화책 게임 4종**(그림짝·블록·그림 그리기·따라쓰기) 한/영 토글+🎲 다른 책. 파일 `pages/RandomVocabStudyPage.tsx`. 🔴 **1권인 이유**: 게임 플레이어는 `storybookId` 하나로 (1)정답 음원 프리워밍 cache 키 (2)정답 후 "그 단어 나온 동화책 페이지" 장면 리빌 을 결정 — 여러 책 mix 시 storybookId 가 가짜라 음원이 정답 순간 concat 되어 늦고 장면 리빌도 안 뜸(초기 mix 설계 폐기). 진짜 책 1권을 공급하면 책 안 게임과 완전히 동일 경로라 그 fix 들을 그대로 물려받음(keypoints 도 실책 데이터라 그림 그리기 활성). (구 `RandomBlockGamePage` 블록 전용 라우트는 보존.)
- 롱폼 영상 → [features/longform-video/CLAUDE.md](packages/client/src/features/longform-video/CLAUDE.md)
- /editor2 (3축 variation) → [features/editor/CLAUDE.md](packages/client/src/features/editor/CLAUDE.md)
- 뷰어 + 디자인 시스템 → [features/viewer/CLAUDE.md](packages/client/src/features/viewer/CLAUDE.md)
- 오디오북 (Remotion) → [features/audiobook/CLAUDE.md](packages/client/src/features/audiobook/CLAUDE.md)
- 파닉스 (저작) → [features/phonics/CLAUDE.md](packages/client/src/features/phonics/CLAUDE.md)
- 파닉스 학습자 → [features/phonics-learner/CLAUDE.md](packages/client/src/features/phonics-learner/CLAUDE.md)
- 마케팅 (블로그/카드뉴스) → [features/blog/CLAUDE.md](packages/client/src/features/blog/CLAUDE.md)
- 마케팅 플랫폼 (ContentFlow 포트, /marketing) → [features/marketing/CLAUDE.md](packages/client/src/features/marketing/CLAUDE.md)
- Auth (Supabase) → [features/auth/CLAUDE.md](packages/client/src/features/auth/CLAUDE.md). **온보딩 UX**(가입 이메일확인 대기화면·부모/자녀 프레이밍·인라인 에러·아이 2명+ ProfilePicker 게이트+헤더 전환칩) → memory `ux-review-2026-07-01`.
- 결제/유료화 (토스 단건 기간권 + paywall 게이팅 + 친구초대 referral) → memory `payment-toss-monetization-2026-06-30` · UX개선 `ux-review-2026-07-01` · **런칭 전 P0/P1 픽스 `prelaunch-review-fixes-2026-07-02`**. 두 스위치(`features/access/config.ts`): `PAYWALL_ENABLED`=**true(2026-07-08 정식 유료화 ON — 결제 진입점 노출+게이팅 적용; ⚠️현재 `test_` 키라 실결제는 `live_` 키 교체 필요, 오픈 직전 `reset-trials.sql` 재실행 권장)** · **`LOCK_FOR_GUESTS`=true**(출시 전 게스트 소프트게이팅 — **미로그인=무료 11권만**(세계명작 3권 신데렐라·인어공주·백설공주 + **카테고리별 첫 책 1권씩 8권**(람포린쿠스·장수풍뎅이·캥거루·바다거북·오리·버섯·극지방의 신비·뇌와 심장 이야기, 2026-07-02), `isAccessibleForFree!==false`), 나머지 잠금; 로그인=전체 열람). entitlement 판정=`shared/utils/entitlement.ts`(`canReadBook`=isAccessibleForFree!==false OR isEntitled), 결제두뇌=`features/access`. **무료 체험 7일 앵커**=`computeAccess` 가 `trialStartedAt`(entitlements 컬럼) 있으면 그 시각+7일, 없으면 **가입일 폴백**(신규=가입 후 7일). 기존회원 리셋/정식오픈 일괄시작=`scripts/reset-trials.sql`(모든 계정 `trial_started_at=now()`, 초대보너스는 위에 유지). **로그인 시 남은 일수 상시 노출** = 사이드바 `TrialBadge`(`features/access/components/`, "🎁 무료 체험 N일 남음" / 만료·오픈전="정식 오픈 전 · 전권 무료") + PromoBanner(일수 우선 카피). ⚠️ trial 은 가입일부터 흐르므로(유료화 OFF여도) 오래된 계정은 만료 표시 → 리셋으로 해결. **친구초대=코드 기반 + 양방향(드롭박스식)**: redeem RPC(`supabase-referral.sql`, 마이그 `referral_two_sided_reward`+`referral_case_insensitive_and_delta`)가 **초대자·피초대자 둘 다 +7/최대28** — **코드 비교 대소문자 무시(`lower()`) + 실제 증가분 `inviterDelta`/`refereeDelta` 반환**(cap 시 거짓 +7 축하 방지, reason enum=`invalid_code|self|already_referred|race`). `InviteButton`/`InviteFriendsPage`=**초대 메시지(링크 포함) 복사**(`payment/lib/invite-message.ts`, `/invite/:code` 링크 → 랜딩 자동 redeem) + `RedeemCodeInput`(수동 입력 폴백). AuthContext 자동 redeem=응답 후 코드 제거(실패 시 보존 재시도)+entitlement invalidate+토스트 baseline. **진입=사이드바 "친구 초대"(로그인 시)→`/invite-friends`** + 온보딩 + 부모설정. **ParentGate(어른 확인=곱셈, sessionStorage 15분)가 `/parent/*`·`/subscribe` 래핑** — 아이 결제/계정삭제 도달 방지(`PIN_REQUIRED=false` 유지). **구독 진입은 `PAYWALL_ENABLED` 일 때만**(부모설정 버튼 숨김, SubscribePage=키 미설정 시 "준비 중" 안내). **🎉 오픈 기념 반값 할인(2026-07)**: `PLANS.amount`=**할인가(실 결제액)** 월 4,950(정가 9,900)·**연 39,500(정가 79,000, 월 대비 33%↓ — 2026-07-08 연간 할인폭 강화)** + `originalAmount`=정가(취소선·50% 배지, PlanCard 자동 계산·**카드 텍스트 가운데 정렬**) + `LAUNCH_PROMO_LABEL` 헤드라인. **진입=부모 설정 → 💳 멤버십 → 이용권 구매하기 → `/subscribe`** — 종료 시 plans.ts 한 파일만 되돌리면 됨(주석에 절차). **가입 의도 CTA=`/login?mode=signup`**(로그인 폼 아닌 가입 폼 직행 — 배너/페이월/초대랜딩). 사이드바 하단 **"⚙️ 부모 설정"**(로그인 시). LockBadge=`🔒 잠금`. PaywallNotice=guest 도 무료책 탈출로+✕. **배너**=게스트 "회원가입하면 7일 무료 체험"·"친구를 초대하면 무료 기간이 서로 7일씩". **리포트 진입=사이드바 "학습 리포팅"(로그인 시만)**. BookDetail 그림체 칩=`그림체 N`. ⚠️ 잠긴 책 "단어 익히기"는 미게이팅(맛보기 — 정책 미결).
- 연속재생 (`features/continuous/` — 동화책 여러 권 자동 이어재생/잠자리) → memory `continuous-play-2026-07-01`. **진입=LibraryPage "나의 재생 목록" 섹션**(2026-07-08 사이드바 버튼 제거 → 메인화면 주도: 로그인 시 항상 표시, 저장세트 0개면 "이어재생 만들기" CTA, **헤더 접기/펴기 기본 접힘**, 세계명작 위). 사이드바 위계 재정리(2026-07-08): 아이존=동화책+**어휘 게임**만, 부모 작업(리포팅·초대·연속재생·설정)은 하단 부모존/메인화면으로 분리. **선택기(`/continuous/new` 빌더)는 나레이션 있는 책만**(`koCompletion.pagesTts` — 무음 책 제외; PageSubtitle은 TTS 재생 중일 때만 자막 그림) + **언어 한/영만**(2026-07-10, 연속재생=한·영 나레이션 지원) + **책 리스트=카테고리별 섹션+검색**(메인 라이브러리와 동일 `makeCategoryComparator`, `features/library/lib/category-order` 로 추출·공유). **빌더 개편(2026-07-10)**: 상단(헤더·선택·언어·검색) 고정 + 책 그리드만 내부 스크롤(AppShell=window스크롤이라 `position:sticky` 안 먹음 → `h-[calc(100dvh-헤더)]` flex 컬럼) · **그림풍 드롭박스**(표지 미리보기만, 메인과 동일 `coversByStyle×style-genre-map`, 라벨 "그림체 고르기") · **선택한 책=표지 썸네일+장르칩**(선택 그림풍 우선) · **액션(세트이름·지금재생·저장)=헤더 우측**(하단 고정바 제거) · **뒤로가기 → /library**(메인, 홈 `/continuous`에도 back 추가). ViewerContainer 재사용(`playlist` prop: `key={bookId}` remount·reward 3곳 가로채기·**autoStart:index>0**(🔴 첫 책은 탭 게이트 유지 — `autoStart:true` 로 하면 브라우저가 첫 책 TTS autoplay 차단→무음인데 `autoPlayTts` ON이라 stall-guard가 무음책을 순식간에 넘겨 "다 읽었어요" 직행 버그. 그 탭이 오디오 해금→2번째부터 자동)·**`onStart`**(게이트 탭→store `started`→컨트롤 숨김)·속도·**paused**·stall가드). **재생 페이지가 `?autoplay=1` 강제**(사용자 `autoPlayTts` OFF 여도 연속재생은 나레이션 필수 — 안 하면 BGM만). **컨트롤(`ContinuousControls`)**: 시작 화면(탭 게이트)엔 **표시**(속도·슬립 세팅, z-70 게이트 위)→시작하면(`started`) 숨김→재생 중 **화면 아무 곳이나 탭=컨트롤 토글**(숨김↔표시 대칭: hidden=전체화면 탭레이어 z-70 / visible=바(z-70) 밖 숨김 백드롭 z-65, 둘 다 started 후에만 떠서 게이트와 안 겹침; 보이는 "컨트롤 보기" pill 제거). **나가기**: 재생 화면 **우상단 상시 🏠**(→/library) + 컨트롤 안 🚪(→/continuous). **그림체=책 대표(defaultStyle) 우선**(2026-07-02, `?style` 미지정 시 뷰어 공통 폴백 — 라이브러리 표지와 일치). `/continuous`·`/continuous/new`(빌더)·`/continuous/edit/:id`(세트 편집 — 카드 ✏️, 프리필+`useUpdatePlaylist`)·`/continuous/play`(풀스크린). 저장세트=Supabase `playlists`. LibraryPage 프로모배너=로그인 사용자도(무료 N일/친구초대).
- Learning Reports (부모 리포트 — **동화책 중심 + 2026-07-02 히어로 리디자인**: `WeeklyHeroCard`(호리+이번주 한줄+7일 리듬 도트)가 숫자카드 3개 흡수, `RecentBooksStrip`=완독 게이트 없이 표지 전부(완독=🎉리본/미완=읽는중 칩), 로딩 스켈레톤, 빈상태 호리+CTA. **학습한 단어(2026-07-10)=`MetWordsCard` 카드 그리드**(책표지+📖읽음/🎮게임 배지+전체보기, 언어=단어 문자로 분류해 한/영 섞임 fix). **그림체=`ArtStyleGenreCard` 메인 3종 장르명**(수채동화풍·페이퍼3D·콜라주). KST 집계 `learning/lib/aggregate.ts`(`wordDetails`/`groupByGenre`/`recentBooks`/`weekActivity` 등), 파닉스/어휘/활동 탭 = dev-only) → [features/learning/CLAUDE.md](packages/client/src/features/learning/CLAUDE.md) · memory `learning-report-words-genre-2026-07-10` · `learning-reports-parent-review-2026-07-01`.
- 별/호리/놀이터 → [features/rewards/CLAUDE.md](packages/client/src/features/rewards/CLAUDE.md)
- Hori 아케이드 → [features/arcade-games/CLAUDE.md](packages/client/src/features/arcade-games/CLAUDE.md)
- 어휘 단원 → [features/vocabulary-unit/CLAUDE.md](packages/client/src/features/vocabulary-unit/CLAUDE.md)
- 횡단 (커리큘럼/자료실/캐싱/자산/snake_case) → [docs/architecture-notes.md](docs/architecture-notes.md)
- 모기 이북 (단발 콘텐츠 — `/ebook/mosquito` 한·일 인터랙티브 이북 + 언어별 mp4, Remotion+TTS) → memory `mosquito-ebook-2026-06-20`
- 호리네 생활동화 (호리(아기호랑이) 마스코트 앙상블 8인 기반 **45편 라인 = 대본 전편 완성**(2026-07-08, comic-writer 집필 → comic-editor 전편 검수 P0/P1 0건). 대발이 34편 나레이션 **실측 분석**(youtube-transcript-api)로 "캐릭터=결점 배역" 공식 역설계 → 45편 커리큘럼([curriculum-45.md](docs/saenghwal-donghwa/curriculum-45.md), 7트랙 A건강위생8·B자립6·C안전8·D감정8·E관계8·F가족4·G일상3) + 5비트 작법. **HTML 저작도구**=`public/saenghwal-{회차}.html`(45편 + `plan`) + **`saenghwal-index.json`=회차 SSOT**(`{file,label,title}` — label=번호+테마, title=컨텐츠 제목; 새 회차는 여기 한 줄만 추가하면 전 페이지 반영). **좌측 슬라이드 사이드바(2026-07-10)**: 상단 탭 바 제거 → `saenghwal-core.js`가 전 페이지(회차+plan)에 ☰ 토글 좌측 드로어 주입 = 번호순 회차 리스트(컨텐츠 제목)+회차별 **완성/진행 중 상태 배지**(클릭 순환 ⬜→🟡→✅) + **📝 메모 버튼**(상태 배지 옆, 클릭 시 모달 textarea 편집·멀티라인). 상태·메모 모두 **R2 저장·공유·영구**: `/api/saenghwal-status`(`_index/saenghwal-status.json`={docId:'wip'|'done'})·`/api/saenghwal-memo`(`_index/saenghwal-memo.json`={docId:memo}), 라우트 `saenghwal-{status,memo}.routes.ts`(vocab-overrides 패턴). plan.html 도 core.js include. 기획서(`saenghwal-plan.html`) 6장에 45편 클릭 목록·상태. 쪽별/전체 프롬프트 복사·컷 이미지 붙여넣기 `/api/comic-assets/{docId}`(R2) → **TopBar 자료실 "🐯 호리네 생활동화 기획서"**. **집필="○○ 편 써줘"→comic-writer(생활동화·학습만화 공용 작가)→comic-editor 검수** — 그림체 **니들펠트 확정**, `public/saenghwal-core.js`가 스타일 SSOT + @image1~8 고정캐스트 + @image9~ 단역(회차 `window.SH_GUESTS`) + 쪽별 [등장] 자동감지 + 전체/쪽별 프롬프트 합성 + 단역 레퍼런스 섹션 + **"🎬 이 화 등장" 캐릭터 한 줄 스트립**(고정캐스트=기획서(`saenghwal-plan`) 저장 레퍼런스 이미지, 단역=회차 저장, @imageN 대조). 새 회차=기존 회차 HTML 복제(guest 편은 yangchi, 무guest는 SH_GUESTS 줄 삭제) + index.json 등록. SCENE엔 그림체 문구 금지(core가 붙임)·캐릭터 인식 토큰(Hori/Mom tiger…) 필수. **🔴 SCENE 밀도=학습만화 동일 5라벨 풀 콘티**(컷/장소·시간/인물(캐릭터별 포즈·표정)/배경·소품/톤, 영문 요약 금지, `<b>라벨</b>…<br/>`)). **📚 editor2 연동(2026-07-10)**: 기획서 완성 대본(HTML `<p class="ko">`글 + `<pre class="scene">`콘티 + comic-assets 삽화 + 등장 캐스트)을 editor2 `category:"생활동화"` storybook 으로 연동/재생성 = `packages/server/scripts/link-saenghwal-illustrations.mjs`(회차↔책 매핑 `saenghwal-book-map.json`, in-place pages/characters 교체·id/keyObject 유지, 무책+삽화 회차 `--create` 신규생성, 멱등). 제목 앞 번호 = `number-saenghwal-titles.mjs`(`--sequential` = 빈틈없는 01~N 연속, 순서 유지 · 제목 정렬=순서). ⚠️ editor2 48권은 구 커리큘럼 잔재(orphan 13권 — 분리수거·생일 등)라 45회차와 1:1 아님 → 번호만 슬롯 배정, **콘텐츠 연동표와 분리**(덮어쓰기 방지). editor2(생활동화 책·한국어 탭)에 기획서와 동일한 @imageN 배치 프롬프트 복사 = PagesTab **🖼️ 생활동화 전체 프롬프트**(전 페이지) + 각 PageCard **🖼️ 프롬프트**(쪽별 단일). 니들펠트 스타일+@image1~8 고정캐스트+SCENE·[등장] 합성(`features/editor/lib/saenghwal-batch-prompt.ts`, `composeSaenghwalBatchPrompt(sb, subset?)`, STYLE/캐스트는 saenghwal-core.js SSOT 사본). → [docs/saenghwal-donghwa/](docs/saenghwal-donghwa/) · memory `hori-saenghwal-donghwa-2026-07-01` · `saenghwal-editor2-linkage-2026-07-10` · `debari-benchmark-analysis-2026-07-05`
- 학습만화 「타임 티코」 (초등 저학년 — **프랜차이즈=카테고리 구조**: 브랜드(고정 캐스트 5인+티코 머신)→카테고리(시대여행·극한생존·우주·인체…포맷 축)→볼륨(대체로 단독편, 필요시 다부작 아크). **선형 시즌 아님 — 볼륨 사이 하드 브릿지 X**("티코가 이번엔 ~로 데려간다"로 바로 시작). 최상위 인덱스 SSOT=`public/learning-comic-franchise.html`(카테고리 맵·볼륨 7규칙·브랜드 연속성·새 볼륨 체크리스트). **"N화 써줘"→comic-writer 집필→comic-editor 4축 검수 사이클**, 쪽별 프롬프트 복사·**10쪽 묶음 프롬프트**(GPT 배치 생성용, 캐릭터 @image1..(메인 우선→게스트) + 쪽별 [등장]·[의상] 자동추출 + 집합어("아이들") 주인공 명시 + **보리·노아 과거 의상 변형 레퍼런스**)·수정지시(`/api/comic-feedback`)·이미지 붙여넣기/삭제(`/api/comic-assets`→**R2** `comic-assets/{docId}/{key}.{ext}`, 로컬/프로덕션 공용·재배포에도 유지), 캐릭터 시트 5종 확정. **저작도구 공유 스크립트 `public/learning-comic-core.js`** — 회차 HTML 은 `window.EP_GUESTS`·`COSTUME_ZONES` 2줄만 정의+include(신규 회차·S2 도 동일, 변환기 `server/scripts/comic-inject-core.mjs`). **🔴 집필 룰: 한 쪽=한 이벤트**(애니 아님, 그림책 — 목격/껴듦 분리, 별개 플롯신호 감정컷 병치 금지)·**🔴 화=가변 분량(본편 26~33쪽+부록 3쪽; "36쪽 고정" 폐기 2026-07-07 — 억지 패딩이 지루함 주범)**: 표준 단독편 28~30쪽·33쪽은 오리진/피날레/아크 클라이맥스만·**결론 1회 원칙**(같은 사실·추리·감정 결론 3쪽+ 반복 금지 — 그림책은 한 쪽=한 장이라 반복=쪽 낭비)·**비트 변주**(착지 카운트다운·통신 두절·부품 몽타주 정형구는 볼륨당 3~4회만 원형, 나머지 변주)·**피날레(≤33쪽) 그림사건 최대 2개**·**부록 팩트 축소/왜곡 금지**·**🔴 배터리·제한시간("해 뜨기 전 귀환") 폐기(2026-07-05, QA 말썽+다일구조 모순)** — 게이지=부품 수집(12칸)만, 긴장은 미스터리·모험·0호로, 티코 말버릇 "삐빅! 나만 믿어, 인간들!"(바이블 §룰2 뒤 note). **🔴 연속성(설정-회수) 기계검증 필수**: LLM 검수는 "읽기"라 멀리 떨어진 설정↔회수(회상대사 원인장면 등)를 계속 놓침 → 회차 완성/수정 후 `node packages/server/scripts/comic-continuity-check.mjs [epNN]` 로 **FAIL 0** 확인(부품게이지 단조·위험회상어·두-사건 후보 + 배터리 잔재 감시 + **🔁키워드 과반복 렌즈**=결론 반복 후보, 독자 텍스트 스코프). 4축 검수와 별개 렌즈. **🔴 현대 아이 시점 상식 렌즈**(2026-07-06): 보리·노아=지금 한국 초등학생 → 이미 아는 것(한글·직각·자석·이순신 등 위인)을 처음처럼 놀라거나 몰라야 할 전문사실(세계기록급·정확한 연도)을 티코피디아 없이 선수 금지, **시대 고유 '방법'(밧줄 직각·거울글씨·태양석 항해) 학습은 OK**. 12화 전수 8건 교정, writer 룰6·editor 검수축6·plan 룰6·franchise 룰8에 상시 명문화. **① 시대여행 Vol.1**(시간여행 12화, SSOT=`public/learning-comic-plan.html`+회차 `learning-comic-ep{NN}.html` 탭 자동감지, 전편 콘티+**12화 종합검수+연속성 패스+checker 반영 완료**: P0 2건 해결(3화 공룡 각인·11화 첫비행 거리)·공통정책 3종·연속성 실버그 9회차 수정·core.js 이식·checker FAIL 0) · **② 극한생존 Vol.1 「무인도 생존편」**(순수 생존, 시간여행 없음 — 완전체 티코가 먼 무인도 탐험 데려가다 **폭풍에 비행정 추락**·불시착[구 '우주 출발→시간코어 고장' 폐기, 2026-07-04 카테고리 재편], SSOT=`public/learning-comic-s2-plan.html`+회차 `learning-comic-s2-ep{NN}.html`, 조상 생존술+현대과학+"건강해지는 몸"(show-don't-tell·장치금지)+부모감사·철듦, 티코 되찾은 기능 활용(거들기·룰5 유지), **봉수 박사 섬 내내 교신 없음**(피날레에 첫 도달), 피날레=**열린 결말**(ep12와 bookend, 우주 재도전 떡밥 폐기), v2 6화 미션 묶음·전편 콘티+검수 완료; 구 12화판 백업 `docs/comics/s2v1-backup/`). **③ 패딩 제거 재단(2026-07-07)**: 편집장 페이싱 검수로 "36쪽 고정" 패딩 진단(주범=분량보다 리듬 단조+결론 반복) → 규칙 가변화 + checker 키워드 과반복 렌즈 + **7편 재단**(s2-5·ep04·ep05·ep06·ep08·ep09·s2-3, 감축 6~7쪽/편, 전편 checker PASS+편집장 승인) → memory `time-tiko-comic-2026-07-03` · `time-tiko-pacing-recut-2026-07-08`

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

## 다국어(i18n) — 콘텐츠 + UI + SEO (해외 진출 1단계 완료, 2026-07-12)
`SUPPORTED_LANGUAGES`(`shared/constants`, `code·label·nativeName·flag`) = 언어 단일 소스. **새 언어 = `/add-language <code>` 한 줄**(스킬/커맨드 `.claude/commands/add-language.md` = 전체 파이프라인 오케스트레이션). 현재 11개(ko·en·ja·zh·es·fr·de·vi·th·ms·id), **zh = 간체**. 🔴 **콘텐츠·UI 실제 완비 = ko·en·vi·zh·th 5개**(마케팅 타겟). ja·es·fr·de·ms·id 는 코드상 지원되나 콘텐츠·UI 미번역 → `/add-language` 로 추후.
- **콘텐츠 번역** (동화책 149권): `translate-extract/apply/verify.mjs --lang=<code>` + `translation-core.mjs`. **Claude 직접 번역**(Gemini X) — `_data/translations/<lang>/<id>.json`(언어무관 `t` 키) 채워 R2 주입. R2 필드 `languages[]`·`titleTranslations`·`page.translations[lang]`·`KeyObject.nameTranslations`·`parentGuideTranslations`. **vi·zh·th 149/149 완비**. 🔴 배치 번역 서브에이전트 = **"워커, Agent 금지, 직접 Read/Edit" 프롬프트 필수**(오케스트레이터 환각 방지). apply 는 책단위 원자성(미완 자동 skip). languages drift(콘텐츠 있는데 플래그 누락) 일괄 점검.
- **UI i18n** (`packages/client/src/i18n/`): **react-i18next**, ko eager 번들(폴백)+그 외 lazy glob, `setUiLanguage(code)`(localStorage `tangobook-ui-lang`). **11 네임스페이스**(common·shell·access·auth·library·bookDetail·payment·viewer·games·learning·continuous, ~500키) × **en·vi·zh·th 완역**(`locales/<lang>/*.json`). 부모설정에 언어 셀렉터. 🔴 **ko 미지정 시 기존 동작 불변**. 검증 `packages/client/scripts/verify-locales.mjs`(키파리티+보간+Trans마크업).
- **데이터 라벨 다국어** — 카테고리명·책제목·그림풍 장르는 R2 데이터(t() 아님) → 고정 딕셔너리로 표시 시점 치환: `features/library/lib/category-i18n.ts`(`useCategoryLabel`) · `lib/art-style-genre.ts`(`genreLabel`/`useGenreLabel`) · 책카드 `titleTranslations[uiLang]`. 내부 key(한국어) 유지.
- **다국어 어휘 게임** (vi/zh/th, 2026-07-12) — `/vocabulary/:id`가 5개 언어(ko·en·vi·zh·th) 토글. ko/en=기존 게임, **vi/zh/th=공용 2게임**(`order-block` 탭 순서맞추기·`order-writing` 따라쓰기). 핵심=`splitUnits(word,lang)`(zh 한자/vi 성조글자/th `Intl.Segmenter` 결합단위) + 폰트(Noto SC/Thai)+캔버스 폰트게이트. **영어 블록도 드래그→탭 전환**. **단어 발음=Google Cloud TTS**(native 보이스, STT 검증; `providers/google-tts.provider.ts` + `scripts/generate-vocab-tts.mjs` → `key_objects[].ttsUrls[lang]`. 🔴 Gemini TTS는 짧은 CJK/타이 무응답이라 부적합). → [features/games/CLAUDE.md](packages/client/src/features/games/CLAUDE.md) · memory `multilingual-vocab-games-2026-07-12`.
- **SEO 다국어**: `/:lang/library/:id/about`·`/:lang/guide/:hub` SSR(`seo-ssr.service` lang 인자) + hreflang(x-default=ko). 🔴 `hasAboutLang(book,lang)`=titleTranslations+parentGuideTranslations 존재로 판정 → hreflang·sitemap·라우트 전부 자동 derive(언어추가 코드0). 문자열 `shared/constants/seo-i18n.ts`. sitemap 언어별 URL 자동(912).
- **다국어 표지** (2026-07-12, ✅ main·배포됨) — 표지 텍스트가 이미지에 박혀 타언어 노출 문제. **접근 B(구운 이미지, 런타임 오버레이 아님)**: ko/en=원본 표지 유지, **vi/th/zh=Gemini로 텍스트 제거한 클린 표지에 제목 구워 `styleAssets[style].primaryCoverByLang[lang]` 등록**(앱이 이미 언어별로 읽는 슬롯), 세계명작=표시 그림체별(`availableStyles`). 오버레이 룩=주아/站酷快乐/Baloo 2/Noto Thai · 흰색 · 상단 글래스 필(폰트 SSOT `shared/constants/cover-fonts.ts`). 파이프라인(멱등)=`generate-clean-covers.ts`(충실도 게이트)→`register-lang-covers.ts --phase=manifest`→(client)`bake-lang-covers.mjs`(puppeteer 렌더)→`--phase=ingest`→`--phase=report`. **149권 중 103 완비(504장)**. 🔴 **재시도 TODO=Gemini 거부 46권**(`out/missing-covers.json`, PROHIBITED_CONTENT). 런타임 렌더 `<BookCover>`(design-system, 폴백 안전망). **editor2 「🖼️ 그림체별 클린 표지」 매트릭스**(EditorPanelV2 헤더 버튼→`CleanCoverMatrixModal`, 세계명작+자연관찰 × availableStyles 클린 표지, 빈칸=미생성, summary `availableStyles` 추가). 상세 → memory `multilingual-cover-images-2026-07-12`.
- 상세 → memory `i18n-multilingual-2026-07-12` · `translation-pipeline-i18n-2026-05-30` · `global-expansion-design-2026-07-11`(투트랙 결제·세금 등 해외 설계).

## PRD 문서
`docs/PRD_*.md` (Master / AuthorTool_Storybook / AuthorTool_Phonics / Viewer / Marketing / v2 / UIUX_AuthorTool)

## SEO 인프라
SPA SEO 기본기. 상세 → memory `seo-infrastructure-2026-05-26.md`.
- 정적: `index.html`(meta/JSON-LD) · `robots.txt` · `sitemap.xml`(자동: `pnpm --filter server sitemap`) · `manifest.json` · `llms.txt`
- **OG 이미지**: `og-image.png`(기본/사이트) · `og-invite.png`(친구초대 레퍼럴) → 생성기 `pnpm --filter server og`(`generate-og-images.mjs`, sharp+librsvg, 번들 Pretendard `scripts/assets/og-fonts/`). 1200×630, 로고 webp 합성. 책별 OG = BookSeoPage 가 실제 표지 URL 사용.
- 동적: `src/lib/useSeo.ts` hook — LibraryPage · BookDetailPage · KoreanPhonicsStudyPage · BookSeoPage 적용.
- Prerender: `packages/client/scripts/prerender.mjs`(puppeteer). CMD `pnpm --filter client build:prerender`. 정적 4라우트 + **동화책 about 페이지 전체**(sitemap.xml 에서 추출, `/api/*` 를 `PRERENDER_API_ORIGIN`(기본 prod)로 요청 프록시해 실제 책 데이터로 렌더). env: `PRERENDER_BOOKS=0`(끄기)·`PRERENDER_BOOK_LIMIT`(제한). API 도달 불가 시 about 자동 스킵.
- **✅ 검색엔진 등록 완료(2026-07-10)**: Google Search Console(도메인 속성 `tangobook.co.kr`, 도메인 공급업체 자동 소유확인) + 네이버 서치어드바이저(`www.tangobook.co.kr`, `naver-site-verification` 메타태그 `index.html` head) 둘 다 사이트맵 `https://www.tangobook.co.kr/sitemap.xml`(302 URL, 149권) 제출 완료. → memory `seo-search-console-registration-2026-07-10`.
- **IndexNow 즉시 색인**(2026-07-10): `pnpm --filter server indexnow`(`scripts/submit-indexnow.mjs`) = 공개 책 URL 을 네이버(`searchadvisor.naver.com/indexnow`)+공유망(`api.indexnow.org`, Bing·Yandex)에 POST. 키 파일 `public/b3b333d656886ff7c80be13b2e827c8a.txt`(배포 필수). 플래그 `--dry-run/--limit N/--url <url>`. 새 책 낼 때 `sitemap` 뒤에 실행(또는 `--url` 로 그 책만). ⚠️ 공유망은 키 파일 배포 후 소유권 검증에 수분~수시간(첫 제출 403 `SiteVerificationNotCompleted`=정상, 재시도).
- 🔴 다음 할 일(메모리 참조): 책별 OG 카드(표지 합성) / CI 통합 / Core Web Vitals / 유료화 시 무료 11권 selection 재검토 + paywall 구조화데이터(`isAccessibleForFree`).

## /marketing — ContentFlow 포트 ✅ Phase 0~5 완료 (main 통합)
ContentFlow AI 마케팅 자동화 SaaS 이식 — **전 단계(Phase 0~5) 완료, 포트 종료. 모든 `/marketing` 라우트 라이브**. `features/marketing/` 전담 모듈.
데이터 레인 2종: **supabase-direct**(`mkt_*` 테이블 싱글 오너 RLS + R2 `mkt/{projectId}/…`) = 콘텐츠/키워드/발행/전략/모니터링 키워드 / **server-proxy**(`/api/mkt/…` 시크릿 서버 전용) = 분석·모니터링 검색·SERP. Express `/api/mkt` (SSE 포함).
- Phase 1(콘텐츠 7채널) · 2(키워드/아이디어) · 3(발행: self_hosted `setInterval` 스케줄러 + 큐/대시보드/5단계 일괄예약 + `supabase-admin.provider` 서비스롤 + `mkt_deploy_webhook_queue`).
- **Phase 4(분석)**: GA4 서비스계정 JWT(RS256 `node:crypto`, no SDK)→runReport REST + SEO 감사(cheerio) + Meta/YouTube 인사이트 + 경쟁사(갭/순위, Gemini). client는 `recharts` 차트만, 시크릿은 서버에서 프로젝트별 resolve.
- **Phase 5(전략/모니터링/광고/SERP)**: 전략 HTML 뷰어+클라 파싱 import · 모니터링(지식인/블로그 스크레이프 + YouTube/IG + AI 댓글) · 광고 목업(client-only) · 경쟁사 SERP(DataForSEO).
마이그레이션은 **Phase 3에서만**(4·5는 기존 컬럼 재사용, 0 SQL). **415 마케팅 tests / 161 서버 mkt tests**.
- **계정 연동 + 멀티채널 실발행(2026-07-10, dflo 이식)**: Meta **글로벌 OAuth**(`/api/auth/meta`→암호화 `mkt_meta_connection`, 토큰 서버전용) + YouTube(`youtube.provider` 재활용). 공용 실행기 `publish-executor`가 **카드뉴스(IG캐러셀·FB앨범)·릴스(IG릴스·FB영상·Threads·YouTube쇼츠)** 실발행+백오프재시도, 스케줄러 Step C=예약 자동발행. UI=릴스패널 "소셜 발행"(`ReelsPublishDialog`)·카드뉴스 "소셜 발행"(`MetaPublishDialog`)·발행큐 dflo 보드(언어pills+채널컬럼). 🔴 New Pages Experience 페이지 `/me/accounts` 누락→`META_EXTRA_PAGE_IDS` env · IG=비즈니스계정 페이지연결 필수 · Meta앱=콘텐츠관리 이용사례. env=`META_APP_ID/SECRET·META_REDIRECT_BASE·META_TOKEN_ENC_KEY·CORS_ORIGIN·META_EXTRA_PAGE_IDS`. → memory `meta-connect-publish-2026-07-10`.
- **정규/광고 콘텐츠 탭 + 광고 릴스 발행(2026-07-12)**: 콘텐츠 목록을 **정규/광고 탭**으로 분리(`mkt_contents.content_kind` regular|ad, ui-store 영속). 광고 콘텐츠는 `ContentTabs`가 **릴스+카드뉴스만** 노출(기본 릴스) — 릴스 업로드+`ReelsPublishDialog` 재사용해 IG/FB/쇼츠 발행. 광고 릴스 시드 헬퍼 `scripts/upload-ad-reel-assets.ts`(R2 업로드) + `mkt_publish_records`(channel=instagram, scheduled_at=now) 직접 삽입 → **프로덕션 스케줄러가 발행**(로컬 enc키 불필요). 🔴 **발행 파이프라인 hardening 3건**: ①`getBundle` 60s 캐시+3회 재시도(tick당 연타 시 간헐 null "Meta 연결 없음" 방지) ②IG 릴스 폴링 60s→~3분(큰 mp4 처리) ③**폴링 5s 간격·transient 15s 백오프**(짧은 간격 연타가 Meta 앱 요청한도 `(#4) Application request limit reached` 트립 → 상태 못 읽어 헛타임아웃). → memory `marketing-ad-tab-publish-2026-07-12`.
상세 → [features/marketing/CLAUDE.md](packages/client/src/features/marketing/CLAUDE.md) · memory `marketing-port-contentflow-2026-06-07.md`.

## 마케팅 자료
`docs/marketing/` — 키워드 리서치·통합·전략 파이프라인. 상세 → [docs/marketing/README.md](docs/marketing/README.md).
- 자료실 HTML: `/seo-strategy.html`(자동 생성, `generate-seo-html.mjs`) · `/operations-playbook.html` · `/viral-magnets-wireframes.html`.
- **릴스 홍보 영상** (소비자용 9:16, 24s): Remotion 컴포지션 `ReelsPromo`(`packages/remotion/src/compositions/ReelsPromo.tsx`) + 씬 `src/components/reels/*`. 자산은 R2 실제 표지를 `public/reels/`(styles·nature·grid·games·logo)로 복사. 구성: 세계명작(그림체 모핑)→자연관찰→한/영→학습게임→콘텐츠 바둑판→CTA(로고+7일 무료체험+tangobook.co.kr). 렌더 `npx remotion render ReelsPromo out/reels-promo.mp4`(BGM은 무음, 편집기에서 추가). 설계 [docs/superpowers/specs/2026-06-04-reels-promo-video-design.md](docs/superpowers/specs/2026-06-04-reels-promo-video-design.md).
- **책별 릴스 배치 파이프라인** (9:16 · ~40s · 책마다 자동, 2026-07-10): 마케팅 스토리보드(`_data/marketing/storyboards/{id}.json`)+책 실제 삽화(R2)로 책별 릴스를 렌더해 마케팅 릴스 탭에 연결. **prop 기반 일반 컴포지션 `StorybookReel`**(`packages/remotion/src/compositions/`, 원격 R2 이미지 `<Img>` 직접 로드·🔴`encodeURI` 필수(한글 파일명)·`calculateMetadata` 동적 duration) = 씬(훅=**책 제목** 헤드라인 / 원작·줄거리·교훈=스토리보드 label + **subtitle 자막**(나레이션 아님 — 중간잘림 회피)) + **그림체 3종 모핑**(콜라주→수채→페이퍼3D, 최대 공통페이지) + CTA 로고. 순수 빌더 `packages/server/src/services/reel/reel-props.ts`(`buildReelProps`, TDD 13) · 배치 러너 `packages/server/scripts/render-book-reels.ts`(`bundle`→`selectComposition`→`renderMedia`(`timeoutInMilliseconds`·`gl:'angle'`) + R2 업로드 `mkt/{projectId}/reels/` + Supabase `mkt_instagram_contents[0].video_settings.reels.ko` **병합**(단일 캐러셀행 유지), flags `--book/--limit/--dry-run/--owner-email`(기본 `kil210@gmail.com`)). **명작 46/51 라이브**(4=R2 책데이터 404·1=스토리보드 없음, 원본 보존하면 개별 재실행). 개구리 왕자 손튜닝 원본=`FrogPrinceReel`(보존, 회귀 안전망). 설계·계획 [docs/superpowers/specs/2026-07-09-storybook-reels-batch-pipeline-design.md](docs/superpowers/specs/2026-07-09-storybook-reels-batch-pipeline-design.md) · memory `storybook-reels-pipeline-2026-07-10`.
- **광고 릴스(AdReel)** (9:16 · 전환광고 · 손제작, 2026-07-12): 배치 파이프라인과 별개 — 프로덕트 전체를 파는 단일 손제작 광고. `packages/remotion/src/compositions/AdReel.tsx`(fade TransitionSeries)+`AdThumbnail.tsx`(커버 스틸), `Root.tsx` 등록. 흐름=감성훅→동화 실제 읽어주기(백설공주 한글·**영어** 2p)→배우는 6단어→학습게임(따라쓰기·그림짝·블록)→**사과 맞추면 즉시 사과 페이지**→콘텐츠 그리드(명작9+자연6)→그림체 모핑→CTA. 🔴 **오디오 생성 금지, 있는 콘텐츠 사용**(`page.ttsUrl`/`translations[en].ttsUrl`, silencedetect로 자막 경계 트림)·자막=실제 첫 문장·그림체=**페이퍼3D**(photographic 비공개 X)·게임 효과음+파닉스 실음원. 산출물 `docs/marketing/ad-reel{,-ig}.mp4`·`ad-reel-thumbnail.png`. IG 발행 스크립트 `packages/server/scripts/publish-ad-reel.ts`(🔴 컨테이너 무한 IN_PROGRESS 미해결 — 대안=`mkt_publish_records` 삽입→프로덕션 스케줄러). `scripts/_enc.txt`=시크릿 gitignore. → memory `ad-reel-composition-2026-07-12`.

## strategy.html — 가로 슬라이드 deck (Series A 투자자용)
**15 슬라이드** 가로 deck. 🔴 deck 작업 규칙: [docs/strategy-deck-rules.md](docs/strategy-deck-rules.md) **매번 참조** (헤더 통일·자랑 표현·AI 모델·마케팅 채널·§9 zero-knowledge 톤·§10 Phase 1 트랙션 전제).
- **구조 gotcha**: `<main>`(clipper) + `<div class="deck-track">`(translateX 대상) + `<section>`(100vw×100vh) + `.slide-content`(scale 자동 fit). ⚠️ main 직접 transform 시 identity matrix 됨 — 반드시 inner deck-track 분리.
- **자동 fit**: `fitSlide()` = `min(slideH/contentH, slideW/contentW, 1)` → `transform: scale(N)`. `document.fonts.ready`+`window.load`+`resize` 마다 재계산.
- narrative 백업 `/strategy-detail.html`. 일러스트 풀 `strategy-samples/illustrators/`.
- **전략 핵심**: 명작 동화 플랫폼 브랜딩(AI 양산 반대 포지셔닝) · 오픈 베타(게임화·별·호리 제외) · 풀스펙 9 + 라이트 31 + 자연관찰 30~40 → 주 2개 보강 · 정식 런칭 시 ⭐ 포인트 시스템 통합.
