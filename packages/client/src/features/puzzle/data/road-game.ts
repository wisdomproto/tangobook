/**
 * 4×4 길 잇기 — 《빨간모자》 한 권으로 24문제.
 *
 * 판·말 배치는 레퍼런스 부클릿 그대로이고, 그림은 **우리 빨간모자 책**의 것을 쓴다.
 * 🔴 캐릭터 그림은 캐릭터 시트(정면·측면·표정이 한 장)라 정면 하나를 `crop` 으로 집는다.
 */
import type { Art, Challenge } from '../lib/puzzle';
import { ROAD_CHALLENGE_DATA } from './road-challenges';

const A = 'https://assets.tangobook.co.kr/';

const BOOK = {
  id: '1778476961082',
  title: '빨간모자',
  coverUrl: A + '1778476961082-빨간모자new-cover-misc-1778494478564.webp',
};

const GIRL: Art = {
  label: '빨간모자',
  imageUrl: A + '1778476961082-빨간모자new-character-소녀-1778491641310.jpg',
  // 시트 아래줄 웃는 얼굴 — 전신은 세로가 길어 칸에서 작아진다
  crop: [0.64, 0.56, 0.145, 0.33],
  round: true,
};

const COTTAGE: Art = {
  label: '할머니 오두막',
  imageUrl: A + '1778476961082-빨간모자-keyobj-cottage-1779169767891-w800.webp',
  ttsUrl: A + '1778476961082-tts-page3-1779940001449.mp3',
};

// 나무는 숲의 일부다 — 카드에 얹지 않고 바닥에 바로 선다
const TREE: Art = { label: '나무', imageUrl: '/images/puzzle/tree.webp', noCard: true };

const WOLF: Art = {
  label: '늑대',
  imageUrl: A + '1778476961082-빨간모자new-character-늑대-1778491644020.jpg',
  // 입 닫은 얼굴 — 이빨 드러낸 컷은 네 살에게 과하다
  crop: [0.56, 0.4, 0.155, 0.32],
  round: true,
};

type Data = (typeof ROAD_CHALLENGE_DATA)[number] & {
  doors?: readonly string[];
  wolf?: { x: number; y: number };
};

export const ROAD_CHALLENGES: Challenge[] = ROAD_CHALLENGE_DATA.map((raw, i) => {
  const d = raw as Data;
  const wolf = d.wolf;
  return {
    id: d.id,
    title: `${d.level} ${(i % 24) + 1}`,
    prompt: wolf
      ? '빨간모자와 늑대가 각각 다른 문으로 들어가게, 길을 두 개 만들어 주세요.'
      : '숲을 지나 할머니 오두막까지 길을 이어 주세요.',
    width: d.width,
    height: d.height,
    allowFlip: d.allowFlip,
    // 🔴 출발은 방향이 없다 — 어느 쪽에서 길이 닿아도 된다. 문이 있는 건 오두막뿐이다.
    start: { x: d.start.x, y: d.start.y, ...GIRL },
    goal: { x: d.goal.x, y: d.goal.y, port: d.goal.port, ...COTTAGE },
    ...(wolf ? { second: { x: wolf.x, y: wolf.y, ...WOLF } } : {}),
    ...(d.doors ? { doors: [...d.doors] as Challenge['doors'] } : {}),
    blocked: d.trees.map((t) => ({ x: t.x, y: t.y, ...TREE })),
    inventory: { ...d.inventory },
    book: BOOK,
  };
});

/** 늑대가 나오는 문제인가 — 화면에서 두 묶음으로 나눈다 */
export const ROAD_HAS_WOLF = ROAD_CHALLENGES.map((c) => Boolean(c.second));

export const ROAD_LEVELS = ROAD_CHALLENGE_DATA.map((d) => d.level);
/** 화면의 난이도 탭 순서 */
export const LEVEL_ORDER = ['첫걸음', '쉬움', '보통', '어려움'] as const;
