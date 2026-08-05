import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PLANS } from '@tangobook/shared';
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

/**
 * ② 「왜 탱고북인가」 넘버링 포인트 — 벤치마킹 §4-1(2026-08-05).
 * 🔴 경쟁사(핑크퐁·웅진)가 공통으로 이유를 Point 01~05로 번호 매긴다 — **정보를 번호로 매기는 것
 *    자체가 페이지를 「체계적/전문적」으로 보이게 하는 최대 장치**다. 흩어져 있던 메시지 기둥을
 *    여기로 모으고, ③④⑤는 각 포인트의 「증거」로 남긴다.
 */
const POINTS: { t: string; d: string }[] = [
  {
    t: '배우고, 그 글자로 바로 읽습니다',
    d: `한글 파닉스 ${FACTS.koreanUnits}단원으로 글자와 소리를 배우고, 그 글자를 다양한 동화책에서 낱말과 이야기로 다시 만납니다. 배우는 곳과 읽는 곳이 같은 앱 안에 있습니다.`,
  },
  {
    t: '한 낱말을 네 가지 방식으로',
    d: '동화책마다 독후활동 게임이 붙어 있습니다. 같은 낱말을 그림으로 만나고, 글자로 조립하고, 따라 그리고, 손으로 씁니다 — 외우지 않아도 남습니다.',
  },
  {
    t: '읽은 게 글자 공부로 돌아옵니다',
    d: '동화책에서 「고기」를 맞히면 파닉스 표의 고·기 칸이 같이 올라갑니다. 책을 읽은 게 글자 진도로 쌓입니다.',
  },
];

