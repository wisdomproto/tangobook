export type KenBurnsDirection =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down';

export type KenBurnsParams = {
  direction: KenBurnsDirection;
  startScale: number;
  endScale: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
};

const DIRECTIONS: KenBurnsDirection[] = [
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'pan-up',
  'pan-down',
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function getKenBurnsParams(slideIndex: number): KenBurnsParams {
  const rand = seededRandom(slideIndex);
  const direction = DIRECTIONS[Math.floor(rand * DIRECTIONS.length)];

  switch (direction) {
    case 'zoom-in':
      return { direction, startScale: 1.0, endScale: 1.25, startX: 0, endX: 0, startY: 0, endY: 0 };
    case 'zoom-out':
      return { direction, startScale: 1.25, endScale: 1.0, startX: 0, endX: 0, startY: 0, endY: 0 };
    case 'pan-left':
      return {
        direction,
        startScale: 1.15,
        endScale: 1.15,
        startX: 5,
        endX: -5,
        startY: 0,
        endY: 0,
      };
    case 'pan-right':
      return {
        direction,
        startScale: 1.15,
        endScale: 1.15,
        startX: -5,
        endX: 5,
        startY: 0,
        endY: 0,
      };
    case 'pan-up':
      return {
        direction,
        startScale: 1.15,
        endScale: 1.15,
        startX: 0,
        endX: 0,
        startY: 5,
        endY: -5,
      };
    case 'pan-down':
      return {
        direction,
        startScale: 1.15,
        endScale: 1.15,
        startX: 0,
        endX: 0,
        startY: -5,
        endY: 5,
      };
  }
}
