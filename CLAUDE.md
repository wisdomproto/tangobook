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
- **법적 문서 + 푸터**(`pages/legal/`, `components/SiteFooter.tsx`, `config/business.ts`): 이용약관/개인정보/환불(`/terms /privacy /refund`) + 사업자정보 단일소스 `BUSINESS_INFO`(🔴 회사명·대표·사업자번호·통판신고번호·주소 실값 TODO). 토스 가맹 심사·전상법 신원표시 필수. 결제 go-live 절차(테스트키 검증 완료) → memory `legal-docs-footer-2026-07-03`.
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
- 연속재생 (`features/continuous/` — 동화책 여러 권 자동 이어재생/잠자리) → memory `continuous-play-2026-07-01`. **진입=LibraryPage "나의 재생 목록" 섹션**(2026-07-08 사이드바 버튼 제거 → 메인화면 주도: 로그인 시 항상 표시, 저장세트 0개면 "이어재생 만들기" CTA, **헤더 접기/펴기 기본 접힘**, 세계명작 위). 사이드바 위계 재정리(2026-07-08): 아이존=동화책+**어휘 게임**만, 부모 작업(리포팅·초대·연속재생·설정)은 하단 부모존/메인화면으로 분리. **선택기는 나레이션 있는 책만**(`koCompletion.pagesTts` — 무음 책 제외; PageSubtitle은 TTS 재생 중일 때만 자막 그림). ViewerContainer 재사용(`playlist` prop: `key={bookId}` remount·reward 3곳 가로채기·**autoStart:index>0**(첫 책은 일반읽기처럼 "탭해서 시작하기" — autoplay 차단 브라우저 대비)·autoplay막힘 폴백게이트·속도·**paused**·stall가드). 컨트롤 **기본 숨김**(재생 화면 안 가림), 나가기=🚪(→/continuous, 홈 아님). **그림체=책 대표(defaultStyle) 우선**(2026-07-02, `?style` 미지정 시 뷰어 공통 폴백 — 라이브러리 표지와 일치). `/continuous`·`/continuous/new`(빌더)·`/continuous/play`(풀스크린). 저장세트=Supabase `playlists`. LibraryPage 프로모배너=로그인 사용자도(무료 N일/친구초대).
- Learning Reports (부모 리포트 — **동화책 중심 + 2026-07-02 히어로 리디자인**: `WeeklyHeroCard`(호리+이번주 한줄+7일 리듬 도트)가 숫자카드 3개 흡수, `RecentBooksStrip`=완독 게이트 없이 표지 전부(완독=🎉리본/미완=읽는중 칩), 만난단어 최근순+총개수, 로딩 스켈레톤, 빈상태 호리+CTA. KST 집계 `learning/lib/aggregate.ts`(`recentBooks`/`weekActivity`/`formatKstDate` 추가), 파닉스/어휘/활동 탭 = dev-only) → [features/learning/CLAUDE.md](packages/client/src/features/learning/CLAUDE.md) · memory `learning-reports-parent-review-2026-07-01` · `prelaunch-review-fixes-2026-07-02`.
- 별/호리/놀이터 → [features/rewards/CLAUDE.md](packages/client/src/features/rewards/CLAUDE.md)
- Hori 아케이드 → [features/arcade-games/CLAUDE.md](packages/client/src/features/arcade-games/CLAUDE.md)
- 어휘 단원 → [features/vocabulary-unit/CLAUDE.md](packages/client/src/features/vocabulary-unit/CLAUDE.md)
- 횡단 (커리큘럼/자료실/캐싱/자산/snake_case) → [docs/architecture-notes.md](docs/architecture-notes.md)
- 모기 이북 (단발 콘텐츠 — `/ebook/mosquito` 한·일 인터랙티브 이북 + 언어별 mp4, Remotion+TTS) → memory `mosquito-ebook-2026-06-20`
- 호리네 생활동화 (호리(아기호랑이) 마스코트 앙상블 8인 기반 **45편 라인 = 대본 전편 완성**(2026-07-08, comic-writer 집필 → comic-editor 전편 검수 P0/P1 0건). 대발이 34편 나레이션 **실측 분석**(youtube-transcript-api)로 "캐릭터=결점 배역" 공식 역설계 → 45편 커리큘럼([curriculum-45.md](docs/saenghwal-donghwa/curriculum-45.md), 7트랙 A건강위생8·B자립6·C안전8·D감정8·E관계8·F가족4·G일상3) + 5비트 작법. **HTML 저작도구**=`public/saenghwal-{회차}.html`(45편 + `plan`) + **`saenghwal-index.json`=탭 SSOT**(번호 1~45 라벨, plan.html·core.js 둘 다 이 파일 fetch → 새 회차는 여기 한 줄만 추가하면 전 페이지 탭 반영). 기획서(`saenghwal-plan.html`) 6장에 45편 클릭 목록·상태. 쪽별/전체 프롬프트 복사·컷 이미지 붙여넣기 `/api/comic-assets/{docId}`(R2) → **TopBar 자료실 "🐯 호리네 생활동화 기획서"**. **집필="○○ 편 써줘"→comic-writer(생활동화·학습만화 공용 작가)→comic-editor 검수** — 그림체 **니들펠트 확정**, `public/saenghwal-core.js`가 스타일 SSOT + @image1~8 고정캐스트 + @image9~ 단역(회차 `window.SH_GUESTS`) + 쪽별 [등장] 자동감지 + 전체/쪽별 프롬프트 합성 + 단역 레퍼런스 섹션 + **"🎬 이 화 등장" 캐릭터 한 줄 스트립**(고정캐스트=기획서(`saenghwal-plan`) 저장 레퍼런스 이미지, 단역=회차 저장, @imageN 대조). 새 회차=기존 회차 HTML 복제(guest 편은 yangchi, 무guest는 SH_GUESTS 줄 삭제) + index.json 등록. SCENE엔 그림체 문구 금지(core가 붙임)·캐릭터 인식 토큰(Hori/Mom tiger…) 필수. **🔴 SCENE 밀도=학습만화 동일 5라벨 풀 콘티**(컷/장소·시간/인물(캐릭터별 포즈·표정)/배경·소품/톤, 영문 요약 금지, `<b>라벨</b>…<br/>`)). **📚 editor2 연동(2026-07-10)**: 기획서 완성 대본(HTML `<p class="ko">`글 + `<pre class="scene">`콘티 + comic-assets 삽화 + 등장 캐스트)을 editor2 `category:"생활동화"` storybook 으로 연동/재생성 = `packages/server/scripts/link-saenghwal-illustrations.mjs`(회차↔책 매핑 `saenghwal-book-map.json`, in-place pages/characters 교체·id/keyObject 유지, 무책+삽화 회차 `--create` 신규생성, 멱등). 제목 앞 번호 = `number-saenghwal-titles.mjs`(`--sequential` = 빈틈없는 01~N 연속, 순서 유지 · 제목 정렬=순서). ⚠️ editor2 48권은 구 커리큘럼 잔재(orphan 13권 — 분리수거·생일 등)라 45회차와 1:1 아님 → 번호만 슬롯 배정, **콘텐츠 연동표와 분리**(덮어쓰기 방지). → [docs/saenghwal-donghwa/](docs/saenghwal-donghwa/) · memory `hori-saenghwal-donghwa-2026-07-01` · `saenghwal-editor2-linkage-2026-07-10` · `debari-benchmark-analysis-2026-07-05`
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

