import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { PhonicsTryIt } from '@/features/phonics-learner/components/PhonicsTryIt';
import { HangulBookTryIt, HangulWordGameTryIt } from './HangulBookTryIt';
import { getAllKoreanUnits } from '@/features/phonics-learner/lib/korean-phonics-units';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import { BookCover } from '@/design-system/primitives/BookCover';

/**
 * `/hangul` — 광고 랜딩(상세페이지). 네이버·메타 광고의 도착지.
 *
 * 🔴 **헤드라인에 「무료」를 쓰지 않는다**(2026-08-01 실측 근거).
 *    네이버 검색량: 무료동화책 70 · 무료한글앱 60 · 무료한글공부 50 — 셋 합쳐 180회다.
 *    「받침」 하나가 2,030인 걸 생각하면 사실상 0이고, 이 카테고리에서 무료는 오히려
 *    싸구려 신호로 읽힌다(경쟁사가 「서드파티 광고 없음」을 유료의 근거로 판다).
 *    그래서 혜택은 **본문 끝**에서 처음 꺼낸다 — 이미 읽고 있는 사람에겐 결정을 뒤집는 정보다.
 *
 * 🔴 **마감 날짜를 쓰지 않는다** — 약속하면 오퍼를 접거나 미룰 때 발목이 잡힌다(전사 규칙).
 *    「지금이 베타」까지만.
 *
 * 🔴 **평점·후기 자리를 「직접 해보기」가 대신한다.** 우리는 PWA 라 앱스토어 평점이 0인데
 *    이 카테고리 상세페이지는 전부 평점·후기로 신뢰를 만든다. 증거가 없으면 체험이 증거다
 *    — 블로그 32편에 이미 붙인 그 컴포넌트를 그대로 얹는다.
 *
 * 🔴 **경쟁사 이름을 쓰지 않는다.** 비교는 문제 제기로만 한다(「글자를 뗐는데 읽을 게 없으면」).
 */

/**
 * 실측값 — 2026-08-01 프로덕션 API 기준. 늘어나기만 하므로 낡아도 **과소 주장**이라 안전하다.
 * 다시 재려면:
 *   curl -s https://www.tangobook.co.kr/api/storybooks  → isPublic 필터 후 pageCount 합
 */
const FACTS = {
  books: 266,
  pages: 3835,
  narrated: 264,
  phonicsUnits: 71,
  koreanUnits: 32,
  englishUnits: 39,
  wordCards: 519,
  /**
   * 동화책에서 배우는 **서로 다른** 낱말 수(2026-08-05 전수 실측).
   * 🔴 총합 1,918 이 아니라 **중복 제거 823** 을 쓴다 — 같은 낱말이 여러 책에 나오는데
   *    그걸 다 더하면 아이가 배우는 낱말 수가 두 배 넘게 부풀려진다.
   */
  vocabWords: 823,
  categories: 13,
  /** ko+en+vi+zh+th 제목 번역을 모두 가진 책. 「5개 언어」는 이 숫자로만 말한다. */
  fiveLangBooks: 191,
  /**
   * 🔴 그림체 **종류**(라이브러리 전체 9종)와 **책당 개수**는 다르다. 실측 분포는
   * 0종 97 · 1종 121 · 3종 45 · 4종 3 이라 「한 권을 9가지로」는 거짓이었다(초안에서 잡음).
   * 3종 이상 가진 책만 센다.
   */
  multiStyleBooks: 48,
};

/**
 * 🔴 **공식 서비스 이름**(2026-08-10 사용자 확정) — 「탱고북 한글 파닉스」·「탱고북 영어 파닉스」·
 *    「탱고북 동화책」. 섹션 이름표를 이 셋으로 통일한다. 예전 「동화책 · 어휘와 문해력」처럼
 *    **설명을 이름 자리에 두지 않는다** — 어휘·문해력은 아래 제목과 본문이 이미 말한다.
 */
/** 공개 카테고리 — 권수 desc. 라이브러리 실측(2026-08-01). */
const CATEGORIES: [string, number][] = [
  ['세계 명작', 48],
  ['호리네 생활동화', 43],
  ['전래 동화', 40],
  ['육지 동물 친구들', 26],
  ['공룡 친구들', 21],
  ['호리 유치원동화', 20],
  ['식물 친구들', 18],
  ['호리 세상 탐험', 15],
  ['바다 동물 친구들', 9],
  ['곤충 친구들', 9],
  ['하늘 동물 친구들', 8],
  ['우주와 자연', 6],
  ['우리 몸 이야기', 3],
];

/** 한글 파닉스 다섯 단계 — 커리큘럼과 같은 순서. */
const STAGES: { label: string; count: string; detail: string; tone: string }[] = [
  {
    label: '모음',
    count: '1단원',
    detail: 'ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ',
    tone: 'bg-peach-100 text-ink-800',
  },
  {
    label: '자음',
    count: '14단원',
    detail: 'ㄱ부터 ㅎ까지, 자음 하나에 음절 열 개씩',
    tone: 'bg-coral-100 text-coral-700',
  },
  {
    label: '받침',
    count: '7단원',
    detail: '소리 나는 받침은 일곱뿐입니다',
    tone: 'bg-mint-100 text-mint-700',
  },
  {
    label: '쌍자음',
    count: '5단원',
    detail: 'ㄲ ㄸ ㅃ ㅆ ㅉ — 바람이 아니라 목의 힘',
    tone: 'bg-peach-100 text-ink-800',
  },
  {
    label: '복잡한 모음',
    count: '5단원',
    detail: 'ㅐ ㅔ ㅚ ㅟ ㅘ …',
    tone: 'bg-coral-100 text-coral-700',
  },
];

/** ⑦ 무료체험 마찰 제거 FAQ — 벤치마킹 2차 §4-5(투두 FAQ 아코디언). 답이 전부 「없음」이라 강점. */
const FAQS: { q: string; a: string }[] = [
  {
    q: '설치해야 하나요?',
    a: '아니요. 브라우저에서 바로 열려요 — 태블릿도, 폰도, 거실 TV도 그대로 화면이 됩니다.',
  },
  {
    q: '체험이 끝나면 자동으로 결제되나요?',
    a: '아니요. 카드를 등록하지 않아 저절로 결제될 일이 없어요. 계속 쓸지는 그때 직접 정합니다.',
  },
  { q: '약정이 있나요?', a: '없습니다. 언제든 그만둘 수 있어요.' },
  { q: '아이가 둘이어도 되나요?', a: '됩니다. 아이마다 학습 기록이 따로 쌓여요.' },
];

/**
 * ② 파닉스 ↔ 동화책 **순환** — 넘버링 목록(구 `POINTS` 01~03)을 그림으로 바꿨다(2026-08-10 사용자).
 * 🔴 세 항목이 사실 **한 바퀴**였다: 배운다 → 그 글자로 읽는다 → 독후활동으로 익힌다 → 그게 다시
 *    글자 진도로 돌아온다. 번호를 매기면 서로 무관한 자랑 셋으로 읽히고, 이 페이지의 유일한
 *    구조적 주장(배우는 곳과 읽는 곳이 하나)이 글 속에 묻힌다.
 * 🔴 마지막 「돌아옴」은 노드가 아니라 **닫는 화살표**다 — 노드 넷을 나란히 두면 순환이 아니라
 *    그냥 4단계 절차가 된다.
 */
/**
 * 🔴 **그림이 먼저, 글은 한 줄**(2026-08-10 사용자: "우리꺼 너무 글로 되어 있잖아" — 벤치마크
 *    투두한글이 이 자리를 4:3 일러스트 카드 넉 장으로 설명한다). 이모지 하나로는 「무엇을 하는
 *    화면인지」가 안 보인다 — 각 칸에 **그 장면 사진**을 얹는다.
 * 🔴 **구도 규칙 = 화면이 정면으로 읽히고, 손이 그 위에서 무언가를 하고 있을 것**(2026-08-10 사용자).
 *    처음엔 있는 사진(tracing·siblings)을 그대로 썼는데 하나는 태블릿이 비스듬해 화면이 안 읽혔고
 *    하나는 뒤통수 + 태블릿이 멀어 「보고 있는 사람」으로만 보였다 — 무엇을 하는 화면인지가 안 나온다.
 * 🔴 ③ 은 **사람 없이 화면만**(사용자 판단). 사람을 넣으면 또 「보고 있는 그림」이 되기 쉬운데,
 *    게임은 가로 전체화면이라 **스크린샷 자체가 카드 비율**이고 낱말·그림이 그대로 읽힌다.
 *    실물 스크린샷이라 연출과 달리 어긋날 여지도 없다.
 */
