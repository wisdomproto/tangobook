import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VocabularyUnit } from '@tangobook/shared';
import { vocabularyUnitApi } from '../api/vocabulary-unit.api';

export const VOCAB_UNITS_KEY = ['vocabulary-units'];
export const VOCAB_UNIT_KEY = (id: string) => ['vocabulary-units', id];

export function useVocabularyUnits() {
  return useQuery({
    queryKey: VOCAB_UNITS_KEY,
    queryFn: vocabularyUnitApi.list,
    staleTime: 30_000,
  });
}

export function useVocabularyUnit(id: string | undefined) {
  return useQuery({
    queryKey: id ? VOCAB_UNIT_KEY(id) : ['vocabulary-units', null],
    queryFn: () => vocabularyUnitApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
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
