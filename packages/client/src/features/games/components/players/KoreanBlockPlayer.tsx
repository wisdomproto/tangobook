import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { KoreanBlockData, KoreanBlockSyllable } from '@tangobook/shared';
import { CHOSUNG, JUNGSUNG, composeHangul } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { GameResultScreen } from '../GameResultScreen';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useBlockDrag } from '../../hooks/useBlockDrag';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { cn } from '@/lib/cn';

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
  const bg = isVowel(char) ? '#FF5E3A' : '#FF9A5A';
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
  const [typedChars, setTypedChars] = useState(0);

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

  // 정답 시 타이핑 효과
  useEffect(() => {
    if (!roundCorrect) {
      setTypedChars(0);
      return;
    }
    const target = currentItem.word;
    setTypedChars(0);
    const interval = setInterval(() => {
      setTypedChars((n) => {
        if (n >= target.length) {
          clearInterval(interval);
          return target.length;
        }
        return n + 1;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [roundCorrect, currentItem.word]);

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
        language: 'ko',
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
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  const renderCell = (sylIdx: number, slot: number) => {
    const cellKey = `${sylIdx}-${slot}`;
    const char = grid[sylIdx][slot];
    const isWrong = wrongCols.has(sylIdx);
    const placedCorrectly = roundCorrect && !!char;

    const cellInner = char ? (
      <span
        className={cn(
          'text-2xl sm:text-3xl lg:text-4xl font-bold',
          isWrong
            ? 'text-danger'
            : roundCorrect
              ? 'text-success'
              : isVowel(char)
                ? 'text-coral-500'
                : 'text-peach-500'
        )}
      >
        {char}
      </span>
    ) : null;

    const inner = placedCorrectly ? (
      <motion.div
        key={`correct-${char}-${cellKey}`}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.4 }}
        className="w-full h-full flex items-center justify-center"
      >
        {cellInner}
      </motion.div>
    ) : (
      cellInner
    );

    return (
      <div
        key={cellKey}
        ref={drag.cellRef(cellKey)}
        onDragOver={drag.handleDragOver}
        onDrop={(e) => drag.handleDrop(cellKey, e, onPlace)}
        onClick={() => handleCellClick(sylIdx, slot)}
        className={cn(
          CELL,
          'rounded-md border-2 border-dashed flex items-center justify-center transition-all cursor-pointer select-none',
          char
            ? isWrong
              ? 'border-danger bg-coral-100'
              : roundCorrect
                ? 'border-success bg-success/10'
                : 'border-peach-300 bg-white'
            : 'border-coral-300 bg-white/40 hover:border-coral-500 hover:bg-coral-100/30 hover:animate-pulse'
        )}
      >
        {inner}
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
      className={cn(
        BLOCK,
        'rounded-md flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-bold select-none shadow-soft cursor-grab bg-white',
        'transition-transform hover:scale-105 hover:shadow-pop',
        'active:scale-[1.08] active:shadow-pop active:rotate-2 active:cursor-grabbing',
        isVowel(block.char) ? 'text-coral-500' : 'text-peach-500'
      )}
    >
      {block.char}
    </div>
  );

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-cream-50 to-peach-100">
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex-1 flex flex-col items-center gap-4 sm:gap-5 w-full max-h-[calc(100vh-4rem)] overflow-y-auto px-2 py-4">
        <GameProgressBar current={currentIndex} total={items.length} score={score} />

        {/* 완성된 단어 타이핑 패널 */}
        {roundCorrect && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 min-h-[60px] text-3xl sm:text-4xl font-black text-ink-900 text-center shadow-soft min-w-[200px]">
            {currentItem.word.slice(0, typedChars)}
            {typedChars < currentItem.word.length && (
              <span className="inline-block w-0.5 h-8 bg-coral-500 ml-1 animate-pulse align-middle" />
            )}
          </div>
        )}

        <div className="flex items-center gap-4 sm:gap-6">
          {currentItem.imageUrl && (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.word}
              className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 object-contain rounded-lg border-2 border-peach-200 bg-white shadow-card"
            />
          )}
          <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink-900">
            {currentItem.word}
          </p>
        </div>

        <div className="flex flex-row gap-4 sm:gap-6 lg:gap-8 justify-center items-start w-full">
          <div className="flex flex-wrap gap-4 justify-center shrink-0">
            {Array.from({ length: syllableCount }, (_, sylIdx) => (
              <div key={sylIdx} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'grid grid-cols-2 gap-1 p-2 rounded-lg border-2',
                    wrongCols.has(sylIdx)
                      ? 'border-danger bg-coral-100/50'
                      : roundCorrect
                        ? 'border-success bg-success/10'
                        : 'border-peach-200 bg-white/70'
                  )}
                >
                  {Array.from({ length: 6 }, (_, slot) => renderCell(sylIdx, slot))}
                </div>
                <span
                  className={cn(
                    'text-3xl sm:text-4xl lg:text-5xl font-black',
                    composedPreview[sylIdx]
                      ? wrongCols.has(sylIdx)
                        ? 'text-danger'
                        : roundCorrect
                          ? 'text-success'
                          : 'text-ink-900'
                      : 'text-ink-900'
                  )}
                >
                  {composedPreview[sylIdx] || '?'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-row gap-2 sm:gap-3 overflow-x-auto min-w-0">
            <div className="rounded-lg border-2 border-peach-200 bg-white/60 p-2 sm:p-3 shrink-0">
              <p className="text-lg font-bold text-peach-500 text-center mb-2">자음</p>
              <div className="grid grid-cols-4 gap-1.5 justify-items-center">
                {ALL_CONSONANTS.map(renderBlock)}
              </div>
            </div>
            <div className="rounded-lg border-2 border-coral-200 bg-white/60 p-2 sm:p-3 shrink-0">
              <p className="text-lg font-bold text-coral-500 text-center mb-2">모음</p>
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
            className={cn(
              'px-8 py-3 sm:px-10 sm:py-3 rounded-md text-lg sm:text-xl font-bold transition-colors',
              roundCorrect
                ? 'bg-ink-100 text-ink-900 cursor-not-allowed'
                : 'bg-coral-500 hover:bg-coral-600 text-white shadow-pop'
            )}
          >
            확인
          </button>
        </div>
      </div>

      <button
        onClick={onBack}
        className="shrink-0 py-3 text-lg text-ink-900 hover:text-ink-900 transition-colors text-center bg-white/50"
      >
        ← 돌아가기
      </button>
    </div>
  );
}
