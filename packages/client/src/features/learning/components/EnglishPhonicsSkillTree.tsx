import { useMemo, useState } from 'react';
import type { LearningEvent, StorybookSummary } from '@tangobook/shared';
import { computeMastery, masteryState, type MasteryState } from '../lib/mastery';
import { groupByPhoneme, groupByWord } from '../lib/aggregate';
import { ENGLISH_PHONICS_BOOKS, type EnglishBookId } from '../lib/english-phonics-skills';
import { readPhonicsUnitIds, englishBookProgress } from '../lib/phonics-progress';
import { MasteryBadge } from './MasteryBadge';
import { MasteryDistributionBar } from './MasteryDistributionBar';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
}

export function EnglishPhonicsSkillTree({ events, storybooks }: Props) {
  const phonemeStats = useMemo(() => groupByPhoneme(events), [events]);
  const wordStats = useMemo(() => groupByWord(events, 'en'), [events]);
  const readUnits = useMemo(() => readPhonicsUnitIds(events, storybooks), [events, storybooks]);
  const [openBook, setOpenBook] = useState<EnglishBookId | null>('book1');
  const now = Date.now();

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ENGLISH_PHONICS_BOOKS.map((b) => {
        const counts: Record<MasteryState, number> = {
          unknown: 0,
          seen: 0,
          practiced: 0,
          mastered: 0,
        };
        for (const p of b.phonemes) {
          const s = phonemeStats.get(p);
          const m = s ? computeMastery(s, now) : 0;
          counts[masteryState(m)]++;
        }
        const masteredPct = Math.round((counts.mastered / b.phonemes.length) * 100);
        const open = openBook === b.id;
        const prog = englishBookProgress(b.id, readUnits);

        const bookWords = [...wordStats.entries()]
          .filter(([_, s]) => {
            const events = s.exposed > 0;
            return events;
          })
          .map(([word, s]) => ({
            word,
            mastery: computeMastery(s, now),
            attempts: s.correct + s.wrong,
          }))
          .sort((a, b) => b.mastery - a.mastery)
          .slice(0, 12);

        return (
          <div key={b.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setOpenBook(open ? null : b.id)}
              className="flex w-full items-start justify-between text-left"
            >
              <div>
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-ink-500">{b.phonemes.length}개 음소</div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
                <span className="font-semibold text-coral-500">
                  📖 {prog.readUnits}/{prog.totalUnits} unit
                </span>
                <span className="font-semibold text-success">{masteredPct}% 익힘</span>
              </div>
            </button>
            <div className="mt-2">
              <MasteryDistributionBar counts={counts} showLegend={false} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {b.phonemes.map((p) => {
                const s = phonemeStats.get(p);
                const m = s ? computeMastery(s, now) : 0;
                return <MasteryBadge key={p} label={p} mastery={m} />;
              })}
            </div>
            {open && (
              <div className="mt-3 border-t border-ink-100 pt-3">
                <h4 className="mb-2 text-xs font-semibold text-ink-500">이 책 어휘 상위 12</h4>
                {bookWords.length === 0 ? (
                  <p className="text-xs text-ink-400">아직 어휘 데이터가 없어요</p>
                ) : (
                  <ul className="space-y-1">
                    {bookWords.map((w) => (
                      <li key={w.word} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate">{w.word}</span>
                        <MasteryBadge
                          label={`${Math.round(w.mastery * 100)}%`}
                          mastery={w.mastery}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
