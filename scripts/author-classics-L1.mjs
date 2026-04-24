// 세계명작 L1 (3-4세, 8페이지) 나머지 6권 직접 저술.
// 파일럿 3권(커다란 순무/아기 돼지/빨간 모자) 외 L1이 필요한 책들.
//
// L1 원칙: 페이지당 1~2 문장, 반복 리프레인, 의성어·의태어, 공포 최소화.
//
// 실행: node scripts/author-classics-L1.mjs

const API = 'http://localhost:3500/api';

const BOOKS = [
  { bid: '1772510956605', title: '잭과 콩나무', original: 'Jack and the Beanstalk' },
  { bid: '1772181211472', title: '우당탕탕 염소 삼 형제', original: 'De tre bukkene Bruse' },
  { bid: '1772106564046', title: '생강빵 아이', original: 'The Gingerbread Boy' },
  { bid: '1772088321757', title: '금발 머리 소녀와 곰 세 마리', original: 'The Three Bears' },
  { bid: '1772086769057', title: '구둣방 할아버지와 꼬마 요정', original: 'Die Wichtelmänner' },
  { bid: '1772082243436', title: '개미와 베짱이', original: 'The Ant and the Grasshopper' },
];

const PAGES = {
  '1772510956605': [
    '잭과 엄마는 아주 가난했어요.\n엄마가 말했어요. "잭아, 소를 팔아 빵을 사 오렴."',
    '시장 길에서 할아버지를 만났어요.\n"소 대신 마법 콩을 줄까?"',
    '잭은 콩을 받고 집에 왔어요.\n엄마가 화가 나서 콩을 창밖으로 휙!',
    '다음 날 아침!\n콩나무가 쑥쑥 자라 하늘까지 닿았어요.',
    '잭은 콩나무를 타고 올라갔어요.\n영차 영차, 높이높이!',
    '구름 위에 거인의 집!\n잭은 금알 낳는 닭을 발견했어요.',
    '"쿵! 쿵! 쿵!" 거인이 쫓아왔어요.\n잭은 후다닥 내려왔어요.',
    '잭이 도끼로 콩나무를 콱!\n거인은 사라지고, 잭과 엄마는 행복해졌어요.',
  ],
  '1772181211472': [
    '염소 삼 형제가 살았어요.\n작은 염소, 중간 염소, 큰 염소.',
    '다리 건너에는 푸른 풀밭!\n다리 밑에는 무서운 트롤이 살았어요.',
    '작은 염소가 다다닥 건넜어요.\n"쿵! 누구냐?" "저예요! 큰 형이 더 맛있어요!"',
    '중간 염소가 또각또각 건넜어요.\n"쿵! 누구냐?" "저예요! 큰 형이 곧 와요!"',
    '트롤은 침을 흘리며 기다렸어요.\n"큰 염소를 잡아먹어야지!"',
    '큰 염소가 쿵쿵쿵 다리를 건넜어요.\n다리가 휘청휘청!',
    '트롤이 뛰어올랐지만, 큰 염소가 뿔로 콱!\n트롤은 멀리 날아가 버렸어요!',
    '삼 형제는 풀밭에서 쩝쩝.\n배부르게 먹었답니다.',
  ],
  '1772106564046': [
    '할머니가 생강빵 아이를 구웠어요.\n오븐에서 뿅!',
    '생강빵 아이가 펄쩍 뛰어나왔어요.\n"나 잡아 봐라!"',
    '할머니도 할아버지도 쫓아왔어요.\n"달려 달려, 못 잡아!"',
    '젖소도 말도 쫓아왔어요.\n생강빵 아이는 더 빨리, 더 빨리!',
    '앞에 큰 강이 나왔어요.\n"어떡하지?"',
    '여우가 말했어요.\n"내 등에 올라타렴, 건너게 해 줄게."',
    '강 한가운데서 여우가 꿀꺽!\n"아차, 속았다!"',
    '달콤한 말은 조심해야 해요.\n모르는 이를 함부로 따라가면 안 돼요.',
  ],
  '1772088321757': [
    '숲 속에 곰 세 마리가 살았어요.\n아빠 곰, 엄마 곰, 아기 곰.',
    '뜨거운 죽을 식히려고 산책을 나갔지요.',
    '금발 머리 소녀가 몰래 집에 들어왔어요.\n죽이 맛있어 보였어요.',
    '아빠 죽: 너무 뜨거워!\n엄마 죽: 너무 차가워!\n아기 죽: 딱 맞아!',
    '의자에 앉았어요.\n아기 곰 의자가 뚝 부러졌지요!',
    '침대에 누웠어요.\n아기 곰 침대가 딱 맞았어요.\n새근새근 잠들었지요.',
    '곰들이 돌아왔어요.\n"누가 내 죽을?" "누가 내 의자를?" "누가 내 침대에?"',
    '소녀는 깜짝 놀라 후다닥!\n남의 집은 허락 없이 들어가면 안 돼요.',
  ],
  '1772086769057': [
    '가난한 구둣방 할아버지가 살았어요.\n가죽 한 장이 전부였지요.',
    '아침에 일어나니 멋진 구두가 완성!\n"누가 만들었지?"',
    '구두가 잘 팔렸어요.\n할아버지는 가죽을 더 샀지요.',
    '다음 날도, 또 다음 날도 예쁜 구두가 뚝딱!',
    '밤에 몰래 숨어서 지켜봤어요.\n꼬마 요정들이 통통통!',
    '요정들은 헐벗고 추워 보였어요.\n할머니가 작은 옷을 지었지요.',
    '옷과 신발을 놓아 두었어요.\n요정들은 기뻐서 춤을 추었어요!',
    '"고마워요!"\n요정들은 떠나고, 구둣방은 평생 편안했답니다.',
  ],
  '1772082243436': [
    '여름이에요.\n개미는 부지런히 일했어요. 영차 영차!',
    '베짱이는 노래를 불렀어요.\n"개미야, 놀자!"',
    '"나는 겨울을 준비해야 해."\n개미는 음식을 모았어요.',
    '베짱이는 노래하며 놀았어요.\n뚜릇뚜릇 찌찌르르!',
    '가을이 왔어요.\n개미의 집엔 음식이 가득!',
    '눈이 펑펑 내렸어요.\n베짱이는 너무 추웠어요.',
    '베짱이가 개미 집 문을 똑똑!\n"배고파요..."',
    '개미는 따뜻한 수프를 나누어 주었어요.\n"내년엔 미리 준비하자!"',
  ],
};

