# Marketing Phase 4 — 분석 (Analytics Dashboards) — Design Spec

| | |
|---|---|
| **Date** | 2026‑06‑09 |
| **Branch / worktree** | `feat/marketing-phase0` @ `C:\projects\tangobook\.worktrees\marketing-phase0` |
| **Status** | ✅ COMPLETE (implemented + reviewed) |
| **Predecessor** | Phase 0 Foundation + Phase 1a–1d (content) + Phase 2 (keywords/ideas) + Phase 3 (publish) — all COMPLETE & committed. |
| **Source app** | ContentFlow (Next.js) `C:\projects\contentflow\contentflow` |
| **Roadmap slot** | Master‑plan **Phase 4 분석**. Replaces 3 placeholders: `/marketing/site-analysis`, `/marketing/meta-analytics`, `/marketing/competitors`. Strategy/monitoring/ads = Phase 5 (OUT). |
| **Primary CF source** | `src/components/analytics/{analytics-dashboard,site-analysis-dashboard,overview-cards,traffic-chart,pageviews-chart,country-traffic,top-pages-table,content-performance,language-tabs,meta-analytics-dashboard}.tsx`, `src/components/competitors/competitors-dashboard.tsx`, `src/components/seo/{seo-dashboard,score-gauge,audit-form,issues-list}.tsx`, `src/hooks/use-analytics.ts`, `src/app/api/analytics/{overview,traffic,top-pages,country-traffic,content-performance,youtube-channel}/route.ts`, `src/app/api/competitors/{gap-analysis,keyword-rankings}/route.ts`, `src/app/api/ai/strategy/suggest-competitors/route.ts`, `src/app/api/seo/{audit,schema-generate}/route.ts` |

---

## 1. Overview

ContentFlow's **분석** area is three sibling dashboards under the sidebar's `[분석]` group:

| Route | Component | What it shows | External deps |
|---|---|---|---|
| `/site-analysis` | `SiteAnalysisDashboard` (2 sub‑tabs: **GA4 트래픽** + **SEO 분석**) | GA4 traffic (overview cards, daily‑pageviews line chart, traffic‑source bar chart, top‑pages table, country/content panels) + an SEO sub‑dashboard (audit / content‑SEO / GEO / Schema) | **GA4 Data API** + page‑crawl (cheerio) + Gemini |
| `/meta-analytics` | `MetaAnalyticsDashboard` (5 platform tabs: Instagram/Facebook/Threads/YouTube/Website) | Per‑platform social insights (followers/reach/engagement + per‑post table) + a YouTube‑channel analyzer + a website‑SEO mini‑audit | **Meta Graph API**, **YouTube Data API**, page‑crawl |
| `/competitors` | `CompetitorsDashboard` (3 tabs: 콘텐츠 갭 / 키워드 순위 / SERP 분석) | AI content‑gap analysis, AI keyword‑rank estimation, Google SERP scrape | **Gemini**, **DataForSEO** (optional), Google scrape |

Phase 4 is a **faithful port** of these into Tangobook's `/marketing/{site-analysis,meta-analytics,competitors}` routes. The stack adapts as in earlier phases: Next.js → Vite/React‑Router, Zustand `project-store` → `useProject` (TanStack) + `ui-store`, CF `/api/*` → Express `/api/mkt/*`, CF design tokens → `.marketing-scope`, kebab filenames → PascalCase.

### 1.1 CRITICAL data‑layer note — analytics is **server‑proxy**, NOT supabase‑direct

> **This is the single most important architectural fact of Phase 4 and the opposite of Phase 3.**

Phase 1–3 used the **supabase‑direct** model (client TanStack `queryFn` = `supabase.from(...)`), because that data lives in `mkt_*` tables guarded by RLS. **Phase 4 has almost no Supabase reads.** All three dashboards call **external APIs whose credentials are server‑only secrets**:

