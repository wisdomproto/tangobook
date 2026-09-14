import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { resolveTtsUrl } from '@/features/tts';
import { useActivitySound } from '@/features/phonics-learner/hooks/useActivitySound';
import { usePhonicsTtsWarm } from '@/features/phonics-learner/hooks/usePhonicsTtsWarm';
import { writeStepRead } from '@/features/phonics-learner/lib/english-phonics-units';
import { cn } from '@/lib/cn';
import { worksheetCells } from '../../lib/online-worksheet';

const PREFIX = 'activity-write';

/**
 * 온라인 워크지 — 위는 인쇄 워크지와 같은 칸 목록(글자 → 글자 만들기 → 낱말), 아래는 **큰 쓰기 칸 하나**.
 *
 * 🔴 워크지처럼 작은 칸을 화면에 다 깔지 않는다 — 네 살 손가락으로는 못 쓴다(2026-09-14 사용자와 합의).
 *    칸을 누르면 그 글자가 큰 칸에 뜬다.
 * 🔴 **맞히면 곧바로 다음 판**(2026-09-15 사용자) — 소리를 기다리지 않는다. 한글 글자·음절은 3번(`reps`),
 *    남은 횟수가 있으면 같은 글자 새 칸, 다 채우면 다음 안 쓴 칸. 소리는 뒤에서 이어 난다.
 * 🔴 소리 순서·채점은 앱 복습 쓰기(`ReviewWriteActivity`)와 같은 부품이다 — 글자마다 이어읽기(고 → 고기,
 *    영어는 `writeStepRead`), 다 쓰면 [소리 → 쉼 → 띵동], 마지막 칸이면 칭찬.
 */
