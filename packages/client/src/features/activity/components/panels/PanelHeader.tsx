import type { ReactNode } from 'react';

/** 세 패널(색칠·숨은그림·워크지)이 공유하는 헤더 — 제목 + 온라인으로 하기 + 인쇄. */
export const BTN =
  'inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-extrabold shadow-sm print:hidden';

export function PanelHeader({
  title,
  onPlay,
  onPrint,
  playLabel = '🎮 온라인으로 하기',
  extra,
}: {
  title: string;
  onPlay: () => void;
  onPrint: () => void;
  playLabel?: string;
  /** 인쇄 옆에 붙는 버튼(색칠책 인쇄 등). */
  extra?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
      <h1 className="mr-auto font-display text-2xl font-extrabold text-ink-900 break-keep sm:text-3xl">
        {title}
      </h1>
      <button onClick={onPlay} className={`${BTN} bg-mint-500 text-white hover:bg-mint-600`}>
        {playLabel}
      </button>
      <button onClick={onPrint} className={`${BTN} bg-white text-ink-700 hover:bg-peach-100`}>
        🖨 인쇄
      </button>
      {extra}
    </div>
  );
}
