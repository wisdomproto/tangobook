# Marketing Phase 2 (Keywords & Ideas) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/marketing/ideas` `PlaceholderPage` with a real **IdeasDashboard** — a 5-sub-tab keyword/idea hub faithfully ported from ContentFlow's `ideas-dashboard.tsx` onto the Phase 0/1a–1d stack. The five sub-tabs share one sortable keyword table and one saved-keyword store: **N 키워드 분석** (AI keyword map → real Naver SearchAd volumes + the 🏆 **황금 키워드** discovery flow + AI strategy write-up, ko only), **G 키워드 분석** (AI keyword map → DataForSEO Google volume/competition/CPC, all languages), **유튜브 유행 분석** (keyword-driven YouTube Data API trending search + Naver/Google trend lists), **AI 아이디어** (topic → one `IdeaCard` per channel), and **보관함** (pinned keywords persisted to `mkt_projects.saved_keywords`). Three resolved decisions shape the port: the golden-keyword orchestration is **moved server-side** into one endpoint (`POST /api/mkt/keywords/recommend`); **all competition predicates use the `'HIGH'|'MEDIUM'|'LOW'` enum** (NOT CF's Korean `높음/중간/낮음` strings — the top risk, R-1); and the Naver Datalab time-series is **skipped** (SearchAd-based trend list for CF parity). Publish/analytics/strategy/monitoring stay placeholders (Phase 3/4/5 — OUT).

**Architecture:** Extends `packages/client/src/features/marketing/` (client) + `packages/server/src/{routes,controllers,services}/mkt/` (server). The two Phase-1a keyword endpoints (`/api/mkt/naver/keywords`, `/api/mkt/google/keywords`) and their client wrappers (`fetchNaverKeywords`/`fetchGoogleKeywords`, already returning the unwrapped enum-typed rows) are **reused as-is**. Phase 2 ADDS three Express endpoints (`/keywords/recommend`, `/ideas/generate`, `/ideas/trending`) via one new controller + service, **wires** two 501 skeletons (`youtube-data.ts`, `naver-datalab.ts` — the latter only if a true time-series is needed; default is SKIP), and on the client adds the `IdeasDashboard` + 6 sub-components, 3 API-hook files, the `Project.saved_keywords` type, and the page/route swap. Server data = TanStack Query (`useProject`/`useUpdateProject` over the `saved_keywords` JSONB column) + transient component state (ideas/trending/keyword results are NOT cached, exactly like CF). Zustand (`ui-store`) = UI state only (`selectedProjectId`/`selectedLanguage`). **No DB migration** — `mkt_projects.saved_keywords jsonb` already exists (schema line 62); only the TS type is missing.

**Tech Stack:** React 18 + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3 + lucide-react `^1.17.0` + Express v5 + `@google/generative-ai` (`generateTextWithGemini`, consume-only). External: Naver SearchAd (HMAC), DataForSEO, YouTube Data API v3, Gemini. Tests: vitest + @testing-library/react (jsdom). Test command: `pnpm --filter client test <path-substring>` / `pnpm --filter server test <path-substring>`. Typecheck: `pnpm typecheck`. Lint: `pnpm lint`. Build: `pnpm --filter client build`.

