# Marketing Phase 1a (Base Article + Blog) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the `/marketing` content-page right pane with the content-generation editor for the first three channels — 기본글 (Base Article, 1:1 TipTap), N블로그 (Naver Blog, N posts × card list + SEO auto-retry), and 내부 블로그 (Internal Blog, Google-SEO variant) — as a faithful port of ContentFlow onto the Phase 0 stack.

**Architecture:** Extends the existing `packages/client/src/features/marketing/` feature module. Server data flows through TanStack Query hooks (`api/`) wrapping `supabase.from('mkt_*')`; UI-only state stays in Zustand (`store/ui-store.ts`). All ContentFlow `useProjectStore()` calls are re-expressed as `api/` hooks (spec §3.1). The whole content graph is read once via `useContent(contentId)` (`api/queries.ts:fetchContentGraph`, already built) and sliced down as props, mirroring CF's `BlogPanelInner`/`BaseArticlePanelInner`. New TipTap editors, AI/image hooks, and two Express keyword endpoints (Naver HMAC + DataForSEO Basic-auth) round it out. cardnews/threads/youtube/shorts/translation-generation/image-editor are OUT (Phase 1b+).

**Tech Stack:** React 18 + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3 + `@tiptap/react`+`starter-kit`+`extension-image`+`extension-placeholder`+`@tiptap/pm` (NEW, pin `^3.20.1`) + lucide-react `^1.17.0` + Express v5 + `@google/genai` (SSE + Imagen Strategy) + `@aws-sdk/client-s3` (R2). Tests: vitest + @testing-library/react (jsdom).

**Source to port from:** `C:\projects\contentflow\contentflow\src` — `components/content/*`, `components/editor/*`, `hooks/*`, `app/globals.css`. ContentFlow uses Next.js + one ~1,900-line Zustand `project-store.ts`; this port adapts to Vite + TanStack Query (see the mapping table in spec §3.1). Spec: `docs/superpowers/specs/2026-06-07-marketing-phase1a-base-article-blog-design.md` (read it fully; decisions O-1…O-8 in §15, risks R-1…R-11 in §13).

**Conventions (match Phase 0 / Tangobook — spec §18):**
- TanStack Query = server data; Zustand (`ui-store`) = UI state only. **No server data in Zustand.**
- Files: **PascalCase** components, **camelCase** hooks/utils; named exports for components, default for pages. (ContentFlow used kebab-case files — rename on port.)
- UI primitives imported from `../../ui` (e.g. `import { Button } from '../../ui/button'`), NOT `@/components/ui/*`. `cn` from `../../lib/utils`. Types from `../../types/database` / `../../types/cards`. Icons from `lucide-react`. Drop every `'use client'` directive and every `immediatelyRender: false` TipTap flag (Next-SSR-only).
- Mutations set `user_id` (from `supabase.auth.getUser()`), `created_at`/`updated_at`, cast payload `as unknown as Record<string, unknown>`, throw on `error`, and `invalidateQueries({ queryKey: mktKeys.content(contentId) })` on success (whole graph refetches). Reuse `generateId()` from `../lib/utils`.
- Server: `asyncHandler` + `throw new AppError(status, msg)`; responses `res.json({ success: true, data })`; reuse `gemini.provider` / `r2.provider` singletons.
- Commit after every task. Commit messages in English. End each commit message with the trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Test command (real):** `pnpm --filter client test <path-substring>` (vitest run). Typecheck: `pnpm typecheck` (all packages) or `pnpm --filter client typecheck` / `pnpm --filter server typecheck`. Lint: `pnpm lint`. Server tests: `pnpm --filter server test`.
- **Port-task pattern** (for verbatim/near-verbatim UI files where TDD is impractical): copy source → rename to PascalCase → rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/utils` → `../../lib/utils`, `@/types/*` → `../../types/*`, `@/hooks/*` → `../../hooks/*`) → strip `'use client'` + `immediatelyRender:false` + Next `<img>` eslint-disables → fix `/api/storage`→`/api/mkt/storage` + `presignedUrl`→`uploadUrl` → **build → `pnpm --filter client typecheck` → manual-verify in `/marketing/content` → commit**. This rhythm is called **"port → typecheck → manual-verify → commit"** below.

---

## File Structure

```
packages/client/src/features/marketing/
  lib/
    image-utils.ts                 NEW  convertToWebpBlob + base64ToBlob (port of CF use-r2-upload.ts:24/52)
    seo-feedback.ts                NEW  buildSeoFeedback(details) extracted for testability (spec §17)
    __tests__/
      image-utils.test.ts          NEW
      seo-feedback.test.ts         NEW
  api/
    use-r2-upload.ts               EDIT R-11 fix: read (await res.json()).data
    __tests__/use-r2-upload.test.ts EDIT fixture → enveloped { success, data }
    use-contents.ts                EDIT add useUpdateContent
    use-base-article.ts            NEW  useUpsertBaseArticle (1:1)
    use-blog-contents.ts           NEW  blog-content + blog-card hooks (1:N + N)
    use-channel-models.ts          NEW  per-(project,channel) model settings via ai_model_settings JSONB
    use-keywords.ts                NEW  fetch wrappers → /api/mkt/{naver,google}/keywords (unwrap .data, O-6)
    __tests__/
      use-base-article.test.tsx    NEW
      use-blog-contents.test.tsx   NEW
  hooks/
    use-ai-generation.ts           NEW  SSE wrapper over parseSSEStream
    use-image-generation.ts        NEW  POST /api/mkt/ai/generate-image → {base64,mimeType}
    use-card-image-generation.ts   NEW  gen → webp → R2 → save (per-card + batch)
    use-auto-save.ts               NEW  2s base-article autosave (schedule/flush/lastSaved)
  components/content/              NEW (this phase)
    ImageStyleSelector.tsx         port CF image-style-selector.tsx (+ ASPECT_RATIO_PRESETS)
    ImageLightbox.tsx              port CF image-lightbox.tsx
    GenerationButton.tsx           port CF generation-button.tsx
    WorkflowStepBar.tsx            port CF workflow-step-bar.tsx
    ChannelModelSelector.tsx       port CF channel-model-selector.tsx
    ChannelContentList.tsx         port CF channel-content-list.tsx (omit publish props)
    NaverKeywordPanel.tsx          port CF naver-keyword-panel.tsx (→ /api/mkt)
    SeoScoreDisplay.tsx            extract from CF blog-panel.tsx:36-66
    ImageCardWidget.tsx            port CF image-card-widget.tsx
    BlogCardItem.tsx               port CF blog-card-item.tsx (+export formatForMobile, AddCardButton)
    PromptEditDialog.tsx           port CF prompt-edit-dialog.tsx
    TopicSuggestionDialog.tsx      port CF topic-suggestion-dialog.tsx
    BlogPreviewDialog.tsx          port CF blog-preview-dialog.tsx (preview only)
    LanguageSelector.tsx           port CF language-selector.tsx (stub onTranslate)
    ContentTabs.tsx                port CF content-tabs.tsx (3 active + 4 placeholder)
    BaseArticlePanel.tsx           port CF base-article-panel.tsx
    BlogPanel.tsx                  port CF blog-panel.tsx (strip golden-keyword/auto-pick)
    InternalBlogPanel.tsx          port CF internal-blog-panel.tsx (Google-SEO checklist)
    editor/
      EditorToolbar.tsx            port CF components/editor/editor-toolbar.tsx
      BaseArticleEditor.tsx        port CF components/editor/base-article-editor.tsx
    __tests__/
      BlogCardItem.formatForMobile.test.tsx  NEW
  components/ErrorBoundary.tsx     NEW  port CF components/error-boundary.tsx (has resetKeys)
  theme/marketing-tokens.css       EDIT append CF .tiptap rules scoped under .marketing-scope (O-8)
  pages/ContentPage.tsx            EDIT mount <ContentTabs/> in right pane

packages/server/src/
  services/mkt/external/
    naver-searchad.ts              EDIT implement HMAC + /keywordstool (replaces 501 skeleton)
    dataforseo.ts                  EDIT implement Basic-auth search_volume (replaces 501 skeleton)
    __tests__/
      naver-searchad.test.ts       NEW  HMAC determinism + response mapper
      dataforseo.test.ts           NEW  response mapper
  controllers/mkt/
    keywords.controller.ts         NEW  naverKeywords + googleKeywords (asyncHandler, {success,data})
  routes/mkt.routes.ts             EDIT add /naver/keywords + /google/keywords
```

> **No DDL is required** for the three blog tables — Phase 0's migration `supabase/migrations/2026-06-07-marketing-schema.sql` already created `mkt_base_articles`/`mkt_blog_contents`/`mkt_blog_cards` with RLS + single-owner policies (spec §4). Two **optional** non-blocking perf indexes are in Chunk 1 Task 1.5; verify-then-add only.

### Chunk dependency order (each chunk is independently runnable in this order)

| Chunk | Depends on | Independently testable / verifiable |
|---|---|---|
| **0** Prerequisites & R-11 | — (Phase 0 only) | unit tests (image-utils, fixed use-r2-upload) + typecheck/build |
| **1** Data layer | 0 (Task 1.4 imports `ASPECT_RATIO_PRESETS` from 0.4) | hook unit tests (mock supabase) + typecheck |
| **2** Express endpoints | — (Phase 0 server only; independent of client chunks) | server unit tests + curl smoke |
| **3** Base article | 0, 1 (and 2 only for the optional keyword-less base-article path — base article does not call keyword APIs, so 2 is NOT a hard dep) | hook unit tests + manual E2E of 기본글 |
| **4** N블로그 | 0, 1, 3 (reuses AI/image hooks + ContentTabs shell), 2 (keyword panel degrades gracefully without it) | seo-feedback + formatForMobile unit tests + manual E2E |
| **5** 내부 블로그 + verification | 0, 1, 2, 3, 4 (reuses BlogCardItem/ChannelContentList/etc.) | manual E2E all channels + full suite |

> Chunks 0/1/2 can proceed in parallel (0 & 1 are client-only; 2 is server-only). Chunk 3 needs 0+1. Chunks 4-5 are sequential on top of 3.

---

## Chunk 0: Prerequisites & R-11 bugfix (unblock everything)

> These are the gaps Phase 0 did **not** port (spec §16 Step 0; verified by grepping the worktree). `countWords` is NOT a gap — it is already in `lib/utils.ts:13` and tested in `lib/__tests__/utils.test.ts` — **do not re-add it.** This chunk has no UI dependencies and must land first because the image pipeline (Chunk 2) and editors (Chunk 3+) depend on it.

### Task 0.1: Add TipTap dependencies

**Files:**
- Modify: `packages/client/package.json` (via pnpm)

- [ ] **Step 1:** From the repo root run:
  ```bash
  pnpm --filter client add @tiptap/react@^3.20.1 @tiptap/starter-kit@^3.20.1 @tiptap/extension-image@^3.20.1 @tiptap/extension-placeholder@^3.20.1 @tiptap/pm@^3.20.1
  ```
  All five MUST be pinned to the **same `^3.20.1`** line (R-7: mismatched ProseMirror versions cause "duplicate prosemirror-model" runtime errors). CF pins exactly these versions.
- [ ] **Step 2:** Run `pnpm --filter client typecheck`. Expected: PASS (no usages yet).
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/package.json pnpm-lock.yaml
  git commit -m "chore(marketing): add TipTap 3.x deps for content editors"
  ```

### Task 0.2: Fix the Phase 0 `uploadToR2` envelope bug (R-11)

> The Phase 0 client `uploadToR2` (`api/use-r2-upload.ts:53`) destructures `{ uploadUrl, publicUrl, key }` at the **top level** of the presign JSON, but the server wraps the payload as `{ success, data: { uploadUrl, publicUrl, key } }` (`storage.controller.ts:44`). At runtime all three are `undefined` and the PUT goes to `undefined`. The Phase 0 unit test masks this by mocking a **flat** presign body. This blocks the **entire** image pipeline, so it is fixed before any image work.

**Files:**
- Modify: `packages/client/src/features/marketing/api/use-r2-upload.ts:53`
- Modify: `packages/client/src/features/marketing/api/__tests__/use-r2-upload.test.ts:39-43`

- [ ] **Step 1 (test first — update the fixture to the REAL shape):** In `__tests__/use-r2-upload.test.ts`, change the presign fixture so the test mirrors the server envelope. Replace the flat `PRESIGN_RESPONSE` constant usage in every `makeFetch([{ ok: true, data: PRESIGN_RESPONSE }, ...])` call with the enveloped form. Concretely, keep `PRESIGN_RESPONSE` as the inner object but wrap it where it is mocked:

```ts
// at top, alongside PRESIGN_RESPONSE:
const PRESIGN_ENVELOPE = { success: true, data: PRESIGN_RESPONSE };
```
Then replace each `{ ok: true, data: PRESIGN_RESPONSE }` with `{ ok: true, data: PRESIGN_ENVELOPE }` (presign calls only — the PUT mocks `{ ok: true }` stay as-is). There are presign mocks in: "returns publicUrl and key on success", "calls presign with correct body", "PUTs the file to the uploadUrl", "retries PUT once", "throws if both PUT attempts fail", "uses file.name as fileName".
- [ ] **Step 2 (run — verify it FAILS against current impl):** `pnpm --filter client test marketing/api/__tests__/use-r2-upload`. Expected: FAIL — the assertions `result.publicUrl === 'https://pub.example.com/test.txt'` and `putUrl === 'https://r2.example.com/upload'` now break, because the un-fixed impl reads `uploadUrl`/`publicUrl` from the envelope's top level (which only has `success`/`data`), so they are `undefined`.
- [ ] **Step 3 (impl — minimal fix):** In `api/use-r2-upload.ts`, change the destructure at line 53 from the top-level read to unwrap `.data`:

```ts
  const json = (await presignRes.json()) as {
    success?: boolean;
    data?: { uploadUrl: string; publicUrl: string; key: string };
  };
  if (!json.success || !json.data) {
    throw new Error('presign response missing data envelope');
  }
  const { uploadUrl, publicUrl, key } = json.data;
```
- [ ] **Step 4 (run — verify PASS):** `pnpm --filter client test marketing/api/__tests__/use-r2-upload`. Expected: PASS (all 7 cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-r2-upload.ts packages/client/src/features/marketing/api/__tests__/use-r2-upload.test.ts
  git commit -m "fix(marketing): unwrap presign {success,data} envelope in uploadToR2 (R-11)"
  ```

### Task 0.3: Port image-pipeline helpers (`lib/image-utils.ts`)

> `convertToWebpBlob` + `base64ToBlob` exist in CF (`src/hooks/use-r2-upload.ts:24`/`:52`) but were NOT ported in Phase 0 (R-2; verified absent). `base64ToBlob` is pure and unit-testable; `convertToWebpBlob` is Canvas-bound (smoke only).

**Files:**
- Create: `packages/client/src/features/marketing/lib/image-utils.ts`
- Test: `packages/client/src/features/marketing/lib/__tests__/image-utils.test.ts`

- [ ] **Step 1 (test):** Write `image-utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { base64ToBlob } from '../image-utils';

// "AAAA" decodes to 3 zero bytes
describe('base64ToBlob', () => {
  it('parses a data URL and uses its mime type', () => {
    const blob = base64ToBlob('data:image/png;base64,AAAA');
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(3);
  });

  it('accepts raw base64 with an explicit mimeType', () => {
    const blob = base64ToBlob('AAAA', 'image/webp');
    expect(blob.type).toBe('image/webp');
    expect(blob.size).toBe(3);
  });

  it('throws on a malformed data URL', () => {
    expect(() => base64ToBlob('data:image/png,notbase64')).toThrow();
  });

  it('throws when raw base64 is given without a mimeType', () => {
    expect(() => base64ToBlob('AAAA')).toThrow();
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/lib/__tests__/image-utils`. Expected: FAIL (module not found).
- [ ] **Step 3 (impl):** Create `lib/image-utils.ts`, porting both functions VERBATIM from CF `src/hooks/use-r2-upload.ts` (only the two functions; do NOT port the whole hook). Exact source:

```ts
/**
 * Image helpers ported from ContentFlow src/hooks/use-r2-upload.ts (:24 / :52).
 * convertToWebpBlob is Canvas-bound (browser only); base64ToBlob is pure.
 */

