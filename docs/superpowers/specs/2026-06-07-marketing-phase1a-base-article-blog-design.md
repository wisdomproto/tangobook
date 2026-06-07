# Marketing Phase 1a — Base Article + N‑Blog + Internal‑Blog (Design Spec)

| | |
|---|---|
| **Date** | 2026‑06‑07 |
| **Branch / worktree** | `feat/marketing-phase0` @ `C:\projects\tangobook\.worktrees\marketing-phase0` |
| **Status** | Spec (no implementation) |
| **Predecessor** | Phase 0 Foundation (COMPLETE) — `docs/superpowers/specs/2026-06-06-contentflow-marketing-port-design.md`, `docs/superpowers/plans/2026-06-06-marketing-phase0-foundation.md` |
| **Source app** | ContentFlow (Next.js) `C:\projects\contentflow\contentflow` |
| **Roadmap slot** | First slice of master‑plan **Phase 1 콘텐츠 생성** (§6 of the master plan). This spec = **Phase 1a**; cardnews/threads/youtube/shorts channels + 8‑language translation = **Phase 1b** (deferred). |

---

## 1. Overview

Phase 0 delivered the marketing shell, design‑token isolation, ~20 UI primitives, the TanStack Query data layer for `mkt_projects`/`mkt_contents`, the `/api/mkt` Express base (SSE generate, R2 presign, external‑API skeletons), the full `mkt_*` Supabase schema (already includes base‑article/blog tables), 12‑section project settings, and the content **list** panel. The right pane of the content page is still a placeholder (`packages/client/src/features/marketing/pages/ContentPage.tsx:13`).

Phase 1a fills that right pane with the **content‑generation editor** for the first three channels — exactly the channels that share the `blog_*` data shape and the `'blog'` model key:

1. **기본글 (Base Article)** — one TipTap rich‑text article per content; AI‑generated (SSE) or hand‑written; the upstream source for every channel.
2. **N블로그 (Naver Blog)** — N blog posts per content, each a card list with image + TipTap section, Naver‑SEO scored, with the auto‑retry generation loop. Korean‑only.
3. **내부 블로그 (Internal / self‑hosted Blog)** — same `blog_*` tables and the same `'blog'` model key, but a Google‑SEO prompt variant + `url_slug` + schedule badges (schedule action itself is Phase 3; button is stubbed).

This is a **faithful port**: behavior matches ContentFlow; only the stack adapts (Next.js → Vite/React Router, Zustand `project-store` → TanStack Query hooks matching the Phase 0 pattern, `/api/*` → `/api/mkt/*`).

---

## 2. Goals & Non‑Goals

### 2.1 Goals (Phase 1a scope)

- `ContentTabs` shell with **7 tabs** but only **기본글 / N블로그 / 내부블로그** functional; the other four (카드뉴스/스레드/롱폼/숏폼) render placeholders.
- Per‑content **language tabs** (`LanguageSelector`) wired, with **ko pinned** and the Naver‑blog auto‑switch‑away behavior. Non‑ko translation **rendering** of the base article is in scope only as a read‑only overlay if a translation URL already exists; **generating** translations is Phase 1b — the "AI 번역" button is **not** wired in 1a.
- New `mkt_base_articles` (1:1) + `mkt_blog_contents` (1:N) + `mkt_blog_cards` (N per blog content) **data hooks** in the Phase 0 TanStack pattern, including the delete‑all‑then‑bulk‑insert `setBlogCards` pattern and debounced autosave for high‑frequency card edits.
- **TipTap** integration (new dependency) for the base‑article editor and per‑section editors.
- **Base article**: panel + editor + toolbar + bubble‑menu partial regenerate + R2 image upload on drop/paste + AI generate (SSE + `buildBaseArticlePrompt`) + topic suggestion + 2 s autosave + "원장님 컨펌" toggle.
- **N‑blog**: 4‑step `WorkflowStepBar`, `BlogCardItem`, `NaverKeywordPanel`, `SeoScoreDisplay` using the ported `seo-scorer`, the **SEO auto‑retry loop** (re‑prompt items < 90%), per‑card + batch image generation, `formatForMobile`, `GlobalCardStyle` (CSS‑var scoped fonts/sizes), PC/mobile toggle, `ChannelContentList` accordion, `ChannelModelSelector`.
- **Internal‑blog**: Google‑SEO prompt variant + `url_slug` + schedule badges (button stubbed) + `/api/mkt/google/keywords`.
- **Express**: wire `/api/mkt/naver/keywords` (HMAC‑signed Naver SearchAd) and `/api/mkt/google/keywords` (DataForSEO); the image endpoint `/api/mkt/ai/generate-image` already exists (Strategy pattern Gemini vs Imagen) — 1a only confirms/uses it.

### 2.2 Non‑Goals (explicitly deferred)

| Deferred | Phase |
|---|---|
| 카드뉴스 (Instagram), 스레드, 롱폼(YouTube), 숏폼 channels | 1b |
| 8‑language **translation generation** (`translateAndSaveChannel` SSE wiring, `ChannelTranslationView`, AI 번역 button) | 1b |
| `image-editor-dialog` (crop/filters canvas) | 1b (optional) |
| Ideas module / golden‑keyword pool / trending / saved‑keyword storage | 2 |
| Publish queue (`addToPublishQueue`, publish_records), schedule execution / cron | 3 |
| `BlogPreviewDialog` "publish" actions, WordPress/Meta posting | 3 |
| Perplexity 첨삭, factcheck | later |

The "발행큐 추가" button in `ChannelContentList` is **omitted** in 1a (no `onAddToQueue`/`publishChannels` props passed); the internal‑blog **schedule** button is rendered but stubbed (toast/alert "Phase 3").

---

## 3. Architecture — how it sits on Phase 0

```
features/marketing/
  api/                         [Phase 0 + NEW]
    queries.ts                 ← extend mktKeys + fetchContentGraph already returns base/blog (EXISTS)
    use-base-article.ts        NEW  (1:1)
    use-blog-contents.ts       NEW  (1:N + cards)
    use-channel-models.ts      NEW  (per-channel model settings in mkt_projects.ai_model_settings JSONB)
    use-keywords.ts            NEW  (fetch wrapper → /api/mkt/{naver,google}/keywords, unwraps .data — O-6)
    use-contents.ts            EDIT — add useUpdateContent (used by 원장님 컨펌 + topic)
    use-debounced-save.ts      [Phase 0] reuse for card autosave
    use-r2-upload.ts           [Phase 0] reuse (presign→PUT) — FIX R-11 envelope bug first
  hooks/                       NEW
    use-ai-generation.ts       NEW  (SSE wrapper over parseSSEStream)
    use-card-image-generation.ts NEW (image gen → R2 → save)
    use-r2-upload.ts           [Phase 0] re-export shim (EXISTS)
  lib/                         [Phase 0 — all already ported]
    prompt-builder.ts  seo-scorer.ts  sse-stream-parser.ts
    ai-models.ts  channel-translator.ts  utils.ts
    image-utils.ts             NEW  (convertToWebpBlob / base64ToBlob — see §8)
  ui/                          [Phase 0] reuse all primitives
  store/
    ui-store.ts                [Phase 0] selectedProjectId/ContentId/Language (EXISTS)
    save-status-store.ts       [Phase 0] (EXISTS)
  components/content/          NEW  (this phase)
    ContentTabs.tsx
    BaseArticlePanel.tsx       + editor/ subdir
    BlogPanel.tsx  InternalBlogPanel.tsx
    BlogCardItem.tsx  WorkflowStepBar.tsx  ChannelContentList.tsx
    ChannelModelSelector.tsx  NaverKeywordPanel.tsx  SeoScoreDisplay.tsx
    GenerationButton.tsx  ImageCardWidget.tsx
    PromptEditDialog.tsx  TopicSuggestionDialog.tsx  BlogPreviewDialog.tsx
    LanguageSelector.tsx
    editor/
      BaseArticleEditor.tsx  EditorToolbar.tsx
  pages/
    ContentPage.tsx            EDIT — mount ContentTabs in right pane
```

```
packages/server/src/
  routes/mkt.routes.ts                 EDIT — add naver/google keyword routes
  controllers/mkt/
    keywords.controller.ts             NEW  (naverKeywords, googleKeywords)
  services/mkt/external/
    naver-searchad.ts                  EDIT — implement HMAC + keywordstool (EXISTS as 501 skeleton)
    dataforseo.ts                      EDIT — implement Basic-auth search_volume (EXISTS as 501 skeleton)
  providers/gemini.provider.ts         [Phase 0] generateImageWithGemini (EXISTS, Strategy pattern)
  controllers/mkt/ai.controller.ts     [Phase 0] generateImage (EXISTS)
```

### 3.1 Critical state‑management deviation (must follow)

ContentFlow keeps **all** project/content/blog state in one Zustand store (`src/stores/project-store.ts`, ~1,900 lines) and components read `useProjectStore()`. **Phase 0 already rejected this**: server data lives in **TanStack Query**, UI‑only state (`selectedProjectId` / `selectedContentId` / `selectedLanguage`) lives in `store/ui-store.ts`. Phase 1a MUST continue this split — see CLAUDE.md "프론트 상태" rule (**Zustand 에 서버 데이터 금지**).

Concretely, every ContentFlow store call must be re‑expressed as a hook from `api/`:

