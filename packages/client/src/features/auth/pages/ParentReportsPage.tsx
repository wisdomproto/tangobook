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

type MainTab = 'activity' | 'storybook' | 'phonics' | 'vocab';

const TAB_DEFS: { id: MainTab; iconSrc: string; label: string }[] = [
  { id: 'activity', iconSrc: 'tab/activity.svg', label: '활동 현황' },
  { id: 'storybook', iconSrc: 'tab/storybook.svg', label: '동화책' },
  { id: 'phonics', iconSrc: 'tab/phonics.svg', label: '파닉스' },
  { id: 'vocab', iconSrc: 'tab/vocab.svg', label: '어휘' },
];

export default function ParentReportsPage() {
  const { activeProfile, isConfigured } = useAuth();
  const { data: events = [], isLoading } = useLearningEvents(activeProfile?.id);
  const { data: storybooks = [] } = useStorybooks();
  const [tab, setTab] = useState<MainTab>('activity');
  const [storybookLang, setStorybookLang] = useState<Lang>('ko');

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Mascot state="sleeping" size="lg" character="hori" />
        <p className="text-2xl font-black text-ink-900">로그인이 필요해요</p>
        <p className="text-ink-500">Supabase 설정 후 가입하시면 학습 리포트를 볼 수 있어요</p>
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
      <header>
        <div className="flex items-center gap-3">
          <Mascot state="reading" size="md" character="hori" />
          <div>
            <h1 className="text-2xl font-black text-ink-900">📊 {activeProfile.name} 학습 현황</h1>
            <p className="text-sm text-ink-500">
              {isLoading ? '불러오는 중…' : `최근 이벤트 ${events.length}건`}
            </p>
          </div>
        </div>
      </header>

      {/* 메인 탭바 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TAB_DEFS.map((t) => (
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

      {tab === 'activity' && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <AppIcon src="section/reward.png" size={28} alt="보상" />
              <span>보상 현황</span>
            </h2>
            <RewardsOverviewCard />
          </section>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HoriInventoryCard />
          </section>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <AppIcon src="section/playground.png" size={28} alt="놀이터" />
              <span>놀이터 활동</span>
            </h2>
            <PlaygroundStatsCard events={events} />
          </section>
        </div>
      )}

      {tab === 'storybook' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <AppIcon src="tab/storybook.svg" size={28} alt="동화책" />
              <span>동화책</span>
            </h2>
            <LanguageTabs value={storybookLang} onChange={setStorybookLang} />
          </div>
          <StorybookReportSection events={events} storybooks={storybooks} lang={storybookLang} />
        </section>
      )}

      {tab === 'phonics' && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <AppIcon src="tab/phonics.svg" size={28} alt="파닉스" />
            <span>파닉스</span>
          </h2>
          <PhonicsReportSection events={events} storybooks={storybooks} />
        </section>
      )}

      {tab === 'vocab' && (
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
