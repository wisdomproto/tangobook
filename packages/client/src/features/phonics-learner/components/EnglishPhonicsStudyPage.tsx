import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/design-system';
import {
  getAllEnglishUnits,
  getEnglishActivityPlan,
  getEnglishRequiredActivities,
  type EnglishUnitSummary,
} from '../lib/english-phonics-units';
import { usePhonicsProgress, getRecentUnit, markRecentUnit } from '../lib/progress-store';
import EnglishPhonicsUnitPage from './EnglishPhonicsUnitPage';

/**
 * /library/phonics/english(/:unitId)? — 영어 파닉스 학습 모드.
 *
 * 한글 (`KoreanPhonicsStudyPage`) 평행 구조. 좌측 커리큘럼 (Book 1~5) + 우측 unit body.
 * 활동 plan 은 아직 미구성 — 모든 unit "활동 준비 중" 표시.
 */
export default function EnglishPhonicsStudyPage() {
  const { unitId } = useParams<{ unitId?: string }>();
  const navigate = useNavigate();
  const allUnits = useMemo(() => getAllEnglishUnits(), []);
  const { isUnitDone } = usePhonicsProgress('english');
  // 모바일: 커리큘럼 사이드바를 슬라이드 드로어로 (좁은 화면에서 고정 사이드바가 절반 차지 방지)
  const [navOpen, setNavOpen] = useState(false);

  // ── Hooks (early return 이전에 모두 호출) ──
  useEffect(() => {
    if (unitId) markRecentUnit('english', unitId);
    setNavOpen(false); // 단원 선택 시 모바일 드로어 닫기
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

  // unitId 없으면 recent → 첫 unit 으로 redirect. plan 아직 없으니 첫 unit (en-b1-u01) 으로.
  if (!unitId) {
    const recent = getRecentUnit('english');
    const recentValid = recent && allUnits.some((u) => u.id === recent);
    const target = (recentValid ? recent : null) ?? allUnits[0]?.id;
    if (target) {
      return <Navigate to={`/library/phonics/english/${target}`} replace />;
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
    const map = new Map<string, { name: string; units: EnglishUnitSummary[] }>();
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
          <span className="text-coral-600">영어</span>
          <span>파닉스</span>
        </span>
      </PageHeader>

      <div className="flex-1 min-h-0 flex mt-2">
        {/* 모바일: 드로어 백드롭 */}
        {navOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
        )}
        {/* 좌측 — 커리큘럼. 데스크톱=인라인 사이드바 / 모바일=슬라이드 드로어 */}
        <aside
          className={`overflow-y-auto py-4 px-2.5 sm:px-3 bg-white/95 backdrop-blur fixed left-0 top-0 bottom-0 z-40 w-72 max-w-[85vw] shadow-xl ${navOpen ? 'block' : 'hidden'} md:block md:static md:z-auto md:w-64 md:h-full md:max-w-none md:shadow-none md:border-r md:border-cream-200/80 md:bg-white/85`}
        >
          {/* 모바일 닫기 헤더 */}
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
              const totalUnits = level.units.length;
              const playableCount = level.units.filter(
                (u) => getEnglishActivityPlan(u.id).activities.length > 0
              ).length;
              return (
                <section key={levelKey}>
                  <button
                    onClick={() => toggleLevel(levelKey)}
                    aria-expanded={isExpanded}
                    className="w-full flex items-center justify-between gap-2 text-lg sm:text-xl font-black font-display text-ink-900 px-2.5 py-2.5 sticky top-0 bg-white/95 backdrop-blur z-10 rounded-lg hover:bg-cream-50 transition"
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
                    <span className="text-xs font-bold text-ink-500 shrink-0">
                      {playableCount}/{totalUnits}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="flex flex-col gap-1 mt-1">
                      {level.units.map((u) => {
                        const plan = getEnglishActivityPlan(u.id);
                        const hasPlan = plan.activities.length > 0;
                        const required = getEnglishRequiredActivities(u.id);
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
                  )}
                </section>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <EnglishPhonicsUnitPage embedded />
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
  unit: EnglishUnitSummary;
  active: boolean;
  done: boolean;
  hasPlan: boolean;
}) {
  // 영어 unit title 예: "Unit 01: Aa Bb Cc" → 앞 "Unit 01: " 제거
  const titleShort = unit.unitTitle.replace(/^unit\s+\d+:\s*/i, '');
  const baseClass = 'flex items-center gap-2.5 px-2.5 py-2.5 rounded-2xl text-left transition-all';
  // 모든 unit 클릭 가능 (계획 없어도 진입 — UnitPage 에서 "준비 중" 메시지). 사이드바 상의 시각만 옅게.
  return (
    <Link
      to={`/library/phonics/english/${unit.id}`}
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
        {done ? '✓' : unit.unitIndexInLevel}
      </span>
      <span className="text-sm sm:text-base font-black truncate break-keep">{titleShort}</span>
      {!hasPlan && !active && (
        <span className="ml-auto text-[10px] font-bold text-ink-300 shrink-0">준비 중</span>
      )}
    </Link>
  );
}