- **GA4 service‑account private key** (`ga4_config.privateKey`) — must never reach the browser.
- **Meta page access tokens** (`meta_credentials.pages[].pageAccessToken`) — CF calls `graph.facebook.com` **directly from the client** with the token in the URL (`meta-analytics-dashboard.tsx:104`). That is acceptable in CF (operator‑only app, token already in the operator's project row) but is a **secret‑in‑client** smell; Tangobook routes it through Express so the token stays server‑side.
- **DataForSEO basic‑auth**, **Gemini key**, **YouTube Data key** — already server‑only in Tangobook.

So Phase 4 uses the **Phase‑1‑style server‑proxy model**: the client sends only a **`projectId`** (+ params like `period`) to Express `/api/mkt/analytics/*` and `/api/mkt/competitors/*`; **the server reads that project's `ga4_config` / `meta_credentials` from `mkt_projects` via the service‑role admin client** (the `supabase-admin.provider.ts` added in Phase 3), then calls the external API and returns `{ success, data }`. The client wraps these in **TanStack Query hooks** (`use-analytics.ts`, `use-competitors.ts`) hitting the Express endpoints — **not** `supabase.from`.

This means:
- **Per‑project config is read server‑side** (§4.1) — the client does NOT send `ga4_config`/tokens in the body (CF did; Tangobook deliberately does not, to keep secrets off the wire). The browser only ever holds presence booleans (`!!project.ga4_config?.propertyId`, `!!project.meta_credentials`) for empty‑state gating, read from the normal `useProject` cache.
- **Graceful degradation** is per‑external‑service, mirroring Phase 3: GA4/Meta/DataForSEO each degrade to a "연결 필요" empty state when creds are absent (no crash). The wired GA4/Meta/youtube‑channel paths return `501`/empty when `config`/the project row lacks creds.

### 1.2 This phase is cheap on data + settings — Phase 0 already provisioned it

- **NO migration.** `mkt_projects` **already has** `ga4_config jsonb`, `funnel_config jsonb`, `imported_strategy jsonb`, `meta_credentials jsonb`, `published_site jsonb`, `saved_keywords jsonb` (`2026-06-07-marketing-schema.sql:57‑67`) — verified. The `Project` TS type already declares all of them (`types/database.ts:164,199,206,207,209`). **Phase 4 adds zero columns.** (Contrast Phase 3, which had to ALTER `mkt_publish_records`.)
- **GA4 settings UI ALREADY EXISTS AND IS WIRED.** `FunnelAnalyticsSection` (`components/project/sections/FunnelAnalyticsSection.tsx`, tab "퍼널·분석" in `ProjectSettings.tsx:82/121`) edits `funnel_config` + `ga4_config` (propertyId / clientEmail / privateKey, with show/hide on the private key) → `onUpdate({ funnel_config, ga4_config })` → `useUpdateProject`. **Decision #5 is DONE** (Phase 4 only verifies it, §7).
- **`supabase-admin.provider.ts` already exists** (Phase 3) — reuse `getSupabaseAdmin()` to read project rows server‑side. **`@supabase/supabase-js` is already a server dep** (`packages/server/package.json`, added Phase 3) — no add.
- **`@google/genai` is already a server dep** (`packages/server/package.json:"@google/genai"`) + `generateTextWithGemini` provider — reuse for competitor gap/rankings/suggest.
- **`youtube-data.ts` is wired** (Phase 2: `searchVideos`/`getVideoStats`); only `getChannelInfo` is a 501 stub to wire (§4.4).
- **`dataforseo.ts getKeywordVolumes` is wired** (Phase 1a/2) — reuse for optional competitor keyword volume.
- The 3 sidebar nav items + placeholder routes **already exist** (`router/index.tsx:319‑321`) — Phase 4 swaps elements only.

So Phase 4's real work is: **(1)** wire `ga4.ts runReport` via a **service‑account JWT → GA4 Data REST** call (no SDK); **(2)** wire `meta-graph.ts getAdInsights`/insights + the youtube‑channel action‑dispatch; **(3)** ~8 new Express endpoints under `/api/mkt/analytics/*` + `/competitors/*` (controllers + services), all reading per‑project creds server‑side; **(4)** the 3 client dashboards + the 2 Recharts charts; **(5)** the `use-analytics`/`use-competitors` hooks; **(6)** route swaps; **(7)** add `recharts` (React‑18 line) to the client.

---

## 2. CF → Tangobook mapping

| ContentFlow | Tangobook (Phase 4) | Why |
|---|---|---|
| `@google-analytics/data` `BetaAnalyticsDataClient.runReport()` (SDK, in each route) | **`ga4.ts runReport()` via service‑account JWT → REST** `POST https://analyticsdata.googleapis.com/v1beta/properties/{id}:runReport` | Master decision: no SDK dep. The `ga4.ts` stub already plans exactly this (`ga4.ts:6‑9` header). §4.2. |
| GA4 creds in the **request body** (`{propertyId,clientEmail,privateKey,period}`) from the client (`use-analytics.ts:31`) | **client sends only `{ projectId, period }`**; server reads `ga4_config` from `mkt_projects` via `getSupabaseAdmin()` | Secrets stay server‑side (§1.1). |
| Meta Graph called **client‑side** with `pageAccessToken` in the URL (`meta-analytics-dashboard.tsx:104/138`) | **`POST /api/mkt/analytics/meta-insights`** server‑side; server reads `meta_credentials` from the project row, calls Graph | Token must not reach the browser. §4.3. |
| `/api/analytics/youtube-channel` (action‑dispatch: searchChannel/getChannel/getVideos/getVideoStats) | **`POST /api/mkt/analytics/youtube-channel`** — same 4 actions; reuse `youtube-data.ts` (wire `getChannelInfo` + add channel search) | `config.youtubeApiKey` already server‑side. §4.4. |
| Next.js routes returning **raw JSON** (`{ sources }`, `{ pages }`, `{ error }`, bare arrays) | Express **house envelope** `{ success, data }`; `AppError(status,msg)` on failure | Phase 0+ convention. The client hooks unwrap `.data`. |
| `@google/genai` `GoogleGenAI(...).models.generateContent({model:'gemini-2.0-flash'})` in competitor routes | **`generateTextWithGemini(prompt, retries, model)`** (`gemini.provider.ts`) + `parseGeminiJSON`; `model = config.gemini.textModel` (batch‑class) | Tangobook Gemini policy + retry/fallback wrapper. §4.5. |
| `recharts` `^3.8.0` (React 19) | **`recharts` `^2.15.x` (React‑18 line)** — only `TrafficChart` + `PageviewsChart` import it | Client is React `^18.3.0` (verified). Recharts 3 peer‑deps React 18/19, but 2.x is the battle‑tested React‑18 line and avoids the React‑19‑era churn; CF's 3.8.0 was chosen for its React 19. §O‑5 / R‑4. |
| `useProjectStore()` (Zustand holds projects + selectedProjectId) | `useProject(id)` (TanStack) + `ui-store.selectedProjectId` | House rule: Zustand = UI only. |
| `AnalyticsLanguageTabs` (`analytics/language-tabs.tsx`, edits `target_languages` in a dialog) | **`MarketingLanguageTabs`** — **already built** (Phase 2, `components/ideas/MarketingLanguageTabs.tsx`) | Reuse the Phase‑2 thin tabs row (reads `target_languages`, ko‑pinned). CF's analytics one had an inline edit dialog; the Phase‑2 version defers editing to settings (§6.6). |
| `SeoDashboard` sub‑tab inside site‑analysis (`audit`/`content`/`geo`/`schema`) | **`SeoDashboard`** ported (audit + schema endpoints + the **pure** content‑SEO via `seo-scorer.ts` + GEO via crawl+Gemini) | site‑analysis's 2nd sub‑tab; **scoped IN** because `site-analysis-dashboard.tsx:7` imports it. §3.3. |
| CF kebab filenames | **PascalCase** | Tangobook convention. |
| Next `/site-analysis` `page.tsx` (project guard → dashboard) | React‑Router `pages/SiteAnalysisPage.tsx` (project guard → `<SiteAnalysisDashboard projectId/>`) | — |

---

## 3. Scope decisions — what the dashboards ACTUALLY call (and what's scoped OUT)

The brief flagged several SEO/strategy routes as candidates. Resolved by reading each dashboard's `fetch` callsites:

### 3.1 GA4 routes — ALL used by site‑analysis (port all 5 + add country/content)
`overview`, `traffic`, `top-pages` are fetched by `use-analytics.ts:34‑38`. `country-traffic` + `content-performance` routes **exist** but CF's `AnalyticsDashboard` renders `<CountryTraffic data={[]} />` + `<ContentPerformance data={[]} />` with **empty arrays** (`analytics-dashboard.tsx:88‑89`) — i.e. the routes are defined but **not wired** in CF. **Decision:** port `overview`/`traffic`/`top-pages` as the live trio (faithful), and **also** wire `country-traffic` + `content-performance` into the `fetchAll` (a tiny faithful‑plus enhancement so the two panels actually populate — they already have render code + types). Cheap, no new external surface. §4.2.

### 3.2 Competitor data sources
- `gap-analysis` → **Gemini** (content‑gap JSON). Ported. §4.5.
- `keyword-rankings` → **Gemini** (rank *estimation* 1–100, faithful — CF does NOT use DataForSEO here). Ported. **Optional faithful‑plus:** enrich the estimated keywords with **real DataForSEO volume** via the already‑wired `getKeywordVolumes` (display‑only column; degrade silently if no DataForSEO creds). §4.5.
- `suggest-competitors` (`/api/ai/strategy/suggest-competitors`) → **Gemini** (suggest 5–8 competitors from business info). **In scope** — it's the "AI 경쟁사 추천" affordance the competitors dashboard's gap tab benefits from. Ported as `/api/mkt/competitors/suggest`. (CF's `CompetitorsDashboard` doesn't call it inline today, but the brief lists it for this phase and it's a natural one‑click "추천" button on the gap tab — wire a button; faithful‑plus, small.) §4.5 / O‑1.

### 3.3 SEO routes — only `audit` + `schema-generate` are in scope (via the SeoDashboard sub‑tab)
`SeoDashboard` (site‑analysis 2nd sub‑tab) calls exactly:
- `audit` tab → `POST /api/seo/audit` (cheerio page crawl → google/naver/geo/tech scores + issues). **IN.** § 4.6.
- `content` tab → **PURE**, no route: `calculateNaverSeoScore()` (`seo-scorer.ts`, already ported Phase 0/1a) over the project's `mkt_blog_contents`+`mkt_blog_cards`. **IN** (reuses existing lib + supabase reads — the one place site‑analysis touches Supabase). §4.6.
- `geo` tab → `POST /api/ai/strategy/crawl` (page crawl) + `fetchAiGenerate` (Gemini GEO write‑up). **IN** — needs the crawl route ported as `/api/mkt/seo/crawl` (cheerio) + a Gemini SSE/text call. §4.6.
- `schema` tab → `POST /api/seo/schema-generate` (Gemini → JSON‑LD). **IN** as `/api/mkt/seo/schema-generate`. §4.6.

**Scoped OUT (NOT called by any Phase‑4 dashboard):**
- `/api/seo/keywords` + `/api/seo/readability` — **dead for analytics**; they belong to content‑creation/strategy. **OUT** (Phase 5 or never). Confirmed: neither `SeoDashboard` nor any analytics/competitor component fetches them.
- The competitors **SERP 분석** tab (`/api/monitoring/search/google-blog`) — it's a **monitoring** route (Google‑HTML cheerio scrape, brittle). **OUT of Phase 4** (monitoring is Phase 5). The CompetitorsDashboard's `serp` tab is **dropped** in the port (2 tabs: 콘텐츠 갭 + 키워드 순위), with a note that SERP returns in Phase 5 monitoring. §6.3 / O‑6.
- Meta‑analytics **Website** platform tab → reuses `/api/mkt/seo/audit` (same endpoint as site‑analysis). No new route.

> **Net new external endpoints:** GA4 (5 sub‑reports behind 5 routes), meta‑insights (1), youtube‑channel (1), competitors gap/rankings/suggest (3), seo audit/crawl/schema (3) = the controller surface in §4.7. SEO‑keywords/readability + SERP = OUT.

---

## 4. Server design

All under `/api/mkt`, registered in `routes/mkt.routes.ts`, house envelope `res.json({ success, data })`, `AppError(status,msg)` on failure. New controllers `controllers/mkt/{analytics,competitors,seo}.controller.ts`; new services `services/mkt/{analytics,competitors,seo}.service.ts`. External wiring in `services/mkt/external/{ga4,meta-graph,youtube-data}.ts`.

### 4.1 Per‑project config — read server‑side via the admin client (resolve the env‑vs‑row question)

> **Decision:** **per‑project `ga4_config` + `meta_credentials`, read server‑side from `mkt_projects`** (faithful to CF — each project = a different site/GA4 property/Meta account), with a **single env‑level GA4 fallback** for solo/default use.

Rationale: CF stores `ga4_config`/`meta_credentials` per project (the operator may run several brands). The client must **not** send these (secrets). So the server, given a `projectId`, reads the project's config. `config.ga4.{propertyId,clientEmail,privateKey}` (already in `config/index.ts:53‑57`, with the `\\n`→`\n` private‑key un‑escape) is the **fallback** when the project row has no `ga4_config` (mirrors CF's `body.X || process.env.X` pattern, but moved server‑side).

```ts
// services/mkt/analytics.service.ts — resolve a project's GA4 config (row → env fallback)
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';

export interface ResolvedGa4 { propertyId: string; clientEmail: string; privateKey: string; }

export async function resolveGa4Config(projectId: string): Promise<ResolvedGa4> {
  const admin = getSupabaseAdmin();
  let row: { propertyId?: string; clientEmail?: string; privateKey?: string } | null = null;
  if (admin && projectId) {
    const { data } = await admin.from('mkt_projects').select('ga4_config').eq('id', projectId).maybeSingle();
    row = (data?.ga4_config as typeof row) ?? null;
  }
  const propertyId = row?.propertyId || config.ga4.propertyId;
  const clientEmail = row?.clientEmail || config.ga4.clientEmail;
  // row private key may carry literal "\n"; un-escape like config does.
  const privateKey = (row?.privateKey || config.ga4.privateKey || '').replace(/\\n/g, '\n');
  if (!propertyId || !clientEmail || !privateKey) {
    throw new AppError(501, 'GA4가 연동되지 않았습니다. 프로젝트 설정 > 퍼널·분석에서 GA4 서비스 계정을 연결하세요.');
  }
  return { propertyId, clientEmail, privateKey };
}
```

- `meta_credentials` is resolved the same way (`resolveMetaCredentials(projectId)` → `{ pages: [...] }` or `AppError(501, 'Meta 연동이 필요합니다…')`).
- **Secret storage (R‑1):** `ga4_config.privateKey` + `meta_credentials.pages[].pageAccessToken` sit in `mkt_projects` JSONB (RLS‑scoped to the owner). They are **at rest in the DB, server‑read only, never in any `VITE_` var, never returned to the client**. The analytics endpoints never echo creds back. Future hardening (encrypt‑at‑rest / Supabase Vault) is noted in R‑1 but out of scope.

### 4.2 GA4 wiring — service‑account JWT → REST `runReport` (NO SDK)

`ga4.ts` currently 501s. Wire it as a self‑contained module that (a) builds a Google OAuth2 **service‑account assertion (signed JWT)**, (b) exchanges it for an **access token**, (c) calls `runReport`. **Use Node's built‑in `crypto`** to sign (RS256) — no `google-auth-library`, no `@google-analytics/data`. (Verified: neither is a dep; `google-auth-library` is not present. Node 20 `crypto.createSign('RSA-SHA256')` does RS256 natively. This is the **lighter path** the brief asked us to pick.)

```ts
// services/mkt/external/ga4.ts — JWT-assertion builder + token exchange + runReport
import crypto from 'node:crypto';

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

/** PURE — build the signed service-account assertion (unit-tested). */
export function buildServiceAccountAssertion(
  clientEmail: string, privateKey: string, nowSec = Math.floor(Date.now()/1000)
): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const sig = crypto.createSign('RSA-SHA256').update(signingInput).sign(privateKey);
  return `${signingInput}.${b64url(sig)}`;
}

let _tokenCache: { token: string; exp: number } | null = null; // module-level, per-clientEmail keyed in impl

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now()/1000);
  if (_tokenCache && _tokenCache.exp > now + 60) return _tokenCache.token; // reuse ~55min
  const assertion = buildServiceAccountAssertion(clientEmail, privateKey, now);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new AppError(502, `GA4 token exchange 실패 (${res.status})`);
  const json = await res.json() as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new AppError(502, 'GA4 access_token 없음');
  _tokenCache = { token: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

export async function runReport(
  cfg: { propertyId: string; clientEmail: string; privateKey: string },
  reportBody: Record<string, unknown> // dateRanges/metrics/dimensions/orderBys/limit
): Promise<GA4Report> {
  const token = await getAccessToken(cfg.clientEmail, cfg.privateKey);
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${cfg.propertyId}:runReport`,
    { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify(reportBody) }
  );
  if (!res.ok) {
    const t = await res.text().catch(()=> '');
    throw new AppError(502, `GA4 runReport 실패 (${res.status}): ${t.slice(0,200)}`);
  }
  return await res.json() as GA4Report; // { dimensionHeaders, metricHeaders, rows, rowCount }
}
```

> **Note:** `runReport`'s existing signature `(dateRanges, dimensions, metrics)` is replaced by `(cfg, reportBody)` — cleaner for the 5 different report shapes (orderBys/limit vary). Update the `GA4Report`/`GA4ReportRow` interfaces stay (the REST response uses the same `dimensionValues[].value`/`metricValues[].value` shape as the SDK — the row‑mapping mappers are unchanged).

**Exact runReport bodies per route** (faithful to the CF SDK calls — same metrics/dimensions/orderBys/limits). `startDate = '7daysAgo'|'30daysAgo'` from `period`; `endDate:'today'`:

| Endpoint | `metrics` | `dimensions` | `orderBys` | `limit` | maps to |
|---|---|---|---|---|---|
| **overview** (summary) | `sessions, activeUsers, screenPageViews, bounceRate, averageSessionDuration` | — | — | — | `GA4OverviewData` totals + `bounceRate`/`avgSessionDuration` |
| **overview** (daily) | `screenPageViews` | `date` | `{dimension:{dimensionName:'date'}}` | — | `dailyPageviews[]` |
| **traffic** | `sessions, activeUsers` | `sessionDefaultChannelGroup` | `{metric:{metricName:'sessions'},desc:true}` | 10 | `GA4TrafficSource[]` (+ `percentage`) |
| **top-pages** | `screenPageViews, activeUsers` | `pagePath, pageTitle` | `{metric:{metricName:'screenPageViews'},desc:true}` | 15 | `GA4TopPage[]` |
| **country-traffic** | `sessions, totalUsers` | `country` | `{metric:{metricName:'sessions'},desc:true}` | 10 | `GA4CountryRow[]` (new type) |
| **content-performance** | `sessions, averageSessionDuration, bounceRate` | `pagePath` | `{metric:{metricName:'sessions'},desc:true}` | 15 | `GA4ContentRow[]` (new type) |

The overview endpoint runs **two** `runReport` calls (summary + daily), exactly like CF (`overview/route.ts`). The **report‑row → viewmodel mappers** are pure functions (one per shape) and the primary TDD unit (§8).

### 4.3 Meta insights — server‑side Graph call (`meta-graph.ts`)

CF calls Graph **from the client** (IG: `…/{ig_id}?fields=followers_count,media_count,media{...}` ; FB: `…/{page_id}?fields=fan_count,posts{...}`). Port to a server endpoint `POST /api/mkt/analytics/meta-insights` `{ projectId, platform, country? }`:

1. `resolveMetaCredentials(projectId)` → `{ pages: [...] }`; `page = pages[0]`; throw `AppError(501,'Meta 연동이 필요합니다…')` if absent.
2. `platform==='instagram'` && `page.instagram?.id` → GET `https://graph.facebook.com/v21.0/{ig_id}?fields=followers_count,media_count,media{id,caption,media_type,permalink,timestamp,like_count,comments_count,media_url}&access_token={pageAccessToken}` → map to `{ overview, contents }` (followers/postsCount + per‑post engagement = likes+comments, `avgEngagementRate`). **Same mapping math as CF** (`meta-analytics-dashboard.tsx:109‑136`) — moved into a pure `mapInstagramInsights(data)` (TDD).
3. `platform==='facebook'` → GET `…/{page_id}?fields=fan_count,posts{id,message,created_time,shares,likes.summary(true),comments.summary(true)}&access_token=…` → `mapFacebookInsights(data)` (CF `:143‑167`).
4. `platform==='threads'` → **empty** `{ overview: DEFAULT, contents: [] }` (Threads has no public insights API — faithful, CF returns nothing).
5. Wire `meta-graph.ts getAdInsights` too (the brief asks). CF's analytics dashboard does **not** use ad insights (it uses page/media insights), so `getAdInsights` is wired as a **thin, available‑but‑unused** helper (GET `/act_{id}/insights?level=&date_preset=`) for a future ads phase — mirror Phase 3's "ported but un‑wired meta‑publish" pattern. Keep `getPageMediaInsights` (the new function the endpoint actually calls) as the live path.
6. **Degradation:** missing token → 501 + `{ connected:false }`; the client renders the "Meta 연결 필요 — 설정 → 채널 연동" empty state (CF `:562`).

