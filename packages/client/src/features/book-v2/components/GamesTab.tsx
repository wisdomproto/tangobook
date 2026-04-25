import { useMemo, useState } from 'react';
import { useGamesList, useDeleteGame, useGenerateGame } from '../hooks/useGames';
import { getGameEntry } from '@/features/games/registry/game-registry';
import type { BookGameInstance, BookManifest, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

// v2에서 현재 generate 지원하는 게임 타입
const SUPPORTED_GENERATE_TYPES = [
  { id: 'korean-line-matching', label: '🇰🇷 한글 그림-단어 선긋기', lang: 'ko' },
  { id: 'english-line-matching', label: '🇺🇸 영어 그림-단어 선긋기', lang: 'en' },
] as const;

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
  const generate = useGenerateGame(manifest.id);
  const [createOpen, setCreateOpen] = useState(false);

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
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-md font-black text-sm bg-coral-500 text-white shadow-pop hover:brightness-110"
          >
            + 새 게임 만들기
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

      {createOpen && (
        <GenerateGameForm
          manifest={manifest}
          isPending={generate.isPending}
          error={generate.error}
          onSubmit={(level, language, gameType, itemCount) =>
            generate.mutate(
              { level, language, gameType, itemCount },
              { onSuccess: () => setCreateOpen(false) }
            )
          }
          onCancel={() => setCreateOpen(false)}
        />
      )}

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
        💡 <strong>현재 지원 generate 게임</strong>: 한글/영어 line-matching (선긋기). 그 외 게임
        타입은 후속 sprint에서 추가 예정.
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

function GenerateGameForm({
  manifest,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  manifest: BookManifest;
  isPending: boolean;
  error: unknown;
  onSubmit: (level: ReadingLevel, language: string, gameType: string, itemCount: number) => void;
  onCancel: () => void;
}) {
  const v = manifest.usedVariants;
  const [level, setLevel] = useState<ReadingLevel | ''>(v.levels[0] ?? '');
  const [language, setLanguage] = useState<string>(v.languages[0] ?? 'ko');
  const [gameType, setGameType] = useState<string>(
    SUPPORTED_GENERATE_TYPES[0]?.id ?? 'korean-line-matching'
  );
  const [itemCount, setItemCount] = useState<number>(4);

  // 언어가 바뀌면 게임 타입 자동 매칭
  const filteredTypes = SUPPORTED_GENERATE_TYPES.filter((t) => t.lang === language);

  return (
    <div className="bg-white rounded-md p-4 shadow-soft border border-coral-200 space-y-3">
      <div className="text-sm font-black text-ink-900">+ 새 게임 만들기</div>
      <p className="text-xs text-ink-500 font-bold">
        텍스트 슬라이스의 핵심단어 풀에서 무작위 선택. 이미지는 런타임에 활성 그림체로 머지.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">레벨</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ReadingLevel)}
            className="w-full px-2 py-1.5 text-xs border border-ink-200 rounded-md"
          >
            <option value="">선택</option>
            {v.levels.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">언어</label>
          <select
            value={language}
            onChange={(e) => {
              const lng = e.target.value;
              setLanguage(lng);
              const next = SUPPORTED_GENERATE_TYPES.find((t) => t.lang === lng);
              if (next) setGameType(next.id);
            }}
            className="w-full px-2 py-1.5 text-xs border border-ink-200 rounded-md"
          >
            {v.languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
            게임 타입
          </label>
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-ink-200 rounded-md"
          >
            {filteredTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
            아이템 수
          </label>
          <input
            type="number"
            min={3}
            max={8}
            value={itemCount}
            onChange={(e) => setItemCount(Number(e.target.value))}
            className="w-full px-2 py-1.5 text-xs border border-ink-200 rounded-md"
          />
        </div>
      </div>
      {error ? (
        <div className="bg-warn/10 border border-warn/30 rounded-md p-2 text-xs text-ink-700 font-bold">
          {(error as Error).message}
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="px-3 py-1.5 rounded-md bg-ink-100 text-ink-700 font-bold text-xs"
        >
          취소
        </button>
        <button
          onClick={() => level && onSubmit(level, language, gameType, itemCount)}
          disabled={isPending || !level}
          className={cn(
            'px-3 py-1.5 rounded-md font-black text-xs',
            isPending || !level
              ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
              : 'bg-coral-500 text-white hover:brightness-110'
          )}
        >
          {isPending ? '생성 중...' : '+ 만들기'}
        </button>
      </div>
    </div>
  );
}
