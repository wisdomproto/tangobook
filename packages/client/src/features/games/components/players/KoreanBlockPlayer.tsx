import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { KoreanBlockData, KoreanBlockSyllable } from '@tangobook/shared';
import { CHOSUNG, JUNGSUNG, composeHangul } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { GameResultScreen } from '../GameResultScreen';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useBlockDrag } from '../../hooks/useBlockDrag';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { PraiseOverlay } from '../PraiseOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

type JamoType = 'cho' | 'jung' | 'jong';

interface JamoBlock {
  id: string;
  char: string;
  jamoType: JamoType;
}

const JUNGSUNG_SET = new Set<string>(JUNGSUNG);
function isVowel(char: string) {
  return JUNGSUNG_SET.has(char);
}

const ALL_CONSONANTS: JamoBlock[] = CHOSUNG.map((ch, i) => ({
  id: `cho-${i}`,
  char: ch,
  jamoType: 'cho' as JamoType,
}));
const ALL_VOWELS: JamoBlock[] = JUNGSUNG.map((ch, i) => ({
  id: `jung-${i}`,
  char: ch,
  jamoType: 'jung' as JamoType,
}));

function tryCompose(slots: (string | null)[]): string | null {
  const filled = slots.filter((s): s is string => s !== null);
  if (filled.length < 2) return null;
  const consonants: string[] = [];
  const vowels: string[] = [];
  for (const ch of filled) {
    if (isVowel(ch)) vowels.push(ch);
    else consonants.push(ch);
  }
  if (consonants.length < 1 || vowels.length < 1) return null;
  return composeHangul(consonants[0], vowels[0], consonants.length >= 2 ? consonants[1] : null);
}

const CELL = 'w-11 h-11 sm:w-13 sm:h-13 lg:w-14 lg:h-14';
const BLOCK = 'w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12';

function createKoreanGhost(char: string): HTMLDivElement {
  const ghost = document.createElement('div');
  ghost.textContent = char;
  const bg = isVowel(char) ? '#059669' : '#d97706';
  ghost.setAttribute(
    'style',
    `width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:${bg};color:white;font-size:16px;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,.3)`
  );
  return ghost;
}

