import { useState, useCallback, useMemo, useRef, useEffect, Fragment, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
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
import { useGameAudio } from '../../hooks/useGameAudio';
import { useGameEntryGuide } from '../../hooks/useGameEntryGuide';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle } from '../GameStyleChip';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { resolveTtsUrl } from '@/features/tts';
import { storybookApi, useStorybook } from '@/features/storybook';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { useGameLogger } from '@/features/learning';
import { cn } from '@/lib/cn';
import { ENTRY_GUIDE, voiceUrl } from '@/features/phonics-learner/hooks/useEntryGuide';
import { useBoardCamera } from '../../hooks/useBoardCamera';
import { useIsLandscape } from '../../hooks/useIsLandscape';
import { BoardCameraPanel } from './BoardCameraPanel';

interface LetterBlock {
  id: string;
  char: string;
  isVowel: boolean;
}

function DroppableLetterSlot({
  slot,
  disabled,
  onClick,
  className,
  children,
}: {
  slot: number;
  disabled: boolean;
  onClick: () => void;
  className: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `english-slot-${slot}`, disabled });
  return (
    <div
      ref={setNodeRef}
      data-slot={slot}
      onClick={onClick}
      className={cn(
        className,
        isOver && 'scale-110 border-success bg-success/15 ring-4 ring-success/40'
      )}
    >
      {children}
    </div>
  );
}

