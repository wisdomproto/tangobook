import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ActivityItem, ColoringCatalogEntry } from '@tangobook/shared';
import { ActivityCta } from '../ActivityCta';
import { trackActivity } from '../../lib/track';
import { PanelHeader } from './PanelHeader';

const ColoringPlayer = lazy(() =>
  import('@/features/games/components/players/ColoringPlayer').then((m) => ({
    default: m.ColoringPlayer,
  }))
);

export function ColoringPanel({
  item,
  entry,
  next,
}: {
  item: ActivityItem;
  entry: ColoringCatalogEntry;
  next: ActivityItem | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const doneTimer = useRef<ReturnType<typeof window.setTimeout>>();
  useEffect(() => () => window.clearTimeout(doneTimer.current), []);
  return (
    <div>
      <PanelHeader
        title={`${item.title} 색칠도안`}
        onPlay={() => {
          trackActivity('activity_play', { kind: item.kind, key: item.key });
          setPlaying(true);
        }}
        onPrint={() => {
          trackActivity('activity_print', { kind: item.kind, key: item.key });
          window.print();
        }}
      />
      {finished && (
        <div className="mb-3 rounded-xl bg-peach-100 p-3 print:hidden">
          <p className="mb-2 font-bold">다 칠했어요! 🎉</p>
          <ActivityCta item={item} next={next} />
        </div>
      )}
      <figure className="rounded-2xl bg-white p-4 shadow-sm print:shadow-none print:p-0">
        <img
          src={entry.lineartUrl}
          alt={`${item.title} 색칠도안`}
          className="mx-auto max-h-[70vh] w-auto print:max-h-[250mm]"
        />
        <figcaption className="mt-2 text-center font-display text-2xl font-extrabold">
          {item.title}
        </figcaption>
      </figure>
      {item.blurb && <p className="mt-3 text-ink-700 print:hidden">{item.blurb}</p>}
      {/* 다 끝내면 위 완료 상자가 같은 버튼을 들고 있다 — 두 번 보이지 않게 아래는 숨긴다. */}
      {!finished && (
        <div className="mt-4">
          <ActivityCta item={item} next={next} />
        </div>
      )}
      {playing && (
        <Suspense fallback={null}>
          <ColoringPlayer
            items={[
              {
                word: entry.word,
                lineartUrl: entry.lineartUrl,
                colorSourceUrl: entry.answerUrl || entry.originalUrl || entry.lineartUrl,
                originalUrl: entry.originalUrl,
                language: entry.language ?? 'korean',
                storybookId: entry.bookId ?? entry.unitId,
              },
            ]}
            onBack={() => setPlaying(false)}
            // 🔴 플레이어는 `fixed inset-0` 이라 그 뒤에 그린 CTA 는 안 보인다 — onDone 은 칭찬 소리가
            //    끝난 뒤에 오므로, 다 칠한 그림을 잠깐 더 보여 준 뒤 게임을 닫고 CTA 를 띄운다.
            onDone={() => {
              doneTimer.current = window.setTimeout(() => {
                setPlaying(false);
                setFinished(true);
              }, 1000);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
