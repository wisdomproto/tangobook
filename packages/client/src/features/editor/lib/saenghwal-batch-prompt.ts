// 생활동화 "전체 이미지 프롬프트" 합성 — 기획서 saenghwal-core.js composeBatchPrompt 포팅.
// 스타일 앵커(니들펠트) + @image1~8 고정 캐스트 + @image9~ 단역 + 전 페이지 SCENE([등장] 포함).
// editor2 category:"생활동화" 책에서 "🖼️ 전체 프롬프트 복사" 로 사용.
import type { Storybook, Page } from '@tangobook/shared';

export const SAENGHWAL_CATEGORY = '생활동화';

// 🔴 STYLE SSOT (saenghwal-core.js STYLE_PROMPT 와 동일 유지 — 그림체 변경 시 양쪽 갱신)
const STYLE_PROMPT = [
  '[스타일] 호리네 생활동화 — 3~5세 유아 그림책. 그림체 = 니들펠트(양모 인형) 스톱모션 룩 (needle-felted wool plush, handmade felt stop-motion diorama).',
  '보송보송한 양모 펠트 섬유 질감이 살아있는 폭신한 3D 인형 캐릭터, 통통하고 둥글둥글한 형태, 부드러운 스튜디오 소프트박스 조명과 은은한 실제 그림자, 만지고 싶은 촉감, 밝고 채도 높은 색감.',
  '슈퍼-디폼드 치비 비율(머리≈몸통 1.3배, 짧고 통통한 팔다리, 크고 둥근 눈, 분홍 볼터치). 배경도 펠트·천·미니어처로 만든 듯한 아기자기한 디오라마.',
  '화면비 16:9 스프레드, 부드러운 심도 배경. 평면 2D 아님·그림물감 아님·매끈한 CG/클레이 아님 — 양모 섬유 질감이 반드시 보여야 함 (visible wool-felt fibers).',
  '그림 안에 글자·말풍선·문자 텍스트를 절대 넣지 않고, 상단에 캡션용 여백을 남긴다.',
].join(' ');

interface Cast {
  name: string;
  desc: string;
  aliases: string[];
  img: number;
}

// 고정 캐스트 8인 — 항상 @image1..8 (saenghwal-core.js FIXED_CHARS 와 동일 순서/별칭)
const FIXED_CAST: Cast[] = [
  {
    name: '호리',
    img: 1,
    aliases: ['Hori', '호리'],
    desc: '아기 호랑이(5세) 주인공 — 주황 털+갈색 줄무늬, 크림색 배, 분홍 볼터치, 크고 둥근 호기심 눈. 용기의 순간 꼬리 줄무늬가 무지개로 반짝.',
  },
  {
    name: '엄마',
    img: 2,
    aliases: ['Mom tiger', 'Mom', 'mother tiger', '엄마'],
    desc: '엄마 호랑이 — 호리와 같은 팔레트의 둥근 치비, 부드러운 속눈썹, 복숭아색 앞치마.',
  },
  {
    name: '아빠',
    img: 3,
    aliases: ['Dad', 'father tiger', 'Daddy', '아빠'],
    desc: '아빠 호랑이 — 진한 주황 털의 둥근 치비, 작고 둥근 안경, cowlick, 큰 미소.',
  },
  {
    name: '호야',
    img: 4,
    aliases: ['Hoya', 'baby brother', 'little brother', '호야'],
    desc: '아기 동생 호랑이(2세) — 호리와 같은 팔레트지만 더 통통하고 머리 비율 큼, 노란 턱받이.',
  },
  {
    name: '토토',
    img: 5,
    aliases: ['Toto', 'bunny', '토토'],
    desc: '토끼(5세) — 흰 털, 연하늘색 귀 안쪽, 길게 선 귀, 자신만만한 눈, 빨간 손수건.',
  },
  {
    name: '보리',
    img: 6,
    aliases: ['Bori', 'bear cub', 'bear Bori', '보리'],
    desc: '곰(6세) — 연갈색 통통한 몸, 수줍고 부드러운 표정, 파란 멜빵바지.',
  },
  {
    name: '콩이',
    img: 7,
    aliases: ['Kongi', 'squirrel', '콩이'],
    desc: '다람쥐(5세) — 크고 줄무늬진 복슬 꼬리, 빵빵한 볼주머니, 도토리.',
  },
  {
    name: '두부',
    img: 8,
    aliases: ['Dubu', 'puppy', '두부'],
    desc: '강아지 펫 — 동글동글 흰 몸, 한쪽만 접힌 갈색 귀, 빨간 목줄, 혀 내밀고 행복.',
  },
];

