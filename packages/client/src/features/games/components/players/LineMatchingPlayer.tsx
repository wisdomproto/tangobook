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
import { useGameEntryGuide } from '../../hooks/useGameEntryGuide';
import { usePhonicsMap } from '../../hooks/usePhonicsMap';
import { GameResultScreen } from '../GameResultScreen';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { GameHeader } from '../GameHeader';
import { SceneReveal } from '../SceneReveal';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { useGameStyle } from '../GameStyleChip';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { resolveTtsUrl } from '@/features/tts';
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
import { cn } from '@/lib/cn';
import { FirstLetterWord } from '@/features/phonics-learner/components/FirstLetterWord';
import { ENTRY_GUIDE, voiceUrl } from '@/features/phonics-learner/hooks/useEntryGuide';

interface LineMatchingPlayerProps extends GamePlayerProps {
  lang: Lang;
  /**
   * 글자 카드 아래 낱말의 **첫 글자만 크게**. 영어 Book 1(알파벳 배우기)처럼 글자가 목표인 화면만.
   * 🔴 Book 2 의 패턴은 `_am` 처럼 뒤쪽이라 켜면 **틀린 곳을 가리킨다**.
   */
  emphasizeFirstLabel?: boolean;
  /**
   * 우측 카드가 **무엇인지**. 짝짓기 방식은 같고 제목과 읽는 법만 달라진다.
   *  - `'word'`(기본) 낱말 — 한글은 **음절 단위**로 들려준다(파닉스 목적).
   *  - `'character'` 등장인물 이름 — **한 덩어리로** 읽는다. 「방앗간 할머니」를 음절 경로로 읽으면
   *    mp3 를 여섯 번 이어 트느라 뚝뚝 끊긴다.
   */
  variant?: 'word' | 'character';
}

/** whole-word 한글 음원 concat 캐시 prefix — 프리로드(buildTtsSpec)와 재생이 같은 키를 써야 한다. */
const WHOLE_WORD_PREFIX = 'charmatch';

interface MatchedPair {
  itemIdx: number;
}

