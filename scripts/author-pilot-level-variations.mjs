// 세계명작 3권 × L1+L2 = 6 variations 직접 저술 (Gemini 없이 Claude가 직접).
//
// 대상: 반복·단순 구조로 L1/L2에 가장 적합한 3편 — 원전 기반 각색.
//   1. 커다란 순무 (Репка, Alexei Tolstoy 1940, 러시아민담)
//   2. 아기 돼지 삼형제 (The Three Little Pigs, Joseph Jacobs 1890, 영국민담)
//   3. 빨간 모자 (Le Petit Chaperon rouge, Perrault 1697 / Grimm KHM 26)
//
// 변환 규칙 (Variation ID):
//   launch 레벨(L3)은 bid 그대로, 나머지는 `${bid}__${level}`.
//
// L1 (3-4세): 8 페이지, 1~2 문장, 반복 리프레인·의성어 중심.
// L2 (4-5세): 12 페이지, 2~3 문장, 간단한 대화·감정 묘사 추가.
//
// 실행: node scripts/author-pilot-level-variations.mjs
// 서버 localhost:3500 필요.

const API = 'http://localhost:3500/api';

// ───────────────────────────────────────────────────────────────────
// 책 메타
// ───────────────────────────────────────────────────────────────────

const BOOKS = [
  {
    bid: '1772197611601',
    title: '커다란 순무',
    original: 'Репка (Repka)',
    category: '세계 명작',
    artStyle: 'watercolor',
  },
  {
    bid: '1772108045716',
    title: '아기 돼지 삼형제',
    original: 'The Three Little Pigs',
    category: '세계 명작',
    artStyle: 'watercolor',
  },
  {
    bid: '1772106096276',
    title: '빨간 모자',
    original: 'Le Petit Chaperon rouge',
    category: '세계 명작',
    artStyle: 'watercolor',
  },
];

// ───────────────────────────────────────────────────────────────────
// L1 콘텐츠 (8 페이지, 3~4세)
// ───────────────────────────────────────────────────────────────────

const L1 = {
  '1772197611601': [
    '할아버지가 순무 씨앗을 심었어요.\n"쑥쑥 자라라, 순무야!"',
    '따뜻한 햇살과 촉촉한 비.\n순무가 아주 아주 커졌어요!',
    '할아버지가 영차 영차 당겼어요.\n하지만 순무는 꼼짝도 안 했어요.',
    '할머니도 왔어요.\n할머니가 할아버지를, 할아버지가 순무를.\n영차 영차! 그래도 안 돼요.',
    '손녀도 왔어요.\n손녀가 할머니를, 할머니가 할아버지를.\n영차 영차! 그래도 안 돼요.',
    '강아지도, 고양이도 왔어요.\n영차 영차! 그래도 꼼짝도 안 했어요.',
    '꼬마 생쥐가 쪼르르 달려왔어요.\n고양이 꼬리를 꼭 붙잡고 영차 영차!',
    '"쑥!"\n순무가 쏙 빠졌어요.\n모두 함께 웃었어요. "우리가 해냈어요!"',
  ],
  '1772108045716': [
    '돼지 삼형제가 살았어요.\n첫째, 둘째, 셋째.',
    '첫째는 지푸라기로 집을 지었어요.\n"뚝딱, 다 지었다!"',
    '둘째는 나뭇가지로 집을 지었어요.\n"이 정도면 됐지!"',
    '셋째는 벽돌로 튼튼하게 지었어요.\n"천천히, 튼튼하게!"',
    '늑대가 나타났어요!\n후~ 후~ 후!\n지푸라기 집이 와르르!',
    '나뭇가지 집도 후! 후!\n와르르 무너졌어요.',
    '형들은 셋째 집으로 도망쳤어요.\n후! 후! 후! 벽돌집은 꿈쩍도 안 했어요.',
    '늑대는 달아났어요.\n삼형제는 꼭 껴안고 활짝 웃었답니다.',
  ],
  '1772106096276': [
    '빨간 모자를 쓴 아이가 있었어요.\n모두 "빨간 모자"라고 불렀어요.',
    '엄마가 말했어요.\n"할머니 댁에 빵을 가져다 드리렴."',
    '빨간 모자는 숲길을 걸었어요.\n"할머니, 기다리세요!"',
    '숲에서 늑대를 만났어요.\n"어디 가니?" "할머니 댁에요!"',
    '늑대가 먼저 할머니 댁으로 달려갔어요.\n그리고 할머니인 척 누웠어요.',
    '빨간 모자가 도착했어요.\n"할머니, 눈이 왜 이렇게 커요?"\n"너를 잘 보려고 그렇단다."',
    '"할머니, 이가 왜 이렇게 커요?"\n"너를 꿀꺽 삼키려고 그렇단다!"',
    '사냥꾼이 뛰어 들어왔어요.\n늑대는 달아나고, 빨간 모자와 할머니는 꼭 껴안았어요.',
  ],
};

