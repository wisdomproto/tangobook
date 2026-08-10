import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { GameTypeId, Storybook } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { ViewerContainer } from '@/features/viewer/components/ViewerContainer';
import { GameOverlay } from '@/features/vocabulary-unit/components/VocabularyStudyContent';
import { deriveStorybookUnit } from '@/features/vocabulary-unit/lib/derive-storybook-unit';
import { EmbedStage } from '@/features/phonics-learner/components/EmbedStage';
import { PhonicsEmbeddedProvider } from '@/features/phonics-learner/components/ActivityShell';

/**
 * 랜딩 안에서 **동화책을 실제로 읽고, 그 책의 낱말 게임까지** 해보는 상자.
 *
 * 🔴 파닉스 상자와 같은 원리 — 스크린샷이 아니라 앱이 쓰는 그 컴포넌트를 그대로 얹는다.
 *    뷰어(`ViewerContainer`)도 낱말 게임(`VocabularyStudyContent`)도 손대지 않았다.
 * 🔴 **읽어주기와 낱말 게임을 탭으로 감추지 않는다**(2026-08-02 사용자: "동화책 어휘 게임이
 *    안 보이는데?"). 탭 뒤에 있으면 없는 것과 같다 — 상자를 둘로 나눠 **둘 다 펼쳐 둔다**.
 * 🔴 **한 번에 한 권만 마운트한다.** 카테고리가 아홉이라 전부 얹으면 아홉 권치 삽화·나레이션을
 *    한꺼번에 받는다. 칩으로 고르면 그 권만 뜬다 — 아홉 권을 다 보여주면서 무게는 한 권.
 * 🔴 `transform` 으로 상자에 가둔다 — 뷰어는 전체화면(`fixed`)이라 그냥 얹으면 랜딩을 덮는다.
 *    변환된 조상이 `fixed` 의 컨테이닝 블록이 되는 성질을 쓴다(파닉스 상자와 같은 처리).
 */

/**
 * 카테고리마다 대표 한 권 — 공개·나레이션 완비 책에서 골랐다(2026-08-01 실측).
 *
 * 🔴 `words` = 그 책의 `key_objects` 개수. **0 인 책은 낱말 게임이 통째로 비어 있다** —
 *    호리 세 라인(생활동화·유치원·세상 탐험)이 그렇다(대본은 있는데 핵심단어를 아직 안 뽑았다).
 *    데이터에 없는 걸 화면이 만들 수는 없으므로 **낱말 게임 상자에서는 그 책을 아예 뺀다**.
 */
export const BOOKS_BY_CATEGORY: { cat: string; id: string; title: string; words: number }[] = [
  { cat: '세계 명작', id: '1778555233699', title: '백설공주', words: 6 },
  { cat: '전래 동화', id: '1785303658036', title: '반쪽이', words: 5 },
  { cat: '곤충 친구들', id: '1777607890313', title: '장수풍뎅이', words: 12 },
  { cat: '하늘 동물 친구들', id: '1777602265786', title: '오리', words: 11 },
  { cat: '바다 동물 친구들', id: '1777614294799', title: '바다거북', words: 8 },
  { cat: '육지 동물 친구들', id: '1777615082301', title: '캥거루', words: 6 },
  { cat: '호리네 생활동화', id: '1783990336946', title: '고마워, 자연아!', words: 0 },
  { cat: '호리 유치원동화', id: '1784550873799', title: '내일 또 만나요', words: 0 },
  { cat: '호리 세상 탐험', id: '1784860653877', title: '편지 배달 왔어요', words: 0 },
];

type Book = (typeof BOOKS_BY_CATEGORY)[number];

