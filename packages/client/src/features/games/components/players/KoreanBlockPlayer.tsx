import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { KoreanBlockData, KoreanBlockSyllable } from '@tangobook/shared';
import { CHOSUNG, JUNGSUNG, composeHangul } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { GameResultScreen } from '../GameResultScreen';
import { useGameAudio } from '../../hooks/useGameAudio';
import { settingsApi } from '@/features/settings/api/settings.api';

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

// 전체 자음/모음 팔레트 (키보드처럼 항상 표시)
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

/** 2×3 격자(6슬롯)에서 자모를 수집 → 한글 음절 조합 시도 */
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

// 셀/블록 크기
const CELL = 'w-20 h-20';
const BLOCK = 'w-16 h-16';

export function KoreanBlockPlayer({ gameData, onComplete: _onComplete, onBack }: GamePlayerProps) {
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

  // 각 음절 = 6슬롯 (2열×3행)
  const SLOTS_PER_SYLLABLE = 6;
  const initGrid = useCallback(
    (syls: KoreanBlockSyllable[]) =>
      Array.from({ length: syls.length }, () =>
        Array.from({ length: SLOTS_PER_SYLLABLE }, () => null as string | null)
      ),
    []
  );

  const [grid, setGrid] = useState<(string | null)[][]>(() => initGrid(syllables));

  const { playAudio, playFeedbackSound } = useGameAudio();
  const dragBlockRef = useRef<JamoBlock | null>(null);
  const touchGhostRef = useRef<HTMLDivElement | null>(null);
  const gridCellRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const composedPreview = useMemo(() => grid.map((slots) => tryCompose(slots)), [grid]);

  // 파닉스 음원 맵 (mod_korean: 음절→URL)
  const phonicsMapRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    settingsApi
      .getPhonicsLibrary()
      .then((lib) => {
        const map = new Map<string, string>();
        for (const item of lib.mod_korean) map.set(item.sound, item.url);
        for (const item of lib.mod_phonics) {
          if (!map.has(item.sound)) map.set(item.sound, item.url);
        }
        phonicsMapRef.current = map;
      })
      .catch(() => {});
  }, []);

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
  }, [composedPreview, playAudio]);

  // --- 드래그 ---
  const handleDragStart = useCallback((block: JamoBlock, e: React.DragEvent) => {
    dragBlockRef.current = block;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

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

  const handleDrop = useCallback(
    (col: number, slot: number, e: React.DragEvent) => {
      e.preventDefault();
      if (!dragBlockRef.current) return;
      placeBlock(col, slot, dragBlockRef.current);
      dragBlockRef.current = null;
    },
    [placeBlock]
  );

  const handleTouchStart = useCallback((block: JamoBlock, e: React.TouchEvent) => {
    dragBlockRef.current = block;
    const ghost = document.createElement('div');
    ghost.textContent = block.char;
    const bg = isVowel(block.char) ? '#059669' : '#d97706';
    ghost.setAttribute(
      'style',
      `position:fixed;pointer-events:none;z-index:9999;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:${bg};color:white;font-size:16px;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,.3);left:${e.touches[0].clientX - 20}px;top:${e.touches[0].clientY - 20}px`
    );
    document.body.appendChild(ghost);
    touchGhostRef.current = ghost;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchGhostRef.current) return;
    touchGhostRef.current.style.left = `${e.touches[0].clientX - 20}px`;
    touchGhostRef.current.style.top = `${e.touches[0].clientY - 20}px`;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchGhostRef.current?.remove();
      touchGhostRef.current = null;
      const block = dragBlockRef.current;
      if (!block) return;
      const { clientX: x, clientY: y } = e.changedTouches[0];
      for (const [key, el] of gridCellRefs.current) {
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          const [c, s] = key.split('-');
          placeBlock(parseInt(c), parseInt(s), block);
          break;
        }
      }
      dragBlockRef.current = null;
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
      playFeedbackSound(true);
      if (currentItem.ttsUrl) setTimeout(() => playAudio(currentItem.ttsUrl), 400);
      setRoundCorrect(true);
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
    playFeedbackSound,
    playAudio,
    roundCorrect,
  ]);

  const handleNext = useCallback(() => {
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
  }, [currentIndex, items, initGrid]);

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

  // 2×3 격자 셀 렌더링 (row, col 기반 → slot = row*2 + cellCol)
  const renderCell = (sylIdx: number, slot: number) => {
    const cellKey = `${sylIdx}-${slot}`;
    const char = grid[sylIdx][slot];
    const isWrong = wrongCols.has(sylIdx);
    return (
      <div
        key={cellKey}
        ref={(el) => {
          if (el) gridCellRefs.current.set(cellKey, el);
          else gridCellRefs.current.delete(cellKey);
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(sylIdx, slot, e)}
        onClick={() => handleCellClick(sylIdx, slot)}
        className={`${CELL} rounded-xl border-2 border-dashed flex items-center justify-center text-4xl font-bold transition-all cursor-pointer select-none ${
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

  // 블록 렌더링 헬퍼
  const renderBlock = (block: JamoBlock) => (
    <div
      key={block.id}
      draggable
      onDragStart={(e) => handleDragStart(block, e)}
      onTouchStart={(e) => handleTouchStart(block, e)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`${BLOCK} rounded-xl flex items-center justify-center text-2xl font-bold cursor-grab active:cursor-grabbing select-none shadow-sm ${
        isVowel(block.char)
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
      }`}
    >
      {block.char}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-full space-y-10 py-8">
      <GameProgressBar
        current={currentIndex}
        total={items.length}
        score={score}
        accentColor="emerald"
      />

      {/* 이미지 + 단어 */}
      <div className="flex flex-col items-center gap-5">
        {currentItem.imageUrl && (
          <img
            src={currentItem.imageUrl}
            alt={currentItem.word}
            className="w-80 h-80 object-contain rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        )}
        <p className="text-7xl font-black text-slate-800 dark:text-slate-100">{currentItem.word}</p>
      </div>

      {/* 격자 + 블록 영역 */}
      <div className="flex gap-12 justify-center items-start">
        {/* 음절 격자들 */}
        <div className="flex flex-wrap gap-6 justify-center">
          {Array.from({ length: syllableCount }, (_, sylIdx) => (
            <div key={sylIdx} className="flex flex-col items-center gap-3">
              {/* 2×3 격자 */}
              <div
                className={`grid grid-cols-2 gap-1.5 p-3 rounded-2xl border-2 ${
                  wrongCols.has(sylIdx)
                    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                    : roundCorrect
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50'
                }`}
              >
                {Array.from({ length: 6 }, (_, slot) => renderCell(sylIdx, slot))}
              </div>
              {/* 조합 미리보기 */}
              <span
                className={`text-6xl font-black ${
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

        {/* 자모 팔레트 — 자음·모음 가로 배치 */}
        <div className="flex gap-4 flex-shrink-0">
          {/* 자음 (19개) */}
          <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
            <p className="text-base font-bold text-amber-500 dark:text-amber-400 text-center mb-3">
              자음
            </p>
            <div className="grid grid-cols-4 gap-2 justify-items-center">
              {ALL_CONSONANTS.map(renderBlock)}
            </div>
          </div>
          {/* 모음 (21개) */}
          <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
            <p className="text-base font-bold text-emerald-500 dark:text-emerald-400 text-center mb-3">
              모음
            </p>
            <div className="grid grid-cols-4 gap-2 justify-items-center">
              {ALL_VOWELS.map(renderBlock)}
            </div>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-center gap-5">
        <button
          onClick={handleCheck}
          disabled={roundCorrect}
          className={`px-14 py-5 rounded-2xl text-2xl font-bold transition-colors ${
            roundCorrect
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          확인
        </button>
        <button
          onClick={handleNext}
          className="px-14 py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-2xl font-bold transition-colors"
        >
          {currentIndex + 1 < items.length ? '다음 →' : '결과 보기'}
        </button>
      </div>
    </div>
  );
}
