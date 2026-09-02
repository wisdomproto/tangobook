// 창작동화 시리즈 저작도구 — 시리즈별 설정 (build-series-html.mjs 가 읽는다)
//
// 🔴 여기 안 적는 것: 앵커 문안 · 캐릭터 생김새 · 25권 표 · 본문.
//    전부 `docs/art-direction/{key}-anchor.md` 와 `docs/changjak-books/{key}/` 에서 빌드 때 읽어 온다.
//    시리즈 01~03 은 core.js 에 앵커 한국어 압축본을 따로 뒀다가 「고칠 땐 문서와 core 양쪽을」이
//    계속 따라붙었다. 사본을 안 만들면 그 부류의 버그가 아예 없다.
//
// aliases = SCENE 텍스트에서 그 인물을 찾는 열쇠. 🔴 부분문자열 충돌 주의(빌더가 검사한다).

export const PEN_NAMES = {
  // 글작가가 시리즈를 나눠 맡고, 그림작가는 시리즈마다 다르다.
  한여울: ['pongi', 'dodo', 'twins'],
  문나래: ['coco', 'pipo', 'lulu'],
  오하람: ['mei', 'mio'],
  배도담: ['bruno', 'nono'],
  // 아시아 무대(11~15)는 다른 두 사람이 맡는다
  서윤슬: ['bung', 'dingding', 'taro'],
  정미르: ['yuki', 'mina'],
};

/** 페파형 / 대발이형 쪽 라벨 */
const LABELS = {
  peppa: {
    fn: ['판을 깐다', '원함', '어른이 끼어든다', '어긋남', '어긋남', '틀린다', '틀린다', '아이의 방식', '먹힌다', '착지'],
    tag: ['일상', '원함', '어긋남', '어긋남', '어긋남', '틀림', '틀림', '방식', '방식', '착지'],
  },
  debari: {
    fn: ['판을 깐다', '원함', '결점대로', '결점대로', '결점대로', '탈', '탈', '어른 한 마디', '다시', '착지'],
    tag: ['일상', '원함', '어긋남', '어긋남', '어긋남', '탈', '탈', '어른', '고침', '착지'],
  },
};

/** 🔴 코타 손님 등록부 — 종마다 하나(얼굴 먹 도형은 `docs/changjak-books/kota/_design.md` 등록부와 같은 정본).
 *  회차 HTML 이 `window.SH_GUESTS` 로 받아 @image9~ 시트를 만든다. 같은 종이 다시 오면 같은 시트를 쓴다.
 *  🔴 손님을 고정 캐스트에 두면 25권이 「❓ 손님」 하나로 뭉개진다 — 그래서 단역이다. */
