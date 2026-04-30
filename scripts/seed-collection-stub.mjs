// stub 카탈로그 8장 (8 카테고리 × 1장) seed
// 콘텐츠(동화 4종) 완성 후 자동 추출 스크립트로 교체 예정.
// strategy-samples 의 PNG 재활용 — 실제 카드 자산은 후속.
//
// 실행 (서버 dev 가 도는 상태에서):
//   node scripts/seed-collection-stub.mjs
//   node scripts/seed-collection-stub.mjs --base http://localhost:3500

const args = process.argv.slice(2);
function getArg(name, def) {
  const idx = args.findIndex((a) => a === name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return def;
}

const BASE = getArg('--base', 'http://localhost:3500');
const now = new Date().toISOString();

const STUB_ITEMS = [
  {
    id: 'card-classic-jack-beanstalk',
    category: 'classic',
    nameKo: '잭과 콩나무',
    nameEn: 'Jack and the Beanstalk',
    imageUrl: '/strategy-samples/card-01-classic.png',
    sourceBookIds: [],
    description: '거인을 만난 용감한 잭의 모험',
    facts: ['주인공: 잭과 엄마', '핵심 단어: 콩, 거인, 황금알, 거위', '교훈: 용기와 지혜'],
    rarity: 'common',
    createdAt: now,
  },
  {
    id: 'card-folktale-magpie-tiger',
    category: 'folktale',
    nameKo: '까치호랑이',
    imageUrl: '/strategy-samples/card-08-folktale.png',
    sourceBookIds: [],
    description: '한국 전래의 정겨운 호랑이 이야기',
    facts: ['배경: 옛날 한국', '핵심 단어: 호랑이, 까치, 곶감'],
    rarity: 'common',
    createdAt: now,
  },
  {
    id: 'card-animal-baby-tiger',
    category: 'animal',
    nameKo: '아기 호랑이',
    nameEn: 'Baby Tiger',
    imageUrl: '/strategy-samples/card-03-animal.png',
    sourceBookIds: [],
    description: '동물의 왕, 호랑이의 새끼',
    facts: ['서식지: 아시아 숲', '먹이: 사슴, 멧돼지', '특징: 줄무늬, 야생'],
    keyWord: 'tiger',
    rarity: 'common',
    createdAt: now,
  },
  {
    id: 'card-dinosaur-trex',
    category: 'dinosaur',
    nameKo: '티라노사우루스',
    nameEn: 'T-Rex',
    imageUrl: '/strategy-samples/card-02-dinosaur.png',
    sourceBookIds: [],
    description: '백악기 최강의 육식 공룡',
    facts: ['시대: 약 6800만년 전', '크기: 12m', '먹이: 다른 공룡', '특징: 강한 턱'],
    keyWord: 'dinosaur',
    rarity: 'common',
    createdAt: now,
  },
  {
    id: 'card-plant-sunflower',
    category: 'plant',
    nameKo: '해바라기',
    nameEn: 'Sunflower',
    imageUrl: '/strategy-samples/card-04-plant.png',
    sourceBookIds: [],
    description: '태양을 따라 도는 노란 꽃',
    facts: ['계절: 여름', '특징: 해를 따라 움직임', '높이: 최대 3m'],
    keyWord: 'flower',
    rarity: 'common',
    createdAt: now,
  },
  {
    id: 'card-ocean-humpback-whale',
    category: 'ocean',
    nameKo: '혹등고래',
    nameEn: 'Humpback Whale',
    imageUrl: '/strategy-samples/card-05-ocean.png',
    sourceBookIds: [],
    description: '바다의 노래하는 거인',
    facts: ['크기: 12-16m', '특징: 노래하는 고래', '서식지: 전 세계 바다'],
    keyWord: 'whale',
    rarity: 'common',
    createdAt: now,
  },
  {
    id: 'card-space-earth-moon',
    category: 'space',
    nameKo: '지구와 달',
    nameEn: 'Earth and Moon',
    imageUrl: '/strategy-samples/card-06-space.png',
    sourceBookIds: [],
    description: '우리가 사는 푸른 별과 그 친구',
    facts: ['지구 둘레: 약 4만km', '달까지 거리: 약 38만km', '달은 지구의 위성'],
    keyWord: 'earth',
    rarity: 'common',
    createdAt: now,
  },
  {
    id: 'card-life-brushing-teeth',
    category: 'life',
    nameKo: '양치하기',
    imageUrl: '/strategy-samples/card-07-life.png',
    sourceBookIds: [],
    description: '깨끗한 치아를 위한 매일의 습관',
    facts: ['하루 2-3번', '식사 후 30분 이내', '3분 이상 천천히'],
    rarity: 'common',
    createdAt: now,
  },
];

async function main() {
  console.log(`[seed-collection] base=${BASE}, items=${STUB_ITEMS.length}`);
  const res = await fetch(`${BASE}/api/collection/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: STUB_ITEMS }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  console.log('[seed-collection] result:', json);

  // 검증: 카탈로그 조회
  const verifyRes = await fetch(`${BASE}/api/collection/catalog`);
  const verify = await verifyRes.json();
  console.log(`[seed-collection] catalog now has ${verify.data?.items?.length ?? 0} items`);
}

main().catch((err) => {
  console.error('[seed-collection] failed:', err);
  process.exit(1);
});