function DraggableLetterTile({
  block,
  interactable,
  popping,
  onClick,
}: {
  block: LetterBlock;
  interactable: boolean;
  popping: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `english-letter-${block.id}`,
    disabled: !interactable,
    data: { block },
  });
  return (
    <motion.button
      ref={setNodeRef}
      type="button"
      data-letter-tile={block.char}
      onClick={onClick}
      disabled={!interactable}
      {...attributes}
      {...listeners}
      animate={
        popping
          ? { scale: [1, 1.3, 1.1, 1.15, 1.1], rotate: [0, -8, 6, -4, 0] }
          : { scale: 1, rotate: 0 }
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'w-[clamp(2.75rem,2.7vw,3.75rem)] h-[clamp(3.25rem,3.4vw,4.5rem)] touch-none rounded-2xl flex flex-col items-center justify-center overflow-hidden select-none bg-white shadow-soft',
        interactable ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed',
        interactable &&
          'transition-transform hover:scale-105 hover:shadow-pop active:scale-95 active:shadow-pop',
        popping && 'ring-4 ring-coral-300 shadow-pop',
        isDragging && 'opacity-30'
      )}
    >
      <span className="flex-1 flex items-center justify-center text-[clamp(1.15rem,1.5vw,2rem)] font-black text-ink-900">
        {block.char}
      </span>
      <div className={cn('w-full h-1.5 lg:h-2', block.isVowel ? 'bg-coral-500' : 'bg-peach-500')} />
    </motion.button>
  );
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
  onComplete: _onComplete,
  onBack,
  initialInputMode = 'screen',
}: GamePlayerProps) {
  const { t } = useTranslation('games');
  const data = gameData as EnglishBlockData;
  const items = data.items;
  /**
   * 하단 패널에 깔 글자 — 어댑터가 준 목록(알파벳 단원 = 그 단원 글자)이 있으면 그것만, 없으면 a~z.
   *
   * 🔴 `a` 하나를 넣는데 26자를 훑게 하면 배우는 게 글자가 아니라 **찾기**가 된다(사용자 지적).
   * 🔴 목록을 **이번 판 문제(`items`)에서 모으지 않는다** — 4문제가 b·c 만 뽑히면 「ABC 배우기」인데
   *    패널에 A 가 없다(내가 그렇게 냈다가 사용자가 잡았다). 단원 전체는 어댑터만 알고 있다.
   */
  const panelLetters = useMemo(
    () =>
      data.panelLetters?.length
        ? data.panelLetters.map((ch, i) => ({
            id: `ltr-${i}`,
            char: ch,
            isVowel: isEnglishVowel(ch),
          }))
        : ALL_LETTERS,
    [data.panelLetters]
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
  const [draggedBlock, setDraggedBlock] = useState<LetterBlock | null>(null);
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const isTutorialPlaying = useTutorialIsPlaying();
  const { popLetter, glowSlot } = useTutorialHighlight();
  const expected = useTutorialExpected();
  const notifyPlacement = useTutorialNotify();
  const currentItem = items[currentIndex];
  const sceneStorybookId =
    currentItem.storybookId ?? (storybookId === '__random_pool__' ? undefined : storybookId);
  const letterCount = currentItem.letters.length;
  /**
   * 한 글자짜리 라운드 = 알파벳 단원.
   * 🔴 그 경우 **정답 글자를 화면에 쓰지 않는다** — 단어가 곧 정답이라 `c` 를 띄우고 `c` 를 고르라는
   *    꼴이 된다(사용자 지적). 대신 그림과 소리로 판단하게 하고, 무엇을 하라는 말을 그 자리에 둔다.
   */
  const isAlphabetRound = currentItem.word.length === 1;

  const initGrid = useCallback(
    (letters: EnglishBlockLetter[]) =>
      Array.from({ length: letters.length }, () => null as string | null),
    []
  );

  const [grid, setGrid] = useState<(string | null)[]>(() => initGrid(currentItem.letters));

  /**
   * 🔴 **판이 둘이다 — 그 밖은 전부 같다.** 화면 판은 아이가 끌어다 놓은 칸에서, 실물 판은
   *    카메라에서 글자를 받는다. 아래 로직(새 글자 소리 · 자동 정답 · 칭찬 · 장면 리빌 · 결과 ·
   *    리포트)은 `grid` 만 보므로 여기서 갈리고 끝난다.
   * 🔴 형판 집합은 **한글과 안 섞는다** — `o`/`ㅇ`, `i`/`ㅣ` 가 같은 그림이라 최고점으로 못 가른다.
   */
  const [camera, setCamera] = useState(initialInputMode === 'camera');
  const cam = useBoardCamera({ set: 'en', enabled: camera });
  const landscape = useIsLandscape();
  const twoCol = camera && landscape;
  useEffect(() => {
    if (!camera) return;
    /* 🔴 띄어쓰기는 버린다 — 조각이 떨어져 있으면 인식기가 글자 묶음을 공백으로 나눠 주는데,
       낱말은 **왼쪽에서 오른쪽으로 읽은 글자들**이지 그 간격이 아니다. */
    const w = cam.word.toLowerCase().replace(/\s+/g, '');
    setGrid(Array.from({ length: letterCount }, (_, i) => w[i] ?? null));
  }, [camera, cam.word, letterCount]);

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  // 정답 후 "그 단어가 나오는 동화 장면 + 나레이션" 리빌 (소스 동화책 있을 때만).
  const { data: fetchedSourceStorybook } = useStorybook(sceneStorybookId);
  const sourceStorybook =
    fetchedSourceStorybook?.id === sceneStorybookId ? fetchedSourceStorybook : undefined;
  const sourceStorybookRef = useRef(sourceStorybook);
  sourceStorybookRef.current = sourceStorybook;
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const block = event.active.data.current?.block as LetterBlock | undefined;
    setDraggedBlock(block ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedBlock(null);
      if (!event.over) return;
      const block = event.active.data.current?.block as LetterBlock | undefined;
      const slot = Number(String(event.over.id).replace('english-slot-', ''));
      if (block && Number.isInteger(slot)) placeBlock(slot, block);
    },
    [placeBlock]
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

  /**
   * 낱말 소리 — 알파벳 판의 **문제**다(그림은 보조).
   * 🔴 `currentItem.ttsUrl` 은 어댑터가 **낱말 전체**(cat)로 넣어준다. `currentItem.word` 는
   *    알파벳 판에서 첫 글자(`c`) 하나뿐이라, 그걸 읽으면 문제가 아니라 답을 불러주는 셈이다.
   */
  const sayWord = useCallback(async () => {
    if (currentItem.ttsUrl) {
      playAudio(currentItem.ttsUrl);
      return;
    }
    /**
     * 🔴 알파벳 판에서 `currentItem.word` 로 폴백하면 **정답(`c`)을 읽어준다** — 낱말 음원이 없으면
     *    차라리 소리를 안 낸다(그림이 무엇인지 알려준다). 낱말 전체를 쓰는 판만 폴백한다.
     */
    if (isAlphabetRound) return;
    const url = await resolveTtsUrl({
      text: currentItem.word,
      language: 'english',
      storybookId: sceneStorybookId,
      identifierPrefix: 'eblock',
    });
    playAudio(url);
  }, [currentItem.ttsUrl, currentItem.word, isAlphabetRound, sceneStorybookId, playAudio]);

  /**
   * 문제가 바뀌면 **한 번** 들려준다 — 아이가 버튼을 찾아 누를 필요가 없게.
   * 🔴 의존성은 **문제 인덱스**만. 함수·객체 신원에 걸면 부모가 리렌더될 때마다 다시 울린다
   *    (이 프로젝트에서 반복해서 낸 버그).
   */
  const sayWordRef = useRef(sayWord);
  sayWordRef.current = sayWord;

  // 🔴 진입 안내 음성 — "블록으로 단어를 만들어봐!" 를 한 번 낸다(사용자: 화면마다 멘트 통일).
  //    알파벳 판은 낱말도 들려주므로 **안내가 끝난 뒤** 낱말이 나오게 순서를 맞춘다(겹침 방지).
  const [guideDone, setGuideDone] = useState(false);
  useGameEntryGuide(voiceUrl(ENTRY_GUIDE.blockMake), playAudio, () => setGuideDone(true));
  useEffect(() => {
    // 알파벳 판은 문제가 바뀌면 낱말을 한 번 들려준다 — 단, **첫 라운드는 안내가 끝난 뒤**.
    if (!isAlphabetRound || !guideDone) return;
    void sayWordRef.current();
  }, [currentIndex, isAlphabetRound, guideDone]);

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
          storybookId: sceneStorybookId,
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
              void (async () => {
                let book = sourceStorybookRef.current;
                if (!book && sceneStorybookId) {
                  try {
                    book = await storybookApi.getById(sceneStorybookId);
                  } catch {
                    // 연결 책이 없거나 삭제된 단어는 기존 정책대로 바로 다음 문제로 넘어간다.
                  }
                }
                const s = resolveSceneFromWord(
                  currentItem.word,
                  'en',
                  book,
                  gameStyle.selectedStyle
                );
                if (s) setScene(s);
                else goToNext(currentIndex);
              })();
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
    sceneStorybookId,
    goToNext,
    gameStyle.selectedStyle,
  ]);

  // ref 로 handleCheck 보관 — 자동 체크 effect 가 stale closure 호출하지 않도록
  // render body 에서 직접 할당 (effect 면 ordering 충돌로 오답 처리됨).
  const handleCheckRef = useRef(handleCheck);
  handleCheckRef.current = handleCheck;

  const handleNext = useCallback(() => {
    goToNext(currentIndex);
  }, [currentIndex, goToNext]);

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
    wordResultsRef.current = [];
  }, [items, initGrid]);

  /** 🔴 실물 모드에선 가로 강제 벽을 안 세운다 — 「가로로 돌려주세요」가 곧 적응형의 반대다. */
  const Gate = camera ? Fragment : MobileLandscapeGate;

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
      <DroppableLetterSlot
        key={cellKey}
        slot={slot}
        disabled={!interactable || roundCorrect}
        onClick={() => interactable && handleCellClick(slot)}
        className={cn(
          'w-[clamp(3.5rem,5vw,6.5rem)] h-[clamp(4rem,6vw,7.5rem)] rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all select-none',
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
      </DroppableLetterSlot>
    );
  };

  const renderBlock = (block: LetterBlock) => {
    const popping = popLetter === block.char;
    const dimmed = expected !== null && expected.letter !== block.char;
    const interactable = !isTutorialPlaying && !dimmed;
    return (
      <DraggableLetterTile
        key={block.id}
        block={block}
        interactable={interactable}
        popping={popping}
        onClick={() => interactable && handleTilePlace(block)}
      />
    );
  };

  return (
    <DndContext
      sensors={dragSensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragCancel={() => setDraggedBlock(null)}
      onDragEnd={handleDragEnd}
    >
      <Gate>
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

          {/* 🔴 적응형은 **방향**이 정한다 — 폭(`sm:`)으로 가르면 세로로 세운 태블릿이 가로 배치를
            받는다(둘 다 `sm` 을 넘는다). 세로면 위아래로 쌓고 가로면 좌우로 나눈다. */}
          <div
            className={cn(
              'flex-1 min-h-0 flex items-stretch justify-center px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.5rem,1.5vh,1.25rem)] gap-[clamp(0.5rem,1.5vh,1.5rem)]',
              twoCol ? 'flex-row' : 'flex-col'
            )}
          >
            <div
              className={cn(
                'relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-[2rem] border-2 border-white bg-white/75 px-[clamp(1rem,4vw,4rem)] py-[clamp(0.75rem,2.5vh,2rem)] shadow-pop backdrop-blur-sm',
                landscape && !camera
                  ? 'flex-row gap-[clamp(2rem,6vw,8rem)]'
                  : 'flex-col gap-[clamp(0.5rem,1.5vh,1.5rem)]'
              )}
            >
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-peach-200/45 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-coral-100/45 blur-3xl" />
              {/* 완성된 단어 타이핑 패널 */}
              {roundCorrect && (
                <div className="absolute left-1/2 top-5 z-10 min-w-[220px] -translate-x-1/2 rounded-2xl bg-success/15 px-6 py-3 text-center text-3xl font-black text-success shadow-pop ring-4 ring-success/40 backdrop-blur-sm sm:text-4xl">
                  {currentItem.word.slice(0, typedChars)}
                  {typedChars < currentItem.word.length && (
                    <span className="inline-block w-0.5 h-6 bg-coral-500 ml-1 animate-pulse align-middle" />
                  )}
                </div>
              )}

              {currentItem.imageUrl && (
                <div className="relative z-[1] shrink-0">
                  <div className="absolute inset-0 scale-110 rounded-[2rem] bg-peach-300/45 blur-3xl" />
                  <img
                    src={currentItem.imageUrl}
                    alt={currentItem.word}
                    className={cn(
                      'relative w-auto object-contain rounded-[2rem] border-[6px] border-white bg-white shadow-card',
                      isAlphabetRound ? 'h-[clamp(9rem,42vh,28rem)]' : 'h-[clamp(9rem,34vh,24rem)]'
                    )}
                  />
                </div>
              )}

              <div className="relative z-[1] flex min-w-0 flex-col items-center justify-center gap-[clamp(1rem,3vh,2.5rem)]">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                  {isAlphabetRound ? (
                    /* 🔴 **그림이 아니라 소리로 낸다**(2026-07-29) — 낱말을 들려주고 그 첫 글자를 넣는 게
                   파닉스다. 그림만 보고 고르면 영어 소리는 한 번도 안 듣고 끝난다. 그림은 무엇의
                   소리인지 알려주는 보조로 남긴다. */
                    <button
                      onClick={() => void sayWord()}
                      className="inline-flex items-center gap-3 rounded-full bg-white/80 px-5 py-3 text-lg font-black text-ink-700 shadow-soft sm:text-2xl"
                      aria-label={t('blockGame.listenFirstLetter')}
                    >
                      <span className="text-2xl sm:text-4xl">🔊</span>
                      {t('blockGame.listenFirstLetter')}
                    </button>
                  ) : (
                    <span className="font-display text-[clamp(3rem,6vw,7rem)] font-black tracking-wide text-ink-900 drop-shadow-sm">
                      {currentItem.word}
                    </span>
                  )}
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {Array.from({ length: letterCount }, (_, slot) => renderCell(slot))}
                  </div>
                </div>

                {/* 정답은 자동으로 확인한다. 아이가 현재 문제를 건너뛰거나 결과로 갈 수 있는 다음 버튼만 둔다. */}
                <button
                  onClick={handleNext}
                  disabled={isTutorialPlaying}
                  className={cn(
                    'min-h-[52px] rounded-2xl px-8 py-3 text-xl font-black transition-all shadow-card sm:min-h-[60px] sm:px-12 sm:text-2xl',
                    isTutorialPlaying
                      ? 'bg-ink-100 text-ink-900 cursor-not-allowed'
                      : 'bg-peach-500 hover:bg-peach-300 text-white'
                  )}
                >
                  {currentIndex + 1 < items.length ? t('blockGame.next') : t('blockGame.seeResult')}
                </button>
              </div>
            </div>
            {camera && (
              <div className={cn('min-h-0 w-full', twoCol ? 'flex-1' : 'flex-1')}>
                <BoardCameraPanel cam={cam} />
              </div>
            )}
          </div>

          {/* 🔴 실물 판에선 글자 판을 숨긴다 — 아이 손에 진짜 블록이 있다. */}
          {!camera && (
            <div className="mx-[clamp(0.75rem,2vw,2rem)] shrink-0 rounded-[2rem] border-2 border-white bg-white/65 px-3 py-3 shadow-soft backdrop-blur-sm sm:px-5 sm:py-4">
              <div className="flex items-center gap-3 sm:gap-5">
                <p className="shrink-0 rounded-full bg-ink-900 px-4 py-2 text-base font-black text-white sm:text-xl">
                  ABC
                </p>
                <div className="flex flex-1 flex-wrap justify-center gap-1.5 sm:gap-2">
                  {panelLetters.map(renderBlock)}
                </div>
              </div>
            </div>
          )}
          {/* 🔴 판 갈아타기 — 아이 손이 닿는 아래가 아니라 위(헤더 옆)에 두지 않는 이유는
            한글 쪽과 같은 자리를 지키기 위해서다. */}
          <div className="shrink-0 flex justify-end px-3 pb-2">
            <button
              onClick={() => {
                setCamera((v) => !v);
                setGrid(initGrid(currentItem.letters));
              }}
              className="min-h-[44px] px-4 rounded-full bg-white text-ink-700 font-black shadow-soft hover:shadow-pop transition"
            >
              {camera ? '🧩 화면 블록' : '📷 실물 블록'}
            </button>
          </div>
        </div>
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
      </Gate>
      <DragOverlay dropAnimation={null}>
        {draggedBlock && (
          <div className="flex h-24 w-20 rotate-3 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white shadow-pop ring-4 ring-coral-300">
            <span className="flex-1 flex items-center justify-center text-4xl font-black text-ink-900">
              {draggedBlock.char}
            </span>
            <div
              className={cn('h-2 w-full', draggedBlock.isVowel ? 'bg-coral-500' : 'bg-peach-500')}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export function EnglishBlockPlayer(props: GamePlayerProps) {
  return (
    <TutorialProvider>
      <EnglishBlockPlayerInner {...props} />
    </TutorialProvider>
  );
}
