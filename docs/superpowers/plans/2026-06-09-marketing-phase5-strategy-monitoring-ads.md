# Marketing Phase 5 (전략 / 모니터링 / 광고 / 경쟁사 SERP) Implementation Plan

> **Status: NOT STARTED** — spec written + committed (`d8c4ff3`); this plan chunks it. No feature code yet. **Phase 5 is the FINAL phase** of the ContentFlow → Tangobook `/marketing` port — after it, every `/marketing` sidebar route is live.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Each chunk is independently implementable + reviewable by a fresh subagent (implementer → spec-review → quality-review). Implementers run **SEQUENTIALLY** (shared worktree `feat/marketing-phase0`) — chunk order matters; pure-logic/service chunks precede the UI that consumes them. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the **three** remaining `/marketing` placeholders — `monitoring` (`router/index.tsx:321`), `strategy` (`:325`), `ads` (`:326`) — with real dashboards faithfully ported from ContentFlow, **+** add a 3rd "SERP 분석" tab to the **existing** Phase-4 `CompetitorsDashboard`. Four pillars: **A 전략** (iframe template viewer + HTML→`imported_strategy` import), **B 모니터링** (per-keyword feed: 지식인/N블로그/구글블로그 scrape + YouTube + Instagram + AI comment), **C 광고** (client-only campaign-planning mockup + one published-records read), **D 경쟁사 SERP** (DataForSEO keyword→top-10).

**Architecture — a MIX of data lanes (the headline axis, spec §1.1):**
- **Pillar A (전략)** — **client-side parse + supabase-direct write + 1 tiny server disk-list.** The HTML parse is **PURE and already ported** (`lib/strategy-html-parser.ts`, DOMParser, tested — VERIFIED). The import writes `imported_strategy` via **supabase-direct `useUpdateProject`** (owner-row JSONB, RLS auto-satisfied). The **only** server piece is `GET /api/mkt/strategy/templates` (`fs.readdir` a server-owned dir — no secret). **No `import-html` parse endpoint** (client parses in-browser).
- **Pillar B (모니터링)** — **server-proxy for ALL search + comment** (every source hits a scrape target / the YouTube key / the Meta token / Gemini → server-side). The client sends only `{ projectId, keyword, language, sources? }`. **Keyword persistence** is **supabase-direct** (`mkt_monitoring_keywords`, RLS, `user_id` stamp) — faithful-plus over CF (CF kept keywords in volatile state). Feed results stay **transient** (component state).
- **Pillar C (광고)** — **client-only** (campaigns in `useState`, never persisted) **+ one supabase-direct read** of `mkt_publish_records` (Phase-3 table) for the creative picker. No backend, no migration.
- **Pillar D (경쟁사 SERP)** — **server-proxy** (`POST /api/mkt/competitors/serp` → DataForSEO `getSerpResults`), degrades to empty when creds absent. The 3rd tab of the **EXISTING** `CompetitorsDashboard` (do NOT create a new dashboard).

**This phase is the cheapest on data + settings of any phase — Phase 0/3/4 already provisioned everything (VERIFIED in the worktree):**
- **NO migration (firmest "no migration" of any phase).** `mkt_projects.imported_strategy jsonb` (`2026-06-07-marketing-schema.sql:60`), `mkt_monitoring_keywords` full table (`:393-406`: `id, user_id, project_id, keyword, search_engine ('naver'|'google' default 'naver'), is_golden, category, sort_order, created_at, updated_at`, `unique(project_id, keyword, search_engine)`) + RLS owner policy (`:447`), `mkt_publish_records` (Phase 3) — **all present**. Ads/SERP need no table. **Zero columns. NO SQL.**
- **`parseStrategyHtml(html): ParseResult`** already ported + tested — `lib/strategy-html-parser.ts:21` + `lib/__tests__/strategy-html-parser.test.ts` (inline-script + table-DOM paths, multiple cases). **The strategy-import chunk is client-only.**
- **`getSupabaseAdmin()`** (Phase 3, `providers/supabase-admin.provider.ts`) + **`resolveMetaCredentials(projectId): Promise<{pages: MetaPage[]}>`** (`analytics.service.ts:272`, throws `AppError(501)` when absent) — reuse for IG monitoring (token server-side, never on the wire).
- **`youtube-data.ts`**: `searchVideos(query, {order, relevanceLanguage, maxResults})` (`:53`) + `getVideoStats(ids)` (`:109`) wired — reuse for the YouTube source.
- **`dataforseo.ts`**: `getSerpResults(_keyword, _locationCode?)` **501 stub** (`:76-81`) + a `SerpResult` raw interface (`:11-17`) — wire the stub body.
- **`generateTextWithGemini(prompt, retries, model)`** (`gemini.provider.ts`) — reuse for the monitoring comment (Tangobook retry/fallback policy, NOT raw `GoogleGenAI`).
- **`config`**: `gemini.textModel` (`:9`), `youtubeApiKey` (`:64`), `dataforseo` (`:66`), `supabase.serviceRoleKey` (`:78`) — all present. **No Naver blog-search credential exists** (`naver-searchad.ts` = SearchAd keyword-**volume** HMAC, `naverDatalab` = trend) → **monitoring's Naver search is a PUBLIC SCRAPE** (no creds).
- **`MarketingLanguageTabs`** (`components/ideas/MarketingLanguageTabs.tsx`), **`mktKeys`** flat factory (`api/queries.ts:18-47`, ends at `youtubeChannel:46`), **`postMkt`** (`use-analytics.ts:20`, exported; 501→null) + **`postMktGraceful`** (`use-competitors.ts:29`, wraps postMkt), **`getCurrentUserId()`** (`api/supabase.ts:8`), the supabase-direct client (`api/supabase.ts`), `useUpdateProject()` / `useProject(id)` (`api/use-projects.ts:106/16`) — all reused.
- **`CompetitorsDashboard`** (Phase 4, `TABS` at `:18` = `{gap, keywords}`) + `use-competitors.ts` (`useGapAnalysis`/`useKeywordRankings`/`useSuggestCompetitors` transient mutations) — **add the 3rd SERP tab + `useCompetitorSerp`**, no new dashboard.
- **Sidebar nav + TopBar titles already exist** (`Sidebar.tsx:23/27/39` monitoring/ads/strategy; `TopBar.tsx:10/11/15`) — **route swap only, no nav work**.

So Phase 5's real work: **(A)** 1 server disk-list endpoint + `StrategyDashboard` (iframe) + `StrategyImportDialog` (client parse) + page + route swap; **(B)** 2 server-proxy endpoints (1 scrape fan-out + youtube + ig-server-token + 1 comment) + `mkt_monitoring_keywords` supabase-direct hooks + `MonitoringDashboard` + page + route swap; **(C)** client-only `AdsDashboard` + page + route swap; **(D)** wire `getSerpResults` + `mapSerpResults` (pure) + 1 endpoint + 1 hook + the 3rd tab. **4 new Express endpoints total.** Spec: `docs/superpowers/specs/2026-06-09-marketing-phase5-strategy-monitoring-ads-design.md` (read it fully — §1.1 data lanes, §3 scope decisions, §4 server design, §6 components, §8 sub-phasing/tests, §9 resolved open items, §11 risks, §12 sequenced checklist, §13 cited refs).

**Tech Stack:** React 18 + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3 + lucide-react + Express v5 + `@supabase/supabase-js` (present) + `@google/genai` (present) + `cheerio` (present, added Phase 4). Node ≥ 20 (global `fetch`). **NO new deps** (spec §O-9): cheerio + DataForSEO + YouTube + Gemini + Supabase all wired; no recharts in Phase 5. Tests: vitest + @testing-library/react (jsdom).

