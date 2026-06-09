# Marketing Phase 2 — 키워드 / 아이디어 (Keyword & Ideas Dashboard) — Design Spec

| | |
|---|---|
| **Date** | 2026‑06‑07 |
| **Branch / worktree** | `feat/marketing-phase0` @ `C:\projects\tangobook\.worktrees\marketing-phase0` |
| **Status** | Spec (no implementation) |
| **Predecessor** | Phase 0 Foundation + Phase 1a–1d (the full content area) — all COMPLETE & committed. |
| **Source app** | ContentFlow (Next.js) `C:\projects\contentflow\contentflow` |
| **Roadmap slot** | Master‑plan **Phase 2 키워드 / 아이디어** (the `/ideas` page). NOT a content channel. Publish/analytics/strategy = Phase 3/4/5 (OUT of scope). |
| **Primary CF source** | `src/components/ideas/ideas-dashboard.tsx` (~1185 lines), `idea-card.tsx`, `trending-feed.tsx`, `src/app/(dashboard)/ideas/page.tsx`, API routes under `src/app/api/{naver,google,ideas}/…` |

---

## 1. Overview

ContentFlow's `/ideas` page is a single hub component (`IdeasDashboard`) with **5 sub‑tabs** that all share one keyword table + one saved‑keyword store:

| Sub‑tab | id | What it does |
|---|---|---|
| **N 키워드 분석** | `naver-kw` | AI generates 30–50 keywords grouped by category → enriches with real **Naver SearchAd** volumes (Korean only). Includes the 🏆 **황금 키워드** (golden‑keyword) discovery flow + AI strategy write‑up. |
| **G 키워드 분석** | `google-kw` | AI generates keywords → enriches with **DataForSEO (Google Ads)** volume/competition/CPC. All languages. |
| **유튜브 유행 분석** | `youtube` | Keyword‑driven **YouTube Data API** trending‑video search (+ Google/Naver trend lists). Click a video → seed an idea. |
| **AI 아이디어** | `ideas` | Topic → Gemini generates one content idea per channel (`IdeaCard`s). |
| **보관함** | `saved` | Pinned keywords table, persisted to `mkt_projects.saved_keywords` (JSONB). |

Phase 2 is a **faithful port** of this page into Tangobook's `/marketing/ideas` route. The stack adapts only as in earlier phases: Next.js → Vite/React‑Router, Zustand `project-store` → TanStack Query hooks + `ui-store`, `/api/*` → `/api/mkt/*`, CF design tokens → `.marketing-scope`.

**This is the cheapest phase so far** because almost all the substrate already exists:

- The sidebar nav item `{ to: '/marketing/ideas', icon: '💡', label: '키워드 / 아이디어' }` is **already present** (`components/layout/Sidebar.tsx:16`).
- The route `{ path: 'ideas', element: <PlaceholderPage title="키워드 / 아이디어" /> }` is **already wired** (`router/index.tsx:309`) — Phase 2 just swaps the element.
- `POST /api/mkt/naver/keywords` + `POST /api/mkt/google/keywords` are **already built & wired** (Phase 1a) — Phase 2 **reuses** them.
- `mkt_projects.saved_keywords jsonb` **already exists** in the schema (migration line 62) — **no migration needed**.
- The external skeletons `naver-datalab.ts searchTrend` ("Phase 2+") and `youtube-data.ts searchVideos/getVideoStats` are pre‑stubbed and just need wiring.
- All required env vars already live in `config` + `.env.example`.

So Phase 2's real work is: **2 new Express endpoints** (ideas generate, ideas trending) + **1 golden‑keyword endpoint**, **wiring 2 external skeletons** (datalab + youtube‑data), the **IdeasDashboard UI** (sub‑tabs / multi‑sort table / golden tiers / idea cards / trending feed), and **saved‑keyword persistence hooks**.

---

## 2. Goals & Non‑Goals

### 2.1 Goals (Phase 2 scope)

- New page `pages/IdeasPage.tsx` rendered at `/marketing/ideas` (replace the placeholder; add to `index.ts` barrel + router).
- `IdeasDashboard` with the **5 sub‑tabs** above, faithful to CF behavior, scoped to the selected project (`ui-store.selectedProjectId`).
- **Language tabs** row derived from `project.target_languages` (ko pinned), reusing `ui-store.selectedLanguage`. The `naver-kw` tab is hidden when the selected language ≠ ko (CF parity, `ideas-dashboard.tsx:603`).
- **N 키워드 분석**: AI keyword map (`useAiGeneration` → Gemini) → Naver volume enrichment via existing `fetchNaverKeywords` (batched 5/req, 300 ms spacing) → category filter + the **multi‑column shift‑click sortable** table + ☆/★ pin.
- **🏆 황금 키워드 discovery**: the `discoverGoldenKeywords` flow — seed (user CSV or AI‑generated) → Naver volumes → relevance filter (Gemini) → **3‑tier classification** (🏆 황금 / 🥇 유망 / 🥈 일반) → Google enrichment → AI strategy write‑up. **Ported as a server endpoint** `POST /api/mkt/keywords/recommend` (see §5.3 + Decision D‑1).
- **G 키워드 분석**: AI keyword map → `fetchGoogleKeywords` enrichment (location/language code mapping) → Google‑specific table.
- **유튜브 유행 분석**: `POST /api/mkt/ideas/trending` (YouTube Data API search+stats, wired from the `youtube-data.ts` skeleton; optional Naver/Google trend columns). Graceful empty when no key.
- **AI 아이디어**: `POST /api/mkt/ideas/generate` (Gemini → one `IdeaCard` per channel). Reachable directly (topic input) and from keyword/trending rows ("콘텐츠 만들기" / video click).
- **보관함**: pin/unpin/clear keywords persisted to `mkt_projects.saved_keywords` via new TanStack hooks (`useSavedKeywords` / `useAddSavedKeyword` / `useRemoveSavedKeyword` / `useClearSavedKeywords`), single‑owner RLS.
- **Type fix**: add `saved_keywords?: SavedKeyword[] | null` to the `Project` interface in `types/database.ts` (column exists in DB; TS type is the only gap).
- **Express**: ADD `/ideas/generate`, `/ideas/trending`, `/keywords/recommend` to `routes/mkt.routes.ts`; new controller `controllers/mkt/ideas.controller.ts`; new service `services/mkt/ideas.service.ts`; **wire** `naver-datalab.ts` + `youtube-data.ts`.