export function isSaenghwalBook(sb: Pick<Storybook, 'category'>): boolean {
  return sb.category === SAENGHWAL_CATEGORY;
}

function sceneText(p: Page): string {
  if (p.scene_description) return p.scene_description;
  const ss = p.scene_structure;
  return [ss?.characters, ss?.background, ss?.atmosphere].filter(Boolean).join(' ');
}

function sceneHasChar(scene: string, aliases: string[]): boolean {
  const s = scene.toLowerCase();
  return aliases.some((a) => a && s.includes(a.toLowerCase()));
}

/**
 * 기획서와 동일한 배치 프롬프트 문자열 합성.
 * `subset` 지정 시 그 쪽번호들만 body 에 포함(쪽별 복사용) — 스타일·@image 범례는 그대로 붙는다.
 */
export function composeSaenghwalBatchPrompt(sb: Storybook, subset?: number[]): string {
  let pages = (sb.pages ?? []).slice().sort((a, b) => a.pageNumber - b.pageNumber);
  if (subset && subset.length) pages = pages.filter((p) => subset.includes(p.pageNumber));

  // 단역(guest) = role '단역' 캐릭터 → @image9~
  const guests: Cast[] = (sb.characters ?? [])
    .filter((c) => c && c.role === '단역')
    .map((c, i) => ({
      name: c.name,
      desc: c.description ?? '',
      // SCENE 은 영어 토큰 위주라 이름 + description 첫 명사 조각으로 느슨히 감지
      aliases: [c.name, ...(c.nameEn ? [c.nameEn] : [])].filter(Boolean),
      img: FIXED_CAST.length + 1 + i,
    }));
  const all = [...FIXED_CAST, ...guests];

  const appearsAny: Record<number, boolean> = {};
  all.forEach((c) => {
    appearsAny[c.img] = pages.some((p) => sceneHasChar(sceneText(p), c.aliases));
  });

  const legend = all
    .map(
      (c) =>
        `@image${c.img} = ${c.name}: ${c.desc}${appearsAny[c.img] ? '' : '  (이 화 미등장 — 첨부 불필요)'}`
    )
    .join('\n');

  const head = [
    STYLE_PROMPT,
    '',
    '[캐릭터 레퍼런스] 아래 @imageN 순서대로 레퍼런스 이미지를 첨부하세요. 얼굴·헤어·비율·색은 @imageN 시트와 100% 동일하게 유지합니다. @image1~8 = 고정 캐스트(항상 이 순서), @image9~ = 이 화 단역.',
    legend,
    '※ 각 쪽 [등장]에 적힌 @imageN 캐릭터만 그 컷에 그린다. 나머지는 넣지 않는다.',
    '',
    '[출력 규칙]',
    `- 아래 ${pages.length}개 장면을 각각 독립된 16:9 스프레드 일러스트로 그린다 (총 ${pages.length}장, 쪽 순서대로).`,
    '- 같은 캐릭터의 얼굴·머리·비율·색은 모든 장면에서 동일하게 유지한다.',
    '- 그림 안에 글자·말풍선·문자 텍스트를 절대 넣지 않는다. 상단에 캡션용 여백을 남긴다.',
  ].join('\n');

  const body = pages
    .map((p) => {
      const scene = sceneText(p);
      const on = all.filter((c) => sceneHasChar(scene, c.aliases));
      const appear = on.map((c) => `@image${c.img}(${c.name})`).join(', ');
      return `━━━━━━━━━━ P${p.pageNumber} ━━━━━━━━━━\n[등장] ${appear || '(배경/사물 컷)'}\n${scene.trim()}`;
    })
    .join('\n\n');

  return `${head}\n\n${body}`;
}
