import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhonicsEmbeddedProvider } from './ActivityShell';
import { ConsonantBlendListenActivity } from '../activities/ConsonantBlendListenActivity';
import { VowelSyllablePickerActivity } from '../activities/VowelSyllablePickerActivity';
import { VowelListenActivity } from '../activities/VowelListenActivity';
import { KOREAN_UNIT_ACTIVITY_PLAN } from '../lib/korean-phonics-units';

/**
 * 블로그 글 안에서 **진짜 학습 활동을 직접 해보는** 상자.
 *
 * 🔴 웹앱이라 가능한 것 — 스크린샷을 넣는 대신 학습 화면과 **같은 컴포넌트**를 그대로 얹는다.
 *    글로 설명하기 가장 어려운 「두 글자가 합쳐지는 순간」을 독자가 손으로 만져 본다.
 * 🔴 활동 코드는 한 줄도 안 고쳤다 — 셸만 `PhonicsEmbeddedProvider` 로 상자 모드가 된다.
 *    (활동 13개에 prop 을 뚫으면 학습 화면이 조용히 망가진다.)
 * 🔴 **레벨마다 「합쳐지는」 활동이 다르다**(2026-07-31). 자음 단원만 보고 만들었더니 32편 중
 *    19편(모음·받침·복잡한 모음)에 상자가 아예 안 떴다 — 절반이 넘는다. 네 갈래를 다 받는다.
 * 🔴 진척 기록은 저절로 안 남는다 — `useLogEvent` 가 `profileId` 없으면 그냥 돌아간다.
 *    블로그 방문자는 계정이 없으므로 눌러도 조용하다(에러 아님).
 * ⚠️ 활동이 넘기는 `onBack`·`onComplete` 는 여기서 받는다. 돌아갈 데가 없으니 back 은 무시한다.
 */
interface Props {
  unitId: string;
  /** 상자 제목. 없으면 활동 종류에 맞는 기본 문구. */
  title?: string;
}

/**
 * 그 단원의 「합쳐지는 순간」 활동을 plan 에서 찾는다 — 블로그가 자음·모음 목록을 따로 들지 않는다.
 * 🔴 순서가 곧 우선순위다. 한 단원에 둘 이상 있으면 앞엣것을 쓴다.
 */
type Pick =
  | { kind: 'consonant'; consonant: string; blendVowels?: readonly string[] }
  | { kind: 'coda'; coda: string; codaOnsets: readonly string[] }
  | {
      kind: 'vowel-blend';
      vowels: NonNullable<ReturnType<typeof vowelsOf>>;
      blendConsonants: readonly string[];
    }
  | { kind: 'vowel'; vowels: NonNullable<ReturnType<typeof vowelsOf>> };

const vowelsOf = (a: { vowels?: unknown }) =>
  a.vowels as { vowel: string; syllable: string; sound?: string }[] | undefined;

const TITLE: Record<Pick['kind'], string> = {
  consonant: '직접 해보세요 — 두 글자가 합쳐집니다',
  coda: '직접 해보세요 — 받침이 아래로 붙습니다',
  'vowel-blend': '직접 해보세요 — 모음을 고르고 자음을 붙입니다',
  vowel: '직접 해보세요 — 눌러서 소리를 들어보세요',
};

export function PhonicsTryIt({ unitId, title }: Props) {
  const [done, setDone] = useState(false);

  const pick = useMemo<Pick | null>(() => {
    const acts = KOREAN_UNIT_ACTIVITY_PLAN[unitId]?.activities ?? [];
    for (const a of acts) {
      if (a.kind === 'consonant-blend-listen' && a.consonant)
        return { kind: 'consonant', consonant: a.consonant, blendVowels: a.blendVowels };
      if (a.kind === 'coda-blend-listen' && a.coda && a.codaOnsets)
        return { kind: 'coda', coda: a.coda, codaOnsets: a.codaOnsets };
      if (a.kind === 'vowel-blend-listen' && vowelsOf(a) && a.blendConsonants)
        return { kind: 'vowel-blend', vowels: vowelsOf(a)!, blendConsonants: a.blendConsonants };
      if (a.kind === 'vowel-listen' && vowelsOf(a)) return { kind: 'vowel', vowels: vowelsOf(a)! };
    }
    return null;
  }, [unitId]);

  if (!pick) return null; // 해당 활동이 없는 단원은 조용히 접는다

  const noop = () => {};
  const finish = () => setDone(true);

  return (
    <div className="my-7 overflow-hidden rounded-[26px] border border-coral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
        <span className="text-sm font-bold text-ink-800 break-keep">
          {title ?? TITLE[pick.kind]}
        </span>
        <span className="shrink-0 rounded-full bg-coral-50 px-3 py-1 text-[11px] font-bold text-coral-600">
          실제 학습 화면
        </span>
      </div>

      {/* 🔴 높이는 여기서 정한다 — 활동은 `h-full` 로 채우기만 한다. 세로가 모자라면 카드가
          찌그러지고, 너무 크면 글의 흐름이 끊긴다. 모바일 세로를 기준으로 잡은 값. */}
      <div className="relative h-[440px] w-full sm:h-[500px]">
        <PhonicsEmbeddedProvider value>
          {pick.kind === 'consonant' && (
            <ConsonantBlendListenActivity
              unitId={unitId}
              consonant={pick.consonant}
              blendVowels={pick.blendVowels}
              onComplete={finish}
              onBack={noop}
            />
          )}
          {pick.kind === 'coda' && (
            <ConsonantBlendListenActivity
              unitId={unitId}
              coda={pick.coda}
              codaOnsets={pick.codaOnsets}
              onComplete={finish}
              onBack={noop}
            />
          )}
          {pick.kind === 'vowel-blend' && (
            <VowelSyllablePickerActivity
              unitId={unitId}
              vowels={pick.vowels}
              blendConsonants={pick.blendConsonants}
              mode="listen"
              onComplete={finish}
              onBack={noop}
            />
          )}
          {pick.kind === 'vowel' && (
            <VowelListenActivity
              unitId={unitId}
              vowels={pick.vowels}
              onMarkComplete={finish}
              onBack={noop}
            />
          )}
        </PhonicsEmbeddedProvider>
      </div>

      <div className="flex flex-col items-center gap-2 bg-cream-50 px-5 py-4 text-center">
        <p className="text-xs text-ink-500 break-keep">
          {done
            ? '다 하셨네요. 아이와 함께면 소리까지 들으며 할 수 있어요.'
            : '앱에서는 이 활동이 단원마다 네 가지씩 이어집니다.'}
        </p>
        <Link
          to={`/library/phonics/korean/${unitId}`}
          className="rounded-full bg-coral-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600"
        >
          앱에서 이어서 하기 →
        </Link>
      </div>
    </div>
  );
}
