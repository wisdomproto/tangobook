# Phase 1c — 유튜브 롱폼 (YouTube longform) channel · Design Spec

> ContentFlow → Tangobook `/marketing` port. Phase 1c.
> Worktree: `C:\projects\tangobook\.worktrees\marketing-phase0` (branch `feat/marketing-phase0`).
> Author: Claude · 2026-06-07.
> Prereqs **complete & committed**: Phase 0 (foundation), 1a (base article + N/internal blog), 1b (cardnews + threads).

---

## 1. Overview

Phase 1c ports ContentFlow's **롱폼 (longform) YouTube channel** — a Vrew-style scene-script editor — into the Tangobook marketing module as the `youtube` tab inside `ContentTabs`. The longform editor turns the project's **기본글 (base article)** into a duration-aware video script: a `{video_title, video_description, video_tags, sections[]}` object whose `sections` become a **timeline of scene cards**. Each scene card carries `section_type` (hook / intro / main / example / summary / cta), `narration_text`, `screen_direction`, `subtitle_text`, plus a per-scene `image_url` / `image_prompt` (still image) and `video_prompt` (text only). The output is a scriptboard the user copies/exports for downstream video production — **no rendering/publishing happens in 1c**.

This is a **faithful port**. The three CF source files (`youtube-panel.tsx`, `youtube-card-item.tsx`, `youtube-preview-dialog.tsx`) and the three CF prompt builders (`buildYoutubePrompt`, `buildYoutubeImagePrompt`, `buildYoutubeVideoPrompt`) are reproduced; only the data layer (Zustand `useProjectStore` → TanStack graph + Supabase write hooks) and a handful of API-surface mismatches are adapted, exactly as 1b adapted CardNews/Threads.

### CF source (to port faithfully)

| CF file | Symbols |
|---|---|
| `src/components/content/youtube-panel.tsx` | `YoutubePanel` (outer), `YoutubePanelInner` (inner Vrew editor: video-settings collapsible, action bar, preview+script 2-col, timeline) |
| `src/components/content/youtube-card-item.tsx` | `SECTION_TYPES`, `getSectionInfo()`, `TimelineCard`, `AddSceneButton` |
| `src/components/content/youtube-preview-dialog.tsx` | `YoutubePreviewDialog`, `estimateReadingTime()`, `SECTION_COLORS` |
| `src/lib/prompt-builder.ts` | `buildYoutubePrompt`, `buildYoutubeImagePrompt`, `buildYoutubeVideoPrompt`, `NO_TEXT_IMAGE_RULE` |
| `src/components/content/content-tabs.tsx` | `youtube` tab → `<YoutubePanel/>`; `shorts` tab → inline placeholder `<div>` (📱) |

### Worktree targets (mirror these conventions)

`packages/client/src/features/marketing/` — `components/content/{CardNewsPanel,ThreadsPanel,BlogPanel}.tsx` (channel-panel pattern), `api/{use-instagram-contents,use-threads-contents}.ts` (hook-set pattern), `hooks/{use-ai-generation,use-card-image-generation}.ts`, `components/content/{ImageCardWidget,GenerationButton,ChannelContentList,ChannelModelSelector,PromptEditDialog}.tsx`, `lib/prompt-builder.ts`, `types/database.ts`, `api/queries.ts`.

---

## 2. Goals & Non-Goals

### Goals (Phase 1c scope)

1. Implement **`YoutubePanel`** (outer + inner) and wire it into `ContentTabs` `youtube` tab, replacing the current `ComingSoonPanel`.
2. Implement **`YoutubeCardItem`** (`SECTION_TYPES`, `getSectionInfo`, `TimelineCard`, `AddSceneButton`) — color-coded scene timeline + 16:9 thumbnails.
3. Implement **`YoutubePreviewDialog`** (read-only script preview + "전체 복사").
4. AI 대본 generation via the **already-ported** `buildYoutubePrompt` (duration-aware short/mid/long), parse `{video_title, video_description, video_tags, sections[]}`, and on parse fill each card's `image_prompt` / `video_prompt` via `buildYoutubeImagePrompt` / `buildYoutubeVideoPrompt`.
5. Per-scene **still-image** generation + batch image generation via the shared image pipeline (`useCardImageGeneration` + `ImageCardWidget`), with the **per-scene image_prompt** as the source prompt.
6. Data hooks `api/use-youtube-contents.ts` mirroring `use-instagram-contents.ts` (1:N content→cards; `setCards` = delete-all + bulk-insert; `addCard`/`updateCard`/`deleteCard`), **with `user_id` stamping** on every insert (see §10 R-A).
7. `baseArticle` injection into the prompt builder + `getCurrentUserId()` user-id stamping before any `setCards`/`addCard`, exactly as CardNewsPanel/ThreadsPanel.

### Non-Goals (explicitly OUT)