### 4.4 YouTube‑channel — action dispatch (`youtube-data.ts`)

`POST /api/mkt/analytics/youtube-channel` `{ action, params }`, `action ∈ {searchChannel, getChannel, getVideos, getVideoStats}` — faithful to CF's `youtube-channel/route.ts`. Reuse `youtube-data.ts` (`config.youtubeApiKey`, already wired):
- `searchChannel` → `GET /search?part=snippet&q=&type=channel&maxResults=1` (add a `searchChannels(query)` helper).
- `getChannel` → wire `getChannelInfo(channelId)` (currently 501) → `GET /channels?part=statistics,snippet&id=` → `{ subscriberCount, viewCount, videoCount, snippet }`.
- `getVideos` → `GET /search?part=snippet&channelId=&order=date&maxResults=&type=video` (reuse `searchVideos` w/ a `channelId` option, or a thin `getChannelVideos`).
- `getVideoStats` → reuse `getVideoStats(videoIds)`.
The controller returns the **raw Google JSON** under `data` (the CF client digs into `items[].id.channelId` etc.) — keep the shape so `MetaAnalyticsDashboard`'s `analyzeYoutubeChannel` parsing (`:202‑259`) ports verbatim. Degrade: missing `youtubeApiKey` → `AppError(502,…)` (already thrown by `youtube-data.ts`).