// ───────────────────────────────────────────────────────────────────
// L2 콘텐츠 (12 페이지, 4~5세)
// ───────────────────────────────────────────────────────────────────

const L2 = {
  '1772197611601': [
    '어느 봄날, 할아버지가 뒷밭에 순무 씨앗을 심었어요.\n"쑥쑥 자라서 커다란 순무가 되어라!"',
    '햇살이 따뜻하고 비가 촉촉이 내렸어요.\n순무는 하루가 다르게 쑥쑥 자랐지요.',
    '어느 날 아침, 할아버지가 밭에 나가 보고 깜짝 놀랐어요.\n"세상에! 내 몸집보다 훨씬 커졌구나!"',
    '할아버지는 순무 잎을 꼭 붙잡고 영차 영차 당겼어요.\n하지만 순무는 꼼짝도 하지 않았어요.',
    '할아버지가 할머니를 불렀어요.\n"여보, 이리 와서 좀 도와주구려!"\n할머니는 할아버지 허리를 붙잡고 영차 영차.',
    '그래도 순무는 꼼짝도 안 했어요.\n할머니가 손녀딸을 불렀지요.\n"얘야, 좀 도와주렴!"',
    '손녀는 할머니 치마를 붙잡고, 할머니는 할아버지를, 할아버지는 순무를.\n영차 영차! 끙끙! 그래도 안 돼요.',
    '손녀가 강아지 멍멍이를 불렀어요.\n멍멍이도 손녀 허리를 붙잡고 영차 영차 당겼지요.',
    '강아지가 고양이 야옹이를 불렀어요.\n야옹이는 강아지 꼬리를 살며시 붙잡고 영차 영차.\n그래도 순무는 꿈쩍도 안 했어요.',
    '그때 꼬마 생쥐가 쪼르르 달려왔어요.\n"저도 도와드릴게요!"\n생쥐는 고양이 꼬리 끝을 꼭 붙잡았어요.',
    '모두가 한마음이 되어 영차! 영차! 영차!\n"쑥!" 드디어 커다란 순무가 쏙 뽑혔어요!',
    '할아버지, 할머니, 손녀, 강아지, 고양이, 그리고 작은 생쥐까지.\n모두 둘러앉아 달콤한 순무 국을 나누어 먹었답니다.',
  ],
  '1772108045716': [
    '옛날 옛적에 돼지 삼형제가 살았어요.\n어느 날 엄마 돼지가 말했어요.\n"이제 너희도 다 컸으니, 각자 집을 짓고 살아야겠구나."',
    '삼형제는 집 지을 재료를 찾아 길을 떠났어요.\n넓은 들판에는 여러 재료가 가득했지요.',
    '첫째 돼지는 지푸라기 더미를 발견했어요.\n"이걸로 금방 집을 지을 수 있겠다!"\n지푸라기 집은 한나절 만에 뚝딱 완성되었어요.',
    '둘째 돼지는 나뭇가지를 주웠어요.\n"지푸라기보다는 튼튼하겠지."\n나뭇가지 집도 하루 만에 완성되었지요.',
    '셋째 돼지는 벽돌을 한 장 한 장 날랐어요.\n"천천히 해야 튼튼한 집이 되는 거야."\n벽돌집을 짓는 데는 며칠이 걸렸어요.',
    '그때 배고픈 늑대가 나타났어요.\n지푸라기 집 앞에서 숨을 크게 들이마셨지요.\n"후~!"',
    '바람 한 번에 지푸라기 집이 와르르 무너졌어요.\n첫째 돼지는 깜짝 놀라 둘째 집으로 달아났어요.',
    '늑대는 나뭇가지 집도 후! 후! 하고 불었어요.\n나뭇가지가 뿔뿔이 흩어지고 말았지요.',
    '첫째와 둘째는 허겁지겁 셋째 집으로 뛰어갔어요.\n"셋째야, 문 열어 줘! 늑대가 쫓아와!"',
    '셋째는 얼른 문을 열어 주고 단단히 잠갔어요.\n늑대가 도착해서 후! 후! 후! 불었지만, 벽돌집은 꿈쩍도 하지 않았어요.',
    '화가 난 늑대는 굴뚝으로 들어가려 했어요.\n하지만 셋째가 뜨거운 물을 끓여 두었지요.\n"앗, 뜨거!" 늑대는 꽁지 빠지게 달아났어요.',
    '그날부터 돼지 삼형제는 벽돌집에서 사이좋게 살았어요.\n"역시 튼튼한 집이 최고야!"\n셋째가 웃으며 말했어요.',
  ],
  '1772106096276': [
    '숲속 마을에 귀여운 여자아이가 살았어요.\n빨간 두건을 늘 쓰고 다녀서 모두 "빨간 모자"라고 불렀지요.',
    '어느 날 엄마가 말했어요.\n"할머니께서 편찮으시단다. 이 빵과 우유를 가져다 드리고 오렴."',
    '"네, 엄마!"\n빨간 모자는 바구니를 들고 씩씩하게 집을 나섰어요.\n"숲에서는 한눈팔면 안 돼. 곧장 다녀오렴."',
    '숲속 오솔길에는 꽃들이 활짝 피어 있었어요.\n빨간 모자는 꽃향기를 맡으며 천천히 걸었지요.',
    '그때 커다란 늑대가 슬그머니 다가왔어요.\n"빨간 모자야, 어디 가니?"\n늑대는 이빨을 감추고 다정한 척 물었어요.',
    '"할머니 댁에 가요. 편찮으셔서 빵을 가져다 드리려고요."\n빨간 모자는 엄마의 당부를 깜빡 잊고 다 말해 버렸어요.',
    '늑대는 지름길로 먼저 할머니 댁에 도착했어요.\n꿀꺽! 할머니를 한입에 삼키고는 할머니 옷을 입고 침대에 누웠지요.',
    '한참 뒤 빨간 모자가 도착했어요.\n"할머니, 저 왔어요!"\n방 안이 어둑해서 잘 보이지 않았어요.',
    '"할머니, 귀가 왜 이렇게 커요?"\n"너의 목소리를 더 잘 들으려고 그렇단다, 아가야."',
    '"할머니, 눈이 왜 이렇게 커요?"\n"너를 더 잘 보려고 그렇단다."\n"할머니, 이가 왜 이렇게 커요?"\n"너를 꿀꺽 먹으려고 그렇단다!"',
    '늑대가 벌떡 일어났어요.\n그때 지나가던 사냥꾼이 비명 소리를 듣고 뛰어 들어와 늑대를 혼쭐냈지요.',
    '사냥꾼은 할머니도 무사히 구해 주었어요.\n빨간 모자는 그날부터 엄마 말씀을 꼭 지키기로 다짐했답니다.',
  ],
};

