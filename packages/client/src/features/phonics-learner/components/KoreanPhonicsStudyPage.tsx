import { useEffect, useMemo, useState } from 'react';
import { koreanLearningUnitId } from '@tangobook/shared';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, courseThemes } from '@/design-system';
import { CurriculumNavigation, CurriculumLevelTitle } from './CurriculumNavigation';
import { useSeo } from '@/lib/useSeo';
import {
  getAllKoreanUnits,
  getActivityPlan,
  getRequiredActivities,
  type KoreanUnitSummary,
} from '../lib/korean-phonics-units';
import { usePhonicsProgress, getRecentUnit, markRecentUnit } from '../lib/progress-store';
import { sumProgress } from '../lib/unit-progress';
import { levelName, unitTitle } from '../lib/activity-title';
import KoreanPhonicsUnitPage from './KoreanPhonicsUnitPage';
import { PhonicsBackdrop } from './PhonicsBackdrop';
import { ToyHangul } from './ToyHangul';

/**
 * /library/phonics/korean(/:unitId)? — 한글 파닉스 학습 모드.
 *
 * AppShell 안 학습 화면. 좌측: 전체 커리큘럼 스크롤 list (한글1~4 + units).
 * 우측: 선택된 unit 의 활동 그리드 (KoreanPhonicsUnitPage 임베디드).
 *
 * 진입 시 URL 에 unitId 없으면 → localStorage recent unit 또는 첫 활성 unit 으로 redirect.
 */
const theme = courseThemes.korean;

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
      (recentValid ? koreanLearningUnitId(recent) : null) ??
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
            className={`inline-block mt-3 font-black underline ${theme.text} ${theme.focus}`}
          >
            {t('common.backToPickerLong')}
          </Link>
        </div>
      </div>
    );
  }

  if (unitId === 'kr-h1-u01')
    return <Navigate to={`/library/phonics/korean/${koreanLearningUnitId(unitId)}`} replace />;

  // 레벨별 그룹 (사이드바)
  const byLevel = (() => {
    const map = new Map<string, { name: string; units: KoreanUnitSummary[] }>();
    for (const u of allUnits) {
      if (!map.has(u.levelKey)) map.set(u.levelKey, { name: levelName(t, u), units: [] });
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
      style={theme.style}
      className="phonics-course-page relative flex h-[calc(100dvh-133px-env(safe-area-inset-bottom))] flex-col bg-cream-50 md:h-[calc(100dvh-73px)]"
    >
      <PhonicsBackdrop />
      {/* 상단 헤더 — 동화책/어휘 학습 페이지와 동일 PageHeader 패턴 (흰 wash 카드 + peach pill) */}
      <PageHeader
        onBack={() => navigate('/library')}
        backLabel={t('common.home')}
        right={
          <button
            type="button"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
            className="md:hidden px-4 py-2.5 rounded-full bg-white/90 text-ink-800 font-black text-sm shadow-soft flex items-center gap-1.5 min-h-[44px]"
          >
            ☰ <span>{t('common.unitTab')}</span>
          </button>
        }
      >
        <span className="inline-flex items-center gap-2">
          <span className={theme.text}>{t('study.koreanLead')}</span>
          <span>{t('common.phonics')}</span>
        </span>
      </PageHeader>

      <div className="flex-1 min-h-0 flex mt-2">
        <CurriculumNavigation language="korean" open={navOpen} onClose={() => setNavOpen(false)}>
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
                    className={`w-full flex min-h-16 items-center justify-between gap-2 border border-ink-100 bg-cream-50/70 px-2.5 py-3 rounded-xl hover:bg-cream-100 transition ${theme.focus}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`inline-block transition-transform text-ink-500 ${isExpanded ? 'rotate-90' : ''}`}
                        aria-hidden
                      >
                        ▸
                      </span>
                      <CurriculumLevelTitle name={level.name} />
                    </span>
                    <span
                      className={[
                        'text-xs font-black shrink-0 px-2 py-0.5 rounded-full',
                        levelPct === 100
                          ? 'bg-mint-100 text-mint-700'
                          : levelPct > 0
                            ? theme.badge
                            : 'text-ink-600',
                      ].join(' ')}
                    >
                      {levelPct === 100 ? '✓ 100%' : `${levelPct}%`}
                    </span>
                  </button>
                  {isExpanded && (
                    <div
                      className={
                        levelKey === 'hangul-vowels'
                          ? 'phonics-vowel-unit-grid'
                          : 'flex flex-col gap-1 mt-1'
                      }
                    >
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
        </CurriculumNavigation>

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
  const baseClass = `flex min-h-12 items-center gap-2.5 px-2.5 py-2.5 rounded-card text-left border-2 transition-colors ${theme.focus}`;
  if (unit.levelKey === 'hangul-vowels')
    return (
      <Link
        to={`/library/phonics/korean/${unit.id}`}
        aria-label={titleShort}
        aria-current={active ? 'page' : undefined}
        className={`phonics-vowel-unit ${active ? theme.selected : 'bg-white/80 border-transparent'} ${theme.focus}`}
      >
        <ToyHangul text={unit.phonemes[0]} decorative />
        <span>{unit.phonemes[0]}</span>
        {done && (
          <span className="text-mint-700" aria-label={t('study.activityDone')}>
            ✓
          </span>
        )}
      </Link>
    );
  if (!hasPlan) {
    return (
      <div
        className={`${baseClass} bg-cream-50/60 text-ink-600 cursor-not-allowed opacity-70 select-none`}
        aria-disabled="true"
      >
        <span className="inline-flex w-7 h-7 rounded-full bg-ink-100 text-ink-600 items-center justify-center text-xs font-black shrink-0">
          {unit.unitIndexInLevel}
        </span>
        <span className="text-sm font-bold truncate">{titleShort}</span>
        <span className="ml-auto text-xs font-bold text-ink-600">{t('common.comingSoon')}</span>
      </div>
    );
  }
  return (
    <Link
      to={`/library/phonics/korean/${unit.id}`}
      aria-current={active ? 'page' : undefined}
      className={[
        baseClass,
        active
          ? theme.selected
          : done
            ? 'bg-success/10 text-success-700 hover:bg-success/20 border-2 border-success/20'
            : 'bg-white/70 text-ink-800 hover:bg-white hover:shadow-soft border-2 border-transparent hover:border-cream-200',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex w-8 h-8 rounded-full items-center justify-center text-sm font-black shrink-0 ring-2',
          active
            ? `bg-white ${theme.text} ${theme.ring}`
            : done
              ? 'bg-mint-100 text-mint-700 ring-white'
              : `${theme.badge} ring-white`,
        ].join(' ')}
      >
        {/* 🔴 복습은 번호를 쓰지 않는다 — 앞 단원과 같은 번호가 되어 "5, 5" 로 보인다. 트로피로 구분. */}
        {done ? (
          '✓'
        ) : unit.isReview ? (
          '🏅'
        ) : (
          <ToyHangul text={unit.phonemes[0]} decorative className="!w-7 !h-7" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-sm sm:text-base font-bold leading-snug break-keep">
        {titleShort}
      </span>
      {/* 하다 만 단원만 n/N — 0 이면 아직 안 연 것이라 모든 줄에 '0/4' 를 달면 소음이다.
          다 한 단원은 왼쪽 ✓ 로 충분하다. */}
      {!done && doneCount > 0 && (
        <span className={`ml-auto shrink-0 text-xs font-black tabular-nums ${theme.text}`}>
          {doneCount}/{totalCount}
        </span>
      )}
    </Link>
  );
}
