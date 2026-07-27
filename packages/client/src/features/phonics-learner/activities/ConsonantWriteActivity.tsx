import { useCallback, useMemo, useState } from 'react';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { buildBlendPairs, pickRandom } from '../lib/blend-pairs';

interface Props {
  unitId: string;
  consonant: string;
  /** 발음할 텍스트. 미지정이면 `consonant`. 받침은 홀로 소리 못 내 예시 음절('앙')을 읽는다. */
  soundText?: string;
  /** 자음 모드 — 붙일 모음들. 없으면 글자만 세 번 쓰는 옛 화면. */
  blendVowels?: ReadonlyArray<string>;
  /** 받침 모드 — 학습 받침과 붙일 초성들. */
  coda?: string;
  codaOnsets?: ReadonlyArray<string>;
  onComplete: () => void;
  onBack: () => void;
}

/** 몇 음절을 써볼지. 쓰기는 탭보다 훨씬 느려서 음절 만들기(10개)만큼 둘 수 없다. */
const SYLLABLES = 3;
/** 두 글자가 붙기까지의 거리 — 멀리 → 가까이 → 붙음. (음절 만들기와 같은 규칙) */
const GAPS = ['min(7vw, 8rem)', 'min(2vw, 2rem)', '0px'] as const;
/** 받침은 위·아래로 모인다(아+ㅇ=앙) — 세로라 높이 기준 값이 따로 필요하다. */
const CODA_GAPS = ['min(9vh, 5rem)', 'min(3vh, 1.5rem)', '0px'] as const;
/** 받침 모드의 두 칸 공통 폭 — 주어진 판과 쓰는 칸이 같은 크기여야 한 글자로 읽힌다. */
const CODA_TILE = 'w-[min(46vw,26vh)] max-w-52';
const WRITE_ROUNDS = 2; // 쓰는 라운드 수(멀리·가까이). 마지막 붙는 건 자동.

/**
 * 음절 써보기 액티비티 — 「음절 만들기」와 **같은 흐름을 손으로** 한다(2026-07-26 개편).
 *
 *   ① 멀리 떨어진 ㄱ · ㅏ — 반짝이는 칸에 ㄱ 을 쓰고, 다음 칸에 ㅏ 를 쓴다
 *   ② 가까워진 상태로 같은 두 번
 *   ③ 쓰지 않아도 스르륵 붙으며 `ㄱ ㅏ 가` 를 이어 읽는다
 *
 * 🔴 음절 수는 **3개**로 묶는다. 음절 만들기는 탭이라 10개가 1분이지만, 쓰기는 한 글자에 몇 초씩
 *    걸려서 10개면 40번을 쓰게 된다. 짝은 무작위로 뽑아 매번 다른 음절을 만난다.
 * 🔴 받침 단원도 같은 데이터(`buildBlendPairs`)를 쓴다 — `가` 를 쓰고 `ㅇ` 을 써서 `강` 을 만든다.
 * 🔴 TTS 는 콜백 체인 — 합쳐질 때 이어읽기 → 띵동 → 다음 음절.
 */
