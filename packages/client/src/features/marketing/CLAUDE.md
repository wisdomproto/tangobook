# Marketing Module — ContentFlow Port

ContentFlow AI 마케팅 자동화 SaaS → Tangobook 이식. `/marketing` 라우트 전담.
브랜치: `feat/marketing-phase0` (worktree `C:\projects\tangobook\.worktrees\marketing-phase0`).

> **마케팅 에이전트**: 콘텐츠 제작·전략/기획은 `.claude/agents/marketing-specialist.md` 에이전트가 담당. 단일 소스 = [docs/marketing/brand-brief.md](../../../../../docs/marketing/brand-brief.md), 산출물 = `docs/marketing/drafts/`. **이 모듈(`/marketing` 코드) 기능 개발은 메인 세션, 마케팅 콘텐츠·전략은 에이전트**로 역할 분리.

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
      ReelsPanel.tsx            # 릴스(숏폼) — 3 서브탭: 📋스토리보드(iframe) / 🎬영상제작(언어별 mp4+커버 R2 업로드, 카드뉴스 캡션 공용) / ✂️에디터(프리뷰). dflo 포트
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
      CreateContentDialog.tsx
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

### 분석 (Phase 4) 추가 파일

> **데이터 레인이 Phase 1~3과 정반대 — server-proxy.** client는 `{projectId, period/platform/query/url}`만 POST, 시크릿(GA4 privateKey / Meta token)은 서버가 프로젝트별로 resolve.

```
features/marketing/
  api/
    use-analytics.ts         # GA4 쿼리 훅 (server-proxy via postMkt, 501→null, staleTime 5m):
                             #   useGa4Overview/Traffic/TopPages/Country/Content;
                             #   SEO 감사/크롤/스키마 mutation 훅;
                             #   useMetaInsights (501→{connected:false}); useYoutubeChannel;
                             #   postMkt export (use-competitors가 재사용)
    use-competitors.ts       # postMktGraceful + useGapAnalysis / useKeywordRankings / useSuggestCompetitors
  components/
    analytics/
      AnalyticsDashboard.tsx        # GA4 트래픽 탭 컨테이너
      OverviewCards.tsx             # 방문/페이지뷰/세션 요약 카드
      TrafficChart.tsx              # 트래픽 소스 (recharts)
      PageviewsChart.tsx            # 일별 페이지뷰 (recharts)
      CountryTraffic.tsx            # 국가별 트래픽
      TopPagesTable.tsx             # 상위 페이지 표
      ContentPerformance.tsx        # 콘텐츠 성과
      SiteAnalysisDashboard.tsx     # 2 서브탭 (GA4 트래픽 + SEO 분석) 컨테이너
      WebsiteSeoPanel.tsx           # 메타-분석의 웹사이트(SEO) 탭 패널
      YoutubeChannelPanel.tsx       # 메타-분석의 YouTube 채널 탭 패널
      MetaAnalyticsDashboard.tsx    # 5 플랫폼 탭 (IG/FB/Threads/YouTube/Website)
      seo/
        SeoDashboard.tsx            # SEO 분석 서브탭 컨테이너
        ScoreGauge.tsx              # 점수 게이지
        AuditForm.tsx               # URL 입력 폼
        IssuesList.tsx              # 이슈 목록
    competitors/
      CompetitorsDashboard.tsx      # Phase 4 = 콘텐츠 갭 + 키워드 순위 2탭 (Phase 5에서 SERP 탭 추가)
  pages/
    SiteAnalysisPage.tsx  # /marketing/site-analysis
    MetaAnalyticsPage.tsx # /marketing/meta-analytics
    CompetitorsPage.tsx   # /marketing/competitors
```

서버 추가 파일:

```
packages/server/src/
  services/mkt/
    analytics.service.ts    # resolveGa4Config + resolveMetaCredentials (getSupabaseAdmin로 프로젝트별 creds);
                            #   GA4 매퍼 (mapOverviewSummary/mapDaily/mapTraffic/mapTopPages/mapCountry/mapContent)
                            #   + 빌더 (getOverview/getTraffic/getTopPages/getCountry/getContent/getMetaInsights/getYoutubeChannel)
    seo.service.ts          # scoreSeoAudit (PURE, cheerio) + auditUrl (SSRF 가드) + crawlUrl + schemaGenerate
    competitors.service.ts  # gapAnalysis/keywordRankings/suggestCompetitors (Gemini) + parseCompetitorJson (PURE TDD)
    external/
      ga4.ts                # 서비스계정 JWT (RS256 via node:crypto createSign, no SDK) → OAuth 토큰(캐시) → runReport REST
      meta-graph.ts         # getAdInsights (+ getPageMediaInsights / exchangeToken)
      youtube-data.ts       # + getChannelInfo / searchChannels / getChannelVideos
  controllers/mkt/
    analytics.controller.ts # analyticsOverview/Traffic/TopPages/CountryTraffic/ContentPerformance + metaInsights + youtubeChannel
    seo.controller.ts       # seoAudit / seoCrawl / seoSchemaGenerate
    competitors.controller.ts # competitorsGapAnalysis / competitorsKeywordRankings / competitorsSuggest
```

