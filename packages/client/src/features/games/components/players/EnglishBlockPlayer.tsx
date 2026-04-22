import { useState, useCallback, useRef, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { EnglishBlockData, EnglishBlockLetter } from '@tangobook/shared';
import { VOWELS, CONSONANTS, isEnglishVowel } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { GameResultScreen } from '../GameResultScreen';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useBlockDrag } from '../../hooks/useBlockDrag';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { PraiseOverlay } from '../PraiseOverlay';

interface LetterBlock {
  id: string;
  char: string;
  isVowel: boolean;
}

const ALL_CONSONANTS: LetterBlock[] = CONSONANTS.map((ch, i) => ({
  id: `con-${i}`,
  char: ch,
  isVowel: false,
}));
const ALL_VOWELS: LetterBlock[] = VOWELS.map((ch, i) => ({
  id: `vow-${i}`,
  char: ch,
  isVowel: true,
}));

const WORD_COLORS = ['#f97316', '#eab308', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];

function createEnglishGhost(char: string): HTMLDivElement {
  const ghost = document.createElement('div');
  const barColor = isEnglishVowel(char) ? '#fb7185' : '#60a5fa';
  ghost.innerHTML = `<span style="flex:1;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#1e293b">${char}</span><div style="width:100%;height:6px;background:${barColor};border-radius:0 0 14px 14px"></div>`;
  ghost.setAttribute(
    'style',
    `width:52px;height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px;background:white;box-shadow:0 8px 24px rgba(0,0,0,.2);overflow:hidden`
  );
  return ghost;
}

