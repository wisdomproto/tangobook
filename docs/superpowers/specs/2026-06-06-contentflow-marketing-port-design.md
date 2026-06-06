# ContentFlow → 탱고북 마케팅 플랫폼 포팅 — 설계 문서

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-06-06 |
| 소스 | `C:\projects\contentflow\contentflow` (Next.js 16 마케팅 자동화 SaaS) |
| 타깃 | 탱고북 `packages/client/src/features/marketing/` + `/marketing/*` 라우트 |
| 유형 | 대형 멀티-Phase 포팅 (마스터 플랜 + Phase별 spec) |
| 이 문서 범위 | 마스터 로드맵 + **Phase 0 Foundation** 상세 설계 |

---

## 1. 목표

contentflow(AI 마케팅 자동화 플랫폼)를 탱고북 스택(React18 + Vite + TanStack Query + Zustand + Express + Supabase + R2 + Gemini)으로 **거의 똑같이** 포팅한다. 전체 7개 영역(설정·키워드/아이디어·콘텐츠생성·발행·모니터링·광고·분석·전략)을 단계적으로 이식하되, 운영자 전용 `/marketing` 라우트에 격리한다.

**비목표(YAGNI)**: 멀티테넌트 공유(project_members), 학습자 노출, contentflow의 미사용/사료 코드(`publish_logs`, `media_assets`, `writing_guides`, `keyword_rankings`, dead `keyword-analysis-dashboard` 등).

---

## 2. 확정 결정 (사용자 합의)

| # | 결정 | 선택 | 근거 |
|---|------|------|------|
| 1 | 범위 | 전체 플랫폼 (7영역) | "거의 똑같이" |
| 2 | 위치 | 별도 `/marketing` 라우트 | 운영자 전용 격리 |
| 3 | 형태 | 탱고북 스택 포팅 (React+Vite+Express) | 탱고북 통합 |
| 4 | 데이터 | **Supabase Postgres** + R2(자산) | contentflow SQL/RLS/쿼리 거의 그대로 |
| 5 | 디자인 | **contentflow 그대로** (회색 OKLCH + 다크모드) | 색 리매핑 없이 충실 |
| 6 | 외부 API | **처음부터 전부** (네이버·DataForSEO·GA4·Meta·YouTube) | 풀 기능 |
| 7 | 시작 | **Phase 0 Foundation** | 기반부터 |
| 8 | 진입점 | **직접 URL만** (`/marketing`, 메뉴 비노출) | 운영자만 |
| 9 | 인증/소유 | **단일 소유자 + RLS** (멀티테넌트 생략) | 단순화 |
| 10 | UI 폰트 | **Geist 그대로** (카드뉴스 한글폰트 유지) | 충실 |

---

## 3. 소스 분석 종합 (contentflow 실측)

### 3.1 실제 스택
Next.js 16.1.6 (App Router, Turbopack) · React 19.2 · **Tailwind CSS v4** (CSS-first `@theme`, JS config 없음) · **Base UI** (`@base-ui/react`, shadcn "base-nova" 스타일 — Radix 아님) · `next-themes` · Zustand v5 (**서버데이터 전부 보관, TanStack Query 미사용**) · Supabase(Postgres+Auth+RLS+pg_cron) · R2 · Gemini(`@google/genai`) · TipTap · @dnd-kit · Recharts(2곳뿐).

### 3.2 실제 IA (사이드바 `layout/sidebar.tsx` 기준 — PRD와 다름)
```
⚙️ /settings 프로젝트 설정 (8탭)
[오가닉 마케팅] /ideas 키워드·황금키워드·트렌딩·AI아이디어 · /content 콘텐츠 7채널 · /publish 발행
[성장]        /monitoring 소셜리스닝 + AI 댓글
[유료 마케팅]  /ads 광고 (목업, API 미연동)
[분석]        /site-analysis(GA4+SEO) · /meta-analytics 채널분석 · /competitors 경쟁사
[전략]        /strategy HTML 템플릿 iframe 뷰어 (+ 숨은 AI 생성기, 미연결)
```
미노출 라우트: `/seo`, `/analytics`, `/calendar`(스텁), `/keywords`(→/ideas redirect). `signup/`은 빈 디렉토리(로그인 폼이 가입 겸용).