deps: `recharts ^2.15.4` (client, React-18 라인 — CF의 3.x 아님) · `cheerio ^1.0.0` (server).

### 전략/모니터링/광고/SERP (Phase 5) 추가 파일

> **데이터 레인 믹스**: 전략 = client 파싱 + supabase-direct write + 1 disk-list / 모니터링 검색·댓글 + SERP = server-proxy / 모니터링 키워드 = supabase-direct 영속 / 광고 = client-only.

```
features/marketing/
  api/
    use-strategy-templates.ts # useStrategyTemplates — GET /api/mkt/strategy/templates 쿼리
    use-monitoring.ts         # useMonitoringSearch + useMonitoringComment (transient, postMkt)
    use-monitoring-keywords.ts # supabase-direct mkt_monitoring_keywords:
                              #   useMonitoringKeywords / useAddMonitoringKeyword (user_id 스탬프, 23505 dup no-op) / useRemoveMonitoringKeyword
    use-competitors.ts        # + useCompetitorSerp (postMktGraceful)
  components/
    strategy/
      StrategyDashboard.tsx     # 템플릿 iframe 뷰어
      StrategyImportDialog.tsx  # HTML→imported_strategy import (parseStrategyHtml + useUpdateProject)
    monitoring/
      MonitoringDashboard.tsx   # per-keyword 피드 (영속 키워드 + 스크레이프/YouTube/IG + AI 댓글)
      MonitoringFeedCard.tsx    # 피드 카드
    ads/
      AdsDashboard.tsx          # 캠페인 기획 목업 (client-only) + 발행 레코드 1 read
    competitors/
      CompetitorsDashboard.tsx  # + 3번째 "SERP 분석" 탭
  pages/
    StrategyPage.tsx    # /marketing/strategy
    MonitoringPage.tsx  # /marketing/monitoring
    AdsPage.tsx         # /marketing/ads
  lib/
    strategy-html-parser.ts # parseStrategyHtml (DOMParser, PURE, Phase 0 이식 — import은 client에서 파싱)
  types/
    monitoring.ts       # StrategyTemplateMeta / MonitoringFeedItem / SerpResultItem
    database.ts         # + MonitoringKeyword
public/marketing-strategy-templates/.gitkeep  # 전략 템플릿 디스크 디렉터리 (빈 상태 출시)
```

서버 추가 파일:

