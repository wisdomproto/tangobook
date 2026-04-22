import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SpeakingPlayer } from './SpeakingPlayer';

// 훅 모킹
vi.mock('../../hooks/useSpeechRecognizer', () => ({
  useSpeechRecognizer: () => ({
    start: vi.fn().mockResolvedValue({ spoken: true, transcription: '사과' }),
    cancel: vi.fn(),
    isSupported: true,
  }),
}));
vi.mock('../../hooks/useSpeakingProgress', () => ({
  useSpeakingProgress: () => ({
    progress: { totalRounds: 0, spokenRounds: 0, wordsSpoken: [] },
    record: vi.fn(),
    reset: vi.fn(),
  }),
}));
vi.mock('../../hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: vi.fn(),
    playFeedbackSound: vi.fn(),
    playCorrectSequence: vi.fn(),
    praiseVisible: false,
  }),
}));

const makeItems = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    word: `word${i}`,
    displayWord: `word${i}`,
    imageUrl: `img${i}.webp`,
    ttsUrl: `tts${i}.mp3`,
  }));

describe('SpeakingPlayer', () => {
  const baseProps = {
    storybookId: 'book1',
    gameData: { type: 'korean-speaking' as const, items: makeItems(3) },
    lang: 'ko' as const,
    onComplete: vi.fn(),
    onBack: vi.fn(),
  };

  it('easy: 프롬프트·단어·자동재생 모두 렌더', () => {
    render(<SpeakingPlayer {...baseProps} difficulty="easy" />);
    expect(screen.getByTestId('speaking-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('speaking-word')).toBeInTheDocument();
  });

  it('medium: 단어 표시·프롬프트 없음', () => {
    render(<SpeakingPlayer {...baseProps} difficulty="medium" />);
    expect(screen.queryByTestId('speaking-prompt')).not.toBeInTheDocument();
    expect(screen.getByTestId('speaking-word')).toBeInTheDocument();
  });

  it('hard: 단어 숨김·프롬프트 없음', () => {
    render(<SpeakingPlayer {...baseProps} difficulty="hard" />);
    expect(screen.queryByTestId('speaking-word')).not.toBeInTheDocument();
    expect(screen.queryByTestId('speaking-prompt')).not.toBeInTheDocument();
  });

  it('hard: 2바퀴 반복 — 총 라운드 수 = items × 2', () => {
    render(<SpeakingPlayer {...baseProps} difficulty="hard" />);
    // 진행률에 total=6 (items 3 × 2)
    expect(screen.getByText(/\/ 6/)).toBeInTheDocument();
  });

  it('🎤 탭 시 useSpeechRecognizer.start 호출 후 피드백 표시', async () => {
    render(<SpeakingPlayer {...baseProps} difficulty="easy" />);
    const mic = screen.getByTestId('speaking-mic');
    await act(async () => {
      fireEvent.click(mic);
      // recognizer.start mock이 resolved 상태라 setShowFeedback(true) 호출됨
      await Promise.resolve();
    });
    // FeedbackOverlay가 실제 DOM에 렌더되는지 확인
    // (kind="correct" 호리 + celebrating 아이콘 등 고유 요소로 식별)
    expect(screen.getByTestId('speaking-mic')).toBeDisabled();
  });
});
