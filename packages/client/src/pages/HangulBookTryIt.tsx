import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Storybook } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { ViewerContainer } from '@/features/viewer/components/ViewerContainer';
import { VocabularyStudyContent } from '@/features/vocabulary-unit/components/VocabularyStudyContent';
import { deriveStorybookUnit } from '@/features/vocabulary-unit/lib/derive-storybook-unit';

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
      ? 'border-mint-500 bg-mint-50 text-mint-600'
      : 'border-amber-500 bg-amber-50 text-amber-600';
  const btn = tone === 'mint' ? 'bg-mint-500 hover:bg-mint-600' : 'bg-amber-500 hover:bg-amber-600';
  return (
    /* 🔴 파닉스 상자와 같은 이유로 뷰포트 폭 — 뷰어·게임이 `vw`/`dvh` 로 크기를 잡는다. */
    <div
      className={`my-7 overflow-hidden border-y bg-white shadow-sm sm:rounded-[26px] sm:border-x ${
        tone === 'mint' ? 'border-mint-200' : 'border-amber-200'
      }`}
      style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-3">
        <span className="text-sm font-bold text-ink-800 break-keep">{label}</span>
        <span className="shrink-0 rounded-full bg-ink-50 px-3 py-1 text-[11px] font-bold text-ink-500">
          실제 앱 화면
        </span>
      </div>

      {/* 카테고리 칩 — 가로 스크롤(모바일에서 아홉 개가 한 줄에 안 들어간다) */}
      <div className="flex gap-2 overflow-x-auto border-b border-ink-100 px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {books.map((b) => (
          <button
            key={b.id}
            onClick={() => setBookId(b.id)}
            className={`min-h-[36px] shrink-0 rounded-full border px-3 text-xs font-semibold transition ${
              b.id === bookId ? chipOn : 'border-ink-100 text-ink-500 hover:bg-cream-50'
            }`}
          >
            {b.cat}
          </button>
        ))}
      </div>

      {children}

      <div className="flex flex-col items-center gap-2 bg-cream-50 px-5 py-4 text-center">
        <p className="text-xs text-ink-500 break-keep">{footer}</p>
        <Link
          to="/library"
          className={`rounded-full px-5 py-2 text-sm font-bold text-white shadow-sm transition ${btn}`}
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
      <div
        className="relative w-full overflow-hidden bg-cream-50"
        /**
         * 🔴 **높이를 정하지 않고 뷰포트에 맞춘다.** 뷰어 안쪽이 `100dvh` 라 상자를 620 으로
         *    두면 아래 232px 가 그냥 잘린다(실측). 낮추는 대신 맞춘다.
         */
        style={{ height: '100dvh', transform: 'translateZ(0)' }}
      >
        {/* 🔴 `key` 로 remount — 책을 바꾸면 뷰어 내부 상태(페이지·재생)가 남으면 안 된다. */}
        <ViewerContainer key={bookId} storybookId={bookId} />
      </div>
    </TryItShell>
  );
}

/** 🎮 낱말 게임 — 핵심단어가 있는 책만(0 인 책은 게임판이 비어 있다). */
export function HangulWordGameTryIt() {
  const books = BOOKS_BY_CATEGORY.filter((b) => b.words > 0);
  const [bookId, setBookId] = useState(books[0].id);
  const picked = books.find((b) => b.id === bookId) ?? books[0];

  const book = useStorybook(bookId).data as Storybook | undefined;
  /** 🔴 책이 오기 전엔 만들지 않는다 — 빈 단원을 넘기면 게임 카드가 0개로 뜬다. */
  const unit = useMemo(() => (book ? deriveStorybookUnit(book) : null), [book]);

  return (
    <TryItShell
      tone="amber"
      label={`🎮 낱말 게임 · 「${picked.title}」에 나온 낱말 ${picked.words}개`}
      books={books}
      bookId={bookId}
      setBookId={setBookId}
      footer="그 책에 나온 낱말로 바로 게임합니다 — 책마다 낱말이 다릅니다."
    >
      <div
        className="relative w-full overflow-hidden bg-cream-50"
        style={{ height: '100dvh', transform: 'translateZ(0)' }}
      >
        {unit && book ? (
          <div className="h-full overflow-y-auto px-4 py-4">
            <VocabularyStudyContent key={bookId} unit={unit} storybook={book} lang="ko" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-400">
            불러오는 중…
          </div>
        )}
      </div>
    </TryItShell>
  );
}