```
packages/server/src/
  services/mkt/
    strategy.service.ts     # listStrategyTemplates (fs.readdir, graceful empty)
    monitoring.service.ts   # PURE 매퍼 mapJisikinResults/mapNaverBlogResults/mapGoogleBlogResults (cheerio)
                            #   + 고정-host SSRF fetch + youtube 재사용 + instagram (resolveMetaCredentials) + Gemini 댓글 + formatViews + searchMonitoring
    competitors.service.ts  # + serpAnalysis
    external/
      dataforseo.ts         # + getSerpResults (serp/google/organic/live/advanced) + mapSerpResults
  controllers/mkt/
    strategy.controller.ts    # strategyTemplates
    monitoring.controller.ts  # monitoringSearch / monitoringComment
    competitors.controller.ts # + competitorsSerp
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

| Method | Path                             | 설명                                                                              |
| ------ | -------------------------------- | --------------------------------------------------------------------------------- |
| POST   | `/ai/generate`                   | Gemini SSE 텍스트 생성 (`text/event-stream`)                                      |
| POST   | `/ai/generate-image`             | Gemini 이미지 생성 (base64 PNG 반환)                                              |
| POST   | `/ai/translate`                  | 번역 SSE                                                                          |
| POST   | `/ai/extract-text`               | PDF/DOCX/TXT → 텍스트 추출 (`multipart/form-data`)                                |
| POST   | `/ai/analyze-references`         | URL 레퍼런스 fetch + Gemini 요약                                                  |
| POST   | `/storage/presign`               | R2 presigned upload URL 발급                                                      |
| POST   | `/storage/delete`                | R2 키 일괄 삭제                                                                   |
| GET    | `/storage/proxy?url=`            | R2 이미지 same-origin 프록시 (캔버스 CORS 우회)                                   |
| POST   | `/naver/keywords`                | 네이버 검색광고 API 키워드 조회                                                   |
| POST   | `/google/keywords`               | DataForSEO Google 키워드 조회                                                     |
| POST   | `/keywords/recommend`            | 황금키워드 오케스트레이션 (Gemini seed→Naver volume→3-tier 분류, Phase 2)         |
| POST   | `/ideas/generate`                | Gemini flash-lite 채널별 AI 아이디어 생성 (Phase 2)                               |
| POST   | `/ideas/trending`                | YouTube Data trending + Naver trend 집계 (Phase 2)                                |
| POST   | `/publish/meta`                  | IG/FB/Threads Graph API v21.0 발행 (Phase 3, **un-wired** — 클라이언트 연결 없음) |
| POST   | `/analytics/overview`            | GA4 방문/페이지뷰/세션 요약 (server-proxy, Phase 4)                               |
| POST   | `/analytics/traffic`             | GA4 트래픽 소스 (Phase 4)                                                         |
| POST   | `/analytics/top-pages`           | GA4 상위 페이지 (Phase 4)                                                         |
| POST   | `/analytics/country-traffic`     | GA4 국가별 트래픽 (Phase 4)                                                       |
| POST   | `/analytics/content-performance` | GA4 콘텐츠 성과 (Phase 4)                                                         |
| POST   | `/analytics/meta-insights`       | Meta(IG/FB/Threads) 인사이트 — 토큰 서버사이드 (Phase 4)                          |
| POST   | `/analytics/youtube-channel`     | YouTube 채널 정보 (Phase 4)                                                       |
| POST   | `/seo/audit`                     | URL SEO 감사 (cheerio + SSRF 가드, Phase 4)                                       |
| POST   | `/seo/crawl`                     | URL 크롤 + 텍스트 추출 (Phase 4)                                                  |
| POST   | `/seo/schema-generate`           | JSON-LD 스키마 생성 (Gemini, Phase 4)                                             |
| POST   | `/competitors/gap-analysis`      | 콘텐츠 갭 분석 (Gemini, Phase 4)                                                  |
| POST   | `/competitors/keyword-rankings`  | 키워드 순위 (Gemini, Phase 4)                                                     |
| POST   | `/competitors/suggest`           | 경쟁사 추천 (Gemini, Phase 4)                                                     |
| GET    | `/strategy/templates`            | 전략 HTML 템플릿 목록 (disk readdir; import 파싱은 client-side, Phase 5)          |
| POST   | `/monitoring/search`             | 지식인/N블로그/구글블로그 스크레이프 + YouTube/IG (server-proxy, Phase 5)         |
| POST   | `/monitoring/comment`            | AI 댓글 생성 (Gemini, Phase 5)                                                    |
| POST   | `/competitors/serp`              | 경쟁사 SERP top-10 (DataForSEO `serp/google/organic/live/advanced`, Phase 5)      |

서버 파일: `routes/mkt.routes.ts`, `controllers/mkt/{ai,storage,keywords,ideas,publish,analytics,seo,competitors,strategy,monitoring}.controller.ts`,
`services/mkt/gemini-sse.service.ts`, `services/mkt/ideas.service.ts`,
`services/mkt/publish.service.ts` (publishToMeta + saveMetaRecord),
`services/mkt/publish-scheduler.service.ts` (ONE `setInterval(tick,60_000)` — server.ts listen callback에서 시작),
`providers/supabase-admin.provider.ts` (service-role singleton, SUPABASE_SERVICE_ROLE_KEY env),
`services/mkt/external/{naver-searchad,dataforseo,golden-keyword,youtube-data,…}.ts`.

> **스케줄러 구조**: `tick` = Step A `flipDueSelfHosted`(due self_hosted scheduled→published + 웹훅 큐 enqueue) + Step B `fireDeployWebhooks`(디바운스 POST to `published_site.deploy_webhook_url`, retry≤3). overlap guard 포함. `createApp`(테스트 공유)이 아닌 **`server.ts` listen callback**에서 시작 — 테스트 타이머 누수 방지.

## 채널 구현 현황

| 채널                             | 상태 | 컴포넌트                                                                                                                                                          |
| -------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 기본글 (Base Article)            | 완료 | `BaseArticlePanel.tsx` + TipTap 3.x                                                                                                                               |
| N블로그 (Naver SEO)              | 완료 | `BlogPanel.tsx` — 4-step workflow (키워드→구조→생성→SEO)                                                                                                          |
| 내부블로그 (Google/GEO)          | 완료 | `InternalBlogPanel.tsx`                                                                                                                                           |
| 카드뉴스 (Instagram)             | 완료 | `CardNewsPanel.tsx` — 이미지 전용 풀블리드 카드 + 카드별 AI 프롬프트(한국어 텍스트 포함)·캐릭터 레퍼런스 바·전체 프롬프트 복사 (+ 레거시 Canvas 편집/WebP export) |
| 스레드 (Threads)                 | 완료 | `ThreadsPanel.tsx`                                                                                                                                                |
| 유튜브 (Phase 1c)                | 완료 | `YoutubePanel.tsx` — AI 대본, 씬별 이미지, 타임라인, 미리보기                                                                                                     |
| 릴스 (숏폼)                      | 완료 | `ReelsPanel.tsx` — 스토리보드 iframe / 영상제작(언어별 mp4+커버) / 에디터 프리뷰. `숏폼` 탭 active=true                                                           |
| 번역 (Phase 1d)                  | 완료 | `ChannelTranslationView.tsx` — 6채널 번역 overlay (non-ko)                                                                                                        |
| 이미지 에디터 (Phase 1d)         | 완료 | `ImageEditorDialog.tsx` — blog/youtube ImageCardWidget 에서 Pencil                                                                                                |
| 키워드/아이디어 (Phase 2)        | 완료 | `IdeasDashboard.tsx` — 5 서브탭 (N키워드/G키워드/유행/AI아이디어/보관함)                                                                                          |
| 발행 (Phase 3)                   | 완료 | `PublishDashboard.tsx` — self_hosted 자동 스케줄러 + 발행 큐/달력 + 5단계 일괄 예약 + Naver 수동 복사                                                             |
| 분석 (Phase 4)                   | 완료 | `SiteAnalysisDashboard.tsx`(GA4+SEO) · `MetaAnalyticsDashboard.tsx`(5 플랫폼) — server-proxy + recharts                                                           |
| 모니터링/댓글 (Phase 5)          | 완료 | `MonitoringDashboard.tsx` — per-keyword 스크레이프/YouTube/IG 피드 + AI 댓글 (영속 키워드)                                                                        |
| 광고 (Phase 5)                   | 완료 | `AdsDashboard.tsx` — 캠페인 기획 목업 (client-only) + 발행 레코드 read                                                                                            |
| 경쟁사 (갭/순위/SERP, Phase 4+5) | 완료 | `CompetitorsDashboard.tsx` — 콘텐츠 갭 + 키워드 순위(Gemini) + SERP 분석(DataForSEO)                                                                              |

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

- **portal 타겟**: select/dialog/dropdown-menu/tooltip 의 `createPortal` 은 `document.body` 가 아닌 `ui/portal-target.ts` `marketingPortalTarget()`(=`.marketing-scope` 또는 body)로 보낸다. body 직접 포탈 시 스코프 토큰 미적용 → 드롭다운 배경 투명·텍스트 안 보임 버그.

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

### (k) Phase 4 분석 Gotchas

1. **분석 = server-proxy (NOT supabase-direct)** — Phase 1~3과 정반대. client→Express(`/api/mkt/{analytics,seo,competitors}/*`)→외부 API(GA4/Meta/YouTube/DataForSEO/Gemini). client는 서버 데이터를 Supabase에서 직접 읽지 않는다.
2. **GA4 = 서비스계정 JWT, SDK 없음**: `external/ga4.ts`가 `node:crypto`의 `createSign('RSA-SHA256')`로 RS256 JWT 서명 → OAuth2 토큰 교환(클라이언트별 캐시) → `runReport` REST. `@google-analytics/data` / `google-auth-library` 미사용. 프로젝트별 `ga4_config`는 `analytics.service.ts resolveGa4Config`가 `getSupabaseAdmin()`로 서버사이드 읽기. PEM은 `\\n`을 실제 개행으로 unescape.
3. **R-1 시크릿 안전**: GA4 `privateKey` + Meta `pageAccessToken`은 **서버 전용** — `VITE_` 금지, `res.json`/로그에 절대 노출 금지. client는 `{projectId, period/platform/query/url}`만 POST. 브라우저는 presence boolean(연결 여부)만 보유.
4. **graceful 폴백**: GA4 미설정 501→null, Meta 미연결 501→`{connected:false}`, SEO/competitors 502→빈 결과. `use-analytics.ts`의 `postMkt`(501→null) / `use-competitors.ts`의 `postMktGraceful`가 처리.
5. **마이그레이션 없음**: `ga4_config`/`funnel_config`/`meta_credentials` 등은 Phase 0 스키마에 이미 존재. GA4 설정 UI는 Phase 0의 `FunnelAnalyticsSection`(ProjectSettings "퍼널·분석" 탭) 재사용 — Phase 4는 컬럼 0 추가.
6. **`recharts` 핀 `^2.15.4`**: React-18 라인. CF의 3.x가 아님 (React 19 의존 회피).

### (l) Phase 5 전략/모니터링/광고/SERP Gotchas

1. **전략 파싱 = client-side**: `lib/strategy-html-parser.ts`의 `parseStrategyHtml`(DOMParser, PURE, Phase 0 이식)이 브라우저에서 파싱. import은 `useUpdateProject().mutate({ id, updates: { imported_strategy } })` — 훅은 **무인자** 호출 후 `.mutate`에 `{id, updates}` 전달. 서버 `import-html` 파싱 엔드포인트 없음.
2. **전략 템플릿 디렉터리**: `public/marketing-strategy-templates/`(R-A — 투자자용 `public/strategy.html`과 분리). 빈 상태로 출시(`.gitkeep`만), 서버 `listStrategyTemplates`는 `fs.readdir` graceful empty.
3. **모니터링 검색 = server-proxy**: 스크레이프 + YouTube 키 + **Meta 토큰 서버사이드 `resolveMetaCredentials`**(와이어에 토큰 없음 — R-1). client는 `{projectId, keyword, language, sources?}`만 POST.
4. **모니터링 키워드 = per-project 영속**: `mkt_monitoring_keywords`(supabase-direct, `user_id` 스탬프 R-B, 23505 dup no-op). 피드 결과는 transient(컴포넌트 state). `MarketingLanguageTabs`는 소스/댓글 언어만 구동 — 키워드 테이블에 language 컬럼 없음(O-4).
5. **Naver 검색 = 공개 스크레이프**: Naver 검색용 자격증명 없음 — `naver-searchad`는 키워드 볼륨 전용. 모니터링은 검색 결과 페이지를 직접 스크레이프.
6. **광고 = client-only**: 캠페인은 `useState`만(영속 X) + `mkt_publish_records` 1 read(소재 picker). 백엔드/마이그레이션 없음. 카피는 중립 샘플(R-9).
7. **SERP = DataForSEO**: `external/dataforseo.ts getSerpResults`(`serp/google/organic/live/advanced`, R-D) + `mapSerpResults`. Google 직접 스크레이프 아님.
8. **CF dead 전략 컴포넌트 11개 OUT**: importer가 0개 참조 — 포팅 제외.
9. **마이그레이션 없음**: `mkt_monitoring_keywords` + `mkt_projects.imported_strategy`는 Phase 0 스키마에 기존재.

## 라우트

`router/index.tsx` 의 `/marketing` 트리:

- `/marketing` → `MarketingLayout` (auth guard)
  - `index` → redirect to `/marketing/content`
  - `content` → `ContentPage`
  - `ideas` → `IdeasPage` (Phase 2)
  - `publish` → `PublishPage` (Phase 3)
  - `site-analysis` → `SiteAnalysisPage` (Phase 4)
  - `meta-analytics` → `MetaAnalyticsPage` (Phase 4)
  - `competitors` → `CompetitorsPage` (Phase 4)
  - `strategy` → `StrategyPage` (Phase 5)
  - `monitoring` → `MonitoringPage` (Phase 5)
  - `ads` → `AdsPage` (Phase 5)
  - `settings` → `SettingsPage`

모든 사이드바 라우트가 실제 페이지로 연결됨 — marketing children에 `PlaceholderPage` 더 이상 없음 (`PlaceholderPage.tsx`는 모듈에 잔존하나 마케팅 트리 미사용).

## 동화책 → 기본글 시딩 (콘텐츠 부트스트랩)

동화책 152권(명작 51 + 자연관찰 101) 각각을 마케팅 콘텐츠 1개 + 기본글(base article) 1개로 시딩하는 파이프라인. 저작(파일)과 시딩(멱등 스크립트)을 분리.

- **산출물**: `packages/server/scripts/_data/marketing/base-articles/<storybookId>.json` (152개, git 보존 — `.gitignore`에서 `_data/marketing/` 예외 처리). 각 파일 = `{storybookId, category('classic'|'nature'), title, body_html(TipTap, h2 8섹션), body_plain_text, sources, generatedAt}`.
  - 명작 템플릿: 작품 소개·원작 이야기(웹리서치)·탱고북 각색 비교·줄거리·교훈·부모 가이드(읽어주는 법)·함께 나눌 질문·추천 연령.
  - 자연 템플릿: 주제 소개·자연/과학 사실 검증(웹리서치)·탱고북이 다루는 내용·핵심 어휘(keyObjects)·호기심 질문·부모 가이드(관찰/체험 확장)·함께 할 활동·추천 연령.
  - 소스 본문 = `packages/server/scripts/_data/translations/vi/<id>.json` 의 `pages[].ko`·`keyObjects`·`parentGuide`. **카테고리 분류기 = 페이지 수**(≤17 classic / ≥18 nature, 152권 전수 일치).
- **시드 스크립트**: `packages/server/scripts/seed-marketing-base-articles.mjs` — `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY` env 필요. `--owner-email`(기본 kil210@…)로 `auth.users`에서 owner 해석 → `mkt_projects` name="탱고북 동화책" ensure → book마다 `mkt_contents`(memo=`storybook:<id>` 키로 멱등, category·tags 채움) + `mkt_base_articles`(content_id 기준 select-then-insert/update) upsert. `--ids a,b,c` 또는 `--all`, `--dry-run` 지원. 모든 row `user_id` 스탬프.
  - **멱등 키**: `mkt_contents.memo='storybook:<id>'` (마이그레이션 0 — 기존 컬럼 재사용). 재실행해도 중복 없이 갱신.
  - 순수 헬퍼 `packages/server/scripts/lib/seed-helpers.mjs`(classify/wordcount/memo-tag/html→plain) + 산출물 검증 `scripts/validate-base-articles.test.mjs`. **vitest 설정이 `scripts/**/\*.test.mjs` 포함**(`packages/server/vitest.config.ts`).
- 설계/플랜: `docs/superpowers/specs|plans/2026-06-15-marketing-storybook-base-articles*.md`.

## 동화책 콘텐츠 시딩 — 내부블로그 · 카드뉴스 · 릴스 스토리보드 (152권 전권 완료)

기본글에 이어 동화책 152권 각각에 **한국어 내부블로그(Google/GEO) · 카드뉴스(인스타 carousel) · 릴스 스토리보드** 를 생성. 저작물은 `_data/marketing/{blogs,cardnews,storyboards}/<id>.json`(git 보존), 멱등 시딩.

- **내부블로그** (`seed-marketing-blogs.mjs` → `mkt_blog_contents`(channel='self_hosted') + `mkt_blog_cards`): 권당 6섹션(소개·사실/원작·탱고북/줄거리·관찰/교훈·가이드·FAQ) HTML + 섹션별 **영문 no-text 이미지 프롬프트** + seo_title/primary·secondary_keyword/url_slug/meta_description. 키워드 근거 = `docs/marketing/data/consolidated-keywords.json`. InternalBlogPanel 미리보기·이미지슬롯·"전체 프롬프트 복사"로 노출. 저작 가이드 `_data/marketing/_blog-guide.md`.
- **카드뉴스** (`seed-marketing-cardnews.mjs` → `mkt_instagram_contents`(content_type='carousel') + `mkt_instagram_cards`): 권당 6슬라이드(표지·본문4·CTA). 카드 스키마는 **CardNewsPanel AI 생성과 동일** — `text_style`=CardCanvasData(header/title/body/footer 4블록), `text_content`=합본, `image_prompt`. 캡션·해시태그는 같은 인스타 행에 저장(릴스와 공용). instagramContents[0] 규약 유지(resolve-or-create).
- **릴스 스토리보드** (`build-marketing-storyboards.mjs` → `packages/client/public/marketing-storyboards/<id>.html` + `index.json` manifest): 경량 공통 HTML 템플릿 + 책별 데이터(5씬: 훅·전개3·CTA, 나레이션·화면연출·자막·9:16 이미지프롬프트). ReelsPanel 📋스토리보드 탭이 iframe 로드(전 언어 공용). 잭과 콩나무(1772510956605)는 기존 정교본(22씬 HTML) 유지.
- **일괄 파생** (`derive-cardnews-storyboards.mjs`): 블로그 JSON(섹션·이미지프롬프트·키워드·메타) + 기본글 → 카드뉴스·스토리보드 사실 기반 자동 파생(`--all`/`--ids`/`--force`, 기존 손수본 스킵). 신데렐라·토끼는 손수 샘플.
- **릴스 데이터(마이그레이션 0)**: 언어별 {videoUrl, coverUrl} 맵은 카드뉴스와 같은 `mkt_instagram_contents` 행의 `video_settings.reels[lang]` 에 저장. 영상/커버 업로드는 `uploadToR2`(category='reels').
- 시드 실행: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node packages/server/scripts/seed-marketing-{blogs,cardnews}.mjs --owner-email kil210@gmail.com --all`. **service-role 키는 .env/CLI 만 — 절대 커밋 금지(GitHub 푸시 보호)**.