### 4.5 Competitors — Gemini (+ optional DataForSEO)

`controllers/mkt/competitors.controller.ts` + `services/mkt/competitors.service.ts`. All Gemini calls via `generateTextWithGemini(prompt, 3, config.gemini.textModel)` + a **pure `parseCompetitorJson`** extractor (`/\{[\s\S]*\}/` match → `JSON.parse`, fallback `{gaps:[],strengths:[]}` / `{rankings:[]}` / `{competitors:[]}`), faithful to CF.

- `POST /api/mkt/competitors/gap-analysis` `{ projectUrl, competitorUrls[], keywords?, industry? }` → CF gap prompt (`gap-analysis/route.ts`) → `{ gaps[], strengths[] }`. (Server may read `industry` from the project row if not sent.)
- `POST /api/mkt/competitors/keyword-rankings` `{ projectUrl, competitorUrls[], keywords[] }` → CF rank‑estimation prompt → `{ rankings[] }`. **Optional faithful‑plus:** if `config.dataforseo` set, `getKeywordVolumes(keywords)` and attach `volume` per keyword (display column). Degrade silently when no DataForSEO.
- `POST /api/mkt/competitors/suggest` `{ industry, services, targetCustomer?, usp? }` → CF suggest‑competitors prompt (`suggest-competitors/route.ts`, model `DEFAULT_STRATEGY_MODEL` → our `config.gemini.textModel`) → `{ competitors[] }`.
- **Degradation:** missing `GEMINI_API_KEY` → `AppError(502,'Gemini API 키가 설정되지 않았습니다.')` (the dashboard shows the empty state).

### 4.6 SEO sub‑dashboard endpoints

`controllers/mkt/seo.controller.ts` + `services/mkt/seo.service.ts`. **`cheerio` must be a server dep** — verify; add to `packages/server/package.json` if absent (CF used `cheerio` for audit + crawl). Flag in plan.

