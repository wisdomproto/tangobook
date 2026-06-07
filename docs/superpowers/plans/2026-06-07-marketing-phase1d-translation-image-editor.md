# Marketing Phase 1d (Translation Axis + Image Editor) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the two remaining cross-channel content features that every earlier phase stubbed — (1) the **translation axis**: per-active-channel AI translation that collects the channel's source HTML via the already-ported builders, stream-translates it through `/api/mkt/ai/translate`, persists the translated HTML to R2, upserts a `mkt_translations` row (with `user_id`), and renders it read-only above each channel panel; and (2) the **image editor**: a framework-agnostic Canvas annotation dialog (`ImageEditorDialog` — select/text/line/arrow/rect tools, undo/redo, SVG overlay + arrowhead markers, composited onto a scaled offscreen Canvas → WebP) re-enabled on every `ImageCardWidget`. This turns the `LanguageSelector.onTranslate` alert stub into a real flow (reversing decision `O-5`) and re-enables `ImageCardWidget.onEdit` everywhere (reversing decision `O-7`).

**Architecture:** Almost entirely **client** work on the existing `packages/client/src/features/marketing/` module, plus **two tiny server tweaks** (no new Supabase DDL, no new Express routes). The orchestration seam is `ContentTabs.tsx` (owns `content`/`project`/`selectedLanguage`/active tab); the translated-HTML **display** seam is each channel panel (a read-only `ChannelTranslationView` banner / a base-article inline overlay). The ported-but-dormant `lib/channel-translator.ts` is repaired (correct table name, `user_id` stamping, client-side prompt + worktree SSE contract, direct `uploadToR2` import). Server data = TanStack Query (`mktKeys`); UI-only state = `store/ui-store.ts` (`selectedLanguage`). The image editor reuses the **proxy-draw fallback** pattern from `lib/canvas-export.ts` for its Canvas composite.

**Tech Stack:** React 18 + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3 + lucide-react `^1.17.0` + Express v5 (consume-only) + Cloudflare R2 (consume-only via `uploadToR2` presign + `/api/mkt/storage/proxy`) + Supabase (`mkt_translations`, single-owner RLS). Tests: vitest + @testing-library/react (jsdom).

