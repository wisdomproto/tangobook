import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { canReadBook, type BookIndexEntry } from '@tangobook/shared';
import { BookCover } from '@/design-system';
import { useAccess, LockBadge } from '@/features/access';
import { useReadingStatus } from '../hooks/useReadingStatus';
import { BookProgressBadge } from './BookProgressBadge';

interface BookCardProps {
  book: BookIndexEntry;
  /** 행에서 처음부터 보이는 카드 — lazy 를 걸지 않고 바로 받는다(빈 행 방지). */
  eager?: boolean;
}

/** 책 카드 — 표지 한 장만. 카드 배경/패딩 X (reference 디자인).
 *  제목 캡션은 없앴다(2026-07-25) — 표지 이미지에 제목이 이미 그려져 있어 두 번 읽힌다.
 *  🔴 접근성 이름은 `BookCover` 의 `alt`(언어별 제목)가 유지하므로 sr-only 제목을 덧붙이지 않는다
 *  (덧붙이면 버튼 이름이 "제목 제목"으로 중복된다).
 *  표지는 책의 대표 그림체(defaultStyle)만 노출 — 그림체 선택은 BookDetailPage 에서. */
export function BookCard({ book, eager = false }: BookCardProps) {
  const { t, i18n } = useTranslation('library');
  const navigate = useNavigate();
  const { data: statusMap } = useReadingStatus();
  const status = statusMap?.get(book.id);
  // 프리미엄(잠금) 표시 — PAYWALL_ENABLED=false(개발단계)면 access 항상 entitled → 미표시.
  const access = useAccess();
  const locked = !canReadBook(book, access);
  // "무료" 뱃지 — 잠금이 실제 작동할 때(!isEntitled)만, 무료책(isAccessibleForFree!==false:
  // 신데렐라·인어공주·백설공주)에. 게스트가 잠긴 책들 사이에서 읽을 수 있는 책을 한눈에 찾게 함.
  const showFreeBadge = book.isAccessibleForFree !== false && !access.isEntitled;

  return (
    <button
      onClick={() => navigate(`/library/${book.id}`)}
      /* w-full 필수 — <button> 은 UA 기본이 shrink-to-fit 이라 제목 길이에 따라 카드 폭이
         제각각이 된다(grid 안에선 셀이 stretch 해줘 안 드러났지만 flex 캐러셀에선 드러남). */
      className="group flex w-full flex-col items-stretch text-left transition-transform hover:-translate-y-1 active:scale-95"
    >
      {/* 🔴 hairline ring 필수 — 전래 동화(점눈이 그림체)는 표지 배경이 **밝은 크림 종이**라
          페이지 배경(cream-50 → peach-100)에 녹아 카드 경계가 사라진다(세계 명작은 표지가
          어두워 안 드러났던 문제). `shadow-soft` 는 크림 위에서 거의 안 보인다. 어두운 표지엔
          링이 그림 가장자리에 묻혀 티가 안 나므로 전 카드에 걸어도 안전. */}
      <div className="aspect-video rounded-2xl overflow-hidden relative shadow-soft ring-1 ring-ink-200/70 group-hover:shadow-pop transition-shadow">
        <BookCover
          book={book}
          lang={i18n.language}
          overlayTitle={false}
          loading={eager ? 'eager' : 'lazy'}
          imgClassName="group-hover:scale-[1.02] transition-transform"
        />
        {status && status !== 'unread' && (
          <BookProgressBadge status={status} className="absolute top-2 right-2" />
        )}
        {showFreeBadge && (
          <span className="absolute top-2 left-2 rounded-full bg-coral-500 text-white text-xs font-black px-2.5 py-1 shadow-soft">
            {t('card.free')}
          </span>
        )}
        {locked && <LockBadge className="absolute top-2 left-2" />}
      </div>
    </button>
  );
}
