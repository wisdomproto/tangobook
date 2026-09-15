import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABEL,
  type ActivityItem,
  type ActivityKind,
} from '@tangobook/shared';
import { cn } from '@/lib/cn';
import { ActivityList } from './ActivityList';
import { useActivitySummary } from '../hooks/useActivityCatalog';
import { trackActivity } from '../lib/track';

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

/**
 * 네 종류가 같은 틀 — 헤더(로고·둘러보기 | 종류 탭) · 왼쪽 사이드바 목록 · 오른쪽 활동.
 * 인쇄 때는 오른쪽 미리보기만 남는다.
 * 🔴 사이트로 가는 길은 헤더 한 곳(2026-09-15 사용자) — 활동 아래 CTA 버튼은 걷어냈다.
 */
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

  const tabs = ACTIVITY_KINDS.map((k) => (
    <Link
      key={k}
      to={k === kind && items[0] ? items[0].path : firstPath[k]}
      aria-current={k === kind ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-[40px] shrink-0 items-center rounded-full px-4 text-sm font-bold transition',
        k === kind ? 'bg-coral-600 text-white' : 'text-ink-700 hover:bg-peach-100'
      )}
    >
      {ACTIVITY_KIND_LABEL[k]}
    </Link>
  ));

  return (
    <div className="min-h-screen bg-cream-50 print:min-h-0 print:bg-white">
      {/* 🔴 인쇄는 A4 한 장 — 종이·여백을 고정해야 그림 높이(mm) 상한이 넘치지 않는다. */}
      <style>{'@media print { @page { size: A4 portrait; margin: 10mm } }'}</style>

      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 shadow-sm backdrop-blur print:hidden">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="탱고북 홈" className="shrink-0">
            <img
              src="/logo/logo-kr-520.webp"
              alt="탱고북"
              width={1774}
              height={887}
              className="h-9 w-auto sm:h-10"
            />
          </Link>
          <Link
            to="/"
            onClick={() =>
              trackActivity('activity_cta', { kind, key: currentKey ?? '', target: 'home' })
            }
            className="inline-flex min-h-[36px] shrink-0 items-center rounded-full border-2 border-coral-300 px-3 text-xs font-bold text-coral-700 hover:bg-coral-50 sm:min-h-[40px] sm:px-4 sm:text-sm"
          >
            탱고북 둘러보기
          </Link>
          <nav aria-label="활동 종류" className="ml-auto hidden gap-1 md:flex">
            {tabs}
          </nav>
        </div>
        {/* 모바일은 폭이 없어 탭을 둘째 줄로 — 가로 스크롤, 오른쪽 끝에서 시작하지 않는다(넘치면 잘린다). */}
        <nav
          aria-label="활동 종류"
          className="flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
        >
          {tabs}
        </nav>
      </header>

      <div className="md:flex print:block">
        <aside className="border-b border-ink-100 bg-white print:hidden md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-72 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
          <button
            onClick={() => setListOpen((v) => !v)}
            aria-expanded={listOpen}
            className="min-h-[44px] w-full px-4 text-left text-sm font-bold text-ink-700 md:hidden"
          >
            ☰ 목록 {listOpen ? '접기' : '보기'}
          </button>
          <div className={cn(listOpen ? 'block' : 'hidden', 'px-3 pb-4 md:block md:pt-4')}>
            <ActivityList items={items} currentKey={currentKey} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 print:p-0">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