**Source to port from:** `C:\projects\contentflow\contentflow\src\` — `lib/channel-translator.ts` (builders + flow), `components/content/channel-translation-view.tsx` (50 lines), `hooks/use-channel-translation.ts` (60 lines, `useEffect`-based → convert to TanStack Query), `hooks/use-translation.ts` (OMITTED — see Chunk 1 note), `components/content/language-selector.tsx` (status glyphs reference; the worktree keeps its own simplified shape), `components/content/image-editor-dialog.tsx` (~780 lines, the annotation editor). ContentFlow uses Next.js; this port adapts to Vite + TanStack Query (the same adaptation 1a/1b/1c already did). Spec: `docs/superpowers/specs/2026-06-07-marketing-phase1d-translation-image-editor-design.md` (read it fully; data model §4, translate flow §4.3, client modules §5, image editor §6, the correctness fixes in §4.4/§6.2, sequenced checklist §9, risks §10, resolved facts §11).

**Conventions (match Phase 0 / 1a / 1b / 1c / Tangobook — spec §2, marketing `CLAUDE.md`):**
- TanStack Query = server data; Zustand (`ui-store`) = UI state only. **No server data in Zustand.**
- Files: **PascalCase** components (`ChannelTranslationView.tsx`, `ImageEditorDialog.tsx`), **camelCase** data/util/hook/api files (`use-translations.ts`, `use-channel-translation.ts`). Named exports for components. (ContentFlow used kebab-case files — rename on port.)
- UI primitives imported from `../../ui/<name>` (e.g. `import { Button } from '../../ui/button'`), NOT `@/components/ui/*`. `cn`/`generateId` from `../../lib/utils`. Types from `../../types/database`. The marketing Supabase client from `../../api/supabase` (re-exports `@/lib/supabase`). Icons from `lucide-react`. Drop every `'use client'` directive; replace `next/image` `<Image>` / `@next/next/no-img-element` `<img>` with plain `<img>`.
- Mutations that insert `mkt_*` rows set `user_id` (from `supabase.auth.getUser()`), throw on `error`, and `invalidateQueries` on success.
- **🔴 Namespace rule:** every server call uses `/api/mkt/*` — NEVER `/api/ai/*` or `/api/storage/*`. The CF sources use the non-`mkt` paths; **rewrite them on port** (`/api/ai/translate` → `/api/mkt/ai/translate`, `/api/storage/proxy` → `/api/mkt/storage/proxy`). A leftover non-`mkt` path is a defect — Chunk 4 greps for it.
- Commit after every task. Commit messages in English. End each commit message with the trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Test command (real):** `pnpm --filter client test <path-substring>` (vitest run). Typecheck: `pnpm typecheck` (all packages) or `pnpm --filter client typecheck`. Lint: `pnpm lint`. Build: `pnpm --filter client build`. Server tests (if any added): `pnpm --filter server test <path-substring>`.
- **Port-task pattern** (for verbatim/near-verbatim UI where TDD is impractical): copy source → rename to PascalCase → rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/*` → `../../lib/*`, `@/types/*` → `../../types/*`, `@/hooks/*` → `../../hooks/*`, `@/stores/*` → `../../store/*` or `../../api/*`) → strip `'use client'` + Next `<img>` eslint-disables → rewrite non-`mkt` server paths → **build → `pnpm --filter client typecheck` → manual-verify in `/marketing/content` → commit**. This rhythm is called **"port → typecheck → manual-verify → commit"** below.

> @superpowers:test-driven-development for the pure-logic steps (failing test → run → impl → run → commit). For Canvas/pointer/overlay/SSE UI (not unit-testable) use **port → typecheck → manual-verify → commit** and say so. @superpowers:verification-before-completion before any "done" claim in Chunk 4.

---

## File Structure

```
packages/client/src/features/marketing/
  api/                            [Phase 0/1a/1b/1c + NEW]
    queries.ts                    EDIT   add mktKeys.translation(...) + mktKeys.translationHtml(...) (§5.8)
    supabase.ts                   EDIT   add shared getCurrentUserId() helper (resolves spec Open Q2)
    use-translations.ts           NEW    useChannelTranslationUrl (query) + useTranslateChannel (mutation) (§5.2)
    use-contents.ts               [Phase 0] REUSE  useContent(contentId) → ContentGraph
    use-r2-upload.ts              [Phase 1] REUSE  uploadToR2(file, {projectId,category,fileName,contentType,contentId})
    __tests__/
      use-translations.test.tsx   NEW    mutation invalidation keys + url-query ko short-circuit (mock channel-translator)
  hooks/                          [Phase 1a/1b/1c — REUSE + NEW]
    use-channel-translation.ts    NEW    TanStack-Query port: fetch translated HTML via /api/mkt/storage/proxy (§5.3)
    __tests__/
      use-channel-translation.test.tsx  NEW   ko short-circuit + proxy-path fetch + missingFetch
  lib/                            [Phase 0 — EDIT + REUSE]
    channel-translator.ts         EDIT   (a) translations → mkt_translations; (b) stamp user_id on insert;
                                          (c) streamTranslate → build prompt CLIENT-SIDE + POST {prompt,model}
                                          to /api/mkt/ai/translate; (d) drop _setUploadToR2 bridge → direct
                                          import { uploadToR2 } from '../api/use-r2-upload'. (§4.4, §11)
    translation-prompt-builder.ts [Phase 0] REUSE  buildTranslationPrompt — verbatim, correct (now client-side)
    canvas-export.ts              [Phase 1b] REFERENCE  proxyUrl/isDataUrl/loadImage proxy-draw pattern (§6.2)
    image-utils.ts                [Phase 1b] REUSE  base64ToBlob (editor WebP data URL → Blob before uploadToR2)
    image-editor-canvas.ts        NEW    pure scale-math + history reducer + arrowhead geometry (extracted, TDD)
    sse-stream-parser.ts          [Phase 0] REUSE  fetchSSEText(url, body) → full SSE text
    __tests__/
      channel-translator.test.ts  NEW    4 HTML builders + buildTranslationPrompt + streamTranslate contract
      image-editor-canvas.test.ts NEW    scale math + history reducer + arrowhead
  components/content/             [Phase 1a/1b/1c + NEW + EDIT]
    ChannelTranslationView.tsx    NEW    read-only translated-HTML banner (non-ko only) (§5.4)
    ImageEditorDialog.tsx         NEW    ~780-line annotation editor port + proxy-draw composite (§6)
    ImageCardWidget.tsx           EDIT   onEdit?: () => void + re-add Pencil edit button (reverse O-7) (§6.3)
    ContentTabs.tsx               EDIT   real handleTranslate (replaces alert stub) + resolveTranslationSource helper; pass translationStatuses
    LanguageSelector.tsx          EDIT   accept translationStatuses; per-lang status glyph; disable while translating
    BaseArticlePanel.tsx          EDIT   mount <ChannelTranslationView channel="base"/> (inline, non-ko)
    BlogPanel.tsx                 EDIT   mount <ChannelTranslationView channel="naver_blog"/>
    InternalBlogPanel.tsx         EDIT   mount <ChannelTranslationView channel="self_hosted"/>
    CardNewsPanel.tsx             EDIT   mount <ChannelTranslationView channel="instagram"/>  (Canvas renderer — NO ImageCardWidget, so no onEdit)
    ThreadsPanel.tsx              EDIT   mount <ChannelTranslationView channel="threads"/>  (no ImageCardWidget here)
    YoutubePanel.tsx              EDIT   mount <ChannelTranslationView channel="youtube"/> + scene ImageCardWidget onEdit → ImageEditorDialog
    BlogCardItem.tsx              EDIT   ImageCardWidget onEdit → ImageEditorDialog (blog + internal-blog card images; the ONLY other ImageCardWidget callsite)
    __tests__/
      ContentTabs.helpers.test.ts NEW    resolveTranslationSource (active-tab → ChannelKind + source HTML)
  types/
    database.ts                   EDIT   add `user_id: string` to the Translation interface (§4.2)
server (tiny):
  packages/server/src/controllers/mkt/storage.controller.ts  EDIT  add html:'text/html' to proxy content-type map
```

> **No DDL required.** Phase 0's migration `supabase/migrations/2026-06-07-marketing-schema.sql` already created `mkt_translations` (block at :285-303) with columns `content_id, language, channel_type, status, title, body, cards_json, seo_title, seo_description, translated_at, reviewed_at` + `user_id` (NOT NULL → `auth.users`) + `unique(content_id, language, channel_type)` + single-owner RLS (`:442` — `using (user_id = auth.uid()) with check (user_id = auth.uid())`). **No new SECURITY DEFINER functions** → no `GRANT EXECUTE` (memory RULE n/a). The `user_id` stamping (Chunk 0 fix (b)) is what makes inserts pass `with check`.

> **No new Express routes.** `POST /api/mkt/ai/translate` (`mkt.routes.ts:25` → `ai.controller.ts:67`) and `GET /api/mkt/storage/proxy` (`mkt.routes.ts:32` → `storage.controller.ts:68`) both already exist. The only server change is one line in the proxy's content-type allowlist (Chunk 0 Task 0.1).

### The five fixes this plan must land (do NOT skip — they are in Chunk 0 FIRST)

The spec calls out **three correctness fixes + two infra fixes**. They are the reason Chunk 0 comes before any UI:

| # | Fix | Where | Plan task |
|---|---|---|---|
| **C-1** 🔴 | `channel-translator.ts` queries the **wrong table** `translations` (does not exist) — must be `mkt_translations`. | `lib/channel-translator.ts` (both `translateAndSaveChannel` + `getChannelTranslationUrl`) | Task 0.3 (a) |
| **C-2** 🔴 | `channel-translator.ts` insert does **not stamp `user_id`** → RLS `with check` rejects every translate. | `lib/channel-translator.ts` (insert branch) | Task 0.3 (b) |
| **C-3** 🔴 | `streamTranslate` posts the **CF body shape** (`{text,sourceLanguage,…}`) to `/api/mkt/ai/translate`, which only reads `{prompt,model}` → model gets no instruction + ignores the text. Must build the prompt **client-side** via `buildTranslationPrompt` and POST `{prompt,model}`. | `lib/channel-translator.ts` (`streamTranslate`) | Task 0.3 (c) |
| **I-1** | `/api/mkt/storage/proxy` content-type allowlist **omits `html`** → translated `.html` blobs served as `application/octet-stream` (cosmetic; `res.text()` still works, but fix for correctness/caching). | `storage.controller.ts` proxy map | Task 0.1 |
| **I-2** 🔴 | The image editor's Canvas composite (`handleSave`) in the CF original has **no proxy-draw fallback** → `SecurityError`/tainted canvas wherever R2 bucket CORS is not live. Must reuse the `canvas-export.ts` proxy-draw pattern. (R2 bucket CORS is assumed **NOT** live — rely on the fallback; do not change live R2 config.) | `ImageEditorDialog.tsx handleSave` + `lib/image-editor-canvas.ts` | Chunk 0 Task 0.4 (pattern) + Chunk 3 Task 3.2 (wiring) |

Additionally the dormant `channel-translator.ts` uses an **uninitialized `_setUploadToR2` bridge** (only the definition exists; nothing ever calls it) → replace with a direct `import { uploadToR2 }` (Task 0.3 (d)).

### Chunk dependency order (each chunk independently runnable in this order)

| Chunk | Depends on | Independently testable / verifiable |
|---|---|---|
| **0** Infra & correctness fixes | — (Phase 0–1c only) | server proxy unit/manual + `channel-translator` builder/contract/upsert unit tests + `image-editor-canvas` pure tests + `pnpm --filter client typecheck` |
| **1** Translation hooks + view | 0 (uses the fixed `channel-translator` + `mktKeys` additions) | `use-translations` unit test (upsert keying + user_id) + typecheck + manual mount of `ChannelTranslationView` |
| **2** Translate orchestration + overlays | 0, 1 (calls the mutation; mounts the view) | manual E2E: translate active channel → banner renders for non-ko; N-blog ko-only respected |
| **3** Image editor | 0 (uses `image-editor-canvas` pure helpers + the proxy-draw pattern) | `image-editor-canvas` tests (already in 0) + typecheck + manual: open editor, annotate, save → image updates |
| **4** Verification | 0, 1, 2, 3 | full suite + typecheck + lint + build + static scope sanity + RLS note |

> Chunk 0 is foundational (the three 🔴 correctness fixes + the two infra fixes + the extracted pure helpers — all land before any UI depends on them). Chunk 1 builds the data hooks + the read-only view on top of the fixed translator. Chunk 2 wires the orchestration + mounts overlays. Chunk 3 (image editor) depends only on Chunk 0's pure helpers + proxy pattern, so it can proceed in parallel with 1–2 if desired (it touches `ImageCardWidget` + panels, which Chunk 2 also touches — sequence 3 after 2 to avoid edit collisions on the panels). **The `channel-translator.ts` fixes (Chunk 0) MUST land first** — without them every translate hits a non-existent table, fails RLS, or feeds the model garbage.

---

## Chunk 0: Infrastructure & correctness fixes (the prerequisites — land FIRST)

> No user-facing UI. This chunk lands the two infra fixes (I-1 proxy html content-type; I-2 the editor's proxy-draw composite as a tested pure helper), the three 🔴 correctness fixes to `channel-translator.ts` (C-1 table name, C-2 user_id stamping, C-3 client-side-prompt SSE contract) + the `_setUploadToR2` removal, the `Translation` + `mktKeys` type/key additions, and a shared `getCurrentUserId()` helper (resolves spec Open Q2). Pure logic is TDD'd; everything later depends on these.

### Task 0.1: Server — add `html: 'text/html'` to the proxy content-type allowlist (I-1)

> Verified (spec §4.4; `storage.controller.ts:79-90`): the `proxy` handler derives `ext` from the key and maps it via `contentTypes` `{mp4,mp3,wav,png,jpg,jpeg,webp,pdf}` — **no `html`**, so translated `.html` blobs are served `application/octet-stream`. `res.text()` still works (so display is not blocked), but adding `html` is correct + improves caching. This is the ONLY server change in Phase 1d.

**Files:**
- Modify: `packages/server/src/controllers/mkt/storage.controller.ts:80-89`

- [ ] **Step 1 (impl):** In `storage.controller.ts`, add `html: 'text/html',` to the `contentTypes` map (place it logically after `pdf`):

```ts
  const contentTypes: Record<string, string> = {
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    pdf: 'application/pdf',
    html: 'text/html',
  };
```

- [ ] **Step 2 (typecheck):** `pnpm --filter server typecheck` → **PASS** (one-key addition to a typed `Record<string,string>`; no other diff).
- [ ] **Step 3 (manual sanity — optional, deferred to Chunk 2):** real verification (a `.html` R2 blob returns `Content-Type: text/html`) happens once a translation exists (Chunk 2 manual flow). No server unit test exists for this controller in the worktree; a route test is out of scope for one allowlist entry. Note this in the commit.
- [ ] **Step 4 (commit):**
  ```bash
  git add packages/server/src/controllers/mkt/storage.controller.ts
  git commit -m "fix(marketing): serve proxied .html as text/html (I-1 — translated HTML content-type)"
  ```

### Task 0.2: Type + key plumbing — `Translation.user_id`, `mktKeys.translation*`, shared `getCurrentUserId()`

> Three tiny, independent additions the later hooks need. No behavior change on their own.

**Files:**
- Modify: `packages/client/src/features/marketing/types/database.ts:432-447` (add `user_id`)
- Modify: `packages/client/src/features/marketing/api/queries.ts:18-26` (add 2 keys)
- Modify: `packages/client/src/features/marketing/api/supabase.ts` (add shared `getCurrentUserId`)

- [ ] **Step 1 (Translation.user_id — §4.2):** In `types/database.ts`, add `user_id: string;` to the `Translation` interface as the second field (after `id`), mirroring the DDL (`mkt_translations.user_id NOT NULL`) and how `Project`/`Content` order it:

```ts
export interface Translation {
  id: string;
  user_id: string;
  content_id: string;
  language: string;
  channel_type: string;
  status: TranslationStatus;
  title: string | null;
  body: string | null;
  cards_json: Record<string, unknown>[] | null;
  seo_title: string | null;
  seo_description: string | null;
  translated_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2 (mktKeys — §5.8):** In `api/queries.ts`, add two keys to the `mktKeys` factory (after `content`):

```ts
export const mktKeys = {
  all: ['mkt'] as const,
  projects: () => ['mkt', 'projects'] as const,
  project: (id: string) => ['mkt', 'project', id] as const,
  contents: (projectId: string) => ['mkt', 'contents', projectId] as const,
  content: (id: string) => ['mkt', 'content', id] as const,
  translation: (contentId: string, channel: string, lang: string) =>
    ['mkt', 'translation', contentId, channel, lang] as const,
  translationHtml: (contentId: string, channel: string, lang: string) =>
    ['mkt', 'translation-html', contentId, channel, lang] as const,
  cardTemplates: (projectId: string) => ['mkt', 'card-templates', projectId] as const,
  cardHiddenBuiltins: (projectId: string) => ['mkt', 'card-hidden-builtins', projectId] as const,
};
```

> Two keys: `translation` = the URL lookup (`useChannelTranslationUrl`, Chunk 1); `translationHtml` = the fetched HTML (`useChannelTranslation`, Chunk 1). Both are invalidated after a successful translate (Chunk 1 Task 1.1 / Chunk 2).

- [ ] **Step 3 (shared getCurrentUserId — resolves spec Open Q2):** In `api/supabase.ts`, export a single shared helper so `channel-translator.ts` (and any future caller) does not re-declare it. **Do NOT refactor the 5 existing panels** (BlogPanel/CardNewsPanel/InternalBlogPanel/YoutubePanel/ThreadsPanel each declare their own module-local copy — leaving them is out of scope and risk-free; only *new* code uses the shared one). Read the existing file first, then append:

```ts
// ─── Shared current-user-id helper (Phase 1d — used by channel-translator) ────
// The 5 channel panels each declare a module-local copy; new code imports THIS.
export async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}
```

- [ ] **Step 4 (typecheck):** `pnpm --filter client typecheck` → **PASS**. Adding a required field to `Translation` does not break any current code (nothing constructs a `Translation` literal yet — `channel-translator.ts` inserts an untyped object literal, fixed in Task 0.3). The `mktKeys` + helper additions are purely additive.
- [ ] **Step 5 (commit):**
  ```bash
  git add packages/client/src/features/marketing/types/database.ts packages/client/src/features/marketing/api/queries.ts packages/client/src/features/marketing/api/supabase.ts
  git commit -m "feat(marketing): Translation.user_id + mktKeys.translation* + shared getCurrentUserId (1d plumbing)"
  ```

### Task 0.3: Fix `lib/channel-translator.ts` (C-1 + C-2 + C-3 + drop `_setUploadToR2`)

> The single most important task in Phase 1d. The file is **ported but dormant** with three 🔴 defects + a dead bridge (spec §11). Tests for the **pure** parts (the 4 HTML builders, the prompt composition, the upsert keying) are TDD'd; the supabase upsert is exercised with a mocked client. Read `lib/channel-translator.ts` fully before editing — the 4 HTML builders + `getChannelTranslationUrl` + `languageLabel` are **correct and stay verbatim**; only `streamTranslate`, `translateAndSaveChannel` (table + user_id), `getChannelTranslationUrl` (table), and the import/bridge block change.

**Files:**
- Modify: `packages/client/src/features/marketing/lib/channel-translator.ts`
- Test: `packages/client/src/features/marketing/lib/__tests__/channel-translator.test.ts` (NEW)

- [ ] **Step 1 (test — builders + prompt contract + upsert keying):** Write the failing test first. It covers (a) the 4 HTML builders (verbatim ports — lock against drift), (b) that `streamTranslate` composes the system prompt via `buildTranslationPrompt` and POSTs `{prompt, model}` to **`/api/mkt/ai/translate`** (C-3), and (c) that `translateAndSaveChannel` upserts on `(content_id, language, channel_type)`, stores the R2 URL in `body`, sets `status:'completed'`, and **stamps `user_id` on insert** (C-1 + C-2). Mock `fetchSSEText`, `uploadToR2`, and the supabase client.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (declare before importing the SUT) ────────────────────────────────
vi.mock('../sse-stream-parser', () => ({
  fetchSSEText: vi.fn().mockResolvedValue('<p>translated</p>'),
}));
vi.mock('../../api/use-r2-upload', () => ({
  uploadToR2: vi.fn().mockResolvedValue({ publicUrl: 'https://r2.example/x.html', key: 'k' }),
}));
// supabase client mock — chainable insert/update + maybeSingle for the existence check
const maybeSingleMock = vi.fn();
const insertMock = vi.fn().mockResolvedValue({ error: null });
const updateEqMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });
const selectChain = {
  eq: vi.fn().mockReturnThis(),
  maybeSingle: maybeSingleMock,
};
const fromMock = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue(selectChain),
  insert: insertMock,
  update: updateMock,
});
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  },
}));

import { fetchSSEText } from '../sse-stream-parser';
import {
  translateAndSaveChannel,
  getChannelTranslationUrl,
  buildBlogCardsHtml,
  buildCardnewsHtml,
  buildThreadsHtml,
  buildYoutubeHtml,
} from '../channel-translator';
import type { Project } from '../../types/database';

const project = { id: 'p-1', brand_name: 'Tangobook', industry: 'edu' } as unknown as Project;

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(selectChain, { eq: vi.fn().mockReturnThis(), maybeSingle: maybeSingleMock });
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnValue(selectChain),
    insert: insertMock,
    update: updateMock,
  });
  maybeSingleMock.mockResolvedValue({ data: null }); // no existing row → INSERT path
});

describe('HTML builders (verbatim port — drift guard)', () => {
  it('buildCardnewsHtml sorts by sort_order, prefixes caption, emits role spans', () => {
    const html = buildCardnewsHtml(
      [
        { sort_order: 1, text_content: 'B', text_style: { title: 'T1' } } as never,
        { sort_order: 0, text_content: 'A', text_style: { header: 'H0', body: 'Body0' } } as never,
      ],
      'CAP'
    );
    expect(html).toContain('data-role="caption">CAP');
    // slide 1 (sort_order 0) comes before slide 2 (sort_order 1)
    expect(html.indexOf('data-slide="1"')).toBeLessThan(html.indexOf('data-slide="2"'));
    expect(html).toContain('data-role="header">H0');
  });
  it('buildThreadsHtml emits one data-post per card in sort_order', () => {
    const html = buildThreadsHtml([
      { sort_order: 1, text_content: 'second' } as never,
      { sort_order: 0, text_content: 'first' } as never,
    ]);
    expect(html.indexOf('first')).toBeLessThan(html.indexOf('second'));
    expect(html).toContain('data-post="1"');
  });
  it('buildYoutubeHtml emits subtitle/narration/direction roles', () => {
    const html = buildYoutubeHtml([
      { sort_order: 0, narration_text: 'N', subtitle_text: 'S', screen_direction: 'D' } as never,
    ]);
    expect(html).toContain('data-role="subtitle">S');
    expect(html).toContain('data-role="narration">N');
    expect(html).toContain('data-role="direction"');
  });
  it('buildBlogCardsHtml joins text + figure blocks', () => {
    const html = buildBlogCardsHtml([
      { content: { text: 'hello', url: 'https://img/x.png', alt: 'a', caption: 'c' } } as never,
    ]);
    expect(html).toContain('hello');
    expect(html).toContain('<figure><img src="https://img/x.png"');
    expect(html).toContain('<figcaption>c</figcaption>');
  });
});

describe('translateAndSaveChannel (C-1 table + C-2 user_id + C-3 contract)', () => {
  it('builds the prompt client-side and POSTs {prompt,model} to /api/mkt/ai/translate', async () => {
    await translateAndSaveChannel({
      projectId: 'p-1',
      contentId: 'c-1',
      project,
      targetLang: 'en',
      channel: 'base',
      sourceHtml: '<p>안녕</p>',
    });
    expect(fetchSSEText).toHaveBeenCalledTimes(1);
    const [url, body] = (fetchSSEText as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    expect(url).toBe('/api/mkt/ai/translate'); // C-3 (worktree namespace)
    const b = body as { prompt: string; model?: string };
    expect(typeof b.prompt).toBe('string');
    // the system prompt (buildTranslationPrompt) must be present, not just the raw text
    expect(b.prompt).toContain('professional translator');
    expect(b.prompt).toContain('안녕'); // source text appended after the system prompt
  });

  it('inserts into mkt_translations with user_id + status:completed + body=R2 url (C-1/C-2)', async () => {
    await translateAndSaveChannel({
      projectId: 'p-1',
      contentId: 'c-1',
      project,
      targetLang: 'en',
      channel: 'instagram',
      sourceHtml: '<p>x</p>',
    });
    // C-1: the table name
    expect(fromMock).toHaveBeenCalledWith('mkt_translations');
    // C-2: user_id stamped on insert
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.user_id).toBe('user-1');
    expect(row.content_id).toBe('c-1');
    expect(row.language).toBe('en');
    expect(row.channel_type).toBe('instagram');
    expect(row.status).toBe('completed');
    expect(row.body).toBe('https://r2.example/x.html');
  });

  it('updates (not inserts) when a row already exists', async () => {
    maybeSingleMock.mockResolvedValue({ data: { id: 'tr-1' } }); // existing → UPDATE path
    await translateAndSaveChannel({
      projectId: 'p-1',
      contentId: 'c-1',
      project,
      targetLang: 'en',
      channel: 'threads',
      sourceHtml: '<p>x</p>',
    });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateEqMock).toHaveBeenCalledWith('id', 'tr-1');
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('getChannelTranslationUrl (C-1 table)', () => {
  it('returns null for ko without touching the DB', async () => {
    const out = await getChannelTranslationUrl('c-1', 'ko', 'base');
    expect(out).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });
  it('queries mkt_translations for non-ko', async () => {
    maybeSingleMock.mockResolvedValue({ data: { body: 'https://r2/x.html' } });
    const out = await getChannelTranslationUrl('c-1', 'en', 'base');
    expect(fromMock).toHaveBeenCalledWith('mkt_translations');
    expect(out).toBe('https://r2/x.html');
  });
});
```

- [ ] **Step 2 (run):** `pnpm --filter client test marketing/lib/__tests__/channel-translator`. Expected: **FAIL** (the contract test fails — current code posts the CF body to `/api/ai/translate`; the table test fails — current code uses `translations`; the user_id test fails — current insert has no `user_id`; the upload-mock import path differs).
- [ ] **Step 3 (impl — edit `channel-translator.ts`):** Apply the four fixes. Keep the 4 HTML builders + `languageLabel` + the `ChannelKind`/interfaces **verbatim**.

  **(d) Imports + bridge removal** — replace the top block (`:1-14`) with a direct `uploadToR2` import + the shared user-id helper; delete `_uploadToR2`/`_setUploadToR2` and the lazy-bridge comment:

```ts
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '../api/supabase';
import { fetchSSEText } from './sse-stream-parser';
import { uploadToR2 } from '../api/use-r2-upload';
import { buildTranslationPrompt } from './translation-prompt-builder';
import type { BlogCard, InstagramCard, ThreadsCard, YoutubeCard, Project } from '../types/database';
```

  > **No more `_setUploadToR2` / `_uploadToR2`.** They were never initialized anywhere (only the definition existed) — a verbatim port would throw "uploadToR2 not initialized" at runtime. The direct import is the worktree convention (the same `api/use-r2-upload` the panels already import).

  **(c) `streamTranslate` — build the prompt CLIENT-SIDE + POST `{prompt,model}`** (C-3). Replace the whole function (`:50-65`):

```ts
/**
 * Builds the full translation prompt CLIENT-SIDE (the worktree `/api/mkt/ai/translate`
 * controller only reads `{prompt,model}` and calls streamGenerate — it does NOT build a
 * prompt server-side, unlike CF). Composes the buildTranslationPrompt system prompt with
 * the source text and streams the result. (spec §4.4 — the C-3 contract fix.)
 */
