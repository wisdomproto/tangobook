# Marketing Platform Phase 0 Foundation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `/marketing` operator-only platform shell in Tangobook (ported from contentflow) so a user can create/select a project, edit its 12-section settings, and CRUD contents — with a scope-isolated design system, ported pure libs, and a streaming-capable Express base.

**Architecture:** New `packages/client/src/features/marketing/` feature module mounted at a React-Router `/marketing/*` layout route **outside** AppShell (full-screen, operator-only, no menu link). Structured data lives in Tangobook's Supabase Postgres (RLS, single-owner); assets in R2 (existing provider). Client reads server data via TanStack Query wrapping `supabase.from(...)`; Zustand holds UI-only state. contentflow's grey OKLCH tokens + dark mode are isolated under a `.marketing-scope` root so they never touch Tangobook's coral/peach learner UI. Server gets a new `/api/mkt/*` namespace (the existing `/api/marketing/*` is storybook-marketing and stays).

**Tech Stack:** React 18 + Vite + TanStack Query v5 + Zustand v5 + react-router-dom v6 + TailwindCSS v3 + `class-variance-authority`(new) + clsx + tailwind-merge + `@supabase/supabase-js` + Express v5 + `@google/genai`(SSE) + `@aws-sdk/client-s3` (R2) + Gemini. Tests: vitest + @testing-library/react.

**Source to port from:** `C:\projects\contentflow\contentflow\src` (the `database.ts` interfaces are the real contract; SQL migrations have drift). Spec: `docs/superpowers/specs/2026-06-06-contentflow-marketing-port-design.md`.

