import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PLANS } from '@tangobook/shared';
import { useSeo } from '@/lib/useSeo';
import { SiteFooter } from '@/components/SiteFooter';
import { PhonicsTryIt } from '@/features/phonics-learner/components/PhonicsTryIt';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import { BookCover } from '@/design-system/primitives/BookCover';

/**
 * `/english` — 영어 파닉스 광고 랜딩. 네이버·메타 광고의 도착지.
 *
 * 🔴 **구조는 `/hangul` 을 따른다**(벤치마킹 2회로 검증된 뼈대). 문구 규칙도 그대로:
 *    헤드라인에 「무료」 금지 · 마감 날짜 금지 · 경쟁사 비교표 금지 · 불안으로 팔지 않기 ·
 *    가르치는 법을 설명하지 않기. → memory `hangul-landing-benchmark-todo-2026-08-05`
 * 🔴 **다만 「숫자」 섹션은 없다**(2026-08-10 사용자: "동화책, 낱말 숫자로 하지말고, 다양한
 *    동화책으로 어휘랑 독해력 키운다 이런식으로. 예시는 이미지로"). 표지 열다섯 장이
 *    「230권」보다 다양성을 더 잘 말하고, 페이지도 그만큼 짧아진다(길이는 이 랜딩의 상수 위험).
 * 🔴 **광고 키워드 함정** — 「알파벳」(폰트·특수문자)·「CVC」(신용카드 보안코드가 몸통)·
 *    「사이트워드」(그 콘텐츠가 우리에게 없다)로는 광고를 걸지 않는다. 본진은 「파닉스」.
 */

/** 실측값(2026-08-10 프로덕션 API). 늘어나기만 하므로 낡아도 **과소 주장**이라 안전하다. */
const FACTS = {
  englishUnits: 39,
  koreanUnits: 32,
  books: 266,
};

const SIGNUP = '/login?mode=signup';