function streamTranslate(input: {
  text: string;
  targetLang: string;
  channelType: string;
  project?: Project;
  isNaver?: boolean;
  model?: string;
}): Promise<string> {
  const systemPrompt = buildTranslationPrompt({
    sourceLanguage: 'ko',
    targetLanguage: input.targetLang,
    channelType: input.channelType,
    project: input.project,
    isNaver: input.isNaver,
  });
  const prompt = `${systemPrompt}\n\n---\n${input.text}`;
  return fetchSSEText('/api/mkt/ai/translate', {
    prompt,
    ...(input.model ? { model: input.model } : {}),
  });
}
```

  **`uploadHtmlToR2`** — drop the `_uploadToR2` guard; call `uploadToR2` directly (`:67-89`):

```ts
async function uploadHtmlToR2(params: {
  projectId: string;
  contentId: string;
  channel: ChannelKind;
  targetLang: string;
  html: string;
}): Promise<string> {
  const { projectId, contentId, channel, targetLang, html } = params;
  const blob = new Blob([html], { type: 'text/html' });
  const { publicUrl } = await uploadToR2(blob, {
    projectId,
    category: 'content',
    fileName: `${contentId}_${channel}_${targetLang}.html`,
    contentType: 'text/html',
    contentId,
  });
  return publicUrl;
}
```

  **(a) + (b) `translateAndSaveChannel`** — `translations` → `mkt_translations` in all three calls; stamp `user_id` on insert (`:95-142`):

```ts
/**
 * Translates the given channel source HTML and persists the result to R2
 * plus a row in `mkt_translations`. Returns the public R2 URL. (spec §4.3)
 */
export async function translateAndSaveChannel(input: ChannelTranslationInput): Promise<string> {
  const translated = await streamTranslate({
    text: input.sourceHtml.slice(0, 16000), // CF parity (R-1d-6 — large-article truncation)
    targetLang: input.targetLang,
    channelType: input.channel,
    project: input.project,
    isNaver: input.isNaver,
  });

  const publicUrl = await uploadHtmlToR2({
    projectId: input.projectId,
    contentId: input.contentId,
    channel: input.channel,
    targetLang: input.targetLang,
    html: translated,
  });

  // Upsert on (content_id, language, channel_type) — body holds the R2 URL.
  const { data: existing } = await supabase
    .from('mkt_translations') // C-1
    .select('id')
    .eq('content_id', input.contentId)
    .eq('language', input.targetLang)
    .eq('channel_type', input.channel)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('mkt_translations') // C-1
      .update({
        status: 'completed',
        body: publicUrl,
        translated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    const userId = await getCurrentUserId(); // C-2 — RLS with check (user_id = auth.uid())
    await supabase.from('mkt_translations').insert({
      user_id: userId,
      content_id: input.contentId,
      language: input.targetLang,
      channel_type: input.channel,
      status: 'completed',
      body: publicUrl,
      translated_at: new Date().toISOString(),
    });
  }

  return publicUrl;
}
```

  **`getChannelTranslationUrl`** — `translations` → `mkt_translations` (`:216-231`): change only the `.from('translations')` to `.from('mkt_translations')`. Leave the rest verbatim.

  Update the file header comment (`:1-4`) to remove the stale "uploadToR2 will be wired in a later phase" note (it is now wired).

- [ ] **Step 4 (run):** `pnpm --filter client test marketing/lib/__tests__/channel-translator` → **PASS** (all builder + contract + upsert + getUrl cases).
- [ ] **Step 5 (typecheck):** `pnpm --filter client typecheck` → **PASS**. Confirm **no** leftover `_setUploadToR2` / `_uploadToR2` references anywhere (grep): `grep -rn "_setUploadToR2\|_uploadToR2" packages/client/src/features/marketing` → 0 results (the only definition is now deleted; nothing imported it).
- [ ] **Step 6 (commit):**
  ```bash
  git add packages/client/src/features/marketing/lib/channel-translator.ts packages/client/src/features/marketing/lib/__tests__/channel-translator.test.ts
  git commit -m "fix(marketing): repair channel-translator (mkt_translations + user_id + client-prompt SSE + drop _setUploadToR2)"
  ```

### Task 0.4: Extract the image-editor pure helpers — scale math + history reducer + arrowhead (I-2 prep)

> The image editor (Chunk 3) is mostly verbatim Canvas/pointer UI, but four pieces are pure, load-bearing, and highest-value to test: (1) the **display→natural scale transform** for each element kind (the heart of `handleSave`, CF `image-editor-dialog.tsx:319-377`), (2) the **arrowhead triangle geometry** (CF :349-361), (3) the **history reducer** (`pushHistory`/`undo`/`redo` index math, CF :90-117), and (4) the **proxy-safe image loader** (the I-2 fix, mirroring `canvas-export.ts loadImage/proxyUrl/isDataUrl`). Extract them into a new pure module so Chunk 3 imports + the composite is testable without a real Canvas/DOM. This is where I-2 (the proxy-draw fallback) is *defined*; Chunk 3 Task 3.2 *wires* it into `handleSave`.

**Files:**
- Create: `packages/client/src/features/marketing/lib/image-editor-canvas.ts`
- Test: `packages/client/src/features/marketing/lib/__tests__/image-editor-canvas.test.ts` (NEW)

- [ ] **Step 1 (test):** Write the failing test for the four pure exports.

```ts
import { describe, it, expect } from 'vitest';
import {
  type EditorElement,
  scalePoint,
  arrowheadPoints,
  historyPush,
  historyUndo,
  historyRedo,
  isDataUrl,
  proxyUrl,
} from '../image-editor-canvas';

describe('scalePoint (display → natural pixel space)', () => {
  it('multiplies x by scaleX and y by scaleY', () => {
    expect(scalePoint(10, 20, 2, 3)).toEqual({ x: 20, y: 60 });
  });
  it('is identity at scale 1', () => {
    expect(scalePoint(7, 9, 1, 1)).toEqual({ x: 7, y: 9 });
  });
});

describe('arrowheadPoints (triangle at the arrow tip)', () => {
  // tip at (100,0), tail at (0,0): angle 0 → the two barbs are symmetric about the x-axis,
  // both with x < tip.x (pointing back toward the tail). headLen 15.
  it('returns two barb points behind a horizontal tip', () => {
    const { p1, p2 } = arrowheadPoints({ tipX: 100, tipY: 0, tailX: 0, tailY: 0, headLen: 15 });
    expect(p1.x).toBeLessThan(100);
    expect(p2.x).toBeLessThan(100);
    // symmetric about y=0
    expect(p1.y).toBeCloseTo(-p2.y, 5);
  });
});

describe('history reducer (pushHistory / undo / redo)', () => {
  const a: EditorElement[] = [{ id: '1', type: 'text', x: 0, y: 0, color: '#fff' }];
  const b: EditorElement[] = [...a, { id: '2', type: 'rect', x: 1, y: 1, color: '#f00' }];
  it('push appends and points the index at the new tail', () => {
    const s0 = { history: [[] as EditorElement[]], index: 0 };
    const s1 = historyPush(s0, a);
    expect(s1.history).toHaveLength(2);
    expect(s1.index).toBe(1);
    expect(s1.history[1]).toBe(a);
  });
  it('push after undo truncates the forward history', () => {
    let s = { history: [[] as EditorElement[]], index: 0 };
    s = historyPush(s, a); // index 1
    s = historyPush(s, b); // index 2
    s = historyUndo(s); // index 1
    s = historyPush(s, a); // truncates [.. , b], appends a → length 3, index 2
    expect(s.history).toHaveLength(3);
    expect(s.index).toBe(2);
    expect(s.history[2]).toBe(a);
  });
  it('undo clamps at 0, redo clamps at the tail', () => {
    let s = { history: [[] as EditorElement[]], index: 0 };
    s = historyUndo(s);
    expect(s.index).toBe(0); // clamp
    s = historyPush(s, a); // index 1
    s = historyRedo(s);
    expect(s.index).toBe(1); // already at tail → clamp
  });
});

describe('proxy-safe loader helpers (I-2)', () => {
  it('isDataUrl detects data: URIs', () => {
    expect(isDataUrl('data:image/webp;base64,AAA')).toBe(true);
    expect(isDataUrl('https://r2/x.webp')).toBe(false);
  });
  it('proxyUrl wraps an R2 url through the mkt proxy', () => {
    expect(proxyUrl('https://r2/x.webp')).toBe(
      '/api/mkt/storage/proxy?url=' + encodeURIComponent('https://r2/x.webp')
    );
  });
});
```

- [ ] **Step 2 (run):** `pnpm --filter client test marketing/lib/__tests__/image-editor-canvas`. Expected: **FAIL** (module not found).
- [ ] **Step 3 (impl):** Create `image-editor-canvas.ts`. The `EditorElement` type is the SAME shape Chunk 3's dialog uses (single source of truth — the dialog imports it from here). `scalePoint` + `arrowheadPoints` mirror CF `handleSave` math; `historyPush/Undo/Redo` mirror CF `:90-117`; `isDataUrl`/`proxyUrl`/`loadImageWithProxy` mirror `canvas-export.ts` (the I-2 fallback).

```ts
/**
 * Pure helpers for the image annotation editor (ImageEditorDialog, Chunk 3).
 * Extracted so the scale math, history reducer, arrowhead geometry, and the
 * proxy-draw fallback (I-2) are unit-testable without a real Canvas/DOM.
 *
 * Ported from ContentFlow image-editor-dialog.tsx (:90-117 history, :319-377 composite)
 * + the canvas-export.ts proxy-draw pattern (spec §6.2, the I-2 correctness fix).
 */

export type ToolType = 'select' | 'text' | 'line' | 'arrow' | 'rect';

export interface EditorElement {
  id: string;
  type: 'text' | 'line' | 'arrow' | 'rect';
  x: number;
  y: number;
  color: string;
  // text
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  shadow?: boolean;
  // line/arrow
  x2?: number;
  y2?: number;
  strokeWidth?: number;
  // rect
  rectWidth?: number;
  rectHeight?: number;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Display-space (x,y) → natural-pixel space, given per-axis scale factors. */
export function scalePoint(
  x: number,
  y: number,
  scaleX: number,
  scaleY: number
): { x: number; y: number } {
  return { x: x * scaleX, y: y * scaleY };
}

/**
 * The two barb points of an arrowhead triangle at the tip, in the SAME
 * (already-scaled) coordinate space as tip/tail. Mirrors CF :349-361
 * (headLen along ±30° from the tail→tip direction).
 */
export function arrowheadPoints(p: {
  tipX: number;
  tipY: number;
  tailX: number;
  tailY: number;
  headLen: number;
}): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
  const angle = Math.atan2(p.tipY - p.tailY, p.tipX - p.tailX);
  return {
    p1: {
      x: p.tipX - p.headLen * Math.cos(angle - Math.PI / 6),
      y: p.tipY - p.headLen * Math.sin(angle - Math.PI / 6),
    },
    p2: {
      x: p.tipX - p.headLen * Math.cos(angle + Math.PI / 6),
      y: p.tipY - p.headLen * Math.sin(angle + Math.PI / 6),
    },
  };
}

// ─── History reducer (CF :90-117) ──────────────────────────────────────────
export interface HistoryState {
  history: EditorElement[][];
  index: number;
}

/** Append `next`, truncating any forward (redo) history. (CF pushHistory) */
export function historyPush(state: HistoryState, next: EditorElement[]): HistoryState {
  const trimmed = state.history.slice(0, state.index + 1);
  const updated = [...trimmed, next];
  return { history: updated, index: updated.length - 1 };
}
/** Move the index back one, clamped at 0. (CF undo) */
export function historyUndo(state: HistoryState): HistoryState {
  if (state.index <= 0) return state;
  return { history: state.history, index: state.index - 1 };
}
/** Move the index forward one, clamped at the tail. (CF redo) */
export function historyRedo(state: HistoryState): HistoryState {
  if (state.index >= state.history.length - 1) return state;
  return { history: state.history, index: state.index + 1 };
}

// ─── Proxy-draw fallback (I-2 — mirrors canvas-export.ts) ───────────────────
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}
/** Route an R2 URL through the same-origin proxy so Canvas draws are untainted. */
export function proxyUrl(url: string): string {
  return `/api/mkt/storage/proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Load an image for Canvas compositing with the proxy-draw fallback (I-2):
 *   1. Try direct `crossOrigin='anonymous'` (works when R2 bucket CORS is live).
 *   2. On `onerror` (CORS rejection) → retry ONCE via the same-origin proxy.
 *   3. data: URLs load directly (same-origin, never proxied).
 * Rejects only if BOTH the direct and proxy loads fail (caller surfaces an error).
 * Browser/jsdom note: this touches `Image`/DOM, so it is exercised in Chunk 3 manual
 * testing, NOT in this pure unit file (only isDataUrl/proxyUrl are unit-tested here).
 */
export function loadImageWithProxy(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let triedProxy = false;
    const attempt = (url: string, useProxy: boolean) => {
      const img = new Image();
      if (!isDataUrl(url)) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (!useProxy && !triedProxy && !isDataUrl(src)) {
          triedProxy = true;
          attempt(proxyUrl(src), true);
        } else {
          reject(new Error('image load failed (direct + proxy)'));
        }
      };
      img.src = url;
    };
    attempt(src, false);
  });
}
```

- [ ] **Step 4 (run):** `pnpm --filter client test marketing/lib/__tests__/image-editor-canvas` → **PASS** (scale/arrowhead/history/url cases; `loadImageWithProxy` is not unit-tested here — manual in Chunk 3).
- [ ] **Step 5 (typecheck):** `pnpm --filter client typecheck` → **PASS**.
- [ ] **Step 6 (commit):**
  ```bash
  git add packages/client/src/features/marketing/lib/image-editor-canvas.ts packages/client/src/features/marketing/lib/__tests__/image-editor-canvas.test.ts
  git commit -m "feat(marketing): image-editor pure helpers (scale math, history reducer, arrowhead, proxy-draw I-2)"
  ```

---

## Chunk 1: Translation hooks + read-only view

> Pure data wiring + one verbatim presentational port. Builds on the **fixed** `channel-translator.ts` (Chunk 0). Three pieces: (1) `api/use-translations.ts` (TanStack Query read + the translate mutation), (2) `hooks/use-channel-translation.ts` (the TanStack-Query port of CF's `useEffect`-based translated-HTML fetch), (3) `components/content/ChannelTranslationView.tsx` (the read-only banner). The mutation's upsert behavior is already unit-tested in Chunk 0 (Task 0.3) via `translateAndSaveChannel`; here the test focuses on the hook wrapping (invalidation keys). No live streaming preview (`use-translation.ts` is **OMITTED** per spec O-1d-B / the resolved decision — final-banner display only; document the omission in the module CLAUDE.md in Chunk 4).

### Task 1.1: `api/use-translations.ts` — data hooks (TanStack Query)

> Two hooks in the `api/` layer (server data). `useChannelTranslationUrl` reads the saved R2 URL for `(content, channel, lang)` via the fixed `getChannelTranslationUrl`; `useTranslateChannel` wraps `translateAndSaveChannel` and invalidates BOTH translation keys on success so `ChannelTranslationView` refetches. `ContentTabs.handleTranslate` (Chunk 2) calls the mutation (centralizes status + invalidation). The mutation's core logic (table, user_id, contract) is already covered in Chunk 0; this test asserts the **invalidation keys** + the `enabled` short-circuit.

**Files:**
- Create: `packages/client/src/features/marketing/api/use-translations.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-translations.test.tsx`

- [ ] **Step 1 (test):** Mock `channel-translator` (so we test the hook wiring, not the translator internals already covered in Chunk 0). Assert: the mutation calls `translateAndSaveChannel` with the input and invalidates `mktKeys.translation` + `mktKeys.translationHtml` for `(contentId, channel, language)`; the URL query is disabled for `ko`.

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/channel-translator', () => ({
  translateAndSaveChannel: vi.fn().mockResolvedValue('https://r2/x.html'),
  getChannelTranslationUrl: vi.fn().mockResolvedValue('https://r2/x.html'),
}));