**Source to port from:** `C:\projects\contentflow\contentflow\src\` — `components/ideas/ideas-dashboard.tsx` (1185 lines: `generateKeywords` :136, `discoverGoldenKeywords` :249, tiering :337–344, `colValue`/sort comparator :415–462, `handleGoogleKeywords` :501, `handleTrendSearch` :561, `handleGenerateIdeas` :578, sub-tab gating :603), `components/ideas/idea-card.tsx` (38), `components/ideas/trending-feed.tsx` (52), `app/api/ideas/generate/route.ts` (38), `app/api/ideas/trending/route.ts` (146, incl. `formatViews` :141), `app/api/keywords/recommend/route.ts` (183 — a *different* base-article flow; we reuse only the path name), `app/api/naver/keywords/route.ts`, `app/api/google/keywords/route.ts`. **NOT ported:** `components/keywords/keyword-analysis-dashboard.tsx` (DEAD CODE — never imported; `keywords/page.tsx` just `redirect('/ideas')`), `components/analytics/language-tabs.tsx` (`AnalyticsLanguageTabs` — rebuild thin as `MarketingLanguageTabs`). ContentFlow uses Next.js + one ~1,900-line Zustand `project-store.ts`; this port adapts to Vite + TanStack Query (the same adaptation 1a–1d did). Spec: `docs/superpowers/specs/2026-06-07-marketing-phase2-keywords-ideas-design.md` (read it fully — data model §4, endpoints §5, components §6, the resolved decision **D-1** + risks **R-1…R-5** + **B-1** in §12, sequenced checklist §10, 2a/2b split §11).

**Conventions (match Phase 0 / 1a / 1b / 1c / 1d — spec §3, marketing `CLAUDE.md`):**
- TanStack Query = server data; Zustand (`ui-store`) = UI state only. **No server data in Zustand.** Keyword/idea/trending results live in component state (transient, like CF); only `saved_keywords` is server state.
- Files: **PascalCase** components (`IdeasDashboard.tsx`, `KeywordTable.tsx`, `IdeaCard.tsx`, `TrendingFeed.tsx`, `GoldenTierCards.tsx`, `MarketingLanguageTabs.tsx`), **camelCase** data/util/hook/api files (`use-ideas.ts`, `use-golden-keywords.ts`, `use-saved-keywords.ts`). Named exports for components (pages default). (ContentFlow used kebab-case files — rename on port.)
- Client UI primitives imported from `../../ui/<name>` (e.g. `import { Button } from '../../ui/button'`, `import { Input } from '../../ui/input'`, `import { Badge } from '../../ui/badge'`), NOT `@/components/ui/*`. `cn`/`generateId` from `../../lib/utils`. Types from `../../types/database`. Icons from `lucide-react`. Drop every `'use client'`; replace `next/image`/`<img>` eslint-disables with plain `<img>`.
- Server: `routes(URL) → controllers(req parse + asyncHandler) → services(logic, AppError throw) → providers/external`. Response envelope `res.json({ success: true, data })`; failure `throw new AppError(status, msg)` (errorMiddleware). Controllers use `asyncHandler` (`middleware/async-handler.js`). Server import paths use the `.js` extension (ESM). `config` from `../../config/index.js`.
- Mutations that write `mkt_*` rows set `updated_at`; the `saved_keywords` write goes through the **existing** `useUpdateProject({ id, updates: { saved_keywords } })` — RLS on `mkt_projects` is `user_id = auth.uid()` and the **row already belongs to the owner**, so NO extra `user_id` stamping is needed (unlike the `mkt_*_cards` insert gotcha). Stamping stays on the owner's project row.
- Commit after every task. Commit messages in English. End each commit message with the trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Port-task pattern** (verbatim/near-verbatim UI where TDD is impractical): copy source → rename to PascalCase → rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/utils` → `../../lib/utils`, `@/types/*` → `../../types/*`, `@/stores/project-store` → the new TanStack hooks + `ui-store`) → strip `'use client'` + Next `<img>` disables → adapt the CF→worktree deltas (envelope unwrap, enum competition, server-side golden) → **build → `pnpm --filter client typecheck` → manual-verify in `/marketing/ideas` → commit**. This rhythm is called **"port → typecheck → manual-verify → commit"** below.

> @superpowers:test-driven-development for the pure-logic steps (failing test → run → impl → run → commit). @superpowers:verification-before-completion before any "done" claim in Chunk 4.

---

## File Structure

```
packages/client/src/features/marketing/
  api/                            [Phase 0/1a + NEW]
    queries.ts                    EDIT   add mktKeys.savedKeywords(projectId) (§4.2)
    use-keywords.ts               REUSE  fetchNaverKeywords / fetchGoogleKeywords (EXISTS, Phase 1a — enum competition) — NO change
    use-projects.ts               REUSE  useProject / useUpdateProject (saved_keywords persists here) — NO change
    use-ideas.ts                  NEW    useGenerateIdeas / useTrending (POST /api/mkt/ideas/{generate,trending})
    use-golden-keywords.ts        NEW    useDiscoverGoldenKeywords (POST /api/mkt/keywords/recommend)
    use-saved-keywords.ts         NEW    read+mutate mkt_projects.saved_keywords (wraps useProject + useUpdateProject)
    supabase.ts                   REUSE  (re-exports @/lib/supabase)
    __tests__/
      use-saved-keywords.test.tsx NEW
  hooks/
    use-ai-generation.ts          REUSE  { isGenerating, generate, abort } — SSE → /api/mkt/ai/generate (correct path; B-1)
  lib/
    sse-stream-parser.ts          EDIT   B-1: fetchAiGenerate path /api/ai/generate → /api/mkt/ai/generate (1-line, Chunk 0)
    golden-keyword.ts             NEW    pure tier/filter helpers (server-mirror, also client-importable) — TDD
    keyword-sort.ts               NEW    pure multi-sort comparator + colValue + toggleSort + sortIcon — TDD
    utils.ts                      REUSE  generateId / cn
    ai-models.ts                  REUSE  TEXT_MODELS (flash-class id for ideas/golden)
  components/
    ideas/                        NEW directory
      IdeasDashboard.tsx          NEW    5-sub-tab hub (port of ideas-dashboard.tsx)
      KeywordTable.tsx            NEW    extracted multi-sort sortable table (naver/google/saved)
      GoldenTierCards.tsx         NEW    🏆/🥇/🥈 tier summary + AI strategy panel
      IdeaCard.tsx                NEW    port of idea-card.tsx (no-op buttons)
      TrendingFeed.tsx            NEW    port of trending-feed.tsx + YouTube grid
      MarketingLanguageTabs.tsx   NEW    language pill row from project.target_languages (ko pinned)
      __tests__/
        keyword-sort.test.ts      NEW    (colocated lib test; or place under lib/__tests__ — see Task 1.2)
  store/
    ui-store.ts                   REUSE  selectedProjectId, selectedLanguage, setSelectedLanguage — NO change
  types/
    database.ts                   EDIT   add SavedKeyword interface + Project.saved_keywords (Chunk 0)
  pages/
    IdeasPage.tsx                 NEW    project guard + <IdeasDashboard projectId={…}/>
  index.ts                        EDIT   export IdeasPage

router/index.tsx                  EDIT   line 309: PlaceholderPage → <IdeasPage/>

packages/server/src/
  routes/mkt.routes.ts                    EDIT  add /keywords/recommend, /ideas/generate, /ideas/trending
  controllers/mkt/ideas.controller.ts     NEW   recommendKeywords, generateIdeas, trending
  services/mkt/ideas.service.ts           NEW   golden orchestration + idea gen + trending assembly
  services/mkt/external/golden-keyword.ts NEW   pure tier/filter helpers (server source of truth) — TDD
  services/mkt/external/naver-searchad.ts REUSE searchKeywords (EXISTS — enum mapCompetition)
  services/mkt/external/dataforseo.ts     REUSE getKeywordVolumes (EXISTS — …/google/search_volume/live)
  services/mkt/external/youtube-data.ts   WIRE  searchVideos + getVideoStats (currently 501)
  services/mkt/external/naver-datalab.ts  (SKIP this phase — searchTrend stays 501; see D/§5.2)
  providers/gemini.provider.ts            REUSE generateTextWithGemini(prompt, retries, model)
  __tests__ (colocated under each service dir)
    services/mkt/external/__tests__/golden-keyword.test.ts  NEW
    services/mkt/__tests__/ideas.service.test.ts            NEW (views formatter + trending merge + lang-code map)
```

> **The pure `golden-keyword.ts` tier/filter helper lives in TWO places** — the **server** `services/mkt/external/golden-keyword.ts` (source of truth, used by the `recommend` endpoint, TDD'd) and a **thin client** `lib/golden-keyword.ts` that re-declares the same tier *labels/types* for display. To avoid drift, the client file only holds the display constants (tier emoji labels, the enum→Korean badge map); the actual tiering math runs **server-side only** (D-1). Do NOT import server code into the client bundle (house rule — see `use-keywords.ts:1`). If you prefer one file, keep the math server-side and have the client import nothing from it.

> **No DDL required.** Phase 0's migration `supabase/migrations/2026-06-07-marketing-schema.sql:62` already created `mkt_projects.saved_keywords jsonb` with RLS `user_id = auth.uid()`. **No new table, no new policy, no new SECURITY DEFINER function** → no `GRANT EXECUTE` needed (memory RULE n/a). The only schema-adjacent change is the **TS type** (Chunk 0 Task 0.1).

### Chunk dependency order (each chunk independently runnable in this order)

| Chunk | Depends on | Independently testable / verifiable |
|---|---|---|
| **0** Prereqs (type + B-1 fix + thin pieces) | — (Phase 0/1a only) | `pnpm typecheck` (Project.saved_keywords compiles) + grep that `fetchAiGenerate` now posts `/api/mkt/ai/generate` |
| **1 (2a)** Keyword analysis: golden endpoint + sort + tables | 0 | server `golden-keyword` + client `keyword-sort` unit tests (FAIL→PASS) + typecheck + manual naver/google/golden flow |
| **2 (2b)** Ideas + trending + saved | 0, 1 (reuses `KeywordTable` + `MarketingLanguageTabs`) | server `ideas.service` unit tests (views fmt + trending merge + lang map) + `use-saved-keywords` test + manual ideas/trending/saved flow |
| **3** Page swap + wire | 0, 1, 2 (mounts `IdeasDashboard`) | typecheck + manual E2E of `/marketing/ideas` (sidebar active, placeholder gone) |
| **4** Verification | 0–3 | full suite + typecheck + lint + build + manual E2E + static scope sanity + RLS note |

> **2a (Chunk 1) is independently shippable behind the placeholder** (the page swap is Chunk 3). 2a delivers the highest-value, lowest-external-risk surface (reuses the two Phase-1a keyword endpoints; adds only the golden endpoint; the multi-sort table + tiering are the bulk of the **pure, testable** logic). 2b (Chunk 2) carries the two genuinely new external integrations (YouTube Data API, Gemini ideas) + the persistence path. The **R-1 enum discipline (Chunk 1) is the #1 correctness risk** — every tier/filter/sort/badge predicate keys on `'HIGH'|'MEDIUM'|'LOW'`, never `높음/중간/낮음`. Covered by the `golden-keyword` + `keyword-sort` unit tests. **Do not skip those tests.**

---

## Chunk 0: Prerequisites — `Project.saved_keywords` type, B-1 sse fix, thin pieces

> No external calls, no UI flow. Lands the type gap (`saved_keywords`), the one-line **B-1** path fix to the (currently broken/dead) `fetchAiGenerate`, and confirms the reused pieces are present. **Do not re-create any already-ported piece.** If anything below is missing/misnamed, STOP and reconcile against the Phase 0/1a plans before proceeding.

### Task 0.1: Add `SavedKeyword` interface + `Project.saved_keywords` (no migration)

> **Verified (spec §4.1; `types/database.ts:143–196`):** `Project` has `target_languages: string[]` (:182) but **no `saved_keywords`** field. The DB column `mkt_projects.saved_keywords jsonb` already exists (`supabase/migrations/2026-06-07-marketing-schema.sql:62`, "Saved keywords (drift — keyword list saved from ideas module)"). **No migration is required** — only the TS type. We store the **rich** `SavedKeyword` (all fields optional) so 보관함 can render every column; CF's leaner rows degrade gracefully. **Competition is the enum** (delta vs CF's Korean string, R-1).

**Files:**
- Modify: `packages/client/src/features/marketing/types/database.ts`

- [ ] **Step 1 (impl):** Add the `SavedKeyword` interface (place it just before `export interface Project`), and add the `saved_keywords` field to `Project` (immediately after `target_languages: string[];`):

```ts
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
  naverComp?: 'HIGH' | 'MEDIUM' | 'LOW'; // enum, NOT Korean string (delta vs CF — R-1)
  googleVolume?: number;
  googleComp?: string; // DataForSEO numeric/label; kept as string for display
  googleCpc?: number;
}
```
```ts
// inside interface Project, right after:  target_languages: string[];
  saved_keywords: SavedKeyword[] | null; // ADD — column already exists in DB
```
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck`. Expected: **PASS**. `fetchProject`/`fetchProjects` cast `data as Project` / `as Project[]` from `select('*')` — adding an optional-ish field does not break the cast (DB rows already carry the column, default `null`). `useCreateProject` builds a full `Project` literal (`use-projects.ts:41–91`) — it does **not** set `saved_keywords`, so add `saved_keywords: null,` to that literal to keep it exhaustive (TS will flag the missing required field otherwise).
  - **Sub-step:** in `use-projects.ts` `useCreateProject`, add `saved_keywords: null,` to the `newProject` object (near `target_languages: [],`).
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/types/database.ts packages/client/src/features/marketing/api/use-projects.ts
  git commit -m "feat(marketing): add SavedKeyword type + Project.saved_keywords (column already exists, enum competition)"
  ```

### Task 0.2: B-1 — fix `fetchAiGenerate` path to `/api/mkt/ai/generate`

> **Verified (spec §12 B-1; `lib/sse-stream-parser.ts:120`):** `fetchAiGenerate` POSTs to `/api/ai/generate` (missing `/mkt`) — the real endpoint is `/api/mkt/ai/generate` (`hooks/use-ai-generation.ts:23`). `fetchAiGenerate` is currently **dead/broken** (no callsite in the worktree; the JSDoc comment also says `/api/ai/generate`). Phase 2 will **not** use `fetchAiGenerate` for client AI calls — the dashboard uses the `useAiGeneration` hook (correct path) for the keyword-map SSE flows. But fix the dead helper now so it is not a future foot-gun.

**Files:**
- Modify: `packages/client/src/features/marketing/lib/sse-stream-parser.ts`

- [ ] **Step 1 (impl):** Change line 120 from:
  ```ts
  return fetchSSEText('/api/ai/generate', { prompt, ...(model && { model }) }, init);
  ```
  to:
  ```ts
  return fetchSSEText('/api/mkt/ai/generate', { prompt, ...(model && { model }) }, init);
  ```
  Also fix the JSDoc above it (`Shortcut for `POST /api/ai/generate`` → `POST /api/mkt/ai/generate`).
- [ ] **Step 2 (verify):** `pnpm --filter client typecheck` → PASS. Grep that no other client file still references the non-`mkt` AI path:
  - `grep -rn "/api/ai/generate" packages/client/src/features/marketing/` → **0 results** (all callsites must be `/api/mkt/ai/generate`). The generic SSE convention comment at the top of the file mentions `/api/ai/*` — that is documentation of the *server* route shape and may stay, but the live `fetchSSEText`/`fetchAiGenerate` URLs must be `/api/mkt/...`.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/lib/sse-stream-parser.ts
  git commit -m "fix(marketing): fetchAiGenerate posts to /api/mkt/ai/generate (B-1 — was missing /mkt)"
  ```

### Task 0.3: Sanity-confirm the reused pieces (no-op verification)

> No-op verification (mirrors 1c Task 0.2). Everything below was built in Phase 0/1a — this catches path drift before the later chunks depend on it. **Do not re-create any of these.**

**Files:** none (read-only checks).

- [ ] **Step 1 (keyword wrappers):** `api/use-keywords.ts` exports `fetchNaverKeywords(keywords)` → `POST /api/mkt/naver/keywords` and `fetchGoogleKeywords(keywords, locationCode?, languageCode?)` → `POST /api/mkt/google/keywords`, both **unwrapping** `json.data.keywords` and typed `NaverKeywordRow.competition: 'HIGH'|'MEDIUM'|'LOW'` / `GoogleKeywordRow.competition: number`. **No change.**
- [ ] **Step 2 (server keyword endpoints + externals):** `routes/mkt.routes.ts:35–36` registers `/naver/keywords` + `/google/keywords` → `controllers/mkt/keywords.controller.ts` → `services/mkt/external/naver-searchad.ts searchKeywords` (HMAC, ≤5 hint kw cap, `mapCompetition` → enum) + `dataforseo.ts getKeywordVolumes` (`…/keywords_data/google/search_volume/live`, default `locationCode=2410`/`languageCode='ko'`). **Reuse; do NOT reintroduce CF's `google_ads/...` URL (R-5).**
- [ ] **Step 3 (gemini provider):** `providers/gemini.provider.ts` exports `generateTextWithGemini(prompt, retries=3, model?)` with overload auto-fallback to `gemini-2.5-flash-lite`; `config.gemini.{apiKey,textModel}` present. `parseGeminiJSON` util — confirm its path before use (likely `utils/parse-gemini-json.ts` or inline; if absent, the service does a local `match(/\[...\]/)`/`match(/\{...\}/)` + `JSON.parse`).
- [ ] **Step 4 (config env):** `config/index.ts` exposes `naverAd.{apiKey,secretKey,customerId}`, `dataforseo.{login,password}`, `youtubeApiKey`, `naverDatalab.{clientId,secret}`, `gemini.{apiKey,textModel}` — all defaulting to `''` (server boots without them). `.env.example` has the matching vars.
- [ ] **Step 5 (client substrate):** `mktKeys` factory (`api/queries.ts:18`); `useProject(id)` + `useUpdateProject()` (`api/use-projects.ts:16,105`); `ui-store.selectedLanguage`/`setSelectedLanguage` (`store/ui-store.ts:29,52`); `SUPPORTED_LANGUAGES` (`@tangobook/shared`, `{code,label,nativeName,flag}`); `TEXT_MODELS` + the flash-class id `gemini-2.5-flash-lite` (`lib/ai-models.ts`); `ChannelModelSelector`/`GenerationButton` (`components/content/`); `useAiGeneration` (`hooks/use-ai-generation.ts`, `generate(prompt, model)` → `/api/mkt/ai/generate`); the sidebar nav item `{ to:'/marketing/ideas', icon:'💡', label:'키워드 / 아이디어' }` (`components/layout/Sidebar.tsx:16`); the route `{ path:'ideas', element:<PlaceholderPage title="키워드 / 아이디어"/> }` (`router/index.tsx:309`, swap target); the barrel `features/marketing/index.ts`.
- [ ] **Step 6 (tables — optional, MCP):** if desired, `mcp__supabase__list_tables` (ref `fxzwigjkbsptvsjraqwa`) → confirm `mkt_projects.saved_keywords` column exists (jsonb). Belt-and-suspenders.
- [ ] **Step 7:** No commit (read-only).

---

## Chunk 1 (Phase 2a): Keyword analysis — golden endpoint + sort + tables

> The keyword-analysis surface: **N 키워드 분석** + **G 키워드 분석** + **🏆 황금 키워드**. The two keyword tabs reuse the Phase-1a endpoints (`fetchNaverKeywords`/`fetchGoogleKeywords`); the golden flow becomes **one server endpoint** (D-1). The pure tiering/filter (server) + multi-sort comparator (client) are TDD'd with the **enum** (R-1). The UI components (`KeywordTable`, `GoldenTierCards`, `MarketingLanguageTabs`) + a `naver-kw`/`google-kw`/golden-only `IdeasDashboard` skeleton land here; ideas/youtube/saved tabs are stubbed until Chunk 2. The page stays behind the placeholder until Chunk 3.

### Task 1.1: Pure golden tiering/filter helper (server) — TDD (the R-1 enum core)

> Extract CF's `discoverGoldenKeywords` filter (`:294–297`) + tiering (`:337–344`) into a pure, testable module **using the enum**. CF compared `comp === '낮음'/'중간'`; our `searchKeywords` returns `'LOW'|'MEDIUM'|'HIGH'`, so **every predicate keys on the enum** (R-1 — the #1 port bug). The endpoint (Task 1.3) calls these; the tests pin the boundaries.

**Files:**
- Create: `packages/server/src/services/mkt/external/golden-keyword.ts`
- Test: `packages/server/src/services/mkt/external/__tests__/golden-keyword.test.ts`

- [ ] **Step 1 (test):** Write the failing test. Cover: the **filter** (`vol>=300 && comp∈{LOW,MEDIUM}`, drops HIGH and sub-300), the **dedupe-by-max-volume**, and the **3-tier partition** with boundary cases (`vol===1000`+LOW → gold; `vol===3000`+MEDIUM → silver; LOW always at least silver; the rest bronze). **Assert the enum is used** (a `높음/중간/낮음` input must NOT match any tier — it falls through as if HIGH/unknown).

```ts
import { describe, it, expect } from 'vitest';
import {
  type GoldenCandidate,
  filterGoldenCandidates,
  dedupeByMaxVolume,
  classifyGoldenTiers,
} from '../golden-keyword';

const c = (keyword: string, vol: number, comp: GoldenCandidate['comp']): GoldenCandidate => ({
  keyword,
  vol,
  comp,
  pc: vol,
  mob: 0,
});

describe('filterGoldenCandidates (enum — R-1)', () => {
  it('keeps vol>=300 with comp LOW or MEDIUM, sorted by vol desc', () => {
    const out = filterGoldenCandidates([
      c('a', 500, 'LOW'),
      c('b', 299, 'LOW'), // below threshold
      c('c', 800, 'HIGH'), // wrong comp
      c('d', 1200, 'MEDIUM'),
    ]);
    expect(out.map((x) => x.keyword)).toEqual(['d', 'a']); // 1200, 500 (b/c dropped)
  });
  it('does NOT treat Korean strings as competition (enum only)', () => {
    // a Korean-string comp must fall through the LOW/MEDIUM filter
    const out = filterGoldenCandidates([{ keyword: 'z', vol: 1000, comp: '낮음' as never, pc: 1000, mob: 0 }]);
    expect(out).toHaveLength(0);
  });
});

describe('dedupeByMaxVolume', () => {
  it('keeps the highest-volume entry per keyword', () => {
    const map = dedupeByMaxVolume([c('a', 100, 'LOW'), c('a', 900, 'MEDIUM'), c('b', 50, 'LOW')]);
    expect(map.get('a')?.vol).toBe(900);
    expect(map.get('b')?.vol).toBe(50);
  });
});

describe('classifyGoldenTiers (enum — R-1)', () => {
  it('🏆 gold = vol>=1000 && comp===LOW (inclusive boundary)', () => {
    const { gold } = classifyGoldenTiers([c('g', 1000, 'LOW'), c('x', 999, 'LOW'), c('y', 2000, 'MEDIUM')]);
    expect(gold.map((g) => g.keyword)).toEqual(['g']);
  });
  it('🥇 silver = (LOW or (vol>=3000 && MEDIUM)) minus gold', () => {
    const { silver } = classifyGoldenTiers([
      c('g', 1500, 'LOW'), // gold
      c('s1', 400, 'LOW'), // silver (LOW, not gold)
      c('s2', 3000, 'MEDIUM'), // silver (vol>=3000 & MEDIUM)
      c('b', 1000, 'MEDIUM'), // bronze
    ]);
    expect(silver.map((s) => s.keyword).sort()).toEqual(['s1', 's2']);
  });
  it('🥈 bronze = everything not gold/silver', () => {
    const { bronze } = classifyGoldenTiers([c('b', 1000, 'MEDIUM'), c('g', 1500, 'LOW')]);
    expect(bronze.map((x) => x.keyword)).toEqual(['b']);
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter server test golden-keyword`. Expected: **FAIL** (module not found).
- [ ] **Step 3 (impl):** Create `golden-keyword.ts` with the enum-only logic (CF `:294–344`, translated to the enum). Complete code:

```ts
import type { NaverKeyword } from './naver-searchad.js';

export type Competition = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GoldenCandidate {
  keyword: string;
  vol: number; // pc + mobile
  comp: Competition;
  pc: number;
  mob: number;
}

/** Map a Naver SearchAd row → candidate (vol = pc + mobile). */
export function toCandidate(nk: NaverKeyword): GoldenCandidate {
  return {
    keyword: nk.keyword,
    vol: nk.pcSearchVolume + nk.mobileSearchVolume,
    comp: nk.competition, // already enum from mapCompetition
    pc: nk.pcSearchVolume,
    mob: nk.mobileSearchVolume,
  };
}