export function EnglishBlockPlayer({
  gameData,
  onComplete: _onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const data = gameData as EnglishBlockData;
  const items = data.items;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasTriedThisRound, setHasTriedThisRound] = useState(false);
  const [finished, setFinished] = useState(false);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const [wrongSlots, setWrongSlots] = useState<Set<number>>(new Set());

  const currentItem = items[currentIndex];
  const letterCount = currentItem.letters.length;

  const initGrid = useCallback(
    (letters: EnglishBlockLetter[]) =>
      Array.from({ length: letters.length }, () => null as string | null),
    []
  );

  const [grid, setGrid] = useState<(string | null)[]>(() => initGrid(currentItem.letters));

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  const phonicsMapRef = usePhonicsMap(['mod_phonics', 'mod_english']);
  const drag = useBlockDrag<LetterBlock>({
    createGhost: createEnglishGhost,
    ghostOffset: [26, 32],
  });

  // 글자 배치 시 음원 자동 재생
  const prevGridRef = useRef<(string | null)[]>([]);
  useEffect(() => {
    const prev = prevGridRef.current;
    for (let i = 0; i < grid.length; i++) {
      const cur = grid[i];
      if (cur && cur !== prev[i]) {
        const url = phonicsMapRef.current.get(cur);
        if (url) playAudio(url);
      }
    }
    prevGridRef.current = [...grid];
  }, [grid, playAudio, phonicsMapRef]);

  const placeBlock = useCallback(
    (slot: number, block: LetterBlock) => {
      if (grid[slot] !== null) return;
      setGrid((prev) => {
        const next = [...prev];
        next[slot] = block.char;
        return next;
      });
      setWrongSlots(new Set());
    },
    [grid]
  );

  const onPlace = useCallback(
    (key: string, block: LetterBlock) => {
      placeBlock(parseInt(key), block);
    },
    [placeBlock]
  );

  const handleCellClick = useCallback(
    (slot: number) => {
      if (roundCorrect) return;
      const char = grid[slot];
      if (!char) return;
      setGrid((prev) => {
        const next = [...prev];
        next[slot] = null;
        return next;
      });
      setWrongSlots(new Set());
    },
    [grid, roundCorrect]
  );

  const handleCheck = useCallback(() => {
    if (roundCorrect) return;
    const target = currentItem.word.toLowerCase();
    const newWrongSlots = new Set<number>();
    let allCorrect = true;
    for (let i = 0; i < letterCount; i++) {
      if (!grid[i] || grid[i] !== target[i]) {
        allCorrect = false;
        newWrongSlots.add(i);
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
            setGrid(initGrid(items[nextIdx].letters));
            setHasTriedThisRound(false);
            setRoundCorrect(false);
            setWrongSlots(new Set());
          } else {
            setFinished(true);
          }
        },
      });
    } else {
      playFeedbackSound(false);
      setHasTriedThisRound(true);
      setWrongSlots(newWrongSlots);
    }
  }, [
    grid,
    letterCount,
    currentItem.word,
    currentItem.ttsUrl,
    hasTriedThisRound,
    currentIndex,
    items,
    initGrid,
    playFeedbackSound,
    playCorrectSequence,
    systemSounds,
    roundCorrect,
  ]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < items.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setGrid(initGrid(items[nextIdx].letters));
      setHasTriedThisRound(false);
      setRoundCorrect(false);
      setWrongSlots(new Set());
    } else {
      setFinished(true);
    }
  }, [currentIndex, items, initGrid]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    setHasTriedThisRound(false);
    setRoundCorrect(false);
    setWrongSlots(new Set());
    setGrid(initGrid(items[0].letters));
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

  const renderCell = (slot: number) => {
    const cellKey = `${slot}`;
    const char = grid[slot];
    const isWrong = wrongSlots.has(slot);
    const barColor = char
      ? isWrong
        ? 'bg-red-400'
        : roundCorrect
          ? 'bg-emerald-400'
          : isEnglishVowel(char)
            ? 'bg-rose-400'
            : 'bg-blue-400'
      : '';
    return (
      <div
        key={cellKey}
        ref={drag.cellRef(cellKey)}
        onDragOver={drag.handleDragOver}
        onDrop={(e) => drag.handleDrop(cellKey, e, onPlace)}
        onClick={() => handleCellClick(slot)}
        className={`w-12 h-14 sm:w-16 sm:h-[4.5rem] lg:w-[4.5rem] lg:h-[5.5rem] rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all cursor-pointer select-none ${
          char
            ? isWrong
              ? 'bg-white shadow-lg ring-2 ring-red-300'
              : roundCorrect
                ? 'bg-white shadow-lg ring-2 ring-emerald-300'
                : 'bg-white shadow-lg'
            : 'border-2 border-dashed border-amber-300/60 bg-amber-50/50'
        }`}
      >
        {char ? (
          <>
            <span
              className={`flex-1 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-black ${
                isWrong ? 'text-red-500' : 'text-slate-800'
              }`}
            >
              {char}
            </span>
            <div className={`w-full h-1.5 lg:h-2 ${barColor}`} />
          </>
        ) : null}
      </div>
    );
  };

  const renderBlock = (block: LetterBlock) => (
    <div
      key={block.id}
      draggable
      onDragStart={(e) => drag.handleDragStart(block, e)}
      onTouchStart={(e) => drag.handleTouchStart(block, e)}
      onTouchMove={drag.handleTouchMove}
      onTouchEnd={(e) => drag.handleTouchEnd(e, onPlace)}
      className="w-10 h-12 sm:w-12 sm:h-14 lg:w-14 lg:h-[4rem] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <span className="flex-1 flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-black text-slate-800">
        {block.char}
      </span>
      <div className={`w-full h-1.5 lg:h-2 ${block.isVowel ? 'bg-rose-400' : 'bg-blue-400'}`} />
    </div>
  );

  return (
    <div className="min-h-full flex flex-col">
      <PraiseOverlay visible={praiseVisible} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 gap-4 sm:gap-6">
        <div className="w-full max-w-md">
          <GameProgressBar current={currentIndex} total={items.length} score={score} />
        </div>

        {currentItem.imageUrl && (
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-amber-200/30 blur-2xl scale-110" />
            <img
              src={currentItem.imageUrl}
              alt={currentItem.word}
              className="relative w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 object-contain rounded-3xl bg-white shadow-xl"
            />
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-wide">
            {currentItem.word.split('').map((ch, i) => (
              <span key={i} style={{ color: WORD_COLORS[i % WORD_COLORS.length] }}>
                {ch}
              </span>
            ))}
          </span>
          <div className="flex gap-1.5 sm:gap-2">
            {Array.from({ length: letterCount }, (_, slot) => renderCell(slot))}
          </div>
        </div>

        <div className="flex justify-center gap-3 sm:gap-4">
          <button
            onClick={handleCheck}
            disabled={roundCorrect}
            className={`px-6 py-2.5 sm:px-10 sm:py-3.5 rounded-2xl text-base sm:text-lg font-bold transition-colors ${
              roundCorrect
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
            }`}
          >
            확인
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 sm:px-10 sm:py-3.5 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl text-base sm:text-lg font-bold transition-colors shadow-md"
          >
            {currentIndex + 1 < items.length ? '다음 →' : '결과 보기'}
          </button>
        </div>
      </div>

      <div
        className="shrink-0 px-3 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row gap-4 sm:gap-6"
        style={{
          background:
            'linear-gradient(180deg, rgba(251,191,146,0.15) 0%, rgba(251,191,146,0.3) 100%)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-black text-slate-700 mb-2 sm:mb-3 ml-1">
            Consonants
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">{ALL_CONSONANTS.map(renderBlock)}</div>
        </div>
        <div className="shrink-0">
          <p className="text-sm sm:text-base font-black text-slate-700 mb-2 sm:mb-3 ml-1">Vowels</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">{ALL_VOWELS.map(renderBlock)}</div>
        </div>
      </div>

      <button
        onClick={onBack}
        className="shrink-0 py-3 text-sm text-emerald-700/60 hover:text-emerald-800 transition-colors text-center"
        style={{ background: 'rgba(251,191,146,0.3)' }}
      >
        ← 돌아가기
      </button>
    </div>
  );
}