/** 영어 파닉스 다섯 권 — 커리큘럼과 같은 순서(뷰 1: 여정). */
const BOOKS: { label: string; count: string; detail: string; tone: string }[] = [
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
 * 뷰 2 — 능력 축. 🔴 뷰 1 이 **순서**라면 이건 **폭**(한 능력이 몇 단원에 걸쳐 자라나)이다.
 * 두 겹으로 겹쳐 보이는 것이 「전문적」의 정체였다(2차 벤치마크 결론).
 */
const TOTAL = 39;
const SKILLS: { label: string; from: number; to: number; tone: string }[] = [
  { label: '글자 소리', from: 1, to: 39, tone: 'bg-coral-400' },
  { label: '낱말 읽기', from: 9, to: 39, tone: 'bg-coral-300' },
  { label: '긴 모음', from: 17, to: 39, tone: 'bg-mint-400' },
  { label: '낱말 쓰기', from: 1, to: 39, tone: 'bg-peach-300' },
];

/** ② 부모 머릿속 질문을 헤드라인으로 — 넘버링된 이유 구조(1차 벤치마크). */
const POINTS: { t: string; d: string }[] = [
  {
    t: '소리부터 시작합니다',
    d: '알파벳 이름(에이·비)이 아니라 소리(/æ/·/b/)를 먼저 익힙니다. 그래야 처음 보는 낱말도 읽어 냅니다.',
  },
  {
    t: '글자가 낱말이 되는 순간을 봅니다',
    d: 'c 와 an 이 가까워지다 붙으며 can 이 됩니다. 글로 설명하기 가장 어려운 그 순간을 화면에서 직접 만져 봅니다.',
  },
  {
    t: '배운 글자로 바로 읽습니다',
    d: '파닉스만 하고 끝나지 않습니다. 같은 앱 안 동화책을 영어 나레이션으로 들으며 읽습니다.',
  },
];

/**
 * ④ 「c + an → can」 단원 — Book 2 첫 단원. 네 개만 둔다(같은 형식이 이어지면 리듬이 사라진다).
 *
 * 🔴 **키는 그 단원 plan 에 실제로 있는 것이어야 한다** — 없으면 `PhonicsTryIt` 이
 *    `if (!activity) return null` 로 **에러 없이 상자를 지운다**. 처음엔 `game-english-block` 을
 *    넣었다가 상자가 4개가 아니라 3개로 떴다(game-reviewer 실측) — 영어 블록 게임은
 *    2026-08-09 에 **전 권에서 빠졌고 가드 테스트까지 있다**(`english-phonics-units.test.ts`).
 *    en-b2-u01 의 play 는 낱말 쓰기·낱말 그리기·그림 짝 셋이다.
 */
const TRY_UNIT = 'en-b2-u01';
const TRY_LEARN = [
  {
    key: 'cvc-an',
    h: 560,
    note: 'c 와 an 이 붙어 can 이 됩니다 — 영어 읽기가 시작되는 순간입니다.',
  },
];
const TRY_PLAY = [
  { key: 'game-dots', h: 620, note: '낱말이 가리키는 것을 직접 그려 봅니다.' },
  { key: 'game-word-writing', h: 620, note: '낱말 전체를 왼쪽부터 차례로 씁니다.' },
  {
    key: 'game-line-matching',
    h: 620,
    note: `${FACTS.englishUnits}단원이 전부 이렇게 생겼습니다.`,
    cta: true,
  },
];

/** ⑤ 표지 벽 — 라인이 섞이게. 🔴 표지 없는 책은 뽑지 않는다(빈 칸 방지). */
const WALL_QUOTA: { n: number; match: (c: string) => boolean; spread?: boolean }[] = [
  { n: 7, match: (c) => c === '세계 명작' },
  { n: 3, match: (c) => c === '전래 동화' },
  { n: 3, match: (c) => c.endsWith('친구들'), spread: true },
  { n: 2, match: (c) => c === '생활동화' },
];

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

/** 하단 고정 CTA — 🔴 체험 상자가 화면에 있으면 얇아진다(상자 아래를 덮지 않게). */
function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 560);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-coral-200 bg-cream-50/95 px-4 py-3 backdrop-blur transition-transform duration-300 sm:px-6 ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] font-semibold text-ink-700 break-keep sm:text-sm">
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

function BookWall() {
  const { data } = useStorybooks();
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
  const wall = WALL_QUOTA.flatMap(({ n, match, spread }) => {
    const pool = books.filter((b) => b.coverImage && match(b.category ?? ''));
    if (!spread) return pool.slice(0, n);
    const used = new Set<string>();
    const picked = pool.filter((b) => {
      const c = b.category ?? '';
      if (used.has(c)) return false;
      used.add(c);
      return true;
    });
    return [...picked, ...pool.filter((b) => !picked.includes(b))].slice(0, n);
  });
  if (!wall.length) return null;
  return (
    <div className="!mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
      {wall.map((b) => (
        <Link
          key={b.id}
          to={`/library/${b.id}`}
          className="aspect-video w-full overflow-hidden rounded-xl bg-cream-100"
          title={(b.title ?? '').replace(/^\s*\d+\.\s*/, '')}
        >
          <BookCover book={b} lang="ko" loading="lazy" className="h-full" />
        </Link>
      ))}
    </div>
  );
}

