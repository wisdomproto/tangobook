import { useState } from 'react';
import { PathPuzzlePlayer } from '@/features/puzzle/components/PathPuzzlePlayer';
import { ROAD_PIECES } from '@/features/puzzle/data/road-pieces';
import { ROAD_CHALLENGES, ROAD_LEVELS } from '@/features/puzzle/data/road-game';

/**
 * 길 잇기 — 4×4 판 · 길 조각 5종 · 문제 16개.
 *
 * 공용 보드 + 게임별 블록 + 앱 구조의 **앱 쪽**만 먼저 세운 것이다(기획서 §4 Digital First).
 * 실물 보드가 나오면 카메라가 만들어 준 `Placement[]` 를 같은 판정기에 넣으면 된다.
 */
const LEVEL_STYLE: Record<string, string> = {
  쉬움: 'border-mint-400 text-mint-700',
  보통: 'border-info text-info',
  어려움: 'border-coral-500 text-coral-600',
};

export default function PuzzleSamplePage() {
  const [idx, setIdx] = useState(0);
  const challenge = ROAD_CHALLENGES[idx];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 md:px-8">
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {ROAD_CHALLENGES.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setIdx(i)}
            data-sound="select"
            aria-current={i === idx}
            aria-label={`${i + 1}번 ${ROAD_LEVELS[i]}`}
            className={`min-h-[44px] w-11 shrink-0 rounded-xl border-2 font-bold ${
              i === idx
                ? 'border-coral-500 bg-coral-500 text-white'
                : `bg-white ${LEVEL_STYLE[ROAD_LEVELS[i]] ?? 'border-ink-200 text-ink-700'}`
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* key = 문제가 바뀌면 판을 새로 세운다(앞 문제의 배치·재고가 남지 않게) */}
      <PathPuzzlePlayer key={challenge.id} challenge={challenge} set={ROAD_PIECES} />
    </div>
  );
}
