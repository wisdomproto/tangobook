import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ActivityItem, ColoringCatalogEntry } from '@tangobook/shared';
import { EmbedStage } from '@/features/phonics-learner/components/EmbedStage';
import { preloadWordScenes } from '@/features/games/lib/phonics-word-scene';
import { ActivityCta } from '../ActivityCta';
import { trackActivity } from '../../lib/track';
import { BTN, INLINE_STAGE_HEIGHT, PanelHeader } from './PanelHeader';
import { ColoringBookPrint, type ColoringBookSheet } from './ColoringBookPrint';

const ColoringPlayer = lazy(() =>
  import('@/features/games/components/players/ColoringPlayer').then((m) => ({
    default: m.ColoringPlayer,
  }))
);

export function ColoringPanel({
  item,
  entry,
  next,
  bookSheets,
}: {
  item: ActivityItem;
  entry: ColoringCatalogEntry;
  next: ActivityItem | null;
  /** 같은 책(파닉스는 같은 단원)의 도안 전부 — 2장 이상이면 「색칠책」 인쇄를 연다. */
  bookSheets: ColoringBookSheet[];
}) {
  // 🔴 기본 화면 = 페이지 안 온라인 색칠(2026-09-14 사용자). 「크게 하기」는 전체 화면 —
  //    그때는 페이지 안 판을 내린다(둘이 같이 있으면 소리가 겹친다).
  const [fullscreen, setFullscreen] = useState(false);
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const [bookPrint, setBookPrint] = useState(false);
  const doneTimer = useRef<ReturnType<typeof window.setTimeout>>();
  useEffect(() => () => window.clearTimeout(doneTimer.current), []);
  // 파닉스 낱말은 다 칠한 뒤 「다른 동화책 예문」을 띄운다 — 리빌은 동기라 그 책을 미리 받아 둔다
  // (파닉스 게임은 PhonicsGameGate 가 하는 일. 활동 모음은 그 게이트를 안 거친다).
  useEffect(() => {
    if (entry.unitId) void preloadWordScenes([entry.word]);
  }, [entry.unitId, entry.word]);
  const sheet = {
    word: entry.word,
    lineartUrl: entry.lineartUrl,
    colorSourceUrl: entry.answerUrl || entry.originalUrl || entry.lineartUrl,
    originalUrl: entry.originalUrl,
    language: entry.language ?? ('korean' as const),
    storybookId: entry.bookId ?? entry.unitId,
  };
  return (
    <div>
      <PanelHeader
        title={`${item.title} 색칠도안`}
        playLabel="⛶ 크게 하기"
        onPlay={() => {
          trackActivity('activity_play', { kind: item.kind, key: item.key });
          setFullscreen(true);
        }}
        onPrint={() => {
          trackActivity('activity_print', { kind: item.kind, key: item.key });
          window.print();
        }}
        extra={
          bookSheets.length >= 2 && (
            <button
              onClick={() => {
                trackActivity('activity_print', { kind: item.kind, key: item.key, target: 'book' });
                setBookPrint(true);
              }}
              className={`${BTN} bg-coral-600 text-white hover:bg-coral-700`}
            >
              📚 {entry.bookId ? '이 책' : '이 단원'} 색칠책 인쇄 ({bookSheets.length}장)
            </button>
          )
        }
      />
      {finished && (
        <div className="mb-3 rounded-xl bg-peach-100 p-3 print:hidden">
          <p className="mb-2 font-bold">다 칠했어요! 🎉</p>
          <ActivityCta item={item} next={next} />
        </div>
      )}
      {bookPrint && (
        <ColoringBookPrint
          title={item.section}
          sheets={bookSheets}
          onDone={() => setBookPrint(false)}
        />
      )}
      {!fullscreen && (
        <div className="overflow-hidden rounded-2xl shadow-sm print:hidden">
          <EmbedStage height={INLINE_STAGE_HEIGHT}>
            <Suspense fallback={null}>
              <ColoringPlayer
                key={round}
                items={[sheet]}
                // 페이지 안에서는 나갈 곳이 없다 — 「돌아가기」는 새 판으로.
                onBack={() => setRound((n) => n + 1)}
                onDone={() => setFinished(true)}
              />
            </Suspense>
          </EmbedStage>
        </div>
      )}
      {/* 인쇄용 한 장 — 화면에선 온라인 색칠이 이 자리를 대신한다. */}
      <figure className={`hidden rounded-2xl bg-white p-0 ${bookPrint ? '' : 'print:block'}`}>
        <img
          src={entry.lineartUrl}
          alt={`${item.title} 색칠도안`}
          className="mx-auto w-auto print:max-h-[235mm]"
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
      {fullscreen && (
        <Suspense fallback={null}>
          <ColoringPlayer
            items={[sheet]}
            onBack={() => setFullscreen(false)}
            // 🔴 전체 화면 플레이어는 `fixed inset-0` 이라 그 뒤에 그린 CTA 는 안 보인다 — onDone 은
            //    칭찬 소리가 끝난 뒤에 오므로, 다 칠한 그림을 잠깐 더 보여 준 뒤 닫고 CTA 를 띄운다.
            onDone={() => {
              doneTimer.current = window.setTimeout(() => {
                setFullscreen(false);
                setFinished(true);
              }, 1000);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
