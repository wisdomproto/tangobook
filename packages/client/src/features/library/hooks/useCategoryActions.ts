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
