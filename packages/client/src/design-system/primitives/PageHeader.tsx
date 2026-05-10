import type { ReactNode } from 'react';

/**
 * 학습자 화면 공용 헤더 — 둥둥 떠있는 흰 wash 카드 (시안 톤).
 *
 * 좌: ← 뒤로 가기 (peach pill, 게임 헤더와 동일 스타일).
 * 가운데/우측: children/right slot 으로 자유.
 *
 * 사용처: BookDetailPage / VocabularyStudyPage / 그 외 학습자 페이지.
 * **메인 페이지 (LibraryPage)** 와 **게임 화면 (GameHeader)** 은 별도 패턴 유지.
 */
interface PageHeaderProps {
  /** 뒤로 가기 콜백. */
  onBack: () => void;
  /** 뒤로 버튼 라벨. 기본 "뒤로 가기". */
  backLabel?: string;
  /** 가운데 슬롯 (책 제목 등). */
  children?: ReactNode;
  /** 우측 슬롯 (언어 토글, 그림체 chip 등). 좌 버튼과 균형 맞추기 위해 너비 비슷하게 권장. */
  right?: ReactNode;
}

export function PageHeader({ onBack, backLabel = '뒤로 가기', children, right }: PageHeaderProps) {
  return (
    <header className="h-20 lg:h-24 flex items-center justify-between gap-4 shrink-0 bg-white/60 backdrop-blur-sm shadow-soft rounded-3xl px-6 mx-2 mt-2">
      <button
        onClick={onBack}
        className="px-6 py-3 rounded-full bg-peach-100 text-ink-900 font-black text-xl shadow-soft hover:shadow-pop transition flex items-center gap-2"
      >
        <span>←</span>
        <span>{backLabel}</span>
      </button>

      <div className="flex-1 flex items-center justify-center min-w-0 text-3xl lg:text-4xl font-black font-display text-ink-900 truncate">
        {children}
      </div>

      <div className="flex items-center justify-end shrink-0">{right}</div>
    </header>
  );
}