## 카드뉴스 재설계 — 이미지 전용 카드 + 카드별 AI 프롬프트 (2026-06-30)

기존 "텍스트 템플릿 오버레이 + 동화책 삽화 재사용" 방식을 폐기하고 **카드 = 사용자가 붙여넣는 완성형 AI 이미지** 워크플로우로 전환(152권/912장 전체 적용).

- **카드 = 텍스트 없는 풀블리드 빈 박스**: `fill-cardnews-design.mjs`(서버 의존 X, Supabase 직접)가 모든 카드를 `text_style={bgColor, imageUrl:null, imageRect:{x:0,y:0,w:100,h:100}, textBlocks:[]}` + `background_image_url:null` 로 초기화. 사용자가 카드별 AI 이미지를 **Ctrl+V/업로드** → 풀블리드(사각 모서리=IG 표준)로 카드 채움.
- **카드별 AI 프롬프트** (`gen-cardnews-prompts.mjs`, Gemini `gemini-2.5-flash-lite` + 503/429 retry·backoff): 시드 `_data/marketing/cardnews/<id>.json` 의 슬라이드 한국어 제목·내용을 읽어 **"완성된 카드뉴스 슬라이드(풀프레임 장면 + 한국어 텍스트 렌더)"** 프롬프트 생성 → `mkt_instagram_cards.image_prompt`.
  - **명작(classic)**: 캐릭터를 이름·외형으로 묘사 + `Match the exact art style of the attached character reference image` 접미(STYLE_SUFFIX). ⚠️ **내부 스타일 ID(`style-1234…`)는 절대 프롬프트에 넣지 않음** — 스타일은 캐릭터 레퍼런스 이미지로만 지정(Gemini 에 artStyle id 미전달 + "no style code" 룰).
  - **자연관찰(nature)**: 실제 대상 사실 묘사, 캐릭터·스타일접미 없음.
  - 한국어 텍스트 = `textBlock()` 으로 프롬프트 끝에 verbatim 삽입(제목 상단 / 캡션 하단, 둥근 가독 폰트). 실행 시 **서버 3500 필요**(캐릭터·artStyle fetch). `[--all|--ids=|--title=] [--dry-run]`.
