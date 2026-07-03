import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type DragEvent as ReactDragEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { motion } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { EnglishBlockData, EnglishBlockLetter } from '@tangobook/shared';
import { VOWELS, CONSONANTS, isEnglishVowel } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { GameResultScreen } from '../GameResultScreen';
import { MobileLandscapeGate } from '../MobileLandscapeGate';
import {
  TutorialProvider,
  useTutorialHighlight,
  useTutorialIsPlaying,
  useTutorialExpected,
  useTutorialNotify,
} from './EnglishBlockTutorial/EnglishBlockTutorial.context';
import { EnglishBlockTutorial } from './EnglishBlockTutorial/EnglishBlockTutorial';
import { useGameAudio } from '../../hooks/useGameAudio';
import { usePreloadImages, usePrewarmWordTts } from '../../hooks/useGamePrefetch';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useBlockDrag } from '../../hooks/useBlockDrag';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { resolveTtsUrl } from '@/features/tts';
import { useStorybook } from '@/features/storybook';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { useGameLogger } from '@/features/learning';
import { cn } from '@/lib/cn';

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

function createEnglishGhost(char: string): HTMLDivElement {
  const ghost = document.createElement('div');
  const barColor = isEnglishVowel(char) ? '#FF5E3A' : '#FF9A5A';
  ghost.innerHTML = `<span style="flex:1;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#3A2B1F">${char}</span><div style="width:100%;height:6px;background:${barColor};border-radius:0 0 14px 14px"></div>`;
  ghost.setAttribute(
    'style',
    `width:52px;height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px;background:white;box-shadow:0 8px 24px rgba(0,0,0,.2);overflow:hidden`
  );
  return ghost;
}

