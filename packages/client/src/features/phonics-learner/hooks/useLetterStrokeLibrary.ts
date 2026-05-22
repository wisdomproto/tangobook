import { useQuery } from '@tanstack/react-query';
import type { LetterStrokeLibrary, LetterTracingData } from '@tangobook/shared';

/**
 * 글로벌 알파벳 stroke 라이브러리 — R2 `_index/letter-stroke-library.json`.
 * 모든 영어 학습 컨텐츠 (phonics, 어휘, 단어 쓰기) 가 공유. 5분 staleTime 캐시.
 */
export function useLetterStrokeLibrary() {
  return useQuery({
    queryKey: ['letter-stroke-library'],
    queryFn: async (): Promise<LetterStrokeLibrary | null> => {
      const r = await fetch('/api/letter-stroke-library');
      if (!r.ok) return null;
      const j = await r.json();
      return (j.data ?? j) as LetterStrokeLibrary;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 글자 하나의 stroke 데이터 lookup.
 * library 우선, 없으면 fallback (책 inline) 사용.
 */
export function getLetterTracingData(
  library: LetterStrokeLibrary | null | undefined,
  letter: string,
  fallback?: LetterTracingData
): LetterTracingData | undefined {
  return library?.letters?.[letter] ?? fallback;
}
