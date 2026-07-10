import { create } from 'zustand';

export interface PlaylistItem {
  bookId: string;
}

interface PlaylistState {
  queue: PlaylistItem[];
  language: string;
  index: number;
  speed: number;
  sleepMinutes: number | null;
  paused: boolean;
  ended: boolean;
  /** 첫 책 "탭해서 시작하기" 를 눌러 재생을 시작했는지 — 시작 전엔 컨트롤을 보여주고, 시작하면 숨긴다. */
  started: boolean;

  setQueue: (books: PlaylistItem[], language: string) => void;
  next: () => void;
  skip: () => void;
  restart: () => void;
  reset: () => void;
  markStarted: () => void;
  setSpeed: (n: number) => void;
  togglePause: () => void;
  setSleep: (minutes: number | null) => void;
  clearSleep: () => void;
}

// 슬립 타이머는 state 밖(모듈 스코프)에서 소유 — 리렌더 유발 없이 clearable.
// setTimeout 반복 버그(memory `feedback-tts-chain-rule`) 방지: 항상 이전 타이머를
// clear 한 뒤 새로 걸고, reset()/clearSleep() 에서 확실히 해제한다.
let sleepTimer: ReturnType<typeof setTimeout> | null = null;

function clearSleepTimer() {
  if (sleepTimer !== null) {
    clearTimeout(sleepTimer);
    sleepTimer = null;
  }
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  queue: [],
  language: 'ko',
  index: 0,
  speed: 1,
  sleepMinutes: null,
  paused: false,
  ended: false,
  started: false,

  setQueue: (books, language) => {
    clearSleepTimer();
    set({
      queue: books,
      language,
      index: 0,
      ended: false,
      paused: false,
      sleepMinutes: null,
      started: false,
    });
  },

  next: () => {
    const { index, queue } = get();
    if (index + 1 >= queue.length) {
      // 마지막 책 종료 — 마지막 인덱스에 머무르고 ended 신호.
      set({ ended: true });
      return;
    }
    set({ index: index + 1 });
  },

  // 현재 책 건너뛰기 = 다음 책으로 (동작 동일).
  skip: () => get().next(),

  // 다시 보기 — 첫 책부터 → 시작 화면(컨트롤 표시) 다시 노출.
  restart: () => set({ index: 0, ended: false, started: false }),

  reset: () => {
    clearSleepTimer();
    set({
      queue: [],
      language: 'ko',
      index: 0,
      speed: 1,
      sleepMinutes: null,
      paused: false,
      ended: false,
      started: false,
    });
  },

  markStarted: () => set({ started: true }),

  setSpeed: (n) => set({ speed: n }),

  togglePause: () => set((s) => ({ paused: !s.paused })),

  setSleep: (minutes) => {
    // 기존 타이머 항상 해제 후 재설정 — 이중 발화 방지.
    clearSleepTimer();
    set({ sleepMinutes: minutes });
    if (minutes != null) {
      sleepTimer = setTimeout(() => {
        sleepTimer = null;
        set({ ended: true });
      }, minutes * 60_000);
    }
  },

  clearSleep: () => {
    clearSleepTimer();
    set({ sleepMinutes: null });
  },
}));