export const KOTA_GUESTS = {
  "Guest crane": {
    "key": "crane",
    "name": "두루미 손님",
    "aliases": [
      "Guest crane",
      "두루미"
    ],
    "desc": "키가 아주 큰 두루미. 흰 몸에 검은 목깃, 얼굴 먹 도형은 부리 위 가로 한 줄. 겹옷 밑단이 정강이를 덮어 새 다리가 드러나지 않는다."
  },
  "Guest boar": {
    "key": "boar",
    "name": "멧돼지 손님",
    "aliases": [
      "Guest boar",
      "멧돼지"
    ],
    "desc": "코가 길고 어깨가 두툼한 멧돼지. 짙은 흙빛 털, 얼굴 먹 도형은 콧등 위 가로 한 줄. 등에 보퉁이를 즐겨 멘다."
  },
  "Guest turtle": {
    "key": "turtle",
    "name": "거북 손님",
    "aliases": [
      "Guest turtle",
      "거북"
    ],
    "desc": "등이 굽은 늙은 거북. 무늬 없는 넓적한 등딱지, 얼굴 먹 도형은 이마 한가운데에서 목으로 내려오는 세로 납작 줄 하나. 등딱지에는 도형을 얹지 않는다. 늘 지팡이를 짚는다."
  },
  "Guest owl": {
    "key": "owl",
    "name": "부엉이 손님",
    "aliases": [
      "Guest owl",
      "부엉이"
    ],
    "desc": "눈이 큰 부엉이. 회갈색 깃, 얼굴 먹 도형은 두 눈 아래 가로 한 줄. 밤에 다니고 아침에 자는 밤손님이다."
  },
  "Guest hippo": {
    "key": "hippo",
    "name": "하마 손님",
    "aliases": [
      "Guest hippo",
      "하마"
    ],
    "desc": "몸집이 크고 둥근 하마. 잿빛 살결, 얼굴 먹 도형은 주둥이 등의 가로로 넓적한 띠(아이면 그 띠가 짧다). 앉을 자리와 이불이 남보다 넓게 필요하다."
  },
  "Guest swan": {
    "key": "swan",
    "name": "백조 손님",
    "aliases": [
      "Guest swan",
      "백조"
    ],
    "desc": "목이 길고 걸음이 사뿐한 백조. 흰 깃, 얼굴 먹 도형은 부리 뿌리에서 이마로 오르는 세로 줄 하나. 맨발로 마루를 걷기를 좋아한다."
  },
  "Guest frog": {
    "key": "frog",
    "name": "개구리 손님",
    "aliases": [
      "Guest frog",
      "개구리"
    ],
    "desc": "초록빛 개구리. 불룩한 두 눈, 얼굴 먹 도형은 두 눈 사이 짧은 가로 줄 하나. 아이 손님이라 겹옷이 무릎 위로 짧고 정강이가 드러난다."
  },
  "Guest ox": {
    "key": "ox",
    "name": "황소 손님",
    "aliases": [
      "Guest ox",
      "황소"
    ],
    "desc": "어깨가 산처럼 넓은 황소. 두 뿔, 얼굴 먹 도형은 두 뿔 사이 이마 한가운데 가로 납작 줄 하나. 등에 늘 큰 짐을 진다."
  },
  "Guest heron": {
    "key": "heron",
    "name": "왜가리 손님",
    "aliases": [
      "Guest heron",
      "왜가리"
    ],
    "desc": "다리가 가늘고 긴 왜가리. 잿빛 깃, 얼굴 먹 도형은 눈 위에서 뒤통수로 흘러내리는 가는 줄(댕기 깃). 그 줄의 끝 각도가 표정을 진다."
  },
  "Guest tanuki": {
    "key": "gtanuki",
    "name": "너구리 손님",
    "aliases": [
      "Guest tanuki"
    ],
    "desc": "코타와 같은 너구리지만 손님이라 눈가의 검은 띠가 없다. 얼굴 먹 도형은 콧잔등에 세로로 선 짧은 줄 하나뿐이고 분홍 수건도 두르지 않는다. 이 둘이 코타와 가르는 표지다."
  }
};


// 시리즈 18 「밤이네 작은 역」 손님 등록부 — 🔴 손님은 항상 무언가를 든다(고정 캐스트와 갈리는 한 가지). 염소만 빈손.
export const BAMI_GUESTS = {
  "Guest rabbit": {
    "key": "rabbit",
    "name": "토끼 가족",
    "aliases": [
      "Guest rabbit",
      "토끼 가족",
      "토끼"
    ],
    "desc": "엄마 토끼 하나와 아이 셋. 큰 바구니 하나를 함께 든다. 귀가 모자 밖으로 나온다."
  },
  "Guest mole": {
    "key": "mole",
    "name": "두더지 우체부",
    "aliases": [
      "Guest mole",
      "두더지 우체부",
      "두더지"
    ],
    "desc": "작은 두더지. 어깨에 편지 가방을 비스듬히 멘다. 눈이 거의 감겨 있고 코가 분홍."
  },
  "Guest fox": {
    "key": "fox",
    "name": "여우 화가",
    "aliases": [
      "Guest fox",
      "여우 화가",
      "여우"
    ],
    "desc": "마른 여우. 접은 이젤과 물감 상자를 든다. 붓 하나를 귀에 꽂았다."
  },
  "Guest tortoise": {
    "key": "tortoise",
    "name": "거북 할아버지",
    "aliases": [
      "Guest tortoise",
      "거북 할아버지",
      "거북"
    ],
    "desc": "등딱지가 낡은 거북. 지팡이와 작은 가죽 가방. 걸음이 아주 느리다."
  },
  "Guest duck": {
    "key": "duck",
    "name": "오리 부부",
    "aliases": [
      "Guest duck",
      "오리 부부",
      "오리 신혼부부",
      "오리"
    ],
    "desc": "오리 둘. 꽃다발 하나와 똑같은 트렁크 둘. 늘 나란히 선다."
  },
  "Guest hedgehog": {
    "key": "hedgehog",
    "name": "고슴도치 악단",
    "aliases": [
      "Guest hedgehog",
      "고슴도치 악단",
      "고슴도치"
    ],
    "desc": "고슴도치 넷. 저마다 악기 케이스(바이올린·트럼펫·북·아코디언)를 든다. 가시 위에 작은 모자."
  },
  "Guest bear": {
    "key": "bear",
    "name": "곰 아주머니",
    "aliases": [
      "Guest bear",
      "곰 아주머니",
      "곰"
    ],
    "desc": "큰 곰. 아주 무거운 가방 하나. 앞치마에 꽃무늬."
  },
  "Guest sheep": {
    "key": "sheep",
    "name": "양 세 자매",
    "aliases": [
      "Guest sheep",
      "양 세 자매",
      "양"
    ],
    "desc": "양 셋. 똑같은 모자 셋, 똑같은 손가방 셋. 늘 셋이 붙어 다닌다."
  },
  "Guest deer": {
    "key": "deer",
    "name": "사슴 학생",
    "aliases": [
      "Guest deer",
      "사슴 학생",
      "사슴"
    ],
    "desc": "어린 사슴. 책가방을 메고 접은 지도를 든다. 뿔이 아직 짧다."
  },
  "Guest badger": {
    "key": "badger",
    "name": "오소리 아저씨",
    "aliases": [
      "Guest badger",
      "오소리 아저씨",
      "오소리"
    ],
    "desc": "마지막 기차의 손님. 작은 등불 하나를 든다. 얼굴에 흰 줄 둘."
  },
  "Guest goat": {
    "key": "goat",
    "name": "염소 아저씨",
    "aliases": [
      "Guest goat",
      "염소 아저씨",
      "염소"
    ],
    "desc": "처음 온 손님. 아무것도 안 들었다(그게 그 권의 실마리). 턱수염, 낡은 모자."
  }
};