| ContentFlow `useProjectStore()` (`project-store.ts`) | Phase 1a equivalent |
|---|---|
| `getBaseArticle(contentId)` (:923) | `useContent(contentId).data?.baseArticle` (read) |
| `createOrUpdateBaseArticle(contentId, data)` (:883) | `useUpsertBaseArticle()` mutation |
| `getBlogContents(contentId)` (:983) | `useContent(contentId).data?.blogContents` |
| `addBlogContent(contentId, data?)` (:928, returns id) | `useCreateBlogContent()` |
| `updateBlogContent(id, updates)` (:962) | `useUpdateBlogContent()` |
| `deleteBlogContent(id)` (:972) | `useDeleteBlogContent()` |
| `getBlogCards(blogContentId)` (:989) | from `useContent(...).data.blogContents[i].cards` |
| `setBlogCardsForContent(blogContentId, cards)` (:995, delete‑all+bulk‑insert) | `useSetBlogCards()` |
| `addBlogCard(blogContentId, type, sort)` (:1016) | `useAddBlogCard()` |
| `updateBlogCard(cardId, updates)` (:1039) | `useUpdateBlogCard()` (debounced for text) |
| `deleteBlogCard(cardId)` (:1051) | `useDeleteBlogCard()` |
| `reorderBlogCards(blogContentId, ids)` (:1061) | `useReorderBlogCards()` |
| `getChannelModels(projectId, channel)` (:1679) | `useChannelModels(projectId, channel)` — persists in `mkt_projects.ai_model_settings` JSONB (see §5.5) |
| `updateContent(contentId, updates)` (:786) | `useUpdateContent()` (NEW — extend `use-contents.ts`) |

> Components should read the **content graph once** via `useContent(selectedContentId)` (already implemented: `api/queries.ts:fetchContentGraph` fetches base + blog + cards in parallel) and pass slices down as props, mirroring ContentFlow's `BlogPanelInner`/`BaseArticlePanelInner` prop pattern.

---

## 4. Data Model

**The tables already exist (verified against the migration file).** Phase 0's migration `supabase/migrations/2026-06-07-marketing-schema.sql` created `mkt_base_articles` (lines 99‑114), `mkt_blog_contents` (120‑142), `mkt_blog_cards` (148‑158) with RLS enabled (414‑416) + single‑owner `for all` policies (433‑435) — all line refs confirmed present. **Phase 1a adds NO DDL for these three tables** — it only **uses** them. The only optional DDL Phase 1a may add is two small **non‑blocking** performance indexes (§4.1, §4.3); both are confirmed **absent** from the Phase 0 migration, so they are safe (not duplicate) to add — but they are optional, not required for correctness.