**Conventions:**
- Port-task pattern (for verbatim/near-verbatim files): copy source → rewire imports (`@/lib/*` → `@/features/marketing/lib/*`, `@/types/*` → `@/features/marketing/types/*`, `@/components/ui/*` → `@/features/marketing/ui/*`) → strip Next-only bits (`'use client'`, `next/*`) → run test.
- Every primitive/screen uses CSS-variable semantic colors only — **NEVER `dark:` Tailwind utilities** (would react to Tangobook's global `.dark`).
- Commit after every task. Commit messages in English. End with the Co-Authored-By trailer.
- Backend follows Tangobook layering: `routes → controllers(asyncHandler) → services(AppError) → providers`. Responses `res.json({ success: true, data })`.

---

## File Structure

```
packages/client/src/features/marketing/
  index.ts                       # public exports (MarketingApp/routes)
  lib/
    utils.ts                     # port of contentflow lib/utils.ts: cn + generateId + countWords
    ai-models.ts                 # port (model lists)
    sse-stream-parser.ts         # port (parseSSEStream/fetchSSEText/fetchAiGenerate)
    prompt-builder.ts            # port (35KB, all-channel prompts) [Phase 1 uses; ported now]
    seo-scorer.ts                # port (Naver 100-pt) + __tests__
    schedule-distribution.ts     # port + __tests__
    strategy-html-parser.ts      # port + __tests__ (cheerio→browser DOMParser variant)
    channel-translator.ts        # port (builders + translateAndSaveChannel)
    translation-prompt-builder.ts# port
    strategy-prompt-builder.ts   # port
    weekly-report-builder.ts     # port
  types/
    database.ts                  # port (Project/Content/BlogCard/... interfaces) — the contract
    cards.ts                     # port (BlogCardContent/CardCanvasData/TextBlock/GlobalCardStyle)
    strategy.ts                  # port
    analytics.ts                 # port
  theme/
    marketing-tokens.css         # OKLCH tokens under .marketing-scope (+ .marketing-scope.dark)
    useMarketingTheme.ts         # localStorage 'marketing-theme' + classList toggle on scope root
  ui/                            # Base UI → re-implemented primitives (cva + cn + tokens, no dark:)
    button.tsx input.tsx textarea.tsx label.tsx card.tsx badge.tsx separator.tsx skeleton.tsx
    switch.tsx checkbox.tsx slider.tsx tabs.tsx tooltip.tsx dialog.tsx dropdown-menu.tsx
    select.tsx collapsible.tsx scroll-area.tsx avatar.tsx korean-input.tsx
    index.ts
  api/
    supabase.ts                  # re-export Tangobook's src/lib/supabase client
    queries.ts                   # query-key factory + raw supabase.from helpers
    use-projects.ts              # TanStack Query hooks (list/get/create/update/delete/reorder)
    use-contents.ts              # TanStack Query hooks
    use-debounced-save.ts        # debounced mutation → save-status-store
  store/
    ui-store.ts                  # selectedProjectId/selectedContentId/selectedLanguage (+localStorage)
    save-status-store.ts         # pending/flushing/lastError/lastSavedAt
  components/
    layout/
      MarketingShell.tsx         # <Sidebar/> + <div><TopBar/><Outlet/></div>, scope root
      Sidebar.tsx                # grouped nav (설정/오가닉/성장/유료/분석/전략)
      SidebarNavItem.tsx         # NavLink active state
      TopBar.tsx                 # title map + SaveStatusIndicator + theme toggle
      ProjectSwitcher.tsx        # dropdown project list + create
      SaveStatusIndicator.tsx
    project/
      ProjectSettings.tsx        # Tabs orchestrator (12 sections)
      sections/ (12 files)       # reference-files, writing-guide, bgm, api-keys, funnel-analytics,
                                 #   target-languages, channel-connections, published-site,
                                 #   brand-info, marketer, channel-prompts, ai-model
      CreateProjectDialog.tsx CreateContentDialog.tsx
      ContentListPanel.tsx       # dnd-kit content list (CRUD)
  pages/
    MarketingLayout.tsx          # route element wrapping MarketingShell + auth guard
    SettingsPage.tsx ContentPage.tsx
    PlaceholderPage.tsx          # "준비 중" for ideas/publish/monitoring/site-analysis/meta-analytics/competitors/strategy/ads

packages/client/src/router/index.tsx   # MODIFY: add /marketing/* routes
packages/client/tailwind.config.ts      # MODIFY: add marketing semantic colors (var-based)
packages/client/src/index.css           # MODIFY: import marketing-tokens.css
packages/client/package.json            # MODIFY: add class-variance-authority

packages/server/src/
  routes/mkt.routes.ts           # NEW namespace /api/mkt (NOT /api/marketing)
  controllers/mkt/
    ai.controller.ts             # generate(SSE) / generate-image / translate / extract-text / analyze-references
    projects.controller.ts       # (thin — most CRUD is client→supabase; this covers server-only ops)
    storage.controller.ts        # presign / proxy / delete (reuse r2.provider)
  services/mkt/
    gemini-sse.service.ts        # getAI().models.generateContentStream → res.write envelope
    external/                    # provider skeletons: naver-searchad, naver-datalab, dataforseo, ga4, meta, youtube
  app.ts                         # MODIFY: app.use('/api/mkt', mktRoutes)
  config/index.ts                # MODIFY: add ga4/meta/youtube/dataforseo/datalab env
supabase/migrations (via MCP)    # marketing schema (single-owner RLS)
```

---

## Chunk 1: Scaffold + Design Tokens + Pure Libs

### Task 1.1: Add class-variance-authority + scaffold feature dir

**Files:**
- Modify: `packages/client/package.json`
- Create: `packages/client/src/features/marketing/index.ts` (stub `export {};`)

- [ ] **Step 1:** Add `"class-variance-authority": "^0.7.1"` to client `dependencies`. Run `pnpm install`.
- [ ] **Step 2:** Create the `features/marketing/` directory tree (empty `index.ts` stub + folders `lib types theme ui api store components/layout components/project/sections pages`).
- [ ] **Step 3:** Run `pnpm --filter client typecheck` → PASS (empty module).
- [ ] **Step 4:** Commit `chore(marketing): scaffold feature module + add cva`.

### Task 1.2: Port `cn` util + design tokens (scope-isolated)

**Files:**
- Create: `features/marketing/lib/utils.ts`
- Create: `features/marketing/theme/marketing-tokens.css`
- Create: `features/marketing/theme/useMarketingTheme.ts`
- Modify: `packages/client/src/index.css` (import tokens), `packages/client/tailwind.config.ts`
- Test: `features/marketing/lib/__tests__/utils.test.ts`

- [ ] **Step 1 (test):** `cn('a', false && 'b', 'c')` → `'a c'`; `cn('p-2','p-4')` → `'p-4'` (tailwind-merge wins); `generateId()` returns a UUID; `countWords('a b c')` → 3.
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/lib/__tests__/utils` → FAIL.
- [ ] **Step 3 (impl):** Port contentflow `lib/utils.ts` VERBATIM — it exports `cn` (`twMerge(clsx(...))`), `generateId` (crypto.randomUUID), and `countWords`. Other libs (strategy-html-parser imports `generateId`; base-article word count uses `countWords`) depend on these, so all three MUST land in this single file.
- [ ] **Step 4 (run):** test → PASS.
- [ ] **Step 5 (tokens):** Port contentflow `globals.css` `:root` OKLCH vars + `.dark` block + radius scale into `marketing-tokens.css`, but **scope every selector**: `.marketing-scope { --background: oklch(1 0 0); --foreground: …; --primary: …; … --radius: 0.625rem; }` and `.marketing-scope.dark { --background: oklch(0.145 0 0); … }`. Do NOT include the `.tiptap` styles (Phase 1). Also add `.marketing-scope { background: var(--background); color: var(--foreground); }` — contentflow's global `@layer base` (`body{bg-background text-foreground}` + `*{ @apply border-border }`) is intentionally dropped by scoping, so the scope root must set its own bg/text and primitives must set borders explicitly rather than rely on a global `*{border-border}` default.
- [ ] **Step 6 (import):** Add `@import './features/marketing/theme/marketing-tokens.css';` to `src/index.css` (after the font imports, before `@tailwind base`). Verify it does not redefine any Tangobook `:root` var.
- [ ] **Step 7 (tailwind):** In `tailwind.config.ts`, extend `theme.extend.colors` with marketing semantic keys mapped to vars — to avoid colliding with Tangobook keys, prefix the *Tailwind* names but keep the CSS var names contentflow expects. Decision: keep contentflow primitive classNames working by adding the standard semantic names ONLY if absent in `design-system/tokens/colors`. Grep `colors` first; for any name already present (none expected: card/popover/primary/secondary/muted/accent/destructive/border/input/ring/background/foreground/sidebar*), use it; for collisions, alias. Each value = `'hsl(var(--x))'`? contentflow uses OKLCH directly in vars, so map as `primary: 'var(--primary)'` etc. (raw var passthrough). Add `borderRadius` lg/md/sm = `var(--radius)` calc per contentflow.
- [ ] **Step 8 (theme hook):** `useMarketingTheme()` — reads `localStorage['marketing-theme']` ('light'|'dark', default 'light'), returns `{theme, toggle}`. `toggle` flips and applies `.dark` class to the **`.marketing-scope` root element** (passed a ref or `document.querySelector('.marketing-scope')`), NOT `<html>`. Never touches Tangobook's `theme.store`.
- [ ] **Step 9 (run):** `pnpm --filter client typecheck` + `pnpm --filter client build` → PASS. Manually confirm Tangobook learner pages unaffected (no global var override).
- [ ] **Step 10:** Commit `feat(marketing): scope-isolated OKLCH design tokens + cn util`.

### Task 1.3: Port pure type files

**Files:** Create `features/marketing/types/{database,cards,strategy,analytics}.ts`

- [ ] **Step 1:** Copy contentflow `src/types/{database,cards,strategy,analytics}.ts` verbatim. `database.ts` is the schema contract (includes drift columns) — keep ALL fields.
- [ ] **Step 2:** Remove the `project_members` / multi-tenant role types (single-owner). Keep `Project`, `Content`, `BaseArticle`, `BlogContent`, `BlogCard`, `InstagramContent/Card`, `ThreadsContent/Card`, `YoutubeContent/Card`, `Translation`, `PublishRecord`, `CardTemplate`, `CompetitorProfile`, `MonitoringKeyword`, JSONB shapes (`PublishedSite`, `ReferenceFile`, `BgmFile`, `ProjectApiKeys`, `FunnelConfig`, `GA4Config`, `MetaCredentials`).
- [ ] **Step 3:** Run `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit `feat(marketing): port domain types (database/cards/strategy/analytics)`.

### Task 1.4: Port pure logic libs with their tests

**Files:** Create `features/marketing/lib/{ai-models,sse-stream-parser,seo-scorer,schedule-distribution,prompt-builder,channel-translator,translation-prompt-builder,strategy-prompt-builder,strategy-html-parser,weekly-report-builder}.ts` + ported `__tests__`.

- [ ] **Step 1 (tests first):** Copy contentflow's existing tests for `seo-scorer`, `schedule-distribution` (and any others present under `lib/__tests__`) into `features/marketing/lib/__tests__/`, rewiring imports.
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/lib` → FAIL (impl absent).
- [ ] **Step 3 (impl — verbatim ports):** Copy `ai-models.ts`, `sse-stream-parser.ts`, `seo-scorer.ts`, `schedule-distribution.ts`, `prompt-builder.ts`, `translation-prompt-builder.ts`, `strategy-prompt-builder.ts`, `weekly-report-builder.ts`, `channel-translator.ts`; rewire imports. These are framework-agnostic.
- [ ] **Step 4 (impl — strategy-html-parser):** contentflow uses `cheerio` (server). For the browser port, replace cheerio with `DOMParser`/`querySelectorAll` keeping the same output shape (`ImportedKeyword[]`/`ImportedCategory[]`/topics). Keep both code paths (inline `<script>const kwData=[]` extraction via regex + table parsing via DOM). Rewire its `generateId` import to `../lib/utils` (Task 1.2).
- [ ] **Step 5 (run):** `pnpm --filter client test marketing/lib` → PASS. Add a focused test for the DOMParser strategy-html-parser (one inline-script sample + one table sample).
- [ ] **Step 6:** Commit `feat(marketing): port pure libs (seo-scorer, schedule-distribution, prompt-builder, ...) with tests`.

---

## Chunk 2: UI Primitives (Base UI → Tangobook re-implementation)

> Rule for ALL tasks here: re-implement contentflow's `components/ui/<x>.tsx` WITHOUT `@base-ui/react`. Use native elements + headless behavior + `cva` variants + `cn` + CSS-var semantic colors. **No `dark:` utilities.** Each gets a render test.

### Task 2.1: Thin primitives (button, input, textarea, label, badge, separator, skeleton, card)

**Files:** Create `features/marketing/ui/{button,input,textarea,label,badge,separator,skeleton,card}.tsx` + `ui/index.ts`; tests in `ui/__tests__/`.

- [ ] **Step 1 (test):** For `button`: renders children, applies `variant`/`size` classes, forwards `onClick`. For `card`: renders `Card/CardHeader/CardTitle/CardContent/CardFooter`.
- [ ] **Step 2 (run):** FAIL.
- [ ] **Step 3 (impl):** Port each, preserving contentflow cva variant names (button: default/outline/secondary/ghost/destructive/link + sizes; badge variants; card subcomponents). Native `<button>/<input>/<textarea>/<label>/<div>`. Colors via semantic tokens (`bg-primary text-primary-foreground border-input` etc., now resolving to marketing vars).
- [ ] **Step 4 (run):** PASS.
- [ ] **Step 5:** Commit `feat(marketing): thin UI primitives (button/input/card/...)`.

### Task 2.2: Form primitives (switch, checkbox, slider)

**Files:** `ui/{switch,checkbox,slider}.tsx` + tests.

- [ ] **Step 1 (test):** `switch` toggles `data-checked` + fires `onCheckedChange`; `checkbox` toggles; `slider` emits value on change.
- [ ] **Step 2:** FAIL → **Step 3:** Implement with native `<input type=checkbox/range>` (visually styled) or button+role; keep `data-checked`/`data-state` attrs contentflow CSS expects. → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): form primitives (switch/checkbox/slider)`.

### Task 2.3: Tabs

**Files:** `ui/tabs.tsx` + test.
- [ ] **Step 1 (test):** clicking a tab trigger shows its panel, sets `data-active` on the trigger.
- [ ] **Step 2:** FAIL → **Step 3:** Headless controlled/uncontrolled Tabs (Context for active value; Triggers + Content). cva list variant default/line per contentflow. → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): tabs primitive`.

### Task 2.4: Overlay primitives (tooltip, dialog, dropdown-menu, select, collapsible, scroll-area, avatar)

**Files:** `ui/{tooltip,dialog,dropdown-menu,select,collapsible,scroll-area,avatar}.tsx` + tests for dialog/dropdown/select.
- [ ] **Step 1 (test):** `dialog` opens/closes via `open` prop + backdrop click + Esc; `dropdown-menu` opens on trigger, closes on item select + outside click; `select` opens, selects an item, calls `onValueChange`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (impl):** Build on a small portal + outside-click + focus-trap helper. `dialog` = backdrop + popup (role=dialog). `dropdown-menu` = anchored popover menu (items/checkbox/radio/separator/sub). `select` = trigger + listbox popover. `collapsible`/`scroll-area`(native overflow)/`avatar`(img+fallback) are thin. Position with a simple anchor calc (or CSS absolute); no `@base-ui/react`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(marketing): overlay primitives (dialog/dropdown/select/...)`.

