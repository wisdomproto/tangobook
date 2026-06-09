# Marketing Phase 1b (Cardnews + Threads) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `cardnews` and `threads` `ComingSoonPanel` placeholders in `ContentTabs` with two real content-generation panels — 카드뉴스 (Instagram carousel: templates sidebar + 4:5 Canvas slide editor with draggable/resizable text blocks + AI text gen + batch image gen + Canvas→WebP download) and 스레드 (Threads: post-card list + 500-char counter + per-post image + `[n/total]` 전체 복사 + phone-style preview) — as a faithful port of ContentFlow onto the Phase 0/1a stack.

**Architecture:** Extends the existing `packages/client/src/features/marketing/` feature module. The whole content graph is already read once via `useContent(contentId)` (`api/queries.ts:fetchContentGraph` already returns `instagramContents`+cards and `threadsContents`+cards) and sliced down as props — exactly as `BlogPanel` does. Phase 1b adds only **write** hooks (instagram/threads contents+cards, card-templates), a **module-level batch-image Zustand job store** (UI/job state only, results land in the TanStack cache via an injected `onSaved` callback), and the panel/card-item/preview components. Server data = TanStack Query; UI-only state = `store/ui-store.ts`/`save-status-store.ts`/the job-only `batch-image-store.ts`. All ContentFlow `useProjectStore()` calls are re-expressed as `api/` hooks (spec §3.1). **No server code in 1b** — `/api/mkt/ai/generate`, `/api/mkt/ai/generate-image`, `/api/mkt/storage/presign`, `/api/mkt/storage/proxy` all exist; the only server-adjacent item is the **R2 bucket CORS policy** (a config change, R-0, Chunk 0). youtube/shorts stay placeholders (1c); 8-language translation generation + `image-editor-dialog` are OUT (1d).

**Tech Stack:** React 18 + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3 + lucide-react `^1.17.0` + native Canvas 2D (`renderCardToBlob`) + custom `PointerEvent` drag/resize (NO @dnd-kit, NO TipTap in 1b) + Express v5 (consume-only) + `@aws-sdk/client-s3` (R2, consume-only). Tests: vitest + @testing-library/react (jsdom).

**Source to port from:** `C:\projects\contentflow\contentflow\src\components\content\` — `cardnews-panel.tsx` (986 lines), `cardnews-card-item.tsx` (592), `cardnews-templates.ts` (114), `threads-panel.tsx` (281), `threads-card-item.tsx` (177), `threads-preview-dialog.tsx` (113) — plus `src/stores/batch-image-store.ts` (149). ContentFlow uses Next.js + one ~1,900-line Zustand `project-store.ts`; this port adapts to Vite + TanStack Query (see the mapping table in spec §3.1, decisions O-A…O-G in §14, risks R-0…R-10 in §10). Spec: `docs/superpowers/specs/2026-06-07-marketing-phase1b-cardnews-threads-design.md` (read it fully).

**Conventions (match Phase 0 / Phase 1a / Tangobook — spec §15):**
- TanStack Query = server data; Zustand (`ui-store`, `save-status-store`, the **job-only** `batch-image-store`) = UI/job state only. **No server data in Zustand.**
- Files: **PascalCase** components (`CardNewsPanel.tsx`, `ThreadsCardItem.tsx`), **camelCase** data/util/hook/api files (`cardnews-templates.ts`, `use-instagram-contents.ts`). Named exports for components; default for pages. (ContentFlow used kebab-case files — rename on port.)
- UI primitives imported from `../../ui` (e.g. `import { Button } from '../../ui/button'`), NOT `@/components/ui/*`. `cn`/`generateId` from `../../lib/utils`. Types from `../../types/{cards,database}`. Icons from `lucide-react`. Drop every `'use client'` directive; replace `next/image` `<Image>` / `@next/next/no-img-element` `<img>` with plain `<img>`.
- Mutations set `user_id` (from `supabase.auth.getUser()`), `created_at`/`updated_at`, cast payload `as unknown as Record<string, unknown>` (`…[]` for bulk insert), throw on `error`, and `invalidateQueries({ queryKey: mktKeys.content(contentId) })` on success (whole graph refetches). Card-template mutations invalidate `mktKeys.cardTemplates(projectId)`/`mktKeys.cardHiddenBuiltins(projectId)`. Reuse `generateId()` and the `getUserId()` helper pattern (`api/use-blog-contents.ts:7-13`).
- Reuse the existing `/api/mkt/*` endpoints. **No new server code.** Fix any ported upload path's `/api/storage`→`/api/mkt/storage` + `presignedUrl`→`uploadUrl` drift by reusing `uploadToR2` (`api/use-r2-upload.ts`, envelope-fixed in Phase 1a). R2 keys via `buildMktKey` (server-side, `Date.now()` immutability — already done).
- Commit after every task. Commit messages in English. End each commit message with the trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Test command (real):** `pnpm --filter client test <path-substring>` (vitest run). Typecheck: `pnpm typecheck` (all packages) or `pnpm --filter client typecheck`. Lint: `pnpm lint`. Build: `pnpm --filter client build`.
- **Port-task pattern** (for verbatim/near-verbatim Canvas/pointer UI where TDD is impractical): copy source → rename to PascalCase → rewire imports (`@/components/ui/*` → `../../ui/*`, `@/lib/utils` → `../../lib/utils`, `@/types/*` → `../../types/*`, `@/hooks/*` → `../../hooks/*`, `@/stores/*` → `../../store/*` / `../../api/*`) → strip `'use client'` + Next `<img>` eslint-disables → adapt `useProjectStore` reads to the new hooks → adapt the `useCardImageGeneration` cardId-based API (§7) → **build → `pnpm --filter client typecheck` → manual-verify in `/marketing/content` → commit**. This rhythm is called **"port → typecheck → manual-verify → commit"** below.

> @superpowers:test-driven-development for the pure-logic steps (failing test → run → impl → run → commit). @superpowers:verification-before-completion before any "done" claim in Chunk 5.

---

## File Structure

```
packages/client/src/features/marketing/
  api/                            [Phase 0/1a + NEW]
    queries.ts                    EDIT  add mktKeys.cardTemplates / mktKeys.cardHiddenBuiltins (§5.6)
    use-instagram-contents.ts     NEW   instagram contents (1:N) + cards (N) — mirror use-blog-contents.ts
    use-threads-contents.ts       NEW   threads contents (1:N) + cards (N) — mirror use-blog-contents.ts
    use-card-templates.ts         NEW   mkt_card_templates CRUD + mkt_card_hidden_builtins
    use-channel-models.ts         [Phase 1a] REUSE (channels 'cardnews' / 'threads' work as-is)
    use-r2-upload.ts              [Phase 1a] REUSE (envelope-fixed uploadToR2)
    __tests__/
      use-instagram-contents.test.tsx  NEW
      use-threads-contents.test.tsx     NEW
  hooks/                          [Phase 1a — all ported, REUSE]
    use-ai-generation.ts          REUSE  SSE → /api/mkt/ai/generate
    use-image-generation.ts       REUSE  → /api/mkt/ai/generate-image → { base64, mimeType:'image/png' }
    use-card-image-generation.ts  REUSE  cardId-based API (§7) — gen→webp→R2→onSave
  lib/                            [Phase 0/1a — all ported, REUSE]
    prompt-builder.ts             REUSE  buildCardNewsImagePromptsPrompt / buildThreadsPrompt / NO_TEXT_IMAGE_RULE
    image-utils.ts                REUSE  convertToWebpBlob / base64ToBlob
    utils.ts                      REUSE  generateId / cn / countWords
    canvas-export.ts              NEW    renderCardToBlob + wrapLines (extracted, testable) (Chunk 0)
    __tests__/
      canvas-export.test.ts       NEW    wrapLines word-wrap unit tests
  types/
    cards.ts                      [Phase 0] REUSE  CardCanvasData / TextBlock / GlobalCardStyle
    database.ts                   [Phase 0] REUSE  InstagramContent/Card, ThreadsContent/Card, CardTemplateRow
  store/                          [Phase 0 + NEW]
    ui-store.ts                   [Phase 0] REUSE
    save-status-store.ts          [Phase 0] REUSE
    batch-image-store.ts          NEW    port of CF stores/batch-image-store.ts (§5.5)
    __tests__/
      batch-image-store.test.ts   NEW    reducer + selectBatchProgress unit tests
  components/content/             [Phase 1a + NEW]
    ContentTabs.tsx               EDIT   replace cardnews + threads ComingSoonPanel with real panels
    cardnews-templates.ts         NEW    8 built-ins (camelCase data module)
    CardNewsCardItem.tsx          NEW    Canvas + pointer drag/resize + parseCanvasData/defaultCanvasData/AddSlideButton
    CardNewsPanel.tsx             NEW    templates sidebar + slide grid + AI text + batch images + WebP download
    ThreadsCardItem.tsx           NEW    post card + AddPostButton
    ThreadsPanel.tsx              NEW    AI gen + per-post image + 전체 복사
    ThreadsPreviewDialog.tsx      NEW    phone-style preview
    ChannelModelSelector.tsx      [Phase 1a] REUSE
    ChannelContentList.tsx        [Phase 1a] REUSE (generic <T>, 1-arg getTitle)
    GenerationButton.tsx          [Phase 1a] REUSE (variant="batch-image")
    PromptEditDialog.tsx          [Phase 1a] REUSE
    ImageStyleSelector.tsx        [Phase 1a] REUSE (exports ASPECT_RATIO_PRESETS)
    ImageLightbox.tsx             [Phase 1a] REUSE (used by ThreadsCardItem)
    __tests__/
      CardNewsCardItem.helpers.test.ts  NEW  parseCanvasData/snapToGrid/clamp/isBgLight/defaultCanvasData
      cardnews-templates.test.ts        NEW  8 built-ins shape
```

> **No DDL is required.** Phase 0's migration `supabase/migrations/2026-06-07-marketing-schema.sql` already created `mkt_instagram_contents`/`mkt_instagram_cards`/`mkt_threads_contents`/`mkt_threads_cards` **and** `mkt_card_templates`/`mkt_card_hidden_builtins`, all with RLS + single-owner `for all (user_id = auth.uid())` policies (spec §4, verified live 2026-06-07). Two **optional** non-blocking perf indexes are in Chunk 1 Task 1.4; verify-then-add only. **No new SECURITY DEFINER functions** → no `GRANT EXECUTE` needed (memory RULE n/a).

### Chunk dependency order (each chunk is independently runnable in this order)

| Chunk | Depends on | Independently testable / verifiable |
|---|---|---|
| **0** Prereqs & R-0 CORS | — (Phase 0/1a only) | `curl -I -H "Origin: …"` CORS check + `canvas-export` `wrapLines` unit test + typecheck |
| **1** Data hooks + batch store | 0 (the batch store imports the same `convertToWebpBlob`/`uploadToR2`; the panels import `renderCardToBlob` from 0) | hook unit tests (mock supabase) + batch-store reducer test + typecheck |
| **2** Threads (simpler — ships first) | 0, 1 (threads hooks + AI/image hooks, all Phase 1a-ported) | manual E2E of full threads flow + typecheck |
| **3** Cardnews canvas | 0, 1 (instagram card hooks + `renderCardToBlob`) | `CardNewsCardItem` pure-helper unit tests + manual canvas drag/resize |
| **4** Cardnews panel + export | 0, 1, 3 (mounts `CardNewsCardItem`, calls the batch store + `renderCardToBlob`) | manual E2E of full cardnews flow incl. WebP download |
| **5** Verification | 0, 1, 2, 3, 4 | full suite + typecheck + lint + build + manual E2E both channels + RLS sanity |

> Chunks 0/1 are foundational (no UI). Chunk 2 (threads) is deliberately sequenced **before** the cardnews canvas (Chunks 3-4) because it is the smaller, lower-risk port and gives a working channel early. Chunks 3→4 are sequential. The **R-0 CORS prereq (Chunk 0 Task 0.1) MUST land first** — it is the single hard blocker for cardnews WebP export of AI-generated (R2) slides.

---

## Chunk 0: Prerequisites & R-0 CORS (unblock canvas export)

> This chunk has no UI dependencies and must land first: the cardnews WebP export (`renderCardToBlob`, Chunk 4) taints the canvas on any AI-generated (R2-hosted) slide unless R2 CORS is configured (R-0, spec §8.2). It also extracts the testable word-wrap helper and confirms the already-ported pieces are importable.

### Task 0.1: R2 bucket CORS policy (R-0) — the #1 prerequisite

> **Verified (spec §8.2; memory `phonics-library-data-2026-05-10` + `r2-cache-control-immutable-2026-06-02`; `r2.provider.ts:39,163`):** the R2 public domain (`pub-554d78bf0f2346cfb850060ac23280a7.r2.dev`, `config.r2.publicUrl`) does **not** send `Access-Control-Allow-Origin`. Consequence for `renderCardToBlob`: an `<img crossOrigin='anonymous'>` whose `src` is an R2 public URL fails the CORS check → drawing it **taints the canvas** → `canvas.toBlob(...)` throws `SecurityError`. So any slide whose image was AI-generated (uploaded to R2) cannot be exported until CORS is fixed. (Slides with **local data-URL** images — pasted/dropped/uploaded but not yet on R2 — export fine, since data-URLs are same-origin.)
>
> **Decision O-A:** pursue **(A) the durable bucket-CORS fix** AND ship **(B) the same-origin proxy-draw fallback** inside `renderCardToBlob` (Task 0.2) so export is robust regardless of CORS state.

**Files:**
- No repo files (Cloudflare R2 dashboard config). Record the policy + verification command in the commit message of Task 0.2 (or a short note in `docs/` if the team tracks infra there) — **do NOT hardcode credentials or origins in source.**

- [ ] **Step 1 (add the CORS policy — option A):** In the Cloudflare R2 dashboard → the marketing bucket → **CORS Policy**, add:
  ```json
  [
    {
      "AllowedOrigins": ["https://tangobook.co.kr", "http://localhost:5174"],
      "AllowedMethods": ["GET"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 86400
    }
  ]
  ```
  **⚠️ RESIDUAL — origin whitelist (ASSUMPTION):** the exact production origin(s) are an open item. `https://tangobook.co.kr` is the documented marketing site (root CLAUDE.md / strategy deck); `http://localhost:5174` is the dev client port (memory `dev-ports.md`). **Before applying, confirm the real deployed origin(s) with the user** (apex vs `www`, any staging/preview domain, whether the SPA is served from a different host than the R2 bucket). A too-narrow list silently re-breaks export in prod; `"*"` is acceptable for dev/internal-tool use but confirm the team is OK with a public-readable GET-CORS bucket (it already serves public image URLs, so GET-CORS exposes nothing new).
- [ ] **Step 2 (verify):** pick any existing R2 image URL (e.g. an AI-generated cardnews/blog image, or any object under the bucket's public domain) and run:
  ```bash
  curl -I -H "Origin: https://tangobook.co.kr" "https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/<some-image-key>"
  ```
  **Expected:** the response headers include `access-control-allow-origin: https://tangobook.co.kr` (or `*`). If absent, the policy did not take effect — re-check the bucket + origin spelling. Re-run with `-H "Origin: http://localhost:5174"` to confirm the dev origin too.
- [ ] **Step 3 (record):** note the applied policy + the verifying `curl` output in the Task 0.2 commit body (so the infra change is traceable in git history). This is config-only; there is no code commit for Step 1 itself.

> **Fallback note:** even if option A is deferred or the origin can't be confirmed yet, **Task 0.2 ships the proxy-draw fallback (option B)** so cardnews export still works (same-origin `/api/mkt/storage/proxy` draw, untainted). A is the proper fix; B is the safety net. Both together = export robust in all states.

### Task 0.2: Port `renderCardToBlob` + extract `wrapLines` (`lib/canvas-export.ts`) with proxy-draw fallback (O-A)

> CF defines `renderCardToBlob` **inline in the panel** (`cardnews-panel.tsx:475-530`). Extract it to `lib/canvas-export.ts` so (a) the per-character word-wrap is unit-testable as a pure `wrapLines(measure, text, maxW)` helper (spec §12), and (b) the proxy-draw fallback (O-A, §8.2) lives in one place. The Canvas/`toBlob`/`drawImage` parts stay manual (Canvas-bound).

**Files:**
- Create: `packages/client/src/features/marketing/lib/canvas-export.ts`
- Test: `packages/client/src/features/marketing/lib/__tests__/canvas-export.test.ts`

- [ ] **Step 1 (test — `wrapLines` only; the pure part):** Write `canvas-export.test.ts`. `wrapLines` takes a `measure(text)=>number` function (so no Canvas needed), the block text, and `maxW`, and reproduces CF's loop (`cardnews-panel.tsx:495-503`): split on `\n`, greedily pack characters until `measure(cur+ch) > maxW && cur` then start a new line, push the trailing `cur`.

```ts
import { describe, it, expect } from 'vitest';
import { wrapLines } from '../canvas-export';

// measure = 1px per character (deterministic)
const onePxPerChar = (s: string) => s.length;

describe('wrapLines', () => {
  it('keeps a short line on one row', () => {
    expect(wrapLines(onePxPerChar, 'abc', 10)).toEqual(['abc']);
  });

  it('honors explicit \\n breaks', () => {
    expect(wrapLines(onePxPerChar, 'ab\ncd', 100)).toEqual(['ab', 'cd']);
  });

  it('wraps when a line exceeds maxW (greedy char pack)', () => {
    // maxW=3 → "abc" fits (3>3 is false), 4th char overflows
    expect(wrapLines(onePxPerChar, 'abcdef', 3)).toEqual(['abc', 'def']);
  });

  it('emits an empty line for a leading \\n', () => {
    expect(wrapLines(onePxPerChar, '\nabc', 100)).toEqual(['', 'abc']);
  });

  it('returns [] for empty text', () => {
    expect(wrapLines(onePxPerChar, '', 100)).toEqual([]);
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/lib/__tests__/canvas-export`. Expected: FAIL (module not found).
- [ ] **Step 3 (impl):** Create `lib/canvas-export.ts`. Port `renderCardToBlob` verbatim from CF `cardnews-panel.tsx:475-530`, with these adaptations: (a) extract the wrap loop to the exported pure `wrapLines`; (b) add the **proxy-draw fallback (O-A)** — try the direct `crossOrigin='anonymous'` draw first, and on `img.onerror` OR a `toBlob` `SecurityError`, retry once with `img.src` rewritten through `/api/mkt/storage/proxy?url=…` (same-origin, untainted, no `crossOrigin` needed). Data-URL images are drawn directly (never proxied). The function imports `parseCanvasData` from `../components/content/CardNewsCardItem` (Chunk 3) — to avoid a Chunk-0→Chunk-3 import cycle, accept the **already-parsed `CardCanvasData`** as the argument instead of the raw card (the panel calls `parseCanvasData` and passes the result):

```ts
import type { CardCanvasData } from '../types/cards';

const CANVAS_W = 1080;
const CANVAS_H = 1350; // 4:5

/**
 * Greedy per-character word-wrap mirroring ContentFlow cardnews-panel.tsx:495-503.
 * `measure` is injected (ctx.measureText(...).width) so the logic is unit-testable
 * without a Canvas. Honors explicit '\n' and splits when measure(cur+ch) > maxW.
 */
