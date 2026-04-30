import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PLAYGROUND_GAMES, type LearningEvent } from '@tangobook/shared';

interface Props {
  events: LearningEvent[];
}

export function PlaygroundStatsCard({ events }: Props) {
  const stats = useMemo(() => {
    const playgroundIds = new Set(PLAYGROUND_GAMES.map((g) => g.id));
    const map = new Map<string, { plays: number; correct: number; wrong: number }>();
    for (const g of PLAYGROUND_GAMES) {
      map.set(g.id, { plays: 0, correct: 0, wrong: 0 });
    }

    // game_type 별 단어 이벤트 카운트 (단어가 1개라도 있는 이벤트면 1 play 로 추정 X — 단어 시도 횟수만)
    for (const e of events) {
      if (!e.game_type || !playgroundIds.has(e.game_type as never)) continue;
      const s = map.get(e.game_type);
      if (!s) continue;
      if (e.event_type === 'word_correct') s.correct += 1;
      else if (e.event_type === 'word_wrong') s.wrong += 1;
    }
    // plays = 시도 횟수 (correct + wrong) / round_count(보통 5) 근사 — 단순화: 합 그대로 표시
    for (const [, s] of map) {
      s.plays = s.correct + s.wrong;
    }
    return map;
  }, [events]);

  const totalAttempts = useMemo(() => {
    let n = 0;
    for (const [, s] of stats) n += s.plays;
    return n;
  }, [stats]);

  return (
    <div className="bg-white rounded-2xl border border-purple-200 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎪</span>
          <h3 className="text-lg font-black font-display text-ink-900">호리 놀이터</h3>
        </div>
        <Link to="/playground" className="text-xs text-coral-600 font-bold hover:underline">
          전체 보기 →
        </Link>
      </div>

      {totalAttempts === 0 ? (
        <div className="text-center text-ink-500 text-sm py-6">아직 놀이터를 안 가봤어요!</div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black font-display text-purple-500">
              {totalAttempts}
            </span>
            <span className="text-ink-500 font-bold">번 시도</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PLAYGROUND_GAMES.filter((g) => g.available).map((g) => {
              const s = stats.get(g.id) ?? { plays: 0, correct: 0, wrong: 0 };
              const accuracy = s.plays > 0 ? Math.round((s.correct / s.plays) * 100) : 0;
              return (
                <div
                  key={g.id}
                  className="bg-cream-50 rounded-xl p-2 border border-peach-200 text-center"
                >
                  <div className="text-xl">{g.emoji}</div>
                  <div className="text-[11px] font-bold text-ink-700 mt-0.5 line-clamp-1">
                    {g.nameKo}
                  </div>
                  <div className="text-[11px] text-ink-500 mt-0.5">
                    {s.plays > 0 ? `${s.plays}회` : '안 함'}
                  </div>
                  {s.plays > 0 && (
                    <div
                      className={`text-[11px] font-black mt-0.5 ${
                        accuracy >= 80
                          ? 'text-success'
                          : accuracy >= 50
                            ? 'text-amber-600'
                            : 'text-danger'
                      }`}
                    >
                      {accuracy}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
