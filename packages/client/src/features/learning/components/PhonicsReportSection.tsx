import { useState } from 'react';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { LanguageTabs } from './LanguageTabs';
import { KoreanPhonicsHeatmap } from './KoreanPhonicsHeatmap';
import { EnglishPhonicsSkillTree } from './EnglishPhonicsSkillTree';
import { PhonicsSummaryCard } from './PhonicsSummaryCard';
import { MasteryLegendCard } from './MasteryLegendCard';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  defaultLang?: Lang;
  /** 한글 격자에서 그릴 레벨 — 랜딩 예시용. 부모 리포트는 안 넘긴다(전 레벨). */
  koLevelIds?: string[];
}

export function PhonicsReportSection({
  events,
  storybooks,
  defaultLang = 'ko',
  koLevelIds,
}: Props) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const filtered = events.filter((e) => !e.metadata?.lang || e.metadata.lang === lang);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LanguageTabs value={lang} onChange={setLang} />
      </div>
      {/* 🔴 첫 화면은 문장 두 줄 + 버튼 — 격자는 열어보고 싶은 부모만 연다. */}
      <PhonicsSummaryCard events={filtered} storybooks={storybooks} lang={lang} />
      {/* 🔴 **기본 펼침** — 접어두니 부모가 학습 현황을 보려면 매번 한 번 더 눌러야 했다.
          접었던 건 8×10 격자가 무겁다는 이유였는데, 격자는 레벨별 토글 뒤에 한 겹 더 있다. */}
      <details open className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <summary className="cursor-pointer text-base font-bold text-ink-900">자세히 보기</summary>
        <div className="mt-3 space-y-3">
          {/* 색이 무슨 뜻인지 표 위에서 한 번 — 없으면 회색과 코랄의 차이를 부모가 추론해야 한다. */}
          <MasteryLegendCard />
          {lang === 'ko' ? (
            <KoreanPhonicsHeatmap events={filtered} storybooks={storybooks} levelIds={koLevelIds} />
          ) : (
            <EnglishPhonicsSkillTree events={filtered} storybooks={storybooks} />
          )}
        </div>
      </details>
    </div>
  );
}
