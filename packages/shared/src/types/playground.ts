import type { Lang } from './learning-events.js';

/** 호리 놀이터 어휘 게임 ID */
export type PlaygroundGameId =
  | 'word-memory'
  | 'word-pop'
  | 'word-fishing'
  | 'word-run'
  | 'word-sort-cart'
  | 'word-garden'
  | 'word-shopping';

export interface PlaygroundGameMeta {
  id: PlaygroundGameId;
  nameKo: string;
  nameEn: string;
  description: string;
  emoji: string;
  /** UI 표시 색 — coral/peach/ink + semantic 만 사용 */
  accent: 'coral' | 'mint' | 'blue' | 'purple' | 'yellow' | 'success' | 'fun';
  /** 출시 여부 — false 면 '곧 만나요' stub */
  available: boolean;
}

export const PLAYGROUND_GAMES: PlaygroundGameMeta[] = [
  {
    id: 'word-memory',
    nameKo: '메모리 카드',
    nameEn: 'Word Memory',
    description: '그림과 단어 짝 맞추기',
    emoji: '🃏',
    accent: 'coral',
    available: true,
  },
  {
    id: 'word-pop',
    nameKo: '풍선 터트리기',
    nameEn: 'Word Pop',
    description: '들리는 단어 풍선 터트리기',
    emoji: '🎈',
    accent: 'blue',
    available: true,
  },
  {
    id: 'word-fishing',
    nameKo: '단어 낚시',
    nameEn: 'Word Fishing',
    description: '그림 보고 단어 물고기 낚기',
    emoji: '🎣',
    accent: 'mint',
    available: true,
  },
  {
    id: 'word-run',
    nameKo: '단어 러닝',
    nameEn: 'Word Run',
    description: '호리가 달리며 정답 단어 줍기',
    emoji: '🏃',
    accent: 'coral',
    available: true,
  },
  {
    id: 'word-sort-cart',
    nameKo: '분류 카트',
    nameEn: 'Word Sort Cart',
    description: '떨어지는 단어 두 카테고리로',
    emoji: '🛒',
    accent: 'purple',
    available: false,
  },
  {
    id: 'word-garden',
    nameKo: '정원 가꾸기',
    nameEn: 'Word Garden',
    description: '매일 정답으로 꽃 키우기',
    emoji: '🌷',
    accent: 'yellow',
    available: false,
  },
  {
    id: 'word-shopping',
    nameKo: '호리 쇼핑',
    nameEn: 'Word Shopping',
    description: '엄마 목소리 듣고 매장에서 찾기',
    emoji: '🛍️',
    accent: 'fun',
    available: true,
  },
];

/** SR 엔진이 반환하는 단어 풀 단위 — Supabase word_mastery + vocabulary-db join */
export interface SrPoolItem {
  word: string;
  language: Lang;
  korean: string;
  definition?: string;
  // word_mastery 에서
  mastery: number;
  status: 'unknown' | 'seen' | 'practiced' | 'mastered';
  exposed: number;
  correct: number;
  wrong: number;
  // 회전된 이미지 + 전체 리스트
  imageUrl?: string;
  imageList: string[];
  sentences: string[];
  ttsUrl?: string;
}

export interface SrPoolRequest {
  profileId: string;
  language: Lang;
  count?: number;
  recentStorybookId?: string;
}

/** 게임 결과 단위 — 서버에 batch insert */
export interface WordAttempt {
  word: string;
  correct: boolean;
  responseMs?: number;
}
