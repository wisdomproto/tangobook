import { useEffect, useState } from 'react';
import { ExternalLink, FileText, FileUp } from 'lucide-react';
import { useStrategyTemplates } from '../../api/use-strategy-templates';
import { useProject } from '../../api/use-projects';
import { Button } from '../../ui/button';
import { StrategyImportDialog } from './StrategyImportDialog';

interface StrategyDashboardProps {
  projectId: string;
}

/**
 * 마케팅 전략 HTML 뷰어.
 * `public/marketing-strategy-templates/` 폴더의 전략 HTML을 `<select>`로 고르고
 * `<iframe>`으로 렌더한다. 헤더의 "전략 HTML 임포트" 버튼으로 파싱→프로젝트 적용.
 * ContentFlow `strategy-dashboard.tsx` 충실 이식 (Next 제거, 사이드바 평면화로 임포트 버튼 인라인).
 */
export function StrategyDashboard({ projectId }: StrategyDashboardProps) {
  const { data: templates = [], isLoading } = useStrategyTemplates();
  const { data: project } = useProject(projectId);

  const [selected, setSelected] = useState<string>('');
  const [importOpen, setImportOpen] = useState(false);

  // 템플릿 로드 후 첫 항목 자동 선택
  useEffect(() => {
    if (templates.length > 0) {
      setSelected((prev) => prev || templates[0].filename);
    }
  }, [templates]);

  const selectedTpl = templates.find((t) => t.filename === selected);

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b bg-background px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            <span className="text-base font-bold break-keep">마케팅 전략</span>
            {project?.name && (
              <span className="text-xs text-muted-foreground break-keep">· {project.name}</span>
            )}
          </div>
          <div className="min-w-[240px] max-w-[520px] flex-1">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={isLoading || templates.length === 0}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {isLoading && <option>불러오는 중…</option>}
              {!isLoading && templates.length === 0 && (
                <option>등록된 마케팅 전략 파일이 없습니다</option>
              )}
              {templates.map((t) => (
                <option key={t.filename} value={t.filename}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          {selectedTpl && (
            <a
              href={selectedTpl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              새 창 열기 <ExternalLink size={11} />
            </a>
          )}
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp size={14} className="mr-1.5" />
            전략 HTML 임포트
          </Button>
        </div>
        {selectedTpl?.description && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground break-keep">
            {selectedTpl.description}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-muted/20">
        {selectedTpl ? (
          <iframe
            key={selectedTpl.filename}
            src={selectedTpl.url}
            className="h-full w-full border-0 bg-white"
            title={selectedTpl.title}
          />
        ) : (
          !isLoading && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileText size={32} className="opacity-40" />
              <p className="text-sm break-keep">등록된 마케팅 전략 파일이 없습니다</p>
              <p className="text-xs break-keep">
                <code className="rounded bg-muted px-1.5 py-0.5">
                  public/marketing-strategy-templates/
                </code>{' '}
                폴더에 HTML을 넣으세요
              </p>
            </div>
          )
        )}
      </div>

      {importOpen && (
        <StrategyImportDialog
          projectId={projectId}
          open={importOpen}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