- **숏폼 / Shorts stays a placeholder.** ContentFlow's `shorts` tab is an **inline static placeholder** (`content-tabs.tsx:202` renders a 📱 card with "YouTube Shorts / Instagram Reels / TikTok" labels — **no panel component, no DB usage, no generation logic**). Inventing a shorts editor would violate faithful-port. Phase 1c **keeps `shorts` as `ComingSoonPanel`** in the worktree `ContentTabs` and does nothing else with it. (Confirmed: `ls src/components/content/` has only `youtube-*` — no `shorts-*` file exists in CF.)
- **번역 생성 (translation generation)** — Phase 1d. Language tabs render (project `target_languages`) but the translate action stays the existing stub (`alert('번역은 곧 지원됩니다 (Phase 1b)…')`). CF's `YoutubePanelInner` renders `<ChannelTranslationView contentId channel="youtube"/>` at its top — **omit this** in the port (the marketing module has no `ChannelTranslationView`; translation UI is 1d).
- **Image editor dialog** — Phase 1d (CF `image-editor-dialog`; worktree `ImageCardWidget` already hard-disables `onEdit` per O-7).
- **Video rendering / TTS / publish queue** — out of the whole port's 1.x. CF's `YoutubePanel` outer wires `onAddToQueue` into `addToPublishQueue`; **omit** the publish-queue button (no publish layer exists yet). `video_prompt` is **text only** — no video model call.
- **Keyword / publish / analytics / strategy** areas — Phase 2+.
- **No new DDL** beyond an optional perf index (see §4).

---

## 3. Architecture (on top of Phase 0/1a/1b)

Phase 1c reuses the **channel-panel pattern** verbatim:

```
ContentTabs (youtube tab)
  └─ YoutubePanel (outer)                       ← reads useContent(contentId) graph; ChannelModelSelector + ChannelContentList
       └─ ChannelContentList<YoutubeContent & {cards}>
            └─ YoutubePanelInner (per youtube version)
                 ├─ useAiGeneration  → buildYoutubePrompt → parse → setYoutubeCards (user_id stamped)
                 ├─ useCardImageGeneration → per-scene + batch still images → updateYoutubeCard
                 ├─ ImageCardWidget (selected scene, aspect-video)
                 ├─ YoutubeCardItem.TimelineCard × N  (color-coded timeline)
                 └─ YoutubePreviewDialog
```

Reused building blocks (no change): `useContent` (graph read, already includes `youtubeContents` — see §4), `useChannelModels(projectId,'youtube')`, `ChannelContentList`, `ChannelModelSelector`, `PromptEditDialog`, `GenerationButton`, `ImageCardWidget`, `useAiGeneration`, `useCardImageGeneration`, `lib/prompt-builder` youtube builders, `lib/utils.generateId`, `api/supabase`, `mktKeys`.

**YouTube scenes use `ImageCardWidget` for the still image** (aspect `aspect-video`, exactly as CF passes `aspectClass="aspect-video"`) and **`video_prompt` as a plain text field** (a `<textarea>` in the script editor; no video generation). This matches CF `youtube-panel.tsx:339-352` (ImageCardWidget) and `:457-466` (video_prompt textarea).

State model mirrors 1b: a **local mirror** `localCards` (`useState`, re-synced when `youtubeContentId` changes via a `prevIdRef` guard) for instant edits; DB writes go through the mutation hooks; `queryClient.invalidateQueries({ queryKey: mktKeys.content(contentId) })` reconciles. **Zustand holds no server data** (project rule).

---

## 4. Data model

### 4.1 Tables already exist (Phase 0) — **no DDL for cards/contents**

The Phase 0 schema migration **already created both youtube tables**: `supabase/migrations/2026-06-07-marketing-schema.sql` blocks 10 (`mkt_youtube_contents`, lines 240-259) and 11 (`mkt_youtube_cards`, lines 265-279), with RLS enabled (lines 421-422) and single-owner policies (lines 440-441: `using (user_id = auth.uid()) with check (user_id = auth.uid())`).

**`mkt_youtube_contents`** (DDL :240-259) — superset of CF's `YoutubeContent`:

| column | type | note |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid NOT NULL → auth.users | RLS owner |
| `content_id` | uuid NOT NULL → mkt_contents (cascade) | |
| `title` | text | ChannelContentList version label |
| `video_title` | text | |
| `video_description` | text | |
| `video_tags` | text[] | |
| `video_category` | text | extra vs CF (unused in 1c) |
| `target_duration` | text CHECK in ('short','mid','long') | drives `buildYoutubePrompt` |
| `thumbnail_url` | text | extra vs CF (unused in 1c) |
| `video_url` | text | extra vs CF (unused in 1c) |
| `status` | text CHECK in ('draft','in_progress','published') default 'draft' | |
| `youtube_video_id` | text | extra vs CF (unused in 1c) |
| `published_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

**`mkt_youtube_cards`** (DDL :265-279):

| column | type | note |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid **NOT NULL** → auth.users | **RLS owner — see §10 R-A drift** |
| `youtube_content_id` | uuid NOT NULL → mkt_youtube_contents (cascade) | |
| `section_type` | text | hook/intro/main/example/summary/cta |
| `narration_text` | text | |
| `screen_direction` | text | |
| `subtitle_text` | text | |
| `image_url` | text | **`[drift]` col** — present ✅ |
| `image_prompt` | text | **`[drift]` col** — present ✅ |
| `video_prompt` | text | **`[drift]` col** — present ✅ |
| `sort_order` | int NOT NULL default 0 | |
| `created_at` / `updated_at` | timestamptz | |

✅ **Confirmed**: the three `[drift]` columns (`image_url`, `image_prompt`, `video_prompt`) **exist on `mkt_youtube_cards`**. Phase 1c needs **no schema change** for them.

### 4.2 TypeScript types already exist — **one drift to fix**

`types/database.ts` already defines `YoutubeContent` (:344-360) and `YoutubeCard` (:362-375), plus `VideoDuration = 'short'|'mid'|'long'` (:18). `YoutubeCard` includes `image_url`/`image_prompt`/`video_prompt`. ✅

**🔴 Drift R-A (must fix):** the TS `YoutubeCard` interface **omits `user_id`**, but the DB column is `user_id NOT NULL` with an RLS `with check (user_id = auth.uid())`. (Contrast: `BlogCard`/`InstagramCard`/`ThreadsCard` all carry `user_id` — Phase 1a/1b added it.) Because CF's original `YoutubeCard` had no `user_id` (CF used Zustand, never inserted youtube cards to a multi-tenant DB), the field was dropped during the type port. **Phase 1c MUST:**
1. Add `user_id: string;` to the `YoutubeCard` interface (`types/database.ts`).
2. Stamp `user_id` on every card insert in the hooks + panel (see §5, §10 R-A).
Without this, `setYoutubeCards` / `addYoutubeCard` inserts fail (NULL `user_id` → NOT NULL + RLS violation), reproducing the exact bug 1a/1b's R-9 already documented.

### 4.3 Content graph — already wired

`api/queries.ts` `fetchContentGraph` **already fetches youtube**: `mkt_youtube_contents` (:86-90), `mkt_youtube_cards` (:127-133), and assembles `ContentGraph.youtubeContents: Array<YoutubeContent & { cards: YoutubeCard[] }>` (:60, :161-164). ✅ **No change to queries.ts.** `YoutubePanel` reads `contentGraph.youtubeContents` exactly as CardNewsPanel reads `instagramContents`.

### 4.4 Query keys — no new keys

`mktKeys` (`api/queries.ts:18-26`) has no per-channel card keys; instagram/threads invalidate via `mktKeys.content(contentId)`. **Phase 1c reuses `mktKeys.content(contentId)`** — no `mktKeys` addition needed.

### 4.5 Optional perf index (only DDL, optional)

Mirror the 1a/1b index migrations (`2026-06-07-marketing-phase1a-indexes.sql`, `…phase1b-indexes.sql`). Add `supabase/migrations/2026-06-07-marketing-phase1c-indexes.sql`:

```sql
create index if not exists idx_mkt_youtube_contents_content on mkt_youtube_contents (content_id);
create index if not exists idx_mkt_youtube_cards_parent_sort on mkt_youtube_cards (youtube_content_id, sort_order);
```

(Defensive `if not exists`; Phase 0 may already index the FKs. This index only accelerates the graph fetch's `in('youtube_content_id', …).order('sort_order')`.)

---

## 5. Data hooks — `api/use-youtube-contents.ts`

New file mirroring `api/use-instagram-contents.ts` **exactly** (same `getUserId()` helper, same `mutateAsync`-returns-id pattern, same `onSuccess` → `invalidateQueries(mktKeys.content(contentId))`). Seven hooks:

| hook | mirrors | youtube specifics |
|---|---|---|
| `useCreateYoutubeContent` | `useCreateInstagramContent` | inserts `mkt_youtube_contents` row: `{ id, user_id, content_id, title:null, video_title:null, video_description:null, video_tags:null, video_category:null, target_duration:'mid', thumbnail_url:null, video_url:null, status:'draft', youtube_video_id:null, published_at:null, created_at, updated_at }`. Returns id. |
| `useUpdateYoutubeContent` | `useUpdateInstagramContent` | `update(mkt_youtube_contents).eq('id', id)` + `updated_at`. Used for `video_title`/`video_description`/`video_tags`/`target_duration`/`title`. |
| `useDeleteYoutubeContent` | `useDeleteInstagramContent` | `delete().eq('id', id)` — FK cascade removes cards. |
| `useSetYoutubeCards` | `useSetInstagramCards` | **delete-all by `youtube_content_id` + bulk-insert** `cards` (only if length>0). Caller passes cards **already carrying `user_id`** (R-A). |
| `useAddYoutubeCard` | `useAddInstagramCard` | inserts one blank card with `user_id` stamped: `{ id, user_id, youtube_content_id, section_type:'main', narration_text:'', screen_direction:'', subtitle_text:null, image_url:null, image_prompt:null, video_prompt:null, sort_order, created_at, updated_at }`. Returns id. |
| `useUpdateYoutubeCard` | `useUpdateInstagramCard` | `update(mkt_youtube_cards).eq('id', cardId)` + `updated_at`. |
| `useDeleteYoutubeCard` | `useDeleteInstagramCard` | `delete().eq('id', cardId)`. |

**`user_id` stamping rules (R-A):**
- `useAddYoutubeCard` and `useCreateYoutubeContent` call `getUserId()` and put `user_id` in the inserted row themselves (like `useAddInstagramCard`).
- `useSetYoutubeCards` does **NOT** call `getUserId()` (it bulk-inserts caller-supplied rows). The **panel** must stamp `user_id` on each card before calling `setYoutubeCards.mutateAsync(...)` — identical to CardNewsPanel/ThreadsPanel (which read `await getCurrentUserId()` in the `onComplete` parser).

All mutation args use the `{ ...; contentId: string }` shape so `onSuccess` can invalidate `mktKeys.content(contentId)`.

---

## 6. Components

### 6.1 `components/content/YoutubeCardItem.tsx`

Port of CF `youtube-card-item.tsx`. Pure presentational, no data hooks. Imports `cn`, `Button` from worktree paths (`../../lib/utils`, `../../ui/button`), `YoutubeCard` from `../../types/database`.

Exports:
- **`SECTION_TYPES`** — `as const` array of `{ value, label, color, textColor }`: `hook`(훅,`bg-red-500`,`text-red-600`), `intro`(인트로,`bg-blue-500`), `main`(메인,`bg-green-500`), `example`(사례,`bg-yellow-500`), `summary`(요약,`bg-purple-500`), `cta`(CTA,`bg-orange-500`). **Copy verbatim** from CF :8-15. (These Tailwind classes are static literals → safe with Tailwind JIT.)
- **`getSectionInfo(type: string | null)`** — find by value, fallback to the `main` entry. Verbatim CF :17-19.
- **`TimelineCard`** — props `{ card, index, isSelected, onClick, onDelete }`. 16:9 thumbnail (`aspect-video`): `img` if `card.image_url` else `ImageIcon` placeholder; section badge overlay (`sectionInfo.color`), index badge, hover delete button (`stopPropagation`); bottom strip = `narration_text.slice(0,30)` + `~{estimatedSec}초` where `estimatedSec = Math.max(1, Math.round(charCount / (250/60)))`. Verbatim CF :31-95.
- **`AddSceneButton`** — props `{ onAdd }`; dashed `w-32 aspect-video` "+ 씬 추가" button. Verbatim CF :103-113.

### 6.2 `components/content/YoutubePreviewDialog.tsx`

Port of CF `youtube-preview-dialog.tsx`. Props `{ open, onOpenChange, cards: YoutubeCard[], videoTitle?: string|null }`. Read-only modal: per-section card with color header (`SECTION_COLORS` light/dark map, verbatim CF :10-17), two-column narration | (screen_direction + subtitle), header badges `약 N분` (via `estimateReadingTime`) + `{cards.length}개 섹션` + 전체 복사. `estimateReadingTime` = `totalChars/250` minutes, `<1` → "1분 미만". **Verbatim** except: import `Dialog*` + `Button` + `Badge` from worktree `../../ui/*`. (Worktree has `ui/dialog.tsx`, `ui/button.tsx`, `ui/badge.tsx` — confirmed in `ui/index.ts`.)

### 6.3 `components/content/YoutubePanel.tsx`

Port of CF `youtube-panel.tsx` (`YoutubePanelInner` + `YoutubePanel`), adapted to the worktree data layer (the CardNewsPanel/ThreadsPanel template). **Two exported pieces in one file** (matches CardNewsPanel.tsx layout).

#### Outer `YoutubePanel({ content, project })`

Mirror `CardNewsPanel` outer (`CardNewsPanel.tsx:1210-1283`):
- `const { data: contentGraph, isLoading } = useContent(content.id)` (or `selectedContentId` via `useUIStore`, matching whichever CardNews uses — CardNews uses `useUIStore().selectedContentId`; **use `content.id` prop** to match ThreadsPanel `ThreadsPanel.tsx:343` for consistency, since `ContentTabs` passes `content`+`project` props).
- `const { models: channelModels, setChannelModels } = useChannelModels(project.id, 'youtube')`.
- `useCreate/Update/DeleteYoutubeContent()`.
- `const youtubeContents = (contentGraph?.youtubeContents ?? []) as Array<YoutubeContent & { cards: YoutubeCard[] }>`.
- `const baseArticle = contentGraph?.baseArticle ?? null` and `hasBaseArticle = Boolean(contentGraph?.baseArticle)` (fidelity point #1 — forward into inner).
- Render `<ChannelModelSelector … defaultAspectRatio="16:9" />` (CF passes `defaultAspectRatio="16:9"`; worktree `ChannelModelSelector` supports `defaultAspectRatio`, `imageStyle`, `onImageStyleChange`, `showImageModel`).
- Render `<ChannelContentList<YoutubeContent & {cards}>>` with `getTitle = (yc, i) => yc.title || '유튜브 대본'`, `onAdd = () => createYoutubeContent.mutateAsync({ contentId: content.id })`, `addLabel="새 유튜브 대본 추가"`, `accentColor="border-l-4 border-l-indigo-600"` (matches 1b panels' indigo accent), `renderContent = (yc) => <YoutubePanelInner key={yc.id} youtubeContent={yc} content={content} project={project} hasBaseArticle={hasBaseArticle} baseArticle={baseArticle} channelModels={channelModels} />`.
- ⚠️ **Omit** CF outer's `onAddToQueue`/`addToPublishQueue` (no publish layer — Non-Goals).

> Note: worktree `ChannelContentList.getTitle` is `(item) => string` (no index arg) — pass `yc.title || '유튜브 대본'` without the `${index+1}` CF used. Matches Threads/CardNews.

#### Inner `YoutubePanelInner({ youtubeContent, content, project, hasBaseArticle, baseArticle, channelModels })`

State (mirror ThreadsPanelInner + CF inner):
- `localCards: YoutubeCard[]` (`useState(youtubeContent.cards ?? [])`, sorted by `sort_order`), re-synced via `prevIdRef` keyed on `youtubeContent.id` (ThreadsPanel.tsx:71-75).
- `selectedCardId: string|null` + auto-select-first effect (CF :62-67): when cards change and selection is missing, select `cards[0].id`; when empty, `null`.
- `showVideoSettings`, `showPreview`, `showPromptDialog`, `generatedPrompt`, `copied`, `generatingCardId`, `narrationRef` (auto-resize, CF :70-76).
- Derived: `selectedCard`, `selectedIndex`, `totalChars = Σ narration_text.length`, **`estimatedMinutes = Math.max(1, Math.round(totalChars/250))`** (CF :221-222), `selectedSectionInfo = getSectionInfo(selectedCard.section_type)`.

Mutation hooks: `useSetYoutubeCards`, `useAddYoutubeCard`, `useUpdateYoutubeCard`, `useDeleteYoutubeCard`, `useUpdateYoutubeContent`.

**AI 대본 generation** (`useAiGeneration`, adapt CF :82-139):
- `onComplete(fullText)` (make it **async** like ThreadsPanel since we stamp user_id):
  1. `objMatch = fullText.match(/\{[\s\S]*\}/)`; `JSON.parse` → `{ video_title?, video_description?, video_tags?, sections: {section_type, narration_text, screen_direction, subtitle_text?}[] }`. Throw if no `sections.length`.
  2. If title/description/tags present → `await updateYoutubeContent.mutateAsync({ id: youtubeContent.id, contentId: content.id, updates: {…} })`.
  3. **`const userId = await getCurrentUserId()`** (helper identical to ThreadsPanel.tsx:37-43 / CardNewsPanel:89-95).
  4. Build `newCards: YoutubeCard[]` — for each section i: `{ id: generateId(), user_id: userId, youtube_content_id: youtubeContent.id, section_type: sec.section_type||'main', narration_text: sec.narration_text||'', screen_direction: sec.screen_direction||'', subtitle_text: sec.subtitle_text ?? null, image_url: null, image_prompt: buildYoutubeImagePrompt(project, tempCard, channelModels.imageStyle), video_prompt: buildYoutubeVideoPrompt(project, tempCard, channelModels.imageStyle), sort_order: i, created_at: now, updated_at: now }` where `tempCard` = `{ section_type, narration_text, screen_direction, subtitle_text }` (CF :105-126). **This `buildYoutube{Image,Video}Prompt` fill-on-parse is the load-bearing port detail.**
  5. `setLocalCards(newCards); setSelectedCardId(newCards[0]?.id ?? null); await setYoutubeCards.mutateAsync({ youtubeContentId: youtubeContent.id, contentId: content.id, cards: newCards });`
  6. `catch → alert('대본 파싱 실패. 다시 시도해 주세요.')`.
- `onError(err) → alert('AI 생성 오류: ' + err)`.
- `handleGenerate()` → `buildYoutubePrompt({ project, content, baseArticle: baseArticle ?? undefined, youtubeContent })` → `setGeneratedPrompt(p); setShowPromptDialog(true)` (CF :159-168). **`youtubeContent.target_duration` flows into `buildYoutubePrompt` → short/mid/long guidance.**
- **`PromptEditDialog` adaptation:** worktree dialog uses **`onConfirm`** (not CF's `onGenerate`+`isGenerating`). Use `onConfirm={(prompt) => generate(prompt, channelModels.textModel)}` and drop CF's `isGenerating`/`onAbort` dialog props (worktree dialog closes itself). Matches CardNewsPanel.tsx:1180-1189 / ThreadsPanel.tsx:321-328.

**Per-scene + batch image generation** (`useCardImageGeneration`, **adapt — signature differs from CF**):

CF used `useCardImageGeneration({ getPrompt, getExistingImage, saveResult, shouldSkip, imageModel, aspectRatio, imageStyle, projectId })` and `generateCardImage(cardId, cards)` / `generateAllImages(cards)`. The **worktree** hook (`hooks/use-card-image-generation.ts`) has a **different API**: `{ getPrompt(cardId), getModel(cardId), getAspectRatio?(cardId), shouldSkip?(cardId), getReferenceImages?, onSave(cardId,url,prompt), projectId, category? }` returning `{ isGenerating, progress, generateForCard(cardId), generateAll(cardIds), abort }`. Adapt to the worktree shape (as CardNewsPanel does):
```
const { isGenerating: isGeneratingImage, progress: imageProgress, generateForCard, generateAll, abort: abortImageGeneration } =
  useCardImageGeneration({
    projectId: project.id,
    category: 'images',
    getPrompt: (cardId) => {
      const c = localCards.find(x => x.id === cardId);
      return c?.image_prompt || buildYoutubeImagePrompt(project, c!, channelModels.imageStyle);
    },
    getModel: () => channelModels.imageModel,
    getAspectRatio: () => channelModels.aspectRatio || '16:9',
    shouldSkip: (cardId) => !!localCards.find(x => x.id === cardId)?.image_url,   // used by generateAll only
    onSave: async (cardId, url, prompt) => {
      setLocalCards(prev => prev.map(c => c.id === cardId ? { ...c, image_url: url, image_prompt: prompt } : c));
      await updateYoutubeCard.mutateAsync({ cardId, contentId: content.id, updates: { image_url: url, image_prompt: prompt } });
    },
  });
const handleGenerateCardImage = (cardId) => { setGeneratingCardId(cardId); generateForCard(cardId).finally(() => setGeneratingCardId(null)); };
const handleGenerateAllImages = () => generateAll(localCards.map(c => c.id));
```
- Per-scene image lives in `ImageCardWidget` (`aspectClass="aspect-video"`): `src={selectedCard.image_url}`, `isGenerating={generatingCardId === selectedCard.id}`, `onRegenerate={() => handleGenerateCardImage(selectedCard.id)}`, `onDelete={() => updateYoutubeCard.mutate({cardId, contentId, updates:{image_url:null}})}`, `onUpload={(file) => FileReader → updateYoutubeCard({image_url: dataUrl})}` (CF :339-352). Section badge overlay on top-left (CF :354-360).
- Batch uses `GenerationButton variant="batch-image"` with `progress={imageProgress}` + `onAbort={abortImageGeneration}` (CF :301-308). (YouTube does **not** use `batch-image-store`; CF's youtube batch was the simple in-hook loop — `useCardImageGeneration.generateAll` already sequences with a 3s gap + abort, so reuse it directly. The store bridge O-E was a CardNews-only exception.)

**Card edit handlers** (CF :174-184, with 1b's debounce):
- `handleCardUpdate(cardId, updates)` → optimistic `setLocalCards` + persist. Apply **ThreadsPanel's O-F debounce**: text fields (`narration_text`, `screen_direction`, `subtitle_text`, `image_prompt`, `video_prompt`) coalesce ~400 ms per cardId; structural (`section_type`, `image_url`) persist immediately. (CF wrote every keystroke straight to Zustand; in the DB world we debounce text to avoid write storms, matching ThreadsPanel.tsx:182-204.)
- `handleCardDelete(cardId)` → `setLocalCards(filter)` + `deleteYoutubeCard.mutate` + reselect remaining[0] (CF :178-184).
- `handleAddSection()` → `const id = await addYoutubeCard.mutateAsync({ youtubeContentId, contentId, sortOrder: localCards.length })`; optimistic append blank card (with `user_id` from `getCurrentUserId().catch(()=>'')`, ThreadsPanel.tsx:214-237 pattern); `setSelectedCardId(id)`.
- `handleCopyAll()` → CF :197-212 verbatim (clipboard `[i] TYPE / 나레이션 / 화면 / 자막`, prefixed `# {video_title}`).
- `handlePrevCard/handleNextCard` (CF :214-219).

**Render** (CF :226-517, minus translation view + publish):
1. ~~`<ChannelTranslationView/>`~~ **omit**.
2. **Video Settings** collapsible (`showVideoSettings`): `Input` video_title, `select` target_duration (숏폼 1~3분 / 표준 5~10분 / 롱폼 15~30분 → `updateYoutubeContent({target_duration})`), `Input` video_tags (comma-split), `Textarea` video_description (CF :229-278). Use worktree `ui/input`, `ui/textarea`; raw `<select>` is fine (CF uses raw select).
3. **Action bar**: `{cards.length}개 씬` badge + `~{estimatedMinutes}분` badge; `GenerationButton variant="text"` label "AI 대본" loadingLabel "대본 생성 중..." disabled `!hasBaseArticle` className `bg-red-600 hover:bg-red-700 text-white` (CF's red youtube CTA); `GenerationButton variant="batch-image"` disabled `cards.length===0`; 미리보기 button (`Eye`); 복사 button (CF :280-325).
4. `!hasBaseArticle` → "기본 글을 먼저 작성해 주세요." (CF :328-330).
5. **Preview + Script Editor** (2-col `lg:grid-cols-5`, CF :333-469): left 3/5 = `ImageCardWidget` + section badge + prev/next nav (`selectedIndex+1 / cards.length`); right 2/5 = section-type `select` (`SECTION_TYPES`), `narration_text` textarea (auto-resize ref) + char count, `screen_direction` textarea, `subtitle_text` input, `image_prompt` textarea + per-scene 이미지 생성 button, `video_prompt` textarea. All wired through `handleCardUpdate`.
6. **Timeline** (CF :471-491): horizontal scroll of `TimelineCard` × N + `AddSceneButton` (when `hasBaseArticle`).
7. Empty state (cards.length===0 && hasBaseArticle): centered add button (CF :493-500).
8. Dialogs: `PromptEditDialog` (onConfirm), `YoutubePreviewDialog` (cards=localCards, videoTitle=youtubeContent.video_title).

### 6.4 Wire into `ContentTabs.tsx`

`components/content/ContentTabs.tsx`:
- Import `YoutubePanel`.
- Flip the `youtube` tab `active: false → true` in the `TABS` array (:22).
- Replace `<TabsContent value="youtube">…<ComingSoonPanel label="롱폼 (YouTube)"/></TabsContent>` (:141-143) with `<YoutubePanel content={content} project={project} />`.
- **`shorts` tab stays `active: false` + `<ComingSoonPanel label="숏폼"/>`** (:144-146) — unchanged (Non-Goals; faithful-port).

### 6.5 Exports

Add `YoutubePanel` to `components/content` (and `index.ts` if the module re-exports panels) following the existing export surface. `SECTION_TYPES`/`getSectionInfo`/`TimelineCard`/`AddSceneButton`/`YoutubePreviewDialog` are imported by `YoutubePanel` and need not be top-level exports.

---

## 7. AI prompt flow

Three builders, **already ported verbatim** in `lib/prompt-builder.ts` (no change needed):
- `buildYoutubePrompt(ctx & { youtubeContent? })` (:606-694) — duration-aware (`youtubeContent.target_duration ?? 'mid'` → short 3~5 / mid 5~8 / long 8~15 sections), emits the `{video_title, video_description, video_tags, sections[]}` JSON contract + section-type & writing rules + brand context + `youtube_tone_prompt` / `writing_guide_youtube` + base article body. **`baseArticle.body_plain_text` injection** lives here (:683-687).
- `buildYoutubeImagePrompt(project, card, imageStyle)` (:700-739) — still-image prompt from `subtitle_text` + section mood map + `youtube_image_style_prompt` + 16:9 + no-text + Korean-context.
- `buildYoutubeVideoPrompt(project, card, imageStyle)` (:745-792) — motion prompt from `screen_direction` + narration summary + section motion map.

**Parse + fill pattern** (mirror CardNewsPanel/ThreadsPanel `onComplete`): regex `\{[\s\S]*\}` → `JSON.parse` → guard `sections.length` → update content meta → **stamp `user_id`** → map to `YoutubeCard[]` **filling `image_prompt`/`video_prompt` from the two builders** → `setLocalCards` + `setYoutubeCards.mutateAsync`. The single difference vs cardnews: youtube also calls the two image/video builders during the map (CF :120-121); cardnews stored `image_prompt` straight from the model's `slide.image_prompt`.

The prompt is shown/edited in `PromptEditDialog` before send (user can tweak), then `generate(prompt, channelModels.textModel)` → `/api/mkt/ai/generate` SSE (no server change — generic text endpoint).

---

## 8. Image pipeline reuse

Per-scene + batch still images reuse the existing pipeline **unchanged**:
- `hooks/use-card-image-generation.ts` → `useImageGeneration` (`POST /api/mkt/ai/generate-image`, base64 PNG) → `convertToWebpBlob` → `uploadToR2({ projectId, category:'images', fileName:'{cardId}.webp', contentType:'image/webp', contentId:cardId })` → `onSave(cardId, publicUrl, prompt)`; R2-fail fallback = data URL.
- `components/content/ImageCardWidget.tsx` renders the scene image (zoom/regenerate/upload/download/delete; `onEdit` stays undefined per O-7). `aspectClass="aspect-video"` for 16:9.
- No `batch-image-store` for youtube — `generateAll` in the hook already sequences with abort + 3s gap (CF's youtube batch behavior).
- Server endpoints already exist (`/api/mkt/ai/generate-image`, `/storage/presign`, `/storage/proxy`) — **no server work in 1c**.

---

## 9. i18n note

YouTube language tabs follow Phase 1a/1b: `ContentTabs` already renders `LanguageSelector` from `project.target_languages`; the `youtube` tab is **not** Korean-only (unlike `blog`), so it shows under any language. **Translation generation is OUT (Phase 1d):** the translate action stays the existing stub `alert('번역은 곧 지원됩니다…')`. Do **not** port CF's `<ChannelTranslationView channel="youtube"/>` (no such component; that surface is 1d). No `buildYoutubeHtml`/`channel-translator` youtube wiring in 1c.

---

## 10. Risks & adaptations (R-series)

| id | risk / adaptation | resolution |
|---|---|---|
| **R-A** 🔴 | `YoutubeCard` TS type omits `user_id`, but `mkt_youtube_cards.user_id` is NOT NULL + RLS `with check`. CF never had user_id (Zustand). | Add `user_id: string` to `YoutubeCard`. Stamp it in `useAddYoutubeCard` (`getUserId()`), in the panel `onComplete` parser + `handleAddSection` (`getCurrentUserId()`), and pass user-id-bearing cards into `setYoutubeCards`. Same fix class as 1a/1b's R-9. **Highest-risk item.** |
| R-B | `useCardImageGeneration` worktree API ≠ CF API (`getModel`/`getAspectRatio`/`onSave`/`generateForCard`/`generateAll` vs CF `imageModel`/`saveResult`/`getExistingImage`/`generateCardImage`/`generateAllImages`). | Adapt per §6.3 (CardNewsPanel already shows the exact mapping). |
| R-C | `PromptEditDialog` worktree uses `onConfirm` (no `onGenerate`/`isGenerating`/`onAbort` dialog props). | Use `onConfirm={(p)=>generate(p, textModel)}` (§6.3). |
| R-D | `ChannelContentList.getTitle` is `(item)=>string` (no index), `onAdd` returns `Promise<string>`. | `getTitle = (yc)=> yc.title || '유튜브 대본'`; `onAdd` returns `mutateAsync` id. |
| R-E | CF inner renders `<ChannelTranslationView/>` and CF outer wires publish-queue. | Omit both (1d / no-publish-layer). |
| R-F | Write storm: CF wrote every keystroke to Zustand; DB can't. | O-F debounce (ThreadsPanel) for text fields; immediate persist for structural changes. |
| R-G | `setYoutubeCards` delete-all+insert is not transactional (delete succeeds, insert fails → empty list). | Acceptable parity with instagram/threads (same pattern); user re-runs 대본. Optionally wrap in a Postgres RPC later (out of 1c). |
| R-H | Local-mirror vs graph reconciliation flicker on refetch. | `prevIdRef`-keyed re-sync only on `youtubeContent.id` change (1b pattern) — avoids stomping live edits. |
| R-I | Tailwind JIT must see `SECTION_TYPES` color classes. | They are static string literals (`bg-red-500` …) in source → JIT picks them up; no dynamic concatenation. |

---

## 11. Error handling

- AI parse failure → `alert('대본 파싱 실패. 다시 시도해 주세요.')` (CF :130-132); generation error → `alert('AI 생성 오류: …')`.
- Image-gen failure surfaces via the shared hook's alert + R2→dataURL fallback (no crash).
- Supabase mutation errors throw `new Error(error.message)` in hooks (1a/1b convention); the panel relies on TanStack's default error surfacing + the `ChannelContentList` `ErrorBoundary` wrapper (`ChannelContentList.tsx:121-125`) around each expanded panel.
- Missing base article → generation button disabled (`disabled={!hasBaseArticle}`) + inline hint.

---

## 12. Testing strategy

**Pure-logic unit tests** (Vitest, mirror `lib/__tests__/prompt-builder.test.ts` + 1b `components/content/__tests__/*.helpers.test.ts`):
1. **estimated-minutes calc** — `Math.max(1, Math.round(totalChars/250))`: 0 chars→1, 250→1, 375→2, 750→3. Plus `TimelineCard` per-scene `Math.max(1, Math.round(chars/(250/60)))` seconds.
2. **`estimateReadingTime`** (preview dialog) — `<250` chars → "1분 미만"; `500` → "약 2분".
3. **JSON parse + card fill** — extract a `buildYoutubeCardsFromParsed(parsed, { youtubeContentId, userId, project, imageStyle, now })` pure helper from the `onComplete` body and test: correct `section_type` defaults (`||'main'`), `subtitle_text ?? null`, `sort_order = i`, `user_id` present on every card, `image_prompt`/`video_prompt` non-empty (built from the builders), `image_url:null`. Feed a malformed string → throws (caller alerts).
4. **section-type defaults** — `getSectionInfo(null)` / `getSectionInfo('unknown')` → the `main` entry; each known value → its entry.
5. **`buildYoutubePrompt` duration branches** — already covered by the ported prompt-builder test suite; add cases asserting short/mid/long section-count guidance strings appear (if not already present).

**Manual UI verification** (no component-render tests for the editor, per 1b precedent): create youtube version → AI 대본 (short/mid/long) → timeline renders color-coded scenes → edit section type/narration → per-scene image gen → batch image gen → preview dialog + 전체 복사 → reload (cards persist) → delete scene/version. Confirm `user_id` is set on inserted rows (Supabase row inspection — the R-A regression guard). Confirm `shorts` tab still shows 준비 중.

---

## 13. Implementation checklist (sequenced — for the plan)

1. **Types**: add `user_id: string` to `YoutubeCard` (`types/database.ts`). *(R-A)*
2. **Hooks**: create `api/use-youtube-contents.ts` (7 hooks) mirroring `use-instagram-contents.ts`, with `user_id` stamping on inserts. *(§5)*
3. **(optional) Index migration**: `supabase/migrations/2026-06-07-marketing-phase1c-indexes.sql`. *(§4.5)*
4. **Component**: `components/content/YoutubeCardItem.tsx` (`SECTION_TYPES`, `getSectionInfo`, `TimelineCard`, `AddSceneButton`) — verbatim port. *(§6.1)*
5. **Component**: `components/content/YoutubePreviewDialog.tsx` — verbatim port (worktree ui imports). *(§6.2)*
6. **Component**: `components/content/YoutubePanel.tsx` (`YoutubePanel` outer + `YoutubePanelInner`) — port + data-layer/API adaptations R-A…R-F. *(§6.3)*
7. **Wire**: `ContentTabs.tsx` — `youtube` `active:true` + render `<YoutubePanel/>`; leave `shorts` as `ComingSoonPanel`. *(§6.4)*
8. **Tests**: extract `buildYoutubeCardsFromParsed` + add `YoutubePanel`/`YoutubeCardItem`/preview pure-logic unit tests. *(§12)*
9. **Verify**: `pnpm --filter client typecheck` + new tests green; manual flow incl. `user_id` row check.
10. **Docs**: update `features/marketing/CLAUDE.md` channel table (유튜브 placeholder→완료, shorts→placeholder) + root CLAUDE.md `/marketing` line + memory `marketing-port-contentflow-2026-06-07.md`; commit.

---

## 14. Open questions

1. **`setYoutubeCards` atomicity (R-G)** — accept non-transactional delete+insert (instagram/threads parity), or invest in a Postgres RPC for all four channels? Recommendation: accept for 1c, revisit in a cross-channel hardening pass.
2. **`target_duration` default** — DDL has no default on `target_duration`; `useCreateYoutubeContent` should insert `'mid'` (CF UI default `?? 'mid'`). Confirm `'mid'` vs leaving NULL (builder already falls back to `'mid'`). Recommendation: insert `'mid'` explicitly for a stable select value.
3. **Unused content columns** (`video_category`, `thumbnail_url`, `video_url`, `youtube_video_id`) — leave NULL/untouched in 1c (reserved for a future publish phase). Confirm no UI for them now. (Assumed yes.)
