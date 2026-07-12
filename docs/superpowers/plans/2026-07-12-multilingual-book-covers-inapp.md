# Multilingual Book Covers (In-App) Implementation Plan — Plan #1

> **상태(2026-07-12): 구현 완료** (`feat/multilingual-covers`, 미배포). Chunk 1–4 전부 구현·리뷰 통과. 실행 단계에서 **접근 B로 전환**(vi/th/zh 제목을 클린 표지에 구워 `primaryCoverByLang` 등록 — 런타임 오버레이 아님). 배치 파이프라인·결과(103/149 완비)·거부 46권 재시도 TODO → memory `multilingual-cover-images-2026-07-12`. Plan #2(OG/SEO)는 미착수.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace baked-in-Korean-title book covers with text-free "clean" covers plus a per-language title overlay, so every in-app cover surface shows the viewer's-language title.

**Architecture:** A generation script produces text-free clean covers (per book × art-style) with an automatic fidelity gate and stores their URLs on the Storybook R2 record. `toSummary` + the client `summaryToEntry` adapter propagate those URLs. A single `<BookCover>` design-system component resolves the clean cover + localized title and renders the confirmed glass "Jua" pill overlay on standalone surfaces (BookDetail hero, continuous thumbnails) while caption-bearing cards render the clean cover with an already-localized caption and no overlay. A legacy fallback (raw `coverImage`, no overlay) keeps every surface working before/while clean covers are generated.

**Tech Stack:** TypeScript, React 18 + Vite + Tailwind (client), Express + tsx (server), Gemini image edit + vision (`gemini.provider`), Cloudflare R2 (`r2.provider`), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-12-multilingual-book-covers-design.md`

**Branch/worktree:** Implement on `feat/multilingual-covers` (isolated worktree `.worktrees/multilingual-covers`) — a concurrent session is committing i18n title-*text* work to `claude/nostalgic-elgamal-985947`; that caption-text localization is intentionally out of scope here (this plan covers the cover *image* + overlay). Rebase onto that branch before final merge.

**Out of scope (→ Plan #2):** OG/SEO composite endpoint (`/api/og/book/:id.png`), server-side TTF bundle, BookSeoPage/SSR wiring. This plan is in-app only (spec Phases 1–3).

---

## Confirmed overlay spec (from design)

- Position: top-center pill. Background: glassmorphism — `backdrop-blur(12px)` + dark tint **rgba(22,16,11,0.46)** (strong) + 1px `rgba(255,255,255,0.30)` border + inset top highlight.
- Text: **white**, centered, `word-break: keep-all`, wraps to 2 lines, subtle `text-shadow: 0 2px 6px rgba(0,0,0,.35)`.
- Fonts per language (see `cover-fonts.ts`): ko=Jua, latin(en/es/fr/de/ms/id/vi)=Baloo 2, zh=ZCOOL KuaiLe, ja=Noto Sans JP, th=Noto Sans Thai.

## File Structure

**Create**
- `packages/shared/src/constants/cover-fonts.ts` — canonical `lang → { family }` map (single source of truth; Plan #2 server reuses).
- `packages/client/src/lib/cover-fonts.test.ts` — test for the shared util. ⚠️ **`packages/shared` has no test runner** (no vitest dep/config/`test` script). Client & server vitest both alias `@tangobook/shared`, so the test lives in `client` and imports from `@tangobook/shared`.
- `packages/client/src/design-system/primitives/BookCover.tsx` — the shared cover component.
- `packages/client/src/design-system/primitives/BookCover.test.tsx`
- `packages/client/src/design-system/primitives/bookCover.util.ts` — pure prop-normalization + resolution helpers.
- `packages/client/src/design-system/primitives/bookCover.util.test.ts`
- `packages/server/scripts/generate-clean-covers.ts` — ported + generalized generation script.
- `packages/server/src/services/covers/clean-cover.ts` — pure helpers (target resolution, key building, fidelity-gate parsing). ⚠️ Under `src/` (not `scripts/lib/`) because server vitest only collects `src/**/*.test.ts` + `scripts/**/*.test.mjs` — a `scripts/**/*.test.ts` would never run.
- `packages/server/src/services/covers/clean-cover.test.ts`

**Modify**
- `packages/shared/src/types/storybook.ts` — add `cleanCoverImage?` to `StyleAssets` + `Storybook`; add `cleanCoverImage?` + `cleanCoversByStyle?` to `StorybookSummary`.
- `packages/shared/src/types/book-v2.ts` — add `cleanCoverImageUrl?` + `cleanCoversByStyle?` to `BookIndexEntry`.
- `packages/server/src/repositories/r2.repository.ts` — `toSummary` emits the new clean fields (mirror the `coversByStyle`/`coverImage` logic).
- `packages/client/src/pages/LibraryPage.tsx` — `summaryToEntry` maps the new fields; `applyGenreCover` also swaps clean cover per style.
- `packages/client/src/index.css` — add Google Fonts `@import` for the 5 overlay fonts.
- `packages/client/tailwind.config.ts` — add `fontFamily` tokens for overlay fonts.
- Cover display sites (Chunk 4): `features/library/components/BookCard.tsx`, `pages/BookDetailPage.tsx`, `features/continuous/components/BookMultiSelectGrid.tsx`, `features/continuous/pages/ContinuousBuilder.tsx`, `features/continuous/pages/ContinuousHomePage.tsx`, `features/continuous/components/PlaylistLibrarySection.tsx`, `features/learning/components/RecentBooksStrip.tsx`.

---

## Chunk 1: Data model + fonts

### Task 1: Add clean-cover font mapping (shared)

**Files:**
- Create: `packages/shared/src/constants/cover-fonts.ts`
- Test: `packages/client/src/lib/cover-fonts.test.ts` (in client — shared has no test runner)

- [ ] **Step 1: Write the failing test** (in `packages/client/src/lib/cover-fonts.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { coverTitleFont } from '@tangobook/shared';