### 2.2 Non‑Goals (explicitly deferred)

| Deferred | Phase |
|---|---|
| Publish queue / scheduling / `mkt_publish_records` | 3 |
| Site analysis, GA4/Meta channel analytics, competitor tracking | 4 |
| Marketing‑strategy import / generation (`/marketing/strategy`) | 5 |
| Ads management | later |
| Wiring "콘텐츠 만들기" to **actually create** a `mkt_contents` row + open the editor | **Optional stretch** (see §6 Open Q‑5). CF's `IdeaCard` `onGenerate`/`onSave` are no‑ops (`ideas-dashboard.tsx:1069`); 1:1 port keeps them no‑op. A Tangobook‑only enhancement may wire them. |
| Porting `src/components/keywords/keyword-analysis-dashboard.tsx` | **NEVER** — it is **DEAD CODE** (defined but never imported; `keywords/page.tsx` just `redirect('/ideas')`). Confirmed via grep: only self‑reference. |
| Naver Datalab **time‑series chart** (the trend ratio graph) | Out — CF's trending tab uses Datalab only for keyword stats fallback, not the time‑series. Wire `searchTrend` only if needed for the trend lists; otherwise leave the SearchAd‑based fallback (CF parity). |

---

## 3. Architecture — how it sits on Phase 0–1

```
features/marketing/
  api/
    queries.ts                 EDIT  — add mktKeys.savedKeywords(projectId)
    use-keywords.ts            REUSE — fetchNaverKeywords / fetchGoogleKeywords (EXISTS, Phase 1a)
    use-projects.ts            REUSE — useProject / useUpdateProject (saved_keywords persists here)
    use-ideas.ts               NEW   — useGenerateIdeas / useTrending (POST /api/mkt/ideas/*)
    use-golden-keywords.ts     NEW   — useDiscoverGoldenKeywords (POST /api/mkt/keywords/recommend)
    use-saved-keywords.ts      NEW   — read+mutate mkt_projects.saved_keywords (TanStack)
  hooks/
    use-ai-generation.ts       REUSE — SSE → /api/mkt/ai/generate (correct endpoint; see Bug B‑1)
  components/
    ideas/                     NEW directory
      IdeasDashboard.tsx       NEW   — 5 sub-tabs hub (port of ideas-dashboard.tsx)
      IdeaCard.tsx             NEW   — port of idea-card.tsx
      TrendingFeed.tsx         NEW   — port of trending-feed.tsx (YouTube + Google/Naver lists)
      KeywordTable.tsx         NEW   — extracted multi-sort sortable table (shared by naver/google/saved)
      GoldenTierCards.tsx      NEW   — 🏆/🥇/🥈 tier summary + AI strategy panel
      MarketingLanguageTabs.tsx NEW  — language row from project.target_languages (ko pinned)
  store/
    ui-store.ts                REUSE — selectedProjectId, selectedLanguage, setSelectedLanguage (EXISTS)
  types/
    database.ts                EDIT  — add Project.saved_keywords + SavedKeyword interface
  pages/
    IdeasPage.tsx              NEW   — project guard + <IdeasDashboard/>
  index.ts                     EDIT  — export IdeasPage

router/index.tsx              EDIT  — line 309: PlaceholderPage → <IdeasPage/>

packages/server/src/
  routes/mkt.routes.ts                   EDIT — add 3 routes
  controllers/mkt/ideas.controller.ts    NEW  — generateIdeas, trending, recommendKeywords
  services/mkt/ideas.service.ts          NEW  — Gemini idea gen + golden-keyword orchestration
  services/mkt/external/naver-datalab.ts WIRE — implement searchTrend (currently 501)
  services/mkt/external/youtube-data.ts  WIRE — implement searchVideos + getVideoStats (currently 501)
  services/mkt/external/naver-searchad.ts REUSE — searchKeywords (EXISTS)
  services/mkt/external/dataforseo.ts     REUSE — getKeywordVolumes (EXISTS)
  providers/gemini.provider.ts            REUSE — generateTextWithGemini (non-streaming, for ideas/golden)
```

### 3.1 Faithful‑port deltas vs ContentFlow