/** ②의 04번 — 「없는 것」 아이콘 세트. 벤치마킹 §4-3(핑크퐁 구독특징 4아이콘 구조). */
const NONES: { icon: string; t: string; d: string }[] = [
  { icon: '📵', t: '광고 없음', d: '아이 화면에 광고가 안 떠요' },
  { icon: '🔓', t: '전체 개방', d: '잠긴 것 없이 다 열려요' },
  { icon: '📺', t: 'TV·폰·태블릿', d: '설치 없이 브라우저에서' },
  { icon: '🚫', t: '약정·설치 없음', d: '패드도 약정도 없어요' },
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
  { key: 'consonant-tap', h: 520, note: '글자 이름이 아니라 소리를 먼저 귀에 넣습니다.' },
  {
    key: 'blend-listen',
    h: 520,
    note: '두 글자가 합쳐지는 순간을 눈으로 봅니다 — 이게 읽기의 출발입니다.',
  },
  {
    key: 'consonant-write',
    h: 560,
    note: '손이 기억합니다. 눈으로 본 글자를 획순대로 따라 씁니다.',
  },
  {
    key: 'letter-hunt',
    h: 620,
    note: '비슷하게 생긴 글자 사이에서 찾아냅니다 — 매 탭이 판단입니다.',
  },
];
const GA_PLAY = [
  {
    key: 'word-listen-choose',
    h: 620,
    note: '소리만 듣고 고릅니다. 눈이 아니라 귀로 하는 유일한 활동입니다.',
  },
  { key: 'game-dots', h: 620, note: '낱말이 가리키는 것을 직접 그려 봅니다.' },
  { key: 'game-korean-block', h: 680, note: '자음과 모음을 모아 낱말 하나를 만듭니다.' },
  { key: 'game-word-writing', h: 620, note: '낱말 전체를 왼쪽부터 차례로 씁니다.' },
  {
    key: 'game-line-matching',
    h: 620,
    note: '여기까지가 「ㄱ」 한 단원입니다. 서른두 단원이 전부 이렇게 생겼습니다.',
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
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p
          className={`min-w-0 text-[13px] font-semibold text-ink-700 break-keep sm:text-sm ${
            blocked ? 'hidden' : ''
          }`}
        >
          <span className="text-ink-400 line-through">
            월 {PLANS.month1.originalAmount?.toLocaleString()}원
          </span>{' '}
          <span className="text-coral-700">월 {PLANS.month1.amount.toLocaleString()}원</span>
        </p>
        <Link
          to={SIGNUP}
          className="flex min-h-[44px] shrink-0 items-center rounded-full bg-coral-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-coral-800"
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
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/70 px-3 py-4">
      <span className="font-display text-2xl font-extrabold text-coral-700 sm:text-3xl">
        {value}
      </span>
      <span className="text-center text-xs font-semibold text-ink-600 break-keep sm:text-xs">
        {label}
      </span>
      {note && (
        <span className="text-center text-[10px] leading-snug text-ink-400 break-keep">{note}</span>
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
        <div key={key} className="rounded-2xl border border-ink-100 bg-white/70 p-4">
          <p className="text-xs font-bold text-coral-700 break-keep">
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
                  className={`rounded-full px-2.5 py-1 text-xs break-keep ${
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
 * 동화책 **표지벽**. 권수만 적으면 안 믿긴다 — 표지를 깔면 그 자리에서 확인된다.
 * 🔴 목록을 박아 두지 않는다 — 라이브러리 API 를 그대로 읽으므로 책이 늘면 벽도 늘어난다.
 * 🔴 `BookCover` 를 쓴다(직접 `<img>` X) — 512px 썸네일로 유도해 준다. 원본은 장당 125KB 라
 *    서른 장이면 4MB 다.
 */
/**
 * 동화책 **표지벽**. 권수만 적으면 안 믿긴다 — 표지를 깔면 그 자리에서 확인된다.
 *
 * 🔴 **API 순서 그대로 자르지 않는다**(2026-08-02 리뷰). `slice(0,40)` 이었을 땐 가장 최근에
 *    넣은 전래동화 시즌2가 벽을 통째로 먹어 **세계 명작이 한 장도 없었다** — 아는 제목이
 *    하나도 없으면 「266권」이 「내가 모르는 책 266권」이 된다. 아는 이야기부터 세운다.
 * 🔴 **선두 번호를 떼고 보여준다** — 「15. 편지 배달 왔어요」는 저작도구 정렬용 번호다.
 * 🔴 **눌리게 한다.** 벽지처럼 흘려보내면 2.5화면을 눈으로만 지나간다.
 * 🔴 **셀에 `aspect-video`** — 없으면 표지가 도착할 때까지 셀 높이가 0이라 페이지가
 *    3,000px 자라며 읽던 줄이 밀려 내려간다(실측).
 */
/**
 * 벽에 세울 15권의 **카테고리 할당**(2026-08-05 사용자: "절반을 명작동화로, 전래·자연·생활 골고루").
 *
 * 🔴 예전엔 제목 키워드 목록(`['백설공주',…,'토끼']`)으로 골랐다. 그러니 **`토끼` 하나가 네 권**을
 *    끌어왔고(토끼의 재판·토끼와 자라·토끼와 거북이·자연관찰 「토끼」) 벽 절반이 토끼가 됐다.
 *    무엇을 보여줄지는 제목이 아니라 **라인**으로 정한다.
 * 🔴 자연관찰은 카테고리가 여럿이다(곤충·하늘/바다/육지 동물·공룡 「…친구들」) — 이름 하나로
 *    못 잡으므로 접미사로 묶는다.
 */
const WALL_QUOTA: { n: number; match: (category: string) => boolean; spread?: boolean }[] = [
  { n: 7, match: (c) => c === '세계 명작' },
  { n: 3, match: (c) => c === '전래 동화' },
  // 🔴 자연은 **카테고리를 흩어서** 뽑는다 — API 순서대로면 세 칸이 전부 「육지 동물 친구들」이라
  //    자연관찰 라인이 동물 한 종류처럼 보인다(실측).
  { n: 3, match: (c) => c.endsWith('친구들'), spread: true },
  { n: 2, match: (c) => c === '생활동화' },
];

/**
 * 그 라인에서 **먼저 세울 제목**. 🔴 순서만 정하고 **선택은 카테고리가 한다** — 예전처럼 제목
 * 목록으로 전체에서 고르면 `토끼` 하나가 네 권(재판·자라·거북이·자연관찰)을 끌어와 벽 절반을
 * 차지했다. 여기서는 같은 라인 안에서만 앞으로 당기므로 그 사고가 구조적으로 안 난다.
 * (API 순서는 이름값 순이 아니다 — 전래 세 칸이 반쪽이·두더지의 혼인·구렁덩덩 새선비였다.)
 */
const WALL_PREFER = [
  '백설공주',
  '신데렐라',
  '인어공주',
  '흥부',
  '심청',
  '콩쥐',
  '해와 달',
  '헨젤',
  '빨간모자',
];

function BookWall() {
  const { data } = useStorybooks();
  /**
   * 🔴 **난이도 변형본을 뺀다** — `백설공주 (L4)` 처럼 같은 이야기의 레벨 변형이 함께 오면
   *    벽에 같은 제목이 두 번 선다(실측). 제목에서 선두 번호와 `(L4)` 를 떼고 중복을 없앤다.
   */
  const seen = new Set<string>();
  const books = (data ?? []).filter((b) => {
    const t = (b.title ?? '')
      .replace(/^\s*\d+\.\s*/, '')
      .replace(/\s*\(L\d+\)\s*$/, '')
      .trim();
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
  /**
   * 🔴 **표지가 있는 책만 세운다** — 없으면 `BookCover` 가 📖 이모지로 떨어져 벽에 빈 칸이 생긴다
   *    (실측: 열두 칸 중 하나가 그랬다). 벽의 일은 "이만큼 있다"를 보여주는 것이라 빈 칸은 반대말이다.
   */
  const wall = WALL_QUOTA.flatMap(({ n, match, spread }) => {
    const pool = books.filter((b) => b.coverImage && match(b.category ?? ''));
    const rank = (b: (typeof pool)[number]) => {
      const i = WALL_PREFER.findIndex((k) => (b.title ?? '').includes(k));
      return i < 0 ? WALL_PREFER.length : i;
    };
    const sorted = [...pool].sort((a, b) => rank(a) - rank(b));
    if (!spread) return sorted.slice(0, n);
    // 카테고리를 하나씩 돌아가며 — 다 돌고도 모자라면 남은 것으로 채운다.
    const used = new Set<string>();
    const picked = sorted.filter((b) => {
      const c = b.category ?? '';
      if (used.has(c)) return false;
      used.add(c);
      return true;
    });
    return [...picked, ...sorted.filter((b) => !picked.includes(b))].slice(0, n);
  });
  if (wall.length === 0) return null;
  return (
    <>
      <div className="!mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {wall.map((b) => (
          <Link
            key={b.id}
            to={`/library/${b.id}`}
            className="aspect-video overflow-hidden rounded-xl bg-cream-100"
            title={(b.title ?? '').replace(/^\s*\d+\.\s*/, '').replace(/\s*\(L\d+\)\s*$/, '')}
          >
            <BookCover book={b} lang="ko" loading="lazy" className="h-full" />
          </Link>
        ))}
      </div>
      <p className="!mt-2 text-center text-xs text-ink-600 break-keep">
        여기 보이는 건 그중 일부입니다.
      </p>
    </>
  );
}

/**
 * 히어로 상단 — **동화책 표지 슬라이더**(2026-08-05 사용자: "동화책 표지를 뽑아와서 카테고리별로
 * 슬라이딩으로 볼수 있게"). 라이브러리 실물 표지를 카테고리별로 묶어 자동으로 흘려보낸다.
 * 🔴 **가볍게 한다**(사용자: "페이지가 너무 무거워질거 같기도") — 512 썸네일(장당 ~28KB)만,
 *    카테고리당 2장까지, 최대 14장. `BookCover` 가 표지 URL 에서 512 썸네일을 유도하고 lazy 로 받는다.
 * 🔴 AI 그림 아님 — 실물이라 안 깨지고, 책이 늘면 자동으로 는다.
 * 🔴 파닉스 슬라이더를 하나 더 얹지 않는다 — 이미지가 두 배가 된다(무게). 파닉스는 헤드라인·스탯이
 *    말하고, 전용 일러스트가 생기면 그때 히어로에 한 장으로 얹는다.
 */
function CoverSlider() {
  const { data } = useStorybooks();
  const perCat = new Map<string, number>();
  const seen = new Set<string>();
  const covers: NonNullable<typeof data> = [];
  for (const b of data ?? []) {
    if (!b.coverImage || b.type) continue;
    const t = (b.title ?? '')
      .replace(/^\s*\d+\.\s*/, '')
      .replace(/\s*\(L\d+\)\s*$/, '')
      .trim();
    if (!t || seen.has(t)) continue;
    const c = b.category ?? '';
    if ((perCat.get(c) ?? 0) >= 2) continue; // 한 카테고리가 슬라이더를 독차지하지 않게
    perCat.set(c, (perCat.get(c) ?? 0) + 1);
    seen.add(t);
    covers.push(b);
    if (covers.length >= 14) break;
  }
  if (covers.length < 6) return null;
  // 🔴 이음매 없는 무한 슬라이드 — 같은 목록을 두 벌 이어 붙이고 -50% 로 흘린다. 각 표지에 `mr-3`
  //    를 줘 마지막 장에도 여백이 있어야 -50% 가 정확히 한 벌만큼 이동해 튀지 않는다.
  const loop = [...covers, ...covers];
  return (
    <div
      aria-hidden
      className="relative mb-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]"
    >
      <div className="hero-cover-track flex w-max">
        {loop.map((b, i) => (
          <div
            key={`${b.id}-${i}`}
            className="mr-3 aspect-video h-16 shrink-0 overflow-hidden rounded-xl shadow-sm sm:h-20"
          >
            <BookCover book={b} lang="ko" loading="lazy" className="h-full w-full" />
          </div>
        ))}
      </div>
      <style>{`
        .hero-cover-track { animation: hero-cover-slide 40s linear infinite; }
        .hero-cover-track:hover { animation-play-state: paused; }
        @keyframes hero-cover-slide { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @media (prefers-reduced-motion: reduce) { .hero-cover-track { animation: none; } }
      `}</style>
    </div>
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
    <section className="px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold tracking-wide text-coral-700">{eyebrow}</p>
        )}
        <h2 className="font-display text-[26px] font-extrabold leading-snug text-ink-900 break-keep sm:text-[32px]">
          {title}
        </h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-700 break-keep sm:text-[16px]">
          {children}
        </div>
      </div>
    </section>
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
        <Link to="/library" aria-label="탱고북 홈" className="relative mx-auto mb-5 block w-fit">
          <img
            src="/logo/logo-kr.webp"
            alt="탱고북"
            width={1774}
            height={887}
            className="h-16 w-auto sm:h-20"
          />
        </Link>
        <CoverSlider />
        {/* 🔴 md 부터 2열 — 사진을 글 아래 깔면 CTA 가 접힘선 밑으로 밀린다(3:2 라 768px 폭에서
            높이가 512px). 옆에 두면 빈 오른쪽이 채워지면서 CTA 는 그대로 위에 남는다. */}
        <div className="relative mx-auto grid max-w-3xl items-center gap-8 text-center md:grid-cols-[1fr_minmax(0,360px)] md:gap-10 md:text-left">
          <div className="min-w-0">
            <p className="inline-flex rounded-full bg-coral-100 px-4 py-1.5 text-sm font-extrabold text-coral-700 sm:text-base">
              4~7세 한글떼기 · 파닉스
            </p>
            <h1 className="mt-3 font-display text-[28px] font-extrabold leading-[1.25] text-ink-900 break-keep sm:text-[42px]">
              한글 파닉스 {FACTS.koreanUnits}단원과
              <br />
              다양한 동화책이 한 곳에
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-700 break-keep sm:text-[18px] md:mx-0">
              글자를 배우는 앱은 많습니다. 배운 글자로{' '}
              <strong className="text-coral-700">바로 읽을 책</strong>까지 있으면 대개 패드를 사고
              약정을 겁니다. 탱고북은 <strong className="text-coral-700">둘 다 앱 안에</strong>{' '}
              있고, 패드도 약정도 없습니다.
            </p>

            <div className="mx-auto mt-7 grid max-w-lg grid-cols-3 gap-2 sm:gap-3 md:mx-0">
              <Stat value={`${FACTS.koreanUnits}단원`} label="한글 파닉스" />
              <Stat value={`${FACTS.englishUnits}단원`} label="영어 파닉스" />
              {/* 🔴 동화책은 권수를 안 세운다(2026-08-05 사용자: "지금 숫자는 많은게 아냐").
                  카테고리 수로 다양성을 말한다 — 권수보다 강하고 늘어나도 낡지 않는다. */}
              <Stat value={`${FACTS.categories}개`} label="동화책 카테고리" />
            </div>

            <Link
              to={SIGNUP}
              className="mt-7 inline-flex min-h-[52px] items-center rounded-full bg-coral-700 px-8 text-base font-bold text-white shadow-md transition hover:bg-coral-800"
            >
              한달 무료 체험
            </Link>
            <p className="mt-3 text-xs text-ink-600 break-keep">
              월 {PLANS.month1.originalAmount?.toLocaleString()}원 → 할인 월{' '}
              {PLANS.month1.amount.toLocaleString()}원{' '}
              <span className="font-semibold text-coral-700">(베타오픈 기간)</span>
            </p>
            {/* 🔴 히어로의 "진짜 앱 화면" 배지는 뺐다(2026-08-05 사용자, 두 번째 요청) — 진짜 데모는
                한참 밑이라 히어로에서 약속하면 헛돈다. "진짜 앱 화면입니다 — 지금 눌러보세요"는
                데모(④) 자리에 그대로 있어 그 신호는 안 잃는다. */}
          </div>

          {/* 🔴 히어로 오른쪽 = **한글 파닉스 일러스트**(2026-08-05 사용자 제작). 니들펠트 아기호랑이가
              ㄱㄴㄷ·가나다 블록을 갖고 논다 — 헤드라인의 「한글 파닉스」를 그림이 한 번 더 말한다.
              「다양한 동화책」은 위 CoverSlider(표지 슬라이더)가 맡으므로 여기선 파닉스.
              (실물 사진 hero.webp 는 public/landing/hangul/ 에 보존.) */}
          <Photo
            src="phonics"
            alt="아기호랑이가 가·나·다 한글 블록을 갖고 노는 그림"
            w={1400}
            h={788}
            eager
            className="mx-auto max-w-sm md:max-w-none"
          />
        </div>
      </header>

      {/* ── ② 왜 탱고북인가 — 넘버링 포인트 (벤치마킹 §4-1) ───────── */}
      {/* 🔴 흩어져 있던 메시지 기둥을 Point 01~04로 모았다. 정보를 번호로 매기는 것 자체가
          「체계적」으로 읽히는 최대 장치(경쟁사 공통). 상세 증거는 ③④⑤가 이어서 보여준다. */}
      <Section eyebrow="왜 탱고북인가" title="배우고, 그 글자로 바로 읽습니다">
        <ol className="!mt-6 space-y-3">
          {POINTS.map((p, i) => (
            <li
              key={p.t}
              className="flex gap-4 rounded-2xl border border-ink-100 bg-white/70 p-4 sm:p-5"
            >
              <span className="shrink-0 font-display text-2xl font-extrabold leading-none text-coral-300 sm:text-3xl">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <strong className="block text-ink-900 break-keep">{p.t}</strong>
                <span className="mt-1 block text-sm text-ink-600 break-keep">{p.d}</span>
              </span>
            </li>
          ))}
          {/* 04 — 「없는 것」 아이콘 세트 (item #3) */}
          <li className="rounded-2xl border border-ink-100 bg-white/70 p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <span className="shrink-0 font-display text-2xl font-extrabold leading-none text-coral-300 sm:text-3xl">
                04
              </span>
              <strong className="text-ink-900 break-keep">설치도, 약정도, 광고도 없습니다</strong>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {NONES.map((n) => (
                <div key={n.t} className="rounded-xl bg-cream-100 px-2 py-3 text-center">
                  <div className="text-2xl">{n.icon}</div>
                  <strong className="mt-1 block text-xs text-ink-900 break-keep">{n.t}</strong>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-600 break-keep">
                    {n.d}
                  </span>
                </div>
              ))}
            </div>
          </li>
        </ol>
      </Section>

      {/* ── ③ 파닉스 커리큘럼 (데모보다 먼저 — 아래 데모가 32개 중 하나임을 알고 보게) ─────────────────────────────────── */}
      {/* 🔴 **가르치는 법을 설명하지 않는다**(2026-08-05 사용자: "이런 얘기는 안 해도 됨.
          그냥 우리가 이걸 컨텐츠를 가지고 있다고만 언급하면 됨"). 「기역은 이름이지 소리가
          아니다」는 우리끼리 옳은 얘기고, 부모가 이 자리에서 궁금한 건 **뭐가 얼마나 있나**다.
          제목도 「이름이 아니라 소리부터」에는 정작 **한글**이 안 들어 있었다. */}
      <Section eyebrow="한글 파닉스" title={`한글 파닉스 ${FACTS.koreanUnits}단원`}>
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
                <span className="ml-2 text-sm text-ink-600 break-keep">{s.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        {/* 🔴 **단원 칩 전체 목록(`CurriculumUnits`)과 설명 세 문단을 지웠다**(2026-08-05 사용자).
            32개를 다 늘어놓으면 위 다섯 줄 요약과 같은 말을 두 번 하는 셈이고, 화면 두 개 분량이
            지나가는 동안 아래 「직접 해보기」가 그만큼 멀어진다. 컴포넌트는 남겨 뒀다. */}
        <p className="!mt-6">
          영어 파닉스 <strong>{FACTS.englishUnits}단원</strong>도 같이 들어 있습니다.
        </p>
        {/* 🔴 화면에 **진짜 단원 화면**이 합성돼 있다 — 위 「익히기」 넷, 아래 「낱말 놀이」
            다섯. 바로 윗줄이 그 문장이라 글과 그림이 같은 것을 가리킨다.
            🔴 카메라가 **아이들 뒤**에 있다 — 앞에서 찍으면 아이가 화면 뒤에 앉아 못 보는 걸
            보는 그림이 된다(첫 플레이트가 그랬다). */}
        <Photo
          src="siblings"
          alt="두 아이가 스탠드에 세운 태블릿의 한글 파닉스 단원 화면을 함께 보고 있다"
          w={1200}
          h={800}
          className="!mt-6"
        />
        <Link
          to="/library/phonics/korean"
          className="!mt-5 inline-flex min-h-[44px] items-center rounded-full border-2 border-coral-500 px-6 text-sm font-bold text-coral-700 transition hover:bg-coral-50"
        >
          커리큘럼 전체 보기 →
        </Link>
      </Section>

      {/* ── ④ 직접 해보기 — 그 32단원 중 「ㄱ」 하나를 통째로 ───────────────────── */}
      <section className="px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-coral-200 bg-white/60 p-4 sm:p-6">
            <p className="text-xs font-bold tracking-wide text-coral-700">한글 파닉스 · 32단원</p>
            <h2 className="mt-1 font-display text-[26px] font-extrabold text-ink-900 break-keep sm:text-[32px]">
              「ㄱ」 단원 학습 샘플
            </h2>
            {/* 🔴 **이 한 줄이 이 페이지에서 가장 센 주장이다**(2026-08-05 사용자: "엄청 강조해서
                보여줘야지. 폰트 크기나 색깔 다 똑같이 나오니까 실제 앱인지 느낌이 안 와").
                본문과 같은 회색 작은 글씨로 두면 그냥 설명문 한 줄로 읽히고 지나간다 —
                아래 아홉 개가 스크린샷이 아니라는 걸 **읽기 전에 눈으로** 알아야 한다.
                그래서 색·크기·테두리를 다르게 주고 손가락을 깜빡인다. */}
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-coral-300 bg-coral-50 px-4 py-2.5 text-[15px] font-extrabold text-coral-700 break-keep sm:text-lg">
              <span className="animate-pulse text-xl sm:text-2xl">👆</span>
              진짜 앱 화면입니다 — 지금 눌러보세요
            </p>
            {/* 🔴 여기엔 연출 사진을 두지 않는다(2026-08-05). `tracing.webp`(합성본)를 크게
                깔았었는데, ①비스듬히 놓인 태블릿이라 화면 글자가 안 읽혀 **「ㄱ 샘플」이라고
                말해 주지 못하고** ②진짜로 눌러볼 화면이 바로 아래인데 그 앞을 800px 이 막았다.
                이 구간의 일은 분위기가 아니라 **빨리 만지게 하는 것**이다.
                (합성본 자체는 `public/landing/hangul/tracing.webp` 에 남아 있다.) */}
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-coral-700 px-5 py-2 text-lg font-extrabold text-white">
              📖 익히기 · 글자
            </p>
            {GA_LEARN.map((a) => (
              <PhonicsTryIt
                key={a.key}
                unitId={GA_UNIT}
                activityKey={a.key}
                height={a.h}
                note={a.note}
              />
            ))}

            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-mint-700 px-5 py-2 text-lg font-extrabold text-white">
              🎮 낱말 놀이 · 낱말
            </p>
            {GA_PLAY.map((a) => (
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
      <Section eyebrow="동화책" title="다양한 동화책이 매달 늘어납니다">
        <p>
          생활동화 · 세계 명작 · 전래 동화 · 자연 관찰, 그리고 아기호랑이 호리가 나오는 창작
          시리즈까지 <strong>{FACTS.categories}개 카테고리</strong>입니다. 아이 취향이 어디에 있든
          볼 책이 있고, <strong>매달 새 동화책이 늘어납니다</strong> — 익숙해질 때쯤 다음 달에 또
          새로 읽을 게 생깁니다.
        </p>
        <p>
          그리고 <strong>동화책마다 독후활동 게임</strong>이 붙어 있습니다. 다 읽고 나면 그 책에
          나온 낱말로 어휘를 익히는 게임이 그 자리에서 열립니다. {FACTS.narrated}권은 한국어
          나레이션이 처음부터 끝까지 들어 있어, 글자를 아직 못 읽는 아이도 혼자 봅니다.
        </p>
        {/* 🔴 섹션 문을 **동화책 표지벽**으로 연다(2026-08-05 사용자: "처음에 아이 사진이 아니라
            동화책 리스트가 쭉 나오는게 … 그 아래 아이+tv 사진이 나오니까"). 아래 TV 컷이 이미
            아이+뷰어를 보여주므로 첫 아이 사진(reading.webp)은 중복이라 뺐다 — 리스트로 문을 연다.
            (reading.webp 는 public/landing/hangul/ 에 남아 있다.) */}
        <BookWall />
        <div className="!mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map(([name, n]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white/70 px-3 py-1.5 text-sm text-ink-700 break-keep"
            >
              {name}
              <strong className="text-coral-700">{n}</strong>
            </span>
          ))}
        </div>
        <p className="!mt-6">
          <strong>{FACTS.fiveLangBooks}권</strong>은 한국어·영어·베트남어·중국어·태국어 다섯 언어로
          읽을 수 있고, 세계 명작 등 <strong>{FACTS.multiStyleBooks}권</strong>은 같은 이야기를
          그림체를 바꿔 가며 볼 수 있습니다. 이야기를 이어서 틀어두는 「묶어 보기」도 있어 재울 때
          씁니다.
        </p>
        <p className="!mt-4">
          앱을 따로 깔지 않습니다. 브라우저에서 열리니 태블릿도, 폰도, <strong>거실 TV</strong>도
          그대로 화면이 됩니다. 패드를 사야 볼 수 있는 게 아닙니다.
        </p>
        {/* 🔴 **TV 컷을 쓴다**(2026-08-02). 「전용 TV 앱이 없으니 과장」이라고 판단했다가
            뒤집었다 — 웹앱이라 TV 브라우저에서 그냥 열리고 실제로 그렇게들 쓴다. 오히려 이
            페이지의 대비축(패드를 묶어 파는 방문 판매 vs 우리)에 정확히 맞는 그림이다.
            🔴 부모가 프레임에 없다 — 「묶어 보기」의 쓰임이 *부모가 손을 떼는 것*이라서다.
            화면엔 진짜 뷰어(백설공주 + 자막)가 합성돼 있다. */}
        <Photo
          src="tv"
          alt="거실 TV 화면에 뜬 백설공주 동화를 두 아이가 앉아서 보고 있다"
          w={1200}
          h={675}
          className="!mt-6"
        />
        <p className="!mt-6">
          이것도 <strong>직접 읽어보실 수 있습니다.</strong> 카테고리를 눌러 그 라인의 책을 바꿔
          가며 들어보세요. 「낱말 게임」으로 넘기면 <em>그 책에 나온 낱말</em>로 바로 게임합니다.
        </p>
        {/* 🔴 파닉스↔동화책이 실제로 이어지는 **유일한 증거**다. 부모 리포트 화면에 이미
            이 문장이 있는데(「고기」를 맞히면 고·기 칸이 같이 올라가요) 랜딩엔 한 줄도 없었다.
            리뷰어가 「연결을 약속만 하고 못 보여준다」고 한 게 이것이다. */}
        <p className="!mt-6">
          그리고 이 낱말들은 <strong>파닉스 진도에도 함께 쌓입니다.</strong> 동화책에서 「고기」를
          맞히면 파닉스 표의 <strong>고·기 칸이 같이 올라갑니다</strong> — 책을 읽은 게 글자 공부로
          돌아옵니다.
        </p>
        <p className="!mt-6">
          그 독후활동 게임에서 같은 낱말을{' '}
          <strong>그림으로 만나고, 글자로 조립하고, 따라 그리고, 손으로 씁니다</strong> — 한 낱말을
          네 가지 방식으로 만나기 때문에 외우지 않아도 남습니다.
        </p>
        <HangulBookTryIt />
        <HangulWordGameTryIt />
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
          체험이 끝나면{' '}
          <span className="text-ink-400 line-through">
            월 {PLANS.month1.originalAmount?.toLocaleString()}원
          </span>{' '}
          <strong className="text-coral-700">
            할인 월 {PLANS.month1.amount.toLocaleString()}원
          </strong>
          <span className="text-coral-700"> (베타오픈 기간)</span>입니다. 그때 계속 쓸지 정하시면
          됩니다.
        </p>
        <p>
          아이가 무엇을 했는지 <strong>부모 화면에 그대로 남습니다.</strong> 어떤 글자에서 자꾸
          멈추는지, 어떤 낱말을 다시 보면 좋은지 — 밤에 한 번 열어보면 오늘 뭘 했는지 보입니다.
        </p>
        <p className="text-sm text-ink-600">
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
            파닉스로 글자를 떼고, 동화책으로 낱말과 문장을 익혀요
          </p>
          <p className="text-sm text-ink-600 break-keep">설치 없이 브라우저에서 바로 시작합니다.</p>
          <Link
            to={SIGNUP}
            className="mt-1 inline-flex min-h-[52px] items-center rounded-full bg-coral-700 px-8 text-base font-bold text-white shadow-md transition hover:bg-coral-800"
          >
            한달 무료 체험 →
          </Link>
          <Link to="/library" className="text-xs font-semibold text-ink-600 underline">
            먼저 둘러볼래요
          </Link>
        </div>
      </Section>

      <StickyCta />
      <SiteFooter lang="ko" />
    </div>
  );
}
