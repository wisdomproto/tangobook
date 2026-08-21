import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PLANS } from '@tangobook/shared';
// 🔴 랜딩 문구는 `landing` 네임스페이스 하나에 모은다 — 파일만 놓으면 i18n 이 자동 등록한다
//    (`i18n/index.ts` 가 `locales/ko/*.json` 글롭으로 ns 를 파생). `Trans` 는 문장 안 강조용.
import { useTranslation, Trans } from 'react-i18next';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { PublicNav } from '@/components/PublicNav';
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
   * 동화책에서 배우는 **서로 다른** 낱말 수 — 공개 266권의 `key_objects[].korean` 을 중복 제거.
   * 🔴 **823 은 재현이 안 됐다**(2026-08-19 전수 재측정). 지금 프로덕션은 key_objects 총 1,471개 ·
   *    서로 다른 한국어 낱말 **547개**다. 823 에 가장 가까운 786 은 **아직 R2 에 적용 안 된**
   *    `_data/key-objects/` picks 를 더한 값이라, 그때 「앞으로 될 것」을 「지금 있는 것」으로 썼던
   *    듯하다. 라이브 광고 랜딩의 h2 에 박히는 숫자다 — 세는 법을 여기 적어 둔다:
   *    공개 동화책 전권을 받아 `key_objects[].korean` 을 `Set` 에 넣고 크기를 본다.
   * 🔴 총합(1,739)이 아니라 **중복 제거**를 쓴다 — 같은 낱말이 여러 책에 나오는데 다 더하면
   *    아이가 배우는 낱말 수가 세 배 가까이 부풀려진다.
   * ⚠️ **자주 낡는다** — 2026-08-19 하루에 547 → 630 이 됐다(호리 78권에 낱말 268개가 붙었다).
   *    창작동화가 계속 들어오므로 이 숫자는 계속 는다. 목표는 1,500(초등 입학 전 필수단어).
   */
  vocabWords: 630,
  categories: 13,
  /** ko+en+vi+zh+th 제목 번역을 모두 가진 책. 「5개 언어」는 이 숫자로만 말한다. */
  fiveLangBooks: 191,
  /**
   * 🔴 그림체 **종류**(라이브러리 전체 9종)와 **책당 개수**는 다르다. 실측 분포는
   * 0종 97 · 1종 121 · 3종 45 · 4종 3 이라 「한 권을 9가지로」는 거짓이었다(초안에서 잡음).
   * 3종 이상 가진 책만 센다.
   */
  multiStyleBooks: 48,
  /**
   * 가입하지 않고 읽을 수 있는 동화책 수 — FAQ 답에 보간으로 들어간다.
   * 🔴 세는 법 = 공개 동화책 중 `isAccessibleForFree !== false` 인 것(`PAYWALL_ENABLED`·
   *    `LOCK_FOR_GUESTS` 가 둘 다 true 다). **접근 정책을 바꾸면 다시 센다** — 같은 사고가
   *    08-18(「게스트 30일」)·08-19(「전권 무료」)에 두 번 났고, 이제 다섯 언어가 한꺼번에
   *    거짓말을 하게 되므로 값은 여기 한 곳에만 둔다.
   */
  freeBooks: 129,
};

/** 한글 파닉스 다섯 단계 — 커리큘럼과 같은 순서. */
/**
 * 🔴 **글자 자체(`ㅏ ㅑ ㅓ` · `ㄲ ㄸ ㅃ`)는 번역하지 않는다** — 그게 배우는 대상이다.
 *    번역되는 건 그 옆의 **이름과 설명**(모음/자음/받침…)이라 `k` 로 `landing` 네임스페이스를
 *    가리키고, 자모 예시만 여기 남는다(파닉스 다국어와 같은 규칙 → memory `phonics-i18n-2026-08-11`).
 * 🔴 단원 수는 `{{n}}단원` 보간이다 — 언어마다 단위가 앞에 붙기도 한다("8 units" vs "8단원").
 */
const STAGES: { k: string; n: number; tone: string }[] = [
  { k: 'vowel', n: 1, tone: 'bg-peach-100 text-ink-800' },
  { k: 'consonant', n: 14, tone: 'bg-coral-100 text-coral-700' },
  { k: 'coda', n: 7, tone: 'bg-mint-100 text-mint-700' },
  { k: 'tense', n: 5, tone: 'bg-peach-100 text-ink-800' },
  { k: 'complex', n: 5, tone: 'bg-coral-100 text-coral-700' },
];

/** ⑦ 무료체험 마찰 제거 FAQ — 벤치마킹 2차 §4-5(투두 FAQ 아코디언). 답이 전부 「없음」이라 강점. */
/** 원화 천단위 — FAQ 답에서 `PLANS` 금액을 그대로 읽어 쓰려고 둔다. */
const won = (n: number) => n.toLocaleString('ko-KR');

/**
 * 🔴 **요금 절을 통째로 FAQ 로 접었다**(2026-08-21 사용자: "왜 탱고북인가 -> FAQ / 요금도 FAQ 중
 *    하나로 넣자"). 예전 「요금」 절은 문단 다섯이 전부 **「없습니다」로 끝나는 답**이었다 —
 *    카드 없음 · 자동결제 없음 · 광고 없음 · 약정 없음. 물음이 없는데 답만 늘어놓던 것이라,
 *    각 문단 앞에 부모가 실제로 하는 물음을 붙이니 그대로 FAQ 가 됐다(내용은 하나도 안 버렸다).
 * 🔴 **첫 항목이 요금이다** — 아코디언은 첫 줄만 열려 보이므로 순서가 곧 우선순위다.
 * 🔴 답에 박은 숫자는 정책에서 나온다: 「한 달」=`TRIAL_DAYS`(30) · 「129권」=공개 동화책 중
 *    `isAccessibleForFree !== false` 인 수. **접근 정책을 바꾸면 이 두 답을 다시 센다** —
 *    같은 사고가 08-18(게스트 30일)·08-19(「전권 무료」)에 이미 두 번 났다.
 */