| CF | Tangobook | Why |
|---|---|---|
| `useProjectStore()` (Zustand holds projects + contents + savedKeywords) | `useProject(id)` (TanStack) + `ui-store` (selectedProjectId/Language) + `useSavedKeywords` | House rule: **Zustand = UI state only, server data = TanStack** (root CLAUDE.md). |
| `fetchAiGenerate(prompt, 'gemini-2.5-flash')` called **client‑side** for keyword/seed/relevance/strategy prompts | `useAiGeneration().generate(prompt, model)` for the simple keyword‑map prompts; **golden‑keyword + ideas moved server‑side** (endpoints) | Robustness + secrets stay server‑side; avoids the 4‑hop client orchestration. See D‑1. |
| `fetch('/api/naver/keywords')` returns `{ keywords }` raw | `fetchNaverKeywords()` → `/api/mkt/naver/keywords` returns `{success,data:{keywords}}`, already unwrapped | Phase 1a envelope (`ApiResponse<T>`). |
| `AnalyticsLanguageTabs` (`components/analytics/language-tabs.tsx`) | `MarketingLanguageTabs` (new, thin) | CF's analytics dir was **not** ported; rebuild the ~30‑line tabs row from `target_languages`. |
| Naver competition compared as Korean strings `'낮음'`/`'중간'`/`'높음'` | `fetchNaverKeywords` returns `competition: 'HIGH'|'MEDIUM'|'LOW'` | `naver-searchad.ts mapCompetition` normalizes to enum. **The golden‑keyword tiering predicate must use the enum, not the Korean strings.** (See Risk R‑1.) |
| Gemini model `'gemini-2.5-flash'` / `'gemini-2.0-flash'` hardcoded | server default `config.gemini.textModel` (`gemini-3.1-pro-preview`) with batch fallback `gemini-2.5-flash-lite`; client passes a `TEXT_MODELS` id | Tangobook Gemini policy (root CLAUDE.md). Keep flash‑class for these batch‑ish calls. |

---

## 4. Data model

### 4.1 `saved_keywords` — already a column, only the TS type is missing

`mkt_projects.saved_keywords jsonb` exists (`supabase/migrations/2026-06-07-marketing-schema.sql:62`, "Saved keywords (drift — keyword list saved from ideas module)"). **No migration is required.** Add the matching TS field:

```ts
// types/database.ts — NEW interface (mirrors CF's saved-keyword shape, ideas-dashboard.tsx KeywordItem subset)
export interface SavedKeyword {
  keyword: string;
  category?: string;
  searchIntent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  priority?: 'high' | 'medium' | 'low';
  estimatedVolume?: string;
  difficulty?: string;
  naverMonthly?: number;
  naverPc?: number;
  naverMobile?: number;
  naverComp?: 'HIGH' | 'MEDIUM' | 'LOW';   // enum, not Korean string (delta vs CF)
  googleVolume?: number;
  googleComp?: string;                       // DataForSEO 'LOW'|'MEDIUM'|'HIGH' or numeric→label
  googleCpc?: number;
}

export interface Project {
  // …existing fields…
  saved_keywords: SavedKeyword[] | null;     // ADD (column already exists)
}
```

CF stored `Array<{ keyword; naverMonthly?; naverComp?; googleVolume?; googleComp?; category? }>` (`stores/project-store.ts:110`). We store the richer `SavedKeyword` so the 보관함 table can render all columns; older/leaner rows degrade gracefully (all fields optional).

### 4.2 New query keys

```ts
// queries.ts — extend mktKeys
savedKeywords: (projectId: string) => ['mkt', 'saved-keywords', projectId] as const,
```

Ideas + trending results are **transient** (live in component state, like CF) — they are NOT cached under `mktKeys` and NOT persisted. Only `saved_keywords` is server state.

### 4.3 Persistence path (single‑owner RLS)

`saved_keywords` is a column on the project row, so writes go through the existing `useUpdateProject({ id, updates: { saved_keywords } })` mutation (`use-projects.ts:105`). RLS on `mkt_projects` is `user_id = auth.uid()`; the row already belongs to the owner, so no extra `user_id` stamping is needed (unlike the `mkt_*_cards` insert gotcha). `use-saved-keywords.ts` wraps `useProject` (read) + `useUpdateProject` (write) so callers never hand‑roll the array merge.

---

## 5. Express endpoints to ADD

All under `/api/mkt`, registered in `routes/mkt.routes.ts`, responding with the house envelope `res.json({ success: true, data })` and throwing `AppError(status, msg)` on failure (errorMiddleware). New controller `controllers/mkt/ideas.controller.ts`, new service `services/mkt/ideas.service.ts`.

### 5.1 `POST /api/mkt/ideas/generate`  (Gemini — AI 아이디어)

