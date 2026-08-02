import { useMemo, useState } from 'react';
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
 * 🔴 **한 번에 한 권만 마운트한다.** 카테고리가 13개라 전부 얹으면 책 13권치 삽화·나레이션을
 *    한꺼번에 받는다(권당 14쪽). 칩으로 고르면 그 권만 뜬다 — 13권을 다 들려주면서도 무게는 한 권.
 * 🔴 `transform` 으로 상자에 가둔다 — 뷰어는 전체화면(`fixed`)이라 그냥 얹으면 랜딩을 덮는다.
 *    변환된 조상이 `fixed` 의 컨테이닝 블록이 되는 성질을 쓴다(파닉스 상자와 같은 처리).
 */

/**
 * 카테고리마다 대표 한 권 — 공개·나레이션 완비 책에서 골랐다(2026-08-01 실측).
 *
 * 🔴 `words` = 그 책의 `key_objects` 개수. **0 인 책은 낱말 게임이 통째로 비어 있다**
 *    (사용자 지적: "동화책 단어게임은 없네"). 호리 세 라인(생활동화·유치원·세상 탐험)이
 *    그렇다 — 대본은 있는데 핵심단어를 아직 안 뽑았다. 데이터에 없는 걸 화면이 만들 수는
 *    없으므로 **그 카테고리에서는 게임 탭 자체를 감춘다**. 빈 게임판을 보여주는 것보다 낫다.
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

type Mode = 'read' | 'games';

export function HangulBookTryIt() {
  const [bookId, setBookId] = useState(BOOKS_BY_CATEGORY[0].id);
  const [mode, setMode] = useState<Mode>('read');
  const picked = BOOKS_BY_CATEGORY.find((b) => b.id === bookId) ?? BOOKS_BY_CATEGORY[0];
  /** 낱말이 없는 책이면 게임 탭을 숨기고, 읽어주기로 되돌린다. */
  const hasGames = picked.words > 0;
  const view: Mode = hasGames ? mode : 'read';

  const book = useStorybook(bookId).data as Storybook | undefined;
  /** 🔴 책이 오기 전엔 만들지 않는다 — 빈 단원을 넘기면 게임 카드가 0개로 뜬다. */
  const unit = useMemo(() => (book ? deriveStorybookUnit(book) : null), [book]);

  return (
    /* 🔴 파닉스 상자와 같은 이유로 뷰포트 폭 — 뷰어·게임이 `vw`/`dvh` 로 크기를 잡는다. */
    <div
      className="my-7 overflow-hidden border-y border-mint-200 bg-white shadow-sm sm:rounded-[26px] sm:border-x"
      style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-3">
        <span className="text-sm font-bold text-ink-800 break-keep">
          📖 {picked.cat} · {picked.title}
        </span>
        {hasGames && (
          <div className="flex items-center gap-1 rounded-full border border-ink-100 p-0.5">
            {(
              [
                ['read', '읽어주기'],
                ['games', '낱말 게임'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`min-h-[36px] rounded-full px-4 text-xs font-bold transition ${
                  view === m ? 'bg-mint-500 text-white' : 'text-ink-500 hover:bg-mint-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 카테고리 칩 — 가로 스크롤(모바일에서 아홉 개가 한 줄에 안 들어간다) */}
      <div className="flex gap-2 overflow-x-auto border-b border-ink-100 px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BOOKS_BY_CATEGORY.map((b) => (
          <button
            key={b.id}
            onClick={() => setBookId(b.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              b.id === bookId
                ? 'border-mint-500 bg-mint-50 text-mint-600'
                : 'border-ink-100 text-ink-500 hover:bg-cream-50'
            }`}
          >
            {b.cat}
          </button>
        ))}
      </div>

      <div
        className="relative w-full overflow-hidden bg-cream-50"
        /**
         * 🔴 **높이를 정하지 않고 뷰포트에 맞춘다.** 뷰어(`ViewerContainer`)도 낱말 게임도
         *    안쪽이 `100dvh` 라, 상자를 620 으로 두면 아래 232px 가 그냥 잘린다(실측).
         *    파닉스 게임 상자와 같은 처리 — 낮추는 대신 맞춘다.
         */
        style={{ height: '100dvh', transform: 'translateZ(0)' }}
      >
        {view === 'read' ? (
          /* 🔴 `key` 로 remount — 책을 바꾸면 뷰어 내부 상태(페이지·재생)가 남으면 안 된다. */
          <ViewerContainer key={bookId} storybookId={bookId} />
        ) : unit && book ? (
          <div className="h-full overflow-y-auto px-4 py-4">
            <VocabularyStudyContent key={bookId} unit={unit} storybook={book} lang="ko" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-400">
            불러오는 중…
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 bg-cream-50 px-5 py-4 text-center">
        <p className="text-xs text-ink-500 break-keep">
          {view === 'read'
            ? '화면을 한 번 누르면 나레이션이 시작됩니다. 266권이 이렇게 읽힙니다.'
            : '이 책에 나온 낱말로 바로 게임합니다 — 책마다 다른 낱말입니다.'}
        </p>
        <Link
          to="/library"
          className="rounded-full bg-mint-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-mint-600"
        >
          동화책 전체 보기 →
        </Link>
      </div>
    </div>
  );
}