/** Convert a PNG/JPEG base64 to a WebP Blob via Canvas; falls back to the source blob. */
export async function convertToWebpBlob(
  base64: string,
  srcMime: string
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ blob: base64ToBlob(base64, srcMime), mimeType: srcMime });
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (b) => {
          if (b && b.type === 'image/webp') resolve({ blob: b, mimeType: 'image/webp' });
          else resolve({ blob: base64ToBlob(base64, srcMime), mimeType: srcMime });
        },
        'image/webp',
        0.85
      );
    };
    img.onerror = () => resolve({ blob: base64ToBlob(base64, srcMime), mimeType: srcMime });
    img.src = `data:${srcMime};base64,${base64}`;
  });
}

/** Convert base64 (data URL or raw) to a Blob. Exported for testing. */
export function base64ToBlob(input: string, mimeType?: string): Blob {
  let base64: string;
  let type: string;

  if (input.startsWith('data:')) {
    const match = input.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('잘못된 base64 data URL 형식입니다.');
    type = match[1];
    base64 = match[2];
  } else {
    if (!mimeType) throw new Error('raw base64에는 mimeType이 필요합니다.');
    type = mimeType;
    base64 = input;
  }

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  } catch {
    throw new Error('base64 디코딩에 실패했습니다.');
  }
}
```
- [ ] **Step 4 (run):** `pnpm --filter client test marketing/lib/__tests__/image-utils`. Expected: PASS (4 cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/lib/image-utils.ts packages/client/src/features/marketing/lib/__tests__/image-utils.test.ts
  git commit -m "feat(marketing): port convertToWebpBlob + base64ToBlob image helpers"
  ```

### Task 0.4: Port `ImageStyleSelector` (+ `ASPECT_RATIO_PRESETS`) and `ImageLightbox`

