import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { decomposeHangul, type Storybook } from '@tangobook/shared';
import { storybookApi } from '@/features/storybook/api/storybook.api';
import type { ReviewCard } from '../lib/korean-phonics-units';

export interface ReviewCardSource extends ReviewCard {
  /** 그 단원의 대표 단어 */
  word: string;
  /** 대표 단어 그림 (없으면 빈 문자열) */
  imageUrl: string;
}

/** 단어의 각 음절에서 그 자리(초/중/종) 글자를 뽑는다. */
function partsAt(word: string, position: ReviewCard['matchPosition']): string[] {
  return [...word].map((ch) => decomposeHangul(ch)?.[position] ?? '');
}

/**
 * 복습 카드가 되짚는 단원의 대표 단어·그림을 고른다.
 *
 * 🔴 짝 찾기에서 **왜 짝인지 아이 눈에 보여야** 한다. 그래서 점수로 고른다:
 *  +3 첫 음절이 그 단원의 자리에 그 글자를 가짐 (ㄱ→"고기", 받침ㅇ→"형")
 *  +1 뒤 음절에라도 가짐 (ㄹ→"오리" … 한국어엔 ㄹ로 시작하는 유아 단어가 없다)
 *  -4 첫 글자가 **같은 화면의 다른 카드**와 겹침 (ㄹ 카드에 "오리"가 붙었는데 옆에 ㅇ 카드가 있으면
 *     아이가 오리를 ㅇ에 붙이는 게 더 자연스럽다 — 정답이 두 개로 보인다)
 */
export function pickWord(
  sb: Storybook | undefined,
  card: ReviewCard,
  otherLetters: readonly string[],
  rand: () => number = Math.random
): { word: string; imageUrl: string } {
  if (!sb) return { word: '', imageUrl: '' };
  const cards = (sb.flashcards ?? []) as Array<{ word?: string; imageUrl?: string }>;
  const withImage = cards.filter((c) => c.word && c.imageUrl);
  if (!withImage.length) return { word: '', imageUrl: '' };

  /**
   * 🔴 **영어는 자소 점수가 안 먹는다** — `decomposeHangul('a')` 가 전부 undefined 라 모든 후보의
   *    점수가 0 이 되어 늘 첫 단어가 뽑혔다. 한 단원이 글자를 3~4개 내는 영어 복습에서는
   *    카드 3장이 **같은 낱말·같은 그림**이 되어, 뒤집기는 똑같아 보이는 두 장이 오답 처리됐다.
   *    영어는 글자로 시작하는 낱말을 고른다.
   */
  const isEnglishCard = /^[A-Za-z_]+$/.test(card.letter);
  if (isEnglishCard) {
    const letter = card.letter.replace(/_/g, '').toLowerCase();
    const starts = withImage.filter((c) => (c.word ?? '').toLowerCase().startsWith(letter));
    const contains = withImage.filter((c) => (c.word ?? '').toLowerCase().includes(letter));
    const pool = starts.length ? starts : contains.length ? contains : withImage;
    // 같은 화면의 다른 카드가 이미 쓴 낱말은 피한다 — 판에 같은 그림이 두 장 깔리면 못 고른다.
    const fresh = pool.filter((c) => !otherLetters.includes(c.word ?? ''));
    const picked = pickOne(fresh.length ? fresh : pool, rand);
    return { word: picked?.word ?? '', imageUrl: picked?.imageUrl ?? '' };
  }

  let bestScore = -Infinity;
  let best: typeof withImage = [];
  for (const c of withImage) {
    const word = c.word ?? '';
    const parts = partsAt(word, card.matchPosition);
    let score = 0;
    if (parts[0] === card.letter) score += 3;
    else if (parts.includes(card.letter)) score += 1;
    const firstCho = decomposeHangul(word[0] ?? '')?.cho;
    if (firstCho && firstCho !== card.letter && otherLetters.includes(firstCho)) score -= 4;
    if (score > bestScore) {
      bestScore = score;
      best = [c];
    } else if (score === bestScore) {
      best.push(c); // 🔴 동점은 **모아 둔다** — 아래에서 무작위로 하나를 뽑는다.
    }
  }
  const picked = pickOne(best, rand);
  return { word: picked?.word ?? '', imageUrl: picked?.imageUrl ?? '' };
}

/**
 * 🔴 **동점 후보 중 무작위**(2026-07-30 사용자: "단어들도 랜덤으로 나오는 거 맞지? 고정된 4개 같기도").
 *
 * 예전엔 최고점 하나를 `score > bestScore` 로 뽑아서, 동점이면 **늘 앞엣것**이 이겼다. ㄱ 단원처럼
 * 타겟 낱말 넷이 다 ㄱ 으로 시작하면 넷 다 +3 동점인데 **매번 같은 하나만** 나왔고, 복습에 몇 번을
 * 들어가도 판이 늘 같은 낱말 4개였다. 점수는 "이 낱말이 그 글자를 보여주는가"를 거르는 자격 요건이지
 * 순위가 아니다 — 자격을 갖춘 것들 중엔 아무거나 좋다.
 */
function pickOne<T>(arr: readonly T[], rand: () => number): T | undefined {
  return arr.length ? arr[Math.floor(rand() * arr.length)] : undefined;
}

export function useReviewCardSources(cards: ReadonlyArray<ReviewCard>): {
  sources: ReviewCardSource[];
  isLoading: boolean;
} {
  const results = useQueries({
    queries: cards.map((c) => ({
      // 학습 단원과 같은 캐시 키 — 단원을 이미 다녀왔으면 네트워크 왕복 0.
      queryKey: ['storybook', c.unitId],
      queryFn: () => storybookApi.getById(c.unitId),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const dataKey = results.map((r) => (r.data ? '1' : '0')).join('');

  const sources = useMemo(
    () =>
      cards.map((c, i) => {
        const sb = results[i]?.data as Storybook | undefined;
        const otherLetters = cards.filter((o) => o.unitId !== c.unitId).map((o) => o.letter);
        return { ...c, ...pickWord(sb, c, otherLetters) };
      }),
    // 🔴 `results` 를 의존성에 넣으면 안 된다 — 매 렌더 새 배열이라 sources 가 계속 새로 만들어지고,
    //    이 배열을 prop 으로 받는 활동의 프리워밍 effect 가 끝없이 다시 돈다.
    //    대신 "몇 번째가 로드됐나"를 문자열로 압축한 dataKey 로 본다 (내용이 바뀌는 순간이 곧 이 값이 바뀌는 순간).
    [cards, dataKey]
  );

  /**
   * 🔴 **그림 파일까지 프리로드한 뒤에 로딩을 끝낸다**(2026-07-30 사용자: "그림이 늦게 나오는데?").
   *
   * `useQueries` 의 `isLoading` 은 storybook **데이터**(그림 URL 문자열)만 기다린다 — 실제 이미지
   * 파일은 화면에 `<img>` 가 뜰 때 비로소 받아온다. 그래서 데이터 로드 완료 → 활동 렌더 → 그제서야
   * 그림이 깜빡 늦게 떴다. 뒤집기·그림짝·듣고낱말이 **다 같은 증상**이었던 건 셋 다 이 훅을 쓰기
   * 때문 — 여기 한 곳에서 프리로드하면 세 활동이 동시에 낫는다(호출부는 이미 `isLoading` 이면
   * 로딩 화면을 띄운다).
   */
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
