import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getAllKoreanUnits,
  getActivityPlan,
  getRequiredActivities,
  type KoreanUnitSummary,
} from '../lib/korean-phonics-units';
import { usePhonicsProgress } from '../lib/progress-store';
import { levelName, unitTitle } from '../lib/activity-title';

/**
 * /library/phonics/korean — 한글 파닉스 unit 그리드.
 *
 * 레벨(한글1 ~ 한글4) 별로 섹션, 각 unit 은 카드.
 * 첫 unit 만 unlock — 이전 unit 완료해야 다음 unit 열림.
 */
export default function KoreanPhonicsHubPage() {
  const { t } = useTranslation('phonics');
  const units = getAllKoreanUnits();
  const { isUnitDone } = usePhonicsProgress('korean');

  // 레벨별 그룹
  const byLevel = new Map<string, { name: string; units: KoreanUnitSummary[] }>();
  for (const u of units) {
    if (!byLevel.has(u.levelKey)) {
      byLevel.set(u.levelKey, { name: levelName(t, u), units: [] });
    }
    byLevel.get(u.levelKey)!.units.push(u);
  }

  return (
    <div className="px-6 py-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <Link
          to="/library/phonics"
          className="inline-flex items-center gap-1 text-sm font-bold text-ink-600 hover:text-ink-900 mb-2"
        >
          {t('common.backToPicker')}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-ink-900">{t('hub.title')}</h1>
        <p className="text-sm sm:text-base text-ink-600 font-bold mt-1">{t('hub.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-6">
        {[...byLevel.entries()].map(([levelKey, level]) => (
          <section key={levelKey}>
            <h2 className="text-lg sm:text-xl font-black font-display text-ink-900 mb-3">
              {level.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {level.units.map((u) => {
                const plan = getActivityPlan(u.id);
                const required = getRequiredActivities(u.id);
                const completed = isUnitDone(u.id, required);
                return (
                  <UnitCard
                    key={u.id}
                    unit={u}
                    completed={completed}
                    hasPlan={plan.activities.length > 0}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function UnitCard({
  unit,
  completed,
  hasPlan,
}: {
  unit: KoreanUnitSummary;
  completed: boolean;
  hasPlan: boolean;
}) {
  const { t } = useTranslation('phonics');
  const titleShort = unitTitle(t, unit).replace(/^unit\s+\d+:\s*/i, '');
  const inner = (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-coral-500 text-white font-black text-sm">
          {unit.unitIndexInLevel}
        </span>
        {completed && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success-700 text-xs font-black">
            {t('common.done')}
          </span>
        )}
      </div>
      <h3 className="text-base sm:text-lg font-black font-display text-ink-900 leading-snug">
        {titleShort}
      </h3>
      <div className="mt-2 flex flex-wrap gap-1">
        {unit.phonemes.slice(0, 6).map((p) => (
          <span
            key={p}
            className="inline-block px-1.5 py-0.5 rounded bg-white/70 text-xs font-bold text-ink-700"
          >
            {p}
          </span>
        ))}
      </div>
      {!hasPlan && <div className="mt-3 text-[11px] font-bold text-ink-500">{t('hub.noPlan')}</div>}
    </>
  );

  const base =
    'block aspect-[4/5] rounded-2xl border-[4px] p-3 sm:p-4 transition shadow-soft text-left';

  if (!hasPlan) {
    return (
      <div
        className={`${base} bg-cream-100 border-cream-200 opacity-60 cursor-not-allowed select-none`}
        aria-disabled="true"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/library/phonics/korean/${unit.id}`}
      className={`${base} bg-gradient-to-br from-cream-50 to-peach-100 border-white hover:shadow-pop active:scale-[0.98]`}
    >
      {inner}
    </Link>
  );
}
