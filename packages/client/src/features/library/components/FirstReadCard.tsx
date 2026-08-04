import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { BookCover } from '@/design-system/primitives/BookCover';

/**
 * 첫 방문자에게만 뜨는 **한 권 진입점**.
 *
 * 🔴 왜 만들었나(2026-08-02): 라이브러리까지 와서 **아무것도 안 누르고 나가는** 사람이 많다.
 *    375px 첫 화면을 실측해 보니 원인이 뚜렷했다 —
 *    ① 첫 표지가 **424px 지점**에서야 나온다(그 위는 전부 헤더·묶어 보기·검색·카테고리 칩),
 *    ② 화면에서 가장 강조된 버튼 둘이 **「홈에 설치」·「로그인/회원가입」** 즉 콘텐츠가 아니라 계정,
 *    ③ 표지 어디에도 **「누르면 읽어줍니다」**라는 신호가 없다. 표지는 그냥 그림으로 보인다.
 *    → 튜토리얼 화면을 하나 더 쌓는 대신, **누를 것 하나를 맨 위에** 둔다.
 *
 * 🔴 한 번 열면 다시 안 뜬다(`SEEN_KEY`). 이건 「처음 한 번」을 넘기기 위한 장치라서,
 *    계속 떠 있으면 자기 자리를 차지하는 배너가 하나 더 느는 것뿐이다.
 * 🔴 **무료로 열리는 책만 쓴다** — 게스트 창이 끝난 사람에게 잠긴 책을 들이밀면
 *    첫 클릭이 곧바로 잠금 화면이 된다. 백설공주는 미로그인도 열리는 세 권 중 하나다.
 */
const FIRST_BOOK_ID = '1778555233699'; // 백설공주 — 무료 공개 + 나레이션 완비
const SEEN_KEY = 'tb-first-read-seen';

export function FirstReadCard() {
  const { t } = useTranslation('library');
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      return false; // 저장소가 막힌 브라우저 — 안 뜨는 것보다 뜨는 게 낫다
    }
  });
  const { data: book } = useStorybook(hidden ? undefined : FIRST_BOOK_ID);

  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* 저장 실패해도 이번 세션에서는 닫힌다 */
    }
  };

  if (hidden || !book) return null;

  return (
    <section className="mb-5 overflow-hidden rounded-3xl border border-coral-200 bg-white/80 shadow-sm">
      <div className="flex items-center gap-3 p-3 sm:gap-5 sm:p-5">
        {/* 표지 — 누르는 대상이 무엇인지 그림으로 먼저 말한다 */}
        <button
          onClick={() => {
            close();
            navigate(`/viewer/${FIRST_BOOK_ID}`);
          }}
          className="w-32 shrink-0 sm:w-48"
          aria-label={t('firstRead.cta')}
        >
          <BookCover book={book} lang="ko" loading="eager" className="rounded-xl" />
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-extrabold text-ink-900 break-keep sm:text-xl">
            {t('firstRead.title')}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-600 break-keep sm:text-sm">
            {t('firstRead.body')}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                close();
                navigate(`/viewer/${FIRST_BOOK_ID}`);
              }}
              className="inline-flex min-h-[44px] items-center rounded-full bg-coral-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600"
            >
              {t('firstRead.cta')}
            </button>
            <button
              onClick={close}
              className="min-h-[44px] px-2 text-xs font-semibold text-ink-400 underline"
            >
              {t('firstRead.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