/** Dedupe by keyword, keeping the entry with the highest volume (CF :286). */
export function dedupeByMaxVolume(rows: GoldenCandidate[]): Map<string, GoldenCandidate> {
  const map = new Map<string, GoldenCandidate>();
  for (const r of rows) {
    const cur = map.get(r.keyword);
    if (!cur || cur.vol < r.vol) map.set(r.keyword, r);
  }
  return map;
}

/** Filter: vol>=300 AND comp ∈ {LOW, MEDIUM}, sorted by vol desc (CF :294–297, enum). */
export function filterGoldenCandidates(rows: GoldenCandidate[]): GoldenCandidate[] {
  return rows
    .filter((r) => r.vol >= 300 && (r.comp === 'LOW' || r.comp === 'MEDIUM'))
    .sort((a, b) => b.vol - a.vol);
}

export interface GoldenTiers {
  gold: GoldenCandidate[]; // 🏆 황금
  silver: GoldenCandidate[]; // 🥇 유망
  bronze: GoldenCandidate[]; // 🥈 일반
}

/**
 * 3-tier classification (CF :337–340, enum):
 *   🏆 gold   = vol>=1000 && comp===LOW
 *   🥇 silver = (comp===LOW || (vol>=3000 && comp===MEDIUM)) minus gold
 *   🥈 bronze = the rest
 */
export function classifyGoldenTiers(rows: GoldenCandidate[]): GoldenTiers {
  const gold = rows.filter((g) => g.vol >= 1000 && g.comp === 'LOW');
  const goldSet = new Set(gold);
  const silver = rows.filter(
    (g) => !goldSet.has(g) && (g.comp === 'LOW' || (g.vol >= 3000 && g.comp === 'MEDIUM'))
  );
  const silverSet = new Set(silver);
  const bronze = rows.filter((g) => !goldSet.has(g) && !silverSet.has(g));
  return { gold, silver, bronze };
}
```
- [ ] **Step 4 (run):** `pnpm --filter server test golden-keyword`. Expected: **PASS** (all cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/server/src/services/mkt/external/golden-keyword.ts packages/server/src/services/mkt/external/__tests__/golden-keyword.test.ts
  git commit -m "feat(marketing): pure golden-keyword tier/filter helpers (enum competition — R-1) + tests"
  ```

### Task 1.2: Pure multi-sort comparator (client) — TDD (the shift-click table sort)

> Port CF's `colValue` + `sortCols` comparator + `toggleSort` + `sortIcon` (`ideas-dashboard.tsx:415–462`) into a pure module so `KeywordTable` (Task 1.4) imports tested logic. **Competition ordering keys on the enum** (CF `compOrder` used `높음/중간/낮음`; ours uses `HIGH/MEDIUM/LOW` — R-1). The naver/google numeric columns use `?? -1` for missing values (so blanks sort last on desc).

**Files:**
- Create: `packages/client/src/features/marketing/lib/keyword-sort.ts`
- Test: `packages/client/src/features/marketing/lib/__tests__/keyword-sort.test.ts`

- [ ] **Step 1 (test):** Write the failing test. Cover: `colValue` for each col (`naver`/`google` numeric `?? -1`; `volume`/`priority`/`difficulty` ordered maps; `competition` enum-ordered); `toggleSort` cycle (click replaces → desc; click same → asc; click same again → remove; shift+click appends); `sortIcon` numbering; the multi-key comparator tie-break order.

```ts
import { describe, it, expect } from 'vitest';
import {
  type KeywordItem,
  type SortState,
  colValue,
  toggleSort,
  sortIcon,
  sortKeywords,
} from '../keyword-sort';

const kw = (over: Partial<KeywordItem>): KeywordItem => ({
  keyword: 'k',
  category: 'c',
  priority: 'medium',
  searchIntent: 'informational',
  ...over,
});

describe('colValue (enum competition — R-1)', () => {
  it('maps competition by HIGH/MEDIUM/LOW (not Korean strings)', () => {
    expect(colValue(kw({ naverComp: 'HIGH' }), 'competition')).toBe(3);
    expect(colValue(kw({ naverComp: 'MEDIUM' }), 'competition')).toBe(2);
    expect(colValue(kw({ naverComp: 'LOW' }), 'competition')).toBe(1);
    expect(colValue(kw({ naverComp: '높음' as never }), 'competition')).toBe(0); // not enum ⇒ 0
  });
  it('numeric naver/google use ?? -1 for missing', () => {
    expect(colValue(kw({ naverMonthly: 4200 }), 'naver')).toBe(4200);
    expect(colValue(kw({}), 'naver')).toBe(-1);
    expect(colValue(kw({ googleVolume: 0 }), 'google')).toBe(0);
    expect(colValue(kw({}), 'google')).toBe(-1);
  });
  it('orders volume/priority/difficulty maps', () => {
    expect(colValue(kw({ estimatedVolume: '높음' }), 'volume')).toBe(3);
    expect(colValue(kw({ priority: 'high' }), 'priority')).toBe(3);
    expect(colValue(kw({ difficulty: '쉬움' }), 'difficulty')).toBe(1);
  });
});

describe('toggleSort', () => {
  it('click replaces with single desc; same col → asc; again → remove', () => {
    let s: SortState[] = toggleSort([], 'naver', false);
    expect(s).toEqual([{ col: 'naver', dir: 'desc' }]);
    s = toggleSort(s, 'naver', false);
    expect(s).toEqual([{ col: 'naver', dir: 'asc' }]);
    s = toggleSort(s, 'naver', false);
    expect(s).toEqual([]);
  });
  it('shift+click appends a second column', () => {
    const s = toggleSort([{ col: 'naver', dir: 'desc' }], 'google', true);
    expect(s).toEqual([
      { col: 'naver', dir: 'desc' },
      { col: 'google', dir: 'desc' },
    ]);
  });
  it('non-shift click replaces multi-sort with a single column', () => {
    const s = toggleSort([{ col: 'naver', dir: 'desc' }], 'google', false);
    expect(s).toEqual([{ col: 'google', dir: 'desc' }]);
  });
});

describe('sortIcon', () => {
  it('shows ↕ when unsorted, numbered arrows when multi-sorted', () => {
    expect(sortIcon([], 'naver')).toBe(' ↕');
    expect(sortIcon([{ col: 'naver', dir: 'desc' }], 'naver')).toBe(' ↓'); // single ⇒ no number
    const multi: SortState[] = [
      { col: 'naver', dir: 'desc' },
      { col: 'google', dir: 'asc' },
    ];
    expect(sortIcon(multi, 'naver')).toBe(' 1↓');
    expect(sortIcon(multi, 'google')).toBe(' 2↑');
  });
});

describe('sortKeywords', () => {
  it('multi-key tie-break: sort by naver desc then google desc', () => {
    const rows = [
      kw({ keyword: 'a', naverMonthly: 100, googleVolume: 5 }),
      kw({ keyword: 'b', naverMonthly: 100, googleVolume: 9 }),
      kw({ keyword: 'c', naverMonthly: 200, googleVolume: 1 }),
    ];
    const out = sortKeywords(rows, [
      { col: 'naver', dir: 'desc' },
      { col: 'google', dir: 'desc' },
    ]);
    expect(out.map((r) => r.keyword)).toEqual(['c', 'b', 'a']);
  });
  it('empty sort returns the input order', () => {
    const rows = [kw({ keyword: 'a' }), kw({ keyword: 'b' })];
    expect(sortKeywords(rows, []).map((r) => r.keyword)).toEqual(['a', 'b']);
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test keyword-sort`. Expected: **FAIL** (module not found).
- [ ] **Step 3 (impl):** Create `keyword-sort.ts`. Complete code (CF `:415–462`, enum `compOrder`):

