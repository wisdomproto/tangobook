# Marketing Phase 1b — 카드뉴스 (Instagram) + 스레드 (Threads) (Design Spec)

| | |
|---|---|
| **Date** | 2026‑06‑07 |
| **Branch / worktree** | `feat/marketing-phase0` @ `C:\projects\tangobook\.worktrees\marketing-phase0` |
| **Status** | Spec (no implementation) |
| **Predecessor** | Phase 0 Foundation (COMPLETE) · Phase 1a Base‑Article/Blog (COMPLETE) — `docs/superpowers/specs/2026-06-07-marketing-phase1a-base-article-blog-design.md` |
| **Source app** | ContentFlow (Next.js) `C:\projects\contentflow\contentflow` |
| **Roadmap slot** | Second slice of master‑plan **Phase 1 콘텐츠 생성**. This spec = **Phase 1b**. youtube/shorts = **1c**; 8‑language translation axis + `image-editor-dialog` = **1d**. |

---

## 1. Overview

Phase 0 created the marketing shell + the full `mkt_*` Supabase schema (**all 17 tables, incl. instagram/threads/card‑template tables**) + the TanStack data layer + `/api/mkt` Express base (SSE generate, R2 presign/proxy, image‑gen). Phase 1a filled the content‑page right pane with `ContentTabs` (7 tabs) and the **base‑article / N‑blog / 내부‑blog** panels, and — crucially for 1b — already ported the **entire image pipeline** (`lib/image-utils.ts`, `hooks/use-image-generation.ts`, `hooks/use-card-image-generation.ts`, `api/use-r2-upload.ts` with the envelope fix), the **cardnews + threads prompt builders** (`lib/prompt-builder.ts`), the **cardnews/threads HTML builders** (`lib/channel-translator.ts`), `types/cards.ts` (`CardCanvasData`/`TextBlock`/`GlobalCardStyle`), and the shared content components (`ImageCardWidget`, `ImageStyleSelector` + `ASPECT_RATIO_PRESETS`, `ImageLightbox`, `ChannelContentList`, `ChannelModelSelector`, `GenerationButton`, `PromptEditDialog`).

In `ContentTabs` today (`packages/client/src/features/marketing/components/content/ContentTabs.tsx:18,19,133-138`) the **`cardnews`** and **`threads`** tabs render `<ComingSoonPanel>` placeholders. Phase 1b replaces those two placeholders with real panels:

1. **카드뉴스 (Instagram carousel)** — a templates sidebar + a 2‑column slide grid; each slide is a 4:5 **Canvas editor** (`CardNewsCardItem`) with a full‑width image (vertical `imageY` drag) + absolutely‑positioned, draggable/resizable `TextBlock`s; AI text generation (`buildCardNewsImagePromptsPrompt` → caption / hashtags / 4‑zone slides); **batch image generation** via a module‑level Zustand job store (survives tab switches); and a **Canvas → WebP download** (1080×1350, per‑block manual word‑wrap).
2. **스레드 (Threads)** — a vertical list of post cards (auto‑resize textarea, 500‑char counter, connector line); AI generation (`buildThreadsPrompt` → `posts[]`); per‑post image; **전체 복사** with `[n/total]` separators; and a phone‑style preview dialog.

This is a **faithful port**: behavior matches ContentFlow; only the stack adapts (Next.js → Vite, `useProjectStore` Zustand → Phase 0/1a TanStack hooks, `/api/*` → `/api/mkt/*`, `presignedUrl` → `uploadUrl`).

---

## 2. Goals & Non‑Goals

### 2.1 Goals (Phase 1b scope = cardnews + threads ONLY)

- Replace the `cardnews` + `threads` `ComingSoonPanel` placeholders in `ContentTabs` with `CardNewsPanel` and `ThreadsPanel`.
- New **data hooks** in the Phase 0/1a TanStack pattern: instagram contents (1:N) + instagram cards (N), threads contents (1:N) + threads cards (N); plus the cardnews **per‑card update** + **`setCards`** (delete‑all+bulk‑insert) patterns; plus **card‑template** hooks (`mkt_card_templates` + `mkt_card_hidden_builtins`).
- Port the **module‑level batch‑image Zustand store** (`stores/batch-image-store.ts`) — re‑bridged from `useProjectStore` to a TanStack mutation + `/api/mkt/ai/generate-image`.
- **CardNewsPanel** + **CardNewsCardItem** (+ `cardnews-templates` 8 built‑ins) + **ThreadsPanel** + **ThreadsCardItem** + **ThreadsPreviewDialog**.
- Canvas WebP export (`renderCardToBlob`, 1080×1350, `crossOrigin='anonymous'`, `toBlob('image/webp',0.85)`) — **with the R2‑CORS prerequisite resolved** (§8).
- Reuse the already‑ported image pipeline (`use-card-image-generation` + `image-utils`) and shared UI (`ImageStyleSelector`, `ImageLightbox`, `ChannelModelSelector`, `ChannelContentList`, `GenerationButton`, `PromptEditDialog`).
- `channel`/language behavior follows Phase 1a: cardnews+threads stay visible for non‑ko (translation **rendering** is 1d), per‑content language tabs derive from `project.target_languages`.

### 2.2 Non‑Goals (explicitly deferred)

| Deferred | Phase |
|---|---|
| **youtube (롱폼) + shorts (숏폼)** channels | 1c |
| **8‑language translation generation** (`translateAndSaveChannel` SSE wiring, `ChannelTranslationView`, "AI 번역" button) | 1d |
| `image-editor-dialog` (crop/filter canvas) | 1d (optional) |
| Publish queue (`addToPublishQueue`, `mkt_publish_records`), schedule/cron | 3 |
| Ideas / golden‑keyword pool / strategy import | 2 |

The **`onAddToQueue`/`publishChannels`** props that ContentFlow passes to `ChannelContentList` from `cardnews-panel.tsx:959-970` and `threads-panel.tsx:255-265` are **OMITTED in 1b** (the ported `ChannelContentList`, `…/components/content/ChannelContentList.tsx:8-18`, has no such props — publish = Phase 3). The CF `ChannelTranslationView` mounted at the top of each panel (`cardnews-panel.tsx:551`, `threads-panel.tsx:137`) is **NOT ported in 1b** (translation = 1d).

---

## 3. Architecture — how it sits on Phase 0/1a

The read path is **already wired**: `api/queries.ts:fetchContentGraph` (`…/marketing/api/queries.ts:61-164`) already fetches `instagramContents` (+ cards) and `threadsContents` (+ cards) in parallel and returns them on the `ContentGraph`. So panels read the graph once via `useContent(selectedContentId)` and pass slices down — exactly as `BlogPanel` does (`…/components/content/BlogPanel.tsx:22, 64`). Phase 1b adds only the **write** hooks + the panel UIs + the batch store.

```
features/marketing/
  api/                          [Phase 0/1a + NEW]
    queries.ts                  [Phase 0] fetchContentGraph already returns instagram/threads (+cards) — REUSE
    use-instagram-contents.ts   NEW  (1:N + cards; mirrors api/use-blog-contents.ts)
    use-threads-contents.ts     NEW  (1:N + cards; mirrors api/use-blog-contents.ts)
    use-card-templates.ts       NEW  (mkt_card_templates CRUD + mkt_card_hidden_builtins)
    use-channel-models.ts       [Phase 1a] REUSE — add channels 'cardnews' + 'threads'
    use-contents.ts             [Phase 1a] useUpdateContent EXISTS — REUSE if needed
    use-r2-upload.ts            [Phase 1a] uploadToR2 (envelope-fixed) — REUSE
  hooks/                        [Phase 1a — all ported, REUSE]
    use-ai-generation.ts        SSE wrapper → /api/mkt/ai/generate
    use-image-generation.ts     → /api/mkt/ai/generate-image, returns { base64, mimeType }
    use-card-image-generation.ts  gen→webp→R2→save (cardId-based API — see §6.2/§7)
  lib/                          [Phase 0/1a — all ported, REUSE]
    prompt-builder.ts           buildCardNewsImagePromptsPrompt / buildCardNewsPrompt / buildThreadsPrompt
    channel-translator.ts       buildCardnewsHtml / buildThreadsHtml (used by preview/copy only)
    image-utils.ts              convertToWebpBlob / base64ToBlob
    utils.ts                    generateId / cn
  types/
    cards.ts                    [Phase 0] CardCanvasData / TextBlock / GlobalCardStyle + getBlogCardContent — REUSE
    database.ts                 [Phase 0] InstagramContent / InstagramCard / ThreadsContent / ThreadsCard / CardTemplateRow — REUSE
  store/                        [Phase 0 + NEW]
    ui-store.ts                 [Phase 0] selectedProjectId/ContentId/Language — REUSE
    save-status-store.ts        [Phase 0] REUSE
    batch-image-store.ts        NEW  (port of CF stores/batch-image-store.ts — Zustand job state; §5.5)
  components/content/           [Phase 1a + NEW]
    ContentTabs.tsx             EDIT — replace cardnews + threads ComingSoonPanel with real panels
    CardNewsPanel.tsx           NEW  ← cardnews-panel.tsx
    CardNewsCardItem.tsx        NEW  ← cardnews-card-item.tsx (Canvas + pointer drag/resize)
    cardnews-templates.ts       NEW  ← cardnews-templates.ts (8 built-ins; camelCase file kept as-is — it's data, not a component)
    ThreadsPanel.tsx            NEW  ← threads-panel.tsx
    ThreadsCardItem.tsx         NEW  ← threads-card-item.tsx
    ThreadsPreviewDialog.tsx    NEW  ← threads-preview-dialog.tsx
    ChannelModelSelector.tsx    [Phase 1a] REUSE
    ChannelContentList.tsx      [Phase 1a] REUSE (generic <T>)
    GenerationButton.tsx        [Phase 1a] REUSE
    PromptEditDialog.tsx        [Phase 1a] REUSE
    ImageStyleSelector.tsx      [Phase 1a] REUSE (exports ASPECT_RATIO_PRESETS)
    ImageLightbox.tsx           [Phase 1a] REUSE (used by ThreadsCardItem)
    ImageCardWidget.tsx         [Phase 1a] REUSE (optional for threads media slot — see §6.4)
```

