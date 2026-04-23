import { computeMastery, masteryState, type MasteryStats, type MasteryState } from '../lib/mastery';
import { MasteryBadge } from './MasteryBadge';
import { MasteryDistributionBar } from './MasteryDistributionBar';
import { ReportEmptyState } from './ReportEmptyState';

interface Props {
  stats: Map<string, MasteryStats>;
  now?: number;
}

export function VocabularyMasteryCard({ stats, now = Date.now() }: Props) {
  const entries = [...stats.entries()].map(([word, s]) => ({
    word,
    mastery: computeMastery(s, now),
    attempts: s.correct + s.wrong,
  }));

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <h3 className="mb-3 text-base font-bold">어휘 마스터리</h3>
        <ReportEmptyState emoji="🔤" message="아직 어휘 데이터가 없어요" />
      </div>
    );
  }

  const top = [...entries].sort((a, b) => b.mastery - a.mastery).slice(0, 10);
  const weak = [...entries]
    .filter((e) => e.attempts >= 2 && e.mastery < 0.6)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 10);

  const counts = entries.reduce(
    (acc, e) => {
      acc[masteryState(e.mastery)]++;
      return acc;
    },
    { unknown: 0, seen: 0, practiced: 0, mastered: 0 } as Record<MasteryState, number>
  );

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold">어휘 마스터리</h3>
        <span className="text-xs text-ink-500">{entries.length}개 단어</span>
      </div>
      <MasteryDistributionBar counts={counts} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-success">잘 알아요 (상위 10)</h4>
          <ul className="space-y-1">
            {top.map((e) => (
              <li key={e.word} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{e.word}</span>
                <MasteryBadge label={`${Math.round(e.mastery * 100)}%`} mastery={e.mastery} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-danger">연습이 필요해요</h4>
          {weak.length === 0 ? (
            <p className="text-xs text-ink-400">아직 없음</p>
          ) : (
            <ul className="space-y-1">
              {weak.map((e) => (
                <li key={e.word} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{e.word}</span>
                  <MasteryBadge label={`${Math.round(e.mastery * 100)}%`} mastery={e.mastery} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
