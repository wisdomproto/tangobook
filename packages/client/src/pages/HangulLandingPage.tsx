import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { PhonicsTryIt } from '@/features/phonics-learner/components/PhonicsTryIt';
import { HangulBookTryIt } from './HangulBookTryIt';

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
    tone: 'bg-coral-100 text-coral-600',
  },
  {
    label: '받침',
    count: '7단원',
    detail: '소리 나는 받침은 일곱뿐입니다',
    tone: 'bg-mint-100 text-mint-600',
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
    tone: 'bg-coral-100 text-coral-600',
  },
];

const SIGNUP = '/login?mode=signup';

/**
 * 랜딩이 통째로 여는 단원 — ㄱ(한글1 두 번째).
 * 🔴 **스크린샷을 쓰지 않는다**(2026-08-01 사용자: "찍어서 가지고 오지말고 아예 구현을 하라니까").
 *    아홉 개가 전부 앱에서 도는 그 컴포넌트다. 배선은 `KoreanPhonicsActivity` 하나를 재사용한다.
 * 🔴 높이는 활동마다 다르다 — 격자가 큰 게임은 500px 이면 아래가 잘린다.
 */
const GA_UNIT = 'kr-h1-u02';
const GA_LEARN = [
  { key: 'consonant-tap', h: 520 },
  { key: 'blend-listen', h: 520 },
  { key: 'consonant-write', h: 560 },
  { key: 'letter-hunt', h: 620 },
];
const GA_PLAY = [
  { key: 'word-listen-choose', h: 620 },
  { key: 'game-dots', h: 620 },
  { key: 'game-korean-block', h: 680 },
  { key: 'game-word-writing', h: 620 },
  { key: 'game-line-matching', h: 620 },
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
  const visible = show && !blocked;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-coral-200 bg-cream-50/95 px-4 py-3 backdrop-blur transition-transform duration-300 sm:px-6 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] font-semibold text-ink-700 break-keep sm:text-sm">
          지금은 베타 기간 — 가입하면 <span className="text-coral-600">1년 무료</span>
        </p>
        <Link
          to={SIGNUP}
          className="flex min-h-[44px] shrink-0 items-center rounded-full bg-coral-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600"
        >
          무료로 시작하기
        </Link>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/70 px-3 py-4">
      <span className="font-display text-2xl font-extrabold text-coral-600 sm:text-3xl">
        {value}
      </span>
      <span className="text-center text-[11px] font-semibold text-ink-500 break-keep sm:text-xs">
        {label}
      </span>
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
 *    (`packages/server/scripts/composite-screen-into-photo.mjs`, 지금은 `tracing` 한 장).
 *    나머지는 화면이 안 보이는 컷이라 그대로 두고, 진짜 화면은 이 페이지에서
 *    **살아서 돌고 있다**(활동 9개 + 동화책).
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

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold tracking-wide text-coral-500">{eyebrow}</p>
        )}
        <h2 className="font-display text-[22px] font-extrabold leading-snug text-ink-900 break-keep sm:text-[28px]">
          {title}
        </h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-700 break-keep sm:text-base">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function HangulLandingPage() {
  useSeo({
    title: '한글 파닉스 71단원 + 동화책 266권 — 탱고북',
    description:
      '자음·모음부터 받침·쌍자음까지 한글 파닉스 32단원, 영어 파닉스 39단원. 그리고 배운 글자로 바로 읽는 동화책 266권. 4~7세 한글떼기, 지금은 베타 기간이라 가입하면 1년 무료입니다.',
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
        {/* 🔴 md 부터 2열 — 사진을 글 아래 깔면 CTA 가 접힘선 밑으로 밀린다(3:2 라 768px 폭에서
            높이가 512px). 옆에 두면 빈 오른쪽이 채워지면서 CTA 는 그대로 위에 남는다. */}
        <div className="relative mx-auto grid max-w-5xl items-center gap-8 text-center md:grid-cols-[1fr_minmax(0,420px)] md:gap-10 md:text-left">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-coral-500 sm:text-sm">
              4~7세 한글떼기 · 파닉스
            </p>
            <h1 className="mt-3 font-display text-[28px] font-extrabold leading-[1.25] text-ink-900 break-keep sm:text-[42px]">
              한글 파닉스 {FACTS.phonicsUnits}단원과
              <br />
              동화책 {FACTS.books}권이 한 곳에
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-700 break-keep sm:text-lg md:mx-0">
              글자를 배우는 앱은 많습니다. 배운 글자로{' '}
              <strong className="text-coral-600">바로 읽을 책</strong>까지 있으면 대개 패드를 사고
              약정을 겁니다. 탱고북은 <strong className="text-coral-600">둘 다 앱 안에</strong>{' '}
              있고, 패드도 약정도 없습니다.
            </p>

            <div className="mx-auto mt-7 grid max-w-lg grid-cols-3 gap-2 sm:gap-3 md:mx-0">
              <Stat value={`${FACTS.koreanUnits}단원`} label="한글 파닉스" />
              <Stat value={`${FACTS.englishUnits}단원`} label="영어 파닉스" />
              <Stat value={`${FACTS.books}권`} label="동화책" />
            </div>

            <Link
              to={SIGNUP}
              className="mt-7 inline-flex min-h-[52px] items-center rounded-full bg-coral-500 px-8 text-base font-bold text-white shadow-md transition hover:bg-coral-600"
            >
              무료로 시작하기
            </Link>
            <p className="mt-3 text-xs text-ink-500 break-keep">
              설치 없이 브라우저에서 바로 · 아래에서 먼저 해볼 수 있어요
            </p>
          </div>

          {/* 🔴 엄마가 화면이 아니라 **아이 얼굴**을 본다 — 이 페이지가 파는 게 「아이가 스스로
              한다」라서, 시선이 아이에게 있어야 그 얘기가 된다. */}
          <Photo
            src="hero"
            alt="엄마와 아이가 소파에 앉아 태블릿을 함께 보고 있다"
            w={1200}
            h={800}
            eager
            className="mx-auto max-w-sm md:max-w-none"
          />
        </div>
      </header>

      {/* ── ② 문제 제기 ───────────────────────────────────────── */}
      <Section
        eyebrow="왜 둘이 같이 있어야 하나"
        title="글자를 뗐는데 읽을 게 없으면, 금방 잊습니다"
      >
        <p>
          자음과 모음을 다 배운 아이에게 필요한 건 다음 진도가 아니라 <strong>읽을 거리</strong>
          입니다. 방금 배운 「ㄱ」이 「고기」에서 다시 나와야 그 글자가 손에 남습니다.
        </p>
        <p>
          그런데 지금 고를 수 있는 건 대개 둘 중 하나입니다. 글자만 가르치는 <strong>앱</strong>
          이거나, 책까지 들어 있지만 <strong>학습 패드를 묶어 파는 방문 판매</strong>
          거나.
        </p>
        {/* 🔴 슬프면 안 된다 — 죄책감을 파는 광고가 되면 부모가 방어한다. 「할 게 없어서 멈춘
            아이」이고, 뒤 책장이 **비어 있는 것**이 이 컷의 논지다(읽을 게 없다). */}
        <Photo
          src="problem"
          alt="학습지를 앞에 두고 턱을 괸 채 딴 곳을 보는 아이"
          w={1000}
          h={755}
          className="!mt-6"
        />
        {/* 🔴 브랜드명을 쓰지 않는다 — 가격만으로 충분히 구체적이고, 남의 상표를 우리 랜딩에
            올릴 이유가 없다. 수치는 2026-08-01 공개 정보 기준. */}
        {/* 🔴 「앱에는 책이 없다」고 쓰지 않는다 — 단계별 읽기책을 넣은 앱이 실제로 있다(사용자 지적).
            정확한 대비는 **책의 종류**다: 발음 연습용 리더 vs 이야기로 읽는 그림책. */}
        <ul className="!mt-5 space-y-2">
          <li className="rounded-2xl border border-ink-100 bg-white/70 px-4 py-3">
            <strong className="text-ink-900">글자를 가르치는 앱</strong>
            <span className="ml-2 text-sm text-ink-500 break-keep">
              월 3만 원 이하. 책이 있어도 대개 <em>발음 연습용 단계별 읽기책</em>입니다.
            </span>
          </li>
          <li className="rounded-2xl border border-ink-100 bg-white/70 px-4 py-3">
            <strong className="text-ink-900">패드를 묶어 파는 방문 판매</strong>
            <span className="ml-2 text-sm text-ink-500 break-keep">
              그림책까지 들어 있지만 <em>월 8만~14만 원에 1~2년 약정</em>입니다.
            </span>
          </li>
        </ul>
        <p className="!mt-5">
          탱고북은 그 사이입니다. <strong>같은 앱 안에</strong> 파닉스 {FACTS.phonicsUnits}단원과
          세계 명작·전래 동화·자연 관찰 <strong>{FACTS.books}권</strong>이 들어 있고,{' '}
          <strong>패드도 약정도 없습니다.</strong> 읽기 연습용으로 만든 짧은 글이 아니라, 아이가
          그냥 좋아서 보는 이야기입니다.
        </p>
      </Section>

      {/* ── ③ 직접 해보기 (평점·후기 자리) ───────────────────── */}
      <section className="px-4 pb-2 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-coral-200 bg-white/60 p-4 sm:p-6">
            <p className="text-xs font-bold tracking-wide text-coral-500">단원 하나가 이만큼</p>
            <h2 className="mt-1 font-display text-[22px] font-extrabold text-ink-900 break-keep sm:text-[28px]">
              「ㄱ」 단원을 통째로 열어 두었습니다
            </h2>
            <p className="mt-2 text-sm text-ink-600 break-keep">
              스크린샷이 아닙니다. 아래 아홉 개는 <strong>앱에서 도는 그 화면 그대로</strong>이고,
              가입하지 않아도 지금 눌러볼 수 있습니다. 서른두 단원이 전부 이렇게 생겼습니다.
            </p>
            {/* 🔴 이 한 장에만 **진짜 앱 화면이 합성돼 있다**(「반짝이는 칸에 ㄱ 써봐!」).
                태블릿 화면 면이 카메라를 향한 유일한 컷이라 그렇다 — 나머지 다섯 장은 화면이
                반대쪽을 보거나 뒤판만 보여 넣을 면이 없다. 합성 = `composite-screen-into-photo.mjs`.
                작게 쓰면 합성한 보람이 없으므로 전체 폭 3:2 로 둔다. */}
            <Photo
              src="tracing"
              alt="태블릿에 뜬 「반짝이는 칸에 ㄱ 써봐!」 화면을 손가락으로 따라 쓰는 아이"
              w={1200}
              h={800}
              className="mt-5"
            />

            <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-coral-500 px-4 py-1.5 text-sm font-bold text-white">
              📖 익히기 · 글자
            </p>
            {GA_LEARN.map((a) => (
              <PhonicsTryIt key={a.key} unitId={GA_UNIT} activityKey={a.key} height={a.h} />
            ))}

            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-mint-500 px-4 py-1.5 text-sm font-bold text-white">
              🎮 낱말 놀이 · 낱말
            </p>
            {GA_PLAY.map((a) => (
              <PhonicsTryIt key={a.key} unitId={GA_UNIT} activityKey={a.key} height={a.h} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ④ 파닉스 커리큘럼 ─────────────────────────────────── */}
      <Section eyebrow="한글 파닉스" title="이름이 아니라 소리부터, 서른두 단원">
        <p>
          「기역」은 글자의 <em>이름</em>이지 소리가 아닙니다. 「기역, 아」를 읽으면 「기역아」가
          되지 「가」가 되지 않습니다. 탱고북은 소리(「그」)부터 알려주고, 그 소리가 모음을 만나
          글자가 되는 과정을 눈으로 보여줍니다.
        </p>
        <ul className="!mt-6 space-y-2">
          {STAGES.map((s) => (
            <li
              key={s.label}
              className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/70 px-4 py-3"
            >
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${s.tone}`}>
                {s.count}
              </span>
              <span className="min-w-0">
                <strong className="text-ink-900">{s.label}</strong>
                <span className="ml-2 text-sm text-ink-500 break-keep">{s.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="!mt-6">
          사이사이 <strong>복습 단원 일곱</strong>이 끼어 있어, 배운 글자를 형식이 다른 놀이(글자
          사냥 · 뒤집기 짝 맞추기 · 듣고 고르기)로 다시 만납니다. 단원마다 익히기 네 가지와 낱말
          놀이 다섯 가지가 이어집니다.
        </p>
        <p>
          영어 파닉스도 <strong>{FACTS.englishUnits}단원</strong> 같이 있습니다. 알파벳 소리부터
          CVC까지, 한글과 같은 방식입니다.
        </p>
        <Photo
          src="siblings"
          alt="두 아이가 바닥에 앉아 태블릿 하나를 같이 보고 있다"
          w={1000}
          h={667}
          className="!mt-6"
        />
        <Link
          to="/library/phonics/korean"
          className="!mt-5 inline-flex min-h-[44px] items-center rounded-full border-2 border-coral-500 px-6 text-sm font-bold text-coral-600 transition hover:bg-coral-50"
        >
          커리큘럼 전체 보기 →
        </Link>
      </Section>

      {/* ── ⑤ 동화책 ──────────────────────────────────────────── */}
      <Section eyebrow="동화책" title={`${FACTS.books}권, ${FACTS.pages.toLocaleString()}쪽`}>
        <p>
          세계 명작과 전래 동화, 자연 관찰, 그리고 아기호랑이 호리가 나오는 창작 시리즈까지{' '}
          <strong>{FACTS.categories}개 카테고리</strong>입니다. {FACTS.narrated}권은 한국어
          나레이션이 처음부터 끝까지 들어 있어, 글자를 아직 못 읽는 아이도 혼자 봅니다.
        </p>
        <div className="!mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map(([name, n]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white/70 px-3 py-1.5 text-sm text-ink-700 break-keep"
            >
              {name}
              <strong className="text-coral-600">{n}</strong>
            </span>
          ))}
        </div>
        <p className="!mt-6">
          <strong>{FACTS.fiveLangBooks}권</strong>은 한국어·영어·베트남어·중국어·태국어 다섯 언어로
          읽을 수 있고, 세계 명작 등 <strong>{FACTS.multiStyleBooks}권</strong>은 같은 이야기를
          그림체를 바꿔 가며 볼 수 있습니다. 이야기를 이어서 틀어두는 「묶어 보기」도 있어 재울 때
          씁니다.
        </p>
        {/* 🔴 부모가 프레임에 없다 — 「묶어 보기」의 쓰임이 *부모가 손을 떼는 것*이라 그게
            그림이어야 한다. */}
        <Photo
          src="bedtime"
          alt="잠자리에 누워 머리맡 태블릿에서 나오는 동화를 듣는 아이"
          w={1200}
          h={675}
          className="!mt-6"
        />
        <p className="!mt-6">
          이것도 <strong>직접 읽어보실 수 있습니다.</strong> 카테고리를 눌러 그 라인의 책을 바꿔
          가며 들어보세요. 「낱말 게임」으로 넘기면 <em>그 책에 나온 낱말</em>로 바로 게임합니다.
        </p>
        <HangulBookTryIt />
      </Section>

      {/* ── ⑥ 실측 숫자 ───────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-mint-50 to-cream-50 p-5 sm:p-8">
          <h2 className="font-display text-lg font-extrabold text-ink-900 break-keep sm:text-2xl">
            숫자는 있는 그대로입니다
          </h2>
          <p className="mt-2 text-sm text-ink-600 break-keep">
            앱에 실제로 들어 있는 것만 적었습니다. 콘텐츠는 계속 늘고 있어서, 이 숫자는 오늘
            기준으로 가장 적은 값입니다.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={FACTS.pages.toLocaleString()} label="동화책 쪽수" />
            <Stat value={`${FACTS.narrated}/${FACTS.books}`} label="나레이션 완비" />
            <Stat value={`${FACTS.wordCards}장`} label="파닉스 낱말 카드" />
            <Stat value="5개" label="읽을 수 있는 언어" />
          </div>
        </div>
      </section>

      {/* ── ⑦ 혜택 (여기서 처음 등장) ─────────────────────────── */}
      <Section eyebrow="지금은 베타 기간" title="가입하면 1년 동안 무료입니다">
        <p>
          탱고북은 아직 베타입니다. 그래서 <strong>지금 가입하는 분은 1년 동안 전부 무료</strong>로
          쓰십니다. 파닉스도, 동화책 {FACTS.books}권도, 게임도 잠긴 것 없이 열려 있습니다.
        </p>
        <p>
          결제 정보를 넣지 않습니다. 카드도 등록하지 않습니다. 아이 화면에{' '}
          <strong>광고가 뜨지 않습니다.</strong>
        </p>
        <p className="text-sm text-ink-500">
          가입이 부담스러우시면 <strong>게스트로 30일</strong> 먼저 써보셔도 됩니다. 다만 게스트는
          학습 기록이 남지 않아, 아이가 어디까지 했는지 볼 수 없습니다.
        </p>
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
          <p className="font-display text-lg font-extrabold text-ink-900 break-keep sm:text-2xl">
            오늘 ㄱ을 배우고, 오늘 ㄱ이 나오는 책을 읽어요
          </p>
          <p className="text-sm text-ink-600 break-keep">설치 없이 브라우저에서 바로 시작합니다.</p>
          <Link
            to={SIGNUP}
            className="mt-1 inline-flex min-h-[52px] items-center rounded-full bg-coral-500 px-8 text-base font-bold text-white shadow-md transition hover:bg-coral-600"
          >
            1년 무료로 시작하기 →
          </Link>
          <Link to="/library" className="text-xs font-semibold text-ink-500 underline">
            먼저 둘러볼래요
          </Link>
        </div>
      </Section>

      <StickyCta />
      <SiteFooter lang="ko" />
    </div>
  );
}