**No server work is required for 1b** — `/api/mkt/ai/generate`, `/api/mkt/ai/generate-image`, `/api/mkt/storage/presign`, `/api/mkt/storage/proxy` all exist from Phase 0/1a. The only server‑adjacent item is the **R2 bucket CORS policy** (a config change, not code — §8).

### 3.1 Critical state‑management deviation (must follow, same as 1a)

ContentFlow keeps **all** project/content/instagram/threads/template state in one Zustand store (`src/stores/project-store.ts`, ~1,900 lines) and the panels read `useProjectStore()`. Phase 0/1a already rejected this: **server data = TanStack Query**, **UI‑only state = `store/ui-store.ts`** (CLAUDE.md "프론트 상태" rule — **Zustand 에 서버 데이터 금지**). Every CF store call below must be re‑expressed as a hook from `api/`.

| ContentFlow `useProjectStore()` (`project-store.ts`) | Phase 1b equivalent |
|---|---|
| `getInstagramContents(contentId)` | `useContent(contentId).data?.instagramContents` (read) |
| `addInstagramContent(contentId)` (returns id) | `useCreateInstagramContent()` → `Promise<string>` |
| `updateInstagramContent(id, updates)` | `useUpdateInstagramContent()` |
| `deleteInstagramContent(id)` | `useDeleteInstagramContent()` |
| `getInstagramCards(igContentId)` | from `useContent(...).data.instagramContents[i].cards` |
| `setInstagramCardsForContent(igId, cards)` (delete‑all+insert) | `useSetInstagramCards()` |
| `addInstagramCard(igId, sort)` | `useAddInstagramCard()` |
| `updateInstagramCard(cardId, updates)` | `useUpdateInstagramCard()` |
| `deleteInstagramCard(cardId)` | `useDeleteInstagramCard()` |
| `getThreadsContents/Cards`, `add/update/deleteThreadsContent`, `setThreadsCardsForContent`, `add/update/deleteThreadsCard` | `use-threads-contents.ts` mirror (§5.4) |
| `cardTemplates`, `hiddenBuiltins`, `createCardTemplate`, `updateCardTemplate`, `deleteCardTemplate`, `hideBuiltinTemplate` | `use-card-templates.ts` (§5.6) |
| `getChannelModels(projectId,'cardnews'\|'threads')`, `setChannelModels(...)` | `useChannelModels(projectId, channel)` (Phase 1a, `…/api/use-channel-models.ts:27`) |
| `getBlogContents/getBlogCards` (cardnews reads blog sections for the prompt) | from `useContent(...).data.blogContents[i].cards` |
| `getBaseArticle(contentId)` | `useContent(contentId).data?.baseArticle` |
| `addToPublishQueue(...)` | **OMIT** (Phase 3) |

> The cardnews batch image generation is the **one** exception that legitimately uses a module‑level Zustand store (`batch-image-store.ts`) — but it stores **job/progress state**, not the server cache, and persists results via a TanStack mutation passed in at call time (§5.5). This does **not** violate the rule.

---

## 4. Data Model

**All four tables already exist — verified against BOTH the Phase 0 migration file AND the live database** (`mcp__supabase__list_tables`, project `fxzwigjkbsptvsjraqwa`, 2026‑06‑07). **Phase 1b adds NO DDL.** The two card‑template tables (`mkt_card_templates`, `mkt_card_hidden_builtins`) also exist. RLS is enabled + single‑owner `for all (user_id = auth.uid())` on every table (migration `…/supabase/migrations/2026-06-07-marketing-schema.sql:417-420,436-439,425-426,444-445`).

These mirror the TS interfaces in `…/marketing/types/database.ts` (`InstagramContent` :275‑288, `InstagramCard` :290‑302, `CardTemplateRow` :305‑315, `ThreadsContent` :317‑327, `ThreadsCard` :329‑338).

### 4.1 `mkt_instagram_contents` (1:N per content) — EXISTS

```sql
mkt_instagram_contents (
  id uuid pk default gen_random_uuid(),
  user_id uuid not null → auth.users(id) on delete cascade,     -- [single-owner RLS]
  content_id uuid not null → mkt_contents(id) on delete cascade,
  title text,
  caption text,
  hashtags text[],
  content_type text not null default 'carousel' check (content_type in ('carousel','video','single')),
  video_settings jsonb,
  status text not null default 'draft' check (status in ('draft','in_progress','published')),
  published_url text, published_at timestamptz,
  created_at, updated_at timestamptz not null default now()
)
```
- **[drift] vs CF `001`**: none — CF `001_initial_schema.sql` already had this shape. 1b uses `caption` + `hashtags` (set by AI gen + the caption/hashtag editor). `content_type` stays `'carousel'` in 1b; `video_settings` unused.

### 4.2 `mkt_instagram_cards` (N per instagram content) — EXISTS

```sql
mkt_instagram_cards (
  id uuid pk default gen_random_uuid(),
  user_id uuid not null → auth.users(id) on delete cascade,
  instagram_content_id uuid not null → mkt_instagram_contents(id) on delete cascade,
  text_content text,                  -- newline-joined block texts (sync mirror)
  background_color text,              -- canvasData.bgColor mirror
  background_image_url text,          -- canvasData.imageUrl mirror
  text_style jsonb,                   -- THE canvas: CardCanvasData (bgColor,imageUrl,imageY,textBlocks[])
  image_prompt text,                  -- [drift] — read/written directly by CardNewsCardItem
  reference_image_url text,           -- [drift] — present but unused by 1b card item
  sort_order int not null default 0,
  created_at, updated_at
)
```
- **The canvas lives in `text_style` jsonb** as `CardCanvasData` (`types/cards.ts:59-66`). `parseCanvasData(text_style, background_image_url)` (port of `cardnews-card-item.tsx:41-68`) migrates the legacy flat shape → the 4‑block `{header,title,body,footer}` form. `background_color`/`background_image_url`/`text_content` are **sync mirrors** kept in step on every save (`cardnews-card-item.tsx:443-457`).
- **[drift] columns** `image_prompt`, `reference_image_url`: present in `database.ts:297-298` (marked `?`/nullable) AND in the live table. `image_prompt` **is used** — the card‑item "이미지 프롬프트" textarea reads/writes `card.image_prompt` directly (`cardnews-card-item.tsx:567-568`). `reference_image_url` exists but is not written by the ported card item (CF stores its panel‑level reference image in component state, not the card row).

### 4.3 `mkt_card_templates` (custom per‑project) + `mkt_card_hidden_builtins` — BOTH EXIST