// 시리즈 19 「달이네 등대」 손님 등록부 — 손님은 배로 온다. 신호 = 끼룩이 「배다!」
export const DARI_GUESTS = {
  "Guest pelican": {
    "key": "pelican",
    "name": "우체선 아저씨",
    "aliases": [
      "Guest pelican",
      "우체선 아저씨",
      "펠리컨"
    ],
    "desc": "큰 부리 펠리컨. 어깨에 우편 자루. 배에서 내릴 때 부리에 편지 하나를 물고 있다."
  },
  "Guest otter": {
    "key": "otter",
    "name": "낚시꾼 아저씨",
    "aliases": [
      "Guest otter",
      "낚시꾼 아저씨",
      "수달"
    ],
    "desc": "수달. 낚싯대와 양동이. 모자에 낚싯바늘이 하나 꽂혀 있다."
  },
  "Guest turtle": {
    "key": "turtle",
    "name": "의사 선생님",
    "aliases": [
      "Guest turtle",
      "의사 선생님",
      "바다거북"
    ],
    "desc": "바다거북. 왕진 가방을 등딱지 옆에 멘다. 아주 천천히 걷는다."
  },
  "Guest cormorant": {
    "key": "cormorant",
    "name": "등대 검사 아주머니",
    "aliases": [
      "Guest cormorant",
      "등대 검사 아주머니",
      "가마우지"
    ],
    "desc": "가마우지. 공책과 구명조끼 한 벌. 목이 길고 검다."
  },
  "Guest granny": {
    "key": "granny",
    "name": "할머니",
    "aliases": [
      "Guest granny",
      "할머니",
      "뭍 할머니"
    ],
    "desc": "뭍에서 배 타고 온 물범 할머니. 보자기 꾸러미 하나. 수염이 희다."
  },
  "Guest market": {
    "key": "market",
    "name": "장터 사람들",
    "aliases": [
      "Guest market",
      "장터 사람들",
      "장터"
    ],
    "desc": "항구 장터의 여러 종(게·갈매기·수달). 좌판 뒤에 서 있다. 얼굴은 안 그린다(배경)."
  }
};