- **Port of** `src/app/api/ideas/generate/route.ts`.
- **Body**: `{ topic: string, channelTypes?: string[], industry?: string, targetAudience?: string }`.
- **Logic**: build the per‑channel idea prompt (CF's exact prompt, `route.ts:10`), call `generateTextWithGemini(prompt, retries, model)` (`providers/gemini.provider.ts`), extract the JSON array (`parseGeminiJSON` util), return `{ success, data: { ideas, topic } }`.
- **Model**: `config.gemini.textModel` with auto‑fallback (`withGeminiRetry`). CF used `gemini-2.0-flash`; we use the configured model.
- **Degradation**: missing `GEMINI_API_KEY` → `AppError(502, 'Gemini API 키가 설정되지 않았습니다.')`.

### 5.2 `POST /api/mkt/ideas/trending`  (YouTube + trend lists — 유튜브 유행 분석)

- **Port of** `src/app/api/ideas/trending/route.ts`.
- **Body**: `{ keywords: string[], language?: string, period?: 'week'|'month'|'quarter' }`.
- **Logic**:
  1. **YouTube** (when `config.youtubeApiKey` set): for up to 3 keywords, `searchVideos(keyword, {publishedAfter, order:'viewCount', relevanceLanguage, maxResults:5})` then `getVideoStats(videoIds)`; merge snippet+stats, sort by viewCount desc, format views (억/만). **Wire `youtube-data.ts`** (`searchVideos`/`getVideoStats` currently throw 501).
  2. **Naver trends** (ko only, when `config.naverAd` set): reuse `searchKeywords` (SearchAd `/keywordstool`) per CF's fallback (CF's trending route used SearchAd, not Datalab, for the Naver list). Optionally use `naver-datalab.searchTrend` if a true time‑series is wanted (Open Q‑3) — **wire only if needed**.
  3. **Google trends**: CF returns placeholder `{keyword, trend:'rising'}` (no official API). Port as‑is (or omit the column).
- **Response**: `{ success, data: { youtube: YTVideo[], naverTrends: [], googleTrends: [] } }`.
- **Degradation**: each source independently empty when its creds are missing — **never 500 the whole request** (CF returns partials). The controller wraps each source in try/catch and assembles partials.

### 5.3 `POST /api/mkt/keywords/recommend`  (golden keyword — Naver SearchAd + Gemini)

> **Decision D‑1**: CF performs the entire `discoverGoldenKeywords` flow **client‑side** (4 sequential `fetch` round‑trips per seed × N seeds + 2 Gemini calls, `ideas-dashboard.tsx:249‑408`). Tangobook **moves this orchestration server‑side** into one endpoint. Rationale: (a) one client call instead of dozens; (b) Naver/Gemini stay server‑side; (c) easier to unit‑test the pure tiering/filter logic. The CF route file at `src/app/api/keywords/recommend/route.ts` is a **different** (base‑article keyword) flow and is **not** what the dashboard calls — but its name + "AI seed → Naver volume → relevance → tiering" pattern is the right home for our golden flow, so we reuse the path `/api/mkt/keywords/recommend`.

- **Body**: `{ project: { name, industry?, brand_name?, brand_description? }, seedKeyword?: string, language?: string }` (client sends the minimal project context; server holds creds).
- **Logic** (faithful to `discoverGoldenKeywords`):
  1. **Seeds**: if `seedKeyword` provided → split on `[,，、\s]+`; else Gemini generates 8 Korean seeds (CF prompt `:260`), fallback list on parse failure.
  2. **Volumes**: for each seed call `searchKeywords([seed])` (SearchAd), dedupe by keyword keeping max volume, 400 ms spacing between seeds.
  3. **Filter**: keep `totalSearchVolume >= 300` AND `competition ∈ {LOW, MEDIUM}` (CF used Korean `낮음/중간` — **we use the enum**, Risk R‑1), sort by volume desc.
  4. **Relevance filter** (Gemini): pass ≤100 candidate keywords + business context → Gemini returns the relevant subset (CF prompt `:303`); intersect.
  5. **Tiering** (pure fn — unit‑tested): 🏆 황금 = `vol≥1000 && comp===LOW`; 🥇 유망 = `comp===LOW || (vol≥3000 && comp===MEDIUM)` minus gold; 🥈 일반 = rest. Build `KeywordGroup[]`.
  6. **Google enrichment**: `getKeywordVolumes(allGoldenKws)` → attach googleVolume/comp/cpc.
  7. **Strategy** (Gemini): build the Korean strategy prompt from low/mid‑comp lists (CF prompt `:377`), return the markdown text.
- **Response**: `{ success, data: { groups: KeywordGroup[], strategy: string } }`.
- **Degradation**: missing Naver creds → `AppError(502, …)` (golden is Korean/Naver‑specific, hard‑fail is acceptable); missing Gemini → skip relevance/strategy (return raw‑volume tiers + empty strategy).

### 5.4 Endpoints REUSED (no change)

| Endpoint | File | Used by tab |
|---|---|---|
| `POST /api/mkt/naver/keywords` | `controllers/mkt/keywords.controller.ts:8` → `naver-searchad.searchKeywords` | naver‑kw enrichment, golden (server now) |
| `POST /api/mkt/google/keywords` | `controllers/mkt/keywords.controller.ts:18` → `dataforseo.getKeywordVolumes` | google‑kw enrichment, golden google step |
| `POST /api/mkt/ai/generate` (SSE) | `controllers/mkt/ai.controller.ts:31` → `gemini-sse.streamGenerate` | naver‑kw / google‑kw **AI keyword map** (client `useAiGeneration`) |

### 5.5 Env vars (all already present)