/**
 * 🔴 답에 박힌 숫자는 **코드에서 온다** — 금액은 `PLANS`, 무료 권수는 접근 정책. 번역문에
 *    숫자를 적어 두면 값이 바뀌는 날 다섯 언어가 한꺼번에 거짓말을 한다. 보간으로만 넣는다.
 */
const FAQ_KEYS = [
  'price',
  'autoPay',
  'noSignup',
  'install',
  'ads',
  'contract',
  'report',
  'twoKids',
] as const;

/** FAQ 답에 들어가는 값 — 키마다 필요한 것만 넘긴다(없으면 i18next 가 무시한다). */
const FAQ_VARS = {
  month: won(PLANS.month1.amount),
  year: won(PLANS.year1.amount),
  n: FACTS.freeBooks,
};

/**
 * 「왜 파닉스인가」 3카드 — 소중한글 「원리의 이해 / 뛰어난 효과 / 논리력과 사고력」 구조를 가져오되
 * 가운데 칸은 바꿨다. 그쪽 근거는 「2개월 만에 80%」 체험단 데이터라 **우리에겐 그 숫자가 없고**,
 * 없는 걸 흉내 내느니 우리도 참인 것(**처음 보는 글자를 읽는다**)을 세운다.
 * 🔴 **카드마다 그 말을 하는 진짜 앱 화면**(2026-08-11 사용자: "너무 텍스트만 있는 거 아냐?").
 *    처음엔 큰 글자(ㄱ→가→고기)만 얹었는데 그건 결국 또 글자였다. 헤드리스로 실제 활동 세 개를
 *    16:9 로 찍어 얹는다 — **아래 라이브 상자 둘(배우기·써보기)과 겹치지 않는 화면**으로 골라서,
 *    이 구간이 32단원의 다른 얼굴을 보여주게 한다(모음 듣기 · 음절 합체 · 글자 사냥).
 */
