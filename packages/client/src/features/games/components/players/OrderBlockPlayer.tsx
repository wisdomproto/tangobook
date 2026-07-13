import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { OrderBlockData } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { GameResultScreen } from '../GameResultScreen';
import { MobileLandscapeGate } from '../MobileLandscapeGate';
import { useGameAudio } from '../../hooks/useGameAudio';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle } from '../GameStyleChip';
import { resolveTtsUrl, resolveUnitTtsUrl, prewarmUnitTts } from '@/features/tts';
import { useStorybook } from '@/features/storybook';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { useGameLogger } from '@/features/learning';
import { cn } from '@/lib/cn';

// 언어별 글꼴 — zh/th 는 번들 폰트 필요(index.css @import), vi 는 시스템/Pretendard 로 커버.
const LANG_FONT: Record<string, string> = {
  zh: "'Noto Sans SC', 'Pretendard Variable', system-ui, sans-serif",
  th: "'Noto Sans Thai', 'Pretendard Variable', system-ui, sans-serif",
  vi: "'Pretendard Variable', system-ui, sans-serif",
};

interface Tile {
  id: number;
  char: string;
  used: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 순서 맞추기 블록 (vi/zh/th 공용) — 탭-투-플레이스.
 * 정답 단어의 유닛(한자/성조글자/결합단위)을 섞어 트레이에 두고, 탭하면 왼쪽 빈 칸부터 채워진다.
 * 다 채우면 순서 채점 → 맞으면 단어 발음(있으면) + 칭찬 + 동화 장면 리빌 → 다음 단어.
 */
export function OrderBlockPlayer({ storybookId, gameData, onBack }: GamePlayerProps) {
  const { t } = useTranslation('games');
  const data = gameData as OrderBlockData;
  const items = data.items;
  // order-block 은 어댑터에서 vi/zh/th 만 생성 — resolveTtsUrl/폰트용으로 좁힌다.
  const lang = data.lang as 'vi' | 'zh' | 'th';
  const font = LANG_FONT[lang] ?? LANG_FONT.vi;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [slots, setSlots] = useState<(number | null)[]>([]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const [wrongSlots, setWrongSlots] = useState<Set<number>>(new Set());
  const [scene, setScene] = useState<WordScene | null>(null);
  const wordResultsRef = useRef<{ word: string; correct: boolean }[]>([]);
  const triedRef = useRef(false);

  const logGame = useGameLogger();
  const { playAudio, playCorrectSequence, playFeedbackSound, praiseVisible } = useGameAudio();
  const { data: sourceStorybook } = useStorybook(storybookId);
  const gameStyle = useGameStyle(sourceStorybook);

  const currentItem = items[currentIndex];
  const target = useMemo(() => currentItem?.units ?? [], [currentItem]);
  // 공백 있던 단어(vi 구)는 어절 타일 → auto 폭 + 작은 폰트. 단일 글자(한자/음절)는 정사각형.
  const wordMode = /\s/.test(currentItem?.word ?? '');
  const unitFontSize = wordMode ? 'clamp(1rem, 3.2vh, 2rem)' : 'clamp(1.75rem, 6vh, 4rem)';
  const tileSizeClass = wordMode
    ? 'min-w-[clamp(3rem,9vh,5rem)] px-[clamp(0.6rem,1.8vw,1.25rem)] h-[clamp(3rem,11vh,6.5rem)]'
    : 'w-[clamp(3rem,10vh,6rem)] h-[clamp(3.5rem,12vh,7rem)]';

  // 라운드 초기화
  const loadRound = useCallback(
    (idx: number) => {
      const units = items[idx]?.units ?? [];
      setSlots(units.map(() => null));
      const built: Tile[] = units.map((c, i) => ({ id: i, char: c, used: false }));
      // 이미 정답 순서면 다시 섞기(할 일이 있게)
      let order = shuffle(built.slice());
      if (units.length > 1) {
        let guard = 0;
        while (order.every((tl, i) => tl.char === units[i]) && guard < 20) {
          order = shuffle(built.slice());
          guard++;
        }
      }
      setTiles(order);
      setRoundCorrect(false);
      setWrongSlots(new Set());
      triedRef.current = false;
      setScene(null);
      // 이 라운드 유닛 발음을 백그라운드 생성/캐시 — 첫 배치 때 지연 없이 재생.
      // 🔴 th 제외: 타일이 결합조각(단독 음절 아님)이라 조각 단독발음이 어색 → per-tile 발음 안 함
      // (완성 시 통단어만 발음, LangWordWriting 의 th 통단어 정책과 동일).
      if (lang !== 'th') prewarmUnitTts(units, lang);
    },
    [items, lang]
  );

  useEffect(() => {
    loadRound(currentIndex);
  }, [currentIndex, loadRound]);

  const tileById = useCallback((id: number) => tiles.find((tl) => tl.id === id) ?? null, [tiles]);

  const goNext = useCallback(() => {
    setScene(null);
    if (currentIndex + 1 < items.length) setCurrentIndex((i) => i + 1);
    else setFinished(true);
  }, [currentIndex, items.length]);

  const handleCorrect = useCallback(() => {
    if (roundCorrect) return;
    setRoundCorrect(true);
    setScore((s) => s + 1);
    wordResultsRef.current.push({ word: currentItem.word, correct: !triedRef.current });
    void (async () => {
      const url = await resolveTtsUrl({
        text: currentItem.word,
        language: lang,
        storybookId,
        directUrl: currentItem.ttsUrl,
        identifierPrefix: 'oblock',
      });
      playCorrectSequence({
        ttsUrl: url,
        language: lang,
        onDone: () => {
          const s = resolveSceneFromWord(
            currentItem.word,
            lang,
            sourceStorybook,
            gameStyle.selectedStyle
          );
          if (s) setScene(s);
          else goNext();
        },
      });
    })();
  }, [
    roundCorrect,
    currentItem,
    lang,
    storybookId,
    playCorrectSequence,
    sourceStorybook,
    gameStyle.selectedStyle,
    goNext,
  ]);

  const checkFull = useCallback(
    (next: (number | null)[]) => {
      if (next.some((v) => v === null)) return;
      const ok = next.every((tid, i) => tid !== null && tileById(tid)?.char === target[i]);
      if (ok) {
        handleCorrect();
      } else {
        triedRef.current = true;
        playFeedbackSound(false);
        const wrong = new Set<number>();
        next.forEach((tid, i) => {
          if (tid === null || tileById(tid)?.char !== target[i]) wrong.add(i);
        });
        setWrongSlots(wrong);
      }
    },
    [tileById, target, handleCorrect, playFeedbackSound]
  );

  const placeTile = useCallback(
    (id: number) => {
      if (roundCorrect) return;
      const tl = tileById(id);
      if (!tl || tl.used) return;
      const slot = slots.indexOf(null);
      if (slot < 0) return;
      const next = slots.slice();
      next[slot] = id;
      setSlots(next);
      setTiles((prev) => prev.map((p) => (p.id === id ? { ...p, used: true } : p)));
      setWrongSlots(new Set());
      // 유닛별 읽기 — 배치한 글자/한자/어절을 발음(vi/zh native TTS, lazy 캐시).
      // 단, 이 배치로 단어가 "완성"되면 재생하지 않고 checkFull→handleCorrect 가 단어 발음을 소유
      // (playAudio 단일 채널이라 유닛음이 단어음에 잘리는 것 방지 — 블록 게임 chain 규칙과 동일).
      // 🔴 th 제외: 결합조각 단독발음이 어색 → 완성 시 통단어만 발음.
      const completesWord = !next.some((v) => v === null);
      if (!completesWord && lang !== 'th') {
        void resolveUnitTtsUrl(tl.char, lang).then((url) => {
          if (url) playAudio(url);
        });
      }
      checkFull(next);
    },
    [roundCorrect, tileById, slots, checkFull, lang, playAudio]
  );

  const freeSlot = useCallback(
    (idx: number) => {
      if (roundCorrect) return;
      const tid = slots[idx];
      if (tid === null) return;
      const next = slots.slice();
      next[idx] = null;
      setSlots(next);
      setTiles((prev) => prev.map((p) => (p.id === tid ? { ...p, used: false } : p)));
      setWrongSlots(new Set());
    },
    [roundCorrect, slots]
  );

  const handleReset = useCallback(() => {
    if (roundCorrect) return;
    setSlots((prev) => prev.map(() => null));
    setTiles((prev) => prev.map((p) => ({ ...p, used: false })));
    setWrongSlots(new Set());
  }, [roundCorrect]);

  const handleRestart = useCallback(() => {
    setScore(0);
    setFinished(false);
    wordResultsRef.current = [];
    setCurrentIndex(0);
    loadRound(0);
  }, [loadRound]);

  useEffect(() => {
    if (!finished) return;
    const collected = wordResultsRef.current;
    if (collected.length === 0) return;
    logGame({ gameType: 'order-block', storybookId, lang, results: collected });
    wordResultsRef.current = [];
  }, [finished, logGame, storybookId, lang]);

  if (finished) {
    return (
      <MobileLandscapeGate>
        <GameResultScreen
          storybookId={storybookId}
          score={score}
          total={items.length}
          lang={lang}
          onRestart={handleRestart}
          onBack={onBack}
        />
      </MobileLandscapeGate>
    );
  }

  return (
    <MobileLandscapeGate>
      <div className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-sky-200 via-cream-50 to-peach-100 overflow-hidden">
        <div className="px-2 pt-2 shrink-0">
          <GameHeader
            title={t('cards.block.label')}
            current={score}
            total={items.length}
            onBack={onBack}
          />
        </div>

        <div className="flex-1 flex flex-col items-stretch gap-[clamp(0.5rem,1.5vh,1.25rem)] px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.5rem,1.5vh,1rem)] min-h-0">
          {/* 그림 + 정답 미리보기(연한) */}
          <section className="flex-[3] min-h-0 rounded-3xl bg-white/85 backdrop-blur-sm shadow-pop border-2 border-white px-6 py-3 flex items-center justify-center gap-[clamp(1rem,3vw,3rem)]">
            {currentItem.imageUrl && (
              <img
                src={currentItem.imageUrl}
                alt=""
                aria-hidden
                className="h-[clamp(5rem,22vh,13rem)] w-[clamp(5rem,22vh,13rem)] object-cover rounded-3xl border-[5px] border-white drop-shadow-[0_8px_12px_rgba(0,0,0,0.18)]"
              />
            )}
            <div
              className={cn(
                'font-black leading-tight text-coral-500 text-center',
                !wordMode && 'whitespace-nowrap'
              )}
              style={{
                fontFamily: font,
                fontSize: wordMode
                  ? 'clamp(1.75rem, min(7vw, 12vh), 5rem)'
                  : 'clamp(2.5rem, min(12vw, 18vh), 10rem)',
                WebkitTextStroke: 'clamp(3px,0.6vh,6px) white',
                paintOrder: 'stroke fill',
                letterSpacing: '0.04em',
              }}
            >
              {currentItem.word}
            </div>
          </section>

          {/* 슬롯 */}
          <section
            className={cn(
              'flex-[3] min-h-0 rounded-3xl bg-white/85 backdrop-blur-sm shadow-pop border-2 border-white px-6 py-3 flex flex-wrap items-center justify-center gap-[clamp(0.5rem,1.5vw,1rem)] transition-all',
              roundCorrect && 'ring-[6px] ring-success/70 bg-success/20'
            )}
          >
            {slots.map((tid, idx) => {
              const char = tid !== null ? (tileById(tid)?.char ?? '') : '';
              const wrong = wrongSlots.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => freeSlot(idx)}
                  disabled={roundCorrect}
                  style={{ fontFamily: font, fontSize: unitFontSize }}
                  className={cn(
                    tileSizeClass,
                    'rounded-2xl flex items-center justify-center font-black select-none transition-all whitespace-nowrap',
                    tid !== null
                      ? 'bg-white shadow-soft border-2 border-cream-50'
                      : 'bg-peach-100/60 border-[3px] border-dashed border-peach-200',
                    roundCorrect && tid !== null && 'text-success border-success',
                    wrong && 'ring-4 ring-danger/50 text-danger animate-shake'
                  )}
                >
                  {char}
                </button>
              );
            })}
          </section>

          {/* 트레이 + 초기화 */}
          <section className="flex-[2] min-h-0 rounded-3xl bg-cream-50/95 shadow-pop border-2 border-dashed border-cream-50 px-6 py-3 flex flex-wrap items-center justify-center gap-[clamp(0.5rem,1.5vw,1rem)] relative">
            {tiles.map((tl) => (
              <motion.button
                key={tl.id}
                onClick={() => placeTile(tl.id)}
                disabled={tl.used || roundCorrect}
                style={{ fontFamily: font, fontSize: unitFontSize }}
                animate={{ opacity: tl.used ? 0 : 1, scale: tl.used ? 0.6 : 1 }}
                className={cn(
                  tileSizeClass,
                  'rounded-2xl flex items-center justify-center font-black text-white select-none whitespace-nowrap',
                  'bg-gradient-to-b from-coral-400 to-coral-600 shadow-pop',
                  !tl.used && 'hover:scale-105 active:scale-95',
                  tl.used && 'pointer-events-none'
                )}
              >
                {tl.char}
              </motion.button>
            ))}
            <button
              onClick={handleReset}
              disabled={roundCorrect}
              title={t('study.retry')}
              aria-label={t('study.retry')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 shadow-soft text-xl font-black text-ink-700 hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              ↺
            </button>
          </section>
        </div>
      </div>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          highlight={scene.highlight}
          ttsUrl={scene.pageTtsUrl}
          onDone={goNext}
        />
      )}
    </MobileLandscapeGate>
  );
}
