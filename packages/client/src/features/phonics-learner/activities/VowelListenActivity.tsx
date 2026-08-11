import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** 소리 사이 쉼 (ms). 콜백으로 끝을 확인한 뒤 넣는 것이라 길이 가정이 아니다. */
const REST_MS = 420;
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { useLogEvent } from '@/features/learning/hooks/useLogEvent';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { useEntryGuide, ENTRY_GUIDE, voiceUrl } from '../hooks/useEntryGuide';
import { ActivityShell } from '../components/ActivityShell';

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
  const { t } = useTranslation('phonics');
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  // 진입 안내 — 첫 단계 화면 문구 "순서대로 눌러봐!" 에 맞는 음성.
  useEntryGuide(ENTRY_GUIDE.orderListen, playAudio);
  const logEvent = useLogEvent();
  /**
   * 🔴 모음 퀴즈 판정을 남긴다 — 복잡한 모음 레벨(한글4)은 자음×모음 표가 없어서
   *    부모 리포트가 **이 이벤트로만** 채워진다. 영어 복습에서 이 컴포넌트를 재사용할 때는
   *    `vowel` 이 알파벳이라 한국어일 때만 남긴다.
   */
  const judgeVowel = useCallback(
    (correct: boolean, vowel: string) => {
      if (language !== 'korean') return;
      logEvent({
        type: correct ? 'syllable_correct' : 'syllable_wrong',
        storybookId: unitId,
        metadata: { source: 'phonics', unitId, lang: 'ko', vowel },
      });
    },
    [logEvent, language, unitId]
  );

  /** 다음 문제로 넘어가기 전 쉼 — 소리가 끝난 걸 확인한 뒤 넣는다. */
  const advanceRef = useRef<number | null>(null);
  /** 안내 음성이 나오는 동안 — 첫 문제는 그게 끝난 뒤에 낸다. */
  const [starting, setStarting] = useState(false);

  // 진입하자마자 6개 모음 발음을 백그라운드로 준비 — 첫 탭이 기다리지 않게.
  usePhonicsTtsWarm(
    unitId,
    vowels.map((v) => v.sound ?? v.vowel),
    'phonics-vowel',
    language
  );

  const [phase, setPhase] = useState<'listen' | 'quiz' | 'done'>('listen');

  // Phase 1 — 순서 listen
  const [nextIdx, setNextIdx] = useState(0); // 다음 누를 모음 index
  const [listenedAll, setListenedAll] = useState(false);

  // Phase 2 — quiz
  const [quizQueue, setQuizQueue] = useState<number[]>([]); // 남은 정답 index
  const [quizCurrent, setQuizCurrent] = useState<number | null>(null);
  // 🔴 "틀렸다"가 아니라 **어느 카드를 틀렸는지**를 담는다 — 예전엔 boolean 이라 오답 하나에
  //    화면의 카드가 전부 흔들려서, 아이가 무엇을 잘못 골랐는지 알 수 없었다.
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
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
      /**
       * 🔴 한 바퀴 돌고 나면 **자유놀이** — 아무 카드나 눌러 다시 듣는다(순서도 칭찬도 없다).
       *    예전엔 `nextIdx` 가 마지막에 멈춰 있어서, 다른 카드는 순서 검사에 걸려 **무음**이고
       *    마지막 카드만 완료 분기로 들어가 **칭찬이 다시 울렸다**. 카드는 이미 전부 눌러지게
       *    보이는데(`isUnlockedListen`) 동작이 안 따라온 것 — 보이는 대로 되어야 한다.
       */
      if (listenedAll) {
        playVowel(vowels[idx].sound ?? vowels[idx].vowel);
        return;
      }
      if (idx !== nextIdx) return; // 순서 강제 (첫 바퀴만)
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
    [listenedAll, nextIdx, vowels, playVowel, playCorrectSequence, language]
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
    // 🔴 첫 문제를 곧바로 내지 않는다 — 「퀴즈 시작」을 누른 순간 소리가 나면 아이는 그게
    //    문제인 줄도 모른 채 흘려듣는다. 안내 음성이 끝나고 쉰 뒤에 첫 문제.
    //    안내는 영어 단원에서도 한국어다(무엇을 하라는 말은 아이가 알아듣는 말이어야 한다).
    setStarting(true);
    playAudio(voiceUrl(ENTRY_GUIDE.quiz), () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
      advanceRef.current = window.setTimeout(() => setStarting(false), REST_MS);
    });
  }, [vowels, playAudio]);

  // 퀴즈 음원 자동 재생 (current 변경 시 한번)
  useEffect(() => {
    if (phase !== 'quiz' || starting || quizCurrent === null) return;
    playVowel(vowels[quizCurrent].sound ?? vowels[quizCurrent].vowel);
  }, [phase, starting, quizCurrent, vowels, playVowel]);

  const handleQuizTap = useCallback(
    (idx: number) => {
      if (phase !== 'quiz' || quizCurrent === null) return;
      if (starting) return; // 안내 음성 중에는 무시
      if (wrongIdx !== null) return; // shake 중에는 무시
      if (idx === quizCurrent) {
        judgeVowel(true, vowels[quizCurrent].vowel);
        setSolved((s) => new Set(s).add(idx));
        if (quizQueue.length === 0) {
          // 퀴즈 끝 — 진척 마킹 + 칭찬. 자동 back 없음 — 다시하기 버튼 노출 ('done' phase).
          playFeedbackSound(true);
          setPhase('done');
          onMarkComplete();
          playCorrectSequence({ language: language === 'english' ? 'en' : 'ko' });
        } else {
          // 🔴 띵동이 **끝난 뒤 쉬고** 다음 문제 — 예전엔 정답과 동시에 다음 음원이 나가서
          //    맞췄다는 느낌도 없이 문제가 지나갔다(콜백으로 끝을 확인하므로 길이 가정 아님).
          const [next, ...rest] = quizQueue;
          setQuizQueue(rest);
          playAudio('/sounds/game/correct.mp3', () => {
            if (advanceRef.current) clearTimeout(advanceRef.current);
            advanceRef.current = window.setTimeout(() => setQuizCurrent(next), REST_MS);
          });
        }
      } else {
        judgeVowel(false, vowels[quizCurrent].vowel);
        playFeedbackSound(false);
        setWrongIdx(idx);
        const timer = window.setTimeout(() => setWrongIdx(null), 600);
        wrongAudioRef.current = timer;
      }
    },
    [
      phase,
      starting,
      judgeVowel,
      vowels,
      quizCurrent,
      quizQueue,
      wrongIdx,
      playFeedbackSound,
      playCorrectSequence,
      playAudio,
      onMarkComplete,
    ]
  );

  // 처음부터 다시 — listen phase 재시작 (퀴즈 결과 화면에서도 호출 가능)
  const restartAll = useCallback(() => {
    setNextIdx(0);
    setListenedAll(false);
    setQuizQueue([]);
    setQuizCurrent(null);
    setWrongIdx(null);
    setSolved(new Set());
    setStarting(false);
    setPhase('listen');
  }, []);

  // unmount cleanup
  useEffect(
    () => () => {
      if (wrongAudioRef.current) clearTimeout(wrongAudioRef.current);
      if (advanceRef.current) clearTimeout(advanceRef.current);
    },
    []
  );

  const isListenPhase = phase === 'listen';
  const promptText = useMemo(() => {
    if (isListenPhase && !listenedAll) return t('vowelListen.inOrder');
    if (isListenPhase && listenedAll) return t('vowelListen.readyForQuiz');
    if (phase === 'quiz')
      return starting ? t('common.listenCarefully') : t('vowelListen.pickSound');
    return t('common.allCorrect');
  }, [isListenPhase, listenedAll, phase, starting, t]);

  return (
    <ActivityShell onBack={onBack} scroll>
      {/* 🔴 `gap-8` 고정 + `overflow-hidden` 이면 '모두 맞췄어!' 단계에서 버튼 줄이 늘면서 잘렸다. */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 sm:gap-6 lg:gap-8">
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
            const isWrongTarget = phase === 'quiz' && wrongIdx === i;
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
              {t('common.retry')}
            </button>
            <button
              onClick={startQuiz}
              className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl sm:text-3xl shadow-pop hover:scale-[1.02] active:scale-[0.98] transition"
            >
              {t('common.quizStart')}
            </button>
          </div>
        )}

        {phase === 'quiz' && !starting && quizCurrent !== null && (
          <button
            onClick={() => playVowel(vowels[quizCurrent].sound ?? vowels[quizCurrent].vowel)}
            className="px-6 py-3 rounded-full bg-white shadow-soft text-ink-700 font-black text-lg"
          >
            {t('common.listenAgainBtn')}
          </button>
        )}

        {phase === 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={restartAll}
              className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl sm:text-3xl shadow-pop hover:scale-[1.02] active:scale-[0.98] transition"
            >
              {t('common.retry')}
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-full bg-white border-2 border-ink-200 text-ink-700 font-black text-lg sm:text-xl shadow-soft hover:shadow-pop active:scale-[0.98] transition"
            >
              {t('common.back')}
            </button>
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
