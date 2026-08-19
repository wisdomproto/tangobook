import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { PhonicsTryIt } from '@/features/phonics-learner/components/PhonicsTryIt';
import { PublicNav } from '@/components/PublicNav';
import { getAllKoreanUnits } from '@/features/phonics-learner/lib/korean-phonics-units';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import { BookCover } from '@/design-system/primitives/BookCover';

/**
 * `/intro` — 광고 랜딩(상세페이지). 네이버·메타 광고의 도착지.
 *   🔴 예전 주소 `/hangul`·`/english` 는 **301 로 여기로 보낸다**(서버 `app.ts`) — 광고·블로그에
 *      이미 나간 링크가 있고, 색인도 한 주소로 모아야 한다.
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
 * 🔴 **순서는 바로 위 문단이 정한다**(2026-08-19 사용자: "가운데가 동화책인데?"). 문단은
 *    「파닉스에서 낱말을 맞히면 동화책 한 쪽이 열린다」고 말하는데 그림은 동화책을 가운데,
 *    게임을 마지막에 두어 **글과 그림이 서로 다른 순서**를 말하고 있었다.
 *    → 글자 → 낱말을 맞힌다 → 동화책이 열린다.
 * 🔴 세 번째는 **실제 리빌 화면**이다(고기 아닌 「아기」 — 호리 동화). 아이가 책을 보는 사진으로
 *    두면 「그냥 책도 있다」로 읽히고, 이 절의 주장인 **낱말이 책을 연다**가 그림에 없다.
 * 🔴 **둘째·셋째는 같은 낱말이어야 한다**(2026-08-19 사용자: "가운데는 고기인데 오른쪽은 아기인 게
 *    맞냐"). 게임에서 고기를 잇고 동화책은 아기를 여는 그림이면, 이 줄이 말하는 「그 낱말이 그 책을
 *    연다」가 화면에서 성립하지 않는다. 낱말을 바꿀 땐 **두 스크린샷을 같이 다시 찍는다** —
 *    `capture-cycle-play.mjs`(그림짝) · 리빌은 임시 촬영 페이지.
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
    photo: 'cycle-play',
    alt: '「그림짝 맞추기」에서 아기 그림과 「아기」 낱말이 선으로 이어진 화면',
    t: '그 글자로 낱말을 맞혀요',
    d: '한 낱말을 그림 · 조립 · 따라 그리기 · 손글씨 네 가지로',
  },
  {
    photo: 'cycle-reveal',
    alt: '「아기」를 맞히자 그 낱말이 나오는 호리 동화책 한 쪽이 열린 화면 — 아기라는 낱말에 노란 색이 들어가 있다',
    t: '동화책에서 다시 만나요',
    d: '맞힌 낱말이 나오는 책 한 쪽이 그 자리에서 열리고, 읽어 줍니다',
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
 * 「왜 파닉스인가」 영어판 — 한글 `PHONICS_WHY` 와 **같은 자리·같은 문법**.
 *
 * 🔴 **낱말 카드만 있고 활동 그림이 없으면 난데없다**(2026-08-19 사용자: "한글 얘기하다가 갑자기
 *    영어 낱말이 나오면 뭔 줄 알아"). 한글 쪽은 활동 석 장이 먼저 깔리고 낱말이 그걸 받는데,
 *    영어는 낱말 넉 장만 배경 위에 떠 있었다. 같은 순서로 세운다.
 * 🔴 자산은 **실제 앱 화면**(`capture-english-why.mjs`, 무료 단원 `en-b1-u01`·`en-b2-u01`).
 *    잠긴 단원을 찍으면 벽이 찍힌다.
 * 🔴 **왼쪽 = Book 1(글자) · 가운데·오른쪽 = Book 2(낱말)**(2026-08-19 사용자). 처음엔 좌·우가
 *    Book 1 이고 가운데만 Book 2 라 책이 뒤섞여, 글자→낱말로 나아가는 순서가 안 보였다.
 */
