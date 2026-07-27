import { Link, useParams } from 'react-router-dom';
import type { Storybook } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { getActivityPlan, getKoreanUnit, type ActivityDef } from '../lib/korean-phonics-units';
import { isPhonicsActivityAvailable } from '../lib/phonics-game-adapter';
import { usePhonicsProgress } from '../lib/progress-store';

/**
 * /library/phonics/korean/:unitId — unit 의 액티비티 그리드.
 *
 * 두 섹션 — **익히기** (모음 듣기/쓰기 4개), **게임하기** (4개 게임).
 * 액티비티 잠금 없음 — 8개 모두 자유롭게 접근. 진척은 ✓ 뱃지로만 표시.
 *
 * `embedded` 모드 (KoreanPhonicsStudyPage 안에 렌더될 때): "← 단원 목록" 링크 hide
 * (좌측 사이드바가 단원 목록 역할). 그 외는 standalone 화면용.
 */
export default function KoreanPhonicsUnitPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unit = getKoreanUnit(unitId);
  const plan = getActivityPlan(unitId);
  const { unitCompletedActivities } = usePhonicsProgress('korean');
  const completed = unitCompletedActivities(unitId);
  // 게임 타일은 실제 데이터가 있는 것만 노출 (막다른 길 방지). 게임은 전부 required:false 라
  // 숨겨도 단원 완료 판정에 영향이 없다.
  const storybook = useStorybook(unitId).data as Storybook | undefined;

  if (!unit) {
    return (
      <div className="px-6 py-6 max-w-[900px] mx-auto">
        <p className="text-base font-bold text-ink-700">알 수 없는 단원입니다.</p>
        <Link
          to="/library/phonics/korean"
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          ← 한글 파닉스로
        </Link>
      </div>
    );
  }

  const learnActivities = plan.activities.filter((a) => a.section === 'learn');
  const playActivities = plan.activities.filter(
    (a) => a.section === 'play' && isPhonicsActivityAvailable(a.kind, storybook)
  );

  return (
    <div className="px-4 sm:px-6 pt-10 sm:pt-14 pb-5 sm:pb-6 max-w-[1200px] mx-auto">
      {!embedded && (
        <div className="mb-4">
          <Link
            to="/library/phonics/korean"
            className="inline-flex items-center gap-1 text-sm sm:text-base font-bold text-ink-600 hover:text-ink-900"
          >
            ← 단원 목록
          </Link>
        </div>
      )}

      {plan.activities.length === 0 ? (
        <div className="rounded-3xl bg-cream-100 p-8 text-center text-ink-600 font-black text-lg">
          이 단원은 활동이 아직 준비되지 않았어요.
        </div>
      ) : (
        // 두 섹션 사이를 넉넉히 — 아래로 화면이 남는데 붙어 있으면 한 덩어리로 보인다.
        <div className="flex flex-col gap-8 sm:gap-10 lg:gap-14">
          <ActivitySection
            unitId={unitId}
            title="익히기"
            subtitle="듣고 따라써요"
            emoji="📖"
            tone="learn"
            activities={learnActivities}
            completed={completed}
          />
          <ActivitySection
            unitId={unitId}
            // 🔴 복습 단원은 이 패널이 화면의 유일한 글자다 — "게임하기" 로 두면 무엇을 복습하는지
            //    화면 어디에도 안 적힌다. 사이드바와 같은 이름(ㄱ~ㄹ 복습)을 그대로 쓴다.
            title={unit.isReview ? unit.unitTitle : '게임하기'}
            subtitle="재미있게 익혀요"
            emoji={unit.isReview ? '🏅' : '🎮'}
            tone="play"
            activities={playActivities}
            completed={completed}
          />
        </div>
      )}
    </div>
  );
}

