import { useMemo, useState } from 'react';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { groupByWord } from '../lib/aggregate';
import { LanguageTabs } from './LanguageTabs';
import { VocabularyMasteryCard } from './VocabularyMasteryCard';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  defaultLang?: Lang;
}

/**
 * 어휘 탭 — 한/영 서브탭으로 어휘 마스터리만 분리해서 보여줌.
 * 동화책 + 파닉스 + 게임 모든 소스 통합 (lang 필터만).
 */
export function VocabularyTabContent({ events, storybooks, defaultLang = 'ko' }: Props) {
  const [lang, setLang] = useState<Lang>(defaultLang);

  const filtered = useMemo(
    () => events.filter((e) => !e.metadata?.lang || e.metadata.lang === lang),
    [events, lang]
  );
  const wordStats = useMemo(() => groupByWord(filtered, lang), [filtered, lang]);

  // 파닉스 / 동화책 출처별 카운트
  const { phonicsBookCount, storybookCount } = useMemo(() => {
    const phonicsIds = new Set(storybooks.filter((s) => s.type === 'phonics').map((s) => s.id));
    let phonics = 0;
    let story = 0;
    for (const e of filtered) {
      if (e.event_type !== 'word_exposed' && e.event_type !== 'word_correct') continue;
      if (e.storybook_id && phonicsIds.has(e.storybook_id)) phonics++;
      else story++;
    }
    return { phonicsBookCount: phonics, storybookCount: story };
  }, [filtered, storybooks]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs text-ink-500">
          <span>📖 동화책 {storybookCount}회</span>
          <span>·</span>
          <span>🔤 파닉스 {phonicsBookCount}회</span>
        </div>
        <LanguageTabs value={lang} onChange={setLang} />
      </div>
      <VocabularyMasteryCard stats={wordStats} />
    </div>
  );
}
