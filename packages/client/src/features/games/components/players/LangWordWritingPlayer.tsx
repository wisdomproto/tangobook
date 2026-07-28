import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { OrderWritingData } from '@tangobook/shared';
import { splitUnits } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle } from '../GameStyleChip';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { resolveTtsUrl, resolveUnitTtsUrl, prewarmUnitTts } from '@/features/tts';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { useStorybook } from '@/features/storybook';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';

// 언어별 글꼴 — zh/th 는 번들 폰트, vi 는 시스템/Pretendard.
const LANG_FONT: Record<string, string> = {
  zh: "'Noto Sans SC', 'Pretendard Variable', system-ui, sans-serif",
  th: "'Noto Sans Thai', 'Pretendard Variable', system-ui, sans-serif",
  vi: "'Pretendard Variable', system-ui, sans-serif",
};

/**
 * vi/zh/th 따라쓰기 — 단어 통째를 WordFillCanvas 로 색칠, 유닛(음절/음소) zone 별 채점.
 *  - zh: 한자(=음절) 단위 zone / vi: 낱글자(=음소) 단위 zone
 *  - th: 어휘가 대부분 1음절이라 단어 전체 1 zone (결합조각 단독 발음 회피)
 * 한 유닛을 다 칠하면 그 유닛을, 다 끝내면 단어를 읽어준다(현재 vi/zh/th TTS 없음 → 무음, 나중에 채움).
 */
function unitsFor(word: string, lang: OrderWritingData['lang']): string[] {
  if (lang === 'th') return [word];
  return splitUnits(word, lang);
}

const REST_MS = 450;

export function LangWordWritingPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
}: GamePlayerProps) {
  const { t } = useTranslation('games');
  const data = gameData as OrderWritingData;
  const items = data.items;
  // order-writing 은 어댑터에서 vi/zh/th 만 생성 — resolveTtsUrl/폰트/유닛 분해용으로 좁힌다.
  const lang = data.lang as 'vi' | 'zh' | 'th';
  const font = LANG_FONT[lang] ?? LANG_FONT.vi;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() => items.map(() => false));
  const [scene, setScene] = useState<WordScene | null>(null);
  const completedRef = useRef(false);
  const lastUnitRef = useRef('');
  const pendingPassedRef = useRef<boolean[] | null>(null);
  const logGame = useGameLogger();
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer } = useGameAudio();
  const { data: sourceStorybook } = useStorybook(storybookId);
  const gameStyle = useGameStyle(sourceStorybook);

  const currentItem = items[currentIndex];
  const units = useMemo(() => unitsFor(currentItem.word, lang), [currentItem.word, lang]);

  // 이 단어 유닛 발음을 백그라운드 생성/캐시 — 유닛 완성 시 지연 없이 읽어줌.
  useEffect(() => {
    prewarmUnitTts(units, lang);
  }, [units, lang]);

  const emitFinalResults = useCallback(
    (finalPassed: boolean[]) => {
      const results: GameWordResult[] = items.map((it, i) => ({
        word: it.word,
        correct: !!finalPassed[i],
      }));
      logGame({ gameType: 'order-writing', storybookId, lang, results });
    },
    [items, logGame, storybookId, lang]
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
    [currentIndex, items.length, emitFinalResults, onBack]
  );

  // 유닛 하나 완성 → 그 유닛 읽기(현재 무음). 마지막 유닛은 handleWordComplete 가 체인 소유.
  const handleUnitDone = useCallback(
    (unit: string) => {
      lastUnitRef.current = unit;
      queueMicrotask(() => {
        if (completedRef.current) return;
        void (async () => {
          // vi/zh/th 낱유닛 발음 — Google native TTS lazy 캐시(phonics concat 없음).
          const url = await resolveUnitTtsUrl(unit, lang);
          if (url && !completedRef.current) playAudio(url);
        })();
      });
    },
    [lang, playAudio]
  );

  const handleWordComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const newPassed = passed.map((v, i) => (i === currentIndex ? true : v));
    setPassed(newPassed);
    void (async () => {
      const wordUrl = await resolveTtsUrl({
        text: currentItem.word,
        language: lang,
        storybookId,
        directUrl: currentItem.ttsUrl,
      });
      const playWordThenPraise = () => {
        playAudio(wordUrl, () => {
          playCorrectSequence({
            language: lang,
            onDone: () => {
              const s = resolveSceneFromWord(
                currentItem.word,
                lang,
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
      // 마지막 유닛(여러 유닛일 때만) 끝까지 → 쉬고 → 단어. TTS 없으면 wordUrl=undefined 라 즉시 진행.
      const lastUnit = lastUnitRef.current || units[units.length - 1];
      const lastUnitUrl = units.length > 1 ? await resolveUnitTtsUrl(lastUnit, lang) : undefined;
      if (lastUnitUrl) {
        playAudio(lastUnitUrl, () => scheduleTimer(playWordThenPraise, REST_MS));
      } else {
        playWordThenPraise();
      }
    })();
  }, [
    passed,
    currentIndex,
    currentItem,
    lang,
    storybookId,
    units,
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
              alt=""
              aria-hidden
              className="h-[clamp(4rem,18vh,16rem)] w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
            />
          )}
          <p
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink-900"
            style={{ fontFamily: font }}
          >
            {currentItem.word}
          </p>
        </div>

        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div style={{ width: 'min(680px, 92vw, 75vh)' }}>
            <WordFillCanvas
              key={currentIndex}
              word={currentItem.word}
              syllables={units}
              fontFamily={font}
              onSyllableDone={handleUnitDone}
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