import { translateAndSaveChannel, getChannelTranslationUrl } from '../../lib/channel-translator';
import { useTranslateChannel, useChannelTranslationUrl } from '../use-translations';
import { mktKeys } from '../queries';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}
function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTranslateChannel', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
  });

  it('calls translateAndSaveChannel and invalidates both translation keys', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useTranslateChannel(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({
        projectId: 'p-1',
        contentId: 'c-1',
        project: { id: 'p-1' } as never,
        targetLang: 'en',
        channel: 'instagram',
        sourceHtml: '<p>x</p>',
      });
    });
    expect(translateAndSaveChannel).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.translation('c-1', 'instagram', 'en'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.translationHtml('c-1', 'instagram', 'en'),
    });
  });
});

describe('useChannelTranslationUrl', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
  });

  it('is disabled (does not call) for ko', async () => {
    renderHook(() => useChannelTranslationUrl('c-1', 'base', 'ko'), {
      wrapper: wrapper(queryClient),
    });
    // give the query a tick; it must NOT fire for ko
    await new Promise((r) => setTimeout(r, 10));
    expect(getChannelTranslationUrl).not.toHaveBeenCalled();
  });

  it('fetches the url for a non-ko language', async () => {
    const { result } = renderHook(() => useChannelTranslationUrl('c-1', 'base', 'en'), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.data).toBe('https://r2/x.html'));
    expect(getChannelTranslationUrl).toHaveBeenCalledWith('c-1', 'en', 'base');
  });
});
```

- [ ] **Step 2 (run):** `pnpm --filter client test marketing/api/__tests__/use-translations`. Expected: **FAIL** (module not found).
- [ ] **Step 3 (impl):** Create `use-translations.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mktKeys } from './queries';
import {
  translateAndSaveChannel,
  getChannelTranslationUrl,
  type ChannelKind,
  type ChannelTranslationInput,
} from '../lib/channel-translator';

/** Read the saved R2 URL for a (content, channel, language). Null for ko / no translation. */
export function useChannelTranslationUrl(
  contentId: string | null,
  channel: ChannelKind,
  language: string
) {
  return useQuery({
    queryKey: mktKeys.translation(contentId ?? '', channel, language),
    queryFn: () => getChannelTranslationUrl(contentId as string, language, channel),
    enabled: !!contentId && language !== 'ko',
  });
}

/** Translate the active channel + persist (R2 + mkt_translations); invalidate the view's keys. */
export function useTranslateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChannelTranslationInput) => translateAndSaveChannel(input),
    onSuccess: (_url, input) => {
      queryClient.invalidateQueries({
        queryKey: mktKeys.translation(input.contentId, input.channel, input.targetLang),
      });
      queryClient.invalidateQueries({
        queryKey: mktKeys.translationHtml(input.contentId, input.channel, input.targetLang),
      });
    },
  });
}
```

> `ChannelTranslationInput` + `ChannelKind` are already exported from `channel-translator.ts` (`:26-44`). No new types.

- [ ] **Step 4 (run):** `pnpm --filter client test marketing/api/__tests__/use-translations` → **PASS** (3 cases).
- [ ] **Step 5 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6 (commit):**
  ```bash
  git add packages/client/src/features/marketing/api/use-translations.ts packages/client/src/features/marketing/api/__tests__/use-translations.test.tsx
  git commit -m "feat(marketing): translation data hooks (useChannelTranslationUrl query + useTranslateChannel mutation)"
  ```

### Task 1.2: `hooks/use-channel-translation.ts` — translated-HTML fetch (TanStack-Query port)

> Port of CF `use-channel-translation.ts` (60 lines, `useEffect`-based) **converted to TanStack Query**. Returns `{ loading, html, missingFetch }` (same shape CF's `ChannelTranslationView` consumes). 🔴 The CF path `/api/storage/proxy` becomes **`/api/mkt/storage/proxy`** (namespace rule). The queryFn resolves the URL then fetches the HTML through the same-origin proxy.

**Files:**
- Create: `packages/client/src/features/marketing/hooks/use-channel-translation.ts`
- Test: `packages/client/src/features/marketing/hooks/__tests__/use-channel-translation.test.tsx`

- [ ] **Step 1 (test):** Mock `getChannelTranslationUrl` + global `fetch`. Assert: ko → `{ html:null }` and no fetch; a resolved URL + ok response → `html` text; a resolved URL + non-ok response → `missingFetch:true`; the proxy URL is the **`/api/mkt/storage/proxy`** path.

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/channel-translator', () => ({
  getChannelTranslationUrl: vi.fn(),
}));
import { getChannelTranslationUrl } from '../../lib/channel-translator';
import { useChannelTranslation } from '../use-channel-translation';

function wrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}
function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

it('returns html:null for ko and never fetches', async () => {
  const { result } = renderHook(() => useChannelTranslation('c-1', 'base', 'ko'), {
    wrapper: wrapper(makeQc()),
  });
  await new Promise((r) => setTimeout(r, 10));
  expect(result.current.html).toBeNull();
  expect(getChannelTranslationUrl).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it('fetches translated HTML via /api/mkt/storage/proxy when a URL exists', async () => {
  vi.mocked(getChannelTranslationUrl).mockResolvedValue('https://r2/x.html');
  vi.mocked(fetch).mockResolvedValue({ ok: true, text: async () => '<p>hi</p>' } as Response);
  const { result } = renderHook(() => useChannelTranslation('c-1', 'base', 'en'), {
    wrapper: wrapper(makeQc()),
  });
  await waitFor(() => expect(result.current.html).toBe('<p>hi</p>'));
  expect(fetch).toHaveBeenCalledWith(
    '/api/mkt/storage/proxy?url=' + encodeURIComponent('https://r2/x.html')
  );
  expect(result.current.missingFetch).toBe(false);
});

it('sets missingFetch when the proxy fetch fails', async () => {
  vi.mocked(getChannelTranslationUrl).mockResolvedValue('https://r2/x.html');
  vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
  const { result } = renderHook(() => useChannelTranslation('c-1', 'base', 'en'), {
    wrapper: wrapper(makeQc()),
  });
  await waitFor(() => expect(result.current.missingFetch).toBe(true));
  expect(result.current.html).toBeNull();
});

it('returns html:null (not missing) when no translation URL exists', async () => {
  vi.mocked(getChannelTranslationUrl).mockResolvedValue(null);
  const { result } = renderHook(() => useChannelTranslation('c-1', 'base', 'en'), {
    wrapper: wrapper(makeQc()),
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.html).toBeNull();
  expect(result.current.missingFetch).toBe(false);
});
```