| Var | config path | Used by |
|---|---|---|
| `NAVER_AD_API_KEY` / `NAVER_AD_SECRET_KEY` / `NAVER_AD_CUSTOMER_ID` | `config.naverAd.*` | naver keywords, golden, naver trends |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | `config.dataforseo.*` | google keywords, golden google step |
| `YOUTUBE_DATA_API_KEY` | `config.youtubeApiKey` | trending (youtube‑data wiring) |
| `NAVER_DATALAB_CLIENT_ID` / `NAVER_DATALAB_SECRET` | `config.naverDatalab.*` | trending (only if Datalab time‑series wired) |
| `GEMINI_API_KEY` | `config.gemini.apiKey` | ideas generate, golden seed/relevance/strategy |

All are in `.env.example` (verified) and config defaults to `''` → server boots without them; each external service throws `AppError(502, …)` when its creds are blank (graceful degradation already implemented in `naver-searchad.ts:77`, `dataforseo.ts:48`).

---

## 6. Components

All live under `.marketing-scope`; reuse the Phase 0 UI primitives (`ui/button`, `ui/input`, `ui/badge`, `ui/select`, …) and `lib/utils.cn`.

### 6.1 `IdeasDashboard.tsx`  (port of `ideas-dashboard.tsx`)

- **Purpose**: the hub. Holds sub‑tab state, the shared `keywordGroups` + `savedKeywords` + the multi‑sort state, and dispatches to the 4 flows.
- **Props**: none (reads `ui-store.selectedProjectId` + `useProject(id)`); or `{ projectId }` if `IdeasPage` passes it down (preferred, explicit).
- **State** (component‑local, mirrors CF): `tab`, `keywordGroups`, `seedKeyword`, `selectedCategory`, `sortCols`, `goldenStrategy`, `goldenLoading`, `generating`, trending state (`trendKeywords`, `period`, `youtubeResults`, `naverTrends`, `googleTrends`), ideas state (`ideas`, `selectedTopic`, `ideaTopic`, `ideaLoading`). `selectedLang` comes from `ui-store`.
- **Deps / reuse**: `MarketingLanguageTabs`, `KeywordTable`, `GoldenTierCards`, `IdeaCard`, `TrendingFeed`, `useAiGeneration`, `fetchNaverKeywords`/`fetchGoogleKeywords`, `useGenerateIdeas`, `useTrending`, `useDiscoverGoldenKeywords`, `useSavedKeywords` + mutations.
- **Sub‑tab gating**: `naver-kw` hidden unless `selectedLang === 'ko'` (CF `:603`). `saved` shows a count badge.
- **AI keyword‑map flows** (`generateKeywords` / `handleGoogleKeywords`): build CF's language‑aware prompt, run `useAiGeneration.generate(prompt, model)`, parse JSON in `onComplete`, then enrich via `fetchNaverKeywords` (batched 5/req) or `fetchGoogleKeywords` (with `locationCode`/`languageCode` from the CF lang→code map, `:526`). Keep the estimatedVolume bucketing.

### 6.2 `KeywordTable.tsx`  (extracted — the multi‑column sortable table)

- **Purpose**: the shared keyword table used by naver‑kw, google‑kw, and 보관함 (CF inlines three near‑identical tables; we extract one).
- **Props**: `{ rows: KeywordItem[]; columns: ColumnSpec[]; sortCols; onToggleSort(col, shift); isPinned(kw); onTogglePin(kw); onMakeContent(kw); lang }`.
- **Sort model** (pure, unit‑tested): port `colValue` + the `sortCols` comparator + `toggleSort` (click = replace single sort & cycle desc→asc→remove; **shift+click = append** to multi‑sort) + `sortIcon` (numbered ` 1↓ ` badges) from `ideas-dashboard.tsx:415‑462`. Order maps: priority/difficulty/volume/competition (CF `:416‑419`).
- **Delta**: competition ordering keyed on the `'HIGH'|'MEDIUM'|'LOW'` enum (not `높음/중간/낮음`). Provide a small label map for display (`HIGH→높음`).
- **Deps**: `ui/badge`, `ui/button`, `cn`.

### 6.3 `GoldenTierCards.tsx`  (🏆 황금 키워드 result header)

- **Purpose**: the 4‑stat summary grid + the 🏆 AI strategy panel (collapsible, markdown→`**bold**`/`<br>`), shown when golden results exist.
- **Props**: `{ groups: KeywordGroup[]; strategy: string; loading: boolean; onClearStrategy() }`.
- **Deps**: `cn`; renders strategy via the same `dangerouslySetInnerHTML` markdown‑lite transform CF uses (`:696`) — keep it minimal (bold + line breaks only).

### 6.4 `IdeaCard.tsx`  (port of `idea-card.tsx`)

- **Purpose**: one generated idea (channel icon + title + structure + outline) with 생성/보관 buttons.
- **Props**: `{ channel; title; structure; outline: string[]; onGenerate(); onSave() }` (identical to CF). In a 1:1 port both callbacks are **no‑ops** (CF passes `() => {}`). See Open Q‑5 for the optional "create content" wiring.
- **Deps**: `ui/button`; `CHANNEL_ICONS` map.

### 6.5 `TrendingFeed.tsx`  (port of `trending-feed.tsx` + the YouTube grid)