const CYCLE: { photo: string; alt: string; t: string; d: string }[] = [
  {
    photo: 'cycle-learn',
    alt: '아이가 태블릿 화면의 ㄱ 글자를 손가락으로 따라 쓰고 있다',
    t: '글자를 배워요',
    d: `한글 파닉스 ${FACTS.koreanUnits}단원 — 자음·모음부터 받침까지 소리로`,
  },
  {
    photo: 'reading',
    alt: '아이가 태블릿으로 백설공주 동화를 자막과 함께 보고 있다',
    t: '그 글자로 읽어요',
    d: '배운 글자를 동화책에서 낱말과 이야기로 다시 만나요',
  },
  {
    photo: 'cycle-play',
    alt: '그림과 낱말을 잇는 「그림짝 맞추기」 게임 화면 — 아기·고기·가구·야구',
    t: '독후활동으로 익혀요',
    d: '한 낱말을 그림 · 조립 · 따라 그리기 · 손글씨 네 가지로',
  },
];

/** ②의 「없는 것」 아이콘 세트. 벤치마킹 §4-3(핑크퐁 구독특징 4아이콘 구조). */
const NONES: { icon: string; t: string; d: string }[] = [
  { icon: 'adOff', t: '광고 없음', d: '아이 화면에 광고가 안 떠요' },
  { icon: 'unlock', t: '전체 개방', d: '잠긴 것 없이 다 열려요' },
  { icon: 'screens', t: 'TV·폰·태블릿', d: '설치 없이 브라우저에서' },
  { icon: 'noPaper', t: '약정·설치 없음', d: '패드도 약정도 없어요' },
];

/**
 * ⑤ 동화책이 기르는 것 — **어휘·문해력**(2026-08-05 사용자: "동화책에 어휘 문해력 이런걸 좀 강조").
 * 🔴 동화책을 "재미"가 아니라 **파닉스 다음의 학습 단계**로 세운다(벤치마킹 2차: 투두 "기초 문해력
 *    다지기"). 재미로만 두면 부모에겐 부록처럼 읽힌다 — 여기서 어휘가 늘고 읽는 힘이 자란다.
 */
const BOOK_GROWS: { icon: string; t: string; d: string }[] = [
  {
    icon: 'books',
    t: '어휘',
    d: `책마다 새 낱말을 만나고, 독후활동으로 한 낱말을 네 가지 방식으로 익혀요. 지금까지 ${FACTS.vocabWords}개.`,
  },
  {
    icon: 'openBook',
    t: '문해력',
    d: '낱말이 이야기 속에서 어떻게 쓰이는지 만나고 또 만나며, 읽고 이해하는 힘이 자라요.',
  },
  {
    icon: 'headphones',
    t: '읽는 습관',
    d: `${FACTS.narrated}권은 나레이션이 처음부터 끝까지 있어, 글자를 아직 못 읽어도 매일 한 권.`,
  },
];

/**
 * 「왜 파닉스인가」 3카드 — 소중한글 「원리의 이해 / 뛰어난 효과 / 논리력과 사고력」 구조를 가져오되
 * 가운데 칸은 바꿨다. 그쪽 근거는 「2개월 만에 80%」 체험단 데이터라 **우리에겐 그 숫자가 없고**,
 * 없는 걸 흉내 내느니 우리도 참인 것(**처음 보는 글자를 읽는다**)을 세운다.
 * 🔴 **카드마다 그 말을 하는 진짜 앱 화면**(2026-08-11 사용자: "너무 텍스트만 있는 거 아냐?").
 *    처음엔 큰 글자(ㄱ→가→고기)만 얹었는데 그건 결국 또 글자였다. 헤드리스로 실제 활동 세 개를
 *    16:9 로 찍어 얹는다 — **아래 라이브 상자 둘(배우기·써보기)과 겹치지 않는 화면**으로 골라서,
 *    이 구간이 32단원의 다른 얼굴을 보여주게 한다(모음 듣기 · 음절 합체 · 글자 사냥).
 */
const PHONICS_WHY: { shot: string; alt: string; t: string; d: string }[] = [
  {
    shot: 'why-sound',
    alt: '모음 카드 여섯 장을 순서대로 눌러 소리를 듣는 앱 화면',
    t: '소리부터 배워요',
    d: '자음·모음·받침이 저마다 내는 소리를 눌러 듣고 따라 합니다. 글자 모양을 외우지 않아요.',
  },
  {
    shot: 'why-blend',
    alt: 'ㄱ 과 ㅏ 가 하나로 붙어 「가」 가 되는 앱 화면',
    t: '합치는 규칙을 익혀요',
    d: '두 소리가 하나로 붙는 순간을 눈으로 보고, 손으로 씁니다. 여기가 읽기의 출발입니다.',
  },
  {
    shot: 'why-new',
    alt: '비슷한 글자 사이에서 「교」 를 골라내는 앱 화면',
    t: '처음 보는 글자도',
    d: '규칙을 알면 배운 적 없는 낱말도 스스로 소리 내어 읽습니다.',
  },
];
/**
 * 단색 원형 픽토그램 — 🔴 **이모지를 아이콘으로 쓰지 않는다**(2026-08-11 사용자: "깔끔하지가 않아").
 *
 * 실측으로 벤치마크와 가장 크게 갈린 지점이 이것이었다: 소중한글·토도한글 두 페이지 모두
 * 본문 이모지가 **0개**인데 우리는 46개였다. 이모지는 저마다 색·양식·원근이 달라서 넉 장을
 * 나란히 놓으면 한 벌로 안 보이고 잡화점처럼 읽힌다(소중한글은 같은 자리를 코랄 원 + 흰 픽토그램
 * 한 벌로 처리한다).
 * 🔴 새 자산이 필요 없다 — 이 정도 도형은 SVG 몇 줄이라 그림 파일을 만들 이유가 없다.
 */
const PICTS: Record<string, ReactNode> = {
  adOff: (
    <>
      <path d="M4 9.5h3.5L13 5.5v13L7.5 14.5H4z" />
      <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 11V7.5a3.5 3.5 0 0 1 6.6-1.6" />
    </>
  ),
  screens: (
    <>
      <rect x="2.5" y="5" width="13" height="9.5" rx="2" />
      <line x1="7" y1="18" x2="11" y2="18" />
      <rect x="17.5" y="9" width="4" height="10" rx="1.5" />
    </>
  ),
  noPaper: (
    <>
      <path d="M6 3.5h7l5 5v12H6z" />
      <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" />
    </>
  ),
  books: (
    <>
      <rect x="4" y="5" width="4" height="14.5" rx="1.2" />
      <rect x="9.5" y="5" width="4" height="14.5" rx="1.2" />
      <path d="M16 6.8l3.6 1-2.7 12.4-3.6-1z" />
    </>
  ),
  openBook: (
    <>
      <path d="M12 7.5C10.2 6 7.8 5.4 4.5 5.4v12.4c3.3 0 5.7.6 7.5 2 1.8-1.4 4.2-2 7.5-2V5.4c-3.3 0-5.7.6-7.5 2.1z" />
      <line x1="12" y1="7.5" x2="12" y2="19.8" />
    </>
  ),
  headphones: (
    <>
      <path d="M4.5 14.5v-2.2a7.5 7.5 0 0 1 15 0v2.2" />
      <rect x="2.5" y="13.5" width="4.5" height="7" rx="2.2" />
      <rect x="17" y="13.5" width="4.5" height="7" rx="2.2" />
    </>
  ),
};

function Pict({ name }: { name: string }) {
  return (
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-coral-600 text-white">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {PICTS[name]}
      </svg>
    </span>
  );
}

/**
 * 히어로 서비스 카드 — 그림 한 장 + 번호 + 이름 + 한 줄.
 * 🔴 두 장이 **같은 틀**이어야 「우리가 파는 건 이 둘」이 한눈에 읽힌다(하나는 일러스트,
 *    하나는 실제 표지라 내용은 다르지만 틀은 같아야 한다).
 */
function HeroServiceCard({
  n,
  name,
  d,
  children,
}: {
  n: number;
  name: string;
  d: string;
  children: ReactNode;
}) {
  return (
    <div className="h-full overflow-hidden rounded-3xl bg-white/70 text-left shadow-sm">
      {children}
      <div className="px-4 py-3 xl:px-6 xl:py-5">
        <span className="text-sm font-bold text-ink-400">{n}</span>
        <strong className="mt-0.5 block font-display text-xl font-extrabold text-coral-700 break-keep xl:text-3xl">
          {name}
        </strong>
        <span className="mt-0.5 block text-base text-ink-600 break-keep xl:text-lg">{d}</span>
      </div>
    </div>
  );
}

