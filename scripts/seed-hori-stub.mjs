// 호리 꾸미기 stub 카탈로그 seed
// baseline: 이모지 preview. 후속 실제 이미지 자산으로 점진 교체.
//
// 실행: node scripts/seed-hori-stub.mjs

const args = process.argv.slice(2);
function getArg(name, def) {
  const idx = args.findIndex((a) => a === name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return def;
}

const BASE = getArg('--base', 'http://localhost:3500');
const now = new Date().toISOString();

const STUB_ITEMS = [
  // 옷 (100★)
  { id: 'outfit-tshirt-coral', slot: 'outfit', nameKo: '코랄 티셔츠', preview: '👕', starsCost: 100, rarity: 'common', description: '편안한 일상복', createdAt: now },
  { id: 'outfit-overall-blue', slot: 'outfit', nameKo: '파란 멜빵', preview: '🥼', starsCost: 100, rarity: 'common', description: '활동적인 멜빵바지', createdAt: now },
  { id: 'outfit-suit-bear', slot: 'outfit', nameKo: '곰 잠옷', preview: '🐻', starsCost: 100, rarity: 'common', description: '포근한 동물 잠옷', createdAt: now },
  // 액세서리 (300★)
  { id: 'accessory-hat-top', slot: 'accessory', nameKo: '신사 모자', preview: '🎩', starsCost: 300, rarity: 'common', description: '멋진 마술사 모자', createdAt: now },
  { id: 'accessory-glasses', slot: 'accessory', nameKo: '동그란 안경', preview: '👓', starsCost: 300, rarity: 'common', description: '똑똑한 책벌레 안경', createdAt: now },
  { id: 'accessory-bowtie', slot: 'accessory', nameKo: '리본 나비넥타이', preview: '🎀', starsCost: 300, rarity: 'common', description: '특별한 날 액세서리', createdAt: now },
  // 배경 (500★)
  { id: 'background-house', slot: 'background', nameKo: '아늑한 집', preview: '🏠', starsCost: 500, rarity: 'common', description: '따뜻한 호리네 집', createdAt: now },
  { id: 'background-forest', slot: 'background', nameKo: '신비한 숲', preview: '🌲', starsCost: 500, rarity: 'common', description: '모험이 가득한 숲', createdAt: now },
  { id: 'background-ocean', slot: 'background', nameKo: '푸른 바다', preview: '🌊', starsCost: 500, rarity: 'common', description: '바다 깊숙한 모험', createdAt: now },
  { id: 'background-space', slot: 'background', nameKo: '별이 빛나는 우주', preview: '🌌', starsCost: 500, rarity: 'common', description: '우주 끝까지 여행', createdAt: now },
  // 표정 (100★)
  { id: 'mood-happy', slot: 'mood', nameKo: '함박웃음', preview: '😄', starsCost: 100, rarity: 'common', description: '기분 좋을 때', createdAt: now },
  { id: 'mood-cool', slot: 'mood', nameKo: '쿨한 표정', preview: '😎', starsCost: 100, rarity: 'common', description: '멋있게', createdAt: now },
  // 시즌 (2000★)
  { id: 'season-santa-2026', slot: 'season', nameKo: '산타 호리', preview: '🎅', starsCost: 2000, rarity: 'seasonal', unlockSeason: 'winter-2026', description: '겨울 한정 코스튬', createdAt: now },
  { id: 'season-pumpkin-2026', slot: 'season', nameKo: '호박 호리', preview: '🎃', starsCost: 2000, rarity: 'seasonal', unlockSeason: 'autumn-2026', description: '가을 한정 코스튬', createdAt: now },
];

async function main() {
  console.log(`[seed-hori] base=${BASE}, items=${STUB_ITEMS.length}`);
  const res = await fetch(`${BASE}/api/hori/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: STUB_ITEMS }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  console.log('[seed-hori] result:', json);

  const verifyRes = await fetch(`${BASE}/api/hori/catalog`);
  const verify = await verifyRes.json();
  console.log(`[seed-hori] catalog now has ${verify.data?.items?.length ?? 0} items`);
}

main().catch((err) => {
  console.error('[seed-hori] failed:', err);
  process.exit(1);
});
