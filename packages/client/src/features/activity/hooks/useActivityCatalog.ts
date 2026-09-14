import { useQuery } from '@tanstack/react-query';
import {
  coloringItems,
  hiddenObjectItems,
  worksheetItems,
  type ActivityItem,
  type ActivityKind,
  type ColoringCatalogEntry,
  type HiddenObjectCatalogEntry,
} from '@tangobook/shared';

const getJson = async <T>(url: string): Promise<T> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return (await r.json()) as T;
};

/** 허브·레이아웃이 공유하는 개수·첫 키 요약 — 같은 쿼리 키라 한 번만 받는다. */
export function useActivitySummary() {
  return useQuery({
    queryKey: ['activity-data', 'summary'],
    queryFn: () =>
      getJson<Record<string, { count: number; firstKey: string | null }>>(
        '/activity-data/summary.json'
      ),
    staleTime: 60 * 60 * 1000,
  });
}

/** 활동 종류별 목록 — 워크지는 커리큘럼(즉시), 색칠·숨은그림은 `/activity-data/*.json`. */
export function useActivityItems(kind: ActivityKind): {
  items: ActivityItem[];
  hiddenWords: Map<string, string[]>;
  coloringEntries: Map<string, ColoringCatalogEntry>;
  hiddenEntries: Map<string, HiddenObjectCatalogEntry>;
  loading: boolean;
  error: boolean;
} {
  const coloring = useQuery({
    queryKey: ['activity-data', 'coloring'],
    queryFn: () => getJson<ColoringCatalogEntry[]>('/activity-data/coloring.json'),
    enabled: kind === 'coloring',
    staleTime: 60 * 60 * 1000,
  });
  const hidden = useQuery({
    queryKey: ['activity-data', 'hidden-object'],
    queryFn: () => getJson<HiddenObjectCatalogEntry[]>('/activity-data/hidden-object.json'),
    enabled: kind === 'hidden-object',
    staleTime: 60 * 60 * 1000,
  });
  if (kind === 'hangul' || kind === 'english') {
    return {
      items: worksheetItems(kind),
      hiddenWords: new Map(),
      coloringEntries: new Map(),
      hiddenEntries: new Map(),
      loading: false,
      error: false,
    };
  }
  if (kind === 'coloring') {
    const data = coloring.data ?? [];
    return {
      items: coloringItems(data),
      hiddenWords: new Map(),
      coloringEntries: new Map(data.map((e) => [e.key, e])),
      hiddenEntries: new Map(),
      loading: coloring.isLoading,
      error: coloring.isError,
    };
  }
  const data = hidden.data ?? [];
  return {
    items: hiddenObjectItems(data),
    hiddenWords: new Map(data.map((h) => [h.key, h.words])),
    coloringEntries: new Map(),
    hiddenEntries: new Map(data.map((h) => [h.key, h])),
    loading: hidden.isLoading,
    error: hidden.isError,
  };
}