export function KoreanBlockPlayer({
  gameData,
  onComplete: _onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const data = gameData as KoreanBlockData;
  const items = data.items;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasTriedThisRound, setHasTriedThisRound] = useState(false);
  const [finished, setFinished] = useState(false);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const [wrongCols, setWrongCols] = useState<Set<number>>(new Set());

  const currentItem = items[currentIndex];
  const syllables = currentItem.syllables;
  const syllableCount = syllables.length;

  const SLOTS_PER_SYLLABLE = 6;
  const initGrid = useCallback(
    (syls: KoreanBlockSyllable[]) =>
      Array.from({ length: syls.length }, () =>
        Array.from({ length: SLOTS_PER_SYLLABLE }, () => null as string | null)
      ),
    []
  );

  const [grid, setGrid] = useState<(string | null)[][]>(() => initGrid(syllables));

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  const phonicsMapRef = usePhonicsMap(['mod_korean', 'mod_phonics']);
  const drag = useBlockDrag<JamoBlock>({
    createGhost: createKoreanGhost,
    ghostOffset: [20, 20],
  });

  const composedPreview = useMemo(() => grid.map((slots) => tryCompose(slots)), [grid]);

  // 음절 조합 시 해당 음원 자동 재생
  const prevComposedRef = useRef<(string | null)[]>([]);
  useEffect(() => {
    const prev = prevComposedRef.current;
    for (let i = 0; i < composedPreview.length; i++) {
      const cur = composedPreview[i];
      if (cur && cur !== prev[i]) {
        const url = phonicsMapRef.current.get(cur);
        if (url) playAudio(url);
      }
    }
    prevComposedRef.current = [...composedPreview];
  }, [composedPreview, playAudio, phonicsMapRef]);

  const placeBlock = useCallback(
    (col: number, slot: number, block: JamoBlock) => {
      if (grid[col][slot] !== null) return;
      setGrid((prev) => {
        const next = prev.map((c) => [...c]);
        next[col][slot] = block.char;
        return next;
      });
      setWrongCols(new Set());
    },
    [grid]
  );

  const onPlace = useCallback(
    (key: string, block: JamoBlock) => {
      const [c, s] = key.split('-');
      placeBlock(parseInt(c), parseInt(s), block);
    },
    [placeBlock]
  );

  const handleCellClick = useCallback(
    (col: number, slot: number) => {
      if (roundCorrect) return;
      const char = grid[col][slot];
      if (!char) return;
      setGrid((prev) => {
        const next = prev.map((c) => [...c]);
        next[col][slot] = null;
        return next;
      });
      setWrongCols(new Set());
    },
    [grid, roundCorrect]
  );

  const handleCheck = useCallback(() => {
    if (roundCorrect) return;
    const newWrongCols = new Set<number>();
    let allCorrect = true;
    for (let col = 0; col < syllableCount; col++) {
      const composed = tryCompose(grid[col]);
      if (!composed || composed !== syllables[col].char) {
        allCorrect = false;
        newWrongCols.add(col);
      }
    }
    if (allCorrect) {
      if (!hasTriedThisRound) setScore((s) => s + 1);
      setRoundCorrect(true);
      playCorrectSequence({
        ttsUrl: currentItem.ttsUrl,
        systemSounds,
        onDone: () => {
          if (currentIndex + 1 < items.length) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setGrid(initGrid(items[nextIdx].syllables));
            setHasTriedThisRound(false);
            setRoundCorrect(false);
            setWrongCols(new Set());
          } else {
            setFinished(true);
          }
        },
      });
    } else {
      playFeedbackSound(false);
      setHasTriedThisRound(true);
      setWrongCols(newWrongCols);
    }
  }, [
    grid,
    syllableCount,
    syllables,
    hasTriedThisRound,
    currentItem.ttsUrl,
    currentIndex,
    items,
    initGrid,
    playFeedbackSound,
    playCorrectSequence,
    systemSounds,
    roundCorrect,
  ]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    setHasTriedThisRound(false);
    setRoundCorrect(false);
    setWrongCols(new Set());
    setGrid(initGrid(items[0].syllables));
  }, [items, initGrid]);

  if (finished) {
    return (
      <GameResultScreen
        score={score}
        total={items.length}
        accentColor="emerald"
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  const renderCell = (sylIdx: number, slot: number) => {
    const cellKey = `${sylIdx}-${slot}`;
    const char = grid[sylIdx][slot];
    const isWrong = wrongCols.has(sylIdx);
    return (
      <div
        key={cellKey}
        ref={drag.cellRef(cellKey)}
        onDragOver={drag.handleDragOver}
        onDrop={(e) => drag.handleDrop(cellKey, e, onPlace)}
        onClick={() => handleCellClick(sylIdx, slot)}
        className={`${CELL} rounded-xl border-2 border-dashed flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-bold transition-all cursor-pointer select-none ${
          char
            ? isWrong
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : roundCorrect
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : `border-slate-400 bg-white dark:bg-slate-800 ${isVowel(char) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`
            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-300'
        }`}
      >
        {char || ''}
      </div>
    );
  };

  const renderBlock = (block: JamoBlock) => (
    <div
      key={block.id}
      draggable
      onDragStart={(e) => drag.handleDragStart(block, e)}
      onTouchStart={(e) => drag.handleTouchStart(block, e)}
      onTouchMove={drag.handleTouchMove}
      onTouchEnd={(e) => drag.handleTouchEnd(e, onPlace)}
      className={`${BLOCK} rounded-xl flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-bold cursor-grab active:cursor-grabbing select-none shadow-sm ${
        isVowel(block.char)
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
      }`}
    >
      {block.char}
    </div>
  );

  return (
    <GamePlayerLayout maxWidth="full" onBack={onBack}>
      <PraiseOverlay visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-5 w-full max-h-[calc(100vh-4rem)] overflow-y-auto px-2">
        <GameProgressBar
          current={currentIndex}
          total={items.length}
          score={score}
          accentColor="emerald"
        />

        <div className="flex items-center gap-4 sm:gap-6">
          {currentItem.imageUrl && (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.word}
              className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 object-contain rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          )}
          <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100">
            {currentItem.word}
          </p>
        </div>

        <div className="flex flex-row gap-4 sm:gap-6 lg:gap-8 justify-center items-start w-full">
          <div className="flex flex-wrap gap-4 justify-center shrink-0">
            {Array.from({ length: syllableCount }, (_, sylIdx) => (
              <div key={sylIdx} className="flex flex-col items-center gap-2">
                <div
                  className={`grid grid-cols-2 gap-1 p-2 rounded-2xl border-2 ${
                    wrongCols.has(sylIdx)
                      ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                      : roundCorrect
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50'
                  }`}
                >
                  {Array.from({ length: 6 }, (_, slot) => renderCell(sylIdx, slot))}
                </div>
                <span
                  className={`text-3xl sm:text-4xl lg:text-5xl font-black ${
                    composedPreview[sylIdx]
                      ? wrongCols.has(sylIdx)
                        ? 'text-red-500'
                        : roundCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-200'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  {composedPreview[sylIdx] || '?'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-row gap-2 sm:gap-3 overflow-x-auto min-w-0">
            <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-2 sm:p-3 shrink-0">
              <p className="text-sm font-bold text-amber-500 dark:text-amber-400 text-center mb-2">
                자음
              </p>
              <div className="grid grid-cols-4 gap-1.5 justify-items-center">
                {ALL_CONSONANTS.map(renderBlock)}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-2 sm:p-3 shrink-0">
              <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 text-center mb-2">
                모음
              </p>
              <div className="grid grid-cols-4 gap-1.5 justify-items-center">
                {ALL_VOWELS.map(renderBlock)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pb-2">
          <button
            onClick={handleCheck}
            disabled={roundCorrect}
            className={`px-8 py-3 sm:px-10 sm:py-3 rounded-2xl text-lg sm:text-xl font-bold transition-colors ${
              roundCorrect
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            확인
          </button>
        </div>
      </div>
    </GamePlayerLayout>
  );
}
