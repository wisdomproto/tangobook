# Library Master 카테고리 편집 + 234권 재분류 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/library-master` 페이지를 카테고리 CRUD + 책별 카테고리/공개 토글 + 드래그-to-카테고리 가능하게 확장하고, 234권을 10개 카테고리로 재분류한다.

**Architecture:** `LibraryConfig` 에 `categoryList` 필드 추가 (빈 카테고리 보관), LibraryMasterPage 의 2개 DndContext 를 1개로 통합 (cross-context drop), 책 카드에 카테고리 chip 드롭다운 + 👁/🚫 isPublic 토글 추가. 재분류는 키워드 규칙 기반 `propose-recategorize.mjs` 가 JSON 매핑을 생성하면 사람이 검토 → `migrate-recategorize.mjs` 가 --dry/--apply 로 R2 patch.

**Tech Stack:** React 18 + TypeScript + Vite, @dnd-kit/core+sortable, TanStack Query v5, R2 (S3 호환), Node.js mjs 스크립트.

**Spec:** [docs/superpowers/specs/2026-05-16-library-master-category-editing-design.md](../specs/2026-05-16-library-master-category-editing-design.md)

---

## File Structure

**Create:**
- `packages/client/src/features/library/components/CategoryPanel.tsx` — 좌측 카테고리 패널 (CRUD)
- `packages/client/src/features/library/components/BookCardEditable.tsx` — 우측 책 카드 (chip + isPublic + drag handle)
- `packages/client/src/features/library/components/CategoryChipDropdown.tsx` — 책 카드 좌상단 카테고리 chip 드롭다운
- `packages/client/src/features/library/components/MoveBooksModal.tsx` — 카테고리 삭제 전 책 이동 모달
- `packages/client/src/features/library/hooks/useCategoryActions.ts` — 카테고리 add/rename/delete/move (mutations + LibraryConfig)
- `packages/server/scripts/propose-recategorize.mjs` — 룰 기반 매핑 제안 (`_data/recategorize-proposal.json`)
- `packages/server/scripts/migrate-recategorize.mjs` — 매핑 적용 (--dry/--apply)
- `packages/server/scripts/_data/recategorize-proposal.json` — 매핑 검토 산출물 (생성)

**Modify:**
- `packages/shared/src/types/storybook.ts` — `LibraryConfig.categoryList?: string[]` 추가
- `packages/server/src/services/library-config.service.ts` — sanitize 에 `categoryList` 포함
- `packages/client/src/pages/LibraryMasterPage.tsx` — 2 DndContext → 1, 새 컴포넌트 사용, 책 → 카테고리 cross-context drop 처리
- `packages/client/src/features/library/index.ts` — 새 hook export
- `CLAUDE.md` — "라이브러리 마스터" 섹션 갱신

**Out of scope:** 학습자 `/library` UI 변경, `/editor2` CategoryManagerModal 변경, `*-복사본` 정리.

---

## Task 1: `LibraryConfig.categoryList` 필드 추가

**Files:**
- Modify: `packages/shared/src/types/storybook.ts:1095-1104`
- Modify: `packages/server/src/services/library-config.service.ts:21-39`

- [ ] **Step 1.1: shared 타입에 `categoryList` 추가**

`packages/shared/src/types/storybook.ts` 의 `LibraryConfig` 인터페이스를 다음으로 교체:

```ts
export interface LibraryConfig {
  /** 카테고리 노출 순서 (한글 카테고리명 배열). 비어있으면 LibraryPage 의 default priority 사용. */
  categoryOrder?: string[];
  /**
   * 카테고리별 책 노출 우선순위 (storybook id 배열, 앞쪽이 먼저 노출).
   * 카테고리에 속한 책 중 list 에 없는 책은 createdAt desc 로 fallback append.
   */
  bookPriority?: Record<string, string[]>;
  /**
   * 존재 카테고리 set (빈 카테고리도 포함).
   * 있으면 /library-master 좌측 패널의 source of truth — 책 0권인 카테고리도 표시.
   * 없으면 책의 category 필드에서 derive (하위 호환).
   * 학습자 /library 는 책 0권인 카테고리 자동 hide (기존 로직 그대로).
   */
  categoryList?: string[];
  updatedAt?: string;
}
```

- [ ] **Step 1.2: server sanitize 에 `categoryList` 포함**

`packages/server/src/services/library-config.service.ts` 의 `save` 함수 안 `sanitized` 객체에 다음 한 줄 추가:

```ts
const sanitized: LibraryConfig = {
  categoryOrder: Array.isArray(cfg.categoryOrder)
    ? cfg.categoryOrder.filter((c) => typeof c === 'string')
    : undefined,
  categoryList: Array.isArray(cfg.categoryList)
    ? cfg.categoryList.filter((c) => typeof c === 'string')
    : undefined,
  bookPriority: (() => { /* 기존 그대로 */ })(),
  updatedAt: new Date().toISOString(),
};
```

- [ ] **Step 1.3: typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 1.4: commit**

```bash
git add packages/shared/src/types/storybook.ts packages/server/src/services/library-config.service.ts
git commit -m "feat(shared): LibraryConfig.categoryList — 빈 카테고리 보관

why: /library-master 좌측 패널이 책 0권인 카테고리도 표시할 수 있게 함.
학습자 /library 는 영향 없음 (기존처럼 책 있는 카테고리만 노출)."
```

---

## Task 2: `useCategoryActions` hook 작성

**Files:**
- Create: `packages/client/src/features/library/hooks/useCategoryActions.ts`
- Modify: `packages/client/src/features/library/index.ts:1-8`

- [ ] **Step 2.1: hook 생성**

`packages/client/src/features/library/hooks/useCategoryActions.ts` 파일 생성:

