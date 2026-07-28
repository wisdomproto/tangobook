import { useMemo } from 'react';
import { ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';
import type { LearningEvent, StorybookSummary } from '@tangobook/shared';
import { AppIcon } from '@/design-system';
import { computeMastery, masteryState, masteryLabel, type MasteryState } from '../lib/mastery';
import { groupByPhoneme, groupByWord } from '../lib/aggregate';
import { ENGLISH_PHONICS_BOOKS, type EnglishBookId } from '../lib/english-phonics-skills';
import { readPhonicsUnitIds, englishBookProgress } from '../lib/phonics-progress';
import { MasteryBadge } from './MasteryBadge';
import { MasteryDistributionBar } from './MasteryDistributionBar';

/** ENGLISH_PHONICS_CURRICULUM 의 한 book 내 모든 unit.sampleWords 평탄화. */
function getEnglishBookTargetWords(bookId: EnglishBookId): string[] {
  const level = ENGLISH_PHONICS_CURRICULUM.find((l) => l.level === bookId);
  if (!level) return [];
  const set = new Set<string>();
  for (const u of level.units) {
    for (const w of u.sampleWords ?? []) set.add(w.toLowerCase());
  }
  return [...set];
}

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
}

export function EnglishPhonicsSkillTree({ events, storybooks }: Props) {
  const phonemeStats = useMemo(() => groupByPhoneme(events), [events]);
  const wordStats = useMemo(() => groupByWord(events, 'en'), [events]);
  const readUnits = useMemo(() => readPhonicsUnitIds(events, storybooks), [events, storybooks]);
  // 영어 스킬트리는 자세한 음소 + 타겟 단어 모두 항상 노출 (book1 만 보이는 문제 방지)
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
        const prog = englishBookProgress(b.id, readUnits);

        // 타겟 단어 마스터리 — ENGLISH_PHONICS_CURRICULUM 의 sampleWords 기준
        const targetWords = getEnglishBookTargetWords(b.id);
        const targetRows = targetWords.map((word) => {
          const s = wordStats.get(word);
          const mastery = s ? computeMastery(s, now) : 0;
          return {
            word,
            mastery,
            exposed: s?.exposed ?? 0,
          };
        });
        const masteredWords = targetRows.filter((r) => r.mastery >= 0.85).length;

        return (
          <div key={b.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <div className="flex w-full items-start justify-between">
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
            </div>
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
            <div className="mt-3 border-t border-ink-100 pt-3">
              <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold text-ink-500">
                <AppIcon src="section/target-word.svg" size={16} alt="타겟" />
                <span>
                  타겟 단어 ({masteredWords}/{targetRows.length} 익힘)
                </span>
              </h4>
              {targetRows.length === 0 ? (
                <p className="text-xs text-ink-400">이 권의 타겟 단어가 없어요</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {targetRows.map((r) => (
                    <div
                      key={r.word}
                      className="flex items-center justify-between gap-2 rounded bg-cream-50 px-2 py-1 text-xs"
                    >
                      <span className="truncate font-semibold text-ink-700">{r.word}</span>
                      <MasteryBadge label={masteryLabel(r.mastery)} mastery={r.mastery} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
