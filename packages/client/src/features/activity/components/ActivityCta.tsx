import { Link } from 'react-router-dom';
import { type ActivityItem, type ActivityKind } from '@tangobook/shared';
import { trackActivity } from '../lib/track';

const NEXT_LABEL: Record<ActivityKind, string> = {
  coloring: '다음 도안',
  'hidden-object': '다음 그림',
  hangul: '다음 단원',
  english: '다음 단원',
};

/**
 * 다음 활동 링크. 🔴 사이트로 가는 버튼(앱에서 이어 하기·둘러보기)은 **헤더로 올렸다**(2026-09-15 사용자) —
 * 활동 아래에 크게 두 번 붙어 있어 광고처럼 보였다. 헤더 = 로고 + 둘러보기(`ActivityLayout`).
 */
export function ActivityCta({ item, next }: { item: ActivityItem; next?: ActivityItem | null }) {
  if (!next) return null;
  return (
    <div className="flex justify-end print:hidden">
      <Link
        to={next.path}
        onClick={() =>
          trackActivity('activity_cta', { kind: item.kind, key: item.key, target: 'next' })
        }
        className="inline-flex min-h-[44px] items-center text-sm font-bold text-ink-700 underline-offset-4 hover:underline"
      >
        {next.key === item.key ? '다음' : NEXT_LABEL[item.kind]}: {next.title} →
      </Link>
    </div>
  );
}
