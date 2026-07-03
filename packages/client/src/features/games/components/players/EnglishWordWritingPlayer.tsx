import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/design-system';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { useGameAudio } from '../../hooks/useGameAudio';
import { usePreloadImages, usePrewarmWordTts } from '../../hooks/useGamePrefetch';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { resolveTtsUrl } from '@/features/tts';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';

/**
 * 영어 단어 따라쓰기 — 단어 전체 표시 + 첫 글자만 stroke 단위 채점 (글로벌 letter-stroke-library).
 *
 * 한글 단어쓰기 (`WordWritingPlayer`) 는 canvas pixel 채점 그대로 유지.
 * 영어만 stroke 단위로 분리 — 알파벳 stroke library 한 곳 편집으로 모든 영어 쓰기 일관.
 *
 * 흐름:
 *   1. 단어 전체 (예: apple) hero 표시. 첫 글자 (a) 강조 색.
 *   2. 아래 LetterTracingCanvas 가 첫 글자 한 칸. stroke 데이터는 library 우선.
 *   3. 모든 stroke 통과 (onComplete) → 단어 TTS 재생 → 다음 단어.
 *   4. 모든 단어 완료 → onComplete (score = items.length * 100, 통과 단어당 +100).
 */
export function EnglishWordWritingPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
}: GamePlayerProps) {
  const data = gameData as WordWritingData;
  const items = data.items;

  // 이번 판 자산 워밍 — 이미지 + 정답 시 단어 TTS 지연 방지
  usePreloadImages(items.map((it) => it.imageUrl));
  usePrewarmWordTts(
    items.map((it) => ({ text: it.word, directUrl: it.ttsUrl })),
    'english',
    storybookId,
    'wwrite-en'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() => items.map(() => false));
  const [advancing, setAdvancing] = useState(false);
  const logGame = useGameLogger();
  const { playAudio, playFeedbackSound } = useGameAudio();

  const currentItem = items[currentIndex];
  const writingChar = useMemo(() => firstWritingChar(currentItem.word), [currentItem.word]);
  // 단어 나머지 (예: cup → "up") — 캔버스 옆에 큰 텍스트로 보여서 단어 컨텍스트 유지
  const restWord = useMemo(() => {
    const w = currentItem.displayWord ?? currentItem.word;
    const idx = writingChar ? w.indexOf(writingChar) : -1;
    if (idx < 0) return '';
    return w.slice(idx + writingChar.length);
  }, [currentItem.displayWord, currentItem.word, writingChar]);

  const emitFinalResults = useCallback(
    (finalPassed: boolean[]) => {
      const results: GameWordResult[] = items.map((it, i) => ({
        word: it.word,
        correct: !!finalPassed[i],
      }));
      logGame({
        gameType: 'english-word-writing',
        storybookId,
        lang: 'en',
        results,
      });
    },
    [items, logGame, storybookId]
  );

  const advanceToNext = useCallback(
    (newPassed: boolean[]) => {
      if (currentIndex + 1 >= items.length) {
        const score = newPassed.reduce((a, b) => a + (b ? 100 : 0), 0);
        emitFinalResults(newPassed);
        onComplete(score, items.length * 100);
      } else {
        setCurrentIndex((i) => i + 1);
        setAdvancing(false);
      }
    },
    [currentIndex, items.length, onComplete, emitFinalResults]
  );

  const handleLetterComplete = useCallback(
    async (ok: boolean) => {
      if (!ok || advancing) return;
      setAdvancing(true);
      // 정답 처리: 단어 TTS 재생 후 다음
      const wordAudioUrl = await resolveTtsUrl({
        text: currentItem.word,
        language: 'english',
        storybookId,
        directUrl: currentItem.ttsUrl,
        identifierPrefix: 'wwrite-en',
      });
      const newPassed = passed.map((v, i) => (i === currentIndex ? true : v));
      setPassed(newPassed);
      const continueNext = () => advanceToNext(newPassed);
      if (wordAudioUrl) {
        playAudio(wordAudioUrl, continueNext);
      } else {
        playFeedbackSound(true);
        setTimeout(continueNext, 600);
      }
    },
    [
      advancing,
      currentItem,
      storybookId,
      passed,
      currentIndex,
      advanceToNext,
      playAudio,
      playFeedbackSound,
    ]
  );

  // 단어 컨텍스트 — 첫 글자만 회색(쓰기 대상) 강조, 나머지는 coral
  const renderedWord = useMemo(() => {
    const word = currentItem.displayWord ?? currentItem.word;
    const wcStart = writingChar ? word.indexOf(writingChar) : -1;
    const wcEnd = wcStart >= 0 ? wcStart + writingChar.length : -1;
    return word.split('').map((ch, i) => {
      const isWritingRange = i >= wcStart && i < wcEnd;
      return (
        <span
          key={i}
          style={{
            color: isWritingRange ? '#d4d4d8' : '#FF7A3C',
            WebkitTextStroke: '5px white',
            paintOrder: 'stroke fill',
          }}
        >
          {ch}
        </span>
      );
    });
  }, [currentItem.displayWord, currentItem.word, writingChar]);

  return (
    <GamePlayerLayout maxWidth="3xl" bgImageUrl="/images/games/writing-bg.webp">
      <GameHeader
        title="따라 쓰기"
        current={passed.filter(Boolean).length}
        total={items.length}
        onBack={onBack}
      />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full h-full">
        {/* 단어 hero + 일러스트 */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 shrink-0">
          {currentItem.imageUrl && (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.word}
              className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
            />
          )}
          <div className="text-center">
            <p
              className="font-display font-black tracking-tight leading-none whitespace-nowrap"
              style={{
                fontSize: 'clamp(3rem, 8vw, 7rem)',
                filter: 'drop-shadow(0 5px 0 rgba(0,0,0,0.08))',
              }}
            >
              {renderedWord}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900 mt-1">
              첫 글자를 따라 써보세요
            </p>
          </div>
        </div>

        {/* 첫 글자 paint 캔버스 + 옆 나머지 글자 ("cup" → 캔버스: c, 옆: up) */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="shrink-0" style={{ width: 'min(360px, 45vh)' }}>
              <LetterFillCanvas
                key={`${currentIndex}-${writingChar}`}
                letter={writingChar}
                onResult={handleLetterComplete}
                autoCheck
                threshold={0.95}
              />
            </div>
            {restWord && (
              <span
                className="font-display font-black leading-none whitespace-nowrap"
                style={{
                  fontSize: 'clamp(3rem, 15vh, 9rem)',
                  color: '#FF7A3C',
                  WebkitTextStroke: '5px white',
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(0 5px 0 rgba(0,0,0,0.08))',
                }}
              >
                {restWord}
              </span>
            )}
          </div>
        </div>
      </div>
    </GamePlayerLayout>
  );
}

/** 영어 단어의 따라쓰기 대상 = 첫 글자 1자. 짧은 단어(≤2자)는 첫 글자만. */
function firstWritingChar(word: string): string {
  if (!word) return word;
  if (word.length <= 2) return word[0];
  return word[0];
}