### Task 2.5: korean-input (IME)

**Files:** `ui/korean-input.tsx` + test.
- [ ] **Step 1 (test):** `<KoreanInput value="가" onCommit/>` commits on blur only when value changed; Enter blurs (commits); remounts on external value change (`key={value}`).
- [ ] **Step 2:** FAIL → **Step 3:** Port verbatim (uncontrolled `defaultValue` + `key={value}` + commit-on-blur/Enter). `KoreanTextarea` too. → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): korean-input IME primitive`. Export all from `ui/index.ts`.

---

## Chunk 3: Shell & Routing

### Task 3.1: UI stores (ui-store, save-status-store)

**Files:** `store/ui-store.ts`, `store/save-status-store.ts` + tests.
- [ ] **Step 1 (test):** ui-store: set/get `selectedProjectId` persists to `localStorage['cf_selectedProjectId']`; save-status: `increment/decrement/setFlushing/setError/setSavedAt` transitions.
- [ ] **Step 2:** FAIL → **Step 3:** Zustand stores (UI-only, compliant with Tangobook rule). → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): ui-store + save-status-store`.

### Task 3.2: SaveStatusIndicator + ProjectSwitcher

**Files:** `components/layout/SaveStatusIndicator.tsx`, `components/layout/ProjectSwitcher.tsx`.
- [ ] **Step 1 (test):** SaveStatusIndicator renders "저장 중…/저장됨/오류" from save-status-store; ProjectSwitcher lists projects (mock query), highlights selected, "새 프로젝트" opens dialog.
- [ ] **Step 2:** FAIL → **Step 3:** Implement using `ui/` primitives + `useProjects` (Chunk 4 hook; until then accept projects via prop to keep this task testable, then wire in 4.x). → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): SaveStatusIndicator + ProjectSwitcher`.

### Task 3.3: Sidebar + SidebarNavItem + TopBar

**Files:** `components/layout/{Sidebar,SidebarNavItem,TopBar}.tsx` + tests.
- [ ] **Step 1 (test):** SidebarNavItem uses `NavLink`, active when route matches; Sidebar renders the grouped nav (설정 / 오가닉[ideas,content,publish] / 성장[monitoring] / 유료[ads] / 분석[site-analysis,meta-analytics,competitors] / 전략[strategy]); TopBar shows pathname→title and theme toggle calls `useMarketingTheme().toggle`.
- [ ] **Step 2:** FAIL → **Step 3:** Implement (emoji icons, `text-[10px] uppercase` group labels, active `bg-accent text-accent-foreground`). Routes prefixed `/marketing`. → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): sidebar + topbar shell`.

