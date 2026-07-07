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
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { resolveTtsUrl } from '@/features/tts';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { useStorybook } from '@/features/storybook';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';

/**
 * 한글 단어 따라쓰기 — paint 모드 (LetterFillCanvas).
 *
 * 단어의 **모든 음절**을 순서대로 한 글자씩 색칠. 한 음절을 다 칠하면 그 음절을 읽어주고,
 * 마지막 음절까지 끝내면 단어 전체 발음 + 칭찬 + 그 단어가 나오는 동화 장면(나레이션) 리빌.
 * paint 모드: 글자 영역 안만 painted, 채움 비율(coverage)로 통과 판정. 폰트 fidelity 100%.
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

  // 이번 판 자산 워밍 — 이미지 + 정답 시 단어 TTS(concat) 지연 방지
  usePreloadImages(items.map((it) => it.imageUrl));
  usePrewarmWordTts(
    items.map((it) => ({ text: it.word, directUrl: it.ttsUrl })),
    'korean',
    storybookId,
    'wwrite-ko'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [syllableIndex, setSyllableIndex] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() => items.map(() => false));
  const [advancing, setAdvancing] = useState(false);
  const [scene, setScene] = useState<WordScene | null>(null);
  const pendingPassedRef = useRef<boolean[] | null>(null);
  const logGame = useGameLogger();
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const { data: sourceStorybook } = useStorybook(storybookId);

  const currentItem = items[currentIndex];
  const syllables = useMemo(() => syllablesOf(currentItem.word), [currentItem.word]);
  const currentSyllable = syllables[syllableIndex] ?? currentItem.word;

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
        setCurrentIndex((i) => i + 1);
        setSyllableIndex(0);
        setAdvancing(false);
      }
    },
    [currentIndex, items.length, onComplete, emitFinalResults]
  );

  const handleResult = useCallback(
    async (ok: boolean) => {
      if (!ok || advancing) return;
      setAdvancing(true);
      const isLastSyllable = syllableIndex >= syllables.length - 1;
      // 방금 칠한 음절 읽어주기
      const sylUrl = await resolveTtsUrl({
        text: currentSyllable,
        language: 'korean',
        storybookId,
        identifierPrefix: 'wwrite-ko',
      });
      const afterSyllable = () => {
        if (!isLastSyllable) {
          // 다음 음절로 — 캔버스는 key 변경으로 리셋.
          setSyllableIndex((i) => i + 1);
          setAdvancing(false);
          return;
        }
        // 마지막 음절 → 단어 완성. 단어 전체 발음 + 칭찬 → 동화 장면 리빌 → 다음 단어.
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
              const s = resolveSceneFromWord(currentItem.word, 'ko', sourceStorybook);
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
      if (sylUrl) playAudio(sylUrl, afterSyllable);
      else afterSyllable();
    },
    [
      advancing,
      syllableIndex,
      syllables.length,
      currentSyllable,
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
        {/* 단어 hero + 일러스트 — 이미 칠한 음절은 coral, 지금 칠할 음절은 회색, 남은 음절은 연회색 */}
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
              {syllables.map((syl, i) => (
                <span
                  key={i}
                  style={{
                    color:
                      i < syllableIndex ? '#FF7A3C' : i === syllableIndex ? '#d4d4d8' : '#e8e8ec',
                    WebkitTextStroke: '5px white',
                    paintOrder: 'stroke fill',
                  }}
                >
                  {syl}
                </span>
              ))}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900 mt-1">
              {syllables.length > 1
                ? `${syllableIndex + 1}번째 글자를 색칠해봐`
                : '글자를 색칠해봐'}
            </p>
          </div>
        </div>

        {/* 현재 음절 paint canvas — 음절마다 리셋(key) */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div style={{ width: 'min(420px, 55vh)' }}>
            <LetterFillCanvas
              key={`${currentIndex}-${syllableIndex}-${currentSyllable}`}
              letter={currentSyllable}
              onResult={handleResult}
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
