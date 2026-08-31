import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type {
  KoreanStoryImageData,
  EnglishStoryImageData,
  StoryImageRound,
} from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';
import { GamePlayerLayout } from '../GamePlayerLayout';
import {
  TutorialProvider,
  useTutorialHighlight,
  useTutorialIsPlaying,
  useTutorialExpected,
  useTutorialNotify,
} from './StoryImageTutorial/StoryImageTutorial.context';
import { StoryImageTutorial } from './StoryImageTutorial/StoryImageTutorial';
import { shuffle } from '../../utils/shuffle';
import { resolveTtsUrl } from '@/features/tts';
import { cn } from '@/lib/cn';

interface StoryImagePlayerProps extends GamePlayerProps {
  lang: 'ko' | 'en';
  /**
   * 무엇을 듣고 고르는가. 판정·화면 틀은 같고 **문제 쪽**만 달라진다.
   *  - `'story'`(기본) 이야기 한 쪽의 나레이션 → 그 장면 고르기
   *  - `'object'` 낱말 카드 그림 + 낱말 소리 → 그 사물이 나온 쪽 고르기
   */
  variant?: 'story' | 'object';
}

/** 낱말 음원 concat 캐시 prefix — 프리로드(buildTtsSpec)와 재생이 같은 키를 써야 한다. */
const OBJECT_WORD_PREFIX = 'objscene';