```ts
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { storybookApi } from '@/features/storybook';
import { libraryConfigApi } from '../api/library-config.api';
import type { LibraryConfig, Storybook, StorybookSummary } from '@tangobook/shared';

interface Args {
  config: LibraryConfig | undefined;
  books: StorybookSummary[] | undefined;
  onProgress?: (text: string | null) => void;
}

interface Actions {
  addCategory: (name: string) => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  moveBooksAndDelete: (fromName: string, toName: string) => Promise<void>;
  setBookCategory: (bookId: string, fromCat: string, toCat: string) => Promise<void>;
  setBookPublic: (bookId: string, next: boolean) => Promise<void>;
}

export function useCategoryActions({ config, books, onProgress }: Args): Actions {
  const qc = useQueryClient();

  const refreshConfig = useCallback(
    async (next: LibraryConfig) => {
      const saved = await libraryConfigApi.put(next);
      qc.setQueryData(['library-config'], saved);
    },
    [qc]
  );

  const patchBook = useCallback(
    async (id: string, patch: Partial<Storybook>) => {
      const full = await storybookApi.getById(id);
      const saved = await storybookApi.save({ ...full, ...patch });
      qc.setQueryData(['storybook', saved.id], saved);
      return saved;
    },
    [qc]
  );

  const invalidateBooks = useCallback(
    () => qc.invalidateQueries({ queryKey: ['storybooks'] }),
    [qc]
  );

  const addCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const list = config?.categoryList ?? [];
      const order = config?.categoryOrder ?? [];
      if (list.includes(trimmed) || order.includes(trimmed)) {
        alert(`이미 같은 이름의 카테고리가 있어요: "${trimmed}"`);
        return;
      }
      await refreshConfig({
        ...(config ?? {}),
        categoryList: [...list, trimmed],
        categoryOrder: order.includes(trimmed) ? order : [...order, trimmed],
      });
    },
    [config, refreshConfig]
  );

  const renameCategory = useCallback(
    async (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      const list = config?.categoryList ?? [];
      const order = config?.categoryOrder ?? [];
      if (list.includes(trimmed) || order.includes(trimmed)) {
        alert(`이미 같은 이름의 카테고리가 있어요: "${trimmed}"`);
        return;
      }
      const targets = (books ?? []).filter(
        (b) => (!b.type || b.type === 'storybook') && (b.category || '기타') === oldName
      );
      let done = 0;
      onProgress?.(`이름 변경 중… 0 / ${targets.length}`);
      for (const b of targets) {
        await patchBook(b.id, { category: trimmed });
        done++;
        onProgress?.(`이름 변경 중… ${done} / ${targets.length}`);
      }
      const nextPriority = { ...(config?.bookPriority ?? {}) };
      if (nextPriority[oldName]) {
        nextPriority[trimmed] = nextPriority[oldName];
        delete nextPriority[oldName];
      }
      await refreshConfig({
        ...(config ?? {}),
        categoryList: list.map((c) => (c === oldName ? trimmed : c)),
        categoryOrder: order.map((c) => (c === oldName ? trimmed : c)),
        bookPriority: Object.keys(nextPriority).length > 0 ? nextPriority : undefined,
      });
      await invalidateBooks();
      onProgress?.(null);
    },
    [config, books, refreshConfig, patchBook, invalidateBooks, onProgress]
  );

  const deleteCategory = useCallback(
    async (name: string) => {
      const count = (books ?? []).filter(
        (b) => (!b.type || b.type === 'storybook') && (b.category || '기타') === name
      ).length;
      if (count > 0) {
        alert(`'${name}' 에 책 ${count}권이 있어요. 비워야 삭제할 수 있어요.`);
        return;
      }
      const list = config?.categoryList ?? [];
      const order = config?.categoryOrder ?? [];
      const nextPriority = { ...(config?.bookPriority ?? {}) };
      delete nextPriority[name];
      await refreshConfig({
        ...(config ?? {}),
        categoryList: list.filter((c) => c !== name),
        categoryOrder: order.filter((c) => c !== name),
        bookPriority: Object.keys(nextPriority).length > 0 ? nextPriority : undefined,
      });
    },
    [config, books, refreshConfig]
  );

  const moveBooksAndDelete = useCallback(
    async (fromName: string, toName: string) => {
      if (fromName === toName) return;
      const targets = (books ?? []).filter(
        (b) => (!b.type || b.type === 'storybook') && (b.category || '기타') === fromName
      );
      let done = 0;
      onProgress?.(`이동 중… 0 / ${targets.length}`);
      for (const b of targets) {
        await patchBook(b.id, { category: toName });
        done++;
        onProgress?.(`이동 중… ${done} / ${targets.length}`);
      }
      const list = config?.categoryList ?? [];
      const order = config?.categoryOrder ?? [];
      const nextPriority = { ...(config?.bookPriority ?? {}) };
      const fromIds = nextPriority[fromName] ?? [];
      nextPriority[toName] = [...(nextPriority[toName] ?? []), ...fromIds];
      delete nextPriority[fromName];
      await refreshConfig({
        ...(config ?? {}),
        categoryList: list.filter((c) => c !== fromName),
        categoryOrder: order.filter((c) => c !== fromName),
        bookPriority: Object.keys(nextPriority).length > 0 ? nextPriority : undefined,
      });
      await invalidateBooks();
      onProgress?.(null);
    },
    [config, books, refreshConfig, patchBook, invalidateBooks, onProgress]
  );

  const setBookCategory = useCallback(
    async (bookId: string, fromCat: string, toCat: string) => {
      if (fromCat === toCat) return;
      await patchBook(bookId, { category: toCat });
      const nextPriority = { ...(config?.bookPriority ?? {}) };
      if (nextPriority[fromCat]) {
        nextPriority[fromCat] = nextPriority[fromCat].filter((id) => id !== bookId);
        if (nextPriority[fromCat].length === 0) delete nextPriority[fromCat];
      }
      nextPriority[toCat] = [...(nextPriority[toCat] ?? []), bookId];
      await refreshConfig({
        ...(config ?? {}),
        bookPriority: Object.keys(nextPriority).length > 0 ? nextPriority : undefined,
      });
      await invalidateBooks();
    },
    [config, patchBook, refreshConfig, invalidateBooks]
  );

  const setBookPublic = useCallback(
    async (bookId: string, next: boolean) => {
      await patchBook(bookId, { isPublic: next });
      await invalidateBooks();
    },
    [patchBook, invalidateBooks]
  );

  return {
    addCategory,
    renameCategory,
    deleteCategory,
    moveBooksAndDelete,
    setBookCategory,
    setBookPublic,
  };
}
```

- [ ] **Step 2.2: index.ts 에 export**

`packages/client/src/features/library/index.ts` 끝에 추가:

```ts
export { useCategoryActions } from './hooks/useCategoryActions';
```

- [ ] **Step 2.3: typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 2.4: commit**

```bash
git add packages/client/src/features/library/hooks/useCategoryActions.ts packages/client/src/features/library/index.ts
git commit -m "feat(library): useCategoryActions hook — 카테고리 CRUD + 책 patch

why: LibraryMasterPage 의 카테고리 add/rename/delete + 책별 카테고리/isPublic
변경을 단일 hook 으로 묶음. mutation + LibraryConfig 갱신 + 진행률 콜백 일관 처리."
```

---

## Task 3: `MoveBooksModal` 작성 (책 이동 후 카테고리 삭제)

**Files:**
- Create: `packages/client/src/features/library/components/MoveBooksModal.tsx`

- [ ] **Step 3.1: 컴포넌트 생성**

```tsx
import { useState } from 'react';

interface Props {
  fromCategory: string;
  bookCount: number;
  candidates: string[]; // 이동 target 후보 (fromCategory 제외)
  onClose: () => void;
  onConfirm: (toCategory: string) => Promise<void> | void;
}

export function MoveBooksModal({ fromCategory, bookCount, candidates, onClose, onConfirm }: Props) {
  const [target, setTarget] = useState<string>(candidates[0] ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      await onConfirm(target);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-ink-100">
          <h2 className="text-xl font-black text-ink-900">
            "{fromCategory}" 의 {bookCount}권을 어디로 옮길까요?
          </h2>
        </header>
        <div className="p-6 space-y-4">
          <p className="text-sm text-ink-600">
            옮긴 뒤 "{fromCategory}" 카테고리는 삭제됩니다.
          </p>
          <label className="block">
            <span className="text-sm font-black text-ink-700 mb-1 block">이동 대상</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-ink-200 text-ink-900 font-bold"
              disabled={submitting}
            >
              {candidates.length === 0 ? (
                <option value="">(다른 카테고리 없음)</option>
              ) : (
                candidates.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
        <footer className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-700 font-black"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!target || submitting}
            className="px-4 py-2 rounded-full bg-coral-500 hover:bg-coral-600 text-white font-black disabled:opacity-40"
          >
            {submitting ? '이동 중…' : '옮기고 카테고리 삭제'}
          </button>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.2: typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 3.3: commit**

```bash
git add packages/client/src/features/library/components/MoveBooksModal.tsx
git commit -m "feat(library): MoveBooksModal — 카테고리 비우고 삭제 모달

why: 카테고리에 책이 있을 때 삭제 못 하게 막은 대신, 다른 카테고리로 책을
일괄 이동시키고 빈 카테고리를 같이 정리하는 흐름 제공."
```

---

## Task 4: `CategoryChipDropdown` (책 카드 좌상단)

**Files:**
- Create: `packages/client/src/features/library/components/CategoryChipDropdown.tsx`

- [ ] **Step 4.1: 컴포넌트 생성**

```tsx
import { useEffect, useRef, useState } from 'react';

interface Props {
  current: string;
  categories: string[];
  emojiOf: (cat: string) => string;
  onPick: (next: string) => void;
  disabled?: boolean;
}

