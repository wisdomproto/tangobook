import { useCallback, useMemo, useRef, useState } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData } from '@tangobook/shared';
import { decomposeWord } from '@tangobook/shared';
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
 * 한글 단어 따라쓰기 — 단어 전체를 한 번에 표시(WordFillCanvas)하고 **음절 단위**로 색칠 채점.
 * 한 음절을 다 칠하면 그 음절을 읽어주고, 모든 음절을 끝내면 단어 전체 발음 + 칭찬 + 동화 장면 리빌.
 * 체크마크는 표시하지 않는다(요청).
 */
function syllablesOf(word: string): string[] {
  if (!word) return [];
  const hangul = [...word].filter((ch) => /[가-힣]/.test(ch));
  return hangul.length > 0 ? hangul : [...word];
}

export function KoreanWordWritingPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
}: GamePlayerProps) {
  const data = gameData as WordWritingData;
  const items = data.items;

  usePreloadImages(items.map((it) => it.imageUrl));
  // 정답 단어 + 각 음절(handleSyllableDone 도 음절을 재생) 발음 프리워밍 — 게임 열 때 미리 다운로드/
  // 디코드하고 audioReady 로 게이트 → 첫 색칠 발음부터 즉시. warmed 면 즉시 통과. 2026-07-08.
  const prewarmItems = useMemo(() => {
    const out: { text: string; directUrl?: string }[] = [];
    for (const it of items) {
      out.push({ text: it.word, directUrl: it.ttsUrl });
      for (const syl of syllablesOf(it.word)) out.push({ text: syl });
    }
    return out;
  }, [items]);
  const { ready: audioReady } = usePrewarmWordTts(prewarmItems, 'korean', storybookId, 'wwrite-ko');

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
  const syllables = useMemo(() => syllablesOf(currentItem.word), [currentItem.word]);

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
      logGame({ gameType: 'korean-word-writing', storybookId, lang: 'ko', results });
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

  // 한 음절 완성 → 그 음절 읽어주기 (fire-and-forget)
  const handleSyllableDone = useCallback(
    (syl: string) => {
      void (async () => {
        const url = await resolveTtsUrl({
          text: syl,
          language: 'korean',
          storybookId,
          identifierPrefix: 'wwrite-ko',
        });
        if (url) playAudio(url);
      })();
    },
    [storybookId, playAudio]
  );

  // 모든 음절 완성 → 단어 발음 + 칭찬 + 동화 장면 리빌 → 다음 단어
  const handleWordComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const newPassed = passed.map((v, i) => (i === currentIndex ? true : v));
    setPassed(newPassed);
    void (async () => {
      const wordUrl = await resolveTtsUrl({
        text: currentItem.word,
        language: 'korean',
        storybookId,
        directUrl: currentItem.ttsUrl,
        identifierPrefix: 'wwrite-ko',
      });
      playCorrectSequence({
        ttsUrl: wordUrl,
        language: 'ko',
        onDone: () => {
          const s = resolveSceneFromWord(
            currentItem.word,
            'ko',
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
      {!audioReady && (
        <div className="absolute inset-0 z-[65] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="rounded-3xl bg-white shadow-pop px-10 py-8 sm:px-12 sm:py-10 flex flex-col items-center gap-4 border-2 border-coral-200">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[6px] border-coral-200 border-t-coral-500 animate-spin"
              aria-hidden
            />
            <p className="text-xl sm:text-2xl font-black text-ink-900 font-display">
              잠깐만 기다려 줘!
            </p>
            <p className="text-sm sm:text-base text-ink-500">소리 준비하는 중이에요...</p>
          </div>
        </div>
      )}
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
            글자를 색칠해봐
          </p>
        </div>

        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div style={{ width: 'min(680px, 92vw)' }}>
            <WordFillCanvas
              key={currentIndex}
              word={currentItem.word}
              syllables={syllables}
              onSyllableDone={handleSyllableDone}
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