> Required by `ChannelModelSelector`, `BlogCardItem`, `ImageCardWidget` (R-5). Both are small, presentational; no TDD — **port → typecheck → manual-verify → commit**.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/ImageStyleSelector.tsx`
- Create: `packages/client/src/features/marketing/components/content/ImageLightbox.tsx`

- [ ] **Step 1 (port `ImageStyleSelector`):** Copy CF `src/components/content/image-style-selector.tsx` → `ImageStyleSelector.tsx`. It exports BOTH the `ImageStyleSelector` component (`:1`) and `ASPECT_RATIO_PRESETS` (`:116`) — keep both exports. Rewire imports to `../../ui/*` (Select etc.) and `../../lib/utils`. Drop `'use client'`.
- [ ] **Step 2 (port `ImageLightbox`):** Copy CF `src/components/content/image-lightbox.tsx` → `ImageLightbox.tsx`. Replace any `next/image` `<Image>` with a plain `<img>` and remove `@next/next/no-img-element` eslint-disable comments. Rewire imports.
- [ ] **Step 3 (R-1 icon check):** For every `lucide-react` icon imported by these two files, confirm it resolves at `lucide-react@^1.17.0` (the Vite/tsc build fails fast on a missing export). If any icon was renamed/removed in the 0.x→1.x jump (e.g. `X`, `ZoomIn`, `Download`), substitute the current name. Run `pnpm --filter client typecheck`.
- [ ] **Step 4 (manual-verify):** Build is enough at this stage (no route mounts them yet). `pnpm --filter client typecheck` → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/ImageStyleSelector.tsx packages/client/src/features/marketing/components/content/ImageLightbox.tsx
  git commit -m "feat(marketing): port ImageStyleSelector (+ASPECT_RATIO_PRESETS) and ImageLightbox"
  ```

### Task 0.5: Port `ErrorBoundary` (with `resetKeys`)

> Tangobook's root `ErrorBoundary` (`design-system/primitives/ErrorBoundary.tsx`) takes only `{ children, fallbackMessage }` and does NOT support `resetKeys`, which `ChannelContentList` needs (`resetKeys=[id]`) so one corrupt card row can't blank the whole list (R-6, spec §16 Step 0.3). Port CF's instead.

**Files:**
- Create: `packages/client/src/features/marketing/components/ErrorBoundary.tsx`

- [ ] **Step 1 (port):** Copy CF `src/components/error-boundary.tsx` → `components/ErrorBoundary.tsx` (note: NOT under `content/` — it's a feature-level util, matching CF's `@/components/error-boundary`). Keep the `resetKeys` prop + the `componentDidUpdate` reset logic. Rewire imports; drop `'use client'`. Export `ErrorBoundary` (named).
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/ErrorBoundary.tsx
  git commit -m "feat(marketing): port ErrorBoundary with resetKeys support"
  ```

### Task 0.6: Port `GenerationButton` + `WorkflowStepBar`

> Both presentational; `WorkflowStepBar` is a trivial verbatim port. No TDD — **port → typecheck → manual-verify → commit**.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/GenerationButton.tsx`
- Create: `packages/client/src/features/marketing/components/content/WorkflowStepBar.tsx`

- [ ] **Step 1 (port `GenerationButton`):** Copy CF `src/components/content/generation-button.tsx` → `GenerationButton.tsx`. Preserve its variants (text/image/batch-image/translate), progress, and colors. Rewire imports (`../../ui/button`, `../../lib/utils`, `lucide-react`). Drop `'use client'`.
- [ ] **Step 2 (port `WorkflowStepBar`):** Copy CF `src/components/content/workflow-step-bar.tsx` → `WorkflowStepBar.tsx`. Props `{ steps: WorkflowStepMeta[]; currentStep: 1|2|3|4; onStepChange }`. Rewire `cn` import. Keep the `WorkflowStepMeta` type export.
- [ ] **Step 3 (R-1 icon check + typecheck):** Verify every imported lucide icon resolves at `^1.17.0` (`Wand2`, `Loader2`, `Square`, `Sparkles`, etc. — substitute if renamed). `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/GenerationButton.tsx packages/client/src/features/marketing/components/content/WorkflowStepBar.tsx
  git commit -m "feat(marketing): port GenerationButton + WorkflowStepBar"
  ```

### Task 0.7: Append scoped `.tiptap` styles (O-8)

> `@tailwindcss/typography` is NOT installed in `packages/client` (R-8 verified), so `prose` classes render unstyled. Port CF's `.tiptap` ruleset into the Phase 0 scoped stylesheet, prefixing every selector with `.marketing-scope` to preserve isolation. The ported editor JSX (Chunk 3/4) will carry NO `prose` classNames.

**Files:**
- Modify: `packages/client/src/features/marketing/theme/marketing-tokens.css` (append)

- [ ] **Step 1 (impl):** Open CF `src/app/globals.css` and copy the `.tiptap` block (`:132-199` — `.tiptap`, `.tiptap h1/h2/h3/p/strong/em/ul/ol/li/blockquote/img/hr`, and the `.tiptap p.is-editor-empty:first-child::before` placeholder rule). Append it to the END of `marketing-tokens.css`, prefixing every selector with `.marketing-scope ` (e.g. `.tiptap h2 { … }` → `.marketing-scope .tiptap h2 { … }`; `.tiptap p.is-editor-empty:first-child::before` → `.marketing-scope .tiptap p.is-editor-empty:first-child::before`). Do not alter the rule bodies.
- [ ] **Step 2 (verify scope):** Confirm no rule leaks outside `.marketing-scope` (grep the appended block — every selector starts with `.marketing-scope`).
- [ ] **Step 3 (build):** `pnpm --filter client build` → PASS (CSS compiles).
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/theme/marketing-tokens.css
  git commit -m "feat(marketing): scoped .tiptap typography styles under .marketing-scope"
  ```

---

## Chunk 1: Data layer (TanStack Query hooks)

> Pure data wiring, no UI. Each hook matches the Phase 0 pattern (`use-contents.ts`, `use-projects.ts`): read = `useQuery` with `enabled: Boolean(id)`; write = `useMutation` that gets `user`, sets `user_id`+timestamps, casts `as unknown as Record<string, unknown>`, throws on `error`, and `invalidateQueries({ queryKey: mktKeys.content(contentId) })`. Tests mock `@/lib/supabase` (NOT `../supabase` — the hooks import `./supabase` which re-exports `@/lib/supabase`, so `vi.mock('@/lib/supabase', …)` intercepts both; follow `api/__tests__/use-projects.test.tsx` exactly). **Read of base/blog/cards is via the existing `useContent(contentId).data` graph — these hooks only WRITE.**

### Task 1.1: `useUpdateContent` (extend `use-contents.ts`)

> Used by 원장님 컨펌 toggle and topic save (spec §3.1, ports `project-store.ts:updateContent:786`).

**Files:**
- Modify: `packages/client/src/features/marketing/api/use-contents.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-contents.test.tsx` (NEW)

- [ ] **Step 1 (test):** Create `use-contents.test.tsx` following the `use-projects.test.tsx` harness (mock `@/lib/supabase`, `QueryClient` wrapper with `retry:false`). Test `useUpdateContent`:

```ts
it('updates a content row and invalidates content + contents queries', async () => {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
  mockFrom.mockReturnValue({ update: updateMock } as any);
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const { result } = renderHook(() => useUpdateContent(), { wrapper: wrapper(queryClient) });
  await act(async () => {
    await result.current.mutateAsync({ id: 'c-1', projectId: 'p-1', updates: { confirmed: true } });
  });

  expect(updateMock).toHaveBeenCalled();
  expect(eqMock).toHaveBeenCalledWith('id', 'c-1');
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/api/__tests__/use-contents`. Expected: FAIL (`useUpdateContent` not exported).
- [ ] **Step 3 (impl):** Add to `use-contents.ts`:

```ts
export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      updates,
    }: {
      id: string;
      projectId: string;
      updates: Partial<Content>;
    }) => {
      const updatedData = { ...updates, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from('mkt_contents')
        .update(updatedData as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
      return { id, projectId };
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(id) });
      queryClient.invalidateQueries({ queryKey: mktKeys.contents(projectId) });
    },
  });
}
```
- [ ] **Step 4 (run):** test → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-contents.ts packages/client/src/features/marketing/api/__tests__/use-contents.test.tsx
  git commit -m "feat(marketing): useUpdateContent mutation (confirm/topic)"
  ```

### Task 1.2: `useUpsertBaseArticle` (`api/use-base-article.ts`)

> 1:1 per content. Ports `project-store.ts:createOrUpdateBaseArticle:883`: if no row for `content_id` → INSERT a minimal row; else UPDATE by `content_id`. READ is via `useContent(contentId).data?.baseArticle` (do not add a read hook).

**Files:**
- Create: `packages/client/src/features/marketing/api/use-base-article.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-base-article.test.tsx`

- [ ] **Step 1 (test):** Cover BOTH branches (insert when none exists, update when one exists). The hook first SELECTs by `content_id` to decide. Mock supabase so the select returns `{ data: null }` (insert path) and `{ data: { id: 'ba-1' } }` (update path):

```ts
it('inserts a new base article when none exists', async () => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  mockFrom.mockImplementation((table: string) => {
    if (table !== 'mkt_base_articles') throw new Error('unexpected table');
    return {
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      insert: insertMock,
    } as any;
  });
  const { result } = renderHook(() => useUpsertBaseArticle(), { wrapper: wrapper(queryClient) });
  await act(async () => {
    await result.current.mutateAsync({ contentId: 'c-1', data: { body: '<p>hi</p>', word_count: 1 } });
  });
  const inserted = insertMock.mock.calls[0][0] as Record<string, unknown>;
  expect(inserted.content_id).toBe('c-1');
  expect(inserted.user_id).toBe('user-test-id');
  expect(inserted.body).toBe('<p>hi</p>');
});

it('updates the existing row when one exists', async () => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'ba-1' }, error: null });
  const eqUpdate = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn().mockReturnValue({ eq: eqUpdate });
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
    update: updateMock,
  } as any);
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const { result } = renderHook(() => useUpsertBaseArticle(), { wrapper: wrapper(queryClient) });
  await act(async () => {
    await result.current.mutateAsync({ contentId: 'c-1', data: { word_count: 5 } });
  });
  expect(updateMock).toHaveBeenCalled();
  expect(eqUpdate).toHaveBeenCalledWith('content_id', 'c-1');
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/api/__tests__/use-base-article`. Expected: FAIL (module missing).
- [ ] **Step 3 (impl):** Create `use-base-article.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { BaseArticle } from '../types/database';

export function useUpsertBaseArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      data,
    }: {
      contentId: string;
      data: Partial<BaseArticle>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('인증이 필요합니다');

      const { data: existing, error: selErr } = await supabase
        .from('mkt_base_articles')
        .select('id')
        .eq('content_id', contentId)
        .maybeSingle();
      if (selErr) throw new Error(selErr.message);

      const now = new Date().toISOString();
      if (!existing) {
        const row = {
          id: generateId(),
          user_id: user.id,
          content_id: contentId,
          title: null,
          body: '',
          body_plain_text: null,
          word_count: 0,
          factcheck_status: null,
          factcheck_score: null,
          factcheck_report: null,
          prompt_used: null,
          created_at: now,
          updated_at: now,
          ...data,
        };
        const { error } = await supabase
          .from('mkt_base_articles')
          .insert(row as unknown as Record<string, unknown>);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('mkt_base_articles')
          .update({ ...data, updated_at: now } as unknown as Record<string, unknown>)
          .eq('content_id', contentId);
        if (error) throw new Error(error.message);
      }
      return { contentId };
    },
    onSuccess: ({ contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
```
- [ ] **Step 4 (run):** test → PASS (both branches).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-base-article.ts packages/client/src/features/marketing/api/__tests__/use-base-article.test.tsx
  git commit -m "feat(marketing): useUpsertBaseArticle (insert-or-update 1:1)"
  ```

### Task 1.3: Blog-content + blog-card hooks (`api/use-blog-contents.ts`)

> 1:N blog contents + N cards. Ports `project-store.ts` `addBlogContent:928` / `updateBlogContent:962` / `deleteBlogContent:972` / `setBlogCardsForContent:995` / `addBlogCard:1016` / `updateBlogCard:1039` / `deleteBlogCard:1051` / `reorderBlogCards:1061`. The high-frequency `setBlogCards` is **delete-all-then-bulk-insert** — port that sequence exactly. All mutations invalidate `mktKeys.content(contentId)`.

**Files:**
- Create: `packages/client/src/features/marketing/api/use-blog-contents.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-blog-contents.test.tsx`

- [ ] **Step 1 (test):** Cover the two highest-risk behaviors: `useCreateBlogContent` returns the new id + sets `channel`+`user_id`; `useSetBlogCards` deletes-all then bulk-inserts and invalidates the content graph.

```ts
it('useCreateBlogContent inserts with channel + user_id and returns the new id', async () => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({ insert: insertMock } as any);
  const { result } = renderHook(() => useCreateBlogContent(), { wrapper: wrapper(queryClient) });
  let newId = '';
  await act(async () => {
    newId = await result.current.mutateAsync({ contentId: 'c-1', channel: 'naver_blog' });
  });
  const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
  expect(row.content_id).toBe('c-1');
  expect(row.channel).toBe('naver_blog');
  expect(row.user_id).toBe('user-test-id');
  expect(typeof newId).toBe('string');
  expect(row.id).toBe(newId);
});

it('useSetBlogCards deletes all then bulk-inserts', async () => {
  const eqDelete = vi.fn().mockResolvedValue({ error: null });
  const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const cards = [{ id: 'k1', blog_content_id: 'b-1', card_type: 'text', content: {}, sort_order: 0, created_at: 'x', updated_at: 'x' }] as any;
  const { result } = renderHook(() => useSetBlogCards(), { wrapper: wrapper(queryClient) });
  await act(async () => {
    await result.current.mutateAsync({ blogContentId: 'b-1', contentId: 'c-1', cards });
  });
  expect(eqDelete).toHaveBeenCalledWith('blog_content_id', 'b-1');
  expect(insertMock).toHaveBeenCalledOnce();
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
});

it('useSetBlogCards skips insert when cards is empty', async () => {
  const eqDelete = vi.fn().mockResolvedValue({ error: null });
  const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
  const insertMock = vi.fn();
  mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
  const { result } = renderHook(() => useSetBlogCards(), { wrapper: wrapper(queryClient) });
  await act(async () => {
    await result.current.mutateAsync({ blogContentId: 'b-1', contentId: 'c-1', cards: [] });
  });
  expect(eqDelete).toHaveBeenCalled();
  expect(insertMock).not.toHaveBeenCalled();
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/api/__tests__/use-blog-contents`. Expected: FAIL.
- [ ] **Step 3 (impl):** Create `use-blog-contents.ts` with all eight hooks. The two tested ones are load-bearing — give them exactly:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { BlogContent, BlogCard } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCreateBlogContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      channel,
      data,
    }: {
      contentId: string;
      channel: 'naver_blog' | 'self_hosted';
      data?: Partial<BlogContent>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        content_id: contentId,
        channel,
        title: null,
        seo_title: null,
        seo_score: null,
        seo_details: null,
        naver_keywords: null,
        meta_description: null,
        url_slug: null,
        primary_keyword: null,
        secondary_keywords: null,
        search_intent: null,
        heading_structure: null,
        status: 'draft',
        published_url: null,
        published_at: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_blog_contents')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateBlogContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contentId: _contentId,
      updates,
    }: {
      id: string;
      contentId: string;
      updates: Partial<BlogContent>;
    }) => {
      const { error } = await supabase
        .from('mkt_blog_contents')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useDeleteBlogContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentId: _c }: { id: string; contentId: string }) => {
      // FK cascade removes the cards
      const { error } = await supabase.from('mkt_blog_contents').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useSetBlogCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blogContentId,
      contentId: _c,
      cards,
    }: {
      blogContentId: string;
      contentId: string;
      cards: BlogCard[];
    }) => {
      const { error: delErr } = await supabase
        .from('mkt_blog_cards')
        .delete()
        .eq('blog_content_id', blogContentId);
      if (delErr) throw new Error(delErr.message);
      if (cards.length > 0) {
        const { error: insErr } = await supabase
          .from('mkt_blog_cards')
          .insert(cards as unknown as Record<string, unknown>[]);
        if (insErr) throw new Error(insErr.message);
      }
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useAddBlogCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blogContentId,
      contentId: _c,
      cardType,
      sortOrder,
    }: {
      blogContentId: string;
      contentId: string;
      cardType: BlogCard['card_type'];
      sortOrder: number;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        blog_content_id: blogContentId,
        card_type: cardType,
        content: {},
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };
      const { error } = await supabase
        .from('mkt_blog_cards')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateBlogCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      contentId: _c,
      updates,
    }: {
      cardId: string;
      contentId: string;
      updates: Partial<BlogCard>;
    }) => {
      const { error } = await supabase
        .from('mkt_blog_cards')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useDeleteBlogCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, contentId: _c }: { cardId: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_blog_cards').delete().eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useReorderBlogCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blogContentId: _b,
      contentId: _c,
      cardIds,
    }: {
      blogContentId: string;
      contentId: string;
      cardIds: string[];
    }) => {
      const results = await Promise.all(
        cardIds.map((id, i) =>
          supabase
            .from('mkt_blog_cards')
            .update({ sort_order: i } as Record<string, unknown>)
            .eq('id', id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
```
- [ ] **Step 4 (run):** test → PASS (3 cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-blog-contents.ts packages/client/src/features/marketing/api/__tests__/use-blog-contents.test.tsx
  git commit -m "feat(marketing): blog-content + blog-card mutation hooks (1:N + setCards)"
  ```

### Task 1.4: `useChannelModels` (`api/use-channel-models.ts`)

> Per-(project, channel) model settings persisted in `mkt_projects.ai_model_settings` JSONB, keyed by channel (`ai_model_settings.channelModels['blog']` etc.). Ports `getChannelModels:1679`/`setChannelModels:1699`. Defaults from `lib/ai-models.ts` (`DEFAULT_TEXT_MODEL`, `DEFAULT_IMAGE_MODEL`). Reads from `useProject(projectId)`; writes merge the JSONB via `useUpdateProject` (`use-projects.ts:105`). Channels in 1a: `'base-article'` (text only) and `'blog'` (shared by N-blog + internal-blog, per CF). No TDD needed (thin derive + merge); typecheck + manual-verify.

**Files:**
- Create: `packages/client/src/features/marketing/api/use-channel-models.ts`

- [ ] **Step 1 (impl):** Create `use-channel-models.ts`:

```ts
import { useCallback } from 'react';
import { useProject, useUpdateProject } from './use-projects';
import { DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from '../lib/ai-models';
import { ASPECT_RATIO_PRESETS } from '../components/content/ImageStyleSelector';

export interface ChannelModelSettings {
  textModel: string;
  imageModel: string;
  aspectRatio: string;
  imageStyle: string;
  imageInstruction: string;
}

const DEFAULTS: ChannelModelSettings = {
  textModel: DEFAULT_TEXT_MODEL,
  imageModel: DEFAULT_IMAGE_MODEL,
  aspectRatio: ASPECT_RATIO_PRESETS[0]?.value ?? '16:9',
  imageStyle: '',
  imageInstruction: '',
};

interface ChannelModelsBag {
  channelModels?: Record<string, Partial<ChannelModelSettings>>;
  [k: string]: unknown;
}

export function useChannelModels(projectId: string | null, channel: string) {
  const { data: project } = useProject(projectId);
  const updateProject = useUpdateProject();

  const bag = (project?.ai_model_settings ?? {}) as ChannelModelsBag;
  const stored = bag.channelModels?.[channel] ?? {};
  const models: ChannelModelSettings = { ...DEFAULTS, ...stored };

  const setChannelModels = useCallback(
    (updates: Partial<ChannelModelSettings>) => {
      if (!projectId) return;
      const prevBag = (project?.ai_model_settings ?? {}) as ChannelModelsBag;
      const nextBag: ChannelModelsBag = {
        ...prevBag,
        channelModels: {
          ...(prevBag.channelModels ?? {}),
          [channel]: { ...(prevBag.channelModels?.[channel] ?? {}), ...updates },
        },
      };
      updateProject.mutate({
        id: projectId,
        updates: { ai_model_settings: nextBag as unknown as Record<string, unknown> },
      });
    },
    [projectId, channel, project, updateProject]
  );

  return { models, setChannelModels };
}
```
> Notes: (a) `ai_model_settings` is typed `Record<string, unknown> | null` on `Project`, so the cast above is consistent with the Phase 0 type. (b) `ASPECT_RATIO_PRESETS[0].value` is `'1:1'` (verified in CF `image-style-selector.tsx:37-44`), with `'16:9'` as the literal fallback. (c) This task imports `ASPECT_RATIO_PRESETS` from `../components/content/ImageStyleSelector` (Task 0.4), so it depends on Chunk 0. If you prefer not to couple `api/` → `components/`, inline a local `const DEFAULT_ASPECT = '16:9'` instead of importing the presets — the only need here is the default value.
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-channel-models.ts
  git commit -m "feat(marketing): useChannelModels (per-channel settings in ai_model_settings JSONB)"
  ```

### Task 1.5: (Optional) recommended perf indexes migration

> Non-blocking; correctness does not depend on it. Both indexes are confirmed ABSENT from the Phase 0 migration (spec §4.1/§4.3) — verify before adding so it is not a duplicate.

**Files:**
- Create: `supabase/migrations/2026-06-07-marketing-phase1a-indexes.sql` (record for source control)
- Apply via `mcp__supabase__apply_migration` (project ref `fxzwigjkbsptvsjraqwa`)

- [ ] **Step 1 (verify absent):** `mcp__supabase__list_tables` / inspect the existing migration to confirm neither index exists.
- [ ] **Step 2 (author + apply):**

```sql
-- Phase 1a optional perf indexes (non-blocking)
create unique index if not exists mkt_base_articles_content_unique
  on mkt_base_articles(content_id);
create index if not exists mkt_blog_cards_parent_sort
  on mkt_blog_cards(blog_content_id, sort_order);
```
Apply via MCP `apply_migration` (name `marketing_phase1a_indexes`). The unique index also enforces the 1:1 base-article invariant at the DB level.
- [ ] **Step 3 (advisors):** `mcp__supabase__get_advisors` (security) → no new warnings (no SECURITY DEFINER functions added).
- [ ] **Step 4:** Commit the recorded SQL:
  ```bash
  git add supabase/migrations/2026-06-07-marketing-phase1a-indexes.sql
  git commit -m "feat(marketing): optional perf indexes (base_articles unique, blog_cards sort)"
  ```

---

## Chunk 2: Express keyword endpoints (Naver HMAC + DataForSEO)

> The image endpoint (`/api/mkt/ai/generate-image`) and SSE (`/api/mkt/ai/generate`) already EXIST (Phase 0) — no server work for those. This chunk implements the two NEW keyword endpoints. Server convention: `asyncHandler` + `throw new AppError(...)`; respond `res.json({ success: true, data: { keywords } })` (O-6 — Tangobook envelope, CF payload shape inside `data`). Credentials are already wired (`config.naverAd.{apiKey,secretKey,customerId}` `config/index.ts:32-35`; `config.dataforseo.{login,password}` `:66-68`) and listed in `.env.example` — **consume only, no config additions.** Pure logic (HMAC signing, response mappers) gets unit tests; upstream HTTP is mocked.

> **Build order note:** these endpoints are implemented before the N-blog/internal-blog UI that calls them, so the keyword panels have a real backend by manual-verification time. The panels also degrade gracefully (AppError(502) → manual entry still works), so strict ordering is not mandatory — but server-first avoids a dead button during the demo.

### Task 2.1: Implement `naver-searchad.ts` (HMAC + `/keywordstool`)

> Replaces the 501 skeleton (`services/mkt/external/naver-searchad.ts:28`). Naver SearchAd auth headers: `X-Timestamp`, `X-API-KEY` (apiKey), `X-Customer` (customerId), `X-Signature` = `Base64(HMAC-SHA256(secretKey, `${timestamp}.${method}.${uri}`))`. The `/keywordstool` GET takes `hintKeywords` (comma-joined, spaces removed, ≤5) + `showDetail=1` and returns `{ keywordList: [{ relKeyword, monthlyPcQcCnt, monthlyMobileQcCnt, monthlyAvePcClkCnt, monthlyAveMobileClkCnt, compIdx, plAvgDepth }] }`. Naver returns `"< 10"` strings for low counts — coerce to a number.

**Files:**
- Modify: `packages/server/src/services/mkt/external/naver-searchad.ts`
- Test: `packages/server/src/services/mkt/external/__tests__/naver-searchad.test.ts`

- [ ] **Step 1 (test — pure HMAC + mapper + fetch):** Create `__tests__/naver-searchad.test.ts`. Test the **exported** `signNaverRequest` (deterministic), `mapKeywordList` (count coercion incl. `"< 10"` → 10, competition mapping), and `searchKeywords` (signed headers + 502 on non-2xx):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../config/index.js', () => ({
  config: { naverAd: { apiKey: 'API', secretKey: 'SECRET', customerId: 'CUST' } },
}));

import { signNaverRequest, mapKeywordList, searchKeywords } from '../naver-searchad.js';

describe('signNaverRequest', () => {
  it('produces a deterministic base64 HMAC-SHA256 of `${ts}.${method}.${uri}`', () => {
    const sig = signNaverRequest('SECRET', '1700000000000', 'GET', '/keywordstool');
    // Lock determinism — precompute once during impl with:
    //   node -e "console.log(require('crypto').createHmac('sha256','SECRET').update('1700000000000.GET./keywordstool').digest('base64'))"
    expect(sig).toBe('YOUR_PRECOMPUTED_VALUE'); // replace with the printed value
  });
});

describe('mapKeywordList', () => {
  it('coerces "< 10" + numeric counts and maps competition', () => {
    const out = mapKeywordList([
      { relKeyword: '영어유치원', monthlyPcQcCnt: '< 10', monthlyMobileQcCnt: 320, monthlyAvePcClkCnt: 1.2, monthlyAveMobileClkCnt: 5, compIdx: '높음', plAvgDepth: 3 },
    ]);
    expect(out[0].keyword).toBe('영어유치원');
    expect(out[0].pcSearchVolume).toBe(10);
    expect(out[0].mobileSearchVolume).toBe(320);
    expect(out[0].totalSearchVolume).toBe(330);
    expect(out[0].competition).toBe('HIGH');
  });
});

describe('searchKeywords', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('calls keywordstool with signed headers and maps the result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keywordList: [{ relKeyword: 'a', monthlyPcQcCnt: 10, monthlyMobileQcCnt: 20, monthlyAvePcClkCnt: 0, monthlyAveMobileClkCnt: 0, compIdx: '중간', plAvgDepth: 1 }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await searchKeywords(['a', 'b']);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['X-API-KEY']).toBe('API');
    expect(init.headers['X-Customer']).toBe('CUST');
    expect(init.headers['X-Signature']).toBeTruthy();
    expect(res[0].keyword).toBe('a');
    expect(res[0].competition).toBe('MEDIUM');
  });

  it('throws AppError(502) on a non-2xx upstream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'err' }));
    await expect(searchKeywords(['a'])).rejects.toMatchObject({ statusCode: 502 });
  });
});
```
> `AppError` is constructed `new AppError(502, msg)`. Confirm its public field name in `packages/server/src/middleware/error.middleware.ts` (`statusCode` vs `status`) and align the `rejects.toMatchObject` key accordingly.
- [ ] **Step 2 (run):** `pnpm --filter server test naver-searchad`. Expected: FAIL.
- [ ] **Step 3 (impl):** Rewrite `naver-searchad.ts`:

```ts
import crypto from 'crypto';
import { config } from '../../../config/index.js';
import { AppError } from '../../../middleware/error.middleware.js';

const BASE_URL = 'https://api.searchad.naver.com';

export interface NaverKeyword {
  keyword: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
  totalSearchVolume: number;
  competition: 'HIGH' | 'MEDIUM' | 'LOW';
  pcClickCount: number;
  mobileClickCount: number;
  plAvgDepth: number;
}

/** Naver AD API signature: Base64(HMAC-SHA256(secret, `${timestamp}.${method}.${uri}`)). */
export function signNaverRequest(secretKey: string, timestamp: string, method: string, uri: string): string {
  return crypto.createHmac('sha256', secretKey).update(`${timestamp}.${method}.${uri}`).digest('base64');
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const digits = v.replace(/[^0-9.]/g, ''); // Naver returns "< 10"
    return digits ? Math.round(Number(digits)) : 0;
  }
  return 0;
}

