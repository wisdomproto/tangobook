import { Link, useParams } from 'react-router-dom';
import { getActivityPlan, getKoreanUnit, type ActivityDef } from '../lib/korean-phonics-units';
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
    <div className="px-4 sm:px-6 py-3 sm:py-4 max-w-[1100px] mx-auto">
      <div className="mb-3 sm:mb-4">
        {!embedded && (
          <Link
            to="/library/phonics/korean"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-ink-600 hover:text-ink-900 mb-1"
          >
            ← 단원 목록
          </Link>
        )}
        <h1 className="text-xl sm:text-2xl font-black font-display text-ink-900 inline-flex items-baseline gap-2">
          <span>{unit.unitTitle.replace(/^unit\s+\d+:\s*/i, '')}</span>
          <span className="text-sm font-black text-ink-900">· {unit.levelName}</span>
        </h1>
      </div>

      {plan.activities.length === 0 ? (
        <div className="rounded-2xl bg-cream-100 p-6 text-center text-ink-600 font-bold">
          이 단원은 활동이 아직 준비되지 않았어요.
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
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
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${headerBg} shadow-soft mb-2`}
      >
        <span className="text-base">{emoji}</span>
        <span className="text-sm sm:text-base font-black font-display text-ink-900">{title}</span>
        <span className="text-sm font-black text-ink-900">· {subtitle}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
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
  const isLearn = activity.section === 'learn';
  // 게임하기는 완료 개념 없음 → done 시그널 무시
  const showDone = isLearn && done;

  // 익히기 완료: success 톤 강하게 (배경/테두리/번호 모두 success). 미완료: 평소 톤 활성.
  // 게임하기: 항상 활성 톤 (완료 표시 없음).
  const cardClass = showDone
    ? 'bg-success/15 border-success ring-2 ring-success/40'
    : isLearn
      ? 'bg-gradient-to-br from-cream-50 to-peach-100 border-white shadow-soft hover:shadow-pop'
      : 'bg-gradient-to-br from-cream-50 to-mint-100 border-white shadow-soft hover:shadow-pop';

  const numBadgeClass = showDone ? 'bg-success text-white opacity-60' : 'bg-coral-500 text-white';

  return (
    <Link
      to={`/library/phonics/korean/${unitId}/${activity.key}`}
      className={`relative block aspect-[4/3] rounded-2xl border-[4px] p-2 sm:p-3 transition active:scale-[0.98] flex flex-col ${cardClass}`}
    >
      {/* 완료 큰 ✓ overlay — 우상단 (익히기 완료 시만) */}
      {showDone && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success text-white flex items-center justify-center shadow-pop text-xl sm:text-2xl font-black ring-2 sm:ring-4 ring-white">
          ✓
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-sm shrink-0 ${numBadgeClass}`}
        >
          {activity.order}
        </span>
        <span className={`text-2xl sm:text-3xl leading-none ${showDone ? 'opacity-50' : ''}`}>
          {activity.emoji}
        </span>
      </div>
      <h3
        className={`text-sm sm:text-base font-black font-display leading-tight break-keep ${showDone ? 'text-ink-500' : 'text-ink-900'}`}
      >
        {activity.title}
      </h3>
      {activity.subtitle && (
        <p
          className={`text-sm sm:text-base font-black mt-1 leading-snug break-keep ${showDone ? 'text-[#9A8474]' : 'text-[#0B0805]'}`}
        >
          {activity.subtitle}
        </p>
      )}
    </Link>
  );
}
