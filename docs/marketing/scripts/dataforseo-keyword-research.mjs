#!/usr/bin/env node
// DataForSEO Google Ads search volume — KR + EN content-unit keywords
// Endpoint: /v3/keywords_data/google_ads/search_volume/live
// Output: data/dataforseo-kr.json, data/dataforseo-en.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KR_SEEDS as KR_FROM_MODULE, EN_SEEDS as EN_FROM_MODULE } from './content-seeds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const LOGIN = process.env.DATAFORSEO_LOGIN;
const PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!LOGIN || !PASSWORD) {
  console.error('환경변수 누락: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD');
  process.exit(1);
}

const ENDPOINT = 'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live';
const BATCH_SIZE = 700;

// 시드는 content-seeds.mjs 에서 공유 (단일 진실원천)
const KR_SEEDS = KR_FROM_MODULE;
const EN_SEEDS = EN_FROM_MODULE;

// 아래 기존 inline 시드 정의는 호환성을 위해 남기되 사용하지 않음
const _UNUSED_KR_SEEDS = [
  // A. 명작/전래/창작 동화
  '백설공주', '신데렐라', '인어공주', '라푼젤', '잠자는 숲속의 공주',
  '미녀와 야수', '아기돼지 삼형제', '빨간모자', '미운 오리 새끼', '피노키오',
  '토끼와 거북이', '흥부놀부', '콩쥐팥쥐', '해님달님', '호랑이와 곶감',
  '알라딘', '알리바바', '신밧드', '어린왕자', '곰돌이 푸',
  '이상한 나라의 앨리스', '피터팬', '오즈의 마법사', '백조의 호수',
  '명작동화', '전래동화', '세계명작동화', '잠자기 전 동화', '인성동화', '생활동화', '창작동화',

  // B. 공룡
  '공룡', '공룡이름', '공룡 종류', '티라노사우루스', '브라키오사우루스',
  '트리케라톱스', '스테고사우루스', '벨로키랍토르', '안킬로사우루스', '프테라노돈',
  '공룡책', '공룡 그림책', '공룡도감', '공룡 만화', '공룡 영어',

  // C. 동물 (자연관찰)
  '동물 이름', '동물도감', '동물 그림책', '동물 영어',
  '사자', '호랑이', '코끼리', '기린', '판다', '북극곰', '펭귄',
  '강아지', '고양이', '토끼', '햄스터', '거북이',
  '늑대', '여우', '곰', '사슴', '다람쥐', '코알라', '캥거루',
  '원숭이', '고릴라', '침팬지',
  '상어', '고래', '돌고래', '문어', '해마',
  '독수리', '부엉이', '앵무새', '공작',
  '농장동물', '바다동물', '야생동물', '자연관찰',

  // D. 곤충
  '곤충', '곤충이름', '곤충도감', '곤충책', '곤충 관찰',
  '나비', '개미', '사슴벌레', '장수풍뎅이', '무당벌레',
  '잠자리', '매미', '거미', '메뚜기', '귀뚜라미', '반딧불이', '벌',

  // E. 탈것
  '자동차', '기차', '비행기', '배', '로켓',
  '소방차', '구급차', '경찰차', '포크레인', '굴착기',
  '덤프트럭', '버스', '지하철', '잠수함', '헬리콥터',
  '탈것 그림책', '자동차 책',

  // F. 우주/자연 현상
  '우주', '태양계', '행성', '달', '별', '별자리',
  '블랙홀', '우주비행사', '화성', '목성', '토성',
  '화산', '지진', '무지개', '구름', '바다', '날씨',

  // G. 직업
  '소방관', '경찰관', '의사', '간호사', '요리사',
  '우주비행사', '동물원 사육사', '수의사', '농부', '선생님',
  '직업 그림책', '직업 종류',

  // H. 위인/인물 동화
  '세종대왕', '이순신', '안중근', '유관순', '신사임당',
  '헬렌 켈러', '에디슨', '라이트형제', '마더 테레사', '간디',
  '슈바이처', '나이팅게일', '뉴턴', '아인슈타인', '위인 동화',

  // I. 명절/계절
  '추석', '설날', '한가위', '단오', '동지', '크리스마스', '할로윈',
  '봄', '여름', '가을', '겨울', '눈 오는 날',

  // J. 식물/먹거리
  '꽃 이름', '나무 이름', '채소 이름', '과일 이름',
  '해바라기', '튤립', '장미', '민들레',

  // K. 신체/건강/감정 (SEL)
  '우리 몸', '치아', '뼈', '소화', '잠',
  '감정 동화', '화내는 아이', '슬픔', '두려움',

  // L. 알파벳/숫자/색깔 (기초 학습)
  '알파벳', '숫자', '색깔', '도형', '시계 보는 법',

  // M. 페인포인트형 일상 동화
  '화장실 가기', '양치 동화', '동생 생기기', '친구 사귀기',
  '편식 동화', '유치원 적응', '잠 안 자는 아이', '거짓말 동화',
];

