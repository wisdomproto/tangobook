# Marketing Port — Phase 1d: Translation Axis + Image Editor — Design

| | |
|---|---|
| **Status** | COMPLETE (Chunks 0–4 implemented and verified, 2026-06-07) |
| **Branch / worktree** | `feat/marketing-phase0` @ `C:\projects\tangobook\.worktrees\marketing-phase0` |
| **Date** | 2026-06-07 |
| **Roadmap slot** | **Phase 1d** = the **final slice of Phase 1 (콘텐츠 생성)**. Phases 0, 1a (기본글 + N블로그/내부블로그), 1b (카드뉴스 + 스레드), 1c (유튜브 롱폼) are COMPLETE and committed. Phase 1d closes the content area. |
| **Predecessor specs** | `2026-06-06-contentflow-marketing-port-design.md` (master), `…-phase1a-base-article-blog-design.md`, `…-phase1b-cardnews-threads-design.md`, `…-phase1c-youtube-design.md` |
| **Source app** | ContentFlow (Next.js) @ `C:\projects\contentflow\contentflow` |

> **Numbering note.** The Phase 1a spec referred to "translation generation" and the image-editor as *Phase 1b*. The roadmap was subsequently re-sliced: 1b became cardnews/threads, 1c youtube, and **translation + image editor is now Phase 1d**. Where Phase 1a/1b/1c specs say "deferred to 1b" about translation or `image-editor-dialog`, read it as **deferred to 1d** (this spec). This spec **reverses** decision `O-7` (image editor deferred) and the `O-5` `onTranslate`-stub decision.

---

## 1. Overview

Phase 1d wires the two remaining cross-channel content features that every earlier phase deliberately stubbed:

1. **Translation axis (다국어 번역)** — per-channel AI translation. For the currently-active channel and a chosen non-Korean target language: collect the channel's source HTML (via the already-ported builders), stream-translate it through `/api/mkt/ai/translate`, persist the translated HTML to R2, upsert a row in `mkt_translations`, and render the translated HTML as a read-only banner above each channel panel. This turns the existing `LanguageSelector.onTranslate` stub (`ContentTabs.tsx:92` → `alert('번역은 곧 지원됩니다 …')`) into a real flow.
2. **Image editor (이미지 에디터, annotation)** — the framework-agnostic Canvas annotation dialog (`ImageEditorDialog`): pointer tools (select / text / line / arrow / rect), undo/redo history, SVG overlay with per-element arrowhead markers, composited onto a scaled offscreen Canvas → WebP data URL. This re-enables `ImageCardWidget.onEdit` (currently typed `onEdit?: undefined` and unrendered per `O-7`).

Both features are **faithful ports** of ContentFlow logic, adapted to the worktree's conventions (Vite + TanStack Query v5 + Zustand + `/api/mkt/*` Express SSE + `mkt_*` Supabase tables + R2 presign).

### 1.1 Goals

- G1. Translate the active channel's content into any project target language, persist to R2 + `mkt_translations`, and display it read-only per channel.
- G2. Wire `LanguageSelector.onTranslate` for real, with per-language status feedback (`none` / `translating` / `completed` / error), replacing the `ContentTabs` alert stub.
- G3. Mount the translated-HTML overlay (`ChannelTranslationView`) on each translatable channel panel when `selectedLanguage !== 'ko'`.
- G4. Re-enable the in-app image annotation editor on every `ImageCardWidget` usage, saving the annotated WebP back to R2 via `uploadToR2`.
- G5. Match Phase 0–1c naming, file layout, gotchas (`user_id` stamping, proxy-draw fallback, `.marketing-scope`), and the data-layer envelope conventions exactly.

### 1.2 Non-goals (explicitly OUT — Phase 2+)

| Out of scope | Phase |
|---|---|
| Keyword research panels (네이버/구글 키워드 UI beyond existing `use-keywords.ts`) | 2 |
| Publishing (Meta/Naver/YouTube publish, `mkt_publish_records` writes, schedule/예약) | 3 |
| Analytics (GA4, funnel, `mkt_*` analytics tables) | 4 |
| Strategy (전략 HTML generation/import) | 5 |
| Translation **review** workflow (the `status='review'` lane, `reviewed_at`, side-by-side diff editing) | later |
| Translating **all** channels at once (batch) — 1d translates the **active** channel only, like CF | later |
| AI image **crop/filter/regenerate** inside the editor — 1d ports only the **annotation** editor (the CF dialog at `image-editor-dialog.tsx` IS the annotation editor; there is no separate crop tool to port) | — |
| Image generation from the editor (it edits an existing image only) | — |

---

## 2. Architecture on top of Phase 0–1c

Phase 1d adds **no new Supabase DDL** (the `mkt_translations` table already exists — see §4.1) and **no new Express routes** (the `/api/mkt/ai/translate` SSE route and `/api/mkt/storage/proxy` already exist — see §4.4). It is almost entirely **client** work plus **two tiny server tweaks** (§4.4): adding `html → text/html` to the proxy content-type map, and confirming the translate controller contract.

New / changed files (all under `packages/client/src/features/marketing/`):