```sql
mkt_card_templates (
  id uuid pk, user_id uuid not null → auth.users, project_id uuid not null → mkt_projects(id) on delete cascade,
  name text not null,
  bg_color text not null default '#ffffff',
  image_y numeric not null default 50,
  text_blocks jsonb not null default '[]',     -- Omit<TextBlock,'text'>[]
  preview jsonb not null default '{}',         -- { bg, textColor }
  created_at, updated_at
)
mkt_card_hidden_builtins (
  id uuid pk, user_id uuid not null → auth.users, project_id uuid not null → mkt_projects(id) on delete cascade,
  builtin_id text not null,
  hidden_at timestamptz not null default now(),
  unique (project_id, builtin_id)
)
```
- `mkt_card_templates` ↔ `CardTemplateRow` (`database.ts:305-315`). `text_blocks` is the template's blocks **without** `text` (template = layout only); `CardTemplate` (`cardnews-templates.ts:3-10`) is the camelCase view derived from the row (`cardnews-panel.tsx:78-85`).
- **Decision (O‑B):** the 8 built‑ins ship as a static `CARD_TEMPLATES` array in `cardnews-templates.ts` (port verbatim, `…/cardnews-templates.ts:12-113`). Custom templates live in `mkt_card_templates`; "hidden built‑ins" in `mkt_card_hidden_builtins`. The displayed list = `[...CARD_TEMPLATES, ...customRows].filter(t => !hiddenBuiltinIds.includes(t.id))` (`cardnews-panel.tsx:189`).
- **Decision (O‑C):** **DO NOT port the CF `localStorage → DB` template migration** (`cardnews-panel.tsx:153-187`). It migrates ContentFlow's old `localStorage` keys (`cf-saved-templates`/`cf-hidden-templates`) which never existed in Tangobook (fresh install, zero rows confirmed live). Drop that `useEffect` entirely.

### 4.4 `mkt_threads_contents` (1:N) — EXISTS

