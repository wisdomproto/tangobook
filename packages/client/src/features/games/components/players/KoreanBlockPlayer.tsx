import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type DragEvent as ReactDragEvent,
  type TouchEvent as ReactTouchEvent,
  type ReactNode,
} from 'react';
import { motion } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { KoreanBlockData } from '@tangobook/shared';
import { JUNGSUNG, composeHangul, decomposeWord } from '@tangobook/shared';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { GameHeader } from '../GameHeader';
import { GameResultScreen } from '../GameResultScreen';
import { MobileLandscapeGate } from '../MobileLandscapeGate';
import {
  TutorialProvider,
  useTutorialHighlight,
  useTutorialIsPlaying,
  useTutorialExpected,
  useTutorialNotify,
} from './KoreanBlockTutorial/KoreanBlockTutorial.context';
import { KoreanBlockTutorial } from './KoreanBlockTutorial/KoreanBlockTutorial';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useBlockDrag } from '../../hooks/useBlockDrag';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { phonicsApi } from '@/features/phonics/api/phonics.api';
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

// 게임 패널 노출 순서: 4-5세 학습용으로 reorder.
//  - 자음: 기본 14개 (ㄱ~ㅎ) → 쌍자음 5개 (ㄲ ㄸ ㅃ ㅆ ㅉ)
//  - 모음: 기본 10개 (ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ) → 어려운 11개 (ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ)
// CHOSUNG/JUNGSUNG (표준 순서) 은 hangul-utils 합성/분해에 그대로 사용. 여기 reorder 는 패널 노출만.
const CONSONANT_ORDER = [
  'ㄱ',
  'ㄴ',
  'ㄷ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅅ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
  'ㄲ',
  'ㄸ',
  'ㅃ',
  'ㅆ',
  'ㅉ',
] as const;
const VOWEL_ORDER = [
  'ㅏ',
  'ㅑ',
  'ㅓ',
  'ㅕ',
  'ㅗ',
  'ㅛ',
  'ㅜ',
  'ㅠ',
  'ㅡ',
  'ㅣ',
  'ㅐ',
  'ㅒ',
  'ㅔ',
  'ㅖ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅢ',
] as const;

const ALL_CONSONANTS: JamoBlock[] = CONSONANT_ORDER.map((ch, i) => ({
  id: `cho-${i}`,
  char: ch,
  jamoType: 'cho' as JamoType,
}));
const ALL_VOWELS: JamoBlock[] = VOWEL_ORDER.map((ch, i) => ({
  id: `jung-${i}`,
  char: ch,
  jamoType: 'jung' as JamoType,
}));
// 쉬움 (easy): 기본 자음 14 (ㄱ~ㅎ) + 기본 모음 10 (ㅏ~ㅣ) — 쌍자음/이중모음 X.
// 쉬움 단어 풀 자체가 score≤1.5 라 쌍자음·이중모음 미포함이므로 누락 자모 없음.
const EASY_CONSONANTS: JamoBlock[] = ALL_CONSONANTS.slice(0, 14);
const EASY_VOWELS: JamoBlock[] = ALL_VOWELS.slice(0, 10);

/**
 * 공간 위치 인식 파서 — 한글 음절의 시각적 배치 그대로 합성.
 *
 * 음절 시작 (cho) 위치별 모음 후보:
 *  A. 수평 모음: cho 의 **오른쪽** (r, c+1) — ㅏ/ㅑ/ㅓ/ㅕ/ㅐ/ㅒ/ㅔ/ㅖ/ㅣ. 예: 가, 나
 *  B. 수직 모음: cho 의 **아래** (r+1, c) — ㅗ/ㅛ/ㅜ/ㅠ/ㅡ. 예: 구, 누, 두
 *
 * 받침(jong) 후보 — 무조건 "아래" 만 인정 (인라인 받침 X):
 *  - 수평 모음의 경우: (a) cho 아래 (r+1,c) 또는 (b) jung 아래 (r+1,c+1)
 *  - 수직 모음의 경우: jung 아래 (r+2, c)
 *  인라인 (r, c+2) 위치의 자음은 다음 음절의 cho 로 취급.
 *
 * 자음·자음, 모음·모음 연속 X — 인접 동종은 별도 음절.
 *
 * 알고리즘: 위→아래, 좌→우 스캔. cho 발견 시 우측 (수평 모음) 우선 → 없으면 아래 (수직 모음) 시도.
 * 합성에 쓰인 셀은 다시 cho 로 처리되지 않게 mark.
 */
