import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { EnglishBlockData, EnglishBlockLetter } from '@tangobook/shared';
import { isEnglishVowel } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { GameResultScreen } from '../GameResultScreen';
import { MobileLandscapeGate } from '../MobileLandscapeGate';
import { gameSafeAreaStyle } from '../../lib/game-safe-area';
import {
  TutorialProvider,
  useTutorialHighlight,
  useTutorialIsPlaying,
  useTutorialExpected,
  useTutorialNotify,
} from './EnglishBlockTutorial/EnglishBlockTutorial.context';
import { EnglishBlockTutorial } from './EnglishBlockTutorial/EnglishBlockTutorial';
import { useGameAudio } from '../../hooks/useGameAudio';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle } from '../GameStyleChip';
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

// 하단 글자 패널 = a~z 알파벳 순서 (자음/모음 분리 대신 아이가 익숙한 abcd 순).
const ALL_LETTERS: LetterBlock[] = 'abcdefghijklmnopqrstuvwxyz'.split('').map((ch, i) => ({
  id: `ltr-${i}`,
  char: ch,
  isVowel: isEnglishVowel(ch),
}));

function EnglishBlockPlayerInner({
  storybookId,
  gameData,
  difficulty,
  onComplete: _onComplete,
  onBack,
}: GamePlayerProps) {
  const { t } = useTranslation('games');
  const data = gameData as EnglishBlockData;
  const items = data.items;

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
  const gameStyle = useGameStyle(sourceStorybook);
  const [scene, setScene] = useState<WordScene | null>(null);
  const { mapRef: phonicsMapRef, loading: phonicsLoading } = usePhonicsMap([
    'mod_phonics',
    'mod_english',
  ]);
  // 게임 시작 게이트 — 맵 로드만(캐시 hit 시 즉시). 단어 발음은 백그라운드 워밍.
  const audioReady = !phonicsLoading;

  // 글자 배치 시 음원 자동 재생
  const prevGridRef = useRef<(string | null)[]>([]);
  // 단어를 완성하는 마지막 글자의 소리 URL — 여기서 바로 재생하지 않고 handleCheck 가
  // "마지막 글자 → 단어 → 칭찬" 체인의 첫 링크로 재생 (바로 재생하면 단어 발음이 끼어들어 잘림).
  const pendingLastLetterRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevGridRef.current;
    const target = currentItem.word.toLowerCase();
    let completesWord = true;
    for (let i = 0; i < letterCount; i++) {
      if (!grid[i] || grid[i] !== target[i]) {
        completesWord = false;
        break;
      }
    }
    for (let i = 0; i < grid.length; i++) {
      const cur = grid[i];
      if (cur && cur !== prev[i]) {
        const url = phonicsMapRef.current.get(cur);
        if (url) {
          if (completesWord) pendingLastLetterRef.current = url;
          else playAudio(url);
        }
      }
    }
    prevGridRef.current = [...grid];
  }, [grid, playAudio, phonicsMapRef, currentItem.word, letterCount]);

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

  // 탭-투-플레이스: 글자 타일을 누르면 왼쪽 빈 슬롯부터 채워진다 (4-5세 드래그 어려움 → 탭).
  const handleTilePlace = useCallback(
    (block: LetterBlock) => {
      if (roundCorrect) return;
      const slot = grid.indexOf(null);
      if (slot < 0) return;
      placeBlock(slot, block);
    },
    [roundCorrect, grid, placeBlock]
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
      // 4-5세 정책: 완성 = 성공. 중간에 한 번 틀렸다 고쳐도 완성하면 점수(다 맞추면 만점).
      // 정확도(첫 시도 여부)는 리포트용 correct 플래그로만 기록.
      setScore((s) => s + 1);
      wordResultsRef.current.push({ word: currentItem.word, correct: isFirstTry });
      setRoundCorrect(true);
      // 정답 시퀀스 (playCorrectSequence): 효과음 → 단어 발음 → 시스템 칭찬 음원 → onDone.
      // FeedbackOverlay (호리 cheering + confetti + "잘했어!") 가 praiseVisible 로 표시.
      // 영어 정책: ttsUrl 우선 → 없으면 phonics concat 폴백 (resolveTtsUrl).
      (async () => {
        // 마지막 글자 소리를 먼저 끝까지 재생 → 그 다음 단어 발음 → 칭찬 (체인).
        // 글자 소리는 즉시 재생(반응성), 단어 URL 은 그 사이 백그라운드로 resolve.
        const letterUrl = pendingLastLetterRef.current;
        pendingLastLetterRef.current = null;
        const wordUrlPromise = resolveTtsUrl({
          text: currentItem.word,
          language: 'english',
          storybookId,
          directUrl: currentItem.ttsUrl,
          identifierPrefix: 'eblock',
        });
        const playWord = async () => {
          const wordAudioUrl = await wordUrlPromise;
          playCorrectSequence({
            ttsUrl: wordAudioUrl,
            language: 'en',
            onDone: () => {
              // 단어 발음+칭찬 끝 → 그 단어가 나오는 동화 장면+나레이션 리빌 (있으면), 없으면 바로 다음.
              const s = resolveSceneFromWord(
                currentItem.word,
                'en',
                sourceStorybook,
                gameStyle.selectedStyle
              );
              if (s) setScene(s);
              else goToNext(currentIndex);
            },
          });
        };
        // playAudio 는 onEnded 를 ended/error/재생실패 모두에서 호출 → 소리가 없어도 체인이 멈추지 않음.
        if (letterUrl) playAudio(letterUrl, () => void playWord());
        else void playWord();
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
    playAudio,
    playCorrectSequence,
    playFeedbackSound,
    roundCorrect,
    storybookId,
    goToNext,
    sourceStorybook,
    gameStyle.selectedStyle,
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
      <motion.button
        key={block.id}
        type="button"
        data-letter-tile={block.char}
        onClick={() => interactable && handleTilePlace(block)}
        disabled={!interactable}
        animate={
          popping
            ? { scale: [1, 1.3, 1.1, 1.15, 1.1], rotate: [0, -8, 6, -4, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'w-11 h-12 sm:w-12 sm:h-14 lg:w-14 lg:h-[4rem] rounded-md flex flex-col items-center justify-center overflow-hidden select-none bg-white shadow-soft',
          interactable ? 'cursor-pointer' : 'cursor-not-allowed',
          interactable &&
            'transition-transform hover:scale-105 hover:shadow-pop active:scale-95 active:shadow-pop',
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
      </motion.button>
    );
  };

  return (
    <MobileLandscapeGate>
      {/* vocab launch wrapper 가 viewport 0 부터 안 시작하는 케이스 차단 — fixed inset-0 z-[60] 으로 직접 덮음. */}
      <div
        className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-br from-cream-50 to-peach-100 overflow-hidden"
        style={gameSafeAreaStyle()}
      >
        <div className="px-2 pt-2 shrink-0">
          <GameHeader
            title={t('cards.block.labelEn')}
            current={score}
            total={items.length}
            onBack={onBack}
          />
        </div>

        {/* 오디오 로딩 overlay — 맵 + 단어 발음 프리워밍까지 대기(첫 정답 발음 지연 방지). */}
        {!audioReady && (
          <div className="absolute inset-0 z-[65] flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="rounded-3xl bg-white shadow-pop px-10 py-8 sm:px-12 sm:py-10 flex flex-col items-center gap-4 border-2 border-coral-200">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[6px] border-coral-200 border-t-coral-500 animate-spin"
                aria-hidden
              />
              <p className="text-xl sm:text-2xl font-black text-ink-900 font-display">
                {t('audioLoading.title')}
              </p>
              <p className="text-sm sm:text-base text-ink-500">{t('audioLoading.sub')}</p>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-[clamp(0.375rem,1.5vh,1.5rem)] gap-[clamp(0.5rem,1.5vh,1.5rem)]">
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
                className="relative h-[clamp(4rem,20vh,16rem)] w-auto object-contain rounded-xl bg-white shadow-card"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-5">
            <span className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-wide text-ink-900">
              {currentItem.word}
            </span>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
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
              {t('blockGame.check')}
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
              {currentIndex + 1 < items.length ? t('blockGame.next') : t('blockGame.seeResult')}
            </button>
            {difficulty === 'easy' && (
              <button
                onClick={handleHintStart}
                disabled={hintActive || isTutorialPlaying || roundCorrect}
                className="px-6 py-2.5 sm:px-10 sm:py-3.5 bg-gradient-to-b from-warn to-peach-500 text-white rounded-md text-xl font-black transition-all shadow-pop hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {t('blockGame.help')}
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 px-3 sm:px-6 py-4 sm:py-6 bg-white/40 backdrop-blur-sm">
          <p className="text-lg sm:text-xl font-black text-ink-900 mb-2 sm:mb-3 ml-1">ABC</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {ALL_LETTERS.map(renderBlock)}
          </div>
        </div>
      </div>
      <EnglishBlockTutorial word={currentItem.word} active={hintActive} onEnd={handleHintEnd} />
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          highlight={scene.highlight}
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