- **Purpose**: the 유튜브 유행 분석 results — a YouTube video list (thumbnail/title/channel/views/likes) + optional Google/Naver trend lists. Clicking any item calls `onSelectTopic(topic)` → seeds the AI 아이디어 tab.
- **Props**: `{ youtube: YTVideo[]; googleTrends: TrendItem[]; naverTrends: TrendItem[]; onSelectTopic(topic) }`.
- **Deps**: plain markup + `cn`. (CF's `trending-feed.tsx` is Google/Naver only; the YouTube grid lives inline in the dashboard — we fold both into this component.)

### 6.6 `MarketingLanguageTabs.tsx`  (new, thin — replaces CF `AnalyticsLanguageTabs`)

- **Purpose**: language pill row for the dashboard. CF's `analytics/language-tabs.tsx` was not ported.
- **Props**: `{ selectedLang; onLangChange(lang) }`.
- **Logic**: `targetLanguages = ['ko', ...project.target_languages.filter(l!=='ko')]`; render a pill per language using `SUPPORTED_LANGUAGES` for flag/label when possible (Tangobook's i18n single source, `@tangobook/shared`), falling back to CF's inline `LANGUAGE_INFO` map. A "+ 언어 추가" affordance may defer to the existing settings `TargetLanguagesSection` (Open Q‑4) rather than re‑implementing CF's dialog.
- **Deps**: `useProject`, `ui-store.selectedLanguage`, `cn`. **Reads** `target_languages`; editing target languages stays in project settings (do NOT duplicate the edit dialog unless desired).

### 6.7 `IdeasPage.tsx`

- **Purpose**: route element. Guard: if no `selectedProjectId` → centered "프로젝트를 선택하세요" (CF `ideas/page.tsx:9`); else `<IdeasDashboard projectId={selectedProjectId} />`.

---

## 7. i18n note

- The language‑tabs row derives entirely from `project.target_languages` (a real column, `database.ts:182`), with **ko always pinned first** (CF parity). The selected language drives: which keyword flow (ko → Naver enrichment + golden tab visible; non‑ko → Google only), the AI prompt's target language (CF `langMap`, `:140`), and the DataForSEO `locationCode`/`languageCode`.
- Prefer Tangobook's `SUPPORTED_LANGUAGES` (`@tangobook/shared`, the i18n single source with `code/label/nativeName/flag`) for the pill labels, so adding a language stays a one‑liner there. Fall back to CF's `LANGUAGE_INFO` only for codes not in `SUPPORTED_LANGUAGES`.
- This page is operator‑facing (Korean UI); no learner‑facing i18n is involved.

---

## 8. Error handling & graceful degradation

- **Server**: every external call already throws `AppError(502, '<provider> … 설정되지 않았습니다.')` when creds are blank; the controller surfaces that as `{ success:false, error }`. The **trending** controller assembles **partials** (per‑source try/catch) so a missing YouTube key still returns Naver/Google lists rather than 500.
- **Client**: each flow has its own `loading`/`error` local state (CF pattern). On a failed keyword enrichment, the AI‑estimated columns still render (CF degrades volume columns to `-`). Golden‑keyword failure shows the raw‑volume tiers without the strategy panel.
- **Empty states**: ported verbatim (🔑 / 🔵 / ✨ / 📁 empty panels, `ideas-dashboard.tsx:838/945/1074/1174`).
- **Abort**: `useAiGeneration` already supports `abort()`; wire it to a 중단 button on the long keyword‑map / golden runs (via `GenerationButton variant="text"`).

---

## 9. Testing strategy

**Pure logic — unit‑tested (Vitest, colocated `__tests__`)**:

- **Golden‑keyword tiering** (`ideas.service` or a `lib/golden-keyword.ts` pure helper): given candidates with `{vol, comp}`, assert the 🏆/🥇/🥈 partition (incl. boundary: `vol===1000`, `comp===MEDIUM && vol===3000`). **Must use the enum**, not Korean strings (Risk R‑1).
- **Golden filter**: `vol>=300 && comp∈{LOW,MEDIUM}` predicate; dedupe‑by‑max‑volume.
- **Multi‑sort comparator** (`KeywordTable` helper): click cycles desc→asc→remove; shift+click appends; multi‑key tie‑break order; `colValue` for naver/google/volume/priority/difficulty/competition (incl. `??‑1` for missing numeric).
- **lang→{locationCode, languageCode}** mapping (used by google enrichment) — table test.
- **views formatter** (`억`/`만`/raw) from the trending route.
- **HMAC signing** for Naver SearchAd is **already covered** (`services/mkt/external/__tests__/naver-searchad.test.ts`); golden reuses `searchKeywords` so no new HMAC test needed.

**External / streaming / UI — manual** (no creds in CI, same policy as Phase 1):

- Naver/Google/YouTube live calls, Gemini idea/seed/relevance/strategy generation, the full 황금 키워드 end‑to‑end, pin→reload persistence, language‑tab gating. Manual checklist run with real `.env` creds in the worktree.
- Component render tests (Vitest + Testing Library) for `KeywordTable` (sort header clicks toggle state) and `IdeasDashboard` tab switching are **optional** but cheap; mock the API hooks.

---

## 10. Implementation checklist (sequenced)

> **Recommended sub‑phase split** (see §11): **2a = keyword analysis** (naver + google + golden), **2b = ideas + trending + saved + page wiring**. 2a delivers the highest‑value, lowest‑external‑risk surface (reuses Phase 1a endpoints, only adds the golden endpoint). 2b adds the two genuinely new external integrations (YouTube Data API, Gemini ideas) + persistence.

### Phase 2a — Keyword analysis (naver + google + golden)

1. `types/database.ts`: add `SavedKeyword` + `Project.saved_keywords` (no migration — column exists).
2. Server: `services/mkt/ideas.service.ts` — golden orchestration (seeds→volumes→filter→relevance→tier→google→strategy) + extract a pure `golden-keyword.ts` tiering/filter helper.
3. Server: `controllers/mkt/ideas.controller.ts` — `recommendKeywords`; register `POST /api/mkt/keywords/recommend` in `routes/mkt.routes.ts`.
4. Unit tests: golden tiering + filter + multi‑sort comparator + lang‑code map.
5. Client: `api/use-golden-keywords.ts` (`useDiscoverGoldenKeywords`); `components/ideas/KeywordTable.tsx` + `GoldenTierCards.tsx` + `MarketingLanguageTabs.tsx`.
6. Client: `IdeasDashboard.tsx` with **naver‑kw + google‑kw + golden** wired (ideas/trending/saved tabs stubbed). AI keyword‑map via `useAiGeneration` + `fetchNaver/GoogleKeywords`.
7. Wire page minimally to eyeball 2a (temporary), or keep behind the placeholder until 2b.

### Phase 2b — Ideas + trending + saved + page

8. Server: wire `youtube-data.ts` (`searchVideos` + `getVideoStats`) and (if needed) `naver-datalab.ts searchTrend`.
9. Server: `ideas.service` idea‑generation + trending assembly; controller `generateIdeas` + `trending`; register `POST /api/mkt/ideas/generate` + `/ideas/trending`.
10. Client: `api/use-ideas.ts` (`useGenerateIdeas`, `useTrending`); `api/use-saved-keywords.ts` (read+mutate via `useProject`/`useUpdateProject`); `queries.ts` add `savedKeywords` key.
11. Client: `IdeaCard.tsx` + `TrendingFeed.tsx`; wire the **ideas / youtube / saved** tabs in `IdeasDashboard`; ☆/★ pin persistence + 보관함 table + 전체 삭제.
12. Wire route: `pages/IdeasPage.tsx`, add to `index.ts` barrel, swap `router/index.tsx:309` placeholder → `<IdeasPage/>`.
13. `features/marketing/CLAUDE.md`: add the ideas module section + the new `/api/mkt` rows; update the route tree.
14. Manual end‑to‑end with real creds; `pnpm typecheck` + marketing test suite green.

---

## 11. Sub‑phase split recommendation (summary)

**Yes — split into 2a + 2b.** IdeasDashboard is large (5 tabs, ~1185 LOC) and mixes "reuse what exists" (keyword tables on Phase‑1a endpoints) with "new external integrations" (YouTube Data API, Gemini ideas, Datalab). The natural seam:

- **2a (keyword analysis)** — naver‑kw, google‑kw, 황금 키워드. Only **one** new endpoint (`/keywords/recommend`); reuses the two Phase‑1a keyword endpoints; the multi‑sort table + tiering are the bulk of the **pure, testable** logic. Lowest external risk, highest value, fully gated by existing creds.
- **2b (ideas + trending + saved)** — AI 아이디어 (`/ideas/generate`), 유튜브 유행 (`/ideas/trending` + youtube‑data wiring), 보관함 (saved‑keyword persistence), and the final page/route swap. Carries the genuinely new YouTube + Gemini‑ideas integrations and the persistence path.

Either sub‑phase is independently shippable; 2a behind the placeholder is fine until 2b lands the page swap (step 12).

---

## 12. Risks & open questions

### Risks

- **R‑1 (competition enum vs Korean string)** — CF's golden tiering predicates compare `comp === '낮음'/'중간'`. Tangobook's `fetchNaverKeywords`/`searchKeywords` return `'LOW'|'MEDIUM'|'HIGH'`. **Every ported predicate (filter step 3, tiering step 5, table sort, badge color) must use the enum.** This is the single most likely port bug. Covered by the tiering/filter unit tests.
- **B‑1 (client `fetchAiGenerate` posts to the wrong path)** — `lib/sse-stream-parser.ts:120 fetchAiGenerate` POSTs to `/api/ai/generate` (missing `/mkt`). The real endpoint is `/api/mkt/ai/generate` (`use-ai-generation.ts:23`). Phase 2 must **not** use `fetchAiGenerate` for client AI calls — use the `useAiGeneration` hook (correct path). Recommend a one‑line fix to `fetchAiGenerate` regardless (it is currently dead/broken). Flag to maintainers.
- **R‑2 (YouTube quota)** — search+stats per keyword burns quota fast; cap at 3 keywords (CF does) and surface a clear error on 403 quotaExceeded rather than a generic 500.
- **R‑3 (golden latency)** — even server‑side, the golden flow is N seeds × Naver round‑trips + 2 Gemini calls (seconds). Keep the 400 ms inter‑seed spacing, show a progress/spinner, and allow abort. Consider a soft cap on seed count.
- **R‑4 (Naver 5‑keyword cap)** — SearchAd accepts ≤5 hint keywords/request; the batching (5/req, 300 ms) must be preserved in both the naver‑kw enrichment and golden seed loop.
- **R‑5 (DataForSEO endpoint drift)** — Phase‑1a `dataforseo.ts` uses `…/google/search_volume/live`; CF used `…/google_ads/search_volume/live`. Reuse the **existing** `getKeywordVolumes` as‑is (already returns the normalized shape); don't reintroduce the CF URL.

### Open questions

- **Q‑1** Golden‑keyword orchestration location — **server (D‑1, recommended)** vs faithful client‑side. Server is proposed; confirm acceptable (it deviates from a strict line‑by‑line CF port but matches Tangobook's secrets/robustness posture).
- **Q‑2** `saved_keywords` shape — store the **rich `SavedKeyword`** (proposed) vs CF's leaner `{keyword,naverMonthly,naverComp,googleVolume,googleComp,category}`. Rich is backward‑compatible (all optional). Confirm.
- **Q‑3** Naver **Datalab** wiring — is the SearchAd‑based Naver trend list (CF parity) enough, or do we want the true Datalab **time‑series**? If the latter, wire `naver-datalab.searchTrend` (skeleton ready) and design a small sparkline; otherwise leave Datalab unwired this phase.
- **Q‑4** Language‑tab editing — reuse the existing settings `TargetLanguagesSection` for "add language" (proposed) vs port CF's in‑dialog editor (`AnalyticsLanguageTabs`'s "+ 언어 추가" dialog). Proposed: read‑only tabs here, edit in settings.
- **Q‑5** "콘텐츠 만들기" / IdeaCard `onGenerate` — **no‑op (1:1 CF port, proposed)** vs Tangobook enhancement that creates a `mkt_contents` row from the keyword/idea and navigates to `/marketing/content`. Proposed: ship no‑op in Phase 2, flag the enhancement as a follow‑up.
- **Q‑6** Model choice for ideas/golden — `config.gemini.textModel` (`gemini-3.1-pro-preview`) is heavier/slower than CF's flash for these batch‑ish calls. Use a flash‑class id (`gemini-2.5-flash-lite`/`gemini-2.5-flash`) for the keyword/idea prompts? (Matches root CLAUDE.md "batch → flash‑lite" guidance.) Confirm the per‑call model.

---

## 13. Cited references (both sides)

**ContentFlow (port source)**
- `src/components/ideas/ideas-dashboard.tsx` — 5 sub‑tabs; `generateKeywords` (:136), `discoverGoldenKeywords` (:249), tiering (:338‑344), `colValue`/sort (:415‑462), `handleGoogleKeywords` (:501), `handleTrendSearch` (:561), `handleGenerateIdeas` (:578).
- `src/components/ideas/idea-card.tsx`, `src/components/ideas/trending-feed.tsx`
- `src/app/(dashboard)/ideas/page.tsx`; `src/app/(dashboard)/keywords/page.tsx` (`redirect('/ideas')`).
- `src/components/keywords/keyword-analysis-dashboard.tsx` — **DEAD** (never imported).
- `src/app/api/naver/keywords/route.ts`, `…/google/keywords/route.ts`, `…/ideas/generate/route.ts`, `…/ideas/trending/route.ts`, `…/keywords/recommend/route.ts`.
- `src/stores/project-store.ts:110/305/685` — `savedKeywords` ↔ `projects.saved_keywords` JSONB.
- `src/components/analytics/language-tabs.tsx` — `AnalyticsLanguageTabs` (not ported; rebuild thin).
- `src/lib/sse-stream-parser.ts` — `fetchAiGenerate`.

**Tangobook Phase 0–1 (worktree `feat/marketing-phase0`)**
- `features/marketing/components/layout/Sidebar.tsx:16` — ideas nav item already present.
- `router/index.tsx:309` — `/marketing/ideas` → PlaceholderPage (swap target).
- `features/marketing/api/use-keywords.ts` — `fetchNaverKeywords`/`fetchGoogleKeywords` (unwrap envelope).
- `features/marketing/api/use-projects.ts:105` — `useUpdateProject` (saved_keywords path); `api/queries.ts:18` — `mktKeys`.
- `features/marketing/hooks/use-ai-generation.ts:23` — SSE → `/api/mkt/ai/generate`.
- `features/marketing/store/ui-store.ts:29` — `selectedLanguage`/`setSelectedLanguage`.
- `features/marketing/types/database.ts:143/182` — `Project` (no `saved_keywords` field yet), `target_languages`.
- `features/marketing/components/content/NaverKeywordPanel.tsx` — existing keyword‑table precedent.
- `features/marketing/components/content/{GenerationButton,ChannelModelSelector}.tsx` — reusable.
- `server/routes/mkt.routes.ts:35‑36` — naver/google keyword routes (reuse); add 3 here.
- `server/controllers/mkt/{keywords,ai}.controller.ts` — patterns to follow.
- `server/services/mkt/external/{naver-searchad,dataforseo}.ts` — reused; `{naver-datalab,youtube-data}.ts` — **501 skeletons to wire**.
- `server/config/index.ts:32‑74` — `naverAd`/`dataforseo`/`youtubeApiKey`/`naverDatalab`/`gemini` (all env present).
- `supabase/migrations/2026-06-07-marketing-schema.sql:62` — `saved_keywords jsonb` **already exists**.
- `packages/server/.env.example` — `NAVER_AD_*`, `DATAFORSEO_*`, `YOUTUBE_DATA_API_KEY`, `NAVER_DATALAB_*` present.
