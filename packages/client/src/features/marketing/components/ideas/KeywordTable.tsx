import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { cn } from '../../lib/utils';
import {
  type KeywordItem,
  type SortCol,
  type SortState,
  sortKeywords,
  sortIcon,
} from '../../lib/keyword-sort';

// ── Display maps (enum → Korean label, R-1) ───────────────────────────────────
const COMP_LABEL: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: '높음',
  MEDIUM: '중간',
  LOW: '낮음',
};
const COMP_COLOR: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

// CF :464–480
const intentColors: Record<string, string> = {
  informational: 'bg-blue-100 text-blue-700',
  commercial: 'bg-purple-100 text-purple-700',
  transactional: 'bg-orange-100 text-orange-700',
  navigational: 'bg-gray-100 text-gray-700',
};
const intentLabels: Record<string, string> = {
  informational: '정보',
  commercial: '상업',
  transactional: '거래',
  navigational: '탐색',
};
const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export interface ColumnSpec {
  key: SortCol | 'keyword' | 'intent';
  label: string;
  sortable?: boolean;
}

interface KeywordTableProps {
  rows: KeywordItem[];
  columns: ColumnSpec[];
  sortCols: SortState[];
  onToggleSort: (col: SortCol, shift: boolean) => void;
  isPinned: (keyword: string) => boolean;
  onTogglePin: (kw: KeywordItem) => void;
  onMakeContent?: (kw: KeywordItem) => void; // no-op-friendly (Q-5)
  lang: string;
}

export function KeywordTable({
  rows,
  columns,
  sortCols,
  onToggleSort,
  isPinned,
  onTogglePin,
  onMakeContent,
}: KeywordTableProps) {
  const sortable = columns.filter((c) => c.sortable).map((c) => c.key as SortCol);
  const displayRows = sortKeywords(rows, sortCols);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {/* Pin column */}
            <th className="w-8 px-2 py-2" />
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap',
                  col.sortable && 'cursor-pointer select-none hover:text-foreground'
                )}
                onClick={
                  col.sortable ? (e) => onToggleSort(col.key as SortCol, e.shiftKey) : undefined
                }
              >
                {col.label}
                {col.sortable && sortable.includes(col.key as SortCol)
                  ? sortIcon(sortCols, col.key as SortCol)
                  : col.sortable
                    ? ' ↕'
                    : null}
              </th>
            ))}
            {/* Actions column */}
            <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
              액션
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                키워드가 없습니다.
              </td>
            </tr>
          )}
          {displayRows.map((kw) => (
            <tr
              key={kw.keyword}
              className="border-b last:border-0 hover:bg-muted/30 transition-colors"
            >
              {/* Pin */}
              <td className="w-8 px-2 py-2 text-center">
                <button
                  onClick={() => onTogglePin(kw)}
                  className="text-lg leading-none hover:scale-110 transition-transform"
                  aria-label={isPinned(kw.keyword) ? '보관 해제' : '보관'}
                  title={isPinned(kw.keyword) ? '보관 해제' : '보관'}
                >
                  {isPinned(kw.keyword) ? '★' : '☆'}
                </button>
              </td>
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                  {col.key === 'keyword' && (
                    <span className="font-medium text-foreground">{kw.keyword}</span>
                  )}
                  {col.key === 'intent' && kw.searchIntent && (
                    <Badge
                      className={cn(
                        'text-xs',
                        intentColors[kw.searchIntent] ?? 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {intentLabels[kw.searchIntent] ?? kw.searchIntent}
                    </Badge>
                  )}
                  {col.key === 'priority' && (
                    <Badge
                      className={cn(
                        'text-xs',
                        priorityColors[kw.priority] ?? 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {kw.priority === 'high' ? '높음' : kw.priority === 'medium' ? '중간' : '낮음'}
                    </Badge>
                  )}
                  {col.key === 'volume' && (
                    <span className="text-muted-foreground">{kw.estimatedVolume ?? '-'}</span>
                  )}
                  {col.key === 'difficulty' && (
                    <span className="text-muted-foreground">{kw.difficulty ?? '-'}</span>
                  )}
                  {col.key === 'naver' && (
                    <span className="tabular-nums">
                      {kw.naverMonthly != null ? kw.naverMonthly.toLocaleString() : '-'}
                    </span>
                  )}
                  {col.key === 'google' && (
                    <span className="tabular-nums">
                      {kw.googleVolume != null ? kw.googleVolume.toLocaleString() : '-'}
                    </span>
                  )}
                  {col.key === 'competition' && kw.naverComp && (
                    <Badge className={cn('text-xs', COMP_COLOR[kw.naverComp])}>
                      {COMP_LABEL[kw.naverComp]}
                    </Badge>
                  )}
                  {/* googleComp is a numeric string from DataForSEO */}
                  {col.key === ('googleComp' as string) && (
                    <span className="tabular-nums text-muted-foreground">
                      {kw.googleComp ?? '-'}
                    </span>
                  )}
                  {col.key === ('googleCpc' as string) && (
                    <span className="tabular-nums text-muted-foreground">
                      {kw.googleCpc != null ? `$${kw.googleCpc.toFixed(2)}` : '-'}
                    </span>
                  )}
                </td>
              ))}
              {/* Actions */}
              <td className="px-3 py-2 text-right">
                {onMakeContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => onMakeContent(kw)}
                  >
                    콘텐츠 만들기
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