```ts
export type SortCol = 'volume' | 'naver' | 'google' | 'difficulty' | 'priority' | 'competition';
export interface SortState {
  col: SortCol;
  dir: 'asc' | 'desc';
}

export interface KeywordItem {
  keyword: string;
  category: string;
  searchIntent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  priority: 'high' | 'medium' | 'low';
  estimatedVolume?: string;
  difficulty?: string;
  used?: boolean;
  naverMonthly?: number;
  naverPc?: number;
  naverMobile?: number;
  naverComp?: 'HIGH' | 'MEDIUM' | 'LOW';
  googleVolume?: number;
  googleComp?: string;
  googleCpc?: number;
}

const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
const difficultyOrder: Record<string, number> = {
  어려움: 3,
  Hard: 3,
  보통: 2,
  Medium: 2,
  쉬움: 1,
  Easy: 1,
};
const volumeOrder: Record<string, number> = {
  높음: 3,
  High: 3,
  중간: 2,
  Medium: 2,
  낮음: 1,
  Low: 1,
};
// Enum (R-1) — CF used 높음/중간/낮음; we key on the SearchAd enum.
const compOrder: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export function colValue(kw: KeywordItem, col: SortCol): number {
  if (col === 'naver') return kw.naverMonthly ?? -1;
  if (col === 'google') return kw.googleVolume ?? -1;
  if (col === 'volume') return volumeOrder[kw.estimatedVolume || ''] ?? 0;
  if (col === 'priority') return priorityOrder[kw.priority] ?? 0;
  if (col === 'difficulty') return difficultyOrder[kw.difficulty || ''] ?? 0;
  if (col === 'competition') return compOrder[kw.naverComp || ''] ?? 0;
  return 0;
}

/** Click: replace with single sort & cycle desc→asc→remove. Shift+click: append a column. (CF :440–453) */
export function toggleSort(prev: SortState[], col: SortCol, shift: boolean): SortState[] {
  const idx = prev.findIndex((s) => s.col === col);
  if (idx >= 0) {
    const cur = prev[idx];
    if (cur.dir === 'desc') return prev.map((s, i) => (i === idx ? { ...s, dir: 'asc' as const } : s));
    return prev.filter((_, i) => i !== idx); // was asc → remove
  }
  if (shift) return [...prev, { col, dir: 'desc' as const }];
  return [{ col, dir: 'desc' as const }];
}

export function sortIcon(sortCols: SortState[], col: SortCol): string {
  const entry = sortCols.find((s) => s.col === col);
  if (!entry) return ' ↕';
  const idx = sortCols.indexOf(entry);
  const num = sortCols.length > 1 ? `${idx + 1}` : '';
  return entry.dir === 'desc' ? ` ${num}↓` : ` ${num}↑`;
}

export function sortKeywords(rows: KeywordItem[], sortCols: SortState[]): KeywordItem[] {
  if (sortCols.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const { col, dir } of sortCols) {
      const av = colValue(a, col);
      const bv = colValue(b, col);
      if (av !== bv) return dir === 'desc' ? bv - av : av - bv;
    }
    return 0;
  });
}
```
- [ ] **Step 4 (run):** `pnpm --filter client test keyword-sort`. Expected: **PASS**.
- [ ] **Step 5 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/lib/keyword-sort.ts packages/client/src/features/marketing/lib/__tests__/keyword-sort.test.ts
  git commit -m "feat(marketing): pure keyword multi-sort comparator (shift-click, enum competition — R-1) + tests"
  ```

### Task 1.3: `POST /api/mkt/keywords/recommend` — server golden orchestration (D-1)

> **Decision D-1:** the entire `discoverGoldenKeywords` flow (CF runs it client-side over dozens of `fetch` round-trips, `ideas-dashboard.tsx:249–408`) is **moved server-side** into one endpoint. One client call; Naver/Gemini stay server-side; the pure tiering/filter (Task 1.1) is unit-tested. The CF `app/api/keywords/recommend/route.ts` is a **different** (base-article keyword) flow — we reuse only the **path name**; the body is our golden orchestration.

**Files:**
- Create: `packages/server/src/services/mkt/ideas.service.ts` (golden function here)
- Create: `packages/server/src/controllers/mkt/ideas.controller.ts` (`recommendKeywords` here)
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (service — golden orchestration):** In `ideas.service.ts`, implement `recommendGoldenKeywords(input)`. Faithful to CF `:249–402`, enum throughout, Gemini via `generateTextWithGemini` with the **flash-class model** (`gemini-2.5-flash-lite`, per root CLAUDE.md batch guidance + spec Q-6/D). Use the Task 1.1 pure helpers for filter/dedupe/tiering.

```ts
import { generateTextWithGemini } from '../../providers/gemini.provider.js';
import { searchKeywords } from './external/naver-searchad.js';
import { getKeywordVolumes } from './external/dataforseo.js';
import {
  type GoldenCandidate,
  toCandidate,
  dedupeByMaxVolume,
  filterGoldenCandidates,
  classifyGoldenTiers,
} from './external/golden-keyword.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';

const GOLDEN_MODEL = 'gemini-2.5-flash-lite'; // flash-class for batch-ish golden calls (D / Q-6)

export interface RecommendInput {
  project: { name: string; industry?: string; brand_name?: string; brand_description?: string };
  seedKeyword?: string;
}
export interface KeywordGroup {
  category: string;
  keywords: Array<{
    keyword: string;
    category: string;
    searchIntent: 'commercial' | 'informational';
    priority: 'high' | 'medium' | 'low';
    estimatedVolume: string;
    difficulty: string;
    naverMonthly: number;
    naverPc: number;
    naverMobile: number;
    naverComp: 'HIGH' | 'MEDIUM' | 'LOW';
    googleVolume?: number;
    googleComp?: string;
    googleCpc?: number;
  }>;
}

const FALLBACK_SEEDS = ['성장클리닉', '키성장', '성장호르몬', '성장판검사', '아이키'];