function parseSpatialKorean(grid: (string | null)[][]): string[] {
  const out: string[] = [];
  const used = new Set<string>(); // 'r-c' — jung/jong 으로 흡수된 셀
  for (let r = 0; r < grid.length; r++) {
    let c = 0;
    while (c < grid[r].length) {
      const choKey = `${r}-${c}`;
      if (used.has(choKey)) {
        c++;
        continue;
      }
      const cho = grid[r][c];
      if (!cho || isVowel(cho)) {
        c++;
        continue;
      }

      // (A) 수평 모음 — cho 의 우측
      const jungH = c + 1 < grid[r].length ? grid[r][c + 1] : null;
      if (jungH && isVowel(jungH) && !used.has(`${r}-${c + 1}`)) {
        let jong: string | null = null;
        const belowCho = r + 1 < grid.length ? grid[r + 1][c] : null;
        const belowJung = r + 1 < grid.length ? grid[r + 1][c + 1] : null;
        if (belowCho && !isVowel(belowCho) && !used.has(`${r + 1}-${c}`)) {
          jong = belowCho;
          used.add(`${r + 1}-${c}`);
        } else if (belowJung && !isVowel(belowJung) && !used.has(`${r + 1}-${c + 1}`)) {
          jong = belowJung;
          used.add(`${r + 1}-${c + 1}`);
        }
        const composed = composeHangul(cho, jungH, jong);
        if (composed) out.push(composed);
        c += 2;
        continue;
      }

      // (B) 수직 모음 — cho 의 아래
      const jungV = r + 1 < grid.length ? grid[r + 1][c] : null;
      if (jungV && isVowel(jungV) && !used.has(`${r + 1}-${c}`)) {
        used.add(`${r + 1}-${c}`);
        // 받침 후보: jung 아래 (r+2, c)
        let jong: string | null = null;
        const belowJungV = r + 2 < grid.length ? grid[r + 2][c] : null;
        if (belowJungV && !isVowel(belowJungV) && !used.has(`${r + 2}-${c}`)) {
          jong = belowJungV;
          used.add(`${r + 2}-${c}`);
        }
        const composed = composeHangul(cho, jungV, jong);
        if (composed) out.push(composed);
        c++;
        continue;
      }

      c++;
    }
  }
  return out;
}

// 3행 × 6열 고정 그리드 — 각 행이 1음절. 단어 음절 수 ≤ 3 가정.
const ROWS = 3;
const COLS = 6;

// 배경 일러스트 — public/images/games/korean-block-bg.png (없으면 gradient fallback).
const BG_IMAGE_URL = '/images/games/korean-block-bg.webp';

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

