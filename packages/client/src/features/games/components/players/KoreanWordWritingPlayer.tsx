import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData } from '@tangobook/shared';
import { decomposeWord } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useGameEntryGuide } from '../../hooks/useGameEntryGuide';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle } from '../GameStyleChip';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { resolveTtsUrl } from '@/features/tts';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { useStorybook } from '@/features/storybook';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';
import { ENTRY_GUIDE, voiceUrl } from '@/features/phonics-learner/hooks/useEntryGuide';

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

const REST_MS = 450; // 마지막 음절 재생 완료 후 단어를 읽기 전 '쉬는' 간격

export function KoreanWordWritingPlayer({
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
  const lastSylRef = useRef(''); // 가장 마지막에 완성한 음절 — 완성 시 이 음절 → 쉼 → 단어 순서로 재생
  const pendingPassedRef = useRef<boolean[] | null>(null);
  const logGame = useGameLogger();
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer } = useGameAudio();
  const { data: sourceStorybook } = useStorybook(storybookId);
  const gameStyle = useGameStyle(sourceStorybook);

  const currentItem = items[currentIndex];
  const syllables = useMemo(() => syllablesOf(currentItem.word), [currentItem.word]);

  // 🔴 진입 안내 음성 — 파닉스 쓰기 활동과 통일(사용자: "어디서는 따라 써봐 멘트 나오고 어디서는 안 나오네").
  useGameEntryGuide(voiceUrl(ENTRY_GUIDE.writeTrace), playAudio);

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

  // 한 음절 완성 → 그 음절 읽어주기. 단, 이 음절이 단어를 완성하는 마지막 음절이면 여기서 재생하지 않고
  // handleWordComplete 가 [마지막 음절 → 쉼 → 단어 → 칭찬] 체인을 소유한다(음원 겹침 방지).
  // onSyllableDone 직후 onComplete 가 동기로 불리므로, microtask 로 미뤄 completedRef 로 판별한다.
  const handleSyllableDone = useCallback(
    (syl: string, index: number) => {
      lastSylRef.current = syl;
      queueMicrotask(() => {
        if (completedRef.current) return; // 마지막 음절 = handleWordComplete 가 처리
        void (async () => {
          // 🔴 여기까지 이어 읽기(고 → 고기). 라이브러리에 그 조합이 없으면 방금 쓴 음절만.
          const blend = syllables.slice(0, index + 1).join('');
          const url =
            (await resolveTtsUrl({
              text: blend,
              language: 'korean',
              storybookId,
              identifierPrefix: 'wwrite-ko',
            })) ??
            (await resolveTtsUrl({
              text: syl,
              language: 'korean',
              storybookId,
              identifierPrefix: 'wwrite-ko',
            }));
          // 🔴 띵동 **먼저**, 끝나면 읽기 — 한 채널이라 동시에 내면 앞소리가 잘린다.
          playAudio('/sounds/game/correct.mp3', () => {
            if (url) playAudio(url);
          });
        })();
      });
    },
    [storybookId, playAudio, syllables]
  );

  // 모든 음절 완성 → [마지막 음절 → 쉼 → 단어 → 칭찬] 순서로 재생 후 동화 장면 리빌 → 다음 단어.
  // 각 단계는 onEnded 콜백으로 이어 붙여 음원 길이에 상관없이 잘리거나 겹치지 않는다.
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
      // 마지막 음절(여러 음절 단어일 때만 — 1음절이면 단어와 같으므로 생략)
      const lastSyl = lastSylRef.current || syllables[syllables.length - 1];
      const lastSylUrl =
        syllables.length > 1
          ? await resolveTtsUrl({
              text: lastSyl,
              language: 'korean',
              storybookId,
              identifierPrefix: 'wwrite-ko',
            })
          : undefined;

      // 단어 끝까지 재생 후 → 칭찬(ttsUrl 없이 = 칭찬 파트만) → 장면 리빌/다음
      const playWordThenPraise = () => {
        playAudio(wordUrl, () => {
          playCorrectSequence({
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
        });
      };

      if (lastSylUrl) {
        // 마지막 음절 끝까지 → 쉬고 → 단어
        playAudio(lastSylUrl, () => scheduleTimer(playWordThenPraise, REST_MS));
      } else {
        playWordThenPraise();
      }
    })();
  }, [
    passed,
    currentIndex,
    currentItem,
    storybookId,
    syllables,
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
              className="h-[clamp(4rem,20vh,18rem)] w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
            />
          )}
          {/* 🔴 "색칠해봐"→"따라 써봐" 로 통일 — 앱의 나머지 쓰기 화면·음성이 전부 "따라 써봐"다. */}
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900">
            {t('writingGame.tracePrompt')}
          </p>
        </div>

        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div style={{ width: 'min(680px, 92vw, 75vh)' }}>
            <WordFillCanvas
              key={currentIndex}
              word={currentItem.word}
              syllables={syllables}
              onSyllableDone={handleSyllableDone}
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
