import { useQuery } from '@tanstack/react-query';
import type { ColoringItem } from '../components/players/ColoringPlayer';

/**
 * 색칠 도안 — 두 파일로 나눠 받는다.
 *
 * 🔴 `manifest.json` 은 **920KB** 라 학습 화면이 카드를 그리자고 받을 수 없다. 그래서
 *    「이 책에 도안이 있나」는 `book-index.json`(책 id → 장수, 4.7KB)만 보고 답하고,
 *    도안 목록은 **색칠을 실제로 열 때** manifest 에서 걸러 쓴다. 둘 다 굽는 곳은
 *    `packages/server/scripts/build-coloring-manifest.mjs` 한 곳이다.
 */
interface ColoringSheet {
  key: string;
  group: string;
  section: string;
  unitId: string;
  word: string;
  language?: 'korean' | 'english' | 'zh';
  lineartUrl: string;
  answerUrl?: string | null;
  originalUrl?: string | null;
  ttsUrl?: string | null;
}

/** 책 id → 도안 장수. 없으면 빈 객체(색칠 카드가 안 뜰 뿐, 화면은 멀쩡). */
export function useColoringBookIndex(): Record<string, number> {
  const { data } = useQuery({
    queryKey: ['coloring', 'book-index'],
    queryFn: async (): Promise<Record<string, number>> => {
      const res = await fetch('/coloring/book-index.json');
      if (!res.ok) throw new Error(`coloring book-index ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
  return data ?? {};
}

/**
 * 그 책의 도안 목록. `enabled` 가 false 면 manifest 를 받지 않는다 — 색칠을 열 때만 받게 하려고.
 *
 * 🔴 정답본은 안 굽는 게 정책이라 색 출처는 **원본 삽화**다(`ColoringItem.colorSourceUrl` 주석 참조).
 */
export function useColoringItems(bookId: string | undefined, enabled: boolean): ColoringItem[] {
  const { data } = useQuery({
    queryKey: ['coloring', 'manifest'],
    queryFn: async (): Promise<ColoringSheet[]> => {
      const res = await fetch('/coloring/manifest.json');
      if (!res.ok) throw new Error(`coloring manifest ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: enabled && !!bookId,
    retry: 1,
  });
  if (!data || !bookId) return [];
  return data
    .filter((s) => String(s.unitId) === bookId)
    .map((s) => ({
      word: s.word,
      lineartUrl: s.lineartUrl,
      colorSourceUrl: s.answerUrl ?? s.originalUrl ?? '',
      originalUrl: s.originalUrl ?? null,
      ttsUrl: s.ttsUrl ?? null,
      storybookId: bookId,
      language: s.language ?? 'korean',
    }))
    .filter((i) => i.colorSourceUrl);
}
