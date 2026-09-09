/**
 * 길 조각 세트 — 4×4 판을 쓰는 CONNECT 게임의 카트리지.
 *
 * 조각은 **전부 두 칸짜리 타일** 다섯 종. 아이가 집기 좋은 크기(§6 「1×1 금지」)이면서,
 * 다섯 개만으로 쉬움~어려움이 다 나온다(§22.7 「적은 블록으로 넓은 문제 공간」).
 *
 * 🔴 **길이 없는 칸이 있는 조각**(corner)이 이 세트의 핵심이다. 타일 모양과 길 모양이
 *    달라서, 「어디에 놓느냐」와 「길이 어디로 나느냐」가 따로 논다. 그게 퍼즐을 만든다.
 * 🔴 **뒤집기 없음** — 한 면에만 길이 인쇄된 실물 타일이라, 문제 데이터가 `allowFlip: false`
 *    를 든다. 뒤집기를 허용하면 해가 늘어 「유일해」가 깨진다.
 * 🔴 조각마다 **열린 끝이 정확히 2개** — solver 가 이 전제 위에 서 있다(`traverse`).
 */
import type { PieceSet } from '../lib/puzzle';

export const ROAD_PIECES: PieceSet = {
  // 두 칸을 곧게 지나간다
  straight: {
    id: 'straight',
    nameKo: '곧은 길',
    color: '#4F9BE8',
    cells: [
      { x: 0, y: 0, ports: ['W', 'E'] },
      { x: 1, y: 0, ports: ['W', 'E'] },
    ],
  },
  // 한 칸 내려가며 반대쪽으로 빠진다
  step: {
    id: 'step',
    nameKo: '엇갈린 길',
    color: '#E8699B',
    cells: [
      { x: 0, y: 0, ports: ['W', 'S'] },
      { x: 0, y: 1, ports: ['N', 'E'] },
    ],
  },
  // 들어온 쪽에서 꺾여 아래로 빠진다
  bend: {
    id: 'bend',
    nameKo: '꺾인 길',
    color: '#8A6BE0',
    cells: [
      { x: 0, y: 0, ports: ['W', 'S'] },
      { x: 0, y: 1, ports: ['N', 'S'] },
    ],
  },
  // 🔴 한 칸은 풀밭 — 자리는 차지하는데 길은 없다
  corner: {
    id: 'corner',
    nameKo: '모퉁이 길',
    color: '#8C8F96',
    cells: [
      { x: 0, y: 0, ports: ['N', 'E'] },
      { x: 0, y: 1, ports: [] },
    ],
  },
  // 들어온 쪽으로 되돌아 나온다
  uturn: {
    id: 'uturn',
    nameKo: '되돌아 길',
    color: '#E8A33A',
    cells: [
      { x: 0, y: 0, ports: ['E', 'S'] },
      { x: 0, y: 1, ports: ['N', 'E'] },
    ],
  },
};