const PHONICS_WHY: { shot: string; k: string }[] = [
  { shot: 'why-sound', k: 'sound' },
  { shot: 'why-blend', k: 'blend' },
  { shot: 'why-new', k: 'unseen' },
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
// 🔴 낱말을 문장에 적지 않는다 — 그림짝은 판마다 낱말을 **랜덤으로 뽑아서**, 스크린샷을
//    다시 찍으면 캡션이 거짓이 된다(bat·cat·hat·fan 로 바뀌는 걸 실제로 봤다). 번역문도 마찬가지.
const ENGLISH_WHY: { shot: string; k: string }[] = [
  { shot: 'en-why-sound', k: 'alphabet' },
  { shot: 'en-why-blend', k: 'blend' },
  { shot: 'en-why-new', k: 'read' },
];

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
 *    `fetchPriority="high"` 로 프리렌더 HTML 에 src 가 남는 세 장 안에 든다.
 */
/** 칸 사이 화살표. 🔴 375px 에선 세로로 쌓이므로 아래를 가리키게 돌린다. */
function Arrow() {
  return (
    <span
      aria-hidden
      /* 🔴 제목이 그림 **위**로 올라오면서 화살표도 가운데로 내렸다(2026-08-21) — 예전 `sm:mt-10
         sm:self-start` 은 라벨이 그림 위 한 줄일 때 그림 top 에 맞추려던 값이다. */
      className="self-center text-2xl font-extrabold text-coral-500 sm:text-4xl xl:text-5xl"
    >
      <span className="sm:hidden">↓</span>
      <span className="hidden sm:inline">→</span>
    </span>
  );
}

function HeroBridge() {
  const { t } = useTranslation('landing');
  return (
    /* 🔴 **지도와 브릿지를 한 상자로 합쳤다**(2026-08-21 사용자: "2단계 위 아래로 말고 하나로 못
       만드나… busy 해 보인다 / 한눈에 확 안 들어와"). 둘은 **같은 세 칸**(파닉스 → 어휘 → 동화책)
       이었다 — 지도는 개수를 펠트 사진으로, 브릿지는 같은 셋을 앱 화면으로 말했다. 세로로 겹쳐
       놓으니 상자 둘 · 화살표 넷 · 제목줄 둘이라 어디를 먼저 봐야 할지가 없었다.
       합치는 규칙: **앱 화면을 남기고 사진을 버린다**(진짜 화면이 증거고 펠트 사진은 장식이다).
       한 칸이 위에서 아래로 셋을 말한다 — ①큰 제목(무엇) ②앱 화면(어떻게) ③예시·개수(얼마나).
       🔴 **제목은 그림 위**여야 셋이 한 줄로 읽힌다 — 그림 아래에 두면 그림 비율이 제각각
       (7:6 · 3:2 · 16:9)이라 제목 셋이 계단처럼 어긋난다. 그게 「한눈에 안 들어온다」의 실제 원인.
       🔴 375px 에선 세로로 쌓는다 — 세 칸이면 하나가 100px 이라 **앱 화면 속 글자**가 안 읽힌다
       (칸이 사진이던 시절엔 세 칸을 유지했지만, 이제 칸 내용이 글자가 든 화면이라 규칙이 뒤집힌다). */
    /* 🔴 **칸마다 흰 카드 + 번호 배지**(2026-08-21 사용자 시안: "강조할 텍스트는 크기나 모양이나
       색을 좀 확실히해"). 그 전엔 큰 상자 하나 안에 세 칸이 테두리 없이 떠 있어서, 어디까지가 한
       칸인지를 **간격만으로** 구분해야 했다 — 강조는 색·크기·모양 셋으로 주는 것이고 그중 둘이
       비어 있었다. 카드(모양) + 코랄 원 번호(색) + 제목 확대(크기)를 한꺼번에 준다.
       🔴 겉 상자의 테두리·배경은 뺐다 — 카드가 생기면 상자 안에 상자가 되어 테두리가 두 겹이다. */
    <div className="mx-auto mt-5 sm:mt-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2.5 xl:gap-4">
        {CHAIN_STEPS.map((step, i) => (
          <Fragment key={step.k}>
            {i > 0 && <Arrow />}
            <div
              className={`flex min-w-0 flex-col rounded-3xl bg-white p-3 shadow-[0_2px_12px_rgba(196,58,28,0.08)] sm:p-4 xl:p-5 ${
                i === 2 ? 'sm:flex-[1.25]' : 'sm:flex-1'
              }`}
            >
              {/* 🔴 번호는 **원 배지**로 — 「①」 문자를 쓰면 본문 글자와 같은 색·굵기라
                  순서가 아니라 글머리표로 읽힌다. 배지는 코랄 채움이라 제목보다 먼저 눈에 든다. */}
              <strong className="mb-2 flex items-center justify-center gap-1.5 font-display text-[18px] font-extrabold leading-tight text-ink-900 break-keep sm:gap-2 sm:text-[19px] md:text-[22px] xl:text-[27px]">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-600 text-[13px] text-white sm:h-7 sm:w-7 sm:text-[15px] xl:h-9 xl:w-9 xl:text-[19px]"
                >
                  {i + 1}
                </span>
                <span>
                  {t(`chain.${step.k}.t`)}
                  {step.hasCount && (
                    <span className="text-coral-700"> {t(`chain.${step.k}.n`)}</span>
                  )}
                </span>
              </strong>
              <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-cream-50">
                <img
                  src={step.img}
                  alt={t(`chain.${step.k}.alt`)}
                  width={step.w}
                  height={step.h}
                  fetchPriority="high"
                  className="w-full object-cover"
                  style={{ aspectRatio: `${step.w}/${step.h}` }}
                />
                {/* ② 낱말 칸의 정답 테두리. 🔴 위치는 **퍼센트** — 그림이 화면 폭에 따라 늘어난다. */}
                {i === 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute rounded-xl ring-[3px] ring-coral-500 sm:rounded-2xl sm:ring-4"
                    style={{ left: '5.7%', top: '4.8%', width: '38.5%', height: '87%' }}
                  />
                )}
                {/* ③ 🔴 문장 강조는 **앱과 같은 노란 하이라이트** — 리빌 화면에서 맞힌
                    낱말에 색이 들어가는 그 표시다. */}
                {i === 2 && (
                  <p className="bg-white px-2 py-1.5 text-left text-[12px] font-bold leading-snug text-ink-800 break-keep sm:px-3 sm:py-2 sm:text-[15px] xl:text-lg">
                    {/* 🔴 문장은 번역하되 **낱말 「오리」에 노란 표시**는 유지된다 —
                        `<m>` 이 그 자리를 잡아 준다(`Trans` components). 표시 자체가 「맞힌 낱말에
                        색이 들어간다」는 증거라, 언어가 바뀌어도 사라지면 안 된다. */}
                    <Trans
                      t={t}
                      i18nKey="chain.sentence"
                      components={{
                        m: <mark className="rounded bg-amber-200 px-1 text-ink-900" />,
                      }}
                    />
                  </p>
                )}
              </div>
              {/* 🔴 예시 줄을 **12px 아래로 내리지 않는다**(2026-08-21) — 합치기 전 지도에선 이
                  줄이 375px 에서 **83px 칸에 10px** 였다. 읽으라고 넣은 정보가 못 읽히면 장식이다.
                  🔴 한글 줄과 영어 줄은 **같은 크기** — 크기를 달리하면 한쪽이 덤처럼 보인다
                  (같은 이용권으로 둘 다 준다는 게 이 두 줄의 요지다). */}
              <span className="mt-2 block text-center text-[12px] leading-relaxed text-ink-600 break-keep sm:text-[13px] xl:text-[15px]">
                {t(`chain.${step.k}.ko`)}
              </span>
              {step.hasEn && (
                <span className="block text-center text-[12px] leading-relaxed text-ink-600 break-keep sm:text-[13px] xl:text-[15px]">
                  {t(`chain.${step.k}.en`)}
                </span>
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const SIGNUP = '/login?mode=signup';

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
  const { t } = useTranslation('landing');
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
          {t('sticky.cta')}
        </Link>
      </div>
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
/**
 * 히어로 세 칸. 🔴 **글·이름은 `landing` 네임스페이스로 나갔다**(2026-08-21 다국어) — 여기 남는 건
 *    그림과 그 비율뿐이다. `k` 가 `chain.<k>.{t,n,ko,en,alt}` 를 가리킨다.
 * 🔴 세 칸의 예시는 **같은 줄끼리 맞물린다**: ㄹ→오리→미운 아기 오리. 예시가 서로 무관하면
 *    화살표가 거짓말이 된다 — 번역할 때도 이 셋을 같이 본다.
 * ⚠️ 동화책은 **영어판이 따로 있는 게 아니라 같은 책을 영어로 읽는다** — 「영어 동화책 N권」처럼
 *    따로 세지 말 것(그래서 `books` 칸만 `en` 이 비어 있다).
 */
/**
 * 🔴 **없는 문구는 플래그로 알린다 — `defaultValue: ''` 로 때우지 말 것**(2026-08-21 실측).
 *    i18next 는 `defaultValue` 가 빈 문자열이면 그걸 「없음」으로 보고 **키 이름을 그대로
 *    돌려준다** — 영어 화면에 `chain.phonics.n` 이 글자로 찍혔다. 로케일 검증(`verify-locales`)은
 *    빈 값을 오류로 잡으므로 빈 키를 둘 수도 없다. 그래서 **있는 칸만 그린다**고 데이터에 적는다.
 * `hasCount` = 개수(500+권)를 다는 칸 · `hasEn` = 한/영 두 줄을 다는 칸(동화책은 같은 책을 두
 * 언어로 읽는 것이라 갈라 세지 않는다).
 */
const CHAIN_STEPS: {
  k: string;
  img: string;
  w: number;
  h: number;
  hasCount?: true;
  hasEn?: true;
}[] = [
  { k: 'phonics', img: '/landing/hangul/bridge-letter.webp', w: 540, h: 458, hasEn: true },
  { k: 'vocab', img: '/landing/hangul/bridge-word.webp', w: 540, h: 366, hasEn: true },
  { k: 'books', img: '/landing/hangul/bridge-page.webp', w: 560, h: 315, hasCount: true },
];

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
const EN_STAGES: { k: string; n: number; tone: string }[] = [
  { k: 'alphabet', n: 8, tone: 'bg-peach-100 text-ink-800' },
  { k: 'shortVowel', n: 8, tone: 'bg-coral-100 text-coral-700' },
  { k: 'magicE', n: 7, tone: 'bg-mint-100 text-mint-700' },
  { k: 'digraph', n: 8, tone: 'bg-peach-100 text-ink-800' },
  { k: 'vowelTeam', n: 8, tone: 'bg-coral-100 text-coral-700' },
];

/**
 * 🔴 **`match` 의 한국어는 데이터 키다 — 번역하지 않는다.** R2 의 `category` 값이라
 *    번역하면 아무 책도 안 걸린다(라이브러리 카테고리 함정과 같은 것 → CLAUDE.md).
 *    화면에 뜨는 이름·설명만 `k` 로 `landing` 네임스페이스를 가리킨다.
 */
const LINES: { k: string; n: number; match: (c: string) => boolean }[] = [
  { k: 'classic', n: 48, match: (c) => c === '세계 명작' },
  { k: 'folk', n: 40, match: (c) => c === '전래 동화' },
  { k: 'hori', n: 78, match: (c) => c.startsWith('호리') || c === '생활동화' },
  {
    k: 'nature',
    n: 100,
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
/**
 * 🔴 **책 제목과 낱말은 번역하지 않는다** — 낱말(사과·거울·뿔)은 아이가 배우는 **한국어 콘텐츠**고,
 *    표지에는 한국어 제목이 이미 그려져 있다. 번역되는 건 `alt` 안의 **라인 이름**뿐이라
 *    `lineKey` 로 `books.lines.<k>.name` 을 가리킨다(그 이름은 라인 격자에서도 같은 키를 쓴다).
 */
const BOOK_WORDS: {
  title: string;
  lineKey: string;
  cover: string;
  words: [string, string][];
}[] = [
  {
    title: '백설공주',
    lineKey: 'classic',
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
    lineKey: 'nature',
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
    lineKey: 'folk',
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
  const { t } = useTranslation('landing');
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
            alt={t('books.coverAlt', { title: b.title, line: t(`books.lines.${b.lineKey}.name`) })}
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
  const { t } = useTranslation('landing');
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
          <div key={l.k}>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-2xl font-extrabold text-ink-900 break-keep sm:text-3xl lg:text-[30px] xl:text-[34px]">
                {t(`books.lines.${l.k}.name`)}
              </h3>
              <span className="text-base font-bold text-coral-700">
                {t('books.countUnit', { n: l.n })}
              </span>
            </div>
            {/* 🔴 **모바일은 옆으로 미는 줄**(2026-08-11 사용자) — 375px 에서 3×2 격자로 깔면
                표지가 105px 짜리 우표가 되고 세로만 먹는다. 라이브러리 캐러셀과 같은 규칙:
                ①줄을 섹션 패딩 **밖으로 흘려** 표지를 160px 로 유지하고(패딩 안에 가두면 343px 라
                또 줄여야 한다) ②카드 폭이 줄에 **딱 나눠떨어지지 않게** 둔다 — 오른쪽에 걸치는
                31px 이 "옆에 더 있다"는 유일한 신호다. `sm:` 부터는 6장 격자 그대로. */}
            <div
              role="region"
              aria-label={t('books.lineCoverAria', { name: t(`books.lines.${l.k}.name`) })}
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
              {t(`books.lines.${l.k}.d`)}
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

/**
 * 🔴 `track` 은 **한 서비스 안의 갈래**를 표시한다(2026-08-19 사용자: "탱고북 파닉스 아래에
 * 한글·영어가 있는데 구분이 안 되어 있어"). 파닉스 배너 아래 두 절이 「가구는 읽는데…」와 똑같은
 * 평범한 h2 라, 셋이 나란한 형제로 보이고 **둘이 한 서비스의 두 트랙**이라는 게 안 보였다.
 * 동화책 절은 h3 라인 소제목으로 이미 부모-자식이 보이는데 파닉스만 평평했다.
 */
function Section({
  eyebrow,
  track,
  title,
  children,
}: {
  eyebrow?: string;
  track?: { n: number; label: string };
  /** 🔴 `ReactNode` — 제목 안 **핵심어를 코랄로** 물들이려고(2026-08-11 사용자: "폰트가 너무
   *  단조롭네, 검은색이 제일 많고"). 히어로 h1 은 진작 그렇게 하고 있었는데 섹션 제목만 string 이었다. */
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {track && (
          <p className="mb-2 flex items-center gap-2 text-base font-extrabold text-coral-700 sm:text-lg xl:text-xl">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-700 font-display text-sm text-white sm:h-8 sm:w-8 sm:text-base">
              {track.n}
            </span>
            {track.label}
          </p>
        )}
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

export default function IntroPage() {
  const { t } = useTranslation('landing');
  useSeo({
    title: t('seo.title', { ko: FACTS.koreanUnits, en: FACTS.englishUnits }),
    description: t('seo.description'),
    // 🔴 canonical 은 **루트**다(2026-08-21) — 이 페이지가 곧 메인이고 `/intro` 는 301 로
    //    여기 흡수됐다. 사이트맵·서버 리다이렉트(`app.ts`)와 세 곳이 한 벌이다.
    path: '/',
    // 🔴 나이 키워드는 5·6세에 몰려 있다(실측 2026-08-01): 5세한글공부 1,140 · 6세한글공부 940 ·
    //    7세 290 · 4세 220 · 3세 60. 제품은 4~7세가 맞지만, 그 표현만 쓰면 2,080 을 못 받는다.
    // 🔴 **keywords 는 번역하지 않는다** — 네이버 실측 검색량에서 나온 한국어 키워드라,
    //    옮기면 근거가 사라진 남의 나라 낱말이 된다. 다른 언어 키워드는 그 시장을 재고 나서.
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
        {/* 🔴 **「4~7세 한글·영어」는 로고 옆에**(2026-08-21 사용자) — 로고 아래 한 줄을 혼자
            먹고 있어서 헤드라인이 그만큼 밀렸다. 로고 오른쪽에 붙이면 세로 한 줄을 벌면서
            브랜드와 대상이 한눈에 같이 읽힌다. 🔴 375px 은 로고(224px)+칩이 한 줄에 안 들어가
            `sm` 미만에서만 아래로 내린다(가운데 정렬 유지). */}
        <div className="relative mx-auto mb-5 flex w-fit flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4 xl:gap-6">
          <Link to="/library" aria-label={t('hero.homeAria')} className="block w-fit">
            <img
              src="/logo/logo-kr-520.webp"
              alt={t('hero.logoAlt')}
              width={1774}
              height={887}
              /* 🔴 첫 화면 그림 셋(로고·파닉스·표지)만 `fetchPriority="high"` — 프리렌더가 이 표시가
                 붙은 그림의 src 만 남긴다(`scripts/prerender.mjs`). 나머지는 하이드레이션 뒤에 뜬다. */
              fetchPriority="high"
              className="h-28 w-auto sm:h-32 md:h-36 xl:h-40"
            />
          </Link>
          <p className="inline-flex whitespace-nowrap rounded-full bg-peach-100 px-5 py-2 font-display text-lg font-extrabold text-coral-700 sm:px-6 sm:py-2.5 sm:text-2xl md:text-3xl xl:px-8 xl:py-3.5 xl:text-[38px]">
            {t('hero.pill')}
          </p>
        </div>
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
          {/* 🔴 **데스크탑에선 한 줄**(2026-08-10). 글자 수가 늘면 크기를 줄여서라도 한 줄로 — 44px.
              🔴 **연결은 헤드라인이 아니라 바로 아래 그림이 말한다**(2026-08-19 사용자 문구).
                 2026-08-18 엔 「오늘 배운 글자로 오늘 동화책을 읽어요」로 연결을 헤드라인에 담았는데,
                 그때는 헤드라인 밑이 곧 브릿지 그림 하나였다. 지금은 **세 칸 지도(파닉스→낱말→동화책)
                 가 먼저** 오고 브릿지가 그 한 사례라, 연결은 그림 둘이 잇달아 말한다.
                 그래서 헤드라인은 **범위**를 맡는다 — 「한글·영어」와 「다양한」이 그 몫이고,
                 그 둘은 예전 문장에 아예 없던 정보다. */}
          <h1 className="mt-3 font-display text-[28px] font-extrabold leading-[1.25] text-ink-900 break-keep sm:text-[30px] md:text-[36px] xl:text-[44px]">
            {/* 🔴 문장 안 강조는 `<Trans>` 로 — 조각으로 쪼개면 언어마다 어순이 달라 못 맞춘다.
                `<br/>` 는 모바일 줄바꿈 자리라 번역문이 그 자리를 정한다. */}
            <Trans
              t={t}
              i18nKey="hero.h1"
              components={{
                c: <span className="text-coral-700" />,
                br: <br className="md:hidden" />,
              }}
            />
          </h1>
          {/* 🔴 **부제가 돌아왔다**(2026-08-21 사용자) — 2026-08-18 에 「부제를 두지 않는다」로
              지웠던 자리인데, 그때 뺀 이유는 「H1 을 풀어 쓴 문장은 정보가 안 는다」였다.
              이 문장은 H1 을 풀어 쓴 게 아니라 **H1 에 없는 것**을 말한다 — 독후 게임과
              「초등 입학 전 필수 어휘 1,500개」. 같은 날 히어로에서 뺀 어휘 선반(`VocabShelf`)이
              그림 890px 로 하던 말을 한 줄이 대신한다. */}
          {/* 🔴 강조는 **색만으로 주지 않는다**(2026-08-21 사용자 시안) — 코랄로 칠하기만 하면
              본문과 굵기·크기가 같아 흘려 읽힌다. 숫자는 한 단 키우고 굵기까지 올린다. */}
          <p className="mx-auto mt-3 max-w-[30rem] font-display text-[15px] font-bold leading-[1.5] text-ink-700 break-keep sm:mt-4 sm:max-w-none sm:text-[18px] md:text-[20px] xl:text-[24px]">
            <Trans
              t={t}
              i18nKey="hero.sub"
              components={{
                c: <span className="font-extrabold text-coral-700" />,
                big: (
                  <span className="text-[17px] font-extrabold text-coral-700 sm:text-[21px] md:text-[23px] xl:text-[28px]" />
                ),
              }}
            />
          </p>

          {/* 🔴 **한 상자로 합쳤다**(2026-08-21 사용자: "2단계 위 아래로 말고 하나로 못 만드나").
              예전엔 ①지도(`WordBookMesh`, 개수)와 ②브릿지(한 사례)가 위아래로 있고 그 사이에
              「예를 들면, 「ㄹ」 단원은 이렇게 흘러요」 한 줄이 둘을 이었다. 셋 다 뺐다 —
              두 상자가 **같은 세 칸**을 말하고 있었으므로 잇는 문장도 함께 필요가 없어진다.
              🔴 지도는 `WordBookMesh` 로 남아 있다(렌더만 뺐다) — 개수를 사진으로 보이는 판이
              다시 필요해지면 그대로 쓴다. */}
          <div className="mt-5 text-left sm:mt-7">
            <HeroBridge />
          </div>

          {/* 🔴 **구 「왜 탱고북인가」 절이 이 한 줄로 올라왔다**(2026-08-21 사용자: "이거는 좀
              요약해서 차라리 맨 위로 올리자"). 그 절은 문단 둘이었는데, 둘째 문단(「낱말을 맞히면
              동화책 한 쪽이 열린다」)은 **바로 위 상자의 셋째 칸이 그림으로 하는 말**이라 글로
              또 쓸 필요가 없다. 남는 건 상자가 못 하는 말 하나 — **되돌아온다**(상자는 왼→오른쪽
              한 방향이라 「읽은 게 다시 진도로」가 그림에 없다). 그래서 상자 **바로 아래**다.
              🔴 절 하나(375px 에서 1,546px)가 한 줄이 됐다. */}
          {/* 🔴 글자를 키웠다(2026-08-21 사용자) — 14px 은 위 부제(15/24px)보다 작아서
              히어로의 결론인데 각주처럼 읽혔다. 부제와 같은 단으로 올리고 굵기도 준다. */}
          <p className="mx-auto mt-3 max-w-[34rem] text-[16px] font-semibold leading-relaxed text-ink-800 break-keep sm:mt-4 sm:max-w-[52rem] sm:text-[19px] md:text-[21px] xl:text-[25px]">
            <Trans t={t} i18nKey="hero.cycle" components={{ b: <strong /> }} />
          </p>

          {/* 🔴 **어휘 선반(`VocabShelf`)을 히어로에서 뺐다**(2026-08-21 사용자) — 지도·브릿지·선반
              셋이 전부 「글자 → 낱말 → 동화책」 한 문장을 개수로·사례로·책장으로 세 번 말하고
              있었고, 그 대가로 **모바일 CTA 가 y=1,817(812px 화면에서 2.2화면 아래)** 로 밀렸다.
              08-18 에 라이브 데모 14개를 하나로 줄인 것과 같은 병이 그림으로 다시 자란 것.
              🔴 「필수 어휘 1,500개」와 「책마다 낱말이 딸려 온다」는 **아래 동화책 절 h2 가
              그대로 말한다** — 없애는 게 아니라 한 번만 말하게 하는 것이다.
              컴포넌트는 남겨 둔다(동화책 절로 옮길 때 그대로 쓴다). */}

          <Link
            to={SIGNUP}
            /* 🔴 375px 에서 17자를 한 줄에 넣으려면 글자를 줄여야 한다 — 대신 **폭을 꽉 채운다**
               (모바일 블록 버튼). 데스크탑은 예전처럼 알약. */
            className="mt-5 inline-flex min-h-[68px] w-full max-w-[22rem] items-center justify-center rounded-full bg-coral-700 px-6 text-lg font-extrabold text-white shadow-lg transition hover:bg-coral-800 sm:mt-8 sm:w-auto sm:max-w-none sm:px-12 sm:text-2xl xl:mt-10 xl:min-h-[104px] xl:px-20 xl:text-[32px]"
          >
            {/* 🔴 **「결제 정보 없이」를 버튼 안에**(2026-08-19 사용자) — 이 카테고리에서 부모가
                누르기 전에 갖는 가장 큰 걱정이 카드 등록이고, 그 답을 아래 FAQ 까지 내려가야
                볼 수 있으면 버튼을 안 누른 사람은 영영 못 본다. */}
            <span className="flex flex-col leading-tight">
              <span>{t('hero.cta')}</span>
              <span className="text-[13px] font-bold opacity-90 sm:text-[15px]">
                {t('hero.ctaNote')}
              </span>
            </span>
          </Link>
        </div>
      </header>

      {/* 🔴 히어로 밑 라이브 데모(`TryBridge`)는 **뺐다**(2026-08-19 사용자). 위 두 상자가 이미
          전체 흐름과 그 한 사례를 보이고, 데모는 같은 이야기를 **세 번째**로 하면서 2화면을 먹었다.
          컴포넌트는 지우지 않았다 — 되돌리려면 이 자리에 `<TryBridge />` 한 줄이면 된다. */}

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
        name={t('phonicsBanner.name')}
        tagline={t('phonicsBanner.tagline', { ko: FACTS.koreanUnits, en: FACTS.englishUnits })}
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
        eyebrow={t('why.eyebrow')}
        title={
          <>
            <Trans
              t={t}
              i18nKey="why.title"
              components={{ c: <span className="text-coral-700" /> }}
            />
          </>
        }
      >
        <p>
          <Trans t={t} i18nKey="why.p1" components={{ b: <strong /> }} />
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
            alt={t('why.photoAlt')}
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
            className="aspect-video w-full rounded-3xl object-cover"
          />
          <figcaption className="mt-2 text-center text-[13px] font-bold text-ink-600 break-keep sm:text-[15px]">
            {t('why.caption')}
          </figcaption>
        </figure>
        <p>
          <Trans
            t={t}
            i18nKey="why.p2"
            components={{ c: <strong className="text-coral-700" />, b: <strong /> }}
          />
        </p>
        <div className="!mt-6 grid gap-3 sm:grid-cols-3">
          {PHONICS_WHY.map((w) => (
            <div key={w.k} className="overflow-hidden rounded-3xl bg-white/70 text-center">
              <img
                src={`/landing/hangul/${w.shot}.webp`}
                alt={t(`why.cards.${w.k}.alt`)}
                loading="lazy"
                decoding="async"
                className="aspect-video w-full object-cover"
              />
              <div className="p-4 sm:p-5">
                <strong className="block font-display text-xl font-extrabold text-ink-900 break-keep lg:text-2xl xl:text-3xl">
                  {t(`why.cards.${w.k}.t`)}
                </strong>
                <span className="mt-1.5 block text-base leading-snug text-ink-600 break-keep lg:text-lg xl:text-[18px]">
                  {t(`why.cards.${w.k}.d`)}
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
                <Trans
                  t={t}
                  i18nKey="koTrack.wordsTitle"
                  components={{ c: <span className="text-coral-700" /> }}
                />
              </>
            }
            sub={t('koTrack.wordsSub')}
          />
        </div>
      </Section>
      <Section
        track={{ n: 1, label: t('koTrack.track') }}
        title={
          <>
            <Trans
              t={t}
              i18nKey="koTrack.title"
              values={{ n: FACTS.koreanUnits }}
              components={{ c: <span className="text-coral-700" /> }}
            />
          </>
        }
      >
        {/* 뷰 1 — 단계(여정). 자음·모음 → 받침 → 쌍자음 → 복잡한 모음, 번호로 밟는 길. */}
        <p>
          <Trans t={t} i18nKey="koTrack.lead" components={{ b: <strong /> }} />
        </p>
        <ol className="!mt-5 space-y-2">
          {STAGES.map((s, i) => (
            <li
              key={s.k}
              className="flex items-center gap-3 rounded-3xl border border-ink-100 bg-white/70 px-4 py-3 lg:px-5 lg:py-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-700 text-sm font-extrabold text-white lg:h-9 lg:w-9 lg:text-base">
                {i + 1}
              </span>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold lg:text-base ${s.tone}`}
              >
                {t('koTrack.unitCount', { n: s.n })}
              </span>
              <span className="min-w-0">
                <strong className="text-ink-900 xl:text-xl">
                  {t(`koTrack.levels.${s.k}.label`)}
                </strong>
                <span className="ml-2 text-base text-ink-600 break-keep lg:text-lg xl:text-[18px]">
                  {t(`koTrack.levels.${s.k}.detail`)}
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
            track={{ n: 2, label: t('enTrack.track') }}
            title={
              <>
                <Trans
                  t={t}
                  i18nKey="enTrack.title"
                  values={{ n: FACTS.englishUnits }}
                  components={{ c: <span className="text-coral-700" /> }}
                />
              </>
            }
          >
            <p>
              <Trans t={t} i18nKey="enTrack.lead" components={{ b: <strong /> }} />
            </p>
            <div className="!mt-6 grid gap-3 sm:grid-cols-3">
              {ENGLISH_WHY.map((w) => (
                <div key={w.k} className="overflow-hidden rounded-3xl bg-white/70 text-center">
                  <img
                    src={`/landing/hangul/${w.shot}.webp`}
                    alt={t(`englishWhy.${w.k}.alt`)}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover"
                  />
                  <div className="p-4 sm:p-5">
                    <strong className="block font-display text-xl font-extrabold text-ink-900 break-keep lg:text-2xl xl:text-3xl">
                      {t(`englishWhy.${w.k}.t`)}
                    </strong>
                    <span className="mt-1.5 block text-base leading-snug text-ink-600 break-keep lg:text-lg xl:text-[18px]">
                      {t(`englishWhy.${w.k}.d`)}
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
                    <Trans
                      t={t}
                      i18nKey="enTrack.wordsTitle"
                      components={{ c: <span className="text-coral-700" /> }}
                    />
                  </>
                }
                sub={t('enTrack.wordsSub')}
              />
            </div>
            <ol className="!mt-8 space-y-2">
              {EN_STAGES.map((s, i) => (
                <li
                  key={s.k}
                  className="flex items-center gap-3 rounded-3xl border border-ink-100 bg-white/70 px-4 py-3 lg:px-5 lg:py-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-700 text-sm font-extrabold text-white lg:h-9 lg:w-9 lg:text-base">
                    {i + 1}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold lg:text-base ${s.tone}`}
                  >
                    {t('koTrack.unitCount', { n: s.n })}
                  </span>
                  <span className="min-w-0">
                    <strong className="text-ink-900 xl:text-xl">
                      {t(`enTrack.levels.${s.k}.label`)}
                    </strong>
                    <span className="ml-2 text-base text-ink-600 break-keep lg:text-lg xl:text-[18px]">
                      {t(`enTrack.levels.${s.k}.detail`)}
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
        {/* 🔴 패딩은 **max-w 바깥**에 둔다 — 안에 두면 그만큼 안쪽에서 시작해서 위 트랙 둘(`Section`)과
            왼쪽 끝이 24px 어긋난다(실측 57 vs 81). `Section` 이 `px` 를 바깥 section 에 두는 이유가 이것. */}
        <div className="px-4 pb-2 sm:px-6">
          <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl">
            {/* 🔴 **③ 으로 트랙 표시를 맞춘다**(2026-08-19 사용자) — 파닉스 배너 아래 셋(①한글 ②영어
              ③부모 화면)이 같은 표시를 달아야 「한 서비스의 세 갈래」로 읽힌다. `Section` 이 아니라
              평범한 div 라 칩 마크업을 그대로 옮겨 적었다 — 컴포넌트로 뽑을 만큼 자주 쓰이지 않는다. */}
            <p className="mb-2 flex items-center gap-2 text-base font-extrabold text-coral-700 sm:text-lg xl:text-xl">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-700 font-display text-sm text-white sm:h-8 sm:w-8 sm:text-base">
                3
              </span>
              {t('report.track')}
            </p>
            {/* 🔴 이 두 줄은 **절 제목 급으로** 키운다(2026-08-19 사용자) — 그림 두 장이 화면을
              가로로 다 쓰는데 머리글만 본문 크기라, 뭘 보라는 건지 모른 채 표만 지나쳤다. */}
            <p className="font-display text-[20px] font-extrabold text-ink-900 break-keep sm:text-[28px] lg:text-[32px]">
              <Trans
                t={t}
                i18nKey="report.title"
                components={{ c: <span className="text-coral-700" /> }}
              />
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600 break-keep sm:text-[18px] lg:text-[20px]">
              {t('report.lead')}
            </p>
            <div className="mt-4 grid items-start gap-3 sm:grid-cols-2">
              {[
                {
                  src: 'report-grid',
                  w: 1680,
                  h: 1995,
                  k: 'ko',
                },
                {
                  src: 'report-grid-en',
                  w: 1680,
                  // 🔴 **파일의 실제 높이**여야 한다 — 1344 로 적어 뒀더니 예약 박스가 230px 인데
                  //    실제가 363px 라 로드될 때 아래 글이 133px 튀었다(CLS). 그림을 다시 찍으면
                  //    이 숫자도 같이 고칠 것.
                  h: 2130,
                  k: 'en',
                },
              ].map((g) => (
                <figure key={g.src} className="rounded-3xl bg-white/70 p-3 sm:p-4">
                  <img
                    src={`/landing/hangul/${g.src}.webp`}
                    alt={t(`report.${g.k}.alt`)}
                    width={g.w}
                    height={g.h}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-2xl border border-ink-100"
                  />
                  <figcaption className="mt-2 text-center text-[13px] font-bold text-ink-600 break-keep sm:text-[15px]">
                    {t(`report.${g.k}.cap`)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ⑤ 동화책 ──────────────────────────────────────────── */}
      {/* 🔴 **쪽수·권수를 앞세우지 않는다**(2026-08-05 사용자: "쪽수 이런건 뭐하러 얘기해 의미없게").
          부모가 궁금한 건 3,835쪽이 아니라 **뭐가 다양하게 있고, 책마다 뭘 하고, 계속 느나**다.
          그래서 제목·본문을 라인 다양성 + 책마다 독후활동 게임 + 매달 증가로 바꿨다. */}
      {/* 🔴 tagline 없음(2026-08-10 사용자) — 「읽을수록 어휘와 문해력이 자랍니다」가 **바로 아래
          섹션 제목과 같은 말**이라 배너 밑에 같은 문장이 두 줄로 이어져 있었다. */}
      <ServiceBanner n={2} name={t('booksBanner.name')} />
      {/* 🔴 **여기가 차별점이라 제일 크게 쓴다**(2026-08-11 사용자: "우리 한글은 쟤들 둘이랑
          비슷하고, 동화책이 차별점"). 예전엔 어휘·문해력 설명 문단 넷이 먼저 나오고 표지가
          중간에 끼어 있었다 — 파는 것이 **책이 이만큼 있다**인데 글부터 읽히고 있었다.
          순서를 뒤집는다: 라인 넷 → 표지벽 → 그제서야 「그래서 뭐가 자라나」. */}
      <Section
        title={
          <>
            {/* 🔴 **500권+ · 1,500개는 목표치다**(2026-08-19 사용자 결정). 실측은 책 266
                (`FACTS.books`) · 낱말 630(`FACTS.vocabWords`) — 숫자를 손볼 땐 그 둘과 헷갈리지 말 것. */}
            <Trans
              t={t}
              i18nKey="books.title"
              components={{ c: <span className="text-coral-700" /> }}
            />
          </>
        }
      >
        <p>
          <Trans t={t} i18nKey="books.lead" components={{ b: <strong /> }} />
        </p>
        <LineSections />
        {/* 읽기만 하고 끝나지 않는다 — 어휘·문해력·독후활동. 여기부터가 「그래서 뭐가 자라나」. */}
        <h3 className="!mt-10 font-display text-[23px] font-extrabold text-ink-900 break-keep sm:text-[28px]">
          {t('books.wordsTitle')}
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

      {/* ── ⑥ FAQ (구 「왜 탱고북인가」 + 「요금」) ─────────────────────────
          🔴 **두 절을 하나로**(2026-08-21 사용자: "왜 탱고북인가를 아예 빼고 … -> FAQ /
             요금도 FAQ 중 하나로 넣자").
          🔴 「왜 탱고북인가」 절(배우는 곳과 읽는 곳이 한 바퀴)은 **히어로로 올라갔다** —
             같은 날 지도·브릿지를 한 상자로 합치면서 그 상자가 이미 세 칸으로 같은 말을 했고,
             남은 건 「읽은 게 다시 진도로 돌아온다」 한 줄이라 상자 바로 아래 캡션이 제자리다.
             절 하나(1,546px)가 한 줄이 됐다.
          🔴 「요금」 절은 문단 다섯이 전부 **「없습니다」로 끝나는 답**이었다(카드·자동결제·
             광고·약정 없음). 물음을 붙이니 그대로 FAQ 항목이 됐다 — `FAQS` 참조. */}
      <ServiceBanner name={t('faq.banner')} />
      <Section title={t('faq.title')}>
        {/* 🔴 **금액은 접힌 채로 두지 않는다**(2026-08-21 사용자: "요금 정보는 확실히 줘. 월 얼마인지").
            FAQ 첫 항목이 요금이지만 아코디언은 기본이 닫혀 있어서, 누르지 않은 사람은 값을 못 본다.
            여기 한 줄이 **숫자**를, FAQ 항목이 **정가·반값·연간**을 맡는다.
            🔴 값은 `PLANS` 에서 파생 — 문장에 박으면 프로모가 끝나는 날 랜딩이 거짓말을 한다. */}
        <p className="!mt-5 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 rounded-3xl border border-coral-200 bg-white/70 px-5 py-4 text-center sm:!mt-6">
          <span className="font-display text-[18px] font-extrabold text-ink-900 break-keep sm:text-[22px]">
            <Trans
              t={t}
              i18nKey="faq.priceLead"
              values={{ month: won(PLANS.month1.amount) }}
              components={{ c: <span className="text-coral-700" /> }}
            />
          </span>
          <span className="text-[14px] text-ink-600 break-keep sm:text-[16px]">
            {t('faq.priceNote', {
              year: won(PLANS.year1.amount),
              perMonth: won(Math.round(PLANS.year1.amount / 12)),
            })}
          </span>
        </p>

        {/* 🔴 무료체험 마찰 제거 FAQ(벤치마킹 2차 §4-5) — 투두는 CTA 옆 FAQ 아코디언으로 전환
            장벽을 없앤다. 우리는 답이 전부 「없음/아니요」라 오히려 안심으로 판다. */}
        <div className="!mt-6 space-y-2">
          {FAQ_KEYS.map((k) => (
            <details
              key={k}
              className="group rounded-3xl border border-ink-100 bg-white/70 px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-bold text-ink-800 break-keep">
                {t(`faq.items.${k}.q`)}
                <span className="shrink-0 text-xl font-bold text-coral-500 transition group-open:rotate-45">
                  ＋
                </span>
              </summary>
              <p className="mt-2 text-base text-ink-600 break-keep">
                {t(`faq.items.${k}.a`, FAQ_VARS)}
              </p>
            </details>
          ))}
        </div>
        {/* 🔴 아이가 작게, 부모가 크게 — 이 섹션은 결제를 결정하는 부모에게 하는 말이라
            시선의 주인이 부모여야 한다. */}
        <Photo src="parent" alt={t('faq.parentAlt')} w={1000} h={755} className="!mt-6" />
        <div className="!mt-7 flex flex-col items-center gap-3 rounded-3xl border border-coral-200 bg-gradient-to-br from-coral-100 to-peach-200 p-6 text-center sm:p-8">
          <p className="font-display text-xl font-extrabold text-ink-900 break-keep sm:text-3xl">
            {t('faq.closeTitle')}
          </p>
          <p className="text-base text-ink-600 break-keep">{t('faq.closeLead')}</p>
          <Link
            to={SIGNUP}
            className="mt-1 inline-flex min-h-[52px] w-full max-w-[22rem] items-center justify-center rounded-full bg-coral-700 px-6 text-base font-bold text-white shadow-md transition hover:bg-coral-800 sm:w-auto sm:max-w-none sm:px-8 sm:text-lg"
          >
            {t('faq.closeCta')}
          </Link>
        </div>
      </Section>

      <StickyCta />
      <SiteFooter lang="ko" />
    </div>
  );
}
