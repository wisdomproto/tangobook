import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/design-system';
import { useGenerateGame } from '../hooks/useGameMutations';
import { gamesApi } from '../api/games.api';
import { getGamesForContext, getGameEntry } from '../registry';
import { GameCard } from './GameCard';
import { GameCreatorModal } from './GameCreatorModal';
import { GamePreviewModal } from './GamePreviewModal';
import { DotEditorModal } from './DotEditorModal';
import { useEditorLang } from '@/contexts/EditorLangContext';
import type {
  Storybook,
  GameInstance,
  GameDifficulty,
  GameTypeId,
  GameConfig,
  ConnectTheDotsData,
} from '@tangobook/shared';

interface GamesTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function GamesTab({ storybook, onUpdate, onSave }: GamesTabProps) {
  const allGames = storybook.games ?? [];
  // /editor2 외부 언어. null 이면 v1 백업 — 필터링 안 함
  const externalLang = useEditorLang();
  const isControlled = externalLang !== null;
  const [showCreator, setShowCreator] = useState(false);
  const [previewGame, setPreviewGame] = useState<GameInstance | null>(null);
  const [editDotGame, setEditDotGame] = useState<GameInstance | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(
    null
  );

  const generateMutation = useGenerateGame();

  const storybookType = storybook.type ?? 'storybook';
  const fullAvailable = useMemo(
    () =>
      getGamesForContext(
        storybookType,
        storybook.phonicsConfig?.language,
        storybook.phonicsConfig?.level
      ),
    [storybookType, storybook.phonicsConfig?.language, storybook.phonicsConfig?.level]
  );

  // 외부 언어 따라 게임 필터링
  // - language 필드가 'ko'/'en' 인 게임은 해당 언어에만 노출
  // - 언어 중립 게임 (language undefined) 은 모든 언어에 노출
  // - 'ko'/'en' 외 언어 (ja/zh/...) 에서는 중립 게임만 노출
  const matchesActiveLang = useCallback(
    (gameLang: 'ko' | 'en' | undefined): boolean => {
      if (!isControlled) return true;
      if (!gameLang) return true; // 언어 중립
      return gameLang === externalLang;
    },
    [isControlled, externalLang]
  );

  const availableGames = useMemo(
    () => fullAvailable.filter((entry) => matchesActiveLang(entry.language)),
    [fullAvailable, matchesActiveLang]
  );

  // 표시할 게임 인스턴스도 필터링
  const games = useMemo(() => {
    if (!isControlled) return allGames;
    return allGames.filter((g) => {
      const entry = getGameEntry(g.gameType);
      return matchesActiveLang(entry?.language);
    });
  }, [allGames, isControlled, matchesActiveLang]);

  const handleGenerate = useCallback(
    (gameType: GameTypeId, title: string, difficulty: GameDifficulty, config: GameConfig) => {
      generateMutation.mutate(
        { storybookId: storybook.id, gameType, config },
        {
          onSuccess: (data) => {
            const newGame: GameInstance = {
              id: crypto.randomUUID(),
              gameType,
              title,
              difficulty,
              createdAt: new Date().toISOString(),
              config,
              data,
            };
            onUpdate((draft) => {
              if (!draft.games) draft.games = [];
              draft.games.push(newGame);
            });
            onSave();
            setShowCreator(false);
          },
        }
      );
    },
    [storybook.id, generateMutation, onUpdate, onSave]
  );

  const handleGenerateAll = useCallback(async () => {
    // 이미 생성된 게임 타입 제외
    const existingTypes = new Set((storybook.games ?? []).map((g) => g.gameType));
    const toGenerate = availableGames.filter((entry) => !existingTypes.has(entry.id));

    if (toGenerate.length === 0) {
      alert('모든 게임이 이미 생성되어 있습니다.');
      return;
    }

    if (!confirm(`${toGenerate.length}개 게임을 모두 생성하시겠습니까?`)) return;

    setBatchProgress({ current: 0, total: toGenerate.length });

    for (let i = 0; i < toGenerate.length; i++) {
      const entry = toGenerate[i];
      setBatchProgress({ current: i + 1, total: toGenerate.length });

      try {
        const data = await gamesApi.generate({
          storybookId: storybook.id,
          gameType: entry.id,
          config: entry.defaultConfig,
        });

        const newGame: GameInstance = {
          id: crypto.randomUUID(),
          gameType: entry.id,
          title: entry.nameKo,
          difficulty: 'easy',
          createdAt: new Date().toISOString(),
          config: entry.defaultConfig,
          data,
        };
        onUpdate((draft) => {
          if (!draft.games) draft.games = [];
          draft.games.push(newGame);
        });
        onSave();
      } catch (err) {
        console.error(`${entry.nameKo} 생성 실패:`, err);
      }
    }

    setBatchProgress(null);
  }, [storybook.id, storybook.games, availableGames, onUpdate, onSave]);

  const handleDelete = useCallback(
    (gameId: string) => {
      if (!confirm('이 게임을 삭제하시겠습니까?')) return;
      onUpdate((draft) => {
        draft.games = (draft.games ?? []).filter((g) => g.id !== gameId);
      });
      onSave();
    },
    [onUpdate, onSave]
  );

  // 점잇기 편집 저장
  const handleDotSave = useCallback(
    (updatedData: ConnectTheDotsData) => {
      if (!editDotGame) return;
      onUpdate((draft) => {
        const target = (draft.games ?? []).find((g) => g.id === editDotGame.id);
        if (target) target.data = updatedData;
      });
      onSave();
      setEditDotGame(null);
    },
    [editDotGame, onUpdate, onSave]
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          학습게임 ({games.length}개)
          {isControlled && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
              {externalLang === 'ko'
                ? '🇰🇷 한국어 게임만'
                : externalLang === 'en'
                  ? '🇺🇸 영어 게임만'
                  : `🌐 ${externalLang} (언어 중립 게임만)`}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleGenerateAll}
            loading={!!batchProgress}
          >
            {batchProgress
              ? `생성 중 (${batchProgress.current}/${batchProgress.total})`
              : '모든 게임 만들기'}
          </Button>
          <Button size="sm" onClick={() => setShowCreator(true)}>
            + 게임 추가
          </Button>
        </div>
      </div>

      {/* 게임 목록 */}
      {games.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎮</div>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
            아직 만든 학습게임이 없어요.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setShowCreator(true)}>
            첫 게임 만들기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPreview={() => setPreviewGame(game)}
              onEdit={game.gameType === 'connect-the-dots' ? () => setEditDotGame(game) : undefined}
              onDelete={() => handleDelete(game.id)}
            />
          ))}
        </div>
      )}

      {/* 에러 */}
      {generateMutation.isError && (
        <p className="text-sm text-red-500">{generateMutation.error.message}</p>
      )}

      {/* 생성 모달 */}
      {showCreator && (
        <GameCreatorModal
          storybook={storybook}
          onGenerate={handleGenerate}
          onClose={() => setShowCreator(false)}
          isGenerating={generateMutation.isPending}
        />
      )}

      {/* 미리보기 모달 */}
      {previewGame && (
        <GamePreviewModal
          game={previewGame}
          storybook={storybook}
          onClose={() => setPreviewGame(null)}
        />
      )}

      {/* 점잇기 편집 모달 */}
      {editDotGame && (
        <DotEditorModal
          game={editDotGame}
          onSave={handleDotSave}
          onClose={() => setEditDotGame(null)}
        />
      )}
    </div>
  );
}