// ───────────────────────────────────────────────────────────────────
// 교육 메타 (vocabulary / moral_lesson) — 레벨별 공용
// ───────────────────────────────────────────────────────────────────

const EDU = {
  '1772197611601': {
    moral: '큰 일도 여럿이 마음을 모으면 해낼 수 있어요. 작은 힘도 소중합니다.',
    vocabulary: [
      { word: '순무', korean: '순무', partOfSpeech: '명사' },
      { word: '영차', korean: '영차', partOfSpeech: '감탄사' },
      { word: '쑥쑥', korean: '쑥쑥', partOfSpeech: '부사' },
      { word: '함께', korean: '함께', partOfSpeech: '부사' },
    ],
  },
  '1772108045716': {
    moral: '정성껏 꾸준히 하는 일이 가장 단단합니다. 빨리보다 튼튼하게.',
    vocabulary: [
      { word: '지푸라기', korean: '지푸라기', partOfSpeech: '명사' },
      { word: '벽돌', korean: '벽돌', partOfSpeech: '명사' },
      { word: '튼튼하다', korean: '튼튼하다', partOfSpeech: '형용사' },
      { word: '후!', korean: '후', partOfSpeech: '의성어' },
    ],
  },
  '1772106096276': {
    moral: '낯선 사람을 조심하고 부모님 말씀을 잘 기억해요.',
    vocabulary: [
      { word: '숲', korean: '숲', partOfSpeech: '명사' },
      { word: '바구니', korean: '바구니', partOfSpeech: '명사' },
      { word: '사냥꾼', korean: '사냥꾼', partOfSpeech: '명사' },
      { word: '조심', korean: '조심', partOfSpeech: '명사' },
    ],
  },
};

