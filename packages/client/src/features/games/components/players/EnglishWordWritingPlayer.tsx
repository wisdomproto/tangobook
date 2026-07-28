import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle } from '../GameStyleChip';
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

const REST_MS = 450; // 마지막 글자 재생 완료 후 단어를 읽기 전 '쉬는' 간격

export function EnglishWordWritingPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
}: GamePlayerProps) {
  const { t } = useTranslation('games');
  const data = gameData as WordWritingData;
  const items = data.items;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() => items.map(() => false));
  const [scene, setScene] = useState<WordScene | null>(null);
  const completedRef = useRef(false);
  const lastLetterRef = useRef(''); // 가장 마지막에 완성한 글자 — 완성 시 이 글자 → 쉼 → 단어 순서로 재생
  const pendingPassedRef = useRef<boolean[] | null>(null);
  const logGame = useGameLogger();
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer } = useGameAudio();
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

  // 한 글자 완성 → 그 글자 소리. 단, 단어를 완성하는 마지막 글자면 여기서 재생하지 않고
  // handleWordComplete 가 [마지막 글자 → 쉼 → 단어 → 칭찬] 체인을 소유한다(음원 겹침 방지).
  // onSyllableDone 직후 onComplete 가 동기로 불리므로, microtask 로 미뤄 completedRef 로 판별한다.
  const handleLetterDone = useCallback(
    (letter: string, index: number) => {
      lastLetterRef.current = letter;
      queueMicrotask(() => {
        if (completedRef.current) return; // 마지막 글자 = handleWordComplete 가 처리
        void (async () => {
          // 🔴 낱글자가 아니라 **여기까지 이어 읽기** — b → ba → bat.
          //    파닉스 라이브러리에 그 블렌드가 있으면 그걸 쓰고, 없으면 방금 쓴 음소만 읽는다.
          const blend = letters.slice(0, index + 1).join('');
          const url =
            (await resolveTtsUrl({
              text: blend,
              language: 'english',
              storybookId,
              identifierPrefix: 'wwrite-en',
            })) ??
            (await resolveTtsUrl({
              text: letter,
              language: 'english',
              storybookId,
              identifierPrefix: 'wwrite-en',
            }));
          // 🔴 띵동 **먼저**, 끝나면 읽기 — 한 채널이라 동시에 내면 앞소리가 잘린다.
          playAudio('/sounds/game/correct.mp3', () => {
            if (url) playAudio(url);
          });
        })();
      });
    },
    [storybookId, playAudio, letters]
  );

  // 모든 글자 완성 → [마지막 글자 → 쉼 → 단어 → 칭찬] 순서로 재생 후 장면 리빌 → 다음 단어.
  // 각 단계는 onEnded 콜백으로 이어 붙여 음원 길이에 상관없이 잘리거나 겹치지 않는다.
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
      // 마지막 글자 (여러 글자 단어일 때만 — 1글자면 단어와 같으므로 생략)
      const lastLetter = lastLetterRef.current || letters[letters.length - 1];
      const lastLetterUrl =
        letters.length > 1
          ? await resolveTtsUrl({
              text: lastLetter,
              language: 'english',
              storybookId,
              identifierPrefix: 'wwrite-en',
            })
          : undefined;

      // 단어 끝까지 재생 후 → 칭찬(ttsUrl 없이 = 칭찬 파트만) → 장면 리빌/다음
      const playWordThenPraise = () => {
        playAudio(wordUrl, () => {
          playCorrectSequence({
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
        });
      };

      if (lastLetterUrl) {
        // 마지막 글자 끝까지 → 쉬고 → 단어
        playAudio(lastLetterUrl, () => scheduleTimer(playWordThenPraise, REST_MS));
      } else {
        playWordThenPraise();
      }
    })();
  }, [
    passed,
    currentIndex,
    currentItem,
    storybookId,
    letters,
    playAudio,
    playCorrectSequence,
    scheduleTimer,
    sourceStorybook,
    gameStyle.selectedStyle,
    advanceToNext,
  ]);

  return (
    <GamePlayerLayout maxWidth="3xl" bgImageUrl="/images/games/writing-bg.webp">
      <GameHeader
        title={t('cards.writing.label')}
        current={passed.filter(Boolean).length}
        total={items.length}
        onBack={onBack}
      />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 shrink-0">
          {currentItem.imageUrl && (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.word}
              // 🔴 그림이 이 화면의 문제다 — 무엇을 쓸지 알려주는 유일한 단서라 작으면 화면이 비어 보인다.
              className="h-[clamp(6rem,34vh,22rem)] w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
            />
          )}
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900">
            {t('writingGame.tracePrompt')}
          </p>
        </div>

        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div style={{ width: 'min(680px, 92vw, 75vh)' }}>
            <WordFillCanvas
              key={currentIndex}
              word={currentItem.word}
              syllables={letters}
              onSyllableDone={handleLetterDone}
              onComplete={handleWordComplete}
            />
          </div>
        </div>
      </div>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          highlight={scene.highlight}
          ttsUrl={scene.pageTtsUrl}
          onDone={() => advanceToNext(pendingPassedRef.current ?? passed)}
        />
      )}
    </GamePlayerLayout>
  );
}
