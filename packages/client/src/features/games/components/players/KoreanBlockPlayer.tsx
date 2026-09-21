import { useState, useCallback, useMemo, useRef, useEffect, Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { KoreanBlockData } from '@tangobook/shared';
import { JUNGSUNG, composeHangul, decomposeWord } from '@tangobook/shared';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { GameHeader } from '../GameHeader';
import { GameResultScreen } from '../GameResultScreen';
import { MobileLandscapeGate } from '../MobileLandscapeGate';
import { gameSafeAreaStyle } from '../../lib/game-safe-area';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useGameEntryGuide } from '../../hooks/useGameEntryGuide';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle } from '../GameStyleChip';
import {
  TangoBoard,
  toItems,
  canPlace,
  findNearestPlacement,
  type PlacedBlock,
} from './TangoBoard';
import { parseBoard } from '../../lib/tango-board/compose';
import { nextRot, shapeAt } from '../../lib/tango-board/blocks';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { resolveTtsUrl } from '@/features/tts';
import { storybookApi, useStorybook } from '@/features/storybook';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { cn } from '@/lib/cn';
import { ENTRY_GUIDE, voiceUrl } from '@/features/phonics-learner/hooks/useEntryGuide';
import { useBoardCamera } from '../../hooks/useBoardCamera';
import { useIsLandscape } from '../../hooks/useIsLandscape';
import { BoardCameraPanel } from './BoardCameraPanel';
import { ColoredHangulWord } from './ColoredHangulWord';

const JUNGSUNG_SET = new Set<string>(JUNGSUNG);
function isVowel(char: string) {
  return JUNGSUNG_SET.has(char);
}

// 게임 패널 노출 순서: 4-5세 학습용으로 reorder.
//  - 자음: 기본 14개 (ㄱ~ㅎ) → 쌍자음 5개 (ㄲ ㄸ ㅃ ㅆ ㅉ)
//  - 모음: 기본 10개 (ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ) → 어려운 11개 (ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ)
// CHOSUNG/JUNGSUNG (표준 순서) 은 hangul-utils 합성/분해에 그대로 사용. 여기 reorder 는 패널 노출만.

// 쉬움 (easy) 는 strip UI (`EasyOrderStrip`) 로 전환 — ALL_CONSONANTS/ALL_VOWELS 패널 사용 X.
// 보통/어려움 만 BlockPanel 사용. (이전 EASY_CONSONANTS/EASY_VOWELS slice 는 strip 도입으로 삭제)

// 배경 일러스트 — public/images/games/korean-block-bg.png (없으면 gradient fallback).
const BG_IMAGE_URL = '/images/games/korean-block-bg.webp';

