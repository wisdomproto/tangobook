import { useState } from 'react';
import type { Lang } from '@tangobook/shared';
import { Mascot } from '@/design-system';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import {
  LanguageTabs,
  StorybookReportSection,
  PhonicsReportSection,
  RewardsOverviewCard,
  CollectionProgressCard,
  HoriInventoryCard,
  PlaygroundStatsCard,
  useLearningEvents,
} from '@/features/learning';

export default function ParentReportsPage() {
  const { activeProfile, isConfigured } = useAuth();
  const { data: events = [], isLoading } = useLearningEvents(activeProfile?.id);
  const { data: storybooks = [] } = useStorybooks();
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
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6">
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

      <section>
        <h2 className="mb-3 text-lg font-bold">⭐ 보상 현황</h2>
        <RewardsOverviewCard />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollectionProgressCard />
        <HoriInventoryCard />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">🎪 놀이터 활동</h2>
        <PlaygroundStatsCard events={events} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">📖 동화책</h2>
          <LanguageTabs value={storybookLang} onChange={setStorybookLang} />
        </div>
        <StorybookReportSection events={events} storybooks={storybooks} lang={storybookLang} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">🔤 파닉스</h2>
        <PhonicsReportSection events={events} storybooks={storybooks} />
      </section>
    </div>
  );
}
