import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABEL,
  type ActivityItem,
  type ActivityKind,
} from '@tangobook/shared';
import { PublicNav } from '@/components/PublicNav';
import { cn } from '@/lib/cn';
import { ActivityList } from './ActivityList';
import { useActivitySummary } from '../hooks/useActivityCatalog';

/** 종류 탭 링크 — 워크지는 첫 단원, 색칠·숨은그림은 `summary.json` 의 첫 정규 경로. */
function useFirstPaths(): Record<ActivityKind, string> {
  const { data } = useActivitySummary();
  return {
    hangul: '/activity/hangul/kr-h1-u01',
    english: '/activity/english/en-b1-u01',
    coloring: data?.coloring?.firstPath ?? '/activity',
    'hidden-object': data?.['hidden-object']?.firstPath ?? '/activity',
  };
}

/** 네 종류가 같은 틀 — 종류 탭 · 왼쪽 목록 · 오른쪽 활동. 인쇄 때는 오른쪽 미리보기만 남는다. */
export function ActivityLayout({
  kind,
  items,
  currentKey,
  children,
}: {
  kind: ActivityKind;
  items: ActivityItem[];
  currentKey?: string;
  children: ReactNode;
}) {
  const [listOpen, setListOpen] = useState(false);
  const firstPath = useFirstPaths();
  // 모바일에서 목록에서 다른 활동을 고르면 드로어를 닫는다(안 그러면 다음 화면 위에 그대로 덮여 있다).
  useEffect(() => setListOpen(false), [currentKey]);
  return (
    <>
      <div className="print:hidden">
        <PublicNav />
      </div>
      <main className="min-h-screen bg-cream-50 px-4 py-4 sm:px-6 md:px-8 print:min-h-0 print:bg-white print:p-0">
        {/* 🔴 인쇄는 A4 한 장 — 종이·여백을 고정해야 그림 높이(mm) 상한이 넘치지 않는다. */}
        <style>{'@media print { @page { size: A4 portrait; margin: 10mm } }'}</style>
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex gap-2 overflow-x-auto print:hidden">
            {ACTIVITY_KINDS.map((k) => (
              <Link
                key={k}
                to={k === kind && items[0] ? items[0].path : firstPath[k]}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-bold',
                  k === kind
                    ? 'bg-coral-600 text-white'
                    : 'bg-white text-ink-700 hover:bg-peach-100'
                )}
              >
                {ACTIVITY_KIND_LABEL[k]}
              </Link>
            ))}
          </div>
          <div className="grid gap-6 print:block md:grid-cols-[16rem_1fr]">
            <aside className="print:hidden">
              <button
                onClick={() => setListOpen((v) => !v)}
                className="mb-2 w-full rounded-lg bg-white px-3 py-2 text-left text-sm font-bold md:hidden"
              >
                ☰ 목록 {listOpen ? '접기' : '보기'}
              </button>
              <div
                className={cn(
                  listOpen ? 'block' : 'hidden',
                  'md:block md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto'
                )}
              >
                <ActivityList items={items} currentKey={currentKey} />
              </div>
            </aside>
            <section className="min-w-0">{children}</section>
          </div>
        </div>
      </main>
    </>
  );
}
