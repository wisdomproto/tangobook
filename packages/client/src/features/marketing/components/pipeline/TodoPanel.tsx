import { useEffect, useMemo, useRef, useState } from 'react';
import { seriesLabel, type PipelineTodo } from '../../api/use-pipeline';

interface TodoPanelProps {
  todos: PipelineTodo[];
}

function CopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard 권한 거부 등 — 사용자가 code 블록에서 직접 복사 가능
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
        copied
          ? 'border-green-500/50 bg-green-500/10 text-green-600'
          : 'border-border bg-card text-foreground hover:bg-muted'
      }`}
    >
      {copied ? '복사됨!' : '복사'}
    </button>
  );
}

function BlockedBadge({ blocked }: { blocked: NonNullable<PipelineTodo['blocked']> }) {
  if (blocked === 'translation') {
    return (
      <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600">
        번역 대기
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-medium text-slate-500">
      파이프라인 미구축
    </span>
  );
}

/** 할 일 패널 — 시리즈별 그룹핑, 커맨드 복사 버튼, 블록 뱃지 */
export function TodoPanel({ todos }: TodoPanelProps) {
  const groups = useMemo(() => {
    const bySeries = new Map<string, PipelineTodo[]>();
    for (const todo of todos) {
      const arr = bySeries.get(todo.series);
      if (arr) arr.push(todo);
      else bySeries.set(todo.series, [todo]);
    }
    return [...bySeries.entries()];
  }, [todos]);

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-foreground">📋 할 일</h2>

      {todos.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground break-keep">
          ✅ 승인된 책의 마케팅 자산이 모두 채워졌어요
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([series, items]) => (
            <div key={series} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 text-sm font-semibold text-foreground">
                {seriesLabel(series)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  할 일 {items.length}건
                </span>
              </div>
              <ul className="space-y-3">
                {items.map((todo, i) => (
                  <li
                    key={`${todo.kind}-${todo.blocked ?? 'ready'}-${i}`}
                    className="rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground break-keep">
                        {todo.label}
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          ({todo.bookIds.length}권 대상)
                        </span>
                      </p>
                      {todo.blocked && <BlockedBadge blocked={todo.blocked} />}
                    </div>
                    {todo.command && (
                      <div className="mt-2 flex items-center gap-2">
                        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground">
                          {todo.command}
                        </code>
                        <CopyButton command={todo.command} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
