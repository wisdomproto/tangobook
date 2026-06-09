# Marketing Phase 4 (분석 / Analytics) Implementation Plan

> **Status: NOT STARTED** — spec written + committed; this plan chunks it. No feature code yet.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Each chunk is independently implementable + reviewable by a fresh subagent (implementer → spec-review → quality-review). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the **three** `/marketing` analytics placeholders (`site-analysis`, `meta-analytics`, `competitors` — `router/index.tsx:319/320/321`) with real dashboards faithfully ported from ContentFlow. Unlike Phase 1–3 (Supabase-direct), **Phase 4 is server-proxy**: the client sends only a `projectId` (+ params) to new Express `/api/mkt/{analytics,competitors,seo}/*` endpoints; **the server reads each project's `ga4_config` / `meta_credentials` from `mkt_projects` via the Phase-3 service-role admin client and calls the external API** (GA4 Data REST, Meta Graph, YouTube Data, DataForSEO, Gemini), so the GA4 private key + Meta page token never reach the browser. The three dashboards: **site-analysis** (2 sub-tabs: GA4 트래픽 + SEO 분석), **meta-analytics** (5 platform tabs: IG/FB/Threads/YouTube/Website), **competitors** (2 tabs: 콘텐츠 갭 + 키워드 순위; CF's SERP tab is dropped → Phase 5 monitoring).

**Architecture:** Extends `packages/client/src/features/marketing/` (client UI + **server-proxy TanStack hooks**, NOT supabase-direct) + `packages/server/src/{services,controllers,routes}/mkt/` (new `analytics`/`competitors`/`seo` services+controllers + the external wiring in `services/mkt/external/{ga4,meta-graph,youtube-data}.ts`). The GA4 wiring builds a **service-account JWT with Node built-in `crypto`** (`createSign('RSA-SHA256')`) → OAuth2 token exchange → `runReport` REST — **no `@google-analytics/data`, no `google-auth-library`**. Per-project creds resolve server-side via `getSupabaseAdmin()` (Phase 3) with a `config.ga4` env fallback; graceful `501`/empty when unconfigured.

**This phase is cheap on data + settings — Phase 0 already provisioned it** (verified in the worktree):

- **NO migration.** `mkt_projects` already has `ga4_config jsonb`, `funnel_config jsonb`, `imported_strategy jsonb`, `meta_credentials jsonb`, `published_site jsonb`, `saved_keywords jsonb` (`2026-06-07-marketing-schema.sql:57‑67`). The `Project` TS type declares all of them (`types/database.ts:164` meta_credentials, `:168` industry, `:169` brand_name, `:198` target_languages, `:206` funnel_config, `:207` ga4_config, `:209` imported_strategy). **Phase 4 adds zero columns.**
- **GA4 settings UI ALREADY BUILT + WIRED.** `FunnelAnalyticsSection` (`components/project/sections/FunnelAnalyticsSection.tsx`, tab "퍼널·분석" in `ProjectSettings.tsx`) edits `funnel_config` + `ga4_config` (propertyId / clientEmail / privateKey with show/hide) → `onUpdate({ funnel_config, ga4_config })` → `useUpdateProject`. Verified `:5` imports `GA4Config`, `:24‑31` state, `:59` handleSave. **Decision #5 is DONE** — Phase 4 only verifies it (Chunk 12).
- **`supabase-admin.provider.ts` already exists** (Phase 3) — reuse `getSupabaseAdmin()` to read project rows server-side. **`@supabase/supabase-js` is already a server dep** (`packages/server/package.json:"@supabase/supabase-js": "^2.104.0"`) — no add.
- **`@google/genai` (`^1.41.0`) + `@google/generative-ai` (`^0.24.1`) + `generateTextWithGemini`** are already server deps/providers — reuse for competitors/seo-schema (via `generateTextWithGemini`, the retry/fallback wrapper; **NOT** raw `GoogleGenAI` like CF).
- **`youtube-data.ts` is wired** (Phase 2: `searchVideos`/`getVideoStats`); only `getChannelInfo` is a 501 stub to wire (+ add `searchChannels`/`getChannelVideos`).
- **`dataforseo.ts getKeywordVolumes` is wired** (Phase 1a/2) — reuse for the optional competitor keyword-volume column.
- The 3 sidebar nav items + placeholder routes already exist (`router/index.tsx:319‑321`) — Phase 4 swaps elements only. `MarketingLanguageTabs` (`components/ideas/MarketingLanguageTabs.tsx`, Phase 2) is reused for the language row.

So Phase 4's real work is: **(1)** add `recharts@^2.15.x` (client) + `cheerio` (server) + `config.ga4` is already present; **(2)** wire `ga4.ts runReport` via service-account JWT → REST; **(3)** wire `meta-graph.ts` page/media insights + `youtube-data.ts` channel info; **(4)** ~13 new Express endpoints under `/api/mkt/{analytics,competitors,seo}/*` (controllers + services, reading per-project creds server-side); **(5)** the 3 client dashboards + the 2 Recharts charts + the SEO sub-dashboard; **(6)** the `use-analytics`/`use-meta-analytics`/`use-competitors` hooks; **(7)** route swaps. Spec: `docs/superpowers/specs/2026-06-09-marketing-phase4-analytics-design.md` (read it fully — data-layer §1.1, server design §4, GA4 JWT §4.2, scope decisions §3, components §6, settings §7, sub-phasing §8, open items §9, tests §10, risks §11, sequenced checklist §12).

**Tech Stack:** React 18 (`react@^18.3.0`) + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3 + lucide-react `^1.17.0` + **recharts `^2.15.x` (React-18 line — ADD)** + Express v5 + `@supabase/supabase-js` (`^2.104.0`, present) + `@google/genai` (present) + **`cheerio` (server — ADD)**. Node ≥ 20 (global `fetch`, `node:crypto`). External (runtime, optional, server-only secrets): GA4 service account (`ga4_config`/`config.ga4`), Meta page token (`meta_credentials`), YouTube Data key (`config.youtubeApiKey`), DataForSEO (`config.dataforseo`), Gemini (`config.gemini.apiKey`). Tests: vitest + @testing-library/react (jsdom).

**Conventions (match Phase 0 / 1a–1d / 2 / 3 — spec §2, marketing `CLAUDE.md`):**
- **Server-proxy data layer (≠ Phase 3).** Analytics flows: client TanStack hook → Express `/api/mkt/{analytics,competitors,seo}/*` → external API. The client sends **`{ projectId, period? }`** (NOT creds). The server resolves config from the project row (`getSupabaseAdmin()`) → env fallback. House envelope `res.json({ success: true, data })`; failure `throw new AppError(status, msg)`. Controllers use `asyncHandler`. GA4 reads live in the TanStack cache (`mktKeys`, `staleTime ~5min`); competitor/SEO results are **transient mutations** (not cached — Phase-2 ideas posture).
- TanStack Query = server data; Zustand (`ui-store`) = UI state only. **No server data in Zustand.** `selectedProjectId` from `ui-store`; project presence booleans (`!!project.ga4_config?.propertyId`, `!!project.meta_credentials`) from the normal `useProject` cache for empty-state gating.
- Files: **PascalCase** components (`SiteAnalysisDashboard.tsx`, `AnalyticsDashboard.tsx`, …), **camelCase** data/util/hook files (`use-analytics.ts`, `use-competitors.ts`). Named exports for components (pages default). ContentFlow used kebab-case files — rename on port.
- Client UI primitives from `../../ui/<name>` (e.g. `import { Button } from '../../ui/button'`), NOT `@/components/ui/*`. `cn` from `../../lib/utils`. Types from `../../types/{database,analytics}`. Icons from `lucide-react`. Drop every `'use client'`; replace `next/image`/`<img>` eslint-disables with plain `<img>`. Recharts color `#0F6E56` (CF) is fine inside `.marketing-scope`.
- Server: `routes(URL) → controllers(req parse + asyncHandler) → services(logic, AppError throw) → providers/external`. Server import paths use the `.js` extension (ESM). `config` from `../config/index.js` (providers) / `../../config/index.js` (services). Gemini via `generateTextWithGemini(prompt, 3, model)` (NOT raw `GoogleGenAI`); `model = config.gemini.textModel` (it auto-falls-back to flash-lite on overload).
- **Secrets discipline (R-1, HIGH):** `ga4_config.privateKey` + `meta_credentials.pages[].pageAccessToken` are read **server-side only** (via `getSupabaseAdmin()`), **never** `VITE_`-prefixed, **never** sent in a client→server body, **never** echoed back in any response. The browser holds only presence booleans. No client module imports `supabase-admin.provider`.
- Commit after every chunk. Commit messages in English. End each with the trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Port-task pattern** (verbatim/near-verbatim UI where TDD is impractical): copy CF source → rename to PascalCase → rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/utils` → `../../lib/utils`, `@/types/*` → `../../types/*`, the Zustand `useProjectStore` → `useProject(id)` + `ui-store`, the inline `fetch('/api/analytics/*')` → the new server-proxy TanStack hooks) → strip `'use client'` + Next `<img>` disables → adapt CF→worktree deltas → **typecheck → build → manual-verify in `/marketing/{site-analysis,…}` → commit**. Called **"port → typecheck → manual-verify → commit"** below.

> @superpowers:test-driven-development for the pure-logic steps (failing test → run → impl → run → commit): the **GA4 JWT assertion builder** (`buildServiceAccountAssertion`) + token/runReport request shaping; the **6 GA4 report-row→viewmodel mappers**; **`resolveGa4Config`/`resolveMetaCredentials`** (row→env→501, `\\n` un-escape); **`scoreSeoAudit`** (cheerio → score); **`mapInstagramInsights`/`mapFacebookInsights`** (engagement/avg-rate/0-guard/`.slice(0,20)`); **`parseCompetitorJson`** (noisy Gemini text → typed, fallback shapes); pure helpers (`formatNumber` 억/만, rank-badge thresholds, keyword-seed selection). @superpowers:verification-before-completion before any "done" claim in Chunk 12.

---

## Verification commands (confirmed against worktree `package.json` scripts)

| Purpose | Command |
|---|---|
| Client typecheck | `pnpm --filter @tangobook/client typecheck` (→ `tsc --noEmit`) |
| Server typecheck | `pnpm --filter @tangobook/server typecheck` (→ `tsc --noEmit`) |
| All-package typecheck | `pnpm typecheck` (shared → server → client) |
| Client marketing tests | `pnpm --filter @tangobook/client test marketing` (`test` = `vitest run`; the arg is a path substring filter). Per-file e.g. `pnpm --filter @tangobook/client test ga4` / `… use-analytics` / `… seo-audit-score`. |
| Server marketing tests | `pnpm --filter @tangobook/server test mkt` (or per-file `pnpm --filter @tangobook/server test analytics.service` / `… seo.service` / `… competitors.service`). |
| Lint | `pnpm lint` (`eslint packages --ext .ts,.tsx`) |
| Client build | `pnpm --filter @tangobook/client build` (`vite build`). **Server build is `tsc`** but Phase 3 used `pnpm --filter @tangobook/server typecheck` as the server gate — keep that (tsx runtime). |
| Install (after dep adds) | `pnpm install` (workspace root) |

> **Marketing test baseline (verified):** **57 client marketing `*.test.ts(x)` files** + **8 server `mkt` test files** exist today (through Phase 3). The spec quotes the Phase-3 totals as **388 client / 47 server tests** — the integration chunk (Chunk 12) asserts **growth** over both (new files below add ≥ 8 client + ≥ 4 server test files; total test counts must strictly increase). Pre-existing non-marketing failures (auth `RequireAuthedWithPin`, games `SpeakingPlayer`, viewer `GameListViewer` — jsdom `window.matchMedia`) are unchanged and out of scope.

---

## File Structure

```
packages/server/
  package.json                                EDIT add "cheerio" (latest 1.x); @supabase/supabase-js + @google/genai already present
  src/services/mkt/external/
    ga4.ts                                    EDIT wire buildServiceAccountAssertion + getAccessToken(cache) + runReport(cfg,body)
    meta-graph.ts                             EDIT wire getPageMediaInsights (live) + getAdInsights (thin) + pure mapInstagram/FacebookInsights
    youtube-data.ts                           EDIT wire getChannelInfo + add searchChannels + getChannelVideos
  src/services/mkt/
    analytics.service.ts                      NEW  resolveGa4Config/resolveMetaCredentials + 6 GA4 report builders + row→viewmodel mappers + metaInsights + youtubeChannel
    seo.service.ts                            NEW  scoreSeoAudit (pure) + crawl + schemaGenerate
    competitors.service.ts                    NEW  gapAnalysis/keywordRankings/suggestCompetitors + parseCompetitorJson (pure)
    __tests__/
      ga4-assertion.test.ts                   NEW  TDD buildServiceAccountAssertion (RS256 verify) + token/runReport shaping
      analytics-mappers.test.ts               NEW  TDD 6 row→viewmodel mappers + resolveGa4Config/resolveMetaCredentials
      meta-mappers.test.ts                    NEW  TDD mapInstagram/FacebookInsights + formatNumber
      seo.service.test.ts                     NEW  TDD scoreSeoAudit (fixture HTML → scores+issues)
      competitors.service.test.ts             NEW  TDD parseCompetitorJson + rank-badge + keyword-seed helpers
  src/controllers/mkt/
    analytics.controller.ts                   NEW  5 GA4 + metaInsights + youtubeChannel
    seo.controller.ts                         NEW  seoAudit/seoCrawl/seoSchemaGenerate
    competitors.controller.ts                 NEW  gapAnalysis/keywordRankings/suggestCompetitors
  src/routes/mkt.routes.ts                    EDIT register 13 routes (analytics×7 + seo×3 + competitors×3)

packages/client/
  package.json                                EDIT add "recharts": "^2.15.4"
  src/features/marketing/
    types/analytics.ts                        EDIT add GA4CountryRow/GA4ContentRow/Meta*/Youtube*/Competitor*/SuggestedCompetitor/SeoAuditResult
    api/
      queries.ts                              EDIT add 7 analytics mktKeys
      use-analytics.ts                        NEW  GA4 query hooks + meta/youtube hooks + useSeoAudit/useSeoCrawl/useSchemaGenerate
      use-competitors.ts                      NEW  useGapAnalysis/useKeywordRankings/useSuggestCompetitors (mutations)
      __tests__/
        use-analytics.test.ts                 NEW  hook key/enabled/unwrap behavior (render-test, mocked fetch)
        use-competitors.test.ts               NEW  mutation unwrap + transient-state behavior (mocked fetch)
    components/analytics/                      NEW directory
      SiteAnalysisDashboard.tsx               NEW  2 sub-tabs (GA4 트래픽 / SEO 분석) + MarketingLanguageTabs
      AnalyticsDashboard.tsx                  NEW  GA4 page: period toggle + refresh + empty-state + 6 panels
      OverviewCards.tsx                       NEW  4 stat cards
      PageviewsChart.tsx                      NEW  ★recharts LineChart (daily pageviews)
      TrafficChart.tsx                        NEW  ★recharts BarChart (traffic source)
      TopPagesTable.tsx                       NEW  top-15 pages table
      CountryTraffic.tsx                      NEW  country list + %
      ContentPerformance.tsx                  NEW  per-page sessions list
      MetaAnalyticsDashboard.tsx              NEW  5 platform tabs
      YoutubeChannelPanel.tsx                 NEW  YT channel analyzer (extracted)
      WebsiteSeoPanel.tsx                     NEW  URL → /seo/audit (extracted, shares useSeoAudit)
      seo/
        SeoDashboard.tsx                      NEW  4 sub-tabs (audit/content/geo/schema)
        ScoreGauge.tsx                        NEW  score ring
        AuditForm.tsx                         NEW  URL input form
        IssuesList.tsx                        NEW  issues list
    components/competitors/                    NEW directory
      CompetitorsDashboard.tsx                NEW  2 tabs (콘텐츠 갭 / 키워드 순위)
    pages/
      SiteAnalysisPage.tsx                    NEW  project guard → <SiteAnalysisDashboard/>
      MetaAnalyticsPage.tsx                   NEW  project guard → <MetaAnalyticsDashboard/>
      CompetitorsPage.tsx                     NEW  project guard → <CompetitorsDashboard/>
    index.ts                                  EDIT export the 3 pages
  src/router/index.tsx                        EDIT lines 319/320/321: 3 placeholders → 3 pages (+ imports)
