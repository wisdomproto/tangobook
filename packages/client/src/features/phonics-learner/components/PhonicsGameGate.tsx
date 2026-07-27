import { useState, type ReactNode } from 'react';
import type { GameTypeId, Lang, Storybook } from '@tangobook/shared';
import { usePhonicsMap } from '@/features/games/hooks/usePhonicsMap';
import { useGameAssetPreload } from '@/features/games/hooks/useGameAssetPreload';
import { GameLoadingGate } from '@/features/games/components/GameLoadingGate';

interface Props {
  /** 수집기(`collect-game-assets`)가 아는 게임 id — 활동 kind 가 아니다. */
  game: GameTypeId;
  gameData: { type: string; items?: Array<Record<string, unknown>> };
  storybook: Storybook | undefined;
  storybookId: string;
  lang: Lang;
  children: ReactNode;
}

/**
 * 파닉스 게임 활동에 **동화 게임과 같은 진입 게이트**를 씌운다.
 *
 * 🔴 동화 게임(`VocabularyStudyContent`)은 이번 판 이미지·정답 TTS·음절 mp3 를 **다 데운 뒤**
 *    시작해서 첫 정답이 늦지 않다. 파닉스 게임만 그 게이트 없이 플레이어를 바로 렌더해서,
 *    첫 정답 순간에 자산을 새로 받느라 소리가 늦었다(사용자 반복 지적). 같은 문제를 두 번 풀지 않는다 —
 *    이미 있는 게이트를 그대로 쓴다.
 *
 * 🔴 `game` 은 **활동 kind(`game-korean-block`)가 아니라 수집기가 아는 게임 id(`korean-block`)** 다.
 *    어긋나면 `buildTtsSpec` 이 null 을 돌려주고 정답 TTS 가 조용히 안 데워진다.
 * 🔴 음절 맵은 그게 필요한 게임만 켠다 — 안 쓰는 게임까지 켜면 목록 fetch + mp3 프리페치가
 *    이번 판 워밍을 굶긴다(동화 게임에서 이미 겪은 문제).
 */
const NEEDS_SYLLABLES = new Set<GameTypeId>(['korean-block', 'korean-line-matching']);

export function PhonicsGameGate({ game, gameData, storybook, storybookId, lang, children }: Props) {
  const { mapRef, loading } = usePhonicsMap(
    ['mod_korean', 'mod_phonics'],
    NEEDS_SYLLABLES.has(game)
  );
  const preload = useGameAssetPreload({
    data: gameData,
    game,
    lang,
    book: storybook,
    phonicsMap: mapRef.current,
    phonicsReady: !loading,
    style: undefined, // 파닉스 유닛은 그림체 변형이 없다 — 장면 리빌도 안 쓴다.
    storybookId,
  });
  const [skipped, setSkipped] = useState(false);

  if (!preload.ready && !skipped) {
    return (
      <div className="fixed inset-0 z-[60] bg-cream-50">
        <GameLoadingGate
          loaded={preload.loaded}
          total={preload.total}
          onSkip={() => setSkipped(true)}
        />
      </div>
    );
  }
  return <>{children}</>;
}