```
lib/
  channel-translator.ts          [EDIT]  fix table name → mkt_translations; stamp user_id;
                                          rewrite streamTranslate for the /api/mkt/ai/translate
                                          {prompt,model} contract; remove the _setUploadToR2 bridge
                                          in favor of a direct import.
hooks/
  use-channel-translation.ts     [NEW]   TanStack Query: fetch translated HTML for (content,channel,lang)
  use-translation.ts             [NEW]   (optional) thin SSE translate hook — see §5.6 (may be folded in)
api/
  queries.ts                     [EDIT]  add mktKeys.translation(...) / mktKeys.translations(...)
  use-translations.ts            [NEW]   useChannelTranslationUrl + useTranslateChannel mutation
components/content/
  ChannelTranslationView.tsx     [NEW]   per-channel translated-HTML banner (non-ko only)
  ImageEditorDialog.tsx          [NEW]   ~780-line annotation editor port
  ImageCardWidget.tsx            [EDIT]  onEdit?: () => void  + re-add Pencil edit button (reverse O-7)
  ContentTabs.tsx                [EDIT]  real handleTranslate; pass translationStatuses + active channel
  LanguageSelector.tsx           [EDIT]  accept translationStatuses; show per-lang status; keep current shape
  BaseArticlePanel.tsx           [EDIT]  mount inline translation overlay (base channel) when non-ko
  BlogPanel.tsx                  [EDIT]  mount <ChannelTranslationView channel="naver_blog"/>
  InternalBlogPanel.tsx          [EDIT]  mount <ChannelTranslationView channel="self_hosted"/>
  CardNewsPanel.tsx              [EDIT]  mount <ChannelTranslationView channel="instagram"/>
  ThreadsPanel.tsx               [EDIT]  mount <ChannelTranslationView channel="threads"/>
  YoutubePanel.tsx               [EDIT]  mount <ChannelTranslationView channel="youtube"/>
  (panels that render ImageCardWidget pass a real onEdit → open ImageEditorDialog)
server (tiny):
  packages/server/src/controllers/mkt/storage.controller.ts  [EDIT] add html:'text/html' to proxy map
```

The orchestration seam is **`ContentTabs.tsx`** (it already owns `content`, `project`, `selectedLanguage`, the active tab, and mounts `LanguageSelector` + all panels). The translated-HTML **display** seam is **each channel panel** (mirrors CF, which mounts `ChannelTranslationView` inside blog/cardnews/internal-blog/threads/youtube panels — base-article uses its own inline overlay).

---

## 3. What is already ported (verified) vs. net-new