function KoreanBlockPlayerInner({
  storybookId,
  gameData,
  difficulty: _difficulty,
  onComplete: _onComplete,
  onBack,
  initialInputMode = 'screen',
}: GamePlayerProps) {
  const { t } = useTranslation('games');
  const data = gameData as KoreanBlockData;
  // 방어 필터: 그리드(3×6)는 3음절까지만 배치 가능 — 서버 필터 이전에 생성된
  // 게임 데이터에 4음절(지느러미 등)이 남아 있으면 판이 안 만들어지므로 제외.
  const items = useMemo(() => {
    const fit = data.items.filter(
      (it) => [...(it.word ?? '')].filter((ch) => /[가-힣]/.test(ch)).length <= 3
    );
    return fit.length > 0 ? fit : data.items;
  }, [data.items]);

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
  const sceneStorybookId =
    currentItem.storybookId ?? (storybookId === '__random_pool__' ? undefined : storybookId);

  /**
   * 🔴 판이 실물 보드가 됐다(2026-09-02) — 글자마다 타일이 하나씩 있던 격자를 버리고,
   *    조각 16개를 **돌리고 붙여서** 글자를 만든다(ㄱ↻ㄴ, ㄱㄱ=ㄲ, ㅏㅣ=ㅐ).
   *    아래 로직은 전부 `composedSyllables` 만 보므로 여기 위쪽만 바뀌었다.
   */
  const [placed, setPlaced] = useState<PlacedBlock[]>([]);
  const [picked, setPicked] = useState<{ id: number; rotDeg: number } | null>(null);
  const uidRef = useRef(0);
  const clearBoard = useCallback(() => {
    setPlaced([]);
    setPicked(null);
  }, []);

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  // 🔴 진입 안내 음성 — "블록으로 단어를 만들어봐!" 한 번(사용자: 화면마다 멘트 통일).
  useGameEntryGuide(voiceUrl(ENTRY_GUIDE.blockMake), playAudio);
  // 정답 후 "그 단어가 나오는 동화 장면 + 나레이션" 리빌 (소스 동화책 있을 때만).
  const { data: fetchedSourceStorybook } = useStorybook(sceneStorybookId);
  const sourceStorybook =
    fetchedSourceStorybook?.id === sceneStorybookId ? fetchedSourceStorybook : undefined;
  // 정답 음성과 칭찬이 재생되는 동안 책 로딩이 끝나도 onDone이 최신 책을 보도록 ref로 유지한다.
  const sourceStorybookRef = useRef(sourceStorybook);
  sourceStorybookRef.current = sourceStorybook;
  const gameStyle = useGameStyle(sourceStorybook);
  const [scene, setScene] = useState<WordScene | null>(null);
  const { mapRef: phonicsMapRef, loading: phonicsLoading } = usePhonicsMap([
    'mod_korean',
    'mod_phonics',
  ]);
  // 게임 시작 게이트 = phonics 맵(음절→URL JSON) 로드만. 맵은 localStorage 캐시라 재진입 즉시.
  const audioReady = !phonicsLoading;
  /**
   * 🔴 **판이 둘이다 — 그 밖은 전부 같다.** 화면 판은 놓인 조각에서, 실물 판은 카메라에서
   *    음절을 받는다. 아래 로직(새 음절만 읽기 · 자동 정답 · 칭찬 · 장면 리빌 · 결과 · 리포트)은
   *    `composedSyllables` 한 줄만 보므로 여기서 갈리고 끝난다.
   */
  const [camera, setCamera] = useState(initialInputMode === 'camera');
  const cam = useBoardCamera({ set: 'ko', enabled: camera });
  const landscape = useIsLandscape();
  // 놓인 자리로 음절 인식 — 자음 오른쪽 세로모음 = 가로 조합, 아래 가로모음 = 세로 조합, 그 아래 = 받침.
  const boardSyllables = useMemo(() => parseBoard(toItems(placed)), [placed]);
  const camSyllables = useMemo(() => (cam.word ? [...cam.word] : []), [cam.word]);
  const composedSyllables = camera ? camSyllables : boardSyllables;
  const composedText = composedSyllables.join('');

  // 🔴 쉬움 모드(순서 strip)는 격자 칸에 자동 배치하는 방식이라 판과 맞지 않아 뺐다.
  //    판은 난이도가 하나다 — 조각을 고르고, 돌리고, 놓는다.

  // 블록을 놓아 새로 만들어진 음절 하나만 읽는다. 판 전체 읽기는 우측 `확인` 버튼이 담당한다.
  // phonics 라이브러리는 보통 CV 음절(가/나/다)만 → 받침 CVC(산/침)는 Web Speech API로 폴백.
  // 라이브러리 로딩 중 (phonicsLoading) 일 때는 spinner overlay 가 인터랙션을 막고 있어 호출 X.
  // 로딩 완료 후 라이브러리 miss 면 Web Speech API(`speechSynthesis`) 로 ko-KR 폴백.
  const prevSyllablesRef = useRef<string[]>([]);
  // 단어를 완성하는 마지막 음절 — 여기서 바로 읽지 않고 handleCheck 가
  // "마지막 글자 → 단어 → 칭찬" 체인의 첫 링크로 재생 (바로 재생하면 단어 발음이 끼어들어 잘림).
  const pendingLastSyllableRef = useRef<{ url?: string; text: string } | null>(null);
  useEffect(() => {
    if (phonicsLoading) return;
    const prev = prevSyllablesRef.current;
    const completesWord = composedText === currentItem.word && currentItem.word.length > 0;
    // 앞쪽에 새 음절을 놓으면 뒤 음절의 index도 함께 밀린다. 첫 차이를 골라 실제 새 음절만 읽는다.
    const changedIndex = composedSyllables.findIndex((syllable, index) => syllable !== prev[index]);
    if (changedIndex >= 0) {
      const changedSyllable = composedSyllables[changedIndex];
      const syllableUrl = phonicsMapRef.current.get(changedSyllable);
      if (completesWord) {
        // 정답은 기존 순서(마지막 음절 → 단어 → 칭찬)를 지킨다.
        pendingLastSyllableRef.current = { url: syllableUrl, text: changedSyllable };
      } else if (syllableUrl) {
        playAudio(syllableUrl);
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel(); // 빠른 연속 입력 시 큐 누적 방지
          const u = new SpeechSynthesisUtterance(changedSyllable);
          u.lang = 'ko-KR';
          u.rate = 0.9;
          window.speechSynthesis.speak(u);
        } catch {
          /* 미지원/차단 */
        }
      }
    }
    prevSyllablesRef.current = [...composedSyllables];
  }, [composedSyllables, composedText, playAudio, phonicsMapRef, phonicsLoading, currentItem.word]);

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

  const handlePlace = useCallback(
    (x: number, y: number, id: number, rotDeg: number) => {
      if (roundCorrect) return;
      if (!canPlace(placed, id, rotDeg, x, y)) return;
      setPlaced((prev) => [...prev, { uid: ++uidRef.current, id, rotDeg, x, y }]);
      setIsWrong(false);
      playPlacementTick();
    },
    [roundCorrect, placed, playPlacementTick]
  );

  /** 판 위 조각을 끌어서 다른 자리로. 겹치거나 판 밖이면 제자리에 둔다(자기 자신은 빼고 본다). */
  const handleMovePlaced = useCallback(
    (uid: number, x: number, y: number) => {
      if (roundCorrect) return;
      setPlaced((prev) => {
        const b = prev.find((o) => o.uid === uid);
        if (
          !b ||
          !canPlace(
            prev.filter((o) => o.uid !== uid),
            b.id,
            b.rotDeg,
            x,
            y
          )
        )
          return prev;
        return prev.map((o) => (o.uid === uid ? { ...o, x, y } : o));
      });
      setIsWrong(false);
      playPlacementTick();
    },
    [roundCorrect, playPlacementTick]
  );

  const handleRemovePlaced = useCallback(
    (uid: number) => {
      if (roundCorrect) return;
      setPlaced((prev) => prev.filter((b) => b.uid !== uid));
      setIsWrong(false);
    },
    [roundCorrect]
  );

  /** 판 위 조각 탭 = 중심을 유지해 돌리고, 가장자리에선 판 안으로 당겨 맞춘다. */
  const handleRotatePlaced = useCallback(
    (uid: number) => {
      if (roundCorrect) return;
      setPlaced((prev) =>
        prev.map((b) => {
          if (b.uid !== uid) return b;
          const rot = nextRot(b.id, b.rotDeg);
          const before = shapeAt(b.id, b.rotDeg);
          const after = shapeAt(b.id, rot);
          const others = prev.filter((o) => o.uid !== uid);
          const nearest = findNearestPlacement(
            others,
            b.id,
            rot,
            b.x + (before.w - after.w) / 2,
            b.y + (before.h - after.h) / 2
          );
          // 현재 중심에서 회전할 수 없으면 가장 가까운 빈자리로 옮겨 회전한다.
          return nearest ? { ...b, rotDeg: rot, ...nearest } : b;
        })
      );
      setIsWrong(false);
    },
    [roundCorrect]
  );

  /** 되돌리기 — 마지막에 놓은 조각을 집어 든다. 아이가 잘못 놓았을 때 쓰는 유일한 길. */
  const handleUndo = useCallback(() => {
    if (roundCorrect) return;
    setPlaced((prev) => prev.slice(0, -1));
    setIsWrong(false);
  }, [roundCorrect]);

  const handleResetGrid = useCallback(() => {
    if (roundCorrect) return;
    clearBoard();
    setIsWrong(false);
  }, [clearBoard, roundCorrect]);

  // 정답 자동 체크 — 사용자가 블록 배치 완성 시 "확인" 버튼 없이 정답 처리.
  // 오답 분기는 자동 발동 X (사용자가 확인 누를 때만 wrong 표시).
  useEffect(() => {
    if (roundCorrect) return;
    const composed = composedSyllables.join('');
    if (composed === currentItem.word && composed.length > 0) {
      handleCheckRef.current();
    }
  }, [composedSyllables, currentItem.word, roundCorrect]);

  // 다음 단어로 (장면 리빌 종료 포함). fromIndex = 방금 맞춘 단어 index.
  const goToNext = useCallback(
    (fromIndex: number) => {
      setScene(null);
      if (fromIndex + 1 < items.length) {
        setCurrentIndex(fromIndex + 1);
        clearBoard();
        setHasTriedThisRound(false);
        setRoundCorrect(false);
        setIsWrong(false);
      } else {
        setFinished(true);
      }
    },
    [items.length, clearBoard]
  );

  const handleCheck = useCallback(() => {
    if (roundCorrect) return;
    const composed = composedSyllables.join('');
    const allCorrect = composed === currentItem.word && composed.length > 0;
    if (allCorrect) {
      const isFirstTry = !hasTriedThisRound;
      // 4-5세 정책: 완성 = 성공. 중간에 한 번 틀렸다 고쳐도 완성하면 점수(다 맞추면 만점).
      // 정확도(첫 시도 여부)는 리포트용 correct 플래그로만 기록.
      setScore((s) => s + 1);
      wordResultsRef.current.push({ word: currentItem.word, correct: isFirstTry });
      setRoundCorrect(true);
      // 정답 시퀀스 (playCorrectSequence): 효과음 → 0.5s → 단어 발음 → 시스템 칭찬 음원 → onDone.
      // FeedbackOverlay (호리 cheering + confetti + "잘했어!") 가 praiseVisible 기반으로 표시.
      // 한글 정책: phonics 음절 합성 우선 → 실패 시 ttsUrl 폴백 (resolveTtsUrl).
      (async () => {
        // 마지막 음절 소리를 먼저 끝까지 재생 → 그 다음 단어 발음 → 칭찬 (체인).
        // 음절 소리는 즉시 재생(반응성), 단어 URL 은 그 사이 백그라운드로 resolve.
        const last = pendingLastSyllableRef.current;
        pendingLastSyllableRef.current = null;
        const wordUrlPromise = resolveTtsUrl({
          text: currentItem.word,
          language: 'korean',
          storybookId: sceneStorybookId,
          directUrl: currentItem.ttsUrl,
          identifierPrefix: 'kblock',
        });
        const playWord = async () => {
          const wordAudioUrl = await wordUrlPromise;
          playCorrectSequence({
            ttsUrl: wordAudioUrl,
            language: 'ko',
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
                  'ko',
                  book,
                  gameStyle.selectedStyle
                );
                if (s) setScene(s);
                else goToNext(currentIndex);
              })();
            },
          });
        };
        if (last?.url) {
          // 라이브러리 음절 mp3 → playAudio 가 ended/error/재생실패 모두에서 onEnded 호출 (안 멈춤).
          playAudio(last.url, () => void playWord());
        } else if (last && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          // 라이브러리 miss → speechSynthesis 로 음절 읽고 끝나면 단어. onend 미발화 대비 안전 타임아웃.
          let advanced = false;
          const go = () => {
            if (advanced) return;
            advanced = true;
            void playWord();
          };
          try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(last.text);
            u.lang = 'ko-KR';
            u.rate = 0.9;
            u.onend = go;
            u.onerror = go;
            window.speechSynthesis.speak(u);
            window.setTimeout(go, 1400);
          } catch {
            go();
          }
        } else {
          void playWord();
        }
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
    playAudio,
    playCorrectSequence,
    playFeedbackSound,
    roundCorrect,
    sceneStorybookId,
    goToNext,
    gameStyle.selectedStyle,
  ]);

  // ref 로 handleCheck 보관 — 정답 자동 체크 useEffect 가 stale closure 피하면서
  // composed 만 deps 로 가질 수 있게. render body 에서 직접 할당 (effect 로 하면
  // 자동 체크 effect 가 ref 갱신 effect 보다 위라 stale closure 호출 → 오답 처리됨).
  const handleCheckRef = useRef(handleCheck);
  handleCheckRef.current = handleCheck;

  const handleNext = useCallback(() => {
    goToNext(currentIndex);
  }, [currentIndex, goToNext]);

  const handleReadBoard = useCallback(async () => {
    if (!composedText) return;
    const audioUrl = await resolveTtsUrl({
      text: composedText,
      language: 'korean',
      storybookId: sceneStorybookId,
      identifierPrefix: 'kblock-board',
    });
    if (audioUrl) {
      playAudio(audioUrl);
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(composedText);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      /* 미지원/차단 */
    }
  }, [composedText, playAudio, sceneStorybookId]);

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
    clearBoard();
  }, [clearBoard]);

  /**
   * 🔴 **실물 모드에선 가로 강제 벽을 안 세운다.** 태블릿을 세로로 두든 가로로 두든 읽혀야 하는데
   *    「가로로 돌려주세요」 오버레이가 곧 그 반대다. 화면 판 모드는 조각을 끌어다 놓아야 해서
   *    가로가 필요하므로 그대로 둔다.
   */
  const Gate = camera ? Fragment : MobileLandscapeGate;
  /** 실물 + 가로 = 두 칸(삽화·낱말 ‖ 읽은 낱말). 그 밖에는 지금까지처럼 위아래로 쌓는다. */
  const twoCol = camera && landscape;

  if (finished) {
    return (
      <MobileLandscapeGate>
        <GameResultScreen
          storybookId={storybookId}
          score={score}
          total={items.length}
          lang="ko"
          onRestart={handleRestart}
          onBack={onBack}
        />
      </MobileLandscapeGate>
    );
  }

  return (
    <Gate>
      {/* VocabularyStudyContent 의 motion.div(fixed inset-0) 가 어떤 이유로 viewport top 으로부터 ~32px 떨어진 위치에 렌더되어
        위쪽으로 뒷 페이지(헤더·표지)가 새어나옴. player 를 자체적으로 fixed inset-0 + z-[60] 로 바꿔서 viewport 0,0 부터 완전 덮음. */}
      <div
        className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-sky-200 via-cream-50 to-peach-100 overflow-hidden"
        style={{
          backgroundImage: `url(${BG_IMAGE_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          ...gameSafeAreaStyle(),
        }}
      >
        <div className="px-2 pt-2 shrink-0">
          <GameHeader
            title={t('cards.block.labelKo')}
            current={score}
            total={items.length}
            onBack={onBack}
          />
        </div>

        {/* 오디오 로딩 overlay — 맵 + 이번 판 음절 mp3 + 단어 발음 프리워밍까지 대기.
            인터랙션 차단해서 첫 정답에 발음이 늦게 나오는(무음/Web Speech 폴백) 문제 방지. */}
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

        {/* 메인 — 3 섹션 세로 stack. 세로 비율 1.5:1.5:1 (flex-[3]:[3]:[2]). 가로 풀폭. */}
        {/* 🔴 **적응형은 방향이 정한다.** 세로면 위아래로 쌓고(삽화 → 낱말 → 읽은 낱말),
            가로면 좌우로 나눈다(삽화·낱말 ‖ 읽은 낱말). 폭(`sm:`)으로 가르면 안 된다 —
            태블릿은 세로로 세워도 `sm` 을 넘어서 세로인데 가로 배치를 받는다. */}
        <div
          className={cn(
            'flex-1 flex items-stretch gap-[clamp(0.5rem,1.25vh,1rem)] short:gap-1 px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.25rem,0.875vh,0.75rem)] short:py-0.5 min-h-0',
            twoCol ? 'flex-row' : 'flex-col'
          )}
        >
          {/* 섹션 1 — 타겟 단어 + 그림 hero. 세로 비중 2 (짧은 가로화면에서 자모 키보드에 공간 양보). */}
          {/* 🔴 짧은 화면에서는 이 줄이 판을 굶긴다 — 375px 높이에서 목표 단어·조합 표시·버튼이
              158px 을 먹고 판에 29px 만 남았다. `short:` 로 눌러 판에 넘긴다. */}
          {/* 🔴 두 칸이 되면 이 칸의 **안쪽도 세로로 쌓아야** 한다. 가로 배치를 그대로 두면 칸이
              절반으로 좁아진 채 글자 크기만 `12vw`(뷰포트 기준)라 삽화와 낱말이 칸 밖으로 나간다
              (실측 1024x768: 「아기」가 잘렸다). 글자도 칸 폭에 맞춰 줄인다. */}
          <section
            className={cn(
              'min-h-0 rounded-3xl bg-white/85 backdrop-blur-sm shadow-pop border-2 border-white px-[clamp(1.25rem,3vw,2.5rem)] py-[clamp(0.5rem,1.5vh,1.25rem)] short:py-1 flex items-center justify-center',
              twoCol
                ? 'flex-1 flex-col gap-[clamp(0.5rem,2vh,1.5rem)]'
                : 'flex-[2] shrink-0 short:flex-none gap-[clamp(1rem,3vw,3rem)]'
            )}
          >
            {currentItem.imageUrl && (
              <div className="relative shrink-0 short:hidden">
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.word}
                  className="h-[clamp(4.5rem,24vh,18rem)] w-[clamp(4.5rem,24vh,18rem)] object-cover rounded-3xl drop-shadow-[0_8px_12px_rgba(0,0,0,0.18)] border-[5px] border-white"
                />
                <span className="absolute -top-2 -right-2 text-3xl sm:text-4xl">✨</span>
              </div>
            )}
            {/* 🔴 짧은 화면(폰 가로)에서는 20vh 가 75px 이라 이 한 줄이 판을 굶긴다.
                `min()` 에 세로 상한을 하나 더 끼워 짧을 때만 작아지게 한다. */}
            <h1
              className="font-display font-black leading-none whitespace-nowrap"
              style={{
                fontSize: twoCol
                  ? 'clamp(1.75rem, min(7vw, 18vh), 8rem)'
                  : 'clamp(2.25rem, min(14vw, 24vh, 11vh + 1.5rem), 14rem)',
                color: '#FF7A3C',
                WebkitTextStroke: 'clamp(3px, 0.6vh, 6px) white',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.08))',
                letterSpacing: '0.14em',
              }}
            >
              <ColoredHangulWord
                word={roundCorrect ? currentItem.word.slice(0, typedChars) : currentItem.word}
              />
              {roundCorrect && typedChars < currentItem.word.length && (
                <span className="inline-block w-1.5 h-[0.7em] bg-coral-500 align-middle ml-2 animate-pulse" />
              )}
            </h1>
          </section>

          {/* 섹션 2 — 드롭존 화면 가운데. 전체 읽기와 다음은 판 오른쪽에 세로 배치. */}
          <section
            className={cn(
              'relative min-h-0 rounded-3xl bg-white/85 backdrop-blur-sm shadow-pop border-2 border-white px-[clamp(1.25rem,3vw,2.5rem)] py-[clamp(0.625rem,1.75vh,1.25rem)] flex flex-col transition-all',
              twoCol ? 'flex-1' : 'flex-[4]',
              isWrong && 'ring-4 ring-danger/40 animate-shake bg-danger/10',
              roundCorrect &&
                'ring-[6px] ring-success/70 bg-success/20 shadow-[0_0_60px_rgba(34,197,94,0.45)] scale-[1.02]'
            )}
          >
            {camera ? (
              <BoardCameraPanel cam={cam} />
            ) : (
              <TangoBoard
                placed={placed}
                picked={picked}
                onPick={setPicked}
                onPlace={handlePlace}
                onMovePlaced={handleMovePlaced}
                onRemovePlaced={handleRemovePlaced}
                onRotatePlaced={handleRotatePlaced}
                disabled={roundCorrect}
              />
            )}
            <div
              className={cn(
                'absolute z-20 flex flex-col gap-2 sm:gap-3',
                twoCol
                  ? 'right-2 top-2 sm:right-3 sm:top-3'
                  : 'right-[clamp(0.75rem,2vw,2rem)] top-1/2 -translate-y-1/2'
              )}
            >
              <button
                type="button"
                onClick={() => void handleReadBoard()}
                disabled={!composedText || roundCorrect}
                className={cn(
                  'bg-white text-peach-500 font-black shadow-pop border-2 border-peach-300 hover:-translate-y-0.5 hover:shadow-card transition disabled:opacity-40 disabled:translate-y-0',
                  twoCol
                    ? 'min-h-[52px] min-w-[6.5rem] px-4 rounded-2xl text-base'
                    : 'min-h-[64px] min-w-[8.25rem] px-6 rounded-3xl text-xl'
                )}
              >
                🔊 확인
              </button>
              <button
                type="button"
                onClick={handleNext}
                className={cn(
                  'bg-peach-500 text-white font-black shadow-pop hover:-translate-y-0.5 hover:bg-peach-300 transition',
                  twoCol
                    ? 'min-h-[52px] min-w-[6.5rem] px-4 rounded-2xl text-base'
                    : 'min-h-[64px] min-w-[8.25rem] px-6 rounded-3xl text-xl'
                )}
              >
                {currentIndex + 1 < items.length ? t('blockGame.next') : t('blockGame.seeResult')}
              </button>
            </div>
          </section>

          {/* 섹션 3 — 조작 안내 + 되돌리기/지우기. 판이 곧 트레이를 품고 있어 별도 패널이 없다. */}
          <div className="shrink-0 flex items-center justify-between gap-2 flex-wrap px-1">
            <span className="text-xs sm:text-sm font-bold text-ink-700 break-keep">
              {camera
                ? '판 위에 블록을 놓아 보세요'
                : picked
                  ? '판에 놓아요 · 놓인 조각을 누르면 돌아가요'
                  : '조각을 끌어다 놓아요 · 판 위 조각은 누르면 회전, 판 밖에 놓으면 삭제'}
            </span>
            <div className="flex gap-2">
              {/* 🔴 되돌리기·지우기는 실물 판에선 숨긴다 — 손으로 치우면 되므로 지울 게 없다. */}
              {!camera && (
                <>
                  <button
                    onClick={handleUndo}
                    disabled={roundCorrect || placed.length === 0}
                    className="min-h-[44px] px-4 rounded-full bg-white text-ink-700 font-black shadow-soft hover:shadow-pop transition disabled:opacity-40"
                  >
                    ↩ 되돌리기
                  </button>
                  <button
                    onClick={handleResetGrid}
                    disabled={roundCorrect || placed.length === 0}
                    className="min-h-[44px] px-4 rounded-full bg-white text-ink-700 font-black shadow-soft hover:shadow-pop transition disabled:opacity-40"
                  >
                    ↺ {t('blockGame.reset')}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setCamera((v) => !v);
                  clearBoard();
                }}
                className="min-h-[44px] px-4 rounded-full bg-white text-ink-700 font-black shadow-soft hover:shadow-pop transition"
              >
                {camera ? '🧩 화면 블록' : '📷 실물 블록'}
              </button>
            </div>
          </div>
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
  );
}

export function KoreanBlockPlayer(props: GamePlayerProps) {
  return <KoreanBlockPlayerInner {...props} />;
}

// ────────────────────────────────────────────────────────────────────────────
// 자음/모음 패널 + 타일
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// 쉬움 모드 — 순서 strip (드래그 X, 클릭으로 자동 배치)
// ────────────────────────────────────────────────────────────────────────────
