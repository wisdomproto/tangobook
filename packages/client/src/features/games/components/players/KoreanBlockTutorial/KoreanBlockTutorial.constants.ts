/**
 * 한글 블록 튜토리얼 — 멘트 텍스트 + 음성 mp3 경로 + 타이밍.
 * 음성 mp3 미존재 시 말풍선만 graceful display (4-5세 못 읽어도 시각 단서).
 */
export const TUTORIAL_AUDIO_BASE = '/sounds/games/tutorial';

export const TUTORIAL_LINES = {
  intro: {
    text: '안녕! 같이 만들어 볼까?',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-intro.mp3`,
  },
  pop: {
    text: '이거!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-pop.mp3`,
  },
  place: {
    text: '여기에!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-place.mp3`,
  },
  syllableDone: {
    text: '잘했어! 완성!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-syllable-done.mp3`,
  },
  end: {
    text: '이제 네 차례야!',
    audio: `${TUTORIAL_AUDIO_BASE}/hori-end.mp3`,
  },
} as const;

/** 각 phase 의 ms duration. spec design 와 일치. */
export const TUTORIAL_TIMING = {
  intro: 1200,
  pop: 500,
  arrow: 600,
  place: 500,
  syllableDone: 600,
  end: 1300,
  fadeOut: 300,
} as const;
