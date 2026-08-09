import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/design-system';
import {
  getAllChineseUnits,
  getChineseActivityPlan,
  getChineseRequiredActivities,
  type ChineseUnitSummary,
} from '../lib/chinese-phonics-units';
import { usePhonicsProgress, getRecentUnit, markRecentUnit } from '../lib/progress-store';
import { sumProgress } from '../lib/unit-progress';
import ChinesePhonicsUnitPage from './ChinesePhonicsUnitPage';

/**
 * /library/phonics/chinese(/:unitId)? — 병음(拼音) 파닉스 학습 모드.
 *
 * 한/영(`Korean/EnglishPhonicsStudyPage`) 평행 구조. 좌측 커리큘럼(Level 1~) + 우측 unit body.
 */
export default function ChinesePhonicsStudyPage() {
  const { unitId } = useParams<{ unitId?: string }>();
  const navigate = useNavigate();
  const allUnits = useMemo(() => getAllChineseUnits(), []);
  const { unitCompletedActivities } = usePhonicsProgress('chinese');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (unitId) markRecentUnit('chinese', unitId);
    setNavOpen(false);
  }, [unitId]);

  const currentLevelKey = allUnits.find((u) => u.id === unitId)?.levelKey;
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
    () => new Set(currentLevelKey ? [currentLevelKey] : [])
  );
  useEffect(() => {
    if (currentLevelKey) {
      setExpandedLevels((prev) => {
        if (prev.has(currentLevelKey)) return prev;
        const next = new Set(prev);
        next.add(currentLevelKey);
        return next;
      });
    }
  }, [currentLevelKey]);

  if (!unitId) {
    const recent = getRecentUnit('chinese');
    const recentValid = recent && allUnits.some((u) => u.id === recent);
    const target = (recentValid ? recent : null) ?? allUnits[0]?.id;
    if (target) {
      return <Navigate to={`/library/phonics/chinese/${target}`} replace />;
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

  const byLevel = (() => {
    const map = new Map<string, { name: string; units: ChineseUnitSummary[] }>();
    for (const u of allUnits) {
      if (!map.has(u.levelKey)) map.set(u.levelKey, { name: u.levelName, units: [] });
      map.get(u.levelKey)!.units.push(u);
    }
    return [...map.entries()];
  })();

  const toggleLevel = (levelKey: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelKey)) next.delete(levelKey);
      else next.add(levelKey);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundImage: "url('/images/phonics/study-bg.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <PageHeader
        onBack={() => navigate('/library')}
        backLabel="홈"
        right={
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="md:hidden px-4 py-2.5 rounded-full bg-white/90 text-ink-800 font-black text-sm shadow-soft flex items-center gap-1.5 min-h-[44px]"
          >
            ☰ <span>단원</span>
          </button>
        }
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-coral-600">병음</span>
          <span>파닉스</span>
        </span>
      </PageHeader>

      <div className="flex-1 min-h-0 flex mt-2">
        {navOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
        )}
        <aside
          className={`overflow-y-auto py-4 px-2.5 sm:px-3 bg-white/95 backdrop-blur fixed left-0 top-0 bottom-0 z-40 w-72 max-w-[85vw] shadow-xl ${navOpen ? 'block' : 'hidden'} md:block md:static md:z-auto md:w-64 md:h-full md:max-w-none md:shadow-none md:border-r md:border-cream-200/80 md:bg-white/85`}
        >
          <div className="md:hidden flex items-center justify-between mb-3 px-1">
            <span className="font-black font-display text-ink-900 text-lg">단원 선택</span>
            <button
              onClick={() => setNavOpen(false)}
              aria-label="닫기"
              className="w-9 h-9 rounded-full bg-cream-100 text-ink-700 font-black"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-5">
            {byLevel.map(([levelKey, level]) => {
              const isExpanded = expandedLevels.has(levelKey);
              const unitStats = level.units.map((u) => {
                const required = getChineseRequiredActivities(u.id);
                const doneKeys = unitCompletedActivities(u.id);
                return {
                  unit: u,
                  done: required.filter((k) => doneKeys.includes(k)).length,
                  total: required.length,
                };
              });
              const levelPct = sumProgress(unitStats).percent;
              return (
                <section key={levelKey}>
                  <button
                    onClick={() => toggleLevel(levelKey)}
                    aria-expanded={isExpanded}
                    className="w-full flex items-center justify-between gap-2 text-lg sm:text-xl font-black font-display text-ink-900 px-2.5 py-2.5 rounded-lg hover:bg-cream-50 transition"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={`inline-block transition-transform text-ink-500 ${isExpanded ? 'rotate-90' : ''}`}
                        aria-hidden
                      >
                        ▸
                      </span>
                      <span className="truncate">{level.name}</span>
                    </span>
                    <span
                      className={[
                        'text-xs font-black shrink-0 px-2 py-0.5 rounded-full',
                        levelPct === 100
                          ? 'bg-success text-white'
                          : levelPct > 0
                            ? 'bg-coral-100 text-coral-600'
                            : 'text-ink-400',
                      ].join(' ')}
                    >
                      {levelPct === 100 ? '✓ 100%' : `${levelPct}%`}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="flex flex-col gap-1 mt-1">
                      {unitStats.map(({ unit: u, done, total }) => (
                        <CurriculumItem
                          key={u.id}
                          unit={u}
                          active={u.id === unitId}
                          done={total > 0 && done >= total}
                          hasPlan={getChineseActivityPlan(u.id).activities.length > 0}
                          doneCount={done}
                          totalCount={total}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <ChinesePhonicsUnitPage embedded />
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
  doneCount,
  totalCount,
}: {
  unit: ChineseUnitSummary;
  active: boolean;
  done: boolean;
  hasPlan: boolean;
  doneCount: number;
  totalCount: number;
}) {
  const titleShort = unit.unitTitle.replace(/^unit\s+\d+:\s*/i, '');
  const baseClass = 'flex items-center gap-2.5 px-2.5 py-2.5 rounded-2xl text-left transition-all';
  return (
    <Link
      to={`/library/phonics/chinese/${unit.id}`}
      className={[
        baseClass,
        active
          ? 'bg-gradient-to-br from-coral-400 to-coral-600 text-white shadow-pop ring-2 ring-white scale-[1.02]'
          : done
            ? 'bg-success/10 text-success-700 hover:bg-success/20 border-2 border-success/20'
            : hasPlan
              ? 'bg-white/70 text-ink-800 hover:bg-white hover:shadow-soft border-2 border-transparent hover:border-cream-200'
              : 'bg-cream-50/60 text-ink-500 hover:bg-white/70 border-2 border-transparent',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex w-8 h-8 rounded-full items-center justify-center text-sm font-black shrink-0 ring-2',
          active
            ? 'bg-white text-coral-600 ring-coral-200'
            : done
              ? 'bg-success text-white ring-white'
              : hasPlan
                ? 'bg-coral-100 text-coral-600 ring-white'
                : 'bg-ink-100 text-ink-400 ring-white',
        ].join(' ')}
      >
        {/* 🔴 복습은 앞 단원과 같은 번호가 되어 "4, 4" 로 보인다 — 트로피로 구분. */}
        {done ? '✓' : unit.isReview ? '🏅' : unit.unitIndexInLevel}
      </span>
      <span className="text-sm sm:text-base font-black truncate break-keep">{titleShort}</span>
      {!hasPlan && !active ? (
        <span className="ml-auto text-[10px] font-bold text-ink-300 shrink-0">준비 중</span>
      ) : (
        !done &&
        doneCount > 0 && (
          <span
            className={`ml-auto shrink-0 text-[11px] font-black tabular-nums ${active ? 'text-white/90' : 'text-coral-500'}`}
          >
            {doneCount}/{totalCount}
          </span>
        )
      )}
    </Link>
  );
}
