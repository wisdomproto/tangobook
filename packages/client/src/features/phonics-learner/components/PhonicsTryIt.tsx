import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhonicsEmbeddedProvider } from './ActivityShell';
import { EmbedStage } from './EmbedStage';
import { KoreanPhonicsActivity } from './KoreanPhonicsActivityPage';
import { EnglishPhonicsActivity } from './EnglishPhonicsActivityPage';
import { getActivityPlan } from '../lib/korean-phonics-units';
import { getEnglishActivityPlan } from '../lib/english-phonics-units';

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
  /**
   * 이 활동이 무엇을 기르는지 한 줄. 🔴 **상자마다 달라야 한다**(2026-08-02 측정 리뷰) —
   * 같은 문장이 아홉 번 반복되면 두 번째부터 안 읽히고, 아홉 화면이 리듬이 아니라 벽이 된다.
   */
  note?: string;
  /**
   * 「앱에서 이어서 하기」 버튼을 이 상자에 둘지. 🔴 **기본은 안 둔다** — 같은 링크 아홉 개는
   * 선택지가 아니라 소음이다. 구간 마지막 상자에만 하나.
   */
  cta?: boolean;
  /**
   * 어느 파닉스인가. 🔴 **plan 과 호스트가 한 벌로 갈린다** — 한쪽만 바꾸면 영어 단원 id 로
   * 한글 plan 을 뒤져 활동을 못 찾고 상자가 **조용히 사라진다**(`if (!activity) return null`).
   */
  language?: 'korean' | 'english';
}

/**
 * **상자 높이를 못 정하는 활동** — `100dvh` 로 띄운다.
 *
 * 🔴 게임(`game-*`)은 플레이어가 인라인 `height: 100dvh` 를 쓰고, **듣고 고르기**는 카드를
 *    `min(Nvw, Mvh)` 로 잰다. `transform` 이 `inset-0` 의 컨테이닝 블록은 바꿔도 **`vh`·`dvh` 는
 *    끝까지 뷰포트 값**이라, 상자를 620px 로 낮추면 그 안에서 720px 기준으로 그려진 내용의
 *    아래가 그냥 잘린다(실측 1280×720: 내용 649 vs 상자 620 — 「🎯 퀴즈」 버튼이 16px 잘렸다).
 * 🔴 숫자를 키워 덮지 말 것 — 내용 높이가 **뷰포트 높이에 비례**하므로 더 긴 화면에서 또 잘린다.
 *    상자를 뷰포트 높이에 맞추면 안팎 기준이 같아져 어느 화면에서도 안 잘린다.
 */
const VIEWPORT_SIZED = (kind: string) =>
  kind.startsWith('game-') || kind === 'word-listen-choose' || kind === 'letter-hunt';

/** 「합쳐지는 순간」 = 이 단원을 한 장면으로 보여주는 활동. 레벨마다 kind 가 다르다. */
const BLEND_KINDS = [
  'consonant-blend-listen',
  'coda-blend-listen',
  'vowel-blend-listen',
  'vowel-listen',
];