export function wrapLines(
  measure: (text: string) => number,
  text: string,
  maxW: number
): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(cur);
      cur = '';
      continue;
    }
    const test = cur + ch;
    if (measure(test) > maxW && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/** Same-origin proxy URL for an R2 image so canvas draws stay untainted (O-A fallback). */
function proxyUrl(url: string): string {
  return `/api/mkt/storage/proxy?url=${encodeURIComponent(url)}`;
}

function drawTextBlocks(ctx: CanvasRenderingContext2D, data: CardCanvasData): void {
  for (const block of data.textBlocks) {
    if (!block.text || block.hidden) continue;
    const x = (block.x / 100) * CANVAS_W;
    const y = (block.y / 100) * CANVAS_H;
    const maxW = (block.width / 100) * CANVAS_W;
    const fs = block.fontSize * (CANVAS_W / 300);
    ctx.fillStyle = block.color;
    ctx.font = `${block.fontWeight} ${fs}px "${block.fontFamily || 'Noto Sans KR'}", sans-serif`;
    ctx.textAlign = block.textAlign as CanvasTextAlign;
    ctx.textBaseline = 'top';
    const tx =
      block.textAlign === 'center'
        ? x + maxW / 2
        : block.textAlign === 'right'
          ? x + maxW
          : x;
    const lines = wrapLines((t) => ctx.measureText(t).width, block.text, maxW);
    lines.forEach((line, li) => ctx.fillText(line, tx, y + li * fs * 1.4));
  }
}

/**
 * Render a cardnews slide canvas (4:5, 1080×1350) to a WebP Blob.
 * Port of ContentFlow cardnews-panel.tsx:475-530 + O-A proxy-draw fallback (spec §8.2):
 * direct crossOrigin draw first; on taint/onerror, retry once through the same-origin proxy.
 */
export function renderCardToBlob(data: CardCanvasData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('2d context unavailable'));
      return;
    }

    ctx.fillStyle = data.bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const exportBlob = () =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/webp',
        0.85
      );

    if (!data.imageUrl) {
      drawTextBlocks(ctx, data);
      exportBlob();
      return;
    }

    const url = data.imageUrl;
    let triedProxy = false;

    const drawImageThenExport = (img: HTMLImageElement) => {
      const scale = CANVAS_W / img.naturalWidth;
      const imgH = img.naturalHeight * scale;
      const yCenter = (data.imageY / 100) * CANVAS_H;
      const drawY = yCenter - imgH / 2;
      ctx.drawImage(img, 0, drawY, CANVAS_W, imgH);
      drawTextBlocks(ctx, data);
      try {
        exportBlob();
      } catch (err) {
        // SecurityError = tainted canvas → retry once via the same-origin proxy.
        if (!triedProxy && !isDataUrl(url) && (err as Error).name === 'SecurityError') {
          triedProxy = true;
          // Re-render: clear + redraw bg, then load proxied image.
          ctx.fillStyle = data.bgColor;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
          loadImage(proxyUrl(url));
        } else {
          reject(err as Error);
        }
      }
    };

    const loadImage = (src: string) => {
      const img = new Image();
      if (!isDataUrl(src)) img.crossOrigin = 'anonymous';
      img.onload = () => drawImageThenExport(img);
      img.onerror = () => {
        if (!triedProxy && !isDataUrl(url)) {
          triedProxy = true;
          loadImage(proxyUrl(url)); // CORS load failed → proxy draw
        } else {
          // Give up on the image; still export text-only (matches CF onerror behavior).
          drawTextBlocks(ctx, data);
          exportBlob();
        }
      };
      img.src = src;
    };

    loadImage(url);
  });
}
```
> Note: in some browsers a tainted-canvas `toBlob` reports the error **asynchronously** (the callback receives `null`) rather than throwing synchronously. The `img.onerror`→proxy path covers the common "CORS image load rejected" case; the synchronous `try/catch` covers the throw case. If, during Chunk 4 manual testing, a tainted slide yields a `null` blob without throwing, also treat the `toBlob` `null` callback as a trigger for the one-shot proxy retry (add a `b===null && !triedProxy && !isDataUrl(url)` branch in `exportBlob`). Document whichever path the real browser takes.
- [ ] **Step 4 (run):** `pnpm --filter client test marketing/lib/__tests__/canvas-export`. Expected: PASS (5 cases). `pnpm --filter client typecheck` → expect a **type-only** error that `CardCanvasData` import is fine but nothing else; if `parseCanvasData` is referenced it isn't yet (we deferred it to the panel) — confirm `canvas-export.ts` imports only `CardCanvasData`. PASS.
- [ ] **Step 5:** Commit (include the R-0 CORS policy + curl verification from Task 0.1 in the body):
  ```bash
  git add packages/client/src/features/marketing/lib/canvas-export.ts packages/client/src/features/marketing/lib/__tests__/canvas-export.test.ts
  git commit -m "feat(marketing): port renderCardToBlob + testable wrapLines with proxy-draw fallback (R-0/O-A)"
  ```

### Task 0.3: Sanity-confirm the already-ported Phase 1a pieces are importable

> No-op verification (spec §13 Step 0.2). Everything below was ported in Phase 1a — this catches any path drift before the panels depend on them. **Do not re-create any of these.**

**Files:** none (read-only checks).

- [ ] **Step 1 (confirm components):** verify these exist + export as named in `…/components/content/`: `ChannelModelSelector` (props incl. `showImageModel`, `defaultAspectRatio`), `ChannelContentList` (generic `<T>`, **1-arg `getTitle: (item) => string`**, `onAdd: () => Promise<string>`, NO `onAddToQueue`/`publishChannels`), `GenerationButton` (variant `"batch-image"` + `progress`), `PromptEditDialog`, `ImageStyleSelector` (exports `ASPECT_RATIO_PRESETS`), `ImageLightbox`.
- [ ] **Step 2 (confirm hooks):** `hooks/use-ai-generation.ts` (`{ isGenerating, generate, abort }`), `hooks/use-image-generation.ts` (`generateImage → { base64, mimeType:'image/png' }`), `hooks/use-card-image-generation.ts` (**cardId-based**: `getPrompt(cardId)`, `getModel(cardId)`, `getAspectRatio?(cardId)`, `shouldSkip?`, `getReferenceImages?`, `onSave(cardId,url,prompt)`, `projectId`; returns `{ isGenerating, progress, generateForCard, generateAll, abort }` — see §7).
- [ ] **Step 3 (confirm libs + types):** `lib/prompt-builder.ts` exports `buildCardNewsImagePromptsPrompt` (`:384`), `buildThreadsPrompt` (`:487`), `NO_TEXT_IMAGE_RULE` (`:11`); `lib/image-utils.ts` exports `convertToWebpBlob` + `base64ToBlob`; `api/use-r2-upload.ts` exports `uploadToR2` (envelope-fixed, reads `(await res.json()).data`); `types/cards.ts` exports `CardCanvasData`/`TextBlock`/`GlobalCardStyle`; `types/database.ts` exports `InstagramContent`/`InstagramCard`/`CardTemplateRow`/`ThreadsContent`/`ThreadsCard`.
- [ ] **Step 4:** No commit (read-only). If anything is missing/misnamed, STOP and reconcile against the Phase 1a plan before proceeding — Phase 1b assumes all of the above are present.

---

## Chunk 1: Data hooks + batch-image store (no UI)

> Pure data wiring + the job store. Each write hook matches the Phase 0/1a pattern (`api/use-blog-contents.ts`): get `user_id` via the `getUserId()` helper, set `user_id`+`created_at`/`updated_at`, cast payload `as unknown as Record<string,unknown>` (`…[]` for bulk), throw on `error`, `invalidateQueries({ queryKey: mktKeys.content(contentId) })` on success. **Reads are via the existing `useContent(contentId).data` graph — these hooks only WRITE.** Tests mock `@/lib/supabase` and use the `QueryClient` wrapper exactly like `api/__tests__/use-projects.test.tsx` / `use-blog-contents.test.tsx`.

### Task 1.1: Instagram contents + cards hooks (`api/use-instagram-contents.ts`)

> Mirrors `api/use-blog-contents.ts` exactly. Ports `project-store.ts` `addInstagramContent`/`updateInstagramContent`/`deleteInstagramContent`/`setInstagramCardsForContent`/`addInstagramCard`/`updateInstagramCard`/`deleteInstagramCard` (spec §3.1, §5.1-5.2). The high-frequency `setInstagramCards` is **delete-all-then-bulk-insert** — port that sequence exactly; bulk-inserted cards **must already carry `user_id`** (the panel stamps them in `onComplete`, §4.6/R-9).

**Files:**
- Create: `packages/client/src/features/marketing/api/use-instagram-contents.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-instagram-contents.test.tsx`

- [ ] **Step 1 (test):** Cover the highest-risk behaviors: `useCreateInstagramContent` inserts with `content_type:'carousel'`+`user_id`+`status:'draft'` and **returns the new id** (`ChannelContentList.onAdd → Promise<string>`); `useSetInstagramCards` deletes-all then bulk-inserts and invalidates the content graph; the empty-array path skips insert.

```ts
it('useCreateInstagramContent inserts carousel + user_id and returns the new id', async () => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({ insert: insertMock } as any);
  const { result } = renderHook(() => useCreateInstagramContent(), { wrapper: wrapper(queryClient) });
  let newId = '';
  await act(async () => {
    newId = await result.current.mutateAsync({ contentId: 'c-1' });
  });
  const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
  expect(row.content_id).toBe('c-1');
  expect(row.content_type).toBe('carousel');
  expect(row.status).toBe('draft');
  expect(row.user_id).toBe('user-test-id');
  expect(typeof newId).toBe('string');
  expect(row.id).toBe(newId);
});