- **CardNewsPanel UI**:
  - **캐릭터 레퍼런스 바**(명작만): `api/use-storybook-ref.ts`(`GET /api/storybooks/:id`; `storybookIdFromMemo(content.memo)` + `content.category==='classic'` 분기)로 캐릭터 `referenceImage` 썸네일 표시 → 클릭 시 이미지 클립보드 복사(`/api/mkt/storage/proxy`→canvas→`ClipboardItem('image/png')`, 실패 시 새 탭) → AI 툴에 붙여넣어 캐릭터·그림체 일관성 유지.
  - **프롬프트 복사**: 카드별 "프롬프트 복사"(`CardNewsCardItem`) + 툴바 "전체 프롬프트"(`[1/6]…` 일괄).
  - **카드 그리드**: 반응형 `gridTemplateColumns: repeat(auto-fill, minmax(185px, 1fr))` 로 축소.
  - **PreviewModal**: 그리드·WebP export 와 동일 렌더 로직으로 통일(이전엔 박스/pill/divider/fit 미지원 구버전이었음).
- **렌더러 확장**(텍스트 카드용 잔존 기능 — 현재 이미지 전용 카드는 미사용이나 코드 보존): `TextBlock.{pill,pillColor,lineHeight,fitHeight}` · `CardCanvasData.divider` · `canvas-export.ts` `fitFontSize`/`effectiveFontSize`(영역맞춤 zone-fit, 3 렌더러 공용) · `imageRect` 박스 모드(`w≥99&&h≥99` 풀블리드 시 라운딩 0).
- 상세 → memory `cardnews-ai-image-prompts-2026-06-30`.

