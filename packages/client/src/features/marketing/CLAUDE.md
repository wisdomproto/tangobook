# Marketing Module — ContentFlow Port

ContentFlow AI 마케팅 자동화 SaaS → Tangobook 이식. `/marketing` 라우트 전담.
브랜치: `feat/marketing-phase0` (worktree `C:\projects\tangobook\.worktrees\marketing-phase0`).

## 모듈 구조

```
features/marketing/
  api/                    # TanStack Query + Supabase 직접 호출 (no REST → server)
    queries.ts            # mktKeys 팩토리 + fetchContentGraph (단일 쿼리로 전체 그래프)
    supabase.ts           # 마케팅 전용 Supabase 클라이언트 인스턴스
    use-projects.ts       # mkt_projects CRUD
    use-contents.ts       # mkt_contents CRUD
    use-base-article.ts   # mkt_base_articles (TipTap body)
    use-blog-contents.ts  # mkt_blog_contents + mkt_blog_cards
    use-instagram-contents.ts  # mkt_instagram_contents + mkt_instagram_cards
    use-threads-contents.ts    # mkt_threads_contents + mkt_threads_cards
    use-card-templates.ts # mkt_card_templates (사용자 저장 카드뉴스 템플릿)
    use-channel-models.ts # 프로젝트별 채널 AI 모델 설정 읽기
    use-keywords.ts       # 키워드 아이디어 (서버 /api/mkt/naver|google 경유)
    use-r2-upload.ts      # presign → PUT → publicUrl 헬퍼
    use-debounced-save.ts # 800ms debounce Supabase update (save-status-store 연동)
  hooks/                  # 순수 UI 훅 (서버 데이터 없음)
    use-ai-generation.ts  # SSE fetch → parseSSEStream → onChunk/onComplete
    use-image-generation.ts     # 단건 이미지 생성
    use-card-image-generation.ts # 카드뉴스 이미지 1장 생성 + R2 업로드
    use-auto-save.ts      # 편집기 내 필드 자동저장 래퍼
    use-r2-upload.ts      # hooks 레이어 래퍼
  components/
    content/              # 채널별 편집 패널
      BaseArticlePanel.tsx      # 기본글 (TipTap 에디터)
      BlogPanel.tsx             # N블로그 4-step workflow
      InternalBlogPanel.tsx     # 내부블로그 (Google/GEO SEO)
      CardNewsPanel.tsx         # 카드뉴스 (캔버스 에디터 + WebP export)
      ThreadsPanel.tsx          # 스레드
      ContentTabs.tsx           # 채널 탭 라우터
      ChannelContentList.tsx    # 채널 버전 목록 (create/select/delete)
      editor/                   # TipTap 3.x 에디터 컴포넌트
        BaseArticleEditor.tsx
        EditorToolbar.tsx
      (+ 기타 공용 위젯: WorkflowStepBar, SeoScoreDisplay, NaverKeywordPanel …)
    layout/               # 마케팅 앱셸
      MarketingShell.tsx  # Sidebar + TopBar + <Outlet/>
      Sidebar.tsx / SidebarNavItem.tsx
      TopBar.tsx / ProjectSwitcher.tsx / SaveStatusIndicator.tsx
    project/              # 프로젝트/콘텐츠 관리
      CreateProjectDialog.tsx / CreateContentDialog.tsx
      ContentListPanel.tsx      # 콘텐츠 목록 + 정렬
      ProjectSettings.tsx       # 브랜드·채널·키 설정 패널
      sections/                 # 설정 섹션별 분리 컴포넌트
  lib/                    # 순수 로직 라이브러리 (ContentFlow faithful port)
    prompt-builder.ts     # 채널별 Gemini 프롬프트 조립 (PromptContext → string)
    seo-scorer.ts         # 네이버 SEO 점수 계산
    seo-feedback.ts       # SEO 피드백 메시지 생성
    sse-stream-parser.ts  # SSE 스트림 파서
    canvas-export.ts      # 카드뉴스 슬라이드 → WebP Blob (renderCardToBlob)
    image-utils.ts        # base64 ↔ WebP Blob 변환
    ai-models.ts          # 채널별 기본 AI 모델 상수
    channel-translator.ts # 채널 enum → 한국어 레이블
    schedule-distribution.ts  # 발행 일정 분산 계산
    strategy-html-parser.ts   # 전략 HTML 파싱
    strategy-prompt-builder.ts
    translation-prompt-builder.ts
    weekly-report-builder.ts
    utils.ts              # generateId, cn 등 공통 유틸
  store/                  # Zustand — UI 상태 전용
    ui-store.ts           # selectedProjectId, selectedContentId, activeTab 등
    save-status-store.ts  # 저장 상태 표시 (pending count, savedAt, error)
    batch-image-store.ts  # 카드뉴스 일괄 이미지 생성 job 상태 (O-E 예외)
  theme/
    marketing-tokens.css  # ContentFlow OKLCH 디자인 토큰 (.marketing-scope 격리)
    useMarketingTheme.ts  # .marketing-scope 다크모드 제어
  types/
    database.ts           # Supabase 테이블 → TS 인터페이스 (Project/Content/BaseArticle/…)
    cards.ts              # 카드뉴스 캔버스 데이터 타입 (CardCanvasData)
    analytics.ts          # FunnelConfig / GA4Config
    strategy.ts           # ImportedStrategy
  ui/                     # shadcn/ui 컴포넌트 (scoped to .marketing-scope)
    button.tsx / input.tsx / tabs.tsx / dialog.tsx … (index.ts re-exports)
  pages/
    MarketingLayout.tsx   # auth guard + MarketingShell 래퍼 (→ /login if no session)
    ContentPage.tsx       # 콘텐츠 목록 + 채널 탭 레이아웃
    SettingsPage.tsx      # 프로젝트 설정 페이지
    PlaceholderPage.tsx   # 미구현 채널/기능 placeholder
  index.ts                # 공용 export
```