function extractJsonArray(text: string): string[] {
  const m = text.match(/\[[\s\S]*?\]/);
  if (!m) return [];
  try {
    const v = JSON.parse(m[0]);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function recommendGoldenKeywords(
  input: RecommendInput
): Promise<{ groups: KeywordGroup[]; strategy: string }> {
  const { project, seedKeyword } = input;
  const { apiKey, secretKey, customerId } = config.naverAd;
  if (!apiKey || !secretKey || !customerId) {
    throw new AppError(502, 'Naver 키워드 API 키가 설정되지 않았습니다.'); // golden is Naver-specific (hard-fail OK)
  }
  const geminiOn = Boolean(config.gemini.apiKey);

  // 1. Seeds: user CSV, else Gemini-generated, else fallback
  let seeds: string[] = [];
  if (seedKeyword?.trim()) {
    seeds = seedKeyword.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean);
  } else if (geminiOn) {
    const seedPrompt = `Based on this business, generate 8 seed keywords for Naver search volume research.
Business: ${project.name}
Industry: ${project.industry || ''}
Brand: ${project.brand_name || project.name}
Description: ${project.brand_description || ''}

Return ONLY a JSON array of 8 Korean seed keywords (single words or short phrases, no spaces):
["키워드1","키워드2",...]`;
    try {
      seeds = extractJsonArray(await generateTextWithGemini(seedPrompt, 3, GOLDEN_MODEL));
    } catch {
      /* fall through */
    }
  }
  if (seeds.length === 0) seeds = FALLBACK_SEEDS;

  // 2. Naver volumes per seed (≤5 cap is handled inside searchKeywords; 400ms spacing — R-3/R-4)
  const all: GoldenCandidate[] = [];
  for (const seed of seeds) {
    try {
      const rows = await searchKeywords([seed]);
      for (const nk of rows) all.push(toCandidate(nk));
    } catch {
      /* skip a failing seed */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  const deduped = [...dedupeByMaxVolume(all).values()];

  // 3. Filter (enum) + sort
  let candidates = filterGoldenCandidates(deduped);

  // 3.5 Gemini relevance filter (≤100 candidates) — intersect
  if (geminiOn && candidates.length > 0) {
    const kwList = candidates.slice(0, 100).map((c) => c.keyword).join(', ');
    const filterPrompt = `You are a keyword relevance filter. Given a business and a list of keywords, return ONLY the keywords that are directly relevant to the business. Remove any unrelated keywords.

Business: ${project.name}
Industry: ${project.industry || ''}
Description: ${project.brand_description || ''}
${seedKeyword ? `Focus: ${seedKeyword}` : ''}

Keywords to filter:
${kwList}

Return ONLY a JSON array of relevant keywords (exact spelling):
["키워드1","키워드2",...]`;
    try {
      const relevant = new Set(extractJsonArray(await generateTextWithGemini(filterPrompt, 3, GOLDEN_MODEL)));
      if (relevant.size > 0) candidates = candidates.filter((c) => relevant.has(c.keyword));
    } catch {
      /* keep unfiltered */
    }
  }

  // 4. Tier (enum) → KeywordGroup[]
  const { gold, silver, bronze } = classifyGoldenTiers(candidates);
  const toItem = (g: GoldenCandidate, cat: string): KeywordGroup['keywords'][number] => ({
    keyword: g.keyword,
    category: cat,
    searchIntent: g.vol > 5000 ? 'commercial' : 'informational',
    priority: g.comp === 'LOW' ? 'high' : g.vol > 3000 ? 'high' : g.vol > 1000 ? 'medium' : 'low',
    estimatedVolume: g.vol > 5000 ? '높음' : g.vol > 1000 ? '중간' : '낮음',
    difficulty: g.comp === 'LOW' ? '쉬움' : '보통',
    naverMonthly: g.vol,
    naverPc: g.pc,
    naverMobile: g.mob,
    naverComp: g.comp,
  });
  const groups: KeywordGroup[] = [];
  if (gold.length) groups.push({ category: '🏆 황금 키워드', keywords: gold.map((g) => toItem(g, '🏆 황금 키워드')) });
  if (silver.length) groups.push({ category: '🥇 유망 키워드', keywords: silver.map((g) => toItem(g, '🥇 유망 키워드')) });
  if (bronze.length) groups.push({ category: '🥈 일반 키워드', keywords: bronze.map((g) => toItem(g, '🥈 일반 키워드')) });

  // 5. Google enrichment (best-effort)
  try {
    const allKws = groups.flatMap((g) => g.keywords.map((k) => k.keyword));
    if (allKws.length) {
      const gVols = await getKeywordVolumes(allKws);
      const gMap = new Map(gVols.map((gk) => [gk.keyword, gk]));
      for (const group of groups) {
        group.keywords = group.keywords.map((k) => {
          const gd = gMap.get(k.keyword) ?? gMap.get(k.keyword.replace(/\s+/g, ''));
          return gd ? { ...k, googleVolume: gd.searchVolume, googleComp: String(gd.competition), googleCpc: gd.cpc } : k;
        });
      }
    }
  } catch {
    /* google optional */
  }

  // 6. Strategy (Gemini, enum lists)
  let strategy = '';
  if (geminiOn) {
    const goldenItems = [...(groups[0]?.keywords ?? []), ...(groups[1]?.keywords ?? [])];
    const low = goldenItems.filter((g) => g.naverComp === 'LOW').slice(0, 10);
    const mid = goldenItems.filter((g) => g.naverComp === 'MEDIUM').slice(0, 15);
    const lowList = low.map((g) => `- ${g.keyword} (${g.naverMonthly?.toLocaleString()}/월, 경쟁:낮음)`).join('\n');
    const midList = mid.map((g) => `- ${g.keyword} (${g.naverMonthly?.toLocaleString()}/월, 경쟁:중간)`).join('\n');
    const strategyPrompt = `You are a Korean SEO/content marketing strategist. Analyze these golden keywords and create a concrete, actionable strategy.

Business: ${project.name} (${project.industry || ''})
Brand: ${project.brand_name || project.name}
Description: ${project.brand_description || ''}

=== 🥇 경쟁 낮음 키워드 (최우선 공략 대상) ===
${lowList || '(없음)'}

=== 🥈 경쟁 중간 키워드 (검색량 높은 순) ===
${midList || '(없음)'}

IMPORTANT: 경쟁 "낮음" 키워드는 반드시 전략에 포함하세요. 이들이 가장 빠르게 상위 노출할 수 있는 핵심 기회입니다.

Respond in Korean. Return strategy:
1. **핵심 전략 요약** (2-3문장, 비즈니스에 맞춤)
2. **즉시 공략 키워드** — 경쟁 낮음 키워드 전부 분석. 각각 왜 공략해야 하는지, 어떤 콘텐츠를 만들지
3. **콘텐츠 퍼널 설계** — 정보형(유입) → 상업형(전환) 키워드 연결 구조. 구체적 키워드 매핑
4. **추천 콘텐츠 주제** (7개) — 블로그 제목 예시 (경쟁 낮음 키워드 우선 활용)
5. **3개월 실행 로드맵** — 월별 구체적 액션 플랜`;
    try {
      strategy = await generateTextWithGemini(strategyPrompt, 3, GOLDEN_MODEL);
    } catch {
      /* strategy optional */
    }
  }

  return { groups, strategy };
}
```
> **Degradation (spec §5.3):** missing Naver creds → `AppError(502)` (golden is Korean/Naver-specific, hard-fail acceptable). Missing Gemini → skip seed-gen (use fallback seeds), skip relevance + strategy (return raw-volume tiers + empty strategy). Each external call is wrapped so one failure never 500s the whole flow.

- [ ] **Step 2 (controller):** In `ideas.controller.ts`, add `recommendKeywords` (the other two controllers come in Chunk 2):

```ts
import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { recommendGoldenKeywords, type RecommendInput } from '../../services/mkt/ideas.service.js';

/** POST /api/mkt/keywords/recommend  Body: { project, seedKeyword? } */
export const recommendKeywords = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<RecommendInput>;
  if (!body.project?.name) throw new AppError(400, 'project.name is required');
  const data = await recommendGoldenKeywords({ project: body.project, seedKeyword: body.seedKeyword });
  res.json({ success: true, data });
});
```
- [ ] **Step 3 (route):** In `mkt.routes.ts`, import `recommendKeywords` and register it under the keyword section:
  ```ts
  import { naverKeywords, googleKeywords } from '../controllers/mkt/keywords.controller.js';
  import { recommendKeywords } from '../controllers/mkt/ideas.controller.js';
  // …
  router.post('/naver/keywords', naverKeywords);
  router.post('/google/keywords', googleKeywords);
  router.post('/keywords/recommend', recommendKeywords);
  ```
- [ ] **Step 4 (typecheck):** `pnpm --filter server typecheck` (or `pnpm typecheck`) → **PASS**. (The controller imports the service; the service imports the pure helper + externals.)
- [ ] **Step 5 (manual smoke — optional, needs creds):** with real `.env`, `curl -X POST localhost:3500/api/mkt/keywords/recommend -H 'Content-Type: application/json' -d '{"project":{"name":"테스트","industry":"교육"}}'` → `{ success:true, data:{ groups, strategy } }`. Without Naver creds → `{ success:false, error:"Naver 키워드 API 키가…" }` (502). Defer the full eyeball to the dashboard (Task 1.6).
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/server/src/services/mkt/ideas.service.ts packages/server/src/controllers/mkt/ideas.controller.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing): POST /api/mkt/keywords/recommend — server-side golden orchestration (D-1, enum tiers)"
  ```

### Task 1.4: `KeywordTable.tsx` — the shared multi-sort sortable table

> Extract the keyword table CF inlines three times (naver-kw, google-kw, 보관함) into one component using the tested `keyword-sort` helpers (Task 1.2). Column set is driven by a `columns` prop so naver/google/saved can show different columns. **Competition badge keys on the enum** with a display map (`HIGH→높음`).

**Files:**
- Create: `packages/client/src/features/marketing/components/ideas/KeywordTable.tsx`

- [ ] **Step 1 (port → build):** Build `KeywordTable` from CF's table markup (the naver-kw table body, `ideas-dashboard.tsx` ~`:660–840` region — the sortable header row + per-row cells + ☆/★ pin + "콘텐츠 만들기"). Use worktree primitives (`Badge`, `Button` from `../../ui/*`, `cn` from `../../lib/utils`). Props:
  ```ts
  import type { KeywordItem, SortCol, SortState } from '../../lib/keyword-sort';
  interface ColumnSpec { key: SortCol | 'keyword' | 'intent'; label: string; sortable?: boolean; }
  interface KeywordTableProps {
    rows: KeywordItem[];
    columns: ColumnSpec[];
    sortCols: SortState[];
    onToggleSort: (col: SortCol, shift: boolean) => void;
    isPinned: (keyword: string) => boolean;
    onTogglePin: (kw: KeywordItem) => void;
    onMakeContent?: (kw: KeywordItem) => void; // no-op-friendly (Q-5)
    lang: string;
  }
  ```
  - Sort header cells call `onToggleSort(col, e.shiftKey)` and render `label + sortIcon(sortCols, col)`.
  - The displayed rows = `sortKeywords(rows, sortCols)` (compute inside render; the table is presentational — sort state lives in the parent dashboard).
  - **Enum competition badge:** a local `const COMP_LABEL: Record<'HIGH'|'MEDIUM'|'LOW', string> = { HIGH:'높음', MEDIUM:'중간', LOW:'낮음' }` for display + a color map (HIGH red / MEDIUM yellow / LOW green). Never compare/display the raw Korean string.
  - Port CF's `intentColors`/`intentLabels`/`priorityColors` (`:464–480`) as static literal maps (Tailwind JIT-safe).
  - ☆/★ pin button: `isPinned(kw.keyword) ? '★' : '☆'` → `onTogglePin(kw)`.
  - "콘텐츠 만들기" button → `onMakeContent?.(kw)` (no-op by default — Q-5, faithful port).
- [ ] **Step 2 (R-1 icon check + typecheck):** confirm any lucide icons used resolve at `^1.17.0`. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/ideas/KeywordTable.tsx
  git commit -m "feat(marketing): KeywordTable — shared multi-sort sortable keyword table (enum competition badge)"
  ```

### Task 1.5: `GoldenTierCards.tsx` + `MarketingLanguageTabs.tsx` + `use-golden-keywords.ts`

> The golden result header (tier summary + collapsible AI strategy), the thin language-tabs row (replaces CF's `AnalyticsLanguageTabs`), and the client hook for the recommend endpoint.

**Files:**
- Create: `packages/client/src/features/marketing/components/ideas/GoldenTierCards.tsx`
- Create: `packages/client/src/features/marketing/components/ideas/MarketingLanguageTabs.tsx`
- Create: `packages/client/src/features/marketing/api/use-golden-keywords.ts`

- [ ] **Step 1 (`use-golden-keywords.ts`):** A `useMutation` POSTing to `/api/mkt/keywords/recommend` and unwrapping `data` (groups + strategy). Mirror the `postKeywords` envelope-unwrap from `use-keywords.ts`:
  ```ts
  import { useMutation } from '@tanstack/react-query';
  import type { KeywordItem } from '../lib/keyword-sort';

  export interface KeywordGroup { category: string; keywords: KeywordItem[]; }
  export interface RecommendResult { groups: KeywordGroup[]; strategy: string; }
  export interface RecommendBody {
    project: { name: string; industry?: string; brand_name?: string; brand_description?: string };
    seedKeyword?: string;
  }

  export function useDiscoverGoldenKeywords() {
    return useMutation({
      mutationFn: async (body: RecommendBody): Promise<RecommendResult> => {
        const res = await fetch('/api/mkt/keywords/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean; data?: RecommendResult; error?: string;
        };
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || `황금 키워드 분석 실패 (HTTP ${res.status})`);
        }
        return json.data;
      },
    });
  }
  ```
- [ ] **Step 2 (`MarketingLanguageTabs.tsx`):** Thin pill row. Reads `project.target_languages` (ko pinned first), labels from `SUPPORTED_LANGUAGES`. Props `{ targetLanguages: string[]; selectedLang: string; onLangChange: (lang: string) => void }`:
  ```tsx
  import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
  import { cn } from '../../lib/utils';
  // langs = ['ko', ...targetLanguages.filter(l => l !== 'ko')]; pill per lang;
  // label = SUPPORTED_LANGUAGES.find(s => s.code === lang)?.nativeName ?? lang.toUpperCase();
  // flag prefix when found. active pill = bg-primary text-primary-foreground.
  ```
  > **No "+ 언어 추가" dialog here** (Q-4): editing target languages stays in project settings (`TargetLanguagesSection`). This row is read-only over `target_languages`.
- [ ] **Step 3 (`GoldenTierCards.tsx`):** Props `{ groups: KeywordGroup[]; strategy: string; loading: boolean; onClearStrategy: () => void }`. Render a 4-stat summary grid (counts: 🏆 gold / 🥇 silver / 🥈 bronze / total) + a collapsible 🏆 AI strategy panel. Strategy renders via the same minimal markdown-lite transform CF uses (`ideas-dashboard.tsx:696` region — bold `**…**` + `<br>` line breaks only) through `dangerouslySetInnerHTML`. Keep it minimal; no full markdown lib.
- [ ] **Step 4 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-golden-keywords.ts packages/client/src/features/marketing/components/ideas/GoldenTierCards.tsx packages/client/src/features/marketing/components/ideas/MarketingLanguageTabs.tsx
  git commit -m "feat(marketing): golden-keyword hook + GoldenTierCards + thin MarketingLanguageTabs"
  ```

### Task 1.6: `IdeasDashboard.tsx` — naver-kw + google-kw + golden wired (ideas/youtube/saved stubbed)

> The hub. Lands the **keyword-analysis** half (naver-kw, google-kw, golden); the ideas/youtube/saved tabs render a "준비 중" stub until Chunk 2. The page stays behind the placeholder until Chunk 3 (eyeball this by temporarily importing it, or wait for Chunk 3).

**Files:**
- Create: `packages/client/src/features/marketing/components/ideas/IdeasDashboard.tsx`

- [ ] **Step 1 (port → build the shell + keyword tabs):** Port CF's `IdeasDashboard` outer structure (`ideas-dashboard.tsx:91–622`), adapting the data layer:
  - **Props:** `{ projectId: string }` (explicit; `IdeasPage` passes it). Read the project via `useProject(projectId)`; `const project = projectQuery.data`. Guard render until `project` is loaded.
  - **State** (component-local, mirrors CF): `tab: TabId` (`'naver-kw'|'google-kw'|'youtube'|'ideas'|'saved'`), `keywordGroups`, `seedKeyword`, `selectedCategory`, `sortCols: SortState[]`, `generating`, `goldenLoading`, `goldenStrategy`. `selectedLang` + `setSelectedLanguage` come from `ui-store` (NOT local `useState` — delta vs CF, which used local state).
  - **TABS array + sub-tab gating** (CF `:603`): render `TABS.filter(t => t.id !== 'naver-kw' || selectedLang === 'ko')` — `naver-kw` hidden unless ko. `saved` shows a count badge (wired in Chunk 2; show `0` for now or read `project.saved_keywords?.length`).
  - **`<MarketingLanguageTabs targetLanguages={project.target_languages} selectedLang={selectedLang} onLangChange={setSelectedLanguage} />`** at the top.
  - **AI keyword-map (naver-kw `generateKeywords`)** (CF `:136–246`): build CF's language-aware prompt (`langMap` ko→Korean etc.), run **`useAiGeneration.generate(prompt, model)`** (NOT `fetchAiGenerate` — B-1) with a flash-class model id from `TEXT_MODELS` (e.g. `gemini-2.5-flash-lite`), parse JSON `groups` in `onComplete`, then enrich (ko) via `fetchNaverKeywords` **batched 5/req with 300 ms spacing** (R-4) — exact-then-stripped keyword match, `estimatedVolume` bucketing (`>5000 높음 / >1000 중간 / >0 낮음`). Map the Naver `competition` enum straight onto `naverComp`.
  - **AI keyword-map (google-kw `handleGoogleKeywords`)** (CF `:501–558`): build the Google prompt, run `useAiGeneration.generate`, enrich via `fetchGoogleKeywords(allKws, locCode, langCode)` using CF's lang→code map (`:526–527`: ko `ko`/2410, ja `ja`/2392, zh `zh`/2156, th `_`/2764, vi `_`/2704, else `en`/2840). (Optionally TDD that lang→code map as a tiny pure helper in `keyword-sort.ts` or a `lib/keyword-locale.ts` — see §Testing.)
  - **Golden (`discoverGoldenKeywords`)** → now **one call**: `useDiscoverGoldenKeywords().mutateAsync({ project: { name, industry, brand_name, brand_description }, seedKeyword })`; on success `setKeywordGroups(data.groups)` + `setGoldenStrategy(data.strategy)` + `setSelectedCategory(null)`. Drive `goldenLoading` from the mutation's `isPending`.
  - **Sort wiring:** `onToggleSort = (col, shift) => setSortCols(prev => toggleSort(prev, col, shift))`; pass `sortCols` + `onToggleSort` into `<KeywordTable>`. The displayed/filtered rows: `allKeywords = keywordGroups.flatMap(...)`; `filteredKeywords = selectedCategory ? filter : all`; the table sorts internally via `sortKeywords`.
  - **Category chips:** render one chip per `keywordGroups[].category` (+ "전체") → `setSelectedCategory`.
  - **`<GoldenTierCards groups={keywordGroups} strategy={goldenStrategy} loading={goldenLoading} onClearStrategy={() => setGoldenStrategy('')} />`** shown when the golden tabs/results exist.
  - **Pin handlers:** `togglePin`/`isPinned` over the saved-keywords source — stub for now (Chunk 2 wires `useSavedKeywords`); a temporary `const savedKeywords = project.saved_keywords ?? []` read is fine, with `onTogglePin` a no-op until Chunk 2 (note the stub in a `// TODO Chunk 2` comment).
  - **Columns:** naver-kw table columns = keyword/intent/priority/volume/naver(검색량)/competition/google; google-kw columns = keyword/intent/priority/google(검색량)/googleComp/googleCpc. (Use the `ColumnSpec[]` prop.)
  - **ideas / youtube / saved tab bodies:** render `<div className="...">준비 중 (Chunk 2)</div>` placeholders.
