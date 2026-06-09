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
    use-youtube-contents.ts    # mkt_youtube_contents + mkt_youtube_cards (7 hooks)
    use-translations.ts        # mkt_translations CRUD (번역 HTML R2 경로 저장)
    use-card-templates.ts # mkt_card_templates (사용자 저장 카드뉴스 템플릿)
    use-channel-models.ts # 프로젝트별 채널 AI 모델 설정 읽기
    use-keywords.ts       # 키워드 아이디어 (서버 /api/mkt/naver|google 경유)
    use-ideas.ts          # AI 아이디어 생성 + trending (Phase 2)
    use-golden-keywords.ts # 황금키워드 오케스트레이션 → /api/mkt/keywords/recommend (Phase 2)
    use-saved-keywords.ts  # 보관함 — mkt_projects.saved_keywords JSONB via useUpdateProject (Phase 2)
    use-r2-upload.ts      # presign → PUT → publicUrl 헬퍼
    use-debounced-save.ts # 800ms debounce Supabase update (save-status-store 연동)
  hooks/                  # 순수 UI 훅 (서버 데이터 없음)
    use-ai-generation.ts  # SSE fetch → parseSSEStream → onChunk/onComplete
    use-image-generation.ts     # 단건 이미지 생성
    use-card-image-generation.ts # 카드뉴스 이미지 1장 생성 + R2 업로드
    use-channel-translation.ts  # 번역 트리거 + 번역 HTML proxy-fetch (use-translations.ts 위)
    use-auto-save.ts      # 편집기 내 필드 자동저장 래퍼
    use-r2-upload.ts      # hooks 레이어 래퍼
  components/
    content/              # 채널별 편집 패널
      BaseArticlePanel.tsx      # 기본글 (TipTap 에디터)
      BlogPanel.tsx             # N블로그 4-step workflow
      InternalBlogPanel.tsx     # 내부블로그 (Google/GEO SEO)
      CardNewsPanel.tsx         # 카드뉴스 (캔버스 에디터 + WebP export)
      ThreadsPanel.tsx          # 스레드
      YoutubePanel.tsx          # 유튜브 Vrew-style scene 타임라인 (Phase 1c)
      YoutubeCardItem.tsx       # 씬 카드 (section_type + narration/screen_direction/subtitle/image_prompt/video_prompt + 16:9 이미지)
      YoutubePreviewDialog.tsx  # 유튜브 대본 미리보기 다이얼로그
      ChannelTranslationView.tsx # 번역 read-only 배너 (6개 채널 패널 마운트, non-ko 언어 선택 시 노출, Phase 1d)
      ImageEditorDialog.tsx     # 이미지 annotation 에디터 (select/text/line/arrow/rect + undo/redo + SVG arrowhead→WebP, Phase 1d)
      ContentTabs.tsx           # 채널 탭 라우터 (handleTranslate + resolveTranslationSource 포함)
    ideas/                # 키워드/아이디어 대시보드 (Phase 2)
      IdeasDashboard.tsx        # 5 서브탭 컨테이너
      IdeaCard.tsx              # AI 생성 채널별 아이디어 카드
      TrendingFeed.tsx          # 유튜브/네이버 트렌딩 피드
      KeywordTable.tsx          # N/G 키워드 분석 테이블 (multi-column sort)
      GoldenTierCards.tsx       # 황금/유망/일반 3-tier 결과 카드
      MarketingLanguageTabs.tsx # 키워드 분석 언어 탭 (한국어/영어)
      ChannelContentList.tsx    # 채널 버전 목록 (create/select/delete)
      editor/                   # TipTap 3.x 에디터 컴포넌트
        BaseArticleEditor.tsx
        EditorToolbar.tsx
      (+ 기타 공용 위젯: WorkflowStepBar, SeoScoreDisplay, NaverKeywordPanel, ImageCardWidget …)
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
    image-editor-canvas.ts # ImageEditorDialog 헬퍼 (scalePoint/arrowheadPoints/history reducer/loadImageWithProxy)
    keyword-sort.ts       # multi-column shift-click sort comparator (TDD, Phase 2)
    ai-models.ts          # 채널별 기본 AI 모델 상수
    channel-translator.ts # 번역 axios: mkt_translations insert + user_id stamp + buildTranslationPrompt POST
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
    IdeasPage.tsx         # 키워드/아이디어 페이지 (Phase 2)
    PublishPage.tsx       # 발행 관리 페이지 (Phase 3)
    SettingsPage.tsx      # 프로젝트 설정 페이지
    PlaceholderPage.tsx   # 미구현 채널/기능 placeholder
  index.ts                # 공용 export