it('useSetInstagramCards deletes all then bulk-inserts and invalidates', async () => {
  const eqDelete = vi.fn().mockResolvedValue({ error: null });
  const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const cards = [{ id: 'k1', instagram_content_id: 'ig-1', user_id: 'user-test-id', text_style: {}, sort_order: 0, created_at: 'x', updated_at: 'x' }] as any;
  const { result } = renderHook(() => useSetInstagramCards(), { wrapper: wrapper(queryClient) });
  await act(async () => {
    await result.current.mutateAsync({ igContentId: 'ig-1', contentId: 'c-1', cards });
  });
  expect(eqDelete).toHaveBeenCalledWith('instagram_content_id', 'ig-1');
  expect(insertMock).toHaveBeenCalledOnce();
  expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: mktKeys.content('c-1') });
});

it('useSetInstagramCards skips insert when cards is empty', async () => {
  const eqDelete = vi.fn().mockResolvedValue({ error: null });
  const deleteMock = vi.fn().mockReturnValue({ eq: eqDelete });
  const insertMock = vi.fn();
  mockFrom.mockReturnValue({ delete: deleteMock, insert: insertMock } as any);
  const { result } = renderHook(() => useSetInstagramCards(), { wrapper: wrapper(queryClient) });
  await act(async () => {
    await result.current.mutateAsync({ igContentId: 'ig-1', contentId: 'c-1', cards: [] });
  });
  expect(eqDelete).toHaveBeenCalled();
  expect(insertMock).not.toHaveBeenCalled();
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/api/__tests__/use-instagram-contents`. Expected: FAIL.
- [ ] **Step 3 (impl):** Create `use-instagram-contents.ts` with all seven hooks. Reuse the `getUserId()` helper pattern from `use-blog-contents.ts:7-13`. The load-bearing ones, verbatim:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { InstagramContent, InstagramCard } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCreateInstagramContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      data,
    }: {
      contentId: string;
      data?: Partial<InstagramContent>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        content_id: contentId,
        title: null,
        caption: null,
        hashtags: null,
        content_type: 'carousel',
        video_settings: null,
        status: 'draft',
        published_url: null,
        published_at: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_instagram_contents')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateInstagramContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contentId: _c,
      updates,
    }: {
      id: string;
      contentId: string;
      updates: Partial<InstagramContent>;
    }) => {
      const { error } = await supabase
        .from('mkt_instagram_contents')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useDeleteInstagramContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentId: _c }: { id: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_instagram_contents').delete().eq('id', id);
      if (error) throw new Error(error.message); // FK cascade removes cards
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useSetInstagramCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      igContentId,
      contentId: _c,
      cards,
    }: {
      igContentId: string;
      contentId: string;
      cards: InstagramCard[];
    }) => {
      const { error: delErr } = await supabase
        .from('mkt_instagram_cards')
        .delete()
        .eq('instagram_content_id', igContentId);
      if (delErr) throw new Error(delErr.message);
      if (cards.length > 0) {
        const { error: insErr } = await supabase
          .from('mkt_instagram_cards')
          .insert(cards as unknown as Record<string, unknown>[]);
        if (insErr) throw new Error(insErr.message);
      }
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useAddInstagramCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      igContentId,
      contentId: _c,
      sortOrder,
    }: {
      igContentId: string;
      contentId: string;
      sortOrder: number;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      // Blank slide: a default 4-block canvas (defaultCanvasData) is set by the panel
      // when it builds the row, but a bare blank is fine here (parseCanvasData fills defaults).
      const row = {
        id,
        user_id: userId,
        instagram_content_id: igContentId,
        text_content: null,
        background_color: null,
        background_image_url: null,
        text_style: null,
        image_prompt: null,
        reference_image_url: null,
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      };
      const { error } = await supabase
        .from('mkt_instagram_cards')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useUpdateInstagramCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      contentId: _c,
      updates,
    }: {
      cardId: string;
      contentId: string;
      updates: Partial<InstagramCard>;
    }) => {
      const { error } = await supabase
        .from('mkt_instagram_cards')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}

export function useDeleteInstagramCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, contentId: _c }: { cardId: string; contentId: string }) => {
      const { error } = await supabase.from('mkt_instagram_cards').delete().eq('id', cardId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) });
    },
  });
}
```
> **High-frequency note (O-D / R-5):** `useUpdateInstagramCard` is called on every text-block drag/resize/edit + every template tweak. The **panel** keeps the live canvas in local component state and routes persistence to **pointer-up** (for drag/resize) or a **500 ms debounce** (for text/number inputs) — see Chunk 3 §CardNewsCardItem and Chunk 4 §CardNewsPanel. The hook itself stays a plain whole-`text_style`-replacement mutation; do NOT add throttling inside the hook.
- [ ] **Step 4 (run):** test → PASS (3 cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-instagram-contents.ts packages/client/src/features/marketing/api/__tests__/use-instagram-contents.test.tsx
  git commit -m "feat(marketing): instagram content + card mutation hooks (1:N + setCards delete+insert)"
  ```

### Task 1.2: Threads contents + cards hooks (`api/use-threads-contents.ts`)

> Same surface for threads (spec §5.3-5.4). Ports `getThreadsContents/Cards`, `add/update/deleteThreadsContent`, `setThreadsCardsForContent`, `add/update/deleteThreadsCard`. `thread_type:'single'` default; `text_content` is `not null default ''` so blank cards insert `text_content:''`. Bulk-inserted cards carry `user_id`.

**Files:**
- Create: `packages/client/src/features/marketing/api/use-threads-contents.ts`
- Test: `packages/client/src/features/marketing/api/__tests__/use-threads-contents.test.tsx`

- [ ] **Step 1 (test):** Mirror Task 1.1's three tests against the threads tables: `useCreateThreadsContent` inserts `thread_type:'single'`+`user_id`+`status:'draft'` and returns the id; `useSetThreadsCards` deletes-all (`.eq('threads_content_id', …)`) then bulk-inserts + invalidates; empty skips insert. Use `mockFrom` from the shared harness.
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/api/__tests__/use-threads-contents`. Expected: FAIL.
- [ ] **Step 3 (impl):** Create `use-threads-contents.ts` with the seven hooks, structurally identical to Task 1.1 but for `mkt_threads_contents`/`mkt_threads_cards`. Key field differences:
  - `useCreateThreadsContent`: row = `{ id, user_id, content_id, title:null, thread_type:'single', status:'draft', published_url:null, published_at:null, created_at, updated_at, ...data }`.
  - `useAddThreadsCard({ threadsContentId, contentId, sortOrder })`: blank row = `{ id, user_id, threads_content_id, text_content:'', media_url:null, media_type:null, sort_order, created_at, updated_at }`; returns id.
  - `useSetThreadsCards({ threadsContentId, contentId, cards })`: `delete().eq('threads_content_id', threadsContentId)` then bulk-insert `cards`.
  - `useUpdateThreadsCard({ cardId, contentId, updates })`, `useDeleteThreadsCard({ cardId, contentId })`: by `id`.
  - `useUpdateThreadsContent`/`useDeleteThreadsContent`: by `id`.
  - **All** invalidate `mktKeys.content(contentId)`.
- [ ] **Step 4 (run):** test → PASS (3 cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-threads-contents.ts packages/client/src/features/marketing/api/__tests__/use-threads-contents.test.tsx
  git commit -m "feat(marketing): threads content + card mutation hooks (1:N + setCards delete+insert)"
  ```

### Task 1.3: Card-template hooks + new query keys (`api/use-card-templates.ts` + `queries.ts`)

> Templates live in their **own** tables (`mkt_card_templates` + `mkt_card_hidden_builtins`), NOT on the content graph — so this hook fetches+caches them under **two new query keys** (the only new keys in 1b, spec §5.6). Ports `cardTemplates`/`hiddenBuiltins`/`createCardTemplate`/`updateCardTemplate`/`deleteCardTemplate`/`hideBuiltinTemplate`. **Decision O-C: DO NOT port the CF localStorage→DB migration** (`cardnews-panel.tsx:153-187`) — those keys never existed in Tangobook (fresh DB, 0 rows live).

**Files:**
- Modify: `packages/client/src/features/marketing/api/queries.ts` (add 2 keys)
- Create: `packages/client/src/features/marketing/api/use-card-templates.ts`

- [ ] **Step 1 (impl — query keys):** In `queries.ts`, extend `mktKeys`:

```ts
export const mktKeys = {
  all: ['mkt'] as const,
  projects: () => ['mkt', 'projects'] as const,
  project: (id: string) => ['mkt', 'project', id] as const,
  contents: (projectId: string) => ['mkt', 'contents', projectId] as const,
  content: (id: string) => ['mkt', 'content', id] as const,
  cardTemplates: (projectId: string) => ['mkt', 'card-templates', projectId] as const,
  cardHiddenBuiltins: (projectId: string) => ['mkt', 'card-hidden-builtins', projectId] as const,
};
```
- [ ] **Step 2 (impl — hooks):** Create `use-card-templates.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { mktKeys } from './queries';
import { generateId } from '../lib/utils';
import type { CardTemplateRow } from '../types/database';

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

export function useCardTemplates(projectId: string | null) {
  return useQuery({
    queryKey: mktKeys.cardTemplates(projectId ?? ''),
    queryFn: async (): Promise<CardTemplateRow[]> => {
      const { data, error } = await supabase
        .from('mkt_card_templates')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at');
      if (error) throw new Error(error.message);
      return (data ?? []) as CardTemplateRow[];
    },
    enabled: Boolean(projectId),
  });
}

export function useHiddenBuiltins(projectId: string | null) {
  return useQuery({
    queryKey: mktKeys.cardHiddenBuiltins(projectId ?? ''),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('mkt_card_hidden_builtins')
        .select('builtin_id')
        .eq('project_id', projectId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => (r as { builtin_id: string }).builtin_id);
    },
    enabled: Boolean(projectId),
  });
}

export function useCreateCardTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: Omit<CardTemplateRow, 'id' | 'project_id' | 'created_at' | 'updated_at'>;
    }): Promise<string> => {
      const userId = await getUserId();
      const id = generateId();
      const now = new Date().toISOString();
      const row = {
        id,
        user_id: userId,
        project_id: projectId,
        created_at: now,
        updated_at: now,
        ...data,
      };
      const { error } = await supabase
        .from('mkt_card_templates')
        .insert(row as unknown as Record<string, unknown>);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (_id, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.cardTemplates(projectId) });
    },
  });
}