// 아래 기존 inline EN 시드도 호환성 보존용
const _UNUSED_EN_SEEDS = [
  // A. Fairy tales / classic stories
  'snow white', 'cinderella', 'sleeping beauty', 'little mermaid', 'rapunzel',
  'beauty and the beast', 'three little pigs', 'little red riding hood',
  'ugly duckling', 'pinocchio', 'tortoise and the hare', 'goldilocks and the three bears',
  'three billy goats gruff', 'jack and the beanstalk', 'rumpelstiltskin',
  'hansel and gretel', 'rapunzel story', 'frog prince', 'thumbelina',
  'aladdin', 'ali baba', 'sinbad', 'the little prince', 'winnie the pooh',
  'alice in wonderland', 'peter pan', 'wizard of oz', 'jungle book',
  'fairy tales for kids', 'classic fairy tales', 'bedtime stories for kids',
  'short bedtime stories', 'moral stories for kids',

  // B. Dinosaurs
  'dinosaur', 'dinosaur names', 'dinosaur types', 't rex', 'tyrannosaurus rex',
  'triceratops', 'brachiosaurus', 'stegosaurus', 'velociraptor', 'ankylosaurus',
  'pterodactyl', 'spinosaurus', 'allosaurus', 'diplodocus',
  'dinosaur facts for kids', 'dinosaur book', 'dinosaurs for kids', 'dinosaur coloring',

  // C. Animals
  'animal names', 'farm animals', 'zoo animals', 'ocean animals',
  'wild animals', 'animals for kids', 'jungle animals', 'arctic animals',
  'lion', 'tiger', 'elephant', 'giraffe', 'panda', 'polar bear', 'penguin',
  'dog', 'cat', 'rabbit', 'hamster', 'turtle',
  'wolf', 'fox', 'bear', 'deer', 'squirrel', 'koala', 'kangaroo',
  'monkey', 'gorilla', 'chimpanzee',
  'shark', 'whale', 'dolphin', 'octopus', 'seahorse',
  'eagle', 'owl', 'parrot', 'peacock',

  // D. Bugs / insects
  'bugs for kids', 'insects for kids', 'butterfly life cycle',
  'ladybug', 'ant', 'bee', 'caterpillar', 'dragonfly', 'spider',
  'grasshopper', 'firefly', 'beetle',

  // E. Vehicles
  'cars for kids', 'trucks for kids', 'fire truck', 'ambulance', 'police car',
  'excavator', 'monster truck', 'dump truck', 'tractor',
  'airplane', 'helicopter', 'rocket', 'train for kids', 'bus',
  'submarine', 'boat for kids',

  // F. Space / nature
  'space for kids', 'solar system', 'planets for kids', 'moon for kids',
  'stars for kids', 'constellations',
  'mars for kids', 'jupiter for kids', 'saturn for kids', 'black hole for kids',
  'astronaut for kids',
  'volcano for kids', 'earthquake for kids', 'rainbow for kids',
  'weather for kids', 'ocean for kids', 'clouds for kids',

  // G. Jobs / community helpers
  'firefighter', 'police officer', 'doctor for kids', 'nurse for kids',
  'chef for kids', 'astronaut', 'veterinarian', 'farmer for kids',
  'community helpers', 'jobs for kids',

  // H. Biographies / heroes
  'helen keller for kids', 'thomas edison for kids', 'abraham lincoln for kids',
  'martin luther king jr for kids', 'rosa parks for kids', 'einstein for kids',
  'isaac newton for kids', 'mother teresa for kids', 'gandhi for kids',
  'biography for kids',

  // I. Holidays / seasons
  'christmas stories for kids', 'halloween stories for kids',
  'thanksgiving for kids', 'easter stories', 'valentine for kids',
  'spring for kids', 'summer for kids', 'fall for kids', 'winter for kids',

  // J. Plants / food
  'flower names', 'tree names for kids', 'vegetables for kids', 'fruits for kids',
  'sunflower', 'tulip', 'rose for kids', 'dandelion',

  // K. Body / health / emotions (SEL)
  'human body for kids', 'teeth for kids', 'bones for kids',
  'emotions for kids', 'feelings for kids', 'mindfulness for kids',

  // L. Foundational (alphabet/numbers/colors/shapes)
  'alphabet for kids', 'abc for kids', 'numbers for kids', 'counting for kids',
  'colors for kids', 'shapes for kids', 'telling time for kids',

  // M. Pain-point / everyday
  'potty training story', 'first day of school book', 'new baby brother book',
  'sharing for kids', 'kindergarten readiness', 'sleep stories for kids',
];

