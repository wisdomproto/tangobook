# Marketing Phase 1c (YouTube Longform) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `youtube` `ComingSoonPanel` placeholder in `ContentTabs` with a real 롱폼 (longform) YouTube panel — a Vrew-style scene-script editor that turns the project's 기본글 (base article) into a duration-aware video script (`{video_title, video_description, video_tags, sections[]}`) rendered as a color-coded **timeline of scene cards**, each carrying `section_type` (hook/intro/main/example/summary/cta), `narration_text`, `screen_direction`, `subtitle_text`, a per-scene still image (16:9 `ImageCardWidget`) + `image_prompt`, and a text-only `video_prompt` — plus AI 대본 generation, per-scene + batch still-image generation, a read-only preview dialog with 전체 복사, and the 전체 복사 clipboard export. A faithful port of ContentFlow onto the Phase 0/1a/1b stack. **숏폼/Shorts stays a placeholder** (CF shorts is itself a placeholder — faithful-port).

**Architecture:** Extends the existing `packages/client/src/features/marketing/` feature module, reusing the **channel-panel pattern** (`ThreadsPanel`/`CardNewsPanel`) verbatim. The whole content graph is already read once via `useContent(contentId)` (`api/queries.ts:fetchContentGraph` **already returns `youtubeContents`+cards** — verified, no change) and sliced down as props. Phase 1c adds only **write** hooks (`api/use-youtube-contents.ts`, mirroring `use-instagram-contents.ts`) + the three panel/card-item/preview components + one TS type fix (`YoutubeCard.user_id`, the R-A defect). The three youtube **prompt builders are already ported verbatim** in `lib/prompt-builder.ts` (`buildYoutubePrompt`/`buildYoutubeImagePrompt`/`buildYoutubeVideoPrompt`) — no change. Server data = TanStack Query; UI-only state = `store/ui-store.ts`. **No `batch-image-store`** for youtube (CF's youtube batch was the simple in-hook loop; `useCardImageGeneration.generateAll` already sequences with abort + 3s gap). **No server code in 1c** — `/api/mkt/ai/generate`, `/api/mkt/ai/generate-image`, `/api/mkt/storage/presign`, `/api/mkt/storage/proxy` all exist. 번역 생성 + 이미지 에디터 + 키워드/발행/분석 are OUT (Phase 1d / 2+).

**Tech Stack:** React 18 + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3 + lucide-react `^1.17.0` + Express v5 (consume-only) + `@aws-sdk/client-s3` (R2, consume-only via the shared image pipeline). Tests: vitest + @testing-library/react (jsdom).

**Source to port from:** `C:\projects\contentflow\contentflow\src\components\content\` — `youtube-panel.tsx` (584 lines: `YoutubePanel` outer + `YoutubePanelInner`), `youtube-card-item.tsx` (114: `SECTION_TYPES`/`getSectionInfo`/`TimelineCard`/`AddSceneButton`), `youtube-preview-dialog.tsx` (124: `YoutubePreviewDialog`/`estimateReadingTime`/`SECTION_COLORS`). ContentFlow uses Next.js + one ~1,900-line Zustand `project-store.ts`; this port adapts to Vite + TanStack Query (the same adaptation 1a/1b already did). Spec: `docs/superpowers/specs/2026-06-07-marketing-phase1c-youtube-design.md` (read it fully; data model in §4, hooks in §5, components in §6, the R-series adaptations R-A…R-I in §10, sequenced checklist in §13).

**Conventions (match Phase 0 / Phase 1a / Phase 1b / Tangobook — spec §3, marketing `CLAUDE.md`):**
- TanStack Query = server data; Zustand (`ui-store`) = UI state only. **No server data in Zustand.**
- Files: **PascalCase** components (`YoutubePanel.tsx`, `YoutubeCardItem.tsx`, `YoutubePreviewDialog.tsx`), **camelCase** data/util/hook/api files (`use-youtube-contents.ts`). Named exports for components. (ContentFlow used kebab-case files — rename on port.)
- UI primitives imported from `../../ui/<name>` (e.g. `import { Button } from '../../ui/button'`, `import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog'`), NOT `@/components/ui/*`. `cn`/`generateId` from `../../lib/utils`. Types from `../../types/database`. Icons from `lucide-react`. Drop every `'use client'` directive; replace `next/image` `<Image>` / `@next/next/no-img-element` `<img>` with plain `<img>`.
- Mutations set `user_id` (from `supabase.auth.getUser()`), `created_at`/`updated_at`, cast payload `as unknown as Record<string, unknown>` (`…[]` for bulk insert), throw on `error`, and `invalidateQueries({ queryKey: mktKeys.content(contentId) })` on success (whole graph refetches). Reuse `generateId()` and the `getUserId()` helper pattern (`api/use-instagram-contents.ts:7-13`).
- Commit after every task. Commit messages in English. End each commit message with the trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Test command (real):** `pnpm --filter client test <path-substring>` (vitest run). Typecheck: `pnpm typecheck` (all packages) or `pnpm --filter client typecheck`. Lint: `pnpm lint`. Build: `pnpm --filter client build`.
- **Port-task pattern** (for verbatim/near-verbatim UI where TDD is impractical): copy source → rename to PascalCase → rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/utils` → `../../lib/utils`, `@/types/*` → `../../types/*`, `@/hooks/*` → `../../hooks/*`, `@/stores/*` → `../../api/*`) → strip `'use client'` + Next `<img>` eslint-disables → adapt `useProjectStore` reads to the new hooks → adapt the R-series API mismatches (R-A…R-F) → **build → `pnpm --filter client typecheck` → manual-verify in `/marketing/content` → commit**. This rhythm is called **"port → typecheck → manual-verify → commit"** below.

> @superpowers:test-driven-development for the pure-logic steps (failing test → run → impl → run → commit). @superpowers:verification-before-completion before any "done" claim in Chunk 4.

---

## File Structure

```
packages/client/src/features/marketing/
  api/                            [Phase 0/1a/1b + NEW]
    queries.ts                    REUSE  fetchContentGraph already returns youtubeContents+cards (§4.3); mktKeys.content reused (§4.4) — NO change
    use-youtube-contents.ts       NEW    youtube contents (1:N) + cards (N) — mirror use-instagram-contents.ts (§5)
    use-channel-models.ts         [Phase 1a] REUSE  (channel 'youtube' works as-is; returns { models, setChannelModels })
    use-contents.ts               [Phase 0] REUSE  useContent(contentId) → ContentGraph
    supabase.ts                   [Phase 0] REUSE  (re-exports @/lib/supabase)
    __tests__/
      use-youtube-contents.test.tsx  NEW
  hooks/                          [Phase 1a/1b — all ported, REUSE]
    use-ai-generation.ts          REUSE  { isGenerating, generate, abort } — SSE → /api/mkt/ai/generate
    use-image-generation.ts       REUSE  → /api/mkt/ai/generate-image → { base64, mimeType:'image/png' }
    use-card-image-generation.ts  REUSE  cardId-based API (§6.3 / R-B): { getPrompt, getModel, getAspectRatio?, shouldSkip?, getReferenceImages?, onSave, projectId, category? } → { isGenerating, progress, generateForCard, generateAll, abort }
  lib/                            [Phase 0/1a/1b — all ported, REUSE]
    prompt-builder.ts             REUSE  buildYoutubePrompt (:606) / buildYoutubeImagePrompt (:700) / buildYoutubeVideoPrompt (:745) — verbatim, NO change
    utils.ts                      REUSE  generateId / cn
  types/
    database.ts                   EDIT   add `user_id: string` to YoutubeCard (R-A, Chunk 0); YoutubeContent + VideoDuration already present
  components/content/             [Phase 1a/1b + NEW]
    ContentTabs.tsx               EDIT   youtube tab active:true + render <YoutubePanel/>; shorts stays ComingSoonPanel
    YoutubeCardItem.tsx           NEW    SECTION_TYPES / getSectionInfo / TimelineCard / AddSceneButton + extracted pure helpers (estimatedSec)
    YoutubePreviewDialog.tsx      NEW    read-only script preview + 전체 복사 + estimateReadingTime + SECTION_COLORS
    YoutubePanel.tsx              NEW    YoutubePanel outer + YoutubePanelInner — port + data-layer/API adaptations R-A…R-F
    ChannelModelSelector.tsx      [Phase 1a] REUSE  (props: textModel/imageModel/showImageModel/aspectRatio/imageStyle/defaultAspectRatio + on*Change)
    ChannelContentList.tsx        [Phase 1a] REUSE  (generic <T>, 1-arg getTitle: (item)=>string, onAdd: ()=>Promise<string>, NO onAddToQueue)
    GenerationButton.tsx          [Phase 1a] REUSE  (variant 'text' / 'batch-image', label/loadingLabel/progress/onAbort)
    PromptEditDialog.tsx          [Phase 1a] REUSE  (onConfirm — NOT CF onGenerate/isGenerating — R-C)
    ImageCardWidget.tsx           [Phase 1b] REUSE  (src?: string, aspectClass="aspect-video", onRegenerate/onAbort/onDelete/onUpload/isGenerating; onEdit stays undefined per O-7)
    __tests__/
      YoutubeCardItem.helpers.test.ts   NEW   estimatedSec + getSectionInfo + estimateReadingTime + buildYoutubeCardsFromParsed
```

> **No DDL is required (cards/contents).** Phase 0's migration `supabase/migrations/2026-06-07-marketing-schema.sql` already created `mkt_youtube_contents` (blocks 10, :240-259) **and** `mkt_youtube_cards` (block 11, :265-279), both with RLS enabled (:421-422) + single-owner policies (:440-441: `using (user_id = auth.uid()) with check (user_id = auth.uid())`). The three `[drift]` columns (`image_url`, `image_prompt`, `video_prompt`) **exist on `mkt_youtube_cards`** (verified, spec §4.1). One **optional** non-blocking perf index is in Chunk 1 Task 1.2; verify-then-add only. **No new SECURITY DEFINER functions** → no `GRANT EXECUTE` needed (memory RULE n/a).

### ⚠️ One worktree fact the spec under-specified (read before Chunk 3)

`ContentTabs` in the worktree takes **NO props** — it reads `selectedContentId`/`selectedProjectId` from `useUIStore()`, fetches `contentGraph`/`project`, derives `const content = contentGraph?.content` + `project`, and passes them down as `<ThreadsPanel content={content} project={project} />` (`ContentTabs.tsx:46-54, :138-146`). So `YoutubePanel` receives `{ content, project }` props exactly like `ThreadsPanel`, and the wiring in Chunk 3 Task 3.3 is a one-line `TabsContent` body swap — it does **not** thread new props through `ContentTabs`. (The spec §6.3 says "ContentTabs passes content+project props" — that is correct at the panel boundary; just note `ContentTabs` itself is prop-less.)

### Chunk dependency order (each chunk is independently runnable in this order)

| Chunk | Depends on | Independently testable / verifiable |
|---|---|---|
| **0** Prereqs & R-A type fix | — (Phase 0/1a/1b only) | `pnpm --filter client typecheck` (YoutubeCard.user_id compiles; graph cast still OK) + sanity greps |
| **1** Data hooks (+optional index) | 0 (the hooks insert `user_id`-bearing rows; the panel later stamps bulk rows) | hook unit tests (mock `@/lib/supabase`) + typecheck |
| **2** Card-item + preview | 0 (imports the `user_id`-bearing `YoutubeCard` type) | `YoutubeCardItem` pure-helper unit tests + typecheck + manual mount-check |
| **3** Panel + wire | 0, 1, 2 (mounts `YoutubeCardItem`/`YoutubePreviewDialog`, calls the youtube hooks + image hook) | `buildYoutubeCardsFromParsed` unit test + manual E2E of the full youtube flow |
| **4** Verification | 0, 1, 2, 3 | full suite + typecheck + lint + build + manual E2E + static scope sanity + RLS note |

> Chunk 0/1 are foundational (no UI). Chunk 2 (card-item + preview, both mostly verbatim + a couple of pure helpers) ships before the panel so the panel's imports resolve. Chunk 3 is the centerpiece. **The R-A type fix (Chunk 0) MUST land first** — without `YoutubeCard.user_id`, the hook bulk-insert rows (Chunk 1) and the panel's `onComplete` card build (Chunk 3) won't typecheck and will insert NULL `user_id` → NOT NULL + RLS violation (the exact 1a/1b R-9 bug class). **Highest-risk item; do not skip.**

---

## Chunk 0: Prerequisites & R-A type fix (the #1 prerequisite)

> This chunk has no UI and must land first. It fixes the **R-A drift** (the `YoutubeCard` TS type omits `user_id` while the DB column is NOT NULL + RLS `with check (user_id = auth.uid())`), and sanity-confirms the already-ported pieces (prompt builders, graph fetch, tables) are present so the later chunks can depend on them. **Do not re-create any already-ported piece.**

### Task 0.1: Add `user_id: string` to the `YoutubeCard` interface (R-A) — the #1 prerequisite

> **Verified (spec §4.2, §10 R-A; `types/database.ts:362-375`):** `YoutubeCard` currently has `{ id, youtube_content_id, section_type, narration_text, screen_direction, subtitle_text, image_url, image_prompt, video_prompt, sort_order, created_at, updated_at }` — **no `user_id`**. Contrast `InstagramCard`/`ThreadsCard`/`BlogCard`, which all carry `user_id` (1a/1b added it). The DB column `mkt_youtube_cards.user_id` is `NOT NULL → auth.users` with RLS `with check (user_id = auth.uid())`. CF's `YoutubeCard` had no `user_id` (CF used Zustand, never inserted youtube cards to a multi-tenant DB), so the field was dropped during the Phase 0 type port. **Fix it now**, so the hook inserts (Chunk 1) and the panel card-build (Chunk 3) can stamp + typecheck `user_id`.

**Files:**
- Modify: `packages/client/src/features/marketing/types/database.ts`

- [ ] **Step 1 (impl):** In `types/database.ts`, add `user_id: string;` to the `YoutubeCard` interface as the second field (immediately after `id`, mirroring how `InstagramCard`/`ThreadsCard` order it):

```ts
export interface YoutubeCard {
  id: string;
  user_id: string;
  youtube_content_id: string;
  section_type: string | null;
  narration_text: string | null;
  screen_direction: string | null;
  subtitle_text: string | null;
  image_url: string | null;
  image_prompt: string | null;
  video_prompt: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck`. Expected: **PASS**. The graph fetch (`api/queries.ts:144,161-164`) casts `(ytCardsRes.data ?? []) as YoutubeCard[]` and spreads rows from `select('*')` — adding a required field to the interface does **not** break that cast (the DB rows already carry `user_id`). No other current code references `YoutubeCard` fields (the panel doesn't exist yet), so this is the only diff.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/types/database.ts
  git commit -m "fix(marketing): add user_id to YoutubeCard type (R-A — DB col is NOT NULL + RLS)"
  ```

### Task 0.2: Sanity-confirm the already-ported youtube pieces (no-op verification)

> No-op verification (spec §13 step 0 implied; mirrors 1b Task 0.3). Everything below was ported in Phase 0/1a — this catches any path drift before the panel depends on them. **Do not re-create any of these.** If anything is missing/misnamed, STOP and reconcile against the Phase 0/1a/1b plans before proceeding.

**Files:** none (read-only checks).

- [ ] **Step 1 (confirm prompt builders):** verify `lib/prompt-builder.ts` exports `buildYoutubePrompt` (`:606`, signature `(ctx: PromptContext & { youtubeContent?: YoutubeContent }) => string`, duration branches `youtubeContent?.target_duration ?? 'mid'` → short 3~5 / mid 5~8 / long 8~15 sections, emits the `{video_title, video_description, video_tags, sections[]}` JSON contract + base-article injection `baseArticle.body_plain_text` at `:683-687`), `buildYoutubeImagePrompt(project, card, imageStyle)` (`:700`, 16:9 + no-text + Korean-context), `buildYoutubeVideoPrompt(project, card, imageStyle)` (`:745`, motion map, text-only). **No change to this file.**
- [ ] **Step 2 (confirm graph fetch):** verify `api/queries.ts:fetchContentGraph` fetches `mkt_youtube_contents` (`:86-90`) + `mkt_youtube_cards` (`:127-133`, `.in('youtube_content_id', ytIds).order('sort_order')`) and assembles `ContentGraph.youtubeContents: Array<YoutubeContent & { cards: YoutubeCard[] }>` (`:60`, `:161-164`). **No change to `queries.ts`.** `mktKeys.content(id)` (`:23`) is the invalidation key (no per-channel youtube key — reused, §4.4).
- [ ] **Step 3 (confirm types):** verify `types/database.ts` exports `YoutubeContent` (`:344-360`, incl. `target_duration: VideoDuration | null`, `video_title/description/tags`, `title?`) and `VideoDuration = 'short'|'mid'|'long'` (`:18`). (`YoutubeCard` now carries `user_id` from Task 0.1.)
- [ ] **Step 4 (confirm components/hooks the panel reuses):** `components/content/`: `ChannelModelSelector` (props incl. `showImageModel`, `defaultAspectRatio`, `imageStyle`, `onImageStyleChange`), `ChannelContentList` (generic `<T>`, **1-arg `getTitle: (item)=>string`**, `onAdd: ()=>Promise<string>`, NO `onAddToQueue`), `GenerationButton` (variant `"text"` + `"batch-image"`, `label`/`loadingLabel`/`progress`/`onAbort`), `PromptEditDialog` (**`onConfirm`** — no `onGenerate`/`isGenerating`/`onAbort` props, R-C), `ImageCardWidget` (`src?: string`, `aspectClass`, `onRegenerate`/`onAbort`/`onDelete`/`onUpload`/`isGenerating`; `onEdit` stays undefined). `hooks/`: `use-ai-generation` (`{ isGenerating, generate, abort }`), `use-card-image-generation` (cardId-based — see §6.3 / R-B). `ui/index.ts` exports `Input`, `Textarea`, `Badge`; `ui/dialog` exports `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`.
- [ ] **Step 5 (confirm tables exist — optional, MCP):** if desired, `mcp__supabase__list_tables` (project ref `fxzwigjkbsptvsjraqwa`) → confirm `mkt_youtube_contents` + `mkt_youtube_cards` exist with `user_id`/`image_url`/`image_prompt`/`video_prompt`/`section_type`/`narration_text`/`screen_direction`/`subtitle_text`/`sort_order`/`target_duration` columns. (Already verified in the spec; this is a belt-and-suspenders check.)
- [ ] **Step 6:** No commit (read-only).

---

## Chunk 1: Data hooks — `api/use-youtube-contents.ts` (+ optional perf index)

> Pure data wiring. Each write hook matches the Phase 0/1a/1b pattern (`api/use-instagram-contents.ts`): get `user_id` via the `getUserId()` helper (for self-inserting hooks), set `user_id`+`created_at`/`updated_at`, cast payload `as unknown as Record<string,unknown>` (`…[]` for bulk), throw on `error`, `invalidateQueries({ queryKey: mktKeys.content(contentId) })` on success. **Reads are via the existing `useContent(contentId).data` graph — these hooks only WRITE.** The test mocks `@/lib/supabase` (which `api/supabase.ts` re-exports) and uses the `QueryClient` wrapper exactly like `api/__tests__/use-threads-contents.test.tsx`.

### Task 1.1: YouTube contents + cards hooks (`api/use-youtube-contents.ts`)

> Mirrors `api/use-instagram-contents.ts` exactly (same `getUserId()` helper, same `mutateAsync`-returns-id pattern, same `onSuccess` → `invalidateQueries(mktKeys.content(contentId))`). Ports `project-store.ts` `addYoutubeContent`/`updateYoutubeContent`/`deleteYoutubeContent`/`setYoutubeCardsForContent`/`addYoutubeCard`/`updateYoutubeCard`/`deleteYoutubeCard` (spec §5). Seven hooks. **`user_id` stamping (R-A):** `useCreateYoutubeContent` + `useAddYoutubeCard` call `getUserId()` and stamp the row themselves; `useSetYoutubeCards` does **NOT** call `getUserId()` — it bulk-inserts caller-supplied rows that already carry `user_id` (the panel stamps them in `onComplete`, §5/§6.3).

**Files:**
- Create: `packages/client/src/features/marketing/api/use-youtube-contents.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-youtube-contents.test.tsx`

- [ ] **Step 1 (test):** Cover the highest-risk behaviors (mirror the threads/instagram tests exactly — same harness): `useCreateYoutubeContent` inserts `target_duration:'mid'`+`user_id`+`status:'draft'` and **returns the new id**; `useSetYoutubeCards` deletes-all (`.eq('youtube_content_id', …)`) then bulk-inserts + invalidates `mktKeys.content`; the empty-array path skips insert; `useAddYoutubeCard` inserts a blank card with `user_id`+`section_type:'main'` and returns the id.

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mock supabase (api/supabase.ts re-exports @/lib/supabase) ─────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-test-id' } } }),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import {
  useCreateYoutubeContent,
  useSetYoutubeCards,
  useAddYoutubeCard,
} from '../use-youtube-contents';
import { mktKeys } from '../queries';

const mockFrom = vi.mocked(supabase.from);

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

describe('useCreateYoutubeContent', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('inserts target_duration:mid + user_id and returns the new id', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);
    const { result } = renderHook(() => useCreateYoutubeContent(), { wrapper: wrapper(queryClient) });
    let newId = '';
    await act(async () => {
      newId = await result.current.mutateAsync({ contentId: 'c-1' });
    });
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.content_id).toBe('c-1');
    expect(row.target_duration).toBe('mid');
    expect(row.status).toBe('draft');
    expect(row.user_id).toBe('user-test-id');
    expect(typeof newId).toBe('string');
    expect(row.id).toBe(newId);
  });
});

describe('useSetYoutubeCards', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('deletes all then bulk-inserts and invalidates', async () => {
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const cards = [
      {
        id: 'k1',
        user_id: 'user-test-id',
        youtube_content_id: 'yt-1',
        section_type: 'hook',
        narration_text: 'hi',
        screen_direction: '',
        subtitle_text: null,
        image_url: null,
        image_prompt: 'p',
        video_prompt: 'v',
        sort_order: 0,
        created_at: 'x',
        updated_at: 'x',
      },
    ] as any;
    const { result } = renderHook(() => useSetYoutubeCards(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({ youtubeContentId: 'yt-1', contentId: 'c-1', cards });
    });
    expect(eqDelete).toHaveBeenCalledWith('youtube_content_id', 'yt-1');
    expect(insertMock).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
  });

  it('skips insert when cards is empty', async () => {
    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
    const insertMock = vi.fn();
    mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
    const { result } = renderHook(() => useSetYoutubeCards(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({ youtubeContentId: 'yt-1', contentId: 'c-1', cards: [] });
    });
    expect(eqDelete).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('useAddYoutubeCard', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-test-id' } },
      error: null,
    } as any);
  });

  it('inserts a blank card with user_id + section_type:main and returns the id', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock } as any);
    const { result } = renderHook(() => useAddYoutubeCard(), { wrapper: wrapper(queryClient) });
    let newId = '';
    await act(async () => {
      newId = await result.current.mutateAsync({
        youtubeContentId: 'yt-1',
        contentId: 'c-1',
        sortOrder: 3,
      });
    });
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.youtube_content_id).toBe('yt-1');
    expect(row.section_type).toBe('main');
    expect(row.sort_order).toBe(3);
    expect(row.user_id).toBe('user-test-id');
    expect(row.id).toBe(newId);
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/api/__tests__/use-youtube-contents`. Expected: **FAIL** (module not found).
- [ ] **Step 3 (impl):** Create `use-youtube-contents.ts` with all seven hooks. Reuse the `getUserId()` helper pattern from `use-instagram-contents.ts:7-13`. Verbatim:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { YoutubeContent, YoutubeCard } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCreateYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      data,
    }: {
      contentId: string;
      data?: Partial<YoutubeContent>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        content_id: contentId,
        title: null,
        video_title: null,
        video_description: null,
        video_tags: null,
        video_category: null,
        target_duration: 'mid', // CF UI default (?? 'mid'); stable select value (spec §14 Q2)
        thumbnail_url: null,
        video_url: null,
        status: 'draft',
        youtube_video_id: null,
        published_at: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_youtube_contents')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contentId: _c,
      updates,
    }: {
      id: string;
      contentId: string;
      updates: Partial<YoutubeContent>;
    }) => {
      const { error } = await supabase
        .from('mkt_youtube_contents')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useDeleteYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentId: _c }: { id: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_youtube_contents').delete().eq('id', id);
      if (error) throw new Error(error.message); // FK cascade removes cards
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useSetYoutubeCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      youtubeContentId,
      contentId: _c,
      cards,
    }: {
      youtubeContentId: string;
      contentId: string;
      cards: YoutubeCard[]; // caller-supplied rows ALREADY carry user_id (R-A — panel stamps them)
    }) => {
      const { error: delErr } = await supabase
        .from('mkt_youtube_cards')
        .delete()
        .eq('youtube_content_id', youtubeContentId);
      if (delErr) throw new Error(delErr.message);
      if (cards.length > 0) {
        const { error: insErr } = await supabase
          .from('mkt_youtube_cards')
          .insert(cards as unknown as Record<string, unknown>[]);
        if (insErr) throw new Error(insErr.message);
      }
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useAddYoutubeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      youtubeContentId,
      contentId: _c,
      sortOrder,
    }: {
      youtubeContentId: string;
      contentId: string;
      sortOrder: number;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        youtube_content_id: youtubeContentId,
        section_type: 'main',
        narration_text: '',
        screen_direction: '',
        subtitle_text: null,
        image_url: null,
        image_prompt: null,
        video_prompt: null,
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };
      const { error } = await supabase
        .from('mkt_youtube_cards')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateYoutubeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      contentId: _c,
      updates,
    }: {
      cardId: string;
      contentId: string;
      updates: Partial<YoutubeCard>;
    }) => {
      const { error } = await supabase
        .from('mkt_youtube_cards')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useDeleteYoutubeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, contentId: _c }: { cardId: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_youtube_cards').delete().eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
```
> **High-frequency note (R-F):** `useUpdateYoutubeCard` is called on every narration/direction/subtitle/prompt keystroke + section-type change. The **panel** keeps the live cards in `localCards` and routes text persistence through a ~400 ms debounce; structural changes (`section_type`, `image_url`) persist immediately (Chunk 3 §`handleCardUpdate`, O-F debounce mirrored from ThreadsPanel). The hook itself stays a plain whole-field update; do NOT add throttling inside the hook.
- [ ] **Step 4 (run):** `pnpm --filter client test marketing/api/__tests__/use-youtube-contents`. Expected: **PASS** (4 cases).
- [ ] **Step 5 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-youtube-contents.ts packages/client/src/features/marketing/api/__tests__/use-youtube-contents.test.tsx
  git commit -m "feat(marketing): youtube content + card mutation hooks (1:N + setCards delete+insert, user_id stamped)"
  ```

### Task 1.2: (Optional) recommended perf index migration

> Non-blocking; correctness does not depend on it (the graph fetch already `.order('sort_order')`s the cards, `queries.ts:131-132`). Mirror the 1a/1b index migrations. **Verify absent before adding** so it is not a duplicate, and **add only if profiling warrants** (spec §4.5).

**Files:**
- Create: `supabase/migrations/2026-06-07-marketing-phase1c-indexes.sql` (record for source control)
- Apply via `mcp__supabase__apply_migration` (project ref `fxzwigjkbsptvsjraqwa`)

- [ ] **Step 1 (verify absent):** `mcp__supabase__list_migrations` / inspect existing migrations to confirm neither index already exists (Phase 0 may already index the FKs).
- [ ] **Step 2 (author + apply, if proceeding):**

```sql
-- Phase 1c optional perf indexes (non-blocking; defensive if-not-exists)
create index if not exists idx_mkt_youtube_contents_content
  on mkt_youtube_contents (content_id);
create index if not exists idx_mkt_youtube_cards_parent_sort
  on mkt_youtube_cards (youtube_content_id, sort_order);
```
Apply via MCP `apply_migration` (name `marketing_phase1c_indexes`).
- [ ] **Step 3 (advisors):** `mcp__supabase__get_advisors` (security) → no new warnings (no SECURITY DEFINER functions added).
- [ ] **Step 4:** Commit the recorded SQL:
  ```bash
  git add supabase/migrations/2026-06-07-marketing-phase1c-indexes.sql
  git commit -m "feat(marketing): optional perf indexes (youtube contents/cards parent+sort)"
  ```

---

## Chunk 2: `YoutubeCardItem` + `YoutubePreviewDialog`

> Two mostly-verbatim presentational ports + a couple of pure helpers (TDD'd). No data hooks here. The card-item exports `SECTION_TYPES`/`getSectionInfo`/`TimelineCard`/`AddSceneButton`; the preview dialog exports `YoutubePreviewDialog`. Both are imported by `YoutubePanel` (Chunk 3).

### Task 2.1: `YoutubeCardItem.tsx` ← `youtube-card-item.tsx` (114 lines) — pure helpers first (TDD)

> Port of CF `youtube-card-item.tsx`. The two pure bits (`getSectionInfo` + the per-scene `estimatedSec` calc) get unit tests first; the `TimelineCard`/`AddSceneButton` JSX is verbatim. `SECTION_TYPES` Tailwind classes are **static string literals** (`bg-red-500` …) → safe with Tailwind JIT (R-I; no dynamic concatenation).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/YoutubeCardItem.tsx`
- Test: `packages/client/src/features/marketing/components/content/__tests__/YoutubeCardItem.helpers.test.ts` (shared file with Task 2.2 + Task 3.x helpers)

- [ ] **Step 1 (test — `getSectionInfo` + `estimatedSec`):** Write the first block of `YoutubeCardItem.helpers.test.ts`. Extract the per-scene seconds calc into an exported pure helper `estimatedSceneSeconds(charCount)` (so it is testable without rendering `TimelineCard`):

```ts
import { describe, it, expect } from 'vitest';
import {
  SECTION_TYPES,
  getSectionInfo,
  estimatedSceneSeconds,
} from '../YoutubeCardItem';

describe('getSectionInfo', () => {
  it('returns the matching entry for each known type', () => {
    for (const st of SECTION_TYPES) {
      expect(getSectionInfo(st.value).value).toBe(st.value);
    }
  });
  it('falls back to the main entry for null / unknown', () => {
    expect(getSectionInfo(null).value).toBe('main');
    expect(getSectionInfo('nope').value).toBe('main');
  });
});

describe('estimatedSceneSeconds', () => {
  // CF youtube-card-item.tsx:34 → Math.max(1, Math.round(charCount / (250/60)))  (~250자/분)
  it('floors at 1 second for empty / short narration', () => {
    expect(estimatedSceneSeconds(0)).toBe(1);
    expect(estimatedSceneSeconds(2)).toBe(1); // round(2 / 4.166) = round(0.48) = 0 → max(1,0) = 1
  });
  it('computes ~seconds for longer narration (250자/분 ⇒ 4.166자/초)', () => {
    expect(estimatedSceneSeconds(250)).toBe(60); // round(250 / 4.166) = round(60) = 60
    expect(estimatedSceneSeconds(125)).toBe(30); // round(125 / 4.166) = round(30) = 30
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/components/content/__tests__/YoutubeCardItem.helpers`. Expected: **FAIL** (module not found).
- [ ] **Step 3 (port the component + helpers):** Copy CF `youtube-card-item.tsx` → `YoutubeCardItem.tsx`. Rewire imports: `Button` → `../../ui/button`, `cn` → `../../lib/utils`, `YoutubeCard` → `../../types/database`. Drop `'use client'`; the `<img>` (`card.image_url`) is already a plain `<img>` (no Next eslint-disable in this CF file). Port **verbatim**, with the one extraction:
  - **`SECTION_TYPES`** — `as const` array, **copy verbatim** from CF `:8-15`: `hook`(훅,`bg-red-500`,`text-red-600`) / `intro`(인트로,`bg-blue-500`,`text-blue-600`) / `main`(메인,`bg-green-500`,`text-green-600`) / `example`(사례,`bg-yellow-500`,`text-yellow-600`) / `summary`(요약,`bg-purple-500`,`text-purple-600`) / `cta`(CTA,`bg-orange-500`,`text-orange-600`).
  - **`getSectionInfo(type: string | null)`** — verbatim CF `:17-19` (`SECTION_TYPES.find(s => s.value === type) ?? { value:'main', label:'메인', color:'bg-green-500', textColor:'text-green-600' }`).
  - **`estimatedSceneSeconds(charCount: number)`** — **new exported helper** holding CF's inline `:34` expression: `export const estimatedSceneSeconds = (charCount: number) => Math.max(1, Math.round(charCount / (250 / 60)));`. In `TimelineCard`, compute `const estimatedSec = estimatedSceneSeconds(card.narration_text?.length ?? 0);` instead of inlining (the rest of `TimelineCard` is verbatim).
  - **`TimelineCard`** — props `{ card, index, isSelected, onClick, onDelete }`. Verbatim CF `:31-95`: 16:9 thumbnail (`aspect-video`): `img` if `card.image_url` else `ImageIcon` placeholder; section badge overlay (`sectionInfo.color`), index badge, hover delete (`stopPropagation` → `onDelete(card.id)`); bottom strip = `narration_text?.slice(0,30) || '(빈 나레이션)'` + `~{estimatedSec}초`.
  - **`AddSceneButton`** — props `{ onAdd }`; dashed `w-32 aspect-video` "+ 씬 추가". Verbatim CF `:103-113`.
- [ ] **Step 4 (run):** `pnpm --filter client test marketing/components/content/__tests__/YoutubeCardItem.helpers`. Expected: **PASS** (the `getSectionInfo` + `estimatedSceneSeconds` cases).
- [ ] **Step 5 (R-1 icon check + typecheck):** confirm `Plus,Trash2,ImageIcon` resolve at `lucide-react@^1.17.0` (the build fails fast on a missing export; substitute any renamed icon). `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/YoutubeCardItem.tsx packages/client/src/features/marketing/components/content/__tests__/YoutubeCardItem.helpers.test.ts
  git commit -m "feat(marketing): port YoutubeCardItem (SECTION_TYPES, color timeline, AddSceneButton) + tested helpers"
  ```

### Task 2.2: `YoutubePreviewDialog.tsx` ← `youtube-preview-dialog.tsx` (124 lines) — `estimateReadingTime` first (TDD)

> Read-only script preview modal: per-section card with color header (`SECTION_COLORS` light/dark map), two-column narration | (screen_direction + subtitle), header badges `약 N분` + `{cards.length}개 섹션` + 전체 복사. The `estimateReadingTime` pure helper is TDD'd; the JSX is verbatim. **Worktree ui imports** (`Dialog*`/`Button`/`Badge`).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/YoutubePreviewDialog.tsx`
- Test: append to `packages/client/src/features/marketing/components/content/__tests__/YoutubeCardItem.helpers.test.ts`

- [ ] **Step 1 (test — `estimateReadingTime`):** Export `estimateReadingTime` from `YoutubePreviewDialog.tsx` (CF keeps it module-private; export it so it is testable). Append to the shared helpers test:

```ts
import { estimateReadingTime } from '../YoutubePreviewDialog';
import type { YoutubeCard } from '../../../types/database';

const card = (narration: string): YoutubeCard =>
  ({
    id: 'x',
    user_id: 'u',
    youtube_content_id: 'yt',
    section_type: 'main',
    narration_text: narration,
    screen_direction: '',
    subtitle_text: null,
    image_url: null,
    image_prompt: null,
    video_prompt: null,
    sort_order: 0,
    created_at: '',
    updated_at: '',
  }) as YoutubeCard;

describe('estimateReadingTime', () => {
  // CF youtube-preview-dialog.tsx:19-25 → totalChars/250 minutes; <1 ⇒ '1분 미만'
  it('returns "1분 미만" under 250 total chars', () => {
    expect(estimateReadingTime([card('a'.repeat(100))])).toBe('1분 미만');
    expect(estimateReadingTime([])).toBe('1분 미만');
  });
  it('returns "약 N분" at/above 250 chars (rounded)', () => {
    expect(estimateReadingTime([card('a'.repeat(500))])).toBe('약 2분'); // 500/250 = 2
    expect(estimateReadingTime([card('a'.repeat(250)), card('a'.repeat(125))])).toBe('약 2분'); // 375/250 = 1.5 → round 2
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/components/content/__tests__/YoutubeCardItem.helpers`. Expected: **FAIL** (`YoutubePreviewDialog` not found / `estimateReadingTime` not exported).
- [ ] **Step 3 (port):** Copy CF `youtube-preview-dialog.tsx` → `YoutubePreviewDialog.tsx`. Rewire: `Dialog,DialogContent,DialogHeader,DialogTitle` → `../../ui/dialog`, `Button` → `../../ui/button`, `Badge` → `../../ui/badge`, `YoutubeCard` → `../../types/database`. Drop `'use client'`. Port **verbatim**:
  - **`SECTION_COLORS`** — light/dark map, verbatim CF `:10-17` (static literals → JIT-safe, R-I).
  - **`estimateReadingTime(cards)`** — **export it** (`export function estimateReadingTime`), body verbatim CF `:19-25` (`totalChars/250` minutes; `<1` → `'1분 미만'`; else `약 ${Math.round(minutes)}분`).
  - **`YoutubePreviewDialog`** — props `{ open, onOpenChange, cards: YoutubeCard[], videoTitle?: string|null }`. Verbatim CF `:34-122`: header `대본 미리보기` + `Clock` badge (`estimateReadingTime`) + `{cards.length}개 섹션` + `전체 복사` (clipboard: per-card `[i] SECTION_TYPE↑` / `나레이션:` / `화면:` / `자막:` joined `\n\n---\n\n`, prefixed `# {videoTitle}` when present, `복사됨!` 2s toggle); optional `<h2>{videoTitle}</h2>`; per-section card with color header (`SECTION_COLORS[card.section_type ?? 'main'] ?? SECTION_COLORS.main`) + 2-col narration | (direction + subtitle).
- [ ] **Step 4 (run):** test → **PASS** (the `estimateReadingTime` cases + Task 2.1 cases).
- [ ] **Step 5 (R-1 icon check + typecheck):** confirm `Copy,Check,Clock` resolve at `^1.17.0`. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/YoutubePreviewDialog.tsx packages/client/src/features/marketing/components/content/__tests__/YoutubeCardItem.helpers.test.ts
  git commit -m "feat(marketing): port YoutubePreviewDialog (read-only script preview + 전체 복사) + tested estimateReadingTime"
  ```

---

## Chunk 3: `YoutubePanel` (outer + inner) + wire into ContentTabs

> The centerpiece (`youtube-panel.tsx`, 584 lines): `YoutubePanel` outer (`ChannelModelSelector` + `ChannelContentList<YoutubeContent & {cards}>`) + `YoutubePanelInner` (Vrew editor: video-settings collapsible, action bar, preview+script 2-col, color timeline). Adapted to the worktree data layer (the `ThreadsPanel` template). **One pure helper (`buildYoutubeCardsFromParsed`) is extracted + TDD'd** (the JSON-parse + image_prompt/video_prompt fill — the load-bearing port detail); the rest is port → typecheck → manual-verify → commit. Reference R-A/R-B/R-C/R-D/R-E/R-F explicitly.

### Task 3.1: `buildYoutubeCardsFromParsed` pure helper (TDD) — the load-bearing parse+fill

> CF's `onComplete` (`youtube-panel.tsx:104-126`) maps `parsed.sections[]` → `YoutubeCard[]`, **filling each card's `image_prompt`/`video_prompt` via `buildYoutubeImagePrompt`/`buildYoutubeVideoPrompt`** (the single difference vs cardnews/threads, spec §7). Extract this map into a pure, testable helper so the defaults (`section_type ||'main'`, `subtitle_text ?? null`, `sort_order=i`), the `user_id` stamping (R-A), and the builder fill are unit-covered.

**Files:**
- Create the helper inside `YoutubePanel.tsx` as a top-level exported function (so the test imports it without rendering the panel).
- Test: append to `packages/client/src/features/marketing/components/content/__tests__/YoutubeCardItem.helpers.test.ts`.

- [ ] **Step 1 (test):** Append. The builders are real (`lib/prompt-builder.ts`, already ported) — feed a minimal `Project` and assert each card has a non-empty `image_prompt`/`video_prompt`, `user_id` present, defaults applied, `image_url:null`. Also assert a parser guard throws on malformed input (the caller alerts).

```ts
import {
  buildYoutubeCardsFromParsed,
  parseYoutubeScript,
} from '../YoutubePanel';
import type { Project } from '../../../types/database';

const project = { id: 'p-1', name: 'T', target_languages: ['ko'] } as unknown as Project;

const parsed = {
  video_title: 'V',
  sections: [
    { section_type: 'hook', narration_text: '안녕', screen_direction: 'B-roll', subtitle_text: '안녕' },
    { section_type: '', narration_text: '본문', screen_direction: '' }, // missing section_type + subtitle
  ],
};

describe('buildYoutubeCardsFromParsed', () => {
  it('maps sections to cards with defaults, user_id, and builder-filled prompts', () => {
    const cards = buildYoutubeCardsFromParsed(parsed as any, {
      youtubeContentId: 'yt-1',
      userId: 'user-1',
      project,
      imageStyle: '',
      now: '2026-06-07T00:00:00.000Z',
    });
    expect(cards).toHaveLength(2);
    // defaults
    expect(cards[0].section_type).toBe('hook');
    expect(cards[1].section_type).toBe('main'); // '' || 'main'
    expect(cards[1].subtitle_text).toBeNull(); // missing ⇒ ?? null
    expect(cards[0].sort_order).toBe(0);
    expect(cards[1].sort_order).toBe(1);
    // R-A: user_id stamped on every card
    expect(cards.every((c) => c.user_id === 'user-1')).toBe(true);
    expect(cards.every((c) => c.youtube_content_id === 'yt-1')).toBe(true);
    // load-bearing: prompts built from the two youtube builders (non-empty)
    expect(cards[0].image_prompt && cards[0].image_prompt.length).toBeTruthy();
    expect(cards[0].video_prompt && cards[0].video_prompt.length).toBeTruthy();
    expect(cards[0].image_url).toBeNull();
  });
});

describe('parseYoutubeScript', () => {
  it('extracts the JSON object and returns it', () => {
    const out = parseYoutubeScript('blah {"sections":[{"section_type":"hook","narration_text":"x","screen_direction":""}]} trailing');
    expect(out.sections).toHaveLength(1);
  });
  it('throws when no JSON object is present', () => {
    expect(() => parseYoutubeScript('no json here')).toThrow();
  });
  it('throws when sections is empty / missing', () => {
    expect(() => parseYoutubeScript('{"sections":[]}')).toThrow();
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/components/content/__tests__/YoutubeCardItem.helpers`. Expected: **FAIL** (`buildYoutubeCardsFromParsed`/`parseYoutubeScript` not found).
- [ ] **Step 3 (impl — the two pure helpers, top-level in `YoutubePanel.tsx`):** Add these exported functions at module scope (the panel's `onComplete` calls them). They encode CF `:86-126`:

```ts
import { buildYoutubeImagePrompt, buildYoutubeVideoPrompt } from '../../lib/prompt-builder';
import { generateId } from '../../lib/utils';
import type { Project, YoutubeCard } from '../../types/database';

export interface ParsedYoutubeScript {
  video_title?: string;
  video_description?: string;
  video_tags?: string[];
  sections: {
    section_type: string;
    narration_text: string;
    screen_direction: string;
    subtitle_text?: string;
  }[];
}

/** Extract the first `{...}` JSON object from the model output and validate it has sections (CF :86-94). */
export function parseYoutubeScript(fullText: string): ParsedYoutubeScript {
  const objMatch = fullText.match(/\{[\s\S]*\}/);
  if (!objMatch) throw new Error('JSON not found');
  const parsed = JSON.parse(objMatch[0]) as ParsedYoutubeScript;
  if (!parsed.sections?.length) throw new Error('No sections');
  return parsed;
}

/**
 * Map parsed sections → YoutubeCard[] (CF :104-126). The load-bearing detail (spec §7):
 * each card's image_prompt / video_prompt is filled from the two youtube builders.
 * R-A: every card is stamped with user_id (DB col is NOT NULL + RLS).
 */
export function buildYoutubeCardsFromParsed(
  parsed: ParsedYoutubeScript,
  opts: {
    youtubeContentId: string;
    userId: string;
    project: Project;
    imageStyle: string;
    now: string;
  }
): YoutubeCard[] {
  const { youtubeContentId, userId, project, imageStyle, now } = opts;
  return parsed.sections.map((sec, i) => {
    const tempCard = {
      section_type: sec.section_type || 'main',
      narration_text: sec.narration_text || '',
      screen_direction: sec.screen_direction || '',
      subtitle_text: sec.subtitle_text ?? null,
    } as YoutubeCard;
    return {
      id: generateId(),
      user_id: userId,
      youtube_content_id: youtubeContentId,
      section_type: tempCard.section_type,
      narration_text: tempCard.narration_text,
      screen_direction: tempCard.screen_direction,
      subtitle_text: tempCard.subtitle_text,
      image_url: null,
      image_prompt: buildYoutubeImagePrompt(project, tempCard, imageStyle),
      video_prompt: buildYoutubeVideoPrompt(project, tempCard, imageStyle),
      sort_order: i,
      created_at: now,
      updated_at: now,
    };
  });
}
```
- [ ] **Step 4 (run):** test → **PASS** (the `buildYoutubeCardsFromParsed` + `parseYoutubeScript` cases). (You may need to author the rest of `YoutubePanel.tsx` — Task 3.2 — before the file typechecks; if so, write the two helpers + a minimal stub export first, run this test green, then complete Task 3.2. State which order you took.)
- [ ] **Step 5:** No separate commit — fold into Task 3.2's commit (the helpers live in `YoutubePanel.tsx`). If you prefer an isolated commit, commit the helpers + their test now and the rest of the panel in Task 3.2.

### Task 3.2: `YoutubePanel.tsx` (`YoutubePanel` outer + `YoutubePanelInner`) ← `youtube-panel.tsx`

> Port CF's outer/inner split onto the worktree data layer (the `ThreadsPanel.tsx` template). **Two exported pieces in one file** (matches CardNewsPanel/ThreadsPanel layout). Apply R-A (user_id stamping), R-B (`useCardImageGeneration` worktree API), R-C (`PromptEditDialog.onConfirm`), R-D (`ChannelContentList` 1-arg `getTitle` + `Promise<string>` `onAdd`), R-E (omit `ChannelTranslationView` + publish-queue), R-F (debounce text edits). Use the helpers from Task 3.1.

**Files:**
- Create/complete: `packages/client/src/features/marketing/components/content/YoutubePanel.tsx`

- [ ] **Step 1 (header + getCurrentUserId + outer):** Copy CF `youtube-panel.tsx`. Strip `'use client'`. Rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/*` → `../../lib/*`, `@/types/*` → `../../types/*`, `@/hooks/*` → `../../hooks/*`, `@/stores/project-store` → `../../api/use-youtube-contents` + `../../api/use-channel-models` + `../../api/use-contents`). Add the `getCurrentUserId()` async helper (identical to `ThreadsPanel.tsx:37-43`). Imports to add: `useContent` (`../../api/use-contents`), `useChannelModels` (`../../api/use-channel-models`), the seven youtube hooks (`../../api/use-youtube-contents`), `supabase` (`../../api/supabase`), `buildYoutubePrompt` (`../../lib/prompt-builder`), `cn` (`../../lib/utils`), the card-item + preview + shared components.

  **Outer `YoutubePanel({ content, project })`** — mirror `ThreadsPanel` outer (`ThreadsPanel.tsx:342-404`):
  ```tsx
  export function YoutubePanel({ content, project }: { content: Content; project: Project }) {
    const { data: contentGraph } = useContent(content.id);
    const { models: channelModels, setChannelModels } = useChannelModels(project.id, 'youtube');

    const createYoutubeContent = useCreateYoutubeContent();
    const deleteYoutubeContent = useDeleteYoutubeContent();
    const updateYoutubeContent = useUpdateYoutubeContent();

    const youtubeContents = (contentGraph?.youtubeContents ?? []) as Array<
      YoutubeContent & { cards: YoutubeCard[] }
    >;
    const hasBaseArticle = Boolean(contentGraph?.baseArticle);
    const baseArticle = contentGraph?.baseArticle ?? null; // fidelity #1 — forward into inner

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-border shrink-0">
          <ChannelModelSelector
            textModel={channelModels.textModel}
            imageModel={channelModels.imageModel}
            showImageModel
            aspectRatio={channelModels.aspectRatio}
            imageStyle={channelModels.imageStyle}
            defaultAspectRatio="16:9"   {/* CF passes defaultAspectRatio="16:9" */}
            onTextModelChange={(m) => setChannelModels({ textModel: m })}
            onImageModelChange={(m) => setChannelModels({ imageModel: m })}
            onAspectRatioChange={(r) => setChannelModels({ aspectRatio: r })}
            onImageStyleChange={(s) => setChannelModels({ imageStyle: s })}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <ChannelContentList<YoutubeContent & { cards: YoutubeCard[] }>
            items={youtubeContents}
            getId={(yc) => yc.id}
            getTitle={(yc) => yc.title || '유튜브 대본'}   {/* R-D: 1-arg getTitle (no index) */}
            onTitleChange={(id, title) =>
              updateYoutubeContent.mutate({ id, contentId: content.id, updates: { title } })
            }
            onAdd={() => createYoutubeContent.mutateAsync({ contentId: content.id })}  {/* R-D: Promise<string> */}
            onDelete={(id) => deleteYoutubeContent.mutate({ id, contentId: content.id })}
            addLabel="새 유튜브 대본 추가"
            accentColor="border-l-4 border-l-indigo-600"
            renderContent={(yc) => (
              <YoutubePanelInner
                key={yc.id}
                youtubeContent={yc}
                content={content}
                project={project}
                hasBaseArticle={hasBaseArticle}
                baseArticle={baseArticle}
                channelModels={channelModels}
              />
            )}
          />
        </div>
      </div>
    );
  }
  ```
  ⚠️ **R-E: OMIT** CF outer's `onAddToQueue`/`addToPublishQueue` entirely (no publish layer — Non-Goals).