### 3.3 데이터 모델 (Supabase) — 핵심
> ⚠️ **schema drift**: `src/types/database.ts`가 진짜 계약. SQL 마이그레이션엔 없는 컬럼이 라이브 DB에 다수 존재(아래 [drift]). 포팅은 `database.ts` 인터페이스 기준.

**Identity**: `users`(auth.users 미러), `project_members`(RLS 백본 — **포팅 생략**).

**Projects (거대 config aggregate)** — `projects`: name, description, cover_image_url, industry, brand_name/description, target_audience(JSONB), usp, brand_tone, banned_keywords(TEXT[]), brand_logo_url, marketer_name/expertise/style, marketer_phrases(TEXT[]), sns_goal, 채널별 `*_tone_prompt`/`*_image_style_prompt`, ai_model_settings(JSONB), target_languages(TEXT[]), wp_credentials(JSONB), meta_credentials(JSONB), published_site(JSONB), sort_order. [drift] writing_guide_global/blog/instagram/threads/youtube, api_keys(JSONB), reference_files(JSONB), bgm_files(JSONB), reference_summary, funnel_config, ga4_config, imported_strategy, saved_keywords.

**Contents (작업 단위)** — `contents`(title, category, tags[], memo, status, ai_model_settings, sort_order, [drift] topic, confirmed) → 1:1 `base_articles`(title, body, body_plain_text, word_count, factcheck_*) → 채널별:
- `blog_contents`(seo_title, seo_score, seo_details JSONB, naver_keywords JSONB, [drift] title, meta_description, url_slug, primary/secondary_keywords, channel) → `blog_cards`(card_type, content JSONB, sort_order)
- `instagram_contents`(caption, hashtags[], content_type, video_settings) → `instagram_cards`(text_content, background_color, background_image_url, text_style JSONB=CardCanvasData, sort_order)
- `threads_contents`(thread_type) → `threads_cards`(text_content, media_url, media_type)
- `youtube_contents`(video_title/description/tags, target_duration, thumbnail_url, video_url) → `youtube_cards`(section_type, narration_text, screen_direction, subtitle_text, [drift] image_url, image_prompt, video_prompt)

**i18n** — `translations`(language, channel_type, status, title, body, cards_json JSONB, UNIQUE(content_id,language,channel_type)). body는 R2 HTML URL.

**발행** — `publish_records`(channel, language, status, scheduled_at, published_at, platform_post_id, published_url, retry_count, metadata, 부분 unique index로 중복방지) ← **pg_cron이 scheduled→published 전환**. `deploy_webhook_queue`(정적사이트 재빌드 디바운스 큐).

**기타 활성** — `card_templates`+`card_hidden_builtins`, `competitor_profiles`, `monitoring_keywords`+`monitoring_feed`+`comment_logs`, `seo_audits`/`keyword_rankings`(테이블만, writer 없음).

### 3.4 그대로 이식 가능한 순수 TS (리스크 최소, 먼저 이식)
`lib/prompt-builder.ts`(35KB·전 채널 프롬프트+브랜드컨텍스트+Naver SEO 루브릭) · `lib/seo-scorer.ts`(Naver 100점 9항목) · `lib/sse-stream-parser.ts` · `lib/schedule-distribution.ts`(발행 분배 알고리즘) · `lib/ai-models.ts` · `components/ui/korean-input.tsx`(IME) · `lib/strategy-html-parser.ts` · `lib/weekly-report-builder.ts` · `lib/channel-translator.ts` + `lib/translation-prompt-builder.ts` + `lib/strategy-prompt-builder.ts` · `types/{cards,database,strategy,analytics}.ts` · `lib/ai/image-generator.ts`(Strategy 패턴).

---

## 4. 아키텍처 매핑 (contentflow → 탱고북)