### Task 3.4: MarketingShell + MarketingLayout + placeholder pages + routing

**Files:** `components/layout/MarketingShell.tsx`, `pages/MarketingLayout.tsx`, `pages/PlaceholderPage.tsx`, `pages/SettingsPage.tsx`, `pages/ContentPage.tsx`; Modify `src/router/index.tsx`, `features/marketing/index.ts`.
- [ ] **Step 1 (test):** MarketingLayout renders shell with `.marketing-scope` root class + applies marketing theme; unauthenticated → redirect to `/login`. Reuse Tangobook auth: `useSession` (`features/auth/hooks/useSession.ts`) or `useAuth` (`features/auth/context/AuthContext.tsx`); `/login` is an existing route.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (impl):** `MarketingShell` = `<div className="marketing-scope ..."> <Sidebar/> <div><TopBar/><Outlet/></div></div>`. `MarketingLayout` = auth guard + `<MarketingShell/>`. Placeholder pages render "준비 중" for ideas/publish/monitoring/site-analysis/meta-analytics/competitors/strategy/ads. Add to `router/index.tsx` a sibling route (inside AuthProvider Outlet, OUTSIDE AppShell): `{ path: 'marketing', element: <MarketingLayout/>, children: [ {index→content}, settings, content, ideas, publish, monitoring, site-analysis, meta-analytics, competitors, strategy, ads ] }`.
- [ ] **Step 4 (run):** `pnpm --filter client typecheck` + build; manually load `/marketing` → shell renders, nav works, dark toggle flips only marketing scope, Tangobook `/library` still light & intact.
- [ ] **Step 5:** Commit `feat(marketing): shell layout + /marketing routing + placeholders`.

