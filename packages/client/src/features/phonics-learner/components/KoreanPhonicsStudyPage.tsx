import { useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/design-system';
import {
  getAllKoreanUnits,
  getActivityPlan,
  getRequiredActivities,
  type KoreanUnitSummary,
} from '../lib/korean-phonics-units';
import { usePhonicsProgress, getRecentUnit, markRecentUnit } from '../lib/progress-store';
import KoreanPhonicsUnitPage from './KoreanPhonicsUnitPage';

/**
 * /library/phonics/korean(/:unitId)? — 한글 파닉스 학습 모드.
 *
 * AppShell **밖** 풀화면. 좌측: 전체 커리큘럼 스크롤 list (한글1~4 + units).
 * 우측: 선택된 unit 의 활동 그리드 (KoreanPhonicsUnitPage 임베디드).
 *
 * 진입 시 URL 에 unitId 없으면 → localStorage recent unit 또는 첫 활성 unit 으로 redirect.
 */
export default function KoreanPhonicsStudyPage() {
  const { unitId } = useParams<{ unitId?: string }>();
  const navigate = useNavigate();
  const allUnits = useMemo(() => getAllKoreanUnits(), []);
  const { isUnitDone } = usePhonicsProgress('korean');

  // 현재 unit 을 recent 로 마킹 (URL change 시).
  useEffect(() => {
    if (unitId) markRecentUnit('korean', unitId);
  }, [unitId]);

  // unitId 없으면 recent → 첫 활성 unit 으로 redirect (hooks 후).
  if (!unitId) {
    const recent = getRecentUnit('korean');
    const recentValid =
      recent &&
      allUnits.some((u) => u.id === recent && getActivityPlan(u.id).activities.length > 0);
    const target =
      (recentValid ? recent : null) ??
      allUnits.find((u) => getActivityPlan(u.id).activities.length > 0)?.id;
    if (target) {
      return <Navigate to={`/library/phonics/korean/${target}`} replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 px-6 text-center">
        <div>
          <p className="text-base font-bold text-ink-700">아직 학습할 단원이 준비되지 않았어요.</p>
          <Link
            to="/library/phonics"
            className="inline-block mt-3 text-coral-600 font-black underline"
          >
            ← 파닉스 선택으로
          </Link>
        </div>
      </div>
    );
  }

  // 레벨별 그룹 (사이드바)
  const byLevel = (() => {
    const map = new Map<string, { name: string; units: KoreanUnitSummary[] }>();
    for (const u of allUnits) {
      if (!map.has(u.levelKey)) map.set(u.levelKey, { name: u.levelName, units: [] });
      map.get(u.levelKey)!.units.push(u);
    }
    return [...map.entries()];
  })();

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-cream-50 to-peach-100">
      {/* 상단 헤더 — 동화책/어휘 학습 페이지와 동일 PageHeader 패턴 (흰 wash 카드 + peach pill) */}
      <PageHeader onBack={() => navigate('/library/phonics')} backLabel="파닉스">
        <span className="inline-flex items-center gap-2">
          <span className="text-coral-600">한글</span>
          <span>파닉스</span>
        </span>
      </PageHeader>

      <div className="flex-1 min-h-0 flex mt-2">
        {/* 좌측 — 커리큘럼 스크롤 list */}
        <aside className="w-44 sm:w-52 md:w-60 shrink-0 h-full overflow-y-auto border-r border-ink-100/60 bg-white py-3 px-2 sm:px-3">
          <div className="flex flex-col gap-4">
            {byLevel.map(([levelKey, level]) => (
              <section key={levelKey}>
                <h2 className="text-xs sm:text-sm font-black font-display text-ink-700 px-2 mb-1.5 sticky top-0 bg-white py-1 z-10">
                  {level.name}
                </h2>
                <div className="flex flex-col gap-1">
                  {level.units.map((u) => {
                    const plan = getActivityPlan(u.id);
                    const hasPlan = plan.activities.length > 0;
                    const required = getRequiredActivities(u.id);
                    const done = isUnitDone(u.id, required);
                    const active = u.id === unitId;
                    return (
                      <CurriculumItem
                        key={u.id}
                        unit={u}
                        active={active}
                        done={done}
                        hasPlan={hasPlan}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>

        {/* 우측 — 선택된 unit body (embedded 모드 → "← 단원 목록" 링크 hide) */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <KoreanPhonicsUnitPage embedded />
        </div>
      </div>
    </div>
  );
}

function CurriculumItem({
  unit,
  active,
  done,
  hasPlan,
}: {
  unit: KoreanUnitSummary;
  active: boolean;
  done: boolean;
  hasPlan: boolean;
}) {
  const titleShort = unit.unitTitle.replace(/^unit\s+\d+:\s*/i, '');
  const baseClass = 'flex items-center gap-2 px-2 py-2 rounded-lg text-left transition';
  if (!hasPlan) {
    return (
      <div
        className={`${baseClass} bg-cream-50 text-ink-400 cursor-not-allowed opacity-70 select-none`}
        aria-disabled="true"
      >
        <span className="inline-flex w-6 h-6 rounded-full bg-ink-100 text-ink-400 items-center justify-center text-xs font-black shrink-0">
          {unit.unitIndexInLevel}
        </span>
        <span className="text-xs sm:text-sm font-bold truncate">{titleShort}</span>
        <span className="ml-auto text-[10px] font-bold text-ink-300">준비 중</span>
      </div>
    );
  }
  return (
    <Link
      to={`/library/phonics/korean/${unit.id}`}
      className={[
        baseClass,
        active
          ? 'bg-coral-500 text-white shadow-soft ring-2 ring-coral-300'
          : done
            ? 'bg-success/10 text-success-700 hover:bg-success/20'
            : 'text-ink-700 hover:bg-cream-100',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-black shrink-0',
          active
            ? 'bg-white text-coral-600'
            : done
              ? 'bg-success text-white'
              : 'bg-coral-100 text-coral-600',
        ].join(' ')}
      >
        {done ? '✓' : unit.unitIndexInLevel}
      </span>
      <span className="text-xs sm:text-sm font-black truncate break-keep">{titleShort}</span>
    </Link>
  );
}