- [ ] **Step 2 (inner state + auto-select + AI gen):** `YoutubePanelInner({ youtubeContent, content, project, hasBaseArticle, baseArticle, channelModels })`. Props type mirrors `ThreadsPanelInner` (with `channelModels: ReturnType<typeof useChannelModels>['models']`).
  - **Top of inner:** `const contentId = content.id;` (ThreadsPanel.tsx:64) — all hooks below take `contentId` for invalidation.
  - **State:** `localCards: YoutubeCard[]` (`useState((youtubeContent.cards ?? []).slice().sort((a,b)=>a.sort_order-b.sort_order))`), re-synced via the `prevContentIdRef` guard keyed on `youtubeContent.id` (ThreadsPanel.tsx:71-75 pattern — re-sort on re-sync). `selectedCardId: string|null`, `showVideoSettings`, `showPreview`, `showPromptDialog`, `generatedPrompt`, `copied`, `generatingCardId: string|null`, `narrationRef = useRef<HTMLTextAreaElement>(null)`.
  - **Auto-select-first effect** (CF :62-67): when `localCards` changes and `selectedCardId` is missing/stale, select `localCards[0].id`; when empty, `null`.
  - **Auto-resize narration effect** (CF :70-76): on `[selectedCardId, localCards]`, set `narrationRef.current.style.height='auto'` then `scrollHeight`.
  - **Derived:** `selectedCard = localCards.find(c=>c.id===selectedCardId) ?? null`; `selectedIndex`; `totalChars = localCards.reduce((s,c)=>s+(c.narration_text?.length ?? 0),0)`; **`estimatedMinutes = Math.max(1, Math.round(totalChars/250))`** (CF :221-222); `selectedSectionInfo = selectedCard ? getSectionInfo(selectedCard.section_type) : null`.
  - **Mutation hooks:** `useSetYoutubeCards`, `useAddYoutubeCard`, `useUpdateYoutubeCard`, `useDeleteYoutubeCard`, `useUpdateYoutubeContent`.
  - **AI 대본 generation** (`useAiGeneration`, adapt CF :82-139 → make `onComplete` **async** like ThreadsPanel since we stamp user_id):
    ```tsx
    const { isGenerating, generate, abort } = useAiGeneration({
      onComplete: useCallback(
        async (fullText: string) => {
          try {
            const parsed = parseYoutubeScript(fullText);
            // update content meta if present (CF :96-102)
            if (parsed.video_title || parsed.video_description || parsed.video_tags) {
              await updateYoutubeContent.mutateAsync({
                id: youtubeContent.id,
                contentId,
                updates: {
                  ...(parsed.video_title ? { video_title: parsed.video_title } : {}),
                  ...(parsed.video_description ? { video_description: parsed.video_description } : {}),
                  ...(parsed.video_tags ? { video_tags: parsed.video_tags } : {}),
                },
              });
            }
            const userId = await getCurrentUserId();              // R-A
            const now = new Date().toISOString();
            const newCards = buildYoutubeCardsFromParsed(parsed, {  // Task 3.1 helper (fills image_/video_prompt)
              youtubeContentId: youtubeContent.id,
              userId,
              project,
              imageStyle: channelModels.imageStyle,
              now,
            });
            setLocalCards(newCards);
            setSelectedCardId(newCards[0]?.id ?? null);
            await setYoutubeCards.mutateAsync({
              youtubeContentId: youtubeContent.id,
              contentId,
              cards: newCards,
            });
          } catch {
            alert('대본 파싱 실패. 다시 시도해 주세요.');     // CF :130-132
          }
        },
        [youtubeContent.id, contentId, project, channelModels.imageStyle, setYoutubeCards, updateYoutubeContent]
      ),
      onError: useCallback((err: string) => { alert(`AI 생성 오류: ${err}`); }, []),
    });

    const handleGenerate = () => {
      const prompt = buildYoutubePrompt({
        project,
        content,
        baseArticle: baseArticle ?? undefined,   // fidelity #1 (baseArticle injection)
        youtubeContent,                          // target_duration → short/mid/long guidance
      });
      setGeneratedPrompt(prompt);
      setShowPromptDialog(true);
    };
    const handleStartGeneration = (prompt: string) => generate(prompt, channelModels.textModel);
    ```