---

## Chunk 4: Supabase Schema + Data Layer

### Task 4.1: Marketing schema migration (single-owner RLS)

**Files:** Supabase migration via `mcp__supabase__apply_migration` (project ref `fxzwigjkbsptvsjraqwa`). Record SQL in `supabase/migrations/2026-06-06-marketing-schema.sql` for source control.
- [ ] **Step 1:** Author the schema from `features/marketing/types/database.ts` (the contract, incl. drift columns). Tables: `mkt_projects`, `mkt_contents`, `mkt_base_articles`, `mkt_blog_contents`, `mkt_blog_cards`, `mkt_instagram_contents`, `mkt_instagram_cards`, `mkt_threads_contents`, `mkt_threads_cards`, `mkt_youtube_contents`, `mkt_youtube_cards`, `mkt_translations`, `mkt_publish_records`, `mkt_card_templates`, `mkt_card_hidden_builtins`, `mkt_competitor_profiles`, `mkt_monitoring_keywords`. (Prefix `mkt_` to avoid any name clash with Tangobook tables.) All FKs cascade; all `user_id uuid references auth.users`.
- [ ] **Step 2:** RLS: enable on every table; policy `user_id = auth.uid()` for select/insert/update/delete. Confirm `projects.saved_keywords` and other drift columns against `database.ts` before finalizing.
- [ ] **Step 3:** Apply via MCP. Verify with `mcp__supabase__list_tables`.
- [ ] **Step 4:** Run `mcp__supabase__get_advisors` (security) → resolve any RLS/grant warnings (memory RULE: explicit grants for SECURITY DEFINER funcs).
- [ ] **Step 5:** Commit the recorded SQL `feat(marketing): supabase schema (mkt_* tables, single-owner RLS)`.