```

### 발행 (Phase 3) 추가 파일

```
features/marketing/
  api/
    use-publish-records.ts   # hooks: usePublishRecords / useFetchPublishCountsByLanguage /
                             #   useSchedulePublish / useBulkSchedulePublish /
                             #   useCancelPublish / useUpdateScheduledAt;
                             #   pure fn: computeBulkInsertRows;
                             #   모든 insert에 user_id 스탬프;
                             #   매 mutation 시 mktKeys.publishRecords + publishCounts 무효화
  lib/
    publish-calendar.ts      # buildMonthGrid — local-date 버케팅으로 달력 그리드 생성
    publish-times.ts         # makeTime / BEST_POST_TIMES / pickBestTimes
    schedule-distribution.ts # (Phase 0 이식, Phase 3 재사용) distributeSchedule
  components/
    publish/
      PublishDashboard.tsx        # 발행 대시보드 메인 컨테이너
      ChannelCards.tsx            # 채널 카드 목록 (connected=!!meta_credentials)
      SelfHostedCard.tsx          # 자체 호스팅 자동 발행 카드
      BulkScheduleDialog.tsx      # 5단계 일괄 예약 마법사 (distributeSchedule 재사용)
      PublishQueue.tsx            # 발행 큐 (list+calendar 뷰 + 필터 + reschedule + 채널 미리보기)
      PublishCalendar.tsx         # 월별 달력 (buildMonthGrid 사용)
      NaverCopySection.tsx        # 네이버 수동 복사 안내 섹션
  types/
    database.ts              # + DeployWebhookQueueRow 타입 추가