export function useUpdateCardTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      projectId: _p,
      updates,
    }: {
      id: string;
      projectId: string;
      updates: Partial<CardTemplateRow>;
    }) => {
      const { error } = await supabase
        .from('mkt_card_templates')
        .update({ ...updates, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.cardTemplates(projectId) });
    },
  });
}

export function useDeleteCardTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId: _p }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('mkt_card_templates').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.cardTemplates(projectId) });
    },
  });
}

export function useHideBuiltin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, builtinId }: { projectId: string; builtinId: string }) => {
      const userId = await getUserId();
      const now = new Date().toISOString();
      const row = {
        id: generateId(),
        user_id: userId,
        project_id: projectId,
        builtin_id: builtinId,
        hidden_at: now,
      };
      // unique (project_id, builtin_id) — ignore duplicate insert conflicts
      const { error } = await supabase
        .from('mkt_card_hidden_builtins')
        .insert(row as unknown as Record<string, unknown>);
      if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
    },
    onSuccess: (_v, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: mktKeys.cardHiddenBuiltins(projectId) });
    },
  });
}
```
> No TDD here (thin CRUD + a query; mirrors patterns already tested in 1a). Typecheck-only.
- [ ] **Step 3 (typecheck):** `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/api/use-card-templates.ts packages/client/src/features/marketing/api/queries.ts
  git commit -m "feat(marketing): card-template hooks (custom + hidden built-ins) + 2 new query keys"
  ```

### Task 1.4: (Optional) recommended perf indexes migration

> Non-blocking; correctness does not depend on it (the graph fetch already `.order('sort_order')`s the cards, `queries.ts:111-124`). Both indexes are confirmed ABSENT from the Phase 0 + Phase 1a index migrations (spec §4.6) — verify before adding so it is not a duplicate. **Add only if profiling warrants.**

**Files:**
- Create: `supabase/migrations/2026-06-07-marketing-phase1b-indexes.sql` (record for source control)
- Apply via `mcp__supabase__apply_migration` (project ref `fxzwigjkbsptvsjraqwa`)

- [ ] **Step 1 (verify absent):** `mcp__supabase__list_tables` / inspect existing migrations to confirm neither index exists.
- [ ] **Step 2 (author + apply, if proceeding):**

```sql
-- Phase 1b optional perf indexes (non-blocking)
create index if not exists mkt_instagram_cards_parent_sort
  on mkt_instagram_cards(instagram_content_id, sort_order);
create index if not exists mkt_threads_cards_parent_sort
  on mkt_threads_cards(threads_content_id, sort_order);
```
Apply via MCP `apply_migration` (name `marketing_phase1b_indexes`).
- [ ] **Step 3 (advisors):** `mcp__supabase__get_advisors` (security) → no new warnings (no SECURITY DEFINER functions added).
- [ ] **Step 4:** Commit the recorded SQL:
  ```bash
  git add supabase/migrations/2026-06-07-marketing-phase1b-indexes.sql
  git commit -m "feat(marketing): optional perf indexes (instagram/threads cards parent+sort)"
  ```

### Task 1.5: Batch-image job store (`store/batch-image-store.ts`)

> Port of CF `stores/batch-image-store.ts` (149 lines). CF's batch store is a **module-level Zustand** running a long-lived sequential image-gen loop keyed by `igContentId`, so an in-flight batch **survives tab switches** (CF comment `cardnews-panel.tsx:25-27`). It is the right model — port it as Zustand, re-bridging the two CF couplings (spec §5.5, O-E, R-3):
>
> | CF (`batch-image-store.ts`) | Phase 1b port |
> |---|---|
> | `import { convertToWebpBlob, uploadToR2 } from '@/hooks/use-r2-upload'` (:2) | `import { convertToWebpBlob } from '../lib/image-utils'` + `import { uploadToR2 } from '../api/use-r2-upload'` |
> | `fetch('/api/ai/generate-image', …)` (:69), reads `data.image`/`data.mimeType` | `fetch('/api/mkt/ai/generate-image', …)`; response is `{ success, data:{ image } }` → read `json.data.image`, mime `'image/png'` (matches `use-image-generation.ts`) |
> | `useProjectStore.getState().getInstagramCards(igContentId)[slideIndex]` (:86-89) — **cannot read the TanStack cache from a plain store** | inject `cardIdsByIndex: string[]` (slideIndex → cardId snapshot) into `startJob` |
> | `store.updateInstagramCard(card.id, { background_image_url })` (:107) | call the injected `onSaved(cardId, savedUrl)` (a `useUpdateInstagramCard().mutateAsync` closure passed at call time) |
>
> **This is the one legitimate Zustand-holds-state exception: it stores job/progress state, NOT the server cache.** Results land in the TanStack cache via `onSaved` → `invalidateQueries`. This does **not** violate the "Zustand = UI only" rule.

**Files:**
- Create: `packages/client/src/features/marketing/store/batch-image-store.ts`
- Test: `packages/client/src/features/marketing/store/__tests__/batch-image-store.test.ts`

- [ ] **Step 1 (test — reducer + selector with fetch/onSaved mocked):** Test that `startJob` walks the prompts, calls `onSaved(cardId, url)` per slide using `cardIdsByIndex`, transitions `isRunning` true→false, and that `selectBatchProgress` returns the `EMPTY` sentinel for unknown ids. Mock `fetch` (returns `{ success, data:{ image } }`) and stub `convertToWebpBlob`/`uploadToR2` via `vi.mock`.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/image-utils', () => ({
  convertToWebpBlob: vi.fn().mockResolvedValue({ blob: new Blob(['x']), mimeType: 'image/webp' }),
}));
vi.mock('../../api/use-r2-upload', () => ({
  uploadToR2: vi.fn().mockResolvedValue({ publicUrl: 'https://r2/img.webp', key: 'k' }),
}));

import { useBatchImageStore, selectBatchProgress } from '../batch-image-store';

describe('batch-image-store', () => {
  beforeEach(() => {
    useBatchImageStore.setState({ jobs: {}, controllers: {} });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { image: 'BASE64' } }),
      })
    );
  });

  it('runs the job, saves each slide via onSaved, and ends with isRunning=false', async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    await useBatchImageStore.getState().startJob({
      igContentId: 'ig-1',
      prompts: [
        { prompt: 'a', aspectRatio: '4:5', slideIndex: 0 },
        { prompt: 'b', aspectRatio: '4:5', slideIndex: 1 },
      ],
      cardIdsByIndex: ['card-0', 'card-1'],
      imageModel: 'm',
      projectId: 'p-1',
      onSaved,
    });
    expect(onSaved).toHaveBeenCalledWith('card-0', 'https://r2/img.webp');
    expect(onSaved).toHaveBeenCalledWith('card-1', 'https://r2/img.webp');
    // After completion the job flips isRunning=false (cleanup happens 3s later via setTimeout).
    const job = useBatchImageStore.getState().jobs['ig-1'];
    expect(job?.isRunning).toBe(false);
  });

  it('selectBatchProgress returns EMPTY for an unknown id', () => {
    const p = selectBatchProgress('nope')(useBatchImageStore.getState());
    expect(p).toEqual({ current: 0, total: 0, currentSlideIndex: -1, isRunning: false });
  });

  it('does not start a second job while one is running', async () => {
    useBatchImageStore.setState({
      jobs: { 'ig-1': { current: 0, total: 3, currentSlideIndex: 0, isRunning: true } },
    });
    const onSaved = vi.fn();
    await useBatchImageStore.getState().startJob({
      igContentId: 'ig-1',
      prompts: [{ prompt: 'a', aspectRatio: '4:5', slideIndex: 0 }],
      cardIdsByIndex: ['card-0'],
      imageModel: 'm',
      projectId: 'p-1',
      onSaved,
    });
    expect(onSaved).not.toHaveBeenCalled();
  });
});
```
> The 3 s self-cleanup `setTimeout` is left real (the test asserts `isRunning:false` immediately after `startJob` resolves, before cleanup). If a test runner flakes on the dangling timer, wrap with `vi.useFakeTimers()` and `vi.runOnlyPendingTimers()` at the end — but the default real-timer assertion above is deterministic since `startJob` awaits the loop fully before scheduling cleanup.
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/store/__tests__/batch-image-store`. Expected: FAIL (module not found).
- [ ] **Step 3 (impl):** Create `store/batch-image-store.ts`, porting CF verbatim with the four bridges applied. Keep CF's per-slide loop, `AbortController` per job, the implicit pacing via sequential awaits, the data-URL fallback on R2 failure (`:91-105`), the `updateProgress` setter, and the `setTimeout(…,3000)` self-cleanup (`:121-130`).

```ts
import { create } from 'zustand';
import { convertToWebpBlob } from '../lib/image-utils';
import { uploadToR2 } from '../api/use-r2-upload';

export interface BatchJobProgress {
  current: number;
  total: number;
  currentSlideIndex: number;
  isRunning: boolean;
}

export interface StartJobArgs {
  igContentId: string;
  prompts: { prompt: string; aspectRatio: string; slideIndex: number }[];
  /** slideIndex → cardId snapshot (replaces CF's useProjectStore card read). */
  cardIdsByIndex: string[];
  imageModel: string;
  projectId: string;
  /** Bridge to useUpdateInstagramCard — persists the saved URL into the TanStack cache. */
  onSaved: (cardId: string, url: string) => void | Promise<void>;
}

interface BatchState {
  jobs: Record<string, BatchJobProgress>;
  controllers: Record<string, AbortController>;
  startJob: (args: StartJobArgs) => Promise<void>;
  abortJob: (igContentId: string) => void;
  getJob: (igContentId: string) => BatchJobProgress | undefined;
}

const EMPTY: BatchJobProgress = {
  current: 0,
  total: 0,
  currentSlideIndex: -1,
  isRunning: false,
};