### Task 4.2: supabase client re-export + query-key factory

**Files:** `api/supabase.ts`, `api/queries.ts`.
- [ ] **Step 1:** `api/supabase.ts` re-exports Tangobook `src/lib/supabase` client (no new client). `queries.ts` = `mktKeys` factory (`['mkt','projects']`, `['mkt','project',id]`, `['mkt','contents',projectId]`, `['mkt','content',id]`) + raw fetch helpers (`fetchProjects`, `fetchProject`, `fetchContents`, `fetchContentGraph(contentId)` assembling base_article + channel contents + cards in nested shape).
- [ ] **Step 2:** Run typecheck → PASS. Commit `feat(marketing): supabase query-key factory + fetch helpers`.

### Task 4.3: useProjects / useContents TanStack Query hooks

**Files:** `api/use-projects.ts`, `api/use-contents.ts`, `api/use-debounced-save.ts` + tests (mock supabase).
- [ ] **Step 1 (test):** `useProjects()` returns list; `useCreateProject` inserts then invalidates `mktKeys.projects`; `useUpdateProject` (await-first) updates; `useDeleteProject` removes; `useReorderContents` reorders. `useDebouncedSave(table,id)` batches writes (800ms) and drives save-status-store.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (impl):** `useQuery`/`useMutation` wrapping `supabase.from('mkt_*')`. **Lift the mutation bodies from contentflow `src/stores/project-store.ts`** — `createProject`/`createContent`/`reorderContents`/`update*`/`delete*` all wrap `supabase.from` THERE (the components only contribute markup; the CRUD logic lives in the store). Structural ops = await-first mutations (mutate → on success invalidate). High-frequency edits = `useDebouncedSave` (800ms debounce + 1 retry → save-status-store). queryKeys from `queries.ts`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Wire ProjectSwitcher (3.2) to real `useProjects`. Commit `feat(marketing): TanStack Query data layer (projects/contents) + debounced save`.