## 데이터 레이어

### Supabase `mkt_*` 테이블 (싱글 오너 RLS)

RLS는 모든 테이블에서 `user_id = auth.uid()` 로 적용.
| 테이블 | 설명 |
|---|---|
| `mkt_projects` | 마케팅 프로젝트 (브랜드·채널·API 키·글쓰기 가이드) |
| `mkt_contents` | 콘텐츠 단위 (제목·주제·상태) |
| `mkt_base_articles` | 기본글 (TipTap HTML body + body_plain_text) |
| `mkt_blog_contents` | N블로그/내부블로그 버전 |
| `mkt_blog_cards` | 블로그 카드 (text/image/divider/quote/list) |
| `mkt_instagram_contents` | 카드뉴스/릴스 버전 |
| `mkt_instagram_cards` | 카드뉴스 슬라이드 (캔버스 데이터) |
| `mkt_threads_contents` | 스레드 버전 |
| `mkt_threads_cards` | 스레드 포스트 단위 |
| `mkt_youtube_contents` | 유튜브 버전 (placeholder) |
| `mkt_youtube_cards` | 유튜브 카드 (placeholder) |
| `mkt_card_templates` | 사용자 저장 카드뉴스 템플릿 |

마이그레이션: `supabase/migrations/2026-06-07-marketing-schema.sql` +
`2026-06-07-marketing-phase1a-indexes.sql` + `2026-06-07-marketing-phase1b-indexes.sql`.

### R2 자산

키 패턴: `mkt/{projectId}/{category}/{timestamp}-{rand}.{ext}`. 카드뉴스 이미지·레퍼런스 파일 등 바이너리는 모두 R2 (`/api/mkt/storage/presign` → PUT → publicUrl).

### `fetchContentGraph`

`api/queries.ts` 의 핵심 단일 쿼리. content + base_article + 모든 채널 contents + 모든 channel cards 를 병렬 fetch 후 하나의 `ContentGraph` 객체로 조립. 채널 패널은 이 그래프를 TanStack Query 캐시에서 읽는다.

### TanStack Query 규칙

- 서버 데이터 = TanStack Query 캐시 (`mktKeys` 팩토리 사용). **Zustand 에 서버 데이터 금지**.
- 카드 목록 갱신은 `queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) })`.
- `useDebouncedSave(table, id)` → 800ms 디바운스 후 Supabase update (save-status-store 카운터 연동).

## Express `/api/mkt` 라우트