**Conventions (match Phase 0 / 1a–1d / 2 / 3 / 4 — spec §2, marketing `CLAUDE.md`):**
- **Data-lane discipline (the #1 architectural axis — each pillar differs):** A = client-parse + supabase-direct write + 1 server disk-list; B = server-proxy search/comment + supabase-direct keyword hooks; C = client-only + 1 supabase read; D = server-proxy. House envelope `res.json({ success: true, data })`; failure `throw new AppError(status, msg)`. Controllers `asyncHandler`.
- TanStack Query = server data; Zustand (`ui-store`) = UI state only. **No server data in Zustand.** `selectedProjectId` from `ui-store`; project presence booleans (`!!project.meta_credentials`) from the `useProject` cache for empty-state gating. **Monitoring feed** + **comment** + **SERP** results = **transient mutations** (not cached). `strategyTemplates` + `monitoringKeywords` = **cached queries** (`mktKeys`).
- Files: **PascalCase** components (`StrategyDashboard.tsx`, `MonitoringDashboard.tsx`, …), **camelCase** data/util/hook files (`use-monitoring.ts`, `use-monitoring-keywords.ts`). Named exports for components (pages default). ContentFlow used kebab-case files — rename on port.
- Client UI primitives from `../../ui/<name>`, `cn` from `../../lib/utils`, types from `../../types/{database,analytics}` (or new `types/monitoring.ts`), icons from `lucide-react`. Drop every `'use client'`; replace `next/image`/`<img>` with plain `<img>`. Korean user-facing strings + `break-keep` on narrow Korean text (RULE — 좁은 카드/배너).
- Server: `routes(URL) → controllers(req parse + asyncHandler) → services(logic, AppError throw) → providers/external`. Server import paths use the `.js` extension (ESM). `config` from `../config/index.js` (providers) / `../../config/index.js` (services). Gemini via `generateTextWithGemini(prompt, 3, config.gemini.textModel)` (NOT raw `GoogleGenAI`).
- **Secrets discipline (R-1, HIGH — the #1 invariant):** the Meta page token (`meta_credentials.pages[].pageAccessToken`), the YouTube Data key (`config.youtubeApiKey`), DataForSEO basic-auth (`config.dataforseo`), the Gemini key are read **server-side only** (via `getSupabaseAdmin()` / `config`), **never** `VITE_`-prefixed, **never** sent in a client→server body, **never** echoed in any response. The browser holds only presence booleans. **No client module imports `supabase-admin.provider`.** CF's IG token-in-client-body is deliberately closed.
- Commit after every chunk. Commit messages in English. End each with the trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Port-task pattern** (verbatim/near-verbatim UI where TDD is impractical): copy CF source → rename to PascalCase → rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/utils` → `../../lib/utils`, `@/types/*` → `../../types/*`, Zustand `useProjectStore` → `useProject(id)` + `ui-store`, inline `fetch('/api/monitoring/*')` → the new server-proxy TanStack hooks) → strip `'use client'` + Next `<img>` → adapt CF→worktree deltas → **typecheck → build → manual-verify in `/marketing/{strategy,monitoring,ads}` → commit**. Called **"port → typecheck → manual-verify → commit"** below.

> @superpowers:test-driven-development for the pure-logic steps (failing test → run → impl → run → commit): the **3 monitoring scrape→FeedItem mappers** (`mapJisikinResults` / `mapNaverBlogResults` / `mapGoogleBlogResults`); the **`formatViews`** (억/만) helper; the **SERP `mapSerpResults`** mapper; the **`strategyTemplates`** dir-handling (absent dir → `[]`, title/desc regex); the **`use-monitoring-keywords`** `user_id` stamp (light render test). (`parseStrategyHtml` is **already tested** client-side — reused as-is, do NOT re-test.) @superpowers:verification-before-completion before any "done" claim in the final-gates chunk.

---

## Verification commands (confirmed against worktree `package.json` scripts)

| Purpose | Command |
|---|---|
| Client typecheck | `pnpm --filter @tangobook/client typecheck` (→ `tsc --noEmit`) |
| Server typecheck | `pnpm --filter @tangobook/server typecheck` (→ `tsc --noEmit`) |
| All-package typecheck | `pnpm typecheck` (shared → server → client) |
| Client marketing tests | `pnpm --filter @tangobook/client test marketing` (`test` = `vitest run`; arg = path substring filter). Per-file e.g. `pnpm --filter @tangobook/client test use-monitoring-keywords`. |
| Server marketing tests | `pnpm --filter @tangobook/server test mkt` (per-file e.g. `pnpm --filter @tangobook/server test monitoring.service` / `… strategy.controller` / `… dataforseo`). |
| Lint | `pnpm lint` (`eslint packages --ext .ts,.tsx`) |
| Client build | `pnpm --filter @tangobook/client build` (`vite build`). **Server gate = server typecheck** (tsx runtime, no `tsc` emit gate — Phase 3/4 posture). |

> **Marketing test baseline (VERIFIED post-Phase-4):** **58 client marketing `*.test.ts(x)` files** + **13 server `mkt` test files** exist today (through Phase 4). The Phase-4 plan quoted growing totals (388 client / 47 server were the Phase-3 totals; Phase 4 added more). The final-gates chunk (P5-F) asserts **growth** over the current (post-Phase-4) totals: the new files below add **≥ 2 server** test files (`monitoring.service` mappers/formatViews, `dataforseo` SERP `mapSerpResults`; + `strategy.controller` dir-handling = 3) + **≥ 1 client** test file (`use-monitoring-keywords`); both total test counts must strictly increase. Pre-existing non-marketing failures (auth `RequireAuthedWithPin`, games `SpeakingPlayer`, viewer `GameListViewer` — jsdom `window.matchMedia`) are unchanged and out of scope.

---

## File Structure

```
packages/server/
  src/services/mkt/external/
    dataforseo.ts                             EDIT wire getSerpResults (add languageCode param) + mapSerpResults (pure)
  src/services/mkt/
    strategy.service.ts                       NEW  listStrategyTemplates (fs.readdir dev/prod dir, title/desc regex, graceful empty)
    monitoring.service.ts                     NEW  mapJisikin/NaverBlog/GoogleBlog (pure) + per-source SSRF-guarded fetch + youtube reuse + instagram (resolveMetaCredentials) + monitoringComment (Gemini) + formatViews (pure)
    competitors.service.ts                    EDIT add serpAnalysis(keyword, language) → getSerpResults → SerpResultItem[]
    __tests__/
      strategy.controller.test.ts             NEW  TDD listStrategyTemplates dir handling (absent → [] ; title/desc regex from fixture head ; mock fs)
      monitoring.service.test.ts              NEW  TDD mapJisikin/NaverBlog/GoogleBlog (fixture HTML → FeedItem[] + URL-host filters) + formatViews
    external/__tests__/
      dataforseo.test.ts                      EDIT add mapSerpResults cases (stub items[] → SerpResultItem[], organic filter, top-N)
  src/controllers/mkt/
    strategy.controller.ts                    NEW  strategyTemplates (disk list)
    monitoring.controller.ts                  NEW  monitoringSearch + monitoringComment
    competitors.controller.ts                 EDIT add competitorsSerp
  src/routes/mkt.routes.ts                    EDIT register 4 routes (strategy/templates GET + monitoring/search + monitoring/comment + competitors/serp)

packages/client/
  src/features/marketing/
    types/
      database.ts                             EDIT add MonitoringKeyword interface
      monitoring.ts                           NEW  MonitoringFeedItem / StrategyTemplateMeta / SerpResultItem (or append to analytics.ts)
    api/
      queries.ts                              EDIT add strategyTemplates + monitoringKeywords mktKeys (after :46)
      use-strategy-templates.ts               NEW  useStrategyTemplates (query → GET /strategy/templates)
      use-monitoring.ts                       NEW  useMonitoringSearch + useMonitoringComment (transient mutations)
      use-monitoring-keywords.ts              NEW  useMonitoringKeywords (query) + useAddMonitoringKeyword / useRemoveMonitoringKeyword (mutations, user_id stamp)
      use-competitors.ts                      EDIT add useCompetitorSerp (transient mutation → /competitors/serp)
      __tests__/
        use-monitoring-keywords.test.tsx      NEW  light render test (mocked supabase): add stamps user_id ; list/remove unwrap
    components/
      strategy/                               NEW directory
        StrategyDashboard.tsx                 NEW  header (FileText + project name + 임포트 button) + <select> templates + <iframe src> + 새 창 열기
        StrategyImportDialog.tsx              NEW  템플릿 선택 | 파일 업로드 tabs → parseStrategyHtml (client lib) → preview → useUpdateProject({imported_strategy})
      monitoring/                             NEW directory
        MonitoringDashboard.tsx               NEW  MarketingLanguageTabs + keyword chips (persisted) + 번역 + 검색 + platform filter tabs + feed + AI 댓글 (port 491 LOC)
        MonitoringFeedCard.tsx                NEW  (extracted) one feed item: header + snippet + thumbnail + AI-comment block
      ads/                                    NEW directory
        AdsDashboard.tsx                      NEW  MarketingLanguageTabs + Meta/YouTube tabs + 4 overview cards + create-campaign form (published picker) + list + detail (port 449 LOC, neutral copy)
      competitors/
        CompetitorsDashboard.tsx              EDIT add 3rd tab 'serp' (SERP 분석): keyword input → useCompetitorSerp → top-N list
    pages/
      StrategyPage.tsx                        NEW  project guard → <StrategyDashboard projectId/>
      MonitoringPage.tsx                      NEW  project guard → <MonitoringDashboard projectId/>
      AdsPage.tsx                             NEW  project guard → <AdsDashboard projectId/>
    index.ts                                  EDIT export the 3 pages
  src/router/index.tsx                        EDIT :321 monitoring, :325 strategy, :326 ads → 3 pages (+ imports)
  public/marketing-strategy-templates/.gitkeep  NEW  template dir (R-A; ship EMPTY, distinct from public/strategy.html)
```

### Chunk dependency order (each chunk runnable in this order; implementers run SEQUENTIALLY)

| Chunk | Sub-phase | Title | Depends on | Verifiable | TDD | Data-path | Swaps |
|---|---|---|---|---|---|---|---|
| **P5-C1** | 5a | Strategy templates endpoint + dir + types/keys | — | `… test strategy.controller` (FAIL→PASS) + server typecheck | **YES** (dir handling) | server-proxy (disk) | — |
| **P5-C2** | 5a | `use-strategy-templates` + `StrategyDashboard` + `StrategyImportDialog` + `StrategyPage` + route swap | P5-C1 | client typecheck + build + manual | no | client-only parse + supabase-direct write | `:325` |
| **P5-C3** | 5b | `monitoring.service` (3 scrape mappers + youtube + ig + comment + formatViews) | — | `… test monitoring.service` (FAIL→PASS) + server typecheck | **YES** (mappers + formatViews) | server-proxy | — |
| **P5-C4** | 5b | `monitoring.controller` (search + comment) + 2 routes | P5-C3 | server typecheck | no | server-proxy | — |
| **P5-C5** | 5b | `MonitoringKeyword` type + `use-monitoring-keywords` (supabase-direct, user_id stamp) | — | `… test use-monitoring-keywords` + client typecheck | **YES** (light render — user_id stamp) | supabase-direct | — |
| **P5-C6** | 5b | `use-monitoring` (search + comment mutations) | P5-C4 | client typecheck | no | server-proxy | — |
| **P5-C7** | 5b | `MonitoringDashboard` + `MonitoringFeedCard` + `MonitoringPage` + route swap | P5-C2, P5-C5, P5-C6 | client typecheck + build + manual | no | server-proxy + supabase-direct | `:321` |
| **P5-C8** | 5c | `AdsDashboard` (client-only, neutral copy, `mkt_publish_records` read) + `AdsPage` + route swap | P5-C2 | client typecheck + build + manual | no | client-only + 1 supabase read | `:326` |
| **P5-C9** | 5c | `dataforseo.getSerpResults` + `mapSerpResults` (pure) + `competitors.service.serpAnalysis` + `competitorsSerp` controller + `/competitors/serp` route | — | `… test dataforseo` (mapSerpResults FAIL→PASS) + server typecheck | **YES** (`mapSerpResults`) | server-proxy | — |
| **P5-C10** | 5c | `useCompetitorSerp` (transient mutation) + add SERP tab to `CompetitorsDashboard` | P5-C9 | client typecheck + build + manual | no | server-proxy | — (edits live tab) |
| **P5-F** | final | Full gates + secret-safety greps + scope greps + docs + operator checklist | P5-C1…C10 | full suite/typecheck/lint/build + greps | no | — | — |

> **Sub-phase split (spec §8, §12):** **5a = 전략** (P5-C1–C2, smallest — reuses the already-ported parser; lowest risk; ship first). **5b = 모니터링** (P5-C3–C7, the biggest — carries the scrape mappers + keyword persistence + the 491-LOC dashboard). **5c = 광고 + 경쟁사 SERP** (P5-C8–C10, client-only ads + the DataForSEO SERP tab). Each sub-phase is independently shippable behind its placeholder. **R-1 secret-safety** (Meta token / YouTube key / DataForSEO / Gemini all server-only) is the #1 invariant — covered by the IG-route server-read + the P5-F greps. **Do not skip the TDD chunks (P5-C1 dir-handling, P5-C3 mappers, P5-C5 user_id stamp, P5-C9 mapSerpResults).**

---

## Chunk P5-C1: Strategy templates endpoint + template dir + types + keys — TDD

> The one server piece of pillar A: `GET /api/mkt/strategy/templates` reads a server-owned directory (dev: `client/public/marketing-strategy-templates`, prod: `client/dist/...`), returns `{title, description, size, modifiedAt, url}` metadata per `*.html`. **TDD the dir handling** (absent dir → `[]` not 500; title/description regex from fixture head). Plus the new client view-model types + the 2 `mktKeys`. **No secret. No SSRF** (fixed server-owned dir, never a user URL).

**Files:**
- Create: `packages/server/src/services/mkt/strategy.service.ts`
- Create: `packages/server/src/controllers/mkt/strategy.controller.ts`
- Test: `packages/server/src/services/mkt/__tests__/strategy.controller.test.ts` (tests `listStrategyTemplates` from the service)
- Modify: `packages/server/src/routes/mkt.routes.ts`
- Create: `packages/client/public/marketing-strategy-templates/.gitkeep`
- Create: `packages/client/src/features/marketing/types/monitoring.ts` (shared view-models for the phase — `StrategyTemplateMeta` here; `MonitoringFeedItem` + `SerpResultItem` added in P5-C5/P5-C9, or stub all three now)
- Modify: `packages/client/src/features/marketing/api/queries.ts`

- [ ] **Step 1 (test — `listStrategyTemplates` dir handling, TDD):** Failing test (spec §8 5a / §10). Mock `node:fs/promises` (`vi.mock`). Cover:
  - dir absent (`fs.readdir` rejects) → returns `{ templates: [] }` (no throw).
  - dir present with a fixture `.html` whose head has `<title>X</title>` + `<meta name="description" content="Y">` → `templates[0]` = `{ filename, title: 'X', description: 'Y', size, modifiedAt (ISO), url: '/marketing-strategy-templates/<file>' }`.
  - non-`.html` files filtered out; results sorted by `title.localeCompare`.
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  vi.mock('node:fs/promises');
  import fs from 'node:fs/promises';
  import { listStrategyTemplates } from '../strategy.service.js';

  beforeEach(() => vi.resetAllMocks());

  it('returns [] when the template dir is absent (no throw)', async () => {
    (fs.readdir as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ENOENT'));
    expect(await listStrategyTemplates()).toEqual({ templates: [] });
  });

  it('extracts title/description from the html head', async () => {
    (fs.readdir as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(['a.html', 'note.txt'] as never);
    (fs.stat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ size: 123, mtime: new Date('2026-06-09T00:00:00Z') } as never);
    (fs.readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      '<html><head><title>전략 A</title><meta name="description" content="설명 A"></head><body></body></html>' as never,
    );
    const { templates } = await listStrategyTemplates();
    expect(templates).toHaveLength(1); // .txt filtered
    expect(templates[0]).toMatchObject({ filename: 'a.html', title: '전략 A', description: '설명 A', url: '/marketing-strategy-templates/a.html' });
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test strategy.controller` → **FAIL** (`listStrategyTemplates` not exported).
- [ ] **Step 3 (impl `strategy.service.ts`):** Port CF `strategy/templates/route.ts` (spec §4.1 verbatim). `import fs from 'node:fs/promises'; import path from 'node:path';`. `DEV_DIR = path.join(process.cwd(), 'packages/client/public/marketing-strategy-templates')`; `DIST_DIR = path.join(process.cwd(), 'packages/client/dist/marketing-strategy-templates')`. `listStrategyTemplates()`: `dir = NODE_ENV === 'production' ? DIST_DIR : DEV_DIR`; `try { files = (await fs.readdir(dir)).filter(f => f.endsWith('.html')); } catch { files = []; }`; for each, `fs.stat` + `fs.readFile(...).slice(0,4000)` head, regex `<meta name="title" content="...">` || `<title>...</title>` for title, `<meta name="description" content="...">` for description; map to `{ filename, title, description, size, modifiedAt: mtime.toISOString(), url: '/marketing-strategy-templates/'+filename }`; sort by `title.localeCompare`; return `{ templates }`.
- [ ] **Step 4 (impl `strategy.controller.ts`):** `export const strategyTemplates = asyncHandler(async (_req, res) => { const data = await listStrategyTemplates(); res.json({ success: true, data }); });` (graceful empty already handled in the service — never 500 for a missing dir).
- [ ] **Step 5 (route):** In `mkt.routes.ts`, import `strategyTemplates` + add a `// ── Strategy (template viewer — disk list; import parse is client-side) ──` section after the competitors block (`:80`): `router.get('/strategy/templates', strategyTemplates);`.
- [ ] **Step 6 (template dir):** Create `packages/client/public/marketing-strategy-templates/.gitkeep` (empty file). **Ship EMPTY** (R-A / R decision) — the empty-state UI handles "등록된 마케팅 전략 파일이 없습니다". Do NOT seed a sample template.
- [ ] **Step 7 (client types + keys):** Create `types/monitoring.ts` with `export interface StrategyTemplateMeta { filename: string; title: string; description: string; size: number; modifiedAt: string; url: string; }` (and optionally stub `MonitoringFeedItem` + `SerpResultItem` now — see P5-C5/P5-C9). In `queries.ts`, add to `mktKeys` after `youtubeChannel` (`:46`):
  ```ts
  strategyTemplates: () => ['mkt', 'strategy', 'templates'] as const,
  monitoringKeywords: (projectId: string) => ['mkt', 'monitoring', 'keywords', projectId] as const,
  ```
- [ ] **Step 8 (run + typecheck):** `pnpm --filter @tangobook/server test strategy.controller` → **PASS**. `pnpm --filter @tangobook/server typecheck` + `pnpm --filter @tangobook/client typecheck` → PASS.
- [ ] **Step 9:** Commit:
  ```bash
  git add packages/server/src/services/mkt/strategy.service.ts packages/server/src/controllers/mkt/strategy.controller.ts packages/server/src/services/mkt/__tests__/strategy.controller.test.ts packages/server/src/routes/mkt.routes.ts packages/client/public/marketing-strategy-templates/.gitkeep packages/client/src/features/marketing/types/monitoring.ts packages/client/src/features/marketing/api/queries.ts
  git commit -m "feat(marketing/p5-c1): strategy templates disk-list endpoint + template dir + view-model types + mktKeys + tests"
  ```

**Data path:** server-proxy (disk read, no secret, no SSRF). **Verify gate:** `pnpm --filter @tangobook/server test strategy.controller` green (FAIL→PASS) + both typechecks PASS. **No route swap** (endpoint only).

---

## Chunk P5-C2: Strategy dashboard + import dialog + page + route swap (`:325`)

> The client side of pillar A: the iframe template viewer (`StrategyDashboard`) + the HTML-import dialog (`StrategyImportDialog`, **client-side parse** via the already-ported `parseStrategyHtml`) + the page guard + the route swap. **Mechanical UI port** verified by typecheck + build + manual. The import dialog is the **first ever writer** of `imported_strategy` (R-F).

**Files:**
- Create: `packages/client/src/features/marketing/api/use-strategy-templates.ts`
- Create: `packages/client/src/features/marketing/components/strategy/StrategyDashboard.tsx`
- Create: `packages/client/src/features/marketing/components/strategy/StrategyImportDialog.tsx`
- Create: `packages/client/src/features/marketing/pages/StrategyPage.tsx`
- Modify: `packages/client/src/features/marketing/index.ts`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1 (`use-strategy-templates.ts`):** `useStrategyTemplates()` = `useQuery({ queryKey: mktKeys.strategyTemplates(), queryFn: () => fetch('/api/mkt/strategy/templates').then(r => r.json()).then(j => (j.data?.templates ?? []) as StrategyTemplateMeta[]) })`. (A plain GET — no body; cached query.)
- [ ] **Step 2 (`StrategyDashboard.tsx`, port CF `strategy-dashboard.tsx`):** `useStrategyTemplates()` → `<select>` of titles + `<iframe src={selected.url} key={selected.filename}>` (full-height) + 새 창 열기 link (`<a href={selected.url} target="_blank">`) + a header **"전략 HTML 임포트"** button (O-2 — Tangobook sidebar is flat, no per-project dropdown) → opens `StrategyImportDialog`. Empty state (no templates): "등록된 마케팅 전략 파일이 없습니다 — `public/marketing-strategy-templates/`" (faithful to CF `:96-100`, path updated). Header = `FileText` icon + `project.name` (from `useProject(projectId)`).
- [ ] **Step 3 (`StrategyImportDialog.tsx`, port CF `strategy-import-dialog.tsx`):** Two modes (템플릿 선택 / 파일 업로드). **Parse runs client-side** with `parseStrategyHtml` (`lib/strategy-html-parser.ts`): template mode `fetch(tpl.url).then(r => r.text())` → `parseStrategyHtml(html)`; upload mode `file.text()` → `parseStrategyHtml(text)`. Preview = 3 count cards (키워드/카테고리/주제) + golden-keyword chips + category cards (port CF `:213-256`). "프로젝트에 적용" → **`useUpdateProject().mutate({ id: projectId, updates: { imported_strategy: { importedAt: new Date().toISOString(), sourceFileName, keywords, categories } } })`** (NOTE the real signature — `useUpdateProject()` takes no arg; the mutation arg is `{ id, updates }`, NOT `useUpdateProject(projectId).mutate({imported_strategy})`). Parse errors (unsupported HTML) → red banner. Reuse `ParseResult` type from `lib/strategy-html-parser.ts`.
- [ ] **Step 4 (`StrategyPage.tsx`):** Mirror `IdeasPage`/`CompetitorsPage` guard: `selectedProjectId` from `ui-store`; no project → centered "프로젝트를 선택하세요"; else `<StrategyDashboard projectId={selectedProjectId} />`.
- [ ] **Step 5 (`index.ts` + route swap):** Export `StrategyPage`. In `router/index.tsx`: add `StrategyPage` to the marketing import block (`:13-15` area) + swap `:325` `{ path: 'strategy', element: <PlaceholderPage title="마케팅 전략" /> }` → `{ path: 'strategy', element: <StrategyPage /> }`.
- [ ] **Step 6 (typecheck + build + manual):** `pnpm --filter @tangobook/client typecheck` + `pnpm --filter @tangobook/client build` → PASS. Manual: `/marketing/strategy` renders (empty templates → empty state; 임포트 button opens the dialog; upload a strategy HTML → preview counts → 적용 writes `imported_strategy`).
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-strategy-templates.ts packages/client/src/features/marketing/components/strategy/ packages/client/src/features/marketing/pages/StrategyPage.tsx packages/client/src/features/marketing/index.ts packages/client/src/router/index.tsx
  git commit -m "feat(marketing/p5-c2): wire /marketing/strategy -> StrategyDashboard (iframe viewer + client-parse import dialog) + page + route swap"
  ```

**Data path:** client-only parse + supabase-direct write (`useUpdateProject`). **Verify gate:** client typecheck + build PASS; manual render of `/marketing/strategy` (empty state + import round-trip). **Route swap:** `:325` strategy.

---

## Chunk P5-C3: Monitoring service — 3 scrape mappers + youtube + ig + comment + formatViews — TDD

> The server core of pillar B (the biggest chunk's logic). `monitoring.service.ts`: the **3 pure scrape→FeedItem mappers** (the cleanest TDD units), the per-source SSRF-guarded fetch dispatch, the YouTube source (reuse `searchVideos`+`getVideoStats`), the Instagram source (reuse `resolveMetaCredentials` → Graph, **token server-side**), the Gemini comment, and the pure `formatViews` (억/만). **TDD the 3 mappers + `formatViews`.** No controller/route here (P5-C4).

**Files:**
- Create: `packages/server/src/services/mkt/monitoring.service.ts`
- Test: `packages/server/src/services/mkt/__tests__/monitoring.service.test.ts`

- [ ] **Step 1 (test — 3 mappers + formatViews, TDD):** Failing tests (spec §8 5b / §10). Provide fixture HTML strings (`cheerio.load`), assert the `FeedItem[]`:
  - `mapJisikinResults($, max)` — fixture mimicking `kin.naver.com/search/list.naver` results → `FeedItem[]` with `platform: 'naver_jisikin'`, title/url/snippet/author; **URL-host filter keeps only `kin.naver.com` links**; respects `max`.
  - `mapNaverBlogResults($, max)` — fixture mimicking `search.naver.com?where=blog` → `platform: 'naver_blog'`; **keeps only `blog.naver.com`**.
  - `mapGoogleBlogResults($, max)` — fixture mimicking `google.com/search` → `platform: 'wordpress'`; **excludes `google.com` self-links**.
  - `formatViews(n)` table: `12_300_000 → '1230만'` (or CF's exact format — match CF), `8_500 → '8,500'` / `0 → '0'` (faithful to CF's 억/만 thresholds — read CF `youtube/route.ts` view formatting + replicate exactly).
  ```ts
  import { describe, it, expect } from 'vitest';
  import * as cheerio from 'cheerio';
  import { mapJisikinResults, formatViews } from '../monitoring.service.js';

  it('mapJisikinResults keeps only kin.naver.com links and maps to FeedItem', () => {
    const html = `<ul><li class="result"><a href="https://kin.naver.com/qna/detail?d1id=1">제목1</a><div class="desc">내용1</div></li>
                  <li class="result"><a href="https://ad.example.com/x">광고</a></li></ul>`;
    const out = mapJisikinResults(cheerio.load(html), 10);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ platform: 'naver_jisikin', title: '제목1', url: expect.stringContaining('kin.naver.com') });
  });
  ```
  > **Selector fidelity:** port CF's exact selectors + the **2 fallback strategies per source** (CF `monitoring/search/{naver,naver-blog,google-blog}/route.ts` each have a primary + fallback selector set — R-8). Keep the fixture aligned to whichever selector the impl reads first; the test asserts the mapper contract, not the live HTML.
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test monitoring.service` → **FAIL**.
- [ ] **Step 3 (impl `monitoring.service.ts`):** Spec §4.2.
  - `export interface FeedItem { platform: 'naver_jisikin'|'naver_blog'|'wordpress'|'youtube'|'instagram'; id; title; snippet; author; url?; thumbnail?; publishedAt?; language; views?; engagement?: { likes; comments } }`.
  - The 3 pure mappers (exported, tested above) — `import * as cheerio from 'cheerio'` (present).
  - Per-source SSRF-guarded fetch builders (each builds a **fixed-host** URL with `encodeURIComponent(keyword)` + `AbortSignal.timeout(10_000)` — **NOT** the private `assertSafeUrl` from `seo.service.ts`, which is non-exported; the fixed-host approach is the spec's §4.2 SSRF posture): `fetchJisikin` (`kin.naver.com/search/list.naver?query=…&sort=date`, UA + `Accept-Language: ko`), `fetchNaverBlog` (`search.naver.com/search.naver?where=blog&query=…&sort=sim`), `fetchGoogleBlog` (`google.com/search?q=<kw> blog&hl=<lang>&num=N`) → `cheerio.load` → mapper.
  - `searchMonitoring({ projectId, keyword, language, sources })` — fan out (server-side `Promise.allSettled` per source) → flat `{ items: FeedItem[] }`. **Per-source try/catch** → a failing source contributes `[]` (never crash). Non-ko language → naver sources skipped (server-guards even if client omits).
  - `youtube` source: `searchVideos(keyword, { relevanceLanguage: language, order: 'relevance', maxResults })` + `getVideoStats(ids)` → map to FeedItem (`views: formatViews(viewCount)`, `engagement: { likes, comments }`). **No HTML fallback** (drop CF's `ytInitialData`). `searchVideos` throws 502 when no key → catch → `[]`.
  - `instagram` source: `resolveMetaCredentials(projectId)` → `page = pages[0]`; if `page.instagram?.id` → Graph `ig_hashtag_search` then `{hashtagId}/recent_media` (token server-side, from the resolved page) → map. `resolveMetaCredentials` throws `AppError(501)` when no Meta → catch → `[]`. **Token NEVER on the wire** (R-1).
  - `monitoringComment({ contentText, platform, tone, language, projectContext? })` → port CF prompt verbatim (`monitoring/comment/route.ts:21-37` — platform/tone maps, "sound like a real person not a bot", language switch) → `generateTextWithGemini(prompt, 3, config.gemini.textModel)` → `{ comment }`. Missing Gemini key → the wrapper throws → controller surfaces `AppError(502)` (P5-C4).
  - `formatViews(n)` — pure, 억/만 thresholds matching CF (tested).
- [ ] **Step 4 (run + typecheck):** `pnpm --filter @tangobook/server test monitoring.service` → **PASS**. `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/server/src/services/mkt/monitoring.service.ts packages/server/src/services/mkt/__tests__/monitoring.service.test.ts
  git commit -m "feat(marketing/p5-c3): monitoring service (3 scrape mappers + youtube/ig sources + Gemini comment + formatViews) + tests"
  ```

**Data path:** server-proxy (scrape + YouTube key + Meta token read server-side via `resolveMetaCredentials` + Gemini). **R-1:** the Meta token is resolved server-side from `meta_credentials`, never sent by the client, never echoed. **Verify gate:** `pnpm --filter @tangobook/server test monitoring.service` green (FAIL→PASS) + server typecheck PASS.

---

## Chunk P5-C4: Monitoring controllers + 2 routes

> Wire `monitoring.service` to Express: `monitoringSearch` (`{projectId, keyword, language, sources?}`) + `monitoringComment` (`{contentText, platform, tone, language, projectContext?}`) + register the 2 routes. **Mechanical** (no TDD). Graceful: search always `{success:true, data:{items}}` (never 500 for a scrape miss); comment 502 on missing Gemini key.

**Files:**
- Create: `packages/server/src/controllers/mkt/monitoring.controller.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (impl `monitoring.controller.ts`):** Mirror `ideas.controller.ts`. Both `asyncHandler`.
  ```ts
  export const monitoringSearch = asyncHandler(async (req, res) => {
    const { projectId, keyword, language, sources } = req.body as { projectId?: string; keyword?: string; language?: string; sources?: string[] };
    if (!projectId || !keyword) throw new AppError(400, 'projectId and keyword are required');
    const data = await searchMonitoring({ projectId, keyword, language: language ?? 'ko', sources });
    res.json({ success: true, data }); // { items }
  });
  export const monitoringComment = asyncHandler(async (req, res) => {
    const { contentText, platform, tone, language, projectContext } = req.body as { contentText?: string; platform?: string; tone?: string; language?: string; projectContext?: string };
    if (!contentText) throw new AppError(400, 'contentText is required');
    const data = await monitoringCommentSvc({ contentText, platform: platform ?? 'naver_blog', tone: tone ?? 'friendly', language: language ?? 'ko', projectContext });
    res.json({ success: true, data }); // { comment }
  });
  ```
- [ ] **Step 2 (routes):** In `mkt.routes.ts`, import the 2 controllers + add a `// ── Monitoring (server-proxy; scrape + youtube + ig-token-server-side + gemini) ──` section after the strategy route: `router.post('/monitoring/search', monitoringSearch); router.post('/monitoring/comment', monitoringComment);`.
- [ ] **Step 3 (typecheck):** `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/server/src/controllers/mkt/monitoring.controller.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing/p5-c4): monitoring controllers (search + comment) + 2 routes"
  ```

**Data path:** server-proxy. **Verify gate:** server typecheck PASS. **No route swap** (endpoints only).

---

## Chunk P5-C5: `MonitoringKeyword` type + supabase-direct keyword hooks — TDD (light)

> Pillar B's persistence lane: the `mkt_monitoring_keywords` table (exists) read/write via **supabase-direct** hooks. **Every insert stamps `user_id`** (`getCurrentUserId()` → row) to satisfy `with check (user_id = auth.uid())` (R-B / the Phase-1 gotcha (a)). **Light render test** (mocked supabase) asserting the `user_id` stamp + list/remove unwrap.

**Files:**
- Modify: `packages/client/src/features/marketing/types/database.ts`
- Create: `packages/client/src/features/marketing/api/use-monitoring-keywords.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-monitoring-keywords.test.tsx`

- [ ] **Step 1 (test — user_id stamp, TDD light):** Failing render test (mock `../supabase` → `getCurrentUserId` returns `'u1'` + a chainable `supabase.from(...).insert/select/delete` mock). Assert: `useAddMonitoringKeyword().mutate({ projectId, keyword })` calls `.insert` with a row carrying `user_id: 'u1'` + `project_id` + `keyword` + `search_engine: 'naver'` (default); `useMonitoringKeywords(projectId)` unwraps the select to `MonitoringKeyword[]`; remove calls `.delete().eq('id', …)`. (Mirror an existing supabase-direct hook test if one exists — e.g. `use-publish-records` test posture.)
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/client test use-monitoring-keywords` → **FAIL**.
- [ ] **Step 3 (impl `database.ts` type):** Add (the table exists; only the interface is missing — VERIFIED `schema.sql:393-406`):
  ```ts
  export interface MonitoringKeyword {
    id: string;
    user_id: string;
    project_id: string;
    keyword: string;
    search_engine: 'naver' | 'google';
    is_golden: boolean;
    category: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }
  ```
- [ ] **Step 4 (impl `use-monitoring-keywords.ts`):** Parallel Phase-3 `use-publish-records.ts`. Uses the supabase-direct client (`./supabase`) + `getCurrentUserId`.
  - `useMonitoringKeywords(projectId)` — `useQuery({ queryKey: mktKeys.monitoringKeywords(projectId), queryFn: () => supabase.from('mkt_monitoring_keywords').select('*').eq('project_id', projectId).order('sort_order') → MonitoringKeyword[] })`.
  - `useAddMonitoringKeyword()` — `useMutation` → `const user_id = await getCurrentUserId();` → `.insert({ user_id, project_id, keyword, search_engine: 'naver', is_golden: false, sort_order: 0 })` → invalidate `monitoringKeywords(projectId)`. **The `unique(project_id, keyword, search_engine)` constraint** → on duplicate, swallow the unique-violation error (or guard client-side before insert) so adding a dup is a no-op, not a crash (R-B).
  - `useRemoveMonitoringKeyword()` — `useMutation` → `.delete().eq('id', id)` → invalidate.
- [ ] **Step 5 (run + typecheck):** `pnpm --filter @tangobook/client test use-monitoring-keywords` → **PASS**. `pnpm --filter @tangobook/client typecheck` → PASS.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/types/database.ts packages/client/src/features/marketing/api/use-monitoring-keywords.ts packages/client/src/features/marketing/api/__tests__/use-monitoring-keywords.test.tsx
  git commit -m "feat(marketing/p5-c5): MonitoringKeyword type + supabase-direct keyword hooks (user_id stamp) + test"
  ```

**Data path:** supabase-direct (the one place pillar B touches Supabase directly). **R-B:** `user_id` stamp on every insert (RLS `with check`). **Verify gate:** `pnpm --filter @tangobook/client test use-monitoring-keywords` green (FAIL→PASS) + client typecheck PASS.

---

## Chunk P5-C6: Monitoring search/comment mutation hooks

> The transient server-proxy hooks the dashboard calls per keyword. **Mechanical** (no TDD — thin wrappers over `postMkt`).

**Files:**
- Create: `packages/client/src/features/marketing/api/use-monitoring.ts`

- [ ] **Step 1 (impl `use-monitoring.ts`):** Reuse `postMkt` (exported from `use-analytics.ts`). Add `MonitoringFeedItem` to `types/monitoring.ts` if not stubbed in P5-C1 (mirror the server `FeedItem`).
  - `useMonitoringSearch()` — `useMutation({ mutationFn: (args: { projectId; keyword; language; sources?: string[] }) => postMkt<{ items: MonitoringFeedItem[] }>('/monitoring/search', args).then(r => r?.items ?? []) })`. Transient (the dashboard accumulates results into per-lang feed state; one request per keyword, faithful to CF `handleSearch` but consolidated).
  - `useMonitoringComment()` — `useMutation({ mutationFn: (args: { contentText; platform; tone; language; projectContext? }) => postMkt<{ comment: string }>('/monitoring/comment', args).then(r => r?.comment ?? '') })`.
- [ ] **Step 2 (typecheck):** `pnpm --filter @tangobook/client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-monitoring.ts packages/client/src/features/marketing/types/monitoring.ts
  git commit -m "feat(marketing/p5-c6): use-monitoring search + comment mutation hooks (transient)"
  ```

**Data path:** server-proxy (no secret in body — only `{projectId, keyword, language, sources}`). **Verify gate:** client typecheck PASS.

---

## Chunk P5-C7: `MonitoringDashboard` + `MonitoringFeedCard` + page + route swap (`:321`)

> The big UI port (CF `monitoring-dashboard.tsx`, 491 LOC). `MarketingLanguageTabs` + **persisted** keyword chips (`use-monitoring-keywords`) + 번역 + 검색 (per-keyword `useMonitoringSearch`) + platform filter tabs + feed cards + AI 댓글. **Mechanical port** verified by typecheck + build + manual. Extract `MonitoringFeedCard` for one feed item.

**Files:**
- Create: `packages/client/src/features/marketing/components/monitoring/MonitoringDashboard.tsx`
- Create: `packages/client/src/features/marketing/components/monitoring/MonitoringFeedCard.tsx`
- Create: `packages/client/src/features/marketing/pages/MonitoringPage.tsx`
- Modify: `packages/client/src/features/marketing/index.ts`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1 (`MonitoringDashboard.tsx`, port CF 491 LOC):**
  - `MarketingLanguageTabs` (ko-pinned, drives `selectedLang`) — replaces CF's bespoke lang row + inline "언어 추가" dialog (editing deferred to settings, faithful-enough; same as Phase 4 §6.6).
  - **Keyword chips** from `useMonitoringKeywords(projectId)` (persisted) + add/remove via the mutations (user_id stamp). CF's per-lang `keywordsPerLang` collapses to **per-project** (O-4); `selectedLang` drives sources/comment only. **Default seed = empty or generic** (NOT a customer's "소아성장"/"성장호르몬" — R-9).
  - **번역** button (non-ko tabs): client Gemini translate of ko keywords → fills the selected-lang **in-memory** view (faithful to CF `:106-125`, via the existing `/api/mkt/ai/generate` SSE `fetchAiGenerate`). Translated keywords stay in-memory (not persisted — O-4 default).
  - **🔍 검색**: for each current keyword, `useMonitoringSearch().mutateAsync({ projectId, keyword, language: selectedLang, sources })` (sources = ko → all; non-ko → omit naver) → accumulate `items` into per-lang feed state (transient). One request per keyword (CF made up to 4).
  - **Platform filter tabs** (전체/지식인/N블로그/구글블로그/인스타/페이스북/스레드) with counts; naver tabs hidden for non-ko (CF `:84`). FB/Threads tabs present but always empty (O-3, faithful — no search route feeds them).
  - The bottom "🔔 알림 설정" strip is a **static display** (CF `:482-488`, no backend) — keep as-is.
- [ ] **Step 2 (`MonitoringFeedCard.tsx`, extract):** One feed item: header (platform icon, title link, author, published-ago via `formatPublished`, views, engagement) + snippet + thumbnail (youtube 28×16, else 16×16) + **AI 댓글** block: `useMonitoringComment().mutate(...)` → comment text + 복사/재생성 (port CF `:376-476`). `break-keep` on Korean snippet/title.
- [ ] **Step 3 (`MonitoringPage.tsx`):** Guard → `<MonitoringDashboard projectId={selectedProjectId} />`.
- [ ] **Step 4 (`index.ts` + route swap):** Export `MonitoringPage`. In `router/index.tsx`: add import + swap `:321` `{ path: 'monitoring', element: <PlaceholderPage title="모니터링 / 댓글" /> }` → `{ path: 'monitoring', element: <MonitoringPage /> }`.
- [ ] **Step 5 (typecheck + build + manual):** client typecheck + build → PASS. Manual: `/marketing/monitoring` renders; add a keyword (persists across reload); 검색 returns feed (or empty without creds — no crash); AI 댓글 generates (or 502 error inline without Gemini).
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/monitoring/ packages/client/src/features/marketing/pages/MonitoringPage.tsx packages/client/src/features/marketing/index.ts packages/client/src/router/index.tsx
  git commit -m "feat(marketing/p5-c7): wire /marketing/monitoring -> MonitoringDashboard (persisted keywords + scrape/youtube/ig feed + AI comment) + page + route swap"
  ```

**Data path:** server-proxy (search/comment) + supabase-direct (keyword persistence). **Verify gate:** client typecheck + build PASS; manual render (persist keyword + empty-state graceful). **Route swap:** `:321` monitoring.

---

## Chunk P5-C8: `AdsDashboard` (client-only) + page + route swap (`:326`)

> Pillar C: a pure client-side campaign-planning mockup (campaigns in `useState`, never persisted) **+ one supabase-direct read** of `mkt_publish_records` for the "발행된 콘텐츠에서 선택" creative picker. **No API route, no table, no migration.** **Mechanical port** (CF `ads-dashboard.tsx`, 449 LOC) verified by typecheck + build + manual.

**Files:**
- Create: `packages/client/src/features/marketing/components/ads/AdsDashboard.tsx`
- Create: `packages/client/src/features/marketing/pages/AdsPage.tsx`
- Modify: `packages/client/src/features/marketing/index.ts`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1 (`AdsDashboard.tsx`, port CF 449 LOC):** `MarketingLanguageTabs` + Meta/YouTube platform tabs + 4 overview cards (총지출/노출/클릭/전환, computed from campaign state) + create-campaign form (name/budget/content-type/targeting) + campaign list + campaign detail (6 metric placeholders, all 0 — faithful). All campaigns in `useState` (`crypto.randomUUID()`, never persisted — faithful). **One supabase read**: published records — reuse Phase-3 `usePublishRecords(projectId)` filtered to `status === 'published'` (retarget CF's `publish_records` → `mkt_publish_records`; the Phase-3 hook already queries `mkt_publish_records`). `formatNumber` (억/만) + `formatCurrency` (₩) ported. Keep the `⚠️ 추후 Meta/Google Ads API 연동 예정 — 현재는 캠페인 기획/관리용` disclaimer (CF `:353`). **R-9:** replace CF's customer-flavored sample copy ("성장클리닉 인지도 캠페인", "성장클리닉, 키성장") with **neutral** copy ("브랜드 인지도 캠페인" etc.). `break-keep` on Korean labels.
- [ ] **Step 2 (`AdsPage.tsx`):** Guard → `<AdsDashboard projectId={selectedProjectId} />`.
- [ ] **Step 3 (`index.ts` + route swap):** Export `AdsPage`. In `router/index.tsx`: add import + swap `:326` `{ path: 'ads', element: <PlaceholderPage title="광고 관리" /> }` → `{ path: 'ads', element: <AdsPage /> }`.
- [ ] **Step 4 (typecheck + build + manual):** client typecheck + build → PASS. Manual: `/marketing/ads` renders; create a campaign (in-memory list updates); published-records picker lists published content (or empty); disclaimer visible.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/ads/ packages/client/src/features/marketing/pages/AdsPage.tsx packages/client/src/features/marketing/index.ts packages/client/src/router/index.tsx
  git commit -m "feat(marketing/p5-c8): wire /marketing/ads -> AdsDashboard (client-only campaign mockup + published-records picker, neutral copy) + page + route swap"
  ```

**Data path:** client-only + one supabase-direct read (`mkt_publish_records`). **Verify gate:** client typecheck + build PASS; manual render. **Route swap:** `:326` ads.

---

## Chunk P5-C9: DataForSEO SERP wiring + `mapSerpResults` + service + controller + route — TDD

> Pillar D's server side: wire the `getSerpResults` 501 stub → DataForSEO `serp/google/organic/live/advanced`, add the **pure `mapSerpResults`** (DataForSEO row → `SerpResultItem` view-model), the `competitors.service.serpAnalysis`, the `competitorsSerp` controller, and the `/competitors/serp` route. **TDD `mapSerpResults`.** Degrades to empty when DataForSEO creds absent. **R-D — DataForSEO, NOT Google scrape.**

**Files:**
- Modify: `packages/server/src/services/mkt/external/dataforseo.ts`
- Modify: `packages/server/src/services/mkt/competitors.service.ts`
- Modify: `packages/server/src/controllers/mkt/competitors.controller.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`
- Test: `packages/server/src/services/mkt/external/__tests__/dataforseo.test.ts` (EDIT — add `mapSerpResults` cases)
- Modify: `packages/client/src/features/marketing/types/monitoring.ts` (add `SerpResultItem` if not stubbed in P5-C1)

- [ ] **Step 1 (test — `mapSerpResults`, TDD):** In the existing `dataforseo.test.ts`, add cases over a stub DataForSEO `items[]` (`{ type, rank_group, title, url, description, breadcrumb, domain }`): assert the `SerpResultItem[]` view-model = `{ id, title, url, snippet, author }` (`snippet` = description, `author` = domain/breadcrumb); **filter to `type === 'organic'`**; respect top-N (depth 10).
  ```ts
  import { mapSerpResults } from '../dataforseo.js';
  it('mapSerpResults maps organic items to the view-model and filters non-organic', () => {
    const items = [
      { type: 'organic', rank_group: 1, title: 'T1', url: 'https://a.com', description: 'D1', domain: 'a.com', breadcrumb: 'a.com' },
      { type: 'people_also_ask', rank_group: 2, title: 'X' },
      { type: 'organic', rank_group: 3, title: 'T2', url: 'https://b.com', description: 'D2', domain: 'b.com' },
    ];
    const out = mapSerpResults(items as never);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ title: 'T1', url: 'https://a.com', snippet: 'D1', author: 'a.com' });
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test dataforseo` → **FAIL** (`mapSerpResults` not exported).
- [ ] **Step 3 (impl `dataforseo.ts`):** Add `interface RawSerpItem { type: string; rank_group?: number; title?: string; url?: string; description?: string; breadcrumb?: string; domain?: string }` + a client-facing view-model (or import the shared one) + `export function mapSerpResults(items: RawSerpItem[]): SerpResultItem[]` (filter organic, map id/title/url/snippet/author). Then **rewrite `getSerpResults`** (spec §4.5 verbatim — NOTE the current stub signature is `(_keyword, _locationCode?)`; **change it to** `(keyword: string, locationCode = 2410, languageCode = 'ko')` — adds the `languageCode` param the stub lacks): guard `if (!login || !password) throw new AppError(502, 'DataForSEO 자격 증명이 설정되지 않았습니다.')`; basic-auth; body `[{ keyword, location_code, language_code, depth: 10 }]`; POST `https://api.dataforseo.com/v3/serp/google/organic/live/advanced`; `!res.ok` → `AppError(502, …)`; return `mapSerpResults(json.tasks?.[0]?.result?.[0]?.items ?? [])`. (Leave the existing raw `SerpResult` interface `:11-17` as-is — it's unused; `SerpResultItem` is the new view-model.)
- [ ] **Step 4 (impl `competitors.service.ts`):** Add `export async function serpAnalysis(keyword: string, language = 'ko'): Promise<SerpResultItem[]> { return getSerpResults(keyword, 2410, language); }` (import `getSerpResults` from `./external/dataforseo.js`). Re-export or co-locate `SerpResultItem`.
- [ ] **Step 5 (impl `competitors.controller.ts`):** Add `export const competitorsSerp = asyncHandler(async (req, res) => { const { keyword, language } = req.body as { keyword?: string; language?: string }; if (!keyword) throw new AppError(400, 'keyword is required'); const items = await serpAnalysis(keyword, language ?? 'ko'); res.json({ success: true, data: { items } }); });` (import `serpAnalysis`).
- [ ] **Step 6 (route):** In `mkt.routes.ts`, import `competitorsSerp` (add to the existing competitors import block `:24`) + add after `/competitors/suggest` (`:80`): `router.post('/competitors/serp', competitorsSerp);` (under a `// ── Competitors SERP (3rd tab — DataForSEO) ──` comment).
- [ ] **Step 7 (run + typecheck):** `pnpm --filter @tangobook/server test dataforseo` → **PASS**. `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 8:** Commit:
  ```bash
  git add packages/server/src/services/mkt/external/dataforseo.ts packages/server/src/services/mkt/competitors.service.ts packages/server/src/controllers/mkt/competitors.controller.ts packages/server/src/routes/mkt.routes.ts packages/server/src/services/mkt/external/__tests__/dataforseo.test.ts packages/client/src/features/marketing/types/monitoring.ts
  git commit -m "feat(marketing/p5-c9): wire DataForSEO getSerpResults + mapSerpResults + competitors.serpAnalysis + competitorsSerp route + tests"
  ```

**Data path:** server-proxy (DataForSEO basic-auth server-side). **R-D:** explicit-button-gated, no caching, graceful empty on no creds. **Verify gate:** `pnpm --filter @tangobook/server test dataforseo` green (FAIL→PASS) + server typecheck PASS. **No route swap** (endpoint only).

---

## Chunk P5-C10: `useCompetitorSerp` + add SERP tab to `CompetitorsDashboard`

> Pillar D's client side: the transient SERP mutation hook + the **3rd tab on the EXISTING `CompetitorsDashboard`** (do NOT create a new dashboard). **Mechanical** verified by typecheck + build + manual.

**Files:**
- Modify: `packages/client/src/features/marketing/api/use-competitors.ts`
- Modify: `packages/client/src/features/marketing/components/competitors/CompetitorsDashboard.tsx`

- [ ] **Step 1 (`use-competitors.ts` — add `useCompetitorSerp`):** Mirror `useKeywordRankings` (transient mutation via the in-file `postMktGraceful`). `export function useCompetitorSerp() { return useMutation({ mutationFn: (args: { keyword: string; language?: string }) => postMktGraceful<{ items: SerpResultItem[] }>('/competitors/serp', args).then(r => r?.items ?? []) }); }` (import `SerpResultItem` from `../types/monitoring`). On 502 (no DataForSEO) → `postMktGraceful` returns null → `[]` → empty state.
- [ ] **Step 2 (`CompetitorsDashboard.tsx` — add the SERP tab):** The Phase-4 dashboard has `TABS = [{gap},{keywords}]` (`:18`) + a `TabId` union. **Add `{ id: 'serp', label: 'SERP 분석' }`** to `TABS` + `'serp'` to `TabId` + a `{tab === 'serp' && (...)}` body (port CF `competitors-dashboard.tsx:274-321`): keyword `<input>` + "SERP 분석" button → `useCompetitorSerp().mutateAsync({ keyword, language: 'ko' })` → top-N list (rank number + title link + author/domain + snippet). Empty state "키워드를 입력하고 SERP 분석을 실행하세요"; loading spinner; on 502 (no DataForSEO) → `[]` → empty state "DataForSEO 연결이 필요합니다 (SERP 분석)". `selectedLang` for SERP defaults `'ko'` (CompetitorsDashboard has no `MarketingLanguageTabs`; keep minimal — faithful to CF's hardcoded `language:'ko'`). `break-keep` on Korean snippet.
- [ ] **Step 3 (typecheck + build + manual):** client typecheck + build → PASS. Manual: `/marketing/competitors` → SERP 분석 tab → enter keyword → list (or empty without DataForSEO — no crash). Confirm the gap + keyword-rankings tabs still work.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-competitors.ts packages/client/src/features/marketing/components/competitors/CompetitorsDashboard.tsx
  git commit -m "feat(marketing/p5-c10): useCompetitorSerp + add SERP 분석 tab to CompetitorsDashboard (DataForSEO)"
  ```

**Data path:** server-proxy (transient mutation, `postMktGraceful`). **Verify gate:** client typecheck + build PASS; manual render of the SERP tab (+ existing 2 tabs unbroken). **No route swap** (edits the already-live `/marketing/competitors`).

---

## Chunk P5-F: Final integration — full gates + secret-safety greps + scope greps + docs + operator checklist

> @superpowers:verification-before-completion — run every gate, confirm output before any "done" claim. **NO DB migration this phase (NO SQL).** Live-creds E2E (real Meta token / YouTube key / DataForSEO / Gemini / live scrape) is **deferred** as an operator checklist (no creds in CI — same policy as Phase 1–4). Memory update (`marketing-port-contentflow-2026-06-07.md`) is **out of this plan / out of repo** — do it via the "업데이트 하자" workflow, NOT in a plan commit.

**Files:** docs only (CLAUDE.md × 2 + spec status).

### Task F.1: Automated gates
- [ ] **Step 1 (unit tests):**
  - `pnpm --filter @tangobook/server test mkt` → green incl. the **new** `strategy.controller` + `monitoring.service` + the SERP `mapSerpResults` cases in `dataforseo` (≥ 2 new server mkt test files + the edited dataforseo). Record exact file/test counts.
  - `pnpm --filter @tangobook/client test marketing` → green incl. the **new** `use-monitoring-keywords` on top of the existing 58-file suite. Record exact counts.
  - **Assert growth** vs the current (post-Phase-4) totals — both file counts + total test counts must strictly increase.
- [ ] **Step 2 (typecheck):** `pnpm typecheck` (shared/server/client) → **PASS**.
- [ ] **Step 3 (lint):** `pnpm lint` → no **new** errors from Phase-5 code. Pre-existing remotion TS-parse errors + the unrelated test failures unchanged.
- [ ] **Step 4 (build):** `pnpm --filter @tangobook/client build` → **PASS** (no new dep → no new chunk concern).
- [ ] **Step 5 (secret-safety greps — R-1, the #1 invariant):**
  - `grep -rn "pageAccessToken\|accessToken\|meta_credentials\|YOUTUBE_DATA_API_KEY\|youtubeApiKey\|DATAFORSEO\|dataforseo" packages/client/src/features/marketing` → only **presence booleans** (`!!project.meta_credentials`) — **no secret value in any client→server body, never echoed** (the monitoring/SERP client bodies carry only `{ projectId, keyword, language, sources }` / `{ keyword, language }`).
  - `grep -rn "VITE_" packages/client/src/features/marketing` (or repo-wide) → **no `VITE_`-prefixed reference to any Meta/YouTube/DataForSEO/Gemini secret**.
  - `grep -rn "supabase-admin.provider" packages/client/src` → **0** (no client import of the service-role provider).
  - Monitoring/SERP creds read **server-side only**: `grep -rn "resolveMetaCredentials\|config.youtubeApiKey\|config.dataforseo\|config.gemini" packages/server/src/services/mkt/monitoring.service.ts packages/server/src/services/mkt/external/dataforseo.ts` → present (server-side reads).
- [ ] **Step 6 (scope greps):**
  - `router/index.tsx` `:321/325/326` → `<MonitoringPage/>` / `<StrategyPage/>` / `<AdsPage/>` (all 3 placeholders gone — **no `PlaceholderPage` left in the `/marketing` tree**; confirm `grep -n "PlaceholderPage" packages/client/src/router/index.tsx` shows only the import + the `*` catch-all, if any).
  - `grep -n "strategy/templates\|monitoring/search\|monitoring/comment\|competitors/serp" packages/server/src/routes/mkt.routes.ts` → **4 new routes**.
  - `grep -rn "strategy/import-html" packages/server/src packages/client/src` → **0** (parse client-side).
  - `grep -rn "ytInitialData\|google.com/search" packages/client/src` → **0** (scrape server-side only; no client scrape).
  - `grep -rn "'use client'\|next/image" packages/client/src/features/marketing/components/{strategy,monitoring,ads}` → **0** (Next leftovers stripped).
- [ ] **Step 7:** No commit (verification only).

### Task F.2: Manual E2E (deferred — operator checklist) + docs
- [ ] **Step 1 (manual E2E — needs real creds; DEFERRED per prior phases):** Document this checklist for the operator (do NOT block "done" on it). **What an operator must set to exercise each pillar live:**
  1. **전략:** drop a real marketing-strategy `*.html` into `packages/client/public/marketing-strategy-templates/` (rebuild for prod) → `/marketing/strategy` → 임포트 → upload/select → preview counts → 적용 → confirm `mkt_projects.imported_strategy` populated (downstream `selectRankingKeywords` reads it). Iframe viewer renders the template.
  2. **모니터링 — scrape:** 검색 with a Korean keyword → 지식인/N블로그/구글블로그 feed (best-effort — Google may serve a consent wall / 429 to a datacenter IP → that source empty, no crash).
  3. **모니터링 — YouTube:** set `YOUTUBE_DATA_API_KEY` (server `.env`) → youtube source returns videos with views/engagement.
  4. **모니터링 — Instagram:** set a real Meta page token in `meta_credentials` (설정 → 채널연동) + ensure `SUPABASE_SERVICE_ROLE_KEY` is set (server reads the row via `getSupabaseAdmin()`) → IG hashtag feed (token never on the wire — R-1).
  5. **모니터링 — AI 댓글:** set `GEMINI_API_KEY` → 댓글 생성 per feed item (else 502 inline, button re-enabled).
  6. **광고:** create/list campaigns (in-memory) + the 발행된 콘텐츠 picker lists published `mkt_publish_records`.
  7. **경쟁사 SERP:** set `DATAFORSEO_LOGIN/PASSWORD` → SERP 분석 tab returns top-10 (else empty "DataForSEO 연결이 필요합니다"). Note: `serp/google/organic/live/advanced` costs DataForSEO credits per call (R-D) — button-gated, no auto-fire.
  8. **Graceful:** with all creds unset, every dashboard renders its empty/error state without crash.
- [ ] **Step 2 (docs):** Update:
  - `packages/client/src/features/marketing/CLAUDE.md` — add a **Phase 5 (전략/모니터링/광고/SERP) module** section: the `components/{strategy,monitoring,ads}/*` trees + the `CompetitorsDashboard` SERP tab edit; the `use-strategy-templates`/`use-monitoring`/`use-monitoring-keywords`/`useCompetitorSerp` hooks (+ the `strategyTemplates` + `monitoringKeywords` `mktKeys`; feed/comment/SERP = transient mutations); the 4 new `/api/mkt/{strategy,monitoring,competitors}/*` rows in the route table; the `mkt_monitoring_keywords` supabase-direct hooks. Add a **Phase 5 Gotchas** subsection: (i) strategy parse is **client-side** (`lib/strategy-html-parser.ts`) + import writes via `useUpdateProject({ id, updates: { imported_strategy } })` (the real signature — `useUpdateProject()` takes no arg); (ii) strategy templates in `public/marketing-strategy-templates/` (R-A — distinct from investor `public/strategy.html`); (iii) monitoring is **server-proxy** (scrape + YouTube key + **Meta token read server-side via `resolveMetaCredentials`**, never on the wire — R-1); (iv) monitoring keywords **persisted per project** with `user_id` stamp (R-B), feed transient, `MarketingLanguageTabs` drives sources/comment-lang only (no `language` column — O-4); (v) monitoring's Naver search is a **public scrape** (no Naver search credential exists — `naver-searchad` = volume only); (vi) ads is **client-only** + one `mkt_publish_records` read, neutral sample copy (R-9); (vii) SERP = **DataForSEO** `getSerpResults` (R-D), NOT Google scrape; (viii) the 11 dead CF strategy components scoped OUT (0 importers each).
  - root `CLAUDE.md` + worktree `CLAUDE.md` `/marketing` line — **Phase 5 done → ALL phases complete** (every `/marketing` route live; the ContentFlow port is finished).
  - spec `docs/superpowers/specs/2026-06-09-marketing-phase5-strategy-monitoring-ads-design.md` status → **COMPLETE** (or add an "implemented by …plans/2026-06-09-marketing-phase5-strategy-monitoring-ads.md" note). Also flip the Phase-5 plan status header (this file) to COMPLETE.
  Commit:
  ```bash
  git add packages/client/src/features/marketing/CLAUDE.md CLAUDE.md docs/superpowers/specs/2026-06-09-marketing-phase5-strategy-monitoring-ads-design.md docs/superpowers/plans/2026-06-09-marketing-phase5-strategy-monitoring-ads.md
  git commit -m "docs(marketing/p5-f): Phase 5 — CLAUDE.md strategy/monitoring/ads module + gotchas + status (all phases complete)"
  ```
  (Memory `marketing-port-contentflow-2026-06-07.md` lives **outside the repo** — update via the "업데이트 하자" workflow, NOT in this commit.)
- [ ] **Step 3 (finish):** @superpowers:finishing-a-development-branch — present merge/PR/cleanup options. **Phase 5 is the FINAL phase** (the marketing port is complete). Per the controller's standing instruction, **main-merge happens only after ALL phases** — so the final integration step is **push** (`git push origin feat/marketing-phase0`), with the merge/PR being the controller's call. (This skill is the controller's to run AFTER all chunks land + gates pass — not an in-chunk action.)

**Verify gate (whole phase):** `pnpm typecheck` (3 packages) PASS + `pnpm --filter @tangobook/client build` PASS + `pnpm --filter @tangobook/server test mkt` & `pnpm --filter @tangobook/client test marketing` green with **strictly higher** test counts than the post-Phase-4 baseline + all secret-safety/scope greps clean.

---

## Reuse table (verified asset → file:line → which chunk reuses it)

| Verified asset | File:line | Reused by |
|---|---|---|
| `parseStrategyHtml(html): ParseResult` (**already ported + tested**, DOMParser) | `client/.../lib/strategy-html-parser.ts:21` + `lib/__tests__/strategy-html-parser.test.ts` | P5-C2 (`StrategyImportDialog`, client parse — **no server parse**) |
| `useUpdateProject()` (no-arg; mutate `{ id, updates }`) supabase-direct owner-row JSONB | `client/.../api/use-projects.ts:106` | P5-C2 (write `imported_strategy`) |
| `useProject(id)` (TanStack) | `client/.../api/use-projects.ts:16` | P5-C2/C7/C8 (project name + presence booleans) |
| `getSerpResults` **501 stub** + raw `SerpResult` type | `server/.../external/dataforseo.ts:76-81` / `:11-17` | P5-C9 (wire body; add `languageCode` param + `mapSerpResults`) |
| `getKeywordVolumes` + DataForSEO basic-auth pattern | `server/.../external/dataforseo.ts:42-69` | P5-C9 (mirror auth/fetch shape for SERP) |
| `resolveMetaCredentials(projectId): {pages: MetaPage[]}` (throws 501) | `server/.../analytics.service.ts:272` | P5-C3 (IG source — token server-side) |
| `getSupabaseAdmin()` (service-role singleton) | `server/.../providers/supabase-admin.provider.ts` | P5-C3 (via `resolveMetaCredentials`) |
| `searchVideos(query,{order,relevanceLanguage,maxResults})` + `getVideoStats(ids)` | `server/.../external/youtube-data.ts:53/109` | P5-C3 (YouTube source — no HTML fallback) |
| `generateTextWithGemini(prompt,retries,model)` (retry/fallback) | `server/.../providers/gemini.provider.ts` | P5-C3 (monitoring comment) |
| `config.{gemini.textModel, youtubeApiKey, dataforseo, supabase.serviceRoleKey}` | `server/.../config/index.ts:9/64/66/78` | P5-C3/C9 (server-side secrets) |
| cheerio (present, Phase 4) + the SSRF-guarded fetch **shape** (`assertSafeUrl` is private) | `server/.../seo.service.ts:193` (pattern) + `import * as cheerio` | P5-C3 (build fixed-host URLs + `encodeURIComponent` + `AbortSignal.timeout` — does NOT import `assertSafeUrl`) |
| `mkt_monitoring_keywords` table + RLS owner policy (**no migration**) | `supabase/migrations/2026-06-07-marketing-schema.sql:393-406/:447` | P5-C5 (supabase-direct hooks) |
| `mkt_projects.imported_strategy jsonb` (**no migration**) | `…schema.sql:60` + `database.ts:209` (`Project.imported_strategy`) | P5-C2 |
| `mkt_publish_records` (Phase 3) + `usePublishRecords(projectId)` | `…schema.sql` (Phase 3) + `client/.../api/use-publish-records.ts` | P5-C8 (creative picker, `status==='published'`) |
| `getCurrentUserId()` + the supabase-direct client | `client/.../api/supabase.ts:8` | P5-C5 (`user_id` stamp) |
| `mktKeys` flat factory (ends `youtubeChannel:46`) | `client/.../api/queries.ts:18-47` | P5-C1 (add `strategyTemplates` + `monitoringKeywords`) |
| `postMkt<T>` (exported, 501→null) + `postMktGraceful` (wraps postMkt) | `client/.../api/use-analytics.ts:20` / `use-competitors.ts:29` | P5-C6/C10 (search/comment/SERP hooks) |
| `MarketingLanguageTabs` (Phase 2) | `client/.../components/ideas/MarketingLanguageTabs.tsx` | P5-C7/C8 (lang row) |
| `CompetitorsDashboard` (Phase 4, `TABS:18` = gap+keywords) | `client/.../components/competitors/CompetitorsDashboard.tsx` | P5-C10 (**add** SERP tab — no new dashboard) |
| `useGapAnalysis`/`useKeywordRankings`/`useSuggestCompetitors` (transient mutations) | `client/.../api/use-competitors.ts:64/84/45` | P5-C10 (mirror for `useCompetitorSerp`) |
| `MetaPage` (`pageAccessToken` + `instagram: {id,username}|null`) | `client/.../types/database.ts:128` (+ server analog) | P5-C3 (IG source reads `pages[0].instagram?.id`) |
| `competitors.controller.ts` (3 exports + import block `:17/:24`) | `server/.../controllers/mkt/competitors.controller.ts` | P5-C9 (add `competitorsSerp`) |
| `competitors.service.ts` (`parseCompetitorJson`/`rankBadgeTier`/`selectRankingKeywords`) | `server/.../services/mkt/competitors.service.ts:68/82/95` | P5-C9 (add `serpAnalysis`) |
| `mkt.routes.ts` route-registration pattern (Phase 4 ends `:80`) | `server/.../routes/mkt.routes.ts` | P5-C1/C4/C9 (4 new rows) |
| `IdeasPage`/`CompetitorsPage` guard pattern + `index.ts:11-13` export pattern | `client/.../pages/IdeasPage.tsx` + `index.ts` | P5-C2/C7/C8 (3 page guards + exports) |
| `Sidebar.tsx:23/27/39` (monitoring/ads/strategy nav) + `TopBar.tsx:10/11/15` | `client/.../components/layout/` | (no change — route swap makes them live) |
| `asyncHandler` + `AppError` + `{success,data}` envelope (mirror `ideas.controller.ts`) | `server/.../middleware/*` + `controllers/mkt/ideas.controller.ts` | P5-C1/C4/C9 (controllers) |
| router placeholders `:321` monitoring / `:325` strategy / `:326` ads | `client/.../router/index.tsx` | P5-C7/C2/C8 (swap elements only) |

---

## Secret-safety checklist (P5-F greps)

The final-gates chunk (P5-F Step 5) greps these — **R-1 (HIGH) is the #1 invariant**:

1. **No `VITE_`-prefixed secret** — `grep -rn "VITE_" packages/client/src/features/marketing` shows no `VITE_`-prefixed Meta token / YouTube key / DataForSEO / Gemini reference.
2. **No secret value in any client→server body** — the monitoring search body is `{ projectId, keyword, language, sources? }`; comment body `{ contentText, platform, tone, language, projectContext? }`; SERP body `{ keyword, language? }`. **None carry a token/key.**
3. **No secret echoed in `res.json`/log** — `monitoringSearch`/`monitoringComment`/`competitorsSerp` return only `{ items }`/`{ comment }`; no token/key in any response or `console.*`.
4. **No client import of `supabase-admin.provider`** — `grep -rn "supabase-admin.provider" packages/client/src` → **0**.
5. **Monitoring/SERP creds read server-side only** — `resolveMetaCredentials` (Meta token), `config.youtubeApiKey` (YouTube), `config.dataforseo` (DataForSEO basic-auth), `config.gemini` (Gemini) are referenced **only** under `packages/server/src`. The browser holds only presence booleans (`!!project.meta_credentials`).
6. **No client-side scrape** — `grep -rn "ytInitialData\|google.com/search\|kin.naver\|search.naver" packages/client/src` → **0** (all scraping is server-side in `monitoring.service.ts`).

---

## Deviations from the spec's chunk outline (§8 / §12) + why

The spec's §12 lists 16 numbered steps (1–16) across 5a/5b/5c + final. This plan **regroups into 10 implementer-sized chunks + 1 final-gates chunk**, splitting where a single spec step mixed a TDD service with non-TDD UI (so pure-logic lands before its consumer for the SEQUENTIAL shared-worktree order):

- **Spec 5b step 5** (one big "monitoring.service" step) → **P5-C3** (service + TDD mappers) — kept whole (it's all server logic).
- **Spec 5b steps 6+8** (controller + client hooks) → **P5-C4** (controller/routes, server) + **P5-C6** (client mutation hooks) — **split server from client** so the server endpoints exist before the client hooks call them.
- **Spec 5b step 7** (`MonitoringKeyword` + keyword hooks) → **P5-C5** — kept whole (supabase-direct, independently testable; placed before the dashboard).
- **Spec 5c steps 11+12** (DataForSEO wire + service + controller, then hook + tab) → **P5-C9** (all server: wire + mapper + service + controller + route) + **P5-C10** (client hook + tab) — **split server from client** (mapper TDD before the consuming tab).
- **Strategy types/keys** (spec scattered across 5a steps 1–2) → folded into **P5-C1** (alongside the endpoint) so the server chunk is self-contained and the client chunk P5-C2 only does UI.
- **Final** (spec steps 13–17) → **P5-F** (one chunk: gates + greps + docs + finish).

No scope change — every spec IN item is covered; the 11 dead strategy components stay OUT; no `import-html` endpoint; no migration. The split only reorders for the sequential build (service/logic → UI) and right-sizes chunks for one-subagent-each.

---

## Newly discovered blockers / missing-column risks

**None found.** All verified reuse claims hold (corrections are signature/scope nuances, not blockers — see the return summary). Specifically:
- **NO missing column.** `mkt_monitoring_keywords` (`:393-406`) + `imported_strategy` (`:60`) + `mkt_publish_records` (Phase 3) all exist with the exact columns the spec assumes. **No migration is added** (per the brief — if a genuinely missing column had been found, it would be FLAGGED here, not silently migrated).
- **Signature deltas to bake in (not blockers):** (1) `getSerpResults`'s current stub signature is `(_keyword, _locationCode?)` — P5-C9 adds the `languageCode` param. (2) `useUpdateProject()` takes **no** arg; the call is `.mutate({ id, updates })` — P5-C2 uses the real shape (the spec's shorthand `useUpdateProject(projectId).mutate({imported_strategy})` is corrected). (3) `assertSafeUrl` is **private** to `seo.service.ts` — P5-C3 builds fixed-host URLs itself (the spec's §4.2 SSRF posture) rather than importing it. (4) The existing `SerpResult` raw interface (`dataforseo.ts:11-17`) is unused/distinct from the new `SerpResultItem` view-model — left as-is.

---

## Verification summary (every reuse claim — CONFIRMED / WRONG)

| Spec claim | Status | Evidence |
|---|---|---|
| `parseStrategyHtml` **already ported + tested** (client, DOMParser) | **CONFIRMED** | `lib/strategy-html-parser.ts:21` (`export function parseStrategyHtml(html): ParseResult`) + `lib/__tests__/strategy-html-parser.test.ts` (inline-script + table-DOM paths). → strategy-import chunk is **client-only**. |
| `getSerpResults` is a **501 stub** + `SerpResult` type declared | **CONFIRMED** (with delta) | `dataforseo.ts:76-81` (`throw new AppError(501, 'DataForSEO SERP not wired yet')`) + `:11-17` (`SerpResult` raw type). **Delta:** stub sig is `(_keyword, _locationCode?)` — P5-C9 adds `languageCode`; the new view-model is `SerpResultItem` (distinct from raw `SerpResult`). |
| Naver search credential exists OR public scrape? | **PUBLIC SCRAPE** (no credential) | `naver-searchad.ts` = `signNaverRequest` (HMAC) + `searchKeywords` → SearchAd keyword-**VOLUME** API (`mapKeywordList`/`NaverKeyword`), NOT blog search. `config` has `naverAd` + `naverDatalab` (trend) but **no blog-search cred**. No `kin.naver`/`blog.naver`/`search.naver` anywhere. → monitoring Naver = cheerio scrape, no creds. |
| `resolveMetaCredentials` (Phase 4) reusable | **CONFIRMED** | `analytics.service.ts:272` → `Promise<{pages: MetaPage[]}>`, throws `AppError(501)` when absent. IG source catches → `[]`. |
| `assertSafeUrl` + cheerio-fetch reusable | **CONFIRMED (private)** | `seo.service.ts:193` (`function assertSafeUrl` — **non-exported**) + cheerio fetch helpers `:208/:235`. → monitoring builds **fixed-host** URLs itself (spec §4.2), does NOT import `assertSafeUrl`. cheerio is present. |
| `youtube-data.ts` `searchVideos`/`getVideoStats` wired + `config.youtubeApiKey` | **CONFIRMED** | `youtube-data.ts:53/109` wired; `config.index.ts:64` `youtubeApiKey`. (`searchVideos` default `order:'viewCount'` — monitoring passes `order:'relevance'`.) |
| `config.dataforseo` / `config.gemini` / `config.naver*` | **CONFIRMED** | `config/index.ts:7` gemini(textModel `:9`), `:32` naverAd, `:66` dataforseo, `:71` naverDatalab, `:78` serviceRoleKey. |
| `MarketingLanguageTabs` / `mktKeys` / `getSupabaseAdmin` / `useUpdateProject` / `/api/mkt` mount / supabase-direct client | **CONFIRMED** | `components/ideas/MarketingLanguageTabs.tsx`; `queries.ts:18-47` (`mktKeys` ends `youtubeChannel:46`); `supabase-admin.provider.ts`; `use-projects.ts:106` (`useUpdateProject()` — **no arg**, mutate `{id,updates}`); `mkt.routes.ts` mounted (Phase-4 routes through `:80`); `api/supabase.ts` (client + `getCurrentUserId:8`). |
| `.marketing-scope` theme + asyncHandler/AppError envelope | **CONFIRMED** | marketing CLAUDE.md §(f) + `controllers/mkt/ideas.controller.ts` pattern. |
| Router placeholders `:321` monitoring / `:325` strategy / `:326` ads | **CONFIRMED (exact)** | `router/index.tsx:321` (`monitoring` PlaceholderPage), `:325` (`strategy`), `:326` (`ads`). `:322/323/324` site-analysis/meta-analytics/competitors already LIVE (Phase 4). |
| `mkt_monitoring_keywords` / `imported_strategy` columns exist (NO migration) | **CONFIRMED** | `schema.sql:393-406` (full table + `unique(project_id,keyword,search_engine)`) + `:447` (RLS owner) + `:60` (`imported_strategy jsonb`). |
| `CompetitorsDashboard` exists (2 tabs) + `use-competitors` transient mutations | **CONFIRMED** | `CompetitorsDashboard.tsx:18` (`TABS` gap+keywords); `use-competitors.ts:45/64/84` (3 mutations + in-file `postMktGraceful`). |

---

## Cited references

**Phase 5 spec (source of truth):** `docs/superpowers/specs/2026-06-09-marketing-phase5-strategy-monitoring-ads-design.md` (`d8c4ff3`).
**Format templates:** `docs/superpowers/plans/2026-06-09-marketing-phase4-analytics.md` (primary) + `…/2026-06-09-marketing-phase3-publish.md`.
**ContentFlow (port source, read-only `C:\projects\contentflow\contentflow`):** `src/components/strategy/{strategy-dashboard,strategy-import-dialog}.tsx` + the 11 dead components (0 importers — OUT) · `src/lib/strategy-html-parser.ts` · `src/app/api/strategy/{templates,import-html}/route.ts` · `src/components/monitoring/monitoring-dashboard.tsx` (491 LOC) · `src/app/api/monitoring/search/{naver,naver-blog,google-blog,youtube,instagram}/route.ts` + `comment/route.ts` · `src/components/ads/ads-dashboard.tsx` (449 LOC) · `src/components/competitors/competitors-dashboard.tsx` (SERP tab `:274-321`).
**Tangobook (worktree `feat/marketing-phase0`):** all files cited inline in the reuse + verification tables above (verified at plan time).