export default function EnglishLandingPage() {
  useSeo({
    title: `영어 파닉스 ${FACTS.englishUnits}단원 — 탱고북`,
    description: `알파벳 소리부터 매직 e 까지 영어 파닉스 ${FACTS.englishUnits}단원. 배운 글자로 바로 읽는 동화책까지 같은 앱 안에. 한 달 무료로 써 보고 정하세요.`,
  });

  return (
    <div className="min-h-screen bg-cream-50">
      {/* ── ① 히어로 ─────────────────────────────────────────── */}
      <header className="px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold tracking-wide text-coral-700">4~7세 영어 파닉스</p>
          <h1 className="mt-2 font-display text-[30px] font-extrabold leading-tight text-ink-900 break-keep sm:text-[42px]">
            소리부터 시작하는
            <br />
            영어 파닉스 {FACTS.englishUnits}단원
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-700 break-keep sm:text-base">
            알파벳 소리부터 매직 e 까지. 그리고 배운 글자로 바로 읽는{' '}
            <strong>동화책이 같은 앱 안에</strong> 있습니다.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={SIGNUP}
              className="inline-flex min-h-[48px] items-center rounded-full bg-coral-700 px-6 text-base font-bold text-white shadow-sm transition hover:bg-coral-800"
            >
              한달 무료 체험
            </Link>
            <span className="text-sm text-ink-600 break-keep">
              <span className="text-ink-400 line-through">
                월 {PLANS.month1.originalAmount?.toLocaleString()}원
              </span>{' '}
              <strong className="text-coral-700">
                할인 월 {PLANS.month1.amount.toLocaleString()}원
              </strong>
            </span>
          </div>
          {/* 🔴 히어로 신뢰 신호 — 이 페이지에서 가장 센 주장이라 눈에 띄게 둔다. */}
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-coral-300 bg-coral-50 px-4 py-2.5 text-[15px] font-extrabold text-coral-700 break-keep sm:text-lg">
            <span className="animate-pulse text-xl sm:text-2xl">👆</span>
            아래 화면은 진짜 앱입니다 — 지금 눌러보세요
          </p>
        </div>
      </header>

      {/* ── ② 왜 탱고북인가 — 질문형 넘버링 ───────────────────── */}
      <Section eyebrow="왜 탱고북인가" title="우리 아이, 영어책 혼자 읽게 될까요?">
        <ol className="!mt-5 space-y-3">
          {POINTS.map((p, i) => (
            <li
              key={p.t}
              className="flex gap-3 rounded-2xl border border-ink-100 bg-white/70 px-4 py-4"
            >
              <span className="shrink-0 font-display text-lg font-extrabold text-coral-700">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <strong className="block text-ink-900 break-keep">{p.t}</strong>
                <span className="mt-1 block text-sm text-ink-600 break-keep">{p.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── ③ 커리큘럼 2겹(여정 + 능력 축) ─────────────────────── */}
      <Section eyebrow="영어 파닉스" title={`영어 파닉스 ${FACTS.englishUnits}단원`}>
        {/* 뷰 1 — 다섯 권을 순서대로 밟는 길 */}
        <ol className="!mt-5 space-y-2">
          {BOOKS.map((s, i) => (
            <li
              key={s.label}
              className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/70 px-4 py-3"
            >
              <span className="w-6 shrink-0 text-right font-display text-sm font-extrabold text-ink-400">
                {i + 1}
              </span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${s.tone}`}>
                {s.count}
              </span>
              <span className="min-w-0">
                <strong className="text-ink-900">{s.label}</strong>
                <span className="ml-2 text-sm text-ink-600 break-keep">{s.detail}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* 뷰 2 — 같은 39단원을 「무엇이 언제 자라나」로 겹쳐 본다 */}
        <div className="!mt-6 rounded-2xl border border-ink-100 bg-white/70 p-4 sm:p-5">
          <p className="text-xs font-bold tracking-wide text-coral-700">단원이 지나며 자라는 것</p>
          <div className="mt-3 space-y-2.5">
            {SKILLS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-bold text-ink-800 break-keep sm:w-24 sm:text-sm">
                  {s.label}
                </span>
                <span className="relative h-2.5 flex-1 rounded-full bg-ink-50">
                  <span
                    className={`absolute inset-y-0 rounded-full ${s.tone}`}
                    style={{
                      left: `${((s.from - 1) / TOTAL) * 100}%`,
                      width: `${((s.to - s.from + 1) / TOTAL) * 100}%`,
                    }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-ink-600 sm:w-20 sm:text-xs">
                  {s.from}–{s.to}단원
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-600 break-keep">
            한 단원이 끝나도 그 능력이 끝나지 않습니다. 뒤 단원의 낱말 놀이에서 계속 만납니다.
          </p>
        </div>

        <p className="!mt-6">
          한글 파닉스 <strong>{FACTS.koreanUnits}단원</strong>도 같이 들어 있습니다.
        </p>
      </Section>

      {/* ── ④ 직접 해보기 — Book 2 첫 단원을 통째로 ──────────────── */}
      <section className="px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-coral-200 bg-white/60 p-4 sm:p-6">
            <p className="text-xs font-bold tracking-wide text-coral-700">
              영어 파닉스 · {FACTS.englishUnits}단원
            </p>
            <h2 className="mt-1 font-display text-[26px] font-extrabold text-ink-900 break-keep sm:text-[32px]">
              「c + an → can」 단원 학습 샘플
            </h2>
            <p className="mt-2 text-sm text-ink-600 break-keep">
              실제 앱 화면입니다. 지금 바로 눌러볼 수 있습니다.
            </p>

            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-coral-700 px-5 py-2 text-lg font-extrabold text-white">
              📖 익히기 · 글자
            </p>
            {TRY_LEARN.map((a) => (
              <PhonicsTryIt
                key={a.key}
                unitId={TRY_UNIT}
                activityKey={a.key}
                height={a.h}
                note={a.note}
                language="english"
              />
            ))}

            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-mint-700 px-5 py-2 text-lg font-extrabold text-white">
              🎮 낱말 놀이
            </p>
            {TRY_PLAY.map((a) => (
              <PhonicsTryIt
                key={a.key}
                unitId={TRY_UNIT}
                activityKey={a.key}
                height={a.h}
                note={a.note}
                cta={'cta' in a && a.cta}
                language="english"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── ⑤ 동화책 — 숫자가 아니라 표지로 ─────────────────────── */}
      <Section eyebrow="동화책 · 어휘와 독해력" title="읽을수록 어휘와 독해력이 자라요">
        <p>
          파닉스를 뗐다고 끝이 아닙니다. 낱말을 <strong>이야기 속에서</strong> 만나고 또 만나며{' '}
          <strong>어휘가 늘고</strong>, 읽고 이해하는 힘(<strong>독해력</strong>)이 자랍니다.
        </p>
        <p>
          세계 명작과 전래 동화, 자연 관찰, 창작 시리즈까지 — 아이가 좋아하는 이야기를 골라 봅니다.
          <strong> 영어 나레이션</strong>이 처음부터 끝까지 읽어 주므로 아직 못 읽는 아이도 혼자
          봅니다.
        </p>
        <BookWall />
        <p className="!mt-5 text-center">
          <Link
            to="/library"
            className="inline-flex min-h-[44px] items-center rounded-full bg-mint-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-mint-800"
          >
            동화책 전체 보기 →
          </Link>
        </p>
      </Section>

      {/* ── ⑥ 요금 (혜택은 여기서 처음 등장) ───────────────────── */}
      <Section eyebrow="요금" title="한 달 무료로 써 보고 정하세요">
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
          입니다. 그때 계속 쓸지 정하시면 됩니다. 패드값도, 약정도, 위약금도 없습니다.
        </p>
        <p className="!mt-6 text-center">
          <Link
            to={SIGNUP}
            className="inline-flex min-h-[48px] items-center rounded-full bg-coral-700 px-6 text-base font-bold text-white shadow-sm transition hover:bg-coral-800"
          >
            한달 무료 체험 →
          </Link>
        </p>
      </Section>

      <div className="pb-20">
        <SiteFooter minimal />
      </div>
      <StickyCta />
    </div>
  );
}