export function CategoryChipDropdown({ current, categories, emojiOf, onPick, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
        disabled={disabled}
        className="px-1.5 py-0.5 rounded-full bg-white/90 text-ink-900 text-[10px] font-black shadow-soft hover:bg-white flex items-center gap-1 max-w-[120px]"
        title="카테고리 변경"
      >
        <span>{emojiOf(current)}</span>
        <span className="truncate">{current}</span>
        <span className="text-ink-400">▾</span>
      </button>
      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-full left-0 mt-1 z-20 bg-white rounded-2xl shadow-pop border border-ink-100 py-1 min-w-[180px] max-h-[260px] overflow-y-auto"
        >
          {categories.map((c) => {
            const isCurrent = c === current;
            return (
              <button
                key={c}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  if (!isCurrent) onPick(c);
                }}
                className={`w-full px-3 py-2 text-left text-sm font-bold flex items-center gap-2 hover:bg-cream-50 ${
                  isCurrent ? 'text-coral-700 bg-coral-50' : 'text-ink-800'
                }`}
              >
                <span>{emojiOf(c)}</span>
                <span className="flex-1 truncate">{c}</span>
                {isCurrent && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4.2: typecheck + commit**

Run: `pnpm typecheck` (expect 0 errors)

```bash
git add packages/client/src/features/library/components/CategoryChipDropdown.tsx
git commit -m "feat(library): CategoryChipDropdown — 책 카드 카테고리 빠른 변경

why: 우측 책 카드 좌상단 chip 클릭 → popover 에서 다른 카테고리 선택 → 즉시
patch. 드래그 없이 빠른 변경 가능."
```

---

## Task 5: `BookCardEditable` (drag handle + chip + isPublic)

**Files:**
- Create: `packages/client/src/features/library/components/BookCardEditable.tsx`

- [ ] **Step 5.1: 컴포넌트 생성**

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryChipDropdown } from './CategoryChipDropdown';
import type { StorybookSummary } from '@tangobook/shared';

interface Props {
  book: StorybookSummary;
  index: number;
  categories: string[];
  emojiOf: (cat: string) => string;
  onChangeCover: () => void;
  onChangeCategory: (next: string) => void;
  onTogglePublic: () => void;
}

export function BookCardEditable({
  book,
  index,
  categories,
  emojiOf,
  onChangeCover,
  onChangeCategory,
  onTogglePublic,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  const cover = book.coverImage;
  const styleCount = book.coversByStyle ? Object.keys(book.coversByStyle).length : 0;
  const isPublic = book.isPublic !== false;
  const currentCat = book.category || '기타';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-2xl bg-cream-50 hover:bg-cream-100 transition cursor-grab active:cursor-grabbing overflow-hidden border-2 border-transparent hover:border-coral-300 select-none ${
        !isPublic ? 'opacity-60 grayscale' : ''
      }`}
    >
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
        <span className="bg-white/90 text-ink-900 text-xs font-black tabular-nums rounded-full w-7 h-7 flex items-center justify-center shadow-soft">
          {index + 1}
        </span>
        <CategoryChipDropdown
          current={currentCat}
          categories={categories}
          emojiOf={emojiOf}
          onPick={onChangeCategory}
        />
      </div>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePublic();
          }}
          className={`w-7 h-7 rounded-full text-sm font-black shadow-soft flex items-center justify-center ${
            isPublic
              ? 'bg-coral-500 text-white hover:bg-coral-600'
              : 'bg-ink-200 text-ink-600 hover:bg-ink-300'
          }`}
          title={isPublic ? '라이브러리 노출 중 — 클릭해서 숨김' : '라이브러리 숨김 — 클릭해서 노출'}
          aria-label={isPublic ? '비공개로 전환' : '공개로 전환'}
        >
          {isPublic ? '👁' : '🚫'}
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onChangeCover();
          }}
          disabled={styleCount < 2}
          className="w-7 h-7 rounded-full bg-coral-500 text-white text-sm font-black shadow-soft hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          title={styleCount < 2 ? '그림체가 1종이라 변경 불가' : '메인 표지 변경'}
          aria-label="메인 표지 변경"
        >
          🎨
        </button>
      </div>
      <div className="aspect-[3/4] bg-peach-100 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <div className="font-black text-ink-900 text-sm truncate">{book.title}</div>
        <div className="text-[11px] text-ink-500 mt-0.5">그림체 {styleCount}종</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: typecheck + commit**

Run: `pnpm typecheck` (expect 0 errors)

```bash
git add packages/client/src/features/library/components/BookCardEditable.tsx
git commit -m "feat(library): BookCardEditable — 카테고리 chip + isPublic 토글 + 표지 변경

why: LibraryMaster 우측 책 카드에서 카테고리 빠른 변경 + 공개 토글 + 표지 변경을
한 카드에서 모두 처리. 비공개 책은 opacity-60 grayscale 로 시각 구분."
```

---

## Task 6: `CategoryPanel` (좌측 패널)

**Files:**
- Create: `packages/client/src/features/library/components/CategoryPanel.tsx`

- [ ] **Step 6.1: 컴포넌트 생성**

```tsx
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  categories: string[];          // 표시 순서 (config + derived merge 후)
  countOf: (cat: string) => number;
  emojiOf: (cat: string) => string;
  activeCat: string | null;
  onSelect: (cat: string) => void;
  onAdd: (name: string) => Promise<void> | void;
  onRename: (oldName: string, newName: string) => Promise<void> | void;
  onDelete: (name: string) => Promise<void> | void;
  onRequestMove: (fromName: string) => void; // 책 있을 때 → MoveBooksModal 띄움
  totalLabel?: string;
  rightSlot?: React.ReactNode; // ✓저장됨 같은 표시
}

export function CategoryPanel({
  categories,
  countOf,
  emojiOf,
  activeCat,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onRequestMove,
  totalLabel,
  rightSlot,
}: Props) {
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const submitAdd = async () => {
    const v = newName.trim();
    if (!v) return;
    await onAdd(v);
    setNewName('');
  };

  const startRename = (name: string) => {
    setEditing(name);
    setDraft(name);
  };
  const commitRename = async () => {
    if (!editing) return;
    const oldName = editing;
    const v = draft.trim();
    setEditing(null);
    if (!v || v === oldName) return;
    await onRename(oldName, v);
  };

  const handleDelete = async (name: string) => {
    const count = countOf(name);
    if (count > 0) {
      onRequestMove(name);
      return;
    }
    if (!confirm(`'${name}' 카테고리를 삭제할까요?`)) return;
    await onDelete(name);
  };

  return (
    <section className="bg-white rounded-3xl shadow-soft p-4 lg:sticky lg:top-32 lg:self-start">
      <h2 className="text-lg font-black text-ink-900 px-2 pb-3 flex items-center justify-between">
        <span>카테고리 ({categories.length})</span>
        {rightSlot ?? (totalLabel ? <span className="text-xs text-ink-500">{totalLabel}</span> : null)}
      </h2>
      <SortableContext items={categories} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <CategoryRow
              key={cat}
              id={cat}
              label={cat}
              emoji={emojiOf(cat)}
              count={countOf(cat)}
              active={cat === activeCat}
              editing={editing === cat}
              draft={draft}
              onDraftChange={setDraft}
              onSelect={() => onSelect(cat)}
              onStartRename={() => startRename(cat)}
              onCommitRename={commitRename}
              onCancelRename={() => setEditing(null)}
              onDelete={() => handleDelete(cat)}
            />
          ))}
        </div>
      </SortableContext>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitAdd();
        }}
        className="flex gap-2 mt-3 px-1"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="+ 새 카테고리 이름"
          className="flex-1 px-3 py-2 rounded-xl border-2 border-ink-200 text-ink-900 text-sm font-bold outline-none focus:border-coral-400"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="px-3 py-2 rounded-xl bg-coral-500 text-white font-black disabled:opacity-40"
          aria-label="카테고리 추가"
        >
          ＋
        </button>
      </form>
    </section>
  );
}

