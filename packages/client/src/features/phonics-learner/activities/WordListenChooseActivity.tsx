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
   * 한 문제의 보기 수. 기본 3 — 4~7세가 **그림** 3장을 한눈에 훑는 한계다.
   * 복습은 보기가 글자·낱말(그림 없음)이라 눈이 덜 바빠 4개까지 쓴다.
   */
  choices?: number;
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
  choices = 3,
  onMarkComplete,
  onBack,
}: Props) {
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  usePhonicsTtsWarm(
    unitId,
    useMemo(() => items.map((w) => w.sound), [items]),
    'word-listen'
  );

  // 문제 순서 — 단원 단어 전부를 한 번씩. 보기는 정답 + 같은 단원 다른 단어.
  const questions = useMemo(() => {
    const pool = items.slice(0, 8);
    return shuffle(pool).map((answer) => {
      const distractors = shuffle(pool.filter((w) => w.label !== answer.label)).slice(
        0,
        choices - 1
      );
      return { answer, choices: shuffle([answer, ...distractors]) };
    });
  }, [items, choices]);

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
    if (done || !current) return;
    say(current.answer);
  }, [qIdx, done, current, say]);

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

  const restart = useCallback(() => {
    setQIdx(0);
    setWrong(null);
    setDone(false);
  }, []);

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
        {/* 진행 dots */}
        <div className="flex gap-2">
          {questions.map((q, i) => (
            <span
              key={q.answer.label}
              className={[
                'w-3.5 h-3.5 rounded-full transition',
                i < qIdx || done ? 'bg-mint-500' : i === qIdx ? 'bg-coral-500' : 'bg-white',
              ].join(' ')}
            />
          ))}
        </div>

        {!done && (
          <>
            {/* 문제 = 오늘의 글자 + 🔊. 누르면 다시 들려준다. 정답 단어는 여기 쓰지 않는다. */}
            <div className="flex items-center gap-4 sm:gap-6">
              {letter && (
                <span className="text-6xl sm:text-8xl font-black text-coral-600 leading-none">
                  {letter}
                </span>
              )}
              <button
                onClick={() => say(current.answer)}
                aria-label="다시 듣기"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-coral-500 text-white text-5xl sm:text-6xl shadow-pop hover:scale-[1.03] active:scale-[0.97] transition animate-pulse"
              >
                🔊
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-4xl px-2">
              {current.choices.map((c) => (
                <button
                  key={c.label}
                  onClick={() => handlePick(c)}
                  aria-label={c.label}
                  className={[
                    'relative w-[28%] sm:w-44 rounded-3xl border-[6px] bg-white overflow-hidden shadow-soft transition',
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
                    // 🔴 글자 크기는 길이에 따라 — 375px 에서 카드가 92px 인데 3글자를 72px 로 두면
                    //    두 줄로 접히고 `overflow-hidden` 에 잘린다(코코아·꼬끼오·스웨터).
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
          </>
        )}

        {done && (
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
