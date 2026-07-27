import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';

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

/**
 * 소리와 소리 **사이의 쉼**(ms).
 *
 * 🔴 콜백 체인은 앞 소리가 끝나는 즉시 다음 소리를 낸다 — 실측 간격이 **1~3ms** 였다.
 *    안내가 끝나자마자 문제가 나오고, 단어가 끝나자마자 띵동이 붙어 한 덩어리로 들린다.
 *    말과 말 사이엔 숨 쉴 자리가 있어야 아이가 각각을 따로 알아듣는다.
 */
const REST_MS = 420;

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
  /** 퀴즈 안내 음성이 나오는 중 — 끝나야 첫 문제가 나간다. */
  const [starting, setStarting] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const wrongTimer = useRef<number | null>(null);
  const restTimer = useRef<number | null>(null);

  /** 소리가 **끝난 뒤** 잠깐 쉬고 다음으로 — 길이를 가정하는 게 아니라 사이를 벌리는 것이다. */
  const rest = useCallback((fn: () => void) => {
    restTimer.current = window.setTimeout(fn, REST_MS);
  }, []);

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
  // 🔴 단, 퀴즈 첫 문제는 **안내 음성이 끝난 뒤**(`starting`) 낸다 — 안 그러면 안내와 첫 문제가 겹친다.
  useEffect(() => {
    if (exploring || starting || done || !current) return;
    say(current.answer);
  }, [qIdx, exploring, starting, done, current, say]);

  // 나가는 도중 예약된 소리가 빈 화면에서 울리지 않게 둘 다 정리한다.
  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      if (restTimer.current) clearTimeout(restTimer.current);
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
      // 🔴 한 단계씩 **콜백으로** 잇는다 — setTimeout 으로 길이를 가정하지 않는다.
      //    정답 단어 → 띵동 → 다음 문제. 예전엔 띵동을 틀자마자 `setQIdx` 가 다음 문제 소리를
      //    내보내서, 단일 채널이라 **띵동이 곧바로 잘렸다**(이 프로젝트의 단골 버그).
      say(picked, () =>
        rest(() => {
          if (isLast) {
            onMarkComplete();
            playCorrectSequence({ language: language === 'english' ? 'en' : 'ko' });
            return;
          }
          playAudio('/sounds/game/correct.mp3', () => rest(() => setQIdx((i) => i + 1)));
        })
      );
    },
    [
      done,
      current,
      wrong,
      qIdx,
      questions.length,
      say,
      rest,
      playAudio,
      playFeedbackSound,
      playCorrectSequence,
      onMarkComplete,
      language,
    ]
  );

  /**
   * 퀴즈 진입 — **안내 음성을 다 듣고** 첫 문제가 나온다.
   *
   * 🔴 예전엔 버튼을 누르는 즉시 첫 문제 소리가 나서, 아이가 마음의 준비를 하기도 전에 지나갔다.
   *    화면이 탐색과 거의 같아서(같은 판을 쓴다) 더 그랬다 — "지금부터 문제다"를 귀로 알려야 한다.
   * 🔴 문장은 concat 으로 못 만든다(음절을 이어 붙이면 글자를 하나씩 읽는 소리가 된다).
   *    Gemini TTS 로 한 번 구워 `public/sounds/voice/` 에 둔 정적 자산이다
   *    (`server/scripts/generate-activity-voice-prompts.mjs`, 문구를 바꾸면 재실행).
   */
  const startQuiz = useCallback(() => {
    setExploring(false);
    setStarting(true);
    // 🔴 안내는 **영어 단원에서도 한국어**다. `language` 는 배우는 내용의 언어일 뿐이고,
    //    "무엇을 하라"는 말은 아이가 알아듣는 말이어야 한다 — 파닉스 화면의 글자도 전부 한국어다
    //    ('ABC 배우기'·'단어 연습'). 영어 UI 로케일이 생기면 그때 `quiz-start-en.mp3` 로 가른다.
    playAudio('/sounds/voice/quiz-start-ko.mp3', () => rest(() => setStarting(false)));
  }, [playAudio, rest]);

  const restart = useCallback(() => {
    setQIdx(0);
    setWrong(null);
    setDone(false);
    setStarting(false);
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
          ) : starting ? (
            // 안내 음성이 나오는 동안 같은 문구를 화면에도 — 소리를 못 듣는 상황에서도 전달된다.
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-coral-600 text-center break-keep animate-pulse">
              🎧 잘 듣고 맞춰봐!
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
              // 🔴 탭음을 여기서 내지 않는다 — `GlobalUiSound` 위임 리스너가 **모든 버튼에 자동**으로
              //    붙인다. 직접 부르면 한 번 눌렀는데 두 번 난다(내가 낸 버그).
              onClick={() => (exploring ? say(c) : handlePick(c))}
              aria-label={c.label}
              // 안내 음성 중엔 못 누른다 — 문제를 듣기도 전에 찍고 지나가는 걸 막는다.
              disabled={done || starting}
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