interface RowProps {
  id: string;
  label: string;
  emoji: string;
  count: number;
  active: boolean;
  editing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onSelect: () => void;
  onStartRename: () => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

function CategoryRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });
  // 책 카드의 droppable target — 책 id 와 카테고리 id 가 겹치지 않도록 prefix
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `cat:${props.id}` });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={sortableStyle}
      className={`flex items-center gap-1 rounded-xl border-2 transition ${
        props.active
          ? 'bg-coral-50 border-coral-300 shadow-soft'
          : isOver
            ? 'bg-coral-50 border-coral-400 ring-2 ring-coral-300'
            : 'bg-cream-50 border-transparent hover:bg-cream-100'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="px-2 py-3 cursor-grab active:cursor-grabbing text-ink-400 hover:text-ink-700"
        aria-label="카테고리 순서 변경"
        type="button"
      >
        ≡
      </button>
      {props.editing ? (
        <input
          autoFocus
          value={props.draft}
          onChange={(e) => props.onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) props.onCommitRename();
            else if (e.key === 'Escape') props.onCancelRename();
          }}
          onBlur={props.onCommitRename}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 px-2 py-2 rounded border border-coral-300 bg-white text-ink-900 text-sm font-black outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={props.onSelect}
          className="flex-1 flex items-center justify-between px-1 py-3 text-left"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-xl">{props.emoji}</span>
            <span
              className={`font-black truncate ${props.active ? 'text-coral-700' : 'text-ink-900'}`}
            >
              {props.label}
            </span>
          </span>
          <span className="text-sm text-ink-500 font-bold pr-2 tabular-nums">{props.count}</span>
        </button>
      )}
      <div className="opacity-0 group-hover:opacity-100 hover:opacity-100 flex items-center gap-0.5 pr-1 transition">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onStartRename();
          }}
          className="p-1 rounded hover:bg-ink-100 text-ink-500"
          title="이름 변경"
          aria-label="이름 변경"
        >
          ✏
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onDelete();
          }}
          className="p-1 rounded hover:bg-red-100 text-ink-500 hover:text-red-600"
          title={props.count > 0 ? '책 이동 후 삭제' : '카테고리 삭제'}
          aria-label="카테고리 삭제"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
```

(주의: `.group-hover` 활용을 위해선 부모에 `group` 클래스가 필요 — 위 컨테이너에 추가 필요. 다음 step 에서 부모 추가.)

- [ ] **Step 6.2: 부모 컨테이너에 `group` 추가**

위 코드의 `CategoryRow` div className 시작 부분에 `group` 추가:

```tsx
className={`group flex items-center gap-1 rounded-xl border-2 transition ${...
```

(이미 위 코드의 inner div className 이 group hover 를 쓰지만 부모에 `group` 키워드가 없으면 Tailwind 가 안 잡음. 확인 후 group 키워드 보장.)

- [ ] **Step 6.3: typecheck + commit**

Run: `pnpm typecheck` (expect 0 errors)

```bash
git add packages/client/src/features/library/components/CategoryPanel.tsx
git commit -m "feat(library): CategoryPanel — 좌측 카테고리 CRUD + drop target

why: LibraryMaster 좌측 패널 — 추가 input, hover ✏/🗑 인플레이스 편집,
useDroppable 로 책 카드 드래그 받음 (cat: prefix), 비어있는 카테고리만 즉시
삭제, 책 있으면 onRequestMove 콜백으로 모달 띄움."
```

---

## Task 7: `LibraryMasterPage` 재작성 (단일 DndContext + 새 컴포넌트)

**Files:**
- Modify: `packages/client/src/pages/LibraryMasterPage.tsx` (전체 재작성)

- [ ] **Step 7.1: 전체 파일 교체**

`packages/client/src/pages/LibraryMasterPage.tsx` 를 다음으로 완전 교체:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useStorybooks, storybookApi } from '@/features/storybook';
import { useLibraryConfig, useUpdateLibraryConfig, useCategoryActions } from '@/features/library';
import { useQueryClient } from '@tanstack/react-query';
import type { LibraryConfig, StorybookSummary } from '@tangobook/shared';
import { CategoryPanel } from '@/features/library/components/CategoryPanel';
import { BookCardEditable } from '@/features/library/components/BookCardEditable';
import { MoveBooksModal } from '@/features/library/components/MoveBooksModal';

const DEFAULT_CATEGORY_ORDER = [
  '세계 명작',
  '전래 동화',
  '공룡 친구들',
  '곤충 친구들',
  '육지 동물 친구들',
  '바다 동물 친구들',
  '하늘 동물 친구들',
  '식물 친구들',
  '우주와 자연',
  '우리 몸 이야기',
  '기타',
  // legacy fallback
  '자연 관찰',
  '생활 동화',
];

const CATEGORY_EMOJI: Record<string, string> = {
  '세계 명작': '🌟',
  '전래 동화': '📜',
  '공룡 친구들': '🦕',
  '곤충 친구들': '🐛',
  '육지 동물 친구들': '🐯',
  '바다 동물 친구들': '🐬',
  '하늘 동물 친구들': '🦅',
  '식물 친구들': '🌸',
  '우주와 자연': '🌌',
  '우리 몸 이야기': '🫀',
  '자연 관찰': '🌿',
  '생활 동화': '👨‍👩‍👧',
  기타: '📚',
};

function emojiOf(cat: string): string {
  return CATEGORY_EMOJI[cat] ?? '📚';
}

function deriveAllCategories(books: StorybookSummary[]): string[] {
  const set = new Set<string>();
  books.forEach((b) => {
    if (!b.isPublic) return;
    if (b.type && b.type !== 'storybook') return;
    set.add(b.category || '기타');
  });
  return [...set];
}

function mergeCategoryOrder(
  configOrder: string[] | undefined,
  configList: string[] | undefined,
  derived: string[]
): string[] {
  const all = new Set<string>([...(configList ?? []), ...derived]);
  const ordered: string[] = [];
  (configOrder ?? []).forEach((c) => {
    if (all.has(c) && !ordered.includes(c)) ordered.push(c);
  });
  DEFAULT_CATEGORY_ORDER.forEach((c) => {
    if (all.has(c) && !ordered.includes(c)) ordered.push(c);
  });
  [...all]
    .filter((c) => !ordered.includes(c))
    .sort()
    .forEach((c) => ordered.push(c));
  return ordered;
}

function orderBooksInCategory(
  cat: string,
  books: StorybookSummary[],
  bookPriority: Record<string, string[]> | undefined
): StorybookSummary[] {
  // /library-master 는 비공개 책도 표시 (편집 대상이므로). 단 storybook 만.
  const pool = books.filter(
    (b) => (!b.type || b.type === 'storybook') && (b.category || '기타') === cat
  );
  const priorityIds = bookPriority?.[cat] ?? [];
  const idIdx = new Map(priorityIds.map((id, i) => [id, i]));
  const inPriority: StorybookSummary[] = [];
  const rest: StorybookSummary[] = [];
  pool.forEach((b) => {
    if (idIdx.has(b.id)) inPriority.push(b);
    else rest.push(b);
  });
  inPriority.sort((a, b) => (idIdx.get(a.id) ?? 0) - (idIdx.get(b.id) ?? 0));
  rest.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return [...inPriority, ...rest];
}

export default function LibraryMasterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: storybooks, isLoading } = useStorybooks();
  const { data: config } = useLibraryConfig();
  const update = useUpdateLibraryConfig();

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [coverModalBookId, setCoverModalBookId] = useState<string | null>(null);
  const [moveFromCat, setMoveFromCat] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const actions = useCategoryActions({
    config,
    books: storybooks,
    onProgress: setProgressText,
  });

  const derivedCats = useMemo(
    () => (storybooks ? deriveAllCategories(storybooks) : []),
    [storybooks]
  );
  const categoryOrder = useMemo(
    () => mergeCategoryOrder(config?.categoryOrder, config?.categoryList, derivedCats),
    [config?.categoryOrder, config?.categoryList, derivedCats]
  );

  useEffect(() => {
    if (!activeCat && categoryOrder.length > 0) setActiveCat(categoryOrder[0]);
  }, [categoryOrder, activeCat]);

  // active 카테고리가 삭제되면 첫 번째로 fallback
  useEffect(() => {
    if (activeCat && !categoryOrder.includes(activeCat)) {
      setActiveCat(categoryOrder[0] ?? null);
    }
  }, [categoryOrder, activeCat]);

  const activeBooks = useMemo(() => {
    if (!storybooks || !activeCat) return [];
    return orderBooksInCategory(activeCat, storybooks, config?.bookPriority);
  }, [storybooks, activeCat, config?.bookPriority]);

  const countOf = (cat: string) =>
    storybooks?.filter(
      (b) => (!b.type || b.type === 'storybook') && (b.category || '기타') === cat
    ).length ?? 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const persistConfig = (next: LibraryConfig) => {
    update.mutate(next, { onSuccess: flashSaved });
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // 책 → 카테고리 row (cat: prefix)
    if (overId.startsWith('cat:')) {
      const targetCat = overId.slice(4);
      const fromCat = activeCat;
      if (!fromCat || fromCat === targetCat) return;
      if (!storybooks?.find((b) => b.id === activeId)) return;
      await actions.setBookCategory(activeId, fromCat, targetCat);
      flashSaved();
      return;
    }

    // 카테고리 reorder (둘 다 categoryOrder 안)
    if (categoryOrder.includes(activeId) && categoryOrder.includes(overId)) {
      const oldIdx = categoryOrder.indexOf(activeId);
      const newIdx = categoryOrder.indexOf(overId);
      if (oldIdx < 0 || newIdx < 0) return;
      const next = arrayMove(categoryOrder, oldIdx, newIdx);
      persistConfig({ ...(config ?? {}), categoryOrder: next });
      return;
    }

    // 책 reorder (활성 카테고리 안)
    if (activeCat) {
      const ids = activeBooks.map((b) => b.id);
      const oldIdx = ids.indexOf(activeId);
      const newIdx = ids.indexOf(overId);
      if (oldIdx < 0 || newIdx < 0) return;
      const nextIds = arrayMove(ids, oldIdx, newIdx);
      const nextPriority = { ...(config?.bookPriority ?? {}), [activeCat]: nextIds };
      persistConfig({ ...(config ?? {}), bookPriority: nextPriority });
    }
  };

  const handleChangeCover = async (bookId: string, newStyleId: string) => {
    try {
      const sb = await storybookApi.getById(bookId);
      const updated = { ...sb, defaultStyle: newStyleId };
      await storybookApi.save(updated);
      await qc.invalidateQueries({ queryKey: ['storybooks'] });
      flashSaved();
      setCoverModalBookId(null);
    } catch (err) {
      alert(`표지 변경 실패: ${(err as Error).message}`);
    }
  };

  const moveCandidates = categoryOrder.filter((c) => c !== moveFromCat);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-ink-100 shadow-soft">
        <div className="max-w-[1480px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/library')}
              className="px-4 py-2 rounded-full bg-peach-100 text-ink-900 font-black text-base hover:bg-peach-200 transition"
              aria-label="라이브러리로 돌아가기"
            >
              ← 라이브러리
            </button>
            <h1 className="text-2xl md:text-3xl font-black font-display text-ink-900 flex items-center gap-2">
              <span>📚</span>
              <span>라이브러리 마스터</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {progressText && <span className="text-ink-600 font-bold">{progressText}</span>}
            {savedFlash && <span className="text-success font-black animate-pulse">✓ 저장됨</span>}
            {update.isPending && <span className="text-ink-500">저장 중...</span>}
          </div>
        </div>
        <div className="max-w-[1480px] mx-auto px-6 pb-3 text-sm text-ink-600">
          좌측에서 카테고리 추가/이름변경/삭제, 책 카드의 카테고리 chip · 👁 (공개) · 🎨 (표지)
          편집. 책을 왼쪽 카테고리로 드래그하면 카테고리가 바뀝니다.
        </div>
      </header>

      <div className="max-w-[1480px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-ink-500">불러오는 중...</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
              <CategoryPanel
                categories={categoryOrder}
                countOf={countOf}
                emojiOf={emojiOf}
                activeCat={activeCat}
                onSelect={setActiveCat}
                onAdd={actions.addCategory}
                onRename={actions.renameCategory}
                onDelete={actions.deleteCategory}
                onRequestMove={setMoveFromCat}
              />

              <section className="bg-white rounded-3xl shadow-soft p-5">
                {activeCat ? (
                  <>
                    <header className="flex items-center justify-between mb-4 px-1">
                      <h2 className="text-2xl font-black text-ink-900 font-display flex items-center gap-2">
                        <span>{emojiOf(activeCat)}</span>
                        <span>{activeCat}</span>
                        <span className="text-base text-ink-500 font-bold">
                          ({activeBooks.length}권)
                        </span>
                      </h2>
                    </header>
                    {activeBooks.length === 0 ? (
                      <div className="text-center py-20 text-ink-500 text-sm">
                        이 카테고리에 책이 없어요. 다른 카테고리에서 책을 드래그하거나, 책 카드의
                        카테고리 chip 으로 옮겨보세요.
                      </div>
                    ) : (
                      <SortableContext
                        items={activeBooks.map((b) => b.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {activeBooks.map((book, idx) => (
                            <BookCardEditable
                              key={book.id}
                              book={book}
                              index={idx}
                              categories={categoryOrder}
                              emojiOf={emojiOf}
                              onChangeCover={() => setCoverModalBookId(book.id)}
                              onChangeCategory={(next) =>
                                actions
                                  .setBookCategory(book.id, activeCat, next)
                                  .then(flashSaved)
                              }
                              onTogglePublic={() =>
                                actions
                                  .setBookPublic(book.id, !(book.isPublic !== false))
                                  .then(flashSaved)
                              }
                            />
                          ))}
                        </div>
                      </SortableContext>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-ink-500">카테고리를 선택해주세요</div>
                )}
              </section>
            </div>
          </DndContext>
        )}
      </div>

      {coverModalBookId && (
        <CoverPickerModal
          bookId={coverModalBookId}
          onClose={() => setCoverModalBookId(null)}
          onPick={(styleId) => handleChangeCover(coverModalBookId, styleId)}
        />
      )}

      {moveFromCat && (
        <MoveBooksModal
          fromCategory={moveFromCat}
          bookCount={countOf(moveFromCat)}
          candidates={moveCandidates}
          onClose={() => setMoveFromCat(null)}
          onConfirm={async (to) => {
            await actions.moveBooksAndDelete(moveFromCat, to);
            flashSaved();
          }}
        />
      )}
    </div>
  );
}

// =============== Cover picker modal (기존 유지, 코드 그대로) ===============

function CoverPickerModal({
  bookId,
  onClose,
  onPick,
}: {
  bookId: string;
  onClose: () => void;
  onPick: (styleId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    title: string;
    defaultStyle?: string;
    options: Array<{ styleId: string; imageUrl: string }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = await storybookApi.getById(bookId);
        if (cancelled) return;
        const opts: Array<{ styleId: string; imageUrl: string }> = [];
        if (sb.styleAssets) {
          for (const [styleId, assets] of Object.entries(sb.styleAssets)) {
            const url =
              assets?.primaryCoverByLang?.ko ??
              assets?.coverImage ??
              assets?.coverImages?.[0]?.imageUrl;
            if (url) opts.push({ styleId, imageUrl: url });
          }
        }
        if (opts.length === 0 && sb.coverImage) {
          opts.push({ styleId: sb.artStyle || 'default', imageUrl: sb.coverImage });
        }
        setData({
          title: sb.title,
          defaultStyle: sb.defaultStyle ?? sb.artStyle,
          options: opts,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-ink-900 truncate">
            🎨 메인 표지 선택{data ? ` — ${data.title}` : ''}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-700 font-black"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-20 text-ink-500">불러오는 중...</div>
          ) : !data || data.options.length === 0 ? (
            <div className="text-center py-20 text-ink-500">사용 가능한 표지가 없습니다.</div>
          ) : (
            <>
              <p className="text-sm text-ink-600 mb-4">
                그림체를 클릭하면 라이브러리 카드에 그 그림체의 표지가 노출됩니다.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.options.map((opt) => {
                  const isCurrent = opt.styleId === data.defaultStyle;
                  return (
                    <button
                      key={opt.styleId}
                      onClick={() => onPick(opt.styleId)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition hover:scale-[1.02] ${
                        isCurrent
                          ? 'border-coral-500 ring-4 ring-coral-200'
                          : 'border-ink-100 hover:border-coral-300'
                      }`}
                    >
                      <img
                        src={opt.imageUrl}
                        alt={opt.styleId}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <span className="absolute top-2 right-2 bg-coral-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-black shadow-pop">
                          ✓
                        </span>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs font-black px-2 py-1.5 truncate">
                        {opt.styleId}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2: typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 7.3: dev server + preview 검증**

dev 서버 띄우고 `/library-master` 동작 검증:
- 좌측 카테고리 reorder, 추가, 이름변경, 빈 카테고리 삭제 동작
- 우측 카드의 카테고리 chip 드롭다운으로 다른 카테고리로 이동되는지 확인
- 👁/🚫 토글 후 isPublic 갱신되는지
- 책을 좌측 카테고리 row 위로 드래그 → 카테고리 변경 동작
- 기존 🎨 표지 변경 정상

Run dev: `pnpm dev`
Browse: `/library-master`

- [ ] **Step 7.4: commit**

```bash
git add packages/client/src/pages/LibraryMasterPage.tsx
git commit -m "feat(library-master): 카테고리 CRUD + 책별 카테고리/공개 토글 + cross DnD

- 2개 DndContext 를 단일 DndContext 로 통합 (cat: prefix 로 droppable 구분)
- 새 컴포넌트 사용: CategoryPanel, BookCardEditable, MoveBooksModal,
  CategoryChipDropdown, useCategoryActions
- 좌측: 카테고리 추가 input, ✏ 인라인 rename, 🗑 (책 0 시 즉시 / 그 외 → 이동 모달)
- 우측: 좌상단 카테고리 chip + 우상단 👁/🚫 + 🎨, 비공개 책 opacity-60 grayscale
- /library-master 만 비공개 책 표시 (편집 대상), 학습자 /library 는 영향 X

why: 새 책 들어올 때마다 R2 마이그 스크립트 짜는 비용 제거, 카테고리 체계
변경을 UI 에서 즉시 처리."
```

---

## Task 8: `propose-recategorize.mjs` (룰 기반 매핑 제안)

**Files:**
- Create: `packages/server/scripts/propose-recategorize.mjs`

- [ ] **Step 8.1: 스크립트 생성**

```js
#!/usr/bin/env node
/**
 * 234 storybook 의 카테고리 재분류 매핑 제안.
 *
 * 입력: scripts/_data/books-by-category.json (dump-books-by-category.mjs 산출물)
 * 출력: scripts/_data/recategorize-proposal.json
 *   { categoryList: [...10개...],
 *     mappings: [{ id, title, current, proposed, reason }, ...],
 *     unmapped: [{ id, title, current }, ...] }
 *
 * 사람이 mappings 를 검토 → 필요 시 직접 수정 → migrate-recategorize.mjs --apply 로 적용.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DUMP = path.join(__dirname, '_data', 'books-by-category.json');
const OUT = path.join(__dirname, '_data', 'recategorize-proposal.json');

const CATEGORY_LIST = [
  '세계 명작',
  '전래 동화',
  '공룡 친구들',
  '곤충 친구들',
  '육지 동물 친구들',
  '바다 동물 친구들',
  '하늘 동물 친구들',
  '식물 친구들',
  '우주와 자연',
  '우리 몸 이야기',
];

// 룰 — 위에서 아래 순서로 평가. 매칭되는 첫 룰의 category 적용.
// keyword 가 title 에 포함되면 매칭.
const RULES = [
  {
    category: '공룡 친구들',
    reason: '공룡/익룡/해룡 키워드',
    keywords: [
      '공룡', '사우루스', '사우라', '랍토', '케라톱스', '케팔로사우루스', '프테라노돈',
      '모사사우', '람포린쿠스', '바리오닉스', '안킬로', '디플로도쿠스', '브라키오',
      '벨로키랍토르', '벨로키라프토르', '이구아노돈', '스피노', '아파토', '스테고',
      '파라사우롤로푸스', '스티라코사우루스', '파키케팔로', '티라노사우루스',
      '타르보사우루스', '기가노토사우루스', '트리케라톱스', '마이아사우라',
      '케트살코아틀루스',
    ],
  },
  {
    category: '곤충 친구들',
    reason: '곤충/거미/달팽이 키워드',
    keywords: [
      '꿀벌', '거미', '사슴벌레', '장수풍뎅이', '호랑나비', '나비', '개미',
      '무당벌레', '잠자리', '달팽이',
    ],
  },
  {
    category: '바다 동물 친구들',
    reason: '바다/수영 동물',
    keywords: [
      '펭귄', '물개', '고래', '상어', '죠스', '문어', '해마', '흰동가리',
      '바다거북', '말미잘',
    ],
    extraKoMatch: (sample) =>
      sample.some((s) =>
        ['게', '꽃게'].includes(s) || ['게', '말미잘'].some((k) => s.includes(k))
      ),
  },
  {
    category: '하늘 동물 친구들',
    reason: '새 (못 나는 새 포함)',
    keywords: [
      '오리', '올빼미', '앵무새', '딱따구리', '백로', '독수리', '타조', '참새',
      '제비', '비둘기',
    ],
  },
  {
    category: '식물 친구들',
    reason: '식물/꽃/나무/열매',
    keywords: [
      '해바라기', '민들레', '사과나무', '장미', '튤립', '선인장', '버섯',
      '은행나무', '소나무', '수박', '연꽃', '파리지옥', '강아지풀', '딸기',
      '밤나무', '포도나무', '나팔꽃', '참나무',
    ],
  },
  {
    category: '우주와 자연',
    reason: '우주/자연현상',
    keywords: [
      '태양계', '행성', '달과 별', '은하', '블랙홀', '화산', '지진', '사막',
      '극지방', '동굴', '갯벌',
    ],
  },
  {
    category: '우리 몸 이야기',
    reason: '신체/생체',
    keywords: ['몸속 여행', '뼈와 근육', '뇌와 심장', '유산균', '바이러스'],
  },
  {
    category: '전래 동화',
    reason: '한국 전래 동화 (기존 잘못 분류된 것)',
    keywords: [
      '금도끼 은도끼', '임금님 귀', '북풍과 태양', '빨간 모자', '빨간모자',
      '성냥팔이', '성냥갑 병정', '브레멘 음악대', '피터팬', '피터 팬',
      '개미와 베짱이',
    ],
  },
  {
    category: '육지 동물 친구들',
    reason: '육지 포유류/파충류/양서류',
    keywords: [
      '토끼', '곰', '호랑이', '사자', '코끼리', '기린', '강아지', '개', '고양이',
      '캥거루', '판다', '표범', '치타', '늑대', '다람쥐', '여우', '고슴도치',
      '두더지', '카멜레온', '도마뱀', '뱀', '두꺼비', '개구리', '하마', '코뿔소',
      '원숭이', '악어',
    ],
  },
];

function classify(book) {
  const title = book.title || '';
  for (const r of RULES) {
    if (r.keywords.some((k) => title.includes(k))) {
      return { category: r.category, reason: `title contains "${r.keywords.find((k) => title.includes(k))}" (${r.reason})` };
    }
    if (r.extraKoMatch && Array.isArray(book.keyObjectSample) && r.extraKoMatch(book.keyObjectSample)) {
      return { category: r.category, reason: `keyObjectSample 매칭 (${r.reason})` };
    }
  }
  return null;
}

function main() {
  const dump = JSON.parse(fs.readFileSync(DUMP, 'utf-8'));
  const books = dump.books.filter((b) => b.type === 'storybook');

  const mappings = [];
  const unmapped = [];
  const keep = []; // 이미 세계 명작 등 그대로 둘 책

  for (const b of books) {
    const current = b.category || '기타';
    const result = classify(b);
    if (result) {
      if (result.category !== current) {
        mappings.push({
          id: b.id,
          title: b.title,
          current,
          proposed: result.category,
          reason: result.reason,
        });
      } else {
        keep.push({ id: b.id, title: b.title, current });
      }
    } else {
      // 미매칭 — 현재 카테고리가 세계 명작/전래 동화 면 유지
      if (['세계 명작', '전래 동화'].includes(current)) {
        keep.push({ id: b.id, title: b.title, current });
      } else {
        unmapped.push({ id: b.id, title: b.title, current });
      }
    }
  }

  // 결과 요약
  const proposedCount = {};
  for (const m of mappings) {
    proposedCount[m.proposed] = (proposedCount[m.proposed] ?? 0) + 1;
  }
  for (const k of keep) {
    proposedCount[k.current] = (proposedCount[k.current] ?? 0) + 1;
  }

  const out = {
    generatedAt: new Date().toISOString(),
    categoryList: CATEGORY_LIST,
    summary: {
      totalStorybooks: books.length,
      toMove: mappings.length,
      keep: keep.length,
      unmapped: unmapped.length,
      proposedCount,
    },
    mappings,
    unmapped,
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`저장: ${OUT}`);
  console.log(`\n총 ${books.length}권 / 이동 ${mappings.length} / 유지 ${keep.length} / 미매칭 ${unmapped.length}`);
  console.log('\n제안 카테고리별 권수:');
  for (const [c, n] of Object.entries(proposedCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${n}`);
  }
  if (unmapped.length > 0) {
    console.log('\n⚠️ 미매칭 (사람이 proposal JSON 에 직접 추가 필요):');
    unmapped.forEach((b) => console.log(`  ${b.id} | ${b.title} | 현재: ${b.current}`));
  }
}