## 다국어(i18n) 번역
`SUPPORTED_LANGUAGES`(`shared/constants`, `code·label·nativeName·flag`) = 언어 단일 소스. **새 언어 = 여기 한 줄** → 클라 언어 토글/라벨 자동 derive(BookDetailPage `LANG_LABEL`). 표지는 `lang→en→ko` 폴백. 현재 11개(ko·en·ja·zh·es·fr·de·vi·th·ms·id), **zh = 간체(`中文(简体)`)**. 마케팅 새 프로젝트 기본 타겟 언어 = `[ko·en·zh·th·vi]`.
- 번역 스크립트 (`packages/server/scripts/`): `translate-extract/apply/verify.mjs --lang=<code>` + 공통 `translation-core.mjs`. **Gemini 아닌 Claude 직접 번역** — `_data/translations/<lang>/<id>.json`(언어무관 `t` 키)에 채워 R2 주입.
- R2 필드: `languages[]` · `titleTranslations` · `page.translations[lang]` · `KeyObject.nameTranslations` · `parentGuideTranslations`(신규). **vi 동화책 152권 전체**(명작 51 + 자연관찰 101, backup·파닉스 제외) 적용 완료.
- 상세 + **새 언어 추가 체크리스트** → memory `translation-pipeline-i18n-2026-05-30.md`.

## PRD 문서
`docs/PRD_*.md` (Master / AuthorTool_Storybook / AuthorTool_Phonics / Viewer / Marketing / v2 / UIUX_AuthorTool)

## SEO 인프라
SPA SEO 기본기. 상세 → memory `seo-infrastructure-2026-05-26.md`.
- 정적: `index.html`(meta/JSON-LD) · `robots.txt` · `sitemap.xml`(자동: `pnpm --filter server sitemap`) · `manifest.json` · `llms.txt`
- **OG 이미지**: `og-image.png`(기본/사이트) · `og-invite.png`(친구초대 레퍼럴) → 생성기 `pnpm --filter server og`(`generate-og-images.mjs`, sharp+librsvg, 번들 Pretendard `scripts/assets/og-fonts/`). 1200×630, 로고 webp 합성. 책별 OG = BookSeoPage 가 실제 표지 URL 사용.
- 동적: `src/lib/useSeo.ts` hook — LibraryPage · BookDetailPage · KoreanPhonicsStudyPage · BookSeoPage 적용.
- Prerender: `packages/client/scripts/prerender.mjs`(puppeteer). CMD `pnpm --filter client build:prerender`. 정적 4라우트 + **동화책 about 페이지 전체**(sitemap.xml 에서 추출, `/api/*` 를 `PRERENDER_API_ORIGIN`(기본 prod)로 요청 프록시해 실제 책 데이터로 렌더). env: `PRERENDER_BOOKS=0`(끄기)·`PRERENDER_BOOK_LIMIT`(제한). API 도달 불가 시 about 자동 스킵.
- 🔴 다음 할 일(메모리 참조): 책별 OG 카드(표지 합성) / CI 통합 / GSC·네이버 서치어드바이저 등록 / Core Web Vitals / 유료화 시 무료 11권 selection 재검토 + paywall 구조화데이터(`isAccessibleForFree`).

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
