/**
 * 점잇기 튜토리얼 — 멘트 + 음성 + 타이밍. 음성 자산은 블록 튜토리얼과 공용.
 */
export const TUTORIAL_AUDIO_BASE = '/sounds/games/tutorial';

export const TUTORIAL_LINES = {
  intro: {
    text: '안녕! 같이 그려 볼까?',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-intro.mp3`,
  },
  pop: {
    text: '이 점!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-pop.mp3`,
  },
  next: {
    text: '그 다음!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-place.mp3`,
  },
  end: {
    text: '계속 순서대로!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-end.mp3`,
  },
} as const;

export const TUTORIAL_TIMING = {
  intro: 1200,
  end: 1300,
  fadeOut: 300,
} as const;