function mapCompetition(compIdx: unknown): 'HIGH' | 'MEDIUM' | 'LOW' {
  const s = String(compIdx).toUpperCase();
  if (compIdx === '높음' || s === 'HIGH') return 'HIGH';
  if (compIdx === '낮음' || s === 'LOW') return 'LOW';
  return 'MEDIUM';
}

interface RawKeywordRow {
  relKeyword: string;
  monthlyPcQcCnt: unknown;
  monthlyMobileQcCnt: unknown;
  monthlyAvePcClkCnt: unknown;
  monthlyAveMobileClkCnt: unknown;
  compIdx: unknown;
  plAvgDepth: unknown;
}

export function mapKeywordList(rows: RawKeywordRow[]): NaverKeyword[] {
  return rows.map((r) => {
    const pc = toNum(r.monthlyPcQcCnt);
    const mobile = toNum(r.monthlyMobileQcCnt);
    return {
      keyword: r.relKeyword,
      pcSearchVolume: pc,
      mobileSearchVolume: mobile,
      totalSearchVolume: pc + mobile,
      competition: mapCompetition(r.compIdx),
      pcClickCount: toNum(r.monthlyAvePcClkCnt),
      mobileClickCount: toNum(r.monthlyAveMobileClkCnt),
      plAvgDepth: toNum(r.plAvgDepth),
    };
  });
}

