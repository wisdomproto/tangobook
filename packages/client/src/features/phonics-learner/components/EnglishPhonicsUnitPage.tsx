import { Link, useParams } from 'react-router-dom';
import { getEnglishActivityPlan, getEnglishUnit } from '../lib/english-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { usePhonicsProgress } from '../lib/progress-store';

/**
 * /library/phonics/english/:unitId — 영어 unit 의 활동 그리드.
 *
 * 한글의 `KoreanPhonicsUnitPage` 평행. 활동 plan 있으면 카드 그리드, 없으면 "준비 중" placeholder.
 */
export default function EnglishPhonicsUnitPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unit = getEnglishUnit(unitId);
  const plan = getEnglishActivityPlan(unitId);
  const { unitCompletedActivities } = usePhonicsProgress('english');
  const completed = unitCompletedActivities(unitId);

  if (!unit) {
    return (
      <div className="px-6 py-6 max-w-[900px] mx-auto">
        <p className="text-base font-bold text-ink-700">알 수 없는 단원입니다.</p>
        <Link
          to="/library/phonics/english"
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          ← 영어 파닉스로
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
            to="/library/phonics/english"
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
          <p className="text-sm sm:text-base font-bold text-ink-500 mt-2">
            곧 영어 파닉스 활동이 추가될 거에요! ✨
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
              title="게임하기"
              subtitle="재미있게 익혀요"
              emoji="🎮"
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

/** 활동 kind → 일러스트 (학습/게임 일러는 한글과 공용). */
const KIND_ICON_URL: Partial<Record<ActivityDef['kind'], string>> = {
  // 학습 — Book 1 알파벳 배우기/쓰기 모두 카드 안에서 큰 글자 직접 렌더 (ActivityCard 분기 참고)
  // 학습 — CVC 배우기/쓰기 (Book 2)
  'cvc-pattern-learn': '/icons/activity/cvc-learn.webp',
  'cvc-pattern-write': '/icons/activity/cvc-write.webp',
  // 게임 (한글 파닉스 동일 webp 재사용)
  'game-english-block': '/icons/game/korean-block.webp', // 블록 일러
  'game-word-writing': '/icons/game/word-writing.webp',
  'game-connect-dots': '/icons/game/connect-dots.webp',
  'game-line-matching': '/icons/game/line-matching.webp',
};

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
  const showDone = isLearn && done;
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
      className={`group relative block aspect-[5/6] rounded-[28px] border-[5px] p-3 sm:p-4 transition-all duration-200 active:scale-[0.97] hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-[0_18px_40px_-12px_rgba(255,94,58,0.4)] shadow-[0_8px_24px_-10px_rgba(255,94,58,0.25)] flex flex-col overflow-hidden ${cardClass}`}
    >
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
      {showDone && (
        <div className="absolute top-2.5 right-2.5 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-success text-white flex items-center justify-center shadow-pop text-2xl sm:text-3xl font-black ring-[5px] ring-white z-20">
          ✓
        </div>
      )}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full font-black text-xl sm:text-2xl shrink-0 shadow-pop ring-[4px] ring-white -rotate-[6deg] group-hover:-rotate-[3deg] transition-transform ${numBadgeClass}`}
        >
          {activity.order}
        </span>
      </div>
      <div
        className={`relative z-10 flex-1 flex items-center justify-center my-1 group-hover:scale-105 transition-transform duration-200 ${showDone ? 'opacity-50' : ''}`}
      >
        {activity.kind === 'alphabet-letter-learn' && activity.letters ? (
          // ABC/DEF/... 배우기 — 대문자만, coral·sky 번갈아.
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
              : (activity.title.trim().split(/\s+/)[0] ?? '').split('');
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
          <img
            src={iconUrl}
            alt={activity.title}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
          />
        ) : (
          <span className="text-7xl sm:text-8xl leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
            {activity.emoji}
          </span>
        )}
      </div>
      <h3
        className={`relative z-10 text-xl sm:text-2xl font-black font-display leading-tight break-keep text-center ${showDone ? 'text-ink-500' : 'text-ink-900'}`}
      >
        {activity.title}
      </h3>
    </Link>
  );
}