export const useBatchImageStore = create<BatchState>()((set, get) => ({
  jobs: {},
  controllers: {},

  getJob: (igContentId) => get().jobs[igContentId],

  startJob: async ({ igContentId, prompts, cardIdsByIndex, imageModel, projectId, onSaved }) => {
    if (get().jobs[igContentId]?.isRunning) return;

    const controller = new AbortController();
    set((s) => ({
      jobs: {
        ...s.jobs,
        [igContentId]: { current: 0, total: prompts.length, currentSlideIndex: -1, isRunning: true },
      },
      controllers: { ...s.controllers, [igContentId]: controller },
    }));

    const updateProgress = (patch: Partial<BatchJobProgress>) => {
      set((s) => {
        const existing = s.jobs[igContentId];
        if (!existing) return s;
        return { jobs: { ...s.jobs, [igContentId]: { ...existing, ...patch } } };
      });
    };

    for (let i = 0; i < prompts.length; i++) {
      if (controller.signal.aborted) break;
      const p = prompts[i];
      updateProgress({ current: i, currentSlideIndex: p.slideIndex });

      const cardId = cardIdsByIndex[p.slideIndex];
      if (!cardId) continue;

      try {
        const res = await fetch('/api/mkt/ai/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: p.prompt, model: imageModel, aspectRatio: p.aspectRatio }),
          signal: controller.signal,
        });
        if (!res.ok) {
          console.warn(`[batch] Slide ${i + 1} HTTP ${res.status}`);
          continue;
        }
        const json = (await res.json()) as { success?: boolean; data?: { image?: string } };
        const base64 = json.data?.image;
        if (!json.success || !base64) continue;

        let savedUrl = `data:image/png;base64,${base64}`;
        try {
          const { blob } = await convertToWebpBlob(base64, 'image/png');
          const { publicUrl } = await uploadToR2(blob, {
            projectId,
            category: 'images',
            fileName: `${cardId}.webp`,
            contentType: 'image/webp',
            contentId: cardId,
          });
          savedUrl = publicUrl;
        } catch {
          /* keep data URL fallback */
        }

        await onSaved(cardId, savedUrl);
      } catch (err) {
        if ((err as Error).name === 'AbortError') break;
        console.warn(`[batch] Slide ${i + 1} error:`, (err as Error).message);
      }
    }

    updateProgress({ current: prompts.length, currentSlideIndex: -1, isRunning: false });

    setTimeout(() => {
      set((s) => {
        if (s.jobs[igContentId]?.isRunning) return s;
        const { [igContentId]: _removed, ...rest } = s.jobs;
        const { [igContentId]: _c, ...restCtrls } = s.controllers;
        void _removed;
        void _c;
        return { jobs: rest, controllers: restCtrls };
      });
    }, 3000);
  },

  abortJob: (igContentId) => {
    get().controllers[igContentId]?.abort();
    set((s) => {
      const { [igContentId]: _removed, ...rest } = s.jobs;
      const { [igContentId]: _c, ...restCtrls } = s.controllers;
      void _removed;
      void _c;
      return { jobs: rest, controllers: restCtrls };
    });
  },
}));

export function selectBatchProgress(igContentId: string) {
  return (s: BatchState): BatchJobProgress => s.jobs[igContentId] ?? EMPTY;
}
```
- [ ] **Step 4 (run):** test → PASS (3 cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/store/batch-image-store.ts packages/client/src/features/marketing/store/__tests__/batch-image-store.test.ts
  git commit -m "feat(marketing): batch-image Zustand job store (cardIdsByIndex + onSaved bridge, O-E/R-3)"
  ```

---

## Chunk 2: Threads (simpler — ships before cardnews)

> Threads is the lower-risk port (no Canvas, no pointer math): a vertical post-card list with a 500-char counter, per-post image via the `media_type`-as-prompt quirk, `[n/total]` 전체 복사, and a phone-style preview. UI is interaction-light but still mostly verbatim JSX → **port → typecheck → manual-verify → commit**. Reuses the Phase 1a AI/image hooks (cardId-based, §7) + threads hooks (Chunk 1).

### Task 2.1: `ThreadsPreviewDialog.tsx` ← `threads-preview-dialog.tsx` (113 lines)

