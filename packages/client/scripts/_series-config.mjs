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
  kota: {
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
      // 🔴 손님은 매권 다른 종이 온다 — SCENE 토큰이 `Guest crane` 처럼 붙으므로
      //    별칭은 **짧은 `Guest`** 라야 부분문자열로 잡힌다.
      { key: 'guest', name: '손님', face: '❓', aliases: ['손님', 'Guest'] },
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
