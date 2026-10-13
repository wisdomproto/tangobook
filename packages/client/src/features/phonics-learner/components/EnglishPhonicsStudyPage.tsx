import { PhonicsLearningModes } from './PhonicsLearningModes';
import { useEffect, useMemo, useState } from 'react';
import { PhonicsBackdrop } from './PhonicsBackdrop';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, courseThemes } from '@/design-system';
import { CurriculumNavigation, CurriculumLevelTitle } from './CurriculumNavigation';
import {
  getAllEnglishUnits,
  getEnglishActivityPlan,
  getEnglishRequiredActivities,
  type EnglishUnitSummary,
} from '../lib/english-phonics-units';
import { usePhonicsProgress, markRecentUnit } from '../lib/progress-store';
import { levelName, unitTitle } from '../lib/activity-title';
import { sumProgress } from '../lib/unit-progress';
import EnglishPhonicsUnitPage from './EnglishPhonicsUnitPage';

/**
 * /library/phonics/english(/:unitId)? — 영어 파닉스 학습 모드.
 *
 * 한글 (`KoreanPhonicsStudyPage`) 평행 구조. 좌측 커리큘럼 (Book 1~5) + 우측 unit body.
 * 언어 진입은 커리큘럼/자유모드 선택. 기존 단원 URL은 자유 선택 화면이다.
 */
const theme = courseThemes.english;

export default function EnglishPhonicsStudyPage() {
  const { t } = useTranslation('phonics');
  const { unitId } = useParams<{ unitId?: string }>();
  const navigate = useNavigate();
  const allUnits = useMemo(() => getAllEnglishUnits(), []);
  const { unitCompletedActivities } = usePhonicsProgress('english');
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

  // 언어 안에서 모드 선택 (hooks 후).
  if (!unitId) return <PhonicsLearningModes lang="english" />;

  const byLevel = (() => {
    const map = new Map<string, { name: string; units: EnglishUnitSummary[] }>();
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
      data-storybook-language="english"
      className="phonics-course-page relative flex h-[calc(100dvh-133px-env(safe-area-inset-bottom))] flex-col bg-cream-50 md:h-[calc(100dvh-73px)]"
    >
      <PhonicsBackdrop />
      <PageHeader
        onBack={() => navigate('/library/phonics/english')}
        backLabel={t('journey.chooseMode')}
        right={
          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-bold ${theme.badge}`}
            >
              {t('journey.free')}
            </span>
            <button
              type="button"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
              className="md:hidden px-4 py-2.5 rounded-full bg-white/90 text-ink-800 font-black text-sm shadow-soft flex items-center gap-1.5 min-h-[44px]"
            >
              ☰ <span>{t('common.unitTab')}</span>
            </button>
          </div>
        }
      >
        <span className="inline-flex items-center gap-2">
          <span className={theme.text}>{t('study.englishLead')}</span>
          <span className="hidden sm:inline">{t('common.phonics')}</span>
          <span className="text-base sm:hidden">{t('journey.free')}</span>
        </span>
      </PageHeader>

      <div className="flex-1 min-h-0 flex mt-2">
        <CurriculumNavigation language="english" open={navOpen} onClose={() => setNavOpen(false)}>
          <div className="flex flex-col gap-5">
            {byLevel.map(([levelKey, level]) => {
              const isExpanded = expandedLevels.has(levelKey);
              const unitStats = level.units.map((u) => {
                const required = getEnglishRequiredActivities(u.id);
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
                    <div className="flex flex-col gap-1 mt-1">
                      {unitStats.map(({ unit: u, done, total }) => (
                        <CurriculumItem
                          key={u.id}
                          unit={u}
                          active={u.id === unitId}
                          done={total > 0 && done >= total}
                          hasPlan={getEnglishActivityPlan(u.id).activities.length > 0}
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
  doneCount,
  totalCount,
}: {
  unit: EnglishUnitSummary;
  active: boolean;
  done: boolean;
  hasPlan: boolean;
  doneCount: number;
  totalCount: number;
}) {
  // 영어 unit title 예: "Unit 01: Aa Bb Cc" → 앞 "Unit 01: " 제거
  const { t } = useTranslation('phonics');
  const titleShort = unitTitle(t, unit).replace(/^unit\s+\d+:\s*/i, '');
  const baseClass = `flex min-h-12 items-center gap-2.5 px-2.5 py-2.5 rounded-card text-left border-2 transition-colors ${theme.focus}`;
  // 모든 unit 클릭 가능 (계획 없어도 진입 — UnitPage 에서 "준비 중" 메시지). 사이드바 상의 시각만 옅게.
  return (
    <Link
      to={`/library/phonics/english/${unit.id}`}
      aria-current={active ? 'page' : undefined}
      className={[
        baseClass,
        active
          ? theme.selected
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
            ? `bg-white ${theme.text} ${theme.ring}`
            : done
              ? 'bg-mint-100 text-mint-700 ring-white'
              : hasPlan
                ? `${theme.badge} ring-white`
                : 'bg-ink-100 text-ink-600 ring-white',
        ].join(' ')}
      >
        {/* 🔴 복습은 앞 단원과 번호가 같아 숫자를 쓰면 "4, 4" 로 보인다 — 트로피로 구분. */}
        {done ? '✓' : unit.isReview ? '🏅' : unit.unitIndexInLevel}
      </span>
      <span className="min-w-0 flex-1 text-sm sm:text-base font-bold leading-snug break-keep">
        {titleShort}
      </span>
      {!hasPlan && !active ? (
        <span className="ml-auto text-xs font-bold text-ink-600 shrink-0">
          {t('common.comingSoon')}
        </span>
      ) : (
        // 하다 만 단원만 n/N — 0 이면 아직 안 연 것이라 모든 줄에 '0/4' 를 달면 소음이다.
        !done &&
        doneCount > 0 && (
          <span className={`ml-auto shrink-0 text-xs font-black tabular-nums ${theme.text}`}>
            {doneCount}/{totalCount}
          </span>
        )
      )}
    </Link>
  );
}
