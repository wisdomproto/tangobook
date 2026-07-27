import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { playUi } from '@/lib/uiSound';

export interface ListenChoice {
  /** 보기 라벨 — 단어(고기) 또는 알파벳(Aa) */
  label: string;
  /** 발음할 텍스트 */
  sound: string;
  /** 그림 (알파벳 단원은 없음) */
  imageUrl?: string;
  ttsUrl?: string;
}

interface Props {
  unitId: string;
  items: ReadonlyArray<ListenChoice>;
  /** 이 단원이 배우는 글자 — 문제 쪽에 함께 보여준다. */
  letter?: string;
  language?: 'korean' | 'english';
  /**
   * 판에 깔리는 카드 수 = 한 문제의 보기 수(탐색·퀴즈가 같은 판을 쓴다).
   *
   * 🔴 기본 **4** — 2×2 격자라 4가 딱 맞고, 단원 타겟 단어도 보통 4개다.
   *    3으로 두면 마지막 단어 하나가 통째로 안 나온다(받침 단원 '시장'이 그랬다).
   */
  choices?: number;
  /**
   * 퀴즈 전에 **탐색 화면**을 먼저 보여줄지. 카드를 눌러 소리를 들어보고 「퀴즈」 버튼으로 넘어간다.
   * 복습은 되짚는 자리라 바로 퀴즈로 들어가므로 기본값은 false.
   */
  exploreFirst?: boolean;
  onMarkComplete: () => void;
  onBack: () => void;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 🔊 듣고 고르기 — 단어 소리를 먼저 들려주고 그림을 고른다.
 *
 * 🔴 다른 학습 활동은 **누르면 소리가 나는** 탐색형이다. 여기만 소리가 먼저 오고 아이가 판단하므로
 *    "소리를 구별하는가"를 확인할 수 있는 유일한 활동이다.
 * 🔴 **보기에 단어를 쓴다** — 파닉스의 목표가 소리↔글자 연결이라 그림만 두면 글자가 학습에서 빠진다.
 *    문제 쪽엔 오늘의 글자만 두고 **정답 단어는 쓰지 않는다** (쓰면 듣지 않고 글자만 맞춰버린다).
 */
export function WordListenChooseActivity({
  unitId,
  items,
  letter,
  language = 'korean',
  choices = 4,
  exploreFirst = false,
  onMarkComplete,
  onBack,
}: Props) {
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  usePhonicsTtsWarm(
    unitId,
    useMemo(() => items.map((w) => w.sound), [items]),
    'word-listen'
  );

  /**
   * 화면에 깔리는 카드 — **탐색과 퀴즈가 같은 판**을 쓴다.
   *
   * 🔴 예전엔 퀴즈가 문제마다 보기를 새로 뽑아(3장) 격자·장수·자리가 통째로 바뀌었다.
   *    아이 입장에선 버튼 하나 눌렀는데 화면이 딴 데로 간 셈이라, 같은 2×2 를 유지하고
   *    **문제만** 바뀌게 한다. 자리는 퀴즈 시작 때 한 번만 섞어 문제마다 튀지 않게 한다.
   */
  const board = useMemo(() => items.slice(0, choices), [items, choices]);
  const quizBoard = useMemo(() => shuffle(board), [board]);
  // 문제 순서 — 판에 깔린 단어를 한 번씩.
  const questions = useMemo(() => shuffle(board).map((answer) => ({ answer })), [board]);

  const [exploring, setExploring] = useState(exploreFirst);
  const [qIdx, setQIdx] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const wrongTimer = useRef<number | null>(null);

  const current = questions[qIdx];

  const say = useCallback(
    async (w: ListenChoice, onEnded?: () => void) => {
      const url =
        w.ttsUrl ||
        (await resolveTtsUrl({
          text: w.sound,
          language,
          storybookId: unitId,
          identifierPrefix: 'word-listen',
        }));
      if (url) playAudio(url, onEnded);
      else onEnded?.();
    },
    [playAudio, unitId, language]
  );

  // 문제가 바뀌면 자동으로 한 번 들려준다 — 아이가 버튼을 찾아 누를 필요가 없게.
  useEffect(() => {
    if (exploring || done || !current) return;
    say(current.answer);
  }, [qIdx, exploring, done, current, say]);

  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    []
  );

  const handlePick = useCallback(
    (picked: ListenChoice) => {
      if (done || !current || wrong) return;
      if (picked.label !== current.answer.label) {
        playFeedbackSound(false);
        setWrong(picked.label);
        wrongTimer.current = window.setTimeout(() => setWrong(null), 600);
        return;
      }
      const isLast = qIdx + 1 >= questions.length;
      if (isLast) setDone(true);
      // 🔴 TTS 끝난 뒤에 다음 단계 — setTimeout 으로 길이를 가정하지 않는다.
      say(picked, () => {
        if (isLast) {
          onMarkComplete();
          playCorrectSequence({ language: language === 'english' ? 'en' : 'ko' });
        } else {
          playFeedbackSound(true);
          setQIdx((i) => i + 1);
        }
      });
    },
    [
      done,
      current,
      wrong,
      qIdx,
      questions.length,
      say,
      playFeedbackSound,
      playCorrectSequence,
      onMarkComplete,
    ]
  );