function ActivitySection({
  unitId,
  title,
  subtitle,
  emoji,
  tone,
  activities,
  completed,
}: {
  unitId: string;
  title: string;
  subtitle: string;
  emoji: string;
  tone: 'learn' | 'play';
  activities: ActivityDef[];
  completed: string[];
}) {
  if (activities.length === 0) return null;
  const isLearn = tone === 'learn';
  // Panel: 익히기 = peach 톤 wash, 게임하기 = mint 톤 wash. 양 섹션 시각 구분 강화.
  const panelClass = isLearn
    ? 'bg-gradient-to-br from-peach-100/80 via-peach-50/70 to-cream-50/60 border-peach-200/70'
    : 'bg-gradient-to-br from-mint-100/80 via-mint-50/70 to-cream-50/60 border-mint-200/70';
  const headerBg = isLearn
    ? 'bg-gradient-to-r from-coral-500 to-coral-400'
    : 'bg-gradient-to-r from-mint-500 to-mint-400';
  return (
    <section
      className={`relative rounded-[32px] border-2 ${panelClass} backdrop-blur-sm shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] px-4 sm:px-6 pt-12 sm:pt-14 pb-8 sm:pb-10`}
    >
      {/* 섹션 헤더 — 위쪽 좌측 peg 처럼 띄움 */}
      <div className="absolute -top-5 left-5 sm:left-6">
        <div
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full ${headerBg} shadow-pop border-[3px] border-white`}
        >
          <span className="text-2xl sm:text-3xl drop-shadow-sm">{emoji}</span>
          <span className="text-lg sm:text-xl md:text-2xl font-black font-display text-white">
            {title}
          </span>
          <span className="text-sm sm:text-base font-black text-white/90">· {subtitle}</span>
        </div>
      </div>
      {/* 🔴 grid 가 아니라 **flex-wrap + justify-center** — 고정 열 수는 장수가 열보다 적을 때
          카드를 왼쪽에 몰아놓고 빈 칸을 남긴다(5열에 4장 = 오른쪽이 텅 빈다). flex 는 있는 만큼만
          깔고 가운데로 모은다.
          🔴 **카드 폭은 뷰포트가 아니라 남는 폭 기준** — md 부터 사이드바가 256px 를 먹어
          834px 화면의 콘텐츠 폭은 486px 뿐이다. 그래서 sm(3장)보다 md 가 더 넓은 카드(=2장)다.
          실측 콘텐츠 폭: 768→420 · 834→486 · 1024→676 · 1280→934 · 1512→1109.
          🔴 익히기가 두 줄이 되면 게임하기가 화면 밖으로 밀린다 — 한 화면에 둘 다 보여야 한다. */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
        {activities.map((act) => (
          <ActivityCard
            key={act.key}
            unitId={unitId}
            activity={act}
            done={completed.includes(act.key)}
            widthClass={activities.length === 6 ? SIX_CARD_WIDTH : undefined}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * 🔴 flex 아이템이라 **폭을 직접 준다** — 안 주면 정사각 카드가 내용만큼 오그라든다.
 * 한 줄에 몇 장인지를 폭으로 정한다: 375=2 · sm=3 · md=2(사이드바가 256px 먹음) · lg=4 · xl=5.
 */
const DEFAULT_CARD_WIDTH =
  'w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.5rem)] xl:w-[calc(20%-1.6rem)]';

/**
 * 6장짜리 섹션(복습 게임)은 **3+3** 으로 나눈다 — 기본 폭이면 lg 4장·xl 5장이라 마지막 한 장이
 * 혼자 남아 덤처럼 보인다. 좁은 화면(md 이하)은 그대로 2장씩: 3장으로 쪼개면 카드가 100px 대가 된다.
 */
const SIX_CARD_WIDTH =
  'w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1.34rem)] xl:w-[calc(33.333%-1.34rem)]';

/** 액티비티 kind → 일러스트 (webp). 매칭 안 되면 undefined → emoji 폴백. */
const KIND_ICON_URL: Partial<Record<ActivityDef['kind'], string>> = {
  // 학습 — 듣기/누르기/음절 = 블록 두 개 합쳐지는 일러
  'vowel-listen': '/icons/activity/cvc-learn.webp',
  'consonant-tap': '/icons/activity/cvc-learn.webp',
  'consonant-blend-listen': '/icons/activity/cvc-learn.webp',
  'coda-blend-listen': '/icons/activity/cvc-learn.webp',
  // 복습 — 익숙한 활동과 같은 그림을 써서 "해본 것"으로 읽히게 한다
  'word-listen-choose': '/icons/activity/cvc-learn.webp',
  'review-listen': '/icons/activity/cvc-learn.webp',
  'review-maze': '/icons/game/connect-dots.webp',
  'review-flip': '/icons/game/korean-block.webp',
  'review-match': '/icons/game/line-matching.webp',
  'review-write': '/icons/game/word-writing-ko.webp',
  // 학습 — 쓰기 = 미소짓는 연필
  'vowel-write': '/icons/activity/cvc-write.webp',
  'consonant-write': '/icons/activity/cvc-write.webp',
  // 게임
  'game-korean-block': '/icons/game/korean-block.webp',
  // 🔴 영어판(word-writing.webp)은 연필이 알파벳 A 를 쓴다 — 한글 단원엔 한글판을 쓴다.
  'game-word-writing': '/icons/game/word-writing-ko.webp',
  'game-connect-dots': '/icons/game/connect-dots.webp',
  'game-line-matching': '/icons/game/line-matching.webp',
};

function ActivityCard({
  unitId,
  activity,
  done,
  widthClass = DEFAULT_CARD_WIDTH,
}: {
  unitId: string;
  activity: ActivityDef;
  done: boolean;
  widthClass?: string;
}) {
  const isLearn = activity.section === 'learn';
  // 게임하기는 완료 개념 없음 → done 시그널 무시
  const showDone = isLearn && done;

  const cardClass = showDone
    ? 'bg-gradient-to-br from-success/10 to-success/20 border-success/60 ring-2 ring-success/30'
    : isLearn
      ? 'bg-gradient-to-br from-white via-peach-50 to-peach-100 border-white'
      : 'bg-gradient-to-br from-white via-mint-50 to-mint-100 border-white';

  const numBadgeClass = showDone
    ? 'bg-success text-white opacity-70'
    : isLearn
      ? 'bg-gradient-to-br from-coral-400 to-coral-600 text-white'
      : 'bg-gradient-to-br from-mint-400 to-mint-600 text-white';

  const iconUrl = KIND_ICON_URL[activity.kind];

  return (
    <Link
      to={`/library/phonics/korean/${unitId}/${activity.key}`}
      className={`group relative block aspect-square ${widthClass} max-w-[13rem] rounded-[28px] border-[5px] p-3 sm:p-4 transition-all duration-200 active:scale-[0.97] hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-[0_18px_40px_-12px_rgba(255,94,58,0.4)] shadow-[0_8px_24px_-10px_rgba(255,94,58,0.25)] flex flex-col overflow-hidden ${cardClass}`}
    >
      {/* 위쪽 살짝 하이라이트 (3D rendered 느낌) */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

      {/* 완료 큰 ✓ overlay — 우상단 (익히기 완료 시만) */}
      {showDone && (
        <div className="absolute top-2.5 right-2.5 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-success text-white flex items-center justify-center shadow-pop text-2xl sm:text-3xl font-black ring-[5px] ring-white z-20">
          ✓
        </div>
      )}

      {/* 번호 배지 — 흰 외곽 + 그라데이션 + 살짝 기울임.
          🔴 우상단 ✓ 처럼 **떠 있는다**(absolute). 흐름에 두면 48px 짜리 줄을 하나 더 먹어
          정사각 카드에서 일러스트가 들어갈 자리가 사라진다. */}
      <span
        className={`absolute top-2.5 left-2.5 z-20 inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full font-black text-xl sm:text-2xl shrink-0 shadow-pop ring-[4px] ring-white -rotate-[6deg] group-hover:-rotate-[3deg] transition-transform ${numBadgeClass}`}
      >
        {activity.order}
      </span>

      {/* 큰 일러스트 (있으면 webp, 없으면 emoji) — 카드 가운데 차지 */}
      {/* 🔴 `min-h-0` 필수 — 카드가 aspect 로 높이가 고정이라 공간이 모자라면 flex 가 자식을 줄인다.
          이게 없으면 그림이 자리를 안 내주고 **아래 제목이 눌려 잘린다**(overflow-hidden 이라 조용히). */}
      <div
        className={`relative z-10 flex-1 min-h-0 flex items-center justify-center my-1 group-hover:scale-105 transition-transform duration-200 ${showDone ? 'opacity-50' : ''}`}
      >
        {/* 🔴 그림에 **고정 크기를 주지 않는다** — `min-h-0` 은 컨테이너만 줄일 뿐이라 안에 h-28 짜리
            그림이 있으면 밖으로 삐져나와 **제목 위에 겹친다**(넘침이 아니라 겹침이라 `scrollHeight`
            검사에 안 걸린다).
            🔴 그렇다고 흐름 안에서 `max-h-full` 을 주면 안 된다 — 부모가 `flex-1`(basis 0)이라
            퍼센트 높이가 **0 으로 풀린다**(834px 에서 그림이 사라졌다). `absolute inset-0` 는
            확정된 높이를 기준으로 잡히므로 안전하고, `m-auto` 가 가운데 정렬까지 한다. */}
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={activity.title}
            className="absolute inset-0 m-auto max-h-full max-w-full w-20 sm:w-24 md:w-28 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
          />
        ) : (
          // 🔴 이모지는 글꼴 크기라 `max-h-full` 로 못 묶는다 — **가장 좁은 카드(148px)에 들어가는
          //    크기로 고정**한다. 72px 이던 시절 174px 카드에서 제목을 3px 침범했다.
          //    (아이콘 webp 가 있는 활동은 위 img 경로라 이 제한과 무관하다.)
          <span className="text-5xl sm:text-6xl leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
            {activity.emoji}
          </span>
        )}
      </div>

      {/* 제목은 절대 줄이지 않는다 — 잘리면 무슨 활동인지 못 읽는다 */}
      <h3
        className={`relative z-10 shrink-0 pb-0.5 text-xl sm:text-2xl font-black font-display leading-tight break-keep text-center ${showDone ? 'text-ink-500' : 'text-ink-900'}`}
      >
        {activity.title}
      </h3>
    </Link>
  );
}