- `POST /api/mkt/seo/audit` `{ url }` → fetch the URL (UA header), `cheerio.load`, compute google/naver/geo/tech scores + issues exactly per CF (`seo/audit/route.ts`, ~80 lines of scoring — port verbatim into a **pure `scoreSeoAudit($, url)`** TDD unit). Returns `{ url, title, metaDescription, scores, issues, meta }`.
- `POST /api/mkt/seo/crawl` `{ url }` → fetch + cheerio → `{ analysis?, text }` (the GEO tab's page summary; port `ai/strategy/crawl` minimally — extract title/headings/body text). Used only by the GEO tab.
- `POST /api/mkt/seo/schema-generate` `{ content, schemaType, language }` → Gemini → JSON‑LD string `{ schema }`. Port `seo/schema-generate/route.ts` prompt.
- **content‑SEO tab is PURE/client‑side** (no endpoint) — `calculateNaverSeoScore()` over the project's blog contents (read via the existing supabase hooks). The one Supabase touch in site‑analysis.
- **GEO write‑up** uses the existing `/api/mkt/ai/generate` (SSE) via `useAiGeneration` (the client builds the GEO prompt, faithful to CF's `fetchAiGenerate(prompt,'gemini-2.5-flash')`) — **no new endpoint**. Just the crawl + the existing SSE.

### 4.7 New routes (register in `routes/mkt.routes.ts`)

```
// ── Analytics endpoints (server-proxy; per-project creds read server-side) ──
router.post('/analytics/overview',             analyticsOverview);
router.post('/analytics/traffic',              analyticsTraffic);
router.post('/analytics/top-pages',            analyticsTopPages);
router.post('/analytics/country-traffic',      analyticsCountryTraffic);
router.post('/analytics/content-performance',  analyticsContentPerformance);
router.post('/analytics/meta-insights',        metaInsights);
router.post('/analytics/youtube-channel',      youtubeChannel);
// ── Competitor endpoints ──
router.post('/competitors/gap-analysis',       gapAnalysis);
router.post('/competitors/keyword-rankings',   keywordRankings);
router.post('/competitors/suggest',            suggestCompetitors);
// ── SEO endpoints (site-analysis SEO sub-tab) ──
router.post('/seo/audit',                      seoAudit);
router.post('/seo/crawl',                      seoCrawl);
router.post('/seo/schema-generate',            seoSchemaGenerate);
```

Each analytics route takes `{ projectId, period? }` (NOT creds). Each resolves config server‑side (§4.1) and returns `{ success, data }`. **5 GA4 routes could collapse into one `/analytics/report` with a `report` enum** — but keeping 5 named routes is more faithful to CF and lets the client `Promise.all` them (CF's `fetchAll`). Keep 5.

---

## 5. Data model — no migration; add view‑model types only

**No SQL.** All six relevant JSONB columns already exist (§1.2). Add only the missing **view‑model TS types** to `types/analytics.ts` (existing: `GA4Config`, `GA4OverviewData`, `GA4TrafficSource`, `GA4TopPage`, `FunnelConfig`, `ImportedStrategy`):

```ts
// types/analytics.ts — NEW
export interface GA4CountryRow { country: string; sessions: number; users: number; }
export interface GA4ContentRow { path: string; sessions: number; avgDuration: number; bounceRate: number; }

// Meta channel analytics
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

// Competitors
export interface CompetitorGapItem { topic: string; monthlySearch: number; competitors: string[]; difficulty: string; priority: string; }
export interface CompetitorStrengthItem { topic: string; monthlySearch: number; note: string; }
export interface CompetitorRankingItem { keyword: string; myRank: number | null; volume?: number; competitors: { name: string; rank: number | null }[]; }
export interface SuggestedCompetitor { name: string; url?: string; type: string; reason: string; strength: string; }

// SEO audit
export interface SeoAuditResult {
  url: string; title: string; metaDescription: string;
  scores: { google: number; naver: number; geo: number; tech: number };
  issues: { severity: string; message: string; engine: string; fix_action?: string }[];
  meta: Record<string, unknown>;
}
```

(The server may define a parallel minimal copy under `services/mkt/external/ga4.ts` for `GA4Report`/`GA4ReportRow`, which already exist there.)

### 5.1 New query keys (`api/queries.ts`)

Extend the flat `mktKeys` object (matches existing shape, §queries.ts:18‑31):

```ts
analyticsOverview:  (projectId: string, period: string) => ['mkt','analytics','overview', projectId, period] as const,
analyticsTraffic:   (projectId: string, period: string) => ['mkt','analytics','traffic', projectId, period] as const,
analyticsTopPages:  (projectId: string, period: string) => ['mkt','analytics','top-pages', projectId, period] as const,
analyticsCountry:   (projectId: string, period: string) => ['mkt','analytics','country', projectId, period] as const,
analyticsContent:   (projectId: string, period: string) => ['mkt','analytics','content', projectId, period] as const,
metaInsights:       (projectId: string, platform: string, country: string) => ['mkt','analytics','meta', projectId, platform, country] as const,
youtubeChannel:     (projectId: string, query: string) => ['mkt','analytics','yt-channel', projectId, query] as const,
```

- GA4 reads are **server state** (live in TanStack cache, keyed by `projectId`+`period`; `enabled: hasGa4 && !!projectId`). `staleTime` ~5 min (GA4 quota friendliness, R‑2).
- **Competitor + SEO results are transient** (component state, like CF — they're triggered by an explicit "분석 실행" button and not worth caching). They are **NOT** in `mktKeys` — `use-competitors.ts` exposes **mutations** (`useMutation`) that return the result to local state, not cached queries. (Same posture as Phase 2 ideas/trending being transient.)

---

## 6. Client — component tree

All under `.marketing-scope`; reuse Phase‑0 UI primitives (`ui/button`, `ui/input`, `ui/card`, `ui/select`, `ui/dialog`, …) + `lib/utils.cn` + lucide icons. PascalCase. **Reuse the Phase‑2 `MarketingLanguageTabs`** (already built) for the language row in all three dashboards.

```
features/marketing/components/
  analytics/                        NEW directory
    SiteAnalysisDashboard.tsx  NEW  — 2 sub-tabs (GA4 트래픽 / SEO 분석); MarketingLanguageTabs on top (port site-analysis-dashboard.tsx)
    AnalyticsDashboard.tsx     NEW  — the GA4 page: period toggle (7d/30d) + refresh + empty-state guard; renders OverviewCards/PageviewsChart/TrafficChart/TopPagesTable/CountryTraffic/ContentPerformance (port analytics-dashboard.tsx)
    OverviewCards.tsx          NEW  — 4 stat cards (세션/사용자/페이지뷰/이탈률) (port overview-cards.tsx)
    PageviewsChart.tsx         NEW  — Recharts LineChart, daily pageviews (port pageviews-chart.tsx) ★ recharts
    TrafficChart.tsx           NEW  — Recharts BarChart (vertical), traffic source sessions (port traffic-chart.tsx) ★ recharts
    TopPagesTable.tsx          NEW  — top-10 pages table (port top-pages-table.tsx)
    CountryTraffic.tsx         NEW  — country list w/ flags + % (port country-traffic.tsx)
    ContentPerformance.tsx     NEW  — per-page sessions list (port content-performance.tsx)
    MetaAnalyticsDashboard.tsx NEW  — 5 platform tabs (IG/FB/Threads/YT/Website); per-platform insights via use-analytics hooks (port meta-analytics-dashboard.tsx, 709 lines)
    YoutubeChannelPanel.tsx    NEW  — (extracted) YT channel analyzer (input → channel card + 4 stat cards + recent videos) — the YT tab body of meta-analytics
    WebsiteSeoPanel.tsx        NEW  — (extracted) URL → /seo/audit → 4 score cards + issues — the Website tab body of meta-analytics
    seo/
      SeoDashboard.tsx         NEW  — 4 sub-tabs (audit/content/geo/schema) (port seo/seo-dashboard.tsx)
      ScoreGauge.tsx           NEW  — score ring (port seo/score-gauge.tsx)
      AuditForm.tsx            NEW  — URL input form (port seo/audit-form.tsx)
      IssuesList.tsx           NEW  — issues list (port seo/issues-list.tsx)
  competitors/                      NEW directory
    CompetitorsDashboard.tsx   NEW  — 2 tabs (콘텐츠 갭 / 키워드 순위; SERP dropped → Phase 5); MarketingLanguageTabs on top (port competitors-dashboard.tsx, SERP tab removed)
pages/
  SiteAnalysisPage.tsx         NEW  — project guard → <SiteAnalysisDashboard projectId/>
  MetaAnalyticsPage.tsx        NEW  — project guard → <MetaAnalyticsDashboard projectId/>
  CompetitorsPage.tsx          NEW  — project guard → <CompetitorsDashboard projectId/>
index.ts                        EDIT — export the 3 pages
```

### 6.1 `SiteAnalysisDashboard` + `AnalyticsDashboard` (GA4)
- `SiteAnalysisDashboard`: `MarketingLanguageTabs` + 2 sub‑tabs `GA4 트래픽`/`SEO 분석` → renders `<AnalyticsDashboard/>` or `<SeoDashboard/>`. (CF `site-analysis-dashboard.tsx`.)
- `AnalyticsDashboard`: reads `useProject(projectId)`; `hasGa4 = !!project.ga4_config?.propertyId`. If `!hasGa4` → empty state "GA4 연동이 필요합니다 / 프로젝트 설정 > 퍼널·분석에서 연결" (CF `:33‑43`). Else: period toggle (7d/30d) + refresh button + the 6 child panels. **Data via `use-analytics.ts`** (`useGa4Overview/Traffic/TopPages/Country/Content(projectId, period)` — all `Promise.all`‑ready TanStack queries, `enabled: hasGa4`). `funnel_config.websiteUrl` shown as subtitle + passed to `TopPagesTable` for full URLs.
- **Charts (★ recharts):** `PageviewsChart` (LineChart, `dataKey="views"`, X = `MM/DD` from `date.slice`) + `TrafficChart` (vertical BarChart, `dataKey="sessions"`, Y category = `channel`). Both wrapped in `ResponsiveContainer` h‑200. **These are the ONLY two recharts components in the entire marketing module.** Color `#0F6E56` (CF) — fine inside `.marketing-scope`.

### 6.2 `MetaAnalyticsDashboard` (the big one, 709 LOC)
- Platform tabs IG/FB/Threads/YT/Website + (for Meta platforms) country tabs filtered to `project.target_languages` + a period select (7/30/90 — display only, faithful).
- **IG/FB/Threads:** `useMetaInsights(projectId, platform, country)` → `{ connected, overview, contents }`. `!connected` → "Meta 계정을 연결해 주세요" empty state (CF `:568`). Else: 4 overview metric cards + per‑post 성과 table + 최고성과/성장트렌드 panels. (All the mapping math now lives server‑side §4.3; the component just renders.)
- **YouTube (`YoutubeChannelPanel`):** URL/name input → `useYoutubeChannel` mutation chaining the 4 `youtube-channel` actions (the orchestration in CF `analyzeYoutubeChannel` `:187‑267` ports into the hook/panel) → channel card + 4 stat cards + recent‑videos list. `formatNumber` (억/만) ported.
- **Website (`WebsiteSeoPanel`):** URL → `useSeoAudit` mutation → 4 score cards + issues list (shares the `/seo/audit` endpoint with `SeoDashboard`).
- **Note:** CF hardcodes a sample account label ("연세새봄의원") at `:550` — **replace with a neutral placeholder** (`project.brand_name || project.name`) in the port (don't ship a customer name). Minor delta.

### 6.3 `CompetitorsDashboard`
- `MarketingLanguageTabs` + **2 tabs** (콘텐츠 갭 / 키워드 순위). **SERP 분석 tab dropped** (monitoring → Phase 5; O‑6).
- **갭:** project URL (default `funnel_config.websiteUrl`) + competitor‑URL chips + "갭 분석 실행" → `useGapAnalysis` mutation → gaps/strengths lists. **Plus** a "🤖 경쟁사 추천" button → `useSuggestCompetitors` (reads `project.industry/usp/...`) → fills the competitor chips (faithful‑plus, §3.2).
- **키워드 순위:** "순위 분석" → pulls keywords from `project.imported_strategy?.keywords?.slice(0,10)` (falls back to `industry`‑derived defaults, CF `:82‑88`) → `useKeywordRankings` mutation → ranking table (우리 + up to 3 competitor columns, `getRankBadge` color by position) + the optional `volume` column when DataForSEO returned it. "* AI 추정 순위" disclaimer (CF `:267`).
- `imported_strategy` already on the `Project` type + DB column (no work).

### 6.4 `SeoDashboard` (site‑analysis 2nd sub‑tab)
- 4 sub‑tabs: **audit** (`AuditForm` → `useSeoAudit` → `ScoreGauge`×4 + `IssuesList`), **content** (PURE — `calculateNaverSeoScore` over `useBlogContentsForProject`; sorted worst‑first), **geo** (`useSeoCrawl` → page summary → `useAiGeneration` GEO prompt → markdown write‑up), **schema** (textarea + type select → `useSchemaGenerate` → JSON‑LD + copy button). Ports `seo-dashboard.tsx` (~470 LOC) + `score-gauge.tsx`/`audit-form.tsx`/`issues-list.tsx`.

### 6.5 Pages (project guard)
- Each page: no `ui-store.selectedProjectId` → centered "프로젝트를 선택하세요" (CF parity); else `<XDashboard projectId={selectedProjectId} />`. Mirrors `IdeasPage`/`PublishPage`.

### 6.6 `MarketingLanguageTabs` — reuse, no rebuild
Already built (Phase 2). Reads `target_languages` (ko‑pinned), drives `selectedLang`. CF's analytics version had an inline "+ 언어 추가" edit dialog; the Phase‑2 version defers editing to settings `TargetLanguagesSection`. **Keep deferring** (faithful‑enough; editing target languages already lives in settings). The `selectedLang` in these dashboards is display‑only state today (CF's GA4 reports aren't actually language‑filtered — GA4 has no per‑translation segment; the tab is cosmetic). Document that.

---

## 7. Settings — ALREADY DONE (verify only)

`FunnelAnalyticsSection` (tab "퍼널·분석", `ProjectSettings.tsx:82/121`) fully edits `funnel_config` (websiteUrl/conversionGoal/conversionUrl/funnelSteps) + `ga4_config` (propertyId numeric‑only / clientEmail / privateKey with show‑hide + a "GA4 연결 정보가 설정되었습니다" confirmation). Writes via `onUpdate({ funnel_config, ga4_config })` → `useUpdateProject`. **Meta credentials** are edited in the existing `ChannelConnectionsSection` (tab "채널연동"). **Decision #5 needs no new work** — Phase 4 only confirms the server reads the same `ga4_config`/`meta_credentials` shapes the section writes (it does — §4.1 resolvers read `propertyId/clientEmail/privateKey` and `pages[]`).

---

## 8. Sub‑phasing 4a / 4b / 4c + what's testable

> **Recommended split** (each independently shippable behind its placeholder, like Phase 3's 3a/3b/3c):

### 4a — site‑analysis / GA4 (the biggest)
The GA4 JWT + `runReport` + the 5 report routes + the 8 GA4 components + recharts + the SEO sub‑dashboard. Highest value, most pure‑testable logic.
1. **`recharts`** add to client (`^2.15.x`); verify peer‑deps (§O‑5). 2. **`ga4.ts`**: `buildServiceAccountAssertion` (pure) + token exchange + `runReport`. 3. **`analytics.service.ts`**: `resolveGa4Config` + the 6 report builders + the pure **row→viewmodel mappers**. 4. **`analytics.controller.ts`** + 5 routes. 5. **`seo.service/controller`** (audit/crawl/schema) + `cheerio` dep. 6. **Client**: `use-analytics.ts` (GA4 query hooks + `useSeoAudit`/`useSeoCrawl`/`useSchemaGenerate`), `analytics/*` components, `seo/*` components, `SiteAnalysisPage`. 7. Route swap `site-analysis`.

**Testable (TDD, Vitest, colocated `__tests__`):**
- **`buildServiceAccountAssertion`** — pure: given a known clientEmail + a test RSA key + a fixed `nowSec`, asserts the header/claim base64url segments decode to the expected JSON (alg RS256, correct `scope`/`aud`/`iss`/`iat`/`exp=iat+3600`) and the signature verifies with the matching public key (`crypto.verify`). The cleanest pure unit in the phase.
- **GA4 report‑row mappers** (one per shape) — given a stub `GA4Report` (`rows[].dimensionValues[].value` / `metricValues[].value`), assert `mapOverviewSummary`/`mapDaily`/`mapTraffic` (incl. `percentage` = round(sessions/total*100), 0‑total guard) / `mapTopPages` / `mapCountry` / `mapContent` produce the right view‑models, with `parseInt`/`parseFloat` `?? '0'` fallbacks.
- **`scoreSeoAudit($, url)`** — given fixture HTML strings (cheerio‑loaded), assert google/naver/geo/tech scores + the issue list match CF's thresholds (title 30‑60, meta ≥120, single H1, schema present, FAQPage, https, etc.).
- **`resolveGa4Config`** — row present → uses row; row absent → env fallback; both absent → `AppError(501)`; private‑key `\\n` un‑escaped. (mock admin client.)

### 4b — meta‑analytics (channel)
Meta page/media insights + youtube‑channel + the website‑SEO panel (reuses 4a's audit).
8. **`meta-graph.ts`**: `getPageMediaInsights` (live) + `getAdInsights` (thin/available) + the pure `mapInstagramInsights`/`mapFacebookInsights`. 9. **`youtube-data.ts`**: wire `getChannelInfo` + `searchChannels` + `getChannelVideos`. 10. **`analytics.service/controller`** add `metaInsights` + `youtubeChannel` (+ `resolveMetaCredentials`). 11. **Client**: `use-analytics.ts` add `useMetaInsights`/`useYoutubeChannel`, `MetaAnalyticsDashboard` + `YoutubeChannelPanel` + `WebsiteSeoPanel`, `MetaAnalyticsPage`. 12. Route swap `meta-analytics`.

**Testable:** `mapInstagramInsights`/`mapFacebookInsights` (engagement = likes+comments, `avgEngagementRate` math, 0‑follower guard, `.slice(0,20)`) with stub Graph JSON; `resolveMetaCredentials` (row→501). `formatNumber` (억/만/raw) table test.

### 4c — competitors
13. **`competitors.service/controller`** (gap/rankings/suggest) + pure `parseCompetitorJson`. 14. **Client**: `use-competitors.ts` (3 mutations), `CompetitorsDashboard` (2 tabs), `CompetitorsPage`. 15. Route swap `competitors`.

**Testable:** `parseCompetitorJson` (extract `{...}` from noisy text; fallback shapes for gaps/rankings/competitors); rank‑badge color thresholds (≤3 / ≤10 / ≤30 / else) as a pure helper; keyword‑seed selection (imported_strategy slice(0,10) → industry fallback).

> **No‑creds graceful states (manual / render‑test only):** every dashboard's empty state (GA4 미연동, Meta 미연동, no‑YouTube‑key, no‑Gemini) renders without crash. Real‑creds E2E (live GA4 JWT round‑trip, live Meta token, live competitor Gemini) is a **deferred operator checklist** (no creds in CI — same policy as Phase 1‑3).

---

## 9. Open items — resolved

| # | Question | Resolution |
|---|---|---|
| O‑1 | Which SEO routes do the analytics dashboards actually call? | Only **`audit`** + **`schema-generate`** (+ a `crawl` for GEO). `keywords`/`readability` are **NOT** called by any Phase‑4 component → **OUT** (content/strategy, future). Verified by reading every `fetch` in `seo-dashboard.tsx`/`meta-analytics-dashboard.tsx`. §3.3. |
| O‑2 | Does `mkt_projects` have `ga4_config`/`funnel_config`/`imported_strategy`? | **YES — all present** (`2026-06-07-marketing-schema.sql:57‑67`: `funnel_config`, `ga4_config`, `imported_strategy`, `saved_keywords`, `meta_credentials`, `published_site`) + the `Project` type declares them (`database.ts:164,199,206,207,209`). **No migration.** §1.2. |
| O‑3 | Existing GA4/analytics settings section? | **YES** — `FunnelAnalyticsSection` (tab "퍼널·분석") edits `funnel_config`+`ga4_config`, wired to `useUpdateProject`. Meta creds in `ChannelConnectionsSection`. **Decision #5 done.** §7. |
| O‑4 | Exact `mktKeys` additions? | 7 GA4/meta/yt keys (§5.1). Competitor/SEO results are **transient mutations** (not cached), matching Phase‑2 ideas posture. |
| O‑5 | `recharts` version for React 18 + Vite? | **`^2.15.x`** (the stable React‑18 line; CF's `^3.8.0` was for React 19). Client is `react@^18.3.0` (verified `package.json`). Only `PageviewsChart`+`TrafficChart` import it. Peer‑dep: recharts 2 wants React 16‑18 — clean fit. §R‑4. |
| O‑6 | youtube‑channel route — reuse Phase‑2 youtube‑data? | **YES** — `youtube-data.ts` is wired (Phase 2: `searchVideos`/`getVideoStats`); Phase 4 wires `getChannelInfo` (currently 501) + adds `searchChannels`/`getChannelVideos`. §4.4. **Bonus:** competitors **SERP tab dropped** (uses `/api/monitoring/search/google-blog` = monitoring → Phase 5). §3.3. |
| O‑7 | Is `analytics-dashboard.tsx` a tab wrapper or the GA4 page? | **It IS the GA4 page** (period toggle + the 6 GA4 panels). The **tab wrapper is `site-analysis-dashboard.tsx`** (GA4 트래픽 / SEO 분석 sub‑tabs), which mounts `AnalyticsDashboard` + `SeoDashboard`. Component tree confirmed by reading both. §6.1. |
| O‑8 | GA4 JWT signing — `crypto` vs `google-auth-library`? | **Node built‑in `crypto`** (`createSign('RSA-SHA256')` → RS256). `google-auth-library` is NOT a dep (verified) and the lighter path is no new dep at all. §4.2. |
| O‑9 | Per‑project vs env‑level GA4 config? | **Per‑project `ga4_config` (row), env‑level fallback.** Server reads the project row via `getSupabaseAdmin()`; client never sends creds. Faithful to CF (multi‑project) + secret‑safe. §4.1. |

---

## 10. Test plan (summary)

**Pure logic — TDD unit (Vitest, colocated `__tests__`):**
- **GA4 JWT assertion builder** (`ga4.ts buildServiceAccountAssertion`) — decode/verify header+claim+signature against a test key pair (§8 4a).
- **GA4 report‑row → viewmodel mappers** (6) — stub `GA4Report` → expected view‑models (totals, percentage math, 0‑guards, parse fallbacks).
- **`resolveGa4Config` / `resolveMetaCredentials`** — row→env→501 precedence, `\\n` un‑escape (mock admin client).
- **Meta insight mappers** (`mapInstagramInsights`/`mapFacebookInsights`) — engagement/`avgEngagementRate`/0‑follower guard/`.slice(0,20)`.
- **`scoreSeoAudit`** — fixture HTML → CF score thresholds + issues.
- **`parseCompetitorJson`** — noisy‑text JSON extraction + fallback shapes.
- **pure helpers** — `formatNumber` (억/만), rank‑badge color thresholds, keyword‑seed selection.

**Graceful‑degradation tests:** each endpoint returns `501`/empty (not 500) when its creds are absent; each dashboard renders its "연결 필요" empty state without crash.

**External / UI — manual (deferred operator checklist, no creds in CI):**
- Real GA4 service account → JWT exchange → 7d/30d overview/traffic/top‑pages/country/content render; charts draw. Real Meta token → IG/FB insights + post table. YouTube channel analyze. Competitor gap/rankings/suggest with live Gemini. SEO audit on a live URL. `pnpm typecheck` + marketing/server suites green.

---

## 11. Risks & gotchas

- **R‑1 — service‑account private key + Meta token security (HIGH).** `ga4_config.privateKey` + `meta_credentials.pages[].pageAccessToken` are secrets. They live in `mkt_projects` JSONB (owner‑RLS), are **read server‑side only** (via `getSupabaseAdmin()`), and **must never** be `VITE_`‑prefixed, sent in a client→server body, or echoed back in any response. The client only ever holds presence booleans. (CF leaked the Meta token into client‑side `fetch` URLs — the port deliberately closes that by proxying through Express. §1.1.) Future hardening: encrypt‑at‑rest / Supabase Vault (out of scope, noted).
- **R‑2 — GA4 quota (MED).** `runReport` has per‑property/day token quotas. Mitigations: cache GA4 queries `staleTime ~5min` (§5.1); the 5 reports per refresh are bounded; access‑token cached ~55 min (avoid re‑minting per call). Surface GA4 429/quota errors as the `error` banner (CF shows `error`), not a crash.
- **R‑3 — GA4 JWT clock skew / key format (MED).** RS256 signing needs the **PEM private key with real newlines** — both `config.ga4.privateKey` (`.replace(/\\n/g,'\n')` already in config) and the row value (re‑un‑escaped in `resolveGa4Config`) must convert literal `\n`. `iat/exp` use server clock; a >5‑min skew vs Google rejects the assertion — server time should be NTP‑synced. Unit‑test the assertion; document the PEM‑newline gotcha.
- **R‑4 — recharts bundle size + React‑18 compat + the existing large‑chunk warning (MED).** recharts (+ its d3 deps) is ~100KB+ gz. The marketing build already trips Vite's large‑chunk warning (project‑wide note). Mitigation: recharts is imported by **only 2 components**, both inside `site-analysis` → they land in the marketing route chunk; consider a dynamic `import()` for the two chart components if the analytics chunk balloons (lazy‑load the GA4 tab). Pin **recharts `^2.15.x`** (React‑18 line) — do NOT take 3.x (React‑19‑era). Verify no peer‑dep warning against `react@18.3`.
- **R‑5 — Meta Graph API version/permission drift (MED).** Graph v21.0 + the `instagram_basic`/`pages_read_engagement` permissions the token must carry; reach/impressions need the **Insights** edge (CF leaves them 0 — faithful, the port also returns 0 for reach/impressions, only likes/comments are real). Threads has no insights API → always empty (faithful). Don't promise reach metrics.
- **R‑6 — per‑project secret read needs the admin client (LOW/MED).** `resolveGa4Config`/`resolveMetaCredentials` require `getSupabaseAdmin()` (service‑role) to read the project row server‑side (the server has no `auth.uid()` cookie). When `SUPABASE_SERVICE_ROLE_KEY` is unset (dev), the resolver falls back to env GA4 (still works for a single default property) but **cannot** read per‑project Meta creds → meta‑insights degrades to 501 "연동 필요". Document: full per‑project analytics needs the service‑role key (same env Phase 3 added).
- **R‑7 — `cheerio` server dep (LOW).** `/seo/audit` + `/seo/crawl` need `cheerio`. Verify it's in `packages/server/package.json`; add if absent (CF used it). Build fails otherwise.
- **R‑8 — SEO audit / crawl SSRF + scraping fragility (LOW/MED).** `/seo/audit` fetches an arbitrary operator‑supplied URL server‑side (SSRF surface). Operator‑only tool, but consider a basic allow‑scheme (`http/https` only) + timeout. Google‑HTML scraping (the dropped SERP tab) is intentionally **OUT** partly for this brittleness.
- **R‑9 — customer name in CF sample data (LOW).** `meta-analytics-dashboard.tsx:550` hardcodes "연세새봄의원". Replace with `project.brand_name || project.name` in the port — don't ship a real customer name. §6.2.

---

## 12. Sequenced implementation checklist (for the plan)

> **Sub‑phase split: 4a (site‑analysis/GA4) → 4b (meta‑analytics) → 4c (competitors).** Each independently shippable behind its placeholder. 4a carries the GA4 JWT + recharts + SEO sub‑dashboard (most logic). 4b adds Meta/YouTube channel. 4c is the Gemini competitor trio.

### 4a — site‑analysis / GA4 + SEO
1. Client dep: `recharts@^2.15.x` (verify peer‑deps vs react@18.3).
2. Server dep: verify/add `cheerio` to `packages/server`.
3. `ga4.ts`: `buildServiceAccountAssertion` (pure) + token exchange (cache) + `runReport(cfg, body)`. **Unit‑test the assertion.**
4. `analytics.service.ts`: `resolveGa4Config` (row→env→501) + 6 report builders + pure row→viewmodel mappers. **Unit‑test mappers + resolver.**
5. `analytics.controller.ts` + register 5 GA4 routes (`/analytics/{overview,traffic,top-pages,country-traffic,content-performance}`).
6. `seo.service.ts`/`seo.controller.ts`: `scoreSeoAudit` (pure) + crawl + schema‑generate; register `/seo/{audit,crawl,schema-generate}`. **Unit‑test `scoreSeoAudit`.**
7. `types/analytics.ts`: add GA4Country/Content + SeoAuditResult.
8. `api/queries.ts`: add the 5 GA4 keys.
9. `api/use-analytics.ts`: GA4 query hooks (`useGa4Overview/Traffic/TopPages/Country/Content`) + `useSeoAudit`/`useSeoCrawl`/`useSchemaGenerate` (mutations).
10. `components/analytics/*` (Site/AnalyticsDashboard, OverviewCards, Pageviews/TrafficChart ★recharts, TopPagesTable, Country/ContentPerformance) + `components/analytics/seo/*`.
11. `pages/SiteAnalysisPage.tsx` + `index.ts`; swap `router/index.tsx:319` → `<SiteAnalysisPage/>`.

### 4b — meta‑analytics
12. `meta-graph.ts`: `getPageMediaInsights` (live) + `getAdInsights` (thin) + pure `mapInstagram/FacebookInsights`. **Unit‑test mappers.**
13. `youtube-data.ts`: wire `getChannelInfo` + `searchChannels` + `getChannelVideos`.
14. `analytics.service/controller`: `resolveMetaCredentials` + `metaInsights` + `youtubeChannel`; register 2 routes.
15. `types/analytics.ts`: add Meta*/Youtube* types; `queries.ts`: 2 keys; `use-analytics.ts`: `useMetaInsights`/`useYoutubeChannel`.
16. `components/analytics/{MetaAnalyticsDashboard,YoutubeChannelPanel,WebsiteSeoPanel}.tsx` (replace the CF sample customer name); `pages/MetaAnalyticsPage.tsx`; swap `router/index.tsx:320`.

### 4c — competitors
17. `competitors.service/controller`: gap/rankings/suggest + pure `parseCompetitorJson` (+ optional DataForSEO volume on rankings). **Unit‑test parser + helpers.**
18. `types/analytics.ts`: add Competitor* types; `api/use-competitors.ts`: 3 mutations.
19. `components/competitors/CompetitorsDashboard.tsx` (2 tabs, SERP dropped); `pages/CompetitorsPage.tsx`; swap `router/index.tsx:321`.

### Docs
20. Update `features/marketing/CLAUDE.md` (analytics module section + the GA4 JWT‑REST note + per‑project config resolver + server‑proxy data‑layer + the new `/api/mkt/{analytics,competitors,seo}/*` rows + recharts dep + SEO‑keywords/readability + SERP scoped‑OUT + route tree), root CLAUDE.md `/marketing` line (Phase 4 분석 done), memory `marketing-port-contentflow-2026-06-07.md`.
21. `pnpm typecheck` + `lint` + marketing/server suites green; manual deferred operator checklist with real GA4/Meta creds (§10).

---

## 13. Cited references

**ContentFlow (port source)**
- `src/components/analytics/site-analysis-dashboard.tsx` (2 sub‑tabs wrapper, mounts AnalyticsDashboard + SeoDashboard) · `analytics-dashboard.tsx` (THE GA4 page: period toggle + 6 panels, empty‑state `:33`) · `overview-cards.tsx` · `traffic-chart.tsx` (recharts BarChart) · `pageviews-chart.tsx` (recharts LineChart) · `country-traffic.tsx` · `top-pages-table.tsx` · `content-performance.tsx` · `language-tabs.tsx`.
- `src/components/analytics/meta-analytics-dashboard.tsx` (709 LOC; client‑side Graph `:104/138`; YT analyze `:187‑267`; website audit `:269‑285`; sample customer name `:550`).
- `src/components/competitors/competitors-dashboard.tsx` (gap `:63`, keyword‑rankings `:77`, SERP `:109` → monitoring; `imported_strategy` keyword pull `:82`).
- `src/components/seo/{seo-dashboard,score-gauge,audit-form,issues-list}.tsx` (audit/content/geo/schema sub‑tabs; content tab = pure `calculateNaverSeoScore`).
- `src/hooks/use-analytics.ts` (client GA4 `fetchAll` Promise.all overview/traffic/top‑pages).
- `src/app/api/analytics/{overview,traffic,top-pages,country-traffic,content-performance,youtube-channel}/route.ts` (SDK `runReport` bodies — exact metrics/dimensions/orderBys/limits per §4.2; youtube‑channel action dispatch).
- `src/app/api/competitors/{gap-analysis,keyword-rankings}/route.ts` + `src/app/api/ai/strategy/suggest-competitors/route.ts` (Gemini JSON prompts).
- `src/app/api/seo/{audit,schema-generate}/route.ts` (cheerio scoring; schema JSON‑LD). `src/app/api/seo/{keywords,readability}/route.ts` — **NOT used by analytics → OUT**.
- `src/app/api/monitoring/search/google-blog/route.ts` (SERP scrape — **monitoring, Phase 5 → OUT**).
- `src/types/analytics.ts` (GA4Config/GA4OverviewData/GA4TrafficSource/GA4TopPage/FunnelConfig/ImportedStrategy). `package.json` (`@google-analytics/data ^5.2.1`, `recharts ^3.8.0`, `react 19.2.3`).

**Tangobook (worktree `feat/marketing-phase0`)**
- `supabase/migrations/2026-06-07-marketing-schema.sql:57‑67` — `funnel_config`/`ga4_config`/`imported_strategy`/`saved_keywords`/`meta_credentials`/`published_site` JSONB **already present** (no migration).
- `packages/client/src/features/marketing/types/analytics.ts` (GA4Config/GA4OverviewData/GA4TrafficSource/GA4TopPage/FunnelConfig/ImportedStrategy exist) · `types/database.ts:164,199,206,207,209` (`Project.{meta_credentials,saved_keywords,funnel_config,ga4_config,imported_strategy}`).
- `…/components/project/sections/FunnelAnalyticsSection.tsx` + `ProjectSettings.tsx:82/121` — GA4 settings **already built + wired** (Decision #5 done).
- `…/components/ideas/MarketingLanguageTabs.tsx` — reuse (Phase 2).
- `…/api/queries.ts:18‑31` — `mktKeys` flat factory (add analytics keys).
- `…/api/use-projects.ts` `useProject`/`useUpdateProject` — presence checks + settings write path.
- `packages/server/src/services/mkt/external/ga4.ts` — `runReport`/`GA4Report` 501 stub (wire JWT‑REST) · `meta-graph.ts` — `getAdInsights`/`exchangeToken` 501 stubs (wire insights) · `youtube-data.ts` — `searchVideos`/`getVideoStats` wired, `getChannelInfo` 501 (wire) · `dataforseo.ts` — `getKeywordVolumes` wired (reuse).
- `packages/server/src/providers/supabase-admin.provider.ts` — `getSupabaseAdmin()` (Phase 3, reuse for per‑project config reads).
- `packages/server/src/config/index.ts:53‑81` — `ga4.{propertyId,clientEmail,privateKey}` (with `\\n`→`\n`), `meta.{appId,appSecret}`, `youtubeApiKey`, `dataforseo`, `supabase.serviceRoleKey` (all present).
- `packages/server/src/providers/gemini.provider.ts` `generateTextWithGemini` + `parseGeminiJSON` — reuse for competitors/seo.
- `packages/server/src/services/mkt/ideas.controller.ts` / `ideas.service.ts` — controller/service + Gemini‑JSON pattern to mirror.
- `packages/server/src/routes/mkt.routes.ts` — add `/analytics/*` + `/competitors/*` + `/seo/*` rows.
- `packages/client/src/router/index.tsx:319‑321` — 3 placeholders (swap elements).
- `packages/client/package.json` — `react@^18.3.0`, `@tanstack/react-query@^5`, `@supabase/supabase-js@^2.104` (recharts to ADD); `packages/server/package.json` — `@supabase/supabase-js`, `@google/genai` present (cheerio to verify/add).
