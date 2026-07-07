import { useCallback, useMemo, useRef, useState } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { useGameAudio } from '../../hooks/useGameAudio';
import { usePreloadImages, usePrewarmWordTts } from '../../hooks/useGamePrefetch';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { resolveTtsUrl } from '@/features/tts';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { useStorybook } from '@/features/storybook';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';

/**
 * 영어 단어 따라쓰기 — paint 모드 (LetterFillCanvas).
 *
 * 단어의 **모든 글자**를 순서대로 한 글자씩 색칠. 한 글자를 다 칠하면 그 글자 소리를 읽어주고,
 * 마지막 글자까지 끝내면 단어 전체 발음 + 칭찬 + 그 단어가 나오는 동화 장면(나레이션) 리빌.
 */
function lettersOf(word: string): string[] {
  if (!word) return [];
  const letters = [...word].filter((ch) => /[a-zA-Z]/.test(ch));
  return letters.length > 0 ? letters : [...word];
}

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
  const [letterIndex, setLetterIndex] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() => items.map(() => false));
  const [advancing, setAdvancing] = useState(false);
  const [scene, setScene] = useState<WordScene | null>(null);
  const pendingPassedRef = useRef<boolean[] | null>(null);
  const logGame = useGameLogger();
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const { data: sourceStorybook } = useStorybook(storybookId);

  const currentItem = items[currentIndex];
  const letters = useMemo(() => lettersOf(currentItem.word), [currentItem.word]);
  const currentLetter = letters[letterIndex] ?? currentItem.word;

  const emitFinalResults = useCallback(
    (finalPassed: boolean[]) => {
      const results: GameWordResult[] = items.map((it, i) => ({
        word: it.word,
        correct: !!finalPassed[i],
      }));
      logGame({ gameType: 'english-word-writing', storybookId, lang: 'en', results });
    },
    [items, logGame, storybookId]
  );

  const advanceToNext = useCallback(
    (newPassed: boolean[]) => {
      setScene(null);
      if (currentIndex + 1 >= items.length) {
        const score = newPassed.reduce((a, b) => a + (b ? 100 : 0), 0);
        emitFinalResults(newPassed);
        onComplete(score, items.length * 100);
      } else {
        setCurrentIndex((i) => i + 1);
        setLetterIndex(0);
        setAdvancing(false);
      }
    },
    [currentIndex, items.length, onComplete, emitFinalResults]
  );

  const handleLetterComplete = useCallback(
    async (ok: boolean) => {
      if (!ok || advancing) return;
      setAdvancing(true);
      const isLastLetter = letterIndex >= letters.length - 1;
      // 방금 쓴 글자 소리 읽어주기
      const letterUrl = await resolveTtsUrl({
        text: currentLetter,
        language: 'english',
        storybookId,
        identifierPrefix: 'wwrite-en',
      });
      const afterLetter = () => {
        if (!isLastLetter) {
          setLetterIndex((i) => i + 1);
          setAdvancing(false);
          return;
        }
        const newPassed = passed.map((v, i) => (i === currentIndex ? true : v));
        setPassed(newPassed);
        void (async () => {
          const wordUrl = await resolveTtsUrl({
            text: currentItem.word,
            language: 'english',
            storybookId,
            directUrl: currentItem.ttsUrl,
            identifierPrefix: 'wwrite-en',
          });
          playCorrectSequence({
            ttsUrl: wordUrl,
            language: 'en',
            onDone: () => {
              const s = resolveSceneFromWord(currentItem.word, 'en', sourceStorybook);
              if (s) {
                pendingPassedRef.current = newPassed;
                setScene(s);
              } else {
                advanceToNext(newPassed);
              }
            },
          });
        })();
      };
      if (letterUrl) playAudio(letterUrl, afterLetter);
      else afterLetter();
    },
    [
      advancing,
      letterIndex,
      letters.length,
      currentLetter,
      currentItem,
      storybookId,
      passed,
      currentIndex,
      advanceToNext,
      playAudio,
      playCorrectSequence,
      sourceStorybook,
    ]
  );

  return (
    <GamePlayerLayout maxWidth="3xl" bgImageUrl="/images/games/writing-bg.webp">
      <GameHeader
        title="따라 쓰기"
        current={passed.filter(Boolean).length}
        total={items.length}
        onBack={onBack}
      />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full h-full">
        {/* 단어 hero + 일러스트 — 이미 쓴 글자는 coral, 지금 쓸 글자는 회색, 남은 글자는 연회색 */}
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
              {letters.map((ch, i) => (
                <span
                  key={i}
                  style={{
                    color: i < letterIndex ? '#FF7A3C' : i === letterIndex ? '#d4d4d8' : '#e8e8ec',
                    WebkitTextStroke: '5px white',
                    paintOrder: 'stroke fill',
                  }}
                >
                  {ch}
                </span>
              ))}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900 mt-1">
              {letters.length > 1 ? `${letterIndex + 1}번째 글자를 따라 써봐` : '글자를 따라 써봐'}
            </p>
          </div>
        </div>

        {/* 현재 글자 paint 캔버스 — 글자마다 리셋(key) */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div style={{ width: 'min(420px, 55vh)' }}>
            <LetterFillCanvas
              key={`${currentIndex}-${letterIndex}-${currentLetter}`}
              letter={currentLetter}
              onResult={handleLetterComplete}
              autoCheck
              threshold={0.95}
            />
          </div>
        </div>
      </div>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          ttsUrl={scene.pageTtsUrl}
          onDone={() => advanceToNext(pendingPassedRef.current ?? passed)}
        />
      )}
    </GamePlayerLayout>
  );
}
