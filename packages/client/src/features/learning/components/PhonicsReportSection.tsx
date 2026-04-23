import { useState } from 'react';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { LanguageTabs } from './LanguageTabs';
import { KoreanPhonicsHeatmap } from './KoreanPhonicsHeatmap';
import { EnglishPhonicsSkillTree } from './EnglishPhonicsSkillTree';

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
      {lang === 'ko' ? (
        <KoreanPhonicsHeatmap events={filtered} storybooks={storybooks} />
      ) : (
        <EnglishPhonicsSkillTree events={filtered} storybooks={storybooks} />
      )}
    </div>
  );
}