| Symbol / file | CF source | Worktree status | 1d action |
|---|---|---|---|
| `channel-translator.ts` (`translateAndSaveChannel`, `streamTranslate`, `uploadHtmlToR2`, `getChannelTranslationUrl`, `buildBlogCardsHtml`, `buildCardnewsHtml`, `buildThreadsHtml`, `buildYoutubeHtml`, `languageLabel`) | `src/lib/channel-translator.ts` | **PORTED** (`lib/channel-translator.ts`) — all 4 HTML builders + `getChannelTranslationUrl` present. BUT **dormant + has 3 issues**: (a) queries the wrong table `translations` (must be `mkt_translations`), (b) does **not** stamp `user_id` on insert (RLS will reject — gotcha (a)), (c) `streamTranslate` posts the CF `/api/ai/translate` body shape, incompatible with the worktree's `/api/mkt/ai/translate` `{prompt,model}` contract; and it uses a `_setUploadToR2` injection bridge that is **never initialized anywhere** (`grep` shows only the definition). | **EDIT** — fix (a),(b),(c); replace the bridge with a direct `import { uploadToR2 } from '../api/use-r2-upload'`. |
| `translation-prompt-builder.ts` (`buildTranslationPrompt`) | `src/lib/translation-prompt-builder.ts` | **PORTED** (`lib/translation-prompt-builder.ts`) — verbatim, correct. | Reuse as-is. Now becomes **client-side** prompt builder (the worktree server does NOT build the prompt — see §4.4). |
| `use-translation.ts` | `src/hooks/use-translation.ts` | **MISSING** (net-new) | **NEW** (optional; logic can be served by `fetchSSEText` directly — see §5.6). |
| `use-channel-translation.ts` | `src/hooks/use-channel-translation.ts` | **MISSING** (net-new) | **NEW** — port to TanStack Query (CF version is `useEffect`-based; align to the worktree's query conventions). |
| `ChannelTranslationView.tsx` | `src/components/content/channel-translation-view.tsx` | **MISSING** (net-new) | **NEW** — port; swap `useUIStore` import path + `/api/storage/proxy` → `/api/mkt/storage/proxy`. |
| `LanguageSelector.tsx` | `src/components/content/language-selector.tsx` | **PORTED but simplified** — worktree version takes `targetLanguages` as a prop and shows a per-lang `번역` button; it has **no** `translationStatuses` and no publish bar (publish = Phase 3). | **EDIT** — add `translationStatuses` prop + per-lang status glyphs; keep the worktree's prop shape (do not regress to the CF publish-bar version). |
| `ImageEditorDialog.tsx` | `src/components/content/image-editor-dialog.tsx` | **MISSING** (net-new) | **NEW** — port ~780 lines (annotation editor). |
| `ImageCardWidget.tsx` (`onEdit`) | `src/components/content/image-card-widget.tsx` | **PORTED but edit disabled** — `onEdit?: undefined` (O-7), Pencil button removed. | **EDIT** — `onEdit?: () => void` + re-add Pencil button (CF :135-139). |
| `mkt_translations` table | CF `translations` table | **EXISTS** (`supabase/migrations/2026-06-07-marketing-schema.sql:285-303`) with exactly the target columns + single-owner RLS. | **No DDL.** |
| `Translation` interface | CF `Translation` | **EXISTS** (`types/database.ts:432-447`). Missing a `user_id` field (DDL has it). | **EDIT** — add `user_id: string` to the interface (optional; used by upsert). |
| `uploadToR2` | CF `src/hooks/use-r2-upload.ts` | **EXISTS** (`api/use-r2-upload.ts`) — same signature `(file, { projectId, category, fileName, contentType, contentId }) → { publicUrl, key }`. | Reuse as-is (this is the "R-11 uploadToR2 fix" from Phase 1b memory). |
| `canvas-export.ts` (proxy-draw fallback) | CF cardnews export | **EXISTS** (`lib/canvas-export.ts`) — `proxyUrl()` + CORS retry pattern. | **Reference only** — the image editor reuses the *same* proxy-draw pattern for its composite (§6.2). |
| `image-utils.ts` (`convertToWebpBlob`, `base64ToBlob`) | CF | **EXISTS** (`lib/image-utils.ts`). | Reuse `base64ToBlob` to convert the editor's WebP data URL → Blob before `uploadToR2` (§6.3). |

---

## 4. Translation axis — data + transport

### 4.1 Data model — `mkt_translations` (CONFIRMED, no DDL change)

`supabase/migrations/2026-06-07-marketing-schema.sql:285-303`:

```sql
create table mkt_translations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  content_id      uuid not null references mkt_contents(id) on delete cascade,
  language        text not null,
  channel_type    text not null,
  status          text not null default 'pending'
                    check (status in ('pending','translating','review','completed')),
  title           text,
  body            text,         -- 1d stores the R2 public URL of the translated HTML here (CF convention)
  cards_json      jsonb,        -- unused in 1d (reserved for structured per-card translations)
  seo_title       text,
  seo_description text,
  translated_at   timestamptz,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (content_id, language, channel_type)   -- ← upsert key
);
-- RLS: create policy mkt_translations_owner … using (user_id = auth.uid()) with check (user_id = auth.uid());  (:442)
```

- **Upsert key**: `(content_id, language, channel_type)`. The worktree client does a manual `select id … maybeSingle()` → `update`-or-`insert` (CF pattern), or `.upsert(row, { onConflict: 'content_id,language,channel_type' })`. Either is acceptable; the manual path matches CF and is preferred for faithfulness.
- **`body` = R2 URL** (NOT inline HTML). This mirrors CF exactly: the translated HTML blob lives in R2 and `body` holds its public URL. `cards_json`/`seo_title`/`seo_description` stay null in 1d.
- **`channel_type` values** (the `ChannelKind` enum, unchanged from CF): `'base' | 'naver_blog' | 'self_hosted' | 'instagram' | 'threads' | 'youtube'`. Note the panel/tab → channel mapping: cardnews tab → `'instagram'`, N블로그 → `'naver_blog'`, 내부블로그 → `'self_hosted'`.
- **🔴 GOTCHA — `user_id` stamping (gotcha (a), applies to inserts here too).** `mkt_translations.user_id` is `NOT NULL` under single-owner RLS. The Supabase client insert does **not** auto-fill it. The 1d upsert MUST set `user_id` from `supabase.auth.getUser()` (or a shared `getCurrentUserId()` helper) on **insert**. On `update` of an existing row it is unnecessary (RLS `using` already scopes to the owner), but harmless to include. This is the single most likely silent failure in 1d.

### 4.2 `Translation` interface (`types/database.ts`)

Add `user_id: string;` to the existing `Translation` interface (DDL has the column; the interface omits it). All other fields already match the DDL.

### 4.3 Translate flow (active channel only — faithful to CF `content-tabs.tsx:69-160`)

Sequence, triggered by `LanguageSelector` → `onTranslate(targetLang)` for a non-ko language (orchestrated in `ContentTabs`):

```
1. Resolve channelKind from the active tab:
     base-article → 'base' · blog → 'naver_blog' · self_hosted → 'self_hosted'
     · cardnews → 'instagram' · threads → 'threads' · youtube → 'youtube' · shorts → (unsupported, alert)
2. Collect sourceHtml for that channel from the TanStack ContentGraph (NOT Zustand getters — the worktree
   reads server data from the query cache, see §5.1):
     base       → contentGraph.baseArticle?.body            (HTML; alert if empty)
     naver_blog → buildBlogCardsHtml(blogContents[0].cards)     where blogContents[0] is the N블로그 version
     self_hosted→ buildBlogCardsHtml(blogContents[..self_hosted..][0].cards)  (loose channel separation, O-1)
     instagram  → buildCardnewsHtml(instagramContents[0].cards, instagramContents[0].caption)
     threads    → buildThreadsHtml(threadsContents[0].cards)
     youtube    → buildYoutubeHtml(youtubeContents[0].cards)
   (alert + abort if the channel has no content / empty source)
3. setTranslationStatuses[targetLang] = 'translating'
4. translateAndSaveChannel({ projectId, contentId, project, targetLang, channel: channelKind,
                             sourceHtml, isNaver: channelKind === 'naver_blog' })
     a. streamTranslate(): build prompt CLIENT-SIDE via buildTranslationPrompt({sourceLanguage:'ko',
        targetLanguage, channelType, project, isNaver}); compose `${systemPrompt}\n\n${text.slice(0,16000)}`;
        POST { prompt, model? } to /api/mkt/ai/translate; fetchSSEText() → full translated text. (§4.4)
     b. uploadHtmlToR2(): Blob([translated], 'text/html') → uploadToR2(blob, {projectId, category:'content',
        fileName:`${contentId}_${channel}_${targetLang}.html`, contentType:'text/html', contentId}) → publicUrl
     c. upsert mkt_translations row: { user_id(getCurrentUserId), content_id, language:targetLang,
        channel_type:channel, status:'completed', body:publicUrl, translated_at:now() }  (§4.1 gotcha)
     d. return publicUrl
5. invalidate the translation query for (contentId, channel, targetLang) so ChannelTranslationView refetches
6. setTranslationStatuses[targetLang] = 'completed'  (on error → reset to 'none' + alert message)
```

- **N-blog Korean-only constraint**: the `blog` (N블로그) tab is **hidden** when `selectedLanguage !== 'ko'` (already done — `ContentTabs.tsx:107`, `KO_ONLY_TABS=['blog']` auto-switch :63-67). Therefore the N-blog channel is **effectively never translated through the UI** (you cannot select it under a non-ko language). `buildBlogCardsHtml` + `isNaver` remain wired for completeness/parity, but the N-blog tab will not be the active tab under a non-ko language. 내부블로그(`self_hosted`) and base-article DO support translation under non-ko.
- **CF legacy `factcheck_report.translations[]` sync (CF :137-152)** — CF additionally mirrors the base-channel R2 URL into `base_articles.factcheck_report.translations[lang]` for old display code. In the worktree this legacy display code does not exist as a separate path; the base-article overlay reads the same `mkt_translations` row via `useChannelTranslation(contentId,'base',lang)`. **Decision (O-1d-A):** do **not** replicate the `factcheck_report.translations` write — it is dead-weight legacy sync. The base-article overlay uses `mkt_translations` like every other channel. (If a future phase needs the legacy map, add it then.)

### 4.4 Transport — `/api/mkt/ai/translate` (EXISTS) + the contract mismatch (IMPORTANT)

- **Route**: `POST /api/mkt/ai/translate` — CONFIRMED (`packages/server/src/routes/mkt.routes.ts:25` → `translate` in `controllers/mkt/ai.controller.ts:67-71`).
- **⚠️ Contract differs from CF.** The CF route (`src/app/api/ai/translate/route.ts`) accepts `{ text, sourceLanguage, targetLanguage, channelType, model, project, isNaver }` and builds the system prompt **server-side** via `buildTranslationPrompt`. The **worktree** controller instead accepts only `{ prompt, model }` and calls `streamGenerate(res, { prompt, model })` — its comment states *"the client builds the full translation prompt"*. So the ported `streamTranslate` (which still posts the CF body shape) is **incompatible** and would translate with a prompt of just the raw text and no system instruction.
- **Required adaptation (part of the `channel-translator.ts` EDIT):** rewrite `streamTranslate` to:
  1. `const systemPrompt = buildTranslationPrompt({ sourceLanguage:'ko', targetLanguage, channelType, project, isNaver })`,
  2. compose `const prompt = `${systemPrompt}\n\n---\n${text}``,
  3. `return fetchSSEText('/api/mkt/ai/translate', { prompt, model })`.
  This keeps the prompt logic identical to CF while satisfying the worktree's server contract. (Alternative: extend the server controller to accept the CF body shape and build the prompt server-side — **rejected**: it diverges from the established `/api/mkt/ai/generate` `{prompt,model}` convention and `streamGenerate` signature. Keep the prompt client-side.)
- **SSE parsing**: reuse `fetchSSEText` (`lib/sse-stream-parser.ts:85`) — it POSTs JSON, reads `data: {text|error}\n\n` / `[DONE]`, throws on `{error}`, returns full text. The server SSE envelope (`gemini-sse.service.ts writeSSEChunk/Done/Error`) matches the parser exactly. Gemini overload fallback to `gemini-2.5-flash-lite` is already handled server-side.
- **`/api/mkt/storage/proxy` (EXISTS)** — `mkt.routes.ts:32` → `proxy` in `storage.controller.ts:68`. Derives the R2 key from `?url=`, `downloadFromR2`, sets a content-type from an extension allowlist. **🔴 `html` is NOT in the allowlist** (`{mp4,mp3,wav,png,jpg,jpeg,webp,pdf}`), so translated `.html` blobs are served as `application/octet-stream`. `res.text()` still works, but for correctness **add `html: 'text/html'` to the `contentTypes` map** (a one-line server EDIT). This is the only server change strictly required for translation display.

---

## 5. Translation axis — client modules

### 5.1 Reading source HTML from the ContentGraph (not Zustand)

CF's `handleTranslate` pulls source via Zustand store getters (`getBaseArticle`, `getBlogCards`, …). The worktree keeps **server data in TanStack Query** (gotcha: "Zustand 에 서버 데이터 금지"). `ContentTabs` already holds the full `ContentGraph` via `useContent(selectedContentId)` (`api/queries.ts fetchContentGraph` → `{ content, baseArticle, blogContents[].cards, instagramContents[].cards, threadsContents[].cards, youtubeContents[].cards }`). So `handleTranslate` reads source HTML directly from that `contentGraph` object — no new fetch. For `self_hosted` vs `naver_blog`, the loose-separation rule (O-1) means both live in `blogContents`; pick by `channel` field (`bc.channel === 'self_hosted'` vs `'naver_blog'`), falling back to `[0]` to mirror CF's loose read.

### 5.2 `api/use-translations.ts` [NEW] — data hooks (TanStack Query)

Two hooks, in the `api/` layer (server data), using `mktKeys`:

- **`useChannelTranslationUrl(contentId, channel, language)`** — `useQuery` that calls `getChannelTranslationUrl(contentId, language, channel)` (from `channel-translator.ts`; returns the R2 URL string or null; short-circuits to null on `language==='ko'`). `enabled: !!contentId && language !== 'ko'`.
- **`useTranslateChannel()`** — `useMutation` wrapping `translateAndSaveChannel(input)`; on success, `queryClient.invalidateQueries({ queryKey: mktKeys.translation(contentId, channel, language) })`. `ContentTabs.handleTranslate` may call this mutation (preferred) instead of calling `translateAndSaveChannel` directly, so status + cache invalidation are centralized.

### 5.3 `hooks/use-channel-translation.ts` [NEW] — translated-HTML fetch

Port of CF `use-channel-translation.ts`, **converted to TanStack Query** (CF uses raw `useEffect`). Returns `{ loading, html, missingFetch }`:

- `useQuery` keyed by `mktKeys.translationHtml(contentId, channel, language)`; `enabled` when `contentId && language !== 'ko'`.
- queryFn: `const url = await getChannelTranslationUrl(contentId, language, channel); if (!url) return { html:null, missing:false }; const res = await fetch(`/api/mkt/storage/proxy?url=${encodeURIComponent(url)}`); if(!res.ok) return { html:null, missing:true }; return { html: await res.text(), missing:false }`.
- Map query state → `{ loading: isLoading, html: data?.html ?? null, missingFetch: data?.missing ?? false }`.
- **Note** the CF path `/api/storage/proxy` becomes **`/api/mkt/storage/proxy`** (worktree namespace).

### 5.4 `components/content/ChannelTranslationView.tsx` [NEW]

Port of CF `channel-translation-view.tsx` (50 lines). Props `{ contentId, channel }`. Reads `selectedLanguage` from `useUIStore` (worktree path `../../store/ui-store`); uses `useChannelTranslation(contentId, channel, selectedLanguage)`. Renders nothing when `selectedLanguage === 'ko'`; otherwise a bordered banner with a `Globe` header (`{LANG} 번역본`), a loading spinner, a "번역되지 않음 — 상단 '번역' 버튼을 눌러주세요" hint when no translation, a "번역본을 불러오지 못했습니다" error when `missingFetch`, and the translated HTML via `dangerouslySetInnerHTML` inside a `prose` block. **Styling**: keep CF's `border-border / bg-muted / prose` classes — these resolve under `.marketing-scope` (gotcha (f)). **Korean text** in the hint should carry `break-keep` (project RULE: 한글 좁은 컨테이너 break-keep).

### 5.5 `components/content/LanguageSelector.tsx` [EDIT]

Keep the worktree's current prop shape (`{ targetLanguages, onTranslate }`) — do **not** regress to CF's publish-bar version (publish = Phase 3). Add an optional `translationStatuses?: Record<string,string>` prop. For each non-ko language button, render the active-language `번역` trigger (already present) plus a small status glyph: `completed → ✓ (green)`, `translating → ⏳ (spinner/disabled)`, `none/undefined → —`. When `translationStatuses[lang] === 'translating'`, disable that language's `번역` button. Source of languages stays `project.target_languages` with ko pinned first (O-4); `SUPPORTED_LANGUAGES` may supply flag/label only (already used via `getLangLabel`).

### 5.6 `hooks/use-translation.ts` [NEW, optional]

CF's `use-translation.ts` is a small stateful SSE hook (`{ translate, translating, translatedText, error }`). In the worktree, `translateAndSaveChannel` already drives the stream via `fetchSSEText`, and per-language status lives in `ContentTabs.translationStatuses`. **Decision (O-1d-B):** port `use-translation.ts` **only if** a live streaming preview (showing partial translated text as it arrives) is desired; otherwise omit it — `fetchSSEText` + the mutation's pending state cover the need. Default: **omit** (keep surface minimal); revisit if UX wants token-by-token preview. Document the omission in the module CLAUDE.md.

### 5.7 Mounting the overlay per panel

- **base-article**: `BaseArticlePanel` mounts an inline overlay (CF base-article-panel does this itself, reading its translation; in 1d it uses `useChannelTranslation(content.id, 'base', selectedLanguage)`) shown when `selectedLanguage !== 'ko'`, above the editor. The Korean editor stays visible/usable only for ko; for non-ko show the read-only translated HTML (or "번역되지 않음").
- **blog / self_hosted / cardnews / threads / youtube**: each panel mounts `<ChannelTranslationView contentId={content.id} channel={…} />` near the top of its body (mirrors CF, which mounts it in all five panels). Channel constants: blog → `'naver_blog'`, internal → `'self_hosted'`, cardnews → `'instagram'`, threads → `'threads'`, youtube → `'youtube'`.
- The panels already receive `content` + `project` props from `ContentTabs`, so `content.id` is available without new plumbing.

### 5.8 `mktKeys` additions (`api/queries.ts`)

```ts
// add to mktKeys
translation:     (contentId: string, channel: string, lang: string) =>
                   ['mkt', 'translation', contentId, channel, lang] as const,
translationHtml: (contentId: string, channel: string, lang: string) =>
                   ['mkt', 'translation-html', contentId, channel, lang] as const,
```

Two keys: one for the URL lookup (`useChannelTranslationUrl`), one for the fetched HTML (`useChannelTranslation`). Invalidate the relevant `translation*` keys after a successful translate (§5.2).

---

## 6. Image editor

### 6.1 `components/content/ImageEditorDialog.tsx` [NEW] — faithful port

Port `src/components/content/image-editor-dialog.tsx` (~780 lines) with these mechanical adaptations only:

- Remove the Next.js `'use client'` directive and `@next/next/no-img-element` eslint comments.
- Imports: `Button` from `../../ui/button`; `cn` from `../../lib/utils` (worktree paths). Lucide icons unchanged.
- **No other logic changes** except the Canvas composite CORS fix in §6.2.

Behavior to preserve verbatim (these are the load-bearing pieces):

- **Tools**: `select | text | line | arrow | rect` (`ToolType`). Toolbar buttons highlight the active tool.
- **Element model** `EditorElement` (`{ id, type, x, y, color, text?, fontSize?, fontWeight?, shadow?, x2?, y2?, strokeWidth?, rectWidth?, rectHeight?, fillColor?, borderColor?, borderWidth? }`).
- **History** (undo/redo): `history: EditorElement[][]` + `historyIndex`. `pushHistory(next)` trims forward history (`history.slice(0, historyIndex+1)`), appends, sets index = `len-1`, sets elements. `undo`/`redo` move the index and clear selection/editing. Reset to `[[]]`/`0` on `open`.
- **Pointer interactions** via `getRelPos` (clientX/Y minus `canvasRef` bounding-rect): canvas pointer-down in a draw tool creates an element and attaches `window` `pointermove`/`pointerup` listeners; line/arrow update `x2,y2`; rect normalizes to `min(start,cur)` + abs width/height; text drops a default `텍스트` element then returns to `select`. Element pointer-down in `select` mode drags (lines/arrows move both endpoints). Each gesture ends with a single `pushHistory`.
- **Keyboard**: Delete/Backspace deletes selection (unless editing text); Ctrl/Cmd+Z undo; Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo; Escape clears selection/editing.
- **Rendering**: an `<img>` background (`object-contain`, `max-h-[70vh]`), an absolutely-positioned `<svg>` overlay for lines/arrows/rects (with per-arrow `<marker id="arrowhead-${id}">` defs and a wider transparent hit-line for easy selection + a dashed blue selection outline), and absolutely-positioned `<div>`s for text (double-click → inline `<textarea>` editing).
- **Properties panel** (bottom) adapts to selected element type: text (내용/크기/색상/Bold/그림자), line+arrow (두께/색상), rect (채우기/테두리/두께).

### 6.2 🔴 CORS — the composite MUST use the proxy-draw fallback

`handleSave` (CF :300-383) creates an offscreen Canvas, loads the existing image with `img.crossOrigin='anonymous'`, `drawImage`, then scales every element from display-space to natural-pixel space (`scaleX = naturalWidth / displayRect.width`, `scaleY = naturalHeight / displayRect.height`) and re-draws text/line/arrow/rect, finally `canvas.toDataURL('image/webp', 0.85)`.

**The source image is an R2 URL.** If R2 CORS is not configured for the origin, `crossOrigin='anonymous'` load fails (or `toDataURL` throws `SecurityError` on a tainted canvas) — exactly the case `lib/canvas-export.ts` already solves for cardnews. **1d MUST apply the same proxy-draw fallback inside `handleSave`:**

1. Try direct `crossOrigin='anonymous'` load of `src`.
2. On `img.onerror` (CORS rejection) **or** a `SecurityError`/`null` from `toDataURL`, retry once loading `/api/mkt/storage/proxy?url=${encodeURIComponent(src)}` (same-origin → untainted). Skip the proxy for `data:` URLs (already same-origin — e.g. a freshly-edited-then-re-edited image).
3. If both fail, surface an error toast/alert (do not silently save a blank canvas).

Factor this into a small helper mirroring `canvas-export.ts`'s `loadImage`/`proxyUrl`/`isDataUrl` (or import `proxyUrl` if exported). This is the single most important correctness fix versus a naive port — note that the CF original at `image-editor-dialog.tsx:306` sets `crossOrigin` but has **no** proxy fallback, so a verbatim port would taint the canvas in any environment where R2 CORS isn't live.

### 6.3 Wiring `ImageCardWidget.onEdit` + saving back to R2

- **`ImageCardWidget.tsx` [EDIT]**: change `onEdit?: undefined` → `onEdit?: () => void`; re-add the Pencil edit button in the hover action bar (CF image-card-widget.tsx:135-139) — render only when `onEdit` is provided and `src` exists.
- **Callers** (panels rendering `ImageCardWidget` — currently base-article, blog/internal-blog card items, cardnews, threads, youtube where images appear): pass a real `onEdit` that:
  1. opens `<ImageEditorDialog open src={currentImageUrl} onSave={…} />` (manage `open` + which card via local state),
  2. in `onSave(dataUrl)`: `const blob = base64ToBlob(dataUrl)` (`lib/image-utils.ts` — handles `data:…;base64,…`), then `uploadToR2(blob, { projectId, category:'content', contentType:'image/webp', contentId })` → `publicUrl`,
  3. persist the new `publicUrl` to the owning record exactly like the existing upload/regenerate path for that card (the panels already have an `onUpload`/image-set path that writes the URL into the card row + invalidates the content graph). The edited image flows through the **same** persistence path as a fresh upload — only the source (annotated WebP) differs.
- **`user_id` reminder**: if the persistence path inserts/updates a card row, the existing card-write code already handles `user_id` stamping (gotcha (a)); the editor adds nothing new there because it reuses that path.

### 6.4 Scope/aspect

The dialog is a full-screen overlay (`fixed inset-0 z-50`). It renders inside the marketing app, so `.marketing-scope` tokens apply; the dialog's own `bg-black/90 / zinc-*` classes are literal and theme-independent — fine. No portal needed (CF renders inline when `open`).

---

## 7. Error handling

| Failure | Handling |
|---|---|
| Translate: no content selected / empty source | `alert(...)` + abort before streaming (CF parity); status not set. |
| Translate: SSE `{error}` chunk or HTTP error | `fetchSSEText` throws → mutation `onError` → `setTranslationStatuses[lang]='none'` + `alert('번역 실패: '+msg)`. |
| Translate: R2 upload fails | `uploadToR2` throws (after its 1 retry) → same `onError` path. |
| Translate: `mkt_translations` upsert RLS reject (missing `user_id`) | **Prevented** by §4.1 gotcha. If it still 401/403s, surface the Supabase error message in the alert. |
| Display: translation row exists but proxy fetch fails | `useChannelTranslation` → `missingFetch:true` → "번역본을 불러오지 못했습니다". |
| Display: html content-type wrong | Cosmetic only (`res.text()` works); fixed by §4.4 proxy map edit. |
| Editor: source image CORS taint | Proxy-draw fallback (§6.2); if both fail → error alert, dialog stays open. |
| Editor: `toDataURL` returns empty | Treat as save failure (alert), do not write a blank image. |
| Editor: image not yet loaded on save | `handleSave` awaits `img.onload`/`onerror` before compositing (CF parity). |

---

## 8. Testing strategy

**Pure-logic unit tests** (`lib/__tests__`, `api/__tests__`, `hooks/__tests__` — match the existing `__tests__` dirs; the marketing suite already has 313 tests):

- **HTML builders** (`channel-translator.ts`): `buildBlogCardsHtml`, `buildCardnewsHtml` (sort by `sort_order`, caption prefix, header/title/body/footer roles), `buildThreadsHtml`, `buildYoutubeHtml` (subtitle/narration/direction roles). Snapshot or string-equality on representative card arrays. *(These are ported verbatim — tests guard against future drift.)*
- **`buildTranslationPrompt`** (`translation-prompt-builder.ts`): asserts brand/industry/Naver/youtube/instagram-threads clauses appear conditionally (verbatim port — lock behavior).
- **Translation upsert keying**: a unit test over the upsert logic (mock supabase client) asserting it keys on `(content_id, language, channel_type)`, sets `status:'completed'`, stores the R2 URL in `body`, and **stamps `user_id`** on insert.
- **`streamTranslate` prompt composition**: assert it builds the system prompt via `buildTranslationPrompt` and POSTs `{ prompt, model }` (the contract fix, §4.4) — mock `fetchSSEText`.
- **Image editor scale math**: extract the display→natural scaling (`scaleX/scaleY` and per-element coordinate transforms) into a pure helper and unit-test (e.g. a text at display (10,20) with 2× scale → natural (20,40); arrowhead geometry; rect normalization). This is the highest-value editor test.
- **History reducer**: extract `pushHistory`/`undo`/`redo` index math into a pure reducer and test (forward-history truncation on push-after-undo; clamp at bounds).
- **`base64ToBlob`** already tested (Phase 1b) — add a case for the editor's `image/webp` data URL.

**Manual (Canvas / pointer / SSE — not unit-testable):**

1. Project with `target_languages = ['ko','en','vi']` → `LanguageSelector` shows 3 tabs, ko pinned.
2. Write base article (ko) → select `en` → base panel shows "번역되지 않음" → click `번역` → status `⏳` → `✓` → translated HTML banner renders; reload preserves it.
3. Repeat for cardnews / threads / youtube / internal-blog → each shows `ChannelTranslationView`.
4. Confirm N블로그 tab disappears under non-ko and reappears under ko.
5. Image editor: open on a card image (R2-hosted) → add text/line/arrow/rect → undo/redo → save → card image updates to the annotated WebP; reopen the saved (now possibly `data:`/new-R2) image and edit again. Verify the **proxy-draw fallback** by testing in an environment without R2 CORS (the export must still succeed, not taint).
6. `typecheck` + `lint` clean; full marketing test suite green.

---

## 9. Sequenced implementation checklist (for the plan)

1. **Server (tiny)**: add `html: 'text/html'` to the `contentTypes` map in `storage.controller.ts proxy`. Confirm `/api/mkt/ai/translate` `{prompt,model}` contract (no change — document it).
2. **`types/database.ts`**: add `user_id: string` to `Translation`.
3. **`channel-translator.ts` [EDIT]**: (a) `from('translations')` → `from('mkt_translations')` in both `translateAndSaveChannel` and `getChannelTranslationUrl`; (b) stamp `user_id` (via `getCurrentUserId()`) on insert; (c) rewrite `streamTranslate` to build the prompt client-side and POST `{prompt,model}`; (d) replace the `_setUploadToR2` bridge with a direct `import { uploadToR2 } from '../api/use-r2-upload'` and delete `_setUploadToR2`/`_uploadToR2`. Update the file's header comment.
4. **`api/queries.ts`**: add `mktKeys.translation` + `mktKeys.translationHtml`.
5. **`api/use-translations.ts` [NEW]**: `useChannelTranslationUrl` + `useTranslateChannel` mutation (invalidates translation keys).
6. **`hooks/use-channel-translation.ts` [NEW]**: TanStack-Query port; proxy path `/api/mkt/storage/proxy`.
7. **`components/content/ChannelTranslationView.tsx` [NEW]**: port; `break-keep` on the Korean hint.
8. **`LanguageSelector.tsx` [EDIT]**: add `translationStatuses` + status glyphs; disable `번역` while translating.
9. **`ContentTabs.tsx` [EDIT]**: replace the alert stub with real `handleTranslate` (reads source from `contentGraph`, maps active tab → `ChannelKind`, calls the mutation, tracks `translationStatuses`); pass `translationStatuses` to `LanguageSelector`.
10. **Panels [EDIT]**: mount the overlay — base-article inline overlay + `ChannelTranslationView` in blog/internal-blog/cardnews/threads/youtube.
11. **`ImageEditorDialog.tsx` [NEW]**: port ~780 lines; apply the **proxy-draw fallback** in `handleSave` (§6.2).
12. **`ImageCardWidget.tsx` [EDIT]**: `onEdit?: () => void` + re-add Pencil button.
13. **Panel image callers [EDIT]**: pass real `onEdit` opening the dialog; `onSave` → `base64ToBlob` → `uploadToR2` → reuse the card's existing image-persist path.
14. **Tests**: builders, prompt, upsert keying, streamTranslate contract, editor scale math + history reducer.
15. **Docs**: update `features/marketing/CLAUDE.md` (mark 번역 + 이미지 에디터 완료; note O-7 reversed, the `mkt_translations` table-name fix, the client-side-prompt contract, the proxy-draw fallback for the editor) + root CLAUDE.md `/marketing` line (7/7 channels + translation/editor) + memory `marketing-port-contentflow-2026-06-07.md`.
16. **`pnpm typecheck` + `lint` + marketing tests** green; manual test pass (§8).

---

## 10. Risks & open questions

### Risks

- **R-1d-1 (high) — translate prompt contract.** A verbatim port of `streamTranslate` posts the CF body to `/api/mkt/ai/translate`, which only reads `{prompt}` → the model receives no system instruction and (worse) `text` is ignored, producing garbage. **Mitigation**: §4.4 rewrite is mandatory and unit-tested (step 14).
- **R-1d-2 (high) — `user_id` RLS on `mkt_translations`.** Missing stamp → silent insert rejection. **Mitigation**: §4.1 gotcha + a keying unit test.
- **R-1d-3 (high) — editor canvas taint.** Verbatim CF `handleSave` has no proxy fallback → `SecurityError`/blank export wherever R2 CORS isn't live. **Mitigation**: §6.2 proxy-draw fallback (reuse `canvas-export.ts` pattern). Best long-term fix is the R2 bucket GET CORS policy (sample in `canvas-export.ts` JSDoc); until then the proxy guarantees correctness.
- **R-1d-4 (med) — wrong table name lands in prod data.** The dormant ported code points at `translations` (non-existent here); if shipped unfixed, every translate 404s on the table. **Mitigation**: step 3(a).
- **R-1d-5 (low) — proxy html content-type.** Cosmetic (text() works) but fix for correctness/caching (step 1).
- **R-1d-6 (low) — large base-article truncation.** `text.slice(0,16000)` (CF parity) may cut very long articles. Acceptable for 1d (parity); flag if users hit it.

### Open questions

1. **Live streaming preview?** Should the active language show token-by-token translated text while streaming (port `use-translation.ts`), or is a pending spinner + final banner enough? **Spec default**: final banner only; omit `use-translation.ts` (O-1d-B). Confirm with UX.
2. **`getCurrentUserId()` location.** Phase 1b panels already call `supabase.auth.getUser()` for card `user_id` stamping (gotcha (a)). Is there a shared helper to reuse, or should 1d add one in `api/supabase.ts`? Resolve during implementation (prefer a single shared helper).
3. **Editor entry points.** Which exact `ImageCardWidget` callsites get the edit button? At minimum the cardnews slide image and blog/internal-blog/base-article inline images. Confirm youtube card images are editable (they may be scene thumbnails). Enumerate during step 13.
4. **R2 bucket CORS policy** — is it now applied for `tangobook.co.kr` + `localhost:5174` (per the `canvas-export.ts` JSDoc sample)? If yes, both the cardnews export and the new editor can drop the proxy round-trip; if no, the proxy fallback stays. (Does not block 1d — the fallback works either way.)

---

## 11. Resolved facts (audited against both codebases)

- ✅ `channel-translator.ts` **is ported** (Phase 0) with all four HTML builders + `getChannelTranslationUrl` — but **dormant** and **uses the wrong table `translations`**, **does not stamp `user_id`**, posts the **wrong SSE body shape**, and relies on an **uninitialized `_setUploadToR2` bridge**. (Source: `lib/channel-translator.ts:5,57,107-133`.)
- ✅ `translation-prompt-builder.ts` **is ported** verbatim and correct (`lib/translation-prompt-builder.ts`).
- ✅ `/api/mkt/ai/translate` **exists** (`mkt.routes.ts:25` → `ai.controller.ts:67`), but builds **no** prompt server-side — it expects `{prompt,model}` (contract differs from CF). `/api/mkt/storage/proxy` **exists** (`mkt.routes.ts:32` → `storage.controller.ts:68`) but **omits `html`** from its content-type allowlist.
- ✅ `mkt_translations` **exists** with columns `content_id, language, channel_type, status, title, body, cards_json, seo_title, seo_description, translated_at, reviewed_at` + `user_id` (NOT NULL) + `unique(content_id,language,channel_type)` + single-owner RLS (`2026-06-07-marketing-schema.sql:285-303,442`). **No DDL needed.**
- ✅ `ChannelTranslationView`, `use-translation`, `use-channel-translation` are **net-new** (not in the worktree).
- ✅ `LanguageSelector` is ported but **simplified** (props `{targetLanguages,onTranslate}`, no `translationStatuses`, no publish bar); `onTranslate` is an **alert stub** at `ContentTabs.tsx:92`.
- ✅ `ImageEditorDialog` is **net-new**; `ImageCardWidget` is ported with `onEdit?: undefined` and **no edit button** (O-7). The CF editor **needs the proxy-draw fallback** added (its own `handleSave` has none).
- ✅ `uploadToR2` (`api/use-r2-upload.ts`), `canvas-export.ts` (proxy-draw pattern), `image-utils.ts` (`base64ToBlob`/`convertToWebpBlob`), `ui-store.ts` (`selectedLanguage`, default `'ko'`), and `Project.target_languages/brand_name/industry` + `BaseArticle.body` all **exist** and match CF.