- [ ] **Step 2 (typecheck + R-1 icon check):** `pnpm --filter client typecheck` → PASS. Confirm no `fetchAiGenerate` import (use `useAiGeneration`), no `높음/중간/낮음` competition comparison anywhere (grep), no `@/components/ui/*` imports.
- [ ] **Step 3 (manual eyeball — optional now, required in Chunk 3):** temporarily render `<IdeasDashboard projectId={…}/>` (e.g. swap the route briefly) to confirm naver-kw AI map → Naver enrichment + the sortable table (shift-click multi-sort), google-kw map → Google enrichment, and 황금 키워드 → tiers + strategy. Revert the temporary route change (the real swap is Chunk 3). State whether you eyeballed now or deferred.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/ideas/IdeasDashboard.tsx
  git commit -m "feat(marketing): IdeasDashboard naver-kw + google-kw + golden tabs (sort + tiers wired; ideas/youtube/saved stubbed)"
  ```

---

## Chunk 2 (Phase 2b): Ideas + trending + saved

> The two genuinely new external integrations (Gemini ideas, YouTube Data API) + the persistence path. Adds the two remaining endpoints (`/ideas/generate`, `/ideas/trending`), **wires** `youtube-data.ts`, the `IdeaCard`/`TrendingFeed` components, the saved-keyword hooks (over the `saved_keywords` JSONB on the owner's project row), and wires the ideas/youtube/saved tabs in `IdeasDashboard`. **Datalab time-series stays SKIPPED** — the Naver trend list uses SearchAd (`searchKeywords`) for CF parity.

### Task 2.1: Server `ideas.service` — idea generation + trending assembly + pure helpers (TDD)

> Add `generateIdeas` + `assembleTrending` to `ideas.service.ts`, **wire** `youtube-data.ts` (`searchVideos` + `getVideoStats`), and extract the **`formatViews`** pure helper (CF trending route `:141`) so it is unit-tested.

**Files:**
- Modify: `packages/server/src/services/mkt/ideas.service.ts` (add `generateIdeas`, `assembleTrending`, `formatViews`)
- Modify: `packages/server/src/services/mkt/external/youtube-data.ts` (wire `searchVideos` + `getVideoStats`)
- Test: `packages/server/src/services/mkt/__tests__/ideas.service.test.ts`

- [ ] **Step 1 (test — `formatViews` + trending merge):** Write the failing test. `formatViews`: `억`/`만`/raw boundaries (`100_000_000 → "1.0억"`, `10_000 → "1.0만"`, `1_000 → "1,000"`, `999 → "999"`). The trending **merge/sort** (snippet+stats join by videoId, sort by viewCount desc) is best tested via a small pure `mergeYoutube(snippets, stats)` helper:

```ts
import { describe, it, expect } from 'vitest';
import { formatViews, mergeYoutube } from '../ideas.service';

describe('formatViews', () => {
  it('formats 억 / 만 / raw', () => {
    expect(formatViews(123_000_000)).toBe('1.2억');
    expect(formatViews(45_000)).toBe('4.5만');
    expect(formatViews(1_500)).toBe('1,500');
    expect(formatViews(999)).toBe('999');
  });
});

describe('mergeYoutube', () => {
  it('joins snippet+stats by videoId and sorts by viewCount desc', () => {
    const snippets = [
      { videoId: 'a', title: 'A', channelTitle: 'ca', publishedAt: 'p', thumbnailUrl: 't', description: '' },
      { videoId: 'b', title: 'B', channelTitle: 'cb', publishedAt: 'p', thumbnailUrl: 't', description: '' },
    ];
    const stats = [
      { videoId: 'a', viewCount: 100, likeCount: 1, commentCount: 0 },
      { videoId: 'b', viewCount: 9000, likeCount: 9, commentCount: 1 },
    ];
    const out = mergeYoutube(snippets, stats, 'kw');
    expect(out.map((v) => v.id)).toEqual(['b', 'a']); // sorted desc
    expect(out[0].views).toBe('9,000');
    expect(out[0].keyword).toBe('kw');
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter server test ideas.service`. Expected: **FAIL**.
- [ ] **Step 3 (wire youtube-data.ts):** Replace the two 501 throws with real Data API calls (config.youtubeApiKey gate → `AppError(502)` when blank; surface 403 quotaExceeded clearly — R-2):
  ```ts
  // searchVideos(query, { publishedAfter?, order?, relevanceLanguage?, maxResults? }) → GET /youtube/v3/search
  //   part=snippet, q, type=video, order='viewCount', maxResults=5 → map items → YTVideoSnippet[]
  // getVideoStats(videoIds) → GET /youtube/v3/videos?part=statistics,snippet&id=ids → YTVideoStats[]
  ```
  > Keep `searchVideos`'s signature compatible with the existing `(_query, _maxResults?)` export OR widen it to accept an options object — pick the options object and update the (no-op) skeleton signature; nothing else imports it yet.
- [ ] **Step 4 (impl `generateIdeas` + `assembleTrending` + helpers in ideas.service):**
  - **`formatViews(views)`** — verbatim CF `:141–146`.
  - **`mergeYoutube(snippets, stats, keyword)`** — join by videoId, build the `{id,title,channelTitle,thumbnail,url,views,viewCount,likes,comments,publishedAt,keyword}` row, sort by viewCount desc.
  - **`generateIdeas({ topic, channelTypes?, industry?, targetAudience? })`** — port CF `app/api/ideas/generate/route.ts`: build the per-channel idea prompt (channels default `['blog','cardnews','youtube']`), `generateTextWithGemini(prompt, 3, GOLDEN_MODEL)` (flash-class), extract the JSON array, return `{ ideas, topic }`. Missing Gemini → `AppError(502, 'Gemini API 키가 설정되지 않았습니다.')`.
  - **`assembleTrending({ keywords, language?, period? })`** — port CF `app/api/ideas/trending/route.ts`, **wrapping each source in try/catch and assembling partials (never 500 the whole request)**:
    1. **YouTube** (config.youtubeApiKey set): for `keywords.slice(0,3)` (R-2 quota cap), compute `publishedAfter` from `period` (week 7d / month 30d / else 90d), `searchVideos(kw, { publishedAfter, order:'viewCount', relevanceLanguage: language||'ko', maxResults:5 })` → `getVideoStats(ids)` → `mergeYoutube`; concat across keywords then sort by viewCount desc.
    2. **Naver trends** (ko or no lang, config.naverAd set): reuse `searchKeywords([kw])` for `keywords.slice(0,5)` → take top 3 rel keywords each → `{ keyword, totalSearches, compIdx: enum, trend:'data' }`. **(Datalab time-series SKIPPED — D/spec §2.2.)** Fallback when no creds/results: `keywords.map(k => ({ keyword:k, totalSearches:0, trend:'estimated', change:'' }))`.
    3. **Google trends:** placeholder `keywords.map(k => ({ keyword:k, trend:'rising', change:'' }))` (no official API — CF parity).
    - Return `{ youtube, naverTrends, googleTrends }`.
- [ ] **Step 5 (run):** `pnpm --filter server test ideas.service` → **PASS** (formatViews + mergeYoutube). `pnpm --filter server typecheck` → PASS.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/server/src/services/mkt/ideas.service.ts packages/server/src/services/mkt/external/youtube-data.ts packages/server/src/services/mkt/__tests__/ideas.service.test.ts
  git commit -m "feat(marketing): ideas-generate + trending service (YouTube Data wired, Datalab skipped) + tested formatViews/mergeYoutube"
  ```

### Task 2.2: Server controllers + routes for `/ideas/generate` + `/ideas/trending`

**Files:**
- Modify: `packages/server/src/controllers/mkt/ideas.controller.ts` (add `generateIdeas`, `trending`)
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (controllers):** Add to `ideas.controller.ts`:
  ```ts
  import { recommendGoldenKeywords, generateIdeas as genIdeas, assembleTrending } from '../../services/mkt/ideas.service.js';

  /** POST /api/mkt/ideas/generate  Body: { topic, channelTypes?, industry?, targetAudience? } */
  export const generateIdeas = asyncHandler(async (req: Request, res: Response) => {
    const { topic, channelTypes, industry, targetAudience } = req.body as {
      topic?: string; channelTypes?: string[]; industry?: string; targetAudience?: string;
    };
    if (!topic) throw new AppError(400, 'topic is required');
    const data = await genIdeas({ topic, channelTypes, industry, targetAudience });
    res.json({ success: true, data });
  });

  /** POST /api/mkt/ideas/trending  Body: { keywords: string[], language?, period? } */
  export const trending = asyncHandler(async (req: Request, res: Response) => {
    const { keywords, language, period } = req.body as {
      keywords?: string[]; language?: string; period?: 'week' | 'month' | 'quarter';
    };
    if (!Array.isArray(keywords) || keywords.length === 0) {
      throw new AppError(400, 'keywords[] is required and must be non-empty');
    }
    const data = await assembleTrending({ keywords, language, period });
    res.json({ success: true, data });
  });
  ```
- [ ] **Step 2 (routes):** In `mkt.routes.ts`, import + register under the keyword section:
  ```ts
  import { recommendKeywords, generateIdeas, trending } from '../controllers/mkt/ideas.controller.js';
  // …
  router.post('/keywords/recommend', recommendKeywords); // (from Task 1.3)
  router.post('/ideas/generate', generateIdeas);
  router.post('/ideas/trending', trending);
  ```
- [ ] **Step 3 (typecheck):** `pnpm --filter server typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/server/src/controllers/mkt/ideas.controller.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing): POST /api/mkt/ideas/generate + /ideas/trending routes (partials, never 500)"
  ```

### Task 2.3: Client hooks — `use-ideas.ts` + `use-saved-keywords.ts` (+ `mktKeys.savedKeywords`)

> `use-ideas.ts` = the two transient mutations (ideas + trending). `use-saved-keywords.ts` = the persistence wrapper over `useProject`/`useUpdateProject` (the array-merge lives here so callers never hand-roll it). **No `user_id` stamping** — the write is an `update` on the owner's project row (RLS already satisfied).

**Files:**
- Create: `packages/client/src/features/marketing/api/use-ideas.ts`
- Create: `packages/client/src/features/marketing/api/use-saved-keywords.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-saved-keywords.test.tsx`
- Modify: `packages/client/src/features/marketing/api/queries.ts` (add `mktKeys.savedKeywords`)

- [ ] **Step 1 (`mktKeys.savedKeywords`):** In `queries.ts`, add to the `mktKeys` factory:
  ```ts
  savedKeywords: (projectId: string) => ['mkt', 'saved-keywords', projectId] as const,
  ```
  (Used for read-cache identity; the actual read piggybacks on `useProject`.)
- [ ] **Step 2 (`use-ideas.ts`):** Two mutations, envelope-unwrapping `data`:
  ```ts
  import { useMutation } from '@tanstack/react-query';
  // useGenerateIdeas: POST /api/mkt/ideas/generate  body { topic, channelTypes? } → { ideas, topic }
  // useTrending:      POST /api/mkt/ideas/trending   body { keywords, language?, period? } → { youtube, naverTrends, googleTrends }
  // (same postJson<T> envelope-unwrap pattern as use-golden-keywords.ts)
  ```
  Define the `Idea`, `YTVideo`, `TrendItem` types here (client-local — do NOT import server types).
- [ ] **Step 3 (test — `use-saved-keywords`):** Write the failing test (mock `@/lib/supabase`, `QueryClient` wrapper — mirror existing `api/__tests__` harnesses). Cover: `useAddSavedKeyword` appends (dedup by keyword) and writes `saved_keywords` via update; `useRemoveSavedKeyword` filters by keyword; `useClearSavedKeywords` writes `[]`; the read derives from `useProject(projectId).data.saved_keywords ?? []`.

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  },
}));
import { supabase } from '@/lib/supabase';
import { useAddSavedKeyword, useRemoveSavedKeyword } from '../use-saved-keywords';

