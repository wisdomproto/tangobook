import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/design-system';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData } from '@tangobook/shared';
import { decomposeWord } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { useGameAudio } from '../../hooks/useGameAudio';
import { usePreloadImages, usePrewarmWordTts } from '../../hooks/useGamePrefetch';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { resolveTtsUrl } from '@/features/tts';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';

/**
 * 한글 단어 따라쓰기 — paint 모드 (LetterFillCanvas).
 *
 * 한글 단어의 첫 음절 1자 (꽃밭→꽃) 만 채점.
 * paint 모드: 글자 영역 안만 painted, 채움 비율 (coverage) 로 통과 판정.
 * 폰트 fidelity 100% (NanumSquareRound 그대로 채점 대상).
 *
 * 영어 단어쓰기 (EnglishWordWritingPlayer) 는 stroke library, 한글은 paint — 본질적으로 다른 시스템.
 */
function firstWritingChar(word: string): string {
  if (!word) return word;
  const hangul = word.match(/[가-힣]/);
  if (hangul) return hangul[0];
  return word[0];
}

export function KoreanWordWritingPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
}: GamePlayerProps) {
  const data = gameData as WordWritingData;
  const items = data.items;

  // 이번 판 자산 워밍 — 이미지 + 정답 시 단어 TTS(concat) 지연 방지
  usePreloadImages(items.map((it) => it.imageUrl));
  usePrewarmWordTts(
    items.map((it) => ({ text: it.word, directUrl: it.ttsUrl })),
    'korean',
    storybookId,
    'wwrite-ko'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() => items.map(() => false));
  const [advancing, setAdvancing] = useState(false);
  const logGame = useGameLogger();
  const { playAudio } = useGameAudio();

  const currentItem = items[currentIndex];
  const writingChar = useMemo(() => firstWritingChar(currentItem.word), [currentItem.word]);

  const emitFinalResults = useCallback(
    (finalPassed: boolean[]) => {
      const results: GameWordResult[] = [];
      for (let i = 0; i < items.length; i++) {
        const correct = !!finalPassed[i];
        results.push({ word: items[i].word, correct });
        for (const syl of decomposeWord(items[i].word)) {
          results.push({ correct, consonant: syl.cho, vowel: syl.jung });
        }
      }
      logGame({
        gameType: 'korean-word-writing',
        storybookId,
        lang: 'ko',
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

  const handleResult = useCallback(
    async (ok: boolean) => {
      if (!ok || advancing) return;
      setAdvancing(true);
      // 전체 단어 발음 (resolveTtsUrl 정책 그대로)
      const wordAudioUrl = await resolveTtsUrl({
        text: currentItem.word,
        language: 'korean',
        storybookId,
        directUrl: currentItem.ttsUrl,
        identifierPrefix: 'wwrite-ko',
      });
      const newPassed = passed.map((v, i) => (i === currentIndex ? true : v));
      setPassed(newPassed);
      const continueNext = () => advanceToNext(newPassed);
      if (wordAudioUrl) {
        playAudio(wordAudioUrl, continueNext);
      } else {
        setTimeout(continueNext, 600);
      }
    },
    [advancing, currentItem, storybookId, passed, currentIndex, advanceToNext, playAudio]
  );

  // 단어 컨텍스트 — 첫 음절만 회색 강조 + 나머지는 coral (paint canvas 옆 표시)
  const restWord = useMemo(() => {
    const w = currentItem.displayWord ?? currentItem.word;
    const idx = writingChar ? w.indexOf(writingChar) : -1;
    if (idx < 0) return '';
    return w.slice(idx + writingChar.length);
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
              <span
                style={{
                  color: '#d4d4d8',
                  WebkitTextStroke: '5px white',
                  paintOrder: 'stroke fill',
                }}
              >
                {writingChar}
              </span>
              {restWord && (
                <span
                  style={{
                    color: '#FF7A3C',
                    WebkitTextStroke: '5px white',
                    paintOrder: 'stroke fill',
                  }}
                >
                  {restWord}
                </span>
              )}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900 mt-1">
              첫 글자를 색칠해봐
            </p>
          </div>
        </div>

        {/* 첫 음절 paint canvas */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div style={{ width: 'min(420px, 55vh)' }}>
            <LetterFillCanvas
              key={`${currentIndex}-${writingChar}`}
              letter={writingChar}
              onResult={handleResult}
              autoCheck
              threshold={0.95}
            />
          </div>
        </div>
      </div>
    </GamePlayerLayout>
  );
}
