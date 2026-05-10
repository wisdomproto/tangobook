import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type {
  KoreanLineMatchingData,
  EnglishLineMatchingData,
  LineMatchingItem,
} from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { GameHeader } from '../GameHeader';
import { phonicsApi } from '@/features/phonics/api/phonics.api';
import { shuffle } from '../../utils/shuffle';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { decomposeWord } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface LineMatchingPlayerProps extends GamePlayerProps {
  lang: 'ko' | 'en';
}

interface MatchedPair {
  itemIdx: number;
}

export function LineMatchingPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
  lang,
}: LineMatchingPlayerProps) {
  const data = gameData as KoreanLineMatchingData | EnglishLineMatchingData;
  const items = data.items;

  // 이미지는 원래 순서 유지, 단어만 셔플
  const imageOrder = useMemo(() => items.map((_, i) => i), [items]);
  const wordOrder = useMemo(() => shuffle(items.map((_, i) => i)), [items]);

  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null);
  const [matched, setMatched] = useState<MatchedPair[]>([]);
  const [wrongPair, setWrongPair] = useState<{ image: number; word: number } | null>(null);
  const [finished, setFinished] = useState(false);

  const { playAudio, playFeedbackSound, playWordCorrect } = useGameAudio();

  const isMatched = useCallback(
    (itemIdx: number) => matched.some((m) => m.itemIdx === itemIdx),
    [matched]
  );

  // 사용자 정책 (2026-05-10): 한글 → phonics 음절 합성 우선 / 영어 → ttsUrl 우선
  const playWordTts = useCallback(
    async (item: LineMatchingItem) => {
      const hasHangul = /[가-힣]/.test(item.word);
      if (hasHangul) {
        // 한글: phonics concat 우선
        try {
          const result = await phonicsApi.concatPhonicsAudio({
            text: item.word,
            storybookId,
            identifier: `line-matching-ko-${item.word}`,
            language: 'korean',
          });
          if (result.audioUrl) {
            playAudio(result.audioUrl);
            return;
          }
        } catch {
          /* phonics 실패 — ttsUrl 폴백 */
        }
        if (item.ttsUrl) playAudio(item.ttsUrl);
      } else {
        // 영어: ttsUrl 우선
        if (item.ttsUrl) {
          playAudio(item.ttsUrl);
          return;
        }
        try {
          const result = await phonicsApi.concatPhonicsAudio({
            text: item.word,
            storybookId,
            identifier: `line-matching-en-${item.word}`,
            language: 'english',
          });
          if (result.audioUrl) playAudio(result.audioUrl);
        } catch {
          /* 무시 */
        }
      }
    },
    [playAudio, storybookId]
  );

  // 양쪽 다 선택되면 매칭 체크
  useEffect(() => {
    if (selectedImageIdx === null || selectedWordIdx === null) return;

    const isMatch = selectedImageIdx === selectedWordIdx;
    if (isMatch) {
      const newMatched = [...matched, { itemIdx: selectedImageIdx }];
      setMatched(newMatched);
      const matchedItem = items[selectedImageIdx];
      // 단어 1개 정답 — 효과음 + TTS (호리/칭찬음원 X). 마지막 다 맞추면 GameResultScreen 이 호리.
      playWordCorrect();
      setTimeout(() => {
        void playWordTts(matchedItem);
      }, 300);
      setSelectedImageIdx(null);
      setSelectedWordIdx(null);

      if (newMatched.length >= items.length) {
        setTimeout(() => setFinished(true), 1200);
      }
    } else {
      setWrongPair({ image: selectedImageIdx, word: selectedWordIdx });
      playFeedbackSound(false);
      setTimeout(() => {
        setSelectedImageIdx(null);
        setSelectedWordIdx(null);
        setWrongPair(null);
      }, 700);
    }
  }, [
    selectedImageIdx,
    selectedWordIdx,
    matched,
    items,
    playWordCorrect,
    playFeedbackSound,
    playWordTts,
  ]);

  const logGame = useGameLogger();
  useEffect(() => {
    if (!finished) return;
    onComplete(items.length, items.length);
    const results: GameWordResult[] = [];
    for (const it of items) {
      results.push({ word: it.word, correct: true });
      if (lang === 'ko') {
        for (const syl of decomposeWord(it.word)) {
          results.push({ correct: true, consonant: syl.cho, vowel: syl.jung });
        }
      }
    }
    logGame({
      gameType: lang === 'ko' ? 'korean-line-matching' : 'english-line-matching',
      storybookId,
      lang,
      results,
    });
  }, [finished, items, onComplete, lang, logGame, storybookId]);

  const handleRestart = useCallback(() => {
    setMatched([]);
    setSelectedImageIdx(null);
    setSelectedWordIdx(null);
    setWrongPair(null);
    setFinished(false);
  }, []);

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={items.length}
        total={items.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  // 카드 ref — SVG 곡선 줄긋기 좌표 측정용
  const areaRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const wordRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // 매칭 줄 — 좌표는 useLayoutEffect 에서 계산
  const [lines, setLines] = useState<
    Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      color: string;
      key: string;
    }>
  >([]);

  const computeLines = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    const areaRect = area.getBoundingClientRect();
    const result: typeof lines = [];

    // 매칭 완료 — success 색
    matched.forEach((m) => {
      const imgEl = imageRefs.current.get(m.itemIdx);
      const wordEl = wordRefs.current.get(m.itemIdx);
      if (!imgEl || !wordEl) return;
      const imgRect = imgEl.getBoundingClientRect();
      const wordRect = wordEl.getBoundingClientRect();
      result.push({
        from: {
          x: imgRect.right - areaRect.left,
          y: imgRect.top + imgRect.height / 2 - areaRect.top,
        },
        to: {
          x: wordRect.left - areaRect.left,
          y: wordRect.top + wordRect.height / 2 - areaRect.top,
        },
        color: '#5CC99F',
        key: `m-${m.itemIdx}`,
      });
    });

    // 현재 양쪽 모두 선택 — 매칭 체크 직전 — coral 색 (잠깐)
    if (selectedImageIdx !== null && selectedWordIdx !== null) {
      const imgEl = imageRefs.current.get(selectedImageIdx);
      const wordEl = wordRefs.current.get(selectedWordIdx);
      if (imgEl && wordEl) {
        const imgRect = imgEl.getBoundingClientRect();
        const wordRect = wordEl.getBoundingClientRect();
        result.push({
          from: {
            x: imgRect.right - areaRect.left,
            y: imgRect.top + imgRect.height / 2 - areaRect.top,
          },
          to: {
            x: wordRect.left - areaRect.left,
            y: wordRect.top + wordRect.height / 2 - areaRect.top,
          },
          color: '#FF5E3A',
          key: 'active',
        });
      }
    }
    setLines(result);
  }, [matched, selectedImageIdx, selectedWordIdx]);

  useLayoutEffect(() => {
    computeLines();
  }, [computeLines]);

  // resize 시 좌표 재계산
  useEffect(() => {
    const onResize = () => computeLines();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [computeLines]);

  // SVG path 곡선 — Bezier
  const pathD = (l: { from: { x: number; y: number }; to: { x: number; y: number } }) => {
    const midX = (l.from.x + l.to.x) / 2;
    return `M ${l.from.x} ${l.from.y} C ${midX} ${l.from.y}, ${midX} ${l.to.y}, ${l.to.x} ${l.to.y}`;
  };

  // 카드 base — 흰 배경 + 둥근 모서리. border 얇게 (시안 처럼 부드럽게).
  const cardBase =
    'relative rounded-2xl bg-white shadow-soft border-2 transition-all cursor-pointer';

  const imageCardClass = (itemIdx: number) => {
    if (isMatched(itemIdx)) return cn(cardBase, 'border-success cursor-default');
    if (wrongPair?.image === itemIdx) return cn(cardBase, 'border-danger animate-shake');
    if (selectedImageIdx === itemIdx) return cn(cardBase, 'border-coral-500 ring-4 ring-coral-200');
    return cn(cardBase, 'border-transparent hover:border-coral-300 hover:scale-[1.02]');
  };

  const wordCardClass = (itemIdx: number) => {
    if (isMatched(itemIdx)) return cn(cardBase, 'border-success cursor-default');
    if (wrongPair?.word === itemIdx) return cn(cardBase, 'border-danger animate-shake');
    if (selectedWordIdx === itemIdx) return cn(cardBase, 'border-coral-500 ring-4 ring-coral-200');
    return cn(cardBase, 'border-transparent hover:border-coral-300 hover:scale-[1.02]');
  };

  // connection point dot — 카드 가장자리에 표시 (SVG 시작/끝점)
  const connectionDot = (state: 'matched' | 'active' | 'idle', side: 'left' | 'right') => {
    const colorClass =
      state === 'matched' ? 'bg-success' : state === 'active' ? 'bg-coral-500' : 'bg-ink-100';
    const sideClass = side === 'left' ? '-left-2' : '-right-2';
    return (
      <span
        aria-hidden
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ring-2 ring-white shadow-soft',
          colorClass,
          sideClass
        )}
      />
    );
  };

  const imageDotState = (itemIdx: number) =>
    isMatched(itemIdx) ? 'matched' : selectedImageIdx === itemIdx ? 'active' : 'idle';
  const wordDotState = (itemIdx: number) =>
    isMatched(itemIdx) ? 'matched' : selectedWordIdx === itemIdx ? 'active' : 'idle';

  return (
    <GamePlayerLayout maxWidth="full" bgImageUrl="/images/games/line-matching-bg.png">
      <div className="flex flex-col w-full h-full relative">
        <GameHeader
          title="그림짝 맞추기"
          current={matched.length}
          total={items.length}
          onBack={onBack}
        />

        {/* 메인 게임 영역 — 좌우 padding 으로 양옆 여백 + 좌/우 column 30% / SVG 가운데 30% */}
        <div ref={areaRef} className="flex-1 relative min-h-0 px-12 lg:px-24">
          {/* 좌측 그림 column — absolute. grid-rows-N 균등. 카드 4개 = 화면 안 모두 fit. */}
          <div
            className="absolute left-12 lg:left-24 top-0 bottom-0 w-[30%] grid gap-4"
            style={{ gridTemplateRows: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {imageOrder.map((imageItemIdx) => {
              const imageItem = items[imageItemIdx];
              return (
                <div key={`img-${imageItemIdx}`} className="relative">
                  <button
                    ref={(el) => {
                      if (el) imageRefs.current.set(imageItemIdx, el);
                      else imageRefs.current.delete(imageItemIdx);
                    }}
                    onClick={() => !isMatched(imageItemIdx) && setSelectedImageIdx(imageItemIdx)}
                    disabled={isMatched(imageItemIdx)}
                    className={cn(imageCardClass(imageItemIdx), 'w-full h-full overflow-hidden')}
                    aria-label="그림 선택"
                  >
                    <img
                      src={imageItem.imageUrl}
                      alt=""
                      className="w-full h-full object-contain p-4 lg:p-6"
                    />
                  </button>
                  {connectionDot(imageDotState(imageItemIdx), 'right')}
                </div>
              );
            })}
          </div>

          {/* 우측 단어 column — absolute. 동일 grid. */}
          <div
            className="absolute right-12 lg:right-24 top-0 bottom-0 w-[30%] grid gap-4"
            style={{ gridTemplateRows: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {wordOrder.map((wordItemIdx) => {
              const wordItem = items[wordItemIdx];
              return (
                <div key={`word-${wordItemIdx}`} className="relative">
                  <button
                    ref={(el) => {
                      if (el) wordRefs.current.set(wordItemIdx, el);
                      else wordRefs.current.delete(wordItemIdx);
                    }}
                    onClick={() => !isMatched(wordItemIdx) && setSelectedWordIdx(wordItemIdx)}
                    disabled={isMatched(wordItemIdx)}
                    className={cn(
                      wordCardClass(wordItemIdx),
                      'w-full h-full flex flex-col items-center justify-center px-6 py-4'
                    )}
                    aria-label={`단어: ${wordItem.word}`}
                  >
                    <span className="text-3xl lg:text-5xl font-black text-ink-900 font-display leading-tight">
                      {wordItem.word}
                    </span>
                    {wordItem.subLabel && (
                      <span className="text-sm lg:text-base font-bold text-ink-500 mt-1">
                        {wordItem.subLabel}
                      </span>
                    )}
                  </button>
                  {connectionDot(wordDotState(wordItemIdx), 'left')}
                </div>
              );
            })}
          </div>

          {/* SVG 곡선 줄 — 카드 사이 가운데 영역 (areaRef 풀폭 sandbox). pointer-events X. */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {lines.map((l) => (
              <path
                key={l.key}
                d={pathD(l)}
                stroke={l.color}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                style={{ transition: 'stroke 200ms ease' }}
              />
            ))}
          </svg>
        </div>
      </div>
    </GamePlayerLayout>
  );
}
