import { useMemo, useState } from 'react';
import { PathPuzzlePlayer } from '@/features/puzzle/components/PathPuzzlePlayer';
import { ROAD_PIECES } from '@/features/puzzle/data/road-pieces';
import { LEVEL_ORDER, ROAD_CHALLENGES, ROAD_LEVELS } from '@/features/puzzle/data/road-game';

/**
 * 길 잇기 — 4×4 판 · 길 조각 5종 · 《빨간모자》 24문제.
 *
 * 공용 보드 + 게임별 블록 + 앱 구조의 **앱 쪽**만 먼저 세운 것이다(기획서 §4 Digital First).
 * 실물 보드가 나오면 카메라가 만들어 준 `Placement[]` 를 같은 판정기에 넣으면 된다.
 *
 * 🔴 문제 고르기는 **난이도 탭 + 번호**다. 24개를 한 줄에 늘어놓으면 옆으로 밀어야 보이는데,
 *    마우스로는 그 줄이 안 밀린다(터치에서만 밀린다). 한 화면에 다 보이게 쪼갠다.
 */
const LEVEL_STYLE: Record<string, string> = {
  첫걸음: 'bg-mint-500',
  쉬움: 'bg-info',
  보통: 'bg-warn',
  어려움: 'bg-coral-500',
};

export default function PuzzleSamplePage() {
  const [level, setLevel] = useState<string>(LEVEL_ORDER[0]);
  const [idx, setIdx] = useState(0);

  const inLevel = useMemo(() => ROAD_CHALLENGES.map((c, i) => ({ c, i })).filter(() => true), []);
  const numbers = inLevel.filter(({ i }) => ROAD_LEVELS[i] === level);
  const challenge = ROAD_CHALLENGES[idx];

  return (
    <div
      className="min-h-full w-full bg-cream-50 bg-cover bg-fixed bg-center"
      style={{ backgroundImage: 'url(/images/puzzle/page-bg.webp)' }}
    >
      <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 md:px-8">
        <div className="mb-2 flex gap-2">
          {LEVEL_ORDER.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => {
                setLevel(lv);
                const first = ROAD_LEVELS.findIndex((l) => l === lv);
                if (first >= 0) setIdx(first);
              }}
              data-sound="select"
              className={`min-h-[44px] flex-1 rounded-xl border-2 font-bold break-keep ${
                level === lv
                  ? `${LEVEL_STYLE[lv]} border-transparent text-white`
                  : 'border-ink-200 bg-white/80 text-ink-700'
              }`}
            >
              {lv}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {numbers.map(({ i }, n) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              data-sound="select"
              aria-current={i === idx}
              aria-label={`${level} ${n + 1}번 문제`}
              className={`h-11 w-11 rounded-xl border-2 font-bold ${
                i === idx
                  ? 'border-ink-900 bg-white text-ink-900'
                  : 'border-ink-200 bg-white/80 text-ink-600'
              }`}
            >
              {n + 1}
            </button>
          ))}
        </div>

        {/* key = 문제가 바뀌면 판을 새로 세운다(앞 문제의 배치·재고가 남지 않게) */}
        <PathPuzzlePlayer key={challenge.id} challenge={challenge} set={ROAD_PIECES} />
      </div>
    </div>
  );
}
