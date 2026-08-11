import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Storybook } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { getEnglishActivityPlan, getEnglishUnit } from '../lib/english-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { isPhonicsActivityAvailable } from '../lib/phonics-game-adapter';
import { usePhonicsProgress } from '../lib/progress-store';
import { activityTitle, unitTitle } from '../lib/activity-title';

/**
 * /library/phonics/english/:unitId — 영어 unit 의 활동 그리드.
 *
 * 한글의 `KoreanPhonicsUnitPage` 평행. 활동 plan 있으면 카드 그리드, 없으면 "준비 중" placeholder.
 */
export default function EnglishPhonicsUnitPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { t } = useTranslation('phonics');
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unit = getEnglishUnit(unitId);
  const plan = getEnglishActivityPlan(unitId);
  const { unitCompletedActivities } = usePhonicsProgress('english');
  const completed = unitCompletedActivities(unitId);
  // 게임 타일은 실제 데이터가 있는 것만 노출 (막다른 길 방지). 게임은 전부 required:false.
  const storybook = useStorybook(unitId).data as Storybook | undefined;

  if (!unit) {
    return (
      <div className="px-6 py-6 max-w-[900px] mx-auto">
        <p className="text-base font-bold text-ink-700">{t('common.unknownUnit')}</p>
        <Link
          to="/library/phonics/english"
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          {t('common.backToEnglish')}
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
            to="/library/phonics/english"
            className="inline-flex items-center gap-1 text-sm sm:text-base font-bold text-ink-600 hover:text-ink-900"
          >
            {t('common.backToUnitList')}
          </Link>
        </div>
      )}

      {plan.activities.length === 0 ? (
        <div className="rounded-3xl bg-white/70 backdrop-blur-sm border-2 border-white shadow-pop p-8 sm:p-10 text-center">
          <div className="text-6xl sm:text-7xl mb-4">⏳</div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-ink-900 mb-2">
            {unit.unitTitle}
          </h2>
          <p className="text-sm sm:text-base text-ink-600 font-bold mb-4">{unit.levelName}</p>
          <p className="text-base sm:text-lg font-black text-ink-700">
            {t('common.noActivitiesYet')}
          </p>
          <p className="text-sm sm:text-base font-bold text-ink-500 mt-2">
            {t('study.englishComingSoonNote')}
          </p>
          {unit.targetWords.length > 0 && (
            <div className="mt-6 inline-flex flex-wrap justify-center gap-2 max-w-md">
              {unit.targetWords.map((w) => (
                <span
                  key={w}
                  className="inline-block px-3 py-1.5 rounded-full bg-coral-100 text-coral-700 text-sm font-black"
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5 sm:gap-6">
          {learnActivities.length > 0 && (
            <ActivitySection
              unitId={unitId}
              title={t('section.learn')}
              subtitle={t('section.learnSubtitleListen')}
              emoji="📖"
              tone="learn"
              activities={learnActivities}
              completed={completed}
            />
          )}
          {playActivities.length > 0 && (
            <ActivitySection
              unitId={unitId}
              /* 🔴 복습 단원은 **그 묶음 이름**(`A~F 복습`)을 쓴다 — 게임 패널이 화면의 유일한
                 글자라 「게임하기」로 두면 무엇을 되짚는 자리인지 알 수 없다(한글과 같은 규칙).
                 `isReview` 는 영어 데이터에도 진작 있었는데 화면이 안 쓰고 있었다. */
              title={unit.isReview ? unitTitle(t, unit) : t('section.games')}
              subtitle={t('section.gamesSubtitle')}
              emoji={unit.isReview ? '🏅' : '🎮'}
              tone="play"
              activities={playActivities}
              completed={completed}
            />
          )}
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
  const isLearn = tone === 'learn';
  const panelClass = isLearn
    ? 'bg-gradient-to-br from-peach-100/80 via-peach-50/70 to-cream-50/60 border-peach-200/70'
    : 'bg-gradient-to-br from-mint-100/80 via-mint-50/70 to-cream-50/60 border-mint-200/70';
  const headerBg = isLearn
    ? 'bg-gradient-to-r from-coral-500 to-coral-400'
    : 'bg-gradient-to-r from-mint-500 to-mint-400';
  return (
    <section
      className={`relative rounded-[32px] border-2 ${panelClass} backdrop-blur-sm shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] px-4 sm:px-5 pt-10 sm:pt-12 pb-5 sm:pb-6`}
    >
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
      {/* 🔴 6장(복습)은 **grid-cols-3 + 폭 제한 컨테이너**로 3+3 을 한 화면에 넣는다(사용자 2026-08-09
          "아래 잘림"). flex-wrap 은 넓은 화면에서 3열을 유지하려면 카드가 커져 세로로 넘쳤다 — grid 는
          열 수를 폭과 분리하므로 카드를 작게(정사각) 고정할 수 있다. 그 외(≤5장)는 기존 flex-wrap. */}
      {activities.length === 6 ? (
        <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-[min(100%,44rem)]">
          {activities.map((act) => (
            <ActivityCard
              key={act.key}
              unitId={unitId}
              activity={act}
              done={completed.includes(act.key)}
              widthClass="w-full"
              maxWClass="max-w-none"
              aspectClass="aspect-square"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
          {activities.map((act) => (
            <ActivityCard
              key={act.key}
              unitId={unitId}
              activity={act}
              done={completed.includes(act.key)}
              widthClass={DEFAULT_CARD_WIDTH}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** 활동 kind → 일러스트 (학습/게임 일러는 한글과 공용). */
const KIND_ICON_URL: Partial<Record<ActivityDef['kind'], string>> = {
  // 학습 — Book 1 알파벳 배우기/쓰기 모두 카드 안에서 큰 글자 직접 렌더 (ActivityCard 분기 참고)
  // 학습 — CVC 배우기/쓰기 (Book 2)
  'cvc-pattern-learn': '/icons/activity/cvc-learn.webp',
  'word-listen-choose': '/icons/activity/cvc-learn.webp',
  'review-listen': '/icons/activity/cvc-learn.webp',
  'review-write': '/icons/activity/cvc-write.webp',
  'cvc-pattern-write': '/icons/activity/cvc-write.webp',
  'alphabet-letter-write': '/icons/activity/cvc-write.webp',
  // 게임 (한글 파닉스 동일 webp 재사용)
  'game-english-block': '/icons/game/korean-block.webp', // 블록 일러
  'game-word-writing': '/icons/game/word-writing.webp',
  'game-connect-dots': '/icons/game/connect-dots.webp',
  'game-line-matching': '/icons/game/line-matching.webp',
};

/**
 * 🔴 flex 아이템이라 **폭을 직접 준다** — 안 주면 카드가 내용만큼 오그라든다.
 * 한 줄에 몇 장인지를 폭으로 정한다: 375=2 · sm=3 · md=2(사이드바 256px) · lg=4 · xl=5.
 * 🔴 **한글판(`KoreanPhonicsUnitPage`)과 같은 값이어야 한다** — 두 화면이 같은 카드다.
 */
const DEFAULT_CARD_WIDTH =
  'w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.5rem)] xl:w-[calc(20%-1.6rem)]';

function ActivityCard({
  unitId,
  activity,
  done,
  widthClass = DEFAULT_CARD_WIDTH,
  maxWClass = 'max-w-[13rem]',
  aspectClass = 'aspect-[5/6]',
}: {
  unitId: string;
  activity: ActivityDef;
  done: boolean;
  widthClass?: string;
  maxWClass?: string;
  aspectClass?: string;
}) {
  const { t } = useTranslation('phonics');
  const label = activityTitle(t, activity);
  const isLearn = activity.section === 'learn';
  // 🔴 **게임도 끝내면 ✓** — 한글은 2026-07-27 에 고쳤는데 영어만 `isLearn &&` 가 남아 있었다.
  //    아이가 게임을 다 깨고 나와도 목록이 그대로라 무엇을 했는지 안 보인다.
  const showDone = done;
  const iconUrl = KIND_ICON_URL[activity.kind];

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

  return (
    <Link
      to={`/library/phonics/english/${unitId}/${activity.key}`}
      // 🔴 flex 아이템이라 폭을 직접 준다 — 안 주면 카드가 내용만큼 오그라든다.
      className={`group relative block ${aspectClass} ${widthClass} ${maxWClass} rounded-[28px] border-[5px] p-3 sm:p-4 transition-all duration-200 active:scale-[0.97] hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-[0_18px_40px_-12px_rgba(255,94,58,0.4)] shadow-[0_8px_24px_-10px_rgba(255,94,58,0.25)] flex flex-col overflow-hidden ${cardClass}`}
    >
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
      {showDone && (
        <div className="absolute top-2.5 right-2.5 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-success text-white flex items-center justify-center shadow-pop text-2xl sm:text-3xl font-black ring-[5px] ring-white z-20">
          ✓
        </div>
      )}
      {/* 🔴 번호 배지는 **떠 있는다**(absolute). 흐름에 두면 48px 짜리 줄을 하나 더 먹어
          높이가 고정된 카드에서 일러스트 자리가 사라진다. (한글판과 같은 규칙) */}
      <span
        className={`absolute top-2.5 left-2.5 z-20 inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full font-black text-xl sm:text-2xl shrink-0 shadow-pop ring-[4px] ring-white -rotate-[6deg] group-hover:-rotate-[3deg] transition-transform ${numBadgeClass}`}
      >
        {activity.order}
      </span>
      <div
        className={`relative z-10 flex-1 min-h-0 flex items-center justify-center my-1 group-hover:scale-105 transition-transform duration-200 ${showDone ? 'opacity-50' : ''}`}
      >
        {(activity.kind === 'alphabet-letter-learn' || activity.kind === 'word-listen-choose') &&
        activity.letters ? (
          // ABC/DEF/... 배우기 — 대문자만, coral·sky 번갈아.
          // 🔴 배우기 2(word-listen-choose)도 Book 1 이면 letters 를 갖는다 → 배우기 1·써보기와 같이
          //    글자를 보여준다(아이콘 하나만 튀지 않게). Book 2 는 letters 가 없어 아래 아이콘 분기로 간다.
          (() => {
            const ls = activity.letters!.map((L) => L.toUpperCase());
            return (
              <div className="flex items-baseline leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] font-display tracking-tight max-w-full">
                {ls.map((L, i) => (
                  <span
                    key={i}
                    className={`text-4xl sm:text-5xl md:text-6xl font-black ${
                      i % 2 === 0 ? 'text-coral-500' : 'text-sky-500'
                    }`}
                  >
                    {L}
                  </span>
                ))}
              </div>
            );
          })()
        ) : activity.kind === 'alphabet-letter-write' ? (
          // ABC/DEF/... 써보기 — 글자 + 우상단 ✏️ floating.
          (() => {
            const ls = activity.letters
              ? activity.letters.map((L) => L.toUpperCase())
              : (label.trim().split(/\s+/)[0] ?? '').split('');
            return (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="flex items-baseline leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] font-display tracking-tight">
                  {ls.map((L, i) => (
                    <span
                      key={i}
                      className={`text-4xl sm:text-5xl md:text-6xl font-black ${
                        i % 2 === 0 ? 'text-coral-500' : 'text-sky-500'
                      }`}
                    >
                      {L}
                    </span>
                  ))}
                </div>
                {/* 우상단 연필 — 완료 시 ✓ 뱃지와 겹치므로 hide */}
                {!showDone && (
                  <span className="absolute top-0 right-0 text-2xl sm:text-3xl rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                    ✏️
                  </span>
                )}
              </div>
            );
          })()
        ) : iconUrl ? (
          // 🔴 그림에 **고정 높이를 주지 않는다** — `min-h-0` 은 컨테이너만 줄일 뿐이라 h-28 짜리
          //    그림은 밖으로 삐져나와 **제목 위에 겹친다**(제목이 두 줄인 "영어 블록 게임"에서 드러났다).
          //    흐름 안 `max-h-full` 도 안 된다 — 부모가 `flex-1`(basis 0)이라 퍼센트 높이가 0 으로 풀린다.
          //    `absolute inset-0` 는 확정된 높이 기준이라 안전하고 `m-auto` 가 가운데 정렬까지 한다.
          <img
            src={iconUrl}
            alt={label}
            className="absolute inset-0 m-auto max-h-full max-w-full w-20 sm:w-24 md:w-28 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
          />
        ) : (
          // 🔴 이모지는 글꼴 크기라 `max-h-full` 로 못 묶는다 — 가장 좁은 카드에 들어가는 크기로 고정.
          <span className="text-5xl sm:text-6xl leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
            {activity.emoji}
          </span>
        )}
      </div>
      <h3
        className={`relative z-10 shrink-0 pb-0.5 text-xl sm:text-2xl font-black font-display leading-tight break-keep text-center ${showDone ? 'text-ink-500' : 'text-ink-900'}`}
      >
        {label}
      </h3>
    </Link>
  );
}