  /** 퀴즈 진입 — 시작 효과음으로 "지금부터 문제다"를 귀로도 알린다(화면은 거의 그대로라 더 필요하다). */
  const startQuiz = useCallback(() => {
    playUi('play');
    setExploring(false);
  }, []);

  const restart = useCallback(() => {
    setQIdx(0);
    setWrong(null);
    setDone(false);
    setExploring(exploreFirst);
  }, [exploreFirst]);

  if (!current) return null;

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

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5">
        {/* 🔎 탐색 — 눌러서 소리를 들어보고, 준비되면 퀴즈로.
            🔴 예전엔 들어오자마자 문제가 나왔다. 처음 보는 낱말을 소리만 듣고 고르라는 셈이라,
               먼저 만져보는 화면이 있어야 퀴즈가 "확인"이 된다(모음 듣기와 같은 순서). */}
        {/* 문제 줄 — 탐색이면 안내, 퀴즈면 [오늘의 글자 + 🔊]. 자리를 항상 차지해 격자가 위아래로 안 튄다. */}
        <div className="flex flex-col items-center gap-3 min-h-[7rem] sm:min-h-[9rem] justify-center">
          {exploring ? (
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-900 text-center break-keep">
              눌러서 들어봐!
            </h2>
          ) : done ? (
            <p className="text-3xl sm:text-5xl font-black text-ink-900">모두 맞췄어!</p>
          ) : (
            <>
              <div className="flex gap-2">
                {questions.map((q, i) => (
                  <span
                    key={q.answer.label}
                    className={[
                      'w-3.5 h-3.5 rounded-full transition',
                      i < qIdx ? 'bg-mint-500' : i === qIdx ? 'bg-coral-500' : 'bg-white',
                    ].join(' ')}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                {letter && (
                  <span className="text-5xl sm:text-7xl font-black text-coral-600 leading-none">
                    {letter}
                  </span>
                )}
                <button
                  onClick={() => say(current.answer)}
                  aria-label="다시 듣기"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-coral-500 text-white text-4xl sm:text-5xl shadow-pop hover:scale-[1.03] active:scale-[0.97] transition animate-pulse"
                >
                  🔊
                </button>
              </div>
            </>
          )}
        </div>

        {/* 🔴 카드 격자는 **탐색·퀴즈가 같은 것**을 쓴다 — 2×2 고정, 같은 크기, 같은 자리.
            예전엔 퀴즈가 보기를 따로 3장 뽑아 격자·장수·자리가 통째로 바뀌어, 버튼 하나 눌렀는데
            딴 화면으로 간 것처럼 보였다. 바뀌는 건 **문제와 클릭 동작뿐**이다. */}
        <div className="grid grid-cols-2 justify-center gap-4 sm:gap-6 w-full max-w-xl px-2">
          {(exploring ? board : quizBoard).map((c) => (
            <button
              key={c.label}
              onClick={() => (exploring ? say(c) : handlePick(c))}
              aria-label={c.label}
              disabled={done}
              className={[
                'relative w-full rounded-3xl border-[6px] bg-white overflow-hidden shadow-soft transition',
                wrong === c.label
                  ? 'border-coral-500 animate-shake'
                  : 'border-white hover:shadow-pop active:scale-[0.97]',
              ].join(' ')}
            >
              {/* 🔴 글자 단원(영어 Book 1 알파벳)은 그림 없이 글자만 — 아직 단어 철자를 읽을 단계가 아니다.
                  그 외 단원은 그림 + 단어. 파닉스라 소리↔글자를 잇는 게 학습 목표다. */}
              {c.imageUrl ? (
                <>
                  <img src={c.imageUrl} alt="" className="w-full aspect-square object-cover" />
                  <span className="block py-2 text-xl sm:text-3xl font-black text-ink-800 break-keep">
                    {c.label}
                  </span>
                </>
              ) : (
                // 🔴 글자 크기는 길이에 따라 — 좁은 화면에서 3글자를 큰 글꼴로 두면 두 줄로 접혀 잘린다.
                <span
                  className={[
                    'flex aspect-square items-center justify-center px-1 leading-none font-black text-coral-600 break-keep',
                    c.label.length >= 3 ? 'text-2xl sm:text-4xl' : 'text-5xl sm:text-7xl',
                  ].join(' ')}
                >
                  {c.label}
                </span>
              )}
            </button>
          ))}
        </div>

        {exploring && (
          // 🔴 "퀴즈" 만으론 무엇을 하는 버튼인지 알 수 없다 — 무슨 퀴즈인지 한 줄로 붙인다.
          <button
            onClick={startQuiz}
            className="px-10 py-4 rounded-full bg-coral-500 text-white shadow-pop active:scale-[0.98] transition flex flex-col items-center leading-tight"
          >
            <span className="font-black text-2xl sm:text-3xl">🎯 퀴즈</span>
            <span className="font-bold text-sm sm:text-base text-white/90 break-keep">
              듣고 맞춰보기
            </span>
          </button>
        )}

        {!exploring && done && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-3xl sm:text-5xl font-black text-ink-900">모두 맞췄어!</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={restart}
                className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl shadow-pop active:scale-[0.98] transition"
              >
                🔁 다시 해보기
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 rounded-full bg-white border-2 border-ink-200 text-ink-700 font-black text-lg shadow-soft active:scale-[0.98] transition"
              >
                ← 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
