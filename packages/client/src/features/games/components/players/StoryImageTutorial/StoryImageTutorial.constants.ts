/**
 * 이야기 듣고 그림 찾기 튜토리얼 — 정답 이미지 pulse + 사용자 클릭.
 */
export const TUTORIAL_AUDIO_BASE = '/sounds/games/tutorial';

export const TUTORIAL_LINES = {
  intro: {
    text: '잘 듣고 그림을 골라봐!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-intro.mp3`,
  },
  pop: {
    text: '이 그림이야!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-pop.mp3`,
  },
  end: {
    text: '이제 네 차례야!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-end.mp3`,
  },
} as const;

export const TUTORIAL_TIMING = {
  intro: 1200,
  end: 1300,
  fadeOut: 300,
} as const;