/** Query Naver SearchAd /keywordstool for up to 5 hint keywords. */
export async function searchKeywords(keywords: string[]): Promise<NaverKeyword[]> {
  const { apiKey, secretKey, customerId } = config.naverAd;
  if (!apiKey || !secretKey || !customerId) {
    throw new AppError(502, 'Naver 키워드 API 키가 설정되지 않았습니다.');
  }
  const method = 'GET';
  const uri = '/keywordstool';
  const timestamp = Date.now().toString();
  const signature = signNaverRequest(secretKey, timestamp, method, uri);
  const hint = keywords.slice(0, 5).map((k) => k.replace(/\s+/g, '')).join(',');
  const qs = new URLSearchParams({ hintKeywords: hint, showDetail: '1' });

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${uri}?${qs.toString()}`, {
      method,
      headers: {
        'X-Timestamp': timestamp,
        'X-API-KEY': apiKey,
        'X-Customer': customerId,
        'X-Signature': signature,
      },
    });
  } catch (e) {
    throw new AppError(502, `Naver 키워드 조회 실패: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AppError(502, `Naver 키워드 조회 실패 (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { keywordList?: RawKeywordRow[] };
  return mapKeywordList(json.keywordList ?? []);
}
```
> Grep for importers of the old `getRelatedKeywords`/`NaverKeywordStat` before deleting them; leave whatever is still referenced.
- [ ] **Step 4 (run):** `pnpm --filter server test naver-searchad`. Expected: PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/server/src/services/mkt/external/naver-searchad.ts packages/server/src/services/mkt/external/__tests__/naver-searchad.test.ts
  git commit -m "feat(marketing): Naver SearchAd keyword tool (HMAC) + response mapper"
  ```

### Task 2.2: Implement `dataforseo.ts` (Basic-auth search_volume)

> Replaces the 501 skeleton (`services/mkt/external/dataforseo.ts:40`). `POST /v3/keywords_data/google/search_volume/live`, HTTP Basic auth (`Authorization: Basic base64(login:password)`), body `[{ keywords, location_code, language_code }]`, returns `{ tasks: [{ result: [{ keyword, search_volume, competition, cpc }] }] }`. Defaults `location_code=2410` (South Korea), `language_code='ko'`.

**Files:**
- Modify: `packages/server/src/services/mkt/external/dataforseo.ts`
- Test: `packages/server/src/services/mkt/external/__tests__/dataforseo.test.ts`

- [ ] **Step 1 (test — mapper + auth):**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../config/index.js', () => ({
  config: { dataforseo: { login: 'LOGIN', password: 'PASS' } },
}));

import { mapVolumeResult, getKeywordVolumes } from '../dataforseo.js';

describe('mapVolumeResult', () => {
  it('maps fields and defaults missing values to 0', () => {
    const out = mapVolumeResult([
      { keyword: '키즈영어', search_volume: 1200, competition: 0.4, cpc: 0.9 },
      { keyword: 'novol', search_volume: null, competition: null, cpc: null },
    ]);
    expect(out[0]).toEqual({ keyword: '키즈영어', searchVolume: 1200, competition: 0.4, cpc: 0.9 });
    expect(out[1]).toEqual({ keyword: 'novol', searchVolume: 0, competition: 0, cpc: 0 });
  });
});

describe('getKeywordVolumes', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('sends Basic auth + maps tasks[0].result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [{ result: [{ keyword: 'a', search_volume: 10, competition: 0.1, cpc: 0.2 }] }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await getKeywordVolumes(['a']);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Basic ' + Buffer.from('LOGIN:PASS').toString('base64'));
    expect(res[0]).toEqual({ keyword: 'a', searchVolume: 10, competition: 0.1, cpc: 0.2 });
  });

  it('throws AppError(502) on a non-2xx upstream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'err' }));
    await expect(getKeywordVolumes(['a'])).rejects.toMatchObject({ statusCode: 502 });
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter server test dataforseo`. Expected: FAIL.
- [ ] **Step 3 (impl):** Rewrite `getKeywordVolumes` (keep the unused `SerpResult`/`BacklinkSummary` 501 stubs if anything imports them):

```ts
import { config } from '../../../config/index.js';
import { AppError } from '../../../middleware/error.middleware.js';

export interface KeywordVolume {
  keyword: string;
  searchVolume: number;
  competition: number; // 0–1
  cpc: number;
}

interface RawVolumeRow {
  keyword: string;
  search_volume: number | null;
  competition: number | null;
  cpc: number | null;
}

export function mapVolumeResult(rows: RawVolumeRow[]): KeywordVolume[] {
  return rows.map((r) => ({
    keyword: r.keyword,
    searchVolume: r.search_volume ?? 0,
    competition: r.competition ?? 0,
    cpc: r.cpc ?? 0,
  }));
}

export async function getKeywordVolumes(
  keywords: string[],
  locationCode = 2410, // South Korea
  languageCode = 'ko'
): Promise<KeywordVolume[]> {
  const { login, password } = config.dataforseo;
  if (!login || !password) {
    throw new AppError(502, 'DataForSEO 자격 증명이 설정되지 않았습니다.');
  }
  const auth = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
  const body = [{ keywords, location_code: locationCode, language_code: languageCode }];

  let res: Response;
  try {
    res = await fetch('https://api.dataforseo.com/v3/keywords_data/google/search_volume/live', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new AppError(502, `Google 키워드 조회 실패: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AppError(502, `Google 키워드 조회 실패 (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { tasks?: Array<{ result?: RawVolumeRow[] }> };
  return mapVolumeResult(json.tasks?.[0]?.result ?? []);
}
```
- [ ] **Step 4 (run):** `pnpm --filter server test dataforseo`. Expected: PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/server/src/services/mkt/external/dataforseo.ts packages/server/src/services/mkt/external/__tests__/dataforseo.test.ts
  git commit -m "feat(marketing): DataForSEO Google search-volume (Basic auth) + mapper"
  ```

### Task 2.3: Keyword controller + routes

> Adds `controllers/mkt/keywords.controller.ts` (`naverKeywords` + `googleKeywords`) and mounts `/naver/keywords` + `/google/keywords`. Validates `keywords[]` → `AppError(400)`; responds `{ success, data: { keywords } }` (O-6).

**Files:**
- Create: `packages/server/src/controllers/mkt/keywords.controller.ts`
- Modify: `packages/server/src/routes/mkt.routes.ts`

- [ ] **Step 1 (impl — controller):** Create `keywords.controller.ts`:

```ts
import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { AppError } from '../../middleware/error.middleware.js';
import { searchKeywords } from '../../services/mkt/external/naver-searchad.js';
import { getKeywordVolumes } from '../../services/mkt/external/dataforseo.js';

/** POST /api/mkt/naver/keywords  Body: { keywords: string[] } */
export const naverKeywords = asyncHandler(async (req: Request, res: Response) => {
  const { keywords } = req.body as { keywords?: string[] };
  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new AppError(400, 'keywords[] is required and must be non-empty');
  }
  const result = await searchKeywords(keywords);
  res.json({ success: true, data: { keywords: result } });
});

/** POST /api/mkt/google/keywords  Body: { keywords: string[], locationCode?, languageCode? } */
export const googleKeywords = asyncHandler(async (req: Request, res: Response) => {
  const { keywords, locationCode, languageCode } = req.body as {
    keywords?: string[];
    locationCode?: number;
    languageCode?: string;
  };
  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new AppError(400, 'keywords[] is required and must be non-empty');
  }
  const result = await getKeywordVolumes(keywords, locationCode, languageCode);
  res.json({ success: true, data: { keywords: result } });
});
```
- [ ] **Step 2 (impl — routes):** In `mkt.routes.ts`, import + mount after the storage routes:

```ts
import { naverKeywords, googleKeywords } from '../controllers/mkt/keywords.controller.js';
// ── Keyword endpoints ─────────────────────────────────────────────────────────
router.post('/naver/keywords', naverKeywords);
router.post('/google/keywords', googleKeywords);
```
- [ ] **Step 3 (typecheck):** `pnpm --filter server typecheck` → PASS.
- [ ] **Step 4 (manual smoke):** With `pnpm --filter server dev` (port 3500), no creds:
  ```bash
  curl -s -X POST http://localhost:3500/api/mkt/naver/keywords -H "Content-Type: application/json" -d "{}"
  #  → 400 { "success": false, ... } (validation)
  curl -s -X POST http://localhost:3500/api/mkt/naver/keywords -H "Content-Type: application/json" -d "{\"keywords\":[\"영어유치원\"]}"
  #  → 502 "키 미설정" (graceful) OR real data if creds present
  ```
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/server/src/controllers/mkt/keywords.controller.ts packages/server/src/routes/mkt.routes.ts
  git commit -m "feat(marketing): /api/mkt/{naver,google}/keywords controller + routes"
  ```

---

## Chunk 3: Base article (AI/image hooks + TipTap editor + panel + tab shell)

> First visible win: a working 기본글 editor. This chunk also lands the shared AI/image hooks (used again by N-blog in Chunk 4) and the minimal `ContentTabs`/`LanguageSelector` shell so the panel is reachable. Hooks with pure parsing logic get a focused test; TipTap/panel UI uses **port → typecheck → manual-verify → commit**. All endpoints these hooks hit ALREADY exist (`/api/mkt/ai/generate` SSE, `/api/mkt/ai/generate-image`, `/api/mkt/storage/presign`).

### Task 3.1: `hooks/use-ai-generation.ts` (SSE wrapper)

> Ports CF `src/hooks/use-ai-generation.ts`. Wraps `parseSSEStream` (`lib/sse-stream-parser.ts`) over `POST /api/mkt/ai/generate`. Manages an `AbortController`, throttled streaming via `onChunk`, swallows `AbortError`, routes other errors to `onError`, calls `onComplete(fullText)` at end. Returns `{ isGenerating, generate, abort }`.

**Files:**
- Create: `packages/client/src/features/marketing/hooks/use-ai-generation.ts`
- Test: `packages/client/src/features/marketing/hooks/__tests__/use-ai-generation.test.tsx`

- [ ] **Step 1 (test):** Mock `fetch` to return an SSE `ReadableStream` of `data: {"text":"..."}` lines + `data: [DONE]`; assert `onComplete` receives the concatenated text and `isGenerating` toggles. Also assert an `{"error":"x"}` chunk routes to `onError`.

```ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiGeneration } from '../use-ai-generation';

function sseResponse(lines: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      const enc = new TextEncoder();
      for (const l of lines) c.enqueue(enc.encode(`data: ${l}\n\n`));
      c.close();
    },
  });
  return { ok: true, body } as unknown as Response;
}

it('streams chunks and calls onComplete with the full text', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(['{"text":"Hello"}', '{"text":" world"}', '[DONE]'])));
  const onComplete = vi.fn();
  const { result } = renderHook(() => useAiGeneration({ onComplete }));
  await act(async () => {
    result.current.generate('prompt', 'model');
  });
  await waitFor(() => expect(onComplete).toHaveBeenCalledWith('Hello world'));
  expect(result.current.isGenerating).toBe(false);
});

it('routes an error chunk to onError', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(['{"error":"boom"}', '[DONE]'])));
  const onError = vi.fn();
  const { result } = renderHook(() => useAiGeneration({ onError, onComplete: vi.fn() }));
  await act(async () => { result.current.generate('p', 'm'); });
  await waitFor(() => expect(onError).toHaveBeenCalledWith('boom'));
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/hooks/__tests__/use-ai-generation`. Expected: FAIL.
- [ ] **Step 3 (impl):** Port CF `use-ai-generation.ts`, changing the URL to `/api/mkt/ai/generate` and using `parseSSEStream` from `../lib/sse-stream-parser`. Shape:

```ts
import { useCallback, useRef, useState } from 'react';
import { parseSSEStream } from '../lib/sse-stream-parser';

export interface UseAiGenerationOptions {
  onChunk?: (full: string) => void;
  onComplete: (full: string) => void;
  onError?: (message: string) => void;
}

export function useAiGeneration({ onChunk, onComplete, onError }: UseAiGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (prompt: string, model: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsGenerating(true);
      let full = '';
      let streamError: string | null = null;
      try {
        const res = await fetch('/api/mkt/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
        }
        await parseSSEStream(res, {
          signal: controller.signal,
          onChunk: (c) => {
            if (c.error) { streamError = c.error; return; }
            if (c.text) { full += c.text; onChunk?.(full); }
          },
        });
        if (streamError) throw new Error(streamError);
        onComplete(full);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        onError?.((e as Error).message);
      } finally {
        setIsGenerating(false);
      }
    },
    [onChunk, onComplete, onError]
  );

  const abort = useCallback(() => abortRef.current?.abort(), []);
  return { isGenerating, generate, abort };
}
```
- [ ] **Step 4 (run):** test → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/hooks/use-ai-generation.ts packages/client/src/features/marketing/hooks/__tests__/use-ai-generation.test.tsx
  git commit -m "feat(marketing): useAiGeneration SSE wrapper (/api/mkt/ai/generate)"
  ```

### Task 3.2: `hooks/use-image-generation.ts` + `hooks/use-card-image-generation.ts`

> `use-image-generation` POSTs `/api/mkt/ai/generate-image` and returns `{ base64, mimeType }` (our endpoint returns `data.image` base64). `use-card-image-generation` ports CF `use-card-image-generation.ts:40-142`: gen → `convertToWebpBlob` → `uploadToR2` (fixed in 0.2) → `saveResult`, with a batch mode (filter by `shouldSkip`, 3s delay, progress, summary alert). No deep TDD (mostly orchestration + Canvas) — a small test for `use-image-generation`'s response unwrap, then **typecheck + manual-verify**.

**Files:**
- Create: `packages/client/src/features/marketing/hooks/use-image-generation.ts`
- Create: `packages/client/src/features/marketing/hooks/use-card-image-generation.ts`
- Test: `packages/client/src/features/marketing/hooks/__tests__/use-image-generation.test.tsx`

- [ ] **Step 1 (test — response unwrap):**

```ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageGeneration } from '../use-image-generation';

it('unwraps data.image into { base64, mimeType }', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { image: 'BASE64DATA' } }),
  }));
  const { result } = renderHook(() => useImageGeneration());
  let out: { base64: string; mimeType: string } | undefined;
  await act(async () => {
    out = await result.current.generateImage({ prompt: 'a cat', model: 'm', aspectRatio: '16:9' });
  });
  expect(out?.base64).toBe('BASE64DATA');
  expect(out?.mimeType).toBe('image/png');
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/hooks/__tests__/use-image-generation`. Expected: FAIL.
- [ ] **Step 3 (impl — `use-image-generation.ts`):**

```ts
import { useCallback } from 'react';

export interface GenerateImageArgs {
  prompt: string;
  model: string;
  aspectRatio?: string;
  referenceImages?: Array<{ base64: string; mimeType: string }>;
  signal?: AbortSignal;
}

export function useImageGeneration() {
  const generateImage = useCallback(
    async ({ prompt, model, aspectRatio, referenceImages, signal }: GenerateImageArgs) => {
      const res = await fetch('/api/mkt/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, aspectRatio, referenceImages }),
        signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { success?: boolean; data?: { image?: string } };
      if (!json.success || !json.data?.image) throw new Error('이미지 생성 응답이 비어 있습니다.');
      // Our server returns a base64 PNG (no data-URL prefix).
      return { base64: json.data.image, mimeType: 'image/png' as const };
    },
    []
  );
  return { generateImage };
}
```
- [ ] **Step 4 (run):** test → PASS.
- [ ] **Step 5 (impl — `use-card-image-generation.ts`):** Port CF `use-card-image-generation.ts` (config object `{ getPrompt, aspectRatio, shouldSkip, getModel, getImageModel }` + `generateForCard(cardId)` + `generateAll()`). Wire: `generateImage` (Task 3.2) → `convertToWebpBlob` (`../lib/image-utils`) → `uploadToR2(blob, { projectId, category:'images', fileName: `${cardId}.webp`, contentType, contentId })` (`../api/use-r2-upload`); on upload failure fall back to a `data:` URL; then `saveResult(cardId, url, prompt)` via the caller-supplied callback (the panel passes `useUpdateBlogCard`). Batch: filter `shouldSkip`, 3s delay between cards, progress counter, summary `alert`. Keep CF's per-card abort. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/hooks/use-image-generation.ts packages/client/src/features/marketing/hooks/use-card-image-generation.ts packages/client/src/features/marketing/hooks/__tests__/use-image-generation.test.tsx
  git commit -m "feat(marketing): image-generation + card-image-generation hooks (gen→webp→R2→save)"
  ```

### Task 3.3: `hooks/use-auto-save.ts` (2 s base-article autosave)

> Ports CF `src/hooks/use-auto-save.ts`. Returns `{ schedule, flush, lastSaved }`; `delay=2000`; flush on unmount. The panel passes `onSave` → `useUpsertBaseArticle`.

**Files:**
- Create: `packages/client/src/features/marketing/hooks/use-auto-save.ts`
- Test: `packages/client/src/features/marketing/hooks/__tests__/use-auto-save.test.tsx`

- [ ] **Step 1 (test — fake timers):**

```ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../use-auto-save';

it('debounces schedule() and fires onSave after the delay', () => {
  vi.useFakeTimers();
  const onSave = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }));
  act(() => { result.current.schedule('v1'); result.current.schedule('v2'); });
  expect(onSave).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(2000); });
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith('v2');
  vi.useRealTimers();
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/hooks/__tests__/use-auto-save`. Expected: FAIL.
- [ ] **Step 3 (impl):** Port CF's hook. The payload type is generic `<T>`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAutoSaveOptions<T> {
  onSave: (payload: T) => void | Promise<void>;
  delay?: number;
}

export function useAutoSave<T>({ onSave, delay = 2000 }: UseAutoSaveOptions<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<T | null>(null);
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  const flush = useCallback(async () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (pendingRef.current === null) return;
    const payload = pendingRef.current;
    pendingRef.current = null;
    await onSaveRef.current(payload);
    setLastSaved(new Date());
  }, []);

  const schedule = useCallback((payload: T) => {
    pendingRef.current = payload;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void flush(); }, delay);
  }, [delay, flush]);

  useEffect(() => () => { void flush(); }, [flush]); // flush on unmount
  return { schedule, flush, lastSaved };
}
```
- [ ] **Step 4 (run):** test → PASS.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/hooks/use-auto-save.ts packages/client/src/features/marketing/hooks/__tests__/use-auto-save.test.tsx
  git commit -m "feat(marketing): useAutoSave (2s debounce + flush on unmount)"
  ```

### Task 3.4: TipTap editor — `editor/EditorToolbar.tsx` + `editor/BaseArticleEditor.tsx`

> Ports CF `src/components/editor/editor-toolbar.tsx` + `base-article-editor.tsx`. **DROP `immediatelyRender:false`** (CF `base-article-editor.tsx:62` — Next-SSR-only). Keep the `editorProps.handleDrop`/`handlePaste` image upload, but route through the Phase 0 `uploadToR2` (`../../api/use-r2-upload`) against `/api/mkt/storage/presign` (uploadUrl) — NOT CF's hand-rolled `/api/storage/presign`+`presignedUrl`. `BubbleMenu` imports from `@tiptap/react/menus` (TipTap 3.x). Strip `prose` classNames (O-8; styles come from the scoped `.tiptap` CSS in Task 0.7). No TDD (editor is interaction-heavy) — **port → typecheck → manual-verify → commit**.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/editor/EditorToolbar.tsx`
- Create: `packages/client/src/features/marketing/components/content/editor/BaseArticleEditor.tsx`

