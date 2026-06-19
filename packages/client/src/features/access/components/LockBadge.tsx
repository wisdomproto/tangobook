/** 유료(프리미엄) 책 카드 위에 얹는 잠금 뱃지. 무료 책엔 표시 X. */
export function LockBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm ${className}`}
      aria-label="프리미엄 콘텐츠"
    >
      🔒 프리미엄
    </span>
  );
}
