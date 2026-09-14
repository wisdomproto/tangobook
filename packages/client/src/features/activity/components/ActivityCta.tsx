import { Link } from 'react-router-dom';
import type { ActivityItem } from '@tangobook/shared';
import { trackActivity } from '../lib/track';

/** 사이트로 잇는 버튼 — 🔴 모든 활동 페이지에 둔다(유입이 목적, 사용자 2026-09-14). */
export function ActivityCta({ item, next }: { item: ActivityItem; next?: ActivityItem | null }) {
  const cta = () => trackActivity('activity_cta', { kind: item.kind, key: item.key });
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Link
        to={item.sourceHref}
        onClick={cta}
        className="inline-flex min-h-[48px] items-center rounded-full bg-coral-600 px-5 text-base font-extrabold text-white shadow hover:bg-coral-700"
      >
        {item.sourceLabel}
      </Link>
      <Link
        to="/"
        onClick={cta}
        className="inline-flex min-h-[48px] items-center rounded-full border-2 border-coral-300 bg-white px-5 text-base font-bold text-coral-700 hover:bg-coral-50"
      >
        탱고북 둘러보기
      </Link>
      {next && (
        <Link
          to={next.path}
          className="ml-auto text-sm font-bold text-ink-700 underline-offset-4 hover:underline"
        >
          다음 도안: {next.title} →
        </Link>
      )}
    </div>
  );
}
