import { useState, useCallback, useMemo, useRef, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { KoreanBlockData } from '@tangobook/shared';
import { CHOSUNG, JUNGSUNG, composeHangul, decomposeWord } from '@tangobook/shared';
import { useGameLogger, type GameWordResult } from '@/features/learning';
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

/**
 * 공간 위치 인식 파서 — 한글 음절의 시각적 배치 그대로 합성.
 *
 * 규칙 (사용자 명시):
 *  1. 한 음절에서 cho(자음) 왼쪽, jung(모음) 오른쪽. 즉 음절 시작은 항상 (r, c)=자음 + (r, c+1)=모음.
 *  2. 자음·자음, 모음·모음 연속 X — 인접 동종은 별도 음절.
 *  3. 받침(jong)은 cho 아래 (r+1, c) 또는 jung 아래 (r+1, c+1) 둘 다 OK.
 *  4. 같은 행에서 cho+jung 다음에 자음이 와서 (끝 / 다음이 자음) 이면 인라인 받침으로 흡수 (한 줄 입력 호환).
 *
 * 알고리즘: 위→아래, 좌→우 스캔. 매 (r,c) 에서 자음+(r,c+1)모음 짝을 발견하면 받침 후보 (a) 아래 자음
 * (b) 인라인 자음 순으로 채택해 합성. 합성에 쓰인 셀은 다시 cho 로 처리되지 않게 mark.
 */
function parseSpatialKorean(grid: (string | null)[][]): string[] {
  const out: string[] = [];
  const used = new Set<string>(); // 'r-c' — jong 으로 흡수된 셀
  for (let r = 0; r < grid.length; r++) {
    let c = 0;
    while (c < grid[r].length - 1) {
      const choKey = `${r}-${c}`;
      if (used.has(choKey)) {
        c++;
        continue;
      }
      const cho = grid[r][c];
      const jung = grid[r][c + 1];
      if (!cho || isVowel(cho) || !jung || !isVowel(jung)) {
        c++;
        continue;
      }
      // jong 후보: (a) cho 아래 (r+1,c) (b) jung 아래 (r+1,c+1) (c) 인라인 (r,c+2)
      let jong: string | null = null;
      let inlineConsumed = false;
      const belowCho = r + 1 < grid.length ? grid[r + 1][c] : null;
      const belowJung = r + 1 < grid.length ? grid[r + 1][c + 1] : null;
      if (belowCho && !isVowel(belowCho) && !used.has(`${r + 1}-${c}`)) {
        jong = belowCho;
        used.add(`${r + 1}-${c}`);
      } else if (belowJung && !isVowel(belowJung) && !used.has(`${r + 1}-${c + 1}`)) {
        jong = belowJung;
        used.add(`${r + 1}-${c + 1}`);
      } else {
        const inline = grid[r][c + 2];
        if (inline && !isVowel(inline)) {
          const afterInline = c + 3 < grid[r].length ? grid[r][c + 3] : null;
          if (!afterInline || !isVowel(afterInline)) {
            jong = inline;
            inlineConsumed = true;
          }
        }
      }
      const composed = composeHangul(cho, jung, jong);
      if (composed) out.push(composed);
      c += inlineConsumed ? 3 : 2;
    }
  }
  return out;
}

// 3행 × 6열 고정 그리드 — 각 행이 1음절. 단어 음절 수 ≤ 3 가정.
const ROWS = 3;
const COLS = 6;

// 배경 일러스트 — public/images/games/korean-block-bg.png (없으면 gradient fallback).
const BG_IMAGE_URL = '/images/games/korean-block-bg.png';

function createKoreanGhost(char: string): HTMLDivElement {
  const ghost = document.createElement('div');
  ghost.textContent = char;
  const bg = isVowel(char) ? '#FF5E3A' : '#FF9A5A';
  ghost.setAttribute(
    'style',
    `width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:${bg};color:white;font-size:22px;font-weight:900;box-shadow:0 6px 16px rgba(0,0,0,.3)`
  );
  return ghost;
}

export function KoreanBlockPlayer({
  storybookId,
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
  const logGame = useGameLogger();
  const wordResultsRef = useRef<{ word: string; correct: boolean }[]>([]);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [typedChars, setTypedChars] = useState(0);

  const currentItem = items[currentIndex];

  const initGrid = useCallback(
    () =>
      Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null as string | null)),
    []
  );

  const [grid, setGrid] = useState<(string | null)[][]>(() => initGrid());

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  const phonicsMapRef = usePhonicsMap(['mod_korean', 'mod_phonics']);
  const drag = useBlockDrag<JamoBlock>({
    createGhost: createKoreanGhost,
    ghostOffset: [24, 24],
  });

  // 그리드의 공간 위치(cho 왼쪽 / jung 오른쪽 / jong 아래)로 음절 인식 — 입력 순서 무관.
  const composedSyllables = useMemo(() => parseSpatialKorean(grid), [grid]);

  // 새로 추가된 음절만 TTS 재생.
  // phonics 라이브러리는 보통 CV 음절(가/나/다)만 → 받침 CVC(산/침)·다음절은 미스.
  // 폴백: Web Speech API(`speechSynthesis`) 로 ko-KR 합성.
  const prevSyllablesRef = useRef<string[]>([]);
  useEffect(() => {
    const prev = prevSyllablesRef.current;
    for (let i = 0; i < composedSyllables.length; i++) {
      const cur = composedSyllables[i];
      if (cur !== prev[i]) {
        const url = phonicsMapRef.current.get(cur);
        if (url) {
          playAudio(url);
        } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel(); // 빠른 연속 입력 시 큐 누적 방지
            const u = new SpeechSynthesisUtterance(cur);
            u.lang = 'ko-KR';
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
          } catch {
            /* 미지원/차단 */
          }
        }
      }
    }
    prevSyllablesRef.current = [...composedSyllables];
  }, [composedSyllables, playAudio, phonicsMapRef]);

  // 정답 시 단어 타이핑 효과
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
    }, 80);
    return () => clearInterval(interval);
  }, [roundCorrect, currentItem.word]);

  const placeBlock = useCallback(
    (row: number, col: number, block: JamoBlock) => {
      if (grid[row][col] !== null) return;
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = block.char;
        return next;
      });
      setIsWrong(false);
    },
    [grid]
  );

  const onPlace = useCallback(
    (key: string, block: JamoBlock) => {
      const [r, c] = key.split('-');
      placeBlock(parseInt(r), parseInt(c), block);
    },
    [placeBlock]
  );

  const handleResetGrid = useCallback(() => {
    if (roundCorrect) return;
    setGrid(initGrid());
    setIsWrong(false);
  }, [initGrid, roundCorrect]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (roundCorrect) return;
      if (!grid[row][col]) return;
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = null;
        return next;
      });
      setIsWrong(false);
    },
    [grid, roundCorrect]
  );

  const handleCheck = useCallback(() => {
    if (roundCorrect) return;
    const composed = composedSyllables.join('');
    const allCorrect = composed === currentItem.word && composed.length > 0;
    if (allCorrect) {
      const isFirstTry = !hasTriedThisRound;
      if (isFirstTry) setScore((s) => s + 1);
      wordResultsRef.current.push({ word: currentItem.word, correct: isFirstTry });
      setRoundCorrect(true);
      playCorrectSequence({
        ttsUrl: currentItem.ttsUrl,
        systemSounds,
        language: 'ko',
        onDone: () => {
          if (currentIndex + 1 < items.length) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setGrid(initGrid());
            setHasTriedThisRound(false);
            setRoundCorrect(false);
            setIsWrong(false);
          } else {
            setFinished(true);
          }
        },
      });
    } else {
      playFeedbackSound(false);
      setHasTriedThisRound(true);
      setIsWrong(true);
    }
  }, [
    composedSyllables,
    hasTriedThisRound,
    currentItem.ttsUrl,
    currentItem.word,
    currentIndex,
    items,
    initGrid,
    playFeedbackSound,
    playCorrectSequence,
    systemSounds,
    roundCorrect,
  ]);

  // 게임 완료 시 학습 이벤트
  useEffect(() => {
    if (!finished) return;
    const collected = wordResultsRef.current;
    if (collected.length === 0) return;
    const results: GameWordResult[] = [];
    for (const r of collected) {
      results.push({ word: r.word, correct: r.correct });
      for (const syl of decomposeWord(r.word)) {
        results.push({ correct: r.correct, consonant: syl.cho, vowel: syl.jung });
      }
    }
    logGame({ gameType: 'korean-block', storybookId, lang: 'ko', results });
    wordResultsRef.current = [];
  }, [finished, logGame, storybookId]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    wordResultsRef.current = [];
    setHasTriedThisRound(false);
    setRoundCorrect(false);
    setIsWrong(false);
    setGrid(initGrid());
  }, [initGrid]);

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={score}
        total={items.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  return (
    // VocabularyStudyContent 의 motion.div(fixed inset-0) 가 어떤 이유로 viewport top 으로부터 ~32px 떨어진 위치에 렌더되어
    // 위쪽으로 뒷 페이지(헤더·표지)가 새어나옴. player 를 자체적으로 fixed inset-0 + z-[60] 로 바꿔서 viewport 0,0 부터 완전 덮음.
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-sky-200 via-cream-50 to-peach-100 overflow-hidden"
      style={{
        backgroundImage: `url(${BG_IMAGE_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <FeedbackOverlay kind="correct" visible={praiseVisible} />

      {/* 뒤로가기 — 좌상단 고정 */}
      <button
        onClick={onBack}
        title="뒤로가기"
        aria-label="뒤로가기"
        className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/95 hover:bg-white shadow-pop text-ink-700 font-bold text-sm sm:text-base transition-transform hover:-translate-x-0.5"
      >
        <span aria-hidden>←</span>
        <span>뒤로</span>
      </button>

      {/* 진행 표시 — 상단 가운데 */}
      <div className="flex justify-center pt-2 pb-1 shrink-0">
        <GameProgressBar current={currentIndex} total={items.length} score={score} />
      </div>

      {/* 메인 — 상: 헤더 / 중: 드롭존 + 확인(우측) / 하: 자음·모음 패널 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-4 px-3 sm:px-4 pb-3 min-h-0">
        {/* 헤더 — 단어 HERO + 작은 일러스트 */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 shrink-0">
          <h1
            className="font-display font-black tracking-tight leading-none whitespace-nowrap"
            style={{
              fontSize: 'clamp(4rem, 11vw, 10rem)',
              color: '#FF7A3C',
              WebkitTextStroke: '6px white',
              paintOrder: 'stroke fill',
              filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.08))',
            }}
          >
            {roundCorrect ? currentItem.word.slice(0, typedChars) : currentItem.word}
            {roundCorrect && typedChars < currentItem.word.length && (
              <span className="inline-block w-1.5 h-[0.7em] bg-coral-500 align-middle ml-2 animate-pulse" />
            )}
          </h1>
          {currentItem.imageUrl && (
            <div className="relative shrink-0">
              <img
                src={currentItem.imageUrl}
                alt={currentItem.word}
                className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
              />
              <span className="absolute -top-1 -right-1 text-xl sm:text-2xl">✨</span>
            </div>
          )}
        </div>

        {/* 중간 — 드롭존 + 확인 버튼 (오른쪽) */}
        <div className="flex flex-row items-center justify-center gap-4 sm:gap-6">
          <div
            className={cn(
              'rounded-3xl bg-cream-50/95 shadow-pop p-3 sm:p-4 transition-colors',
              isWrong && 'ring-4 ring-danger/40 animate-shake bg-danger/10',
              roundCorrect && 'ring-4 ring-success/40 bg-success/10'
            )}
          >
            <div className="grid grid-rows-3 gap-2 sm:gap-3">
              {Array.from({ length: ROWS }, (_, row) => (
                <div key={row} className="grid grid-cols-6 gap-1.5 sm:gap-2 p-0.5">
                  {Array.from({ length: COLS }, (_, col) => {
                    const cellKey = `${row}-${col}`;
                    const char = grid[row][col];
                    const correct = roundCorrect && !!char;
                    const inner = char ? (
                      <span
                        className={cn(
                          'text-2xl sm:text-3xl lg:text-4xl font-black',
                          isWrong
                            ? 'text-danger'
                            : correct
                              ? 'text-success'
                              : isVowel(char)
                                ? 'text-coral-500'
                                : 'text-peach-500'
                        )}
                      >
                        {char}
                      </span>
                    ) : null;
                    return (
                      <div
                        key={cellKey}
                        ref={drag.cellRef(cellKey)}
                        onDragOver={drag.handleDragOver}
                        onDrop={(e) => drag.handleDrop(cellKey, e, onPlace)}
                        onClick={() => handleCellClick(row, col)}
                        className={cn(
                          'w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16',
                          'rounded-2xl flex items-center justify-center select-none transition-all',
                          char ? 'cursor-pointer' : 'cursor-default',
                          char
                            ? 'bg-white shadow-soft border-2 border-cream-50'
                            : 'bg-peach-100/60 border-[3px] border-dashed border-peach-200 hover:border-coral-400 hover:bg-peach-100/80'
                        )}
                      >
                        {correct ? (
                          <motion.div
                            key={`c-${char}-${cellKey}`}
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full flex items-center justify-center"
                          >
                            {inner}
                          </motion.div>
                        ) : (
                          inner
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleCheck}
              disabled={roundCorrect}
              className={cn(
                'px-8 py-4 sm:px-10 sm:py-6 rounded-3xl text-2xl sm:text-3xl font-black transition-all',
                roundCorrect
                  ? 'bg-ink-100 text-ink-500 cursor-not-allowed'
                  : 'bg-gradient-to-b from-coral-400 to-coral-600 text-white shadow-pop hover:scale-105 active:scale-95'
              )}
            >
              확인
            </button>
            <button
              onClick={handleResetGrid}
              disabled={roundCorrect}
              title="블록 모두 비우기"
              className={cn(
                'px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-base sm:text-lg font-bold transition-all flex items-center justify-center gap-1.5',
                roundCorrect
                  ? 'bg-ink-100 text-ink-500 cursor-not-allowed'
                  : 'bg-white/95 text-ink-700 shadow-soft hover:bg-white hover:scale-105 active:scale-95'
              )}
            >
              <span aria-hidden>↺</span>
              <span>초기화</span>
            </button>
          </div>
        </div>

        {/* 하단 — 자음·모음 패널 (가로 나란히) */}
        <div className="flex flex-row gap-3 sm:gap-5 shrink-0">
          <BlockPanel title="자음" tone="consonant">
            {ALL_CONSONANTS.map((b) => (
              <BlockTile key={b.id} block={b} drag={drag} onPlace={onPlace} />
            ))}
          </BlockPanel>
          <BlockPanel title="모음" tone="vowel">
            {ALL_VOWELS.map((b) => (
              <BlockTile key={b.id} block={b} drag={drag} onPlace={onPlace} />
            ))}
          </BlockPanel>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 자음/모음 패널 + 타일
// ────────────────────────────────────────────────────────────────────────────

function BlockPanel({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'consonant' | 'vowel';
  children: ReactNode;
}) {
  return (
    <div className="relative rounded-3xl bg-cream-50/95 shadow-pop px-3 pt-6 pb-3 sm:px-4 sm:pt-7 sm:pb-4 border-2 border-dashed border-cream-50">
      {/* 헤더 칩 */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span
          className={cn(
            'px-4 py-1 rounded-full text-white text-xs sm:text-sm font-black shadow-md flex items-center gap-1 whitespace-nowrap',
            tone === 'consonant'
              ? 'bg-gradient-to-b from-warn to-peach-500'
              : 'bg-gradient-to-b from-coral-400 to-coral-600'
          )}
        >
          ⭐ {title} ⭐
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">{children}</div>
    </div>
  );
}

function BlockTile({
  block,
  drag,
  onPlace,
}: {
  block: JamoBlock;
  drag: ReturnType<typeof useBlockDrag<JamoBlock>>;
  onPlace: (key: string, block: JamoBlock) => void;
}) {
  const vowel = isVowel(block.char);
  return (
    <div
      draggable
      onDragStart={(e) => drag.handleDragStart(block, e)}
      onTouchStart={(e) => drag.handleTouchStart(block, e)}
      onTouchMove={drag.handleTouchMove}
      onTouchEnd={(e) => drag.handleTouchEnd(e, onPlace)}
      className={cn(
        'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-xl sm:text-2xl select-none cursor-grab',
        'shadow-md transition-transform hover:scale-110 active:scale-95 active:cursor-grabbing',
        vowel
          ? 'bg-gradient-to-b from-coral-400 to-coral-600 text-white'
          : 'bg-gradient-to-b from-warn to-peach-500 text-white'
      )}
      style={{
        textShadow: '0 2px 0 rgba(0,0,0,0.12)',
      }}
    >
      {block.char}
    </div>
  );
}