## 동화책 → 다국어 키워드 전략 (블로그 SEO 선행 단계)

동화책 152권 × {ko·en·vi·th} 각각에 대해 블로그가 타깃할 **primary 1 + secondary 3~5 키워드**를 Google 검색량(DataForSEO) 근거로 선정. 산출물(키워드 플랜)은 다음 단계(다국어 블로그 생성)가 소비. **네이버 블로그는 범위 밖** — Google/GEO(InternalBlogPanel) 라인만.

- **순수 모듈**(TDD, `packages/server/scripts/lib/`): `keyword-candidates.mjs`(`buildCandidates(title,category,lang)` + `MAIN_KEYWORDS[lang]` 헤드 키워드 풀; 명작/자연 + 언어별 접미사 테이블) · `keyword-select.mjs`(`selectKeywords(title,candidates)` → 관련성(제목 포함) 우선 → 검색량 desc, 0볼륨 시 제목 폴백). 테스트 `keyword-plan-helpers.test.mjs`.
- **오케스트레이터** `packages/server/scripts/research-keyword-plans.mjs`: `--ids/--all --langs ko,en,vi,th --dry-run`. 제목 해석(ko=소스 `title`, vi=소스 `titleT`, en·th=`keyword-plans/_titles.json` 맵) → 후보 생성 → **언어별 1배치** DataForSEO `keywords_data/google/search_volume/live`(location `{ko:2410,en:2840,vi:2704,th:2764}`) → 선정 → 파일. `.env` 자동 로드(`DATAFORSEO_LOGIN/PASSWORD`).
- **산출물**(git, `.gitignore`에 keyword-plans 예외): `keyword-plans/<id>.json` = `{storybookId, category, titleKo, plans:{[lang]:{primary, secondary[], candidates[{keyword,searchVolume,competition,cpc}]}}}` + `_main-keywords.json`. 검증 `validate-keyword-plans.test.mjs`.
- **태국어(th)**: 콘텐츠 번역 없음 — 키워드 전략만 가능(제목 맵의 태국어 제목 사용). th 블로그 생성은 별도 태국어 콘텐츠 필요.
- **DataForSEO 잔액 필요**: 실 조회는 계정 잔액 있어야 함(없으면 402). dry-run(후보 생성)은 잔액 무관. 파일럿 6권 제목 맵 완비, 전체 152는 `_titles.json`에 en·th 제목 추가 후 `--all`.
- 설계/플랜: `docs/superpowers/specs|plans/2026-06-15-marketing-keyword-strategy*.md`.