This section documents the existing DDL (for the implementer's reference) and flags the **[drift]** columns that exist in `database.ts` but were **absent** from ContentFlow's own `001_initial_schema.sql` — Phase 0 already folded them in, per master‑plan §5.

### 4.1 `mkt_base_articles` (1:1 per content) — EXISTS

```sql
mkt_base_articles (
  id               uuid pk default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,   -- [single-owner]
  content_id       uuid not null references mkt_contents(id) on delete cascade,
  title            text,
  body             text not null default '',
  body_plain_text  text,
  word_count       int  not null default 0,
  factcheck_status text check (factcheck_status in ('unchecked','checking','checked')),
  factcheck_score  numeric,
  factcheck_report jsonb,        -- 1a uses .translations map for read-only overlay (CF legacy sync)
  prompt_used      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
)
```

- **[drift] vs CF `001`**: none new on columns; CF had `factcheck_score INTEGER` → Phase 0 widened to `numeric` (matches `factcheck_score: number | null` in `types/database.ts:235`).
- **App invariant**: exactly one row per `content_id`. Enforced in app via `maybeSingle()` (`queries.ts:72`). *Recommended (non‑blocking) index:* `create unique index mkt_base_articles_content_unique on mkt_base_articles(content_id);` — add as a Phase 1a migration if not present (verify first; current migration has none).

### 4.2 `mkt_blog_contents` (1:N per content) — EXISTS

```sql
mkt_blog_contents (
  id, user_id, content_id (fk→mkt_contents cascade),
  title              text,
  seo_title          text,
  seo_score          numeric,
  seo_details        jsonb,          -- stores GlobalCardStyle under .globalStyle (cards.ts:30)
  naver_keywords     jsonb,          -- { primary, secondary[] }
  meta_description   text,           -- [drift]
  url_slug           text,           -- [drift] — used by internal-blog
  primary_keyword    text,           -- [drift]
  secondary_keywords text[],         -- [drift]
  search_intent      text,           -- [drift]
  heading_structure  text,           -- [drift]
  channel            text,           -- [drift] — distinguishes 'naver_blog' vs 'self_hosted'
  status             text not null default 'draft' check (...),
  published_url      text,
  published_at       timestamptz,
  created_at, updated_at
)
```

- **[drift] columns** (present in `database.ts:242-262`, absent from CF `001_initial_schema.sql:119-131` which only had `content_id, seo_title, seo_score, seo_details, naver_keywords, status, published_url, published_at`): `title`, `meta_description`, `url_slug`, `primary_keyword`, `secondary_keywords`, `search_intent`, `heading_structure`, `channel`. **All already in the Phase 0 migration** — confirm, do not re‑add.
- **`channel` semantics (DECIDED — O‑1, §15: LOOSE separation, faithful port)**: N‑blog rows and internal‑blog rows live in the **same table** and share the same `'blog'` channel‑model key. Phase 1a **sets** `channel = 'naver_blog'` for N‑blog and `channel = 'self_hosted'` for internal‑blog **on insert** (for labeling + future publish/translation), but the two panels are separated **at the panel level** (`BlogPanel` vs `InternalBlogPanel`), **not** by a strict `channel`‑column filter — mirroring ContentFlow's loose `getBlogContents(...)` read. The `channel` column is informational here, not a hard partition key. (No back‑fill needed: no existing rows.)

### 4.3 `mkt_blog_cards` (N per blog content) — EXISTS

```sql
mkt_blog_cards (
  id, user_id,
  blog_content_id uuid not null references mkt_blog_contents(id) on delete cascade,
  card_type  text not null check (card_type in ('text','image','divider','quote','list')),
  content    jsonb not null default '{}',   -- typed via getBlogCardContent() → BlogCardContent
  sort_order int not null default 0,
  created_at, updated_at
)
```

- `content` JSONB shape (`types/cards.ts:10` `BlogCardContent`): `{ text?, url?, alt?, caption?, image_prompt?, image_style? }`. In the port a card is the unified "section" (image area + text), `card_type` is always `'text'` in 1a (CF `blog-panel.tsx:311`).
- *Recommended (non‑blocking) index:* `create index mkt_blog_cards_parent_sort on mkt_blog_cards(blog_content_id, sort_order);`.

### 4.4 RLS

Already applied and correct — single‑owner, `user_id = auth.uid()` for `for all` (migration lines 433‑435):
```sql
create policy mkt_base_articles_owner on mkt_base_articles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_blog_contents_owner on mkt_blog_contents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mkt_blog_cards_owner    on mkt_blog_cards    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```
**Migration checklist (memory RULE)**: any new SECURITY DEFINER function needs explicit `GRANT EXECUTE TO authenticated, anon`. Phase 1a adds no such functions — the recommended indexes are the only optional DDL.

### 4.5 `user_id` on insert

All `mkt_*` rows carry `user_id` (RLS owner). Mutations must set it from `supabase.auth.getUser()` — exactly as `use-contents.ts:39-41` and `use-projects.ts:31-33` do today. Cascade deletes are handled by FKs (no manual child cleanup needed; `useDeleteContent` comment at `use-contents.ts:84` already relies on this).

---

## 5. Data Hooks (TanStack Query — match Phase 0 pattern)

All new hooks live in `api/` (read) and reuse `mktKeys` from `api/queries.ts`. **Pattern rules** (from Phase 0): read = `useQuery` with `enabled: Boolean(id)`; write = `useMutation` that sets `user_id`+`created_at/updated_at`, casts payload to `Record<string, unknown>`, throws on `error`, and `invalidateQueries({ queryKey: mktKeys.content(contentId) })` on success (so the whole content graph re‑fetches). Reuse `generateId()` from `lib/utils`.

### 5.1 Query‑key extension (`api/queries.ts`)

The existing factory is content‑centric (`mktKeys.content(id)` already covers the whole graph). **No new keys are strictly required** — base/blog/cards are sub‑objects of `ContentGraph` and invalidating `mktKeys.content(contentId)` refetches everything. Optionally add for finer control:
```ts
export const mktKeys = {
  ...,
  baseArticle: (contentId: string) => ['mkt', 'base-article', contentId] as const,   // optional
  blogContents: (contentId: string) => ['mkt', 'blog-contents', contentId] as const, // optional
};
```
**Decision:** default to invalidating `mktKeys.content(contentId)` (simplest, matches `fetchContentGraph`). Use the optional keys only if profiling shows the full‑graph refetch is too heavy.

### 5.2 Base article — `api/use-base-article.ts`

```ts
// READ: prefer the graph
//   const { baseArticle } = useContent(contentId).data ?? {};

export function useUpsertBaseArticle(): UseMutationResult<
  BaseArticle,
  Error,
  { contentId: string; data: Partial<BaseArticle> }
>;
// Behavior (ports project-store.ts createOrUpdateBaseArticle:883):
//   - getUser(); if no row for content_id → INSERT { id, user_id, content_id, body:'', word_count:0, ...data }
//   - else UPDATE existing by content_id, set updated_at
//   - onSuccess: invalidate mktKeys.content(contentId)
```

### 5.3 Blog contents (1:N) — `api/use-blog-contents.ts`

```ts
export function useCreateBlogContent(): UseMutationResult<
  string, Error, { contentId: string; channel: 'naver_blog' | 'self_hosted'; data?: Partial<BlogContent> }
>; // returns new id (ChannelContentList.onAdd expects Promise<string>); ports addBlogContent:928

export function useUpdateBlogContent(): UseMutationResult<
  void, Error, { id: string; contentId: string; updates: Partial<BlogContent> }
>; // ports updateBlogContent:962

export function useDeleteBlogContent(): UseMutationResult<
  void, Error, { id: string; contentId: string }
>; // ports deleteBlogContent:972 (FK cascade removes cards)
```

### 5.4 Blog cards (N per blog content) — same file

```ts
// The high-frequency "setCards" pattern — delete-all-then-bulk-insert.
// Ports project-store.ts setBlogCardsForContent:995-1005 EXACTLY:
//   1. await supabase.from('mkt_blog_cards').delete().eq('blog_content_id', blogContentId)
//   2. if cards.length: await supabase.from('mkt_blog_cards').insert(cards as Record<string,unknown>[])
//   3. onSuccess: invalidate mktKeys.content(contentId)
export function useSetBlogCards(): UseMutationResult<
  void, Error, { blogContentId: string; contentId: string; cards: BlogCard[] }
>;

export function useAddBlogCard(): UseMutationResult<
  string, Error, { blogContentId: string; contentId: string; cardType: BlogCard['card_type']; sortOrder: number }
>; // ports addBlogCard:1016

export function useUpdateBlogCard(): UseMutationResult<
  void, Error, { cardId: string; contentId: string; updates: Partial<BlogCard> }
>; // ports updateBlogCard:1039 — see §5.6 for debounced variant

export function useDeleteBlogCard(): UseMutationResult<
  void, Error, { cardId: string; contentId: string }
>; // ports deleteBlogCard:1051

export function useReorderBlogCards(): UseMutationResult<
  void, Error, { blogContentId: string; contentId: string; cardIds: string[] }
>; // ports reorderBlogCards:1061 — parallel sort_order updates, like useReorderContents:96
```

### 5.5 Channel models — `api/use-channel-models.ts`

Ports `getChannelModels`/`setChannelModels` (`project-store.ts:1679/1699`). Per‑(project, channel) settings: `{ textModel, imageModel, aspectRatio, imageStyle, imageInstruction }`. Persist inside `mkt_projects.ai_model_settings` JSONB keyed by channel (e.g. `ai_model_settings.channelModels['blog']`). Defaults from `lib/ai-models.ts` (`DEFAULT_TEXT_MODEL`, `DEFAULT_IMAGE_MODEL`). Channels used in 1a: `'base-article'` (text only, no image), `'blog'` (used by **both** N‑blog and internal‑blog, per CF). Reads come from `useProject(projectId)`; writes go through `useUpdateProject()` (exists, `use-projects.ts:105`) merging the JSONB — debounce via `useDebouncedSave('mkt_projects', projectId)`.

### 5.6 Debounced autosave for high‑frequency card edits

- **Base article body**: CF uses `use-auto-save.ts` (2 s, flush on unmount). Port it as `hooks/use-auto-save.ts` (`{ schedule, flush, lastSaved }`, `delay=2000`, `onSave` → `useUpsertBaseArticle`). Keep the **2 s** delay (`use-auto-save.ts:10`).
- **Per‑section text edits** (`SectionTextEditor`, `blog-card-item.tsx:113`): CF debounces editor `onUpdate` at **300 ms** locally then writes via `updateBlogCard`. Port that 300 ms local debounce in the component, and route the persistence through **`useDebouncedSave('mkt_blog_cards', cardId)`** (Phase 0 util, `api/use-debounced-save.ts`, 800 ms coalesce + save‑status reporting). Net effect: card‑text keystrokes coalesce and report to `save-status-store` (the TopBar `SaveStatusIndicator` lights up). Card *structure* changes (image set, add/delete/reorder, `setCards` after generation) use the direct mutations in §5.4 (not debounced).

> Note: `useDebouncedSave` is intentionally **one instance per table/id** (its doc, `use-debounced-save.ts:16-18`). `BlogCardItem` must instantiate it with its own `card.id`.

---

## 6. Components

Path: `features/marketing/components/content/`. Naming = **PascalCase files** (Tangobook convention; ContentFlow used kebab‑case). Primitives imported from `../../ui` (e.g. `import { Button } from '../../ui/button'`) — NOT `@/components/ui/*`. `cn` from `../../lib/utils`. Icons from `lucide-react` (Phase 0 added it for parity; **verify icon names exist at `^1.17.0`** — see §13 risk). Drop all `'use client'` directives (Vite, not Next).

For each component: **Purpose · Props · Key deps · Ported lib/primitive**. Source file cited on the ContentFlow side.

### 6.1 `ContentTabs.tsx`  ← `src/components/content/content-tabs.tsx`
- **Purpose**: tab bar + language selector + routes to the active channel panel. Mounted in the content page right pane.
- **Props**: none (reads `useUIStore` for `selectedContentId`/`selectedProjectId`/`selectedLanguage`; reads graph via `useContent`).
- **Tabs (7, order from CF :33‑41)**: `기본글`(base-article) · `N 블로그`(blog) · `내부 블로그`(self_hosted) · `카드뉴스`(cardnews) · `스레드`(threads) · `롱폼`(youtube) · `숏폼`(shorts). **Active in 1a**: base‑article, blog, self_hosted. **Placeholder in 1a**: the other four render a centered "준비 중" card (reuse CF's shorts placeholder JSX, :202‑224, generalized).
- **Language tabs**: render `<LanguageSelector>` (§6.13). **ko pinned**; the `blog` tab is hidden when `selectedLanguage !== 'ko'` and auto‑switches to base‑article (CF :49‑53, :168). See §11.
- **Key deps**: `useUIStore`, `useContent`. **Do NOT** import `translateAndSaveChannel` / `channel-translator` in 1a (translation = 1b) — the `onTranslate` handler is a no‑op stub that alerts "번역은 곧 지원됩니다".

### 6.2 `BaseArticlePanel.tsx`  ← `base-article-panel.tsx`
- **Purpose**: 기본글 editor host + AI generate + topic + confirm toggle + autosave status.
- **Props**: `{ content: Content; project: Project }` (inner); outer reads from store/graph and keys on `content.id` (CF :380‑386).
- **Behavior**: word‑count badge; "AI 주제뽑기" → `TopicSuggestionDialog`; "AI 글 생성" (`GenerationButton variant="text"`, disabled until `content.topic` set) → opens `PromptEditDialog` with `buildBaseArticlePrompt({ project, content })`; SSE stream throttled to editor at 200 ms (CF :91‑95); on complete, strip HTML→plain, `countWords`, `useUpsertBaseArticle`. Partial regenerate from bubble menu → `buildPartialRegenerationPrompt` then `replaceSelection`. **"원장님 컨펌"** toggle → `useUpdateContent(content.id, { confirmed })` (CF :340‑363). "Perplexity 첨삭" button rendered **disabled** (CF :232).
- **Key deps**: `useAiGeneration`, `use-auto-save`, `useUpsertBaseArticle`, `useUpdateContent`, `useChannelModels(project.id,'base-article')`.
- **Ported libs**: `buildBaseArticlePrompt`, `buildPartialRegenerationPrompt`, `buildTopicSuggestionPrompt` (all already in `lib/prompt-builder.ts`, Phase 0), `countWords` (**already in `lib/utils.ts:13`, Phase 0** — reuse, do not re‑add).
- **1a simplification**: the non‑ko **translation overlay** (CF :304‑318, reads `factcheck_report.translations[lang]` via `/api/storage/proxy`) is ported as **read‑only** using `/api/mkt/storage/proxy` (Phase 0, `storage.controller.ts:68`). If no translation exists it shows "번역되지 않음" (no generate button in 1a).

### 6.3 `editor/BaseArticleEditor.tsx`  ← CF `src/components/editor/base-article-editor.tsx`
> Source‑path note: the two editor files live in CF under `src/components/**editor**/` (a sibling of `content/`), not `content/editor/`. Target them in Tangobook under `features/marketing/components/content/editor/`.
- **Purpose**: TipTap rich editor with toolbar, bubble‑menu "이 부분 다시 쓰기", and R2 image upload on drop/paste.
- **Props**: `{ initialContent?; onUpdate?(html, plainText, wordCount); onPartialRegenerate?(selectedText); projectId? }`; `forwardRef<BaseArticleEditorRef>` exposing `setContent / getHTML / getPlainText / replaceSelection` (CF :15‑20, :116‑126).
- **Key deps**: `@tiptap/react` (`useEditor`, `EditorContent`), `BubbleMenu` from `@tiptap/react/menus`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`.
- **TipTap notes**: **DROP `immediatelyRender: false`** (CF :62 — it's a Next‑SSR flag, no‑op/misleading in Vite; see §7). Keep `editorProps.handleDrop`/`handlePaste` image upload, but route to **`/api/mkt/storage/presign`** and read **`uploadUrl`** (not CF's `/api/storage/presign` + `presignedUrl`; see §8). Reuse Phase 0 `uploadToR2` from `hooks/use-r2-upload` instead of hand‑rolled fetch.
- **Ported primitive**: `Button` from `../../ui/button`.

### 6.4 `editor/EditorToolbar.tsx`  ← CF `src/components/editor/editor-toolbar.tsx`
- **Purpose**: formatting buttons (H1/H2/H3, bold/italic/strike, lists, quote, hr, image).
- **Props**: `{ editor: Editor | null; projectId? }`.
- **Key deps**: lucide icons; image button → presign upload (same `/api/mkt` correction as §6.3).

### 6.5 `BlogPanel.tsx`  ← `blog-panel.tsx` (the heart, 1,271 lines)
- **Purpose**: N‑blog channel — model selector + SEO‑retry counter + `ChannelContentList` of blog posts; each post = `BlogPanelInner` (4 workflow steps).
- **Props (outer)**: none; reads graph. **Props (`BlogPanelInner`)**: `{ blogContent, content, project, hasBaseArticle, channelModels, maxRetries }` (CF :81‑88).
- **Workflow (4 steps, `WorkflowStepBar`)**: 키워드(1) → 구조(2) → 생성(3) → SEO(4) (CF :72‑77). Auto‑jump to step 3 if cards exist (CF :140‑145).
- **SEO auto‑retry loop (port exactly, CF :247‑365)**: `SEO_THRESHOLD = 0.9`. On generate complete: parse JSON (object‑with‑sections or bare array), build cards, `formatForMobile` each, `useSetBlogCards`. Then `calculateNaverSeoScore(finalTitle, newCards, {primary, secondary})`; `buildSeoFeedback(details)` collects items where `category !== 'image' && category !== 'title' && score < maxScore * 0.9`; if feedback and `retryCount < maxRetries`, increment and re‑`generate` an SEO‑fix prompt (CF :347 template) after a 100 ms tick. `seoRetryLimit` default **3**, range 0‑10 (CF :1193, :1224‑1232).
- **Image gen**: `useCardImageGeneration` config — `getPrompt` uses card `image_prompt`+`image_style` else `buildBlogImagePromptForCard(project, cards, idx, style, imageInstruction)`; `aspectRatio` default `'16:9'`; `shouldSkip` if card already has url (CF :368‑386). Per‑card + "전체 이미지" batch.
- **Other**: `seoResult = useMemo(calculateNaverSeoScore(seoTitle, cards, naverKeywords))` (CF :215); `SeoScoreDisplay` (§6.10); `GlobalCardStyle` controls persisted to `seo_details.globalStyle` (CF :133‑137); PC/mobile `viewMode` toggle; `applyMobileFormatAll`; `NaverKeywordPanel` (step 1). **Golden‑keyword pool & AI auto‑pick (CF :451‑545)** depend on the Ideas module / `savedKeywords` / `getStrategy` → **OUT of 1a scope** (strip these; keep manual primary/secondary keyword entry + `NaverKeywordPanel` search). **DECIDED — O‑2, §15.**
- **Key deps**: `useAiGeneration`, `useCardImageGeneration`, blog‑card/blog‑content hooks, `useChannelModels(project.id,'blog')`.
- **Ported libs**: `buildBlogPrompt`, `buildBlogImagePromptForCard` (`prompt-builder.ts`); `calculateNaverSeoScore` + `SeoDetail`/`SeoResult` (`seo-scorer.ts`); `formatForMobile` (lives in `BlogCardItem`, §6.7); `fetchAiGenerate` (`sse-stream-parser.ts:115`) only if porting auto‑pick (skip in 1a).
- **`ChannelContentList` wiring**: `accentColor="bg-indigo-600 hover:bg-indigo-700"`; **omit `onAddToQueue`/`publishChannels`** (publish = Phase 3). `getTitle` → `item.title || `블로그 글 ${i+1}``; `onAdd` → `useCreateBlogContent({channel:'naver_blog'})`.

### 6.6 `InternalBlogPanel.tsx`  ← `internal-blog-panel.tsx` (1,000 lines)
- **Purpose**: same blog editor, **Google‑SEO** variant. Same `blog_*` tables + `'blog'` model key.
- **Differences from `BlogPanel` (port these, CF refs)**: prompt suffix = **Google/GEO** block (CF :294 — H1/H2/H3 hierarchy, internal‑link suggestions, keyword density 1‑2%, **FAQ 3‑5 for GEO**) instead of Naver D.I.A.; `url_slug` field (CF :140, persisted via `useUpdateBlogContent`, :597); structure generation returns `{ ..., urlSlug }` (CF :500, :514); keyword research hits **`/api/mkt/google/keywords`** (CF :168, :376) not Naver; **schedule badges** per language showing publish status (CF :340 region) + a **schedule dialog/button** that is **STUBBED in 1a** (render the button, but `onClick` → alert "예약 발행은 Phase 3에서 지원됩니다"; do NOT import `schedulePublish`). "🔍 Google SEO 검사" section header (CF :755).
- **SEO model (DECIDED — O‑3, §15): Google‑SEO ad‑hoc checklist, NOT the Naver numeric scorer.** Internal‑blog renders the **boolean Google‑SEO checklist** under "🔍 Google SEO 검사" (CF :755‑797): `url_slug` set, FAQ section present, internal‑link suggestions present, keyword‑density hint, and a Schema note ("발행 시 Article/FAQ/MedicalEntity Schema 자동 추가"). It does **NOT** call `calculateNaverSeoScore`, does **NOT** render `SeoScoreDisplay`, and does **NOT** run the SEO auto‑retry loop — those are **N‑blog only** (§6.5/§9). Faithful to ContentFlow.
- **Channel value**: writes `channel = 'self_hosted'` on insert (labeling/publish only; not used as a hard list filter — O‑1).
- **Key deps**: blog‑content/blog‑card hooks, `useAiGeneration`, `useCardImageGeneration`, `useChannelModels(project.id,'blog')`, `/api/mkt/google/keywords`. **Excluded**: `schedulePublish`, `ChannelTranslationView` (→ 1b/3), `calculateNaverSeoScore`/`SeoScoreDisplay`/auto‑retry (N‑blog only).
- **Ported libs**: `buildBlogPrompt` + inline Google‑SEO suffix string (CF :294). A dedicated numeric Google/GEO scorer is a future enhancement, not 1a.

### 6.7 `BlogCardItem.tsx`  ← `blog-card-item.tsx`
- **Purpose**: one blog **section** = image area (top) + TipTap text editor (bottom), with `GlobalCardStyle` CSS‑var scoping.
- **Props**: `{ card: BlogCard; index; onUpdate(cardId, content); onDelete(cardId); onGenerateImage?(cardId); onAbortImage?; isGeneratingImage?; generatingCardId?; globalStyle?: GlobalCardStyle }` (CF :21‑31).
- **Exports**: `formatForMobile(html)` (CF :39‑88 — pure DOM string transform; **also unit‑testable**, see §12), `AddCardButton` (CF :355).
- **Key deps**: `@tiptap/react` + StarterKit + Image + Placeholder (per‑section `SectionTextEditor`, 300 ms debounce, CF :100‑119 — **drop `immediatelyRender:false`**); `ImageCardWidget`; `ImageStyleSelector` (small — port or inline a minimal style dropdown), `KoreanInput`/`KoreanTextarea` (Phase 0 ui). `image-editor-dialog` (`ImageEditorDialog`, CF :249) is **OUT of 1a** — render the edit button only if you also port the dialog (defer; pass `onEdit={undefined}`).
- **GlobalCardStyle CSS vars** (CF :313‑340): inline `<style>` scoped to `.blog-card-editor .tiptap h1/h2/h3/p/li` driven by `--heading-font/-size/-weight`, `--body-*`, `--text-align`. Port verbatim.
- **Ported types**: `BlogCardContent`/`GlobalCardStyle` from `types/cards.ts` (already in Phase 0), `getBlogCardContent`.

### 6.8 `WorkflowStepBar.tsx`  ← `workflow-step-bar.tsx`
- **Purpose**: 4‑step segmented progress bar (clickable).
- **Props**: `{ steps: WorkflowStepMeta[]; currentStep: 1|2|3|4; onStepChange }`. **Ported primitive**: `cn`. Trivial, verbatim port.

### 6.9 `NaverKeywordPanel.tsx`  ← `naver-keyword-panel.tsx`
- **Purpose**: keyword search table (PC/mobile volume, competition) → set primary / add secondary.
- **Props**: `{ onSetPrimary(kw); onAddSecondary(kw); primaryKeyword; secondaryKeywords }`.
- **Behavior**: call the `api/use-keywords.ts` wrapper → `POST /api/mkt/naver/keywords` with `{ keywords }` (CF used `/api/naver/keywords`, :41 — **change to `/api/mkt`**). The wrapper unwraps the Tangobook `{ success, data }` envelope (O‑6, §15) and returns `data.keywords`. Result rows: `{ keyword, pcSearchVolume, mobileSearchVolume, totalSearchVolume, competition, ... }`. Competition labels HIGH/MEDIUM/LOW.
- **Key deps**: `Button`/`Input`/`Badge` (ui), lucide.

### 6.10 `SeoScoreDisplay.tsx`  ← inline in `blog-panel.tsx:36-66`
- **Purpose**: collapsible SEO score (big number + per‑category breakdown bars).
- **Props**: `{ score: number; details: SeoDetail[] }`.
- **Ported lib**: `SeoDetail` from `seo-scorer.ts`. Extract from the inline CF component into its own file (Tangobook prefers one component per file).

### 6.11 `ChannelModelSelector.tsx`  ← `channel-model-selector.tsx`
- **Purpose**: inline row of model/aspect/style selectors + collapsible image‑instruction textarea.
- **Props**: `{ textModel, imageModel, onTextModelChange, onImageModelChange, showImageModel?, aspectRatio?, onAspectRatioChange?, imageStyle?, onImageStyleChange?, showImageSettings?, defaultAspectRatio?, imageInstruction?, onImageInstructionChange? }` (CF :10‑26).
- **Key deps**: `Select` (ui), `KoreanTextarea` (ui), `TEXT_MODELS`/`IMAGE_MODELS` from `lib/ai-models.ts`, `ASPECT_RATIO_PRESETS` + `ImageStyleSelector` (port the small `image-style-selector.tsx`; it exports both — needed by base/blog/card).
- **Base‑article usage**: `showImageModel={false}` (text only, CF :244).

### 6.12 `ChannelContentList.tsx`  ← `channel-content-list.tsx`
- **Purpose**: generic accordion list of channel items (expand/collapse, inline rename, delete, add). Generic `<T>`.
- **Props**: `{ items, getId, getTitle, onTitleChange, onAdd: ()=>Promise<string>, onDelete, onAddToQueue?, publishChannels?, accentColor?, addLabel, renderContent }` (CF :16‑28). In 1a **omit** `onAddToQueue`/`publishChannels`.
- **Key deps**: `Button`/`Badge`/`DropdownMenu` (ui), `ErrorBoundary` — port a minimal `ErrorBoundary` to `features/marketing/components/` (CF imports `@/components/error-boundary`; Tangobook has its own — **verify/choose**, §13) wrapping `renderContent` with `resetKeys=[id]`.
- First item auto‑expands (CF :43‑47).

### 6.13 `LanguageSelector.tsx`  ← `language-selector.tsx`
- **Purpose**: per‑content language tabs; shows only when project has 2+ `target_languages`; ko pinned; per‑lang translate trigger + status.
- **Props**: `{ channel; onTranslate(lang); translationStatuses }`.
- **1a behavior**: render tabs and switch `selectedLanguage` (UI‑store). **`onTranslate` is a stub** (alert) — translation generation is 1b. Keep the "ko‑pinned + Naver‑blog hidden for non‑ko" logic that ContentTabs relies on (§11).
- **Key deps**: `useUIStore`, `useProject(projectId)` for `target_languages` (the language source — DECIDED O‑4, §11/§15). `@tangobook/shared` `SUPPORTED_LANGUAGES` only optionally, for label/flag lookup.

### 6.14 `GenerationButton.tsx`  ← `generation-button.tsx`
- **Purpose**: unified generate/abort button (variants text/image/batch‑image/translate, progress, colors). Verbatim port. **Props** per CF :9‑23.

### 6.15 `ImageCardWidget.tsx`  ← `image-card-widget.tsx`
- **Purpose**: image slot with hover actions (zoom/edit/regen/download/upload/delete), drag‑drop, history strip, generating overlay.
- **Props** per CF :9‑36 (`src, alt?, history?, aspectClass?, onRegenerate?, onAbort?, onDelete?, onUpload?, onRestore?, onEdit?, isGenerating?, placeholder?, hideBottomActions?, className?`).
- **Notes**: replace `<img>` (CF has `@next/next/no-img-element` disables) with plain `<img>`; uses `ImageLightbox` (port the tiny `image-lightbox.tsx`).

### 6.16 `PromptEditDialog.tsx`  ← `prompt-edit-dialog.tsx`
- **Purpose**: review/edit the generated prompt before streaming. **Props** per CF :11‑18. Verbatim (uses `Dialog`/`Textarea`/`Button` ui).

### 6.17 `TopicSuggestionDialog.tsx`  ← `topic-suggestion-dialog.tsx`
- **Purpose**: AI topic suggestions (cards, hint input, regenerate, select). **Props** per CF :17‑27 (`TopicSuggestion = { title; outline }`). Verbatim (uses `Dialog`/`Card`/`Textarea`/`Button` ui).

### 6.18 `BlogPreviewDialog.tsx`  ← `blog-preview-dialog.tsx`
- **Purpose**: read‑only rendered preview of blog cards (PC/mobile). **Props**: open/onOpenChange + cards/title. 1a = **preview only** (no publish action). Port; uses `buildBlogCardsHtml` from `channel-translator.ts` (Phase 0) for the HTML.

### 6.19 `ContentPage.tsx`  ← EDIT existing (`pages/ContentPage.tsx`)
- **Change**: replace the right‑pane placeholder (`:13-16`) with `{selectedContentId ? <ContentTabs/> : <div…>콘텐츠를 선택하세요</div>}`. Keep the left `<ContentListPanel/>` untouched (Phase 0). `selectedContentId` from `useUIStore`.

---

## 7. TipTap Integration Notes

- **New dependency** (add to `packages/client/package.json`): `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, and **`@tiptap/pm`** (peer; CF has it at `^3.20.1`). Pin to a single 3.x line matching CF (`^3.20.1`) to avoid PM duplication. Run `pnpm --filter client add …`.
- **`immediatelyRender: false` → DROP**: this is a Next.js SSR guard (prevents hydration mismatch when the editor renders on the server). Vite renders client‑side only. Leaving it set is harmless but misleading; remove it from `BaseArticleEditor` (CF `base-article-editor.tsx:62`) and `SectionTextEditor` (CF `blog-card-item.tsx:101`). If a TipTap 3.x SSR‑safety warning appears in dev, the correct Vite answer is to render the editor only after mount (it already is), not to set this flag.
- **BubbleMenu import path**: `@tiptap/react/menus` (CF `base-article-editor.tsx:6`) — this is the TipTap 3.x location (moved out of core). Keep.
- **Controlled‑content sync**: keep CF's guarded `setContent(initialContent, { emitUpdate:false })` effect (CF :104‑108) to avoid feedback loops with autosave.
- **Plain‑text / word count**: `editor.getText()` + `countWords` (**already in `lib/utils.ts:13`, Phase 0** — reuse). HTML→plain fallback `replace(/<[^>]*>/g,' ')` is used when streaming raw (CF `base-article-panel.tsx:108`).
- **Styling (DECIDED — O‑8, §15): port CF's `.tiptap` CSS into the scoped marketing stylesheet; do NOT use `prose`/`@tailwindcss/typography`.** `@tailwindcss/typography` is **not installed** in `packages/client` (verified absent from `tailwind.config.ts` + `package.json`), so `prose` classes render unstyled. **Action**: copy ContentFlow's `.tiptap` ruleset (`src/app/globals.css:132-199` — `.tiptap` + `h1/h2/h3/p/strong/em/ul/ol/li/blockquote/img/hr` + the `p.is-editor-empty:first-child::before` placeholder) into the Phase 0 scoped stylesheet **`packages/client/src/features/marketing/theme/marketing-tokens.css`**, prefixing every selector with `.marketing-scope` (e.g. `.marketing-scope .tiptap h2 { … }`) to preserve scope isolation. Strip all `prose`/`prose-*` classNames from the ported editor JSX (`BaseArticleEditor`, `SectionTextEditor`, preview). The `GlobalCardStyle` `<style>` block (§6.7) still overrides h/p inside `.blog-card-editor .tiptap` with `!important` on top of these base rules.

---

## 8. Image Pipeline + R2 CORS

### 8.1 Endpoint reality (Phase 0 already built most of it)
- **`POST /api/mkt/ai/generate-image`** EXISTS (`controllers/mkt/ai.controller.ts:43`). Returns `{ success:true, data:{ image } }` where `image` is **base64** (not a data URL). Backed by `generateImageWithGemini` (`providers/gemini.provider.ts:38`) which **already implements the Strategy pattern** (`isImagenModel(model)` → Imagen API vs Gemini image, `:34/:50/:80`), supports `referenceImages[]` + `aspectRatio`. **No server work needed in 1a for image gen.**
- **`POST /api/mkt/storage/presign`** EXISTS (`storage.controller.ts:28`) → returns the **enveloped** body `{ success: true, data: { uploadUrl, publicUrl, key } }` (`storage.controller.ts:44`). **Naming drift to fix in ported components**: ContentFlow calls `/api/storage/presign` and destructures **`presignedUrl`** (`editor-toolbar.tsx:41`, `base-article-editor.tsx:48`, `hooks/use-r2-upload.ts:111`). Phase 1a must call **`/api/mkt/storage/presign`** and use **`uploadUrl`**. Prefer reusing the Phase 0 `uploadToR2` (`hooks/use-r2-upload.ts` → `api/use-r2-upload.ts`) everywhere instead of hand‑rolled fetch.
- **⚠️ Phase 0 `uploadToR2` envelope bug (FIX before image work — R‑11)**: the Phase 0 client `uploadToR2` (`api/use-r2-upload.ts:53`) destructures `const { uploadUrl, publicUrl, key } = await presignRes.json()` at the **top level**, but the server wraps the payload in `{ success, data: {…} }` — so at runtime all three are `undefined` and the PUT goes to `undefined`. The Phase 0 unit test masks this because it mocks a **flat** presign response (`api/__tests__/use-r2-upload.test.ts:39-43`), not the real envelope. **Phase 1a must fix `uploadToR2` to read `(await presignRes.json()).data` (and update the test fixture to the enveloped shape)** before any image upload/gen is wired, since the whole image pipeline (drag/paste + `use-card-image-generation`) routes through it.

### 8.2 Client image‑gen flow (`hooks/use-card-image-generation.ts` — port of CF :40‑142)
1. Call a small `hooks/use-image-generation.ts` that POSTs `/api/mkt/ai/generate-image` and returns `{ base64, mimeType }` (port CF `use-image-generation.ts`; adapt URL + response shape — CF returns base64, our endpoint returns `data.image`).
2. `convertToWebpBlob(base64, mimeType)` → WebP via Canvas (CF `use-r2-upload.ts:24`).
3. `uploadToR2(blob, { projectId, category:'images', fileName:`${cardId}.webp`, contentType, contentId })` → `{ publicUrl }`; on failure fall back to a `data:` URL (CF :85‑87).
4. `saveResult(cardId, url, prompt)` → `useUpdateBlogCard(cardId, { content:{ ...latest, url, image_prompt:prompt } })`.
5. Batch: filter by `shouldSkip`, 3 s delay between cards, progress counter, summary alert (CF :100‑127).

### 8.3 GAP to close: WebP conversion helpers not yet ported
`convertToWebpBlob` and `base64ToBlob` exist in ContentFlow (`src/hooks/use-r2-upload.ts:24/52`) but **were NOT ported in Phase 0** (verified: Phase 0 `api/use-r2-upload.ts` has neither; grep across `features/marketing` returns none). **Phase 1a must add** `features/marketing/lib/image-utils.ts` exporting `convertToWebpBlob(base64, srcMime)` and `base64ToBlob(input, mimeType?)` (pure, Canvas‑based; the latter is unit‑testable). Also consider porting `useR2Upload`'s `uploadBase64` convenience if components need it.

### 8.4 R2 CORS note (forward‑looking)
Canvas `drawImage`→`toBlob` taints the canvas if the source image is cross‑origin **without** CORS headers, throwing on `toBlob`. In 1a the WebP conversion runs on **freshly generated base64** (same‑origin data, no taint) and on **uploaded local Files** (no taint) — so 1a is safe. But **regenerating from an existing R2 image URL** (passing `referenceImage` = existing `publicUrl`) and any future cardnews canvas compositing (Phase 1b) **will** need R2 to send `Access-Control-Allow-Origin`. Action for 1a: **verify the R2 bucket CORS policy allows the app origin for GET** (and document it), even though 1a doesn't strictly require it. The existing `/api/mkt/storage/proxy` (`storage.controller.ts:68`) is the same‑origin escape hatch if CORS can't be set. (Master plan §8 flags this as a Phase 1 R2 pre‑check.)

---

## 9. SEO Scorer Wiring

- `lib/seo-scorer.ts` is **already ported** (Phase 0). Exports `calculateNaverSeoScore(seoTitle, cards, naverKeywords) → SeoResult { score; details: SeoDetail[] }` and `SeoDetail { category; label; score; maxScore; message }`.
- **9 scored categories** (maxScores sum to 100): `title`(15), `keyword-density`(15), `content-length`(10), `structure`(15), `image`(10), `first-paragraph`(10), `search-intent`(10), `mobile-readability`(10), `meta`(5). (Verified against `seo-scorer.ts` category emit lines :139/:172/:206/:249/:282/:323/:371/:421/:453.)
- **Live score** (`BlogPanel`): `useMemo(() => calculateNaverSeoScore(seoTitle, cards, {primary, secondary}), [seoTitle, cards, primary, secondary])` (CF :215). Rendered by `SeoScoreDisplay`.
- **Auto‑retry feedback** (`buildSeoFeedback`): filter `details` to `category !== 'image' && category !== 'title' && score < maxScore * 0.9`; join failing items into the retry prompt (CF :252‑258, :338‑348). Threshold constant `SEO_THRESHOLD = 0.9`.
- **Internal‑blog does NOT use this scorer (DECIDED — O‑3, §15).** The Naver `seo-scorer` + `SeoScoreDisplay` + the auto‑retry loop are **N‑blog only**. Internal‑blog uses a Google‑SEO **boolean checklist** (FAQ/GEO/Schema/internal‑link/`url_slug`) instead — see §6.6. A dedicated numeric Google/GEO scorer is a later enhancement.

---

## 10. (reserved)

---

## 11. i18n / Language‑tab behavior

- **Source of languages (DECIDED — O‑4, §15): `project.target_languages`, ko pinned first.** Faithful port of ContentFlow: the per‑content `LanguageSelector` derives tabs from the marketing **project's own** `target_languages` array (set in Phase 0 `TargetLanguagesSection`; column `mkt_projects.target_languages text[]`, migration `:51`), and renders only when `length >= 2`. Do **NOT** couple to the storybook‑side `@tangobook/shared` `SUPPORTED_LANGUAGES` — marketing content languages are an independent axis. The shared list MAY be consulted only for display labels/flags if convenient (not the source of truth, not required).
- **ko pinned**: `selectedLanguage` defaults to `'ko'` (`store/ui-store.ts:40`); ko is always present/first.
- **Naver‑blog is Korean‑only**: the `blog` tab is **hidden** when `selectedLanguage !== 'ko'`, and if it was active, ContentTabs auto‑switches to `base-article` (CF `content-tabs.tsx:49-53`, :168). Internal‑blog and base‑article remain visible for non‑ko (they support translation in 1b).
- **1a translation = read‑only**: language tabs switch the view; the base‑article panel shows an existing translation (via `/api/mkt/storage/proxy`) or "번역되지 않음". **No translation is generated in 1a** (the AI‑번역 button + `translateAndSaveChannel` SSE are Phase 1b). `ChannelTranslationView` is not ported in 1a.

---

## 12. Error Handling

- **Server**: all `/api/mkt` handlers use `asyncHandler` + `throw new AppError(status, msg)` (Phase 0 convention, `ai.controller.ts`, `storage.controller.ts`). New keyword endpoints throw `AppError(400)` on bad input, `AppError(502)` on upstream failure, and surface a `{ success:false }` error body via `errorMiddleware`. SSE generate streams an `error` event (`writeSSEError`, `gemini-sse.service.ts:15`) rather than throwing mid‑stream.
- **Client SSE**: `use-ai-generation` aborts via `AbortController`, swallows `AbortError`, and routes other errors to `onError` (CF `use-ai-generation.ts:54-60`). Panels show `alert(...)` on parse/gen failure and **reset `retryCountRef` to 0** (CF :352‑354, :360‑363) — port exactly so a failed retry loop doesn't wedge.
- **JSON parsing**: blog/topic generation tolerates code‑fenced and bare JSON (object‑with‑sections or array) — port the `objMatch`/`arrMatch` logic (CF :270‑293) and the topic `[\s\S]*` match (CF `base-article-panel.tsx:130`).
- **Image gen**: per‑card failure in batch is collected and reported once at the end; single‑card failure alerts immediately (CF `use-card-image-generation.ts:90-96, :122-124`). R2 upload failure falls back to a data‑URL so the user never loses the image.
- **`ChannelContentList`** wraps each expanded item in an `ErrorBoundary` (resetKeys=[id]) so one corrupt card row can't blank the whole list (CF :195).
- **Save status**: card‑text debounced saves report to `save-status-store` (Phase 0) — failures set an error string shown in the TopBar `SaveStatusIndicator`. `useDebouncedSave` already does 1 retry after 500 ms (`use-debounced-save.ts:58-67`).

---

## 13. Risks & dependencies to verify before/early in implementation

| # | Risk | Action |
|---|---|---|
| R‑1 | **lucide‑react version skew (direction corrected)** — Tangobook pins `lucide-react@^1.17.0` (`packages/client/package.json:36`); ContentFlow uses **`^0.577.0`** (CF `package.json:34`). Tangobook is the **higher** major (the 0.x→1.0 release renamed/removed some icons), so icons CF used (`Wand2`, `GripVertical`, `RectangleHorizontal`, `MessageSquare`, `ChevronRight`, `Languages`, `Square`, `Sparkles`, …) may have been renamed/dropped at 1.x. | **Verify each imported icon resolves at 1.17** (Vite build fails fast on a missing export); substitute the renamed ones or bump lucide‑react. Do NOT assume parity. |
| R‑2 | **`convertToWebpBlob`/`base64ToBlob` not ported** (verified absent; see §8.3). | Add `lib/image-utils.ts` first (blocks image gen). |
| R‑3 | **presign field/path drift** (CF `/api/storage`+`presignedUrl` → Tangobook `/api/mkt/storage`+`uploadUrl`). Verified: Phase 0 server returns `uploadUrl` (`storage.controller.ts:44`); CF reads `presignedUrl` (CF `use-r2-upload.ts:111`). | Search‑and‑replace in every ported component; prefer reusing the Phase 0 `uploadToR2` (`api/use-r2-upload.ts`). |
| R‑4 | ~~`countWords` missing~~ — **NOT A RISK (corrected)**: `countWords` is **already ported** in Phase 0 (`lib/utils.ts:13`) and tested (`lib/__tests__/utils.test.ts:39`). | Reuse it; do **not** re‑add. |
| R‑5 | **`ImageStyleSelector` + `ASPECT_RATIO_PRESETS`** (CF `image-style-selector.tsx`, exports both at `:52`/`:116`) and **`ImageLightbox`** (CF `image-lightbox.tsx`) not yet ported but required by `ChannelModelSelector`/`BlogCardItem`/`ImageCardWidget`. | Port these small files in Step 0.3. |
| R‑6 | **`ErrorBoundary` resetKeys mismatch (resolved)** — Tangobook's root `ErrorBoundary` (`design-system/primitives/ErrorBoundary.tsx`) supports only `{ children, fallbackMessage }`, **not** `resetKeys` (which `ChannelContentList` needs). | **Port CF's `error-boundary.tsx` (has `resetKeys`)** to `features/marketing/components/ErrorBoundary.tsx`; do not reuse the root one. |
| R‑7 | **`@tiptap/pm` peer + 3.x line** — mismatched ProseMirror versions cause "duplicate prosemirror‑model" runtime errors. Verified CF pins all `@tiptap/*` + `@tiptap/pm` at `^3.20.1`. | Pin all `@tiptap/*` + `@tiptap/pm` to one `^3.20.1` line; single install command. |
| R‑8 | **No `@tailwindcss/typography` (resolved)** — verified the plugin is **not installed** in `packages/client`; `prose` classes would render unstyled. | Port CF's `.tiptap` rules (`globals.css:132-199`) into `theme/marketing-tokens.css` scoped under `.marketing-scope`; strip `prose` classNames (§7, O‑8). |
| R‑9 | **`@tanstack` full‑graph refetch** after every card mutation could feel heavy on large posts. | Start simple (invalidate `mktKeys.content`); add granular keys (§5.1) only if needed. |
| R‑10 | **External keyword APIs** require live credentials (`NAVER_AD_API_KEY` / `NAVER_AD_SECRET_KEY` / `NAVER_AD_CUSTOMER_ID`, `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`). Config already wired (`config/index.ts:32-35,66-68`). | Implement with graceful `AppError(502)` + a clear "키 미설정" message; keyword panels must degrade (search returns error, manual entry still works). |
| R‑11 | **Phase 0 `uploadToR2` reads the wrong response shape** — destructures top‑level instead of `.data` from the enveloped presign response; the unit test mocks a flat shape so it's green but the real upload sends a PUT to `undefined`. Blocks the entire image pipeline. | Fix `api/use-r2-upload.ts:53` to read `(await presignRes.json()).data`; update `api/__tests__/use-r2-upload.test.ts` fixture to `{ success:true, data:{…} }`. Do this in Step 0 before image hooks. |

---

## 14. Express Endpoints

`/api/mkt` is already mounted (`routes/mkt.routes.ts`). Add two keyword routes; the image route already exists.

| Method · Path | In | Out | External API · Env | Status |
|---|---|---|---|---|
| `POST /api/mkt/ai/generate-image` | `{ prompt, model?, aspectRatio?, referenceImages?:[{base64,mimeType}] }` | `{ success, data:{ image:base64 } }` | Gemini image / **Imagen** (Strategy via `isImagenModel`) — `GEMINI_API_KEY` | **EXISTS** (`ai.controller.ts:43`, `gemini.provider.ts:38`) — reuse |
| `POST /api/mkt/ai/generate` | `{ prompt, model? }` | SSE `text/event-stream` (`{text}` / `[DONE]` / `{error}`) | Gemini text — `GEMINI_API_KEY` | **EXISTS** (`ai.controller.ts:31`) — used by base/blog gen |
| `POST /api/mkt/storage/presign` | `{ projectId, category, fileName, contentType }` | `{ success, data:{ uploadUrl, publicUrl, key } }` | R2 (S3 presign) | **EXISTS** (`storage.controller.ts:28`) |
| `GET /api/mkt/storage/proxy?url=` | query `url` | streamed bytes | R2 | **EXISTS** (`storage.controller.ts:68`) — used by translation overlay |
| **`POST /api/mkt/naver/keywords`** | `{ keywords: string[] }` | `{ keywords: Array<{ keyword, pcSearchVolume, mobileSearchVolume, totalSearchVolume, competition: 'HIGH'\|'MEDIUM'\|'LOW', pcClickCount, mobileClickCount, pcCtr, mobileCtr }> }` | **Naver SearchAd** `/keywordstool`, **HMAC‑SHA256** signed (`X-Timestamp`, `X-API-KEY`, `X-Customer`, `X-Signature`) | **NEW** — implement in `services/mkt/external/naver-searchad.ts` (`searchKeywords`, currently throws 501 at `:29`); env `NAVER_AD_API_KEY` / **`NAVER_AD_SECRET_KEY`** / `NAVER_AD_CUSTOMER_ID` — **already wired** in `config.naverAd.{apiKey,secretKey,customerId}` (`config/index.ts:32-35`) and present in `.env.example:30-32` |
| **`POST /api/mkt/google/keywords`** | `{ keywords: string[], locationCode?, languageCode? }` | `{ keywords: Array<{ keyword, searchVolume, competition, cpc }> }` (panels read string list + optional `googleVolume`) | **DataForSEO** `/v3/keywords_data/google/search_volume/live`, **HTTP Basic** auth | **NEW** — implement in `services/mkt/external/dataforseo.ts` (`getKeywordVolumes`, declared `:40`, currently throws 501 at `:45`); env `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` — **already wired** in `config.dataforseo.{login,password}` (`config/index.ts:66-68`) and present in `.env.example:49-50` |

**Controller (DECIDED — O‑6, §15)**: add `controllers/mkt/keywords.controller.ts` with `naverKeywords` + `googleKeywords` (asyncHandler, validate `keywords[]` non‑empty → `AppError(400)`, call the service, then **`res.json({ success: true, data: { keywords } })`** — Tangobook's standard envelope, with ContentFlow's payload shape (`{ keywords: [...] }`) preserved **inside** `data`. The **client api layer unwraps `.data`**: a thin `api/use-keywords.ts` fetch wrapper does `const json = await res.json(); if (!json.success) throw …; return json.data;`, and the ported panels (`NaverKeywordPanel`, `InternalBlogPanel`) consume the inner `keywords` array exactly as CF did (which read `data.keywords`). Net: server follows Tangobook convention, component code stays close to ContentFlow.)

**HMAC signing (Naver)**: signature = `Base64(HMAC‑SHA256(config.naverAd.secretKey, `${timestamp}.${method}.${uri}`))`. Implement server‑side only (never expose secret). Wrap upstream calls so a non‑2xx → `AppError(502, 'Naver 키워드 조회 실패')`.

**Env (already present — verify only, do not re‑add)**: do **not** hardcode (CLAUDE.md). `config.naverAd` (`config/index.ts:32-35`) and `config.dataforseo` (`:66-68`) **already exist** and read from `process.env`; `.env.example` already lists `NAVER_AD_API_KEY` / `NAVER_AD_SECRET_KEY` / `NAVER_AD_CUSTOMER_ID` (`:30-32`) and `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` (`:49-50`). Phase 1a only **consumes** these; no config additions needed.

---

## 15. Resolved Decisions

> All questions below are **decided** (no longer open). Guiding principle: **port ContentFlow behavior faithfully; adapt only to Tangobook stack conventions** (TanStack Query for server data, Zustand for UI only, Express routes→controllers→services, `{ success, data }` responses, R2 keys with `Date.now()` immutability, `user_id` single‑owner RLS). The decision IDs (O‑1…O‑8) are referenced elsewhere in this spec — keep these IDs stable.

- **O‑1 — N‑blog vs internal‑blog partition → DECIDED: LOOSE separation (faithful port).** Both channels share the `mkt_blog_contents`/`mkt_blog_cards` tables **and** the single `'blog'` channel‑model key. They are distinguished **at the panel level** (`BlogPanel` vs `InternalBlogPanel`), exactly as ContentFlow does — **not** by strict `channel`‑column filtering. The `channel` column is retained for **labeling and publish only** (write `channel = 'naver_blog'` / `'self_hosted'` on insert so future publish/translation can read it), but panels do **not** hard‑filter their lists by it. (This reverses the earlier "strict partition" lean; §4.2 has been updated to match.) No back‑fill needed (no existing rows). Rationale: matches CF's actual `getBlogContents(...)` loose read and keeps the ported panel code minimally changed.
- **O‑2 — Golden keywords / AI auto‑pick → DECIDED: OUT of 1a (Ideas = Phase 2).** The N‑blog golden‑keyword pool + AI auto‑pick (`blog-panel.tsx:451-545`) depend on the Ideas module (`savedKeywords`, `getStrategy`, `imported_strategy`). Strip them cleanly; keep **manual primary/secondary keyword entry + `NaverKeywordPanel` search**. Faithful to scope: the underlying `mkt_projects.saved_keywords` column already exists (migration `:62`) but is unused in 1a.
- **O‑3 — Internal‑blog SEO → DECIDED: Google‑SEO ad‑hoc checklist, NOT the Naver `seo-scorer`.** Faithful to ContentFlow: the internal‑blog panel uses a **Google‑SEO checklist** (FAQ / GEO / Schema / internal‑link / `url_slug`) rendered under the "🔍 Google SEO 검사" header (CF `internal-blog-panel.tsx:755-797` — boolean checks like `url_slug.length > 0`, FAQ present, Schema note), **not** a numeric Naver score. The ported `lib/seo-scorer.ts` (`calculateNaverSeoScore`) + `SeoScoreDisplay` + the **SEO auto‑retry loop are N‑blog ONLY**. A dedicated numeric Google/GEO scorer is a later enhancement (not 1a). *(This supersedes the earlier note in §6.6/§9 that internal‑blog "reuses the Naver scorer" — see those sections, now corrected.)*
- **O‑4 — Marketing language source → DECIDED: `project.target_languages` (faithful port).** The per‑content language tabs derive from the **marketing project's own** `target_languages` array (set in Phase 0 `TargetLanguagesSection`; column `mkt_projects.target_languages text[] not null default '{}'`, migration `:51`), with **ko pinned first**. Do **NOT** couple to the storybook‑side `@tangobook/shared` `SUPPORTED_LANGUAGES`. Marketing content languages are an independent axis from storybook languages. (The shared list MAY be consulted only for display labels/flags if convenient, but is not the source of truth and is not required.)
- **O‑5 — `LanguageSelector` visibility rule → DECIDED: faithful port.** Render language tabs only when `project.target_languages.length >= 2`; ko is always present and first; the `blog` (N‑blog) tab is hidden for non‑ko (Korean‑only channel) with auto‑switch to base‑article (CF `content-tabs.tsx:50-53`). The "AI 번역" trigger (`onTranslate`) is a **stub** in 1a (alert) — translation generation is Phase 1b. (See §11.)
- **O‑6 — Keyword endpoint response envelope → DECIDED: Tangobook `{ success, data }` envelope; CF payload shape preserved inside `data`.** Server returns `res.json({ success: true, data: { keywords: [...] } })`. The **client api layer unwraps `.data`** and passes the inner `{ keywords }` shape to the ported panels, so panel/component code stays close to ContentFlow (which read `data.keywords`). Concretely: `NaverKeywordPanel`/`InternalBlogPanel` call a thin `api/use-keywords.ts` fetch wrapper that does `const { data } = await res.json(); return data;` (or throws on `!success`), then components consume `keywords`. Faithful to Tangobook's response convention while keeping CF's payload contract.
- **O‑7 — `image-editor-dialog` → DECIDED: deferred to 1b.** ContentFlow's crop/filter canvas (`image-editor-dialog.tsx`, ~28 KB) is OUT of 1a. In `BlogCardItem`/`ImageCardWidget`, pass `onEdit={undefined}` so the edit button hides. (Listed in §2.2 Non‑Goals.)
- **O‑8 — TipTap body styling → DECIDED: port CF's `.tiptap { … }` CSS into the marketing scoped stylesheet; do NOT depend on `@tailwindcss/typography`.** Verified: `@tailwindcss/typography` is **not installed** in `packages/client` (absent from `packages/client/tailwind.config.ts` and `package.json`), so `prose` classes would render unstyled. The marketing scoped styles live in **`packages/client/src/features/marketing/theme/marketing-tokens.css`** (all rules scoped under `.marketing-scope`, Phase 0). **Action**: copy ContentFlow's `.tiptap` ruleset (`src/app/globals.css:132-199` — `.tiptap`, `.tiptap h1/h2/h3/p/strong/em/ul/ol/li/blockquote/img/hr`, and the `p.is-editor-empty:first-child::before` placeholder rule) into `marketing-tokens.css`, **prefixing each selector with `.marketing-scope`** (e.g. `.marketing-scope .tiptap h2 { … }`) so it stays scope‑isolated. Remove all `prose`/`@tailwindcss/typography` references from the ported editor components. The `GlobalCardStyle` `<style>` block (§6.7) still overrides h/p inside `.blog-card-editor .tiptap` with `!important` on top of these base rules. *(This also resolves the channel‑model‑persistence question that was previously filed here: per‑channel model settings persist in `mkt_projects.ai_model_settings` JSONB — see §5.5 — not a dedicated table; JSONB matches Phase 0 and CF's `getChannelModels`.)*

---

## 16. Implementation Order (sequenced checklist → ready for a plan)

> Each numbered group is independently testable. Pure logic gets unit tests (§ "Testing"); UI is manually verified in `/marketing/content`.

**Step 0 — Deps & PREREQUISITE port gaps (unblock everything)**

> These are the items Phase 0 did **not** port (verified by grepping the worktree). `countWords` is the exception — it **was** already ported (`lib/utils.ts:13`, tested in `lib/__tests__/utils.test.ts:39`), so it is NOT a gap; do not re‑add it.

1. Add TipTap deps (`@tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-placeholder @tiptap/pm`, pinned `^3.20.1`) via `pnpm --filter client add`.
1b. **Fix the Phase 0 `uploadToR2` envelope bug (R‑11)** — read `(await presignRes.json()).data` in `api/use-r2-upload.ts:53`; update the `use-r2-upload.test.ts` fixture to the enveloped shape. (Blocks all image upload/gen.)
2. **Image pipeline helpers (MISSING — port now):** add `lib/image-utils.ts` exporting **`convertToWebpBlob(base64, srcMime)`** and **`base64ToBlob(input, mimeType?)`** — ported from ContentFlow `src/hooks/use-r2-upload.ts:24` and `:52` respectively (Canvas‑based; `base64ToBlob` is pure/unit‑testable). **Unit‑test `base64ToBlob`** (valid data‑URL / raw+mime / malformed→throws). `convertToWebpBlob` is Canvas‑bound → smoke/mocked. *(NOTE: `countWords` already exists in `lib/utils.ts:13` — DO NOT re‑add.)*
3. **Small shared UI components (MISSING — port now), with CF sources:**
   - **`ImageStyleSelector`** (+ re‑export `ASPECT_RATIO_PRESETS`) ← CF `src/components/content/image-style-selector.tsx` (exports both, `:52` / `:116`). Required by `ChannelModelSelector`, `BlogCardItem`.
   - **`ImageLightbox`** ← CF `src/components/content/image-lightbox.tsx`. Required by `ImageCardWidget`.
   - **`ErrorBoundary` — DECIDED: port a minimal one to `features/marketing/components/ErrorBoundary.tsx`.** The Tangobook root `ErrorBoundary` (`packages/client/src/design-system/primitives/ErrorBoundary.tsx`) takes only `{ children, fallbackMessage }` and does **NOT** support `resetKeys`, which `ChannelContentList` needs (resetKeys=[id]). Port CF's `src/components/error-boundary.tsx` (supports `resetKeys`) instead of reusing the root one. (Updates R‑6.)
   - **`GenerationButton`** ← CF `generation-button.tsx`; **`WorkflowStepBar`** ← CF `workflow-step-bar.tsx`. (R‑1: verify every imported lucide icon resolves at `lucide-react@^1.17.0` — see R‑1.)

**Step 1 — Data hooks (no UI)**
4. `api/use-base-article.ts` (`useUpsertBaseArticle`); extend `use-contents.ts` with `useUpdateContent`.
5. `api/use-blog-contents.ts`: `useCreateBlogContent`, `useUpdateBlogContent`, `useDeleteBlogContent`, `useSetBlogCards`, `useAddBlogCard`, `useUpdateBlogCard`, `useDeleteBlogCard`, `useReorderBlogCards`. (Port `setBlogCardsForContent` delete‑all+bulk‑insert exactly.)
6. `api/use-channel-models.ts` (read from `useProject`, write via `useUpdateProject` + `useDebouncedSave`).
7. (Optional) recommended indexes migration `supabase/migrations/2026-06-07-marketing-phase1a-indexes.sql` (base_articles unique on content_id; blog_cards (blog_content_id, sort_order)). **Verify they don't already exist.**

**Step 2 — AI/image hooks**
8. `hooks/use-ai-generation.ts` (SSE over `parseSSEStream`, → `/api/mkt/ai/generate`).
9. `hooks/use-image-generation.ts` (→ `/api/mkt/ai/generate-image`, returns `{base64,mimeType}`) + `hooks/use-card-image-generation.ts` (gen→webp→R2→save, batch).
10. `hooks/use-auto-save.ts` (2 s base‑article autosave).

**Step 3 — Base article (first visible win)**
11. `editor/EditorToolbar.tsx` + `editor/BaseArticleEditor.tsx` (TipTap; drop `immediatelyRender`; `/api/mkt` presign).
12. `PromptEditDialog.tsx`, `TopicSuggestionDialog.tsx`.
13. `BaseArticlePanel.tsx` (generate, topic, partial regen, 2 s autosave, 원장님 컨펌, read‑only translation overlay).
14. `ContentTabs.tsx` (7 tabs; only base‑article active; others placeholder) + `LanguageSelector.tsx` (ko pinned, stub translate) + edit `ContentPage.tsx` to mount it. **Manual test: create content → write/generate base article → autosave → confirm toggle.**

**Step 4 — N‑blog**
15. `api/use-keywords.ts` (client fetch wrapper, unwraps `.data` — O‑6), `ChannelContentList.tsx`, `ChannelModelSelector.tsx`, `NaverKeywordPanel.tsx`, `SeoScoreDisplay.tsx`, `ImageCardWidget.tsx`, `BlogCardItem.tsx` (+ export `formatForMobile`, `AddCardButton`). (The keyword panel degrades gracefully until the Step‑6 endpoints exist.)
16. `BlogPanel.tsx` (4‑step workflow, SEO auto‑retry loop, per‑card+batch image, GlobalCardStyle, PC/mobile, mobile‑format) — wire into ContentTabs `blog` tab. **Unit‑test `formatForMobile`. Manual: keyword→structure→generate→SEO retry→images.**
17. `BlogPreviewDialog.tsx` (preview only).

**Step 5 — Internal blog**
18. `InternalBlogPanel.tsx` (Google‑SEO suffix, `url_slug`, FAQ/GEO, `/api/mkt/google/keywords`, schedule button **stubbed**) — wire into ContentTabs `self_hosted` tab.

**Step 6 — Express keyword endpoints**
19. Implement `services/mkt/external/naver-searchad.ts` (HMAC + `/keywordstool`) and `dataforseo.ts` (Basic auth search_volume); add `controllers/mkt/keywords.controller.ts`; mount `naver/keywords` + `google/keywords` in `mkt.routes.ts`; add `config.naverAd`/`config.dataforseo` + `.env.example`. **Unit‑test the HMAC signature builder + the response mappers. Manual (with creds): keyword search in both panels; graceful 502 without creds.**

**Step 7 — Verification**
20. `pnpm typecheck`, `pnpm --filter client test` (new unit tests green), `pnpm lint`. Manual end‑to‑end on `/marketing/content` for all three channels. RLS sanity (a second user cannot read another's rows).

---

## 17. Testing Strategy

**Unit tests (pure logic — colocated `__tests__/`, Vitest, matching Phase 0 style):**
- `lib/image-utils.ts` (NEW) → `base64ToBlob` (valid data‑URL, raw+mime, malformed → throws). `convertToWebpBlob` is Canvas‑bound → smoke/mocked only.
- `lib/utils.ts` → `countWords` is **already covered** by Phase 0 (`lib/__tests__/utils.test.ts:39`); no new test needed (extend only if 1a adds new util helpers there).
- `components/content/BlogCardItem` → `formatForMobile` (long `<p>` split at sentence boundaries, `<p>` margin injection, idempotence). Needs jsdom (Phase 0 tests already use it).
- `lib/seo-scorer.ts` → already has Phase 0 tests (`lib/__tests__/seo-scorer.test.ts`); add cases asserting `buildSeoFeedback`‑style filtering if `buildSeoFeedback` is extracted into `lib/` (recommended, so it's testable apart from the panel).
- Server `naver-searchad` → HMAC signature determinism (fixed timestamp/secret → known signature); response mapper (`keywordstool` → `NaverKeywordStat`). `dataforseo` → response mapper (search_volume → `KeywordVolume`). Mock `fetch`/`axios`.
- Data hooks: optionally test `useSetBlogCards` ordering and `useUpsertBaseArticle` insert‑vs‑update branch with a mocked supabase client, following Phase 0's `api/__tests__/use-projects.test.tsx` pattern (QueryClient wrapper). At minimum cover the upsert branch + the delete‑all‑then‑insert sequence.

**Manual (UI / integration):**
- Base article: generate via SSE (streaming visible), topic dialog, bubble‑menu partial regen, drag/paste image → R2, 2 s autosave (TopBar indicator), 원장님 컨펌 toggle persists.
- N‑blog: full 4‑step flow; SEO score updates live; auto‑retry visibly re‑generates when score < 90 and stops at `maxRetries`; per‑card + batch image gen with progress; PC/mobile toggle; mobile‑format; GlobalCardStyle changes apply.
- Internal blog: Google‑SEO generation, `url_slug` persists, FAQ present, schedule button shows the Phase‑3 stub.
- Language tabs: ko pinned; switching to non‑ko hides the N‑blog tab; base‑article shows "번역되지 않음".
- Keyword panels (with creds): Naver + Google searches populate tables; without creds, graceful error + manual entry still works.
- RLS: second account cannot see the first's articles/blogs/cards.

---

## 18. Conventions Checklist (must match Phase 0 / Tangobook)

- TanStack Query = server data; Zustand (`ui-store`) = UI state only. **No server data in Zustand.**
- Files: PascalCase components, camelCase hooks/utils; named exports for components, default for pages.
- UI primitives imported from `../../ui` (NOT `@/components/ui`); `cn` from `../../lib/utils`; types from `../../types/database` / `../../types/cards`.
- Server: `asyncHandler` + `AppError(status,msg)`; responses `res.json({ success:true, data })`; reuse `gemini.provider` / `r2.provider` singletons.
- Mutations set `user_id` (RLS), `created_at`/`updated_at`, cast payload `as Record<string,unknown>`, throw on `error`, invalidate `mktKeys.content(contentId)`.
- R2 keys via the existing `buildMktKey` (`mkt/{projectId}/{category}/{ts}-{rand}{ext}`, `storage.controller.ts:14`) — Date.now() makes them immutable‑cacheable (matches Tangobook R2 policy).
- No hardcoded credentials; new env in `config/index.ts` + `.env.example`.
- Drop `'use client'`; drop `immediatelyRender:false`; fix `/api/storage`→`/api/mkt/storage` + `presignedUrl`→`uploadUrl`.
