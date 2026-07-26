import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';

interface VowelItem {
  vowel: string; // 'ㅏ'
  syllable: string; // '아'
  /**
   * 발음할 텍스트. 미지정이면 `vowel` 을 그대로 읽는다.
   * 🔴 복습에서 받침 카드는 글자가 'ㅇ' 이어도 소리는 '앙' 이다 — 받침은 홀로 소리 낼 수 없다.
   */
  sound?: string;
}

interface Props {
  unitId: string;
  vowels: ReadonlyArray<VowelItem>;
  /** 발음·칭찬 언어. 복습에서 영어 알파벳을 읽힐 때 'english'. */
  language?: 'korean' | 'english';
  /** 진척만 마킹 — 자동 back 없음. activity 가 다시하기 / 돌아가기 UI 직접 노출. */
  onMarkComplete: () => void;
  onBack: () => void;
}

/**
 * 모음 듣기 액티비티.
 *
 * Phase 1 (sequential listen): 순서대로 활성된 모음 칸을 누르면 한글 phonics TTS 재생.
 *   다음 모음만 active. 모든 모음 다 누르면 칭찬 + 퀴즈 버튼 노출.
 *
 * Phase 2 (quiz, 듣고 맞추기): 랜덤 모음 음원 재생 → 6개 칸 중 정답 선택.
 *   모든 정답 맞추면 onMarkComplete (진척 마킹) — 자동 back 없음, 다시하기 버튼 노출.
 */