const mockFrom = vi.mocked(supabase.from);
function qc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}
function wrap(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useAddSavedKeyword', () => {
  let client: QueryClient;
  beforeEach(() => {
    client = qc();
    vi.clearAllMocks();
  });
  it('appends the keyword and writes saved_keywords via update', async () => {
    // seed the project cache so the hook can read existing saved_keywords
    client.setQueryData(['mkt', 'project', 'p1'], { id: 'p1', saved_keywords: [{ keyword: 'old' }] });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as never);
    const { result } = renderHook(() => useAddSavedKeyword('p1'), { wrapper: wrap(client) });
    await act(async () => {
      await result.current.mutateAsync({ keyword: 'new', category: '🏆 황금 키워드', priority: 'high' });
    });
    const payload = updateMock.mock.calls[0][0] as { saved_keywords: Array<{ keyword: string }> };
    expect(payload.saved_keywords.map((k) => k.keyword)).toEqual(['old', 'new']);
    expect(eqMock).toHaveBeenCalledWith('id', 'p1');
  });
  it('does not duplicate an already-saved keyword', async () => {
    client.setQueryData(['mkt', 'project', 'p1'], { id: 'p1', saved_keywords: [{ keyword: 'dup' }] });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as never);
    const { result } = renderHook(() => useAddSavedKeyword('p1'), { wrapper: wrap(client) });
    await act(async () => {
      await result.current.mutateAsync({ keyword: 'dup', priority: 'low' });
    });
    const payload = updateMock.mock.calls[0][0] as { saved_keywords: Array<{ keyword: string }> };
    expect(payload.saved_keywords.map((k) => k.keyword)).toEqual(['dup']); // unchanged
  });
});

describe('useRemoveSavedKeyword', () => {
  it('filters the keyword out and writes the rest', async () => {
    const client = qc();
    client.setQueryData(['mkt', 'project', 'p1'], {
      id: 'p1',
      saved_keywords: [{ keyword: 'a' }, { keyword: 'b' }],
    });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ update: updateMock } as never);
    const { result } = renderHook(() => useRemoveSavedKeyword('p1'), { wrapper: wrap(client) });
    await act(async () => {
      await result.current.mutateAsync('a');
    });
    const payload = updateMock.mock.calls[0][0] as { saved_keywords: Array<{ keyword: string }> };
    expect(payload.saved_keywords.map((k) => k.keyword)).toEqual(['b']);
  });
});
```
- [ ] **Step 4 (run):** `pnpm --filter client test use-saved-keywords`. Expected: **FAIL** (module not found).
- [ ] **Step 5 (impl `use-saved-keywords.ts`):** Wrap `useProject` (read) + `useUpdateProject` (write). The read returns `project.saved_keywords ?? []`. Each mutation reads the current array from the project cache, computes the next array (append-dedup / filter / clear), and calls `useUpdateProject().mutateAsync({ id: projectId, updates: { saved_keywords: next } })` — **no `user_id`** (the row is the owner's; RLS satisfied). Provide `useSavedKeywords(projectId)`, `useAddSavedKeyword(projectId)`, `useRemoveSavedKeyword(projectId)`, `useClearSavedKeywords(projectId)`. (You may write directly via `supabase.from('mkt_projects').update(...).eq('id', projectId)` to match the test's mock shape, OR delegate to `useUpdateProject`; if you delegate, adjust the test to spy `useUpdateProject`. The test above assumes the direct-update shape — keep them consistent.)
  > **Read source:** derive the current array from `queryClient.getQueryData(mktKeys.project(projectId))` (or `useProject(projectId).data`) so the merge sees the latest. `onSuccess` invalidates `mktKeys.project(projectId)` so the dashboard re-reads.
- [ ] **Step 6 (run):** `pnpm --filter client test use-saved-keywords` → **PASS**. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-ideas.ts packages/client/src/features/marketing/api/use-saved-keywords.ts packages/client/src/features/marketing/api/__tests__/use-saved-keywords.test.tsx packages/client/src/features/marketing/api/queries.ts
  git commit -m "feat(marketing): use-ideas (transient) + use-saved-keywords (saved_keywords JSONB, owner-row update) + mktKeys.savedKeywords"
  ```

### Task 2.4: `IdeaCard.tsx` + `TrendingFeed.tsx` (ports)

> Two presentational ports. `IdeaCard` buttons stay **no-op** (Q-5, faithful). `TrendingFeed` folds CF's Google/Naver trend lists + the YouTube grid (CF kept the grid inline in the dashboard) into one component.

**Files:**
- Create: `packages/client/src/features/marketing/components/ideas/IdeaCard.tsx`
- Create: `packages/client/src/features/marketing/components/ideas/TrendingFeed.tsx`

