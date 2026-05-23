import { useQuery } from '@tanstack/react-query';
import type { KoreanJamoStrokeLibrary, LetterTracingData } from '@tangobook/shared';
import { composeKoreanSyllable } from '@tangobook/shared';

/**
 * 한글 자모 stroke 라이브러리 — R2 `_index/korean-jamo-stroke-library.json`.
 * 한글 학습 컨텐츠가 음절 자동 합성 (`composeKoreanSyllable`) 에 사용.
 * 5분 staleTime 캐시 (영어 라이브러리와 동일 정책).
 */
export function useKoreanJamoStrokeLibrary() {
  return useQuery({
    queryKey: ['korean-jamo-stroke-library'],
    queryFn: async (): Promise<KoreanJamoStrokeLibrary | null> => {
      const r = await fetch('/api/korean-jamo-stroke-library');
      if (!r.ok) return null;
      const j = await r.json();
      return (j.data ?? j) as KoreanJamoStrokeLibrary;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 한글 음절 → 자동 합성된 stroke 데이터.
 * 자모 base 가 부족하면 fallback (legacy / undefined).
 */
export function getKoreanSyllableTracingData(
  library: KoreanJamoStrokeLibrary | null | undefined,
  syllable: string,
  fallback?: LetterTracingData
): LetterTracingData | undefined {
  if (!library?.jamo) return fallback;
  const composed = composeKoreanSyllable(syllable, library.jamo);
  return composed ?? fallback;
}
