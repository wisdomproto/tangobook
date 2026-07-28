import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '@tangobook/shared';
import { Mascot, Chip, AppIcon } from '@/design-system';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import {
  LanguageTabs,
  StorybookReportSection,
  PhonicsReportSection,
  RewardsOverviewCard,
  HoriInventoryCard,
  PlaygroundStatsCard,
  VocabularyTabContent,
  useLearningEvents,
} from '@/features/learning';
import { isDevEmail } from '@/config/dev';

type MainTab = 'activity' | 'storybook' | 'phonics' | 'vocab';

const TAB_DEFS: { id: MainTab; iconSrc: string; labelKey: string }[] = [
  { id: 'activity', iconSrc: 'tab/activity.svg', labelKey: 'reports.tab.activity' },
  { id: 'storybook', iconSrc: 'tab/storybook.svg', labelKey: 'reports.tab.storybook' },
  { id: 'phonics', iconSrc: 'tab/phonics.svg', labelKey: 'reports.tab.phonics' },
  { id: 'vocab', iconSrc: 'tab/vocab.svg', labelKey: 'reports.tab.vocab' },
];

export default function ParentReportsPage() {
  const { t } = useTranslation('auth');
  const { account, activeProfile, profiles, isConfigured } = useAuth();
  const isDev = isDevEmail(account?.email);
  /**
   * 🔴 **리포트에서 아이를 바꾸는 것은 `activeProfile` 을 건드리지 않는다.**
   *    헤더 프로필 칩은 "누가 놀고 있어요?" 를 고르는 장치라, 그걸로 둘째 리포트를 보면
   *    앱 전체가 둘째 모드가 되고 다음날 첫째가 켰을 때 첫째 기록이 둘째에게 붙는다.
   *    여기선 **조회 대상만** 로컬 state 로 갈아 끼운다.
   */
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const viewProfile = profiles.find((p) => p.id === viewProfileId) ?? activeProfile;
  const { data: events = [], isLoading, capped } = useLearningEvents(viewProfile?.id);
  const { data: storybooks = [] } = useStorybooks();
  const [tab, setTab] = useState<MainTab>('storybook');
  const [storybookLang, setStorybookLang] = useState<Lang>('ko');

  // 파닉스는 부모가 보는 탭이다(2026-07-26 재공개) — 어휘·활동 현황만 아직 dev 전용.
  const visibleTabs = TAB_DEFS.filter((t) => t.id === 'storybook' || t.id === 'phonics' || isDev);

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Mascot state="sleeping" size="lg" character="hori" />
        <p className="text-2xl font-black text-ink-900">{t('reports.loginRequired')}</p>
        <p className="text-ink-500 break-keep">{t('reports.loginRequiredDesc')}</p>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Mascot state="thinking" size="lg" character="hori" />
        <p className="text-2xl font-black text-ink-900">{t('reports.selectProfile')}</p>
        <p className="text-sm text-ink-500 text-center max-w-xs">
          {t('reports.selectProfileDesc')}
        </p>
        <a
          href="/parent/profiles"
          className="px-6 py-3 rounded-xl bg-coral-500 text-white font-bold hover:brightness-110"
        >
          {t('reports.goToProfiles')}
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* 헤더는 제목 한 줄 — 숫자·호리는 아래 WeeklyHeroCard 가 담당 (헤더/본문 수치 불일치 방지) */}
      <header>
        <h1 className="font-display text-2xl font-black text-ink-900 break-keep">
          {t('reports.title', { name: viewProfile?.name ?? activeProfile.name })}
        </h1>
        {/* 아이가 둘 이상일 때만 — 리포트 조회 대상 전환(아이 화면의 활성 프로필과 무관). */}
        {profiles.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {profiles.map((p) => {
              const on = (viewProfile?.id ?? activeProfile.id) === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setViewProfileId(p.id)}
                  className={
                    'rounded-full px-4 py-1.5 text-sm font-black transition ' +
                    (on
                      ? 'bg-coral-500 text-white shadow-pop'
                      : 'bg-white text-ink-600 shadow-soft hover:bg-peach-50')
                  }
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* 메인 탭바 — 부모 화면은 동화책만. 개발자 계정은 전체 탭 노출 */}
      {visibleTabs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleTabs.map((tabDef) => (
            <Chip
              key={tabDef.id}
              active={tab === tabDef.id}
              variant="coral"
              icon={<AppIcon src={tabDef.iconSrc} size={22} alt={t(tabDef.labelKey)} />}
              onClick={() => setTab(tabDef.id)}
            >
              {t(tabDef.labelKey)}
            </Chip>
          ))}
        </div>
      )}

      {tab === 'activity' && isDev && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <AppIcon src="section/reward.webp" size={28} alt={t('reports.section.rewards')} />
              <span>{t('reports.section.rewards')}</span>
            </h2>
            <RewardsOverviewCard />
          </section>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HoriInventoryCard />
          </section>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <AppIcon
                src="section/playground.webp"
                size={28}
                alt={t('reports.section.playground')}
              />
              <span>{t('reports.section.playground')}</span>
            </h2>
            <PlaygroundStatsCard events={events} />
          </section>
        </div>
      )}

      {tab === 'storybook' && (
        <section>
          <div className="mb-3 flex items-center justify-end">
            <LanguageTabs value={storybookLang} onChange={setStorybookLang} />
          </div>
          {isLoading ? (
            // 로딩 스켈레톤 — 데이터 오기 전 "0" 이 번쩍이는 것 방지
            <div className="animate-pulse space-y-5">
              <div className="h-48 rounded-3xl bg-peach-100/70" />
              <div className="h-44 rounded-2xl bg-white/70" />
              <div className="h-16 rounded-2xl bg-white/70" />
            </div>
          ) : (
            <StorybookReportSection
              events={events}
              storybooks={storybooks}
              lang={storybookLang}
              capped={capped}
            />
          )}
        </section>
      )}

      {tab === 'phonics' && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <AppIcon src="tab/phonics.svg" size={28} alt={t('reports.section.phonics')} />
            <span>{t('reports.section.phonics')}</span>
          </h2>
          <PhonicsReportSection events={events} storybooks={storybooks} />
        </section>
      )}

      {tab === 'vocab' && isDev && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <AppIcon src="tab/vocab.svg" size={28} alt={t('reports.section.vocab')} />
            <span>{t('reports.section.vocab')}</span>
          </h2>
          <VocabularyTabContent events={events} storybooks={storybooks} />
        </section>
      )}
    </div>
  );
}