export const SERIES = {
  pongi: {
    no: '01', title: '퐁이네 운하 마을', icon: '🦦',
    awardRef: 'klassen-hat',
    sub: '아기 수달 퐁이 · 네덜란드 운하 마을 · <b>페파형</b> · 그림체 = 실크스크린 2판(전권)',
    form: 'peppa', pen: { author: '한여울', illustrator: '진예람' },
    palette: { paper: '#F6F4EE', ink1: '#2C4A3C', ink2: '#8C7C68', overlap: '#21372E', accent: '#A8442F' },
    accentWhere: '퐁이 목끈 (화면의 유일한 붉은 판)',
    cast: [
      { key: 'pongi', name: '퐁이', face: '🦦', aliases: ['퐁이', 'Pongi'] },
      { key: 'dad', name: '아빠', face: '🦦', aliases: ['아빠', 'Dad otter'] },
      { key: 'mom', name: '엄마', face: '🦦', aliases: ['엄마', 'Mom otter'] },
      { key: 'baby', name: '동생', face: '🦦', aliases: ['동생', 'Baby otter'] },
      { key: 'goose', name: '거위 할아버지', face: '🪿', aliases: ['거위 할아버지', 'Goose grandpa'] },
    ],
  },
  coco: {
    no: '02', title: '코코네 빵집 골목', icon: '🐭',
    awardRef: 'metcalfe-crisps',
    sub: '아기 생쥐 코코 · 파리 뒷골목 빵집 · <b>페파형</b> · 그림체 = 활판 2잉크(전권)',
    form: 'peppa', pen: { author: '문나래', illustrator: '고윤하' },
    palette: { paper: '#F6F1E7', ink1: '#8A6242', ink2: '#4E5A66', overlap: '#35322B', accent: '#B5402E' },
    accentWhere: '코코 머릿수건 (세상의 유일한 빨강 · 07권 딸기만 예외)',
    cast: [
      { key: 'coco', name: '코코', face: '🐭', aliases: ['코코', 'Coco'] },
      { key: 'mom', name: '엄마', face: '🐭', aliases: ['엄마', 'Mom'] },
      { key: 'mole', name: '두더지 할아버지', face: '🦡', aliases: ['두더지 할아버지', 'Mole grandfather'] },
      { key: 'magpie', name: '까치 아줌마', face: '🐦', aliases: ['까치 아줌마', 'Magpie aunt'] },
      { key: 'pig', name: '돼지 아저씨', face: '🐷', aliases: ['돼지 아저씨', 'Pig uncle'] },
    ],
  },
  mei: {
    no: '03', title: '메이네 산마을', icon: '🐐',
    awardRef: 'rayner-harris',
    sub: '아기 염소 메이와 동무 넷 · 알프스 산마을 · <b>페파형</b> · 그림체 = 색연필 2색(전권)',
    form: 'peppa', pen: { author: '오하람', illustrator: '남시우' },
    palette: { paper: '#EDE9E1', ink1: '#6E7A5E', ink2: '#8A7358', overlap: '#40483A', accent: '#D4622A' },
    accentWhere: '아이마다 지닌 주황 물건 하나씩',
    cast: [
      { key: 'mei', name: '메이', face: '🐐', aliases: ['메이', 'Mei'] },
      { key: 'rudi', name: '루디', face: '🐿️', aliases: ['루디', 'Rudi'] },
      { key: 'ppino', name: '삐노', face: '🐰', aliases: ['삐노', 'Ppino'] },
      { key: 'soso', name: '소소', face: '🦔', aliases: ['소소', 'Soso'] },
      { key: 'leo', name: '레오', face: '🦁', aliases: ['레오', 'Leo'] },
      { key: 'granny', name: '곰 할머니', face: '🐻', aliases: ['곰 할머니', 'Bear granny'] },
    ],
  },
  /** 🔴 17 — 앙상블형(호리·대발이 결). 손님 등록부가 없다: 고정 캐스트 다섯이 돌고 **한 편에 최대 셋**이다.
   *  캐스트가 여럿이고 권마다 일부만 나오므로, 그 권에 처음 나오는 인물은 **등장 쪽에서 한 조각으로** 밝힌다
   *  (아이가 어느 권을 첫 권으로 집을지 모른다 → docs/changjak-books/CLAUDE.md §처음 나오는 인물). */
  bami: {
    no: '18',
    title: '밤이네 작은 역',
    icon: '🦉',
    awardRef: 'boyd-flashlight',
    sub: '올빼미 아이 밤이와 역장 아빠 · 산골 간이역 사계절 · <b>호리형</b>(주인공 하나, 결점은 권마다 · 손님은 기차로) · 그림체 = 과슈, 어두운 종이 위에 등불만 칠한다',
    form: 'debari',
    pen: { author: '오하람', illustrator: '유하람' },
    // 🔴 이 시리즈만 ink1/ink2 가 밝은 칠 둘이고 overlap 이 어둠이다(종이가 어둠) — 키 이름만 읽으면 문제없다
    palette: { paper: '#75695F', ink1: '#F4DFA4', ink2: '#D6DEE2', overlap: '#27221E', accent: '#1F9E92' },
    accentWhere: '밤이의 뜬 목도리 하나 (목=추움 / 배에 묶음=더움 / 난로 옆 못=잠). 25권 통틀어 청록은 그것뿐 — 신호등·깃발·우편함에도 안 쓴다',
    cast: [
      { key: 'bami',   name: '밤이', face: '🦉', aliases: ['밤이', 'Bami owl', 'Bami'] },
      { key: 'father', name: '아빠', face: '🦉', aliases: ['아빠', '역장 아빠', 'Father owl', 'Stationmaster'] },
      { key: 'mother', name: '엄마', face: '🦉', aliases: ['엄마', '매점 엄마', 'Mother owl'] },
      { key: 'nabi',   name: '나비', face: '🐱', aliases: ['나비', 'Nabi cat', 'Nabi'] },
      { key: 'pipi',   name: '삐삐', face: '🐦', aliases: ['삐삐', 'Pipi sparrow', 'Pipi'] },
    ],
    guests: BAMI_GUESTS,
  },
  moya: {
    no: '17',
    title: '모야네 물웅덩이',
    icon: '🦓',
    awardRef: 'rutten-ombre',
    sub: '얼룩말 아이 모야와 동무 셋 · 아프리카 초원의 물웅덩이 · <b>대발이형</b>(고정 캐스트 다섯, 한 편에 최대 셋) · 그림체 = 투명 수채, 섞지 않고 나란히',
    form: 'debari',
    pen: { author: '오하람', illustrator: '유하람' },
    palette: { paper: '#FBF3E4', ink1: '#DFA24A', ink2: '#7FB2D9', overlap: '#6B62A6', accent: '#D6417A' },
    accentWhere: '모야 목의 꼬아 만든 풀 끈 (25권 통틀어 자홍은 그것뿐 — 꽃·노을·새에도 안 쓴다)',
    cast: [
      { key: 'moya',   name: '모야', face: '🦓', aliases: ['모야', 'Moya zebra', 'Moya'] },
      { key: 'kiki',   name: '키키', face: '🦫', aliases: ['키키', 'Kiki meerkat', 'Kiki'] },
      { key: 'tumba',  name: '툼바', face: '🐗', aliases: ['툼바', 'Tumba warthog', 'Tumba'] },
      { key: 'nia',    name: '니아', face: '🦒', aliases: ['니아', 'Nia giraffe', 'Nia'] },
      { key: 'mother', name: '엄마', face: '🦓', aliases: ['엄마', 'Mother zebra'] },
    ],
  },
  kota: {
    guests: KOTA_GUESTS,
    no: '16', title: '코타와 오늘의 손님', icon: '🦝',
    awardRef: 'wang-thump',
    sub: '아기 너구리 코타 · 일본 온천 골짜기의 작은 여관 · <b>페파형</b>(매권 낯선 손님 하나가 마을을 몰라서 틀린다) · 그림체 = 니혼가 암채 하나(전권)',
    form: 'peppa', pen: { author: '오하람', illustrator: '유하람' },
    palette: {
      paper: '#EFE8DC', ink1: '#7C8B7A', ink2: '#A8846A',
      overlap: '#3E3A34', accent: '#E8A9A0',
    },
    accentWhere: '코타 목수건 (여관 수건은 전부 흰 무지)',
    cast: [
      { key: 'kota', name: '코타', face: '🦝', aliases: ['코타', 'Kota tanuki', 'Kota'] },
      { key: 'dad', name: '아빠', face: '🦝', aliases: ['아빠', 'Dad tanuki'] },
      // 🔴 손님은 **고정 캐스트가 아니라 회차별 단역**이다(2026-09-01) — 25권의 종이 다 다르다.
      //    등록부 = KOTA_GUESTS, 회차 HTML 이 window.SH_GUESTS 로 받아 @image9~ 시트를 만든다.
    ],
  },
  dodo: {
    no: '04', title: '도도네 물방앗간', icon: '🦆',
    awardRef: 'meschenmoser-gordon',
    sub: '오리 남매 도도와 무무 · 프랑스 시골 물방앗간 · <b>페파형</b>(아는 척 누나가 틀린다) · 그림체 = 과슈 하나(전권)',
    form: 'peppa', pen: { author: '한여울', illustrator: '윤새롬' },
    palette: { paper: '#F5EFDF', ink1: '#4E7D77', ink2: '#B08A50', overlap: '#3D4A44', accent: '#2D62B8' },
    accentWhere: '도도 리본 · 무무 목수건',
    cast: [
      { key: 'dodo', name: '도도', face: '🦆', aliases: ['도도', 'Dodo duck', 'Dodo'] },
      { key: 'mumu', name: '무무', face: '🦆', aliases: ['무무', 'Mumu duck', 'Mumu'] },
      { key: 'mom', name: '엄마', face: '🦆', aliases: ['엄마', 'Mommy duck'] },
      { key: 'dad', name: '아빠', face: '🦆', aliases: ['아빠', 'Daddy duck'] },
    ],
  },
  bruno: {
    awardRef: 'collins-bearchair',
    no: '05', title: '브루노 할아버지네 숲', icon: '🐻',
    sub: '아기 곰 닐스와 할아버지 · 스웨덴 숲 사계절 · <b>대발이형</b>(결점 → 탈 → 한 마디 → 고침) · 그림체 = 크레용 하나(전권)',
    form: 'debari', pen: { author: '배도담', illustrator: '차온유' },
    palette: { paper: '#E9E3D3', ink1: '#4F6B4E', ink2: '#96674A', overlap: '#2E3A2A', accent: '#1C4E8A' },
    accentWhere: '닐스 장화',
    cast: [
      { key: 'nils', name: '닐스', face: '🐻', aliases: ['닐스', 'Nils bear cub', 'Nils'] },
      { key: 'bruno', name: '브루노 할아버지', face: '🐻', aliases: ['브루노', '할아버지', 'Bruno grandfather bear', 'Bruno'] },
    ],
  },
  twins: {
    no: '06', title: '쌍둥이네 바닷가', icon: '🐰',
    awardRef: 'erlbruch-bigq',
    sub: '토끼 쌍둥이 리리와 롤로 · 포르투갈 어촌 · <b>페파형</b>(둘이 우기다 둘 다 틀린다) · 그림체 = 리소 하나(전권)',
    form: 'peppa', pen: { author: '한여울', illustrator: '임푸른' },
    palette: { paper: '#F1F0E6', ink1: '#2E6B96', ink2: '#A85E38', overlap: '#2D3B42', accent: '#E9A825' },
    accentWhere: '리리 모자 · 롤로 장화',
    cast: [
      { key: 'riri', name: '리리', face: '🐰', aliases: ['리리', 'Riri rabbit', 'Riri'] },
      { key: 'lolo', name: '롤로', face: '🐰', aliases: ['롤로', 'Lolo rabbit', 'Lolo'] },
      { key: 'dad', name: '아빠', face: '🐰', aliases: ['아빠', 'Dad rabbit'] },
      { key: 'mom', name: '엄마', face: '🐰', aliases: ['엄마', 'Mom rabbit'] },
      { key: 'cat', name: '부둣가 고양이', face: '🐱', aliases: ['부둣가 고양이', 'Harbor cat'] },
    ],
  },
  mio: {
    no: '07', title: '미오네 유치원', icon: '🐱',
    awardRef: 'naylor-suitcase',
    sub: '아기 고양이 미오와 반 아이들 · 독일 강마을 유치원 · <b>대발이형</b>(결점 배역제 · 5권 주기) · 그림체 = 리노컷 하나(전권)',
    form: 'debari', pen: { author: '오하람', illustrator: '강마루' },
    palette: { paper: '#F0EAD8', ink1: '#3B3A33', ink2: '#6F8996', overlap: '#232B2E', accent: '#6E4E9E' },
    accentWhere: '또래 다섯이 하나씩',
    cast: [
      { key: 'mio', name: '미오', face: '🐱', aliases: ['미오', 'Mio kitten', 'Mio'] },
      { key: 'bobo', name: '보보', face: '🐷', aliases: ['보보', 'Bobo piglet', 'Bobo'] },
      { key: 'lala', name: '라라', face: '🐑', aliases: ['라라', 'Lala lamb', 'Lala'] },
      { key: 'gaga', name: '가가', face: '🦆', aliases: ['가가', 'Gaga gosling', 'Gaga'] },
      { key: 'duri', name: '두리', face: '🦝', aliases: ['두리', 'Duri raccoon', 'Duri'] },
      { key: 'teacher', name: '바우 선생님', face: '🐕', aliases: ['바우 선생님', '선생님', 'Teacher Bau big dog', 'Teacher Bau'] },
    ],
  },
  pipo: {
    no: '08', title: '피포네 돌담 목장', icon: '🐶',
    awardRef: 'butler-borders',
    sub: '강아지 피포 · 아일랜드 목장 · <b>페파형</b>(이웃 어른 셋이 저마다 틀린다) · 그림체 = 숯 하나(전권)',
    form: 'peppa', pen: { author: '문나래', illustrator: '백서리' },
    palette: { paper: '#EFE9DC', ink1: '#6B665C', ink2: '(없음 — 숯 하나가 세 값)', overlap: '#2C2A25', accent: '#F0B429' },
    accentWhere: '피포 목도리 (10권 등불만 예외)',
    cast: [
      { key: 'pipo', name: '피포', face: '🐶', aliases: ['피포', 'Pipo puppy', 'Pipo'] },
      { key: 'mom', name: '엄마', face: '🐶', aliases: ['엄마', 'Mom dog'] },
      { key: 'sheep', name: '양 할아버지', face: '🐑', aliases: ['양 할아버지', '할아버지', 'Sheep grandpa'] },
      { key: 'goose', name: '거위 아줌마', face: '🦢', aliases: ['거위 아줌마', '아줌마', 'Goose auntie'] },
      { key: 'horse', name: '말 아저씨', face: '🐴', aliases: ['말 아저씨', '아저씨', 'Horse uncle'] },
    ],
  },
  nono: {
    awardRef: 'child-tomato',
    no: '09', title: '노노네 겨울 골목', icon: '🐦',
    sub: '아기 참새 노노와 또래 둘 · 유럽 옛 골목 · 겨울 · <b>대발이형</b>(결점 배역제) · 그림체 = 찢은 종이 콜라주 하나(전권)',
    form: 'debari', pen: { author: '배도담', illustrator: '노아라' },
    palette: { paper: '#EFEDE6 (밤 #545A5E) + 눈 #FBFAF6', ink1: '#7C8085', ink2: '#8A6A4C', overlap: '#333A3E', accent: '#2F7F4E' },
    accentWhere: '셋이 하나씩 (25권 p10만 눈사람 목에)',
    cast: [
      { key: 'nono', name: '노노', face: '🐦', aliases: ['노노', 'Nono sparrow', 'Nono'] },
      { key: 'gugu', name: '구구', face: '🕊️', aliases: ['구구', 'Gugu pigeon', 'Gugu'] },
      { key: 'kiki', name: '키키', face: '🐱', aliases: ['키키', 'Kiki cat', 'Kiki'] },
      { key: 'badger', name: '오소리 할아버지', face: '🦡', aliases: ['오소리 할아버지', '할아버지', 'Grandpa Badger'] },
      { key: 'squirrel', name: '아기 다람쥐', face: '🐿️', aliases: ['아기 다람쥐', 'Baby squirrel'] },
    ],
  },
  lulu: {
    no: '10', title: '룰루네 올리브 언덕', icon: '🫏',
    awardRef: 'milner-nomoney',
    sub: '아기 당나귀 룰루와 대가족 · 이탈리아 올리브 언덕 · <b>페파형</b>(어른 친척들이 틀린다) · 그림체 = 모노타이프 하나(전권)',
    form: 'peppa', pen: { author: '문나래', illustrator: '유가온' },
    palette: { paper: '#F7F2E6', ink1: '#8C9478', ink2: '#BC6E42', overlap: '#3E3A2E', accent: '#1F7FA8' },
    accentWhere: '룰루 방울',
    cast: [
      { key: 'lulu', name: '룰루', face: '🫏', aliases: ['룰루', 'Lulu donkey', 'Lulu'] },
      { key: 'mama', name: '엄마', face: '🫏', aliases: ['엄마', 'Mama donkey'] },
      { key: 'nino', name: '니노 삼촌', face: '🫏', aliases: ['니노', 'Nino donkey', 'Nino'] },
      { key: 'rosa', name: '로사 이모', face: '🫏', aliases: ['로사', 'Rosa donkey', 'Rosa'] },
      { key: 'beppo', name: '베포 큰아버지', face: '🫏', aliases: ['베포', '큰아버지', 'Beppo donkey', 'Beppo'] },
    ],
  },

  // ── 아시아 무대 (11~15) ─ 축은 docs/changjak-books/_series-slate-asia.md ────────────────
  bung: {
    no: '11', title: '붕이네 물 위 장터', icon: '🐃',
    awardRef: 'darme-coq',
    sub: '아기 물소 붕이와 말 못 하는 동생 또리 · 베트남 메콩 수상시장 · <b>대발이형</b>(겨루는 상대가 없다 — 늘 대신 알아내야 한다) · 그림체 = 민화 목판 하나(전권)',
    form: 'debari', pen: { author: '서윤슬', illustrator: '표유담' },
    // 🔴 팔레트는 docs/art-direction/bung-anchor.md 의 PALETTE 절과 같아야 한다(빌더가 검사)
    palette: { paper: '#F3ECDC', ink1: '#C08B3E', ink2: '#4A7247', overlap: '#3A4A2A', accent: '#1E8A8A' },
    accentWhere: '붕이 코뚜레 끈',
    cast: [
      { key: 'bung', name: '붕이', face: '🐃', aliases: ['붕이', 'Bung buffalo'] },
      { key: 'ddori', name: '또리', face: '🐃', aliases: ['또리', 'Ddori baby buffalo'] },
      { key: 'mom', name: '엄마', face: '🐃', aliases: ['엄마', 'Mom buffalo'] },
      { key: 'grandpa', name: '할아버지', face: '🐃', aliases: ['할아버지', 'Grandpa buffalo'] },
    ],
  },
  dingding: {
    no: '12', title: '딩딩네 계단 논', icon: '🐷',
    awardRef: 'teckentrup-samesky',
    sub: '아기 돼지 딩딩과 삼대 · 중국 남부 계단식 논 · <b>페파형</b>(할머니는 옛 방식이 안 맞아서, 엄마는 대충 봐서 — 서로 다르게 틀린다) · 그림체 = 전지 하나(전권)',
    form: 'peppa', pen: { author: '서윤슬', illustrator: '송가람' },
    palette: {
      paper: '#F7F4EC', ink1: '#1C1A17', ink2: '#B9B5A8',
      overlap: '(없음 — 한 장을 오려 내는 것이라 겹치는 곳이 없다)', accent: '#C62828',
    },
    accentWhere: '딩딩 앞치마',
    cast: [
      { key: 'dingding', name: '딩딩', face: '🐷', aliases: ['딩딩', 'Dingding piglet'] },
      { key: 'granny', name: '할머니', face: '🐷', aliases: ['할머니', 'Grandma pig'] },
      { key: 'mom', name: '엄마', face: '🐷', aliases: ['엄마', 'Mama pig'] },
      { key: 'ming', name: '밍 아저씨', face: '🦆', aliases: ['밍 아저씨', 'Ming duck'] },
    ],
  },
  taro: {
    no: '13', title: '타로와 무무', icon: '🐒',
    awardRef: 'albertine-marta',
    sub: '아기 원숭이 타로와 아기 사슴 무무 · 인도네시아 섬 마을 · <b>페파형</b>(어른이 아니라 서로에게 틀린다 — 나쁜 마음이 아니라 몰라서) · 그림체 = 바틱 하나(전권)',
    form: 'peppa', pen: { author: '서윤슬', illustrator: '민서하' },
    palette: {
      paper: '#EFE3CC', ink1: '#4C6E8C',
      ink2: '(없음 — 한 번 담근 것과 두 번 담근 것뿐)', overlap: '#22406B', accent: '#E2711D',
    },
    accentWhere: '타로 허리끈 · 무무 머리끈',
    cast: [
      { key: 'taro', name: '타로', face: '🐒', aliases: ['타로', 'Taro monkey'] },
      { key: 'mumu', name: '무무', face: '🦌', aliases: ['무무', 'Mumu deer'] },
      { key: 'taromom', name: '타로 엄마', face: '🐒', aliases: ['타로 엄마', 'Taro mother monkey'] },
      { key: 'mumugran', name: '무무 할머니', face: '🦌', aliases: ['무무 할머니', 'Mumu grandmother deer'] },
    ],
  },
  yuki: {
    no: '14', title: '유키네 산골', icon: '🦊',
    awardRef: 'cheveau-troupeau',
    sub: '아기 여우 유키와 말 못 하는 개 모모 · 일본 산촌 사계절 · <b>대발이형</b>(모모는 몸으로만 답한다 — 알아채는 건 유키다) · 그림체 = 수묵 담채 하나(전권)',
    form: 'debari', pen: { author: '정미르', illustrator: '서지운' },
    palette: {
      paper: '#F2EEE3', ink1: '#23211E',
      ink2: '(없음 — 먹 하나가 물로 다섯 값을 낸다)',
      overlap: '(없음 — 한 획을 두 번 덧긋지 않는다)', accent: '#C8452E',
    },
    accentWhere: '유키 목도리 (먹 안의 유일한 색)',
    cast: [
      { key: 'yuki', name: '유키', face: '🦊', aliases: ['유키', 'Yuki fox'] },
      { key: 'momo', name: '모모', face: '🐕', aliases: ['모모', 'Momo dog'] },
      { key: 'granny', name: '할머니', face: '🦊', aliases: ['할머니', 'Granny fox'] },
    ],
  },
  mina: {
    no: '15', title: '가운데 아이 미나', icon: '🐘',
    awardRef: 'alcantara-rio',
    sub: '아기 코끼리 삼 남매 라주·미나·소누 · 인도 강가 마을 · <b>대발이형</b>(위로는 아직 안 되고 아래로는 이미 지난 자리) · 그림체 = 점으로 채운 민화 하나(전권)',
    form: 'debari', pen: { author: '정미르', illustrator: '하다온' },
    palette: {
      paper: '#EFE0C4', ink1: '#2E2A24', ink2: '#F4EFE4',
      overlap: '(없음 — 점은 겹치지 않고 사이를 둔다)', accent: '#E8A33D',
    },
    accentWhere: '미나 발찌 (화면에서 유일하게 매끈한 것)',
    cast: [
      { key: 'mina', name: '미나', face: '🐘', aliases: ['미나', 'Mina elephant'] },
      { key: 'raju', name: '라주', face: '🐘', aliases: ['라주', 'Raju elephant'] },
      { key: 'sonu', name: '소누', face: '🐘', aliases: ['소누', 'Sonu elephant'] },
      { key: 'mother', name: '엄마', face: '🐘', aliases: ['엄마', 'Mother elephant'] },
    ],
  },
};

export function labelsFor(key) {
  return LABELS[SERIES[key].form];
}

export function penOf(key) {
  return SERIES[key].pen;
}
