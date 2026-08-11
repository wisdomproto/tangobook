import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { sumProgress } from '../lib/unit-progress';
import { unitTitle } from '../lib/activity-title';
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
  const { t } = useTranslation('phonics');
  const { unitId } = useParams<{ unitId?: string }>();
  const navigate = useNavigate();
  const allUnits = useMemo(() => getAllKoreanUnits(), []);
  const { unitCompletedActivities } = usePhonicsProgress('korean');
  // 모바일: 커리큘럼 사이드바를 슬라이드 드로어로 (좁은 화면에서 고정 사이드바가 절반 차지 방지)
  const [navOpen, setNavOpen] = useState(false);

  useSeo({
    title: t('seo.koreanTitle'),
    description: t('seo.koreanDescription'),
    path: '/library/phonics/korean',
    keywords: t('seo.koreanKeywords'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: t('seo.koreanJsonLdName'),
      description: t('seo.koreanJsonLdDescription'),
      url: 'https://www.tangobook.co.kr/library/phonics/korean',
      educationalLevel: t('seo.educationalLevel'),
      educationalUse: t('seo.educationalUse'),
      // 🔴 배우는 **내용**은 한국어 그대로다 — UI 언어가 바뀌어도 콘텐츠 언어는 안 바뀐다.
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
    setNavOpen(false); // 단원 선택 시 모바일 드로어 닫기
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
          <p className="text-base font-bold text-ink-700">{t('common.noUnitsYet')}</p>
          <Link
            to="/library/phonics"
            className="inline-block mt-3 text-coral-600 font-black underline"
          >
            {t('common.backToPickerLong')}
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
      <PageHeader
        onBack={() => navigate('/library')}
        backLabel={t('common.home')}
        right={
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="md:hidden px-4 py-2.5 rounded-full bg-white/90 text-ink-800 font-black text-sm shadow-soft flex items-center gap-1.5 min-h-[44px]"
          >
            ☰ <span>{t('common.unitTab')}</span>
          </button>
        }
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-coral-600">{t('study.koreanLead')}</span>
          <span>{t('common.phonics')}</span>
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
            <span className="font-black font-display text-ink-900 text-lg">
              {t('common.unitPicker')}
            </span>
            <button
              onClick={() => setNavOpen(false)}
              aria-label={t('common.close')}
              className="w-9 h-9 rounded-full bg-cream-100 text-ink-700 font-black"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-5">
            {byLevel.map(([levelKey, level]) => {
              const isExpanded = expandedLevels.has(levelKey);
              // 단원별 진행 = 완료한 required 활동 / 전체 required 활동.
              const unitStats = level.units.map((u) => {
                const required = getRequiredActivities(u.id);
                const doneKeys = unitCompletedActivities(u.id);
                return {
                  unit: u,
                  done: required.filter((k) => doneKeys.includes(k)).length,
                  total: required.length,
                };
              });
              // 🔴 레벨 머리글 숫자는 예전엔 "활동 있는 단원 수/전체 단원 수"(항상 18/18)라 아무 정보가
              //    없었다. 아이가 알고 싶은 건 "얼마나 했나"다 → 진행률 %.
              const levelPct = sumProgress(unitStats).percent;
              return (
                <section key={levelKey}>
                  <button
                    onClick={() => toggleLevel(levelKey)}
                    aria-expanded={isExpanded}
                    // 🔴 sticky 금지 — 레벨 머리글이 상단에 붙어 있으면 스크롤 중 단원 위에 얹혀 가린다.
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
                          hasPlan={getActivityPlan(u.id).activities.length > 0}
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
  doneCount,
  totalCount,
}: {
  unit: KoreanUnitSummary;
  active: boolean;
  done: boolean;
  hasPlan: boolean;
  doneCount: number;
  totalCount: number;
}) {
  const { t } = useTranslation('phonics');
  const titleShort = unitTitle(t, unit).replace(/^unit\s+\d+:\s*/i, '');
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
        <span className="ml-auto text-[10px] font-bold text-ink-300">{t('common.comingSoon')}</span>
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
        {/* 🔴 복습은 번호를 쓰지 않는다 — 앞 단원과 같은 번호가 되어 "5, 5" 로 보인다. 트로피로 구분. */}
        {done ? '✓' : unit.isReview ? '🏅' : unit.unitIndexInLevel}
      </span>
      <span className="text-sm sm:text-base font-black truncate break-keep">{titleShort}</span>
      {/* 하다 만 단원만 n/N — 0 이면 아직 안 연 것이라 모든 줄에 '0/4' 를 달면 소음이다.
          다 한 단원은 왼쪽 ✓ 로 충분하다. */}
      {!done && doneCount > 0 && (
        <span
          className={`ml-auto shrink-0 text-[11px] font-black tabular-nums ${active ? 'text-white/90' : 'text-coral-500'}`}
        >
          {doneCount}/{totalCount}
        </span>
      )}
    </Link>
  );
}
