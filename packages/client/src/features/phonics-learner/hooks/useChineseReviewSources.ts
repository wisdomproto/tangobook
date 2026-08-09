import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Storybook } from '@tangobook/shared';
import { storybookApi } from '@/features/storybook/api/storybook.api';
import { warmAudioUrl } from '@/features/games/hooks/useGamePrefetch';
import { phonicsToWordChoices } from '../lib/phonics-game-adapter';
import { hanziFor } from '../lib/chinese-phonics-units';

/**
 * 병음 복습 카드 한 장 — 되짚는 낱말 유닛의 낱말 하나.
 *
 * 🔴 필드가 한글 `ReviewCardSource`(letter/syllable/sound/matchPosition + word/imageUrl/ttsUrl)의
 *    **상위집합**이라 그 슬롯을 쓰는 활동(뒤집기 짝 맞추기)에 그대로 넘길 수 있다.
 *    `letter` = 병음(뒤집기·사냥의 매칭 키) — 낱말마다 유일하다.
 */
export interface ChineseReviewCard {
  unitId: string;
  letter: string; // = word (병음) — 뒤집기 매칭 키
  syllable: string; // = word
  sound: string; // = word
  matchPosition: 'cho';
  word: string; // 병음
  hanzi?: string; // 한자 병기(米)
  imageUrl: string;
  ttsUrl?: string; // 낱말 저작 녹음(mod_chinese 직행)
}

/**
 * 복습이 되짚는 낱말 유닛들의 storybook 을 병렬 로드해 낱말 카드로 만든다.
 *
 * 🔴 학습 단원과 **같은 캐시 키**(`['storybook', id]`)라 이미 다녀왔으면 왕복 0.
 * 🔴 **그림 파일까지 프리로드한 뒤 로딩을 끝낸다**(한글 `useReviewCardSources` 와 같은 이유 —
 *    `useQueries.isLoading` 은 그림 URL 문자열만 기다려, 실제 이미지가 `<img>` 뜰 때 늦게 온다).
 * 🔴 낱말 음원(directUrl)도 진입 시 데운다 — 뒤집기·짝찾기·듣기·성조가 이 직행 URL 을 재생하므로,
 *    텍스트 warm(concat 경로)이 아니라 **그 URL 자체**를 데워야 첫 탭이 안 늦는다.
 */
export function useChineseReviewSources(coveredUnitIds: ReadonlyArray<string>): {
  sources: ChineseReviewCard[];
  isLoading: boolean;
} {
  const results = useQueries({
    queries: coveredUnitIds.map((id) => ({
      queryKey: ['storybook', id],
      queryFn: () => storybookApi.getById(id),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const dataKey = results.map((r) => (r.data ? '1' : '0')).join('');

  const sources = useMemo(
    () =>
      coveredUnitIds.flatMap((id, i) => {
        const sb = results[i]?.data as Storybook | undefined;
        if (!sb) return [];
        return phonicsToWordChoices(sb).map((w) => ({
          unitId: id,
          letter: w.word,
          syllable: w.word,
          sound: w.word,
          matchPosition: 'cho' as const,
          word: w.word,
          hanzi: hanziFor(w.word),
          imageUrl: w.imageUrl,
          ...(w.ttsUrl ? { ttsUrl: w.ttsUrl } : {}),
        }));
      }),
    // 🔴 `results` 신원이 아니라 "몇 번째가 로드됐나"(dataKey)로 — 매 렌더 새 배열이면 sources 가 끝없이 새로 만들어진다.
    [coveredUnitIds, dataKey]
  );

  // 낱말 음원(directUrl) 프리워밍 — 백그라운드, 로딩 게이트엔 넣지 않는다(그림만 기다린다).
  const audioKey = sources
    .map((s) => s.ttsUrl)
    .filter(Boolean)
    .join('|');
  useEffect(() => {
    if (!audioKey) return;
    let alive = true;
    void (async () => {
      for (const url of audioKey.split('|')) {
        if (!alive) return;
        try {
          await warmAudioUrl(url);
        } catch {
          /* 한 건 실패가 나머지를 막지 않는다 */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [audioKey]);

  // 그림 파일 프리로드 — 다 받은 뒤에야 로딩을 끝낸다.
  const imageKey = sources
    .map((s) => s.imageUrl)
    .filter(Boolean)
    .join('|');
  const [imagesReady, setImagesReady] = useState(false);
  useEffect(() => {
    const urls = imageKey ? imageKey.split('|') : [];
    if (!urls.length) {
      setImagesReady(true);
      return;
    }
    setImagesReady(false);
    let alive = true;
    let left = urls.length;
    const done = () => {
      if (--left <= 0 && alive) setImagesReady(true);
    };
    const imgs = urls.map((url) => {
      const img = new Image();
      img.onload = done;
      img.onerror = done; // 못 받아도 무한 로딩은 안 된다 — 그 카드만 안 뜬다.
      img.src = url;
      return img;
    });
    return () => {
      alive = false;
      imgs.forEach((img) => {
        img.onload = img.onerror = null;
      });
    };
  }, [imageKey]);

  return { sources, isLoading: isLoading || !imagesReady };
}
