import { useCallback, useState } from 'react';
import { ConsonantBlendListenActivity } from './ConsonantBlendListenActivity';
import { ConsonantWriteActivity } from './ConsonantWriteActivity';
import { ActivityShell } from '../components/ActivityShell';

interface Props {
  unitId: string;
  /** 이 단원의 복잡한 모음들 (예: ㅐ·ㅔ). 하나를 고르면 그 모음의 자음 음절을 만든다/쓴다. */
  vowels: ReadonlyArray<{ vowel: string; syllable: string }>;
  /** 음절 앞에 붙일 자음들 (ㄱ~ㅎ). */
  blendConsonants: ReadonlyArray<string>;
  /** 고른 모음으로 무엇을 하나 — 탭으로 음절 만들기 / 손으로 음절 쓰기. */
  mode: 'listen' | 'write';
  onComplete: () => void;
  onBack: () => void;
}

/**
 * 복잡한 모음 음절 — **모음을 먼저 고르고**, 그 모음에 ㄱ~ㅎ 를 붙여 음절을 만들거나(듣기) 쓴다(쓰기).
 *
 * 🔴 왜 모음 선택이 앞에 오나(2026-07-30 사용자): 복잡한 모음 단원에 온 아이는 이미 자음을 배웠다.
 *    그래서 `애`·`에` 를 따로 익히는 대신, 곧바로 `개·게·내·네…` 음절로 넘어간다. 모음이 2~3개라
 *    한 번에 다 깔면 음절이 28~42개가 되므로, **모음별로 나눠** 한 세트씩 한다.
 * 🔴 **음절 만들기·쓰기 자체는 자음 단원과 같은 컴포넌트**다 — pair 가 `[자음]+[모음]→[음절]` 로
 *    모양이 같아서(`blend-pairs` 의 vowel 모드), TTS 체인·붙는 애니메이션·「반짝이는 칸에」 안내까지
 *    검증된 흐름을 그대로 물려받는다. 여기서 새로 만드는 건 **모음 선택 한 겹**뿐이다.
 * 🔴 **듣기·쓰기가 이 한 컴포넌트를 공유**한다(`mode`) — 모음 선택 UI 를 두 번 복사하지 않는다.
 */
export function VowelSyllablePickerActivity({
  unitId,
  vowels,
  blendConsonants,
  mode,
  onComplete,
  onBack,
}: Props) {
  const [picked, setPicked] = useState<string | null>(vowels.length === 1 ? vowels[0].vowel : null);
  const [made, setMade] = useState<ReadonlySet<string>>(() => new Set());

  const finish = useCallback(
    (v: string) => {
      const next = new Set(made);
      next.add(v);
      setMade(next);
      // 🔴 마지막 모음까지 다 하면 완료 — 아니면 선택 화면으로(그 모음은 민트로 표시된다).
      if (next.size >= vowels.length) onComplete();
      else setPicked(null);
    },
    [made, vowels.length, onComplete]
  );

  if (picked) {
    const common = {
      unitId,
      vowel: picked,
      blendConsonants,
      onComplete: () => finish(picked),
      // 음절 하는 중 뒤로 = 모음 선택으로(모음이 하나면 단원까지 나간다).
      onBack: () => (vowels.length > 1 ? setPicked(null) : onBack()),
    };
    return mode === 'listen' ? (
      <ConsonantBlendListenActivity {...common} />
    ) : (
      <ConsonantWriteActivity {...common} />
    );
  }

  return (
    <ActivityShell onBack={onBack}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 sm:gap-8">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-ink-900 text-center break-keep">
          {mode === 'listen' ? '어떤 모음으로 만들까?' : '어떤 모음을 써볼까?'}
        </h2>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {vowels.map((v) => {
            const done = made.has(v.vowel);
            return (
              <button
                key={v.vowel}
                onClick={() => setPicked(v.vowel)}
                className={[
                  'relative w-[30%] max-w-[11rem] lg:w-44 rounded-3xl border-[6px] aspect-square flex flex-col items-center justify-center gap-1 transition shadow-soft',
                  done
                    ? 'bg-mint-100 border-mint-500'
                    : 'bg-white border-white hover:shadow-pop active:scale-[0.97]',
                ].join(' ')}
                aria-label={v.syllable}
              >
                {done && (
                  <span
                    aria-hidden
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-mint-500 text-lg font-black text-white shadow-soft"
                  >
                    ✓
                  </span>
                )}
                <span
                  className={`text-8xl sm:text-9xl font-black leading-none ${done ? 'text-mint-600' : 'text-coral-600'}`}
                >
                  {v.vowel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </ActivityShell>
  );
}