function EnglishBlockPlayerInner({
  storybookId,
  gameData,
  difficulty,
  onComplete: _onComplete,
  onBack,
}: GamePlayerProps) {
  const data = gameData as EnglishBlockData;
  const items = data.items;

  // 이번 판 자산 워밍 — 라운드 진입 시 이미지 지연 + 정답 시 TTS 지연 방지
  usePreloadImages(items.map((it) => it.imageUrl));
  usePrewarmWordTts(
    items.map((it) => ({ text: it.word, directUrl: it.ttsUrl })),
    'english',
    storybookId,
    'eblock'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasTriedThisRound, setHasTriedThisRound] = useState(false);
  const [finished, setFinished] = useState(false);
  const logGame = useGameLogger();
  const wordResultsRef = useRef<{ word: string; correct: boolean }[]>([]);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const [wrongSlots, setWrongSlots] = useState<Set<number>>(new Set());
  const [typedChars, setTypedChars] = useState(0);
  const [hintActive, setHintActive] = useState(false);
  const isTutorialPlaying = useTutorialIsPlaying();
  const { popLetter, glowSlot } = useTutorialHighlight();
  const expected = useTutorialExpected();
  const notifyPlacement = useTutorialNotify();
  const handleHintStart = useCallback(() => {
    if (hintActive || isTutorialPlaying) return;
    setHintActive(true);
  }, [hintActive, isTutorialPlaying]);
  const handleHintEnd = useCallback(() => {
    setHintActive(false);
  }, []);

  const currentItem = items[currentIndex];
  const letterCount = currentItem.letters.length;

  const initGrid = useCallback(
    (letters: EnglishBlockLetter[]) =>
      Array.from({ length: letters.length }, () => null as string | null),
    []
  );

  const [grid, setGrid] = useState<(string | null)[]>(() => initGrid(currentItem.letters));

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  // 정답 후 "그 단어가 나오는 동화 장면 + 나레이션" 리빌 (소스 동화책 있을 때만).
  const { data: sourceStorybook } = useStorybook(storybookId);
  const [scene, setScene] = useState<WordScene | null>(null);
  const { mapRef: phonicsMapRef } = usePhonicsMap(['mod_phonics', 'mod_english']);
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

  // 정답 확정 시 타이핑 효과: 한 글자씩 증가
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

  // 배치 시 "뾱" 효과음 — Web Audio 합성 (mp3 자산 불필요).
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playPlacementTick = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      /* AudioContext 미지원/차단 — 조용히 무시 */
    }
  }, []);

  const placeBlock = useCallback(
    (slot: number, block: LetterBlock) => {
      if (grid[slot] !== null) return;
      // 튜토리얼 wait 상태에서는 expected 와 일치하는 placement 만 허용
      if (expected !== null) {
        const matches = expected.letter === block.char && expected.slot === slot;
        if (!matches) return;
      }
      setGrid((prev) => {
        const next = [...prev];
        next[slot] = block.char;
        return next;
      });
      setWrongSlots(new Set());
      playPlacementTick();
      notifyPlacement(block.char, slot);
    },
    [grid, expected, notifyPlacement, playPlacementTick]
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

  // 정답 자동 체크 — 모든 slot 이 target 과 일치하면 "확인" 버튼 없이 정답 처리.
  // 오답 분기는 자동 발동 X (사용자가 확인 누를 때만 wrong slot 표시).
  useEffect(() => {
    if (roundCorrect) return;
    const target = currentItem.word.toLowerCase();
    let allCorrect = true;
    for (let i = 0; i < letterCount; i++) {
      if (!grid[i] || grid[i] !== target[i]) {
        allCorrect = false;
        break;
      }
    }
    if (allCorrect) {
      handleCheckRef.current();
    }
  }, [grid, currentItem.word, letterCount, roundCorrect]);

  // 다음 단어로 (장면 리빌 종료 포함). fromIndex = 방금 맞춘 단어 index.
  const goToNext = useCallback(
    (fromIndex: number) => {
      setScene(null);
      if (fromIndex + 1 < items.length) {
        const nextIdx = fromIndex + 1;
        setCurrentIndex(nextIdx);
        setGrid(initGrid(items[nextIdx].letters));
        setHasTriedThisRound(false);
        setRoundCorrect(false);
        setWrongSlots(new Set());
        setHintActive(false);
      } else {
        setFinished(true);
      }
    },
    [items, initGrid]
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
      const isFirstTry = !hasTriedThisRound;
      if (isFirstTry) setScore((s) => s + 1);
      wordResultsRef.current.push({ word: currentItem.word, correct: isFirstTry });
      setRoundCorrect(true);
      // 정답 시퀀스 (playCorrectSequence): 효과음 → 단어 발음 → 시스템 칭찬 음원 → onDone.
      // FeedbackOverlay (호리 cheering + confetti + "잘했어!") 가 praiseVisible 로 표시.
      // 영어 정책: ttsUrl 우선 → 없으면 phonics concat 폴백 (resolveTtsUrl).
      (async () => {
        const wordAudioUrl = await resolveTtsUrl({
          text: currentItem.word,
          language: 'english',
          storybookId,
          directUrl: currentItem.ttsUrl,
          identifierPrefix: 'eblock',
        });
        playCorrectSequence({
          ttsUrl: wordAudioUrl,
          language: 'en',
          onDone: () => {
            // 단어 발음+칭찬 끝 → 그 단어가 나오는 동화 장면+나레이션 리빌 (있으면), 없으면 바로 다음.
            const s = resolveSceneFromWord(currentItem.word, 'en', sourceStorybook);
            if (s) setScene(s);
            else goToNext(currentIndex);
          },
        });
      })();
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
    playCorrectSequence,
    playFeedbackSound,
    roundCorrect,
    storybookId,
    goToNext,
    sourceStorybook,
  ]);

  // ref 로 handleCheck 보관 — 자동 체크 effect 가 stale closure 호출하지 않도록
  // render body 에서 직접 할당 (effect 면 ordering 충돌로 오답 처리됨).
  const handleCheckRef = useRef(handleCheck);
  handleCheckRef.current = handleCheck;

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < items.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setGrid(initGrid(items[nextIdx].letters));
      setHasTriedThisRound(false);
      setRoundCorrect(false);
      setWrongSlots(new Set());
      setHintActive(false);
    } else {
      setFinished(true);
    }
  }, [currentIndex, items, initGrid]);

  // 게임 완료 시 학습 이벤트 emit (영어: 단어만)
  useEffect(() => {
    if (!finished) return;
    const collected = wordResultsRef.current;
    if (collected.length === 0) return;
    logGame({ gameType: 'english-block', storybookId, lang: 'en', results: collected });
    wordResultsRef.current = [];
  }, [finished, logGame, storybookId]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    setHasTriedThisRound(false);
    setRoundCorrect(false);
    setWrongSlots(new Set());
    setGrid(initGrid(items[0].letters));
    setHintActive(false);
    wordResultsRef.current = [];
  }, [items, initGrid]);

  if (finished) {
    return (
      <MobileLandscapeGate>
        <GameResultScreen
          storybookId={storybookId}
          score={score}
          total={items.length}
          lang="en"
          onRestart={handleRestart}
          onBack={onBack}
        />
      </MobileLandscapeGate>
    );
  }

  const renderCell = (slot: number) => {
    const cellKey = `${slot}`;
    const char = grid[slot];
    const isWrong = wrongSlots.has(slot);
    const placedCorrectly = roundCorrect && !!char;
    const barColor = char
      ? isWrong
        ? 'bg-danger'
        : roundCorrect
          ? 'bg-success'
          : isEnglishVowel(char)
            ? 'bg-coral-500'
            : 'bg-peach-500'
      : '';

    const cellInner = (
      <>
        {char ? (
          <>
            <span
              className={cn(
                'flex-1 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-black',
                isWrong ? 'text-danger' : 'text-ink-900'
              )}
            >
              {char}
            </span>
            <div className={cn('w-full h-1.5 lg:h-2', barColor)} />
          </>
        ) : null}
      </>
    );

    const cellBody = placedCorrectly ? (
      <motion.div
        key={`correct-${char}-${slot}`}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.4 }}
        className="w-full h-full flex flex-col items-center justify-center overflow-hidden"
      >
        {cellInner}
      </motion.div>
    ) : (
      cellInner
    );

    const isGlowing = glowSlot === slot;
    const isExpectedSlot = expected !== null && expected.slot === slot;
    const slotDimmed = expected !== null && !isExpectedSlot;
    const interactable = !isTutorialPlaying && !slotDimmed;
    return (
      <div
        key={cellKey}
        data-slot={slot}
        ref={drag.cellRef(cellKey)}
        onDragOver={interactable ? drag.handleDragOver : undefined}
        onDrop={interactable ? (e) => drag.handleDrop(cellKey, e, onPlace) : undefined}
        onClick={() => interactable && handleCellClick(slot)}
        className={cn(
          'w-12 h-14 sm:w-16 sm:h-[4.5rem] lg:w-[4.5rem] lg:h-[5.5rem] rounded-md flex flex-col items-center justify-center overflow-hidden transition-all select-none',
          interactable ? 'cursor-pointer' : 'cursor-not-allowed',
          char
            ? isWrong
              ? 'bg-white shadow-card ring-2 ring-danger'
              : roundCorrect
                ? 'bg-success/20 shadow-pop ring-4 ring-success/70 shadow-[0_0_30px_rgba(34,197,94,0.4)]'
                : 'bg-white shadow-card'
            : 'border-2 border-dashed border-coral-300 bg-white/40',
          interactable &&
            !char &&
            'hover:border-coral-500 hover:bg-coral-100/30 hover:animate-pulse',
          isGlowing && 'ring-4 ring-coral-400 scale-110 bg-coral-50/80',
          slotDimmed && !isGlowing && 'opacity-40'
        )}
      >
        {cellBody}
      </div>
    );
  };

  const renderBlock = (block: LetterBlock) => {
    const popping = popLetter === block.char;
    const dimmed = expected !== null && expected.letter !== block.char;
    const interactable = !isTutorialPlaying && !dimmed;
    return (
      <motion.div
        key={block.id}
        data-letter-tile={block.char}
        draggable={interactable}
        onDragStart={
          ((e: ReactDragEvent) => interactable && drag.handleDragStart(block, e)) as never
        }
        onTouchStart={
          ((e: ReactTouchEvent) => interactable && drag.handleTouchStart(block, e)) as never
        }
        onTouchMove={drag.handleTouchMove as never}
        onTouchEnd={
          ((e: ReactTouchEvent) => interactable && drag.handleTouchEnd(e, onPlace)) as never
        }
        animate={
          popping
            ? { scale: [1, 1.3, 1.1, 1.15, 1.1], rotate: [0, -8, 6, -4, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'w-10 h-12 sm:w-12 sm:h-14 lg:w-14 lg:h-[4rem] rounded-md flex flex-col items-center justify-center overflow-hidden select-none bg-white shadow-soft',
          interactable ? 'cursor-grab' : 'cursor-not-allowed',
          interactable &&
            'transition-transform hover:scale-105 hover:shadow-pop active:scale-[1.08] active:shadow-pop active:rotate-2 active:cursor-grabbing',
          popping && 'ring-4 ring-coral-300 shadow-pop',
          dimmed && 'opacity-30'
        )}
      >
        <span className="flex-1 flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-black text-ink-900">
          {block.char}
        </span>
        <div
          className={cn('w-full h-1.5 lg:h-2', block.isVowel ? 'bg-coral-500' : 'bg-peach-500')}
        />
      </motion.div>
    );
  };

  return (
    <MobileLandscapeGate>
      {/* vocab launch wrapper 가 viewport 0 부터 안 시작하는 케이스 차단 — fixed inset-0 z-[60] 으로 직접 덮음. */}
      <div className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-br from-cream-50 to-peach-100 overflow-y-auto">
        <div className="px-2 pt-2 shrink-0">
          <GameHeader title="영어 블록" current={score} total={items.length} onBack={onBack} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 gap-4 sm:gap-6">
          {/* 완성된 단어 타이핑 패널 */}
          {roundCorrect && (
            <div className="bg-success/15 backdrop-blur-sm rounded-2xl px-6 py-4 min-h-[60px] text-3xl sm:text-4xl font-black text-success text-center shadow-pop ring-4 ring-success/40 min-w-[220px]">
              {currentItem.word.slice(0, typedChars)}
              {typedChars < currentItem.word.length && (
                <span className="inline-block w-0.5 h-6 bg-coral-500 ml-1 animate-pulse align-middle" />
              )}
            </div>
          )}

          {currentItem.imageUrl && (
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-peach-300/40 blur-2xl scale-110" />
              <img
                src={currentItem.imageUrl}
                alt={currentItem.word}
                className="relative w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 object-contain rounded-xl bg-white shadow-card"
              />
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-wide text-ink-900">
              {currentItem.word}
            </span>
            <div className="flex gap-1.5 sm:gap-2">
              {Array.from({ length: letterCount }, (_, slot) => renderCell(slot))}
            </div>
          </div>

          <div className="flex justify-center gap-3 sm:gap-4">
            <button
              onClick={handleCheck}
              disabled={roundCorrect || isTutorialPlaying}
              className={cn(
                'px-6 py-2.5 sm:px-10 sm:py-3.5 rounded-md text-xl sm:text-xl font-bold transition-colors',
                roundCorrect || isTutorialPlaying
                  ? 'bg-ink-100 text-ink-900 cursor-not-allowed'
                  : 'bg-coral-500 hover:bg-coral-600 text-white shadow-pop'
              )}
            >
              확인
            </button>
            <button
              onClick={handleNext}
              disabled={isTutorialPlaying}
              className={cn(
                'px-6 py-2.5 sm:px-10 sm:py-3.5 rounded-md text-xl sm:text-xl font-bold transition-colors shadow-card',
                isTutorialPlaying
                  ? 'bg-ink-100 text-ink-900 cursor-not-allowed'
                  : 'bg-peach-500 hover:bg-peach-300 text-white'
              )}
            >
              {currentIndex + 1 < items.length ? '다음 →' : '결과 보기'}
            </button>
            {difficulty === 'easy' && (
              <button
                onClick={handleHintStart}
                disabled={hintActive || isTutorialPlaying || roundCorrect}
                className="px-6 py-2.5 sm:px-10 sm:py-3.5 bg-gradient-to-b from-warn to-peach-500 text-white rounded-md text-xl font-black transition-all shadow-pop hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                🪄 도와줘
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 px-3 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white/40 backdrop-blur-sm">
          <div className="flex-1 min-w-0">
            <p className="text-lg sm:text-xl font-black text-ink-900 mb-2 sm:mb-3 ml-1">
              Consonants
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">{ALL_CONSONANTS.map(renderBlock)}</div>
          </div>
          <div className="shrink-0">
            <p className="text-lg sm:text-xl font-black text-ink-900 mb-2 sm:mb-3 ml-1">Vowels</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">{ALL_VOWELS.map(renderBlock)}</div>
          </div>
        </div>
      </div>
      <EnglishBlockTutorial word={currentItem.word} active={hintActive} onEnd={handleHintEnd} />
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          ttsUrl={scene.pageTtsUrl}
          onDone={() => goToNext(currentIndex)}
        />
      )}
    </MobileLandscapeGate>
  );
}

export function EnglishBlockPlayer(props: GamePlayerProps) {
  return (
    <TutorialProvider>
      <EnglishBlockPlayerInner {...props} />
    </TutorialProvider>
  );
}