export function ConsonantWriteActivity({
  unitId,
  consonant,
  soundText,
  blendVowels,
  coda,
  codaOnsets,
  onComplete,
  onBack,
}: Props) {
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const prefix = 'consonant-write';

  const isCoda = !!coda;
  const pairs = useMemo(() => {
    const all = buildBlendPairs({ consonant, blendVowels, coda, codaOnsets });
    // 🔴 받침은 **받침 한 글자만** 쓰므로(앞 음절은 주어진다) 14개를 다 돌아도 금방이다.
    //    자음은 두 글자를 두 번씩 쓰느라 오래 걸려 무작위 3개만 뽑는다.
    return coda ? all : pickRandom(all, SYLLABLES);
  }, [consonant, blendVowels, coda, codaOnsets]);

  const [idx, setIdx] = useState(0);
  const [round, setRound] = useState(0);
  const [step, setStep] = useState<0 | 1>(0); // 지금 쓸 칸
  const [madeSet, setMade] = useState<ReadonlySet<number>>(() => new Set());
  const [completed, setCompleted] = useState(false);

  const pair = pairs[idx];
  // 받침은 한 번만 쓰면 합쳐진다 — 자음처럼 [멀리·가까이] 두 번 쓰지 않는다.
  const writeRounds = isCoda ? 1 : WRITE_ROUNDS;
  const merging = round >= writeRounds;

  const goTo = useCallback((i: number) => {
    setIdx(i);
    setRound(0);
    setStep(0);
  }, []);
  const say = soundText ?? consonant;

  usePhonicsTtsWarm(
    unitId,
    useMemo(
      () =>
        pairs.length
          ? pairs.flatMap((p) => [
              p.first,
              p.secondSound,
              `${p.first} ${p.secondSound} ${p.syllable}`,
            ])
          : [say],
      [pairs, say]
    ),
    prefix
  );

  const speak = useCallback(
    async (text: string, onEnded?: () => void) => {
      const url = await resolveTtsUrl({
        text,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: prefix,
      });
      if (url) playAudio(url, onEnded);
      else onEnded?.();
    },
    [unitId, playAudio]
  );

  const handleResult = useCallback(
    (passed: boolean) => {
      if (!passed || completed || merging || !pair) return;

      // 만든 음절을 기록하고 아직 안 만든 다음 것으로 (목록에서 건너뛰며 골랐을 수 있다).
      const finishSyllable = (read: string) => {
        const made = new Set(madeSet).add(idx);
        setMade(made);
        const isLast = made.size >= pairs.length;
        if (isLast) setCompleted(true);
        const advance = () => {
          if (isLast) {
            playCorrectSequence({ language: 'ko', onDone: onComplete });
            return;
          }
          const after = pairs.findIndex((_, i) => i > idx && !made.has(i));
          goTo(after >= 0 ? after : pairs.findIndex((_, i) => !made.has(i)));
        };
        speak(read, () => playAudio('/sounds/game/correct.mp3', advance));
      };

      // 🔴 받침은 **받침 한 칸만** 쓴다 — 앞 음절(가)은 이미 주어져 있고, 이 단원이 가르치는 건
      //    받침이다. 다 칠하면 합쳐진 음절(강)을 그대로 읽어준다.
      if (isCoda) {
        setRound(1);
        // 합쳐진 음절만 읽지 않고 **이어 읽는다**(나 · 으 · 낭) — 받침이 어떻게 붙어 그 소리가
        // 됐는지가 들려야 한다. 음절 만들기와 같은 형식.
        finishSyllable(`${pair.first} ${pair.secondSound} ${pair.syllable}`);
        return;
      }

      if (step === 0) {
        setStep(1);
        speak(pair.first);
        return;
      }

      const nextRound = round + 1;
      setStep(0);
      setRound(nextRound);
      if (nextRound < writeRounds) {
        speak(pair.secondSound);
        return;
      }
      finishSyllable(`${pair.first} ${pair.secondSound} ${pair.syllable}`);
    },
    [
      completed,
      merging,
      pair,
      step,
      round,
      idx,
      pairs,
      madeSet,
      isCoda,
      writeRounds,
      goTo,
      speak,
      playAudio,
      playCorrectSequence,
      onComplete,
    ]
  );

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

      {/* 오늘 써볼 음절 — 다 쓴 건 민트 + ✓. 아무거나 눌러 그것부터 할 수 있다(음절 만들기와 같다).
          🔴 진척은 `idx` 가 아니라 `madeSet` 으로 판단한다 — 건너뛰며 골랐을 때 앞의 안 한 것이
             '완료'로 보이면 안 된다. */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {pairs.map((p, i) => {
          const done = madeSet.has(i);
          return (
            <button
              key={p.syllable}
              onClick={() => !done && goTo(i)}
              disabled={done}
              aria-label={`${p.syllable} 쓰기`}
              className={[
                'w-11 h-11 sm:w-14 sm:h-14 rounded-2xl border-[3px] border-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-soft transition',
                done
                  ? 'bg-mint-500 text-white'
                  : i === idx
                    ? 'bg-coral-500 text-white ring-4 ring-coral-200'
                    : 'bg-white/80 text-ink-500 hover:shadow-pop active:scale-[0.97]',
              ].join(' ')}
            >
              {done ? '✓' : p.syllable}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-ink-900 text-center break-keep">
          {!pair ? (
            <>
              ✏️ <span className="text-coral-600">{consonant}</span> 을 세 번 따라써봐!
            </>
          ) : merging ? (
            <>
              두 글자가 만나서 <span className="text-coral-600">{pair.syllable}</span>!
            </>
          ) : isCoda ? (
            <>
              ✏️ 받침 <span className="text-coral-600">{pair.second}</span> 을 써서{' '}
              <span className="text-coral-600">{pair.syllable}</span> 을 만들어봐!
            </>
          ) : (
            <>
              ✏️ 반짝이는 칸에{' '}
              <span className="text-coral-600">{step === 0 ? pair.first : pair.second}</span> 써봐!
            </>
          )}
        </h2>

        {/* 짝이 없으면(모음·초성 정보 없는 단원) 예전처럼 글자 하나만 반복해서 쓴다. */}
        {!pair ? (
          <LetterFillCanvas
            key={`single-${round}`}
            letter={consonant}
            onResult={(ok) => {
              if (!ok) return;
              const next = round + 1;
              setRound(next);
              const done = next >= 3;
              if (done) setCompleted(true);
              speak(say, () =>
                playAudio('/sounds/game/correct.mp3', () => {
                  if (done) playCorrectSequence({ language: 'ko', onDone: onComplete });
                })
              );
            }}
            autoCheck
            threshold={0.95}
          />
        ) : (
          <div
            className={`flex items-center justify-center transition-all duration-500 ease-out ${
              coda ? 'flex-col' : ''
            }`}
            style={
              coda
                ? { rowGap: CODA_GAPS[Math.min(round, CODA_GAPS.length - 1)] }
                : { columnGap: GAPS[Math.min(round, GAPS.length - 1)] }
            }
          >
            {/* 🔴 대기 칸에 `shrink-0` 필수 — 없으면 캔버스가 자리를 차지하며 눌려 정사각이 깨진다(375px 에서 65×98). */}
            {merging ? (
              <div className="w-[60vw] h-[30vw] max-w-96 max-h-48 sm:w-96 sm:h-48 rounded-3xl border-[5px] border-mint-500 bg-mint-100 flex items-center justify-center font-black text-mint-700 text-6xl sm:text-8xl shadow-pop">
                {pair.syllable}
              </div>
            ) : isCoda ? (
              // 🔴 받침 모드 — 앞 음절(가)은 **주어진 판**으로 위에 두고, 아래 받침 칸만 캔버스다.
              //    이 단원이 가르치는 건 받침이라 `가` 까지 쓰게 하면 초점이 흐려진다.
              // 🔴 두 칸의 **폭을 같게** 묶는다(CODA_TILE). 캔버스는 자체 `max-w-sm`(384px)이라
              //    그냥 두면 주어진 판(176px)의 두 배가 되어, 위아래가 한 글자로 안 보인다.
              <>
                <div
                  className={`shrink-0 ${CODA_TILE} aspect-square rounded-3xl border-[5px] border-white bg-white/70 flex items-center justify-center font-black text-coral-400 text-5xl sm:text-7xl shadow-soft`}
                >
                  {pair.first}
                </div>
                <div className={`shrink-0 ${CODA_TILE}`}>
                  <LetterFillCanvas
                    key={`${pair.syllable}-coda`}
                    letter={pair.second}
                    onResult={handleResult}
                    autoCheck
                    threshold={0.95}
                  />
                </div>
              </>
            ) : (
              // 🔴 지금 쓸 칸만 캔버스로 살아 있고, 옆 칸은 글자를 보여주는 판이다.
              //    두 캔버스를 동시에 띄우면 375px 에서 한 칸이 140px 밑으로 내려가 쓸 수가 없다.
              [0, 1].map((which) => {
                const letter = which === 0 ? pair.first : pair.second;
                if (which === step) {
                  return (
                    <LetterFillCanvas
                      key={`${pair.syllable}-${round}-${which}`}
                      letter={letter}
                      onResult={handleResult}
                      autoCheck
                      threshold={0.95}
                    />
                  );
                }
                return (
                  <div
                    key={`${pair.syllable}-${which}-idle`}
                    className="shrink-0 w-[18vw] h-[18vw] max-w-44 max-h-44 sm:w-44 sm:h-44 rounded-3xl border-[5px] border-white bg-white/70 flex items-center justify-center font-black text-coral-400 text-4xl sm:text-7xl shadow-soft"
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