describe('coverTitleFont', () => {
  it('maps ko to Jua', () => {
    expect(coverTitleFont('ko').family).toBe('Jua');
  });
  it('maps latin languages (en/es/fr/de/ms/id/vi) to Baloo 2', () => {
    for (const l of ['en', 'es', 'fr', 'de', 'ms', 'id', 'vi']) {
      expect(coverTitleFont(l).family).toBe('Baloo 2');
    }
  });
  it('maps zh to ZCOOL KuaiLe, ja to Noto Sans JP, th to Noto Sans Thai', () => {
    expect(coverTitleFont('zh').family).toBe('ZCOOL KuaiLe');
    expect(coverTitleFont('ja').family).toBe('Noto Sans JP');
    expect(coverTitleFont('th').family).toBe('Noto Sans Thai');
  });
  it('falls back to Baloo 2 for unknown languages', () => {
    expect(coverTitleFont('xx').family).toBe('Baloo 2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tangobook/client test -- cover-fonts`
Expected: FAIL (`coverTitleFont` not exported from `@tangobook/shared`).

- [ ] **Step 3: Write minimal implementation**

```ts
// Canonical cover-title font per language. Single source of truth shared by the
// in-app CSS overlay and (Plan #2) the server-side OG TTF bundle. Add one row per
// new SUPPORTED_LANGUAGES entry; unknown languages fall back to the Latin font.
export interface CoverFont {
  /** CSS/OG font-family name (must match the loaded webfont + bundled TTF). */
  family: string;
}

const LATIN = 'Baloo 2';
const BY_LANG: Record<string, string> = {
  ko: 'Jua',
  en: LATIN, es: LATIN, fr: LATIN, de: LATIN, ms: LATIN, id: LATIN, vi: LATIN,
  zh: 'ZCOOL KuaiLe',
  ja: 'Noto Sans JP',
  th: 'Noto Sans Thai',
};

export function coverTitleFont(lang: string): CoverFont {
  return { family: BY_LANG[lang] ?? LATIN };
}

/** All distinct families — used to build the webfont @import / server TTF bundle. */
export const COVER_FONT_FAMILIES: string[] = [...new Set(Object.values(BY_LANG))];
```

- [ ] **Step 4: Export from shared barrel** (before re-running — the test imports from `@tangobook/shared`)

Add `export * from './constants/cover-fonts';` to `packages/shared/src/constants/index.ts` (follow existing export style; confirm `constants/index.ts` is re-exported from `packages/shared/src/index.ts`).

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @tangobook/client test -- cover-fonts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/constants/cover-fonts.ts packages/shared/src/constants/index.ts packages/client/src/lib/cover-fonts.test.ts
git commit -m "feat(covers): shared per-language cover-title font map"
```

### Task 2: Add clean-cover fields to types

**Files:**
- Modify: `packages/shared/src/types/storybook.ts` (StyleAssets ~792, Storybook top-level `coverImage` ~923, StorybookSummary ~1144–1176)
- Modify: `packages/shared/src/types/book-v2.ts` (BookIndexEntry ~292–297)

- [ ] **Step 1: Add fields (no test — type-only change, verified by typecheck + Task 3 test)**

In `StyleAssets` (near `coverImage?: string;`):
```ts
  /** 텍스트 제거한 클린 표지 (다국어 오버레이 베이스). generate-clean-covers.ts 산출. */
  cleanCoverImage?: string;
```
In `Storybook` (near top-level `coverImage`): add the same `cleanCoverImage?: string;` (active/representative-style mirror).
In `StorybookSummary` (after `coversByStyle`/`coversByLang`):
```ts
  /** 대표 그림체 클린 표지 (다국어 오버레이 베이스). 없으면 클라가 coverImage 폴백. */
  cleanCoverImage?: string;
  /** 그림체별 클린 표지 URL 맵 (`coversByStyle`와 짝). */
  cleanCoversByStyle?: Record<string, string>;
```
In `BookIndexEntry` (`book-v2.ts`, after `coversByStyle`):
```ts
  /** 클린 표지 URL (다국어 오버레이 베이스). summaryToEntry 가 summary.cleanCoverImage 에서 채움. */
  cleanCoverImageUrl?: string;
  /** 그림체별 클린 표지 URL 맵. */
  cleanCoversByStyle?: Record<string, string>;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @tangobook/shared typecheck`
Expected: PASS (all fields optional, backward compatible).

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/storybook.ts packages/shared/src/types/book-v2.ts
git commit -m "feat(covers): add optional cleanCover fields to types"
```

### Task 3: Emit clean fields from `toSummary`

**Files:**
- Modify: `packages/server/src/repositories/r2.repository.ts` (`toSummary` ~77–169)
- Test: `packages/server/src/repositories/r2.repository.toSummary.test.ts` (create; if a toSummary test already exists, add cases there instead)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { __toSummaryForTest as toSummary } from './r2.repository';
// If toSummary is not exported, export it under a test-only alias in Step 3.

const base = {
  id: 'b1', title: '개구리 왕자', type: 'storybook', createdAt: '2026-01-01T00:00:00Z',
  artStyle: 'styleA', defaultStyle: 'styleA', availableStyles: ['styleA', 'styleB'],
  coverImage: 'https://r2/a-cover.webp',
  cleanCoverImage: 'https://r2/a-clean.webp',
  styleAssets: {
    styleB: { coverImage: 'https://r2/b-cover.webp', cleanCoverImage: 'https://r2/b-clean.webp' },
  },
  pages: [], key_objects: [],
} as any;

describe('toSummary cleanCover', () => {
  it('emits representative cleanCoverImage + per-style map', () => {
    const s = toSummary(base);
    expect(s.cleanCoverImage).toBe('https://r2/a-clean.webp');
    expect(s.cleanCoversByStyle).toEqual({
      styleA: 'https://r2/a-clean.webp',
      styleB: 'https://r2/b-clean.webp',
    });
  });
  it('omits clean fields when no clean covers exist', () => {
    const s = toSummary({ ...base, cleanCoverImage: undefined, styleAssets: {} });
    expect(s.cleanCoverImage).toBeUndefined();
    expect(s.cleanCoversByStyle).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tangobook/server test -- toSummary`
Expected: FAIL (fields undefined / not exported).

- [ ] **Step 3: Implement in `toSummary`**

Mirror the existing `coversByStyle` block. After the `coversByStyle` construction (~line 129), add:
```ts
  const cleanCoversByStyle: Record<string, string> = {};
  if (sb.artStyle && sb.cleanCoverImage) cleanCoversByStyle[sb.artStyle] = sb.cleanCoverImage;
  for (const [style, assets] of Object.entries(sb.styleAssets ?? {})) {
    const url = assets?.cleanCoverImage;
    if (url && !cleanCoversByStyle[style]) cleanCoversByStyle[style] = url;
  }
  const cleanCoverImageOut = cleanCoversByStyle[targetStyle ?? ''] ?? sb.cleanCoverImage;
```
In the returned object (near `coversByStyle:` ~162):
```ts
    cleanCoverImage: cleanCoverImageOut,
    cleanCoversByStyle:
      Object.keys(cleanCoversByStyle).length > 0 ? cleanCoversByStyle : undefined,
```
If `toSummary` is not already exported, add at end of file: `export { toSummary as __toSummaryForTest };`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tangobook/server test -- toSummary`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/repositories/r2.repository.ts packages/server/src/repositories/r2.repository.toSummary.test.ts
git commit -m "feat(covers): toSummary emits clean cover fields"
```

### Task 4: Load overlay fonts + Tailwind tokens

**Files:**
- Modify: `packages/client/src/index.css` (after line 5)
- Modify: `packages/client/tailwind.config.ts` (`fontFamily` ~6–17)

- [ ] **Step 1: Add font import to `index.css`**

```css
/* Cover-title overlay fonts (per-language, see shared/cover-fonts.ts) */
@import url('https://fonts.googleapis.com/css2?family=Jua&family=Baloo+2:wght@700;800&family=ZCOOL+KuaiLe&family=Noto+Sans+JP:wght@700;900&family=Noto+Sans+Thai:wght@700;900&display=swap');
```

- [ ] **Step 2: Add Tailwind fontFamily tokens**

In `tailwind.config.ts` `fontFamily`, add:
```ts
  'cover-ko': ['Jua', 'sans-serif'],
  'cover-latin': ['"Baloo 2"', 'sans-serif'],
  'cover-zh': ['"ZCOOL KuaiLe"', 'sans-serif'],
  'cover-ja': ['"Noto Sans JP"', 'sans-serif'],
  'cover-th': ['"Noto Sans Thai"', 'sans-serif'],
```

- [ ] **Step 3: Verify dev build picks up tokens**

Run: `pnpm --filter @tangobook/client build`
Expected: build succeeds (Tailwind JIT recognizes new `font-cover-*` classes once used in Chunk 2).

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/index.css packages/client/tailwind.config.ts
git commit -m "feat(covers): load overlay fonts + tailwind tokens"
```

---

## Chunk 2: `<BookCover>` component

### Task 5: Prop-normalization util (pure, TDD)

**Files:**
- Create: `packages/client/src/design-system/primitives/bookCover.util.ts`
- Test: `packages/client/src/design-system/primitives/bookCover.util.test.ts`

Handles the `StorybookSummary` (`coverImage`/`cleanCoverImage`) vs `BookIndexEntry` (`coverImageUrl`/`cleanCoverImageUrl`) field-name mismatch (spec §4).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { resolveCover } from './bookCover.util';

const summary = {
  title: '개구리 왕자',
  titleTranslations: { en: 'The Frog Prince' },
  coverImage: 'legacy.webp',
  cleanCoverImage: 'clean.webp',
  cleanCoversByStyle: { styleB: 'cleanB.webp' },
  coversByStyle: { styleB: 'legacyB.webp' },
} as any;

describe('resolveCover', () => {
  it('prefers per-style clean cover, then representative clean, then legacy', () => {
    expect(resolveCover(summary, { style: 'styleB' }).img).toBe('cleanB.webp');
    expect(resolveCover(summary, {}).img).toBe('clean.webp');
    const noClean = { ...summary, cleanCoverImage: undefined, cleanCoversByStyle: undefined };
    expect(resolveCover(noClean, { style: 'styleB' }).img).toBe('legacyB.webp');
    expect(resolveCover(noClean, {}).img).toBe('legacy.webp');
  });
  it('marks hasClean=false on legacy fallback (overlay must be suppressed)', () => {
    const noClean = { ...summary, cleanCoverImage: undefined, cleanCoversByStyle: undefined };
    expect(resolveCover(summary, {}).hasClean).toBe(true);
    expect(resolveCover(noClean, {}).hasClean).toBe(false);
  });
  it('localizes title via titleTranslations[lang] with ko fallback', () => {
    expect(resolveCover(summary, { lang: 'en' }).title).toBe('The Frog Prince');
    expect(resolveCover(summary, { lang: 'zh' }).title).toBe('개구리 왕자');
  });
  it('normalizes BookIndexEntry field names', () => {
    const entry = { title: 'X', coverImageUrl: 'l.webp', cleanCoverImageUrl: 'c.webp' } as any;
    const r = resolveCover(entry, {});
    expect(r.img).toBe('c.webp');
    expect(r.hasClean).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tangobook/client test -- bookCover.util`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import type { StorybookSummary, BookIndexEntry } from '@tangobook/shared';

export type CoverInput = Partial<StorybookSummary> & Partial<BookIndexEntry> & {
  title: string;
  titleTranslations?: Record<string, string>;
};

export interface ResolvedCover {
  img?: string;
  hasClean: boolean;
  title: string;
}

export function resolveCover(
  book: CoverInput,
  opts: { style?: string; lang?: string }
): ResolvedCover {
  const cleanByStyle = book.cleanCoversByStyle ?? {};
  const clean =
    (opts.style ? cleanByStyle[opts.style] : undefined) ??
    book.cleanCoverImage ??
    book.cleanCoverImageUrl;
  const legacyByStyle = book.coversByStyle ?? {};
  const legacy =
    (opts.style ? legacyByStyle[opts.style] : undefined) ??
    book.coverImage ??
    book.coverImageUrl;
  const title = (opts.lang && book.titleTranslations?.[opts.lang]) || book.title;
  return { img: clean ?? legacy, hasClean: !!clean, title };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tangobook/client test -- bookCover.util`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/design-system/primitives/bookCover.util.ts packages/client/src/design-system/primitives/bookCover.util.test.ts
git commit -m "feat(covers): BookCover cover/title resolution util"
```

### Task 6: `<BookCover>` component (TDD)

**Files:**
- Create: `packages/client/src/design-system/primitives/BookCover.tsx`
- Test: `packages/client/src/design-system/primitives/BookCover.test.tsx`
- Modify: `packages/client/src/design-system/primitives/index.ts` (add export — follow existing barrel pattern, see how `Mascot` is exported)

Reference the RTL style used in `packages/client/src/design-system/primitives/Mascot.test.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookCover } from './BookCover';

const book = {
  title: '개구리 왕자',
  titleTranslations: { en: 'The Frog Prince' },
  coverImage: 'legacy.webp',
  cleanCoverImage: 'clean.webp',
} as any;

describe('BookCover', () => {
  it('renders clean cover img with localized alt', () => {
    render(<BookCover book={book} lang="en" overlayTitle />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('clean.webp');
    expect(img.alt).toBe('The Frog Prince');
  });
  it('shows overlay title text when overlayTitle + clean cover present', () => {
    render(<BookCover book={book} lang="en" overlayTitle />);
    expect(screen.getByText('The Frog Prince')).toBeInTheDocument();
  });
  it('suppresses overlay on legacy fallback (no clean cover)', () => {
    const legacyOnly = { ...book, cleanCoverImage: undefined };
    render(<BookCover book={legacyOnly} lang="en" overlayTitle />);
    // legacy fallback: no title text overlaid (avoid Korean-on-image)
    expect(screen.queryByText('The Frog Prince')).not.toBeInTheDocument();
    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('legacy.webp');
  });
  it('does not render overlay text when overlayTitle=false (caption surfaces)', () => {
    render(<BookCover book={book} lang="ko" overlayTitle={false} />);
    expect(screen.queryByText('개구리 왕자')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tangobook/client test -- BookCover`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { cn } from '@/lib/cn';
import { resolveCover, type CoverInput } from './bookCover.util';

const FONT_CLASS: Record<string, string> = {
  ko: 'font-cover-ko', zh: 'font-cover-zh', ja: 'font-cover-ja', th: 'font-cover-th',
};
const coverFontClass = (lang: string) => FONT_CLASS[lang] ?? 'font-cover-latin';

export interface BookCoverProps {
  book: CoverInput;
  lang: string;
  style?: string;
  /** true = standalone surface (render glass title pill); false = caption surface. */
  overlayTitle?: boolean;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
}

/** 표지 단일 진입점 — 클린 표지 + (옵션) 글래스 제목 오버레이. 클린 없으면 레거시 표지(오버레이 X). */
export function BookCover({
  book, lang, style, overlayTitle = false, className, imgClassName, loading = 'lazy',
}: BookCoverProps) {
  const { img, hasClean, title } = resolveCover(book, { style, lang });
  const showOverlay = overlayTitle && hasClean;
  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {img ? (
        <img
          src={img}
          alt={title}
          className={cn('w-full h-full object-cover', imgClassName)}
          loading={loading}
          decoding="async"
          key={img}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-200 to-peach-300 text-5xl">📖</div>
      )}
      {showOverlay && (
        <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-max max-w-[88%] z-[3]">
          <div
            className="rounded-[22px] px-6 py-2 border border-white/30 backdrop-blur-md"
            style={{ background: 'rgba(22,16,11,0.46)', boxShadow: '0 6px 18px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.28)' }}
          >
            <span
              className={cn('block text-center text-white leading-[1.12] break-keep', coverFontClass(lang))}
              style={{ textShadow: '0 2px 6px rgba(0,0,0,.35)', fontSize: 'clamp(13px, 4.2cqw, 34px)' }}
            >
              {title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```
Note: overlay font-size uses `cqw` (container query units); add `containerType: 'inline-size'` to the wrapper via `style={{ containerType: 'size' }}` on the root `div` so the pill scales with card vs hero size. If container queries are undesired, fall back to a `size` prop (`'card' | 'hero'`) mapping to fixed font sizes — keep it simple and pick one; the tests above don't assert font size.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tangobook/client test -- BookCover`
Expected: PASS.

- [ ] **Step 5: Export + commit**

Add `export * from './BookCover';` (or named export line matching the barrel style) to `primitives/index.ts`.
```bash
git add packages/client/src/design-system/primitives/BookCover.tsx packages/client/src/design-system/primitives/BookCover.test.tsx packages/client/src/design-system/primitives/index.ts
git commit -m "feat(covers): BookCover component with glass title overlay"
```

---

## Chunk 3: Clean cover generation script + fidelity gate

### Task 7: Pure script helpers (TDD)

**Files:**
- Create: `packages/server/src/services/covers/clean-cover.ts` (under `src/` so vitest collects it)
- Test: `packages/server/src/services/covers/clean-cover.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { pickStyleCovers, buildCleanKey, parseGateVerdict } from './clean-cover';

describe('clean-cover helpers', () => {
  it('pickStyleCovers returns (style,url) for active + styleAssets', () => {
    const sb = {
      artStyle: 'A', coverImage: 'a.webp',
      styleAssets: { B: { coverImage: 'b.webp' }, C: { coverImages: [{ imageUrl: 'c.webp' }] } },
    } as any;
    expect(pickStyleCovers(sb)).toEqual([
      { style: 'A', url: 'a.webp' },
      { style: 'B', url: 'b.webp' },
      { style: 'C', url: 'c.webp' },
    ]);
  });
  it('buildCleanKey is deterministic per (id,style) with a ts', () => {
    expect(buildCleanKey('bk1', 'A', 123)).toBe('covers/clean/bk1-A-123.webp');
  });
  it('parseGateVerdict passes only when subject/composition same AND no text', () => {
    expect(parseGateVerdict({ sameSubject: true, textRemains: false }).pass).toBe(true);
    expect(parseGateVerdict({ sameSubject: false, textRemains: false }).pass).toBe(false);
    expect(parseGateVerdict({ sameSubject: true, textRemains: true }).pass).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tangobook/server test -- clean-cover`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
export interface StyleCover { style: string; url: string; }

export function pickStyleCovers(sb: any): StyleCover[] {
  const pick = (a: any): string | undefined =>
    a?.coverImage ?? a?.coverImages?.find((c: any) => c.imageUrl)?.imageUrl;
  const out: StyleCover[] = [];
  const active = pick({ coverImage: sb.coverImage, coverImages: sb.coverImages });
  if (sb.artStyle && active) out.push({ style: sb.artStyle, url: active });
  for (const [style, assets] of Object.entries(sb.styleAssets ?? {})) {
    if (out.some((s) => s.style === style)) continue;
    const url = pick(assets);
    if (url) out.push({ style, url });
  }
  return out;
}

export function buildCleanKey(id: string, style: string, ts: number): string {
  return `covers/clean/${id}-${style}-${ts}.webp`;
}

export interface GateVerdict { pass: boolean; reason?: string; }
export function parseGateVerdict(v: { sameSubject: boolean; textRemains: boolean; reason?: string }): GateVerdict {
  return { pass: v.sameSubject && !v.textRemains, reason: v.reason };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tangobook/server test -- clean-cover`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/covers/clean-cover.ts packages/server/src/services/covers/clean-cover.test.ts
git commit -m "feat(covers): pure helpers for clean-cover generation"
```

### Task 8: Generation script (port + generalize)

**Files:**
- Create: `packages/server/scripts/generate-clean-covers.ts`
- Reference (read-only): `git show feat/nature-reels:packages/server/scripts/generate-clean-covers.ts` — port structure (dotenv, `coverToPngBase64` via `sharp`, `withRetry`, `uploadBase64ToR2`, arg parsing).

No unit test (external Gemini/R2 calls). Verify by `--dry-run` on one book. Structure it around Task 7 helpers.

**Persistence & listing — use the in-process typed `R2Repository` (NOT the `.mjs`/HTTP path):**
- List targets: `new R2Repository().listStorybooks()` (`r2.repository.ts:224`) then load each full book via the repo's get method — same in-process source `toSummary` feeds. Do NOT `GET /api/storybooks` (needs a running server) and do NOT import `translation-core.mjs` (untyped → typecheck risk).
- Save mutated book: `R2Repository.saveStorybook(book)` (`r2.repository.ts:260`). Note it runs title-collision validation; for an in-place cover-field update of an existing book (unchanged title) this is a no-op collision-wise. Confirm by reading `saveStorybook` before the real run.

**Fidelity-gate vision call — no ready helper exists.** `generateTextWithGemini` is text-only; there is no multimodal wrapper. Hand-write it following the multimodal pattern already inside `generateImageWithGemini` (`gemini.provider.ts:78-84`): build `contents` with two `inlineData` image parts (original + clean, base64/png) + a text part that forces JSON, e.g. via `getAI().models.generateContent({ model, contents, config: { responseMimeType: 'application/json' } })`. Prompt: "Compare ORIGINAL vs EDITED children's book cover. Return JSON {sameSubject:boolean, textRemains:boolean, reason:string}. sameSubject=false if the main subject, composition, or framing changed at all; textRemains=true if ANY letters/numbers/sticker graphics remain." Parse with `parseGeminiJSON` (existing util) → `parseGateVerdict` (Task 7).

- [ ] **Step 1: Write the script**

Key differences from the ported original:
- **Targets**: iterate all storybooks that are public + have a cover (spec §7 "공개·표지보유"). Get the list via the existing storybook list repository (same source `toSummary` iterates in `r2.repository.ts`); filter `isPublic !== false && koCompletion?.cover`. Do NOT depend on `resolveNatureBookIds` (absent on this branch).
- **Per (book × style)** using `pickStyleCovers(sb)` (Task 7). Skip a (book,style) if `styleAssets[style].cleanCoverImage` (or top-level for active) already set, unless `--force`.
- **Strengthened prompt** (fidelity):
```
Edit this children's book cover. Remove ALL text and every decorative title/sticker graphic. CRITICAL: do NOT reinterpret, re-crop, restyle, or redraw the scene — keep the exact same main subject, composition, framing, colors, lighting and perspective. Only erase the text/stickers and seamlessly reconstruct the background that was behind them, matching the surrounding art. The result must be the identical illustration minus text, wide 16:9, with absolutely no letters/numbers/sticker graphics anywhere.
```
- **Fidelity gate**: after generation, call Gemini vision with (original, clean) and a JSON-forced prompt returning `{ sameSubject: boolean, textRemains: boolean, reason: string }`; feed to `parseGateVerdict`. On fail → retry generation with an even stricter prefix (`--retries`, default 2). On final fail → push `{ id, style, reason }` to a review report array.
- **On pass**: `uploadBase64ToR2(out, buildCleanKey(id, style, Date.now()))` → write URL into the storybook record: `styleAssets[style].cleanCoverImage`, and if `style === sb.artStyle` also top-level `sb.cleanCoverImage`. Persist via `R2Repository.saveStorybook(book)` (see Persistence note above). Idempotent (skip if field already set unless `--force`).
- **Flags**: `--book=<id>`, `--style=<id>`, `--force`, `--dry-run` (writes to `out/clean-covers/`, no R2/record), `--limit=N`, `--retries=N`.
- **Output**: at end, print summary `{ ok, skip, fail }` and write flagged failures to `out/clean-covers-review.json`.

- [ ] **Step 2: Dry-run a single book**

Run: `pnpm --filter @tangobook/server exec tsx scripts/generate-clean-covers.ts --book=<a-known-public-classic-id> --dry-run`
Expected: writes `out/clean-covers/<id>-<style>-clean.png` for each style; console shows gate verdict per style; no R2 writes.

- [ ] **Step 3: Eyeball fidelity**

Open the dry-run PNG(s); confirm the subject/composition matches the original and text is gone. If the gate passed a reinterpreted image or failed a good one, tune the prompt/gate prompt and re-run. (Manual gate — expected part of the workflow.)

- [ ] **Step 4: Commit**

```bash
git add packages/server/scripts/generate-clean-covers.ts
git commit -m "feat(covers): clean-cover generation script with fidelity gate"
```

- [ ] **Step 5: Real run — representative style, all public books**

Run: `pnpm --filter @tangobook/server exec tsx scripts/generate-clean-covers.ts --limit=5` (smoke), then full run without `--limit`.
Expected: R2 uploads + storybook records updated; `out/clean-covers-review.json` lists any flagged books. Manually review flagged ones; re-run those with tuned prompt or hand-fix. (This is the spec Phase 1 + Phase 3 batch fill — per-style covers are produced in the same loop since `pickStyleCovers` yields all styles.)

---

## Chunk 4: Wire `<BookCover>` into display surfaces

For each surface: replace the raw cover `<img>` (and gradient/placeholder wrapper) with `<BookCover>`. `lang` = current UI language (`i18n.language` from `useTranslation`) for caption surfaces, or the selected content language where the surface has one (BookDetail). `overlayTitle` per spec §D5.

### Task 9: Caption surfaces (overlay OFF) — library card + learning strip

**Files:**
- Modify: `packages/client/src/pages/LibraryPage.tsx` (`summaryToEntry` ~39–56, `applyGenreCover` ~265–270)
- Modify: `packages/client/src/features/library/components/BookCard.tsx` (img ~40–52)
- Modify: `packages/client/src/features/learning/components/RecentBooksStrip.tsx` (cover img)

- [ ] **Step 0: Plumb clean fields through the client adapter** (required — BookCard reads them off `BookIndexEntry`)

In `summaryToEntry` (LibraryPage.tsx) add to the returned entry:
```ts
    cleanCoverImageUrl: s.cleanCoverImage,
    cleanCoversByStyle: s.cleanCoversByStyle,
```
In `applyGenreCover` (which swaps `coverImageUrl` to a selected 그림풍 style) also swap the clean cover so the previewed style's clean cover is used:
```ts
    for (const [styleId, url] of Object.entries(b.coversByStyle ?? {})) {
      if (/* style matches selected genre — keep existing condition */) {
        return {
          ...b,
          coverImageUrl: url,
          cleanCoverImageUrl: b.cleanCoversByStyle?.[styleId] ?? b.cleanCoverImageUrl,
        };
      }
    }
```
(Match the existing loop/condition already in `applyGenreCover`; only add the `cleanCoverImageUrl` line.)

- [ ] **Step 1: BookCard** — replace the `{coverUrl ? <img/> : '📖'}` block inside the `aspect-video` div with:
```tsx
<BookCover book={book} lang={i18n.language} overlayTitle={false} imgClassName="group-hover:scale-[1.02] transition-transform" />
```
Keep the existing badges (`status`, free, lock) and the localized `<h3>{displayTitle}</h3>` caption (already localized by the concurrent i18n work). Remove the now-unused local `coverUrl` if nothing else uses it. Import `BookCover` from `@/design-system`.

- [ ] **Step 2: RecentBooksStrip** — same pattern (overlay OFF); ensure any adjacent title text uses `titleTranslations[i18n.language] ?? title`.

- [ ] **Step 3: Verify in browser (see @superpowers:verification-before-completion / the `run` skill)**

Run the client, set UI language to `zh`, open `/library`. Expected: card images are text-free clean covers (once generated) with localized `<h3>` captions; no baked Korean title; legacy books (no clean cover yet) still show their old cover unbroken.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/library/components/BookCard.tsx packages/client/src/features/learning/components/RecentBooksStrip.tsx
git commit -m "feat(covers): use BookCover on caption surfaces (library card, learning strip)"
```

### Task 10: Standalone surfaces (overlay ON) — BookDetail hero + continuous thumbnails

**Files:**
- Modify: `packages/client/src/pages/BookDetailPage.tsx` (hero cover ~425–441)
- Modify: `packages/client/src/features/continuous/components/BookMultiSelectGrid.tsx` (~150–168)
- Modify: `packages/client/src/features/continuous/pages/ContinuousBuilder.tsx`, `ContinuousHomePage.tsx`, `PlaylistLibrarySection.tsx` (set-thumbnail images)

- [ ] **Step 1: BookDetailPage hero** — replace the `coverUrl ? <img/> : <missing/>` block with:
```tsx
<BookCover book={storybook} lang={lang} style={effectiveStyle} overlayTitle
  className="rounded-3xl shadow-card" />
```
`lang` here is the page's selected content language (already computed). This also fixes the spec §4 note that the hero title never localized — the overlay now shows `titleTranslations[lang] ?? title`. Keep the missing-cover branch by letting `BookCover`'s built-in placeholder handle it (or pass a `fallback` node). Remove now-dead `coverUrl` cover-image branch if unused elsewhere (it is still used by `PaywallNotice coverUrl={coverUrl}` — keep `coverUrl` computed for that, or pass `resolveCover(...).img`).

- [ ] **Step 2: Continuous thumbnails** — replace each cover `<img>` with `<BookCover ... overlayTitle style={selectedGenreStyle} lang={i18n.language} />`. These currently compute `coverImage`/`coversByStyle` per selected 그림풍 — pass that `style` through so the clean cover matches the previewed style.

- [ ] **Step 3: Verify in browser**

Open `/library/:id` (a generated classic) in `zh`, toggle language/style. Expected: hero shows clean cover + glass Jua/ZCOOL pill with the selected language's title; switching style swaps to that style's clean cover; switching language re-renders the pill text. Open `/continuous/new` — set thumbnails show clean cover + overlay.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/pages/BookDetailPage.tsx packages/client/src/features/continuous/
git commit -m "feat(covers): use BookCover with overlay on hero + continuous thumbnails"
```

### Task 11: Full verification + typecheck sweep

- [ ] **Step 1:** `pnpm typecheck` — Expected: PASS across shared/server/client.
- [ ] **Step 2:** `pnpm --filter @tangobook/client test && pnpm --filter @tangobook/server test` — Expected: PASS (new + existing). (No `shared test` — shared has no test runner; its util is covered by the client test in Task 1 and by `pnpm --filter @tangobook/shared typecheck`.)
- [ ] **Step 3:** Browser sweep per @verify: `/library`, `/library/:id`, `/continuous/new`, learning report — in `ko` and one non-`ko` (`zh`). Confirm: generated books show clean cover + (where applicable) localized overlay; non-generated books fall back cleanly; no baked Korean titles on standalone surfaces for non-ko.
- [ ] **Step 4: Final commit** (if any sweep fixes)

```bash
git commit -am "fix(covers): verification sweep fixes"
```

---

## Notes for the implementer

- **Legacy fallback is load-bearing**: until Chunk 3 has run for a book, `<BookCover>` shows its old `coverImage` with NO overlay. This is intentional and must not throw. Never overlay a title on a legacy (still-Korean-baked) cover.
- **Caption vs overlay** is the core rule: if a localized title text already sits next to the cover (cards, strips), overlay OFF; if the cover stands alone (hero, thumbnails, OG), overlay ON.
- **Do not touch** the caption-*text* i18n (BookCard `<h3>`, category badges) — the concurrent session owns it; just consume `titleTranslations`.
- **Rebase** onto `claude/nostalgic-elgamal-985947` before merge to pick up concurrent i18n work.
- **Adapter, not builder**: spec §3 names `book-v2.repository.ts` as the `BookIndexEntry` builder, but the learner library actually converts v1 `StorybookSummary`→`BookIndexEntry` at runtime via `summaryToEntry` in `LibraryPage.tsx` (v2 index abandoned per code comment). Populate clean fields there (Task 9 Step 0), NOT in `book-v2.repository.ts`. The type still gains the fields (Task 2) for the editor/v2 path, but no v2 builder change is needed for this plan.
- **Verification gates**: use @superpowers:verification-before-completion before claiming done, and the `run`/`verify` skills to drive the actual app for the browser sweeps.