## 동화책 → 내부 블로그 (삽화·CTA·SEO 자동화)

152개 콘텐츠의 내부 블로그(`self_hosted`)에 **원본 동화책 삽화 + 관련 글 + 동화책 CTA**를 일괄 적용하고 SEO 체크리스트를 충족시키는 스크립트군. 텍스트(작품소개/원작/줄거리/교훈/읽어주는법/FAQ)는 기존 유지, **비어있던 이미지·링크만 채움**. 멱등.

- `packages/server/scripts/fill-blog-illustrations.mjs` — `storybookId`(memo)→`/api/storybooks/:id` 삽화 풀(표지+`pages[].illustrationUrl`) → 본문 섹션에 스토리순 배분(**encodeURI** — 한글 R2 URL raw 는 400) + 관련 글(같은 `category`) 추가. `--dry-run`.
- `scripts/boost-blog-seo.mjs` — SEO 미달 보강: primary 키워드 부족분 도입 문장(부족분=4-현재), secondary 정확 표기, link 관련 글. 멱등 마커 `data-seo-boost`.
- `scripts/add-blog-cta.mjs` — 각 글 끝에 "동화책 보러가기" CTA(`tangobook.co.kr/library/<storybookId>` = BookDetailPage `/library/:id`).
- `scripts/verify-blog-seo.mjs` — boolean 체크리스트(slug·FAQ·H2≥2·내부링크·primary≥4회·secondary·schema) 검증(fetch 없음). **현재 152/152 통과**.
- 스크립트는 server `.env` 의 `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY` 로 R2/Supabase 직접 접근. 삽화 미생성 9권(no-img 4 + 표지만 5)은 삽화 추가 후 재실행하면 멱등 반영.
- **미리보기 `BlogPreviewDialog`** — PC·모바일 폰 프레임 **동시** 발행 미리보기(흰 캔버스, 발행 타이포 `PUB_PROSE`, CTA 렌더). ⚠️ `ui/dialog` DialogContent 기본값에 `sm:max-w-sm` 이 있어 너비 오버라이드는 반드시 **`sm:` 프리픽스**(`sm:max-w-6xl`) — YoutubePreviewDialog 패턴. arbitrary 너비/border(`w-[390px]`·`border-[10px]`)는 HMR 중 Tailwind JIT 미인식 가능 → **인라인 style** 사용.

