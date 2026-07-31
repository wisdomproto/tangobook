import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhonicsEmbeddedProvider } from './ActivityShell';
import { ConsonantBlendListenActivity } from '../activities/ConsonantBlendListenActivity';
import { ConsonantWriteActivity } from '../activities/ConsonantWriteActivity';
import { KOREAN_UNIT_ACTIVITY_PLAN } from '../lib/korean-phonics-units';

/**
 * 블로그 글 안에서 **진짜 학습 활동을 직접 해보는** 상자.
 *
 * 🔴 웹앱이라 가능한 것 — 스크린샷을 넣는 대신 학습 화면과 **같은 컴포넌트**를 그대로 얹는다.
 *    글로 설명하기 가장 어려운 「두 글자가 합쳐지는 순간」을 독자가 손으로 만져 본다.
 * 🔴 활동 코드는 한 줄도 안 고쳤다 — 셸만 `PhonicsEmbeddedProvider` 로 상자 모드가 된다.
 *    (활동 13개에 prop 을 뚫으면 학습 화면이 조용히 망가진다.)
 * 🔴 진척 기록은 저절로 안 남는다 — `useLogEvent` 가 `profileId` 없으면 그냥 돌아간다.
 *    블로그 방문자는 계정이 없으므로 눌러도 조용하다(에러 아님).
 * ⚠️ 활동이 넘기는 `onBack`·`onComplete` 는 여기서 받는다. 돌아갈 데가 없으니 back 은 무시하고,
 *    완료하면 그 자리에 「이어서 하기」 CTA 를 띄운다.
 */
interface Props {
  unitId: string;
  /** 무엇을 해보게 할지. 기본은 음절 만들기 — 글로 가장 설명하기 어려운 활동이다. */
  activity?: 'blend' | 'write';
  /** 상자 제목. 없으면 활동에 맞는 기본 문구. */
  title?: string;
}

const DEFAULT_TITLE: Record<NonNullable<Props['activity']>, string> = {
  blend: '직접 해보세요 — 두 글자가 합쳐집니다',
  write: '직접 해보세요 — 손으로 써보기',
};

export function PhonicsTryIt({ unitId, activity = 'blend', title }: Props) {
  const [done, setDone] = useState(false);

  // 활동에 필요한 자음·모음은 **커리큘럼 plan 에서** 가져온다(블로그가 따로 들고 있지 않는다).
  const data = useMemo(() => {
    const plan = KOREAN_UNIT_ACTIVITY_PLAN[unitId];
    const kind = activity === 'blend' ? 'consonant-blend-listen' : 'consonant-write';
    const found = plan?.activities.find((a) => a.kind === kind);
    return found?.consonant ? { consonant: found.consonant, blendVowels: found.blendVowels } : null;
  }, [unitId, activity]);

  // 자음 단원이 아니면(모음·받침·복잡한 모음) 조용히 접는다 — 억지로 띄우면 빈 상자가 된다.
  if (!data) return null;

  const noop = () => {};

  return (
    <div className="my-7 overflow-hidden rounded-[26px] border border-coral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
        <span className="text-sm font-bold text-ink-800 break-keep">
          {title ?? DEFAULT_TITLE[activity]}
        </span>
        <span className="shrink-0 rounded-full bg-coral-50 px-3 py-1 text-[11px] font-bold text-coral-600">
          실제 학습 화면
        </span>
      </div>

      {/* 🔴 높이는 여기서 정한다 — 활동은 `h-full` 로 채우기만 한다. 세로가 모자라면 카드가
          찌그러지고, 너무 크면 글의 흐름이 끊긴다. 모바일 세로를 기준으로 잡은 값. */}
      <div className="relative h-[440px] w-full sm:h-[500px]">
        <PhonicsEmbeddedProvider value>
          {activity === 'blend' ? (
            <ConsonantBlendListenActivity
              unitId={unitId}
              consonant={data.consonant}
              blendVowels={data.blendVowels}
              onComplete={() => setDone(true)}
              onBack={noop}
            />
          ) : (
            <ConsonantWriteActivity
              unitId={unitId}
              consonant={data.consonant}
              onComplete={() => setDone(true)}
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
