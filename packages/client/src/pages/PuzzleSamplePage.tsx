import { useState } from 'react';
import { PathPuzzlePlayer } from '@/features/puzzle/components/PathPuzzlePlayer';
import { CHALLENGES, CONNECT_PIECES } from '@/features/puzzle/data/connect-game';

/**
 * 길 잇기 퍼즐 — 온라인 샘플.
 *
 * 공용 보드 + 게임별 블록 + 앱 구조의 **앱 쪽**만 먼저 세운 것이다(기획서 §4 Digital First).
 * 실물 보드가 나오면 카메라가 만들어 준 `Placement[]` 를 같은 판정기에 넣으면 된다.
 */
export default function PuzzleSamplePage() {
  const [idx, setIdx] = useState(0);
  const challenge = CHALLENGES[idx];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 md:px-8">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {CHALLENGES.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setIdx(i)}
            data-sound="select"
            className={`min-h-[44px] shrink-0 rounded-full border-2 px-4 font-bold break-keep ${
              i === idx
                ? 'border-coral-500 bg-coral-500 text-white'
                : 'border-ink-200 bg-white text-ink-700'
            }`}
          >
            {c.book.title}
          </button>
        ))}
      </div>

      {/* key = 문제가 바뀌면 판을 새로 세운다(앞 문제의 배치·재고가 남지 않게) */}
      <PathPuzzlePlayer key={challenge.id} challenge={challenge} set={CONNECT_PIECES} />
    </div>
  );
}
