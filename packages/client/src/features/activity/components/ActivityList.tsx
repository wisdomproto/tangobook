import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ActivityItem } from '@tangobook/shared';
import { cn } from '@/lib/cn';
import { worksheetParts } from '../lib/online-worksheet';

/**
 * 왼쪽 목록 — 갈래 ▸ (책·단원) ▸ 항목. 🔴 항목은 `<Link>`(= `<a href>`) — 크롤러가 따라간다.
 * 🔴 썸네일을 안 건다 — 도안 한 장 200KB 라 2,000장을 걸면 첫 화면이 죽는다.
 * 🔴 색칠 도안은 갈래 하나에 313장까지라 **책(파닉스는 단원)으로 한 겹 더 접는다** — 인쇄도 책 단위다.
 *    `section` 이 `group` 과 같은 종류(숨은그림·학습지)는 한 줄이 곧 한 권이라 그대로 편다.
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
  const [open, setOpen] = useState<Set<string>>(new Set());
  // 목록 JSON 이 늦게 오면 첫 렌더엔 current 가 없다 — 오면 그 갈래·책을 펼친다.
  const currentGroup = current?.group;
  const currentBook = current && isNested(current) ? bookId(current) : undefined;
  useEffect(() => {
    setOpen((s) => {
      const n = new Set(s);
      if (currentGroup) n.add(currentGroup);
      if (currentBook) n.add(currentBook);
      return n;
    });
  }, [currentGroup, currentBook]);

  const groups = useMemo(() => {
    const m = new Map<string, Map<string, ActivityItem[]>>();
    const needle = q.trim().toLowerCase();
    for (const it of items) {
      if (needle && !`${it.title} ${it.section}`.toLowerCase().includes(needle)) continue;
      const books = m.get(it.group) ?? new Map<string, ActivityItem[]>();
      const b = isNested(it) ? bookId(it) : '';
      books.set(b, [...(books.get(b) ?? []), it]);
      m.set(it.group, books);
    }
    return [...m.entries()];
  }, [items, q]);

  const searching = !!q.trim();
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <nav aria-label="활동 목록" className="flex flex-col gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 낱말·제목 찾기"
        aria-label="활동 찾기"
        className="w-full rounded-xl border border-ink-100 bg-cream-50 px-3 py-2.5 text-sm focus:border-coral-300 focus:bg-white focus:outline-none"
      />
      <div className="flex flex-col gap-1">
        {groups.map(([group, books]) => {
          const isOpen = searching || open.has(group);
          const flat = books.get('');
          const nested = [...books.entries()].filter(([b]) => b !== '');
          const count = [...books.values()].reduce((n, l) => n + l.length, 0);
          return (
            <div key={group}>
              <Toggle
                open={isOpen}
                onClick={() => toggle(group)}
                label={group}
                count={nested.length ? `${nested.length}권` : count}
                className="text-sm font-bold text-ink-700"
              />
              {isOpen && (
                <div className="ml-3 border-l border-ink-100 pl-2">
                  {flat && <ItemLinks list={flat} currentKey={currentKey} />}
                  {nested.map(([b, list]) => {
                    const bookOpen = searching || open.has(b);
                    return (
                      <div key={b}>
                        <Toggle
                          open={bookOpen}
                          onClick={() => toggle(b)}
                          label={list[0].section}
                          count={list.length}
                          className="text-sm font-semibold text-ink-700"
                        />
                        {bookOpen && (
                          <div className="ml-3 border-l border-ink-100 pl-2">
                            <ItemLinks list={list} currentKey={currentKey} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

const isNested = (it: ActivityItem) => it.section !== it.group;
/** 같은 제목이 다른 갈래에 있어도 섞이지 않게 갈래 + 제목으로 묶는다. */
const bookId = (it: ActivityItem) => `${it.group}|${it.section}`;

function Toggle({
  open,
  onClick,
  label,
  count,
  className,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
  count: number | string;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        'flex min-h-[36px] w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-cream-50',
        className
      )}
    >
      <span className="min-w-0 truncate">
        {open ? '▾' : '▸'} {label}
      </span>
      <span className="shrink-0 text-xs font-medium text-ink-500">{count}</span>
    </button>
  );
}

function ItemLinks({ list, currentKey }: { list: ActivityItem[]; currentKey?: string }) {
  const [params] = useSearchParams();
  return (
    <ul>
      {list.map((it) => {
        // 🔴 영어 워크지는 단원 아래 조각(Aa·Bb / an·at)을 한 줄씩 — 온라인은 조각 하나씩 쓴다(2026-09-15 사용자).
        const parts = it.kind === 'english' ? worksheetParts('english', it.key) : [];
        if (parts.length) {
          const on = it.key === currentKey;
          const cur = on ? (params.get('part') ?? parts[0].id) : null;
          const links = parts.map((p) => (
            <li key={`${it.key}-${p.id}`}>
              <Link
                to={`${it.path}?part=${encodeURIComponent(p.id)}`}
                className={cn(
                  'block truncate rounded-lg border-l-4 px-2 py-1.5 text-sm',
                  cur === p.id
                    ? 'border-coral-500 bg-coral-50 font-bold text-coral-700'
                    : 'border-transparent text-ink-700 hover:bg-cream-50'
                )}
              >
                {p.label}
              </Link>
            </li>
          ));
          // 🔴 Book 1 은 소단원(Aa Bb Cc) 없이 글자를 바로 편다(2026-09-15 사용자) — 글자 하나가 곧 한 조각.
          if (it.group.startsWith('Book 1')) return links;
          return (
            <UnitParts key={it.key} title={it.title} on={on}>
              {links}
            </UnitParts>
          );
        }
        return (
          <li key={it.key}>
            <Link
              to={it.path}
              className={cn(
                'block truncate rounded-lg border-l-4 px-2 py-1.5 text-sm',
                it.key === currentKey
                  ? 'border-coral-500 bg-coral-50 font-bold text-coral-700'
                  : 'border-transparent text-ink-700 hover:bg-cream-50'
              )}
            >
              {it.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** 단원 한 줄 — 눌러서 소리 덩이 줄을 접었다 편다. 지금 보는 단원은 펼쳐서 시작한다. */
function UnitParts({ title, on, children }: { title: string; on: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(on);
  useEffect(() => {
    if (on) setOpen(true);
  }, [on]);
  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex min-h-[36px] w-full items-center gap-1 truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-cream-50',
          on ? 'font-bold text-coral-700' : 'font-semibold text-ink-700'
        )}
      >
        {open ? '▾' : '▸'} {title}
      </button>
      {open && <ul className="ml-3 border-l border-ink-100 pl-2">{children}</ul>}
    </li>
  );
}
