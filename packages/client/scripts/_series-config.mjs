// 창작동화 시리즈 저작도구 — 시리즈별 설정 (build-series-html.mjs 가 읽는다)
//
// 🔴 여기 안 적는 것: 앵커 문안 · 캐릭터 생김새 · 25권 표 · 본문.
//    전부 `docs/art-direction/{key}-anchor.md` 와 `docs/changjak-books/{key}/` 에서 빌드 때 읽어 온다.
//    시리즈 01~03 은 core.js 에 앵커 한국어 압축본을 따로 뒀다가 「고칠 땐 문서와 core 양쪽을」이
//    계속 따라붙었다. 사본을 안 만들면 그 부류의 버그가 아예 없다.
//
// aliases = SCENE 텍스트에서 그 인물을 찾는 열쇠. 🔴 부분문자열 충돌 주의(빌더가 검사한다).

export const PEN_NAMES = {
  // 글작가 4명이 열 시리즈를 나눠 맡고, 그림작가는 시리즈마다 다르다.
  한여울: ['pongi', 'dodo', 'twins'],
  문나래: ['coco', 'pipo', 'lulu'],
  오하람: ['mei', 'mio'],
  배도담: ['bruno', 'nono'],
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
  dodo: {
    no: '04', title: '도도네 물방앗간', icon: '🦆',
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
};

export function labelsFor(key) {
  return LABELS[SERIES[key].form];
}

export function penOf(key) {
  return SERIES[key].pen;
}
