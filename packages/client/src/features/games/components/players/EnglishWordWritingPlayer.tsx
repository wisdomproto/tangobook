import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  patternHighlight,
  wordMatchesPattern,
} from '@/features/phonics-learner/lib/english-phonics-units';

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

/** 진입 안내 — 화면의 "글자를 따라 써봐" 텍스트에 맞는 음성(파닉스 쓰기 활동과 같은 정적 자산). */
const WRITE_GUIDE_SOUND = '/sounds/voice/write-trace-ko.mp3';

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
  const pendingPassedRef = useRef<boolean[] | null>(null);
  const logGame = useGameLogger();
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const { data: sourceStorybook } = useStorybook(storybookId);
  const gameStyle = useGameStyle(sourceStorybook);

  const currentItem = items[currentIndex];
  // 🔴 Book 1 은 낱말 전체(apple)를 그리되 **첫 글자(a)만** 채점한다(`traceWord`) — 나머지는 회색 가이드로
  //    남아 낱말이 화면에 보인다. traceWord 없으면(Book 2~) 낱말 전체를 쓴다.
  const letters = useMemo(
    () => (currentItem.traceWord ? lettersOf(currentItem.traceWord) : lettersOf(currentItem.word)),
    [currentItem.word, currentItem.traceWord]
  );

  /**
   * 🔴 **쓰는 순서 = 패턴 먼저**(2026-08-06 사용자: "낱말쓰기 게임도 순서 익히기처럼"). 익히기 써보기와
   *    같은 규칙 — 단원 패턴이 낱말에 있으면 그 자리를 먼저(시각 순서), 그다음 나머지. bake→`[1,2,3,0]`.
   *    파닉스 단원이 아니거나(패턴 없음) Book 1(첫 글자만) 이면 좌→우(undefined).
   */
  const writeOrder = useMemo(() => {
    if (currentItem.traceWord) return undefined;
    const patterns = sourceStorybook?.phonicsConfig?.targetPatterns ?? [];
    const pat = patterns.find((p) => wordMatchesPattern(currentItem.word, p));
    if (!pat) return undefined;
    const [s, e] = patternHighlight(currentItem.word, pat);
    if (s >= e) return undefined;
    const first: number[] = [];
    const rest: number[] = [];
    for (let i = 0; i < letters.length; i++) (i >= s && i < e ? first : rest).push(i);
    return [...first, ...rest];
  }, [currentItem.word, currentItem.traceWord, sourceStorybook, letters]);
  // 지금까지 쓴 칸(인덱스) — 시각 순서로 이어읽기용. 낱말 바뀌면 리셋(advanceToNext).
  const writtenRef = useRef<number[]>([]);

  // 🔴 진입 안내 음성 — 화면엔 "글자를 따라 써봐" 글자가 있는데 음성이 없어 파닉스 쓰기 활동과
  //    어긋났다(사용자: "어디서는 따라 써봐 멘트 나오고 어디서는 안 나오네"). 한 번만 재생한다.
  const guidedRef = useRef(false);
  useEffect(() => {
    if (guidedRef.current) return;
    guidedRef.current = true;
    playAudio(WRITE_GUIDE_SOUND);
  }, [playAudio]);

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
        writtenRef.current = []; // 다음 낱말은 처음부터 이어읽기
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
      if (!writtenRef.current.includes(index)) writtenRef.current.push(index);
      queueMicrotask(() => {
        if (completedRef.current) return; // 마지막 글자 = handleWordComplete 가 처리
        void (async () => {
          // 🔴 지금까지 쓴 칸을 **시각 순서로 이어 읽기**(man: a→an / bake: a→ak→ake). 낱글자도 읽는다
          //    (2026-08-06 사용자: "a 따라썼는데 안 읽어줘"). 블렌드가 라이브러리에 없으면 방금 쓴 음소.
          const blend = [...writtenRef.current]
            .sort((a, b) => a - b)
            .map((i) => letters[i])
            .join('');
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

  // 모든 글자 완성 → **낱말만** 읽고 → 칭찬 → 장면 리빌 → 다음 단어.
  // 🔴 이어읽기(a→at)가 이미 누적 소리를 냈으므로 여기서 마지막 글자를 다시 읽으면 "a at t hat" 처럼
  //    군더더기가 붙는다(2026-08-07 사용자: "그냥 a, at, hat"). 완성 = 낱말 하나로 끝낸다.
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
    })();
  }, [
    passed,
    currentIndex,
    currentItem,
    storybookId,
    playAudio,
    playCorrectSequence,
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
              order={writeOrder}
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