- [ ] **Step 1 (port `EditorToolbar`):** Copy CF `editor-toolbar.tsx`. Props `{ editor: Editor | null; projectId? }`. Formatting buttons (H1/H2/H3, bold/italic/strike, lists, quote, hr, image). The image button presign-uploads via `uploadToR2` then `editor.chain().focus().setImage({ src: publicUrl }).run()`. Rewire imports (`../../../ui/button`, `../../../api/use-r2-upload`, `lucide-react`). R-1: verify each lucide icon at `^1.17.0`.
- [ ] **Step 2 (port `BaseArticleEditor`):** Copy CF `base-article-editor.tsx`. `forwardRef<BaseArticleEditorRef>` exposing `setContent / getHTML / getPlainText / replaceSelection`. Props `{ initialContent?; onUpdate?(html, plainText, wordCount); onPartialRegenerate?(selectedText); projectId? }`. Use `useEditor` with `StarterKit`, `Image`, `Placeholder`; **omit `immediatelyRender`**. Keep the guarded `setContent(initialContent, { emitUpdate:false })` sync effect (CF :104-108) to avoid autosave feedback loops. `handleDrop`/`handlePaste` route through `uploadToR2` (same `/api/mkt` correction). `BubbleMenu` from `@tiptap/react/menus` with the "이 부분 다시 쓰기" button → `onPartialRegenerate(editor.state.selection …)`. Word count via `countWords` from `../../../lib/utils` (already ported). NO `prose` classNames on `EditorContent` — wrap content area in a `.tiptap`-styled container (the scoped CSS targets `.marketing-scope .tiptap …`).
- [ ] **Step 3 (R-1 + R-3 + typecheck):** Confirm no remaining `/api/storage` (must be `/api/mkt/storage`) or `presignedUrl` (must be `uploadUrl`, but prefer reusing `uploadToR2` so you never touch the field directly). Verify lucide icons. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/editor/EditorToolbar.tsx packages/client/src/features/marketing/components/content/editor/BaseArticleEditor.tsx
  git commit -m "feat(marketing): TipTap BaseArticleEditor + EditorToolbar (R2 image upload)"
  ```

### Task 3.5: `PromptEditDialog.tsx` + `TopicSuggestionDialog.tsx`

> Both verbatim ports (use `ui/dialog`/`ui/textarea`/`ui/button`/`ui/card`). No TDD.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/PromptEditDialog.tsx`
- Create: `packages/client/src/features/marketing/components/content/TopicSuggestionDialog.tsx`

- [ ] **Step 1 (port):** Copy CF `prompt-edit-dialog.tsx` (review/edit a generated prompt before streaming) and `topic-suggestion-dialog.tsx` (`TopicSuggestion = { title; outline }` cards + hint input + regenerate + select). Rewire imports to `../../ui/*`. `TopicSuggestionDialog` generates via `useAiGeneration` + `buildTopicSuggestionPrompt` (`../../lib/prompt-builder`) and parses with the `[\s\S]*` JSON match (CF `base-article-panel.tsx:130`).
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/PromptEditDialog.tsx packages/client/src/features/marketing/components/content/TopicSuggestionDialog.tsx
  git commit -m "feat(marketing): PromptEditDialog + TopicSuggestionDialog"
  ```

### Task 3.6: `BaseArticlePanel.tsx`

> Ports CF `base-article-panel.tsx`. Host for the editor + AI generate + topic + 원장님 컨펌 toggle + autosave. Reads its slice from `useContent(content.id).data?.baseArticle`; writes via `useUpsertBaseArticle` + `useUpdateContent`. No TDD — **port → typecheck → manual-verify → commit**.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/BaseArticlePanel.tsx`

- [ ] **Step 1 (port outer/inner):** Mirror CF's outer/inner split: outer reads graph + keys the inner on `content.id` (CF :380-386); inner props `{ content: Content; project: Project }`. Wire:
  - word-count badge (from `baseArticle.word_count` / `countWords`).
  - "AI 주제뽑기" → `TopicSuggestionDialog` → on select, `useUpdateContent(content.id, { topic })`.
  - "AI 글 생성" (`GenerationButton variant="text"`, disabled until `content.topic`) → open `PromptEditDialog` seeded with `buildBaseArticlePrompt({ project, content })` → on confirm, `useAiGeneration.generate(prompt, channelModels.textModel)`; stream into the editor throttled to **200 ms** (CF :91-95); on complete strip HTML→plain (`replace(/<[^>]*>/g,' ')`), `countWords`, `useUpsertBaseArticle({ contentId: content.id, data: { body, body_plain_text, word_count, prompt_used } })`.
  - bubble-menu partial regenerate → `buildPartialRegenerationPrompt` then `editorRef.replaceSelection(streamedText)`.
  - **"원장님 컨펌"** toggle → `useUpdateContent(content.id, { confirmed })` (CF :340-363).
  - "Perplexity 첨삭" button rendered **disabled** (CF :232).
  - **2 s autosave**: `useAutoSave({ onSave: (html)=>{ const plain = …; upsert(...) }, delay:2000 })`; editor `onUpdate` → `schedule(html)`.
  - `useChannelModels(project.id, 'base-article')` (text only).
- [ ] **Step 2 (translation overlay — read-only, 1a):** Port CF's non-ko overlay (CF :304-318) as **read-only**: when `selectedLanguage !== 'ko'`, read an existing translation from `baseArticle.factcheck_report?.translations?.[lang]` via `/api/mkt/storage/proxy` (Phase 0 `storage.controller.ts:68`) and render it; if absent show "번역되지 않음". **No "AI 번역" button in 1a** (generation = Phase 1b).
- [ ] **Step 3 (R-1 + typecheck):** Verify lucide icons; confirm no `prose` classNames, no `/api/storage` drift. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/BaseArticlePanel.tsx
  git commit -m "feat(marketing): BaseArticlePanel (AI generate, topic, partial regen, autosave, confirm)"
  ```

### Task 3.7: `LanguageSelector.tsx` + `ContentTabs.tsx` + mount in `ContentPage`

> Minimal shell so the base-article panel is reachable. `ContentTabs` renders 7 tabs but only base-article is active here (blog/self_hosted added in Chunk 4/5; the other four are placeholders now). `LanguageSelector` derives tabs from `project.target_languages` (O-4), ko pinned, with `onTranslate` a **stub alert** (translation = 1b).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/LanguageSelector.tsx`
- Create: `packages/client/src/features/marketing/components/content/ContentTabs.tsx`
- Modify: `packages/client/src/features/marketing/pages/ContentPage.tsx`

