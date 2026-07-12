import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type {
  KoreanLineMatchingData,
  EnglishLineMatchingData,
  LineMatchingItem,
  Lang,
} from '@tangobook/shared';
import { warmAudioUrl } from '../../hooks/useGamePrefetch';
import { useGameAudio } from '../../hooks/useGameAudio';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { GameResultScreen } from '../GameResultScreen';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { GameHeader } from '../GameHeader';
import { SceneReveal } from '../SceneReveal';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { useGameStyle } from '../GameStyleChip';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { useStorybook } from '@/features/storybook';
import {
  TutorialProvider,
  useTutorialHighlight,
  useTutorialIsPlaying,
  useTutorialExpected,
  useTutorialNotify,
} from './LineMatchingTutorial/LineMatchingTutorial.context';
import { LineMatchingTutorial } from './LineMatchingTutorial/LineMatchingTutorial';
import { phonicsApi } from '@/features/phonics/api/phonics.api';
import { shuffle } from '../../utils/shuffle';
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { decomposeWord } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface LineMatchingPlayerProps extends GamePlayerProps {
  lang: Lang;
}

interface MatchedPair {
  itemIdx: number;
}

function LineMatchingPlayerInner({
  storybookId,
  gameData,
  onComplete,
  onBack,
  lang,
}: LineMatchingPlayerProps) {
  const data = gameData as KoreanLineMatchingData | EnglishLineMatchingData;
  const items = data.items;

  // vi/zh/th·en 은 단어 발음이 direct ttsUrl(R2). 정답 순간 콜드 페치로 늦지 않게
  // 마운트 시 미리 오디오를 워밍(한글은 음절 mp3 라 ttsUrl 없음 → 스킵).
  useEffect(() => {
    for (const it of items) {
      if (it.ttsUrl) void warmAudioUrl(it.ttsUrl);
    }
  }, [items]);

  // 이미지는 원래 순서 유지, 단어만 셔플
  const imageOrder = useMemo(() => items.map((_, i) => i), [items]);
  const wordOrder = useMemo(() => shuffle(items.map((_, i) => i)), [items]);

  const { t } = useTranslation('games');
  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null);
  const [matched, setMatched] = useState<MatchedPair[]>([]);
  const [wrongPair, setWrongPair] = useState<{ image: number; word: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  // 짝을 맞춘 단어가 나오는 동화 장면 + 나레이션 리빌 (소스 동화책 있을 때만).
  const [scene, setScene] = useState<WordScene | null>(null);
  const sceneWasLastRef = useRef(false);
  const { data: sourceStorybook } = useStorybook(storybookId);
  const gameStyle = useGameStyle(sourceStorybook);

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  const isTutorialPlaying = useTutorialIsPlaying();
  const { highlightImageIdx, highlightWordIdx } = useTutorialHighlight();
  const expected = useTutorialExpected();
  const notifyMatch = useTutorialNotify();
  const handleHintStart = useCallback(() => {
    if (hintActive || isTutorialPlaying) return;
    setHintActive(true);
  }, [hintActive, isTutorialPlaying]);
  const handleHintEnd = useCallback(() => {
    setHintActive(false);
  }, []);

  const isMatched = useCallback(
    (itemIdx: number) => matched.some((m) => m.itemIdx === itemIdx),
    [matched]
  );

  // phonics 라이브러리 (한글 음절 mp3 lookup) — KoreanBlock 과 동일 방식
  const { mapRef: phonicsMapRef, loading: phonicsLoading } = usePhonicsMap([
    'mod_korean',
    'mod_phonics',
    'mod_english',
  ]);

  // 게임 시작 게이트 = phonics 맵 로드만(localStorage 캐시라 재진입 즉시).
  const audioReady = !phonicsLoading;

  // 단어 음원 — 한글은 음절 단위 mp3 순차 재생 (서버 concat / ffmpeg 의존성 X).
  // 영어는 ttsUrl 우선 → 없으면 phonics 단일 mp3 lookup.
  const playWordTts = useCallback(
    async (item: LineMatchingItem) => {
      const hasHangul = /[가-힣]/.test(item.word);
      const map = phonicsMapRef.current;
      if (hasHangul) {
        // 한글 음절 순차 재생
        const syllables = [...item.word].filter((c) => /[가-힣]/.test(c));
        for (const syl of syllables) {
          const url = map.get(syl);
          if (!url) continue;
          await new Promise<void>((resolve) => {
            const audio = new Audio(url);
            const done = () => resolve();
            audio.addEventListener('ended', done, { once: true });
            audio.addEventListener('error', done, { once: true });
            audio.play().catch(done);
          });
        }
      } else {
        // 영어: ttsUrl 우선 → phonics 단일 lookup. 재생 완료까지 대기 (마지막 짝 chain 용 —
        // playAudio 는 ended/error/재생거부 모두 콜백을 부르므로 promise 가 안 멈춤).
        const url = item.ttsUrl ?? map.get(item.word.toLowerCase());
        if (!url) return;
        await new Promise<void>((resolve) => playAudio(url, resolve));
      }
    },
    [playAudio, phonicsMapRef]
  );

  // 양쪽 다 선택되면 매칭 체크
  useEffect(() => {
    if (selectedImageIdx === null || selectedWordIdx === null) return;

    const isMatch = selectedImageIdx === selectedWordIdx;
    if (isMatch) {
      const matchedIdx = selectedImageIdx;
      const newMatched = [...matched, { itemIdx: matchedIdx }];
      setMatched(newMatched);
      const matchedItem = items[matchedIdx];
      // 단어 1개 정답 — 효과음 + TTS (호리/칭찬음원 X). 마지막 다 맞추면 GameResultScreen 이 호리.
      playFeedbackSound(true);
      const isLast = newMatched.length >= items.length;
      setSelectedImageIdx(null);
      setSelectedWordIdx(null);
      // 튜토리얼 wait 중이면 advance
      notifyMatch(matchedIdx);
      setTimeout(() => {
        // 🔴 chain 규칙: 발음이 "끝난 뒤" 칭찬음 → 장면 리빌 — 고정 타이머는 다음절 단어 발음이
        // 잘린 채 다음 단계가 겹치는 원인.
        void playWordTts(matchedItem).then(() => {
          const showScene = () => {
            // 맞춘 단어가 나오는 동화 장면 + 나레이션 리빌 (있으면), 없으면 다음/결과로.
            const s = resolveSceneFromWord(
              matchedItem.word,
              lang,
              sourceStorybook,
              gameStyle.selectedStyle
            );
            if (s) {
              sceneWasLastRef.current = isLast;
              setScene(s);
            } else if (isLast) {
              setTimeout(() => setFinished(true), 400);
            }
          };
          // 단어 발음 후 칭찬음(+호리 오버레이) → 장면 리빌. (2026-07 그림짝 칭찬음 누락 수정)
          playCorrectSequence({ language: lang, onDone: showScene });
        });
      }, 150);
    } else {
      setWrongPair({ image: selectedImageIdx, word: selectedWordIdx });
      playFeedbackSound(false);
      setTimeout(() => {
        setSelectedImageIdx(null);
        setSelectedWordIdx(null);
        setWrongPair(null);
      }, 700);
    }
  }, [
    selectedImageIdx,
    selectedWordIdx,
    matched,
    items,
    playFeedbackSound,
    playWordTts,
    playCorrectSequence,
    notifyMatch,
    sourceStorybook,
    lang,
    gameStyle.selectedStyle,
  ]);

  const logGame = useGameLogger();
  useEffect(() => {
    if (!finished) return;
    // onComplete 는 GameResultScreen 의 onBack 에서 호출 — finished 되자마자 부르면
    // 부모가 overlay 를 unmount 해서 결과 화면이 안 보임 (ConnectTheDots 와 동일 패턴).
    const results: GameWordResult[] = [];
    for (const it of items) {
      results.push({ word: it.word, correct: true });
      if (lang === 'ko') {
        for (const syl of decomposeWord(it.word)) {
          results.push({ correct: true, consonant: syl.cho, vowel: syl.jung });
        }
      }
    }
    logGame({
      gameType: lang === 'ko' ? 'korean-line-matching' : 'english-line-matching',
      storybookId,
      lang,
      results,
    });
  }, [finished, items, lang, logGame, storybookId]);

  const handleRestart = useCallback(() => {
    setMatched([]);
    setSelectedImageIdx(null);
    setSelectedWordIdx(null);
    setWrongPair(null);
    setFinished(false);
  }, []);

  // 첫 매칭 안 된 itemIdx — 튜토리얼이 시연할 타겟.
  // 반드시 early return 앞에 — hook 순서 위반 (Rendered fewer hooks than expected) 방지.
  const firstUnmatchedIdx = useMemo(() => {
    for (let i = 0; i < items.length; i++) {
      if (!matched.some((m) => m.itemIdx === i)) return i;
    }
    return null;
  }, [items, matched]);

  // 카드 ref — SVG 곡선 줄긋기 좌표 측정용. early return 앞에 — hook 순서 보존.
  const areaRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const wordRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // 매칭 줄 — 좌표는 useLayoutEffect 에서 계산
  const [lines, setLines] = useState<
    Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      color: string;
      key: string;
    }>
  >([]);

  const computeLines = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    const areaRect = area.getBoundingClientRect();
    const result: typeof lines = [];

    // 매칭 완료 — success 색
    matched.forEach((m) => {
      const imgEl = imageRefs.current.get(m.itemIdx);
      const wordEl = wordRefs.current.get(m.itemIdx);
      if (!imgEl || !wordEl) return;
      const imgRect = imgEl.getBoundingClientRect();
      const wordRect = wordEl.getBoundingClientRect();
      result.push({
        from: {
          x: imgRect.right - areaRect.left,
          y: imgRect.top + imgRect.height / 2 - areaRect.top,
        },
        to: {
          x: wordRect.left - areaRect.left,
          y: wordRect.top + wordRect.height / 2 - areaRect.top,
        },
        color: '#5CC99F',
        key: `m-${m.itemIdx}`,
      });
    });

    // 현재 양쪽 모두 선택 — 매칭 체크 직전 — coral 색 (잠깐)
    if (selectedImageIdx !== null && selectedWordIdx !== null) {
      const imgEl = imageRefs.current.get(selectedImageIdx);
      const wordEl = wordRefs.current.get(selectedWordIdx);
      if (imgEl && wordEl) {
        const imgRect = imgEl.getBoundingClientRect();
        const wordRect = wordEl.getBoundingClientRect();
        result.push({
          from: {
            x: imgRect.right - areaRect.left,
            y: imgRect.top + imgRect.height / 2 - areaRect.top,
          },
          to: {
            x: wordRect.left - areaRect.left,
            y: wordRect.top + wordRect.height / 2 - areaRect.top,
          },
          color: '#FF5E3A',
          key: 'active',
        });
      }
    }
    setLines(result);
  }, [matched, selectedImageIdx, selectedWordIdx]);

  useLayoutEffect(() => {
    if (finished) return;
    computeLines();
  }, [computeLines, finished]);

  // resize 시 좌표 재계산
  useEffect(() => {
    if (finished) return;
    const onResize = () => computeLines();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [computeLines, finished]);

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={items.length}
        total={items.length}
        lang={lang}
        onRestart={handleRestart}
        onBack={() => {
          onComplete(items.length, items.length);
          onBack();
        }}
      />
    );
  }

  // SVG path 곡선 — Bezier
  const pathD = (l: { from: { x: number; y: number }; to: { x: number; y: number } }) => {
    const midX = (l.from.x + l.to.x) / 2;
    return `M ${l.from.x} ${l.from.y} C ${midX} ${l.from.y}, ${midX} ${l.to.y}, ${l.to.x} ${l.to.y}`;
  };

  // 카드 base — 흰 배경 + 둥근 모서리. border 얇게 (시안 처럼 부드럽게).
  const cardBase =
    'relative rounded-2xl bg-white shadow-soft border-2 transition-all cursor-pointer';

  const imageCardClass = (itemIdx: number) => {
    if (isMatched(itemIdx)) return cn(cardBase, 'border-success cursor-default');
    if (wrongPair?.image === itemIdx) return cn(cardBase, 'border-danger animate-shake');
    if (selectedImageIdx === itemIdx) return cn(cardBase, 'border-coral-500 ring-4 ring-coral-200');
    // 튜토리얼 highlight — coral wiggle ring
    if (highlightImageIdx === itemIdx)
      return cn(cardBase, 'border-coral-400 ring-4 ring-coral-300 scale-105');
    // 튜토리얼 wait/playing — non-expected 카드 dim
    const tutorialDim =
      (expected !== null && expected.itemIdx !== itemIdx) ||
      (isTutorialPlaying && highlightImageIdx !== itemIdx);
    if (tutorialDim) return cn(cardBase, 'border-transparent opacity-30 cursor-not-allowed');
    return cn(cardBase, 'border-transparent hover:border-coral-300 hover:scale-[1.02]');
  };

  const wordCardClass = (itemIdx: number) => {
    if (isMatched(itemIdx)) return cn(cardBase, 'border-success cursor-default');
    if (wrongPair?.word === itemIdx) return cn(cardBase, 'border-danger animate-shake');
    if (selectedWordIdx === itemIdx) return cn(cardBase, 'border-coral-500 ring-4 ring-coral-200');
    if (highlightWordIdx === itemIdx)
      return cn(cardBase, 'border-coral-400 ring-4 ring-coral-300 scale-105');
    const tutorialDim =
      (expected !== null && expected.itemIdx !== itemIdx) ||
      (isTutorialPlaying && highlightWordIdx !== itemIdx);
    if (tutorialDim) return cn(cardBase, 'border-transparent opacity-30 cursor-not-allowed');
    return cn(cardBase, 'border-transparent hover:border-coral-300 hover:scale-[1.02]');
  };

  // connection point dot — 카드 가장자리에 표시 (SVG 시작/끝점)
  const connectionDot = (state: 'matched' | 'active' | 'idle', side: 'left' | 'right') => {
    const colorClass =
      state === 'matched' ? 'bg-success' : state === 'active' ? 'bg-coral-500' : 'bg-ink-100';
    const sideClass = side === 'left' ? '-left-2' : '-right-2';
    return (
      <span
        aria-hidden
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ring-2 ring-white shadow-soft',
          colorClass,
          sideClass
        )}
      />
    );
  };

  const imageDotState = (itemIdx: number) =>
    isMatched(itemIdx) ? 'matched' : selectedImageIdx === itemIdx ? 'active' : 'idle';
  const wordDotState = (itemIdx: number) =>
    isMatched(itemIdx) ? 'matched' : selectedWordIdx === itemIdx ? 'active' : 'idle';

  return (
    <GamePlayerLayout maxWidth="full" bgImageUrl="/images/games/line-matching-bg.webp">
      <div className="flex flex-col w-full h-full relative">
        <GameHeader
          title={t('cards.lineMatching.label')}
          current={matched.length}
          total={items.length}
          onBack={onBack}
        />

        {/* 오디오 로딩 overlay — 이번 판 음절/단어 mp3 프리페치 대기(짝 맞춘 순간 발음 지연 방지). */}
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

        {/* 메인 게임 영역 — 좌우 padding 으로 양옆 여백 + 좌/우 column 30% / SVG 가운데 30% */}
        <div ref={areaRef} className="flex-1 relative min-h-0 px-4 sm:px-8 lg:px-24">
          {/* 좌측 그림 column — absolute. grid-rows-N 균등. 카드 4개 = 화면 안 모두 fit. */}
          <div
            className="absolute left-4 sm:left-8 lg:left-24 top-0 bottom-0 w-[38%] sm:w-[32%] lg:w-[30%] grid gap-4"
            style={{ gridTemplateRows: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {imageOrder.map((imageItemIdx) => {
              const imageItem = items[imageItemIdx];
              return (
                <div key={`img-${imageItemIdx}`} className="relative">
                  <button
                    ref={(el) => {
                      if (el) imageRefs.current.set(imageItemIdx, el);
                      else imageRefs.current.delete(imageItemIdx);
                    }}
                    data-image-card={imageItemIdx}
                    onClick={() => {
                      if (isMatched(imageItemIdx)) return;
                      if (isTutorialPlaying) return;
                      if (expected !== null && expected.itemIdx !== imageItemIdx) return;
                      setSelectedImageIdx(imageItemIdx);
                    }}
                    disabled={
                      isMatched(imageItemIdx) ||
                      isTutorialPlaying ||
                      (expected !== null && expected.itemIdx !== imageItemIdx)
                    }
                    className={cn(imageCardClass(imageItemIdx), 'w-full h-full overflow-hidden')}
                    aria-label="그림 선택"
                  >
                    <img
                      src={imageItem.imageUrl}
                      alt=""
                      className="w-full h-full object-contain p-4 lg:p-6"
                    />
                  </button>
                  {connectionDot(imageDotState(imageItemIdx), 'right')}
                </div>
              );
            })}
          </div>

          {/* 우측 단어 column — absolute. 동일 grid. */}
          <div
            className="absolute right-4 sm:right-8 lg:right-24 top-0 bottom-0 w-[38%] sm:w-[32%] lg:w-[30%] grid gap-4"
            style={{ gridTemplateRows: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {wordOrder.map((wordItemIdx) => {
              const wordItem = items[wordItemIdx];
              return (
                <div key={`word-${wordItemIdx}`} className="relative">
                  <button
                    ref={(el) => {
                      if (el) wordRefs.current.set(wordItemIdx, el);
                      else wordRefs.current.delete(wordItemIdx);
                    }}
                    data-word-card={wordItemIdx}
                    onClick={() => {
                      if (isMatched(wordItemIdx)) return;
                      if (isTutorialPlaying) return;
                      if (expected !== null && expected.itemIdx !== wordItemIdx) return;
                      setSelectedWordIdx(wordItemIdx);
                    }}
                    disabled={
                      isMatched(wordItemIdx) ||
                      isTutorialPlaying ||
                      (expected !== null && expected.itemIdx !== wordItemIdx)
                    }
                    className={cn(
                      wordCardClass(wordItemIdx),
                      'w-full h-full flex flex-col items-center justify-center px-2 sm:px-6 py-4'
                    )}
                    aria-label={`단어: ${wordItem.word}`}
                  >
                    <span className="text-xl sm:text-3xl lg:text-5xl font-black text-ink-900 font-display leading-tight break-keep text-center">
                      {wordItem.word}
                    </span>
                    {wordItem.subLabel && (
                      <span className="text-sm lg:text-base font-bold text-ink-500 mt-1">
                        {wordItem.subLabel}
                      </span>
                    )}
                  </button>
                  {connectionDot(wordDotState(wordItemIdx), 'left')}
                </div>
              );
            })}
          </div>

          {/* SVG 곡선 줄 — 카드 사이 가운데 영역 (areaRef 풀폭 sandbox). pointer-events X. */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {lines.map((l) => (
              <path
                key={l.key}
                d={pathD(l)}
                stroke={l.color}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                style={{ transition: 'stroke 200ms ease' }}
              />
            ))}
          </svg>
        </div>

        {/* 🪄 도와줘 버튼 — 사용자 정책 (2026-05-12): 블록 게임 외 튜토리얼 노출 X.
            필요 시 아래 블록 풀고 firstUnmatchedIdx 가드 추가:
            <button
              onClick={handleHintStart}
              disabled={hintActive || isTutorialPlaying}
              className="fixed bottom-4 left-4 z-[70] px-6 py-3 rounded-full bg-gradient-to-b from-warn to-peach-500 text-white font-black text-lg shadow-pop hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >🪄 도와줘</button> */}

        <LineMatchingTutorial
          targetItemIdx={firstUnmatchedIdx}
          active={hintActive}
          onEnd={handleHintEnd}
        />
      </div>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          highlight={scene.highlight}
          ttsUrl={scene.pageTtsUrl}
          onDone={() => {
            setScene(null);
            if (sceneWasLastRef.current) setTimeout(() => setFinished(true), 200);
          }}
        />
      )}
    </GamePlayerLayout>
  );
}

export function LineMatchingPlayer(props: LineMatchingPlayerProps) {
  return (
    <TutorialProvider>
      <LineMatchingPlayerInner {...props} />
    </TutorialProvider>
  );
}