main();
```

- [ ] **Step 8.2: 메인 repo 에서 실행 (worktree node_modules 없음)**

```bash
cp packages/server/scripts/propose-recategorize.mjs C:/project/tangobook/packages/server/scripts/
cp packages/server/scripts/_data/books-by-category.json C:/project/tangobook/packages/server/scripts/_data/
cd C:/project/tangobook/packages/server && node scripts/propose-recategorize.mjs
```

Expected output:
- `총 234권 / 이동 ~110 / 유지 ~120 / 미매칭 N`
- 미매칭 list 출력 → 사람이 다음 step 에서 proposal JSON 직접 보정

- [ ] **Step 8.3: proposal JSON 검토 + 미매칭 보정**

`C:/project/tangobook/packages/server/scripts/_data/recategorize-proposal.json` 열어서:
1. `mappings` 의 (current → proposed) 표 검토
2. `unmapped` 의 책 각각에 대해, `mappings` 끝에 다음 형식으로 직접 entry 추가:
   ```json
   { "id": "storybook-xxx", "title": "...", "current": "기타", "proposed": "육지 동물 친구들", "reason": "manual override" }
   ```
3. `summary.unmapped` / `summary.toMove` 갯수도 일치하게 조정 (스크립트 재실행 안 함, 수동)

- [ ] **Step 8.4: worktree 로 산출물 가져오기**

```bash
cp C:/project/tangobook/packages/server/scripts/_data/recategorize-proposal.json packages/server/scripts/_data/
```

- [ ] **Step 8.5: commit**

```bash
git add packages/server/scripts/propose-recategorize.mjs packages/server/scripts/_data/recategorize-proposal.json
git commit -m "chore(scripts): propose-recategorize.mjs + 234권 분류 제안 JSON