export function OnlineWorksheet({
  track,
  unitId,
  onDone,
}: {
  track: 'korean' | 'english';
  unitId: string;
  onDone: () => void;
}) {
  const cells = useMemo(() => worksheetCells(track, unitId), [track, unitId]);
  const [idx, setIdx] = useState(0);
  /** 칸별로 쓴 횟수 — `reps` 에 닿으면 그 칸은 끝. */
  const [counts, setCounts] = useState<Record<number, number>>({});
  const repsOf = useCallback((i: number) => cells[i]?.reps ?? 1, [cells]);
  const isDone = (i: number) => (counts[i] ?? 0) >= repsOf(i);
  const writtenCellsRef = useRef<number[]>([]);
  /**
   * 🔴 소리 체인 세대 — 새 체인이 시작되면 앞 체인의 남은 단계(띵동·읽기)를 버린다. 글자 체인이
   *    낱말 완성 소리를 끊었다(검수: 빨리 쓰면 「아기」가 334ms 에서 잘림). 멈춘 소리도 onEnded 를 부르므로
   *    끊긴 체인이 다음 단계로 새지 않게 단계마다 세대를 본다.
   */
  const soundGen = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const { say, chime, rest, sayThenChime, praiseVisible } = useActivitySound({
    unitId,
    language: track,
    prefix: PREFIX,
  });
  usePhonicsTtsWarm(
    unitId,
    cells.map((c) => c.sound),
    PREFIX,
    track
  );

  const cell = cells[idx];
  const sections = useMemo(() => {
    const m = new Map<string, number[]>();
    cells.forEach((c, i) => m.set(c.section, [...(m.get(c.section) ?? []), i]));
    return [...m.entries()];
  }, [cells]);

  const pick = (i: number) => {
    soundGen.current++;
    writtenCellsRef.current = [];
    setIdx(i);
  };

  // 칸이 바뀌면 쓰기 칸을 화면 안으로 — 375px 에선 큰 단원의 칸 목록이 첫 화면을 넘는다.
  // 🔴 이전 idx 와 비교한다 — 첫 렌더 플래그로 막으면 StrictMode 두 번째 실행에서 풀려 진입하자마자 스크롤한다.
  const shownIdx = useRef(idx);
  useEffect(() => {
    if (shownIdx.current === idx) return;
    shownIdx.current = idx;
    stageRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [idx]);

  const handleSyllableDone = useCallback(
    (_syllable: string, index: number) => {
      if (!cell) return;
      const w = writtenCellsRef.current;
      if (!w.includes(index)) w.push(index);
      const text = cell.pattern
        ? writeStepRead(cell.write, cell.pattern, w, index, unitId)
        : [...w]
            .sort((a, b) => a - b)
            .map((i) => [...cell.write][i])
            .join('');
      if (!text) return;
      const gen = ++soundGen.current;
      const live = () => gen === soundGen.current;
      void (async () => {
        const url = await resolveTtsUrl({
          text,
          language: track,
          storybookId: unitId,
          identifierPrefix: PREFIX,
        });
        // 띵동 먼저, 쉬고, 읽기 — 한 채널이라 붙여 내면 앞소리가 잘린다.
        if (!live()) return;
        chime(() => live() && rest(() => live() && void say(text, undefined, url)));
      })();
    },
    [cell, track, unitId, chime, rest, say]
  );

  const handleComplete = useCallback(() => {
    if (!cell || (counts[idx] ?? 0) >= repsOf(idx)) return;
    const next = { ...counts, [idx]: (counts[idx] ?? 0) + 1 };
    setCounts(next);
    writtenCellsRef.current = [];
    const done = (i: number) => (next[i] ?? 0) >= repsOf(i);
    const allDone = cells.every((_, i) => done(i));
    if (allDone) {
      soundGen.current++;
      void sayThenChime(cell.sound, { praise: true, onDone });
      return;
    }
    // 곧바로 다음 판 — 같은 글자에 남은 횟수가 있으면 그대로(새 칸), 아니면 뒤에서 처음 만나는 안 쓴 칸.
    if (done(idx)) {
      const after = cells.findIndex((_, i) => i > idx && !done(i));
      setIdx(after >= 0 ? after : cells.findIndex((_, i) => !done(i)));
    }
    // 소리는 뒤에서 [낱말 → 쉼 → 띵동]. 아이가 벌써 다음 판을 쓰기 시작하면 그 체인이 세대를 올려 남은 단계를 버린다.
    const gen = ++soundGen.current;
    const live = () => gen === soundGen.current;
    void say(cell.sound, () => live() && rest(() => live() && chime()));
  }, [cell, cells, idx, counts, repsOf, say, rest, chime, sayThenChime, onDone]);

  if (!cell) return null;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-col gap-3">
        {sections.map(([title, list]) => (
          <div key={title}>
            <p className="mb-1 text-sm font-bold text-ink-500">
              {title}{' '}
              <span className="font-medium">
                {list.filter(isDone).length}/{list.length}
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((i) => (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  aria-pressed={i === idx}
                  className={cn(
                    'relative min-h-[44px] min-w-[44px] rounded-xl border-2 px-2.5 font-display text-xl font-extrabold transition',
                    i === idx
                      ? 'border-coral-500 bg-coral-100 text-coral-700'
                      : isDone(i)
                        ? 'border-mint-400 bg-mint-100 text-mint-700'
                        : 'border-ink-100 bg-white text-ink-700 hover:bg-peach-100'
                  )}
                >
                  {cells[i].reveal ?? cells[i].write}
                  {repsOf(i) > 1 && !isDone(i) && (counts[i] ?? 0) > 0 && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-1 text-[10px] leading-tight text-coral-600 shadow-sm">
                      {counts[i]}/{repsOf(i)}
                    </span>
                  )}
                  {isDone(i) && (
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-mint-500 text-[11px] text-white">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div ref={stageRef} className="mx-auto mt-4 w-full max-w-2xl scroll-mb-4">
        {cell.reveal && (
          <p className="mb-2 text-center text-lg text-ink-700">
            <b className="text-coral-600">{cell.reveal[0]}</b>
            {cell.reveal.slice(1)} 의 첫 글자를 써요{' '}
            {/* 다 쓴 칸(완성 소리가 나는 중)엔 안 둔다 — 누르면 완성 소리와 서로 끊어 낱말을 한 번도 끝까지 못 듣는다. */}
            {!isDone(idx) && (
              <button
                onClick={() => void say(cell.sound)}
                aria-label="낱말 듣기"
                className="ml-1 inline-grid h-11 w-11 place-items-center rounded-full bg-coral-500 text-xl text-white"
              >
                🔊
              </button>
            )}
          </p>
        )}
        {repsOf(idx) > 1 && !isDone(idx) && (
          <p className="mb-2 text-center text-lg font-bold text-ink-700" aria-live="polite">
            {Array.from({ length: repsOf(idx) }, (_, k) =>
              k < (counts[idx] ?? 0) ? '●' : '○'
            ).join(' ')}{' '}
            <span className="text-base font-medium text-ink-500">
              {(counts[idx] ?? 0) + 1}번째 쓰기
            </span>
          </p>
        )}
        {isDone(idx) ? (
          <div className="flex items-center justify-center gap-2 rounded-[28px] border-[6px] border-mint-400 bg-mint-100 py-8 shadow-pop">
            <span className="font-display text-[clamp(3rem,12vw,7rem)] font-black leading-none text-mint-600">
              {cell.reveal ?? cell.write}
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-mint-500 text-2xl font-black text-white">
              ✓
            </span>
          </div>
        ) : (
          <WordFillCanvas
            key={`${unitId}-${idx}-${counts[idx] ?? 0}`}
            word={cell.write}
            syllables={[...cell.write]}
            order={cell.order}
            onSyllableDone={handleSyllableDone}
            onComplete={handleComplete}
          />
        )}
      </div>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