| Method | Path                     | 설명                                               |
| ------ | ------------------------ | -------------------------------------------------- |
| POST   | `/ai/generate`           | Gemini SSE 텍스트 생성 (`text/event-stream`)       |
| POST   | `/ai/generate-image`     | Gemini 이미지 생성 (base64 PNG 반환)               |
| POST   | `/ai/translate`          | 번역 SSE                                           |
| POST   | `/ai/extract-text`       | PDF/DOCX/TXT → 텍스트 추출 (`multipart/form-data`) |
| POST   | `/ai/analyze-references` | URL 레퍼런스 fetch + Gemini 요약                   |
| POST   | `/storage/presign`       | R2 presigned upload URL 발급                       |
| POST   | `/storage/delete`        | R2 키 일괄 삭제                                    |
| GET    | `/storage/proxy?url=`    | R2 이미지 same-origin 프록시 (캔버스 CORS 우회)    |
| POST   | `/naver/keywords`        | 네이버 검색광고 API 키워드 조회                    |
| POST   | `/google/keywords`       | DataForSEO Google 키워드 조회                      |

서버 파일: `routes/mkt.routes.ts`, `controllers/mkt/{ai,storage,keywords}.controller.ts`,
`services/mkt/gemini-sse.service.ts`, `services/mkt/external/{naver-searchad,dataforseo,…}.ts`.

## 채널 구현 현황

| 채널                     | 상태 | 컴포넌트                                                             |
| ------------------------ | ---- | -------------------------------------------------------------------- |
| 기본글 (Base Article)    | 완료 | `BaseArticlePanel.tsx` + TipTap 3.x                                  |
| N블로그 (Naver SEO)      | 완료 | `BlogPanel.tsx` — 4-step workflow (키워드→구조→생성→SEO)             |
| 내부블로그 (Google/GEO)  | 완료 | `InternalBlogPanel.tsx`                                              |
| 카드뉴스 (Instagram)     | 완료 | `CardNewsPanel.tsx` — Canvas 편집기 + WebP export + 일괄 이미지 생성 |
| 스레드 (Threads)         | 완료 | `ThreadsPanel.tsx`                                                   |
| 유튜브 (Phase 1c)        | 완료 | `YoutubePanel.tsx` — AI 대본, 씬별 이미지, 타임라인, 미리보기        |
| 번역 (Phase 1d)          | 완료 | `ChannelTranslationView.tsx` — 6채널 번역 overlay (non-ko)           |
| 이미지 에디터 (Phase 1d) | 완료 | `ImageEditorDialog.tsx` — blog/youtube ImageCardWidget 에서 Pencil   |

## 핵심 Gotchas (반드시 확인)

### (a) 카드 생성 시 `user_id` 직접 주입

`setXxxCards` (delete-all + bulk-insert) 및 `addXxxCard` 는 row에 `user_id` 를 **스탬핑하지 않는다**. 패널에서 `getCurrentUserId()` (`supabase.auth.getUser()`) 를 호출한 뒤 `BlogCard / InstagramCard / ThreadsCard / CardTemplateRow` 에 직접 `user_id` 필드를 채워서 넘겨야 한다. 빠뜨리면 RLS 위반 → insert 실패.

### (b) 캔버스 WebP export — R2 CORS 미적용 시 proxy fallback

`lib/canvas-export.ts renderCardToBlob`:

1. `crossOrigin='anonymous'` 직접 로드 시도.
2. `img.onerror` (CORS 거부) 또는 `toBlob()` SecurityError → `/api/mkt/storage/proxy?url=…` 경유 재시도.
3. 프록시도 실패 → 텍스트만 export (CF 원본과 동일).
   R2 버킷 CORS 정책 적용 시 프록시 round-trip 없이 직접 그릴 수 있음. 샘플 정책은 `canvas-export.ts` JSDoc 참조.

### (c) `batch-image-store` — TanStack 캐시 직접 읽기 금지

`useBatchImageStore`는 job/progress 상태만 보관 (O-E 예외). `cardIdsByIndex: string[]` + `onSaved(cardId, url)` 를 패널에서 **주입**해야 한다. Store가 카드 목록을 자체적으로 읽으면 안 됨 → `onSaved` 내부에서 `queryClient.invalidateQueries` 를 호출해 캐시를 갱신.

