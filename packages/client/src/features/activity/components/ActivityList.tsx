import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ActivityItem } from '@tangobook/shared';
import { cn } from '@/lib/cn';

/**
 * 왼쪽 목록 — 갈래로 접고 편다. 🔴 항목은 `<Link>`(= `<a href>`) — 크롤러가 따라간다.
 * 🔴 썸네일을 안 건다 — 도안 한 장 200KB 라 2,000장을 걸면 첫 화면이 죽는다.
 */
export function ActivityList({
  items,
  currentKey,
}: {
  items: ActivityItem[];
  currentKey?: string;
}) {
  const [q, setQ] = useState('');
  const current = items.find((i) => i.key === currentKey);
  const currentGroup = current?.group;
  const [open, setOpen] = useState<Set<string>>(() => new Set(current ? [current.group] : []));
  // 목록 JSON 이 늦게 오면 첫 렌더엔 current 가 없다 — 오면 그 갈래를 펼친다.
  useEffect(() => {
    if (currentGroup) setOpen((s) => new Set(s).add(currentGroup));
  }, [currentGroup]);
  const groups = useMemo(() => {
    const m = new Map<string, ActivityItem[]>();
    const needle = q.trim();
    for (const it of items) {
      if (needle && !`${it.title} ${it.section}`.includes(needle)) continue;
      m.set(it.group, [...(m.get(it.group) ?? []), it]);
    }
    return [...m.entries()];
  }, [items, q]);

  return (
    <nav aria-label="활동 목록" className="flex flex-col gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 낱말·제목 찾기"
        className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm"
      />
      <div className="flex flex-col gap-1">
        {groups.map(([group, list]) => {
          const isOpen = !!q.trim() || open.has(group);
          return (
            <div key={group}>
              <button
                onClick={() =>
                  setOpen((s) => {
                    const n = new Set(s);
                    if (n.has(group)) n.delete(group);
                    else n.add(group);
                    return n;
                  })
                }
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm font-bold text-ink-700 hover:bg-peach-100"
              >
                <span>
                  {isOpen ? '▾' : '▸'} {group}
                </span>
                <span className="text-xs font-medium text-ink-500">{list.length}</span>
              </button>
              {isOpen && (
                <ul className="ml-3 border-l border-ink-100 pl-2">
                  {list.map((it) => (
                    <li key={it.key}>
                      <Link
                        to={it.path}
                        className={cn(
                          'block truncate rounded px-2 py-1 text-sm',
                          it.key === currentKey
                            ? 'bg-coral-100 font-bold text-coral-700'
                            : 'text-ink-700 hover:bg-peach-100'
                        )}
                      >
                        {it.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