export function VowelListenActivity({
  unitId,
  vowels,
  language = 'korean',
  onMarkComplete,
  onBack,
}: Props) {
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  // 진입하자마자 6개 모음 발음을 백그라운드로 준비 — 첫 탭이 기다리지 않게.
  usePhonicsTtsWarm(
    unitId,
    vowels.map((v) => v.sound ?? v.vowel),
    'phonics-vowel'
  );

  const [phase, setPhase] = useState<'listen' | 'quiz' | 'done'>('listen');

  // Phase 1 — 순서 listen
  const [nextIdx, setNextIdx] = useState(0); // 다음 누를 모음 index
  const [listenedAll, setListenedAll] = useState(false);

  // Phase 2 — quiz
  const [quizQueue, setQuizQueue] = useState<number[]>([]); // 남은 정답 index
  const [quizCurrent, setQuizCurrent] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<'none' | 'wrong'>('none');
  // 이미 맞춘 모음 — 카드를 민트로 칠해 "몇 개 남았나"가 보이게 한다.
  const [solved, setSolved] = useState<ReadonlySet<number>>(() => new Set());
  const wrongAudioRef = useRef<number | null>(null);

  const playVowel = useCallback(
    async (vowel: string, onEnded?: () => void) => {
      const url = await resolveTtsUrl({
        text: vowel,
        language,
        storybookId: unitId,
        identifierPrefix: 'phonics-vowel',
      });
      if (url) playAudio(url, onEnded);
      else onEnded?.();
    },
    [playAudio, unitId, language]
  );

  const handleListenTap = useCallback(
    (idx: number) => {
      if (idx !== nextIdx) return; // 순서 강제
      if (idx + 1 >= vowels.length) {
        // 마지막 모음 — 음원이 다 재생된 후에야 칭찬 시작 (요 발음 잘리지 않게)
        playVowel(vowels[idx].sound ?? vowels[idx].vowel, () => {
          setListenedAll(true);
          playCorrectSequence({ language: language === 'english' ? 'en' : 'ko' });
        });
      } else {
        playVowel(vowels[idx].sound ?? vowels[idx].vowel);
        setNextIdx(idx + 1);
      }
    },
    [nextIdx, vowels, playVowel, playCorrectSequence]
  );

  // 듣기 단계 다시 시작 — 진행 초기화 (퀴즈 들어가기 전 한 번 더 들어보기용)
  const resetListen = useCallback(() => {
    setNextIdx(0);
    setListenedAll(false);
  }, []);

  // 퀴즈 시작 — 모음 index 들 셔플해서 queue 생성
  const startQuiz = useCallback(() => {
    const indices = vowels.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setQuizQueue(indices.slice(1));
    setQuizCurrent(indices[0]);
    setSolved(new Set());
    setPhase('quiz');
  }, [vowels]);

  // 퀴즈 음원 자동 재생 (current 변경 시 한번)
  useEffect(() => {
    if (phase !== 'quiz' || quizCurrent === null) return;
    playVowel(vowels[quizCurrent].sound ?? vowels[quizCurrent].vowel);
  }, [phase, quizCurrent, vowels, playVowel]);

  const handleQuizTap = useCallback(
    (idx: number) => {
      if (phase !== 'quiz' || quizCurrent === null) return;
      if (quizFeedback === 'wrong') return; // shake 중에는 무시
      if (idx === quizCurrent) {
        playFeedbackSound(true);
        setSolved((s) => new Set(s).add(idx));
        // 다음 문제로 진행
        if (quizQueue.length === 0) {
          // 퀴즈 끝 — 진척 마킹 + 칭찬. 자동 back 없음 — 다시하기 버튼 노출 ('done' phase).
          setPhase('done');
          onMarkComplete();
          playCorrectSequence({ language: language === 'english' ? 'en' : 'ko' });
        } else {
          const [next, ...rest] = quizQueue;
          setQuizQueue(rest);
          setQuizCurrent(next);
        }
      } else {
        playFeedbackSound(false);
        setQuizFeedback('wrong');
        const t = window.setTimeout(() => setQuizFeedback('none'), 600);
        wrongAudioRef.current = t;
      }
    },
    [
      phase,
      quizCurrent,
      quizQueue,
      quizFeedback,
      playFeedbackSound,
      playCorrectSequence,
      onMarkComplete,
    ]
  );

  // 처음부터 다시 — listen phase 재시작 (퀴즈 결과 화면에서도 호출 가능)
  const restartAll = useCallback(() => {
    setNextIdx(0);
    setListenedAll(false);
    setQuizQueue([]);
    setQuizCurrent(null);
    setQuizFeedback('none');
    setSolved(new Set());
    setPhase('listen');
  }, []);

  // unmount cleanup
  useEffect(
    () => () => {
      if (wrongAudioRef.current) clearTimeout(wrongAudioRef.current);
    },
    []
  );

  const isListenPhase = phase === 'listen';
  const promptText = useMemo(() => {
    if (isListenPhase && !listenedAll) return '순서대로 눌러봐!';
    if (isListenPhase && listenedAll) return '잘했어! 이제 퀴즈를 풀어볼까?';
    if (phase === 'quiz') return '🔊 들리는 소리를 골라봐!';
    return '모두 맞췄어!';
  }, [isListenPhase, listenedAll, phase]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 overflow-hidden"
      style={{
        backgroundImage: "url('/images/phonics/study-bg.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        ← 돌아가기
      </button>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-8">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-ink-900 text-center">
          {promptText}
        </h2>

        {/* 🔴 grid 는 칸 수가 고정이라 모음이 6개보다 적은 단원(ㅜㅠㅡㅣ 4개)에서 왼쪽으로 쏠렸다.
            개수와 무관하게 가운데 오도록 flex + justify-center. */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-5xl px-2">
          {vowels.map((v, i) => {
            // 듣기 단계: 다음 모음까지 활성. 다 들은 뒤 (listenedAll) 에는 6개 모두 다시 들을 수 있게 활성.
            const isUnlockedListen = isListenPhase && (listenedAll || i <= nextIdx);
            const active = isListenPhase && i === nextIdx && !listenedAll;
            const isClickable = (isListenPhase && isUnlockedListen) || phase === 'quiz';
            const isWrongTarget = phase === 'quiz' && quizFeedback === 'wrong';
            // 퀴즈에서 이미 맞춘 카드 = 민트. 마지막엔 6장이 다 민트가 되어 "다 맞췄다"가 보인다.
            const isSolved = !isListenPhase && solved.has(i);
            return (
              <button
                key={v.vowel}
                onClick={() =>
                  isListenPhase
                    ? handleListenTap(i)
                    : phase === 'quiz'
                      ? handleQuizTap(i)
                      : undefined
                }
                disabled={!isClickable}
                className={[
                  'relative w-[28%] lg:w-36 rounded-3xl border-[6px] aspect-[3/4] flex flex-col items-center justify-center px-2 py-3 transition shadow-soft',
                  isSolved
                    ? 'bg-mint-100 border-mint-500'
                    : active
                      ? 'bg-coral-100 border-coral-500 animate-pulse'
                      : isUnlockedListen || phase === 'quiz'
                        ? 'bg-white border-white hover:shadow-pop active:scale-[0.97]'
                        : 'bg-cream-100 border-cream-200 opacity-60 cursor-not-allowed',
                  isWrongTarget && phase === 'quiz' ? 'animate-shake' : '',
                ].join(' ')}
                aria-label={v.syllable}
                aria-pressed={isSolved || undefined}
              >
                {isSolved && (
                  <span
                    aria-hidden
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-mint-500 text-lg font-black text-white shadow-soft"
                  >
                    ✓
                  </span>
                )}
                {/* 모음 — 빨강, 맞춘 뒤엔 민트 (음절 앞 묵음 ㅇ 은 표기 안 함) */}
                <div
                  className={`text-8xl sm:text-9xl font-black leading-none ${isSolved ? 'text-mint-600' : 'text-coral-600'}`}
                >
                  {v.vowel}
                </div>
                <div
                  className={`text-lg sm:text-xl font-black mt-3 ${isSolved ? 'text-mint-600' : 'text-ink-500'}`}
                >
                  {v.syllable}
                </div>
              </button>
            );
          })}
        </div>

        {isListenPhase && listenedAll && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={resetListen}
              className="px-6 py-3 rounded-full bg-white border-2 border-coral-300 text-coral-600 font-black text-lg sm:text-xl shadow-soft hover:shadow-pop active:scale-[0.98] transition"
            >
              🔁 다시 해보기
            </button>
            <button
              onClick={startQuiz}
              className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl sm:text-3xl shadow-pop hover:scale-[1.02] active:scale-[0.98] transition"
            >
              🎯 퀴즈 시작!
            </button>
          </div>
        )}

        {phase === 'quiz' && quizCurrent !== null && (
          <button
            onClick={() => playVowel(vowels[quizCurrent].sound ?? vowels[quizCurrent].vowel)}
            className="px-6 py-3 rounded-full bg-white shadow-soft text-ink-700 font-black text-lg"
          >
            🔊 다시 듣기
          </button>
        )}

        {phase === 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={restartAll}
              className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl sm:text-3xl shadow-pop hover:scale-[1.02] active:scale-[0.98] transition"
            >
              🔁 다시 해보기
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-full bg-white border-2 border-ink-200 text-ink-700 font-black text-lg sm:text-xl shadow-soft hover:shadow-pop active:scale-[0.98] transition"
            >
              ← 돌아가기
            </button>
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