function LineMatchingPlayerInner({
  storybookId,
  gameData,
  onComplete,
  onBack,
  lang,
  emphasizeFirstLabel = false,
  variant = 'word',
}: LineMatchingPlayerProps) {
  const wholeWord = variant === 'character';
  const data = gameData as KoreanLineMatchingData | EnglishLineMatchingData;
  const items = data.items;

  // phonics 라이브러리 (한글 음절 mp3 lookup) — KoreanBlock 과 동일 방식
  const { mapRef: phonicsMapRef, loading: phonicsLoading } = usePhonicsMap([
    'mod_korean',
    'mod_phonics',
    'mod_english',
  ]);

  /**
   * 정답 순간 콜드 페치로 늦지 않게 마운트 시 오디오를 워밍한다.
   *
   * 🔴 **한글이 통째로 빠져 있었다.** 예전 주석은 "한글은 ttsUrl 없음 → 스킵" 이라고 스스로
   *    말하면서, 정작 한글이 재생하는 **음절 mp3(고·기)는 아무도 데우지 않았다.** 그래서 첫 정답에서
   *    글자 수만큼 R2 를 새로 받느라 소리가 늦었다(사용자 지적). ttsUrl 이 없는 게 스킵 이유가
   *    될 수 없다 — 재생하는 실체가 다를 뿐이다.
   * 🔴 맵이 로드된 **뒤에** 돌아야 한다(`phonicsLoading`) — 비어 있을 때 돌면 아무것도 못 데운다.
   */
  useEffect(() => {
    if (phonicsLoading) return;
    const map = phonicsMapRef.current;
    for (const it of items) {
      if (it.ttsUrl) {
        void warmAudioUrl(it.ttsUrl);
        continue;
      }
      // 🔴 **재생과 같은 키를 데운다.** 한글은 음절(글자)별로 읽으므로 글자별, 영어는 낱말 전체를
      //    한 키로 읽으므로(`playWordTts`: `map.get(word)`) 낱말 전체다. 예전엔 영어도 글자별로 데워
      //    영어 그림짝(복습)에서 정작 재생하는 낱말 키가 안 데워졌다.
      if (wholeWord && lang === 'ko') {
        // 재생과 같은 키로 resolve → 프리로드 게이트(buildTtsSpec)와 캐시 entry 를 공유한다.
        void resolveTtsUrl({
          text: it.word,
          language: 'korean',
          storybookId,
          identifierPrefix: WHOLE_WORD_PREFIX,
        }).then((u) => {
          if (u) void warmAudioUrl(u);
        });
        continue;
      }
      const keys = lang === 'ko' ? [...it.word] : [it.word.toLowerCase()];
      for (const k of keys) {
        const url = map.get(k) ?? map.get(k.toLowerCase());
        if (url) void warmAudioUrl(url);
      }
    }
  }, [items, phonicsLoading, phonicsMapRef, lang, wholeWord, storybookId]);

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
  // 🔴 진입 안내 음성 — "그림과 짝을 찾아봐!"(`games:guide.lineMatch`). 언어는 **UI 언어**이지
  //    콘텐츠 언어가 아니다(`voiceUrl`) — vi/zh/th 어휘 게임도 이 플레이어를 쓴다.
  useGameEntryGuide(voiceUrl(ENTRY_GUIDE.lineMatch), playAudio);
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

  // 게임 시작 게이트 = phonics 맵 로드만(localStorage 캐시라 재진입 즉시).
  const audioReady = !phonicsLoading;

  // 단어 음원 — 한글은 음절 단위 mp3 순차 재생 (서버 concat / ffmpeg 의존성 X).
  // 영어는 ttsUrl 우선 → 없으면 phonics 단일 mp3 lookup.
  const playWordTts = useCallback(
    async (item: LineMatchingItem) => {
      const hasHangul = /[가-힣]/.test(item.word);
      const map = phonicsMapRef.current;
      if (hasHangul && wholeWord) {
        const url = await resolveTtsUrl({
          text: item.word,
          language: 'korean',
          storybookId,
          identifierPrefix: WHOLE_WORD_PREFIX,
        });
        if (!url) return;
        await new Promise<void>((resolve) => playAudio(url, resolve));
        return;
      }
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
    [playAudio, phonicsMapRef, wholeWord, storybookId]
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
      /**
       * 🔴 **띵동과 단어 사이에도 쉼**(2026-07-29 검수). 150ms 라 실측 간격이 **151ms** 였다 —
       *    단일 채널이라 띵동 꼬리가 단어/글자 소리에 먹힌다. 이 프로젝트의 이음매 값은 400~450ms 다.
       *    영어 파닉스 짝 찾기에선 그 글자 소리가 **유일한 음성 보상**이라 머리가 잘리면 남는 게 없다.
       */
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
      }, 430);
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
    // 🔴 음절은 쏘지 않는다 — 그림과 `고기` 를 이었다고 아이가 `고` 를 읽은 건 아니다(게다가
    //    완료가 곧 전원 정답이라 판정이랄 것도 없다). 단어만 보내면 `groupBySyllable` 이
    //    부분점수(1/4)로 얹어준다. 음절을 정식 1점으로 세는 건 아이가 글자를 직접 조작하는
    //    한글 블록·낱말 쓰기뿐이다.
    const results: GameWordResult[] = items.map((it) => ({ word: it.word, correct: true }));
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
    /**
     * 🔴 **조상에 `transform: scale` 이 있으면 좌표를 되돌려야 한다**(2026-08-11 사용자: "선이
     *    똑바로 연결이 안 되는데").
     *
     * `getBoundingClientRect()` 는 변환이 **적용된** 화면 좌표를 준다. 그런데 선을 그리는 SVG 는
     * 그 변환 **안쪽**에 있어서 로컬(변환 전) 좌표계를 쓴다 — 두 좌표계를 섞으면 선이 실제
     * 거리의 s 배만 그려져 허공에서 끝난다(랜딩 임베드 실측: s=0.55, `area` 는 화면상 748px 인데
     * 로컬로는 1368px). 앱에서는 s=1 이라 안 드러났고 상자에 넣으면서 생긴 문제다.
     * 🔴 배율을 `EmbedStage` 에서 받아오지 않는다 — **자기 요소로 잰다**(레이아웃 폭 대비 화면 폭).
     *    누가 어디서 변환을 걸든 이 계산은 맞고, 변환이 없으면 1 이라 기존 동작 그대로다.
     */
    const scale = area.offsetWidth > 0 ? areaRect.width / area.offsetWidth : 1;
    const local = (v: number) => (scale > 0 ? v / scale : v);
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
          x: local(imgRect.right - areaRect.left),
          y: local(imgRect.top + imgRect.height / 2 - areaRect.top),
        },
        to: {
          x: local(wordRect.left - areaRect.left),
          y: local(wordRect.top + wordRect.height / 2 - areaRect.top),
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
            x: local(imgRect.right - areaRect.left),
            y: local(imgRect.top + imgRect.height / 2 - areaRect.top),
          },
          to: {
            x: local(wordRect.left - areaRect.left),
            y: local(wordRect.top + wordRect.height / 2 - areaRect.top),
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
          title={t(
            variant === 'character' ? 'cards.characterMatching.label' : 'cards.lineMatching.label'
          )}
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
                {t('audioLoading.title')}
              </p>
              <p className="text-sm sm:text-base text-ink-500">{t('audioLoading.sub')}</p>
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
                    className={cn(
                      imageCardClass(imageItemIdx),
                      'w-full h-full overflow-hidden',
                      imageItem.imageLabel && 'flex flex-col'
                    )}
                    aria-label={t('lineMatching.imageAria')}
                  >
                    {/* 🔴 그림 카드는 **그림만** 이 기본이다(2026-07-29 한글) — 그림 밑에 「고기」가 있으면
                        아이가 그림을 볼 필요 없이 글자만 읽고 짝을 짓는다. 한글·동화책은 `imageLabel`
                        을 안 넘기므로 그대로 그림만.
                        🔴 **영어 복습만 그림 아래 낱말**(2026-07-30 사용자) — 니들펠트 그림이 무엇인지
                        아이가 못 알아볼 수 있어서(elbow·desk 등) 낱말로 알려준다. 우측이 글자(B)라
                        낱말끼리 매칭은 안 된다. */}
                    <img
                      src={imageItem.imageUrl}
                      alt=""
                      className={cn(
                        'w-full object-contain p-2 lg:p-3',
                        imageItem.imageLabel ? 'flex-1 min-h-0' : 'h-full'
                      )}
                    />
                    {imageItem.imageLabel && (
                      <span className="block shrink-0 pb-2 text-center text-xl sm:text-3xl font-black text-ink-800 break-keep">
                        {imageItem.imageLabel}
                      </span>
                    )}
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
                    aria-label={t('lineMatching.wordAria', { word: wordItem.word })}
                  >
                    {/* 🔴 크기는 **라벨 길이로 갈린다** — `Bb` 같은 두 글자를 긴 낱말과 같은 크기로
                        두면 카드가 텅 비어 보인다. 긴 한글 낱말은 키우면 접혀서 잘린다. */}
                    <span
                      className={cn(
                        wordItem.word.length <= 3
                          ? 'text-4xl sm:text-6xl lg:text-8xl'
                          : 'text-xl sm:text-3xl lg:text-5xl',
                        'font-black text-ink-900 font-display leading-tight break-keep text-center'
                      )}
                    >
                      {wordItem.word}
                    </span>
                    {/* 🔴 낱말은 **글자 카드 아래**에(2026-07-29). 그림이 무엇인지 알려주되(오리 그림을
                        못 알아보면 짝을 못 짓는다) 그림 옆이 아니라 글자 옆에 둬서, 답을 손에 쥐여주는
                        대신 **글자와 낱말을 같이 보게** 한다. `imageLabel` 을 넘긴 호출부에만 뜬다. */}
                    {wordItem.imageLabel && (
                      <span className="mt-1 text-base sm:text-2xl font-black text-ink-500 break-keep">
                        {emphasizeFirstLabel ? (
                          <FirstLetterWord word={wordItem.imageLabel} />
                        ) : (
                          wordItem.imageLabel
                        )}
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
