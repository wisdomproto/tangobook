import { useMemo, useState } from 'react';
import { useGamesList, useDeleteGame } from '../hooks/useGames';
import { getGameEntry } from '@/features/games/registry/game-registry';
import type { BookGameInstance, BookManifest, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface GamesTabProps {
  manifest: BookManifest;
}

export function GamesTab({ manifest }: GamesTabProps) {
  const [levelFilter, setLevelFilter] = useState<ReadingLevel | ''>('');
  const [langFilter, setLangFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data: games, isLoading } = useGamesList(manifest.id, {
    level: levelFilter || undefined,
    language: langFilter || undefined,
  });
  const remove = useDeleteGame(manifest.id);

  const filtered = useMemo(() => {
    if (!games) return [];
    return typeFilter ? games.filter((g) => g.gameType === typeFilter) : games;
  }, [games, typeFilter]);

  // 게임 타입별 카운트 (필터 칩용)
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of games ?? []) {
      counts.set(g.gameType, (counts.get(g.gameType) ?? 0) + 1);
    }
    return counts;
  }, [games]);

  const handleDelete = (gameId: string) => {
    if (!window.confirm('이 게임을 삭제할까요?')) return;
    remove.mutate(gameId);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* 헤더 + 필터 */}
      <div className="bg-white rounded-md p-4 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-ink-900 font-display">🎮 게임 인스턴스</h2>
            <p className="text-xs text-ink-500 font-bold mt-0.5">
              {isLoading ? '로딩...' : `총 ${filtered.length}개 (${games?.length ?? 0} 전체)`}
            </p>
          </div>
          <button
            disabled
            className="px-4 py-2 rounded-md font-black text-sm bg-ink-100 text-ink-300 cursor-not-allowed"
            title="다음 sprint에서 구현"
          >
            + 새 게임 (다음 sprint)
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Field label="레벨">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as ReadingLevel | '')}
              className="input"
            >
              <option value="">전체</option>
              {manifest.usedVariants.levels.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
          </Field>
          <Field label="언어">
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="input"
            >
              <option value="">전체</option>
              {manifest.usedVariants.languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="게임 타입">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">전체</option>
              {[...typeCounts.entries()].map(([t, c]) => (
                <option key={t} value={t}>
                  {t} ({c})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {remove.isError && <ErrorBox>삭제 실패: {(remove.error as Error).message}</ErrorBox>}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-peach-50 rounded-md p-6 text-center text-sm text-ink-700 font-bold">
          {games && games.length === 0
            ? '아직 게임이 없습니다.'
            : '필터 조건에 맞는 게임이 없습니다.'}
          <br />
          <span className="text-xs text-ink-500 font-bold">
            게임 생성 흐름은 다음 sprint(3b-7e-ii)에서 구현됩니다.
          </span>
        </div>
      )}

      {filtered.map((g) => (
        <GameCard key={g.id} game={g} onDelete={() => handleDelete(g.id)} />
      ))}

      <div className="bg-peach-50 rounded-md p-4 text-xs text-ink-700 font-bold leading-relaxed">
        💡 <strong>다음 sprint 기능</strong>:
        <ul className="list-disc list-inside mt-2 space-y-1 font-normal">
          <li>3b-7e-ii — Generate (Gemini로 게임 데이터 자동 생성, 게임 타입별 다양)</li>
          <li>이미지 업로드 + imageRefs 자동 추출</li>
          <li>편집 (config 파라미터 조정)</li>
        </ul>
      </div>
    </div>
  );
}

function GameCard({ game, onDelete }: { game: BookGameInstance; onDelete: () => void }) {
  const entry = getGameEntry(game.gameType);
  const refCount = game.imageRefs?.length ?? 0;
  const koMap = entry ? `${entry.icon} ${entry.nameKo}` : game.gameType;

  return (
    <div className="bg-white rounded-md shadow-soft p-4 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-coral-100 text-coral-700 font-mono font-black text-[11px]">
            {game.level}
          </span>
          <span className="px-2 py-0.5 rounded bg-peach-100 text-coral-600 font-mono font-bold text-[11px]">
            {game.language}
          </span>
          <span className="text-sm font-black text-ink-900">{koMap}</span>
          {refCount > 0 && (
            <span className="text-[10px] text-ink-500 font-bold">imageRefs {refCount}</span>
          )}
        </div>
        <div className="text-[11px] text-ink-500 font-bold mt-1 truncate">
          {game.id} · {new Date(game.createdAt).toLocaleString('ko-KR')}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="px-3 py-1.5 rounded-md bg-danger/10 text-danger font-bold text-xs hover:bg-danger/20 shrink-0"
      >
        🗑️
      </button>

      <style>{`
        .input {
          width: 100%;
          padding: 0.4rem 0.6rem;
          background: white;
          border: 1px solid var(--ink-200, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: var(--ink-900, #0f172a);
          font-family: inherit;
        }
        .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
      <style>{`
        .input {
          width: 100%;
          padding: 0.4rem 0.6rem;
          background: white;
          border: 1px solid var(--ink-200, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: var(--ink-900, #0f172a);
          font-family: inherit;
        }
        .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
      `}</style>
    </div>
  );
}

function ErrorBox({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-sm text-danger font-bold">
      {children}
    </div>
  );
}