const ENGLISH_WHY: { shot: string; alt: string; t: string; d: string }[] = [
  {
    shot: 'en-why-sound',
    alt: 'Aa 와 사과를 든 악어 그림을 눌러 소리를 듣는 앱 화면',
    t: '알파벳 소리부터',
    d: 'A 부터 Z 까지 글자마다 소리 하나. 그림과 함께 눌러 듣고 따라 합니다.',
  },
  {
    shot: 'en-why-blend',
    alt: 'a 와 n 이 an 으로 합쳐지는 앱 화면',
    t: '소리를 합쳐요',
    d: 'a + n 이 an 이 되는 순간을 눈으로 보고, 손으로 씁니다. c 를 붙이면 can 입니다.',
  },
  {
    shot: 'en-why-new',
    alt: '낱말과 그림을 이어 맞추는 그림짝 맞추기 앱 화면',
    t: '낱말을 읽어내요',
    // 🔴 낱말을 문장에 적지 않는다 — 이 게임은 판마다 낱말을 **랜덤으로 뽑아서**, 스크린샷을
    //    다시 찍으면 캡션이 거짓이 된다(bat·cat·hat·fan 로 바뀌는 걸 실제로 봤다).
    d: '배운 소리를 이어 붙여 낱말을 읽고, 그림과 짝지어 봅니다.',
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
/**
 * 히어로 한가운데 = **이어짐 그림**(2026-08-12 사용자: "이따구로 말고, 그림을 그리자.
 * 왼쪽 한글 파닉스 공부 단어랑 오른쪽 동화책 어휘랑 연결되는 그림").
 *
 * 🔴 카드 두 장을 나란히 두면 「파닉스 앱 하나 + 동화책 앱 하나」로 읽힌다. 우리 정체성은 그 둘
 *    **사이**에 있으므로, 첫 화면의 주인공을 **연결 자체**로 바꾼다. 문장으로 설명하던 자리다.
 * 🔴 **꾸며 낸 그림이 아니라 앱 화면 그대로다** — 왼쪽은 파닉스 `kr-h1-u05`(ㄹ) 의 음절 만들기와
 *    낱말 연습을 찍은 것, 오른쪽은 그 낱말이 실제로 나오는 「미운 아기 오리」 1쪽. 앱에서 「오리」를
 *    맞히면 이 쪽이 열린다(`word-scenes.json` 색인이 그렇게 잇는다).
 * 🔴 **세 칸이 같은 낱말이어야 한다.** 예전엔 ①ㄷ+ㅏ(=다) → ②구두 → ③신데렐라 구두 로,
 *    「이어진다」고 말하는 그림의 ①과 ②가 안 이어져 있었다. 지금은 ①리 → ②오리 → ③미운 아기 오리다.
 *    🔴 낱말을 바꿀 땐 **`word-scenes.json` 에 그 낱말이 있는지 먼저 본다** — ㄹ 단원 낱말 중
 *    책으로 이어지는 건 오리뿐이고(너구리·다리·노루는 없다), 없으면 ③을 만들 수가 없다.
 *    다시 찍으려면 `scripts/capture-bridge-{letter,word}.mjs`.
 * 🔴 왼쪽은 **낱말 카드 한 장이 아니라 「배우는 장면」**이어야 한다(2026-08-12 사용자: "왼쪽에
 *    파닉스로 글자를 배우는 장면이어야지"). 사물 사진 한 장은 제품이 아니라 소재로 보인다.
 * 🔴 문장 강조는 **앱과 같은 노란 하이라이트** — 리빌 화면에서 맞힌 낱말에 색이 들어가는 그 표시다.
 * 🔴 자산은 **구워서 로컬에** 둔다(9KB·50KB) — R2 원본은 800px·1536px 이고, 첫 화면이라
 *    `fetchpriority="high"` 로 프리렌더 HTML 에 src 가 남는 세 장 안에 든다.
 */
/** 칸 사이 화살표. 🔴 375px 에선 세로로 쌓이므로 아래를 가리키게 돌린다. */
function Arrow() {
  return (
    <span
      aria-hidden
      className="self-center text-xl font-extrabold text-coral-500 sm:mt-10 sm:self-start sm:text-3xl"
    >
      <span className="sm:hidden">↓</span>
      <span className="hidden sm:inline">→</span>
    </span>
  );
}

function HeroBridge() {
  return (
    /* 🔴 폭은 **위 지도와 같다**(2026-08-19 사용자: "위랑 아래 너비를 맞춰"). 예전엔 브릿지가
       히어로의 유일한 그림이라 좁게(max-w-2xl) 세웠는데, 지금은 바로 위에 같은 모양의 세 칸
       지도가 있어서 두 상자의 좌우 끝이 어긋나면 계단처럼 보인다. 폭 제한을 없애고 부모
       컨테이너(히어로)를 그대로 따른다. */
    <div className="mx-auto mt-5 rounded-3xl border-2 border-coral-200 bg-white/70 p-3 sm:mt-8 sm:p-5 xl:p-7">
      {/* 🔴 **셋을 한 줄로**(2026-08-19 사용자). 예전엔 ①②가 왼쪽에 세로로 쌓이고 ③이 오른쪽이라
          두 단짜리 그림이었는데, 바로 위 지도(파닉스→낱말→동화책)가 이미 가로 세 칸이라 같은
          이야기가 **다른 모양으로 두 번** 나왔다. 셋을 같은 방향으로 세우면 위 그림의 한 줄을
          그대로 확대한 것이 된다.
          🔴 375px 에선 세로로 쌓는다 — 세 칸이면 하나가 100px 이라 화면 안 글자가 안 읽힌다. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        {/* ① 파닉스 — 글자가 음절이 되는 화면. 🔴 낱말 카드만 두면 그림 낱말책으로 보인다(2026-08-12
            사용자: "왼쪽에 단어만 있으니까 파닉스 느낌이 안 나네") — 파닉스는 **글자와 소리**다. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="mb-1 text-[11px] font-extrabold text-coral-700 sm:text-sm xl:text-base">
            ① 글자와 소리를 배우고
          </span>
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-cream-50">
            <img
              src="/landing/hangul/bridge-letter.webp"
              alt="한글 파닉스 음절 만들기 화면 — ㄹ 과 ㅣ 가 합쳐져 리 가 된다"
              width={540}
              height={458}
              fetchPriority="high"
              className="aspect-[540/458] w-full object-cover"
            />
          </div>
        </div>

        <Arrow />

        {/* ② 그 글자로 만든 낱말 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="mb-1 text-[11px] font-extrabold text-coral-700 sm:text-sm xl:text-base">
            ② 그 글자로 낱말을
          </span>
          <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-cream-50">
            <img
              src="/landing/hangul/bridge-word.webp"
              alt="한글 파닉스 ㄹ 단원 낱말 연습 화면 — 오리·너구리"
              width={540}
              height={366}
              fetchPriority="high"
              className="aspect-[540/366] w-full object-cover"
            />
            {/* 🔴 위치는 **퍼센트** — 이미지가 화면 폭에 따라 늘어난다. */}
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-xl ring-[3px] ring-coral-500 sm:rounded-2xl sm:ring-4"
              style={{ left: '5.7%', top: '4.8%', width: '38.5%', height: '87%' }}
            />
          </div>
        </div>

        <Arrow />

        {/* ③ 그 낱말이 나오는 동화책 한 쪽. 🔴 문장 강조는 **앱과 같은 노란 하이라이트** —
            리빌 화면에서 맞힌 낱말에 색이 들어가는 그 표시다. */}
        <div className="flex min-w-0 flex-[1.3] flex-col">
          <span className="mb-1 text-[11px] font-extrabold text-coral-700 sm:text-sm xl:text-base">
            ③ 동화책에서 다시 만나요
          </span>
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-cream-50">
            <img
              src="/landing/hangul/bridge-page.webp"
              alt="미운 아기 오리 동화책 한 쪽 — 알에서 깨어난 아기 오리들"
              width={560}
              height={315}
              fetchPriority="high"
              className="aspect-video w-full object-cover"
            />
            <p className="px-2 py-1.5 text-left text-[11px] font-bold leading-snug text-ink-800 break-keep sm:px-3 sm:py-2 sm:text-base xl:text-lg">
              햇살 좋은 날, 엄마{' '}
              <mark className="rounded bg-amber-200 px-1 text-ink-900">오리</mark>의 알들이 톡톡
              깨어났어요.
            </p>
          </div>
        </div>
      </div>

      {/* 🔴 통계 한 줄(「파닉스 71단원 · 동화책 266권 — 배운 낱말이 이야기로 이어집니다」)은 **뺐다**
          (2026-08-19) — 바로 아래로 올라온 세 칸 그림이 같은 말을 그림과 예시로 한다. */}
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
/**
 * 데모·낱말 카드에 쓸 단원.
 *
 * 🔴 **낱말 넷이 전부 동화책으로 이어지는 단원**이어야 한다(2026-08-18). ㄱ 단원(`kr-h1-u02`)은
 *    야구가 색인에 없어 넷 중 하나는 다 써도 동화책이 안 열렸다 — 랜딩 데모에서 그 하나가 걸리면
 *    헤드라인이 거짓이 된다. ㅁ 단원은 머리 12 · 모두 12 · 거미 12 · 모기 2 로 **못 뜨는 낱말이 0**
 *    이고 합도 가장 크다(전 15단원 실측).
 * 🔴 단원을 바꾸면 **이 구간의 본문 낱말 예시**도 같이 바꾼다 — 갈리면 「이 단원을 떼면 이만큼
 *    읽는다」가 다른 단원 얘기가 된다. (윗구간의 `GA_WORDS` 카드는 ㄱ 로 **따로 간다** — 이유는
 *    거기 주석에.)
 */
const GA_UNIT = 'kr-h1-u06';
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
      <div className="mx-auto flex max-w-3xl lg:max-w-5xl xl:max-w-6xl items-center justify-center gap-3">
        <Link
          to={SIGNUP}
          className="flex min-h-[44px] shrink-0 items-center rounded-full bg-coral-700 px-5 text-base font-bold text-white shadow-sm transition hover:bg-coral-800"
        >
          한 달 무료로 시작하기
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
        <span className="text-center text-[14px] leading-snug text-ink-400 break-keep">{note}</span>
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
/**
 * 「왜 파닉스인가」의 마지막 칸 — 그 규칙으로 읽게 되는 낱말 넷.
 *
 * 🔴 커리큘럼 다섯 줄은 **범위**를 말하지 낱말을 안 보여준다. 부모가 궁금한 건 「32단원이 있다」가
 *    아니라 「우리 애가 뭘 읽게 되나」다. 그래서 단원 목록보다 **낱말 카드가 먼저** 온다.
 * 🔴 **ㄱ 단원(`kr-h1-u02`)이다 — 그 구간이 전부 ㄱ 이라서**(2026-08-19 사용자: "정신없다").
 *    후크가 「가구」/「가」 이고 활동 석 장도 ㄱ·ㅏ·「가」 다. 여기만 다른 단원이면 넷째 칸이
 *    딴 얘기가 된다. ⚠️ 그래서 **아래 라이브 데모의 단원(`GA_UNIT`=ㅁ)과는 일부러 다르다** —
 *    데모는 「맞히면 동화책이 열린다」를 보여야 해서 낱말 넷이 전부 색인에 있어야 하는데
 *    ㄱ 은 야구가 없다. 여긴 카드일 뿐이라 그 제약이 없다.
 * 🔴 카드 그림은 앱이 쓰는 그것을 그대로 가리킨다(R2) — 사본을 구우면 낱말을 바꿀 때 갈라진다.
 */
const GA_WORDS: { w: string; img: string }[] = [
  { w: '고기', img: 'kr-h1-u02-gogi-5e25d595' },
  { w: '가구', img: 'kr-h1-u02-gagu-18fdf742' },
  { w: '아기', img: 'kr-h1-u02-agi-7c9fa449' },
  { w: '야구', img: 'kr-h1-u02-yagu-005e4a89' },
];

/** 영어 데모 단원(`en-b2-u01` Short Vowel a)의 낱말 넷 — 한글과 같은 문법으로 세운다. */
const EN_WORDS: { w: string; img: string }[] = [
  { w: 'can', img: 'en-b2-u01-can-d398dab7' },
  { w: 'fan', img: 'en-b2-u01-fan-66052b1c' },
  { w: 'man', img: 'en-b2-u01-man-c82f3835' },
  { w: 'pan', img: 'en-b2-u01-pan-7a252f40' },
];

/**
 * **파닉스 → 어휘 → 동화책** 그림 세 장. 이 페이지의 주장을 한눈에.
 *
 * 🔴 **표를 만들지 않는다**(2026-08-19 사용자: "구리다, 기계처럼 만드네. 동네 아줌마가 봐도
 *    이해갈 만하게"). 앞선 두 판이 다 그랬다 — 곡선 일곱 개짜리 그물, 그다음엔 글자·낱말·표지
 *    네 줄짜리 표. 둘 다 **읽어야 알 수 있는 물건**이라 스치는 사람에겐 아무것도 안 남는다.
 *    셋을 그림 한 장씩으로 세우고 화살표로 잇는다 — 숫자는 그림 밑에 한 줄.
 * 🔴 그림은 **그 칸이 무엇인지 말하는 것**으로 고른다: 파닉스=글자 블록, 어휘=낱말 카드,
 *    동화책=표지 벽. 앱 스크린샷은 바로 위 순환 그림이 이미 쓰고 있어서 여기서 또 쓰면 겹친다.
 * 🔴 가운데는 **새 자산을 만들지 않는다** — 앱이 쓰는 낱말 카드 넉 장을 그대로 격자로 놓는다.
 */
const CHAIN_STEPS: { t: string; n: string; ko: string; en: string }[] = [
  // 🔴 **칸마다 한글·영어 두 줄**(2026-08-19 사용자: "왼쪽에 한글 파닉스·영어 파닉스, 가운데
  //    한글/영어 어휘, 오른쪽 한글 동화책·영어 동화책. 이걸 표현해야 하는데"). 한 줄로 뭉쳐 두면
  //    이 서비스가 **두 언어를 같은 이용권으로 다 준다**는 게 안 보인다 — 그게 요금 절의 근거다.
  // 🔴 **세 칸의 예시는 같은 줄끼리 맞물린다**: ㄹ→오리→미운 아기 오리 / 받침 ㅂ→집→백설공주.
  //    예시가 서로 무관하면 화살표가 거짓말이 된다.
  // 🔴 **아는 동화책이 나오게 낱말을 고른다** — 색인(`word-scenes.json`)에서 유명 동화 제목으로
  //    거꾸로 뽑았다. 처음엔 고기·머리·모두였는데 그게 여는 책이 자연관찰·호리라 「그래서 뭐」였다.
  // ⚠️ 동화책은 **영어판이 따로 있는 게 아니라 같은 책을 영어로 읽는다**(표본 40권 전부 `languages`
  //    에 en 보유). 「영어 동화책 N권」처럼 따로 세지 말 것.
  {
    // 🔴 「파닉스 71단원」 → **「한글·영어 파닉스」**(2026-08-19 사용자). 숫자는 바로 밑 두 줄이
    //    한글 32 · 영어 39 로 갈라 말하므로, 위에서 합계를 또 말하면 같은 걸 두 번 센다.
    t: '한글·영어 파닉스',
    n: '',
    ko: '한글 32단원 — ㄹ · 받침 ㄴ · 받침 ㅂ …',
    en: '영어 39단원 — Aa Bb Cc · short a · 매직 e …',
  },
  {
    // 🔴 「낱말」 → **「학습 어휘」**(2026-08-19 사용자) — 아래 칸이 낱말을 늘어놓고 있어서 제목까지
    //    낱말이면 같은 말이 두 번이고, 부모가 찾는 말은 「어휘」다.
    t: '학습 어휘',
    n: '',
    ko: '한글 — 오리 · 언니 · 달 · 집 …',
    en: '영어 — cat · fan · hat · map …',
  },
  {
    t: '동화책',
    n: '261권',
    ko: '한국어 — 미운 아기 오리 · 신데렐라 …',
    en: '영어 — 같은 책을 영어로도 읽어요',
  },
];

/** 🔴 위 예시와 **같은 낱말**의 카드다 — 그림과 글자가 다른 낱말이면 깔맞춤이 깨진다. */
const CHAIN_WORD_CARDS = [
  'kr-h1-u05-ori-32d6900a',
  'kr-h2-u03-eonni-c492d752',
  'kr-h2-u04-dal-5ed6a3b6',
  'kr-h2-u07-jip-29dc98cc',
];

function WordBookMesh() {
  const pic = 'aspect-video w-full rounded-2xl object-cover';
  return (
    <div className="!mt-6 rounded-3xl bg-white/70 p-4 sm:p-5">
      {/* 🔴 제목 줄(「글자에서 이야기까지, 한 줄로 이어져 있어요」)은 **뺐다**(2026-08-19 사용자) —
          바로 위 h1 이 이미 같은 말을 하고, 세 칸과 화살표가 그 말을 그림으로 한 번 더 한다.
          한 화면에서 같은 문장을 세 번 읽게 된다. */}
      {/* 🔴 세로로 쌓지 않는다 — 375px 에서도 셋이 한 줄이라야 「이어진다」가 보인다.
          대신 그림과 글씨를 작게 줄인다(화살표는 칸 사이 고정폭). */}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-1.5 sm:gap-3">
        {CHAIN_STEPS.map((step, i) => (
          <Fragment key={step.t}>
            {i > 0 && (
              <span
                aria-hidden
                className="self-center text-xl font-extrabold text-coral-400 sm:text-4xl"
              >
                →
              </span>
            )}
            <div className="min-w-0 text-center">
              {/* 🔴 왼쪽 무더기 = 한글 블록, 오른쪽 = 알파벳 블록. **두 언어가 한 그림 안에** 있어야
                  「하나로 둘 다 한다」가 온다(2026-08-19 사용자).
                  ⚠️ 여기까지 세 번 갈아엎었다 — 호리+가나다(한글만 보임) → 코드로 그린 자모 타일
                  (「격자로 늘어놓아라」고 쓴 내 프롬프트 탓에 생성본도 똑같이 나왔다) → 앱의 파닉스
                  카드 아이콘 둘(호리가 ㄱ·A 를 든 것) → 이 블록 그림. 자모가 깨지기 쉬우니 갈 때는
                  ㄱ ㄴ ㄷ · ㅏ ㅑ ㅓ 가 정확한지 눈으로 볼 것. */}
              {i === 0 && (
                <img
                  src="/landing/hangul/letters.webp"
                  alt="한글 자모 블록 ㄱ ㄴ ㄷ ㅏ ㅑ ㅓ 와 알파벳 블록 A B C a b c 가 좌우로 쌓여 있는 그림"
                  width={1280}
                  height={720}
                  loading="lazy"
                  decoding="async"
                  className={pic}
                />
              )}
              {i === 1 && (
                /* 🔴 2×2 로 두되 **줄 수를 못 박는다**(`grid-rows-2` + 자식 `min-h-0`) — 안 그러면
                   격자가 제 높이로 자라 옆 두 칸(16:9)과 어긋난다(가운데만 아래로 튀어나왔었다). */
                <span
                  className={`${pic} grid grid-cols-2 grid-rows-2 gap-1 bg-cream-100 p-1 sm:gap-1.5 sm:p-1.5`}
                >
                  {CHAIN_WORD_CARDS.map((c) => (
                    <img
                      key={c}
                      src={`https://assets.tangobook.co.kr/phonics-word-cards/${c}-w800.webp`}
                      alt=""
                      width={800}
                      height={800}
                      loading="lazy"
                      decoding="async"
                      className="h-full min-h-0 w-full rounded-lg object-cover"
                    />
                  ))}
                </span>
              )}
              {i === 2 && (
                <img
                  src="/landing/hangul/books.webp"
                  alt="탱고북 동화책 표지 아홉 장"
                  width={1200}
                  height={675}
                  loading="lazy"
                  decoding="async"
                  className={pic}
                />
              )}
              {step.t && (
                <strong className="mt-2 block text-[13px] font-extrabold text-ink-900 break-keep sm:text-lg">
                  {step.t} <span className="text-coral-700 sm:text-xl">{step.n}</span>
                </strong>
              )}
              {/* 🔴 한글 줄은 진하게, 영어 줄은 그 아래 같은 크기로 — 크기를 달리하면 한쪽이
                  덤처럼 보인다(같은 이용권이라는 게 이 두 줄의 요지다). */}
              <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-600 break-keep sm:text-[13px]">
                {step.ko}
              </span>
              <span className="block text-[10px] leading-relaxed text-ink-600 break-keep sm:text-[13px]">
                {step.en}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function UnitWords({
  words,
  lead,
  sub,
}: {
  words: { w: string; img: string }[];
  lead: ReactNode;
  sub: string;
}) {
  return (
    /* 🔴 **세 칸과 같은 껍데기**(`rounded-3xl bg-white/70`) — 2026-08-19 사용자: "위에 액티비티
       3개를 보여주는데 아래 낱말은 따로 도는 느낌". 배경 위에 맨몸으로 놓여 있어서 같은 이야기의
       마지막 칸인 게 안 보였다. 넷째 칸으로 만들되 **가로로 눕혀** 셋과 구분되게 둔다. */
    <div className="rounded-3xl bg-white/70 p-4 sm:p-5">
      <p className="text-[17px] font-extrabold text-ink-900 break-keep sm:text-xl">{lead}</p>
      <p className="mt-1 text-[14px] text-ink-600 break-keep sm:text-base">{sub}</p>
      <ul className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        {words.map((it) => (
          <li
            key={it.w}
            className="overflow-hidden rounded-2xl border-2 border-peach-200 bg-white text-center"
          >
            <img
              src={`https://assets.tangobook.co.kr/phonics-word-cards/${it.img}-w800.webp`}
              alt={it.w}
              width={800}
              height={800}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
            <span className="block py-2 text-[15px] font-extrabold text-ink-900 sm:text-lg">
              {it.w}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
/**
 * 영어 파닉스 다섯 권 — 한글 `STAGES` 와 같은 모양으로 읽히게(같은 페이지 안에서 두 서비스가
 * 서로 다른 문법으로 설명되면 하나로 안 보인다).
 * 🔴 문구는 `/english` 랜딩에서 그대로 가져왔다(2026-08-10 작성분) — 한 페이지로 합치면서
 *    그 페이지는 이리로 리다이렉트한다. 새로 쓰지 않는다.
 */
const EN_STAGES: { label: string; count: string; detail: string; tone: string }[] = [
  {
    label: '알파벳 소리',
    count: '8단원',
    detail: 'A 부터 Z 까지, 글자마다 소리 하나',
    tone: 'bg-peach-100 text-ink-800',
  },
  {
    label: '단모음 낱말',
    count: '8단원',
    detail: 'c + an → can, 소리가 합쳐집니다',
    tone: 'bg-coral-100 text-coral-700',
  },
  {
    label: '매직 e',
    count: '7단원',
    detail: 'cap 이 cape 가 되는 규칙',
    tone: 'bg-mint-100 text-mint-700',
  },
  {
    label: '이중자음·블렌드',
    count: '8단원',
    detail: 'bl · ch · sh — 두 글자가 한 소리로',
    tone: 'bg-peach-100 text-ink-800',
  },
  {
    label: '모음팀·R 모음',
    count: '8단원',
    detail: 'ee · oa · ar — 긴 소리로',
    tone: 'bg-coral-100 text-coral-700',
  },
];

/**
 * 영어 데모 = Book 2 첫 단원(`c + an → can`) **세 개만**. 한글은 단원을 통째로(아홉 개) 얹지만
 * 영어까지 아홉이면 같은 형식이 열여덟 번 이어져 리듬이 사라진다 — 여기선 「합쳐지는 순간」과
 * 손으로 하는 것만 보여주고 나머지는 앱으로 보낸다.
 * 🔴 **키는 그 단원 plan 에 실제로 있는 것이어야 한다** — 없으면 `PhonicsTryIt` 이
 *    `if (!activity) return null` 로 **에러 없이 상자를 지운다**. 영어 블록 게임은 2026-08-09 에
 *    전 권에서 빠졌다(가드 테스트 有) — en-b2-u01 의 play 는 낱말 그리기·쓰기·그림 짝 셋이다.
 */
const EN_UNIT = 'en-b2-u01';

/**
 * 이 페이지에서 **유일한 라이브 데모**.
 *
 * 🔴 헤드라인이 「오늘 배운 글자로 오늘 동화책을 읽어요」라고 주장하고, 이 상자가 그 자리에서
 *    증명한다 — 낱말을 맞히면 `SceneReveal` 이 그 낱말이 나오는 동화책 쪽을 삽화·문장·나레이션과
 *    함께 띄운다. 헤드라인과 데모가 같은 말을 한다.
 * 🔴 **낱말 쓰기여야 한다**(2026-08-18 사용자, 세 번 고른 끝). 고른 기준은 둘이다 —
 *    **①낱말 하나로 끝나고 ②끝나면 동화책이 열린다**.
 *    - 그림 짝 찾기: 0/4 로 시작해 **네 쌍을 다 맞춰야** 끝났다. 히어로 바로 아래에서 그만한 일을
 *      시키면 대부분 스크롤로 지나간다.
 *    - 음절 만들기: 한 동작이지만 **리빌이 없다** — 리빌은 낱말 활동 4종(블록·낱말쓰기·낱말그리기·
 *      그림짝)에만 붙고 글자 활동엔 안 붙는다. 헤드라인이 「동화책을 읽어요」인데 데모는 딴 말을 했다.
 *    - 낱말 쓰기: 낱말 하나를 다 쓰면 그 낱말이 나오는 동화책 쪽이 열린다. 헤드라인과 같은 말을 한다.
 * ⚠️ 탭 한 번보다는 오래 걸린다(획을 다 채워야 99% 가 된다). 그 대가로 **연결을 그 자리에서
 *    증명**하는 걸 산 것이다 — 되돌릴 땐 이 둘 중 무엇을 포기하는지 먼저 정할 것.
 * 🔴 **한/영은 토글로 합친다.** 헤드라인에서 「한글도 하고 영어도 해요」라고 말하면 백화점이 되고,
 *    무명 브랜드가 그러면 무엇을 파는지가 안 남는다. 대신 여기서 실물로 보여준다 —
 *    세로가 안 늘고, 영어도 같은 자리에서 글자가 붙는 걸 보여준다(`cvc-an` = c + an → can).
 * 🔴 예전엔 이 상자가 **아홉 개 스택의 맨 아래**에 있었다(8.3화면). 가장 센 증거를 8화면 밑에
 *    묻어 두고 위에서는 글로 설명하고 있었다.
 */
function TryBridge() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  return (
    <section className="px-4 pt-10 pb-4 sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-3xl text-center lg:max-w-5xl">
        {/* 🔴 「👆 진짜 앱 화면입니다 — 지금 눌러보세요」 알약은 **뺐다**(2026-08-19 사용자) —
            상자 헤더가 이미 「● 실제 학습 화면」이라고 말하고, 그 위에 또 한 번 크게 말하면
            같은 주장을 두 번 한다. */}
        <div className="mt-4 flex justify-center gap-2">
          {(
            [
              ['ko', '한글'],
              ['en', 'English'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setLang(v)}
              className={`min-h-[44px] rounded-full border-2 px-5 text-base font-extrabold transition ${
                lang === v
                  ? 'border-coral-500 bg-coral-500 text-white'
                  : 'border-line bg-white text-ink-500 hover:border-coral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 🔴 `key` 로 갈아끼운다 — 토글은 **다른 단원의 다른 활동**이라 안에서 상태를 이어받으면
            앞 언어의 낱말이 남는다. */}
        {/* 🔴 `language` 를 반드시 같이 넘긴다 — 안 넘기면 영어 단원 id 를 한글 plan 에서 찾다가
            활동을 못 찾고 상자가 **조용히 사라진다**(`if (!activity) return null`). 에러도 안 난다.
            토글을 붙이고 처음 실행했을 때 실제로 이렇게 빈 상자가 나왔다. */}
        <PhonicsTryIt
          key={lang}
          unitId={lang === 'ko' ? GA_UNIT : EN_UNIT}
          language={lang === 'ko' ? 'korean' : 'english'}
          activityKey="game-word-writing"
          height={620}
          note="다 쓰면 그 낱말이 나오는 동화책 한 쪽이 열립니다 — 손으로 따라 써 보세요."
          cta
        />

        {/* 🔴 여기에 리빌 **사진**을 두지 않는다(2026-08-18). 한 번 뒀다가 뺐다 —
            바로 위 데모가 낱말을 다 쓰면 **그 화면이 진짜로 뜬다**. 사진을 덧붙이면 같은 말을
            두 번 하고, 게다가 사진 속 게임(그림짝)이 이 데모(낱말 쓰기)와 달라 딴 화면처럼 보였다.
            리뷰가 「사진이 11.3화면에 묻혔다」고 한 건 그때 데모가 리빌 없는 음절 만들기였기
            때문이고, 데모를 바꾼 지금은 그 근거가 사라졌다. */}
      </div>
    </section>
  );
}

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

const A = 'https://assets.tangobook.co.kr/';
/**
 * 책마다 핵심 낱말이 있다 — 그걸 **그림으로** 보여준다.
 *
 * 🔴 예전엔 이 자리가 픽토그램 3장 + 「읽을수록 어휘와 문해력이 자라요」였다. 이 카테고리 누구나
 *    쓰는 문장이고 밑에 증거가 없었다. 그 결과 **이을 두 물건 중 한쪽만 그림으로 존재**했다 —
 *    파닉스 쪽엔 낱말 카드가 있는데(`UnitWords`) 책 쪽엔 한 장도 없어서, 연결이 카피로만 남았다.
 * 🔴 파닉스 카드와 **같은 그림 문법**(정사각 카드 + 낱말)으로 세운다. 설명 없이 눈으로
 *    「같은 종류의 것이 양쪽에 있다」가 읽히는 게 이 자리의 일이다.
 * 🔴 자산은 **앱이 쓰는 것 그대로**(R2 `keyObjectImages`) — 새로 찍거나 굽지 않는다.
 * ⚠️ **호리 3라인 78권(266권의 29%)은 아직 `keyObjects` 가 0 이다.** 「책마다」는 지금 시점엔
 *    참이 아니다 — 채우기로 하고 그 전제로 쓴 문장이다(2026-08-18 사용자 판단). 추출 데이터
 *    1,114낱말/196권은 이미 있고 R2 적용만 남았다. **적용 전에 광고를 크게 돌리면 그 29% 가
 *    비용이 된다** — 호리 표지를 눌러 들어간 부모가 독후활동을 못 만난다.
 */
const BOOK_WORDS: { title: string; line: string; cover: string; words: [string, string][] }[] = [
  {
    title: '백설공주',
    line: '세계 명작',
    cover: `${A}1778555233699-백설공주-cover-misc-1779148945169.webp`,
    words: [
      ['사과', `${A}1778555233699-백설공주-keyobj-apple-1779939822554-w800.webp`],
      ['거울', `${A}1778555233699-백설공주-keyobj-mirror-1779172375657-w800.webp`],
      ['침대', `${A}1778555233699-백설공주-keyobj-bed-1779172377806-w800.webp`],
      ['집', `${A}1778555233699-백설공주-keyobj-house-1779778775089-w800.webp`],
    ],
  },
  {
    title: '장수풍뎅이',
    line: '자연 관찰',
    cover: `${A}1777607890313-장수풍뎅이-cover-misc-1780025606215.webp`,
    words: [
      ['뿔', `${A}1777607890313-장수풍뎅이-keyobj-뿔-1783840581531.webp`],
      ['알', `${A}1777607890313-장수풍뎅이-keyobj-알-1783840584862.webp`],
      ['애벌레', `${A}1777607890313-장수풍뎅이-keyobj-애벌레-1783840586242.webp`],
      ['장수풍뎅이', `${A}1777607890313-장수풍뎅이-keyobj-장수풍뎅이-1783840578967.webp`],
    ],
  },
  {
    title: '반쪽이',
    line: '전래 동화',
    cover: `${A}1785303658036-반쪽이-cover-misc-1785373418524.webp`,
    words: [
      ['쌀뒤주', `${A}comic-assets/jeonrae-banjjogi/word-dwiju.jpg`],
      ['새끼줄', `${A}comic-assets/jeonrae-banjjogi/word-saekkijul.jpg`],
      ['절굿공이', `${A}comic-assets/jeonrae-banjjogi/word-gongi.jpg`],
      ['반짇고리', `${A}comic-assets/jeonrae-banjjogi/word-banjitgori.jpg`],
    ],
  },
];

/**
 * 🔴 **책 한 권이 한 카드다**(2026-08-19 사용자: "동화책마다 프레임 씌우고, 표지를 크게, 삽화를
 *    작게"). 예전엔 표지·낱말이 테두리 없이 한 줄에 흘러서 어디까지가 한 책인지 안 보였고,
 *    표지(20%)보다 낱말 카드가 커서 **주인공이 뒤바뀌어** 있었다. 이 절의 주어는 책이다.
 * ⚠️ 낱말 카드 폭을 `max-w-[26rem]` 로 묶었다가 되돌렸다(2026-08-19 사용자: "화면이 비면 안 되지").
 *    표지보다 작게 만들려다 오른쪽에 빈 땅이 300px 남았다 — **작게 만드는 것과 비우는 것은 다르다.**
 *    남는 폭은 채우되 한 장이 표지(34%)보다 작으면 주객은 안 뒤집힌다.
 */
function BookWords() {
  return (
    <div className="!mt-4 space-y-3">
      {BOOK_WORDS.map((b) => (
        <div
          key={b.title}
          className="flex items-stretch gap-3 rounded-3xl border border-ink-100 bg-white/70 p-3 sm:gap-5 sm:p-4"
        >
          {/* 🔴 표지 밑 제목·라인 글씨는 **뺐다**(2026-08-19 사용자) — 표지에 제목이 이미 그려져 있고
              (라이브러리 책 카드와 같은 이유), 그 두 줄 때문에 왼쪽만 아래로 길어져 두 칸 높이가
              어긋났다. 책 이름은 표지 `alt` 이 지킨다. */}
          <img
            src={b.cover}
            alt={`${b.title} 표지 — ${b.line}`}
            loading="lazy"
            className="aspect-video w-[38%] shrink-0 self-center rounded-2xl border border-ink-100 object-cover shadow-sm sm:w-[34%]"
          />
          {/* 🔴 낱말 카드가 **표지 높이에 맞춰 늘어난다** — 그림을 `flex-1` 로 두고 이름 줄을 밑에
              붙인다. 정사각형으로 고정하면 오른쪽만 짧아져 다시 어긋난다. */}
          <ul className="grid min-w-0 flex-1 grid-cols-4 gap-1.5 sm:gap-2.5">
            {b.words.map(([w, img]) => (
              <li
                key={w}
                className="flex flex-col overflow-hidden rounded-xl border border-peach-200 bg-white text-center"
              >
                <img
                  src={img}
                  alt={w}
                  loading="lazy"
                  className="min-h-0 w-full flex-1 object-cover"
                />
                <span className="block py-1 text-[10px] font-extrabold text-ink-900 break-keep sm:text-[13px]">
                  {w}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

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
              <h3 className="font-display text-2xl font-extrabold text-ink-900 break-keep sm:text-3xl lg:text-[30px] xl:text-[34px]">
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
            <p className="mt-2 text-base text-ink-600 break-keep lg:text-lg xl:text-[18px]">
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
/**
 * 코랄 띠 — 서비스 경계. 🔴 `n` 은 **선택**이다(2026-08-19 사용자: "여기 부분도 위에 빨간색 띠로
 * 구분하는 것처럼 구분하자"). 「왜 탱고북인가」는 세 번째 서비스가 아니라 두 서비스를 잇는 요약이라
 * 번호를 붙이면 거짓말이 된다 — 띠만 두고 숫자는 뺀다.
 */
function ServiceBanner({ n, name, tagline }: { n?: number; name: string; tagline?: string }) {
  return (
    <div className="mt-14 bg-gradient-to-br from-coral-500 to-coral-700 px-4 py-10 text-center sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {n !== undefined && (
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/25 font-display text-2xl font-extrabold text-white sm:h-12 sm:w-12 sm:text-3xl">
            {n}
          </span>
        )}
        <h2 className="mt-4 font-display text-[30px] font-extrabold leading-tight text-white break-keep sm:text-[40px] xl:text-[46px]">
          {name}
        </h2>
        {tagline && (
          <p className="mx-auto mt-3 max-w-xl text-[16px] leading-relaxed text-white/85 break-keep sm:text-lg">
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
      <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {eyebrow && (
          /* 🔴 **라벨을 키운다**(2026-08-10 사용자: "이게 메인 제목인거 같은데 왜 글씨가 제일 작아?").
             12px 는 각주 크기라 섹션 이름이 아니라 곁다리로 읽혔다. 제목보다는 확실히 작게 두되
             본문과 같은 무게로 올린다 — 순서는 [섹션 이름] → [질문 제목] 그대로다. */
          <p className="mb-2 text-base font-extrabold tracking-wide text-coral-700 sm:text-lg xl:text-xl">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[28px] font-extrabold leading-snug text-ink-900 break-keep sm:text-[34px] lg:text-[40px]">
          {title}
        </h2>
        <div className="mt-5 space-y-5 text-[16px] leading-relaxed text-ink-700 break-keep sm:text-[17px] lg:space-y-6 lg:text-[20px] lg:leading-[1.8] xl:text-[22px]">
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
                <span className="mt-1 block text-[14px] leading-snug text-ink-600 break-keep">
                  {c.d}
                </span>
              </div>
            </div>
          </Fragment>
        ))}
      </div>
      {/* 🔴 닫는 화살표(↩ 「읽은 게 다시 글자 진도로 돌아옵니다」) 상자는 **뺐다**(2026-08-19 사용자).
          셋째 칸이 이미 「동화책에서 다시 만나요」라 같은 말을 바로 아래에서 한 번 더 했고,
          점선 상자가 세 칸 밑에 붙어 그림이 네 덩이로 보였다. */}
    </div>
  );
}

export default function IntroPage() {
  useSeo({
    title: `한글 파닉스 ${FACTS.koreanUnits}단원 · 영어 파닉스 ${FACTS.englishUnits}단원 + 동화책 — 탱고북`,
    description:
      '자음·모음부터 받침·쌍자음까지 한글 파닉스 32단원, 영어 파닉스 39단원. 그리고 배운 글자로 바로 읽는 생활동화·세계명작·전래동화·자연관찰 동화책이 매달 늘어납니다. 4~7세 한글떼기. 한 달 무료로 써 보고 정하세요.',
    path: '/intro',
    // 🔴 나이 키워드는 5·6세에 몰려 있다(실측 2026-08-01): 5세한글공부 1,140 · 6세한글공부 940 ·
    //    7세 290 · 4세 220 · 3세 60. 제품은 4~7세가 맞지만, 그 표현만 쓰면 2,080 을 못 받는다.
    keywords:
      '5세 한글공부, 6세 한글공부, 한글앱, 한글 파닉스, 한글떼기, 한글떼는시기, 자음모음, 받침, 파닉스앱, 영어 파닉스, 유아 영어, 7세 한글공부, 4세 한글공부',
  });

  return (
    <div className="min-h-dvh bg-cream-50 pb-24">
      {/* ── ① 히어로 ─────────────────────────────────────────── */}
      <PublicNav />
      <header className="relative overflow-hidden bg-gradient-to-b from-peach-100 via-peach-50 to-cream-50 px-4 pb-10 pt-4 sm:px-6 sm:pb-14 sm:pt-16">
        <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-coral-100/60 blur-3xl" />
        {/* 🔴 로고를 큼지막하게 맨 위에(2026-08-05 사용자) — 브랜드가 먼저다. width/height 로 CLS 방지. */}
        {/* 🔴 **로고를 크게**(2026-08-11 사용자: "너무 작다 확 키워"). 64/80px 은 앱 헤더 크기라
            광고 랜딩 첫 화면에선 각주처럼 보였다 — 광고를 보고 들어온 사람이 처음 확인하는 건
            "여기가 어디냐"다. 2:1 비율이라 144px 이면 폭 288px, 375px 화면에서도 넉넉하다.
            🔴 이만큼 키워도 **모바일 CTA 는 접힘선 위**(812px 화면에서 하단 692px). */}
        <Link to="/library" aria-label="탱고북 홈" className="relative mx-auto mb-5 block w-fit">
          <img
            src="/logo/logo-kr-520.webp"
            alt="탱고북"
            width={1774}
            height={887}
            /* 🔴 첫 화면 그림 셋(로고·파닉스·표지)만 `fetchPriority="high"` — 프리렌더가 이 표시가
               붙은 그림의 src 만 남긴다(`scripts/prerender.mjs`). 나머지는 하이드레이션 뒤에 뜬다. */
            fetchPriority="high"
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
        <div className="relative mx-auto max-w-3xl text-center lg:max-w-5xl xl:max-w-6xl">
          <p className="inline-flex rounded-full bg-coral-100 px-4 py-1.5 text-base font-extrabold text-coral-700 sm:text-lg xl:px-5 xl:py-2 xl:text-xl">
            4~7세 한글·영어
          </p>
          {/* 🔴 **데스크탑에선 한 줄**(2026-08-10). 글자 수가 늘면 크기를 줄여서라도 한 줄로 — 44px.
              🔴 **연결은 헤드라인이 아니라 바로 아래 그림이 말한다**(2026-08-19 사용자 문구).
                 2026-08-18 엔 「오늘 배운 글자로 오늘 동화책을 읽어요」로 연결을 헤드라인에 담았는데,
                 그때는 헤드라인 밑이 곧 브릿지 그림 하나였다. 지금은 **세 칸 지도(파닉스→낱말→동화책)
                 가 먼저** 오고 브릿지가 그 한 사례라, 연결은 그림 둘이 잇달아 말한다.
                 그래서 헤드라인은 **범위**를 맡는다 — 「한글·영어」와 「다양한」이 그 몫이고,
                 그 둘은 예전 문장에 아예 없던 정보다. */}
          <h1 className="mt-3 font-display text-[28px] font-extrabold leading-[1.25] text-ink-900 break-keep sm:text-[30px] md:text-[36px] xl:text-[44px]">
            <span className="text-coral-700">한글·영어 파닉스</span>를 배우고{' '}
            <br className="md:hidden" />
            다양한 <span className="text-coral-700">동화책</span>을 읽어요
          </h1>
          {/* 🔴 부제를 두지 않는다(2026-08-18 사용자). H1 을 풀어 쓴 문장은 정보가 안 늘고
              같은 말을 두 번 읽힌다 — 히어로에서 헤드라인 다음에 오는 건 그림과 CTA 다. */}

          {/* 🔴 **큰 그림 먼저, 그 한 사례가 그다음**(2026-08-19 사용자: "이걸 맨 위로 올리고,
              그 아래에 오리 이미지"). 세 칸(파닉스→낱말→동화책)이 무엇이 얼마나 있고 어떻게
              이어지는지를 말하고, 아래 브릿지(ㄹ+ㅣ → 오리 → 미운 아기 오리)가 **그중 한 줄을
              실제 화면으로** 보인다. 반대로 놓으면 오리 하나를 보고 나서야 전체를 듣는다.
              🔴 순환 그림(`LearnReadCycle`)은 아래 절에 그대로 둔다 — 그건 「어떻게 도는지」를 앱
              화면으로 보이는 것이라 파닉스·동화책이 뭔지 알기 전엔 무슨 화면인지 모른다
              (2026-08-11 에 그 절을 통째로 위로 올렸다가 같은 이유로 되돌렸다). */}
          <div className="mt-5 text-left sm:mt-7">
            <WordBookMesh />
          </div>

          {/* 🔴 두 상자가 **같은 모양·같은 폭**이라 나란히 놓으면 무엇이 다른지 안 보인다
              (2026-08-19 사용자: "위에는 전체 모식이고 아래는 예시라는 표시가 있으면"). 위는
              「우리가 가진 것 전부」, 아래는 「그중 한 줄이 실제 화면에서 이렇게」다.
              🔴 상자마다 제목을 다는 대신 **사이에 한 줄**을 둔다 — 아래로 내리꽂는 화살표가
              위아래를 잇고, 문장이 「예를 들면」이라고 말한다. 상자 제목을 붙이면 앞서 지운
              그 제목 줄이 두 개로 돌아온다. */}
          <p className="mt-4 flex items-center justify-center gap-2 font-display text-[17px] font-extrabold text-coral-700 break-keep sm:mt-6 sm:gap-3 sm:text-[24px] xl:text-[28px]">
            <span aria-hidden className="text-[20px] sm:text-[30px] xl:text-[34px]">
              ↓
            </span>
            예를 들면, 「ㄹ」 단원은 이렇게 흘러요
          </p>

          <HeroBridge />

          <Link
            to={SIGNUP}
            /* 🔴 375px 에서 17자를 한 줄에 넣으려면 글자를 줄여야 한다 — 대신 **폭을 꽉 채운다**
               (모바일 블록 버튼). 데스크탑은 예전처럼 알약. */
            className="mt-5 inline-flex min-h-[68px] w-full max-w-[22rem] items-center justify-center rounded-full bg-coral-700 px-6 text-lg font-extrabold text-white shadow-lg transition hover:bg-coral-800 sm:mt-8 sm:w-auto sm:max-w-none sm:px-12 sm:text-2xl xl:mt-10 xl:min-h-[104px] xl:px-20 xl:text-[32px]"
          >
            한 달 무료로 시작하기
          </Link>
        </div>
      </header>

      <TryBridge />

      {/* ── ③ 파닉스 커리큘럼 (데모보다 먼저 — 아래 데모가 32개 중 하나임을 알고 보게) ─────────────────────────────────── */}
      {/* 🔴 **가르치는 법을 설명하지 않는다**(2026-08-05 사용자: "이런 얘기는 안 해도 됨.
          그냥 우리가 이걸 컨텐츠를 가지고 있다고만 언급하면 됨"). 「기역은 이름이지 소리가
          아니다」는 우리끼리 옳은 얘기고, 부모가 이 자리에서 궁금한 건 **뭐가 얼마나 있나**다.
          제목도 「이름이 아니라 소리부터」에는 정작 **한글**이 안 들어 있었다. */}
      {/* 🔴 **파닉스를 한 배너로 합친다**(2026-08-18 리뷰). 예전엔 한글·영어·동화책이 번호 달린
          전폭 밴드 셋으로 페이지를 셋으로 끊었다 — 연결을 주장하는 페이지의 뼈대가 정작
          **카탈로그**를 말하고 있었다. 둘은 이어지고 셋은 목록이다. */}
      <ServiceBanner
        n={1}
        name="탱고북 파닉스"
        tagline={`한글 ${FACTS.koreanUnits}단원 · 영어 ${FACTS.englishUnits}단원 — 소리로 글자를 뗍니다.`}
      />

      {/* ── ③-0 파닉스가 뭔가요 — **서비스 1 자리에선 파닉스만 말한다**(2026-08-11 사용자)
          🔴 **「가르치는 법을 설명하지 않는다」(2026-08-05)를 뒤집는다.** 그때는 부모가 궁금한 게
             「뭐가 얼마나 있나」라고 봤는데, 벤치마크 둘 다 파닉스 상세 첫머리를 **파닉스가 뭔지**로
             연다(소중한글 「한글 파닉스란?」·「파닉스로 배워야 하는 이유」 3카드 / 토도 「자모음절식
             학습법」 + "'김밥'은 읽는데 '김'은 못 읽는다고요?"). 이 카테고리에서 부모가 실제로 갖는
             질문이 그것이고, 답하지 않으면 32단원 숫자가 무슨 뜻인지 모른 채 지나간다.
          🔴 **베낀 것 = 구조와 논점, 문장이 아니다.** 후크는 우리 낱말로 다시 썼고(김밥/김 → 가구/가),
             🔴 **소중한글의 「2개월 만에 80%」·「전문가 23명」·토도의 「교수 감수」는 안 쓴다** —
             우리에겐 그 데이터도 감수도 없다(전사 규칙).
          🔴 카드에 이모지·아이콘 대신 **글자 자체(ㄱ → 가 → 고기)** 를 크게 세운다. 셋을 나란히
             보면 자모→음절→낱말이 그림 없이도 읽히고, 검은 글씨만 이어지던 이 구간에 색이 생긴다. */}
      <Section
        eyebrow="왜 파닉스인가"
        title={
          <>
            「가구」는 읽는데 <span className="text-coral-700">「가」는 못 읽어요</span>
          </>
        }
      >
        <p>
          통글자로 외운 아이는 <strong>아는 낱말만</strong> 읽습니다. 처음 보는 낱말 앞에서는 다시
          멈춰요.
        </p>
        {/* 🔴 이 한 장만 **실사**다(2026-08-19 사용자: "실제 아이 모습으로 해야지"). 나머지 그림은
            펠트 인형과 앱 화면 — 그건 **우리 안 얘기**고, 이 문장은 **부모가 자기 아이를 떠올리는
            자리**라 register 가 달라야 한다.
            🔴 **어깨 너머에서 찍는다.** 앞에서 찍으면 카드 글자가 카메라를 향하고, 그러면 아이는
            뒷면을 보고 있는 셈이 된다(두 번 틀렸다 — 손에 들려도, 책상에 눕혀도 마찬가지).
            아이 뒤에서 봐야 글자 방향이 아이 기준으로 맞고 우리도 같이 읽는다.
            🔴 **카드가 주인공이라 크게 잡는다** — 이 그림은 좌우로 갈려 한 칸이 570px(모바일 340px)
            이라, 뒤통수가 화면을 덮으면 「가구」가 안 읽힌다. */}
        <figure className="!mt-5">
          <img
            src="/landing/hangul/problem.webp"
            alt="아이가 「가구」 카드는 손가락으로 짚어 읽고, 「가」 카드 앞에서는 머리를 긁적이며 멈춘 모습"
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
            className="aspect-video w-full rounded-3xl object-cover"
          />
          <figcaption className="mt-2 text-center text-[13px] font-bold text-ink-600 break-keep sm:text-[15px]">
            낱말은 통째로 외웠지만, 그 안의 글자 하나는 처음 보는 것이 됩니다.
          </figcaption>
        </figure>
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
                <span className="mt-1.5 block text-base leading-snug text-ink-600 break-keep lg:text-lg xl:text-[18px]">
                  {w.d}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="!mt-3">
          <UnitWords
            words={GA_WORDS}
            lead={
              <>
                그래서 <span className="text-coral-700">이런 낱말</span>을 읽게 돼요
              </>
            }
            sub="「ㄱ」 단원에서 만나는 낱말 넷입니다. 글자만 떼고 끝나지 않아요."
          />
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
                <span className="ml-2 text-base text-ink-600 break-keep lg:text-lg xl:text-[18px]">
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
        {/* 🔴 여기엔 연출 사진을 두지 않는다(2026-08-10 사용자). 바로 아래가 「직접 해보기」라
            **진짜 화면이 곧 나오는데** 그 앞에 태블릿 사진을 800px 깔면 도달만 늦어진다.
            (합성본은 `public/landing/hangul/siblings.webp` 에 남아 있다.) */}
        {/* 🔴 이 절엔 버튼을 두지 않는다(2026-08-18 사용자). 히어로 데모 상자의
            「앱에서 이어서 하기」가 이미 파닉스로 보내고, 여기 또 두면 한 화면 안에서 같은 방향으로
            두 번 미는 셈이다. 이 절이 할 일은 **무엇이 있는지 보여주는 것**이다. */}
      </Section>

      {/* ── ④.5 영어 파닉스 — **한 페이지에 합친다**(2026-08-11 사용자: "요금제에 전부 포함인데
          같이 넣는 게 맞을 거 같긴 한데"). `/english` 를 따로 두면 한 이용권으로 다 열린다는 사실이
          두 페이지로 갈라져 보인다. 대신 **분량은 한글의 1/3** — 광고 본진은 한글이고, 영어까지
          단원을 통째로 얹으면 같은 형식이 열여덟 번 이어진다. */}
      {/* 🔴 **펴 둔다**(2026-08-18 사용자). 예전엔 기본 접힘이었는데, 접는 근거였던 「커리큘럼+데모
          3개가 4화면을 민다」가 사라졌다 — 데모를 히어로 아래 하나로 합치면서 이 절은 커리큘럼
          다섯 줄뿐이라 1화면이 안 된다. 접어 두면 「영어도 포함」이 요약 줄 한 줄로만 남는데,
          영어 검색 수요가 한글과 거의 같다(영어파닉스 2,020 vs 한글공부 2,230). */}
      <div className="px-4 pb-12 sm:px-6 sm:pb-14">
        <div className="mt-2">
          <Section
            title={
              <>
                영어 파닉스 <span className="text-coral-700">{FACTS.englishUnits}단원</span>
              </>
            }
          >
            <p>
              알파벳 소리에서 시작해 매직 e·블렌드·모음팀까지, <strong>다섯 권</strong>으로
              이어져요. 한글 파닉스와 <strong>같은 이용권</strong>이라 따로 결제하지 않습니다.
            </p>
            <div className="!mt-6 grid gap-3 sm:grid-cols-3">
              {ENGLISH_WHY.map((w) => (
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
                    <span className="mt-1.5 block text-base leading-snug text-ink-600 break-keep lg:text-lg xl:text-[18px]">
                      {w.d}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="!mt-3">
              <UnitWords
                words={EN_WORDS}
                lead={
                  <>
                    그래서 <span className="text-coral-700">이런 낱말</span>을 읽게 돼요
                  </>
                }
                sub="「Short Vowel a」 단원에서 만나는 낱말 넷입니다."
              />
            </div>
            <ol className="!mt-8 space-y-2">
              {EN_STAGES.map((s, i) => (
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
                    <span className="ml-2 text-base text-ink-600 break-keep lg:text-lg xl:text-[18px]">
                      {s.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        </div>
        {/* 🔴 **진도표는 파닉스 쪽에 둔다**(2026-08-19 사용자) — 동화책 절에 있을 땐 「동화책에서
            맞히면 파닉스 표가 올라간다」는 문장이 **부모가 본 적 없는 표**를 가리켰다. 파닉스를
            읽은 직후에 표를 보여 두면, 아래 그 문장이 이미 아는 표를 가리킨다.
            🔴 **한글·영어 한 장씩 좌우로**(사용자) — 두 절을 다 읽은 뒤라야 둘을 나란히 놓을 수 있다.
            ⚠️ 두 그림은 모양이 많이 다르다(한글=세로 격자 / 영어=음소 칩 + 막대). 같은 틀로 맞추려
            애쓰지 말 것 — 두 언어의 진도가 실제로 다르게 생겼다.
            자산 = `scripts/capture-phonics-grids.mjs`(임시 페이지 `/_shot/phonics-grids`). */}
        <div className="mx-auto max-w-3xl px-4 pb-2 sm:px-6 lg:max-w-5xl xl:max-w-6xl">
          <p className="text-[17px] font-extrabold text-ink-900 break-keep sm:text-xl">
            부모 화면에는 <span className="text-coral-700">어디까지 익었는지</span>가 칸으로 보입니다
          </p>
          <p className="mt-1 text-[14px] text-ink-600 break-keep sm:text-base">
            어느 글자가 익었고 어디서 멈추는지, 한글과 영어를 따로 봅니다.
          </p>
          <div className="mt-4 grid items-start gap-3 sm:grid-cols-2">
            {[
              {
                src: 'report-grid',
                w: 1680,
                h: 1995,
                cap: '한글 — 자음 × 모음',
                alt: '부모 리포트의 자음×모음 표 — ㄱ·ㄴ·ㄷ 줄은 익힘(초록), ㄹ·ㅁ 줄은 연습 중(주황)',
              },
              {
                src: 'report-grid-en',
                w: 1680,
                h: 1344,
                cap: '영어 — 음소와 권',
                alt: '부모 리포트의 영어 스킬트리 — Book 1 은 a~h 익힘, i~m 연습 중',
              },
            ].map((g) => (
              <figure key={g.src} className="rounded-3xl bg-white/70 p-3 sm:p-4">
                <img
                  src={`/landing/hangul/${g.src}.webp`}
                  alt={g.alt}
                  width={g.w}
                  height={g.h}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-2xl border border-ink-100"
                />
                <figcaption className="mt-2 text-center text-[13px] font-bold text-ink-600 break-keep sm:text-[15px]">
                  {g.cap}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

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
            {/* 🔴 낱말 수는 **`vocabWords`(823)** 다 — 위 세 칸 그림의 370 은 「파닉스 낱말 중
                동화책과 이어진 것」이라 다른 숫자다. 둘을 바꿔 쓰면 같은 페이지가 두 말을 한다. */}
            뗀 글자로 읽을 책이 <span className="text-coral-700">{FACTS.books}권</span>, 그 안에
            낱말이 <span className="text-coral-700">{FACTS.vocabWords}개</span> 있습니다
          </>
        }
      >
        <p>
          네 갈래로 나뉘어 있어요. 아이 취향이 어디에 있든 볼 책이 있고,{' '}
          <strong>매달 새 동화책이 늘어납니다.</strong>
        </p>
        <LineSections />
        {/* 읽기만 하고 끝나지 않는다 — 어휘·문해력·독후활동. 여기부터가 「그래서 뭐가 자라나」. */}
        <h3 className="!mt-10 font-display text-[23px] font-extrabold text-ink-900 break-keep sm:text-[28px]">
          책마다 핵심 낱말이 있어요
        </h3>
        <BookWords />
        {/* 🔴 아래 세 문단과 읽어주기 데모 상자는 **뺐다**(2026-08-19 사용자).
            ①「독후활동 게임이 열려요」·「파닉스 진도에도 쌓입니다」는 바로 위 세 칸 그림(파닉스→낱말
            →동화책)이 이미 한 말이고, 파닉스 표는 이제 파닉스 절에 있어서 그 문장이 가리킬 그림도
            여기 없다. ②읽어주기 상자는 이 절에서 유일한 라이브 데모였지만, 이 절의 주장은 「책이
            이만큼 있다」이고 그건 라인 격자와 표지가 이미 보여 준다 — 상자 하나가 2화면을 먹었다.
            ⚠️ 그때 **세는 법**만 남긴다: 색인은 `[책, 쪽]` 쌍이라 한 책의 여러 쪽이 여러 항목으로
            들어간다 — 거미는 항목 12개인데 책은 2권이었고 그걸 「12권」이라 쓰고 있었다.
            권수를 쓸 일이 생기면 `new Set(...map(([id]) => id)).size` 로 셀 것. */}
      </Section>

      {/* ── ⑤.5 두 서비스가 한 바퀴 — 순환 그림 ─────────────────────────
          🔴 **자리 = 두 서비스를 다 소개한 뒤**(2026-08-11 사용자: "여기는 서비스 1 이잖아,
             한글 파닉스만 집중해서 설명하는 게 맞을 듯"). 파닉스 배너 바로 밑에 뒀더니
             ①서비스 1 자리에서 동화책 얘기를 하고 ②히어로가 이미 한 말을 두 번째로 했다.
             둘을 다 본 다음이라야 「그래서 이 둘이 이어진다」가 요약으로 읽힌다.
          🔴 「설치·약정·광고 없음」도 같이 왔다 — 바로 아래가 요금이라 오히려 제자리다. */}
      <ServiceBanner name="왜 탱고북인가" />
      <Section title="배우는 곳과 읽는 곳이 한 바퀴로 이어집니다">
        <p>
          글자만 배우고 끝나면 금세 흐려집니다. 탱고북은 배운 글자로 읽을 책이 같은 앱 안에 있어서,
          읽은 것이 <strong>다시 글자 진도로 돌아옵니다.</strong>
        </p>
        {/* 🔴 **한 바퀴가 말이 아니라 화면에서 실제로 돈다**(2026-08-12 연결 완료) — 위 파닉스
            데모의 「그림 짝 찾기」에서 낱말을 맞히면 그 자리에서 확인할 수 있다. */}
        <p>
          파닉스에서 낱말을 맞히면 <strong>그 낱말이 나오는 동화책 한 쪽</strong>이 그 자리에서
          열립니다 — 삽화와 문장이 함께 나오고, 맞힌 낱말에 색이 들어가고, 읽어 줍니다. 한 판이
          끝나면 <strong>방금 만난 책들의 표지</strong>가 떠서 그대로 읽으러 갈 수 있어요.
        </p>
        <LearnReadCycle />
      </Section>

      {/* ── ⑦ 혜택 (여기서 처음 등장) ─────────────────────────── */}
      <Section eyebrow="요금" title="한 달 무료로 써 보고 정하세요">
        {/* 🔴 광고는 예전부터 **한 달**로만 말해 왔다(2026-08-05) — 그때는 실제로 1년이 열려서
            "받는 게 말한 것보다 큰" 과소 주장이었고, 오퍼를 접어도 문구를 안 고쳐도 되는 게
            값어치였다. 2026-08-11 접근 정책이 **가입 30일 무료** 한 줄로 정리되면서 이제
            문구와 실제가 정확히 같아졌다(`TRIAL_DAYS`). 기간을 바꿀 땐 여기도 같이 볼 것. */}
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
        <p>
          아이가 무엇을 했는지 <strong>부모 화면에 그대로 남습니다.</strong> 어떤 글자에서 자꾸
          멈추는지, 어떤 낱말을 다시 보면 좋은지 — 밤에 한 번 열어보면 오늘 뭘 했는지 보입니다.
        </p>
        {/* 🔴 **없는 기능을 안내하고 있었다**(2026-08-18 리뷰). 「게스트로 30일」은 2026-08-11
            접근 정책 정리 때 폐지됐는데 문구만 남아 있었다 — 라이브 광고 랜딩에서.
            🔴 접근 정책을 바꾸면 **마케팅 문구 사본을 전부 세야 한다**(랜딩·블로그·공유문구).
            그리고 지금 게이팅(미로그인도 동화책 전권)은 그때보다 훨씬 센 말을 쓸 수 있게 해준다 —
            경쟁사는 「게임 직접 해보기」 버튼조차 앱스토어로 가므로, 이 한 줄이 우리 유일한 우위다. */}
        <p className="text-base text-ink-600">
          <strong>가입하지 않아도 동화책은 다 읽힙니다.</strong> 가입하면 독후활동과 학습 기록이
          열려요.
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
            className="mt-1 inline-flex min-h-[52px] w-full max-w-[22rem] items-center justify-center rounded-full bg-coral-700 px-6 text-base font-bold text-white shadow-md transition hover:bg-coral-800 sm:w-auto sm:max-w-none sm:px-8 sm:text-lg"
          >
            한 달 무료로 시작하기 →
          </Link>
        </div>
      </Section>

      <StickyCta />
      <SiteFooter lang="ko" />
    </div>
  );
}
