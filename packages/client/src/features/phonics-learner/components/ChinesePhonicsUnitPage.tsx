import { Link, useParams } from 'react-router-dom';
import { getChineseActivityPlan, getChineseUnit } from '../lib/chinese-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { usePhonicsProgress } from '../lib/progress-store';

/**
 * /library/phonics/chinese/:unitId — 병음 unit 의 활동 그리드.
 *
 * 영어/한글 UnitPage 평행. L1 은 유닛마다 「듣고 고르기」 한 장(익히기)뿐 — 게임/storybook 없음.
 */
export default function ChinesePhonicsUnitPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unit = getChineseUnit(unitId);
  const plan = getChineseActivityPlan(unitId);
  const { unitCompletedActivities } = usePhonicsProgress('chinese');
  const completed = unitCompletedActivities(unitId);

  if (!unit) {
    return (
      <div className="px-6 py-6 max-w-[900px] mx-auto">
        <p className="text-base font-bold text-ink-700">알 수 없는 단원입니다.</p>
        <Link
          to="/library/phonics/chinese"
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          ← 병음 파닉스로
        </Link>
      </div>
    );
  }

  const learnActivities = plan.activities.filter((a) => a.section === 'learn');
  const playActivities = plan.activities.filter((a) => a.section === 'play');

  return (
    <div className="px-4 sm:px-6 pt-10 sm:pt-14 pb-5 sm:pb-6 max-w-[1200px] mx-auto">
      {!embedded && (
        <div className="mb-4">
          <Link
            to="/library/phonics/chinese"
            className="inline-flex items-center gap-1 text-sm sm:text-base font-bold text-ink-600 hover:text-ink-900"
          >
            ← 단원 목록
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
            이 단원은 활동이 아직 준비되지 않았어요.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 sm:gap-6">
          {learnActivities.length > 0 && (
            <ActivitySection
              unitId={unitId}
              title="익히기"
              subtitle="듣고 배워요"
              emoji="📖"
              tone="learn"
              activities={learnActivities}
              completed={completed}
            />
          )}
          {playActivities.length > 0 && (
            <ActivitySection
              unitId={unitId}
              title="낱말 놀이"
              subtitle="놀면서 익혀요"
              emoji="🎲"
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
  // 익히기 = peach / 낱말 놀이 = mint (한/영 파닉스 단원과 같은 색 규칙).
  const panel =
    tone === 'learn'
      ? 'from-peach-100/80 via-peach-50/70 to-cream-50/60 border-peach-200/70'
      : 'from-mint-100/80 via-mint-50/70 to-cream-50/60 border-mint-200/70';
  const peg = tone === 'learn' ? 'from-coral-500 to-coral-400' : 'from-mint-500 to-mint-400';
  return (
    <section
      className={`relative rounded-[32px] border-2 bg-gradient-to-br ${panel} backdrop-blur-sm shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] px-4 sm:px-5 pt-10 sm:pt-12 pb-5 sm:pb-6`}
    >
      <div className="absolute -top-5 left-5 sm:left-6">
        <div
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r ${peg} shadow-pop border-[3px] border-white`}
        >
          <span className="text-2xl sm:text-3xl drop-shadow-sm">{emoji}</span>
          <span className="text-lg sm:text-xl md:text-2xl font-black font-display text-white">
            {title}
          </span>
          <span className="text-sm sm:text-base font-black text-white/90">· {subtitle}</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
        {activities.map((act) => (
          <ActivityCard
            key={act.key}
            unitId={unitId}
            activity={act}
            done={completed.includes(act.key)}
          />
        ))}
      </div>
    </section>
  );
}

// 한 줄 카드 폭 — 한/영판과 같은 규칙(375=2 · sm=3 · md=2 · lg=4 · xl=5).
const CARD_WIDTH =
  'w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.5rem)] xl:w-[calc(20%-1.6rem)]';

function ActivityCard({
  unitId,
  activity,
  done,
}: {
  unitId: string;
  activity: ActivityDef;
  done: boolean;
}) {
  const cardClass = done
    ? 'bg-gradient-to-br from-success/10 to-success/20 border-success/60 ring-2 ring-success/30'
    : 'bg-gradient-to-br from-white via-peach-50 to-peach-100 border-white';
  const numBadgeClass = done
    ? 'bg-success text-white opacity-70'
    : 'bg-gradient-to-br from-coral-400 to-coral-600 text-white';

  return (
    <Link
      to={`/library/phonics/chinese/${unitId}/${activity.key}`}
      className={`group relative block aspect-[5/6] ${CARD_WIDTH} max-w-[13rem] rounded-[28px] border-[5px] p-3 sm:p-4 transition-all duration-200 active:scale-[0.97] hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-[0_18px_40px_-12px_rgba(255,94,58,0.4)] shadow-[0_8px_24px_-10px_rgba(255,94,58,0.25)] flex flex-col overflow-hidden ${cardClass}`}
    >
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
      {done && (
        <div className="absolute top-2.5 right-2.5 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-success text-white flex items-center justify-center shadow-pop text-2xl sm:text-3xl font-black ring-[5px] ring-white z-20">
          ✓
        </div>
      )}
      <span
        className={`absolute top-2.5 left-2.5 z-20 inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full font-black text-xl sm:text-2xl shrink-0 shadow-pop ring-[4px] ring-white -rotate-[6deg] group-hover:-rotate-[3deg] transition-transform ${numBadgeClass}`}
      >
        {activity.order}
      </span>
      <div
        className={`relative z-10 flex-1 min-h-0 flex items-center justify-center my-1 group-hover:scale-105 transition-transform duration-200 ${done ? 'opacity-50' : ''}`}
      >
        <span className="text-5xl sm:text-6xl leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
          {activity.emoji}
        </span>
      </div>
      <h3
        className={`relative z-10 shrink-0 pb-0.5 text-xl sm:text-2xl font-black font-display leading-tight break-keep text-center ${done ? 'text-ink-500' : 'text-ink-900'}`}
      >
        {activity.title}
      </h3>
    </Link>
  );
}
