# Marketing Phase 5 — 전략 / 모니터링 / 광고 / 경쟁사 SERP — Design Spec

| | |
|---|---|
| **Date** | 2026‑06‑09 |
| **Branch / worktree** | `feat/marketing-phase0` @ `C:\projects\tangobook\.worktrees\marketing-phase0` (verified `git branch --show-current` → `feat/marketing-phase0`) |
| **Status** | Spec (no implementation) |
| **Predecessor** | Phase 0 Foundation + Phase 1a–1d (content) + Phase 2 (keywords/ideas) + Phase 3 (publish) + Phase 4 (analytics: site‑analysis/meta‑analytics/competitors) — all COMPLETE & committed. |
| **Source app** | ContentFlow (Next.js) `C:\projects\contentflow\contentflow` (read‑only reference) |
| **Roadmap slot** | Master‑plan **Phase 5 (final)**. Replaces 2 placeholders (`/marketing/monitoring`, `/marketing/strategy`, `/marketing/ads` — actually **3**: `router/index.tsx:321/325/326`) **+** adds the 3rd "SERP 분석" tab to the **existing** Phase‑4 `CompetitorsDashboard`. After Phase 5, every `/marketing` sidebar route is live. |
| **Primary CF source** | `src/components/strategy/strategy-dashboard.tsx` (iframe viewer) · `strategy-import-dialog.tsx` (HTML→structured import) · `src/lib/strategy-html-parser.ts` · `src/app/api/strategy/{templates,import-html}/route.ts` · `src/components/monitoring/monitoring-dashboard.tsx` (491 LOC) · `src/app/api/monitoring/search/{naver,naver-blog,google-blog,youtube,instagram}/route.ts` + `src/app/api/monitoring/comment/route.ts` · `src/components/ads/ads-dashboard.tsx` (449 LOC) · `src/components/competitors/competitors-dashboard.tsx` (SERP tab `:109`) |

---

## 1. Overview

ContentFlow's remaining surface is **four pillars** under the sidebar groups `[전략]`, `[모니터링]`, `[광고]`, plus the dropped 3rd tab of `[경쟁사]`:

| Pillar | CF route / mount | What it does | External deps |
|---|---|---|---|
| **A — 전략 (Strategy)** | `/strategy` → `StrategyDashboard` (iframe template viewer) **+** `StrategyImportDialog` (HTML→structured import, mounted in sidebar) | (1) lists per‑project marketing‑strategy `*.html` files from disk and renders the selected one in an `<iframe>`; (2) a separate dialog parses an uploaded/selected strategy HTML into `{keywords, categories[{topics}]}` → stores as `imported_strategy` | **none** (disk read + HTML parse). Parse is **pure** (cheerio in CF; **DOMParser in the Tangobook client — already ported**). |
| **B — 모니터링 (Monitoring)** | `/monitoring` → `MonitoringDashboard` | per‑language keyword feed: searches 지식인/N블로그/구글블로그/YouTube/Instagram for each keyword, lists results, generates an AI comment per item | **HTML scrape** (지식인/N블로그/구글블로그) · **YouTube Data API** (`config.youtubeApiKey`) · **Meta Graph** (IG hashtag, `meta_credentials` token) · **Gemini** (comment) |
| **C — 광고 (Ads)** | `/ads` → `AdsDashboard` | campaign **planning** mockup (create/list/detail) + a read of published records to pick ad creative. **No ad‑platform API.** | **none** (one Supabase read of `publish_records`) |
| **D — 경쟁사 SERP** | `competitors-dashboard.tsx` `serp` tab (dropped in Phase 4) | Google SERP scrape for a keyword → top‑10 results list | **Google HTML scrape** (CF) → **DataForSEO SERP** (Tangobook, R‑D) |

Phase 5 is a **faithful port** of these into Tangobook. The stack adapts exactly as in Phase 1–4: Next.js → Vite/React‑Router, Zustand `project-store` → `useProject` (TanStack) + `ui-store`, CF `/api/*` → Express `/api/mkt/*` with the house envelope `{ success, data }` + `AppError`, CF design tokens → `.marketing-scope`, kebab filenames → PascalCase, Korean user‑facing strings, `MarketingLanguageTabs`/`mktKeys` reuse. Where CF does something **unsafe** (Meta token in client `fetch` URL) or **impractical/ToS‑risky** (Google HTML scrape), Phase 5 keeps the *behavior* but routes it through a **server‑proxy** so secrets stay server‑side and substitutes the **faithful‑but‑safe** Tangobook path (DataForSEO SERP).

### 1.1 CRITICAL data‑layer note — Phase 5 is a **mix**, and pillar A is mostly already built

> **The single most important architectural axis (mirrors Phase 4 §1.1). Each pillar sits in a different lane.**

- **Pillar A (전략)** — **supabase‑direct (client‑side) + a tiny server‑proxy disk read.** The HTML **parse is PURE and already ported to the client** (`lib/strategy-html-parser.ts`, DOMParser, with a test — verified). The write of the result to `imported_strategy` is **supabase‑direct via the existing `useUpdateProject`** (owner‑row JSONB, RLS auto‑satisfied — same as Phase‑2 `saved_keywords`). The **only** server piece is the template **list** endpoint (`GET /api/mkt/strategy/templates`) which `fs.readdir`s a server‑owned directory — a **server‑proxy read** (no secret, but the disk is server‑side). **No `import-html` parse endpoint is needed** — the client parses in‑browser.
- **Pillar B (모니터링)** — **server‑proxy for ALL search + comment** (every CF monitoring route hits an external service: a scrape target, the YouTube key, the Meta token, or Gemini). The client sends only non‑secret params (`{ keyword, language, projectId }`); the server holds the YouTube key / Gemini key / reads the project's Meta token via `getSupabaseAdmin()`. **Monitoring keywords** persistence is **supabase‑direct** (the `mkt_monitoring_keywords` table exists, RLS, user_id stamp) — a **faithful‑plus** over CF (CF kept keywords in volatile component state; §3.2 / R‑B).
- **Pillar C (광고)** — **client‑only** (campaigns in component state, no API route, no campaign table) **+ one supabase‑direct read** of `mkt_publish_records` (Phase‑3 table) for the "발행된 콘텐츠에서 선택" creative picker. No backend, no migration.
- **Pillar D (경쟁사 SERP)** — **server‑proxy** (`POST /api/mkt/competitors/serp`) → **DataForSEO SERP** (`config.dataforseo`, already a server secret), degrading to a "연결 필요" empty when DataForSEO creds absent. Integrated as the **3rd tab of the EXISTING Phase‑4 `CompetitorsDashboard`** (do NOT create a new dashboard).

### 1.2 This phase is cheap on data + settings — Phase 0/3/4 already provisioned it

