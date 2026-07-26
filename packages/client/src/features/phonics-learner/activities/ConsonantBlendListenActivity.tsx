import { useCallback, useMemo, useState } from 'react';
import { composeHangul } from '@tangobook/shared';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';

interface Props {
  unitId: string;
  /** 자음 모드 — 학습 자음 (예: 'ㄱ'). coda 모드면 미지정. */
  consonant?: string;
  blendVowels?: ReadonlyArray<string>; // ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']
  /** 받침 모드 — 학습 받침 (예: 'ㅇ'). 지정되면 짝이 [가]+[ㅇ]→[강] 이 된다. */
  coda?: string;
  /** 받침 모드 — 받침을 붙일 음절의 초성 (중성은 ㅏ 고정). */
  codaOnsets?: ReadonlyArray<string>;
  onComplete: () => void;
  onBack: () => void;
}

/**
 * 두 글자가 붙기까지의 거리 — 멀리 → 가까이 → 붙음.
 * 🔴 Tailwind 클래스가 아니라 **인라인 스타일**로 준다. `gap-[18vw] sm:gap-56` 처럼 두 겹으로 쓰면
 *    어느 쪽이 이겼는지 브레이크포인트마다 확인해야 하고(실제로 375px 에서 값이 어긋나 보였다),
 *    `min()` 한 줄이면 화면 크기와 무관하게 같은 규칙이 된다.
 */
const GAPS = ['min(18vw, 14rem)', 'min(6vw, 4rem)', '0px'] as const;
const TAP_ROUNDS = 2; // 탭으로 진행하는 라운드 수(멀리·가까이). 마지막 붙는 건 자동.

/**
 * 음절 만들기 액티비티 — 자음 모드와 받침 모드 겸용.
 *
 * - 자음 모드 (한글1·3): [자음] + [모음] → [음절]   ㄱ + ㅏ → 가
 * - 받침 모드 (한글2):   [음절] + [받침] → [음절]   가 + ㅇ → 강
 *
 * 🔴 **한 번에 한 짝만, 두 글자가 가까워지다 합쳐진다**(2026-07-26 개편).
 *    예전엔 `[ㄱ][ㅏ][가]` 3칸짜리 행을 6~7줄 깔아두고 순서대로 누르게 했는데, 그러면 아이가 배우는 건
 *    "칸을 순서대로 누른다" 였다. 지금은 **거리가 좁혀지는 움직임**이 블렌딩 개념 자체를 보여준다:
 *      ① 멀리 떨어진 ㄱ · ㅏ — 반짝이는 쪽을 눌러 각각의 소리를 듣는다
 *      ② 가까워진 상태로 같은 2탭
 *      ③ 탭 없이 스르륵 붙으며 `ㄱ ㅏ 가` 를 이어 읽는다 — 합체는 **누르는 게 아니라 일어나는 일**
 *
 * 🔴 두 모드를 한 컴포넌트로 두는 이유 = TTS 체인(발음 끝난 뒤 띵동/칭찬)이 반복 버그 지점이라
 *    복사본을 만들면 고칠 곳이 두 군데가 된다.
 * 🔴 애니메이션과 소리를 `setTimeout` 으로 맞추지 않는다 — 합쳐지는 순간 이어읽기 TTS 를 바로 걸고,
 *    그 `onEnded` 로 띵동 → 다음 짝으로 넘어간다.
 */
