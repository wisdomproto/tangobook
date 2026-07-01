/** 유료(프리미엄) 책 카드 위에 얹는 뱃지. 무료 책엔 표시 X.
 *  유아 브랜드 톤에 맞춰 "차단(자물쇠·다크)"이 아니라 "특별함(코랄·별)"으로 프레이밍. */
export function LockBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-coral-500 px-2.5 py-0.5 text-[11px] font-black text-white shadow-soft ${className}`}
      aria-label="프리미엄 콘텐츠"
    >
      ⭐ 특별한 책
    </span>
  );
}