---

## Chunk 5: Express Base (SSE / Storage / External skeletons)

### Task 5.1: Config + env

**Files:** Modify `packages/server/src/config/index.ts`, `.env.example`.
- [ ] **Step 1:** Add config keys: `ga4 {propertyId, clientEmail, privateKey}`, `meta {appId, appSecret}`, `youtubeApiKey`, `dataforseo {login, password}`, `naverDatalab {clientId, secret}`. Reuse existing `gemini`, `r2`, `naver` (AD), supabase. Lazy/optional (server boots without them).
- [ ] **Step 2:** Update `.env.example` with the new vars (no secrets). Typecheck → PASS. Commit `feat(marketing): server config + env for external APIs`.

### Task 5.2: Gemini SSE service + AI controller

**Files:** `services/mkt/gemini-sse.service.ts`, `controllers/mkt/ai.controller.ts`, `routes/mkt.routes.ts`; Modify `app.ts`.
- [ ] **Step 1 (test):** A unit test for the SSE envelope writer: given an async iterable of chunks, it writes `data: {"text":"..."}\n\n` per chunk and `data: [DONE]\n\n` at end; on error writes `data: {"error":"..."}\n\n`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (impl):** `gemini-sse.service.ts` — `streamGenerate(res, {prompt, model})`: set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `flushHeaders()`. First **`export` `getAI` (or add a `streamTextWithGemini` helper) from `gemini.provider.ts`** — it is currently module-private (line 16). Then use `getAI().models.generateContentStream(...)`, iterate, `res.write` the envelope; wrap with the model-fallback chain (`gemini-2.5-flash-lite` on overload, mirroring `generateTextWithGemini`). `ai.controller.ts` — `generate` (SSE), `generateImage` (reuse `generateImageWithGemini` → returns base64 JSON), `translate` (SSE with system instruction), `extractText` (port contentflow extract-text using `unpdf`/`mammoth` — add deps if needed), `analyzeReferences`. `mkt.routes.ts` mounts them under POST `/ai/generate`, `/ai/generate-image`, `/ai/translate`, `/ai/extract-text`, `/ai/analyze-references`. `app.ts`: `app.use('/api/mkt', mktRoutes)`.
- [ ] **Step 4 (run):** test PASS; manual curl `/api/mkt/ai/generate` streams tokens; client `parseSSEStream` (Chunk 1) consumes it.
- [ ] **Step 5:** Commit `feat(marketing): express SSE gemini service + ai controller (/api/mkt)`.

### Task 5.3: Storage controller (presign/proxy/delete) + external provider skeletons

**Files:** `controllers/mkt/storage.controller.ts`, `services/mkt/external/{naver-searchad,naver-datalab,dataforseo,ga4,meta-graph,youtube-data}.ts`; Modify `mkt.routes.ts`.
- [ ] **Step 1 (test):** storage presign returns `{uploadUrl, publicUrl, key}` for an allowed category (mock r2.provider `createPresignedUploadUrl`); delete validates keys.
- [ ] **Step 2:** FAIL → **Step 3 (impl):** `storage.controller` reuses `r2.provider` (`createPresignedUploadUrl`, `deleteManyFromR2`, `downloadFromR2` for proxy) with marketing categories + `buildR2Key`-style keys (`mkt/{projectId}/{category}/{ts}-{rand}.{ext}`). External provider skeletons export typed functions that throw `AppError(501,'not wired')` until their phase — but with real signatures (naver HMAC signer stub, ga4 client init, etc.). Routes: `/storage/presign` `/storage/delete` `/storage/proxy`. → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): storage controller (R2 reuse) + external API skeletons`.

---

## Chunk 6: Project Settings + Content CRUD + Verification

### Task 6.1: CreateProjectDialog + CreateContentDialog

**Files:** `components/project/{CreateProjectDialog,CreateContentDialog}.tsx` + test.
- [ ] **Step 1 (test):** CreateProjectDialog submits name → calls `useCreateProject` → selects new project; Enter submits. CreateContentDialog submits title/category → `useCreateContent`.
- [ ] **Step 2:** FAIL → **Step 3:** Port markup/UX from contentflow `create-*-dialog.tsx` (use `ui/dialog` + `korean-input`); insert logic = `useCreateProject`/`useCreateContent` (Task 4.3). contentflow `createProject` (project-store.ts) inits brand/guide fields to `null` — **NO seeded guides**; port the real null-init, don't invent defaults. → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): create project/content dialogs`.