export function ConsonantBlendListenActivity({
  unitId,
  consonant,
  blendVowels,
  coda,
  codaOnsets,
  onComplete,
  onBack,
}: Props) {
  const isCoda = !!coda;

  const pairs = useMemo(() => {
    if (coda) {
      return (codaOnsets ?? []).map((onset) => {
        const base = composeHangul(onset, 'ㅏ', null) || `${onset}ㅏ`;
        return {
          first: base,
          second: coda,
          syllable: composeHangul(onset, 'ㅏ', coda) || `${base}${coda}`,
        };
      });
    }
    const c = consonant ?? '';
    return (blendVowels ?? []).map((v) => ({
      first: c,
      second: v,
      syllable: composeHangul(c, v, null) || `${c}${v}`,
    }));
  }, [blendVowels, consonant, coda, codaOnsets]);

  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const prefix = isCoda ? 'coda-blend' : 'consonant-blend';

  // 낱글자 + 이어읽기까지 전부 데운다 — 합쳐지는 순간 무음이면 "정답 느낌"이 사라진다.
  usePhonicsTtsWarm(
    unitId,
    useMemo(
      () => pairs.flatMap((p) => [p.first, p.second, `${p.first} ${p.second} ${p.syllable}`]),
      [pairs]
    ),
    prefix
  );

  const [idx, setIdx] = useState(0); // 지금 만드는 짝
  const [round, setRound] = useState(0); // 0 멀리 · 1 가까이 · 2 붙음(자동)
  const [step, setStep] = useState(0); // 0 첫 글자 차례 · 1 둘째 글자 차례
  const [madeSet, setMade] = useState<ReadonlySet<number>>(() => new Set()); // 만들어 본 음절
  const [completed, setCompleted] = useState(false);

  /** 위 음절 목록에서 아무거나 골라 그것부터 할 수 있다 — 순서를 강제하지 않는다. */
  const goTo = useCallback((i: number) => {
    setIdx(i);
    setRound(0);
    setStep(0);
  }, []);

  const pair = pairs[idx];
  const merging = round >= TAP_ROUNDS;

  const say = useCallback(
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
    [unitId, prefix, playAudio]
  );

  const handleTap = useCallback(
    (which: 0 | 1) => {
      if (completed || merging || !pair || which !== step) return;
      const text = which === 0 ? pair.first : pair.second;

      if (which === 0) {
        setStep(1);
        say(text);
        return;
      }

      // 둘째 글자까지 눌렀다 — 다음 라운드로 좁히거나, 마지막이면 합친다.
      const nextRound = round + 1;
      setStep(0);
      setRound(nextRound);
      if (nextRound < TAP_ROUNDS) {
        say(text);
        return;
      }

      // 합체: 글자가 미끄러져 붙는 동안 `ㄱ ㅏ 가` 를 이어 읽고, 끝나면 띵동 → 다음 짝.
      const made = new Set(madeSet).add(idx);
      setMade(made);
      const isLast = made.size >= pairs.length;
      if (isLast) setCompleted(true);
      const advance = () => {
        if (isLast) {
          playCorrectSequence({ language: 'ko', onDone: onComplete });
          return;
        }
        // 🔴 idx+1 이 아니라 **아직 안 만든 다음 음절**로 — 목록에서 건너뛰며 골랐을 수 있다.
        //    뒤에 없으면 앞에서 찾는다. (isLast 가 아니므로 하나는 반드시 있다.)
        const after = pairs.findIndex((_, i) => i > idx && !made.has(i));
        goTo(after >= 0 ? after : pairs.findIndex((_, i) => !made.has(i)));
      };
      say(`${pair.first} ${pair.second} ${pair.syllable}`, () =>
        playAudio('/sounds/game/correct.mp3', advance)
      );
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
      goTo,
      say,
      playAudio,
      playCorrectSequence,
      onComplete,
    ]
  );

  if (!pair) return null;

  const tileClass = (which: 0 | 1) =>
    [
      'w-[26vw] h-[26vw] max-w-40 max-h-40 sm:w-40 sm:h-40 rounded-3xl border-[5px] flex items-center justify-center font-black text-coral-600 text-5xl sm:text-7xl shadow-soft transition',
      merging
        ? 'bg-mint-100 border-mint-500'
        : step === which
          ? 'bg-white border-coral-500 ring-4 ring-coral-200 animate-pulse'
          : 'bg-white/70 border-white',
    ].join(' ');

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

      {/* 만들 음절 목록 — 완료 표시 + 아무거나 눌러 그것부터. 진행 점을 대신한다(같은 정보를 두 번 두지 않는다). */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
        {pairs.map((p, i) => {
          const made = madeSet.has(i);
          return (
            <button
              key={p.syllable}
              onClick={() => goTo(i)}
              aria-label={`${p.syllable} 만들기${made ? ' (완료)' : ''}`}
              className={[
                'relative w-11 h-11 sm:w-14 sm:h-14 rounded-2xl border-[3px] font-black text-xl sm:text-2xl shadow-soft transition active:scale-[0.95]',
                i === idx
                  ? 'bg-coral-500 text-white border-white ring-4 ring-coral-200'
                  : made
                    ? 'bg-mint-500 text-white border-white'
                    : 'bg-white/80 text-ink-500 border-white',
              ].join(' ')}
            >
              {p.syllable}
              {made && i !== idx && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-mint-600 text-xs flex items-center justify-center ring-2 ring-mint-500">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-900 text-center break-keep">
          {merging ? (
            <>
              두 소리가 만나서 <span className="text-coral-600">{pair.syllable}</span>!
            </>
          ) : (
            '반짝이는 글자를 눌러봐!'
          )}
        </h2>

        {/* 두 글자 — 라운드가 오를수록 간격이 좁아지고, 마지막엔 붙어서 음절이 된다. */}
        <div
          className="flex items-center justify-center transition-all duration-500 ease-out"
          style={{ columnGap: GAPS[Math.min(round, GAPS.length - 1)] }}
        >
          {merging ? (
            <div className="w-[52vw] h-[26vw] max-w-80 max-h-40 sm:w-80 sm:h-40 rounded-3xl border-[5px] border-mint-500 bg-mint-100 flex items-center justify-center font-black text-mint-700 text-6xl sm:text-8xl shadow-pop">
              {pair.syllable}
            </div>
          ) : (
            <>
              <button onClick={() => handleTap(0)} className={tileClass(0)} aria-label={pair.first}>
                {pair.first}
              </button>
              <button
                onClick={() => handleTap(1)}
                className={tileClass(1)}
                aria-label={pair.second}
              >
                {pair.second}
              </button>
            </>
          )}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
