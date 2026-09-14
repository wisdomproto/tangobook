import { lazy, Suspense, useMemo, useState } from 'react';
import type { ActivityItem, HiddenObjectCatalogEntry } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { buildHiddenObjectSceneData } from '@/features/games/lib/hidden-object-data';
import { ActivityCta } from '../ActivityCta';
import { PanelHeader } from './PanelHeader';
import { trackActivity } from '../../lib/track';

const HiddenObjectPlayer = lazy(() =>
  import('@/features/games/components/players/HiddenObjectPlayer').then((m) => ({
    default: m.HiddenObjectPlayer,
  }))
);

export function HiddenObjectPanel({
  item,
  entry,
  next,
}: {
  item: ActivityItem;
  entry: HiddenObjectCatalogEntry;
  next: ActivityItem | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  // 책은 「온라인으로」 누른 뒤에만 받는다.
  const {
    data: book,
    isLoading: bookLoading,
    isError: bookError,
  } = useStorybook(playing ? entry.bookId : '');
  const gameData = useMemo(
    () => buildHiddenObjectSceneData(book, undefined, entry.key),
    [book, entry.key]
  );

  return (
    <div>
      <PanelHeader
        title={`${item.title} 숨은그림찾기`}
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
          <p className="mb-2 font-bold">다 찾았어요! 🎉</p>
          <ActivityCta item={item} next={next} />
        </div>
      )}
      <figure className="rounded-2xl bg-white p-4 shadow-sm print:shadow-none print:p-0">
        <img
          src={entry.sceneImageUrl}
          alt={`${item.title} 숨은그림찾기`}
          className="mx-auto max-h-[62vh] w-auto print:max-h-[190mm]"
        />
        <figcaption className="mt-3">
          <p className="mb-2 font-bold">찾을 것 {entry.words.length}가지</p>
          <ul className="flex flex-wrap gap-2">
            {entry.words.map((w) => (
              <li key={w} className="rounded-full border-2 border-ink-100 px-3 py-1 text-lg">
                ☐ {w}
              </li>
            ))}
          </ul>
        </figcaption>
      </figure>
      {/* 다 끝내면 위 완료 상자가 같은 버튼을 들고 있다 — 두 번 보이지 않게 아래는 숨긴다. */}
      {!finished && (
        <div className="mt-4">
          <ActivityCta item={item} next={next} />
        </div>
      )}
      {playing && bookLoading && (
        <p className="mt-3 rounded bg-peach-100 p-3 print:hidden">그림을 불러오는 중…</p>
      )}
      {playing && bookError && (
        <p className="mt-3 rounded bg-peach-100 p-3 print:hidden">그림을 불러오지 못했어요.</p>
      )}
      {playing && book && !gameData && (
        <p className="mt-3 rounded bg-peach-100 p-3 print:hidden">이 그림은 지금 준비 중이에요.</p>
      )}
      {playing && gameData && (
        // 🔴 결과 화면(GameResultScreen)은 fixed 가 아니다 — 감싸지 않으면 페이지 맨 아래에 붙어 안 보인다.
        <div className="fixed inset-0 z-[60] overflow-auto bg-cream-50 print:hidden">
          <Suspense fallback={null}>
            <HiddenObjectPlayer
              storybookId={entry.bookId}
              gameData={gameData}
              difficulty="easy"
              // 🔴 onComplete 는 결과 화면이 뜨는 순간 불린다 — 여기서 닫으면 결과 화면을 못 본다. 닫기는 onBack 만.
              onComplete={() => setFinished(true)}
              onBack={() => setPlaying(false)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
