import { useState, type KeyboardEvent } from 'react';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { cn } from '../../lib/utils';
import { fetchNaverKeywords, type NaverKeywordRow } from '../../api/use-keywords';

interface NaverKeywordPanelProps {
  primaryKeyword: string;
  secondaryKeywords: string[];
  onSetPrimary: (kw: string) => void;
  onAddSecondary: (kw: string) => void;
}

const COMPETITION_LABEL: Record<NaverKeywordRow['competition'], string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

const COMPETITION_VARIANT: Record<
  NaverKeywordRow['competition'],
  'default' | 'secondary' | 'outline'
> = {
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline',
};

function formatVolume(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

export function NaverKeywordPanel({
  primaryKeyword,
  secondaryKeywords,
  onSetPrimary,
  onAddSecondary,
}: NaverKeywordPanelProps) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<NaverKeywordRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const kws = query
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (kws.length === 0) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchNaverKeywords(kws);
      setRows(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '키워드 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="키워드 입력 (쉼표로 구분, 최대 5개)"
          className="flex-1 text-xs"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="gap-1"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          조회
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{error}</p>
      )}

      {/* Results table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">키워드</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                  PC 검색
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                  모바일 검색
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">합계</th>
                <th className="px-2 py-1.5 text-center font-medium text-muted-foreground">
                  경쟁도
                </th>
                <th className="px-2 py-1.5 text-center font-medium text-muted-foreground">설정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const isPrimary = row.keyword === primaryKeyword;
                const isSecondary = secondaryKeywords.includes(row.keyword);
                return (
                  <tr
                    key={row.keyword}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      isPrimary && 'bg-primary/5'
                    )}
                  >
                    <td className="px-2 py-1.5 font-medium">
                      {row.keyword}
                      {isPrimary && (
                        <span className="ml-1.5 text-[10px] text-primary font-semibold">
                          (주요)
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatVolume(row.pcSearchVolume)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatVolume(row.mobileSearchVolume)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                      {formatVolume(row.totalSearchVolume)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <Badge variant={COMPETITION_VARIANT[row.competition]} className="text-[10px]">
                        {COMPETITION_LABEL[row.competition]}
                      </Badge>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="xs"
                          variant={isPrimary ? 'default' : 'outline'}
                          onClick={() => onSetPrimary(row.keyword)}
                          className="h-5 px-1.5 text-[10px]"
                          title="주요 키워드로 설정"
                        >
                          {isPrimary ? <Check size={10} /> : '주요'}
                        </Button>
                        <Button
                          size="xs"
                          variant={isSecondary ? 'secondary' : 'outline'}
                          onClick={() => onAddSecondary(row.keyword)}
                          disabled={isSecondary}
                          className="h-5 px-1.5 text-[10px]"
                          title="보조 키워드로 추가"
                        >
                          {isSecondary ? <Check size={10} /> : <Plus size={10} />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && rows.length === 0 && !error && (
        <p className="text-xs text-muted-foreground text-center py-4">
          키워드를 입력하고 조회하세요.
        </p>
      )}
    </div>
  );
}
