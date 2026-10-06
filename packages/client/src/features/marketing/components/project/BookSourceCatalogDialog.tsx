import { useMemo, useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { useContentSources, useCreateContentFromSource } from '../../api/use-content-sources';
import { useUIStore } from '../../store/ui-store';
import type { Content, ContentSource } from '../../types/database';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Input } from '../../ui/input';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  contents: Content[];
}

const STATE_LABEL = {
  approved: { text: '승인', className: 'bg-emerald-100 text-emerald-700' },
  unapproved: { text: '승인 해제', className: 'bg-amber-100 text-amber-700' },
  archived: { text: '원본 보관됨', className: 'bg-slate-100 text-slate-600' },
} as const;

export function BookSourceCatalogDialog({ open, onOpenChange, projectId, contents }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unplanned' | 'planned'>('all');
  const [pendingSource, setPendingSource] = useState<ContentSource | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const { data: sources = [], isLoading, error } = useContentSources(projectId);
  const createContent = useCreateContentFromSource();
  const setSelectedContentId = useUIStore((state) => state.setSelectedContentId);
  const planCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const content of contents) {
      if (!content.content_source_id) continue;
      counts.set(content.content_source_id, (counts.get(content.content_source_id) ?? 0) + 1);
    }
    return counts;
  }, [contents]);
  const filtered = sources.filter((source) => {
    const planCount = planCounts.get(source.id) ?? 0;
    if (filter === 'unplanned' && planCount > 0) return false;
    if (filter === 'planned' && planCount === 0) return false;
    const needle = query.trim().toLocaleLowerCase('ko');
    if (!needle) return true;
    return `${source.title} ${source.category ?? ''}`.toLocaleLowerCase('ko').includes(needle);
  });

  function beginPlan(source: ContentSource) {
    setPendingSource(source);
    setPlanTitle(`${source.title} · `);
  }

  function createPlan() {
    if (!pendingSource || !planTitle.trim()) return;
    createContent.mutate(
      { projectId, source: pendingSource, sortOrder: contents.length, title: planTitle.trim() },
      {
        onSuccess: (content) => {
          setSelectedContentId(content.id);
          setPendingSource(null);
          setPlanTitle('');
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[82vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>책 원본</DialogTitle>
          <DialogDescription>
            editor2에서 승인된 책이 자동으로 들어옵니다. 여기서는 원본을 수정하지 않고 마케팅 기획을
            만듭니다.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="책 제목·카테고리 검색"
          />
        </div>

        <div className="flex gap-1">
          {(
            [
              ['all', '전체'],
              ['unplanned', '미기획'],
              ['planned', '기획 있음'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                filter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {pendingSource && (
          <div className="flex items-end gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="source-plan-title" className="mb-1 block text-xs font-semibold">
                {pendingSource.title}의 마케팅 기획 이름
              </label>
              <Input
                id="source-plan-title"
                value={planTitle}
                onChange={(event) => setPlanTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') createPlan();
                }}
                autoFocus
                placeholder="예: 자정과 유리 구두 쇼츠"
              />
            </div>
            <Button variant="outline" onClick={() => setPendingSource(null)}>
              취소
            </Button>
            <Button onClick={createPlan} disabled={!planTitle.trim() || createContent.isPending}>
              기획 생성
            </Button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중…</p>
          )}
          {error && <p className="py-8 text-center text-sm text-destructive">{error.message}</p>}
          {!isLoading && !error && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {sources.length === 0 ? '승인된 책 원본이 아직 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          )}
          {filtered.map((source) => {
            const planCount = planCounts.get(source.id) ?? 0;
            const state = STATE_LABEL[source.source_state];
            const disabled = source.source_state !== 'approved' || createContent.isPending;
            return (
              <div key={source.id} className="flex items-center gap-3 rounded-lg border p-3">
                {source.cover_image_url ? (
                  <img
                    src={encodeURI(source.cover_image_url)}
                    alt=""
                    className="h-16 w-12 shrink-0 rounded object-cover bg-muted"
                  />
                ) : (
                  <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-muted">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="truncate text-sm">{source.title}</strong>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${state.className}`}
                    >
                      {state.text}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[source.category, `${source.languages.length}개 언어`, `기획 ${planCount}개`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={planCount > 0 ? 'outline' : 'default'}
                  disabled={disabled}
                  onClick={() => beginPlan(source)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {planCount > 0 ? '기획 추가' : '첫 기획'}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
