/** 낱말쓰기 튜토리얼 — 캔버스 따라쓰기 안내. */
export const TUTORIAL_AUDIO_BASE = '/sounds/games/tutorial';

export const TUTORIAL_LINES = {
  intro: {
    text: '안녕! 같이 써 볼까?',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-intro.mp3`,
  },
  pop: {
    text: '회색 글씨 위로 따라 그려!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-pop.mp3`,
  },
  end: {
    text: '잘하고 있어!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-end.mp3`,
  },
} as const;

export const TUTORIAL_TIMING = {
  intro: 1200,
  end: 1300,
  fadeOut: 300,
} as const;