## 프로젝트 고정 (단일 프로젝트 운영)

마케팅은 단일 프로젝트(`탱고북 동화책`)로 운영. `MarketingShell` 진입 시 해당 프로젝트 **자동 선택**(이름 매칭→없으면 첫 프로젝트), `ProjectSwitcher` 는 드롭다운 없는 **정적 표시**(선택/새 프로젝트 제거, `CreateProjectDialog` 삭제). 새 프로젝트 기본 타겟 언어 = `['ko','en','zh','th','vi']`(`lib/languages.ts` `DEFAULT_TARGET_LANGUAGES`). 언어 라벨은 전역 `SUPPORTED_LANGUAGES` 단일 소스(`TargetLanguagesSection` 로컬 목록 제거, zh=간체).

## 접근 — 8054 게이트 로그인

`/marketing` 진입은 이메일+비번 Supabase 로그인 대신 **비밀번호(8054) 한 칸**. `MarketingLayout`이 세션 없으면 `<MarketingGate>`(`components/auth/MarketingGate.tsx`) 노출 → 8054 제출 → `api/gate.ts gateLogin()` → 서버 `POST /api/mkt/gate-login`이 **service-role로 소유자 계정(MKT_OWNER_EMAIL) 세션을 magiclink 방식으로 발급**(계정 비번 불필요, 클라 번들에 비번 미노출) → `supabase.auth.setSession()` → 기존 RLS 데이터 로드. 세션 persist 되어 재입력 불필요.

- 서버: `services/mkt/gate.service.ts`(`isValidGateCode` 순수 + `mintOwnerSession`) · `controllers/mkt/gate.controller.ts` · 라우트 `/gate-login`. 서버 `.env`: `MKT_GATE_CODE`·`MKT_OWNER_EMAIL`·`SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`·`SUPABASE_ANON_KEY`.
- ⚠️ 8054는 약한 코드 — 공개 URL이면 누구나 단일 계정 데이터 접근(내부용 전제). 플랜 `docs/superpowers/plans/2026-06-15-marketing-gate-login.md`.

## 관련 문서

- 마스터 스펙: `docs/superpowers/specs/2026-06-06-contentflow-marketing-port-design.md`
- Phase 1a 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1a-base-article-blog-design.md`
- Phase 1b 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1b-cardnews-threads-design.md`
- Phase 1c 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1c-youtube-design.md`
- Phase 1d 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase1d-translation-image-editor-design.md`
- Phase 2 스펙: `docs/superpowers/specs/2026-06-07-marketing-phase2-keywords-ideas-design.md`
- Phase 3 스펙: `docs/superpowers/specs/2026-06-09-marketing-phase3-publish-design.md` ✅ COMPLETE
- Phase 3 플랜: `docs/superpowers/plans/2026-06-09-marketing-phase3-publish.md` ✅ COMPLETE
- Phase 4 스펙: `docs/superpowers/specs/2026-06-09-marketing-phase4-analytics-design.md` ✅ COMPLETE
- Phase 4 플랜: `docs/superpowers/plans/2026-06-09-marketing-phase4-analytics.md` ✅ COMPLETE
- Phase 5 스펙: `docs/superpowers/specs/2026-06-09-marketing-phase5-strategy-monitoring-ads-design.md` ✅ COMPLETE
- Phase 5 플랜: `docs/superpowers/plans/2026-06-09-marketing-phase5-strategy-monitoring-ads.md` ✅ COMPLETE
- Memory: `marketing-port-contentflow-2026-06-07.md`
