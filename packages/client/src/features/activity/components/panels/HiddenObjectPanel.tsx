import { lazy, Suspense, useMemo, useState } from 'react';
import type { ActivityItem, HiddenObjectCatalogEntry } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { buildHiddenObjectSceneData } from '@/features/games/lib/hidden-object-data';
import { EmbedStage } from '@/features/phonics-learner/components/EmbedStage';
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
  // 🔴 기본 화면 = 페이지 안 온라인 숨은그림(2026-09-14 사용자). 「크게 하기」는 전체 화면.
  const [fullscreen, setFullscreen] = useState(false);
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const { data: book, isLoading: bookLoading, isError: bookError } = useStorybook(entry.bookId);
  const gameData = useMemo(
    () => buildHiddenObjectSceneData(book, undefined, entry.key),
    [book, entry.key]
  );

  const player = (onBack: () => void) => (
    // 판 아래 낱말 카드 줄까지 들어가야 해서 색칠(88dvh)보다 높게 잡는다.
    // 🔴 결과 화면(GameResultScreen)은 fixed 가 아니다 — 감싸지 않으면 페이지 맨 아래에 붙어 안 보인다.
    //    페이지 안 상자에서는 EmbedStage 의 transform 이 이 fixed 를 상자 안에 가둔다.
    <div className="fixed inset-0 z-[60] overflow-auto bg-cream-50 print:hidden">
      <Suspense fallback={null}>
        <HiddenObjectPlayer
          storybookId={entry.bookId}
          gameData={gameData!}
          difficulty="easy"
          // 🔴 onComplete 는 결과 화면이 뜨는 순간 불린다 — 여기서 닫으면 결과 화면을 못 본다.
          onComplete={() => setFinished(true)}
          onBack={onBack}
        />
      </Suspense>
    </div>
  );

  return (
    <div>
      <PanelHeader
        title={`${item.title} 숨은그림찾기`}
        playLabel="⛶ 크게 하기"
        onPlay={() => {
          trackActivity('activity_play', { kind: item.kind, key: item.key });
          setFullscreen(true);
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
      {bookLoading && <p className="rounded bg-peach-100 p-3 print:hidden">그림을 불러오는 중…</p>}
      {bookError && (
        <p className="rounded bg-peach-100 p-3 print:hidden">그림을 불러오지 못했어요.</p>
      )}
      {book && !gameData && (
        <p className="rounded bg-peach-100 p-3 print:hidden">이 그림은 지금 준비 중이에요.</p>
      )}
      {gameData && !fullscreen && (
        <div key={round} className="overflow-hidden rounded-2xl shadow-sm print:hidden">
          <EmbedStage height="100dvh">{player(() => setRound((n) => n + 1))}</EmbedStage>
        </div>
      )}
      {/* 인쇄용 한 장 — 화면에선 온라인 숨은그림이 이 자리를 대신한다. */}
      <figure className="hidden bg-white print:block">
        <img
          src={entry.sceneImageUrl}
          alt={`${item.title} 숨은그림찾기`}
          className="mx-auto w-auto print:max-h-[190mm]"
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
      {gameData && fullscreen && player(() => setFullscreen(false))}
    </div>
  );
}