- [ ] **Step 2 (run):** `pnpm --filter client test marketing/hooks/__tests__/use-channel-translation`. Expected: **FAIL** (module not found).
- [ ] **Step 3 (impl):** Create `use-channel-translation.ts`. The queryFn returns `{ html, missing }`; the hook maps query state → `{ loading, html, missingFetch }` (CF's return shape).

```ts
import { useQuery } from '@tanstack/react-query';
import { mktKeys } from '../api/queries';
import { getChannelTranslationUrl, type ChannelKind } from '../lib/channel-translator';

export interface ChannelTranslationState {
  loading: boolean;
  html: string | null;
  /** True when a translation record exists but the HTML couldn't be fetched. */
  missingFetch: boolean;
}

/**
 * Loads the translated HTML for a given (content, channel, language).
 * Returns `{ html: null }` on Korean or when no translation exists.
 * TanStack-Query port of the CF useEffect hook; proxy path is the mkt namespace.
 */
export function useChannelTranslation(
  contentId: string | null,
  channel: ChannelKind,
  language: string
): ChannelTranslationState {
  const query = useQuery({
    queryKey: mktKeys.translationHtml(contentId ?? '', channel, language),
    enabled: !!contentId && language !== 'ko',
    queryFn: async (): Promise<{ html: string | null; missing: boolean }> => {
      const url = await getChannelTranslationUrl(contentId as string, language, channel);
      if (!url) return { html: null, missing: false };
      const res = await fetch(`/api/mkt/storage/proxy?url=${encodeURIComponent(url)}`);
      if (!res.ok) return { html: null, missing: true };
      return { html: await res.text(), missing: false };
    },
  });

  return {
    loading: query.isLoading && query.fetchStatus !== 'idle',
    html: query.data?.html ?? null,
    missingFetch: query.data?.missing ?? false,
  };
}
```

> `loading` uses `isLoading && fetchStatus !== 'idle'` so a disabled (ko / no-contentId) query — which TanStack reports as `isLoading:true, fetchStatus:'idle'` — does not show a spinner. (For ko the view early-returns null anyway, but this keeps the flag honest.)

- [ ] **Step 4 (run):** `pnpm --filter client test marketing/hooks/__tests__/use-channel-translation` → **PASS** (4 cases).
- [ ] **Step 5 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6 (commit):**
  ```bash
  git add packages/client/src/features/marketing/hooks/use-channel-translation.ts packages/client/src/features/marketing/hooks/__tests__/use-channel-translation.test.tsx
  git commit -m "feat(marketing): useChannelTranslation (TanStack-Query port; /api/mkt/storage/proxy)"
  ```

### Task 1.3: `components/content/ChannelTranslationView.tsx` — read-only banner (port)

> Port of CF `channel-translation-view.tsx` (50 lines). Props `{ contentId, channel }`. Reads `selectedLanguage` from `useUIStore` (worktree path `../../store/ui-store`); uses `useChannelTranslation`. Renders nothing for ko; otherwise a bordered banner with a `Globe` header (`{LANG} 번역본`), a loading spinner, a "번역되지 않음 — 상단 '번역' 버튼을 눌러주세요" hint (NOTE the worktree button label is **"번역"**, not CF's "AI 번역"), a "번역본을 불러오지 못했습니다" error when `missingFetch`, and the translated HTML via `dangerouslySetInnerHTML` in a `prose` block. **Korean hint text carries `break-keep`** (project RULE — 한글 좁은 컨테이너). This is a port → typecheck → manual-verify component (UI, not unit-testable in isolation; its hook is already tested).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/ChannelTranslationView.tsx`

- [ ] **Step 1 (port):** Create the file. Rewire imports (`@/stores/ui-store` → `../../store/ui-store`, `@/hooks/use-channel-translation` → `../../hooks/use-channel-translation`, `@/lib/channel-translator` → `../../lib/channel-translator`). Drop `'use client'`. Align the hint to the worktree's "번역" button + add `break-keep`:

```tsx
import { Globe, Loader2 } from 'lucide-react';
import { useUIStore } from '../../store/ui-store';
import { useChannelTranslation } from '../../hooks/use-channel-translation';
import type { ChannelKind } from '../../lib/channel-translator';

interface ChannelTranslationViewProps {
  contentId: string;
  channel: ChannelKind;
}

/**
 * Shown above each channel panel when a non-Korean language is selected.
 * Displays the translated HTML stored in R2, or a "not translated" hint. (spec §5.4)
 */
export function ChannelTranslationView({ contentId, channel }: ChannelTranslationViewProps) {
  const selectedLanguage = useUIStore((s) => s.selectedLanguage);
  const { loading, html, missingFetch } = useChannelTranslation(contentId, channel, selectedLanguage);

  if (selectedLanguage === 'ko') return null;

  return (
    <div className="rounded-lg border border-border bg-background mb-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border text-xs">
        <Globe size={12} className="text-primary" />
        <span className="font-medium">{selectedLanguage.toUpperCase()} 번역본</span>
        {loading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
        {!html && !loading && !missingFetch && (
          <span className="text-muted-foreground break-keep">
            번역되지 않음 — 상단 &quot;번역&quot; 버튼을 눌러주세요
          </span>
        )}
        {missingFetch && (
          <span className="text-destructive break-keep">번역본을 불러오지 못했습니다</span>
        )}
      </div>
      {html ? (
        <div
          className="prose prose-sm dark:prose-invert max-w-none px-4 py-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : !loading ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground break-keep">
          아직 번역본이 없습니다
        </div>
      ) : null}
    </div>
  );
}
```

> The `border-border / bg-muted / prose` classes resolve under `.marketing-scope` (gotcha (f)). `prose` requires `@tailwindcss/typography` — verify it is already used by another marketing component (it is, in the blog panels); if the build reports `prose` unrecognized, that is a pre-existing config gap, not introduced here.

- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → **PASS**. Confirm `Globe`/`Loader2` resolve at `lucide-react@^1.17.0`.
- [ ] **Step 3 (manual mount — deferred to Chunk 2):** the view only renders meaningfully when mounted in a panel under a non-ko language with a translation present — fully exercised in Chunk 2's manual flow. No standalone manual step here.
- [ ] **Step 4 (commit):**
  ```bash
  git add packages/client/src/features/marketing/components/content/ChannelTranslationView.tsx
  git commit -m "feat(marketing): ChannelTranslationView read-only banner (non-ko, break-keep hint)"
  ```

---

## Chunk 2: Translate orchestration + per-panel overlays

> Wire the real translate flow (replaces the `ContentTabs` alert stub) and mount the read-only overlay on each translatable panel. This is mostly UI/integration (port → typecheck → manual-verify); one pure helper (the active-tab → `ChannelKind` + source-HTML collector) is extracted and TDD'd because it is the load-bearing translate detail. `LanguageSelector` gains per-language status glyphs. The N-blog Korean-only constraint is already enforced (`KO_ONLY_TABS=['blog']` auto-switch) — confirm it, don't change it.

### Task 2.1: `resolveTranslationSource` pure helper (TDD) — active-tab → ChannelKind + source HTML

> CF's `handleTranslate` reads source via Zustand getters; the worktree reads from the TanStack `ContentGraph` (gotcha: no server data in Zustand — spec §5.1). Extract the mapping `{ activeTab, contentGraph } → { channel, sourceHtml }` into a pure, testable function so the tab→channel map, the loose blog separation (O-1: `self_hosted` vs `naver_blog` both live in `blogContents`, pick by `channel` field, fallback `[0]`), and the builder calls are unit-covered. The function returns `null` for unsupported tabs (shorts) or empty source (caller alerts).

**Files:**
- Create the helper inside `components/content/ContentTabs.tsx` as a top-level exported function (test imports it without rendering).
- Test: `packages/client/src/features/marketing/components/content/__tests__/ContentTabs.helpers.test.ts` (NEW)

- [ ] **Step 1 (test):** The four HTML builders are real (`channel-translator.ts`, already fixed in Chunk 0). Feed a minimal `ContentGraph` and assert the channel mapping + non-empty source for each translatable tab, and `null` for shorts / empty source.

```ts
import { describe, it, expect } from 'vitest';
import { resolveTranslationSource } from '../ContentTabs';
import type { ContentGraph } from '../../../api/queries';

const graph = {
  content: { id: 'c-1' },
  baseArticle: { body: '<p>기본글 본문</p>' },
  blogContents: [
    { channel: 'naver_blog', cards: [{ sort_order: 0, content: { text: '네이버' } }] },
    { channel: 'self_hosted', cards: [{ sort_order: 0, content: { text: '내부' } }] },
  ],
  instagramContents: [
    { caption: 'CAP', cards: [{ sort_order: 0, text_content: '카드', text_style: { title: 'T' } }] },
  ],
  threadsContents: [{ cards: [{ sort_order: 0, text_content: '스레드' }] }],
  youtubeContents: [
    { cards: [{ sort_order: 0, narration_text: '나레', subtitle_text: '자막', screen_direction: '연출' }] },
  ],
} as unknown as ContentGraph;

describe('resolveTranslationSource', () => {
  it('maps base-article → base with the article body', () => {
    const r = resolveTranslationSource('base-article', graph);
    expect(r).not.toBeNull();
    expect(r!.channel).toBe('base');
    expect(r!.sourceHtml).toContain('기본글 본문');
  });
  it('maps self_hosted → self_hosted via the matching blog content', () => {
    const r = resolveTranslationSource('self_hosted', graph);
    expect(r!.channel).toBe('self_hosted');
    expect(r!.sourceHtml).toContain('내부');
  });
  it('maps blog → naver_blog (isNaver true)', () => {
    const r = resolveTranslationSource('blog', graph);
    expect(r!.channel).toBe('naver_blog');
    expect(r!.isNaver).toBe(true);
    expect(r!.sourceHtml).toContain('네이버');
  });
  it('maps cardnews → instagram with caption + slides', () => {
    const r = resolveTranslationSource('cardnews', graph);
    expect(r!.channel).toBe('instagram');
    expect(r!.sourceHtml).toContain('CAP');
    expect(r!.sourceHtml).toContain('data-slide="1"');
  });
  it('maps threads → threads and youtube → youtube', () => {
    expect(resolveTranslationSource('threads', graph)!.channel).toBe('threads');
    expect(resolveTranslationSource('youtube', graph)!.channel).toBe('youtube');
  });
  it('returns null for shorts (unsupported)', () => {
    expect(resolveTranslationSource('shorts', graph)).toBeNull();
  });
  it('returns null when the channel source is empty', () => {
    const empty = { ...graph, threadsContents: [] } as unknown as ContentGraph;
    expect(resolveTranslationSource('threads', empty)).toBeNull();
  });
});
```

- [ ] **Step 2 (run):** `pnpm --filter client test marketing/components/content/__tests__/ContentTabs.helpers`. Expected: **FAIL** (`resolveTranslationSource` not exported).
- [ ] **Step 3 (impl — top-level export in `ContentTabs.tsx`):** Add the helper at module scope. Import the builders + `ChannelKind` from `channel-translator`.

```ts
import {
  buildBlogCardsHtml,
  buildCardnewsHtml,
  buildThreadsHtml,
  buildYoutubeHtml,
  type ChannelKind,
} from '../../lib/channel-translator';
import type { ContentGraph } from '../../api/queries';

export interface TranslationSource {
  channel: ChannelKind;
  sourceHtml: string;
  isNaver: boolean;
}

/**
 * Resolve the active tab → (ChannelKind, source HTML) from the ContentGraph (spec §4.3 step 1-2).
 * Source HTML is built via the already-ported channel-translator builders. Returns null when the
 * tab is unsupported (shorts) or the channel has no source (caller alerts + aborts).
 * Loose blog separation (O-1): self_hosted vs naver_blog both live in blogContents; pick by the
 * `channel` field, falling back to [0].
 */
export function resolveTranslationSource(
  activeTab: string,
  graph: ContentGraph
): TranslationSource | null {
  const pickBlog = (channel: 'naver_blog' | 'self_hosted') =>
    graph.blogContents.find((bc) => (bc as { channel?: string }).channel === channel) ??
    graph.blogContents[0];

  let channel: ChannelKind;
  let sourceHtml = '';
  let isNaver = false;

  switch (activeTab) {
    case 'base-article':
      channel = 'base';
      sourceHtml = graph.baseArticle?.body ?? '';
      break;
    case 'blog': {
      channel = 'naver_blog';
      isNaver = true;
      const bc = pickBlog('naver_blog');
      sourceHtml = bc ? buildBlogCardsHtml(bc.cards) : '';
      break;
    }
    case 'self_hosted': {
      channel = 'self_hosted';
      const bc = pickBlog('self_hosted');
      sourceHtml = bc ? buildBlogCardsHtml(bc.cards) : '';
      break;
    }
    case 'cardnews': {
      channel = 'instagram';
      const ic = graph.instagramContents[0];
      sourceHtml = ic ? buildCardnewsHtml(ic.cards, ic.caption) : '';
      break;
    }
    case 'threads': {
      channel = 'threads';
      const tc = graph.threadsContents[0];
      sourceHtml = tc ? buildThreadsHtml(tc.cards) : '';
      break;
    }
    case 'youtube': {
      channel = 'youtube';
      const yc = graph.youtubeContents[0];
      sourceHtml = yc ? buildYoutubeHtml(yc.cards) : '';
      break;
    }
    default:
      return null; // shorts / unknown — unsupported
  }

  if (!sourceHtml.trim()) return null;
  return { channel, sourceHtml, isNaver };
}
```

- [ ] **Step 4 (run):** `pnpm --filter client test marketing/components/content/__tests__/ContentTabs.helpers` → **PASS** (7 cases). *(You may need to complete Task 2.2's `ContentTabs` edits before the file fully typechecks; if so, add this helper + its imports first, run this test green, then complete 2.2. State which order you took.)*
- [ ] **Step 5:** No separate commit — fold into Task 2.2's commit (the helper lives in `ContentTabs.tsx`).

### Task 2.2: `ContentTabs.tsx` — real `handleTranslate` + status state + pass to `LanguageSelector`

> Replace the alert stub (`:92-95`) with a real flow that uses `resolveTranslationSource` + the `useTranslateChannel` mutation, tracks per-language status, and passes `translationStatuses` to `LanguageSelector`. `ContentTabs` already holds `contentGraph` (`useContent(selectedContentId)`), `project`, `activeTab`, `selectedLanguage` — no new fetch.

**Files:**
- Modify: `packages/client/src/features/marketing/components/content/ContentTabs.tsx`

- [ ] **Step 1 (impl — imports + state + handler):** Add imports: `useState` already imported; add `import { useTranslateChannel } from '../../api/use-translations';` and the builders/helper imports from Task 2.1 Step 3. Inside the component, after the existing hooks:

```tsx
  const translateChannel = useTranslateChannel();
  const [translationStatuses, setTranslationStatuses] = useState<Record<string, string>>({});

  const handleTranslate = async (lang: string) => {
    if (lang === 'ko') return;
    if (!contentGraph || !project) return;
    const resolved = resolveTranslationSource(activeTab, contentGraph);
    if (!resolved) {
      alert('번역할 내용이 없습니다. 먼저 이 채널의 콘텐츠를 생성해 주세요.');
      return;
    }
    setTranslationStatuses((s) => ({ ...s, [lang]: 'translating' }));
    try {
      await translateChannel.mutateAsync({
        projectId: project.id,
        contentId: contentGraph.content.id,
        project,
        targetLang: lang,
        channel: resolved.channel,
        sourceHtml: resolved.sourceHtml,
        isNaver: resolved.isNaver,
      });
      setTranslationStatuses((s) => ({ ...s, [lang]: 'completed' }));
    } catch (err) {
      setTranslationStatuses((s) => ({ ...s, [lang]: 'none' }));
      alert(`번역 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
```

> `contentGraph` here is the `ContentGraph` (from `useContent`), so `contentGraph.content.id` is the content id. `activeTab` is the current `TabId`. The mutation invalidates the translation keys on success (Task 1.1), so the mounted `ChannelTranslationView` / base overlay refetches automatically — no manual refetch.

- [ ] **Step 2 (impl — wire LanguageSelector):** Replace the stub `<LanguageSelector … onTranslate={(lang) => { alert(...) }} />` (`:90-96`) with:

```tsx
      <LanguageSelector
        targetLanguages={targetLanguages}
        translationStatuses={translationStatuses}
        onTranslate={handleTranslate}
      />
```

- [ ] **Step 3 (typecheck):** `pnpm --filter client typecheck`. Expected **FAIL** until Task 2.3 adds the `translationStatuses` prop to `LanguageSelector` — that is fine; do Task 2.3 next, then re-run. (If you prefer a green gate per task, do Task 2.3 Step 1 before this Step 3.)
- [ ] **Step 4:** Commit folds in Task 2.1's helper + this wiring (after Task 2.3 makes it typecheck):
  ```bash
  git add packages/client/src/features/marketing/components/content/ContentTabs.tsx packages/client/src/features/marketing/components/content/__tests__/ContentTabs.helpers.test.ts
  git commit -m "feat(marketing): real handleTranslate in ContentTabs (resolveTranslationSource + useTranslateChannel + statuses)"
  ```

### Task 2.3: `LanguageSelector.tsx` — accept `translationStatuses` + per-lang status glyph

> Keep the worktree's current prop shape (`{ targetLanguages, onTranslate }`) — do **not** regress to CF's publish-bar version (publish = Phase 3). Add an optional `translationStatuses?: Record<string,string>`. For each non-ko language, render the existing `번역` button plus a small status glyph and disable the button while `translating`.

**Files:**
- Modify: `packages/client/src/features/marketing/components/content/LanguageSelector.tsx`

- [ ] **Step 1 (impl):** Extend the props + the per-language render. Add `Check`/`Loader2` to the lucide import; add the prop; render the glyph.

```tsx
import { Globe, Check, Loader2 } from 'lucide-react';
// …
interface LanguageSelectorProps {
  targetLanguages: string[];
  onTranslate: (lang: string) => void;
  /** Per-language translate status: 'translating' | 'completed' | 'none'/undefined. */
  translationStatuses?: Record<string, string>;
}

export function LanguageSelector({
  targetLanguages,
  onTranslate,
  translationStatuses = {},
}: LanguageSelectorProps) {
```

  Inside the `lang !== 'ko' && isSelected` block, replace the lone `번역` button with the button + glyph and the disabled state:

```tsx
            {lang !== 'ko' && isSelected && (
              <div className="flex items-center gap-0.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-1.5 text-xs"
                  disabled={translationStatuses[lang] === 'translating'}
                  onClick={() => onTranslate(lang)}
                >
                  번역
                </Button>
                {translationStatuses[lang] === 'translating' && (
                  <Loader2 size={11} className="animate-spin text-muted-foreground" />
                )}
                {translationStatuses[lang] === 'completed' && (
                  <Check size={11} className="text-green-600" />
                )}
              </div>
            )}
```

> Source of languages stays `project.target_languages` with ko pinned first (the existing `langs = ['ko', ...]` line, O-4); `SUPPORTED_LANGUAGES` still supplies flag/label via `getLangLabel`.

- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → **PASS** (now that both `ContentTabs` passes the prop and `LanguageSelector` accepts it). Confirm `Check`/`Loader2` resolve at `^1.17.0`.
- [ ] **Step 3 (commit):**
  ```bash
  git add packages/client/src/features/marketing/components/content/LanguageSelector.tsx
  git commit -m "feat(marketing): LanguageSelector per-language translate status glyph + disable-while-translating"
  ```

### Task 2.4: Mount the translated-HTML overlay in each panel

> base-article uses an inline overlay (reads its own translation); the other five panels mount `<ChannelTranslationView contentId={content.id} channel={…} />` near the top of their body. Each panel already receives `content` from `ContentTabs`, so `content.id` is available. **N-blog (`naver_blog`)**: its tab is hidden under non-ko (`KO_ONLY_TABS`), so the overlay there will effectively never show under a non-ko language — still mount it for parity/completeness (harmless; returns null for ko). This is port → typecheck → manual-verify (UI). Channel constants: blog → `'naver_blog'`, internal → `'self_hosted'`, cardnews → `'instagram'`, threads → `'threads'`, youtube → `'youtube'`, base → `'base'`.

**Files:**
- Modify: `BlogPanel.tsx`, `InternalBlogPanel.tsx`, `CardNewsPanel.tsx`, `ThreadsPanel.tsx`, `YoutubePanel.tsx`, `BaseArticlePanel.tsx`

- [ ] **Step 1 (blog / internal / cardnews / threads / youtube):** In each of the five panels, import `ChannelTranslationView` and mount it at the top of the panel body (just inside the outer scroll container, above the channel content / version list). For panels with an outer/inner split (Threads/Youtube/CardNews/Blog mount in the **outer** component where `content` is in scope; place it above `<ChannelContentList …>`). Example for `ThreadsPanel` outer:

```tsx
import { ChannelTranslationView } from './ChannelTranslationView';
// …in the outer panel's returned JSX, near the top of the scroll body:
        <div className="flex-1 overflow-y-auto p-3">
          <ChannelTranslationView contentId={content.id} channel="threads" />
          <ChannelContentList … />
        </div>
```

  Apply the analogous one-line mount in:
  - `BlogPanel.tsx` → `channel="naver_blog"`
  - `InternalBlogPanel.tsx` → `channel="self_hosted"`
  - `CardNewsPanel.tsx` → `channel="instagram"`
  - `YoutubePanel.tsx` → `channel="youtube"`
  Read each panel first to find the correct outer-body insertion point (each has a `flex-1 overflow-y-auto` or equivalent scroll container holding the version list — mount immediately inside it).

- [ ] **Step 2 (base-article inline overlay):** `BaseArticlePanel.tsx` already imports `useUIStore` (`:17`) and reads `baseArticle` via `useContent` (`:46-47`). In `BaseArticlePanelInner`, add the `useChannelTranslation` read + render the overlay above the editor when `selectedLanguage !== 'ko'`. Import `ChannelTranslationView` (reuse the shared component — simplest + consistent) and mount it above the `<BaseArticleEditor>` in the returned JSX:

```tsx
import { ChannelTranslationView } from './ChannelTranslationView';
// …inside BaseArticlePanelInner's returned JSX, above the editor toolbar/editor:
      <ChannelTranslationView contentId={content.id} channel="base" />
```

  > Decision (O-1d-A, confirmed): the base overlay uses `mkt_translations` via `ChannelTranslationView` like every other channel — do **NOT** replicate CF's legacy `factcheck_report.translations[lang]` write (dead-weight legacy sync). The Korean editor stays visible/usable for ko; for non-ko the read-only banner shows above it (or "번역되지 않음"). Reusing `ChannelTranslationView` (rather than a bespoke inline read) keeps one code path; the spec's "inline overlay" is satisfied by mounting the same component inside the base panel.

- [ ] **Step 3 (typecheck):** `pnpm --filter client typecheck` → **PASS** (six one-line mounts + imports).
- [ ] **Step 4 (manual-verify @superpowers:verification-before-completion):** `pnpm dev`; open `/marketing/content`; pick a project with `target_languages` including a non-ko language (e.g. `['ko','en']` — if none, set one in 프로젝트 설정) and a content with a base article + at least one cardnews/threads/youtube version.
  - **Base article:** write ko content → switch language to `en` (via `LanguageSelector`) → base panel shows the `en 번역본` banner with "번역되지 않음 — 상단 '번역' 버튼을 눌러주세요" → click `번역` → glyph goes ⏳ → ✓ → the translated HTML banner renders. **Reload** → banner persists (graph + translation query refetch).
  - **cardnews / threads / youtube / internal-blog:** for each, under `en`, the `ChannelTranslationView` shows "번역되지 않음" → `번역` → ✓ → translated banner.
  - **N블로그:** confirm the `blog` tab **disappears** under `en` and **reappears** under `ko` (KO_ONLY_TABS auto-switch). (So N-blog is never translated via the UI — expected.)
  - **Error path:** translate a channel with empty source (e.g. a content with no cardnews version, on the cardnews tab) → `alert('번역할 내용이 없습니다…')`, status not set.
  - 🔴 **RLS guard:** in Supabase (or `mcp__supabase__execute_sql` `select user_id, channel_type, language from mkt_translations limit 5`), confirm inserted rows have a non-null `user_id`. NULL → the C-2 stamping is broken; fix before proceeding.
  - 🔴 **Content-type sanity (I-1):** open DevTools Network, find the `/api/mkt/storage/proxy?url=…html` request → `Content-Type: text/html`.
- [ ] **Step 5 (commit):**
  ```bash
  git add packages/client/src/features/marketing/components/content/BlogPanel.tsx packages/client/src/features/marketing/components/content/InternalBlogPanel.tsx packages/client/src/features/marketing/components/content/CardNewsPanel.tsx packages/client/src/features/marketing/components/content/ThreadsPanel.tsx packages/client/src/features/marketing/components/content/YoutubePanel.tsx packages/client/src/features/marketing/components/content/BaseArticlePanel.tsx
  git commit -m "feat(marketing): mount ChannelTranslationView overlay on all translatable panels (base inline + 5 channels)"
  ```

---

## Chunk 3: Image editor (annotation dialog) + wiring

> Port the ~780-line annotation editor (`ImageEditorDialog`) onto the worktree, applying the **I-2 proxy-draw fallback** in its Canvas composite (the single most important correctness fix vs a verbatim port), then re-enable `onEdit` on `ImageCardWidget` (reversing O-7) and wire the two callsites (`BlogCardItem` via blog/internal-blog, `YoutubePanel`) to open it and save the annotated WebP back to R2. The pure scale/history/arrowhead/proxy helpers are already extracted + tested in Chunk 0 (Task 0.4) — the dialog **imports** them, so its `handleSave` is the only non-trivial new code, and it is built on the tested helpers. This chunk is **port → typecheck → manual-verify → commit** (Canvas + pointer UI; not unit-testable in jsdom). Sequence Chunk 3 **after** Chunk 2 to avoid edit collisions on `YoutubePanel.tsx`.

### Task 3.1: `ImageEditorDialog.tsx` — port the annotation editor (uses Chunk 0 helpers + I-2 composite)

> Port `C:\projects\contentflow\contentflow\src\components\content\image-editor-dialog.tsx` (~780 lines) with these mechanical adaptations: strip `'use client'` + the `@next/next/no-img-element` eslint comment; `Button` from `../../ui/button`, `cn` from `../../lib/utils`; **import `EditorElement`/`ToolType`/`clamp` + the history reducer + `scalePoint`/`arrowheadPoints`/`loadImageWithProxy` from `../../lib/image-editor-canvas`** (do NOT redefine them inline — the pure module is the single source of truth); and rewrite `handleSave` to use `loadImageWithProxy` + the scale helpers (the I-2 fix). Everything else (tools, pointer interactions, SVG overlay, arrowhead markers, text editing, properties panel) is verbatim.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/ImageEditorDialog.tsx`

- [ ] **Step 1 (port the shell + state, using the extracted types):** Copy the CF file. Replace its inline `type ToolType` / `type EditorElement` / `function clamp` with imports from `image-editor-canvas` (the dialog and the pure helpers MUST share one `EditorElement` type). The component keeps `useState`/`useRef` state (`tool`, `elements`, `selectedId`, `editingId`, `history`, `historyIndex`, `drawingRef`, `draggingRef`) and the reset-on-open effect **verbatim**, BUT route `pushHistory`/`undo`/`redo` through the tested reducer:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { MousePointer2, Type, Minus, ArrowRight, Square, Undo2, Redo2, Trash2, Save, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../lib/utils';
import {
  type EditorElement,
  type ToolType,
  clamp,
  historyPush,
  historyUndo,
  historyRedo,
  scalePoint,
  arrowheadPoints,
  loadImageWithProxy,
} from '../../lib/image-editor-canvas';

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  onSave: (dataUrl: string) => void;
}
```

  Reducer wiring (replaces CF's inline `pushHistory`/`undo`/`redo` bodies — same external behavior, now delegating to the tested pure functions):

```tsx
  const [history, setHistory] = useState<EditorElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback(
    (next: EditorElement[]) => {
      const s = historyPush({ history, index: historyIndex }, next);
      setHistory(s.history);
      setHistoryIndex(s.index);
      setElements(next);
    },
    [history, historyIndex]
  );
  const undo = useCallback(() => {
    const s = historyUndo({ history, index: historyIndex });
    if (s.index === historyIndex) return;
    setHistoryIndex(s.index);
    setElements(history[s.index]);
    setSelectedId(null);
    setEditingId(null);
  }, [history, historyIndex]);
  const redo = useCallback(() => {
    const s = historyRedo({ history, index: historyIndex });
    if (s.index === historyIndex) return;
    setHistoryIndex(s.index);
    setElements(history[s.index]);
    setSelectedId(null);
    setEditingId(null);
  }, [history, historyIndex]);
```

- [ ] **Step 2 (port pointer/keyboard/render verbatim):** Port **verbatim** (no logic change): the keyboard-shortcut effect (Delete/Backspace/Ctrl-Z/Ctrl-Shift-Z/Ctrl-Y/Escape, CF :128-151); `getRelPos` (CF :153-158); `handleElementPointerDown` (drag in select mode; lines/arrows move both endpoints, CF :160-204); `handleCanvasPointerDown` (text drops a `텍스트` element then returns to select; line/arrow/rect draw with `window` pointermove/up; rect normalizes via `Math.min`/`Math.abs`, CF :206-288); `updateElement` (CF :290-297); `deleteSelected` (CF :119-126); the toolbar (5 tools + undo/redo/delete/save/close, CF :399-470); the canvas area `<img>` background (`object-contain`, `max-h-[70vh]`, plain `<img>` — drop the Next eslint-disable) (CF :472-487); the `<svg>` overlay with per-arrow `<marker id="arrowhead-${el.id}">` defs + wider transparent hit-line + dashed blue selection outline (CF :489-573); the absolutely-positioned text `<div>`s with double-click → inline `<textarea>` editing (CF :575-645); and the bottom properties panel (text 내용/크기/색상/Bold/그림자; line+arrow 두께/색상; rect 채우기/테두리/두께; uses `clamp` from the pure module) (CF :648-777). `crypto.randomUUID()` for element ids is fine (browser-native; if a lint rule flags it, swap to `generateId()` from `../../lib/utils`).

- [ ] **Step 3 (rewrite `handleSave` with the I-2 proxy-draw fallback + scale helpers):** This is the only substantive change. Replace CF's `handleSave` (`:300-383`, which sets `crossOrigin` but has **no** proxy fallback → taints the canvas wherever R2 CORS isn't live). Use `loadImageWithProxy` (Chunk 0) + `scalePoint`/`arrowheadPoints`:

```tsx
  const handleSave = useCallback(async () => {
    const displayRect = canvasRef.current?.getBoundingClientRect();
    if (!displayRect) return;

    let img: HTMLImageElement;
    try {
      img = await loadImageWithProxy(src); // I-2: direct → proxy fallback → reject if both fail
    } catch {
      alert('이미지를 불러오지 못해 저장할 수 없습니다.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const scaleX = img.naturalWidth / displayRect.width;
    const scaleY = img.naturalHeight / displayRect.height;

    for (const el of elements) {
      ctx.save();
      if (el.type === 'text') {
        const fs = (el.fontSize || 16) * scaleX;
        ctx.font = `${el.fontWeight || 'normal'} ${fs}px sans-serif`;
        ctx.fillStyle = el.color;
        ctx.textBaseline = 'top';
        if (el.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 4 * scaleX;
          ctx.shadowOffsetX = 2 * scaleX;
          ctx.shadowOffsetY = 2 * scaleX;
        }
        const p = scalePoint(el.x, el.y, scaleX, scaleY);
        (el.text || '').split('\n').forEach((line, i) => {
          ctx.fillText(line, p.x, p.y + i * fs * 1.2);
        });
      } else if (el.type === 'line' || el.type === 'arrow') {
        const a = scalePoint(el.x, el.y, scaleX, scaleY); // tail
        const b = scalePoint(el.x2 ?? el.x, el.y2 ?? el.y, scaleX, scaleY); // tip
        ctx.strokeStyle = el.color;
        ctx.lineWidth = (el.strokeWidth || 3) * scaleX;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (el.type === 'arrow') {
          const { p1, p2 } = arrowheadPoints({
            tipX: b.x, tipY: b.y, tailX: a.x, tailY: a.y, headLen: 15 * scaleX,
          });
          ctx.fillStyle = el.color;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.closePath();
          ctx.fill();
        }
      } else if (el.type === 'rect') {
        const r = scalePoint(el.x, el.y, scaleX, scaleY);
        const rw = (el.rectWidth || 0) * scaleX;
        const rh = (el.rectHeight || 0) * scaleY;
        if (el.fillColor && el.fillColor !== 'transparent') {
          ctx.fillStyle = el.fillColor;
          ctx.fillRect(r.x, r.y, rw, rh);
        }
        if (el.borderColor && (el.borderWidth || 0) > 0) {
          ctx.strokeStyle = el.borderColor;
          ctx.lineWidth = (el.borderWidth || 2) * scaleX;
          ctx.strokeRect(r.x, r.y, rw, rh);
        }
      }
      ctx.restore();
    }

    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL('image/webp', 0.85); // throws SecurityError if STILL tainted
    } catch {
      alert('이미지 저장에 실패했습니다 (canvas 보안 오류).');
      return;
    }
    if (!dataUrl || dataUrl === 'data:,') {
      alert('이미지 저장에 실패했습니다.');
      return;
    }
    onSave(dataUrl);
    onOpenChange(false);
  }, [src, elements, onSave, onOpenChange]);
```

  > Why this is the I-2 fix: `loadImageWithProxy` first tries `crossOrigin='anonymous'` (untainted if R2 CORS is live) and, on CORS rejection, retries via the same-origin `/api/mkt/storage/proxy` (always untainted). The `toDataURL` is wrapped so a *still*-tainted canvas surfaces an alert instead of throwing/saving blank. **data: URLs** (a freshly-edited-then-re-edited image) skip the proxy (already same-origin) — `loadImageWithProxy` handles that. R2 bucket CORS is assumed **NOT** live (rely on the fallback; do not change live R2 config — the fallback works either way).

- [ ] **Step 4 (typecheck):** `pnpm --filter client typecheck` → **PASS**. Confirm the lucide icons (`MousePointer2,Type,Minus,ArrowRight,Square,Undo2,Redo2,Trash2,Save,X`) resolve at `^1.17.0`; confirm **no** `'use client'`, `@next/next/no-img-element`, or inline `EditorElement`/`clamp`/`scaleX = …` math left (it now lives in `image-editor-canvas.ts`).
- [ ] **Step 5 (manual smoke — deferred to Task 3.3):** the dialog has no callsite yet; full manual verification happens once `ImageCardWidget.onEdit` opens it (Task 3.3).
- [ ] **Step 6 (commit):**
  ```bash
  git add packages/client/src/features/marketing/components/content/ImageEditorDialog.tsx
  git commit -m "feat(marketing): port ImageEditorDialog annotation editor + I-2 proxy-draw composite (reuses pure helpers)"
  ```

### Task 3.2: `ImageCardWidget.tsx` — re-enable `onEdit` (reverse O-7)

> Change `onEdit?: undefined` → `onEdit?: () => void` and re-add the Pencil edit button in the hover action bar (CF image-card-widget.tsx:135-139), rendered only when `onEdit` is provided **and** `src` exists. The worktree widget's hover bar is the **top** action bar (`:127-204`); add the Pencil button alongside Zoom/Regenerate/Upload/Download/Delete, styled to match the worktree's `bg-black/50 … h-6 w-6` buttons (not CF's `bg-black/40`).

**Files:**
- Modify: `packages/client/src/features/marketing/components/content/ImageCardWidget.tsx`

- [ ] **Step 1 (impl — prop):** Add `Pencil` to the lucide import (`:2-11`) and change the prop (`:28-29`):

```tsx
import { ZoomIn, RefreshCw, Download, Upload, Trash2, Loader2, ImageIcon, RotateCcw, Pencil } from 'lucide-react';
// …in the props interface:
  /** Open the in-app annotation editor (ImageEditorDialog). Provide to show the Pencil button. */
  onEdit?: () => void;
```

  Add `onEdit` to the destructured props (`:36-50`).

- [ ] **Step 2 (impl — button):** In the top hover action bar, after the Zoom button (`:130-141`) and before Regenerate, add:

```tsx
            {/* Edit (annotation) */}
            {src && onEdit && (
              <Button
                size="icon-xs"
                variant="secondary"
                onClick={onEdit}
                title="이미지 편집"
                className="h-6 w-6 bg-black/50 text-white border-none hover:bg-blue-600/80"
              >
                <Pencil size={12} />
              </Button>
            )}
```

- [ ] **Step 3 (typecheck):** `pnpm --filter client typecheck` → **PASS**. The two existing callsites (`BlogCardItem.tsx:289` passes `onEdit={undefined}`, `YoutubePanel.tsx:582` omits `onEdit`) still typecheck (`undefined` is assignable to `(() => void) | undefined`). The Pencil button simply does not render where `onEdit` is absent — no behavior change until Task 3.3 wires it.
- [ ] **Step 4 (commit):**
  ```bash
  git add packages/client/src/features/marketing/components/content/ImageCardWidget.tsx
  git commit -m "feat(marketing): re-enable ImageCardWidget.onEdit + Pencil button (reverse O-7)"
  ```

### Task 3.3: Wire the two `ImageCardWidget` callsites to open the editor + save to R2

> Reverse the O-7 deferral **uniformly** at every `ImageCardWidget` usage (confirmed: exactly two — `BlogCardItem.tsx` for blog/internal-blog cards, and `YoutubePanel.tsx` for youtube scenes; CardNews renders its own Canvas, not `ImageCardWidget`). Each callsite passes a real `onEdit` that opens `<ImageEditorDialog>` and, on save, converts the WebP data URL → Blob (`base64ToBlob`) → `uploadToR2` → writes the new `publicUrl` through that card's **existing** image-write path. Reusing the existing write path means the edited image flows through the same persistence + `user_id` handling as a fresh upload — only the source differs.

**Files:**
- Modify: `packages/client/src/features/marketing/components/content/BlogCardItem.tsx`
- Modify: `packages/client/src/features/marketing/components/content/YoutubePanel.tsx`

- [ ] **Step 1 (BlogCardItem — local dialog state + onEdit + save path):** `BlogCardItem` already has `onUpdate(cardId, content)` (writes `{ url }` into the card — the same field the editor produces) and `projectId`/`contentId` in scope (the parent `BlogPanel`/`InternalBlogPanel` provides `contentId`; the card row carries `blog_content_id`; `projectId` comes from the panel — confirm it is threaded, else add it to `BlogCardItemProps`). Add dialog state + the save handler. Read `BlogCardItem.tsx` first; add near the top of the component:

```tsx
import { useState } from 'react'; // (already imported — reuse)
import { ImageEditorDialog } from './ImageEditorDialog';
import { uploadToR2 } from '../../api/use-r2-upload';
import { base64ToBlob } from '../../lib/image-utils';
// …inside the component:
  const [editorOpen, setEditorOpen] = useState(false);

  const handleSaveEdited = async (dataUrl: string) => {
    try {
      const blob = base64ToBlob(dataUrl); // data:image/webp;base64,… → Blob
      const { publicUrl } = await uploadToR2(blob, {
        projectId,
        category: 'content',
        contentType: 'image/webp',
        contentId,
      });
      onUpdate(card.id, { url: publicUrl }); // same write path as upload/regenerate
    } catch (err) {
      alert(`이미지 저장 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
```

  Set `onEdit` on the widget (replace `onEdit={undefined}` at `:289`) and render the dialog:

```tsx
        <ImageCardWidget
          src={c.url}
          // …existing props…
          onEdit={c.url ? () => setEditorOpen(true) : undefined}
          // …
        />
        {c.url && (
          <ImageEditorDialog
            open={editorOpen}
            onOpenChange={setEditorOpen}
            src={c.url}
            onSave={handleSaveEdited}
          />
        )}
```

  > **`projectId` in `BlogCardItem`:** if `BlogCardItemProps` does not already include `projectId`, add `projectId: string;` to the interface and thread it from `BlogPanel`/`InternalBlogPanel` (both have `project.id` in scope — they render `<BlogCardItem … />`). This is the only new prop plumbing in Chunk 3; verify during implementation. (The card-image **generation** path already uploads to R2 inside `useCardImageGeneration.onSave`, so the panel definitely has `project.id` available.)

- [ ] **Step 2 (YoutubePanel — onEdit on the scene image):** `YoutubePanel`'s `<ImageCardWidget src={selectedCard.image_url ?? undefined} …>` (`:582`) already has `handleCardUpdate(cardId, { image_url })` (the structural-field write — persists immediately) + `project.id` + `contentId` in scope. Add dialog state in `YoutubePanelInner` + `onEdit` + save:

```tsx
import { ImageEditorDialog } from './ImageEditorDialog';
import { uploadToR2 } from '../../api/use-r2-upload';
import { base64ToBlob } from '../../lib/image-utils';
// …inside YoutubePanelInner:
  const [editorOpen, setEditorOpen] = useState(false);

  const handleSaveEditedScene = async (dataUrl: string) => {
    if (!selectedCard) return;
    try {
      const blob = base64ToBlob(dataUrl);
      const { publicUrl } = await uploadToR2(blob, {
        projectId: project.id,
        category: 'images',
        contentType: 'image/webp',
        contentId,
      });
      handleCardUpdate(selectedCard.id, { image_url: publicUrl }); // existing write path (immediate)
    } catch (err) {
      alert(`이미지 저장 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
```

  On the widget add `onEdit={selectedCard.image_url ? () => setEditorOpen(true) : undefined}` and render the dialog right after it:

```tsx
              <ImageCardWidget
                src={selectedCard.image_url ?? undefined}
                // …existing props…
                onEdit={selectedCard.image_url ? () => setEditorOpen(true) : undefined}
              />
              {selectedCard.image_url && (
                <ImageEditorDialog
                  open={editorOpen}
                  onOpenChange={setEditorOpen}
                  src={selectedCard.image_url}
                  onSave={handleSaveEditedScene}
                />
              )}
```

- [ ] **Step 3 (typecheck):** `pnpm --filter client typecheck` → **PASS**.
- [ ] **Step 4 (manual-verify @superpowers:verification-before-completion):** `pnpm dev`; `/marketing/content`.
  - **Youtube scene image:** select a content with a youtube version that has a scene image (generate one if needed via 이미지 생성) → hover the 16:9 `ImageCardWidget` → click the **Pencil** → the full-screen editor opens with the image as background.
    - Add **text** (click Text tool, click canvas, type; double-click to edit), a **line**, an **arrow** (verify the arrowhead renders), a **rect** (verify fill/border properties). Drag elements in **select** mode. **Undo/Redo** (toolbar + Ctrl-Z / Ctrl-Shift-Z). **Delete** a selected element (toolbar + Delete key). **Escape** clears selection.
    - **저장** → editor closes → the scene `ImageCardWidget` updates to the annotated WebP. **Reload** → the new image persists (graph refetch; the R2 URL was written via `handleCardUpdate`).
    - **Re-edit** the now-saved image (its src is the new R2 URL) → annotate again → save → updates again. (Exercises the proxy-draw path twice.)
  - **Blog/internal-blog card image:** in a blog (ko) or internal-blog version with a card image → Pencil on its `ImageCardWidget` → annotate → 저장 → the card image updates; reload persists.
  - 🔴 **I-2 proxy-draw verification:** R2 bucket CORS is assumed not live, so the **direct** `crossOrigin` load taints and the editor **must** fall back to `/api/mkt/storage/proxy` and still export successfully (not a blank/black image, no console `SecurityError` that aborts the save). In DevTools Network, confirm a `…/storage/proxy?url=…(webp|png)` request fires during 저장 when the source is an R2 URL. If the export is blank or the save alerts a security error, the proxy fallback is misweired — fix `loadImageWithProxy`/`handleSave` before claiming done. (If R2 CORS *is* live, the direct load succeeds and no proxy request fires — also correct.)
- [ ] **Step 5 (commit):**
  ```bash
  git add packages/client/src/features/marketing/components/content/BlogCardItem.tsx packages/client/src/features/marketing/components/content/YoutubePanel.tsx
  git commit -m "feat(marketing): wire ImageCardWidget.onEdit → ImageEditorDialog → base64ToBlob → uploadToR2 (blog + youtube)"
  ```

---

## Chunk 4: Verification (full suite + manual E2E + scope confirmation)

> @superpowers:verification-before-completion — run every gate and confirm output before any "done" claim. Evidence before assertions.

### Task 4.1: Automated gates

**Files:** none (verification only).

- [ ] **Step 1 (unit tests):** `pnpm --filter client test marketing` → all marketing tests green, including the **new** files: `channel-translator` (builders + contract + upsert + getUrl), `image-editor-canvas` (scale + history + arrowhead + url helpers), `use-translations` (mutation invalidation + url query), `use-channel-translation` (4 cases), and `ContentTabs.helpers` (`resolveTranslationSource`) — on top of the existing marketing suite (the worktree had 33 marketing test files before 1d; 1d adds 5 new files). Record the exact file/test counts. Pre-existing non-marketing failures (auth/RequireAuthedWithPin, games/SpeakingPlayer, viewer/GameListViewer — jsdom `window.matchMedia`) are unchanged and out of scope.
- [ ] **Step 2 (typecheck):** `pnpm typecheck` (all packages) → **PASS** (shared/server/client clean). The `Translation.user_id` add, the `mktKeys` + `getCurrentUserId` additions, the `channel-translator` rewrite, the new hooks/view/editor, and the panel edits must not introduce any error. The server `storage.controller.ts` html-map edit is covered by `pnpm --filter server typecheck` (also part of `pnpm typecheck`).
- [ ] **Step 3 (lint):** `pnpm lint` → **no new errors** from 1d code. Confirm no leftover `'use client'`, `@next/next/no-img-element` in the two new components (`ChannelTranslationView.tsx`, `ImageEditorDialog.tsx`). Pre-existing remotion TS-parse errors + pre-existing warnings are unchanged.
- [ ] **Step 4 (build):** `pnpm --filter client build` → **PASS**. Pre-existing chunk-size warning is unchanged; no new build errors. (If `prose` classes warn, that is the pre-existing `@tailwindcss/typography` config — not introduced here.)
- [ ] **Step 5:** No commit (verification only).

### Task 4.2: Static scope + namespace sanity

**Files:** none (verification only).

- [ ] **Step 1 (namespace — the 🔴 drift guard):** confirm NO `/api/ai/` or `/api/storage/` (non-`mkt`) path was introduced by 1d. Run:
  ```bash
  grep -rn "/api/ai/translate\|/api/storage/proxy" packages/client/src/features/marketing
  ```
  Expected: **every** hit is the `/api/mkt/...` form (i.e. `/api/mkt/ai/translate` in `channel-translator.ts`, `/api/mkt/storage/proxy` in `use-channel-translation.ts` + `image-editor-canvas.ts`). A bare `/api/ai/translate` or `/api/storage/proxy` (without `mkt`) is a defect — fix it. (CF used the non-`mkt` paths; the port must not leak them.)
- [ ] **Step 2 (dead-bridge guard):** `grep -rn "_setUploadToR2\|_uploadToR2" packages/client/src/features/marketing` → **0 results** (Task 0.3 (d) deleted the bridge; nothing should reference it).
- [ ] **Step 3 (wrong-table guard):** `grep -rn "from('translations')\|from(\"translations\")" packages/client/src/features/marketing` → **0 results** (every translation query must hit `mkt_translations`, the C-1 fix). Also confirm `grep -rn "mkt_translations" …/lib/channel-translator.ts` shows the three uses (select + update + insert).
- [ ] **Step 4 (translation overlay present, non-ko only):** `grep -rn "ChannelTranslationView" packages/client/src/features/marketing/components/content` → mounted in `BlogPanel`, `InternalBlogPanel`, `CardNewsPanel`, `ThreadsPanel`, `YoutubePanel`, `BaseArticlePanel` (six panels) + its own definition. The component early-returns null for ko, so it only renders under a non-ko language.
- [ ] **Step 5 (image edit button present uniformly — O-7 reversed):** `grep -rn "onEdit" packages/client/src/features/marketing/components/content` → `ImageCardWidget` declares `onEdit?: () => void`; both callsites (`BlogCardItem.tsx`, `YoutubePanel.tsx`) pass a real `onEdit` (conditioned on an existing image). `grep -rn "onEdit?: undefined" …` → **0 results** (O-7 fully reversed).
- [ ] **Step 6 (N-blog ko-only):** `KO_ONLY_TABS` in `ContentTabs.tsx` still `['blog']` (unchanged) — the N블로그 tab is hidden under non-ko, so `naver_blog` is never the active translate target via the UI (expected; `buildBlogCardsHtml`/`isNaver` stay wired for parity).
- [ ] **Step 7 (out-of-scope confirmation):** keyword research panels, publishing (`mkt_publish_records`, schedule/예약), analytics (GA4/funnel), strategy generation, and the translation **review** lane (`status='review'`, side-by-side diff) remain **absent** — 1d adds none of them. `grep -rn "mkt_publish_records\|reviewed_at" packages/client/src/features/marketing/{api,hooks,components}` → no 1d additions (the `Translation.reviewed_at` field already existed in the type; nothing in 1d writes it).

### Task 4.3: RLS + data sanity

**Files:** none (verification only).

- [ ] **Step 1 (RLS note):** Phase 1d adds **no DDL** and **no SECURITY DEFINER functions** — all `mkt_translations` RLS policies (single-owner `user_id = auth.uid()` `with check`) are unchanged. The **C-2 `user_id` stamping** in `channel-translator.ts` (insert branch) is what makes inserts pass the `with check`. No `GRANT EXECUTE` needed (memory RULE n/a).
- [ ] **Step 2 (data guard — translations):** after the Chunk 2 manual flow, in Supabase (or `mcp__supabase__execute_sql`, project ref `fxzwigjkbsptvsjraqwa`): `select user_id, content_id, language, channel_type, status, body from mkt_translations limit 5` → every row has a **non-null `user_id`**, `status='completed'`, and `body` = an R2 URL (not inline HTML). NULL `user_id` → the C-2 fix is broken.
- [ ] **Step 3 (data guard — edited images):** after the Chunk 3 manual flow, confirm the edited youtube scene's `mkt_youtube_cards.image_url` (and the blog card's `url`) now point at a **new** R2 URL (the annotated WebP), and the card row's `user_id` is intact (the edit reused the existing write path, which already stamps `user_id`).

### Task 4.4: Docs + finish

**Files:** `packages/client/src/features/marketing/CLAUDE.md`, root + worktree `CLAUDE.md`, the Phase 1d spec, memory.

- [ ] **Step 1 (module CLAUDE.md):** update `features/marketing/CLAUDE.md` 채널 구현 현황 table: **번역 + 이미지 에디터 (Phase 1d) → 완료** (`ChannelTranslationView.tsx` + `ImageEditorDialog.tsx`). Add to Gotchas: (i) the `mkt_translations` table-name fix + `user_id` stamping on translate inserts (C-1/C-2), (ii) the **client-side translation prompt** contract (`/api/mkt/ai/translate` takes `{prompt,model}`; the client builds the prompt via `buildTranslationPrompt`) (C-3), (iii) the image editor's **proxy-draw composite** reusing the `canvas-export.ts` pattern (I-2), (iv) O-7 reversed (ImageCardWidget edit button on at both callsites), (v) the `use-translation.ts` live-preview hook **omitted** (final-banner only).
- [ ] **Step 2 (root + worktree CLAUDE.md):** update the `/marketing` line — channels 7/7 + **translation + image editor complete** (Phase 1d done). Both `C:\projects\tangobook\CLAUDE.md` and `C:\projects\tangobook\.worktrees\marketing-phase0\CLAUDE.md` carry the `/marketing` summary (currently "채널 5/7 … 유튜브/번역은 Phase 1c/1d").
- [ ] **Step 3 (spec status):** flip the Phase 1d spec header `Status` → **COMPLETE** (`docs/superpowers/specs/2026-06-07-marketing-phase1d-translation-image-editor-design.md`).
- [ ] **Step 4 (memory):** update memory `marketing-port-contentflow-2026-06-07.md` — Phase 1d done (번역 axis + 이미지 에디터); the five fixes (C-1/C-2/C-3 + I-1/I-2); next slices = Phase 2 키워드 / 3 발행 / 4 분석 / 5 전략. (Per the user's "업데이트 하자" workflow if invoked.)
- [ ] **Step 5 (finish):** @superpowers:finishing-a-development-branch — present merge/PR/cleanup options. Commit the docs:
  ```bash
  git add packages/client/src/features/marketing/CLAUDE.md CLAUDE.md docs/superpowers/specs/2026-06-07-marketing-phase1d-translation-image-editor-design.md
  git commit -m "docs(marketing): mark Phase 1d (translation + image editor) complete + gotchas"
  ```

---

## Appendix A — The five fixes (cross-reference)

| # | Fix | Landed in | Verified in |
|---|---|---|---|
| **C-1** 🔴 wrong table `translations` → `mkt_translations` | Task 0.3 (a) | Task 0.3 test + Task 4.2 Step 3 |
| **C-2** 🔴 stamp `user_id` on translate insert (RLS `with check`) | Task 0.3 (b) | Task 0.3 test + Task 2.4 Step 4 RLS guard + Task 4.3 Step 2 |
| **C-3** 🔴 client-side prompt + `{prompt,model}` to `/api/mkt/ai/translate` | Task 0.3 (c) | Task 0.3 test (contract) + Task 4.2 Step 1 namespace |
| **I-1** proxy `html: 'text/html'` content-type | Task 0.1 | Task 2.4 Step 4 (DevTools) |
| **I-2** 🔴 editor composite proxy-draw fallback | Task 0.4 (pure helper) + Task 3.1 Step 3 (`handleSave`) | Task 3.3 Step 4 (DevTools proxy request) |

Plus: the dead `_setUploadToR2` bridge removed (Task 0.3 (d), verified Task 4.2 Step 2).

## Appendix B — Resolved decisions (from the spec's open items)

- **Live streaming preview (`use-translation.ts`)** — **OMITTED**. Final-banner display only (spec default O-1d-B). `fetchSSEText` + the mutation's pending state + the `translationStatuses` glyphs cover the UX. Documented in the module CLAUDE.md (Task 4.4).
- **`getCurrentUserId`** — a single **shared** helper added to `api/supabase.ts` (Task 0.2 Step 3), used by `channel-translator.ts`. The 5 existing panels keep their module-local copies (not refactored — out of scope, risk-free).
- **`ImageCardWidget` edit button** — enabled **uniformly** at every callsite (the two real ones: `BlogCardItem`, `YoutubePanel`). O-7 fully reversed (Task 3.2 + 3.3). CardNews renders its own Canvas (no `ImageCardWidget`), so nothing to wire there.
- **R2 bucket CORS** — assumed **NOT** live. The editor relies on the proxy-draw fallback (I-2), same as cardnews export (Phase 1b). No change to live R2 config.
- **base-article overlay** — uses `mkt_translations` via the shared `ChannelTranslationView` (O-1d-A); CF's legacy `factcheck_report.translations[lang]` write is **not** replicated.

## Appendix C — Risks (spec §10)

- **R-1d-1 (high) — translate prompt contract.** A verbatim port posts the CF body to `/api/mkt/ai/translate` (which reads only `{prompt}`) → garbage. **Mitigation:** C-3 rewrite (Task 0.3 (c)) + the contract unit test.
- **R-1d-2 (high) — `user_id` RLS on `mkt_translations`.** Missing stamp → silent insert rejection. **Mitigation:** C-2 (Task 0.3 (b)) + keying unit test + the manual RLS guards.
- **R-1d-3 (high) — editor canvas taint.** Verbatim `handleSave` has no proxy fallback → `SecurityError`/blank export wherever R2 CORS isn't live. **Mitigation:** I-2 proxy-draw (Task 0.4 + Task 3.1 Step 3) + the DevTools proxy-request check.
- **R-1d-4 (med) — wrong table in prod.** Dormant code points at `translations`. **Mitigation:** C-1 (Task 0.3 (a)) + the wrong-table grep guard (Task 4.2 Step 3).
- **R-1d-5 (low) — proxy html content-type.** Cosmetic (`text()` works). **Mitigation:** I-1 (Task 0.1).
- **R-1d-6 (low) — large base-article truncation.** `text.slice(0,16000)` (CF parity) may cut very long articles. Acceptable for 1d; flag if users hit it.
- **R-1d-7 (low) — `projectId` plumbing in `BlogCardItem`.** The edit-save path needs `projectId` for `uploadToR2`; if not already threaded, add the prop (Task 3.3 Step 1). Verify during implementation.

## Appendix D — Already-ported / no-change references

- `lib/translation-prompt-builder.ts` (`buildTranslationPrompt`) — ported verbatim + correct; now invoked **client-side** by the fixed `streamTranslate`. No change.
- `lib/canvas-export.ts` — the `proxyUrl`/`isDataUrl`/`loadImage` proxy-draw pattern is the **reference** for the editor's `loadImageWithProxy` (Task 0.4). No change to canvas-export itself.
- `lib/image-utils.ts` (`base64ToBlob`) — reused to turn the editor's WebP data URL → Blob before `uploadToR2`. No change.
- `api/use-r2-upload.ts` (`uploadToR2`) — reused for translated-HTML upload (in `channel-translator.ts`) + edited-image upload (in the two callsites). No change (this is the Phase 1b "R-11 uploadToR2 fix").
- `lib/sse-stream-parser.ts` (`fetchSSEText`) — reused by `streamTranslate`. No change.
- `mkt_translations` table + single-owner RLS — already exists (Phase 0 migration). **No DDL.**
- `POST /api/mkt/ai/translate` + `GET /api/mkt/storage/proxy` — already exist. The only server change is the proxy html content-type (I-1, Task 0.1).