function KoreanBlockPlayerInner({
  storybookId,
  gameData,
  difficulty,
  onComplete: _onComplete,
  onBack,
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
  const [hintActive, setHintActive] = useState(false);
  const isPlaying = useTutorialIsPlaying();
  const { glowCell } = useTutorialHighlight();
  const expected = useTutorialExpected();
  const notifyPlacement = useTutorialNotify();
  const handleHintStart = useCallback(() => {
    if (hintActive || isPlaying) return;
    setHintActive(true);
  }, [hintActive, isPlaying]);
  const handleHintEnd = useCallback(() => {
    setHintActive(false);
  }, []);

  const currentItem = items[currentIndex];

  const initGrid = useCallback(
    () =>
      Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null as string | null)),
    []
  );

  const [grid, setGrid] = useState<(string | null)[][]>(() => initGrid());

  const { playAudio, playFeedbackSound } = useGameAudio();
  const { mapRef: phonicsMapRef, loading: phonicsLoading } = usePhonicsMap([
    'mod_korean',
    'mod_phonics',
  ]);
  const drag = useBlockDrag<JamoBlock>({
    createGhost: createKoreanGhost,
    ghostOffset: [24, 24],
  });

  // 그리드의 공간 위치(cho 왼쪽 / jung 오른쪽 / jong 아래)로 음절 인식 — 입력 순서 무관.
  const composedSyllables = useMemo(() => parseSpatialKorean(grid), [grid]);

  // 새로 추가된 음절만 TTS 재생.
  // phonics 라이브러리는 보통 CV 음절(가/나/다)만 → 받침 CVC(산/침)·다음절은 라이브러리 miss.
  // 라이브러리 로딩 중 (phonicsLoading) 일 때는 spinner overlay 가 인터랙션을 막고 있어 호출 X.
  // 로딩 완료 후 라이브러리 miss 면 Web Speech API(`speechSynthesis`) 로 ko-KR 폴백.
  const prevSyllablesRef = useRef<string[]>([]);
  useEffect(() => {
    if (phonicsLoading) return;
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
  }, [composedSyllables, playAudio, phonicsMapRef, phonicsLoading]);

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

  // 배치 시 "뾱" 효과음 — Web Audio 합성 (mp3 자산 불필요).
  // 음절 완성 시 phonics 음원이 별도로 재생되므로 tick 은 짧고 작게.
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
      // 1100 Hz → 600 Hz 짧은 하강 sweep ("뾱")
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
    (row: number, col: number, block: JamoBlock) => {
      if (grid[row][col] !== null) return;
      // 튜토리얼 wait 상태에서는 expected 와 일치하는 placement 만 허용 — 잘못된 placement 는 silently ignore
      if (expected !== null) {
        const matchesExpected =
          expected.jamo === block.char && expected.cell[0] === row && expected.cell[1] === col;
        if (!matchesExpected) return;
      }
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = block.char;
        return next;
      });
      setIsWrong(false);
      playPlacementTick();
      // 튜토리얼 진행 중이면 notifyPlacement — 일치 시 onCorrect callback 으로 advance
      notifyPlacement(block.char, [row, col]);
    },
    [grid, expected, notifyPlacement, playPlacementTick]
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
      // 효과음 즉시 — concat audio await 600ms+ 기다리지 않고 바로 반응.
      playFeedbackSound(true);
      // 한글 정책: phonics 음절 합성 우선 → 실패 시 ttsUrl 폴백.
      (async () => {
        let wordAudioUrl: string | undefined;
        try {
          const { audioUrl } = await phonicsApi.concatPhonicsAudio({
            text: currentItem.word,
            storybookId,
            identifier: `kblock-ko-${encodeURIComponent(currentItem.word)}`,
            language: 'korean',
          });
          wordAudioUrl = audioUrl;
        } catch {
          wordAudioUrl = currentItem.ttsUrl;
        }
        if (!wordAudioUrl) wordAudioUrl = currentItem.ttsUrl;
        if (wordAudioUrl) playAudio(wordAudioUrl);
        // 효과음 + TTS 들리는 시간 후 다음 round (TTS 있으면 1.7s, 없으면 0.9s)
        setTimeout(
          () => {
            if (currentIndex + 1 < items.length) {
              const nextIdx = currentIndex + 1;
              setCurrentIndex(nextIdx);
              setGrid(initGrid());
              setHasTriedThisRound(false);
              setRoundCorrect(false);
              setIsWrong(false);
              setHintActive(false);
            } else {
              setFinished(true);
            }
          },
          wordAudioUrl ? 1700 : 900
        );
      })();
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
    playAudio,
    playFeedbackSound,
    roundCorrect,
    storybookId,
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
    setHintActive(false);
  }, [initGrid]);

  if (finished) {
    return (
      <MobileLandscapeGate>
        <GameResultScreen
          storybookId={storybookId}
          score={score}
          total={items.length}
          onRestart={handleRestart}
          onBack={onBack}
        />
      </MobileLandscapeGate>
    );
  }

  return (
    <MobileLandscapeGate>
      {/* VocabularyStudyContent 의 motion.div(fixed inset-0) 가 어떤 이유로 viewport top 으로부터 ~32px 떨어진 위치에 렌더되어
        위쪽으로 뒷 페이지(헤더·표지)가 새어나옴. player 를 자체적으로 fixed inset-0 + z-[60] 로 바꿔서 viewport 0,0 부터 완전 덮음. */}
      <div
        className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-sky-200 via-cream-50 to-peach-100 overflow-hidden"
        style={{
          backgroundImage: `url(${BG_IMAGE_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="px-2 pt-2 shrink-0">
          <GameHeader title="한글 블록" current={score} total={items.length} onBack={onBack} />
        </div>

        {/* 파닉스 음원 로딩 overlay — 첫 진입 시 1-2초. 인터랙션 차단해서 무음/Web Speech 폴백 안 만나게. */}
        {phonicsLoading && (
          <div className="absolute inset-0 z-[65] flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="rounded-3xl bg-white shadow-pop px-10 py-8 sm:px-12 sm:py-10 flex flex-col items-center gap-4 border-2 border-coral-200">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[6px] border-coral-200 border-t-coral-500 animate-spin"
                aria-hidden
              />
              <p className="text-xl sm:text-2xl font-black text-ink-900 font-display">
                잠깐만 기다려 줘!
              </p>
              <p className="text-sm sm:text-base text-ink-500">소리 준비하는 중이에요...</p>
            </div>
          </div>
        )}

        {/* 메인 — 3 섹션 카드: (1) 타겟 단어+그림 / (2) 드롭존+확인·초기화 / (3) 자음·모음 패널 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-[clamp(0.5rem,1.75vh,2rem)] px-3 sm:px-4 py-[clamp(0.25rem,0.875vh,0.75rem)] min-h-0">
          {/* 섹션 1 — 타겟 단어 + 그림 (한 카드, 좌우 넓게) */}
          <section className="rounded-3xl bg-white/85 backdrop-blur-sm shadow-pop border-2 border-white px-[clamp(1.5rem,4vw,4rem)] py-[clamp(0.375rem,1.25vh,1rem)] flex items-center justify-center gap-[clamp(0.75rem,2vw,2.5rem)] shrink-0 w-full max-w-3xl">
            <h1
              className="font-display font-black leading-none whitespace-nowrap"
              style={{
                fontSize: 'clamp(2rem, min(9vw, 11vh), 8rem)',
                color: '#FF7A3C',
                WebkitTextStroke: 'clamp(2px, 0.5vh, 5px) white',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.08))',
                letterSpacing: '0.14em',
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
                  className="h-[clamp(2.5rem,9vh,6rem)] w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
                />
                <span className="absolute -top-1 -right-1 text-xl sm:text-2xl">✨</span>
              </div>
            )}
          </section>

          {/* 섹션 2 — 드롭존 + 확인/초기화 (한 카드) */}
          <section
            className={cn(
              'rounded-3xl bg-white/85 backdrop-blur-sm shadow-pop border-2 border-white px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.375rem,1.25vh,1rem)] flex flex-row items-center justify-center gap-[clamp(0.75rem,2vw,1.5rem)] shrink-0 transition-all',
              isWrong && 'ring-4 ring-danger/40 animate-shake bg-danger/10',
              roundCorrect &&
                'ring-[6px] ring-success/70 bg-success/20 shadow-[0_0_60px_rgba(34,197,94,0.45)] scale-[1.02]'
            )}
          >
            <div className="grid grid-rows-3 gap-[clamp(0.25rem,0.875vh,0.75rem)]">
              {Array.from({ length: ROWS }, (_, row) => (
                <div
                  key={row}
                  className="grid grid-cols-6 gap-[clamp(0.25rem,0.875vh,0.5rem)] p-0.5"
                >
                  {Array.from({ length: COLS }, (_, col) => {
                    const cellKey = `${row}-${col}`;
                    const char = grid[row][col];
                    const correct = roundCorrect && !!char;
                    const inner = char ? (
                      <span
                        className={cn(
                          'text-[clamp(1.25rem,3.5vh,2.25rem)] font-black',
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
                    const isGlowing =
                      glowCell !== null && glowCell[0] === row && glowCell[1] === col;
                    // wait phase: expected != null. 예상 셀만 drop 허용, 나머지는 dim.
                    const isExpectedCell =
                      expected !== null && expected.cell[0] === row && expected.cell[1] === col;
                    const cellDimmed = expected !== null && !isExpectedCell;
                    const cellInteractable = !isPlaying && !cellDimmed;
                    return (
                      <div
                        key={cellKey}
                        data-grid-cell={cellKey}
                        ref={drag.cellRef(cellKey)}
                        onDragOver={cellInteractable ? drag.handleDragOver : undefined}
                        onDrop={
                          cellInteractable ? (e) => drag.handleDrop(cellKey, e, onPlace) : undefined
                        }
                        onClick={() => cellInteractable && handleCellClick(row, col)}
                        className={cn(
                          'w-[clamp(2rem,5.5vh,4rem)] h-[clamp(2rem,5.5vh,4rem)]',
                          'rounded-2xl flex items-center justify-center select-none transition-all',
                          !cellInteractable
                            ? 'cursor-not-allowed'
                            : char
                              ? 'cursor-pointer'
                              : 'cursor-default',
                          char
                            ? 'bg-white shadow-soft border-2 border-cream-50'
                            : 'bg-peach-100/60 border-[3px] border-dashed border-peach-200',
                          cellInteractable &&
                            !char &&
                            'hover:border-coral-400 hover:bg-peach-100/80',
                          isGlowing && 'ring-4 ring-coral-400 scale-110 bg-coral-50/80',
                          cellDimmed && !isGlowing && 'opacity-40'
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
            <div className="flex flex-col gap-[clamp(0.25rem,1vh,0.75rem)] shrink-0">
              <button
                onClick={handleCheck}
                disabled={roundCorrect || isPlaying}
                className={cn(
                  'px-[clamp(1rem,2.5vw,2.5rem)] py-[clamp(0.5rem,2vh,1.5rem)] rounded-3xl text-[clamp(1.125rem,3vh,1.875rem)] font-black transition-all',
                  roundCorrect || isPlaying
                    ? 'bg-ink-100 text-ink-500 cursor-not-allowed'
                    : 'bg-gradient-to-b from-coral-400 to-coral-600 text-white shadow-pop hover:scale-105 active:scale-95'
                )}
              >
                확인
              </button>
              <button
                onClick={handleResetGrid}
                disabled={roundCorrect || isPlaying}
                title="블록 모두 비우기"
                className={cn(
                  'px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.25rem,0.875vh,0.625rem)] rounded-2xl text-[clamp(0.75rem,1.875vh,1.125rem)] font-bold transition-all flex items-center justify-center gap-1.5',
                  roundCorrect || isPlaying
                    ? 'bg-ink-100 text-ink-500 cursor-not-allowed'
                    : 'bg-white/95 text-ink-700 shadow-soft hover:bg-white hover:scale-105 active:scale-95'
                )}
              >
                <span aria-hidden>↺</span>
                <span>초기화</span>
              </button>
              {difficulty === 'easy' && (
                <button
                  onClick={handleHintStart}
                  disabled={hintActive || isPlaying || roundCorrect}
                  className="px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.25rem,0.875vh,0.625rem)] rounded-2xl text-[clamp(0.75rem,1.875vh,1.125rem)] font-black transition-all flex items-center justify-center gap-1.5 bg-gradient-to-b from-warn to-peach-500 text-white shadow-soft hover:shadow-pop hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span aria-hidden>🪄</span>
                  <span>도와줘</span>
                </button>
              )}
            </div>
          </section>

          {/* 섹션 3 — 자음·모음 패널 (가로 나란히, 각자 카드)
              쉬움은 기본 자모만 (쌍자음/이중모음 숨김). 보통/어려움은 전체 노출. */}
          <div className="flex flex-row gap-[clamp(0.5rem,1.5vh,1.25rem)] shrink-0">
            <BlockPanel title="자음" tone="consonant">
              {(difficulty === 'easy' ? EASY_CONSONANTS : ALL_CONSONANTS).map((b) => (
                <BlockTile key={b.id} block={b} drag={drag} onPlace={onPlace} />
              ))}
            </BlockPanel>
            <BlockPanel title="모음" tone="vowel">
              {(difficulty === 'easy' ? EASY_VOWELS : ALL_VOWELS).map((b) => (
                <BlockTile key={b.id} block={b} drag={drag} onPlace={onPlace} />
              ))}
            </BlockPanel>
          </div>
        </div>
      </div>
      <KoreanBlockTutorial word={currentItem.word} active={hintActive} onEnd={handleHintEnd} />
    </MobileLandscapeGate>
  );
}

export function KoreanBlockPlayer(props: GamePlayerProps) {
  return (
    <TutorialProvider>
      <KoreanBlockPlayerInner {...props} />
    </TutorialProvider>
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
    <div className="relative rounded-3xl bg-cream-50/95 shadow-pop px-[clamp(0.5rem,1.5vw,1rem)] pt-[clamp(0.5rem,2.5vh,1.75rem)] pb-[clamp(0.25rem,0.875vh,1rem)] border-2 border-dashed border-cream-50">
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
      <div className="grid grid-cols-10 gap-[clamp(0.25rem,0.75vh,0.5rem)]">{children}</div>
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
  const { popJamo } = useTutorialHighlight();
  const isPlaying = useTutorialIsPlaying();
  const expected = useTutorialExpected();
  const popping = popJamo === block.char;
  // wait phase: expected != null. 예상 자모만 활성, 나머지는 dim + 드래그 X.
  const dimmed = expected !== null && expected.jamo !== block.char;
  const interactable = !isPlaying && !dimmed;
  return (
    <motion.div
      data-jamo-tile={block.char}
      draggable={interactable}
      // framer-motion 의 onDrag* 시그니처는 PanInfo 기반 → HTML5 DragEvent 와 충돌.
      // 런타임은 정상 DragEvent 발생. 타입만 cast.
      onDragStart={((e: ReactDragEvent) => interactable && drag.handleDragStart(block, e)) as never}
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
        'w-[clamp(1.75rem,4.5vh,3rem)] h-[clamp(1.75rem,4.5vh,3rem)] rounded-xl flex items-center justify-center font-black text-[clamp(0.75rem,2.5vh,1.5rem)] select-none',
        interactable ? 'cursor-grab' : 'cursor-not-allowed',
        interactable && 'hover:scale-110 active:scale-95 active:cursor-grabbing',
        'shadow-md transition-all',
        popping && 'ring-4 ring-coral-300 shadow-pop',
        dimmed && 'opacity-30',
        vowel
          ? 'bg-gradient-to-b from-coral-400 to-coral-600 text-white'
          : 'bg-gradient-to-b from-warn to-peach-500 text-white'
      )}
      style={{
        textShadow: '0 2px 0 rgba(0,0,0,0.12)',
      }}
    >
      {block.char}
    </motion.div>
  );
}
