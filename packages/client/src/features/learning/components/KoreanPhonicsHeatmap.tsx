import { useMemo, useState } from 'react';
import type { LearningEvent, StorybookSummary } from '@tangobook/shared';
import { computeMastery, masteryState, type MasteryState } from '../lib/mastery';
import { groupBySyllable } from '../lib/aggregate';
import {
  buildKoreanPhonicsGrid,
  KOREAN_PHONICS_LEVELS,
  type KoreanPhonicsCell,
} from '../lib/korean-phonics-grid';
import { readPhonicsUnitIds, koreanLevelProgress } from '../lib/phonics-progress';
import { MasteryDistributionBar } from './MasteryDistributionBar';
import { ReportEmptyState } from './ReportEmptyState';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
}

const CELL_COLOR: Record<MasteryState, string> = {
  unknown: 'bg-ink-100 text-ink-400',
  seen: 'bg-coral-200 text-ink-700',
  practiced: 'bg-coral-400 text-white',
  mastered: 'bg-success text-white',
};

export function KoreanPhonicsHeatmap({ events, storybooks }: Props) {
  const syllableStats = useMemo(() => groupBySyllable(events), [events]);
  const readUnits = useMemo(() => readPhonicsUnitIds(events, storybooks), [events, storybooks]);
  const [openLevel, setOpenLevel] = useState<string | null>('hangul1');
  const now = Date.now();

  return (
    <div className="space-y-3">
      {KOREAN_PHONICS_LEVELS.map((lv) => {
        const grid = buildKoreanPhonicsGrid(lv.id);
        const open = openLevel === lv.id;
        const prog = koreanLevelProgress(lv.id, readUnits);

        const counts: Record<MasteryState, number> = {
          unknown: 0,
          seen: 0,
          practiced: 0,
          mastered: 0,
        };
        const cellByKey = new Map<string, KoreanPhonicsCell>();
        for (const c of grid.cells) {
          cellByKey.set(`${c.consonant}${c.vowel}`, c);
          const s = syllableStats.get(`${c.consonant}${c.vowel}`);
          const m = s ? computeMastery(s, now) : 0;
          counts[masteryState(m)]++;
        }
        const total = grid.cells.length || 1;
        const masteredPct = Math.round((counts.mastered / total) * 100);

        return (
          <div key={lv.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setOpenLevel(open ? null : lv.id)}
              className="flex w-full items-start justify-between gap-2 text-left"
            >
              <div>
                <div className="font-bold">{lv.name}</div>
                <div className="text-xs text-ink-500">{lv.description}</div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
                <span className="font-semibold text-coral-500">
                  📖 {prog.readUnits}/{prog.totalUnits} unit
                </span>
                {grid.cells.length > 0 && (
                  <span className="font-semibold text-success">{masteredPct}% 익힘</span>
                )}
              </div>
            </button>
            {grid.cells.length > 0 && (
              <div className="mt-2">
                <MasteryDistributionBar counts={counts} />
              </div>
            )}
            {open &&
              (grid.cells.length === 0 ? (
                <ReportEmptyState
                  emoji="✨"
                  message={`${lv.name}의 학습 컨텐츠는 준비 중이에요. 모음: ${grid.vowels.join(' ')}`}
                />
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-1 text-xs">
                    <thead>
                      <tr>
                        <th className="w-8" />
                        {grid.vowels.map((v) => (
                          <th key={v} className="w-8 p-1 text-center text-ink-700">
                            {v}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grid.consonants.map((c) => (
                        <tr key={c}>
                          <th className="w-8 p-1 text-center text-ink-700">{c}</th>
                          {grid.vowels.map((v) => {
                            const cell = cellByKey.get(`${c}${v}`);
                            if (!cell) return <td key={v} />;
                            const s = syllableStats.get(`${c}${v}`);
                            const m = s ? computeMastery(s, now) : 0;
                            return (
                              <td key={v} className="p-0">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded font-bold ${CELL_COLOR[masteryState(m)]}`}
                                  title={`${cell.syllable} — ${Math.round(m * 100)}% (${s?.correct ?? 0}/${(s?.correct ?? 0) + (s?.wrong ?? 0)})`}
                                >
                                  {cell.syllable}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