async function fetchBatch(keywords, languageCode, locationCode) {
  const auth = Buffer.from(`${LOGIN}:${PASSWORD}`).toString('base64');
  const body = JSON.stringify([
    { keywords, language_code: languageCode, location_code: locationCode },
  ]);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) {
    console.error(`[ERROR] HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
    return [];
  }
  const json = await res.json();
  const task = json.tasks?.[0];
  if (task?.status_code && task.status_code >= 40000) {
    console.error(`[ERROR] task status_code=${task.status_code} ${task.status_message ?? ''}`);
    return [];
  }
  return task?.result ?? [];
}

function normalize(items) {
  return items
    .map((it) => ({
      keyword: it.keyword,
      searchVolume: it.search_volume ?? 0,
      competition: it.competition ?? null,
      competitionIndex: it.competition_index ?? null,
      cpc: it.cpc ?? 0,
      lowTopBid: it.low_top_of_page_bid ?? null,
      highTopBid: it.high_top_of_page_bid ?? null,
      monthlyTrend: (it.monthly_searches ?? []).map((m) => ({
        year: m.year,
        month: m.month,
        volume: m.search_volume,
      })),
    }))
    .sort((a, b) => b.searchVolume - a.searchVolume);
}

async function run(label, seeds, languageCode, locationCode, outFile, currency) {
  console.log(`\n=== ${label} (lang=${languageCode}, location=${locationCode}, ${seeds.length} seeds) ===`);
  const cleaned = [...new Set(seeds.map((k) => k.trim()).filter(Boolean))];
  const all = [];
  for (let i = 0; i < cleaned.length; i += BATCH_SIZE) {
    const batch = cleaned.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cleaned.length / BATCH_SIZE)}: ${batch.length} keywords`);
    const items = await fetchBatch(batch, languageCode, locationCode);
    console.log(`  → ${items.length} results`);
    all.push(...items);
  }
  const normalized = normalize(all);

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const outPath = path.join(DATA_DIR, outFile);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        meta: {
          source: 'DataForSEO Google Ads search_volume/live',
          languageCode,
          locationCode,
          currency,
          fetchedAt: new Date().toISOString(),
          seedCount: cleaned.length,
          resultCount: normalized.length,
        },
        keywords: normalized,
      },
      null,
      2,
    ),
    'utf-8',
  );
  console.log(`✅ Saved ${normalized.length} keywords → ${path.relative(process.cwd(), outPath)}`);

  console.log(`\nTOP 20 by search volume (${label}):`);
  console.log('rank | keyword | vol | comp | cpc');
  normalized.slice(0, 20).forEach((it, i) => {
    const cpc = it.cpc != null ? it.cpc.toFixed(2) : 'NA';
    console.log(
      `${String(i + 1).padStart(2)} | ${(it.keyword || '').padEnd(36)} | ${String(it.searchVolume).padStart(7)} | ${(it.competition ?? 'NA').padEnd(8)} | ${cpc}`,
    );
  });
  return normalized;
}

async function main() {
  console.log('========================================');
  console.log('DataForSEO 콘텐츠 단위 키워드 리서치');
  console.log('========================================');

  await run('Korean (KR)', KR_SEEDS, 'ko', 2410, 'dataforseo-kr.json', 'KRW');
  await run('English (US)', EN_SEEDS, 'en', 2840, 'dataforseo-en.json', 'USD');

  console.log('\n========================================');
  console.log('완료. 파일: data/dataforseo-kr.json, data/dataforseo-en.json');
  console.log('========================================');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
