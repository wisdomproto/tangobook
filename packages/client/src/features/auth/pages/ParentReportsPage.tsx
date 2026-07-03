import { useState } from 'react';
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

const TAB_DEFS: { id: MainTab; iconSrc: string; label: string }[] = [
  { id: 'activity', iconSrc: 'tab/activity.svg', label: '활동 현황' },
  { id: 'storybook', iconSrc: 'tab/storybook.svg', label: '동화책' },
  { id: 'phonics', iconSrc: 'tab/phonics.svg', label: '파닉스' },
  { id: 'vocab', iconSrc: 'tab/vocab.svg', label: '어휘' },
];

export default function ParentReportsPage() {
  const { account, activeProfile, isConfigured } = useAuth();
  const isDev = isDevEmail(account?.email);
  const { data: events = [], isLoading } = useLearningEvents(activeProfile?.id);
  const { data: storybooks = [] } = useStorybooks();
  const [tab, setTab] = useState<MainTab>('storybook');
  const [storybookLang, setStorybookLang] = useState<Lang>('ko');

  const visibleTabs = TAB_DEFS.filter((t) => t.id === 'storybook' || isDev);

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Mascot state="sleeping" size="lg" character="hori" />
        <p className="text-2xl font-black text-ink-900">로그인이 필요해요</p>
        <p className="text-ink-500 break-keep">로그인하면 아이의 독서 기록을 볼 수 있어요</p>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Mascot state="thinking" size="lg" character="hori" />
        <p className="text-2xl font-black text-ink-900">프로필을 먼저 선택해주세요</p>
        <p className="text-sm text-ink-500 text-center max-w-xs">
          자녀 프로필 페이지에서 카드를 탭해서 활성 프로필로 선택하세요.
        </p>
        <a
          href="/parent/profiles"
          className="px-6 py-3 rounded-xl bg-coral-500 text-white font-bold hover:brightness-110"
        >
          👦 프로필 관리로 가기
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* 헤더는 제목 한 줄 — 숫자·호리는 아래 WeeklyHeroCard 가 담당 (헤더/본문 수치 불일치 방지) */}
      <header>
        <h1 className="font-display text-2xl font-black text-ink-900 break-keep">
          {activeProfile.name}의 책 이야기
        </h1>
      </header>

      {/* 메인 탭바 — 부모 화면은 동화책만. 개발자 계정은 전체 탭 노출 */}
      {visibleTabs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleTabs.map((t) => (
            <Chip
              key={t.id}
              active={tab === t.id}
              variant="coral"
              icon={<AppIcon src={t.iconSrc} size={22} alt={t.label} />}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      )}

      {tab === 'activity' && isDev && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <AppIcon src="section/reward.webp" size={28} alt="보상" />
              <span>보상 현황</span>
            </h2>
            <RewardsOverviewCard />
          </section>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HoriInventoryCard />
          </section>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <AppIcon src="section/playground.webp" size={28} alt="놀이터" />
              <span>놀이터 활동</span>
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
            <StorybookReportSection events={events} storybooks={storybooks} lang={storybookLang} />
          )}
        </section>
      )}

      {tab === 'phonics' && isDev && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <AppIcon src="tab/phonics.svg" size={28} alt="파닉스" />
            <span>파닉스</span>
          </h2>
          <PhonicsReportSection events={events} storybooks={storybooks} />
        </section>
      )}

      {tab === 'vocab' && isDev && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <AppIcon src="tab/vocab.svg" size={28} alt="어휘" />
            <span>어휘</span>
          </h2>
          <VocabularyTabContent events={events} storybooks={storybooks} />
        </section>
      )}
    </div>
  );
}
