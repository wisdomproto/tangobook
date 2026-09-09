/**
 * 4×4 길 잇기 게임 — 문제 데이터에 **우리 동화책 옷을 입힌다**.
 *
 * 판·조각·정답은 `road-challenges.ts`(생성물)에 있고, 여기서는 어느 책의 누가 어디로 가는지만
 * 정한다. 같은 문제를 다른 책으로 갈아입힐 수 있다 — 판이 바뀌는 게 아니라 그림이 바뀐다.
 *
 * 🔴 캐릭터 그림은 **캐릭터 시트**(정면·측면·표정이 한 장)라 쓸 포즈를 `crop` 으로 집는다.
 * 🔴 막는 것(나무·늑대·놀부)은 책마다 다르고, 한 문제에 여럿이면 차례로 돌려 쓴다.
 */
import type { Art, Challenge } from '../lib/puzzle';
import { ROAD_CHALLENGE_DATA } from './road-challenges';

const A = 'https://assets.tangobook.co.kr/';
const J = A + 'comic-assets/jeonrae-heungbu/';

interface Theme {
  book: { id: string; title: string; coverUrl?: string };
  prompt: string;
  start: Art;
  goal: Art;
  /** 길을 막는 것들 — 한 문제에 여럿이면 앞에서부터 돌려 쓴다 */
  blockers: Art[];
}

const THEMES: Theme[] = [
  {
    book: {
      id: '1778476961082',
      title: '빨간모자',
      coverUrl: A + '1778476961082-빨간모자new-cover-misc-1778494478564.webp',
    },
    prompt: '숲을 지나 할머니 오두막까지 길을 이어 주세요.',
    start: {
      label: '빨간모자',
      imageUrl: A + '1778476961082-빨간모자new-character-소녀-1778491641310.jpg',
      crop: [0.01, 0.02, 0.2, 0.96],
    },
    goal: {
      label: '오두막',
      imageUrl: A + '1778476961082-빨간모자-keyobj-cottage-1779169767891-w800.webp',
      ttsUrl: A + '1778476961082-tts-page3-1779940001449.mp3',
    },
    blockers: [
      { label: '나무', emoji: '🌳' },
      {
        label: '늑대',
        imageUrl: A + '1778476961082-빨간모자new-character-늑대-1778491644020.jpg',
        crop: [0.01, 0.02, 0.21, 0.96],
      },
      { label: '나무', emoji: '🌲' },
    ],
  },
  {
    book: {
      id: '1772108045716',
      title: '아기 돼지 삼형제',
      coverUrl: A + '1772108045716-아기돼지삼형제-cover-misc-1781257260984.webp',
    },
    prompt: '늑대를 피해서 집까지 길을 이어 주세요.',
    start: {
      label: '아기 돼지',
      imageUrl: A + '1772108045716-아기돼지삼형제-character-셋째돼지-1781254260304.jpg',
      crop: [0.06, 0.19, 0.17, 0.38],
    },
    goal: {
      label: '집',
      imageUrl: A + '1772108045716-아기돼지삼형제-keyobj-house-1783553436398-w800.webp',
    },
    blockers: [
      {
        label: '늑대',
        imageUrl: A + '1772108045716-아기돼지삼형제-character-늑대-1781254264674.jpg',
        crop: [0.246, 0.07, 0.105, 0.52],
      },
      {
        label: '짚단',
        imageUrl: A + '1772108045716-아기돼지삼형제-keyobj-Straw-1783553427894-w800.webp',
      },
      {
        label: '나뭇가지',
        imageUrl: A + '1772108045716-아기돼지삼형제-keyobj-Wood-1783553430196-w800.webp',
      },
    ],
  },
  {
    book: {
      id: '1784529056876',
      title: '흥부와 놀부',
      coverUrl: A + '1784529056876-흥부와놀부-cover-misc-1785231385300.webp',
    },
    prompt: '제비가 흥부네 마당까지 갈 길을 이어 주세요.',
    start: {
      label: '제비',
      imageUrl: J + 'char-swallow.png',
      crop: [0.34, 0.16, 0.36, 0.53],
    },
    goal: { label: '박', imageUrl: J + 'word-bak.jpg' },
    blockers: [
      { label: '놀부', imageUrl: J + 'char-nolbu.png', crop: [0.01, 0.13, 0.26, 0.72] },
      { label: '지게', imageUrl: J + 'word-jige.jpg' },
      { label: '엽전', imageUrl: J + 'word-yeopjeon.jpg' },
    ],
  },
];

export const ROAD_CHALLENGES: Challenge[] = ROAD_CHALLENGE_DATA.map((d, i) => {
  const theme = THEMES[i % THEMES.length];
  return {
    id: d.id,
    title: `${d.level} ${String(i + 1).padStart(2, '0')}`,
    prompt: theme.prompt,
    width: d.width,
    height: d.height,
    allowFlip: d.allowFlip,
    // 🔴 출발은 방향이 없다 — 어느 쪽에서 길이 닿아도 된다. 문이 있는 건 도착뿐이다.
    start: { x: d.start.x, y: d.start.y, ...theme.start },
    goal: { x: d.goal.x, y: d.goal.y, port: d.goal.port, ...theme.goal },
    blocked: d.trees.map((t, n) => ({
      x: t.x,
      y: t.y,
      ...theme.blockers[n % theme.blockers.length],
    })),
    inventory: { ...d.inventory },
    book: theme.book,
  };
});

export const ROAD_LEVELS = ROAD_CHALLENGE_DATA.map((d) => d.level);