export function PhonicsTryIt({
  unitId,
  activityKey,
  title,
  height,
  note,
  cta,
  language = 'korean',
}: Props) {
  const [done, setDone] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  /**
   * **도달률 계측** — 이 상자가 화면에 들어오면 GA4 로 한 번 쏜다(2026-08-06).
   *
   * 🔴 상자를 몇 개 둘지가 계속 **판단**이었다("아홉은 많다"). 랜딩이 28.4화면인데 어디서
   *    사람이 멈추는지 아무도 모르는 채로 자르고 붙였다 — 다음엔 **숫자로** 자르려고 남긴다.
   * 🔴 `once` 로 잠근다 — 스크롤을 오르내리면 같은 상자가 수십 번 쏜다.
   * 🔴 `gtag` 가 없으면 조용히 아무것도 안 한다(광고차단·개발 환경). 계측이 화면을 깨뜨리면 안 된다.
   */
  const sent = useRef(false);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (sent.current || !entries.some((e) => e.isIntersecting)) return;
        sent.current = true;
        (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'tryit_view', {
          activity: activityKey ?? 'auto',
          unit: unitId,
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [activityKey, unitId]);

  const isEnglish = language === 'english';
  const plan = isEnglish ? getEnglishActivityPlan(unitId) : getActivityPlan(unitId);
  const activity = activityKey
    ? plan.activities.find((a) => a.key === activityKey)
    : plan.activities.find((a) => BLEND_KINDS.includes(a.kind));

  if (!activity) return null; // 없는 활동은 조용히 접는다

  return (
    /**
     * 🔴 **상자는 페이지 폭을 지킨다**(2026-08-05 사용자: "가로폭을 맞춰야지. 크기를 줄이더라도").
     *    예전엔 `width:100vw + margin-left:calc(50% - 50vw)` 로 컨테이너를 뚫고 전폭으로 흘렸다 —
     *    활동이 `vw` 로 칸을 재서 좁은 상자 안에선 격자가 잘렸기 때문이다. 그런데 그러면 **이 상자만
     *    페이지보다 넓어** 위아래 카드와 가로선이 어긋난다. 이제 잘림은 `EmbedStage` 가 축소로 풀고,
     *    상자는 다른 섹션과 같은 폭을 쓴다.
     */
    <div
      ref={boxRef}
      className="my-7 overflow-hidden rounded-3xl border border-coral-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
        <span className="text-lg font-extrabold text-ink-800 break-keep lg:text-xl">
          {title ?? `${activity.emoji} ${activity.title}`}
        </span>
        {/* 🔴 **꽉 찬 색으로**(2026-08-05) — 연한 배지는 본문과 섞여 「그냥 라벨」로 지나간다.
            상자마다 이게 붙어야 아홉 개가 전부 살아 있는 화면이라는 게 눈으로 읽힌다. */}
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-coral-700 px-3 py-1.5 text-xs font-extrabold text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          실제 학습 화면
        </span>
      </div>

      {/* 🔴 높이는 여기서 정한다 — 활동은 `h-full` 로 채우기만 한다. 세로가 모자라면 카드가
          찌그러지고, 너무 크면 글의 흐름이 끊긴다. 모바일 세로를 기준으로 잡은 값.
          🔴 `transform` 이 핵심이다 — 게임은 `PhonicsGameGate` 가 `fixed inset-0` 로 띄우고
             플레이어도 전체화면이라, 그냥 얹으면 **랜딩 전체를 덮는다**. 변환된 조상은 그
             아래 `fixed` 의 컨테이닝 블록이 되므로 상자 안에 갇힌다. 활동 13개와 게임
             플레이어를 하나도 안 건드리고 되는 유일한 방법이다(그것들은 동화책 게임과 공유한다). */}
      {/* 높이 규칙은 위 `VIEWPORT_SIZED` 주석 참조. 플레이어·활동을 고치지 않는 이유 =
          동화책 게임과 공유하는 코드다. */}
      <EmbedStage
        height={VIEWPORT_SIZED(activity.kind) ? '100dvh' : `min(${height ?? 500}px, 88dvh)`}
      >
        <PhonicsEmbeddedProvider value>
          {isEnglish ? (
            <EnglishPhonicsActivity
              unitId={unitId}
              activityKey={activity.key}
              onExit={() => setDone(true)}
            />
          ) : (
            <KoreanPhonicsActivity
              unitId={unitId}
              activityKey={activity.key}
              onExit={() => setDone(true)}
            />
          )}
        </PhonicsEmbeddedProvider>
      </EmbedStage>

      <div className="flex flex-col items-center gap-2 bg-cream-50 px-5 py-4 text-center">
        <p className="text-xs text-ink-600 break-keep lg:text-sm">
          {done
            ? '다 하셨네요. 아이와 함께면 소리까지 들으며 할 수 있어요.'
            : (note ?? '앱에서는 이 활동이 단원마다 아홉 가지씩 이어집니다.')}
        </p>
        {cta && (
          <Link
            to={`/library/phonics/${isEnglish ? 'english' : 'korean'}/${unitId}`}
            className="inline-flex min-h-[44px] items-center rounded-full bg-coral-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-coral-800"
          >
            앱에서 이어서 하기 →
          </Link>
        )}
      </div>
    </div>
  );
}