> Phone-style thread preview (avatar + connector + body + reaction icons + per-post char count) with a "텍스트 복사" footer using the same `[n/total]` join. Verbatim port.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/ThreadsPreviewDialog.tsx`

- [ ] **Step 1 (port):** Copy CF `threads-preview-dialog.tsx`. Props `{ open; onOpenChange; cards: ThreadsCard[] }`. Rewire `Dialog`/`Button` to `../../ui/*`, `ThreadsCard` type to `../../types/database`. Replace the `next/image`-flavored `<img>` + `@next/next/no-img-element` eslint-disable with a plain `<img>`. Drop `'use client'`. Keep the internal `ThreadsPostPreview` sub-component, the reaction icons (`Heart,MessageCircle,Repeat2,Send`), the `[${i+1}/${cards.length}]\n${text}` join joined by `\n\n---\n\n`, and the "복사됨!" 2 s toggle.
- [ ] **Step 2 (R-1 icon check):** confirm `Copy,Check,Heart,MessageCircle,Repeat2,Send` resolve at `lucide-react@^1.17.0` (the build fails fast on a missing export); substitute any renamed icon. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 3:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/ThreadsPreviewDialog.tsx
  git commit -m "feat(marketing): port ThreadsPreviewDialog (phone-style preview + [n/total] copy)"
  ```

### Task 2.2: `ThreadsCardItem.tsx` ← `threads-card-item.tsx` (177 lines)

> One post = numbered avatar + connector line + auto-resize textarea (500-char counter, over-limit red) + media slot (zoom/remove via `ImageLightbox`) + collapsible "이미지 첨부" prompt + generate button. Also exports `AddPostButton`. **Port the `media_type`-as-prompt quirk faithfully** (R-4, §4.5): the "이미지 생성" button sets `media_type:imagePrompt` then calls `onGenerateImage(card.id)`; the panel's image hook reads `card.media_type` as the prompt, then overwrites `media_type:'image'` on success.

**Files:**
- Create: `packages/client/src/features/marketing/components/content/ThreadsCardItem.tsx`

- [ ] **Step 1 (port):** Copy CF `threads-card-item.tsx`. Props `{ card: ThreadsCard; index; isLast; onUpdate(cardId, updates); onDelete(cardId); onGenerateImage?(cardId); isGeneratingImage?; generatingCardId? }`. Rewire `Button`/`Textarea` → `../../ui/*`, `ImageLightbox` → `./ImageLightbox`, `ThreadsCard` → `../../types/database`, `cn` → `../../lib/utils`. Replace the media `<img>` (`@next/next/no-img-element`) with a plain `<img>`. Drop `'use client'`. Keep: `MAX_CHARS=500`, the auto-resize `useEffect` (sets `ta.style.height='auto'` then `scrollHeight`), the over-limit red counter, the local `imagePrompt` state + `showPrompt` toggle, the **quirk** `onClick={() => { onUpdate(card.id, { media_type: imagePrompt }); onGenerateImage?.(card.id); }}`, the media remove `onUpdate({ media_url:null, media_type:null })`, and `AddPostButton`. The `GripVertical` drag handle is **decorative only** (no reorder wired in 1b — matches CF).
- [ ] **Step 2 (O-F — text persistence note):** CF writes `onUpdate(card.id, { text_content })` on **every keystroke** (`threads-card-item.tsx:81`). Keep that wiring as-is in the card item (it calls `onUpdate`); the **debounce lives in the panel's `onUpdate` handler** (Task 2.3, O-F) so post typing coalesces. Do NOT add a debounce inside the card item — keep it a controlled textarea calling `onUpdate` per keystroke.
- [ ] **Step 3 (R-1 icon check):** confirm `GripVertical,Trash2,Plus,ImageIcon,Wand2,X,Loader2,ChevronDown,ZoomIn` resolve at `^1.17.0`; substitute if renamed. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 4:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/ThreadsCardItem.tsx
  git commit -m "feat(marketing): port ThreadsCardItem + AddPostButton (500-char counter, media_type-as-prompt quirk R-4)"
  ```

### Task 2.3: `ThreadsPanel.tsx` ← `threads-panel.tsx` (281 lines) + wire into ContentTabs

> Outer = `ChannelModelSelector` (with `showImageModel`) + `ChannelContentList<ThreadsContent>`; inner = action bar (AI gen / 미리보기 / 전체 복사) + post list + AddPostButton + dialogs. **Adapt the `useCardImageGeneration` cardId-based API (§7)** and the `useChannelModels` 1-arg `setChannelModels` signature. **Omit `onAddToQueue`/`publishChannels`** (Phase 3) and **do NOT mount `ChannelTranslationView`** (1d).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/ThreadsPanel.tsx`
- Modify: `packages/client/src/features/marketing/components/content/ContentTabs.tsx`

- [ ] **Step 1 (port outer/inner):** Copy CF `threads-panel.tsx`. Mirror CF's outer/inner split, but rewire to Tangobook:
  - **Outer `ThreadsPanel({ content, project })`** (signature matches the 1a panels, mounted by `ContentTabs` as `<ThreadsPanel content={content} project={project} />`). Read `threadsContents` from `useContent(content.id).data?.threadsContents ?? []`. `useChannelModels(project.id, 'threads')` → `{ models, setChannelModels }`.
    - `<ChannelModelSelector textModel={models.textModel} imageModel={models.imageModel} showImageModel aspectRatio={models.aspectRatio} imageStyle={models.imageStyle} defaultAspectRatio="1:1" onTextModelChange={(m)=>setChannelModels({textModel:m})} onImageModelChange={(m)=>setChannelModels({imageModel:m})} onAspectRatioChange={(r)=>setChannelModels({aspectRatio:r})} onImageStyleChange={(s)=>setChannelModels({imageStyle:s})} />` — **note the 1-arg `setChannelModels(updates)`** (project+channel bound at hook creation; CF passed 3 args, §5.7).
    - `<ChannelContentList<ThreadsContent> items={threadsContents} getId={i=>i.id} getTitle={(item)=>item.title || '스레드'} onTitleChange={(id,title)=>updateThreadsContent.mutate({id,contentId:content.id,updates:{title}})} onAdd={()=>useCreateThreadsContent().mutateAsync({contentId:content.id})} onDelete={(id)=>deleteThreadsContent.mutate({id,contentId:content.id})} addLabel="새 스레드 추가" accentColor="bg-indigo-600 hover:bg-indigo-700" renderContent={(tc)=><ThreadsPanelInner ... />} />` — **1-arg `getTitle`** (R-6: the ported `ChannelContentList.getTitle` is `(item)=>string`; CF passed `(item,index)`; either use `item.title || '스레드'` or compute the index from `threadsContents.indexOf` inside the render). **No `onAddToQueue`/`publishChannels`.** `hasBaseArticle = Boolean(useContent(content.id).data?.baseArticle)`.
  - **Inner `ThreadsPanelInner({ threadsContent, content, project, hasBaseArticle, channelModels })`**: `const cards = threadsContent.cards;` (from the graph slice). Keep `localCards` mirror state (like `BlogPanel`) so the AI-gen build + per-keystroke edits update the UI before the graph refetch lands. Hooks: `useSetThreadsCards`, `useUpdateThreadsCard`, `useDeleteThreadsCard`, `useAddThreadsCard`.
    - **AI gen** (`buildThreadsPrompt`, `../../lib/prompt-builder`): `useAiGeneration({ onComplete })`; parse `fullText.match(/\{[\s\S]*\}/)` → `{ posts: {text,order}[] }`; sort by `order`; build `ThreadsCard[]` (`text_content`, `media_url:null`, `media_type:null`, `sort_order:i`) **stamped with `id`+`user_id`+timestamps** (R-9 — get `user_id` via `supabase.auth.getUser()`, mirror `BlogPanel.tsx:196-217`); `setLocalCards(newCards)`; `useSetThreadsCards.mutateAsync({ threadsContentId, contentId: content.id, cards: newCards })`. On parse failure → `alert('스레드 포스트 파싱 실패. 다시 시도해 주세요.')` (CF :75). Open `PromptEditDialog` before streaming (`handleGenerate` builds the prompt → `setGeneratedPrompt` → `setShowPromptDialog(true)`; `handleStartGeneration(prompt)` → `generate(prompt, channelModels.textModel)`).
    - **Per-post image gen (§7 adaptation):** `useCardImageGeneration({ getPrompt:(cardId)=>{ const c = localCards.find(x=>x.id===cardId); const base = c?.media_type || 'Professional photo related to the post content'; return channelModels.imageStyle ? `${channelModels.imageStyle}. ${base}` : base; }, getModel:()=>channelModels.imageModel, getAspectRatio:()=>channelModels.aspectRatio || '1:1', onSave:(cardId,url)=>{ setLocalCards(prev=>prev.map(c=>c.id===cardId?{...c,media_url:url,media_type:'image'}:c)); return updateThreadsCard.mutateAsync({ cardId, contentId: content.id, updates:{ media_url:url, media_type:'image' } }); }, projectId: project.id })`. Per-post button → `generateForCard(cardId)` (threads has **no batch button** → do NOT use `generateAll`). Return flags `{ isGenerating, ... }`; the card item's `isGeneratingImage`/`generatingCardId` map from these (CF passed `isGeneratingImage`+`generatingCardId`; the ported hook exposes `isGenerating` + tracks the in-flight card via its own progress — pass `isGeneratingImage={isGenerating}` and track the active cardId in panel state set right before `generateForCard`).
    - **전체 복사** (CF :126-133): `const allText = localCards.map((c,i)=>`[${i+1}/${localCards.length}]\n${c.text_content}`).join('\n\n---\n\n'); await navigator.clipboard.writeText(allText); setCopied(true); setTimeout(()=>setCopied(false),2000);`.
    - **O-F text-edit debounce:** the inner's `handleCardUpdate(cardId, updates)` updates `localCards` immediately; for `text_content` edits route persistence through a ~400 ms debounce (a local `useRef<timer>` per cardId, or `useDebouncedSave('mkt_threads_cards', cardId)` for save-status reporting) → `updateThreadsCard.mutate(...)`. Structure changes (image set/remove via `media_url`/`media_type`, add/delete) persist immediately (direct mutations). **Decision O-F.**
    - Render `ThreadsCardItem` per card + `AddPostButton` (→ `useAddThreadsCard.mutateAsync({ threadsContentId, contentId: content.id, sortOrder: localCards.length })`), `PromptEditDialog`, `ThreadsPreviewDialog`.
- [ ] **Step 2 (wire ContentTabs):** In `ContentTabs.tsx`: import `ThreadsPanel`; flip the `threads` entry in `TABS` from `active:false` → `active:true`; replace the `threads` `TabsContent` body `<ComingSoonPanel label="스레드" />` with `<ThreadsPanel content={content} project={project} />`. **Keep `cardnews` placeholder for now** (Chunk 4 replaces it). **Do NOT touch `KO_ONLY_TABS`** — threads is NOT ko-only (it supports translation in 1d; it stays visible for non-ko, unlike `blog`).
- [ ] **Step 3 (R-1 + typecheck):** confirm `Loader2,Copy,Check,Eye` (panel) resolve at `^1.17.0`. `pnpm --filter client typecheck` → PASS. Confirm no `useProjectStore`/`addToPublishQueue`/`ChannelTranslationView`/`/api/storage` (non-mkt) references remain.
- [ ] **Step 4 (manual-verify @superpowers:verification-before-completion):** `pnpm dev`; `/marketing/content`; select a content with a base article → 스레드 tab → 새 스레드 추가 → "AI 생성" (PromptEditDialog → posts populate) → edit a post (counter updates, textarea auto-resizes, debounced save: TopBar `SaveStatusIndicator` transitions) → "이미지 첨부" → enter a prompt → "이미지 생성" (image appears, `media_type`→`'image'`) → 미리보기 (phone dialog) → 전체 복사 (clipboard has `[1/N]…---…` separators) → reload restores posts. Confirm non-ko language: threads tab **stays visible**.
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/ThreadsPanel.tsx packages/client/src/features/marketing/components/content/ContentTabs.tsx
  git commit -m "feat(marketing): ThreadsPanel (AI gen, per-post image, 전체 복사) + wire threads tab"
  ```

---

## Chunk 3: Cardnews canvas (`CardNewsCardItem` + templates)

> The Canvas slide editor: 4:5 `CardCanvas` (bg color + full-width image with vertical `imageY` drag + absolutely-positioned `TextBlock`s with custom **PointerEvent** drag/resize + grid-snap), per-card controls, `TextBlockEditor`, paste/drop, image-prompt textarea. Plus the 8 built-in templates. The pure helpers (`parseCanvasData`/`snapToGrid`/`clamp`/`isBgLight`/`defaultCanvasData`) get unit tests (TDD); the Canvas/pointer parts use build→typecheck→manual.

### Task 3.1: `cardnews-templates.ts` ← `cardnews-templates.ts` (114 lines)

> `CardTemplate` interface + `CARD_TEMPLATES` (8 built-ins: 클린 센터 / 다크 모던 / 미니멀 / 매거진 / 볼드 다크 / 포토 커버 / 스텝 카드 / 브랜드 카드). Pure data — kept camelCase (matches the `lib/*` data-module convention; spec §6.6).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/cardnews-templates.ts`
- Test: `packages/client/src/features/marketing/components/content/__tests__/cardnews-templates.test.ts`

- [ ] **Step 1 (test):** assert the 8 built-ins are present with the expected ids + each has a valid `preview` (`{ bg, textColor }`) and a non-empty `textBlocks`.

```ts
import { describe, it, expect } from 'vitest';
import { CARD_TEMPLATES } from '../cardnews-templates';

const EXPECTED_IDS = ['clean-center','dark-modern','minimal','magazine','bold-dark','photo-cover','step-card','brand-card'];

describe('CARD_TEMPLATES', () => {
  it('ships exactly the 8 built-ins with the expected ids', () => {
    expect(CARD_TEMPLATES.map((t) => t.id)).toEqual(EXPECTED_IDS);
  });
  it('each template has a preview and non-empty textBlocks', () => {
    for (const t of CARD_TEMPLATES) {
      expect(typeof t.preview.bg).toBe('string');
      expect(typeof t.preview.textColor).toBe('string');
      expect(t.textBlocks.length).toBeGreaterThan(0);
    }
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/components/content/__tests__/cardnews-templates`. Expected: FAIL.
- [ ] **Step 3 (impl):** Copy CF `cardnews-templates.ts` **verbatim** (the full `CARD_TEMPLATES` array, all 8). **Change only the `TextBlock` import**: CF imports from `./cardnews-card-item` (`:1`); in Tangobook import from `../../types/cards`: `import type { TextBlock } from '../../types/cards';`. Keep the `CardTemplate` interface (`{ id, name, bgColor, textBlocks: Omit<TextBlock,'text'>[], imageY, preview:{bg,textColor} }`).
- [ ] **Step 4 (run):** test → PASS (2 cases).
- [ ] **Step 5:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/cardnews-templates.ts packages/client/src/features/marketing/components/content/__tests__/cardnews-templates.test.ts
  git commit -m "feat(marketing): port cardnews-templates (8 built-ins, TextBlock from types/cards)"
  ```

### Task 3.2: `CardNewsCardItem.tsx` ← `cardnews-card-item.tsx` (592 lines) — pure helpers first (TDD)

> Extract+test the pure helpers first, then port the Canvas/pointer component. The helpers (`parseCanvasData`/`snapToGrid`/`clamp`/`isBgLight`/`defaultCanvasData`) are exported named (the panel + `canvas-export` import `parseCanvasData`).

**Files:**
- Create: `packages/client/src/features/marketing/components/content/CardNewsCardItem.tsx`
- Test: `packages/client/src/features/marketing/components/content/__tests__/CardNewsCardItem.helpers.test.ts`

- [ ] **Step 1 (test — pure helpers):** Write `CardNewsCardItem.helpers.test.ts` against the named exports:

```ts
import { describe, it, expect } from 'vitest';
import { parseCanvasData, snapToGrid, clamp, isBgLight, defaultCanvasData } from '../CardNewsCardItem';

describe('snapToGrid', () => {
  it('snaps to the nearest 10 within SNAP_THRESHOLD(4)', () => {
    expect(snapToGrid(12)).toBe(10); // |12-10|=2 < 4
    expect(snapToGrid(48)).toBe(50); // |48-50|=2 < 4
  });
  it('leaves a value outside the threshold unchanged', () => {
    expect(snapToGrid(15)).toBe(15); // |15-10|=5 and |15-20|=5, both >= 4
  });
});

describe('clamp', () => {
  it('clamps within bounds', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe('isBgLight', () => {
  it('treats white as light and near-black as dark', () => {
    expect(isBgLight('#ffffff')).toBe(true);
    expect(isBgLight('#18181b')).toBe(false);
  });
  it('treats a short/invalid hex as light (fallback)', () => {
    expect(isBgLight('#fff')).toBe(true);
  });
});

describe('defaultCanvasData', () => {
  it('returns 4 blocks (header/title/body/footer), dark bg, imageY 50', () => {
    const d = defaultCanvasData();
    expect(d.textBlocks.map((b) => b.id)).toEqual(['header', 'title', 'body', 'footer']);
    expect(d.bgColor).toBe('#18181b');
    expect(d.imageY).toBe(50);
    expect(d.imageUrl).toBeNull();
  });
});

describe('parseCanvasData', () => {
  it('returns defaults (+imageUrl) when text_style is null', () => {
    const d = parseCanvasData(null, 'https://img');
    expect(d.textBlocks).toHaveLength(4);
    expect(d.imageUrl).toBe('https://img');
  });
  it('passes through the new array format and overrides imageUrl when provided', () => {
    const existing = { bgColor: '#000', imageUrl: 'old', imageY: 30, textBlocks: [{ id: 'title', text: 'Hi', x: 10, y: 20, fontSize: 28, color: '#fff', fontWeight: 'bold', textAlign: 'left', width: 80 }] };
    const d = parseCanvasData(existing as any, 'new');
    expect(d.imageUrl).toBe('new');
    expect(d.textBlocks[0].text).toBe('Hi');
  });
  it('migrates the legacy flat shape into 4 blocks', () => {
    const legacy = { title: 'Old Title', body: 'Old Body', bgColor: '#111111', textAlign: 'center' };
    const d = parseCanvasData(legacy as any, null);
    const title = d.textBlocks.find((b) => b.id === 'title');
    const body = d.textBlocks.find((b) => b.id === 'body');
    expect(d.textBlocks).toHaveLength(4);
    expect(title?.text).toBe('Old Title');
    expect(body?.text).toBe('Old Body');
    expect(title?.textAlign).toBe('center');
    expect(d.bgColor).toBe('#111111');
  });
});
```
- [ ] **Step 2 (run):** `pnpm --filter client test marketing/components/content/__tests__/CardNewsCardItem.helpers`. Expected: FAIL (module not found).
- [ ] **Step 3 (port the component + helpers):** Copy CF `cardnews-card-item.tsx` → `CardNewsCardItem.tsx`. Rewire imports: `Button`/`Textarea` → `../../ui/*`, `cn`/`generateId` → `../../lib/utils`, `InstagramCard` → `../../types/database`, `TextBlock`/`CardCanvasData` → `../../types/cards`. **Replace the CF re-export line** (`export type { TextBlock, CardCanvasData } from '@/types/cards'` :9) with `export type { TextBlock, CardCanvasData } from '../../types/cards';` (same effect). Drop `'use client'`; replace the two `<img>` `@next/next/no-img-element` disables with plain `<img>`. Port **verbatim**:
  - **Pure helpers** (the unit-tested ones): `snapToGrid` (`GRID_SIZE=10`, `SNAP_THRESHOLD=4`, :18-21), `clamp` (:23-25), `defaultCanvasData` (:27-39), `parseCanvasData` (legacy-flat→4-block migration, :41-68), `isBgLight` (luminance, :70-77). **Export all five named** (they are already at module scope in CF; add `export` to `snapToGrid`/`clamp`/`isBgLight` which CF kept private — the tests import them).
  - **`CardCanvas`** + `GridGuides` (:81-360): the **PointerEvent** interactions verbatim — `handleBlockPointerDown` (text-block drag: `dx/dy` as % of container rect → `snapToGrid(clamp(...))` → `onUpdateBlock`, :120-145), `handleImagePointerDown` (Y-only image drag → `onUpdateCanvas({imageY})`, :148-171), `handleResizePointerDown` (bottom-right corner → width/height %, :174-205). All attach `window` `pointermove`/`pointerup` and clean up on up. Keep paste/drop (`FileReader`→data-URL→`onUpdateCanvas({imageUrl})`, :207-244) and the index badge + delete button.
  - **`TextBlockEditor`** (:364-422): textarea + font-size/color/bold/shadow/align/width controls. Verbatim.
  - **Main `CardNewsCardItem`** (:437-576): `canvasData = parseCanvasData(card.text_style, card.background_image_url)`; `saveCanvas` (merges `Partial<CardCanvasData>` → writes `text_style` + syncs `background_image_url`/`background_color`/`text_content` newline-joined, :443-457); `updateBlock`/`deleteBlock`/`addBlock`; per-card controls (bg color, +텍스트, 업로드, 저장-download, 이미지-remove, AI 생성); the **image-prompt textarea** reads/writes `card.image_prompt` via `onUpdate(card.id, { image_prompt })` (:565-572). Props `{ card; index; onUpdate(cardId, updates); onDelete(cardId); onGenerateImage?(); isGeneratingImage?; isSelected?; onSelect?() }`.
  - **`AddSlideButton`** (:580-591). Export named.
  > **Note on the per-card "저장" download button** (CF :516-531): it `fetch()`es `canvasData.imageUrl` then downloads; for an R2 URL a default-mode `fetch` is **blocked by CORS** (memory table) and CF falls back to `window.open`. With R-0 (Chunk 0 CORS) fixed this `fetch` succeeds; the `catch { window.open(...) }` fallback stays. **Leave this button as the CF port** (it's a per-card convenience; the panel's "다운로드" uses `renderCardToBlob` which is the canonical, proxy-fallback export).
  > **O-D persistence note:** `CardNewsCardItem` calls `onUpdate`/`saveCanvas` on **every** pointer-move during a drag (CF does this). The **panel's `onUpdate` wrapper** (Task 4.x) keeps these writes in local state and persists on pointer-up / 500 ms debounce. The card item is unchanged from CF — do not add throttling here; the panel routes persistence.
- [ ] **Step 4 (run):** `pnpm --filter client test marketing/components/content/__tests__/CardNewsCardItem.helpers`. Expected: PASS (all helper cases).
- [ ] **Step 5 (R-1 + typecheck):** confirm `Trash2,Plus,ChevronDown,Loader2,Type,Upload,Download,Bold,AlignLeft,AlignCenter,AlignRight,AlignJustify` resolve at `^1.17.0`; substitute if renamed. `pnpm --filter client typecheck` → PASS.
- [ ] **Step 6 (manual-verify — Canvas/pointer rhythm):** Temporarily render a `CardNewsCardItem` (or wait for Chunk 4's panel) — at minimum confirm the component compiles + mounts without runtime error. Full drag/resize/paste manual verification happens in Chunk 4 Step "manual" once the panel mounts a grid. **State explicitly:** "Canvas/pointer UI verified manually in Chunk 4; here only build+typecheck+helper-tests gate the commit."
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/CardNewsCardItem.tsx packages/client/src/features/marketing/components/content/__tests__/CardNewsCardItem.helpers.test.ts
  git commit -m "feat(marketing): port CardNewsCardItem (Canvas + pointer drag/resize) + tested pure helpers"
  ```

---

## Chunk 4: Cardnews panel + WebP export

> The centerpiece (`cardnews-panel.tsx`, 986 lines): templates sidebar (8 built-ins + custom + hide) + caption/hashtag editor + slide-text editor + 2-column slide grid + AI text gen + per-card image (cardId hook) + **batch images via the store** + **Canvas WebP download via `renderCardToBlob`** + preview modal. Port → typecheck → manual-verify → commit (the AI-text JSON parse + the body-truncation are exact; reference them).

### Task 4.1: `CardNewsPanel.tsx` ← `cardnews-panel.tsx` (986 lines)

**Files:**
- Create: `packages/client/src/features/marketing/components/content/CardNewsPanel.tsx`
- Modify: `packages/client/src/features/marketing/components/content/ContentTabs.tsx`

- [ ] **Step 1 (port outer `CardNewsPanel({ content, project })`):** Copy CF `cardnews-panel.tsx` outer (`:920-985`). Rewire to Tangobook:
  - Read `igContents = useContent(content.id).data?.instagramContents ?? []`; `hasBaseArticle = Boolean(useContent(content.id).data?.baseArticle)`. `const { models: channelModels, setChannelModels } = useChannelModels(project.id, 'cardnews')`.
  - `<ChannelModelSelector textModel={channelModels.textModel} imageModel={channelModels.imageModel} aspectRatio={channelModels.aspectRatio} imageStyle={channelModels.imageStyle} defaultAspectRatio="4:5" onTextModelChange={(m)=>setChannelModels({textModel:m})} onImageModelChange={(m)=>setChannelModels({imageModel:m})} onAspectRatioChange={(r)=>setChannelModels({aspectRatio:r})} onImageStyleChange={(s)=>setChannelModels({imageStyle:s})} />` (1-arg `setChannelModels`, §5.7).
  - `<ChannelContentList<InstagramContent> items={igContents} getId={i=>i.id} getTitle={(item)=>item.title || '카드뉴스'} onTitleChange={(id,title)=>updateInstagramContent.mutate({id,contentId:content.id,updates:{title}})} onAdd={()=>useCreateInstagramContent().mutateAsync({contentId:content.id})} onDelete={(id)=>deleteInstagramContent.mutate({id,contentId:content.id})} addLabel="새 카드뉴스 추가" accentColor="bg-indigo-600 hover:bg-indigo-700" renderContent={(ig)=><CardNewsPanelInner igContent={ig} content={content} project={project} hasBaseArticle={hasBaseArticle} channelModels={channelModels} />} />` — **1-arg `getTitle`** (R-6); **omit `onAddToQueue`/`publishChannels`** (Phase 3). The outer keeps CF's `max-w-4xl` header + the `4:5` badge.
- [ ] **Step 2 (port inner `CardNewsPanelInner`):** props `{ igContent: InstagramContent & { cards: InstagramCard[] }; content; project; hasBaseArticle; channelModels }`. `const cards = igContent.cards;` (graph slice) + a **`localCards` mirror** (like `BlogPanel`) for live editing before refetch. Hooks: `useSetInstagramCards`, `useUpdateInstagramCard`, `useDeleteInstagramCard`, `useAddInstagramCard`, `useUpdateInstagramContent`; templates `useCardTemplates(project.id)`, `useHiddenBuiltins(project.id)`, `useCreateCardTemplate`, `useUpdateCardTemplate`, `useDeleteCardTemplate`, `useHideBuiltin`. State: `caption`, `slideTexts`, `hashtagInput`, `selectedCardId`, `activeTemplateId`, `workingTplData`, the collapse toggles, `referenceImage`, `showPreview`/`previewIndex`, `showPromptDialog`/`generatedPrompt`. **DROP** the CF localStorage→DB migration `useEffect` (CF :153-187, O-C).
  - **Templates sidebar:** `savedTemplates` = `useCardTemplates(...).data ?? []` mapped row→camelCase (CF :78-85: `{ id, name, bgColor:row.bg_color, imageY:Number(row.image_y), textBlocks:row.text_blocks, preview:row.preview }`). `allTemplates = [...CARD_TEMPLATES, ...savedTemplates].filter(t => !(useHiddenBuiltins(...).data ?? []).includes(t.id))` (CF :189). Apply a template = `applyTemplate` (CF :415-436): for each card, rewrite `text_style` blocks to the template layout while **preserving each block's existing `text`** (match by block id), update `background_color`. The template "속성" panel edits **local `workingTplData`** and live-applies to all cards via `updateWorking`/`updateWorkingBlock` (CF :603-626). Save → `useCreateCardTemplate`/`useUpdateCardTemplate` (CF `updateCurrentTemplate` :113-137 — including the **"save built-in as a `(수정)` custom copy"** branch, R-10: `createCardTemplate({ name: `${existing.name} (수정)`, … })` → set the new id as `activeTemplateId`). Delete = `useDeleteCardTemplate` (custom) or `useHideBuiltin` (built-in) (CF :144-151). 새 템플릿 → `useCreateCardTemplate` with CF's default block layout (CF :89-106). Rename (custom only) → `useUpdateCardTemplate({ updates:{ name } })` via `KoreanInput`.
  - **Caption/hashtags** (CF :532-547, :786-819): `handleCaptionChange` → `useUpdateInstagramContent({ updates:{ caption } })`; add/remove hashtag → `useUpdateInstagramContent({ updates:{ hashtags } })`. Keep the auto-hashtag-from-tags `useEffect` (CF :203-211) — but guard it so it only fires once per igContent (CF keys it on `igContent.id`).
  - **AI text gen** (`buildCardNewsImagePromptsPrompt`, `../../lib/prompt-builder`): `useAiGeneration({ onComplete })`. On complete (CF :242-317): `fullText.match(/\{[\s\S]*\}/)` → `{ caption, hashtags[], slides[] }`; set caption + `useUpdateInstagramContent({ updates:{ caption, hashtags } })`; build `InstagramCard[]` per slide with the 4-zone `CardCanvasData` (header/title/body/footer) **including the body-truncation to ~80 chars** (CF :262-287) — **stamp each card with `id`+`user_id`+timestamps** (R-9, mirror `BlogPanel.tsx:196-217`; get `user_id` via `supabase.auth.getUser()`); `setLocalCards(newCards)`; `useSetInstagramCards.mutateAsync({ igContentId, contentId: content.id, cards: newCards })`. On parse failure → `alert('카드뉴스 프롬프트 파싱 실패. 다시 시도해 주세요.')` (CF :310). Build the prompt from blog sections if any blog cards exist, else the base article (CF `handleGenerate` :329-351 — reads `useContent(content.id).data?.blogContents[i].cards`). Open `PromptEditDialog` before streaming.
  - **Per-card image gen (§7 adaptation, mirror `BlogPanel.tsx:296-334`):** `useCardImageGeneration({ getPrompt:(cardId)=>{ const c = localCards.find(x=>x.id===cardId); const base = c?.image_prompt ? (imageStyle ? `${imageStyle}. ${c.image_prompt}` : c.image_prompt) : `Create an illustration for social media card: "${c?.text_content || 'Slide'}". ${imageStyle}`; return `${base}\n${NO_TEXT_IMAGE_RULE}`; }, getModel:()=>channelModels.imageModel, getAspectRatio:()=>channelModels.aspectRatio || '4:5', getReferenceImages: referenceImage ? (()=>[/* {base64,mimeType} from referenceImage if a ref was uploaded */]) : undefined, onSave:(cardId,url,prompt)=>{ setLocalCards(prev=>prev.map(c=>c.id===cardId?{...c,background_image_url:url,image_prompt:prompt}:c)); return useUpdateInstagramCard().mutateAsync({ cardId, contentId: content.id, updates:{ background_image_url:url, image_prompt:prompt } }); }, projectId: project.id })`. Per-card regen → `generateForCard(card.id)`. (`imageStyle = channelModels.imageStyle || 'Photorealistic, high quality photography, natural lighting, detailed'`, CF :213.) The reference image upload uses **`uploadToR2`** (NOT CF's hand-rolled `/api/storage/presign`+`presignedUrl` :222-228, R-7) — `uploadToR2(file, { projectId: project.id, category:'references', fileName:file.name, contentType:file.type, contentId: igContent.id })`, fall back to a data-URL on failure.
  - **Batch image gen (§5.5 store):** `const batchJob = useBatchImageStore(selectBatchProgress(igContent.id)); const startBatchJob = useBatchImageStore(s=>s.startJob); const abortBatchJob = useBatchImageStore(s=>s.abortJob);`. `handleGenerateAllImages` (CF :370-381): build `prompts` from each card's `image_prompt` (or fallback) prefixed with `imageStyle`, `aspectRatio: channelModels.aspectRatio || '4:5'`, `slideIndex:i`; build `cardIdsByIndex = localCards.map(c=>c.id)` (snapshot by index); call `startBatchJob({ igContentId: igContent.id, prompts, cardIdsByIndex, imageModel: channelModels.imageModel, projectId: project.id, onSaved:(cardId,url)=>{ setLocalCards(prev=>prev.map(c=>c.id===cardId?{...c,background_image_url:url}:c)); return useUpdateInstagramCard().mutateAsync({ cardId, contentId: content.id, updates:{ background_image_url:url } }); } })`. `<GenerationButton variant="batch-image" isGenerating={batchJob.isRunning} progress={{current:batchJob.current,total:batchJob.total}} onAbort={()=>abortBatchJob(igContent.id)} … />`. Per-slide overlay: `isGeneratingImage={generatingCardId===card.id || (batchJob.isRunning && batchJob.currentSlideIndex===card.sort_order)}` (CF :856).
  - **O-D high-frequency persistence:** the inner's `handleCardUpdate(cardId, updates)` updates `localCards` immediately; route persistence: for `text_style` writes triggered by **drag/resize** persist on **pointer-up** (the simplest deterministic hook: the `CardNewsCardItem` calls `onUpdate` on every move — wrap so a `text_style`-only update sets local state immediately and schedules a **500 ms debounce** via `useDebouncedSave('mkt_instagram_cards', cardId)` keyed per card; alternatively flush on the next `pointerup` window event). For text/number inputs (TextBlockEditor, image-prompt textarea, bg color) use the same 500 ms debounce. Structure changes (add/delete card, apply template, AI gen, image save) persist immediately via the direct mutations. **Decision O-D / R-5.** Document in a code comment which mechanism (pointer-up vs debounce) each write path uses.
  - **Slide grid + AddSlideButton** (CF :845-869): render `CardNewsCardItem` per card (`onUpdate=handleCardUpdate`, `onDelete=(id)=>{ setLocalCards(prev=>prev.filter(c=>c.id!==id)); useDeleteInstagramCard().mutate({cardId:id,contentId:content.id}); }`, `onGenerateImage=()=>generateForCard(card.id)`); `AddSlideButton` → `useAddInstagramCard().mutateAsync({ igContentId, contentId: content.id, sortOrder: localCards.length })`.
  - **Preview modal** (CF :871-907): port verbatim (pure JSX; renders `parseCanvasData` blocks at 3× font).
- [ ] **Step 3 (Canvas WebP download — `renderCardToBlob` from Chunk 0):** `handleDownloadAllImages` (CF :455-473): for each card with an image or text, `const blob = await renderCardToBlob(parseCanvasData(card.text_style, card.background_image_url))` (import `renderCardToBlob` from `../../lib/canvas-export`, `parseCanvasData` from `./CardNewsCardItem`); download `cardnews_NN.webp` (zero-padded), 500 ms apart; wrap each in try/catch (CF :460-472 logs + continues). **Before the loop, `await document.fonts.ready`** (O-G, §8.3 — rasterize any already-declared slide fonts; unloaded ones fall back to sans-serif gracefully). The proxy-draw fallback for R2 images is inside `renderCardToBlob` (Chunk 0) — no extra wiring. Button shown when `localCards.some(c=>c.background_image_url)` (CF :778).
- [ ] **Step 4 (wire ContentTabs):** In `ContentTabs.tsx`: import `CardNewsPanel`; flip the `cardnews` entry in `TABS` from `active:false` → `active:true`; replace the `cardnews` `TabsContent` body `<ComingSoonPanel label="카드뉴스" />` with `<CardNewsPanel content={content} project={project} />`. **Keep `youtube`+`shorts` as `ComingSoonPanel`** (1c). **Do NOT touch `KO_ONLY_TABS`** (cardnews is NOT ko-only).
- [ ] **Step 5 (R-1 + typecheck):** confirm panel icons `Eye,EyeOff,Loader2,Hash,X,Download,Upload,RefreshCw,ChevronDown,Save` + `Badge`/`KoreanInput` (ui) resolve at `^1.17.0`. `pnpm --filter client typecheck` → PASS. Confirm no `useProjectStore`/`addToPublishQueue`/`ChannelTranslationView`/`base64ToBlob`-via-`use-r2-upload`/`/api/storage` (non-mkt)/`presignedUrl` references remain. (If `base64ToBlob` is genuinely needed, import from `../../lib/image-utils`.)
- [ ] **Step 6 (manual-verify @superpowers:verification-before-completion):** `pnpm dev`; `/marketing/content`; select a content with a base article → 카드뉴스 tab → 새 카드뉴스 추가 → "AI 텍스트" (PromptEditDialog → caption/hashtags/slides populate) → apply a template (all cards relayout, texts preserved) → **drag a text block** (snaps to grid; persists on pointer-up — verify via reload) → **resize a block** (bottom-right corner) → **drag image Y** → **paste/drop** an image (Ctrl+V on the canvas) → edit the image-prompt textarea → per-card **AI 생성** → **전체 이미지** batch (progress bar; **switch to another tab and back — the job survives**) → 미리보기 carousel → **다운로드** (a `cardnews_NN.webp` per slide; **verify an AI-generated/R2 slide exports after the R-0 CORS fix, and that the proxy fallback also produces a valid WebP if you temporarily simulate a CORS failure**). Confirm non-ko language: cardnews tab **stays visible**.
- [ ] **Step 7:** Commit:
  ```bash
  git add packages/client/src/features/marketing/components/content/CardNewsPanel.tsx packages/client/src/features/marketing/components/content/ContentTabs.tsx
  git commit -m "feat(marketing): CardNewsPanel (templates, AI text, per-card + batch image, WebP export) + wire cardnews tab"
  ```

---

## Chunk 5: Verification (full suite + manual E2E + scope confirmation)

> @superpowers:verification-before-completion — run every gate and confirm output before any "done" claim. Evidence before assertions.

### Task 5.1: Automated gates

**Files:** none (verification only).

- [x] **Step 1 (unit tests):** `pnpm --filter client test marketing` → **45 test files, 313 tests all PASSED**. All marketing tests green (canvas-export wrapLines, batch-image-store, CardNewsCardItem.helpers, cardnews-templates, use-instagram-contents, use-threads-contents + Phase 1a suite). Non-marketing failures: 3 pre-existing files (auth/RequireAuthedWithPin ×2, games/SpeakingPlayer ×5, viewer/GameListViewer ×2 = 9 total — all pre-1b window.matchMedia jsdom issues, unchanged).
- [x] **Step 2 (typecheck):** `pnpm typecheck` (all packages, 2026-06-07) → **PASS** — shared/server/client all clean.
- [x] **Step 3 (lint):** `pnpm lint` → 11 errors (all in `packages/remotion/` — pre-existing TS parsing, not ours) + 198 warnings (pre-existing). **No new errors** from marketing 1b code. No leftover `'use client'`, `@next/next/no-img-element`. batch-store `console.warn` is CF-ported logging, acceptable.
- [x] **Step 4 (build):** `pnpm --filter client build` → **PASS** in 8.90s. 2924 modules transformed. Chunk size warning (3.3MB) is pre-existing (noted SEO memory). No new build errors.
- [x] **Step 5:** No commit needed (verification passed).

### Task 5.2: Manual E2E + scope confirmation

**Files:** none (verification only).

- [ ] **Step 1 (cardnews full flow):** `/marketing/content` → create cardnews → AI 텍스트 → template apply → drag/resize/imageY/paste → per-card AI image → batch (tab-switch survival) → 미리보기 → WebP 다운로드 (AI/R2 slide exports post-CORS; proxy fallback works). All persist across reload.
- [ ] **Step 2 (threads full flow):** create threads → AI 생성 → edit (counter/auto-resize/debounced save) → 이미지 첨부 → 이미지 생성 → 미리보기 → 전체 복사 (`[n/total]`). All persist across reload.
- [x] **Step 3 (language — static confirm):** TABS config shows cardnews+threads `active:true`, youtube+shorts `active:false`. KO_ONLY_TABS = `['blog']` only. No `ChannelTranslationView` imported anywhere in components/. (Live language-switch verified by user at their discretion.)
- [x] **Step 4 (scope confirmation — static):** ContentTabs lines 141-145: youtube/shorts render `<ComingSoonPanel>`. `grep translateAndSaveChannel/ChannelTranslationView components/` → 0 results. No `image-editor-dialog` import in panels. No `addToPublishQueue`/publish UI in CardNewsPanel or ThreadsPanel.
- [x] **Step 5 (RLS sanity):** Phase 1b migrations = only 2 optional perf indexes on `mkt_instagram_cards` + `mkt_threads_cards` (no policy/table changes). All existing RLS policies (single-owner `user_id = auth.uid()`) unchanged. No new SECURITY DEFINER functions → no GRANT EXECUTE needed (memory RULE n/a).
- [ ] **Step 6 (finish):** @superpowers:finishing-a-development-branch — present merge/PR/cleanup options. Update memory + the spec status to reflect Phase 1b COMPLETE (per the user's "업데이트 하자" workflow if invoked).

---

## Appendix A — Resolved decisions referenced above (spec §14)

- **O-A — Canvas export under R2 CORS:** fix bucket CORS (durable, Task 0.1) + proxy-draw fallback inside `renderCardToBlob` (robust, Task 0.2). Try direct `crossOrigin='anonymous'`; on taint/`onerror` retry via `/api/mkt/storage/proxy?url=…`. (§8.2.)
- **O-B — Templates:** static `CARD_TEMPLATES` (8) + `mkt_card_templates` (custom) + `mkt_card_hidden_builtins` (hidden). Displayed = `[...builtins, ...customRows].filter(!hidden)`. (Task 3.1, 4.1.)
- **O-C — Template localStorage migration:** DO NOT port (CF keys never existed; fresh DB). Drop the `useEffect`. (Task 4.1 Step 2.)
- **O-D — High-frequency canvas persistence:** pointer-up for drag/resize, 500 ms `useDebouncedSave` for text/number inputs, live canvas in local state. (Task 1.1 note, 4.1 Step 2.)
- **O-E — Batch-image store as Zustand:** ports cleanly; only couplings are 2 imports (→ `lib/image-utils` + `api/use-r2-upload`) and the `useProjectStore` card read (→ injected `cardIdsByIndex` + `onSaved`). Job/progress state, not server cache. (Task 1.5.)
- **O-F — Threads post text persistence:** local state + ~400 ms debounce via `useUpdateThreadsCard` (optionally `useDebouncedSave`). (Task 2.2 Step 2, 2.3 Step 1.)
- **O-G — Canvas slide fonts:** keep CF's Google-Font options; `await document.fonts.ready` before download; accept graceful sans-serif fallback for unloaded families. (Task 4.1 Step 3.)
- **Threads `image_prompt` storage:** keep CF's `media_type`-holds-the-prompt quirk; no DDL. (R-4; Task 2.2.)
- **Language axis / translation rendering:** OUT (1d). cardnews+threads visible for non-ko; no `ChannelTranslationView`, no `translateAndSaveChannel`. (§9.)

## Appendix B — The `useCardImageGeneration` API the panels MUST use (spec §7)

The Phase 1a-ported hook is **cardId-based** (NOT card-object-based like CF). Adapt the panels (mirror `BlogPanel.tsx:296-334`):

| | ContentFlow (do NOT copy) | **Ported (USE this)** |
|---|---|---|
| prompt getter | `getPrompt(card)` | `getPrompt(cardId: string)` — look the card up from `localCards` by id |
| existing img | `getExistingImage(card)` | (none) — use `getReferenceImages(cardId)` if a ref is needed |
| save | `saveResult(cardId, dataUrl, prompt)` | `onSave(cardId, url, prompt)` |
| model/ratio | `imageModel`/`aspectRatio`/`imageStyle` fields | `getModel(cardId)` / `getAspectRatio(cardId)` |
| single | `generateCardImage(cardId, cards)` | `generateForCard(cardId)` |
| batch | `generateAllImages(cards)` | **cardnews uses the batch STORE (§5.5), NOT `generateAll`** (so the batch survives tab switches; `generateAll` dies on unmount). threads has no batch. |
| return | `{ isGeneratingImage, generatingCardId, imageProgress }` | `{ isGenerating, progress, generateForCard, generateAll, abort }` |

**Flow (unchanged, `use-card-image-generation.ts:41-79`):** `generateImage` POST `/api/mkt/ai/generate-image` → `{ base64, mimeType:'image/png' }` → `convertToWebpBlob` → `uploadToR2({ projectId, category:'images', fileName:`${cardId}.webp`, contentType:'image/webp', contentId:cardId })` → on R2 failure fall back to a `data:` URL → `onSave(cardId, url, prompt)`.