- [ ] **Step 1 (port `LanguageSelector`):** Copy CF `language-selector.tsx`. Props `{ channel; onTranslate(lang); translationStatuses }`. Source of languages = `useProject(projectId).data?.target_languages` (O-4) — render only when `length >= 2`; ko always present + first. Switching a tab sets `useUIStore().setSelectedLanguage(lang)`. **`onTranslate` is a stub** → `alert('번역은 곧 지원됩니다 (Phase 1b)')`. Optionally use `@tangobook/shared` `SUPPORTED_LANGUAGES` only for label/flag lookup (not the source).
- [ ] **Step 2 (port `ContentTabs`):** Copy CF `content-tabs.tsx`. Reads `useUIStore` (`selectedContentId`/`selectedProjectId`/`selectedLanguage`) + `useContent`/`useProject`. **7 tabs** (CF :33-41): `기본글`(base-article) · `N 블로그`(blog) · `내부 블로그`(self_hosted) · `카드뉴스`(cardnews) · `스레드`(threads) · `롱폼`(youtube) · `숏폼`(shorts). In THIS task only **base-article** renders its panel (`<BaseArticlePanel content={…} project={…} />`); blog/self_hosted render a temporary "준비 중" placeholder (replaced in Chunk 4/5); cardnews/threads/youtube/shorts render the centered "준비 중" card (generalize CF's shorts placeholder JSX :202-224). Language behavior: render `<LanguageSelector>`; **ko pinned**; the `blog` tab is hidden when `selectedLanguage !== 'ko'` and auto-switches to base-article (CF :49-53, :168). **Do NOT import `channel-translator`/`translateAndSaveChannel`** — `onTranslate` is the stub.
- [ ] **Step 3 (mount):** Edit `ContentPage.tsx` — replace the right-pane placeholder (`:13-16`) so it renders `<ContentTabs />` when a content is selected:

```tsx
import { ContentListPanel } from '../components/project/ContentListPanel';
import { ContentTabs } from '../components/content/ContentTabs';
import { useUIStore } from '../store/ui-store';

export function ContentPage() {
  const selectedContentId = useUIStore((s) => s.selectedContentId);
  return (
    <div className="flex h-full">
      <ContentListPanel />
      <div className="flex-1 min-w-0">
        {selectedContentId ? (
          <ContentTabs />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            콘텐츠를 선택하세요
          </div>
        )}
      </div>
    </div>
  );
}
```
- [ ] **Step 4 (R-1 + typecheck):** lucide icons; `pnpm --filter client typecheck` → PASS.
- [ ] **Step 5 (manual-verify @superpowers:verification-before-completion):** `pnpm dev`; go to `/marketing/content`; create or select a content → 기본글 tab renders the editor → type text (TopBar save indicator transitions on 2 s autosave) → set a topic via "AI 주제뽑기" → "AI 글 생성" streams into the editor → reload restores the body → toggle "원장님 컨펌" and confirm it persists (reload). Switch language tab (if project has ≥2 languages): non-ko hides the blog tab and shows "번역되지 않음".
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/LanguageSelector.tsx packages/client/src/features/marketing/components/content/ContentTabs.tsx packages/client/src/features/marketing/pages/ContentPage.tsx
  git commit -m "feat(marketing): ContentTabs shell + LanguageSelector + mount in ContentPage"
  ```

---

## Chunk 4: N블로그 (Naver Blog) — 4-step workflow + SEO auto-retry

> The heart of Phase 1a. Ports CF `blog-panel.tsx` (1,271 lines) onto the hooks from Chunks 1-3. **Strip** the golden-keyword pool + AI auto-pick (CF :451-545 — depend on the Ideas module; OUT per O-2); keep manual primary/secondary keyword entry + `NaverKeywordPanel` search. The SEO auto-retry feedback builder is extracted to `lib/seo-feedback.ts` so it is unit-testable apart from the panel (spec §17). `formatForMobile` (in `BlogCardItem`) also gets a focused jsdom test. UI-heavy components use **port → typecheck → manual-verify → commit**.

### Task 4.1: `lib/seo-feedback.ts` (extracted `buildSeoFeedback`)

> CF defines `buildSeoFeedback` inline in `blog-panel.tsx:252-258`. Extract it (and the `SEO_THRESHOLD` constant) so the retry filter is testable. Used by `BlogPanel` (Task 4.8). N-blog ONLY (internal-blog does not use it — O-3).

**Files:**
- Create: `packages/client/src/features/marketing/lib/seo-feedback.ts`
- Test: `packages/client/src/features/marketing/lib/__tests__/seo-feedback.test.ts`

- [ ] **Step 1 (test):**

```ts
import { describe, it, expect } from 'vitest';
import { buildSeoFeedback, SEO_THRESHOLD } from '../seo-feedback';
import type { SeoDetail } from '../seo-scorer';

const d = (over: Partial<SeoDetail>): SeoDetail => ({
  category: 'structure', label: '구조', score: 5, maxScore: 15, message: 'm', ...over,
});

describe('buildSeoFeedback', () => {
  it('excludes image + title categories and only includes items below the 90% threshold', () => {
    const fb = buildSeoFeedback([
      d({ category: 'image', score: 0, maxScore: 10 }),       // excluded (image)
      d({ category: 'title', score: 0, maxScore: 15 }),       // excluded (title)
      d({ category: 'structure', score: 5, maxScore: 15 }),   // included (5 < 13.5)
      d({ category: 'meta', score: 5, maxScore: 5 }),         // excluded (full marks)
    ]);
    expect(fb).toContain('구조');
    expect(fb).not.toContain('이미지');
    // 3 of 4 excluded → exactly one line
    expect(fb!.split('\n')).toHaveLength(1);
  });

  it('returns null when nothing is below threshold', () => {
    expect(buildSeoFeedback([d({ category: 'structure', score: 15, maxScore: 15 })])).toBeNull();
  });

  it('SEO_THRESHOLD is 0.9', () => {
    expect(SEO_THRESHOLD).toBe(0.9);
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/lib/__tests__/seo-feedback`. Expected: FAIL.
- [ ] **Step 3 (impl):** Create `lib/seo-feedback.ts` (verbatim logic from CF :252-258):

```ts
import type { SeoDetail } from './seo-scorer';

export const SEO_THRESHOLD = 0.9; // 90%

/** Build a retry-feedback string from failing SEO categories (excludes image + title). */
export function buildSeoFeedback(details: SeoDetail[]): string | null {
  const failedItems = details
    .filter(
      (d) => d.category !== 'image' && d.category !== 'title' && d.score < d.maxScore * SEO_THRESHOLD
    )
    .map((d) => `- ${d.label}: ${d.score}/${d.maxScore} (${d.message})`);
  if (failedItems.length === 0) return null;
  return failedItems.join('\n');
}
```
- [ ] **Step 4 (run):** test → PASS (3 cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/lib/seo-feedback.ts packages/client/src/features/marketing/lib/__tests__/seo-feedback.test.ts
  git commit -m "feat(marketing): extract buildSeoFeedback (testable SEO retry filter)"
  ```

### Task 4.2: `api/use-keywords.ts` (client fetch wrappers, unwrap `.data` — O-6)

> Thin wrappers around `POST /api/mkt/{naver,google}/keywords` that unwrap the `{ success, data }` envelope and return the inner `keywords` array (so the ported panels consume `keywords` exactly as CF did). No TDD (trivial fetch) — typecheck only.

**Files:**
- Create: `packages/client/src/features/marketing/api/use-keywords.ts`

- [ ] **Step 1 (impl):**

```ts
// Row interfaces are defined locally below — do NOT import server types into the client bundle.

async function postKeywords<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { keywords?: T };
    error?: string;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error || `키워드 조회 실패 (HTTP ${res.status})`);
  }
  return (json.data?.keywords ?? []) as T;
}

export interface NaverKeywordRow {
  keyword: string;
  pcSearchVolume: number;
  mobileSearchVolume: number;
  totalSearchVolume: number;
  competition: 'HIGH' | 'MEDIUM' | 'LOW';
  pcClickCount: number;
  mobileClickCount: number;
  plAvgDepth: number;
}
export interface GoogleKeywordRow {
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
}

export function fetchNaverKeywords(keywords: string[]): Promise<NaverKeywordRow[]> {
  return postKeywords<NaverKeywordRow[]>('/api/mkt/naver/keywords', { keywords });
}

export function fetchGoogleKeywords(
  keywords: string[],
  locationCode?: number,
  languageCode?: string
): Promise<GoogleKeywordRow[]> {
  return postKeywords<GoogleKeywordRow[]>('/api/mkt/google/keywords', {
    keywords,
    locationCode,
    languageCode,
  });
}
```
> **Type note:** do NOT cross-import server types into the client bundle. The row interfaces (`NaverKeywordRow`/`GoogleKeywordRow`) are defined locally in `use-keywords.ts` (as above). The client and server row shapes are duplicated by design (there is no shared package for marketing types) — keep them in sync with `naver-searchad.ts` `NaverKeyword` / `dataforseo.ts` `KeywordVolume` if those change.
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-keywords.ts
  git commit -m "feat(marketing): keyword fetch wrappers (unwrap {success,data}, O-6)"
  ```

### Task 4.3: `NaverKeywordPanel.tsx`

> Ports CF `naver-keyword-panel.tsx`. Keyword search table → set primary / add secondary. Calls `fetchNaverKeywords` (Task 4.2). Degrades gracefully (error → toast/inline message, manual entry still works). No TDD.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/NaverKeywordPanel.tsx`

- [ ] **Step 1 (port):** Copy CF `naver-keyword-panel.tsx`. Props `{ onSetPrimary(kw); onAddSecondary(kw); primaryKeyword; secondaryKeywords }`. Replace CF's direct `/api/naver/keywords` fetch with `fetchNaverKeywords` (`../../api/use-keywords`). Result rows: `{ keyword, pcSearchVolume, mobileSearchVolume, totalSearchVolume, competition }`; competition labels HIGH/MEDIUM/LOW. Rewire `Button`/`Input`/`Badge` to `../../ui/*`.
- [ ] **Step 2 (R-1 + typecheck):** lucide icons; `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/NaverKeywordPanel.tsx
  git commit -m "feat(marketing): NaverKeywordPanel (search → set primary/secondary)"
  ```

### Task 4.4: `SeoScoreDisplay.tsx`

> Extract from CF's inline component (`blog-panel.tsx:36-66`) into its own file (Tangobook prefers one component per file). Props `{ score: number; details: SeoDetail[] }`. Collapsible: big number + per-category breakdown bars. N-blog ONLY. No TDD.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/SeoScoreDisplay.tsx`

- [ ] **Step 1 (extract):** Copy the inline `SeoScoreDisplay` JSX from CF `blog-panel.tsx:36-66` into `SeoScoreDisplay.tsx`. Import `SeoDetail` from `../../lib/seo-scorer`. Rewire `cn`/`ui` imports.
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/SeoScoreDisplay.tsx
  git commit -m "feat(marketing): SeoScoreDisplay (extracted from blog-panel)"
  ```

### Task 4.5: `ChannelModelSelector.tsx` + `ChannelContentList.tsx`

> `ChannelModelSelector` ports CF `channel-model-selector.tsx` (model/aspect/style row + collapsible image-instruction textarea; uses `TEXT_MODELS`/`IMAGE_MODELS` from `lib/ai-models` + `ASPECT_RATIO_PRESETS`/`ImageStyleSelector` from Task 0.4). `ChannelContentList` ports CF `channel-content-list.tsx` (generic accordion; **omit** `onAddToQueue`/`publishChannels` — publish = Phase 3) and wraps each expanded item in the ported `ErrorBoundary` (Task 0.5) with `resetKeys=[id]`. No TDD.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/ChannelModelSelector.tsx`
- Create: `packages/client/src/features/marketing/components/content/ChannelContentList.tsx`

- [ ] **Step 1 (port `ChannelModelSelector`):** Copy CF `channel-model-selector.tsx`. Props per CF :10-26 (`textModel, imageModel, onTextModelChange, onImageModelChange, showImageModel?, aspectRatio?, onAspectRatioChange?, imageStyle?, onImageStyleChange?, showImageSettings?, defaultAspectRatio?, imageInstruction?, onImageInstructionChange?`). Imports: `Select`/`KoreanTextarea` from `../../ui/*`, `TEXT_MODELS`/`IMAGE_MODELS` from `../../lib/ai-models`, `ASPECT_RATIO_PRESETS`+`ImageStyleSelector` from `./ImageStyleSelector`.
- [ ] **Step 2 (port `ChannelContentList`):** Copy CF `channel-content-list.tsx`. Generic `<T>`; props `{ items, getId, getTitle, onTitleChange, onAdd: ()=>Promise<string>, onDelete, accentColor?, addLabel, renderContent }` — **omit** `onAddToQueue`/`publishChannels`. Replace `@/components/error-boundary` import with `../ErrorBoundary` (Task 0.5). First item auto-expands (CF :43-47). Each expanded item wrapped in `<ErrorBoundary resetKeys={[id]}>`.
- [ ] **Step 3 (R-1 + typecheck):** lucide icons; `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/ChannelModelSelector.tsx packages/client/src/features/marketing/components/content/ChannelContentList.tsx
  git commit -m "feat(marketing): ChannelModelSelector + ChannelContentList (ErrorBoundary, no publish)"
  ```

### Task 4.6: `ImageCardWidget.tsx`

> Ports CF `image-card-widget.tsx`. Image slot with hover actions (zoom/regen/download/upload/delete + drag-drop + history strip + generating overlay). Replace `next/image` with `<img>`; uses `ImageLightbox` (Task 0.4). `image-editor-dialog` is OUT (O-7) — pass `onEdit={undefined}` so the edit button hides. No TDD.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/ImageCardWidget.tsx`

- [ ] **Step 1 (port):** Copy CF `image-card-widget.tsx`. Props per CF :9-36 (`src, alt?, history?, aspectClass?, onRegenerate?, onAbort?, onDelete?, onUpload?, onRestore?, onEdit?, isGenerating?, placeholder?, hideBottomActions?, className?`). Remove `@next/next/no-img-element` disables; plain `<img>`. Rewire `ImageLightbox` import to `./ImageLightbox`, `ui`/`cn` imports.
- [ ] **Step 2 (R-1 + typecheck):** lucide icons (`ZoomIn`, `RefreshCw`, `Download`, `Upload`, `Trash2`, `Pencil`); `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/ImageCardWidget.tsx
  git commit -m "feat(marketing): ImageCardWidget (lightbox, hover actions, no editor dialog)"
  ```

### Task 4.7: `BlogCardItem.tsx` (+ export `formatForMobile`, `AddCardButton`)

> Ports CF `blog-card-item.tsx`. One blog **section** = image area (top, `ImageCardWidget`) + per-section TipTap editor (bottom, `SectionTextEditor`, 300 ms local debounce; **drop `immediatelyRender:false`**) with `GlobalCardStyle` CSS-var scoping. Exports `formatForMobile(html)` (pure DOM transform — unit-tested) and `AddCardButton`. Per-section persistence routes through `useUpdateBlogCard` + `useDebouncedSave('mkt_blog_cards', card.id)` (one instance per card.id — Phase 0 util doc; spec §5.6).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/BlogCardItem.tsx`
- Test: `packages/client/src/features/marketing/components/content/__tests__/BlogCardItem.formatForMobile.test.tsx`

- [ ] **Step 1 (test — `formatForMobile`, jsdom):**

```ts
import { describe, it, expect } from 'vitest';
import { formatForMobile } from '../BlogCardItem';

describe('formatForMobile', () => {
  it('splits a long <p> (>200 chars) at sentence boundaries into multiple <p>', () => {
    const sentence = '가나다라마바사아자차카타파하 짧은 문장입니다. ';
    const long = sentence.repeat(20); // >200 chars
    const out = formatForMobile(`<p>${long}</p>`);
    const div = document.createElement('div');
    div.innerHTML = out;
    expect(div.querySelectorAll('p').length).toBeGreaterThan(1);
  });

  it('leaves a short <p> as a single <p> and injects margin-bottom', () => {
    const out = formatForMobile('<p>짧은 문단</p>');
    const div = document.createElement('div');
    div.innerHTML = out;
    const ps = div.querySelectorAll('p');
    expect(ps.length).toBe(1);
    expect((ps[0] as HTMLElement).style.marginBottom).toBe('0.8em');
  });

  it('is idempotent for already-short paragraphs (count stable)', () => {
    const once = formatForMobile('<p>한 문단</p><p>또 한 문단</p>');
    const twice = formatForMobile(once);
    const d1 = document.createElement('div'); d1.innerHTML = once;
    const d2 = document.createElement('div'); d2.innerHTML = twice;
    expect(d2.querySelectorAll('p').length).toBe(d1.querySelectorAll('p').length);
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/components/content/__tests__/BlogCardItem.formatForMobile`. Expected: FAIL.
- [ ] **Step 3 (impl — port the file, export `formatForMobile` VERBATIM):** Copy CF `blog-card-item.tsx`. Export `formatForMobile` exactly (CF :39-88):

```ts
export function formatForMobile(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  const newNodes: Node[] = [];
  for (const node of Array.from(div.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'P') {
      const p = node as HTMLParagraphElement;
      const text = p.textContent || '';
      if (text.length > 200) {
        const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
        let chunk = '';
        const chunks: string[] = [];
        for (const s of sentences) {
          if ((chunk + s).length > 200 && chunk) {
            chunks.push(chunk.trim());
            chunk = s;
          } else {
            chunk += s;
          }
        }
        if (chunk.trim()) chunks.push(chunk.trim());
        for (const c of chunks) {
          const newP = document.createElement('p');
          newP.textContent = c;
          newNodes.push(newP);
        }
      } else {
        newNodes.push(p.cloneNode(true));
      }
    } else {
      newNodes.push(node.cloneNode(true));
    }
  }

  const result = document.createElement('div');
  for (const node of newNodes) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'P') {
      (node as HTMLElement).style.marginBottom = '0.8em';
    }
    result.appendChild(node);
  }
  return result.innerHTML;
}
```
  Then port the rest of `blog-card-item.tsx`: the `SectionTextEditor` (TipTap StarterKit + Image + Placeholder, **drop `immediatelyRender`**, 300 ms `onUpdate` debounce → `onTextChange`), the `GlobalCardStyle` `<style>` block (CF :313-340 — scoped to `.blog-card-editor .tiptap h1/h2/h3/p/li` driven by `--heading-font/-size/-weight`, `--body-*`, `--text-align`; port verbatim, with `!important` on top of the base `.tiptap` rules from Task 0.7), the `ImageCardWidget` wiring, a minimal inline `ImageStyleSelector` (or reuse `./ImageStyleSelector`), and `KoreanInput`/`KoreanTextarea` from `../../ui`. Props per CF :21-31 (`card, index, onUpdate(cardId, content), onDelete(cardId), onGenerateImage?, onAbortImage?, isGeneratingImage?, generatingCardId?, globalStyle?`). `image-editor-dialog` OUT → `onEdit={undefined}` to `ImageCardWidget`. Export `AddCardButton` (CF :355). Persist text via `useUpdateBlogCard` routed through `useDebouncedSave('mkt_blog_cards', card.id)`.
- [ ] **Step 4 (run):** test → PASS (3 cases).
- [ ] **Step 5 (R-1 + typecheck):** lucide icons; no `prose` classNames; `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/BlogCardItem.tsx packages/client/src/features/marketing/components/content/__tests__/BlogCardItem.formatForMobile.test.tsx
  git commit -m "feat(marketing): BlogCardItem (section editor + GlobalCardStyle + formatForMobile)"
  ```

### Task 4.8: `BlogPanel.tsx` (4-step workflow + SEO auto-retry loop) + wire into ContentTabs

> Ports CF `blog-panel.tsx` minus golden-keyword/auto-pick (O-2). Outer reads graph; `BlogPanelInner` props `{ blogContent, content, project, hasBaseArticle, channelModels, maxRetries }` (CF :81-88). 4 steps via `WorkflowStepBar`: 키워드(1) → 구조(2) → 생성(3) → SEO(4); auto-jump to step 3 if cards exist (CF :140-145). No TDD — **port → typecheck → manual-verify → commit** (the load-bearing pure bits — `formatForMobile`, `buildSeoFeedback`, `calculateNaverSeoScore` — are already independently tested).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/BlogPanel.tsx`
- Modify: `packages/client/src/features/marketing/components/content/ContentTabs.tsx` (wire the `blog` tab)

- [ ] **Step 1 (port the SEO auto-retry loop EXACTLY, CF :247-365):** In `BlogPanelInner`, on generate-complete:
  1. Parse JSON tolerantly (object-with-sections OR bare array): `objMatch = fullText.match(/\{[\s\S]*\}/)`, `arrMatch = fullText.match(/\[[\s\S]*\]/)` (CF :270-293). Extract `seo_title`, `primary_keyword`, `secondary_keywords`, `sections`.
  2. Build `BlogCard[]` from `sections` (card_type `'text'`, content `{ text, url:'', alt, caption, image_prompt, image_style:'' }`, `sort_order:i`, `generateId()`).
  3. `formatForMobile` each card's `text`; `useSetBlogCards({ blogContentId, contentId, cards: formattedCards })`.
  4. `useUpdateBlogContent({ id: blogContent.id, contentId, updates: { seo_title: finalTitle, naver_keywords: {...} } })`.
  5. `seoCheck = calculateNaverSeoScore(finalTitle, newCards, { primary, secondary })`; `feedback = buildSeoFeedback(seoCheck.details)` (`../../lib/seo-feedback`).
  6. If `feedback && maxRetries > 0 && retryCountRef.current < maxRetries`: increment `retryCountRef`, rebuild `buildBlogPrompt({...})`, append the SEO-fix block (CF :347 template: `## ⚠️ SEO 점수 개선 필요 (재생성 N/M회)\n현재 총점: …/100 (이미지 제외)\n…개선하세요:\n${feedback}\n이전 응답… 유지하되 위 항목만…`), and `setTimeout(() => generateRef.current?.(seoFixPrompt, channelModels.textModel), 100)`. Else reset `retryCountRef.current = 0`. On parse failure: `retryCountRef.current = 0; alert('블로그 섹션 파싱 실패. 다시 시도해 주세요.')`. On `onError`: `retryCountRef.current = 0; alert(...)`. (Port the `generateRef`/`useEffect(() => { generateRef.current = generate })` indirection.)
- [ ] **Step 2 (port the rest):** Live score `seoResult = useMemo(() => calculateNaverSeoScore(seoTitle, cards, { primary, secondary }), [seoTitle, cards, primary, secondary])` (CF :215) → `<SeoScoreDisplay/>`. `GlobalCardStyle` controls persisted to `seo_details.globalStyle` (CF :133-137) via `useUpdateBlogContent`. PC/mobile `viewMode` toggle + `applyMobileFormatAll` (maps `formatForMobile` over all cards). Image gen via `useCardImageGeneration` config — `getPrompt` uses card `image_prompt`+`image_style` else `buildBlogImagePromptForCard(project, cards, idx, style, imageInstruction)` (`../../lib/prompt-builder`); `aspectRatio` default `'16:9'`; `shouldSkip` if card already has url (CF :368-386); `saveResult` → `useUpdateBlogCard`. Per-card button + "전체 이미지" batch. `NaverKeywordPanel` in step 1; manual primary/secondary entry. `seoRetryLimit` default **3**, range 0-10 (CF :1193, :1224-1232) → `maxRetries`. **STRIP** golden-keyword pool + AI auto-pick (CF :451-545) and any `savedKeywords`/`getStrategy`/`imported_strategy` references (O-2).
- [ ] **Step 3 (`ChannelContentList` wiring):** `accentColor="bg-indigo-600 hover:bg-indigo-700"`; **omit** `onAddToQueue`/`publishChannels`; `getTitle` → `item.title || \`블로그 글 ${i+1}\``; `onAdd` → `useCreateBlogContent({ contentId, channel:'naver_blog' })` (returns Promise<string>); `onDelete` → `useDeleteBlogContent`; `renderContent` → `<BlogPanelInner .../>`.
- [ ] **Step 4 (wire into ContentTabs):** Replace the temporary `blog`-tab "준비 중" placeholder (Task 3.7) with `<BlogPanel />`. Keep the ko-only hide/auto-switch behavior already in `ContentTabs`.
- [ ] **Step 5 (R-1 + typecheck):** lucide icons; no `prose`; no golden-keyword leftovers; `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6 (manual-verify @superpowers:verification-before-completion):** `/marketing/content` → 콘텐츠 → N블로그 tab → add a blog post → step 1 enter primary/secondary keywords (NaverKeywordPanel search populates if creds present, else manual) → step 2 (구조) → step 3 generate (cards stream in, mobile-formatted) → SEO score updates live; if < 90 the panel **visibly re-generates** and stops at `maxRetries` → per-card + "전체 이미지" image gen with progress → PC/mobile toggle reflows → GlobalCardStyle change applies.
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/BlogPanel.tsx packages/client/src/features/marketing/components/content/ContentTabs.tsx
  git commit -m "feat(marketing): BlogPanel (4-step workflow + SEO auto-retry) wired into ContentTabs"
  ```

### Task 4.9: `BlogPreviewDialog.tsx` (preview only)

> Ports CF `blog-preview-dialog.tsx` as **preview only** (no publish action in 1a). Renders blog cards (PC/mobile) using `buildBlogCardsHtml` from `../../lib/channel-translator` (Phase 0). No TDD.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/BlogPreviewDialog.tsx`

- [ ] **Step 1 (port):** Copy CF `blog-preview-dialog.tsx`. Props open/onOpenChange + cards/title. Build HTML via `buildBlogCardsHtml(cards)`. Strip any publish/발행 actions. Rewire `ui/dialog` import. Wire a "미리보기" button in `BlogPanel` to open it (small follow-up edit to `BlogPanel.tsx`).
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/BlogPreviewDialog.tsx packages/client/src/features/marketing/components/content/BlogPanel.tsx
  git commit -m "feat(marketing): BlogPreviewDialog (preview-only) + wire into BlogPanel"
  ```

---

## Chunk 5: 내부 블로그 (Internal Blog) + integration & verification

> Internal-blog shares the `mkt_blog_contents`/`mkt_blog_cards` tables and the `'blog'` channel-model key (O-1), distinguished at the panel level (`InternalBlogPanel` vs `BlogPanel`), NOT by a hard `channel`-column filter. Key differences from N-blog: Google/GEO prompt suffix instead of Naver D.I.A.; `url_slug` field; a **Google-SEO boolean checklist** instead of the numeric Naver scorer (O-3 — **no `calculateNaverSeoScore`, no `SeoScoreDisplay`, no auto-retry loop here**); keyword research hits `/api/mkt/google/keywords`; a **stubbed** schedule button (Phase 3). Then a final all-channel verification task.

### Task 5.1: `InternalBlogPanel.tsx` + wire into ContentTabs

> Ports CF `internal-blog-panel.tsx` (1,000 lines). No TDD — **port → typecheck → manual-verify → commit**. Reuses `ChannelContentList`, `ChannelModelSelector`, `BlogCardItem`, `WorkflowStepBar`, `useAiGeneration`, `useCardImageGeneration`, the blog hooks, and `useChannelModels(project.id, 'blog')`.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/InternalBlogPanel.tsx`
- Modify: `packages/client/src/features/marketing/components/content/ContentTabs.tsx` (wire the `self_hosted` tab)

- [ ] **Step 1 (port — Google-SEO prompt + structure):** Copy CF `internal-blog-panel.tsx`. Generation prompt = `buildBlogPrompt({...})` + the inline **Google/GEO suffix** string (CF :294 — H1/H2/H3 hierarchy, internal-link suggestions, keyword density 1-2%, **FAQ 3-5 for GEO**) instead of the Naver D.I.A. block. Structure generation returns `{ ..., urlSlug }` (CF :500, :514); persist `url_slug` via `useUpdateBlogContent({ id, contentId, updates: { url_slug } })` (CF :597). The `url_slug` input field is at CF :140.
- [ ] **Step 2 (port — Google-SEO checklist, O-3):** Render the **boolean checklist** under the "🔍 Google SEO 검사" header (CF :755-797): checks like `url_slug.length > 0`, FAQ section present (scan cards for a FAQ block), internal-link suggestions present, keyword-density hint, and a Schema note ("발행 시 Article/FAQ/MedicalEntity Schema 자동 추가"). **Do NOT** import or call `calculateNaverSeoScore`/`SeoScoreDisplay`, and **do NOT** run the SEO auto-retry loop — those are N-blog only.
- [ ] **Step 3 (port — keyword research + schedule stub):** Keyword research hits `/api/mkt/google/keywords` via `fetchGoogleKeywords` (Task 4.2; CF used `/api/google/keywords` at :168/:376). **Schedule button: render it but STUB the action** — `onClick` → `alert('예약 발행은 Phase 3에서 지원됩니다')`; do NOT import `schedulePublish`. Schedule badges per language may render as static status pills (CF :340 region) but trigger nothing. **Exclude** `ChannelTranslationView` (→ 1b).
- [ ] **Step 4 (`ChannelContentList` wiring):** `onAdd` → `useCreateBlogContent({ contentId, channel:'self_hosted' })`; `getTitle` → `item.title || \`내부 블로그 ${i+1}\``; **omit** `onAddToQueue`/`publishChannels`. Image gen via `useCardImageGeneration` (same as N-blog). Per-card + batch.
- [ ] **Step 5 (wire into ContentTabs):** Replace the temporary `self_hosted`-tab "준비 중" placeholder (Task 3.7) with `<InternalBlogPanel />`. Internal-blog and base-article remain visible for non-ko (CF behavior), unlike the ko-only N-blog tab.
- [ ] **Step 6 (R-1 + typecheck):** lucide icons; confirm NO `calculateNaverSeoScore`/`SeoScoreDisplay`/`schedulePublish` imports; `pnpm --filter client typecheck` → PASS.
- [ ] **Step 7 (manual-verify):** `/marketing/content` → 콘텐츠 → 내부 블로그 tab → add a post → Google-SEO generation produces H1/H2/H3 + FAQ → `url_slug` persists (reload) → "🔍 Google SEO 검사" checklist reflects state → schedule button shows the Phase-3 stub alert → Google keyword search populates (creds) or degrades gracefully.
- [ ] **Step 8:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/InternalBlogPanel.tsx packages/client/src/features/marketing/components/content/ContentTabs.tsx
  git commit -m "feat(marketing): InternalBlogPanel (Google-SEO checklist, url_slug, stubbed schedule)"
  ```

### Task 5.2: Phase 1a verification

> Final gate. No new feature code — run the full suite + manual E2E across all three channels and confirm RLS isolation. Use @superpowers:verification-before-completion (evidence before assertions).

**Files:** none (verification task).

- [ ] **Step 1 (automated):** From the repo root:
  ```bash
  pnpm typecheck            # all packages → PASS
  pnpm --filter client test # all new client unit tests green (image-utils, seo-feedback, formatForMobile, use-ai-generation, use-image-generation, use-auto-save, use-contents, use-base-article, use-blog-contents, use-r2-upload)
  pnpm --filter server test # naver-searchad, dataforseo green
  pnpm lint                 # → clean
  pnpm build                # → PASS
  ```
  Paste the actual PASS/counts as evidence; do not assert success without running.
- [ ] **Step 2 (manual E2E — base article):** generate via SSE (streaming visible), topic dialog, bubble-menu partial regen, drag/paste an image → R2 (the fixed `uploadToR2` puts to the real `uploadUrl`), 2 s autosave (TopBar `SaveStatusIndicator` transitions), 원장님 컨펌 toggle persists across reload.
- [ ] **Step 3 (manual E2E — N블로그):** full 4-step flow; live SEO score; auto-retry visibly re-generates when score < 90 and stops at `maxRetries`; per-card + batch image gen with progress; PC/mobile toggle; mobile-format; GlobalCardStyle changes apply; preview dialog renders.
- [ ] **Step 4 (manual E2E — 내부 블로그):** Google-SEO generation, `url_slug` persists, FAQ present, "🔍 Google SEO 검사" checklist, schedule button shows the Phase-3 stub.
- [ ] **Step 5 (manual E2E — language tabs):** ko pinned; switching to a non-ko language (project must have ≥2 `target_languages`) hides the N블로그 tab + auto-switches to 기본글; base-article shows an existing translation or "번역되지 않음" (no generate button).
- [ ] **Step 6 (manual E2E — keyword panels):** with creds, Naver + Google searches populate the tables; without creds, the panels show a graceful error and **manual keyword entry still works**.
- [ ] **Step 7 (RLS sanity):** sign in as a second account → confirm it **cannot** read the first account's `mkt_base_articles`/`mkt_blog_contents`/`mkt_blog_cards` rows (single-owner RLS holds). Optionally `mcp__supabase__get_advisors` (security) → no new warnings.
- [ ] **Step 8 (regression):** load `/library`, `/editor2`, a viewer → Tangobook learner/author UI visually unchanged (the marketing scope isolation + TipTap CSS scoping held; no global token bleed).
- [ ] **Step 9:** Commit any verification fixtures/notes (if produced) and, when the user requests the "업데이트" workflow, update `CLAUDE.md` index + memory per the global workflow:
  ```bash
  git add -A
  git commit -m "test(marketing): Phase 1a verification (all channels green)"
  ```

---

## Out of scope (later phases)
- **Phase 1b:** 카드뉴스(Instagram) / 스레드 / 롱폼(YouTube) / 숏폼 channels; 8-language **translation generation** (`translateAndSaveChannel` SSE, `ChannelTranslationView`, "AI 번역" button); `image-editor-dialog` (crop/filters); a numeric Google/GEO scorer.
- **Phase 2:** Ideas module / golden-keyword pool / AI auto-pick / trending / saved-keyword storage (the `mkt_projects.saved_keywords` column already exists but is unused in 1a).
- **Phase 3:** Publish queue (`addToPublishQueue`, `publish_records`), schedule execution / cron, the internal-blog schedule button's real action, `BlogPreviewDialog` publish actions, WordPress/Meta posting.
- **Later:** Perplexity 첨삭 / factcheck.

The "발행큐 추가" button (`ChannelContentList` `onAddToQueue`/`publishChannels`) is omitted in 1a; the internal-blog schedule button is rendered but stubbed (alert "Phase 3").