/**
 * 히어로 ② 칸 그림 = **표지 아홉 장**(2026-08-11 사용자: "여러 표지를 때려박아").
 *
 * 🔴 한 장으로는 「동화책이 있다」까지만 말한다 — 이 칸이 팔아야 하는 건 **여러 갈래로 많다**는
 *    것이라, 한 권을 크게 보여주면 오히려 그 한 권짜리로 보인다.
 * 🔴 3×3 이어야 16:9 가 딱 맞는다 — 표지가 16:9 라 3열이면 한 줄 높이가 폭의 3/16 이고,
 *    세 줄이면 9/16 = 정확히 카드 비율이다(2열·4열이면 잘리거나 남는다).
 * 🔴 **라인을 섞어 뽑는다**(명작·전래·자연·생활) — 한 라인에서 아홉 장을 뽑으면 「명작만 있는
 *    앱」으로 읽힌다. 아래 ⑤ 라인 카드와 같은 규칙(`LINES`)을 본다.
 */
function HeroBookCover() {
  const { data } = useStorybooks();
  const books = data ?? [];
  const picked: typeof books = [];
  for (let round = 0; round < 3; round++) {
    for (const l of LINES) {
      const b = books.find((x) => x.coverImage && l.match(x.category ?? '') && !picked.includes(x));
      if (b && picked.length < 9) picked.push(b);
    }
  }
  if (picked.length < 9) return <div className="aspect-video w-full bg-cream-100" />;
  return (
    <div className="grid aspect-video w-full grid-cols-3 gap-px bg-cream-200">
      {picked.map((b) => (
        <div key={b.id} className="aspect-video overflow-hidden bg-cream-100">
          <BookCover book={b} lang="ko" className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

const SIGNUP = '/login?mode=signup';

/**
 * 랜딩이 통째로 여는 단원 — ㄱ(한글1 두 번째).
 * 🔴 **스크린샷을 쓰지 않는다**(2026-08-01 사용자: "찍어서 가지고 오지말고 아예 구현을 하라니까").
 *    아홉 개가 전부 앱에서 도는 그 컴포넌트다. 배선은 `KoreanPhonicsActivity` 하나를 재사용한다.
 * 🔴 높이는 활동마다 다르다 — 격자가 큰 게임은 500px 이면 아래가 잘린다.
 */
const GA_UNIT = 'kr-h1-u02';
/**
 * 🔴 **아홉 → 넷 → 둘 → 다시 아홉**(2026-08-11 사용자: "2개밖에 없는데 많이 넣어주고, 게임 포함,
 *    써보기도"). 길이를 줄이려고 둘까지 깎았는데, 그러면 이 페이지에서 가장 센 자산 —
 *    **한 단원이 통째로 도는 것** — 을 스스로 감춘 셈이 된다. 단원 전체(익히기 넷 + 낱말 놀이
 *    다섯)를 그대로 얹는다.
 * 🔴 게임 넷과 「낱말 연습」은 상자가 `100dvh` 다(`PhonicsTryIt.VIEWPORT_SIZED`) — 안에서 `vh` 로
 *    칸을 재기 때문. 그래서 이 구간이 길어지는 건 구조상 어쩔 수 없고, 대신 상자마다 note 를
 *    달리해 같은 화면이 아홉 번 반복되는 것처럼 읽히지 않게 한다.
 * ⚠️ 이게 맞는지는 여전히 **측정이 아니라 판단**이다 — 상자마다 `tryit_view` 를 쏘고 있으므로
 *    도달률이 쌓이면 그 숫자로 다시 자를 것.
 */
const GA_LEARN = [
  { key: 'consonant-tap', h: 520, note: '글자 이름이 아니라 소리를 먼저 귀에 넣습니다.' },
  {
    key: 'blend-listen',
    h: 520,
    note: '두 글자가 합쳐지는 순간을 눈으로 봅니다 — 이게 읽기의 출발입니다.',
  },
  {
    key: 'consonant-write',
    h: 560,
    note: '손이 기억합니다. 획순대로 따라 쓰고 99% 를 채워야 넘어갑니다.',
  },
  { key: 'letter-hunt', h: 560, note: '비슷한 글자 사이에서 오늘 배운 글자를 골라냅니다.' },
  { key: 'word-listen-choose', h: 620, note: '소리만 듣고 고릅니다 — 눈이 아니라 귀로 하는 활동.' },
  { key: 'game-dots', h: 620, note: '낱말이 가리키는 그림을 손으로 칠해 완성합니다.' },
  { key: 'game-korean-block', h: 620, note: '자모를 끌어다 낱말을 조립합니다.' },
  { key: 'game-word-writing', h: 620, note: '낱말 전체를 왼쪽부터 순서대로 씁니다.' },
  {
    key: 'game-line-matching',
    h: 620,
    note: '서른두 단원이 전부 이렇게 생겼습니다 — 익히기 넷에 낱말 놀이 다섯.',
    cta: true,
  },
];

/**
 * 스크롤에 따라 나타나는 하단 고정 CTA — 첫 화면에서는 히어로 버튼이 있으니 숨긴다.
 *
 * 🔴 **체험 상자가 화면에 있으면 숨는다**(2026-08-01). 상자들이 뷰포트 높이만큼 크기 때문에
 *    고정 바가 그 아래를 덮는다 — 실제로 그림 짝 찾기의 마지막 줄과 게임 버튼을 가렸다.
 *    「직접 해보세요」라고 해놓고 그 화면을 가리는 건 앞뒤가 안 맞는다.
 */
function StickyCta() {
  const [show, setShow] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 560);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // 상자가 화면 아래쪽(고정 바가 앉는 자리)을 차지하는지 본다.
    const boxes = document.querySelectorAll('div.my-7');
    const io = new IntersectionObserver(
      (entries) => {
        const hit = new Set<Element>();
        entries.forEach((e) => (e.isIntersecting ? hit.add(e.target) : hit.delete(e.target)));
        setBlocked(entries.some((e) => e.isIntersecting) || hit.size > 0);
      },
      // 화면 아래 120px 만 관심 대상 — 상자가 거기 걸치면 바를 내린다.
      { rootMargin: `-${Math.max(0, window.innerHeight - 120)}px 0px 0px 0px` }
    );
    boxes.forEach((b) => io.observe(b));
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-coral-200 bg-cream-50/95 px-4 backdrop-blur transition-all duration-300 sm:px-6 ${
        show ? 'translate-y-0' : 'translate-y-full'
      } ${blocked ? 'py-1.5' : 'py-3'}`}
    >
      {/* 🔴 **가격을 쓰지 않는다**(2026-08-11 사용자, 세 번째 지적) — 히어로에서 지웠는데
          하단 바와 요금 문단에 사본이 남아 있었다. 파는 건 「한 달 무료」 하나다. */}
      <div className="mx-auto flex max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1280px] items-center justify-center gap-3">
        <Link
          to={SIGNUP}
          className="flex min-h-[44px] shrink-0 items-center rounded-full bg-coral-700 px-5 text-base font-bold text-white shadow-sm transition hover:bg-coral-800"
        >
          한달 무료 체험
        </Link>
      </div>
    </div>
  );
}

/**
 * 🔴 `note` = 숫자 밑 **근거 각주**(2026-08-05 벤치마킹). 경쟁사가 "78%(2026.5 기준)"처럼
 *    수치에 기준을 붙여 전문적으로 보이게 한다. 우리는 후기가 없어 이 각주가 후기 대체재다
 *    — "직접 세어 검증 가능"이라 신뢰 축이 다르다.
 */
function Stat({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-3xl bg-white/70 px-3 py-4">
      <span className="font-display text-3xl font-extrabold text-coral-700 sm:text-4xl">
        {value}
      </span>
      <span className="text-center text-sm font-semibold text-ink-600 break-keep sm:text-sm">
        {label}
      </span>
      {note && (
        <span className="text-center text-[12px] leading-snug text-ink-400 break-keep">{note}</span>
      )}
    </div>
  );
}

/**
 * 랜딩 사진 — **분위기만** 맡는다.
 *
 * 🔴 캡션을 달지 않는다. 캡션이 붙으면 주장이 되고, 주장이 붙으면 없는 후기처럼 읽힌다.
 *    (경쟁사는 얼굴 사진 + `mis***님` + 후기 문장을 붙이지만 우리는 그 후기가 없다.)
 * 🔴 태블릿 화면에 **AI 가 그린 UI 를 두지 않는다** — 가짜 화면이 우리 화면인 척하면 안 되고,
 *    한글 글자도 깨져 나온다. 화면을 보여줄 땐 앱을 실제로 띄워 찍어 원근 합성한다
 *    (`packages/server/scripts/composite-screen-into-photo.mjs`). 지금 화면이 든 사진은
 *    `hero`(책장) · `siblings`(단원) · `reading`(뷰어) · `tv`(뷰어) · `tracing`(ㄱ 써보기)
 *    다섯. 나머지 둘은 화면 면이 카메라를 향하지 않아 넣을 자리가 없다. 진짜 화면은 이
 *    페이지에서 **살아서도 돌고 있다**(활동 9개 + 동화책).
 * 🔴 `width`/`height` 를 반드시 준다 — 안 주면 사진이 도착할 때 아래 글이 밀린다(CLS).
 */
function Photo({
  src,
  alt,
  w,
  h,
  eager,
  className = '',
}: {
  src: string;
  alt: string;
  w: number;
  h: number;
  eager?: boolean;
  className?: string;
}) {
  return (
    <img
      src={`/landing/hangul/${src}.webp`}
      alt={alt}
      width={w}
      height={h}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`w-full rounded-3xl object-cover shadow-sm ${className}`}
    />
  );
}

/**
 * 한글 파닉스 **전 단원 목록**. 요약 다섯 줄만 두면 「32단원」이 숫자로만 남는다 —
 * 단원 이름을 다 펼쳐야 분량이 눈에 보인다(2026-08-02 사용자: "있는 거 다 자랑해야해").
 * 🔴 목록을 손으로 적지 않는다 — 앱이 쓰는 커리큘럼(`getAllKoreanUnits`)을 그대로 읽어서,
 *    단원이 늘면 이 화면도 같이 늘어난다. 복습 단원은 배지로 구분한다.
 */
function CurriculumUnits() {
  const units = getAllKoreanUnits();
  const levels = [...new Map(units.map((u) => [u.levelKey, u.levelName])).entries()];
  const clean = (t: string) => t.replace(/^unit\s*\d+\s*:\s*/i, '');
  return (
    <div className="!mt-6 space-y-3">
      {levels.map(([key, name]) => (
        <div key={key} className="rounded-3xl border border-ink-100 bg-white/70 p-4">
          <p className="text-sm font-bold text-coral-700 break-keep">
            {name}
            <span className="ml-2 font-semibold text-ink-600">
              {units.filter((u) => u.levelKey === key && !u.isReview).length}단원
              {units.filter((u) => u.levelKey === key && u.isReview).length > 0 &&
                ` + 복습 ${units.filter((u) => u.levelKey === key && u.isReview).length}`}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {units
              .filter((u) => u.levelKey === key)
              .map((u) => (
                <span
                  key={u.id}
                  className={`rounded-full px-2.5 py-1 text-sm break-keep ${
                    u.isReview ? 'bg-mint-100 font-bold text-mint-700' : 'bg-cream-100 text-ink-700'
                  }`}
                >
                  {u.isReview ? '🏅 ' : ''}
                  {clean(u.unitTitle)}
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 동화책 **라인 4개** — 이 페이지의 차별점(2026-08-11 사용자: "동화책이 차별점").
 *
 * 🔴 13개 카테고리를 그대로 늘어놓지 않는다 — 이름 열셋은 목록이지 「무엇이 있나」가 아니다.
 *    부모가 기억할 수 있는 **네 덩어리**로 묶고, 넷을 더하면 정확히 266권이 된다
 *    (48 + 40 + 78 + 100). 숫자가 딱 떨어지는 게 이 묶음의 근거다.
 */
const LINES: { name: string; n: number; d: string; match: (c: string) => boolean }[] = [
  {
    name: '세계 명작',
    n: 48,
    d: '누구나 아는 이야기 — 같은 책을 그림체를 바꿔 가며 볼 수 있어요.',
    match: (c) => c === '세계 명작',
  },
  {
    name: '전래 동화',
    n: 40,
    d: '우리 옛이야기 — 지게·엽전·꽃신처럼 우리 것을 낱말로 만납니다.',
    match: (c) => c === '전래 동화',
  },
  {
    name: '호리 시리즈',
    n: 78,
    d: '아기호랑이 호리가 나오는 창작 동화 — 생활 습관 · 유치원 · 세상 탐험.',
    match: (c) => c.startsWith('호리') || c === '생활동화',
  },
  {
    name: '자연 관찰',
    n: 100,
    d: '공룡·곤충·바다·우주·우리 몸 — 실제 사진으로 보는 논픽션.',
    match: (c) =>
      c.endsWith('친구들') || ['식물 친구들', '우주와 자연', '우리 몸 이야기'].includes(c),
  },
];

/**
 * 라인마다 **표지 여섯 장**(2026-08-11 사용자: "그냥 카테고리별로 6개씩 보여주자").
 *
 * 🔴 예전엔 **라인 카드(표지 2장) + 표지벽(15장)** 둘이 나란히 있었다. 벽은 라인을 안 나누고
 *    카드는 두 장뿐이라, 같은 표지를 두 번 보여주면서 정작 **어느 라인에 무엇이 있는지**는
 *    양쪽 다 못 보여줬다(사용자: "이렇게 있으니까 좀 중복이네"). 하나로 합친다 —
 *    **라인 이름 → 표지 여섯 → 설명 한 줄**.
 * 🔴 여섯인 이유 = 3열(모바일)·6열(데스크탑) 어느 쪽에도 줄이 딱 떨어진다.
 * 🔴 **눌리게 한다** — 벽지처럼 흘려보내면 눈으로만 지나간다.
 * 🔴 셀에 `aspect-video` 필수 — 없으면 표지가 도착할 때까지 셀 높이가 0이라 페이지가 자라며
 *    읽던 줄이 밀려 내려간다(실측).
 * 🔴 선두 번호(`15. 편지 배달 왔어요`)는 저작도구 정렬용이라 떼고 보여준다.
 */
const cleanTitle = (t?: string) =>
  (t ?? '')
    .replace(/^\s*\d+\.\s*/, '')
    .replace(/\s*\(L\d+\)\s*$/, '')
    .trim();

function LineSections() {
  const { data } = useStorybooks();
  const books = data ?? [];
  return (
    <div className="!mt-6 space-y-8">
      {LINES.map((l) => {
        // 같은 이야기의 난이도 변형(`__L4`)은 제목이 같아 한 라인에 두 번 선다 — 제목으로 걸러낸다.
        const seen = new Set<string>();
        const picked = books
          .filter((b) => {
            if (!b.coverImage || !l.match(b.category ?? '')) return false;
            const t = cleanTitle(b.title);
            if (!t || seen.has(t)) return false;
            seen.add(t);
            return true;
          })
          .slice(0, 6);
        if (picked.length < 6) return null;
        return (
          <div key={l.name}>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-2xl font-extrabold text-ink-900 break-keep sm:text-3xl lg:text-[33px] xl:text-[38px]">
                {l.name}
              </h3>
              <span className="text-base font-bold text-coral-700">{l.n}권</span>
            </div>
            {/* 🔴 **모바일은 옆으로 미는 줄**(2026-08-11 사용자) — 375px 에서 3×2 격자로 깔면
                표지가 105px 짜리 우표가 되고 세로만 먹는다. 라이브러리 캐러셀과 같은 규칙:
                ①줄을 섹션 패딩 **밖으로 흘려** 표지를 160px 로 유지하고(패딩 안에 가두면 343px 라
                또 줄여야 한다) ②카드 폭이 줄에 **딱 나눠떨어지지 않게** 둔다 — 오른쪽에 걸치는
                31px 이 "옆에 더 있다"는 유일한 신호다. `sm:` 부터는 6장 격자 그대로. */}
            <div
              role="region"
              aria-label={`${l.name} 표지`}
              className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-6 sm:gap-3 sm:overflow-visible sm:px-0"
            >
              {picked.map((b) => (
                <Link
                  key={b.id}
                  to={`/library/${b.id}`}
                  className="aspect-video w-40 shrink-0 overflow-hidden rounded-2xl bg-cream-100 sm:w-auto"
                  title={cleanTitle(b.title)}
                >
                  <BookCover book={b} lang="ko" loading="lazy" className="h-full" />
                </Link>
              ))}
            </div>
            <p className="mt-2 text-base text-ink-600 break-keep lg:text-lg xl:text-[20px]">
              {l.d}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 서비스 구분 배너 — 🔴 이 랜딩은 **서비스 둘**을 판다(파닉스 · 동화책). 배너 없이 섹션만
 * 이어 놓으면 어디부터 다른 서비스인지 안 보인다(2026-08-10 사용자: "2개 서비스 설명하는
 * 건데 구분이 안 지어져 있어"). 굵은 가로선 + 큰 이름으로 페이지를 두 덩어리로 끊는다.
 * 🔴 배너가 이름을 맡으므로 **그 아래 섹션은 eyebrow 를 비운다** — 이름을 두 번 말하지 않는다.
 */
/**
 * 서비스 표제 — 🔴 **색 밴드로 장을 가른다**(2026-08-11 사용자: "제목인데 제목인 느낌이 안 나네,
 * 그냥 검정색 텍스트로 쓰니까").
 *
 * 예전엔 얇은 코랄 선 + 검은 글씨라, 크림 배경 위에서 **아래 본문 소제목들과 같은 무게**였다.
 * 이 페이지는 서비스가 둘이고 그 경계가 구조의 전부인데, 경계를 선 하나로만 그으니
 * 스크롤하다 보면 어디서 다음 이야기가 시작되는지 안 보였다.
 * 🔴 **전폭 밴드**(좌우 여백 없이)여야 장 표지로 읽힌다 — 안쪽에 가두면 또 하나의 카드가 된다.
 * 🔴 번호는 원 배지가 맡으므로 「서비스 N」 라벨을 따로 쓰지 않는다(같은 말 두 번).
 */
function ServiceBanner({ n, name, tagline }: { n: number; name: string; tagline?: string }) {
  return (
    <div className="mt-14 bg-gradient-to-br from-coral-500 to-coral-700 px-4 py-10 text-center sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1280px]">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/25 font-display text-2xl font-extrabold text-white sm:h-12 sm:w-12 sm:text-3xl">
          {n}
        </span>
        <h2 className="mt-4 font-display text-[35px] font-extrabold leading-tight text-white break-keep sm:text-[50px] xl:text-[61px]">
          {name}
        </h2>
        {tagline && (
          <p className="mx-auto mt-3 max-w-xl text-[18px] leading-relaxed text-white/85 break-keep sm:text-lg">
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  /** 🔴 `ReactNode` — 제목 안 **핵심어를 코랄로** 물들이려고(2026-08-11 사용자: "폰트가 너무
   *  단조롭네, 검은색이 제일 많고"). 히어로 h1 은 진작 그렇게 하고 있었는데 섹션 제목만 string 이었다. */
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1280px]">
        {eyebrow && (
          /* 🔴 **라벨을 키운다**(2026-08-10 사용자: "이게 메인 제목인거 같은데 왜 글씨가 제일 작아?").
             12px 는 각주 크기라 섹션 이름이 아니라 곁다리로 읽혔다. 제목보다는 확실히 작게 두되
             본문과 같은 무게로 올린다 — 순서는 [섹션 이름] → [질문 제목] 그대로다. */
          <p className="mb-2 text-base font-extrabold tracking-wide text-coral-700 sm:text-lg xl:text-xl">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[31px] font-extrabold leading-snug text-ink-900 break-keep sm:text-[38px] lg:text-[45px]">
          {title}
        </h2>
        <div className="mt-5 space-y-5 text-[18px] leading-relaxed text-ink-700 break-keep sm:text-[19px] lg:space-y-6 lg:text-[22px] lg:leading-[1.8] xl:text-[25px]">
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * ② 파닉스 ↔ 동화책 순환 그림.
 * 🔴 화살표는 **한 글자를 회전**시켜 쓴다(`rotate-90 sm:rotate-0`) — 모바일은 세로로 쌓이니 ↓ 가
 *    맞는데, `max-sm:` 계열 변형은 이 프로젝트에서 아예 생성되지 않는다(`screens.short:{raw}` 가
 *    Tailwind 의 max-* 를 통째로 막는다). 그래서 모바일 base(회전) → `sm:` 에서 원위치.
 */
function LearnReadCycle() {
  return (
    <div className="!mt-6 rounded-3xl border border-coral-200 bg-white/70 p-4 sm:p-5">
      <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-3">
        {CYCLE.map((c, i) => (
          <Fragment key={c.t}>
            {i > 0 && (
              <span
                aria-hidden
                className="self-center justify-self-center rotate-90 text-3xl font-extrabold text-coral-400 sm:rotate-0"
              >
                →
              </span>
            )}
            <div className="overflow-hidden rounded-3xl bg-cream-100 text-center">
              {/* 🔴 사진은 카드 **맨 위 전폭**, 비율 고정(4:3) — 셋의 원본 비율이 제각각이라
                  `object-cover` 로 잘라 맞춰야 세 칸의 높이가 같다. */}
              <img
                src={`/landing/hangul/${c.photo}.webp`}
                alt={c.alt}
                loading="lazy"
                decoding="async"
                /* 🔴 모바일은 **16:9**(세로로 셋이 쌓여서 4:3 이면 이 구간만 2화면을 먹는다),
                   `sm` 부터 4:3 — 가로로 셋이 서면 높이가 문제되지 않고 사진도 더 크게 보인다. */
                className="aspect-video w-full object-cover sm:aspect-[4/3]"
              />
              <div className="p-3 sm:p-4">
                <strong className="block font-display text-lg font-extrabold text-ink-900 break-keep sm:text-xl">
                  {c.t}
                </strong>
                <span className="mt-1 block text-[15px] leading-snug text-ink-600 break-keep">
                  {c.d}
                </span>
              </div>
            </div>
          </Fragment>
        ))}
      </div>
      {/* 닫는 화살표 — 여기가 「순환」의 실체다. 실제로 그렇게 동작한다(`groupBySyllable` 이 한글
          낱말 이벤트를 글자로 쪼개 파닉스 칸에 얹는다). ↩ 는 위 첫 칸으로 되돌아감을 가리킨다. */}
      <div className="mt-3 flex items-center gap-3 rounded-3xl border-2 border-dashed border-coral-300 bg-coral-50 px-4 py-3">
        <span aria-hidden className="shrink-0 text-3xl font-extrabold text-coral-700">
          ↩
        </span>
        <p className="text-[17px] leading-snug text-ink-700 break-keep sm:text-[18px]">
          그리고 <strong className="text-coral-700">읽은 게 다시 글자 진도로 돌아옵니다</strong> —
          동화책에서 「고기」를 맞히면 파닉스 표의 고 · 기 칸이 함께 올라가요.
        </p>
      </div>
    </div>
  );
}

export default function HangulLandingPage() {
  useSeo({
    title: `한글 파닉스 ${FACTS.koreanUnits}단원 + 다양한 동화책 — 탱고북`,
    description:
      '자음·모음부터 받침·쌍자음까지 한글 파닉스 32단원, 영어 파닉스 39단원. 그리고 배운 글자로 바로 읽는 생활동화·세계명작·전래동화·자연관찰 동화책이 매달 늘어납니다. 4~7세 한글떼기. 한 달 무료로 써 보고 정하세요.',
    path: '/hangul',
    // 🔴 나이 키워드는 5·6세에 몰려 있다(실측 2026-08-01): 5세한글공부 1,140 · 6세한글공부 940 ·
    //    7세 290 · 4세 220 · 3세 60. 제품은 4~7세가 맞지만, 그 표현만 쓰면 2,080 을 못 받는다.
    keywords:
      '5세 한글공부, 6세 한글공부, 한글앱, 한글 파닉스, 한글떼기, 한글떼는시기, 자음모음, 받침, 파닉스앱, 7세 한글공부, 4세 한글공부',
  });

  return (
    <div className="min-h-dvh bg-cream-50 pb-24">
      {/* ── ① 히어로 ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-b from-peach-100 via-peach-50 to-cream-50 px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
        <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-coral-100/60 blur-3xl" />
        {/* 🔴 로고를 큼지막하게 맨 위에(2026-08-05 사용자) — 브랜드가 먼저다. width/height 로 CLS 방지. */}
        {/* 🔴 **로고를 크게**(2026-08-11 사용자: "너무 작다 확 키워"). 64/80px 은 앱 헤더 크기라
            광고 랜딩 첫 화면에선 각주처럼 보였다 — 광고를 보고 들어온 사람이 처음 확인하는 건
            "여기가 어디냐"다. 2:1 비율이라 144px 이면 폭 288px, 375px 화면에서도 넉넉하다.
            🔴 이만큼 키워도 **모바일 CTA 는 접힘선 위**(812px 화면에서 하단 692px). */}
        <Link to="/library" aria-label="탱고북 홈" className="relative mx-auto mb-5 block w-fit">
          <img
            src="/logo/logo-kr.webp"
            alt="탱고북"
            width={1774}
            height={887}
            className="h-28 w-auto sm:h-32 md:h-36 xl:h-40"
          />
        </Link>
        {/* 🔴 **표지 슬라이더를 없앴다**(2026-08-11 사용자). 로고 바로 아래에서 표지 열넷이 계속
            흘러 첫 화면의 시선을 가져갔고, 정작 「무엇을 파는가」(아래 서비스 두 장)는 그 밑이었다.
            동화책이 이만큼 있다는 말은 ⑤ 라인 카드·표지벽이 더 크게 한다. */}
        {/* 🔴 **한 열 가운데 정렬**(2026-08-11) — 예전엔 오른쪽에 파닉스 일러스트를 세운 2열이었는데,
            그 그림이 아래 서비스 카드 ①의 그림이 되면서 오른쪽 열이 비었다. 벤치마크 둘 다
            히어로가 가운데 정렬 한 열이다. */}
        {/* 🔴 **히어로는 읽는 영역이 아니다**(2026-08-11 사용자: "넌 이 정도면 맞다고 생각해?").
            본문 폭(896px)은 **글줄 길이** 기준이라 프로즈엔 맞지만, 첫인상 영역까지 그 규칙을
            먹이니 1920~2560 에서 크림색 여백 위에 콘텐츠가 섬처럼 떴다. 히어로만 xl 부터 넓히고
            글자도 한 단계 더 올린다 — 본문은 안 따라간다(글줄이 길어지면 읽기가 나빠진다). */}
        <div className="relative mx-auto max-w-3xl text-center lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1280px]">
          <p className="inline-flex rounded-full bg-coral-100 px-4 py-1.5 text-base font-extrabold text-coral-700 sm:text-lg xl:px-5 xl:py-2 xl:text-xl">
            4~7세 한글파닉스 · 동화책
          </p>
          {/* 🔴 **데스크탑에선 한 줄**(2026-08-10). 42px 로는 24자가 본문 폭(896px)을 넘어 세 줄로 접혔다. */}
          <h1 className="mt-3 font-display text-[33px] font-extrabold leading-[1.25] text-ink-900 break-keep sm:whitespace-nowrap sm:text-[35px] md:text-[42px] xl:text-[54px]">
            <span className="text-coral-700">한글 파닉스</span>를 배우고{' '}
            <span className="text-coral-700">스스로 동화책을 읽어요</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[18px] leading-relaxed text-ink-700 break-keep sm:text-[21px] lg:max-w-3xl lg:text-[24px] xl:max-w-4xl xl:text-[27px] 2xl:text-[30px]">
            자음·모음부터 받침까지 <strong className="text-coral-700">소리로 한글을 떼고</strong>,
            뗀 글자로 <strong className="text-coral-700">동화책을 바로 읽습니다.</strong> 배우는
            곳과 읽는 곳이 같은 앱 안에 있어요.
          </p>

          {/* 🔴 **서비스 두 장에 각각 그림**(2026-08-11 사용자: "호랑이 가나다 이미지를 한글파닉스
              대응 이미지로 쓰고, 동화책에 대응 이미지 하나 넣어줘"). 글자 두 줄짜리 칸이던 걸
              그림 카드로 올린다 — 이 페이지가 파는 게 둘이라는 걸 첫 화면에서 **그림으로** 말한다.
              ② 는 새 자산을 만들지 않고 **라이브러리의 진짜 표지**를 그대로 세운다(그림체가 다른
              일러스트를 새로 그리면 ①과 톤이 갈린다). */}
          {/* 🔴 **모바일도 2열**(2026-08-11) — 세로로 쌓으면 카드 둘이 580px 를 먹어 CTA 가
              접힘선 아래로 내려간다. 첫 화면에 버튼이 있어야 한다. */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:gap-4 xl:max-w-4xl xl:gap-6">
            <HeroServiceCard n={1} name="한글 파닉스" d={`${FACTS.koreanUnits}단원 · 소리로 떼기`}>
              <img
                src="/landing/hangul/phonics.webp"
                alt="아기호랑이가 가·나·다 한글 블록을 갖고 노는 그림"
                width={1400}
                height={788}
                className="aspect-video w-full object-cover"
              />
            </HeroServiceCard>
            <HeroServiceCard n={2} name="동화책" d="세계 명작 · 전래동화 · 자연 관찰 · 생활동화">
              <HeroBookCover />
            </HeroServiceCard>
          </div>

          <Link
            to={SIGNUP}
            className="mt-8 inline-flex min-h-[68px] items-center rounded-full bg-coral-700 px-12 text-2xl font-extrabold text-white shadow-lg transition hover:bg-coral-800 xl:mt-10 xl:min-h-[104px] xl:px-20 xl:text-[35px]"
          >
            한달 무료 체험
          </Link>
        </div>
      </header>

      {/* ── ③ 파닉스 커리큘럼 (데모보다 먼저 — 아래 데모가 32개 중 하나임을 알고 보게) ─────────────────────────────────── */}
      {/* 🔴 **가르치는 법을 설명하지 않는다**(2026-08-05 사용자: "이런 얘기는 안 해도 됨.
          그냥 우리가 이걸 컨텐츠를 가지고 있다고만 언급하면 됨"). 「기역은 이름이지 소리가
          아니다」는 우리끼리 옳은 얘기고, 부모가 이 자리에서 궁금한 건 **뭐가 얼마나 있나**다.
          제목도 「이름이 아니라 소리부터」에는 정작 **한글**이 안 들어 있었다. */}
      <ServiceBanner
        n={1}
        name="탱고북 한글 파닉스"
        tagline="자음·모음부터 받침·쌍자음까지, 소리로 글자를 뗍니다."
      />

      {/* ── ③-0 파닉스가 뭔가요 — **서비스 1 자리에선 파닉스만 말한다**(2026-08-11 사용자)
          🔴 **「가르치는 법을 설명하지 않는다」(2026-08-05)를 뒤집는다.** 그때는 부모가 궁금한 게
             「뭐가 얼마나 있나」라고 봤는데, 벤치마크 둘 다 파닉스 상세 첫머리를 **파닉스가 뭔지**로
             연다(소중한글 「한글 파닉스란?」·「파닉스로 배워야 하는 이유」 3카드 / 토도 「자모음절식
             학습법」 + "'김밥'은 읽는데 '김'은 못 읽는다고요?"). 이 카테고리에서 부모가 실제로 갖는
             질문이 그것이고, 답하지 않으면 32단원 숫자가 무슨 뜻인지 모른 채 지나간다.
          🔴 **베낀 것 = 구조와 논점, 문장이 아니다.** 후크는 우리 낱말로 다시 썼고(김밥/김 → 바나나/바),
             🔴 **소중한글의 「2개월 만에 80%」·「전문가 23명」·토도의 「교수 감수」는 안 쓴다** —
             우리에겐 그 데이터도 감수도 없다(전사 규칙).
          🔴 카드에 이모지·아이콘 대신 **글자 자체(ㄱ → 가 → 고기)** 를 크게 세운다. 셋을 나란히
             보면 자모→음절→낱말이 그림 없이도 읽히고, 검은 글씨만 이어지던 이 구간에 색이 생긴다. */}
      <Section
        eyebrow="왜 파닉스인가"
        title={
          <>
            「바나나」는 읽는데 <span className="text-coral-700">「바」는 못 읽어요</span>
          </>
        }
      >
        <p>
          통글자로 외운 아이는 <strong>아는 낱말만</strong> 읽습니다. 처음 보는 낱말 앞에서는 다시
          멈춰요.
        </p>
        <p>
          <strong className="text-coral-700">파닉스는 글자가 가진 소리를 배우는 방법</strong>
          입니다. 한글은 소리와 글자가 그대로 맞물리는 문자라(ㄱ은 그, ㅏ는 아, 둘을 합치면 가) —
          소리를 알면 <strong>배운 적 없는 글자도 읽습니다.</strong>
        </p>
        <div className="!mt-6 grid gap-3 sm:grid-cols-3">
          {PHONICS_WHY.map((w) => (
            <div key={w.t} className="overflow-hidden rounded-3xl bg-white/70 text-center">
              <img
                src={`/landing/hangul/${w.shot}.webp`}
                alt={w.alt}
                loading="lazy"
                decoding="async"
                className="aspect-video w-full object-cover"
              />
              <div className="p-4 sm:p-5">
                <strong className="block font-display text-xl font-extrabold text-ink-900 break-keep lg:text-2xl xl:text-3xl">
                  {w.t}
                </strong>
                <span className="mt-1.5 block text-base leading-snug text-ink-600 break-keep lg:text-lg xl:text-[20px]">
                  {w.d}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section
        title={
          <>
            한글 파닉스 <span className="text-coral-700">{FACTS.koreanUnits}단원</span>
          </>
        }
      >
        {/* 뷰 1 — 단계(여정). 자음·모음 → 받침 → 쌍자음 → 복잡한 모음, 번호로 밟는 길. */}
        <p>
          자음·모음에서 시작해 받침·쌍자음·복잡한 모음까지, <strong>다섯 단계</strong>로 차근차근
          밟아요. 한 단원은 하루 10~15분 분량이에요.
        </p>
        <ol className="!mt-5 space-y-2">
          {STAGES.map((s, i) => (
            <li
              key={s.label}
              className="flex items-center gap-3 rounded-3xl border border-ink-100 bg-white/70 px-4 py-3 lg:px-5 lg:py-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-700 text-sm font-extrabold text-white lg:h-9 lg:w-9 lg:text-base">
                {i + 1}
              </span>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold lg:text-base ${s.tone}`}
              >
                {s.count}
              </span>
              <span className="min-w-0">
                <strong className="text-ink-900 xl:text-xl">{s.label}</strong>
                <span className="ml-2 text-base text-ink-600 break-keep lg:text-lg xl:text-[20px]">
                  {s.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
        {/* 뷰 2 — 능력 축 매트릭스(같은 32단원을 "무엇이 언제 자라나"로). 두 겹이 "체계적"의 정체. */}

        {/* 🔴 **단원 칩 전체 목록(`CurriculumUnits`)과 설명 세 문단을 지웠다**(2026-08-05 사용자).
            32개를 다 늘어놓으면 위 다섯 줄 요약과 같은 말을 두 번 하는 셈이고, 화면 두 개 분량이
            지나가는 동안 아래 「직접 해보기」가 그만큼 멀어진다. 컴포넌트는 남겨 뒀다. */}
        <p className="!mt-6">
          영어 파닉스 <strong>{FACTS.englishUnits}단원</strong>도 같이 들어 있습니다.
        </p>
        {/* 🔴 여기엔 연출 사진을 두지 않는다(2026-08-10 사용자). 바로 아래가 「직접 해보기」라
            **진짜 화면이 곧 나오는데** 그 앞에 태블릿 사진을 800px 깔면 도달만 늦어진다.
            (합성본은 `public/landing/hangul/siblings.webp` 에 남아 있다.) */}
        <Link
          to="/library/phonics/korean"
          className="!mt-5 inline-flex min-h-[44px] items-center rounded-full border-2 border-coral-500 px-6 text-base font-bold text-coral-700 transition hover:bg-coral-50"
        >
          커리큘럼 전체 보기 →
        </Link>
      </Section>

      {/* ── ④ 직접 해보기 — 그 32단원 중 「ㄱ」 하나를 통째로 ───────────────────── */}
      {/* 🔴 **상한 1280px**(2026-08-11 사용자: "가로폭이 너무 넓은 거 같은데") — 1600 까지 늘렸더니
          26px 본문이 한 줄에 60자를 넘어 눈이 줄 끝에서 처음으로 돌아오지 못했다. 전 섹션 공통 상한.
          🔴 **데모 상자는 글 폭을 따르지 않는다**(2026-08-11 사용자: "낱말이 너무 작아 보여").
          `EmbedStage` 는 안쪽을 **100vw 로 그린 뒤 상자 폭/뷰포트 폭** 만큼 축소한다 — 즉
          **화면이 넓어질수록 앱 화면이 더 작아진다**(2000px 에서 1024px 상자면 0.51배). 글 폭에
          가둔 게 원인이라, 여기만 화면을 따라 넓힌다(2000px → 1600px 상자 → 0.8배). */}
      <section className="px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1280px]">
          <div className="rounded-3xl border border-coral-200 bg-white/60 p-4 sm:p-6">
            <p className="text-sm font-bold tracking-wide text-coral-700">한글 파닉스 · 32단원</p>
            <h2 className="mt-1 font-display text-[31px] font-extrabold text-ink-900 break-keep sm:text-[38px]">
              「ㄱ」 단원 학습 샘플
            </h2>
            {/* 🔴 **이 한 줄이 이 페이지에서 가장 센 주장이다**(2026-08-05 사용자: "엄청 강조해서
                보여줘야지. 폰트 크기나 색깔 다 똑같이 나오니까 실제 앱인지 느낌이 안 와").
                본문과 같은 회색 작은 글씨로 두면 그냥 설명문 한 줄로 읽히고 지나간다 —
                아래 아홉 개가 스크린샷이 아니라는 걸 **읽기 전에 눈으로** 알아야 한다.
                그래서 색·크기·테두리를 다르게 주고 손가락을 깜빡인다. */}
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-coral-300 bg-coral-50 px-4 py-2.5 text-[18px] font-extrabold text-coral-700 break-keep sm:text-xl">
              <span className="animate-pulse text-2xl sm:text-3xl">👆</span>
              진짜 앱 화면입니다 — 지금 눌러보세요
            </p>
            {/* 🔴 여기엔 연출 사진을 두지 않는다(2026-08-05). `tracing.webp`(합성본)를 크게
                깔았었는데, ①비스듬히 놓인 태블릿이라 화면 글자가 안 읽혀 **「ㄱ 샘플」이라고
                말해 주지 못하고** ②진짜로 눌러볼 화면이 바로 아래인데 그 앞을 800px 이 막았다.
                이 구간의 일은 분위기가 아니라 **빨리 만지게 하는 것**이다.
                (합성본 자체는 `public/landing/hangul/tracing.webp` 에 남아 있다.) */}
            {GA_LEARN.map((a) => (
              <PhonicsTryIt
                key={a.key}
                unitId={GA_UNIT}
                activityKey={a.key}
                height={a.h}
                note={a.note}
                cta={'cta' in a && a.cta}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── ⑤ 동화책 ──────────────────────────────────────────── */}
      {/* 🔴 **쪽수·권수를 앞세우지 않는다**(2026-08-05 사용자: "쪽수 이런건 뭐하러 얘기해 의미없게").
          부모가 궁금한 건 3,835쪽이 아니라 **뭐가 다양하게 있고, 책마다 뭘 하고, 계속 느나**다.
          그래서 제목·본문을 라인 다양성 + 책마다 독후활동 게임 + 매달 증가로 바꿨다. */}
      {/* 🔴 tagline 없음(2026-08-10 사용자) — 「읽을수록 어휘와 문해력이 자랍니다」가 **바로 아래
          섹션 제목과 같은 말**이라 배너 밑에 같은 문장이 두 줄로 이어져 있었다. */}
      <ServiceBanner n={2} name="탱고북 동화책" />
      {/* 🔴 **여기가 차별점이라 제일 크게 쓴다**(2026-08-11 사용자: "우리 한글은 쟤들 둘이랑
          비슷하고, 동화책이 차별점"). 예전엔 어휘·문해력 설명 문단 넷이 먼저 나오고 표지가
          중간에 끼어 있었다 — 파는 것이 **책이 이만큼 있다**인데 글부터 읽히고 있었다.
          순서를 뒤집는다: 라인 넷 → 표지벽 → 그제서야 「그래서 뭐가 자라나」. */}
      <Section
        title={
          <>
            뗀 글자로 읽을 책이 <span className="text-coral-700">{FACTS.books}권</span> 있습니다
          </>
        }
      >
        <p>
          네 갈래로 나뉘어 있어요. 아이 취향이 어디에 있든 볼 책이 있고,{' '}
          <strong>매달 새 동화책이 늘어납니다.</strong>
        </p>
        <LineSections />
        {/* 읽기만 하고 끝나지 않는다 — 어휘·문해력·독후활동. 여기부터가 「그래서 뭐가 자라나」. */}
        <h3 className="!mt-10 font-display text-[26px] font-extrabold text-ink-900 break-keep sm:text-[31px]">
          읽을수록 어휘와 문해력이 자라요
        </h3>
        <div className="!mt-4 grid gap-3 sm:grid-cols-3">
          {BOOK_GROWS.map((g) => (
            <div key={g.t} className="rounded-3xl bg-white/70 p-5 text-center">
              <Pict name={g.icon} />
              <strong className="mt-3 block font-display text-xl font-extrabold text-ink-900 lg:text-2xl xl:text-3xl">
                {g.t}
              </strong>
              <span className="mt-1 block text-base text-ink-600 break-keep lg:text-lg xl:text-[20px]">
                {g.d}
              </span>
            </div>
          ))}
        </div>
        <p className="!mt-6">
          다 읽고 나면 <strong>그 책에 나온 낱말로 독후활동 게임</strong>이 그 자리에서 열려요. 같은
          낱말을 그림으로 만나고, 글자로 조립하고, 따라 그리고, 손으로 씁니다.
        </p>
        {/* 🔴 파닉스↔동화책이 실제로 이어지는 **유일한 증거**. */}
        <p className="!mt-4">
          그리고 이 낱말들은 <strong>파닉스 진도에도 함께 쌓입니다</strong> — 동화책에서 「고기」를
          맞히면 파닉스 표의 고 · 기 칸이 같이 올라갑니다.
        </p>
        <p className="!mt-6">
          <strong>직접 읽어보실 수 있습니다.</strong> 카테고리를 눌러 그 라인의 책을 바꿔 가며
          들어보세요.
        </p>
        <HangulBookTryIt />
        <HangulWordGameTryIt />
      </Section>

      {/* ── ⑤.5 두 서비스가 한 바퀴 — 순환 그림 ─────────────────────────
          🔴 **자리 = 두 서비스를 다 소개한 뒤**(2026-08-11 사용자: "여기는 서비스 1 이잖아,
             한글 파닉스만 집중해서 설명하는 게 맞을 듯"). 파닉스 배너 바로 밑에 뒀더니
             ①서비스 1 자리에서 동화책 얘기를 하고 ②히어로가 이미 한 말을 두 번째로 했다.
             둘을 다 본 다음이라야 「그래서 이 둘이 이어진다」가 요약으로 읽힌다.
          🔴 「설치·약정·광고 없음」도 같이 왔다 — 바로 아래가 요금이라 오히려 제자리다. */}
      <Section eyebrow="왜 탱고북인가" title="배우는 곳과 읽는 곳이 한 바퀴로 이어집니다">
        <p>
          글자만 배우고 끝나면 금세 흐려집니다. 탱고북은 배운 글자로 읽을 책이 같은 앱 안에 있어서,
          읽은 것이 <strong>다시 글자 진도로 돌아옵니다.</strong>
        </p>
        <LearnReadCycle />
      </Section>

      {/* ── ⑥ 실측 숫자 ───────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1280px] rounded-3xl bg-gradient-to-br from-mint-50 to-cream-50 p-5 sm:p-8">
          <h2 className="font-display text-xl font-extrabold text-ink-900 break-keep sm:text-3xl">
            숫자는 있는 그대로입니다
          </h2>
          <p className="mt-2 text-base text-ink-600 break-keep">
            앱에 실제로 들어 있는 것만 적었습니다. 콘텐츠는 계속 늘고 있어서, 이 숫자는 오늘
            기준으로 가장 적은 값입니다.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {/* 🔴 **동화책 권수는 안 세운다**(2026-08-05 사용자: "지금 숫자는 많은게 아냐").
                권수는 아직 자랑거리가 아니고 늘어나기만 한다 — 대신 **배우는 실체**(낱말·파닉스
                단원)를 세우고, 각 숫자에 근거 각주를 붙여 "검증 가능한 숫자"로 만든다(§4-2). */}
            <Stat
              value={`${FACTS.vocabWords}개`}
              label="동화책에서 배우는 낱말"
              note="중복 제외 · 2026-08 실측"
            />
            <Stat
              value={`${FACTS.phonicsUnits}단원`}
              label="한글·영어 파닉스"
              note={`한글 ${FACTS.koreanUnits} + 영어 ${FACTS.englishUnits}`}
            />
          </div>
        </div>
      </section>

      {/* ── ⑦ 혜택 (여기서 처음 등장) ─────────────────────────── */}
      <Section eyebrow="요금" title="한 달 무료로 써 보고 정하세요">
        {/* 🔴 **「1년 무료」를 말하지 않는다**(2026-08-05 사용자). 실제로는 베타 기간 가입자에게
            1년이 열리지만(`features/access`), 광고 문구는 **한 달 체험 + 할인가**로만 말한다 —
            받는 혜택이 말한 것보다 크므로 과장이 아니라 과소 주장이다. 오퍼를 접어도 문구를
            고칠 필요가 없다는 게 이 표현의 값어치다. */}
        <p>
          <strong>한 달 동안 전부 무료</strong>로 쓰십니다. 파닉스도, 동화책도, 게임도 잠긴 것 없이
          열려 있습니다.
        </p>
        <p>
          결제 정보를 넣지 않습니다. 카드도 등록하지 않습니다. 아이 화면에{' '}
          <strong>광고가 뜨지 않습니다.</strong>
        </p>
        <p>
          체험이 끝나도 <strong>자동으로 결제되지 않습니다.</strong> 계속 쓸지는 그때 정하시면
          됩니다.
        </p>
        {/* 🔴 **자리 = 요금 옆**(2026-08-11 사용자: "이게 파닉스 안에 있는 게 맞아?"). 맞지 않았다 —
            「설치·약정·광고 없음」은 학습 설명이 아니라 **구매를 막는 걱정에 대한 답**이라, 값을
            말하는 자리에 있어야 읽힌다. 바로 아래 FAQ 도 답이 전부 「없음」이라 한 덩어리가 된다. */}
        <div className="!mt-6 rounded-3xl bg-white/70 p-4 sm:p-5">
          <strong className="block text-ink-900 break-keep">그리고 이런 게 없습니다</strong>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {NONES.map((n) => (
              <div key={n.t} className="rounded-3xl bg-cream-100 px-2 py-4 text-center">
                <Pict name={n.icon} />
                <strong className="mt-2 block text-sm text-ink-900 break-keep lg:text-base xl:text-lg">
                  {n.t}
                </strong>
                <span className="mt-0.5 block text-[13px] leading-snug text-ink-600 break-keep lg:text-sm xl:text-base">
                  {n.d}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p>
          아이가 무엇을 했는지 <strong>부모 화면에 그대로 남습니다.</strong> 어떤 글자에서 자꾸
          멈추는지, 어떤 낱말을 다시 보면 좋은지 — 밤에 한 번 열어보면 오늘 뭘 했는지 보입니다.
        </p>
        <p className="text-base text-ink-600">
          가입이 부담스러우시면 <strong>게스트로 30일</strong> 먼저 써보셔도 됩니다. 다만 게스트는
          학습 기록이 남지 않아, 아이가 어디까지 했는지 볼 수 없습니다.
        </p>
        {/* 🔴 무료체험 마찰 제거 FAQ(벤치마킹 2차 §4-5) — 투두는 CTA 옆 FAQ 아코디언으로 전환
            장벽을 없앤다. 우리는 답이 전부 「없음/아니요」라 오히려 안심으로 판다. */}
        <div className="!mt-6 space-y-2">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-3xl border border-ink-100 bg-white/70 px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-bold text-ink-800 break-keep">
                {f.q}
                <span className="shrink-0 text-xl font-bold text-coral-500 transition group-open:rotate-45">
                  ＋
                </span>
              </summary>
              <p className="mt-2 text-base text-ink-600 break-keep">{f.a}</p>
            </details>
          ))}
        </div>
        {/* 🔴 아이가 작게, 부모가 크게 — 이 섹션은 결제를 결정하는 부모에게 하는 말이라
            시선의 주인이 부모여야 한다. */}
        <Photo
          src="parent"
          alt="아이가 거실에서 태블릿을 보는 동안 식탁에서 차를 마시는 엄마"
          w={1000}
          h={755}
          className="!mt-6"
        />
        <div className="!mt-7 flex flex-col items-center gap-3 rounded-3xl border border-coral-200 bg-gradient-to-br from-coral-100 to-peach-200 p-6 text-center sm:p-8">
          <p className="font-display text-xl font-extrabold text-ink-900 break-keep sm:text-3xl">
            파닉스로 글자를 떼고, 동화책으로 낱말과 문장을 익혀요
          </p>
          <p className="text-base text-ink-600 break-keep">
            설치 없이 브라우저에서 바로 시작합니다.
          </p>
          <Link
            to={SIGNUP}
            className="mt-1 inline-flex min-h-[52px] items-center rounded-full bg-coral-700 px-8 text-lg font-bold text-white shadow-md transition hover:bg-coral-800"
          >
            한달 무료 체험 →
          </Link>
        </div>
      </Section>

      <StickyCta />
      <SiteFooter lang="ko" />
    </div>
  );
}
