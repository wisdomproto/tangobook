import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/design-system';
import { useSeo } from '@/lib/useSeo';
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

  useSeo({
    title: '한글 파닉스 학습 — 탱고북',
    description:
      '한글 자음·모음·받침을 4-5세 입문자에게 친숙한 카드 + 게임으로 학습. 동화 단어와 자동 연결되는 한글 파닉스 학습.',
    path: '/library/phonics/korean',
    keywords:
      '한글 파닉스, 한글 학습, 자음 모음, 한글 받침, 한글 블렌딩, 4세 한글, 5세 한글, 6세 한글, 탱고북',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: '한글 파닉스 학습',
      description: '한글 자음·모음·받침 + 블렌딩 + 받침 학습 unit 컬렉션',
      url: 'https://www.tangobook.co.kr/library/phonics/korean',
      educationalLevel: '유아',
      educationalUse: '한글 읽기, 파닉스, 어휘 학습',
      inLanguage: ['ko'],
      provider: {
        '@type': 'Organization',
        name: '탱고북',
        url: 'https://www.tangobook.co.kr/',
      },
    },
  });

  // ── Hooks (early return 이전에 모두 호출) ──
  useEffect(() => {
    if (unitId) markRecentUnit('korean', unitId);
  }, [unitId]);

  const currentLevelKey = allUnits.find((u) => u.id === unitId)?.levelKey;
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
    () => new Set(currentLevelKey ? [currentLevelKey] : [])
  );
  // URL 의 unit 이 바뀌면 그 레벨 자동 펼침.
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
      {/* 상단 헤더 — 동화책/어휘 학습 페이지와 동일 PageHeader 패턴 (흰 wash 카드 + peach pill) */}
      <PageHeader onBack={() => navigate('/library')} backLabel="홈">
        <span className="inline-flex items-center gap-2">
          <span className="text-coral-600">한글</span>
          <span>파닉스</span>
        </span>
      </PageHeader>

      <div className="flex-1 min-h-0 flex mt-2">
        {/* 좌측 — 커리큘럼 스크롤 list */}
        <aside className="w-48 sm:w-56 md:w-64 shrink-0 h-full overflow-y-auto border-r border-cream-200/80 bg-white/85 backdrop-blur py-4 px-2.5 sm:px-3">
          <div className="flex flex-col gap-5">
            {byLevel.map(([levelKey, level]) => {
              const isExpanded = expandedLevels.has(levelKey);
              const totalUnits = level.units.length;
              const playableCount = level.units.filter(
                (u) => getActivityPlan(u.id).activities.length > 0
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
                  )}
                </section>
              );
            })}
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
  const baseClass = 'flex items-center gap-2.5 px-2.5 py-2.5 rounded-2xl text-left transition-all';
  if (!hasPlan) {
    return (
      <div
        className={`${baseClass} bg-cream-50/60 text-ink-400 cursor-not-allowed opacity-70 select-none`}
        aria-disabled="true"
      >
        <span className="inline-flex w-7 h-7 rounded-full bg-ink-100 text-ink-400 items-center justify-center text-xs font-black shrink-0">
          {unit.unitIndexInLevel}
        </span>
        <span className="text-sm font-bold truncate">{titleShort}</span>
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
          ? 'bg-gradient-to-br from-coral-400 to-coral-600 text-white shadow-pop ring-2 ring-white scale-[1.02]'
          : done
            ? 'bg-success/10 text-success-700 hover:bg-success/20 border-2 border-success/20'
            : 'bg-white/70 text-ink-800 hover:bg-white hover:shadow-soft border-2 border-transparent hover:border-cream-200',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex w-8 h-8 rounded-full items-center justify-center text-sm font-black shrink-0 ring-2',
          active
            ? 'bg-white text-coral-600 ring-coral-200'
            : done
              ? 'bg-success text-white ring-white'
              : 'bg-coral-100 text-coral-600 ring-white',
        ].join(' ')}
      >
        {done ? '✓' : unit.unitIndexInLevel}
      </span>
      <span className="text-sm sm:text-base font-black truncate break-keep">{titleShort}</span>
    </Link>
  );
}