```

### Chunk dependency order (each chunk independently runnable in this order)

| Chunk | Sub-phase | Title | Depends on | Verifiable | TDD |
|---|---|---|---|---|---|
| **1** | shared | Deps (recharts + cheerio) + analytics TS types + mktKeys | — | both typechecks + `pnpm install` resolves | no |
| **2** | 4a | GA4 JWT auth + `runReport` wiring (`ga4.ts`) | 1 | `… test ga4-assertion` (FAIL→PASS) + server typecheck | **YES** |
| **3** | 4a | GA4 services + 6 mappers + 5 GA4 routes/controllers | 1, 2 | `… test analytics-mappers` + server typecheck | **YES** (mappers + resolvers) |
| **4** | 4a | `/seo/audit` service (cheerio) + crawl + schema + routes | 1 | `… test seo.service` (FAIL→PASS) + server typecheck | **YES** (`scoreSeoAudit`) |
| **5** | 4a | Client `use-analytics.ts` (GA4 query hooks + seo mutations) | 1, 3, 4 | `… test use-analytics` + client typecheck | light (render) |
| **6** | 4a | Recharts charts + the 5 GA4 render components | 1, 5 | client typecheck + build | no |
| **7** | 4a | `AnalyticsDashboard` + `SeoDashboard` + `SiteAnalysisDashboard` + `SiteAnalysisPage` + route swap (319) | 4, 5, 6 | typecheck + build + manual E2E | no |
| **8** | 4b | `meta-graph.ts` + `youtube-data.ts` wiring + meta/yt routes (+ resolveMetaCredentials) | 1, 3 | `… test meta-mappers` + server typecheck | **YES** (mappers) |
| **9** | 4b | `use-analytics` meta/yt hooks + `MetaAnalyticsDashboard` + panels + `MetaAnalyticsPage` + route swap (320) | 5, 7, 8 | typecheck + build + manual E2E | no |
| **10** | 4c | `competitors.service/controller` + 3 routes + `parseCompetitorJson` | 1 | `… test competitors.service` (FAIL→PASS) + server typecheck | **YES** (parser + helpers) |
| **11** | 4c | `use-competitors` hooks + `CompetitorsDashboard` (2 tabs) + `CompetitorsPage` + route swap (321) | 5, 10 | `… test use-competitors` + typecheck + build + manual E2E | light (render) |
| **12** | integration | Full gates + scope greps + docs + manual-E2E operator checklist | 1–11 | full suite/typecheck/lint/build + greps | no |

> **Sub-phase split (spec §8, §12):** **4a = site-analysis/GA4 + SEO** (Chunks 2–7, the biggest; carries the GA4 JWT + recharts + SEO sub-dashboard — most pure-testable logic; independently shippable behind the `site-analysis` placeholder). **4b = meta-analytics** (Chunks 8–9; Meta page/media insights + YouTube channel + Website SEO panel — reuses 4a's `/seo/audit`). **4c = competitors** (Chunks 10–11; the Gemini gap/rankings/suggest trio). **R-1 secrets discipline** (per-project creds read server-side, never on the wire) is the #1 correctness/security invariant — covered by `resolveGa4Config`/`resolveMetaCredentials` unit tests + the Chunk-12 greps. **Do not skip the TDD chunks (2, 3, 4, 8, 10).**

---

## Chunk 1: Shared foundation — deps + analytics types + mktKeys

> Adds the two new deps (client `recharts`, server `cheerio`), the NEW view-model TS types (only those beyond what `types/analytics.ts` already has), and the 7 analytics `mktKeys`. No external calls, no UI. Everything downstream imports these.

**Files:**
- Modify: `packages/client/package.json` (add `recharts`)
- Modify: `packages/server/package.json` (add `cheerio`)
- Modify: `packages/client/src/features/marketing/types/analytics.ts`
- Modify: `packages/client/src/features/marketing/api/queries.ts`

- [ ] **Step 1 (client dep — recharts):** Add to `packages/client/package.json` `dependencies`:
  ```jsonc
  "recharts": "^2.15.4",
  ```
  **Pin the 2.x line** (the React-18 line; CF's `^3.8.0` was React-19-era — see R-4 / spec §O‑5). Do NOT take 3.x. React is `^18.3.0` (verified) — recharts 2 peer-deps `react@^16||^17||^18` → clean fit.
- [ ] **Step 2 (server dep — cheerio):** Add to `packages/server/package.json` `dependencies`:
  ```jsonc
  "cheerio": "^1.0.0",
  ```
  (Verified ABSENT today — `grep cheerio packages/server/package.json` → no match. CF used it for `/seo/audit` + crawl HTML parse; the build/typecheck fails without it once Chunk 4 imports it.)
- [ ] **Step 3 (install):** `pnpm install` (workspace root). Confirm the lockfile updates and both packages resolve. **Watch for a recharts peer-dep warning against `react@18.3`** — there should be none (R-4); if one appears, STOP and re-evaluate the version.
- [ ] **Step 4 (client types):** In `packages/client/src/features/marketing/types/analytics.ts`, append the NEW view-models (the existing `GA4Config`/`GA4OverviewData`/`GA4TrafficSource`/`GA4TopPage`/`FunnelConfig`/`ImportedStrategy` already cover overview/traffic/top-pages — do NOT re-add them). Verbatim from spec §5:
  ```ts
  // --- GA4 country / content (new dimensions) ---
  export interface GA4CountryRow { country: string; sessions: number; users: number; }
  export interface GA4ContentRow { path: string; sessions: number; avgDuration: number; bounceRate: number; }

  // --- Meta channel analytics ---
  export interface MetaContentMetric {
    id: string; title: string; type: string; date: string;
    reach: number; impressions: number; engagement: number; engagementRate: number;
    likes: number; comments: number; shares: number; saves: number;
  }
  export interface MetaOverviewMetrics {
    followers: number; followersGrowth: number; totalReach: number; reachGrowth: number;
    totalEngagement: number; engagementGrowth: number; avgEngagementRate: number; postsCount: number;
  }
  export interface MetaInsightsResult {
    connected: boolean; overview: MetaOverviewMetrics; contents: MetaContentMetric[];
  }
  export interface YoutubeChannelStat {
    id: string; title: string; description?: string; thumbnail?: string;
    subscribers: number; viewCount: number; videoCount: number; avgViews: number;
  }

  // --- Competitors ---
  export interface CompetitorGapItem { topic: string; monthlySearch: number; competitors: string[]; difficulty: string; priority: string; }
  export interface CompetitorStrengthItem { topic: string; monthlySearch: number; note: string; }
  export interface CompetitorRankingItem { keyword: string; myRank: number | null; volume?: number; competitors: { name: string; rank: number | null }[]; }
  export interface SuggestedCompetitor { name: string; url?: string; type: string; reason: string; strength: string; }

  // --- SEO audit ---
  export interface SeoAuditResult {
    url: string; title: string; metaDescription: string;
    scores: { google: number; naver: number; geo: number; tech: number };
    issues: { severity: string; message: string; engine: string; fix_action?: string }[];
    meta: Record<string, unknown>;
  }
  ```
- [ ] **Step 5 (mktKeys):** In `queries.ts`, add to the flat `mktKeys` object (after `publishCounts`, `:32`). Verbatim from spec §5.1 (NOTE: competitor + SEO results are transient mutations → **NOT** keyed here):
  ```ts
  analyticsOverview:  (projectId: string, period: string) => ['mkt', 'analytics', 'overview', projectId, period] as const,
  analyticsTraffic:   (projectId: string, period: string) => ['mkt', 'analytics', 'traffic', projectId, period] as const,
  analyticsTopPages:  (projectId: string, period: string) => ['mkt', 'analytics', 'top-pages', projectId, period] as const,
  analyticsCountry:   (projectId: string, period: string) => ['mkt', 'analytics', 'country', projectId, period] as const,
  analyticsContent:   (projectId: string, period: string) => ['mkt', 'analytics', 'content', projectId, period] as const,
  metaInsights:       (projectId: string, platform: string, country: string) => ['mkt', 'analytics', 'meta', projectId, platform, country] as const,
  youtubeChannel:     (projectId: string, query: string) => ['mkt', 'analytics', 'yt-channel', projectId, query] as const,
  ```
- [ ] **Step 6 (typecheck):** `pnpm --filter @tangobook/client typecheck` → PASS. `pnpm --filter @tangobook/server typecheck` → PASS (cheerio types resolve — `cheerio` ships its own).
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/client/package.json packages/server/package.json pnpm-lock.yaml packages/client/src/features/marketing/types/analytics.ts packages/client/src/features/marketing/api/queries.ts
  git commit -m "feat(marketing): Phase 4 deps (recharts client + cheerio server) + analytics view-model types + analytics mktKeys"
  ```

---

## Chunk 2: GA4 JWT auth + `runReport` wiring (`ga4.ts`) — TDD

> Wire the 501 stub `services/mkt/external/ga4.ts` into a self-contained module: (a) build a Google OAuth2 **service-account assertion (signed JWT, RS256)** with Node built-in `crypto` — **no `google-auth-library`, no `@google-analytics/data`** (verified neither is a dep); (b) exchange it for an access token (module-level cache ~55min); (c) `runReport(cfg, reportBody)` REST. **TDD the pure `buildServiceAccountAssertion`** (verify the signature with a generated key pair) + assert the token/runReport request shaping (mocked `fetch`). The `GA4Report`/`GA4ReportRow` interfaces already exist (`ga4.ts:21‑31`) — the REST response uses the same `dimensionValues[].value`/`metricValues[].value` shape as the SDK, so the row mappers (Chunk 3) are unchanged.

**Files:**
- Modify: `packages/server/src/services/mkt/external/ga4.ts`
- Test: `packages/server/src/services/mkt/__tests__/ga4-assertion.test.ts`

