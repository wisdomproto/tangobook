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
  /** 라이브러리 첫 섹션인가 — 앞 표지 두 장만 프리렌더에 src 를 남긴다. */
  first?: boolean;
  /** 타이틀 오른쪽(권수 배지 옆) 커스텀 노드 — 예: 세계명작 그림풍 선택기 */
  headerExtra?: ReactNode;
  /** 'paper' = 종이톤 밴드. 표지 자체가 밝은 크림인 라인(전래 동화)이 배경에 녹는 걸 막는다. */
  tone?: 'paper';
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
  tone,
  first = false,
}: CategorySectionProps) {
  const { t } = useTranslation('library');
  const visible = books.slice(0, limit);
  const hasMore = books.length > limit;
  return (
    <section
      className={
        tone === 'paper'
          ? // 🔴 종이톤 밴드 — 점눈이 그림체(전래 동화)는 표지 배경이 **밝은 크림 종이**라
            // 페이지 그라데이션(cream-50 → peach-100)에 녹는다. 표지를 다시 굽는 대신
            // 그 줄만 결이 다른 밴드로 감싸 "이 라인은 다른 결"을 의도로 만든다.
            // 좌우 음수 마진은 안쪽 행(-mx-4 px-4)이 상쇄하므로 표지 시작 위치는 그대로다.
            'mb-6 sm:mb-10 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5 md:-mx-8 md:px-8 bg-cream-100/70'
          : 'mb-6 sm:mb-10'
      }
    >
      <header className="flex flex-wrap items-center justify-between mb-3 sm:mb-4 px-1 gap-2">
        <h2 className="text-xl sm:text-3xl font-black text-ink-900 font-display flex items-center gap-2 sm:gap-3 min-w-0 truncate">
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </h2>
        <div className="flex min-w-0 max-w-full items-center gap-2 flex-wrap justify-end">
          {headerExtra}
          {/* 🔴 375px 에선 권수 배지를 숨긴다 — 제목(172) + 우측 그룹(179) = 351px 이 행 폭
              343px 을 8px 넘겨 헤더가 두 줄로 깨졌고, 카테고리 12개가 각각 40px 씩 세로를
              헛되이 먹었다(첫 표지가 화면 84% 지점에서야 나오던 원인 중 하나). 권수는
              「더 보기 (N권)」 과 표지 자체가 대신 말해 준다. */}
          <span className="hidden shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-ink-700 shadow-soft sm:inline-block sm:px-3.5 sm:py-1.5 sm:text-base">
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
          343px 라 카드 2장에 gap 만 넣어도 3번째가 1px 차로 밖으로 밀려 peek 이 0).
          🔴 표지는 **16:9 가로형**이라 카드가 좁으면 세로 화면에서 납작한 띠가 된다(w-40 = 160×90px).
          375px 에서 표지가 첫 화면의 12% 밖에 못 차지해 "책장"으로 안 보였다 → w-56(224×126px).
          한 줄에 1.7장이라 peek(143px)은 오히려 더 확실하다. 되돌리기 전에 375px 로 재 볼 것. */}
      <div
        role="region"
        aria-label={title}
        className="flex gap-2 sm:gap-5 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.map((b, i) => (
          <div key={b.id} className="shrink-0 w-56 lg:w-64">
            {/* 행에서 곧바로 보이는 앞 3장은 eager — 가로 스크롤 행 안에서 lazy 가 트리거되지
                않아 행이 통째로 비는 일이 있었다. 나머지는 lazy(가로로 밀어야 보이는 카드). */}
            {/* 🔴 `priority` 는 **첫 섹션 앞 2장만** — 프리렌더에 src 가 남는 건 이것뿐이라
                14개 섹션이 다 붙으면 42장이 첫 화면 회선을 나눠 갖는다. */}
            <BookCard book={b} eager={i < 3} priority={first === true && i < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