const EDU = {
  '1772510956605': {
    moral: '용기와 지혜가 있으면 어려움을 이겨낼 수 있어요. 욕심은 멈출 줄 알아야 해요.',
    vocabulary: [
      { word: '콩나무', korean: '콩나무', partOfSpeech: '명사' },
      { word: '거인', korean: '거인', partOfSpeech: '명사' },
      { word: '도끼', korean: '도끼', partOfSpeech: '명사' },
      { word: '영차', korean: '영차', partOfSpeech: '감탄사' },
    ],
  },
  '1772181211472': {
    moral: '형제는 서로 도와주어야 해요. 두려워도 용기를 내면 이겨낼 수 있어요.',
    vocabulary: [
      { word: '다리', korean: '다리', partOfSpeech: '명사' },
      { word: '트롤', korean: '트롤', partOfSpeech: '명사' },
      { word: '풀밭', korean: '풀밭', partOfSpeech: '명사' },
      { word: '뿔', korean: '뿔', partOfSpeech: '명사' },
    ],
  },
  '1772106564046': {
    moral: '낯선 사람의 달콤한 말을 조심해요. 혼자 따라가지 마세요.',
    vocabulary: [
      { word: '생강빵', korean: '생강빵', partOfSpeech: '명사' },
      { word: '오븐', korean: '오븐', partOfSpeech: '명사' },
      { word: '여우', korean: '여우', partOfSpeech: '명사' },
      { word: '달리다', korean: '달리다', partOfSpeech: '동사' },
    ],
  },
  '1772088321757': {
    moral: '남의 물건에 함부로 손대면 안 돼요. 허락을 먼저 구하세요.',
    vocabulary: [
      { word: '죽', korean: '죽', partOfSpeech: '명사' },
      { word: '의자', korean: '의자', partOfSpeech: '명사' },
      { word: '침대', korean: '침대', partOfSpeech: '명사' },
      { word: '곰', korean: '곰', partOfSpeech: '명사' },
    ],
  },
  '1772086769057': {
    moral: '받은 은혜는 잊지 말고 갚아요. 고마운 마음을 전하는 것이 중요해요.',
    vocabulary: [
      { word: '구두', korean: '구두', partOfSpeech: '명사' },
      { word: '요정', korean: '요정', partOfSpeech: '명사' },
      { word: '가죽', korean: '가죽', partOfSpeech: '명사' },
      { word: '고맙다', korean: '고맙다', partOfSpeech: '형용사' },
    ],
  },
  '1772082243436': {
    moral: '미리 준비하는 것이 중요해요. 어려운 친구는 도와주어야 해요.',
    vocabulary: [
      { word: '개미', korean: '개미', partOfSpeech: '명사' },
      { word: '베짱이', korean: '베짱이', partOfSpeech: '명사' },
      { word: '겨울', korean: '겨울', partOfSpeech: '명사' },
      { word: '준비', korean: '준비', partOfSpeech: '명사' },
    ],
  },
};

