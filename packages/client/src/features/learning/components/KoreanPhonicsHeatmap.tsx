import { useMemo, useState } from 'react';
import { KOREAN_PHONICS_CURRICULUM } from '@tangobook/shared';
import type { LearningEvent, StorybookSummary } from '@tangobook/shared';
import { AppIcon } from '@/design-system';
import { computeMastery, masteryState, masteryLabel, type MasteryState } from '../lib/mastery';
import { groupBySyllable, groupByWord } from '../lib/aggregate';
import {
  buildKoreanPhonicsGrid,
  KOREAN_PHONICS_LEVELS,
  type KoreanPhonicsCell,
} from '../lib/korean-phonics-grid';
import { readPhonicsUnitIds, koreanLevelProgress } from '../lib/phonics-progress';
import { MasteryBadge } from './MasteryBadge';
import { MasteryDistributionBar } from './MasteryDistributionBar';
import { ReportEmptyState } from './ReportEmptyState';

/** 한 레벨의 모든 unit.sampleWords 를 평탄화. unique 처리. */
function getKoreanLevelTargetWords(levelId: string): string[] {
  const level = KOREAN_PHONICS_CURRICULUM.find((l) => l.level === levelId);
  if (!level) return [];
  const set = new Set<string>();
  for (const u of level.units) {
    for (const w of u.sampleWords ?? []) set.add(w);
  }
  return [...set];
}

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
  const wordStats = useMemo(() => groupByWord(events, 'ko'), [events]);
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
            {/* 🔴 자음×모음 표가 **먼저** — 이 레벨에서 무엇을 배웠는지 한 장으로 보여주는 게
                이 표다. 타겟 단어 56개 뱃지 아래에 두면 스크롤을 한참 내려야 나왔다. */}
            <button
              type="button"
              onClick={() => setOpenLevel(open ? null : lv.id)}
              className="mt-3 w-full rounded-md bg-peach-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-peach-200"
            >
              {open ? '▲ 자세히 닫기' : '▼ 자음×모음 자세히 보기'}
            </button>
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
            {/* 타겟 단어 — 표 아래. 목록이라 길고, 표를 본 뒤에 보는 게 순서다. */}
            <KoreanLevelTargetWords levelId={lv.id} wordStats={wordStats} now={now} />
          </div>
        );
      })}
    </div>
  );
}

interface TargetWordsProps {
  levelId: string;
  wordStats: ReturnType<typeof groupByWord>;
  now: number;
}

function KoreanLevelTargetWords({ levelId, wordStats, now }: TargetWordsProps) {
  const targets = useMemo(() => getKoreanLevelTargetWords(levelId), [levelId]);
  if (targets.length === 0) return null;

  const rows = targets.map((word) => {
    const s = wordStats.get(word);
    const mastery = s ? computeMastery(s, now) : 0;
    const attempts = (s?.correct ?? 0) + (s?.wrong ?? 0);
    return { word, mastery, attempts, exposed: s?.exposed ?? 0 };
  });
  const masteredCount = rows.filter((r) => r.mastery >= 0.85).length;

  return (
    <div className="mt-4 border-t border-ink-100 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-1 text-xs font-semibold text-ink-500">
          <AppIcon src="section/target-word.svg" size={16} alt="타겟" />
          <span>
            타겟 단어 ({masteredCount}/{rows.length} 익힘)
          </span>
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
        {rows.map((r) => (
          <div
            key={r.word}
            className="flex items-center justify-between gap-2 rounded bg-cream-50 px-2 py-1 text-xs"
          >
            <span className="truncate font-semibold text-ink-700">{r.word}</span>
            <MasteryBadge label={masteryLabel(r.mastery)} mastery={r.mastery} />
          </div>
        ))}
      </div>
    </div>
  );
}
