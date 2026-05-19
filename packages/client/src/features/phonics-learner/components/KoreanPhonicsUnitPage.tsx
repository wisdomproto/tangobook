import { Link, useParams } from 'react-router-dom';
import { getActivityPlan, getKoreanUnit, type ActivityDef } from '../lib/korean-phonics-units';
import { usePhonicsProgress } from '../lib/progress-store';

/**
 * /library/phonics/korean/:unitId — unit 의 액티비티 그리드.
 *
 * 두 섹션 — **익히기** (모음 듣기/쓰기 4개), **게임하기** (4개 게임).
 * 액티비티 잠금 없음 — 8개 모두 자유롭게 접근. 진척은 ✓ 뱃지로만 표시.
 */
export default function KoreanPhonicsUnitPage() {
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unit = getKoreanUnit(unitId);
  const plan = getActivityPlan(unitId);
  const { unitCompletedActivities } = usePhonicsProgress('korean');
  const completed = unitCompletedActivities(unitId);

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
  const playActivities = plan.activities.filter((a) => a.section === 'play');

  return (
    <div className="px-6 py-6 max-w-[1100px] mx-auto">
      <div className="mb-6">
        <Link
          to="/library/phonics/korean"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink-600 hover:text-ink-900 mb-2"
        >
          ← 단원 목록
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-ink-900">
          {unit.unitTitle.replace(/^unit\s+\d+:\s*/i, '')}
        </h1>
        <p className="text-sm sm:text-base text-ink-600 font-bold mt-1">{unit.levelName}</p>
      </div>

      {plan.activities.length === 0 ? (
        <div className="rounded-2xl bg-cream-100 p-6 text-center text-ink-600 font-bold">
          이 단원은 활동이 아직 준비되지 않았어요.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
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
            title="게임하기"
            subtitle="재미있게 익혀요"
            emoji="🎮"
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
  const headerBg = tone === 'learn' ? 'bg-peach-100' : 'bg-mint-100';
  if (activities.length === 0) return null;
  return (
    <section>
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${headerBg} shadow-soft mb-3`}
      >
        <span className="text-xl">{emoji}</span>
        <span className="text-base sm:text-lg font-black font-display text-ink-900">{title}</span>
        <span className="text-xs sm:text-sm font-bold text-ink-600">· {subtitle}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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

function ActivityCard({
  unitId,
  activity,
  done,
}: {
  unitId: string;
  activity: ActivityDef;
  done: boolean;
}) {
  const accent =
    activity.section === 'learn' ? 'from-cream-50 to-peach-100' : 'from-cream-50 to-mint-100';
  return (
    <Link
      to={`/library/phonics/korean/${unitId}/${activity.key}`}
      className={`block aspect-[5/6] rounded-2xl border-[4px] border-white p-3 sm:p-4 transition shadow-soft hover:shadow-pop active:scale-[0.98] bg-gradient-to-br ${accent}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-coral-500 text-white font-black text-base">
          {activity.order}
        </span>
        {done && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success-700 text-xs font-black">
            ✓ 완료
          </span>
        )}
      </div>
      <div className="text-4xl sm:text-5xl mb-1.5">{activity.emoji}</div>
      <h3 className="text-base sm:text-lg font-black font-display text-ink-900 leading-tight">
        {activity.title}
      </h3>
      {activity.subtitle && (
        <p className="text-xs sm:text-sm font-bold text-ink-600 mt-0.5 leading-snug">
          {activity.subtitle}
        </p>
      )}
    </Link>
  );
}