```

## 데이터 레이어

### Supabase `mkt_*` 테이블 (싱글 오너 RLS)

RLS는 모든 테이블에서 `user_id = auth.uid()` 로 적용.
| 테이블 | 설명 |
|---|---|
| `mkt_projects` | 마케팅 프로젝트 (브랜드·채널·API 키·글쓰기 가이드; `published_site jsonb` + `saved_keywords jsonb` 컬럼 포함) |
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
| `mkt_publish_records` | 발행 레코드 (status: draft/scheduled/publishing/published/failed; channel: self_hosted/naver_blog/instagram/facebook/threads/youtube; 부분 unique 인덱스 `uniq_mkt_publish_self_hosted`) — Phase 3 |
| `mkt_deploy_webhook_queue` | 자체 호스팅 배포 웹훅 발송 큐 (project_id PK, user_id NOT NULL, retry_count, last_error; owner RLS) — Phase 3 |

`mkt_projects.saved_keywords JSONB` — Phase 2 보관함 (owner-row 업데이트로 RLS 자동 만족).
`mkt_projects.published_site JSONB` — Phase 0부터 존재; `deploy_webhook_url` 포함.

마이그레이션:

- `supabase/migrations/2026-06-07-marketing-schema.sql` + `2026-06-07-marketing-phase1a-indexes.sql` + `2026-06-07-marketing-phase1b-indexes.sql`
- `supabase/migrations/2026-06-09-marketing-phase3-publish.sql` — ALTER `mkt_publish_records` (status/channel CHECK + 3 indexes + 부분 unique 인덱스 교체) + CREATE `mkt_deploy_webhook_queue`. **라이브 DB 적용 완료**.

### R2 자산

키 패턴: `mkt/{projectId}/{category}/{timestamp}-{rand}.{ext}`. 카드뉴스 이미지·레퍼런스 파일 등 바이너리는 모두 R2 (`/api/mkt/storage/presign` → PUT → publicUrl).

### `fetchContentGraph`

`api/queries.ts` 의 핵심 단일 쿼리. content + base_article + 모든 채널 contents + 모든 channel cards 를 병렬 fetch 후 하나의 `ContentGraph` 객체로 조립. 채널 패널은 이 그래프를 TanStack Query 캐시에서 읽는다.

### TanStack Query 규칙

- 서버 데이터 = TanStack Query 캐시 (`mktKeys` 팩토리 사용). **Zustand 에 서버 데이터 금지**.
- 카드 목록 갱신은 `queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) })`.
- `useDebouncedSave(table, id)` → 800ms 디바운스 후 Supabase update (save-status-store 카운터 연동).

## Express `/api/mkt` 라우트

| Method | Path                     | 설명                                                                              |
| ------ | ------------------------ | --------------------------------------------------------------------------------- |
| POST   | `/ai/generate`           | Gemini SSE 텍스트 생성 (`text/event-stream`)                                      |
| POST   | `/ai/generate-image`     | Gemini 이미지 생성 (base64 PNG 반환)                                              |
| POST   | `/ai/translate`          | 번역 SSE                                                                          |
| POST   | `/ai/extract-text`       | PDF/DOCX/TXT → 텍스트 추출 (`multipart/form-data`)                                |
| POST   | `/ai/analyze-references` | URL 레퍼런스 fetch + Gemini 요약                                                  |
| POST   | `/storage/presign`       | R2 presigned upload URL 발급                                                      |
| POST   | `/storage/delete`        | R2 키 일괄 삭제                                                                   |
| GET    | `/storage/proxy?url=`    | R2 이미지 same-origin 프록시 (캔버스 CORS 우회)                                   |
| POST   | `/naver/keywords`        | 네이버 검색광고 API 키워드 조회                                                   |
| POST   | `/google/keywords`       | DataForSEO Google 키워드 조회                                                     |
| POST   | `/keywords/recommend`    | 황금키워드 오케스트레이션 (Gemini seed→Naver volume→3-tier 분류, Phase 2)         |
| POST   | `/ideas/generate`        | Gemini flash-lite 채널별 AI 아이디어 생성 (Phase 2)                               |
| POST   | `/ideas/trending`        | YouTube Data trending + Naver trend 집계 (Phase 2)                                |
| POST   | `/publish/meta`          | IG/FB/Threads Graph API v21.0 발행 (Phase 3, **un-wired** — 클라이언트 연결 없음) |

서버 파일: `routes/mkt.routes.ts`, `controllers/mkt/{ai,storage,keywords,ideas,publish}.controller.ts`,
`services/mkt/gemini-sse.service.ts`, `services/mkt/ideas.service.ts`,
`services/mkt/publish.service.ts` (publishToMeta + saveMetaRecord),
`services/mkt/publish-scheduler.service.ts` (ONE `setInterval(tick,60_000)` — server.ts listen callback에서 시작),
`providers/supabase-admin.provider.ts` (service-role singleton, SUPABASE_SERVICE_ROLE_KEY env),
`services/mkt/external/{naver-searchad,dataforseo,golden-keyword,youtube-data,…}.ts`.

> **스케줄러 구조**: `tick` = Step A `flipDueSelfHosted`(due self_hosted scheduled→published + 웹훅 큐 enqueue) + Step B `fireDeployWebhooks`(디바운스 POST to `published_site.deploy_webhook_url`, retry≤3). overlap guard 포함. `createApp`(테스트 공유)이 아닌 **`server.ts` listen callback**에서 시작 — 테스트 타이머 누수 방지.

## 채널 구현 현황

| 채널                      | 상태 | 컴포넌트                                                                                              |
| ------------------------- | ---- | ----------------------------------------------------------------------------------------------------- |
| 기본글 (Base Article)     | 완료 | `BaseArticlePanel.tsx` + TipTap 3.x                                                                   |
| N블로그 (Naver SEO)       | 완료 | `BlogPanel.tsx` — 4-step workflow (키워드→구조→생성→SEO)                                              |
| 내부블로그 (Google/GEO)   | 완료 | `InternalBlogPanel.tsx`                                                                               |
| 카드뉴스 (Instagram)      | 완료 | `CardNewsPanel.tsx` — Canvas 편집기 + WebP export + 일괄 이미지 생성                                  |
| 스레드 (Threads)          | 완료 | `ThreadsPanel.tsx`                                                                                    |
| 유튜브 (Phase 1c)         | 완료 | `YoutubePanel.tsx` — AI 대본, 씬별 이미지, 타임라인, 미리보기                                         |
| 번역 (Phase 1d)           | 완료 | `ChannelTranslationView.tsx` — 6채널 번역 overlay (non-ko)                                            |
| 이미지 에디터 (Phase 1d)  | 완료 | `ImageEditorDialog.tsx` — blog/youtube ImageCardWidget 에서 Pencil                                    |
| 키워드/아이디어 (Phase 2) | 완료 | `IdeasDashboard.tsx` — 5 서브탭 (N키워드/G키워드/유행/AI아이디어/보관함)                              |
| 발행 (Phase 3)            | 완료 | `PublishDashboard.tsx` — self_hosted 자동 스케줄러 + 발행 큐/달력 + 5단계 일괄 예약 + Naver 수동 복사 |

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

### (i) Phase 2 키워드/아이디어 Gotchas

1. **`competition` enum — `HIGH/MEDIUM/LOW` 영문 상수만**: 코드·DB·API 전체에서 `HIGH/MEDIUM/LOW` 영문 상수를 사용한다. 한국어(`높음/중간/낮음` 등) 는 UI display-label map에서만 변환. 직접 한국어 문자열 비교 시 RLS/필터 버그.
2. **황금키워드 오케스트레이션 서버사이드 — 클라이언트 1회 호출**: `POST /api/mkt/keywords/recommend` 가 Gemini seed → Naver 볼륨 → 관련성 필터 → 3-tier(황금/유망/일반) 전체를 처리. 클라이언트가 HMAC(네이버 SearchAd)를 직접 구현하거나 Naver/Gemini를 별도 호출할 필요 없음. Phase 1a 의 `/api/mkt/naver/keywords`·`/google/keywords`는 단독 테이블 조회용으로 보존.
3. **`saved_keywords` — owner-row JSONB, user_id 불필요**: `mkt_projects` 테이블의 `saved_keywords JSONB` 컬럼에 저장. `useUpdateProject(projectId)` 로 owner-row를 업데이트하므로 RLS가 자동 만족. 별도 `mkt_saved_keywords` 테이블이 아님. `Project` 타입에 `saved_keywords?: SavedKeyword[]` 추가됨.
4. **`lib/keyword-sort.ts` — shift-click multi-column sort**: shift-click으로 2차 이상 정렬 컬럼 추가. comparator가 `SortState[]` 배열을 받아 우선순위 순서로 비교. `KeywordTable.tsx` 에서 헤더 클릭 시 shift 여부로 분기. TDD 구현됨.
5. **`sse-stream-parser.ts fetchAiGenerate` 경로**: CF 원본은 `/api/ai/generate` 였으나 탱고북 포트에서는 `/api/mkt/ai/generate`. Phase 2에서 최종 수정됨. 새 SSE 호출 시 경로 확인 필수.

### (j) Phase 3 발행 Gotchas

1. **부분 unique 인덱스 → `.upsert({onConflict})` 불가**: `uniq_mkt_publish_self_hosted`는 `WHERE channel='self_hosted' AND status IN ('scheduled','published')` 부분 인덱스 — supabase-js `.upsert({onConflict: 'content_id,language,channel'})` 가 부분 인덱스에서 동작하지 않음. `useSchedulePublish`는 **select-then-update/insert** 패턴으로 해결 (`7af8504` 픽스). 향후 self_hosted 단일행 예약도 동일 패턴 필수.
2. **스케줄러는 `server.ts` listen callback에서만 시작**: `createApp`은 테스트에서도 공유됨 — 거기서 `setInterval`을 시작하면 타이머 누수. 반드시 `server.ts`의 `app.listen(port, () => startPublishScheduler())` 에서만 호출.
3. **`SUPABASE_SERVICE_ROLE_KEY` 서버 전용 — 절대 `VITE_` 접두사 금지**: `providers/supabase-admin.provider.ts`가 RLS를 우회하는 서비스롤 클라이언트를 생성. 환경변수는 `packages/server/.env`에만. 클라이언트 코드에서 import 금지.
4. **`mkt_publish_records` insert 시 `user_id` 스탬프 필수**: schedule/bulk/meta 모든 경로에서 `user_id` 주입. 스케줄러의 `mkt_deploy_webhook_queue` upsert도 `user_id NOT NULL` RLS 만족 위해 스탬핑.
5. **`handlePublishNow` = faithful no-op alert**: CF 원본 동작 그대로. self_hosted 실제 발행은 스케줄러가 담당. UI 버튼의 "즉시 발행"은 사용자 안내 alert만.
6. **`POST /api/mkt/publish/meta` 구현됨이나 un-wired**: IG/FB/Threads Graph v21.0 엔드포인트 존재 (`publish.controller.ts` + `publish.service.ts`) 하지만 클라이언트 호출 없음. YouTube 발행은 완전 deferred.
7. **R-5 시간대**: 일괄 예약(`BulkScheduleDialog`의 `distributeSchedule`) = UTC 기준 슬롯. 수동 reschedule + 달력 버케팅(`buildMonthGrid`) = 운영자 로컬 날짜. CF 원본과 동일 동작 — 내부적으로 일관됨.
8. **M-1 `distributeSchedule` timeSlots 빈 값 예외**: Phase 0 이식 그대로 — `BulkScheduleDialog`의 timeSlots 필드를 비우면 throw. 마법사 UI가 가드함(노출되지 않음).
9. **M-2 `BEST_POST_TIMES` self_hosted 키 없음**: `publish-times.ts`의 `BEST_POST_TIMES` 맵이 `wordpress`를 키로 쓰고 `self_hosted`가 없어서 self_hosted 행에 최적 시간 힌트 미표시. 가드됨(harmless — CF 원본 동일).

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
  - `ideas` → `IdeasPage` (Phase 2)
  - `publish` → `PublishPage` (Phase 3)
  - `settings` → `SettingsPage`
  - `*` → `PlaceholderPage`

## 관련 문서

- 마스터 스펙: `docs/superpowers/specs/2026-06-06-contentflow-marketing-port-design.md`
- Phase 1a 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1a-base-article-blog-design.md`
- Phase 1b 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1b-cardnews-threads-design.md`
- Phase 1c 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1c-youtube-design.md`
- Phase 1d 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1d-translation-image-editor-design.md`
- Phase 2 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase2-keywords-ideas-design.md`
- Phase 3 스펙: `docs/superpowers/specs/2026-06-09-marketing-phase3-publish-design.md` ✅ COMPLETE
- Phase 3 플랜: `docs/superpowers/plans/2026-06-09-marketing-phase3-publish.md` ✅ COMPLETE
- Memory: `marketing-port-contentflow-2026-06-07.md`
