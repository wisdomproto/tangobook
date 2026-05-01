import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ChipVariant = 'coral' | 'warn' | 'success' | 'ink';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 활성 상태 — 색깔 + shadow 강조 */
  active?: boolean;
  /** 활성 색상 토큰. 비활성은 모두 흰색 베이스. */
  variant?: ChipVariant;
  /** 좌측 아이콘 (이모지 또는 ReactNode) */
  icon?: ReactNode;
  /** 우측 trailing 요소 — 보통 카운트. 활성 시 흰글자, 비활성 시 회색. */
  trailing?: ReactNode;
}

const ACTIVE_CLASS: Record<ChipVariant, string> = {
  coral: 'bg-coral-500 text-white',
  warn: 'bg-warn text-ink-900',
  success: 'bg-success text-white',
  ink: 'bg-ink-900 text-white',
};

const IDLE_HOVER_CLASS: Record<ChipVariant, string> = {
  coral: 'hover:bg-peach-100',
  warn: 'hover:bg-warn/20',
  success: 'hover:bg-success/10',
  ink: 'hover:bg-peach-100',
};

/**
 * 라이브러리 카테고리/필터/탭 chip — pill 형태의 작은 토글 버튼.
 * - 라이브러리 카테고리 (variant="coral")
 * - 읽는 중 필터 (variant="warn")
 * - 파닉스 한/영 (variant="success")
 * - "전체" (variant="ink")
 *
 * Button 컴포넌트보다 작은 크기 (px-4 py-1.5, min-h 없음) — 작은 chip 전용.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active = false, variant = 'coral', icon, trailing, className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap shrink-0 transition-all inline-flex items-center gap-1.5',
        active
          ? `${ACTIVE_CLASS[variant]} shadow-soft`
          : `bg-white text-ink-700 ${IDLE_HOVER_CLASS[variant]}`,
        className
      )}
      {...rest}
    >
      {icon && <span className="leading-none">{icon}</span>}
      <span>{children}</span>
      {trailing != null && (
        <span className={active ? 'opacity-80' : 'text-ink-500'}>{trailing}</span>
      )}
    </button>
  );
});
