import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VocabularyUnit, VocabularyUnitSummary } from '@tangobook/shared';
import { vocabularyUnitApi } from '../api/vocabulary-unit.api';
import { useStorybooks, useStorybook } from '@/features/storybook';
import {
  deriveStorybookUnit,
  deriveStorybookUnitSummary,
  isStorybookUnitId,
  storybookIdFromUnitId,
} from '../lib/derive-storybook-unit';

export const VOCAB_UNITS_KEY = ['vocabulary-units'];
export const VOCAB_UNIT_KEY = (id: string) => ['vocabulary-units', id];

/** Cambridge + Custom (R2 카탈로그). storybook derive 는 useVocabularyUnits 가 합침. */
function useCatalogUnits() {
  return useQuery({
    queryKey: VOCAB_UNITS_KEY,
    queryFn: vocabularyUnitApi.list,
    staleTime: 30_000,
  });
}

/**
 * 어휘 단원 통합 목록 — Cambridge / Custom (R2 카탈로그) + Storybook derived (책당 1 단원).
 * 동기화 자동: 책 추가/수정/삭제 시 책 list 캐시 invalidate 되면 자동 반영.
 */
export function useVocabularyUnits() {
  const catalogQuery = useCatalogUnits();
  const storybooksQuery = useStorybooks();

  const merged: VocabularyUnitSummary[] | undefined = useMemo(() => {
    if (!catalogQuery.data && !storybooksQuery.data) return undefined;
    const catalog = catalogQuery.data ?? [];
    const storybookSummaries = (storybooksQuery.data ?? [])
      // 공개책 + 핵심단어 1개 이상 보유 (koCompletion.vocabulary)
      .filter((b) => b.isPublic && b.koCompletion?.vocabulary !== false)
      .map(deriveStorybookUnitSummary);
    return [...catalog, ...storybookSummaries];
  }, [catalogQuery.data, storybooksQuery.data]);

  return {
    data: merged,
    isLoading: catalogQuery.isLoading || storybooksQuery.isLoading,
    isError: catalogQuery.isError || storybooksQuery.isError,
  };
}

/**
 * 단일 단원 fetch.
 * - 'book-{id}' → useStorybook 으로 책 fetch + 실시간 derive
 * - 그 외 → R2 카탈로그 fetch
 *
 * @param preferredStyle book-{id} 단원일 때 학습자가 고른 그림체 — 게임/미리보기 이미지를
 *   그 그림체로 지정 (derive 는 캐시된 책 데이터 기반 계산이라 그림체 변경 시 재fetch 없이 재derive).
 */
export function useVocabularyUnit(id: string | undefined, preferredStyle?: string) {
  const isBookUnit = id ? isStorybookUnitId(id) : false;
  const bookId = id && isBookUnit ? storybookIdFromUnitId(id) : null;

  const bookQuery = useStorybook(bookId ?? undefined);
  const catalogQuery = useQuery({
    queryKey: id ? VOCAB_UNIT_KEY(id) : ['vocabulary-units', null],
    queryFn: () => vocabularyUnitApi.getById(id!),
    enabled: !!id && !isBookUnit,
    staleTime: 30_000,
  });

  if (isBookUnit) {
    return {
      data: bookQuery.data ? deriveStorybookUnit(bookQuery.data, preferredStyle) : undefined,
      isLoading: bookQuery.isLoading,
      isError: bookQuery.isError,
    } as { data: VocabularyUnit | undefined; isLoading: boolean; isError: boolean };
  }
  return {
    data: catalogQuery.data,
    isLoading: catalogQuery.isLoading,
    isError: catalogQuery.isError,
  };
}

export function useUpsertVocabularyUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unit: VocabularyUnit) => vocabularyUnitApi.upsert(unit),
    onSuccess: (_data, unit) => {
      void qc.invalidateQueries({ queryKey: VOCAB_UNITS_KEY });
      void qc.invalidateQueries({ queryKey: VOCAB_UNIT_KEY(unit.id) });
    },
  });
}

export function useDeleteVocabularyUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vocabularyUnitApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: VOCAB_UNITS_KEY });
    },
  });
}

export function useSeedCambridge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => vocabularyUnitApi.seedCambridge(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: VOCAB_UNITS_KEY });
    },
  });
}
