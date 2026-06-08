export type SortCol = 'volume' | 'naver' | 'google' | 'difficulty' | 'priority' | 'competition';
export interface SortState {
  col: SortCol;
  dir: 'asc' | 'desc';
}

export interface KeywordItem {
  keyword: string;
  category: string;
  searchIntent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  priority: 'high' | 'medium' | 'low';
  estimatedVolume?: string;
  difficulty?: string;
  used?: boolean;
  naverMonthly?: number;
  naverPc?: number;
  naverMobile?: number;
  naverComp?: 'HIGH' | 'MEDIUM' | 'LOW';
  googleVolume?: number;
  googleComp?: string;
  googleCpc?: number;
}

const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
const difficultyOrder: Record<string, number> = {
  어려움: 3,
  Hard: 3,
  보통: 2,
  Medium: 2,
  쉬움: 1,
  Easy: 1,
};
const volumeOrder: Record<string, number> = {
  높음: 3,
  High: 3,
  중간: 2,
  Medium: 2,
  낮음: 1,
  Low: 1,
};
// Enum (R-1) — CF used 높음/중간/낮음; we key on the SearchAd enum.
const compOrder: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export function colValue(kw: KeywordItem, col: SortCol): number {
  if (col === 'naver') return kw.naverMonthly ?? -1;
  if (col === 'google') return kw.googleVolume ?? -1;
  if (col === 'volume') return volumeOrder[kw.estimatedVolume || ''] ?? 0;
  if (col === 'priority') return priorityOrder[kw.priority] ?? 0;
  if (col === 'difficulty') return difficultyOrder[kw.difficulty || ''] ?? 0;
  if (col === 'competition') return compOrder[kw.naverComp || ''] ?? 0;
  return 0;
}

/** Click: replace with single sort & cycle desc→asc→remove. Shift+click: append a column. (CF :440–453) */
export function toggleSort(prev: SortState[], col: SortCol, shift: boolean): SortState[] {
  const idx = prev.findIndex((s) => s.col === col);
  if (idx >= 0) {
    const cur = prev[idx];
    if (cur.dir === 'desc')
      return prev.map((s, i) => (i === idx ? { ...s, dir: 'asc' as const } : s));
    return prev.filter((_, i) => i !== idx); // was asc → remove
  }
  if (shift) return [...prev, { col, dir: 'desc' as const }];
  return [{ col, dir: 'desc' as const }];
}

export function sortIcon(sortCols: SortState[], col: SortCol): string {
  const entry = sortCols.find((s) => s.col === col);
  if (!entry) return ' ↕';
  const idx = sortCols.indexOf(entry);
  const num = sortCols.length > 1 ? `${idx + 1}` : '';
  return entry.dir === 'desc' ? ` ${num}↓` : ` ${num}↑`;
}

export function sortKeywords(rows: KeywordItem[], sortCols: SortState[]): KeywordItem[] {
  if (sortCols.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const { col, dir } of sortCols) {
      const av = colValue(a, col);
      const bv = colValue(b, col);
      if (av !== bv) return dir === 'desc' ? bv - av : av - bv;
    }
    return 0;
  });
}