### (d) AI 생성 시 `baseArticle.body_plain_text` 주입

채널 AI 생성 프롬프트는 기본글 본문(`baseArticle.body_plain_text`)을 컨텍스트로 받는다. 외부 패널(`ContentTabs`)이 `fetchContentGraph` 로 읽은 `baseArticle` 을 채널 패널 props 로 전달해야 한다.

### (e) TipTap 3.x 특이사항

- `immediatelyRender: false` 필수 (SSR 없어도 경고 방지).
- 외부 값 세팅: `setContent(html, { emitUpdate: false })` (무한 루프 방지).
- BubbleMenu: `@tiptap/react/menus` 에서 import (3.x API 변경).

### (f) `.marketing-scope` 테마 격리

ContentFlow OKLCH 토큰은 전역 `:root` 가 아닌 `.marketing-scope` 클래스에만 적용된다. `MarketingShell` 루트 div에 이 클래스가 있어야 토큰이 인식됨. 다크모드는 `useMarketingTheme` 훅이 `.marketing-scope` div에 `.dark` 클래스를 토글.

### (g) `lib/` 포트 충실도

`prompt-builder` / `seo-scorer` / `sse-stream-parser` / `schedule-distribution` 은 ContentFlow 원본 로직을 최대한 그대로 이식했다. 수정 시 원본 CF 로직과 diff 비교 후 주석에 delta 기록.

### (h) Phase 1d 번역 + 이미지 에디터 Gotchas

1. **`mkt_translations` 테이블명 + `user_id` 스탬핑** (C-1/C-2): CF 포트는 `translations` 테이블을 사용했고 insert에 `user_id` 없었음 → 둘 다 fix됨 (`channel-translator.ts`). insert 시 RLS `with check (user_id = auth.uid())`를 통과하려면 반드시 `user_id` 스탬핑 필수.
2. **번역 프롬프트 클라이언트 빌드** (C-3): `/api/mkt/ai/translate`는 `{prompt, model}`만 읽음. CF처럼 서버에서 프롬프트를 구성하지 않음. 클라이언트가 `buildTranslationPrompt`로 시스템 프롬프트를 만들고 소스 텍스트를 붙여 POST. CF 원본의 `{text, sourceLanguage, …}` 바디 형태는 동작하지 않음.
3. **이미지 에디터 Canvas proxy-draw** (I-2): `ImageEditorDialog.handleSave`는 `loadImageWithProxy`(`lib/image-editor-canvas.ts`)를 사용. R2 버킷 CORS 미적용 시 canvas가 taint되는 걸 방지하기 위해 direct → `/api/mkt/storage/proxy` 폴백. CF 원본 `handleSave`에는 이 폴백이 없었음.
4. **O-7 완전 철회**: `ImageCardWidget.onEdit`이 `undefined`가 아닌 `() => void`가 됨. 두 callsite — `BlogCardItem.tsx`(blog/internal-blog)와 `YoutubePanel.tsx`(유튜브 씬) — 가 실제 `onEdit` 핸들러를 전달. `BlogCardItem`에 `projectId: string` prop 추가 필요 (`uploadToR2` 사용).
5. **라이브 번역 프리뷰 생략** (O-1d-B): `use-translation.ts`(CF의 SSE 프리뷰 스트리밍)는 구현 안 함. 번역 완료 후 최종 배너 표시만. `translationStatuses` 객체의 `translating` 상태 + `LanguageSelector` 글리프로 UX 보완.

## 라우트

`router/index.tsx` 의 `/marketing` 트리:

- `/marketing` → `MarketingLayout` (auth guard)
  - `index` → redirect to `/marketing/content`
  - `content` → `ContentPage`
  - `settings` → `SettingsPage`
  - `*` → `PlaceholderPage`

## 관련 문서

- 마스터 스펙: `docs/superpowers/specs/2026-06-06-contentflow-marketing-port-design.md`
- Phase 1a 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1a-base-article-blog-design.md`
- Phase 1b 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1b-cardnews-threads-design.md`
- Memory: `marketing-port-contentflow-2026-06-07.md`