// ───────────────────────────────────────────────────────────────────
// 페이로드 조립
// ───────────────────────────────────────────────────────────────────

function buildStorybook(book, level, texts) {
  const id = `${book.bid}__${level}`;
  const title = `${book.title} (${level})`;
  const targetAge = level === 'L1' ? '3-4' : level === 'L2' ? '4-5' : level === 'L4' ? '7-8' : '5-6';
  const ageLabel = level === 'L1' ? '3-4세' : level === 'L2' ? '4-5세' : level === 'L4' ? '6-7세' : '5-6세';
  const folder = `${book.category} (${level})`;
  const edu = EDU[book.bid] ?? { moral: '', vocabulary: [] };

  return {
    id,
    title,
    type: 'storybook',
    readingLevel: level,
    targetAge,
    artStyle: book.artStyle,
    category: book.category,
    folder,
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
      vocabulary: edu.vocabulary ?? [],
      quiz: [],
      learning_objectives: [],
      moral_lesson: edu.moral ?? '',
    },
    // 자산 슬롯 (후속 이미지·TTS 생성 시 채울 자리)
    coverImages: [],
    keyObjectImages: [],
    games: [],
    blogPosts: [],
    cardNewsProjects: [],
    audiobookProjects: [],
    // 표지/참조콘텐츠 등은 원본(launch L3)에서 복사 가능하지만 지금은 비움
    referenceContent: `레벨: ${level} (${ageLabel}) · ${texts.length}페이지 · 원전 "${book.original}" 기반 직접 저술`,
  };
}

// ───────────────────────────────────────────────────────────────────
// API 헬퍼
// ───────────────────────────────────────────────────────────────────

async function apiJson(path, init) {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 300)}`);
  }
  return json.data;
}

async function saveOne(book, level, texts) {
  const sb = buildStorybook(book, level, texts);
  const saved = await apiJson('/storybooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storybook: sb }),
  });
  const totalChars = texts.reduce((sum, t) => sum + t.replace(/\s/g, '').length, 0);
  return { id: saved.id, pages: sb.pages.length, chars: totalChars };
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('파일럿: 세계명작 3권 × L1+L2 직접 저술 (Claude, no Gemini)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];
  for (const book of BOOKS) {
    for (const level of ['L1', 'L2']) {
      const texts = (level === 'L1' ? L1 : L2)[book.bid];
      if (!texts) {
        console.log(`- ${book.title} ${level}: (콘텐츠 없음) skip`);
        continue;
      }
      try {
        const r = await saveOne(book, level, texts);
        console.log(`✓ ${book.title} ${level}: ${r.pages}p · ${r.chars}자 · id=${r.id}`);
        results.push({ book: book.title, level, ...r, ok: true });
      } catch (err) {
        console.error(`✗ ${book.title} ${level}: ${err.message}`);
        results.push({ book: book.title, level, ok: false, error: err.message });
      }
    }
  }

  console.log('\n━━ 완료 ━━');
  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  console.log(`성공: ${ok.length}/${results.length}`);
  if (fail.length) console.log(`실패: ${fail.length}`);

  console.log('\n페이지·글자 요약:');
  for (const r of ok) {
    console.log(`  ${r.book} ${r.level}: ${r.pages}페이지, ${r.chars}자`);
  }

  process.exit(fail.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('스크립트 오류:', e);
  process.exit(1);
});