### Task 6.2: ContentListPanel (dnd-kit CRUD)

**Files:** `components/project/ContentListPanel.tsx` + test.
- [ ] **Step 1 (test):** renders contents for selected project, reorder via dnd-kit calls `useReorderContents`, delete calls `useDeleteContent`, category filter works, selecting sets `selectedContentId`.
- [ ] **Step 2:** FAIL → **Step 3:** Port from contentflow `content-list-panel.tsx` (@dnd-kit already in Tangobook). → **Step 4:** PASS → **Step 5:** Commit `feat(marketing): content list panel with dnd reorder`.

### Task 6.3: ProjectSettings orchestrator + 12 sections

**Files:** `components/project/ProjectSettings.tsx` + `components/project/sections/*.tsx` (12) + tests for the upload-bearing ones.

> Each section receives `project` + `onUpdate(updates: Partial<Project>)` → `useUpdateProject` (DB_COLUMNS allowlist). Port from contentflow `components/project/*`. Build in sub-batches, commit per batch.

- [ ] **Step 1:** ProjectSettings = `ui/tabs` with 12 tabs. Test: switching tabs renders each section; `onUpdate` calls `useUpdateProject`.
- [ ] **Step 2 (text sections):** Port `brand-info`, `marketer`, `channel-prompts`, `ai-model`, `writing-guide`, `funnel-analytics`, `target-languages` (dnd-kit lang reorder, ko pinned). Tests for field→column mapping. Commit `feat(marketing): project settings text sections`.
- [ ] **Step 3 (upload sections):** Port `reference-files` (extract-text + presign→PUT via `use-r2-upload` client helper + AI analyze), `bgm` (audio presign), `api-keys` (JSONB), `published-site` (`updatePublishedSite`). Add `api/use-r2-upload.ts` client helper (presign `POST /api/mkt/storage/presign` → PUT → return publicUrl, 1 retry). Tests mock fetch. Commit `feat(marketing): project settings upload + key sections`.
- [ ] **Step 4 (channel-connections):** Port `channel-connections` (Meta OAuth start = redirect to `/api/mkt/auth/meta`; parse `?meta_connected=` on return → write `meta_credentials`). Add minimal `/api/mkt/auth/meta` + callback to Express (port contentflow). Commit `feat(marketing): channel connections (Meta OAuth)`.
- [ ] **Step 5:** Wire `SettingsPage` → `ProjectSettings` for the selected project; `ContentPage` → `ContentListPanel` (+ a "select a content" empty state; the channel tabs themselves are Phase 1).

### Task 6.4: Phase 0 verification

**Files:** none (verification task).
- [ ] **Step 1:** `pnpm typecheck` (all packages) → PASS. `pnpm --filter client test` + `pnpm --filter server test` → PASS.
- [ ] **Step 2:** `pnpm build` → PASS.
- [ ] **Step 3 (manual E2E, @superpowers:verification-before-completion):** load `/marketing` → create project → edit ≥3 settings sections (incl. one upload) → confirm Supabase rows + R2 object → create/reorder/delete contents → save indicator transitions → reload restores selection. Dark toggle flips only marketing scope.
- [ ] **Step 4 (regression):** load `/library`, `/editor2`, a viewer, and the author TopBar dark toggle → confirm Tangobook learner/author UI visually unchanged (token isolation holds).
- [ ] **Step 5:** Commit `test(marketing): Phase 0 verification notes` (if any fixtures) and update `CLAUDE.md` index + memory per the "업데이트" workflow when the user requests.

---

## Out of scope (later phases)
Channel content editors (TipTap, card editors, image gen/history, SEO scoring UI, translation axis) = Phase 1. Ideas/Publish/Analytics/Strategy/Monitoring page bodies = Phases 2–5. Publish cron, self-hosted site, strategy SSE generator, Python SEO microservice = deferred (spec §9).
