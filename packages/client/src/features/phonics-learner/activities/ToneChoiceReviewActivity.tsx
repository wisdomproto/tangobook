import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivitySound } from '../hooks/useActivitySound';
import { useEntryGuide, ENTRY_GUIDE, praiseLang } from '../hooks/useEntryGuide';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { withTone } from '../lib/chinese-phonics-units';
import { ActivityShell } from '../components/ActivityShell';

interface Word {
  word: string; // 병음 (성조부호 포함)
  ttsUrl?: string; // 낱말 저작 녹음(mod_chinese 직행)
}

interface Props {
  unitId: string;
  words: ReadonlyArray<Word>;
  onMarkComplete: () => void;
  onBack: () => void;
}

/** 한 문항의 보기 = 그 낱말의 4성 변이(정답=원래 낱말). */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 🎵 복습 — 성조 듣고 고르기.
 *
 * 낱말 소리를 듣고 **그 낱말의 성조만 바꾼 4형**(māo·máo·mǎo·mào) 중 원래 낱말을 고른다.
 *
 * 🔴 왜 전용 컴포넌트인가: `WordListenChooseActivity` 는 보기 판을 카드 풀에서 **공유**해 문항마다
 *    같은 판을 쓴다. 성조 고르기는 **문항마다 보기가 다르다**(그 낱말의 4성 변이)라 그 모델과 안 맞는다.
 *    소리 체인·쉼·성공음은 공용 프리미티브(`useActivitySound`)로 지킨다 — 규칙을 복사하지 않는다.
 * 🔴 음원 프리워밍은 `useChineseReviewSources` 가 낱말 directUrl 을 이미 데운다 — 여기서 또 안 한다
 *    (텍스트 warm 은 concat 경로라 재생하는 직행 URL 과 안 맞는다).
 */
export function ToneChoiceReviewActivity({ unitId, words, onMarkComplete, onBack }: Props) {
  const { t } = useTranslation('phonics');
  const { say, rest, chime, playFeedbackSound, playCorrectSequence, praiseVisible, playAudio } =
    useActivitySound({ unitId, language: 'zh', prefix: 'tone-choice' });

  // 안내가 끝나야 첫 문항이 나간다("잘 듣고 맞춰봐!").
  const guiding = useEntryGuide(ENTRY_GUIDE.quiz, playAudio);

  const [qIdx, setQIdx] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [correct, setCorrect] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const wrongTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    []
  );

  const current = words[qIdx];
  // 보기 = 그 낱말의 4성 변이(정답 = 원래 낱말). 문항이 바뀔 때만 섞는다.
  const options = useMemo(
    () => (current ? shuffle([1, 2, 3, 4].map((n) => withTone(current.word, n))) : []),
    [current?.word]
  );

  /** 낱말 소리(directUrl 직행)를 읽는다. */
  const sayWord = useCallback(
    (w: Word, onEnded?: () => void) => void say(w.word, onEnded, w.ttsUrl),
    [say]
  );

  // 문항이 바뀌면 낱말을 자동으로 한 번 들려준다. 첫 문항은 안내가 끝난 뒤 + 쉼.
  // 🔴 `current` 신원이 아니라 **qIdx(내용)** 에 건다 — 호스트가 매 렌더 새 `words` 배열을 넘겨
  //    current 객체가 매번 바뀌므로, 신원에 걸면 자동재생이 렌더마다 겹친다(파닉스 단골 함정).
  const sayRef = useRef(sayWord);
  sayRef.current = sayWord;
  const currentRef = useRef(current);
  currentRef.current = current;
  const firstAskRef = useRef(true);
  useEffect(() => {
    if (guiding || done) return;
    const w = currentRef.current;
    if (!w) return;
    if (firstAskRef.current) {
      firstAskRef.current = false;
      rest(() => sayRef.current(w));
      return;
    }
    sayRef.current(w);
  }, [qIdx, guiding, done, rest]);

  const handlePick = useCallback(
    (label: string) => {
      if (done || guiding || wrong || correct || !current) return;
      if (label !== current.word) {
        playFeedbackSound(false);
        setWrong(label);
        wrongTimer.current = window.setTimeout(() => setWrong(null), 600);
        return;
      }
      setCorrect(label);
      const isLast = qIdx + 1 >= words.length;
      if (isLast) setDone(true);
      // 낱말 → 쉼 → (칭찬 · 마지막) 또는 (띵동 → 쉼 → 다음 문항).
      sayWord(current, () =>
        rest(() => {
          if (isLast) {
            onMarkComplete();
            playCorrectSequence({ language: praiseLang() });
            return;
          }
          chime(() =>
            rest(() => {
              setCorrect(null);
              setQIdx((i) => i + 1);
            })
          );
        })
      );
    },
    [
      done,
      guiding,
      wrong,
      correct,
      current,
      qIdx,
      words.length,
      sayWord,
      rest,
      chime,
      playFeedbackSound,
      playCorrectSequence,
      onMarkComplete,
    ]
  );

  const restart = useCallback(() => {
    firstAskRef.current = true;
    setQIdx(0);
    setWrong(null);
    setCorrect(null);
    setDone(false);
  }, []);

  if (!current) return null;

  return (
    <ActivityShell onBack={onBack}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5">
        <div className="flex flex-col items-center gap-3 min-h-[7rem] sm:min-h-[9rem] justify-center">
          {guiding ? (
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-coral-600 text-center break-keep animate-pulse">
              {t('common.listenCarefully')}
            </h2>
          ) : done ? (
            <p className="text-3xl sm:text-5xl font-black text-ink-900">{t('common.allCorrect')}</p>
          ) : (
            <>
              <div className="flex gap-2">
                {words.map((w, i) => (
                  <span
                    key={w.word}
                    className={[
                      'w-3.5 h-3.5 rounded-full transition',
                      i < qIdx ? 'bg-mint-500' : i === qIdx ? 'bg-coral-500' : 'bg-white',
                    ].join(' ')}
                  />
                ))}
              </div>
              <button
                onClick={() => sayWord(current)}
                aria-label={t('common.listenAgain')}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-coral-500 text-white text-4xl sm:text-5xl shadow-pop hover:scale-[1.03] active:scale-[0.97] transition animate-pulse"
              >
                🔊
              </button>
            </>
          )}
        </div>

        <div
          className="grid justify-center gap-4 sm:gap-6 px-2"
          style={{ gridTemplateColumns: 'repeat(2, max-content)' }}
        >
          {options.map((label) => (
            <button
              key={label}
              onClick={() => handlePick(label)}
              disabled={done || guiding || correct === label}
              aria-label={label}
              // 🔴 칸 크기는 폭·높이 둘 다 본다(전체화면 활동 공통 규칙).
              style={{ width: 'min(38vw, 22vh)' }}
              className={[
                'aspect-[3/2] rounded-3xl border-[6px] flex items-center justify-center font-black text-4xl sm:text-6xl break-keep leading-none transition',
                correct === label
                  ? 'border-mint-500 bg-mint-100 text-mint-700 ring-4 ring-mint-300 scale-[1.03]'
                  : wrong === label
                    ? 'border-coral-500 bg-white text-coral-600 animate-shake'
                    : 'border-white bg-white text-ink-900 hover:shadow-pop active:scale-[0.97]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {done && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={restart}
              className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl shadow-pop active:scale-[0.98] transition"
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