| 영역 | contentflow | 탱고북 포팅 | 비고 |
|------|-------------|------------|------|
| 프레임워크 | Next App Router | React Router 레이아웃 라우트(`/marketing/*`) | `usePathname` exact-match → `NavLink` |
| 스타일 | Tailwind v4 `@theme` | Tailwind v3 `tailwind.config.ts` | OKLCH 토큰 + radius scale 이식, **스코프 격리** |
| 프리미티브 | Base UI ~20종 | `features/marketing/ui/` 재구현 | `render=` → 탱고북 방식, `data-checked/open` 유지 |
| 다크모드 | next-themes | `.marketing-scope` 루트 자체 `.dark` + CSS변수 색상 | ⚠️ 탱고북 글로벌 `.dark`(theme.store)+`dark:`유틸 1400+개 충돌 회피 — §7.3 |
| 데이터 접근 | 브라우저 → Supabase 직접 + 일부 /api | TanStack Query(queryFn=`supabase.from`) | 서버데이터=Query(탱고북 규칙), Zustand=UI만 |
| 저장 패턴 | Zustand `debouncedWrite`(800ms,2retry) | debounced autosave mutation + save-status Zustand | await-first=일반 mutation |
| 인증 | Supabase 미들웨어 redirect | 클라 가드(`useAuth`) + RLS | 탱고북 기존 Supabase auth 재활용 |
| AI 스트리밍 | Next ReadableStream SSE | Express `res.write('data:...\n\n')` + `withGeminiRetry` | 클라 `parseSSEStream`은 그대로 |
| R2 | 자체 presign route | 탱고북 기존 **multer 서버 업로드**(`/upload`,`/upload-audio`)+`/cleanup`+`buildR2Key`/immutable | 이미지는 presign 아닌 서버 프록시 (presign은 longform만) |
| 발행 cron | pg_cron + Vercel cron | 탱고북 Express cron job | `scheduled→published` 스캔 |
| 외부 API | Next /api/* (~49개) | Express `routes→controllers→services→providers` | 네이버 HMAC, DataForSEO, GA4, Meta Graph, YouTube |

**데이터 보안 주의**: contentflow는 RLS가 모든 보호를 함(브라우저가 JWT 전송). 탱고북도 Supabase Postgres + RLS 유지 결정이므로, 클라→Supabase 직접 호출 시 RLS가 보안. AI/외부API/R2만 Express 경유. → contentflow 쿼리 재활용 최대화.

---

## 5. 데이터 모델 전략

- contentflow `supabase/migrations/001~010` + self-hosted 마이그를 탱고북 Supabase 프로젝트(ref `fxzwigjkbsptvsjraqwa`)에 **마케팅 스키마로 신규 적용**. 단 `database.ts`의 [drift] 컬럼 포함한 최종 스키마로 작성(SQL과 라이브 DB 불일치 해소).
- 소유 모델 단순화: 모든 테이블 `user_id` → `auth.users`. `project_members` 제거, RLS는 `user_id = auth.uid()` 단순 정책.
- 생략 테이블: `project_members`, `publish_logs`, `media_assets`, `writing_guides`, `api_keys`(→ `projects.api_keys` JSONB), `factcheck_reports`(→ base_articles 인라인), `keyword_rankings`(writer 없음), `seo_audits`(writer 없음), `comment_logs`(writer 없음 — 필요시 후속).
- 자산(이미지/오디오/번역HTML/참고파일)은 R2. 탱고북 `buildR2Key`(Date.now 포함 → immutable cache 적용) 패턴.
- **마이그 체크리스트**(메모리 RULE): 새 테이블 RLS 정책 + SECURITY DEFINER 함수엔 `GRANT EXECUTE TO authenticated, anon` 명시.
- 스키마 확정 시 `projects.saved_keywords` 등 일부 [drift] 컬럼은 `database.ts`에서 실제 존재/명칭 재확인 후 반영(리뷰 지적).

---

## 6. 분해 로드맵 (각 Phase = 자체 spec → plan → 구현)

| Phase | 범위 | 핵심 산출물 |
|-------|------|------------|
| **0 Foundation** | 셸·데이터층·디자인시스템·순수lib·Express베이스·프로젝트설정·CRUD | `/marketing` 진입+프로젝트/콘텐츠 관리 동작 |
| **1 콘텐츠 생성**(심장) | 기본글(TipTap)→7채널, 카드에디터, 이미지생성/히스토리, Naver SEO, 8개국 번역 | `/content` 완성 |
| **2 Ideas** | 네이버/구글 키워드, 황금키워드, 트렌딩, AI 아이디어, 보관함 | `/ideas` 완성 (외부 API 최다) |
| **3 발행** | publish_records, schedule-distribution, 큐(list+calendar), 5단계 일괄예약, Meta/YouTube 발행, self-hosted+cron | `/publish` 완성 |
| **4 분석** | GA4(Recharts 2종), 채널분석(Meta/YouTube), SEO(audit/content/geo/schema), 주간리포트 | `/site-analysis`·`/meta-analytics`·`/seo` |
| **5 전략·기타** | 전략(iframe 뷰어 + import-html + 선택적 SSE 생성기), 모니터링, 경쟁사, 광고(목업), 캘린더 | 잔여 영역 |

**Phase 간 공통 의존**: Phase 0의 프리미티브·셸·데이터층·순수lib에 모든 후속 Phase가 의존. Phase 0 품질이 전체를 좌우.

---

## 7. Phase 0 Foundation — 상세 설계

### 7.1 디렉토리 구조 (탱고북 feature 패턴)
```
packages/client/src/features/marketing/
  ui/                     # Base UI → 재구현 프리미티브 (button, input, textarea, label,
                          #   card, dialog, dropdown-menu, select, tabs, tooltip, switch,
                          #   checkbox, slider, badge, avatar, collapsible, scroll-area,
                          #   separator, skeleton, korean-input)
  lib/                    # 순수 이식 (prompt-builder, seo-scorer, sse-stream-parser,
                          #   schedule-distribution, ai-models, strategy-html-parser,
                          #   channel-translator, weekly-report-builder, utils(cn))
  types/                  # cards, database(Project/Content/...), strategy, analytics
  api/                    # supabase 클라 + TanStack Query 훅 (use-projects, use-contents)
  store/                  # zustand (ui-store: selectedProjectId/lang/theme, save-status-store)
  theme/                  # marketing-tokens.css (스코프 격리), useMarketingTheme
  components/
    layout/               # MarketingShell, Sidebar, SidebarNavItem, TopBar, ProjectSwitcher
    project/              # ProjectSettings + 12 섹션, Create{Project,Content}Dialog
  pages/                  # MarketingLayout + 각 영역 page (Phase0=placeholder 제외 settings/content-list)
  index.ts

packages/server/src/
  routes/marketing.routes.ts          # /api/marketing/* 마운트
  controllers/marketing/*             # ai, storage, (외부 API는 Phase별)
  services/marketing/*                # gemini-sse, prompt 실행
  providers/                          # 기존 gemini/r2 재활용 + 신규 외부 API provider 골격
```

### 7.2 셸 & 라우팅
- `/marketing` → `MarketingLayout`(React Router 레이아웃 라우트): `<Sidebar/> + <div><TopBar/><Outlet/></div>`. 탱고북 `AppShell` **밖** (학습자 라우트와 분리, 풀스크린).
- 사이드바: flat 그룹 nav(설정/오가닉/성장/유료/분석/전략) + `ProjectSwitcher`(상단). 이모지 아이콘. `NavLink` active=`bg-accent`.
- 탑바: pathname→타이틀 맵 + `SaveStatusIndicator` + 테마토글(Moon/Sun).
- 인증 가드: 진입 시 탱고북 Supabase auth 세션 확인, 없으면 탱고북 로그인으로(별도 로그인 폼 안 만듦).
- 라우트: `/marketing`(→content), `/marketing/settings`, `/marketing/content`, `/marketing/ideas`, `/marketing/publish`, `/marketing/monitoring`, `/marketing/site-analysis`, `/marketing/meta-analytics`, `/marketing/competitors`, `/marketing/strategy`, `/marketing/ads`. Phase 0에선 settings + content-list만 기능, 나머지 placeholder.
- 라우터 등록: `packages/client/src/router/index.tsx`에 `/marketing/*` 추가.

### 7.3 디자인 시스템 (스코프 격리 — 핵심 리스크)
- contentflow `globals.css`의 OKLCH 토큰(light `:root` + dark) + radius scale을 `theme/marketing-tokens.css`로 이식.
- **CSS변수 격리**: 토큰을 `.marketing-scope { --background: …; --primary: …; }` 아래 정의(탱고북 전역 `:root` coral/peach 불변). `MarketingLayout` 루트에 `className="marketing-scope"`.
- ⚠️ **다크모드 충돌 회피 (탱고북엔 이미 글로벌 다크 인프라 존재)**: `store/theme.store.ts`가 `<html>`에 `.dark` 토글(key `tangobook-theme`, 저작도구 TopBar 사용), `AppShell`은 학습자용으로 `.dark` 강제 제거, 학습자 앱에 `dark:` 유틸 1400+개가 그 글로벌 클래스에 묶임. 따라서:
  1. 마케팅 다크는 **`.marketing-scope` 루트에 자체 `.dark` 클래스** 토글(글로벌 `<html>.dark`와 독립, 별도 localStorage key `marketing-theme`). 글로벌 `theme.store` 미사용.
  2. 마케팅 프리미티브/화면은 **`dark:` Tailwind 유틸리티 금지** — 색은 전부 CSS 변수 기반 시맨틱 컬러로만. (그래야 글로벌 `<html>.dark`에 반응 안 하고, `.marketing-scope.dark`의 변수 재정의로만 다크 전환.)
  3. marketing-tokens.css 다크 블록 = `.marketing-scope.dark { --background: …; }`.
- Tailwind v3: `tailwind.config.ts`에 마케팅 시맨틱 컬러(`background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, sidebar*`)를 `var(--…)` 참조로 추가. **plan 단계에서 탱고북 기존 `tailwind.config.ts` 키와 충돌 확인** → 충돌 시 `mk-` 접두사, 미충돌 시 표준 시맨틱 키 유지(contentflow 프리미티브 className 보존). `darkMode: 'class'`는 **이미 설정됨**(변경 불필요).
- 애니메이션: `tw-animate-css`(v4) → `tailwindcss-animate`(v3, 의존 추가 여부 확인) 또는 프리미티브에서 `data-open/animate-in` 클래스 제거.
- 폰트: Geist(Latin) UI 유지(index.html에 추가) + 카드뉴스 한글폰트(Black Han Sans/Do Hyeon/Gaegu/Jua/Noto KR) CDN 유지.
- 프리미티브: Base UI 의존 제거하고 HTML+토큰으로 재구현. 행동 많은 Select/Dialog/DropdownMenu/Tabs/Tooltip 우선, 나머지 thin. cva + `cn(clsx+tailwind-merge)` 유지. **`dark:` 유틸 금지 규칙 적용**.

### 7.4 데이터층
- `api/supabase.ts`: 탱고북 Supabase 클라(기존 auth 클라 재활용 or 마케팅 전용).
- TanStack Query 훅: `useProjects`/`useProject`/`useContents`/`useContent`/`useProjectMutations` 등. queryFn 내부에서 `supabase.from(...).select()`. queryKey = `['marketing','projects'...]`.
- 쓰기: 구조변경(create/delete/reorder)=일반 mutation(await-first). 고빈도 편집(설정 텍스트 등)=`useDebouncedSave`(800ms 배치) → `save-status-store`(pending/flushing/error/savedAt) → `SaveStatusIndicator`.
- `selectedProjectId`/`selectedContentId`는 `ui-store`(Zustand) + localStorage(`cf_selectedProjectId`).

### 7.5 Express 베이스
- `/api/marketing/ai/generate`(SSE), `/generate-image`, `/translate`, `/extract-text`, `/analyze-references` — `withGeminiRetry` + 모델 폴백 + `{text}/{error}/[DONE]` 엔벨로프(클라 parseSSEStream 호환).
- R2: 탱고북 기존 **multer 서버 업로드**(`/upload`,`/upload-audio`)+`/cleanup` 패턴 재활용(이미지는 presign 아님; presign은 longform에만 존재). 마케팅 category 추가.
- 외부 API provider 골격(Phase별 실사용): naver-searchad(HMAC), naver-datalab, dataforseo, ga4(`@google-analytics/data`), meta-graph, youtube-data. Phase 0은 인터페이스+env만.
- env: 기존 재활용 = `GEMINI_API_KEY`·R2·Supabase·`NAVER_AD_API_KEY/SECRET_KEY/CUSTOMER_ID`(검색광고). 신규 = `DATAFORSEO_LOGIN/PASSWORD`(CLAUDE.md 언급뿐 실제 .env엔 없음), `NAVER_DATALAB_CLIENT_ID/SECRET`, `GA4_PROPERTY_ID/CLIENT_EMAIL/PRIVATE_KEY`, `META_APP_ID/SECRET`, `YOUTUBE_API_KEY`(기존 `YOUTUBE_CLIENT_ID/SECRET/REDIRECT_URI` OAuth와 **별개**의 Data API 키). `.env.example` 갱신.

### 7.6 프로젝트 설정 (Phase 0 포함)
`ProjectSettings`(Tabs) + 섹션들. contentflow에서 마운트된 8탭 + 미마운트였던 4탭(brand-info/marketer/channel-prompts/ai-model — 콘텐츠 생성에 필요)도 포함:
- 참고자료(`reference_files` + extract-text + presign + AI분석), 글쓰기가이드(`writing_guide_*`), BGM(`bgm_files`), API키(`api_keys` JSONB), 퍼널·분석(`funnel_config`+`ga4_config`), 언어(`target_languages`, @dnd-kit 정렬, ko 고정), 채널연동(`meta_credentials`, Meta OAuth), 발행사이트(`published_site`), 브랜드정보, 마케터, 채널 프롬프트, AI모델.
- `CreateProjectDialog`(기본 글쓰기 가이드 시드 포함), `CreateContentDialog`(전략 기반 선택 옵션).
- `updateProject`의 `DB_COLUMNS` 허용목록 패턴 유지.

### 7.7 순수 lib 선이식
prompt-builder, seo-scorer, sse-stream-parser, schedule-distribution, ai-models, korean-input, strategy-html-parser, channel-translator(+translation/strategy-prompt-builder), weekly-report-builder, types. import 경로(`@/` → 탱고북 `@/features/marketing/`)만 수정, 로직 verbatim. 가능하면 `__tests__`도 함께(vitest).

### 7.8 Phase 0 완료 기준 (검증)
1. `/marketing` 진입 → 셸(사이드바/탑바/프로젝트스위처) 렌더, 다크모드 토글 동작.
2. 프로젝트 생성 → 선택 → 설정 12탭 편집/저장(Supabase 반영) → 저장 인디케이터 동작.
3. 콘텐츠 생성/목록/정렬/삭제(@dnd-kit) CRUD.
4. 참고파일 업로드(R2) + AI 분석(Gemini SSE) 1건 동작 — Express SSE 검증.
5. 나머지 영역 라우트는 "준비 중" placeholder.
6. 탱고북 학습자 화면 디자인 무영향(스코프 격리 검증), `pnpm typecheck` 통과.

---

## 8. 리스크 & 주의

- **토큰/다크모드 격리 실패 시 탱고북 학습자 화면 깨짐** → 탱고북엔 이미 글로벌 `.dark`(theme.store)+`dark:` 유틸 1400+개 존재. 마케팅은 `.marketing-scope` 자체 `.dark`+CSS변수 색상만(프리미티브 `dark:` 유틸 금지). 빌드 후 라이브러리/뷰어/저작도구 다크토글 회귀 확인.
- **Tailwind v4→v3 토큰 이식** 가장 손 많이 감(OKLCH 그대로 사용 가능, radius scale 매핑).
- **Base UI 재구현** Select/Dialog/Dropdown/Tabs/Tooltip이 실작업. shadcn add 불가(Radix 끌어옴).
- **Express SSE** 엔벨로프(`data: {text}\n\n`, `[DONE]`)를 정확히 맞춰야 클라 parseSSEStream/패널 JSON 파싱 동작.
- **schema drift**: SQL이 아닌 `database.ts` 기준으로 스키마 작성.
- **RLS**: 새 테이블 RLS 정책 + 함수 GRANT EXECUTE 누락 주의(과거 탱고북 403 버그 전례).
- **R2 CORS**: 카드뉴스 Canvas WebP(`drawImage`+`toBlob`)는 CORS 헤더 필요(Phase 1 이슈지만 R2 설정 미리 확인).

## 9. 미해결(후속 Phase에서 결정)
- 발행 cron 구현 방식(탱고북 Express interval vs 외부 cron 호출) — Phase 3.
- self-hosted 정적사이트 연동(dflo류 외부 사이트) 유지 여부 — Phase 3/5.
- 전략 AI SSE 생성기(숨은 기능) 포팅 여부 — Phase 5.
- 외부 Python SEO 마이크로서비스(`SEO_SERVICE_URL`) 연동 여부 — Phase 4.