- [ ] **Step 1 (test — write the failing test first):** TDD `buildServiceAccountAssertion` (the cleanest pure unit) + the request shaping. Generate a throwaway RSA key pair in-test (`crypto.generateKeyPairSync('rsa', { modulusLength: 2048, ... })` → PEM `privateKey`/`publicKey`). Cover (spec §8 4a / §10):
  - Given `clientEmail`, the test `privateKey`, and a fixed `nowSec`, the returned `header.payload.signature` splits on `.` into 3 segments; base64url-decoding segment 1 = `{alg:'RS256',typ:'JWT'}`, segment 2 = `{iss:clientEmail, scope:'https://www.googleapis.com/auth/analytics.readonly', aud:'https://oauth2.googleapis.com/token', iat:nowSec, exp:nowSec+3600}`.
  - The signature verifies: `crypto.createVerify('RSA-SHA256').update(`${seg0}.${seg1}`).verify(publicKey, Buffer.from(seg2_b64url, 'base64url'))` → `true`.
  - A literal-`\n` private key is accepted (the impl/`resolveGa4Config` un-escapes; the assertion builder receives an already-PEM key — assert it signs a real PEM).
  - (Optional, same file) `runReport` request shaping: stub `fetch` to (1) return a token then (2) capture the `runReport` call; assert URL = `https://analyticsdata.googleapis.com/v1beta/properties/{id}:runReport`, method POST, `Authorization: Bearer <token>`, body = the passed `reportBody` JSON. And the token cache: two `getAccessToken` calls within the window mint once (one token-exchange `fetch`).
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import crypto from 'node:crypto';
  import { buildServiceAccountAssertion } from '../external/ga4.js';

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const decode = (seg: string) => JSON.parse(Buffer.from(seg, 'base64url').toString());

  describe('buildServiceAccountAssertion', () => {
    it('builds a RS256 JWT with the correct header/claim and a verifiable signature', () => {
      const a = buildServiceAccountAssertion('svc@proj.iam.gserviceaccount.com', privateKey, 1_700_000_000);
      const [h, p, s] = a.split('.');
      expect(decode(h)).toEqual({ alg: 'RS256', typ: 'JWT' });
      expect(decode(p)).toMatchObject({
        iss: 'svc@proj.iam.gserviceaccount.com',
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        iat: 1_700_000_000, exp: 1_700_003_600,
      });
      const ok = crypto.createVerify('RSA-SHA256').update(`${h}.${p}`).verify(publicKey, Buffer.from(s, 'base64url'));
      expect(ok).toBe(true);
    });
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test ga4-assertion` → **FAIL** (`buildServiceAccountAssertion` not exported).
- [ ] **Step 3 (impl):** Rewrite `ga4.ts` (keep the existing `GA4Report`/`GA4ReportRow`/`GA4Dimension`/`GA4Metric` interfaces; **remove the 501 `getSessionsSummary`** stub — unused). Spec §4.2 verbatim:
  - `b64url(input)` helper (`base64` → `-`/`_`/strip `=`).
  - `buildServiceAccountAssertion(clientEmail, privateKey, nowSec = Math.floor(Date.now()/1000))` → header+claim (scope `analytics.readonly`, aud token endpoint, `exp = iat+3600`) → `crypto.createSign('RSA-SHA256').update(signingInput).sign(privateKey)` → `${signingInput}.${b64url(sig)}`.
  - Module-level `let _tokenCache: { token: string; exp: number } | null = null;` + `async getAccessToken(clientEmail, privateKey)`: reuse if `exp > now+60`; else POST `https://oauth2.googleapis.com/token` `application/x-www-form-urlencoded` `{ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }`; on `!res.ok` → `throw new AppError(502, 'GA4 token exchange 실패 (${status})')`; cache `{ token, exp: now + (expires_in ?? 3600) }`.
  - `runReport(cfg: { propertyId; clientEmail; privateKey }, reportBody: Record<string, unknown>)`: token → POST `https://analyticsdata.googleapis.com/v1beta/properties/${cfg.propertyId}:runReport` (Bearer + JSON body); on `!res.ok` → `throw new AppError(502, 'GA4 runReport 실패 (${status}): ${text.slice(0,200)}')`; return `await res.json() as GA4Report`.
  > **Signature change:** the old `runReport(_dateRanges, _dimensions, _metrics)` becomes `runReport(cfg, reportBody)` — cleaner for the 5 different report shapes (orderBys/limit vary). The 6 services in Chunk 3 build the `reportBody` per the §4.2 table. `fetch` is global (Node 20) — no import.
  > **R-3 (MED) — PEM newlines / clock skew:** RS256 signing needs the PEM with **real newlines**; `resolveGa4Config` (Chunk 3) re-un-escapes the row value's literal `\n`, and `config.ga4.privateKey` already does (`config/index.ts:56`). `iat/exp` use the server clock — a >5-min skew vs Google rejects the assertion (NTP-synced server assumed). Documented in CLAUDE.md (Chunk 12).
- [ ] **Step 4 (run + typecheck):** `pnpm --filter @tangobook/server test ga4-assertion` → **PASS**. `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/server/src/services/mkt/external/ga4.ts packages/server/src/services/mkt/__tests__/ga4-assertion.test.ts
  git commit -m "feat(marketing): wire GA4 service-account JWT (RS256 via node:crypto) + token cache + runReport REST + tests"
  ```

---

## Chunk 3: GA4 analytics services + 6 row→viewmodel mappers + 5 GA4 routes — TDD

> The `analytics.service.ts` core: `resolveGa4Config` (row→env→501), the **6 report builders** (each calls `runReport(cfg, body)` with the exact §4.2 `metrics/dimensions/orderBys/limit`), and the **pure row→viewmodel mappers** (the primary TDD unit). Plus `analytics.controller.ts` (5 GA4 endpoints) + route registration. Each route takes `{ projectId, period? }` (NOT creds) → resolves config server-side → returns `{ success, data }`; graceful **501** when the project row + env both lack GA4. (Meta/YouTube are Chunk 8 — but `resolveMetaCredentials` may also land here; spec puts it in 4b, keep it in Chunk 8.)

**Files:**
- Create: `packages/server/src/services/mkt/analytics.service.ts`
- Create: `packages/server/src/controllers/mkt/analytics.controller.ts`
- Test: `packages/server/src/services/mkt/__tests__/analytics-mappers.test.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (test — mappers + resolver, TDD):** Failing tests for the pure pieces (spec §8 4a / §10). Provide stub `GA4Report` objects (`rows[].dimensionValues[].value` / `metricValues[].value` strings) → assert each mapper's view-model:
  - `mapOverviewSummary(report)` → `{ totalSessions, totalUsers, totalPageviews, bounceRate, avgSessionDuration }` from `rows[0].metricValues[0..4]` with `parseInt(...,10)` / `parseFloat` `?? '0'` fallbacks (faithful to overview/route.ts:54‑58).
  - `mapDaily(report)` → `{ date, views }[]` from `dimensionValues[0]` + `metricValues[0]`.
  - `mapTraffic(report)` → `GA4TrafficSource[]` with `percentage = totalSessions>0 ? Math.round(sessions/total*100) : 0` (0-total guard); `channel` fallback `'Unknown'` (traffic/route.ts:41‑49).
  - `mapTopPages(report)` → `GA4TopPage[]` (path/title/views/users; top-pages/route.ts:40‑45).
  - `mapCountry(report)` → `GA4CountryRow[]` (country-traffic/route.ts:23‑27).
  - `mapContent(report)` → `GA4ContentRow[]` (content-performance/route.ts:23‑28).
  - `resolveGa4Config(projectId)` with a mocked `getSupabaseAdmin()`: (i) row present → uses row `propertyId/clientEmail/privateKey`; (ii) row `ga4_config` null → env fallback (`config.ga4`); (iii) both absent → `AppError(501, ...)`; (iv) row private key with literal `\\n` → un-escaped to real newlines.
  ```ts
  import { describe, it, expect, vi } from 'vitest';
  vi.mock('../../../providers/supabase-admin.provider.js', () => ({ getSupabaseAdmin: vi.fn() }));
  import { getSupabaseAdmin } from '../../../providers/supabase-admin.provider.js';
  import { mapTraffic, resolveGa4Config } from '../analytics.service.js';

  const ga4Report = (rows: { d: string[]; m: string[] }[]) =>
    ({ dimensionHeaders: [], metricHeaders: [], rowCount: rows.length,
       rows: rows.map((r) => ({ dimensionValues: r.d.map((value) => ({ value })) as never,
                                metricValues: r.m.map((value) => ({ value })) as never })) });

  it('mapTraffic computes percentage with a 0-total guard', () => {
    const out = mapTraffic(ga4Report([{ d: ['Organic Search'], m: ['80', '50'] }, { d: ['Direct'], m: ['20', '15'] }]) as never);
    expect(out[0]).toEqual({ channel: 'Organic Search', sessions: 80, users: 50, percentage: 80 });
    expect(mapTraffic(ga4Report([]) as never)).toEqual([]); // no divide-by-zero
  });
  // resolveGa4Config: row→env→501 + \n un-escape (mock admin .from().select().eq().maybeSingle())
  ```
  > **Mapper interface note:** `GA4Report.rows[i].dimensionValues`/`metricValues` are declared in `ga4.ts` as `string[]`, but the REST/SDK response is `{ value: string }[]`. Reconcile in Chunk 2/3: either (a) keep the interface as `string[]` and have `runReport` flatten `{value}` → `value` before returning, or (b) widen the interface to `{ value?: string }[]` and have mappers read `.value`. **Pick (b)** (less surprising, matches CF row shape) and update the `GA4ReportRow` interface accordingly in Chunk 2. Keep the test's stub aligned with the choice.
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test analytics-mappers` → **FAIL**.
- [ ] **Step 3 (impl `analytics.service.ts`):** Spec §4.1 + §4.2.
  - `export interface ResolvedGa4 { propertyId; clientEmail; privateKey; }` + `resolveGa4Config(projectId)` (verbatim spec §4.1): `getSupabaseAdmin()`; if admin && projectId → `.from('mkt_projects').select('ga4_config').eq('id', projectId).maybeSingle()` → `row = data?.ga4_config`; `propertyId = row?.propertyId || config.ga4.propertyId`; same for clientEmail; `privateKey = (row?.privateKey || config.ga4.privateKey || '').replace(/\\n/g, '\n')`; if any missing → `throw new AppError(501, 'GA4가 연동되지 않았습니다. 프로젝트 설정 > 퍼널·분석에서 GA4 서비스 계정을 연결하세요.')`.
  - The 6 pure mappers (exported, tested above).
  - 6 report-builder fns (each `resolveGa4Config` once per request is wasteful — have the controller resolve once and pass `cfg` to the builders, or cache within the request). Build the `reportBody` per the §4.2 table and call `runReport(cfg, body)`:
    | builder | metrics | dimensions | orderBys | limit | dateRange |
    |---|---|---|---|---|---|
    | `getOverview` (2 calls) | summary: `sessions,activeUsers,screenPageViews,bounceRate,averageSessionDuration`; daily: `screenPageViews` + dim `date` + orderBy `{dimension:{dimensionName:'date'}}` | — / date | — | — | `[{startDate, endDate:'today'}]` |
    | `getTraffic` | `sessions,activeUsers` | `sessionDefaultChannelGroup` | `{metric:{metricName:'sessions'},desc:true}` | 10 | same |
    | `getTopPages` | `screenPageViews,activeUsers` | `pagePath,pageTitle` | `{metric:{metricName:'screenPageViews'},desc:true}` | 15 | same |
    | `getCountry` | `sessions,totalUsers` | `country` | `{metric:{metricName:'sessions'},desc:true}` | 10 | same |
    | `getContent` | `sessions,averageSessionDuration,bounceRate` | `pagePath` | `{metric:{metricName:'sessions'},desc:true}` | 15 | same |
    - `startDate = period === '30d' ? '30daysAgo' : '7daysAgo'` (overview defaults 7d; traffic/top-pages/country/content default 30d per CF — but the client always sends `period`, so honor it; for country/content CF used `days` numeric — normalize: `30d→'30daysAgo'`, `7d→'7daysAgo'`). `getOverview` returns `{ period, ...mapOverviewSummary(summary), dailyPageviews: mapDaily(daily) }` (= `GA4OverviewData`).
  - `getMetaInsights`/`getYoutubeChannel`/`resolveMetaCredentials` → **Chunk 8** (not here).
- [ ] **Step 4 (impl `analytics.controller.ts`):** 5 GA4 controllers, each `asyncHandler`, parse `{ projectId, period }` (`AppError(400)` if no projectId), resolve `cfg` once, call the builder, `res.json({ success: true, data })`. Pattern mirrors `ideas.controller.ts`:
  ```ts
  export const analyticsOverview = asyncHandler(async (req, res) => {
    const { projectId, period } = req.body as { projectId?: string; period?: '7d' | '30d' };
    if (!projectId) throw new AppError(400, 'projectId is required');
    const cfg = await resolveGa4Config(projectId);           // throws 501 when unconfigured
    const data = await getOverview(cfg, period ?? '7d');
    res.json({ success: true, data });
  });
  // analyticsTraffic / analyticsTopPages / analyticsCountryTraffic / analyticsContentPerformance — same shape
  ```
- [ ] **Step 5 (routes):** In `mkt.routes.ts`, import the 5 controllers + add a `// ── Analytics endpoints (server-proxy; per-project creds read server-side) ──` section after `/publish/meta` (`:44`):
  ```ts
  router.post('/analytics/overview', analyticsOverview);
  router.post('/analytics/traffic', analyticsTraffic);
  router.post('/analytics/top-pages', analyticsTopPages);
  router.post('/analytics/country-traffic', analyticsCountryTraffic);
  router.post('/analytics/content-performance', analyticsContentPerformance);
  ```
  (meta-insights + youtube-channel rows are added in Chunk 8.)
- [ ] **Step 6 (run + typecheck):** `pnpm --filter @tangobook/server test analytics-mappers` → **PASS**. `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/server/src/services/mkt/analytics.service.ts packages/server/src/controllers/mkt/analytics.controller.ts packages/server/src/services/mkt/__tests__/analytics-mappers.test.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing): GA4 analytics service (resolveGa4Config + 6 report builders + row mappers) + 5 routes + tests"
  ```

---

## Chunk 4: SEO sub-dashboard endpoints — `/seo/audit` (cheerio) + crawl + schema — TDD

> `seo.service.ts` + `seo.controller.ts` + 3 routes for the site-analysis SEO sub-tab. **TDD `scoreSeoAudit($, url)`** — the ~45-line cheerio scoring (google/naver/geo/tech + issues) ported verbatim from CF `seo/audit/route.ts` into a pure function over a cheerio-loaded doc. Crawl (page text extract for the GEO tab) + schema-generate (Gemini → JSON-LD) are thin. The **content-SEO tab is PURE/client-side** (`calculateNaverSeoScore` over blog contents — no endpoint, Chunk 7) and the **GEO write-up reuses the existing `/api/mkt/ai/generate` SSE** (Chunk 7) — neither needs a route here.

**Files:**
- Create: `packages/server/src/services/mkt/seo.service.ts`
- Create: `packages/server/src/controllers/mkt/seo.controller.ts`
- Test: `packages/server/src/services/mkt/__tests__/seo.service.test.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (test — `scoreSeoAudit`, TDD):** Failing test over fixture HTML strings (`cheerio.load(html)`), asserting `scores` + `issues` match CF thresholds (spec §4.6 / §10). Cover the score boundaries from CF `seo/audit/route.ts`: title 30–60 (+15), meta ≥120 (+15 else critical issue), single H1 (+10), ≥2 H2 (+10), all-img-alt with ≥1 img (+10), https (+10 google / +20 tech), viewport (+10 google / +20 tech), canonical (+10 google / +15 tech), >5 links (+10); naver: title (+15), ≥3 images (+15 else warning), ≥2 H2 (+10), textLength≥2000 (+15), meta (+10), `+min(35, floor(textLength/200))`; geo: schema (+25 else critical), `"FAQPage"` substring (+20 else warning), an H2 containing `?` (+15), `+min(40, floor(textLength/300))`; tech base `+35` + robots-meta (+10).
  ```ts
  import { describe, it, expect } from 'vitest';
  import * as cheerio from 'cheerio';
  import { scoreSeoAudit } from '../seo.service.js';

  it('scores a well-formed page high on google + flags missing schema for geo', () => {
    const html = `<html><head><title>${'A'.repeat(40)}</title>
      <meta name="description" content="${'D'.repeat(130)}"><meta name="viewport" content="w">
      <link rel="canonical" href="https://x.com"></head>
      <body><h1>One</h1><h2>Q?</h2><h2>Two</h2>${'<a href="/x">l</a>'.repeat(6)}<img src="a" alt="x"></body></html>`;
    const r = scoreSeoAudit(cheerio.load(html), 'https://x.com');
    expect(r.scores.google).toBeGreaterThanOrEqual(80);
    expect(r.issues.some((i) => i.engine === 'geo' && /Schema/i.test(i.message))).toBe(true);
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test seo.service` → **FAIL**.
- [ ] **Step 3 (impl `seo.service.ts`):**
  - `export function scoreSeoAudit($: cheerio.CheerioAPI, url: string): SeoAuditResult` — port CF `seo/audit/route.ts:13‑69` verbatim (extract title/meta/h1s/h2s/images/links/hasSchema/isHttps/hasViewport/canonical/textLength → the 4 score blocks + `issues[]` → return `{ url, title, metaDescription, scores, issues, meta }`). **Note:** the GEO `html.includes('"FAQPage"')` check in CF reads the raw HTML, not `$` — pass the raw `html` in too, or run the check on `$.html()`. Use `$.html()` for parity.
  - `export async function auditUrl(url: string)`: `fetch(url, { headers: { 'User-Agent': 'Tangobook SEO Bot/1.0' } })` → `html = await res.text()` → `scoreSeoAudit(cheerio.load(html), url)`. **R-8 (LOW/MED) SSRF:** guard `url` to `http`/`https` only (`new URL(url).protocol`), reject otherwise with `AppError(400)`; add a fetch timeout (`AbortSignal.timeout(10_000)`). Operator-only tool, but cheap to harden.
  - `export async function crawlUrl(url: string): Promise<{ analysis?: unknown; text: string }>` — fetch + cheerio → extract title + headings + body text (`$('body').text().replace(/\s+/g,' ').trim().slice(0, ~5000)`); minimal port of CF `ai/strategy/crawl` (GEO tab's page summary). Same scheme guard.
  - `export async function schemaGenerate(content: string, schemaType: string, language?: string): Promise<{ schema: string }>` — `generateTextWithGemini(prompt, 3, config.gemini.textModel)`; prompt ported from CF `seo/schema-generate/route.ts` (`Generate valid JSON-LD Schema.org markup of type "${schemaType||'Article'}" … Content: ${content.substring(0,3000)}`); extract `/\{[\s\S]*\}/` → `{ schema: match[0] ?? text }`. Throw `AppError(502, 'Gemini API 키가 설정되지 않았습니다.')` if `!config.gemini.apiKey`.
- [ ] **Step 4 (impl `seo.controller.ts`):** 3 `asyncHandler` controllers:
  ```ts
  export const seoAudit = asyncHandler(async (req, res) => {
    const { url } = req.body as { url?: string };
    if (!url) throw new AppError(400, 'url is required');
    res.json({ success: true, data: await auditUrl(url) });
  });
  // seoCrawl { url } → crawlUrl; seoSchemaGenerate { content, schemaType, language } → schemaGenerate
  ```
- [ ] **Step 5 (routes):** In `mkt.routes.ts`, import + add a `// ── SEO endpoints (site-analysis SEO sub-tab) ──` section:
  ```ts
  router.post('/seo/audit', seoAudit);
  router.post('/seo/crawl', seoCrawl);
  router.post('/seo/schema-generate', seoSchemaGenerate);
  ```
  > **SCOPED OUT (do NOT add):** `/seo/keywords` + `/seo/readability` (not called by any Phase-4 dashboard — content/strategy, Phase 5+). Confirm in Chunk 12 grep.
- [ ] **Step 6 (run + typecheck):** `pnpm --filter @tangobook/server test seo.service` → **PASS**. `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/server/src/services/mkt/seo.service.ts packages/server/src/controllers/mkt/seo.controller.ts packages/server/src/services/mkt/__tests__/seo.service.test.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing): SEO endpoints (scoreSeoAudit cheerio + crawl + schema-generate) + routes + tests"
  ```

---

## Chunk 5: Client `use-analytics.ts` — GA4 query hooks + SEO mutations

> The server-proxy TanStack hooks for site-analysis (4a). GA4 reads = cached `useQuery` keyed by `mktKeys.analytics*` (enabled on `hasGa4 && !!projectId`, `staleTime ~5min`); SEO audit/crawl/schema = `useMutation` (transient, triggered by buttons). All hit the Express endpoints via a small POST helper that unwraps `{ success, data }`. **A light render-test** asserts the query keys + `enabled` gating + that the hook surfaces `data`/`error` (mocked `fetch`); the GA4 reads themselves need real creds (deferred). Meta/YouTube hooks are added to this same file in Chunk 9.

**Files:**
- Create: `packages/client/src/features/marketing/api/use-analytics.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-analytics.test.ts`

- [ ] **Step 1 (test — hook behavior, light):** Failing test (mocked `fetch` returning `{ success: true, data: {...} }`) covering: `useGa4Overview(projectId, period)` uses `mktKeys.analyticsOverview(projectId, period)`, is **disabled** when `enabled=false` (no projectId / no GA4) → no fetch, and **unwraps `.data`** when enabled. Use `@testing-library/react` `renderHook` + a `QueryClientProvider` wrapper (match the existing marketing hook tests' setup — see any `api/__tests__/*.test.ts` from Phase 2/3 for the wrapper). Keep it minimal — the value is the key/enabled/unwrap contract, not GA4 data.
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/client test use-analytics` → **FAIL**.
- [ ] **Step 3 (impl):** Create `use-analytics.ts`. A `postMkt<T>(path, body): Promise<T>` helper (`fetch('/api/mkt'+path, {method:'POST', headers, body: JSON.stringify(body)})` → `json.success ? json.data : throw new Error(json.error || json.message)`). Then:
  - **GA4 query hooks** (one per report), each `useQuery({ queryKey: mktKeys.analyticsX(projectId, period), enabled, staleTime: 5*60_000, queryFn: () => postMkt(...) })`, `enabled` param defaulting to `!!projectId`:
    - `useGa4Overview(projectId, period, enabled?)` → `GA4OverviewData`
    - `useGa4Traffic(projectId, period, enabled?)` → `GA4TrafficSource[]`
    - `useGa4TopPages(projectId, period, enabled?)` → `GA4TopPage[]`
    - `useGa4Country(projectId, period, enabled?)` → `GA4CountryRow[]`
    - `useGa4Content(projectId, period, enabled?)` → `GA4ContentRow[]`
    > The component (Chunk 7) passes `enabled = hasGa4 && !!projectId` so all five `Promise.all`-style fire together only when GA4 is configured (faithful to CF `fetchAll`).
  - **SEO mutations** (transient):
    - `useSeoAudit()` → `useMutation((url: string) => postMkt('/seo/audit', { url }))` → `SeoAuditResult`
    - `useSeoCrawl()` → `useMutation((url: string) => postMkt('/seo/crawl', { url }))`
    - `useSchemaGenerate()` → `useMutation((args: { content; schemaType; language? }) => postMkt('/seo/schema-generate', args))`
- [ ] **Step 4 (run + typecheck):** `pnpm --filter @tangobook/client test use-analytics` → **PASS**. `pnpm --filter @tangobook/client typecheck` → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-analytics.ts packages/client/src/features/marketing/api/__tests__/use-analytics.test.ts
  git commit -m "feat(marketing): use-analytics GA4 query hooks (server-proxy, staleTime 5m) + SEO audit/crawl/schema mutations + test"
  ```

---

## Chunk 6: Recharts charts + the 5 GA4 render components

> The two ★recharts components (the ONLY recharts in the whole marketing module) + the five pure-render GA4 panels. Port-task pattern (port → typecheck → manual-verify-deferred-to-Chunk-7 → commit). All consume props (data passed down from `AnalyticsDashboard` in Chunk 7), so they build/typecheck standalone.

**Files:**
- Create: `packages/client/src/features/marketing/components/analytics/PageviewsChart.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/TrafficChart.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/OverviewCards.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/TopPagesTable.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/CountryTraffic.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/ContentPerformance.tsx`

- [ ] **Step 1 (`PageviewsChart.tsx`, port of `pageviews-chart.tsx`):** `ResponsiveContainer` (h-200) + recharts `LineChart` over `{ date, views }[]`, `dataKey="views"`, X-axis = `MM/DD` (from `date.slice` — GA4 `date` is `YYYYMMDD`), line color `#0F6E56`. Props `{ data: { date: string; views: number }[] }`. **Import recharts named exports** (`import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'`).
- [ ] **Step 2 (`TrafficChart.tsx`, port of `traffic-chart.tsx`):** `ResponsiveContainer` (h-200) + recharts **vertical** `BarChart` over `GA4TrafficSource[]`, `dataKey="sessions"`, Y category = `channel` (`layout="vertical"`), bar color `#0F6E56`. Props `{ data: GA4TrafficSource[] }`.
- [ ] **Step 3 (`OverviewCards.tsx`, port of `overview-cards.tsx`):** 4 stat cards (세션 / 사용자 / 페이지뷰 / 이탈률) from `GA4OverviewData` (bounceRate as `%`, avgSessionDuration formatted `m:ss` if CF does). Props `{ data: GA4OverviewData }`. Korean labels `break-keep` in narrow cards (project RULE).
- [ ] **Step 4 (`TopPagesTable.tsx`, port of `top-pages-table.tsx`):** top-15 table (path/title/views/users); optional `websiteUrl` prop to render full URLs. Props `{ pages: GA4TopPage[]; websiteUrl?: string }`.
- [ ] **Step 5 (`CountryTraffic.tsx`, port of `country-traffic.tsx`):** country list w/ flags + `%` from `GA4CountryRow[]`. Props `{ data: GA4CountryRow[] }`. (CF renders `[]` today; here it populates — spec §3.1.)
- [ ] **Step 6 (`ContentPerformance.tsx`, port of `content-performance.tsx`):** per-page sessions list from `GA4ContentRow[]` (path / sessions / avgDuration / bounceRate). Props `{ data: GA4ContentRow[] }`.
- [ ] **Step 7 (typecheck + build):** `pnpm --filter @tangobook/client typecheck` → PASS. `pnpm --filter @tangobook/client build` → PASS (recharts resolves; **note any new large-chunk warning** — R-4; acceptable, the two chart components land in the marketing route chunk; a future lazy-`import()` is the mitigation if it balloons). Grep the 6 files: no `@/components/ui/*`, no `'use client'`.
- [ ] **Step 8:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/analytics/PageviewsChart.tsx packages/client/src/features/marketing/components/analytics/TrafficChart.tsx packages/client/src/features/marketing/components/analytics/OverviewCards.tsx packages/client/src/features/marketing/components/analytics/TopPagesTable.tsx packages/client/src/features/marketing/components/analytics/CountryTraffic.tsx packages/client/src/features/marketing/components/analytics/ContentPerformance.tsx
  git commit -m "feat(marketing): GA4 render components (recharts Pageviews/Traffic charts + Overview/TopPages/Country/Content panels)"
  ```

---

## Chunk 7: `AnalyticsDashboard` + `SeoDashboard` + `SiteAnalysisDashboard` + page + route swap (319)

> Assembles 4a: the GA4 page (period toggle + empty-state + the 6 panels wired to the Chunk-5 hooks), the SEO sub-dashboard (4 sub-tabs: audit/content/geo/schema), the 2-sub-tab wrapper, the page guard, and the **route swap at line 319** (`site-analysis` → `SiteAnalysisPage`). Makes 4a live. Port-task pattern with a real manual-verify.

**Files:**
- Create: `packages/client/src/features/marketing/components/analytics/AnalyticsDashboard.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/seo/ScoreGauge.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/seo/AuditForm.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/seo/IssuesList.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/seo/SeoDashboard.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/SiteAnalysisDashboard.tsx`
- Create: `packages/client/src/features/marketing/pages/SiteAnalysisPage.tsx`
- Modify: `packages/client/src/features/marketing/index.ts`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1 (`AnalyticsDashboard.tsx`, port of `analytics-dashboard.tsx`, spec §6.1):** Props `{ projectId: string }`. `const { data: project } = useProject(projectId); const hasGa4 = !!project?.ga4_config?.propertyId;`. If `!hasGa4` → empty state "GA4 연동이 필요합니다 / 프로젝트 설정 > 퍼널·분석에서 연결" (CF `:33‑43`). Else: local `period` state (`'7d'|'30d'` toggle) + a refresh button (`queryClient.invalidateQueries` the 5 analytics keys, or rely on staleTime). Wire the 5 hooks `useGa4Overview/Traffic/TopPages/Country/Content(projectId, period, hasGa4)` and render `<OverviewCards/>`, `<PageviewsChart data={overview.dailyPageviews}/>`, `<TrafficChart/>`, `<TopPagesTable websiteUrl={funnel.websiteUrl}/>`, `<CountryTraffic/>`, `<ContentPerformance/>`. Show the first hook's `error` as a banner (GA4 429/quota → banner, not crash — R-2). `funnel_config.websiteUrl` as subtitle.
- [ ] **Step 2 (`ScoreGauge.tsx` / `AuditForm.tsx` / `IssuesList.tsx`, ports of `seo/score-gauge.tsx` / `audit-form.tsx` / `issues-list.tsx`):** `ScoreGauge` = score ring (props `{ label; score }`); `AuditForm` = URL input + submit (props `{ onSubmit: (url) => void; loading }`); `IssuesList` = issues list grouped/colored by severity (props `{ issues: SeoAuditResult['issues'] }`).
- [ ] **Step 3 (`SeoDashboard.tsx`, port of `seo/seo-dashboard.tsx`, ~470 LOC, spec §6.4):** Props `{ projectId: string }`. 4 sub-tabs:
  - **audit** — `<AuditForm onSubmit={(url) => useSeoAudit().mutate(url)}/>` → on success `<ScoreGauge/>×4` (google/naver/geo/tech) + `<IssuesList/>`.
  - **content** — **PURE** (no endpoint): `calculateNaverSeoScore()` from `lib/seo-scorer.ts` (already ported) over the project's blog contents (`useBlogContentsForProject` / the existing blog hooks — read from the supabase-direct content hooks); sort worst-first. The one Supabase touch in site-analysis.
  - **geo** — URL → `useSeoCrawl().mutate(url)` → page summary → build the GEO prompt (faithful to CF `fetchAiGenerate(prompt,'gemini-2.5-flash')`) → `useAiGeneration` SSE (the existing `hooks/use-ai-generation.ts`) → markdown write-up. **No new endpoint.**
  - **schema** — textarea (content) + type `<Select>` → `useSchemaGenerate().mutate({content, schemaType, language})` → JSON-LD output + copy button.
- [ ] **Step 4 (`SiteAnalysisDashboard.tsx`, port of `site-analysis-dashboard.tsx`, spec §6.1):** Props `{ projectId: string }`. `<MarketingLanguageTabs selectedLang onLangChange/>` (reuse Phase-2; the lang is display-only here — document) + 2 sub-tabs `GA4 트래픽`/`SEO 분석` (local `activeTab` state) rendering `<AnalyticsDashboard projectId/>` or `<SeoDashboard projectId/>`. Faithful to CF (which used `useState<'ga4'|'seo'>`).
- [ ] **Step 5 (`SiteAnalysisPage.tsx`):** Mirror `IdeasPage` guard (verified `IdeasPage.tsx:4‑13`):
  ```tsx
  import { SiteAnalysisDashboard } from '../components/analytics/SiteAnalysisDashboard';
  import { useUIStore } from '../store/ui-store';
  export function SiteAnalysisPage() {
    const selectedProjectId = useUIStore((s) => s.selectedProjectId);
    if (!selectedProjectId) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">프로젝트를 선택하세요</div>;
    return <SiteAnalysisDashboard projectId={selectedProjectId} />;
  }
  ```
- [ ] **Step 6 (barrel + route swap):**
  - In `features/marketing/index.ts`, add `export { SiteAnalysisPage } from './pages/SiteAnalysisPage';` (Pages section, next to `IdeasPage`/`PublishPage`).
  - In `router/index.tsx`: add `SiteAnalysisPage` to the `from '../features/marketing'` import block (`:6‑13`); **replace line 319** `{ path: 'site-analysis', element: <PlaceholderPage title="사이트 분석" /> },` → `{ path: 'site-analysis', element: <SiteAnalysisPage /> },`. **Leave `meta-analytics`/`competitors` (320/321) as PlaceholderPage** (Chunks 9/11) and `monitoring`/`strategy`/`ads` (318/322/323) as PlaceholderPage (Phase 5 — OUT).
- [ ] **Step 7 (typecheck + build):** `pnpm --filter @tangobook/client typecheck` → PASS. `pnpm --filter @tangobook/client build` → PASS.
- [ ] **Step 8 (manual-verify — @superpowers:verification-before-completion):** `pnpm dev`; `/marketing` → select a project → sidebar **사이트 분석**.
  - **Project guard:** no project → "프로젝트를 선택하세요".
  - **GA4 sub-tab:** with no `ga4_config` → empty state "GA4 연동이 필요합니다". (Live GA4 data needs real creds → Chunk 12 operator checklist.)
  - **SEO sub-tab:** audit a public URL → 4 score gauges + issues render (this works with no creds, server-proxy crawl). schema-generate produces JSON-LD (needs Gemini key — else 502 banner). content tab lists blog SEO scores. geo tab crawls + writes up (needs Gemini).
- [ ] **Step 9:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/analytics/AnalyticsDashboard.tsx packages/client/src/features/marketing/components/analytics/seo packages/client/src/features/marketing/components/analytics/SiteAnalysisDashboard.tsx packages/client/src/features/marketing/pages/SiteAnalysisPage.tsx packages/client/src/features/marketing/index.ts packages/client/src/router/index.tsx
  git commit -m "feat(marketing): wire /marketing/site-analysis -> SiteAnalysisDashboard (GA4 + SEO sub-tabs) + SeoDashboard"
  ```

---

## Chunk 8: Meta + YouTube wiring + meta/youtube routes — TDD

> 4b backend: wire `meta-graph.ts` (live `getPageMediaInsights` for IG/FB + thin/unused `getAdInsights` + the **pure** `mapInstagramInsights`/`mapFacebookInsights`) and `youtube-data.ts` (`getChannelInfo` + `searchChannels` + `getChannelVideos`), add `resolveMetaCredentials` + `getMetaInsights` + `getYoutubeChannel` to `analytics.service.ts`, the 2 controllers, and the 2 routes. **TDD the Meta insight mappers** (engagement = likes+comments, `avgEngagementRate`, 0-follower guard, `.slice(0,20)`) + `formatNumber` (억/만). Graceful: missing Meta token → 501 `{ connected:false }`; missing YouTube key → 502.

**Files:**
- Modify: `packages/server/src/services/mkt/external/meta-graph.ts`
- Modify: `packages/server/src/services/mkt/external/youtube-data.ts`
- Modify: `packages/server/src/services/mkt/analytics.service.ts`
- Modify: `packages/server/src/controllers/mkt/analytics.controller.ts`
- Test: `packages/server/src/services/mkt/__tests__/meta-mappers.test.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (test — Meta mappers + formatNumber, TDD):** Failing tests (spec §8 4b / §10). Stub Graph JSON → assert:
  - `mapInstagramInsights(data)`: `overview.followers = data.followers_count||0`, `postsCount = data.media_count||0`; `contents = (data.media?.data||[]).slice(0,20)` each with `engagement = (like_count||0)+(comments_count||0)`, `likes`/`comments` mapped, `reach/impressions/shares/saves = 0`, `type = media_type`, `title = (caption||'').substring(0,60)`; `overview.totalEngagement = Σengagement`; `overview.avgEngagementRate = followers>0 ? round1(totalEng/(count||1)/followers*100) : 0` (0-follower guard). (Faithful to `meta-analytics-dashboard.tsx:109‑136`.)
  - `mapFacebookInsights(data)`: `followers = fan_count||0`; per-post `engagement = (likes.summary.total_count||0)+(comments.summary.total_count||0)`, `shares = shares.count||0`, `type='POST'`; same avg-rate math (`:143‑167`).
  - `formatNumber(n)` (억/만/raw) table — `123_000_000 → '1.2억'`, `45_000 → '4.5만'`, `999 → '999'` (faithful to the YT panel formatter).
  ```ts
  import { describe, it, expect } from 'vitest';
  import { mapInstagramInsights, formatNumber } from '../analytics.service.js';
  it('maps IG insights with engagement = likes+comments and a 0-follower guard', () => {
    const out = mapInstagramInsights({ followers_count: 0, media_count: 2,
      media: { data: [{ id: '1', caption: 'hi', media_type: 'IMAGE', like_count: 10, comments_count: 5 }] } });
    expect(out.contents[0].engagement).toBe(15);
    expect(out.overview.avgEngagementRate).toBe(0); // followers=0 → no divide
    expect(out.overview.totalEngagement).toBe(15);
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test meta-mappers` → **FAIL**.
- [ ] **Step 3 (impl `meta-graph.ts`):** Keep the existing `MetaAdInsight`/`getAdInsights`/`exchangeToken` stubs but **wire `getAdInsights`** as a thin available-but-unused helper (GET `/act_{id}/insights?level=&date_preset=` → map; mirror Phase-3's "ported but un-wired meta-publish"). Add the **live** path used by the endpoint:
  - `const GRAPH = 'https://graph.facebook.com/v21.0';`
  - `export async function getPageMediaInsights(page, platform): Promise<{ raw: unknown }>` — for `'instagram'` (needs `page.instagram?.id`): GET `${GRAPH}/${ig_id}?fields=followers_count,media_count,media{id,caption,media_type,permalink,timestamp,like_count,comments_count,media_url}&access_token=${page.pageAccessToken}` → return raw json. For `'facebook'`: GET `${GRAPH}/${page.id}?fields=fan_count,posts{id,message,created_time,shares,likes.summary(true),comments.summary(true)}&access_token=…` → raw json. (Pure mapping lives in `analytics.service.ts` mappers.)
  - `export function mapInstagramInsights(data)` / `mapFacebookInsights(data)` — **put these in `analytics.service.ts`** (so the test imports them there and the service composes fetch→map). Either file is fine; spec lists them as the live mappers — keep them in `analytics.service.ts` next to `getMetaInsights`.
- [ ] **Step 4 (impl `youtube-data.ts`):** Wire `getChannelInfo(channelId)` (currently 501): GET `${YT_BASE}/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}` → return the **raw Google JSON** (the controller returns it under `data`; the client digs into `items[0]`). Add `searchChannels(query)` → GET `${YT_BASE}/search?part=snippet&q=${enc(query)}&type=channel&maxResults=1&key=` (raw) and `getChannelVideos(channelId, maxResults=20)` → GET `${YT_BASE}/search?part=snippet&channelId=${channelId}&order=date&maxResults=${n}&type=video&key=` (raw). All guard `if (!apiKey) throw new AppError(502, 'YouTube Data API 키가 설정되지 않았습니다.')`. (Faithful to CF `youtube-channel/route.ts` action URLs — verified.)
- [ ] **Step 5 (impl `analytics.service.ts` additions):**
  - `resolveMetaCredentials(projectId): Promise<{ pages: MetaPage[] }>` — same pattern as `resolveGa4Config` but reads `meta_credentials` from the row (no env fallback — Meta is per-project only); throw `AppError(501, 'Meta 연동이 필요합니다. 설정 > 채널연동에서 연결하세요.')` when absent/empty. (R-6: needs the service-role admin client; dev without it → 501.)
  - `getMetaInsights(projectId, platform, country?)`: resolve creds → `page = pages[0]`; `platform==='instagram' && page.instagram?.id` → `getPageMediaInsights(page,'instagram')` → `mapInstagramInsights(raw)`; `'facebook'` → `mapFacebookInsights`; `'threads'` → `{ connected:true, overview: DEFAULT_META, contents: [] }` (Threads has no insights API — faithful). Return `{ connected:true, overview, contents }`. (On the 501 from `resolveMetaCredentials`, the controller surfaces 501 → the client renders the "연결 필요" empty state.)
  - `getYoutubeChannel(action, params)`: dispatch the 4 actions → `searchChannels`/`getChannelInfo`/`getChannelVideos`/`getVideoStats` → return the **raw Google JSON** under `data` (so the client's `analyzeYoutubeChannel` parsing ports verbatim — `items[].id.channelId`, `statistics.subscriberCount`, etc.).
  - `mapInstagramInsights`/`mapFacebookInsights`/`formatNumber` (exported, tested).
- [ ] **Step 6 (impl `analytics.controller.ts` additions):**
  ```ts
  export const metaInsights = asyncHandler(async (req, res) => {
    const { projectId, platform, country } = req.body as { projectId?: string; platform?: string; country?: string };
    if (!projectId || !platform) throw new AppError(400, 'projectId and platform are required');
    const data = await getMetaInsights(projectId, platform, country);
    res.json({ success: true, data });
  });
  export const youtubeChannel = asyncHandler(async (req, res) => {
    const { action, params } = req.body as { action?: string; params?: Record<string, unknown> };
    if (!action) throw new AppError(400, 'action is required');
    const data = await getYoutubeChannel(action, params ?? {});
    res.json({ success: true, data });
  });
  ```
  > **Note:** the `metaInsights` 501 from `resolveMetaCredentials` propagates as an `AppError(501)` → errorMiddleware returns `{ success:false, error }` with status 501; the client hook treats 501 as "not connected" and renders the empty state (it does NOT throw a red error). Make the client hook (Chunk 9) map a 501 response to `{ connected:false }` rather than an error.
- [ ] **Step 7 (routes):** In `mkt.routes.ts`, add under the Analytics section:
  ```ts
  router.post('/analytics/meta-insights', metaInsights);
  router.post('/analytics/youtube-channel', youtubeChannel);
  ```
- [ ] **Step 8 (run + typecheck):** `pnpm --filter @tangobook/server test meta-mappers` → **PASS**. `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 9:** Commit:
  ```bash
  git add packages/server/src/services/mkt/external/meta-graph.ts packages/server/src/services/mkt/external/youtube-data.ts packages/server/src/services/mkt/analytics.service.ts packages/server/src/controllers/mkt/analytics.controller.ts packages/server/src/services/mkt/__tests__/meta-mappers.test.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing): wire Meta page/media insights + YouTube channel info + meta/youtube routes (mappers + formatNumber tested)"
  ```

---

## Chunk 9: `use-analytics` meta/yt hooks + `MetaAnalyticsDashboard` + panels + page + route swap (320)

> 4b client: add `useMetaInsights`/`useYoutubeChannel` to `use-analytics.ts`, port the big `MetaAnalyticsDashboard` (709 LOC — 5 platform tabs) + extract `YoutubeChannelPanel` + `WebsiteSeoPanel`, the page guard, and the **route swap at line 320**. Port-task pattern with manual-verify.

**Files:**
- Modify: `packages/client/src/features/marketing/api/use-analytics.ts`
- Create: `packages/client/src/features/marketing/components/analytics/MetaAnalyticsDashboard.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/YoutubeChannelPanel.tsx`
- Create: `packages/client/src/features/marketing/components/analytics/WebsiteSeoPanel.tsx`
- Create: `packages/client/src/features/marketing/pages/MetaAnalyticsPage.tsx`
- Modify: `packages/client/src/features/marketing/index.ts`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1 (hooks):** In `use-analytics.ts` add:
  - `useMetaInsights(projectId, platform, country, enabled?)` → `useQuery({ queryKey: mktKeys.metaInsights(projectId, platform, country), enabled: enabled ?? (!!projectId && !!platform), queryFn })` where `queryFn` POSTs `/analytics/meta-insights` and, on a **501 response, resolves to `{ connected:false, overview: DEFAULT, contents: [] }`** (not an error) so the empty state renders; other non-2xx throw. → `MetaInsightsResult`.
  - `useYoutubeChannel()` → `useMutation((input: string) => …)` that **orchestrates the 4 actions** (the CF `analyzeYoutubeChannel` flow `:187‑267`): extract `@handle`/`channel/UC…` from a URL or use the raw input → `searchChannel` → `getChannel` → `getVideos` → `getVideoStats`, assembling `{ channel: YoutubeChannelStat, videos: [...] }`. Each step POSTs `/analytics/youtube-channel` `{ action, params }`. Keep the parsing verbatim (raw Google JSON).
- [ ] **Step 2 (`YoutubeChannelPanel.tsx`, extracted from meta-analytics, spec §6.2):** URL/name input → `useYoutubeChannel().mutate(input)` → channel card (thumbnail/title/desc) + 4 stat cards (subscribers/views/videos/avgViews via `formatNumber`) + recent-videos list. Props `{ }` (self-contained) or `{ projectId }` if needed. `formatNumber` (억/만) — import from a client util or inline (matches the server one).
- [ ] **Step 3 (`WebsiteSeoPanel.tsx`, extracted, spec §6.2):** URL input → `useSeoAudit().mutate(url)` (the Chunk-5 hook, shared with `SeoDashboard`) → 4 score cards + issues list. Props `{ }`.
- [ ] **Step 4 (`MetaAnalyticsDashboard.tsx`, port of `meta-analytics-dashboard.tsx`, spec §6.2):** Props `{ projectId: string }`. Platform tabs IG/FB/Threads/YT/Website + (for Meta platforms) country tabs filtered to `project.target_languages` + a period select (7/30/90 — display-only, faithful).
  - **IG/FB/Threads:** `useMetaInsights(projectId, platform, country)` → `{ connected, overview, contents }`. `!connected` → "Meta 계정을 연결해 주세요 — 설정 → 채널연동" empty state (CF `:568`). Else: 4 overview metric cards + per-post 성과 table + 최고성과/성장트렌드 panels (all mapping math is now server-side — the component just renders).
  - **YouTube tab** → `<YoutubeChannelPanel/>`. **Website tab** → `<WebsiteSeoPanel/>`.
  - **R-9 / spec §6.2 DELTA:** CF hardcodes "연세새봄의원" at `:550` — **replace with `project.brand_name || project.name`** (do NOT ship a customer name).
- [ ] **Step 5 (`MetaAnalyticsPage.tsx`):** Guard like `SiteAnalysisPage` → `<MetaAnalyticsDashboard projectId={selectedProjectId}/>`.
- [ ] **Step 6 (barrel + route swap):** `index.ts` export `MetaAnalyticsPage`; `router/index.tsx` add the import + **replace line 320** `{ path: 'meta-analytics', element: <PlaceholderPage title="채널 분석" /> },` → `{ path: 'meta-analytics', element: <MetaAnalyticsPage /> },`. Leave 321 (`competitors`) as placeholder (Chunk 11).
- [ ] **Step 7 (typecheck + build):** `pnpm --filter @tangobook/client typecheck` → PASS. `pnpm --filter @tangobook/client build` → PASS. Grep the new files: no `@/components/ui/*`, no `'use client'`, no hardcoded customer name (`grep -rn "연세새봄" components/analytics` → 0).
- [ ] **Step 8 (manual-verify):** `/marketing` → project → sidebar **채널 분석**. IG/FB/Threads tabs without `meta_credentials` → "Meta 계정을 연결해 주세요" (no crash). YouTube tab: paste a channel URL → channel card + stats render (needs `YOUTUBE_DATA_API_KEY` — else 502 banner). Website tab: audit a URL → scores+issues. (Live Meta insights need a real page token → Chunk 12 operator checklist.)
- [ ] **Step 9:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-analytics.ts packages/client/src/features/marketing/components/analytics/MetaAnalyticsDashboard.tsx packages/client/src/features/marketing/components/analytics/YoutubeChannelPanel.tsx packages/client/src/features/marketing/components/analytics/WebsiteSeoPanel.tsx packages/client/src/features/marketing/pages/MetaAnalyticsPage.tsx packages/client/src/features/marketing/index.ts packages/client/src/router/index.tsx
  git commit -m "feat(marketing): wire /marketing/meta-analytics -> MetaAnalyticsDashboard (5 platform tabs) + YT/Website panels"
  ```

---

## Chunk 10: Competitors service + 3 routes — `parseCompetitorJson` — TDD

> 4c backend: `competitors.service.ts` + `competitors.controller.ts` + 3 routes (gap-analysis / keyword-rankings / suggest), all via `generateTextWithGemini` (NOT raw `GoogleGenAI`) + a **pure `parseCompetitorJson`** extractor. **TDD `parseCompetitorJson`** (noisy text → `{...}`, fallback shapes) + the rank-badge color thresholds + keyword-seed selection helpers. Optional faithful-plus: enrich keyword-rankings with real DataForSEO `volume` (degrade silently). Graceful: missing Gemini key → 502.

**Files:**
- Create: `packages/server/src/services/mkt/competitors.service.ts`
- Create: `packages/server/src/controllers/mkt/competitors.controller.ts`
- Test: `packages/server/src/services/mkt/__tests__/competitors.service.test.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (test — parser + helpers, TDD):** Failing tests (spec §8 4c / §10):
  - `parseCompetitorJson<T>(text, fallback)` — extracts `/\{[\s\S]*\}/` then `JSON.parse`; given noisy text `'blah ```json {"gaps":[]} ``` end'` → `{gaps:[]}`; given garbage → the passed `fallback` (`{gaps:[],strengths:[]}` / `{rankings:[]}` / `{competitors:[]}`). Faithful to CF's `jsonMatch ? JSON.parse : fallback`.
  - `rankBadgeTier(rank)` (pure helper for the client too, but unit it here or in the client chunk) → `'top'` (≤3) / `'good'` (≤10) / `'ok'` (≤30) / `'low'` (else/null). (Lock the thresholds.)
  - `selectRankingKeywords(strategy, industry)` → `strategy?.keywords?.slice(0,10).map(k=>k.keyword)` else an industry-derived default list (CF `competitors-dashboard.tsx:82‑88`). Assert slice(0,10) + fallback.
  ```ts
  import { describe, it, expect } from 'vitest';
  import { parseCompetitorJson } from '../competitors.service.js';
  it('extracts JSON from noisy Gemini text and falls back on garbage', () => {
    expect(parseCompetitorJson('pre {"gaps":[{"topic":"x"}],"strengths":[]} post', { gaps: [], strengths: [] }))
      .toEqual({ gaps: [{ topic: 'x' }], strengths: [] });
    expect(parseCompetitorJson('no json here', { rankings: [] })).toEqual({ rankings: [] });
  });
  ```
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/server test competitors.service` → **FAIL**.
- [ ] **Step 3 (impl `competitors.service.ts`):**
  - `export function parseCompetitorJson<T>(text: string, fallback: T): T` (pure).
  - `gapAnalysis({ projectUrl, competitorUrls, keywords?, industry? })` → CF gap prompt (verbatim from `gap-analysis/route.ts:8‑23`) → `generateTextWithGemini(prompt, 3, config.gemini.textModel)` → `parseCompetitorJson(text, { gaps: [], strengths: [] })`. Guard `!config.gemini.apiKey` → `AppError(502, 'Gemini API 키가 설정되지 않았습니다.')`; guard `!projectUrl || !competitorUrls?.length` → `AppError(400)`.
  - `keywordRankings({ projectUrl, competitorUrls, keywords })` → CF rank-estimation prompt (`keyword-rankings/route.ts:8‑29`) → `parseCompetitorJson(text, { rankings: [] })`. **Optional faithful-plus:** if `config.dataforseo.login` set, `getKeywordVolumes(keywords)` → attach `volume` per ranking keyword (display column); wrap in try/catch (degrade silently). Guard `!keywords?.length` → `AppError(400)`.
  - `suggestCompetitors({ industry, services, targetCustomer?, usp? })` → CF Korean suggest prompt (`suggest-competitors/route.ts:23‑44`, model `DEFAULT_STRATEGY_MODEL` → our `config.gemini.textModel`) → `parseCompetitorJson(text, { competitors: [] })`. Guard `!industry && !services` → `AppError(400, '업종 또는 서비스 정보를 입력해 주세요.')`.
- [ ] **Step 4 (impl `competitors.controller.ts`):** 3 `asyncHandler` controllers parsing the bodies + `res.json({ success: true, data })` (mirror ideas.controller).
- [ ] **Step 5 (routes):** In `mkt.routes.ts`, add a `// ── Competitor endpoints ──` section:
  ```ts
  router.post('/competitors/gap-analysis', gapAnalysis);
  router.post('/competitors/keyword-rankings', keywordRankings);
  router.post('/competitors/suggest', suggestCompetitors);
  ```
  > **SCOPED OUT (do NOT add):** the CF SERP tab route `/monitoring/search/google-blog` (Google-HTML scrape, brittle — Phase 5 monitoring). Confirm in Chunk 12.
- [ ] **Step 6 (run + typecheck):** `pnpm --filter @tangobook/server test competitors.service` → **PASS**. `pnpm --filter @tangobook/server typecheck` → PASS.
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/server/src/services/mkt/competitors.service.ts packages/server/src/controllers/mkt/competitors.controller.ts packages/server/src/services/mkt/__tests__/competitors.service.test.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing): competitors service (gap/rankings/suggest via Gemini + parseCompetitorJson) + 3 routes + tests"
  ```

---

## Chunk 11: `use-competitors` hooks + `CompetitorsDashboard` (2 tabs) + page + route swap (321)

> 4c client: the 3 transient mutations + the 2-tab dashboard (SERP dropped → Phase 5) + the page guard + the **route swap at line 321**. Port-task pattern with manual-verify.

**Files:**
- Create: `packages/client/src/features/marketing/api/use-competitors.ts`
- Create: `packages/client/src/features/marketing/components/competitors/CompetitorsDashboard.tsx`
- Create: `packages/client/src/features/marketing/pages/CompetitorsPage.tsx`
- Test: `packages/client/src/features/marketing/api/__tests__/use-competitors.test.ts`
- Modify: `packages/client/src/features/marketing/index.ts`
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1 (test — mutation unwrap, light):** Failing test (mocked `fetch`) that `useGapAnalysis().mutateAsync({...})` POSTs `/competitors/gap-analysis` and unwraps `{ success, data }` → returns `{ gaps, strengths }`; and the result is **transient** (returned to caller, not cached). (Minimal — value is the unwrap contract.)
- [ ] **Step 2 (run):** `pnpm --filter @tangobook/client test use-competitors` → **FAIL**.
- [ ] **Step 3 (impl `use-competitors.ts`):** Reuse the `postMkt` helper (export it from `use-analytics.ts` or duplicate a small one). 3 mutations:
  - `useGapAnalysis()` → `useMutation((args: { projectUrl; competitorUrls; keywords?; industry? }) => postMkt('/competitors/gap-analysis', args))` → `{ gaps: CompetitorGapItem[]; strengths: CompetitorStrengthItem[] }`.
  - `useKeywordRankings()` → `useMutation((args: { projectUrl; competitorUrls; keywords }) => postMkt('/competitors/keyword-rankings', args))` → `{ rankings: CompetitorRankingItem[] }`.
  - `useSuggestCompetitors()` → `useMutation((args: { industry; services; targetCustomer?; usp? }) => postMkt('/competitors/suggest', args))` → `{ competitors: SuggestedCompetitor[] }`.
- [ ] **Step 4 (`CompetitorsDashboard.tsx`, port of `competitors-dashboard.tsx`, spec §6.3):** Props `{ projectId: string }`. `useProject(projectId)`. `<MarketingLanguageTabs/>` + **2 tabs** (콘텐츠 갭 / 키워드 순위) — **SERP 분석 tab dropped** (O-6; add a small note "SERP 분석은 Phase 5 모니터링에서 제공됩니다" if CF rendered a 3rd tab header).
  - **콘텐츠 갭:** project URL (default `funnel_config.websiteUrl`) + competitor-URL chips + "갭 분석 실행" → `useGapAnalysis().mutate(...)` → gaps/strengths lists. **Plus** a "🤖 경쟁사 추천" button → `useSuggestCompetitors().mutate({ industry: project.industry, services: ..., usp: ... })` → fill the competitor chips (faithful-plus, §3.2).
  - **키워드 순위:** "순위 분석" → keyword seeds from `project.imported_strategy?.keywords?.slice(0,10)` (falls back to industry-derived defaults, CF `:82‑88`) → `useKeywordRankings().mutate(...)` → ranking table (우리 + up to 3 competitor columns, rank-badge color by `rankBadgeTier`) + the optional `volume` column when present + "* AI 추정 순위" disclaimer (CF `:267`).
- [ ] **Step 5 (`CompetitorsPage.tsx`):** Guard like the others → `<CompetitorsDashboard projectId={selectedProjectId}/>`.
- [ ] **Step 6 (barrel + route swap):** `index.ts` export `CompetitorsPage`; `router/index.tsx` add the import + **replace line 321** `{ path: 'competitors', element: <PlaceholderPage title="경쟁사" /> },` → `{ path: 'competitors', element: <CompetitorsPage /> },`. (All 3 analytics placeholders now swapped; `monitoring`/`strategy`/`ads` remain PlaceholderPage — Phase 5.)
- [ ] **Step 7 (typecheck + build):** `pnpm --filter @tangobook/client test use-competitors` → PASS. `pnpm --filter @tangobook/client typecheck` → PASS. `pnpm --filter @tangobook/client build` → PASS. Grep: no `@/components/ui/*`, no `'use client'`.
- [ ] **Step 8 (manual-verify):** `/marketing` → project → sidebar **경쟁사**. 2 tabs render (no SERP tab). 갭 분석 + 경쟁사 추천 + 키워드 순위 each trigger a mutation (need Gemini key — else 502 banner). Ranking table shows AI-estimated ranks + (if DataForSEO set) a volume column + the disclaimer.
- [ ] **Step 9:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-competitors.ts packages/client/src/features/marketing/components/competitors/CompetitorsDashboard.tsx packages/client/src/features/marketing/pages/CompetitorsPage.tsx packages/client/src/features/marketing/api/__tests__/use-competitors.test.ts packages/client/src/features/marketing/index.ts packages/client/src/router/index.tsx
  git commit -m "feat(marketing): wire /marketing/competitors -> CompetitorsDashboard (gap + keyword-rankings tabs, SERP dropped) + hooks"
  ```

---

## Chunk 12: Final integration — full gates + scope greps + docs + operator checklist

> @superpowers:verification-before-completion — run every gate, confirm output before any "done" claim. No DB migration this phase (NO SQL). Live-creds E2E (real GA4 service account / Meta token / Gemini) is **deferred** as an operator checklist (no creds in CI — same policy as Phase 1–3). Memory update is the "업데이트 하자" workflow — **out of this plan** (do separately).

**Files:** docs only (CLAUDE.md × 2 + spec status).

### Task 12.1: Settings verification (Decision #5 — no work)
- [ ] **Step 1:** Confirm `FunnelAnalyticsSection` edits `ga4_config` + `funnel_config` → `onUpdate` → `useUpdateProject` (verified at plan time: `sections/FunnelAnalyticsSection.tsx:5/24‑31/59`; tab "퍼널·분석" in `ProjectSettings.tsx`). Confirm the server resolvers read the **same shapes** the section writes — `resolveGa4Config` reads `propertyId/clientEmail/privateKey`; `resolveMetaCredentials` reads `pages[]` (written by `ChannelConnectionsSection`). No code change.

### Task 12.2: Automated gates
- [ ] **Step 1 (unit tests):**
  - `pnpm --filter @tangobook/server test mkt` → green incl. the **new** `ga4-assertion` + `analytics-mappers` + `meta-mappers` + `seo.service` + `competitors.service` (≥ 4 new server mkt test files on top of the existing 8). Record exact file/test counts.
  - `pnpm --filter @tangobook/client test marketing` → green incl. the **new** `use-analytics` + `use-competitors` on top of the existing 57-file suite. Record exact counts.
  - **Assert growth** vs the Phase-3 baseline (388 client / 47 server) — both totals must strictly increase.
- [ ] **Step 2 (typecheck):** `pnpm typecheck` (shared/server/client) → **PASS**.
- [ ] **Step 3 (lint):** `pnpm lint` → no **new** errors from Phase-4 code. Confirm: no leftover `'use client'` / Next `<img>` disables in the new components; **no `VITE_`-prefixed reference to any GA4/Meta secret anywhere**; **no client import of `supabase-admin.provider`**; no hardcoded customer name. Pre-existing remotion TS-parse errors + the unrelated test failures unchanged.
- [ ] **Step 4 (build):** `pnpm --filter @tangobook/client build` → **PASS**. Note whether recharts introduced a new large-chunk warning (R-4 — acceptable; mitigation = lazy-load the GA4 tab if needed).
- [ ] **Step 5 (scope confirmation — static greps):**
  - `router/index.tsx`: lines 319/320/321 → `<SiteAnalysisPage/>` / `<MetaAnalyticsPage/>` / `<CompetitorsPage/>`; **`monitoring`/`strategy`/`ads` still `PlaceholderPage`** (Phase 5 OUT).
  - `grep -rn "analytics/overview\|analytics/traffic\|analytics/top-pages\|analytics/country-traffic\|analytics/content-performance\|analytics/meta-insights\|analytics/youtube-channel\|competitors/gap-analysis\|competitors/keyword-rankings\|competitors/suggest\|seo/audit\|seo/crawl\|seo/schema-generate" packages/server/src/routes/mkt.routes.ts` → **13 routes** present.
  - `grep -rn "seo/keywords\|seo/readability\|monitoring/search\|google-blog" packages/server/src packages/client/src/features/marketing` → **0** (SEO-keywords/readability + SERP scoped OUT).
  - `grep -rn "google-auth-library\|@google-analytics/data" packages/server` → **0** (GA4 via node:crypto only).
  - `grep -rn "ga4_config\|privateKey\|pageAccessToken\|meta_credentials" packages/client/src` → only **presence-boolean** reads (`!!project.ga4_config?.propertyId`, `!!project.meta_credentials`) — **no secret value sent in any body** (R-1). The client `postMkt` bodies carry only `{ projectId, period, platform, country, url, content, schemaType, projectUrl, competitorUrls, keywords, industry, services }` — never a key/token.
  - `grep -rn "createSign\|RSA-SHA256\|buildServiceAccountAssertion" packages/server/src/services/mkt/external/ga4.ts` → present (JWT signing wired).
- [ ] **Step 6:** No commit (verification only).

### Task 12.3: Manual E2E (deferred — operator checklist) + docs
- [ ] **Step 1 (manual E2E — needs real creds; DEFERRED per prior phases):** Document this checklist for the operator (do NOT block "done" on it):
  1. In 설정 → 퍼널·분석, set GA4 propertyId + service-account clientEmail + privateKey (and ensure `SUPABASE_SERVICE_ROLE_KEY` is set so the server can read the row; else set `GA4_PROPERTY_ID/GA4_CLIENT_EMAIL/GA4_PRIVATE_KEY` env as the single-property fallback). Open 사이트 분석 → GA4 트래픽 → toggle 7d/30d → overview cards + daily pageviews chart + traffic bar chart + top-pages + country + content render (live JWT round-trip).
  2. SEO 분석: audit a live URL → 4 score gauges + issues; content tab lists blog SEO; geo tab crawls + GEO write-up (Gemini); schema generates JSON-LD.
  3. 채널 분석: with a real Meta page token in `meta_credentials` (설정 → 채널연동), IG/FB tabs show followers + per-post engagement; Threads empty (faithful); YouTube channel analyze (real `YOUTUBE_DATA_API_KEY`); Website audit.
  4. 경쟁사: gap-analysis + 경쟁사 추천 + keyword-rankings with live Gemini; DataForSEO volume column if creds set.
  5. Graceful: unset GA4/Meta/Gemini → each dashboard shows its "연결 필요"/502 empty state, no crash.
- [ ] **Step 2 (docs):** Update:
  - `packages/client/src/features/marketing/CLAUDE.md` — add an **분석 (analytics) module** section: the `components/analytics/*` + `components/competitors/*` tree, the `use-analytics`/`use-competitors` hooks (+ the 7 analytics `mktKeys`; competitor/SEO = transient mutations), the new `/api/mkt/{analytics,competitors,seo}/*` rows in the route table, the `recharts` dep; an **analytics Gotchas** subsection noting: (i) **server-proxy data layer** (client sends only `projectId`+params; per-project creds read server-side via `getSupabaseAdmin()` → env fallback — opposite of Phase 3's supabase-direct); (ii) **GA4 = service-account JWT (RS256 via node:crypto) → REST**, NO SDK, access-token cached ~55min, PEM-newline + clock-skew gotcha (R-3); (iii) **R-1 secrets** — GA4 privateKey + Meta token never on the wire / never `VITE_` / never echoed; (iv) recharts pinned `^2.15.x` (React-18) + only 2 components import it + large-chunk note (R-4); (v) Meta reach/impressions always 0 (faithful — no Insights edge), Threads empty (no API), R-9 customer-name replaced with `brand_name||name`; (vi) SEO-keywords/readability + competitors SERP **scoped OUT** (Phase 5); (vii) the `MarketingLanguageTabs` lang is display-only in these dashboards (GA4 has no per-translation segment).
  - root `CLAUDE.md` + worktree `CLAUDE.md` `/marketing` line — Phase 4 분석 done; remaining 5(전략) + monitoring/ads.
  - spec `docs/superpowers/specs/2026-06-09-marketing-phase4-analytics-design.md` status → **COMPLETE** (or add an "implemented by …plans/2026-06-09-marketing-phase4-analytics.md" note).
  Commit:
  ```bash
  git add packages/client/src/features/marketing/CLAUDE.md CLAUDE.md docs/superpowers/specs/2026-06-09-marketing-phase4-analytics-design.md
  git commit -m "docs(marketing): Phase 4 analytics — CLAUDE.md analytics module + GA4-JWT/server-proxy gotchas + status"
  ```
  (Memory `marketing-port-contentflow-2026-06-07.md` lives outside the repo — update via the "업데이트 하자" workflow, NOT in this commit.)
- [ ] **Step 3 (finish):** @superpowers:finishing-a-development-branch — present merge/PR/cleanup options.

---

## Appendix A — Resolved decisions & deltas (spec §1–§4, §9 + task brief)

- **Server-proxy, NOT supabase-direct (the headline delta vs Phase 3):** analytics flows client → Express `/api/mkt/{analytics,competitors,seo}/*` → external API. The client sends only `{ projectId, period? }`; the server reads `ga4_config`/`meta_credentials` from `mkt_projects` via `getSupabaseAdmin()` (Phase 3) because GA4 private key + Meta page token are server-only secrets. GA4 reads cache in TanStack (`staleTime ~5min`); competitor/SEO results are transient mutations (Phase-2 ideas posture).
- **NO migration, NO new settings UI:** all 6 JSONB columns exist (`schema.sql:57‑67`); `FunnelAnalyticsSection` (ga4_config+funnel_config) + `ChannelConnectionsSection` (meta_credentials) are built+wired. Decision #5 = DONE (verify-only).
- **GA4 = service-account JWT via node:crypto → REST (no SDK):** `buildServiceAccountAssertion` (RS256, pure, TDD'd) → token exchange (cached ~55min) → `runReport(cfg, body)` at `analyticsdata.googleapis.com/v1beta`. The old `runReport(dateRanges,dimensions,metrics)` signature becomes `(cfg, reportBody)`. NO `@google-analytics/data`, NO `google-auth-library` (neither is a dep). The 6 report `reportBody` shapes are faithful to CF's SDK calls (verified: overview 2-call summary+daily, traffic `sessionDefaultChannelGroup` limit 10, top-pages `pagePath,pageTitle` limit 15, country `country` limit 10, content `pagePath` limit 15). Row mappers are pure (REST row shape = SDK row shape `{value}`).
- **Per-project config, env fallback:** `resolveGa4Config` row→`config.ga4`→501; `resolveMetaCredentials` row→501 (Meta is per-project only, no env). Both re-un-escape literal `\n` in the private key. (R-6: per-project Meta needs the service-role key; dev without it → 501.)
- **Gemini via `generateTextWithGemini` (NOT raw `GoogleGenAI`):** competitors + schema-generate use the retry/fallback wrapper at `config.gemini.textModel`; `parseCompetitorJson` (pure) mirrors CF's `/\{[\s\S]*\}/` extract + per-shape fallback.
- **recharts `^2.15.x` (React-18), only 2 components:** `PageviewsChart` (LineChart) + `TrafficChart` (vertical BarChart). CF's `^3.8.0` was React-19-era — rejected (R-4). Color `#0F6E56`.
- **Scoped OUT (do NOT port):** SEO `keywords`+`readability` routes (not called by any Phase-4 dashboard); competitors **SERP 분석** tab (`/monitoring/search/google-blog` = monitoring → Phase 5; dashboard drops to 2 tabs). site-analysis = exactly 2 sub-tabs (GA4 + SEO).
- **Faithful-plus (small, in scope):** wire country-traffic + content-performance (CF renders them with `[]` — here they populate, render code + types already exist); competitor keyword-rankings optionally enriched with real DataForSEO `volume` (degrade silently); "🤖 경쟁사 추천" one-click on the gap tab (`/competitors/suggest`).
- **R-9 delta:** CF hardcodes "연세새봄의원" (`meta-analytics-dashboard.tsx:550`) → replace with `project.brand_name || project.name`. R-1 (HIGH): secrets server-read only, never on the wire / never `VITE_` / never echoed — the CF client-side Graph-token-in-URL smell is deliberately closed by proxying through Express.

## Appendix B — Reused pieces (no change unless noted)

| Piece | File | Used by |
|---|---|---|
| `getSupabaseAdmin()` (service-role singleton) | `providers/supabase-admin.provider.ts` (Phase 3) | `resolveGa4Config`/`resolveMetaCredentials` (server-side per-project creds read) |
| `config.ga4.{propertyId,clientEmail,privateKey}` (with `\\n`→`\n`) | `config/index.ts:53‑57` | GA4 env fallback |
| `config.meta` / `config.youtubeApiKey` / `config.dataforseo` / `config.gemini` | `config/index.ts:59‑69` | Meta/YT/DataForSEO/Gemini |
| `generateTextWithGemini(prompt, retries, model)` (retry+fallback) | `providers/gemini.provider.ts:157` | competitors + schema-generate |
| `getKeywordVolumes(keywords)` (DataForSEO) | `services/mkt/external/dataforseo.ts` | optional keyword-rankings `volume` column |
| `searchVideos`/`getVideoStats` (wired Phase 2) | `services/mkt/external/youtube-data.ts` | youtube-channel `getVideoStats` action |
| `GA4Report`/`GA4ReportRow` interfaces | `services/mkt/external/ga4.ts:21‑31` | runReport return + mappers (widen rows to `{value}`) |
| `asyncHandler` + `AppError` + `{ success, data }` envelope | `middleware/*` | all new controllers (mirror `ideas.controller.ts`) |
| `mkt.routes.ts` route registration pattern | `routes/mkt.routes.ts:23‑44` | 13 new rows |
| `MarketingLanguageTabs` (Phase 2) | `components/ideas/MarketingLanguageTabs.tsx` | language row in all 3 dashboards (display-only) |
| `seo-scorer.ts` `calculateNaverSeoScore` (ported Phase 0/1a) | `lib/seo-scorer.ts` | SeoDashboard content sub-tab (PURE, no endpoint) |
| `use-ai-generation.ts` (SSE) | `hooks/use-ai-generation.ts` | SeoDashboard GEO write-up (no new endpoint) |
| `useProject` / `useUpdateProject` | `api/use-projects.ts` | dashboard reads + presence booleans + settings write |
| blog-content hooks (supabase-direct) | `api/use-blog-contents.ts` | SeoDashboard content sub-tab read |
| `FunnelAnalyticsSection` (built+wired) | `components/project/sections/FunnelAnalyticsSection.tsx` + `ProjectSettings.tsx` | GA4 settings (Decision #5 done) |
| `mktKeys` factory | `api/queries.ts:18` | 7 analytics keys |
| `IdeasPage` guard pattern | `pages/IdeasPage.tsx:4‑13` | the 3 new page guards |
| Sidebar nav (3 analytics items present) | `components/layout/Sidebar.tsx` | nav (no change — route swap makes them live) |
| router placeholders | `router/index.tsx:319/320/321` | swap elements only |

## Appendix C — Cited references (both sides)

**ContentFlow (port source, `C:\projects\contentflow\contentflow`)**
- `src/components/analytics/site-analysis-dashboard.tsx` (2-sub-tab wrapper, mounts AnalyticsDashboard + SeoDashboard; `:5` LanguageTabs, `:7` SeoDashboard import, `:11‑50` tabs) · `analytics-dashboard.tsx` (THE GA4 page: period toggle + 6 panels, empty-state `:33`, `CountryTraffic`/`ContentPerformance` rendered with `[]` `:88‑89`) · `overview-cards.tsx` · `pageviews-chart.tsx` (recharts LineChart) · `traffic-chart.tsx` (recharts vertical BarChart) · `country-traffic.tsx` · `top-pages-table.tsx` · `content-performance.tsx` · `language-tabs.tsx`.
- `src/components/analytics/meta-analytics-dashboard.tsx` (709 LOC; client-side Graph IG `:104` / FB `:138`; IG map `:109‑136` / FB map `:143‑167`; YT analyze `:187‑267`; website audit `:269‑285`; sample customer name `:550`; empty state `:568`).
- `src/components/competitors/competitors-dashboard.tsx` (gap `:63`, keyword-rankings `:77`, SERP `:109` → monitoring/OUT; `imported_strategy` keyword pull `:82‑88`; AI-rank disclaimer `:267`).
- `src/components/seo/{seo-dashboard,score-gauge,audit-form,issues-list}.tsx` (audit/content/geo/schema sub-tabs; content = pure `calculateNaverSeoScore`; geo = crawl + `fetchAiGenerate`).
- `src/hooks/use-analytics.ts` (client GA4 `fetchAll` Promise.all overview/traffic/top-pages `:34‑38`; creds in body `:31`).
- `src/app/api/analytics/{overview,traffic,top-pages,country-traffic,content-performance,youtube-channel}/route.ts` — **read & confirmed**: overview 2-call summary(`sessions,activeUsers,screenPageViews,bounceRate,averageSessionDuration`)+daily(`screenPageViews`/date) `:26‑44`; traffic `sessionDefaultChannelGroup` orderBy sessions desc limit 10 + `percentage` 0-guard `:25‑49`; top-pages `pagePath,pageTitle` limit 15 `:25‑45`; country `country` limit 10 (uses `days`, bare array) ; content `pagePath` limit 15 (uses `days`, bare array); youtube-channel action dispatch searchChannel/getChannel/getVideos/getVideoStats `:10‑20`.
- `src/app/api/competitors/{gap-analysis,keyword-rankings}/route.ts` + `src/app/api/ai/strategy/suggest-competitors/route.ts` — **read & confirmed**: gap prompt `:8‑23` → `{gaps,strengths}` fallback; rank-estimation prompt `:8‑29` → `{rankings}` fallback; suggest Korean prompt `:23‑44` model `DEFAULT_STRATEGY_MODEL` → `{competitors}`. All use `text.match(/\{[\s\S]*\}/)` + fallback.
- `src/app/api/seo/{audit,schema-generate}/route.ts` — **read & confirmed**: audit cheerio scoring (google/naver/geo/tech + issues) `:13‑69`; schema-generate Gemini → `{schema: jsonMatch?.[0] ?? text}`. `src/app/api/seo/{keywords,readability}/route.ts` — **NOT used by analytics → OUT**.
- `src/app/api/monitoring/search/google-blog/route.ts` (SERP scrape — **monitoring, Phase 5 → OUT**).
- `package.json` (`@google-analytics/data ^5.2.1`, `recharts ^3.8.0`, `react 19.2.3` — all replaced/avoided).

**Tangobook (worktree `feat/marketing-phase0`)**
- `docs/superpowers/specs/2026-06-09-marketing-phase4-analytics-design.md` (authoritative spec).
- `docs/superpowers/plans/2026-06-09-marketing-phase3-publish.md` (format/discipline template, COMPLETE).
- `supabase/migrations/2026-06-07-marketing-schema.sql:57‑67` — `funnel_config`/`ga4_config`/`imported_strategy`/`saved_keywords`/`meta_credentials`/`published_site` JSONB **already present** (no migration).
- `packages/client/src/features/marketing/types/analytics.ts` (GA4Config/GA4OverviewData/GA4TrafficSource/GA4TopPage/FunnelConfig/ImportedStrategy exist) · `types/database.ts:164/168/169/198/206/207/209` (`Project.{meta_credentials,industry,brand_name,target_languages,funnel_config,ga4_config,imported_strategy}`).
- `…/components/project/sections/FunnelAnalyticsSection.tsx:5/24‑31/59` + `ProjectSettings.tsx` — GA4 settings **built + wired** (Decision #5 done).
- `…/components/ideas/MarketingLanguageTabs.tsx` — reuse (Phase 2). `…/lib/seo-scorer.ts` — reuse (content sub-tab). `…/hooks/use-ai-generation.ts` — reuse (GEO SSE).
- `…/api/queries.ts:18‑33` — `mktKeys` flat factory (add analytics keys). `…/api/use-projects.ts` — `useProject`/`useUpdateProject`.
- `…/pages/IdeasPage.tsx:4‑13` — guard pattern. `…/router/index.tsx:6‑13` (import block) + `:319/320/321` (3 placeholders to swap; `monitoring`/`strategy`/`ads` stay).
- `packages/server/src/services/mkt/external/ga4.ts:21‑54` — `runReport`/`GA4Report` 501 stub (wire JWT-REST) · `meta-graph.ts:35‑49` — `getAdInsights`/`exchangeToken` 501 stubs (wire insights) · `youtube-data.ts:53‑150` — `searchVideos`/`getVideoStats` wired, `getChannelInfo:148` 501 (wire + add searchChannels/getChannelVideos) · `dataforseo.ts` — `getKeywordVolumes` wired (reuse).
- `packages/server/src/providers/supabase-admin.provider.ts` — `getSupabaseAdmin()` (Phase 3, reuse). `gemini.provider.ts:157` — `generateTextWithGemini` (reuse).
- `packages/server/src/config/index.ts:53‑81` — `ga4`/`meta`/`youtubeApiKey`/`dataforseo`/`supabase`/`cron` (all present; `ga4` has `\\n`→`\n`).
- `packages/server/src/controllers/mkt/ideas.controller.ts` + `services/mkt/ideas.service.ts` (controller/service + Gemini-JSON `extractJson*` + `formatViews` 억/만 pattern to mirror) · `routes/mkt.routes.ts:1‑46` (add 13 rows after `/publish/meta`).
- `packages/client/package.json` — `react@^18.3.0`, `lucide-react@^1.17.0`, `@supabase/supabase-js@^2.104.0` (recharts to ADD); `packages/server/package.json` — `@supabase/supabase-js@^2.104.0` + `@google/genai@^1.41.0` present (cheerio ABSENT — ADD `^1.0.0`).