- **NO migration.** Verified against `supabase/migrations/2026-06-07-marketing-schema.sql` + `types/database.ts`:
  - **Strategy** → `mkt_projects.imported_strategy jsonb` already exists (`schema.sql:60`) + the `Project` type declares it (`database.ts:209`) + `ImportedStrategy`/`ImportedKeyword`/`ImportedCategory`/`ImportedTopic` types already exist (`types/analytics.ts:50‑79`). **Zero columns.**
  - **Monitoring keywords** → `mkt_monitoring_keywords` already exists (`schema.sql:393‑406`: `id, user_id, project_id, keyword, search_engine ('naver'|'google'), is_golden, category, sort_order, created_at, updated_at`, `unique(project_id, keyword, search_engine)`) + RLS owner policy (`schema.sql:447`). **Zero columns.** (Only a TS interface is missing in `database.ts` — added in code, not SQL.)
  - **Ads** → no table needed (client mockup); the creative picker reads `mkt_publish_records` (exists since Phase 3). **Zero columns.**
  - **SERP** → no table (transient mutation). **Zero columns.**
  - **Verdict: NO SQL migration in Phase 5** (the firmest "no migration" of any phase — contrast Phase 3's ALTER).
- **`getSupabaseAdmin()` already exists** (Phase 3, `providers/supabase-admin.provider.ts`) — reuse to read `meta_credentials` server‑side for the IG monitoring route. `@supabase/supabase-js` is already a server dep.
- **`config.youtubeApiKey` / `config.gemini` / `config.dataforseo`** all already present (`config/index.ts:64/7/66`).
- **`youtube-data.ts searchVideos(query, {order, maxResults, relevanceLanguage})` + `getVideoStats(ids)` are wired** (Phase 2/4) — the monitoring YouTube route reuses them.
- **`dataforseo.ts` already has a `getSerpResults` 501 stub + a `SerpResult` interface** (`dataforseo.ts:11‑17,76‑81`) ready to wire — the SERP path needs only the body fill (R‑D).
- **`generateTextWithGemini` + `parseGeminiJSON`** (`gemini.provider.ts`) — reuse for the monitoring comment + (client) translate.
- **`assertSafeUrl` + the cheerio‑fetch pattern** already exist in `seo.service.ts:193‑266` (Phase 4) — the monitoring scrape service reuses the same SSRF‑guarded fetch shape.
- **`MarketingLanguageTabs`** (Phase 2) — reuse for the language row in Monitoring (CF's monitoring had a bespoke language tab row with an inline "+ 언어 추가" dialog → reuse the Phase‑2 component; editing target languages already lives in settings `TargetLanguagesSection`).
- **Sidebar nav items already exist** (`Sidebar.tsx:23` monitoring / `:27` ads / `:39` strategy) + TopBar titles (`TopBar.tsx:10/11/15`). **Phase 5 swaps route elements only** — no nav work.
- **The `CompetitorsDashboard` (Phase 4) already exists** with 2 tabs — Phase 5 **adds** the 3rd SERP tab + the `useCompetitorSerp` hook; no new dashboard.

So Phase 5's real work is: **(A)** 1 server disk‑list endpoint + a `StrategyImportDialog` + a `StrategyDashboard` (iframe viewer) + 1 page + route swap — reusing the already‑ported parser + `useUpdateProject`; **(B)** ~6 server‑proxy monitoring endpoints (1 scrape‑search service + youtube + instagram + comment) + the `mkt_monitoring_keywords` supabase‑direct hooks + the `MonitoringDashboard` + page + route swap; **(C)** a client‑only `AdsDashboard` + page + route swap (one supabase read); **(D)** wire `getSerpResults` (DataForSEO) + 1 endpoint + 1 hook + the 3rd tab on the existing `CompetitorsDashboard`.

---

## 2. CF → Tangobook mapping

| ContentFlow | Tangobook (Phase 5) | Why |
|---|---|---|
| `app/(dashboard)/{strategy,monitoring,ads}/page.tsx` (project guard → dashboard) | `pages/{StrategyPage,MonitoringPage,AdsPage}.tsx` (project guard → `<XDashboard projectId/>`) | Mirror `IdeasPage`/`PublishPage`/`CompetitorsPage` guard. |
| `useProjectStore()` (projects + selectedProjectId) | `useProject(id)` (TanStack) + `ui-store.selectedProjectId` | House rule: Zustand = UI only. |
| `useProjectStore(s => s.importStrategy)` → supabase `.update({imported_strategy})` | **`useUpdateProject(projectId).mutate({ imported_strategy })`** (already built) | Owner‑row JSONB write, RLS auto‑satisfied (Phase‑2 `saved_keywords` posture). |
| `GET /api/strategy/templates` (`fs.readdir(public/strategy-templates)`, returns `{templates}`) | **`GET /api/mkt/strategy/templates`** (`fs.readdir(<template dir>)`, house envelope `{success,data:{templates}}`) | Express needs the disk read (R‑A for the dir choice). |
| `POST /api/strategy/import-html` (server cheerio parse) | **DROPPED** — the client parses with the already‑ported `lib/strategy-html-parser.ts` (DOMParser) | No server round‑trip; parse is pure + already ported + tested. §3.1 / O‑1. |
| `<iframe src="/strategy-templates/x.html">` | `<iframe src="/marketing-strategy-templates/x.html">` (client `public/` static, distinct from investor `strategy.html`) | R‑A — avoid collision with the existing `public/strategy.html`. |
| CF monitoring routes return **raw JSON** (`{ items }`, `{ comment }`, bare arrays) | Express **house envelope** `{ success, data }`; `AppError` on failure | Phase 0+ convention. Client hooks unwrap `.data`. |
| `POST /api/monitoring/search/{naver,naver-blog,google-blog}` (cheerio scrape, no creds) | **`POST /api/mkt/monitoring/search`** `{ keyword, language, sources? }` — one endpoint that fans out to the scrape sources server‑side (cheerio) | Consolidate 3 brittle scrape routes behind one server‑proxy; SSRF‑guarded fetch (reuse `assertSafeUrl`). §4.2. |
| `POST /api/monitoring/search/youtube` (YouTube Data key + HTML fallback) | folded into the same `/monitoring/search` (source `youtube`) using the wired `youtube-data.ts` (`searchVideos`+`getVideoStats`); **no HTML fallback** | `config.youtubeApiKey` already server‑side. CF's `ytInitialData` scrape fallback is dropped (brittle); degrade to empty when no key. §4.2 / O‑3. |
| `POST /api/monitoring/search/instagram` (`accessToken`+`igUserId` **in the request body** from the client) | **`POST /api/mkt/monitoring/search`** source `instagram` — server reads `meta_credentials` from the project row via `getSupabaseAdmin()`, calls Graph; **token never on the wire** | R‑1 secret‑safety (closes CF's token‑in‑client smell, same as Phase‑4 Meta). §4.2. |
| `POST /api/monitoring/comment` (raw `GoogleGenAI('gemini-2.0-flash')`) | **`POST /api/mkt/monitoring/comment`** → `generateTextWithGemini(prompt, 3, config.gemini.textModel)` | Tangobook Gemini policy (retry/fallback wrapper). §4.3. |
| CF monitoring keywords in volatile `keywordsPerLang` state | **`mkt_monitoring_keywords`** supabase‑direct hooks (per‑lang via `search_engine`? no — per project; lang handled client‑side) — persisted, user_id stamped | Faithful‑plus (R‑B); CF lost keywords on reload. |
| `AdsDashboard` `supabase.from('publish_records')` | `supabase.from('mkt_publish_records')` (Phase‑3 table) | Table‑name port; same select. §4.4. |
| Competitors `serp` tab → `POST /api/monitoring/search/google-blog` (Google scrape) | **`POST /api/mkt/competitors/serp`** → DataForSEO SERP (`getSerpResults`), degrade to empty | R‑D — faithful intent (SERP for a keyword), safe + stable source. §4.5. |
| `AnalyticsLanguageTabs` (inline edit dialog) | **`MarketingLanguageTabs`** (Phase 2, ko‑pinned, editing deferred to settings) | Reuse; identical to Phase 4 §6.6. |
| CF kebab filenames + `'use client'` + `next/image` | PascalCase, drop `'use client'`, plain `<img>` | Tangobook convention. |

---

## 3. Scope decisions — IN vs OUT/DEFERRED (each with evidence)

### 3.1 Pillar A — Strategy component liveness (the brief's headline trace)

**VERDICT: only 2 of the 13 strategy components are LIVE; the other 11 are DEAD.** Verified by grepping every importer across CF `src/`:

| Component | Importers in CF `src/` | Verdict | Evidence |
|---|---|---|---|
| `strategy-dashboard.tsx` (`StrategyDashboard`) | 1 | **LIVE — IN** | `app/(dashboard)/strategy/page.tsx:4,17` mounts it. It is a **pure iframe template viewer** (`<select>` + `<iframe src>` + 새 창 열기). |
| `strategy-import-dialog.tsx` (`StrategyImportDialog`) | 1 | **LIVE — IN** | `components/sidebar/project-tree.tsx:9,226` mounts it (opened from a per‑project sidebar action). Drives the HTML→`imported_strategy` import. |
| `strategy-hero.tsx` | **0** | **DEAD — OUT** | `grep "from '@/components/strategy/strategy-hero'" src` → 0. |
| `strategy-tabs.tsx` | **0** | **DEAD — OUT** | 0 importers. |
| `strategy-input-form.tsx` | **0** | **DEAD — OUT** | 0 importers. |
| `overview-tab.tsx` | **0** | **DEAD — OUT** | 0 importers. |
| `keyword-tab.tsx` | **0** | **DEAD — OUT** | 0 importers. |
| `content-tab.tsx` | **0** | **DEAD — OUT** | 0 importers. |
| `channel-tab.tsx` | **0** | **DEAD — OUT** | 0 importers. |
| `kpi-tab.tsx` | **0** | **DEAD — OUT** | 0 importers. |
| `topic-table.tsx` | **0** | **DEAD — OUT** | 0 importers. |
| `keyword-table.tsx` | **0** | **DEAD — OUT** | 0 importers. |

> These 11 are the remains of an **abandoned "AI strategy generator"** (the `StrategyInput`/`OverviewData`/`KeywordData`/`ChannelStrategyData`/`ContentStrategyData`/`KpiActionData` types in `types/strategy.ts` describe its 5‑tab output). CF replaced it with the **iframe template viewer** + the **HTML‑import** pipeline. Tangobook ports only what's live + wired. The 11 are scoped **OUT** with evidence (0 importers each). **Do NOT port them.** (Note: Tangobook *already* has the `types/strategy.ts` file from Phase 0 — the dead 5‑tab types are dormant; leave them, do not extend.)

**Strategy‑import trigger + existing Tangobook wiring (verified):**
- CF triggers the dialog from a **per‑project sidebar dropdown** (project‑tree). Tangobook's marketing sidebar (`Sidebar.tsx`) is a flat nav without a per‑project dropdown. **Decision (O‑2):** mount `StrategyImportDialog` as a **button on the `StrategyPage`** itself (header "전략 HTML 임포트" button → opens the dialog) — the most faithful affordance that fits Tangobook's nav. The dialog's "프로젝트에 적용" calls `useUpdateProject(projectId).mutate({ imported_strategy })`.
- Tangobook **already** consumes `imported_strategy` downstream: it is read by `competitors.service.selectRankingKeywords` (the Phase‑4 keyword‑rankings seed) and is on the `Project` type (`database.ts:209`). It is currently only ever **written as `null`** at project creation (`use-projects.ts:85`) — i.e. **no UI writes it yet**. Phase 5's import dialog is the first writer. (CF also reads it in `blog-panel`/`create-content-dialog`/`weekly-report` — those Tangobook ports may wire it later; out of Phase‑5 scope, but the column/type are ready.)

### 3.2 Pillar B — Monitoring sources + persistence

- **Search sources** (each a `source` in the one `/monitoring/search` endpoint):
  - `naver_jisikin` (지식인) + `naver_blog` (N블로그) + `wordpress` (구글블로그) → **HTML scrape** (cheerio), **no credential**. Korean‑only for the two naver sources (CF hides them for non‑ko: `monitoring-dashboard.tsx:84`). **IN.** §4.2.
  - `youtube` → **YouTube Data API** via the wired `youtube-data.ts`. **IN** (drop CF's `ytInitialData` HTML fallback — brittle; degrade to empty when no key). §4.2 / O‑3.
  - `instagram` → **Meta Graph** hashtag search; **server reads `meta_credentials`** (token NEVER in client body — R‑1). **IN**, degrades to empty when no Meta connection. §4.2.
  - `facebook`/`threads` platform **tabs** exist in CF's filter row (`PLATFORMS` `:18‑21`) but **no search route feeds them** (CF only pushes naver/google/instagram/youtube items) — they are display‑only filter tabs that will always be empty. **Faithful:** keep the tabs (harmless), no FB/Threads search route. §O‑3.
- **Comment** → Gemini (`/monitoring/comment`). **IN.** §4.3.
- **Keyword persistence (R‑B faithful‑plus):** CF keeps keywords in `keywordsPerLang` **component state** (lost on reload; `monitoring-dashboard.tsx:68`). The `mkt_monitoring_keywords` table **exists** (Phase 0) and the brief asks to use it. **Decision:** persist keywords **supabase‑direct** (`use-monitoring-keywords.ts`: list/add/remove, RLS, user_id stamp). The feed results stay **transient** (component state — they're live search results, not worth caching, matching CF). This is the one place pillar B touches Supabase directly. §4.6.
  - **Language modeling note:** `mkt_monitoring_keywords` has no `language` column — it has `search_engine ('naver'|'google')`. CF's per‑language keyword sets are a UI concern. **Decision (O‑4):** persist keywords **per project** (not per language); the `MarketingLanguageTabs` selection drives only which sources fire (ko → +naver) and the comment/translate language. The optional CF "translate keywords to lang" affordance is **kept** but operates on the in‑memory selected‑lang view (client Gemini translate via the existing `/api/mkt/ai/generate` SSE — faithful to CF `:113`). Use `search_engine` as the persisted dimension (naver vs google) if a split is desired, else default `'naver'`.

### 3.3 Pillar C — Ads

- **VERDICT: client‑only planning mockup + ONE supabase read.** Verified: `ads-dashboard.tsx` has **no `fetch('/api/...')`** call and **no campaign table** (campaigns are `useState`, `crypto.randomUUID()`, never persisted — `:60,84‑108`). The only backend touch is `supabase.from('publish_records').select(...)` (`:76‑82`) to populate the "발행된 콘텐츠에서 선택" creative picker. **IN as a pure client port** + retarget the read to `mkt_publish_records` (Phase‑3). **No API route, no table, no migration.** §4.4 / O‑5.
- CF's create form has a `⚠️ 추후 Meta/Google Ads API 연동 예정 — 현재는 캠페인 기획/관리용` disclaimer (`:353`) — **keep it** (faithful; sets expectation that there's no live ad spend). Campaign‑detail metrics are all 0 placeholders (`:416‑441`) — faithful.

### 3.4 Pillar D — Competitors SERP

- **VERDICT: add the 3rd "SERP 분석" tab to the EXISTING `CompetitorsDashboard`** (Phase 4, 2 tabs today). The CF `serp` tab (`competitors-dashboard.tsx:274‑321`) backs onto `POST /api/monitoring/search/google-blog` (a Google HTML scrape, `analyzeSERP` `:113`). **Do NOT reproduce the Google scrape** (ToS‑risky + brittle + SSRF). **Replace with DataForSEO SERP** via `/api/mkt/competitors/serp` (R‑D). **IN** (implement, not defer — DataForSEO is already a server credential + `getSerpResults` stub exists). §4.5.
- **Scoped OUT of Phase 5:** nothing from the four pillars is deferred *except* the 11 dead strategy components (§3.1) and the brittle HTML‑scrape *fallbacks* (CF's YouTube `ytInitialData` fallback, and the Google‑scrape SERP which is replaced by DataForSEO). The `import-html` *endpoint* is OUT because the parse moved client‑side (§3.1), not because the feature is dropped.

> **Net new external endpoints:** strategy templates (1, disk) + monitoring search (1, fan‑out) + monitoring comment (1) + competitors SERP (1) = **4 new Express endpoints**. (Strategy import = client‑side parse; ads = client‑only.)

---

## 4. Server design

All under `/api/mkt`, registered in `routes/mkt.routes.ts`, house envelope `res.json({ success, data })`, `AppError(status,msg)` on failure, controllers wrapped in `asyncHandler`. New controllers `controllers/mkt/{strategy,monitoring}.controller.ts` + extend `controllers/mkt/competitors.controller.ts`. New services `services/mkt/{strategy,monitoring}.service.ts` + extend `competitors.service.ts` + wire `external/dataforseo.ts getSerpResults`.

### 4.1 Strategy templates — server disk list (`GET /api/mkt/strategy/templates`)

> **Decision R‑A — template hosting:** serve the per‑project marketing‑strategy HTML files from the **client `public/marketing-strategy-templates/`** directory (distinct name to avoid colliding with the existing investor `public/strategy.html` / `seo-strategy.html` / `strategy-detail.html`). Files are static‑served at `/marketing-strategy-templates/<file>.html` (Vite serves `public/` in dev; bundled into `dist` in prod — verified `app.ts:127‑132` static‑serves `packages/client/dist`).

The **list** endpoint reads that directory from disk (it needs `title`/`description`/`size`/`mtime` metadata that a static GET can't give). Port of CF `strategy/templates/route.ts`:

```ts
// controllers/mkt/strategy.controller.ts
import fs from 'node:fs/promises';
import path from 'node:path';
// Resolve the client public dir relative to the server process.
// Dev: packages/client/public/marketing-strategy-templates ; Prod: packages/client/dist/marketing-strategy-templates
const DEV_DIR  = path.join(process.cwd(), 'packages/client/public/marketing-strategy-templates');
const DIST_DIR = path.join(process.cwd(), 'packages/client/dist/marketing-strategy-templates');

export const strategyTemplates = asyncHandler(async (_req, res) => {
  const dir = process.env.NODE_ENV === 'production' ? DIST_DIR : DEV_DIR;
  let files: string[] = [];
  try { files = (await fs.readdir(dir)).filter((f) => f.endsWith('.html')); }
  catch { files = []; }                       // dir absent → empty list (graceful, not 500)
  const templates = await Promise.all(files.map(async (filename) => {
    const full = path.join(dir, filename);
    const stat = await fs.stat(full);
    const head = (await fs.readFile(full, 'utf-8')).slice(0, 4000);
    const titleMatch = head.match(/<meta\s+name=["']title["']\s+content=["']([^"']+)["']/i)
      || head.match(/<title>([^<]+)<\/title>/i);
    const descMatch = head.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    return {
      filename, title: titleMatch?.[1] ?? filename, description: descMatch?.[1] ?? '',
      size: stat.size, modifiedAt: stat.mtime.toISOString(),
      url: `/marketing-strategy-templates/${filename}`,
    };
  }));
  templates.sort((a, b) => a.title.localeCompare(b.title));
  res.json({ success: true, data: { templates } });
});
```

- **No secret.** **No SSRF** (reads a fixed server‑owned dir, never a user URL). Graceful: missing dir → `{ templates: [] }` (not 500 — the dashboard shows "등록된 마케팅 전략 파일이 없습니다").
- A seed `.gitkeep` (or a single sample template) is committed so the dir exists. (Decision left to the plan; an empty list is a valid graceful state.)

### 4.2 Monitoring search — one server‑proxy fan‑out (`POST /api/mkt/monitoring/search`)

> **Decision:** **one** endpoint (`{ projectId, keyword, language, sources? }`) that fans out to the requested sources server‑side, returning a flat `{ items: FeedItem[] }`. This consolidates CF's 5 separate routes; the client makes **one** call per keyword (CF made up to 4). The server holds all secrets.

```ts
// services/mkt/monitoring.service.ts
export interface FeedItem {
  platform: 'naver_jisikin' | 'naver_blog' | 'wordpress' | 'youtube' | 'instagram';
  id: string; title: string; snippet: string; author: string;
  url?: string; thumbnail?: string; publishedAt?: string; language: string;
  views?: string; engagement?: { likes: number; comments: number };
}
```

Source dispatch (each faithful to its CF route, but SSRF‑guarded + house‑enveloped):
1. **`naver_jisikin`** — `fetch('https://kin.naver.com/search/list.naver?query=…&sort=date')` (UA + `Accept-Language: ko`), `cheerio.load`, map to FeedItem. Korean‑only. Port of `monitoring/search/naver/route.ts`. The HTML‑parse → FeedItem mapper is a **pure `mapJisikinResults($, max)`** (TDD).
2. **`naver_blog`** — `fetch('https://search.naver.com/search.naver?where=blog&query=…&sort=sim')`, cheerio, map. Korean‑only. Pure `mapNaverBlogResults`. Port of `naver-blog/route.ts`.
3. **`wordpress`** (구글블로그) — `fetch('https://www.google.com/search?q=<kw> blog&hl=<lang>&num=N')`, cheerio, map. All languages. Pure `mapGoogleBlogResults`. Port of `google-blog/route.ts`. **R‑8 note:** Google may rate‑limit/serve consent walls server‑side → degrade to `[]` (try/catch per source, never crash the whole search).
4. **`youtube`** — reuse `youtube-data.ts searchVideos(keyword, { relevanceLanguage: language, order:'relevance', maxResults })` + `getVideoStats(ids)`; map to FeedItem (views via `formatViews` 억/만, engagement likes/comments). **No HTML fallback** (drop CF's `ytInitialData` scrape). Degrade to `[]` when `youtubeApiKey` blank (the wired helper throws 502 → catch → `[]`).
5. **`instagram`** — `resolveMetaCredentials(projectId)` (reuse the Phase‑4 resolver via `getSupabaseAdmin()` — `analytics.service.ts`) → `page = pages[0]`; if `page.instagram?.id` → Graph `ig_hashtag_search` then `{hashtagId}/recent_media` (token server‑side) → map. Port of `monitoring/search/instagram/route.ts` **with the token moved off the wire**. Degrade to `[]` when no Meta connection.

- **SSRF:** the scrape targets are **fixed hostnames** (kin.naver.com / search.naver.com / google.com) with only the *query string* user‑controlled — not arbitrary URLs — so the `assertSafeUrl` concern is lower than `/seo/audit`; still, build the URLs server‑side with `encodeURIComponent(keyword)` and a per‑fetch `AbortSignal.timeout(10_000)`.
- **Graceful degradation (mirrors Phase 4):** **per‑source try/catch** → a failing/empty source contributes `[]`; the endpoint always returns `{ success:true, data:{ items } }` (never 500 for a scrape miss). Non‑ko language → naver sources are simply not requested (client omits them; the server also guards). Missing YouTube key / Meta token → those sources return `[]`.

### 4.3 Monitoring comment (`POST /api/mkt/monitoring/comment`)

`{ contentText, platform, tone, language, projectContext? }` → `generateTextWithGemini(prompt, 3, config.gemini.textModel)` → `{ comment }`. Port the CF prompt verbatim (`monitoring/comment/route.ts:21‑37`: platform/tone maps, "sound like a real person, not a bot", language switch). Degrade: missing `GEMINI_API_KEY` → `AppError(502, 'Gemini API 키가 설정되지 않았습니다.')` (the card shows the error; comment button re‑enabled).

### 4.4 Ads — NO server (client‑only)

No controller, no service, no route. The dashboard does **one** supabase‑direct read (`mkt_publish_records` where `status='published'`, ordered by `published_at desc`) via a small client hook (or reuse the Phase‑3 `usePublishRecords(projectId)` filtered to published). Campaigns live in component state (faithful — never persisted). **No backend work.**

### 4.5 Competitors SERP (`POST /api/mkt/competitors/serp`)

> **Decision R‑D — implement via DataForSEO (do NOT defer, do NOT scrape Google).** CF scrapes Google HTML (ToS‑risky, brittle, SSRF). DataForSEO is already a server credential (`config.dataforseo`) and `dataforseo.ts` already exposes a `getSerpResults` 501 stub + `SerpResult` type — fill it.

```ts
// external/dataforseo.ts — wire the existing 501 stub
export async function getSerpResults(keyword: string, locationCode = 2410, languageCode = 'ko'): Promise<SerpResult[]> {
  const { login, password } = config.dataforseo;
  if (!login || !password) throw new AppError(502, 'DataForSEO 자격 증명이 설정되지 않았습니다.');
  const auth = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
  const body = [{ keyword, location_code: locationCode, language_code: languageCode, depth: 10 }];
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
    method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new AppError(502, `DataForSEO SERP 조회 실패 (${res.status})`);
  const json = await res.json() as { tasks?: Array<{ result?: Array<{ items?: RawSerpItem[] }> }> };
  return mapSerpResults(json.tasks?.[0]?.result?.[0]?.items ?? []);   // PURE mapper (TDD)
}
```

- `competitors.service.ts` adds `serpAnalysis(keyword, language)` → `getSerpResults` → maps to the dashboard's `SerpResult` view‑model (`{ id, title, url, snippet, author }` — `author` = `domain`/`breadcrumb`). The DataForSEO‑row → view‑model mapper (`mapSerpResults`) is **pure** (TDD).
- Controller `competitorsSerp` `{ keyword, language? }` → `AppError(400)` if no keyword → `res.json({ success, data: { items } })`. Client hook `useCompetitorSerp()` is a **transient mutation** (Phase‑4 competitor posture) using the existing `postMktGraceful` → returns `[]` on 502 (DataForSEO absent) so the tab shows the empty state.
- **Degrade:** no DataForSEO creds → 502 → empty state "DataForSEO 연결이 필요합니다 (SERP 분석)".

### 4.6 Monitoring keywords — supabase‑direct (client hooks, not server)

`mkt_monitoring_keywords` (exists). Client hook `use-monitoring-keywords.ts` (parallels Phase‑3 `use-publish-records.ts`): `useMonitoringKeywords(projectId)` (list, `mktKeys.monitoringKeywords(projectId)`), `useAddMonitoringKeyword` / `useRemoveMonitoringKeyword` (mutations → invalidate). **Every insert stamps `user_id`** (`getCurrentUserId()` → row, the Phase‑1 gotcha (a)) to satisfy `with check (user_id = auth.uid())`. `search_engine` defaults `'naver'`; `is_golden`/`category`/`sort_order` optional. This is **server data → TanStack cache** (not Zustand).

### 4.7 New routes (register in `routes/mkt.routes.ts`)

```ts
// ── Strategy (template viewer — disk list; import parse is client-side) ──
router.get('/strategy/templates', strategyTemplates);
// ── Monitoring (server-proxy; scrape + youtube + ig-token-server-side + gemini) ──
router.post('/monitoring/search',  monitoringSearch);
router.post('/monitoring/comment', monitoringComment);
// ── Competitors SERP (3rd tab — DataForSEO) ──
router.post('/competitors/serp',   competitorsSerp);
```

(4 new rows. No ads route. No `strategy/import-html` route.)

---

## 5. Data model — NO migration; add TS types + query keys only

**No SQL.** All columns/tables exist (§1.2). Add only:

### 5.1 Monitoring TS types

```ts
// types/database.ts — NEW (the table exists; only the interface is missing)
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

// types/analytics.ts (or a new types/monitoring.ts) — view-models
export interface MonitoringFeedItem {
  platform: 'naver_jisikin' | 'naver_blog' | 'wordpress' | 'youtube' | 'instagram';
  id: string; title: string; snippet: string; author: string;
  url?: string; thumbnail?: string; publishedAt?: string; language: string;
  views?: string; engagement?: { likes: number; comments: number };
}
export interface StrategyTemplateMeta {
  filename: string; title: string; description: string;
  size: number; modifiedAt: string; url: string;
}
export interface SerpResultItem { id: string; title: string; url: string; snippet: string; author: string; }
```

(`ImportedStrategy`/`ImportedKeyword`/`ImportedCategory`/`ImportedTopic` already exist in `types/analytics.ts:50‑79` — reuse. The strategy import dialog's `ParseResult` is `lib/strategy-html-parser.ts`'s exported type — reuse.)

### 5.2 New query keys (`api/queries.ts`)

Extend the flat `mktKeys` object (after `youtubeChannel`, `:46`):

```ts
strategyTemplates:   ()               => ['mkt', 'strategy', 'templates'] as const,
monitoringKeywords:  (projectId: string) => ['mkt', 'monitoring', 'keywords', projectId] as const,
```

- `strategyTemplates` (disk list) + `monitoringKeywords` (table) are **cached queries**. The **monitoring feed**, the **comment**, and the **SERP** results are **transient mutations** (not cached — live search / one‑shot, matching CF + the Phase‑2/4 ideas/competitor posture) → **NOT** in `mktKeys`.

---

## 6. Client — component tree

All under `.marketing-scope`; reuse Phase‑0 UI primitives (`ui/button`, `ui/input`, `ui/dialog`, `ui/select`, …) + `lib/utils.cn` + lucide icons. PascalCase. Korean strings + `break-keep` on narrow Korean text (RULE). Reuse `MarketingLanguageTabs` (Phase 2).

```
features/marketing/components/
  strategy/                          NEW directory
    StrategyDashboard.tsx       NEW  — header (FileText + project name + 임포트 button) + <select> templates + <iframe src> + 새 창 열기 (port strategy-dashboard.tsx)
    StrategyImportDialog.tsx    NEW  — 템플릿 선택 | 파일 업로드 tabs → parseStrategyHtml (client lib) → preview (k/cat/topic counts + golden chips + category cards) → "프로젝트에 적용" → useUpdateProject({imported_strategy}) (port strategy-import-dialog.tsx)
  monitoring/                        NEW directory
    MonitoringDashboard.tsx     NEW  — MarketingLanguageTabs + keyword chips (persisted) + translate + 검색 + platform filter tabs + feed cards + AI 댓글 (port monitoring-dashboard.tsx, 491 LOC)
    MonitoringFeedCard.tsx      NEW  — (extracted) one feed item: header (icon/title/author/views/engagement) + snippet + thumbnail + AI-comment block (생성/재생성/복사)
  ads/                               NEW directory
    AdsDashboard.tsx            NEW  — MarketingLanguageTabs + platform tabs (Meta/YouTube) + 4 overview cards + create-campaign form (published-records picker) + campaign list + detail (port ads-dashboard.tsx, 449 LOC)
  competitors/
    CompetitorsDashboard.tsx    EDIT — add 3rd tab 'serp' (SERP 분석): keyword input → useCompetitorSerp → top-N list (port the CF serp tab :274-321)
api/
  use-monitoring.ts             NEW  — useMonitoringSearch (mutation, per-keyword fan-out) + useMonitoringComment (mutation)
  use-monitoring-keywords.ts    NEW  — useMonitoringKeywords (query) + useAddMonitoringKeyword / useRemoveMonitoringKeyword (mutations, user_id stamp)
  use-strategy-templates.ts     NEW  — useStrategyTemplates (query → GET /strategy/templates)
  use-competitors.ts            EDIT — add useCompetitorSerp (transient mutation → /competitors/serp)
  queries.ts                    EDIT — add strategyTemplates + monitoringKeywords keys
types/
  database.ts                   EDIT — add MonitoringKeyword
  analytics.ts (or monitoring.ts) EDIT — MonitoringFeedItem / StrategyTemplateMeta / SerpResultItem
pages/
  StrategyPage.tsx              NEW  — project guard → <StrategyDashboard projectId/>
  MonitoringPage.tsx            NEW  — project guard → <MonitoringDashboard projectId/>
  AdsPage.tsx                   NEW  — project guard → <AdsDashboard projectId/>
index.ts                        EDIT — export the 3 pages
router/index.tsx                EDIT — :321 monitoring, :325 strategy, :326 ads → 3 pages (+ imports)
public/marketing-strategy-templates/.gitkeep  NEW — template dir (R-A)
```

### 6.1 `StrategyDashboard` + `StrategyImportDialog`
- `StrategyDashboard`: `useStrategyTemplates()` → `<select>` of titles + `<iframe src={selected.url}>` (full‑height, `key={filename}`) + 새 창 열기 link + a header **"전략 HTML 임포트"** button (O‑2) → opens `StrategyImportDialog`. Empty state "등록된 마케팅 전략 파일이 없습니다 — `public/marketing-strategy-templates/`" (faithful to CF `:96‑100`, path updated).
- `StrategyImportDialog`: two modes (템플릿 선택 / 파일 업로드). **Parse runs client‑side** with the **already‑ported** `parseStrategyHtml` (`lib/strategy-html-parser.ts`): template mode fetches the template URL → `.text()` → parse; upload mode reads the `File` → `.text()` → parse. Preview = 3 count cards (키워드/카테고리/주제) + golden‑keyword chips + category cards (port `:213‑256`). "프로젝트에 적용" → `useUpdateProject(projectId).mutate({ imported_strategy: { importedAt, sourceFileName, keywords, categories } })` (replaces CF's `importStrategy`). Errors from `parseStrategyHtml` (unsupported HTML) → red banner.

### 6.2 `MonitoringDashboard` (the big one, 491 LOC)
- `MarketingLanguageTabs` (ko‑pinned, drives `selectedLang`) — replaces CF's bespoke lang row + inline "언어 추가" dialog (editing deferred to settings, faithful‑enough; same as Phase 4 §6.6).
- **Keyword chips** read from `useMonitoringKeywords(projectId)` (persisted) + add/remove via the mutations (user_id stamp). (CF kept them in `keywordsPerLang` state; Tangobook persists — R‑B. The per‑lang split collapses to per‑project; `selectedLang` drives sources/comment only — O‑4.)
- **번역** button (non‑ko tabs): client Gemini translate of ko keywords → fills the selected‑lang **in‑memory** view (faithful to CF `:106‑125`, via the existing `/api/mkt/ai/generate` SSE `fetchAiGenerate`). (Persisting translated keywords is optional; default = in‑memory, matching CF's transient translate.)
- **🔍 검색**: for each current keyword, `useMonitoringSearch().mutateAsync({ projectId, keyword, language, sources })` (sources = ko → all; non‑ko → omit naver) → accumulate `items` into per‑lang feed state (transient). The mapping/accumulation is faithful to CF `handleSearch` (`:127‑193`) but **one** request per keyword instead of 4.
- **Platform filter tabs** (전체/지식인/N블로그/구글블로그/인스타/페이스북/스레드) with counts; naver tabs hidden for non‑ko (`:84`). FB/Threads tabs present but always empty (§3.2 / O‑3).
- **Feed cards** (`MonitoringFeedCard`): header (platform icon, title link, author, published‑ago via `formatPublished`, views, engagement) + snippet + thumbnail (youtube 28×16, else 16×16) + **AI 댓글** block: `useMonitoringComment().mutate(...)` → comment text + 복사/재생성 (port `:376‑476`).
- The bottom "🔔 알림 설정" strip is a **static display** (CF `:482‑488`, no backend) — keep as‑is (faithful, harmless).

### 6.3 `AdsDashboard` (449 LOC, client‑only)
- `MarketingLanguageTabs` + Meta/YouTube platform tabs + 4 overview cards (총지출/노출/클릭/전환, computed from campaign state) + create‑campaign form (name/budget/content‑type/targeting) + campaign list + campaign detail (6 metric placeholders). All campaigns in `useState` (faithful — never persisted). **One supabase read**: published records (`mkt_publish_records`, `status='published'`) for the "발행된 콘텐츠에서 선택" picker (retarget CF's `publish_records` → `mkt_publish_records`; reuse Phase‑3 `usePublishRecords` filtered, or a small inline query). `formatNumber` (억/만) + `formatCurrency` (₩) ported. Keep the `⚠️ 추후 … API 연동 예정` disclaimer (`:353`).
- **R‑9‑style note:** CF placeholders use customer‑flavored sample copy ("성장클리닉 인지도 캠페인", "성장클리닉, 키성장") — **replace placeholders with neutral copy** (e.g. "브랜드 인지도 캠페인") so no real customer wording ships. Minor delta.

### 6.4 `CompetitorsDashboard` — add the SERP tab (EDIT, not new)
- The Phase‑4 dashboard has `TABS = [{gap},{keywords}]`. **Add `{ id: 'serp', label: 'SERP 분석' }`** + a tab body (port CF `:274‑321`): keyword `<input>` + "SERP 분석" button → `useCompetitorSerp().mutateAsync({ keyword, language })` → top‑N list (rank number + title link + author/domain + snippet). Empty state "키워드를 입력하고 SERP 분석을 실행하세요"; loading spinner; on 502 (no DataForSEO) the graceful hook returns `[]` → empty state. The `selectedLang` for SERP comes from… (CompetitorsDashboard currently has no `MarketingLanguageTabs` — pass `'ko'` default, or add the tabs if desired; keep minimal — default `'ko'`, faithful to CF which hardcoded `language:'ko'` for the SERP scrape `:116`).

### 6.5 Pages (project guard)
Each page: no `ui-store.selectedProjectId` → centered "프로젝트를 선택하세요"; else `<XDashboard projectId={selectedProjectId} />`. Mirrors `IdeasPage`/`CompetitorsPage`.

---

## 7. Settings — nothing new (verify only)

- **Strategy** needs no settings (templates are files on disk; import writes `imported_strategy`).
- **Monitoring IG** reuses `meta_credentials` (edited in the existing `ChannelConnectionsSection`, tab "채널연동") — same shape the Phase‑4 `resolveMetaCredentials` reads. No new settings.
- **Monitoring YouTube** reuses `config.youtubeApiKey` (server env) — no per‑project setting.
- **SERP** reuses `config.dataforseo` (server env) — no per‑project setting.
- **Ads** needs no settings (planning mockup).

So Phase 5 adds **zero settings UI**. (Verify the resolvers/config read the same shapes — they do, all reused from Phase 4.)

---

## 8. Sub‑phasing 5a / 5b / 5c + what's testable

> **Recommended split** (each independently shippable behind its placeholder, like Phase 3/4):

### 5a — 전략 (Strategy) — smallest, mostly reuse
Server disk‑list endpoint + the iframe viewer + the import dialog (reusing the already‑ported parser + `useUpdateProject`) + page + route swap (`:325`). Lowest risk.
1. `strategy.controller.ts` (`strategyTemplates` disk list) + route + `public/marketing-strategy-templates/.gitkeep`. 2. `use-strategy-templates.ts` (query). 3. `StrategyDashboard` + `StrategyImportDialog` (client parse) + `StrategyPage`. 4. Route swap.

**Testable (TDD):**
- **`strategyTemplates`** dir handling: dir absent → `{ templates: [] }` (no throw); title/description regex extraction from a fixture HTML head (mockable `fs`). (Light — the bulk is the existing pure `parseStrategyHtml`, already tested client‑side; the dialog reuses it.)

### 5b — 모니터링 (Monitoring) — the biggest
The 2 monitoring endpoints + the scrape/youtube/ig/comment service + the `mkt_monitoring_keywords` hooks + the dashboard + page + route swap (`:321`). Most pure‑testable logic (the scrape‑HTML → FeedItem mappers).
5. `monitoring.service.ts`: per‑source scrape + `mapJisikin/NaverBlog/GoogleBlog` (pure) + youtube reuse + ig (resolveMetaCredentials) + comment. 6. `monitoring.controller.ts` (`monitoringSearch` + `monitoringComment`) + 2 routes. 7. `types/database.ts` `MonitoringKeyword`; `use-monitoring-keywords.ts` (supabase‑direct, user_id stamp). 8. `use-monitoring.ts` (search + comment mutations). 9. `MonitoringDashboard` + `MonitoringFeedCard` + `MonitoringPage`; route swap.

**Testable (TDD):**
- **`mapJisikinResults` / `mapNaverBlogResults` / `mapGoogleBlogResults`** — given fixture HTML strings (`cheerio.load`), assert the FeedItem array (title/url/snippet/author + the URL‑host filters: jisikin keeps `kin.naver.com`, nblog keeps `blog.naver.com`, google excludes `google.com`). The cleanest pure units in the phase.
- **`use-monitoring-keywords`** (light render test, mocked supabase): add stamps `user_id`; remove/list unwrap.
- **`formatViews`** (억/만/raw) helper table test (shared with the youtube source mapper).

### 5c — 광고 + 경쟁사 SERP — client‑only ads + the DataForSEO SERP tab
10. `AdsDashboard` (client‑only, neutral sample copy) + `AdsPage`; route swap (`:326`). 11. `dataforseo.ts getSerpResults` (wire) + `mapSerpResults` (pure) + `competitors.service.serpAnalysis` + `competitorsSerp` controller + `/competitors/serp` route. 12. `use-competitors.ts` `useCompetitorSerp` (mutation) + add the SERP tab to `CompetitorsDashboard`.

**Testable (TDD):**
- **`mapSerpResults`** — given a stub DataForSEO `items[]` (`{ type:'organic', rank_group, title, url, description, breadcrumb, domain }`), assert the `SerpResultItem[]` view‑model (id/title/url/snippet/author, filter to organic, top‑N).
- Ads = **mechanical UI port** (verified by typecheck + build + manual render; campaign math `formatNumber`/`formatCurrency` can get a tiny pure test).

> **No‑creds graceful states (manual / render‑test):** every dashboard renders without crash when creds are absent — strategy (no templates), monitoring (scrape sources may be empty / no YouTube key / no Meta / no Gemini → empty feed + comment error), SERP (no DataForSEO → empty). Live‑creds E2E (real Meta token, real DataForSEO SERP, live scrape) is a **deferred operator checklist** (no creds in CI — same policy as Phase 1–4).

---

## 9. Open items — resolved

| # | Question | Resolution |
|---|---|---|
| O‑1 | Port CF's server `import-html` endpoint? | **NO** — the HTML parse is **already ported client‑side** (`lib/strategy-html-parser.ts`, DOMParser, tested). The dialog parses in‑browser; the write is `useUpdateProject({imported_strategy})`. Only the **template list** endpoint is server‑side (disk read). §3.1 / §4.1. |
| O‑2 | Where to trigger `StrategyImportDialog`? | CF opens it from a per‑project sidebar dropdown (`project-tree.tsx:226`). Tangobook's sidebar is flat → mount the trigger as a **header button on `StrategyPage`**. §6.1. |
| O‑3 | Which monitoring sources/fallbacks? | IN: jisikin/nblog/googleblog (scrape, no creds) + youtube (Data API) + instagram (Graph, token server‑side). **OUT:** CF's YouTube `ytInitialData` HTML fallback (brittle); FB/Threads have no search route (display‑only tabs, always empty — faithful). §3.2. |
| O‑4 | Monitoring keyword persistence + language modeling? | Persist **per project** in `mkt_monitoring_keywords` (supabase‑direct, user_id stamp) — faithful‑plus over CF's volatile state (R‑B). `MarketingLanguageTabs` selection drives sources + comment language only (the table has `search_engine`, not `language`). Feed results stay transient. §3.2 / §4.6. |
| O‑5 | Is Ads a pure mockup? | **Almost** — client‑only campaigns (no API, no table) **+ one** supabase read of published records for the creative picker (`ads-dashboard.tsx:76`). Port client‑only + retarget `publish_records`→`mkt_publish_records`. No migration. §3.3 / §4.4. |
| O‑6 | Competitors SERP — scrape vs DataForSEO vs defer? | **DataForSEO SERP** (`/api/mkt/competitors/serp`, wire the existing `getSerpResults` 501 stub). Faithful intent (keyword→top‑10), safe + stable, credential already server‑side; degrade to empty. **Not** a Google scrape (ToS/brittle/SSRF), **not** deferred. §3.4 / §4.5 / R‑D. |
| O‑7 | Migration needed? | **NONE.** `imported_strategy` + `mkt_monitoring_keywords` + `mkt_publish_records` all exist; ads/SERP need no table. Firmest "no migration" of any phase. §1.2. |
| O‑8 | Strategy template hosting (avoid investor‑deck collision)? | **Client `public/marketing-strategy-templates/`** (distinct from `public/strategy.html`/`seo-strategy.html`), static‑served at `/marketing-strategy-templates/*.html`; the **list** endpoint `fs.readdir`s it (dev: client `public/`, prod: client `dist/`). R‑A. §4.1. |
| O‑9 | New deps? | **NONE.** cheerio (server) already added in Phase 4; DataForSEO/YouTube/Gemini/Supabase all wired. No new client dep (no recharts/etc.). |

---

## 10. Test plan (summary)

**Pure logic — TDD unit (Vitest, colocated `__tests__`):**
- **Monitoring HTML→FeedItem mappers** (`mapJisikinResults` / `mapNaverBlogResults` / `mapGoogleBlogResults`) — fixture HTML → FeedItem arrays + URL‑host filters (§8 5b).
- **`mapSerpResults`** (DataForSEO row → `SerpResultItem`) — stub `items[]` → view‑model, organic filter, top‑N (§8 5c).
- **`strategyTemplates`** dir handling — absent dir → `[]`; title/description regex from fixture head (mock `fs`).
- **`formatViews`** (억/만) + ads `formatNumber`/`formatCurrency` helpers.
- (`parseStrategyHtml` is **already tested** client‑side — reused as‑is.)

**Graceful‑degradation tests:** monitoring search returns `{ items: [] }` (not 500) when a source fails / creds absent; comment 502 on no Gemini; SERP `[]` on no DataForSEO; templates `[]` on absent dir; each dashboard renders its empty/error state without crash.

**External / UI — manual (deferred operator checklist, no creds in CI):**
- Live IG monitoring (real Meta token in `meta_credentials`), live YouTube monitoring (real `YOUTUBE_DATA_API_KEY`), live scrape (지식인/N블로그/구글블로그 may rate‑limit server‑side), live Gemini comment, live DataForSEO SERP, real strategy HTML import → `imported_strategy` populated. `pnpm typecheck` + marketing/server suites green.

---

## 11. Risks & gotchas

- **R‑1 — Meta token security (HIGH, the #1 invariant).** CF passes `accessToken`+`igUserId` **in the client→server body** for IG monitoring (`monitoring-dashboard.tsx:178‑183`, `instagram/route.ts:4`). The port **closes this**: the client sends only `{ projectId, keyword }`; the server reads `meta_credentials` via `getSupabaseAdmin()` (Phase‑4 `resolveMetaCredentials`). The token **never** reaches the browser, is **never** `VITE_`‑prefixed, and is **never** echoed in any response. The client holds only the presence boolean (`!!project.meta_credentials`) for the IG empty state. Same discipline for all secrets (YouTube key, DataForSEO basic‑auth, Gemini key) — server‑only.
- **R‑A — strategy template dir + investor‑deck collision (MED).** The existing `public/strategy.html`/`seo-strategy.html`/`strategy-detail.html` are **unrelated investor decks**. The CF per‑project marketing‑strategy templates must live in a **separate** dir → `public/marketing-strategy-templates/`. The list endpoint resolves dev (`client/public/…`) vs prod (`client/dist/…`) — the dir is bundled into `dist` at build. Commit a `.gitkeep` so the dir + the static path exist even when empty.
- **R‑B — monitoring keyword persistence + RLS stamp (MED).** Persisting to `mkt_monitoring_keywords` requires `user_id` stamped on insert (the Phase‑1 gotcha (a): `setXxxCards`/`addXxx` don't auto‑stamp). `use-monitoring-keywords.ts` MUST call `getCurrentUserId()` and put `user_id` on the row or the `with check (user_id = auth.uid())` insert fails. The `unique(project_id, keyword, search_engine)` constraint → add‑duplicate must upsert/ignore (or guard client‑side).
- **R‑8 — scrape fragility + SSRF + rate‑limiting (MED).** The 3 scrape sources hit fixed public search pages (kin.naver.com / search.naver.com / google.com) with only the query user‑controlled (lower SSRF than `/seo/audit`, but still build URLs server‑side + `AbortSignal.timeout`). Google especially may serve a consent wall / 429 to a datacenter IP → the source degrades to `[]` (per‑source try/catch). Scraping selectors are brittle (CF already has 2 fallback strategies per source — port them). Document: monitoring scrape is best‑effort, not guaranteed.
- **R‑D — DataForSEO SERP cost + creds (MED).** The SERP `live/advanced` endpoint costs DataForSEO credits per call (more than `search_volume`). It's gated behind an explicit "SERP 분석" button (no auto‑fire) + the transient‑mutation posture (no caching loop). Degrades to empty when `config.dataforseo` absent. Location/language default KR/ko (faithful to CF's hardcoded `language:'ko'`).
- **R‑9 — customer‑flavored sample copy (LOW).** CF ads placeholders use "성장클리닉" wording (`ads-dashboard.tsx:190/342/353` area) and CF monitoring seeds "소아성장"/"성장호르몬" keywords (`:69`). Replace ads sample copy with neutral text; monitoring's default keywords can be empty or generic ("브랜드", "마케팅") since keywords are now persisted (don't ship a customer's seed terms).
- **R‑G — Gemini comment model (LOW).** CF uses raw `GoogleGenAI('gemini-2.0-flash')`; the port uses `generateTextWithGemini(prompt, 3, config.gemini.textModel)` (retry/fallback to flash‑lite on overload) — Tangobook policy. The prompt is ported verbatim.
- **R‑E — monitoring search latency (LOW/MED).** Per keyword, the server may fan out to 4–5 sources sequentially; multiple keywords × sources can be slow. **Mitigation:** the **client** loops keywords (one request each, as CF does) so the UI can stream results per keyword; within a request, the server can `Promise.allSettled` the sources. Keep per‑fetch 10s timeouts so one slow source doesn't stall the request.
- **R‑F — `imported_strategy` is the first writer (LOW).** No Tangobook UI writes `imported_strategy` today (only `null` at creation). The import dialog is the first writer; confirm `useUpdateProject` round‑trips the JSONB (it already round‑trips `funnel_config`/`ga4_config`/`saved_keywords`, so it works). Downstream consumers (`selectRankingKeywords`) already read it.

---

## 12. Sequenced implementation checklist (for the plan)

> **Sub‑phase split: 5a (strategy) → 5b (monitoring) → 5c (ads + SERP).** Each independently shippable behind its placeholder. 5a is smallest (reuses the ported parser). 5b carries the most logic (scrape mappers + keyword persistence). 5c is the client‑only ads + the DataForSEO SERP tab. **R‑1 secret‑safety** (Meta token / YouTube key / DataForSEO / Gemini all server‑only) is the #1 invariant — covered by the IG‑route server‑read + the Chunk‑final greps. **Do not skip the TDD chunks (5b mappers, 5c `mapSerpResults`).**

### 5a — 전략 (Strategy)
1. `strategy.controller.ts` (`strategyTemplates` disk list, dev/prod dir, graceful empty) + register `GET /strategy/templates` + commit `public/marketing-strategy-templates/.gitkeep`. **Unit‑test the dir handling.**
2. `types/analytics.ts` (or `monitoring.ts`): add `StrategyTemplateMeta`; `api/queries.ts`: add `strategyTemplates` key; `api/use-strategy-templates.ts` (query).
3. `components/strategy/StrategyDashboard.tsx` (iframe viewer + 임포트 button) + `StrategyImportDialog.tsx` (**client** `parseStrategyHtml` + `useUpdateProject({imported_strategy})`).
4. `pages/StrategyPage.tsx` + `index.ts`; swap `router/index.tsx:325` → `<StrategyPage/>`.

### 5b — 모니터링 (Monitoring)
5. `monitoring.service.ts`: `mapJisikin/NaverBlog/GoogleBlog` (pure) + per‑source SSRF‑guarded fetch + youtube reuse (`searchVideos`+`getVideoStats`) + instagram (`resolveMetaCredentials` → Graph, token server‑side) + `monitoringComment` (Gemini). **Unit‑test the 3 mappers + `formatViews`.**
6. `monitoring.controller.ts` (`monitoringSearch` `{projectId,keyword,language,sources?}` + `monitoringComment`) + register `POST /monitoring/search` + `/monitoring/comment`.
7. `types/database.ts`: add `MonitoringKeyword`; `queries.ts`: add `monitoringKeywords` key; `api/use-monitoring-keywords.ts` (supabase‑direct list/add/remove, **user_id stamp**). **Light render test (mocked supabase).**
8. `api/use-monitoring.ts` (`useMonitoringSearch` + `useMonitoringComment` mutations, transient).
9. `components/monitoring/MonitoringDashboard.tsx` (port 491 LOC; `MarketingLanguageTabs`; persisted keywords) + `MonitoringFeedCard.tsx`; `pages/MonitoringPage.tsx`; swap `router/index.tsx:321`.

### 5c — 광고 + 경쟁사 SERP
10. `components/ads/AdsDashboard.tsx` (client‑only port, neutral sample copy, `mkt_publish_records` read) + `pages/AdsPage.tsx`; swap `router/index.tsx:326`.
11. `external/dataforseo.ts`: wire `getSerpResults` + `mapSerpResults` (pure); `competitors.service.ts`: `serpAnalysis`; `competitors.controller.ts`: `competitorsSerp`; register `POST /competitors/serp`. **Unit‑test `mapSerpResults`.**
12. `types`: add `SerpResultItem`; `api/use-competitors.ts`: `useCompetitorSerp` (transient mutation); `components/competitors/CompetitorsDashboard.tsx`: **add the 3rd SERP tab**.

### Final gates + docs
13. **Automated gates:** `pnpm --filter @tangobook/server test mkt` (incl. new `monitoring.service` + `strategy.controller` + `dataforseo`/`competitors.service` SERP tests; ≥ 3 new server test files) + `pnpm --filter @tangobook/client test marketing` (incl. new monitoring‑keyword/mapper tests). **Assert growth** vs the Phase‑4 baseline. `pnpm typecheck` (shared/server/client) PASS. `pnpm lint` no new errors. `pnpm --filter @tangobook/client build` PASS.
14. **Scope greps:** `router/index.tsx` `:321/325/326` → `<MonitoringPage/>`/`<StrategyPage/>`/`<AdsPage/>` (all 3 placeholders gone — **no `PlaceholderPage` left in the `/marketing` tree**). `grep monitoring/search|monitoring/comment|strategy/templates|competitors/serp routes/mkt.routes.ts` → **4 routes**. `grep "strategy/import-html"` → **0** (parse client‑side). `grep "pageAccessToken\|accessToken\|meta_credentials\|YOUTUBE_DATA_API_KEY\|DATAFORSEO" packages/client/src` → only presence booleans / no secret in any client body (R‑1). `grep "ytInitialData\|google.com/search" packages/client/src` → 0 (scrape server‑side only). No `'use client'` / `next/image` in new components.
15. **Manual E2E (deferred operator checklist):** strategy import → `imported_strategy` populated + iframe viewer renders a committed template; monitoring search (scrape + youtube‑key + meta‑token) + AI comment; ads create/list + published‑records picker; competitors SERP tab with DataForSEO; each dashboard's empty/error state with creds unset.
16. **Docs:** update `packages/client/src/features/marketing/CLAUDE.md` (Phase 5 module: strategy/monitoring/ads trees + the 4 new `/api/mkt/{strategy,monitoring,competitors}/*` rows + the `mkt_monitoring_keywords` supabase‑direct hooks + a **Phase 5 Gotchas** subsection: (i) strategy parse is **client‑side** (`lib/strategy-html-parser.ts`) + import writes via `useUpdateProject`; (ii) strategy templates in `public/marketing-strategy-templates/` (R‑A); (iii) monitoring is **server‑proxy** (scrape + youtube key + **Meta token read server‑side**, never on the wire — R‑1); (iv) monitoring keywords **persisted** with `user_id` stamp (R‑B), feed transient; (v) ads is **client‑only** + one `mkt_publish_records` read; (vi) SERP = **DataForSEO** (R‑D), not Google scrape; (vii) the 11 dead CF strategy components scoped OUT); root + worktree `CLAUDE.md` `/marketing` line (Phase 5 done → all phases complete); spec status → COMPLETE. (Memory `marketing-port-contentflow-2026-06-07.md` is outside the repo — update via the "업데이트 하자" workflow, NOT in the plan commits.)
17. `@superpowers:finishing-a-development-branch` — present merge/PR/cleanup options (Phase 5 is the final phase; the marketing port is complete).

---

## 13. Cited references

**ContentFlow (port source, `C:\projects\contentflow\contentflow`) — all read & confirmed**
- `src/components/strategy/strategy-dashboard.tsx` (iframe viewer: `GET /api/strategy/templates` `:25`, `<select>`+`<iframe>` `:52‑93`) · `strategy-import-dialog.tsx` (template/upload modes, `fetch(tpl.url)→/api/strategy/import-html` `:69‑81`, `importStrategy` `:110`, preview `:213‑256`) · **the 11 dead components** (`strategy-hero/tabs/input-form/overview-tab/keyword-tab/content-tab/channel-tab/kpi-tab/topic-table/keyword-table` — **0 importers each**, grep‑confirmed).
- `src/lib/strategy-html-parser.ts` (`parseStrategyHtml`: kwData/topics script arrays + kw-table/topic-table/cycle-item DOM — **already ported to the Tangobook client as DOMParser**).
- `src/app/api/strategy/templates/route.ts` (`fs.readdir(public/strategy-templates)` → `{templates}` `:7‑38`) · `import-html/route.ts` (`parseStrategyHtml(file.text())` → counts `:13‑23` — **dropped**, client parses).
- `src/app/(dashboard)/strategy/page.tsx:4,17` (mounts `StrategyDashboard`) · `src/components/sidebar/project-tree.tsx:9,226` (mounts `StrategyImportDialog`).
- `src/components/monitoring/monitoring-dashboard.tsx` (491 LOC; `keywordsPerLang` state `:68`; `handleSearch` 4‑route fan‑out `:127‑193`; IG token‑in‑body `:178‑183`; naver hidden non‑ko `:84`; `handleTranslate` SSE `:106‑125`; comment `:195‑212`; feed `:376‑476`; static 알림 strip `:482`).
- `src/app/api/monitoring/search/{naver,naver-blog,google-blog}/route.ts` (cheerio scrape, **no creds**, fixed hosts + 2 fallback strategies each) · `youtube/route.ts` (YouTube Data key + `ytInitialData` HTML fallback `:95` — fallback **dropped**) · `instagram/route.ts` (Graph `ig_hashtag_search`+`recent_media`, token in body — **server‑read in port**).
- `src/app/api/monitoring/comment/route.ts` (raw `GoogleGenAI('gemini-2.0-flash')`, platform/tone maps `:7‑18`, prompt `:21‑37`).
- `src/components/ads/ads-dashboard.tsx` (449 LOC; **no fetch**, campaigns `useState` `:60,84`; `supabase.from('publish_records')` `:76‑82`; create form `:183‑361`; `⚠️ API 연동 예정` disclaimer `:353`; `formatNumber`/`formatCurrency` `:45‑54`) · `ads/page.tsx` (guard).
- `src/components/competitors/competitors-dashboard.tsx` (SERP tab `analyzeSERP` → `/api/monitoring/search/google-blog` `:113`, `serp` UI `:274‑321`).

**Tangobook (worktree `feat/marketing-phase0`) — all verified**
- `supabase/migrations/2026-06-07-marketing-schema.sql:60` (`imported_strategy jsonb`), `:393‑406` (`mkt_monitoring_keywords` full schema), `:447` (RLS owner policy) — **all present, NO migration**.
- `packages/client/src/features/marketing/lib/strategy-html-parser.ts` (`parseStrategyHtml` **already ported**, DOMParser, browser‑safe) + `lib/__tests__/strategy-html-parser.test.ts` (already tested).
- `…/types/analytics.ts:50‑79` (`ImportedStrategy`/`ImportedKeyword`/`ImportedCategory`/`ImportedTopic` exist) · `types/database.ts:198` (`target_languages`), `:209` (`imported_strategy`), `:131‑139` (`MetaCredentials`/`MetaPage.pageAccessToken`/`.instagram.id`) — `MonitoringKeyword` interface **missing** (add in code).
- `…/api/use-projects.ts:85` (`imported_strategy: null` at creation — **no UI writer yet**; the import dialog is the first) · `useUpdateProject` (owner‑row JSONB write, reused).
- `…/components/competitors/CompetitorsDashboard.tsx` (Phase 4, 2 tabs — **add SERP tab**) · `api/use-competitors.ts` (`postMktGraceful` + transient mutations — **add `useCompetitorSerp`**).
- `…/api/queries.ts:18‑46` (`mktKeys` flat factory — add `strategyTemplates` + `monitoringKeywords`) · `api/use-analytics.ts:20‑46` (`postMkt`/`postMktGraceful` helpers, reused).
- `…/components/layout/Sidebar.tsx:23/27/39` (monitoring/ads/strategy nav **present**) · `TopBar.tsx:10/11/15` (titles present) — **route swap only, no nav work**.
- `…/components/ideas/MarketingLanguageTabs.tsx` (reuse) · `…/pages/IdeasPage.tsx`/`CompetitorsPage.tsx` (guard pattern) · `…/index.ts:11‑13` (page export pattern).
- `…/router/index.tsx:321/325/326` (3 placeholders to swap; `:322‑324` site‑analysis/meta‑analytics/competitors already live).
- `packages/server/src/services/mkt/external/dataforseo.ts:11‑17,76‑81` (`SerpResult` type + `getSerpResults` **501 stub to wire**) · `youtube-data.ts:53,109,149,167,187` (`searchVideos`/`getVideoStats`/`getChannelInfo`/`searchChannels`/`getChannelVideos` **all wired**) · `naver-searchad.ts:19,75` (HMAC `signNaverRequest`+`searchKeywords` = keyword **volume**, NOT blog search — confirms monitoring naver routes use creds‑free scrape).
- `packages/server/src/services/mkt/seo.service.ts:193‑266` (`assertSafeUrl` + cheerio‑fetch pattern — reused by monitoring scrape) · `analytics.service.ts` (`resolveMetaCredentials` via `getSupabaseAdmin()` — reused by IG monitoring) · `controllers/mkt/seo.controller.ts` + `competitors.controller.ts` (controller pattern to mirror).
- `packages/server/src/config/index.ts:7` (`gemini`), `:64` (`youtubeApiKey`), `:66` (`dataforseo`), `:76` (`supabase.serviceRoleKey`) — all present.
- `packages/server/src/providers/{supabase-admin.provider.ts,gemini.provider.ts}` (`getSupabaseAdmin`/`generateTextWithGemini` — reused) · `routes/mkt.routes.ts` (add 4 rows) · `app.ts:127‑132` (static‑serves `packages/client/dist` — strategy template hosting basis).
- **Format/discipline templates:** `docs/superpowers/specs/2026-06-09-marketing-phase4-analytics-design.md` + `docs/superpowers/plans/2026-06-09-marketing-phase4-analytics.md` (mirrored structure) · `features/marketing/CLAUDE.md` (module conventions: server‑proxy vs supabase‑direct, `.marketing-scope`, `mktKeys`, `{success,data}` envelope, gotchas).
