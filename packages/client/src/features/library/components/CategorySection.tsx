import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BookCard } from './BookCard';
import type { BookIndexEntry } from '@tangobook/shared';

interface CategorySectionProps {
  /** 이모지 string 또는 AppIcon 등 ReactNode */
  icon: ReactNode;
  title: string;
  books: BookIndexEntry[];
  limit?: number;
  onShowMore?: () => void;
  /** 타이틀 오른쪽(권수 배지 옆) 커스텀 노드 — 예: 세계명작 그림풍 선택기 */
  headerExtra?: ReactNode;
}

/** 카테고리 행 — 넷플릭스식 가로 캐러셀.
 *  세로 그리드 시절엔 카테고리당 ~900px 라 12개 = 약 14화면 스크롤이었고, 하위 카테고리
 *  (우주 6권·우리 몸 3권)는 사실상 도달 불가였다. 가로 행으로 카테고리당 ~240px 로 줄여
 *  전 카테고리를 3~4화면 안에 노출한다. 우측 카드가 살짝 잘려 보이는 peek 이 "더 있다"는
 *  신호라, 카드 폭은 뷰포트 폭에 딱 나눠떨어지지 않게 잡는다. */
export function CategorySection({
  icon,
  title,
  books,
  limit = 8,
  onShowMore,
  headerExtra,
}: CategorySectionProps) {
  const { t } = useTranslation('library');
  const visible = books.slice(0, limit);
  const hasMore = books.length > limit;
  return (
    <section className="mb-6 sm:mb-10">
      <header className="flex flex-wrap items-center justify-between mb-3 sm:mb-4 px-1 gap-2">
        <h2 className="text-xl sm:text-3xl font-black text-ink-900 font-display flex items-center gap-2 sm:gap-3 min-w-0 truncate">
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </h2>
        <div className="flex min-w-0 max-w-full items-center gap-2 flex-wrap justify-end">
          {headerExtra}
          <span className="shrink-0 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white shadow-soft text-xs sm:text-base text-ink-700 font-black">
            {t('section.bookCount', { count: books.length })}
          </span>
          {hasMore && onShowMore && (
            <button
              onClick={onShowMore}
              className="shrink-0 min-h-[44px] px-3 sm:px-4 rounded-full text-coral-600 font-black text-sm sm:text-base hover:bg-coral-100 transition-colors"
            >
              {t('section.showMore', { count: books.length - limit })} →
            </button>
          )}
        </div>
      </header>
      {/* 가로 스크롤 행. 스크롤바만 숨기고 스크롤 자체는 네이티브(터치·트랙패드·키보드) 유지.
          🔴 음수 마진으로 페이지 패딩(px-4/6/8)을 상쇄해 행만 화면 끝까지 흘린다 — 그래야
          좁은 화면에서 표지를 줄이지 않고도 다음 카드 peek 을 확보한다(패딩 안에 가두면
          343px 라 160px 카드 2장에 gap 만 넣어도 3번째가 1px 차로 밖으로 밀려 peek 이 0). */}
      <div
        role="region"
        aria-label={title}
        className="flex gap-2 sm:gap-5 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.map((b, i) => (
          <div key={b.id} className="shrink-0 w-40 sm:w-56 lg:w-64">
            {/* 행에서 곧바로 보이는 앞 3장은 eager — 가로 스크롤 행 안에서 lazy 가 트리거되지
                않아 행이 통째로 비는 일이 있었다. 나머지는 lazy(가로로 밀어야 보이는 카드). */}
            <BookCard book={b} eager={i < 3} />
          </div>
        ))}
      </div>
    </section>
  );
}
