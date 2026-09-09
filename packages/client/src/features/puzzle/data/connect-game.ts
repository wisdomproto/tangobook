/**
 * CONNECT 게임 — 고정 세트(카트리지) + 문제들.
 *
 * 🔴 **Fixed Piece Set v0.1** (§21 · §22.5): 조각 종류는 여기 있는 것이 전부다. 문제는
 *    이 중 몇 개씩 쓸 수 있는지(`inventory`)만 정한다. 실물로 치면 세트는 상자 하나,
 *    문제 카드는 「이번엔 이 블록들만」이다.
 * 🔴 **1×1 은 없다**(§6 — 어린이 조작성). 가장 작은 조각도 2칸이다.
 * 🔴 조각은 전부 **열린 끝이 정확히 2개**인 길 한 도막이다. solver 가 이 전제 위에 서 있다.
 *
 * 문제 그림·낱말·음원은 지어내지 않는다. 목적지 칸은 그 책의 **핵심 단어 카드**(R2 실물)와
 * 그 낱말 음원을 그대로 쓴다 — 퍼즐을 풀면 그 책의 낱말을 하나 만나고 나가게 된다.
 */
import type { Challenge, PieceSet } from '../lib/puzzle';

export const CONNECT_PIECES: PieceSet = {
  straight2: {
    id: 'straight2',
    nameKo: '곧은 길',
    color: '#6BAEE8',
    cells: [
      { x: 0, y: 0, ports: ['W', 'E'] },
      { x: 1, y: 0, ports: ['W', 'E'] },
    ],
  },
  straight3: {
    id: 'straight3',
    nameKo: '긴 길',
    color: '#5CC99F',
    cells: [
      { x: 0, y: 0, ports: ['W', 'E'] },
      { x: 1, y: 0, ports: ['W', 'E'] },
      { x: 2, y: 0, ports: ['W', 'E'] },
    ],
  },
  bend2: {
    id: 'bend2',
    nameKo: '꺾인 길',
    color: '#FF7A59',
    cells: [
      { x: 0, y: 0, ports: ['W', 'E'] },
      { x: 1, y: 0, ports: ['W', 'S'] },
    ],
  },
  step2: {
    id: 'step2',
    nameKo: '계단 길',
    color: '#A78BFA',
    cells: [
      { x: 0, y: 0, ports: ['W', 'S'] },
      { x: 0, y: 1, ports: ['N', 'E'] },
    ],
  },
  elbow3: {
    id: 'elbow3',
    nameKo: 'ㄱ자 길',
    color: '#FFC857',
    cells: [
      { x: 0, y: 0, ports: ['S', 'E'] },
      { x: 1, y: 0, ports: ['W', 'E'] },
      { x: 0, y: 1, ports: ['W', 'N'] },
    ],
  },
  z3: {
    id: 'z3',
    nameKo: '지그재그 길',
    color: '#E75757',
    cells: [
      { x: 0, y: 0, ports: ['N', 'E'] },
      { x: 1, y: 0, ports: ['W', 'E'] },
      { x: 2, y: 0, ports: ['W', 'S'] },
    ],
  },
};

export const CHALLENGES: Challenge[] = [
  {
    id: 'redhood-cottage',
    title: '할머니 댁까지 가는 길',
    prompt: '늑대를 피해서 오두막까지 길을 이어 주세요.',
    width: 5,
    height: 5,
    book: {
      id: '1778476961082',
      title: '빨간모자',
      coverUrl:
        'https://assets.tangobook.co.kr/1778476961082-빨간모자new-cover-misc-1778494478564.webp',
    },
    start: { x: 0, y: 2, port: 'E', label: '빨간모자', emoji: '🧒' },
    goal: {
      x: 4,
      y: 2,
      port: 'W',
      label: '오두막',
      imageUrl:
        'https://assets.tangobook.co.kr/1778476961082-빨간모자-keyobj-cottage-1779169767891-w800.webp',
      ttsUrl: 'https://assets.tangobook.co.kr/1778476961082-tts-page3-1779940001449.mp3',
    },
    blocked: [
      { x: 2, y: 2, label: '늑대', emoji: '🐺' },
      { x: 2, y: 0, label: '나무', emoji: '🌳' },
      { x: 1, y: 4, label: '나무', emoji: '🌳' },
    ],
    inventory: { elbow3: 1, step2: 1, straight3: 1 },
  },
  {
    id: 'pigs-brick-house',
    title: '벽돌집으로 달려요',
    prompt: '늑대가 막았어요. 돌아서 집까지 가 볼까요?',
    width: 6,
    height: 6,
    book: {
      id: '1772108045716',
      title: '아기 돼지 삼형제',
      coverUrl:
        'https://assets.tangobook.co.kr/1772108045716-아기돼지삼형제-cover-misc-1781257260984.webp',
    },
    start: { x: 0, y: 1, port: 'E', label: '아기 돼지', emoji: '🐷' },
    goal: {
      x: 5,
      y: 3,
      port: 'W',
      label: '집',
      imageUrl:
        'https://assets.tangobook.co.kr/1772108045716-아기돼지삼형제-keyobj-house-1783553436398-w800.webp',
    },
    blocked: [
      { x: 3, y: 1, label: '늑대', emoji: '🐺' },
      {
        x: 1,
        y: 4,
        label: '짚단',
        imageUrl:
          'https://assets.tangobook.co.kr/1772108045716-아기돼지삼형제-keyobj-Straw-1783553427894-w800.webp',
      },
      {
        x: 4,
        y: 0,
        label: '나뭇가지',
        imageUrl:
          'https://assets.tangobook.co.kr/1772108045716-아기돼지삼형제-keyobj-Wood-1783553430196-w800.webp',
      },
    ],
    inventory: { bend2: 2, z3: 1, straight2: 1 },
  },
  {
    id: 'heungbu-bak',
    title: '제비가 물고 온 박씨',
    prompt: '제비가 흥부네 마당까지 날아갈 길을 만들어 주세요.',
    width: 6,
    height: 6,
    book: {
      id: '1784529056876',
      title: '흥부와 놀부',
      coverUrl:
        'https://assets.tangobook.co.kr/1784529056876-흥부와놀부-cover-misc-1785231385300.webp',
    },
    start: { x: 0, y: 1, port: 'E', label: '제비', emoji: '🐦' },
    goal: {
      x: 5,
      y: 4,
      port: 'W',
      label: '박',
      imageUrl: 'https://assets.tangobook.co.kr/comic-assets/jeonrae-heungbu/word-bak.jpg',
    },
    blocked: [
      { x: 3, y: 1, label: '놀부', emoji: '😠' },
      {
        x: 0,
        y: 4,
        label: '지게',
        imageUrl: 'https://assets.tangobook.co.kr/comic-assets/jeonrae-heungbu/word-jige.jpg',
      },
      {
        x: 5,
        y: 0,
        label: '엽전',
        imageUrl: 'https://assets.tangobook.co.kr/comic-assets/jeonrae-heungbu/word-yeopjeon.jpg',
      },
    ],
    inventory: { step2: 2, straight2: 1, elbow3: 1, bend2: 1 },
  },
];
