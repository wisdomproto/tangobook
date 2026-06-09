import { useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '../../ui/button';
import { useFetchPublishCountsByLanguage } from '../../api/use-publish-records';
import { BulkScheduleDialog } from './BulkScheduleDialog';
import { cn } from '../../lib/utils';
import type { Project } from '../../types/database';

interface Props {
  project: Project;
}

export function SelfHostedCard({ project }: Props) {
  const site = project.published_site;
  const enabled = !!site?.enabled;
  const [open, setOpen] = useState(false);

  const { data: countsRaw } = useFetchPublishCountsByLanguage(project.id);

  // Merge raw counts with defaults for all active languages
  const counts: Record<string, { scheduled: number; published: number }> = {};
  if (enabled && site) {
    for (const lang of site.active_languages) {
      counts[lang] = countsRaw?.[lang] ?? { scheduled: 0, published: 0 };
    }
  }

  if (!enabled) {
    return (
      <div className="bg-card border border-dashed border-border rounded-lg p-4 opacity-60">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={18} className="text-muted-foreground" />
          <span className={cn('text-sm font-semibold', 'break-keep')}>내 사이트</span>
        </div>
        <p className={cn('text-xs text-muted-foreground', 'break-keep')}>
          프로젝트 설정에서 사이트 등록·활성화 필요
        </p>
      </div>
    );
  }

  const hostname = (() => {
    try {
      return new URL(site!.domain).hostname;
    } catch {
      return site!.domain;
    }
  })();

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={18} className="text-primary" />
          <div>
            <div className={cn('text-sm font-semibold', 'break-keep')}>내 사이트 ({hostname})</div>
            <div className="text-xs text-green-500">● 활성</div>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          {site!.active_languages.map((lang) => {
            const c = counts[lang] ?? { scheduled: 0, published: 0 };
            return (
              <div key={lang} className="text-xs flex justify-between">
                <span className="break-keep">{lang.toUpperCase()}</span>
                <span className="text-muted-foreground break-keep">
                  예약 {c.scheduled} · 발행 {c.published}
                </span>
              </div>
            );
          })}
        </div>

        <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
          일괄 예약 +
        </Button>
      </div>

      <BulkScheduleDialog project={project} open={open} onOpenChange={setOpen} />
    </>
  );
}
