import { useCallback, useEffect, useMemo, useState } from 'react';
import { SPEAKING_PRESETS } from '@tangobook/shared';
import type {
  KoreanSpeakingData,
  EnglishSpeakingData,
  SpeakingDifficulty,
  Storybook,
} from '@tangobook/shared';
import { Mascot } from '@/design-system';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GameProgressBar } from '../GameProgressBar';
import { GameResultScreen } from '../GameResultScreen';
import { useSpeechRecognizer } from '../../hooks/useSpeechRecognizer';
import { useSpeakingProgress } from '../../hooks/useSpeakingProgress';
import { useGameAudio } from '../../hooks/useGameAudio';
import { shuffle } from '../../utils/shuffle';
import { cn } from '@/lib/cn';

interface SpeakingPlayerProps {
  storybookId: string;
  gameData: KoreanSpeakingData | EnglishSpeakingData;
  difficulty: SpeakingDifficulty;
  lang: 'ko' | 'en';
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
  systemSounds?: Storybook['systemSounds'];
}

type Phase = 'idle' | 'listening' | 'processing' | 'feedback' | 'done';

export function SpeakingPlayer({
  storybookId,
  gameData,
  difficulty,
  lang,
  onComplete,
  onBack,
  systemSounds,
}: SpeakingPlayerProps) {
  const preset = SPEAKING_PRESETS[difficulty];

  const rounds = useMemo(() => {
    const base = shuffle(gameData.items);
    return preset.repeatCycles === 2 ? [...base, ...shuffle(base)] : base;
  }, [gameData.items, preset.repeatCycles]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [showFeedback, setShowFeedback] = useState(false);

  const recognizer = useSpeechRecognizer({
    lang: lang === 'ko' ? 'ko-KR' : 'en-US',
    silenceTimeoutMs: 2000,
    noSpeechTimeoutMs: 5000,
    maxWaitMs: 10000,
  });
  const progress = useSpeakingProgress(storybookId, lang);
  // useGameAudio는 인자 없음. systemSounds prop은 GamePlayerProps 시그니처 준수용으로 유지.
  const { playAudio, playFeedbackSound } = useGameAudio();
  void systemSounds;

  const current = rounds[roundIdx];
  const promptText = lang === 'ko' ? '따라해볼까?' : 'Can you say this?';

  // 자동재생 (easy)
  useEffect(() => {
    if (!current) return;
    if (!preset.autoPlayTts) return;
    const delay = preset.showPromptLine ? 600 : 0;
    const t = setTimeout(() => playAudio(current.ttsUrl), delay);
    return () => clearTimeout(t);
  }, [current, preset.autoPlayTts, preset.showPromptLine, playAudio]);

  const onMicTap = useCallback(async () => {
    if (phase !== 'idle' || !current) return;
    setPhase('listening');
    const result = await recognizer.start();
    setPhase('processing');
    progress.record({
      spoken: result.spoken,
      transcription: result.transcription,
      targetWord: current.word,
    });
    setPhase('feedback');
    setShowFeedback(true);
    playFeedbackSound(true); // 모른척 통과 — 항상 correct
    setTimeout(() => {
      setShowFeedback(false);
      if (roundIdx + 1 >= rounds.length) {
        setPhase('done');
        onComplete(rounds.length, rounds.length);
      } else {
        setRoundIdx((i) => i + 1);
        setPhase('idle');
      }
    }, 1200);
  }, [
    phase,
    current,
    recognizer,
    progress,
    playFeedbackSound,
    roundIdx,
    rounds.length,
    onComplete,
  ]);

  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-peach-100 p-4 overflow-y-auto">
        <GameResultScreen
          storybookId={storybookId}
          score={rounds.length}
          total={rounds.length}
          onRestart={() => {
            setRoundIdx(0);
            setPhase('idle');
          }}
          onBack={onBack}
        />
        {/* 말하기 전용 배지 — GameResultScreen은 score/total만 받으므로 별도 렌더 */}
        <div className="mt-4 px-4 py-2 rounded-full bg-coral-100 text-coral-600 font-bold text-lg shadow-soft">
          이 책에서 {progress.progress.wordsSpoken.length}개 단어를 말해봤어요! 🎉
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center bg-gradient-to-br from-cream-50 to-peach-100 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <GameProgressBar current={roundIdx} total={rounds.length} score={roundIdx + 1} />
          {/* 라운드 숫자 인디케이터 — 도트 모드에서도 총 라운드 확인 가능하게 별도 렌더 */}
          <span
            data-testid="speaking-round-count"
            className="font-black text-ink-900 text-lg bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-soft"
          >
            {roundIdx + 1} / {rounds.length}
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          <Mascot
            state={phase === 'listening' ? 'waving' : 'pointing'}
            size="md"
            character="hori"
          />

          <img
            src={current.imageUrl}
            alt=""
            className="w-[min(40vmin,24rem)] aspect-square object-contain rounded-lg shadow-card bg-white p-4"
          />

          {preset.showPromptLine && (
            <div data-testid="speaking-prompt" className="text-lg font-bold text-coral-500">
              {promptText}
            </div>
          )}

          {preset.showWord && (
            <div data-testid="speaking-word" className="text-5xl font-black text-ink-900">
              {current.displayWord}
              {current.koreanMeaning && (
                <div className="text-lg font-normal text-ink-900 mt-1">{current.koreanMeaning}</div>
              )}
            </div>
          )}

          {!preset.autoPlayTts && (
            <button
              onClick={() => playAudio(current.ttsUrl)}
              className="w-12 h-12 rounded-full bg-coral-500 text-white shadow-pop hover:brightness-110"
              aria-label="단어 듣기"
            >
              🔊
            </button>
          )}

          <button
            data-testid="speaking-mic"
            onClick={onMicTap}
            disabled={phase !== 'idle'}
            aria-label="탭해서 말하기"
            aria-live={phase === 'listening' ? 'polite' : undefined}
            className={cn(
              'mt-4 px-8 py-4 rounded-full text-white font-black shadow-pop transition-all',
              phase === 'idle' && 'bg-coral-500 hover:brightness-110',
              phase === 'listening' && 'bg-coral-600 animate-pulse',
              phase !== 'idle' && 'cursor-not-allowed'
            )}
          >
            {phase === 'idle' ? '🎤 탭해서 말하기' : phase === 'listening' ? '듣고 있어요...' : '✓'}
          </button>
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={showFeedback} />
    </div>
  );
}