- [ ] **Step 3 (inner — image gen R-B + card handlers R-F):** Adapt the **worktree `useCardImageGeneration` API** (R-B; CardNewsPanel/ThreadsPanel show the exact mapping — CF's `getPrompt(card)`/`saveResult`/`getExistingImage`/`generateCardImage`/`generateAllImages` do NOT exist):
  ```tsx
  const {
    isGenerating: isGeneratingImage,
    progress: imageProgress,
    generateForCard,
    generateAll,
    abort: abortImageGeneration,
  } = useCardImageGeneration({
    projectId: project.id,
    category: 'images',
    getPrompt: (cardId) => {
      const c = localCards.find((x) => x.id === cardId);
      return c?.image_prompt || buildYoutubeImagePrompt(project, c!, channelModels.imageStyle);
    },
    getModel: () => channelModels.imageModel,
    getAspectRatio: () => channelModels.aspectRatio || '16:9',
    shouldSkip: (cardId) => !!localCards.find((x) => x.id === cardId)?.image_url, // generateAll only
    onSave: async (cardId, url, prompt) => {
      setLocalCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, image_url: url, image_prompt: prompt } : c))
      );
      await updateYoutubeCard.mutateAsync({
        cardId,
        contentId,
        updates: { image_url: url, image_prompt: prompt },
      });
    },
  });
  const handleGenerateCardImage = (cardId: string) => {
    setGeneratingCardId(cardId);
    generateForCard(cardId).finally(() => setGeneratingCardId(null));
  };
  const handleGenerateAllImages = () => generateAll(localCards.map((c) => c.id));
  ```
  > **No `batch-image-store`** for youtube — `generateAll` already sequences with abort + 3s gap (the store bridge was a CardNews-only exception, spec §6.3/§8).

  **Card edit handlers** (CF :174-195, with R-F debounce mirrored from `ThreadsPanel.tsx:182-237`):
  ```tsx
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const TEXT_FIELDS = new Set(['narration_text','screen_direction','subtitle_text','image_prompt','video_prompt']);

  const handleCardUpdate = useCallback((cardId: string, updates: Partial<YoutubeCard>) => {
    setLocalCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
    const isTextOnly = Object.keys(updates).every((k) => TEXT_FIELDS.has(k));  // R-F
    if (isTextOnly) {
      const existing = debounceTimers.current.get(cardId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        debounceTimers.current.delete(cardId);
        updateYoutubeCard.mutate({ cardId, contentId, updates });
      }, 400);
      debounceTimers.current.set(cardId, timer);
    } else {
      updateYoutubeCard.mutate({ cardId, contentId, updates });  // section_type / image_url → immediate
    }
  }, [contentId, updateYoutubeCard]);

  const handleCardDelete = useCallback((cardId: string) => {
    setLocalCards((prev) => prev.filter((c) => c.id !== cardId));
    deleteYoutubeCard.mutate({ cardId, contentId });
    if (selectedCardId === cardId) {
      const remaining = localCards.filter((c) => c.id !== cardId);
      setSelectedCardId(remaining[0]?.id ?? null);
    }
  }, [contentId, deleteYoutubeCard, localCards, selectedCardId]);

  const handleAddSection = async () => {                          // CF :186-195 + ThreadsPanel add pattern
    const id = await addYoutubeCard.mutateAsync({
      youtubeContentId: youtubeContent.id, contentId, sortOrder: localCards.length,
    });
    const userId = await getCurrentUserId().catch(() => '');
    const now = new Date().toISOString();
    setLocalCards((prev) => [
      ...prev,
      { id, user_id: userId, youtube_content_id: youtubeContent.id, section_type: 'main',
        narration_text: '', screen_direction: '', subtitle_text: null, image_url: null,
        image_prompt: null, video_prompt: null, sort_order: prev.length, created_at: now, updated_at: now },
    ]);
    setSelectedCardId(id);
  };
  ```
  **Copy + nav** (CF :197-219, against `localCards`): `handleCopyAll` (clipboard `[i] TYPE↑` / `나레이션:` / `화면:` / `자막:` joined `\n\n---\n\n`, prefixed `# {youtubeContent.video_title}` when present, `복사됨!` 2s); `handlePrevCard`/`handleNextCard` (clamp on `selectedIndex`).

- [ ] **Step 4 (inner — render, CF :226-517 minus translation + publish):** Port the JSX verbatim **except**:
  1. ~~`<ChannelTranslationView contentId={content.id} channel="youtube"/>`~~ — **OMIT** (R-E; no such component, translation is 1d).
  2. **Video Settings collapsible** (`showVideoSettings`, CF :230-278): `ChevronDown` toggle + `Clock` + 영상 설정 + truncated `video_title` hint; body = `Input` video_title → `updateYoutubeContent.mutate({ id, contentId, updates:{ video_title } })`, raw `<select>` target_duration (숏폼 1~3분 / 표준 5~10분 / 롱폼 15~30분 → `updateYoutubeContent.mutate({ updates:{ target_duration } })`), `Input` video_tags (comma-split → array), `Textarea` video_description. Import `Input`/`Textarea` from `../../ui/input` / `../../ui/textarea`; raw `<select>` is fine (CF uses raw select).
  3. **Action bar** (CF :280-325): `{localCards.length}개 씬` `Badge` + `~{estimatedMinutes}분` `Badge` (with `Clock`); `<GenerationButton variant="text" isGenerating={isGenerating} disabled={!hasBaseArticle} onClick={handleGenerate} onAbort={abort} label="AI 대본" loadingLabel="대본 생성 중..." className={!isGenerating ? 'bg-red-600 hover:bg-red-700 text-white' : undefined} />` (CF's red youtube CTA); `<GenerationButton variant="batch-image" isGenerating={isGeneratingImage} disabled={localCards.length===0} onClick={handleGenerateAllImages} onAbort={abortImageGeneration} progress={imageProgress} />`; 미리보기 `Button` (`Eye`); 복사 `Button` (`Copy`/`Check`).
  4. **No-base-article hint** (CF :328-330): `{!hasBaseArticle && <p className="text-sm text-muted-foreground">기본 글을 먼저 작성해 주세요.</p>}`.
  5. **Preview + Script Editor** 2-col `lg:grid-cols-5` (CF :333-469), gated on `localCards.length>0 && selectedCard`:
     - **Left 3/5:** `<ImageCardWidget src={selectedCard.image_url ?? undefined} alt={\`씬 ${selectedIndex+1}\`} aspectClass="aspect-video" isGenerating={generatingCardId===selectedCard.id} onRegenerate={() => handleGenerateCardImage(selectedCard.id)} onDelete={() => updateYoutubeCard.mutate({ cardId: selectedCard.id, contentId, updates:{ image_url:null } })} onUpload={(file) => { const r = new FileReader(); r.onload = () => handleCardUpdate(selectedCard.id, { image_url: r.result as string }); r.readAsDataURL(file); }} placeholder="이미지 생성 또는 업로드" />`. ⚠️ **`src={selectedCard.image_url ?? undefined}`** — the worktree `ImageCardWidget.src` is `string | undefined` (CF passed `... || null`; adapt to `?? undefined`). Note `onUpload` routes the data-URL through `handleCardUpdate({ image_url })` (a structural field → persists immediately, not debounced). Section badge overlay top-left (`selectedSectionInfo.color`, CF :354-360). Prev/next nav (`ChevronLeft`/`ChevronRight`, `selectedIndex+1 / localCards.length`).
     - **Right 2/5:** section-type `<select>` (`SECTION_TYPES`) → `handleCardUpdate({ section_type })`; narration `<textarea ref={narrationRef}>` → `handleCardUpdate({ narration_text })` + `{...length}자`; screen_direction `<textarea>` → `handleCardUpdate({ screen_direction })`; subtitle `<input>` → `handleCardUpdate({ subtitle_text })`; image_prompt `<textarea>` → `handleCardUpdate({ image_prompt })` + per-scene 이미지 생성/재생성 `Button` (`onClick={() => handleGenerateCardImage(selectedCard.id)}`, `disabled={isGeneratingImage}`, spinner when `generatingCardId===selectedCard.id`); video_prompt `<textarea>` → `handleCardUpdate({ video_prompt })`. All wired through `handleCardUpdate` (text fields debounce; section_type immediate).
  6. **Timeline** (CF :471-491): `localCards.length>0` → horizontal scroll of `<TimelineCard ... isSelected={card.id===selectedCardId} onClick={() => setSelectedCardId(card.id)} onDelete={handleCardDelete} />` × N + `{hasBaseArticle && <AddSceneButton onAdd={handleAddSection} />}`.
  7. **Empty state** (CF :493-500): `localCards.length===0 && hasBaseArticle` → centered "AI 대본을 생성하거나 수동으로 씬을 추가하세요" button (`onClick={handleAddSection}`).
  8. **Dialogs:** `<PromptEditDialog open={showPromptDialog} onOpenChange={setShowPromptDialog} initialPrompt={generatedPrompt} onConfirm={(prompt) => handleStartGeneration(prompt)} />` (**R-C** — `onConfirm`, NOT CF's `onGenerate`/`isGenerating`/`onAbort`; the worktree dialog closes itself); `<YoutubePreviewDialog open={showPreview} onOpenChange={setShowPreview} cards={localCards} videoTitle={youtubeContent.video_title} />`.

- [ ] **Step 5 (R-1 + typecheck):** confirm panel icons `Loader2,Copy,Check,Eye,Clock,ImageIcon,ChevronLeft,ChevronRight,ChevronDown` resolve at `^1.17.0`. `pnpm --filter client typecheck` → **PASS**. Confirm **no** leftover references: `useProjectStore`, `addToPublishQueue`, `ChannelTranslationView`, `getExistingImage`/`saveResult`/`generateCardImage`/`generateAllImages` (CF image-hook API), `onGenerate`/`isGenerating` PromptEditDialog props, `/api/storage` (non-`mkt`), `'use client'`, `@next/next/no-img-element`.
- [ ] **Step 6:** Commit (folds in the Task 3.1 helpers):
  ```bash
  git add packages/client/src/features/marketing/components/content/YoutubePanel.tsx packages/client/src/features/marketing/components/content/__tests__/YoutubeCardItem.helpers.test.ts
  git commit -m "feat(marketing): YoutubePanel (AI 대본, per-scene + batch image, timeline, preview) + parse/fill helpers (R-A..R-F)"
  ```

### Task 3.3: Wire `YoutubePanel` into `ContentTabs.tsx`

> One-line tab flip + body swap. `ContentTabs` is prop-less and already derives `content`/`project` (see the ⚠️ note above), mounting panels as `<Panel content={content} project={project} />`. **`shorts` stays `ComingSoonPanel`** (Non-Goals; faithful-port — CF `shorts` is itself a placeholder).

**Files:**
- Modify: `packages/client/src/features/marketing/components/content/ContentTabs.tsx`

- [ ] **Step 1 (import + flip + swap):** In `ContentTabs.tsx`:
  - Import `YoutubePanel`: `import { YoutubePanel } from './YoutubePanel';`.
  - In the `TABS` array (`:22`), flip the `youtube` entry `active: false → true`: `{ id: 'youtube', label: '롱폼', active: true },`.
  - Replace the `youtube` `TabsContent` body (`:141-143`):
    ```tsx
    <TabsContent value="youtube" className="flex-1 min-h-0 m-0 overflow-hidden">
      <YoutubePanel content={content} project={project} />
    </TabsContent>
    ```
  - **Leave `shorts` UNCHANGED** (`:23` stays `active: false`; `:144-146` stays `<ComingSoonPanel label="숏폼" />`).
  - **Do NOT touch `KO_ONLY_TABS`** (`:44`, `['blog']`) — youtube is NOT ko-only; it stays visible under any language (the LanguageSelector translate action remains the existing stub `alert('번역은 곧 지원됩니다…')`, spec §9).
- [ ] **Step 2 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3 (manual-verify @superpowers:verification-before-completion):** `pnpm dev`; open `/marketing/content`; select a project + a content **with a base article** → 롱폼 tab.
  - **No base article control:** if the content lacks a base article, "AI 대본" is disabled + "기본 글을 먼저 작성해 주세요." shows. Create/select one with a base article to proceed.
  - **새 유튜브 대본 추가** → version accordion expands.
  - **영상 설정**: expand, change 길이 to 숏폼/표준/롱폼, type a 제목/태그/설명 (persist on reload).
  - **AI 대본**: click → `PromptEditDialog` shows the built prompt (duration-aware) → 이 프롬프트로 생성 → title/description/tags fill + the **color-coded timeline** populates with scenes.
  - **Edit a scene:** change 씬 타입 (timeline badge color updates immediately), edit 나레이션 (char count + auto-resize; debounced save — `SaveStatusIndicator` if wired), 화면 디렉션, 자막, 이미지 프롬프트, 영상 프롬프트.
  - **Per-scene 이미지 생성** → the 16:9 `ImageCardWidget` fills; **전체 이미지** (batch) → progress badge advances, abort works.
  - **미리보기** → `YoutubePreviewDialog` (약 N분 + N개 섹션) → 전체 복사 (clipboard has `# title` + `[i] TYPE` blocks).
  - **복사** (action-bar) → same clipboard format.
  - **씬 추가** (timeline) + **delete a scene** (hover trash) → selection reselects.
  - **Reload** → cards + meta persist (graph refetch).
  - 🔴 **R-A regression guard:** in Supabase (or `mcp__supabase__execute_sql` `select user_id from mkt_youtube_cards limit 5`), confirm inserted card rows have a non-null `user_id`. If any NULL → the panel/hook stamping is broken; fix before claiming done.
  - **shorts** tab still shows 준비 중.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/ContentTabs.tsx
  git commit -m "feat(marketing): wire youtube tab → YoutubePanel (shorts stays placeholder)"
  ```

---

## Chunk 4: Verification (full suite + manual E2E + scope confirmation)

> @superpowers:verification-before-completion — run every gate and confirm output before any "done" claim. Evidence before assertions.

### Task 4.1: Automated gates

**Files:** none (verification only).

- [ ] **Step 1 (unit tests):** `pnpm --filter client test marketing` → all marketing tests green, including the **new** `use-youtube-contents` (4) + `YoutubeCardItem.helpers` (`getSectionInfo` + `estimatedSceneSeconds` + `estimateReadingTime` + `buildYoutubeCardsFromParsed` + `parseYoutubeScript`) on top of the Phase 1a/1b suite (1b ended at 313 tests; expect that plus the new files). Record the exact file/test counts. Pre-existing non-marketing failures (auth/RequireAuthedWithPin, games/SpeakingPlayer, viewer/GameListViewer — jsdom `window.matchMedia`) are unchanged and out of scope.
- [ ] **Step 2 (typecheck):** `pnpm typecheck` (all packages) → **PASS** (shared/server/client clean). The `YoutubeCard.user_id` add (Chunk 0) + the new hooks/panel must not introduce any error.
- [ ] **Step 3 (lint):** `pnpm lint` → **no new errors** from 1c code. Pre-existing remotion TS-parse errors + pre-existing warnings are unchanged. Confirm no leftover `'use client'`, `@next/next/no-img-element` in the three new components.
- [ ] **Step 4 (build):** `pnpm --filter client build` → **PASS**. Pre-existing chunk-size warning is unchanged; no new build errors.
- [ ] **Step 5:** No commit (verification only).

### Task 4.2: Manual E2E + scope confirmation

**Files:** none (verification only).

- [ ] **Step 1 (youtube full flow):** Re-run the Chunk 3 Task 3.3 Step 3 manual flow end-to-end (create version → AI 대본 short/mid/long → timeline color-coding → edit section/narration → per-scene image → batch image → preview + 전체 복사 → reload persistence → add/delete scene/version). Confirm **`user_id` is set** on inserted rows (the R-A guard).
- [ ] **Step 2 (scope confirmation — static):**
  - `ContentTabs.tsx`: `youtube` `active:true` renders `<YoutubePanel/>`; **`shorts` `active:false` still renders `<ComingSoonPanel label="숏폼" />`** (faithful-port — Non-Goals).
  - `grep ChannelTranslationView packages/client/src/features/marketing/components/content/` → **0 results** (translation is 1d; CF's youtube `<ChannelTranslationView/>` was intentionally omitted, R-E).
  - No `addToPublishQueue` / publish UI in `YoutubePanel` (R-E).
  - No `image-editor-dialog` import; `ImageCardWidget.onEdit` stays undefined (O-7).
  - No `batch-image-store` import in `YoutubePanel` (youtube uses the in-hook `generateAll`, spec §8).
  - `KO_ONLY_TABS` unchanged (`['blog']`) — youtube visible for non-ko.
- [ ] **Step 3 (RLS sanity):** Phase 1c migration = at most **1 optional perf-index migration** on `mkt_youtube_contents`/`mkt_youtube_cards` (no policy/table changes). All existing RLS policies (single-owner `user_id = auth.uid()` `with check`) unchanged. **No new SECURITY DEFINER functions** → no `GRANT EXECUTE` needed (memory RULE n/a). The `user_id` stamping (R-A) is what makes inserts pass the `with check`.
- [ ] **Step 4 (finish):** @superpowers:finishing-a-development-branch — present merge/PR/cleanup options. Per the user's "업데이트 하자" workflow (if invoked): update `features/marketing/CLAUDE.md` 채널 구현 현황 table (유튜브 placeholder → **완료** `YoutubePanel.tsx`; shorts stays placeholder; 번역+이미지 에디터 → Phase 1d), the root + worktree `CLAUDE.md` `/marketing` line (채널 6/7 완료, 유튜브 추가), the Phase 1c spec status → **COMPLETE**, and memory `marketing-port-contentflow-2026-06-07.md` (Phase 1c done; next 'Phase 1d 가자' = 번역 + 이미지 에디터). Commit the docs.

---

## Appendix A — R-series adaptations referenced above (spec §10)

- **R-A 🔴 — `YoutubeCard.user_id` missing:** TS type omitted `user_id` while `mkt_youtube_cards.user_id` is NOT NULL + RLS `with check`. **Fix (Chunk 0):** add `user_id: string`. **Stamp it** in `useAddYoutubeCard`/`useCreateYoutubeContent` (`getUserId()`), in the panel `onComplete` (`getCurrentUserId()` → `buildYoutubeCardsFromParsed`), and `handleAddSection` (`getCurrentUserId().catch(()=>'')`), and pass user-id-bearing cards into `setYoutubeCards`. Same class as 1a/1b R-9. **Highest-risk item.**
- **R-B — `useCardImageGeneration` worktree API ≠ CF:** worktree hook is **cardId-based** (`getPrompt(cardId)`/`getModel(cardId)`/`getAspectRatio?(cardId)`/`shouldSkip?(cardId)`/`onSave(cardId,url,prompt)` → `{ isGenerating, progress, generateForCard, generateAll, abort }`). CF's `getPrompt(card)`/`getExistingImage`/`saveResult`/`generateCardImage(cardId,cards)`/`generateAllImages(cards)` do NOT exist. Adapt per Chunk 3 Step 3 (mirror CardNewsPanel/ThreadsPanel). Track the in-flight card in `generatingCardId` set right before `generateForCard`.
- **R-C — `PromptEditDialog.onConfirm`:** worktree dialog uses `onConfirm(prompt)` and closes itself; no `onGenerate`/`isGenerating`/`onAbort` props. Use `onConfirm={(p) => handleStartGeneration(p)}`.
- **R-D — `ChannelContentList` 1-arg `getTitle` + `Promise<string>` `onAdd`:** `getTitle = (yc) => yc.title || '유튜브 대본'` (no `${index+1}`); `onAdd` returns `createYoutubeContent.mutateAsync(...)` id. NO `onAddToQueue`/`publishChannels`.
- **R-E — Omit translation view + publish-queue:** CF inner's `<ChannelTranslationView channel="youtube"/>` and CF outer's `onAddToQueue`/`addToPublishQueue` are dropped (1d / no-publish-layer).
- **R-F — Text write-storm:** CF wrote every keystroke to Zustand; the DB can't. Debounce `narration_text`/`screen_direction`/`subtitle_text`/`image_prompt`/`video_prompt` ~400 ms per cardId (ThreadsPanel O-F pattern); persist `section_type`/`image_url` immediately.
- **R-G — `setYoutubeCards` non-transactional delete+insert:** accept parity with instagram/threads (Open Q1 — revisit in a cross-channel hardening pass).
- **R-H — Local-mirror reconciliation flicker:** re-sync `localCards` only on `youtubeContent.id` change via `prevContentIdRef` (1b pattern) — avoids stomping live edits.
- **R-I — Tailwind JIT for `SECTION_TYPES`/`SECTION_COLORS`:** static string literals in source → JIT picks them up; no dynamic concatenation.

## Appendix B — The youtube prompt builders (already ported; no change)

`lib/prompt-builder.ts` (verbatim CF, no edit in 1c):
- `buildYoutubePrompt(ctx & { youtubeContent? })` (`:606-694`) — duration-aware (`youtubeContent?.target_duration ?? 'mid'` → short 3~5 / mid 5~8 / long 8~15 sections), emits the `{video_title, video_description, video_tags, sections[]}` JSON contract + section-type & writing rules + brand context + `youtube_tone_prompt` / `writing_guide_youtube` + **`baseArticle.body_plain_text` injection** (`:683-687`). `youtubeContent.target_duration` flows in via `handleGenerate`.
- `buildYoutubeImagePrompt(project, card, imageStyle)` (`:700-739`) — still-image prompt from `subtitle_text` + section mood map + `youtube_image_style_prompt` + 16:9 + no-text + Korean-context. Called by `buildYoutubeCardsFromParsed` (on parse) + the image hook's `getPrompt` (fallback).
- `buildYoutubeVideoPrompt(project, card, imageStyle)` (`:745-792`) — motion prompt from `screen_direction` + narration summary + section motion map (text only, no video model call). Called by `buildYoutubeCardsFromParsed` (on parse).

## Appendix C — Image pipeline reuse (unchanged; no server work)

Per-scene + batch still images reuse the shared pipeline:
`hooks/use-card-image-generation.ts` → `useImageGeneration` (`POST /api/mkt/ai/generate-image` → `{ base64, mimeType:'image/png' }`) → `convertToWebpBlob` → `uploadToR2({ projectId, category:'images', fileName:'{cardId}.webp', contentType:'image/webp', contentId:cardId })` → R2-fail fallback = data URL → `onSave(cardId, url, prompt)`. `ImageCardWidget` (`aspectClass="aspect-video"`) renders zoom/regenerate/upload/download/delete (`onEdit` undefined, O-7). Server endpoints (`/api/mkt/ai/generate-image`, `/storage/presign`, `/storage/proxy`) already exist — **no server work in 1c**. (All R2 paths use `/api/mkt/storage/*`, never `/api/storage/*`.)
