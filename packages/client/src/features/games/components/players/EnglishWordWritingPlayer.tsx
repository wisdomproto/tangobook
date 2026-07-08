import { useCallback, useMemo, useRef, useState } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { useGameAudio } from '../../hooks/useGameAudio';
import { usePreloadImages, usePrewarmWordTts } from '../../hooks/useGamePrefetch';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle, GameStyleChip } from '../GameStyleChip';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { resolveTtsUrl } from '@/features/tts';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { useStorybook } from '@/features/storybook';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';

/**
 * 영어 단어 따라쓰기 — 단어 전체를 한 번에 표시(WordFillCanvas)하고 **글자 단위**로 색칠 채점.
 * 한 글자를 다 칠하면 그 글자 소리를 읽어주고, 모든 글자를 끝내면 단어 발음 + 칭찬 + 동화 장면 리빌.
 * 체크마크는 표시하지 않는다(요청).
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

  usePreloadImages(items.map((it) => it.imageUrl));
  // 정답 단어 + 각 글자(handleLetterDone 도 글자 재생) 백그라운드 프리워밍 — 논블로킹.
  // (캐싱은 R2 immutable Cache-Control + 서비스워커 담당 → 스피너 게이트 불필요.)
  const prewarmItems = useMemo(() => {
    const out: { text: string; directUrl?: string }[] = [];
    for (const it of items) {
      out.push({ text: it.word, directUrl: it.ttsUrl });
      for (const l of lettersOf(it.word)) out.push({ text: l });
    }
    return out;
  }, [items]);
  usePrewarmWordTts(prewarmItems, 'english', storybookId, 'wwrite-en');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() => items.map(() => false));
  const [scene, setScene] = useState<WordScene | null>(null);
  const completedRef = useRef(false);
  const pendingPassedRef = useRef<boolean[] | null>(null);
  const logGame = useGameLogger();
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const { data: sourceStorybook } = useStorybook(storybookId);
  const gameStyle = useGameStyle(sourceStorybook);

  const currentItem = items[currentIndex];
  const letters = useMemo(() => lettersOf(currentItem.word), [currentItem.word]);

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
        completedRef.current = false;
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentIndex, items.length, onComplete, emitFinalResults]
  );

  const handleLetterDone = useCallback(
    (letter: string) => {
      void (async () => {
        const url = await resolveTtsUrl({
          text: letter,
          language: 'english',
          storybookId,
          identifierPrefix: 'wwrite-en',
        });
        if (url) playAudio(url);
      })();
    },
    [storybookId, playAudio]
  );

  const handleWordComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
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
          const s = resolveSceneFromWord(
            currentItem.word,
            'en',
            sourceStorybook,
            gameStyle.selectedStyle
          );
          if (s) {
            pendingPassedRef.current = newPassed;
            setScene(s);
          } else {
            advanceToNext(newPassed);
          }
        },
      });
    })();
  }, [
    passed,
    currentIndex,
    currentItem,
    storybookId,
    playCorrectSequence,
    sourceStorybook,
    gameStyle.selectedStyle,
    advanceToNext,
  ]);

  return (
    <GamePlayerLayout maxWidth="3xl" bgImageUrl="/images/games/writing-bg.webp">
      <GameHeader
        title="따라 쓰기"
        current={passed.filter(Boolean).length}
        total={items.length}
        onBack={onBack}
        rightExtra={
          gameStyle.canPick ? (
            <GameStyleChip
              styles={gameStyle.styles}
              index={gameStyle.index}
              onCycle={gameStyle.setIndex}
            />
          ) : undefined
        }
      />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full h-full">
        <div className="flex items-center justify-center gap-3 sm:gap-5 shrink-0">
          {currentItem.imageUrl && (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.word}
              className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
            />
          )}
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900">
            글자를 따라 써봐
          </p>
        </div>

        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div style={{ width: 'min(680px, 92vw)' }}>
            <WordFillCanvas
              key={currentIndex}
              word={currentItem.word}
              syllables={letters}
              onSyllableDone={handleLetterDone}
              onComplete={handleWordComplete}
              threshold={0.9}
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