function StoryImagePlayerInner({
  storybookId,
  gameData,
  onComplete,
  onBack,
  variant = 'story',
}: StoryImagePlayerProps) {
  const data = gameData as KoreanStoryImageData | EnglishStoryImageData;
  const rounds = data.rounds;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const [hintActive, setHintActive] = useState(false);

  const { t } = useTranslation('games');
  const { playAudio, playFeedbackSound, playWordCorrect } = useGameAudio();
  const isTutorialPlaying = useTutorialIsPlaying();
  const { pulseUrl } = useTutorialHighlight();
  const expected = useTutorialExpected();
  const notifyPick = useTutorialNotify();
  const handleHintStart = useCallback(() => {
    if (hintActive || isTutorialPlaying) return;
    setHintActive(true);
  }, [hintActive, isTutorialPlaying]);
  const handleHintEnd = useCallback(() => {
    setHintActive(false);
  }, []);

  const current = rounds[currentIdx] as StoryImageRound | undefined;

  // 각 라운드별로 옵션 셔플 (correctImageUrl + distractorImageUrls)
  const shuffledOptions = useMemo(() => {
    if (!current) return [];
    return shuffle([current.correctImageUrl, ...current.distractorImageUrls]);
  }, [current]);

  /**
   * 이 라운드에서 낼 소리. 저작 음원이 있으면 그것, 없으면(「이 물건 어느 장면?」의 낱말은
   * 전래동화 200개가 전부 없다) 음절 mp3 를 서버가 이어붙인 파일을 쓴다.
   */
  const roundAudioUrl = useCallback(async () => {
    if (!current) return undefined;
    if (current.ttsUrl) return current.ttsUrl;
    if (variant !== 'object') return undefined;
    return resolveTtsUrl({
      text: current.text,
      language: 'korean',
      storybookId,
      identifierPrefix: OBJECT_WORD_PREFIX,
    });
  }, [current, variant, storybookId]);

  const speak = useCallback(() => {
    void roundAudioUrl().then((url) => url && playAudio(url));
  }, [roundAudioUrl, playAudio]);

  // 라운드 시작 시 TTS 자동 재생
  useEffect(() => {
    if (!current || finished) return;
    const timer = setTimeout(speak, 400);
    return () => clearTimeout(timer);
  }, [currentIdx, current, finished, speak]);

  const replayAudio = speak;

  const handleSelect = useCallback(
    (url: string) => {
      if (feedback || !current) return;
      // 튜토리얼: 차단 / expected 외 거부
      if (isTutorialPlaying) return;
      if (expected !== null && expected.url !== url) return;
      const isCorrect = url === current.correctImageUrl;
      setSelectedUrl(url);
      setFeedback(isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        setScore((s) => s + 1);
        playWordCorrect({
          onDone: () => {
            if (currentIdx + 1 >= rounds.length) setFinished(true);
            else setCurrentIdx((i) => i + 1);
            setSelectedUrl(null);
            setFeedback(null);
            setHintActive(false);
          },
        });
        notifyPick(url);
      } else {
        playFeedbackSound(false);
        setTimeout(() => {
          setSelectedUrl(null);
          setFeedback(null);
        }, 800);
      }
    },
    [
      feedback,
      current,
      currentIdx,
      rounds.length,
      playFeedbackSound,
      playWordCorrect,
      isTutorialPlaying,
      expected,
      notifyPick,
    ]
  );

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedUrl(null);
    setFeedback(null);
    setFinished(false);
  }, []);

  useEffect(() => {
    if (finished) onComplete(score, rounds.length);
  }, [finished, score, rounds.length, onComplete]);

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={score}
        total={rounds.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!current) return null;

  const getOptionClass = (url: string) => {
    const base =
      'relative w-full aspect-video max-h-[clamp(4rem,22vh,12rem)] rounded-2xl overflow-hidden border-4 transition-all cursor-pointer bg-white shadow-card';
    const isThisCorrect =
      feedback === 'correct' && (selectedUrl === url || url === current.correctImageUrl);
    const isThisWrong = feedback === 'wrong' && selectedUrl === url;
    if (isThisCorrect)
      return cn(base, 'border-success ring-4 ring-success scale-[1.02] animate-pulse');
    if (isThisWrong) return cn(base, 'border-danger ring-4 ring-danger animate-shake');
    // 튜토리얼 highlight (정답)
    if (pulseUrl === url)
      return cn(base, 'border-coral-400 ring-[6px] ring-coral-300 scale-105 animate-pulse');
    // 튜토리얼 wait — expected 외 dim
    if (expected !== null && expected.url !== url)
      return cn(base, 'border-peach-200 opacity-30 cursor-not-allowed');
    return cn(base, 'border-peach-200 hover:scale-[1.02] hover:shadow-pop hover:border-coral-300');
  };

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full flex-1 min-h-0">
        <GameProgressBar current={currentIdx} total={rounds.length} score={score} />

        <div className="text-center space-y-3">
          <p className="text-lg sm:text-xl font-bold text-ink-900 dark:text-peach-200 break-keep">
            {t(variant === 'object' ? 'objectScene.prompt' : 'storyImage.prompt')}
          </p>
          {/* 문제 그림 — 낱말 카드. 글을 못 읽는 아이는 이게 없으면 낱말 소리 하나로만 풀어야 한다. */}
          {current.promptImageUrl && (
            <img
              src={current.promptImageUrl}
              alt={current.text}
              className="w-[clamp(5rem,18vh,9rem)] h-[clamp(5rem,18vh,9rem)] object-contain mx-auto rounded-3xl bg-white shadow-card border-4 border-peach-200 p-1"
            />
          )}
          <button
            onClick={replayAudio}
            className="inline-flex items-center gap-3 px-6 py-4 sm:px-8 sm:py-5 rounded-md bg-peach-100 border-2 border-peach-300 text-ink-900 font-bold hover:bg-peach-200 transition-all hover:scale-105"
          >
            <span className="text-2xl sm:text-3xl">🔊</span>
            <span className="text-base sm:text-lg">{t('storyImage.replay')}</span>
          </button>
        </div>

        {/* 세로 스택: 한 줄에 이미지 한 개씩, 16:9 비율 */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 w-full max-w-3xl mx-auto">
          {shuffledOptions.map((url) => {
            const isCorrectOpt =
              feedback === 'correct' && (selectedUrl === url || url === current.correctImageUrl);
            return (
              <button
                key={url}
                onClick={() => handleSelect(url)}
                disabled={!!feedback}
                className={getOptionClass(url)}
                aria-label={t(
                  variant === 'object' ? 'objectScene.pickAria' : 'storyImage.pickAria'
                )}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                {isCorrectOpt && (
                  <span className="absolute top-3 right-3 bg-success text-white rounded-full w-10 h-10 flex items-center justify-center font-black text-xl shadow-pop">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 이야기 = 참고용 자막(작게) / 낱말 = 문제 그 자체(굵게) */}
        <p
          className={cn(
            'text-center max-w-xl',
            variant === 'object'
              ? 'text-2xl sm:text-3xl font-black font-display text-ink-900 dark:text-peach-200'
              : 'text-base sm:text-lg text-ink-900 dark:text-peach-200/60 italic'
          )}
        >
          {current.text}
        </p>
      </div>

      {/* 🪄 도와줘 버튼 — 사용자 정책 (2026-05-12): 블록 게임 외 튜토리얼 노출 X.
          필요 시 아래 블록 풀기:
          <button onClick={handleHintStart} disabled={hintActive || isTutorialPlaying || !!feedback}
            className="fixed bottom-4 left-4 z-[70] px-6 py-3 rounded-full bg-gradient-to-b from-warn to-peach-500 text-white font-black text-lg shadow-pop">
            🪄 도와줘
          </button> */}

      <StoryImageTutorial
        correctUrl={current.correctImageUrl}
        active={hintActive}
        onEnd={handleHintEnd}
      />
    </GamePlayerLayout>
  );
}

export function StoryImagePlayer(props: StoryImagePlayerProps) {
  return (
    <TutorialProvider>
      <StoryImagePlayerInner {...props} />
    </TutorialProvider>
  );
}
