import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhonicsEmbeddedProvider } from './ActivityShell';
import { KoreanPhonicsActivity } from './KoreanPhonicsActivityPage';
import { getActivityPlan } from '../lib/korean-phonics-units';

/**
 * 블로그·랜딩 안에서 **진짜 학습 활동을 직접 해보는** 상자.
 *
 * 🔴 웹앱이라 가능한 것 — 스크린샷을 넣는 대신 학습 화면과 **같은 컴포넌트**를 그대로 얹는다.
 *    글로 설명하기 가장 어려운 「두 글자가 합쳐지는 순간」을 독자가 손으로 만져 본다.
 * 🔴 **활동 배선을 여기서 다시 하지 않는다**(2026-08-01). 예전엔 이 파일이 활동 4종을 직접
 *    골라 마운트했는데, 그러면 나머지 다섯(배우기·써보기·사냥·게임 4종)은 영영 못 넣고
 *    호스트가 고쳐질 때마다 갈라진다. 이제 호스트(`KoreanPhonicsActivity`)를 그대로 부르므로
 *    **plan 에 있는 활동은 뭐든 돈다**.
 * 🔴 활동 코드는 한 줄도 안 고쳤다 — 셸만 `PhonicsEmbeddedProvider` 로 상자 모드가 된다.
 *    (활동 13개에 prop 을 뚫으면 학습 화면이 조용히 망가진다.)
 * 🔴 진척 기록은 저절로 안 남는다 — `useLogEvent` 가 `profileId` 없으면 그냥 돌아간다.
 *    방문자는 계정이 없으므로 눌러도 조용하다(에러 아님).
 * ⚠️ 호스트는 활동을 마치면 `onExit` 을 부른다. 상자엔 돌아갈 데가 없으니 무시하고,
 *    대신 아래 CTA 문구만 바꾼다.
 */
interface Props {
  unitId: string;
  /** plan 의 활동 key. 없으면 그 단원의 「합쳐지는 순간」 활동을 자동으로 고른다. */
  activityKey?: string;
  /** 상자 제목. 없으면 활동 제목을 그대로 쓴다. */
  title?: string;
  /** 상자 높이 — 격자가 큰 게임은 더 필요하다. */
  height?: number;
}

/** 「합쳐지는 순간」 = 이 단원을 한 장면으로 보여주는 활동. 레벨마다 kind 가 다르다. */
const BLEND_KINDS = [
  'consonant-blend-listen',
  'coda-blend-listen',
  'vowel-blend-listen',
  'vowel-listen',
];

export function PhonicsTryIt({ unitId, activityKey, title, height }: Props) {
  const [done, setDone] = useState(false);

  const plan = getActivityPlan(unitId);
  const activity = activityKey
    ? plan.activities.find((a) => a.key === activityKey)
    : plan.activities.find((a) => BLEND_KINDS.includes(a.kind));

  if (!activity) return null; // 없는 활동은 조용히 접는다

  return (
    <div className="my-7 overflow-hidden rounded-[26px] border border-coral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
        <span className="text-sm font-bold text-ink-800 break-keep">
          {title ?? `${activity.emoji} ${activity.title}`}
        </span>
        <span className="shrink-0 rounded-full bg-coral-50 px-3 py-1 text-[11px] font-bold text-coral-600">
          실제 학습 화면
        </span>
      </div>

      {/* 🔴 높이는 여기서 정한다 — 활동은 `h-full` 로 채우기만 한다. 세로가 모자라면 카드가
          찌그러지고, 너무 크면 글의 흐름이 끊긴다. 모바일 세로를 기준으로 잡은 값.
          🔴 `transform` 이 핵심이다 — 게임은 `PhonicsGameGate` 가 `fixed inset-0` 로 띄우고
             플레이어도 전체화면이라, 그냥 얹으면 **랜딩 전체를 덮는다**. 변환된 조상은 그
             아래 `fixed` 의 컨테이닝 블록이 되므로 상자 안에 갇힌다. 활동 13개와 게임
             플레이어를 하나도 안 건드리고 되는 유일한 방법이다(그것들은 동화책 게임과 공유한다). */}
      {/* 🔴 **게임은 상자 높이를 못 정한다.** 게임 플레이어(`ConnectTheDots`·`WordWriting`·
          `LineMatching`)는 인라인 `height: 100dvh` 를 쓰는데, `transform` 이 `inset-0` 의 컨테이닝
          블록은 바꿔도 **`dvh` 는 끝까지 뷰포트 값**이다. 그래서 상자를 낮추면 아래(확인 버튼)가
          그냥 잘린다 — 390px 실측 플레이어 844 vs 상자 764. 낮추는 대신 **상자를 그 높이에 맞춘다**.
          플레이어를 고치지 않는 이유 = 동화책 게임과 공유하는 코드다. */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: activity.kind.startsWith('game-') ? '100dvh' : `min(${height ?? 500}px, 88dvh)`,
          transform: 'translateZ(0)',
        }}
      >
        <PhonicsEmbeddedProvider value>
          <KoreanPhonicsActivity
            unitId={unitId}
            activityKey={activity.key}
            onExit={() => setDone(true)}
          />
        </PhonicsEmbeddedProvider>
      </div>

      <div className="flex flex-col items-center gap-2 bg-cream-50 px-5 py-4 text-center">
        <p className="text-xs text-ink-500 break-keep">
          {done
            ? '다 하셨네요. 아이와 함께면 소리까지 들으며 할 수 있어요.'
            : '앱에서는 이 활동이 단원마다 아홉 가지씩 이어집니다.'}
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