function TryItShell({
  tone,
  label,
  books,
  bookId,
  setBookId,
  footer,
  children,
}: {
  tone: 'mint' | 'amber';
  label: string;
  books: Book[];
  bookId: string;
  setBookId: (id: string) => void;
  footer: string;
  children: ReactNode;
}) {
  const chipOn =
    tone === 'mint'
      ? 'border-mint-500 bg-mint-50 text-mint-700'
      : 'border-amber-500 bg-amber-50 text-amber-600';
  const btn = tone === 'mint' ? 'bg-mint-500 hover:bg-mint-800' : 'bg-amber-600 hover:bg-amber-700';
  return (
    /* 🔴 파닉스 상자와 같이 페이지 폭을 지킨다 — 잘림은 EmbedStage 축소로 푼다. */
    <div
      className={`my-7 overflow-hidden rounded-[26px] border bg-white shadow-sm ${
        tone === 'mint' ? 'border-mint-200' : 'border-amber-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-3">
        <span className="text-lg font-extrabold text-ink-800 break-keep">{label}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1.5 text-xs font-extrabold text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          실제 앱 화면
        </span>
      </div>

      {/* 카테고리 칩 — 가로 스크롤(모바일에서 아홉 개가 한 줄에 안 들어간다) */}
      <div className="flex gap-2 overflow-x-auto border-b border-ink-100 px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {books.map((b) => (
          <button
            key={b.id}
            onClick={() => setBookId(b.id)}
            className={`min-h-[44px] shrink-0 rounded-full border px-3 text-xs font-semibold transition ${
              b.id === bookId ? chipOn : 'border-ink-100 text-ink-600 hover:bg-cream-50'
            }`}
          >
            {b.cat}
          </button>
        ))}
      </div>

      {children}

      <div className="flex flex-col items-center gap-2 bg-cream-50 px-5 py-4 text-center">
        <p className="text-xs text-ink-600 break-keep">{footer}</p>
        <Link
          to="/library"
          className={`inline-flex min-h-[44px] items-center rounded-full px-5 text-sm font-bold text-white shadow-sm transition ${btn}`}
        >
          동화책 전체 보기 →
        </Link>
      </div>
    </div>
  );
}

/** 📖 읽어주기 — 아홉 카테고리 전부. */
export function HangulBookTryIt() {
  const [bookId, setBookId] = useState(BOOKS_BY_CATEGORY[0].id);
  const picked = BOOKS_BY_CATEGORY.find((b) => b.id === bookId) ?? BOOKS_BY_CATEGORY[0];

  return (
    <TryItShell
      tone="mint"
      label={`📖 읽어주기 · ${picked.cat} 「${picked.title}」`}
      books={BOOKS_BY_CATEGORY}
      bookId={bookId}
      setBookId={setBookId}
      footer="화면을 한 번 누르면 나레이션이 시작됩니다. 264권이 이렇게 읽힙니다."
    >
      {/* 🔴 `key` 로 remount — 책을 바꾸면 뷰어 내부 상태(페이지·재생)가 남으면 안 된다. */}
      {/* 🔴 `embed`(2026-08-05 사용자) — ①`noAutoStart`: 탭 게이트의 5초 자동 시작을 끈다(랜딩에선
          탭해야만 재생, 스크롤하다 갑자기 소리 나지 않게). ②`style:'paper-craft'`: 표지·페이지를
          페이퍼 아트로 고정(그 스타일 없는 책은 base 로 폴백). 뷰어 기본 동작은 안 건드린다. */}
      <EmbedStage height="100dvh">
        <ViewerContainer
          key={bookId}
          storybookId={bookId}
          embed={{ style: 'paper-craft', noAutoStart: true }}
        />
      </EmbedStage>
    </TryItShell>
  );
}

/**
 * 🎮 동화책 낱말 게임 — **게임 하나에 상자 하나**.
 *
 * 🔴 목록 화면(카드 넷)을 보여주지 않는다(2026-08-02 사용자: "각 게임을 따로 보여줘").
 *    카드 넷은 「메뉴」로 보이지 무엇을 하는 게임인지는 안 보인다. 파닉스 상자 아홉 개와
 *    같은 원리 — 눌러서 해 보게 한다.
 * 🔴 네 게임이 **같은 낱말**을 서로 다른 방식으로 다룬다(그림↔말 / 글자 조립 / 윤곽 따라 그리기 /
 *    획 따라 쓰기). 그게 이 묶음의 논지라 문구로도 말한다.
 */
/**
 * 🔴 **넷 다 두지 않는다**(2026-08-02 2차 리뷰). 파닉스 구간이 이미 같은 게임 넷을 보여주기
 *    때문에, 여기서 또 넷을 보여주면 **같은 게임을 두 번씩** 보게 된다 — 두 번째 「따라 쓰기」에서
 *    독자는 읽기를 멈추고 넘기기 시작하고, 그 상태로 마지막 CTA 에 도착한다.
 * 🔴 뺀 것 중 **한글 블록**은 특히 여기서 나쁘다 — 동화책 낱말은 자모가 다 열려
 *    **40칸 키보드**가 펼쳐진다(파닉스판은 네 칸). 「우리 애는 못 하겠다」로 읽힌다.
 * 🔴 남긴 둘 = 설명이 필요 없는 것(그림 짝) + **손으로 쓰는 것**(낱말 쓰기).
 *    낱말 그리기(색칠)를 뒤에 뒀다가 **낱말 쓰기로 바꿨다**(2026-08-10 사용자) — 색칠은 낱말을
 *    안 쓰고도 끝나서 동화책 구간이 「보고 고르는 것」으로만 끝났다. 파닉스 구간이 글자 한 자
 *    쓰기(`ㄱ 써보기`)로 끝나므로, 여기선 **낱말 전체 쓰기**가 그 다음 단계로 읽힌다.
 */
const BOOK_GAMES: { id: GameTypeId; label: string; how: string }[] = [
  { id: 'korean-line-matching', label: '🎯 그림 짝 찾기', how: '그림과 낱말을 이어 봅니다' },
  { id: 'korean-word-writing', label: '📝 낱말 쓰기', how: '그 책에 나온 낱말을 손으로 씁니다' },
];

/** 상자로는 안 띄우고 한 줄로만 알리는 나머지 — 있다는 사실만 전한다. */
const BOOK_GAMES_MORE = '🧱 한글 블록 · ✏️ 낱말 그리기';

export function HangulWordGameTryIt() {
  const books = BOOKS_BY_CATEGORY.filter((b) => b.words > 0);
  const [bookId, setBookId] = useState(books[0].id);
  const picked = books.find((b) => b.id === bookId) ?? books[0];

  const book = useStorybook(bookId).data as Storybook | undefined;
  /** 🔴 책이 오기 전엔 만들지 않는다 — 빈 단원을 넘기면 게임판이 0개로 뜬다. */
  const unit = useMemo(() => (book ? deriveStorybookUnit(book) : null), [book]);

  return (
    <>
      {BOOK_GAMES.map((g, i) => (
        <TryItShell
          key={g.id}
          tone="amber"
          label={`${g.label} · ${g.how}`}
          /* 책 칩은 첫 상자에만 — 네 상자마다 붙으면 같은 줄이 네 번 반복된다. */
          books={i === 0 ? books : []}
          bookId={bookId}
          setBookId={setBookId}
          footer={
            i === 0
              ? `「${picked.title}」에 나온 낱말 ${picked.words}개로 놉니다 — 책마다 낱말이 다릅니다.`
              : `같은 낱말을 ${BOOK_GAMES_MORE} 로도 만납니다. 방식만 바꿔 다시 만나서, 외우지 않아도 남습니다.`
          }
        >
          {/* 🔴 **`PhonicsEmbeddedProvider` 로 감싼다**(2026-08-10) — 파닉스 상자만 이 컨텍스트를
              주고 있어서, 동화책 게임 상자는 헤더도 학습 화면 그대로였고 무엇보다 **진입 안내
              음성**("글자를 따라 써봐")이 페이지를 열자마자 울렸다. 게이트는 `useGameEntryGuide`
              한 곳이고, 그게 이 컨텍스트를 본다. */}
          <PhonicsEmbeddedProvider value>
            <EmbedStage height="100dvh">
              {unit && book ? (
                <GameOverlay
                  key={`${bookId}-${g.id}`}
                  unit={unit}
                  game={g.id}
                  lang="ko"
                  storybook={book}
                  onComplete={() => {}}
                  onBack={() => {}}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-600">
                  불러오는 중…
                </div>
              )}
            </EmbedStage>
          </PhonicsEmbeddedProvider>
        </TryItShell>
      ))}
    </>
  );
}
