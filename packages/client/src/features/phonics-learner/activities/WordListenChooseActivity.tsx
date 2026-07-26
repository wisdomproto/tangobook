import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';

export interface WordChoice {
  word: string;
  imageUrl: string;
  ttsUrl?: string;
}

interface Props {
  unitId: string;
  words: ReadonlyArray<WordChoice>;
  onMarkComplete: () => void;
  onBack: () => void;
}

/** 한 문제에 보여줄 그림 수 — 4~7세는 3장이 한눈에 들어오는 한계다. */
const CHOICES = 3;

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
 * 🔴 글자를 쓰지 않는다 — 아직 못 읽는 아이도 풀 수 있어야 하고, 그림만으로 규칙이 읽혀야 한다.
 */
export function WordListenChooseActivity({ unitId, words, onMarkComplete, onBack }: Props) {
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  usePhonicsTtsWarm(
    unitId,
    useMemo(() => words.map((w) => w.word), [words]),
    'word-listen'
  );

  // 문제 순서 — 단원 단어 전부를 한 번씩. 보기는 정답 + 같은 단원 다른 단어.
  const questions = useMemo(() => {
    const pool = words.slice(0, 8);
    return shuffle(pool).map((answer) => {
      const distractors = shuffle(pool.filter((w) => w.word !== answer.word)).slice(0, CHOICES - 1);
      return { answer, choices: shuffle([answer, ...distractors]) };
    });
  }, [words]);

  const [qIdx, setQIdx] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const wrongTimer = useRef<number | null>(null);

  const current = questions[qIdx];

  const say = useCallback(
    async (w: WordChoice, onEnded?: () => void) => {
      const url =
        w.ttsUrl ||
        (await resolveTtsUrl({
          text: w.word,
          language: 'korean',
          storybookId: unitId,
          identifierPrefix: 'word-listen',
        }));
      if (url) playAudio(url, onEnded);
      else onEnded?.();
    },
    [playAudio, unitId]
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
    (picked: WordChoice) => {
      if (done || !current || wrong) return;
      if (picked.word !== current.answer.word) {
        playFeedbackSound(false);
        setWrong(picked.word);
        wrongTimer.current = window.setTimeout(() => setWrong(null), 600);
        return;
      }
      const isLast = qIdx + 1 >= questions.length;
      if (isLast) setDone(true);
      // 🔴 TTS 끝난 뒤에 다음 단계 — setTimeout 으로 길이를 가정하지 않는다.
      say(picked, () => {
        if (isLast) {
          onMarkComplete();
          playCorrectSequence({ language: 'ko' });
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
              key={q.answer.word}
              className={[
                'w-3.5 h-3.5 rounded-full transition',
                i < qIdx || done ? 'bg-mint-500' : i === qIdx ? 'bg-coral-500' : 'bg-white',
              ].join(' ')}
            />
          ))}
        </div>

        {!done && (
          <>
            {/* 🔊 = 문제. 누르면 다시 들려준다 — 글자를 못 읽어도 이게 규칙이라는 걸 안다. */}
            <button
              onClick={() => say(current.answer)}
              aria-label="다시 듣기"
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-coral-500 text-white text-5xl sm:text-6xl shadow-pop hover:scale-[1.03] active:scale-[0.97] transition animate-pulse"
            >
              🔊
            </button>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-4xl px-2">
              {current.choices.map((c) => (
                <button
                  key={c.word}
                  onClick={() => handlePick(c)}
                  aria-label={c.word}
                  className={[
                    'relative w-[28%] sm:w-44 aspect-square rounded-3xl border-[6px] bg-white overflow-hidden shadow-soft transition',
                    wrong === c.word
                      ? 'border-coral-500 animate-shake'
                      : 'border-white hover:shadow-pop active:scale-[0.97]',
                  ].join(' ')}
                >
                  <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
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