- [ ] **Step 1 (`IdeaCard.tsx`):** Port CF `idea-card.tsx` (38 lines) verbatim. Rewire `Button` → `../../ui/button`; drop `'use client'`. Props `{ channel, title, structure, outline: string[], onGenerate: () => void, onSave: () => void }` + `CHANNEL_ICONS` map. **Both callbacks default to no-op at the callsite** (Q-5).
- [ ] **Step 2 (`TrendingFeed.tsx`):** Port CF `trending-feed.tsx` (Google/Naver lists) + add the YouTube grid (thumbnail/title/channel/views/likes), all calling `onSelectTopic(topic)` to seed the AI 아이디어 tab. Props `{ youtube: YTVideo[]; googleTrends: TrendItem[]; naverTrends: TrendItem[]; onSelectTopic: (topic: string) => void }`. Drop `'use client'`; `<img>` for thumbnails (plain, no Next).
- [ ] **Step 3 (R-1 icon check + typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/ideas/IdeaCard.tsx packages/client/src/features/marketing/components/ideas/TrendingFeed.tsx
  git commit -m "feat(marketing): port IdeaCard (no-op buttons — Q-5) + TrendingFeed (YouTube grid + trend lists)"
  ```

### Task 2.5: Wire ideas / youtube / saved tabs in `IdeasDashboard`

> Replace the Chunk 1 stubs with the real flows + wire saved-keyword persistence.

**Files:**
- Modify: `packages/client/src/features/marketing/components/ideas/IdeasDashboard.tsx`

- [ ] **Step 1 (ideas tab):** Add ideas state (`ideas`, `selectedTopic`, `ideaTopic`, `ideaLoading`). `handleGenerateIdeas(topic)` (CF `:578`): `setTab('ideas')`, `useGenerateIdeas().mutateAsync({ topic, channelTypes:['blog','cardnews','youtube'] })` → `setIdeas(data.ideas)`. Render a topic `Input` + `<IdeaCard ... onGenerate={() => {}} onSave={() => {}} />` per idea (no-op — Q-5). Empty state ✨ (CF `:1074`).
- [ ] **Step 2 (youtube/trending tab):** Add trending state (`trendKeywords`, `period`, `youtubeResults`, `naverTrends`, `googleTrends`, `trendLoading`). `handleTrendSearch` (CF `:561`): `useTrending().mutateAsync({ keywords: trendKeywords.split(','), language: selectedLang, period })` → set the three result arrays. Render the keyword `Input` + `PERIOD_OPTIONS` selector + `<TrendingFeed youtube={youtubeResults} googleTrends={googleTrends} naverTrends={naverTrends} onSelectTopic={handleGenerateIdeas} />`. Empty state 🔴 (CF region).
- [ ] **Step 3 (saved tab + pin persistence):** Replace the Chunk 1 pin stubs with `useSavedKeywords(projectId)` + `useAddSavedKeyword`/`useRemoveSavedKeyword`/`useClearSavedKeywords`. `isPinned(keyword) = saved.some(s => s.keyword === keyword)`; `togglePin(kw)` adds/removes. The `saved` tab renders `<KeywordTable rows={saved} ...>` + a 전체 삭제 button (`useClearSavedKeywords`). The `saved` tab count badge reads `saved.length`. Empty state 📁 (CF `:1174`).
- [ ] **Step 4 (typecheck + sanity):** `pnpm --filter client typecheck` → PASS. Grep again: no `높음/중간/낮음` competition predicate, no `fetchAiGenerate`, no `/api/ai/`/`/api/storage/` (non-`mkt`) drift.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/ideas/IdeasDashboard.tsx
  git commit -m "feat(marketing): wire ideas / youtube-trending / saved tabs (pin persistence over saved_keywords)"
  ```

---

## Chunk 3: Page swap + wire `/marketing/ideas`

> The one-line route swap + the page wrapper. `IdeasPage` guards on `ui-store.selectedProjectId` (mirrors `ContentPage`'s "콘텐츠를 선택하세요" guard) and mounts `<IdeasDashboard projectId={…}/>`. The sidebar nav item already exists (`Sidebar.tsx:16`) — the route swap is what makes it active.

### Task 3.1: `IdeasPage.tsx` + barrel export

**Files:**
- Create: `packages/client/src/features/marketing/pages/IdeasPage.tsx`
- Modify: `packages/client/src/features/marketing/index.ts`

- [ ] **Step 1 (impl):** Mirror `ContentPage.tsx`'s guard:
  ```tsx
  import { IdeasDashboard } from '../components/ideas/IdeasDashboard';
  import { useUIStore } from '../store/ui-store';

  export function IdeasPage() {
    const selectedProjectId = useUIStore((s) => s.selectedProjectId);
    if (!selectedProjectId) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          프로젝트를 선택하세요
        </div>
      );
    }
    return <IdeasDashboard projectId={selectedProjectId} />;
  }
  ```
- [ ] **Step 2 (barrel):** In `features/marketing/index.ts`, add `export { IdeasPage } from './pages/IdeasPage';` (under the Pages section).
- [ ] **Step 3 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/pages/IdeasPage.tsx packages/client/src/features/marketing/index.ts
  git commit -m "feat(marketing): IdeasPage (project guard + IdeasDashboard) + barrel export"
  ```

### Task 3.2: Swap the route placeholder → `<IdeasPage/>`

**Files:**
- Modify: `packages/client/src/router/index.tsx`

- [ ] **Step 1 (impl):**
  - Add `IdeasPage` to the marketing import (`:6`): `import { MarketingLayout, ContentPage, SettingsPage, PlaceholderPage, IdeasPage } from '../features/marketing';`.
  - Replace line 309: `{ path: 'ideas', element: <PlaceholderPage title="키워드 / 아이디어" /> },` → `{ path: 'ideas', element: <IdeasPage /> },`.
  - **Leave the other placeholders unchanged** (`publish`/`monitoring`/`site-analysis`/`meta-analytics`/`competitors`/`strategy`/`ads` stay `PlaceholderPage` — OUT of scope).
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3 (manual-verify @superpowers:verification-before-completion):** `pnpm dev`; open `/marketing`; select a project → click sidebar **💡 키워드 / 아이디어**.
  - **Project guard:** with no project selected, "프로젝트를 선택하세요" shows.
  - **Language tabs** render from `target_languages` (ko first). With ko selected, **N 키워드 분석** tab is visible; switch to a non-ko language → the `naver-kw` tab disappears (CF gating).
  - **N 키워드 분석:** AI 키워드 생성 → 30–50 keywords → Naver volumes fill (real creds) → the sortable table; click a column header to sort, **shift+click** a second header to multi-sort (numbered ↓/↑ icons). 🏆 황금 키워드 → tiers + AI strategy panel.
  - **G 키워드 분석:** AI map → Google volume/competition/CPC columns.
  - **유튜브 유행 분석:** enter keywords → YouTube video grid (views formatted 억/만) + Naver/Google trend lists; click a video/trend → seeds the AI 아이디어 tab.
  - **AI 아이디어:** topic → one `IdeaCard` per channel; 생성/보관 buttons are no-ops (Q-5 — expected).
  - **보관함:** ☆ a keyword in any table → ★ + the 보관함 count badge increments; reload the page → the pin persists (read from `saved_keywords`); 전체 삭제 clears it.
  - 🔴 **graceful degradation:** with creds missing, each source degrades (naver/google columns show `-`, golden 502s with a clear message, trending returns partials) rather than crashing.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/router/index.tsx
  git commit -m "feat(marketing): wire /marketing/ideas → IdeasPage (replace placeholder)"
  ```

---

## Chunk 4: Verification (full suite + manual E2E + scope confirmation)

> @superpowers:verification-before-completion — run every gate and confirm output before any "done" claim. Evidence before assertions.

### Task 4.1: Automated gates

**Files:** none (verification only).

- [ ] **Step 1 (unit tests):** `pnpm --filter server test mkt` → server marketing tests green, including the **new** `golden-keyword` (filter/dedupe/tier, enum boundaries) + `ideas.service` (formatViews + mergeYoutube). `pnpm --filter client test marketing` → client marketing tests green, including the **new** `keyword-sort` (colValue/toggleSort/sortIcon/sortKeywords) + `use-saved-keywords` on top of the Phase 1a–1d suite (1d ended at 313 marketing tests; expect that plus the new files). Record exact file/test counts. Pre-existing non-marketing failures (auth/RequireAuthedWithPin, games/SpeakingPlayer, viewer/GameListViewer — jsdom `window.matchMedia`) are unchanged and out of scope.
- [ ] **Step 2 (typecheck):** `pnpm typecheck` (all packages: shared/server/client) → **PASS**. The `Project.saved_keywords` add (Chunk 0), the new server service/controller, and the new client hooks/components must not introduce any error.
- [ ] **Step 3 (lint):** `pnpm lint` → **no new errors** from Phase 2 code. Pre-existing remotion TS-parse errors + pre-existing warnings are unchanged. Confirm no leftover `'use client'` / `@next/next/no-img-element` in the new components, and no `/api/ai/`/`/api/storage/` (non-`mkt`) string literals.
- [ ] **Step 4 (build):** `pnpm --filter client build` → **PASS**. Pre-existing chunk-size warning unchanged; no new build errors. (Server has no build step in this repo — `tsx` runtime; `pnpm --filter server typecheck` covers it.)
- [ ] **Step 5:** No commit (verification only).

### Task 4.2: Manual E2E + scope confirmation

**Files:** none (verification only).

- [ ] **Step 1 (ideas full flow):** Re-run the Chunk 3 Task 3.2 Step 3 manual flow end-to-end (language gating → naver-kw AI map + Naver enrichment + shift-click multi-sort → 황금 키워드 tiers + strategy → google-kw → youtube trending → AI 아이디어 → pin/reload persistence → 전체 삭제). Confirm with **real `.env` creds** in the worktree.
- [ ] **Step 2 (R-1 enum regression guard — the #1 risk):** grep the whole marketing feature for Korean competition strings used as **predicates** (not display): `grep -rn "'낮음'\|'중간'\|'높음'\|=== '낮음'" packages/client/src/features/marketing packages/server/src/services/mkt packages/server/src/controllers/mkt`. The ONLY allowed occurrences are **display label maps** (`{ HIGH:'높음', MEDIUM:'중간', LOW:'낮음' }`) and the `naver-searchad.ts mapCompetition` input side (`compIdx === '높음'`). **No tier/filter/sort predicate may compare the Korean string.** If any does → fix before claiming done.
- [ ] **Step 3 (golden is server-side — D-1):** confirm the client makes **one** call per golden run: `grep -rn "keywords/recommend" packages/client/src/features/marketing` → exactly the `use-golden-keywords.ts` POST. The client must NOT loop Naver/Gemini itself for golden (the orchestration is server-side). The dashboard's golden handler calls `useDiscoverGoldenKeywords().mutateAsync`, not `fetchNaverKeywords` in a seed loop.
- [ ] **Step 4 (scope confirmation — static):**
  - `router/index.tsx`: `ideas` → `<IdeasPage/>`; **`publish`/`monitoring`/`site-analysis`/`meta-analytics`/`competitors`/`strategy`/`ads` still render `PlaceholderPage`** (Phase 3/4/5 — OUT).
  - `grep -rn "keyword-analysis-dashboard\|AnalyticsLanguageTabs" packages/client/src/features/marketing` → **0 results** (CF's dead keyword dashboard NOT ported; analytics tabs rebuilt as `MarketingLanguageTabs`).
  - `naver-datalab.ts searchTrend` still throws 501 (Datalab time-series SKIPPED — D/spec §2.2). The Naver trend list uses `searchKeywords`.
  - No publish/analytics/strategy UI introduced in `IdeasDashboard`.
  - `grep -rn "'/api/ai/generate'\|'/api/storage" packages/client/src/features/marketing` → **0 results** (all AI/storage paths are `/api/mkt/...`; B-1 fixed).
- [ ] **Step 5 (RLS sanity):** Phase 2 adds **no** migration, **no** policy/table change, **no** SECURITY DEFINER function → no `GRANT EXECUTE` needed (memory RULE n/a). `saved_keywords` writes go through `update … .eq('id', projectId)` on the **owner's** `mkt_projects` row — RLS `user_id = auth.uid()` is already satisfied (no `user_id` stamping, unlike the `mkt_*_cards` insert gotcha). Optionally `mcp__supabase__execute_sql` `select id, saved_keywords from mkt_projects where saved_keywords is not null limit 3` to confirm pins persisted on the right row.
- [ ] **Step 6 (finish):** @superpowers:finishing-a-development-branch — present merge/PR/cleanup options. Per the user's "업데이트 하자" workflow (if invoked): update `features/marketing/CLAUDE.md` (add the **ideas module** section: `components/ideas/*`, the 3 new `/api/mkt` rows in the route table, the `use-ideas`/`use-golden-keywords`/`use-saved-keywords` hooks, the `Project.saved_keywords` field; note the route tree `ideas` → `IdeasPage`), the root + worktree `CLAUDE.md` `/marketing` line (키워드/아이디어 page 완료), the Phase 2 spec status → **COMPLETE**, and memory `marketing-port-contentflow-2026-06-07.md` (Phase 2 done; next = Phase 3 발행). Commit the docs.

---

## Appendix A — Resolved decisions referenced above (spec §12 + task brief)

- **D-1 — Golden orchestration SERVER-SIDE:** the entire `discoverGoldenKeywords` flow (CF runs it client-side over dozens of `fetch` round-trips) is moved into `POST /api/mkt/keywords/recommend` (Gemini-flash seed → Naver volume → relevance filter → 3-tier classify → Google enrich → strategy). One client call; secrets stay server-side; pure tiering/filter is unit-tested (Task 1.1). The CF `app/api/keywords/recommend/route.ts` is a *different* base-article flow — we reuse only the path name.
- **R-1 🔴 — competition enum HIGH/MEDIUM/LOW everywhere:** CF's tiering/filter/sort predicates compared the Korean strings `높음/중간/낮음`; `searchKeywords`/`fetchNaverKeywords` return `'HIGH'|'MEDIUM'|'LOW'` (`naver-searchad.ts mapCompetition`). **Every** ported predicate (golden filter step, tiering, table sort `compOrder`, badge color, `SavedKeyword.naverComp`) keys on the enum. The #1 port bug. Covered by `golden-keyword.test.ts` + `keyword-sort.test.ts` (both assert a Korean-string input does NOT match). Display uses a `{HIGH:'높음',…}` label map only.
- **B-1 — `fetchAiGenerate` wrong path:** `lib/sse-stream-parser.ts:120` posted `/api/ai/generate` (missing `/mkt`). Fixed to `/api/mkt/ai/generate` (Chunk 0 Task 0.2). Phase 2 client AI calls use the `useAiGeneration` hook (already correct), not `fetchAiGenerate`.
- **Datalab time-series SKIP:** the SearchAd-based Naver trend list (`searchKeywords`) is enough for CF parity; `naver-datalab.ts searchTrend` stays 501 (no sparkline this phase). Spec §2.2 / Q-3.
- **IdeaCard buttons no-op (Q-5):** CF's `idea-card.tsx` `onGenerate`/`onSave` are no-ops; the 1:1 port keeps them no-op (the "create a `mkt_contents` row + open editor" enhancement is a flagged follow-up, OUT this phase). `KeywordTable`'s "콘텐츠 만들기" (`onMakeContent`) is likewise no-op by default.
- **Flash-class Gemini model (Q-6):** ideas/golden use `gemini-2.5-flash-lite` (the `GOLDEN_MODEL` const), not the heavy default `config.gemini.textModel` (`gemini-3.1-pro-preview`), per root CLAUDE.md "batch → flash-lite" guidance. The non-streaming `generateTextWithGemini` still auto-falls-back to `gemini-2.5-flash-lite` on overload.
- **saved_keywords rich shape (Q-2):** store the full `SavedKeyword` (all optional); CF's leaner rows degrade gracefully. The write is an `update` on the owner's `mkt_projects` row — no `user_id` stamp (RLS already satisfied). Spec §4.3.

## Appendix B — Reused endpoints & externals (no change)

| Endpoint / fn | File | Used by |
|---|---|---|
| `POST /api/mkt/naver/keywords` | `controllers/mkt/keywords.controller.ts:8` → `naver-searchad.searchKeywords` | naver-kw enrichment, golden (server) |
| `POST /api/mkt/google/keywords` | `controllers/mkt/keywords.controller.ts:18` → `dataforseo.getKeywordVolumes` | google-kw enrichment, golden google step |
| `POST /api/mkt/ai/generate` (SSE) | `controllers/mkt/ai.controller.ts` → gemini-sse | naver-kw / google-kw **AI keyword map** (client `useAiGeneration`) |
| `fetchNaverKeywords` / `fetchGoogleKeywords` | `api/use-keywords.ts:37,41` | client enrichment (envelope-unwrapped, enum competition) |
| `useProject` / `useUpdateProject` | `api/use-projects.ts:16,105` | `saved_keywords` read/write (owner-row update) |
| `searchKeywords` (≤5 cap, enum) | `services/mkt/external/naver-searchad.ts:75` | golden seeds, naver trends |
| `getKeywordVolumes` (`…/google/search_volume/live`) | `services/mkt/external/dataforseo.ts:42` | golden google step, google-kw (R-5: keep this URL, NOT CF's `google_ads/...`) |

## Appendix C — Cited references (both sides)

**ContentFlow (port source)** — `src/components/ideas/ideas-dashboard.tsx` (`generateKeywords` :136, `discoverGoldenKeywords` :249, tiering :337–344, `colValue`/sort :415–462, `seedPlaceholder` :482, `handleGoogleKeywords` :501, lang→code :526–527, `handleTrendSearch` :561, `handleGenerateIdeas` :578, language tabs + sub-tab gating :599–621, strategy markdown render ~:696), `src/components/ideas/idea-card.tsx`, `src/components/ideas/trending-feed.tsx`, `src/app/api/ideas/generate/route.ts`, `src/app/api/ideas/trending/route.ts` (`formatViews` :141), `src/app/api/keywords/recommend/route.ts` (different flow — path reuse only), `src/app/api/{naver,google}/keywords/route.ts`. **NOT ported:** `src/components/keywords/keyword-analysis-dashboard.tsx` (DEAD), `src/components/analytics/language-tabs.tsx` (rebuilt thin), `src/lib/sse-stream-parser.ts fetchAiGenerate` (B-1).

**Tangobook Phase 0–1 (worktree `feat/marketing-phase0`)** — `features/marketing/components/layout/Sidebar.tsx:16` (ideas nav item present), `router/index.tsx:6,309` (import + placeholder swap), `api/use-keywords.ts:37,41` (`fetchNaver/GoogleKeywords` enum), `api/use-projects.ts:16,105` (`useProject`/`useUpdateProject`), `api/queries.ts:18` (`mktKeys`), `hooks/use-ai-generation.ts:23` (`/api/mkt/ai/generate`), `lib/sse-stream-parser.ts:120` (B-1), `lib/ai-models.ts:18` (`gemini-2.5-flash-lite`), `store/ui-store.ts:29,52` (`selectedLanguage`), `types/database.ts:143,182` (`Project`, `target_languages` — no `saved_keywords` yet), `components/content/{ChannelModelSelector,GenerationButton}.tsx`, `pages/ContentPage.tsx` (guard pattern), `pages/PlaceholderPage.tsx`, `index.ts` (barrel). **Server:** `routes/mkt.routes.ts:35–36` (keyword routes; add 3 here), `controllers/mkt/keywords.controller.ts`, `services/mkt/external/{naver-searchad.ts:75,dataforseo.ts:42,youtube-data.ts:43,naver-datalab.ts:33}`, `providers/gemini.provider.ts:157` (`generateTextWithGemini`), `config/index.ts:32–74` (naverAd/dataforseo/youtubeApiKey/naverDatalab/gemini). **Schema:** `supabase/migrations/2026-06-07-marketing-schema.sql:62` (`saved_keywords jsonb` already exists). **Shared:** `@tangobook/shared SUPPORTED_LANGUAGES`.