function buildStorybook(book, level, texts) {
  const id = `${book.bid}__${level}`;
  const edu = EDU[book.bid] ?? { moral: '', vocabulary: [] };
  return {
    id,
    title: `${book.title} (${level})`,
    type: 'storybook',
    readingLevel: level,
    targetAge: '3-4',
    artStyle: 'watercolor',
    category: '세계 명작',
    folder: `세계 명작 (${level})`,
    isPublic: false,
    createdAt: new Date().toISOString(),
    characters: [],
    coverPrompt: '',
    coverAspectRatio: '16:9',
    pages: texts.map((text, i) => ({
      pageNumber: i + 1,
      text,
      scene_description: '',
      scene_description_en: '',
      scene_structure: {
        characters: '',
        background: '',
        atmosphere: '',
        characters_en: '',
        background_en: '',
        atmosphere_en: '',
      },
    })),
    key_objects: [],
    educational_content: {
      vocabulary: edu.vocabulary,
      quiz: [],
      learning_objectives: [],
      moral_lesson: edu.moral,
    },
    coverImages: [],
    keyObjectImages: [],
    games: [],
    blogPosts: [],
    cardNewsProjects: [],
    audiobookProjects: [],
    referenceContent: `레벨: ${level} (3-4세) · ${texts.length}페이지 · 원전 "${book.original}" 기반 직접 저술`,
  };
}

async function apiJson(path, init) {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`); }
  if (!res.ok || json.success === false) throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 300)}`);
  return json.data;
}

async function main() {
  console.log('━━ 세계명작 L1 (3-4세) 6권 직접 저술 ━━\n');
  const results = [];
  for (const book of BOOKS) {
    const texts = PAGES[book.bid];
    try {
      const sb = buildStorybook(book, 'L1', texts);
      const saved = await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: sb }),
      });
      const chars = texts.reduce((s, t) => s + t.replace(/\s/g, '').length, 0);
      console.log(`✓ ${book.title} L1: 8p · ${chars}자 · ${saved.id}`);
      results.push({ title: book.title, chars, ok: true });
    } catch (err) {
      console.error(`✗ ${book.title} L1: ${err.message}`);
      results.push({ title: book.title, ok: false, error: err.message });
    }
  }
  const ok = results.filter(r => r.ok);
  console.log(`\n성공 ${ok.length}/${results.length}`);
  process.exit(results.some(r => !r.ok) ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
