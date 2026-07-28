import { useState } from 'react';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { LanguageTabs } from './LanguageTabs';
import { KoreanPhonicsHeatmap } from './KoreanPhonicsHeatmap';
import { EnglishPhonicsSkillTree } from './EnglishPhonicsSkillTree';
import { PhonicsSummaryCard } from './PhonicsSummaryCard';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  defaultLang?: Lang;
}

export function PhonicsReportSection({ events, storybooks, defaultLang = 'ko' }: Props) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const filtered = events.filter((e) => !e.metadata?.lang || e.metadata.lang === lang);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LanguageTabs value={lang} onChange={setLang} />
      </div>
      {/* 🔴 첫 화면은 문장 두 줄 + 버튼 — 격자는 열어보고 싶은 부모만 연다. */}
      <PhonicsSummaryCard events={filtered} storybooks={storybooks} lang={lang} />
      <details className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <summary className="cursor-pointer text-base font-bold text-ink-900">자세히 보기</summary>
        <div className="mt-3">
          {lang === 'ko' ? (
            <KoreanPhonicsHeatmap events={filtered} storybooks={storybooks} />
          ) : (
            <EnglishPhonicsSkillTree events={filtered} storybooks={storybooks} />
          )}
        </div>
      </details>
    </div>
  );
}
