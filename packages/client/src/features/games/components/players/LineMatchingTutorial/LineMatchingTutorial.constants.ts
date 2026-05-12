/**
 * 그림짝 맞추기 튜토리얼 — 멘트 + 음성 + 타이밍.
 * 음성 자산은 블록 게임 튜토리얼과 공용.
 */
export const TUTORIAL_AUDIO_BASE = '/sounds/games/tutorial';

export const TUTORIAL_LINES = {
  intro: {
    text: '안녕! 같이 짝지어 볼까?',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-intro.mp3`,
  },
  pop: {
    text: '이거랑',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-pop.mp3`,
  },
  place: {
    text: '이거!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-place.mp3`,
  },
  syllableDone: {
    text: '잘했어!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-syllable-done.mp3`,
  },
  end: {
    text: '이제 네 차례야!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-end.mp3`,
  },
} as const;

export const TUTORIAL_TIMING = {
  intro: 1200,
  demo: 1500,
  syllableDone: 600,
  end: 1300,
  fadeOut: 300,
} as const;