why: 룰 기반 키워드 매칭으로 (id → 새 카테고리) 매핑 자동 생성, 미매칭은
사람이 JSON 직접 보정. migrate-recategorize.mjs --apply 로 R2 적용."
```

---

## Task 9: `migrate-recategorize.mjs` (R2 적용)

**Files:**
- Create: `packages/server/scripts/migrate-recategorize.mjs`

- [ ] **Step 9.1: 스크립트 생성**

```js
#!/usr/bin/env node
/**
 * recategorize-proposal.json 의 (id → proposed) 매핑을 R2 storybook 에 적용.
 *
 * --dry (기본): 변경할 책 list 만 출력
 * --apply: 실제 PutObject 로 category 필드만 갱신 + library-config.json 갱신
 *
 * 주의: saveStorybook 우회 (title 중복 체크 skip — title 안 바뀜).
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const envText = fs.readFileSync(envPath, 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;

const PROPOSAL = path.join(__dirname, '_data', 'recategorize-proposal.json');
const LIBRARY_CONFIG_KEY = '_index/library-config.json';
const APPLY = process.argv.includes('--apply');

async function getJson(key) {
  const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await r.Body.transformToString('utf-8'));
}

async function putJson(key, obj) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(obj),
      ContentType: 'application/json',
    })
  );
}

async function patchBookCategory(id, newCat) {
  const key = `storybook-${id.replace(/^storybook-/, '')}.json`;
  // id 가 이미 storybook- 으로 시작할 수도 있고 아닐 수도 있음 — 안전화
  const realKey = id.startsWith('storybook-') ? `${id}.json` : `storybook-${id}.json`;
  let sb;
  try {
    sb = await getJson(realKey);
  } catch (e) {
    // 잠재 fallback — 다른 후보 키 시도
    throw new Error(`fetch fail: ${realKey} — ${e.message}`);
  }
  if (sb.category === newCat) return { skipped: true };
  sb.category = newCat;
  sb.updatedAt = new Date().toISOString();
  await putJson(realKey, sb);
  return { skipped: false };
}

async function main() {
  const proposal = JSON.parse(fs.readFileSync(PROPOSAL, 'utf-8'));
  const mappings = proposal.mappings ?? [];
  const categoryList = proposal.categoryList ?? [];

  console.log(`총 매핑 ${mappings.length}건 ${APPLY ? '— 실제 적용' : '— DRY RUN (--apply 로 실제 실행)'}`);
  console.log();

  // 변경 list 표 출력
  for (const m of mappings) {
    console.log(`  ${m.id} | "${m.title}" | ${m.current} → ${m.proposed}`);
  }

  if (!APPLY) {
    console.log('\nDRY RUN 종료. --apply 로 다시 실행하면 실제 R2 patch.');
    return;
  }

  console.log('\n적용 시작...');
  let ok = 0;
  let skip = 0;
  let fail = 0;
  const failures = [];
  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i];
    try {
      const r = await patchBookCategory(m.id, m.proposed);
      if (r.skipped) skip++;
      else ok++;
      if ((i + 1) % 10 === 0) console.log(`  ... ${i + 1} / ${mappings.length}`);
    } catch (e) {
      fail++;
      failures.push({ ...m, error: e.message });
    }
  }

  console.log(`\nstorybook patch 결과: ok=${ok} skip=${skip} fail=${fail}`);
  if (failures.length > 0) {
    console.log('실패 list:');
    failures.forEach((f) => console.log(`  ${f.id} | ${f.title} | ${f.error}`));
  }

  // library-config.json 갱신 (10개 카테고리 list + order)
  console.log('\nlibrary-config.json 갱신 중...');
  let cfg;
  try {
    cfg = await getJson(LIBRARY_CONFIG_KEY);
  } catch {
    cfg = {};
  }
  const nextOrder = [];
  for (const c of categoryList) if (!nextOrder.includes(c)) nextOrder.push(c);
  for (const c of cfg.categoryOrder ?? []) if (!nextOrder.includes(c)) nextOrder.push(c);
  const nextCfg = {
    ...cfg,
    categoryList,
    categoryOrder: nextOrder,
    updatedAt: new Date().toISOString(),
  };
  await putJson(LIBRARY_CONFIG_KEY, nextCfg);
  console.log('library-config.json 갱신 완료.');
  console.log('\n끝. 학습자 /library 새로고침해서 새 카테고리 노출 확인.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 9.2: dry-run 으로 매핑 검증**

```bash
cp packages/server/scripts/migrate-recategorize.mjs C:/project/tangobook/packages/server/scripts/
cd C:/project/tangobook/packages/server && node scripts/migrate-recategorize.mjs
```

Expected: dry-run 표 출력. (current → proposed) 한 줄씩. 적용 X.

- [ ] **Step 9.3: 사용자 확인 후 실제 적용**

⚠️ 이 step 은 R2 의 234권 storybook.json 을 patch (destructive). 사용자 명시 승인 후만 실행.

```bash
cd C:/project/tangobook/packages/server && node scripts/migrate-recategorize.mjs --apply
```

Expected: `ok=N skip=M fail=0`. fail > 0 이면 실패 list 보고 → proposal 수정 후 재실행.

- [ ] **Step 9.4: 적용 후 dump 재실행 + 카테고리별 권수 확인**

```bash
cd C:/project/tangobook/packages/server && node scripts/dump-books-by-category.mjs
```

Expected: 10개 카테고리 권수가 spec 표와 일치.

- [ ] **Step 9.5: commit**

```bash
cp C:/project/tangobook/packages/server/scripts/_data/books-by-category.json packages/server/scripts/_data/
git add packages/server/scripts/migrate-recategorize.mjs packages/server/scripts/_data/books-by-category.json
git commit -m "chore(scripts): migrate-recategorize.mjs — R2 storybook category 일괄 patch

why: propose-recategorize.mjs 산출물 (recategorize-proposal.json) 의 (id → 새
카테고리) 매핑을 R2 PutObject 로 적용. saveStorybook 우회 (title 안 바뀌므로
중복 체크 skip). library-config.json 도 categoryList + categoryOrder 갱신.

dry-run 검증 후 --apply 로 실행. books-by-category.json 도 적용 후 갱신
스냅샷으로 함께 커밋."
```

---

## Task 10: 학습자 화면 회귀 검증

**Files:** (확인만, 변경 없음)
- `packages/client/src/pages/LibraryPage.tsx`

- [ ] **Step 10.1: dev 서버에서 `/library` 동작 확인**

Run: `pnpm dev`
Browse: `/library`

확인:
- 새 10개 카테고리가 학습자 화면에 노출 (`공룡 친구들`, `곤충 친구들` 등)
- 책 카드 클릭 → BookDetailPage 정상 이동
- 비공개로 설정한 책은 라이브러리에 안 보임 (LibraryMaster 에서 👁 → 🚫 토글한 책 1권 만들어 검증)
- 카테고리 순서 = LibraryConfig.categoryOrder 적용

검증 실패 시: `mergeCategoryOrder` 로직 또는 `categoryList`/`categoryOrder` 분리 점검.

- [ ] **Step 10.2: spec 변경 없으므로 commit 없음 (다음 task 와 묶음)**

---

## Task 11: docs 업데이트 + main 푸시

**Files:**
- Modify: `CLAUDE.md` ("라이브러리 마스터" 섹션)

- [ ] **Step 11.1: CLAUDE.md "라이브러리 마스터 (2026-05-10)" 섹션 갱신**

기존 섹션 (라인 ~"## 라이브러리 마스터 (2026-05-10)") 전체를 다음으로 교체:

```markdown
## 라이브러리 마스터 (2026-05-10, 카테고리 편집 2026-05-16)
- **`/library-master`** — 라이브러리 노출 순서 + 카테고리 CRUD + 책 메타 편집 페이지 (저작도구 진입점 only). TopBar 우상단 📁 자료실 ▾ dropdown 첫 항목 "📚 라이브러리 마스터". AppShell (학습자) 에서는 노출 X.
- 좌-우 split: 좌측 카테고리 패널 (DnD reorder + ✏ 인라인 rename + 🗑 삭제 + ＋ 추가 input) + 우측 활성 카테고리 책 grid (DnD reorder, 카드 = aspect-3/4 표지 + 좌상단 ① 순서 chip · 카테고리 chip 드롭다운 + 우상단 👁 isPublic 토글 · 🎨 표지 변경) + 🎨 표지 변경 모달.
- **Cross-context DnD**: 단일 `DndContext` 안에서 (카테고리 reorder / 책 reorder / 책 → 좌측 카테고리 row 드롭으로 카테고리 변경) 3종을 `onDragEnd` 분기. 카테고리 droppable id 는 `cat:` prefix.
- **카테고리 CRUD**: 빈 카테고리만 즉시 삭제 가능. 책 있으면 `→ 이동` 모달로 target 카테고리 선택 후 일괄 이동 + 카테고리 삭제. 이름 변경 = 그 카테고리의 모든 책 `category` 필드 일괄 patch (`useCategoryActions`).
- **카테고리 (2026-05-16)**: 🌟 세계 명작 / 📜 전래 동화 / 🦕 공룡 친구들 / 🐛 곤충 친구들 / 🐯 육지 동물 친구들 / 🐬 바다 동물 친구들 / 🦅 하늘 동물 친구들 / 🌸 식물 친구들 / 🌌 우주와 자연 / 🫀 우리 몸 이야기. 234권 재분류 마이그: `propose-recategorize.mjs` (룰 기반) → `recategorize-proposal.json` 사람 검토 → `migrate-recategorize.mjs --apply` (R2 PutObject).
- 저장: `_index/library-config.json` (`LibraryConfig` shared type — `categoryOrder[]` + `bookPriority[cat] = string[]` + `categoryList[]` 빈 카테고리 보관). 서버 `GET/PUT /api/library-config`. LibraryPage 가 config 적용해서 카테고리/책 순서 정렬 (빈 카테고리는 학습자 화면 자동 hide).
```

- [ ] **Step 11.2: typecheck + lint**

```bash
pnpm typecheck && pnpm --filter client lint
```

Expected: 0 errors.

- [ ] **Step 11.3: commit + main 푸시 (자동 배포)**

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE.md): 라이브러리 마스터 — 카테고리 편집 + 234권 재분류 갱신

- 좌측 카테고리 CRUD (추가/이름변경/삭제 + 책 이동 모달)
- 우측 카드 카테고리 chip + 👁 isPublic 토글 추가
- Cross-context DnD (책 → 카테고리 row drop)
- 10개 카테고리 새 분류 명시 (공룡·곤충·육지/바다/하늘·식물·우주·우리몸)
- LibraryConfig.categoryList 필드 도입"

# main 자동 배포
git push origin HEAD:main
```

Expected: fast-forward push 성공.

- [ ] **Step 11.4: 배포 확인**

`/library` 와 `/library-master` 가 새 카테고리 + 편집 UI 로 정상 동작.

---

## Self-Review (체크리스트)

1. **Spec coverage:**
   - ✅ `LibraryConfig.categoryList` — Task 1
   - ✅ 좌측 패널 CRUD — Task 6
   - ✅ 우측 카드 chip + isPublic + DnD — Task 5 + 7
   - ✅ MoveBooksModal — Task 3
   - ✅ Cross-context DnD — Task 7
   - ✅ 재분류 스크립트 (propose + migrate) — Task 8 + 9
   - ✅ 학습자 화면 회귀 — Task 10
   - ✅ docs 갱신 + 배포 — Task 11

2. **Placeholder scan:** 없음 — 모든 코드 블록 완전 inline.

3. **Type consistency:**
   - `useCategoryActions` 의 method 이름 (`addCategory`, `renameCategory`, `deleteCategory`, `moveBooksAndDelete`, `setBookCategory`, `setBookPublic`) 이 Task 7 호출처와 일치 ✓
   - `MoveBooksModal` prop (`fromCategory`, `bookCount`, `candidates`, `onClose`, `onConfirm`) 이 Task 7 사용처와 일치 ✓
   - `CategoryPanel` prop (`onAdd`/`onRename`/`onDelete`/`onRequestMove`) 이 Task 7 wiring 과 일치 ✓
   - `LibraryConfig.categoryList?: string[]` 추가 (optional) — 기존 사용처 영향 X ✓