```sql
mkt_threads_contents (
  id, user_id → auth.users, content_id → mkt_contents(id) on delete cascade,
  title text,
  thread_type text not null default 'single' check (thread_type in ('single','multi')),
  status text not null default 'draft' check (...),
  published_url text, published_at timestamptz, created_at, updated_at
)
```
- No [drift]. `thread_type` stays at its default in 1b (the single/multi distinction is informational; CF doesn't branch on it in the panel).

### 4.5 `mkt_threads_cards` (N per threads content) — EXISTS

```sql
mkt_threads_cards (
  id, user_id → auth.users,
  threads_content_id uuid not null → mkt_threads_contents(id) on delete cascade,
  text_content text not null default '',
  media_url text,
  media_type text,
  sort_order int not null default 0,
  created_at, updated_at
)
```
- **⚠️ [drift / quirk] — there is NO `image_prompt` column on threads cards.** ContentFlow stores the per‑post image prompt **inside `media_type`** as a hack until generation: `threads-card-item.tsx:133` does `onUpdate(card.id, { media_type: imagePrompt })`, and the image hook reads `card.media_type` as the prompt (`threads-panel.tsx:89` → `getPrompt: (card) => card.media_type || '…'`), then on success overwrites `media_type:'image'` (`threads-panel.tsx:94`). **Port this behavior faithfully** (it's harmless: `media_type` holds the prompt string only between "이미지 첨부" and a successful generation, then becomes `'image'`). Document it so a future reader doesn't "fix" it. (A cleaner option — adding a `threads image_prompt` column — is explicitly **out of 1b scope**, no DDL.)

### 4.6 RLS / `user_id` on insert / indexes

- RLS already correct (single‑owner). **No new SECURITY DEFINER functions** in 1b → no `GRANT EXECUTE` needed (memory RULE n/a here).
- Every insert must set `user_id` from `supabase.auth.getUser()` — exactly as `api/use-blog-contents.ts:7-13,27` and the `BlogPanel` card‑build path (`BlogPanel.tsx:196`) do. **In particular, `setInstagramCards`/`setThreadsCards` bulk‑insert rows must carry `user_id`** (the cards built in `onComplete` of the AI gen must be stamped — CF's `project-store` injected it server‑side; here the client must, mirroring `BlogPanel.tsx:196-217`).
- Cascade deletes via FK (no manual child cleanup).
- **Optional, non‑blocking indexes** (verify absent first; Phase 1a's index migration `2026-06-07-marketing-phase1a-indexes.sql` did **not** add these): `create index if not exists mkt_instagram_cards_parent_sort on mkt_instagram_cards(instagram_content_id, sort_order);` and `… mkt_threads_cards_parent_sort on mkt_threads_cards(threads_content_id, sort_order);`. The graph fetch already `.order('sort_order')`s these (`queries.ts:111-124`), so the indexes are a pure perf nicety — **not required for correctness; add only if profiling warrants.**

---

## 5. Data Hooks (TanStack Query — match Phase 0/1a)

All read = the content graph (`useContent`). All writes live in `api/` as `useMutation` that: set `user_id`+`created_at/updated_at`, cast payload `as unknown as Record<string,unknown>` (or `[]`), throw on `error`, and `invalidateQueries({ queryKey: mktKeys.content(contentId) })` on success. Reuse `generateId()` (`lib/utils`) and the `getUserId()` helper pattern (`use-blog-contents.ts:7-13`). **No new query keys required** — `mktKeys.content(contentId)` refetches the whole graph (matches 1a's decision; add granular keys only if profiling shows the full refetch is heavy).

### 5.1 `api/use-instagram-contents.ts` — mirror `api/use-blog-contents.ts` exactly

```ts
useCreateInstagramContent(): UseMutationResult<string, Error,
  { contentId: string; data?: Partial<InstagramContent> }>;
//   ports addInstagramContent — INSERT { id, user_id, content_id, content_type:'carousel',
//   caption:null, hashtags:null, status:'draft', ... , ...data }; returns new id (ChannelContentList.onAdd → Promise<string>)
useUpdateInstagramContent(): UseMutationResult<void, Error,
  { id: string; contentId: string; updates: Partial<InstagramContent> }>;
useDeleteInstagramContent(): UseMutationResult<void, Error,
  { id: string; contentId: string }>;                          // FK cascade removes cards
```

### 5.2 Instagram cards (N) — same file

```ts
// delete-all-then-bulk-insert — ports setInstagramCardsForContent EXACTLY (like useSetBlogCards, use-blog-contents.ts:106)
useSetInstagramCards(): UseMutationResult<void, Error,
  { igContentId: string; contentId: string; cards: InstagramCard[] }>;
//   1) delete().eq('instagram_content_id', igContentId)
//   2) if cards.length: insert(cards as Record<string,unknown>[])   ← cards MUST already carry user_id (§4.6)
useAddInstagramCard(): UseMutationResult<string, Error,
  { igContentId: string; contentId: string; sortOrder: number }>; // inserts a blank card (text_style: defaultCanvasData())
useUpdateInstagramCard(): UseMutationResult<void, Error,
  { cardId: string; contentId: string; updates: Partial<InstagramCard> }>;
useDeleteInstagramCard(): UseMutationResult<void, Error,
  { cardId: string; contentId: string }>;
```
> **High‑frequency note:** `CardNewsCardItem` writes `updateInstagramCard` on every text‑block drag/resize/edit and on every template tweak (`cardnews-panel.tsx:609,624; cardnews-card-item.tsx:456`). The save itself is whole‑`text_style`‑object replacement (not a debounce‑coalesced field). To avoid hammering the DB + thrashing the query cache on pointer drags: keep **local component state** for the live canvas (the card item already derives `canvasData` from props and calls `onUpdate` — wrap the panel's `onUpdate` handler so block drags update local state immediately and **debounce the persistence** ~400–600 ms via `useDebouncedSave('mkt_instagram_cards', cardId)` (Phase 0 util) OR throttle to pointer‑up). **Decision (O‑D):** persist on **pointer‑up** for drag/resize (cheap, deterministic) and debounce (500 ms via `useDebouncedSave`) for text/number inputs. This matches the spirit of 1a's per‑section debounce (`BlogPanel`/`BlogCardItem` 300 ms local + `useDebouncedSave` 800 ms).

### 5.3 `api/use-threads-contents.ts` — mirror `api/use-blog-contents.ts`

```ts
useCreateThreadsContent(): UseMutationResult<string, Error,
  { contentId: string; data?: Partial<ThreadsContent> }>;      // thread_type:'single', status:'draft'
useUpdateThreadsContent(): UseMutationResult<void, Error,
  { id: string; contentId: string; updates: Partial<ThreadsContent> }>;
useDeleteThreadsContent(): UseMutationResult<void, Error,
  { id: string; contentId: string }>;
```

### 5.4 Threads cards (N) — same file

```ts
useSetThreadsCards(): UseMutationResult<void, Error,
  { threadsContentId: string; contentId: string; cards: ThreadsCard[] }>;  // delete-all+bulk-insert; cards carry user_id
useAddThreadsCard(): UseMutationResult<string, Error,
  { threadsContentId: string; contentId: string; sortOrder: number }>;     // blank card (text_content:'')
useUpdateThreadsCard(): UseMutationResult<void, Error,
  { cardId: string; contentId: string; updates: Partial<ThreadsCard> }>;   // debounce text edits (see ThreadsCardItem §6.3)
useDeleteThreadsCard(): UseMutationResult<void, Error,
  { cardId: string; contentId: string }>;
```

### 5.5 Batch‑image store — `store/batch-image-store.ts` (port of CF `stores/batch-image-store.ts`)

CF's batch store is a **module‑level Zustand** that runs a long‑lived sequential image‑gen loop keyed by `igContentId`, so an in‑flight batch **survives tab switches** (CF comment `cardnews-panel.tsx:25-27`). It is the right model — port it as Zustand, but re‑bridge the two CF couplings:

| CF (`batch-image-store.ts`) | Phase 1b port |
|---|---|
| `import { convertToWebpBlob, uploadToR2 } from '@/hooks/use-r2-upload'` (:2) | `import { convertToWebpBlob } from '../lib/image-utils'` + `import { uploadToR2 } from '../api/use-r2-upload'` |
| `fetch('/api/ai/generate-image', { … aspectRatio })` (:69) | `fetch('/api/mkt/ai/generate-image', …)`; response is `{ success, data:{ image } }` (base64) — read `json.data.image`, mime `'image/png'` (matches `use-image-generation.ts:24-27`) |
| `useProjectStore.getState().getInstagramCards(igContentId)` (:86-87) | **cannot read the TanStack cache imperatively from a plain store.** Pass the needed data **into `startJob`**: `{ cards: {id, sortOrder}[] }` (snapshot of slide ids by index) + an `onSaved(cardId, url)` callback (a `useUpdateInstagramCard().mutateAsync` closure) |
| `store.updateInstagramCard(card.id, { background_image_url })` (:107) | call the injected `onSaved(card.id, savedUrl)` |

Resulting store shape (UI/job state ONLY — allowed; not a server cache):
```ts
interface BatchJobProgress { current: number; total: number; currentSlideIndex: number; isRunning: boolean; }
interface BatchState {
  jobs: Record<string, BatchJobProgress>;
  controllers: Record<string, AbortController>;
  startJob(args: {
    igContentId: string;
    prompts: { prompt: string; aspectRatio: string; slideIndex: number }[];
    cardIdsByIndex: string[];                 // slideIndex → cardId snapshot (replaces store read)
    imageModel: string;
    projectId: string;
    onSaved: (cardId: string, url: string) => void | Promise<void>;   // bridge to useUpdateInstagramCard
  }): Promise<void>;
  abortJob(igContentId: string): void;
  getJob(igContentId: string): BatchJobProgress | undefined;
}
export function selectBatchProgress(igContentId: string): (s: BatchState) => BatchJobProgress;  // ports CF :146-148
```
- Keep CF's per‑slide loop, `AbortController` per job, 3 s implicit pacing via the sequential awaits, the data‑URL fallback on R2 failure (`batch-image-store.ts:91-105`), the `updateProgress` setter, and the `setTimeout(…,3000)` self‑cleanup (`:121-130`). **Decision (O‑E): port cleanly as Zustand** — verified the only blockers are the two imports + the `useProjectStore` read, both bridged above. (The store is **not** server‑data cache, so it does not violate the "Zustand = UI only" rule; results land in the TanStack cache via `onSaved`.)
- The panel subscribes with `useBatchImageStore(selectBatchProgress(igContent.id))` (CF `cardnews-panel.tsx:320`) and reads `{ current, total, currentSlideIndex, isRunning }` to drive the `GenerationButton variant="batch-image"` progress + the per‑slide generating overlay (`isGeneratingImage={… || (isRunning && currentSlideIndex === card.sort_order)}`, CF :856).

### 5.6 `api/use-card-templates.ts`

Reads from `useProject(projectId)`? No — templates are their **own** tables (not on the project row), so this hook fetches them directly and caches under new keys:
```ts
mktKeys.cardTemplates = (projectId) => ['mkt','card-templates', projectId] as const;       // ADD to queries.ts
mktKeys.cardHiddenBuiltins = (projectId) => ['mkt','card-hidden-builtins', projectId] as const;

useCardTemplates(projectId): UseQueryResult<CardTemplateRow[]>;        // select * eq project_id order created_at
useHiddenBuiltins(projectId): UseQueryResult<string[]>;               // builtin_id[]
useCreateCardTemplate(): UseMutationResult<string, …, { projectId; data: Omit<CardTemplateRow,'id'|'user_id'|'created_at'|'updated_at'> }>;  // returns id
useUpdateCardTemplate(): UseMutationResult<void, …, { id; projectId; updates: Partial<CardTemplateRow> }>;
useDeleteCardTemplate(): UseMutationResult<void, …, { id; projectId }>;
useHideBuiltin(): UseMutationResult<void, …, { projectId; builtinId }>;   // insert (project_id, builtin_id) — unique guard
```
Invalidate `mktKeys.cardTemplates(projectId)` / `mktKeys.cardHiddenBuiltins(projectId)` on success. These are the only two **new query keys** in 1b (card templates are not part of the content graph).

### 5.7 Channel models — reuse Phase 1a `useChannelModels`

`useChannelModels(project.id, 'cardnews')` and `useChannelModels(project.id, 'threads')` — already implemented (`…/api/use-channel-models.ts:27`), persists per‑channel `{ textModel, imageModel, aspectRatio, imageStyle, imageInstruction }` inside `mkt_projects.ai_model_settings.channelModels[channel]`. Returns `{ models, setChannelModels(updates) }`. **Note the signature drift vs CF:** CF calls `setChannelModels(projectId, channel, updates)` (3 args, `cardnews-panel.tsx:942`); the ported hook's `setChannelModels(updates)` takes **only updates** (project+channel are bound at hook creation). Adapt the panel call sites accordingly. Defaults: cardnews `defaultAspectRatio="4:5"`, threads `defaultAspectRatio="1:1"` (CF :948 / :244).

---

## 6. Components

Path `features/marketing/components/content/`. **PascalCase component files** (Tangobook), `cardnews-templates.ts` stays camelCase (it's a data module, not a component — matches the `lib/*` naming). Primitives from `../../ui` (NOT `@/components/ui`); `cn`/`generateId` from `../../lib/utils`; types from `../../types/{cards,database}`; icons from `lucide-react` (**verify each icon resolves at `lucide-react@^1.17.0`** — see §10 R‑1). **Drop all `'use client'`** directives. For each: **Purpose · Props · Key deps · Ported source**.

### 6.1 `CardNewsPanel.tsx`  ← `cardnews-panel.tsx` (986 lines — the centerpiece)

- **Purpose**: outer = `ChannelModelSelector` + `ChannelContentList<InstagramContent>`; inner (`CardNewsPanelInner`) = templates sidebar + caption/hashtag editor + slide‑text editor + 2‑column slide grid + preview modal + AI text gen + batch image gen + **Canvas WebP download**.
- **Props (outer)**: none — reads `useUIStore` (`selectedContentId`/`selectedProjectId`) + `useContent` graph + `useProject`. In `ContentTabs` it is mounted as `<CardNewsPanel content={content} project={project} />` to match the 1a panel signature (`ContentTabs.tsx:119,124,129`). **Props (`CardNewsPanelInner`)**: `{ igContent: InstagramContent & { cards: InstagramCard[] }; content; project; hasBaseArticle; channelModels }` (CF :31-37).
- **AI text gen** (`buildCardNewsImagePromptsPrompt`, `lib/prompt-builder.ts:384`): `useAiGeneration` (`hooks/use-ai-generation.ts`); on complete parse `{ caption, hashtags[], slides[] }` (CF :245-308), build `InstagramCard[]` with the 4‑zone `CardCanvasData` per slide (header/title/body/footer with the body‑truncation to ~80 chars, CF :262-287) — **stamp `user_id`** on each card (§4.6) — then `useSetInstagramCards`. Persist caption+hashtags via `useUpdateInstagramContent`. Build the prompt from blog sections if any blog cards exist, else the base article (CF :329-351; reads `useContent(...).data.blogContents[i].cards`). Open `PromptEditDialog` before streaming (CF :350,909-911).
- **Per‑card image gen**: `useCardImageGeneration` (Phase 1a hook — **cardId‑based API**, see §7) with `getPrompt(cardId)` deriving from `card.image_prompt` + `imageStyle` + `NO_TEXT_IMAGE_RULE` (CF :384-388), `getModel`/`getAspectRatio` from `channelModels` (default `'4:5'`), `onSave(cardId,url) → useUpdateInstagramCard({ background_image_url:url, image_prompt:prompt })`. `referenceImage` (panel‑level upload) is passed through `getReferenceImages` if set.
- **Batch image gen**: `useBatchImageStore` (§5.5) — `startBatchJob({ igContentId, prompts, cardIdsByIndex, imageModel, projectId, onSaved })`; progress via `selectBatchProgress`. Builds prompts from each card's `image_prompt` (or a fallback) prefixed with `imageStyle` (CF :370-381).
- **Templates sidebar**: list `[...CARD_TEMPLATES, ...customRows].filter(!hidden)` (CF :189); apply a template = rewrite every card's `text_style` block layout while preserving each block's existing `text` (CF `applyTemplate` :415-436); the template "속성" panel edits **local `workingTplData`** and live‑applies to all cards (CF :597-743); Save persists via `useCreateCardTemplate`/`useUpdateCardTemplate`; delete = `useDeleteCardTemplate` (custom) or `useHideBuiltin` (built‑in) (CF :144-151). **Strip the localStorage migration** (§4.3, O‑C).
- **Canvas WebP download** (`renderCardToBlob` + `handleDownloadAllImages`, CF :454-530): see §7. Downloads `cardnews_NN.webp` per slide, 500 ms apart.
- **Preview modal**: full‑screen slide carousel rendering `parseCanvasData` blocks at 3× font (CF :871-907) — port verbatim (pure JSX).
- **Key deps**: `useAiGeneration`, `useCardImageGeneration`, `useBatchImageStore`, instagram contents/cards hooks, `useCardTemplates`/`useHiddenBuiltins`/template mutations, `useChannelModels(project.id,'cardnews')`, `ChannelModelSelector`, `ChannelContentList`, `PromptEditDialog`, `GenerationButton`, `CardNewsCardItem`/`AddSlideButton`, `KoreanInput` (template rename).
- **Ported libs**: `buildCardNewsImagePromptsPrompt`, `NO_TEXT_IMAGE_RULE` (`lib/prompt-builder.ts`); `base64ToBlob` if needed (`lib/image-utils.ts`); `CARD_TEMPLATES` (`cardnews-templates.ts`).
- **`ChannelContentList` wiring**: `accentColor="bg-indigo-600 hover:bg-indigo-700"`; `getTitle={(item) => item.title || '카드뉴스 N'}` (**note**: ported `ChannelContentList.getTitle` is **1‑arg `(item)`** — `ChannelContentList.tsx:11` — whereas CF passes `(item,index)` :954; compute the index from list position inside the panel's `items.map` or fall back to `item.title || '카드뉴스'`); `onAdd → useCreateInstagramContent()` (Promise<string>); **omit `onAddToQueue`/`publishChannels`** (Phase 3).

### 6.2 `CardNewsCardItem.tsx`  ← `cardnews-card-item.tsx` (592 lines — Canvas + pointer drag/resize)

- **Purpose**: one 4:5 slide. `CardCanvas` = bg color + full‑width image (vertical `imageY` drag, `cursor-ns-resize`) + absolutely‑positioned `TextBlock`s (custom **PointerEvent** drag + bottom‑right‑corner resize + grid‑snap; **NOT @dnd‑kit**) + grid guides; below it: per‑card controls (bg color, +텍스트, 업로드, 저장, AI 생성) + the selected‑block `TextBlockEditor` + an image‑prompt textarea.
- **Props**: `{ card: InstagramCard; index; onUpdate(cardId, updates: Partial<InstagramCard>); onDelete(cardId); onGenerateImage?(); isGeneratingImage?; isSelected?; onSelect?() }` (CF :426-435).
- **Exports** (port the named exports): `parseCanvasData`, `defaultCanvasData` (CF :27-68), `AddSlideButton` (CF :580). **Re‑export `TextBlock`/`CardCanvasData` from `../../types/cards`** (CF re‑exports them :9 — but in Tangobook they're already in `types/cards.ts`, so `export type { TextBlock, CardCanvasData } from '../../types/cards'`).
- **Pure helpers to port verbatim** (unit‑testable): `snapToGrid` (`GRID_SIZE=10`, `SNAP_THRESHOLD=4`, CF :18-21), `clamp` (:23-25), `parseCanvasData` (legacy‑flat → 4‑block migration, :41-68), `isBgLight` (luminance, :70-77), `defaultCanvasData` (:27-39).
- **Pointer interactions** (port verbatim, CF :120-205): `handleBlockPointerDown` (text block drag: `dx/dy` as % of container rect → `snapToGrid(clamp(...))` → `onUpdateBlock`), `handleImagePointerDown` (Y‑only image drag → `onUpdateCanvas({imageY})`), `handleResizePointerDown` (bottom‑right corner → width/height %). All attach `window` `pointermove`/`pointerup` listeners and clean up on up. **Per O‑D (§5.2): the panel's `onUpdate` wrapper should keep these block writes in local state during the drag and persist on pointer‑up** (the card item itself calls `onUpdate`/`saveCanvas` on each move; route persistence so it only hits the DB at gesture end).
- **`saveCanvas`** (CF :443-457): merges `Partial<CardCanvasData>` → writes `text_style` + syncs `background_image_url`/`background_color`/`text_content` (newline‑joined block texts). `updateBlock`/`deleteBlock`/`addBlock` operate on `canvasData.textBlocks` then `saveCanvas`.
- **Paste/drop image** (CF :207-244): `FileReader` → data‑URL → `saveCanvas({ imageUrl })`; canvas `paste` listener (Ctrl+V) + `onDrop`. (Uploaded images are local data‑URLs here — they only hit R2 if AI‑generated or via a future upload‑to‑R2 path; data‑URLs are same‑origin so they never taint the canvas — relevant to §8.)
- **`TextBlockEditor`** (CF :364-422): textarea + font‑size/color/bold/shadow/align/width controls. Verbatim.
- **Image‑prompt textarea** reads/writes `card.image_prompt` directly via `onUpdate(card.id, { image_prompt })` (CF :565-572).
- **Key deps**: `lucide-react` icons (`Trash2,Plus,ChevronDown,Loader2,Type,Upload,Download,Bold,AlignLeft/Center/Right/Justify`), `Button`/`Textarea` (ui), `cn`/`generateId`. **No TipTap, no @dnd‑kit.**

### 6.3 `ThreadsPanel.tsx`  ← `threads-panel.tsx` (281 lines)

- **Purpose**: outer = `ChannelModelSelector` (with `showImageModel`) + `ChannelContentList<ThreadsContent>`; inner (`ThreadsPanelInner`) = action bar (AI gen / 미리보기 / 전체 복사) + vertical post list + AddPostButton + dialogs.
- **Props (`ThreadsPanelInner`)**: `{ threadsContent: ThreadsContent & { cards: ThreadsCard[] }; content; project; hasBaseArticle; channelModels }` (CF :23-29).
- **AI gen** (`buildThreadsPrompt`, `lib/prompt-builder.ts:487`): on complete parse `{ posts: {text,order}[] }` (CF :52-74), sort by `order`, build `ThreadsCard[]` (`text_content`, `media_url:null`, `media_type:null`, `sort_order:i`) **with `user_id`**, then `useSetThreadsCards`. `PromptEditDialog` before streaming.
- **Per‑post image gen**: `useCardImageGeneration` (cardId‑based, §7) — `getPrompt(cardId)` = `card.media_type || 'Professional photo…'` prefixed with `imageStyle` (CF :88-90 — the **`media_type`‑as‑prompt** quirk, §4.5), `onSave(cardId,url) → useUpdateThreadsCard({ media_url:url, media_type:'image' })`, aspect default `'1:1'`.
- **전체 복사**: `cards.map((c,i) => `[${i+1}/${cards.length}]\n${c.text_content}`).join('\n\n---\n\n')` → clipboard, "복사됨!" 2 s (CF :126-133).
- **Key deps**: `useAiGeneration`, `useCardImageGeneration`, threads contents/cards hooks, `useChannelModels(project.id,'threads')`, `ChannelModelSelector` (`showImageModel`, default `'1:1'`), `ChannelContentList`, `PromptEditDialog`, `ThreadsCardItem`/`AddPostButton`, `ThreadsPreviewDialog`, `GenerationButton`.
- **`ChannelContentList` wiring**: `accentColor="bg-indigo-600 hover:bg-indigo-700"`, `getTitle → item.title || '스레드 N'` (same 1‑arg caveat as §6.1), `onAdd → useCreateThreadsContent()`; **omit `onAddToQueue`/`publishChannels`**.

### 6.4 `ThreadsCardItem.tsx`  ← `threads-card-item.tsx` (177 lines)

- **Purpose**: one post = numbered avatar + connector line + auto‑resize textarea (500‑char counter, over‑limit red) + media slot (zoom/remove via `ImageLightbox`) + collapsible "이미지 첨부" prompt + generate button.
- **Props**: `{ card: ThreadsCard; index; isLast; onUpdate(cardId, updates: Partial<ThreadsCard>); onDelete(cardId); onGenerateImage?(cardId); isGeneratingImage?; generatingCardId? }` (CF :13-22).
- **Exports**: `AddPostButton` (CF :168).
- **Behavior**: textarea `useEffect` auto‑grows to `scrollHeight` on `text_content` change (CF :39-45). `MAX_CHARS=500`. The "이미지 생성" button sets `media_type:imagePrompt` then calls `onGenerateImage(card.id)` (CF :132-135 — the quirk). Image shown when `media_url` set; remove → `onUpdate({ media_url:null, media_type:null })`.
- **Text persistence (O‑F):** CF writes `onUpdate(card.id, { text_content })` on **every keystroke** (`threads-card-item.tsx:81`). Port a small local‑state + debounce (~400 ms) so post typing coalesces, routing persistence through `useUpdateThreadsCard` (optionally `useDebouncedSave('mkt_threads_cards', cardId)` for save‑status reporting). Structure changes (image set/remove, add/delete) use direct mutations.
- **Key deps**: `lucide-react` (`GripVertical,Trash2,Plus,ImageIcon,Wand2,X,Loader2,ChevronDown,ZoomIn`), `Button`/`Textarea` (ui), `ImageLightbox` (Phase 1a, `./ImageLightbox`), `cn`. (The drag handle is decorative in CF — no reorder is wired; keep it decorative or wire `useReorderThreadsCards` later. **1b: decorative only**, matching CF.)

### 6.5 `ThreadsPreviewDialog.tsx`  ← `threads-preview-dialog.tsx` (113 lines)

- **Purpose**: phone‑style thread preview (avatar + connector + body + reaction icons + per‑post char count) with a "텍스트 복사" footer (same `[n/total]` join as 전체 복사).
- **Props**: `{ open; onOpenChange; cards: ThreadsCard[] }`.
- **Key deps**: `Dialog` (ui), `Button` (ui), `lucide-react` (`Copy,Check,Heart,MessageCircle,Repeat2,Send`). Verbatim port (replace `<img>` with plain `<img>`, drop `'use client'`/`@next/next/no-img-element`).

### 6.6 `cardnews-templates.ts`  ← `cardnews-templates.ts` (114 lines)

- **Purpose**: `CardTemplate` interface + `CARD_TEMPLATES` (8 built‑ins: 클린 센터 / 다크 모던 / 미니멀 / 매거진 / 볼드 다크 / 포토 커버 / 스텝 카드 / 브랜드 카드). Each = `{ id, name, bgColor, imageY, preview:{bg,textColor}, textBlocks: Omit<TextBlock,'text'>[] }`.
- **Change**: import `TextBlock` from `../../types/cards` (CF imports from `./cardnews-card-item` :1). Otherwise verbatim — it's pure data.

### 6.7 `ContentTabs.tsx`  ← EDIT existing (`…/components/content/ContentTabs.tsx`)

- **Change**: replace the two `ComingSoonPanel` placeholders (`:133-138`) with `<CardNewsPanel content={content} project={project} />` (in the `cardnews` `TabsContent`) and `<ThreadsPanel content={content} project={project} />` (in the `threads` `TabsContent`). Flip `active: false → true` for `cardnews`+`threads` in the `TABS` array (`:18-19`). **Keep `youtube`+`shorts` as `ComingSoonPanel` (1c).** No change to the `KO_ONLY_TABS` logic (cardnews/threads are **not** ko‑only — they support translation in 1d; they remain visible for non‑ko, unlike the `blog` tab).

---

## 7. Image pipeline reuse + the `useCardImageGeneration` API mismatch (must adapt)

The image pipeline is **already ported** (Phase 1a) and used identically by `BlogPanel` (`BlogPanel.tsx:296-334`). 1b reuses it — but **the ported hook's API differs from ContentFlow's**, so the cardnews/threads panels must adapt (do NOT copy CF's call shape):

| | ContentFlow `use-card-image-generation.ts` (panels call this) | **Ported** `hooks/use-card-image-generation.ts` (USE this) |
|---|---|---|
| prompt getter | `getPrompt(card)` (card object, :13) | `getPrompt(cardId: string)` (:7) — look the card up from local state by id |
| existing img | `getExistingImage(card)` (:14) | (none) — use `getReferenceImages(cardId)` if a ref is needed |
| save | `saveResult(cardId, dataUrl, prompt)` (:16) | `onSave(cardId, url, prompt)` (:17) |
| model/ratio | `imageModel`/`aspectRatio`/`imageStyle` fields (:19-23) | `getModel(cardId)` / `getAspectRatio(cardId)` (:8-12) |
| single | `generateCardImage(cardId, cards)` (:35) | `generateForCard(cardId)` (:28) |
| batch | `generateAllImages(cards)` (:36) | `generateAll(cardIds: string[])` (:29) + `shouldSkip(cardId)` |
| return flags | `{ isGeneratingImage, generatingCardId, imageProgress }` | `{ isGenerating, progress, generateForCard, generateAll, abort }` (:25-31) |

**Adaptation pattern (mirror `BlogPanel.tsx:296-334`):** build the config with `cardId`‑based closures that look the card up from the panel's local card array; for the cardnews **per‑card** regen use `generateForCard(card.id)`. For cardnews **batch** use the **batch‑image store** (§5.5), *not* `generateAll` — CF deliberately uses the module‑level store for cardnews so the batch survives tab switches (CF :319-325); `generateAll` (the in‑hook batch) would die on unmount. For **threads** per‑post, use `generateForCard(card.id)` (threads has no batch button).

- **Flow** (unchanged, `use-card-image-generation.ts:41-79`): `useImageGeneration` POST `/api/mkt/ai/generate-image` → `{ base64, mimeType:'image/png' }` → `convertToWebpBlob` → `uploadToR2({ projectId, category:'images', fileName:`${cardId}.webp`, contentType:'image/webp', contentId:cardId })` → on R2 failure fall back to a `data:` URL → `onSave(cardId, url, prompt)`.
- `image-utils.ts` (`convertToWebpBlob`/`base64ToBlob`) and `api/use-r2-upload.ts` (envelope‑fixed `uploadToR2`) are **already ported** — no gap to close (unlike 1a, which had to add them).

---

## 8. Canvas WebP export (`renderCardToBlob`) + R2 CORS — the #1 risk/prereq

### 8.1 The pipeline (port verbatim, CF `cardnews-panel.tsx:475-530`)
`renderCardToBlob(card)`:
1. `canvas` `W=1080 H=1350` (4:5); `ctx.fillRect` bg.
2. If `data.imageUrl`: `new Image()` with **`img.crossOrigin = 'anonymous'`**, `onload` → `drawImage` at full width / natural aspect, positioned by `imageY` (centered), then `drawTextBlocks()`, then `canvas.toBlob(b=>…, 'image/webp', 0.85)`. `onerror` → still draw text + export.
3. `drawTextBlocks()`: per `TextBlock`, font `${weight} ${fontSize*(W/300)}px "${fontFamily||'Noto Sans KR'}", sans-serif`, `textAlign`, `textBaseline='top'`, **manual per‑character word‑wrap** measuring `ctx.measureText(...).width > maxW` and honoring `\n` (CF :495-503), line height `fs*1.4`.

### 8.2 ⚠️ R2 CORS is NOT configured — this **taints the canvas** and breaks the export
**Verified (memory `phonics-library-data-2026-05-10` + `r2-cache-control-immutable-2026-06-02`, and `r2.provider.ts:39,163`):** the R2 public domain (`pub-554d78bf0f2346cfb850060ac23280a7.r2.dev`, `config.r2.publicUrl`) **does not send `Access-Control-Allow-Origin`.** Consequences for `renderCardToBlob`:
- An `<img crossOrigin='anonymous'>` whose `src` is an R2 public URL **fails the CORS check** → the image is treated as cross‑origin‑without‑CORS → drawing it **taints the canvas** → `canvas.toBlob(...)` throws `SecurityError`. So **any slide whose image was AI‑generated (and uploaded to R2) cannot be exported** until CORS is fixed. (Slides with **local data‑URL** images — pasted/dropped/uploaded but not yet on R2 — export fine, since data‑URLs are same‑origin.)
- The same applies to the per‑slide "저장" download in `CardNewsCardItem` (`cardnews-card-item.tsx:516-531`), which `fetch()`es `canvasData.imageUrl` — a **default‑mode `fetch` of an R2 URL is blocked by CORS** (memory table), so that button currently falls back to `window.open` for R2 images.

**Action (PREREQUISITE, do in Step 0):** choose ONE —
- **(A — recommended) Add a CORS policy to the R2 bucket** (Cloudflare R2 dashboard → bucket → CORS Policy): `AllowedOrigins: [<app origin(s)>]` (or `*` for dev), `AllowedMethods: [GET]`, `AllowedHeaders: ['*']`. Then `crossOrigin='anonymous'` loads succeed and `toBlob` works. **Verify** with: `curl -I -H "Origin: https://<app-origin>" "<an R2 image URL>"` → expect `access-control-allow-origin` in the response headers. (Memory already flags this exact remediation: "R2 pub 도메인에 CORS 정책 추가하면 … `mode:'no-cors'` 불필요".) This also unblocks the future image‑editor (1d) and any `fetch`‑based prefetch.
- **(B — same‑origin escape hatch, no infra change)** Route the slide image through the existing **`GET /api/mkt/storage/proxy?url=…`** (`storage.controller.ts:68`) when drawing: set `img.src = `/api/mkt/storage/proxy?url=${encodeURIComponent(data.imageUrl)}`` for R2 URLs (leave data‑URLs as‑is). Because the proxy streams bytes from the **same origin**, the canvas is not tainted — no `crossOrigin` needed. **Caveat:** the proxy currently sets `Content-Type` + `Cache-Control` but **not** `Access-Control-Allow-Origin` — that's fine for same‑origin `<img>` draws (no CORS check), but if 1b ever `fetch()`es through it cross‑context, add the ACAO header there. Option B keeps the WebP export working even if the bucket CORS policy can't be changed.

**Decision (O‑A): pursue (A) as the durable fix and document (B) as the fallback the panel uses if `renderCardToBlob`'s primary draw throws.** Concretely: try the direct `crossOrigin` draw; on `toBlob` `SecurityError` (or `img.onerror`), retry once via the proxy URL. This makes the export robust regardless of CORS state and is a tiny addition to the ported `renderCardToBlob`.

### 8.3 Font note
`renderCardToBlob` uses `"Noto Sans KR"` (+ the per‑block `fontFamily` options 고딕/명조/블랙한산스/주아/도현/개구, `cardnews-panel.tsx:704-709`). Tangobook's app font is Pretendard/NanumSquareRound (CLAUDE.md). **For canvas text fidelity the chosen web font must be loaded before `toBlob`** (Canvas uses whatever the document has loaded; an unloaded family silently falls back to sans‑serif). **Decision (O‑G):** keep CF's font names as the slide‑font options (they're Google Fonts), and before batch download `await document.fonts.ready` (cheap) so any already‑declared families are rasterized; do **not** add a hard dependency on loading all six — unloaded ones fall back gracefully (acceptable; matches CF, which also doesn't preload them). Flag as a minor visual risk, not a blocker.

---

## 9. i18n / language behavior (follows Phase 1a; generation OUT)

- Per‑content language tabs derive from `project.target_languages` (Phase 1a `LanguageSelector`, O‑4). cardnews + threads are **not** ko‑only — they stay visible for non‑ko (they will support translation in **1d**). The `blog` (N‑blog) tab remains the only ko‑only tab (`ContentTabs.KO_ONLY_TABS`).
- **Translation generation is OUT (1d):** do **not** mount `ChannelTranslationView` (CF `cardnews-panel.tsx:551`, `threads-panel.tsx:137`), do **not** wire `translateAndSaveChannel`. The `lib/channel-translator.ts` **HTML builders** `buildCardnewsHtml`/`buildThreadsHtml` (already ported, `…/lib/channel-translator.ts:164,188`) are needed only if a future preview/copy wants the channel as one HTML blob — 1b's threads "전체 복사" uses a plain text join (CF :126-133), and cardnews has no copy‑as‑HTML, so **1b does not call these builders.** They stay available for 1d. (`buildCardnewsHtml` reads the 4‑zone fields from `text_style` — consistent with §4.2.)

---

## 10. Risks & dependencies to verify

| # | Risk | Action |
|---|---|---|
| **R‑0** | **R2 CORS not set → canvas export taints/throws** (§8.2). The single hard blocker for cardnews WebP export of AI‑generated (R2) slides. | **Prereq, Step 0:** add R2 bucket CORS for GET (option A) and/or implement the proxy‑draw fallback (option B). Verify with `curl -I -H "Origin: …"`. |
| R‑1 | **lucide‑react version skew** — Tangobook pins `^1.17.0`; CF uses `^0.577.0`. cardnews/threads import `GripVertical, Wand2, Repeat2, Send, Hash, Type, Bold, AlignLeft/Center/Right/Justify, EyeOff, Eye, RefreshCw, Save, RotateCcw, ZoomIn`, etc. | Verify each resolves at 1.17 (Vite fails fast on a missing export); substitute renamed icons. Same caveat as 1a R‑1. |
| R‑2 | **`useCardImageGeneration` API mismatch** (card‑object vs cardId; `saveResult` vs `onSave`; `generateCardImage` vs `generateForCard`) — §7. | Adapt the panels to the **ported** cardId‑based API (mirror `BlogPanel.tsx:296-334`); don't copy CF's call shape. |
| R‑3 | **Batch store cannot read TanStack cache** (`useProjectStore.getState().getInstagramCards` in CF) — §5.5. | Inject `cardIdsByIndex` + `onSaved` into `startJob`; don't import a store that reads server data. |
| R‑4 | **Threads `media_type`‑as‑image‑prompt quirk** (§4.5) — looks like a bug; a future dev might "fix" it and break image gen. | Port faithfully + comment it. No `image_prompt` column for threads in 1b (no DDL). |
| R‑5 | **High‑frequency canvas writes** (block drag/resize fire `updateInstagramCard` per pointer‑move, plus template live‑apply rewrites **all** cards) → DB + query‑cache thrash. | Persist on pointer‑up for drag/resize; debounce (500 ms, `useDebouncedSave`) text/number inputs; keep live canvas in local state (O‑D). |
| R‑6 | **`ChannelContentList.getTitle` is 1‑arg** in the port (CF passes `(item,index)`). | Compute index inside the panel or use `item.title || '카드뉴스'`/`'스레드'`. |
| R‑7 | **presign field/path drift** in CF's reference‑image upload (`/api/storage/presign` + `presignedUrl`, `cardnews-panel.tsx:222-228`). | Use the Phase 1a `uploadToR2` (`/api/mkt/storage/presign` + `uploadUrl`, envelope‑fixed) instead of hand‑rolled fetch. |
| R‑8 | **Canvas font fidelity** — slide fonts may fall back to sans‑serif in `toBlob` if unloaded (§8.3). | `await document.fonts.ready` before download; accept graceful fallback (matches CF). Minor visual risk. |
| R‑9 | **`generateId()` for client‑built rows** — instagram/threads cards built in `onComplete` must carry `id`+`user_id`+timestamps before bulk insert (§4.6). | Stamp them client‑side (mirror `BlogPanel.tsx:196-217`); RLS rejects rows without `user_id`. |
| R‑10 | **Template "save built‑in as custom"** (`cardnews-panel.tsx:125-136`) creates a `(수정)` copy via `useCreateCardTemplate`. | Port the branch; ensure the new id becomes `activeTemplateId`. |

---

## 11. Error handling

- **AI gen JSON parse**: cardnews `fullText.match(/\{[\s\S]*\}/)` then `JSON.parse` (CF :245-247); threads same object‑match (CF :53-55). On failure → `alert('… 파싱 실패. 다시 시도해 주세요.')` (CF :310 / :75). Port the body‑truncation + header/title/body/footer fallbacks (CF :262-287).
- **Image gen**: per‑card failure alerts (single) / is collected (batch); R2 upload failure falls back to a data‑URL so the user never loses the image (`use-card-image-generation.ts:67-74`; batch store `:91-105`). The batch store swallows `AbortError` and continues/halts per CF (`:108-111`).
- **Canvas export**: wrap `renderCardToBlob` per‑slide in try/catch (CF :460-472 logs + continues); on `SecurityError`/`onerror` apply the proxy‑draw fallback (O‑A, §8.2) before giving up.
- **`ChannelContentList`** wraps each expanded item in the ported `ErrorBoundary resetKeys=[id]` (`ChannelContentList.tsx:122`) — already in place; one corrupt card row can't blank the list.
- **Save status**: debounced card/post saves report to `save-status-store` (Phase 0) via `useDebouncedSave` — the TopBar `SaveStatusIndicator` reflects in‑flight/error.

---

## 12. Testing strategy

**Unit (pure logic — colocated `__tests__/`, Vitest + jsdom, matching Phase 0/1a):**
- `CardNewsCardItem` pure helpers: **`parseCanvasData`** (legacy‑flat → 4 blocks; new‑format passthrough; null → defaults + imageUrl), **`snapToGrid`** (within/outside `SNAP_THRESHOLD`), **`clamp`**, **`isBgLight`** (luminance threshold), **`defaultCanvasData`** (shape).
- `renderCardToBlob`'s **word‑wrap** measure loop: extract the wrap into a pure helper `wrapLines(measure, text, maxW)` and unit‑test (`\n` handling, overflow split, empty). Canvas/`toBlob`/`drawImage` themselves = manual (Canvas‑bound).
- **batch‑store reducer**: test `startJob` progress transitions + `abortJob` cleanup with `fetch` and the `onSaved` callback mocked, and `selectBatchProgress` returning `EMPTY` for unknown ids (CF `:25-30,146-148`).
- **`cardnews-templates`**: assert 8 built‑ins, each with a valid `preview` + non‑empty `textBlocks` and the expected ids.
- Data hooks (optional, mirror `api/__tests__/use-projects.test.tsx`): `useSetInstagramCards` delete‑then‑insert ordering + `user_id` stamping; `useCreateInstagramContent`/`useCreateThreadsContent` insert branch with a mocked supabase client (QueryClient wrapper).
- **`image-utils.base64ToBlob`** already covered (Phase 1a) — no new test.

**Manual (UI / Canvas / pointer — `/marketing/content`):**
- Cardnews: create cardnews content → AI 텍스트 (caption/hashtags/slides populate; PromptEditDialog) → apply a template (all cards relayout, texts preserved) → drag a text block (snaps to grid; persists on pointer‑up) → resize a block → drag image Y → paste/drop an image → per‑card AI 생성 → **전체 이미지 batch** (progress; switch tabs and back — job survives) → 미리보기 carousel → **다운로드** (WebP for each slide; verify AI‑generated/R2 slides export **after** the CORS fix, and that the proxy fallback also works).
- Threads: create → AI 생성 (posts populate) → edit a post (counter, auto‑resize, debounced save) → 이미지 첨부 → 이미지 생성 → 미리보기 dialog → 전체 복사 (`[n/total]` separators).
- Language: switch to a non‑ko language → cardnews + threads tabs **stay visible** (unlike N‑blog).
- RLS: a second account cannot read the first's instagram/threads/card‑template rows.

---

## 13. Implementation order (sequenced → ready for a plan)

> Each group is independently testable. Pure logic gets unit tests (§12); Canvas/pointer UI = manual.

**Step 0 — Prereqs (unblock canvas export)**
1. **R2 CORS (R‑0):** add the bucket CORS policy for GET (option A) and verify via `curl -I -H "Origin: …"`. (Even if A is deferred, implement the proxy‑draw fallback in §8.2/O‑A so export is robust.)
2. Sanity‑confirm the already‑ported pieces compile & are importable from `…/components/content/`: `ImageStyleSelector`(+`ASPECT_RATIO_PRESETS`), `ImageLightbox`, `ChannelModelSelector`, `ChannelContentList`, `GenerationButton`, `PromptEditDialog`; hooks `use-ai-generation`, `use-image-generation`, `use-card-image-generation`; libs `image-utils`, `prompt-builder` (cardnews/threads builders), `channel-translator`; `api/use-r2-upload`. (All verified present in Phase 1a — this is a no‑op check.)

**Step 1 — Data hooks (no UI)**
3. `api/use-instagram-contents.ts` (contents 1:N + cards: create/update/delete content, setCards/add/update/delete card) — mirror `api/use-blog-contents.ts`; stamp `user_id`.
4. `api/use-threads-contents.ts` (same surface for threads).
5. `api/use-card-templates.ts` + add `mktKeys.cardTemplates`/`mktKeys.cardHiddenBuiltins` to `api/queries.ts`.
6. (Optional) the two non‑blocking card‑index migrations (§4.6) — verify absent first.

**Step 2 — Batch store**
7. `store/batch-image-store.ts` — port CF's store; bridge `/api/mkt/ai/generate-image`, `cardIdsByIndex`, `onSaved`; reuse `convertToWebpBlob`/`uploadToR2`. Unit‑test the reducer.

**Step 3 — Threads (smaller, ships first)**
8. `ThreadsCardItem.tsx` (+ `AddPostButton`) + `ThreadsPreviewDialog.tsx`.
9. `ThreadsPanel.tsx` (AI gen → setThreadsCards; per‑post image via cardId‑based hook; 전체 복사). Wire into `ContentTabs` `threads` tab (flip `active`, replace placeholder). **Manual: full threads flow.**

**Step 4 — Cardnews**
10. `cardnews-templates.ts` (8 built‑ins; import `TextBlock` from `types/cards`).
11. `CardNewsCardItem.tsx` (Canvas + pointer drag/resize + `parseCanvasData`/`defaultCanvasData`/`AddSlideButton`; image‑prompt textarea). **Unit‑test the pure helpers + extracted `wrapLines`.**
12. `CardNewsPanel.tsx` (templates sidebar w/ custom‑template hooks; caption/hashtags; slide grid; AI text gen → setInstagramCards; per‑card image (cardId hook) + **batch via the store**; `renderCardToBlob` download w/ CORS/proxy fallback; preview modal). Wire into `ContentTabs` `cardnews` tab. **Manual: full cardnews flow incl. WebP download.**

**Step 5 — Verification**
13. `pnpm typecheck`, `pnpm --filter client test` (new unit tests green), `pnpm lint`. Manual end‑to‑end for both channels on `/marketing/content`; RLS sanity (second user).

---

## 14. Resolved decisions

> Principle: **port ContentFlow behavior faithfully; adapt only to Tangobook conventions** (TanStack for server data, Zustand for UI/job state only, `{ success, data }` responses, `/api/mkt/*`, `presignedUrl`→`uploadUrl`, R2 keys via `buildMktKey` with `Date.now()` immutability, `user_id` single‑owner RLS). IDs O‑A…O‑G are referenced above.

- **O‑A — Canvas export under R2 CORS → DECIDED: fix bucket CORS (durable) + proxy‑draw fallback (robust).** Try direct `crossOrigin='anonymous'` draw; on taint/`onerror` retry via `/api/mkt/storage/proxy?url=…` (same‑origin, untainted). Add the R2 GET CORS policy as the proper fix; verify with `curl`. (§8.2.)
- **O‑B — Built‑ins vs custom templates → DECIDED: static `CARD_TEMPLATES` (8) + `mkt_card_templates` (custom) + `mkt_card_hidden_builtins` (hidden).** Displayed = `[...builtins, ...customRows].filter(!hidden)`. Both tables already exist. (§4.3.)
- **O‑C — Template localStorage migration → DECIDED: DO NOT port.** CF's `cf-saved-templates`/`cf-hidden-templates` localStorage keys never existed in Tangobook (fresh DB, 0 rows live). Drop the migration `useEffect` (`cardnews-panel.tsx:153-187`). (§4.3.)
- **O‑D — High‑frequency canvas persistence → DECIDED: pointer‑up for drag/resize, 500 ms debounce (`useDebouncedSave`) for text/number inputs, live canvas in local state.** Mirrors 1a's per‑section debounce. (§5.2, R‑5.)
- **O‑E — Batch‑image store as Zustand → DECIDED: ports cleanly.** Verified the only couplings are two imports (re‑pointed to `lib/image-utils` + `api/use-r2-upload`) and the `useProjectStore` card read (replaced by injected `cardIdsByIndex` + `onSaved`). It stores **job/progress state**, not the server cache → does not violate "Zustand = UI only". (§5.5.)
- **O‑F — Threads post text persistence → DECIDED: local state + ~400 ms debounce via `useUpdateThreadsCard` (optionally `useDebouncedSave`).** CF writes per keystroke; coalesce for DB + save‑status. (§6.4.)
- **O‑G — Canvas slide fonts → DECIDED: keep CF's Google‑Font options; `await document.fonts.ready` before download; accept graceful sans‑serif fallback for unloaded families.** No hard preload dependency. (§8.3, R‑8.)
- **Threads `image_prompt` storage → DECIDED: keep CF's `media_type`‑holds‑the‑prompt quirk; no DDL.** (§4.5, R‑4.)
- **Language axis / translation rendering → DECIDED: OUT (1d).** cardnews+threads visible for non‑ko; no `ChannelTranslationView`, no `translateAndSaveChannel`. (§9.)

---

## 15. Conventions checklist (must match Phase 0/1a / Tangobook)

- TanStack Query = server data; Zustand (`ui-store`, `save-status-store`, the **job‑only** `batch-image-store`) = UI/job state. **No server data in Zustand.**
- Files: PascalCase components (`CardNewsPanel.tsx`, `ThreadsCardItem.tsx`), camelCase data/util/hook/api files (`cardnews-templates.ts`, `use-instagram-contents.ts`). Named exports for components; default for pages.
- UI primitives from `../../ui` (NOT `@/components/ui`); `cn`/`generateId` from `../../lib/utils`; types from `../../types/{cards,database}`.
- Mutations set `user_id`, `created_at`/`updated_at`, cast payload `as unknown as Record<string,unknown>` (`…[]` for bulk), throw on `error`, invalidate `mktKeys.content(contentId)` (or `mktKeys.cardTemplates(projectId)` for templates).
- Reuse the existing `/api/mkt/*` endpoints (generate / generate‑image / storage presign+proxy). **No server code in 1b** (only the R2 bucket CORS config). R2 keys via `buildMktKey` (`storage.controller.ts:14`).
- Drop `'use client'`; replace `@next/next/no-img-element` `<img>` with plain `<img>`; fix `/api/storage`→`/api/mkt/storage` + `presignedUrl`→`uploadUrl` in any ported upload path (use `uploadToR2`).
- No hardcoded credentials (none needed in 1b — keyword/external APIs are 1a/2).
